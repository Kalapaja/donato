/**
 * Integration tests for stepped-flow component
 * 
 * Tests the complete flow progression and backward navigation:
 * - Complete forward flow: amount → connect → token → donate
 * - Backward navigation: disconnect, clear amount
 * - State transitions and visibility changes
 */

import { describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";

// Interface for stepped flow state
interface SteppedFlowState {
  amount: string;
  isWalletConnected: boolean;
  selectedToken: Token | null;
  quote: Route | null;
  isQuoteLoading: boolean;
  currentStep: FlowStep;
  stepVisibility: StepVisibility;
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
}

// Flow step type
type FlowStep = "amount" | "connect" | "token" | "donate";

// Step visibility state interface
interface StepVisibility {
  amount: boolean;      // always true
  connect: boolean;     // true when amount > 0 and wallet disconnected
  token: boolean;       // true when wallet connected
  walletInfo: boolean;  // true when wallet connected
  donate: boolean;      // true when token selected and quote calculated
}

/**
 * Creates initial stepped flow state (mount state)
 */
function createInitialSteppedFlowState(): SteppedFlowState {
  return {
    amount: "",
    isWalletConnected: false,
    selectedToken: null,
    quote: null,
    isQuoteLoading: false,
    currentStep: "amount",
    stepVisibility: {
      amount: true,
      connect: false,
      token: false,
      walletInfo: false,
      donate: false,
    },
  };
}

/**
 * Calculates step visibility based on component state
 */
function calculateStepVisibility(state: SteppedFlowState): StepVisibility {
  const amountValue = parseFloat(state.amount);
  const hasValidAmount = !!(state.amount && amountValue > 0);

  return {
    amount: true, // Always visible
    connect: hasValidAmount && !state.isWalletConnected,
    token: state.isWalletConnected,
    walletInfo: state.isWalletConnected,
    donate: state.isWalletConnected && 
            state.selectedToken !== null && 
            state.quote !== null && 
            !state.isQuoteLoading,
  };
}

/**
 * Determines current step based on state
 */
function determineCurrentStep(state: SteppedFlowState): FlowStep {
  if (state.amount && parseFloat(state.amount) > 0) {
    if (!state.isWalletConnected) {
      return "connect";
    } else if (state.isWalletConnected && !state.selectedToken) {
      return "token";
    } else if (state.selectedToken && state.quote && !state.isQuoteLoading) {
      return "donate";
    } else if (state.selectedToken) {
      return "token"; // Waiting for quote
    } else {
      return "connect";
    }
  } else {
    return "amount";
  }
}

/**
 * Simulates rendering the stepped-flow component
 */
function renderSteppedFlow(state: SteppedFlowState): string {
  const visibility = calculateStepVisibility(state);
  let content = "";

  // Step 1: Amount Input (always visible)
  if (visibility.amount) {
    content += "<amount-input";
    if (state.amount) {
      content += ` value="${state.amount}"`;
    }
    content += "></amount-input>";
  }

  // Step 2: Connect Wallet Button
  if (visibility.connect) {
    content += "<connect-wallet-button></connect-wallet-button>";
  }

  // Step 3: Token Selector
  if (visibility.token) {
    content += "<token-selector></token-selector>";
  }

  // Step 4: Wallet Info
  if (visibility.walletInfo) {
    content += "<wallet-info></wallet-info>";
  }

  // Step 5: Donate Button
  if (visibility.donate) {
    content += "<donate-button></donate-button>";
  }

  return content;
}

/**
 * Checks if amount-input is present in rendered content
 */
function contentContainsAmountInput(content: string): boolean {
  return content.includes("<amount-input");
}

/**
 * Checks if connect-wallet-button is present in rendered content
 */
function contentContainsConnectButton(content: string): boolean {
  return content.includes("<connect-wallet-button");
}

/**
 * Checks if token-selector is present in rendered content
 */
function contentContainsTokenSelector(content: string): boolean {
  return content.includes("<token-selector");
}

/**
 * Checks if wallet-info is present in rendered content
 */
function contentContainsWalletInfo(content: string): boolean {
  return content.includes("<wallet-info");
}

/**
 * Checks if donate-button is present in rendered content
 */
function contentContainsDonateButton(content: string): boolean {
  return content.includes("<donate-button");
}

describe("stepped-flow integration", () => {
  describe("6.3 - Complete forward flow progression", () => {
    it("should progress through all steps: amount → connect → token → donate", () => {
      // Step 1: Initial state - only amount input visible
      let state = createInitialSteppedFlowState();
      let rendered = renderSteppedFlow(state);
      let visibility = calculateStepVisibility(state);
      let currentStep = determineCurrentStep(state);

      assert(
        contentContainsAmountInput(rendered),
        "Step 1: Amount input should be visible on initial load"
      );
      assert(
        !contentContainsConnectButton(rendered),
        "Step 1: Connect button should be hidden initially"
      );
      assert(
        !contentContainsTokenSelector(rendered),
        "Step 1: Token selector should be hidden initially"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "Step 1: Donate button should be hidden initially"
      );
      assert(
        visibility.amount === true && 
        visibility.connect === false && 
        visibility.token === false && 
        visibility.donate === false,
        "Step 1: Only amount step should be visible"
      );
      assert(
        currentStep === "amount",
        "Step 1: Current step should be 'amount'"
      );

      // Step 2: Enter valid amount - connect button appears
      state = { ...state, amount: "100" };
      visibility = calculateStepVisibility(state);
      currentStep = determineCurrentStep(state);
      rendered = renderSteppedFlow(state);

      assert(
        contentContainsAmountInput(rendered),
        "Step 2: Amount input should still be visible"
      );
      assert(
        contentContainsConnectButton(rendered),
        "Step 2: Connect button should appear after entering amount"
      );
      assert(
        !contentContainsTokenSelector(rendered),
        "Step 2: Token selector should still be hidden"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "Step 2: Donate button should still be hidden"
      );
      assert(
        visibility.connect === true,
        "Step 2: Connect step should be visible when amount > 0"
      );
      assert(
        currentStep === "connect",
        "Step 2: Current step should be 'connect'"
      );

      // Step 3: Connect wallet - token selector and wallet info appear
      state = { ...state, isWalletConnected: true };
      visibility = calculateStepVisibility(state);
      currentStep = determineCurrentStep(state);
      rendered = renderSteppedFlow(state);

      assert(
        contentContainsAmountInput(rendered),
        "Step 3: Amount input should still be visible"
      );
      assert(
        !contentContainsConnectButton(rendered),
        "Step 3: Connect button should be hidden when wallet is connected"
      );
      assert(
        contentContainsTokenSelector(rendered),
        "Step 3: Token selector should appear after wallet connection"
      );
      assert(
        contentContainsWalletInfo(rendered),
        "Step 3: Wallet info should appear after wallet connection"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "Step 3: Donate button should still be hidden (no token selected)"
      );
      assert(
        visibility.token === true && visibility.walletInfo === true,
        "Step 3: Token and walletInfo steps should be visible when wallet connected"
      );
      assert(
        currentStep === "token",
        "Step 3: Current step should be 'token'"
      );

      // Step 4: Select token - still waiting for quote
      const mockToken: Token = {
        address: "0x123",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
        name: "USD Coin",
      };
      state = { ...state, selectedToken: mockToken };
      visibility = calculateStepVisibility(state);
      currentStep = determineCurrentStep(state);
      rendered = renderSteppedFlow(state);

      assert(
        contentContainsTokenSelector(rendered),
        "Step 4: Token selector should still be visible"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "Step 4: Donate button should still be hidden (quote not ready)"
      );
      assert(
        visibility.donate === false,
        "Step 4: Donate step should be hidden when quote is not ready"
      );
      assert(
        currentStep === "token",
        "Step 4: Current step should still be 'token' (waiting for quote)"
      );

      // Step 5: Quote calculated - donate button appears
      const mockQuote: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };
      state = { ...state, quote: mockQuote, isQuoteLoading: false };
      visibility = calculateStepVisibility(state);
      currentStep = determineCurrentStep(state);
      rendered = renderSteppedFlow(state);

      assert(
        contentContainsAmountInput(rendered),
        "Step 5: Amount input should still be visible"
      );
      assert(
        contentContainsTokenSelector(rendered),
        "Step 5: Token selector should still be visible"
      );
      assert(
        contentContainsWalletInfo(rendered),
        "Step 5: Wallet info should still be visible"
      );
      assert(
        contentContainsDonateButton(rendered),
        "Step 5: Donate button should appear after token selection and quote calculation"
      );
      assert(
        visibility.donate === true,
        "Step 5: Donate step should be visible when token selected and quote ready"
      );
      assert(
        currentStep === "donate",
        "Step 5: Current step should be 'donate'"
      );
    });

    it("should handle quote loading state correctly during flow progression", () => {
      // Start with full flow state
      const mockToken: Token = {
        address: "0x123",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: true,
        selectedToken: mockToken,
        quote: null,
        isQuoteLoading: true, // Quote is loading
      };

      let visibility = calculateStepVisibility(state);
      let rendered = renderSteppedFlow(state);

      // Donate button should be hidden while quote is loading
      assert(
        !contentContainsDonateButton(rendered),
        "Donate button should be hidden while quote is loading"
      );
      assert(
        visibility.donate === false,
        "Donate step visibility should be false when quote is loading"
      );

      // Quote completes
      const mockQuote: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };
      state = { ...state, quote: mockQuote, isQuoteLoading: false };
      visibility = calculateStepVisibility(state);
      rendered = renderSteppedFlow(state);

      // Donate button should now be visible
      assert(
        contentContainsDonateButton(rendered),
        "Donate button should appear after quote calculation completes"
      );
      assert(
        visibility.donate === true,
        "Donate step visibility should be true when quote is ready"
      );
    });
  });

  describe("6.3 - Backward navigation", () => {
    it("should handle wallet disconnect: preserve amount, clear token/quote, show connect", () => {
      // Given: Full flow state (amount entered, wallet connected, token selected, quote calculated)
      const mockToken: Token = {
        address: "0x123",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
        name: "USD Coin",
      };

      const mockQuote: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      const fullFlowState: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: true,
        selectedToken: mockToken,
        quote: mockQuote,
        isQuoteLoading: false,
      };

      // Verify full flow state
      let rendered = renderSteppedFlow(fullFlowState);
      let visibility = calculateStepVisibility(fullFlowState);
      let currentStep = determineCurrentStep(fullFlowState);

      assert(
        contentContainsAmountInput(rendered) &&
          contentContainsTokenSelector(rendered) &&
          contentContainsWalletInfo(rendered) &&
          contentContainsDonateButton(rendered) &&
          !contentContainsConnectButton(rendered),
        "Before disconnect: All steps should be visible except connect button"
      );
      assert(
        currentStep === "donate",
        "Before disconnect: Current step should be 'donate'"
      );

      // When: Wallet is disconnected
      const stateAfterDisconnect: SteppedFlowState = {
        ...fullFlowState,
        isWalletConnected: false,
        selectedToken: null,
        quote: null,
      };

      rendered = renderSteppedFlow(stateAfterDisconnect);
      visibility = calculateStepVisibility(stateAfterDisconnect);
      currentStep = determineCurrentStep(stateAfterDisconnect);

      // Then: Amount should be preserved
      assert(
        stateAfterDisconnect.amount === "100",
        "Amount should be preserved after wallet disconnect"
      );

      // Then: Token and quote should be cleared
      assert(
        stateAfterDisconnect.selectedToken === null,
        "Selected token should be cleared after wallet disconnect"
      );
      assert(
        stateAfterDisconnect.quote === null,
        "Quote should be cleared after wallet disconnect"
      );

      // Then: Connect button should appear, other steps should hide
      assert(
        contentContainsAmountInput(rendered),
        "After disconnect: Amount input should still be visible"
      );
      assert(
        contentContainsConnectButton(rendered),
        "After disconnect: Connect button should appear again"
      );
      assert(
        !contentContainsTokenSelector(rendered),
        "After disconnect: Token selector should be hidden"
      );
      assert(
        !contentContainsWalletInfo(rendered),
        "After disconnect: Wallet info should be hidden"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "After disconnect: Donate button should be hidden"
      );
      assert(
        visibility.connect === true,
        "After disconnect: Connect step should be visible"
      );
      assert(
        visibility.token === false && visibility.walletInfo === false && visibility.donate === false,
        "After disconnect: Token, walletInfo, and donate steps should be hidden"
      );
      assert(
        currentStep === "connect",
        "After disconnect: Current step should be 'connect'"
      );
    });

    it("should handle amount clearing: hide connect, return to amount-only state", () => {
      // Given: State with valid amount and connect button visible
      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: false,
      };

      let rendered = renderSteppedFlow(state);
      let visibility = calculateStepVisibility(state);
      let currentStep = determineCurrentStep(state);

      assert(
        contentContainsAmountInput(rendered) &&
          contentContainsConnectButton(rendered),
        "Before clear: Amount input and connect button should be visible"
      );
      assert(
        visibility.connect === true,
        "Before clear: Connect step should be visible"
      );
      assert(
        currentStep === "connect",
        "Before clear: Current step should be 'connect'"
      );

      // When: Amount is cleared
      state = { ...state, amount: "" };
      rendered = renderSteppedFlow(state);
      visibility = calculateStepVisibility(state);
      currentStep = determineCurrentStep(state);

      // Then: Connect button should be hidden, return to amount-only state
      assert(
        contentContainsAmountInput(rendered),
        "After clear: Amount input should still be visible"
      );
      assert(
        !contentContainsConnectButton(rendered),
        "After clear: Connect button should be hidden"
      );
      assert(
        !contentContainsTokenSelector(rendered),
        "After clear: Token selector should remain hidden"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "After clear: Donate button should remain hidden"
      );
      assert(
        visibility.amount === true &&
          visibility.connect === false &&
          visibility.token === false &&
          visibility.walletInfo === false &&
          visibility.donate === false,
        "After clear: Only amount step should be visible"
      );
      assert(
        currentStep === "amount",
        "After clear: Current step should return to 'amount'"
      );
    });

    it("should handle complete backward flow: disconnect then clear amount", () => {
      // Given: Full flow state
      const mockToken: Token = {
        address: "0x123",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      const mockQuote: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: true,
        selectedToken: mockToken,
        quote: mockQuote,
        isQuoteLoading: false,
      };

      // Verify full flow
      let rendered = renderSteppedFlow(state);
      assert(
        contentContainsDonateButton(rendered),
        "Initial: Donate button should be visible in full flow"
      );

      // Step 1: Disconnect wallet
      state = {
        ...state,
        isWalletConnected: false,
        selectedToken: null,
        quote: null,
      };

      rendered = renderSteppedFlow(state);
      let visibility = calculateStepVisibility(state);
      let currentStep = determineCurrentStep(state);

      assert(
        state.amount === "100",
        "After disconnect: Amount should be preserved"
      );
      assert(
        contentContainsConnectButton(rendered),
        "After disconnect: Connect button should appear"
      );
      assert(
        !contentContainsDonateButton(rendered),
        "After disconnect: Donate button should be hidden"
      );
      assert(
        currentStep === "connect",
        "After disconnect: Current step should be 'connect'"
      );

      // Step 2: Clear amount
      state = { ...state, amount: "" };
      rendered = renderSteppedFlow(state);
      visibility = calculateStepVisibility(state);
      currentStep = determineCurrentStep(state);

      assert(
        !contentContainsConnectButton(rendered),
        "After clear: Connect button should be hidden"
      );
      assert(
        currentStep === "amount",
        "After clear: Current step should be 'amount'"
      );
      assert(
        visibility.amount === true &&
          visibility.connect === false &&
          visibility.token === false &&
          visibility.donate === false,
        "After clear: Should return to amount-only state"
      );
    });

    it("should handle rapid state changes: connect → disconnect → connect", () => {
      // Given: State with amount entered
      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: false,
      };

      // Connect wallet
      state = { ...state, isWalletConnected: true };
      let rendered = renderSteppedFlow(state);
      assert(
        contentContainsTokenSelector(rendered),
        "After connect: Token selector should be visible"
      );

      // Disconnect wallet
      state = {
        ...state,
        isWalletConnected: false,
        selectedToken: null,
        quote: null,
      };
      rendered = renderSteppedFlow(state);
      assert(
        contentContainsConnectButton(rendered),
        "After disconnect: Connect button should appear"
      );
      assert(
        !contentContainsTokenSelector(rendered),
        "After disconnect: Token selector should be hidden"
      );

      // Connect wallet again
      state = { ...state, isWalletConnected: true };
      rendered = renderSteppedFlow(state);
      assert(
        contentContainsTokenSelector(rendered),
        "After reconnect: Token selector should appear again"
      );
      assert(
        !contentContainsConnectButton(rendered),
        "After reconnect: Connect button should be hidden"
      );
    });
  });

  describe("6.3 - Edge cases and state consistency", () => {
    it("should maintain consistent state when amount changes from positive to zero", () => {
      // Given: State with positive amount showing connect
      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: false,
      };

      let visibility = calculateStepVisibility(state);
      assert(
        visibility.connect === true,
        "Connect should be visible with positive amount"
      );

      // When: Amount changes to zero
      state = { ...state, amount: "0" };
      visibility = calculateStepVisibility(state);
      let rendered = renderSteppedFlow(state);

      // Then: Connect should be hidden
      assert(
        visibility.connect === false,
        "Connect should be hidden when amount is zero"
      );
      assert(
        !contentContainsConnectButton(rendered),
        "Connect button should not be rendered when amount is zero"
      );
    });

    it("should handle token deselection correctly", () => {
      // Given: Full flow with token selected
      const mockToken: Token = {
        address: "0x123",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      const mockQuote: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: true,
        selectedToken: mockToken,
        quote: mockQuote,
        isQuoteLoading: false,
      };

      let rendered = renderSteppedFlow(state);
      assert(
        contentContainsDonateButton(rendered),
        "Donate button should be visible with token and quote"
      );

      // When: Token is deselected
      state = { ...state, selectedToken: null, quote: null };
      rendered = renderSteppedFlow(state);
      let visibility = calculateStepVisibility(state);

      // Then: Donate button should be hidden
      assert(
        !contentContainsDonateButton(rendered),
        "Donate button should be hidden when token is deselected"
      );
      assert(
        visibility.donate === false,
        "Donate step visibility should be false when token is deselected"
      );
    });

    it("should handle quote invalidation correctly", () => {
      // Given: Full flow with quote
      const mockToken: Token = {
        address: "0x123",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      const mockQuote: Route = {
        fromAmount: "100000000",
        toAmount: "100000000",
      };

      let state: SteppedFlowState = {
        ...createInitialSteppedFlowState(),
        amount: "100",
        isWalletConnected: true,
        selectedToken: mockToken,
        quote: mockQuote,
        isQuoteLoading: false,
      };

      let rendered = renderSteppedFlow(state);
      assert(
        contentContainsDonateButton(rendered),
        "Donate button should be visible with valid quote"
      );

      // When: Quote becomes invalid (null)
      state = { ...state, quote: null };
      rendered = renderSteppedFlow(state);
      let visibility = calculateStepVisibility(state);

      // Then: Donate button should be hidden
      assert(
        !contentContainsDonateButton(rendered),
        "Donate button should be hidden when quote is invalid"
      );
      assert(
        visibility.donate === false,
        "Donate step visibility should be false when quote is invalid"
      );
    });
  });
});

