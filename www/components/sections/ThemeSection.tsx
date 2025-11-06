"use client";

import { useState } from "react";
import { oklchToHex, hexToOklch } from "@/lib/color-utils";

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

const CUSTOM_THEME_DEFAULTS: ThemeCustom = {
  background: "oklch(100% 0 0)",
  foreground: "oklch(14% 0 0)",
  primary: "oklch(17% 0 0)",
  secondary: "oklch(96% 0 0)",
  accent: "oklch(32% 0 0)",
  border: "oklch(91% 0 0)",
  muted: "oklch(96% 0 0)",
  mutedForeground: "oklch(52% 0 0)",
  radius: "1rem",
};

// Fields that are colors (not radius)
const COLOR_FIELDS: (keyof ThemeCustom)[] = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
  "border",
  "muted",
  "mutedForeground",
];

export function ThemeSection(
  { theme, themeCustom, onThemeChange }: ThemeSectionProps,
) {
  const [showWizard, setShowWizard] = useState(false);
  const [customTheme, setCustomTheme] = useState<ThemeCustom>(
    themeCustom || CUSTOM_THEME_DEFAULTS,
  );

  const handlePresetSelect = (presetId: string) => {
    onThemeChange(presetId);
    setShowWizard(false);
  };

  const handleCustomThemeChange = (field: keyof ThemeCustom, value: string) => {
    const updated = { ...customTheme, [field]: value };
    setCustomTheme(updated);
    onThemeChange("custom", updated);
  };

  const handleColorChange = (field: keyof ThemeCustom, hexValue: string) => {
    const oklchValue = hexToOklch(hexValue);
    handleCustomThemeChange(field, oklchValue);
  };

  const randomizeColors = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const randomChroma = 0.1 + Math.random() * 0.2;

    const newTheme: ThemeCustom = {
      background: `oklch(${
        90 + Math.random() * 10
      }% ${randomChroma} ${randomHue})`,
      foreground: `oklch(${
        10 + Math.random() * 10
      }% ${randomChroma} ${randomHue})`,
      primary: `oklch(${50 + Math.random() * 20}% ${
        randomChroma + 0.1
      } ${randomHue})`,
      secondary: `oklch(${
        80 + Math.random() * 15
      }% ${randomChroma} ${randomHue})`,
      accent: `oklch(${60 + Math.random() * 20}% ${
        randomChroma + 0.15
      } ${randomHue})`,
      border: `oklch(${75 + Math.random() * 15}% ${randomChroma} ${randomHue})`,
      muted: `oklch(${85 + Math.random() * 10}% ${randomChroma} ${randomHue})`,
      mutedForeground: `oklch(${
        40 + Math.random() * 20
      }% ${randomChroma} ${randomHue})`,
      radius: `${Math.round((Math.random() * 1.5) / 0.25) * 0.25}rem`,
    };

    setCustomTheme(newTheme);
    onThemeChange("custom", newTheme);
  };

  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: "var(--color-foreground)" }}
      >
        Theme *
      </label>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Choose a preset theme or create a custom one
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
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
              <div
                className="text-xs"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Custom Theme
            </span>
            <button
              type="button"
              onClick={() => setShowWizard(!showWizard)}
              className="px-3 py-1 text-xs rounded-lg transition-colors"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-background)";
              }}
            >
              {showWizard ? "Hide" : "Show"} Wizard
            </button>
          </div>

          {showWizard && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{
                background: "var(--color-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-foreground)" }}
                >
                  Customize Colors
                </span>
                <button
                  type="button"
                  onClick={randomizeColors}
                  className="px-2 py-1 text-xs rounded-lg transition-colors"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-background)",
                    borderRadius: "calc(var(--radius) - 2px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-primary)";
                  }}
                >
                  🎲 Randomize
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(customTheme).map(([key, value]) => {
                  const fieldKey = key as keyof ThemeCustom;
                  const isColorField = COLOR_FIELDS.includes(fieldKey);

                  return (
                    <div key={key}>
                      <label
                        className="block text-xs font-medium mb-1 capitalize"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      {isColorField ? (
                        <input
                          type="color"
                          value={oklchToHex(value)}
                          onChange={(e) =>
                            handleColorChange(fieldKey, e.target.value)
                          }
                          className="w-full h-8 rounded cursor-pointer"
                          style={{
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            borderRadius: "calc(var(--radius) - 2px)",
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            handleCustomThemeChange(fieldKey, e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-xs rounded"
                          style={{
                            background: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-foreground)",
                            borderRadius: "calc(var(--radius) - 2px)",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.outline =
                              "2px solid var(--color-primary)";
                            e.currentTarget.style.outlineOffset = "2px";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.outline = "none";
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  onThemeChange("custom", customTheme);
                }}
                className="w-full px-4 py-2 text-sm rounded-lg font-medium transition-colors"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-background)",
                  borderRadius: "calc(var(--radius) - 2px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-primary)";
                }}
              >
                Apply Custom Theme
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
