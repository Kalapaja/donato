import {
  type Address,
  createPublicClient,
  encodeFunctionData,
  http,
  type PublicClient,
} from "viem";
import { polygon } from "viem/chains";
import type { WalletService, Token } from "./WalletService.ts";
import { I18nError, type ErrorKey } from "./I18nError.ts";
import { isUserRejectionError } from "../utils/errors.ts";
import {
  UNISWAP_SWAP_ROUTER_02,
  UNISWAP_QUOTER_V2,
  UNISWAP_FEE_TIERS,
  QUOTER_V2_ABI,
  SWAP_ROUTER_ABI,
  DEFAULT_SLIPPAGE_TOLERANCE,
  WMATIC_ADDRESS,
} from "../constants/uniswap.ts";
import { POLYGON_USDC_ADDRESS, POLYGON_CHAIN_ID } from "../constants/azoth-pay.ts";
import { isNativeToken } from "../constants/tokens.ts";

/**
 * ERC20 ABI for allowance and approve
 */
const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * Parameters for requesting a quote from Uniswap
 */
export interface UniswapQuoteParams {
  /** Input token address */
  inputToken: Address;
  /** Input token decimals */
  inputDecimals: number;
  /** Desired output amount in smallest unit (USDC) */
  outputAmount: string;
  /** Slippage tolerance (e.g., 0.5 for 0.5%) */
  slippageTolerance: number;
  /** Recipient address for the swap */
  recipient: Address;
}

/**
 * Quote response from Uniswap
 */
export interface UniswapQuote {
  /** Amount to pay in smallest unit */
  inputAmount: string;
  /** Expected output in smallest unit */
  outputAmount: string;
  /** Minimum output with slippage */
  minOutputAmount: string;
  /** Token path for the swap */
  path: Address[];
  /** Fee tier used */
  fees: number[];
  /** Estimated gas for the swap */
  estimatedGas: bigint;
}

/**
 * UniswapService provides same-chain swap functionality using Uniswap V3.
 * All swaps convert tokens to USDC on Polygon.
 *
 * Uses the singleton pattern to ensure a single service instance.
 */
export class UniswapService {
  private static instance: UniswapService;
  private walletService: WalletService;
  private publicClient: PublicClient;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(walletService: WalletService) {
    this.walletService = walletService;
    this.publicClient = createPublicClient({
      chain: polygon,
      transport: http(),
    });
  }

  /**
   * Get singleton instance
   * @param walletService - WalletService instance for wallet operations
   */
  static getInstance(walletService: WalletService): UniswapService {
    if (!UniswapService.instance || UniswapService.instance.walletService !== walletService) {
      UniswapService.instance = new UniswapService(walletService);
    }
    return UniswapService.instance;
  }

  /**
   * Check if a token address represents a native token (ETH, MATIC, etc.)
   */
  static isNativeToken(tokenAddress: string): boolean {
    return isNativeToken(tokenAddress);
  }

  /**
   * Get the appropriate token address for Uniswap operations.
   * For native tokens, returns WMATIC address.
   */
  static getSwapTokenAddress(tokenAddress: string): Address {
    if (UniswapService.isNativeToken(tokenAddress)) {
      return WMATIC_ADDRESS;
    }
    return tokenAddress as Address;
  }

  /**
   * Check if this is a same-chain swap scenario.
   * Returns true when on Polygon with a non-USDC token.
   *
   * @param chainId - Source chain ID
   * @param tokenAddress - Source token address
   * @returns true if this is a same-chain swap (Polygon with non-USDC token)
   */
  static isSameChainSwap(chainId: number, tokenAddress: string): boolean {
    // Must be on Polygon
    if (chainId !== POLYGON_CHAIN_ID) {
      return false;
    }

    // Case-insensitive comparison with USDC
    const normalizedToken = tokenAddress.toLowerCase();
    const normalizedUsdc = POLYGON_USDC_ADDRESS.toLowerCase();

    // If token is USDC, it's not a swap (it's a direct transfer)
    if (normalizedToken === normalizedUsdc) {
      return false;
    }

    // Polygon with non-USDC token = same-chain swap
    return true;
  }

  /**
   * Get a quote for swapping Token -> USDC on Polygon.
   * Uses exactOutput mode to guarantee recipient receives exact amount.
   * Tries all fee tiers in a single multicall to find the best rate.
   *
   * For native tokens (MATIC), uses WMATIC address for quoting since
   * Uniswap pools use wrapped tokens.
   *
   * @param params - Quote parameters
   * @returns Quote with best rate across all fee tiers
   * @throws I18nError with "error.uniswapNoPool" if no pool exists
   */
  async getQuote(params: UniswapQuoteParams): Promise<UniswapQuote> {
    // For native tokens, use WMATIC address for quoting
    const tokenInForQuote = UniswapService.getSwapTokenAddress(params.inputToken);

    // Build multicall for all fee tiers at once
    const contracts = UNISWAP_FEE_TIERS.map((fee) => ({
      address: UNISWAP_QUOTER_V2,
      abi: QUOTER_V2_ABI,
      functionName: "quoteExactOutputSingle" as const,
      args: [
        {
          tokenIn: tokenInForQuote,
          tokenOut: POLYGON_USDC_ADDRESS,
          amount: BigInt(params.outputAmount),
          fee,
          sqrtPriceLimitX96: 0n,
        },
      ],
    }));

    // Execute all quotes in single RPC call
    const results = await this.publicClient.multicall({
      contracts,
      allowFailure: true,
    });

    // Find the best quote (lowest input amount)
    let bestQuote: UniswapQuote | null = null;
    let lowestInput = BigInt(0);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "success") {
        const [amountIn, , , gasEstimate] = result.result as readonly [bigint, bigint, number, bigint];
        const fee = UNISWAP_FEE_TIERS[i];

        if (bestQuote === null || amountIn < lowestInput) {
          lowestInput = amountIn;
          bestQuote = {
            inputAmount: amountIn.toString(),
            outputAmount: params.outputAmount,
            minOutputAmount: params.outputAmount,
            path: [params.inputToken, POLYGON_USDC_ADDRESS],
            fees: [fee],
            estimatedGas: gasEstimate,
          };
        }
      }
    }

    if (!bestQuote) {
      throw new I18nError("error.uniswapNoPool");
    }

    return bestQuote;
  }

  /**
   * Get ERC20 allowance for a spender
   *
   * @param tokenAddress - Token contract address
   * @param ownerAddress - Token owner address
   * @param spenderAddress - Spender address to check allowance for
   * @returns Current allowance as bigint
   */
  private async getAllowance(
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address
  ): Promise<bigint> {
    const allowance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress],
    });

    return allowance;
  }

  /**
   * Execute a Uniswap swap: approve (if needed) + exactOutputSingle.
   *
   * For native tokens (MATIC), sends native value instead of ERC20 approval.
   * For ERC20 tokens, performs standard approve + swap flow.
   *
   * @param quote - Quote from getQuote
   * @param inputToken - Input token information
   * @param recipient - Recipient address for USDC
   * @param slippageTolerance - Slippage tolerance percentage (default: 0.5%)
   * @returns Transaction hash
   * @throws I18nError for various failure scenarios
   */
  async executeSwap(
    quote: UniswapQuote,
    inputToken: Token,
    recipient: Address,
    slippageTolerance: number = DEFAULT_SLIPPAGE_TOLERANCE
  ): Promise<string> {
    const account = this.walletService.getAccount();
    if (!account.address) {
      throw new I18nError("error.walletNotConnected");
    }

    const inputTokenAddress = inputToken.address as Address;
    const isNative = UniswapService.isNativeToken(inputTokenAddress);

    // Calculate max input with slippage tolerance using integer math
    // For exactOutput swaps, we add slippage to the input amount
    // slippageTolerance is in percent (e.g., 0.5 for 0.5%)
    // We multiply by 1000 to preserve precision, then divide by 100000
    const inputAmountBn = BigInt(quote.inputAmount);
    const slippageBps = BigInt(Math.round(slippageTolerance * 1000)); // 0.5% -> 500
    const maxInputAmount = inputAmountBn + (inputAmountBn * slippageBps) / 100000n;

    try {
      // For ERC20 tokens, check allowance and approve if needed
      // For native tokens, skip approval (we'll send value instead)
      if (!isNative) {
        const currentAllowance = await this.getAllowance(
          inputTokenAddress,
          account.address,
          UNISWAP_SWAP_ROUTER_02
        );

        // Request approval if needed
        if (currentAllowance < maxInputAmount) {
          // Encode approve call data
          const approveData = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [UNISWAP_SWAP_ROUTER_02, maxInputAmount],
          });

          try {
            await this.walletService.sendTransaction({
              to: inputTokenAddress,
              data: approveData,
              value: 0n,
            });
          } catch (error) {
            if (error instanceof Error) {
              if (isUserRejectionError(error)) {
                throw new I18nError("error.transactionRejected");
              }
            }
            throw error;
          }
        }
      }

      // For native tokens, use WMATIC as tokenIn; for ERC20, use the token address
      const tokenInForSwap = UniswapService.getSwapTokenAddress(inputTokenAddress);

      // Build exactOutputSingle transaction
      const swapParams = {
        tokenIn: tokenInForSwap,
        tokenOut: POLYGON_USDC_ADDRESS,
        fee: quote.fees[0],
        recipient: recipient,
        amountOut: BigInt(quote.outputAmount),
        amountInMaximum: maxInputAmount,
        sqrtPriceLimitX96: 0n,
      };

      const swapData = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: "exactOutputSingle",
        args: [swapParams],
      });

      if (isNative) {
        // For native tokens, use multicall to:
        // 1. Execute exactOutputSingle (router wraps native token)
        // 2. Refund any unused native tokens back to sender
        const refundData = encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: "refundETH",
          args: [],
        });

        const multicallData = encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: "multicall",
          args: [[swapData, refundData]],
        });

        return await this.walletService.sendTransaction({
          to: UNISWAP_SWAP_ROUTER_02,
          data: multicallData,
          value: maxInputAmount,
        });
      }

      // For ERC20 tokens, execute swap directly
      return await this.walletService.sendTransaction({
        to: UNISWAP_SWAP_ROUTER_02,
        data: swapData,
        value: 0n,
      });
    } catch (error) {
      // Re-throw if already an I18nError
      if (error instanceof I18nError) {
        throw error;
      }

      if (error instanceof Error) {
        // Check for user rejection
        if (isUserRejectionError(error)) {
          throw new I18nError("error.transactionRejected");
        }

        // Try to detect specific Uniswap error
        const specificError = UniswapService.detectUniswapError(error.message);
        if (specificError) {
          throw new I18nError(specificError);
        }

        // Check for insufficient funds
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes("insufficient funds") ||
          lowerMessage.includes("insufficient balance") ||
          lowerMessage.includes("not enough balance") ||
          lowerMessage.includes("exceeds balance")
        ) {
          throw new I18nError("error.insufficientFunds");
        }
      }

      // Generic swap failure
      throw new I18nError("error.uniswapSwapFailed");
    }
  }

  /**
   * Detect specific Uniswap error type from error message.
   * Uses regex patterns to identify the error category.
   *
   * @param message - Error message from contract or provider
   * @returns i18n key for the specific error, or null if not detected
   */
  static detectUniswapError(message: string): ErrorKey | null {
    const lowerMessage = message.toLowerCase();

    const patterns: Array<[RegExp, ErrorKey]> = [
      [/no.*pool|pool.*not.*exist|liquidity/, "error.uniswapNoPool"],
      [
        /slippage|price.*impact|too.*little.*received/,
        "error.uniswapSlippage",
      ],
      [/swap.*fail|execution.*revert/, "error.uniswapSwapFailed"],
    ];

    for (const [pattern, errorKey] of patterns) {
      if (pattern.test(lowerMessage)) return errorKey;
    }

    return null;
  }
}
