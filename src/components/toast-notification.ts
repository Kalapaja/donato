import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Toast, ToastType } from '../services/ToastService';

@customElement('toast-notification')
export class ToastNotification extends LitElement {
  @property({ type: Object })
  accessor toast!: Toast;

  @state()
  private accessor isVisible: boolean = false;

  @state()
  private accessor isExiting: boolean = false;

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 2px);
      box-shadow: 0 1px 3px 0 oklch(0% 0 0 / 0.1), 0 1px 2px -1px oklch(0% 0 0 / 0.1);
      min-width: 300px;
      max-width: 400px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast.visible {
      opacity: 1;
      transform: translateX(0);
    }

    .toast.exiting {
      opacity: 0;
      transform: translateX(100%);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .toast.success {
      border-left: 4px solid oklch(70% 0.18 145);
    }

    .toast.success .toast-icon {
      background: oklch(70% 0.18 145);
      color: oklch(100% 0 0);
    }

    .toast.error {
      border-left: 4px solid oklch(63% 0.24 27);
    }

    .toast.error .toast-icon {
      background: oklch(63% 0.24 27);
      color: oklch(100% 0 0);
    }

    .toast.info {
      border-left: 4px solid var(--color-foreground);
    }

    .toast.info .toast-icon {
      background: var(--color-foreground);
      color: var(--color-background);
    }

    .toast.warning {
      border-left: 4px solid oklch(73% 0.17 70);
    }

    .toast.warning .toast-icon {
      background: oklch(73% 0.17 70);
      color: oklch(100% 0 0);
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .toast-message {
      font-size: 0.875rem;
      color: var(--color-foreground);
      line-height: 1.5;
      word-wrap: break-word;
    }

    .toast-close {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: calc(var(--radius) - 4px);
      color: var(--color-muted-foreground);
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
      padding: 0;
      font-size: 1.25rem;
      line-height: 1;
    }

    .toast-close:hover {
      background: var(--color-muted);
      color: var(--color-foreground);
    }

    .toast-close:focus-visible {
      outline: 2px solid var(--color-foreground);
      outline-offset: 2px;
    }

    @media (max-width: 640px) {
      .toast {
        min-width: 280px;
        max-width: calc(100vw - 2rem);
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      this.isVisible = true;
    });
  }

  private handleClose() {
    this.isExiting = true;
    
    // Wait for exit animation to complete
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('toast-close', {
        detail: { id: this.toast.id },
        bubbles: true,
        composed: true,
      }));
    }, 300);
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }

  private getAriaLabel(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Success notification';
      case 'error':
        return 'Error notification';
      case 'warning':
        return 'Warning notification';
      case 'info':
        return 'Information notification';
      default:
        return 'Notification';
    }
  }

  override render() {
    const classes = [
      'toast',
      this.toast.type,
      this.isVisible && !this.isExiting ? 'visible' : '',
      this.isExiting ? 'exiting' : '',
    ].filter(Boolean).join(' ');

    return html`
      <div
        class=${classes}
        role="alert"
        aria-live=${this.toast.type === 'error' ? 'assertive' : 'polite'}
        aria-label=${this.getAriaLabel(this.toast.type)}
      >
        <div class="toast-icon" aria-hidden="true">
          ${this.getIcon(this.toast.type)}
        </div>
        <div class="toast-content">
          <div class="toast-message">${this.toast.message}</div>
        </div>
        <button
          class="toast-close"
          @click=${this.handleClose}
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toast-notification': ToastNotification;
  }
}
