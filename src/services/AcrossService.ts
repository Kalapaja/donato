import { type Address, isAddress, isHex } from "viem";
import { isNativeToken } from "../constants/tokens.ts";
import type { WalletService } from "./WalletService.ts";
import { I18nError, type ErrorKey } from "./I18nError.ts";
import { isUserRejectionError } from "../utils/errors.ts";
import type { SubscriptionSignatureData } from "./AzothPayService.ts";
import {
  AZOTH_PAY_ADDRESS,
  MULTICALL_HANDLER_ADDRESS,
  POLYGON_USDC_ADDRESS,
  POLYGON_CHAIN_ID,
  ACROSS_APP_FEE,
  ACROSS_APP_FEE_RECIPIENT,
} from "../constants/azoth-pay.ts";

/**
 * Configuration for AcrossService
 */
export interface AcrossConfig {
  walletService: WalletService;
  baseUrl?: string;
}

/**
 * Parameters for requesting a quote from Across Protocol
 */
export interface AcrossQuoteParams {
  originChainId: number;
  inputToken: string;
  inputAmount: string;
  depositor: string;
  recipient: string;
}

/**
 * Fee breakdown from Across Protocol
 */
export interface AcrossFees {
  totalFeeUsd: string;
  bridgeFeeUsd: string;
  swapFeeUsd: string;
}

/**
 * Transaction data structure for executing transactions
 */
export interface TransactionData {
  to: string;
  data: string;
  value: string;
  gas?: string;
}

/**
 * Quote response from Across Protocol
 */
export interface AcrossQuote {
  expectedOutputAmount: string;
  minOutputAmount: string;
  inputAmount: string;
  expectedFillTime: number;
  fees: AcrossFees;
  swapTx: TransactionData;
  approvalTxns: TransactionData[];
  depositId?: string;
  originChainId: number;
  destinationChainId: number;
}

/**
 * Chain information from Across Protocol
 */
export interface AcrossChain {
  chainId: number;
  name: string;
  logoURI?: string;
}

/**
 * Token information from Across Protocol
 */
export interface AcrossToken {
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

/**
 * Argument for an Across action
 * Can be either a static value or dynamically populated by Across
 */
export interface AcrossActionArg {
  /** The argument value (string, boolean, or nested object for tuples) */
  value: string | boolean | Record<string, unknown>;
  /** If true, Across will populate this with the actual received token amount */
  populateDynamically: boolean;
  /** Token address for balance-based dynamic population */
  balanceSourceToken?: Address;
}

/**
 * An action to be executed on the destination chain via MulticallHandler
 * Actions are executed atomically after the cross-chain transfer completes
 */
export interface AcrossAction {
  /** Contract address to call */
  target: Address;
  /** Human-readable function signature (e.g., "function approve(address spender, uint256 value)") */
  functionSignature: string;
  /** Array of arguments for the function call */
  args: AcrossActionArg[];
  /** ETH value to send with the call (usually "0") */
  value: string;
  /** Whether this is a native ETH transfer (not a contract call) */
  isNativeTransfer: boolean;
}

/**
 * Cache entry with timestamp for TTL management
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * AcrossService provides cross-chain swap functionality using Across Protocol API.
 * All donations are converted to USDC on Polygon (chain ID 137).
 */
export class AcrossService {
  private walletService: WalletService;
  private baseUrl: string;
  private chainsCache: CacheEntry<AcrossChain[]> | null = null;

  /**
   * Base URL for Across Protocol API
   */
  static readonly API_BASE_URL = "https://app.across.to/api";

  /**
   * Cache time-to-live in milliseconds (5 minutes)
   */
  private readonly CACHE_TTL = 5 * 60 * 1000;

  /**
   * Fetch timeout in milliseconds (30 seconds)
   */
  private readonly FETCH_TIMEOUT = 30 * 1000;

  /**
   * Create a new AcrossService instance
   * @param config - Configuration object with WalletService dependency
   */
  constructor(config: AcrossConfig) {
    this.walletService = config.walletService;
    this.baseUrl = config.baseUrl || AcrossService.API_BASE_URL;
  }

  /**
   * Validate quote parameters
   * @throws I18nError if validation fails
   */
  private validateQuoteParams(params: AcrossQuoteParams): void {
    if (!params.inputAmount || params.inputAmount === "0") {
      throw new I18nError("error.invalidParams");
    }

    if (!/^\d+$/.test(params.inputAmount) || BigInt(params.inputAmount) <= 0n) {
      throw new I18nError("error.invalidParams");
    }

    if (!this.isValidAddress(params.depositor)) {
      throw new I18nError("error.invalidParams");
    }

    if (!this.isValidAddress(params.recipient)) {
      throw new I18nError("error.invalidParams");
    }

    if (!this.isValidAddress(params.inputToken)) {
      throw new I18nError("error.invalidParams");
    }

    if (!Number.isInteger(params.originChainId) || params.originChainId <= 0) {
      throw new I18nError("error.invalidParams");
    }
  }

  /**
   * Build AcrossQuote from API response data
   */
  private buildQuoteFromResponse(
    data: Record<string, unknown>,
    params: AcrossQuoteParams
  ): AcrossQuote {
    return {
      expectedOutputAmount: (data.expectedOutputAmount as string) || "0",
      minOutputAmount: (data.minOutputAmount as string) || "0",
      inputAmount: (data.inputAmount as string) || params.inputAmount,
      expectedFillTime: (data.expectedFillTime as number) || 0,
      fees: this.parseFees(data.fees),
      swapTx: this.parseTransactionData(data.swapTx),
      approvalTxns: this.parseApprovalTransactions(data.approvalTxns),
      depositId: data.id as string | undefined,
      originChainId: params.originChainId,
      destinationChainId: POLYGON_CHAIN_ID,
    };
  }

  /**
   * Fetch with timeout wrapper
   */
  private async fetchWithTimeout(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse JSON response with error handling
   */
  private async parseJsonResponse(
    response: Response,
    context: string
  ): Promise<unknown> {
    try {
      return await response.json();
    } catch (jsonError) {
      console.error(`Failed to parse JSON response from Across API (${context}):`, jsonError);
      throw new I18nError("error.networkConnection");
    }
  }

  /**
   * Check if a transfer is between the same token on the same chain (direct transfer).
   * Direct transfers don't need cross-chain swap functionality.
   *
   * @param fromChain - Source chain ID
   * @param fromToken - Source token address
   * @param toChain - Destination chain ID
   * @param toToken - Destination token address
   * @returns true if this is a direct transfer (no swap needed)
   */
  static isSameTokenTransfer(
    fromChain: number,
    fromToken: string,
    toChain: number,
    toToken: string
  ): boolean {
    // Must be on the same chain
    if (fromChain !== toChain) {
      return false;
    }

    // Normalize addresses for case-insensitive comparison
    const normalizedFrom = fromToken.toLowerCase();
    const normalizedTo = toToken.toLowerCase();

    // Direct match
    if (normalizedFrom === normalizedTo) {
      return true;
    }

    // Both are native tokens on the same chain
    return isNativeToken(fromToken) && isNativeToken(toToken);
  }

  /**
   * Validate that a string is a valid hex string (0x prefixed)
   */
  private isValidHexString(value: string): boolean {
    return isHex(value);
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Get a quote for a cross-chain swap
   *
   * @param params - Quote parameters
   * @returns Quote with swap details and transaction data
   */
  async getQuote(params: AcrossQuoteParams): Promise<AcrossQuote> {
    this.validateQuoteParams(params);

    const queryParams = new URLSearchParams({
      tradeType: "minOutput",
      amount: params.inputAmount,
      inputToken: params.inputToken,
      outputToken: POLYGON_USDC_ADDRESS,
      originChainId: params.originChainId.toString(),
      destinationChainId: POLYGON_CHAIN_ID.toString(),
      depositor: params.depositor,
      recipient: params.recipient,
      appFee: ACROSS_APP_FEE.toString(),
      appFeeRecipient: ACROSS_APP_FEE_RECIPIENT,
    });

    const url = `${this.baseUrl}/swap/approval?${queryParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const rawData = await this.parseJsonResponse(response, "quote");
      const data = rawData as Record<string, unknown>;

      return this.buildQuoteFromResponse(data, params);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new I18nError("error.networkConnection");
    }
  }

  /**
   * Parse fees from API response
   */
  private parseFees(fees: unknown): AcrossFees {
    if (!fees || typeof fees !== "object") {
      return {
        totalFeeUsd: "0",
        bridgeFeeUsd: "0",
        swapFeeUsd: "0",
      };
    }

    const feesObj = fees as Record<string, unknown>;
    const total = feesObj.total as Record<string, unknown> | undefined;

    return {
      totalFeeUsd: total?.amountUsd?.toString() || "0",
      bridgeFeeUsd: this.extractFeeUsd(feesObj.relayerCapital) || "0",
      swapFeeUsd: this.extractFeeUsd(feesObj.lpFee) || "0",
    };
  }

  /**
   * Extract USD amount from fee object
   */
  private extractFeeUsd(fee: unknown): string {
    if (!fee || typeof fee !== "object") {
      return "0";
    }
    const feeObj = fee as Record<string, unknown>;
    return feeObj.amountUsd?.toString() || "0";
  }

  /**
   * Parse transaction data from API response
   */
  private parseTransactionData(tx: unknown): TransactionData {
    if (!tx || typeof tx !== "object") {
      return {
        to: "",
        data: "",
        value: "0",
      };
    }

    const txObj = tx as Record<string, unknown>;
    return {
      to: txObj.to?.toString() || "",
      data: txObj.data?.toString() || "",
      value: txObj.value?.toString() || "0",
      gas: txObj.gas?.toString(),
    };
  }

  /**
   * Parse approval transactions from API response
   */
  private parseApprovalTransactions(approvals: unknown): TransactionData[] {
    if (!Array.isArray(approvals)) {
      return [];
    }

    return approvals.map((approval) => this.parseTransactionData(approval));
  }

  /**
   * Handle API error responses.
   * Throws errors with i18n keys that can be translated by the UI layer.
   */
  private async handleApiError(response: Response): Promise<never> {
    const status = response.status;

    try {
      const errorData = await response.json();
      const message = errorData.message || errorData.error || "";

      // Detect specific error by analyzing the error message
      const errorKey = this.detectSpecificError(message);
      if (errorKey) {
        throw new I18nError(errorKey);
      }
    } catch (parseError) {
      // If we threw an I18nError above, re-throw it
      if (parseError instanceof I18nError) {
        throw parseError;
      }
    }

    // Generic error messages based on status code using i18n keys
    if (status === 400) {
      throw new I18nError("error.invalidParams");
    }

    if (status === 404) {
      throw new I18nError("error.routeNotFound");
    }

    if (status >= 500) {
      throw new I18nError("error.serverUnavailable");
    }

    throw new I18nError("error.networkConnection");
  }

  /**
   * Detect specific error type from error message.
   * Analyzes error messages to determine the specific type of error
   * and returns the corresponding i18n key.
   *
   * @param message - Error message from API or other source
   * @returns i18n key for the specific error, or null if not detected
   */
  private detectSpecificError(message: string): ErrorKey | null {
    const lowerMessage = message.toLowerCase();

    const patterns: Array<[RegExp, ErrorKey]> = [
      [/unsupported.*(chain|network)|chain.*(not|invalid)|network.*(not|invalid)|unknown.*(chain|network)/, "error.unsupportedNetwork"],
      [/unsupported.*token|invalid.*token|token.*(not|found)|unknown.*token/, "error.unsupportedToken"],
      [/(insufficient|not.*enough|low|no).*liquidity|liquidity.*(insufficient|low|unavailable)/, "error.insufficientLiquidity"],
      [/slippage.*(too.*high|exceeded)|excessive.*slippage|max.*slippage|price.*impact.*(too.*high|exceeded)/, "error.slippageTooHigh"],
    ];

    for (const [pattern, errorKey] of patterns) {
      if (pattern.test(lowerMessage)) return errorKey;
    }

    return null;
  }

  /**
   * Execute a cross-chain swap using the quote
   *
   * @param quote - Quote obtained from getQuote
   * @returns Transaction hash of the swap transaction
   */
  async executeSwap(quote: AcrossQuote): Promise<string> {
    // Validate that we have a valid swap transaction
    if (!quote.swapTx || !quote.swapTx.to || !quote.swapTx.data) {
      throw new I18nError("error.invalidParams");
    }

    try {
      // Execute approval transactions first if present
      if (quote.approvalTxns && quote.approvalTxns.length > 0) {
        for (const approvalTx of quote.approvalTxns) {
          if (!approvalTx.to || !approvalTx.data) {
            console.warn("Skipping invalid approval transaction: missing 'to' or 'data' field", {
              to: approvalTx.to,
              hasData: !!approvalTx.data,
            });
            continue;
          }

          // Validate hex strings before casting
          if (!this.isValidHexString(approvalTx.to) || !this.isValidHexString(approvalTx.data)) {
            console.warn("Skipping approval transaction with invalid hex string", {
              toValid: this.isValidHexString(approvalTx.to),
              dataValid: this.isValidHexString(approvalTx.data),
            });
            continue;
          }

          try {
            await this.walletService.sendTransaction({
              to: approvalTx.to as `0x${string}`,
              data: approvalTx.data as `0x${string}`,
              value: approvalTx.value ? BigInt(approvalTx.value) : BigInt(0),
              gas: approvalTx.gas ? BigInt(approvalTx.gas) : undefined,
            });
          } catch (error) {
            // Re-throw user rejection errors with i18n key
            if (
              error instanceof Error &&
              isUserRejectionError(error)
            ) {
              throw new I18nError("error.transactionRejected");
            }
            throw new I18nError("error.networkConnection");
          }
        }
      }

      // Validate swap transaction hex strings
      if (!this.isValidHexString(quote.swapTx.to) || !this.isValidHexString(quote.swapTx.data)) {
        throw new I18nError("error.invalidParams");
      }

      // Execute the swap transaction
      const hash = await this.walletService.sendTransaction({
        to: quote.swapTx.to as `0x${string}`,
        data: quote.swapTx.data as `0x${string}`,
        value: quote.swapTx.value ? BigInt(quote.swapTx.value) : BigInt(0),
        gas: quote.swapTx.gas ? BigInt(quote.swapTx.gas) : undefined,
      });

      return hash;
    } catch (error) {
      // Re-throw if already an I18nError
      if (error instanceof I18nError) {
        throw error;
      }

      if (error instanceof Error) {
        // Check for user rejection patterns
        if (isUserRejectionError(error)) {
          throw new I18nError("error.transactionRejected");
        }

        // Try to detect specific error type from the error message
        const specificError = this.detectSpecificError(error.message);
        if (specificError) {
          throw new I18nError(specificError);
        }

        // Check for common transaction failure patterns
        const lowerMessage = error.message.toLowerCase();

        // Insufficient funds / balance errors (user doesn't have enough tokens)
        if (
          lowerMessage.includes("insufficient funds") ||
          lowerMessage.includes("insufficient balance") ||
          lowerMessage.includes("not enough balance") ||
          lowerMessage.includes("exceeds balance")
        ) {
          throw new I18nError("error.insufficientFunds");
        }
      }

      // Generic error for unknown failures
      throw new I18nError("error.networkConnection");
    }
  }

  /**
   * Get list of supported chains from Across Protocol
   * Results are cached for 5 minutes to reduce API calls.
   *
   * @returns Array of supported chains
   */
  async getSupportedChains(): Promise<AcrossChain[]> {
    if (this.chainsCache && this.isCacheValid(this.chainsCache.timestamp)) {
      return this.chainsCache.data;
    }

    const url = `${this.baseUrl}/swap/chains`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await this.parseJsonResponse(response, "chains");
      const chains = this.parseChains(data);

      this.chainsCache = {
        data: chains,
        timestamp: Date.now(),
      };

      return chains;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new I18nError("error.networkConnection");
    }
  }

  /**
   * Parse chains from API response
   */
  private parseChains(data: unknown): AcrossChain[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const chain = item as Record<string, unknown>;
        return {
          chainId: Number(chain.chainId) || 0,
          name: chain.name?.toString() || chain.chainName?.toString() || "",
          logoURI: chain.logoURI?.toString() || chain.logoUrl?.toString(),
        };
      })
      .filter((chain) => chain.chainId > 0 && chain.name);
  }

  /**
   * Check if a cache entry is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Parse tokens from API response
   */
  private parseTokens(data: unknown): AcrossToken[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const token = item as Record<string, unknown>;
        return {
          address: token.address?.toString() || "",
          chainId: Number(token.chainId) || 0,
          symbol: token.symbol?.toString() || "",
          name: token.name?.toString() || "",
          decimals: Number(token.decimals) || 18,
          logoURI: token.logoURI?.toString() || token.logoUrl?.toString(),
        };
      })
      .filter((token) => token.address && token.chainId > 0 && token.symbol);
  }

  /**
   * Get all supported tokens across all chains.
   *
   * @returns Array of all supported tokens
   */
  async getAllSupportedTokens(): Promise<AcrossToken[]> {
    const url = `${this.baseUrl}/swap/tokens`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await this.parseJsonResponse(response, "tokens");
      return this.parseTokens(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new I18nError("error.networkConnection");
    }
  }

  /**
   * Build subscription actions for MulticallHandler
   *
   * Creates an array of three actions that will be executed atomically
   * on the destination chain (Polygon) after the cross-chain transfer:
   *
   * 1. Approve USDC to AzothPay contract
   * 2. Deposit USDC for the user into AzothPay balance
   * 3. Execute bySig to create the subscription
   *
   * @param signatureData - Subscription signature data from AzothPayService
   * @returns Array of 3 AcrossAction objects in execution order
   */
  buildSubscriptionActions(signatureData: SubscriptionSignatureData): AcrossAction[] {
    // Action 1: Approve USDC to AzothPay
    // The amount will be dynamically populated by Across with the actual received amount
    const approveAction: AcrossAction = {
      target: POLYGON_USDC_ADDRESS,
      functionSignature: "function approve(address spender, uint256 value)",
      args: [
        {
          value: AZOTH_PAY_ADDRESS,
          populateDynamically: false,
        },
        {
          value: "0",
          populateDynamically: true,
          balanceSourceToken: POLYGON_USDC_ADDRESS,
        },
      ],
      value: "0",
      isNativeTransfer: false,
    };

    // Action 2: Deposit USDC for user into AzothPay
    // The amount will be dynamically populated, user address is static
    const depositForAction: AcrossAction = {
      target: AZOTH_PAY_ADDRESS,
      functionSignature: "function depositFor(uint256 amount, address to, bool isPermit2)",
      args: [
        {
          value: "0",
          populateDynamically: true,
          balanceSourceToken: POLYGON_USDC_ADDRESS,
        },
        {
          value: signatureData.userAddress,
          populateDynamically: false,
        },
        {
          value: false,
          populateDynamically: false,
        },
      ],
      value: "0",
      isNativeTransfer: false,
    };

    // Action 3: Execute bySig to create the subscription
    // All values are static from the signature data
    const bySigAction: AcrossAction = {
      target: AZOTH_PAY_ADDRESS,
      functionSignature: "function bySig(address signer, (uint256 traits, bytes data) sig, bytes signature)",
      args: [
        {
          value: signatureData.userAddress,
          populateDynamically: false,
        },
        {
          value: {
            traits: signatureData.traits.toString(),
            data: signatureData.subscribeData,
          },
          populateDynamically: false,
        },
        {
          value: signatureData.signature,
          populateDynamically: false,
        },
      ],
      value: "0",
      isNativeTransfer: false,
    };

    return [approveAction, depositForAction, bySigAction];
  }

  /**
   * Get a quote with actions for subscription flow
   *
   * Similar to getQuote, but sends actions to be executed on the destination chain.
   * The recipient is automatically set to MULTICALL_HANDLER_ADDRESS, which will
   * execute the actions atomically after the cross-chain transfer.
   *
   * @param params - Quote parameters (recipient will be overridden to MulticallHandler)
   * @param actions - Array of actions to execute on destination chain
   * @returns Quote with swap transaction and optional approval transactions
   */
  async getQuoteWithActions(
    params: AcrossQuoteParams,
    actions: AcrossAction[]
  ): Promise<AcrossQuote> {
    this.validateQuoteParams(params);

    if (!actions || actions.length === 0) {
      throw new I18nError("error.invalidParams");
    }

    const queryParams = new URLSearchParams({
      tradeType: "minOutput",
      amount: params.inputAmount,
      inputToken: params.inputToken,
      outputToken: POLYGON_USDC_ADDRESS,
      originChainId: params.originChainId.toString(),
      destinationChainId: POLYGON_CHAIN_ID.toString(),
      depositor: params.depositor,
      recipient: MULTICALL_HANDLER_ADDRESS,
      appFee: ACROSS_APP_FEE.toString(),
      appFeeRecipient: ACROSS_APP_FEE_RECIPIENT,
    });

    const url = `${this.baseUrl}/swap/approval?${queryParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actions }),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const rawData = await this.parseJsonResponse(response, "quote with actions");
      const data = rawData as Record<string, unknown>;

      return this.buildQuoteFromResponse(data, params);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new I18nError("error.networkConnection");
    }
  }
}
