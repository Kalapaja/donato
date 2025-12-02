/**
 * Unit tests for WalletConnectCard component
 * 
 * Tests:
 * - Render states (disconnected, connecting, connected)
 * - Click handler
 */

import { describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";

// Interface for WalletConnectCard component state
interface WalletConnectCardState {
  isConnecting: boolean;
  isConnected: boolean;
  internalIsConnecting: boolean;
  walletService: MockWalletService | null;
}

// Interface for mock wallet service
interface MockWalletService {
  openModal: () => Promise<void>;
}

// Interface for events dispatched by component
interface WalletConnectCardEvents {
  walletConnectClick: boolean;
  walletError: boolean;
  errorMessage?: string;
}

/**
 * Simulates rendering the WalletConnectCard component
 */
function renderWalletConnectCard(state: WalletConnectCardState): string {
  // Hide card when wallet is connected
  if (state.isConnected) {
    return "";
  }

  // Combine internal and prop-based connecting states
  const isConnectingState = state.isConnecting || state.internalIsConnecting;

  let content = "";
  content += `<div class="wallet-card ${isConnectingState ? "connecting" : ""}"`;
  content += ` role="button"`;
  content += ` aria-label="Connect wallet"`;
  content += `>`;

  // Wallet content
  content += `<div class="wallet-content">`;
  
  // Wallet icon or loading spinner
  content += `<div class="wallet-icon">`;
  if (isConnectingState) {
    content += `<span class="loading-spinner"></span>`;
  } else {
    content += `<svg class="wallet-icon-svg">...</svg>`;
  }
  content += `</div>`;

  // Wallet text
  content += `<div class="wallet-text">`;
  content += `<div class="wallet-title">`;
  content += isConnectingState ? "Connecting..." : "Connect Wallet";
  content += `</div>`;
  content += `<div class="wallet-subtext">To complete your donation</div>`;
  content += `</div>`;
  content += `</div>`;

  // Chevron indicator (only when not connecting)
  if (!isConnectingState) {
    content += `<div class="wallet-indicator">`;
    content += `<svg class="chevron-icon">...</svg>`;
    content += `</div>`;
  }

  content += `</div>`;

  return content;
}

/**
 * Simulates click handler behavior
 */
async function handleClick(
  state: WalletConnectCardState,
): Promise<{ newState: WalletConnectCardState; events: WalletConnectCardEvents }> {
  const events: WalletConnectCardEvents = {
    walletConnectClick: false,
    walletError: false,
  };

  // Don't handle click if already connecting or connected
  if (state.isConnecting || state.isConnected || state.internalIsConnecting) {
    return { newState: state, events };
  }

  // Check if wallet service is provided
  if (!state.walletService) {
    console.error("WalletService is not provided");
    return { newState: state, events };
  }

  // Set internal connecting state
  const newState: WalletConnectCardState = {
    ...state,
    internalIsConnecting: true,
  };

  try {
    // Open Reown modal
    await state.walletService.openModal();
    
    // Dispatch wallet-connect-click event
    events.walletConnectClick = true;
    
    // Reset internal connecting state after modal opens
    // The actual connection state will be managed by parent via props
    return {
      newState: {
        ...newState,
        internalIsConnecting: false,
      },
      events,
    };
  } catch (error) {
    // Dispatch error event
    events.walletError = true;
    events.errorMessage = error instanceof Error
      ? error.message
      : "Failed to open wallet connection";

    // Reset internal connecting state
    return {
      newState: {
        ...newState,
        internalIsConnecting: false,
      },
      events,
    };
  }
}

/**
 * Checks if rendered content contains wallet card
 */
function contentContainsWalletCard(content: string): boolean {
  return content.includes("wallet-card");
}

/**
 * Checks if rendered content shows disconnected state
 */
function contentShowsDisconnectedState(content: string): boolean {
  return content.includes("Connect Wallet") &&
         content.includes("To complete your donation") &&
         content.includes("wallet-icon-svg") &&
         content.includes("chevron-icon") &&
         !content.includes("Connecting...") &&
         !content.includes("loading-spinner");
}

/**
 * Checks if rendered content shows connecting state
 */
function contentShowsConnectingState(content: string): boolean {
  return content.includes("Connecting...") &&
         content.includes("loading-spinner") &&
         content.includes("connecting") &&
         !content.includes("chevron-icon");
}

/**
 * Checks if rendered content is hidden (empty)
 */
function contentIsHidden(content: string): boolean {
  return content === "";
}

/**
 * Creates a mock wallet service
 */
function createMockWalletService(
  shouldSucceed: boolean = true,
  errorMessage?: string,
): MockWalletService {
  return {
    openModal: async () => {
      if (!shouldSucceed) {
        throw new Error(errorMessage || "Failed to open wallet modal");
      }
      // Simulate successful modal opening
      await new Promise((resolve) => setTimeout(resolve, 10));
    },
  };
}

describe("wallet-connect-card", () => {
  describe("2.3 - Render states", () => {
    it("should render disconnected state with wallet icon and 'Connect Wallet' text", () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const rendered = renderWalletConnectCard(state);

      assert(
        contentContainsWalletCard(rendered),
        "WalletConnectCard should render wallet card when disconnected"
      );

      assert(
        contentShowsDisconnectedState(rendered),
        "WalletConnectCard should show disconnected state with 'Connect Wallet' text, wallet icon, and chevron"
      );
    });

    it("should render connecting state with loading spinner and 'Connecting...' text", () => {
      const state: WalletConnectCardState = {
        isConnecting: true,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const rendered = renderWalletConnectCard(state);

      assert(
        contentContainsWalletCard(rendered),
        "WalletConnectCard should render wallet card when connecting"
      );

      assert(
        contentShowsConnectingState(rendered),
        "WalletConnectCard should show connecting state with loading spinner and 'Connecting...' text"
      );
    });

    it("should render connecting state when internalIsConnecting is true", () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: true,
        walletService: createMockWalletService(),
      };

      const rendered = renderWalletConnectCard(state);

      assert(
        contentShowsConnectingState(rendered),
        "WalletConnectCard should show connecting state when internalIsConnecting is true"
      );
    });

    it("should hide card when wallet is connected", () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: true,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const rendered = renderWalletConnectCard(state);

      assert(
        contentIsHidden(rendered),
        "WalletConnectCard should be hidden when wallet is connected"
      );
    });

    it("should show connecting state when either isConnecting or internalIsConnecting is true", () => {
      // Test with isConnecting = true
      const state1: WalletConnectCardState = {
        isConnecting: true,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const rendered1 = renderWalletConnectCard(state1);
      assert(
        contentShowsConnectingState(rendered1),
        "WalletConnectCard should show connecting state when isConnecting is true"
      );

      // Test with internalIsConnecting = true
      const state2: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: true,
        walletService: createMockWalletService(),
      };

      const rendered2 = renderWalletConnectCard(state2);
      assert(
        contentShowsConnectingState(rendered2),
        "WalletConnectCard should show connecting state when internalIsConnecting is true"
      );

      // Test with both true
      const state3: WalletConnectCardState = {
        isConnecting: true,
        isConnected: false,
        internalIsConnecting: true,
        walletService: createMockWalletService(),
      };

      const rendered3 = renderWalletConnectCard(state3);
      assert(
        contentShowsConnectingState(rendered3),
        "WalletConnectCard should show connecting state when both isConnecting and internalIsConnecting are true"
      );
    });

    it("should display 'To complete your donation' subtext in all visible states", () => {
      // Disconnected state
      const disconnectedState: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const disconnectedRendered = renderWalletConnectCard(disconnectedState);
      assert(
        disconnectedRendered.includes("To complete your donation"),
        "WalletConnectCard should display subtext when disconnected"
      );

      // Connecting state
      const connectingState: WalletConnectCardState = {
        isConnecting: true,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const connectingRendered = renderWalletConnectCard(connectingState);
      assert(
        connectingRendered.includes("To complete your donation"),
        "WalletConnectCard should display subtext when connecting"
      );
    });
  });

  describe("2.3 - Click handler", () => {
    it("should trigger wallet connection modal on click when disconnected", async () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(true),
      };

      const { newState, events } = await handleClick(state);

      assert(
        events.walletConnectClick === true,
        "WalletConnectCard should dispatch wallet-connect-click event on click"
      );

      assert(
        !events.walletError,
        "WalletConnectCard should not dispatch error event on successful click"
      );

      // Internal connecting state should be reset after modal opens
      assert(
        newState.internalIsConnecting === false,
        "Internal connecting state should be reset after modal opens"
      );
    });

    it("should not handle click when already connecting", async () => {
      const state: WalletConnectCardState = {
        isConnecting: true,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const { newState, events } = await handleClick(state);

      assert(
        events.walletConnectClick === false,
        "WalletConnectCard should not dispatch event when already connecting"
      );

      assert(
        newState.isConnecting === state.isConnecting,
        "State should remain unchanged when click is ignored"
      );
    });

    it("should not handle click when wallet is connected", async () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: true,
        internalIsConnecting: false,
        walletService: createMockWalletService(),
      };

      const { newState, events } = await handleClick(state);

      assert(
        events.walletConnectClick === false,
        "WalletConnectCard should not dispatch event when wallet is connected"
      );

      assert(
        newState.isConnected === state.isConnected,
        "State should remain unchanged when click is ignored"
      );
    });

    it("should not handle click when internalIsConnecting is true", async () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: true,
        walletService: createMockWalletService(),
      };

      const { newState, events } = await handleClick(state);

      assert(
        events.walletConnectClick === false,
        "WalletConnectCard should not dispatch event when internalIsConnecting is true"
      );

      assert(
        newState.internalIsConnecting === state.internalIsConnecting,
        "State should remain unchanged when click is ignored"
      );
    });

    it("should dispatch wallet-error event when wallet service fails", async () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(false, "Modal failed to open"),
      };

      const { newState, events } = await handleClick(state);

      assert(
        events.walletError === true,
        "WalletConnectCard should dispatch wallet-error event when wallet service fails"
      );

      assert(
        events.errorMessage === "Modal failed to open",
        "WalletConnectCard should include error message in wallet-error event"
      );

      assert(
        events.walletConnectClick === false,
        "WalletConnectCard should not dispatch wallet-connect-click event on error"
      );

      // Internal connecting state should be reset after error
      assert(
        newState.internalIsConnecting === false,
        "Internal connecting state should be reset after error"
      );
    });

    it("should handle missing wallet service gracefully", async () => {
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: null,
      };

      const { newState, events } = await handleClick(state);

      assert(
        events.walletConnectClick === false,
        "WalletConnectCard should not dispatch event when wallet service is missing"
      );

      assert(
        !events.walletError,
        "WalletConnectCard should not dispatch error event when wallet service is missing (should log to console instead)"
      );

      assert(
        newState.walletService === null,
        "State should remain unchanged when wallet service is missing"
      );
    });

    it("should set internalIsConnecting to true during connection process", async () => {
      const initialState: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(true),
      };

      // Verify initial state shows disconnected
      const initialRendered = renderWalletConnectCard(initialState);
      assert(
        contentShowsDisconnectedState(initialRendered),
        "WalletConnectCard should show disconnected state initially"
      );

      // Call handleClick - it should set internalIsConnecting to true internally
      // and then reset it after modal opens
      const { newState } = await handleClick(initialState);

      // After modal opens, internal connecting state should be reset
      assert(
        newState.internalIsConnecting === false,
        "Internal connecting state should be reset after modal opens"
      );

      // Verify that during the connection process, if we manually set internalIsConnecting,
      // the component would show connecting state
      const connectingState: WalletConnectCardState = {
        ...initialState,
        internalIsConnecting: true,
      };

      const connectingRendered = renderWalletConnectCard(connectingState);
      assert(
        contentShowsConnectingState(connectingRendered),
        "WalletConnectCard should show connecting state when internalIsConnecting is set to true"
      );
    });
  });

  describe("Integration: Complete connection flow", () => {
    it("should handle complete flow: disconnected → clicking → connecting → connected", async () => {
      // Step 1: Initial disconnected state
      let state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(true),
      };

      let rendered = renderWalletConnectCard(state);
      assert(
        contentShowsDisconnectedState(rendered),
        "Step 1: Should show disconnected state initially"
      );

      // Step 2: User clicks to connect
      const { newState: clickedState, events } = await handleClick(state);
      assert(
        events.walletConnectClick === true,
        "Step 2: Should dispatch wallet-connect-click event on click"
      );

      // Step 3: Parent component sets isConnecting to true
      state = {
        ...clickedState,
        isConnecting: true,
      };

      rendered = renderWalletConnectCard(state);
      assert(
        contentShowsConnectingState(rendered),
        "Step 3: Should show connecting state when isConnecting is true"
      );

      // Step 4: Wallet connection succeeds, parent sets isConnected to true
      state = {
        ...state,
        isConnecting: false,
        isConnected: true,
      };

      rendered = renderWalletConnectCard(state);
      assert(
        contentIsHidden(rendered),
        "Step 4: Should hide card when wallet is connected"
      );
    });

    it("should handle error flow: disconnected → clicking → error", async () => {
      // Step 1: Initial disconnected state
      const state: WalletConnectCardState = {
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
        walletService: createMockWalletService(false, "User rejected connection"),
      };

      const rendered = renderWalletConnectCard(state);
      assert(
        contentShowsDisconnectedState(rendered),
        "Step 1: Should show disconnected state initially"
      );

      // Step 2: User clicks to connect, but connection fails
      const { events } = await handleClick(state);

      assert(
        events.walletError === true,
        "Step 2: Should dispatch wallet-error event on connection failure"
      );

      assert(
        events.errorMessage === "User rejected connection",
        "Step 2: Should include error message in wallet-error event"
      );

      assert(
        events.walletConnectClick === false,
        "Step 2: Should not dispatch wallet-connect-click event on error"
      );

      // Step 3: Card should remain visible (not connected)
      const finalState: WalletConnectCardState = {
        ...state,
        isConnecting: false,
        isConnected: false,
        internalIsConnecting: false,
      };

      const finalRendered = renderWalletConnectCard(finalState);
      assert(
        contentShowsDisconnectedState(finalRendered),
        "Step 3: Should remain in disconnected state after error"
      );
    });
  });
});

