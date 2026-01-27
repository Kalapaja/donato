/**
 * Unit tests for i18n translations completeness
 *
 * Tests:
 * - All keys exist in both en.ts and ru.ts
 * - No extra keys in one language that don't exist in the other
 */

import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";

import { en } from "./en.ts";
import { ru } from "./ru.ts";

describe("i18n translations", () => {
  describe("Translation completeness", () => {
    it("should have the same number of keys in en and ru", () => {
      const enKeys = Object.keys(en);
      const ruKeys = Object.keys(ru);

      assertEquals(
        enKeys.length,
        ruKeys.length,
        `English has ${enKeys.length} keys, Russian has ${ruKeys.length} keys`
      );
    });

    it("should have all English keys present in Russian", () => {
      const enKeys = Object.keys(en);
      const ruKeys = new Set(Object.keys(ru));

      const missingInRussian: string[] = [];

      for (const key of enKeys) {
        if (!ruKeys.has(key)) {
          missingInRussian.push(key);
        }
      }

      assertEquals(
        missingInRussian.length,
        0,
        `Missing keys in Russian translation:\n  - ${missingInRussian.join("\n  - ")}`
      );
    });

    it("should have all Russian keys present in English", () => {
      const ruKeys = Object.keys(ru);
      const enKeys = new Set(Object.keys(en));

      const missingInEnglish: string[] = [];

      for (const key of ruKeys) {
        if (!enKeys.has(key)) {
          missingInEnglish.push(key);
        }
      }

      assertEquals(
        missingInEnglish.length,
        0,
        `Missing keys in English translation:\n  - ${missingInEnglish.join("\n  - ")}`
      );
    });
  });

  describe("Translation values", () => {
    it("should not have empty values in English", () => {
      const emptyKeys: string[] = [];

      for (const [key, value] of Object.entries(en)) {
        if (!value || value.trim() === "") {
          emptyKeys.push(key);
        }
      }

      assertEquals(
        emptyKeys.length,
        0,
        `Empty values in English translation:\n  - ${emptyKeys.join("\n  - ")}`
      );
    });

    it("should not have empty values in Russian", () => {
      const emptyKeys: string[] = [];

      for (const [key, value] of Object.entries(ru)) {
        if (!value || value.trim() === "") {
          emptyKeys.push(key);
        }
      }

      assertEquals(
        emptyKeys.length,
        0,
        `Empty values in Russian translation:\n  - ${emptyKeys.join("\n  - ")}`
      );
    });
  });

  describe("UX improvements specific keys", () => {
    const uxImprovementKeys = [
      // Wallet security tooltip (Phase 2)
      "wallet.security.title",
      "wallet.security.viewOnly",
      "wallet.security.noAutoDebit",
      "wallet.security.confirmRequired",

      // Token empty state (Phase 4)
      "token.noTokensWithBalance",
      "token.noTokensWithBalanceHint",
      "token.supportedTokensIntro",
      "token.supportedNetworks",

      // Wallet connect subtext (Phase 3)
      "wallet.connectSubtext",

      // Amount tooltip (Phase 2)
      "amount.tooltip",
    ];

    it("should have all UX improvement keys in English", () => {
      const missingKeys: string[] = [];

      for (const key of uxImprovementKeys) {
        if (!(key in en)) {
          missingKeys.push(key);
        }
      }

      assertEquals(
        missingKeys.length,
        0,
        `Missing UX improvement keys in English:\n  - ${missingKeys.join("\n  - ")}`
      );
    });

    it("should have all UX improvement keys in Russian", () => {
      const missingKeys: string[] = [];

      for (const key of uxImprovementKeys) {
        if (!(key in ru)) {
          missingKeys.push(key);
        }
      }

      assertEquals(
        missingKeys.length,
        0,
        `Missing UX improvement keys in Russian:\n  - ${missingKeys.join("\n  - ")}`
      );
    });

    it("should have non-empty values for all UX improvement keys in English", () => {
      const emptyKeys: string[] = [];

      for (const key of uxImprovementKeys) {
        const value = en[key as keyof typeof en];
        if (!value || value.trim() === "") {
          emptyKeys.push(key);
        }
      }

      assertEquals(
        emptyKeys.length,
        0,
        `Empty UX improvement values in English:\n  - ${emptyKeys.join("\n  - ")}`
      );
    });

    it("should have non-empty values for all UX improvement keys in Russian", () => {
      const emptyKeys: string[] = [];

      for (const key of uxImprovementKeys) {
        const value = ru[key as keyof typeof ru];
        if (!value || value.trim() === "") {
          emptyKeys.push(key);
        }
      }

      assertEquals(
        emptyKeys.length,
        0,
        `Empty UX improvement values in Russian:\n  - ${emptyKeys.join("\n  - ")}`
      );
    });
  });

  describe("Parameter placeholders", () => {
    it("should have matching placeholders in English and Russian", () => {
      const placeholderPattern = /\{(\w+)\}/g;
      const mismatchedKeys: string[] = [];

      for (const key of Object.keys(en)) {
        const enValue = en[key as keyof typeof en];
        const ruValue = ru[key as keyof typeof ru];

        if (!ruValue) continue;

        const enPlaceholders = [...enValue.matchAll(placeholderPattern)]
          .map((m) => m[1])
          .sort();
        const ruPlaceholders = [...ruValue.matchAll(placeholderPattern)]
          .map((m) => m[1])
          .sort();

        if (JSON.stringify(enPlaceholders) !== JSON.stringify(ruPlaceholders)) {
          mismatchedKeys.push(
            `${key}: EN has {${enPlaceholders.join(", ")}}, RU has {${ruPlaceholders.join(", ")}}`
          );
        }
      }

      assertEquals(
        mismatchedKeys.length,
        0,
        `Mismatched placeholders:\n  - ${mismatchedKeys.join("\n  - ")}`
      );
    });
  });
});
