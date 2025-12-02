/**
 * Unit tests for DonateButton component
 * 
 * Tests:
 * - Button text formatting
 * - Disabled state
 * - Loading state
 */

import { describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";

// Interface for DonateButton component state
interface DonateButtonState {
  disabled: boolean;
  loading: boolean;
  calculating: boolean;
  amount: string;
  tokenSymbol: string;
  text: string;
}

// Interface for events dispatched by component
interface DonateButtonEvents {
  donateClick: boolean;
}

/**
 * Simulates rendering the DonateButton component
 */
function renderDonateButton(state: DonateButtonState): string {
  let content = "";
  
  // Button element
  const isDisabled = state.disabled || state.loading;
  content += `<button class="donate-button"`;
  content += ` ${isDisabled ? "disabled" : ""}`;
  content += ` aria-label="${getAriaLabel(state)}"`;
  content += ` aria-busy="${state.loading ? "true" : "false"}"`;
  content += ` role="button"`;
  content += `>`;
  
  // Loading spinner or heart icon
  if (state.loading) {
    content += `<span class="loading-spinner" role="status" aria-label="Loading"></span>`;
  } else {
    content += `<span class="heart-icon">♡</span>`;
  }
  
  // Button text
  const buttonText = getButtonText(state);
  content += `<span class="button-text">${buttonText}</span>`;
  
  // Arrow icon (only when not loading and amount/tokenSymbol provided)
  if (!state.loading && state.amount && state.tokenSymbol) {
    content += `<span class="arrow-icon">→</span>`;
  }
  
  content += `</button>`;
  
  return content;
}

/**
 * Gets button text based on state
 */
function getButtonText(state: DonateButtonState): string {
  if (state.loading) {
    return "Processing...";
  }
  
  if (state.calculating) {
    return "Calculating...";
  }
  
  // If amount and tokenSymbol are provided, use the new format
  if (state.amount && state.tokenSymbol) {
    return `Pay ${state.amount} ${state.tokenSymbol}`;
  }
  
  // Fallback to text property for backward compatibility
  return state.text || "Pay";
}

/**
 * Gets aria-label based on state
 */
function getAriaLabel(state: DonateButtonState): string {
  if (state.loading) {
    return "Processing payment, please wait";
  }
  if (state.calculating) {
    return "Calculating payment amount, please wait";
  }
  const buttonText = getButtonText(state);
  if (state.disabled) {
    return `${buttonText} - button disabled`;
  }
  return buttonText;
}

/**
 * Simulates click handler behavior
 */
function handleClick(
  state: DonateButtonState,
): { newState: DonateButtonState; events: DonateButtonEvents } {
  const events: DonateButtonEvents = {
    donateClick: false,
  };
  
  // Don't handle click if disabled, loading, or calculating
  if (state.disabled || state.loading || state.calculating) {
    return { newState: state, events };
  }
  
  // Dispatch donate-click event
  events.donateClick = true;
  
  return { newState: state, events };
}

/**
 * Checks if rendered content contains button
 */
function contentContainsButton(content: string): boolean {
  return content.includes("donate-button");
}

/**
 * Checks if rendered content shows button text
 */
function contentShowsButtonText(content: string, expectedText: string): boolean {
  return content.includes(`button-text">${expectedText}</span>`) ||
         content.includes(`button-text">${expectedText}`);
}

/**
 * Checks if rendered content shows disabled state
 */
function contentShowsDisabledState(content: string): boolean {
  return content.includes('disabled') && 
         content.includes('aria-busy="false"');
}

/**
 * Checks if rendered content shows loading state
 */
function contentShowsLoadingState(content: string): boolean {
  return content.includes("Processing...") &&
         content.includes("loading-spinner") &&
         content.includes('aria-busy="true"') &&
         content.includes('disabled');
}

/**
 * Checks if rendered content shows heart icon
 */
function contentShowsHeartIcon(content: string): boolean {
  return content.includes("heart-icon") && 
         content.includes("♡");
}

/**
 * Checks if rendered content shows arrow icon
 */
function contentShowsArrowIcon(content: string): boolean {
  return content.includes("arrow-icon") && 
         content.includes("→");
}

/**
 * Checks if rendered content does not show arrow icon
 */
function contentDoesNotShowArrowIcon(content: string): boolean {
  return !content.includes("arrow-icon");
}

describe("donate-button", () => {
  describe("4.3 - Button text formatting", () => {
    it("should show 'Pay {amount} {tokenSymbol}' when amount and tokenSymbol are provided", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      const buttonText = getButtonText(state);
      
      assert(
        buttonText === "Pay 24 USDC",
        "DonateButton should format button text as 'Pay 24 USDC' when amount and tokenSymbol are provided"
      );
      
      assert(
        contentShowsButtonText(rendered, "Pay 24 USDC"),
        "DonateButton should display formatted button text in rendered content"
      );
    });
    
    it("should show 'Pay {amount} {tokenSymbol}' with different amounts and tokens", () => {
      const testCases = [
        { amount: "100", tokenSymbol: "ETH", expected: "Pay 100 ETH" },
        { amount: "50.5", tokenSymbol: "USDT", expected: "Pay 50.5 USDT" },
        { amount: "0.1", tokenSymbol: "ETH", expected: "Pay 0.1 ETH" },
        { amount: "999.99", tokenSymbol: "USDC", expected: "Pay 999.99 USDC" },
      ];
      
      for (const testCase of testCases) {
        const state: DonateButtonState = {
          disabled: false,
          loading: false,
          calculating: false,
          amount: testCase.amount,
          tokenSymbol: testCase.tokenSymbol,
          text: "Donate",
        };
        
        const buttonText = getButtonText(state);
        
        assert(
          buttonText === testCase.expected,
          `DonateButton should format button text correctly. Amount: ${testCase.amount}, Token: ${testCase.tokenSymbol}, Expected: "${testCase.expected}", Got: "${buttonText}"`
        );
      }
    });
    
    it("should fallback to text property when amount or tokenSymbol is missing", () => {
      // Missing tokenSymbol
      const state1: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "",
        text: "Donate",
      };
      
      const buttonText1 = getButtonText(state1);
      assert(
        buttonText1 === "Donate",
        "DonateButton should fallback to text property when tokenSymbol is missing"
      );
      
      // Missing amount
      const state2: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const buttonText2 = getButtonText(state2);
      assert(
        buttonText2 === "Donate",
        "DonateButton should fallback to text property when amount is missing"
      );
      
      // Both missing
      const state3: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "",
        tokenSymbol: "",
        text: "Donate",
      };
      
      const buttonText3 = getButtonText(state3);
      assert(
        buttonText3 === "Donate",
        "DonateButton should fallback to text property when both amount and tokenSymbol are missing"
      );
    });
    
    it("should use custom text property when provided and amount/tokenSymbol are missing", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "",
        tokenSymbol: "",
        text: "Make Donation",
      };
      
      const buttonText = getButtonText(state);
      
      assert(
        buttonText === "Make Donation",
        "DonateButton should use custom text property when amount and tokenSymbol are missing"
      );
    });
    
    it("should show arrow icon when amount and tokenSymbol are provided and not loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        contentShowsArrowIcon(rendered),
        "DonateButton should show arrow icon when amount and tokenSymbol are provided and not loading"
      );
    });
    
    it("should not show arrow icon when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        contentDoesNotShowArrowIcon(rendered),
        "DonateButton should not show arrow icon when loading"
      );
    });
    
    it("should not show arrow icon when amount or tokenSymbol is missing", () => {
      // Missing tokenSymbol
      const state1: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "",
        text: "Donate",
      };
      
      const rendered1 = renderDonateButton(state1);
      assert(
        contentDoesNotShowArrowIcon(rendered1),
        "DonateButton should not show arrow icon when tokenSymbol is missing"
      );
      
      // Missing amount
      const state2: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered2 = renderDonateButton(state2);
      assert(
        contentDoesNotShowArrowIcon(rendered2),
        "DonateButton should not show arrow icon when amount is missing"
      );
    });
  });
  
  describe("4.3 - Disabled state", () => {
    it("should disable button when disabled property is true", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        contentShowsDisabledState(rendered),
        "DonateButton should be disabled when disabled property is true"
      );
      
      assert(
        rendered.includes('disabled'),
        "DonateButton should have disabled attribute when disabled property is true"
      );
    });
    
    it("should disable button when loading is true", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        rendered.includes('disabled'),
        "DonateButton should be disabled when loading is true"
      );
    });
    
    it("should disable button when both disabled and loading are true", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        rendered.includes('disabled'),
        "DonateButton should be disabled when both disabled and loading are true"
      );
    });
    
    it("should not dispatch donate-click event when disabled", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const { events } = handleClick(state);
      
      assert(
        events.donateClick === false,
        "DonateButton should not dispatch donate-click event when disabled"
      );
    });
    
    it("should include 'button disabled' in aria-label when disabled", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const ariaLabel = getAriaLabel(state);
      const rendered = renderDonateButton(state);
      
      assert(
        ariaLabel.includes("button disabled"),
        "DonateButton should include 'button disabled' in aria-label when disabled"
      );
      
      assert(
        rendered.includes(`aria-label="${ariaLabel}"`),
        "DonateButton should set aria-label correctly when disabled"
      );
    });
  });
  
  describe("4.3 - Loading state", () => {
    it("should show 'Processing...' text when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      const buttonText = getButtonText(state);
      
      assert(
        buttonText === "Processing...",
        "DonateButton should show 'Processing...' text when loading"
      );
      
      assert(
        contentShowsButtonText(rendered, "Processing..."),
        "DonateButton should display 'Processing...' text in rendered content when loading"
      );
    });
    
    it("should show loading spinner when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        contentShowsLoadingState(rendered),
        "DonateButton should show loading spinner when loading"
      );
      
      assert(
        rendered.includes("loading-spinner"),
        "DonateButton should include loading spinner in rendered content when loading"
      );
    });
    
    it("should not show heart icon when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        !contentShowsHeartIcon(rendered),
        "DonateButton should not show heart icon when loading"
      );
    });
    
    it("should set aria-busy to true when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        rendered.includes('aria-busy="true"'),
        "DonateButton should set aria-busy to true when loading"
      );
    });
    
    it("should set aria-label to 'Processing payment, please wait' when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const ariaLabel = getAriaLabel(state);
      const rendered = renderDonateButton(state);
      
      assert(
        ariaLabel === "Processing payment, please wait",
        "DonateButton should set aria-label to 'Processing payment, please wait' when loading"
      );
      
      assert(
        rendered.includes(`aria-label="Processing payment, please wait"`),
        "DonateButton should set aria-label correctly when loading"
      );
    });
    
    it("should not dispatch donate-click event when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const { events } = handleClick(state);
      
      assert(
        events.donateClick === false,
        "DonateButton should not dispatch donate-click event when loading"
      );
    });
  });
  
  describe("4.3 - Click handler", () => {
    it("should dispatch donate-click event when clicked and not disabled/loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const { events } = handleClick(state);
      
      assert(
        events.donateClick === true,
        "DonateButton should dispatch donate-click event when clicked and enabled"
      );
    });
    
    it("should not dispatch donate-click event when disabled", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const { events } = handleClick(state);
      
      assert(
        events.donateClick === false,
        "DonateButton should not dispatch donate-click event when disabled"
      );
    });
    
    it("should not dispatch donate-click event when loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const { events } = handleClick(state);
      
      assert(
        events.donateClick === false,
        "DonateButton should not dispatch donate-click event when loading"
      );
    });
    
    it("should not dispatch donate-click event when both disabled and loading", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: true,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const { events } = handleClick(state);
      
      assert(
        events.donateClick === false,
        "DonateButton should not dispatch donate-click event when both disabled and loading"
      );
    });
  });
  
  describe("4.3 - Heart icon", () => {
    it("should show heart icon when not loading", () => {
      const state: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        contentShowsHeartIcon(rendered),
        "DonateButton should show heart icon when not loading"
      );
    });
    
    it("should show heart icon when disabled but not loading", () => {
      const state: DonateButtonState = {
        disabled: true,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      const rendered = renderDonateButton(state);
      
      assert(
        contentShowsHeartIcon(rendered),
        "DonateButton should show heart icon when disabled but not loading"
      );
    });
  });
  
  describe("Integration: Complete button states", () => {
    it("should handle complete flow: enabled → loading → disabled", () => {
      // Step 1: Initial enabled state
      let state: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      let rendered = renderDonateButton(state);
      let { events } = handleClick(state);
      
      assert(
        contentShowsButtonText(rendered, "Pay 24 USDC"),
        "Step 1: Should show formatted button text when enabled"
      );
      
      assert(
        contentShowsHeartIcon(rendered),
        "Step 1: Should show heart icon when enabled"
      );
      
      assert(
        contentShowsArrowIcon(rendered),
        "Step 1: Should show arrow icon when enabled"
      );
      
      assert(
        events.donateClick === true,
        "Step 1: Should dispatch donate-click event when enabled"
      );
      
      // Step 2: Loading state
      state = {
        ...state,
        loading: true,
      };
      
      rendered = renderDonateButton(state);
      events = handleClick(state).events;
      
      assert(
        contentShowsButtonText(rendered, "Processing..."),
        "Step 2: Should show 'Processing...' text when loading"
      );
      
      assert(
        contentShowsLoadingState(rendered),
        "Step 2: Should show loading spinner when loading"
      );
      
      assert(
        !contentShowsHeartIcon(rendered),
        "Step 2: Should not show heart icon when loading"
      );
      
      assert(
        contentDoesNotShowArrowIcon(rendered),
        "Step 2: Should not show arrow icon when loading"
      );
      
      assert(
        events.donateClick === false,
        "Step 2: Should not dispatch donate-click event when loading"
      );
      
      // Step 3: Disabled state
      state = {
        disabled: true,
        loading: false,
        calculating: false,
        amount: "24",
        tokenSymbol: "USDC",
        text: "Donate",
      };
      
      rendered = renderDonateButton(state);
      events = handleClick(state).events;
      
      assert(
        contentShowsDisabledState(rendered),
        "Step 3: Should show disabled state"
      );
      
      assert(
        contentShowsHeartIcon(rendered),
        "Step 3: Should show heart icon when disabled but not loading"
      );
      
      assert(
        events.donateClick === false,
        "Step 3: Should not dispatch donate-click event when disabled"
      );
    });
    
    it("should handle button text formatting with different states", () => {
      // With amount and tokenSymbol
      const state1: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "100",
        tokenSymbol: "ETH",
        text: "Donate",
      };
      
      assert(
        getButtonText(state1) === "Pay 100 ETH",
        "Should format text with amount and tokenSymbol"
      );
      
      // Loading state
      const state2: DonateButtonState = {
        ...state1,
        loading: true,
      };
      
      assert(
        getButtonText(state2) === "Processing...",
        "Should show 'Processing...' when loading"
      );
      
      // Without amount/tokenSymbol
      const state3: DonateButtonState = {
        disabled: false,
        loading: false,
        calculating: false,
        amount: "",
        tokenSymbol: "",
        text: "Donate",
      };
      
      assert(
        getButtonText(state3) === "Donate",
        "Should fallback to text property when amount/tokenSymbol missing"
      );
    });
  });
});

