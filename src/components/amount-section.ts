import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { t } from "../services/index.ts";
import type { DonationType } from "./donation-type-toggle.ts";

/**
 * AmountSection - Component for displaying large centered amount input
 * 
 * @element amount-section
 *
 * @attr {string} value - Current amount value
 * @attr {string} currencySymbol - Currency symbol to display (default: "$")
 * @attr {DonationType} donationType - Current donation type (default: "one-time")
 * 
 * @fires amount-change - Fired when amount value changes
 * @fires preset-selected - Fired when preset button is clicked
 * 
 * @example
 * ```html
 * <amount-section
 *   value="24"
 *   currency-symbol="$"
 *   @amount-change="${handleAmountChange}"
 *   @preset-selected="${handlePresetSelected}"
 * ></amount-section>
 * ```
 */
@customElement("amount-section")
export class AmountSection extends LitElement {
  @property({ type: String })
  accessor value: string = "";

  @property({ type: String, attribute: "currency-symbol" })
  accessor currencySymbol: string = "$";

  @property({ type: String, attribute: "donation-type" })
  accessor donationType: DonationType = "one-time";

  private readonly presets = [10, 25, 50, 100];

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .amount-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 0;
      position: relative;
    }

    .amount-display {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      position: relative;
    }

    .dollar-sign {
      flex: 1;
      font-size: 48px;
      font-weight: 300;
      letter-spacing: -1px;
      color: var(--color-muted-foreground);
      line-height: 1;
      text-align: right;
      position: relative;
    }

    .amount-input-wrapper {
      flex: 1;
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .amount-input {
      font-size: 64px;
      font-weight: 300;
      letter-spacing: -2px;
      color: var(--color-foreground);
      background: transparent;
      border: none;
      outline: none;
      text-align: left;
      width: 100%;
      max-width: 200px;
      min-width: 100px;
      line-height: 1;
      padding: 0;
      font-family: inherit;
    }

    .amount-input::placeholder {
      color: var(--color-muted-foreground);
      opacity: 0.5;
    }

    .amount-input:focus-visible {
      outline: none;
    }

    /* Info tooltip card */
    .info-tooltip {
      position: absolute;
      left: 8px;
      top: -48px;
      transform: rotate(4deg);
      max-width: 100px;
      z-index: 10;
    }

    .info-tooltip-content {
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 0.5rem 0.625rem;
      font-size: 0.625rem;
      line-height: 1.4;
      color: var(--color-muted-foreground);
      box-shadow: 0 2px 8px oklch(0% 0 0 / 0.08);
      position: relative;
      z-index: 10;
    }

    /* Hand-drawn style arrow */
    .info-tooltip-arrow {
      position: absolute;
      left: 50%;
      top: 60%;
      transform: translateX(-50%);
      width: 80px;
      height: 70px;
      margin-top: 4px;
    }

    .info-tooltip-arrow svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .info-tooltip-arrow path {
      fill: none;
      stroke: var(--color-foreground);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .helper-text {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      text-align: center;
      margin: 0;
    }

    .preset-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .preset-button {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-foreground);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .preset-button:hover {
      background: var(--color-muted);
      border-color: var(--color-accent);
    }

    .preset-button:active {
      transform: scale(0.98);
    }

    .preset-button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    /* Mobile responsive styles */
    @container donation-widget (max-width: 329px) {
      .amount-section {
        padding: 0.5rem 0;
      }

      .dollar-sign {
        font-size: 36px;
      }

      .amount-input {
        font-size: 48px;
        min-width: 80px;
      }

      .info-tooltip {
        display: none;
      }

      .preset-buttons {
        gap: 0.5rem;
      }

      .preset-button {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }
    }

    @container donation-widget (max-width: 429px) {
      .info-tooltip-arrow {
        display: none;
      }
    }

  `;

  /**
   * Validates and formats the input value according to requirements:
   * - Accept only numeric values and a single decimal point
   * - Limit decimal places to 2 digits
   * - Ignore invalid characters (silently ignore, keep valid value)
   * - When cleared, return to initial state with placeholder "0"
   */
  private handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // If value is empty, dispatch empty string to show placeholder
    if (value === "" || value.trim() === "") {
      this.value = "";
      this.dispatchEvent(
        new CustomEvent("amount-change", {
          detail: { value: "" },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    // Allow only numbers and decimal point
    value = value.replace(/[^0-9.]/g, "");

    // Allow only one decimal point - keep first occurrence, remove others
    const parts = value.split(".");
    if (parts.length > 2) {
      // Keep first part and first decimal point, join the rest (remove decimal points)
      value = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit decimal places to 2 digits (re-split to get updated parts after joining)
    const decimalParts = value.split(".");
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      value = decimalParts[0] + "." + decimalParts[1].slice(0, 2);
    }

    // Update input value to reflect validated value
    // This ensures invalid characters are removed from the display
    if (input.value !== value) {
      input.value = value;
    }

    // Update internal value and dispatch event
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("amount-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handlePresetClick(preset: number) {
    // Update the value property for immediate visual feedback
    this.value = preset.toString();
    
    // Dispatch both events for compatibility
    this.dispatchEvent(
      new CustomEvent("preset-selected", {
        detail: { value: preset },
        bubbles: true,
        composed: true,
      }),
    );
    
    // Also dispatch amount-change event to notify parent
    this.dispatchEvent(
      new CustomEvent("amount-change", {
        detail: { value: preset.toString() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const displayValue = this.value || "";
    const helperTextKey =
      this.donationType === "monthly" ? "amount.helper.subscription" : "amount.helper";

    return html`
      <div class="amount-section">
        <div class="amount-display">
          <div class="info-tooltip">
            <div class="info-tooltip-content">
              ${t("amount.tooltip")}
            </div>
            <div class="info-tooltip-arrow">
              <svg viewBox="0 0 80 70">
                <!-- Hand-drawn curved line from top center, down with curl, then right -->
                <path d="M40 2 
                         C42 8, 38 14, 40 20
                         C42 28, 36 32, 38 38
                         C40 44, 44 46, 50 48
                         C58 50, 66 48, 74 46" />
                <!-- Arrowhead -->
                <path d="M68 40 L76 46 L70 52" />
              </svg>
            </div>
          </div>
          <span class="dollar-sign">${this.currencySymbol}</span>
          <div class="amount-input-wrapper">
            <input
              class="amount-input"
              type="text"
              inputmode="decimal"
              placeholder="0"
              name="recipient-amount"
              autocomplete="off"
              .value="${displayValue}"
              @input="${this.handleInput}"
              aria-label="${t("amount.ariaLabel")}"
              aria-describedby="amount-helper"
            />
          </div>
        </div>

        <p id="amount-helper" class="helper-text">
          ${t(helperTextKey)}
        </p>

        <div class="preset-buttons">
          ${this.presets.map(
            (preset) => html`
              <button
                class="preset-button"
                @click="${() => this.handlePresetClick(preset)}"
                aria-label="${t("amount.presetAriaLabel", { currency: this.currencySymbol, amount: String(preset) })}"
              >
                ${this.currencySymbol}${preset}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "amount-section": AmountSection;
  }
}

