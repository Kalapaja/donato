"use client";

import { useEffect } from "react";
import { WidgetConfigurator } from "./WidgetConfigurator";
import { WidgetPreview } from "./WidgetPreview";
import type { WidgetConfig } from "../types/config";
import type { AcrossStats } from "../lib/across-stats";
import { useLocalStorageConfig } from "../lib/useLocalStorageConfig";

const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  recipient: "",
  reownProjectId: "",
  theme: "auto",
};

interface ClientPageProps {
  acrossStats: AcrossStats;
}

export function ClientPage({ acrossStats }: ClientPageProps) {
  const [config, handleConfigChange] = useLocalStorageConfig(DEFAULT_CONFIG);

  // Sync widget theme with landing page theme
  useEffect(() => {
    const html = document.documentElement;
    const customThemeStyleId = "landing-page-custom-theme";
    const customThemeStyle = document.getElementById(customThemeStyleId) as HTMLStyleElement | null;
    const theme = config.theme || "auto";

    // Reset theme classes
    html.classList.remove("dark", "light");

    // Handle non-custom themes
    if (theme !== "custom") {
      if (theme === "light" || theme === "dark") {
        html.classList.add(theme);
      }
      customThemeStyle?.remove();
      return;
    }

    // Handle custom theme
    if (!config.themeCustom) return;

    const styleElement = customThemeStyle ?? (() => {
      const el = document.createElement("style");
      el.id = customThemeStyleId;
      document.head.appendChild(el);
      return el;
    })();

    styleElement.textContent = `
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
            Accept {acrossStats.tokenCount}+ tokens across {acrossStats.chainCount} chains — donors pay with any crypto, you receive USDC on Polygon
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
                chainCount={acrossStats.chainCount}
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

