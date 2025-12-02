"use client";

import { useState } from "react";
import type { WidgetConfig } from "../types/config";
import type { VersionEntry } from "../types/versions";
import { RecipientSection } from "./sections/RecipientSection";
import { CurrencyChainSection } from "./sections/CurrencyChainSection";
import { LiFiSection } from "./sections/LiFiSection";
import { ReOwnSection } from "./sections/ReOwnSection";
import { ThemeSection } from "./sections/ThemeSection";
import { LocaleSection } from "./sections/LocaleSection";
import { EmbedCodeSection } from "./sections/EmbedCodeSection";
import { VersionSelector } from "./VersionSelector";

interface WidgetConfiguratorProps {
  config: Partial<WidgetConfig>;
  onConfigChange: (updates: Partial<WidgetConfig>) => void;
}

export function WidgetConfigurator(
  { config, onConfigChange }: WidgetConfiguratorProps,
) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [versionEntry, setVersionEntry] = useState<VersionEntry | null>(null);

  const handleVersionChange = (version: string, entry: VersionEntry) => {
    setSelectedVersion(version);
    setVersionEntry(entry);
  };

  return (
    <div className="space-y-6">
      

      <div className="space-y-6">
      

        <div
          
        >
          <CurrencyChainSection
            recipientChainId={config.recipientChainId || 1}
            recipientTokenAddress={config.recipientTokenAddress || ""}
            onChainChange={(chainId, tokenAddress, tokenSymbol) =>
              onConfigChange({
                recipientChainId: chainId,
                recipientTokenAddress: tokenAddress,
                recipientTokenSymbol: tokenSymbol,
              })}
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--color-foreground)" }}
          >
            Header Title
          </label>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Text displayed next to the heart icon in the widget header
          </p>
          <input
            type="text"
            value={config.headerTitle || "SUPPORT"}
            onChange={(e) => onConfigChange({ headerTitle: e.target.value || "SUPPORT" })}
            placeholder="SUPPORT"
            className="w-full px-4 py-2 text-sm transition-all"
            style={{
              background: "var(--color-background)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
              borderRadius: "calc(var(--radius) - 2px)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--color-foreground)" }}
          >
            Default Amount
          </label>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Pre-fill donation amount (optional)
          </p>
          
          {/* Preset amount cards */}
          <div className="flex gap-2 flex-wrap">
            {[10, 25, 50, 100].map((preset) => {
              const isSelected = config.defaultAmount === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onConfigChange({ defaultAmount: String(preset) })}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: isSelected ? "var(--color-primary)" : "var(--color-background)",
                    color: isSelected ? "var(--color-background)" : "var(--color-foreground)",
                    border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "20px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-muted)";
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-background)";
                      e.currentTarget.style.borderColor = "var(--color-border)";
                    }
                  }}
                >
                  ${preset}
                </button>
              );
            })}
            {/* Clear button */}
            {config.defaultAmount && (
              <button
                type="button"
                onClick={() => onConfigChange({ defaultAmount: "" })}
                className="px-3 py-2 text-sm font-medium transition-all"
                style={{
                  background: "transparent",
                  color: "var(--color-muted-foreground)",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "20px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.color = "var(--color-foreground)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-muted-foreground)";
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <RecipientSection
            recipient={config.recipient || ""}
            onRecipientChange={(recipient) => onConfigChange({ recipient })}
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1.5rem",
          }}
        >
          <LiFiSection
            lifiApiKey={config.lifiApiKey || ""}
            onApiKeyChange={(key) => onConfigChange({ lifiApiKey: key })}
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1.5rem",
          }}
        >
          <ReOwnSection
            reownProjectId={config.reownProjectId || ""}
            onProjectIdChange={(id) => onConfigChange({ reownProjectId: id })}
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1.5rem",
          }}
        >
          <ThemeSection
            theme={config.theme || "auto"}
            themeCustom={config.themeCustom}
            onThemeChange={(theme, custom) =>
              onConfigChange({ theme, themeCustom: custom })}
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1.5rem",
          }}
        >
          <LocaleSection
            locale={config.locale || ""}
            onLocaleChange={(locale) => onConfigChange({ locale })}
          />
        </div>
      </div>

      <div
        style={{
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <VersionSelector 
          selectedVersion={selectedVersion}
          onVersionChange={handleVersionChange}
        />
      </div>

      <div
        style={{
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <EmbedCodeSection 
          config={config} 
          selectedVersion={selectedVersion || undefined}
          versionEntry={versionEntry || undefined}
          baseUrl={process.env.NEXT_PUBLIC_CDN_DOMAIN || "https://cdn.donations.kalatori.org"}
        />
      </div>
    </div>
  );
}
