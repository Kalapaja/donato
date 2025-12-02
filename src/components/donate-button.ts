import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { t } from "../services/index.ts";

@customElement("donate-button")
export class DonateButton extends LitElement {
  @property({ type: Boolean })
  accessor disabled: boolean = false;

  @property({ type: Boolean })
  accessor loading: boolean = false;

  @property({ type: Boolean })
  accessor calculating: boolean = false;

  @property({ type: String })
  accessor amount: string = "";

  @property({ type: String })
  accessor tokenSymbol: string = "";

  @property({ type: String })
  accessor text: string = "Pay";

  static override styles = css`
    :host {
      display: block;
    }

    .donate-button {
      width: 100%;
      padding: 0.625rem 1rem;
      background: var(--color-accent);
      color: var(--color-background);
      border: none;
      border-radius: calc(var(--radius) - 2px);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: inherit;
      height: 2.5rem;
    }

    .donate-button:hover:not(:disabled) {
      opacity: 0.9;
    }

    .donate-button:active:not(:disabled) {
      opacity: 0.85;
    }

    .donate-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .donate-button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .loading-spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid oklch(from var(--color-background) l c h / 0.3);
      border-top-color: var(--color-background);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .button-text {
      display: inline-block;
    }

    .heart-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .arrow-icon {
      font-size: 0.875rem;
      line-height: 1;
    }
  `;

  private handleClick() {
    if (!this.disabled && !this.loading && !this.calculating) {
      this.dispatchEvent(
        new CustomEvent("donate-click", {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private getButtonText(): string {
    if (this.loading) {
      return t("donate.processing");
    }
    
    if (this.calculating) {
      return t("donate.calculating");
    }
    
    // If amount and tokenSymbol are provided, use the new format
    if (this.amount && this.tokenSymbol) {
      return t("donate.payWithAmount", { amount: this.amount, token: this.tokenSymbol });
    }
    
    // Fallback to text property for backward compatibility
    return this.text || t("donate.pay");
  }

  private getAriaLabel(): string {
    if (this.loading) {
      return t("donate.processingAriaLabel");
    }
    if (this.calculating) {
      return t("donate.calculatingAriaLabel");
    }
    const buttonText = this.getButtonText();
    if (this.disabled) {
      return `${buttonText} - ${t("donate.disabledAriaLabel")}`;
    }
    return buttonText;
  }

  override render() {
    const buttonText = this.getButtonText();
    
    return html`
      <button
        class="donate-button"
        @click="${this.handleClick}"
        ?disabled="${this.disabled || this.loading || this.calculating}"
        aria-label="${this.getAriaLabel()}"
        aria-busy="${this.loading || this.calculating ? "true" : "false"}"
        role="button"
      >
        ${this.loading || this.calculating
          ? html`
            <span class="loading-spinner" role="status" aria-label="${this.calculating ? t('donate.calculating') : t('donate.processing')}"></span>
          `
          : html`<span class="heart-icon">♡</span>`}
        <span class="button-text">${buttonText}</span>
        ${!this.loading && !this.calculating && this.amount && this.tokenSymbol
          ? html`<span class="arrow-icon">→</span>`
          : ""}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "donate-button": DonateButton;
  }
}
