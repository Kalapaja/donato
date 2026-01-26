import type { TranslationKey } from "./I18nService.ts";

/**
 * Type for error-specific translation keys (all keys starting with "error.")
 */
export type ErrorKey = Extract<TranslationKey, `error.${string}`>;

/**
 * Custom error class for internationalized error messages.
 *
 * Use this class instead of Error when throwing errors that should be
 * displayed to users with translated messages. Components can detect
 * this error type via `instanceof I18nError` and translate the message
 * using the i18nKey property.
 *
 * @example
 * // Throwing an I18nError without parameters
 * throw new I18nError("error.networkConnection");
 *
 * // Throwing an I18nError with parameters
 * throw new I18nError("error.networkSwitchFailed", { network: "Polygon" });
 *
 * // Handling in components
 * if (error instanceof I18nError) {
 *   displayError(t(error.i18nKey, error.params));
 * } else {
 *   displayError(error.message);
 * }
 */
export class I18nError extends Error {
  public readonly i18nKey: ErrorKey;
  public readonly params?: Record<string, string | number>;

  constructor(key: ErrorKey, paramsOrError?: Record<string, string | number> | Error, originalError?: Error) {
    super(key);
    this.name = "I18nError";
    this.i18nKey = key;

    // Handle both old signature (key, Error) and new signature (key, params, Error)
    if (paramsOrError instanceof Error) {
      this.cause = paramsOrError;
    } else if (paramsOrError) {
      this.params = paramsOrError;
      if (originalError) {
        this.cause = originalError;
      }
    }
  }
}
