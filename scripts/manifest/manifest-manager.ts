import {
  assertValidSemanticVersion,
  validateVersionEntry,
  validateVersionManifest,
  type VersionEntry,
  type VersionManifest,
} from "./manifest-types.ts";

/**
 * Manages the version manifest file (versions.json)
 * 
 * Provides methods for:
 * - Loading and saving the manifest
 * - Adding new versions
 * - Updating the latest version pointer
 * - Querying version information
 * 
 * Features atomic file writes to prevent corruption during concurrent access.
 * 
 * @example
 * ```typescript
 * const manager = new ManifestManager("dist/versions.json");
 * await manager.load();
 * 
 * await manager.addVersion("1.0.0", {
 *   file: "donation-widget.v1.0.0.js",
 *   integrity: "sha384-...",
 *   size: 12345,
 *   date: new Date().toISOString(),
 * });
 * 
 * await manager.setLatest("1.0.0");
 * await manager.save();
 * ```
 */
export class ManifestManager {
  private manifestPath: string;
  private manifest: VersionManifest;
  private loaded: boolean = false;

  /**
   * Creates a new ManifestManager instance
   * @param manifestPath - Path to the versions.json file
   */
  constructor(manifestPath: string) {
    this.manifestPath = manifestPath;
    this.manifest = {
      latest: "0.0.0-dev",
      versions: {},
    };
  }

  /**
   * Loads the manifest from disk
   * If the file doesn't exist, initializes with empty manifest
   * @returns The loaded manifest
   * @throws {Error} If the manifest file is corrupted or invalid
   */
  async load(): Promise<VersionManifest> {
    try {
      const content = await Deno.readTextFile(this.manifestPath);
      const parsed = JSON.parse(content) as VersionManifest;
      
      // Validate the loaded manifest
      validateVersionManifest(parsed);
      
      this.manifest = parsed;
      this.loaded = true;
      
      return this.manifest;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // File doesn't exist yet, start with empty manifest
        this.loaded = true;
        return this.manifest;
      }
      
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load manifest from ${this.manifestPath}: ${message}`,
      );
    }
  }

  /**
   * Adds a new version to the manifest
   * @param version - Semantic version string (e.g., "1.0.0")
   * @param entry - Version metadata
   * @throws {Error} If version already exists or is invalid
   */
  async addVersion(version: string, entry: VersionEntry): Promise<void> {
    this.ensureLoaded();
    
    // Validate version format
    const parsed = assertValidSemanticVersion(version);
    
    // Validate entry content
    validateVersionEntry(entry);
    
    // Check if version already exists
    if (this.manifest.versions[version]) {
      throw new Error(
        `Version ${version} already exists in manifest. Cannot overwrite existing versions.`,
      );
    }
    
    // Add semantic version metadata to entry if not present
    const entryWithMetadata: VersionEntry = {
      ...entry,
      major: entry.major ?? parsed.major,
      minor: entry.minor ?? parsed.minor,
      patch: entry.patch ?? parsed.patch,
    };
    
    // Add the version
    this.manifest.versions[version] = entryWithMetadata;
    
    // If this is the first version, set it as latest
    if (Object.keys(this.manifest.versions).length === 1) {
      this.manifest.latest = version;
    }
  }

  /**
   * Updates the latest version pointer
   * @param version - Version to set as latest
   * @throws {Error} If version doesn't exist in manifest
   */
  async setLatest(version: string): Promise<void> {
    this.ensureLoaded();
    
    // Validate version format
    assertValidSemanticVersion(version);
    
    // Check if version exists
    if (!this.manifest.versions[version]) {
      throw new Error(
        `Cannot set latest to ${version}: version does not exist in manifest`,
      );
    }
    
    this.manifest.latest = version;
  }

  /**
   * Saves the manifest to disk using atomic write
   * Writes to a temporary file first, then renames to prevent corruption
   */
  async save(): Promise<void> {
    this.ensureLoaded();
    
    // Validate before saving
    validateVersionManifest(this.manifest);
    
    // Atomic write: write to temp file, then rename
    const tempPath = `${this.manifestPath}.tmp`;
    const content = JSON.stringify(this.manifest, null, 2);
    
    try {
      // Write to temporary file
      await Deno.writeTextFile(tempPath, content);
      
      // Atomically rename temp file to target file
      await Deno.rename(tempPath, this.manifestPath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await Deno.remove(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to save manifest to ${this.manifestPath}: ${message}`,
      );
    }
  }

  /**
   * Gets metadata for a specific version
   * @param version - Version to retrieve
   * @returns Version metadata or null if not found
   */
  async getVersion(version: string): Promise<VersionEntry | null> {
    this.ensureLoaded();
    return this.manifest.versions[version] ?? null;
  }

  /**
   * Gets all available version strings, sorted from oldest to newest
   * @returns Array of version strings
   */
  async getAllVersions(): Promise<string[]> {
    this.ensureLoaded();
    
    const versions = Object.keys(this.manifest.versions);
    
    // Sort versions chronologically by comparing semantic versions
    return versions.sort((a, b) => {
      const versionA = assertValidSemanticVersion(a);
      const versionB = assertValidSemanticVersion(b);
      
      if (versionA.major !== versionB.major) {
        return versionA.major - versionB.major;
      }
      
      if (versionA.minor !== versionB.minor) {
        return versionA.minor - versionB.minor;
      }
      
      return versionA.patch - versionB.patch;
    });
  }

  /**
   * Gets the current latest version string
   * @returns Latest version
   */
  getLatest(): string {
    this.ensureLoaded();
    return this.manifest.latest;
  }

  /**
   * Gets the entire manifest
   * @returns Current manifest
   */
  getManifest(): VersionManifest {
    this.ensureLoaded();
    return this.manifest;
  }

  /**
   * Checks if the manifest has been loaded
   * @throws {Error} If manifest hasn't been loaded
   */
  private ensureLoaded(): void {
    if (!this.loaded) {
      throw new Error(
        "Manifest not loaded. Call load() before performing operations.",
      );
    }
  }
}

