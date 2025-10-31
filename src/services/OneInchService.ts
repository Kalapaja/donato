import { SDK } from '@1inch/cross-chain-sdk';
import type { WalletService } from './WalletService.ts';

export interface OneInchConfig {
  apiKey: string;
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
  onRouteUpdate?: (route: OneInchRoute) => void;
  onStepUpdate?: (step: OneInchRoute) => void;
}

export interface OneInchRoute {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromToken: OneInchToken;
  toToken: OneInchToken;
  fromAmount: string;
  toAmount: string;
  estimate: {
    duration?: number;
    gasCosts?: Array<{
      amount: string;
      amountUSD: string;
      token: OneInchToken;
    }>;
  };
  steps: OneInchStep[];
}

export interface OneInchStep {
  id: string;
  type: string;
  action: {
    fromChainId: number;
    toChainId: number;
    fromToken: OneInchToken;
    toToken: OneInchToken;
    fromAmount: string;
    toAmount: string;
  };
  estimate?: {
    duration?: number;
    gasCosts?: Array<{
      amount: string;
      amountUSD: string;
    }>;
  };
}

export interface OneInchToken {
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  priceUSD?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class OneInchService {
  private walletService: WalletService;
  private apiKey: string;
  private sdk: SDK | null = null;
  private chainsCache: CacheEntry<OneInchChain[]> | null = null;
  private tokensCache: Map<string, CacheEntry<OneInchToken[]>> = new Map();
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
      // For now, we'll use a mock implementation
      // The actual 1inch cross-chain SDK requires specific setup
      console.log('Initializing 1inch cross-chain SDK with API key:', this.apiKey ? 'provided' : 'missing');
      
      // TODO: Implement actual SDK initialization when available
      // this.sdk = new SDK({
      //   url: 'https://api.1inch.dev/fusion-plus',
      //   authKey: this.apiKey,
      //   blockchainProvider: // Need to create provider from wallet service
      // });
      
    } catch (error) {
      console.error('Failed to initialize 1inch SDK:', error);
      throw new Error('Failed to initialize cross-chain service');
    }
  }

  /**
   * Get quote for token swap
   */
  async getQuote(params: QuoteParams): Promise<OneInchRoute> {
    console.log('Getting 1inch quote with params:', params);

    return await this.retryOperation(async () => {
      try {
        // Mock implementation for now
        // TODO: Implement actual 1inch quote fetching
        const mockRoute: OneInchRoute = {
          id: `route_${Date.now()}`,
          fromChainId: params.fromChain,
          toChainId: params.toChain,
          fromToken: {
            address: params.fromToken,
            chainId: params.fromChain,
            symbol: 'FROM',
            name: 'From Token',
            decimals: 18,
          },
          toToken: {
            address: params.toToken,
            chainId: params.toChain,
            symbol: 'TO',
            name: 'To Token',
            decimals: 18,
          },
          fromAmount: params.fromAmount || '1000000000000000000',
          toAmount: params.toAmount || '950000000000000000', // Mock 5% slippage
          estimate: {
            duration: 180, // 3 minutes
            gasCosts: [{
              amount: '21000',
              amountUSD: '10.50',
              token: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: params.fromChain,
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18,
              }
            }]
          },
          steps: [{
            id: 'step_1',
            type: 'cross-chain-swap',
            action: {
              fromChainId: params.fromChain,
              toChainId: params.toChain,
              fromToken: {
                address: params.fromToken,
                chainId: params.fromChain,
                symbol: 'FROM',
                name: 'From Token',
                decimals: 18,
              },
              toToken: {
                address: params.toToken,
                chainId: params.toChain,
                symbol: 'TO',
                name: 'To Token',
                decimals: 18,
              },
              fromAmount: params.fromAmount || '1000000000000000000',
              toAmount: params.toAmount || '950000000000000000',
            },
          }]
        };

        console.log('1inch quote response:', mockRoute);
        return mockRoute;
      } catch (error: unknown) {
        console.error('Failed to get 1inch quote:', error);
        throw new Error('Failed to calculate quote. Please try again.');
      }
    });
  }

  /**
   * Get multiple route options
   */
  async getRoutes(params: QuoteParams): Promise<OneInchRoute[]> {
    const route = await this.getQuote(params);
    return [route];
  }

  /**
   * Execute route with callbacks
   */
  async executeRoute(route: OneInchRoute, callbacks?: RouteCallbacks): Promise<void> {
    // Validate wallet is connected
    const walletClient = this.walletService.getWalletClient();
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    console.log('Executing 1inch route:', route.id);
    console.log('Route details:', {
      fromChain: route.fromChainId,
      toChain: route.toChainId,
      fromToken: route.fromToken?.symbol,
      toToken: route.toToken?.symbol,
      fromAmount: route.fromAmount,
      toAmount: route.toAmount,
    });

    try {
      // Mock implementation
      // TODO: Implement actual route execution
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution
      
      callbacks?.onRouteUpdate?.({
        ...route,
        // Update with completed status
      });
      
    } catch (error: unknown) {
      console.error('Failed to execute 1inch route:', error);
      
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
   * Get supported chains
   */
  async getChains(): Promise<OneInchChain[]> {
    // Check cache
    if (this.chainsCache && Date.now() - this.chainsCache.timestamp < this.CACHE_TTL) {
      return this.chainsCache.data;
    }

    return await this.retryOperation(async () => {
      try {
        // Mock supported chains - common ones supported by 1inch
        const chains: OneInchChain[] = [
          {
            id: 1,
            name: 'Ethereum',
            key: 'eth',
            logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
            }
          },
          {
            id: 137,
            name: 'Polygon',
            key: 'polygon',
            logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'MATIC',
              name: 'Polygon',
              decimals: 18,
            }
          },
          {
            id: 56,
            name: 'Binance Smart Chain',
            key: 'bsc',
            logoURI: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
            nativeToken: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'BNB',
              name: 'BNB',
              decimals: 18,
            }
          }
        ];
        
        // Update cache
        this.chainsCache = {
          data: chains,
          timestamp: Date.now(),
        };

        return chains;
      } catch (error) {
        console.error('Failed to fetch 1inch chains:', error);
        
        // Return cached data if available, even if expired
        if (this.chainsCache) {
          return this.chainsCache.data;
        }
        
        throw new Error('Failed to load supported networks');
      }
    });
  }

  /**
   * Get tokens for specific chains
   */
  async getTokens(chainIds: number[]): Promise<OneInchToken[]> {
    const cacheKey = chainIds.sort().join(',');
    
    // Check cache
    const cached = this.tokensCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    return await this.retryOperation(async () => {
      try {
        // Mock tokens for supported chains
        const mockTokens: OneInchToken[] = [
          // Ethereum tokens
          {
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: 1,
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
          },
          {
            address: '0xa0b86a33e6bbf15b76e17a5f8eb5a3f4dda56e73',
            chainId: 1,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
          },
          // Polygon tokens  
          {
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: 137,
            symbol: 'MATIC',
            name: 'Polygon',
            decimals: 18,
            logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
          },
          // BSC tokens
          {
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: 56,
            symbol: 'BNB',
            name: 'BNB',
            decimals: 18,
            logoURI: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
          }
        ];

        const filteredTokens = mockTokens.filter(token => 
          chainIds.includes(token.chainId)
        );

        // Update cache
        this.tokensCache.set(cacheKey, {
          data: filteredTokens,
          timestamp: Date.now(),
        });

        return filteredTokens;
      } catch (error) {
        console.error('Failed to fetch 1inch tokens:', error);
        
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
   * Get token by address and chain
   */
  async getToken(chainId: number, tokenAddress: string): Promise<OneInchToken | undefined> {
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
   * Check if a route is still valid
   */
  isRouteValid(route: OneInchRoute): boolean {
    // 1inch routes are typically valid for 30 seconds
    const routeAge = Date.now() - parseInt(route.id.split('_')[1] || '0');
    return routeAge < 30000;
  }

  /**
   * Get estimated gas cost for a route
   */
  getEstimatedGasCost(route: OneInchRoute): string {
    let totalGasCostUSD = 0;

    if (route.estimate?.gasCosts) {
      for (const gasCost of route.estimate.gasCosts) {
        totalGasCostUSD += parseFloat(gasCost.amountUSD || '0');
      }
    }

    return totalGasCostUSD.toFixed(2);
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