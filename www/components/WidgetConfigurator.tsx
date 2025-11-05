"use client";

import type { WidgetConfig } from "../types/config";
import { RecipientSection } from "./sections/RecipientSection";
import { CurrencyChainSection } from "./sections/CurrencyChainSection";
import { OneInchSection } from "./sections/OneInchSection";
import { ReOwnSection } from "./sections/ReOwnSection";
import { ThemeSection } from "./sections/ThemeSection";
import { EmbedCodeSection } from "./sections/EmbedCodeSection";

interface WidgetConfiguratorProps {
  config: Partial<WidgetConfig>;
  onConfigChange: (updates: Partial<WidgetConfig>) => void;
  widgetScript: string;
}

export function WidgetConfigurator(
  { config, onConfigChange, widgetScript }: WidgetConfiguratorProps,
) {
  const isValidConfig = !!(
    config.recipient &&
    /^0x[a-fA-F0-9]{40}$/.test(config.recipient) &&
    config.recipientChainId &&
    config.recipientTokenAddress &&
    config.theme
  );

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--color-foreground)" }}
        >
          Configuration
        </h2>
        <p style={{ color: "var(--color-muted-foreground)" }}>
          Configure your donation widget settings below
        </p>
      </div>

      <div className="space-y-6">
      

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1.5rem",
          }}
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
          <OneInchSection
            oneInchApiKey={config.oneInchApiKey || ""}
            onApiKeyChange={(key) => onConfigChange({ oneInchApiKey: key })}
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

      {isValidConfig && (
        <div
          style={{
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <EmbedCodeSection 
            config={config as WidgetConfig} 
            widgetScript={widgetScript}
          />
        </div>
      )}
    </div>
  );
}
