# Donation Widget Landing Page

This is a Next.js landing page for configuring and generating embed code for the
Donation Widget.

## Features

The landing page provides a step-by-step configuration wizard:

1. **Recipient Address** - Enter the Ethereum address that will receive
   donations, with optional WalletConnect verification
2. **Currency & Chain** - Select blockchain network and token, with optional
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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
landing page.

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

The landing page expects the donation widget script to be available at
`/donation-widget.js`. Make sure to:

1. Build the widget from the root `src/` directory
2. Copy the built widget to `www/public/donation-widget.js`
3. Or configure the path in `WidgetPreview.tsx` to point to your CDN

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
