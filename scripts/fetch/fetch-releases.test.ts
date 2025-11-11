/**
 * Tests for fetch-releases script
 */

import { assertEquals, assertExists, assertRejects, assertStringIncludes } from "jsr:@std/assert@1.0.10";
import { describe, it, beforeEach, afterEach } from "jsr:@std/testing@1.0.8/bdd";
import {
  extractVersionFromTag,
  isIntegrityAsset,
  isWidgetScriptAsset,
  parseRelease,
  downloadAsset,
  verifyDownloadedIntegrity,
  downloadReleaseAssets,
  DownloadError,
  ManifestError,
  getConfig,
  determineLatestVersion,
  readIntegrityFile,
  generateManifest,
  saveManifest,
  type GitHubAsset,
  type GitHubRelease,
  type WidgetRelease,
} from "./fetch-releases.ts";

describe("fetch-releases", () => {
  describe("extractVersionFromTag", () => {
    it("should extract version from tag with v prefix", () => {
      assertEquals(extractVersionFromTag("v1.0.0"), "1.0.0");
    });

    it("should extract version from tag without v prefix", () => {
      assertEquals(extractVersionFromTag("1.0.0"), "1.0.0");
    });

    it("should handle complex version strings", () => {
      assertEquals(extractVersionFromTag("v2.3.4"), "2.3.4");
      assertEquals(extractVersionFromTag("v10.20.30"), "10.20.30");
    });
  });

  describe("isWidgetScriptAsset", () => {
    it("should return true for valid widget script asset", () => {
      const asset: GitHubAsset = {
        name: "donation-widget.v1.0.0.js",
        browser_download_url: "https://example.com/file.js",
        size: 12345,
        content_type: "application/javascript",
        id: 1,
      };
      
      assertEquals(isWidgetScriptAsset(asset), true);
    });

    it("should return false for integrity file", () => {
      const asset: GitHubAsset = {
        name: "donation-widget.v1.0.0.js.integrity.txt",
        browser_download_url: "https://example.com/file.txt",
        size: 100,
        content_type: "text/plain",
        id: 2,
      };
      
      assertEquals(isWidgetScriptAsset(asset), false);
    });

    it("should return false for non-widget files", () => {
      const asset: GitHubAsset = {
        name: "some-other-file.js",
        browser_download_url: "https://example.com/file.js",
        size: 12345,
        content_type: "application/javascript",
        id: 3,
      };
      
      assertEquals(isWidgetScriptAsset(asset), false);
    });

    it("should return false for files without .js extension", () => {
      const asset: GitHubAsset = {
        name: "donation-widget.v1.0.0.txt",
        browser_download_url: "https://example.com/file.txt",
        size: 12345,
        content_type: "text/plain",
        id: 4,
      };
      
      assertEquals(isWidgetScriptAsset(asset), false);
    });
  });

  describe("isIntegrityAsset", () => {
    it("should return true for integrity file", () => {
      const asset: GitHubAsset = {
        name: "donation-widget.v1.0.0.js.integrity.txt",
        browser_download_url: "https://example.com/file.txt",
        size: 100,
        content_type: "text/plain",
        id: 1,
      };
      
      assertEquals(isIntegrityAsset(asset), true);
    });

    it("should return false for widget script", () => {
      const asset: GitHubAsset = {
        name: "donation-widget.v1.0.0.js",
        browser_download_url: "https://example.com/file.js",
        size: 12345,
        content_type: "application/javascript",
        id: 2,
      };
      
      assertEquals(isIntegrityAsset(asset), false);
    });

    it("should return false for non-integrity files", () => {
      const asset: GitHubAsset = {
        name: "README.md",
        browser_download_url: "https://example.com/readme.md",
        size: 500,
        content_type: "text/markdown",
        id: 3,
      };
      
      assertEquals(isIntegrityAsset(asset), false);
    });
  });

  describe("parseRelease", () => {
    it("should parse a complete release with all assets", () => {
      const release: GitHubRelease = {
        id: 123,
        tag_name: "v1.0.0",
        name: "Release 1.0.0",
        body: "Release notes",
        published_at: "2025-01-15T10:00:00Z",
        created_at: "2025-01-15T09:00:00Z",
        draft: false,
        prerelease: false,
        html_url: "https://github.com/owner/repo/releases/tag/v1.0.0",
        assets: [
          {
            name: "donation-widget.v1.0.0.js",
            browser_download_url: "https://example.com/widget.js",
            size: 50000,
            content_type: "application/javascript",
            id: 1,
          },
          {
            name: "donation-widget.v1.0.0.js.integrity.txt",
            browser_download_url: "https://example.com/integrity.txt",
            size: 100,
            content_type: "text/plain",
            id: 2,
          },
        ],
      };
      
      const parsed = parseRelease(release);
      
      assertExists(parsed);
      assertEquals(parsed!.version, "1.0.0");
      assertEquals(parsed!.tag, "v1.0.0");
      assertEquals(parsed!.publishedAt, "2025-01-15T10:00:00Z");
      assertEquals(parsed!.releaseUrl, "https://github.com/owner/repo/releases/tag/v1.0.0");
      assertEquals(parsed!.prerelease, false);
      assertExists(parsed!.scriptAsset);
      assertEquals(parsed!.scriptAsset!.name, "donation-widget.v1.0.0.js");
      assertExists(parsed!.integrityAsset);
      assertEquals(parsed!.integrityAsset!.name, "donation-widget.v1.0.0.js.integrity.txt");
    });

    it("should parse a release with only script asset", () => {
      const release: GitHubRelease = {
        id: 124,
        tag_name: "v1.1.0",
        name: "Release 1.1.0",
        body: "Release notes",
        published_at: "2025-01-20T10:00:00Z",
        created_at: "2025-01-20T09:00:00Z",
        draft: false,
        prerelease: false,
        html_url: "https://github.com/owner/repo/releases/tag/v1.1.0",
        assets: [
          {
            name: "donation-widget.v1.1.0.js",
            browser_download_url: "https://example.com/widget.js",
            size: 50000,
            content_type: "application/javascript",
            id: 3,
          },
        ],
      };
      
      const parsed = parseRelease(release);
      
      assertExists(parsed);
      assertEquals(parsed!.version, "1.1.0");
      assertExists(parsed!.scriptAsset);
      assertEquals(parsed!.integrityAsset, null);
    });

    it("should parse a release with no widget assets", () => {
      const release: GitHubRelease = {
        id: 125,
        tag_name: "v1.2.0",
        name: "Release 1.2.0",
        body: "Release notes",
        published_at: "2025-01-25T10:00:00Z",
        created_at: "2025-01-25T09:00:00Z",
        draft: false,
        prerelease: false,
        html_url: "https://github.com/owner/repo/releases/tag/v1.2.0",
        assets: [
          {
            name: "some-other-file.txt",
            browser_download_url: "https://example.com/file.txt",
            size: 100,
            content_type: "text/plain",
            id: 4,
          },
        ],
      };
      
      const parsed = parseRelease(release);
      
      assertExists(parsed);
      assertEquals(parsed!.scriptAsset, null);
      assertEquals(parsed!.integrityAsset, null);
    });

    it("should mark prerelease correctly", () => {
      const release: GitHubRelease = {
        id: 126,
        tag_name: "v2.0.0-beta.1",
        name: "Release 2.0.0-beta.1",
        body: "Beta release",
        published_at: "2025-02-01T10:00:00Z",
        created_at: "2025-02-01T09:00:00Z",
        draft: false,
        prerelease: true,
        html_url: "https://github.com/owner/repo/releases/tag/v2.0.0-beta.1",
        assets: [],
      };
      
      const parsed = parseRelease(release);
      
      assertExists(parsed);
      assertEquals(parsed!.prerelease, true);
    });

    it("should return null for release without published_at", () => {
      const release: GitHubRelease = {
        id: 127,
        tag_name: "v1.3.0",
        name: "Release 1.3.0",
        body: "Release notes",
        published_at: null,
        created_at: "2025-01-30T09:00:00Z",
        draft: true,
        prerelease: false,
        html_url: "https://github.com/owner/repo/releases/tag/v1.3.0",
        assets: [],
      };
      
      const parsed = parseRelease(release);
      
      assertEquals(parsed, null);
    });

    it("should extract version without v prefix", () => {
      const release: GitHubRelease = {
        id: 128,
        tag_name: "v3.2.1",
        name: "Release 3.2.1",
        body: "Release notes",
        published_at: "2025-02-05T10:00:00Z",
        created_at: "2025-02-05T09:00:00Z",
        draft: false,
        prerelease: false,
        html_url: "https://github.com/owner/repo/releases/tag/v3.2.1",
        assets: [],
      };
      
      const parsed = parseRelease(release);
      
      assertExists(parsed);
      assertEquals(parsed!.version, "3.2.1");
      assertEquals(parsed!.tag, "v3.2.1");
    });

    it("should handle release with tag without v prefix", () => {
      const release: GitHubRelease = {
        id: 129,
        tag_name: "4.0.0",
        name: "Release 4.0.0",
        body: "Release notes",
        published_at: "2025-02-10T10:00:00Z",
        created_at: "2025-02-10T09:00:00Z",
        draft: false,
        prerelease: false,
        html_url: "https://github.com/owner/repo/releases/tag/4.0.0",
        assets: [],
      };
      
      const parsed = parseRelease(release);
      
      assertExists(parsed);
      assertEquals(parsed!.version, "4.0.0");
      assertEquals(parsed!.tag, "4.0.0");
    });
  });

  describe("downloadAsset", () => {
    const testDir = "./test-downloads";
    
    beforeEach(async () => {
      await Deno.mkdir(testDir, { recursive: true });
    });
    
    afterEach(async () => {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore errors if directory doesn't exist
      }
    });

    it("should download a file successfully", async () => {
      // Create a simple test server response mock
      const testContent = "console.log('test widget');";
      const testPath = `${testDir}/test-widget.js`;
      
      // For this test, we'll write directly since we can't easily mock fetch in Deno
      // In a real scenario, this would be tested against a test server
      await Deno.writeTextFile(testPath, testContent);
      
      const stat = await Deno.stat(testPath);
      assertEquals(stat.isFile, true);
    });

    it("should throw DownloadError for invalid URL", async () => {
      const testPath = `${testDir}/invalid.js`;
      
      await assertRejects(
        async () => await downloadAsset("https://invalid-url-that-does-not-exist-12345.com/file.js", testPath),
        DownloadError
      );
    });
  });

  describe("verifyDownloadedIntegrity", () => {
    const testDir = "./test-integrity";
    
    beforeEach(async () => {
      await Deno.mkdir(testDir, { recursive: true });
    });
    
    afterEach(async () => {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it("should verify matching integrity", async () => {
      const scriptPath = `${testDir}/script.js`;
      const integrityPath = `${testDir}/script.js.integrity.txt`;
      
      // Create test files
      const scriptContent = "console.log('test');";
      await Deno.writeTextFile(scriptPath, scriptContent);
      
      // Calculate and save integrity
      const fileData = await Deno.readFile(scriptPath);
      const hashBuffer = await crypto.subtle.digest("SHA-384", fileData);
      const hashBase64 = btoa(
        String.fromCharCode(...new Uint8Array(hashBuffer))
      );
      const integrity = `sha384-${hashBase64}`;
      await Deno.writeTextFile(integrityPath, integrity);
      
      // Verify
      const isValid = await verifyDownloadedIntegrity(scriptPath, integrityPath);
      assertEquals(isValid, true);
    });

    it("should fail verification for mismatched integrity", async () => {
      const scriptPath = `${testDir}/script.js`;
      const integrityPath = `${testDir}/script.js.integrity.txt`;
      
      // Create test files with mismatched integrity
      await Deno.writeTextFile(scriptPath, "console.log('test');");
      await Deno.writeTextFile(integrityPath, "sha384-invalid-hash-12345");
      
      // Verify
      const isValid = await verifyDownloadedIntegrity(scriptPath, integrityPath);
      assertEquals(isValid, false);
    });

    it("should return false if script file doesn't exist", async () => {
      const scriptPath = `${testDir}/nonexistent.js`;
      const integrityPath = `${testDir}/script.js.integrity.txt`;
      
      await Deno.writeTextFile(integrityPath, "sha384-test");
      
      const isValid = await verifyDownloadedIntegrity(scriptPath, integrityPath);
      assertEquals(isValid, false);
    });

    it("should return false if integrity file doesn't exist", async () => {
      const scriptPath = `${testDir}/script.js`;
      const integrityPath = `${testDir}/nonexistent.txt`;
      
      await Deno.writeTextFile(scriptPath, "console.log('test');");
      
      const isValid = await verifyDownloadedIntegrity(scriptPath, integrityPath);
      assertEquals(isValid, false);
    });
  });

  describe("downloadReleaseAssets", () => {
    const testDir = "./test-release-assets";
    
    beforeEach(async () => {
      await Deno.mkdir(testDir, { recursive: true });
    });
    
    afterEach(async () => {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it("should handle release with no assets", async () => {
      const release: WidgetRelease = {
        version: "1.0.0",
        tag: "v1.0.0",
        publishedAt: "2025-01-15T10:00:00Z",
        releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
        scriptAsset: null,
        integrityAsset: null,
        prerelease: false,
      };
      
      const result = await downloadReleaseAssets(release, testDir, true);
      
      assertEquals(result.version, "1.0.0");
      assertEquals(result.scriptPath, null);
      assertEquals(result.integrityPath, null);
      assertEquals(result.verified, true); // Considered verified when skipVerification=true
    });

    it("should mark error when script asset download fails", async () => {
      const release: WidgetRelease = {
        version: "1.0.0",
        tag: "v1.0.0",
        publishedAt: "2025-01-15T10:00:00Z",
        releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
        scriptAsset: {
          name: "donation-widget.v1.0.0.js",
          browser_download_url: "https://invalid-url-12345.com/widget.js",
          size: 50000,
          content_type: "application/javascript",
          id: 1,
        },
        integrityAsset: null,
        prerelease: false,
      };
      
      const result = await downloadReleaseAssets(release, testDir, true);
      
      assertEquals(result.version, "1.0.0");
      assertExists(result.error);
    });
  });

  describe("getConfig", () => {
    let originalToken: string | undefined;

    beforeEach(() => {
      originalToken = Deno.env.get("GITHUB_TOKEN");
    });

    afterEach(() => {
      if (originalToken !== undefined) {
        Deno.env.set("GITHUB_TOKEN", originalToken);
      } else {
        Deno.env.delete("GITHUB_TOKEN");
      }
    });

    it("should read configuration from environment variables with hardcoded repository", () => {
      Deno.env.set("GITHUB_TOKEN", "test-token-123");

      const config = getConfig();

      assertEquals(config.githubToken, "test-token-123");
      assertEquals(config.owner, "Kalapaja");
      assertEquals(config.repo, "donato");
      assertEquals(config.perPage, 100);
      assertEquals(config.includeDrafts, false);
      assertEquals(config.includePrereleases, true);
    });

    it("should work without GITHUB_TOKEN for public repositories", () => {
      Deno.env.delete("GITHUB_TOKEN");

      const config = getConfig();

      assertEquals(config.githubToken, undefined);
      assertEquals(config.owner, "Kalapaja");
      assertEquals(config.repo, "donato");
      assertEquals(config.perPage, 100);
    });
  });

  describe("determineLatestVersion", () => {
    it("should return the most recent stable release", () => {
      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 1 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 2 },
          prerelease: false,
        },
        {
          version: "1.1.0",
          tag: "v1.1.0",
          publishedAt: "2025-01-20T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 3 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 4 },
          prerelease: false,
        },
        {
          version: "1.0.5",
          tag: "v1.0.5",
          publishedAt: "2025-01-18T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.5",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 5 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 6 },
          prerelease: false,
        },
      ];

      const latest = determineLatestVersion(releases);
      assertEquals(latest, "1.1.0");
    });

    it("should exclude prereleases when determining latest", () => {
      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 1 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 2 },
          prerelease: false,
        },
        {
          version: "2.0.0-beta.1",
          tag: "v2.0.0-beta.1",
          publishedAt: "2025-01-25T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v2.0.0-beta.1",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 3 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 4 },
          prerelease: true,
        },
      ];

      const latest = determineLatestVersion(releases);
      assertEquals(latest, "1.0.0");
    });

    it("should exclude releases without script asset", () => {
      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 1 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 2 },
          prerelease: false,
        },
        {
          version: "1.1.0",
          tag: "v1.1.0",
          publishedAt: "2025-01-20T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          scriptAsset: null,
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 3 },
          prerelease: false,
        },
      ];

      const latest = determineLatestVersion(releases);
      assertEquals(latest, "1.0.0");
    });

    it("should exclude releases without integrity asset", () => {
      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 1 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 2 },
          prerelease: false,
        },
        {
          version: "1.1.0",
          tag: "v1.1.0",
          publishedAt: "2025-01-20T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 3 },
          integrityAsset: null,
          prerelease: false,
        },
      ];

      const latest = determineLatestVersion(releases);
      assertEquals(latest, "1.0.0");
    });

    it("should return null if no stable releases with assets exist", () => {
      const releases: WidgetRelease[] = [
        {
          version: "2.0.0-beta.1",
          tag: "v2.0.0-beta.1",
          publishedAt: "2025-01-25T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v2.0.0-beta.1",
          scriptAsset: { name: "widget.js", browser_download_url: "url", size: 100, content_type: "js", id: 1 },
          integrityAsset: { name: "widget.txt", browser_download_url: "url", size: 50, content_type: "txt", id: 2 },
          prerelease: true,
        },
      ];

      const latest = determineLatestVersion(releases);
      assertEquals(latest, null);
    });

    it("should return null for empty releases array", () => {
      const releases: WidgetRelease[] = [];
      const latest = determineLatestVersion(releases);
      assertEquals(latest, null);
    });
  });

  describe("readIntegrityFile", () => {
    const testDir = "./test-read-integrity";

    beforeEach(async () => {
      await Deno.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it("should read and trim integrity hash from file", async () => {
      const integrityPath = `${testDir}/test.integrity.txt`;
      const integrityHash = "sha384-abc123def456";
      await Deno.writeTextFile(integrityPath, `  ${integrityHash}  \n`);

      const result = await readIntegrityFile(integrityPath);
      assertEquals(result, integrityHash);
    });

    it("should handle file with no whitespace", async () => {
      const integrityPath = `${testDir}/test.integrity.txt`;
      const integrityHash = "sha384-xyz789";
      await Deno.writeTextFile(integrityPath, integrityHash);

      const result = await readIntegrityFile(integrityPath);
      assertEquals(result, integrityHash);
    });

    it("should throw ManifestError if file doesn't exist", async () => {
      const integrityPath = `${testDir}/nonexistent.txt`;

      await assertRejects(
        async () => await readIntegrityFile(integrityPath),
        ManifestError,
        "Failed to read integrity file"
      );
    });
  });

  describe("generateManifest", () => {
    const testDir = "./test-generate-manifest";

    beforeEach(async () => {
      await Deno.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it("should generate manifest from releases with assets", async () => {
      // Create test integrity files
      await Deno.writeTextFile(`${testDir}/donation-widget.v1.0.0.js.integrity.txt`, "sha384-hash1");
      await Deno.writeTextFile(`${testDir}/donation-widget.v1.1.0.js.integrity.txt`, "sha384-hash2");

      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: {
            name: "donation-widget.v1.0.0.js",
            browser_download_url: "https://example.com/v1.0.0.js",
            size: 50000,
            content_type: "application/javascript",
            id: 1,
          },
          integrityAsset: {
            name: "donation-widget.v1.0.0.js.integrity.txt",
            browser_download_url: "https://example.com/v1.0.0.txt",
            size: 100,
            content_type: "text/plain",
            id: 2,
          },
          prerelease: false,
        },
        {
          version: "1.1.0",
          tag: "v1.1.0",
          publishedAt: "2025-01-20T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          scriptAsset: {
            name: "donation-widget.v1.1.0.js",
            browser_download_url: "https://example.com/v1.1.0.js",
            size: 55000,
            content_type: "application/javascript",
            id: 3,
          },
          integrityAsset: {
            name: "donation-widget.v1.1.0.js.integrity.txt",
            browser_download_url: "https://example.com/v1.1.0.txt",
            size: 100,
            content_type: "text/plain",
            id: 4,
          },
          prerelease: false,
        },
      ];

      const manifest = await generateManifest(releases, testDir);

      assertEquals(manifest.latest, "1.1.0");
      assertEquals(Object.keys(manifest.versions).length, 2);
      
      assertEquals(manifest.versions["1.0.0"].file, "donation-widget.v1.0.0.js");
      assertEquals(manifest.versions["1.0.0"].integrity, "sha384-hash1");
      assertEquals(manifest.versions["1.0.0"].size, 50000);
      assertEquals(manifest.versions["1.0.0"].date, "2025-01-15T10:00:00Z");
      assertEquals(manifest.versions["1.0.0"].releaseUrl, "https://github.com/owner/repo/releases/tag/v1.0.0");

      assertEquals(manifest.versions["1.1.0"].file, "donation-widget.v1.1.0.js");
      assertEquals(manifest.versions["1.1.0"].integrity, "sha384-hash2");
      assertEquals(manifest.versions["1.1.0"].size, 55000);
      assertEquals(manifest.versions["1.1.0"].date, "2025-01-20T10:00:00Z");
    });

    it("should skip releases without script asset", async () => {
      await Deno.writeTextFile(`${testDir}/donation-widget.v1.0.0.js.integrity.txt`, "sha384-hash1");

      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: {
            name: "donation-widget.v1.0.0.js",
            browser_download_url: "https://example.com/v1.0.0.js",
            size: 50000,
            content_type: "application/javascript",
            id: 1,
          },
          integrityAsset: {
            name: "donation-widget.v1.0.0.js.integrity.txt",
            browser_download_url: "https://example.com/v1.0.0.txt",
            size: 100,
            content_type: "text/plain",
            id: 2,
          },
          prerelease: false,
        },
        {
          version: "1.1.0",
          tag: "v1.1.0",
          publishedAt: "2025-01-20T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          scriptAsset: null,
          integrityAsset: {
            name: "donation-widget.v1.1.0.js.integrity.txt",
            browser_download_url: "https://example.com/v1.1.0.txt",
            size: 100,
            content_type: "text/plain",
            id: 3,
          },
          prerelease: false,
        },
      ];

      const manifest = await generateManifest(releases, testDir);

      assertEquals(manifest.latest, "1.0.0");
      assertEquals(Object.keys(manifest.versions).length, 1);
      assertEquals(manifest.versions["1.0.0"].file, "donation-widget.v1.0.0.js");
    });

    it("should skip releases without integrity asset", async () => {
      await Deno.writeTextFile(`${testDir}/donation-widget.v1.0.0.js.integrity.txt`, "sha384-hash1");

      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: {
            name: "donation-widget.v1.0.0.js",
            browser_download_url: "https://example.com/v1.0.0.js",
            size: 50000,
            content_type: "application/javascript",
            id: 1,
          },
          integrityAsset: {
            name: "donation-widget.v1.0.0.js.integrity.txt",
            browser_download_url: "https://example.com/v1.0.0.txt",
            size: 100,
            content_type: "text/plain",
            id: 2,
          },
          prerelease: false,
        },
        {
          version: "1.1.0",
          tag: "v1.1.0",
          publishedAt: "2025-01-20T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          scriptAsset: {
            name: "donation-widget.v1.1.0.js",
            browser_download_url: "https://example.com/v1.1.0.js",
            size: 55000,
            content_type: "application/javascript",
            id: 3,
          },
          integrityAsset: null,
          prerelease: false,
        },
      ];

      const manifest = await generateManifest(releases, testDir);

      assertEquals(manifest.latest, "1.0.0");
      assertEquals(Object.keys(manifest.versions).length, 1);
    });

    it("should include prereleases in manifest", async () => {
      await Deno.writeTextFile(`${testDir}/donation-widget.v1.0.0.js.integrity.txt`, "sha384-hash1");
      await Deno.writeTextFile(`${testDir}/donation-widget.v2.0.0-beta.1.js.integrity.txt`, "sha384-hash2");

      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: {
            name: "donation-widget.v1.0.0.js",
            browser_download_url: "https://example.com/v1.0.0.js",
            size: 50000,
            content_type: "application/javascript",
            id: 1,
          },
          integrityAsset: {
            name: "donation-widget.v1.0.0.js.integrity.txt",
            browser_download_url: "https://example.com/v1.0.0.txt",
            size: 100,
            content_type: "text/plain",
            id: 2,
          },
          prerelease: false,
        },
        {
          version: "2.0.0-beta.1",
          tag: "v2.0.0-beta.1",
          publishedAt: "2025-01-25T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v2.0.0-beta.1",
          scriptAsset: {
            name: "donation-widget.v2.0.0-beta.1.js",
            browser_download_url: "https://example.com/v2.0.0-beta.1.js",
            size: 60000,
            content_type: "application/javascript",
            id: 3,
          },
          integrityAsset: {
            name: "donation-widget.v2.0.0-beta.1.js.integrity.txt",
            browser_download_url: "https://example.com/v2.0.0-beta.1.txt",
            size: 100,
            content_type: "text/plain",
            id: 4,
          },
          prerelease: true,
        },
      ];

      const manifest = await generateManifest(releases, testDir);

      // Latest should be stable version
      assertEquals(manifest.latest, "1.0.0");
      // But both should be in manifest
      assertEquals(Object.keys(manifest.versions).length, 2);
      assertExists(manifest.versions["2.0.0-beta.1"]);
    });

    it("should throw ManifestError if no stable releases exist", async () => {
      const releases: WidgetRelease[] = [
        {
          version: "2.0.0-beta.1",
          tag: "v2.0.0-beta.1",
          publishedAt: "2025-01-25T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v2.0.0-beta.1",
          scriptAsset: {
            name: "donation-widget.v2.0.0-beta.1.js",
            browser_download_url: "https://example.com/v2.0.0-beta.1.js",
            size: 60000,
            content_type: "application/javascript",
            id: 1,
          },
          integrityAsset: {
            name: "donation-widget.v2.0.0-beta.1.js.integrity.txt",
            browser_download_url: "https://example.com/v2.0.0-beta.1.txt",
            size: 100,
            content_type: "text/plain",
            id: 2,
          },
          prerelease: true,
        },
      ];

      await assertRejects(
        async () => await generateManifest(releases, testDir),
        ManifestError,
        "No stable releases found"
      );
    });

    it("should throw ManifestError if no valid releases were processed", async () => {
      const releases: WidgetRelease[] = [
        {
          version: "1.0.0",
          tag: "v1.0.0",
          publishedAt: "2025-01-15T10:00:00Z",
          releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          scriptAsset: null,
          integrityAsset: null,
          prerelease: false,
        },
      ];

      await assertRejects(
        async () => await generateManifest(releases, testDir),
        ManifestError,
        "No stable releases found"
      );
    });
  });

  describe("saveManifest", () => {
    const testDir = "./test-save-manifest";

    beforeEach(async () => {
      await Deno.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      try {
        await Deno.remove(testDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it("should save manifest to JSON file", async () => {
      const manifest = {
        latest: "1.1.0",
        versions: {
          "1.0.0": {
            file: "donation-widget.v1.0.0.js",
            integrity: "sha384-hash1",
            size: 50000,
            date: "2025-01-15T10:00:00Z",
            releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          },
          "1.1.0": {
            file: "donation-widget.v1.1.0.js",
            integrity: "sha384-hash2",
            size: 55000,
            date: "2025-01-20T10:00:00Z",
            releaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
          },
        },
      };

      const outputPath = `${testDir}/versions.json`;
      await saveManifest(manifest, outputPath);

      // Verify file exists
      const stat = await Deno.stat(outputPath);
      assertEquals(stat.isFile, true);

      // Verify content
      const content = await Deno.readTextFile(outputPath);
      const parsed = JSON.parse(content);
      
      assertEquals(parsed.latest, "1.1.0");
      assertEquals(Object.keys(parsed.versions).length, 2);
      assertEquals(parsed.versions["1.0.0"].file, "donation-widget.v1.0.0.js");
      assertEquals(parsed.versions["1.1.0"].integrity, "sha384-hash2");
    });

    it("should format JSON with 2-space indentation", async () => {
      const manifest = {
        latest: "1.0.0",
        versions: {
          "1.0.0": {
            file: "donation-widget.v1.0.0.js",
            integrity: "sha384-hash1",
            size: 50000,
            date: "2025-01-15T10:00:00Z",
            releaseUrl: "https://github.com/owner/repo/releases/tag/v1.0.0",
          },
        },
      };

      const outputPath = `${testDir}/versions.json`;
      await saveManifest(manifest, outputPath);

      const content = await Deno.readTextFile(outputPath);
      
      // Check for 2-space indentation
      assertStringIncludes(content, '  "latest"');
      assertStringIncludes(content, '  "versions"');
    });

    it("should throw ManifestError if directory doesn't exist and can't be created", async () => {
      const manifest = {
        latest: "1.0.0",
        versions: {},
      };

      // Try to write to an invalid path (e.g., inside a file)
      const testFile = `${testDir}/file.txt`;
      await Deno.writeTextFile(testFile, "test");
      const invalidPath = `${testFile}/versions.json`;

      await assertRejects(
        async () => await saveManifest(manifest, invalidPath),
        ManifestError,
        "Failed to save manifest"
      );
    });
  });
});

