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
 * // Throwing an I18nError
 * throw new I18nError("error.networkConnection");
 *
 * // Handling in components
 * if (error instanceof I18nError) {
 *   displayError(t(error.i18nKey));
 * } else {
 *   displayError(error.message);
 * }
 */
export class I18nError extends Error {
  public readonly i18nKey: ErrorKey;

  constructor(key: ErrorKey, originalError?: Error) {
    super(key);
    this.name = "I18nError";
    this.i18nKey = key;
    if (originalError) {
      this.cause = originalError;
    }
  }
}
