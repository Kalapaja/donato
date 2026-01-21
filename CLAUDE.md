# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Donato is an embeddable cryptocurrency donation widget built as a Web Component using Lit. It supports cross-chain donations via Across Protocol API, allowing donors to pay with any token on any supported chain while recipients receive USDC on Polygon.

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
deno task test          # Run all tests
# Run specific test file:
deno test src/services/AcrossService.test.ts --no-check -A

# Release (automated via GitHub Actions on tag push)
deno task build:release # Build versioned bundle with SRI hash
```

## Architecture

### Two-Part Structure

1. **Widget (src/)** - Lit Web Component bundle distributed as a single UMD file
2. **Configurator (www/)** - Next.js 16 static site for widget configuration

### Key Directories

- `src/components/` - Lit Web Components with co-located tests (`.test.ts`)
- `src/services/` - Business logic layer (singleton pattern)
- `src/constants/` - Application constants including AzothPay contract addresses
- `src/i18n/` - Translations (en, ru)
- `www/` - Next.js configurator site (separate package.json, uses npm)
- `scripts/` - Build automation and release scripts
- `dist/` - Built widget bundles

### Service Layer Pattern

Business logic is separated from components into services (singleton pattern):
- **WalletService** - Wallet connection and token management via Reown AppKit
- **AcrossService** - Cross-chain swap routing via Across Protocol API
- **ChainService** - Chain metadata (Ethereum, Arbitrum, Polygon, BSC, Optimism, Base)
- **ThemeService** - Theme management with CSS variables
- **I18nService** - Localization service with `t(key)` helper
- **ToastService** - Toast notification management
- **AzothPayService** - Recurring subscription support with EIP-712 signatures

### Main Widget Flow (State Machine)

The `donation-widget.ts` component uses a flow-based state machine:
```
AMOUNT → WALLET → TOKEN → READY → PROCESSING → SUCCESS
                           ↓
                      SUBSCRIPTION_SETUP → SUBSCRIPTION_PROGRESS
```

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
- **Widget**: Lit 3.3, ethers 6, viem 2.38, @reown/appkit 1.8
- **Build**: Vite 7 with custom versioning plugin (`vite-plugin-versioning.ts`)
- **Configurator**: Next.js 16, React 19

## Entry Points

- `src/index.ts` - Widget exports and component registration
- `src/components/donation-widget.ts` - Main widget component (state machine)
- `src/components/donation-form.ts` - Core donation form logic
- `vite.config.ts` - Build configuration
- `deno.json` - Task definitions and version

## Important Constants

- **Recipient Chain**: Polygon (chainId: 137)
- **Recipient Token**: USDC (hardcoded)
- **Supported Source Chains**: Ethereum (1), Arbitrum (42161), Polygon (137), BSC (56), Optimism (10), Base (8453)
