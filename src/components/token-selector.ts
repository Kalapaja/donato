import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { OneInchToken } from '../services/OneInchService.ts';
import type { Chain } from '../services/ChainService.ts';

// Import child components
import './token-list.ts';

@customElement('token-selector')
export class TokenSelector extends LitElement {
  @property({ type: Array })
  accessor tokens: OneInchToken[] = [];

  @property({ type: Object })
  accessor selectedToken: OneInchToken | null = null;

  @property({ type: Array })
  accessor chains: Chain[] = [];

  @property({ type: Boolean })
  accessor isLoading: boolean = false;

  @property({ type: String })
  accessor error: string | undefined;

  @property({ type: Number })
  accessor currentChainId: number | null = null;

  @state()
  private accessor isOpen: boolean = false;

  static override styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
    }

    .selector-button {
      width: 100%;
      padding: 0.75rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      font-size: 1rem;
      color: var(--color-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .selector-button:hover {
      border-color: var(--color-foreground);
    }

    .selector-button:focus {
      outline: none;
      border-color: var(--color-foreground);
    }

    .selector-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .token-logo {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
      background: var(--color-muted);
    }

    .token-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex: 1;
    }

    .token-symbol {
      font-weight: 600;
      color: var(--color-foreground);
    }

    .token-chain {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
    }

    .chevron {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--color-muted-foreground);
      transition: transform 0.2s;
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .placeholder {
      color: var(--color-muted-foreground);
    }

    .loading-text {
      color: var(--color-muted-foreground);
    }

    .error-text {
      color: oklch(63% 0.24 27);
      font-size: 0.875rem;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: -1rem;
      right: -1rem;
      z-index: 999;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      box-shadow: 0 10px 15px -3px oklch(0% 0 0 / 0.1);
      max-height: 400px;
      overflow: hidden;
      box-sizing: border-box;
    }

    :host(.dark) .dropdown {
      box-shadow: 0 10px 15px -3px oklch(0% 0 0 / 0.3);
    }

    @media (max-width: 640px) {
      .dropdown {
        max-height: 300px;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    // Add click outside listener
    document.addEventListener('click', this.handleClickOutside);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (!this.contains(event.target as Node)) {
      this.isOpen = false;
    }
  };

  private toggleDropdown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.isLoading && !this.error) {
      this.isOpen = !this.isOpen;
    }
  }

  private handleDropdownClick(event: MouseEvent) {
    // Prevent clicks inside the dropdown from closing it
    event.stopPropagation();
  }

  private handleTokenSelect(event: CustomEvent<OneInchToken>) {
    this.selectedToken = event.detail;
    this.isOpen = false;

    // Emit token-selected event
    this.dispatchEvent(new CustomEvent('token-selected', {
      detail: event.detail,
      bubbles: true,
      composed: true,
    }));
  }

  private getChainName(chainId: number): string {
    const chain = this.chains.find(c => c.id === chainId);
    if (chain?.name) {
      return chain.name;
    }
    
    // Known chain names as fallback
    const knownChains: Record<number, string> = {
      1: 'Ethereum',
      42161: 'Arbitrum',
      137: 'Polygon',
      56: 'BNB Chain',
      10: 'Optimism',
      8453: 'Base',
      43114: 'Avalanche',
      250: 'Fantom',
    };
    
    return knownChains[chainId] || `Network ${chainId}`;
  }

  private get filteredTokens(): OneInchToken[] {
    // If no chain is selected, show all tokens
    if (this.currentChainId === null) {
      return this.tokens;
    }
    
    // Filter tokens by current chain
    return this.tokens.filter(token => token.chainId === this.currentChainId);
  }

  override render() {
    return html`
      <button
        class="selector-button"
        @click=${this.toggleDropdown}
        ?disabled=${this.isLoading}
        aria-label="Select token"
        aria-expanded=${this.isOpen}
        aria-haspopup="listbox"
      >
        ${this.isLoading ? html`
          <span class="loading-text">Loading tokens...</span>
        ` : this.error ? html`
          <span class="error-text">${this.error}</span>
        ` : this.selectedToken ? html`
          <div class="button-content">
            ${this.selectedToken.logoURI ? html`
              <img
                class="token-logo"
                src=${this.selectedToken.logoURI}
                alt=${this.selectedToken.symbol}
                @error=${(e: Event) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            ` : html`
              <div class="token-logo"></div>
            `}
            <div class="token-info">
              <span class="token-symbol">${this.selectedToken.symbol}</span>
              <span class="token-chain">${this.getChainName(this.selectedToken.chainId)}</span>
            </div>
          </div>
        ` : html`
          <span class="placeholder">Select a token</span>
        `}
        
        <svg
          class="chevron ${this.isOpen ? 'open' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      ${this.isOpen ? html`
        <div class="dropdown" role="listbox" @click=${this.handleDropdownClick}>
          <token-list
            .tokens=${this.filteredTokens}
            .chains=${this.chains}
            .selectedToken=${this.selectedToken}
            @token-selected=${this.handleTokenSelect}
          ></token-list>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'token-selector': TokenSelector;
  }
}
