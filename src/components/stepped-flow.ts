import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token, WalletService, WalletAccount } from "../services/WalletService.ts";
import type { Token as LiFiToken, Route } from "@lifi/sdk";
import type { Chain, ChainService } from "../services/ChainService.ts";
import "./animated-step.ts";
import "./amount-input.ts";
import "./connect-wallet-button.ts";
import "./token-selector.ts";
import "./wallet-info.ts";
import "./donate-button.ts";

/**
 * Flow step type representing the current step in the donation flow
 */
export type FlowStep = "amount" | "connect" | "token" | "donate";

/**
 * Step visibility state interface
 */
export interface StepVisibility {
  amount: boolean;      // always true
  connect: boolean;     // true when amount > 0 and wallet disconnected
  token: boolean;       // true when wallet connected
  walletInfo: boolean;  // true when wallet connected
  donate: boolean;      // true when token selected and quote calculated
}

/**
 * Stepped Flow Component
 * 
 * Orchestrator component that manages the step-by-step donation flow.
 * Controls step visibility and state transitions based on user actions.
 * 
 * @element stepped-flow
 * 
 * @property {string} amount - Current donation amount (default: "")
 * @property {boolean} isWalletConnected - Whether wallet is connected (default: false)
 * @property {Token|null} selectedToken - Currently selected token (default: null)
 * @property {Route|null} quote - Calculated quote from LiFi (default: null)
 * @property {boolean} isQuoteLoading - Whether quote is being calculated (default: false)
 * @property {WalletService} walletService - Wallet service instance (required for wallet connection)
 * 
 * @fires step-change - Fired when the current step changes
 * @fires wallet-connected - Fired when wallet is connected
 * @fires wallet-disconnected - Fired when wallet is disconnected
 * @fires wallet-error - Fired when wallet connection fails
 * 
 * @example
 * ```html
 * <stepped-flow
 *   amount="100"
 *   ?is-wallet-connected="${true}"
 *   .selectedToken="${token}"
 *   .quote="${quote}"
 *   ?is-quote-loading="${false}"
 * ></stepped-flow>
 * ```
 */
@customElement("stepped-flow")
export class SteppedFlow extends LitElement {
  /** Current donation amount */
  @property({ type: String })
  accessor amount: string = "";

  /** Whether wallet is connected */
  @property({ type: Boolean, attribute: "is-wallet-connected" })
  accessor isWalletConnected: boolean = false;

  /** Currently selected token */
  @property({ type: Object })
  accessor selectedToken: Token | null = null;

  /** Calculated quote from LiFi */
  @property({ type: Object })
  accessor quote: Route | null = null;

  /** Whether quote is being calculated */
  @property({ type: Boolean, attribute: "is-quote-loading" })
  accessor isQuoteLoading: boolean = false;

  /** Recipient token information (for display in amount input) */
  @property({ type: Object })
  accessor recipientToken: Token | null = null;

  /** Label for the amount input */
  @property({ type: String })
  accessor amountLabel: string = "Amount";

  /** Wallet service instance */
  @property({ type: Object })
  accessor walletService: WalletService | null = null;

  /** Chain service instance */
  @property({ type: Object })
  accessor chainService: ChainService | null = null;

  /** Available tokens for selection */
  @property({ type: Array })
  accessor availableTokens: LiFiToken[] = [];

  /** Available chains */
  @property({ type: Array })
  accessor chains: Chain[] = [];

  /** Whether tokens are being loaded */
  @property({ type: Boolean, attribute: "is-loading-tokens" })
  accessor isLoadingTokens: boolean = false;

  /** Whether donation is in progress */
  @property({ type: Boolean, attribute: "is-donating" })
  accessor isDonating: boolean = false;

  /** Whether the component is disabled */
  @property({ type: Boolean })
  accessor disabled: boolean = false;

  /** Current step in the flow */
  @state()
  private accessor currentStep: FlowStep = "amount";

  /** Current chain ID from wallet */
  @state()
  private accessor chainId: number | null = null;

  /** Cleanup functions for wallet listeners */
  private cleanupFunctions: Array<() => void> = [];

  /** Step visibility state */
  @state()
  private accessor stepVisibility: StepVisibility = {
    amount: true,
    connect: false,
    token: false,
    walletInfo: false,
    donate: false,
  };

  static override styles = css`
    :host {
      display: block;
    }

    .stepped-flow-container {
      min-height: 400px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.setupWalletListeners();
    this.updateWalletConnectionState();
  }

  override firstUpdated() {
    // Initialize step visibility after first render when all properties are set
    this.updateStepVisibility();
    this.updateCurrentStep();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  override willUpdate(changedProperties: Map<string | number | symbol, unknown>) {
    // Re-setup wallet listeners if walletService changes
    if (changedProperties.has("walletService")) {
      this.cleanup();
      this.setupWalletListeners();
      this.updateWalletConnectionState();
    }

    // Update step visibility based on state changes
    if (
      changedProperties.has("amount") ||
      changedProperties.has("isWalletConnected") ||
      changedProperties.has("selectedToken") ||
      changedProperties.has("quote") ||
      changedProperties.has("isQuoteLoading")
    ) {
      this.updateStepVisibility();
      this.updateCurrentStep();
    }
  }

  /**
   * Updates the current step based on the current state
   */
  private updateCurrentStep(): void {
    const previousStep = this.currentStep;
    let newStep: FlowStep = "amount";

    // Determine current step based on state machine rules
    // When amount is cleared (becomes zero/empty), transition back to "amount" step
    if (this.hasValidAmount()) {
      if (!this.isWalletConnected) {
        newStep = "connect";
      } else if (this.isWalletConnected && !this.selectedToken) {
        newStep = "token";
      } else if (this.selectedToken && this.quote && !this.isQuoteLoading) {
        newStep = "donate";
      } else if (this.selectedToken) {
        newStep = "token"; // Waiting for quote
      } else {
        newStep = "connect";
      }
    } else {
      newStep = "amount";
    }

    // Update current step if it changed
    if (newStep !== this.currentStep) {
      this.currentStep = newStep;
      this.dispatchStepChangeEvent(previousStep, newStep);
    }
  }

  /**
   * Dispatches step-change event when step transitions
   */
  private dispatchStepChangeEvent(previousStep: FlowStep, currentStep: FlowStep): void {
    const direction: "forward" | "backward" = this.getStepDirection(previousStep, currentStep);
    
    this.dispatchEvent(
      new CustomEvent("step-change", {
        detail: {
          previousStep,
          currentStep,
          direction,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Determines if step transition is forward or backward
   */
  private getStepDirection(previousStep: FlowStep, currentStep: FlowStep): "forward" | "backward" {
    const stepOrder: FlowStep[] = ["amount", "connect", "token", "donate"];
    const previousIndex = stepOrder.indexOf(previousStep);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    return currentIndex > previousIndex ? "forward" : "backward";
  }

  /**
   * Checks if the current amount value is valid (positive number)
   * Handles edge cases: empty string, zero, negative, whitespace, invalid numbers
   * 
   * @returns true if amount is a valid positive number, false otherwise
   */
  private hasValidAmount(): boolean {
    if (!this.amount || this.amount.trim() === "") {
      return false;
    }
    const amountValue = parseFloat(this.amount);
    return !isNaN(amountValue) && amountValue > 0;
  }

  /**
   * Updates the step visibility state based on current component state
   * Implements strict iterative disclosure:
   * - Amount step always visible
   * - Connect step visible when amount > 0 and wallet disconnected
   * - Token/walletInfo steps visible only when wallet connected (not dependent on amount)
   * - Donate button visible when wallet connected AND token selected AND quote ready AND not loading
   * 
   * Handles amount clearing: When amount changes from positive to zero/empty,
   * the connect step visibility transitions from true to false, ensuring smooth
   * transition back to amount-only state.
   * 
   * This implements the visibility logic from the design document to ensure
   * proper progressive disclosure of UI elements.
   */
  private updateStepVisibility(): void {
    // Calculate visibility conditions
    const hasValidAmount = this.hasValidAmount();
    const isWalletConnected = this.isWalletConnected;
    const hasTokenAndQuote = this.selectedToken !== null && 
                             this.quote !== null && 
                             !this.isQuoteLoading;

    // Apply strict iterative disclosure rules
    // When amount is cleared (becomes zero/empty), connect step visibility
    // automatically transitions to false, hiding the connect button
    this.stepVisibility = {
      amount: true, // Always visible
      connect: hasValidAmount && !isWalletConnected, // Hide when amount is zero/empty (handles amount clearing)
      token: isWalletConnected, // Only visible when wallet connected (not dependent on amount)
      walletInfo: isWalletConnected, // Only visible when wallet connected (not dependent on amount)
      donate: isWalletConnected && hasTokenAndQuote, // Only visible when token selected AND quote ready AND not loading
    };
  }

  /**
   * Gets the current step visibility state
   */
  getStepVisibility(): StepVisibility {
    return { ...this.stepVisibility };
  }

  /**
   * Gets the current step
   */
  getCurrentStep(): FlowStep {
    return this.currentStep;
  }

  /**
   * Sets up wallet event listeners
   */
  private setupWalletListeners(): void {
    if (!this.walletService) return;

    // Listen for account changes (wallet connected)
    const unsubscribeAccount = this.walletService.onAccountChanged(
      (account: WalletAccount) => {
        this.isWalletConnected = true;
        this.chainId = account.chainId;
        this.dispatchEvent(
          new CustomEvent("wallet-connected", {
            detail: account,
            bubbles: true,
            composed: true,
          })
        );
      }
    );

    // Listen for chain changes
    const unsubscribeChain = this.walletService.onChainChanged(
      (newChainId: number) => {
        this.chainId = newChainId;
        this.dispatchEvent(
          new CustomEvent("network-switched", {
            detail: { chainId: newChainId },
            bubbles: true,
            composed: true,
          })
        );
      }
    );

    // Listen for disconnect
    const unsubscribeDisconnect = this.walletService.onDisconnect(() => {
      this.isWalletConnected = false;
      this.chainId = null;
      this.dispatchEvent(
        new CustomEvent("wallet-disconnected", {
          bubbles: true,
          composed: true,
        })
      );
    });

    this.cleanupFunctions.push(unsubscribeAccount, unsubscribeChain, unsubscribeDisconnect);
  }

  /**
   * Updates wallet connection state from wallet service
   */
  private updateWalletConnectionState(): void {
    if (this.walletService) {
      this.isWalletConnected = this.walletService.isConnected();
      const account = this.walletService.getAccount();
      if (account) {
        this.chainId = account.chainId;
      }
    }
  }

  /**
   * Cleans up wallet listeners
   */
  private cleanup(): void {
    this.cleanupFunctions.forEach((fn) => fn());
    this.cleanupFunctions = [];
  }

  /**
   * Handles amount change events from amount-input
   */
  private handleAmountChange(event: CustomEvent<{ value: string }>) {
    this.amount = event.detail.value;
    
    // Emit amount-change event for parent components
    this.dispatchEvent(
      new CustomEvent("amount-change", {
        detail: { value: event.detail.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles wallet error events from connect-wallet-button
   */
  private handleWalletError(event: CustomEvent<{ error: string }>) {
    // Forward the error event to parent components
    this.dispatchEvent(
      new CustomEvent("wallet-error", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles token selection events from token-selector
   */
  private handleTokenSelect(event: CustomEvent<LiFiToken>) {
    const token = event.detail;
    this.selectedToken = token;
    
    // Emit token-selected event for parent components
    this.dispatchEvent(
      new CustomEvent("token-selected", {
        detail: token,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles wallet disconnect events from wallet-info
   */
  private handleWalletDisconnectFromInfo() {
    // The wallet service listener will handle the state update
    // This just forwards the event
    this.dispatchEvent(
      new CustomEvent("wallet-disconnected", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles network switch events from wallet-info
   */
  private handleNetworkSwitchFromInfo(event: CustomEvent<{ chainId: number }>) {
    this.dispatchEvent(
      new CustomEvent("network-switched", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles wallet error events from wallet-info
   */
  private handleWalletErrorFromInfo(event: CustomEvent<{ error: string }>) {
    this.dispatchEvent(
      new CustomEvent("wallet-error", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles donate button click events
   */
  private handleDonateClick() {
    this.dispatchEvent(
      new CustomEvent("donate-click", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Determines if donate button should be disabled
   */
  private get canDonate(): boolean {
    const account = this.walletService?.getAccount();

    return (
      !this.disabled &&
      !this.isDonating &&
      this.hasValidAmount() &&
      !!this.selectedToken &&
      !!this.quote &&
      !this.isQuoteLoading &&
      !!account?.address &&
      account.chainId === this.selectedToken.chainId
    );
  }

  /**
   * Calculates the user pay amount from the quote
   * This is the amount the user will pay in the selected token
   */
  private getUserPayAmount(): string | null {
    if (!this.quote || !this.selectedToken) {
      return null;
    }

    // Validate that fromAmount exists and is a valid value
    if (!this.quote.fromAmount || this.quote.fromAmount === undefined) {
      return null;
    }

    try {
      const fromAmount = BigInt(this.quote.fromAmount);
      const decimals = this.selectedToken.decimals;
      const divisor = BigInt(10 ** decimals);
      const amount = Number(fromAmount) / Number(divisor);
      return amount.toFixed(6);
    } catch (error) {
      console.error("Failed to calculate user pay amount:", error);
      return null;
    }
  }

  override render() {
    return html`
      <div class="stepped-flow-container">
        <!-- Step 1: Amount Input (always visible) -->
        <animated-step visible="${this.stepVisibility.amount}">
          <amount-input
            label="${this.amountLabel}"
            .value="${this.amount}"
            .selectedToken="${this.selectedToken}"
            .recipientToken="${this.recipientToken}"
            .quote="${this.quote}"
            .isQuoteLoading="${this.isQuoteLoading}"
            @amount-change="${this.handleAmountChange}"
          ></amount-input>
        </animated-step>
        
        <!-- Step 2: Connect Wallet Button (visible after valid amount) -->
        ${this.walletService ? html`
          <animated-step 
            visible="${this.stepVisibility.connect}"
            animation-delay="100"
          >
            <connect-wallet-button
              .walletService="${this.walletService}"
              @wallet-error="${this.handleWalletError}"
            ></connect-wallet-button>
          </animated-step>
        ` : null}
        
        <!-- Step 3: Token Selector (visible after wallet connected) -->
        <animated-step 
          visible="${this.stepVisibility.token}"
          animation-delay="200"
        >
          <token-selector
            .tokens="${this.availableTokens}"
            .selectedToken="${this.selectedToken}"
            .chains="${this.chains}"
            .isLoading="${this.isLoadingTokens}"
            .currentChainId="${this.chainId}"
            @token-selected="${this.handleTokenSelect}"
          ></token-selector>
        </animated-step>
        
        <!-- Step 4: Wallet Info and Donate Button (visible after connection and token selection) -->
        ${this.walletService ? html`
          <animated-step 
            visible="${this.stepVisibility.walletInfo}"
            animation-delay="300"
          >
            <wallet-info
              .walletService="${this.walletService}"
              .selectedToken="${this.selectedToken}"
              ?disabled="${this.disabled}"
              @wallet-disconnected="${this.handleWalletDisconnectFromInfo}"
              @network-switched="${this.handleNetworkSwitchFromInfo}"
              @wallet-error="${this.handleWalletErrorFromInfo}"
            ></wallet-info>
          </animated-step>
        ` : null}
        
        <animated-step 
          visible="${this.stepVisibility.donate}"
          animation-delay="400"
        >
          <donate-button
            ?disabled="${!this.canDonate}"
            .loading="${this.isDonating}"
            .amount="${this.getUserPayAmount() || ""}"
            .tokenSymbol="${this.selectedToken?.symbol || ""}"
            @donate-click="${this.handleDonateClick}"
          ></donate-button>
        </animated-step>
        
        <slot></slot>
      </div>
    `;
  }
}

