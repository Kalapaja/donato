const SUPPORTED_CHAIN_IDS = [1, 42161, 137, 56, 10, 8453];

const FALLBACK_STATS: AcrossStats = {
  chainCount: 6,
  tokenCount: 50,
};

export interface AcrossStats {
  chainCount: number;
  tokenCount: number;
}

export async function fetchAcrossStats(): Promise<AcrossStats> {
  try {
    const [chainsRes, tokensRes] = await Promise.all([
      fetch("https://app.across.to/api/swap/chains"),
      fetch("https://app.across.to/api/swap/tokens"),
    ]);

    if (!chainsRes.ok || !tokensRes.ok) {
      return FALLBACK_STATS;
    }

    const chains: { chainId: number }[] = await chainsRes.json();
    const tokens: { symbol: string; chainId: number }[] = await tokensRes.json();

    const supportedChains = chains.filter((c) =>
      SUPPORTED_CHAIN_IDS.includes(c.chainId)
    );

    const supportedTokens = tokens.filter((t) =>
      SUPPORTED_CHAIN_IDS.includes(t.chainId)
    );
    const uniqueTokenSymbols = new Set(supportedTokens.map((t) => t.symbol));

    return {
      chainCount: supportedChains.length || FALLBACK_STATS.chainCount,
      tokenCount: uniqueTokenSymbols.size || FALLBACK_STATS.tokenCount,
    };
  } catch {
    return FALLBACK_STATS;
  }
}
