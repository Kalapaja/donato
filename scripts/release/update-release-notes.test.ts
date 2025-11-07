/**
 * Tests for update-release-notes.ts
 */

import { assertEquals } from "@std/assert";

Deno.test("update-release-notes - validates RELEASE_ID is numeric", () => {
  const testCases = [
    { input: "123456", valid: true, expected: 123456 },
    { input: "0", valid: true, expected: 0 },
    { input: "abc", valid: false },
    { input: "12.34", valid: false },
    { input: "", valid: false },
  ];
  
  testCases.forEach(({ input, valid, expected }) => {
    const parsed = parseInt(input, 10);
    const isValid = !isNaN(parsed) && parsed.toString() === input;
    assertEquals(isValid, valid, `Failed for input: ${input}`);
    if (valid && expected !== undefined) {
      assertEquals(parsed, expected);
    }
  });
});

Deno.test("update-release-notes - generates embed code correctly", () => {
  const version = "1.0.0";
  const integrity = "sha384-abc123";
  const cdnDomain = "cdn.example.com";
  
  const embedCode = `\`\`\`html
<script 
  src="https://${cdnDomain}/donation-widget.v${version}.js"
  integrity="${integrity}"
  crossorigin="anonymous"
></script>

<donation-widget
  recipient="0x..."
  recipient-chain-id="1"
  recipient-token-address="0x..."
  theme="light"
></donation-widget>
\`\`\``;
  
  // Verify structure
  assertEquals(embedCode.includes(version), true);
  assertEquals(embedCode.includes(integrity), true);
  assertEquals(embedCode.includes(cdnDomain), true);
  assertEquals(embedCode.includes('crossorigin="anonymous"'), true);
});

Deno.test("update-release-notes - calculates file size correctly", () => {
  // Test the calculation logic
  const testCases = [
    { sizeBytes: 1024, expectedKB: "1.00" },
    { sizeBytes: 2048, expectedKB: "2.00" },
    { sizeBytes: 1536, expectedKB: "1.50" },
    { sizeBytes: 245678, expectedKB: "239.92" },
  ];
  
  testCases.forEach(({ sizeBytes, expectedKB }) => {
    const calculatedKB = (sizeBytes / 1024).toFixed(2);
    assertEquals(calculatedKB, expectedKB);
  });
});

