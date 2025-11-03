/**
 * Get the widget script URL based on environment
 * - Development: Local dev server at localhost:3000
 * - Production: GitHub release URL
 */
export const getWidgetScriptUrl = (): string => {
  if (typeof window !== "undefined") {
    // Check if we're running locally
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000/donation-widget.js";
    }
  }
  // Production URL from GitHub releases
  return "https://github.com/Kalapaja/donato/releases/download/v1.0.0/donation-widget.js";
};

