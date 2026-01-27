"use client";

import { useEffect, useRef, useState } from "react";
import type { WidgetConfig } from "../types/config";

interface WidgetPreviewProps {
  config: WidgetConfig;
}

const WIDGET_WAIT_TIMEOUT = 10000;
const CUSTOM_THEME_STYLE_ID = "donation-widget-custom-theme";

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for custom element to be defined
  useEffect(() => {
    async function waitForWidget(): Promise<void> {
      // Check if custom element is already defined
      if (customElements.get("donation-widget")) {
        setIsWidgetReady(true);
        return;
      }

      // Wait for custom element to be defined (with timeout)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout waiting for widget")),
          WIDGET_WAIT_TIMEOUT
        )
      );

      try {
        await Promise.race([
          customElements.whenDefined("donation-widget"),
          timeoutPromise,
        ]);
        setIsWidgetReady(true);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load widget script";
        setError(errorMessage);
        console.error("Error waiting for widget:", err);
      }
    }

    waitForWidget();
  }, []);

  useEffect(() => {
    if (!isWidgetReady || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const widget = document.createElement("donation-widget");

    // Set required attributes
    widget.setAttribute("recipient", config.recipient || "");
    widget.setAttribute("theme", config.theme || "auto");
    widget.setAttribute("reown-project-id", config.reownProjectId || "");
    widget.setAttribute("style", "max-width: 480px;");

    // Set optional attributes
    if (config.defaultAmount) {
      widget.setAttribute("default-amount", config.defaultAmount);
    }
    if (config.headerTitle) {
      widget.setAttribute("header-title", config.headerTitle);
    }
    if (config.locale) {
      widget.setAttribute("locale", config.locale);
    }
    if (config.enableContinuous === true) {
      widget.setAttribute("continuous-enabled", "true");
    }

    // Handle custom theme styles
    const existingStyle = document.getElementById(
      CUSTOM_THEME_STYLE_ID
    ) as HTMLStyleElement | null;

    if (config.theme === "custom" && config.themeCustom) {
      const style = existingStyle ?? (() => {
        const el = document.createElement("style");
        el.id = CUSTOM_THEME_STYLE_ID;
        document.head.appendChild(el);
        return el;
      })();

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
    } else {
      existingStyle?.remove();
    }

    container.appendChild(widget);
  }, [config, isWidgetReady]);

  function renderContent(): React.ReactNode {
    if (error) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-sm text-red-500">Error: {error}</div>
        </div>
      );
    }

    if (!isWidgetReady) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div
            className="text-sm"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Loading widget...
          </div>
        </div>
      );
    }

    return null;
  }

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
        {renderContent()}
      </div>
    </div>
  );
}
