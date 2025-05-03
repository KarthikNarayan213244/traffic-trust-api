
// Contract ABI and addresses for trust ledger
export const ABI = [
  // Event signature for trust updates
  "event TrustUpdated(string indexed vehicleId, uint256 newScore, uint256 timestamp)",
  // Functions for trust management
  "function updateTrustScore(string vehicleId, uint256 newScore) public returns (bool)",
  "function getTrustScore(string vehicleId) public view returns (uint256)",
  "function getTrustLedger() public view returns (tuple(string vehicleId, uint256 score, uint256 timestamp)[])"
];

// Use environment variable or get from localStorage, or default to a test contract address
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 
  localStorage.getItem('env_VITE_CONTRACT_ADDRESS') || 
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Use environment variable or get from localStorage, or default to Goerli public RPC
export const RPC_URL = import.meta.env.VITE_RPC_URL || 
  localStorage.getItem('env_VITE_RPC_URL') || 
  "https://eth-goerli.public.blastapi.io";

// Chain ID (5 for Goerli, 1 for Ethereum mainnet)
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || 
  localStorage.getItem('env_VITE_CHAIN_ID') || 
  "5", 10);
