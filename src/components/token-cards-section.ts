import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token, WalletService } from "../services/WalletService.ts";
import type { Address } from "viem";
import { t } from "../services/index.ts";

/**
 * TokenCardsSection - Component for displaying token selection with horizontal card layout
 * 
 * @element token-cards-section
 * 
 * @attr {Token[]} tokens - Array of available tokens
 * @attr {Token} selectedToken - Currently selected token (optional)
 * @attr {WalletService} walletService - Wallet service instance for fetching balances
 * @attr {Address} walletAddress - Wallet address to fetch balances for
 * @attr {string} requiredAmount - Required donation amount in USD for balance validation
 * 
 * @fires token-selected - Fired when a token card is clicked
 * 
 * @example
 * ```html
 * <token-cards-section
 *   .tokens="${tokens}"
 *   .selectedToken="${selectedToken}"
 *   .walletService="${walletService}"
 *   .walletAddress="${walletAddress}"
 *   required-amount="100"
 *   @token-selected="${handleTokenSelect}"
 * ></token-cards-section>
 * ```
 */
@customElement("token-cards-section")
export class TokenCardsSection extends LitElement {
  @property({ type: Array })
  accessor tokens: Token[] = [];

  @property({ type: Object })
  accessor selectedToken: Token | null = null;

  @property({ type: Object })
  accessor walletService: WalletService | null = null;

  @property({ type: String })
  accessor walletAddress: Address | null = null;

  /** Required donation amount in USD for balance validation */
  @property({ type: String, attribute: "required-amount" })
  accessor requiredAmount: string = "";

  /** Current chain ID to filter tokens by connected network */
  @property({ type: Number, attribute: "current-chain-id" })
  accessor currentChainId: number | null = null;

  @state()
  private accessor tokenBalances: Map<string, string> = new Map();

  @state()
  private accessor isLoadingBalances: boolean = false;

  private loadBalancesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLoadedChainId: number | null = null;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    :host([hidden]) {
      display: none;
    }

    .section-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
      margin-bottom: 0.75rem;
      text-align: left;
    }

    .cards-container {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding-top: 0.25rem;
      padding-bottom: 0.5rem;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }

    .cards-container::-webkit-scrollbar {
      height: 6px;
    }

    .cards-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .cards-container::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 3px;
    }

    .cards-container::-webkit-scrollbar-thumb:hover {
      background: var(--color-muted-foreground);
    }

    .token-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      min-width: 100px;
      flex: 1;
      max-width: 120px;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
      position: relative;
    }

    .token-card:hover {
      background: var(--color-secondary);
      border-color: var(--color-accent);
      transform: translateY(-2px);
    }

    .token-card:active {
      transform: translateY(0);
    }

    .token-card:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .token-card.selected {
      border-color: var(--color-accent);
      background: var(--color-secondary);
      box-shadow: 0 0 0 1px var(--color-accent);
    }

    .token-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .token-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      object-fit: cover;
      background: var(--color-background);
      flex-shrink: 0;
    }

    .token-icon-placeholder {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-muted-foreground);
      flex-shrink: 0;
    }

    .token-symbol {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-foreground);
      text-align: center;
      line-height: 1.2;
    }

    .token-balance {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      text-align: center;
      line-height: 1.2;
      min-height: 1rem;
    }

    .token-balance.loading {
      opacity: 0.5;
    }

    /* Skeleton styles */
    .skeleton-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      min-width: 100px;
      flex: 1;
      max-width: 120px;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      box-sizing: border-box;
    }

    .skeleton-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        var(--color-muted) 50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-symbol {
      width: 3rem;
      height: 1rem;
      border-radius: 4px;
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        var(--color-muted) 50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
      animation-delay: 0.1s;
    }

    .skeleton-balance {
      width: 2.5rem;
      height: 0.75rem;
      border-radius: 4px;
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        var(--color-muted) 50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
      animation-delay: 0.2s;
    }

    @keyframes skeleton-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Empty state styles */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
      gap: 0.5rem;
      background: var(--color-muted);
      border: 1px dashed var(--color-border);
      border-radius: 16px;
      text-align: center;
    }

    .empty-state-icon {
      width: 2.5rem;
      height: 2.5rem;
      color: var(--color-muted-foreground);
      opacity: 0.6;
    }

    .empty-state-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
    }

    .empty-state-hint {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
    }

    .empty-state.expanded {
      padding: 1.25rem;
      gap: 0.75rem;
    }

    .empty-state-details {
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
    }

    .supported-tokens {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      justify-content: center;
      margin: 0.5rem 0;
    }

    .token-badge {
      padding: 0.25rem 0.5rem;
      background: var(--color-secondary);
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    .supported-networks {
      font-size: 0.6875rem;
      margin-top: 0.25rem;
    }

    .selected-indicator {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 1.25rem;
      height: 1.25rem;
      color: var(--color-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background);
      border-radius: 50%;
      box-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
    }

    .selected-indicator svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    /* Mobile responsive styles */
    @container donation-widget (max-width: 400px) {
      .cards-container {
        gap: 0.5rem;
        padding-left: 0.25rem;
        padding-right: 0.25rem;
      }

      .token-card,
      .skeleton-card {
        min-width: 80px;
        max-width: 100px;
        padding: 0.75rem;
      }

      .token-icon,
      .token-icon-placeholder,
      .skeleton-icon {
        width: 2rem;
        height: 2rem;
      }

      .token-symbol {
        font-size: 0.8125rem;
      }

      .token-balance {
        font-size: 0.6875rem;
      }

      .section-label {
        font-size: 0.8125rem;
      }

      .skeleton-symbol {
        width: 2.5rem;
        height: 0.875rem;
      }

      .skeleton-balance {
        width: 2rem;
        height: 0.625rem;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.scheduleLoadBalances();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.loadBalancesDebounceTimer) {
      clearTimeout(this.loadBalancesDebounceTimer);
      this.loadBalancesDebounceTimer = null;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Handle currentChainId changes - clear token if needed
    if (changedProperties.has("currentChainId")) {
      if (this.selectedToken && this.currentChainId && this.selectedToken.chainId !== this.currentChainId) {
        this.dispatchEvent(
          new CustomEvent("token-selected", {
            detail: null,
            bubbles: true,
            composed: true,
          }),
        );
      }
    }

    // Only reload balances when essential properties change
    if (
      changedProperties.has("walletAddress") ||
      changedProperties.has("walletService") ||
      changedProperties.has("currentChainId")
    ) {
      this.scheduleLoadBalances();
    }
  }

  /**
   * Schedule balance loading with debounce to prevent excessive API calls
   */
  private scheduleLoadBalances() {
    if (this.loadBalancesDebounceTimer) {
      clearTimeout(this.loadBalancesDebounceTimer);
    }

    this.loadBalancesDebounceTimer = setTimeout(() => {
      this.loadBalancesDebounceTimer = null;
      this.loadBalances();
    }, 300);
  }

  /**
   * Get tokens filtered by current chain ID
   */
  private get filteredTokens(): Token[] {
    if (this.currentChainId === null) {
      return this.tokens;
    }
    return this.tokens.filter((token) => token.chainId === this.currentChainId);
  }

  /**
   * Get tokens with non-zero balance
   */
  private get tokensWithBalance(): Token[] {
    // While loading, return empty array (skeletons will be shown)
    if (this.isLoadingBalances) {
      return [];
    }

    return this.filteredTokens.filter((token) => {
      const balance = this.getTokenBalance(token);
      const num = parseFloat(balance);
      return !isNaN(num) && num > 0;
    });
  }

  /**
   * Load balances for tokens on the current chain using Multicall
   */
  private async loadBalances() {
    // Skip if no chain selected - don't load balances for ALL tokens
    if (!this.currentChainId) {
      return;
    }

    // Skip if already loading
    if (this.isLoadingBalances) {
      return;
    }

    const tokensToLoad = this.filteredTokens;
    if (!this.walletService || !this.walletAddress || tokensToLoad.length === 0) {
      this.tokenBalances.clear();
      return;
    }

    // Skip if we already loaded balances for this chain
    if (this.lastLoadedChainId === this.currentChainId && this.tokenBalances.size > 0) {
      return;
    }

    this.isLoadingBalances = true;
    const chainIdBeingLoaded = this.currentChainId;

    try {
      // Use batch multicall instead of individual requests
      const balancesMap = await this.walletService.getBalancesBatch(
        tokensToLoad,
        this.walletAddress,
      );

      // Only update if chain hasn't changed during loading
      if (this.currentChainId === chainIdBeingLoaded) {
        const newBalances = new Map<string, string>();

        for (const token of tokensToLoad) {
          const key = this.getTokenKey(token);
          const balanceBigInt = balancesMap.get(token.address.toLowerCase()) || BigInt(0);
          const balance = this.formatBalance(balanceBigInt, token.decimals);
          newBalances.set(key, balance);
        }

        this.tokenBalances = newBalances;
        this.lastLoadedChainId = chainIdBeingLoaded;
      }
    } catch (error) {
      console.error("Failed to load token balances:", error);
    } finally {
      this.isLoadingBalances = false;
    }
  }

  /**
   * Format balance from bigint to display string with appropriate decimal places
   */
  private formatBalance(balance: bigint, decimals: number): string {
    if (balance === BigInt(0)) {
      return "0";
    }

    const divisor = BigInt(10 ** decimals);
    const integerPart = balance / divisor;
    const fractionalPart = balance % divisor;

    // Convert to number for display formatting
    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const fullNumber = parseFloat(`${integerPart}.${fractionalStr}`);

    // Format with appropriate decimal places for display
    if (fullNumber >= 1000) {
      return fullNumber.toFixed(2);
    } else if (fullNumber >= 1) {
      return fullNumber.toFixed(2);
    } else if (fullNumber > 0) {
      return fullNumber.toFixed(4);
    }

    return "0";
  }

  /**
   * Get unique key for a token (address + chainId)
   */
  private getTokenKey(token: Token): string {
    return `${token.address}-${token.chainId}`;
  }

  /**
   * Get balance for a token
   */
  private getTokenBalance(token: Token): string {
    const key = this.getTokenKey(token);
    return this.tokenBalances.get(key) || "0";
  }


  /**
   * Get token initials for placeholder icon
   */
  private getTokenInitials(token: Token): string {
    return token.symbol.slice(0, 2).toUpperCase();
  }

  /**
   * Check if token is selected
   */
  private isTokenSelected(token: Token): boolean {
    if (!this.selectedToken) {
      return false;
    }
    return (
      this.selectedToken.address === token.address &&
      this.selectedToken.chainId === token.chainId
    );
  }

  /**
   * Check if token has insufficient balance
   * 
   * Note: We no longer disable tokens based on required amount.
   * Balance validation happens at the donate step instead,
   * allowing users to freely explore token options.
   */
  private hasInsufficientBalance(_token: Token): boolean {
    // Always return false - tokens are never disabled based on balance
    // The actual balance check happens when user tries to donate
    return false;
  }

  /**
   * Handle token card click
   */
  private handleTokenClick(token: Token) {
    // Don't allow selection of tokens with insufficient balance
    if (this.hasInsufficientBalance(token)) {
      return;
    }

    // Emit token-selected event
    this.dispatchEvent(
      new CustomEvent("token-selected", {
        detail: token,
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(event: KeyboardEvent, token: Token) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleTokenClick(token);
    }
  }

  /**
   * Render skeleton cards while loading
   */
  private renderSkeletons() {
    // Show 3 skeleton cards while loading
    const skeletonCount = Math.min(3, this.filteredTokens.length || 3);
    return Array.from({ length: skeletonCount }).map(
      () => html`
        <div class="skeleton-card" aria-hidden="true">
          <div class="skeleton-icon"></div>
          <div class="skeleton-symbol"></div>
          <div class="skeleton-balance"></div>
        </div>
      `
    );
  }

  /**
   * Render empty state when no tokens with balance available
   */
  private renderEmptyState() {
    return html`
      <div class="empty-state expanded">
        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
        <div class="empty-state-text">${t("token.noTokensWithBalance")}</div>
        <div class="empty-state-details">
          <p>${t("token.supportedTokensIntro")}</p>
          <div class="supported-tokens">
            <span class="token-badge">ETH</span>
            <span class="token-badge">USDC</span>
            <span class="token-badge">USDT</span>
            <span class="token-badge">WETH</span>
            <span class="token-badge">WBTC</span>
          </div>
          <p class="supported-networks">${t("token.supportedNetworks")}</p>
        </div>
        <div class="empty-state-hint">${t("token.noTokensWithBalanceHint")}</div>
      </div>
    `;
  }

  override render() {
    // During initial load, show skeletons if there are potential tokens
    if (this.isLoadingBalances && this.filteredTokens.length > 0) {
      return html`
        <div class="section-label">${t("token.choosePayment")}</div>
        <div class="cards-container" role="listbox" aria-label="${t("token.selectionAriaLabel")}" aria-busy="true">
          ${this.renderSkeletons()}
        </div>
      `;
    }

    // After loading, show only tokens with non-zero balance
    const tokensToRender = this.tokensWithBalance;
    
    // Show empty state if no tokens with balance
    if (tokensToRender.length === 0 && this.filteredTokens.length > 0) {
      return html`
        <div class="section-label">${t("token.choosePayment")}</div>
        ${this.renderEmptyState()}
      `;
    }

    // Hide section completely if no tokens at all
    if (tokensToRender.length === 0) {
      return html``;
    }

    return html`
      <div class="section-label">${t("token.choosePayment")}</div>
      <div class="cards-container" role="listbox" aria-label="${t("token.selectionAriaLabel")}">
        ${tokensToRender.map((token) => {
          const isSelected = this.isTokenSelected(token);
          const formattedBalance = this.getTokenBalance(token);
          const isInsufficient = this.hasInsufficientBalance(token);

          return html`
            <div
              class="token-card ${isSelected ? "selected" : ""} ${isInsufficient ? "disabled" : ""}"
              role="option"
              aria-selected="${isSelected}"
              aria-disabled="${isInsufficient}"
              aria-label="Select ${token.symbol}${isInsufficient ? ` (${t("token.insufficientBalance")})` : ""}"
              tabindex="${isInsufficient ? "-1" : "0"}"
              @click="${() => this.handleTokenClick(token)}"
              @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e, token)}"
            >
              ${isSelected
                ? html`
                    <div class="selected-indicator" aria-hidden="true">
                      <svg
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
                    </div>
                  `
                : ""}
              
              ${token.logoURI
                ? html`
                    <img
                      class="token-icon"
                      src="${token.logoURI}"
                      alt="${token.symbol}"
                      width="40"
                      height="40"
                      @error="${(e: Event) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const placeholder = img.nextElementSibling;
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = "flex";
                        }
                      }}"
                    />
                    <div class="token-icon-placeholder" style="display: none;">
                      ${this.getTokenInitials(token)}
                    </div>
                  `
                : html`
                    <div class="token-icon-placeholder">
                      ${this.getTokenInitials(token)}
                    </div>
                  `}
              
              <div class="token-symbol">${token.symbol}</div>
              <div class="token-balance">
                ${formattedBalance}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "token-cards-section": TokenCardsSection;
  }
}

