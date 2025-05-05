
import { useState, useEffect } from "react";
import { fetchVehicleTrustLedger, getMockVehicleTrustLedger } from "@/services/api/vehicleTrustLedger";
import { toast } from "@/hooks/use-toast";
import { stakeTrust, getTrustLedger } from "@/services/blockchain";

export const useVehicleTrustLedger = () => {
  const [vehicleLedgerData, setVehicleLedgerData] = useState<any[]>([]);
  const [blockchainLedgerData, setBlockchainLedgerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState<boolean>(false);
  const [isBlockchainError, setIsBlockchainError] = useState<boolean>(false);
  const [etherscanUrl, setEtherscanUrl] = useState<string>('');

  const loadVehicleLedgerData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const data = await fetchVehicleTrustLedger({ limit: 1000 });
      console.log("Vehicle trust ledger data loaded:", data?.length || 0);
      
      if (!data || data.length === 0) {
        // Generate mock data if no real data is available
        const mockData = getMockVehicleTrustLedger();
        setVehicleLedgerData(mockData);
        console.log("Using mock vehicle trust ledger data");
      } else {
        setVehicleLedgerData(data);
      }
    } catch (error) {
      console.error("Error fetching vehicle trust ledger:", error);
      setIsError(true);
      
      // Use mock data on error
      const mockData = getMockVehicleTrustLedger();
      setVehicleLedgerData(mockData);
      
      toast({
        title: "Data Issue",
        description: "Using cached vehicle trust data due to connection issue.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      setIsBlockchainLoading(true);
      setIsBlockchainError(false);
      
      // Get blockchain transactions for vehicles only
      const allData = await getTrustLedger();
      
      if (!Array.isArray(allData) || allData.length === 0) {
        throw new Error("No blockchain data returned");
      }
      
      // Filter for vehicle-related entries (not RSUs)
      const vehicleData = allData.filter(entry => 
        entry.target_type !== 'RSU' && 
        (!entry.target_id || !entry.target_id.includes('RSU')) &&
        entry.vehicle_id !== 'SYSTEM'
      );
      
      console.log("Blockchain vehicle trust ledger data loaded:", vehicleData.length);
      setBlockchainLedgerData(vehicleData);
      
      // Set Etherscan URL
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || 
        localStorage.getItem('env_VITE_CONTRACT_ADDRESS') || 
        '0x123abc'; // Fallback for demo purposes
      
      setEtherscanUrl(contractAddress ? 
        `https://goerli.etherscan.io/address/${contractAddress}` : 
        'https://goerli.etherscan.io');
    } catch (error) {
      console.error("Error fetching blockchain vehicle trust ledger:", error);
      setIsBlockchainError(true);
    } finally {
      setIsBlockchainLoading(false);
    }
  };

  const handleRefresh = () => {
    loadVehicleLedgerData();
    loadBlockchainData();
  };

  useEffect(() => {
    loadVehicleLedgerData();
    loadBlockchainData();
  }, []);

  return {
    vehicleLedgerData,
    blockchainLedgerData,
    isLoading,
    isError,
    isBlockchainLoading,
    isBlockchainError,
    etherscanUrl,
    handleRefresh,
    loadVehicleLedgerData,
    loadBlockchainData,
  };
};
