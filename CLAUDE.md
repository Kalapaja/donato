# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Donato is an embeddable cryptocurrency donation widget built as a Web Component using Lit. It supports cross-chain donations via LiFi SDK, allowing donors to pay with any token on any supported chain while recipients receive their preferred token.

## Development Commands

```bash
# Full development stack (widget build watch + vite dev server + www site)
deno task dev

# Individual dev servers
deno task dev:build     # Build widget in watch mode
deno task dev:vite      # Vite dev server on port 3000
deno task dev:www       # Configurator site on port 3001

# Production builds
deno task build         # Full production build with versioning + www
deno task build:dev     # Development build only

# Linting
deno task lint          # Lint src/ directory

# Testing (Deno native test runner)
deno test scripts/ --allow-read --allow-write --allow-env --allow-net

# Release (automated via GitHub Actions on tag push)
deno task build:release # Build versioned bundle with SRI hash
```

## Architecture

### Two-Part Structure

1. **Widget (src/)** - Lit Web Component bundle distributed as a single UMD file
2. **Configurator (www/)** - Next.js 16 static site for widget configuration

### Key Directories

- `src/components/` - Lit Web Components (27 total)
- `src/services/` - Business logic layer (WalletService, LiFiService, ChainService, ThemeService, I18nService)
- `src/i18n/` - Translations (en, ru)
- `www/` - Next.js configurator site (separate package.json, uses npm)
- `scripts/` - Build automation and release scripts
- `dist/` - Built widget bundles

### Service Layer Pattern

Business logic is separated from components into services:
- **WalletService** - Wallet connection and token management via Reown AppKit
- **LiFiService** - Cross-chain swap routing via LiFi SDK
- **ChainService** - Chain metadata (Ethereum, Arbitrum, Polygon, BSC, Optimism, Base)
- **ThemeService** - Theme management with CSS variables
- **I18nService** - Localization service

### Build Output

- `dist/donation-widget.js` - Unversioned bundle (development)
- `dist/donation-widget.v{version}.js` - Versioned bundle (production)
- `dist/donation-widget.v{version}.js.integrity.txt` - SHA-384 SRI hash

### Versioning System

Version is tracked in `deno.json`. The release workflow:
1. Update version in `deno.json`
2. Create and push git tag: `git tag v0.2.0 && git push origin v0.2.0`
3. GitHub Actions builds, calculates SRI hash, and creates release

## Key Technologies

- **Runtime**: Deno 2.5+ (primary), Node.js for www/
- **Widget**: Lit 3.3, ethers 6, viem, @reown/appkit, @lifi/sdk
- **Build**: Vite with custom versioning plugin (`vite-plugin-versioning.ts`)
- **Configurator**: Next.js 16, React 19

## Entry Points

- `src/index.ts` - Widget exports and component registration
- `src/components/donation-widget.ts` - Main widget component
- `vite.config.ts` - Build configuration
- `deno.json` - Task definitions and version
