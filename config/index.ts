// Hardcoded recipient wallet address for all donations
export const RECIPIENT_WALLET =
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" as const;

// Project ID from WalletConnect
export const projectId = import.meta.env.VITE_PROJECT_ID;

// 1inch API Key (optional but recommended for higher rate limits)
export const oneInchApiKey = import.meta.env.VITE_1INCH_API_KEY;

// Define supported network chain IDs
export const supportedChainIds = [
  1, // Ethereum Mainnet
  42161, // Arbitrum
  137, // Polygon
  56, // BSC
  10, // Optimism
  8453, // Base
];
