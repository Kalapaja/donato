/**
 * Test helper for build-release.ts
 * 
 * This module exports functions from build-release.ts for testing purposes.
 * The main build-release.ts file is designed to run as CLI script,
 * so this helper extracts testable functions.
 */

import { assertValidSemanticVersion } from "../manifest/manifest-types.ts";

/**
 * Configuration for release build
 */
export interface ReleaseBuildConfig {
  /** Version extracted from git tag */
  version: string;
  
  /** Output directory */
  outputDir: string;
  
  /** Source bundle filename (built by Vite) */
  sourceFile: string;
}

/**
 * Error thrown when build fails
 */
export class BuildError extends Error {
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
export function extractVersionFromGitTag(): string {
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
export function getConfig(): ReleaseBuildConfig {
  const version = extractVersionFromGitTag();
  const outputDir = Deno.env.get("OUTPUT_DIR") || "./dist";
  const sourceFile = "donation-widget.js";
  
  return {
    version,
    outputDir,
    sourceFile,
  };
}

