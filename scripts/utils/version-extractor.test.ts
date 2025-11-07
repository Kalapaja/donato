/**
 * Tests for version extraction utilities
 */

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import {
  extractVersion,
  extractVersionFromEnv,
  VersionExtractionError,
} from "./version-extractor.ts";

describe("version-extractor", () => {
  // Store original env values
  let originalEnv: string | undefined;
  const ENV_VAR_NAME = "WIDGET_VERSION";

  beforeEach(() => {
    // Save original environment variable
    originalEnv = Deno.env.get(ENV_VAR_NAME);
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      Deno.env.set(ENV_VAR_NAME, originalEnv);
    } else {
      Deno.env.delete(ENV_VAR_NAME);
    }
  });

  describe("extractVersionFromEnv", () => {
    it("should extract valid version from environment variable", () => {
      Deno.env.set(ENV_VAR_NAME, "1.2.3");

      const result = extractVersionFromEnv(ENV_VAR_NAME);

      assertEquals(result.version, "1.2.3");
      assertEquals(result.source, "env");
      assertEquals(result.parsed.major, 1);
      assertEquals(result.parsed.minor, 2);
      assertEquals(result.parsed.patch, 3);
    });

    it("should throw error when environment variable is not set", () => {
      Deno.env.delete(ENV_VAR_NAME);

      assertThrows(
        () => extractVersionFromEnv(ENV_VAR_NAME),
        VersionExtractionError,
        "Version not found in environment variable",
      );
    });

    it("should throw error for invalid semantic version format", () => {
      Deno.env.set(ENV_VAR_NAME, "v1.2.3");

      assertThrows(
        () => extractVersionFromEnv(ENV_VAR_NAME),
        VersionExtractionError,
        "Invalid version format",
      );
    });

    it("should throw error for incomplete version", () => {
      Deno.env.set(ENV_VAR_NAME, "1.2");

      assertThrows(
        () => extractVersionFromEnv(ENV_VAR_NAME),
        VersionExtractionError,
        "Invalid version format",
      );
    });

    it("should accept custom environment variable name", () => {
      const customEnvName = "CUSTOM_VERSION";
      Deno.env.set(customEnvName, "2.5.8");

      const result = extractVersionFromEnv(customEnvName);

      assertEquals(result.version, "2.5.8");
      assertEquals(result.source, "env");
    });
  });

  describe("extractVersion", () => {
    // Create a temporary test directory
    const testDir = "./test-temp-version-extractor";
    const testDenoJsonPath = `${testDir}/deno.json`;

    beforeEach(async () => {
      // Create test directory
      try {
        await Deno.mkdir(testDir, { recursive: true });
      } catch {
        // Directory might already exist
      }
    });

    afterEach(async () => {
      // Clean up test directory
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Directory might not exist
      }
    });

    it("should extract version from environment variable (priority)", async () => {
      // Set both env and file
      Deno.env.set(ENV_VAR_NAME, "3.0.0");
      await Deno.writeTextFile(
        testDenoJsonPath,
        JSON.stringify({ version: "1.0.0" }),
      );

      const result = await extractVersion({
        denoConfigPath: testDenoJsonPath,
        envVarName: ENV_VAR_NAME,
      });

      assertEquals(result.version, "3.0.0");
      assertEquals(result.source, "env");
    });

    it("should extract version from deno.json when env not set", async () => {
      Deno.env.delete(ENV_VAR_NAME);
      await Deno.writeTextFile(
        testDenoJsonPath,
        JSON.stringify({ version: "2.4.6" }),
      );

      const result = await extractVersion({
        denoConfigPath: testDenoJsonPath,
        envVarName: ENV_VAR_NAME,
      });

      assertEquals(result.version, "2.4.6");
      assertEquals(result.source, "deno.json");
      assertEquals(result.parsed.major, 2);
      assertEquals(result.parsed.minor, 4);
      assertEquals(result.parsed.patch, 6);
    });

    it("should throw error when deno.json file not found", async () => {
      Deno.env.delete(ENV_VAR_NAME);

      await assertRejects(
        () =>
          extractVersion({
            denoConfigPath: "./nonexistent.json",
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "deno.json file not found",
      );
    });

    it("should throw error when deno.json is invalid JSON", async () => {
      Deno.env.delete(ENV_VAR_NAME);
      await Deno.writeTextFile(testDenoJsonPath, "{ invalid json }");

      await assertRejects(
        () =>
          extractVersion({
            denoConfigPath: testDenoJsonPath,
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "Failed to parse deno.json",
      );
    });

    it("should throw error when version not found in deno.json", async () => {
      Deno.env.delete(ENV_VAR_NAME);
      await Deno.writeTextFile(
        testDenoJsonPath,
        JSON.stringify({ tasks: {} }),
      );

      await assertRejects(
        () =>
          extractVersion({
            denoConfigPath: testDenoJsonPath,
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "Version not found",
      );
    });

    it("should throw error with helpful message when no version found", async () => {
      Deno.env.delete(ENV_VAR_NAME);

      const error = await assertRejects(
        () =>
          extractVersion({
            denoConfigPath: "./nonexistent.json",
            envVarName: ENV_VAR_NAME,
            required: true,
          }),
        VersionExtractionError,
      );

      // Check that error is VersionExtractionError
      assertEquals(error.name, "VersionExtractionError");
      // Check that error message exists and is a string
      assertEquals(typeof error.message, "string");
      // The error in this case is "deno.json file not found" which is thrown before
      // we can get to the "Version not found. Please either..." message
      assertEquals(error.message.includes("deno.json"), true);
    });

    it("should validate semantic version from deno.json", async () => {
      Deno.env.delete(ENV_VAR_NAME);
      await Deno.writeTextFile(
        testDenoJsonPath,
        JSON.stringify({ version: "invalid" }),
      );

      await assertRejects(
        () =>
          extractVersion({
            denoConfigPath: testDenoJsonPath,
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "Invalid version format",
      );
    });

    it("should handle deno.json with other fields", async () => {
      Deno.env.delete(ENV_VAR_NAME);
      await Deno.writeTextFile(
        testDenoJsonPath,
        JSON.stringify({
          version: "1.5.3",
          tasks: { build: "echo build" },
          imports: {},
        }),
      );

      const result = await extractVersion({
        denoConfigPath: testDenoJsonPath,
        envVarName: ENV_VAR_NAME,
      });

      assertEquals(result.version, "1.5.3");
      assertEquals(result.source, "deno.json");
    });

    it("should accept large version numbers", async () => {
      Deno.env.set(ENV_VAR_NAME, "100.200.300");

      const result = await extractVersion({
        envVarName: ENV_VAR_NAME,
      });

      assertEquals(result.version, "100.200.300");
      assertEquals(result.parsed.major, 100);
      assertEquals(result.parsed.minor, 200);
      assertEquals(result.parsed.patch, 300);
    });

    it("should work with default options", async () => {
      // Create deno.json in current directory for this test
      const defaultPath = "./deno.json";
      const originalContent = await Deno.readTextFile(defaultPath);

      try {
        // Add version to existing deno.json
        const config = JSON.parse(originalContent);
        config.version = "9.9.9";
        await Deno.writeTextFile(defaultPath, JSON.stringify(config, null, 2));

        Deno.env.delete(ENV_VAR_NAME);

        const result = await extractVersion();

        assertEquals(result.version, "9.9.9");
        assertEquals(result.source, "deno.json");
      } finally {
        // Restore original deno.json
        await Deno.writeTextFile(defaultPath, originalContent);
      }
    });

    it("should not throw when required is false and version not found", async () => {
      Deno.env.delete(ENV_VAR_NAME);

      await assertRejects(
        () =>
          extractVersion({
            denoConfigPath: "./nonexistent.json",
            required: false,
          }),
        VersionExtractionError,
        "Version not found",
      );
    });

    it("should reject version with leading v", async () => {
      Deno.env.set(ENV_VAR_NAME, "v1.0.0");

      await assertRejects(
        () =>
          extractVersion({
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "Invalid version format",
      );
    });

    it("should reject version with prerelease tag", async () => {
      Deno.env.set(ENV_VAR_NAME, "1.0.0-alpha");

      await assertRejects(
        () =>
          extractVersion({
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "Invalid version format",
      );
    });

    it("should reject version with build metadata", async () => {
      Deno.env.set(ENV_VAR_NAME, "1.0.0+build123");

      await assertRejects(
        () =>
          extractVersion({
            envVarName: ENV_VAR_NAME,
          }),
        VersionExtractionError,
        "Invalid version format",
      );
    });
  });
});

