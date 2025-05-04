
// Contract ABI and addresses
export const ABI = [
  "function stakeTrust(string vehicleId, uint256 amount) public returns (bool)",
  "function getTrustLedger() public view returns (tuple(string vehicleId, uint256 amount, uint256 timestamp)[])"
];

// Use environment variable or get from localStorage, or default to a test contract address
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 
  localStorage.getItem('env_VITE_CONTRACT_ADDRESS') || 
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Use environment variable or get from localStorage, or default to Goerli public RPC
export const RPC_URL = import.meta.env.VITE_RPC_URL || 
  localStorage.getItem('env_VITE_RPC_URL') || 
  "https://eth-goerli.public.blastapi.io";
