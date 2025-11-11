/**
 * Tests for release build script
 */

import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { join } from "jsr:@std/path@1.0.8";
import { calculateSHA384 } from "../utils/calculate-integrity.ts";

// We'll test the version extraction logic separately
// since full build testing requires Vite setup

describe("build-release", () => {
  // Store original env values
  let originalGitHubRef: string | undefined;
  const ENV_VAR_NAME = "GITHUB_REF_NAME";

  beforeEach(() => {
    // Save original environment variable
    originalGitHubRef = Deno.env.get(ENV_VAR_NAME);
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalGitHubRef !== undefined) {
      Deno.env.set(ENV_VAR_NAME, originalGitHubRef);
    } else {
      Deno.env.delete(ENV_VAR_NAME);
    }
  });

  describe("version extraction from GITHUB_REF_NAME", () => {
    it("should extract version from tag with v prefix", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.2.3");
      
      // Import dynamically to get fresh env value
      const { extractVersionFromGitTag } = await import("./build-release-test-helper.ts");
      const version = extractVersionFromGitTag();
      
      assertEquals(version, "1.2.3");
    });

    it("should extract version from tag without v prefix", async () => {
      Deno.env.set(ENV_VAR_NAME, "1.2.3");
      
      const { extractVersionFromGitTag } = await import("./build-release-test-helper.ts");
      const version = extractVersionFromGitTag();
      
      assertEquals(version, "1.2.3");
    });

    it("should extract version from full git ref", async () => {
      Deno.env.set(ENV_VAR_NAME, "refs/tags/v1.2.3");
      
      const { extractVersionFromGitTag } = await import("./build-release-test-helper.ts");
      const version = extractVersionFromGitTag();
      
      assertEquals(version, "1.2.3");
    });
  });

  describe("configuration", () => {
    it("should use default output directory when not specified", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.0.0");
      Deno.env.delete("OUTPUT_DIR");
      
      const { getConfig } = await import("./build-release-test-helper.ts");
      const config = getConfig();
      
      assertEquals(config.outputDir, "./dist");
    });

    it("should use custom output directory when specified", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.0.0");
      Deno.env.set("OUTPUT_DIR", "./custom-dist");
      
      const { getConfig } = await import("./build-release-test-helper.ts");
      const config = getConfig();
      
      assertEquals(config.outputDir, "./custom-dist");
      
      // Cleanup
      Deno.env.delete("OUTPUT_DIR");
    });

    it("should always use donation-widget.js as source file", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.0.0");
      
      const { getConfig } = await import("./build-release-test-helper.ts");
      const config = getConfig();
      
      assertEquals(config.sourceFile, "donation-widget.js");
    });
  });

  describe("versioned filename generation", () => {
    it("should generate correct versioned filename", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.2.3");
      
      const { getConfig } = await import("./build-release-test-helper.ts");
      const config = getConfig();
      const expectedFilename = `donation-widget.v${config.version}.js`;
      
      assertEquals(expectedFilename, "donation-widget.v1.2.3.js");
    });
  });

  describe("integrity calculation", () => {
    let testDir: string;
    let testFile: string;
    const testContent = "console.log('test widget');";

    beforeEach(async () => {
      // Create a temporary test directory and file
      testDir = await Deno.makeTempDir();
      testFile = join(testDir, "test-widget.js");
    });

    afterEach(async () => {
      // Cleanup test directory and file
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore if directory doesn't exist
      }
    });

    it("should calculate SHA-384 integrity hash", async () => {
      await Deno.writeTextFile(testFile, testContent);
      const integrity = await calculateSHA384(testFile);
      
      // Should start with "sha384-"
      assertStringIncludes(integrity, "sha384-");
      
      // Should be at least 71 characters (sha384- prefix + 64 base64 chars)
      assertEquals(integrity.length > 70, true);
    });

    it("should generate consistent hash for same content", async () => {
      await Deno.writeTextFile(testFile, testContent);
      const hash1 = await calculateSHA384(testFile);
      
      // Write same content again
      await Deno.writeTextFile(testFile, testContent);
      const hash2 = await calculateSHA384(testFile);
      
      assertEquals(hash1, hash2);
    });

    it("should generate different hash for different content", async () => {
      await Deno.writeTextFile(testFile, testContent);
      const hash1 = await calculateSHA384(testFile);
      
      // Write different content
      await Deno.writeTextFile(testFile, testContent + " modified");
      const hash2 = await calculateSHA384(testFile);
      
      assertEquals(hash1 === hash2, false);
    });
  });

  describe("integrity file format", () => {
    it("should generate correct integrity filename", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.2.3");
      
      const { getConfig } = await import("./build-release-test-helper.ts");
      const config = getConfig();
      const versionedFileName = `donation-widget.v${config.version}.js`;
      const integrityFileName = `${versionedFileName}.integrity.txt`;
      
      assertEquals(integrityFileName, "donation-widget.v1.2.3.js.integrity.txt");
    });
  });
});

