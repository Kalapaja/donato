/**
 * Update Release Notes Script
 * 
 * This script updates GitHub Release notes with comprehensive installation
 * and security information, including SRI integrity hashes.
 * 
 * Responsibilities:
 * 1. Read widget file to get size
 * 2. Generate embed code with SRI
 * 3. Format comprehensive release notes
 * 4. Update GitHub Release via API
 * 
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx \
 *   RELEASE_ID=123456 \
 *   VERSION=1.0.0 \
 *   INTEGRITY=sha384-xxx \
 *   WIDGET_FILE=dist/donation-widget.v1.0.0.js \
 *   deno run --allow-read --allow-net --allow-env scripts/update-release-notes.ts
 * 
 * Environment Variables:
 *   GITHUB_TOKEN - GitHub personal access token or Actions token
 *   RELEASE_ID - GitHub Release ID
 *   VERSION - Widget version (e.g., "1.0.0")
 *   INTEGRITY - SRI integrity hash (e.g., "sha384-...")
 *   WIDGET_FILE - Path to widget file
 * 
 * Note: Repository is hardcoded to Kalapaja/donato
 */

import { Octokit } from "npm:@octokit/rest@21.0.2";

/**
 * Configuration for release notes update
 */
interface ReleaseNotesConfig {
  /** GitHub token for API authentication */
  githubToken: string;
  
  /** Repository owner */
  owner: string;
  
  /** Repository name */
  repo: string;
  
  /** Release ID */
  releaseId: number;
  
  /** Widget version */
  version: string;
  
  /** SRI integrity hash */
  integrity: string;
  
  /** Path to widget file */
  widgetFile: string;
  
  /** CDN domain for embed code */
  cdnDomain: string;
}

/**
 * Error thrown when update fails
 */
class UpdateError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "UpdateError";
    this.cause = cause;
  }
}

/**
 * Gets configuration from environment variables
 */
function getConfig(): ReleaseNotesConfig {
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (!githubToken) {
    throw new UpdateError(
      "GITHUB_TOKEN environment variable is required.\n" +
      "In GitHub Actions, this is automatically available.\n" +
      "For local testing, create a personal access token with 'repo' scope:\n" +
      "  https://github.com/settings/tokens"
    );
  }
  
  // Hardcoded repository: Kalapaja/donato
  const owner = "Kalapaja";
  const repo = "donato";
  
  const releaseIdStr = Deno.env.get("RELEASE_ID");
  if (!releaseIdStr) {
    throw new UpdateError("RELEASE_ID environment variable is required");
  }
  
  const releaseId = parseInt(releaseIdStr, 10);
  if (isNaN(releaseId)) {
    throw new UpdateError(
      `Invalid RELEASE_ID: "${releaseIdStr}"\n` +
      `Expected a numeric ID`
    );
  }
  
  const version = Deno.env.get("VERSION");
  if (!version) {
    throw new UpdateError("VERSION environment variable is required");
  }
  
  const integrity = Deno.env.get("INTEGRITY");
  if (!integrity) {
    throw new UpdateError("INTEGRITY environment variable is required");
  }
  
  const widgetFile = Deno.env.get("WIDGET_FILE");
  if (!widgetFile) {
    throw new UpdateError("WIDGET_FILE environment variable is required");
  }
  
  const cdnDomain = "cdn.donations.kalatori.org";
  
  return {
    githubToken,
    owner,
    repo,
    releaseId,
    version,
    integrity,
    widgetFile,
    cdnDomain,
  };
}

/**
 * Gets file size in KB
 */
async function getFileSize(filePath: string): Promise<string> {
  try {
    const stat = await Deno.stat(filePath);
    const sizeKB = (stat.size / 1024).toFixed(2);
    return sizeKB;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new UpdateError(
        `Widget file not found: ${filePath}\n` +
        `Make sure the build completed successfully before updating release notes.`
      );
    }
    throw new UpdateError(
      `Failed to read file stats: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Generates embed code example
 */
function generateEmbedCode(
  version: string,
  integrity: string,
  cdnDomain: string
): string {
  return `\`\`\`html
<script 
  src="https://${cdnDomain}/donation-widget.v${version}.js"
  integrity="${integrity}"
  crossorigin="anonymous"
></script>

<donation-widget
  recipient="0x..."
  recipient-chain-id="1"
  recipient-token-address="0x..."
  theme="light"
></donation-widget>
\`\`\``;
}

/**
 * Generates comprehensive release notes
 */
function generateReleaseNotes(
  existingBody: string,
  version: string,
  integrity: string,
  fileSizeKB: string,
  cdnDomain: string,
  owner: string,
  repo: string
): string {
  const embedCode = generateEmbedCode(version, integrity, cdnDomain);
  
  return `${existingBody}

## 📦 Installation

### Using CDN with Subresource Integrity (SRI)

${embedCode}

## 📋 Release Assets

| File | Description | Size |
|------|-------------|------|
| \`donation-widget.v${version}.js\` | Widget bundle | ${fileSizeKB} KB |
| \`donation-widget.v${version}.js.integrity.txt\` | SRI integrity hash | - |

## 🔒 Security

This release includes **Subresource Integrity (SRI)** verification to ensure the widget has not been tampered with during delivery.

**Integrity Hash (SHA-384):** 
\`\`\`
${integrity}
\`\`\`

### What is SRI?

Subresource Integrity is a security feature that enables browsers to verify that files they fetch are delivered without unexpected manipulation. When you include the \`integrity\` attribute in your script tag, the browser will:

1. Download the script
2. Calculate its SHA-384 hash
3. Compare it with the hash in the \`integrity\` attribute
4. Only execute the script if the hashes match

This protects your users from compromised or malicious CDN content.

## 🚀 Quick Start

1. Copy the embed code above
2. Replace \`${cdnDomain}\` with your actual domain
3. Configure the widget attributes (recipient, chain, token, theme)
4. Paste into your HTML

For more information, visit the [documentation](https://github.com/${owner}/${repo}#readme).`;
}

/**
 * Updates GitHub Release notes
 */
async function updateReleaseNotes(config: ReleaseNotesConfig): Promise<void> {
  console.log("🚀 Starting release notes update...\n");
  console.log("📋 Configuration:");
  console.log(`   Repository:  ${config.owner}/${config.repo}`);
  console.log(`   Release ID:  ${config.releaseId}`);
  console.log(`   Version:     ${config.version}`);
  console.log(`   Widget file: ${config.widgetFile}`);
  console.log(`   CDN domain:  ${config.cdnDomain}\n`);
  
  // Step 1: Get file size
  console.log("📊 Reading widget file size...");
  const fileSizeKB = await getFileSize(config.widgetFile);
  console.log(`✅ File size: ${fileSizeKB} KB\n`);
  
  // Step 2: Initialize Octokit
  console.log("🔌 Connecting to GitHub API...");
  const octokit = new Octokit({
    auth: config.githubToken,
  });
  
  // Step 3: Get current release
  console.log("📥 Fetching current release...");
  let existingBody: string;
  try {
    const { data: release } = await octokit.rest.repos.getRelease({
      owner: config.owner,
      repo: config.repo,
      release_id: config.releaseId,
    });
    existingBody = release.body || "";
    console.log(`✅ Found release: ${release.name || release.tag_name}\n`);
  } catch (error) {
    throw new UpdateError(
      `Failed to fetch release: ${(error as Error).message}`,
      error as Error
    );
  }
  
  // Step 4: Generate release notes
  console.log("📝 Generating release notes...");
  const releaseNotes = generateReleaseNotes(
    existingBody,
    config.version,
    config.integrity,
    fileSizeKB,
    config.cdnDomain,
    config.owner,
    config.repo
  );
  console.log("✅ Release notes generated\n");
  
  // Step 5: Update release
  console.log("📤 Updating release...");
  try {
    await octokit.rest.repos.updateRelease({
      owner: config.owner,
      repo: config.repo,
      release_id: config.releaseId,
      body: releaseNotes,
    });
    console.log("✅ Release notes updated successfully\n");
  } catch (error) {
    throw new UpdateError(
      `Failed to update release: ${(error as Error).message}`,
      error as Error
    );
  }
  
  console.log("✨ Release notes update complete!\n");
  console.log("🔗 View release at:");
  console.log(`   https://github.com/${config.owner}/${config.repo}/releases/tag/v${config.version}`);
}

/**
 * CLI entry point
 */
if (import.meta.main) {
  try {
    const config = getConfig();
    await updateReleaseNotes(config);
    Deno.exit(0);
  } catch (error) {
    console.error("\n❌ Release notes update failed:");
    
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

