export enum ErrorCategory {
  Network = 'network',
  Wallet = 'wallet',
  Quote = 'quote',
  Transaction = 'transaction',
  Unknown = 'unknown',
}

export interface UserFriendlyError {
  category: ErrorCategory;
  message: string;
  recoverable: boolean;
  action?: string;
  originalError?: Error;
}

export class ErrorHandler {
  /**
   * Handle any error and convert to user-friendly format
   */
  static handle(error: unknown): UserFriendlyError {
    if (error instanceof Error) {
      return this.handleError(error);
    }

    if (typeof error === 'string') {
      return {
        category: ErrorCategory.Unknown,
        message: error,
        recoverable: true,
      };
    }

    return {
      category: ErrorCategory.Unknown,
      message: 'An unexpected error occurred. Please try again.',
      recoverable: true,
    };
  }

  /**
   * Handle Error objects
   */
  private static handleError(error: Error): UserFriendlyError {
    const message = error.message.toLowerCase();

    // Wallet errors
    if (this.isWalletError(message)) {
      return this.handleWalletError(error);
    }

    // Quote errors
    if (this.isQuoteError(message)) {
      return this.handleQuoteError(error);
    }

    // Transaction errors
    if (this.isTransactionError(message)) {
      return this.handleTransactionError(error);
    }

    // Network errors
    if (this.isNetworkError(message)) {
      return this.handleNetworkError(error);
    }

    // Unknown error
    return {
      category: ErrorCategory.Unknown,
      message: 'An unexpected error occurred. Please try again.',
      recoverable: true,
      originalError: error,
    };
  }

  /**
   * Check if error is wallet-related
   */
  private static isWalletError(message: string): boolean {
    return (
      message.includes('wallet') ||
      message.includes('rejected') ||
      message.includes('user denied') ||
      message.includes('insufficient funds') ||
      message.includes('insufficient balance') ||
      message.includes('connect')
    );
  }

  /**
   * Check if error is quote-related
   */
  private static isQuoteError(message: string): boolean {
    return (
      message.includes('no route') ||
      message.includes('quote') ||
      message.includes('liquidity') ||
      message.includes('amount too low') ||
      message.includes('amount too high')
    );
  }

  /**
   * Check if error is transaction-related
   */
  private static isTransactionError(message: string): boolean {
    return (
      message.includes('transaction') ||
      message.includes('gas') ||
      message.includes('nonce') ||
      message.includes('revert') ||
      message.includes('execution failed')
    );
  }

  /**
   * Check if error is network-related
   */
  private static isNetworkError(message: string): boolean {
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('api')
    );
  }

  /**
   * Handle wallet errors
   */
  private static handleWalletError(error: Error): UserFriendlyError {
    const message = error.message.toLowerCase();

    if (message.includes('rejected') || message.includes('user denied')) {
      return {
        category: ErrorCategory.Wallet,
        message: 'Transaction was rejected. Please try again when ready.',
        recoverable: true,
        originalError: error,
      };
    }

    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
      return {
        category: ErrorCategory.Wallet,
        message: 'Insufficient balance to complete this transaction.',
        recoverable: false,
        action: 'Add more funds to your wallet or try a smaller amount.',
        originalError: error,
      };
    }

    if (message.includes('not connected') || message.includes('connect')) {
      return {
        category: ErrorCategory.Wallet,
        message: 'Wallet not connected. Please connect your wallet first.',
        recoverable: true,
        action: 'Click the "Connect Wallet" button to continue.',
        originalError: error,
      };
    }

    if (message.includes('switch') || message.includes('network')) {
      return {
        category: ErrorCategory.Wallet,
        message: 'Please switch to the correct network in your wallet.',
        recoverable: true,
        action: 'Switch networks and try again.',
        originalError: error,
      };
    }

    return {
      category: ErrorCategory.Wallet,
      message: 'Wallet error occurred. Please check your wallet and try again.',
      recoverable: true,
      originalError: error,
    };
  }

  /**
   * Handle quote errors
   */
  private static handleQuoteError(error: Error): UserFriendlyError {
    const message = error.message.toLowerCase();

    if (message.includes('no route')) {
      return {
        category: ErrorCategory.Quote,
        message: 'No route found for this swap.',
        recoverable: true,
        action: 'Try a different token or amount.',
        originalError: error,
      };
    }

    if (message.includes('liquidity')) {
      return {
        category: ErrorCategory.Quote,
        message: 'Insufficient liquidity for this swap.',
        recoverable: true,
        action: 'Try a smaller amount or different token.',
        originalError: error,
      };
    }

    if (message.includes('amount too low')) {
      return {
        category: ErrorCategory.Quote,
        message: 'Amount is too low for this swap.',
        recoverable: true,
        action: 'Try a larger amount.',
        originalError: error,
      };
    }

    if (message.includes('amount too high')) {
      return {
        category: ErrorCategory.Quote,
        message: 'Amount is too high for this swap.',
        recoverable: true,
        action: 'Try a smaller amount.',
        originalError: error,
      };
    }

    return {
      category: ErrorCategory.Quote,
      message: 'Failed to calculate quote. Please try again.',
      recoverable: true,
      originalError: error,
    };
  }

  /**
   * Handle transaction errors
   */
  private static handleTransactionError(error: Error): UserFriendlyError {
    const message = error.message.toLowerCase();

    if (message.includes('gas estimation failed') || message.includes('gas required exceeds')) {
      return {
        category: ErrorCategory.Transaction,
        message: 'Transaction would fail. Please check your balance.',
        recoverable: true,
        action: 'Ensure you have enough tokens and gas for this transaction.',
        originalError: error,
      };
    }

    if (message.includes('nonce')) {
      return {
        category: ErrorCategory.Transaction,
        message: 'Transaction nonce error.',
        recoverable: true,
        action: 'Please wait a moment and try again.',
        originalError: error,
      };
    }

    if (message.includes('revert') || message.includes('execution failed')) {
      return {
        category: ErrorCategory.Transaction,
        message: 'Transaction would fail.',
        recoverable: true,
        action: 'Check your balance and token allowances, then try again.',
        originalError: error,
      };
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        category: ErrorCategory.Transaction,
        message: 'Transaction timed out.',
        recoverable: true,
        action: 'Please check your wallet and try again.',
        originalError: error,
      };
    }

    return {
      category: ErrorCategory.Transaction,
      message: 'Transaction failed. Please try again.',
      recoverable: true,
      originalError: error,
    };
  }

  /**
   * Handle network errors
   */
  private static handleNetworkError(error: Error): UserFriendlyError {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) {
      return {
        category: ErrorCategory.Network,
        message: 'Request timed out. Please check your connection.',
        recoverable: true,
        action: 'Check your internet connection and try again.',
        originalError: error,
      };
    }

    if (message.includes('fetch') || message.includes('api')) {
      return {
        category: ErrorCategory.Network,
        message: 'Failed to connect to service.',
        recoverable: true,
        action: 'Please try again in a moment.',
        originalError: error,
      };
    }

    return {
      category: ErrorCategory.Network,
      message: 'Network error occurred. Please check your connection.',
      recoverable: true,
      action: 'Check your internet connection and try again.',
      originalError: error,
    };
  }

  /**
   * Format error for display
   */
  static format(error: UserFriendlyError): string {
    let formatted = error.message;
    
    if (error.action) {
      formatted += ` ${error.action}`;
    }

    return formatted;
  }

  /**
   * Log error for debugging
   */
  static log(error: UserFriendlyError): void {
    console.error(`[${error.category}] ${error.message}`, error.originalError);
  }
}
