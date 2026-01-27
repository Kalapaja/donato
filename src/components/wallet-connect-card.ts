import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { WalletService } from "../services/WalletService.ts";
import { t } from "../services/index.ts";
import "./info-tooltip.ts";

/**
 * WalletConnectCard - Component for displaying wallet connection card
 * 
 * @element wallet-connect-card
 * 
 * @attr {WalletService} walletService - Wallet service instance (required)
 * @attr {boolean} isConnecting - Whether wallet is currently connecting (default: false)
 * @attr {boolean} isConnected - Whether wallet is connected (default: false)
 * 
 * @fires wallet-connect-click - Fired when card is clicked to trigger wallet connection
 * @fires wallet-error - Fired when wallet connection fails
 * 
 * @example
 * ```html
 * <wallet-connect-card
 *   .walletService="${walletService}"
 *   ?is-connecting="${isConnecting}"
 *   ?is-connected="${isConnected}"
 *   @wallet-connect-click="${handleConnectClick}"
 * ></wallet-connect-card>
 * ```
 */
@customElement("wallet-connect-card")
export class WalletConnectCard extends LitElement {
  @property({ type: Object })
  accessor walletService!: WalletService;

  @property({ type: Boolean, attribute: "is-connecting" })
  accessor isConnecting: boolean = false;

  @property({ type: Boolean, attribute: "is-connected" })
  accessor walletConnected: boolean = false;

  // Internal state for managing connection process
  @state()
  private accessor internalIsConnecting: boolean = false;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    :host([hidden]) {
      display: none;
    }

    .wallet-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      gap: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .wallet-card:hover {
      background: var(--color-secondary);
      border-color: var(--color-accent);
    }

    .wallet-card:active {
      transform: scale(0.98);
    }

    .wallet-card:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .wallet-card.connecting {
      cursor: wait;
      opacity: 0.7;
    }

    .wallet-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .wallet-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      flex-shrink: 0;
      color: var(--color-accent);
    }

    .wallet-icon svg {
      width: 100%;
      height: 100%;
    }

    .wallet-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
      flex: 1;
    }

    .wallet-title {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-foreground);
      line-height: 1.4;
    }

    .wallet-subtext {
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
      line-height: 1.4;
    }

    .wallet-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-muted-foreground);
      transition: transform 0.2s ease;
    }

    .wallet-card:hover .wallet-indicator {
      color: var(--color-accent);
      transform: translateX(2px);
    }

    .wallet-indicator svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .loading-spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Security list styles inside info-tooltip */
    .security-list {
      margin: 0;
      padding-left: 1rem;
      list-style: disc;
    }

    .security-list li {
      margin-bottom: 0.25rem;
      color: var(--color-muted-foreground);
    }

    .security-list li:last-child {
      margin-bottom: 0;
    }
  `;

  /**
   * Wallet icon SVG - Simple wallet/purse icon
   */
  private getWalletIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
      </svg>
    `;
  }

  /**
   * Chevron/arrow indicator SVG
   */
  private getChevronIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6"></path>
      </svg>
    `;
  }

  /**
   * Handle click to trigger Reown wallet connection modal
   */
  private async handleClick() {
    if (this.isConnecting || this.walletConnected || this.internalIsConnecting) {
      return;
    }

    if (!this.walletService) {
      console.error("WalletService is not provided");
      return;
    }

    // Set internal connecting state to show loading spinner
    this.internalIsConnecting = true;

    try {
      // Open Reown modal
      await this.walletService.openModal();
    } catch (error) {
      console.error("Failed to open wallet modal:", error);
      
      // Dispatch error event for parent component
      this.dispatchEvent(
        new CustomEvent("wallet-error", {
          detail: {
            error: error instanceof Error
              ? error.message
              : t("message.walletConnectionFailed"),
          },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      // Reset internal connecting state after modal opens
      // The actual connection state will be managed by parent via props
      this.internalIsConnecting = false;
    }

    // Dispatch event to parent component for backwards compatibility
    this.dispatchEvent(
      new CustomEvent("wallet-connect-click", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    // Hide card when wallet is connected
    if (this.walletConnected) {
      return html``;
    }

    // Combine internal and prop-based connecting states
    const isConnectingState = this.isConnecting || this.internalIsConnecting;

    return html`
      <div
        class="wallet-card ${isConnectingState ? "connecting" : ""}"
        @click="${this.handleClick}"
        role="button"
        tabindex="0"
        aria-label="${t("wallet.connectAriaLabel")}"
        aria-describedby="wallet-subtext"
        @keydown="${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.handleClick();
          }
        }}"
      >
        <div class="wallet-content">
          <div class="wallet-icon">
            ${isConnectingState
              ? html`<span class="loading-spinner"></span>`
              : this.getWalletIcon()}
          </div>
          <div class="wallet-text">
            <div class="wallet-title">
              ${isConnectingState ? t("wallet.connecting") : t("wallet.connect")}
            </div>
            <div id="wallet-subtext" class="wallet-subtext">
              ${t("wallet.connectSubtext")}
            </div>
          </div>
        </div>
        <info-tooltip title="${t("wallet.security.title")}">
          <ul class="security-list">
            <li>${t("wallet.security.viewOnly")}</li>
            <li>${t("wallet.security.noAutoDebit")}</li>
            <li>${t("wallet.security.confirmRequired")}</li>
          </ul>
        </info-tooltip>
        ${!isConnectingState
          ? html`<div class="wallet-indicator">${this.getChevronIcon()}</div>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wallet-connect-card": WalletConnectCard;
  }
}

