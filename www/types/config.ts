export interface WidgetConfig {
  recipient: string;
  recipientChainId: number;
  recipientTokenAddress: string;
  recipientTokenSymbol: string;
  reownProjectId: string;
  theme: string;
  defaultAmount?: string;
  headerTitle?: string;
  locale?: string;
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
