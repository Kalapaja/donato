/**
 * Lightweight internationalization (i18n) service for the donation widget.
 * Provides runtime locale switching with reactive updates.
 */

export type Locale = "en" | "ru";

export type TranslationKey =
  // Widget header & general
  | "widget.header.title"
  | "widget.loading"
  | "widget.footer.contact"
  // Donation type toggle
  | "donation.type.oneTime"
  | "donation.type.monthly"
  // Amount section
  | "amount.tooltip"
  | "amount.helper"
  | "amount.helper.subscription"
  | "subscription.duration.estimate"
  | "amount.ariaLabel"
  | "amount.presetAriaLabel"
  // Wallet connection
  | "wallet.connecting"
  | "wallet.connect"
  | "wallet.connectSubtext"
  | "wallet.connectAriaLabel"
  | "wallet.disconnectAriaLabel"
  | "wallet.switchNetworkAriaLabel"
  // Donate button
  | "donate.processing"
  | "donate.calculating"
  | "donate.pay"
  | "donate.payWithAmount"
  | "donate.processingAriaLabel"
  | "donate.calculatingAriaLabel"
  | "donate.disabledAriaLabel"
  // Button states
  | "button.processing"
  | "button.calculating"
  | "button.donate"
  | "button.subscribe"
  // Success state
  | "success.defaultMessage"
  | "success.subscription.message"
  | "success.donateAgain"
  | "success.youDonated"
  | "success.amount"
  | "success.network"
  | "success.recipient"
  | "success.time"
  | "success.transactionDetails"
  // Token selection
  | "token.choosePayment"
  | "token.insufficientBalance"
  | "token.selectionAriaLabel"
  | "token.noTokensWithBalance"
  | "token.noTokensWithBalanceHint"
  // Toast notifications
  | "toast.successAriaLabel"
  | "toast.errorAriaLabel"
  | "toast.warningAriaLabel"
  | "toast.infoAriaLabel"
  | "toast.closeAriaLabel"
  // Messages
  | "message.donationSuccess"
  | "message.invalidRecipient"
  | "message.initFailed"
  | "message.walletConnectionFailed"
  // Error messages
  | "error.networkConnection"
  | "error.networkSwitchFailed"
  | "error.invalidParams"
  | "error.routeNotFound"
  | "error.serverUnavailable"
  | "error.unsupportedNetwork"
  | "error.unsupportedToken"
  | "error.insufficientLiquidity"
  | "error.insufficientFunds"
  | "error.slippageTooHigh"
  | "error.transactionRejected"
  | "error.signatureRejected"
  | "error.subscriptionFailed"
  | "error.walletNotConnected"
  | "error.switchToPolygon"
  // Subscription overlay
  | "subscription.overlay.title"
  | "subscription.overlay.description"
  | "subscription.overlay.hint"
  // Subscription steps
  | "subscription.step.switching"
  | "subscription.step.switching.desc"
  | "subscription.step.signing"
  | "subscription.step.signing.desc"
  | "subscription.step.building"
  | "subscription.step.building.desc"
  | "subscription.step.returning"
  | "subscription.step.returning.desc"
  | "subscription.step.quoting"
  | "subscription.step.quoting.desc"
  | "subscription.step.approving"
  | "subscription.step.approving.desc"
  | "subscription.step.subscribing"
  | "subscription.step.subscribing.desc"
  | "subscription.step.confirming"
  | "subscription.step.confirming.desc"
  // Subscription progress screen
  | "subscription.progress.title"
  | "subscription.progress.subtitle"
  | "subscription.progress.monthlyAmount"
  | "subscription.progress.depositAmount"
  | "subscription.progress.retry"
  | "subscription.progress.switching"
  | "subscription.progress.switching.desc"
  | "subscription.progress.signing"
  | "subscription.progress.signing.desc"
  | "subscription.progress.building"
  | "subscription.progress.building.desc"
  | "subscription.progress.returning"
  | "subscription.progress.returning.desc"
  | "subscription.progress.quoting"
  | "subscription.progress.quoting.desc"
  | "subscription.progress.approving"
  | "subscription.progress.approving.desc"
  | "subscription.progress.subscribing"
  | "subscription.progress.subscribing.desc"
  | "subscription.progress.confirming"
  | "subscription.progress.confirming.desc"
  // Subscription setup screen
  | "subscription.setup.title"
  | "subscription.setup.subtitle"
  | "subscription.setup.step1.title"
  | "subscription.setup.step1.description"
  | "subscription.setup.step2.title"
  | "subscription.setup.step2.description"
  | "subscription.setup.step3.title"
  | "subscription.setup.step3.description"
  | "subscription.setup.depositLabel"
  | "subscription.setup.month"
  | "subscription.setup.months"
  | "subscription.setup.monthlyPayment"
  | "subscription.setup.totalDeposit"
  | "subscription.setup.refundNotice"
  | "subscription.setup.back"
  | "subscription.setup.continue"
  // Existing subscription indicator
  | "subscription.existing.message"
  | "subscription.existing.manage"
  // Success screen - subscription management
  | "success.subscription.manageText"
  | "success.subscription.manageLink"
  | "success.subscription.cancelHint";

export type Translations = Record<TranslationKey, string>;

type LocaleChangeCallback = (locale: Locale) => void;

/**
 * I18nService - Singleton service for managing translations
 *
 * Features:
 * - Runtime locale switching
 * - Reactive updates via callbacks
 * - String interpolation support
 * - Auto-detection from browser settings
 */
class I18nService {
  private static instance: I18nService;
  private currentLocale: Locale = "en";
  private translations: Record<Locale, Translations> = {} as Record<Locale, Translations>;
  private listeners: Set<LocaleChangeCallback> = new Set();
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  /**
   * Initialize the service with translations
   */
  public init(translations: Record<Locale, Translations>): void {
    this.translations = translations;
    this.initialized = true;
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set the current locale
   */
  public setLocale(locale: Locale): void {
    if (this.currentLocale === locale) {
      return;
    }

    if (!this.translations[locale]) {
      console.warn(`Locale "${locale}" not available, falling back to "en"`);
      locale = "en";
    }

    this.currentLocale = locale;
    this.notifyListeners();
  }

  /**
   * Get the current locale
   */
  public getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * Detect locale from browser settings or HTML lang attribute
   * Priority: explicit locale > navigator.language > "en"
   */
  public detectLocale(explicitLocale?: string): Locale {
    // If explicit locale is provided, use it
    if (explicitLocale) {
      const normalizedLocale = this.normalizeLocale(explicitLocale);
      if (this.isValidLocale(normalizedLocale)) {
        return normalizedLocale;
      }
    }

    // Try navigator.language
    if (typeof navigator !== "undefined" && navigator.language) {
      const browserLocale = this.normalizeLocale(navigator.language);
      if (this.isValidLocale(browserLocale)) {
        return browserLocale;
      }
    }

    // Default to English
    return "en";
  }

  /**
   * Normalize locale string (e.g., "ru-RU" -> "ru")
   */
  private normalizeLocale(locale: string): Locale {
    const base = locale.split("-")[0].toLowerCase();
    return base as Locale;
  }

  /**
   * Check if locale is valid (has translations)
   */
  private isValidLocale(locale: string): locale is Locale {
    return locale in this.translations;
  }

  /**
   * Get a translated string by key
   * Supports interpolation: t("key", { name: "value" }) replaces {name} with "value"
   */
  public t(key: TranslationKey, params?: Record<string, string | number>): string {
    const translations = this.translations[this.currentLocale];

    if (!translations) {
      console.warn(`No translations for locale "${this.currentLocale}"`);
      return key;
    }

    let text = translations[key];

    if (!text) {
      // Fallback to English
      text = this.translations["en"]?.[key] || key;
    }

    // Interpolate parameters
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
      }
    }

    return text;
  }

  /**
   * Subscribe to locale changes
   * Returns unsubscribe function
   */
  public onLocaleChanged(callback: LocaleChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of locale change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentLocale);
    }
  }

  /**
   * Get available locales
   */
  public getAvailableLocales(): Locale[] {
    return Object.keys(this.translations) as Locale[];
  }
}

// Export singleton instance
export const i18nService = I18nService.getInstance();

// Export helper function for easy access
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  return i18nService.t(key, params);
}

