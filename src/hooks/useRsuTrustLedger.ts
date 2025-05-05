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
      
      let data: any[] = [];
      
      // First try to fetch directly from Supabase with the target_type filter
      try {
        data = await fetchFromSupabase('trustLedger', { 
          filters: { target_type: 'RSU' },
          limit: 1000,
          orderBy: { field: 'timestamp', ascending: false }
        });
        
        console.log("Fetched RSU trust data with target_type filter:", data?.length || 0);
      } catch (error) {
        console.warn("Could not filter by target_type, trying alternative approach:", error);
        
        // Try to get all data and filter client-side
        const allData = await fetchFromSupabase('trustLedger', {
          limit: 1000,
          orderBy: { field: 'timestamp', ascending: false }
        });
        
        // Filter for RSU-related entries
        data = allData.filter(entry => 
          (entry.target_type && entry.target_type === 'RSU') || 
          (entry.target_id && entry.target_id.includes('RSU')) ||
          (entry.details && entry.details.toLowerCase().includes('rsu')) ||
          (entry.action && 
            (entry.action === 'RSU_QUARANTINED' || 
             entry.action === 'ATTACK_DETECTED' || 
             entry.action.includes('RSU')))
        );
        
        console.log(`Fetched and filtered ${allData.length} trust entries to ${data.length} RSU entries`);
      }
      
      if (data.length === 0) {
        console.warn("No RSU trust ledger data found, creating mock data");
        // Create some mock data for first-time users
        data = [
          {
            id: "t1",
            tx_id: "0x1234567890abcdef1234567890abcdef12345678",
            timestamp: new Date().toISOString(),
            vehicle_id: "SYSTEM",
            action: "TRUST_UPDATE",
            old_value: 92,
            new_value: 87,
            details: "First RSU Trust Entry",
            target_id: "RSU-001",
            target_type: "RSU"
          }
        ];
      }
      
      setRsuLedgerData(data);
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
