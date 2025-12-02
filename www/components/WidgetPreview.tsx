"use client";

import { useEffect, useRef, useState } from "react";
import type { WidgetConfig } from "../types/config";

interface WidgetPreviewProps {
  config: WidgetConfig;
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for custom element to be defined
  useEffect(() => {
    async function waitForWidget() {
      try {
        // Check if custom element is already defined
        if (customElements.get("donation-widget")) {
          setIsWidgetReady(true);
          return;
        }

        // Wait for custom element to be defined (with timeout)
        await Promise.race([
          customElements.whenDefined("donation-widget"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout waiting for widget")), 10000)
          ),
        ]);
        setIsWidgetReady(true);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load widget script";
        setError(errorMessage);
        console.error("Error waiting for widget:", err);
      }
    }

    waitForWidget();
  }, []);

  useEffect(() => {
    if (!isWidgetReady || !containerRef.current) {
      return;
    }

    renderWidget();

    function renderWidget() {
      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      // Create widget element
      if (containerRef.current) {
        const widget = document.createElement("donation-widget");

        // Always set attributes, even if empty - widget will show validation errors
        widget.setAttribute("recipient", config.recipient || "");
        widget.setAttribute(
          "recipient-chain-id",
          config.recipientChainId?.toString() || "42161",
        );
        widget.setAttribute(
          "recipient-token-address",
          config.recipientTokenAddress || "",
        );
        if (config.recipientTokenSymbol) {
          widget.setAttribute(
            "recipient-token-symbol",
            config.recipientTokenSymbol,
          );
        }
        widget.setAttribute("theme", config.theme || "auto");
        widget.setAttribute("reown-project-id", config.reownProjectId || "");

        if (config.lifiApiKey) {
          widget.setAttribute("lifi-api-key", config.lifiApiKey);
        }

        if (config.defaultAmount) {
          widget.setAttribute("default-amount", config.defaultAmount);
        }

        if (config.headerTitle) {
          widget.setAttribute("header-title", config.headerTitle);
        }

        if (config.locale) {
          widget.setAttribute("locale", config.locale);
        }

        widget.setAttribute("style", "max-width: 480px;");

        // Apply custom theme styles if theme is custom
        const styleId = "donation-widget-custom-theme";
        const existingStyle = document.getElementById(
          styleId,
        ) as HTMLStyleElement;

        if (config.theme === "custom" && config.themeCustom) {
          let style = existingStyle;

          if (!style) {
            style = document.createElement("style");
            style.id = styleId;
            document.head.appendChild(style);
          }

          style.textContent = `
            donation-widget {
              --color-background: ${config.themeCustom.background};
              --color-foreground: ${config.themeCustom.foreground};
              --color-primary: ${config.themeCustom.primary};
              --color-secondary: ${config.themeCustom.secondary};
              --color-accent: ${config.themeCustom.accent};
              --color-border: ${config.themeCustom.border};
              --color-muted: ${config.themeCustom.muted};
              --color-muted-foreground: ${config.themeCustom.mutedForeground};
              --radius: ${config.themeCustom.radius};
            }
          `;
        } else if (existingStyle) {
          // Remove custom theme styles when not using custom theme
          existingStyle.remove();
        }

        containerRef.current.appendChild(widget);
      }
    }
  }, [config, isWidgetReady]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex justify-center items-start min-h-[400px] p-4 rounded-lg"
        style={{
          background: "var(--color-muted)",
          borderRadius: "calc(var(--radius) - 2px)",
        }}
      >
        {!isWidgetReady && !error && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Loading widget...
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-sm text-red-500">
              Error: {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
