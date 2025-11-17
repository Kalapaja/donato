import { ImageResponse } from "next/og";
import { siteConfig } from "../lib/site-config";

// Required for static export
export const dynamic = "force-static";

// Image metadata
export const alt = siteConfig.title;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom, #000000, #1a1a1a)",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Main title */}
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: "bold",
            color: "#ffffff",
            marginBottom: "24px",
            textAlign: "center",
            lineHeight: "1.1",
          }}
        >
          Donation Widget
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            color: "#a0a0a0",
            marginBottom: "48px",
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          Configuration Wizard
        </div>

        {/* Description */}
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#888888",
            textAlign: "center",
            maxWidth: "1000px",
            lineHeight: "1.5",
          }}
        >
          Create a customizable cryptocurrency donation widget for your website
        </div>

        {/* Features list */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "40px",
            marginTop: "60px",
            fontSize: "20px",
            color: "#666666",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Multiple Chains</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Easy Integration</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Customizable</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

