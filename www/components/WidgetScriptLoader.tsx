"use client";

import Script from "next/script";
import { useVersions } from "../lib/useVersions";

/**
 * Component that loads the widget script on the client side
 * - In development: loads from http://localhost:3000/donation-widget.js
 * - In production: loads the latest version from versions.json
 */
export function WidgetScriptLoader() {
  const { manifest, isLoading } = useVersions();

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  // Development: load from localhost
  if (isDevelopment) {
    return (
      <Script
        id="donation-widget-script"
        src="http://localhost:3000/donation-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Widget script loaded successfully");
        }}
        onError={(e) => {
          console.error("Failed to load widget script:", e);
        }}
      />
    );
  }

  // Production: load latest version from versions.json
  if (!isLoading && manifest && manifest.latest) {
    const latestVersion = manifest.versions[manifest.latest];
    if (latestVersion) {
      const scriptUrl = `/${latestVersion.file}`;
      return (
        <Script
          id="donation-widget-script"
          src={scriptUrl}
          integrity={latestVersion.integrity}
          crossOrigin="anonymous"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Widget script loaded successfully:", scriptUrl);
          }}
          onError={(e) => {
            console.error("Failed to load widget script:", scriptUrl, e);
          }}
        />
      );
    }
  }

  // Loading state - don't render script yet
  return null;
}

