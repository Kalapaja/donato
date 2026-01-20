// Import and register all components
import "./components/donation-widget.ts";
import "./components/wallet-section.ts";
import "./components/donation-form.ts";
import "./components/theme-toggle.ts";
import "./components/token-selector.ts";
import "./components/token-list.ts";
import "./components/token-item.ts";
import "./components/amount-input.ts";
import "./components/donate-button.ts";
import "./components/toast-notification.ts";
import "./components/toast-container.ts";
import "./components/donation-type-toggle.ts";

// Export components for programmatic usage
export {
  AmountInput,
  DonateButton,
  DonationForm,
  DonationWidget,
  DonationTypeToggle,
  ThemeToggle,
  ToastContainer,
  ToastNotification,
  TokenItem,
  TokenList,
  TokenSelector,
  WalletSection,
} from "./components/index.ts";

// Export component types
export type { DonationType } from "./components/index.ts";

// Export services for advanced usage
export {
  AcrossService,
  ChainService,
  ThemeService,
  toastService,
  WalletService,
  i18nService,
  t,
} from "./services/index.ts";

// Export types
export type { Token } from "./services/WalletService.ts";
export type { Theme, ThemeMode } from "./services/ThemeService.ts";
export type { Locale, TranslationKey, Translations } from "./services/I18nService.ts";
export type {
  AcrossConfig,
  AcrossQuoteParams,
  AcrossQuote,
  AcrossFees,
  TransactionData,
} from "./services/AcrossService.ts";

// Export translations
export { translations } from "./i18n/index.ts";

// Version information (injected at build time from deno.json)
declare const __WIDGET_VERSION__: string;
export const VERSION = typeof __WIDGET_VERSION__ !== "undefined" ? __WIDGET_VERSION__ : "0.0.0";
export const BUILD_DATE = new Date().toISOString();

// Widget metadata
export const WIDGET_INFO = {
  name: "Donation Widget",
  version: VERSION,
  buildDate: BUILD_DATE,
  description:
    "Embeddable cryptocurrency donation widget with cross-chain support",
  author: "Donation Widget Team",
  license: "GPLv3",
} as const;

// Log initialization
if (typeof window !== "undefined") {
  // Log version in development mode
  const isDevelopment = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
  if (isDevelopment) {
    console.log(`🎁 Donation Widget v${VERSION} loaded (development mode)`);
    console.log("Widget info:", WIDGET_INFO);
  }

  // Make widget info available globally for debugging
  (window as any).__DONATION_WIDGET__ = WIDGET_INFO;
}
