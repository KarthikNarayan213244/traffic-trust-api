
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { 
  TRUST_LEDGER_ABI, 
  TRUST_LEDGER_ADDRESS,
  STAKING_ABI,
  STAKING_ADDRESS,
  ETH_NODE_URL 
} from './constants';

// Shared state for the blockchain connection
let provider;
let trustLedgerContract;
let stakingContract;
let signer;
let connectedAddress = null;
let currentContract = null;
let isInitialized = false;

// Initialize a read-only provider for non-wallet operations
export const initReadonlyProvider = () => {
  try {
    if (isInitialized) {
      console.log("Provider already initialized");
      return true;
    }
    
    // Use a JsonRpcProvider for read-only operations
    const readonlyProvider = new ethers.providers.JsonRpcProvider(ETH_NODE_URL);
    console.log("Initialized readonly provider with RPC URL:", ETH_NODE_URL);
    trustLedgerContract = new ethers.Contract(TRUST_LEDGER_ADDRESS, TRUST_LEDGER_ABI, readonlyProvider);
    stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, readonlyProvider);
    currentContract = stakingContract;
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize read-only provider:", error);
    return false;
  }
};

export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      console.log("MetaMask not installed, initializing read-only provider");
      initReadonlyProvider();
      throw new Error("MetaMask not installed. Please install MetaMask to connect your wallet.");
    }
    
    // Reset provider to ensure we're getting a fresh connection
    console.log("Attempting to connect wallet...");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    try {
      // Request account access - this will prompt the user to connect their wallet if not connected
      console.log("Requesting accounts...");
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }
      
      // Get the signer and address
      signer = provider.getSigner();
      connectedAddress = await signer.getAddress();
      console.log("Connected to address:", connectedAddress);
      
      // Initialize contracts with signer for sending transactions
      trustLedgerContract = new ethers.Contract(TRUST_LEDGER_ADDRESS, TRUST_LEDGER_ABI, signer);
      stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      currentContract = stakingContract;
      isInitialized = true;
      
      // Verify connection to Goerli
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.name, network.chainId);
      
      // Check for Goerli network (chainId 5)
      if (network.chainId !== 5) {
        console.log("Not on Goerli network, attempting to switch...");
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x5' }], // 0x5 is the chainId for Goerli
          });
          
          // Re-initialize after network switch
          provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          trustLedgerContract = new ethers.Contract(TRUST_LEDGER_ADDRESS, TRUST_LEDGER_ABI, signer);
          stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
          currentContract = stakingContract;
          
          // Verify network switch
          const updatedNetwork = await provider.getNetwork();
          console.log("After switch, connected to:", updatedNetwork.name, updatedNetwork.chainId);
          
          if (updatedNetwork.chainId === 5) {
            toast({
              title: "Network Switched",
              description: "Successfully switched to Goerli testnet",
            });
          } else {
            throw new Error("Failed to switch to Goerli network");
          }
        } catch (switchError) {
          console.error("Failed to switch network:", switchError);
          toast({
            title: "Network Warning",
            description: "You're not connected to Goerli testnet. Some features may not work properly.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
      });
      
      return connectedAddress;
    } catch (requestError) {
      console.error("Error requesting accounts:", requestError);
      
      if (requestError.code === 4001) {
        throw new Error("Connection rejected by user");
      } else if (requestError.code === -32002) {
        throw new Error("Connection request already pending. Please check MetaMask.");
      } else {
        throw new Error(`Failed to connect: ${requestError.message}`);
      }
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
      console.log("Wallet disconnected");
      connectedAddress = null;
      isInitialized = false;
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } else {
      connectedAddress = accounts[0];
      console.log("Switched to account:", connectedAddress);
      toast({
        title: "Account Changed",
        description: `Connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
      });
    }
  });

  window.ethereum.on('chainChanged', (chainId) => {
    console.log("Chain changed to:", chainId);
    // Reload the page when chain changes to avoid issues
    window.location.reload();
  });
}

// Initialize read-only provider on module load
if (typeof window !== 'undefined') {
  initReadonlyProvider();
}

// Select which contract to use - TrustLedger or Staking
export const useStakingContract = () => {
  currentContract = stakingContract;
};

export const useTrustLedgerContract = () => {
  currentContract = trustLedgerContract;
};

// Get the connected address without triggering a wallet connection
export const getConnectedAddress = () => {
  return connectedAddress;
};

// Export contract and provider for other modules
export const getContract = () => currentContract || stakingContract;
export const getTrustLedgerContract = () => trustLedgerContract;
export const getStakingContract = () => stakingContract;
export const getSigner = () => signer;
export const getProvider = () => provider;
