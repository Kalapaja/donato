import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

/**
 * InfoTooltip - Reusable info icon with expandable content
 *
 * @element info-tooltip
 *
 * @attr {string} title - Title for the tooltip content
 * @attr {"hover" | "click"} trigger - How to show content (default: "click")
 * @attr {"top" | "bottom"} position - Position of popup (default: "bottom")
 *
 * @slot - Content to display in the tooltip
 *
 * @example
 * ```html
 * <info-tooltip title="Is it safe?">
 *   <ul>
 *     <li>Connection only shows your balance</li>
 *     <li>No automatic withdrawals</li>
 *   </ul>
 * </info-tooltip>
 * ```
 */
@customElement("info-tooltip")
export class InfoTooltip extends LitElement {
  @property({ type: String })
  accessor title: string = "";

  @property({ type: String })
  accessor trigger: "hover" | "click" = "click";

  @property({ type: String })
  accessor position: "top" | "bottom" = "bottom";

  @state()
  private accessor isOpen: boolean = false;

  static override styles = css`
    :host {
      display: inline-flex;
      position: relative;
    }

    .info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background: var(--color-muted);
      color: var(--color-muted-foreground);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid var(--color-border);
      transition: all 0.2s ease;
    }

    .info-icon:hover {
      background: var(--color-secondary);
      color: var(--color-foreground);
      border-color: var(--color-accent);
    }

    .info-icon:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .tooltip-content {
      position: absolute;
      z-index: 100;
      min-width: 200px;
      max-width: 280px;
      padding: 0.75rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
      box-shadow: 0 4px 12px oklch(0% 0 0 / 0.15);
      font-size: 0.8125rem;
      line-height: 1.5;
      color: var(--color-foreground);
    }

    .tooltip-content.bottom {
      top: calc(100% + 0.5rem);
      left: 50%;
      transform: translateX(-50%);
    }

    .tooltip-content.top {
      bottom: calc(100% + 0.5rem);
      left: 50%;
      transform: translateX(-50%);
    }

    .tooltip-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--color-foreground);
    }

    .tooltip-close {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-muted-foreground);
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .tooltip-close:hover {
      background: var(--color-muted);
      color: var(--color-foreground);
    }

    .tooltip-close:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    [hidden] {
      display: none !important;
    }

    /* Slotted content styles */
    ::slotted(ul) {
      margin: 0;
      padding-left: 1rem;
    }

    ::slotted(li) {
      margin-bottom: 0.25rem;
    }

    ::slotted(li:last-child) {
      margin-bottom: 0;
    }
  `;

  private handleToggle() {
    this.isOpen = !this.isOpen;
  }

  private handleClose() {
    this.isOpen = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.handleToggle();
    } else if (e.key === "Escape" && this.isOpen) {
      this.handleClose();
    }
  }

  override render() {
    return html`
      <button
        class="info-icon"
        @click=${this.handleToggle}
        @keydown=${this.handleKeyDown}
        aria-label="Show information"
        aria-expanded=${this.isOpen}
        aria-haspopup="true"
      >
        ?
      </button>
      <div
        class="tooltip-content ${this.position}"
        ?hidden=${!this.isOpen}
        role="tooltip"
      >
        ${this.title ? html`<div class="tooltip-title">${this.title}</div>` : ""}
        <slot></slot>
        <button
          class="tooltip-close"
          @click=${this.handleClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "info-tooltip": InfoTooltip;
  }
}
