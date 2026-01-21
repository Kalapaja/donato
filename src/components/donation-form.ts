import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token, WalletService } from "../services/WalletService.ts";
import { AcrossService, type AcrossQuote } from "../services/AcrossService.ts";
import type { ChainService } from "../services/ChainService.ts";
import type { ToastService } from "../services/ToastService.ts";
import { I18nError } from "../services/I18nError.ts";
import { t } from "../services/I18nService.ts";
import { AzothPayService, POLYGON_CHAIN_ID } from "../services/azoth-pay-service.ts";
import type { Address } from "viem";
import type { DonationType } from "./donation-type-toggle.ts";
import type { SubscriptionStep } from "./subscription-progress-screen.ts";
import "./amount-input.ts";
import "./donate-button.ts";

@customElement("donation-form")
export class DonationForm extends LitElement {
  @property({ type: String })
  accessor recipient!: string;

  @property({ type: Object })
  accessor walletService!: WalletService;

  @property({ type: Object })
  accessor acrossService!: AcrossService;

  @property({ type: Object })
  accessor chainService!: ChainService;

  @property({ type: Object })
  accessor toastService!: ToastService;

  @property({ type: Object })
  accessor selectedToken: Token | null = null;

  @property({ type: Boolean })
  accessor isDonating: boolean = false;

  @property({ type: Boolean })
  accessor disabled: boolean = false;

  /** Current donation type (one-time or monthly subscription) */
  @property({ type: String, attribute: "donation-type" })
  accessor donationType: DonationType = "one-time";

  /** Subscription target address (for monthly subscriptions) */
  @property({ type: String, attribute: "subscription-target" })
  accessor subscriptionTarget: string = "";

  /** Project ID for AzothPay subscription */
  @property({ type: Number, attribute: "project-id" })
  accessor projectId: number = 0;

  /** External recipient amount (synced from parent widget) */
  @property({ type: String, attribute: "recipient-amount" })
  accessor externalRecipientAmount: string = "";

  @state()
  private accessor recipientAmount: string = "";

  @state()
  private accessor userPayAmount: string | null = null;

  @state()
  private accessor quote: AcrossQuote | null = null;

  @state()
  private accessor isQuoteLoading: boolean = false;

  @state()
  private accessor quoteError: string | I18nError | null = null;

  /** Recipient token info - passed from parent or loaded internally */
  @property({ type: Object, attribute: false })
  accessor recipientTokenInfo: Token | null = null;

  @state()
  private accessor isDirectTransfer: boolean = false;

  private quoteDebounceTimer: number | null = null;
  private readonly QUOTE_DEBOUNCE_MS = 500;

  static override styles = css`
    :host {
      display: block;
    }

    :host([disabled]) .form-container {
      opacity: 0.5;
      pointer-events: none;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.quoteDebounceTimer !== null) {
      clearTimeout(this.quoteDebounceTimer);
    }
  }

  private loadRecipientTokenInfo() {
    try {
      // Always use Polygon USDC as recipient token
      const tokenInfo = this.chainService.getToken(
        POLYGON_CHAIN_ID,
        AcrossService.POLYGON_USDC,
      );
      this.recipientTokenInfo = tokenInfo || null;
    } catch (error) {
      console.error("Failed to load recipient token info:", error);
      this.recipientTokenInfo = null;
    }
  }

  private handleAmountChange(event: CustomEvent<{ value: string }>) {
    this.recipientAmount = event.detail.value;

    // Emit amount change event
    this.dispatchEvent(
      new CustomEvent("amount-changed", {
        detail: event.detail.value,
        bubbles: true,
        composed: true,
      }),
    );

    // Debounce quote calculation
    this.debouncedQuoteCalculation();
  }

  private debouncedQuoteCalculation() {
    if (this.quoteDebounceTimer !== null) {
      clearTimeout(this.quoteDebounceTimer);
    }

    this.quoteDebounceTimer = globalThis.setTimeout(() => {
      this.calculateQuote();
    }, this.QUOTE_DEBOUNCE_MS);
  }

  private async calculateQuote() {
    // Reset quote state
    this.quote = null;
    this.userPayAmount = null;
    this.quoteError = null;
    this.isDirectTransfer = false;

    // Validate inputs
    if (!this.recipientAmount || parseFloat(this.recipientAmount) <= 0) {
      return;
    }

    if (!this.selectedToken) {
      this.quoteError = "Please select a token";
      return;
    }

    if (!this.recipientTokenInfo) {
      this.quoteError = "Loading recipient token information...";
      return;
    }

    const account = this.walletService.getAccount();
    if (!account.address) {
      this.quoteError = "Please connect your wallet";
      return;
    }

    // Emit loading state at start of calculation
    this.dispatchEvent(
      new CustomEvent("quote-updated", {
        detail: { quote: null, loading: true, error: null },
        bubbles: true,
        composed: true,
      }),
    );
    this.isQuoteLoading = true;

    try {
      // Convert recipient amount to smallest unit using recipient token decimals
      const recipientAmountNum = parseFloat(this.recipientAmount);
      const recipientTokenDecimals = this.recipientTokenInfo.decimals;
      const toAmountInSmallestUnit =
        (recipientAmountNum * Math.pow(10, recipientTokenDecimals)).toString();

      // Check if this is a same-token transfer (no swap needed)
      // Always compare against Polygon USDC as recipient
      const isSameToken = AcrossService.isSameTokenTransfer(
        this.selectedToken.chainId,
        this.selectedToken.address,
        POLYGON_CHAIN_ID,
        AcrossService.POLYGON_USDC,
      );

      if (isSameToken) {
        // Direct transfer - create a mock quote with 1:1 ratio
        this.isDirectTransfer = true;
        this.quote = {
          expectedOutputAmount: toAmountInSmallestUnit,
          minOutputAmount: toAmountInSmallestUnit,
          inputAmount: toAmountInSmallestUnit,
          expectedFillTime: 0,
          fees: { totalFeeUsd: "0", bridgeFeeUsd: "0", swapFeeUsd: "0" },
          swapTx: { to: "", data: "", value: "0" },
          approvalTxns: [],
          originChainId: this.selectedToken.chainId,
          destinationChainId: POLYGON_CHAIN_ID,
        };
        this.userPayAmount = this.recipientAmount;
      } else {
        // Use Across for swap/bridge
        const quote = await this.acrossService.getQuote({
          originChainId: this.selectedToken.chainId,
          inputToken: this.selectedToken.address,
          inputAmount: toAmountInSmallestUnit,
          depositor: account.address,
          recipient: this.recipient,
        });
        this.quote = quote;

        // Calculate user pay amount from quote
        if (quote.inputAmount) {
          const inputAmount = BigInt(quote.inputAmount);
          const decimals = this.selectedToken.decimals;
          const divisor = BigInt(10 ** decimals);
          const amount = Number(inputAmount) / Number(divisor);
          this.userPayAmount = amount.toFixed(6);
        }
      }

      // Emit quote update event
      this.dispatchEvent(
        new CustomEvent("quote-updated", {
          detail: {
            quote: this.quote,
            loading: false,
            error: null,
            isDirectTransfer: this.isDirectTransfer,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      console.error("Failed to calculate quote:", error);

      // Preserve I18nError instances for type-safe translation
      if (error instanceof I18nError) {
        this.quoteError = error;
      } else {
        this.quoteError = error instanceof Error
          ? error.message
          : "Failed to calculate quote";
      }

      // Emit quote error event
      this.dispatchEvent(
        new CustomEvent("quote-updated", {
          detail: {
            quote: null,
            loading: false,
            error: this.quoteError,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.isQuoteLoading = false;
    }
  }

  public async handleDonate() {
    if (!this.quote || !this.canDonate) {
      return;
    }

    // Set donating state
    this.isDonating = true;

    // Emit donation initiated event
    this.dispatchEvent(
      new CustomEvent("donation-initiated", {
        detail: {
          quote: this.quote,
          isDirectTransfer: this.isDirectTransfer,
          isSubscription: this.donationType === "monthly",
        },
        bubbles: true,
        composed: true,
      }),
    );

    try {
      // Route to appropriate handler based on donation type
      if (this.donationType === "monthly") {
        await this.handleSubscription();
        this.toastService.success(t("success.subscription.message"));
      } else {
        // Execute transfer (direct or via Across)
        if (this.isDirectTransfer) {
          await this.executeDirectTransfer();
        } else {
          await this.acrossService.executeSwap(this.quote);
        }

        const tokenSymbol = this.recipientTokenInfo?.symbol || "tokens";
        this.toastService.success(
          `Successfully donated ${this.recipientAmount} ${tokenSymbol}!`,
        );

        this.dispatchEvent(
          new CustomEvent("donation-completed", {
            detail: {
              amount: this.recipientAmount,
              token: this.selectedToken,
              recipient: this.recipient,
              isDirectTransfer: this.isDirectTransfer,
            },
            bubbles: true,
            composed: true,
          }),
        );
      }

      this.resetForm();
    } catch (error) {
      const errorMessage = error instanceof I18nError
        ? t(error.i18nKey)
        : error instanceof Error
          ? error.message
          : t("error.networkConnection");

      this.toastService.error(errorMessage);

      this.dispatchEvent(
        new CustomEvent("donation-failed", {
          detail: {
            error: errorMessage,
            originalError: error,
            isDirectTransfer: this.isDirectTransfer,
            isSubscription: this.donationType === "monthly",
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
   * Execute a direct token transfer (same token, same chain)
   * No Across swap needed - just a simple ERC20/native transfer
   */
  private async executeDirectTransfer(): Promise<void> {
    if (!this.selectedToken || !this.quote) {
      throw new Error("Missing token or quote information");
    }

    await this.walletService.transferToken(
      this.selectedToken,
      this.recipient as Address,
      BigInt(this.quote.inputAmount),
    );
  }

  /**
   * Emit subscription progress event
   * Used by the subscription explainer overlay to show current step
   */
  private emitSubscriptionProgress(step: SubscriptionStep): void {
    this.dispatchEvent(
      new CustomEvent("subscription-progress", {
        detail: { step },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Handle subscription flow for monthly donations.
   * Orchestrates: validation, chain switching, signature, approval, and swap execution.
   */
  private async handleSubscription(): Promise<void> {
    if (!this.quote || !this.selectedToken) {
      throw new I18nError("error.invalidParams");
    }

    const account = this.walletService.getAccount();
    if (!account.address || !account.chainId) {
      throw new I18nError("error.walletNotConnected");
    }

    // Store original state before chain switching (chain switches can reset selectedToken)
    const originalChainId = account.chainId;
    const userAddress = account.address;
    const originToken = {
      chainId: this.selectedToken.chainId,
      address: this.selectedToken.address,
      symbol: this.selectedToken.symbol,
    };
    const monthlyAmount = this.recipientAmount;
    const target = (this.subscriptionTarget || this.recipient) as Address;
    const projectIdBigInt = BigInt(this.projectId);

    const recipientTokenDecimals = this.recipientTokenInfo?.decimals ?? 6;
    const outputAmount = (parseFloat(monthlyAmount) * Math.pow(10, recipientTokenDecimals)).toString();

    const azothPayService = AzothPayService.getInstance();

    try {
      this.emitSubscriptionProgress("switching");
      await this.walletService.switchChain(POLYGON_CHAIN_ID);

      this.emitSubscriptionProgress("signing");
      const signatureData = await azothPayService.getSubscriptionSignature(
        {
          userAddress,
          subscriptionTarget: target,
          monthlyAmountUsd: monthlyAmount,
          projectId: projectIdBigInt,
        },
        this.walletService,
      );

      this.emitSubscriptionProgress("building");
      const actions = this.acrossService.buildSubscriptionActions(signatureData);

      this.emitSubscriptionProgress("returning");
      await this.walletService.switchChain(originalChainId);

      this.emitSubscriptionProgress("quoting");
      const quoteWithActions = await this.acrossService.getQuoteWithActions(
        {
          originChainId: originToken.chainId,
          inputToken: originToken.address,
          inputAmount: outputAmount,
          depositor: userAddress,
          recipient: this.recipient,
        },
        actions,
      );

      if (quoteWithActions.approvalTxns?.length) {
        this.emitSubscriptionProgress("approving");
        for (const approvalTx of quoteWithActions.approvalTxns) {
          if (!approvalTx.to || !approvalTx.data) continue;
          await this.walletService.sendTransaction({
            to: approvalTx.to as Address,
            data: approvalTx.data as `0x${string}`,
            value: approvalTx.value ? BigInt(approvalTx.value) : BigInt(0),
          });
        }
      }

      this.emitSubscriptionProgress("subscribing");
      const txHash = await this.walletService.sendTransaction({
        to: quoteWithActions.swapTx.to as Address,
        data: quoteWithActions.swapTx.data as `0x${string}`,
        value: quoteWithActions.swapTx.value ? BigInt(quoteWithActions.swapTx.value) : BigInt(0),
      });

      this.emitSubscriptionProgress("confirming");

      this.dispatchEvent(
        new CustomEvent("subscription-created", {
          detail: {
            transactionHash: txHash,
            monthlyAmountUsd: monthlyAmount,
            subscriptionTarget: target,
            projectId: this.projectId,
            originChainId: originalChainId,
            originToken,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {

      // If we're on a different chain than the original, try to switch back
      const currentAccount = this.walletService.getAccount();
      if (currentAccount.chainId && currentAccount.chainId !== originalChainId) {
        try {
          await this.walletService.switchChain(originalChainId);
        } catch (switchError) {
          console.warn("Failed to switch back to original chain:", switchError);
        }
      }

      // Re-throw the error for upstream handling
      throw error;
    }
  }

  private resetForm() {
    this.recipientAmount = "";
    this.userPayAmount = null;
    this.quote = null;
    this.quoteError = null;
    this.isQuoteLoading = false;
    this.isDirectTransfer = false;
  }

  private get canDonate(): boolean {
    const account = this.walletService.getAccount();

    return (
      !this.disabled &&
      !this.isDonating &&
      !!this.recipientAmount &&
      parseFloat(this.recipientAmount) > 0 &&
      !!this.selectedToken &&
      !!this.quote &&
      !this.isQuoteLoading &&
      !this.quoteError &&
      !!account.address &&
      account.chainId === this.selectedToken.chainId
    );
  }

  private get recipientLabel(): string {
    return "Recipient receives (USDC on Polygon)";
  }

  private get donateButtonText(): string {
    if (this.isDonating) {
      return t("button.processing");
    }

    if (this.isQuoteLoading) {
      return t("button.calculating");
    }

    if (this.donationType === "monthly") {
      return t("button.subscribe");
    }

    return t("button.donate");
  }

  protected override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Sync external recipient amount to internal state
    if (changedProperties.has("externalRecipientAmount")) {
      if (this.externalRecipientAmount !== this.recipientAmount) {
        this.recipientAmount = this.externalRecipientAmount;
        if (!this.recipientAmount || parseFloat(this.recipientAmount) <= 0) {
          this.quote = null;
          this.userPayAmount = null;
          this.quoteError = null;
          this.isQuoteLoading = false;
          this.dispatchEvent(
            new CustomEvent("quote-updated", {
              detail: { quote: null, loading: false, error: null },
              bubbles: true,
              composed: true,
            }),
          );
        } else if (this.selectedToken) {
          this.debouncedQuoteCalculation();
        }
      }
    }

    // Recalculate quote when selected token changes
    // But not during an active donation/subscription flow
    if (changedProperties.has("selectedToken") && this.recipientAmount && !this.isDonating) {
      this.calculateQuote();
    }

    // Recalculate quote when recipientTokenInfo becomes available
    if (changedProperties.has("recipientTokenInfo") && this.recipientTokenInfo) {
      if (this.recipientAmount && this.selectedToken) {
        this.calculateQuote();
      }
    }
  }

  override render() {
    return html`
      <div class="form-container">
        <amount-input
          label="${this.recipientLabel}"
          .value="${this.recipientAmount}"
          .selectedToken="${this.selectedToken}"
          .recipientToken="${this.recipientTokenInfo}"
          .quote="${this.quote}"
          .isQuoteLoading="${this.isQuoteLoading}"
          ?disabled="${this.disabled || this.isDonating}"
          @amount-change="${this.handleAmountChange}"
        ></amount-input>

        <donate-button
          .disabled="${!this.canDonate}"
          .loading="${this.isDonating}"
          .text="${this.donateButtonText}"
          @donate-click="${this.handleDonate}"
        ></donate-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "donation-form": DonationForm;
  }
}
