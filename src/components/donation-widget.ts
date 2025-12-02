import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  ChainService,
  LiFiService,
  ThemeService,
  toastService,
  WalletService,
  i18nService,
  t,
} from "../services/index.ts";
import type { Token } from "../services/WalletService.ts";
import type { Route } from "@lifi/sdk";
import type { Theme, ThemeMode } from "../services/ThemeService.ts";
import type { Address } from "viem";
import type { Locale } from "../services/I18nService.ts";
import { translations } from "../i18n/index.ts";

// Import child components
import "./amount-section.ts";
import "./wallet-connect-card.ts";
import "./token-cards-section.ts";
import "./donate-button.ts";
import "./donation-form.ts";
import "./success-state.ts";
import "./theme-toggle.ts";
import "./toast-container.ts";
import type { ToastContainer } from "./toast-container.ts";

/**
 * Flow step enum for donation widget state machine
 */
export enum FlowStep {
  AMOUNT = "amount",
  WALLET = "wallet",
  TOKEN = "token",
  READY = "ready",
  PROCESSING = "processing",
  SUCCESS = "success",
}

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
 * @attr {string} recipient-token-symbol - Token symbol that recipient will receive (e.g., "USDC"). If not provided, will be looked up from ChainService
 * @attr {string} theme - Theme mode: 'light', 'dark', 'auto', or 'custom' (default: 'auto'). 'custom' mode hides theme toggle and uses CSS variables from parent.
 * @attr {string} success-message - Custom success message displayed after donation (default: "Thank you for your donation!")
 * @attr {string} donate-again-text - Custom text for the "donate again" button (default: "Donate Again")
 * @attr {boolean} confetti-enabled - Whether confetti animation is enabled (default: true)
 * @attr {string} confetti-colors - Comma-separated list of hex colors for confetti (e.g., "#ff0000,#00ff00,#0000ff")
 * @attr {string} default-amount - Default donation amount to pre-fill (e.g., "25")
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
 *   recipient-token-symbol="USDC"
 *   theme="dark"
 *   success-message="Thank you for your generous donation!"
 *   donate-again-text="Make Another Donation"
 *   confetti-enabled="true"
 *   confetti-colors="#ff0000,#00ff00,#0000ff"
 *   default-amount="25">
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

  /** Token symbol that recipient will receive (e.g., "USDC"). If not provided, will be looked up from ChainService */
  @property({ type: String, attribute: "recipient-token-symbol" })
  accessor recipientTokenSymbol: string = "";

  /** Theme mode: 'light', 'dark', or 'auto' (default: 'auto') */
  @property({ type: String })
  accessor theme: ThemeMode = "auto";

  // Success state configuration options
  /** Custom success message displayed after donation (default: uses i18n) */
  @property({ type: String, attribute: "success-message" })
  accessor successMessage: string = "";

  /** Custom text for the "donate again" button (default: uses i18n) */
  @property({ type: String, attribute: "donate-again-text" })
  accessor donateAgainText: string = "";

  /** Whether confetti animation is enabled (default: true) */
  @property({ type: Boolean, attribute: "confetti-enabled" })
  accessor confettiEnabled: boolean = true;

  /** Comma-separated list of hex colors for confetti (optional) */
  @property({ type: String, attribute: "confetti-colors" })
  accessor confettiColors: string = "";

  /** Default donation amount to pre-fill (e.g., "25") */
  @property({ type: String, attribute: "default-amount" })
  accessor defaultAmount: string = "";

  /** Header title text displayed next to the heart icon (default: uses i18n) */
  @property({ type: String, attribute: "header-title" })
  accessor headerTitle: string = "";

  /** Language/locale for the widget (e.g., "en", "ru"). If not set, auto-detects from browser */
  @property({ type: String, attribute: "locale" })
  accessor locale: string = "";

  // Internal state
  @state()
  private accessor currentLocale: Locale = "en";

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

  @state()
  private accessor showSuccessState: boolean = false;

  @state()
  private accessor successData: {
    amount: string;
    tokenSymbol: string;
    chainName: string;
    timestamp: number;
  } | null = null;

  @state()
  private accessor isDirectTransfer: boolean = false;

  // Flow state
  @state()
  private accessor currentStep: FlowStep = FlowStep.AMOUNT;

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

    // Initialize i18n service with translations
    if (!i18nService.isInitialized()) {
      i18nService.init(translations);
    }
  }

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
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
      border-radius: calc(var(--radius) * 1.5);
      box-shadow:
        0 1px 3px 0 oklch(0% 0 0 / 0.1),
        0 1px 2px -1px oklch(0% 0 0 / 0.1);
      overflow: hidden;
      box-sizing: border-box;
      container-type: inline-size;
      container-name: donation-widget;
    }

    :host(.dark) .widget-container {
      box-shadow:
        0 1px 3px 0 oklch(0% 0 0 / 0.3),
        0 1px 2px -1px oklch(0% 0 0 / 0.3);
      }

    .widget-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      padding-top: 0.25rem;
      position: relative;
    }

    .widget-header-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .widget-header-actions {
      margin-left: auto;
    }

    .widget-header-heart {
      font-size: 1rem;
      color: var(--color-accent);
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
        margin-top: 1rem;
        padding-top: 0.75rem;
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

      /* Step transition animations */
      .step-section {
        margin-top: 1rem;
      }

      .step-enter {
        animation: fadeSlideIn 0.3s ease-out;
      }

      @keyframes fadeSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Respect reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .step-enter {
          animation: none;
        }
      }

      /* Wallet info section styles */
      .wallet-info-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        background: linear-gradient(135deg, var(--color-muted) 0%, var(--color-background) 100%);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        gap: 1rem;
        box-shadow: 0 2px 8px oklch(0% 0 0 / 0.04);
      }

      :host(.dark) .wallet-info-card {
        background: linear-gradient(135deg, var(--color-muted) 0%, oklch(20% 0 0) 100%);
        box-shadow: 0 2px 8px oklch(0% 0 0 / 0.2);
      }

      .wallet-info-left {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        flex: 1;
        min-width: 0;
      }

      .wallet-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        background: linear-gradient(135deg, oklch(60% 0.15 250) 0%, oklch(55% 0.18 280) 100%);
        border-radius: 12px;
        flex-shrink: 0;
      }

      .wallet-avatar svg {
        width: 1.25rem;
        height: 1.25rem;
        color: white;
      }

      .wallet-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
      }

      .wallet-address {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-foreground);
        letter-spacing: 0.01em;
      }

      .network-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        background: var(--color-background);
        border: 1px solid var(--color-border);
        border-radius: 9999px;
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--color-muted-foreground);
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        width: fit-content;
      }

      .network-badge:hover {
        background: var(--color-secondary);
        border-color: var(--color-accent);
        color: var(--color-foreground);
      }

      .network-badge .network-dot {
        width: 0.5rem;
        height: 0.5rem;
        background: oklch(70% 0.2 145);
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px oklch(70% 0.2 145 / 0.5);
      }

      .network-badge svg {
        width: 0.75rem;
        height: 0.75rem;
        opacity: 0.6;
        transition: opacity 0.2s ease;
      }

      .network-badge:hover svg {
        opacity: 1;
      }

      .wallet-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .disconnect-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background: var(--color-background);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        color: var(--color-muted-foreground);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .disconnect-btn:hover {
        background: oklch(63% 0.24 27 / 0.1);
        color: oklch(63% 0.24 27);
        border-color: oklch(63% 0.24 27 / 0.3);
        transform: scale(1.05);
      }

      .disconnect-btn:active {
        transform: scale(0.95);
      }

      .disconnect-btn svg {
        width: 1.125rem;
        height: 1.125rem;
      }

      /* Mobile responsive styles */
      @container donation-widget (max-width: 400px) {
        .widget-container {
          padding: 1rem;
          border-radius: var(--radius);
        }

        .widget-header-text {
          font-size: 0.75rem;
        }

        .wallet-info-card {
          padding: 0.75rem 1rem;
          flex-wrap: wrap;
        }

        .wallet-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 8px;
        }

        .wallet-avatar svg {
          width: 1rem;
          height: 1rem;
        }

        .wallet-address {
          font-size: 0.8125rem;
        }

        .network-badge {
          font-size: 0.625rem;
          padding: 0.1875rem 0.5rem;
        }
      }
    `;

  override connectedCallback() {
    super.connectedCallback();
    
    // Add version metadata to the widget element
    const version = (window as { __DONATION_WIDGET__?: { version?: string } }).__DONATION_WIDGET__?.version || "unknown";
    this.setAttribute("data-version", version);
    

  }

  override async firstUpdated() {
    // firstUpdated is called after the first render, ensuring attributes are read
    await this.initializeWidget();
  }

    override disconnectedCallback() {
      super.disconnectedCallback();
      this.cleanup();
    }

  private async initializeWidget() {
    try {
      // Initialize i18n - detect locale from locale attribute or browser
      const detectedLocale = i18nService.detectLocale(this.locale || undefined);
      i18nService.setLocale(detectedLocale);
      this.currentLocale = detectedLocale;

      // Subscribe to locale changes
      const unsubscribeI18n = i18nService.onLocaleChanged((locale) => {
        this.currentLocale = locale;
        this.requestUpdate();
      });
      this.cleanupFunctions.push(unsubscribeI18n);

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

      // Mark as initialized so we can show the UI
      this.isInitialized = true;

      // Initialize default amount if provided
      if (this.defaultAmount) {
        // Validate that defaultAmount is a valid numeric value
        const amount = parseFloat(this.defaultAmount);
        if (!isNaN(amount) && amount > 0) {
          this.recipientAmount = this.defaultAmount;
        }
      }

      // Validate required attributes
      const configStatus = this.validateRequiredAttributes();

      // If not fully configured, log warning but still initialize what we can
      if (!configStatus.isValid) {
        console.warn("Widget is not fully configured:", configStatus.missing);
      }

      // Initialize services based on what configuration is available
      if (this.reownProjectId) {
        this.walletService.init(this.reownProjectId);
        // Set theme mode after AppKit is initialized (updateThemeClass was called before init)
        this.walletService.setThemeMode(this.currentTheme);
      }

      // Initialize LiFi service if API key is provided
      if (this.lifiApiKey) {
        this.lifiService.init();
      }

      // Always initialize chain service (works with or without LiFi API key)
      await this.chainService.init();
      
      // Load available tokens (will use hardcoded tokens if LiFi is unavailable)
      this.loadTokens();

      // Initialize flow step
      this.updateFlowStep();

      // Set up wallet listeners to update flow step on connection changes
      this.setupWalletListeners();
    } catch (error) {
      console.error("Failed to initialize widget:", error);
      this.error = error instanceof Error
        ? error.message
        : t("message.initFailed");
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

    /**
     * Set up wallet event listeners to update flow step on connection changes
     */
    private setupWalletListeners(): void {
      if (!this.walletService) return;

      // Listen for account changes (wallet connected)
      const unsubscribeAccount = this.walletService.onAccountChanged(() => {
        this.updateFlowStep();
        // Trigger re-render to update UI
        this.requestUpdate();
      });

      // Listen for chain changes (network switched)
      const unsubscribeChain = this.walletService.onChainChanged((chainId: number) => {
        // Clear selected token when chain changes (token may not exist on new chain)
        if (this.selectedToken && this.selectedToken.chainId !== chainId) {
          this.selectedToken = null;
          this.quote = null;
        }
        this.updateFlowStep();
        // Trigger re-render to update UI
        this.requestUpdate();
        // Close Reown modal after network switch
        this.walletService.closeModal();
      });

      // Listen for disconnect
      const unsubscribeDisconnect = this.walletService.onDisconnect(() => {
        this.selectedToken = null;
        this.quote = null;
        this.updateFlowStep();
        // Trigger re-render to update UI
        this.requestUpdate();
      });

      this.cleanupFunctions.push(unsubscribeAccount, unsubscribeChain, unsubscribeDisconnect);
    }

    private loadTokens() {
      this.isLoadingTokens = true;

      try {
        // Get tokens from chain service (will use hardcoded tokens if LiFi is unavailable)
        this.availableTokens = this.chainService.getAllTokens();
      } catch (error) {
        console.error("Failed to load tokens:", error);
        // Fallback to empty array if something goes wrong
        this.availableTokens = [];
      } finally {
        this.isLoadingTokens = false;
      }
    }

    private updateThemeClass(theme: Theme) {
      // Sync theme with Reown AppKit first
      this.walletService.setThemeMode(theme);

      if (theme === "dark") {
        this.classList.add("dark");
      } else {
        this.classList.remove("dark");
      }
    }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    // Update flow step when relevant state changes
    if (
      changedProperties.has("recipientAmount") ||
      changedProperties.has("selectedToken") ||
      changedProperties.has("quote") ||
      changedProperties.has("isQuoteLoading") ||
      changedProperties.has("isDonating") ||
      changedProperties.has("showSuccessState")
    ) {
      this.updateFlowStep();
    }

    // Revalidate configuration if any required property changed
    if (
      changedProperties.has("recipient") ||
      changedProperties.has("reownProjectId") ||
      changedProperties.has("lifiApiKey")
    ) {
      if (this.isInitialized) {
        const configStatus = this.validateRequiredAttributes();
        if (!configStatus.isValid) {
          console.warn("Widget is not fully configured:", configStatus.missing);
        }
      }
    }

    // Handle recipient changes
    if (changedProperties.has("recipient")) {
      if (this.recipient && !this.isValidAddress(this.recipient)) {
        this.error = t("message.invalidRecipient");
      } else if (this.error === t("message.invalidRecipient")) {
        this.error = null;
      }
    }

    // Handle reownProjectId changes
    if (changedProperties.has("reownProjectId")) {
      // Initialize or re-initialize wallet service when project ID is available
      // WalletService.init() handles checking if already initialized and cleanup if needed
      if (this.reownProjectId) {
        try {
          this.walletService.init(this.reownProjectId);
        } catch (err) {
          console.error("Failed to initialize/re-initialize wallet service:", err);
          this.error = "Failed to initialize Reown wallet connection";
        }
      }
    }

    // Handle theme changes
    if (changedProperties.has("theme")) {
      this.themeService.setThemeMode(this.theme);
    }

    // Handle locale property changes
    if (changedProperties.has("locale")) {
      const detectedLocale = i18nService.detectLocale(this.locale || undefined);
      if (detectedLocale !== this.currentLocale) {
        i18nService.setLocale(detectedLocale);
        this.currentLocale = detectedLocale;
      }
    }

    // Handle LiFi API key changes
    if (changedProperties.has("lifiApiKey")) {
      if (this.lifiApiKey) {
        this.lifiService = new LiFiService({
          walletService: this.walletService,
          apiKey: this.lifiApiKey,
        });
        this.lifiService.init();
      }
    }
  }

    /**
     * Validate Ethereum address format
     */
    private isValidAddress(address: string): boolean {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Check if amount is valid and greater than zero
     */
    private hasValidAmount(): boolean {
      const amount = parseFloat(this.recipientAmount);
      return !isNaN(amount) && amount > 0;
    }

    /**
     * Check if wallet is connected
     */
    private isWalletConnected(): boolean {
      return this.walletService.isConnected();
    }

    /**
     * Calculate equivalent amount in selected token from quote
     * Returns formatted string like "24 USDC" when token is selected and quote is available
     */
    private getEquivalentAmount(): string {
      if (!this.quote || !this.selectedToken) {
        return "";
      }

      // Validate that fromAmount exists and is a valid value
      if (!this.quote.fromAmount || this.quote.fromAmount === undefined) {
        return "";
      }

      try {
        const fromAmount = BigInt(this.quote.fromAmount);
        const decimals = this.selectedToken.decimals;
        const divisor = BigInt(10 ** decimals);
        const amount = Number(fromAmount) / Number(divisor);
        // Format with up to 6 decimals, but remove trailing zeros
        const formatted = amount.toFixed(6).replace(/\.?0+$/, "");
        return `${formatted} ${this.selectedToken.symbol}`;
      } catch (error) {
        console.error("Failed to calculate equivalent amount:", error);
        return "";
      }
    }

    /**
     * Update flow step based on current state
     * Implements the state machine transitions:
     * - AmountEntry → WalletConnect: Amount > 0
     * - WalletConnect → AmountEntry: Amount cleared
     * - WalletConnect → TokenSelection: Wallet connected
     * - TokenSelection → WalletConnect: Wallet disconnected
     * - TokenSelection → DonateReady: Token selected
     * - DonateReady → TokenSelection: Token deselected
     * - DonateReady → Processing: Donate clicked
     * - Processing → Success: Transaction success
     * - Processing → DonateReady: Transaction failed
     * - Success → AmountEntry: Donate again
     */
    private updateFlowStep(): void {
      // If showing success state, we're in success step
      if (this.showSuccessState) {
        this.currentStep = FlowStep.SUCCESS;
        return;
      }

      // If processing donation, we're in processing step
      if (this.isDonating) {
        this.currentStep = FlowStep.PROCESSING;
        return;
      }

      // If no valid amount, we're in amount step
      if (!this.hasValidAmount()) {
        this.currentStep = FlowStep.AMOUNT;
        return;
      }

      // Amount is valid, check wallet connection
      if (!this.isWalletConnected()) {
        this.currentStep = FlowStep.WALLET;
        return;
      }

      // Wallet is connected, check token selection
      if (!this.selectedToken) {
        this.currentStep = FlowStep.TOKEN;
        return;
      }

      // Token is selected, check if quote is ready
      if (this.quote && !this.isQuoteLoading) {
        this.currentStep = FlowStep.READY;
        return;
      }

      // Token selected but waiting for quote
      this.currentStep = FlowStep.TOKEN;
    }

  /**
   * Validate required attributes and return detailed configuration status
   */
  private validateRequiredAttributes(): { isValid: boolean; missing: string[]; configured: string[] } {
    const configured: string[] = [];
    const missing: string[] = [];

    // Check recipient
    if (this.recipient && this.isValidAddress(this.recipient)) {
      configured.push("recipient");
    } else {
      missing.push("recipient");
    }

    // Check reown project ID
    if (this.reownProjectId) {
      configured.push("reownProjectId");
    } else {
      missing.push("reownProjectId");
    }

    // Check LiFi API key
    if (this.lifiApiKey) {
      configured.push("lifiApiKey");
    } else {
      missing.push("lifiApiKey");
    }

    return {
      isValid: missing.length === 0,
      missing,
      configured,
    };
  }

    private handleThemeChange(event: CustomEvent<Theme>) {
      this.themeService.setTheme(event.detail);
    }

    private handleAmountChange(event: CustomEvent<string | { value: string }>) {
      // Handle both formats: direct string or { value: string }
      const newAmount = typeof event.detail === "string"
        ? event.detail
        : event.detail.value;
      
      this.recipientAmount = newAmount;
      // donation-form will automatically sync via recipient-amount property binding
    }

    private handleTokenChange(event: CustomEvent<Token>) {
      this.selectedToken = event.detail;
      // donation-form will automatically recalculate quote when selectedToken changes
    }

    /**
     * Handle wallet connect click - wallet-connect-card already handles opening modal
     * This handler is for any additional logic needed
     */
    private handleWalletConnectClick() {
      // Wallet connection is handled by wallet-connect-card component
      // The widget will automatically update flow step when wallet connects
      // via setupWalletListeners() which listens to account changes
    }

    /**
     * Handle opening network selector modal
     */
    private async handleOpenNetworkModal() {
      try {
        await this.walletService.openNetworkModal();
      } catch (error) {
        console.error("Failed to open network modal:", error);
        this.error = error instanceof Error
          ? error.message
          : "Failed to open network selector";
      }
    }

    /**
     * Handle wallet disconnect
     */
    private async handleDisconnect() {
      try {
        await this.walletService.disconnect();
        // Clear selected token when disconnecting
        this.selectedToken = null;
        this.quote = null;
      } catch (error) {
        console.error("Failed to disconnect wallet:", error);
        this.error = error instanceof Error
          ? error.message
          : "Failed to disconnect wallet";
      }
    }

    /**
     * Get the current connected chain ID
     */
    private getConnectedChainId(): number | null {
      return this.walletService.getAccount()?.chainId || null;
    }

    /**
     * Get network name by chain ID
     */
    private getNetworkName(chainId: number): string {
      return this.chainService.getChainName(chainId);
    }

    /**
     * Get the recipient token symbol (the currency that will be received)
     */
    private getRecipientTokenSymbol(): string {
      const token = this.chainService.getToken(this.recipientChainId, this.recipientTokenAddress);
      return token?.symbol || "USDC";
    }

    /**
     * Handle donate button click - trigger transaction
     */
    private handleDonateClick() {
      if (!this.quote || this.isDonating) {
        return;
      }

      // Trigger donation - use existing handleDonate which executes the transaction
      // donation-form handles quote calculation and emits donation-completed when done
      this.handleDonate(new CustomEvent("donate", { detail: this.quote }));
    }

    private async handleNetworkSwitch(event: CustomEvent<{ chainId: number }>) {
      const newChainId = event.detail.chainId;
      console.log("Network switched to:", newChainId);
      
      // Reload tokens for the new network
      await this.reloadTokensForChain(newChainId);
    }

    private async reloadTokensForChain(chainId: number) {
      this.isLoadingTokens = true;

      try {
        // Try to refresh tokens from LiFi for the specific chain
        if (this.lifiApiKey) {
          try {
            const chainTokens = await this.lifiService.getTokens([chainId]);
            if (chainTokens && chainTokens.length > 0) {
              // Update tokens: remove old tokens for this chain and add new ones
              const otherChainTokens = this.availableTokens.filter(
                (token) => token.chainId !== chainId
              );
              this.availableTokens = [...otherChainTokens, ...chainTokens];
              return;
            }
          } catch (error) {
            console.warn("Failed to fetch tokens from LiFi for chain:", chainId, error);
          }
        }

        // Fallback: reload all tokens from chain service
        // This will include hardcoded tokens if LiFi is unavailable
        this.availableTokens = this.chainService.getAllTokens();
      } catch (error) {
        console.error("Failed to reload tokens for chain:", error);
        // Keep existing tokens as fallback
      } finally {
        this.isLoadingTokens = false;
      }
    }

    private handleQuoteUpdate(
      event: CustomEvent<
        { quote: Route | null; loading: boolean; error: string | null; isDirectTransfer?: boolean }
      >,
    ) {
      this.quote = event.detail.quote;
      this.isQuoteLoading = event.detail.loading;
      this.isDirectTransfer = event.detail.isDirectTransfer || false;
      // Set error for quote errors - all errors are displayed in donation-widget
      if (event.detail.error) {
        this.error = event.detail.error;
      } else {
        // Clear error when quote is successfully calculated
        this.error = null;
      }
    }

    /**
     * Handle route update
     */
    private handleRouteUpdate(_event: CustomEvent<{ route: Route }>) {
      // Route update handler (kept for potential future use)
    }

    /**
     * Handle donation completed event from donation-form
     */
    private handleDonationCompleted(event: CustomEvent<{
      amount: string;
      token: Token | null;
      recipient: string;
    }>) {
      const { amount, token, recipient } = event.detail;

      if (!token) {
        console.warn("Donation completed but no token information available");
        return;
      }

      // Get chain name
      const chainName = this.chainService.getChainName(this.recipientChainId);

      // Get token symbol (use recipient token if available, otherwise use selected token)
      const tokenSymbol = token.symbol || "tokens";

      // Set success data
      this.successData = {
        amount,
        tokenSymbol,
        chainName,
        timestamp: Date.now(),
      };

      // Show success state
      this.showSuccessState = true;

      // Dispatch success event (for external listeners)
      this.dispatchEvent(
        new CustomEvent("donation-completed", {
          detail: {
            amount,
            token,
            recipient,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }

    /**
     * Handle donate again button click
     */
    private handleDonateAgain() {
      // Reset success state
      this.showSuccessState = false;
      this.successData = null;

      // Reset form state to initial state
      this.recipientAmount = "";
      this.quote = null;
      this.selectedToken = null;
      this.error = null;
      this.isDonating = false;
      this.isQuoteLoading = false;
      this.isDirectTransfer = false;
    }

    private async handleDonate(event: CustomEvent<Route>) {
      this.isDonating = true;
      this.error = null;

      try {
        const route = event.detail;

        if (this.isDirectTransfer && this.selectedToken) {
          // Execute direct token transfer (same token, same chain)
          const amount = BigInt(route.fromAmount);
          const toAddress = this.recipient as Address;

          console.log("Executing direct transfer:", {
            token: this.selectedToken.symbol,
            amount: amount.toString(),
            to: toAddress,
          });

          const txHash = await this.walletService.transferToken(
            this.selectedToken,
            toAddress,
            amount,
          );

          console.log("Direct transfer successful:", txHash);
        } else {
          // Execute LiFi route for swap/bridge
          await this.lifiService.executeRoute(route, {
            onRouteUpdate: (updatedRoute: Route) => {
              console.log("Route updated:", updatedRoute);
            },
          });
        }

        toastService.success(t("message.donationSuccess"));

        // Get chain name for success data
        const chainName = this.chainService.getChainName(this.recipientChainId);

        // Get recipient token symbol
        const recipientTokenSymbol = this.recipientTokenSymbol || this.getRecipientTokenSymbol();

        // Set success data for success screen
        this.successData = {
          amount: this.recipientAmount,
          tokenSymbol: recipientTokenSymbol,
          chainName,
          timestamp: Date.now(),
        };

        // Show success state with confetti
        this.showSuccessState = true;

        // Dispatch success event
        this.dispatchEvent(
          new CustomEvent("donation-completed", {
            detail: { 
              route,
              amount: this.recipientAmount,
              token: this.selectedToken,
              recipient: this.recipient,
            },
            bubbles: true,
            composed: true,
          }),
        );

        // Reset form state (but keep success screen showing)
        this.quote = null;
        this.isDirectTransfer = false;
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
          <div class="widget-header">
            <div class="widget-header-text">
              <span class="widget-header-heart">♡</span>
              <span>${this.headerTitle || t("widget.header.title")}</span>
            </div>
            <div class="widget-header-actions">
              ${this.canToggleTheme
                ? html`
                  <theme-toggle
                    .theme="${this.currentTheme}"
                    @theme-changed="${this.handleThemeChange}"
                  ></theme-toggle>
                `
                : ""}
            </div>
          </div>
          <div class="loading">${t("widget.loading")}</div>
        </div>
      `;
    }

    const configStatus = this.validateRequiredAttributes();
    const isFullyConfigured = configStatus.isValid;

    return html`
      <div class="widget-container">
        <div class="widget-header">
          <div class="widget-header-text">
            <span class="widget-header-heart">♡</span>
            <span>${this.headerTitle || t("widget.header.title")}</span>
          </div>
          <div class="widget-header-actions">
            ${this.canToggleTheme
              ? html`
                <theme-toggle
                  .theme="${this.currentTheme}"
                  @theme-changed="${this.handleThemeChange}"
                ></theme-toggle>
              `
              : ""}
          </div>
        </div>

        ${this.error
          ? html`
            <div class="error-message" role="alert">
              ${this.error}
            </div>
          `
          : ""}

        ${this.showSuccessState && this.successData
          ? html`
              <success-state
                amount="${this.successData.amount}"
                token-symbol="${this.successData.tokenSymbol}"
                chain-name="${this.successData.chainName}"
                timestamp="${this.successData.timestamp}"
                recipient-address="${this.recipient}"
                success-message="${this.successMessage || t("success.defaultMessage")}"
                donate-again-text="${this.donateAgainText || t("success.donateAgain")}"
                ?confetti-enabled="${this.confettiEnabled}"
                confetti-colors="${this.confettiColors}"
                @donate-again="${this.handleDonateAgain}"
              ></success-state>
            `
          : html`
              <!-- AmountSection: Always visible -->
              <amount-section
                value="${this.recipientAmount}"
                currency-symbol="${this.recipientTokenSymbol || this.getRecipientTokenSymbol()}"
                @amount-change="${this.handleAmountChange}"
              ></amount-section>

              <!-- WalletConnectCard: Show when wallet not connected (always visible) -->
              ${!this.isWalletConnected()
                ? html`
                    <div class="step-section step-enter">
                      <wallet-connect-card
                        .walletService="${this.walletService}"
                        ?is-connecting="${false}"
                        ?is-connected="${false}"
                        @wallet-connect-click="${this.handleWalletConnectClick}"
                        @wallet-error="${(e: CustomEvent) => {
                          this.error = e.detail.error;
                        }}"
                      ></wallet-connect-card>
                    </div>
                  `
                : ""}

              <!-- WalletInfoSection: Show when wallet connected -->
              ${this.isWalletConnected()
                ? html`
                    <div class="step-section step-enter">
                      <div class="wallet-info-card">
                        <div class="wallet-info-left">
                          <div class="wallet-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                            </svg>
                          </div>
                          <div class="wallet-details">
                            <span class="wallet-address">
                              ${this.formatAddress(this.walletService.getAccount()?.address || "")}
                            </span>
                            <button
                              class="network-badge"
                              @click="${this.handleOpenNetworkModal}"
                              aria-label="${t("wallet.switchNetworkAriaLabel")}"
                              title="${t("wallet.switchNetworkAriaLabel")}"
                            >
                              <span class="network-dot"></span>
                              ${this.getNetworkName(this.getConnectedChainId() || 1)}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m6 9 6 6 6-6"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div class="wallet-actions">
                          <button
                            class="disconnect-btn"
                            @click="${this.handleDisconnect}"
                            aria-label="${t("wallet.disconnectAriaLabel")}"
                            title="${t("wallet.disconnectAriaLabel")}"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                              <polyline points="16,17 21,12 16,7"></polyline>
                              <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  `
                : ""}

              <!-- TokenCardsSection: Show when wallet connected -->
              ${this.isWalletConnected()
                ? html`
                    <div class="step-section step-enter">
                      <token-cards-section
                        .tokens="${this.availableTokens}"
                        .selectedToken="${this.selectedToken}"
                        .walletService="${this.walletService}"
                        .walletAddress="${this.walletService.getAccount()?.address || null}"
                        current-chain-id="${this.getConnectedChainId() || ""}"
                        required-amount="${this.recipientAmount}"
                        @token-selected="${this.handleTokenChange}"
                      ></token-cards-section>
                    </div>
                  `
                : ""}

              <!-- DonateButton: Show when token selected -->
              ${this.selectedToken
                ? html`
                    <div class="step-section step-enter">
                      <donate-button
                        .amount="${this.getEquivalentAmount().split(" ")[0] || ""}"
                        .tokenSymbol="${this.selectedToken.symbol}"
                        ?disabled="${!isFullyConfigured || this.isDonating || this.isQuoteLoading}"
                        ?loading="${this.isDonating}"
                        ?calculating="${this.isQuoteLoading}"
                        @donate-click="${this.handleDonateClick}"
                      ></donate-button>
                    </div>
                  `
                : ""}

              <!-- Hidden donation-form for quote calculation -->
              <donation-form
                style="position: absolute; opacity: 0; pointer-events: none; height: 0; overflow: hidden;"
                .recipient="${this.recipient}"
                .recipientChainId="${this.recipientChainId}"
                .recipientTokenAddress="${this.recipientTokenAddress}"
                .walletService="${this.walletService}"
                .lifiService="${this.lifiService}"
                .chainService="${this.chainService}"
                .toastService="${toastService}"
                .selectedToken="${this.selectedToken}"
                .isDonating="${this.isDonating}"
                .disabled="${!isFullyConfigured}"
                recipient-amount="${this.recipientAmount}"
                @amount-changed="${this.handleAmountChange}"
                @quote-updated="${this.handleQuoteUpdate}"
                @route-update="${this.handleRouteUpdate}"
                @donation-completed="${this.handleDonationCompleted}"
                @donate="${this.handleDonate}"
              ></donation-form>
            `}

        <div class="footer">
          <a href="mailto:support@donations.kalatori.org" class="support-link">
            ${t("widget.footer.contact")}
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
      this.showSuccessState = false;
      this.successData = null;
    }
  }

  declare global {
    interface HTMLElementTagNameMap {
      "donation-widget": DonationWidget;
    }
  }
