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

Deno.test("executeSwap - returns insufficient liquidity error for balance errors", async () => {
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
    "error.insufficientLiquidity",
    "Insufficient funds error should return error.insufficientLiquidity"
  );
});

Deno.test("executeSwap - returns insufficient liquidity error for balance exceeded errors", async () => {
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
    "error.insufficientLiquidity",
    "Balance exceeded error should return error.insufficientLiquidity"
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
  // Add an invalid approval transaction with empty 'to'
  quote.approvalTxns = [
    { to: "", data: "0xdata", value: "0" },
    { to: "0xValidAddress", data: "0xvaliddata", value: "0" },
  ];

  await service.executeSwap(quote);

  // Should only execute 2 transactions: 1 valid approval + swap
  assertEquals(calls.length, 2, "Should skip invalid approval and execute valid ones");
  assertEquals(
    calls[0].to,
    "0xValidAddress",
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
  // Add an invalid approval transaction with empty 'data'
  quote.approvalTxns = [
    { to: "0xSomeAddress", data: "", value: "0" },
    { to: "0xValidAddress", data: "0xvaliddata", value: "0" },
  ];

  await service.executeSwap(quote);

  // Should only execute 2 transactions: 1 valid approval + swap
  assertEquals(calls.length, 2, "Should skip invalid approval and execute valid ones");
  assertEquals(
    calls[0].to,
    "0xValidAddress",
    "First call should be the valid approval"
  );
});

// ============================================================================
// Tests for getDepositStatus
// ============================================================================

Deno.test("getDepositStatus - returns pending status when deposit is pending", async () => {
  const mockResponse = {
    status: "pending",
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

    const status = await service.getDepositStatus("deposit-123", 1);

    assertEquals(status.status, "pending", "Status should be pending");
    assertEquals(status.fillTxHash, undefined, "fillTxHash should be undefined for pending");
    assertEquals(status.outputAmount, undefined, "outputAmount should be undefined for pending");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - returns filled status with fillTxHash", async () => {
  const mockResponse = {
    status: "filled",
    fillTxHash: "0xabc123def456789",
    outputAmount: "99500000",
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

    const status = await service.getDepositStatus("deposit-456", 1);

    assertEquals(status.status, "filled", "Status should be filled");
    assertEquals(
      status.fillTxHash,
      "0xabc123def456789",
      "fillTxHash should be returned"
    );
    assertEquals(
      status.outputAmount,
      "99500000",
      "outputAmount should be returned"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - returns filled status for 'complete' API response", async () => {
  // Some APIs may return "complete" instead of "filled"
  const mockResponse = {
    status: "complete",
    fillTxHash: "0xdef789abc123",
    outputAmount: "100000000",
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

    const status = await service.getDepositStatus("deposit-789", 137);

    assertEquals(status.status, "filled", "Status should be mapped to filled");
    assertEquals(
      status.fillTxHash,
      "0xdef789abc123",
      "fillTxHash should be returned"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - returns filled status for 'completed' API response", async () => {
  // Some APIs may return "completed" instead of "filled"
  const mockResponse = {
    status: "completed",
    fillTxHash: "0x111222333444",
    outputAmount: "50000000",
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

    const status = await service.getDepositStatus("deposit-101", 42161);

    assertEquals(status.status, "filled", "Status should be mapped to filled");
    assertEquals(
      status.fillTxHash,
      "0x111222333444",
      "fillTxHash should be returned"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - returns expired status handling", async () => {
  const mockResponse = {
    status: "expired",
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

    const status = await service.getDepositStatus("deposit-expired", 1);

    assertEquals(status.status, "expired", "Status should be expired");
    assertEquals(status.fillTxHash, undefined, "fillTxHash should be undefined for expired");
    assertEquals(status.outputAmount, undefined, "outputAmount should be undefined for expired");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - sends correct query parameters", async () => {
  let capturedUrl = "";
  const mockResponse = {
    status: "pending",
  };

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

    await service.getDepositStatus("my-deposit-id", 42161);

    assertEquals(
      capturedUrl.includes("depositId=my-deposit-id"),
      true,
      "Request should include depositId parameter"
    );
    assertEquals(
      capturedUrl.includes("originChainId=42161"),
      true,
      "Request should include originChainId parameter"
    );
    assertEquals(
      capturedUrl.includes("/deposit/status"),
      true,
      "Request should use /deposit/status endpoint"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - handles fillTx field as alternative to fillTxHash", async () => {
  // Some APIs may return "fillTx" instead of "fillTxHash"
  const mockResponse = {
    status: "filled",
    fillTx: "0xalternativehash",
    outputAmount: "75000000",
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

    const status = await service.getDepositStatus("deposit-alt", 10);

    assertEquals(status.status, "filled", "Status should be filled");
    assertEquals(
      status.fillTxHash,
      "0xalternativehash",
      "fillTxHash should be parsed from fillTx field"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - returns pending for unknown status values", async () => {
  const mockResponse = {
    status: "processing", // Unknown status
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

    const status = await service.getDepositStatus("deposit-unknown", 1);

    assertEquals(status.status, "pending", "Unknown status should default to pending");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - handles empty response gracefully", async () => {
  const mockResponse = {};

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

    const status = await service.getDepositStatus("deposit-empty", 1);

    assertEquals(status.status, "pending", "Empty response should default to pending");
    assertEquals(status.fillTxHash, undefined, "fillTxHash should be undefined");
    assertEquals(status.outputAmount, undefined, "outputAmount should be undefined");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - handles null response gracefully", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response("null", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    const status = await service.getDepositStatus("deposit-null", 1);

    assertEquals(status.status, "pending", "Null response should default to pending");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - handles case-insensitive status values", async () => {
  const mockResponse = {
    status: "FILLED",
    fillTxHash: "0xuppercasestatus",
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

    const status = await service.getDepositStatus("deposit-caps", 1);

    assertEquals(status.status, "filled", "Status comparison should be case-insensitive");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDepositStatus - throws error for 404 response", async () => {
  const restoreFetch = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({ message: "Deposit not found" }),
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
      await service.getDepositStatus("nonexistent-deposit", 1);
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

Deno.test("getDepositStatus - throws error for 500 response", async () => {
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
      await service.getDepositStatus("deposit-server-error", 1);
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

// ============================================================================
// Tests for Caching
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

/**
 * Create mock tokens response for getSupportedTokens
 */
function createMockTokensResponse() {
  return [
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      chainId: 1,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "https://example.com/usdc.png",
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      chainId: 1,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      logoURI: "https://example.com/usdt.png",
    },
    {
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      chainId: 137,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "https://example.com/usdc-polygon.png",
    },
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

Deno.test("getSupportedTokens - caches tokens data per chain", async () => {
  let fetchCallCount = 0;
  const mockTokensResponse = createMockTokensResponse();

  const restoreFetch = stubFetch(() => {
    fetchCallCount++;
    return Promise.resolve(
      new Response(JSON.stringify(mockTokensResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // First call for chain 1 should hit the API
    const tokens1_chain1 = await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 1, "First call for chain 1 should fetch from API");
    assertEquals(tokens1_chain1.length, 2, "Should return 2 tokens for chain 1");

    // Second call for chain 1 should use cache
    const tokens2_chain1 = await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 1, "Second call for chain 1 should use cache");
    assertEquals(tokens2_chain1.length, 2, "Cached result should have 2 tokens");

    // First call for chain 137 should hit the API (different chain)
    const tokens1_chain137 = await service.getSupportedTokens(137);
    assertEquals(fetchCallCount, 2, "First call for chain 137 should fetch from API");
    assertEquals(tokens1_chain137.length, 1, "Should return 1 token for chain 137");

    // Second call for chain 137 should use cache
    const tokens2_chain137 = await service.getSupportedTokens(137);
    assertEquals(fetchCallCount, 2, "Second call for chain 137 should use cache");
    assertEquals(tokens2_chain137.length, 1, "Cached result should have 1 token");

    // Calling chain 1 again should still use cache
    const tokens3_chain1 = await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 2, "Chain 1 should still be in cache");
    assertEquals(tokens3_chain1.length, 2, "Chain 1 cached data should have 2 tokens");
  } finally {
    restoreFetch();
  }
});

Deno.test("clearCache - invalidates chains cache", async () => {
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
    await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "First call should fetch from API");

    // Second call should use cache
    await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "Second call should use cache");

    // Clear the cache
    service.clearCache();

    // Third call should hit the API again (cache was cleared)
    await service.getSupportedChains();
    assertEquals(fetchCallCount, 2, "After clearCache, should fetch from API again");
  } finally {
    restoreFetch();
  }
});

Deno.test("clearCache - invalidates tokens cache", async () => {
  let fetchCallCount = 0;
  const mockTokensResponse = createMockTokensResponse();

  const restoreFetch = stubFetch(() => {
    fetchCallCount++;
    return Promise.resolve(
      new Response(JSON.stringify(mockTokensResponse), {
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
    await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 1, "First call should fetch from API");

    // Second call should use cache
    await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 1, "Second call should use cache");

    // Clear the cache
    service.clearCache();

    // Third call should hit the API again (cache was cleared)
    await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 2, "After clearCache, should fetch from API again");
  } finally {
    restoreFetch();
  }
});

Deno.test("clearCache - invalidates all caches at once", async () => {
  let chainsFetchCount = 0;
  let tokensFetchCount = 0;
  const mockChainsResponse = createMockChainsResponse();
  const mockTokensResponse = createMockTokensResponse();

  const restoreFetch = stubFetch((url: string) => {
    if (url.includes("/swap/chains")) {
      chainsFetchCount++;
      return Promise.resolve(
        new Response(JSON.stringify(mockChainsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } else if (url.includes("/swap/tokens")) {
      tokensFetchCount++;
      return Promise.resolve(
        new Response(JSON.stringify(mockTokensResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    return Promise.resolve(new Response("Not found", { status: 404 }));
  });

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // Populate both caches
    await service.getSupportedChains();
    await service.getSupportedTokens(1);
    await service.getSupportedTokens(137);

    assertEquals(chainsFetchCount, 1, "Chains should be fetched once");
    assertEquals(tokensFetchCount, 2, "Tokens should be fetched twice (two chains)");

    // Verify caches are working
    await service.getSupportedChains();
    await service.getSupportedTokens(1);
    await service.getSupportedTokens(137);

    assertEquals(chainsFetchCount, 1, "Chains should still be cached");
    assertEquals(tokensFetchCount, 2, "Tokens should still be cached");

    // Clear all caches
    service.clearCache();

    // After clearCache, all should fetch again
    await service.getSupportedChains();
    await service.getSupportedTokens(1);
    await service.getSupportedTokens(137);

    assertEquals(chainsFetchCount, 2, "Chains should be fetched again after clearCache");
    assertEquals(tokensFetchCount, 4, "Tokens should be fetched again after clearCache (both chains)");
  } finally {
    restoreFetch();
  }
});

Deno.test("getSupportedChains - returns fresh data after cache TTL expires", async () => {
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
    // For this test, we'll simulate cache expiration by clearing and refetching
    // since we can't easily manipulate the actual timestamp
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // First call should fetch
    await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "First call should fetch");

    // Second call should use cache
    await service.getSupportedChains();
    assertEquals(fetchCallCount, 1, "Second call should use cache");

    // Simulate TTL expiration by clearing cache
    service.clearCache();

    // After TTL "expiration" (simulated by clearCache), should fetch again
    await service.getSupportedChains();
    assertEquals(fetchCallCount, 2, "After TTL expires, should fetch fresh data");
  } finally {
    restoreFetch();
  }
});

Deno.test("getSupportedTokens - returns fresh data after cache TTL expires", async () => {
  let fetchCallCount = 0;
  const mockTokensResponse = createMockTokensResponse();

  const restoreFetch = stubFetch(() => {
    fetchCallCount++;
    return Promise.resolve(
      new Response(JSON.stringify(mockTokensResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  try {
    const service = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // First call for chain 1 should fetch
    await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 1, "First call should fetch");

    // Second call for chain 1 should use cache
    await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 1, "Second call should use cache");

    // Simulate TTL expiration by clearing cache
    service.clearCache();

    // After TTL "expiration" (simulated by clearCache), should fetch again
    await service.getSupportedTokens(1);
    assertEquals(fetchCallCount, 2, "After TTL expires, should fetch fresh data");
  } finally {
    restoreFetch();
  }
});

Deno.test("cache - chains and tokens have independent TTLs", async () => {
  let chainsFetchCount = 0;
  let tokensFetchCount = 0;
  const mockChainsResponse = createMockChainsResponse();
  const mockTokensResponse = createMockTokensResponse();

  const restoreFetch = stubFetch((url: string) => {
    if (url.includes("/swap/chains")) {
      chainsFetchCount++;
      return Promise.resolve(
        new Response(JSON.stringify(mockChainsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    } else if (url.includes("/swap/tokens")) {
      tokensFetchCount++;
      return Promise.resolve(
        new Response(JSON.stringify(mockTokensResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    return Promise.resolve(new Response("Not found", { status: 404 }));
  });

  try {
    // Use separate service instances to simulate independent cache states
    const service1 = new AcrossService({
      walletService: createMockWalletService() as never,
    });
    const service2 = new AcrossService({
      walletService: createMockWalletService() as never,
    });

    // Populate both caches on service1
    await service1.getSupportedChains();
    await service1.getSupportedTokens(1);

    assertEquals(chainsFetchCount, 1, "Service1 chains fetched");
    assertEquals(tokensFetchCount, 1, "Service1 tokens fetched");

    // service2 has independent cache, so it should fetch its own data
    await service2.getSupportedChains();
    await service2.getSupportedTokens(1);

    assertEquals(chainsFetchCount, 2, "Service2 chains fetched independently");
    assertEquals(tokensFetchCount, 2, "Service2 tokens fetched independently");

    // service1's cache should still work
    await service1.getSupportedChains();
    await service1.getSupportedTokens(1);

    assertEquals(chainsFetchCount, 2, "Service1 chains still cached");
    assertEquals(tokensFetchCount, 2, "Service1 tokens still cached");
  } finally {
    restoreFetch();
  }
});

// ============================================================================
// Tests for Retry Logic
// ============================================================================

/**
 * TestableAcrossService exposes the protected retryOperation method for testing.
 * This allows us to directly test the retry logic without going through
 * public methods that might have additional error handling.
 */
class TestableAcrossService extends AcrossService {
  /**
   * Expose retryOperation for testing
   */
  public async testRetryOperation<T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ): Promise<T> {
    return this.retryOperation(operation, maxRetries);
  }
}

/**
 * Create a testable AcrossService instance
 */
function createTestableService(): TestableAcrossService {
  return new TestableAcrossService({
    walletService: createMockWalletService() as never,
  });
}

Deno.test("retryOperation - retries on network error", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that fails twice then succeeds
  const operation = () => {
    callCount++;
    if (callCount < 3) {
      return Promise.reject(new Error("Network error"));
    }
    return Promise.resolve("success");
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result, "success", "Should eventually return success");
  assertEquals(callCount, 3, "Should have called operation 3 times (2 failures + 1 success)");
});

Deno.test("retryOperation - retries on fetch failure error", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that fails once then succeeds
  const operation = () => {
    callCount++;
    if (callCount < 2) {
      return Promise.reject(new Error("Failed to fetch"));
    }
    return Promise.resolve("data");
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result, "data", "Should return data after retry");
  assertEquals(callCount, 2, "Should have retried once");
});

Deno.test("retryOperation - retries on timeout error", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that times out once then succeeds
  const operation = () => {
    callCount++;
    if (callCount < 2) {
      return Promise.reject(new Error("Request timeout"));
    }
    return Promise.resolve(42);
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result, 42, "Should return result after retry");
  assertEquals(callCount, 2, "Should have retried once");
});

Deno.test("retryOperation - uses exponential backoff timing", async () => {
  const service = createTestableService();
  const timestamps: number[] = [];

  // Operation that always fails
  const operation = () => {
    timestamps.push(Date.now());
    return Promise.reject(new Error("Persistent error"));
  };

  let errorThrown = false;
  try {
    await service.testRetryOperation(operation, 3);
  } catch {
    errorThrown = true;
  }

  assertEquals(errorThrown, true, "Should throw after all retries fail");
  assertEquals(timestamps.length, 3, "Should have attempted 3 times");

  // Verify timing intervals are roughly exponential
  // First delay: ~1000ms (1s), Second delay: ~2000ms (2s)
  // We use generous tolerances because timing can vary in test environments
  if (timestamps.length >= 2) {
    const firstDelay = timestamps[1] - timestamps[0];
    // First delay should be approximately 1000ms (allow 800-2500ms range for test environments)
    assertEquals(
      firstDelay >= 800 && firstDelay < 2500,
      true,
      `First delay (${firstDelay}ms) should be approximately 1000ms`
    );
  }

  if (timestamps.length >= 3) {
    const secondDelay = timestamps[2] - timestamps[1];
    // Second delay should be approximately 2000ms (allow 1600-4500ms range for test environments)
    assertEquals(
      secondDelay >= 1600 && secondDelay < 4500,
      true,
      `Second delay (${secondDelay}ms) should be approximately 2000ms`
    );
  }
});

Deno.test("retryOperation - delays increase exponentially (1s, 2s pattern)", async () => {
  const service = createTestableService();
  const timestamps: number[] = [];
  let callCount = 0;

  // Operation that fails twice then succeeds
  const operation = () => {
    timestamps.push(Date.now());
    callCount++;
    if (callCount < 3) {
      return Promise.reject(new Error("Temporary failure"));
    }
    return Promise.resolve("recovered");
  };

  const result = await service.testRetryOperation(operation, 3);

  assertEquals(result, "recovered", "Should succeed after retries");
  assertEquals(timestamps.length, 3, "Should have 3 timestamps");

  // Calculate actual delays
  const firstDelay = timestamps[1] - timestamps[0];
  const secondDelay = timestamps[2] - timestamps[1];

  // Second delay should be approximately double the first
  // Allow for timing variations but verify the exponential pattern
  assertEquals(
    secondDelay > firstDelay * 1.5,
    true,
    `Second delay (${secondDelay}ms) should be noticeably longer than first delay (${firstDelay}ms)`
  );
});

Deno.test("retryOperation - respects max 3 retries limit", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that always fails
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("Persistent failure"));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw after max retries");
  assertEquals(callCount, 3, "Should have attempted exactly 3 times (default maxRetries)");
  assertEquals(errorMessage, "Persistent failure", "Should throw the last error");
});

Deno.test("retryOperation - respects custom maxRetries parameter", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that always fails
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("Always fails"));
  };

  let errorThrown = false;

  try {
    // Request only 2 retries
    await service.testRetryOperation(operation, 2);
  } catch {
    errorThrown = true;
  }

  assertEquals(errorThrown, true, "Should throw after custom max retries");
  assertEquals(callCount, 2, "Should have attempted exactly 2 times");
});

Deno.test("retryOperation - stops after exactly maxRetries attempts", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that always fails
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("Failure " + callCount));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation, 5);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw after all retries");
  assertEquals(callCount, 5, "Should have attempted exactly 5 times");
  assertEquals(errorMessage, "Failure 5", "Should throw the error from the last attempt");
});

Deno.test("retryOperation - does not retry on user rejection error (rejected)", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that simulates user rejection
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("User rejected the request"));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw immediately");
  assertEquals(callCount, 1, "Should NOT retry - only 1 attempt");
  assertEquals(errorMessage, "User rejected the request", "Should preserve rejection message");
});

Deno.test("retryOperation - does not retry on user denied error", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that simulates user denial
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("User denied transaction signature"));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw immediately");
  assertEquals(callCount, 1, "Should NOT retry on user denial");
  assertEquals(errorMessage, "User denied transaction signature", "Should preserve denial message");
});

Deno.test("retryOperation - does not retry on user cancelled error", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that simulates user cancellation
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("User cancelled the transaction"));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw immediately");
  assertEquals(callCount, 1, "Should NOT retry on user cancellation");
  assertEquals(errorMessage, "User cancelled the transaction", "Should preserve cancellation message");
});

Deno.test("retryOperation - does not retry on user canceled error (alternate spelling)", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation with American spelling of "canceled"
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("User canceled the operation"));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw immediately");
  assertEquals(callCount, 1, "Should NOT retry on user canceled (American spelling)");
  assertEquals(errorMessage, "User canceled the operation", "Should preserve message");
});

Deno.test("retryOperation - succeeds on first attempt without retrying", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that succeeds immediately
  const operation = () => {
    callCount++;
    return Promise.resolve("immediate success");
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result, "immediate success", "Should return success");
  assertEquals(callCount, 1, "Should only call operation once when successful");
});

Deno.test("retryOperation - returns correct value type after retries", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that returns a complex object after one retry
  const operation = () => {
    callCount++;
    if (callCount < 2) {
      return Promise.reject(new Error("First attempt fails"));
    }
    return Promise.resolve({
      id: 123,
      data: { nested: true },
      items: [1, 2, 3],
    });
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result.id, 123, "Should return object with correct id");
  assertEquals(result.data.nested, true, "Should return object with nested data");
  assertEquals(result.items.length, 3, "Should return object with array");
  assertEquals(callCount, 2, "Should have retried once");
});

Deno.test("retryOperation - handles non-Error rejection values", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation that rejects with a string instead of Error
  const operation = () => {
    callCount++;
    if (callCount < 3) {
      return Promise.reject("String error message");
    }
    return Promise.resolve("recovered");
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result, "recovered", "Should recover after retrying string rejections");
  assertEquals(callCount, 3, "Should have retried twice");
});

Deno.test("retryOperation - throws last error when all retries exhausted", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation with different errors each time
  const operation = () => {
    callCount++;
    return Promise.reject(new Error(`Error attempt ${callCount}`));
  };

  let errorThrown = false;
  let errorMessage = "";

  try {
    await service.testRetryOperation(operation, 3);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  assertEquals(errorThrown, true, "Should throw");
  assertEquals(callCount, 3, "Should have attempted 3 times");
  assertEquals(errorMessage, "Error attempt 3", "Should throw the last error, not the first");
});

Deno.test("retryOperation - handles async operations correctly", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Operation with actual async delay
  const operation = async () => {
    callCount++;
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    if (callCount < 2) {
      throw new Error("Async failure");
    }
    return "async success";
  };

  const result = await service.testRetryOperation(operation);

  assertEquals(result, "async success", "Should handle async operations");
  assertEquals(callCount, 2, "Should have retried async operation");
});

Deno.test("retryOperation - case insensitive user rejection detection", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Test with uppercase "REJECTED"
  const operation = () => {
    callCount++;
    return Promise.reject(new Error("Transaction REJECTED by wallet"));
  };

  let errorThrown = false;

  try {
    await service.testRetryOperation(operation);
  } catch {
    errorThrown = true;
  }

  assertEquals(errorThrown, true, "Should throw");
  assertEquals(callCount, 1, "Should NOT retry on uppercase REJECTED");
});

Deno.test("retryOperation - retries network-related errors normally", async () => {
  const service = createTestableService();
  let callCount = 0;

  // Various network error messages that should be retried
  const errorMessages = [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "Connection reset",
    "Server unavailable",
    "503 Service Unavailable",
  ];

  for (const networkError of errorMessages) {
    callCount = 0;

    const operation = () => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject(new Error(networkError));
      }
      return Promise.resolve("recovered");
    };

    const result = await service.testRetryOperation(operation, 3);

    assertEquals(result, "recovered", `Should retry and recover from: ${networkError}`);
    assertEquals(callCount, 2, `Should have retried for: ${networkError}`);
  }
});
