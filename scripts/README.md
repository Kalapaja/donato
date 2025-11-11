# Release Scripts

This directory contains scripts for building and releasing the donation widget.

## Directory Structure

```
scripts/
├── release/        # Build and release automation
├── utils/          # Utility functions
├── manifest/       # Manifest management and types
├── fetch/          # Fetch releases from GitHub (for configurator)
└── README.md       # This file
```

## Scripts Overview

### Release Scripts (`release/`)

#### `build-release.ts`

Builds the widget for release with versioning and integrity hash generation.

**Usage in GitHub Actions:**
```bash
GITHUB_REF_NAME=v1.0.0 deno task build:release
```

**Local testing:**
```bash
GITHUB_REF_NAME=v1.0.0 deno run --allow-read --allow-write --allow-run --allow-env scripts/release/build-release.ts
```

**Outputs:**
- `dist/donation-widget.v{version}.js` - Versioned widget bundle
- `dist/donation-widget.v{version}.js.integrity.txt` - SHA-384 integrity hash

#### `update-release-notes.ts`

Updates GitHub Release notes with installation instructions, security information, and SRI hashes.

**Usage in GitHub Actions:**
```bash
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }} \
GITHUB_REPOSITORY=${{ github.repository }} \
RELEASE_ID=${{ github.event.release.id }} \
VERSION=1.0.0 \
INTEGRITY=sha384-xxx \
WIDGET_FILE=dist/donation-widget.v1.0.0.js \
deno task release:update-notes
```

**Local testing:**
```bash
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_REPOSITORY=owner/repo
export RELEASE_ID=123456
export VERSION=1.0.0
export INTEGRITY=sha384-xxx
export WIDGET_FILE=dist/donation-widget.v1.0.0.js

deno task release:update-notes
```

**Required environment variables:**
- `GITHUB_TOKEN` - GitHub personal access token with `repo` scope
- `GITHUB_REPOSITORY` - Repository in format "owner/repo"
- `RELEASE_ID` - GitHub Release ID (numeric)
- `VERSION` - Widget version (e.g., "1.0.0")
- `INTEGRITY` - SRI integrity hash (e.g., "sha384-...")
- `WIDGET_FILE` - Path to widget file

#### `post-build.ts`

Post-build script that updates the manifest after building.

**Usage:**
```bash
deno task post-build
```

### Utility Scripts (`utils/`)

#### `calculate-integrity.ts`

Utility for calculating SHA-384 integrity hashes for SRI verification.

**Usage:**
```bash
deno run --allow-read scripts/utils/calculate-integrity.ts dist/donation-widget.js
```

#### `version-extractor.ts`

Extracts version information from deno.json and validates semantic versioning.

### Manifest Scripts (`manifest/`)

#### `manifest-manager.ts`

Manages the versions manifest file with version entries and metadata.

#### `manifest-types.ts`

TypeScript types and interfaces for manifest and version management.

### Fetch Scripts (`fetch/`)

#### `fetch-releases.ts`

Fetches all widget releases from the GitHub repository API and prepares them for the configurator website.

**Purpose**: Download release information from GitHub to build the versions manifest. Supports multiple modes: fetch metadata only, download assets, or generate manifest.

**Usage**:

Build mode (download assets + generate manifest):
```bash
GITHUB_TOKEN=ghp_xxx \
GITHUB_REPOSITORY=owner/repo \
deno run --allow-read --allow-write --allow-net --allow-env scripts/fetch/fetch-releases.ts build [output-dir]
```

Fetch mode (metadata only):
```bash
GITHUB_TOKEN=ghp_xxx \
GITHUB_REPOSITORY=owner/repo \
deno run --allow-net --allow-env scripts/fetch/fetch-releases.ts fetch
```

**Used by**: The configurator website (`www/`) uses this to download all available widget versions.

## Testing

Run tests for all scripts:

```bash
deno test scripts/ --allow-read --allow-write --allow-env --allow-net
```

Run tests for a specific script:

```bash
deno test scripts/update-release-notes.test.ts
```

## Deno Tasks

The following tasks are available in `deno.json`:

- `build:release` - Build widget for release with versioning
- `release:update-notes` - Update GitHub Release notes
- `post-build` - Run post-build tasks

## GitHub Actions Workflow

The release workflow (`.github/workflows/release.yml`) uses these scripts to:

1. **Build** - `build-release.ts` creates versioned bundle and integrity hash
2. **Upload** - GitHub CLI uploads artifacts to release
3. **Update** - `update-release-notes.ts` enhances release notes

The workflow is triggered when a new release is created with a version tag (e.g., `v1.0.0`).

## Development

When adding new scripts:

1. Choose appropriate subdirectory (`release/`, `utils/`, `manifest/`, or `fetch/`)
2. Create the script in the chosen subdirectory
3. Add tests in the same subdirectory as `{script-name}.test.ts`
4. Add task to root `deno.json` or `www/deno.json` if needed
5. Update this README
6. Run tests to verify: `deno test scripts/`

## Security Considerations

- Never commit `GITHUB_TOKEN` to the repository
- Use GitHub Actions secrets for tokens
- Verify SRI hashes match after downloading releases
- All scripts use SHA-384 for integrity hashes (recommended by W3C)

