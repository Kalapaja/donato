import {
  type Address,
  type Chain as ViemChain,
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  formatUnits,
  http,
  type PublicClient,
  type TransactionRequest,
  type WalletClient,
} from "viem";
import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import { isNativeToken } from "../constants/tokens.ts";
import { isUserRejectionError, isInsufficientFundsError } from "../utils/errors.ts";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKit } from "@reown/appkit";
import {
  switchChain as wagmiSwitchChain,
  getWalletClient as wagmiGetWalletClient,
  type Config as WagmiConfig,
} from "@wagmi/core";

export interface WalletAccount {
  address: Address;
  chainId: number;
}

export interface Token {
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  priceUSD?: string;
}

type EventCallback<T> = (data: T) => void;

export class WalletService {
  private appKit: AppKit | null = null;
  private wagmiAdapter: WagmiAdapter | null = null;
  private wagmiConfig: WagmiConfig | null = null;
  private walletClient: WalletClient | null = null;
  private currentAccount: WalletAccount | null = null;
  private accountChangeCallbacks: Set<EventCallback<WalletAccount>> = new Set();
  private chainChangeCallbacks: Set<EventCallback<number>> = new Set();
  private disconnectCallbacks: Set<EventCallback<void>> = new Set();
  private initializedProjectId: string | null = null;
  private unsubscribeState: (() => void) | null = null;

  private readonly supportedChains: ViemChain[] = [
    mainnet,
    arbitrum,
    polygon,
    bsc,
    optimism,
    base,
  ];

  /**
   * Initialize Reown AppKit
   */
  init(projectId: string): void {
    if (!projectId) {
      throw new Error("Reown project ID is required");
    }

    // If already initialized with the same project ID, skip
    if (this.appKit && this.initializedProjectId === projectId) {
      return;
    }

    // If already initialized with a different project ID, disconnect first
    if (this.appKit && this.initializedProjectId !== projectId) {
      console.warn("Reown project ID changed. Reinitializing AppKit...");
      // Unsubscribe from state changes
      if (this.unsubscribeState) {
        this.unsubscribeState();
        this.unsubscribeState = null;
      }
      // Disconnect and clean up old instance
      this.appKit.disconnect().catch(() => {
        // Ignore errors during cleanup
      });
      this.appKit = null;
      this.walletClient = null;
      this.currentAccount = null;
    }

    try {
      // Prepare chain metadata in AppKit format
      // Each network needs id, chainId, name, currency, nativeCurrency, explorerUrl, and rpcUrls
      const networks = this.supportedChains.map((chain) => ({
        id: chain.id,
        chainId: chain.id,
        name: chain.name,
        currency: chain.nativeCurrency.symbol,
        nativeCurrency: chain.nativeCurrency,
        explorerUrl: chain.blockExplorers?.default?.url || "",
        rpcUrls: {
          default: {
            http: chain.rpcUrls.default.http,
          },
        },
      }));

      // Ensure we have at least one network
      if (networks.length === 0) {
        throw new Error("No networks configured");
      }

      // Create WagmiAdapter for proper chain switching support
      this.wagmiAdapter = new WagmiAdapter({
        projectId,
        networks: this.supportedChains,
      });
      this.wagmiConfig = this.wagmiAdapter.wagmiConfig;

      this.appKit = createAppKit({
        adapters: [this.wagmiAdapter],
        projectId,
        networks: networks as unknown as Parameters<
          typeof createAppKit
        >[0]["networks"],
        defaultNetwork: networks[0] as unknown as Parameters<
          typeof createAppKit
        >[0]["defaultNetwork"],
        metadata: {
          name: "Donation Widget",
          description:
            "Cryptocurrency donation widget with cross-chain support",
          url:
            typeof globalThis !== "undefined" && "location" in globalThis
              ? (globalThis as typeof window).location.origin
              : "https://example.com",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
        features: {
          analytics: false,
          email: false,
          socials: false,
          swaps: false,
          onramp: false,
          history: false,
          send: false,
        },
        themeVariables: {
          "--w3m-accent": "oklch(0% 0 0)",
        },
      });

      this.initializedProjectId = projectId;
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to initialize Reown AppKit:", error);
      this.initializedProjectId = null;
      throw new Error("Failed to initialize wallet connection");
    }
  }

  /**
   * Set up event listeners for AppKit events
   */
  private setupEventListeners(): void {
    if (!this.appKit) return;

    // Clean up previous subscription if exists
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }

    // Track previous state to detect actual changes
    let previousAddress: string | null = null;
    let previousChainId: number | null = null;

    // Subscribe to state changes and store unsubscribe function
    this.unsubscribeState = this.appKit.subscribeState((state) => {
      const account = state.selectedNetworkId
        ? this.appKit?.getAddress()
        : null;
      const caipNetworkId = state.selectedNetworkId;

      // Extract numeric chainId from CAIP network ID (e.g., "eip155:1" -> 1)
      let chainId: number | null = null;
      if (caipNetworkId) {
        const parts = caipNetworkId.split(":");
        if (parts.length === 2 && parts[0] === "eip155") {
          chainId = parseInt(parts[1], 10);
        }
      }

      if (account && chainId) {
        const address = account as Address;

        // Check if anything actually changed
        const addressChanged = previousAddress !== address;
        const chainChanged = previousChainId !== chainId;

        // Skip if nothing changed
        if (!addressChanged && !chainChanged) {
          return;
        }

        const walletAccount: WalletAccount = { address, chainId };
        this.currentAccount = walletAccount;

        // Only notify and update if something changed
        if (addressChanged || chainChanged) {
          this.notifyAccountChange(walletAccount);
        }

        if (chainChanged) {
          this.updateWalletClient(address, chainId);
          if (previousChainId !== null) {
            this.notifyChainChange(chainId);
          }
        }

        // Update previous state
        previousAddress = address;
        previousChainId = chainId;
      } else if (this.currentAccount) {
        this.currentAccount = null;
        this.walletClient = null;
        previousAddress = null;
        previousChainId = null;
        this.notifyDisconnect();
      }
    });
  }

  /**
   * Update wallet client with current provider
   */
  private updateWalletClient(address: Address, chainId: number): void {
    if (!this.appKit) return;

    try {
      const provider = this.appKit.getWalletProvider();
      if (provider && typeof provider === "object" && "request" in provider) {
        this.walletClient = createWalletClient({
          account: address,
          chain: this.getViemChain(chainId),
          transport: custom(provider as Parameters<typeof custom>[0]),
        });
      }
    } catch (error) {
      console.error("Failed to update wallet client:", error);
    }
  }

  /**
   * Connect wallet using Reown AppKit
   */
  async connect(): Promise<WalletAccount> {
    if (!this.appKit) {
      throw new Error("Reown AppKit not initialized. Call init() first.");
    }

    try {
      // Open the AppKit modal
      await this.appKit.open();

      // Get current connection state
      const address = this.appKit.getAddress();
      const caipNetwork = this.appKit.getCaipNetwork();

      // Extract numeric chainId from CAIP network ID
      let chainId: number | null = null;
      if (caipNetwork?.id) {
        const networkId = String(caipNetwork.id);
        const parts = networkId.split(":");
        if (parts.length === 2 && parts[0] === "eip155") {
          chainId = parseInt(parts[1], 10);
        }
      }

      if (!address || !chainId) {
        throw new Error("No account connected");
      }

      const walletAccount: WalletAccount = {
        address: address as Address,
        chainId,
      };
      this.currentAccount = walletAccount;
      this.updateWalletClient(address as Address, chainId);

      return walletAccount;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw new Error("Failed to connect wallet. Please try again.");
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.appKit) {
      await this.appKit.disconnect();
    }
    this.currentAccount = null;
    this.walletClient = null;
    this.notifyDisconnect();
  }

  /**
   * Get current account information
   */
  getAccount(): { address: Address | null; chainId: number | null } {
    if (!this.currentAccount) {
      return { address: null, chainId: null };
    }
    return {
      address: this.currentAccount.address,
      chainId: this.currentAccount.chainId,
    };
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.currentAccount !== null;
  }

  /**
   * Get a wallet client configured for a specific chain.
   * Call this after switchChain to get a fresh client for the target chain.
   */
  getWalletClientForChain(chainId: number): WalletClient | null {
    if (!this.appKit || !this.currentAccount) {
      return null;
    }

    try {
      const provider = this.appKit.getWalletProvider();
      if (
        !provider ||
        typeof provider !== "object" ||
        !("request" in provider)
      ) {
        return null;
      }

      const chain = this.getViemChain(chainId);
      if (!chain) {
        return null;
      }

      return createWalletClient({
        account: this.currentAccount.address,
        chain,
        transport: custom(provider as Parameters<typeof custom>[0]),
      });
    } catch (error) {
      console.error(
        "Failed to create wallet client for chain:",
        chainId,
        error,
      );
      return null;
    }
  }

  /**
   * Switch to a different network and wait for the switch to complete
   * Uses wagmi's switchChain for proper integration with AppKit state
   */
  async switchChain(chainId: number): Promise<void> {
    if (!this.wagmiConfig) {
      throw new Error("Wallet not connected");
    }

    // Check if already on the target chain
    const currentChainId = this.getAccount()?.chainId;
    if (currentChainId === chainId) {
      console.log(`Already on chain ${chainId}, skipping switch`);
      return;
    }

    try {
      // Find the chain configuration
      const chain = this.getViemChain(chainId);
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      console.log(
        `Switching from chain ${currentChainId} to ${chainId} via wagmi...`,
      );

      // Use wagmi's switchChain which properly waits for the switch to complete
      // and updates the internal state
      await wagmiSwitchChain(this.wagmiConfig, { chainId });

      console.log(`Successfully switched to chain ${chainId}`);

      // Update internal state after successful switch
      if (this.currentAccount) {
        this.currentAccount = { ...this.currentAccount, chainId };
        this.updateWalletClient(this.currentAccount.address, chainId);
      }
    } catch (error: unknown) {
      console.error("Failed to switch chain:", error);

      // Check for user rejection
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        ((error as { code: number }).code === 4001 ||
          (error as { code: number }).code === -32000)
      ) {
        throw new Error("Chain switch was rejected by user");
      }

      throw new Error(`Failed to switch to network ${chainId}`);
    }
  }

  /**
   * Get a wagmi wallet client for a specific chain (async version)
   * This uses wagmi's getWalletClient which properly handles chain-specific clients
   */
  async getWalletClientForChainAsync(
    chainId: number,
  ): Promise<WalletClient | null> {
    if (!this.wagmiConfig) {
      console.error("wagmiConfig not available");
      return null;
    }

    try {
      const client = await wagmiGetWalletClient(this.wagmiConfig, { chainId });
      return client as WalletClient;
    } catch (error) {
      console.error("Failed to get wallet client for chain:", chainId, error);
      return null;
    }
  }


  /**
   * Get token balance for an address
   */
  async getBalance(token: Token, address: Address): Promise<bigint> {
    if (!this.appKit) {
      throw new Error("Wallet not connected");
    }

    try {
      const provider = this.appKit.getWalletProvider();
      if (
        !provider ||
        typeof provider !== "object" ||
        !("request" in provider)
      ) {
        throw new Error("Provider not available");
      }

      const ethProvider = provider as {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };

      // Native token (ETH, MATIC, etc.)
      if (this.isNativeToken(token.address)) {
        const balance = await ethProvider.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        return BigInt(balance as string);
      }

      // ERC20 token
      const data = `0x70a08231000000000000000000000000${address.slice(2)}`;
      const balance = await ethProvider.request({
        method: "eth_call",
        params: [
          {
            to: token.address,
            data,
          },
          "latest",
        ],
      });
      return BigInt(balance as string);
    } catch (error) {
      console.error("Failed to get balance:", error);
      return BigInt(0);
    }
  }

  /**
   * Get a public client for a specific chain
   */
  private getPublicClient(chainId: number): PublicClient | null {
    const chain = this.getViemChain(chainId);
    if (!chain) {
      return null;
    }

    return createPublicClient({
      chain,
      transport: http(),
    });
  }

  /**
   * Get multiple token balances in a single RPC call using viem's multicall
   * @param tokens - Array of tokens to get balances for
   * @param address - Wallet address
   * @returns Map of token address (lowercase) to balance
   */
  async getBalancesBatch(
    tokens: Token[],
    address: Address,
  ): Promise<Map<string, bigint>> {
    const results = new Map<string, bigint>();

    if (tokens.length === 0) {
      return results;
    }

    // Get chainId from the first token (all tokens should be on the same chain)
    const chainId = tokens[0].chainId;
    const publicClient = this.getPublicClient(chainId);

    if (!publicClient) {
      console.error("Failed to create public client for chain:", chainId);
      return results;
    }

    // Separate native and ERC20 tokens
    const nativeTokens = tokens.filter((t) => this.isNativeToken(t.address));
    const erc20Tokens = tokens.filter((t) => !this.isNativeToken(t.address));

    try {
      // Get native token balance
      if (nativeTokens.length > 0) {
        try {
          const nativeBalance = await publicClient.getBalance({ address });
          for (const token of nativeTokens) {
            results.set(token.address.toLowerCase(), nativeBalance);
          }
        } catch (error) {
          console.error("Failed to get native balance:", error);
          for (const token of nativeTokens) {
            results.set(token.address.toLowerCase(), BigInt(0));
          }
        }
      }

      // Get ERC20 balances via viem's multicall
      if (erc20Tokens.length > 0) {
        const contracts = erc20Tokens.map((token) => ({
          address: token.address as Address,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [address],
        }));

        const balanceResults = await publicClient.multicall({
          contracts,
          allowFailure: true,
        });

        for (let i = 0; i < erc20Tokens.length; i++) {
          const result = balanceResults[i];
          const balance =
            result.status === "success" ? (result.result as bigint) : BigInt(0);
          results.set(erc20Tokens[i].address.toLowerCase(), balance);
        }
      }

      return results;
    } catch (error) {
      console.error("Failed to get balances batch:", error);
      for (const token of tokens) {
        results.set(token.address.toLowerCase(), BigInt(0));
      }
      return results;
    }
  }

  /**
   * Get formatted balance as string
   */
  async getFormattedBalance(token: Token, address: Address): Promise<string> {
    const balance = await this.getBalance(token, address);
    return formatUnits(balance, token.decimals);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.walletClient || !this.currentAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const hash = await this.walletClient.sendTransaction({
        account: this.currentAccount.address,
        chain: this.walletClient.chain,
        to: tx.to as Address,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : undefined,
        gas: tx.gas ? BigInt(tx.gas) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
      });

      return hash;
    } catch (error: unknown) {
      console.error("Failed to send transaction:", error);

      if (error instanceof Error && isUserRejectionError(error)) {
        throw new Error("Transaction was rejected by user");
      }

      throw new Error("Failed to send transaction. Please try again.");
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.walletClient || !this.currentAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const signature = await this.walletClient.signMessage({
        account: this.currentAccount.address,
        message,
      });

      return signature;
    } catch (error: unknown) {
      console.error("Failed to sign message:", error);

      if (error instanceof Error && isUserRejectionError(error)) {
        throw new Error("Message signing was rejected by user");
      }

      throw new Error("Failed to sign message. Please try again.");
    }
  }

  /**
   * Sign EIP-712 typed data
   * @param domain - The EIP-712 domain
   * @param types - The type definitions
   * @param primaryType - The primary type name
   * @param message - The message data to sign
   * @returns The signature as a hex string
   */
  async signTypedData<
    TTypes extends Record<string, Array<{ name: string; type: string }>>,
    TPrimaryType extends keyof TTypes,
  >(
    params: {
      domain: {
        name?: string;
        version?: string;
        chainId?: number;
        verifyingContract?: Address;
        salt?: `0x${string}`;
      };
      types: TTypes;
      primaryType: TPrimaryType;
      message: Record<string, unknown>;
    },
    chainId?: number,
  ): Promise<`0x${string}`> {
    console.log("[WalletService] signTypedData called:", {
      chainId,
      hasCurrentAccount: !!this.currentAccount,
    });

    if (!this.currentAccount) {
      throw new Error("Wallet not connected");
    }

    // Get wallet client for specific chain if chainId is provided
    // Use async wagmi wallet client for proper chain-specific signing
    let walletClient: WalletClient | null;
    if (chainId) {
      walletClient = await this.getWalletClientForChainAsync(chainId);
    } else {
      walletClient = this.walletClient;
    }

    console.log("[WalletService] walletClient obtained:", {
      hasWalletClient: !!walletClient,
      chainId,
    });

    if (!walletClient) {
      throw new Error("Wallet client not available");
    }

    try {
      console.log("[WalletService] Requesting signature from wallet...");
      // Using type assertion to work around viem's strict EIP-712 typing
      // The types are validated at runtime by the wallet
      const signature = await walletClient.signTypedData({
        account: this.currentAccount.address,
        domain: params.domain,
        types: params.types,
        primaryType: params.primaryType,
        message: params.message,
        // deno-lint-ignore no-explicit-any
      } as any);

      return signature;
    } catch (error: unknown) {
      console.error("Failed to sign typed data:", error);

      if (error instanceof Error && isUserRejectionError(error)) {
        const rejectionError = new Error("Signature was rejected by user");
        (rejectionError as { code?: number }).code = 4001;
        throw rejectionError;
      }

      throw new Error("Failed to sign data. Please try again.");
    }
  }

  /**
   * Transfer ERC20 tokens directly to an address
   * @param token - The token to transfer
   * @param toAddress - Recipient address
   * @param amount - Amount in smallest unit (wei-like)
   * @returns Transaction hash
   */
  async transferToken(
    token: Token,
    toAddress: Address,
    amount: bigint,
  ): Promise<string> {
    if (!this.currentAccount) {
      throw new Error("Wallet not connected");
    }

    // Check if this is a native token transfer
    if (this.isNativeToken(token.address)) {
      return this.transferNative(toAddress, amount);
    }

    console.log("Starting ERC20 transfer:", {
      token: token.symbol,
      tokenAddress: token.address,
      to: toAddress,
      amount: amount.toString(),
    });

    try {
      // ERC20 transfer function selector: transfer(address,uint256) = 0xa9059cbb
      const functionSelector = "0xa9059cbb";

      // Encode the recipient address (32 bytes, left-padded)
      const encodedAddress = toAddress.slice(2).toLowerCase().padStart(64, "0");

      // Encode the amount (32 bytes, left-padded)
      const encodedAmount = amount.toString(16).padStart(64, "0");

      // Combine into calldata
      const data = `${functionSelector}${encodedAddress}${encodedAmount}`;

      console.log("Transaction data prepared:", {
        to: token.address,
        data: data.slice(0, 50) + "...",
        from: this.currentAccount.address,
      });

      // Use raw provider for better compatibility with Reown AppKit
      const provider = this.appKit?.getWalletProvider();
      if (
        !provider ||
        typeof provider !== "object" ||
        !("request" in provider)
      ) {
        throw new Error("Wallet provider not available");
      }

      const ethProvider = provider as {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };

      console.log("Sending transaction via eth_sendTransaction...");

      const hash = await ethProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: this.currentAccount.address,
            to: token.address,
            data: data, // Already has 0x prefix from functionSelector
          },
        ],
      });

      console.log("Transaction sent, hash:", hash);
      return hash as string;
    } catch (error: unknown) {
      console.error("Failed to transfer token:", error);

      if (error instanceof Error && isUserRejectionError(error)) {
        throw new Error("Transaction was rejected by user");
      }

      if (error instanceof Error && isInsufficientFundsError(error)) {
        throw new Error("Insufficient token balance");
      }

      throw new Error("Failed to transfer tokens. Please try again.");
    }
  }

  /**
   * Transfer native tokens (ETH, MATIC, BNB, etc.) directly to an address
   * @param toAddress - Recipient address
   * @param amount - Amount in wei
   * @returns Transaction hash
   */
  async transferNative(toAddress: Address, amount: bigint): Promise<string> {
    if (!this.currentAccount) {
      throw new Error("Wallet not connected");
    }

    console.log("Starting native transfer:", {
      to: toAddress,
      amount: amount.toString(),
    });

    try {
      // Use raw provider for better compatibility with Reown AppKit
      const provider = this.appKit?.getWalletProvider();
      if (
        !provider ||
        typeof provider !== "object" ||
        !("request" in provider)
      ) {
        throw new Error("Wallet provider not available");
      }

      const ethProvider = provider as {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };

      // Convert amount to hex
      const valueHex = `0x${amount.toString(16)}`;

      console.log("Sending native transaction via eth_sendTransaction...");

      const hash = await ethProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: this.currentAccount.address,
            to: toAddress,
            value: valueHex,
          },
        ],
      });

      console.log("Transaction sent, hash:", hash);
      return hash as string;
    } catch (error: unknown) {
      console.error("Failed to transfer native token:", error);

      if (error instanceof Error && isUserRejectionError(error)) {
        throw new Error("Transaction was rejected by user");
      }

      if (error instanceof Error && isInsufficientFundsError(error)) {
        throw new Error("Insufficient balance");
      }

      throw new Error("Failed to transfer. Please try again.");
    }
  }

  /**
   * Check if a token address represents a native token
   */
  isNativeToken(tokenAddress: string): boolean {
    return isNativeToken(tokenAddress);
  }

  /**
   * Subscribe to account changes
   */
  onAccountChanged(callback: EventCallback<WalletAccount>): () => void {
    this.accountChangeCallbacks.add(callback);
    return () => this.accountChangeCallbacks.delete(callback);
  }

  /**
   * Subscribe to chain changes
   */
  onChainChanged(callback: EventCallback<number>): () => void {
    this.chainChangeCallbacks.add(callback);
    return () => this.chainChangeCallbacks.delete(callback);
  }

  /**
   * Subscribe to disconnect events
   */
  onDisconnect(callback: EventCallback<void>): () => void {
    this.disconnectCallbacks.add(callback);
    return () => this.disconnectCallbacks.delete(callback);
  }

  /**
   * Notify all account change listeners
   */
  private notifyAccountChange(account: WalletAccount): void {
    this.accountChangeCallbacks.forEach((callback) => callback(account));
  }

  /**
   * Notify all chain change listeners
   */
  private notifyChainChange(chainId: number): void {
    this.chainChangeCallbacks.forEach((callback) => callback(chainId));
  }

  /**
   * Notify all disconnect listeners
   */
  private notifyDisconnect(): void {
    this.disconnectCallbacks.forEach((callback) => callback());
  }

  /**
   * Get Viem chain configuration by chain ID
   */
  private getViemChain(chainId: number): ViemChain | undefined {
    return this.supportedChains.find((chain) => chain.id === chainId);
  }

  /**
   * Get AppKit instance (for advanced usage)
   */
  getAppKit(): AppKit | null {
    return this.appKit;
  }

  /**
   * Get provider instance (for advanced usage)
   */
  getProvider(): unknown {
    return this.appKit?.getWalletProvider() || null;
  }

  /**
   * Get wallet client instance (for advanced usage)
   */
  getWalletClient(): WalletClient | null {
    return this.walletClient;
  }

  /**
   * Open the AppKit modal
   */
  async openModal(): Promise<void> {
    if (!this.appKit) {
      throw new Error("AppKit not initialized");
    }
    await this.appKit.open();
  }

  /**
   * Open the AppKit network selector modal
   */
  async openNetworkModal(): Promise<void> {
    if (!this.appKit) {
      throw new Error("AppKit not initialized");
    }
    // Open modal with networks view
    await this.appKit.open({ view: "Networks" });
  }

  /**
   * Close the AppKit modal
   */
  closeModal(): void {
    if (!this.appKit) {
      throw new Error("AppKit not initialized");
    }
    this.appKit.close();
  }

  /**
   * Set the theme mode for AppKit
   * @param mode - Theme mode: 'light' or 'dark'
   */
  setThemeMode(mode: "light" | "dark"): void {
    if (!this.appKit) {
      return;
    }

    try {
      this.appKit.setThemeMode(mode);
    } catch (error) {
      console.error("Failed to set AppKit theme mode:", error);
    }
  }
}
