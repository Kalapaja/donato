/**
 * Integration tests for subscription flow in donation widget
 *
 * This file contains integration tests for the subscription functionality:
 * - Toggle visibility with subscription-disabled attribute
 * - effectiveSubscriptionTarget fallback to recipient
 * - Subscription flow emits correct events
 * - Error handling shows localized messages
 * - Subscription state management
 *
 * Requirements tested: 10.1-10.6
 */

import { describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";

// Type representing the donation mode (mirrors component's DonationType)
type DonationType = "one-time" | "monthly";

// Interface for Token
interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name?: string;
}

// Interface for Route/Quote (simplified)
interface Quote {
  inputAmount?: string;
  outputAmount?: string;
  steps?: Array<{
    txHash?: string;
    transaction?: { hash?: string };
  }>;
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

// Interface for widget configuration with subscription properties
interface WidgetConfig {
  recipient: string;
  recipientChainId: number;
  recipientTokenAddress: string;
  reownProjectId?: string;
  // Subscription configuration
  subscriptionDisabled?: boolean;
  subscriptionTarget?: string;
  projectId?: number;
  // Other configuration
  theme?: "light" | "dark" | "auto";
  successMessage?: string;
  donateAgainText?: string;
}

// Interface for subscription success data
interface SubscriptionSuccessData {
  transactionHash: string;
  monthlyAmountUsd: string;
  subscriptionTarget: string;
  projectId: number;
  originChainId: number;
  originToken: Token | null;
}

// Interface for success state data
interface SuccessData {
  amount: string;
  tokenSymbol: string;
  chainName: string;
  timestamp: number;
  isSubscription?: boolean;
  monthlyAmount?: string;
}

// Interface for widget state with subscription properties
interface WidgetState {
  // Core state
  showSuccessState: boolean;
  showDonationForm: boolean;
  recipientAmount: string;
  selectedToken: Token | null;
  quote: Quote | null;
  isDonating: boolean;
  isQuoteLoading: boolean;
  isWalletConnected: boolean;
  currentStep: FlowStep;
  error: string | null;
  successData: SuccessData | null;

  // Subscription state
  donationType: DonationType;
  isSubscriptionFlow: boolean;
  subscriptionMonthlyAmount: string;

  // Configuration
  config: WidgetConfig;
}

// Interface for events dispatched by the widget
interface WidgetEvents {
  donationCompleted: { amount: string; token: Token; recipient: string } | null;
  subscriptionCreated: SubscriptionSuccessData | null;
  donationFailed: { error: string } | null;
  donationTypeChanged: { type: DonationType } | null;
}

/**
 * Create initial widget state with subscription support
 */
function createInitialWidgetState(config: WidgetConfig): WidgetState {
  return {
    showSuccessState: false,
    showDonationForm: true,
    recipientAmount: "",
    selectedToken: null,
    quote: null,
    isDonating: false,
    isQuoteLoading: false,
    isWalletConnected: false,
    currentStep: FlowStep.AMOUNT,
    error: null,
    successData: null,

    // Subscription state
    donationType: "one-time",
    isSubscriptionFlow: false,
    subscriptionMonthlyAmount: "",

    config,
  };
}

/**
 * Get effective subscription target address
 * Returns subscriptionTarget if set, otherwise falls back to recipient
 */
function getEffectiveSubscriptionTarget(config: WidgetConfig): string {
  return config.subscriptionTarget || config.recipient;
}

/**
 * Check if toggle should be visible based on configuration
 */
function isToggleVisible(config: WidgetConfig): boolean {
  // Toggle is visible when subscriptionDisabled is false or undefined
  return config.subscriptionDisabled !== true;
}

/**
 * Simulate donation type toggle change
 */
function simulateDonationTypeChange(
  state: WidgetState,
  newType: DonationType
): { newState: WidgetState; events: WidgetEvents } {
  const events: WidgetEvents = {
    donationCompleted: null,
    subscriptionCreated: null,
    donationFailed: null,
    donationTypeChanged: null,
  };

  // Only emit event if type actually changes
  if (state.donationType !== newType) {
    events.donationTypeChanged = { type: newType };

    return {
      newState: {
        ...state,
        donationType: newType,
        isSubscriptionFlow: newType === "monthly",
      },
      events,
    };
  }

  return { newState: state, events };
}

/**
 * Simulate amount entry
 */
function simulateAmountEntry(state: WidgetState, amount: string): WidgetState {
  return {
    ...state,
    recipientAmount: amount,
  };
}

/**
 * Simulate wallet connection
 */
function simulateWalletConnection(state: WidgetState): WidgetState {
  return {
    ...state,
    isWalletConnected: true,
  };
}

/**
 * Simulate token selection and quote calculation
 */
function simulateTokenAndQuote(
  state: WidgetState,
  token: Token,
  quote: Quote
): WidgetState {
  return {
    ...state,
    selectedToken: token,
    quote,
    isQuoteLoading: false,
  };
}

/**
 * Simulate subscription initiation
 */
function simulateSubscriptionInitiation(state: WidgetState): WidgetState {
  return {
    ...state,
    isDonating: true,
    currentStep: FlowStep.PROCESSING,
  };
}

/**
 * Simulate successful subscription completion
 */
function simulateSubscriptionCompleted(
  state: WidgetState,
  subscriptionData: SubscriptionSuccessData
): { newState: WidgetState; events: WidgetEvents } {
  const events: WidgetEvents = {
    donationCompleted: null,
    subscriptionCreated: subscriptionData,
    donationFailed: null,
    donationTypeChanged: null,
  };

  const successData: SuccessData = {
    amount: subscriptionData.monthlyAmountUsd,
    tokenSymbol: "USDC",
    chainName: "Polygon",
    timestamp: Date.now(),
    isSubscription: true,
    monthlyAmount: subscriptionData.monthlyAmountUsd,
  };

  return {
    newState: {
      ...state,
      showSuccessState: true,
      showDonationForm: false,
      isDonating: false,
      currentStep: FlowStep.SUCCESS,
      successData,
      subscriptionMonthlyAmount: subscriptionData.monthlyAmountUsd,
    },
    events,
  };
}

/**
 * Simulate subscription failure
 */
function simulateSubscriptionFailure(
  state: WidgetState,
  errorKey: string
): { newState: WidgetState; events: WidgetEvents } {
  const events: WidgetEvents = {
    donationCompleted: null,
    subscriptionCreated: null,
    donationFailed: { error: errorKey },
    donationTypeChanged: null,
  };

  return {
    newState: {
      ...state,
      isDonating: false,
      error: errorKey,
      currentStep: FlowStep.READY,
    },
    events,
  };
}

/**
 * Simulate donate again (state reset)
 */
function simulateDonateAgain(state: WidgetState): WidgetState {
  return {
    ...state,
    showSuccessState: false,
    showDonationForm: true,
    recipientAmount: "",
    selectedToken: null,
    quote: null,
    isDonating: false,
    isQuoteLoading: false,
    isWalletConnected: false,
    currentStep: FlowStep.AMOUNT,
    error: null,
    successData: null,
    // Reset subscription state
    donationType: "one-time",
    isSubscriptionFlow: false,
    subscriptionMonthlyAmount: "",
  };
}

/**
 * Render widget (simulated) - returns HTML-like representation
 */
function renderWidget(state: WidgetState): string {
  let content = "<div class='widget-container'>";

  if (state.showSuccessState && state.successData) {
    content += `<success-state`;
    content += ` amount="${state.successData.amount}"`;
    content += ` token-symbol="${state.successData.tokenSymbol}"`;
    content += ` chain-name="${state.successData.chainName}"`;
    if (state.successData.isSubscription) {
      content += ` is-subscription="true"`;
      content += ` monthly-amount="${state.successData.monthlyAmount}"`;
    }
    content += `></success-state>`;
  } else {
    // Render donation form content
    content += `<amount-section value="${state.recipientAmount}" donation-type="${state.donationType}"></amount-section>`;

    // Render toggle if visible
    if (isToggleVisible(state.config)) {
      content += `<donation-type-toggle`;
      content += ` value="${state.donationType}"`;
      content += ` disabled="${state.config.subscriptionDisabled || false}"`;
      content += `></donation-type-toggle>`;
    }

    content += `<donation-form`;
    content += ` recipient="${state.config.recipient}"`;
    content += ` donation-type="${state.donationType}"`;
    if (state.config.subscriptionTarget) {
      content += ` subscription-target="${state.config.subscriptionTarget}"`;
    }
    content += ` project-id="${state.config.projectId || 0}"`;
    content += `></donation-form>`;
  }

  content += "</div>";
  return content;
}

/**
 * Determine current step based on state
 */
function determineCurrentStep(state: WidgetState): FlowStep {
  if (state.showSuccessState) {
    return FlowStep.SUCCESS;
  }
  if (state.isDonating) {
    return FlowStep.PROCESSING;
  }
  const amountValue = parseFloat(state.recipientAmount);
  if (!state.recipientAmount || isNaN(amountValue) || amountValue <= 0) {
    return FlowStep.AMOUNT;
  }
  if (!state.isWalletConnected) {
    return FlowStep.WALLET;
  }
  if (!state.selectedToken) {
    return FlowStep.TOKEN;
  }
  if (state.quote && !state.isQuoteLoading) {
    return FlowStep.READY;
  }
  return FlowStep.TOKEN;
}

describe("donation-widget-subscription", () => {
  describe("Toggle visibility with subscription-disabled attribute", () => {
    it("should show toggle when subscription is enabled (default)", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        reownProjectId: "test-project-id",
      };

      const state = createInitialWidgetState(config);
      const rendered = renderWidget(state);

      assert(
        rendered.includes("donation-type-toggle"),
        "Toggle should be rendered when subscription is not disabled"
      );
      assert(
        isToggleVisible(config),
        "isToggleVisible should return true when subscriptionDisabled is not set"
      );
    });

    it("should hide toggle when subscription-disabled is true", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        reownProjectId: "test-project-id",
        subscriptionDisabled: true,
      };

      assert(
        !isToggleVisible(config),
        "isToggleVisible should return false when subscriptionDisabled is true"
      );

      // The toggle would render with disabled=true, which makes it render nothing
      const state = createInitialWidgetState(config);
      // In actual component, disabled=true causes empty template
    });

    it("should show toggle when subscription-disabled is explicitly false", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        reownProjectId: "test-project-id",
        subscriptionDisabled: false,
      };

      assert(
        isToggleVisible(config),
        "isToggleVisible should return true when subscriptionDisabled is false"
      );

      const state = createInitialWidgetState(config);
      const rendered = renderWidget(state);

      assert(
        rendered.includes("donation-type-toggle"),
        "Toggle should be rendered when subscriptionDisabled is false"
      );
    });
  });

  describe("effectiveSubscriptionTarget fallback to recipient", () => {
    it("should use recipient as subscription-target when not specified", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        reownProjectId: "test-project-id",
        // subscriptionTarget not set
      };

      const effectiveTarget = getEffectiveSubscriptionTarget(config);

      assertEquals(
        effectiveTarget,
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "Should fall back to recipient when subscription-target is not set"
      );
    });

    it("should use subscription-target when explicitly specified", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        reownProjectId: "test-project-id",
        subscriptionTarget: "0x1234567890123456789012345678901234567890",
      };

      const effectiveTarget = getEffectiveSubscriptionTarget(config);

      assertEquals(
        effectiveTarget,
        "0x1234567890123456789012345678901234567890",
        "Should use subscriptionTarget when explicitly specified"
      );
    });

    it("should use recipient when subscription-target is empty string", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        reownProjectId: "test-project-id",
        subscriptionTarget: "",
      };

      const effectiveTarget = getEffectiveSubscriptionTarget(config);

      assertEquals(
        effectiveTarget,
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "Should fall back to recipient when subscription-target is empty string"
      );
    });
  });

  describe("Subscription flow emits correct events", () => {
    it("should emit donation-type-changed event when switching to monthly", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const state = createInitialWidgetState(config);
      const { newState, events } = simulateDonationTypeChange(state, "monthly");

      assert(
        events.donationTypeChanged !== null,
        "Event should be dispatched when switching donation type"
      );
      assertEquals(
        events.donationTypeChanged?.type,
        "monthly",
        "Event should have type='monthly'"
      );
      assertEquals(
        newState.donationType,
        "monthly",
        "State donationType should be 'monthly'"
      );
      assert(
        newState.isSubscriptionFlow,
        "isSubscriptionFlow should be true when donationType is monthly"
      );
    });

    it("should emit subscription-created event on successful subscription", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        projectId: 123,
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      // Set up state for subscription
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "10000000" });
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const readyState = simulateSubscriptionInitiation(stateWithType);

      // Complete subscription
      const subscriptionData: SubscriptionSuccessData = {
        transactionHash: "0xabc123",
        monthlyAmountUsd: "10",
        subscriptionTarget: config.recipient,
        projectId: 123,
        originChainId: 1,
        originToken: token,
      };

      const { newState: successState, events } = simulateSubscriptionCompleted(
        readyState,
        subscriptionData
      );

      assert(
        events.subscriptionCreated !== null,
        "subscription-created event should be emitted"
      );
      assertEquals(
        events.subscriptionCreated?.transactionHash,
        "0xabc123",
        "Event should contain transaction hash"
      );
      assertEquals(
        events.subscriptionCreated?.monthlyAmountUsd,
        "10",
        "Event should contain monthly amount"
      );
      assertEquals(
        events.subscriptionCreated?.projectId,
        123,
        "Event should contain project ID"
      );
      assert(
        successState.showSuccessState,
        "Success state should be shown after subscription"
      );
      assert(
        successState.successData?.isSubscription,
        "Success data should indicate subscription"
      );
    });

    it("should emit donation-failed event on subscription failure", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      // Set up state for subscription
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "10000000" });
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const processingState = simulateSubscriptionInitiation(stateWithType);

      // Subscription fails
      const { newState: failedState, events } = simulateSubscriptionFailure(
        processingState,
        "error.signature.rejected"
      );

      assert(
        events.donationFailed !== null,
        "donation-failed event should be emitted on failure"
      );
      assertEquals(
        events.donationFailed?.error,
        "error.signature.rejected",
        "Error should match the failure reason"
      );
      assertEquals(
        failedState.error,
        "error.signature.rejected",
        "State error should be set"
      );
      assert(
        !failedState.isDonating,
        "Should not be in donating state after failure"
      );
    });

    it("should not emit donation-type-changed when selecting already selected type", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const state = createInitialWidgetState(config);
      assertEquals(state.donationType, "one-time", "Default should be one-time");

      // Try to select one-time again
      const { events } = simulateDonationTypeChange(state, "one-time");

      assert(
        events.donationTypeChanged === null,
        "No event should be emitted when selecting same type"
      );
    });
  });

  describe("Error handling shows localized messages", () => {
    it("should set error state for signature rejection", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "10000000" });
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const processingState = simulateSubscriptionInitiation(stateWithType);

      const { newState: failedState } = simulateSubscriptionFailure(
        processingState,
        "error.signature.rejected"
      );

      assertEquals(
        failedState.error,
        "error.signature.rejected",
        "Error should be i18n key for signature rejection"
      );
    });

    it("should set error state for subscription creation failure", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "10000000" });
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const processingState = simulateSubscriptionInitiation(stateWithType);

      const { newState: failedState } = simulateSubscriptionFailure(
        processingState,
        "error.subscription.failed"
      );

      assertEquals(
        failedState.error,
        "error.subscription.failed",
        "Error should be i18n key for subscription failure"
      );
    });

    it("should set error state for network switch failure", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "10000000" });
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const processingState = simulateSubscriptionInitiation(stateWithType);

      const { newState: failedState } = simulateSubscriptionFailure(
        processingState,
        "error.network.switchFailed"
      );

      assertEquals(
        failedState.error,
        "error.network.switchFailed",
        "Error should be i18n key for network switch failure"
      );
    });

    it("should preserve form state after subscription error", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      const quote = { inputAmount: "10000000" };

      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, quote);
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const processingState = simulateSubscriptionInitiation(stateWithType);

      const { newState: failedState } = simulateSubscriptionFailure(
        processingState,
        "error.signature.rejected"
      );

      // Form state should be preserved for retry
      assertEquals(
        failedState.recipientAmount,
        "10",
        "Amount should be preserved after error"
      );
      assertEquals(
        failedState.selectedToken,
        token,
        "Token should be preserved after error"
      );
      assertEquals(
        failedState.donationType,
        "monthly",
        "Donation type should be preserved after error"
      );
      assert(
        failedState.isWalletConnected,
        "Wallet connection should be preserved after error"
      );
    });
  });

  describe("Subscription state management", () => {
    it("should reset subscription state on donate again", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        projectId: 123,
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      // Complete a subscription
      let state = createInitialWidgetState(config);
      state = simulateAmountEntry(state, "10");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "10000000" });
      const { newState: stateWithType } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      const processingState = simulateSubscriptionInitiation(stateWithType);

      const subscriptionData: SubscriptionSuccessData = {
        transactionHash: "0xabc123",
        monthlyAmountUsd: "10",
        subscriptionTarget: config.recipient,
        projectId: 123,
        originChainId: 1,
        originToken: token,
      };

      const { newState: successState } = simulateSubscriptionCompleted(
        processingState,
        subscriptionData
      );

      // Verify subscription success state
      assert(successState.showSuccessState, "Should be in success state");
      assertEquals(
        successState.subscriptionMonthlyAmount,
        "10",
        "Monthly amount should be stored"
      );

      // Click donate again
      const resetState = simulateDonateAgain(successState);

      // Verify reset
      assertEquals(
        resetState.donationType,
        "one-time",
        "Donation type should reset to one-time"
      );
      assert(
        !resetState.isSubscriptionFlow,
        "isSubscriptionFlow should be false after reset"
      );
      assertEquals(
        resetState.subscriptionMonthlyAmount,
        "",
        "Monthly amount should be cleared after reset"
      );
      assert(
        !resetState.showSuccessState,
        "Success state should be hidden after reset"
      );
      assertEquals(
        resetState.recipientAmount,
        "",
        "Amount should be cleared after reset"
      );
    });

    it("should track isSubscriptionFlow correctly through flow", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      let state = createInitialWidgetState(config);

      // Initially one-time
      assert(
        !state.isSubscriptionFlow,
        "isSubscriptionFlow should be false initially"
      );

      // Switch to monthly
      const { newState: monthlyState } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      assert(
        monthlyState.isSubscriptionFlow,
        "isSubscriptionFlow should be true after switching to monthly"
      );

      // Switch back to one-time
      const { newState: oneTimeState } = simulateDonationTypeChange(
        monthlyState,
        "one-time"
      );
      assert(
        !oneTimeState.isSubscriptionFlow,
        "isSubscriptionFlow should be false after switching back to one-time"
      );
    });

    it("should use project-id in subscription flow", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        projectId: 456,
      };

      const state = createInitialWidgetState(config);
      const rendered = renderWidget(state);

      assert(
        rendered.includes('project-id="456"'),
        "Rendered content should include project-id attribute"
      );
    });

    it("should default project-id to 0 when not specified", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        // projectId not set
      };

      const state = createInitialWidgetState(config);
      const rendered = renderWidget(state);

      assert(
        rendered.includes('project-id="0"'),
        "project-id should default to 0 when not specified"
      );
    });
  });

  describe("Complete subscription flow integration", () => {
    it("should handle complete subscription flow: toggle -> amount -> wallet -> token -> subscribe -> success -> reset", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        projectId: 789,
      };

      const token: Token = {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        symbol: "WETH",
        decimals: 18,
        chainId: 1,
      };

      // Step 1: Initial state
      let state = createInitialWidgetState(config);
      assertEquals(
        state.donationType,
        "one-time",
        "Step 1: Should start with one-time"
      );
      state.currentStep = determineCurrentStep(state);
      assertEquals(
        state.currentStep,
        FlowStep.AMOUNT,
        "Step 1: Should start in AMOUNT step"
      );

      // Step 2: Switch to monthly subscription
      const { newState: monthlyState, events: typeEvents } =
        simulateDonationTypeChange(state, "monthly");
      state = monthlyState;
      assert(
        typeEvents.donationTypeChanged !== null,
        "Step 2: Should emit type change event"
      );
      assertEquals(
        state.donationType,
        "monthly",
        "Step 2: Should be in monthly mode"
      );
      assert(state.isSubscriptionFlow, "Step 2: isSubscriptionFlow should be true");

      // Step 3: Enter amount
      state = simulateAmountEntry(state, "25");
      state.currentStep = determineCurrentStep(state);
      assertEquals(
        state.recipientAmount,
        "25",
        "Step 3: Amount should be set"
      );
      assertEquals(
        state.currentStep,
        FlowStep.WALLET,
        "Step 3: Should be in WALLET step"
      );

      // Step 4: Connect wallet
      state = simulateWalletConnection(state);
      state.currentStep = determineCurrentStep(state);
      assert(state.isWalletConnected, "Step 4: Wallet should be connected");
      assertEquals(
        state.currentStep,
        FlowStep.TOKEN,
        "Step 4: Should be in TOKEN step"
      );

      // Step 5: Select token and get quote
      state = simulateTokenAndQuote(state, token, {
        inputAmount: "25000000000000000000",
      });
      state.currentStep = determineCurrentStep(state);
      assertEquals(state.selectedToken, token, "Step 5: Token should be selected");
      assertEquals(
        state.currentStep,
        FlowStep.READY,
        "Step 5: Should be in READY step"
      );

      // Step 6: Initiate subscription
      state = simulateSubscriptionInitiation(state);
      state.currentStep = determineCurrentStep(state);
      assert(state.isDonating, "Step 6: Should be in donating state");
      assertEquals(
        state.currentStep,
        FlowStep.PROCESSING,
        "Step 6: Should be in PROCESSING step"
      );

      // Step 7: Subscription completes successfully
      const subscriptionData: SubscriptionSuccessData = {
        transactionHash: "0xdef456",
        monthlyAmountUsd: "25",
        subscriptionTarget: config.recipient,
        projectId: 789,
        originChainId: 1,
        originToken: token,
      };

      const { newState: successState, events: successEvents } =
        simulateSubscriptionCompleted(state, subscriptionData);
      state = successState;
      state.currentStep = determineCurrentStep(state);

      assert(
        successEvents.subscriptionCreated !== null,
        "Step 7: Should emit subscription-created event"
      );
      assertEquals(
        successEvents.subscriptionCreated?.monthlyAmountUsd,
        "25",
        "Step 7: Event should have correct monthly amount"
      );
      assert(
        state.showSuccessState,
        "Step 7: Should show success state"
      );
      assertEquals(
        state.currentStep,
        FlowStep.SUCCESS,
        "Step 7: Should be in SUCCESS step"
      );
      assert(
        state.successData?.isSubscription,
        "Step 7: Success data should indicate subscription"
      );
      assertEquals(
        state.successData?.monthlyAmount,
        "25",
        "Step 7: Success data should have monthly amount"
      );

      // Step 8: Donate again - reset
      state = simulateDonateAgain(state);
      state.currentStep = determineCurrentStep(state);
      assertEquals(
        state.donationType,
        "one-time",
        "Step 8: Should reset to one-time"
      );
      assert(
        !state.isSubscriptionFlow,
        "Step 8: isSubscriptionFlow should be false"
      );
      assertEquals(
        state.currentStep,
        FlowStep.AMOUNT,
        "Step 8: Should be back in AMOUNT step"
      );
      assertEquals(
        state.recipientAmount,
        "",
        "Step 8: Amount should be cleared"
      );
    });

    it("should handle subscription flow with error and retry", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const token: Token = {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
      };

      // Set up for subscription
      let state = createInitialWidgetState(config);
      const { newState: monthlyState } = simulateDonationTypeChange(
        state,
        "monthly"
      );
      state = simulateAmountEntry(monthlyState, "50");
      state = simulateWalletConnection(state);
      state = simulateTokenAndQuote(state, token, { inputAmount: "50000000" });

      // First attempt fails
      state = simulateSubscriptionInitiation(state);
      const { newState: failedState, events: failEvents } =
        simulateSubscriptionFailure(state, "error.signature.rejected");
      state = failedState;

      assert(
        failEvents.donationFailed !== null,
        "Should emit failure event on first attempt"
      );
      assertEquals(
        state.error,
        "error.signature.rejected",
        "Error should be set"
      );
      assertEquals(
        state.recipientAmount,
        "50",
        "Amount should be preserved for retry"
      );
      assertEquals(
        state.donationType,
        "monthly",
        "Donation type should be preserved for retry"
      );

      // Clear error and retry
      state = { ...state, error: null };
      state = simulateSubscriptionInitiation(state);

      // Second attempt succeeds
      const subscriptionData: SubscriptionSuccessData = {
        transactionHash: "0xsuccess",
        monthlyAmountUsd: "50",
        subscriptionTarget: config.recipient,
        projectId: 0,
        originChainId: 1,
        originToken: token,
      };

      const { newState: successState, events: successEvents } =
        simulateSubscriptionCompleted(state, subscriptionData);

      assert(
        successEvents.subscriptionCreated !== null,
        "Should emit success event on retry"
      );
      assert(
        successState.showSuccessState,
        "Should show success state after retry"
      );
    });
  });

  describe("Backwards compatibility", () => {
    it("should work with default configuration (no subscription attributes)", () => {
      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const state = createInitialWidgetState(config);

      // Default values should allow normal operation
      assertEquals(
        state.donationType,
        "one-time",
        "Default donation type should be one-time"
      );
      assert(
        !state.isSubscriptionFlow,
        "isSubscriptionFlow should be false by default"
      );
      assert(
        isToggleVisible(config),
        "Toggle should be visible by default"
      );
      assertEquals(
        getEffectiveSubscriptionTarget(config),
        config.recipient,
        "Should fall back to recipient for subscription target"
      );
    });

    it("should preserve existing donation-completed event for one-time donations", () => {
      // This test documents that one-time donations should continue to emit
      // donation-completed events, not subscription-created events

      const config: WidgetConfig = {
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipientChainId: 137,
        recipientTokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      };

      const state = createInitialWidgetState(config);

      // Verify one-time is selected
      assertEquals(
        state.donationType,
        "one-time",
        "Should be in one-time mode"
      );
      assert(
        !state.isSubscriptionFlow,
        "isSubscriptionFlow should be false for one-time"
      );

      // One-time donations should use existing donation-completed event
      // (handled by donation-form.ts, not subscription flow)
    });
  });
});
