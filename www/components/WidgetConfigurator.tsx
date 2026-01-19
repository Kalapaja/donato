"use client";

import { useState, useCallback } from "react";
import type { WidgetConfig } from "../types/config";
import type { VersionEntry } from "../types/versions";
import { RecipientSection } from "./sections/RecipientSection";
import { CurrencyChainSection } from "./sections/CurrencyChainSection";
import { ReOwnSection } from "./sections/ReOwnSection";
import { ThemeSection } from "./sections/ThemeSection";
import { LocaleSection } from "./sections/LocaleSection";
import { EmbedCodeSection } from "./sections/EmbedCodeSection";
import { VersionSelector } from "./VersionSelector";

interface WidgetConfiguratorProps {
  config: Partial<WidgetConfig>;
  onConfigChange: (updates: Partial<WidgetConfig>) => void;
}

const SECTION_SEPARATOR_STYLE = {
  borderTop: "1px solid var(--color-border)",
  paddingTop: "1.5rem",
};

const AMOUNT_PRESETS = [10, 25, 50, 100] as const;

export function WidgetConfigurator({
  config,
  onConfigChange,
}: WidgetConfiguratorProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [versionEntry, setVersionEntry] = useState<VersionEntry | null>(null);

  function handleVersionChange(version: string, entry: VersionEntry): void {
    setSelectedVersion(version);
    setVersionEntry(entry);
  }

  const handleChainChange = useCallback(
    (chainId: number, tokenAddress: string, tokenSymbol: string) => {
      onConfigChange({
        recipientChainId: chainId,
        recipientTokenAddress: tokenAddress,
        recipientTokenSymbol: tokenSymbol,
      });
    },
    [onConfigChange]
  );

  return (
    <div className="space-y-6">
      <CurrencyChainSection
        recipientChainId={config.recipientChainId || 1}
        recipientTokenAddress={config.recipientTokenAddress || ""}
        onChainChange={handleChainChange}
      />

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
          onChange={(e) =>
            onConfigChange({ headerTitle: e.target.value || "SUPPORT" })
          }
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
          Pre-fill donation amount
        </p>

        <div className="flex gap-2 flex-wrap">
          {AMOUNT_PRESETS.map((preset) => {
            const isSelected = config.defaultAmount === String(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onConfigChange({ defaultAmount: String(preset) })}
                className="px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: isSelected
                    ? "var(--color-primary)"
                    : "var(--color-background)",
                  color: isSelected
                    ? "var(--color-background)"
                    : "var(--color-foreground)",
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

      <RecipientSection
        recipient={config.recipient || ""}
        onRecipientChange={(recipient) => onConfigChange({ recipient })}
      />

      <div style={SECTION_SEPARATOR_STYLE}>
        <ReOwnSection
          reownProjectId={config.reownProjectId || ""}
          onProjectIdChange={(id) => onConfigChange({ reownProjectId: id })}
        />
      </div>

      <div style={SECTION_SEPARATOR_STYLE}>
        <ThemeSection
          theme={config.theme || "auto"}
          themeCustom={config.themeCustom}
          onThemeChange={(theme, custom) =>
            onConfigChange({ theme, themeCustom: custom })
          }
        />
      </div>

      <div style={SECTION_SEPARATOR_STYLE}>
        <LocaleSection
          locale={config.locale || ""}
          onLocaleChange={(locale) => onConfigChange({ locale })}
        />
      </div>

      <div style={SECTION_SEPARATOR_STYLE}>
        <VersionSelector
          selectedVersion={selectedVersion}
          onVersionChange={handleVersionChange}
        />
      </div>

      <div style={SECTION_SEPARATOR_STYLE}>
        <EmbedCodeSection
          config={config}
          selectedVersion={selectedVersion || undefined}
          versionEntry={versionEntry || undefined}
          baseUrl={
            process.env.NEXT_PUBLIC_CDN_DOMAIN ||
            "https://cdn.donations.kalatori.org"
          }
        />
      </div>
    </div>
  );
}
