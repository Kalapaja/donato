/**
 * i18n translations index
 * Exports all available translations
 */

import { en } from "./en.ts";
import { ru } from "./ru.ts";
import type { Locale, Translations } from "../services/I18nService.ts";

export const translations: Record<Locale, Translations> = {
  en,
  ru,
};

export { en, ru };

