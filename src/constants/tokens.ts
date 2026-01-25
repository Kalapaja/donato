/**
 * Native token placeholder addresses used by various protocols.
 * Includes:
 * - Zero address (common placeholder)
 * - 0xeeee... (common placeholder used by protocols like 1inch)
 * - 0x0...1010 (Polygon's native MATIC token contract)
 */
const NATIVE_TOKEN_ADDRESSES = [
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "0x0000000000000000000000000000000000001010", // Polygon native MATIC
];

/**
 * Check if a token address represents a native token (ETH, MATIC, etc.)
 *
 * @param tokenAddress - Token address to check
 * @returns true if the address represents a native token
 */
export function isNativeToken(tokenAddress: string): boolean {
  return NATIVE_TOKEN_ADDRESSES.includes(tokenAddress.toLowerCase());
}
