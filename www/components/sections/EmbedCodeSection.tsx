"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { WidgetConfig } from "../../types/config";
import type { VersionEntry } from "../../types/versions";

interface EmbedCodeSectionProps {
  config: WidgetConfig;
  widgetScript: string;
  /** Selected version entry for generating versioned embed code */
  selectedVersion?: string;
  /** Version entry data (contains integrity hash, file name, etc.) */
  versionEntry?: VersionEntry;
  /** Base URL for the widget CDN (default: window.location.origin) */
  baseUrl?: string;
}

export function EmbedCodeSection({ 
  config, 
  widgetScript, 
  selectedVersion,
  versionEntry,
  baseUrl,
}: EmbedCodeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSimpleEmbedCode = (): string => {
    const widgetAttributes: string[] = [
      `recipient="${config.recipient}"`,
      `recipient-chain-id="${config.recipientChainId}"`,
      `recipient-token-address="${config.recipientTokenAddress}"`,
      `theme="${config.theme}"`,
    ];

    if (config.reownProjectId) {
      widgetAttributes.push(`reown-project-id="${config.reownProjectId}"`);
    }

    if (config.lifiApiKey) {
      widgetAttributes.push(`lifi-api-key="${config.lifiApiKey}"`);
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
      styleAttr = ` style="${styleParts.join("; ")}"`;
    }

    // Widget component code
    const widgetCode = `<donation-widget ${widgetAttributes.join("\n  ")}${styleAttr}>\n</donation-widget>`;

    // Determine script tag
    let scriptTag: string;
    
    if (versionEntry && selectedVersion) {
      // Use versioned URL with SRI from public directory
      const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://cdn.donations.kalatori.org");
      const scriptUrl = `${origin}/${versionEntry.file}`;
      
      scriptTag = `<script\n  src="${scriptUrl}"\n  integrity="${versionEntry.integrity}"\n  crossorigin="anonymous"\n></script>`;
    } else {
      // Fallback to inline script (for backward compatibility or when version is not selected)
      scriptTag = `<script>\n${widgetScript}\n</script>`;
    }

    return `${widgetCode}\n\n${scriptTag}`;
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
