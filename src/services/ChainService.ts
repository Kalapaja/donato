import type { Token } from "@lifi/sdk";
import type { LiFiService } from "./LiFiService.ts";

export interface Chain {
  id: number;
  name: string;
  key: string;
  chainType: "EVM";
  nativeToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
  logoURI?: string;
}

export class ChainService {
  private lifiService: LiFiService;
  private chains: Chain[] = [];
  private tokens: Token[] = [];
  private initialized = false;

  // Supported networks configuration
  private readonly SUPPORTED_CHAINS = [
    {
      id: 1,
      name: "Ethereum",
      key: "eth",
      chainType: "EVM" as const,
      nativeToken: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
      },
    },
    {
      id: 42161,
      name: "Arbitrum",
      key: "arb",
      chainType: "EVM" as const,
      nativeToken: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
      },
    },
    {
      id: 137,
      name: "Polygon",
      key: "pol",
      chainType: "EVM" as const,
      nativeToken: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "POL",
        name: "Polygon",
        decimals: 18,
      },
    },
    {
      id: 56,
      name: "BNB Chain",
      key: "bsc",
      chainType: "EVM" as const,
      nativeToken: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "BNB",
        name: "BNB",
        decimals: 18,
      },
    },
    {
      id: 10,
      name: "Optimism",
      key: "opt",
      chainType: "EVM" as const,
      nativeToken: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
      },
    },
    {
      id: 8453,
      name: "Base",
      key: "base",
      chainType: "EVM" as const,
      nativeToken: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
      },
    },
  ];

  constructor(lifiService: LiFiService) {
    this.lifiService = lifiService;
  }

  /**
   * Initialize the service by fetching chains and tokens
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Fetch chains from LiFi
      const lifiChains = await this.lifiService.getChains();

      // Merge with our supported chains configuration
      this.chains = this.SUPPORTED_CHAINS.map((supportedChain) => {
        const lifiChain = lifiChains.find((c) => c.id === supportedChain.id);

        return {
          ...supportedChain,
          logoURI: lifiChain?.logoURI,
          nativeToken: {
            ...supportedChain.nativeToken,
            logoURI: lifiChain?.nativeToken?.logoURI,
          },
        };
      });

      // Fetch tokens for all supported chains
      const chainIds = this.chains.map((chain) => chain.id);
      this.tokens = await this.lifiService.getTokens(chainIds);

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize ChainService:", error);
      // Use fallback configuration if API fails
      this.chains = this.SUPPORTED_CHAINS;
      this.initialized = true;
    }
  }

  /**
   * Get all supported chains
   */
  getChains(): Chain[] {
    return this.chains;
  }

  /**
   * Get chain by ID
   */
  getChain(chainId: number): Chain | undefined {
    return this.chains.find((chain) => chain.id === chainId);
  }

  /**
   * Get chain by key
   */
  getChainByKey(key: string): Chain | undefined {
    return this.chains.find((chain) => chain.key === key);
  }

  /**
   * Get all tokens
   */
  getAllTokens(): Token[] {
    return this.tokens;
  }

  /**
   * Get tokens for a specific chain
   */
  getTokens(chainId: number): Token[] {
    return this.tokens.filter((token) => token.chainId === chainId);
  }

  /**
   * Get token by address and chain
   */
  getToken(chainId: number, address: string): Token | undefined {
    return this.tokens.find(
      (token) =>
        token.chainId === chainId &&
        token.address.toLowerCase() === address.toLowerCase(),
    );
  }

  /**
   * Search tokens by query (symbol, name, or address)
   */
  searchTokens(query: string): Token[] {
    if (!query || query.trim() === "") {
      return this.tokens;
    }

    const lowerQuery = query.toLowerCase().trim();

    return this.tokens.filter((token) => {
      const symbolMatch = token.symbol.toLowerCase().includes(lowerQuery);
      const nameMatch = token.name.toLowerCase().includes(lowerQuery);
      const addressMatch = token.address.toLowerCase().includes(lowerQuery);

      return symbolMatch || nameMatch || addressMatch;
    });
  }

  /**
   * Filter tokens by chain IDs
   */
  filterTokensByChains(chainIds: number[]): Token[] {
    return this.tokens.filter((token) => chainIds.includes(token.chainId));
  }

  /**
   * Get tokens grouped by chain
   */
  getTokensGroupedByChain(): Map<number, Token[]> {
    const grouped = new Map<number, Token[]>();

    for (const token of this.tokens) {
      const chainTokens = grouped.get(token.chainId) || [];
      chainTokens.push(token);
      grouped.set(token.chainId, chainTokens);
    }

    return grouped;
  }

  /**
   * Get popular tokens (top tokens by usage/liquidity)
   */
  getPopularTokens(limit: number = 10): Token[] {
    // Define popular token addresses for each chain
    const popularTokens = [
      // Ethereum
      { chainId: 1, address: "0x0000000000000000000000000000000000000000" }, // ETH
      { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }, // USDC
      { chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }, // USDT
      { chainId: 1, address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" }, // WBTC
      { chainId: 1, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" }, // DAI

      // Arbitrum
      { chainId: 42161, address: "0x0000000000000000000000000000000000000000" }, // ETH
      { chainId: 42161, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" }, // USDC
      { chainId: 42161, address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" }, // USDT

      // Polygon
      { chainId: 137, address: "0x0000000000000000000000000000000000000000" }, // POL
      { chainId: 137, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" }, // USDC
      { chainId: 137, address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" }, // USDT

      // BSC
      { chainId: 56, address: "0x0000000000000000000000000000000000000000" }, // BNB
      { chainId: 56, address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" }, // USDC
      { chainId: 56, address: "0x55d398326f99059fF775485246999027B3197955" }, // USDT

      // Optimism
      { chainId: 10, address: "0x0000000000000000000000000000000000000000" }, // ETH
      { chainId: 10, address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" }, // USDC

      // Base
      { chainId: 8453, address: "0x0000000000000000000000000000000000000000" }, // ETH
      { chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }, // USDC
    ];

    const popular: Token[] = [];

    for (const { chainId, address } of popularTokens) {
      const token = this.getToken(chainId, address);
      if (token) {
        popular.push(token);
      }

      if (popular.length >= limit) {
        break;
      }
    }

    return popular;
  }

  /**
   * Get native token for a chain
   */
  getNativeToken(chainId: number): Token | undefined {
    const chain = this.getChain(chainId);
    if (!chain) {
      return undefined;
    }

    // Native tokens typically have address 0x0000... or 0xeeee...
    return this.tokens.find(
      (token) =>
        token.chainId === chainId &&
        (token.address === "0x0000000000000000000000000000000000000000" ||
          token.address.toLowerCase() ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
    );
  }

  /**
   * Check if a chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return this.chains.some((chain) => chain.id === chainId);
  }

  /**
   * Get chain name by ID
   */
  getChainName(chainId: number): string {
    const chain = this.getChain(chainId);
    return chain?.name || `Chain ${chainId}`;
  }

  /**
   * Refresh tokens from LiFi API
   */
  async refreshTokens(): Promise<void> {
    try {
      const chainIds = this.chains.map((chain) => chain.id);
      this.tokens = await this.lifiService.getTokens(chainIds);
    } catch (error) {
      console.error("Failed to refresh tokens:", error);
      throw new Error("Failed to refresh token list");
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
