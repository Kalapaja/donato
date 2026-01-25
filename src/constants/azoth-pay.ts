import type { Address } from "viem";

/**
 * AzothPay contract address on Polygon
 */
export const AZOTH_PAY_ADDRESS: Address =
  "0x2D69c25c7d37FdEC82C39c90fD0F3D2460ccBa9A";

/**
 * MulticallHandler contract address for Across Protocol on Polygon
 */
export const MULTICALL_HANDLER_ADDRESS: Address =
  "0x924a9f036260DdD5808007E1AA95f08eD08aA569";

/**
 * USDC token address on Polygon
 */
export const POLYGON_USDC_ADDRESS: Address =
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

/**
 * Polygon chain ID
 */
export const POLYGON_CHAIN_ID = 137;

/**
 * Number of seconds in a month (30 days)
 * Used for calculating subscription rate from monthly USD amount
 */
export const SECONDS_PER_MONTH = 30n * 24n * 60n * 60n; // 2,592,000

/**
 * Integrator fee percentage for Across Protocol swaps
 * Expressed as a decimal (0.004 = 0.4%)
 */
export const ACROSS_APP_FEE = 0.004;

/**
 * Address that receives the integrator fee on the destination chain
 */
export const ACROSS_APP_FEE_RECIPIENT: Address =
  "0x2c1d4e0FB7fe91247C4025A4a97694ed7c3BB8CA";

/**
 * AzothPay contract ABI
 * Contains functions required for subscription management
 */
export const AZOTH_ABI = [
  {
    name: "eip712Domain",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "fields", type: "bytes1" },
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "extensions", type: "uint256[]" },
    ],
  },
  {
    name: "bySigAccountNonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "nonce", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "subscribe",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "author", type: "address" },
      { name: "subscriptionRate", type: "uint96" },
      { name: "projectId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "depositFor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
      { name: "isPermit2", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "bySig",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "signer", type: "address" },
      {
        name: "sig",
        type: "tuple",
        components: [
          { name: "traits", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "subscriptions",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
    ],
    outputs: [
      { name: "", type: "bool" },
      { name: "encodedRates", type: "uint256" },
    ],
  },
] as const;

/**
 * Standard ERC20 ABI for token approval
 */
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
