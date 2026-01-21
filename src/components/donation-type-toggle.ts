import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { t } from "../services/index.ts";

/**
 * Type representing the donation mode
 */
export type DonationType = "one-time" | "monthly";

/**
 * DonationTypeToggle - Toggle component for switching between one-time and monthly donation modes
 *
 * @element donation-type-toggle
 *
 * @attr {DonationType} value - Current selected donation type (default: "one-time")
 * @attr {boolean} disabled - When true, component renders nothing
 *
 * @fires donation-type-changed - Fired when donation type is changed
 *
 * @example
 * ```html
 * <donation-type-toggle
 *   value="one-time"
 *   @donation-type-changed="${handleTypeChange}"
 * ></donation-type-toggle>
 * ```
 */
@customElement("donation-type-toggle")
export class DonationTypeToggle extends LitElement {
  @property({ type: String })
  accessor value: DonationType = "one-time";

  @property({ type: Boolean })
  accessor disabled: boolean = false;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .toggle-container {
      display: flex;
      justify-content: center;
      padding: 0.5rem 0;
    }

    .toggle {
      display: flex;
      background: var(--color-muted);
      border-radius: var(--radius);
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .toggle-option {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: calc(var(--radius) - 2px);
      background: transparent;
      color: var(--color-muted-foreground);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .toggle-option:hover:not(.active) {
      color: var(--color-foreground);
    }

    .toggle-option.active {
      background: var(--color-background);
      color: var(--color-foreground);
      box-shadow: 0 1px 3px oklch(0% 0 0 / 0.1);
    }

    .toggle-option:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  `;

  private handleToggle(type: DonationType): void {
    if (this.value !== type) {
      this.value = type;
      this.dispatchEvent(
        new CustomEvent("donation-type-changed", {
          detail: { type },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  override render() {
    // When disabled, render nothing
    if (this.disabled) {
      return nothing;
    }

    return html`
      <div class="toggle-container">
        <div class="toggle" role="group" aria-label="Donation type">
          <button
            class="toggle-option ${this.value === "one-time" ? "active" : ""}"
            data-type="one-time"
            @click="${() => this.handleToggle("one-time")}"
            aria-pressed="${this.value === "one-time"}"
            type="button"
          >
            ${t("donation.type.oneTime")}
          </button>
          <button
            class="toggle-option ${this.value === "monthly" ? "active" : ""}"
            data-type="monthly"
            @click="${() => this.handleToggle("monthly")}"
            aria-pressed="${this.value === "monthly"}"
            type="button"
          >
            ${t("donation.type.monthly")}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "donation-type-toggle": DonationTypeToggle;
  }
}
