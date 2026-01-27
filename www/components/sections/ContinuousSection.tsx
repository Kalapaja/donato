"use client";

interface ContinuousSectionProps {
  enableContinuous: boolean;
  onEnableContinuousChange: (enabled: boolean) => void;
}

export function ContinuousSection({
  enableContinuous,
  onEnableContinuousChange,
}: ContinuousSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          className="block text-sm font-semibold mb-2"
          style={{ color: "var(--color-foreground)" }}
        >
          Continuous Payments
        </label>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Enable continuous payments — funds flow every second from user&apos;s
          deposit
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enableContinuous}
          onClick={() => onEnableContinuousChange(!enableContinuous)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          style={{
            background: enableContinuous
              ? "var(--color-primary)"
              : "var(--color-muted)",
            cursor: "pointer",
          }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full transition-transform"
            style={{
              background: "var(--color-background)",
              transform: enableContinuous
                ? "translateX(1.375rem)"
                : "translateX(0.25rem)",
            }}
          />
        </button>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          {enableContinuous ? "Enabled" : "Disabled"}
        </span>
      </div>

      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {enableContinuous
          ? "Users can choose between one-time and continuous payments"
          : "Users can only make one-time donations"}
      </p>

      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        Powered by{" "}
        <a
          href="https://papaya.finance"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-primary)", textDecoration: "underline" }}
        >
          Papaya Finance
        </a>
      </p>
    </div>
  );
}
