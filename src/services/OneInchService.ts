import { 
  FusionSDK, 
  NetworkEnum, 
  OrderStatus, 
  PrivateKeyProviderConnector,
  type QuoteParams as OneInchQuoteParams,
  type OrderInfo,
  type Web3Like
} from '@1inch/fusion-sdk';
import type { WalletService } from './WalletService.ts';

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

export interface Route {
  fromChainId: number;
  toChainId: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  steps: RouteStep[];
  orderInfo?: OrderInfo;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  priceUSD?: string;
}

export interface RouteStep {
  id: string;
  type: string;
  tool: string;
  estimate?: {
    gasCosts?: Array<{
      amountUSD?: string;
    }>;
  };
}

export interface RouteCallbacks {
  onRouteUpdate?: (route: Route) => void;
  onStepUpdate?: (step: Route) => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface OneInchChain {
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

// Chain ID mapping between standard and 1inch NetworkEnum
const CHAIN_TO_NETWORK: Record<number, NetworkEnum> = {
  1: NetworkEnum.ETHEREUM,
  56: NetworkEnum.BINANCE,
  137: NetworkEnum.POLYGON,
  42161: NetworkEnum.ARBITRUM,
  10: NetworkEnum.OPTIMISM,
  8453: NetworkEnum.BASE,
};

const NETWORK_TO_CHAIN: Record<NetworkEnum, number> = {
  [NetworkEnum.ETHEREUM]: 1,
  [NetworkEnum.BINANCE]: 56,
  [NetworkEnum.POLYGON]: 137,
  [NetworkEnum.ARBITRUM]: 42161,
  [NetworkEnum.OPTIMISM]: 10,
  [NetworkEnum.BASE]: 8453,
};

export class OneInchService {
  private walletService: WalletService;
  private apiKey?: string;
  private sdkInstances: Map<NetworkEnum, FusionSDK> = new Map();
  private chainsCache: CacheEntry<OneInchChain[]> | null = null;
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
      console.log('1inch Fusion+ service initialized');
    } catch (error) {
      console.error('Failed to initialize 1inch SDK:', error);
      throw new Error('Failed to initialize cross-chain service');
    }
  }

  /**
   * Get or create SDK instance for a specific chain
   */
  private async getSDK(chainId: number): Promise<FusionSDK> {
    const network = CHAIN_TO_NETWORK[chainId];
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Return cached instance if exists
    if (this.sdkInstances.has(network)) {
      return this.sdkInstances.get(network)!;
    }

    // Create wallet provider connector
    const walletClient = this.walletService.getWalletClient();
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    // Get account address
    const account = walletClient.account;
    if (!account) {
      throw new Error('No account available');
    }

    // Create a Web3Like provider for 1inch SDK
    const web3Provider: Web3Like = {
      eth: {
        call: async (transactionConfig: any): Promise<string> => {
          return await walletClient.call({
            to: transactionConfig.to as `0x${string}`,
            data: transactionConfig.data as `0x${string}`,
          }) as string;
        }
      },
      extend: () => {}
    };

    // Note: PrivateKeyProviderConnector requires a private key, which we don't have
    // in browser wallet context. For now, we'll use a simplified approach.
    // In production, you might need to implement a custom connector.
    
    const sdk = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network,
      blockchainProvider: web3Provider as any,
      authKey: this.apiKey,
    });

    this.sdkInstances.set(network, sdk);
    return sdk;
  }

  /**
   * Get quote for token swap with retry logic
   */
  async getQuote(params: QuoteParams): Promise<Route> {
    console.log('Getting quote with params:', params);

    return await this.retryOperation(async () => {
      try {
        // For cross-chain swaps, we need to handle differently
        if (params.fromChain !== params.toChain) {
          return await this.getCrossChainQuote(params);
        }

        // Same-chain swap
        return await this.getSameChainQuote(params);
      } catch (error: unknown) {
        console.error('Failed to get quote:', error);
        
        if (error instanceof Error && error.message?.includes('No route found')) {
          throw new Error('No route found. Try a different token or amount.');
        }
        
        if (error instanceof Error && error.message?.includes('Insufficient liquidity')) {
          throw new Error('Insufficient liquidity for this swap.');
        }
        
        throw new Error('Failed to calculate quote. Please try again.');
      }
    });
  }

  /**
   * Get quote for cross-chain swap
   */
  private async getCrossChainQuote(params: QuoteParams): Promise<Route> {
    // Get SDK for source chain
    const sdk = await this.getSDK(params.fromChain);

    const quoteParams: Partial<OneInchQuoteParams> = {
      fromTokenAddress: params.fromToken,
      toTokenAddress: params.toToken,
      amount: params.fromAmount || params.toAmount || '0',
      walletAddress: params.fromAddress,
    };

    const quote = await sdk.getQuote(quoteParams as OneInchQuoteParams);
    
    if (!quote) {
      throw new Error('No quote available for this swap');
    }

    // Get token information
    const fromToken = await this.getTokenInfo(params.fromChain, params.fromToken);
    const toToken = await this.getTokenInfo(params.toChain, params.toToken);

    // Create route object compatible with our interface
    const route: Route = {
      fromChainId: params.fromChain,
      toChainId: params.toChain,
      fromToken,
      toToken,
      fromAmount: params.fromAmount || '0',
      toAmount: quote.presets?.[quote.recommendedPreset || 0]?.auctionEndAmount || '0',
      steps: [{
        id: '1',
        type: 'cross-chain-swap',
        tool: '1inch-fusion-plus',
        estimate: {
          gasCosts: []
        }
      }],
    };

    return route;
  }

  /**
   * Get quote for same-chain swap
   */
  private async getSameChainQuote(params: QuoteParams): Promise<Route> {
    const sdk = await this.getSDK(params.fromChain);

    const quoteParams: Partial<OneInchQuoteParams> = {
      fromTokenAddress: params.fromToken,
      toTokenAddress: params.toToken,
      amount: params.fromAmount || params.toAmount || '0',
      walletAddress: params.fromAddress,
    };

    const quote = await sdk.getQuote(quoteParams as OneInchQuoteParams);
    
    if (!quote) {
      throw new Error('No quote available for this swap');
    }

    const fromToken = await this.getTokenInfo(params.fromChain, params.fromToken);
    const toToken = await this.getTokenInfo(params.fromChain, params.toToken);

    const route: Route = {
      fromChainId: params.fromChain,
      toChainId: params.toChain,
      fromToken,
      toToken,
      fromAmount: params.fromAmount || '0',
      toAmount: quote.presets?.[quote.recommendedPreset || 0]?.auctionEndAmount || '0',
      steps: [{
        id: '1',
        type: 'swap',
        tool: '1inch-fusion',
        estimate: {
          gasCosts: []
        }
      }],
    };

    return route;
  }

  /**
   * Get multiple route options (for compatibility, returns single route)
   */
  async getRoutes(params: QuoteParams): Promise<Route[]> {
    const route = await this.getQuote(params);
    return [route];
  }

  /**
   * Execute route with callbacks
   */
  async executeRoute(route: Route, callbacks?: RouteCallbacks): Promise<void> {
    // Validate wallet is connected
    const walletClient = this.walletService.getWalletClient();
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    if (!route.steps || route.steps.length === 0) {
      throw new Error('Invalid route: no steps found');
    }

    console.log('Executing route with steps:', route.steps.length);
    console.log('Route details:', {
      fromChain: route.fromChainId,
      toChain: route.toChainId,
      fromToken: route.fromToken?.symbol,
      toToken: route.toToken?.symbol,
      fromAmount: route.fromAmount,
      toAmount: route.toAmount,
    });

    try {
      const sdk = await this.getSDK(route.fromChainId);
      
      // Create order parameters
      const orderParams: Partial<OneInchQuoteParams> = {
        fromTokenAddress: route.fromToken.address,
        toTokenAddress: route.toToken.address,
        amount: route.fromAmount,
        walletAddress: walletClient.account?.address || '',
      };

      // Create and submit order
      const preparedOrder = await sdk.createOrder(orderParams as OneInchQuoteParams);
      const orderInfo = await sdk.submitOrder(preparedOrder.order, preparedOrder.quoteId);
      
      console.log('Order submitted:', orderInfo.orderHash);

      // Monitor order status
      await this.monitorOrderStatus(sdk, orderInfo.orderHash, callbacks);

    } catch (error: unknown) {
      console.error('Failed to execute route:', error);
      
      if (error instanceof Error && error.message?.includes('User rejected')) {
        throw new Error('Transaction was rejected by user');
      }
      
      if (error instanceof Error && error.message?.includes('Insufficient funds')) {
        throw new Error('Insufficient balance to complete transaction');
      }
      
      throw new Error('Transaction failed. Please try again.');
    }
  }

  /**
   * Monitor order status until completion
   */
  private async monitorOrderStatus(
    sdk: FusionSDK, 
    orderHash: string, 
    callbacks?: RouteCallbacks
  ): Promise<void> {
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await this.delay(pollInterval);

      const status = await sdk.getOrderStatus(orderHash);
      
      console.log('Order status:', status.status);

      if (status.status === OrderStatus.Filled) {
        console.log('Order filled successfully:', status.fills);
        return;
      } else if (status.status === OrderStatus.Cancelled) {
        throw new Error('Order was cancelled');
      } else if (status.status === OrderStatus.Expired) {
        throw new Error('Order expired');
      }

      // Notify callbacks if provided
      if (callbacks?.onRouteUpdate) {
        // Create a minimal route update
        callbacks.onRouteUpdate({} as Route);
      }
    }

    throw new Error('Order monitoring timeout');
  }

  /**
   * Get supported chains with caching
   */
  async getChains(): Promise<OneInchChain[]> {
    // Check cache
    if (this.chainsCache && Date.now() - this.chainsCache.timestamp < this.CACHE_TTL) {
      return this.chainsCache.data;
    }

    return await this.retryOperation(async () => {
      try {
        // Return supported chains based on NetworkEnum
        const chains: OneInchChain[] = [
          {
            id: 1,
            name: 'Ethereum',
            key: 'eth',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
            },
          },
          {
            id: 56,
            name: 'BNB Chain',
            key: 'bsc',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'BNB',
              name: 'BNB',
              decimals: 18,
            },
          },
          {
            id: 137,
            name: 'Polygon',
            key: 'pol',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'POL',
              name: 'Polygon',
              decimals: 18,
            },
          },
          {
            id: 42161,
            name: 'Arbitrum',
            key: 'arb',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
            },
          },
          {
            id: 10,
            name: 'Optimism',
            key: 'opt',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
            },
          },
          {
            id: 8453,
            name: 'Base',
            key: 'base',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
            },
          },
        ];
        
        // Update cache
        this.chainsCache = {
          data: chains,
          timestamp: Date.now(),
        };

        return chains;
      } catch (error) {
        console.error('Failed to fetch chains:', error);
        
        // Return cached data if available, even if expired
        if (this.chainsCache) {
          return this.chainsCache.data;
        }
        
        throw new Error('Failed to load supported networks');
      }
    });
  }

  /**
   * Get tokens for specific chains with caching
   */
  async getTokens(chainIds: number[]): Promise<Token[]> {
    const cacheKey = chainIds.sort().join(',');
    
    // Check cache
    const cached = this.tokensCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    return await this.retryOperation(async () => {
      try {
        // Fetch tokens from 1inch API for each chain
        const allTokens: Token[] = [];

        for (const chainId of chainIds) {
          try {
            const tokens = await this.fetchTokensForChain(chainId);
            allTokens.push(...tokens);
          } catch (error) {
            console.warn(`Failed to fetch tokens for chain ${chainId}:`, error);
          }
        }

        // Update cache
        this.tokensCache.set(cacheKey, {
          data: allTokens,
          timestamp: Date.now(),
        });

        return allTokens;
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        
        // Return cached data if available, even if expired
        const cached = this.tokensCache.get(cacheKey);
        if (cached) {
          return cached.data;
        }
        
        throw new Error('Failed to load available tokens');
      }
    });
  }

  /**
   * Fetch tokens for a specific chain using 1inch API
   */
  private async fetchTokensForChain(chainId: number): Promise<Token[]> {
    try {
      const response = await fetch(`https://api.1inch.dev/token/v1.2/${chainId}`, {
        headers: this.apiKey ? {
          'Authorization': `Bearer ${this.apiKey}`,
        } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert 1inch token format to our format
      const tokens: Token[] = [];
      for (const [address, tokenData] of Object.entries(data as Record<string, any>)) {
        tokens.push({
          address,
          symbol: tokenData.symbol,
          name: tokenData.name,
          decimals: tokenData.decimals,
          chainId,
          logoURI: tokenData.logoURI,
        });
      }

      return tokens;
    } catch (error) {
      console.error(`Failed to fetch tokens for chain ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Get token information
   */
  private async getTokenInfo(chainId: number, tokenAddress: string): Promise<Token> {
    try {
      const tokens = await this.getTokens([chainId]);
      const token = tokens.find(
        t => t.address.toLowerCase() === tokenAddress.toLowerCase() && t.chainId === chainId
      );

      if (token) {
        return token;
      }

      // Return default token info if not found
      return {
        address: tokenAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        chainId,
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return {
        address: tokenAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        chainId,
      };
    }
  }

  /**
   * Get token by address and chain
   */
  async getToken(chainId: number, tokenAddress: string): Promise<Token | undefined> {
    try {
      const tokens = await this.getTokens([chainId]);
      return tokens.find(
        token => token.address.toLowerCase() === tokenAddress.toLowerCase() && token.chainId === chainId
      );
    } catch (error) {
      console.error('Failed to get token:', error);
      return undefined;
    }
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
    retries: number = this.MAX_RETRIES
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
            error.message?.includes('rejected') ||
            error.message?.includes('No route found') ||
            error.message?.includes('Insufficient')
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

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a route is still valid
   */
  isRouteValid(route: Route): boolean {
    // Routes are typically valid for 30 seconds
    const routeAge = Date.now() - (route as any).timestamp;
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
          totalGasCostUSD += parseFloat(gasCost.amountUSD || '0');
        }
      }
    }

    return totalGasCostUSD.toFixed(2);
  }
}
