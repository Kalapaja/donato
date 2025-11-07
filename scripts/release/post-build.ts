/**
 * Post-Build Processing Script
 * 
 * This script runs after the build process to:
 * 1. Calculate integrity hash for the built bundle
 * 2. Generate versioned filename (donation-widget.vX.Y.Z.js)
 * 3. Copy bundle to versioned filename
 * 4. Keep bundle as "latest" alias (donation-widget.js)
 * 5. Update manifest with new version entry
 * 
 * Usage:
 *   deno run --allow-read --allow-write scripts/post-build.ts
 * 
 * Environment Variables:
 *   WIDGET_VERSION - Override version from deno.json
 *   OUTPUT_DIR - Output directory (default: ./dist)
 *   SOURCE_FILE - Source bundle filename (default: donation-widget.js)
 */

import { calculateSHA384 } from "../utils/calculate-integrity.ts";
import { extractVersion } from "../utils/version-extractor.ts";
import { ManifestManager } from "../manifest/manifest-manager.ts";
import type { VersionEntry } from "../manifest/manifest-types.ts";
import { join, resolve } from "jsr:@std/path@1.0.8";

/**
 * Configuration for post-build processing
 */
interface PostBuildConfig {
  /** Output directory containing the built bundle */
  outputDir: string;
  
  /** Name of the source bundle file */
  sourceFile: string;
  
  /** Path to the manifest file */
  manifestPath: string;
}

/**
 * Result of post-build processing
 */
interface PostBuildResult {
  /** Version that was processed */
  version: string;
  
  /** Path to versioned file */
  versionedFile: string;
  
  /** Path to latest alias */
  latestFile: string;
  
  /** Integrity hash */
  integrity: string;
  
  /** File size in bytes */
  size: number;
  
  /** Whether this was a new version or update */
  isNew: boolean;
}

/**
 * Gets configuration from environment or defaults
 */
function getConfig(): PostBuildConfig {
  const outputDir = Deno.env.get("OUTPUT_DIR") || "./dist";
  const sourceFile = Deno.env.get("SOURCE_FILE") || "donation-widget.js";
  const manifestPath = join(outputDir, "versions.json");
  
  return {
    outputDir,
    sourceFile,
    manifestPath,
  };
}

/**
 * Main post-build processing function
 */
async function postBuild(config: PostBuildConfig): Promise<PostBuildResult> {
  console.log("🚀 Starting post-build processing...\n");
  
  // Step 1: Extract version
  console.log("📋 Extracting version...");
  const versionResult = await extractVersion({
    denoConfigPath: "./deno.json",
    envVarName: "WIDGET_VERSION",
    required: true,
  });
  console.log(`   Version: ${versionResult.version} (from ${versionResult.source})`);
  console.log(`   Parsed: ${versionResult.parsed.major}.${versionResult.parsed.minor}.${versionResult.parsed.patch}\n`);
  
  // Step 2: Resolve file paths
  const sourceFilePath = resolve(join(config.outputDir, config.sourceFile));
  const versionedFileName = `donation-widget.v${versionResult.version}.js`;
  const versionedFilePath = resolve(join(config.outputDir, versionedFileName));
  const latestFilePath = sourceFilePath; // Latest is already donation-widget.js
  
  // Step 3: Verify source file exists
  console.log("🔍 Verifying source file...");
  try {
    const stat = await Deno.stat(sourceFilePath);
    if (!stat.isFile) {
      throw new Error(`${sourceFilePath} is not a file`);
    }
    console.log(`   Found: ${sourceFilePath} (${stat.size} bytes)\n`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(
        `Source file not found: ${sourceFilePath}\n` +
        `Please run the build process first.`
      );
    }
    throw error;
  }
  
  // Step 4: Calculate integrity hash
  console.log("🔐 Calculating integrity hash...");
  const integrity = await calculateSHA384(sourceFilePath);
  console.log(`   Integrity: ${integrity}\n`);
  
  // Step 5: Get file size and timestamp
  const fileStat = await Deno.stat(sourceFilePath);
  const size = fileStat.size;
  const date = new Date().toISOString();
  
  // Step 6: Copy to versioned filename
  console.log("📦 Creating versioned bundle...");
  await Deno.copyFile(sourceFilePath, versionedFilePath);
  console.log(`   Created: ${versionedFileName}\n`);
  
  // Step 7: Update manifest
  console.log("📝 Updating version manifest...");
  const manifestManager = new ManifestManager(config.manifestPath);
  await manifestManager.load();
  
  // Check if version already exists
  const existingVersion = await manifestManager.getVersion(versionResult.version);
  const isNew = !existingVersion;
  
  if (existingVersion) {
    console.log(`   ⚠️  Version ${versionResult.version} already exists in manifest`);
    console.log(`   Skipping manifest update (version already published)\n`);
  } else {
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
    
    console.log(`   ✅ Added version ${versionResult.version} to manifest`);
    console.log(`   ✅ Set ${versionResult.version} as latest\n`);
  }
  
  // Step 8: Display summary
  console.log("✨ Post-build processing complete!\n");
  console.log("📊 Summary:");
  console.log(`   Version:       ${versionResult.version}`);
  console.log(`   Versioned:     ${versionedFileName}`);
  console.log(`   Latest alias:  ${config.sourceFile}`);
  console.log(`   Integrity:     ${integrity}`);
  console.log(`   Size:          ${(size / 1024).toFixed(2)} KB`);
  console.log(`   Manifest:      ${config.manifestPath}`);
  console.log(`   Status:        ${isNew ? "New version" : "Already published"}\n`);
  
  return {
    version: versionResult.version,
    versionedFile: versionedFilePath,
    latestFile: latestFilePath,
    integrity,
    size,
    isNew,
  };
}

/**
 * CLI entry point
 */
if (import.meta.main) {
  try {
    const config = getConfig();
    const result = await postBuild(config);
    
    // Exit with success
    Deno.exit(0);
  } catch (error) {
    console.error("\n❌ Post-build processing failed:");
    
    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);
      
      if (error.cause) {
        console.error("   Caused by:");
        console.error(`   ${error.cause}\n`);
      }
    } else {
      console.error(`   ${String(error)}\n`);
    }
    
    Deno.exit(1);
  }
}

