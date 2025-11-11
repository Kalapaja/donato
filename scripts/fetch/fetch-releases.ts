/**
 * Fetch Releases Script
 * 
 * This script fetches all releases from the GitHub repository API,
 * parses release data, and extracts asset URLs for widget scripts and integrity files.
 * 
 * Responsibilities:
 * 1. Fetch all releases from GitHub repository API
 * 2. Parse release data and extract asset URLs
 * 3. Handle pagination for repositories with many releases
 * 4. Extract widget script and integrity file information
 * 
 * Usage:
 *   # With token (recommended for higher rate limits: 5000 req/hour)
 *   GITHUB_TOKEN=ghp_xxx \
 *   deno run --allow-net --allow-env www/scripts/fetch-releases.ts
 * 
 *   # Without token (60 req/hour limit for public repos)
 *   deno run --allow-net --allow-env www/scripts/fetch-releases.ts
 * 
 * Environment Variables:
 *   GITHUB_TOKEN - GitHub personal access token or Actions token (optional for public repos)
 * 
 * Note: Repository is hardcoded to Kalapaja/donato
 */

import { Octokit } from "npm:@octokit/rest@21.0.2";

/**
 * GitHub Release asset information
 */
export interface GitHubAsset {
  /** Asset name (e.g., "donation-widget.v1.0.0.js") */
  name: string;
  
  /** Browser download URL */
  browser_download_url: string;
  
  /** File size in bytes */
  size: number;
  
  /** Content type */
  content_type: string;
  
  /** Asset ID */
  id: number;
}

/**
 * GitHub Release information
 */
export interface GitHubRelease {
  /** Release ID */
  id: number;
  
  /** Tag name (e.g., "v1.0.0") */
  tag_name: string;
  
  /** Release name */
  name: string | null;
  
  /** Release body/notes */
  body: string | null;
  
  /** Publication timestamp */
  published_at: string | null;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Is draft release */
  draft: boolean;
  
  /** Is prerelease */
  prerelease: boolean;
  
  /** Release assets */
  assets: GitHubAsset[];
  
  /** Release URL */
  html_url: string;
}

/**
 * Widget release information extracted from GitHub Release
 */
export interface WidgetRelease {
  /** Version string (e.g., "1.0.0") */
  version: string;
  
  /** Tag name (e.g., "v1.0.0") */
  tag: string;
  
  /** Publication date (ISO 8601) */
  publishedAt: string;
  
  /** Release URL */
  releaseUrl: string;
  
  /** Widget script asset */
  scriptAsset: GitHubAsset | null;
  
  /** Integrity file asset */
  integrityAsset: GitHubAsset | null;
  
  /** Is prerelease */
  prerelease: boolean;
}

/**
 * Configuration for fetching releases
 */
export interface FetchReleasesConfig {
  /** GitHub token for API authentication (optional for public repos, recommended for higher rate limits) */
  githubToken?: string;
  
  /** Repository owner */
  owner: string;
  
  /** Repository name */
  repo: string;
  
  /** Maximum number of releases to fetch per page */
  perPage?: number;
  
  /** Include draft releases */
  includeDrafts?: boolean;
  
  /** Include prereleases */
  includePrereleases?: boolean;
}

/**
 * Result of fetching releases
 */
export interface FetchReleasesResult {
  /** All fetched widget releases */
  releases: WidgetRelease[];
  
  /** Total number of releases fetched from GitHub */
  totalFetched: number;
  
  /** Number of valid widget releases */
  validReleases: number;
  
  /** Number of prereleases */
  prereleases: number;
}

/**
 * Error thrown when fetch fails
 */
export class FetchError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "FetchError";
    this.cause = cause;
  }
}

/**
 * Gets configuration from environment variables
 */
export function getConfig(): FetchReleasesConfig {
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  
  // Token is optional for public repositories
  // Without token: 60 requests/hour (unauthenticated)
  // With token: 5000 requests/hour (authenticated)
  // In GitHub Actions, GITHUB_TOKEN is automatically available
  
  // Hardcoded repository: Kalapaja/donato
  const owner = "Kalapaja";
  const repo = "donato";
  
  return {
    githubToken: githubToken || undefined,
    owner,
    repo,
    perPage: 100, // GitHub API max per page
    includeDrafts: false,
    includePrereleases: true,
  };
}

/**
 * Extracts version from tag name
 * 
 * Handles formats:
 * - "v1.0.0" -> "1.0.0"
 * - "1.0.0" -> "1.0.0"
 * 
 * @param tagName - Git tag name
 * @returns Version string without 'v' prefix
 */
export function extractVersionFromTag(tagName: string): string {
  return tagName.replace(/^v/, "");
}

/**
 * Checks if an asset is a widget script file
 */
export function isWidgetScriptAsset(asset: GitHubAsset): boolean {
  return asset.name.startsWith("donation-widget.v") && 
         asset.name.endsWith(".js") &&
         !asset.name.endsWith(".integrity.txt");
}

/**
 * Checks if an asset is an integrity file
 */
export function isIntegrityAsset(asset: GitHubAsset): boolean {
  return asset.name.endsWith(".js.integrity.txt");
}

/**
 * Parses GitHub Release into WidgetRelease
 * 
 * @param release - GitHub Release data
 * @returns WidgetRelease or null if release is invalid
 */
export function parseRelease(release: GitHubRelease): WidgetRelease | null {
  // Extract version from tag
  const version = extractVersionFromTag(release.tag_name);
  
  // Find widget script asset
  const scriptAsset = release.assets.find(isWidgetScriptAsset) || null;
  
  // Find integrity file asset
  const integrityAsset = release.assets.find(isIntegrityAsset) || null;
  
  // Require published_at timestamp
  if (!release.published_at) {
    console.warn(`⚠️  Skipping release ${release.tag_name}: missing published_at`);
    return null;
  }
  
  return {
    version,
    tag: release.tag_name,
    publishedAt: release.published_at,
    releaseUrl: release.html_url,
    scriptAsset,
    integrityAsset,
    prerelease: release.prerelease,
  };
}

/**
 * Fetches all releases from GitHub repository with pagination
 * 
 * @param config - Fetch configuration
 * @returns Array of GitHub releases
 */
export async function fetchAllGitHubReleases(
  config: FetchReleasesConfig
): Promise<GitHubRelease[]> {
  console.log("📥 Fetching releases from GitHub...");
  console.log(`   Repository: ${config.owner}/${config.repo}`);
  
  // Token is optional for public repositories
  // Octokit works without auth, but with lower rate limits
  const octokit = new Octokit(
    config.githubToken ? { auth: config.githubToken } : undefined
  );
  
  const allReleases: GitHubRelease[] = [];
  let page = 1;
  let hasMore = true;
  
  try {
    while (hasMore) {
      console.log(`   Fetching page ${page}...`);
      
      const response = await octokit.rest.repos.listReleases({
        owner: config.owner,
        repo: config.repo,
        per_page: config.perPage || 100,
        page,
      });
      
      const releases = response.data as unknown as GitHubRelease[];
      
      if (releases.length === 0) {
        hasMore = false;
        break;
      }
      
      // Filter based on configuration
      const filtered = releases.filter(release => {
        if (!config.includeDrafts && release.draft) {
          return false;
        }
        if (!config.includePrereleases && release.prerelease) {
          return false;
        }
        return true;
      });
      
      allReleases.push(...filtered);
      
      // Check if there are more pages
      if (releases.length < (config.perPage || 100)) {
        hasMore = false;
      } else {
        page++;
      }
    }
    
    console.log(`✅ Fetched ${allReleases.length} releases from GitHub\n`);
    
    return allReleases;
  } catch (error) {
    if (error instanceof Error) {
      throw new FetchError(
        `Failed to fetch releases from GitHub: ${error.message}`,
        error
      );
    }
    throw new FetchError(
      `Failed to fetch releases from GitHub: ${String(error)}`
    );
  }
}

/**
 * Fetches and parses all widget releases
 * 
 * @param config - Fetch configuration
 * @returns Parsed widget releases
 */
export async function fetchWidgetReleases(
  config: FetchReleasesConfig
): Promise<FetchReleasesResult> {
  console.log("🚀 Fetching widget releases...\n");
  
  // Fetch all releases from GitHub
  const githubReleases = await fetchAllGitHubReleases(config);
  
  // Parse releases
  console.log("🔍 Parsing release data...");
  const widgetReleases: WidgetRelease[] = [];
  
  for (const release of githubReleases) {
    const parsed = parseRelease(release);
    if (parsed) {
      widgetReleases.push(parsed);
      
      const hasScript = parsed.scriptAsset ? "✓" : "✗";
      const hasIntegrity = parsed.integrityAsset ? "✓" : "✗";
      const prerelease = parsed.prerelease ? " (prerelease)" : "";
      
      console.log(`   ${parsed.tag}${prerelease}: script ${hasScript}, integrity ${hasIntegrity}`);
    }
  }
  
  console.log(`✅ Parsed ${widgetReleases.length} valid widget releases\n`);
  
  // Calculate stats
  const prereleases = widgetReleases.filter(r => r.prerelease).length;
  
  console.log("📊 Summary:");
  console.log(`   Total fetched:    ${githubReleases.length}`);
  console.log(`   Valid releases:   ${widgetReleases.length}`);
  console.log(`   Prereleases:      ${prereleases}`);
  console.log(`   Stable releases:  ${widgetReleases.length - prereleases}\n`);
  
  return {
    releases: widgetReleases,
    totalFetched: githubReleases.length,
    validReleases: widgetReleases.length,
    prereleases,
  };
}

/**
 * Configuration for downloading assets
 */
export interface DownloadAssetsConfig extends FetchReleasesConfig {
  /** Output directory for downloaded files */
  outputDir: string;
  
  /** Skip integrity verification */
  skipVerification?: boolean;
}

/**
 * Result of downloading assets for a single release
 */
export interface DownloadResult {
  /** Version that was downloaded */
  version: string;
  
  /** Path to downloaded script file (relative to outputDir) */
  scriptPath: string | null;
  
  /** Path to downloaded integrity file (relative to outputDir) */
  integrityPath: string | null;
  
  /** Whether integrity verification passed */
  verified: boolean;
  
  /** Error message if download failed */
  error?: string;
}

/**
 * Result of downloading all assets
 */
export interface DownloadAllResult {
  /** Individual download results */
  downloads: DownloadResult[];
  
  /** Total number of releases processed */
  total: number;
  
  /** Number of successful downloads */
  successful: number;
  
  /** Number of failed downloads */
  failed: number;
  
  /** Number of verified downloads */
  verified: number;
}

/**
 * Error thrown when download fails
 */
export class DownloadError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "DownloadError";
    this.cause = cause;
  }
}

/**
 * Downloads a file from a URL to a local path
 * 
 * @param url - URL to download from
 * @param outputPath - Local file path to save to
 * @throws DownloadError if download fails
 */
export async function downloadAsset(
  url: string,
  outputPath: string
): Promise<void> {
  try {
    console.log(`   Downloading: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new DownloadError(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const content = await response.arrayBuffer();
    await Deno.writeFile(outputPath, new Uint8Array(content));
    
    const sizeKB = (content.byteLength / 1024).toFixed(2);
    console.log(`   ✓ Saved: ${outputPath} (${sizeKB} KB)`);
  } catch (error) {
    if (error instanceof DownloadError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new DownloadError(`Failed to download ${url}: ${message}`, error as Error);
  }
}

/**
 * Verifies downloaded file integrity against integrity file
 * 
 * @param scriptPath - Path to the downloaded script file
 * @param integrityPath - Path to the integrity file
 * @returns Promise resolving to true if integrity matches
 */
export async function verifyDownloadedIntegrity(
  scriptPath: string,
  integrityPath: string
): Promise<boolean> {
  try {
    // Read expected integrity from file
    const integrityContent = await Deno.readTextFile(integrityPath);
    const expectedIntegrity = integrityContent.trim();
    
    // Calculate actual integrity
    const fileData = await Deno.readFile(scriptPath);
    const hashBuffer = await crypto.subtle.digest("SHA-384", fileData);
    const hashBase64 = btoa(
      String.fromCharCode(...new Uint8Array(hashBuffer))
    );
    const actualIntegrity = `sha384-${hashBase64}`;
    
    return actualIntegrity === expectedIntegrity;
  } catch (error) {
    console.error(`   ⚠️  Failed to verify integrity: ${error}`);
    return false;
  }
}

/**
 * Downloads assets for a single release
 * 
 * @param release - Widget release to download assets for
 * @param outputDir - Directory to save files to
 * @param skipVerification - Skip integrity verification
 * @returns Download result
 */
export async function downloadReleaseAssets(
  release: WidgetRelease,
  outputDir: string,
  skipVerification = false
): Promise<DownloadResult> {
  console.log(`\n📦 Processing ${release.tag}...`);
  
  const result: DownloadResult = {
    version: release.version,
    scriptPath: null,
    integrityPath: null,
    verified: false,
  };
  
  try {
    // Download script asset
    if (release.scriptAsset) {
      const scriptFilename = release.scriptAsset.name;
      const scriptPath = `${outputDir}/${scriptFilename}`;
      
      await downloadAsset(release.scriptAsset.browser_download_url, scriptPath);
      result.scriptPath = scriptFilename;
    } else {
      console.log(`   ⚠️  No script asset found`);
    }
    
    // Download integrity asset
    if (release.integrityAsset) {
      const integrityFilename = release.integrityAsset.name;
      const integrityPath = `${outputDir}/${integrityFilename}`;
      
      await downloadAsset(release.integrityAsset.browser_download_url, integrityPath);
      result.integrityPath = integrityFilename;
    } else {
      console.log(`   ⚠️  No integrity asset found`);
    }
    
    // Verify integrity
    if (!skipVerification && result.scriptPath && result.integrityPath) {
      console.log(`   🔐 Verifying integrity...`);
      
      const scriptFullPath = `${outputDir}/${result.scriptPath}`;
      const integrityFullPath = `${outputDir}/${result.integrityPath}`;
      
      result.verified = await verifyDownloadedIntegrity(
        scriptFullPath,
        integrityFullPath
      );
      
      if (result.verified) {
        console.log(`   ✅ Integrity verification passed`);
      } else {
        console.log(`   ❌ Integrity verification failed`);
        result.error = "Integrity verification failed";
      }
    } else if (skipVerification) {
      result.verified = true; // Consider verified when skipped
    }
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.error = message;
    console.log(`   ❌ Failed: ${message}`);
    return result;
  }
}

/**
 * Downloads all release assets
 * 
 * @param config - Download configuration
 * @returns Download results for all releases
 */
export async function downloadAllAssets(
  config: DownloadAssetsConfig
): Promise<DownloadAllResult> {
  console.log("🚀 Starting asset download process...\n");
  
  // Fetch releases
  const fetchResult = await fetchWidgetReleases(config);
  
  // Create output directory
  console.log(`\n📁 Creating output directory: ${config.outputDir}`);
  await Deno.mkdir(config.outputDir, { recursive: true });
  
  // Download assets for each release
  console.log(`\n⬇️  Downloading assets...`);
  const downloads: DownloadResult[] = [];
  
  for (const release of fetchResult.releases) {
    // Skip releases without any assets
    if (!release.scriptAsset && !release.integrityAsset) {
      console.log(`\n⏭️  Skipping ${release.tag} (no assets)`);
      continue;
    }
    
    const result = await downloadReleaseAssets(
      release,
      config.outputDir,
      config.skipVerification
    );
    downloads.push(result);
  }
  
  // Calculate statistics
  const successful = downloads.filter(d => !d.error).length;
  const failed = downloads.filter(d => d.error).length;
  const verified = downloads.filter(d => d.verified).length;
  
  console.log("\n📊 Download Summary:");
  console.log(`   Total releases:   ${downloads.length}`);
  console.log(`   Successful:       ${successful}`);
  console.log(`   Failed:           ${failed}`);
  console.log(`   Verified:         ${verified}`);
  console.log();
  
  return {
    downloads,
    total: downloads.length,
    successful,
    failed,
    verified,
  };
}

/**
 * Version entry in manifest
 */
export interface VersionEntry {
  /** Filename in public directory */
  file: string;
  
  /** SRI integrity hash (sha384-...) */
  integrity: string;
  
  /** File size in bytes */
  size: number;
  
  /** ISO 8601 publication timestamp */
  date: string;
  
  /** GitHub Release URL */
  releaseUrl: string;
}

/**
 * Version manifest structure
 */
export interface VersionManifest {
  /** Latest stable version */
  latest: string;
  
  /** All available versions */
  versions: Record<string, VersionEntry>;
}

/**
 * Error thrown when manifest generation fails
 */
export class ManifestError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "ManifestError";
    this.cause = cause;
  }
}

/**
 * Determines the latest stable version from releases
 * 
 * Latest version is:
 * 1. Not a prerelease
 * 2. Has both script and integrity assets
 * 3. Has the most recent published date
 * 
 * @param releases - Array of widget releases
 * @returns Latest stable version string or null if no stable releases
 */
export function determineLatestVersion(releases: WidgetRelease[]): string | null {
  // Filter to stable releases with both assets
  const stableReleases = releases.filter(
    r => !r.prerelease && r.scriptAsset && r.integrityAsset
  );
  
  if (stableReleases.length === 0) {
    return null;
  }
  
  // Sort by published date (newest first)
  stableReleases.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  
  return stableReleases[0].version;
}

/**
 * Reads integrity hash from a file
 * 
 * @param integrityPath - Path to integrity file
 * @returns Integrity hash string (e.g., "sha384-...")
 */
export async function readIntegrityFile(integrityPath: string): Promise<string> {
  try {
    const content = await Deno.readTextFile(integrityPath);
    return content.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ManifestError(`Failed to read integrity file: ${message}`, error as Error);
  }
}

/**
 * Generates version manifest from releases and downloaded assets
 * 
 * @param releases - Array of widget releases
 * @param outputDir - Directory containing downloaded assets
 * @returns Version manifest
 */
export async function generateManifest(
  releases: WidgetRelease[],
  outputDir: string
): Promise<VersionManifest> {
  console.log("📝 Generating versions.json manifest...");
  
  // Determine latest version
  const latest = determineLatestVersion(releases);
  
  if (!latest) {
    throw new ManifestError(
      "No stable releases found with required assets. " +
      "Cannot determine latest version."
    );
  }
  
  console.log(`   Latest version: ${latest}`);
  
  // Build versions object
  const versions: Record<string, VersionEntry> = {};
  let processedCount = 0;
  
  for (const release of releases) {
    // Skip releases without required assets
    if (!release.scriptAsset || !release.integrityAsset) {
      console.log(`   ⏭️  Skipping ${release.version} (missing assets)`);
      continue;
    }
    
    try {
      // Read integrity from downloaded file
      const integrityPath = `${outputDir}/${release.integrityAsset.name}`;
      const integrity = await readIntegrityFile(integrityPath);
      
      // Create version entry
      versions[release.version] = {
        file: release.scriptAsset.name,
        integrity,
        size: release.scriptAsset.size,
        date: release.publishedAt,
        releaseUrl: release.releaseUrl,
      };
      
      const prerelease = release.prerelease ? " (prerelease)" : "";
      console.log(`   ✓ Added ${release.version}${prerelease}`);
      processedCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ⚠️  Failed to process ${release.version}: ${message}`);
    }
  }
  
  if (processedCount === 0) {
    throw new ManifestError("No valid releases were processed. Cannot generate manifest.");
  }
  
  console.log(`   Processed ${processedCount} versions\n`);
  
  return {
    latest,
    versions,
  };
}

/**
 * Saves version manifest to JSON file
 * 
 * @param manifest - Version manifest to save
 * @param outputPath - Path to save manifest file
 */
export async function saveManifest(
  manifest: VersionManifest,
  outputPath: string
): Promise<void> {
  try {
    console.log(`💾 Saving manifest to ${outputPath}...`);
    
    const json = JSON.stringify(manifest, null, 2);
    await Deno.writeTextFile(outputPath, json + "\n");
    
    const versionCount = Object.keys(manifest.versions).length;
    console.log(`   ✓ Saved manifest with ${versionCount} versions`);
    console.log(`   ✓ Latest version: ${manifest.latest}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ManifestError(`Failed to save manifest: ${message}`, error as Error);
  }
}

/**
 * Configuration for generating and saving manifest
 */
export interface GenerateManifestConfig extends DownloadAssetsConfig {
  /** Path to save versions.json (defaults to outputDir/versions.json) */
  manifestPath?: string;
}

/**
 * Downloads assets and generates manifest
 * 
 * This is the main function that orchestrates:
 * 1. Downloading all release assets
 * 2. Generating versions.json manifest
 * 3. Saving manifest to output directory
 * 
 * @param config - Generation configuration
 * @returns Download result and manifest
 */
export async function downloadAndGenerateManifest(
  config: GenerateManifestConfig
): Promise<{ download: DownloadAllResult; manifest: VersionManifest }> {
  console.log("🚀 Starting download and manifest generation...\n");
  
  // Download all assets
  const downloadResult = await downloadAllAssets(config);
  
  if (downloadResult.successful === 0) {
    throw new ManifestError(
      "No assets were successfully downloaded. Cannot generate manifest."
    );
  }
  
  // Fetch releases again for manifest generation
  console.log("📥 Re-fetching release metadata for manifest...");
  const fetchResult = await fetchWidgetReleases(config);
  
  // Generate manifest
  const manifest = await generateManifest(fetchResult.releases, config.outputDir);
  
  // Save manifest
  const manifestPath = config.manifestPath || `${config.outputDir}/versions.json`;
  await saveManifest(manifest, manifestPath);
  
  console.log("✅ Download and manifest generation complete!\n");
  
  return {
    download: downloadResult,
    manifest,
  };
}

/**
 * CLI entry point
 */
if (import.meta.main) {
  try {
    const mode = Deno.args[0] || "build";
    
    if (mode === "download") {
      // Download mode - fetch and download all assets (without manifest)
      const config = getConfig();
      const outputDir = Deno.args[1] || "./www/public";
      
      const downloadConfig: DownloadAssetsConfig = {
        ...config,
        outputDir,
        skipVerification: false,
      };
      
      const result = await downloadAllAssets(downloadConfig);
      
      console.log("✅ Asset download complete!");
      
      Deno.exit(result.failed > 0 ? 1 : 0);
    } else if (mode === "build") {
      // Build mode - download assets and generate manifest (default for www build)
      const config = getConfig();
      const outputDir = Deno.args[1] || "./www/public";
      
      const generateConfig: GenerateManifestConfig = {
        ...config,
        outputDir,
        skipVerification: false,
      };
      
      const result = await downloadAndGenerateManifest(generateConfig);
      
      console.log("✅ Build complete!");
      console.log(`   ${result.download.successful} assets downloaded`);
      console.log(`   ${Object.keys(result.manifest.versions).length} versions in manifest`);
      console.log(`   Latest: ${result.manifest.latest}\n`);
      
      Deno.exit(result.download.failed > 0 ? 1 : 0);
    } else if (mode === "manifest") {
      // Manifest mode - only generate manifest from existing files
      const config = getConfig();
      const outputDir = Deno.args[1] || "./www/public";
      
      // Fetch releases
      const fetchResult = await fetchWidgetReleases(config);
      
      // Generate manifest
      const manifest = await generateManifest(fetchResult.releases, outputDir);
      
      // Save manifest
      const manifestPath = `${outputDir}/versions.json`;
      await saveManifest(manifest, manifestPath);
      
      console.log("✅ Manifest generation complete!");
      
      Deno.exit(0);
    } else if (mode === "fetch") {
      // Fetch mode - only fetch release metadata
      const config = getConfig();
      const result = await fetchWidgetReleases(config);
      
      // Output JSON for consumption by other scripts
      console.log("📤 Output:");
      console.log(JSON.stringify(result, null, 2));
      
      Deno.exit(0);
    } else {
      console.error("\n❌ Invalid mode. Usage:");
      console.error("   fetch    - Fetch release metadata only");
      console.error("   download - Download assets without manifest");
      console.error("   manifest - Generate manifest from existing files");
      console.error("   build    - Download assets and generate manifest (default)\n");
      
      Deno.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Failed:");
    
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

