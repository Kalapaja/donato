import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('donate-button')
export class DonateButton extends LitElement {
  @property({ type: Boolean })
  accessor disabled: boolean = false;

  @property({ type: Boolean })
  accessor loading: boolean = false;

  @property({ type: String })
  accessor text: string = 'Donate';

  static override styles = css`
    :host {
      display: block;
    }

    .donate-button {
      width: 100%;
      padding: 0.625rem 1rem;
      background: var(--color-primary);
      color: var(--color-background);
      border: none;
      border-radius: calc(var(--radius) - 2px);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: inherit;
      height: 2.5rem;
    }

    .donate-button:hover:not(:disabled) {
      background: var(--color-accent);
    }

    .donate-button:active:not(:disabled) {
      background: var(--color-accent);
    }

    .donate-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .donate-button:focus-visible {
      outline: 2px solid var(--color-primary);
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
      to { transform: rotate(360deg); }
    }

    .button-text {
      display: inline-block;
    }
  `;

  private handleClick() {
    if (!this.disabled && !this.loading) {
      this.dispatchEvent(new CustomEvent('donate-click', {
        bubbles: true,
        composed: true,
      }));
    }
  }

  private getAriaLabel(): string {
    if (this.loading) {
      return 'Processing donation, please wait';
    }
    if (this.disabled) {
      return `${this.text} - button disabled`;
    }
    return this.text;
  }

  override render() {
    return html`
      <button
        class="donate-button"
        @click=${this.handleClick}
        ?disabled=${this.disabled || this.loading}
        aria-label=${this.getAriaLabel()}
        aria-busy=${this.loading ? 'true' : 'false'}
        role="button"
      >
        ${this.loading ? html`
          <span class="loading-spinner" role="status" aria-label="Loading"></span>
        ` : ''}
        <span class="button-text">${this.text}</span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'donate-button': DonateButton;
  }
}
