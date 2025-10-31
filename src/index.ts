/**
 * Donation Widget - Embeddable cryptocurrency donation widget
 * 
 * @version 1.0.0
 * @license MIT
 */

// Import and register all components
import './components/donation-widget';
import './components/wallet-section';
import './components/donation-form';
import './components/theme-toggle';
import './components/token-selector';
import './components/token-list';
import './components/token-item';
import './components/amount-input';
import './components/donate-button';
import './components/toast-notification';
import './components/toast-container';

// Export components for programmatic usage
export {
  DonationWidget,
  WalletSection,
  DonationForm,
  ThemeToggle,
  TokenSelector,
  TokenList,
  TokenItem,
  AmountInput,
  DonateButton,
  ToastNotification,
  ToastContainer,
} from './components/index';

// Export services for advanced usage
export {
  WalletService,
  LiFiService,
  ChainService,
  ThemeService,
  toastService,
} from './services/index';

// Export types
export type { Token } from './services/WalletService';
export type { Theme, ThemeMode } from './services/ThemeService';

// Version information
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

// Widget metadata
export const WIDGET_INFO = {
  name: 'Donation Widget',
  version: VERSION,
  buildDate: BUILD_DATE,
  description: 'Embeddable cryptocurrency donation widget with cross-chain support',
  author: 'Donation Widget Team',
  license: 'MIT',
} as const;

// Log initialization
if (typeof window !== 'undefined') {
  console.log(`🎁 Donation Widget v${VERSION} loaded`);
  
  // Make widget info available globally for debugging
  (window as any).__DONATION_WIDGET__ = WIDGET_INFO;
}
