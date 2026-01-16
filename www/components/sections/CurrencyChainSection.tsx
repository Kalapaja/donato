"use client";

import { useEffect, useState, useRef, useCallback, startTransition } from "react";

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
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin" },
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether" },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin" },
  ],
  42161: [
    { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", name: "USD Coin" },
    { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", name: "Tether" },
    { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", name: "Dai Stablecoin" },
  ],
  137: [
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", name: "USD Coin" },
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", name: "Tether" },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", symbol: "DAI", name: "Dai Stablecoin" },
  ],
  56: [
    { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", name: "USD Coin" },
    { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Tether" },
    { address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", symbol: "DAI", name: "Dai Stablecoin" },
  ],
  10: [
    { address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", symbol: "USDC", name: "USD Coin" },
    { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", name: "Tether" },
    { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", name: "Dai Stablecoin" },
  ],
  8453: [
    { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", name: "USD Coin" },
    { address: "0x50c5725949A6F0c72E6C4a641F24049A917E0Cb6", symbol: "DAI", name: "Dai Stablecoin" },
  ],
};

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function findChainById(chainId: number): Chain {
  return CHAINS.find((c) => c.id === chainId) || CHAINS[0];
}

function findTokenByAddress(chainId: number, address: string): Token | null {
  const tokens = POPULAR_TOKENS[chainId] || [];
  return tokens.find((t) => t.address === address) || null;
}

function getDefaultToken(chainId: number): Token | null {
  const tokens = POPULAR_TOKENS[chainId] || [];
  return tokens[0] || null;
}

interface CurrencyChainSectionProps {
  recipientChainId: number;
  recipientTokenAddress: string;
  onChainChange: (chainId: number, tokenAddress: string, tokenSymbol: string) => void;
}

export function CurrencyChainSection({
  recipientChainId,
  recipientTokenAddress,
  onChainChange,
}: CurrencyChainSectionProps) {
  const [selectedChain, setSelectedChain] = useState<Chain>(() =>
    findChainById(recipientChainId)
  );
  const [selectedToken, setSelectedToken] = useState<Token | null>(() =>
    findTokenByAddress(recipientChainId, recipientTokenAddress) ||
    getDefaultToken(recipientChainId)
  );
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [useCustomToken, setUseCustomToken] = useState(false);

  const prevPropsRef = useRef({ recipientChainId, recipientTokenAddress });

  // Memoize callback to avoid effect re-runs
  const notifyChange = useCallback(
    (chainId: number, address: string, symbol: string) => {
      onChainChange(chainId, address, symbol);
    },
    [onChainChange]
  );

  // Handle prop changes from parent
  useEffect(() => {
    const prev = prevPropsRef.current;
    if (
      prev.recipientChainId === recipientChainId &&
      prev.recipientTokenAddress === recipientTokenAddress
    ) {
      return;
    }

    prevPropsRef.current = { recipientChainId, recipientTokenAddress };

    const chain = findChainById(recipientChainId);
    const token = findTokenByAddress(chain.id, recipientTokenAddress) || getDefaultToken(chain.id);

    if (token) {
      startTransition(() => {
        setSelectedChain(chain);
        setSelectedToken(token);
        setUseCustomToken(false);
        setCustomTokenAddress("");
      });
      notifyChange(chain.id, token.address, token.symbol);
    }
  }, [recipientChainId, recipientTokenAddress, notifyChange]);

  // Notify parent when selected token changes
  useEffect(() => {
    if (selectedToken && !useCustomToken) {
      notifyChange(selectedChain.id, selectedToken.address, selectedToken.symbol);
    }
  }, [selectedToken, useCustomToken, selectedChain.id, notifyChange]);

  // Notify parent when custom token changes
  useEffect(() => {
    if (useCustomToken && customTokenAddress && ADDRESS_REGEX.test(customTokenAddress)) {
      notifyChange(selectedChain.id, customTokenAddress, "");
    }
  }, [useCustomToken, customTokenAddress, selectedChain.id, notifyChange]);

  function handleChainChange(chainId: number): void {
    const chain = findChainById(chainId);
    const tokens = POPULAR_TOKENS[chain.id] || [];
    const firstToken = tokens[0];

    setSelectedChain(chain);
    if (firstToken) {
      setSelectedToken(firstToken);
      setUseCustomToken(false);
      setCustomTokenAddress("");
      notifyChange(chain.id, firstToken.address, firstToken.symbol);
    }
  }

  function handleTokenSelect(token: Token): void {
    setSelectedToken(token);
    setUseCustomToken(false);
    setCustomTokenAddress("");
  }

  function handleCustomTokenToggle(enabled: boolean): void {
    setUseCustomToken(enabled);
    if (!enabled) {
      setCustomTokenAddress("");
      if (selectedToken) {
        notifyChange(selectedChain.id, selectedToken.address, selectedToken.symbol);
      }
    }
  }

  function handleCustomAddressChange(address: string): void {
    setCustomTokenAddress(address);
    if (ADDRESS_REGEX.test(address)) {
      notifyChange(selectedChain.id, address, "");
    }
  }

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

        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {tokens.map((token) => {
              const isSelected = selectedToken?.address === token.address && !useCustomToken;
              return (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => handleTokenSelect(token)}
                  className="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-left text-sm transition-colors"
                  style={{
                    background: isSelected ? "var(--color-muted)" : "var(--color-background)",
                    border: isSelected
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    borderRadius: "calc(var(--radius) - 2px)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-muted)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-background)";
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
                    {isSelected && (
                      <span style={{ color: "var(--color-primary)" }}>
                        &#10003;
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-full">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={useCustomToken}
                onChange={(e) => handleCustomTokenToggle(e.target.checked)}
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
                onChange={(e) => handleCustomAddressChange(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 text-sm rounded-lg"
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
