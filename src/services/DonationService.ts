import { type Address } from "viem";
import type { WalletService, Token } from "./WalletService.ts";
import { AcrossService, type AcrossQuote } from "./AcrossService.ts";
import { UniswapService, type UniswapQuote } from "./UniswapService.ts";
import {
  AzothPayService,
  POLYGON_CHAIN_ID,
  POLYGON_USDC_ADDRESS,
  AZOTH_PAY_ADDRESS,
} from "./AzothPayService.ts";
import { I18nError } from "./I18nError.ts";
import type { DonationPath, QuoteResult } from "./QuoteService.ts";
import { DEFAULT_SLIPPAGE_TOLERANCE } from "../constants/uniswap.ts";
import type { SubscriptionStep } from "../components/subscription-progress-screen.ts";

/**
 * Parameters for executing a one-time donation
 */
export interface DonationParams {
  /** The quote result from QuoteService */
  quoteResult: QuoteResult;
  /** Selected source token */
  sourceToken: Token;
  /** Recipient wallet address */
  recipientAddress: Address;
}

/**
 * Result of a successful donation
 */
export interface DonationResult {
  /** Transaction hash */
  transactionHash: string;
  /** Donation path used */
  path: DonationPath;
  /** Amount donated (in recipient token) */
  amount: string;
}

/**
 * Parameters for executing a subscription
 */
export interface SubscriptionParams {
  /** The quote result from QuoteService */
  quoteResult: QuoteResult;
  /** Selected source token */
  sourceToken: Token;
  /** Recipient token info */
  recipientToken: Token;
  /** Monthly subscription amount in USD (human-readable, e.g., "10") */
  monthlyAmountUsd: string;
  /** Subscription target address */
  subscriptionTarget: Address;
  /** Project ID for AzothPay */
  projectId: number;
  /** Progress callback for UI updates */
  onProgress?: (step: SubscriptionStep, isDirectTransfer: boolean) => void;
}

/**
 * Result of a successful subscription creation
 */
export interface SubscriptionResult {
  /** Transaction hash */
  transactionHash: string;
  /** Monthly amount in USD */
  monthlyAmountUsd: string;
  /** Subscription target address */
  subscriptionTarget: Address;
  /** Project ID */
  projectId: number;
  /** Origin chain ID */
  originChainId: number;
  /** Origin token info */
  originToken: {
    chainId: number;
    address: string;
    symbol: string;
  };
  /** Whether this was a direct transfer subscription */
  isDirectTransfer?: boolean;
  /** Whether this was a same-chain swap subscription */
  isSameChainSwap?: boolean;
}

/**
 * DonationService handles execution of donations and subscriptions.
 *
 * This service orchestrates the actual transaction execution:
 * - One-time donations via direct transfer, Uniswap, or Across
 * - Monthly subscriptions with EIP-712 signatures and AzothPay integration
 */
export class DonationService {
  private static instance: DonationService | null = null;
  private walletService: WalletService;
  private acrossService: AcrossService;
  private azothPayService: AzothPayService;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(
    walletService: WalletService,
    acrossService: AcrossService,
    azothPayService: AzothPayService
  ) {
    this.walletService = walletService;
    this.acrossService = acrossService;
    this.azothPayService = azothPayService;
  }

  /**
   * Get validated account with address and chainId.
   * Throws if wallet is not connected.
   */
  private getValidatedAccount(): { address: Address; chainId: number } {
    const account = this.walletService.getAccount();
    if (!account.address || !account.chainId) {
      throw new I18nError("error.walletNotConnected");
    }
    return { address: account.address, chainId: account.chainId };
  }

  /**
   * Get singleton instance of DonationService
   */
  static getInstance(
    walletService: WalletService,
    acrossService: AcrossService,
    azothPayService?: AzothPayService
  ): DonationService {
    const azothPay = azothPayService || AzothPayService.getInstance();

    if (
      !DonationService.instance ||
      DonationService.instance.walletService !== walletService ||
      DonationService.instance.acrossService !== acrossService ||
      DonationService.instance.azothPayService !== azothPay
    ) {
      DonationService.instance = new DonationService(walletService, acrossService, azothPay);
    }
    return DonationService.instance;
  }

  /**
   * Execute a one-time donation
   *
   * Routes to the appropriate execution method based on the donation path:
   * - direct: Simple ERC20 transfer
   * - same-chain-swap: Uniswap swap
   * - cross-chain: Across Protocol bridge
   *
   * @param params - Donation parameters
   * @returns Donation result with transaction hash
   * @throws I18nError for execution failures
   */
  async executeDonation(params: DonationParams): Promise<DonationResult> {
    const { quoteResult, sourceToken, recipientAddress } = params;

    if (quoteResult.path === "direct") {
      return this.executeDirectTransfer(quoteResult, sourceToken, recipientAddress);
    }

    if (quoteResult.path === "same-chain-swap") {
      return this.executeUniswapSwap(quoteResult, sourceToken, recipientAddress);
    }

    // Cross-chain path
    return this.executeAcrossSwap(quoteResult);
  }

  /**
   * Execute a direct token transfer (Polygon USDC → Polygon USDC)
   */
  private async executeDirectTransfer(
    quoteResult: QuoteResult,
    sourceToken: Token,
    recipientAddress: Address
  ): Promise<DonationResult> {
    const txHash = await this.walletService.transferToken(
      sourceToken,
      recipientAddress,
      BigInt(quoteResult.quote.inputAmount)
    );

    return {
      transactionHash: txHash,
      path: "direct",
      amount: quoteResult.userPayAmount,
    };
  }

  /**
   * Execute a Uniswap swap (Polygon non-USDC → USDC)
   */
  private async executeUniswapSwap(
    quoteResult: QuoteResult,
    sourceToken: Token,
    recipientAddress: Address
  ): Promise<DonationResult> {
    if (!quoteResult.uniswapQuote) {
      throw new I18nError("error.invalidParams");
    }

    const uniswapService = UniswapService.getInstance(this.walletService);
    const txHash = await uniswapService.executeSwap(
      quoteResult.uniswapQuote,
      sourceToken,
      recipientAddress,
      DEFAULT_SLIPPAGE_TOLERANCE
    );

    return {
      transactionHash: txHash,
      path: "same-chain-swap",
      amount: quoteResult.userPayAmount,
    };
  }

  /**
   * Execute a cross-chain swap via Across Protocol
   */
  private async executeAcrossSwap(quoteResult: QuoteResult): Promise<DonationResult> {
    const txHash = await this.acrossService.executeSwap(quoteResult.quote);

    return {
      transactionHash: txHash,
      path: "cross-chain",
      amount: quoteResult.userPayAmount,
    };
  }

  /**
   * Execute a subscription
   *
   * Routes to the appropriate subscription method based on the donation path:
   * - direct: Polygon USDC → AzothPay subscription
   * - same-chain-swap: Polygon non-USDC → Uniswap → AzothPay subscription
   * - cross-chain: Other chain → Across → AzothPay subscription
   *
   * @param params - Subscription parameters
   * @returns Subscription result with transaction hash
   * @throws I18nError for execution failures
   */
  async executeSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    const { quoteResult } = params;

    if (quoteResult.path === "direct") {
      return this.executeDirectSubscription(params);
    }

    if (quoteResult.path === "same-chain-swap") {
      return this.executeSameChainSwapSubscription(params);
    }

    // Cross-chain path
    return this.executeCrossChainSubscription(params);
  }

  /**
   * Execute direct subscription (user already has Polygon USDC)
   *
   * Flow:
   * 1. Switch to Polygon if needed
   * 2. Get EIP-712 subscription signature
   * 3. Approve USDC to AzothPay (if needed)
   * 4. Deposit USDC to AzothPay
   * 5. Execute bySig to create subscription
   */
  private async executeDirectSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    const {
      quoteResult,
      sourceToken,
      recipientToken,
      monthlyAmountUsd,
      subscriptionTarget,
      projectId,
      onProgress,
    } = params;

    const account = this.getValidatedAccount();
    const userAddress = account.address;
    const recipientTokenDecimals = recipientToken.decimals;
    const depositAmount = BigInt(
      Math.floor(parseFloat(monthlyAmountUsd) * Math.pow(10, recipientTokenDecimals))
    );
    const projectIdBigInt = BigInt(projectId);

    // Step 1: Switch to Polygon if needed
    onProgress?.("switching", true);
    if (account.chainId !== POLYGON_CHAIN_ID) {
      await this.walletService.switchChain(POLYGON_CHAIN_ID);
    }

    // Step 2: Get subscription signature
    onProgress?.("signing", true);
    const signatureData = await this.azothPayService.getSubscriptionSignature(
      {
        userAddress,
        subscriptionTarget,
        monthlyAmountUsd,
        projectId: projectIdBigInt,
      },
      this.walletService
    );

    // Step 3: Approve USDC if needed
    onProgress?.("approving", true);
    const currentAllowance = await this.azothPayService.getUsdcAllowance(userAddress);

    if (currentAllowance < depositAmount) {
      const approveData = this.azothPayService.encodeApproveCall(AZOTH_PAY_ADDRESS, depositAmount);
      await this.walletService.sendTransaction({
        to: POLYGON_USDC_ADDRESS,
        data: approveData,
        value: BigInt(0),
      });
    }

    // Step 4: Deposit USDC
    onProgress?.("subscribing", true);
    const depositForData = this.azothPayService.encodeDepositForCall(depositAmount, userAddress);
    await this.walletService.sendTransaction({
      to: AZOTH_PAY_ADDRESS,
      data: depositForData,
      value: BigInt(0),
    });

    // Step 5: Execute bySig
    const bySigData = this.azothPayService.encodeBySigCall(
      signatureData.userAddress,
      signatureData.traits,
      signatureData.subscribeData,
      signatureData.signature
    );
    const txHash = await this.walletService.sendTransaction({
      to: AZOTH_PAY_ADDRESS,
      data: bySigData,
      value: BigInt(0),
    });

    onProgress?.("confirming", true);

    return {
      transactionHash: txHash,
      monthlyAmountUsd,
      subscriptionTarget,
      projectId,
      originChainId: POLYGON_CHAIN_ID,
      originToken: {
        chainId: sourceToken.chainId,
        address: sourceToken.address,
        symbol: sourceToken.symbol,
      },
      isDirectTransfer: true,
    };
  }

  /**
   * Execute same-chain swap subscription (Polygon non-USDC)
   *
   * Flow:
   * 1. Get EIP-712 subscription signature (already on Polygon)
   * 2. Execute Uniswap swap (token → USDC to user's address)
   * 3. Approve USDC to AzothPay
   * 4. Deposit USDC to AzothPay
   * 5. Execute bySig to create subscription
   */
  private async executeSameChainSwapSubscription(
    params: SubscriptionParams
  ): Promise<SubscriptionResult> {
    const {
      quoteResult,
      sourceToken,
      recipientToken,
      monthlyAmountUsd,
      subscriptionTarget,
      projectId,
      onProgress,
    } = params;

    if (!quoteResult.uniswapQuote) {
      throw new I18nError("error.invalidParams");
    }

    const account = this.getValidatedAccount();
    const userAddress = account.address;
    const recipientTokenDecimals = recipientToken.decimals;
    const depositAmount = BigInt(
      Math.floor(parseFloat(monthlyAmountUsd) * Math.pow(10, recipientTokenDecimals))
    );
    const projectIdBigInt = BigInt(projectId);

    const uniswapService = UniswapService.getInstance(this.walletService);

    // Store token info for swap before any chain operations
    const inputToken = sourceToken;

    // Step 1: Get subscription signature (already on Polygon for same-chain swap)
    onProgress?.("signing", false);
    const signatureData = await this.azothPayService.getSubscriptionSignature(
      {
        userAddress,
        subscriptionTarget,
        monthlyAmountUsd,
        projectId: projectIdBigInt,
      },
      this.walletService
    );

    // Step 2: Execute Uniswap swap (token → USDC to user's address)
    onProgress?.("approving", false);
    await uniswapService.executeSwap(
      quoteResult.uniswapQuote,
      inputToken,
      userAddress, // USDC goes to user's wallet first
      DEFAULT_SLIPPAGE_TOLERANCE
    );

    // Step 3: Approve USDC to AzothPay
    onProgress?.("approving", false);
    const currentAllowance = await this.azothPayService.getUsdcAllowance(userAddress);

    if (currentAllowance < depositAmount) {
      const approveData = this.azothPayService.encodeApproveCall(AZOTH_PAY_ADDRESS, depositAmount);
      await this.walletService.sendTransaction({
        to: POLYGON_USDC_ADDRESS,
        data: approveData,
        value: BigInt(0),
      });
    }

    // Step 4: Deposit USDC to AzothPay
    onProgress?.("subscribing", false);
    const depositForData = this.azothPayService.encodeDepositForCall(depositAmount, userAddress);
    await this.walletService.sendTransaction({
      to: AZOTH_PAY_ADDRESS,
      data: depositForData,
      value: BigInt(0),
    });

    // Step 5: Execute bySig
    const bySigData = this.azothPayService.encodeBySigCall(
      signatureData.userAddress,
      signatureData.traits,
      signatureData.subscribeData,
      signatureData.signature
    );
    const txHash = await this.walletService.sendTransaction({
      to: AZOTH_PAY_ADDRESS,
      data: bySigData,
      value: BigInt(0),
    });

    onProgress?.("confirming", false);

    return {
      transactionHash: txHash,
      monthlyAmountUsd,
      subscriptionTarget,
      projectId,
      originChainId: POLYGON_CHAIN_ID,
      originToken: {
        chainId: inputToken.chainId,
        address: inputToken.address,
        symbol: inputToken.symbol,
      },
      isSameChainSwap: true,
    };
  }

  /**
   * Execute cross-chain subscription via Across Protocol
   *
   * Flow:
   * 1. Switch to Polygon to get signature
   * 2. Get EIP-712 subscription signature
   * 3. Build Across actions for multicall
   * 4. Switch back to original chain
   * 5. Get quote with actions
   * 6. Execute approvals if needed
   * 7. Execute swap with actions
   */
  private async executeCrossChainSubscription(
    params: SubscriptionParams
  ): Promise<SubscriptionResult> {
    const {
      quoteResult,
      sourceToken,
      recipientToken,
      monthlyAmountUsd,
      subscriptionTarget,
      projectId,
      onProgress,
    } = params;

    const account = this.getValidatedAccount();

    // Store original state before chain switching
    const originalChainId = account.chainId;
    const userAddress = account.address;
    const originToken = {
      chainId: sourceToken.chainId,
      address: sourceToken.address,
      symbol: sourceToken.symbol,
    };
    const projectIdBigInt = BigInt(projectId);

    const recipientTokenDecimals = recipientToken.decimals;
    const outputAmount = Math.floor(
      parseFloat(monthlyAmountUsd) * Math.pow(10, recipientTokenDecimals)
    ).toString();

    try {
      // Step 1: Switch to Polygon
      onProgress?.("switching", false);
      await this.walletService.switchChain(POLYGON_CHAIN_ID);

      // Step 2: Get subscription signature
      onProgress?.("signing", false);
      const signatureData = await this.azothPayService.getSubscriptionSignature(
        {
          userAddress,
          subscriptionTarget,
          monthlyAmountUsd,
          projectId: projectIdBigInt,
        },
        this.walletService
      );

      // Step 3: Build Across actions
      onProgress?.("building", false);
      const actions = this.acrossService.buildSubscriptionActions(signatureData);

      // Step 4: Switch back to original chain
      onProgress?.("returning", false);
      await this.walletService.switchChain(originalChainId);

      // Step 5: Get quote with actions
      onProgress?.("quoting", false);
      const quoteWithActions = await this.acrossService.getQuoteWithActions(
        {
          originChainId: originToken.chainId,
          inputToken: originToken.address,
          inputAmount: outputAmount,
          depositor: userAddress,
          recipient: subscriptionTarget,
        },
        actions
      );

      // Step 6: Execute approvals
      if (quoteWithActions.approvalTxns?.length) {
        onProgress?.("approving", false);
        for (const approvalTx of quoteWithActions.approvalTxns) {
          if (!approvalTx.to || !approvalTx.data) continue;
          await this.walletService.sendTransaction({
            to: approvalTx.to as Address,
            data: approvalTx.data as `0x${string}`,
            value: approvalTx.value ? BigInt(approvalTx.value) : BigInt(0),
          });
        }
      }

      // Step 7: Execute swap with actions
      onProgress?.("subscribing", false);
      const txHash = await this.walletService.sendTransaction({
        to: quoteWithActions.swapTx.to as Address,
        data: quoteWithActions.swapTx.data as `0x${string}`,
        value: quoteWithActions.swapTx.value
          ? BigInt(quoteWithActions.swapTx.value)
          : BigInt(0),
      });

      onProgress?.("confirming", false);

      return {
        transactionHash: txHash,
        monthlyAmountUsd,
        subscriptionTarget,
        projectId,
        originChainId: originalChainId,
        originToken,
      };
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

      throw error;
    }
  }
}
