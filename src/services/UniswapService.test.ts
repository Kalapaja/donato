/**
 * Unit tests for UniswapService
 *
 * This file contains tests for the UniswapService class which handles
 * same-chain swaps via Uniswap V3 on Polygon.
 */

import { assertEquals } from "@std/assert";
import { UniswapService } from "./UniswapService.ts";

// ============================================================================
// Tests for isSameChainSwap
// ============================================================================

Deno.test("isSameChainSwap - Polygon with non-USDC returns true", () => {
  const result = UniswapService.isSameChainSwap(
    137,
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" // WETH on Polygon
  );
  assertEquals(result, true);
});

Deno.test("isSameChainSwap - Polygon with USDC returns false", () => {
  const result = UniswapService.isSameChainSwap(
    137,
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" // USDC on Polygon
  );
  assertEquals(result, false);
});

Deno.test("isSameChainSwap - non-Polygon chain returns false", () => {
  const result = UniswapService.isSameChainSwap(
    1, // Ethereum
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  );
  assertEquals(result, false);
});

Deno.test("isSameChainSwap - case insensitive address comparison", () => {
  const result = UniswapService.isSameChainSwap(
    137,
    "0x3C499C542CEF5E3811E1192CE70D8CC03D5C3359" // USDC uppercase
  );
  assertEquals(result, false);
});

// ============================================================================
// Tests for detectUniswapError
// ============================================================================

Deno.test("detectUniswapError - detects no pool error", () => {
  assertEquals(
    UniswapService.detectUniswapError("No pool found for token pair"),
    "error.uniswapNoPool"
  );
  assertEquals(
    UniswapService.detectUniswapError("Pool does not exist"),
    "error.uniswapNoPool"
  );
  assertEquals(
    UniswapService.detectUniswapError("Insufficient liquidity"),
    "error.uniswapNoPool"
  );
});

Deno.test("detectUniswapError - detects slippage error", () => {
  assertEquals(
    UniswapService.detectUniswapError("Slippage tolerance exceeded"),
    "error.uniswapSlippage"
  );
  assertEquals(
    UniswapService.detectUniswapError("Price impact too high"),
    "error.uniswapSlippage"
  );
  assertEquals(
    UniswapService.detectUniswapError("Too little received"),
    "error.uniswapSlippage"
  );
});

Deno.test("detectUniswapError - detects swap failed error", () => {
  assertEquals(
    UniswapService.detectUniswapError("Swap failed"),
    "error.uniswapSwapFailed"
  );
  assertEquals(
    UniswapService.detectUniswapError("Execution reverted"),
    "error.uniswapSwapFailed"
  );
});

Deno.test("detectUniswapError - returns null for unknown errors", () => {
  assertEquals(
    UniswapService.detectUniswapError("Some random error"),
    null
  );
  assertEquals(
    UniswapService.detectUniswapError("Network timeout"),
    null
  );
});

Deno.test("detectUniswapError - case insensitive matching", () => {
  assertEquals(
    UniswapService.detectUniswapError("NO POOL FOUND"),
    "error.uniswapNoPool"
  );
  assertEquals(
    UniswapService.detectUniswapError("SLIPPAGE exceeded"),
    "error.uniswapSlippage"
  );
});
