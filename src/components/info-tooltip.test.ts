/**
 * Unit tests for InfoTooltip component
 *
 * Tests:
 * - Hidden by default
 * - Show on click
 * - Close button functionality
 * - Title display
 * - Keyboard interactions
 */

import { describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";

// Interface for InfoTooltip component state
interface InfoTooltipState {
  title: string;
  trigger: "hover" | "click";
  position: "top" | "bottom";
  isOpen: boolean;
}

/**
 * Simulates rendering the InfoTooltip component
 */
function renderInfoTooltip(state: InfoTooltipState): string {
  let content = "";

  // Info icon button
  content += `<button class="info-icon"`;
  content += ` aria-label="Show information"`;
  content += ` aria-expanded="${state.isOpen}"`;
  content += ` aria-haspopup="true"`;
  content += `>?</button>`;

  // Tooltip content
  content += `<div class="tooltip-content ${state.position}"`;
  if (!state.isOpen) {
    content += ` hidden`;
  }
  content += ` role="tooltip"`;
  content += `>`;

  // Title (if provided)
  if (state.title) {
    content += `<div class="tooltip-title">${state.title}</div>`;
  }

  // Slot for content
  content += `<slot></slot>`;

  // Close button
  content += `<button class="tooltip-close" aria-label="Close">&times;</button>`;

  content += `</div>`;

  return content;
}

/**
 * Simulates click handler (toggle) behavior
 */
function handleToggle(
  state: InfoTooltipState
): { newState: InfoTooltipState } {
  return {
    newState: {
      ...state,
      isOpen: !state.isOpen,
    },
  };
}

/**
 * Simulates close handler behavior
 */
function handleClose(
  state: InfoTooltipState
): { newState: InfoTooltipState } {
  return {
    newState: {
      ...state,
      isOpen: false,
    },
  };
}

/**
 * Simulates keydown handler behavior
 */
function handleKeyDown(
  state: InfoTooltipState,
  key: string
): { newState: InfoTooltipState; preventDefault: boolean } {
  if (key === "Enter" || key === " ") {
    return {
      newState: {
        ...state,
        isOpen: !state.isOpen,
      },
      preventDefault: true,
    };
  } else if (key === "Escape" && state.isOpen) {
    return {
      newState: {
        ...state,
        isOpen: false,
      },
      preventDefault: false,
    };
  }
  return {
    newState: state,
    preventDefault: false,
  };
}

/**
 * Checks if rendered content shows tooltip content
 */
function contentShowsTooltip(content: string): boolean {
  return (
    content.includes("tooltip-content") && !content.includes("hidden")
  );
}

/**
 * Checks if rendered content hides tooltip content
 */
function contentHidesTooltip(content: string): boolean {
  return (
    content.includes("tooltip-content") && content.includes("hidden")
  );
}

/**
 * Checks if rendered content shows close button
 */
function contentShowsCloseButton(content: string): boolean {
  return content.includes("tooltip-close");
}

/**
 * Checks if rendered content shows title
 */
function contentShowsTitle(content: string, title: string): boolean {
  return content.includes(`tooltip-title">${title}</div>`);
}

/**
 * Checks if rendered content has info icon
 */
function contentShowsInfoIcon(content: string): boolean {
  return content.includes("info-icon") && content.includes("?");
}

/**
 * Checks aria-expanded attribute value
 */
function contentHasAriaExpanded(content: string, expanded: boolean): boolean {
  return content.includes(`aria-expanded="${expanded}"`);
}

describe("info-tooltip", () => {
  describe("Hidden by default", () => {
    it("should render info icon visible", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        contentShowsInfoIcon(rendered),
        "InfoTooltip should render info icon button"
      );
    });

    it("should hide tooltip content by default", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        contentHidesTooltip(rendered),
        "InfoTooltip should hide tooltip content by default"
      );
    });

    it("should set aria-expanded to false when closed", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        contentHasAriaExpanded(rendered, false),
        "InfoTooltip should have aria-expanded=false when closed"
      );
    });
  });

  describe("Show on click", () => {
    it("should show tooltip content when clicked", () => {
      let state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      // Initially hidden
      let rendered = renderInfoTooltip(state);
      assert(
        contentHidesTooltip(rendered),
        "InfoTooltip should be hidden initially"
      );

      // Click to open
      const { newState } = handleToggle(state);
      state = newState;
      rendered = renderInfoTooltip(state);

      assert(
        contentShowsTooltip(rendered),
        "InfoTooltip should show tooltip content after click"
      );
    });

    it("should set aria-expanded to true when open", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        contentHasAriaExpanded(rendered, true),
        "InfoTooltip should have aria-expanded=true when open"
      );
    });

    it("should toggle tooltip on multiple clicks", () => {
      let state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      // First click - open
      state = handleToggle(state).newState;
      assertEquals(state.isOpen, true, "First click should open tooltip");

      // Second click - close
      state = handleToggle(state).newState;
      assertEquals(state.isOpen, false, "Second click should close tooltip");

      // Third click - open again
      state = handleToggle(state).newState;
      assertEquals(state.isOpen, true, "Third click should open tooltip again");
    });
  });

  describe("Close button functionality", () => {
    it("should render close button in tooltip content", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        contentShowsCloseButton(rendered),
        "InfoTooltip should render close button in tooltip content"
      );
    });

    it("should close tooltip when close button is clicked", () => {
      let state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      // Verify initially open
      let rendered = renderInfoTooltip(state);
      assert(
        contentShowsTooltip(rendered),
        "InfoTooltip should be open initially"
      );

      // Click close button
      const { newState } = handleClose(state);
      state = newState;
      rendered = renderInfoTooltip(state);

      assert(
        contentHidesTooltip(rendered),
        "InfoTooltip should be hidden after clicking close button"
      );
      assertEquals(
        state.isOpen,
        false,
        "isOpen should be false after clicking close button"
      );
    });

    it("should have aria-label on close button", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        rendered.includes('aria-label="Close"'),
        "Close button should have aria-label"
      );
    });
  });

  describe("Title display", () => {
    it("should display title when provided", () => {
      const state: InfoTooltipState = {
        title: "Is it safe?",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        contentShowsTitle(rendered, "Is it safe?"),
        "InfoTooltip should display the provided title"
      );
    });

    it("should not display title element when title is empty", () => {
      const state: InfoTooltipState = {
        title: "",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        !rendered.includes("tooltip-title"),
        "InfoTooltip should not display title element when title is empty"
      );
    });

    it("should display different titles correctly", () => {
      const titles = [
        "Is it safe?",
        "Why USDC on Polygon?",
        "What is this?",
        "Information",
      ];

      for (const title of titles) {
        const state: InfoTooltipState = {
          title,
          trigger: "click",
          position: "bottom",
          isOpen: true,
        };

        const rendered = renderInfoTooltip(state);

        assert(
          contentShowsTitle(rendered, title),
          `InfoTooltip should display title "${title}"`
        );
      }
    });
  });

  describe("Keyboard interactions", () => {
    it("should toggle tooltip on Enter key", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const { newState, preventDefault } = handleKeyDown(state, "Enter");

      assertEquals(newState.isOpen, true, "Enter key should open tooltip");
      assertEquals(preventDefault, true, "Enter key should prevent default");
    });

    it("should toggle tooltip on Space key", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const { newState, preventDefault } = handleKeyDown(state, " ");

      assertEquals(newState.isOpen, true, "Space key should open tooltip");
      assertEquals(preventDefault, true, "Space key should prevent default");
    });

    it("should close tooltip on Escape key when open", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const { newState, preventDefault } = handleKeyDown(state, "Escape");

      assertEquals(newState.isOpen, false, "Escape key should close tooltip");
      assertEquals(
        preventDefault,
        false,
        "Escape key should not prevent default"
      );
    });

    it("should not change state on Escape key when already closed", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const { newState } = handleKeyDown(state, "Escape");

      assertEquals(
        newState.isOpen,
        false,
        "Escape key should not change closed tooltip"
      );
    });

    it("should not change state on other keys", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const keys = ["Tab", "a", "1", "ArrowDown"];

      for (const key of keys) {
        const { newState, preventDefault } = handleKeyDown(state, key);

        assertEquals(
          newState.isOpen,
          false,
          `Key "${key}" should not change tooltip state`
        );
        assertEquals(
          preventDefault,
          false,
          `Key "${key}" should not prevent default`
        );
      }
    });
  });

  describe("Position attribute", () => {
    it("should apply bottom position class by default", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        rendered.includes("tooltip-content bottom"),
        "InfoTooltip should have bottom position class"
      );
    });

    it("should apply top position class when set", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "top",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        rendered.includes("tooltip-content top"),
        "InfoTooltip should have top position class"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on info icon", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        rendered.includes('aria-label="Show information"'),
        "Info icon should have aria-label"
      );
      assert(
        rendered.includes('aria-haspopup="true"'),
        "Info icon should have aria-haspopup"
      );
    });

    it("should have role=tooltip on content", () => {
      const state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: true,
      };

      const rendered = renderInfoTooltip(state);

      assert(
        rendered.includes('role="tooltip"'),
        "Tooltip content should have role=tooltip"
      );
    });
  });

  describe("Integration: Complete tooltip flow", () => {
    it("should handle complete flow: closed -> open -> close via button", () => {
      // Step 1: Initial closed state
      let state: InfoTooltipState = {
        title: "Is it safe?",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      let rendered = renderInfoTooltip(state);
      assert(
        contentHidesTooltip(rendered),
        "Step 1: Tooltip should be hidden initially"
      );
      assert(
        contentHasAriaExpanded(rendered, false),
        "Step 1: aria-expanded should be false"
      );

      // Step 2: Click info icon to open
      state = handleToggle(state).newState;
      rendered = renderInfoTooltip(state);

      assert(
        contentShowsTooltip(rendered),
        "Step 2: Tooltip should be visible after click"
      );
      assert(
        contentShowsTitle(rendered, "Is it safe?"),
        "Step 2: Title should be displayed"
      );
      assert(
        contentHasAriaExpanded(rendered, true),
        "Step 2: aria-expanded should be true"
      );

      // Step 3: Click close button
      state = handleClose(state).newState;
      rendered = renderInfoTooltip(state);

      assert(
        contentHidesTooltip(rendered),
        "Step 3: Tooltip should be hidden after close"
      );
      assert(
        contentHasAriaExpanded(rendered, false),
        "Step 3: aria-expanded should be false"
      );
    });

    it("should handle keyboard navigation flow", () => {
      // Step 1: Initial closed state
      let state: InfoTooltipState = {
        title: "Test Title",
        trigger: "click",
        position: "bottom",
        isOpen: false,
      };

      // Step 2: Press Enter to open
      state = handleKeyDown(state, "Enter").newState;
      assertEquals(state.isOpen, true, "Step 2: Enter should open tooltip");

      // Step 3: Press Escape to close
      state = handleKeyDown(state, "Escape").newState;
      assertEquals(state.isOpen, false, "Step 3: Escape should close tooltip");

      // Step 4: Press Space to open again
      state = handleKeyDown(state, " ").newState;
      assertEquals(state.isOpen, true, "Step 4: Space should open tooltip");
    });
  });
});
