import type { WalletService } from './WalletService.ts';
import { ethers } from 'ethers';

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
  tx?: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas?: string;
    gasPrice?: string;
  };
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

// Supported chain IDs for 1inch API
const SUPPORTED_CHAINS = [1, 56, 137, 42161, 10, 8453];

export class OneInchService {
  private walletService: WalletService;
  private apiKey?: string;
  private chainsCache: CacheEntry<OneInchChain[]> | null = null;
  private tokensCache: Map<string, CacheEntry<Token[]>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly API_BASE_URL = 'https://api.1inch.dev';

  constructor(config: OneInchConfig) {
    this.walletService = config.walletService;
    this.apiKey = config.apiKey;
  }

  /**
   * Initialize 1inch service
   */
  init(): void {
    try {
      console.log('1inch Fusion+ service initialized');
    } catch (error) {
      console.error('Failed to initialize 1inch service:', error);
      throw new Error('Failed to initialize cross-chain service');
    }
  }

  /**
   * Make API request to 1inch with authentication
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1inch API error:', errorText);
      throw new Error(`1inch API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get quote for token swap with retry logic
   */
  async getQuote(params: QuoteParams): Promise<Route> {
    console.log('Getting quote with params:', params);

    return await this.retryOperation(async () => {
      try {
        // For cross-chain swaps, use 1inch Fusion+ API
        if (params.fromChain !== params.toChain) {
          throw new Error(
            'Cross-chain swaps are currently not supported. ' +
            'This feature requires 1inch Fusion+ integration which is planned for a future update. ' +
            'Please select tokens on the same chain for now.'
          );
        }

        // Same-chain swap using 1inch Swap API
        return await this.getSameChainQuote(params);
      } catch (error: unknown) {
        console.error('Failed to get quote:', error);
        
        if (error instanceof Error && error.message?.includes('No route found')) {
          throw new Error('No route found. Try a different token or amount.');
        }
        
        if (error instanceof Error && error.message?.includes('Insufficient liquidity')) {
          throw new Error('Insufficient liquidity for this swap.');
        }
        
        throw error;
      }
    });
  }

  /**
   * Get quote for same-chain swap using 1inch Swap API
   */
  private async getSameChainQuote(params: QuoteParams): Promise<Route> {
    const chainId = params.fromChain;
    
    if (!SUPPORTED_CHAINS.includes(chainId)) {
      throw new Error(`Chain ${chainId} is not supported by 1inch`);
    }

    // Build query parameters for swap quote
    const queryParams = new URLSearchParams({
      src: params.fromToken,
      dst: params.toToken,
      amount: params.fromAmount || '0',
      from: params.fromAddress,
      slippage: '1', // 1% slippage tolerance
      disableEstimate: 'false',
      allowPartialFill: 'false',
    });

    // Validate that we have a fromAmount
    if (!params.fromAmount) {
      throw new Error('fromAmount is required for swap quotes');
    }

    // Get quote from 1inch API
    const quoteData = await this.apiRequest(
      `/swap/v6.0/${chainId}/quote?${queryParams.toString()}`
    );

    // Get token information
    const fromToken = await this.getTokenInfo(params.fromChain, params.fromToken);
    const toToken = await this.getTokenInfo(params.toChain, params.toToken);

    // Create route object
    const route: Route = {
      fromChainId: params.fromChain,
      toChainId: params.toChain,
      fromToken,
      toToken,
      fromAmount: quoteData.fromAmount || params.fromAmount || '0',
      toAmount: quoteData.toAmount || '0',
      steps: [{
        id: '1',
        type: 'swap',
        tool: '1inch',
        estimate: {
          gasCosts: quoteData.gas ? [{
            amountUSD: (parseFloat(quoteData.gas) * parseFloat(quoteData.gasPrice || '0') / 1e18).toFixed(2)
          }] : []
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
      const chainId = route.fromChainId;
      
      // Build query parameters for swap execution
      const queryParams = new URLSearchParams({
        src: route.fromToken.address,
        dst: route.toToken.address,
        amount: route.fromAmount,
        from: walletClient.account?.address || '',
        slippage: '1',
        disableEstimate: 'false',
        allowPartialFill: 'false',
      });

      // Get swap transaction data from 1inch API
      const swapData = await this.apiRequest(
        `/swap/v6.0/${chainId}/swap?${queryParams.toString()}`
      );

      if (!swapData || !swapData.tx) {
        throw new Error('Failed to get swap transaction data');
      }

      // Check if token approval is needed
      if (route.fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        await this.handleTokenApproval(
          route.fromToken.address,
          swapData.tx.to,
          route.fromAmount,
          chainId
        );
      }

      // Execute the swap transaction
      const txHash = await walletClient.sendTransaction({
        to: swapData.tx.to as `0x${string}`,
        data: swapData.tx.data as `0x${string}`,
        value: BigInt(swapData.tx.value || '0'),
        gas: swapData.tx.gas ? BigInt(swapData.tx.gas) : undefined,
      });

      console.log('Transaction sent:', txHash);

      // Wait for transaction confirmation
      const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status === 'success') {
        console.log('Transaction confirmed:', receipt);
        callbacks?.onRouteUpdate?.(route);
      } else {
        throw new Error('Transaction failed');
      }

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
   * Handle token approval for 1inch router
   */
  private async handleTokenApproval(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    chainId: number
  ): Promise<void> {
    const walletClient = this.walletService.getWalletClient();
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    // Check if ethereum provider is available
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Ethereum provider not available');
    }

    // ERC20 approve ABI
    const approveAbi = [
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)'
    ];

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, approveAbi, signer);

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(
      walletClient.account?.address,
      spenderAddress
    );

    // If allowance is sufficient, no need to approve
    if (currentAllowance >= BigInt(amount)) {
      console.log('Token approval not needed, sufficient allowance');
      return;
    }

    // Request approval
    console.log('Requesting token approval...');
    const approveTx = await tokenContract.approve(spenderAddress, amount);
    await approveTx.wait();
    console.log('Token approved');
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
      const response = await fetch(`${this.API_BASE_URL}/token/v1.2/${chainId}`, {
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
