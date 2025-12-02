"use client";

interface LocaleSectionProps {
  locale: string;
  onLocaleChange: (locale: string) => void;
}

const AVAILABLE_LOCALES = [
  { code: "", label: "Auto-detect", description: "Detect from browser settings" },
  { code: "en", label: "English", description: "English (US)" },
  { code: "ru", label: "Русский", description: "Russian" },
] as const;

export function LocaleSection({ locale, onLocaleChange }: LocaleSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          className="block text-sm font-semibold mb-2"
          style={{ color: "var(--color-foreground)" }}
        >
          Language
        </label>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Select the widget interface language
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_LOCALES.map((loc) => {
          const isSelected = locale === loc.code;
          return (
            <button
              key={loc.code}
              type="button"
              onClick={() => onLocaleChange(loc.code)}
              className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: isSelected
                  ? "var(--color-primary)"
                  : "var(--color-background)",
                color: isSelected
                  ? "var(--color-background)"
                  : "var(--color-foreground)",
                border: `1px solid ${
                  isSelected ? "var(--color-primary)" : "var(--color-border)"
                }`,
                borderRadius: "calc(var(--radius) - 2px)",
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
              title={loc.description}
            >
              {loc.label}
            </button>
          );
        })}
      </div>

      {locale === "" && (
        <p
          className="text-xs"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          The widget will automatically detect language from the user&apos;s browser
          settings
        </p>
      )}
    </div>
  );
}

