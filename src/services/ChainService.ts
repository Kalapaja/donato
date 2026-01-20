import type { AcrossService } from "./AcrossService.ts";
import type { Token } from "./WalletService.ts";

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

/**
 * Known chain names as fallback when chain is not in the provided list.
 * Exported for use by components that receive chains as a property.
 */
export const KNOWN_CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  42161: "Arbitrum",
  137: "Polygon",
  56: "BNB Chain",
  10: "Optimism",
  8453: "Base",
  43114: "Avalanche",
  250: "Fantom",
};

/**
 * Get chain name from a list of chains with fallback to known chain names.
 * Useful for components that receive chains as a property.
 */
export function getChainNameFromList(chainId: number, chains: Chain[]): string {
  const chain = chains.find((c) => c.id === chainId);
  if (chain?.name) {
    return chain.name;
  }
  return KNOWN_CHAIN_NAMES[chainId] || `Network ${chainId}`;
}

export class ChainService {
  private acrossService?: AcrossService;
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

  constructor(acrossService?: AcrossService) {
    this.acrossService = acrossService;
  }

  /**
   * Initialize the service by fetching chains and tokens from AcrossService.
   * Requires AcrossService to be available for token data.
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Always set chains from supported configuration
    this.chains = this.SUPPORTED_CHAINS;

    if (!this.acrossService) {
      console.warn("AcrossService not available, tokens will be empty");
      this.initialized = true;
      return;
    }

    try {
      // Fetch chains and tokens from AcrossService
      const [acrossChains] = await Promise.all([
        this.acrossService.getSupportedChains(),
        this.fetchTokensFromAcross(),
      ]);

      // Merge with our supported chains configuration to add logos
      this.chains = this.SUPPORTED_CHAINS.map((supportedChain) => {
        const acrossChain = acrossChains.find((c) => c.chainId === supportedChain.id);
        return {
          ...supportedChain,
          logoURI: acrossChain?.logoURI,
        };
      });
    } catch (error) {
      console.warn("Failed to fetch data from Across:", error);
    }

    this.initialized = true;
  }

  /**
   * Fetch tokens from AcrossService for all supported chains
   */
  private async fetchTokensFromAcross(): Promise<void> {
    if (!this.acrossService) {
      return;
    }

    const supportedChainIds = new Set(this.SUPPORTED_CHAINS.map((chain) => chain.id));
    const allAcrossTokens = await this.acrossService.getAllSupportedTokens();

    this.tokens = allAcrossTokens
      .filter((token) => supportedChainIds.has(token.chainId))
      .map((token) => ({
        chainId: token.chainId,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
      }));
  }

  /**
   * Get chain by ID
   */
  getChain(chainId: number): Chain | undefined {
    return this.chains.find((chain) => chain.id === chainId);
  }

  /**
   * Get all tokens
   */
  getAllTokens(): Token[] {
    return this.tokens;
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
   * Get chain name by ID
   */
  getChainName(chainId: number): string {
    return getChainNameFromList(chainId, this.chains);
  }
}
