import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  ChainService,
  LiFiService,
  ThemeService,
  toastService,
  WalletService,
} from "../services/index.ts";
import type { Token } from "../services/WalletService.ts";
import type { Route } from "@lifi/sdk";
import type { Theme, ThemeMode } from "../services/ThemeService.ts";

// Import child components
import "./wallet-section.ts";
import "./donation-form.ts";
import "./theme-toggle.ts";
import "./toast-container.ts";
import type { ToastContainer } from "./toast-container.ts";

/**
 * Donation Widget - Main component for cryptocurrency donations
 *
 * @element donation-widget
 *
 * @attr {string} recipient - Recipient wallet address (required)
 * @attr {string} reown-project-id - Reown project ID (required)
 * @attr {string} lifi-api-key - LiFi API key (required)
 * @attr {number} recipient-chain-id - Chain ID where recipient will receive tokens (default: 42161 - Arbitrum)
 * @attr {string} recipient-token-address - Token address that recipient will receive (default: USDC on recipient chain)
 * @attr {string} theme - Theme mode: 'light', 'dark', 'auto', or 'custom' (default: 'auto'). 'custom' mode hides theme toggle and uses CSS variables from parent.
 *
 * @fires donation-completed - Fired when donation succeeds
 * @fires donation-failed - Fired when donation fails
 *
 * @example
 * ```html
 * <donation-widget
 *   recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
 *   reown-project-id="YOUR_REOWN_PROJECT_ID"
 *   lifi-api-key="YOUR_LIFI_API_KEY"
 *   recipient-chain-id="42161"
 *   recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
 *   theme="dark">
 * </donation-widget>
 * ```
 */
@customElement("donation-widget")
export class DonationWidget extends LitElement {
  // Required properties
  /** Recipient wallet address (required) */
  @property({ type: String })
  accessor recipient: string = "";

  /** Reown project ID (required) */
  @property({ type: String, attribute: "reown-project-id" })
  accessor reownProjectId: string = "";

  /** LiFi API key (required) */
  @property({ type: String, attribute: "lifi-api-key" })
  accessor lifiApiKey: string = "";

  // Optional properties with defaults
  /** Chain ID where recipient will receive tokens (default: 42161 - Arbitrum) */
  @property({ type: Number, attribute: "recipient-chain-id" })
  accessor recipientChainId: number = 42161;

  /** Token address that recipient will receive (default: USDC on Arbitrum) */
  @property({ type: String, attribute: "recipient-token-address" })
  accessor recipientTokenAddress: string =
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

  /** Theme mode: 'light', 'dark', or 'auto' (default: 'auto') */
  @property({ type: String })
  accessor theme: ThemeMode = "auto";

  // Internal state
  @state()
  private accessor recipientAmount: string = "";

  @state()
  private accessor selectedToken: Token | null = null;

  @state()
  private accessor quote: Route | null = null;

  @state()
  private accessor isQuoteLoading: boolean = false;

  @state()
  private accessor isDonating: boolean = false;

  @state()
  private accessor error: string | null = null;

  @state()
  private accessor isInitialized: boolean = false;

  @state()
  private accessor currentTheme: Theme = "light";

  @state()
  private accessor canToggleTheme: boolean = true;

  @state()
  private accessor availableTokens: Token[] = [];

  @state()
  private accessor isLoadingTokens: boolean = false;

  // Services
  private walletService: WalletService;
  private lifiService: LiFiService;
  private chainService: ChainService;
  private themeService: ThemeService;

  // Cleanup functions
  private cleanupFunctions: Array<() => void> = [];

  constructor() {
    super();

    // Initialize services
    this.walletService = new WalletService();
    this.themeService = new ThemeService();
    this.lifiService = new LiFiService({
      walletService: this.walletService,
      apiKey: this.lifiApiKey,
    });
    this.chainService = new ChainService(this.lifiService);
  }

  static override styles = css`
    :host {
      display: block;
      min-width: 360px;
      font-family:
        system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: var(--color-foreground);
      --color-background: oklch(100% 0 0);
      --color-foreground: oklch(14% 0 0);
      --color-primary: oklch(17% 0 0);
      --color-secondary: oklch(96% 0 0);
      --color-accent: oklch(32% 0 0);
      --color-border: oklch(91% 0 0);
      --color-muted: oklch(96% 0 0);
      --color-muted-foreground: oklch(52% 0 0);
      --radius: 1rem;
    }

    :host(.dark) {
      --color-background: oklch(16% 0 0);
      --color-foreground: oklch(99% 0 0);
      --color-primary: oklch(99% 0 0);
      --color-secondary: oklch(26% 0 0);
      --color-accent: oklch(68% 0 0);
      --color-border: oklch(30% 0 0);
      --color-muted: oklch(22% 0 0);
      --color-muted-foreground: oklch(68% 0 0);
    }

    .widget-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 1.5rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow:
        0 1px 3px 0 oklch(0% 0 0 / 0.1),
        0 1px 2px -1px oklch(0% 0 0 / 0.1);
      overflow: visible;
      box-sizing: border-box;
    }

    :host(.dark) .widget-container {
      box-shadow:
        0 1px 3px 0 oklch(0% 0 0 / 0.3),
        0 1px 2px -1px oklch(0% 0 0 / 0.3);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-foreground);
        margin: 0;
      }

      .error-message {
        padding: 0.75rem;
        margin-bottom: 1rem;
        background: oklch(63% 0.24 27 / 0.1);
        border: 1px solid oklch(63% 0.24 27 / 0.3);
        border-radius: calc(var(--radius) - 2px);
        color: oklch(63% 0.24 27);
        font-size: 0.875rem;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: var(--color-muted-foreground);
      }

      .recipient-info {
        padding: 0.75rem;
        margin-bottom: 1rem;
        background: var(--color-muted);
        border-radius: calc(var(--radius) - 2px);
        font-size: 0.875rem;
      }

      .recipient-label {
        color: var(--color-muted-foreground);
        margin-bottom: 0.25rem;
      }

      .recipient-address {
        font-family: "Courier New", monospace;
        color: var(--color-foreground);
        word-break: break-all;
      }

      .footer {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border);
        text-align: center;
      }

      .support-link {
        color: var(--color-muted-foreground);
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s ease;
      }

      .support-link:hover {
        color: var(--color-foreground);
        text-decoration: underline;
      }
    `;

    override async connectedCallback() {
      super.connectedCallback();
      await this.initializeWidget();
    }

    override disconnectedCallback() {
      super.disconnectedCallback();
      this.cleanup();
    }

    private async initializeWidget() {
      try {
        // Initialize theme service first (always needed for display)
        this.themeService.init(this.theme);
        this.currentTheme = this.themeService.getTheme();
        this.canToggleTheme = this.themeService.canToggleTheme();
        this.updateThemeClass(this.currentTheme);

        // Subscribe to theme changes
        const unsubscribeTheme = this.themeService.onThemeChanged(
          (theme: Theme) => {
            this.currentTheme = theme;
            this.updateThemeClass(theme);
          },
        );
        this.cleanupFunctions.push(unsubscribeTheme);

        // Initialize toast container
        await this.updateComplete;
        const toastContainer = this.shadowRoot?.querySelector(
          "toast-container",
        ) as ToastContainer | null;
        if (toastContainer) {
          toastContainer.setToastService(toastService);
        }

        // Mark as initialized so we can show validation errors
        this.isInitialized = true;

        // Validate required attributes
        const validationError = this.validateRequiredAttributes();
        if (validationError) {
          this.error = validationError;
          return;
        }

        // Initialize wallet service
        this.walletService.init(this.reownProjectId);

        // Initialize LiFi service
        this.lifiService.init();

        // Initialize chain service
        await this.chainService.init();

        // Load available tokens
        await this.loadTokens();
      } catch (error) {
        console.error("Failed to initialize widget:", error);
        this.error = error instanceof Error
          ? error.message
          : "Failed to initialize widget";
        this.isInitialized = true; // Still mark as initialized to show the error
      }
    }

    private cleanup() {
      // Call all cleanup functions
      this.cleanupFunctions.forEach((fn) => fn());
      this.cleanupFunctions = [];

      // Destroy theme service
      this.themeService.destroy();
    }

    private async loadTokens() {
      this.isLoadingTokens = true;

      try {
        // Load tokens for supported chains
        const supportedChainIds = [1, 42161, 137, 56, 10, 8453]; // Ethereum, Arbitrum, Polygon, BSC, Optimism, Base
        this.availableTokens = await this.lifiService.getTokens(
          supportedChainIds,
        );
      } catch (error) {
        console.error("Failed to load tokens:", error);
      } finally {
        this.isLoadingTokens = false;
      }
    }

    private updateThemeClass(theme: Theme) {
      if (theme === "dark") {
        this.classList.add("dark");
      } else {
        this.classList.remove("dark");
      }
    }

    protected override updated(changedProperties: PropertyValues) {
      super.updated(changedProperties);

      // Handle recipient changes
      if (changedProperties.has("recipient")) {
        if (this.recipient && !this.isValidAddress(this.recipient)) {
          this.error = "Invalid recipient address format";
        } else if (this.error === "Invalid recipient address format") {
          this.error = null;
        }
      }

      // Handle reownProjectId changes
      if (changedProperties.has("reownProjectId")) {
        if (this.isInitialized && this.reownProjectId) {
          // Re-initialize wallet service with new project ID
          try {
            this.walletService.init(this.reownProjectId);
          } catch (err) {
            console.error("Failed to re-initialize wallet service:", err);
            this.error = "Failed to update Reown configuration";
          }
        }
      }

      // Handle theme changes
      if (changedProperties.has("theme")) {
        this.themeService.setThemeMode(this.theme);
      }

      // Handle LiFi API key changes
      if (changedProperties.has("lifiApiKey")) {
        this.lifiService = new LiFiService({
          walletService: this.walletService,
          apiKey: this.lifiApiKey,
        });
        this.lifiService.init();
      }
    }

    /**
     * Validate Ethereum address format
     */
    private isValidAddress(address: string): boolean {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Validate required attributes
     */
    private validateRequiredAttributes(): string | null {
      if (!this.recipient) {
        return 'Recipient address is required. Add recipient="0x..." attribute.';
      }

      if (!this.isValidAddress(this.recipient)) {
        return "Invalid recipient address format. Must be a valid Ethereum address (0x...).";
      }

      if (!this.reownProjectId) {
        return 'Reown project ID is required. Add reown-project-id="..." attribute. Get one at https://reown.com';
      }

      if (!this.lifiApiKey) {
        return 'LiFi API key is required. Add lifi-api-key="..." attribute. Get one at https://li.fi';
      }

      return null;
    }

    private handleThemeChange(event: CustomEvent<Theme>) {
      this.themeService.setTheme(event.detail);
    }

    private handleAmountChange(event: CustomEvent<string>) {
      this.recipientAmount = event.detail;
    }

    private handleTokenChange(event: CustomEvent<Token>) {
      this.selectedToken = event.detail;
    }

    private handleQuoteUpdate(
      event: CustomEvent<
        { quote: Route | null; loading: boolean; error: string | null }
      >,
    ) {
      this.quote = event.detail.quote;
      this.isQuoteLoading = event.detail.loading;
      if (event.detail.error) {
        this.error = event.detail.error;
      }
    }

    private async handleDonate(event: CustomEvent<Route>) {
      this.isDonating = true;
      this.error = null;

      try {
        const route = event.detail;

        await this.lifiService.executeRoute(route, {
          onRouteUpdate: (updatedRoute: Route) => {
            console.log("Route updated:", updatedRoute);
          },
        });

        toastService.success(
          "Donation successful! Thank you for your contribution.",
        );

        // Reset form
        this.recipientAmount = "";
        this.quote = null;

        // Dispatch success event
        this.dispatchEvent(
          new CustomEvent("donation-completed", {
            detail: { route },
            bubbles: true,
            composed: true,
          }),
        );
      } catch (error) {
        console.error("Donation failed:", error);
        const errorMessage = error instanceof Error
          ? error.message
          : "Donation failed";
        this.error = errorMessage;
        toastService.error(errorMessage);

        // Dispatch error event
        this.dispatchEvent(
          new CustomEvent("donation-failed", {
            detail: { error: errorMessage },
            bubbles: true,
            composed: true,
          }),
        );
      } finally {
        this.isDonating = false;
      }
    }

    override render() {
      if (!this.isInitialized) {
        return html`
          <div class="widget-container">
            <div class="loading">Initializing widget...</div>
          </div>
        `;
      }

      return html`
        <div class="widget-container">
          <div class="header">
            <h2 class="title">Donate</h2>
            ${this.canToggleTheme
              ? html`
                <theme-toggle
                  .theme="${this.currentTheme}"
                  @theme-changed="${this.handleThemeChange}"
                ></theme-toggle>
              `
              : ""}
          </div>

          ${this.error
            ? html`
              <div class="error-message" role="alert">
                ${this.error}
              </div>
            `
            : ""} ${this.recipient && this.isValidAddress(this.recipient)
            ? html`
              <div class="recipient-info">
                <div class="recipient-label">Recipient</div>
                <div class="recipient-address">${this.formatAddress(
                  this.recipient,
                )}</div>
              </div>
            `
            : ""}

          <wallet-section
            .walletService="${this.walletService}"
            .selectedToken="${this.selectedToken}"
            .availableTokens="${this.availableTokens}"
            .isLoadingTokens="${this.isLoadingTokens}"
            @token-selected="${this.handleTokenChange}"
          ></wallet-section>

          <donation-form
            .recipient="${this.recipient}"
            .recipientChainId="${this.recipientChainId}"
            .recipientTokenAddress="${this.recipientTokenAddress}"
            .walletService="${this.walletService}"
            .lifiService="${this.lifiService}"
            .chainService="${this.chainService}"
            .toastService="${toastService}"
            .selectedToken="${this.selectedToken}"
            .isDonating="${this.isDonating}"
            @amount-changed="${this.handleAmountChange}"
            @quote-updated="${this.handleQuoteUpdate}"
            @donate="${this.handleDonate}"
          ></donation-form>

          <div class="footer">
            <a href="mailto:support@donations.kalatori.org" class="support-link">
              Contact developers
            </a>
          </div>
        </div>

        <toast-container></toast-container>
      `;
    }

    private formatAddress(address: string): string {
      if (!address || address.length < 10) return address;
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Public API methods for programmatic control

    /**
     * Set the recipient address programmatically
     * @param address - Ethereum address
     */
    public setRecipient(address: string): void {
      this.recipient = address;
    }

    /**
     * Set the theme programmatically
     * @param theme - Theme mode: 'light', 'dark', or 'auto'
     */
    public setTheme(theme: ThemeMode): void {
      this.theme = theme;
    }

    /**
     * Get the current widget state
     */
    public getState() {
      return {
        recipient: this.recipient,
        theme: this.theme,
        selectedToken: this.selectedToken,
        recipientAmount: this.recipientAmount,
        isInitialized: this.isInitialized,
        isDonating: this.isDonating,
        error: this.error,
      };
    }

    /**
     * Reset the widget to initial state
     */
    public reset(): void {
      this.recipientAmount = "";
      this.selectedToken = null;
      this.quote = null;
      this.error = null;
      this.isDonating = false;
    }
  }

  declare global {
    interface HTMLElementTagNameMap {
      "donation-widget": DonationWidget;
    }
  }
