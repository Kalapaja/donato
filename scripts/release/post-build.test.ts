/**
 * Tests for post-build processing script
 */

import { assertEquals, assertRejects } from "@std/assert";
import { join } from "jsr:@std/path@1.0.8";
import { calculateSHA384 } from "../utils/calculate-integrity.ts";
import { ManifestManager } from "../manifest/manifest-manager.ts";

/**
 * Setup test environment with temporary directory
 */
async function setupTestEnv(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "post-build-test-" });
  return tempDir;
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnv(tempDir: string): Promise<void> {
  try {
    await Deno.remove(tempDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Create a test bundle file
 */
async function createTestBundle(
  dir: string,
  filename: string,
  content: string
): Promise<string> {
  const filePath = join(dir, filename);
  await Deno.writeTextFile(filePath, content);
  return filePath;
}

Deno.test("Post-build - File processing flow", async () => {
  const tempDir = await setupTestEnv();
  
  try {
    // Create test bundle
    const bundleContent = 'console.log("test bundle");';
    const sourceFile = await createTestBundle(
      tempDir,
      "donation-widget.js",
      bundleContent
    );
    
    // Calculate expected integrity
    const expectedIntegrity = await calculateSHA384(sourceFile);
    
    // Simulate post-build: copy to versioned name
    const version = "1.0.0";
    const versionedFile = join(tempDir, `donation-widget.v${version}.js`);
    await Deno.copyFile(sourceFile, versionedFile);
    
    // Verify versioned file exists and has same content
    const versionedContent = await Deno.readTextFile(versionedFile);
    assertEquals(versionedContent, bundleContent);
    
    // Verify integrity matches
    const versionedIntegrity = await calculateSHA384(versionedFile);
    assertEquals(versionedIntegrity, expectedIntegrity);
    
    // Update manifest
    const manifestPath = join(tempDir, "versions.json");
    const manager = new ManifestManager(manifestPath);
    await manager.load();
    
    const stat = await Deno.stat(versionedFile);
    await manager.addVersion(version, {
      file: `donation-widget.v${version}.js`,
      integrity: versionedIntegrity,
      size: stat.size,
      date: new Date().toISOString(),
    });
    
    await manager.setLatest(version);
    await manager.save();
    
    // Verify manifest was created correctly
    const manifest = manager.getManifest();
    assertEquals(manifest.latest, version);
    assertEquals(manifest.versions[version].integrity, expectedIntegrity);
  } finally {
    await cleanupTestEnv(tempDir);
  }
});

Deno.test("Post-build - Version already exists", async () => {
  const tempDir = await setupTestEnv();
  
  try {
    const version = "1.0.0";
    const manifestPath = join(tempDir, "versions.json");
    const manager = new ManifestManager(manifestPath);
    await manager.load();
    
    // Add version first time
    await manager.addVersion(version, {
      file: `donation-widget.v${version}.js`,
      integrity: "sha384-test",
      size: 100,
      date: new Date().toISOString(),
    });
    
    // Try to add same version again - should throw
    await assertRejects(
      async () => {
        await manager.addVersion(version, {
          file: `donation-widget.v${version}.js`,
          integrity: "sha384-test2",
          size: 200,
          date: new Date().toISOString(),
        });
      },
      Error,
      "already exists"
    );
  } finally {
    await cleanupTestEnv(tempDir);
  }
});

Deno.test("Post-build - Multiple versions", async () => {
  const tempDir = await setupTestEnv();
  
  try {
    const manifestPath = join(tempDir, "versions.json");
    const manager = new ManifestManager(manifestPath);
    await manager.load();
    
    // Add multiple versions
    const versions = ["1.0.0", "1.0.1", "1.1.0"];
    
    for (const version of versions) {
      const bundleContent = `console.log("version ${version}");`;
      const bundleFile = await createTestBundle(
        tempDir,
        `donation-widget.v${version}.js`,
        bundleContent
      );
      
      const integrity = await calculateSHA384(bundleFile);
      const stat = await Deno.stat(bundleFile);
      
      await manager.addVersion(version, {
        file: `donation-widget.v${version}.js`,
        integrity,
        size: stat.size,
        date: new Date().toISOString(),
      });
    }
    
    // Set latest to newest version
    await manager.setLatest("1.1.0");
    await manager.save();
    
    // Verify all versions are present
    const allVersions = await manager.getAllVersions();
    assertEquals(allVersions, versions);
    assertEquals(manager.getLatest(), "1.1.0");
  } finally {
    await cleanupTestEnv(tempDir);
  }
});

Deno.test("Post-build - Integrity hash stability", async () => {
  const tempDir = await setupTestEnv();
  
  try {
    // Create same content in two files
    const content = 'console.log("test");';
    const file1 = await createTestBundle(tempDir, "file1.js", content);
    const file2 = await createTestBundle(tempDir, "file2.js", content);
    
    // Calculate integrity for both
    const integrity1 = await calculateSHA384(file1);
    const integrity2 = await calculateSHA384(file2);
    
    // Should produce identical hashes
    assertEquals(integrity1, integrity2);
    
    // Should start with sha384-
    assertEquals(integrity1.startsWith("sha384-"), true);
  } finally {
    await cleanupTestEnv(tempDir);
  }
});

Deno.test("Post-build - File size tracking", async () => {
  const tempDir = await setupTestEnv();
  
  try {
    const manifestPath = join(tempDir, "versions.json");
    const manager = new ManifestManager(manifestPath);
    await manager.load();
    
    // Create bundles of different sizes
    const smallBundle = "console.log('small');";
    const largeBundle = "console.log('" + "x".repeat(10000) + "');";
    
    const smallFile = await createTestBundle(
      tempDir,
      "small.js",
      smallBundle
    );
    const largeFile = await createTestBundle(
      tempDir,
      "large.js",
      largeBundle
    );
    
    const smallStat = await Deno.stat(smallFile);
    const largeStat = await Deno.stat(largeFile);
    
    await manager.addVersion("1.0.0", {
      file: "small.js",
      integrity: await calculateSHA384(smallFile),
      size: smallStat.size,
      date: new Date().toISOString(),
    });
    
    await manager.addVersion("1.0.1", {
      file: "large.js",
      integrity: await calculateSHA384(largeFile),
      size: largeStat.size,
      date: new Date().toISOString(),
    });
    
    // Verify sizes are tracked correctly
    const v100 = await manager.getVersion("1.0.0");
    const v101 = await manager.getVersion("1.0.1");
    
    assertEquals(v100!.size, smallStat.size);
    assertEquals(v101!.size, largeStat.size);
    assertEquals(v101!.size > v100!.size, true);
  } finally {
    await cleanupTestEnv(tempDir);
  }
});

