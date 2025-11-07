import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export interface ConfigStatus {
  isValid: boolean;
  missing: string[];
  configured: string[];
}

interface ConfigField {
  name: string;
  label: string;
  description: string;
  link?: {
    text: string;
    url: string;
  };
  example: string;
}

@customElement("config-panel")
export class ConfigPanel extends LitElement {
  @property({ type: Object })
  accessor configStatus!: ConfigStatus;

  @property({ type: Boolean })
  accessor expanded: boolean = true;

  @state()
  private accessor showExamples: boolean = true;

  static override styles = css`
    :host {
      display: block;
    }

    .config-panel {
      background: oklch(70% 0.20 85 / 0.1);
      border: 2px solid oklch(70% 0.20 85 / 0.4);
      border-radius: calc(var(--radius) - 2px);
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .config-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease;
      background: oklch(70% 0.20 85 / 0.15);
    }

    .config-header:hover {
      background: oklch(70% 0.20 85 / 0.2);
    }

    .config-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-foreground);
    }

    .status-icon {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .toggle-icon {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s ease;
      color: var(--color-muted-foreground);
    }

    .toggle-icon.expanded {
      transform: rotate(180deg);
    }

    .config-content {
      padding: 0 1.25rem 1.25rem 1.25rem;
      display: none;
    }

    .config-content.expanded {
      display: block;
    }

    .config-intro {
      font-size: 0.9375rem;
      color: var(--color-foreground);
      margin-bottom: 1.25rem;
      line-height: 1.6;
      font-weight: 500;
    }

    .config-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .config-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
    }

    .config-item.configured {
      border-color: oklch(70% 0.18 145 / 0.3);
      background: oklch(70% 0.18 145 / 0.05);
    }

    .config-item.missing {
      border-color: oklch(63% 0.24 27 / 0.3);
      background: oklch(63% 0.24 27 / 0.05);
    }

    .item-icon {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.125rem;
    }

    .item-content {
      flex: 1;
      min-width: 0;
    }

    .item-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin-bottom: 0.25rem;
    }

    .item-description {
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    .item-link {
      display: inline-block;
      font-size: 0.8125rem;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .item-link:hover {
      color: var(--color-accent);
      text-decoration: underline;
    }

    .item-example {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 6px);
      font-family: "Courier New", monospace;
      font-size: 0.75rem;
      color: var(--color-foreground);
      word-break: break-all;
      overflow-x: auto;
    }

    .toggle-examples {
      margin-top: 1rem;
      padding: 0.5rem 0.75rem;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--radius) - 4px);
      color: var(--color-foreground);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      text-align: left;
    }

    .toggle-examples:hover {
      background: var(--color-secondary);
    }

    .checkmark {
      color: oklch(70% 0.18 145);
    }

    .warning {
      color: oklch(70% 0.20 85);
    }

    .error {
      color: oklch(63% 0.24 27);
    }
  `;

  private configFields: ConfigField[] = [
    {
      name: "recipient",
      label: "Recipient Address",
      description: "The Ethereum wallet address that will receive donations.",
      example: 'recipient="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"',
    },
    {
      name: "reownProjectId",
      label: "Reown Project ID",
      description:
        "Required for wallet connections. Create a free account to get your project ID.",
      link: {
        text: "Get your Reown Project ID →",
        url: "https://reown.com",
      },
      example: 'reown-project-id="YOUR_REOWN_PROJECT_ID"',
    },
    {
      name: "lifiApiKey",
      label: "LiFi API Key",
      description:
        "Required for cross-chain swaps and token conversions. Sign up for a free API key.",
      link: {
        text: "Get your LiFi API Key →",
        url: "https://li.fi",
      },
      example: 'lifi-api-key="YOUR_LIFI_API_KEY"',
    },
  ];

  private toggleExpanded() {
    this.expanded = !this.expanded;
  }

  private toggleExamples() {
    this.showExamples = !this.showExamples;
  }

  private isConfigured(fieldName: string): boolean {
    return this.configStatus?.configured?.includes(fieldName) ?? false;
  }

  private isMissing(fieldName: string): boolean {
    return this.configStatus?.missing?.includes(fieldName) ?? false;
  }

  private getStatusIcon() {
    if (!this.configStatus) {
      return html`<span class="error">⚠</span>`;
    }

    if (this.configStatus.isValid) {
      return html`<span class="checkmark">✓</span>`;
    }

    if (this.configStatus.configured.length > 0) {
      return html`<span class="warning">⚠</span>`;
    }

    return html`<span class="error">✕</span>`;
  }

  private getStatusText() {
    if (!this.configStatus) {
      return "⚙️ Configuration Required";
    }

    if (this.configStatus.isValid) {
      return "✅ Widget Configured";
    }

    const missingCount = this.configStatus.missing.length;
    if (this.configStatus.configured.length > 0) {
      return `⚠️ ${missingCount} Item${missingCount !== 1 ? "s" : ""} Missing - Configuration Required`;
    }

    return "⚠️ Configuration Required - Widget Not Set Up";
  }

  override render() {
    if (!this.configStatus) {
      return html``;
    }

    // Don't show panel if fully configured
    if (this.configStatus.isValid) {
      return html``;
    }

    return html`
      <div class="config-panel">
        <div class="config-header" @click="${this.toggleExpanded}">
          <div class="config-title">
            <span class="status-icon">${this.getStatusIcon()}</span>
            <span>${this.getStatusText()}</span>
          </div>
          <svg
            class="toggle-icon ${this.expanded ? "expanded" : ""}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <div class="config-content ${this.expanded ? "expanded" : ""}">
          <div class="config-intro">
            <strong>Action Required:</strong> This widget needs to be configured before it can accept donations. 
            Please add the missing attributes to the <code>&lt;donation-widget&gt;</code> element.
          </div>

          <div class="config-list">
            ${this.configFields.map(
              (field) => html`
                <div
                  class="config-item ${this.isConfigured(field.name)
                    ? "configured"
                    : this.isMissing(field.name)
                      ? "missing"
                      : ""}"
                >
                  <div class="item-icon">
                    ${this.isConfigured(field.name)
                      ? html`<span class="checkmark">✓</span>`
                      : html`<span class="error">✕</span>`}
                  </div>
                  <div class="item-content">
                    <div class="item-label">${field.label}</div>
                    <div class="item-description">${field.description}</div>
                    ${field.link
                      ? html`
                          <a
                            href="${field.link.url}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="item-link"
                          >
                            ${field.link.text}
                          </a>
                        `
                      : ""}
                    ${this.showExamples
                      ? html`
                          <div class="item-example">${field.example}</div>
                        `
                      : ""}
                  </div>
                </div>
              `,
            )}
          </div>

          <button class="toggle-examples" @click="${this.toggleExamples}">
            ${this.showExamples ? "Hide" : "Show"} code examples
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "config-panel": ConfigPanel;
  }
}

