
import { useState, useEffect } from "react";
import { fetchTrustLedger } from "@/services/api";
import { getTrustLedger, getConnectedAddress } from "@/services/blockchain";
import { toast } from "@/hooks/use-toast";

export const useTrustLedger = () => {
  const [apiData, setApiData] = useState<any[]>([]);
  const [blockchainData, setBlockchainData] = useState<any[]>([]);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const [isApiError, setIsApiError] = useState<boolean>(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState<boolean>(false);
  const [isBlockchainError, setIsBlockchainError] = useState<boolean>(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [etherscanUrl, setEtherscanUrl] = useState<string>('');

  const loadApiData = async () => {
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
  };

  const loadBlockchainData = async () => {
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
      toast({
        title: "Error",
        description: "Failed to load blockchain trust ledger. Please connect your wallet and try again.",
        variant: "destructive",
      });
    } finally {
      setIsBlockchainLoading(false);
    }
  };

  const handleRefresh = () => {
    loadApiData();
    loadBlockchainData();
  };

  useEffect(() => {
    loadApiData();
    loadBlockchainData();
  }, []);

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
