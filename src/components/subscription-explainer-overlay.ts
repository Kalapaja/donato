import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { t } from "../services/index.ts";
import type { TranslationKey } from "../services/I18nService.ts";

/**
 * Subscription step types matching the handleSubscription flow
 */
export type SubscriptionStep =
  | "idle"        // Waiting to start
  | "switching"   // Switching to Polygon
  | "signing"     // Signing EIP-712
  | "building"    // Building actions
  | "returning"   // Returning to original network
  | "quoting"     // Getting quote
  | "approving"   // Approving tokens
  | "subscribing" // Executing transaction
  | "confirming"; // Waiting for confirmation

/**
 * Step configuration for display
 */
interface StepConfig {
  key: SubscriptionStep;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const STEPS: StepConfig[] = [
  { key: "switching", titleKey: "subscription.step.switching", descKey: "subscription.step.switching.desc" },
  { key: "signing", titleKey: "subscription.step.signing", descKey: "subscription.step.signing.desc" },
  { key: "building", titleKey: "subscription.step.building", descKey: "subscription.step.building.desc" },
  { key: "returning", titleKey: "subscription.step.returning", descKey: "subscription.step.returning.desc" },
  { key: "quoting", titleKey: "subscription.step.quoting", descKey: "subscription.step.quoting.desc" },
  { key: "approving", titleKey: "subscription.step.approving", descKey: "subscription.step.approving.desc" },
  { key: "subscribing", titleKey: "subscription.step.subscribing", descKey: "subscription.step.subscribing.desc" },
  { key: "confirming", titleKey: "subscription.step.confirming", descKey: "subscription.step.confirming.desc" },
];

/**
 * Subscription Explainer Overlay Component
 *
 * Shows an animated overlay explaining the subscription process step by step.
 * Appears on hover over the donate button in monthly subscription mode.
 *
 * @element subscription-explainer-overlay
 *
 * @attr {boolean} visible - Whether the overlay is visible
 * @attr {SubscriptionStep} current-step - The current subscription step
 */
@customElement("subscription-explainer-overlay")
export class SubscriptionExplainerOverlay extends LitElement {
  @property({ type: Boolean, reflect: true })
  accessor visible: boolean = false;

  @property({ type: String, attribute: "current-step", reflect: true })
  accessor currentStep: SubscriptionStep = "idle";

  static override styles = css`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    }

    /* Hidden by default */
    :host(:not([visible])) {
      display: none;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: var(--color-background);
      border-radius: calc(var(--radius) * 1.5);
      opacity: 0;
      transform: scale(0.98);
      transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      overflow: hidden;
    }

    :host([visible]) .overlay {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    /* Respect reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      .overlay {
        transition: opacity 0.15s ease;
        transform: none;
      }

      :host([visible]) .overlay {
        transform: none;
      }

      .step.active .step-icon {
        animation: none;
      }
    }

    .overlay-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .overlay-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 0.5rem 0;
    }

    .overlay-description {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      margin: 0;
    }

    .steps-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--color-muted);
      border-radius: calc(var(--radius) - 4px);
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .step.pending {
      opacity: 0.5;
    }

    .step.active {
      background: oklch(from var(--color-accent) l c h / 0.1);
      border-color: var(--color-accent);
      opacity: 1;
    }

    .step.completed {
      opacity: 0.8;
    }

    .step-icon {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.75rem;
      transition: all 0.2s ease;
    }

    .step.pending .step-icon {
      background: var(--color-border);
      color: var(--color-muted-foreground);
    }

    .step.active .step-icon {
      background: var(--color-accent);
      color: var(--color-background);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .step.completed .step-icon {
      background: oklch(70% 0.2 145);
      color: white;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 oklch(from var(--color-accent) l c h / 0.4);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 8px oklch(from var(--color-accent) l c h / 0);
      }
    }

    .step-content {
      flex: 1;
      min-width: 0;
    }

    .step-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
      margin: 0 0 0.125rem 0;
    }

    .step.pending .step-title {
      color: var(--color-muted-foreground);
    }

    .step-desc {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin: 0;
      line-height: 1.4;
    }

    .checkmark {
      display: inline-block;
    }

    .spinner {
      display: inline-block;
      width: 0.75rem;
      height: 0.75rem;
      border: 2px solid oklch(from var(--color-background) l c h / 0.3);
      border-top-color: var(--color-background);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  /**
   * Get the step state (pending, active, completed) for a given step
   */
  private getStepState(stepKey: SubscriptionStep): "pending" | "active" | "completed" {
    if (this.currentStep === "idle") {
      return "pending";
    }

    const stepIndex = STEPS.findIndex(s => s.key === stepKey);
    const currentIndex = STEPS.findIndex(s => s.key === this.currentStep);

    if (stepIndex < currentIndex) {
      return "completed";
    } else if (stepIndex === currentIndex) {
      return "active";
    }
    return "pending";
  }

  /**
   * Render the step icon based on state
   */
  private renderStepIcon(state: "pending" | "active" | "completed", index: number) {
    if (state === "completed") {
      return html`<span class="checkmark">✓</span>`;
    }
    if (state === "active") {
      return html`<span class="spinner"></span>`;
    }
    return html`<span>${index + 1}</span>`;
  }

  override render() {
    return html`
      <div class="overlay">
        <div class="overlay-header">
          <h3 class="overlay-title">${t("subscription.overlay.title")}</h3>
          <p class="overlay-description">${t("subscription.overlay.description")}</p>
        </div>

        <div class="steps-container">
          ${STEPS.map((step, index) => {
            const state = this.getStepState(step.key);
            return html`
              <div class="step ${state}">
                <div class="step-icon">
                  ${this.renderStepIcon(state, index)}
                </div>
                <div class="step-content">
                  <p class="step-title">${t(step.titleKey)}</p>
                  <p class="step-desc">${t(step.descKey)}</p>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "subscription-explainer-overlay": SubscriptionExplainerOverlay;
  }
}
