"use client";

import { useEffect, useRef } from "react";
import type { WidgetConfig } from "../types/config";

interface WidgetPreviewProps {
  config: WidgetConfig;
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    
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
        widget.setAttribute("theme", config.theme || "auto");
        widget.setAttribute("reown-project-id", config.reownProjectId || "");

        if (config.lifiApiKey) {
          widget.setAttribute("lifi-api-key", config.lifiApiKey);
        }

        widget.setAttribute("style", "max-width: 360px;");

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
  }, [config]);

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
      </div>
    </div>
  );
}
