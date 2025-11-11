/**
 * Release Build Script
 * 
 * This script is designed to run in GitHub Actions during the release process.
 * It builds the widget with a specific version, creates a versioned output file,
 * and generates an integrity hash file for Subresource Integrity (SRI) verification.
 * 
 * Responsibilities:
 * 1. Read version from GITHUB_REF_NAME environment variable
 * 2. Execute Vite production build
 * 3. Rename output to donation-widget.v{version}.js
 * 4. Calculate SHA-384 integrity hash
 * 5. Save integrity hash to donation-widget.v{version}.js.integrity.txt
 * 
 * Usage:
 *   GITHUB_REF_NAME=v1.0.0 deno run --allow-read --allow-write --allow-run --allow-env scripts/build-release.ts
 * 
 * Environment Variables:
 *   GITHUB_REF_NAME - Git tag name (e.g., "v1.0.0" or "1.0.0")
 *   OUTPUT_DIR - Output directory (default: ./dist)
 * 
 * Output:
 *   - dist/donation-widget.v{version}.js - Versioned widget bundle
 *   - dist/donation-widget.v{version}.js.integrity.txt - SRI integrity hash
 */

import { join, resolve } from "jsr:@std/path@1.0.8";
import { assertValidSemanticVersion } from "../manifest/manifest-types.ts";
import { calculateSHA384 } from "../utils/calculate-integrity.ts";

/**
 * Configuration for release build
 */
interface ReleaseBuildConfig {
  /** Version extracted from git tag */
  version: string;
  
  /** Output directory */
  outputDir: string;
  
  /** Source bundle filename (built by Vite) */
  sourceFile: string;
}

/**
 * Result of release build
 */
interface ReleaseBuildResult {
  /** Version that was built */
  version: string;
  
  /** Path to versioned output file */
  versionedFile: string;
  
  /** Path to integrity hash file */
  integrityFile: string;
  
  /** SRI integrity hash */
  integrity: string;
  
  /** Size of the built file in bytes */
  size: number;
  
  /** Build duration in milliseconds */
  duration: number;
}

/**
 * Error thrown when build fails
 */
class BuildError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "BuildError";
    this.cause = cause;
  }
}

/**
 * Extracts version from GITHUB_REF_NAME environment variable
 * 
 * Handles formats:
 * - "v1.0.0" -> "1.0.0"
 * - "1.0.0" -> "1.0.0"
 * - "refs/tags/v1.0.0" -> "1.0.0"
 * 
 * @returns Validated semantic version string
 * @throws {BuildError} If version is missing or invalid
 */
function extractVersionFromGitTag(): string {
  const gitRef = Deno.env.get("GITHUB_REF_NAME");
  
  if (!gitRef) {
    throw new BuildError(
      "GITHUB_REF_NAME environment variable is not set.\n" +
      "This script is designed to run in GitHub Actions on release tag creation.\n" +
      "For local testing, set GITHUB_REF_NAME manually:\n" +
      "  GITHUB_REF_NAME=v1.0.0 deno task build:release"
    );
  }
  
  // Extract version from tag name
  // Handle formats: "v1.0.0", "1.0.0", "refs/tags/v1.0.0"
  let version = gitRef
    .replace(/^refs\/tags\//, "")  // Remove refs/tags/ prefix
    .replace(/^v/, "");              // Remove v prefix
  
  // Validate semantic version format
  try {
    assertValidSemanticVersion(version);
  } catch (error) {
    throw new BuildError(
      `Invalid version format in GITHUB_REF_NAME: "${gitRef}"\n` +
      `Expected semantic version format (e.g., v1.0.0 or 1.0.0)\n` +
      `${(error as Error).message}`,
      error as Error
    );
  }
  
  return version;
}

/**
 * Gets configuration from environment or defaults
 */
function getConfig(): ReleaseBuildConfig {
  const version = extractVersionFromGitTag();
  const outputDir = Deno.env.get("OUTPUT_DIR") || "./dist";
  const sourceFile = "donation-widget.js";
  
  return {
    version,
    outputDir,
    sourceFile,
  };
}

/**
 * Executes Vite production build
 * 
 * @throws {BuildError} If build fails
 */
async function runViteBuild(): Promise<void> {
  console.log("🔨 Running Vite production build...");
  
  try {
    const command = new Deno.Command("deno", {
      args: ["task", "build:versioned"],
      stdout: "inherit",
      stderr: "inherit",
    });
    
    const { code, success } = await command.output();
    
    if (!success) {
      throw new BuildError(
        `Vite build failed with exit code ${code}.\n` +
        `Check the build output above for details.`
      );
    }
    
    console.log("✅ Vite build completed successfully\n");
  } catch (error) {
    if (error instanceof BuildError) {
      throw error;
    }
    throw new BuildError(
      `Failed to execute Vite build: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Renames the built bundle to versioned filename
 * 
 * @param sourceFilePath - Path to source file (donation-widget.js)
 * @param versionedFilePath - Path to versioned file (donation-widget.v1.0.0.js)
 * @throws {BuildError} If rename fails
 */
async function renameToVersionedFile(
  sourceFilePath: string,
  versionedFilePath: string
): Promise<void> {
  console.log("📝 Renaming to versioned filename...");
  
  try {
    // Verify source file exists
    const stat = await Deno.stat(sourceFilePath);
    if (!stat.isFile) {
      throw new BuildError(`${sourceFilePath} is not a file`);
    }
    
    // Copy to versioned filename
    await Deno.copyFile(sourceFilePath, versionedFilePath);
    
    console.log(`✅ Created: ${versionedFilePath}\n`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new BuildError(
        `Source file not found: ${sourceFilePath}\n` +
        `The build process may have failed or produced output in a different location.`
      );
    }
    if (error instanceof BuildError) {
      throw error;
    }
    throw new BuildError(
      `Failed to rename file: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Calculates SHA-384 integrity hash for a file
 * 
 * @param filePath - Path to file to calculate hash for
 * @returns SRI-formatted integrity hash
 * @throws {BuildError} If calculation fails
 */
async function calculateIntegrityHash(filePath: string): Promise<string> {
  console.log("🔒 Calculating SHA-384 integrity hash...");
  
  try {
    const integrity = await calculateSHA384(filePath);
    console.log(`✅ Integrity: ${integrity}\n`);
    return integrity;
  } catch (error) {
    throw new BuildError(
      `Failed to calculate integrity hash: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Saves integrity hash to a .integrity.txt file
 * 
 * @param integrityFilePath - Path where integrity file should be saved
 * @param integrity - SRI integrity hash string
 * @throws {BuildError} If save fails
 */
async function saveIntegrityFile(
  integrityFilePath: string,
  integrity: string
): Promise<void> {
  console.log("💾 Saving integrity hash to file...");
  
  try {
    await Deno.writeTextFile(integrityFilePath, integrity);
    console.log(`✅ Created: ${integrityFilePath}\n`);
  } catch (error) {
    throw new BuildError(
      `Failed to save integrity file: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Main release build function
 */
async function buildForRelease(
  config: ReleaseBuildConfig
): Promise<ReleaseBuildResult> {
  const startTime = performance.now();
  
  console.log("🚀 Starting release build...\n");
  console.log("📋 Configuration:");
  console.log(`   Version:     ${config.version}`);
  console.log(`   Output dir:  ${config.outputDir}`);
  console.log(`   Source file: ${config.sourceFile}\n`);
  
  // Step 1: Run Vite build
  await runViteBuild();
  
  // Step 2: Resolve file paths
  const sourceFilePath = resolve(join(config.outputDir, config.sourceFile));
  const versionedFileName = `donation-widget.v${config.version}.js`;
  const versionedFilePath = resolve(join(config.outputDir, versionedFileName));
  
  console.log("📦 Output files:");
  console.log(`   Source:    ${sourceFilePath}`);
  console.log(`   Versioned: ${versionedFilePath}\n`);
  
  // Step 3: Rename to versioned filename
  await renameToVersionedFile(sourceFilePath, versionedFilePath);
  
  // Step 4: Calculate integrity hash
  const integrity = await calculateIntegrityHash(versionedFilePath);
  
  // Step 5: Save integrity hash to file
  const integrityFileName = `${versionedFileName}.integrity.txt`;
  const integrityFilePath = resolve(join(config.outputDir, integrityFileName));
  await saveIntegrityFile(integrityFilePath, integrity);
  
  // Step 6: Get file size
  const stat = await Deno.stat(versionedFilePath);
  const size = stat.size;
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Step 7: Display summary
  console.log("✨ Release build complete!\n");
  console.log("📊 Summary:");
  console.log(`   Version:      ${config.version}`);
  console.log(`   Output file:  ${versionedFileName}`);
  console.log(`   Integrity:    ${integrityFileName}`);
  console.log(`   Hash:         ${integrity}`);
  console.log(`   Size:         ${(size / 1024).toFixed(2)} KB`);
  console.log(`   Duration:     ${(duration / 1000).toFixed(2)}s\n`);
  
  return {
    version: config.version,
    versionedFile: versionedFilePath,
    integrityFile: integrityFilePath,
    integrity,
    size,
    duration,
  };
}

/**
 * CLI entry point
 */
if (import.meta.main) {
  try {
    const config = getConfig();
    const result = await buildForRelease(config);
    
    // Output result for GitHub Actions
    console.log("📤 GitHub Actions Output:");
    console.log(`::set-output name=version::${result.version}`);
    console.log(`::set-output name=file::${result.versionedFile}`);
    console.log(`::set-output name=integrity_file::${result.integrityFile}`);
    console.log(`::set-output name=integrity::${result.integrity}`);
    console.log(`::set-output name=size::${result.size}`);
    
    Deno.exit(0);
  } catch (error) {
    console.error("\n❌ Release build failed:");
    
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

