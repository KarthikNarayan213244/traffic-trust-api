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
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readonlyProvider);
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
      throw new Error("MetaMask not installed");
    }
    
    // Reset provider to ensure we're getting a fresh connection
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    try {
      // Request account access - this will prompt the user to connect their wallet if not connected
      await provider.send("eth_requestAccounts", []);
      
      // Get the signer and address
      signer = provider.getSigner();
      connectedAddress = await signer.getAddress();
      
      // Initialize contract with signer for sending transactions
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      // Verify connection to Goerli
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
          
          // Get the network again to confirm switch
          const updatedNetwork = await provider.getNetwork();
          if (updatedNetwork.chainId !== 5) {
            throw new Error("Failed to switch to Goerli network");
          }
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
    initReadonlyProvider();
    
    connectedAddress = null;
    throw error;
  }
};

// Get the connected address without triggering a wallet connection
export const getConnectedAddress = () => {
  return connectedAddress;
};

// Export contract and provider for other modules
export const getContract = () => contract;
export const getSigner = () => signer;
export const getProvider = () => provider;
