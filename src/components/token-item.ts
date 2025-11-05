import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Token } from "../services/WalletService.ts";
import type { Chain } from "../services/ChainService.ts";

@customElement("token-item")
export class TokenItem extends LitElement {
  @property({ type: Object })
  accessor token!: Token;

  @property({ type: Object })
  accessor chain!: Chain;

  @property({ type: Boolean })
  accessor isSelected: boolean = false;

  @property({ type: Boolean })
  accessor isFocused: boolean = false;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .token-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: background-color 0.15s;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
    }

    .token-item:hover {
      background: var(--color-muted);
    }

    .token-item:focus {
      outline: none;
      background: var(--color-muted);
    }

    .token-item.selected {
      background: var(--color-muted);
    }

    .token-item.focused {
      background: var(--color-muted);
      outline: 2px solid var(--color-foreground);
      outline-offset: -2px;
    }

    .token-logo {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
      background: var(--color-muted);
      flex-shrink: 0;
    }

    .token-logo-placeholder {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--color-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-muted-foreground);
      flex-shrink: 0;
    }

    .token-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .token-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .token-symbol {
      font-weight: 600;
      color: var(--color-foreground);
      font-size: 0.875rem;
    }

    .token-name {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .selected-indicator {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--color-foreground);
      flex-shrink: 0;
    }
  `;

  private handleClick() {
    // Emit token-clicked event
    this.dispatchEvent(
      new CustomEvent("token-clicked", {
        detail: this.token,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick();
    }
  }

  private getTokenInitials(): string {
    return this.token.symbol.slice(0, 2).toUpperCase();
  }

  override render() {
    const classes = [
      "token-item",
      this.isSelected ? "selected" : "",
      this.isFocused ? "focused" : "",
    ].filter(Boolean).join(" ");

    return html`
      <button
        class="${classes}"
        @click="${this.handleClick}"
        @keydown="${this.handleKeyDown}"
        role="option"
        aria-selected="${this.isSelected}"
        aria-label="Select ${this.token.symbol} on ${this.chain.name}"
        tabindex="${this.isFocused ? "0" : "-1"}"
      >
        ${this.token.logoURI
          ? html`
            <img
              class="token-logo"
              src="${this.token.logoURI}"
              alt="${this.token.symbol}"
              @error="${(e: Event) => {
                const img = e.target as HTMLImageElement;
                img.style.display = "none";
                // Show placeholder instead
                const placeholder = img.nextElementSibling;
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = "flex";
                }
              }}"
            />
            <div class="token-logo-placeholder" style="display: none;">
              ${this.getTokenInitials()}
            </div>
          `
          : html`
            <div class="token-logo-placeholder">
              ${this.getTokenInitials()}
            </div>
          `}

        <div class="token-info">
          <div class="token-primary">
            <span class="token-symbol">${this.token.symbol}</span>
          </div>
          <div class="token-name">${this.token.name}</div>
        </div>

        ${this.isSelected
          ? html`
            <svg
              class="selected-indicator"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          `
          : ""}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "token-item": TokenItem;
  }
}
