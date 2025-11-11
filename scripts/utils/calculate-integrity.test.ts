/**
 * Tests for Integrity Calculation Utility
 */

import { assertEquals, assertRejects } from "@std/assert";
import { assertStringIncludes } from "@std/assert";
import {
  calculateSHA384,
  calculateSHA384FromBuffer,
  verifyIntegrity,
  calculateMultipleIntegrity,
} from "./calculate-integrity.ts";

// Test data
const testContent = "console.log('Hello, World!');";
const testContentEncoded = new TextEncoder().encode(testContent);

Deno.test("calculateSHA384FromBuffer - returns SRI-formatted hash", async () => {
  const integrity = await calculateSHA384FromBuffer(testContent);
  
  // Should start with "sha384-"
  assertStringIncludes(integrity, "sha384-");
  
  // Should be proper length (prefix + base64 hash)
  // SHA-384 produces 48 bytes, base64 encoded = 64 characters
  assertEquals(integrity.length, 7 + 64); // "sha384-" + 64 chars
});

Deno.test("calculateSHA384FromBuffer - works with Uint8Array", async () => {
  const integrity = await calculateSHA384FromBuffer(testContentEncoded);
  
  assertStringIncludes(integrity, "sha384-");
  assertEquals(integrity.length, 7 + 64);
});

Deno.test("calculateSHA384FromBuffer - consistent hash for same input", async () => {
  const hash1 = await calculateSHA384FromBuffer(testContent);
  const hash2 = await calculateSHA384FromBuffer(testContent);
  
  assertEquals(hash1, hash2, "Same input should produce same hash");
});

Deno.test("calculateSHA384FromBuffer - different hash for different input", async () => {
  const hash1 = await calculateSHA384FromBuffer("content A");
  const hash2 = await calculateSHA384FromBuffer("content B");
  
  assertEquals(hash1.startsWith("sha384-"), true);
  assertEquals(hash2.startsWith("sha384-"), true);
  assertEquals(hash1 === hash2, false, "Different inputs should produce different hashes");
});

Deno.test("calculateSHA384 - calculates hash from file", async () => {
  // Create a temporary test file
  const tempFile = await Deno.makeTempFile({ suffix: ".js" });
  await Deno.writeTextFile(tempFile, testContent);
  
  try {
    const integrity = await calculateSHA384(tempFile);
    
    assertStringIncludes(integrity, "sha384-");
    assertEquals(integrity.length, 7 + 64);
    
    // Should match the hash from buffer
    const expectedIntegrity = await calculateSHA384FromBuffer(testContent);
    assertEquals(integrity, expectedIntegrity);
  } finally {
    // Clean up
    await Deno.remove(tempFile);
  }
});

Deno.test("calculateSHA384 - throws error for non-existent file", async () => {
  await assertRejects(
    async () => await calculateSHA384("/non/existent/file.js"),
    Error,
    "File not found"
  );
});

Deno.test("verifyIntegrity - returns true for matching hash", async () => {
  const tempFile = await Deno.makeTempFile({ suffix: ".js" });
  await Deno.writeTextFile(tempFile, testContent);
  
  try {
    const integrity = await calculateSHA384(tempFile);
    const isValid = await verifyIntegrity(tempFile, integrity);
    
    assertEquals(isValid, true);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("verifyIntegrity - returns false for mismatched hash", async () => {
  const tempFile = await Deno.makeTempFile({ suffix: ".js" });
  await Deno.writeTextFile(tempFile, testContent);
  
  try {
    const wrongIntegrity = "sha384-wronghash1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";
    const isValid = await verifyIntegrity(tempFile, wrongIntegrity);
    
    assertEquals(isValid, false);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("verifyIntegrity - returns false for non-existent file", async () => {
  const isValid = await verifyIntegrity(
    "/non/existent/file.js",
    "sha384-somehash"
  );
  
  assertEquals(isValid, false);
});

Deno.test("calculateMultipleIntegrity - calculates hashes for multiple files", async () => {
  // Create temporary test files
  const tempFile1 = await Deno.makeTempFile({ suffix: ".js" });
  const tempFile2 = await Deno.makeTempFile({ suffix: ".js" });
  
  await Deno.writeTextFile(tempFile1, "console.log('File 1');");
  await Deno.writeTextFile(tempFile2, "console.log('File 2');");
  
  try {
    const hashes = await calculateMultipleIntegrity([tempFile1, tempFile2]);
    
    assertEquals(hashes.size, 2);
    assertEquals(hashes.has(tempFile1), true);
    assertEquals(hashes.has(tempFile2), true);
    
    const hash1 = hashes.get(tempFile1);
    const hash2 = hashes.get(tempFile2);
    
    assertStringIncludes(hash1!, "sha384-");
    assertStringIncludes(hash2!, "sha384-");
    assertEquals(hash1 === hash2, false, "Different files should have different hashes");
  } finally {
    await Deno.remove(tempFile1);
    await Deno.remove(tempFile2);
  }
});

Deno.test("calculateMultipleIntegrity - handles mixed valid and invalid files", async () => {
  const tempFile = await Deno.makeTempFile({ suffix: ".js" });
  await Deno.writeTextFile(tempFile, testContent);
  
  try {
    const hashes = await calculateMultipleIntegrity([
      tempFile,
      "/non/existent/file.js"
    ]);
    
    // Should only have the valid file
    assertEquals(hashes.size, 1);
    assertEquals(hashes.has(tempFile), true);
    assertEquals(hashes.has("/non/existent/file.js"), false);
  } finally {
    await Deno.remove(tempFile);
  }
});

// Integration test with actual widget file (if it exists)
Deno.test("calculateSHA384 - integration test with widget bundle", async () => {
  const widgetPath = "./dist/donation-widget.js";
  
  try {
    // Check if the file exists
    await Deno.stat(widgetPath);
    
    // Calculate integrity
    const integrity = await calculateSHA384(widgetPath);
    
    // Basic validation
    assertStringIncludes(integrity, "sha384-");
    assertEquals(integrity.length, 7 + 64);
    
    console.log(`Widget integrity: ${integrity}`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log("Widget bundle not found, skipping integration test");
    } else {
      throw error;
    }
  }
});

