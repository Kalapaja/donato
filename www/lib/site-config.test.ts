/**
 * Unit tests for site configuration validation
 * 
 * Tests the validateSiteConfig function to ensure all validation
 * rules are working correctly.
 */

import { assertEquals, assertThrows } from "jsr:@std/assert@1.0.10";
import { describe, it } from "jsr:@std/testing@1.0.8/bdd";
import { validateSiteConfig } from "./site-config.ts";
import type { SiteMetadata } from "../types/metadata.ts";

describe("validateSiteConfig", () => {
  describe("URL format validation", () => {
    it("should accept valid http URL", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "http://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should accept valid https URL", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should accept URL with path", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com/path",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should reject relative URL", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "/relative/path",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site URL must be absolute"
      );
    });

    it("should reject empty URL", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site URL must be absolute"
      );
    });

    it("should reject URL without http/https", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site URL must be absolute"
      );
    });
  });

  describe("Required fields validation", () => {
    it("should reject empty title", () => {
      const config: SiteMetadata = {
        title: "",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site title is required"
      );
    });

    it("should reject whitespace-only title", () => {
      const config: SiteMetadata = {
        title: "   ",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site title is required"
      );
    });

    it("should accept valid title", () => {
      const config: SiteMetadata = {
        title: "Valid Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should reject empty description", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site description is required"
      );
    });

    it("should reject whitespace-only description", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "   ",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Site description is required"
      );
    });

    it("should accept valid description", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Valid Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });
  });

  describe("Image path format validation", () => {
    it("should accept path starting with /", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should accept path with subdirectory", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/images/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should reject path not starting with /", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "OpenGraph image path must be relative to public/ directory"
      );
    });

    it("should reject empty image path", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "OpenGraph image path must be relative to public/ directory"
      );
    });

    it("should reject absolute URL for image path", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "https://example.com/image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "OpenGraph image path must be relative to public/ directory"
      );
    });
  });

  describe("Theme color format validation", () => {
    it("should accept valid hex color", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should accept valid hex color with uppercase", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#FFFFFF",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should accept valid hex color with mixed case", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#aBcDeF",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should reject invalid hex color format", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "000000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Theme color must be a valid hex color code"
      );
    });

    it("should reject hex color with wrong length", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#00000",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Theme color must be a valid hex color code"
      );
    });

    it("should reject empty theme color", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "",
        locale: "en_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Theme color must be a valid hex color code"
      );
    });
  });

  describe("Locale format validation", () => {
    it("should accept valid locale format", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should accept different valid locale", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "ru_RU",
      };

      // Should not throw
      validateSiteConfig(config);
    });

    it("should reject locale without underscore", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "enUS",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Locale must be in format 'll_CC'"
      );
    });

    it("should reject locale with lowercase country code", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "en_us",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Locale must be in format 'll_CC'"
      );
    });

    it("should reject locale with uppercase language code", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "EN_US",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Locale must be in format 'll_CC'"
      );
    });

    it("should reject empty locale", () => {
      const config: SiteMetadata = {
        title: "Test Title",
        description: "Test Description",
        url: "https://example.com",
        ogImage: "/og-image.png",
        themeColor: "#000000",
        locale: "",
      };

      assertThrows(
        () => validateSiteConfig(config),
        Error,
        "Locale must be in format 'll_CC'"
      );
    });
  });

  describe("Complete valid configuration", () => {
    it("should accept complete valid configuration", () => {
      const config: SiteMetadata = {
        title: "Donation Widget - Configuration Wizard",
        description: "Create a customizable cryptocurrency donation widget",
        url: "https://donation-widget.example.com",
        ogImage: "/opengraph-image",
        twitterHandle: "@donationwidget",
        themeColor: "#000000",
        locale: "en_US",
      };

      // Should not throw
      validateSiteConfig(config);
    });
  });
});

