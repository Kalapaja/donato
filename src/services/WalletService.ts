import {
  type Address,
  type Chain as ViemChain,
  createWalletClient,
  custom,
  formatUnits,
  type TransactionRequest,
  type WalletClient,
} from "viem";
import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import type { AppKit } from "@reown/appkit";
import { BrowserProvider, type Eip1193Provider } from "ethers";

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
  private walletClient: WalletClient | null = null;
  private currentAccount: WalletAccount | null = null;
  private accountChangeCallbacks: Set<EventCallback<WalletAccount>> = new Set();
  private chainChangeCallbacks: Set<EventCallback<number>> = new Set();
  private disconnectCallbacks: Set<EventCallback<void>> = new Set();
  private initializedProjectId: string | null = null;

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

      // Create AppKit instance with Ethers adapter
      const ethersAdapter = new EthersAdapter();

      this.appKit = createAppKit({
        adapters: [ethersAdapter],
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
          url: typeof globalThis !== "undefined" && "location" in globalThis
            ? (globalThis as typeof window).location.origin
            : "https://example.com",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
        features: {
          analytics: true,
          email: false,
          socials: false,
          swaps: false,
          onramp: false,
          history: false,
          send: false
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

    // Track previous chainId to detect chain changes
    let previousChainId: number | null = null;

    // Subscribe to state changes
    this.appKit.subscribeState((state) => {
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
        const walletAccount: WalletAccount = { address, chainId };
        
        // Check if chain changed
        const chainChanged = previousChainId !== null && previousChainId !== chainId;
        
        this.currentAccount = walletAccount;
        this.notifyAccountChange(walletAccount);
        this.updateWalletClient(address, chainId);
        
        // Notify chain change if chain actually changed
        if (chainChanged) {
          this.notifyChainChange(chainId);
        }
        
        // Update previous chainId
        previousChainId = chainId;
      } else if (this.currentAccount) {
        this.currentAccount = null;
        this.walletClient = null;
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
   * Switch to a different network
   */
  async switchChain(chainId: number): Promise<void> {
    if (!this.appKit) {
      throw new Error("Wallet not connected");
    }

    try {
      // Find the chain configuration
      const chain = this.getViemChain(chainId);
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // Switch network using chainId (AppKit accepts number as caipNetworkId)
      await this.appKit.switchNetwork(
        chainId as unknown as Parameters<typeof this.appKit.switchNetwork>[0],
      );

      // Update wallet client with new chain
      if (this.currentAccount) {
        this.updateWalletClient(this.currentAccount.address, chainId);
      }
    } catch (error: unknown) {
      console.error("Failed to switch chain:", error);
      throw new Error(`Failed to switch to network ${chainId}`);
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
        !provider || typeof provider !== "object" || !("request" in provider)
      ) {
        throw new Error("Provider not available");
      }

      const ethProvider = provider as {
        request: (
          args: { method: string; params?: unknown[] },
        ) => Promise<unknown>;
      };

      // Native token (ETH, MATIC, etc.)
      if (
        token.address === "0x0000000000000000000000000000000000000000" ||
        token.address.toLowerCase() ===
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
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

      if (error instanceof Error && error.message?.includes("User rejected")) {
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

      if (error instanceof Error && error.message?.includes("User rejected")) {
        throw new Error("Message signing was rejected by user");
      }

      throw new Error("Failed to sign message. Please try again.");
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
      if (!provider || typeof provider !== "object" || !("request" in provider)) {
        throw new Error("Wallet provider not available");
      }

      const ethProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      };

      console.log("Sending transaction via eth_sendTransaction...");

      const hash = await ethProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: this.currentAccount.address,
          to: token.address,
          data: data, // Already has 0x prefix from functionSelector
        }],
      });

      console.log("Transaction sent, hash:", hash);
      return hash as string;
    } catch (error: unknown) {
      console.error("Failed to transfer token:", error);

      if (error instanceof Error && error.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected by user");
      }

      if (error instanceof Error && error.message?.includes("insufficient")) {
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
      if (!provider || typeof provider !== "object" || !("request" in provider)) {
        throw new Error("Wallet provider not available");
      }

      const ethProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      };

      // Convert amount to hex
      const valueHex = `0x${amount.toString(16)}`;

      console.log("Sending native transaction via eth_sendTransaction...");

      const hash = await ethProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: this.currentAccount.address,
          to: toAddress,
          value: valueHex,
        }],
      });

      console.log("Transaction sent, hash:", hash);
      return hash as string;
    } catch (error: unknown) {
      console.error("Failed to transfer native token:", error);

      if (error instanceof Error && error.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected by user");
      }

      if (error instanceof Error && error.message?.includes("insufficient")) {
        throw new Error("Insufficient balance");
      }

      throw new Error("Failed to transfer. Please try again.");
    }
  }

  /**
   * Check if a token address represents a native token
   */
  isNativeToken(tokenAddress: string): boolean {
    const normalizedAddress = tokenAddress.toLowerCase();
    return (
      normalizedAddress === "0x0000000000000000000000000000000000000000" ||
      normalizedAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    );
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
   * Get ethers signer (for LiFi SDK and other integrations)
   */
  getSigner(): unknown {
    if (!this.appKit) {
      return null;
    }

    try {
      const provider = this.appKit.getWalletProvider();
      if (!provider) {
        return null;
      }

      // Create ethers provider from EIP-1193 provider
      const ethersProvider = new BrowserProvider(provider as Eip1193Provider);

      // Return signer asynchronously
      return ethersProvider.getSigner();
    } catch (error) {
      console.error("Failed to get signer:", error);
      return null;
    }
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
