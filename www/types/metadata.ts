/**
 * TypeScript types for site metadata configuration
 * 
 * These types define the structure for the site configuration object
 * that will be used to generate Next.js Metadata.
 * 
 * Note: For the actual Metadata object, use the built-in `Metadata` type
 * from Next.js: `import type { Metadata } from "next"`
 */

/**
 * Site metadata configuration interface
 * 
 * This interface defines the structure for the site configuration object
 * (siteConfig) that contains all metadata values. This configuration is
 * then used to construct the Next.js Metadata object.
 * 
 * This is separate from Next.js's built-in `Metadata` type, which is used
 * for the actual metadata export in layout.tsx.
 */
export interface SiteMetadata {
  /** Main site title for meta tags and OpenGraph */
  title: string;
  
  /** Site description for meta tags and OpenGraph */
  description: string;
  
  /** Canonical site URL (must be absolute, e.g., https://example.com) */
  url: string;
  
  /** Path to OpenGraph image (relative to public/ directory, e.g., "/og-image.png") */
  ogImage: string;
  
  /** Twitter handle (optional, e.g., "@username") */
  twitterHandle?: string;
  
  /** Theme color for browsers (hex color code, e.g., "#000000") */
  themeColor: string;
  
  /** Locale for OpenGraph (e.g., "en_US") */
  locale: string;
}

