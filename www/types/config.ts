export interface WidgetConfig {
  recipient: string;
  recipientChainId: number;
  recipientTokenAddress: string;
  reownProjectId: string;
  oneInchApiKey: string;
  theme: string;
  themeCustom?: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    muted: string;
    mutedForeground: string;
    radius: string;
  };
}
