import { ImageResponse } from "next/og";
import { siteConfig } from "../lib/site-config";

export const dynamic = "force-static";
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FEATURES = ["Multiple Chains", "Easy Integration", "Customizable"] as const;

function CheckIcon() {
  return (
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
  );
}

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
          {FEATURES.map((feature) => (
            <div
              key={feature}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <CheckIcon />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
