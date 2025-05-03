
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { ABI, CONTRACT_ADDRESS, RPC_URL, CHAIN_ID } from './constants';

// Shared state for the blockchain connection
let provider;
let contract;
let signer;
let connectedAddress = null;
let trustScoreCache = new Map(); // Cache of vehicle trust scores
let trustUpdateListeners = new Set(); // Listeners for trust updates

// Initialize a read-only provider for non-wallet operations
export const initReadonlyProvider = () => {
  try {
    // Use a JsonRpcProvider for read-only operations
    const readonlyProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
    console.log("Initialized readonly provider with RPC URL:", RPC_URL);
    
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readonlyProvider);
    
    // Set up event listener for trust updates
    setupTrustUpdateListener(contract);
    
    return true;
  } catch (error) {
    console.error("Failed to initialize read-only provider:", error);
    return false;
  }
};

// Setup event listener for trust updates
const setupTrustUpdateListener = (contractInstance) => {
  if (!contractInstance) return;
  
  try {
    console.log("Setting up trust update listener...");
    contractInstance.on("TrustUpdated", (vehicleId, newScore, timestamp, event) => {
      console.log(`Trust updated for ${vehicleId}: ${newScore}`);
      const scoreValue = ethers.BigNumber.isBigNumber(newScore) ? newScore.toNumber() : Number(newScore);
      
      // Update the cache
      trustScoreCache.set(vehicleId, {
        score: scoreValue,
        timestamp: ethers.BigNumber.isBigNumber(timestamp) ? 
          timestamp.toNumber() : Number(timestamp)
      });
      
      // Notify all listeners
      trustUpdateListeners.forEach(listener => {
        try {
          listener({
            vehicleId,
            score: scoreValue,
            timestamp: ethers.BigNumber.isBigNumber(timestamp) ? 
              timestamp.toNumber() : Number(timestamp),
            transactionHash: event.transactionHash
          });
        } catch (err) {
          console.error("Error notifying trust update listener:", err);
        }
      });
    });
  } catch (error) {
    console.error("Failed to set up trust update listener:", error);
  }
};

export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      console.log("MetaMask not installed");
      throw new Error("MetaMask not installed");
    }
    
    // Reset provider to ensure we're getting a fresh connection
    console.log("Attempting to connect wallet...");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    try {
      // Request account access - this will prompt the user to connect their wallet if not connected
      console.log("Requesting accounts...");
      await provider.send("eth_requestAccounts", []);
      
      // Get the signer and address
      signer = provider.getSigner();
      connectedAddress = await signer.getAddress();
      console.log("Connected to address:", connectedAddress);
      
      // Initialize contract with signer for sending transactions
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      // Verify connection to correct network
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.name, network.chainId);
      
      // Check for correct network
      if (network.chainId !== CHAIN_ID) {
        toast({
          title: "Wrong Network",
          description: "Please connect to the correct network in your wallet",
          variant: "destructive",
        });
        
        // Try to switch to correct network
        try {
          console.log("Attempting to switch network...");
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
          
          // Re-initialize after network switch
          provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
          
          // Get the network again to confirm switch
          const updatedNetwork = await provider.getNetwork();
          console.log("After switch, connected to:", updatedNetwork.name, updatedNetwork.chainId);
          if (updatedNetwork.chainId !== CHAIN_ID) {
            throw new Error("Failed to switch to correct network");
          }
        } catch (switchError) {
          console.error("Failed to switch network:", switchError);
          toast({
            title: "Network Warning",
            description: "You're not connected to the correct network. Some features may not work properly.",
            variant: "warning",
          });
        }
      }
      
      // Set up event listener for trust updates
      setupTrustUpdateListener(contract);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)} on ${network.name}`,
      });
      
      return connectedAddress;
    } catch (requestError) {
      console.error("Error requesting accounts:", requestError);
      throw new Error("User rejected the connection request");
    }
  } catch (error) {
    console.error("Error connecting wallet:", error);
    
    // Initialize read-only provider as fallback
    console.log("Falling back to read-only provider");
    initReadonlyProvider();
    
    connectedAddress = null;
    throw error;
  }
};

// Listen for account changes
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      console.log("Wallet disconnected");
      connectedAddress = null;
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } else {
      // User switched accounts
      connectedAddress = accounts[0];
      console.log("Switched to account:", connectedAddress);
      toast({
        title: "Account Changed",
        description: `Connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
      });
    }
  });
}

// Get the connected address without triggering a wallet connection
export const getConnectedAddress = () => {
  return connectedAddress;
};

// Add a listener for trust updates
export const addTrustUpdateListener = (listener) => {
  trustUpdateListeners.add(listener);
  return () => trustUpdateListeners.delete(listener);
};

// Get cached trust score or fetch from blockchain
export const getTrustScore = async (vehicleId) => {
  if (!vehicleId) return null;
  
  // Check if we have a cached score
  if (trustScoreCache.has(vehicleId)) {
    return trustScoreCache.get(vehicleId).score;
  }
  
  // If no cache, try to fetch from blockchain
  try {
    if (!contract) {
      initReadonlyProvider();
      if (!contract) return null;
    }
    
    const score = await contract.getTrustScore(vehicleId);
    const scoreValue = ethers.BigNumber.isBigNumber(score) ? score.toNumber() : Number(score);
    
    // Update cache
    trustScoreCache.set(vehicleId, {
      score: scoreValue,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    return scoreValue;
  } catch (error) {
    console.error(`Error fetching trust score for ${vehicleId}:`, error);
    return null;
  }
};

// Export contract and provider for other modules
export const getContract = () => contract;
export const getSigner = () => signer;
export const getProvider = () => provider;

// Initialize read-only provider on module load
initReadonlyProvider();
