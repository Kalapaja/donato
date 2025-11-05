import { SDK, NetworkEnum, PresetEnum } from "@1inch/cross-chain-sdk";
import type { WalletService, Token } from "./WalletService.ts";

// Re-export Token type from WalletService for compatibility
export type { Token } from "./WalletService.ts";

// Route type compatible with LiFi Route interface
export interface Route {
  fromChainId: number;
  toChainId: number;
  fromToken?: Token;
  toToken?: Token;
  fromAmount: string;
  toAmount: string;
  steps: RouteStep[];
  timestamp?: number;
}

export interface RouteStep {
  id: string;
  type: string;
  tool: string;
  action: {
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmount: string;
    fromChainId: number;
    toChainId: number;
  };
  estimate?: {
    gasCosts?: Array<{
      amount: string;
      amountUSD?: string;
    }>;
  };
}

export interface OneInchConfig {
  apiKey?: string;
  walletService: WalletService;
}

export interface QuoteParams {
  fromChain: number;
  fromToken: string;
  fromAddress: string;
  toChain: number;
  toToken: string;
  fromAmount?: string;
  toAmount?: string;
  toAddress: string;
}

export interface RouteCallbacks {
  onRouteUpdate?: (route: Route) => void;
  onStepUpdate?: (step: Route) => void;
}

export interface Chain {
  id: number;
  name: string;
  key: string;
  logoURI?: string;
  nativeToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Network ID mapping for 1inch SDK
const NETWORK_ID_MAP: Record<number, NetworkEnum> = {
  1: NetworkEnum.ETHEREUM,
  56: NetworkEnum.BINANCE,
  137: NetworkEnum.POLYGON,
  42161: NetworkEnum.ARBITRUM,
  10: NetworkEnum.OPTIMISM,
  8453: NetworkEnum.COINBASE, // Base network
};

const NETWORK_NAME_MAP: Record<number, string> = {
  1: "Ethereum",
  56: "BNB Chain",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
};

// Native token addresses
const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export class OneInchService {
  private walletService: WalletService;
  private apiKey?: string;
  private sdk: SDK | null = null;
  private chainsCache: CacheEntry<Chain[]> | null = null;
  private tokensCache: Map<string, CacheEntry<Token[]>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(config: OneInchConfig) {
    this.walletService = config.walletService;
    this.apiKey = config.apiKey;
  }

  /**
   * Initialize 1inch SDK
   */
  init(): void {
    try {
      // Initialize 1inch SDK
      // Note: 1inch SDK requires authKey for API access
      this.sdk = new SDK({
        url: "https://api.1inch.dev/fusion-plus",
        authKey: this.apiKey || "",
        // Note: blockchainProvider is only needed for creating orders
        // We'll handle wallet interactions separately via WalletService
      });
    } catch (error) {
      console.error("Failed to initialize 1inch SDK:", error);
      throw new Error("Failed to initialize cross-chain service");
    }
  }

  /**
   * Get quote for token swap with retry logic
   */
  async getQuote(params: QuoteParams): Promise<Route> {
    console.log("Getting quote with params:", params);

    if (!this.sdk) {
      throw new Error("1inch SDK not initialized. Call init() first.");
    }

    return await this.retryOperation(async () => {
      try {
        const fromNetwork = NETWORK_ID_MAP[params.fromChain];
        const toNetwork = NETWORK_ID_MAP[params.toChain];

        if (!fromNetwork || !toNetwork) {
          throw new Error(
            `Unsupported chain: ${params.fromChain} or ${params.toChain}`,
          );
        }

        // Normalize token addresses (handle native tokens)
        const fromTokenAddress =
          params.fromToken === "0x0000000000000000000000000000000000000000"
            ? NATIVE_TOKEN_ADDRESS
            : params.fromToken;
        const toTokenAddress =
          params.toToken === "0x0000000000000000000000000000000000000000"
            ? NATIVE_TOKEN_ADDRESS
            : params.toToken;

        // Get quote from 1inch
        // Cast NetworkEnum to SupportedChain to avoid type issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote = await this.sdk!.getQuote({
          amount: params.fromAmount || params.toAmount || "0",
          srcChainId: fromNetwork as unknown as number,
          dstChainId: toNetwork as unknown as number,
          enableEstimate: true,
          srcTokenAddress: fromTokenAddress,
          dstTokenAddress: toTokenAddress,
          walletAddress: params.fromAddress,
        });

        if (!quote || !quote.presets) {
          throw new Error("No route found for this swap");
        }

        // Get tokens info
        const fromToken = await this.getTokenInfo(params.fromChain, fromTokenAddress);
        const toToken = await this.getTokenInfo(params.toChain, toTokenAddress);

        // Convert 1inch quote to Route format
        // Use the fastest preset by default
        const preset = PresetEnum.fast;
        const presetData = quote.presets[preset];

        if (!presetData) {
          throw new Error("No route found for this swap");
        }

        // Extract amount from preset data (using type assertion to access properties safely)
        const presetDataAny = presetData as unknown as Record<string, unknown>;
        const quoteAny = quote as unknown as Record<string, unknown>;
        const toAmount = presetDataAny.dstTokenAmount || presetDataAny.amount || quoteAny.dstTokenAmount || "0";
        const estimatedGas = presetDataAny.estimatedGas || presetDataAny.gas || undefined;

        const route: Route = {
          fromChainId: params.fromChain,
          toChainId: params.toChain,
          fromToken: fromToken,
          toToken: toToken,
          fromAmount: params.fromAmount || "0",
          toAmount: String(toAmount),
          steps: [
            {
              id: "1inch-cross-chain",
              type: "cross-chain",
              tool: "1inch",
              action: {
                fromToken: fromToken || {
                  address: fromTokenAddress,
                  chainId: params.fromChain,
                  symbol: "UNKNOWN",
                  name: "Unknown Token",
                  decimals: 18,
                },
                toToken: toToken || {
                  address: toTokenAddress,
                  chainId: params.toChain,
                  symbol: "UNKNOWN",
                  name: "Unknown Token",
                  decimals: 18,
                },
                fromAmount: params.fromAmount || "0",
                toAmount: String(toAmount),
                fromChainId: params.fromChain,
                toChainId: params.toChain,
              },
              estimate: {
                gasCosts: estimatedGas
                  ? [
                      {
                        amount: String(estimatedGas),
                        amountUSD: undefined,
                      },
                    ]
                  : undefined,
              },
            },
          ],
          timestamp: Date.now(),
        };

        console.log("1inch quote response:", route);

        return route;
      } catch (error: unknown) {
        console.error("Failed to get quote:", error);

        if (
          error instanceof Error && error.message?.includes("No route found")
        ) {
          throw new Error("No route found. Try a different token or amount.");
        }

        if (
          error instanceof Error &&
          error.message?.includes("Insufficient liquidity")
        ) {
          throw new Error("Insufficient liquidity for this swap.");
        }

        throw new Error("Failed to calculate quote. Please try again.");
      }
    });
  }

  /**
   * Get multiple route options
   */
  async getRoutes(params: QuoteParams): Promise<Route[]> {
    if (!params.fromAmount) {
      throw new Error("fromAmount is required for getRoutes");
    }

    // 1inch SDK returns multiple presets in a single quote
    // We'll return routes for each preset
    const route = await this.getQuote(params);
    return [route]; // Return single route for now
  }

  /**
   * Execute route with callbacks
   */
  async executeRoute(route: Route, _callbacks?: RouteCallbacks): Promise<void> {
    // Validate wallet is connected
    const walletClient = this.walletService.getWalletClient();
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    if (!this.sdk) {
      throw new Error("1inch SDK not initialized");
    }

    // Validate route has steps
    if (!route.steps || route.steps.length === 0) {
      throw new Error("Invalid route: no steps found");
    }

    const account = this.walletService.getAccount();
    if (!account.address) {
      throw new Error("Wallet not connected");
    }

    console.log("Executing route with steps:", route.steps.length);
    console.log("Route details:", {
      fromChain: route.fromChainId,
      toChain: route.toChainId,
      fromToken: route.fromToken?.symbol,
      toToken: route.toToken?.symbol,
      fromAmount: route.fromAmount,
      toAmount: route.toAmount,
    });

    try {
      // Get fresh quote for execution
      const quoteParams: QuoteParams = {
        fromChain: route.fromChainId,
        fromToken: route.fromToken?.address || "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        fromAddress: account.address,
        toChain: route.toChainId,
        toToken: route.toToken?.address || "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        fromAmount: route.fromAmount,
        toAddress: account.address, // Will be updated to recipient in actual implementation
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quote = await this.sdk.getQuote({
        amount: route.fromAmount,
        srcChainId: NETWORK_ID_MAP[route.fromChainId]! as unknown as number,
        dstChainId: NETWORK_ID_MAP[route.toChainId]! as unknown as number,
        enableEstimate: true,
        srcTokenAddress: quoteParams.fromToken === "0x0000000000000000000000000000000000000000"
          ? NATIVE_TOKEN_ADDRESS
          : quoteParams.fromToken,
        dstTokenAddress: quoteParams.toToken === "0x0000000000000000000000000000000000000000"
          ? NATIVE_TOKEN_ADDRESS
          : quoteParams.toToken,
        walletAddress: account.address,
      });

      // Generate secrets for hash lock
      const preset = PresetEnum.fast;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _secrets = Array.from({ length: quote.presets[preset].secretsCount }).map(
        () => "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

      // For now, we'll use a simplified approach
      // In production, you'd need to implement the full hash lock mechanism
      // This is a placeholder that requires full SDK integration with wallet signing

      // Note: 1inch SDK requires blockchainProvider for creating orders
      // This is a simplified implementation - full integration would require
      // connecting the wallet provider to 1inch SDK's blockchainProvider interface

      // For now, throw an informative error
      throw new Error(
        "Full 1inch SDK integration requires blockchain provider setup. " +
        "This is a work in progress. Please use LiFi for now.",
      );
    } catch (error: unknown) {
      console.error("Failed to execute route:", error);

      if (error instanceof Error && error.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected by user");
      }

      if (
        error instanceof Error && error.message?.includes("Insufficient funds")
      ) {
        throw new Error("Insufficient balance to complete transaction");
      }

      if (
        error instanceof Error &&
        error.message?.includes("Gas estimation failed")
      ) {
        throw new Error(
          "Transaction would fail. Please check your balance and try again.",
        );
      }

      throw error instanceof Error
        ? error
        : new Error("Transaction failed. Please try again.");
    }
  }

  /**
   * Get supported chains with caching
   */
  async getChains(): Promise<Chain[]> {
    // Check cache
    if (
      this.chainsCache &&
      Date.now() - this.chainsCache.timestamp < this.CACHE_TTL
    ) {
      return this.chainsCache.data;
    }

    return await this.retryOperation(() => {
      try {
        // Return supported chains based on NETWORK_ID_MAP
        const chains: Chain[] = Object.entries(NETWORK_ID_MAP).map(
          ([id, _]) => {
            const chainId = parseInt(id);
            return {
              id: chainId,
              name: NETWORK_NAME_MAP[chainId] || `Chain ${chainId}`,
              key: NETWORK_NAME_MAP[chainId]?.toLowerCase().replace(" ", "-") || `chain-${chainId}`,
              nativeToken: {
                address: "0x0000000000000000000000000000000000000000",
                symbol: chainId === 56 ? "BNB" : chainId === 137 ? "POL" : "ETH",
                name: chainId === 56 ? "BNB" : chainId === 137 ? "Polygon" : "Ethereum",
                decimals: 18,
              },
            };
          },
        );

        // Update cache
        this.chainsCache = {
          data: chains,
          timestamp: Date.now(),
        };

        return Promise.resolve(chains);
      } catch (error) {
        console.error("Failed to fetch chains:", error);

        // Return cached data if available, even if expired
        if (this.chainsCache) {
          return Promise.resolve(this.chainsCache.data);
        }

        return Promise.reject(new Error("Failed to load supported networks"));
      }
    });
  }

  /**
   * Get tokens for specific chains with caching
   */
  async getTokens(chainIds: number[]): Promise<Token[]> {
    const cacheKey = chainIds.sort().join(",");

    // Check cache
    const cached = this.tokensCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    return await this.retryOperation(() => {
      try {
        // For now, return a basic set of popular tokens
        // In production, you'd fetch from 1inch API or token lists
        const popularTokens: Token[] = [
          // Native tokens
          ...chainIds.map((chainId) => ({
            address: "0x0000000000000000000000000000000000000000",
            chainId,
            symbol: chainId === 56 ? "BNB" : chainId === 137 ? "POL" : "ETH",
            name: chainId === 56 ? "BNB" : chainId === 137 ? "Polygon" : "Ethereum",
            decimals: 18,
          })),
          // USDC
          { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", chainId: 1, symbol: "USDC", name: "USD Coin", decimals: 6 },
          { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", chainId: 42161, symbol: "USDC", name: "USD Coin", decimals: 6 },
          { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", chainId: 137, symbol: "USDC", name: "USD Coin", decimals: 6 },
          { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", chainId: 56, symbol: "USDC", name: "USD Coin", decimals: 18 },
          { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", chainId: 10, symbol: "USDC", name: "USD Coin", decimals: 6 },
          { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", chainId: 8453, symbol: "USDC", name: "USD Coin", decimals: 6 },
          // USDT
          { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", chainId: 1, symbol: "USDT", name: "Tether USD", decimals: 6 },
          { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", chainId: 42161, symbol: "USDT", name: "Tether USD", decimals: 6 },
          { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", chainId: 137, symbol: "USDT", name: "Tether USD", decimals: 6 },
          { address: "0x55d398326f99059fF775485246999027B3197955", chainId: 56, symbol: "USDT", name: "Tether USD", decimals: 18 },
        ].filter((token) => chainIds.includes(token.chainId));

        // Update cache
        this.tokensCache.set(cacheKey, {
          data: popularTokens,
          timestamp: Date.now(),
        });

        return Promise.resolve(popularTokens);
      } catch (error) {
        console.error("Failed to fetch tokens:", error);

        // Return cached data if available, even if expired
        const cached = this.tokensCache.get(cacheKey);
        if (cached) {
          return Promise.resolve(cached.data);
        }

        return Promise.reject(new Error("Failed to load available tokens"));
      }
    });
  }

  /**
   * Get token by address and chain
   */
  async getToken(
    chainId: number,
    tokenAddress: string,
  ): Promise<Token | undefined> {
    try {
      const tokens = await this.getTokens([chainId]);
      return tokens.find(
        (token) =>
          token.address.toLowerCase() === tokenAddress.toLowerCase() &&
          token.chainId === chainId,
      );
    } catch (error) {
      console.error("Failed to get token:", error);
      return undefined;
    }
  }

  /**
   * Get token info (helper method)
   */
  private async getTokenInfo(
    chainId: number,
    tokenAddress: string,
  ): Promise<Token | undefined> {
    return await this.getToken(chainId, tokenAddress);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.chainsCache = null;
    this.tokensCache.clear();
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error as Error;

        // Don't retry user rejections or validation errors
        if (
          error instanceof Error && (
            error.message?.includes("rejected") ||
            error.message?.includes("No route found") ||
            error.message?.includes("Insufficient")
          )
        ) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (i < retries - 1) {
          await this.delay(this.RETRY_DELAY * Math.pow(2, i));
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if a route is still valid
   */
  isRouteValid(route: Route): boolean {
    // Routes are typically valid for 30 seconds
    const routeAge = Date.now() - (route.timestamp || 0);
    return routeAge < 30000;
  }

  /**
   * Get estimated gas cost for a route
   */
  getEstimatedGasCost(route: Route): string {
    let totalGasCostUSD = 0;

    for (const step of route.steps) {
      if (step.estimate?.gasCosts) {
        for (const gasCost of step.estimate.gasCosts) {
          totalGasCostUSD += parseFloat(gasCost.amountUSD || "0");
        }
      }
    }

    return totalGasCostUSD.toFixed(2);
  }
}

