import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  Token,
  WalletAccount,
  WalletService,
} from "../services/WalletService.ts";
import type { Address } from "viem";
import "./token-selector.ts";

@customElement("wallet-section")
export class WalletSection extends LitElement {
  @property({ type: Object })
  accessor walletService!: WalletService;

  @property({ type: Object })
  accessor selectedToken: Token | null = null;

  @property({ type: Array })
  accessor availableTokens: Token[] = [];

  @property({ type: Boolean })
  accessor isLoadingTokens: boolean = false;

  @property({ type: Boolean })
  accessor disabled: boolean = false;

  @state()
  private accessor address: Address | null = null;

  @state()
  private accessor chainId: number | null = null;

  @state()
  private accessor walletConnected: boolean = false;

  @state()
  private accessor balance: string | null = null;

  @state()
  private accessor isLoadingBalance: boolean = false;

  @state()
  private accessor isConnecting: boolean = false;

  private accessor cleanupFunctions: Array<() => void> = [];

  static override styles = css`
    :host {
      display: block;
      margin-bottom: 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    :host([disabled]) .wallet-container {
      opacity: 0.5;
      pointer-events: none;
    }

    .wallet-container {
      padding: 1rem;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      box-sizing: border-box;
      width: 100%;
      overflow: visible;
    }

    .wallet-connected {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      overflow: visible;
      width: 100%;
      box-sizing: border-box;
    }

    .wallet-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .wallet-address {
      font-family: "Courier New", monospace;
      font-size: 0.875rem;
      color: var(--color-foreground);
      font-weight: 500;
    }

    .wallet-balance {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }

    .network-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }

    .network-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--color-background);
      color: var(--color-foreground);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .network-badge:hover {
      background: var(--color-muted);
    }

    .network-mismatch {
      padding: 0.75rem;
      margin-top: 0.75rem;
      background: oklch(73% 0.17 70 / 0.1);
      border: 1px solid oklch(73% 0.17 70 / 0.3);
      border-radius: calc(var(--radius) - 4px);
      color: oklch(58% 0.13 70);
      font-size: 0.875rem;
    }

    :host(.dark) .network-mismatch {
      color: oklch(73% 0.17 70);
    }

    .button {
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
      height: 2.5rem;
    }

    .button:hover:not(:disabled) {
      background: var(--color-accent);
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-secondary {
      background: transparent;
      color: var(--color-foreground);
      border: 1px solid var(--color-border);
    }

    .button-secondary:hover:not(:disabled) {
      background: var(--color-muted);
    }

    .button-small {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      width: auto;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
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
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.setupWalletListeners();
    this.updateWalletState();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private setupWalletListeners() {
    if (!this.walletService) return;

    // Listen for account changes
    const unsubscribeAccount = this.walletService.onAccountChanged(
      (account: WalletAccount) => {
        this.address = account.address;
        this.chainId = account.chainId;
        this.walletConnected = true;
        this.updateBalance();

        this.dispatchEvent(
          new CustomEvent("wallet-connected", {
            detail: account,
            bubbles: true,
            composed: true,
          }),
        );
      },
    );

    // Listen for chain changes
    const unsubscribeChain = this.walletService.onChainChanged(
      (newChainId: number) => {
        this.chainId = newChainId;
        this.updateBalance();

        this.dispatchEvent(
          new CustomEvent("network-switched", {
            detail: { chainId: newChainId },
            bubbles: true,
            composed: true,
          }),
        );

        this.walletService.closeModal();
      },
    );

    // Listen for disconnect
    const unsubscribeDisconnect = this.walletService.onDisconnect(() => {
      this.address = null;
      this.chainId = null;
      this.walletConnected = false;
      this.balance = null;

      this.dispatchEvent(
        new CustomEvent("wallet-disconnected", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.cleanupFunctions.push(
      unsubscribeAccount,
      unsubscribeChain,
      unsubscribeDisconnect,
    );
  }

  private cleanup() {
    this.cleanupFunctions.forEach((fn) => fn());
    this.cleanupFunctions = [];
  }

  private updateWalletState() {
    if (!this.walletService) return;

    const account = this.walletService.getAccount();
    this.address = account.address;
    this.chainId = account.chainId;
    this.walletConnected = this.walletService.isConnected();

    if (this.walletConnected) {
      this.updateBalance();
    }
  }

  private async updateBalance() {
    if (!this.selectedToken || !this.address || !this.walletService) {
      this.balance = null;
      return;
    }

    this.isLoadingBalance = true;

    try {
      const formattedBalance = await this.walletService.getFormattedBalance(
        this.selectedToken,
        this.address,
      );
      this.balance = formattedBalance;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      this.balance = null;
    } finally {
      this.isLoadingBalance = false;
    }
  }

  private async handleConnect() {
    if (!this.walletService) return;

    this.isConnecting = true;

    try {
      // Open AppKit modal instead of programmatic connection
      await this.walletService.openModal();
    } catch (error) {
      console.error("Failed to open wallet modal:", error);

      this.dispatchEvent(
        new CustomEvent("wallet-error", {
          detail: {
            error: error instanceof Error
              ? error.message
              : "Failed to open wallet connection",
          },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.isConnecting = false;
    }
  }

  private async handleDisconnect() {
    if (!this.walletService) return;

    try {
      await this.walletService.disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }

  private async handleSwitchNetwork(chainId?: number) {
    if (!this.walletService) return;

    // If chainId is not provided, use selected token's chainId
    const targetChainId = chainId || this.selectedToken?.chainId;
    if (!targetChainId) return;

    try {
      await this.walletService.switchChain(targetChainId);
    } catch (error) {
      console.error("Failed to switch network:", error);

      this.dispatchEvent(
        new CustomEvent("wallet-error", {
          detail: {
            error: error instanceof Error
              ? error.message
              : "Failed to switch network",
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private async handleOpenNetworkModal() {
    if (!this.walletService) return;

    try {
      await this.walletService.openNetworkModal();
    } catch (error) {
      console.error("Failed to open network modal:", error);

      this.dispatchEvent(
        new CustomEvent("wallet-error", {
          detail: {
            error: error instanceof Error
              ? error.message
              : "Failed to open network selector",
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  protected override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Update balance when selected token changes
    if (changedProperties.has("selectedToken") && this.walletConnected) {
      this.updateBalance();
    }
  }

  private get isNetworkMismatch(): boolean {
    return this.walletConnected &&
      this.selectedToken !== null &&
      this.chainId !== null &&
      this.chainId !== this.selectedToken.chainId;
  }

  private getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: "Ethereum",
      42161: "Arbitrum",
      137: "Polygon",
      56: "BSC",
      10: "Optimism",
      8453: "Base",
    };
    return networks[chainId] || `Chain ${chainId}`;
  }

  private formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private handleTokenSelect(event: CustomEvent<Token>) {
    // Propagate the event up to parent
    this.dispatchEvent(
      new CustomEvent("token-selected", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private get isReOwnConfigured(): boolean {
    return this.walletService?.getAppKit() !== null;
  }

  override render() {
    if (!this.walletConnected) {
      return html`
        <div class="wallet-container">
          <button
            class="button"
            @click="${this.handleConnect}"
            ?disabled="${this.isConnecting || !this.isReOwnConfigured || this.disabled}"
            aria-label="Connect wallet"
          >
            ${this.isConnecting
              ? html`
                <span class="loading-spinner"></span>
                Connecting...
              `
              : "Connect Wallet"}
          </button>
        </div>
      `;
    }

    return html`
      <div class="wallet-container">
        <div class="wallet-connected">
          <div class="wallet-info">
            <div>
              <div class="wallet-address">${this.formatAddress(
                this.address!,
              )}</div>
              ${this.selectedToken && this.balance !== null
                ? html`
                  <div class="wallet-balance">
                    Balance: ${this.isLoadingBalance
                      ? "..."
                      : `${
                        parseFloat(this.balance).toFixed(4)
                      } ${this.selectedToken.symbol}`}
                  </div>
                `
                : ""}
            </div>
            <div class="network-info">
              <button
                class="network-badge"
                @click="${this.handleOpenNetworkModal}"
                aria-label="Switch network"
                title="Click to switch network"
              >
                ${this.getNetworkName(this.chainId!)}
              </button>
            </div>
          </div>

          ${this.isNetworkMismatch
            ? html`
              <div class="network-mismatch" role="alert">
                <div>Please switch to ${this.getNetworkName(
                  this.selectedToken!.chainId,
                )}</div>
                <div class="button-group">
                  <button
                    class="button button-small"
                    @click="${this.handleSwitchNetwork}"
                    aria-label="Switch network"
                  >
                    Switch Network
                  </button>
                </div>
              </div>
            `
            : ""}

          <token-selector
            .tokens="${this.availableTokens}"
            .selectedToken="${this.selectedToken}"
            .isLoading="${this.isLoadingTokens}"
            .currentChainId="${this.chainId}"
            @token-selected="${this.handleTokenSelect}"
          ></token-selector>

          <button
            class="button button-secondary button-small"
            @click="${this.handleDisconnect}"
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wallet-section": WalletSection;
  }
}
