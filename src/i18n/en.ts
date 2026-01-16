import type { Translations } from "../services/I18nService.ts";

/**
 * English translations
 */
export const en: Translations = {
  // Widget header & general
  "widget.header.title": "SUPPORT",
  "widget.loading": "Initializing widget...",
  "widget.footer.contact": "Contact developers",

  // Amount section
  "amount.tooltip": "Any token, any chain — auto-converted",
  "amount.helper": "How much would you like to donate?",
  "amount.ariaLabel": "Donation amount",
  "amount.presetAriaLabel": "Set amount to {currency}{amount}",

  // Wallet connection
  "wallet.connecting": "Connecting...",
  "wallet.connect": "Connect Wallet",
  "wallet.connectSubtext": "To complete your donation",
  "wallet.connectAriaLabel": "Connect wallet",
  "wallet.disconnectAriaLabel": "Disconnect wallet",
  "wallet.switchNetworkAriaLabel": "Switch network",

  // Donate button
  "donate.processing": "Processing...",
  "donate.calculating": "Calculating...",
  "donate.pay": "Pay",
  "donate.payWithAmount": "Pay {amount} {token}",
  "donate.processingAriaLabel": "Processing payment, please wait",
  "donate.calculatingAriaLabel": "Calculating payment amount, please wait",
  "donate.disabledAriaLabel": "button disabled",

  // Success state
  "success.defaultMessage": "Thank you for your donation!",
  "success.donateAgain": "Donate Again",
  "success.youDonated": "You donated {amount}",
  "success.amount": "Amount",
  "success.network": "Network",
  "success.recipient": "Recipient",
  "success.time": "Time",
  "success.transactionDetails": "Transaction details",

  // Token selection
  "token.choosePayment": "Choose payment token",
  "token.insufficientBalance": "insufficient balance",
  "token.selectionAriaLabel": "Token selection",
  "token.noTokensWithBalance": "No tokens with balance",
  "token.noTokensWithBalanceHint": "Top up your wallet to donate",

  // Toast notifications
  "toast.successAriaLabel": "Success notification",
  "toast.errorAriaLabel": "Error notification",
  "toast.warningAriaLabel": "Warning notification",
  "toast.infoAriaLabel": "Information notification",
  "toast.closeAriaLabel": "Close notification",

  // Messages
  "message.donationSuccess": "Donation successful! Thank you for your contribution.",
  "message.invalidRecipient": "Invalid recipient address format",
  "message.initFailed": "Failed to initialize widget",
  "message.walletConnectionFailed": "Failed to open wallet connection",

  // Error messages
  "error.networkConnection":
    "Unable to connect to the server. Please check your internet connection.",
  "error.invalidParams":
    "Invalid request parameters. Please try a different amount or token.",
  "error.routeNotFound": "Route not found. Please try a different token.",
  "error.serverUnavailable":
    "Server is temporarily unavailable. Please try again later.",
  "error.unsupportedNetwork": "Network is not supported.",
  "error.unsupportedToken": "Token is not supported.",
  "error.insufficientLiquidity":
    "Insufficient liquidity for this swap.",
  "error.slippageTooHigh": "Slippage is too high for this swap.",
  "error.transactionRejected": "Transaction was rejected by user.",
};

