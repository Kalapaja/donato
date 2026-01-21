import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { t as _t } from "../services/index.ts";
import type { TranslationKey } from "../services/I18nService.ts";

/**
 * Step state type for rendering
 */
export type StepState = "pending" | "active" | "completed" | "error";

/**
 * Subscription step types matching the handleSubscription flow
 */
export type SubscriptionStep =
  | "idle" // Waiting to start
  | "switching" // Switching to Polygon
  | "signing" // Signing EIP-712
  | "building" // Building actions
  | "returning" // Returning to original network
  | "quoting" // Getting quote
  | "approving" // Approving tokens
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

/**
 * Steps configuration array with translation keys for each step
 */
const STEPS: StepConfig[] = [
  {
    key: "switching",
    titleKey: "subscription.progress.switching",
    descKey: "subscription.progress.switching.desc",
  },
  {
    key: "signing",
    titleKey: "subscription.progress.signing",
    descKey: "subscription.progress.signing.desc",
  },
  {
    key: "building",
    titleKey: "subscription.progress.building",
    descKey: "subscription.progress.building.desc",
  },
  {
    key: "returning",
    titleKey: "subscription.progress.returning",
    descKey: "subscription.progress.returning.desc",
  },
  {
    key: "quoting",
    titleKey: "subscription.progress.quoting",
    descKey: "subscription.progress.quoting.desc",
  },
  {
    key: "approving",
    titleKey: "subscription.progress.approving",
    descKey: "subscription.progress.approving.desc",
  },
  {
    key: "subscribing",
    titleKey: "subscription.progress.subscribing",
    descKey: "subscription.progress.subscribing.desc",
  },
  {
    key: "confirming",
    titleKey: "subscription.progress.confirming",
    descKey: "subscription.progress.confirming.desc",
  },
];

/**
 * Subscription Progress Screen Component
 *
 * Displays subscription progress inline within the widget.
 * Replaces the donation form during subscription execution.
 *
 * @element subscription-progress-screen
 *
 * @attr {SubscriptionStep} current-step - Current step in the subscription process
 * @attr {string} monthly-amount - Monthly subscription amount
 * @attr {string} total-deposit - Total deposit amount
 * @attr {string} error-message - Error message if any step fails
 *
 * @fires subscription-retry - User wants to retry after error
 */
@customElement("subscription-progress-screen")
export class SubscriptionProgressScreen extends LitElement {
  /** Current step in the subscription process */
  @property({ type: String, attribute: "current-step" })
  accessor currentStep: SubscriptionStep = "idle";

  /** Monthly subscription amount */
  @property({ type: String, attribute: "monthly-amount" })
  accessor monthlyAmount: string = "";

  /** Total deposit amount */
  @property({ type: String, attribute: "total-deposit" })
  accessor totalDeposit: string = "";

  /** Error message if any step fails */
  @property({ type: String, attribute: "error-message" })
  accessor errorMessage: string = "";

  /**
   * Determines the state of a step based on current progress
   * @param stepKey - The step to check
   * @returns The current state of the step
   */
  private getStepState(stepKey: SubscriptionStep): StepState {
    // If there's an error and this is the current step, it's in error state
    if (this.errorMessage && this.currentStep === stepKey) {
      return "error";
    }

    // If idle, all steps are pending
    if (this.currentStep === "idle") {
      return "pending";
    }

    const stepIndex = STEPS.findIndex((s) => s.key === stepKey);
    const currentIndex = STEPS.findIndex((s) => s.key === this.currentStep);

    // Steps before current are completed
    if (stepIndex < currentIndex) {
      return "completed";
    }

    // Current step is active
    if (stepIndex === currentIndex) {
      return "active";
    }

    // Steps after current are pending
    return "pending";
  }

  /**
   * Renders the appropriate icon for a step based on its state
   * @param state - The current state of the step
   * @param index - The step index (0-based) for displaying number on pending steps
   * @returns Template result for the step icon
   */
  private renderStepIcon(state: StepState, index: number): TemplateResult {
    switch (state) {
      case "completed":
        return html`<span class="checkmark">&#10003;</span>`;
      case "active":
        return html`<span class="spinner"></span>`;
      case "error":
        return html`<span class="error-icon">!</span>`;
      case "pending":
      default:
        return html`<span>${index + 1}</span>`;
    }
  }

  /**
   * Handles retry button click
   */
  private handleRetry(): void {
    this.dispatchEvent(
      new CustomEvent("subscription-retry", {
        bubbles: true,
        composed: true,
      })
    );
  }

  static override styles = css`
    :host {
      display: block;
    }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-header {
      text-align: center;
    }

    .progress-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 0.25rem 0;
    }

    .progress-subtitle {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      margin: 0;
    }

    .amount-info {
      padding: 0.75rem;
      background: var(--color-muted);
      border-radius: calc(var(--radius) - 4px);
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }

    .amount-row + .amount-row {
      margin-top: 0.25rem;
    }

    .amount-value {
      font-weight: 600;
      color: var(--color-foreground);
    }

    .steps-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
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
      opacity: 0.7;
    }

    .step.error {
      background: oklch(63% 0.24 27 / 0.1);
      border-color: oklch(63% 0.24 27);
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
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .step.pending .step-icon {
      background: var(--color-border);
      color: var(--color-muted-foreground);
    }

    .step.active .step-icon {
      background: var(--color-accent);
      color: var(--color-background);
    }

    .step.completed .step-icon {
      background: oklch(70% 0.2 145);
      color: white;
    }

    .step.error .step-icon {
      background: oklch(63% 0.24 27);
      color: white;
    }

    .step-content {
      flex: 1;
      min-width: 0;
    }

    .step-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-foreground);
      margin: 0;
    }

    .step.pending .step-title {
      color: var(--color-muted-foreground);
    }

    .step-desc {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin: 0.25rem 0 0 0;
      line-height: 1.4;
    }

    .spinner {
      display: inline-block;
      width: 0.875rem;
      height: 0.875rem;
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

    .checkmark {
      font-size: 0.75rem;
    }

    .error-icon {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .error-container {
      padding: 1rem;
      background: oklch(63% 0.24 27 / 0.1);
      border: 1px solid oklch(63% 0.24 27 / 0.3);
      border-radius: calc(var(--radius) - 2px);
      text-align: center;
    }

    .error-text {
      font-size: 0.875rem;
      color: oklch(63% 0.24 27);
      margin: 0 0 0.75rem 0;
    }

    .retry-button {
      padding: 0.5rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: oklch(63% 0.24 27);
      border: none;
      border-radius: calc(var(--radius) - 4px);
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-button:hover {
      opacity: 0.9;
    }

    /* Reduced motion support for accessibility */
    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
      }
    }
  `;

  override render() {
    return html`
      <div class="progress-container">
        <!-- Header -->
        <div class="progress-header">
          <h2 class="progress-title">${_t("subscription.progress.title")}</h2>
          <p class="progress-subtitle">${_t("subscription.progress.subtitle")}</p>
        </div>

        <!-- Amount Info -->
        <div class="amount-info">
          <div class="amount-row">
            <span>${_t("subscription.progress.monthlyAmount")}</span>
            <span class="amount-value">$${this.monthlyAmount}/mo</span>
          </div>
          ${this.totalDeposit
            ? html`
                <div class="amount-row">
                  <span>${_t("subscription.progress.depositAmount")}</span>
                  <span class="amount-value">$${this.totalDeposit}</span>
                </div>
              `
            : ""}
        </div>

        <!-- Steps -->
        <div class="steps-container">
          ${STEPS.map((step, index) => {
            const state = this.getStepState(step.key);
            return html`
              <div class="step ${state}">
                <div class="step-icon">${this.renderStepIcon(state, index)}</div>
                <div class="step-content">
                  <p class="step-title">${_t(step.titleKey)}</p>
                  ${state === "active" || state === "error"
                    ? html` <p class="step-desc">${_t(step.descKey)}</p> `
                    : ""}
                </div>
              </div>
            `;
          })}
        </div>

        <!-- Error State -->
        ${this.errorMessage
          ? html`
              <div class="error-container">
                <p class="error-text">${this.errorMessage}</p>
                <button class="retry-button" @click=${this.handleRetry}>
                  ${_t("subscription.progress.retry")}
                </button>
              </div>
            `
          : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "subscription-progress-screen": SubscriptionProgressScreen;
  }
}

// Re-export STEPS for potential use by other components
export { STEPS };
