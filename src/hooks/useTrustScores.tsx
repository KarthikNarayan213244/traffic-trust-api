
import { useState, useEffect, useCallback } from 'react';
import { 
  addTrustUpdateListener, 
  getTrustScore, 
  getTrustLedger,
  connectWallet
} from '@/services/blockchain';
import { toast } from '@/hooks/use-toast';

interface TrustUpdate {
  vehicleId: string;
  score: number;
  timestamp: number;
  transactionHash: string;
}

interface UseTrustScoresOptions {
  autoConnect?: boolean;
  batchSize?: number;
  onUpdate?: (update: TrustUpdate) => void;
}

export const useTrustScores = (vehicleIds: string[] = [], options: UseTrustScoresOptions = {}) => {
  const [trustScores, setTrustScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<TrustUpdate | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState<boolean>(false);

  const { autoConnect = true, batchSize = 50, onUpdate } = options;

  // Connect to the blockchain
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      await connectWallet();
      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      console.error("Error connecting to blockchain:", err);
      setError(err);
      setIsConnected(false);
      
      toast({
        title: "Blockchain Connection Failed",
        description: err.message || "Failed to connect to blockchain. Check your network and wallet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load trust scores for specific vehicles
  const loadTrustScores = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    
    setIsLoading(true);
    
    const scores: Record<string, number> = {};
    const batchSize = 20; // Process in small batches to avoid overwhelming the network
    
    try {
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const promises = batch.map(async (id) => {
          try {
            const score = await getTrustScore(id);
            if (score !== null) {
              scores[id] = score;
            }
          } catch (err) {
            console.error(`Error fetching trust score for ${id}:`, err);
          }
        });
        
        await Promise.all(promises);
        
        // If this isn't the last batch, wait a bit to avoid rate limiting
        if (i + batchSize < ids.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setTrustScores(prev => ({ ...prev, ...scores }));
      setError(null);
    } catch (err: any) {
      console.error("Error loading trust scores:", err);
      setError(err);
      
      toast({
        title: "Trust Score Loading Failed",
        description: "Failed to load trust scores from the blockchain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the complete trust ledger
  const loadTrustLedger = useCallback(async () => {
    try {
      setIsLedgerLoading(true);
      const data = await getTrustLedger();
      console.log("Trust ledger loaded from blockchain:", data?.length || 0, "entries");
      setLedger(Array.isArray(data) ? data : []);
      setIsLedgerLoading(false);
    } catch (err: any) {
      console.error("Error loading trust ledger:", err);
      setError(err);
      setIsLedgerLoading(false);
      
      toast({
        title: "Trust Ledger Loading Failed",
        description: err.message || "Failed to load trust ledger from blockchain",
        variant: "destructive",
      });
    }
  }, []);

  // Handle trust score updates
  const handleTrustUpdate = useCallback((update: TrustUpdate) => {
    setTrustScores(prev => ({
      ...prev,
      [update.vehicleId]: update.score
    }));
    
    setLastUpdate(update);
    
    // Call the onUpdate callback if provided
    if (onUpdate) {
      onUpdate(update);
    }
  }, [onUpdate]);

  // Auto-connect on mount if specified
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect, connect]);

  // Subscribe to trust updates
  useEffect(() => {
    const unsubscribe = addTrustUpdateListener(handleTrustUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [handleTrustUpdate]);

  // Load trust scores for specified vehicle IDs
  useEffect(() => {
    if (vehicleIds.length > 0 && isConnected) {
      loadTrustScores(vehicleIds);
    }
  }, [vehicleIds, isConnected, loadTrustScores]);

  return {
    trustScores,
    isLoading,
    error,
    isConnected,
    connect,
    loadTrustScores,
    lastUpdate,
    ledger,
    isLedgerLoading,
    loadTrustLedger
  };
};
