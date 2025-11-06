"use client";

import { useState } from "react";

interface RecipientSectionProps {
  recipient: string;
  onRecipientChange: (recipient: string) => void;
}

export function RecipientSection(
  { recipient, onRecipientChange }: RecipientSectionProps,
) {
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onRecipientChange(value);
    setError(null);

    if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
      setError("Invalid Ethereum address format");
    }
  };

  const isValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient);

  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: "var(--color-foreground)" }}
      >
        Recipient Address
      </label>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Enter an address that will receive donations
      </p>

      <div className="space-y-2">
        <input
          type="text"
          value={recipient}
          onChange={handleInputChange}
          placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: "var(--color-background)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            borderRadius: "calc(var(--radius) - 2px)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = "2px solid var(--color-primary)";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = "none";
          }}
        />

        {error && (
          <p
            className="text-sm"
            style={{ color: "oklch(63% 0.24 27)" }}
          >
            {error}
          </p>
        )}
        {isValid && !error && (
          <p
            className="text-sm"
            style={{ color: "oklch(50% 0.2 150)" }}
          >
            ✓ Valid address
          </p>
        )}
      </div>
    </div>
  );
}
