
import { useState, useEffect } from "react";
import { fetchRsuTrustEvents, fetchRsuAnomalies } from "@/services/api/rsuTrustEvents";
import { toast } from "@/hooks/use-toast";
import { getTrustLedger } from "@/services/blockchain";

export const useRsuTrustLedger = () => {
  const [rsuLedgerData, setRsuLedgerData] = useState<any[]>([]);
  const [blockchainLedgerData, setBlockchainLedgerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState<boolean>(false);
  const [isBlockchainError, setIsBlockchainError] = useState<boolean>(false);
  const [etherscanUrl, setEtherscanUrl] = useState<string>('');

  const loadRsuLedgerData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      // Fetch both RSU trust events and anomalies
      const [trustEvents, anomalies] = await Promise.all([
        fetchRsuTrustEvents({ limit: 1000 }),
        fetchRsuAnomalies({ limit: 1000 })
      ]);
      
      console.log("RSU trust events loaded:", trustEvents?.length || 0);
      console.log("RSU anomalies loaded:", anomalies?.length || 0);
      
      // Combine and format the data
      const combinedData = [
        ...trustEvents.map(event => ({
          ...event,
          timestamp: event.timestamp,
          attack_type: event.attack_type,
          severity: event.severity,
          old_trust: event.old_trust,
          new_trust: event.new_trust,
          details: event.details
        })),
        ...anomalies.map(anomaly => ({
          id: anomaly.id,
          rsu_id: anomaly.vehicle_id, // Map vehicle_id to rsu_id for display
          timestamp: anomaly.timestamp,
          attack_type: anomaly.type,
          severity: anomaly.severity,
          details: anomaly.message
        }))
      ];
      
      // Sort by timestamp descending
      combinedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRsuLedgerData(combinedData);
      
      if (combinedData.length === 0) {
        console.log("No RSU trust ledger data found");
      }
    } catch (error) {
      console.error("Error fetching RSU trust ledger:", error);
      setIsError(true);
      
      toast({
        title: "Data Loading Error",
        description: "Failed to load RSU trust ledger data. Try generating some events first.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      setIsBlockchainLoading(true);
      setIsBlockchainError(false);
      
      // Get blockchain transactions specifically for RSUs
      const allData = await getTrustLedger();
      
      if (!Array.isArray(allData) || allData.length === 0) {
        console.log("No blockchain data returned");
        setBlockchainLedgerData([]);
        return;
      }
      
      // Process the data and filter for RSU-related entries
      const rsuData = allData.filter(entry => {
        // Include entries with RSU target_type
        if (entry.target_type === 'RSU') return true;
        
        // Or entries with RSU in the target_id
        if (entry.target_id && entry.target_id.includes('RSU')) return true;
        
        // Or with details mentioning RSU
        if (entry.details && entry.details.toLowerCase().includes('rsu')) return true;
        
        return false;
      });
      
      console.log("Blockchain RSU trust ledger data loaded:", rsuData.length);
      setBlockchainLedgerData(rsuData);
      
      // Set Etherscan URL
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || 
        localStorage.getItem('env_VITE_CONTRACT_ADDRESS') || 
        '0x123abc'; // Fallback for demo purposes
      
      setEtherscanUrl(contractAddress ? 
        `https://goerli.etherscan.io/address/${contractAddress}` : 
        'https://goerli.etherscan.io');
    } catch (error) {
      console.error("Error fetching blockchain RSU trust ledger:", error);
      setIsBlockchainError(true);
      
      toast({
        title: "Blockchain Connection",
        description: "Please connect your wallet to see live blockchain data.",
        variant: "default",
      });
    } finally {
      setIsBlockchainLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing RSU trust ledger data...");
    loadRsuLedgerData();
    loadBlockchainData();
  };

  useEffect(() => {
    loadRsuLedgerData();
    loadBlockchainData();
  }, []);

  return {
    rsuLedgerData,
    blockchainLedgerData,
    isLoading,
    isError,
    isBlockchainLoading,
    isBlockchainError,
    etherscanUrl,
    handleRefresh,
    loadRsuLedgerData,
    loadBlockchainData,
  };
};
