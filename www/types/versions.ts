/**
 * Type definitions for widget versioning
 * Mirrors types from scripts/manifest-types.ts for frontend use
 */

/**
 * Represents metadata for a specific version of the widget
 */
export interface VersionEntry {
  /** Filename in public directory (e.g., "donation-widget.v1.0.0.js") */
  file: string;

  /** SRI integrity hash (e.g., "sha384-...") */
  integrity: string;

  /** File size in bytes */
  size: number;

  /** ISO 8601 timestamp of when this version was built */
  date: string;

  /** URL to the GitHub Release */
  releaseUrl: string;

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
 * State for the version fetching hook
 */
export interface UseVersionsResult {
  /** The version manifest data, null if not loaded yet */
  manifest: VersionManifest | null;

  /** Loading state - true while fetching */
  isLoading: boolean;

  /** Error message if fetch failed, null otherwise */
  error: string | null;

  /** Manually trigger a refetch of the manifest */
  refetch: () => Promise<void>;
}

