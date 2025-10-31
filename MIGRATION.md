# Migration Guide: Deno to Node.js

This document explains the migration from Deno to Node.js and how it affects developers working with this project.

## What Changed

### Runtime
- **Before**: Deno 1.40+
- **After**: Node.js 18.0.0+ and npm 9.0.0+

### Dependency Management
- **Before**: Dependencies managed in `deno.json` with `npm:` prefixes
- **After**: Dependencies managed in `package.json` using standard npm format

### Task Runner
- **Before**: `deno task <command>`
- **After**: `npm run <command>`

### Linting
- **Before**: Built-in Deno linter (`deno lint`)
- **After**: ESLint with TypeScript support

## Installation & Setup

### For New Users

```bash
# Clone the repository
git clone https://github.com/Kalapaja/donato.git
cd donato

# Install dependencies
npm install

# Start development
npm run dev
```

### For Existing Deno Users

If you were previously using Deno, you need to:

1. Install Node.js 18.0.0 or higher from [nodejs.org](https://nodejs.org/)
2. Remove any Deno-specific configurations from your environment
3. Run `npm install` to install dependencies
4. Use `npm run` commands instead of `deno task`

## Available Commands

| Deno Command | Node.js Command | Description |
|--------------|-----------------|-------------|
| `deno task dev` | `npm run dev` | Start development server |
| `deno task build` | `npm run build` | Build for production |
| `deno task build:dev` | `npm run build:dev` | Build for development |
| `deno task preview` | `npm run preview` | Preview production build |
| `deno lint src/` | `npm run lint` | Lint source code |
| N/A | `npm run typecheck` | Type check without emitting files |

## Code Changes

### Import Statements

TypeScript file extensions have been removed from import statements to follow Node.js/ESM conventions:

**Before (Deno):**
```typescript
import { WalletService } from '../services/WalletService.ts';
import './donation-form.ts';
```

**After (Node.js):**
```typescript
import { WalletService } from '../services/WalletService';
import './donation-form';
```

### Type Declarations

Some type adjustments were made for Node.js compatibility:

**Before (Deno):**
```typescript
private quoteDebounceTimer: number | null = null;
```

**After (Node.js):**
```typescript
private quoteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
```

## Configuration Files

### New Files
- `package.json` - npm dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `eslint.config.mjs` - ESLint configuration

### Legacy Files (Kept for Reference)
- `deno.json` - No longer used, kept for reference
- `deno.lock` - No longer used, ignored by git

## What Stayed the Same

✅ All source code functionality remains identical
✅ Build output is the same size and quality
✅ Public API is unchanged
✅ Development workflow is similar
✅ Web Components still work exactly the same way
✅ All dependencies are the same (just managed by npm instead)

## Troubleshooting

### "Module not found" errors
Make sure you've run `npm install` after cloning or pulling changes.

### Build errors
1. Check that you're using Node.js 18.0.0 or higher: `node --version`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Clear the build cache: `rm -rf dist`

### Type errors
Run `npm run typecheck` to see detailed TypeScript errors.

## Benefits of Node.js

- **Better IDE Support**: Most IDEs have better support for Node.js projects
- **Larger Ecosystem**: Access to the entire npm ecosystem without special prefixes
- **More Familiar**: Node.js is more widely used and familiar to most developers
- **Better Tooling**: More mature tooling ecosystem (ESLint, Prettier, etc.)

## Questions?

If you have any questions about the migration, please:
1. Check the [README.md](README.md) for updated documentation
2. Open an issue on GitHub
3. Contact support at support@donations.kalatori.org
