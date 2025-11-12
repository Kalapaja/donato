"use client";

import { useState, useEffect } from "react";
import { WidgetConfigurator } from "./WidgetConfigurator";
import { WidgetPreview } from "./WidgetPreview";
import type { WidgetConfig } from "../types/config";

interface ClientPageProps {
  widgetScript: string;
}

export function ClientPage({ widgetScript }: ClientPageProps) {
  const [config, setConfig] = useState<Partial<WidgetConfig>>({
    recipient: "",
    recipientChainId: 42161,
    recipientTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    reownProjectId: "",
    lifiApiKey: "",
    theme: "auto",
  });

  const handleConfigChange = (updates: Partial<WidgetConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Sync widget theme with landing page theme
  useEffect(() => {
    const html = document.documentElement;
    const customThemeStyleId = "landing-page-custom-theme";
    let customThemeStyle = document.getElementById(
      customThemeStyleId,
    ) as HTMLStyleElement;

    const theme = config.theme || "auto";

    // Remove both dark and light classes first
    html.classList.remove("dark", "light");

    if (theme === "light") {
      // Light theme - add light class to override media query
      html.classList.add("light");
      // Remove custom theme styles if they exist
      if (customThemeStyle) {
        customThemeStyle.remove();
      }
    } else if (theme === "dark") {
      // Dark theme - add dark class
      html.classList.add("dark");
      // Remove custom theme styles if they exist
      if (customThemeStyle) {
        customThemeStyle.remove();
      }
    } else if (theme === "auto") {
      // Auto theme - remove both classes, let media query handle it
      html.classList.remove("dark", "light");
      // Remove custom theme styles if they exist
      if (customThemeStyle) {
        customThemeStyle.remove();
      }
    } else if (theme === "custom" && config.themeCustom) {
      // Custom theme - apply custom CSS variables to root
      if (!customThemeStyle) {
        customThemeStyle = document.createElement("style");
        customThemeStyle.id = customThemeStyleId;
        document.head.appendChild(customThemeStyle);
      }

      customThemeStyle.textContent = `
        :root {
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
    }
  }, [config.theme, config.themeCustom]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-background)" }}
    >
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <header className="text-left mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "var(--color-foreground)" }}
          >
            Get Started with Crypto Donations in Minutes
          </h1>
          <p
            className="text-lg"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Set up your widget live, add your wallet, upload the code to website, and start accepting donations immediately
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form - 1/2 width on desktop */}
          <div>
            <div
              className="rounded-2xl p-6 sticky top-6"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                boxShadow:
                  "0 1px 3px 0 oklch(0% 0 0 / 0.1), 0 1px 2px -1px oklch(0% 0 0 / 0.1)",
              }}
            >
              <WidgetConfigurator
                config={config}
                onConfigChange={handleConfigChange}
                widgetScript={widgetScript}
              />
            </div>
          </div>

          {/* Widget Preview - 1/2 width on desktop */}
          <div>
            <div
              className="rounded-2xl p-6 sticky top-6"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                boxShadow:
                  "0 1px 3px 0 oklch(0% 0 0 / 0.1), 0 1px 2px -1px oklch(0% 0 0 / 0.1)",
              }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                Preview
              </h2>
              <WidgetPreview config={config as WidgetConfig} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

