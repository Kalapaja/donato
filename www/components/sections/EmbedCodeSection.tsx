"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { WidgetConfig } from "../../types/config";

interface EmbedCodeSectionProps {
  config: WidgetConfig;
  widgetScript: string;
}

export function EmbedCodeSection({ config, widgetScript }: EmbedCodeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateFullPageCode = (): string => {
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

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Widget</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }
    .container {
      width: 100%;
      max-width: 480px;
      padding: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <donation-widget ${
      widgetAttributes.join(" ")
    }${styleAttr}></donation-widget>
  </div>

  <script>
${widgetScript}
  </script>
</body>
</html>`;
  };

  const embedCode = generateFullPageCode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([embedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donation-widget.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
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
              <div>
                <h3
                  className="text-xl font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  Full HTML Page
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  Complete HTML file with inlined widget script
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
                onClick={handleDownload}
                className="px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  background: "var(--color-secondary)",
                  color: "var(--color-foreground)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "calc(var(--radius) - 2px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-secondary)";
                }}
              >
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download HTML
              </button>
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
