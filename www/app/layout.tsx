/**
 * Root Layout with OpenGraph Metadata
 * 
 * This layout configures all OpenGraph and Twitter Card metadata for the site.
 * The metadata is generated at build time and embedded in the HTML head.
 * 
 * Testing OpenGraph Tags:
 * 
 * 1. Build the site: npm run build
 * 2. Check generated HTML: cat out/index.html | grep "og:"
 * 3. Deploy to a public URL (required for social media validators)
 * 4. Test with online validators:
 *    - Facebook: https://developers.facebook.com/tools/debug/
 *    - Twitter: https://cards-dev.twitter.com/validator
 *    - LinkedIn: https://www.linkedin.com/post-inspector/
 *    - OpenGraph.xyz: https://www.opengraph.xyz/
 * 
 * Note: Social media platforms cache metadata. Use the "Scrape Again" or
 * "Clear Cache" button in validators to see updated metadata after changes.
 */

import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { siteConfig } from "../lib/site-config";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  
  other: {
    "theme-color": siteConfig.themeColor,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
