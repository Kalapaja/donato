/**
 * Centralized site configuration for metadata
 * 
 * This module provides a single source of truth for all site metadata
 * including OpenGraph and Twitter Cards configuration.
 * 
 * The configuration supports environment variables for deployment-specific
 * values (e.g., NEXT_PUBLIC_SITE_URL) and includes validation to ensure
 * required fields are present and properly formatted.
 * 
 * Testing Configuration:
 * 
 * 1. Verify configuration is valid: The validateSiteConfig() function runs
 *    at build time and will throw errors if configuration is invalid.
 * 
 * 2. Test URL resolution: Ensure NEXT_PUBLIC_SITE_URL is set correctly for
 *    production. The URL must be absolute (start with http:// or https://).
 * 
 * 3. Test OpenGraph image: Verify that the ogImage path resolves correctly.
 *    The image should be accessible at {siteConfig.url}{siteConfig.ogImage}
 * 
 * 4. Validate metadata in generated HTML:
 *    - Build: npm run build
 *    - Check: grep -E "(og:|twitter:)" out/index.html
 *    - Verify all required tags are present with correct values
 */

import type { SiteMetadata } from "../types/metadata";

/**
 * Site configuration object with all metadata fields
 * 
 * This configuration is used to generate Next.js Metadata in layout.tsx.
 * Environment variables are supported for deployment-specific values.
 */
export const siteConfig: SiteMetadata = {
  title: "Donation Widget - Configuration Wizard",
  description:
    "Create a customizable cryptocurrency donation widget for your website. Support multiple chains, tokens, and payment methods with easy integration.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/opengraph-image",
  twitterHandle: "@donationwidget",
  themeColor: "#000000",
  locale: "en_US",
};

/**
 * Validates the site configuration object
 * 
 * Throws an error if required fields are missing or invalid.
 * This function is called at build time to ensure configuration is correct.
 * 
 * @param config - The site configuration object to validate
 * @throws {Error} If validation fails
 */
export function validateSiteConfig(config: SiteMetadata): void {
  // Validate URL is absolute
  if (!config.url || !config.url.startsWith("http")) {
    throw new Error(
      "Site URL must be absolute (start with http:// or https://). " +
      "Set NEXT_PUBLIC_SITE_URL environment variable or update siteConfig.url"
    );
  }

  // Validate title is present
  if (!config.title || config.title.trim().length === 0) {
    throw new Error("Site title is required and cannot be empty");
  }

  // Validate description is present
  if (!config.description || config.description.trim().length === 0) {
    throw new Error("Site description is required and cannot be empty");
  }

  // Validate ogImage path format
  if (!config.ogImage || !config.ogImage.startsWith("/")) {
    throw new Error(
      "OpenGraph image path must be relative to public/ directory (start with /)"
    );
  }

  // Validate themeColor format
  if (!config.themeColor || !/^#[0-9A-Fa-f]{6}$/.test(config.themeColor)) {
    throw new Error(
      "Theme color must be a valid hex color code (e.g., #000000)"
    );
  }

  // Validate locale format
  if (!config.locale || !/^[a-z]{2}_[A-Z]{2}$/.test(config.locale)) {
    throw new Error(
      "Locale must be in format 'll_CC' (e.g., 'en_US')"
    );
  }

  // Warn if using default localhost URL in production
  if (
    config.url === "http://localhost:3000" &&
    process.env.NODE_ENV === "production"
  ) {
    console.warn(
      "Warning: Using default localhost URL in production. " +
      "Set NEXT_PUBLIC_SITE_URL environment variable for production builds."
    );
  }
}

// Validate configuration at module load time (build time)
validateSiteConfig(siteConfig);

