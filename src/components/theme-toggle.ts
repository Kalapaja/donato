import { css, html, LitElement, svg } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Theme } from "../services/ThemeService.ts";

@customElement("theme-toggle")
export class ThemeToggle extends LitElement {
  @property({ type: String })
  accessor theme: Theme = "light";

  static override styles = css`
    :host {
      display: inline-block;
    }

    .toggle-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      cursor: pointer;
      transition: background-color 0.2s, border-color 0.2s;
      color: var(--color-foreground);
    }

    .toggle-button:hover {
      background: var(--color-muted);
      border-color: var(--color-foreground);
    }

    .toggle-button:focus-visible {
      outline: 2px solid var(--color-foreground);
      outline-offset: 2px;
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
      fill: currentColor;
    }

    .icon-sun {
      animation: rotate 20s linear infinite;
    }

    .icon-moon {
      animation: float 3s ease-in-out infinite;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-2px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toggle-button {
        transition: none;
      }

      .icon-sun,
      .icon-moon {
        animation: none;
      }
    }
  `;

  private handleToggle() {
    const newTheme: Theme = this.theme === "light" ? "dark" : "light";

    this.dispatchEvent(
      new CustomEvent("theme-changed", {
        detail: newTheme,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderSunIcon() {
    return svg`
      <svg
        class="icon icon-sun"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
    `;
  }

  private renderMoonIcon() {
    return svg`
      <svg
        class="icon icon-moon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    `;
  }

  override render() {
    const isDark = this.theme === "dark";
    const ariaLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

    return html`
      <button
        class="toggle-button"
        @click="${this.handleToggle}"
        aria-label="${ariaLabel}"
        title="${ariaLabel}"
        type="button"
      >
        ${isDark ? this.renderSunIcon() : this.renderMoonIcon()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-toggle": ThemeToggle;
  }
}
