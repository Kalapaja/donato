# Donation Widget

A modern, embeddable cryptocurrency donation widget with cross-chain support powered by LiFi. Accept donations in any token on any supported chain, and receive them in your preferred token on your preferred chain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔗 **Cross-chain support** - Accept donations from Ethereum, Arbitrum, Polygon, BSC, Optimism, Base, and more
- 💱 **Any token to any token** - Automatic conversion via LiFi aggregation
- 🎨 **Fully customizable themes** - Light, dark, auto, or completely custom color schemes
- 📱 **Responsive design** - Works perfectly on mobile and desktop
- 🔌 **Easy integration** - Simple HTML tag, no complex setup
- 🎯 **Event-driven API** - Track donations, wallet connections, and errors
- 🌐 **Web Components** - Built with Lit, works with any framework or vanilla JavaScript
- 🔒 **Secure** - Uses WalletConnect/Reown for wallet connections

## 📦 Installation

### Option 1: CDN from GitHub Releases (Recommended)

Download the latest release from [GitHub Releases](https://github.com/Kalapaja/donato/releases) and host it on your CDN, or use it directly:

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
    recipient-chain-id="42161"
    recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    reown-project-id="YOUR_REOWN_PROJECT_ID"
    lifi-api-key="YOUR_LIFI_API_KEY">
  </donation-widget>

  <!-- Load the widget script from GitHub releases -->
  <script type="module" src="https://github.com/Kalapaja/donato/releases/download/v1.0.0/donation-widget.es.js"></script>
</body>
</html>
```

### Option 2: Build from Source

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

## 🚀 Quick Start

### Basic Usage

The minimal setup requires these attributes:

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY">
</donation-widget>
```

**Important:** 
- Get your free Reown Project ID at [https://reown.com](https://reown.com)
- Get your LiFi API key at [https://li.fi](https://li.fi)

### With All Options

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="dark">
</donation-widget>
```

## ⚙️ Configuration

### Required Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `recipient` | `string` | Ethereum address that will receive donations (must start with 0x) |
| `recipient-chain-id` | `number` | Chain ID where you want to receive donations (e.g., 42161 = Arbitrum) |
| `recipient-token-address` | `string` | Token address you want to receive (e.g., USDC on Arbitrum: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831) |
| `reown-project-id` | `string` | Your Reown project ID ([Get one here](https://reown.com)) |
| `lifi-api-key` | `string` | Your LiFi API key ([Get one here](https://li.fi)) |

### Optional Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `string` | `auto` | Theme mode: `light`, `dark`, `auto`, or `custom` |

### Supported Chain IDs

| Chain | Chain ID |
|-------|----------|
| Ethereum | 1 |
| Arbitrum | 42161 |
| Polygon | 137 |
| BSC (Binance Smart Chain) | 56 |
| Optimism | 10 |
| Base | 8453 |

### Example Configurations

#### Receive USDT on BSC

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="56"
  recipient-token-address="0x55d398326f99059fF775485246999027B3197955"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY">
</donation-widget>
```

## 🎨 Theming

The widget supports four theme modes and full customization through CSS variables.

### Built-in Themes

#### Auto Theme (Default)

Automatically matches the user's system preference (light/dark mode):

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="auto">
</donation-widget>
```

#### Light Theme

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="light">
</donation-widget>
```

#### Dark Theme

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="dark">
</donation-widget>
```

### Custom Themes

Set `theme="custom"` and use CSS variables to create your own color scheme. **Note:** Custom theme mode hides the theme toggle button.

#### Available CSS Variables

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--color-background` | Main background color | `oklch(100% 0 0)` | `oklch(16% 0 0)` |
| `--color-foreground` | Main text color | `oklch(14% 0 0)` | `oklch(99% 0 0)` |
| `--color-primary` | Primary accent color | `oklch(17% 0 0)` | `oklch(99% 0 0)` |
| `--color-secondary` | Secondary background | `oklch(96% 0 0)` | `oklch(26% 0 0)` |
| `--color-accent` | Accent elements | `oklch(32% 0 0)` | `oklch(68% 0 0)` |
| `--color-border` | Border color | `oklch(91% 0 0)` | `oklch(30% 0 0)` |
| `--color-muted` | Muted backgrounds | `oklch(96% 0 0)` | `oklch(22% 0 0)` |
| `--color-muted-foreground` | Muted text | `oklch(52% 0 0)` | `oklch(68% 0 0)` |
| `--radius` | Border radius | `1rem` | `1rem` |

#### Example: Cyberpunk Theme

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="custom"
  style="
    --color-background: oklch(15% 0.05 280);
    --color-foreground: oklch(95% 0.15 320);
    --color-primary: oklch(75% 0.25 320);
    --color-secondary: oklch(70% 0.25 190);
    --color-accent: oklch(80% 0.25 340);
    --color-border: oklch(45% 0.15 280);
    --color-muted: oklch(25% 0.08 280);
    --color-muted-foreground: oklch(65% 0.12 190);
    --radius: 0.25rem;
  ">
</donation-widget>
```

#### Example: Ocean Theme

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="custom"
  style="
    --color-background: oklch(18% 0.08 230);
    --color-foreground: oklch(95% 0.08 200);
    --color-primary: oklch(65% 0.18 220);
    --color-secondary: oklch(35% 0.12 230);
    --color-accent: oklch(75% 0.2 200);
    --color-border: oklch(35% 0.1 230);
    --color-muted: oklch(25% 0.08 230);
    --color-muted-foreground: oklch(70% 0.1 210);
    --radius: 0.75rem;
  ">
</donation-widget>
```

#### Example: Forest Theme

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="custom"
  style="
    --color-background: oklch(98% 0.02 150);
    --color-foreground: oklch(25% 0.08 145);
    --color-primary: oklch(50% 0.15 145);
    --color-secondary: oklch(88% 0.05 150);
    --color-accent: oklch(45% 0.18 140);
    --color-border: oklch(80% 0.04 150);
    --color-muted: oklch(93% 0.03 150);
    --color-muted-foreground: oklch(45% 0.08 145);
    --radius: 1rem;
  ">
</donation-widget>
```

#### Example: Minimal Monochrome

```html
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="custom"
  style="
    --color-background: oklch(100% 0 0);
    --color-foreground: oklch(0% 0 0);
    --color-primary: oklch(20% 0 0);
    --color-secondary: oklch(95% 0 0);
    --color-accent: oklch(40% 0 0);
    --color-border: oklch(85% 0 0);
    --color-muted: oklch(97% 0 0);
    --color-muted-foreground: oklch(50% 0 0);
    --radius: 0rem;
  ">
</donation-widget>
```

## 📡 JavaScript API & Events

The widget emits custom events that you can listen to for tracking donations, wallet connections, and errors.

### Getting the Widget Reference

```javascript
// Get widget element
const widget = document.getElementById('myWidget');

// Or using querySelector
const widget = document.querySelector('donation-widget');
```

### Available Events

| Event Name | Description | Event Detail Properties |
|------------|-------------|------------------------|
| `donation-initiated` | Fired when user initiates a donation | `{ amount, token }` |
| `donation-completed` | Fired when donation is successful | `{ txHash, amount, token, route }` |
| `donation-failed` | Fired when donation fails | `{ error, code }` |
| `wallet-connected` | Fired when wallet is connected | `{ address, chainId }` |
| `wallet-disconnected` | Fired when wallet is disconnected | - |
| `network-switched` | Fired when user switches networks | `{ chainId }` |

### Event Listeners Example

```html
<donation-widget 
  id="myWidget"
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY">
</donation-widget>

<script>
  const widget = document.getElementById('myWidget');

  // Listen for successful donations
  widget.addEventListener('donation-completed', (event) => {
    console.log('Donation completed!');
    console.log('Transaction hash:', event.detail.txHash);
    console.log('Amount:', event.detail.amount);
    console.log('Token:', event.detail.token.symbol);
    
    // Send to analytics
    gtag('event', 'donation', {
      value: event.detail.amount,
      currency: event.detail.token.symbol,
      transaction_id: event.detail.txHash
    });
  });

  // Listen for failed donations
  widget.addEventListener('donation-failed', (event) => {
    console.error('Donation failed:', event.detail.error);
    console.error('Error code:', event.detail.code);
    
    // Show error to user
    alert(`Donation failed: ${event.detail.error}`);
  });

  // Listen for wallet connections
  widget.addEventListener('wallet-connected', (event) => {
    console.log('Wallet connected:', event.detail.address);
    console.log('Chain ID:', event.detail.chainId);
  });

  // Listen for wallet disconnections
  widget.addEventListener('wallet-disconnected', () => {
    console.log('Wallet disconnected');
  });

  // Listen for network changes
  widget.addEventListener('network-switched', (event) => {
    console.log('Network switched to chain:', event.detail.chainId);
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
    recipient-chain-id="42161"
    recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    reown-project-id="YOUR_REOWN_PROJECT_ID"
    lifi-api-key="YOUR_LIFI_API_KEY">
  </donation-widget>

  <div id="eventLog"></div>

  <script type="module" src="https://your-cdn.com/donation-widget.es.js"></script>
  
  <script>
    const widget = document.getElementById('donationWidget');
    const eventLog = document.getElementById('eventLog');

    function logEvent(eventName, data) {
      const timestamp = new Date().toLocaleTimeString();
      const entry = document.createElement('div');
      entry.textContent = `[${timestamp}] ${eventName}: ${JSON.stringify(data)}`;
      eventLog.appendChild(entry);
    }

    // Track all events
    widget.addEventListener('donation-initiated', (e) => {
      logEvent('donation-initiated', {
        amount: e.detail.amount,
        token: e.detail.token?.symbol
      });
    });

    widget.addEventListener('donation-completed', (e) => {
      logEvent('donation-completed', {
        txHash: e.detail.txHash,
        amount: e.detail.amount,
        token: e.detail.token?.symbol
      });
      
      // Success notification
      alert('Thank you for your donation! 🎉');
    });

    widget.addEventListener('donation-failed', (e) => {
      logEvent('donation-failed', {
        error: e.detail.error,
        code: e.detail.code
      });
    });

    widget.addEventListener('wallet-connected', (e) => {
      logEvent('wallet-connected', {
        address: e.detail.address,
        chainId: e.detail.chainId
      });
    });

    widget.addEventListener('wallet-disconnected', () => {
      logEvent('wallet-disconnected', {});
    });

    widget.addEventListener('network-switched', (e) => {
      logEvent('network-switched', {
        chainId: e.detail.chainId
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
const widget = document.querySelector('donation-widget');
widget.setRecipient('0x1234567890123456789012345678901234567890');
```

#### `setTheme(theme: 'light' | 'dark' | 'auto' | 'custom')`

Change the theme programmatically:

```javascript
const widget = document.querySelector('donation-widget');
widget.setTheme('dark');
```

#### `getState()`

Get the current widget state:

```javascript
const widget = document.querySelector('donation-widget');
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
const widget = document.querySelector('donation-widget');
widget.reset(); // Clears amount, selected token, and errors
```

### Using Attributes

You can also control the widget by changing attributes:

```javascript
const widget = document.querySelector('donation-widget');

// Change recipient
widget.setAttribute('recipient', '0x1234567890123456789012345678901234567890');

// Change theme
widget.setAttribute('theme', 'dark');

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
    recipient-chain-id="42161"
    recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    reown-project-id="YOUR_REOWN_PROJECT_ID"
    lifi-api-key="YOUR_LIFI_API_KEY">
  </donation-widget>

  <script type="module" src="https://your-cdn.com/donation-widget.es.js"></script>
  
  <script>
    const widget = document.getElementById('widget');

    function applyChanges() {
      const recipient = document.getElementById('recipientInput').value;
      const theme = document.getElementById('themeSelect').value;

      if (recipient) {
        widget.setRecipient(recipient);
      }
      
      widget.setTheme(theme);
      
      alert('Changes applied!');
    }

    function resetWidget() {
      widget.reset();
      alert('Widget reset!');
    }

    function getWidgetState() {
      const state = widget.getState();
      console.log('Widget State:', state);
      alert(`Widget State (check console):\n${JSON.stringify(state, null, 2)}`);
    }
  </script>
</body>
</html>
```

## 🔌 Integration Examples

### React

```jsx
import { useEffect, useRef } from 'react';
import 'donation-widget';

function DonationPage() {
  const widgetRef = useRef(null);

  useEffect(() => {
    const widget = widgetRef.current;

    const handleDonationCompleted = (event) => {
      console.log('Donation completed!', event.detail);
      // Track with your analytics
      trackDonation(event.detail);
    };

    widget?.addEventListener('donation-completed', handleDonationCompleted);

    return () => {
      widget?.removeEventListener('donation-completed', handleDonationCompleted);
    };
  }, []);

  return (
    <div>
      <h1>Support Our Project</h1>
      <donation-widget
        ref={widgetRef}
        recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        recipient-chain-id="42161"
        recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
        reown-project-id="YOUR_REOWN_PROJECT_ID"
        lifi-api-key="YOUR_LIFI_API_KEY"
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
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="dark"
/>
```

### Next.js

```jsx
'use client';

import { useEffect, useRef } from 'react';

export default function DonationPage() {
  const widgetRef = useRef(null);

  useEffect(() => {
    // Import widget only on client side
    import('donation-widget');

    const widget = widgetRef.current;

    const handleDonationCompleted = (event) => {
      console.log('Donation completed!', event.detail);
    };

    widget?.addEventListener('donation-completed', handleDonationCompleted);

    return () => {
      widget?.removeEventListener('donation-completed', handleDonationCompleted);
    };
  }, []);

  return (
    <div>
      <h1>Support Our Project</h1>
      <donation-widget
        ref={widgetRef}
        recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        recipient-chain-id="42161"
        recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
        reown-project-id="YOUR_REOWN_PROJECT_ID"
        lifi-api-key="YOUR_LIFI_API_KEY"
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
<script type="module" src="https://your-cdn.com/donation-widget.es.js"></script>

<!-- Add widget anywhere in your content -->
<donation-widget 
  recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  recipient-chain-id="42161"
  recipient-token-address="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  reown-project-id="YOUR_REOWN_PROJECT_ID"
  lifi-api-key="YOUR_LIFI_API_KEY"
  theme="auto">
</donation-widget>
```

## 🛠️ Development

### Prerequisites

- Deno 1.40+

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
│   │   ├── LiFiService.ts
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

- `recipient` (required) - Recipient wallet address
- `recipient-chain-id` (required) - Chain ID for receiving
- `recipient-token-address` (required) - Token address to receive
- `reown-project-id` (required) - Reown project ID
- `lifi-api-key` (required) - LiFi API key
- `theme` - Theme mode (default: 'auto')

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
- Cross-chain swaps are executed through LiFi's audited smart contracts
- No personal data is collected or stored

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- 📧 Email: support@donations.kalatori.org

## 🙏 Acknowledgments

- Built with [Lit](https://lit.dev/)
- Powered by [LiFi](https://li.fi/)
- Wallet connections via [Reown](https://reown.com/)

---

Made with ❤️

