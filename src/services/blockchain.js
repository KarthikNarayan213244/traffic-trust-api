
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";

// ABI for the TrustLedger contract
const ABI = [
  "function stakeTrust(string vehicleId, uint256 amount) public returns (bool)",
  "function getTrustLedger() public view returns (tuple(string vehicleId, uint256 amount, uint256 timestamp)[])"
];

// Use environment variable or get from localStorage, or default to a test contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || localStorage.getItem('env_VITE_CONTRACT_ADDRESS') || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Use environment variable or get from localStorage, or default to Goerli public RPC
const RPC_URL = import.meta.env.VITE_RPC_URL || localStorage.getItem('env_VITE_RPC_URL') || "https://eth-goerli.public.blastapi.io";

let provider;
let contract;
let signer;
let connectedAddress = null;

export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask extension to connect your wallet",
        variant: "destructive",
      });
      throw new Error("MetaMask not installed");
    }
    
    // Reset provider to ensure we're getting a fresh connection
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request account access - this will prompt the user to connect their wallet if not connected
    await provider.send("eth_requestAccounts", []);
    
    // Get the signer and address
    signer = provider.getSigner();
    connectedAddress = await signer.getAddress();
    
    // Initialize contract with signer for sending transactions
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    
    // Verify connection to Goerli
    try {
      const network = await provider.getNetwork();
      
      // Check for Goerli network (chainId 5)
      if (network.chainId !== 5) {
        toast({
          title: "Wrong Network",
          description: "Please connect to Goerli testnet in your wallet",
          variant: "destructive",
        });
        
        // Try to switch to Goerli
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x5' }], // 0x5 is the chainId for Goerli
          });
          
          // Re-initialize after network switch
          provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        } catch (switchError) {
          // Network switching failed, return null
          connectedAddress = null;
          return null;
        }
      }
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)} on Goerli`,
      });
      
      return connectedAddress;
    } catch (networkError) {
      console.error("Error checking network:", networkError);
      toast({
        title: "Network Error",
        description: "Could not verify network. Please ensure you're connected to Ethereum.",
        variant: "destructive",
      });
      return connectedAddress;
    }
  } catch (error) {
    console.error("Error connecting wallet:", error);
    toast({
      title: "Connection Failed",
      description: error.message || "Failed to connect wallet. Please try again.",
      variant: "destructive",
    });
    connectedAddress = null;
    throw error;
  }
};

// Get the connected address without triggering a wallet connection
export const getConnectedAddress = () => {
  return connectedAddress;
};

export const getTrustLedger = async () => {
  try {
    // Initialize readonly provider if not already connected with a wallet
    if (!contract) {
      const initialized = initReadonlyProvider();
      if (!initialized) {
        throw new Error("Failed to initialize blockchain connection");
      }
    }
    
    // Try to get data from the actual contract
    try {
      const ledger = await contract.getTrustLedger();
      
      // Transform the data to match our application format
      return ledger.map((entry, index) => ({
        tx_id: `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}${index}`,
        vehicle_id: entry.vehicleId,
        action: "Trust Stake",
        old_value: 0, 
        new_value: parseInt(ethers.utils.formatEther(entry.amount)) * 100,
        timestamp: new Date(entry.timestamp.toNumber() * 1000).toISOString(),
      }));
    } catch (contractError) {
      console.warn("Contract call failed, using mock data:", contractError);
      throw contractError; // Let it fall through to the mock data
    }
  } catch (error) {
    console.error("Error getting trust ledger:", error);
    
    // Return mock data if contract call fails
    return [
      { tx_id: "0x7a23b5ef8742c16d3b6eb0b42128f69081592bad", vehicle_id: "TS07-2345-AB", action: "Trust Stake", old_value: 90, new_value: 95, timestamp: new Date().toISOString() },
      { tx_id: "0x5bf1c6dde8dc48c21799e23751b612acf4d6d93c", vehicle_id: "TS08-5678-CD", action: "Trust Stake", old_value: 95, new_value: 88, timestamp: new Date(Date.now() - 86400000).toISOString() }
    ];
  }
};

export const stakeTrust = async (vehicleId, amount) => {
  try {
    if (!contract || !signer) {
      await connectWallet();
      if (!contract || !signer) {
        throw new Error("Wallet connection required for staking");
      }
    }
    
    const amountInWei = ethers.utils.parseEther(amount.toString());
    const tx = await contract.stakeTrust(vehicleId, amountInWei);
    
    toast({
      title: "Transaction Submitted",
      description: `Staking ${amount} ETH for ${vehicleId}. Please wait for confirmation.`,
    });
    
    await tx.wait();
    
    toast({
      title: "Stake Successful",
      description: `Successfully staked ${amount} ETH for vehicle ${vehicleId}`,
    });
    
    return true;
  } catch (error) {
    console.error("Error staking trust:", error);
    toast({
      title: "Stake Failed",
      description: `Failed to stake trust: ${error.message || "Unknown error"}`,
      variant: "destructive",
    });
    
    // If we're in development or test environment, simulate success
    if (import.meta.env.DEV || import.meta.env.MODE === 'test' || window.location.hostname === 'localhost') {
      console.log("Development mode: Simulating successful stake");
      return simulateStakeTrust(vehicleId, amount);
    }
    
    throw error;
  }
};

// Simulate blockchain data when contract is unavailable
export const simulateStakeTrust = async (vehicleId, amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      toast({
        title: "Simulation Successful",
        description: `Simulated staking ${amount} ETH for vehicle ${vehicleId}`,
      });
      resolve(true);
    }, 2000);
  });
};
