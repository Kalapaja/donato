import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Token, Chain } from "../services/ChainService.ts";
import { getChainNameFromList } from "../services/ChainService.ts";

// Import child component
import "./token-item.ts";

interface TokenGroup {
  chain: Chain;
  tokens: Token[];
}

@customElement("token-list")
export class TokenList extends LitElement {
  @property({ type: Array })
  accessor tokens: Token[] = [];

  @property({ type: Array })
  accessor chains: Chain[] = [];

  @property({ type: Object })
  accessor selectedToken: Token | null = null;

  @state()
  private accessor searchQuery: string = "";

  @state()
  private accessor filteredTokens: Token[] = [];

  @state()
  private accessor focusedIndex: number = -1;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .search-container {
      padding: 0.75rem;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-background);
      z-index: 10;
      box-sizing: border-box;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
      font-size: 0.875rem;
      color: var(--color-foreground);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-foreground);
    }

    .search-input::placeholder {
      color: var(--color-muted-foreground);
    }

    .token-groups {
      max-height: 320px;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .token-group {
      border-bottom: 1px solid var(--color-border);
    }

    .token-group:last-child {
      border-bottom: none;
    }

    .group-header {
      padding: 0.5rem 0.75rem;
      background: var(--color-muted);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      position: sticky;
      top: 0;
      z-index: 5;
      box-sizing: border-box;
      width: 100%;
    }

    .group-tokens {
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--color-muted-foreground);
      font-size: 0.875rem;
    }

    .empty-icon {
      width: 3rem;
      height: 3rem;
      margin: 0 auto 0.5rem;
      color: var(--color-muted-foreground);
      opacity: 0.5;
    }

    /* Custom scrollbar */
    .token-groups::-webkit-scrollbar {
      width: 8px;
    }

    .token-groups::-webkit-scrollbar-track {
      background: var(--color-muted);
    }

    .token-groups::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: calc(var(--radius) - 4px);
    }

    .token-groups::-webkit-scrollbar-thumb:hover {
      background: var(--color-muted-foreground);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.filterTokens();
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (
      changedProperties.has("tokens") || changedProperties.has("searchQuery")
    ) {
      this.filterTokens();
    }
  }

  private filterTokens() {
    if (!this.searchQuery || this.searchQuery.trim() === "") {
      this.filteredTokens = this.tokens;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();

    this.filteredTokens = this.tokens.filter((token) => {
      const symbolMatch = token.symbol.toLowerCase().includes(query);
      const nameMatch = token.name.toLowerCase().includes(query);
      const addressMatch = token.address.toLowerCase().includes(query);

      return symbolMatch || nameMatch || addressMatch;
    });
  }

  private handleSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.focusedIndex = -1; // Reset focus when search changes
  }

  private handleTokenSelect(event: CustomEvent<Token>) {
    // Emit token-selected event
    this.dispatchEvent(
      new CustomEvent("token-selected", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    const tokenCount = this.filteredTokens.length;

    if (tokenCount === 0) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, tokenCount - 1);
        this.scrollToFocusedItem();
        break;

      case "ArrowUp":
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.scrollToFocusedItem();
        break;

      case "Enter":
        event.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < tokenCount) {
          const token = this.filteredTokens[this.focusedIndex];
          this.dispatchEvent(
            new CustomEvent("token-selected", {
              detail: token,
              bubbles: true,
              composed: true,
            }),
          );
        }
        break;

      case "Escape":
        event.preventDefault();
        this.searchQuery = "";
        this.focusedIndex = -1;
        break;
    }
  }

  private scrollToFocusedItem() {
    // Request update and then scroll
    this.requestUpdate();
    this.updateComplete.then(() => {
      const tokenGroups = this.shadowRoot?.querySelector(".token-groups");
      const focusedItem = this.shadowRoot?.querySelector(
        `token-item[data-index="${this.focusedIndex}"]`,
      );

      if (tokenGroups && focusedItem) {
        const itemRect = focusedItem.getBoundingClientRect();
        const containerRect = tokenGroups.getBoundingClientRect();

        if (itemRect.bottom > containerRect.bottom) {
          focusedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else if (itemRect.top < containerRect.top) {
          focusedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    });
  }

  private getChainName(chainId: number): string {
    return getChainNameFromList(chainId, this.chains);
  }

  private groupTokensByChain(): TokenGroup[] {
    const grouped = new Map<number, Token[]>();

    // Group tokens by chain
    for (const token of this.filteredTokens) {
      const chainTokens = grouped.get(token.chainId) || [];
      chainTokens.push(token);
      grouped.set(token.chainId, chainTokens);
    }

    // Convert to array and sort by chain order
    const groups: TokenGroup[] = [];
    const chainOrder = [1, 42161, 137, 56, 10, 8453]; // Ethereum, Arbitrum, Polygon, BSC, Optimism, Base

    for (const chainId of chainOrder) {
      const tokens = grouped.get(chainId);
      if (tokens && tokens.length > 0) {
        const chain = this.chains.find((c) => c.id === chainId);
        if (chain) {
          groups.push({ chain, tokens });
        } else {
          // Fallback if chain not found
          const chainName = this.getChainName(chainId);
          groups.push({
            chain: {
              id: chainId,
              name: chainName,
              key: `${chainName.toLowerCase().replace(/\s+/g, "-")}`,
              chainType: "EVM",
              nativeToken: {
                address: "0x0000000000000000000000000000000000000000",
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
              },
            },
            tokens,
          });
        }
      }
    }

    // Add any remaining chains not in the predefined order
    for (const [chainId, tokens] of grouped.entries()) {
      if (!chainOrder.includes(chainId)) {
        const chain = this.chains.find((c) => c.id === chainId);
        if (chain) {
          groups.push({ chain, tokens });
        }
      }
    }

    return groups;
  }

  override render() {
    const tokenGroups = this.groupTokensByChain();
    let tokenIndex = 0;

    return html`
      <div class="search-container">
        <input
          class="search-input"
          type="text"
          placeholder="Search tokens..."
          .value="${this.searchQuery}"
          @input="${this.handleSearchInput}"
          @keydown="${this.handleKeyDown}"
          aria-label="Search tokens"
          autofocus
        />
      </div>

      ${this.filteredTokens.length === 0
        ? html`
          <div class="empty-state">
            <svg
              class="empty-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <div>No tokens found</div>
            ${this.searchQuery
              ? html`
                <div style="margin-top: 0.25rem; font-size: 0.75rem;">
                  Try a different search term
                </div>
              `
              : ""}
          </div>
        `
        : html`
          <div class="token-groups" role="listbox">
            ${tokenGroups.map((group) =>
              html`
                <div class="token-group">
                  <div class="group-header">
                    ${group.chain.name}
                  </div>
                  <div class="group-tokens">
                    ${group.tokens.map((token) => {
                      const currentIndex = tokenIndex++;
                      const isSelected =
                        this.selectedToken?.address === token.address &&
                        this.selectedToken?.chainId === token.chainId;
                      const isFocused = currentIndex === this.focusedIndex;

                      return html`
                        <token-item
                          .token="${token}"
                          .chain="${group.chain}"
                          .isSelected="${isSelected}"
                          .isFocused="${isFocused}"
                          data-index="${currentIndex}"
                          @token-clicked="${this.handleTokenSelect}"
                        ></token-item>
                      `;
                    })}
                  </div>
                </div>
              `
            )}
          </div>
        `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "token-list": TokenList;
  }
}
