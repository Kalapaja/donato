/**
 * Tests for manifest generation functionality in fetch-releases.ts
 */

import { assertEquals, assertExists } from "jsr:@std/assert@1";
import {
  determineLatestVersion,
  generateManifest,
  ManifestError,
  readIntegrityFile,
  saveManifest,
  type VersionEntry,
  type VersionManifest,
  type WidgetRelease,
} from "./fetch-releases.ts";

/**
 * Creates a mock WidgetRelease for testing
 */
function createMockRelease(
  version: string,
  prerelease = false,
  hasScript = true,
  hasIntegrity = true
): WidgetRelease {
  return {
    version,
    tag: `v${version}`,
    publishedAt: `2025-01-${version.split(".")[2].padStart(2, "0")}T10:00:00Z`,
    releaseUrl: `https://github.com/test/repo/releases/tag/v${version}`,
    scriptAsset: hasScript
      ? {
          name: `donation-widget.v${version}.js`,
          browser_download_url: `https://github.com/test/repo/releases/download/v${version}/donation-widget.v${version}.js`,
          size: 100000 + parseInt(version.split(".")[2]) * 1000,
          content_type: "application/javascript",
          id: parseInt(version.split(".")[2]),
        }
      : null,
    integrityAsset: hasIntegrity
      ? {
          name: `donation-widget.v${version}.js.integrity.txt`,
          browser_download_url: `https://github.com/test/repo/releases/download/v${version}/donation-widget.v${version}.js.integrity.txt`,
          size: 100,
          content_type: "text/plain",
          id: parseInt(version.split(".")[2]) + 1000,
        }
      : null,
    prerelease,
  };
}

Deno.test("determineLatestVersion - finds latest stable version", () => {
  const releases: WidgetRelease[] = [
    { ...createMockRelease("1.0.0", false), publishedAt: "2025-01-01T10:00:00Z" },
    { ...createMockRelease("1.0.1", false), publishedAt: "2025-01-02T10:00:00Z" },
    { ...createMockRelease("1.1.0", false), publishedAt: "2025-01-03T10:00:00Z" },
    { ...createMockRelease("1.2.0", true), publishedAt: "2025-01-04T10:00:00Z" }, // prerelease
  ];

  const latest = determineLatestVersion(releases);

  assertEquals(latest, "1.1.0");
});

Deno.test("determineLatestVersion - skips prereleases", () => {
  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0", false),
    createMockRelease("1.1.0", true), // prerelease
    createMockRelease("1.2.0", true), // prerelease
  ];

  const latest = determineLatestVersion(releases);

  assertEquals(latest, "1.0.0");
});

Deno.test("determineLatestVersion - skips releases without assets", () => {
  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0", false, true, false), // no integrity
    createMockRelease("1.1.0", false, false, true), // no script
    createMockRelease("1.2.0", false, true, true), // has both
  ];

  const latest = determineLatestVersion(releases);

  assertEquals(latest, "1.2.0");
});

Deno.test("determineLatestVersion - returns null when no stable releases", () => {
  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0", true), // prerelease
    createMockRelease("1.1.0", true), // prerelease
  ];

  const latest = determineLatestVersion(releases);

  assertEquals(latest, null);
});

Deno.test("determineLatestVersion - sorts by published date", () => {
  const releases: WidgetRelease[] = [
    {
      ...createMockRelease("1.0.0", false),
      publishedAt: "2025-01-10T10:00:00Z",
    },
    {
      ...createMockRelease("0.9.0", false),
      publishedAt: "2025-01-15T10:00:00Z", // newer date
    },
  ];

  const latest = determineLatestVersion(releases);

  // Should pick 0.9.0 because it has a newer published date
  assertEquals(latest, "0.9.0");
});

Deno.test("readIntegrityFile - reads integrity hash from file", async () => {
  const tempDir = await Deno.makeTempDir();
  const integrityPath = `${tempDir}/test.integrity.txt`;
  const expectedHash = "sha384-abc123";

  await Deno.writeTextFile(integrityPath, `${expectedHash}\n`);

  try {
    const result = await readIntegrityFile(integrityPath);
    assertEquals(result, expectedHash);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("readIntegrityFile - throws ManifestError on missing file", async () => {
  try {
    await readIntegrityFile("/nonexistent/file.txt");
    throw new Error("Should have thrown ManifestError");
  } catch (error) {
    if (!(error instanceof ManifestError)) {
      throw error;
    }
    assertEquals(error instanceof ManifestError, true);
    assertEquals(error.name, "ManifestError");
  }
});

Deno.test("saveManifest - writes JSON file with correct format", async () => {
  const tempDir = await Deno.makeTempDir();
  const manifestPath = `${tempDir}/versions.json`;

  const manifest: VersionManifest = {
    latest: "1.0.0",
    versions: {
      "1.0.0": {
        file: "donation-widget.v1.0.0.js",
        integrity: "sha384-abc123",
        size: 100000,
        date: "2025-01-01T10:00:00Z",
        releaseUrl: "https://github.com/test/repo/releases/tag/v1.0.0",
      },
    },
  };

  try {
    await saveManifest(manifest, manifestPath);

    // Verify file exists and has correct content
    const content = await Deno.readTextFile(manifestPath);
    const parsed = JSON.parse(content);

    assertEquals(parsed.latest, "1.0.0");
    assertEquals(parsed.versions["1.0.0"].file, "donation-widget.v1.0.0.js");
    assertEquals(parsed.versions["1.0.0"].integrity, "sha384-abc123");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateManifest - creates manifest from releases", async () => {
  const tempDir = await Deno.makeTempDir();

  // Create mock integrity files
  await Deno.writeTextFile(
    `${tempDir}/donation-widget.v1.0.0.js.integrity.txt`,
    "sha384-hash100"
  );
  await Deno.writeTextFile(
    `${tempDir}/donation-widget.v1.0.1.js.integrity.txt`,
    "sha384-hash101"
  );

  const releases: WidgetRelease[] = [
    { ...createMockRelease("1.0.0", false), publishedAt: "2025-01-01T10:00:00Z" },
    { ...createMockRelease("1.0.1", false), publishedAt: "2025-01-02T10:00:00Z" },
  ];

  try {
    const manifest = await generateManifest(releases, tempDir);

    assertEquals(manifest.latest, "1.0.1");
    assertEquals(Object.keys(manifest.versions).length, 2);
    assertEquals(manifest.versions["1.0.0"].integrity, "sha384-hash100");
    assertEquals(manifest.versions["1.0.1"].integrity, "sha384-hash101");
    assertEquals(manifest.versions["1.0.0"].file, "donation-widget.v1.0.0.js");
    assertEquals(
      manifest.versions["1.0.0"].releaseUrl,
      "https://github.com/test/repo/releases/tag/v1.0.0"
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateManifest - skips releases without assets", async () => {
  const tempDir = await Deno.makeTempDir();

  await Deno.writeTextFile(
    `${tempDir}/donation-widget.v1.0.0.js.integrity.txt`,
    "sha384-hash100"
  );

  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0", false, true, true), // has both
    createMockRelease("1.0.1", false, false, true), // missing script
    createMockRelease("1.0.2", false, true, false), // missing integrity
  ];

  try {
    const manifest = await generateManifest(releases, tempDir);

    assertEquals(manifest.latest, "1.0.0");
    assertEquals(Object.keys(manifest.versions).length, 1);
    assertEquals(manifest.versions["1.0.0"].integrity, "sha384-hash100");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateManifest - includes prereleases in versions", async () => {
  const tempDir = await Deno.makeTempDir();

  await Deno.writeTextFile(
    `${tempDir}/donation-widget.v1.0.0.js.integrity.txt`,
    "sha384-hash100"
  );
  await Deno.writeTextFile(
    `${tempDir}/donation-widget.v1.1.0-beta.1.js.integrity.txt`,
    "sha384-hashbeta"
  );

  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0", false),
    createMockRelease("1.1.0-beta.1", true), // prerelease
  ];

  try {
    const manifest = await generateManifest(releases, tempDir);

    // Latest should be stable version
    assertEquals(manifest.latest, "1.0.0");
    // But prerelease should be in versions
    assertEquals(Object.keys(manifest.versions).length, 2);
    assertEquals(manifest.versions["1.1.0-beta.1"].integrity, "sha384-hashbeta");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateManifest - throws when no stable releases", async () => {
  const tempDir = await Deno.makeTempDir();

  await Deno.writeTextFile(
    `${tempDir}/donation-widget.v1.0.0-beta.1.js.integrity.txt`,
    "sha384-hashbeta"
  );

  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0-beta.1", true), // only prerelease
  ];

  try {
    await generateManifest(releases, tempDir);
    throw new Error("Should have thrown ManifestError");
  } catch (error) {
    if (!(error instanceof ManifestError)) {
      throw error;
    }
    assertEquals(error instanceof ManifestError, true);
    assertExists(error.message.match(/No stable releases found/));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateManifest - throws when no valid releases", async () => {
  const tempDir = await Deno.makeTempDir();

  const releases: WidgetRelease[] = [
    createMockRelease("1.0.0", false, false, false), // no assets
  ];

  try {
    await generateManifest(releases, tempDir);
    throw new Error("Should have thrown ManifestError");
  } catch (error) {
    if (!(error instanceof ManifestError)) {
      throw error;
    }
    assertEquals(error instanceof ManifestError, true);
    // This will throw "No stable releases found" because determineLatestVersion returns null
    // when there are no releases with both assets
    assertExists(error.message.match(/No stable releases found|No valid releases were processed/));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("VersionEntry interface - has required fields", () => {
  const entry: VersionEntry = {
    file: "donation-widget.v1.0.0.js",
    integrity: "sha384-abc123",
    size: 100000,
    date: "2025-01-01T10:00:00Z",
    releaseUrl: "https://github.com/test/repo/releases/tag/v1.0.0",
  };

  assertEquals(entry.file, "donation-widget.v1.0.0.js");
  assertEquals(entry.integrity, "sha384-abc123");
  assertEquals(entry.size, 100000);
  assertEquals(entry.date, "2025-01-01T10:00:00Z");
  assertEquals(entry.releaseUrl, "https://github.com/test/repo/releases/tag/v1.0.0");
});

Deno.test("VersionManifest interface - has required fields", () => {
  const manifest: VersionManifest = {
    latest: "1.0.0",
    versions: {
      "1.0.0": {
        file: "donation-widget.v1.0.0.js",
        integrity: "sha384-abc123",
        size: 100000,
        date: "2025-01-01T10:00:00Z",
        releaseUrl: "https://github.com/test/repo/releases/tag/v1.0.0",
      },
    },
  };

  assertEquals(manifest.latest, "1.0.0");
  assertEquals(Object.keys(manifest.versions).length, 1);
  assertExists(manifest.versions["1.0.0"]);
});

