import { createConfig, EVM, getQuote, getRoutes, executeRoute, convertQuoteToRoute, type Route, type RoutesRequest, type ChainId, type Token, type LiFiStep, getChains, getTokens } from '@lifi/sdk';
import type { WalletService } from './WalletService';

export interface LiFiConfig {
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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface LiFiChain {
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

export class LiFiService {
  private walletService: WalletService;
  private apiKey?: string;
  private chainsCache: CacheEntry<LiFiChain[]> | null = null;
  private tokensCache: Map<string, CacheEntry<Token[]>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(config: LiFiConfig) {
    this.walletService = config.walletService;
    this.apiKey = config.apiKey;
  }

  /**
   * Initialize LiFi SDK
   */
  init(): void {
    try {
      createConfig({
        apiKey: this.apiKey,
        integrator: 'donation-widget',
        providers: [
          EVM({
            getWalletClient: () => {
              return new Promise((resolve, reject) => {
                const client = this.walletService.getWalletClient();
                if (!client) {
                  reject(new Error('Wallet client not available'));
                } else {
                  resolve(client);
                }
              });
            },
            switchChain: async (chainId: number) => {
              await this.walletService.switchChain(chainId);
              const client = this.walletService.getWalletClient();
              if (!client) {
                throw new Error('Wallet client not available after chain switch');
              }
              return client;
            },
          }),
        ],
      });
    } catch (error) {
      console.error('Failed to initialize LiFi SDK:', error);
      throw new Error('Failed to initialize cross-chain service');
    }
  }

  /**
   * Get quote for token swap with retry logic
   */
  async getQuote(params: QuoteParams): Promise<Route> {
    console.log('Getting quote with params:', params);

    return await this.retryOperation(async () => {
      try {
        // Build quote request - use either fromAmount or toAmount
        let quote: LiFiStep;

        if (params.toAmount) {
          // Request quote based on desired output amount
          quote = await getQuote({
            fromChain: params.fromChain as ChainId,
            fromToken: params.fromToken,
            fromAddress: params.fromAddress,
            toChain: params.toChain as ChainId,
            toToken: params.toToken,
            toAddress: params.toAddress,
            toAmount: params.toAmount,
          });
        } else if (params.fromAmount) {
          // Request quote based on input amount
          quote = await getQuote({
            fromChain: params.fromChain as ChainId,
            fromToken: params.fromToken,
            fromAddress: params.fromAddress,
            toChain: params.toChain as ChainId,
            toToken: params.toToken,
            toAddress: params.toAddress,
            fromAmount: params.fromAmount,
          });
        } else {
          throw new Error('Either fromAmount or toAmount must be provided');
        }
        
        console.log('LiFi quote response:', quote);

        if (!quote) {
          throw new Error('No route found for this swap');
        }

        // Convert LiFiStep to Route
        const route = convertQuoteToRoute(quote);

        // Validate route has required fields
        if (!route.fromAmount) {
          console.warn('Route missing fromAmount:', route);
        }

        if (!route.steps || route.steps.length === 0) {
          console.warn('Route missing steps:', route);
        }

        return route;
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
   * Get multiple route options
   */
  async getRoutes(params: QuoteParams): Promise<Route[]> {
    if (!params.fromAmount) {
      throw new Error('fromAmount is required for getRoutes');
    }

    const routeOptions: RoutesRequest = {
      fromChainId: params.fromChain as ChainId,
      fromTokenAddress: params.fromToken,
      fromAmount: params.fromAmount,
      toChainId: params.toChain as ChainId,
      toTokenAddress: params.toToken,
    };

    return await this.retryOperation(async () => {
      try {
        const result = await getRoutes(routeOptions);
        
        if (!result || !result.routes || result.routes.length === 0) {
          throw new Error('No routes found for this swap');
        }

        return result.routes;
      } catch (error: unknown) {
        console.error('Failed to get routes:', error);
        
        if (error instanceof Error && error.message?.includes('No routes found')) {
          throw new Error('No routes found. Try a different token or amount.');
        }
        
        throw new Error('Failed to find routes. Please try again.');
      }
    });
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

    // Validate route has steps
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
      await executeRoute(route, {
        updateRouteHook: (updatedRoute: Route) => {
          console.log('Route updated:', updatedRoute);
          callbacks?.onRouteUpdate?.(updatedRoute);
        },
        infiniteApproval: false, // Use exact approval amounts for security
      });
    } catch (error: unknown) {
      console.error('Failed to execute route:', error);
      
      if (error instanceof Error && error.message?.includes('User rejected')) {
        throw new Error('Transaction was rejected by user');
      }
      
      if (error instanceof Error && error.message?.includes('Insufficient funds')) {
        throw new Error('Insufficient balance to complete transaction');
      }
      
      if (error instanceof Error && error.message?.includes('Gas estimation failed')) {
        throw new Error('Transaction would fail. Please check your balance and try again.');
      }
      
      throw new Error('Transaction failed. Please try again.');
    }
  }

  /**
   * Get supported chains with caching
   */
  async getChains(): Promise<LiFiChain[]> {
    // Check cache
    if (this.chainsCache && Date.now() - this.chainsCache.timestamp < this.CACHE_TTL) {
      return this.chainsCache.data;
    }

    return await this.retryOperation(async () => {
      try {
        const chains = await getChains();
        
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
        const tokens = await getTokens({
          chains: chainIds as ChainId[],
        });

        // Update cache
        this.tokensCache.set(cacheKey, {
          data: tokens.tokens[chainIds[0]] || [],
          timestamp: Date.now(),
        });

        // Flatten tokens from all chains
        const allTokens: Token[] = [];
        for (const chainId of chainIds) {
          const chainTokens = tokens.tokens[chainId];
          if (chainTokens) {
            allTokens.push(...chainTokens);
          }
        }

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
    const routeAge = Date.now() - (route as unknown as { timestamp: number }).timestamp;
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
