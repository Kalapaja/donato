"use client";

import { useEffect, useState, useRef, startTransition } from "react";

interface Chain {
  id: number;
  name: string;
  symbol: string;
  nativeCurrency: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
}

const CHAINS: Chain[] = [
  { id: 1, name: "Ethereum", symbol: "ETH", nativeCurrency: "ETH" },
  { id: 42161, name: "Arbitrum", symbol: "ETH", nativeCurrency: "ETH" },
  { id: 137, name: "Polygon", symbol: "MATIC", nativeCurrency: "MATIC" },
  { id: 56, name: "BSC", symbol: "BNB", nativeCurrency: "BNB" },
  { id: 10, name: "Optimism", symbol: "ETH", nativeCurrency: "ETH" },
  { id: 8453, name: "Base", symbol: "ETH", nativeCurrency: "ETH" },
];

const POPULAR_TOKENS: Record<number, Token[]> = {
  1: [
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether",
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      symbol: "DAI",
      name: "Dai Stablecoin",
    },
  ],
  42161: [
    {
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      symbol: "USDT",
      name: "Tether",
    },
    {
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      symbol: "DAI",
      name: "Dai Stablecoin",
    },
  ],
  137: [
    {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      symbol: "USDT",
      name: "Tether",
    },
    {
      address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      symbol: "DAI",
      name: "Dai Stablecoin",
    },
  ],
  56: [
    {
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      address: "0x55d398326f99059fF775485246999027B3197955",
      symbol: "USDT",
      name: "Tether",
    },
    {
      address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      symbol: "DAI",
      name: "Dai Stablecoin",
    },
  ],
  10: [
    {
      address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      symbol: "USDT",
      name: "Tether",
    },
    {
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      symbol: "DAI",
      name: "Dai Stablecoin",
    },
  ],
  8453: [
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      address: "0x50c5725949A6F0c72E6C4a641F24049A917E0Cb6",
      symbol: "DAI",
      name: "Dai Stablecoin",
    },
  ],
};

interface CurrencyChainSectionProps {
  recipientChainId: number;
  recipientTokenAddress: string;
  onChainChange: (chainId: number, tokenAddress: string) => void;
}

export function CurrencyChainSection({
  recipientChainId,
  recipientTokenAddress,
  onChainChange,
}: CurrencyChainSectionProps) {
  const [selectedChain, setSelectedChain] = useState<Chain>(
    CHAINS.find((c) => c.id === recipientChainId) || CHAINS[1],
  );
  
  // Initialize selectedToken from props
  const getDefaultToken = (chainId: number): Token | null => {
    const tokens = POPULAR_TOKENS[chainId] || [];
    return tokens.find((t) => t.address === recipientTokenAddress) || tokens[0] || null;
  };
  
  const [selectedToken, setSelectedToken] = useState<Token | null>(() =>
    getDefaultToken(recipientChainId)
  );
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [useCustomToken, setUseCustomToken] = useState(false);
  const prevRecipientChainId = useRef(recipientChainId);
  const prevRecipientTokenAddress = useRef(recipientTokenAddress);

  // Handle prop changes (not chain changes from user interaction)
  useEffect(() => {
    // Only update if props actually changed
    if (
      prevRecipientChainId.current !== recipientChainId ||
      prevRecipientTokenAddress.current !== recipientTokenAddress
    ) {
      prevRecipientChainId.current = recipientChainId;
      prevRecipientTokenAddress.current = recipientTokenAddress;

      const chain = CHAINS.find((c) => c.id === recipientChainId) || CHAINS[1];
      const tokens = POPULAR_TOKENS[chain.id] || [];
      const defaultToken = tokens.find((t) =>
        t.address === recipientTokenAddress
      ) || tokens[0];

      if (defaultToken) {
        // Batch state updates to avoid cascading renders
        startTransition(() => {
          setSelectedChain(chain);
          setSelectedToken(defaultToken);
          setUseCustomToken(false);
          setCustomTokenAddress("");
        });
        // Call callback after state updates are scheduled
        onChainChange(chain.id, defaultToken.address);
      }
    }
  }, [recipientChainId, recipientTokenAddress, onChainChange]);

  useEffect(() => {
    if (selectedToken && !useCustomToken) {
      onChainChange(selectedChain.id, selectedToken.address);
    }
  }, [selectedToken, useCustomToken, selectedChain.id]);

  useEffect(() => {
    if (useCustomToken && customTokenAddress) {
      onChainChange(selectedChain.id, customTokenAddress);
    }
  }, [useCustomToken, customTokenAddress, selectedChain.id]);

  const handleChainChange = (chainId: number) => {
    const chain = CHAINS.find((c) => c.id === chainId);
    if (chain) {
      setSelectedChain(chain);
      const tokens = POPULAR_TOKENS[chain.id] || [];
      if (tokens.length > 0) {
        setSelectedToken(tokens[0]);
        setUseCustomToken(false);
        setCustomTokenAddress("");
        onChainChange(chain.id, tokens[0].address);
      }
    }
  };

  const tokens = POPULAR_TOKENS[selectedChain.id] || [];

  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: "var(--color-foreground)" }}
      >
        Network & Asset
      </label>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Select blockchain network and asset to receive donations
      </p>

      <div className="space-y-4">
        <div>
          <select
            value={selectedChain.id}
            onChange={(e) => handleChainChange(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg text-sm"
            style={{
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
              borderRadius: "calc(var(--radius) - 2px)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = "2px solid var(--color-primary)";
              e.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
            }}
          >
            {CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name} ({chain.nativeCurrency})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {tokens.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => {
                    setSelectedToken(token);
                    setUseCustomToken(false);
                    setCustomTokenAddress("");
                  }}
                  className="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-left text-sm transition-colors"
                  style={{
                    background: selectedToken?.address === token.address &&
                        !useCustomToken
                      ? "var(--color-muted)"
                      : "var(--color-background)",
                    border: selectedToken?.address === token.address &&
                        !useCustomToken
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    borderRadius: "calc(var(--radius) - 2px)",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      selectedToken?.address !== token.address || useCustomToken
                    ) {
                      e.currentTarget.style.background = "var(--color-muted)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      selectedToken?.address !== token.address || useCustomToken
                    ) {
                      e.currentTarget.style.background =
                        "var(--color-background)";
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        {token.name}
                      </div>
                    </div>
                    {selectedToken?.address === token.address &&
                      !useCustomToken && (
                      <span style={{ color: "var(--color-primary)" }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={useCustomToken}
                  onChange={(e) => {
                    setUseCustomToken(e.target.checked);
                    if (!e.target.checked) {
                      setCustomTokenAddress("");
                      if (selectedToken) {
                        onChainChange(selectedChain.id, selectedToken.address);
                      }
                    }
                  }}
                  style={{
                    borderRadius: "4px",
                    borderColor: "var(--color-border)",
                  }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  Use custom asset address
                </span>
              </label>
              {useCustomToken && (
                <input
                  type="text"
                  value={customTokenAddress}
                  onChange={(e) => {
                    setCustomTokenAddress(e.target.value);
                    if (
                      e.target.value &&
                      /^0x[a-fA-F0-9]{40}$/.test(e.target.value)
                    ) {
                      onChainChange(selectedChain.id, e.target.value);
                    }
                  }}
                  placeholder="0x..."
                  className="w-full px-4 py-2 text-sm rounded-lg"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    borderRadius: "calc(var(--radius) - 2px)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline =
                      "2px solid var(--color-primary)";
                    e.currentTarget.style.outlineOffset = "2px";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
