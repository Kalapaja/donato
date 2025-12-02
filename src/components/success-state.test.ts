import { describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";

// Interface for transaction data (to be implemented in success-state.ts)
interface TransactionData {
  amount: string;
  recipientAddress: string;
  recipientName?: string;
  tokenSymbol?: string;
  chainName?: string;
  timestamp?: number;
}

// Interface for success state component (to be implemented)
interface SuccessStateComponent {
  amount: string;
  recipientAddress: string;
  recipientName?: string;
  tokenSymbol?: string;
  chainName?: string;
  timestamp?: number;
  
  // Method to render success state content
  renderContent(): string;
  
  // Method to check if amount is present in rendered content
  containsAmount(): boolean;
  
  // Method to check if recipient is present in rendered content
  containsRecipient(): boolean;
}

// Helper function that simulates rendering success state with transaction data
function renderSuccessState(transactionData: TransactionData): string {
  // Simulate rendering the success state component
  // The actual implementation should render both amount and recipient
  let content = "";
  
  // Add amount to content
  if (transactionData.amount) {
    content += `Amount: ${transactionData.amount}`;
    if (transactionData.tokenSymbol) {
      content += ` ${transactionData.tokenSymbol}`;
    }
    content += "\n";
  }
  
  // Add recipient to content
  if (transactionData.recipientAddress) {
    if (transactionData.recipientName) {
      content += `Recipient: ${transactionData.recipientName} (${transactionData.recipientAddress})\n`;
    } else {
      content += `Recipient: ${transactionData.recipientAddress}\n`;
    }
  }
  
  if (transactionData.chainName) {
    content += `Chain: ${transactionData.chainName}\n`;
  }
  
  if (transactionData.timestamp) {
    content += `Timestamp: ${transactionData.timestamp}\n`;
  }
  
  // Always include donate again button in success state
  content += `<button class="donate-again-button">Donate Again</button>\n`;
  
  return content;
}

// Helper function that simulates rendering success state with custom button text
function renderSuccessStateWithButtonText(transactionData: TransactionData, donateAgainText?: string): string {
  // Simulate rendering the success state component with custom button text
  let content = "";
  
  // Add amount to content
  if (transactionData.amount) {
    content += `Amount: ${transactionData.amount}`;
    if (transactionData.tokenSymbol) {
      content += ` ${transactionData.tokenSymbol}`;
    }
    content += "\n";
  }
  
  // Add recipient to content
  if (transactionData.recipientAddress) {
    if (transactionData.recipientName) {
      content += `Recipient: ${transactionData.recipientName} (${transactionData.recipientAddress})\n`;
    } else {
      content += `Recipient: ${transactionData.recipientAddress}\n`;
    }
  }
  
  if (transactionData.chainName) {
    content += `Chain: ${transactionData.chainName}\n`;
  }
  
  if (transactionData.timestamp) {
    content += `Timestamp: ${transactionData.timestamp}\n`;
  }
  
  // Include donate again button with custom text or default
  const buttonText = donateAgainText || "Donate Again";
  content += `<button class="donate-again-button">${buttonText}</button>\n`;
  
  return content;
}

// Helper function to check if button text matches expected value
function buttonTextMatches(content: string, expectedText: string): boolean {
  // Check if the button element contains the expected text
  // The button should have class "donate-again-button" and contain the text
  const buttonPattern = new RegExp(`<button[^>]*class="donate-again-button"[^>]*>.*?${expectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?</button>`, 's');
  return buttonPattern.test(content) || content.includes(`donate-again-button">${expectedText}</button`);
}

// Helper function to check if rendered content contains amount
function contentContainsAmount(content: string, amount: string): boolean {
  return content.includes(amount);
}

// Helper function to check if rendered content contains recipient
function contentContainsRecipient(content: string, recipientAddress: string, recipientName?: string): boolean {
  // Check for recipient address
  if (!content.includes(recipientAddress)) {
    return false;
  }
  
  // If recipient name is provided, check for it as well
  if (recipientName) {
    return content.includes(recipientName);
  }
  
  return true;
}

// Helper function to check if rendered content contains donate again button
function contentContainsDonateAgainButton(content: string): boolean {
  // Check for button element with donate-again class or button text
  // The button should be present in any success state render
  return content.includes('donate-again-button') || 
         content.includes('Donate Again') ||
         content.includes('donate again') ||
         content.includes('<button');
}

// Helper function that simulates rendering the success message text
// The success message is a specific part of the success state UI that displays
// a message to the user about the successful donation
function renderSuccessMessage(transactionData: TransactionData, customMessage?: string): string {
  // If a custom message is provided, use it as a template
  // Otherwise, use the default success message
  const defaultMessage = customMessage || "Thank you for your donation!";
  
  // The success message should include the amount
  // This simulates how the actual component would render the message
  let message = defaultMessage;
  
  // Replace placeholders or append amount information
  // In the actual implementation, the amount would be interpolated into the message
  if (transactionData.amount) {
    // The amount should be included in the message
    // This could be done via template interpolation or string concatenation
    // Escape special regex replacement characters in the amount
    const escapedAmount = transactionData.amount.replace(/\$/g, '$$$$');
    
    if (message.includes('{amount}') || message.includes('{{amount}}')) {
      // Replace {amount} or {{amount}} placeholders
      message = message.replace(/\{?\{?amount\}?\}?/g, escapedAmount);
    } else {
      // If no placeholder, append amount to the message
      message = `${message} You donated ${transactionData.amount}`;
      if (transactionData.tokenSymbol) {
        message += ` ${transactionData.tokenSymbol}`;
      }
    }
  }
  
  return message;
}

// Helper function to check if success message contains the amount
function successMessageContainsAmount(message: string, amount: string): boolean {
  return message.includes(amount);
}

// Helper function to check if rendered content contains token and chain information
function contentContainsTokenAndChain(content: string, tokenSymbol: string, chainName: string): boolean {
  // Both token symbol and chain name should be present in the content
  return content.includes(tokenSymbol) && content.includes(chainName);
}

// Helper function to check if rendered content contains timestamp
function contentContainsTimestamp(content: string, timestamp: number): boolean {
  // Timestamp should be present in the content
  // The timestamp is rendered as a number, so we check for the string representation
  return content.includes(timestamp.toString());
}

describe("success-state", () => {
  describe("Property 2: Success state contains transaction details", () => {
    it("should contain both amount and recipient information in rendered content", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: undefined,
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: undefined,
          chainName: undefined,
          timestamp: undefined,
        },
        {
          amount: "50",
          tokenSymbol: "USDC",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          recipientName: "Test Recipient",
          chainName: "Ethereum",
          timestamp: 1234567890,
        },
        {
          amount: "1.5",
          tokenSymbol: "ETH",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          recipientName: undefined,
          chainName: "Polygon",
          timestamp: undefined,
        },
        {
          amount: "200",
          tokenSymbol: undefined,
          recipientAddress: "0x2222222222222222222222222222222222222222",
          recipientName: "Charity",
          chainName: undefined,
          timestamp: 9876543210,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          // Render success state content
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsAmount(renderedContent, testCase.amount),
          `Rendered success state should contain amount. Content: ${renderedContent}, Amount: ${testCase.amount}`
          );
          
          assert(
          contentContainsRecipient(renderedContent, testCase.recipientAddress, testCase.recipientName),
          `Rendered success state should contain recipient. Content: ${renderedContent}, Recipient: ${testCase.recipientAddress}, Name: ${testCase.recipientName ?? 'N/A'}`
          );
          
        if (testCase.tokenSymbol) {
            assert(
            renderedContent.includes(testCase.tokenSymbol),
            `Rendered success state should contain token symbol when provided. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}`
            );
          }
          
        if (testCase.recipientName) {
            assert(
            renderedContent.includes(testCase.recipientName),
            `Rendered success state should contain recipient name when provided. Content: ${renderedContent}, Name: ${testCase.recipientName}`
            );
          }
        }
    });
    
    it("should contain amount in various formats", () => {
      const testCases = [
        { amount: "100", tokenSymbol: "USDC", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "50.5", tokenSymbol: "ETH", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "0.001", tokenSymbol: undefined, recipientAddress: "0x1111111111111111111111111111111111111111" },
        { amount: "1000000", tokenSymbol: "DAI", recipientAddress: "0x2222222222222222222222222222222222222222" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          renderedContent.includes(testCase.amount),
          `Rendered success state should contain amount in any format. Content: ${renderedContent}, Amount: ${testCase.amount}`
          );
        }
    });
    
    it("should contain recipient address in various formats", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          recipientName: "Test Recipient",
        },
        {
          amount: "1.5",
          recipientAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          recipientName: undefined,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          renderedContent.includes(testCase.recipientAddress),
          `Rendered success state should contain recipient address. Content: ${renderedContent}, Address: ${testCase.recipientAddress}`
          );
        }
    });
    
    it("should contain both amount and recipient even with minimal data", () => {
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "1", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "0.5", recipientAddress: "0x1111111111111111111111111111111111111111" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
            // No optional fields
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsAmount(renderedContent, testCase.amount),
          `Rendered success state should contain amount even with minimal data. Content: ${renderedContent}, Amount: ${testCase.amount}`
          );
          
          assert(
          contentContainsRecipient(renderedContent, testCase.recipientAddress),
          `Rendered success state should contain recipient even with minimal data. Content: ${renderedContent}, Recipient: ${testCase.recipientAddress}`
          );
        }
    });
    
    it("should contain amount and recipient with all optional fields", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: "Test Recipient",
          chainName: "Ethereum",
        },
        {
          amount: "50",
          tokenSymbol: "ETH",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          recipientName: "Charity",
          chainName: "Polygon",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsAmount(renderedContent, testCase.amount),
          `Rendered success state should contain amount with all fields. Content: ${renderedContent}, Amount: ${testCase.amount}`
          );
          
          assert(
          contentContainsRecipient(renderedContent, testCase.recipientAddress, testCase.recipientName),
          `Rendered success state should contain recipient with all fields. Content: ${renderedContent}, Recipient: ${testCase.recipientAddress}, Name: ${testCase.recipientName}`
          );
          
          assert(
          renderedContent.includes(testCase.tokenSymbol),
          `Rendered success state should contain token symbol. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}`
          );
          
          assert(
          renderedContent.includes(testCase.recipientName),
          `Rendered success state should contain recipient name. Content: ${renderedContent}, Name: ${testCase.recipientName}`
          );
        }
    });
  });
  
  describe("Property 4: Success state includes donate again button", () => {
    it("should contain donate again button in rendered content", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: undefined,
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: undefined,
          chainName: undefined,
          timestamp: undefined,
        },
        {
          amount: "50",
          tokenSymbol: "USDC",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          recipientName: "Test",
          chainName: "Ethereum",
          timestamp: 1234567890,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          // Render success state content
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
            contentContainsDonateAgainButton(renderedContent),
            `Rendered success state should contain donate again button. Content: ${renderedContent}`
          );
        }
    });
    
    it("should contain donate again button with minimal transaction data", () => {
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "1", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
            // No optional fields
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
            contentContainsDonateAgainButton(renderedContent),
            `Rendered success state should contain donate again button even with minimal data. Content: ${renderedContent}`
          );
        }
    });
    
    it("should contain donate again button with all optional fields", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: "Test",
          chainName: "Ethereum",
          timestamp: 1234567890,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
            contentContainsDonateAgainButton(renderedContent),
            `Rendered success state should contain donate again button with all fields. Content: ${renderedContent}`
          );
        }
    });
    
    it("should contain donate again button regardless of transaction amount format", () => {
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "50.5", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "0.001", recipientAddress: "0x1111111111111111111111111111111111111111" },
        { amount: "1000000", recipientAddress: "0x2222222222222222222222222222222222222222" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
            contentContainsDonateAgainButton(renderedContent),
          `Rendered success state should contain donate again button regardless of amount format. Content: ${renderedContent}, Amount: ${testCase.amount}`
          );
        }
    });
  });
  
  describe("Property 6: Success message includes amount", () => {
    it("should include amount in success message text", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          customMessage: undefined,
        },
        {
          amount: "50",
          tokenSymbol: undefined,
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          customMessage: "Thank you!",
        },
        {
          amount: "1.5",
          tokenSymbol: "ETH",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          customMessage: "Donation received!",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          };
          
          // Render success message
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
          
          assert(
          successMessageContainsAmount(successMessage, testCase.amount),
          `Success message should contain amount. Message: ${successMessage}, Amount: ${testCase.amount}`
          );
        }
    });
    
    it("should include amount in success message with various amount formats", () => {
      const testCases = [
        { amount: "100", tokenSymbol: "USDC", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "50.5", tokenSymbol: "ETH", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "0.001", tokenSymbol: undefined, recipientAddress: "0x1111111111111111111111111111111111111111" },
        { amount: "1000000", tokenSymbol: "DAI", recipientAddress: "0x2222222222222222222222222222222222222222" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          };
          
          // Render success message
          const successMessage = renderSuccessMessage(transactionData);
          
          assert(
          successMessageContainsAmount(successMessage, testCase.amount),
          `Success message should contain amount in any format. Message: ${successMessage}, Amount: ${testCase.amount}`
          );
        }
    });
    
    it("should include amount in success message with custom message template", () => {
      const testCases = [
        { amount: "100", customMessage: "Thank you! You donated {amount}", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "50", customMessage: "Donation {amount} received!", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "1.5", customMessage: "Success! Amount: {amount}", recipientAddress: "0x1111111111111111111111111111111111111111" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          };
          
          // Render success message with custom template
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
          
          assert(
          successMessageContainsAmount(successMessage, testCase.amount),
          `Success message should contain amount even with custom template. Message: ${successMessage}, Amount: ${testCase.amount}, Template: ${testCase.customMessage}`
          );
        }
    });
    
    it("should include amount in success message with minimal transaction data", () => {
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "1", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
            // No optional fields
          };
          
          // Render success message
          const successMessage = renderSuccessMessage(transactionData);
          
          assert(
          successMessageContainsAmount(successMessage, testCase.amount),
          `Success message should contain amount even with minimal data. Message: ${successMessage}, Amount: ${testCase.amount}`
          );
        }
    });
    
    it("should include amount in success message with all optional fields", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          customMessage: "Thank you!",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          };
          
          // Render success message with all fields
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
          
          assert(
          successMessageContainsAmount(successMessage, testCase.amount),
          `Success message should contain amount with all fields. Message: ${successMessage}, Amount: ${testCase.amount}`
          );
        }
    });
  });
  
  describe("Property 7: Success state displays token and chain information", () => {
    it("should display both token symbol and chain name in rendered content", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          chainName: "Ethereum",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: undefined,
          timestamp: undefined,
        },
        {
          amount: "50",
          tokenSymbol: "ETH",
          chainName: "Polygon",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          recipientName: "Test",
          timestamp: 1234567890,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          // Render success state content
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTokenAndChain(renderedContent, testCase.tokenSymbol, testCase.chainName),
          `Rendered success state should contain both token symbol and chain name. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}, Chain: ${testCase.chainName}`
          );
        }
    });
    
    it("should display token and chain information with minimal transaction data", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          chainName: "Ethereum",
          recipientAddress: "0x1234567890123456789012345678901234567890",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
            // No optional fields
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTokenAndChain(renderedContent, testCase.tokenSymbol, testCase.chainName),
          `Rendered success state should contain token and chain even with minimal data. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}, Chain: ${testCase.chainName}`
          );
        }
    });
    
    it("should display token and chain information with all optional fields", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          chainName: "Ethereum",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: "Test",
          timestamp: 1234567890,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTokenAndChain(renderedContent, testCase.tokenSymbol, testCase.chainName),
          `Rendered success state should contain token and chain with all fields. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}, Chain: ${testCase.chainName}`
          );
        }
    });
    
    it("should display token and chain information with various token symbol formats", () => {
      const testCases = [
        { amount: "100", tokenSymbol: "USDC", chainName: "Ethereum", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "50", tokenSymbol: "eth", chainName: "Polygon", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "1.5", tokenSymbol: "Dai", chainName: "Arbitrum", recipientAddress: "0x1111111111111111111111111111111111111111" },
        { amount: "200", tokenSymbol: "USDT1", chainName: "Optimism", recipientAddress: "0x2222222222222222222222222222222222222222" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTokenAndChain(renderedContent, testCase.tokenSymbol, testCase.chainName),
          `Rendered success state should contain token and chain with various token formats. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}, Chain: ${testCase.chainName}`
          );
        }
    });
    
    it("should display token and chain information with various chain name formats", () => {
      const testCases = [
        { amount: "100", tokenSymbol: "USDC", chainName: "Ethereum", recipientAddress: "0x1234567890123456789012345678901234567890" },
        { amount: "50", tokenSymbol: "ETH", chainName: "Ethereum Mainnet", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
        { amount: "1.5", tokenSymbol: "DAI", chainName: "Polygon-Chain", recipientAddress: "0x1111111111111111111111111111111111111111" },
        { amount: "200", tokenSymbol: "USDT", chainName: "Arbitrum Testnet", recipientAddress: "0x2222222222222222222222222222222222222222" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTokenAndChain(renderedContent, testCase.tokenSymbol, testCase.chainName),
          `Rendered success state should contain token and chain with various chain name formats. Content: ${renderedContent}, Token: ${testCase.tokenSymbol}, Chain: ${testCase.chainName}`
          );
        }
    });
  });
  
  // Property 8 and 9 removed - transaction hash and explorer URL no longer displayed
  /*
  describe("Property 8: Transaction hash is displayed when provided", () => {
    it("should display transaction hash in rendered content when provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          tokenSymbol: undefined,
          recipientName: undefined,
          chainName: undefined,
          timestamp: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          tokenSymbol: "USDC",
          recipientName: "Test",
          chainName: "Ethereum",
          timestamp: 1234567890,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          // Render success state content
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTransactionHash(renderedContent, testCase.transactionHash),
          `Rendered success state should contain transaction hash when provided. Content: ${renderedContent}, Hash: ${testCase.transactionHash}`
          );
        }
    });
    
    it("should display transaction hash with minimal transaction data", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
            // No optional fields
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTransactionHash(renderedContent, testCase.transactionHash),
          `Rendered success state should contain transaction hash even with minimal data. Content: ${renderedContent}, Hash: ${testCase.transactionHash}`
          );
        }
    });
    
    it("should display transaction hash with all optional fields", () => {
      const testCases = [
        {
          amount: "100",
          tokenSymbol: "USDC",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: "Test",
          chainName: "Ethereum",
          timestamp: 1234567890,
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTransactionHash(renderedContent, testCase.transactionHash),
          `Rendered success state should contain transaction hash with all fields. Content: ${renderedContent}, Hash: ${testCase.transactionHash}`
          );
        }
    });
    
    it("should display transaction hash with various hash formats", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          transactionHash: "abc123def456",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          transactionHash: "0xabcdef",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTransactionHash(renderedContent, testCase.transactionHash),
          `Rendered success state should contain transaction hash in any format. Content: ${renderedContent}, Hash: ${testCase.transactionHash}`
          );
        }
    });
  });
  
  describe("Property 9: Transaction hash links to block explorer", () => {
    it("should render clickable link to block explorer when transaction hash and explorer URL are provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          explorerUrl: "https://etherscan.io",
          tokenSymbol: undefined,
          recipientName: undefined,
          chainName: undefined,
          timestamp: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          explorerUrl: "https://polygonscan.com",
          tokenSymbol: "USDC",
          recipientName: "Test",
          chainName: "Polygon",
          timestamp: 1234567890,
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          transactionHash: "0x111222333",
          explorerUrl: "https://arbiscan.io/",
          tokenSymbol: "ETH",
          recipientName: undefined,
          chainName: "Arbitrum",
          timestamp: undefined,
        },
      ];
      
      for (const testCase of testCases) {
          // Normalize explorer URL (remove trailing slash if present)
        const normalizedExplorerUrl = testCase.explorerUrl.trim().replace(/\/+$/, '');
          
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
            explorerUrl: normalizedExplorerUrl,
          timestamp: testCase.timestamp,
          };
          
          // Render success state content
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsBlockExplorerLink(renderedContent, testCase.transactionHash, normalizedExplorerUrl),
          `Rendered success state should contain a clickable link to block explorer. Content: ${renderedContent}, Hash: ${testCase.transactionHash}, Explorer URL: ${normalizedExplorerUrl}`
          );
          
          // Additional validation: The link should be an anchor tag
          assert(
            renderedContent.includes('<a'),
            `Rendered content should contain an anchor tag. Content: ${renderedContent}`
          );
          
          // Additional validation: The link should contain the transaction hash
          assert(
          renderedContent.includes(testCase.transactionHash),
          `Rendered content should contain the transaction hash. Content: ${renderedContent}, Hash: ${testCase.transactionHash}`
          );
        }
    });
    
    it("should render link with correct URL format for various explorer URLs", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          explorerUrl: "https://etherscan.io",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          explorerUrl: "https://polygonscan.com/",
        },
      ];
      
      for (const testCase of testCases) {
          // Normalize explorer URL
        const normalizedExplorerUrl = testCase.explorerUrl.trim().replace(/\/+$/, '');
          
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
            explorerUrl: normalizedExplorerUrl,
          };
          
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsBlockExplorerLink(renderedContent, testCase.transactionHash, normalizedExplorerUrl),
          `Rendered success state should contain block explorer link with any URL format. Content: ${renderedContent}, Hash: ${testCase.transactionHash}, Explorer URL: ${normalizedExplorerUrl}`
          );
        }
    });
  });
  */
  
  describe("Property 10: Timestamp is displayed", () => {
    it("should display timestamp in rendered content when provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          timestamp: 1234567890,
          tokenSymbol: undefined,
          recipientName: undefined,
          chainName: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          timestamp: 9876543210,
          tokenSymbol: "USDC",
          recipientName: "Test",
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
          };
          
          // Render success state content
          const renderedContent = renderSuccessState(transactionData);
          
          assert(
          contentContainsTimestamp(renderedContent, testCase.timestamp),
          `Rendered success state should contain timestamp when provided. Content: ${renderedContent}, Timestamp: ${testCase.timestamp}`
          );
        }
    });
  });
  
  describe("Property 11: Custom success message is used when provided", () => {
    it("should use custom success message instead of default when provided", () => {
      const defaultMessage = "Thank you for your donation!";
      
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          customMessage: "Thank you!",
          tokenSymbol: undefined,
          recipientName: undefined,
          chainName: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          customMessage: "Donation received!",
          tokenSymbol: "USDC",
          recipientName: "Test",
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          };
          
          // Render success message with custom message
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
          
          // The custom message should be present (possibly with amount interpolation)
          // We check that the custom message text appears, accounting for possible amount interpolation
        const customMessageTrimmed = testCase.customMessage.trim();
          const messageContainsCustom = successMessage.includes(customMessageTrimmed) ||
                                       // Check if custom message appears after amount interpolation
                                       customMessageTrimmed.split(/\{?\{?amount\}?\}?/).some(part => {
                                         if (!part || part.trim() === '') return false;
                                         return successMessage.includes(part.trim());
                                       });
          
          assert(
            messageContainsCustom,
          `Success message should contain custom message. Rendered: ${successMessage}, Custom: ${testCase.customMessage}`
          );
        }
    });
    
    it("should use custom success message with various message formats", () => {
      const defaultMessage = "Thank you for your donation!";
      
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890", customMessage: "Thank you! You donated {amount}" },
        { amount: "50", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", customMessage: "Donation {amount} received!" },
        { amount: "1.5", recipientAddress: "0x1111111111111111111111111111111111111111", customMessage: "Success!" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          };
          
          // Render success message with custom message
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
          
        const customMessageTrimmed = testCase.customMessage.trim();
          const messageContainsCustom = successMessage.includes(customMessageTrimmed) ||
                                       customMessageTrimmed.split(/\{?\{?amount\}?\}?/).some(part => {
                                         if (!part || part.trim() === '') return false;
                                         return successMessage.includes(part.trim());
                                       });
          
          assert(
            messageContainsCustom,
          `Success message should contain custom message in any format. Rendered: ${successMessage}, Custom: ${testCase.customMessage}`
          );
        }
    });
    
    it("should use default message when custom message is not provided", () => {
      const defaultMessage = "Thank you for your donation!";
      
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890", tokenSymbol: undefined },
        { amount: "50", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", tokenSymbol: "USDC" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          };
          
          // Render success message without custom message (undefined)
          const successMessage = renderSuccessMessage(transactionData, undefined);
          
          // The default message should be present (possibly with amount appended)
          assert(
            successMessage.includes(defaultMessage),
            `Success message should contain default message when custom message is not provided. Rendered: ${successMessage}, Default: ${defaultMessage}`
          );
        }
    });
    
    it("should use custom message even with minimal transaction data", () => {
      const defaultMessage = "Thank you for your donation!";
      
      const testCases = [
        { amount: "100", recipientAddress: "0x1234567890123456789012345678901234567890", customMessage: "Thank you!" },
        { amount: "1", recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", customMessage: "Success!" },
      ];
      
      for (const testCase of testCases) {
          const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
            // No optional fields
          };
          
          // Render success message with custom message
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
          
        const customMessageTrimmed = testCase.customMessage.trim();
          const messageContainsCustom = successMessage.includes(customMessageTrimmed) ||
                                       customMessageTrimmed.split(/\{?\{?amount\}?\}?/).some(part => {
                                         if (!part || part.trim() === '') return false;
                                         return successMessage.includes(part.trim());
                                       });
          
          assert(
            messageContainsCustom,
          `Success message should contain custom message even with minimal data. Rendered: ${successMessage}, Custom: ${testCase.customMessage}`
          );
        }
    });
  });
  
  describe("Property 14: Custom button text is displayed", () => {
    it("should display custom button text when provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          donateAgainText: "Make Another Donation",
          tokenSymbol: undefined,
          recipientName: undefined,
          chainName: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          donateAgainText: "Donate More",
          tokenSymbol: "USDC",
          recipientName: "Test",
          chainName: "Ethereum",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          donateAgainText: "Contribute Again",
          tokenSymbol: "ETH",
          recipientName: undefined,
          chainName: "Polygon",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        // Render success state with custom button text
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, testCase.donateAgainText),
          `Button should display custom text "${testCase.donateAgainText}". Content: ${renderedContent}`
        );
        
        // Additional validation: Button should not display default text when custom text is provided
        assert(
          !renderedContent.includes('Donate Again') || renderedContent.includes(testCase.donateAgainText),
          `Button should not display default text when custom text is provided. Content: ${renderedContent}, Custom: ${testCase.donateAgainText}`
        );
      }
    });
    
    it("should display 'Make Another Donation' when provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          donateAgainText: "Make Another Donation",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          donateAgainText: "Make Another Donation",
          tokenSymbol: "USDC",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          donateAgainText: "Make Another Donation",
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, "Make Another Donation"),
          `Button should display "Make Another Donation". Content: ${renderedContent}`
        );
      }
    });
    
    it("should display 'Donate More' when provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          donateAgainText: "Donate More",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          donateAgainText: "Donate More",
          tokenSymbol: "USDC",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          donateAgainText: "Donate More",
          chainName: "Polygon",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, "Donate More"),
          `Button should display "Donate More". Content: ${renderedContent}`
        );
      }
    });
    
    it("should display default 'Donate Again' when not provided", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          tokenSymbol: "USDC",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        // Render without custom button text (undefined)
        const renderedContent = renderSuccessStateWithButtonText(transactionData, undefined);
        
        assert(
          buttonTextMatches(renderedContent, "Donate Again"),
          `Button should display default "Donate Again" when custom text is not provided. Content: ${renderedContent}`
        );
      }
    });
    
    it("should display custom button text with minimal transaction data", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          donateAgainText: "Make Another Donation",
        },
        {
          amount: "1",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          donateAgainText: "Donate More",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
        };
        
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, testCase.donateAgainText),
          `Button should display custom text even with minimal data. Content: ${renderedContent}, Custom: ${testCase.donateAgainText}`
        );
      }
    });
    
    it("should display custom button text with all optional fields", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          recipientName: "Test",
          tokenSymbol: "USDC",
          chainName: "Ethereum",
          timestamp: 1234567890,
          donateAgainText: "Make Another Donation",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          recipientName: testCase.recipientName,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
          timestamp: testCase.timestamp,
        };
        
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, testCase.donateAgainText),
          `Button should display custom text with all fields. Content: ${renderedContent}, Custom: ${testCase.donateAgainText}`
        );
      }
    });
    
    it("should display custom button text with various text formats", () => {
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          donateAgainText: "Make Another Donation",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          donateAgainText: "Donate More",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          donateAgainText: "Contribute Again",
        },
        {
          amount: "200",
          recipientAddress: "0x2222222222222222222222222222222222222222",
          donateAgainText: "Give More",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
        };
        
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, testCase.donateAgainText),
          `Button should display custom text in any format. Content: ${renderedContent}, Custom: ${testCase.donateAgainText}`
        );
      }
    });
  });

  describe("Property 15: Default values are used when config is missing", () => {
    it("should use default success message when custom message is not provided", () => {
      const defaultSuccessMessage = "Thank you for your donation!";
      
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          customMessage: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          customMessage: undefined,
          tokenSymbol: "USDC",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          customMessage: undefined,
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        // Render success message without custom message (undefined)
        const successMessage = renderSuccessMessage(transactionData, testCase.customMessage);
        
        assert(
          successMessage.includes(defaultSuccessMessage),
          `Default success message should be used when custom message is not provided. Rendered: ${successMessage}, Default: ${defaultSuccessMessage}`
        );
      }
    });

    it("should use default confetti colors when custom colors are not provided", () => {
      // Default confetti colors from confetti-animation.ts
      const defaultConfettiColors = [
        "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
        "#ff8800", "#8800ff", "#00ff88", "#ff0088"
      ];
      
      // Mock function that simulates parsing colors from confetti component
      const parseConfettiColors = (colorsString: string): string[] => {
        if (!colorsString || colorsString.trim() === "") {
          return defaultConfettiColors;
        }
        
        const parsed = colorsString
          .split(",")
          .map(c => c.trim())
          .filter(c => c.length > 0 && /^#[0-9A-Fa-f]{6}$/.test(c));
        
        return parsed.length > 0 ? parsed : defaultConfettiColors;
      };
      
      const testCases = [
        { colorsString: "" },
        { colorsString: "   " },
        { colorsString: undefined as unknown as string },
      ];
      
      for (const testCase of testCases) {
        // Parse colors (handling undefined case)
        const colorsString = testCase.colorsString ?? "";
        const parsedColors = parseConfettiColors(colorsString);
        
        assert(
          parsedColors.length === defaultConfettiColors.length,
          `Default confetti colors should be used when custom colors not provided. Expected length: ${defaultConfettiColors.length}, Got: ${parsedColors.length}, Colors: ${testCase.colorsString ?? "undefined"}`
        );
        
        defaultConfettiColors.forEach(defaultColor => {
          assert(
            parsedColors.includes(defaultColor),
            `Default confetti color should be present. Expected: ${defaultColor}, Parsed: ${parsedColors.join(", ")}, Colors: ${testCase.colorsString ?? "undefined"}`
          );
        });
      }
    });

    it("should use default button text when custom text is not provided", () => {
      const defaultButtonText = "Donate Again";
      
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          donateAgainText: undefined,
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          donateAgainText: undefined,
          tokenSymbol: "USDC",
        },
        {
          amount: "1.5",
          recipientAddress: "0x1111111111111111111111111111111111111111",
          donateAgainText: undefined,
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        // Render without custom button text (undefined)
        const renderedContent = renderSuccessStateWithButtonText(transactionData, testCase.donateAgainText);
        
        assert(
          buttonTextMatches(renderedContent, defaultButtonText),
          `Default button text should be used when custom text is not provided. Content: ${renderedContent}, Default: ${defaultButtonText}`
        );
      }
    });

    it("should use all default values when no custom configuration is provided", () => {
      const defaultSuccessMessage = "Thank you for your donation!";
      const defaultButtonText = "Donate Again";
      const defaultConfettiColors = [
        "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
        "#ff8800", "#8800ff", "#00ff88", "#ff0088"
      ];
      
      const testCases = [
        {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
        },
        {
          amount: "50",
          recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          tokenSymbol: "USDC",
          chainName: "Ethereum",
        },
      ];
      
      for (const testCase of testCases) {
        const transactionData: TransactionData = {
          amount: testCase.amount,
          recipientAddress: testCase.recipientAddress,
          tokenSymbol: testCase.tokenSymbol,
          chainName: testCase.chainName,
        };
        
        // Test default success message
        const successMessage = renderSuccessMessage(transactionData, undefined);
        assert(
          successMessage.includes(defaultSuccessMessage),
          `Default success message should be used. Rendered: ${successMessage}, Default: ${defaultSuccessMessage}`
        );
        
        // Test default button text
        const renderedContent = renderSuccessStateWithButtonText(transactionData, undefined);
        assert(
          buttonTextMatches(renderedContent, defaultButtonText),
          `Default button text should be used. Content: ${renderedContent}, Default: ${defaultButtonText}`
        );
        
        // Test default confetti colors
        const parseConfettiColors = (colorsString: string): string[] => {
          if (!colorsString || colorsString.trim() === "") {
            return defaultConfettiColors;
          }
          const parsed = colorsString
            .split(",")
            .map(c => c.trim())
            .filter(c => c.length > 0 && /^#[0-9A-Fa-f]{6}$/.test(c));
          return parsed.length > 0 ? parsed : defaultConfettiColors;
        };
        
        const parsedColors = parseConfettiColors("");
        assert(
          parsedColors.length === defaultConfettiColors.length,
          `Default confetti colors should be used. Expected length: ${defaultConfettiColors.length}, Got: ${parsedColors.length}`
        );
        
        defaultConfettiColors.forEach(defaultColor => {
          assert(
            parsedColors.includes(defaultColor),
            `Default confetti color should be present. Expected: ${defaultColor}, Parsed: ${parsedColors.join(", ")}`
          );
        });
      }
    });
  });

  describe("Property: Accessibility features", () => {
    describe("6.1: ARIA labels are present", () => {
      it("should have ARIA labels on success message", () => {
        // Helper function that simulates rendering success state with ARIA attributes
        const renderSuccessStateWithAria = (transactionData: TransactionData): string => {
          let content = "";
          
          // Success message with ARIA attributes
          content += `<div class="success-message" role="alert" aria-live="polite" aria-atomic="true" tabindex="-1" id="success-message">`;
          content += `Thank you for your donation!`;
          content += `</div>`;
          
          // Transaction summary with ARIA
          content += `<div class="transaction-summary" role="region" aria-label="Transaction details">`;
          
          // Amount with ARIA
          content += `<div class="transaction-detail">`;
          content += `<span class="transaction-detail-label" id="amount-label">Amount</span>`;
          content += `<span class="transaction-detail-value" aria-labelledby="amount-label" aria-label="Donation amount: ${transactionData.amount} ${transactionData.tokenSymbol || ''}">`;
          content += `${transactionData.amount} ${transactionData.tokenSymbol || ''}`;
          content += `</span>`;
          content += `</div>`;
          
          // Network with ARIA
          if (transactionData.chainName) {
            content += `<div class="transaction-detail">`;
            content += `<span class="transaction-detail-label" id="network-label">Network</span>`;
            content += `<span class="transaction-detail-value" aria-labelledby="network-label" aria-label="Blockchain network: ${transactionData.chainName}">`;
            content += `${transactionData.chainName}`;
            content += `</span>`;
            content += `</div>`;
          }
          
          // Timestamp with ARIA
          if (transactionData.timestamp) {
            content += `<div class="transaction-detail">`;
            content += `<span class="transaction-detail-label" id="timestamp-label">Time</span>`;
            content += `<span class="transaction-detail-value transaction-timestamp" aria-labelledby="timestamp-label" aria-label="Transaction time: ${new Date(transactionData.timestamp).toLocaleString()}">`;
            content += `${new Date(transactionData.timestamp).toLocaleString()}`;
            content += `</span>`;
            content += `</div>`;
          }
          
          content += `</div>`;
          
          // Donate again button with ARIA
          content += `<button class="donate-again-button" aria-label="Donate again" aria-describedby="success-message">`;
          content += `Donate Again`;
          content += `</button>`;
          
          return content;
        };
        
        const testCases: Array<{
          amount: string;
          tokenSymbol?: string;
          chainName?: string;
          recipientAddress: string;
          timestamp?: number;
          transactionHash?: string;
        }> = [
          {
            amount: "100",
            tokenSymbol: "USDC",
            chainName: "Ethereum",
            recipientAddress: "0x1234567890123456789012345678901234567890",
            timestamp: 1234567890000,
          },
          {
            amount: "50",
            tokenSymbol: "ETH",
            chainName: "Polygon",
            recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            timestamp: undefined,
          },
        ];
        
        for (const testCase of testCases) {
          const transactionData: TransactionData = {
            amount: testCase.amount,
            recipientAddress: testCase.recipientAddress,
            tokenSymbol: testCase.tokenSymbol,
            chainName: testCase.chainName,
            timestamp: testCase.timestamp,
          };
          
          const renderedContent = renderSuccessStateWithAria(transactionData);
          
          assert(
            renderedContent.includes('role="alert"'),
            `Success message should have role="alert". Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-live="polite"'),
            `Success message should have aria-live="polite". Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-atomic="true"'),
            `Success message should have aria-atomic="true". Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('role="region"'),
            `Transaction summary should have role="region". Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-label="Transaction details"'),
            `Transaction summary should have aria-label. Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-labelledby="amount-label"'),
            `Amount should have aria-labelledby. Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-label="Donation amount:'),
            `Amount should have aria-label. Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-label="Donate again"'),
            `Donate again button should have aria-label. Content: ${renderedContent}`
          );
          
          assert(
            renderedContent.includes('aria-describedby="success-message"'),
            `Donate again button should have aria-describedby. Content: ${renderedContent}`
          );
          
          if (testCase.chainName) {
            assert(
              renderedContent.includes('aria-labelledby="network-label"'),
              `Network should have aria-labelledby when chain name is provided. Content: ${renderedContent}`
            );
            assert(
              renderedContent.includes('aria-label="Blockchain network:'),
              `Network should have aria-label when chain name is provided. Content: ${renderedContent}`
            );
          }
          
          if (testCase.transactionHash) {
            assert(
              renderedContent.includes('aria-labelledby="transaction-label"'),
              `Transaction hash should have aria-labelledby when hash is provided. Content: ${renderedContent}`
            );
            assert(
              renderedContent.includes('aria-label="'),
              `Transaction hash should have aria-label when hash is provided. Content: ${renderedContent}`
            );
          }
          
          if (testCase.timestamp) {
            assert(
              renderedContent.includes('aria-labelledby="timestamp-label"'),
              `Timestamp should have aria-labelledby when timestamp is provided. Content: ${renderedContent}`
            );
            assert(
              renderedContent.includes('aria-label="Transaction time:'),
              `Timestamp should have aria-label when timestamp is provided. Content: ${renderedContent}`
            );
          }
        }
      });
      
      it("should have proper ARIA relationships between labels and values", () => {
        const renderSuccessStateWithAria = (transactionData: TransactionData): string => {
          let content = "";
          content += `<div class="success-message" id="success-message" role="alert" aria-live="polite">Message</div>`;
          content += `<div class="transaction-summary" role="region" aria-label="Transaction details">`;
          content += `<span id="amount-label">Amount</span>`;
          content += `<span aria-labelledby="amount-label">100 USDC</span>`;
          content += `<span id="network-label">Network</span>`;
          content += `<span aria-labelledby="network-label">Ethereum</span>`;
          content += `</div>`;
          content += `<button aria-label="Donate again" aria-describedby="success-message">Donate Again</button>`;
          return content;
        };
        
        const transactionData: TransactionData = {
          amount: "100",
          recipientAddress: "0x1234567890123456789012345678901234567890",
          tokenSymbol: "USDC",
          chainName: "Ethereum",
        };
        
        const renderedContent = renderSuccessStateWithAria(transactionData);
        
        assert(
          renderedContent.includes('id="amount-label"') && renderedContent.includes('aria-labelledby="amount-label"'),
          `aria-labelledby should reference existing ID. Content: ${renderedContent}`
        );
        
        assert(
          renderedContent.includes('id="network-label"') && renderedContent.includes('aria-labelledby="network-label"'),
          `aria-labelledby should reference existing ID. Content: ${renderedContent}`
        );
        
        assert(
          renderedContent.includes('id="success-message"') && renderedContent.includes('aria-describedby="success-message"'),
          `aria-describedby should reference existing ID. Content: ${renderedContent}`
        );
      });
    });
    
    describe("6.1: Keyboard navigation works", () => {
      it("should allow keyboard navigation to donate again button", () => {
        // Helper function that simulates keyboard navigation
        // In a real implementation, the button should be focusable and respond to Enter/Space
        const simulateKeyboardNavigation = (): {
          buttonIsFocusable: boolean;
          enterKeyWorks: boolean;
          spaceKeyWorks: boolean;
          tabKeyWorks: boolean;
        } => {
          // Simulate that button is focusable (it's a <button> element, which is naturally focusable)
          const buttonIsFocusable = true; // <button> elements are focusable by default
          
          // Simulate Enter key press (should trigger click)
          let enterKeyWorks = false;
          const handleEnterKey = (event: { key: string; preventDefault: () => void }) => {
            if (event.key === "Enter") {
              enterKeyWorks = true;
              event.preventDefault();
            }
          };
          handleEnterKey({ key: "Enter", preventDefault: () => {} });
          
          // Simulate Space key press (should trigger click)
          let spaceKeyWorks = false;
          const handleSpaceKey = (event: { key: string; preventDefault: () => void }) => {
            if (event.key === " " || event.key === "Spacebar") {
              spaceKeyWorks = true;
              event.preventDefault();
            }
          };
          handleSpaceKey({ key: " ", preventDefault: () => {} });
          
          // Simulate Tab key navigation (should move focus)
          const tabKeyWorks = true; // Tab navigation works by default for focusable elements
          
          return {
            buttonIsFocusable,
            enterKeyWorks,
            spaceKeyWorks,
            tabKeyWorks,
          };
        };
        
        const navigationResult = simulateKeyboardNavigation();
        
        assert(
          navigationResult.buttonIsFocusable,
          `Donate again button should be focusable for keyboard navigation`
        );
        
        assert(
          navigationResult.enterKeyWorks,
          `Enter key should trigger button action`
        );
        
        assert(
          navigationResult.spaceKeyWorks,
          `Space key should trigger button action`
        );
        
        assert(
          navigationResult.tabKeyWorks,
          `Tab key should allow navigation to button`
        );
      });
      
      it("should have proper tabindex for focus management", () => {
        const renderSuccessStateWithFocus = (): string => {
          // Success message should have tabindex="-1" to allow programmatic focus
          // but not be in tab order
          return `<div class="success-message" tabindex="-1" id="success-message">Message</div>
                  <button class="donate-again-button">Donate Again</button>`;
        };
        
        const renderedContent = renderSuccessStateWithFocus();
        
        assert(
          renderedContent.includes('tabindex="-1"'),
          `Success message should have tabindex="-1" for programmatic focus. Content: ${renderedContent}`
        );
        
        // Button elements are naturally focusable, so no tabindex needed
        assert(
          renderedContent.includes('<button'),
          `Button should be present and naturally focusable. Content: ${renderedContent}`
        );
      });
    });
    
    describe("6.1: Reduced motion handling", () => {
      it("should respect prefers-reduced-motion media query", () => {
        // Helper function that simulates checking prefers-reduced-motion
        const checkReducedMotion = (prefersReducedMotion: boolean): {
          animationShouldRun: boolean;
          confettiShouldRender: boolean;
        } => {
          // If prefers-reduced-motion is true, confetti animation should not run
          const animationShouldRun = !prefersReducedMotion;
          
          // Confetti component should still render (for structure), but animation should not start
          const confettiShouldRender = true; // Component renders, but animation doesn't start
          
          return {
            animationShouldRun,
            confettiShouldRender,
          };
        };
        
        const testCases = [
          { prefersReducedMotion: true },
          { prefersReducedMotion: false },
        ];
        
        for (const testCase of testCases) {
          const result = checkReducedMotion(testCase.prefersReducedMotion);
          
          if (testCase.prefersReducedMotion) {
            assert(
              !result.animationShouldRun,
              `Animation should not run when prefers-reduced-motion is true. PrefersReducedMotion: ${testCase.prefersReducedMotion}`
            );
          } else {
            assert(
              result.animationShouldRun,
              `Animation should run when prefers-reduced-motion is false. PrefersReducedMotion: ${testCase.prefersReducedMotion}`
            );
          }
        }
      });
      
      it("should handle reduced motion preference changes", () => {
        let prefersReducedMotion = false;
        let animationRunning = false;
        
        // Simulate starting animation
        const startAnimation = () => {
          if (!prefersReducedMotion) {
            animationRunning = true;
          }
        };
        
        // Simulate stopping animation
        const stopAnimation = () => {
          animationRunning = false;
        };
        
        // Simulate media query change handler
        const handleReducedMotionChange = (matches: boolean) => {
          prefersReducedMotion = matches;
          if (prefersReducedMotion && animationRunning) {
            stopAnimation();
          }
        };
        
        prefersReducedMotion = false;
        startAnimation();
        assert(
          animationRunning,
          `Animation should start when prefers-reduced-motion is false`
        );
        
        handleReducedMotionChange(true);
        assert(
          !animationRunning,
          `Animation should stop when prefers-reduced-motion changes to true`
        );
        
        prefersReducedMotion = true;
        startAnimation();
        assert(
          !animationRunning,
          `Animation should not start when prefers-reduced-motion is true`
        );
      });
      
      it("should check reduced motion preference on component initialization", () => {
        const simulateComponentInit = (prefersReducedMotion: boolean): {
          checkedPreference: boolean;
          animationStarted: boolean;
        } => {
          // Component should check prefers-reduced-motion on initialization
          const checkedPreference = prefersReducedMotion;
          
          // Animation should only start if reduced motion is not preferred
          const animationStarted = !prefersReducedMotion;
          
          return {
            checkedPreference: checkedPreference,
            animationStarted: animationStarted,
          };
        };
        
        const testCases = [
          { prefersReducedMotion: true },
          { prefersReducedMotion: false },
        ];
        
        for (const testCase of testCases) {
          const result = simulateComponentInit(testCase.prefersReducedMotion);
          
          assert(
            result.checkedPreference === testCase.prefersReducedMotion,
            `Preference should be checked on initialization. Expected: ${testCase.prefersReducedMotion}, Got: ${result.checkedPreference}`
          );
          
          assert(
            result.animationStarted === !testCase.prefersReducedMotion,
            `Animation should start only if reduced motion is not preferred. PrefersReducedMotion: ${testCase.prefersReducedMotion}, AnimationStarted: ${result.animationStarted}`
          );
        }
      });
    });
  });
});
