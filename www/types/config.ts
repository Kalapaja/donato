export interface WidgetConfig {
  recipient: string;
  reownProjectId: string;
  theme: string;
  defaultAmount?: string;
  headerTitle?: string;
  locale?: string;
  enableContinuous?: boolean;
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
