/**
 * Donation Widget - Embeddable cryptocurrency donation widget
 *
 * @version 1.0.0
 * @license MIT
 */

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

// Export components for programmatic usage
export {
  AmountInput,
  DonateButton,
  DonationForm,
  DonationWidget,
  ThemeToggle,
  ToastContainer,
  ToastNotification,
  TokenItem,
  TokenList,
  TokenSelector,
  WalletSection,
} from "./components/index.ts";

// Export services for advanced usage
export {
  ChainService,
  OneInchService,
  ThemeService,
  toastService,
  WalletService,
} from "./services/index.ts";

// Export types
export type { Token } from "./services/WalletService.ts";
export type { Theme, ThemeMode } from "./services/ThemeService.ts";

// Version information
export const VERSION = "1.0.0";
export const BUILD_DATE = new Date().toISOString();

// Widget metadata
export const WIDGET_INFO = {
  name: "Donation Widget",
  version: VERSION,
  buildDate: BUILD_DATE,
  description:
    "Embeddable cryptocurrency donation widget with cross-chain support",
  author: "Donation Widget Team",
  license: "MIT",
} as const;

// Log initialization
if (typeof window !== "undefined") {
  console.log(`🎁 Donation Widget v${VERSION} loaded`);

  // Make widget info available globally for debugging
  (window as any).__DONATION_WIDGET__ = WIDGET_INFO;
}
