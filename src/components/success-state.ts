import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./confetti-animation.ts";
import { t } from "../services/index.ts";

/**
 * Success State Component
 * 
 * Displays a celebratory success state after a successful donation transaction.
 * Includes transaction summary and confetti animation.
 * 
 * @element success-state
 * 
 * @attr {string} amount - Transaction amount (required)
 * @attr {string} token-symbol - Token symbol (required)
 * @attr {string} chain-name - Chain name (required)
 * @attr {number} timestamp - Transaction timestamp in milliseconds (required)
 * @attr {string} recipient-address - Recipient wallet address (required)
 * @attr {string} recipient-name - Recipient name (optional)
 * @attr {string} success-message - Custom success message (optional, default: "Thank you for your donation!")
 * @attr {string} donate-again-text - Custom text for donate again button (optional, default: "Donate Again")
 * @attr {boolean} confetti-enabled - Whether confetti animation is enabled (optional, default: true)
 * @attr {string} confetti-colors - Comma-separated list of hex colors for confetti (optional)
 * @attr {boolean} is-subscription - Whether this is a subscription success (optional, default: false)
 * @attr {string} monthly-amount - Monthly subscription amount in USD (optional)
 *
 * @fires donate-again - Fired when user clicks the "donate again" button
 * 
 * @example
 * ```html
 * <success-state
 *   amount="1.5"
 *   token-symbol="ETH"
 *   chain-name="Ethereum"
 *   timestamp="1234567890000"
 *   recipient-address="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
 *   confetti-enabled="true">
 * </success-state>
 * ```
 */
@customElement("success-state")
export class SuccessState extends LitElement {
  /** Transaction amount (required) */
  @property({ type: String, attribute: "amount" })
  accessor amount: string = "";

  /** Token symbol (required) */
  @property({ type: String, attribute: "token-symbol" })
  accessor tokenSymbol: string = "";

  /** Chain name (required) */
  @property({ type: String, attribute: "chain-name" })
  accessor chainName: string = "";

  /** Transaction timestamp in milliseconds (required) */
  @property({ type: Number, attribute: "timestamp" })
  accessor timestamp: number = 0;

  /** Recipient wallet address (required) */
  @property({ type: String, attribute: "recipient-address" })
  accessor recipientAddress: string = "";

  /** Recipient name (optional) */
  @property({ type: String, attribute: "recipient-name" })
  accessor recipientName: string = "";

  /** Custom success message (optional, default: uses i18n) */
  @property({ type: String, attribute: "success-message" })
  accessor successMessage: string = "";

  /** Custom text for donate again button (optional, default: uses i18n) */
  @property({ type: String, attribute: "donate-again-text" })
  accessor donateAgainText: string = "";

  /** Whether confetti animation is enabled (optional, default: true) */
  @property({ type: Boolean, attribute: "confetti-enabled" })
  accessor confettiEnabled: boolean = true;

  /** Comma-separated list of hex colors for confetti (optional) */
  @property({ type: String, attribute: "confetti-colors" })
  accessor confettiColors: string = "";

  /** Whether this is a subscription success (optional, default: false) */
  @property({ type: Boolean, attribute: "is-subscription" })
  accessor isSubscription: boolean = false;

  /** Monthly subscription amount in USD (optional) */
  @property({ type: String, attribute: "monthly-amount" })
  accessor monthlyAmount: string = "";

  /** Wallet address of the subscriber (optional, for Papaya management link) */
  @property({ type: String, attribute: "wallet-address" })
  accessor walletAddress: string = "";

  /**
   * Get Papaya Finance management URL for subscription
   */
  private get papayaManagementUrl(): string {
    if (!this.walletAddress) return "";
    return `https://app.papaya.finance/wallet/${this.walletAddress}#Subscriptions`;
  }

  static override styles = css`
    :host {
      display: block;
      position: relative;
      padding: 2rem 1.5rem;
      text-align: center;
    }

    .success-container {
      position: relative;
      z-index: 1;
    }

    .success-icon {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, oklch(60% 0.19 250), oklch(70% 0.19 250));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      font-weight: 700;
      box-shadow: 0 4px 12px oklch(60% 0.19 250 / 0.3);
    }

    :host(.dark) .success-icon {
      background: linear-gradient(135deg, oklch(50% 0.19 250), oklch(60% 0.19 250));
    }

    .success-message {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-foreground);
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }

    .success-message:focus {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
      border-radius: calc(var(--radius) - 2px);
    }

    .success-message-amount {
      color: var(--color-accent);
    }

    .transaction-summary {
      margin: 1.5rem 0;
      padding: 1rem;
      background: var(--color-secondary);
      border-radius: calc(var(--radius) - 2px);
      text-align: left;
    }

    .transaction-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--color-border);
    }

    .transaction-detail:last-child {
      border-bottom: none;
    }

    .transaction-detail-label {
      color: var(--color-muted-foreground);
      font-weight: 500;
    }

    .transaction-detail-value {
      color: var(--color-foreground);
      font-weight: 600;
      text-align: right;
      word-break: break-all;
    }

    .transaction-timestamp {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }

    .donate-again-button {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: var(--color-accent);
      border: none;
      border-radius: calc(var(--radius) - 2px);
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      min-width: 160px;
    }

    .donate-again-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px var(--color-accent) / 0.3;
    }

    .donate-again-button:active {
      transform: translateY(0);
    }

    .donate-again-button:focus {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    /* Subscription Management Section */
    .management-section {
      margin-top: 1rem;
      padding: 1rem;
      background: oklch(from var(--color-accent) l c h / 0.1);
      border-radius: calc(var(--radius) - 2px);
      text-align: center;
    }

    .management-text {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      margin: 0 0 0.75rem 0;
    }

    .management-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      background: var(--color-accent);
      color: var(--color-background);
      border-radius: calc(var(--radius) - 4px);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: opacity 0.2s ease;
    }

    .management-link:hover {
      opacity: 0.9;
    }

    .management-link:focus {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .management-link svg {
      width: 1rem;
      height: 1rem;
    }

    .cancel-hint {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin: 0.75rem 0 0 0;
    }

    /* Mobile responsive styles */
    @container donation-widget (max-width: 400px) {
      :host {
        padding: 1.5rem 1rem;
      }

      .success-icon {
        width: 3rem;
        height: 3rem;
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }

      .success-message {
        font-size: 1.25rem;
      }

      .transaction-summary {
        padding: 0.75rem;
        margin: 1rem 0;
      }

      .transaction-detail {
        padding: 0.375rem 0;
        font-size: 0.8125rem;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .transaction-detail-value {
        font-size: 0.8125rem;
      }

      .donate-again-button {
        margin-top: 1rem;
        padding: 0.625rem 1.5rem;
        font-size: 0.9375rem;
        min-width: 140px;
      }

      .management-section {
        padding: 0.75rem;
        margin-top: 0.75rem;
      }

      .management-text {
        font-size: 0.8125rem;
        margin-bottom: 0.5rem;
      }

      .management-link {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }

      .cancel-hint {
        font-size: 0.6875rem;
        margin-top: 0.5rem;
      }
    }
  `;

  /**
   * Format timestamp to readable date string
   */
  private formatTimestamp(timestamp: number): string {
    if (!timestamp || timestamp <= 0) {
      return "";
    }

    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Failed to format timestamp:", error);
      return "";
    }
  }

  /**
   * Format address to shortened version (first 6 + last 4 characters)
   */
  private formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Handle donate again button click
   */
  private handleDonateAgain() {
    this.dispatchEvent(
      new CustomEvent("donate-again", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Lifecycle: Called after first update
   * Manages focus for accessibility when success state appears
   */
  override firstUpdated() {
    // Focus management: Move focus to success message when component appears
    // This helps screen reader users and keyboard users know the state has changed
    this.updateComplete.then(() => {
      const successMessage = this.shadowRoot?.querySelector('.success-message') as HTMLElement;
      if (successMessage) {
        // Use setTimeout to ensure the element is fully rendered and accessible
        setTimeout(() => {
          successMessage.focus();
        }, 100);
      }
    });
  }

  /**
   * Render success message with amount interpolation (returns string for text content)
   */
  private renderSuccessMessage(): string {
    // For subscriptions, use the subscription-specific message
    if (this.isSubscription) {
      const subscriptionMessage = this.successMessage || t("success.subscription.message");

      // If monthlyAmount is provided, include it in the message
      if (this.monthlyAmount) {
        // Replace {amount} placeholder if present
        if (subscriptionMessage.includes("{amount}") || subscriptionMessage.includes("{{amount}}")) {
          return subscriptionMessage.replace(/\{?\{?amount\}?\}?/g, `$${this.monthlyAmount}`);
        }
        // Otherwise append the amount info
        return `${subscriptionMessage} $${this.monthlyAmount}/month`;
      }

      return subscriptionMessage;
    }

    // Standard donation message
    let message = this.successMessage || t("success.defaultMessage");

    // Interpolate amount if present in message template
    if (this.amount) {
      const amountText = this.tokenSymbol
        ? `${this.amount} ${this.tokenSymbol}`
        : this.amount;

      // Replace {amount} or {{amount}} placeholders
      message = message.replace(/\{?\{?amount\}?\}?/g, amountText);

      // If no placeholder found and amount not already in message, append amount
      if (!message.includes(this.amount)) {
        message = `${message} ${t("success.youDonated", { amount: amountText })}`;
      }
    }

    return message;
  }

  /**
   * Render success message as HTML with highlighted amount
   */
  private renderSuccessMessageHtml() {
    const message = this.renderSuccessMessage();

    // For subscriptions, highlight the monthly amount
    if (this.isSubscription && this.monthlyAmount) {
      const amountText = `$${this.monthlyAmount}/month`;
      const parts = message.split(amountText);

      if (parts.length === 1) {
        // Try without "/month" suffix
        const simpleAmountText = `$${this.monthlyAmount}`;
        const simpleParts = message.split(simpleAmountText);

        if (simpleParts.length === 1) {
          return html`${message}`;
        }

        return html`
          ${simpleParts.map((part, index) => {
            if (index === simpleParts.length - 1) {
              return html`${part}`;
            }
            return html`
              ${part}<span class="success-message-amount">${simpleAmountText}</span>
            `;
          })}
        `;
      }

      return html`
        ${parts.map((part, index) => {
          if (index === parts.length - 1) {
            return html`${part}`;
          }
          return html`
            ${part}<span class="success-message-amount">${amountText}</span>
          `;
        })}
      `;
    }

    // Standard donation amount highlighting
    if (!this.amount) {
      return html`${message}`;
    }

    const amountText = this.tokenSymbol
      ? `${this.amount} ${this.tokenSymbol}`
      : this.amount;

    // Split message by amount text to highlight it
    const parts = message.split(amountText);

    if (parts.length === 1) {
      // Amount not found in message, return as-is
      return html`${message}`;
    }

    // Render with highlighted amount
    return html`
      ${parts.map((part, index) => {
        if (index === parts.length - 1) {
          return html`${part}`;
        }
        return html`
          ${part}<span class="success-message-amount">${amountText}</span>
        `;
      })}
    `;
  }

  override render() {
    return html`
      <!-- Confetti Animation -->
      <confetti-animation
        .enabled=${this.confettiEnabled}
        .colors=${this.confettiColors}
      ></confetti-animation>

      <!-- Success Content -->
      <div class="success-container">
        <!-- Success Icon -->
        <div class="success-icon" aria-hidden="true">✓</div>

        <!-- Success Message -->
        <div 
          class="success-message" 
          role="alert" 
          aria-live="polite"
          aria-atomic="true"
          tabindex="-1"
          id="success-message"
        >
          ${this.renderSuccessMessageHtml()}
        </div>

        <!-- Transaction Summary -->
        <div class="transaction-summary" role="region" aria-label="${t("success.transactionDetails")}">
          <!-- Amount and Token -->
          <div class="transaction-detail">
            <span class="transaction-detail-label" id="amount-label">${t("success.amount")}</span>
            <span
              class="transaction-detail-value"
              aria-labelledby="amount-label"
              aria-label="${this.isSubscription ? `Monthly subscription: $${this.monthlyAmount}/month` : `Donation amount: ${this.amount} ${this.tokenSymbol}`}"
            >
              ${this.isSubscription && this.monthlyAmount
                ? `$${this.monthlyAmount}/month`
                : `${this.amount} ${this.tokenSymbol}`}
            </span>
          </div>

          <!-- Token and Chain -->
          <div class="transaction-detail">
            <span class="transaction-detail-label" id="network-label">${t("success.network")}</span>
            <span 
              class="transaction-detail-value"
              aria-labelledby="network-label"
              aria-label="Blockchain network: ${this.chainName}"
            >
              ${this.chainName}
            </span>
          </div>

          <!-- Recipient -->
          ${this.recipientAddress
            ? html`
                <div class="transaction-detail">
                  <span class="transaction-detail-label" id="recipient-label">${t("success.recipient")}</span>
                  <span 
                    class="transaction-detail-value"
                    aria-labelledby="recipient-label"
                    aria-label="Recipient address: ${this.recipientAddress}"
                  >
                    ${this.formatAddress(this.recipientAddress)}
                  </span>
                </div>
              `
            : ""}

          <!-- Timestamp -->
          ${this.timestamp
            ? html`
                <div class="transaction-detail">
                  <span class="transaction-detail-label" id="timestamp-label">${t("success.time")}</span>
                  <span 
                    class="transaction-detail-value transaction-timestamp"
                    aria-labelledby="timestamp-label"
                    aria-label="Transaction time: ${this.formatTimestamp(this.timestamp)}"
                  >
                    ${this.formatTimestamp(this.timestamp)}
                  </span>
                </div>
              `
            : ""}
        </div>

        <!-- Subscription Management Section -->
        ${this.isSubscription && this.walletAddress ? html`
          <div class="management-section">
            <p class="management-text">${t("success.subscription.manageText")}</p>
            <a
              href="${this.papayaManagementUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="management-link"
            >
              ${t("success.subscription.manageLink")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
            <p class="cancel-hint">${t("success.subscription.cancelHint")}</p>
          </div>
        ` : ""}

        <!-- Donate Again Button -->
        <button
          class="donate-again-button"
          @click=${this.handleDonateAgain}
          aria-label="${t("success.donateAgain")}"
          aria-describedby="success-message"
        >
          ${this.donateAgainText || t("success.donateAgain")}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "success-state": SuccessState;
  }
}

