
import { useState, useEffect } from "react";
import { fetchFromSupabase } from "@/services/api/supabase/fetch";
import { toast } from "@/hooks/use-toast";
import { stakeTrust, getTrustLedger } from "@/services/blockchain";

export const useRsuTrustLedger = () => {
  const [rsuLedgerData, setRsuLedgerData] = useState<any[]>([]);
  const [blockchainLedgerData, setBlockchainLedgerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState<boolean>(false);
  const [isBlockchainError, setIsBlockchainError] = useState<boolean>(false);

  const loadRsuLedgerData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      // Fetch RSU-specific trust ledger entries
      const data = await fetchFromSupabase('trustLedger', { 
        filters: { target_type: 'RSU' },
        limit: 1000,
        orderBy: { field: 'timestamp', ascending: false }
      });
      
      console.log("RSU trust ledger data loaded:", data?.length || 0);
      setRsuLedgerData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching RSU trust ledger:", error);
      setIsError(true);
      toast({
        title: "Error",
        description: "Failed to load RSU trust ledger data. Please try again.",
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
      
      // Only get RSU-related blockchain transactions
      const allData = await getTrustLedger();
      const rsuData = Array.isArray(allData) 
        ? allData.filter(entry => entry.target_type === 'RSU' || !entry.vehicle_id)
        : [];
      
      console.log("Blockchain RSU trust ledger data loaded:", rsuData.length);
      setBlockchainLedgerData(rsuData);
    } catch (error) {
      console.error("Error fetching blockchain RSU trust ledger:", error);
      setIsBlockchainError(true);
      toast({
        title: "Error",
        description: "Failed to load blockchain RSU trust data. Please connect your wallet and try again.",
        variant: "destructive",
      });
    } finally {
      setIsBlockchainLoading(false);
    }
  };

  const handleRefresh = () => {
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
    handleRefresh,
    loadRsuLedgerData,
    loadBlockchainData,
  };
};
