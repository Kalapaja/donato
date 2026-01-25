import { type Address, formatUnits, parseUnits } from "viem";
import type { WalletService, Token } from "./WalletService.ts";
import { AcrossService, type AcrossQuote } from "./AcrossService.ts";
import { UniswapService, type UniswapQuote } from "./UniswapService.ts";
import { I18nError } from "./I18nError.ts";
import { POLYGON_CHAIN_ID, POLYGON_USDC_ADDRESS } from "../constants/azoth-pay.ts";
import { DEFAULT_SLIPPAGE_TOLERANCE } from "../constants/uniswap.ts";

/**
 * Donation path type indicating how the donation will be processed:
 * - "direct": Same token on same chain (Polygon USDC → Polygon USDC)
 * - "same-chain-swap": Polygon with non-USDC token, uses Uniswap
 * - "cross-chain": Different chain, uses Across Protocol
 */
export type DonationPath = "direct" | "same-chain-swap" | "cross-chain";

/**
 * Parameters for calculating a quote
 */
export interface QuoteParams {
  /** Source token selected by user */
  sourceToken: Token;
  /** Recipient amount in human-readable format (e.g., "10.5") */
  recipientAmount: string;
  /** Recipient token info (always USDC on Polygon) */
  recipientToken: Token;
  /** Depositor wallet address */
  depositorAddress: Address;
  /** Final recipient address */
  recipientAddress: Address;
}

/**
 * Result of quote calculation
 */
export interface QuoteResult {
  /** The determined donation path */
  path: DonationPath;
  /** Across-compatible quote for UI display */
  quote: AcrossQuote;
  /** Uniswap quote if path is same-chain-swap */
  uniswapQuote?: UniswapQuote;
  /** Amount user needs to pay in human-readable format */
  userPayAmount: string;
  /** Whether this is a direct transfer */
  isDirectTransfer: boolean;
  /** Whether this is a same-chain swap via Uniswap */
  isSameChainSwap: boolean;
}

/**
 * QuoteService handles donation path detection and quote calculation.
 *
 * This service determines the optimal path for a donation:
 * 1. Direct transfer - when source is already Polygon USDC
 * 2. Same-chain swap - when on Polygon but with a different token (uses Uniswap)
 * 3. Cross-chain - when on a different chain (uses Across Protocol)
 */
export class QuoteService {
  private static instance: QuoteService | null = null;
  private walletService: WalletService;
  private acrossService: AcrossService;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(walletService: WalletService, acrossService: AcrossService) {
    this.walletService = walletService;
    this.acrossService = acrossService;
  }

  /**
   * Get singleton instance of QuoteService
   *
   * @param walletService - WalletService instance
   * @param acrossService - AcrossService instance
   * @returns QuoteService singleton instance
   */
  static getInstance(walletService: WalletService, acrossService: AcrossService): QuoteService {
    if (!QuoteService.instance ||
        QuoteService.instance.walletService !== walletService ||
        QuoteService.instance.acrossService !== acrossService) {
      QuoteService.instance = new QuoteService(walletService, acrossService);
    }
    return QuoteService.instance;
  }

  /**
   * Detect the donation path based on source token
   *
   * @param sourceToken - The token selected by the user
   * @returns The donation path type
   */
  detectPath(sourceToken: Token): DonationPath {
    // Check if this is a same-token transfer (Polygon USDC → Polygon USDC)
    const isSameToken = AcrossService.isSameTokenTransfer(
      sourceToken.chainId,
      sourceToken.address,
      POLYGON_CHAIN_ID,
      POLYGON_USDC_ADDRESS
    );

    if (isSameToken) {
      return "direct";
    }

    // Check if this is a same-chain swap (Polygon with non-USDC token)
    if (UniswapService.isSameChainSwap(sourceToken.chainId, sourceToken.address)) {
      return "same-chain-swap";
    }

    // Otherwise, use cross-chain via Across
    return "cross-chain";
  }

  /**
   * Calculate quote for a donation
   *
   * This method determines the best path and calculates the appropriate quote:
   * - Direct: Creates a mock quote with 1:1 ratio
   * - Same-chain swap: Uses Uniswap to get quote
   * - Cross-chain: Uses Across Protocol to get quote
   *
   * @param params - Quote calculation parameters
   * @returns Quote result with path info and amounts
   * @throws I18nError for validation or API errors
   */
  async calculateQuote(params: QuoteParams): Promise<QuoteResult> {
    const { sourceToken, recipientAmount, recipientToken, depositorAddress, recipientAddress } = params;

    // Validate inputs
    if (!recipientAmount || parseFloat(recipientAmount) <= 0) {
      throw new I18nError("error.invalidParams");
    }

    // Convert recipient amount to smallest unit
    const recipientAmountInSmallestUnit = this.toSmallestUnit(
      recipientAmount,
      recipientToken.decimals
    );

    // Detect the donation path
    const path = this.detectPath(sourceToken);

    if (path === "direct") {
      return this.calculateDirectQuote(
        sourceToken,
        recipientAmount,
        recipientAmountInSmallestUnit
      );
    }

    if (path === "same-chain-swap") {
      return this.calculateUniswapQuote(
        sourceToken,
        recipientAmount,
        recipientAmountInSmallestUnit,
        recipientAddress
      );
    }

    // Cross-chain path
    return this.calculateAcrossQuote(
      sourceToken,
      recipientAmountInSmallestUnit,
      depositorAddress,
      recipientAddress
    );
  }

  /**
   * Calculate quote for direct transfer (Polygon USDC → Polygon USDC)
   * Creates a mock quote with 1:1 ratio since no swap is needed.
   */
  private calculateDirectQuote(
    sourceToken: Token,
    recipientAmount: string,
    amountInSmallestUnit: string
  ): QuoteResult {
    const quote: AcrossQuote = {
      expectedOutputAmount: amountInSmallestUnit,
      minOutputAmount: amountInSmallestUnit,
      inputAmount: amountInSmallestUnit,
      expectedFillTime: 0,
      fees: { totalFeeUsd: "0", bridgeFeeUsd: "0", swapFeeUsd: "0" },
      swapTx: { to: "", data: "", value: "0" },
      approvalTxns: [],
      originChainId: sourceToken.chainId,
      destinationChainId: POLYGON_CHAIN_ID,
    };

    return {
      path: "direct",
      quote,
      userPayAmount: recipientAmount,
      isDirectTransfer: true,
      isSameChainSwap: false,
    };
  }

  /**
   * Calculate quote for same-chain swap via Uniswap
   */
  private async calculateUniswapQuote(
    sourceToken: Token,
    _recipientAmount: string,
    amountInSmallestUnit: string,
    recipientAddress: Address
  ): Promise<QuoteResult> {
    const uniswapService = UniswapService.getInstance(this.walletService);

    const uniswapQuote = await uniswapService.getQuote({
      inputToken: sourceToken.address as Address,
      inputDecimals: sourceToken.decimals,
      outputAmount: amountInSmallestUnit,
      slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
      recipient: recipientAddress,
    });

    // Convert UniswapQuote to common AcrossQuote format for UI compatibility
    const quote: AcrossQuote = {
      expectedOutputAmount: uniswapQuote.outputAmount,
      minOutputAmount: uniswapQuote.minOutputAmount,
      inputAmount: uniswapQuote.inputAmount,
      expectedFillTime: 0,
      fees: { totalFeeUsd: "0", bridgeFeeUsd: "0", swapFeeUsd: "0" },
      swapTx: { to: "", data: "", value: "0" },
      approvalTxns: [],
      originChainId: sourceToken.chainId,
      destinationChainId: POLYGON_CHAIN_ID,
    };

    // Calculate user pay amount from Uniswap quote
    const userPayAmount = formatUnits(
      BigInt(uniswapQuote.inputAmount),
      sourceToken.decimals
    );

    return {
      path: "same-chain-swap",
      quote,
      uniswapQuote,
      userPayAmount,
      isDirectTransfer: false,
      isSameChainSwap: true,
    };
  }

  /**
   * Calculate quote for cross-chain transfer via Across Protocol
   */
  private async calculateAcrossQuote(
    sourceToken: Token,
    amountInSmallestUnit: string,
    depositorAddress: Address,
    recipientAddress: Address
  ): Promise<QuoteResult> {
    const quote = await this.acrossService.getQuote({
      originChainId: sourceToken.chainId,
      inputToken: sourceToken.address,
      inputAmount: amountInSmallestUnit,
      depositor: depositorAddress,
      recipient: recipientAddress,
    });

    // Calculate user pay amount from quote
    let userPayAmount = "";
    if (quote.inputAmount) {
      userPayAmount = formatUnits(
        BigInt(quote.inputAmount),
        sourceToken.decimals
      );
    }

    return {
      path: "cross-chain",
      quote,
      userPayAmount,
      isDirectTransfer: false,
      isSameChainSwap: false,
    };
  }

  /**
   * Convert human-readable amount to smallest unit (wei-like)
   *
   * @param amount - Human-readable amount (e.g., "10.5")
   * @param decimals - Token decimals
   * @returns Amount in smallest unit as string
   */
  toSmallestUnit(amount: string, decimals: number): string {
    try {
      return parseUnits(amount, decimals).toString();
    } catch {
      return "0";
    }
  }

  /**
   * Convert smallest unit to human-readable amount
   *
   * @param amount - Amount in smallest unit
   * @param decimals - Token decimals
   * @returns Human-readable amount
   */
  fromSmallestUnit(amount: string, decimals: number): string {
    return formatUnits(BigInt(amount), decimals);
  }
}
