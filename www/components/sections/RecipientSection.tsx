'use client';

import { useState } from 'react';

interface RecipientSectionProps {
  recipient: string;
  onRecipientChange: (recipient: string) => void;
}

export function RecipientSection({ recipient, onRecipientChange }: RecipientSectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onRecipientChange(value);
    setError(null);

    if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
      setError('Invalid Ethereum address format');
    }
  };

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts && accounts.length > 0) {
          onRecipientChange(accounts[0]);
        } else {
          setError('No account found. Please connect your wallet.');
        }
      } else {
        setError('No wallet extension found. Please install MetaMask or another Web3 wallet.');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect wallet. Please try again or enter address manually.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const isValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient);

  return (
    <div>
      <label 
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--color-foreground)' }}
      >
        Recipient Address *
      </label>
      <p 
        className="text-sm mb-4"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        Enter the Ethereum address that will receive donations
      </p>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={recipient}
            onChange={handleInputChange}
            placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm"
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
          <button
            onClick={handleWalletConnect}
            disabled={isConnecting || isValid}
            className="px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-opacity"
            style={{
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-foreground)',
              borderRadius: 'calc(var(--radius) - 2px)',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'var(--color-muted)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-background)';
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>

        {error && (
          <p 
            className="text-sm"
            style={{ color: 'oklch(63% 0.24 27)' }}
          >
            {error}
          </p>
        )}
        {isValid && !error && (
          <p 
            className="text-sm"
            style={{ color: 'oklch(50% 0.2 150)' }}
          >
            ✓ Valid address
          </p>
        )}
      </div>
    </div>
  );
}
