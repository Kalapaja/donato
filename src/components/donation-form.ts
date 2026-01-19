import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token, WalletService } from "../services/WalletService.ts";
import { AcrossService, type AcrossQuote } from "../services/AcrossService.ts";
import type { ChainService } from "../services/ChainService.ts";
import type { ToastService } from "../services/ToastService.ts";
import { I18nError } from "../services/I18nError.ts";
import { t } from "../services/I18nService.ts";
import type { Address } from "viem";
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

  @state()
  private accessor recipientTokenInfo: Token | null = null;

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

  override connectedCallback() {
    super.connectedCallback();
    this.loadRecipientTokenInfo();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.quoteDebounceTimer !== null) {
      clearTimeout(this.quoteDebounceTimer);
    }
  }

  private loadRecipientTokenInfo() {
    try {
      const tokenInfo = this.chainService.getToken(
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

      console.log("Calculating quote:", {
        recipientAmount: this.recipientAmount,
        toAmountInSmallestUnit,
        selectedToken: this.selectedToken.symbol,
        tokenDecimals: this.selectedToken.decimals,
        recipientToken: this.recipientTokenInfo.symbol,
        recipientTokenDecimals,
        recipientChain: this.recipientChainId,
      });

      // Check if this is a same-token transfer (no swap needed)
      const isSameToken = AcrossService.isSameTokenTransfer(
        this.selectedToken.chainId,
        this.selectedToken.address,
        this.recipientChainId,
        this.recipientTokenAddress,
      );

      if (isSameToken) {
        // Direct transfer - create a mock quote with 1:1 ratio
        console.log("Same token detected, using direct transfer");
        this.isDirectTransfer = true;

        // For direct transfer, inputAmount equals expectedOutputAmount (1:1 ratio)
        const mockQuote: AcrossQuote = {
          expectedOutputAmount: toAmountInSmallestUnit,
          minOutputAmount: toAmountInSmallestUnit,
          inputAmount: toAmountInSmallestUnit,
          expectedFillTime: 0,
          fees: {
            totalFeeUsd: "0",
            bridgeFeeUsd: "0",
            swapFeeUsd: "0",
          },
          swapTx: {
            to: "",
            data: "",
            value: "0",
          },
          approvalTxns: [],
          originChainId: this.selectedToken.chainId,
          destinationChainId: this.recipientChainId,
        };

        this.quote = mockQuote;
        this.userPayAmount = this.recipientAmount;

        console.log("Direct transfer quote created:", {
          inputAmount: mockQuote.inputAmount,
          expectedOutputAmount: mockQuote.expectedOutputAmount,
          isDirectTransfer: true,
        });
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

        console.log("Quote received:", {
          inputAmount: quote.inputAmount,
          expectedOutputAmount: quote.expectedOutputAmount,
          expectedFillTime: quote.expectedFillTime,
        });

        // Calculate user pay amount from quote
        if (quote.inputAmount) {
          const inputAmount = BigInt(quote.inputAmount);
          const decimals = this.selectedToken.decimals;
          const divisor = BigInt(10 ** decimals);
          const amount = Number(inputAmount) / Number(divisor);
          this.userPayAmount = amount.toFixed(6);
          console.log("User pay amount calculated:", this.userPayAmount);
        } else {
          console.warn("Quote has no inputAmount");
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

  private async handleDonate() {
    if (!this.quote || !this.canDonate) {
      return;
    }

    // Set donating state
    this.isDonating = true;

    // Emit donation initiated event
    this.dispatchEvent(
      new CustomEvent("donation-initiated", {
        detail: { quote: this.quote, isDirectTransfer: this.isDirectTransfer },
        bubbles: true,
        composed: true,
      }),
    );

    try {
      if (this.isDirectTransfer) {
        // Execute direct token transfer without Across
        await this.executeDirectTransfer();
      } else {
        // Execute Across swap for cross-chain transfer
        await this.acrossService.executeSwap(this.quote);
      }

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
            isDirectTransfer: this.isDirectTransfer,
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
      let errorMessage: string;
      if (error instanceof I18nError) {
        errorMessage = t(error.i18nKey);
      } else {
        errorMessage = error instanceof Error ? error.message : t("error.networkConnection");
      }

      // Show error notification
      this.toastService.error(errorMessage);

      // Emit donation failed event
      this.dispatchEvent(
        new CustomEvent("donation-failed", {
          detail: {
            error: errorMessage,
            originalError: error,
            isDirectTransfer: this.isDirectTransfer,
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

  /**
   * Execute a direct token transfer (same token, same chain)
   * No Across swap needed - just a simple ERC20/native transfer
   */
  private async executeDirectTransfer(): Promise<void> {
    if (!this.selectedToken || !this.quote) {
      throw new Error("Missing token or quote information");
    }

    const amount = BigInt(this.quote.inputAmount);
    const toAddress = this.recipient as Address;

    console.log("Executing direct transfer:", {
      token: this.selectedToken.symbol,
      amount: amount.toString(),
      to: toAddress,
    });

    const txHash = await this.walletService.transferToken(
      this.selectedToken,
      toAddress,
      amount,
    );

    console.log("Direct transfer successful:", txHash);
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

  protected override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Sync external recipient amount to internal state
    if (changedProperties.has("externalRecipientAmount")) {
      if (this.externalRecipientAmount !== this.recipientAmount) {
        this.recipientAmount = this.externalRecipientAmount;
        // Clear quote if amount is cleared
        if (!this.recipientAmount || parseFloat(this.recipientAmount) <= 0) {
          this.quote = null;
          this.userPayAmount = null;
          this.quoteError = null;
          this.isQuoteLoading = false;
          // Emit quote update with null quote
          this.dispatchEvent(
            new CustomEvent("quote-updated", {
              detail: {
                quote: null,
                loading: false,
                error: null,
              },
              bubbles: true,
              composed: true,
            }),
          );
        } else if (this.selectedToken) {
          // Trigger quote calculation when amount changes externally and token is selected
          this.debouncedQuoteCalculation();
        }
      }
    }

    // Reload recipient token info when recipient chain or token changes
    if (
      changedProperties.has("recipientChainId") ||
      changedProperties.has("recipientTokenAddress")
    ) {
      this.loadRecipientTokenInfo();
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
