import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token, WalletService } from "../services/WalletService.ts";
import type { LiFiService, QuoteParams } from "../services/LiFiService.ts";
import type { ChainService } from "../services/ChainService.ts";
import type { ToastService } from "../services/ToastService.ts";
import type { Route } from "@lifi/sdk";
import { ErrorHandler } from "../services/ErrorHandler.ts";
import "./amount-input.ts";
import "./donate-button.ts";

@customElement("donation-form")
export class DonationForm extends LitElement {
  @property({ type: String })
  accessor recipient!: string;

  @property({ type: Number })
  accessor recipientChainId: number = 42161;

  @property({ type: String })
  accessor recipientTokenAddress: string =
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

  @property({ type: Object })
  accessor walletService!: WalletService;

  @property({ type: Object })
  accessor lifiService!: LiFiService;

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

  @state()
  private accessor recipientAmount: string = "";

  @state()
  private accessor userPayAmount: string | null = null;

  @state()
  private accessor quote: Route | null = null;

  @state()
  private accessor isQuoteLoading: boolean = false;

  @state()
  private accessor quoteError: string | null = null;

  @state()
  private accessor recipientTokenInfo: Token | null = null;

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

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadRecipientTokenInfo();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.quoteDebounceTimer !== null) {
      clearTimeout(this.quoteDebounceTimer);
    }
  }

  private async loadRecipientTokenInfo() {
    try {
      const tokenInfo = await this.lifiService.getToken(
        this.recipientChainId,
        this.recipientTokenAddress,
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

    this.isQuoteLoading = true;

    try {
      // Convert recipient amount to smallest unit using recipient token decimals
      const recipientAmountNum = parseFloat(this.recipientAmount);
      const recipientTokenDecimals = this.recipientTokenInfo.decimals;
      const toAmountInSmallestUnit =
        (recipientAmountNum * Math.pow(10, recipientTokenDecimals)).toString();

      console.log("Calculating quote:", {
        recipientAmount: this.recipientAmount,
        toAmountInSmallestUnit,
        selectedToken: this.selectedToken.symbol,
        tokenDecimals: this.selectedToken.decimals,
        recipientToken: this.recipientTokenInfo.symbol,
        recipientTokenDecimals,
        recipientChain: this.recipientChainId,
      });

      const quoteParams: QuoteParams = {
        fromChain: this.selectedToken.chainId,
        fromToken: this.selectedToken.address,
        fromAddress: account.address,
        toChain: this.recipientChainId,
        toToken: this.recipientTokenAddress,
        toAmount: toAmountInSmallestUnit,
        toAddress: this.recipient,
      };

      const quote = await this.lifiService.getQuote(quoteParams);
      this.quote = quote;

      console.log("Quote received:", {
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        fromToken: quote.fromToken?.symbol,
        toToken: quote.toToken?.symbol,
        steps: quote.steps?.length,
      });

      // Calculate user pay amount from quote
      if (quote.fromAmount) {
        const fromAmount = BigInt(quote.fromAmount);
        const decimals = this.selectedToken.decimals;
        const divisor = BigInt(10 ** decimals);
        const amount = Number(fromAmount) / Number(divisor);
        this.userPayAmount = amount.toFixed(6);
        console.log("User pay amount calculated:", this.userPayAmount);
      } else {
        console.warn("Quote has no fromAmount");
      }

      // Emit quote update event
      this.dispatchEvent(
        new CustomEvent("quote-updated", {
          detail: {
            quote: this.quote,
            loading: false,
            error: null,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      console.error("Failed to calculate quote:", error);
      this.quoteError = error instanceof Error
        ? error.message
        : "Failed to calculate quote";

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

  private async handleDonate() {
    if (!this.quote || !this.canDonate) {
      return;
    }

    // Set donating state
    this.isDonating = true;

    // Emit donation initiated event
    this.dispatchEvent(
      new CustomEvent("donation-initiated", {
        detail: { quote: this.quote },
        bubbles: true,
        composed: true,
      }),
    );

    try {
      // this.quote is already a Route from getQuote
      const route = this.quote;

      // Execute route with callbacks
      await this.lifiService.executeRoute(route, {
        onRouteUpdate: (updatedRoute: Route) => {
          // Emit route update event
          this.dispatchEvent(
            new CustomEvent("route-update", {
              detail: { route: updatedRoute },
              bubbles: true,
              composed: true,
            }),
          );
        },
        onStepUpdate: (step: Route) => {
          // Emit step update event
          this.dispatchEvent(
            new CustomEvent("step-update", {
              detail: { step },
              bubbles: true,
              composed: true,
            }),
          );
        },
      });

      // Show success notification
      const tokenSymbol = this.recipientTokenInfo?.symbol || "tokens";
      this.toastService.success(
        `Successfully donated ${this.recipientAmount} ${tokenSymbol}!`,
      );

      // Emit donation completed event
      this.dispatchEvent(
        new CustomEvent("donation-completed", {
          detail: {
            amount: this.recipientAmount,
            token: this.selectedToken,
            recipient: this.recipient,
          },
          bubbles: true,
          composed: true,
        }),
      );

      // Reset form
      this.resetForm();
    } catch (error) {
      console.error("Donation failed:", error);

      // Handle error with user-friendly message
      const userError = ErrorHandler.handle(error);
      const errorMessage = ErrorHandler.format(userError);

      // Show error notification
      this.toastService.error(errorMessage);

      // Log error for debugging
      ErrorHandler.log(userError);

      // Emit donation failed event
      this.dispatchEvent(
        new CustomEvent("donation-failed", {
          detail: {
            error: userError,
            originalError: error,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      // Reset donating state
      this.isDonating = false;
    }
  }

  private resetForm() {
    this.recipientAmount = "";
    this.userPayAmount = null;
    this.quote = null;
    this.quoteError = null;
    this.isQuoteLoading = false;
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
    const tokenSymbol = this.recipientTokenInfo?.symbol || "tokens";
    const chainName = this.chainService.getChainName(this.recipientChainId);
    return `Recipient receives (${tokenSymbol} on ${chainName})`;
  }

  private get donateButtonText(): string {
    if (this.isDonating) {
      return "Processing...";
    }

    if (this.isQuoteLoading) {
      return "Calculating...";
    }

    return "Donate";
  }

  protected override async updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Reload recipient token info when recipient chain or token changes
    if (
      changedProperties.has("recipientChainId") ||
      changedProperties.has("recipientTokenAddress")
    ) {
      await this.loadRecipientTokenInfo();
      // Recalculate quote with new recipient token
      if (this.recipientAmount && this.selectedToken) {
        this.calculateQuote();
      }
    }

    // Recalculate quote when selected token changes
    if (changedProperties.has("selectedToken") && this.recipientAmount) {
      this.calculateQuote();
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
