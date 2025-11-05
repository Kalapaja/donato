import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token } from "../services/WalletService.ts";
import type { Route } from "../services/OneInchService.ts";

@customElement("amount-input")
export class AmountInput extends LitElement {
  @property({ type: String })
  accessor label: string = "Amount";

  @property({ type: String })
  accessor value: string = "";

  @property({ type: Object })
  accessor selectedToken: Token | null = null;

  @property({ type: String })
  accessor recipientToken: Token | null = null;

  @property({ type: Object })
  accessor quote: Route | null = null;

  @property({ type: Boolean })
  accessor isQuoteLoading: boolean = false;

  @property({ type: String })
  accessor quoteError: string | null = null;

  @property({ type: Boolean })
  accessor disabled: boolean = false;

  @state()
  private accessor userPayAmount: string | null = null;

  static override styles = css`
    :host {
      display: block;
    }

    .amount-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
    }

    .input-wrapper {
      position: relative;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      padding-right: 4rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      font-size: 1rem;
      color: var(--color-foreground);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-foreground);
    }

    .form-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-input::placeholder {
      color: var(--color-muted-foreground);
    }

    .input-suffix {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      font-weight: 500;
      pointer-events: none;
    }

    .quote-display {
      padding: 0.75rem;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
      font-size: 0.875rem;
    }

    .quote-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-muted-foreground);
    }

    .loading-spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-foreground);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .quote-error {
      color: oklch(63% 0.24 27);
      font-size: 0.875rem;
    }

    .quote-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quote-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .quote-label {
      color: var(--color-muted-foreground);
    }

    .quote-value {
      color: var(--color-foreground);
      font-weight: 500;
    }

    .quote-value-highlight {
      color: var(--color-foreground);
      font-weight: 600;
      font-size: 1rem;
    }

    .help-text {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin-top: 0.25rem;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Calculate user pay amount when quote changes
    if (changedProperties.has("quote") && this.quote) {
      this.calculateUserPayAmount();
    }
  }

  private calculateUserPayAmount() {
    if (!this.quote || !this.selectedToken) {
      this.userPayAmount = null;
      return;
    }

    // Validate that fromAmount exists and is a valid value
    if (!this.quote.fromAmount || this.quote.fromAmount === undefined) {
      this.userPayAmount = null;
      return;
    }

    try {
      const fromAmount = BigInt(this.quote.fromAmount);
      const decimals = this.selectedToken.decimals;
      const divisor = BigInt(10 ** decimals);
      const amount = Number(fromAmount) / Number(divisor);
      this.userPayAmount = amount.toFixed(6);
    } catch (error) {
      console.error("Failed to calculate user pay amount:", error);
      this.userPayAmount = null;
    }
  }

  private handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Allow only numbers and decimal point
    value = value.replace(/[^0-9.]/g, "");

    // Allow only one decimal point
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit decimal places to 6
    if (parts.length === 2 && parts[1].length > 6) {
      value = parts[0] + "." + parts[1].slice(0, 6);
    }

    // Update input value
    input.value = value;

    // Emit change event
    this.dispatchEvent(
      new CustomEvent("amount-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private getEstimatedGasCost(): string {
    if (!this.quote) return "0.00";

    let totalGasCostUSD = 0;

    for (const step of this.quote.steps) {
      if (step.estimate?.gasCosts) {
        for (const gasCost of step.estimate.gasCosts) {
          totalGasCostUSD += parseFloat(gasCost.amountUSD || "0");
        }
      }
    }

    return totalGasCostUSD.toFixed(2);
  }

  override render() {
    return html`
      <div class="amount-input-container">
        <label class="form-label" for="amount-input">
          ${this.label}
        </label>
        <div class="input-wrapper">
          <input
            id="amount-input"
            class="form-input"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            .value="${this.value}"
            @input="${this.handleInput}"
            ?disabled="${this.disabled}"
            aria-label="${this.label}"
            aria-describedby="amount-help"
            aria-invalid="${this.quoteError ? "true" : "false"}"
          />
          ${this.recipientToken
            ? html`
              <span class="input-suffix">${this.recipientToken.symbol}</span>
            `
            : undefined}
        </div>

        ${this.value && parseFloat(this.value) > 0
          ? html`
            ${this.isQuoteLoading
              ? html`
                <div class="quote-display">
                  <div class="quote-loading">
                    <span
                      class="loading-spinner"
                      role="status"
                      aria-label="Loading quote"
                    ></span>
                    <span>Calculating quote...</span>
                  </div>
                </div>
              `
              : this.quoteError
              ? html`
                <div class="quote-display">
                  <div class="quote-error" role="alert">
                    ${this.quoteError}
                  </div>
                </div>
              `
              : this.quote && this.userPayAmount && this.selectedToken
              ? html`
                <div class="quote-display" role="region" aria-label="Quote information">
                  <div class="quote-info">
                    <div class="quote-row">
                      <span class="quote-label">You pay:</span>
                      <span class="quote-value-highlight">
                        ${parseFloat(this.userPayAmount).toFixed(6)} ${this
                          .selectedToken.symbol}
                      </span>
                    </div>
                    <div class="quote-row">
                      <span class="quote-label">Recipient gets:</span>
                      <span class="quote-value">${this
                        .value} ${this.recipientToken?.symbol || ""}</span>
                    </div>
                    <div class="quote-row">
                      <span class="quote-label">Est. gas:</span>
                      <span class="quote-value">$${this
                        .getEstimatedGasCost()}</span>
                    </div>
                  </div>
                </div>
              `
              : ""}
          `
          : html`
            <p id="amount-help" class="help-text">
              Enter the amount the recipient will receive
            </p>
          `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "amount-input": AmountInput;
  }
}
