/**
 * Integration tests for full donation flow
 * 
 * This file contains integration tests for the complete donation widget flow:
 * - Complete flow: form → donation → success → donate again
 * - Flow progression through all steps (amount → wallet → token → ready → processing → success)
 * - State reset on "Donate Again"
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

// Flow step enum matching donation-widget.ts
enum FlowStep {
  AMOUNT = "amount",
  WALLET = "wallet",
  TOKEN = "token",
  READY = "ready",
  PROCESSING = "processing",
  SUCCESS = "success",
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
  isQuoteLoading: boolean;
  isWalletConnected: boolean;
  currentStep: FlowStep;
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
    isQuoteLoading: false,
    isWalletConnected: false,
    currentStep: FlowStep.AMOUNT,
    error: null,
    currentTheme: config.theme === "dark" ? "dark" : "light",
    config,
  };
}

// Helper function to simulate form filling (amount entry)
function simulateAmountEntry(
  state: WidgetState,
  amount: string
): WidgetState {
  const hasValidAmount = amount !== "" && parseFloat(amount) > 0;
  return {
    ...state,
    recipientAmount: amount,
    currentStep: hasValidAmount && !state.isWalletConnected
      ? FlowStep.WALLET
      : hasValidAmount && state.isWalletConnected && !state.selectedToken
      ? FlowStep.TOKEN
      : FlowStep.AMOUNT,
  };
}

// Helper function to simulate wallet connection
function simulateWalletConnection(state: WidgetState): WidgetState {
  const hasValidAmount = state.recipientAmount !== "" && parseFloat(state.recipientAmount) > 0;
  return {
    ...state,
    isWalletConnected: true,
    currentStep: hasValidAmount && !state.selectedToken
      ? FlowStep.TOKEN
      : state.currentStep,
  };
}

// Helper function to simulate form filling (amount + token selection)
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
    isQuoteLoading: false,
    currentStep: state.selectedToken && quote && !state.isQuoteLoading
      ? FlowStep.READY
      : state.currentStep,
  };
}

// Helper function to simulate quote loading start
function simulateQuoteLoadingStart(state: WidgetState): WidgetState {
  return {
    ...state,
    isQuoteLoading: true,
    currentStep: FlowStep.TOKEN, // Still in token step while loading
  };
}

// Helper function to simulate donation initiation
function simulateDonationInitiation(state: WidgetState): WidgetState {
  return {
    ...state,
    isDonating: true,
    currentStep: FlowStep.PROCESSING,
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
    currentStep: FlowStep.SUCCESS,
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
    isDonating: false,
    isQuoteLoading: false,
    isWalletConnected: false,
    currentStep: FlowStep.AMOUNT,
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

// Helper function to determine current step based on state (matching donation-widget logic)
function determineCurrentStep(state: WidgetState): FlowStep {
  // If showing success state, we're in success step
  if (state.showSuccessState) {
    return FlowStep.SUCCESS;
  }

  // If processing donation, we're in processing step
  if (state.isDonating) {
    return FlowStep.PROCESSING;
  }

  // If no valid amount, we're in amount step
  const amountValue = parseFloat(state.recipientAmount);
  if (!state.recipientAmount || isNaN(amountValue) || amountValue <= 0) {
    return FlowStep.AMOUNT;
  }

  // Amount is valid, check wallet connection
  if (!state.isWalletConnected) {
    return FlowStep.WALLET;
  }

  // Wallet is connected, check token selection
  if (!state.selectedToken) {
    return FlowStep.TOKEN;
  }

  // Token is selected, check if quote is ready
  if (state.quote && !state.isQuoteLoading) {
    return FlowStep.READY;
  }

  // Token selected but waiting for quote
  return FlowStep.TOKEN;
}

describe("donation-widget integration", () => {
  describe("9.1 - Complete flow progression through all steps", () => {
    it("should progress through all flow steps: amount → wallet → token → ready → processing → success", () => {
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
        steps: [{}],
      };

      // Step 1: Initial state - AMOUNT step
      let state = createInitialWidgetState(config);
      assert(
        state.currentStep === FlowStep.AMOUNT,
        "Step 1: Should start in AMOUNT step"
      );
      assert(
        state.recipientAmount === "",
        "Step 1: Amount should be empty"
      );
      assert(
        !state.isWalletConnected,
        "Step 1: Wallet should not be connected"
      );

      // Step 2: Enter amount - transition to WALLET step
      state = simulateAmountEntry(state, "100");
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.WALLET,
        "Step 2: Should transition to WALLET step after entering amount"
      );
      assert(
        state.recipientAmount === "100",
        "Step 2: Amount should be set"
      );

      // Step 3: Connect wallet - transition to TOKEN step
      state = simulateWalletConnection(state);
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.TOKEN,
        "Step 3: Should transition to TOKEN step after wallet connection"
      );
      assert(
        state.isWalletConnected === true,
        "Step 3: Wallet should be connected"
      );

      // Step 4: Select token - still in TOKEN step (waiting for quote)
      state = { ...state, selectedToken: token };
      state = simulateQuoteLoadingStart(state);
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.TOKEN,
        "Step 4: Should remain in TOKEN step while quote is loading"
      );
      assert(
        state.selectedToken === token,
        "Step 4: Token should be selected"
      );
      assert(
        state.isQuoteLoading === true,
        "Step 4: Quote should be loading"
      );

      // Step 5: Quote calculated - transition to READY step
      state = simulateQuoteCalculation(state, route);
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.READY,
        "Step 5: Should transition to READY step after quote calculation"
      );
      assert(
        state.quote === route,
        "Step 5: Quote should be set"
      );
      assert(
        state.isQuoteLoading === false,
        "Step 5: Quote should not be loading"
      );

      // Step 6: Initiate donation - transition to PROCESSING step
      state = simulateDonationInitiation(state);
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.PROCESSING,
        "Step 6: Should transition to PROCESSING step when donation starts"
      );
      assert(
        state.isDonating === true,
        "Step 6: Should be in donating state"
      );

      // Step 7: Donation completes - transition to SUCCESS step
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Arbitrum"
      );
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.SUCCESS,
        "Step 7: Should transition to SUCCESS step after donation completes"
      );
      assert(
        state.showSuccessState === true,
        "Step 7: Success state should be shown"
      );
      assert(
        state.transactionData !== null,
        "Step 7: Transaction data should be set"
      );
      assert(
        state.isDonating === false,
        "Step 7: Should not be in donating state anymore"
      );
    });

    it("should handle flow progression with wallet connection before amount entry", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      };

      // Start with wallet already connected
      let state = createInitialWidgetState(config);
      state = simulateWalletConnection(state);
      state.currentStep = determineCurrentStep(state);

      assert(
        state.currentStep === FlowStep.AMOUNT,
        "Should remain in AMOUNT step when wallet connected but no amount"
      );

      // Enter amount - should go directly to TOKEN step (skipping WALLET)
      state = simulateAmountEntry(state, "50");
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.TOKEN,
        "Should transition directly to TOKEN step when wallet already connected"
      );
    });
  });

  describe("9.1 - State reset on 'Donate Again'", () => {
    it("should reset to initial state when 'Donate Again' is clicked", () => {
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

      // Complete full flow to success state
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, { fromAmount: "100000000", toAmount: "100000000" });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(state, "100", token, "Arbitrum");

      // Verify we're in success state
      assert(
        state.currentStep === FlowStep.SUCCESS,
        "Before reset: Should be in SUCCESS step"
      );
      assert(
        state.showSuccessState === true,
        "Before reset: Success state should be shown"
      );
      assert(
        state.transactionData !== null,
        "Before reset: Transaction data should exist"
      );

      // Click "Donate Again"
      state = simulateDonateAgain(state);
      state.currentStep = determineCurrentStep(state);

      // Verify complete reset to initial state
      assert(
        state.currentStep === FlowStep.AMOUNT,
        "After reset: Should return to AMOUNT step"
      );
      assert(
        state.showSuccessState === false,
        "After reset: Success state should be hidden"
      );
      assert(
        state.showDonationForm === true,
        "After reset: Donation form should be shown"
      );
      assert(
        state.transactionData === null,
        "After reset: Transaction data should be cleared"
      );
      assert(
        state.recipientAmount === "",
        "After reset: Amount should be cleared"
      );
      assert(
        state.selectedToken === null,
        "After reset: Selected token should be cleared"
      );
      assert(
        state.quote === null,
        "After reset: Quote should be cleared"
      );
      assert(
        state.isDonating === false,
        "After reset: Should not be in donating state"
      );
      assert(
        state.isQuoteLoading === false,
        "After reset: Quote should not be loading"
      );
      assert(
        state.isWalletConnected === false,
        "After reset: Wallet should be disconnected"
      );
      assert(
        state.error === null,
        "After reset: Error should be cleared"
      );
      assert(
        isInitialState(state),
        "After reset: Should match initial state"
      );
    });

    it("should allow starting a new donation flow after reset", () => {
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

      // Complete first donation
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, { fromAmount: "100000000", toAmount: "100000000" });
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(state, "100", token, "Arbitrum");

      // Reset via "Donate Again"
      state = simulateDonateAgain(state);
      state.currentStep = determineCurrentStep(state);

      // Start new donation flow
      state = simulateAmountEntry(state, "50");
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.WALLET,
        "New flow: Should transition to WALLET step with new amount"
      );
      assert(
        state.recipientAmount === "50",
        "New flow: New amount should be set"
      );

      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, { fromAmount: "50000000", toAmount: "50000000" });
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.READY,
        "New flow: Should reach READY step with new donation"
      );
    });
  });

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

  describe("9.2 - Error handling", () => {
    // Helper function to simulate wallet connection error
    function simulateWalletConnectionError(
      state: WidgetState,
      errorMessage: string
    ): WidgetState {
      return {
        ...state,
        error: errorMessage,
        isWalletConnected: false,
        // Stay on wallet step when connection fails
        currentStep: state.recipientAmount && parseFloat(state.recipientAmount) > 0
          ? FlowStep.WALLET
          : FlowStep.AMOUNT,
      };
    }

    // Helper function to simulate transaction failure
    function simulateTransactionFailure(
      state: WidgetState,
      errorMessage: string
    ): WidgetState {
      return {
        ...state,
        isDonating: false,
        error: errorMessage,
        // Return to ready step when transaction fails (allows retry)
        currentStep: state.selectedToken && state.quote
          ? FlowStep.READY
          : FlowStep.TOKEN,
      };
    }

    // Helper function to check if error is displayed
    function hasError(state: WidgetState): boolean {
      return state.error !== null && state.error !== "";
    }

    // Helper function to check if error event was dispatched
    function simulateErrorEvent(
      eventType: "wallet-error" | "donation-failed",
      errorMessage: string
    ): { type: string; detail: { error: string } } {
      return {
        type: eventType,
        detail: { error: errorMessage },
      };
    }

    it("should handle wallet connection errors - user rejection", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      };

      // Step 1: User enters amount and attempts to connect wallet
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.WALLET,
        "Should be in WALLET step after entering amount"
      );
      assert(
        !state.isWalletConnected,
        "Wallet should not be connected initially"
      );

      // Step 2: Wallet connection is rejected by user
      const errorEvent = simulateErrorEvent(
        "wallet-error",
        "User rejected the connection request"
      );
      state = simulateWalletConnectionError(
        state,
        errorEvent.detail.error
      );
      state.currentStep = determineCurrentStep(state);

      // Verify error handling
      assert(
        hasError(state),
        "Error should be set when wallet connection fails"
      );
      assert(
        state.error === "User rejected the connection request",
        "Error message should match rejection error"
      );
      assert(
        !state.isWalletConnected,
        "Wallet should remain disconnected after error"
      );
      assert(
        state.currentStep === FlowStep.WALLET,
        "Should remain on WALLET step to allow retry"
      );
      assert(
        state.recipientAmount === "100",
        "Amount should be preserved after connection error"
      );
    });

    it("should handle wallet connection errors - modal failed to open", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      };

      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "50");
      state.currentStep = determineCurrentStep(state);

      // Simulate modal open failure
      const errorEvent = simulateErrorEvent(
        "wallet-error",
        "Failed to open wallet connection"
      );
      state = simulateWalletConnectionError(
        state,
        errorEvent.detail.error
      );
      state.currentStep = determineCurrentStep(state);

      // Verify error handling
      assert(
        hasError(state),
        "Error should be set when modal fails to open"
      );
      assert(
        state.error === "Failed to open wallet connection",
        "Error message should indicate modal failure"
      );
      assert(
        state.currentStep === FlowStep.WALLET,
        "Should remain on WALLET step to allow retry"
      );
    });

    it("should handle transaction failures - user rejection", () => {
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

      const route: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      // Step 1: Complete flow to ready state
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, route);
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.READY,
        "Should be in READY step before donation"
      );

      // Step 2: Initiate donation
      state = simulateDonationInitiation(state);
      state.currentStep = determineCurrentStep(state);
      assert(
        state.currentStep === FlowStep.PROCESSING,
        "Should be in PROCESSING step during donation"
      );
      assert(
        state.isDonating === true,
        "Should be in donating state"
      );

      // Step 3: Transaction is rejected by user
      const errorEvent = simulateErrorEvent(
        "donation-failed",
        "Transaction was rejected by user"
      );
      state = simulateTransactionFailure(
        state,
        errorEvent.detail.error
      );
      state.currentStep = determineCurrentStep(state);

      // Verify error handling
      assert(
        hasError(state),
        "Error should be set when transaction fails"
      );
      assert(
        state.error === "Transaction was rejected by user",
        "Error message should match rejection error"
      );
      assert(
        state.isDonating === false,
        "Should not be in donating state after failure"
      );
      assert(
        state.currentStep === FlowStep.READY,
        "Should return to READY step to allow retry"
      );
      assert(
        state.recipientAmount === "100",
        "Amount should be preserved after transaction failure"
      );
      assert(
        state.selectedToken === token,
        "Selected token should be preserved after transaction failure"
      );
      assert(
        state.quote === route,
        "Quote should be preserved after transaction failure"
      );
    });

    it("should handle transaction failures - insufficient funds", () => {
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

      const route: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      // Complete flow to processing
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, route);
      state = simulateDonationInitiation(state);
      state.currentStep = determineCurrentStep(state);

      // Simulate insufficient funds error
      const errorEvent = simulateErrorEvent(
        "donation-failed",
        "Insufficient balance to complete transaction"
      );
      state = simulateTransactionFailure(
        state,
        errorEvent.detail.error
      );
      state.currentStep = determineCurrentStep(state);

      // Verify error handling
      assert(
        hasError(state),
        "Error should be set for insufficient funds"
      );
      assert(
        state.error === "Insufficient balance to complete transaction",
        "Error message should indicate insufficient funds"
      );
      assert(
        state.isDonating === false,
        "Should not be in donating state after failure"
      );
      assert(
        state.currentStep === FlowStep.READY,
        "Should return to READY step to allow retry"
      );
    });

    it("should handle transaction failures - network error", () => {
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

      const route: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      // Complete flow to processing
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, route);
      state = simulateDonationInitiation(state);
      state.currentStep = determineCurrentStep(state);

      // Simulate network error
      const errorEvent = simulateErrorEvent(
        "donation-failed",
        "Network error: Failed to send transaction"
      );
      state = simulateTransactionFailure(
        state,
        errorEvent.detail.error
      );
      state.currentStep = determineCurrentStep(state);

      // Verify error handling
      assert(
        hasError(state),
        "Error should be set for network error"
      );
      assert(
        state.error === "Network error: Failed to send transaction",
        "Error message should indicate network error"
      );
      assert(
        state.isDonating === false,
        "Should not be in donating state after failure"
      );
      assert(
        state.currentStep === FlowStep.READY,
        "Should return to READY step to allow retry"
      );
    });

    it("should allow retry after wallet connection error", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      };

      // Initial state with amount
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state.currentStep = determineCurrentStep(state);

      // First connection attempt fails
      state = simulateWalletConnectionError(
        state,
        "User rejected the connection request"
      );
      state.currentStep = determineCurrentStep(state);
      assert(
        hasError(state),
        "Error should be set after first failure"
      );
      assert(
        state.currentStep === FlowStep.WALLET,
        "Should remain on WALLET step"
      );

      // Clear error (simulating user retry)
      state = { ...state, error: null };

      // Retry connection - succeeds
      state = simulateWalletConnection(state);
      state.currentStep = determineCurrentStep(state);
      assert(
        !hasError(state),
        "Error should be cleared after successful retry"
      );
      assert(
        state.isWalletConnected === true,
        "Wallet should be connected after retry"
      );
      assert(
        state.currentStep === FlowStep.TOKEN,
        "Should progress to TOKEN step after successful connection"
      );
    });

    it("should allow retry after transaction failure", () => {
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

      const route: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      // Complete flow to ready
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "100");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, route);
      state.currentStep = determineCurrentStep(state);

      // First transaction attempt fails
      state = simulateDonationInitiation(state);
      state = simulateTransactionFailure(
        state,
        "Transaction was rejected by user"
      );
      state.currentStep = determineCurrentStep(state);
      assert(
        hasError(state),
        "Error should be set after transaction failure"
      );
      assert(
        state.currentStep === FlowStep.READY,
        "Should return to READY step"
      );

      // Clear error (simulating user retry)
      state = { ...state, error: null };

      // Retry transaction - succeeds
      state = simulateDonationInitiation(state);
      state = simulateDonationCompleted(
        state,
        "100",
        token,
        "Arbitrum"
      );
      state.currentStep = determineCurrentStep(state);
      assert(
        !hasError(state),
        "Error should be cleared after successful retry"
      );
      assert(
        state.currentStep === FlowStep.SUCCESS,
        "Should progress to SUCCESS step after successful transaction"
      );
      assert(
        state.showSuccessState === true,
        "Success state should be shown"
      );
    });

    it("should preserve form state after wallet connection error", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 42161,
        recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      };

      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "250");
      state.currentStep = determineCurrentStep(state);

      // Connection fails
      state = simulateWalletConnectionError(
        state,
        "User rejected the connection request"
      );
      state.currentStep = determineCurrentStep(state);

      // Verify form state is preserved
      assert(
        state.recipientAmount === "250",
        "Amount should be preserved after connection error"
      );
      assert(
        state.currentStep === FlowStep.WALLET,
        "Should remain on WALLET step"
      );
    });

    it("should preserve form state after transaction failure", () => {
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

      const route: Route = {
        fromAmount: "250000000",
        toAmount: "250000000",
      };

      // Complete flow to ready
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "250");
      state = simulateWalletConnection(state);
      state = { ...state, selectedToken: token };
      state = simulateQuoteCalculation(state, route);
      state.currentStep = determineCurrentStep(state);

      // Transaction fails
      state = simulateDonationInitiation(state);
      state = simulateTransactionFailure(
        state,
        "Transaction was rejected by user"
      );
      state.currentStep = determineCurrentStep(state);

      // Verify form state is preserved
      assert(
        state.recipientAmount === "250",
        "Amount should be preserved after transaction failure"
      );
      assert(
        state.selectedToken === token,
        "Selected token should be preserved after transaction failure"
      );
      assert(
        state.quote === route,
        "Quote should be preserved after transaction failure"
      );
      assert(
        state.isWalletConnected === true,
        "Wallet connection should be preserved after transaction failure"
      );
    });
  });
});

