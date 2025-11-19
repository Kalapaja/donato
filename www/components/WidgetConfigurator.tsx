"use client";

import { useState } from "react";
import type { WidgetConfig } from "../types/config";
import type { VersionEntry } from "../types/versions";
import { RecipientSection } from "./sections/RecipientSection";
import { CurrencyChainSection } from "./sections/CurrencyChainSection";
import { LiFiSection } from "./sections/LiFiSection";
import { ReOwnSection } from "./sections/ReOwnSection";
import { ThemeSection } from "./sections/ThemeSection";
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
            recipientChainId={config.recipientChainId || 42161}
            recipientTokenAddress={config.recipientTokenAddress || ""}
            onChainChange={(chainId, tokenAddress) =>
              onConfigChange({
                recipientChainId: chainId,
                recipientTokenAddress: tokenAddress,
              })}
          />
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
