/**
 * Represents metadata for a specific version of the widget
 */
export interface VersionEntry {
  /** Filename in dist directory (e.g., "donation-widget.v1.0.0.js") */
  file: string;

  /** SRI integrity hash (e.g., "sha384-...") */
  integrity: string;

  /** File size in bytes */
  size: number;

  /** ISO 8601 timestamp of when this version was built */
  date: string;

  /** Optional: Major version number */
  major?: number;

  /** Optional: Minor version number */
  minor?: number;

  /** Optional: Patch version number */
  patch?: number;
}

/**
 * Represents the complete version manifest containing all available versions
 */
export interface VersionManifest {
  /** Latest stable version (semantic version string) */
  latest: string;

  /** Map of version strings to their metadata */
  versions: Record<string, VersionEntry>;
}

/**
 * Semantic version validation result
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

/**
 * Regular expression for validating semantic version format
 * Matches: 1.0.0, 1.2.3, 10.20.30, etc.
 * Does not match: v1.0.0, 1.0, 1, 1.0.0-alpha, etc.
 */
const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * Validates a semantic version string
 * @param version - The version string to validate (e.g., "1.0.0")
 * @returns The parsed semantic version or null if invalid
 * 
 * @example
 * ```typescript
 * const version = validateSemanticVersion("1.2.3");
 * if (version) {
 *   console.log(`Valid version: ${version.major}.${version.minor}.${version.patch}`);
 * }
 * ```
 */
export function validateSemanticVersion(
  version: string,
): SemanticVersion | null {
  const match = version.match(SEMVER_REGEX);

  if (!match) {
    return null;
  }

  const [, major, minor, patch] = match;

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    raw: version,
  };
}

/**
 * Validates and throws an error if the version is invalid
 * @param version - The version string to validate
 * @throws {Error} If the version format is invalid
 * @returns The parsed semantic version
 * 
 * @example
 * ```typescript
 * try {
 *   const version = assertValidSemanticVersion("1.2.3");
 *   console.log("Version is valid");
 * } catch (error) {
 *   console.error("Invalid version:", error.message);
 * }
 * ```
 */
export function assertValidSemanticVersion(version: string): SemanticVersion {
  const result = validateSemanticVersion(version);

  if (!result) {
    throw new Error(
      `Invalid semantic version format: "${version}". Expected format: "major.minor.patch" (e.g., "1.0.0")`,
    );
  }

  return result;
}

/**
 * Compares two semantic versions
 * @param a - First version string
 * @param b - Second version string
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 * @throws {Error} If either version is invalid
 * 
 * @example
 * ```typescript
 * compareVersions("1.0.0", "1.2.0"); // Returns -1
 * compareVersions("2.0.0", "1.9.9"); // Returns 1
 * compareVersions("1.5.3", "1.5.3"); // Returns 0
 * ```
 */
export function compareVersions(a: string, b: string): number {
  const versionA = assertValidSemanticVersion(a);
  const versionB = assertValidSemanticVersion(b);

  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }

  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }

  return versionA.patch - versionB.patch;
}

/**
 * Checks if a version string is valid semantic version format
 * @param version - The version string to check
 * @returns True if valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidSemanticVersion("1.2.3"); // true
 * isValidSemanticVersion("v1.2.3"); // false
 * isValidSemanticVersion("1.2"); // false
 * ```
 */
export function isValidSemanticVersion(version: string): boolean {
  return validateSemanticVersion(version) !== null;
}

/**
 * Validates a VersionEntry object
 * @param entry - The version entry to validate
 * @throws {Error} If the entry is invalid
 */
export function validateVersionEntry(entry: VersionEntry): void {
  if (!entry.file || typeof entry.file !== "string") {
    throw new Error("VersionEntry.file must be a non-empty string");
  }

  if (!entry.integrity || typeof entry.integrity !== "string") {
    throw new Error("VersionEntry.integrity must be a non-empty string");
  }

  if (!entry.integrity.startsWith("sha384-")) {
    throw new Error(
      "VersionEntry.integrity must be a SHA-384 hash starting with 'sha384-'",
    );
  }

  if (typeof entry.size !== "number" || entry.size < 0) {
    throw new Error("VersionEntry.size must be a non-negative number");
  }

  if (!entry.date || typeof entry.date !== "string") {
    throw new Error("VersionEntry.date must be a non-empty string");
  }

  // Validate ISO 8601 date format
  const date = new Date(entry.date);
  if (isNaN(date.getTime())) {
    throw new Error(
      `VersionEntry.date must be a valid ISO 8601 date string, got: "${entry.date}"`,
    );
  }

  // Validate optional semantic version parts
  if (entry.major !== undefined) {
    if (typeof entry.major !== "number" || entry.major < 0) {
      throw new Error("VersionEntry.major must be a non-negative number");
    }
  }

  if (entry.minor !== undefined) {
    if (typeof entry.minor !== "number" || entry.minor < 0) {
      throw new Error("VersionEntry.minor must be a non-negative number");
    }
  }

  if (entry.patch !== undefined) {
    if (typeof entry.patch !== "number" || entry.patch < 0) {
      throw new Error("VersionEntry.patch must be a non-negative number");
    }
  }
}

/**
 * Validates a VersionManifest object
 * @param manifest - The version manifest to validate
 * @throws {Error} If the manifest is invalid
 */
export function validateVersionManifest(manifest: VersionManifest): void {
  if (!manifest.latest || typeof manifest.latest !== "string") {
    throw new Error("VersionManifest.latest must be a non-empty string");
  }

  // Validate latest version format
  assertValidSemanticVersion(manifest.latest);

  if (!manifest.versions || typeof manifest.versions !== "object") {
    throw new Error("VersionManifest.versions must be an object");
  }

  // Validate each version entry
  for (const [version, entry] of Object.entries(manifest.versions)) {
    // Validate version key format
    assertValidSemanticVersion(version);

    // Validate entry content
    validateVersionEntry(entry);

    // Ensure version metadata matches if present
    const parsed = validateSemanticVersion(version);
    if (parsed) {
      if (entry.major !== undefined && entry.major !== parsed.major) {
        throw new Error(
          `VersionEntry.major (${entry.major}) does not match version key (${parsed.major})`,
        );
      }
      if (entry.minor !== undefined && entry.minor !== parsed.minor) {
        throw new Error(
          `VersionEntry.minor (${entry.minor}) does not match version key (${parsed.minor})`,
        );
      }
      if (entry.patch !== undefined && entry.patch !== parsed.patch) {
        throw new Error(
          `VersionEntry.patch (${entry.patch}) does not match version key (${parsed.patch})`,
        );
      }
    }
  }

  // Ensure latest version exists in versions map
  if (!manifest.versions[manifest.latest]) {
    throw new Error(
      `VersionManifest.latest ("${manifest.latest}") does not exist in versions map`,
    );
  }
}

