import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { t } from "../services/index.ts";

/**
 * Data emitted when user confirms subscription setup
 */
export interface SubscriptionSetupData {
  /** Monthly subscription amount in USD */
  monthlyAmount: string;
  /** Number of months for deposit (1, 3, 6, or 12) */
  depositMonths: number;
  /** Total deposit amount (monthlyAmount * depositMonths) */
  totalDeposit: string;
}

/**
 * Subscription Setup Screen Component
 *
 * Displays explanation of subscription process and deposit month selector.
 * Shows before starting the actual subscription flow.
 *
 * @element subscription-setup-screen
 *
 * @attr {string} monthly-amount - Monthly subscription amount in USD
 * @attr {string} recipient-name - Optional recipient name for display
 *
 * @fires subscription-continue - User clicked continue, ready to start flow
 * @fires subscription-back - User clicked back, return to form
 */
@customElement("subscription-setup-screen")
export class SubscriptionSetupScreen extends LitElement {
  /** Monthly subscription amount in USD */
  @property({ type: String, attribute: "monthly-amount" })
  accessor monthlyAmount: string = "";

  /** Optional recipient name */
  @property({ type: String, attribute: "recipient-name" })
  accessor recipientName: string = "";

  /** Selected number of months for deposit */
  @state()
  private accessor selectedMonths: number = 1;

  /** Available month options */
  private readonly monthOptions = [1, 3, 6, 12];

  /** Calculate total deposit amount */
  private get totalDeposit(): string {
    const monthly = parseFloat(this.monthlyAmount) || 0;
    return (monthly * this.selectedMonths).toFixed(2);
  }

  /** Calculate per-second amount for streaming visualization */
  private get perSecondAmount(): string {
    const monthly = parseFloat(this.monthlyAmount) || 0;
    const perSecond = monthly / (30 * 24 * 60 * 60); // seconds in a month
    // Use enough decimal places to show meaningful digits for small amounts
    // $1/mo ≈ $0.00000039/sec, so we need at least 8 decimals
    return perSecond.toFixed(8);
  }

  /**
   * Handle month selection
   */
  private handleMonthSelect(months: number): void {
    this.selectedMonths = months;
  }

  /**
   * Handle continue button click - emit subscription-continue event
   */
  private handleContinue(): void {
    this.dispatchEvent(
      new CustomEvent<SubscriptionSetupData>("subscription-continue", {
        detail: {
          monthlyAmount: this.monthlyAmount,
          depositMonths: this.selectedMonths,
          totalDeposit: this.totalDeposit,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Handle back button click - emit subscription-back event
   */
  private handleBack(): void {
    this.dispatchEvent(
      new CustomEvent("subscription-back", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  static override styles = css`
    :host {
      display: block;
    }

    .setup-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .setup-header {
      text-align: center;
    }

    .setup-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 0.5rem 0;
    }

    .setup-subtitle {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      margin: 0;
    }

    .explanation-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .explanation-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--color-muted);
      border-radius: calc(var(--radius) - 4px);
    }

    .explanation-icon {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--color-accent);
      color: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .explanation-content h4 {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
      margin: 0 0 0.25rem 0;
    }

    .explanation-content p {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin: 0;
      line-height: 1.4;
    }

    .deposit-section {
      padding: 1rem;
      background: var(--color-secondary);
      border-radius: calc(var(--radius) - 2px);
    }

    .deposit-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
      margin-bottom: 0.75rem;
    }

    .month-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .month-option {
      flex: 1;
      padding: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
      color: var(--color-foreground);
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;
    }

    .month-option:hover {
      border-color: var(--color-accent);
    }

    .month-option.selected {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-background);
    }

    .deposit-summary {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }

    .summary-row.total {
      font-weight: 600;
      color: var(--color-foreground);
    }

    .summary-value {
      font-weight: 600;
    }

    .refund-notice {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin: 0.75rem 0 0 0;
      padding: 0.5rem;
      background: oklch(from var(--color-accent) l c h / 0.1);
      border-radius: calc(var(--radius) - 4px);
      line-height: 1.4;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .btn-back {
      flex: 1;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      color: var(--color-foreground);
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-back:hover {
      background: var(--color-secondary);
    }

    .btn-continue {
      flex: 2;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      background: var(--color-primary);
      border: none;
      border-radius: calc(var(--radius) - 2px);
      color: var(--color-background);
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .btn-continue:hover {
      opacity: 0.9;
    }

    .streaming-visualization {
      padding: 1rem;
      background: linear-gradient(
        135deg,
        var(--color-muted) 0%,
        var(--color-secondary) 100%
      );
      border-radius: calc(var(--radius) - 4px);
      margin-bottom: 1rem;
    }

    .streaming-rate {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .rate-monthly {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    .rate-separator {
      color: var(--color-muted-foreground);
    }

    .rate-persecond {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-accent);
      font-family: ui-monospace, monospace;
    }

    .streaming-bar {
      height: 8px;
      background: var(--color-border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .streaming-progress {
      height: 100%;
      width: 60%;
      background: linear-gradient(
        90deg,
        var(--color-accent) 0%,
        oklch(60% 0.15 250) 100%
      );
      border-radius: 4px;
      animation: streamingPulse 2s ease-in-out infinite;
    }

    @keyframes streamingPulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    .streaming-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      color: var(--color-muted-foreground);
    }
  `;

  override render() {
    return html`
      <div class="setup-container">
        <!-- Header -->
        <div class="setup-header">
          <h2 class="setup-title">${t("subscription.setup.title")}</h2>
          <p class="setup-subtitle">${t("subscription.setup.subtitle")}</p>
        </div>

        <!-- Streaming Visualization -->
        <div class="streaming-visualization">
          <div class="streaming-rate">
            <span class="rate-monthly">$${this.monthlyAmount}/mo</span>
            <span class="rate-separator">=</span>
            <span class="rate-persecond">$${this.perSecondAmount}/sec</span>
          </div>
          <div class="streaming-bar">
            <div class="streaming-progress"></div>
          </div>
          <div class="streaming-labels">
            <span>${t("subscription.setup.yourDeposit")}</span>
            <span>${t("subscription.setup.recipient")}</span>
          </div>
        </div>

        <!-- Explanation Section -->
        <div class="explanation-section">
          <div class="explanation-item">
            <div class="explanation-icon">1</div>
            <div class="explanation-content">
              <h4>${t("subscription.setup.step1.title")}</h4>
              <p>${t("subscription.setup.step1.description")}</p>
            </div>
          </div>

          <div class="explanation-item">
            <div class="explanation-icon">2</div>
            <div class="explanation-content">
              <h4>${t("subscription.setup.step2.title")}</h4>
              <p>${t("subscription.setup.step2.description")}</p>
            </div>
          </div>

          <div class="explanation-item">
            <div class="explanation-icon">3</div>
            <div class="explanation-content">
              <h4>${t("subscription.setup.step3.title")}</h4>
              <p>${t("subscription.setup.step3.description")}</p>
            </div>
          </div>
        </div>

        <!-- Deposit Months Selector -->
        <div class="deposit-section">
          <label class="deposit-label"
            >${t("subscription.setup.depositLabel")}</label
          >
          <div class="month-selector">
            ${this.monthOptions.map(
              (months) => html`
                <button
                  class="month-option ${this.selectedMonths === months
                    ? "selected"
                    : ""}"
                  @click=${() => this.handleMonthSelect(months)}
                >
                  ${months}
                  ${t(
                    months === 1
                      ? "subscription.setup.month"
                      : "subscription.setup.months",
                  )}
                </button>
              `,
            )}
          </div>

          <!-- Total Summary -->
          <div class="deposit-summary">
            <div class="summary-row">
              <span>${t("subscription.setup.monthlyPayment")}</span>
              <span class="summary-value">$${this.monthlyAmount}</span>
            </div>
            <div class="summary-row total">
              <span>${t("subscription.setup.totalDeposit")}</span>
              <span class="summary-value">$${this.totalDeposit}</span>
            </div>
          </div>

          <!-- Refund Notice -->
          <p class="refund-notice">${t("subscription.setup.refundNotice")}</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-back" @click=${this.handleBack}>
            ${t("subscription.setup.back")}
          </button>
          <button class="btn-continue" @click=${this.handleContinue}>
            ${t("subscription.setup.continue")}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "subscription-setup-screen": SubscriptionSetupScreen;
  }
}
