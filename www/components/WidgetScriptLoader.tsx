"use client";

import Script from "next/script";
import { useVersions } from "../lib/useVersions";

const DEV_SCRIPT_URL = "http://localhost:3000/donation-widget.js";

function handleScriptLoad(url: string): void {
  console.log("Widget script loaded successfully:", url);
}

function handleScriptError(url: string, error: unknown): void {
  console.error("Failed to load widget script:", url, error);
}

/**
 * Component that loads the widget script on the client side
 * - In development: loads from http://localhost:3000/donation-widget.js
 * - In production: loads the latest version from versions.json
 */
export function WidgetScriptLoader() {
  const { manifest, isLoading } = useVersions();

  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost");

  if (isDevelopment) {
    return (
      <Script
        id="donation-widget-script"
        src={DEV_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => handleScriptLoad(DEV_SCRIPT_URL)}
        onError={(e) => handleScriptError(DEV_SCRIPT_URL, e)}
      />
    );
  }

  if (isLoading || !manifest?.latest) {
    return null;
  }

  const latestVersion = manifest.versions[manifest.latest];
  if (!latestVersion) {
    return null;
  }

  const scriptUrl = `/${latestVersion.file}`;

  return (
    <Script
      id="donation-widget-script"
      src={scriptUrl}
      integrity={latestVersion.integrity}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => handleScriptLoad(scriptUrl)}
      onError={(e) => handleScriptError(scriptUrl, e)}
    />
  );
}
