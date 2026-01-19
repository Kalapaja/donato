import type { WalletService } from "./WalletService.ts";
import { I18nError, type ErrorKey } from "./I18nError.ts";

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
   * Polygon chain ID - all donations are received on this chain
   */
  static readonly POLYGON_CHAIN_ID = 137;

  /**
   * USDC token address on Polygon - all donations are received in this token
   */
  static readonly POLYGON_USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

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

    // Handle native token variations
    // Native tokens can be represented as 0x0...0 or 0xEEE...EEE
    const nativeAddresses = [
      "0x0000000000000000000000000000000000000000",
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    ];

    const fromIsNative = nativeAddresses.includes(normalizedFrom);
    const toIsNative = nativeAddresses.includes(normalizedTo);

    // Both are native tokens on the same chain
    return fromIsNative && toIsNative;
  }

  /**
   * Validate that a string is a valid hex string (0x prefixed)
   */
  private isValidHexString(value: string): boolean {
    return /^0x[0-9a-fA-F]*$/.test(value);
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * Get a quote for a cross-chain swap
   *
   * @param params - Quote parameters
   * @returns Quote with swap details and transaction data
   */
  async getQuote(params: AcrossQuoteParams): Promise<AcrossQuote> {
    // Validate input parameters
    if (!params.inputAmount || params.inputAmount === "0") {
      throw new I18nError("error.invalidParams");
    }

    // Validate inputAmount is a valid positive integer string
    if (!/^\d+$/.test(params.inputAmount) || BigInt(params.inputAmount) <= 0n) {
      throw new I18nError("error.invalidParams");
    }

    // Validate addresses
    if (!this.isValidAddress(params.depositor)) {
      throw new I18nError("error.invalidParams");
    }

    if (!this.isValidAddress(params.recipient)) {
      throw new I18nError("error.invalidParams");
    }

    if (!this.isValidAddress(params.inputToken)) {
      throw new I18nError("error.invalidParams");
    }

    // Validate chain ID is a positive number
    if (!Number.isInteger(params.originChainId) || params.originChainId <= 0) {
      throw new I18nError("error.invalidParams");
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      tradeType: "minOutput",
      amount: params.inputAmount,
      inputToken: params.inputToken,
      outputToken: AcrossService.POLYGON_USDC,
      originChainId: params.originChainId.toString(),
      destinationChainId: AcrossService.POLYGON_CHAIN_ID.toString(),
      depositor: params.depositor,
      recipient: params.recipient,
    });

    const url = `${this.baseUrl}/swap/approval?${queryParams.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        await this.handleApiError(response);
      }

      let rawData: unknown;
      try {
        rawData = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response from Across API:", jsonError);
        throw new I18nError("error.networkConnection");
      }

      // Type cast after successful parsing
      const data = rawData as Record<string, unknown>;

      // Parse API response into AcrossQuote object
      const quote: AcrossQuote = {
        expectedOutputAmount: (data.expectedOutputAmount as string) || "0",
        minOutputAmount: (data.minOutputAmount as string) || "0",
        inputAmount: (data.inputAmount as string) || params.inputAmount,
        expectedFillTime: (data.expectedFillTime as number) || 0,
        fees: this.parseFees(data.fees),
        swapTx: this.parseTransactionData(data.swapTx),
        approvalTxns: this.parseApprovalTransactions(data.approvalTxns),
        depositId: data.id as string | undefined,
        originChainId: params.originChainId,
        destinationChainId: AcrossService.POLYGON_CHAIN_ID,
      };

      return quote;
    } catch (error) {
      // Re-throw if already a handled error (including i18n keys)
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
              this.isUserRejectionError(error)
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
        if (this.isUserRejectionError(error)) {
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
    // Check if we have a valid cached result
    if (this.chainsCache && this.isCacheValid(this.chainsCache.timestamp)) {
      return this.chainsCache.data;
    }

    const url = `${this.baseUrl}/swap/chains`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        await this.handleApiError(response);
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response from Across API (chains):", jsonError);
        throw new I18nError("error.networkConnection");
      }

      // Parse API response into AcrossChain array
      const chains = this.parseChains(data);

      // Cache the result
      this.chainsCache = {
        data: chains,
        timestamp: Date.now(),
      };

      return chains;
    } catch (error) {
      // Re-throw if already a handled error (including i18n keys)
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);

      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        await this.handleApiError(response);
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response from Across API (tokens):", jsonError);
        throw new I18nError("error.networkConnection");
      }
      return this.parseTokens(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new I18nError("error.networkConnection");
    }
  }

  /**
   * Check if an error is a user rejection error
   */
  private isUserRejectionError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("rejected") ||
      message.includes("user denied") ||
      message.includes("user cancelled") ||
      message.includes("user canceled")
    );
  }
}
