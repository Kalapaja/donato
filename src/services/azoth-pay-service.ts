import { createPublicClient, encodeFunctionData, http, type Address, type PublicClient } from "viem";
import { polygon } from "viem/chains";
import {
  AZOTH_PAY_ADDRESS,
  AZOTH_ABI,
  SECONDS_PER_MONTH,
  POLYGON_CHAIN_ID,
} from "../constants/azoth-pay.ts";
import { WalletService } from "./WalletService.ts";
import { I18nError } from "./I18nError.ts";

// Re-export constants from azoth-pay.ts for convenience
export {
  AZOTH_PAY_ADDRESS,
  MULTICALL_HANDLER_ADDRESS,
  POLYGON_USDC_ADDRESS,
  POLYGON_CHAIN_ID,
  SECONDS_PER_MONTH,
  AZOTH_ABI,
  ERC20_ABI,
} from "../constants/azoth-pay.ts";

/**
 * EIP-712 domain data from AzothPay contract
 */
export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}

/**
 * Data returned after signing a subscription
 * Contains all information needed to execute the subscription via Across
 */
export interface SubscriptionSignatureData {
  /** EIP-712 signature from the user */
  signature: `0x${string}`;
  /** Encoded traits for bySig call (nonce type, deadline, nonce) */
  traits: bigint;
  /** Encoded subscribe() function call data */
  subscribeData: `0x${string}`;
  /** Address of the signer (subscriber) */
  userAddress: Address;
}

/**
 * Information about an existing subscription
 */
export interface ExistingSubscriptionInfo {
  /** Whether a subscription exists */
  exists: boolean;
  /** Human-readable monthly amount (e.g., "10.00") */
  monthlyAmount: string;
}

/**
 * Parameters required to create a subscription signature
 */
export interface SubscriptionParams {
  /** Address of the user creating the subscription */
  userAddress: Address;
  /** Address of the subscription recipient (author/creator) */
  subscriptionTarget: Address;
  /** Monthly subscription amount in USD (as string, e.g., "10" for $10/month) */
  monthlyAmountUsd: string;
  /** Project ID for the subscription (default: 0) */
  projectId: bigint;
}

/**
 * AzothPayService provides functionality for creating recurring subscriptions
 * via AzothPay contract on Polygon.
 *
 * This service handles:
 * - Reading EIP-712 domain from the contract
 * - Getting user nonces for bySig operations
 * - Calculating subscription rates from monthly USD amounts
 * - Building and signing EIP-712 subscription messages
 *
 * All subscriptions are created on Polygon and receive USDC.
 */
export class AzothPayService {
  private static instance: AzothPayService;
  private publicClient: PublicClient;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the public client for reading from Polygon
   */
  private constructor() {
    this.publicClient = createPublicClient({
      chain: polygon,
      transport: http(),
    });
  }

  /**
   * Get the singleton instance of AzothPayService
   * @returns The AzothPayService instance
   */
  static getInstance(): AzothPayService {
    if (!AzothPayService.instance) {
      AzothPayService.instance = new AzothPayService();
    }
    return AzothPayService.instance;
  }

  /**
   * Read EIP-712 domain from AzothPay contract
   * The domain is used for signing subscription messages according to EIP-712 standard
   * @returns The EIP-712 domain data including name, version, chainId, and verifyingContract
   */
  async getEip712Domain(): Promise<Eip712Domain> {
    const result = await this.publicClient.readContract({
      address: AZOTH_PAY_ADDRESS,
      abi: AZOTH_ABI,
      functionName: "eip712Domain",
    });

    // Result is a tuple: [fields, name, version, chainId, verifyingContract, salt, extensions]
    const [_fields, name, version, chainId, verifyingContract] = result as [
      string,
      string,
      string,
      bigint,
      Address,
      string,
      bigint[],
    ];

    return {
      name,
      version,
      chainId: Number(chainId),
      verifyingContract,
    };
  }

  /**
   * Get user's current bySig nonce from AzothPay contract
   * The nonce is used for replay protection in meta-transactions
   * @param address - The user's wallet address
   * @returns The current nonce as bigint
   */
  async getBySigNonce(address: Address): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: AZOTH_PAY_ADDRESS,
      abi: AZOTH_ABI,
      functionName: "bySigAccountNonces",
      args: [address],
    });

    return result as bigint;
  }

  /**
   * Get AzothPay token decimals
   * Used for calculating subscription rates with correct precision
   * @returns The number of decimals (typically 6 for USDC or 18 for other tokens)
   */
  async getDecimals(): Promise<number> {
    const result = await this.publicClient.readContract({
      address: AZOTH_PAY_ADDRESS,
      abi: AZOTH_ABI,
      functionName: "decimals",
    });

    return Number(result);
  }

  /**
   * Check if an existing subscription exists between two addresses
   *
   * Reads the subscriptions mapping from the AzothPay contract and decodes
   * the subscription rate to calculate the monthly amount.
   *
   * @param fromAddress - The subscriber's wallet address
   * @param toAddress - The subscription recipient's address
   * @returns ExistingSubscriptionInfo containing exists flag and monthly amount
   */
  async checkExistingSubscription(
    fromAddress: Address,
    toAddress: Address
  ): Promise<ExistingSubscriptionInfo> {
    try {
      // Read subscription data from contract
      const result = await this.publicClient.readContract({
        address: AZOTH_PAY_ADDRESS,
        abi: AZOTH_ABI,
        functionName: "subscriptions",
        args: [fromAddress, toAddress],
      });

      const [exists, encodedRates] = result as [boolean, bigint];

      if (!exists) {
        return { exists: false, monthlyAmount: "0" };
      }

      // Get decimals for proper formatting
      const decimals = await this.getDecimals();

      // Extract rate from encodedRates (lower 96 bits contain the rate per second)
      // The rate is stored in the lower 96 bits of the encodedRates uint256
      const rateMask = (1n << 96n) - 1n;
      const ratePerSecond = encodedRates & rateMask;

      // Convert rate/second to monthly amount
      // monthlyAmount = ratePerSecond * SECONDS_PER_MONTH / 10^decimals
      const monthlyAmountRaw = ratePerSecond * SECONDS_PER_MONTH;
      const divisor = 10n ** BigInt(decimals);
      const monthlyAmountWhole = monthlyAmountRaw / divisor;
      const monthlyAmountFraction = monthlyAmountRaw % divisor;

      // Format with 2 decimal places
      const fractionStr = monthlyAmountFraction.toString().padStart(decimals, "0").slice(0, 2);
      const monthlyAmount = `${monthlyAmountWhole}.${fractionStr}`;

      return { exists: true, monthlyAmount };
    } catch (error) {
      console.error("Failed to check existing subscription:", error);
      return { exists: false, monthlyAmount: "0" };
    }
  }

  /**
   * Calculate subscription rate (tokens per second) from monthly USD amount
   *
   * The rate represents how many tokens (in smallest unit) should be streamed per second.
   * Formula: rate = (monthlyUsd * 10^decimals) / SECONDS_PER_MONTH
   *
   * @param monthlyUsd - Monthly subscription amount in USD (e.g., "10" for $10/month)
   * @param decimals - Token decimals (e.g., 6 for USDC, 18 for other tokens)
   * @returns The subscription rate as tokens per second
   *
   * @example
   * // $10/month with 6 decimals (USDC)
   * // rate = (10 * 10^6) / 2,592,000 = 3 (tokens per second)
   * calculateSubscriptionRate("10", 6) // returns 3n
   *
   * @example
   * // $100/month with 6 decimals (USDC)
   * // rate = (100 * 10^6) / 2,592,000 = 38 (tokens per second)
   * calculateSubscriptionRate("100", 6) // returns 38n
   */
  calculateSubscriptionRate(monthlyUsd: string, decimals: number): bigint {
    const monthlyAmount = BigInt(monthlyUsd) * 10n ** BigInt(decimals);
    return monthlyAmount / SECONDS_PER_MONTH;
  }

  /**
   * Encode subscribe function call for AzothPay contract
   *
   * Creates the calldata for the subscribe() function which registers a new subscription.
   * This encoded data will be passed to the bySig function for meta-transaction execution.
   *
   * @param target - Address of the subscription recipient (author/creator)
   * @param rate - Subscription rate in tokens per second (from calculateSubscriptionRate)
   * @param projectId - Project identifier for the subscription
   * @returns Encoded function call data as hex string
   */
  encodeSubscribeCall(
    target: Address,
    rate: bigint,
    projectId: bigint
  ): `0x${string}` {
    return encodeFunctionData({
      abi: AZOTH_ABI,
      functionName: "subscribe",
      args: [target, rate, projectId],
    });
  }

  /**
   * Build traits for bySig meta-transaction call
   *
   * Traits is a 256-bit value encoding metadata for the bySig operation:
   * - Bits [255:254] - Nonce type (0 = account nonce)
   * - Bits [253:208] - Deadline timestamp (46 bits)
   * - Bits [207:128] - Reserved (80 bits, set to 0)
   * - Bits [127:0] - Nonce value (128 bits)
   *
   * @param nonce - User's current bySig nonce from the contract
   * @param deadlineTimestamp - Unix timestamp when the signature expires
   * @returns Encoded traits as a bigint
   */
  buildTraits(nonce: bigint, deadlineTimestamp: bigint): bigint {
    // Nonce type: 0 = account nonce (bits 255:254)
    const nonceType = 0n;
    // Deadline in bits 253:208 (46 bits)
    const deadline = deadlineTimestamp;
    // Reserved bits 207:128 are 0
    // Nonce in bits 127:0

    return (nonceType << 254n) | (deadline << 208n) | nonce;
  }

  /**
   * Get subscription signature from user via EIP-712 signing
   *
   * This method orchestrates the complete subscription signing process:
   * 1. Gets current block timestamp from Polygon
   * 2. Calculates deadline (timestamp + 1 hour)
   * 3. Reads contract data (domain, nonce, decimals) in parallel
   * 4. Calculates subscription rate from monthly USD amount
   * 5. Encodes the subscribe call
   * 6. Builds traits for bySig
   * 7. Signs EIP-712 typed data via WalletService
   *
   * @param params - Subscription parameters including user address, target, amount, and project ID
   * @param walletService - WalletService instance for signing
   * @returns SubscriptionSignatureData containing signature, traits, subscribeData, and userAddress
   * @throws I18nError with key 'error.signatureRejected' if user rejects the signature
   * @throws I18nError with key 'error.subscriptionFailed' for other errors
   */
  async getSubscriptionSignature(
    params: SubscriptionParams,
    walletService: WalletService
  ): Promise<SubscriptionSignatureData> {
    try {
      // Step 1: Get current block timestamp from Polygon
      const block = await this.publicClient.getBlock();
      const currentTimestamp = block.timestamp;

      // Step 2: Calculate deadline (1 hour from now)
      const deadline = currentTimestamp + 3600n;

      // Step 3: Read contract data in parallel
      const [domain, nonce, decimals] = await Promise.all([
        this.getEip712Domain(),
        this.getBySigNonce(params.userAddress),
        this.getDecimals(),
      ]);

      // Step 4: Calculate subscription rate from monthly USD amount
      const rate = this.calculateSubscriptionRate(params.monthlyAmountUsd, decimals);

      // Step 5: Encode the subscribe call
      const subscribeData = this.encodeSubscribeCall(
        params.subscriptionTarget,
        rate,
        params.projectId
      );

      // Step 6: Build traits for bySig
      const traits = this.buildTraits(nonce, deadline);

      // Step 7: Sign EIP-712 typed data
      // Define EIP-712 types for AzothPay bySig
      const types = {
        SignedCall: [
          { name: "traits", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      };

      // Sign on Polygon - pass chainId to ensure we use Polygon wallet client
      const signature = await walletService.signTypedData({
        domain: {
          name: domain.name,
          version: domain.version,
          chainId: domain.chainId,
          verifyingContract: domain.verifyingContract,
        },
        types,
        primaryType: "SignedCall",
        message: {
          traits: traits,
          data: subscribeData,
        },
      }, POLYGON_CHAIN_ID);

      return {
        signature,
        traits,
        subscribeData,
        userAddress: params.userAddress,
      };
    } catch (error: unknown) {
      console.error("Failed to get subscription signature:", error);

      // Check for user rejection (error code 4001)
      if (
        error instanceof Error &&
        ((error as { code?: number }).code === 4001 ||
          error.message?.includes("rejected"))
      ) {
        throw new I18nError("error.signatureRejected", error);
      }

      // Re-throw I18nErrors as-is
      if (error instanceof I18nError) {
        throw error;
      }

      throw new I18nError("error.subscriptionFailed", error instanceof Error ? error : undefined);
    }
  }
}
