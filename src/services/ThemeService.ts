export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'auto' | 'custom';

type ThemeChangeCallback = (theme: Theme) => void;

export class ThemeService {
  private currentTheme: Theme = 'light';
  private themeMode: ThemeMode = 'auto';
  private callbacks: Set<ThemeChangeCallback> = new Set();
  private mediaQuery: MediaQueryList | null = null;
  private readonly STORAGE_KEY = 'donation-widget-theme';

  /**
   * Initialize theme service
   */
  init(mode: ThemeMode = 'auto'): void {
    this.themeMode = mode;

    // Set up media query listener for system theme changes
    if (typeof globalThis !== 'undefined' && globalThis.matchMedia) {
      this.mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }

    // Load theme from localStorage or detect from system
    this.loadTheme();
  }

  /**
   * Load theme from localStorage or system preference
   */
  private loadTheme(): void {
    if (this.themeMode === 'auto') {
      // Check localStorage first
      const stored = this.getStoredTheme();
      if (stored) {
        this.currentTheme = stored;
      } else {
        // Detect from system
        this.currentTheme = this.detectSystemTheme();
      }
    } else if (this.themeMode === 'custom') {
      // For custom mode, don't apply any theme - let CSS variables from parent handle it
      // Default to light for the currentTheme value
      this.currentTheme = 'light';
      return;
    } else {
      // Use explicit theme mode
      this.currentTheme = this.themeMode;
    }
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): Theme | null {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return null;
    }

    try {
      const stored = globalThis.localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }

    return null;
  }

  /**
   * Store theme to localStorage
   */
  private storeTheme(theme: Theme): void {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    try {
      globalThis.localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to store theme to localStorage:', error);
    }
  }

  /**
   * Detect system theme preference
   */
  private detectSystemTheme(): Theme {
    if (typeof globalThis === 'undefined' || !globalThis.matchMedia) {
      return 'light';
    }

    const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  /**
   * Handle system theme change
   */
  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    if (this.themeMode === 'auto') {
      const newTheme = event.matches ? 'dark' : 'light';
      this.currentTheme = newTheme;
      this.notifyCallbacks(newTheme);
    }
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get theme mode
   */
  getThemeMode(): ThemeMode {
    return this.themeMode;
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    // Don't allow theme changes in custom mode
    if (this.themeMode === 'custom') {
      return;
    }

    if (theme === this.currentTheme) {
      return;
    }

    this.currentTheme = theme;
    this.themeMode = theme; // Switch to explicit mode
    this.storeTheme(theme);
    this.notifyCallbacks(theme);
  }

  /**
   * Set theme mode (auto, light, dark, or custom)
   */
  setThemeMode(mode: ThemeMode): void {
    this.themeMode = mode;

    if (mode === 'auto') {
      const systemTheme = this.detectSystemTheme();
      if (systemTheme !== this.currentTheme) {
        this.currentTheme = systemTheme;
        this.notifyCallbacks(systemTheme);
      }
    } else if (mode === 'custom') {
      // For custom mode, don't apply any theme - let CSS variables from parent handle it
      this.currentTheme = 'light';
    } else {
      // mode is 'light' or 'dark'
      this.setTheme(mode);
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }


  /**
   * Subscribe to theme changes
   */
  onThemeChanged(callback: ThemeChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all callbacks of theme change
   */
  private notifyCallbacks(theme: Theme): void {
    this.callbacks.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange.bind(this));
      this.mediaQuery = null;
    }
    this.callbacks.clear();
  }

  /**
   * Get theme class name for components
   */
  getThemeClassName(): string {
    return this.currentTheme;
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLight(): boolean {
    return this.currentTheme === 'light';
  }

  /**
   * Check if theme toggle is allowed (not in custom mode)
   */
  canToggleTheme(): boolean {
    return this.themeMode !== 'custom';
  }
}
