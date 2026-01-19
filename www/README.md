# Donation Widget Landing Page

This is a Next.js landing page for configuring and generating embed code for the
Donation Widget.

## Features

The landing page provides a step-by-step configuration wizard:

1. **Recipient Address** - Enter the Ethereum address that will receive
   donations, with optional WalletConnect verification
2. **Network & Asset** - Select blockchain network and asset, with optional
   Etherscan Multichain Portfolio integration
3. **ReOwn Project ID** - Optional Project ID for wallet connections (falls back
   to browser extensions if omitted)
4. **Theme Configuration** - Choose from preset themes (auto, light, dark) or
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

#### Environment Variables

The site uses environment variables for configuration. For local development, you can create a `.env.local` file:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and set your site URL (optional for local development)
```

**Available Environment Variables:**

- `NEXT_PUBLIC_SITE_URL` - The canonical URL of your site (required for OpenGraph metadata in production)
  - Format: Full URL (e.g., `https://donation-widget.example.com`)
  - Default: `http://localhost:3000` (used automatically if not set)
  - **Note:** For local development, you can leave this unset. The site will use `http://localhost:3000` as a fallback.
  - **Production:** This must be set to your actual site URL for OpenGraph metadata to work correctly in social media previews.

The `.env.local` file is git-ignored and should not be committed to the repository. Use `.env.local.example` as a template.

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
- `NEXT_PUBLIC_SITE_URL` - The canonical URL of your site (required for OpenGraph metadata in production builds)

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
   - `NEXT_PUBLIC_SITE_URL` - The canonical URL of your deployed site (e.g., `https://donation-widget.example.com`)

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
│       ├── Step3ReOwn.tsx
│       └── Step4Theme.tsx
└── types/
    └── config.ts         # TypeScript types
```

## Configuration Flow

1. User enters recipient address (with optional wallet verification)
2. User selects chain and token (with optional portfolio check)
3. User optionally enters ReOwn Project ID
4. User selects or customizes theme
5. Preview is shown and embed code is generated

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

## Testing OpenGraph Metadata

The site includes comprehensive OpenGraph and Twitter Card metadata for proper social media previews. Here's how to test and validate the metadata:

### Build-time Verification

First, verify that metadata is generated correctly during build:

```bash
# Build the site
npm run build

# Check for OpenGraph tags in generated HTML
grep -E "og:" out/index.html

# Check for Twitter Card tags
grep -E "twitter:" out/index.html

# Verify metadataBase and canonical URL
grep -E "(metadataBase|canonical)" out/index.html
```

Expected output should include:
- `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- `theme-color` meta tag

### Online Validation Tools

After deploying to a public URL, use these tools to validate OpenGraph metadata:

#### 1. Facebook Sharing Debugger
- **URL:** https://developers.facebook.com/tools/debug/
- **Usage:** Enter your site URL and click "Debug"
- **Features:**
  - Shows how your link will appear when shared on Facebook
  - Displays OpenGraph image preview
  - Allows you to "Scrape Again" to clear Facebook's cache
- **What to check:**
  - Image displays correctly (1200x630px recommended)
  - Title and description are correct
  - URL is absolute and accessible

#### 2. Twitter Card Validator
- **URL:** https://cards-dev.twitter.com/validator
- **Usage:** Enter your site URL and click "Preview card"
- **Features:**
  - Shows how your link will appear in Twitter/X
  - Validates Twitter Card metadata
  - Displays image preview
- **What to check:**
  - Card type is "summary_large_image"
  - Image displays correctly
  - Title and description are within character limits

#### 3. LinkedIn Post Inspector
- **URL:** https://www.linkedin.com/post-inspector/
- **Usage:** Enter your site URL and click "Inspect"
- **Features:**
  - Shows how your link will appear on LinkedIn
  - Validates OpenGraph tags
  - Allows cache refresh
- **What to check:**
  - Image displays correctly
  - Title and description are appropriate for professional network

#### 4. OpenGraph.xyz (Universal Validator)
- **URL:** https://www.opengraph.xyz/
- **Usage:** Enter your site URL
- **Features:**
  - Validates OpenGraph tags across multiple platforms
  - Shows preview for Facebook, Twitter, LinkedIn, Slack, Discord
  - Displays all detected metadata tags
- **What to check:**
  - All platforms show correct preview
  - All required tags are present

### Manual Testing Checklist

Use this checklist to verify OpenGraph metadata works correctly across different social networks:

#### Pre-deployment Checks
- [ ] Site builds successfully without errors
- [ ] `NEXT_PUBLIC_SITE_URL` environment variable is set correctly
- [ ] OpenGraph image is accessible at the configured path
- [ ] All metadata tags are present in generated HTML (`out/index.html`)

#### Facebook Testing
- [ ] Share link in Facebook post or comment
- [ ] Verify image appears (1200x630px recommended)
- [ ] Verify title matches `siteConfig.title`
- [ ] Verify description matches `siteConfig.description`
- [ ] Click "Scrape Again" in Facebook Debugger to clear cache if needed

#### Twitter/X Testing
- [ ] Share link in a tweet
- [ ] Verify large image card appears
- [ ] Verify title and description are correct
- [ ] Check that image loads quickly (optimize if > 1MB)
- [ ] Test on mobile Twitter app

#### LinkedIn Testing
- [ ] Share link in LinkedIn post
- [ ] Verify image appears correctly
- [ ] Verify title and description are professional and appropriate
- [ ] Check that preview looks good on desktop and mobile

#### Telegram Testing
- [ ] Share link in Telegram chat
- [ ] Verify image preview appears
- [ ] Verify title and description are displayed
- [ ] Test in both desktop and mobile Telegram apps

#### Other Platforms
- [ ] **Slack:** Share link in Slack channel, verify preview
- [ ] **Discord:** Share link in Discord, verify embed
- [ ] **WhatsApp:** Share link, verify preview (if supported)
- [ ] **Reddit:** Share link, verify preview card

#### Mobile Testing
- [ ] Test sharing on iOS Safari
- [ ] Test sharing on Android Chrome
- [ ] Verify image displays correctly on mobile devices
- [ ] Check that preview cards are readable on small screens

#### Edge Cases
- [ ] Test with different URL parameters (if applicable)
- [ ] Verify metadata works for homepage and any subpages
- [ ] Test after clearing browser cache
- [ ] Verify metadata updates after configuration changes

### Troubleshooting

**Problem:** Image doesn't appear in social media previews
- **Solution:** 
  - Verify image path is correct and accessible
  - Ensure image URL is absolute (not relative)
  - Check image file size (< 8MB recommended)
  - Clear social media platform cache using their debugger tools

**Problem:** Metadata shows old values after updating
- **Solution:**
  - Social media platforms cache metadata. Use "Scrape Again" or "Clear Cache" in their debugger tools
  - Rebuild and redeploy the site
  - Wait a few minutes for cache to expire (usually 24 hours)

**Problem:** Build fails with configuration errors
- **Solution:**
  - Check that `NEXT_PUBLIC_SITE_URL` is set and is an absolute URL
  - Verify all required fields in `siteConfig` are present
  - Check validation errors in build output

**Problem:** Metadata not appearing in generated HTML
- **Solution:**
  - Verify `metadataBase` is set correctly in `layout.tsx`
  - Check that `siteConfig` is imported and used correctly
  - Ensure Next.js Metadata API is being used (not manual meta tags)

### Additional Resources

- [Next.js Metadata API Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [OpenGraph Protocol Specification](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)

## Deployment

This site is deployed on **Cloudflare Pages**. See the "Deployment on Cloudflare Pages" section above for configuration details.

For other hosting platforms (Netlify, etc.), ensure:
1. Set `GITHUB_TOKEN` and `GITHUB_REPOSITORY` environment variables
2. Configure build command: `npm run build`
3. Set output directory to: `out`
4. Ensure Deno is available in the build environment (required for fetch-releases script)
