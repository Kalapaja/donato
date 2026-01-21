# Donation Widget

A modern, embeddable cryptocurrency donation widget with cross-chain support
powered by Across Protocol. Accept donations in any token on any supported chain.
Recipients always receive USDC on Polygon.

[![License: GPLv3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## ✨ Features

- 🔗 **Cross-chain support** - Accept donations from Ethereum, Arbitrum,
  Polygon, BSC, Optimism, Base, and more
- 💱 **Any token to USDC** - Automatic conversion to USDC on Polygon via Across Protocol
- 🎨 **Fully customizable themes** - Light, dark, auto, or completely custom
  color schemes
- 📱 **Responsive design** - Works perfectly on mobile and desktop
- 🔌 **Easy integration** - Simple HTML tag, no complex setup
- 🎯 **Event-driven API** - Track donations, wallet connections, and errors
- 🌐 **Web Components** - Built with Lit, works with any framework or vanilla
  JavaScript
- 🔒 **Secure** - Uses WalletConnect/Reown for wallet connections

## 📦 Installation

### Option 1: Using the Configurator (Recommended)

The easiest way to integrate the widget is to use the configurator:

1. Visit the configurator (deployed from `www/`)
2. Configure your widget (recipient address, theme, etc.)
3. Select a specific version or use "latest"
4. Copy the generated embed code with the correct integrity hash
5. Paste it into your website

The configurator automatically generates the complete embed code including:
- Versioned script URL with SRI integrity hash
- Widget configuration HTML
- All necessary security attributes (`crossorigin="anonymous"`)

### Option 2: Manual Integration from Versioned CDN

If you prefer manual integration, you can embed a specific version directly:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <!-- Your donation widget (recipients receive USDC on Polygon) -->
    <donation-widget
      recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      reown-project-id="YOUR_REOWN_PROJECT_ID"
    >
    </donation-widget>

    <!-- Load specific version with SRI (recommended for production) -->
    <script
      src="https://cdn.donations.kalatori.org/donation-widget.v0.1.1.js"
      integrity="sha384-..."
      crossorigin="anonymous"
    ></script>
  </body>
</html>
```

**Important:**
- Recipients always receive USDC on Polygon network
- Replace `your-cdn-domain.com` with your actual CDN domain where the widget is hosted
- Always include the `integrity` attribute for security (get the hash from `versions.json`)
- The `crossorigin="anonymous"` attribute is required for SRI to work

### Option 3: Download from GitHub Releases

You can also download widget files directly from [GitHub Releases](https://github.com/Kalapaja/donato/releases):

1. Go to the [Releases page](https://github.com/Kalapaja/donato/releases)
2. Download `donation-widget.v{version}.js` from the latest release
3. Download `donation-widget.v{version}.js.integrity.txt` for the SRI hash
4. Host the file on your own server or CDN
5. Use the integrity hash in your embed code

### Option 4: Build from Source

```bash
# Clone the repository
git clone https://github.com/Kalapaja/donato.git
cd donation-widget

# Install dependencies with Deno
deno install

# Build the widget
deno task build
```

The compiled widget will be in the `dist/` directory.

## 🔐 Widget Versioning & Subresource Integrity (SRI)

The donation widget supports versioned deployments with cryptographic integrity verification through Subresource Integrity (SRI). This ensures both stability and security for your integration.

### Release & Distribution Architecture

The widget uses a GitHub Release-based versioning system with automatic build and distribution:

**How it works:**

1. **Widget Build & Release** (Automated via GitHub Actions)
   - When a Git tag is created (e.g., `v0.0.0`), GitHub Actions automatically triggers
   - The widget is built with Vite in production mode
   - The bundle is renamed to `donation-widget.v{version}.js`
   - A SHA-384 integrity hash is calculated and saved to a `.integrity.txt` file
   - Both files are uploaded as GitHub Release assets
   - Release notes are automatically generated with embed code examples

2. **WWW Build Process** (Automated during deployment)
   - The configurator website (`www/`) fetches all releases from the GitHub API during build
   - Widget scripts and integrity files are downloaded from GitHub Release assets
   - All versions are placed in the `www/public/` directory for serving
   - A `versions.json` manifest is generated containing metadata for all versions
   - The manifest includes version numbers, file paths, integrity hashes, sizes, and release dates

3. **Static File Serving** (CDN/Static Host)
   - All widget versions are served from the `www/public/` directory
   - Versioned files get long-term cache headers (1 year, immutable)
   - The `versions.json` manifest gets short-term cache (5 minutes)
   - CORS headers allow the widget to be embedded on any domain

4. **User Integration**
   - Users visit the configurator to select a version and generate embed code
   - The configurator reads `versions.json` to show available versions
   - Generated embed code includes the versioned URL and integrity hash
   - Browsers verify the integrity hash before executing the script

**Benefits of this architecture:**
- ✅ **Immutable versions** - Once published, versions never change
- ✅ **Automatic distribution** - No manual deployment needed
- ✅ **Version discovery** - Configurator always shows all available versions
- ✅ **Security** - SRI ensures scripts haven't been tampered with
- ✅ **Performance** - Long-term caching for optimal load times

### What is Versioning?

Widget versioning allows you to:
- **Lock to a specific version** - Your integration remains stable even when new versions are released
- **Control updates** - Choose when to upgrade to new features or bug fixes
- **Ensure compatibility** - Test new versions before deploying to production
- **Roll back easily** - Return to a previous version if issues arise

All widget builds follow [semantic versioning](https://semver.org/) (MAJOR.MINOR.PATCH):
- **MAJOR** - Breaking changes that may require code updates
- **MINOR** - New features, backward compatible
- **PATCH** - Bug fixes, backward compatible

### What is Subresource Integrity (SRI)?

Subresource Integrity is a security feature that enables browsers to verify that files they fetch (such as the widget script) are delivered without unexpected manipulation.

**How it works:**
1. A cryptographic hash (SHA-384) is calculated from the widget file during build
2. This hash is included in the `integrity` attribute of the script tag
3. When the browser loads the script, it recalculates the hash
4. If the hashes match, the script is executed; if not, the browser blocks it

**Benefits of SRI:**
- 🛡️ **Security** - Protects against compromised CDNs or man-in-the-middle attacks
- ✅ **Integrity** - Guarantees the exact code you tested is what runs on user browsers
- 🔒 **Trust** - Users can verify the script hasn't been tampered with
- 📋 **Compliance** - Meets security requirements for many organizations

### Versioned vs Latest URLs

The widget is available through two types of URLs:

#### Versioned URL (Recommended for Production)
```html
<!-- Specific version with SRI -->
<script
  src="https://your-cdn.com/donation-widget.v0.0.0.js"
  integrity="sha384-7VZDmiHh/FiieJH3qmVUcQ+fXKmNcEUd1+LV7evvqlk9EJnENaN4C64/Asu2LXBB"
  crossorigin="anonymous"
></script>
```

**Characteristics:**
- ✅ Immutable - Never changes once published
- ✅ Long cache (1 year) - Excellent performance
- ✅ SRI protection - Maximum security
- ✅ Stable - No unexpected updates
- ❌ Manual updates required

**Best for:**
- Production websites
- Critical integrations
- Applications requiring stability
- Security-conscious deployments

#### Latest URL (Convenient for Development)
```html
<!-- Always serves the latest version -->
<script
  src="https://your-cdn.com/donation-widget.js"
  integrity="sha384-7VZDmiHh/FiieJH3qmVUcQ+fXKmNcEUd1+LV7evvqlk9EJnENaN4C64/Asu2LXBB"
  crossorigin="anonymous"
></script>
```

**Characteristics:**
- ✅ Auto-updates - Always get the latest features and fixes
- ✅ SRI protection - Still secure
- ⚠️ Short cache (5 minutes) - Checks for updates frequently
- ⚠️ May introduce changes - Update integrity hash when version changes
- ❌ Less stable - Behavior may change

**Best for:**
- Development and testing
- Personal projects
- Getting started quickly
- Non-critical integrations

### Using Versioned Widget Scripts

#### Step 1: Find Available Versions

The `versions.json` manifest is automatically generated during the www build and contains metadata for all published widget versions.

**Access the manifest:**
- From the configurator domain: `https://your-cdn-domain.com/versions.json`
- This file is generated by the www build process from GitHub Releases
- Updated automatically when new versions are released and the www site is deployed

**Example manifest structure:**
```json
{
  "latest": "0.0.0",
  "versions": {
    "0.0.0": {
      "file": "donation-widget.v0.0.0.js",
      "integrity": "sha384-7VZDmiHh/FiieJH3qmVUcQ+fXKmNcEUd1+LV7evvqlk9EJnENaN4C64/Asu2LXBB",
      "size": 2781344,
      "date": "2025-11-07T13:36:05.372Z",
      "releaseUrl": "https://github.com/Kalapaja/donato/releases/tag/v0.0.0"
    }
  }
}
```

The manifest includes:
- `latest` - The recommended stable version
- `file` - The filename in the public directory
- `integrity` - The SHA-384 hash for SRI
- `size` - File size in bytes
- `date` - Release publication date
- `releaseUrl` - Link to the GitHub Release with full release notes

#### Step 2: Choose Your Version

Select the version you want to use based on:
- **latest** field - The recommended stable version
- **date** - When the version was published
- **size** - Bundle size for performance considerations

#### Step 3: Copy the Versioned Embed Code

Use the script tag with the correct version and integrity hash:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <!-- Your donation widget -->
    <donation-widget
      recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      reown-project-id="YOUR_REOWN_PROJECT_ID"
    >
    </donation-widget>

    <!-- Load specific version with SRI -->
    <script
      src="https://your-cdn.com/donation-widget.v0.0.0.js"
      integrity="sha384-7VZDmiHh/FiieJH3qmVUcQ+fXKmNcEUd1+LV7evvqlk9EJnENaN4C64/Asu2LXBB"
      crossorigin="anonymous"
    ></script>
  </body>
</html>
```

**Important:** Always include both the `integrity` and `crossorigin="anonymous"` attributes for SRI to work properly.

### Creating a New Release

If you're a maintainer creating a new widget version:

1. **Update the version** in `deno.json`:
   ```json
   {
     "version": "0.2.0"
   }
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Release v0.2.0"
   ```

3. **Create and push a Git tag**:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

4. **GitHub Actions automatically**:
   - Builds the widget
   - Calculates the integrity hash
   - Creates a GitHub Release
   - Uploads the versioned bundle and integrity file
   - Generates release notes with embed code

5. **The www site automatically**:
   - Fetches the new release during next deployment
   - Downloads the widget files to `www/public/`
   - Updates the `versions.json` manifest
   - Makes the new version available in the configurator

**Note:** Git tags must follow the format `vX.Y.Z` (e.g., `v0.0.0`, `v1.2.3`).

### Using the Widget Configurator

The easiest way to generate embed code with the correct version and integrity hash is to use the interactive configurator (deployed from the `www/` directory).

The configurator will:
1. Display all available widget versions from `versions.json`
2. Let you select a specific version or use "latest"
3. Generate the complete embed code with the correct integrity hash
4. Include all your configuration options (recipient, theme, etc.)
5. Show version metadata (size, release date, release notes link)

### Updating to a New Version

When you're ready to update to a new version:

1. **Check the changelog** - Review what changed in the new version
2. **Test in development** - Use the new version in a test environment
3. **Update your embed code** - Replace both the `src` URL and `integrity` hash
4. **Deploy** - Push the updated code to production

Example update from v0.0.0 to v0.2.0:

```html
<!-- Before: Version 0.0.0 -->
<script
  src="https://your-cdn.com/donation-widget.v0.0.0.js"
  integrity="sha384-OLD_HASH_HERE"
  crossorigin="anonymous"
></script>

<!-- After: Version 0.2.0 -->
<script
  src="https://your-cdn.com/donation-widget.v0.2.0.js"
  integrity="sha384-NEW_HASH_HERE"
  crossorigin="anonymous"
></script>
```

**Important:** You must update BOTH the URL and the integrity hash together, or the script will fail to load.

### Troubleshooting SRI Issues

#### Script Fails to Load
**Error:** "Failed to find a valid digest in the 'integrity' attribute"

**Causes:**
- Mismatched integrity hash and script content
- Incorrect version URL
- Script modified in transit

**Solutions:**
1. Verify you're using the correct integrity hash from versions.json
2. Make sure the version in the URL matches the hash you're using
3. Check that your CDN/server hasn't modified the file (compression, minification)
4. Ensure CORS headers are properly configured with `Access-Control-Allow-Origin: *`

#### CORS Errors
**Error:** "Cross-Origin Request Blocked"

**Solution:**
The script must be served with proper CORS headers. Ensure your server includes:
```
Access-Control-Allow-Origin: *
```

The `crossorigin="anonymous"` attribute in the script tag is required for SRI to work with CDN-hosted files.

### Security Best Practices

1. **Always use SRI in production** - Include the `integrity` attribute
2. **Use versioned URLs for stability** - Pin to specific versions
3. **Verify hashes manually** - When updating, check versions.json for the correct hash
4. **Serve over HTTPS** - SRI only works with secure connections
5. **Monitor for updates** - Subscribe to release notifications
6. **Test before deploying** - Always test new versions in a staging environment

### Building Your Own Versioned Widget

For maintainers and contributors creating new versions:

**Development build (local testing):**
```bash
# Regular development build (not versioned)
deno task build

# This creates:
# - dist/donation-widget.js (for local development)
# - dist/donation-widget.js.map (source map)
```

**Production release (versioned):**
```bash
# 1. Update version in deno.json
# 2. Commit and create a Git tag
git tag v0.2.0
git push origin v0.2.0

# GitHub Actions will automatically:
# - Run: deno task build:release
# - Create dist/donation-widget.v0.2.0.js (versioned bundle)
# - Calculate SHA-384 hash and save to .integrity.txt
# - Upload both files to GitHub Release
# - Generate comprehensive release notes
```

**For self-hosting (advanced):**

If you want to host the widget on your own infrastructure:

1. Download widget files from GitHub Releases
2. Set up the www build process to fetch from your releases
3. Configure your CDN/static host with proper cache headers
4. Update the configurator to point to your CDN domain

See the `www/scripts/fetch-releases.ts` script for reference configuration.

## 🚀 Quick Start

### Basic Usage

The minimal setup requires these attributes:

```html
<!-- Recipients always receive USDC on Polygon -->
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
>
</donation-widget>
```

**Important:**

- Get your free Reown Project ID at [https://reown.com](https://reown.com)
- Recipients always receive USDC on Polygon network

### With All Options

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="dark"
  locale="en"
  default-amount="25"
  header-title="Support Us"
  success-message="Thank you for your support!"
  donate-again-text="Donate Again"
  confetti-enabled="true"
  confetti-colors="#ff6b6b,#4ecdc4,#45b7d1"
>
</donation-widget>
```

## ⚙️ Configuration

### Required Attributes

| Attribute          | Type     | Description                                                       |
| ------------------ | -------- | ----------------------------------------------------------------- |
| `recipient`        | `string` | Ethereum address that will receive USDC on Polygon (must start with 0x) |
| `reown-project-id` | `string` | Your Reown project ID ([Get one here](https://reown.com))         |

**Note:** Recipients always receive USDC on Polygon network. No chain or token configuration needed.

### Optional Attributes

| Attribute           | Type      | Default                              | Description                                                                       |
| ------------------- | --------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| `theme`             | `string`  | `auto`                               | Theme mode: `light`, `dark`, `auto`, or `custom`                                 |
| `locale`            | `string`  | Auto-detected                        | Language/locale for the widget (e.g., `"en"`, `"ru"`). If not set, auto-detects from browser |
| `default-amount`    | `string`  | `""`                                 | Default donation amount to pre-fill (e.g., `"25"`)                               |
| `header-title`      | `string`  | `"Donate"`                           | Header title text displayed next to the heart icon                               |
| `success-message`   | `string`  | `"Thank you for your donation!"`     | Custom success message displayed after donation                                  |
| `donate-again-text` | `string`  | `"Donate Again"`                     | Custom text for the "donate again" button                                        |
| `confetti-enabled`  | `boolean` | `true`                               | Whether confetti animation is enabled                                            |
| `confetti-colors`   | `string`  | Theme-appropriate colors             | Comma-separated list of hex colors for confetti (e.g., `"#ff0000,#00ff00,#0000ff"`) |

### Supported Source Chains

Donors can pay from any of these chains (donations are automatically converted to USDC on Polygon):

| Chain                     | Chain ID |
| ------------------------- | -------- |
| Ethereum                  | 1        |
| Arbitrum                  | 42161    |
| Polygon                   | 137      |
| BSC (Binance Smart Chain) | 56       |
| Optimism                  | 10       |
| Base                      | 8453     |

## 🎨 Theming

The widget supports four theme modes and full customization through CSS
variables.

### Built-in Themes

#### Auto Theme (Default)

Automatically matches the user's system preference (light/dark mode):

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="auto"
>
</donation-widget>
```

#### Light Theme

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="light"
>
</donation-widget>
```

#### Dark Theme

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="dark"
>
</donation-widget>
```

### Custom Themes

Set `theme="custom"` and use CSS variables to create your own color scheme.
**Note:** Custom theme mode hides the theme toggle button.

#### Available CSS Variables

| Variable                   | Description           | Light Default     | Dark Default     |
| -------------------------- | --------------------- | ----------------- | ---------------- |
| `--color-background`       | Main background color | `oklch(100% 0 0)` | `oklch(16% 0 0)` |
| `--color-foreground`       | Main text color       | `oklch(14% 0 0)`  | `oklch(99% 0 0)` |
| `--color-primary`          | Primary accent color  | `oklch(17% 0 0)`  | `oklch(99% 0 0)` |
| `--color-secondary`        | Secondary background  | `oklch(96% 0 0)`  | `oklch(26% 0 0)` |
| `--color-accent`           | Accent elements       | `oklch(32% 0 0)`  | `oklch(68% 0 0)` |
| `--color-border`           | Border color          | `oklch(91% 0 0)`  | `oklch(30% 0 0)` |
| `--color-muted`            | Muted backgrounds     | `oklch(96% 0 0)`  | `oklch(22% 0 0)` |
| `--color-muted-foreground` | Muted text            | `oklch(52% 0 0)`  | `oklch(68% 0 0)` |
| `--radius`                 | Border radius         | `1rem`            | `1rem`           |

#### Example: Cyberpunk Theme

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="custom"
  style="--color-background: oklch(15% 0.05 280); --color-foreground: oklch(95% 0.15 320); --color-primary: oklch(75% 0.25 320); --color-secondary: oklch(70% 0.25 190); --color-accent: oklch(80% 0.25 340); --color-border: oklch(45% 0.15 280); --color-muted: oklch(25% 0.08 280); --color-muted-foreground: oklch(65% 0.12 190); --radius: 0.25rem"
>
</donation-widget>
```

#### Example: Ocean Theme

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="custom"
  style="--color-background: oklch(18% 0.08 230); --color-foreground: oklch(95% 0.08 200); --color-primary: oklch(65% 0.18 220); --color-secondary: oklch(35% 0.12 230); --color-accent: oklch(75% 0.2 200); --color-border: oklch(35% 0.1 230); --color-muted: oklch(25% 0.08 230); --color-muted-foreground: oklch(70% 0.1 210); --radius: 0.75rem"
>
</donation-widget>
```

#### Example: Forest Theme

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="custom"
  style="--color-background: oklch(98% 0.02 150); --color-foreground: oklch(25% 0.08 145); --color-primary: oklch(50% 0.15 145); --color-secondary: oklch(88% 0.05 150); --color-accent: oklch(45% 0.18 140); --color-border: oklch(80% 0.04 150); --color-muted: oklch(93% 0.03 150); --color-muted-foreground: oklch(45% 0.08 145); --radius: 1rem"
>
</donation-widget>
```

#### Example: Minimal Monochrome

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="custom"
  style="--color-background: oklch(100% 0 0); --color-foreground: oklch(0% 0 0); --color-primary: oklch(20% 0 0); --color-secondary: oklch(95% 0 0); --color-accent: oklch(40% 0 0); --color-border: oklch(85% 0 0); --color-muted: oklch(97% 0 0); --color-muted-foreground: oklch(50% 0 0); --radius: 0rem"
>
</donation-widget>
```

## 💵 Pre-filled Amount

You can pre-fill the donation amount using the `default-amount` attribute. This is useful for donation links with suggested amounts.

### Basic Pre-filled Amount

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  default-amount="25"
>
</donation-widget>
```

### Multiple Donation Pages

Create different pages with different suggested amounts:

```html
<!-- Small donation page -->
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  default-amount="10"
  header-title="Buy us a coffee ☕"
>
</donation-widget>

<!-- Large donation page -->
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  default-amount="100"
  header-title="Become a Sponsor 🌟"
>
</donation-widget>
```

## 🌐 Localization

The widget supports multiple languages and automatically detects the user's browser language. You can also set the language explicitly using the `locale` attribute.

### Supported Languages

| Code | Language |
| ---- | -------- |
| `en` | English  |
| `ru` | Russian  |

### Auto-Detection (Default)

By default, the widget automatically detects the user's preferred language from the browser:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
>
</donation-widget>
```

### Explicit Language Setting

Force a specific language regardless of browser settings:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  locale="ru"
>
</donation-widget>
```

### Custom Header Title

You can customize the header title using the `header-title` attribute:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  header-title="Support Our Project"
>
</donation-widget>
```

## 🎉 Success State & Celebration

After a successful donation, the widget displays a celebratory success state with confetti animation and transaction details. You can customize all aspects of the success state to match your brand.

### Success State Features

- **Confetti Animation** - Animated confetti particles celebrate the successful donation
- **Transaction Summary** - Shows amount, token, chain, and timestamp
- **Donate Again Button** - Quick way for users to make another donation

### Basic Success State

By default, the widget automatically shows a success state after a successful donation:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
>
</donation-widget>
```

The success state includes:
- Default success message: "Thank you for your donation!"
- Confetti animation (enabled by default)
- Transaction details with amount, token, chain, and timestamp
- "Donate Again" button

### Custom Success Message

Customize the success message to match your brand voice:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  success-message="Thank you for your generous support! 🙏"
>
</donation-widget>
```

### Custom Donate Again Button Text

Change the button text to encourage repeat donations:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  donate-again-text="Make Another Donation"
>
</donation-widget>
```

### Confetti Customization

#### Disable Confetti

For a more subtle celebration, disable the confetti animation:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  confetti-enabled="false"
>
</donation-widget>
```

#### Custom Confetti Colors

Use your brand colors for the confetti animation. Provide a comma-separated list of hex colors:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  confetti-colors="#ff0000,#00ff00,#0000ff,#ffff00"
>
</donation-widget>
```

**Confetti Color Examples:**

- **Brand Colors**: `"#ff6b6b,#4ecdc4,#45b7d1,#f7b731"`
- **Rainbow**: `"#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3"`
- **Monochrome**: `"#000000,#333333,#666666,#999999"`
- **Pastel**: `"#ffb3ba,#ffdfba,#ffffba,#baffc9,#bae1ff"`

**Note:** If no custom colors are provided, the widget uses theme-appropriate default colors that match your selected theme (light or dark).

### Complete Success State Example

Combine all customization options for a fully branded experience:

```html
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="dark"
  success-message="Thank you for supporting our mission! 🚀"
  donate-again-text="Support Us Again"
  confetti-enabled="true"
  confetti-colors="#ff6b6b,#4ecdc4,#45b7d1"
>
</donation-widget>
```

### Success State Behavior

- **Automatic Display**: The success state appears automatically after a successful transaction
- **Transaction Details**: Shows all relevant transaction information including amount, token, and chain
- **Accessibility**: Respects `prefers-reduced-motion` media query for users who prefer reduced animations
- **Performance**: Confetti animation automatically scales particle count based on viewport size for optimal performance

## 📡 JavaScript API & Events

The widget emits custom events that you can listen to for tracking donations,
wallet connections, and errors.

### Getting the Widget Reference

```javascript
// Get widget element
const widget = document.getElementById("myWidget");

// Or using querySelector
const widget = document.querySelector("donation-widget");
```

### Available Events

| Event Name            | Description                          | Event Detail Properties            |
| --------------------- | ------------------------------------ | ---------------------------------- |
| `donation-initiated`  | Fired when user initiates a donation | `{ amount, token }`                |
| `donation-completed`  | Fired when donation is successful    | `{ amount, token, recipient }`     |
| `donation-failed`     | Fired when donation fails            | `{ error, code }`                  |
| `wallet-connected`    | Fired when wallet is connected       | `{ address, chainId }`             |
| `wallet-disconnected` | Fired when wallet is disconnected    | -                                  |
| `network-switched`    | Fired when user switches networks    | `{ chainId }`                      |

### Event Listeners Example

```html
<donation-widget
  id="myWidget"
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
>
</donation-widget>

<script>
  const widget = document.getElementById("myWidget");

  // Listen for successful donations
  widget.addEventListener("donation-completed", (event) => {
    console.log("Donation completed!");
    console.log("Amount:", event.detail.amount);
    console.log("Token:", event.detail.token.symbol);
    console.log("Recipient:", event.detail.recipient);

    // Send to analytics
    gtag("event", "donation", {
      value: event.detail.amount,
      currency: event.detail.token.symbol,
    });
  });

  // Listen for failed donations
  widget.addEventListener("donation-failed", (event) => {
    console.error("Donation failed:", event.detail.error);
    console.error("Error code:", event.detail.code);

    // Show error to user
    alert(`Donation failed: ${event.detail.error}`);
  });

  // Listen for wallet connections
  widget.addEventListener("wallet-connected", (event) => {
    console.log("Wallet connected:", event.detail.address);
    console.log("Chain ID:", event.detail.chainId);
  });

  // Listen for wallet disconnections
  widget.addEventListener("wallet-disconnected", () => {
    console.log("Wallet disconnected");
  });

  // Listen for network changes
  widget.addEventListener("network-switched", (event) => {
    console.log("Network switched to chain:", event.detail.chainId);
  });
</script>
```

### Complete Event Tracking Example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Widget with Event Tracking</title>
  </head>
  <body>
    <donation-widget
      id="donationWidget"
      recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      reown-project-id="YOUR_REOWN_PROJECT_ID"
    >
    </donation-widget>

    <div id="eventLog"></div>

    <script src="https://your-cdn.com/donation-widget.js"></script>

    <script>
      const widget = document.getElementById("donationWidget");
      const eventLog = document.getElementById("eventLog");

      function logEvent(eventName, data) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement("div");
        entry.textContent = `[${timestamp}] ${eventName}: ${
          JSON.stringify(data)
        }`;
        eventLog.appendChild(entry);
      }

      // Track all events
      widget.addEventListener("donation-initiated", (e) => {
        logEvent("donation-initiated", {
          amount: e.detail.amount,
          token: e.detail.token?.symbol,
        });
      });

      widget.addEventListener("donation-completed", (e) => {
        logEvent("donation-completed", {
          amount: e.detail.amount,
          token: e.detail.token?.symbol,
          recipient: e.detail.recipient,
        });

        // Success notification
        alert("Thank you for your donation! 🎉");
      });

      widget.addEventListener("donation-failed", (e) => {
        logEvent("donation-failed", {
          error: e.detail.error,
          code: e.detail.code,
        });
      });

      widget.addEventListener("wallet-connected", (e) => {
        logEvent("wallet-connected", {
          address: e.detail.address,
          chainId: e.detail.chainId,
        });
      });

      widget.addEventListener("wallet-disconnected", () => {
        logEvent("wallet-disconnected", {});
      });

      widget.addEventListener("network-switched", (e) => {
        logEvent("network-switched", {
          chainId: e.detail.chainId,
        });
      });
    </script>
  </body>
</html>
```

## 🎛️ Programmatic Control

You can control the widget programmatically using JavaScript.

### Public Methods

#### `setRecipient(address: string)`

Change the recipient address dynamically:

```javascript
const widget = document.querySelector("donation-widget");
widget.setRecipient("0x1234567890123456789012345678901234567890");
```

#### `setTheme(theme: 'light' | 'dark' | 'auto' | 'custom')`

Change the theme programmatically:

```javascript
const widget = document.querySelector("donation-widget");
widget.setTheme("dark");
```

#### `getState()`

Get the current widget state:

```javascript
const widget = document.querySelector("donation-widget");
const state = widget.getState();

console.log(state);
// {
//   recipient: '0x...',
//   theme: 'auto',
//   selectedToken: { symbol: 'ETH', ... },
//   recipientAmount: '10',
//   isInitialized: true,
//   isDonating: false,
//   error: null
// }
```

#### `reset()`

Reset the widget to its initial state:

```javascript
const widget = document.querySelector("donation-widget");
widget.reset(); // Clears amount, selected token, and errors
```

### Using Attributes

You can also control the widget by changing attributes:

```javascript
const widget = document.querySelector("donation-widget");

// Change recipient
widget.setAttribute("recipient", "0x1234567890123456789012345678901234567890");

// Change theme
widget.setAttribute("theme", "dark");

// Change default token

// Remove attribute
```

### Complete Control Example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Control Panel</title>
  </head>
  <body>
    <div>
      <h2>Control Panel</h2>

      <label>
        Recipient Address:
        <input type="text" id="recipientInput" placeholder="0x...">
      </label>

      <label>
        Theme:
        <select id="themeSelect">
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <button onclick="applyChanges()">Apply Changes</button>
      <button onclick="resetWidget()">Reset Widget</button>
      <button onclick="getWidgetState()">Get State</button>
    </div>

    <donation-widget
      id="widget"
      recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      reown-project-id="YOUR_REOWN_PROJECT_ID"
    >
    </donation-widget>

    <script src="https://your-cdn.com/donation-widget.js"></script>

    <script>
      const widget = document.getElementById("widget");

      function applyChanges() {
        const recipient =
          document.getElementById("recipientInput").value;
        const theme = document.getElementById("themeSelect").value;

        if (recipient) {
          widget.setRecipient(recipient);
        }

        widget.setTheme(theme);

        alert("Changes applied!");
      }

      function resetWidget() {
        widget.reset();
        alert("Widget reset!");
      }

      function getWidgetState() {
        const state = widget.getState();
        console.log("Widget State:", state);
        alert(
          `Widget State (check console):\n${
            JSON.stringify(state, null, 2)
          }`,
        );
      }
    </script>
  </body>
</html>
```

## 🔌 Integration Examples

### React

```jsx
import { useEffect, useRef } from "react";
import "donation-widget";

function DonationPage() {
  const widgetRef = useRef(null);

  useEffect(() => {
    const widget = widgetRef.current;

    const handleDonationCompleted = (event) => {
      console.log("Donation completed!", event.detail);
      // Track with your analytics
      trackDonation(event.detail);
    };

    widget?.addEventListener("donation-completed", handleDonationCompleted);

    return () => {
      widget?.removeEventListener(
        "donation-completed",
        handleDonationCompleted,
      );
    };
  }, []);

  return (
    <div>
      <h1>Support Our Project</h1>
      <donation-widget
        ref={widgetRef}
        recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        reown-project-id="YOUR_REOWN_PROJECT_ID"
        theme="dark"
      />
    </div>
  );
}

export default DonationPage;
```

### Vue

```vue
<template>
  <div>
    <h1>Support Our Project</h1>
    <donation-widget
      ref="widgetRef"
      recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      recipient-chain="42161"
      recipient-token="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
      project-id="YOUR_PROJECT_ID"
      api-key="YOUR_API_KEY"
      :theme="theme"
      @donation-completed="handleDonationCompleted"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'donation-widget';

const widgetRef = ref(null);
const theme = ref('auto');

const handleDonationCompleted = (event) => {
  console.log('Donation completed!', event.detail);
};

onMounted(() => {
  const widget = widgetRef.value;
  widget?.addEventListener('donation-completed', handleDonationCompleted);
});

onUnmounted(() => {
  const widget = widgetRef.value;
  widget?.removeEventListener('donation-completed', handleDonationCompleted);
});
</script>
```

### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import 'donation-widget';

  let widgetElement;

  onMount(() => {
    widgetElement.addEventListener('donation-completed', (event) => {
      console.log('Donation completed!', event.detail);
    });
  });
</script>

<h1>Support Our Project</h1>

<donation-widget
  bind:this={widgetElement}
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="dark"
/>
```

### Next.js

```jsx
"use client";

import { useEffect, useRef } from "react";

export default function DonationPage() {
  const widgetRef = useRef(null);

  useEffect(() => {
    // Import widget only on client side
    import("donation-widget");

    const widget = widgetRef.current;

    const handleDonationCompleted = (event) => {
      console.log("Donation completed!", event.detail);
    };

    widget?.addEventListener("donation-completed", handleDonationCompleted);

    return () => {
      widget?.removeEventListener(
        "donation-completed",
        handleDonationCompleted,
      );
    };
  }, []);

  return (
    <div>
      <h1>Support Our Project</h1>
      <donation-widget
        ref={widgetRef}
        recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        reown-project-id="YOUR_REOWN_PROJECT_ID"
        theme="dark"
      />
    </div>
  );
}
```

### WordPress

Add to your theme or use a custom HTML block:

```html
<!-- Add to header.php or in a custom HTML block -->
<script src="https://your-cdn.com/donation-widget.js"></script>

<!-- Add widget anywhere in your content -->
<donation-widget
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  theme="auto"
>
</donation-widget>
```

## 🛠️ Development

### Prerequisites

- Deno 2.5.4

### Setup

```bash
# Clone the repository
git clone https://github.com/Kalapaja/donato.git
cd donato

# Install dependencies
deno install

# Start development server
deno task dev
```

### Build

```bash
# Build for production
deno task build

# Preview production build
deno task preview
```


### Project Structure

```
donation-widget/
├── src/
│   ├── components/          # Web components
│   │   ├── donation-widget.ts
│   │   ├── wallet-section.ts
│   │   ├── donation-form.ts
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── WalletService.ts
│   │   ├── AcrossService.ts
│   │   └── ...
│   └── index.ts             # Main entry point
├── examples/                # Example usage
│   ├── javascript-api.html
│   └── themes.html
├── dist/                    # Built files (generated)
├── vite.config.ts          # Vite configuration
└── deno.json               # Deno configuration
```

## 📖 API Reference

### DonationWidget Component

The main widget component.

**Tag name:** `<donation-widget>`

**Attributes:**

**Required:**
- `recipient` - Recipient wallet address (receives USDC on Polygon)
- `reown-project-id` - Reown project ID

**Optional:**
- `theme` - Theme mode: 'light', 'dark', 'auto', or 'custom' (default: 'auto')
- `locale` - Language/locale for the widget (e.g., "en", "ru"). If not set, auto-detects from browser
- `default-amount` - Default donation amount to pre-fill (e.g., "25")
- `header-title` - Header title text displayed next to the heart icon (default: uses i18n)
- `success-message` - Custom success message displayed after donation (default: "Thank you for your donation!")
- `donate-again-text` - Custom text for the "donate again" button (default: "Donate Again")
- `confetti-enabled` - Whether confetti animation is enabled (default: true)
- `confetti-colors` - Comma-separated list of hex colors for confetti (e.g., "#ff0000,#00ff00,#0000ff")

**Events:**

- `donation-initiated` - User started donation process
- `donation-completed` - Donation successful
- `donation-failed` - Donation failed
- `wallet-connected` - Wallet connected
- `wallet-disconnected` - Wallet disconnected
- `network-switched` - Network changed

**Methods:**

- `setRecipient(address: string)` - Change recipient
- `setTheme(theme: ThemeMode)` - Change theme
- `getState()` - Get current state
- `reset()` - Reset widget

## 🔒 Security

- The widget never has access to user private keys
- All wallet interactions use WalletConnect/Reown protocol
- Cross-chain swaps are executed through Across Protocol's audited smart contracts
- No personal data is collected or stored

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md)
for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file
for details.

## 💬 Support

- 📧 Email: support@donations.kalatori.org

## 🙏 Acknowledgments

- Built with [Lit](https://lit.dev/)
- Powered by [Across Protocol](https://across.to/)
- Wallet connections via [Reown](https://reown.com/)

---

Made with ❤️
