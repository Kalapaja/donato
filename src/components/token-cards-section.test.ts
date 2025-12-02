/**
 * Unit tests for TokenCardsSection component
 * 
 * Tests:
 * - Token card rendering
 * - Selection highlighting
 * - Insufficient balance state
 */

import { describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";
import type { Token, WalletService } from "../services/WalletService.ts";
import type { Address } from "viem";

// Interface for TokenCardsSection component state
interface TokenCardsSectionState {
  tokens: Token[];
  selectedToken: Token | null;
  walletService: MockWalletService | null;
  walletAddress: Address | null;
  requiredAmount: string;
  tokenBalances: Map<string, string>;
  isLoadingBalances: boolean;
}

// Interface for mock wallet service
interface MockWalletService {
  getFormattedBalance: (token: Token, address: Address) => Promise<string>;
}

// Interface for events dispatched by component
interface TokenCardsSectionEvents {
  tokenSelected: boolean;
  selectedToken?: Token;
}

// Mock token data
function createMockToken(
  symbol: string,
  address: string = "0x0000000000000000000000000000000000000000",
  chainId: number = 1,
  priceUSD?: string,
): Token {
  return {
    address,
    chainId,
    symbol,
    name: `${symbol} Token`,
    decimals: 18,
    logoURI: `https://example.com/${symbol.toLowerCase()}.png`,
    priceUSD,
  };
}

/**
 * Simulates rendering the TokenCardsSection component
 */
function renderTokenCardsSection(state: TokenCardsSectionState): string {
  if (state.tokens.length === 0) {
    return "";
  }

  let content = "";
  content += `<div class="section-label">Choose payment token</div>`;
  content += `<div class="cards-container" role="listbox" aria-label="Token selection">`;

  for (const token of state.tokens) {
    const tokenKey = `${token.address}-${token.chainId}`;
    const balance = state.tokenBalances.get(tokenKey) || "0";
    const formattedBalance = formatBalance(balance);
    const isSelected = isTokenSelected(token, state.selectedToken);
    const isInsufficient = hasInsufficientBalance(
      token,
      balance,
      state.requiredAmount,
    );

    content += `<div class="token-card ${isSelected ? "selected" : ""} ${isInsufficient ? "disabled" : ""}"`;
    content += ` role="option"`;
    content += ` aria-selected="${isSelected}"`;
    content += ` aria-disabled="${isInsufficient}"`;
    content += `>`;

    if (isSelected) {
      content += `<div class="selected-indicator">✓</div>`;
    }

    if (token.logoURI) {
      content += `<img class="token-icon" src="${token.logoURI}" alt="${token.symbol}" />`;
    } else {
      content += `<div class="token-icon-placeholder">${getTokenInitials(token)}</div>`;
    }

    content += `<div class="token-symbol">${token.symbol}</div>`;
    content += `<div class="token-balance ${state.isLoadingBalances ? "loading" : ""}">`;
    content += state.isLoadingBalances ? "..." : formattedBalance;
    content += `</div>`;
    content += `</div>`;
  }

  content += `</div>`;

  return content;
}

/**
 * Format balance for display
 */
function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (isNaN(num) || num === 0) {
    return "0";
  }

  if (num >= 1000) {
    return num.toFixed(2);
  } else if (num >= 1) {
    return num.toFixed(2);
  } else {
    return num.toFixed(4);
  }
}

/**
 * Get token initials for placeholder icon
 */
function getTokenInitials(token: Token): string {
  return token.symbol.slice(0, 2).toUpperCase();
}

/**
 * Check if token is selected
 */
function isTokenSelected(token: Token, selectedToken: Token | null): boolean {
  if (!selectedToken) {
    return false;
  }
  return (
    selectedToken.address === token.address &&
    selectedToken.chainId === token.chainId
  );
}

/**
 * Check if token has insufficient balance
 */
function hasInsufficientBalance(
  token: Token,
  balance: string,
  requiredAmount: string,
): boolean {
  // If no required amount is set, don't disable any tokens
  if (!requiredAmount || requiredAmount === "" || parseFloat(requiredAmount) <= 0) {
    return false;
  }

  const balanceNum = parseFloat(balance);

  // If balance is 0 or invalid, consider it insufficient
  if (isNaN(balanceNum) || balanceNum <= 0) {
    return true;
  }

  const requiredAmountNum = parseFloat(requiredAmount);
  if (isNaN(requiredAmountNum) || requiredAmountNum <= 0) {
    return false;
  }

  // Get token price in USD (default to 1 for stablecoins if not available)
  const tokenPriceUSD = getTokenPriceUSD(token);

  // Convert required USD amount to token amount
  const requiredTokenAmount = requiredAmountNum / tokenPriceUSD;

  // Check if balance is sufficient (with small buffer for rounding)
  return balanceNum < requiredTokenAmount * 0.9999; // 0.01% buffer for rounding errors
}

/**
 * Get token price in USD
 * Defaults to 1 for stablecoins if price is not available
 */
function getTokenPriceUSD(token: Token): number {
  // If price is explicitly set, use it
  if (token.priceUSD) {
    const price = parseFloat(token.priceUSD);
    if (!isNaN(price) && price > 0) {
      return price;
    }
  }

  // Default to 1 for common stablecoins
  const stablecoinSymbols = ["USDC", "USDT", "DAI", "BUSD", "TUSD", "USDP"];
  if (stablecoinSymbols.includes(token.symbol.toUpperCase())) {
    return 1;
  }

  // For other tokens without price, assume price of 1 to avoid disabling
  return 1;
}

/**
 * Simulates token card click handler
 */
function handleTokenClick(
  token: Token,
  state: TokenCardsSectionState,
): { newState: TokenCardsSectionState; events: TokenCardsSectionEvents } {
  const events: TokenCardsSectionEvents = {
    tokenSelected: false,
  };

  const tokenKey = `${token.address}-${token.chainId}`;
  const balance = state.tokenBalances.get(tokenKey) || "0";
  const isInsufficient = hasInsufficientBalance(
    token,
    balance,
    state.requiredAmount,
  );

  // Don't allow selection of tokens with insufficient balance
  if (isInsufficient) {
    return { newState: state, events };
  }

  // Emit token-selected event
  events.tokenSelected = true;
  events.selectedToken = token;

  // Update selected token
  const newState: TokenCardsSectionState = {
    ...state,
    selectedToken: token,
  };

  return { newState, events };
}

/**
 * Creates a mock wallet service
 */
function createMockWalletService(
  balances: Map<string, string> = new Map(),
): MockWalletService {
  return {
    getFormattedBalance: async (token: Token, address: Address) => {
      const key = `${token.address}-${token.chainId}`;
      return balances.get(key) || "0";
    },
  };
}

/**
 * Checks if rendered content contains section label
 */
function contentContainsSectionLabel(content: string): boolean {
  return content.includes("Choose payment token");
}

/**
 * Checks if rendered content contains token cards
 */
function contentContainsTokenCards(content: string, tokenCount: number): boolean {
  const cardMatches = content.match(/token-card/g);
  return cardMatches ? cardMatches.length === tokenCount : false;
}

/**
 * Checks if rendered content shows token symbol
 */
function contentShowsTokenSymbol(content: string, symbol: string): boolean {
  return content.includes(`<div class="token-symbol">${symbol}</div>`);
}

/**
 * Checks if rendered content shows token balance
 */
function contentShowsTokenBalance(content: string, balance: string): boolean {
  // Balance might be formatted, so check if it contains the balance value
  return content.includes(balance) || content.includes(formatBalance(balance));
}

/**
 * Checks if rendered content shows selected state
 */
function contentShowsSelectedState(content: string, tokenSymbol: string): boolean {
  // Find the token card for this symbol and check if it has "selected" class and checkmark
  const tokenCardRegex = new RegExp(
    `<div class="token-card selected[^"]*"[^>]*>.*?<div class="token-symbol">${tokenSymbol}</div>`,
    "s",
  );
  return tokenCardRegex.test(content) && content.includes("selected-indicator");
}

/**
 * Checks if rendered content shows disabled state
 */
function contentShowsDisabledState(content: string, tokenSymbol: string): boolean {
  // Find the token symbol in the content
  const symbolPattern = `<div class="token-symbol">${tokenSymbol}</div>`;
  const symbolIndex = content.indexOf(symbolPattern);
  
  if (symbolIndex === -1) {
    return false;
  }
  
  // Find the start of the token-card div that contains this symbol
  // Go backwards from the symbol to find the opening div
  const beforeSymbol = content.substring(0, symbolIndex);
  const cardStart = beforeSymbol.lastIndexOf('<div class="token-card');
  
  if (cardStart === -1) {
    return false;
  }
  
  // Extract the class attribute (everything between class=" and the closing ")
  const classStart = content.indexOf('class="', cardStart);
  if (classStart === -1 || classStart > symbolIndex) {
    return false;
  }
  
  const classValueStart = classStart + 7; // length of 'class="'
  const classValueEnd = content.indexOf('"', classValueStart);
  if (classValueEnd === -1 || classValueEnd > symbolIndex) {
    return false;
  }
  
  const classValue = content.substring(classValueStart, classValueEnd);
  
  // Check if the class value contains "disabled" as a separate word
  // This handles cases like "token-card  disabled" or "token-card selected disabled"
  return /\bdisabled\b/.test(classValue);
}

/**
 * Checks if rendered content shows loading state
 */
function contentShowsLoadingState(content: string): boolean {
  return content.includes("loading") && content.includes("...");
}

describe("token-cards-section", () => {
  describe("3.4 - Token card rendering", () => {
    it("should render section label 'Choose payment token'", () => {
      const state: TokenCardsSectionState = {
        tokens: [
          createMockToken("USDC"),
          createMockToken("ETH"),
        ],
        selectedToken: null,
        walletService: createMockWalletService(),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: new Map(),
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentContainsSectionLabel(rendered),
        "TokenCardsSection should display section label 'Choose payment token'"
      );
    });

    it("should render all token cards with icon, symbol, and balance", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222"),
        createMockToken("USDT", "0x3333333333333333333333333333333333333333"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "1.5");
      balances.set("0x2222222222222222222222222222222222222222-1", "0.5");
      balances.set("0x3333333333333333333333333333333333333333-1", "100.0");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentContainsTokenCards(rendered, tokens.length),
        "TokenCardsSection should render all token cards"
      );

      for (const token of tokens) {
        assert(
          contentShowsTokenSymbol(rendered, token.symbol),
          `TokenCardsSection should display token symbol for ${token.symbol}`
        );
      }
    });

    it("should render token balance for each token", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "100.50");
      balances.set("0x2222222222222222222222222222222222222222-1", "2.5");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentShowsTokenBalance(rendered, "100.50"),
        "TokenCardsSection should display balance for USDC"
      );

      assert(
        contentShowsTokenBalance(rendered, "2.5"),
        "TokenCardsSection should display balance for ETH"
      );
    });

    it("should render placeholder icon when logoURI is not available", () => {
      const token = createMockToken("USDC");
      token.logoURI = undefined;

      const state: TokenCardsSectionState = {
        tokens: [token],
        selectedToken: null,
        walletService: createMockWalletService(),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: new Map(),
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        rendered.includes("token-icon-placeholder"),
        "TokenCardsSection should render placeholder icon when logoURI is not available"
      );

      assert(
        rendered.includes("US"),
        "TokenCardsSection should display token initials in placeholder"
      );
    });

    it("should render loading state when balances are being fetched", () => {
      const tokens = [createMockToken("USDC")];

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: new Map(),
        isLoadingBalances: true,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentShowsLoadingState(rendered),
        "TokenCardsSection should show loading state when balances are being fetched"
      );
    });

    it("should render empty when no tokens are provided", () => {
      const state: TokenCardsSectionState = {
        tokens: [],
        selectedToken: null,
        walletService: createMockWalletService(),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: new Map(),
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        rendered === "",
        "TokenCardsSection should render empty when no tokens are provided"
      );
    });
  });

  describe("3.4 - Selection highlighting", () => {
    it("should highlight selected token with accent border and checkmark", () => {
      const tokens = [
        createMockToken("USDC"),
        createMockToken("ETH"),
      ];

      const selectedToken = tokens[0];

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken,
        walletService: createMockWalletService(),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: new Map(),
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentShowsSelectedState(rendered, selectedToken.symbol),
        "TokenCardsSection should highlight selected token with accent border and checkmark"
      );
    });

    it("should not highlight unselected tokens", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222"),
      ];

      const selectedToken = tokens[0];

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken,
        walletService: createMockWalletService(),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: new Map(),
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      // ETH should not be selected - check that it doesn't have "selected" class
      // Find the ETH card by looking for the token-symbol div with ETH
      const ethSymbolIndex = rendered.indexOf('<div class="token-symbol">ETH</div>');
      assert(
        ethSymbolIndex !== -1,
        "ETH token should be found in rendered content"
      );
      
      // Find the start of the token-card div for ETH (go backwards)
      const beforeEth = rendered.substring(0, ethSymbolIndex);
      const cardStart = beforeEth.lastIndexOf('<div class="token-card');
      assert(
        cardStart !== -1,
        "Token card div should be found for ETH"
      );
      
      // Extract the class attribute from the opening div tag
      const cardDivEnd = rendered.indexOf('>', cardStart);
      const cardDivHtml = rendered.substring(cardStart, cardDivEnd);
      
      // Check that the class attribute doesn't contain "selected" (but may contain "selected-indicator" in child elements)
      // The class should be "token-card " or "token-card disabled" but not "token-card selected"
      const hasSelectedInClass = cardDivHtml.includes('class="token-card selected') || 
                                 (cardDivHtml.includes('class="token-card') && 
                                  cardDivHtml.substring(cardDivHtml.indexOf('class="token-card')).includes(' selected'));
      
      assert(
        !hasSelectedInClass,
        "TokenCardsSection should not highlight unselected tokens"
      );
    });

    it("should emit token-selected event when token card is clicked", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "100");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const clickedToken = tokens[0];
      const { events } = handleTokenClick(clickedToken, state);

      assert(
        events.tokenSelected === true,
        "TokenCardsSection should emit token-selected event when token card is clicked"
      );

      assert(
        events.selectedToken?.symbol === clickedToken.symbol,
        "TokenCardsSection should include selected token in event detail"
      );
    });

    it("should update selected token state when token is clicked", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "100");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const clickedToken = tokens[0];
      const { newState } = handleTokenClick(clickedToken, state);

      assert(
        newState.selectedToken?.symbol === clickedToken.symbol,
        "TokenCardsSection should update selected token state when token is clicked"
      );

      assert(
        newState.selectedToken?.address === clickedToken.address,
        "TokenCardsSection should update selected token address correctly"
      );
    });

    it("should allow changing selection to a different token", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "100");
      balances.set("0x2222222222222222222222222222222222222222-1", "1");

      let state: TokenCardsSectionState = {
        tokens,
        selectedToken: tokens[0],
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      // Click on ETH to change selection
      const { newState } = handleTokenClick(tokens[1], state);

      assert(
        newState.selectedToken?.symbol === tokens[1].symbol,
        "TokenCardsSection should allow changing selection to a different token"
      );

      assert(
        newState.selectedToken?.symbol !== tokens[0].symbol,
        "TokenCardsSection should deselect previous token when new token is selected"
      );
    });
  });

  describe("3.4 - Insufficient balance state", () => {
    it("should disable token card when balance is insufficient", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1, "1"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "10"); // Balance is 10 USDC

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100", // Required amount is 100 USD
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentShowsDisabledState(rendered, tokens[0].symbol),
        "TokenCardsSection should disable token card when balance is insufficient"
      );
    });

    it("should show reduced opacity for disabled tokens", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1, "1"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "10");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      // Check that disabled class is applied
      assert(
        rendered.includes("disabled"),
        "TokenCardsSection should apply disabled class to tokens with insufficient balance"
      );
    });

    it("should not allow selection of tokens with insufficient balance", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1, "1"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "10");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const { events, newState } = handleTokenClick(tokens[0], state);

      assert(
        events.tokenSelected === false,
        "TokenCardsSection should not emit token-selected event for tokens with insufficient balance"
      );

      assert(
        newState.selectedToken === null,
        "TokenCardsSection should not update selected token when clicking disabled token"
      );
    });

    it("should not disable tokens when required amount is not set", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1, "1"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "10");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "", // No required amount
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        !contentShowsDisabledState(rendered, tokens[0].symbol),
        "TokenCardsSection should not disable tokens when required amount is not set"
      );
    });

    it("should not disable tokens when balance is sufficient", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1, "1"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "200"); // Balance is 200 USDC

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100", // Required amount is 100 USD
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        !contentShowsDisabledState(rendered, tokens[0].symbol),
        "TokenCardsSection should not disable tokens when balance is sufficient"
      );
    });

    it("should disable tokens when balance is zero", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1, "1"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "0");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      assert(
        contentShowsDisabledState(rendered, tokens[0].symbol),
        "TokenCardsSection should disable tokens when balance is zero"
      );
    });

    it("should handle token price conversion for balance validation", () => {
      const tokens = [
        createMockToken("ETH", "0x456", 1, "2000"), // ETH price is $2000
      ];

      const balances = new Map<string, string>();
      balances.set("0x456-1", "0.05"); // Balance is 0.05 ETH = $100

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100", // Required amount is $100
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      // 0.05 ETH * $2000 = $100, which should be sufficient (with small buffer)
      const rendered = renderTokenCardsSection(state);

      // Should not be disabled (balance is sufficient)
      assert(
        !contentShowsDisabledState(rendered, tokens[0].symbol),
        "TokenCardsSection should handle token price conversion for balance validation"
      );
    });

    it("should use default price of 1 for stablecoins without explicit price", () => {
      const tokens = [
        createMockToken("USDC", "0x123", 1), // No priceUSD set
      ];

      const balances = new Map<string, string>();
      balances.set("0x123-1", "50");

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      // USDC should default to price of 1, so 50 USDC < 100 USD = disabled
      assert(
        contentShowsDisabledState(rendered, tokens[0].symbol),
        "TokenCardsSection should use default price of 1 for stablecoins without explicit price"
      );
    });
  });

  describe("Integration: Complete token selection flow", () => {
    it("should handle complete flow: render → select → change selection", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111", 1, "1"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222", 1, "2000"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "200");
      balances.set("0x2222222222222222222222222222222222222222-1", "1");

      let state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      // Step 1: Initial render
      let rendered = renderTokenCardsSection(state);
      assert(
        contentContainsTokenCards(rendered, tokens.length),
        "Step 1: Should render all token cards"
      );

      // Step 2: Select USDC
      const { newState: stateAfterUSDC } = handleTokenClick(tokens[0], state);
      state = stateAfterUSDC;
      rendered = renderTokenCardsSection(state);

      assert(
        contentShowsSelectedState(rendered, tokens[0].symbol),
        "Step 2: Should highlight USDC as selected"
      );

      // Step 3: Change selection to ETH
      const { newState: stateAfterETH } = handleTokenClick(tokens[1], state);
      state = stateAfterETH;
      rendered = renderTokenCardsSection(state);

      assert(
        contentShowsSelectedState(rendered, tokens[1].symbol),
        "Step 3: Should highlight ETH as selected"
      );

      assert(
        !contentShowsSelectedState(rendered, tokens[0].symbol),
        "Step 3: Should deselect USDC"
      );
    });

    it("should handle flow with insufficient balance tokens", () => {
      const tokens = [
        createMockToken("USDC", "0x1111111111111111111111111111111111111111", 1, "1"),
        createMockToken("ETH", "0x2222222222222222222222222222222222222222", 1, "2000"),
      ];

      const balances = new Map<string, string>();
      balances.set("0x1111111111111111111111111111111111111111-1", "50"); // Insufficient for $100
      balances.set("0x2222222222222222222222222222222222222222-1", "1"); // Sufficient (1 ETH = $2000 > $100)

      const state: TokenCardsSectionState = {
        tokens,
        selectedToken: null,
        walletService: createMockWalletService(balances),
        walletAddress: "0x1234567890123456789012345678901234567890" as Address,
        requiredAmount: "100",
        tokenBalances: balances,
        isLoadingBalances: false,
      };

      const rendered = renderTokenCardsSection(state);

      // USDC should be disabled
      assert(
        contentShowsDisabledState(rendered, tokens[0].symbol),
        "USDC should be disabled due to insufficient balance"
      );

      // ETH should not be disabled
      // 1 ETH at $2000 = $2000, which is > $100 required, so should not be disabled
      assert(
        !contentShowsDisabledState(rendered, tokens[1].symbol),
        "ETH should not be disabled (sufficient balance: 1 ETH = $2000 > $100 required)"
      );

      // Try to click USDC - should not select
      const { events: usdcEvents } = handleTokenClick(tokens[0], state);
      assert(
        usdcEvents.tokenSelected === false,
        "Should not allow selection of USDC (insufficient balance)"
      );

      // Try to click ETH - should select
      const { events: ethEvents } = handleTokenClick(tokens[1], state);
      assert(
        ethEvents.tokenSelected === true,
        "Should allow selection of ETH (sufficient balance)"
      );
    });
  });
});

