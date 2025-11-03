"use client";

import { useState } from "react";
import type { WidgetConfig } from "../../types/config";

interface EmbedCodeSectionProps {
  config: WidgetConfig;
}

export function EmbedCodeSection({ config }: EmbedCodeSectionProps) {
  const [copied, setCopied] = useState(false);

  const generateEmbedCode = (): string => {
    const attributes: string[] = [
      `recipient="${config.recipient}"`,
      `recipient-chain-id="${config.recipientChainId}"`,
      `recipient-token-address="${config.recipientTokenAddress}"`,
      `theme="${config.theme}"`,
    ];

    if (config.reownProjectId) {
      attributes.push(`reown-project-id="${config.reownProjectId}"`);
    }

    if (config.lifiApiKey) {
      attributes.push(`lifi-api-key="${config.lifiApiKey}"`);
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

    return `<donation-widget ${
      attributes.join(" ")
    }${styleAttr}></donation-widget>

<script src="https://donato.katsuba.dev/donation-widget.js"></script>`;
  };

  const embedCode = generateEmbedCode();

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="text-sm"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Copy this code and paste it into your HTML page
        </p>
        <button
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

      <pre
        className="p-4 rounded-lg overflow-x-auto"
        style={{
          background: "oklch(16% 0 0)",
          border: "1px solid var(--color-border)",
          borderRadius: "calc(var(--radius) - 2px)",
        }}
      >
        <code
          className="text-xs font-mono"
          style={{ color: 'oklch(99% 0 0)' }}
        >
          {embedCode}
        </code>
      </pre>
    </div>
  );
}
