import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  ChainService,
  ThemeService,
  toastService,
  WalletService,
  i18nService,
  t,
  I18nError,
  QuoteService,
  DonationService,
  type QuoteResult,
} from "../services/index.ts";
import { AcrossService, type AcrossQuote } from "../services/AcrossService.ts";
import { POLYGON_CHAIN_ID, POLYGON_USDC_ADDRESS } from "../constants/azoth-pay.ts";
import {
  AzothPayService,
  type ExistingSubscriptionInfo,
} from "../services/AzothPayService.ts";
import type { Token } from "../services/WalletService.ts";
import type { Theme, ThemeMode } from "../services/ThemeService.ts";
import type { Address } from "viem";
import type { Locale } from "../services/I18nService.ts";
import { translations } from "../i18n/index.ts";
import type { DonationType } from "./donation-type-toggle.ts";

// Import child components
import "./amount-section.ts";
import "./wallet-connect-card.ts";
import "./token-cards-section.ts";
import "./donate-button.ts";
import "./success-state.ts";
import "./theme-toggle.ts";
import "./toast-container.ts";
import "./donation-type-toggle.ts";
import "./subscription-setup-screen.ts";
import "./subscription-progress-screen.ts";
import type { ToastContainer } from "./toast-container.ts";
import type { SubscriptionSetupData } from "./subscription-setup-screen.ts";
import type { SubscriptionStep } from "./subscription-progress-screen.ts";

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
  SUBSCRIPTION_SETUP = "subscription-setup",
  SUBSCRIPTION_PROGRESS = "subscription-progress",
}

/**
 * Donation Widget - Main component for cryptocurrency donations
 *
 * Recipients always receive USDC on Polygon (hardcoded).
 *
 * @element donation-widget
 *
 * @attr {string} recipient - Recipient wallet address (required)
 * @attr {string} reown-project-id - Reown project ID (required)
 * @attr {string} theme - Theme mode: 'light', 'dark', 'auto', or 'custom' (default: 'auto'). 'custom' mode hides theme toggle and uses CSS variables from parent.
 * @attr {string} success-message - Custom success message displayed after donation (default: "Thank you for your donation!")
 * @attr {string} donate-again-text - Custom text for the "donate again" button (default: "Donate Again")
 * @attr {boolean} confetti-enabled - Whether confetti animation is enabled (default: true)
 * @attr {string} confetti-colors - Comma-separated list of hex colors for confetti (e.g., "#ff0000,#00ff00,#0000ff")
 * @attr {string} default-amount - Default donation amount to pre-fill (e.g., "25")
 * @attr {boolean} continuous-enabled - When true, shows the donation type toggle and enables continuous payments (default: false)
 * @attr {string} subscription-target - Target address for subscriptions. If not set, uses recipient address
 * @attr {number} project-id - Project ID for AzothPay subscription (default: 0)
 *
 * @fires donation-completed - Fired when donation succeeds
 * @fires subscription-created - Fired when subscription is created successfully
 * @fires donation-failed - Fired when donation fails
 *
 * @example
 * ```html
 * <donation-widget
 *   recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
 *   reown-project-id="YOUR_REOWN_PROJECT_ID"
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

  // Optional properties with defaults
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

  // Subscription properties
  /** When true, shows the donation type toggle and enables continuous payments */
  @property({ type: Boolean, attribute: "continuous-enabled" })
  accessor continuousEnabled: boolean = false;

  /** Target address for subscriptions. If not set, uses recipient address */
  @property({ type: String, attribute: "subscription-target" })
  accessor subscriptionTarget: string = "";

  /** Project ID for AzothPay subscription */
  @property({ type: Number, attribute: "project-id" })
  accessor projectId: number = 0;

  // Internal state
  @state()
  private accessor currentLocale: Locale = "en";

  @state()
  private accessor recipientAmount: string = "";

  @state()
  private accessor selectedToken: Token | null = null;

  @state()
  private accessor quote: AcrossQuote | null = null;

  @state()
  private accessor isQuoteLoading: boolean = false;

  @state()
  private accessor isDonating: boolean = false;

  @state()
  private accessor error: string | I18nError | null = null;

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
  private accessor recipientTokenInfo: Token | null = null;

  @state()
  private accessor showSuccessState: boolean = false;

  @state()
  private accessor successData: {
    amount: string;
    tokenSymbol: string;
    chainName: string;
    timestamp: number;
    isSubscription?: boolean;
    monthlyAmount?: string;
    walletAddress?: string;
  } | null = null;

  @state()
  private accessor isDirectTransfer: boolean = false;

  // Subscription state
  @state()
  private accessor donationType: DonationType = "one-time";

  @state()
  private accessor isSubscriptionFlow: boolean = false;

  @state()
  private accessor subscriptionMonthlyAmount: string = "";

  @state()
  private accessor subscriptionProgressStep: SubscriptionStep = "idle";

  // Subscription setup/progress screen state
  @state()
  private accessor subscriptionSetupData: SubscriptionSetupData | null = null;

  @state()
  private accessor subscriptionError: string = "";

  @state()
  private accessor subscriptionIsDirectTransfer: boolean = false;

  @state()
  private accessor isSameChainSwap: boolean = false;

  /** Cached quote result from QuoteService */
  @state()
  private accessor quoteResult: QuoteResult | null = null;

  // Existing subscription state
  @state()
  private accessor existingSubscription: ExistingSubscriptionInfo | null = null;

  @state()
  private accessor isCheckingSubscription: boolean = false;

  /**
   * Get the effective subscription target address.
   * Returns subscriptionTarget if set, otherwise falls back to recipient.
   */
  get effectiveSubscriptionTarget(): Address {
    return (this.subscriptionTarget || this.recipient) as Address;
  }

  /**
   * Get Papaya Finance management URL for subscription
   */
  private get papayaManagementUrl(): string {
    const walletAddress = this.walletService.getAccount()?.address;
    if (!walletAddress) return "https://app.papaya.finance";
    return `https://app.papaya.finance/wallet/${walletAddress}#Subscriptions`;
  }

  // Flow state
  @state()
  private accessor currentStep: FlowStep = FlowStep.AMOUNT;

  // Services
  private walletService: WalletService;
  private acrossService: AcrossService;
  private chainService: ChainService;
  private themeService: ThemeService;
  private azothPayService: AzothPayService;
  private quoteService: QuoteService | null = null;
  private donationService: DonationService | null = null;

  // Quote debounce timer
  private quoteDebounceTimer: number | null = null;
  private readonly QUOTE_DEBOUNCE_MS = 500;

  // Cleanup functions
  private cleanupFunctions: Array<() => void> = [];

  constructor() {
    super();

    // Initialize services
    this.walletService = new WalletService();
    this.themeService = new ThemeService();
    this.acrossService = new AcrossService({
      walletService: this.walletService,
    });
    this.chainService = new ChainService(this.acrossService);
    this.azothPayService = AzothPayService.getInstance();

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
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        "Helvetica Neue",
        Arial,
        sans-serif;
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
      position: relative;
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
      background: linear-gradient(
        135deg,
        var(--color-muted) 0%,
        var(--color-background) 100%
      );
      border: 1px solid var(--color-border);
      border-radius: 16px;
      gap: 1rem;
      box-shadow: 0 2px 8px oklch(0% 0 0 / 0.04);
    }

    :host(.dark) .wallet-info-card {
      background: linear-gradient(
        135deg,
        var(--color-muted) 0%,
        oklch(20% 0 0) 100%
      );
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
      background: linear-gradient(
        135deg,
        oklch(60% 0.15 250) 0%,
        oklch(55% 0.18 280) 100%
      );
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
      font-family:
        ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
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

    /* Existing subscription indicator */
    .existing-subscription-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      margin-top: 0.75rem;
      background: oklch(60% 0.15 250 / 0.08);
      border: 1px solid oklch(60% 0.15 250 / 0.2);
      border-radius: calc(var(--radius) - 4px);
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
    }

    :host(.dark) .existing-subscription-indicator {
      background: oklch(60% 0.15 250 / 0.12);
      border-color: oklch(60% 0.15 250 / 0.25);
    }

    .existing-subscription-indicator .message {
      color: var(--color-foreground);
    }

    .existing-subscription-indicator .separator {
      color: var(--color-muted-foreground);
      opacity: 0.5;
    }

    .existing-subscription-indicator .manage-link {
      color: oklch(55% 0.18 250);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .existing-subscription-indicator .manage-link:hover {
      color: oklch(50% 0.2 250);
      text-decoration: underline;
    }

    :host(.dark) .existing-subscription-indicator .manage-link {
      color: oklch(70% 0.15 250);
    }

    :host(.dark) .existing-subscription-indicator .manage-link:hover {
      color: oklch(75% 0.18 250);
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
    const version =
      (window as { __DONATION_WIDGET__?: { version?: string } })
        .__DONATION_WIDGET__?.version || "unknown";
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

      // Initialize chain service (uses AcrossService for chain data enrichment)
      await this.chainService.init();

      // Load available tokens from ChainService
      this.loadTokens();

      // Initialize flow step
      this.updateFlowStep();

      // Set up wallet listeners to update flow step on connection changes
      this.setupWalletListeners();
    } catch (error) {
      console.error("Failed to initialize widget:", error);
      this.error =
        error instanceof Error ? error.message : t("message.initFailed");
      this.isInitialized = true; // Still mark as initialized to show the error
    }
  }

  private cleanup() {
    // Clear debounce timer
    if (this.quoteDebounceTimer !== null) {
      clearTimeout(this.quoteDebounceTimer);
      this.quoteDebounceTimer = null;
    }

    // Call all cleanup functions
    this.cleanupFunctions.forEach((fn) => fn());
    this.cleanupFunctions = [];

    // Destroy theme service
    this.themeService.destroy();
  }

  /**
   * Get or create QuoteService instance
   */
  private getQuoteService(): QuoteService {
    if (!this.quoteService) {
      this.quoteService = QuoteService.getInstance(this.walletService, this.acrossService);
    }
    return this.quoteService;
  }

  /**
   * Get or create DonationService instance
   */
  private getDonationService(): DonationService {
    if (!this.donationService) {
      this.donationService = DonationService.getInstance(
        this.walletService,
        this.acrossService,
        this.azothPayService
      );
    }
    return this.donationService;
  }

  /**
   * Debounced quote calculation
   */
  private debouncedQuoteCalculation() {
    if (this.quoteDebounceTimer !== null) {
      clearTimeout(this.quoteDebounceTimer);
    }

    this.quoteDebounceTimer = globalThis.setTimeout(() => {
      this.calculateQuote();
    }, this.QUOTE_DEBOUNCE_MS);
  }

  /**
   * Calculate quote using QuoteService
   */
  private async calculateQuote() {
    // Reset quote state
    this.quote = null;
    this.quoteResult = null;
    this.isDirectTransfer = false;
    this.isSameChainSwap = false;

    // Validate inputs
    if (!this.recipientAmount || parseFloat(this.recipientAmount) <= 0) {
      return;
    }

    if (!this.selectedToken) {
      return;
    }

    if (!this.recipientTokenInfo) {
      return;
    }

    const account = this.walletService.getAccount();
    if (!account.address) {
      return;
    }

    this.isQuoteLoading = true;
    this.error = null;

    try {
      const quoteService = this.getQuoteService();

      const result = await quoteService.calculateQuote({
        sourceToken: this.selectedToken,
        recipientAmount: this.recipientAmount,
        recipientToken: this.recipientTokenInfo,
        depositorAddress: account.address,
        recipientAddress: this.recipient as Address,
      });

      // Store the full quote result
      this.quoteResult = result;
      this.quote = result.quote;
      this.isDirectTransfer = result.isDirectTransfer;
      this.isSameChainSwap = result.isSameChainSwap;
    } catch (error) {
      console.error("Failed to calculate quote:", error);

      if (error instanceof I18nError) {
        this.error = error;
      } else {
        this.error = error instanceof Error ? error.message : "Failed to calculate quote";
      }
    } finally {
      this.isQuoteLoading = false;
    }
  }

  /**
   * Set up wallet event listeners to update flow step on connection changes
   */
  private setupWalletListeners(): void {
    if (!this.walletService) return;

    // Listen for account changes (wallet connected)
    const unsubscribeAccount = this.walletService.onAccountChanged(() => {
      this.updateFlowStep();
      // Check for existing subscription when wallet connects
      this.checkExistingSubscriptionIfNeeded();
      // Trigger re-render to update UI
      this.requestUpdate();
    });

    // Listen for chain changes (network switched)
    const unsubscribeChain = this.walletService.onChainChanged(
      (chainId: number) => {
        // Don't clear selected token during subscription flow - the flow handles chain switching internally
        // and needs to preserve the original token selection
        const isInSubscriptionFlow =
          this.isDonating && this.donationType === "monthly";

        // Clear selected token when chain changes (token may not exist on new chain)
        // but only if we're not in the middle of a subscription flow
        if (
          !isInSubscriptionFlow &&
          this.selectedToken &&
          this.selectedToken.chainId !== chainId
        ) {
          this.selectedToken = null;
          this.quote = null;
        }

        // Don't update flow step during subscription - it manages its own state
        if (!isInSubscriptionFlow) {
          this.updateFlowStep();
        }

        // Trigger re-render to update UI
        this.requestUpdate();
        // Close Reown modal after network switch
        this.walletService.closeModal();
      },
    );

    // Listen for disconnect
    const unsubscribeDisconnect = this.walletService.onDisconnect(() => {
      this.selectedToken = null;
      this.quote = null;
      this.existingSubscription = null;
      this.updateFlowStep();
      // Trigger re-render to update UI
      this.requestUpdate();
    });

    this.cleanupFunctions.push(
      unsubscribeAccount,
      unsubscribeChain,
      unsubscribeDisconnect,
    );
  }

  private loadTokens() {
    this.isLoadingTokens = true;

    try {
      // Get tokens from chain service
      this.availableTokens = this.chainService.getAllTokens();

      // Load recipient token info - always Polygon USDC
      this.recipientTokenInfo =
        this.chainService.getToken(
          POLYGON_CHAIN_ID,
          POLYGON_USDC_ADDRESS,
        ) || null;
    } catch (error) {
      console.error("Failed to load tokens:", error);
      // Fallback to empty array if something goes wrong
      this.availableTokens = [];
    } finally {
      this.isLoadingTokens = false;
    }
  }

  private updateThemeClass(theme: Theme) {
    this.walletService.setThemeMode(theme);
    this.classList.toggle("dark", theme === "dark");
  }

  /**
   * Check for existing subscription if conditions are met:
   * - Monthly donation type is selected
   * - Wallet is connected
   * - Not already checking
   */
  private async checkExistingSubscriptionIfNeeded(): Promise<void> {
    // Only check when in monthly mode and wallet is connected
    if (this.donationType !== "monthly" || !this.isWalletConnected()) {
      this.existingSubscription = null;
      return;
    }

    // Don't check if already checking
    if (this.isCheckingSubscription) {
      return;
    }

    const userAddress = this.walletService.getAccount()?.address;
    const targetAddress = this.effectiveSubscriptionTarget;

    if (!userAddress || !targetAddress) {
      this.existingSubscription = null;
      return;
    }

    this.isCheckingSubscription = true;

    try {
      const result = await this.azothPayService.checkExistingSubscription(
        userAddress as Address,
        targetAddress,
      );
      this.existingSubscription = result;
    } catch (error) {
      console.error("Failed to check existing subscription:", error);
      this.existingSubscription = null;
    } finally {
      this.isCheckingSubscription = false;
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
      changedProperties.has("reownProjectId")
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
          console.error(
            "Failed to initialize/re-initialize wallet service:",
            err,
          );
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

    // Handle subscriptionTarget changes - validate if provided
    if (changedProperties.has("subscriptionTarget")) {
      if (
        this.subscriptionTarget &&
        !this.isValidAddress(this.subscriptionTarget)
      ) {
        console.warn(
          "Invalid subscription target address:",
          this.subscriptionTarget,
        );
      }
    }

    // Check for existing subscription when relevant properties change
    if (
      changedProperties.has("donationType") ||
      changedProperties.has("subscriptionTarget") ||
      changedProperties.has("recipient")
    ) {
      this.checkExistingSubscriptionIfNeeded();
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

    // Validate that inputAmount exists and is a valid value
    if (!this.quote.inputAmount || this.quote.inputAmount === undefined) {
      return "";
    }

    try {
      const inputAmount = BigInt(this.quote.inputAmount);
      const decimals = this.selectedToken.decimals;
      const divisor = BigInt(10 ** decimals);
      const amount = Number(inputAmount) / Number(divisor);
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
    // Don't override subscription-related steps - they manage their own state
    if (
      this.currentStep === FlowStep.SUBSCRIPTION_SETUP ||
      this.currentStep === FlowStep.SUBSCRIPTION_PROGRESS
    ) {
      return;
    }

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
  private validateRequiredAttributes(): {
    isValid: boolean;
    missing: string[];
    configured: string[];
  } {
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
    const newAmount =
      typeof event.detail === "string" ? event.detail : event.detail.value;

    this.recipientAmount = newAmount;

    // Debounce quote calculation
    if (this.selectedToken) {
      this.debouncedQuoteCalculation();
    }
  }

  private handleTokenChange(event: CustomEvent<Token>) {
    this.selectedToken = event.detail;

    // Recalculate quote when token changes
    if (this.recipientAmount) {
      this.calculateQuote();
    }
  }

  /**
   * Handle donation type toggle change
   */
  private handleDonationTypeChange(event: CustomEvent<{ type: DonationType }>) {
    this.donationType = event.detail.type;
    this.isSubscriptionFlow = event.detail.type === "monthly";
  }

  private handleWalletConnectClick() {
    // Connection is handled by wallet-connect-card; flow step updates via setupWalletListeners
  }

  /**
   * Handle opening network selector modal
   */
  private async handleOpenNetworkModal() {
    try {
      await this.walletService.openNetworkModal();
    } catch (error) {
      console.error("Failed to open network modal:", error);
      this.error =
        error instanceof Error
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
      this.error =
        error instanceof Error ? error.message : "Failed to disconnect wallet";
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
   * Always returns USDC as recipients receive USDC on Polygon
   */
  private getRecipientTokenSymbol(): string {
    return "USDC";
  }

  /**
   * Handle donate button click - execute donation directly via DonationService
   * For subscriptions, shows setup screen first instead of starting transaction
   */
  private async handleDonateClick() {
    if (!this.quote || !this.quoteResult || this.isDonating) {
      return;
    }

    // For monthly subscriptions, show setup screen first
    if (this.donationType === "monthly") {
      this.currentStep = FlowStep.SUBSCRIPTION_SETUP;
      return;
    }

    // For one-time donations, proceed directly with donation
    await this.executeDonation();
  }

  /**
   * Execute one-time donation via DonationService
   */
  private async executeDonation() {
    if (!this.quoteResult || !this.selectedToken) {
      return;
    }

    this.isDonating = true;
    this.error = null;

    try {
      const donationService = this.getDonationService();

      await donationService.executeDonation({
        quoteResult: this.quoteResult,
        sourceToken: this.selectedToken,
        recipientAddress: this.recipient as Address,
      });

      const tokenSymbol = this.recipientTokenInfo?.symbol || "tokens";
      toastService.success(`Successfully donated ${this.recipientAmount} ${tokenSymbol}!`);

      // Get chain name for success data - always Polygon for recipient
      const chainName = this.chainService.getChainName(POLYGON_CHAIN_ID);

      // Set success data
      this.successData = {
        amount: this.recipientAmount,
        tokenSymbol,
        chainName,
        timestamp: Date.now(),
      };

      // Show success state
      this.showSuccessState = true;

      // Dispatch success event
      this.dispatchEvent(
        new CustomEvent("donation-completed", {
          detail: {
            amount: this.recipientAmount,
            token: this.selectedToken,
            recipient: this.recipient,
            isDirectTransfer: this.isDirectTransfer,
            isSameChainSwap: this.isSameChainSwap,
          },
          bubbles: true,
          composed: true,
        }),
      );

      // Reset form state
      this.quote = null;
      this.quoteResult = null;
      this.isDirectTransfer = false;
      this.isSameChainSwap = false;
    } catch (error) {
      console.error("Donation failed:", error);

      const errorMessage =
        error instanceof I18nError
          ? t(error.i18nKey, error.params)
          : error instanceof Error
            ? error.message
            : t("error.networkConnection");

      this.error = errorMessage;
      toastService.error(errorMessage);

      this.dispatchEvent(
        new CustomEvent("donation-failed", {
          detail: {
            error: errorMessage,
            isDirectTransfer: this.isDirectTransfer,
            isSameChainSwap: this.isSameChainSwap,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.isDonating = false;
    }
  }

  /**
   * Handle subscription setup continue - user confirmed setup, start flow
   */
  private handleSubscriptionContinue(
    event: CustomEvent<SubscriptionSetupData>,
  ) {
    this.subscriptionSetupData = event.detail;
    this.subscriptionError = "";
    this.currentStep = FlowStep.SUBSCRIPTION_PROGRESS;

    // Start the actual subscription flow
    this.executeSubscription();
  }

  /**
   * Execute subscription via DonationService
   */
  private async executeSubscription() {
    if (!this.quoteResult || !this.selectedToken || !this.recipientTokenInfo) {
      return;
    }

    this.isDonating = true;
    this.error = null;

    try {
      const donationService = this.getDonationService();

      const result = await donationService.executeSubscription({
        quoteResult: this.quoteResult,
        sourceToken: this.selectedToken,
        recipientToken: this.recipientTokenInfo,
        monthlyAmountUsd: this.recipientAmount,
        subscriptionTarget: this.effectiveSubscriptionTarget,
        projectId: this.projectId,
        onProgress: (step, isDirectTransfer) => {
          this.subscriptionProgressStep = step;
          this.subscriptionIsDirectTransfer = isDirectTransfer;

          // Ensure we're showing progress screen during active subscription flow
          if (step !== "idle") {
            this.currentStep = FlowStep.SUBSCRIPTION_PROGRESS;
          }
        },
      });

      toastService.success(t("success.subscription.message"));

      // Reset subscription progress state
      this.subscriptionProgressStep = "idle";
      this.subscriptionSetupData = null;
      this.subscriptionError = "";
      this.subscriptionIsDirectTransfer = false;

      // Get chain name for Polygon (destination chain for subscriptions)
      const chainName = this.chainService.getChainName(POLYGON_CHAIN_ID);

      // Get wallet address for Papaya management link
      const walletAddress = this.walletService.getAccount()?.address || "";

      // Set success data with subscription information
      this.successData = {
        amount: result.monthlyAmountUsd,
        tokenSymbol: "USDC",
        chainName,
        timestamp: Date.now(),
        isSubscription: true,
        monthlyAmount: result.monthlyAmountUsd,
        walletAddress,
      };

      // Store subscription monthly amount for state tracking
      this.subscriptionMonthlyAmount = result.monthlyAmountUsd;

      // Show success state
      this.showSuccessState = true;

      // Dispatch success event
      this.dispatchEvent(
        new CustomEvent("subscription-created", {
          detail: {
            transactionHash: result.transactionHash,
            monthlyAmountUsd: result.monthlyAmountUsd,
            subscriptionTarget: result.subscriptionTarget,
            projectId: result.projectId,
            originChainId: result.originChainId,
            originToken: result.originToken,
            isDirectTransfer: result.isDirectTransfer,
            isSameChainSwap: result.isSameChainSwap,
          },
          bubbles: true,
          composed: true,
        }),
      );

      // Reset form state
      this.quote = null;
      this.quoteResult = null;
      this.isDirectTransfer = false;
      this.isSameChainSwap = false;
    } catch (error) {
      console.error("Subscription failed:", error);

      const errorMessage =
        error instanceof I18nError
          ? t(error.i18nKey, error.params)
          : error instanceof Error
            ? error.message
            : t("error.networkConnection");

      this.error = errorMessage;
      this.subscriptionError = errorMessage;
      toastService.error(errorMessage);

      this.dispatchEvent(
        new CustomEvent("donation-failed", {
          detail: {
            error: errorMessage,
            isDirectTransfer: this.isDirectTransfer,
            isSameChainSwap: this.isSameChainSwap,
            isSubscription: true,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.isDonating = false;
    }
  }

  /**
   * Handle subscription setup back - user wants to go back to form
   */
  private handleSubscriptionBack() {
    this.currentStep = FlowStep.READY;
    this.subscriptionSetupData = null;
    this.subscriptionError = "";
  }

  /**
   * Handle subscription retry - user wants to retry after error
   */
  private handleSubscriptionRetry() {
    this.subscriptionError = "";
    this.currentStep = FlowStep.SUBSCRIPTION_SETUP;
  }

  private handleNetworkSwitch(event: CustomEvent<{ chainId: number }>) {
    this.reloadTokensForChain(event.detail.chainId);
  }

  private reloadTokensForChain(_chainId: number) {
    this.isLoadingTokens = true;

    try {
      // Reload all tokens from chain service
      this.availableTokens = this.chainService.getAllTokens();
    } catch (error) {
      console.error("Failed to reload tokens for chain:", error);
      // Keep existing tokens as fallback
    } finally {
      this.isLoadingTokens = false;
    }
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

    // Reset subscription state
    this.donationType = "one-time";
    this.isSubscriptionFlow = false;
    this.subscriptionMonthlyAmount = "";
    this.subscriptionProgressStep = "idle";
    this.subscriptionSetupData = null;
    this.subscriptionError = "";
    this.subscriptionIsDirectTransfer = false;
    this.existingSubscription = null;

    // Reset flow step to initial state
    this.currentStep = FlowStep.AMOUNT;
  }

  // ============================================================================
  // Render helper methods
  // ============================================================================

  /**
   * Render the widget header with title and theme toggle
   */
  private renderHeader() {
    return html`
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
    `;
  }

  /**
   * Render the loading state shown during initialization
   */
  private renderLoadingState() {
    return html`
      <div class="widget-container">
        ${this.renderHeader()}
        <div class="loading">${t("widget.loading")}</div>
      </div>
    `;
  }

  /**
   * Render the error message if an error exists
   */
  private renderErrorMessage() {
    if (!this.error) return "";
    return html`
      <div class="error-message" role="alert">
        ${this.error instanceof I18nError ? t(this.error.i18nKey, this.error.params) : this.error}
      </div>
    `;
  }

  /**
   * Render the success state screen after a successful donation/subscription
   */
  private renderSuccessState() {
    if (!this.successData) return "";
    return html`
      <success-state
        amount="${this.successData.amount}"
        token-symbol="${this.successData.tokenSymbol}"
        chain-name="${this.successData.chainName}"
        timestamp="${this.successData.timestamp}"
        recipient-address="${this.recipient}"
        success-message="${this.successData.isSubscription
          ? this.successMessage || t("success.subscription.message")
          : this.successMessage || t("success.defaultMessage")}"
        donate-again-text="${this.donateAgainText || t("success.donateAgain")}"
        ?confetti-enabled="${this.confettiEnabled}"
        confetti-colors="${this.confettiColors}"
        ?is-subscription="${this.successData.isSubscription || false}"
        monthly-amount="${this.successData.monthlyAmount || ""}"
        wallet-address="${this.successData.walletAddress || ""}"
        @donate-again="${this.handleDonateAgain}"
      ></success-state>
    `;
  }

  /**
   * Render the subscription setup screen
   */
  private renderSubscriptionSetup() {
    return html`
      <subscription-setup-screen
        monthly-amount="${this.recipientAmount}"
        @subscription-continue="${this.handleSubscriptionContinue}"
        @subscription-back="${this.handleSubscriptionBack}"
      ></subscription-setup-screen>
    `;
  }

  /**
   * Render the subscription progress screen
   */
  private renderSubscriptionProgress() {
    return html`
      <subscription-progress-screen
        current-step="${this.subscriptionProgressStep}"
        monthly-amount="${this.subscriptionSetupData?.monthlyAmount ||
        this.recipientAmount}"
        total-deposit="${this.subscriptionSetupData?.totalDeposit || ""}"
        error-message="${this.subscriptionError}"
        ?is-direct-transfer="${this.subscriptionIsDirectTransfer}"
        @subscription-retry="${this.handleSubscriptionRetry}"
      ></subscription-progress-screen>
    `;
  }

  /**
   * Render the existing subscription indicator
   */
  private renderExistingSubscriptionIndicator() {
    if (
      this.donationType !== "monthly" ||
      !this.existingSubscription?.exists ||
      !this.isWalletConnected()
    ) {
      return "";
    }
    return html`
      <div class="existing-subscription-indicator">
        <span class="message">
          ${t("subscription.existing.message").replace(
            "${amount}",
            `$${this.existingSubscription.monthlyAmount}`,
          )}
        </span>
        <span class="separator">·</span>
        <a
          href="${this.papayaManagementUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="manage-link"
        >
          ${t("subscription.existing.manage")}
        </a>
      </div>
    `;
  }

  /**
   * Render the wallet info card when connected
   */
  private renderWalletInfoCard() {
    return html`
      <div class="step-section step-enter">
        <div class="wallet-info-card">
          <div class="wallet-info-left">
            <div class="wallet-avatar">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
              </svg>
            </div>
            <div class="wallet-details">
              <span class="wallet-address">
                ${this.formatAddress(
                  this.walletService.getAccount()?.address || "",
                )}
              </span>
              <button
                class="network-badge"
                @click="${this.handleOpenNetworkModal}"
                aria-label="${t("wallet.switchNetworkAriaLabel")}"
                title="${t("wallet.switchNetworkAriaLabel")}"
              >
                <span class="network-dot"></span>
                ${this.getNetworkName(this.getConnectedChainId() || 1)}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the main donation form content
   */
  private renderMainContent(isFullyConfigured: boolean) {
    return html`
      <!-- AmountSection: Always visible -->
      <amount-section
        value="${this.recipientAmount}"
        currency-symbol="${this.getRecipientTokenSymbol()}"
        donation-type="${this.donationType}"
        @amount-change="${this.handleAmountChange}"
      ></amount-section>

      <!-- DonationTypeToggle: Toggle between one-time and monthly donations -->
      <donation-type-toggle
        .value="${this.donationType}"
        ?disabled="${!this.continuousEnabled}"
        @donation-type-changed="${this.handleDonationTypeChange}"
      ></donation-type-toggle>

      <!-- Existing subscription indicator -->
      ${this.renderExistingSubscriptionIndicator()}

      <!-- WalletConnectCard: Show when wallet not connected -->
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
      ${this.isWalletConnected() ? this.renderWalletInfoCard() : ""}

      <!-- TokenCardsSection: Show when wallet connected -->
      ${this.isWalletConnected()
        ? html`
            <div class="step-section step-enter">
              <token-cards-section
                .tokens="${this.availableTokens}"
                .selectedToken="${this.selectedToken}"
                .walletService="${this.walletService}"
                .walletAddress="${this.walletService.getAccount()?.address ||
                null}"
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
                ?disabled="${!isFullyConfigured ||
                this.isDonating ||
                this.isQuoteLoading ||
                !this.quote}"
                ?loading="${this.isDonating}"
                ?calculating="${this.isQuoteLoading}"
                @donate-click="${this.handleDonateClick}"
              ></donate-button>
            </div>
          `
        : ""}
    `;
  }

  /**
   * Render the widget footer
   */
  private renderFooter() {
    return html`
      <div class="footer">
        <a href="mailto:support@donations.kalatori.org" class="support-link">
          ${t("widget.footer.contact")}
        </a>
      </div>
    `;
  }

  override render() {
    // Show loading state during initialization
    if (!this.isInitialized) {
      return this.renderLoadingState();
    }

    const configStatus = this.validateRequiredAttributes();
    const isFullyConfigured = configStatus.isValid;

    // Determine which content to show based on current state
    let content;
    if (this.showSuccessState && this.successData) {
      content = this.renderSuccessState();
    } else if (this.currentStep === FlowStep.SUBSCRIPTION_SETUP) {
      content = this.renderSubscriptionSetup();
    } else if (this.currentStep === FlowStep.SUBSCRIPTION_PROGRESS) {
      content = this.renderSubscriptionProgress();
    } else {
      content = this.renderMainContent(isFullyConfigured);
    }

    return html`
      <div class="widget-container">
        ${this.renderHeader()}
        ${this.renderErrorMessage()}
        ${content}
        ${this.renderFooter()}
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
      // Subscription state
      donationType: this.donationType,
      isSubscriptionFlow: this.isSubscriptionFlow,
      continuousEnabled: this.continuousEnabled,
      subscriptionTarget: this.subscriptionTarget,
      effectiveSubscriptionTarget: this.effectiveSubscriptionTarget,
      projectId: this.projectId,
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
    // Reset subscription state
    this.donationType = "one-time";
    this.isSubscriptionFlow = false;
    this.subscriptionMonthlyAmount = "";
    this.subscriptionIsDirectTransfer = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "donation-widget": DonationWidget;
  }
}
