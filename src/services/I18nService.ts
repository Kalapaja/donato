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
  // Amount section
  | "amount.tooltip"
  | "amount.helper"
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
  // Success state
  | "success.defaultMessage"
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
  | "message.walletConnectionFailed";

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

