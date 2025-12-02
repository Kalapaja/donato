"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "donato-widget-config";

function getInitialValue<T extends object>(defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<T>;
      // Merge with defaults to handle new fields
      return { ...defaultValue, ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load config from localStorage:", error);
  }

  return defaultValue;
}

export function useLocalStorageConfig<T extends object>(
  defaultValue: T
): [T, (updates: Partial<T>) => void] {
  const [config, setConfig] = useState<T>(() => getInitialValue(defaultValue));

  // Save to localStorage on config change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to save config to localStorage:", error);
    }
  }, [config]);

  const updateConfig = useCallback((updates: Partial<T>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return [config, updateConfig];
}
