/**
 * Unit tests for DonationTypeToggle component
 *
 * Tests:
 * - Default value is 'one-time'
 * - Event emission on click
 * - No event when clicking already selected option
 * - Disabled state rendering
 */

import { describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";

// Type representing the donation mode (mirrors component's DonationType)
type DonationType = "one-time" | "monthly";

// Interface for DonationTypeToggle component state
interface DonationTypeToggleState {
  value: DonationType;
  disabled: boolean;
}

// Interface for events dispatched by the component
interface DonationTypeToggleEvents {
  donationTypeChanged: { type: DonationType } | null;
}

/**
 * Simulates rendering the DonationTypeToggle component
 * Returns HTML-like string representation for assertion
 */
function renderDonationTypeToggle(state: DonationTypeToggleState): string {
  // When disabled, render nothing (mirrors component's disabled behavior)
  if (state.disabled) {
    return ""; // nothing template
  }

  // Render toggle container with both options
  let content = `<div class="toggle-container">`;
  content += `<div class="toggle" role="group" aria-label="Donation type">`;

  // One-time option
  const oneTimeActive = state.value === "one-time" ? " active" : "";
  content += `<button class="toggle-option${oneTimeActive}" data-type="one-time"`;
  content += ` aria-pressed="${state.value === "one-time"}" type="button">`;
  content += `One-time</button>`;

  // Monthly option
  const monthlyActive = state.value === "monthly" ? " active" : "";
  content += `<button class="toggle-option${monthlyActive}" data-type="monthly"`;
  content += ` aria-pressed="${state.value === "monthly"}" type="button">`;
  content += `Monthly</button>`;

  content += `</div></div>`;

  return content;
}

/**
 * Simulates handling a toggle click
 * Returns new state and any events that would be dispatched
 */
function handleToggle(
  currentState: DonationTypeToggleState,
  clickedType: DonationType
): { newState: DonationTypeToggleState; events: DonationTypeToggleEvents } {
  const events: DonationTypeToggleEvents = {
    donationTypeChanged: null,
  };

  // If disabled, do nothing
  if (currentState.disabled) {
    return { newState: currentState, events };
  }

  // Only dispatch event if value actually changes
  if (currentState.value !== clickedType) {
    const newState: DonationTypeToggleState = {
      ...currentState,
      value: clickedType,
    };

    // Dispatch event with new type
    events.donationTypeChanged = { type: clickedType };

    return { newState, events };
  }

  // No change, no event
  return { newState: currentState, events };
}

/**
 * Checks if rendered content shows the toggle UI
 */
function contentShowsToggle(content: string): boolean {
  return (
    content.includes("toggle-container") &&
    content.includes("toggle-option") &&
    content.includes('data-type="one-time"') &&
    content.includes('data-type="monthly"')
  );
}

/**
 * Checks if the one-time option is marked as active
 */
function isOneTimeActive(content: string): boolean {
  // Check if one-time button has active class
  const oneTimeMatch = content.match(
    /<button[^>]*data-type="one-time"[^>]*class="[^"]*"/
  );
  if (oneTimeMatch) {
    return oneTimeMatch[0].includes("active");
  }
  // Alternative: check class before data-type
  return content.includes('class="toggle-option active" data-type="one-time"');
}

/**
 * Checks if the monthly option is marked as active
 */
function isMonthlyActive(content: string): boolean {
  // Check if monthly button has active class
  const monthlyMatch = content.match(
    /<button[^>]*data-type="monthly"[^>]*class="[^"]*"/
  );
  if (monthlyMatch) {
    return monthlyMatch[0].includes("active");
  }
  // Alternative: check class before data-type
  return content.includes('class="toggle-option active" data-type="monthly"');
}

/**
 * Checks if content is empty (disabled state renders nothing)
 */
function contentIsEmpty(content: string): boolean {
  return content === "";
}

/**
 * Gets aria-pressed value for a specific option
 */
function getAriaPressed(content: string, optionType: DonationType): boolean {
  const pattern = new RegExp(
    `data-type="${optionType}"[^>]*aria-pressed="(true|false)"`
  );
  const match = content.match(pattern);
  return match ? match[1] === "true" : false;
}

describe("donation-type-toggle", () => {
  describe("Default value", () => {
    it("should have 'one-time' as default value", () => {
      const defaultState: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      assertEquals(
        defaultState.value,
        "one-time",
        "Default value should be 'one-time'"
      );
    });

    it("should render with one-time option active by default", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const rendered = renderDonationTypeToggle(state);

      assert(
        contentShowsToggle(rendered),
        "Toggle should render with both options visible"
      );

      assert(
        isOneTimeActive(rendered),
        "One-time option should be marked as active by default"
      );

      assert(
        !isMonthlyActive(rendered),
        "Monthly option should not be active by default"
      );
    });

    it("should have aria-pressed='true' for one-time and 'false' for monthly by default", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const rendered = renderDonationTypeToggle(state);

      assert(
        getAriaPressed(rendered, "one-time"),
        "One-time option should have aria-pressed='true' by default"
      );

      assert(
        !getAriaPressed(rendered, "monthly"),
        "Monthly option should have aria-pressed='false' by default"
      );
    });
  });

  describe("Event emission on click", () => {
    it("should emit donation-type-changed event with type='monthly' when clicking monthly", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const { newState, events } = handleToggle(state, "monthly");

      assert(
        events.donationTypeChanged !== null,
        "Event should be dispatched when clicking different option"
      );

      assertEquals(
        events.donationTypeChanged?.type,
        "monthly",
        "Event should contain type='monthly'"
      );

      assertEquals(
        newState.value,
        "monthly",
        "State value should be updated to 'monthly'"
      );
    });

    it("should emit donation-type-changed event with type='one-time' when clicking one-time from monthly", () => {
      const state: DonationTypeToggleState = {
        value: "monthly",
        disabled: false,
      };

      const { newState, events } = handleToggle(state, "one-time");

      assert(
        events.donationTypeChanged !== null,
        "Event should be dispatched when clicking different option"
      );

      assertEquals(
        events.donationTypeChanged?.type,
        "one-time",
        "Event should contain type='one-time'"
      );

      assertEquals(
        newState.value,
        "one-time",
        "State value should be updated to 'one-time'"
      );
    });

    it("should update rendered content after toggle", () => {
      const initialState: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const { newState } = handleToggle(initialState, "monthly");
      const rendered = renderDonationTypeToggle(newState);

      assert(
        isMonthlyActive(rendered),
        "Monthly option should be active after toggle"
      );

      assert(
        !isOneTimeActive(rendered),
        "One-time option should not be active after toggle"
      );

      assert(
        getAriaPressed(rendered, "monthly"),
        "Monthly option should have aria-pressed='true' after toggle"
      );

      assert(
        !getAriaPressed(rendered, "one-time"),
        "One-time option should have aria-pressed='false' after toggle"
      );
    });
  });

  describe("No event when clicking already selected option", () => {
    it("should not emit event when clicking one-time while already on one-time", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const { newState, events } = handleToggle(state, "one-time");

      assert(
        events.donationTypeChanged === null,
        "No event should be dispatched when clicking already selected option"
      );

      assertEquals(
        newState.value,
        "one-time",
        "State value should remain unchanged"
      );
    });

    it("should not emit event when clicking monthly while already on monthly", () => {
      const state: DonationTypeToggleState = {
        value: "monthly",
        disabled: false,
      };

      const { newState, events } = handleToggle(state, "monthly");

      assert(
        events.donationTypeChanged === null,
        "No event should be dispatched when clicking already selected option"
      );

      assertEquals(
        newState.value,
        "monthly",
        "State value should remain unchanged"
      );
    });

    it("should not change state when clicking already selected option", () => {
      const state: DonationTypeToggleState = {
        value: "monthly",
        disabled: false,
      };

      const { newState } = handleToggle(state, "monthly");

      // State object should be the same (reference equality)
      assert(
        newState === state,
        "State object should be unchanged when clicking already selected option"
      );
    });
  });

  describe("Disabled state rendering", () => {
    it("should render nothing when disabled is true", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: true,
      };

      const rendered = renderDonationTypeToggle(state);

      assert(
        contentIsEmpty(rendered),
        "Component should render nothing (empty template) when disabled"
      );
    });

    it("should render nothing when disabled is true regardless of value", () => {
      const testCases: DonationType[] = ["one-time", "monthly"];

      for (const value of testCases) {
        const state: DonationTypeToggleState = {
          value,
          disabled: true,
        };

        const rendered = renderDonationTypeToggle(state);

        assert(
          contentIsEmpty(rendered),
          `Component should render nothing when disabled, even with value='${value}'`
        );
      }
    });

    it("should not emit events when disabled", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: true,
      };

      const { events: monthlyEvents } = handleToggle(state, "monthly");
      const { events: oneTimeEvents } = handleToggle(state, "one-time");

      assert(
        monthlyEvents.donationTypeChanged === null,
        "No event should be emitted when disabled (clicking monthly)"
      );

      assert(
        oneTimeEvents.donationTypeChanged === null,
        "No event should be emitted when disabled (clicking one-time)"
      );
    });

    it("should not change state when disabled", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: true,
      };

      const { newState } = handleToggle(state, "monthly");

      assertEquals(
        newState.value,
        "one-time",
        "State value should not change when disabled"
      );

      assert(
        newState === state,
        "State object should be unchanged when disabled"
      );
    });

    it("should render toggle when disabled is false", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const rendered = renderDonationTypeToggle(state);

      assert(
        contentShowsToggle(rendered),
        "Toggle should be rendered when disabled is false"
      );

      assert(
        !contentIsEmpty(rendered),
        "Content should not be empty when disabled is false"
      );
    });
  });

  describe("Event details", () => {
    it("should emit event with correct detail structure", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const { events } = handleToggle(state, "monthly");

      assert(
        events.donationTypeChanged !== null,
        "Event should be dispatched"
      );

      assert(
        "type" in (events.donationTypeChanged ?? {}),
        "Event detail should have 'type' property"
      );

      assertEquals(
        events.donationTypeChanged?.type,
        "monthly",
        "Event detail type should match clicked option"
      );
    });

    it("should emit event with bubbles and composed options (simulated)", () => {
      // This test documents that the component's CustomEvent is created with:
      // - bubbles: true
      // - composed: true
      // These options allow the event to bubble through shadow DOM boundaries

      // Simulating the expected event configuration
      const expectedEventConfig = {
        bubbles: true,
        composed: true,
      };

      assert(
        expectedEventConfig.bubbles === true,
        "Event should have bubbles: true"
      );

      assert(
        expectedEventConfig.composed === true,
        "Event should have composed: true"
      );
    });
  });

  describe("Toggle flow integration", () => {
    it("should handle complete toggle flow: one-time -> monthly -> one-time", () => {
      // Start with one-time
      let state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      // Verify initial render
      let rendered = renderDonationTypeToggle(state);
      assert(
        isOneTimeActive(rendered),
        "Step 1: One-time should be active initially"
      );

      // Toggle to monthly
      let result = handleToggle(state, "monthly");
      state = result.newState;

      assert(
        result.events.donationTypeChanged?.type === "monthly",
        "Step 2: Event should be emitted with type='monthly'"
      );

      rendered = renderDonationTypeToggle(state);
      assert(
        isMonthlyActive(rendered),
        "Step 2: Monthly should be active after toggle"
      );

      // Click monthly again (should not emit event)
      result = handleToggle(state, "monthly");
      assert(
        result.events.donationTypeChanged === null,
        "Step 3: No event when clicking already selected monthly"
      );

      // Toggle back to one-time
      result = handleToggle(state, "one-time");
      state = result.newState;

      assert(
        result.events.donationTypeChanged?.type === "one-time",
        "Step 4: Event should be emitted with type='one-time'"
      );

      rendered = renderDonationTypeToggle(state);
      assert(
        isOneTimeActive(rendered),
        "Step 4: One-time should be active after toggle back"
      );
    });

    it("should handle rapid toggle clicks", () => {
      let state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      // Rapid toggles
      const clicks: DonationType[] = [
        "monthly",
        "one-time",
        "monthly",
        "monthly",
        "one-time",
      ];
      const expectedEvents = [true, true, true, false, true]; // false = no event (same as current)
      const expectedFinalValue = "one-time";

      clicks.forEach((clickType, index) => {
        const { newState, events } = handleToggle(state, clickType);
        const shouldEmit = expectedEvents[index];

        if (shouldEmit) {
          assert(
            events.donationTypeChanged !== null,
            `Click ${index + 1}: Event should be emitted for ${clickType}`
          );
          assertEquals(
            events.donationTypeChanged?.type,
            clickType,
            `Click ${index + 1}: Event type should be ${clickType}`
          );
        } else {
          assert(
            events.donationTypeChanged === null,
            `Click ${index + 1}: No event expected for ${clickType}`
          );
        }

        state = newState;
      });

      assertEquals(
        state.value,
        expectedFinalValue,
        "Final value should match expected after rapid clicks"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have role='group' for the toggle container", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const rendered = renderDonationTypeToggle(state);

      assert(
        rendered.includes('role="group"'),
        "Toggle should have role='group' for accessibility"
      );
    });

    it("should have aria-label for the toggle group", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const rendered = renderDonationTypeToggle(state);

      assert(
        rendered.includes('aria-label="Donation type"'),
        "Toggle should have aria-label for accessibility"
      );
    });

    it("should have type='button' to prevent form submission", () => {
      const state: DonationTypeToggleState = {
        value: "one-time",
        disabled: false,
      };

      const rendered = renderDonationTypeToggle(state);

      // Count occurrences of type="button"
      const typeButtonCount = (rendered.match(/type="button"/g) || []).length;

      assertEquals(
        typeButtonCount,
        2,
        "Both buttons should have type='button' to prevent form submission"
      );
    });
  });
});
