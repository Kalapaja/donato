'use client';

interface LiFiSectionProps {
  lifiApiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function LiFiSection({ lifiApiKey, onApiKeyChange }: LiFiSectionProps) {
  return (
    <div>
      <label 
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--color-foreground)' }}
      >
        LiFi API Key
      </label>
      <p 
        className="text-sm mb-4"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        Optional: Get a free API key for higher rate limits and better performance
      </p>

      <div className="space-y-3">
        <input
          type="text"
          value={lifiApiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Enter your LiFi API key (optional)"
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-foreground)',
            borderRadius: 'calc(var(--radius) - 2px)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--color-primary)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        />

        <a
          href="https://li.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: 'var(--color-primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          Get your free API key at LiFi
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
