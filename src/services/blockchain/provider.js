
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { ABI, CONTRACT_ADDRESS, RPC_URL } from './constants';

// Shared state for the blockchain connection
let provider;
let contract;
let signer;
let connectedAddress = null;

// Initialize a read-only provider for non-wallet operations
export const initReadonlyProvider = () => {
  try {
    // Use a JsonRpcProvider for read-only operations
    const readonlyProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
    console.log("Initialized readonly provider with RPC URL:", RPC_URL);
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readonlyProvider);
    return true;
  } catch (error) {
    console.error("Failed to initialize read-only provider:", error);
    return false;
  }
};

// Check if MetaMask is available
export const isMetaMaskAvailable = () => {
  return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
};

export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!isMetaMaskAvailable()) {
      console.log("MetaMask not installed");
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask browser extension to connect your wallet.",
        variant: "destructive",
      });
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
      
      // Verify connection to Goerli
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.name, network.chainId);
      
      // Check for Goerli network (chainId 5)
      if (network.chainId !== 5) {
        toast({
          title: "Wrong Network",
          description: "Please connect to Goerli testnet in your wallet",
          variant: "warning",
        });
        
        // Try to switch to Goerli
        try {
          console.log("Attempting to switch to Goerli network...");
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x5' }], // 0x5 is the chainId for Goerli
          });
          
          // Re-initialize after network switch
          provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
          
          // Get the network again to confirm switch
          const updatedNetwork = await provider.getNetwork();
          console.log("After switch, connected to:", updatedNetwork.name, updatedNetwork.chainId);
          
          toast({
            title: "Network Changed",
            description: `Successfully switched to ${updatedNetwork.name}`,
          });
        } catch (switchError) {
          console.error("Failed to switch network:", switchError);
          // Keep the address but note that we're not on Goerli
          toast({
            title: "Network Warning",
            description: "You're not connected to Goerli testnet. Some features may not work properly.",
            variant: "warning",
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
      throw new Error(requestError.message || "User rejected the connection request");
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

// Set up event listeners for wallet connection changes
export const setupWalletEventListeners = () => {
  if (isMetaMaskAvailable()) {
    // Listen for account changes
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

    // Listen for network changes
    window.ethereum.on('chainChanged', (chainId) => {
      console.log("Network changed to:", chainId);
      
      // Force a page refresh to ensure all components update
      window.location.reload();
    });
  }
};

// Call this function when the app initializes
if (typeof window !== 'undefined') {
  setupWalletEventListeners();
}

// Get the connected address without triggering a wallet connection
export const getConnectedAddress = () => {
  return connectedAddress;
};

// Export contract and provider for other modules
export const getContract = () => contract;
export const getSigner = () => signer;
export const getProvider = () => provider;
