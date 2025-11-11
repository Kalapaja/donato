# Donation Widget Landing Page

This is a Next.js landing page for configuring and generating embed code for the
Donation Widget.

## Features

The landing page provides a step-by-step configuration wizard:

1. **Recipient Address** - Enter the Ethereum address that will receive
   donations, with optional WalletConnect verification
2. **Network & Asset** - Select blockchain network and asset, with optional
   Etherscan Multichain Portfolio integration
3. **LiFi API Key** - Optional API key registration for cross-chain swaps
4. **ReOwn Project ID** - Optional Project ID for wallet connections (falls back
   to browser extensions if omitted)
5. **Theme Configuration** - Choose from preset themes (auto, light, dark) or
   create a custom theme with color wizard

After configuration, the page shows:

- Live preview of the configured widget
- Generated embed code ready to copy

## Getting Started

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the
landing page.

#### Mocking Versions for Local Development

For local development, the configurator needs a `versions.json` file to display available widget versions. You have two options:

**Option 1: Use Mock Data (Quick Start)**

Copy the example file to create a local mock:

```bash
npm run mock:versions
# or manually:
# cp public/versions.json.example public/versions.json
```

This creates a mock with several example versions for testing. The file is already git-ignored.

**Option 2: Fetch Real Data**

Run the prebuild script to fetch actual releases from GitHub:

```bash
# Set required environment variables
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_REPOSITORY=kampela/donato

# Fetch releases
npm run prebuild
```

**Option 3: Use API Route (Advanced)**

For more control over mock data, you can use the Next.js API route at `/api/versions`. To enable this:

1. The API route is already created at `app/api/versions/route.ts`
2. Update the `VersionSelector` component to use the API route:

```tsx
<VersionSelector
  selectedVersion={selectedVersion}
  onVersionChange={handleVersionChange}
  manifestUrl="/api/versions"  // <-- Add this prop
/>
```

The API route automatically:
- Returns mock data in development
- Uses dynamic dates (today, yesterday, etc.)
- Redirects to static file in production

**Structure of `versions.json`:**

```json
{
  "latest": "0.1.0",
  "versions": {
    "0.1.0": {
      "file": "donation-widget.v0.1.0.js",
      "integrity": "sha384-...",
      "size": 245760,
      "date": "2025-11-07T00:00:00.000Z",
      "releaseUrl": "https://github.com/...",
      "major": 0,
      "minor": 1,
      "patch": 0
    }
  }
}
```

### Building for Production

The build process automatically fetches all widget releases from GitHub and prepares them for serving:

```bash
# Set required environment variables
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_REPOSITORY=kampela/donato

# Build (automatically runs prebuild to fetch releases)
npm run build
```

**What happens during build:**

1. **Prebuild step** (`npm run prebuild`):
   - Fetches all releases from GitHub repository
   - Downloads widget script files (`.js`) and integrity files (`.integrity.txt`)
   - Verifies file integrity
   - Generates `public/versions.json` manifest with all available versions
   
2. **Build step** (`npm run build`):
   - Next.js builds the static site
   - Includes downloaded widget files and versions manifest
   - Ready for deployment

**Required Environment Variables:**

- `GITHUB_TOKEN` - GitHub personal access token or Actions token
- `GITHUB_REPOSITORY` - Repository in format "owner/repo" (e.g., "kampela/donato")

### Deployment on Cloudflare Pages

The site is deployed and built on Cloudflare Pages. Configure the following:

**Build Configuration:**
- Build command: `npm run build`
- Build output directory: `out`
- Root directory: `www`

**Environment Variables in Cloudflare Pages:**
1. Go to your Cloudflare Pages project settings
2. Navigate to "Settings" → "Environment variables"
3. Add the following variables:
   - `GITHUB_TOKEN` - Your GitHub personal access token (with `repo` scope for private repos)
   - `GITHUB_REPOSITORY` - `kampela/donato`

**Creating a GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Cloudflare Pages - Donato Build")
4. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
5. Generate token and copy it to Cloudflare Pages environment variables

## Project Structure

```
www/
├── app/
│   ├── page.tsx          # Main landing page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ConfigWizard.tsx  # Main wizard component
│   ├── WidgetPreview.tsx # Widget preview component
│   ├── EmbedCode.tsx     # Embed code generator
│   └── steps/            # Individual step components
│       ├── Step1Recipient.tsx
│       ├── Step2CurrencyChain.tsx
│       ├── Step3LiFi.tsx
│       ├── Step4ReOwn.tsx
│       └── Step5Theme.tsx
└── types/
    └── config.ts         # TypeScript types
```

## Configuration Flow

1. User enters recipient address (with optional wallet verification)
2. User selects chain and token (with optional portfolio check)
3. User optionally enters LiFi API key
4. User optionally enters ReOwn Project ID
5. User selects or customizes theme
6. Preview is shown and embed code is generated

## Widget Integration

The configurator automatically fetches and serves all widget versions:

- Widget files are fetched from GitHub Releases during build
- All versions are available in `public/` directory
- `public/versions.json` contains metadata for all versions
- Configurator displays version selector and generates version-specific embed codes with SRI hashes

**Manual Testing Locally:**

If you want to test without fetching from GitHub:

1. Build the widget from the root directory
2. Copy built files to `www/public/`:
   - `donation-widget.v{version}.js`
   - `donation-widget.v{version}.js.integrity.txt`
3. Manually create/update `public/versions.json`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes fetching releases)
- `npm run prebuild` - Fetch releases from GitHub (runs automatically before build)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run mock:versions` - Create mock versions.json for local development

For more details on build scripts, see `../scripts/README.md`.

## Learn More

To learn more about this project:

- [Widget Versioning & SRI Design](.kiro/specs/widget-versioning-sri/design.md) - Architecture documentation
- [Build Scripts](../scripts/README.md) - Detailed documentation on build and fetch scripts
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial

## Deployment

This site is deployed on **Cloudflare Pages**. See the "Deployment on Cloudflare Pages" section above for configuration details.

For other hosting platforms (Netlify, etc.), ensure:
1. Set `GITHUB_TOKEN` and `GITHUB_REPOSITORY` environment variables
2. Configure build command: `npm run build`
3. Set output directory to: `out`
4. Ensure Deno is available in the build environment (required for fetch-releases script)
