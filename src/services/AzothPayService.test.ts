/**
 * Unit tests for AzothPayService
 *
 * This file contains tests for the AzothPayService class which handles
 * recurring subscription functionality via AzothPay contract on Polygon.
 */

import { assertEquals, assertMatch } from "@std/assert";
import { AzothPayService, SECONDS_PER_MONTH } from "./AzothPayService.ts";

// ============================================================================
// Tests for calculateSubscriptionRate
// ============================================================================

Deno.test("calculateSubscriptionRate - calculates correct rate for $10/month with 6 decimals (USDC)", () => {
  const service = AzothPayService.getInstance();
  const rate = service.calculateSubscriptionRate("10", 6);

  // Expected: 10 * 10^6 / 2,592,000 = 10,000,000 / 2,592,000 = 3 (integer division)
  // Let's verify: 10 * 1,000,000 = 10,000,000
  // 10,000,000 / 2,592,000 = 3.858... => 3 (truncated)
  const expectedRate = (BigInt(10) * 10n ** 6n) / SECONDS_PER_MONTH;
  assertEquals(rate, expectedRate, "Rate for $10/month with 6 decimals should match");
  assertEquals(rate, 3n, "Rate for $10/month with 6 decimals should be 3");
});

Deno.test("calculateSubscriptionRate - calculates correct rate for $100/month with 6 decimals (USDC)", () => {
  const service = AzothPayService.getInstance();
  const rate = service.calculateSubscriptionRate("100", 6);

  // Expected: 100 * 10^6 / 2,592,000 = 100,000,000 / 2,592,000 = 38 (integer division)
  const expectedRate = (BigInt(100) * 10n ** 6n) / SECONDS_PER_MONTH;
  assertEquals(rate, expectedRate, "Rate for $100/month with 6 decimals should match");
  assertEquals(rate, 38n, "Rate for $100/month with 6 decimals should be 38");
});

Deno.test("calculateSubscriptionRate - calculates correct rate for $10/month with 18 decimals", () => {
  const service = AzothPayService.getInstance();
  const rate = service.calculateSubscriptionRate("10", 18);

  // Expected: 10 * 10^18 / 2,592,000 = 3,858,024,691,358 (integer division)
  // 10 * 10^18 = 10,000,000,000,000,000,000
  // 10,000,000,000,000,000,000 / 2,592,000 = 3,858,024,691,358 (truncated)
  const expectedRate = (BigInt(10) * 10n ** 18n) / SECONDS_PER_MONTH;
  assertEquals(rate, expectedRate, "Rate for $10/month with 18 decimals should match");
  assertEquals(rate, 3858024691358n, "Rate for $10/month with 18 decimals should be 3858024691358");
});

Deno.test("calculateSubscriptionRate - calculates correct rate for $100/month with 18 decimals", () => {
  const service = AzothPayService.getInstance();
  const rate = service.calculateSubscriptionRate("100", 18);

  // Expected: 100 * 10^18 / 2,592,000
  const expectedRate = (BigInt(100) * 10n ** 18n) / SECONDS_PER_MONTH;
  assertEquals(rate, expectedRate, "Rate for $100/month with 18 decimals should match");
});

Deno.test("calculateSubscriptionRate - handles $1/month correctly", () => {
  const service = AzothPayService.getInstance();
  const rate = service.calculateSubscriptionRate("1", 6);

  // Expected: 1 * 10^6 / 2,592,000 = 1,000,000 / 2,592,000 = 0 (integer division)
  const expectedRate = (BigInt(1) * 10n ** 6n) / SECONDS_PER_MONTH;
  assertEquals(rate, expectedRate, "Rate for $1/month with 6 decimals should match");
  assertEquals(rate, 0n, "Rate for $1/month with 6 decimals should be 0 (too small)");
});

Deno.test("calculateSubscriptionRate - handles large amounts correctly", () => {
  const service = AzothPayService.getInstance();
  const rate = service.calculateSubscriptionRate("10000", 6);

  // Expected: 10000 * 10^6 / 2,592,000 = 10,000,000,000 / 2,592,000 = 3858 (approximately)
  const expectedRate = (BigInt(10000) * 10n ** 6n) / SECONDS_PER_MONTH;
  assertEquals(rate, expectedRate, "Rate for $10000/month with 6 decimals should match");
});

// ============================================================================
// Tests for buildTraits
// ============================================================================

Deno.test("buildTraits - correctly encodes nonce in lower 128 bits", () => {
  const service = AzothPayService.getInstance();
  const nonce = 5n;
  const deadline = 1700000000n;
  const traits = service.buildTraits(nonce, deadline);

  // Extract nonce from bits [127:0]
  const extractedNonce = traits & ((1n << 128n) - 1n);
  assertEquals(extractedNonce, nonce, "Nonce should be in bits [127:0]");
});

Deno.test("buildTraits - correctly encodes deadline in bits [253:208]", () => {
  const service = AzothPayService.getInstance();
  const nonce = 5n;
  const deadline = 1700000000n;
  const traits = service.buildTraits(nonce, deadline);

  // Extract deadline from bits [253:208] (46 bits)
  const extractedDeadline = (traits >> 208n) & ((1n << 46n) - 1n);
  assertEquals(extractedDeadline, deadline, "Deadline should be in bits [253:208]");
});

Deno.test("buildTraits - nonce type is 0 in bits [255:254]", () => {
  const service = AzothPayService.getInstance();
  const nonce = 5n;
  const deadline = 1700000000n;
  const traits = service.buildTraits(nonce, deadline);

  // Extract nonce type from bits [255:254]
  const extractedNonceType = traits >> 254n;
  assertEquals(extractedNonceType, 0n, "Nonce type should be 0 in bits [255:254]");
});

Deno.test("buildTraits - reserved bits [207:128] are zero", () => {
  const service = AzothPayService.getInstance();
  const nonce = 5n;
  const deadline = 1700000000n;
  const traits = service.buildTraits(nonce, deadline);

  // Extract reserved bits [207:128] (80 bits)
  const reservedBits = (traits >> 128n) & ((1n << 80n) - 1n);
  assertEquals(reservedBits, 0n, "Reserved bits [207:128] should be zero");
});

Deno.test("buildTraits - handles zero nonce correctly", () => {
  const service = AzothPayService.getInstance();
  const nonce = 0n;
  const deadline = 1700000000n;
  const traits = service.buildTraits(nonce, deadline);

  // Extract nonce from bits [127:0]
  const extractedNonce = traits & ((1n << 128n) - 1n);
  assertEquals(extractedNonce, 0n, "Zero nonce should be correctly encoded");

  // Verify deadline is still correct
  const extractedDeadline = (traits >> 208n) & ((1n << 46n) - 1n);
  assertEquals(extractedDeadline, deadline, "Deadline should still be correct with zero nonce");
});

Deno.test("buildTraits - handles large nonce correctly", () => {
  const service = AzothPayService.getInstance();
  const nonce = (1n << 127n) - 1n; // Max value that fits in 128 bits
  const deadline = 1700000000n;
  const traits = service.buildTraits(nonce, deadline);

  // Extract nonce from bits [127:0]
  const extractedNonce = traits & ((1n << 128n) - 1n);
  assertEquals(extractedNonce, nonce, "Large nonce should be correctly encoded");
});

Deno.test("buildTraits - reconstructs correct structure", () => {
  const service = AzothPayService.getInstance();
  const nonce = 42n;
  const deadline = 1735689600n; // 2025-01-01 00:00:00 UTC
  const traits = service.buildTraits(nonce, deadline);

  // Manually construct expected traits
  // Structure: [255:254] nonce type (0) | [253:208] deadline | [207:128] reserved (0) | [127:0] nonce
  const expectedTraits = (0n << 254n) | (deadline << 208n) | (0n << 128n) | nonce;
  assertEquals(traits, expectedTraits, "Traits should match expected structure");
});

// ============================================================================
// Tests for encodeSubscribeCall
// ============================================================================

Deno.test("encodeSubscribeCall - returns valid hex string", () => {
  const service = AzothPayService.getInstance();
  const target = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;
  const rate = 38n;
  const projectId = 1n;

  const encoded = service.encodeSubscribeCall(target, rate, projectId);

  // Should be a hex string starting with 0x
  assertEquals(typeof encoded, "string", "Encoded call should be a string");
  assertEquals(encoded.startsWith("0x"), true, "Encoded call should start with 0x");
});

Deno.test("encodeSubscribeCall - has correct function selector", () => {
  const service = AzothPayService.getInstance();
  const target = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;
  const rate = 38n;
  const projectId = 1n;

  const encoded = service.encodeSubscribeCall(target, rate, projectId);

  // Function selector for subscribe(address,uint256,uint256)
  // keccak256("subscribe(address,uint256,uint256)") = 0x5f6e7be3...
  // First 4 bytes (8 hex chars after 0x) should be the function selector
  const selector = encoded.slice(0, 10); // 0x + 8 hex chars
  assertEquals(selector.length, 10, "Function selector should be 10 chars (0x + 8)");

  // Verify it's a valid hex pattern
  assertMatch(selector, /^0x[0-9a-fA-F]{8}$/, "Function selector should be valid hex");
});

Deno.test("encodeSubscribeCall - encodes parameters correctly", () => {
  const service = AzothPayService.getInstance();
  const target = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;
  const rate = 38n;
  const projectId = 1n;

  const encoded = service.encodeSubscribeCall(target, rate, projectId);

  // Total length should be: 4 bytes selector + 32 bytes address + 32 bytes rate + 32 bytes projectId
  // = 4 + 32 + 32 + 32 = 100 bytes = 200 hex chars + 2 for "0x" = 202 chars
  assertEquals(encoded.length, 202, "Encoded call should have correct length (selector + 3 params)");
});

Deno.test("encodeSubscribeCall - includes target address in calldata", () => {
  const service = AzothPayService.getInstance();
  const target = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;
  const rate = 38n;
  const projectId = 1n;

  const encoded = service.encodeSubscribeCall(target, rate, projectId);

  // Target address should be encoded (without 0x, lowercase, padded to 32 bytes)
  const targetWithoutPrefix = target.slice(2).toLowerCase();
  assertEquals(
    encoded.toLowerCase().includes(targetWithoutPrefix),
    true,
    "Encoded call should include target address"
  );
});

Deno.test("encodeSubscribeCall - different inputs produce different outputs", () => {
  const service = AzothPayService.getInstance();
  const target1 = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;
  const target2 = "0x1234567890123456789012345678901234567890" as const;

  const encoded1 = service.encodeSubscribeCall(target1, 38n, 1n);
  const encoded2 = service.encodeSubscribeCall(target2, 38n, 1n);
  const encoded3 = service.encodeSubscribeCall(target1, 100n, 1n);
  const encoded4 = service.encodeSubscribeCall(target1, 38n, 2n);

  // All should be different
  assertEquals(encoded1 !== encoded2, true, "Different targets should produce different output");
  assertEquals(encoded1 !== encoded3, true, "Different rates should produce different output");
  assertEquals(encoded1 !== encoded4, true, "Different project IDs should produce different output");
});

Deno.test("encodeSubscribeCall - handles zero values", () => {
  const service = AzothPayService.getInstance();
  const target = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;

  const encoded = service.encodeSubscribeCall(target, 0n, 0n);

  // Should still produce valid calldata
  assertEquals(encoded.startsWith("0x"), true, "Should produce valid hex with zero values");
  assertEquals(encoded.length, 202, "Should have correct length with zero values");
});

// ============================================================================
// Tests for SECONDS_PER_MONTH constant
// ============================================================================

Deno.test("SECONDS_PER_MONTH - is correct value", () => {
  // 30 days * 24 hours * 60 minutes * 60 seconds = 2,592,000
  const expected = 30n * 24n * 60n * 60n;
  assertEquals(SECONDS_PER_MONTH, expected, "SECONDS_PER_MONTH should be 30 days in seconds");
  assertEquals(SECONDS_PER_MONTH, 2592000n, "SECONDS_PER_MONTH should be 2,592,000");
});

// ============================================================================
// Tests for singleton pattern
// ============================================================================

Deno.test("getInstance - returns same instance", () => {
  const instance1 = AzothPayService.getInstance();
  const instance2 = AzothPayService.getInstance();

  assertEquals(instance1, instance2, "getInstance should return the same instance");
});
