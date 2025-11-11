"use client";

import { useState, useEffect, useCallback } from "react";
import type { VersionManifest, UseVersionsResult } from "../types/versions";

/**
 * React hook to fetch and manage widget version information
 * 
 * Fetches the versions.json manifest file and provides:
 * - Loading state
 * - Error handling
 * - Automatic caching (data persists until component unmounts)
 * - Manual refetch capability
 * 
 * @param options - Configuration options
 * @param options.autoFetch - Whether to automatically fetch on mount (default: true)
 * @param options.manifestUrl - Custom URL for the manifest file (default: /versions.json)
 * 
 * @returns Object containing manifest data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * function VersionSelector() {
 *   const { manifest, isLoading, error, refetch } = useVersions();
 * 
 *   if (isLoading) return <div>Loading versions...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!manifest) return null;
 * 
 *   return (
 *     <select>
 *       {Object.keys(manifest.versions).map(version => (
 *         <option key={version} value={version}>
 *           v{version} {version === manifest.latest && '(latest)'}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useVersions(options?: {
  autoFetch?: boolean;
  manifestUrl?: string;
}): UseVersionsResult {
  const { autoFetch = true, manifestUrl = "/versions.json" } = options || {};

  const [manifest, setManifest] = useState<VersionManifest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the version manifest from the server
   */
  const fetchManifest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(manifestUrl, {
        cache: "no-store", // Always get fresh data, but we cache in state
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        // Handle different HTTP errors
        if (response.status === 404) {
          throw new Error(
            "Version manifest not found. The widget may not have been built yet.",
          );
        } else if (response.status >= 500) {
          throw new Error(
            `Server error while fetching versions (${response.status}). Please try again later.`,
          );
        } else {
          throw new Error(
            `Failed to fetch versions (${response.status}: ${response.statusText})`,
          );
        }
      }

      const data = await response.json();

      // Validate manifest structure
      if (!data || typeof data !== "object") {
        throw new Error("Invalid manifest format: expected an object");
      }

      if (!data.latest || typeof data.latest !== "string") {
        throw new Error("Invalid manifest format: missing or invalid 'latest' field");
      }

      if (!data.versions || typeof data.versions !== "object") {
        throw new Error("Invalid manifest format: missing or invalid 'versions' field");
      }

      // Validate that latest version exists in versions map
      if (!data.versions[data.latest]) {
        throw new Error(
          `Invalid manifest: latest version "${data.latest}" not found in versions map`,
        );
      }

      setManifest(data as VersionManifest);
    } catch (err) {
      // Handle different error types
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error: Unable to connect to server. Please check your connection.");
      } else if (err instanceof SyntaxError) {
        setError("Invalid JSON response from server. The manifest file may be corrupted.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching versions.");
      }
      
      console.error("Error fetching version manifest:", err);
    } finally {
      setIsLoading(false);
    }
  }, [manifestUrl]);

  /**
   * Public refetch function
   */
  const refetch = useCallback(async () => {
    await fetchManifest();
  }, [fetchManifest]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchManifest();
    }
  }, [autoFetch, fetchManifest]);

  return {
    manifest,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Helper function to format file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "245 KB", "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

/**
 * Helper function to format ISO date to human-readable format
 * 
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatVersionDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Helper function to sort version strings in descending order (newest first)
 * 
 * @param versions - Array of version strings
 * @returns Sorted array of version strings
 */
export function sortVersionsDescending(versions: string[]): string[] {
  return versions.sort((a, b) => {
    const parseVersion = (v: string) => {
      const match = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
      if (!match) return [0, 0, 0];
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    };

    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });
}

