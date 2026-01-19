/**
 * Unit tests for AcrossService
 *
 * This file contains tests for the AcrossService class which handles
 * cross-chain swaps via Across Protocol API.
 */

import { assertEquals } from "@std/assert";
import { AcrossService } from "./AcrossService.ts";

// ============================================================================
// Tests for isSameTokenTransfer
// ============================================================================

Deno.test("isSameTokenTransfer - returns true for same USDC on Polygon", () => {
  const result = AcrossService.isSameTokenTransfer(
    137, // Polygon
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC on Polygon
    137, // Polygon
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // USDC on Polygon
  );

  assertEquals(result, true, "Same USDC on Polygon should be a direct transfer");
});

Deno.test("isSameTokenTransfer - returns false for different chains", () => {
  const result = AcrossService.isSameTokenTransfer(
    1, // Ethereum
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
    137, // Polygon
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // USDC on Polygon
  );

  assertEquals(result, false, "Different chains should not be a direct transfer");
});

Deno.test("isSameTokenTransfer - returns false for different tokens on same chain", () => {
  const result = AcrossService.isSameTokenTransfer(
    137, // Polygon
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
    137, // Polygon
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // USDC on Polygon
  );

  assertEquals(result, false, "Different tokens on same chain should not be a direct transfer");
});

Deno.test("isSameTokenTransfer - handles case-insensitive address comparison", () => {
  // Lowercase address
  const result1 = AcrossService.isSameTokenTransfer(
    137,
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // lowercase
    137,
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // mixed case
  );

  assertEquals(result1, true, "Case-insensitive comparison should match lowercase to mixed case");

  // Uppercase address
  const result2 = AcrossService.isSameTokenTransfer(
    137,
    "0x3C499C542CEF5E3811E1192CE70D8CC03D5C3359", // uppercase
    137,
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // mixed case
  );

  assertEquals(result2, true, "Case-insensitive comparison should match uppercase to mixed case");
});

Deno.test("isSameTokenTransfer - returns true for native token variations (0x0...0 to 0xEEE...EEE)", () => {
  // Zero address to EEE address on same chain
  const result = AcrossService.isSameTokenTransfer(
    1, // Ethereum
    "0x0000000000000000000000000000000000000000", // Native ETH (zero address)
    1, // Ethereum
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" // Native ETH (EEE address)
  );

  assertEquals(result, true, "Both native token representations should match on same chain");
});

Deno.test("isSameTokenTransfer - returns true for native token variations (0xEEE...EEE to 0x0...0)", () => {
  // EEE address to zero address on same chain
  const result = AcrossService.isSameTokenTransfer(
    1, // Ethereum
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Native ETH (EEE address)
    1, // Ethereum
    "0x0000000000000000000000000000000000000000" // Native ETH (zero address)
  );

  assertEquals(result, true, "Both native token representations should match on same chain (reversed)");
});

Deno.test("isSameTokenTransfer - returns true for same native token (zero address)", () => {
  const result = AcrossService.isSameTokenTransfer(
    1, // Ethereum
    "0x0000000000000000000000000000000000000000",
    1, // Ethereum
    "0x0000000000000000000000000000000000000000"
  );

  assertEquals(result, true, "Same zero address native token should match");
});

Deno.test("isSameTokenTransfer - returns true for same native token (EEE address)", () => {
  const result = AcrossService.isSameTokenTransfer(
    137, // Polygon
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    137, // Polygon
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  );

  assertEquals(result, true, "Same EEE address native token should match");
});

Deno.test("isSameTokenTransfer - returns false for native tokens on different chains", () => {
  const result = AcrossService.isSameTokenTransfer(
    1, // Ethereum
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Native ETH
    137, // Polygon
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" // Native MATIC
  );

  assertEquals(result, false, "Native tokens on different chains should not match");
});

Deno.test("isSameTokenTransfer - returns false for native token vs ERC20 on same chain", () => {
  const result = AcrossService.isSameTokenTransfer(
    137, // Polygon
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Native MATIC
    137, // Polygon
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // USDC
  );

  assertEquals(result, false, "Native token and ERC20 token should not match");
});

Deno.test("isSameTokenTransfer - handles mixed case native token addresses", () => {
  const result = AcrossService.isSameTokenTransfer(
    1,
    "0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE", // uppercase EEE
    1,
    "0x0000000000000000000000000000000000000000" // zero address
  );

  assertEquals(result, true, "Native token comparison should be case-insensitive");
});

// ============================================================================
// Tests for getQuote
// ============================================================================

/**
 * Mock WalletService for testing
 */
const createMockWalletService = () => ({
  sendTransaction: () => Promise.resolve("0xmockhash"),
  getAccount: () => null,
  connect: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
  getBalance: () => Promise.resolve(BigInt(0)),
});

/**
 * Mock successful quote response from Across API
 */
const createMockQuoteResponse = () => ({
  expectedOutputAmount: "99500000",
  minOutputAmount: "99000000",
  inputAmount: "100000000",
  expectedFillTime: 120,
  id: "deposit-123",
  fees: {
    total: { amountUsd: "0.50" },
    relayerCapital: { amountUsd: "0.30" },
    lpFee: { amountUsd: "0.20" },
  },
  swapTx: {
    to: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
    data: "0x1234567890abcdef",
    value: "0",
    gas: "250000",
  },
  approvalTxns: [
    {
      to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      data: "0xapprovaldata",
      value: "0",
    },
  ],
});

/**
 * Helper to stub global fetch for testing
 */
function stubFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response>
): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

Deno.test("getQuote - returns quote with expected fields", async () => {
  const mockResponse = createMockQuoteResponse();
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    const quote = await service.getQuote({
      originChainId: 1,
      inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      inputAmount: "100000000",
      depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    });

    // Verify expected output amount
    assertEquals(
      quote.expectedOutputAmount,
      "99500000",
      "Quote should have expectedOutputAmount"
    );

    // Verify minimum output amount
    assertEquals(
      quote.minOutputAmount,
      "99000000",
      "Quote should have minOutputAmount"
    );

    // Verify expected fill time
    assertEquals(
      quote.expectedFillTime,
      120,
      "Quote should have expectedFillTime"
    );

    // Verify input amount
    assertEquals(
      quote.inputAmount,
      "100000000",
      "Quote should have inputAmount"
    );

    // Verify fees structure
    assertEquals(
      quote.fees.totalFeeUsd,
      "0.50",
      "Quote should have fees.totalFeeUsd"
    );

    // Verify swap transaction data
    assertEquals(
      quote.swapTx.to,
      "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
      "Quote should have swapTx.to"
    );
    assertEquals(
      quote.swapTx.data,
      "0x1234567890abcdef",
      "Quote should have swapTx.data"
    );

    // Verify approval transactions
    assertEquals(
      quote.approvalTxns.length,
      1,
      "Quote should have approvalTxns"
    );

    // Verify deposit ID
    assertEquals(
      quote.depositId,
      "deposit-123",
      "Quote should have depositId"
    );

    // Verify chain IDs
    assertEquals(
      quote.originChainId,
      1,
      "Quote should have originChainId"
    );
    assertEquals(
      quote.destinationChainId,
      137,
      "Quote should have destinationChainId set to Polygon"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - destination is always Polygon (chainId 137) with USDC", async () => {
  let capturedUrl = "";
  const mockResponse = createMockQuoteResponse();
  const restoreFetch = stubFetch((url: string) => {
    capturedUrl = url;
    return Promise.resolve(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // Request quote from Ethereum (chainId 1)
    await service.getQuote({
      originChainId: 1,
      inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      inputAmount: "100000000",
      depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    });

    // Verify destination chain ID is always Polygon (137)
    assertEquals(
      capturedUrl.includes("destinationChainId=137"),
      true,
      "Request should always include destinationChainId=137"
    );

    // Verify output token is always Polygon USDC
    assertEquals(
      capturedUrl.includes(
        `outputToken=${AcrossService.POLYGON_USDC}`
      ),
      true,
      "Request should always include outputToken set to Polygon USDC"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - destination chain ID is 137 regardless of origin chain", async () => {
  const capturedUrls: string[] = [];
  const mockResponse = createMockQuoteResponse();
  const restoreFetch = stubFetch((url: string) => {
    capturedUrls.push(url);
    return Promise.resolve(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // Test with different origin chains
    const originChains = [1, 42161, 10, 8453]; // Ethereum, Arbitrum, Optimism, Base

    for (const chainId of originChains) {
      await service.getQuote({
        originChainId: chainId,
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "100000000",
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    }

    // Verify all requests have destinationChainId=137
    for (let i = 0; i < capturedUrls.length; i++) {
      assertEquals(
        capturedUrls[i].includes("destinationChainId=137"),
        true,
        `Request from chain ${originChains[i]} should have destinationChainId=137`
      );
    }
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws error for unsupported chain (400 response)", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Unsupported chain" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 999999, // Unsupported chain
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "100000000",
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for unsupported chain");
    assertEquals(
      errorMessage,
      "error.unsupportedNetwork",
      "Error should be error.unsupportedNetwork"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws error for unsupported token", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Token not supported" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 1,
        inputToken: "0x0000000000000000000000000000000000000001", // Unsupported token
        inputAmount: "100000000",
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for unsupported token");
    assertEquals(
      errorMessage,
      "error.unsupportedToken",
      "Error should be error.unsupportedToken"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws invalidParams error for 400 without specific error", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Bad request" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 1,
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "-100", // Invalid amount
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for invalid params");
    assertEquals(
      errorMessage,
      "error.invalidParams",
      "Error should be error.invalidParams for generic 400"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws routeNotFound error for 404 response", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Route not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 1,
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "100000000",
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for 404");
    assertEquals(
      errorMessage,
      "error.routeNotFound",
      "Error should be error.routeNotFound for 404"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws serverUnavailable error for 500 response", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 1,
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "100000000",
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for 500");
    assertEquals(
      errorMessage,
      "error.serverUnavailable",
      "Error should be error.serverUnavailable for 500"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws insufficientLiquidity error when API returns liquidity error", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Insufficient liquidity for this swap" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 1,
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "999999999999999999999", // Very large amount
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for insufficient liquidity");
    assertEquals(
      errorMessage,
      "error.insufficientLiquidity",
      "Error should be error.insufficientLiquidity"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - throws slippageTooHigh error when API returns slippage error", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Slippage too high for this trade" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    let errorThrown = false;
    let errorMessage = "";

    try {
      await service.getQuote({
        originChainId: 1,
        inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        inputAmount: "100000000",
        depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    assertEquals(errorThrown, true, "Should throw an error for slippage too high");
    assertEquals(
      errorMessage,
      "error.slippageTooHigh",
      "Error should be error.slippageTooHigh"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getQuote - handles missing fields in response gracefully", async () => {
  // Response with minimal/missing fields
  const mockResponse = {
    swapTx: {
      to: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
      data: "0x1234",
      value: "0",
    },
  };

  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    const quote = await service.getQuote({
      originChainId: 1,
      inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      inputAmount: "100000000",
      depositor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    });

    // Should have default values for missing fields
    assertEquals(
      quote.expectedOutputAmount,
      "0",
      "Missing expectedOutputAmount should default to 0"
    );
    assertEquals(
      quote.minOutputAmount,
      "0",
      "Missing minOutputAmount should default to 0"
    );
    assertEquals(
      quote.expectedFillTime,
      0,
      "Missing expectedFillTime should default to 0"
    );
    assertEquals(
      quote.fees.totalFeeUsd,
      "0",
      "Missing fees should default to 0"
    );
    assertEquals(
      Array.isArray(quote.approvalTxns),
      true,
      "approvalTxns should be an array"
    );
    assertEquals(
      quote.approvalTxns.length,
      0,
      "Missing approvalTxns should be empty array"
    );
  } finally {
    restoreFetch();
  }
});

// ============================================================================
// Tests for executeSwap
// ============================================================================

/**
 * Create a mock quote for executeSwap tests
 */
function createMockQuote(options?: {
  withApproval?: boolean;
  approvalCount?: number;
}): import("./AcrossService.ts").AcrossQuote {
  const approvalTxns = options?.withApproval
    ? Array.from({ length: options.approvalCount ?? 1 }, (_, i) => ({
        to: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE360${i}eB48`,
        data: `0x095ea7b3${i}`,
        value: "0",
      }))
    : [];

  return {
    expectedOutputAmount: "99500000",
    minOutputAmount: "99000000",
    inputAmount: "100000000",
    expectedFillTime: 120,
    fees: {
      totalFeeUsd: "0.50",
      bridgeFeeUsd: "0.30",
      swapFeeUsd: "0.20",
    },
    swapTx: {
      to: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
      data: "0x1234567890abcdef",
      value: "0",
      gas: "250000",
    },
    approvalTxns,
    depositId: "deposit-123",
    originChainId: 1,
    destinationChainId: 137,
  };
}

/**
 * Create a mock WalletService with tracking for sendTransaction calls
 */
function createTrackingWalletService() {
  const calls: Array<{
    to: string;
    data: string;
    value: bigint;
    gas?: bigint;
  }> = [];

  return {
    calls,
    walletService: {
      sendTransaction: (tx: {
        to: string;
        data: string;
        value: bigint;
        gas?: bigint;
      }) => {
        calls.push(tx);
        return Promise.resolve("0xmocktxhash");
      },
      getAccount: () => null,
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      getBalance: () => Promise.resolve(BigInt(0)),
    },
  };
}

Deno.test("executeSwap - executes approval transaction first when needed", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: true });

  await service.executeSwap(quote);

  // Should have called sendTransaction twice: once for approval, once for swap
  assertEquals(calls.length, 2, "Should call sendTransaction twice");

  // First call should be the approval transaction
  assertEquals(
    calls[0].to,
    quote.approvalTxns[0].to,
    "First transaction should be approval"
  );
  assertEquals(
    calls[0].data,
    quote.approvalTxns[0].data,
    "Approval transaction should have correct data"
  );

  // Second call should be the swap transaction
  assertEquals(
    calls[1].to,
    quote.swapTx.to,
    "Second transaction should be swap"
  );
  assertEquals(
    calls[1].data,
    quote.swapTx.data,
    "Swap transaction should have correct data"
  );
});

Deno.test("executeSwap - executes multiple approval transactions in order", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: true, approvalCount: 3 });

  await service.executeSwap(quote);

  // Should have called sendTransaction 4 times: 3 approvals + 1 swap
  assertEquals(calls.length, 4, "Should call sendTransaction 4 times");

  // First 3 calls should be approval transactions in order
  for (let i = 0; i < 3; i++) {
    assertEquals(
      calls[i].to,
      quote.approvalTxns[i].to,
      `Transaction ${i + 1} should be approval ${i + 1}`
    );
  }

  // Last call should be the swap transaction
  assertEquals(
    calls[3].to,
    quote.swapTx.to,
    "Last transaction should be swap"
  );
});

Deno.test("executeSwap - skips approval when not needed", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  await service.executeSwap(quote);

  // Should have called sendTransaction only once for the swap
  assertEquals(calls.length, 1, "Should call sendTransaction only once");

  // The call should be the swap transaction
  assertEquals(
    calls[0].to,
    quote.swapTx.to,
    "The only transaction should be swap"
  );
  assertEquals(
    calls[0].data,
    quote.swapTx.data,
    "Swap transaction should have correct data"
  );
});

Deno.test("executeSwap - skips approval with empty approvalTxns array", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote();
  quote.approvalTxns = []; // Explicitly empty array

  await service.executeSwap(quote);

  assertEquals(calls.length, 1, "Should call sendTransaction only once");
  assertEquals(
    calls[0].to,
    quote.swapTx.to,
    "The only transaction should be swap"
  );
});

Deno.test("executeSwap - returns user rejection error when user rejects transaction", async () => {
  const walletService = {
    sendTransaction: () =>
      Promise.reject(new Error("User rejected the request")),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.transactionRejected",
    "Error should be error.transactionRejected"
  );
});

Deno.test("executeSwap - returns user rejection error with 'denied' pattern", async () => {
  const walletService = {
    sendTransaction: () =>
      Promise.reject(new Error("User denied transaction signature")),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.transactionRejected",
    "Error should be error.transactionRejected for user denied"
  );
});

Deno.test("executeSwap - returns user rejection error with 'cancelled' pattern", async () => {
  const walletService = {
    sendTransaction: () =>
      Promise.reject(new Error("User cancelled the transaction")),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.transactionRejected",
    "Error should be error.transactionRejected for user cancelled"
  );
});

Deno.test("executeSwap - returns user rejection error when approval is rejected", async () => {
  let callCount = 0;
  const walletService = {
    sendTransaction: () => {
      callCount++;
      // First call (approval) is rejected
      return Promise.reject(new Error("User rejected the request"));
    },
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: true });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.transactionRejected",
    "Error should be error.transactionRejected when approval is rejected"
  );
  assertEquals(callCount, 1, "Should stop after first rejection");
});

Deno.test("executeSwap - returns descriptive error for transaction failure", async () => {
  const walletService = {
    sendTransaction: () =>
      Promise.reject(new Error("Transaction failed: execution reverted")),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.networkConnection",
    "Generic transaction failure should return error.networkConnection"
  );
});

Deno.test("executeSwap - returns insufficientFunds error for balance errors", async () => {
  const walletService = {
    sendTransaction: () =>
      Promise.reject(new Error("Insufficient funds for transfer")),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.insufficientFunds",
    "Insufficient funds error should return error.insufficientFunds"
  );
});

Deno.test("executeSwap - returns insufficientFunds error for balance exceeded errors", async () => {
  const walletService = {
    sendTransaction: () =>
      Promise.reject(new Error("Transfer amount exceeds balance")),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(quote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error");
  assertEquals(
    errorMessage,
    "error.insufficientFunds",
    "Balance exceeded error should return error.insufficientFunds"
  );
});

Deno.test("executeSwap - throws error for invalid quote (missing swapTx)", async () => {
  const { walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const invalidQuote = createMockQuote();
  // @ts-ignore - Testing invalid input
  invalidQuote.swapTx = null;

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(invalidQuote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error for invalid quote");
  assertEquals(
    errorMessage,
    "error.invalidParams",
    "Should return error.invalidParams for missing swapTx"
  );
});

Deno.test("executeSwap - throws error for invalid quote (missing swapTx.to)", async () => {
  const { walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const invalidQuote = createMockQuote();
  invalidQuote.swapTx.to = "";

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(invalidQuote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error for invalid quote");
  assertEquals(
    errorMessage,
    "error.invalidParams",
    "Should return error.invalidParams for empty swapTx.to"
  );
});

Deno.test("executeSwap - throws error for invalid quote (missing swapTx.data)", async () => {
  const { walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const invalidQuote = createMockQuote();
  invalidQuote.swapTx.data = "";

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.executeSwap(invalidQuote);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw an error for invalid quote");
  assertEquals(
    errorMessage,
    "error.invalidParams",
    "Should return error.invalidParams for empty swapTx.data"
  );
});

Deno.test("executeSwap - returns transaction hash on success", async () => {
  const expectedHash = "0xabc123def456";
  const walletService = {
    sendTransaction: () => Promise.resolve(expectedHash),
    getAccount: () => null,
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    getBalance: () => Promise.resolve(BigInt(0)),
  };

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });

  const result = await service.executeSwap(quote);

  assertEquals(result, expectedHash, "Should return the transaction hash");
});

Deno.test("executeSwap - passes correct value and gas to sendTransaction", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });
  quote.swapTx.value = "1000000000000000000"; // 1 ETH
  quote.swapTx.gas = "300000";

  await service.executeSwap(quote);

  assertEquals(
    calls[0].value,
    BigInt("1000000000000000000"),
    "Should pass value as BigInt"
  );
  assertEquals(
    calls[0].gas,
    BigInt("300000"),
    "Should pass gas as BigInt"
  );
});

Deno.test("executeSwap - handles zero value correctly", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: false });
  quote.swapTx.value = "0";

  await service.executeSwap(quote);

  assertEquals(
    calls[0].value,
    BigInt(0),
    "Should handle zero value correctly"
  );
});

Deno.test("executeSwap - skips invalid approval transactions (missing to)", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: true });
  // Add an invalid approval transaction with empty 'to' and a valid one with proper hex addresses
  quote.approvalTxns = [
    { to: "", data: "0xabcdef", value: "0" },
    { to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", data: "0x095ea7b3", value: "0" },
  ];

  await service.executeSwap(quote);

  // Should only execute 2 transactions: 1 valid approval + swap
  assertEquals(calls.length, 2, "Should skip invalid approval and execute valid ones");
  assertEquals(
    calls[0].to,
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "First call should be the valid approval"
  );
  assertEquals(
    calls[1].to,
    quote.swapTx.to,
    "Second call should be the swap"
  );
});

Deno.test("executeSwap - skips invalid approval transactions (missing data)", async () => {
  const { calls, walletService } = createTrackingWalletService();

  const service = new AcrossService({
    walletService: walletService as never,
  });

  const quote = createMockQuote({ withApproval: true });
  // Add an invalid approval transaction with empty 'data' and a valid one with proper hex addresses
  quote.approvalTxns = [
    { to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", data: "", value: "0" },
    { to: "0xdAC17F958D2ee523a2206206994597C13D831ec7", data: "0x095ea7b3", value: "0" },
  ];

  await service.executeSwap(quote);

  // Should only execute 2 transactions: 1 valid approval + swap
  assertEquals(calls.length, 2, "Should skip invalid approval and execute valid ones");
  assertEquals(
    calls[0].to,
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "First call should be the valid approval"
  );
});

// ============================================================================
// Tests for Caching (getSupportedChains only - chains cache exists)
// ============================================================================

/**
 * Create mock chains response for getSupportedChains
 */
function createMockChainsResponse() {
  return [
    { chainId: 1, name: "Ethereum", logoURI: "https://example.com/eth.png" },
    { chainId: 137, name: "Polygon", logoURI: "https://example.com/polygon.png" },
    { chainId: 42161, name: "Arbitrum", logoURI: "https://example.com/arb.png" },
  ];
}

Deno.test("getSupportedChains - caches chains data", async () => {
  let fetchCallCount = 0;
  const mockChainsResponse = createMockChainsResponse();

  const restoreFetch = stubFetch(() => {
    fetchCallCount++;
    return Promise.resolve(
      new Response(JSON.stringify(mockChainsResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // First call should hit the API
    const chains1 = await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "First call should fetch from API");
    assertEquals(chains1.length, 3, "Should return 3 chains");

    // Second call should use cache (no new API call)
    const chains2 = await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "Second call should use cache, not fetch");
    assertEquals(chains2.length, 3, "Cached result should have 3 chains");

    // Third call should still use cache
    const chains3 = await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "Third call should still use cache");
    assertEquals(chains3.length, 3, "Cached result should still have 3 chains");

    // Verify the cached data matches
    assertEquals(chains1[0].chainId, chains2[0].chainId, "Cached data should match");
    assertEquals(chains2[0].chainId, chains3[0].chainId, "All cached data should match");
  } finally {
    restoreFetch();
  }
});

Deno.test("cache - independent cache per service instance", async () => {
  let chainsFetchCount = 0;
  const mockChainsResponse = createMockChainsResponse();

  const restoreFetch = stubFetch(() => {
    chainsFetchCount++;
    return Promise.resolve(
      new Response(JSON.stringify(mockChainsResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  try {
    // Use separate service instances to simulate independent cache states
    const service1 = new AcrossService({
      walletService: createMockWalletService() as never,
    });
    const service2 = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // Populate cache on service1
    await service1.getSupportedChains();
    assertEquals(chainsFetchCount, 1, "Service1 chains fetched");

    // service2 has independent cache, so it should fetch its own data
    await service2.getSupportedChains();
    assertEquals(chainsFetchCount, 2, "Service2 chains fetched independently");

    // service1's cache should still work
    await service1.getSupportedChains();
    assertEquals(chainsFetchCount, 2, "Service1 chains still cached");
  } finally {
    restoreFetch();
  }
});
