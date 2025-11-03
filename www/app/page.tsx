"use client";

import { useState } from "react";
import { WidgetConfigurator } from "../components/WidgetConfigurator";
import { WidgetPreview } from "../components/WidgetPreview";
import type { WidgetConfig } from "../types/config";

export default function Home() {
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

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-background)" }}
    >
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <header className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "var(--color-foreground)" }}
          >
            Donation Widget Constructor
          </h1>
          <p
            className="text-lg"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Configure your donation widget and see it live
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
