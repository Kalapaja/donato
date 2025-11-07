/**
 * Version extraction utilities for reading version from deno.json
 * and environment variables, with semantic version validation.
 */

import { assertValidSemanticVersion, type SemanticVersion } from "../manifest/manifest-types.ts";

/**
 * Configuration for deno.json file
 */
interface DenoConfig {
  version?: string;
  [key: string]: unknown;
}

/**
 * Options for extracting version
 */
export interface VersionExtractionOptions {
  /** Path to deno.json file (default: "./deno.json") */
  denoConfigPath?: string;
  
  /** Environment variable name to check for version override (default: "WIDGET_VERSION") */
  envVarName?: string;
  
  /** Whether to require a version to be present (default: true) */
  required?: boolean;
  
  /** Direct version override (highest priority) */
  versionOverride?: string;
}

/**
 * Result of version extraction
 */
export interface VersionExtractionResult {
  /** The extracted and validated version string */
  version: string;
  
  /** Parsed semantic version components */
  parsed: SemanticVersion;
  
  /** Source of the version (override, env, deno.json, or error) */
  source: "override" | "env" | "deno.json" | "error";
}

/**
 * Error thrown when version extraction fails
 */
export class VersionExtractionError extends Error {
  public override cause?: Error;
  
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "VersionExtractionError";
    this.cause = cause;
  }
}

/**
 * Extracts version from environment variable
 * @param envVarName - Name of the environment variable
 * @returns Version string or null if not found
 */
function getVersionFromEnv(envVarName: string): string | null {
  const version = Deno.env.get(envVarName);
  return version || null;
}

/**
 * Reads and parses deno.json file
 * @param path - Path to deno.json file
 * @returns Parsed config object
 * @throws {VersionExtractionError} If file cannot be read or parsed
 */
async function readDenoConfig(path: string): Promise<DenoConfig> {
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content) as DenoConfig;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new VersionExtractionError(
        `deno.json file not found at: ${path}`,
        error as Error,
      );
    }
    if (error instanceof SyntaxError) {
      throw new VersionExtractionError(
        `Failed to parse deno.json at ${path}: ${error.message}`,
        error as Error,
      );
    }
    throw new VersionExtractionError(
      `Failed to read deno.json at ${path}: ${(error as Error).message}`,
      error as Error,
    );
  }
}

/**
 * Extracts version from deno.json file
 * @param path - Path to deno.json file
 * @returns Version string or null if not found
 */
async function getVersionFromDenoConfig(path: string): Promise<string | null> {
  const config = await readDenoConfig(path);
  return config.version || null;
}

/**
 * Extracts and validates version from deno.json or environment variable
 * 
 * Priority order:
 * 1. Version override (if provided)
 * 2. Environment variable (if specified)
 * 3. deno.json version field
 * 4. Error if required and not found
 * 
 * @param options - Extraction options
 * @returns Version extraction result
 * @throws {VersionExtractionError} If version is required but not found or invalid
 * 
 * @example
 * ```typescript
 * // Extract version with defaults
 * const result = await extractVersion();
 * console.log(`Version: ${result.version} (from ${result.source})`);
 * 
 * // Extract with custom options
 * const result = await extractVersion({
 *   denoConfigPath: "./custom/deno.json",
 *   envVarName: "MY_VERSION",
 *   required: false
 * });
 * 
 * // Extract with direct override
 * const result = await extractVersion({
 *   versionOverride: "1.2.3"
 * });
 * ```
 */
export async function extractVersion(
  options: VersionExtractionOptions = {},
): Promise<VersionExtractionResult> {
  const {
    denoConfigPath = "./deno.json",
    envVarName = "WIDGET_VERSION",
    required = true,
    versionOverride,
  } = options;

  let version: string | null = null;
  let source: "override" | "env" | "deno.json" | "error" = "error";

  // 1. Check version override first (highest priority)
  if (versionOverride) {
    version = versionOverride;
    source = "override";
  } else {
    // 2. Check environment variable
    version = getVersionFromEnv(envVarName);
    if (version) {
      source = "env";
    } else {
      // 3. Check deno.json
      try {
        version = await getVersionFromDenoConfig(denoConfigPath);
        if (version) {
          source = "deno.json";
        }
      } catch (error) {
        if (required) {
          throw error;
        }
        // If not required, continue with null version
      }
    }
  }

  // 4. Handle missing version
  if (!version) {
    if (required) {
      throw new VersionExtractionError(
        `Version not found. Please either:\n` +
        `  1. Provide versionOverride option\n` +
        `  2. Set the ${envVarName} environment variable\n` +
        `  3. Add a "version" field to ${denoConfigPath}\n` +
        `\nExample: ${envVarName}=1.0.0 or add "version": "1.0.0" to ${denoConfigPath}`,
      );
    }
    throw new VersionExtractionError("Version not found");
  }

  // 5. Validate semantic version format
  try {
    const parsed = assertValidSemanticVersion(version);
    return {
      version,
      parsed,
      source,
    };
  } catch (error) {
    throw new VersionExtractionError(
      `Invalid version format: ${version}. ${(error as Error).message}`,
      error as Error,
    );
  }
}

/**
 * Extracts version synchronously from environment variable only
 * Useful when you need quick access without file I/O
 * 
 * @param envVarName - Environment variable name (default: "WIDGET_VERSION")
 * @returns Version extraction result
 * @throws {VersionExtractionError} If version not found or invalid
 * 
 * @example
 * ```typescript
 * const result = extractVersionFromEnv();
 * console.log(`Version: ${result.version}`);
 * ```
 */
export function extractVersionFromEnv(
  envVarName = "WIDGET_VERSION",
): VersionExtractionResult {
  const version = getVersionFromEnv(envVarName);

  if (!version) {
    throw new VersionExtractionError(
      `Version not found in environment variable ${envVarName}`,
    );
  }

  try {
    const parsed = assertValidSemanticVersion(version);
    return {
      version,
      parsed,
      source: "env",
    };
  } catch (error) {
    throw new VersionExtractionError(
      `Invalid version format in ${envVarName}: ${version}. ${(error as Error).message}`,
      error as Error,
    );
  }
}

