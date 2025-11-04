import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { Toast, ToastService } from "../services/ToastService.ts";
import "./toast-notification.ts";

@customElement("toast-container")
export class ToastContainer extends LitElement {
  @state()
  private accessor toasts: Toast[] = [];

  private toastService!: ToastService;
  private unsubscribe?: () => void;

  static override styles = css`
    :host {
      display: block;
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      pointer-events: none;
    }

    .toast-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: auto;
    }

    @media (max-width: 640px) {
      :host {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
      }

      .toast-list {
        align-items: stretch;
      }
    }
  `;

  setToastService(service: ToastService) {
    this.toastService = service;

    // Subscribe to toast changes
    this.unsubscribe = this.toastService.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    // Unsubscribe from toast service
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private handleToastClose(event: CustomEvent<{ id: string }>) {
    this.toastService.dismiss(event.detail.id);
  }

  override render() {
    return html`
      <div class="toast-list" role="region" aria-label="Notifications">
        ${repeat(
          this.toasts,
          (toast) => toast.id,
          (toast) =>
            html`
              <toast-notification
                .toast="${toast}"
                @toast-close="${this.handleToastClose}"
              ></toast-notification>
            `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "toast-container": ToastContainer;
  }
}
