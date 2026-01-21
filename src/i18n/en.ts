import type { Translations } from "../services/I18nService.ts";

/**
 * English translations
 */
export const en: Translations = {
  // Widget header & general
  "widget.header.title": "SUPPORT",
  "widget.loading": "Initializing widget...",
  "widget.footer.contact": "Contact developers",

  // Donation type toggle
  "donation.type.oneTime": "One-time",
  "donation.type.monthly": "Monthly",

  // Amount section
  "amount.tooltip": "Any token, any chain — auto-converted",
  "amount.helper": "How much would you like to donate?",
  "amount.helper.subscription": "Monthly subscription amount",
  "subscription.duration.estimate": "Estimated duration based on deposit",
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

  // Button states
  "button.processing": "Processing...",
  "button.calculating": "Calculating...",
  "button.donate": "Donate",
  "button.subscribe": "Subscribe",

  // Success state
  "success.defaultMessage": "Thank you for your donation!",
  "success.subscription.message": "Subscription activated!",
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
  "error.networkSwitchFailed": "Please switch to {network}",
  "error.invalidParams":
    "Invalid request parameters. Please try a different amount or token.",
  "error.routeNotFound": "Route not found. Please try a different token.",
  "error.serverUnavailable":
    "Server is temporarily unavailable. Please try again later.",
  "error.unsupportedNetwork": "Network is not supported.",
  "error.unsupportedToken": "Token is not supported.",
  "error.insufficientLiquidity":
    "Insufficient liquidity for this swap.",
  "error.insufficientFunds":
    "Insufficient funds in your wallet.",
  "error.slippageTooHigh": "Slippage is too high for this swap.",
  "error.transactionRejected": "Transaction was rejected by user.",
  "error.signatureRejected": "Signature was rejected by user.",
  "error.subscriptionFailed": "Failed to create subscription. Please try again.",
  "error.walletNotConnected": "Please connect your wallet first.",
  "error.switchToPolygon": "Please switch to Polygon network in your wallet to sign the subscription.",

  // Subscription overlay
  "subscription.overlay.title": "Setting Up Subscription",
  "subscription.overlay.description": "Please follow the steps in your wallet",
  "subscription.overlay.hint": "Click to start the subscription process",

  // Subscription steps
  "subscription.step.switching": "Switching to Polygon",
  "subscription.step.switching.desc": "Please approve the network switch",
  "subscription.step.signing": "Signing Subscription",
  "subscription.step.signing.desc": "Please sign the subscription request",
  "subscription.step.building": "Preparing Transaction",
  "subscription.step.building.desc": "Building subscription actions...",
  "subscription.step.returning": "Switching Network",
  "subscription.step.returning.desc": "Returning to your original network",
  "subscription.step.quoting": "Calculating Quote",
  "subscription.step.quoting.desc": "Getting the best rate",
  "subscription.step.approving": "Approving Token",
  "subscription.step.approving.desc": "Please approve token transfer",
  "subscription.step.subscribing": "Confirming Subscription",
  "subscription.step.subscribing.desc": "Please confirm the transaction",
  "subscription.step.confirming": "Waiting for Confirmation",
  "subscription.step.confirming.desc": "Transaction submitted, waiting for confirmation",

  // Subscription setup screen
  "subscription.setup.title": "How Subscriptions Work",
  "subscription.setup.subtitle": "Your subscription uses streaming payments on Polygon",
  "subscription.setup.step1.title": "Sign Permission",
  "subscription.setup.step1.description": "You'll sign a message authorizing the subscription. This doesn't send any transaction.",
  "subscription.setup.step2.title": "Make Deposit",
  "subscription.setup.step2.description": "Funds are deposited to your AzothPay balance. You control these funds.",
  "subscription.setup.step3.title": "Start Streaming",
  "subscription.setup.step3.description": "Payments stream automatically each second from your balance.",
  "subscription.setup.depositLabel": "How many months to deposit?",
  "subscription.setup.month": "month",
  "subscription.setup.months": "months",
  "subscription.setup.monthlyPayment": "Monthly payment",
  "subscription.setup.totalDeposit": "Total deposit",
  "subscription.setup.refundNotice": "Unused funds can be withdrawn anytime through Papaya Finance.",
  "subscription.setup.back": "Back",
  "subscription.setup.continue": "Continue",

  // Subscription progress screen
  "subscription.progress.title": "Creating Subscription",
  "subscription.progress.subtitle": "Please follow the prompts in your wallet",
  "subscription.progress.monthlyAmount": "Monthly",
  "subscription.progress.depositAmount": "Deposit",
  "subscription.progress.retry": "Try Again",
  "subscription.progress.switching": "Switching to Polygon",
  "subscription.progress.switching.desc": "Subscriptions work on the Polygon network",
  "subscription.progress.signing": "Signing Permission",
  "subscription.progress.signing.desc": "This signature authorizes the subscription without sending a transaction",
  "subscription.progress.building": "Preparing Transaction",
  "subscription.progress.building.desc": "Building the cross-chain transfer data",
  "subscription.progress.returning": "Switching Back",
  "subscription.progress.returning.desc": "Returning to your original network to pay",
  "subscription.progress.quoting": "Getting Quote",
  "subscription.progress.quoting.desc": "Calculating the best conversion rate",
  "subscription.progress.approving": "Approving Token",
  "subscription.progress.approving.desc": "Allow the protocol to use your tokens for the swap",
  "subscription.progress.subscribing": "Confirming Transaction",
  "subscription.progress.subscribing.desc": "This transaction will create your subscription",
  "subscription.progress.confirming": "Waiting for Confirmation",
  "subscription.progress.confirming.desc": "Transaction submitted, waiting for blockchain confirmation",

  // Success screen - subscription management
  "success.subscription.manageText": "Manage your subscription anytime",
  "success.subscription.manageLink": "Open Papaya Finance",
  "success.subscription.cancelHint": "You can cancel and withdraw remaining funds at any time",

  // Existing subscription indicator
  "subscription.existing.message": "Already subscribed (${amount}/mo)",
  "subscription.existing.manage": "Manage on Papaya Finance",
};

