/**
 * Vite Plugin for Widget Versioning and SRI
 * 
 * This plugin integrates the post-build processing into the Vite build pipeline.
 * It runs after the bundle is complete to:
 * - Calculate integrity hashes
 * - Create versioned files
 * - Update the version manifest
 * 
 * The plugin only runs in production mode to avoid overhead during development.
 */

import type { Plugin } from "vite";
import { calculateSHA384 } from "./scripts/utils/calculate-integrity.ts";
import { extractVersion } from "./scripts/utils/version-extractor.ts";
import { ManifestManager } from "./scripts/manifest/manifest-manager.ts";
import type { VersionEntry } from "./scripts/manifest/manifest-types.ts";
import { join, resolve } from "node:path";
import { copyFile, stat } from "node:fs/promises";

/**
 * Options for the versioning plugin
 */
export interface VersioningPluginOptions {
  /**
   * Override version from deno.json
   * If not provided, will read from deno.json or WIDGET_VERSION env var
   */
  version?: string;

  /**
   * Path to the manifest file
   * Default: ./dist/versions.json
   */
  manifestPath?: string;

  /**
   * Enable/disable the plugin
   * Default: true in production, false otherwise
   */
  enabled?: boolean;

  /**
   * Output directory
   * Default: ./dist
   */
  outputDir?: string;

  /**
   * Source bundle filename
   * Default: donation-widget.js
   */
  sourceFile?: string;
}

/**
 * Create the versioning plugin
 */
export function versioningPlugin(options: VersioningPluginOptions = {}): Plugin {
  const {
    version: versionOverride,
    manifestPath: manifestPathOverride,
    enabled,
    outputDir = "./dist",
    sourceFile = "donation-widget.js",
  } = options;

  let isProduction = false;
  let isEnabled = enabled;

  return {
    name: "vite-plugin-versioning",

    // Detect production mode
    config(config, { mode }) {
      isProduction = mode === "production";
      
      // If enabled is not explicitly set, enable only in production
      if (isEnabled === undefined) {
        isEnabled = isProduction;
      }
    },

    // Run after bundle is complete
    async closeBundle() {
      // Skip if not enabled
      if (!isEnabled) {
        console.log("📦 Versioning plugin: Skipped (not in production mode)");
        return;
      }

      try {
        console.log("\n🚀 Running versioning plugin...\n");

        // Step 1: Extract version
        console.log("📋 Extracting version...");
        const versionResult = await extractVersion({
          denoConfigPath: "./deno.json",
          envVarName: "WIDGET_VERSION",
          required: true,
          versionOverride,
        });
        console.log(`   Version: ${versionResult.version} (from ${versionResult.source})`);
        console.log(`   Parsed: ${versionResult.parsed.major}.${versionResult.parsed.minor}.${versionResult.parsed.patch}\n`);

        // Step 2: Resolve file paths
        const sourceFilePath = resolve(join(outputDir, sourceFile));
        const versionedFileName = `donation-widget.v${versionResult.version}.js`;
        const versionedFilePath = resolve(join(outputDir, versionedFileName));
        const manifestPath = manifestPathOverride || join(outputDir, "versions.json");

        // Step 3: Verify source file exists
        console.log("🔍 Verifying source file...");
        try {
          const fileStat = await stat(sourceFilePath);
          if (!fileStat.isFile()) {
            throw new Error(`${sourceFilePath} is not a file`);
          }
          console.log(`   Found: ${sourceFilePath} (${fileStat.size} bytes)\n`);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            throw new Error(
              `Source file not found: ${sourceFilePath}\n` +
              `The build process may have failed or the output filename is incorrect.`
            );
          }
          throw error;
        }

        // Step 4: Calculate integrity hash
        console.log("🔐 Calculating integrity hash...");
        const integrity = await calculateSHA384(sourceFilePath);
        console.log(`   Integrity: ${integrity}\n`);

        // Step 5: Get file size and timestamp
        const fileStat = await stat(sourceFilePath);
        const size = fileStat.size;
        const date = new Date().toISOString();

        // Step 6: Copy to versioned filename
        console.log("📦 Creating versioned bundle...");
        await copyFile(sourceFilePath, versionedFilePath);
        console.log(`   Created: ${versionedFileName}\n`);

        // Step 7: Update manifest
        console.log("📝 Updating version manifest...");
        const manifestManager = new ManifestManager(manifestPath);
        await manifestManager.load();

        // Check if version already exists
        const existingVersion = await manifestManager.getVersion(versionResult.version);
        const isNew = !existingVersion;

        if (existingVersion) {
          console.log(`   ⚠️  Version ${versionResult.version} already exists in manifest`);
          console.log(`   Updating existing version entry\n`);
        }

        const versionEntry: VersionEntry = {
          file: versionedFileName,
          integrity,
          size,
          date,
          major: versionResult.parsed.major,
          minor: versionResult.parsed.minor,
          patch: versionResult.parsed.patch,
        };

        await manifestManager.addVersion(versionResult.version, versionEntry);
        await manifestManager.setLatest(versionResult.version);
        await manifestManager.save();

        console.log(`   ✅ ${isNew ? "Added" : "Updated"} version ${versionResult.version} in manifest`);
        console.log(`   ✅ Set ${versionResult.version} as latest\n`);

        // Step 8: Display summary
        console.log("✨ Versioning plugin complete!\n");
        console.log("📊 Summary:");
        console.log(`   Version:       ${versionResult.version}`);
        console.log(`   Versioned:     ${versionedFileName}`);
        console.log(`   Latest alias:  ${sourceFile}`);
        console.log(`   Integrity:     ${integrity}`);
        console.log(`   Size:          ${(size / 1024).toFixed(2)} KB`);
        console.log(`   Manifest:      ${manifestPath}`);
        console.log(`   Status:        ${isNew ? "New version" : "Updated"}\n`);
      } catch (error) {
        console.error("\n❌ Versioning plugin failed:");

        if (error instanceof Error) {
          console.error(`   ${error.message}\n`);

          if (error.cause) {
            console.error("   Caused by:");
            console.error(`   ${error.cause}\n`);
          }

          // Print stack trace in verbose mode
          if (process.env.VERBOSE === "true") {
            console.error(error.stack);
          }
        } else {
          console.error(`   ${String(error)}\n`);
        }

        throw error; // Re-throw to fail the build
      }
    },
  };
}

