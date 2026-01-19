"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { WidgetConfig } from "../../types/config";
import type { VersionEntry } from "../../types/versions";
import { useVersions } from "../../lib/useVersions";

interface EmbedCodeSectionProps {
  config: Partial<WidgetConfig>;
  /** Selected version entry for generating versioned embed code */
  selectedVersion?: string;
  /** Version entry data (contains integrity hash, file name, etc.) */
  versionEntry?: VersionEntry;
  /** Base URL for the widget CDN (default: window.location.origin) */
  baseUrl?: string;
}

export function EmbedCodeSection({ 
  config, 
  selectedVersion,
  versionEntry,
  baseUrl,
}: EmbedCodeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { manifest } = useVersions();

  const generateSimpleEmbedCode = (): string => {
    const widgetAttributes: string[] = [];
    const comments: string[] = [];

    // Recipient address (required)
    if (config.recipient && /^0x[a-fA-F0-9]{40}$/.test(config.recipient)) {
      widgetAttributes.push(`recipient="${config.recipient}"`);
    } else {
      widgetAttributes.push(`recipient="YOUR_RECIPIENT_ADDRESS"`);
      comments.push("⚠️ Replace YOUR_RECIPIENT_ADDRESS with the recipient address (0x...)");
    }

    // Chain ID (required)
    if (config.recipientChainId) {
      widgetAttributes.push(`recipient-chain-id="${config.recipientChainId}"`);
    } else {
      widgetAttributes.push(`recipient-chain-id="YOUR_CHAIN_ID"`);
      comments.push("⚠️ Replace YOUR_CHAIN_ID with the chain ID (e.g., 42161 for Arbitrum)");
    }

    // Token address (required)
    if (config.recipientTokenAddress) {
      widgetAttributes.push(`recipient-token-address="${config.recipientTokenAddress}"`);
    } else {
      widgetAttributes.push(`recipient-token-address="YOUR_TOKEN_ADDRESS"`);
      comments.push("⚠️ Replace YOUR_TOKEN_ADDRESS with the token address (0x...)");
    }

    // Token symbol (optional, used for display in amount section)
    if (config.recipientTokenSymbol) {
      widgetAttributes.push(`recipient-token-symbol="${config.recipientTokenSymbol}"`);
    }

    // Default amount (optional)
    if (config.defaultAmount) {
      widgetAttributes.push(`default-amount="${config.defaultAmount}"`);
    }

    // Header title (optional, defaults to "SUPPORT")
    if (config.headerTitle && config.headerTitle !== "SUPPORT") {
      widgetAttributes.push(`header-title="${config.headerTitle}"`);
    }

    // Locale (optional, auto-detect by default)
    if (config.locale) {
      widgetAttributes.push(`locale="${config.locale}"`);
    }

    // Theme (required)
    if (config.theme) {
      widgetAttributes.push(`theme="${config.theme}"`);
    } else {
      widgetAttributes.push(`theme="auto"`);
    }

    // Optional: ReOwn Project ID
    if (config.reownProjectId) {
      widgetAttributes.push(`reown-project-id="${config.reownProjectId}"`);
    } else {
      widgetAttributes.push(`reown-project-id="YOUR_REOWN_PROJECT_ID"`);
      comments.push("⚠️ Replace YOUR_REOWN_PROJECT_ID with your ReOwn Project ID");
    }

    let styleAttr = "";
    if (config.theme === "custom" && config.themeCustom) {
      const styleParts = [
        `--color-background: ${config.themeCustom.background}`,
        `--color-foreground: ${config.themeCustom.foreground}`,
        `--color-primary: ${config.themeCustom.primary}`,
        `--color-secondary: ${config.themeCustom.secondary}`,
        `--color-accent: ${config.themeCustom.accent}`,
        `--color-border: ${config.themeCustom.border}`,
        `--color-muted: ${config.themeCustom.muted}`,
        `--color-muted-foreground: ${config.themeCustom.mutedForeground}`,
        `--radius: ${config.themeCustom.radius}`,
      ];
      styleAttr = ` style="\n    ${styleParts.join(";\n    ")}"`;
    }

    // Widget component code
    const widgetCode = `<donation-widget ${widgetAttributes.join("\n  ")}${styleAttr}>\n</donation-widget>`;

    // Determine script tag
    let scriptTag: string;
    
    // Use selected version if available, otherwise use latest from manifest
    const effectiveVersion = selectedVersion || (manifest?.latest);
    const effectiveVersionEntry = versionEntry || (manifest && manifest.versions[effectiveVersion || ""]);
    
    if (effectiveVersionEntry && effectiveVersion) {
      // Use versioned URL with SRI from public directory
      const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://cdn.donations.kalatori.org");
      const scriptUrl = `${origin}/${effectiveVersionEntry.file}`;
      
      scriptTag = `<script\n  src="${scriptUrl}"\n  integrity="${effectiveVersionEntry.integrity}"\n  crossorigin="anonymous"\n></script>`;
    } else {
      // Fallback: use development URL or show placeholder
      if (process.env.NODE_ENV === 'development') {
        scriptTag = `<script\n  src="http://localhost:3000/donation-widget.js"\n></script>`;
      } else {
        scriptTag = `<script>\n  // Please select a version or ensure versions.json is available\n</script>`;
      }
    }

    // Add comments at the beginning if there are any
    const commentBlock = comments.length > 0 
      ? `<!--\n${comments.join("\n")}\n-->\n\n`
      : "";

    return `${commentBlock}${widgetCode}\n\n${scriptTag}`;
  };

  const embedCode = generateSimpleEmbedCode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle ESC key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div className="space-y-3">
        {/* Version Information Display */}
        {versionEntry && selectedVersion && (
          <div
            className="px-4 py-3 rounded-lg border"
            style={{
              background: "oklch(from var(--color-primary) calc(l + 0.45) calc(c * 0.3) h / 0.15)",
              borderColor: "var(--color-primary)",
              borderRadius: "calc(var(--radius) - 2px)",
            }}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--color-primary)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--color-foreground)" }}
                >
                  Versioned Widget with SRI Protection
                </p>
                <p
                  className="text-xs mb-2"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  Using version <span className="font-mono font-semibold">v{selectedVersion}</span> with 
                  Subresource Integrity verification for enhanced security
                </p>
                <div
                  className="text-xs font-mono px-2 py-1 rounded inline-block"
                  style={{
                    background: "var(--color-secondary)",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {versionEntry.integrity.substring(0, 20)}...
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-background)",
            borderRadius: "calc(var(--radius) - 2px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          Get HTML Code
        </button>
      </div>

      {/* Modal Dialog via Portal */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: "oklch(0% 0 0 / 0.5)", zIndex: 9999 }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex-1 min-w-0">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  Widget Embed Code
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {versionEntry && selectedVersion ? (
                    <>
                      Widget component with versioned script <span className="font-mono font-semibold">v{selectedVersion}</span> and SRI protection
                    </>
                  ) : (
                    "Widget component with script tag"
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: "var(--color-muted-foreground)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <pre
                className="flex-1 p-6 overflow-auto"
                style={{
                  background: "oklch(16% 0 0)",
                  margin: 0,
                }}
              >
                <code
                  className="text-xs font-mono"
                  style={{ color: "oklch(99% 0 0)" }}
                >
                  {embedCode}
                </code>
              </pre>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 p-6 border-t"
              style={{ borderColor: "var(--color-border)" }}
            >
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-background)",
                  borderRadius: "calc(var(--radius) - 2px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-primary)";
                }}
              >
                {copied
                  ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  )
                  : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Code
                    </>
                  )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
