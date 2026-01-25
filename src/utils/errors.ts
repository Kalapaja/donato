/**
 * Shared error utility functions for the donation widget.
 */

/**
 * Check if an error is a user rejection error (e.g., user denied signature/transaction).
 *
 * @param error - The error to check
 * @returns true if the error indicates user rejection
 */
export function isUserRejectionError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Check error code for wallet rejection (EIP-1193)
  const errorCode = (error as Error & { code?: number }).code;
  if (errorCode === 4001 || errorCode === -32000) {
    return true;
  }

  return (
    message.includes("rejected") ||
    message.includes("user denied") ||
    message.includes("user cancelled") ||
    message.includes("user canceled")
  );
}

/**
 * Check if an error indicates insufficient funds/balance.
 *
 * @param error - The error to check
 * @returns true if the error indicates insufficient funds
 */
export function isInsufficientFundsError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance") ||
    message.includes("not enough balance") ||
    message.includes("exceeds balance")
  );
}
