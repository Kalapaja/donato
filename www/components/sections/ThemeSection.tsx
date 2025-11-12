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
  { id: "auto", name: "Auto", description: "Matches system preference" },
  { id: "light", name: "Light", description: "Light theme" },
  { id: "dark", name: "Dark", description: "Dark theme" },
];

export function ThemeSection(
  { theme, onThemeChange }: ThemeSectionProps,
) {
  const handlePresetSelect = (presetId: string) => {
    onThemeChange(presetId);
  };

  const randomizeColors = () => {
    // Выбираем случайную цветовую схему
    const schemeType = Math.random();
    
    // Случайно выбираем светлую или темную тему (50/50)
    const isDark = Math.random() < 0.5;
    
    // Базовый оттенок для основной палитры
    const baseHue = Math.floor(Math.random() * 360);
    
    // Определяем дополнительные оттенки в зависимости от схемы
    let primaryHue = baseHue;
    let accentHue = baseHue;
    let secondaryHue = baseHue;
    
    if (schemeType < 0.33) {
      // Комплементарная схема (противоположные цвета)
      primaryHue = baseHue;
      accentHue = (baseHue + 180) % 360;
      secondaryHue = (baseHue + 30) % 360;
    } else if (schemeType < 0.66) {
      // Триадная схема (равномерно распределенные)
      primaryHue = baseHue;
      accentHue = (baseHue + 120) % 360;
      secondaryHue = (baseHue + 240) % 360;
    } else {
      // Аналогичная схема (близкие оттенки)
      primaryHue = baseHue;
      accentHue = (baseHue + 30) % 360;
      secondaryHue = (baseHue + 60) % 360;
    }

    // Насыщенность: низкая для нейтральных, средняя для основных, выше для акцентов
    const neutralChroma = 0.02 + Math.random() * 0.03; // Очень низкая для фона/границ
    const primaryChroma = 0.08 + Math.random() * 0.12; // Умеренная для основных элементов
    const accentChroma = 0.12 + Math.random() * 0.15; // Выше для акцентов, но не слишком

    const backgroundHue = baseHue;
    
    // Настраиваем lightness в зависимости от светлой/темной темы
    let backgroundLightness: number;
    let foregroundLightness: number;
    let primaryLightness: number;
    let secondaryLightness: number;
    let accentLightness: number;
    let borderLightness: number;
    let mutedLightness: number;
    let mutedForegroundLightness: number;

    if (isDark) {
      // Темная тема
      backgroundLightness = 8 + Math.random() * 7; // Темный фон (8-15%)
      foregroundLightness = 90 + Math.random() * 8; // Светлый текст (90-98%)
      primaryLightness = 65 + Math.random() * 15; // Яркий primary для темной темы
      secondaryLightness = 20 + Math.random() * 10; // Темный secondary
      accentLightness = 70 + Math.random() * 15; // Яркий accent
      borderLightness = 15 + Math.random() * 8; // Темная граница
      mutedLightness = 12 + Math.random() * 6; // Темный muted
      mutedForegroundLightness = 60 + Math.random() * 15; // Приглушенный светлый текст
    } else {
      // Светлая тема
      backgroundLightness = 95 + Math.random() * 5; // Очень светлый фон (95-100%)
      foregroundLightness = 12 + Math.random() * 8; // Темный текст (12-20%)
      primaryLightness = 45 + Math.random() * 15; // Основной цвет
      secondaryLightness = 75 + Math.random() * 15; // Светлый secondary
      accentLightness = 55 + Math.random() * 20; // Яркий accent
      borderLightness = 80 + Math.random() * 10; // Светлая граница
      mutedLightness = 88 + Math.random() * 8; // Светлый muted
      mutedForegroundLightness = 45 + Math.random() * 15; // Приглушенный темный текст
    }

    const newTheme: ThemeCustom = {
      background: `oklch(${backgroundLightness}% ${neutralChroma} ${backgroundHue})`,
      foreground: `oklch(${foregroundLightness}% ${neutralChroma * 1.5} ${backgroundHue})`,
      primary: `oklch(${primaryLightness}% ${primaryChroma} ${primaryHue})`,
      secondary: `oklch(${secondaryLightness}% ${primaryChroma * 0.6} ${secondaryHue})`,
      accent: `oklch(${accentLightness}% ${accentChroma} ${accentHue})`,
      border: `oklch(${borderLightness}% ${neutralChroma} ${backgroundHue})`,
      muted: `oklch(${mutedLightness}% ${neutralChroma} ${backgroundHue})`,
      mutedForeground: `oklch(${mutedForegroundLightness}% ${neutralChroma * 2} ${backgroundHue})`,
      radius: `${Math.round((Math.random() * 1.5) / 0.25) * 0.25}rem`,
    };

    onThemeChange("custom", newTheme);
  };

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
        {PRESET_THEMES.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetSelect(preset.id)}
            className="p-3 rounded-lg text-left text-sm transition-colors"
            style={{
              background: theme === preset.id && theme !== "custom"
                ? "var(--color-muted)"
                : "var(--color-background)",
              border: theme === preset.id && theme !== "custom"
                ? "1px solid var(--color-primary)"
                : "1px solid var(--color-border)",
              color: "var(--color-foreground)",
              borderRadius: "calc(var(--radius) - 2px)",
            }}
            onMouseEnter={(e) => {
              if (theme !== preset.id || theme === "custom") {
                e.currentTarget.style.background = "var(--color-muted)";
              }
            }}
            onMouseLeave={(e) => {
              if (theme !== preset.id || theme === "custom") {
                e.currentTarget.style.background = "var(--color-background)";
              }
            }}
          >
            <div className="font-medium mb-1">{preset.name}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={randomizeColors}
          className="p-3 rounded-lg text-left text-sm transition-colors whitespace-nowrap"
          style={{
            background: theme === "custom"
              ? "var(--color-muted)"
              : "var(--color-background)",
            border: theme === "custom"
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
          <div className="font-medium truncate">🎲 Randomize</div>
        </button>
      </div>
    </div>
  );
}
