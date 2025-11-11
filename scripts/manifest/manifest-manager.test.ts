import { assertEquals, assertRejects } from "jsr:@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { ManifestManager } from "./manifest-manager.ts";
import type { VersionEntry } from "./manifest-types.ts";

// Helper to create a temporary test directory
async function createTestDir(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "manifest-manager-test-" });
  return tempDir;
}

// Helper to create a valid version entry
function createVersionEntry(
  file: string,
  overrides?: Partial<VersionEntry>,
): VersionEntry {
  return {
    file,
    integrity: "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC",
    size: 12345,
    date: new Date().toISOString(),
    ...overrides,
  };
}

describe("ManifestManager", () => {
  let testDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    testDir = await createTestDir();
    manifestPath = `${testDir}/versions.json`;
  });

  afterEach(async () => {
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("constructor", () => {
    it("should create a new instance with the given path", () => {
      const manager = new ManifestManager(manifestPath);
      assertEquals(typeof manager, "object");
    });
  });

  describe("load()", () => {
    it("should load existing manifest file", async () => {
      // Create a test manifest file
      const testManifest = {
        latest: "1.0.0",
        versions: {
          "1.0.0": createVersionEntry("donation-widget.v1.0.0.js"),
        },
      };
      await Deno.writeTextFile(manifestPath, JSON.stringify(testManifest));

      const manager = new ManifestManager(manifestPath);
      const manifest = await manager.load();

      assertEquals(manifest.latest, "1.0.0");
      assertEquals(Object.keys(manifest.versions).length, 1);
    });

    it("should initialize empty manifest if file doesn't exist", async () => {
      const manager = new ManifestManager(manifestPath);
      const manifest = await manager.load();

      assertEquals(manifest.latest, "0.0.0");
      assertEquals(Object.keys(manifest.versions).length, 0);
    });

    it("should throw error for invalid JSON", async () => {
      await Deno.writeTextFile(manifestPath, "invalid json {");

      const manager = new ManifestManager(manifestPath);
      await assertRejects(
        () => manager.load(),
        Error,
        "Failed to load manifest",
      );
    });

    it("should throw error for invalid manifest structure", async () => {
      await Deno.writeTextFile(
        manifestPath,
        JSON.stringify({ invalid: "structure" }),
      );

      const manager = new ManifestManager(manifestPath);
      await assertRejects(
        () => manager.load(),
        Error,
        "Failed to load manifest",
      );
    });
  });

  describe("addVersion()", () => {
    it("should add a new version to the manifest", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const entry = createVersionEntry("donation-widget.v1.0.0.js");
      await manager.addVersion("1.0.0", entry);

      const version = await manager.getVersion("1.0.0");
      assertEquals(version?.file, "donation-widget.v1.0.0.js");
      assertEquals(version?.major, 1);
      assertEquals(version?.minor, 0);
      assertEquals(version?.patch, 0);
    });

    it("should set first version as latest automatically", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const entry = createVersionEntry("donation-widget.v1.0.0.js");
      await manager.addVersion("1.0.0", entry);

      assertEquals(manager.getLatest(), "1.0.0");
    });

    it("should throw error for duplicate version", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const entry = createVersionEntry("donation-widget.v1.0.0.js");
      await manager.addVersion("1.0.0", entry);

      await assertRejects(
        () => manager.addVersion("1.0.0", entry),
        Error,
        "already exists",
      );
    });

    it("should throw error for invalid version format", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const entry = createVersionEntry("donation-widget.v1.0.js");
      await assertRejects(
        () => manager.addVersion("1.0", entry),
        Error,
        "Invalid semantic version",
      );
    });

    it("should throw error for invalid entry", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const invalidEntry = {
        file: "",
        integrity: "invalid",
        size: -1,
        date: "not a date",
      };

      await assertRejects(
        () => manager.addVersion("1.0.0", invalidEntry as VersionEntry),
        Error,
      );
    });

    it("should throw error if not loaded", async () => {
      const manager = new ManifestManager(manifestPath);

      const entry = createVersionEntry("donation-widget.v1.0.0.js");
      await assertRejects(
        () => manager.addVersion("1.0.0", entry),
        Error,
        "not loaded",
      );
    });

    it("should preserve existing semantic version metadata in entry", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const entry = createVersionEntry("donation-widget.v1.2.3.js", {
        major: 1,
        minor: 2,
        patch: 3,
      });
      await manager.addVersion("1.2.3", entry);

      const version = await manager.getVersion("1.2.3");
      assertEquals(version?.major, 1);
      assertEquals(version?.minor, 2);
      assertEquals(version?.patch, 3);
    });
  });

  describe("setLatest()", () => {
    it("should update the latest version pointer", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager.addVersion(
        "1.1.0",
        createVersionEntry("donation-widget.v1.1.0.js"),
      );

      await manager.setLatest("1.1.0");
      assertEquals(manager.getLatest(), "1.1.0");
    });

    it("should throw error for non-existent version", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );

      await assertRejects(
        () => manager.setLatest("2.0.0"),
        Error,
        "does not exist",
      );
    });

    it("should throw error for invalid version format", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await assertRejects(
        () => manager.setLatest("v1.0.0"),
        Error,
        "Invalid semantic version",
      );
    });

    it("should throw error if not loaded", async () => {
      const manager = new ManifestManager(manifestPath);

      await assertRejects(
        () => manager.setLatest("1.0.0"),
        Error,
        "not loaded",
      );
    });
  });

  describe("save()", () => {
    it("should save manifest to disk", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager.save();

      // Read the file and verify
      const content = await Deno.readTextFile(manifestPath);
      const saved = JSON.parse(content);
      assertEquals(saved.latest, "1.0.0");
      assertEquals(Object.keys(saved.versions).length, 1);
    });

    it("should use atomic write (temp file then rename)", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager.save();

      // Verify temp file doesn't exist after successful save
      const tempExists = await Deno.stat(`${manifestPath}.tmp`)
        .then(() => true)
        .catch(() => false);
      assertEquals(tempExists, false);
    });

    it("should throw error if not loaded", async () => {
      const manager = new ManifestManager(manifestPath);

      await assertRejects(
        () => manager.save(),
        Error,
        "not loaded",
      );
    });

    it("should validate manifest before saving", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );

      // Manually corrupt the manifest
      const manifest = manager.getManifest();
      manifest.latest = "invalid-version";

      await assertRejects(
        () => manager.save(),
        Error,
      );
    });
  });

  describe("getVersion()", () => {
    it("should return version entry if exists", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const entry = createVersionEntry("donation-widget.v1.0.0.js");
      await manager.addVersion("1.0.0", entry);

      const version = await manager.getVersion("1.0.0");
      assertEquals(version?.file, "donation-widget.v1.0.0.js");
    });

    it("should return null if version doesn't exist", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const version = await manager.getVersion("1.0.0");
      assertEquals(version, null);
    });

    it("should throw error if not loaded", async () => {
      const manager = new ManifestManager(manifestPath);

      await assertRejects(
        () => manager.getVersion("1.0.0"),
        Error,
        "not loaded",
      );
    });
  });

  describe("getAllVersions()", () => {
    it("should return all versions sorted by semantic version", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      // Add versions in random order
      await manager.addVersion(
        "1.1.0",
        createVersionEntry("donation-widget.v1.1.0.js"),
      );
      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager.addVersion(
        "2.0.0",
        createVersionEntry("donation-widget.v2.0.0.js"),
      );
      await manager.addVersion(
        "1.0.1",
        createVersionEntry("donation-widget.v1.0.1.js"),
      );

      const versions = await manager.getAllVersions();
      assertEquals(versions, ["1.0.0", "1.0.1", "1.1.0", "2.0.0"]);
    });

    it("should return empty array if no versions", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      const versions = await manager.getAllVersions();
      assertEquals(versions, []);
    });

    it("should throw error if not loaded", async () => {
      const manager = new ManifestManager(manifestPath);

      await assertRejects(
        () => manager.getAllVersions(),
        Error,
        "not loaded",
      );
    });
  });

  describe("getLatest()", () => {
    it("should return the latest version string", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager.setLatest("1.0.0");

      assertEquals(manager.getLatest(), "1.0.0");
    });

    it("should throw error if not loaded", () => {
      const manager = new ManifestManager(manifestPath);

      let error: Error | null = null;
      try {
        manager.getLatest();
      } catch (e) {
        error = e as Error;
      }

      assertEquals(error?.message.includes("not loaded"), true);
    });
  });

  describe("getManifest()", () => {
    it("should return the entire manifest", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );

      const manifest = manager.getManifest();
      assertEquals(manifest.latest, "1.0.0");
      assertEquals(Object.keys(manifest.versions).length, 1);
    });

    it("should throw error if not loaded", () => {
      const manager = new ManifestManager(manifestPath);

      let error: Error | null = null;
      try {
        manager.getManifest();
      } catch (e) {
        error = e as Error;
      }

      assertEquals(error?.message.includes("not loaded"), true);
    });
  });

  describe("concurrent operations", () => {
    it("should handle multiple save operations", async () => {
      const manager1 = new ManifestManager(manifestPath);
      const manager2 = new ManifestManager(manifestPath);

      await manager1.load();
      await manager1.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager1.save();

      // Load after first save
      await manager2.load();
      await manager2.addVersion(
        "1.0.1",
        createVersionEntry("donation-widget.v1.0.1.js"),
      );
      await manager2.save();

      // Verify final state
      const manager3 = new ManifestManager(manifestPath);
      await manager3.load();
      const versions = await manager3.getAllVersions();
      
      // Should have both versions
      assertEquals(versions.includes("1.0.0"), true);
      assertEquals(versions.includes("1.0.1"), true);
    });

    it("should not corrupt file during concurrent saves", async () => {
      const manager1 = new ManifestManager(manifestPath);
      await manager1.load();
      await manager1.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );

      const manager2 = new ManifestManager(manifestPath);
      await manager2.load();
      await manager2.addVersion(
        "1.0.1",
        createVersionEntry("donation-widget.v1.0.1.js"),
      );

      // Save both concurrently - one might fail, but file should not be corrupted
      const results = await Promise.allSettled([
        manager1.save(),
        manager2.save(),
      ]);

      // At least one should succeed
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      assertEquals(succeeded >= 1, true);

      // Verify file is still valid JSON (not corrupted)
      const content = await Deno.readTextFile(manifestPath);
      const manifest = JSON.parse(content); // Should not throw
      assertEquals(typeof manifest, "object");
      
      // Should have at least one version
      assertEquals(Object.keys(manifest.versions).length >= 1, true);
    });
  });

  describe("edge cases", () => {
    it("should handle very large version numbers", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "999.999.999",
        createVersionEntry("donation-widget.v999.999.999.js"),
      );

      const version = await manager.getVersion("999.999.999");
      assertEquals(version?.major, 999);
      assertEquals(version?.minor, 999);
      assertEquals(version?.patch, 999);
    });

    it("should handle version with zeros", async () => {
      const manager = new ManifestManager(manifestPath);
      await manager.load();

      await manager.addVersion(
        "0.0.0",
        createVersionEntry("donation-widget.v0.0.0.js"),
      );

      const version = await manager.getVersion("0.0.0");
      assertEquals(version?.major, 0);
      assertEquals(version?.minor, 0);
      assertEquals(version?.patch, 0);
    });

    it("should handle special characters in file path", async () => {
      const specialDir = `${testDir}/special-dir-with-dashes`;
      await Deno.mkdir(specialDir, { recursive: true });
      const specialPath = `${specialDir}/versions.json`;

      const manager = new ManifestManager(specialPath);
      await manager.load();
      await manager.addVersion(
        "1.0.0",
        createVersionEntry("donation-widget.v1.0.0.js"),
      );
      await manager.save();

      const content = await Deno.readTextFile(specialPath);
      const manifest = JSON.parse(content);
      assertEquals(manifest.latest, "1.0.0");
    });
  });
});

