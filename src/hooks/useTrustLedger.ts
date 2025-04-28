
import { useState, useEffect, useCallback } from "react";
import { fetchTrustLedger } from "@/services/api";
import { getTrustLedger, getConnectedAddress } from "@/services/blockchain";
import { toast } from "@/hooks/use-toast";

export const useTrustLedger = () => {
  const [apiData, setApiData] = useState<any[]>([]);
  const [blockchainData, setBlockchainData] = useState<any[]>([]);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const [isApiError, setIsApiError] = useState<boolean>(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState<boolean>(true);
  const [isBlockchainError, setIsBlockchainError] = useState<boolean>(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [etherscanUrl, setEtherscanUrl] = useState<string>('');

  const loadApiData = useCallback(async () => {
    try {
      setIsApiLoading(true);
      setIsApiError(false);
      const data = await fetchTrustLedger();
      setApiData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching API trust ledger:", error);
      setIsApiError(true);
      toast({
        title: "Error",
        description: "Failed to load trust ledger data from API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApiLoading(false);
    }
  }, []);

  const loadBlockchainData = useCallback(async () => {
    try {
      setIsBlockchainLoading(true);
      setIsBlockchainError(false);
      
      const address = getConnectedAddress();
      setConnectedWallet(address);
      
      const data = await getTrustLedger();
      setBlockchainData(Array.isArray(data) ? data : []);
      
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || 
        localStorage.getItem('env_VITE_CONTRACT_ADDRESS');
      
      if (contractAddress) {
        setEtherscanUrl(`https://goerli.etherscan.io/address/${contractAddress}`);
      }
    } catch (error) {
      console.error("Error fetching blockchain trust ledger:", error);
      setIsBlockchainError(true);
      
      // Don't show toast when failing initially as this is expected when no wallet is connected
      if (isBlockchainLoading === false) {
        toast({
          title: "Error",
          description: "Failed to load blockchain trust ledger. Please connect your wallet and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsBlockchainLoading(false);
    }
  }, [isBlockchainLoading]);

  const handleRefresh = useCallback(() => {
    loadApiData();
    loadBlockchainData();
  }, [loadApiData, loadBlockchainData]);

  // Add auto refresh functionality
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only auto-refresh API data, not blockchain data (which requires manual wallet interaction)
      loadApiData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [loadApiData]);

  // Initial data load
  useEffect(() => {
    loadApiData();
    loadBlockchainData();
    
    // Listen for blockchain events
    const handleAccountsChanged = () => {
      loadBlockchainData();
    };
    
    // Safely access window.ethereum with type checking
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
    
    return undefined;
  }, [loadApiData, loadBlockchainData]);

  return {
    apiData,
    blockchainData,
    isApiLoading,
    isApiError,
    isBlockchainLoading,
    isBlockchainError,
    connectedWallet,
    etherscanUrl,
    handleRefresh,
    loadApiData,
    loadBlockchainData,
  };
};
