import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  assertValidSemanticVersion,
  compareVersions,
  isValidSemanticVersion,
  validateSemanticVersion,
  validateVersionEntry,
  validateVersionManifest,
  type VersionEntry,
  type VersionManifest,
} from "./manifest-types.ts";

Deno.test("validateSemanticVersion - valid versions", () => {
  const testCases = [
    { input: "1.0.0", expected: { major: 1, minor: 0, patch: 0, raw: "1.0.0" } },
    { input: "1.2.3", expected: { major: 1, minor: 2, patch: 3, raw: "1.2.3" } },
    {
      input: "10.20.30",
      expected: { major: 10, minor: 20, patch: 30, raw: "10.20.30" },
    },
    { input: "0.0.0", expected: { major: 0, minor: 0, patch: 0, raw: "0.0.0" } },
    {
      input: "999.999.999",
      expected: { major: 999, minor: 999, patch: 999, raw: "999.999.999" },
    },
  ];

  for (const { input, expected } of testCases) {
    const result = validateSemanticVersion(input);
    assertEquals(result, expected, `Failed for input: ${input}`);
  }
});

Deno.test("validateSemanticVersion - invalid versions", () => {
  const invalidVersions = [
    "v1.0.0", // prefix
    "1.0", // missing patch
    "1", // missing minor and patch
    "1.0.0-alpha", // prerelease tag
    "1.0.0+build", // build metadata
    "a.b.c", // non-numeric
    "1.0.0.0", // too many parts
    "", // empty string
    "  1.0.0  ", // whitespace
    "1.0.0 ", // trailing whitespace
    " 1.0.0", // leading whitespace
  ];

  for (const version of invalidVersions) {
    const result = validateSemanticVersion(version);
    assertEquals(result, null, `Should be invalid: ${version}`);
  }
});

Deno.test("assertValidSemanticVersion - valid version", () => {
  const result = assertValidSemanticVersion("1.2.3");
  assertEquals(result, { major: 1, minor: 2, patch: 3, raw: "1.2.3" });
});

Deno.test("assertValidSemanticVersion - invalid version throws", () => {
  assertThrows(
    () => assertValidSemanticVersion("v1.0.0"),
    Error,
    'Invalid semantic version format: "v1.0.0"',
  );

  assertThrows(
    () => assertValidSemanticVersion("1.0"),
    Error,
    "Expected format: \"major.minor.patch\"",
  );
});

Deno.test("isValidSemanticVersion", () => {
  assertEquals(isValidSemanticVersion("1.2.3"), true);
  assertEquals(isValidSemanticVersion("v1.2.3"), false);
  assertEquals(isValidSemanticVersion("1.2"), false);
  assertEquals(isValidSemanticVersion(""), false);
});

Deno.test("compareVersions - equal versions", () => {
  assertEquals(compareVersions("1.0.0", "1.0.0"), 0);
  assertEquals(compareVersions("1.2.3", "1.2.3"), 0);
});

Deno.test("compareVersions - different major versions", () => {
  assertEquals(compareVersions("1.0.0", "2.0.0"), -1);
  assertEquals(compareVersions("2.0.0", "1.0.0"), 1);
  assertEquals(compareVersions("10.0.0", "5.0.0"), 5);
});

Deno.test("compareVersions - different minor versions", () => {
  assertEquals(compareVersions("1.1.0", "1.2.0"), -1);
  assertEquals(compareVersions("1.5.0", "1.3.0"), 2);
  assertEquals(compareVersions("1.0.0", "1.0.0"), 0);
});

Deno.test("compareVersions - different patch versions", () => {
  assertEquals(compareVersions("1.0.1", "1.0.2"), -1);
  assertEquals(compareVersions("1.0.5", "1.0.3"), 2);
  assertEquals(compareVersions("1.0.0", "1.0.0"), 0);
});

Deno.test("compareVersions - complex comparisons", () => {
  assertEquals(compareVersions("1.0.0", "1.0.1"), -1);
  assertEquals(compareVersions("1.0.9", "1.1.0"), -1);
  assertEquals(compareVersions("1.9.9", "2.0.0"), -1);
  assertEquals(compareVersions("2.0.0", "1.9.9"), 1);
});

Deno.test("compareVersions - invalid versions throw", () => {
  assertThrows(() => compareVersions("v1.0.0", "1.0.0"));
  assertThrows(() => compareVersions("1.0.0", "1.0"));
});

Deno.test("validateVersionEntry - valid entry", () => {
  const validEntry: VersionEntry = {
    file: "donation-widget.v1.0.0.js",
    integrity: "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC",
    size: 245678,
    date: "2025-01-15T10:30:00Z",
    major: 1,
    minor: 0,
    patch: 0,
  };

  // Should not throw
  validateVersionEntry(validEntry);
});

Deno.test("validateVersionEntry - minimal valid entry", () => {
  const minimalEntry: VersionEntry = {
    file: "donation-widget.v1.0.0.js",
    integrity: "sha384-abcdef123456",
    size: 1000,
    date: "2025-01-15T10:30:00Z",
  };

  // Should not throw
  validateVersionEntry(minimalEntry);
});

Deno.test("validateVersionEntry - missing file throws", () => {
  const entry = {
    file: "",
    integrity: "sha384-abc",
    size: 1000,
    date: "2025-01-15T10:30:00Z",
  } as VersionEntry;

  assertThrows(
    () => validateVersionEntry(entry),
    Error,
    "file must be a non-empty string",
  );
});

Deno.test("validateVersionEntry - missing integrity throws", () => {
  const entry = {
    file: "test.js",
    integrity: "",
    size: 1000,
    date: "2025-01-15T10:30:00Z",
  } as VersionEntry;

  assertThrows(
    () => validateVersionEntry(entry),
    Error,
    "integrity must be a non-empty string",
  );
});

Deno.test("validateVersionEntry - invalid integrity format throws", () => {
  const entry: VersionEntry = {
    file: "test.js",
    integrity: "md5-abc123", // Wrong algorithm
    size: 1000,
    date: "2025-01-15T10:30:00Z",
  };

  assertThrows(
    () => validateVersionEntry(entry),
    Error,
    "must be a SHA-384 hash starting with 'sha384-'",
  );
});

Deno.test("validateVersionEntry - negative size throws", () => {
  const entry: VersionEntry = {
    file: "test.js",
    integrity: "sha384-abc",
    size: -1,
    date: "2025-01-15T10:30:00Z",
  };

  assertThrows(
    () => validateVersionEntry(entry),
    Error,
    "size must be a non-negative number",
  );
});

Deno.test("validateVersionEntry - invalid date throws", () => {
  const entry: VersionEntry = {
    file: "test.js",
    integrity: "sha384-abc",
    size: 1000,
    date: "not-a-date",
  };

  assertThrows(
    () => validateVersionEntry(entry),
    Error,
    "must be a valid ISO 8601 date string",
  );
});

Deno.test("validateVersionEntry - invalid major version throws", () => {
  const entry: VersionEntry = {
    file: "test.js",
    integrity: "sha384-abc",
    size: 1000,
    date: "2025-01-15T10:30:00Z",
    major: -1,
  };

  assertThrows(
    () => validateVersionEntry(entry),
    Error,
    "major must be a non-negative number",
  );
});

Deno.test("validateVersionManifest - valid manifest", () => {
  const validManifest: VersionManifest = {
    latest: "1.0.0",
    versions: {
      "1.0.0": {
        file: "donation-widget.v1.0.0.js",
        integrity: "sha384-abc123",
        size: 1000,
        date: "2025-01-15T10:30:00Z",
        major: 1,
        minor: 0,
        patch: 0,
      },
    },
  };

  // Should not throw
  validateVersionManifest(validManifest);
});

Deno.test("validateVersionManifest - multiple versions", () => {
  const manifest: VersionManifest = {
    latest: "1.1.0",
    versions: {
      "1.0.0": {
        file: "donation-widget.v1.0.0.js",
        integrity: "sha384-abc123",
        size: 1000,
        date: "2025-01-15T10:30:00Z",
      },
      "1.1.0": {
        file: "donation-widget.v1.1.0.js",
        integrity: "sha384-def456",
        size: 1100,
        date: "2025-01-20T14:00:00Z",
      },
    },
  };

  // Should not throw
  validateVersionManifest(manifest);
});

Deno.test("validateVersionManifest - invalid latest format throws", () => {
  const manifest: VersionManifest = {
    latest: "v1.0.0", // Invalid format
    versions: {
      "v1.0.0": {
        file: "test.js",
        integrity: "sha384-abc",
        size: 1000,
        date: "2025-01-15T10:30:00Z",
      },
    },
  };

  assertThrows(() => validateVersionManifest(manifest), Error);
});

Deno.test("validateVersionManifest - latest not in versions throws", () => {
  const manifest: VersionManifest = {
    latest: "2.0.0",
    versions: {
      "1.0.0": {
        file: "test.js",
        integrity: "sha384-abc",
        size: 1000,
        date: "2025-01-15T10:30:00Z",
      },
    },
  };

  assertThrows(
    () => validateVersionManifest(manifest),
    Error,
    'latest ("2.0.0") does not exist in versions map',
  );
});

Deno.test("validateVersionManifest - invalid version key throws", () => {
  const manifest: VersionManifest = {
    latest: "1.0.0",
    versions: {
      "v1.0.0": { // Invalid key format
        file: "test.js",
        integrity: "sha384-abc",
        size: 1000,
        date: "2025-01-15T10:30:00Z",
      },
    },
  };

  assertThrows(() => validateVersionManifest(manifest), Error);
});

Deno.test("validateVersionManifest - mismatched version metadata throws", () => {
  const manifest: VersionManifest = {
    latest: "1.0.0",
    versions: {
      "1.0.0": {
        file: "test.js",
        integrity: "sha384-abc",
        size: 1000,
        date: "2025-01-15T10:30:00Z",
        major: 2, // Doesn't match version key
        minor: 0,
        patch: 0,
      },
    },
  };

  assertThrows(
    () => validateVersionManifest(manifest),
    Error,
    "VersionEntry.major (2) does not match version key (1)",
  );
});

Deno.test("validateVersionManifest - invalid entry throws", () => {
  const manifest: VersionManifest = {
    latest: "1.0.0",
    versions: {
      "1.0.0": {
        file: "test.js",
        integrity: "md5-invalid", // Invalid integrity
        size: 1000,
        date: "2025-01-15T10:30:00Z",
      },
    },
  };

  assertThrows(() => validateVersionManifest(manifest), Error);
});

