
// Blockchain configuration constants

// Chain ID for Goerli testnet
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || "5"; // 5 = Goerli

// Smart contract addresses
export const TRUST_LEDGER_ADDRESS = import.meta.env.VITE_TRUST_LEDGER_ADDRESS || "0x123ABC..."; // Replace with actual address
export const STAKING_ADDRESS = import.meta.env.VITE_STAKING_ADDRESS || "0x456DEF..."; // Replace with actual address

// Default gas parameters
export const GAS_LIMIT = 300000;
export const GAS_PRICE = "5000000000"; // 5 gwei

// Timeouts
export const TX_TIMEOUT = 60000; // 60 seconds
export const CONFIRMATION_BLOCKS = 1; // Number of blocks to wait for confirmation

// Network endpoints
export const ETH_NODE_URL = import.meta.env.VITE_ETH_NODE_URL || "https://goerli.infura.io/v3/YOUR_INFURA_KEY";

// Blockchain explorer URLs
export const EXPLORER_URL = "https://goerli.etherscan.io";

// Contract ABIs
export const TRUST_LEDGER_ABI = [
  // Example ABI format for the TrustLedger contract
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "entityId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256" 
      },
      {
        "internalType": "string",
        "name": "action",
        "type": "string"
      }
    ],
    "name": "updateTrust",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "entityId",
        "type": "string"
      }
    ],
    "name": "getTrustScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const STAKING_ABI = [
  // Example ABI format for the Staking contract
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "entityId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "entityId",
        "type": "string"
      }
    ],
    "name": "getStakedAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// For backward compatibility - make ABI available via both specific names and a generic ABI reference
export const ABI = TRUST_LEDGER_ABI;
export const CONTRACT_ADDRESS = TRUST_LEDGER_ADDRESS;
export const RPC_URL = ETH_NODE_URL;
