"use client";

interface ThemeCustom {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  muted: string;
  mutedForeground: string;
  radius: string;
}

interface ThemeSectionProps {
  theme: string;
  themeCustom?: ThemeCustom;
  onThemeChange: (theme: string, custom?: ThemeCustom) => void;
}

const PRESET_THEMES = [
  { id: "auto", name: "Auto" },
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
] as const;

interface ColorSchemeConfig {
  primaryHue: number;
  accentHue: number;
  secondaryHue: number;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function selectColorScheme(baseHue: number): ColorSchemeConfig {
  const schemeType = Math.random();

  if (schemeType < 0.33) {
    // Complementary scheme (opposite colors)
    return {
      primaryHue: baseHue,
      accentHue: (baseHue + 180) % 360,
      secondaryHue: (baseHue + 30) % 360,
    };
  }

  if (schemeType < 0.66) {
    // Triadic scheme (evenly distributed)
    return {
      primaryHue: baseHue,
      accentHue: (baseHue + 120) % 360,
      secondaryHue: (baseHue + 240) % 360,
    };
  }

  // Analogous scheme (close hues)
  return {
    primaryHue: baseHue,
    accentHue: (baseHue + 30) % 360,
    secondaryHue: (baseHue + 60) % 360,
  };
}

function generateRandomTheme(): ThemeCustom {
  const isDark = Math.random() < 0.5;
  const baseHue = Math.floor(Math.random() * 360);
  const { primaryHue, accentHue, secondaryHue } = selectColorScheme(baseHue);

  // Saturation values
  const neutralChroma = randomInRange(0.02, 0.05);
  const primaryChroma = randomInRange(0.08, 0.2);
  const accentChroma = randomInRange(0.12, 0.27);

  // Lightness values based on dark/light theme
  const lightness = isDark
    ? {
        background: randomInRange(8, 15),
        foreground: randomInRange(90, 98),
        primary: randomInRange(65, 80),
        secondary: randomInRange(20, 30),
        accent: randomInRange(70, 85),
        border: randomInRange(15, 23),
        muted: randomInRange(12, 18),
        mutedForeground: randomInRange(60, 75),
      }
    : {
        background: randomInRange(95, 100),
        foreground: randomInRange(12, 20),
        primary: randomInRange(45, 60),
        secondary: randomInRange(75, 90),
        accent: randomInRange(55, 75),
        border: randomInRange(80, 90),
        muted: randomInRange(88, 96),
        mutedForeground: randomInRange(45, 60),
      };

  return {
    background: `oklch(${lightness.background}% ${neutralChroma} ${baseHue})`,
    foreground: `oklch(${lightness.foreground}% ${neutralChroma * 1.5} ${baseHue})`,
    primary: `oklch(${lightness.primary}% ${primaryChroma} ${primaryHue})`,
    secondary: `oklch(${lightness.secondary}% ${primaryChroma * 0.6} ${secondaryHue})`,
    accent: `oklch(${lightness.accent}% ${accentChroma} ${accentHue})`,
    border: `oklch(${lightness.border}% ${neutralChroma} ${baseHue})`,
    muted: `oklch(${lightness.muted}% ${neutralChroma} ${baseHue})`,
    mutedForeground: `oklch(${lightness.mutedForeground}% ${neutralChroma * 2} ${baseHue})`,
    radius: `${Math.round((Math.random() * 1.5) / 0.25) * 0.25}rem`,
  };
}

export function ThemeSection({ theme, onThemeChange }: ThemeSectionProps) {
  function handlePresetSelect(presetId: string): void {
    onThemeChange(presetId);
  }

  function handleRandomize(): void {
    onThemeChange("custom", generateRandomTheme());
  }

  function isPresetSelected(presetId: string): boolean {
    return theme === presetId && theme !== "custom";
  }

  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: "var(--color-foreground)" }}
      >
        Theme
      </label>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Select a preset theme or generate a random one
      </p>

      <div className="grid sm:grid-cols-4 gap-3 grid-cols-2">
        {PRESET_THEMES.map((preset) => {
          const isSelected = isPresetSelected(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className="p-3 rounded-lg text-left text-sm transition-colors"
              style={{
                background: isSelected ? "var(--color-muted)" : "var(--color-background)",
                border: isSelected
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "var(--color-muted)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "var(--color-background)";
                }
              }}
            >
              <div className="font-medium mb-1">{preset.name}</div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleRandomize}
          className="p-3 rounded-lg text-left text-sm transition-colors whitespace-nowrap"
          style={{
            background: theme === "custom" ? "var(--color-muted)" : "var(--color-background)",
            border:
              theme === "custom"
                ? "1px solid var(--color-primary)"
                : "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            borderRadius: "calc(var(--radius) - 2px)",
          }}
          onMouseEnter={(e) => {
            if (theme !== "custom") {
              e.currentTarget.style.background = "var(--color-muted)";
            }
          }}
          onMouseLeave={(e) => {
            if (theme !== "custom") {
              e.currentTarget.style.background = "var(--color-background)";
            }
          }}
        >
          <div className="font-medium truncate">Randomize</div>
        </button>
      </div>
    </div>
  );
}
