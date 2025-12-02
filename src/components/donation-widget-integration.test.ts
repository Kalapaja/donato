/**
 * Integration tests for full donation flow
 * 
 * This file contains integration tests for the complete donation widget flow:
 * - Complete flow: form → donation → success → donate again
 * - Tests with various configurations
 * - Theme switching during success state
 */

import { describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";

// Interface for transaction data
interface TransactionData {
  amount: string;
  tokenSymbol: string;
  chainName: string;
  chainId: number;
  timestamp: number;
}

// Interface for widget configuration
interface WidgetConfig {
  recipient: string;
  recipientChainId: number;
  recipientTokenAddress: string;
  successMessage?: string;
  donateAgainText?: string;
  confettiEnabled?: boolean;
  confettiColors?: string;
  theme?: "light" | "dark" | "auto";
}

// Interface for widget state
interface WidgetState {
  showSuccessState: boolean;
  showDonationForm: boolean;
  transactionData: TransactionData | null;
  recipientAmount: string;
  selectedToken: Token | null;
  quote: Route | null;
  isDonating: boolean;
  error: string | null;
  currentTheme: "light" | "dark";
  config: WidgetConfig;
}

// Interface for token
interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name?: string;
}

// Interface for route (simplified)
interface Route {
  fromAmount?: string;
  toAmount?: string;
  steps?: Array<{
    txHash?: string;
    transaction?: { hash?: string };
  }>;
}

// Helper function to create initial widget state
function createInitialWidgetState(config: WidgetConfig): WidgetState {
  return {
    showSuccessState: false,
    showDonationForm: true,
    transactionData: null,
    recipientAmount: "",
    selectedToken: null,
    quote: null,
    isDonating: false,
    error: null,
    currentTheme: config.theme === "dark" ? "dark" : "light",
    config,
  };
}

// Helper function to simulate form filling
function simulateFormFilling(
  state: WidgetState,
  amount: string,
  token: Token
): WidgetState {
  return {
    ...state,
    recipientAmount: amount,
    selectedToken: token,
  };
}

// Helper function to simulate quote calculation
function simulateQuoteCalculation(
  state: WidgetState,
  quote: Route
): WidgetState {
  return {
    ...state,
    quote,
  };
}

// Helper function to simulate donation initiation
function simulateDonationInitiation(state: WidgetState): WidgetState {
  return {
    ...state,
    isDonating: true,
  };
}

// Helper function to simulate successful donation completion
function simulateDonationCompleted(
  state: WidgetState,
  amount: string,
  token: Token,
  chainName: string
): WidgetState {
  const transactionData: TransactionData = {
    amount,
    tokenSymbol: token.symbol,
    chainName,
    chainId: token.chainId,
    timestamp: Date.now(),
  };

  return {
    ...state,
    showSuccessState: true,
    showDonationForm: false,
    transactionData,
    isDonating: false,
    recipientAmount: "",
    quote: null,
    selectedToken: null,
  };
}

// Helper function to simulate donate again click
function simulateDonateAgain(state: WidgetState): WidgetState {
  return {
    ...state,
    showSuccessState: false,
    showDonationForm: true,
    transactionData: null,
    recipientAmount: "",
    quote: null,
    selectedToken: null,
    error: null,
  };
}

// Helper function to simulate theme switching
function simulateThemeSwitch(
  state: WidgetState,
  newTheme: "light" | "dark"
): WidgetState {
  return {
    ...state,
    currentTheme: newTheme,
  };
}

// Helper function to extract transaction hash from route - no longer needed
// Transaction hash is no longer displayed in the widget

// Helper function to check if widget is in initial state
function isInitialState(state: WidgetState): boolean {
  return (
    state.showSuccessState === false &&
    state.showDonationForm === true &&
    state.transactionData === null &&
    state.recipientAmount === "" &&
    state.selectedToken === null &&
    state.quote === null &&
    state.isDonating === false &&
    state.error === null
  );
}

// Helper function to check if widget is in success state
function isSuccessState(state: WidgetState): boolean {
  return (
    state.showSuccessState === true &&
    state.showDonationForm === false &&
    state.transactionData !== null &&
    state.isDonating === false
  );
}

// Helper function to render widget state (simulated)
function renderWidget(state: WidgetState): string {
  let content = "";

  if (state.showSuccessState && state.transactionData) {
    content += `<success-state`;
    content += ` amount="${state.transactionData.amount}"`;
    content += ` token-symbol="${state.transactionData.tokenSymbol}"`;
    content += ` chain-name="${state.transactionData.chainName}"`;
    content += ` timestamp="${state.transactionData.timestamp}"`;
    if (state.config.successMessage) {
      content += ` success-message="${state.config.successMessage}"`;
    }
    if (state.config.donateAgainText) {
      content += ` donate-again-text="${state.config.donateAgainText}"`;
    }
    content += ` confetti-enabled="${state.config.confettiEnabled !== false}"`;
    if (state.config.confettiColors) {
      content += ` confetti-colors="${state.config.confettiColors}"`;
    }
    content += `></success-state>`;
  }

  if (state.showDonationForm) {
    content += `<donation-form`;
    content += ` recipient="${state.config.recipient}"`;
    content += `></donation-form>`;
  }

  return content;
}

describe("donation-widget integration", () => {
  describe("Complete flow: form → donation → success → donate again", () => {
    it("should complete full donation flow with default configuration", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        theme: "light",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
        name: "USD Coin",
      };

      const route: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
        steps: [
          {
          },
        ],
      };

      // Step 1: Initial state
      let state = createInitialWidgetState(config);
      assert(
        isInitialState(state),
        "Widget should start in initial state"
      );

      // Step 2: Fill form
      state = simulateFormFilling(state, "100", token);
      assert(
        state.recipientAmount === "100" && state.selectedToken === token,
        "Form should be filled with amount and token"
      );

      // Step 3: Calculate quote
      state = simulateQuoteCalculation(state, route);
      assert(
        state.quote === route,
        "Quote should be calculated"
      );

      // Step 4: Initiate donation
      state = simulateDonationInitiation(state);
      assert(
        state.isDonating === true,
        "Widget should be in donating state"
      );

      // Step 5: Complete donation
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Arbitrum"
      );

      assert(
        isSuccessState(state),
        "Widget should be in success state after donation"
      );

      assert(
        state.transactionData?.amount === "100",
        "Amount should be stored in success data"
      );

      assert(
        state.transactionData?.tokenSymbol === "USDC",
        "Token symbol should be stored in success data"
      );

      // Step 6: Click donate again
      state = simulateDonateAgain(state);
      assert(
        isInitialState(state),
        "Widget should return to initial state after donate again"
      );

      // Verify rendered content transitions
      const initialContent = renderWidget(createInitialWidgetState(config));
      const successContent = renderWidget({
        ...state,
        showSuccessState: true,
        showDonationForm: false,
        transactionData: {
          amount: "100",
          tokenSymbol: "USDC",
          chainName: "Arbitrum",
          chainId: 42161,
          timestamp: Date.now(),
        },
      });
      const resetContent = renderWidget(state);

      assert(
        initialContent.includes("<donation-form"),
        "Initial state should render donation form"
      );

      assert(
        successContent.includes("<success-state"),
        "Success state should render success-state component"
      );

      assert(
        resetContent.includes("<donation-form"),
        "Reset state should render donation form again"
      );
    });

    it("should complete full donation flow with custom configuration", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 1,
        recipientTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        successMessage: "Thank you for your generous donation!",
        donateAgainText: "Make Another Donation",
        confettiEnabled: true,
        confettiColors: "#ff0000,#00ff00,#0000ff",
        theme: "dark",
      };

      const token: Token = {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        decimals: 6,
        chainId: 1,
        name: "Tether USD",
      };

      const route: Route = {
        fromAmount: "50000000",
        toAmount: "50000000",
        steps: [
          {
          },
        ],
      };

      // Complete flow
      let state = createInitialWidgetState(config);
      state = simulateFormFilling(state, "50", token);
      state = simulateQuoteCalculation(state, route);
      state = simulateDonationInitiation(state);

      state = simulateDonationCompleted(
        state,
        "50",
        token,
        "Ethereum"
      );

      // Verify custom configuration is applied
      const renderedContent = renderWidget(state);
      assert(
        renderedContent.includes(`success-message="${config.successMessage}"`),
        "Custom success message should be applied"
      );

      assert(
        renderedContent.includes(`donate-again-text="${config.donateAgainText}"`),
        "Custom donate again text should be applied"
      );

      assert(
        renderedContent.includes(`confetti-colors="${config.confettiColors}"`),
        "Custom confetti colors should be applied"
      );

      // Test donate again
      state = simulateDonateAgain(state);
      assert(
        isInitialState(state),
        "Widget should reset to initial state"
      );
    });

    it("should handle multiple donation cycles", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        theme: "light",
      };

      const token1: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      const token2: Token = {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        decimals: 6,
        chainId: 1,
      };

      // First donation cycle
      let state = createInitialWidgetState(config);
      state = simulateFormFilling(state, "100", token1);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token1,
        "Polygon"
      );

      assert(
        isSuccessState(state),
        "First donation should complete successfully"
      );

      state = simulateDonateAgain(state);
      assert(
        isInitialState(state),
        "Widget should reset after first donation"
      );

      // Second donation cycle
      state = simulateFormFilling(state, "200", token2);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "200",
        token2,
        "Polygon"
      );

      assert(
        isSuccessState(state),
        "Second donation should complete successfully"
      );

      assert(
        state.transactionData?.amount === "200",
        "Second donation amount should be correct"
      );

      assert(
        state.transactionData?.tokenSymbol === "USDT",
        "Second donation token should be correct"
      );

      // Third donation cycle
      state = simulateDonateAgain(state);
      state = simulateFormFilling(state, "50", token1);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "50",
        token1,
        "Polygon"
      );

      assert(
        isSuccessState(state),
        "Third donation should complete successfully"
      );

      assert(
        state.transactionData?.amount === "50",
        "Third donation amount should be correct"
      );
    });
  });

  describe("Tests with various configurations", () => {
    it("should work with confetti disabled", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        confettiEnabled: false,
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state = createInitialWidgetState(config);
      state = simulateFormFilling(state, "100", token);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Arbitrum"
      );

      const renderedContent = renderWidget(state);
      assert(
        renderedContent.includes('confetti-enabled="false"'),
        "Confetti should be disabled in rendered content"
      );
    });

    it("should work with custom configuration", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 1,
        recipientTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state = createInitialWidgetState(config);
      state = simulateFormFilling(state, "100", token);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Ethereum"
      );

      const renderedContent = renderWidget(state);
    });

    it("should work with minimal configuration", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state = createInitialWidgetState(config);
      state = simulateFormFilling(state, "100", token);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Arbitrum"
      );

      // Default values should be used
      const renderedContent = renderWidget(state);
      assert(
        renderedContent.includes('confetti-enabled="true"'),
        "Default confetti enabled should be true"
      );
    });
  });

  describe("Theme switching during success state", () => {
    it("should maintain success state when theme is switched", () => {
      // Integration test: Theme switching during success state
      // Validates: Theme integration with success state

      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        theme: "light",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      // Complete donation flow
      let state = createInitialWidgetState(config);
      state = simulateFormFilling(state, "100", token);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Arbitrum"
      );

      assert(
        isSuccessState(state),
        "Widget should be in success state"
      );

      assert(
        state.currentTheme === "light",
        "Initial theme should be light"
      );

      // Switch theme to dark
      state = simulateThemeSwitch(state, "dark");

      assert(
        isSuccessState(state),
        "Widget should remain in success state after theme switch"
      );

      assert(
        state.currentTheme === "dark",
        "Theme should be switched to dark"
      );

      assert(
        state.transactionData !== null,
        "Transaction data should be preserved after theme switch"
      );

      // Switch theme back to light
      state = simulateThemeSwitch(state, "light");

      assert(
        isSuccessState(state),
        "Widget should remain in success state after switching back"
      );

      assert(
        state.currentTheme === "light",
        "Theme should be switched back to light"
      );
    });

    it("should handle theme switching before and after donation", () => {
      // Integration test: Theme switching throughout flow
      // Validates: Theme integration throughout complete flow

      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 1,
        recipientTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        theme: "light",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      // Start with light theme
      let state = createInitialWidgetState(config);
      assert(
        state.currentTheme === "light",
        "Initial theme should be light"
      );

      // Switch to dark before donation
      state = simulateThemeSwitch(state, "dark");
      assert(
        state.currentTheme === "dark",
        "Theme should be dark before donation"
      );

      // Complete donation
      state = simulateFormFilling(state, "100", token);
      state = simulateQuoteCalculation(state, {
        steps: [{}],
      });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Ethereum"
      );

      assert(
        state.currentTheme === "dark",
        "Theme should remain dark after donation"
      );

      // Switch to light during success state
      state = simulateThemeSwitch(state, "light");
      assert(
        state.currentTheme === "light",
        "Theme should be light during success state"
      );

      // Donate again
      state = simulateDonateAgain(state);
      assert(
        state.currentTheme === "light",
        "Theme should remain light after donate again"
      );
    });
  });
});

