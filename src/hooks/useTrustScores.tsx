
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseTrustScoresOptions {
  autoConnect?: boolean;
  onUpdate?: (update: any) => void;
}

interface TrustScoreUpdate {
  vehicleId: string;
  score: number;
  timestamp: number;
}

// Mock trust scores for development
const MOCK_TRUST_SCORES: Record<string, number> = {
  'HYD-AM-t43p-f8vt': 98,
  'HYD-BU-km6r-p79v': 92,
  'HYD-CA-2kdp-w32s': 75,
  'HYD-TR-8m3n-l47g': 82,
  'HYD-TW-p59s-k36v': 68,
};

export function useTrustScores(vehicleIds: string[], options: UseTrustScoresOptions = {}) {
  const [trustScores, setTrustScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<TrustScoreUpdate | null>(null);
  
  // Connect to blockchain
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Connecting to blockchain...");
      
      // Simulate blockchain connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error("Failed to connect to blockchain:", error);
      setIsConnected(false);
      setIsLoading(false);
      
      toast({
        title: "Blockchain Connection Failed",
        description: "Could not connect to the trust ledger blockchain",
        variant: "destructive",
      });
      
      return false;
    }
  }, []);
  
  // Fetch trust scores
  const fetchTrustScores = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      setIsLoading(true);
      console.log(`Fetching trust scores for ${vehicleIds.length} vehicles`);
      
      // Simulated blockchain lookup - using mock data for now
      const results: Record<string, number> = {};
      
      for (const vehicleId of vehicleIds) {
        try {
          // Simulate blockchain lookup with randomized mock data
          if (MOCK_TRUST_SCORES[vehicleId]) {
            results[vehicleId] = MOCK_TRUST_SCORES[vehicleId];
          } else {
            // Generate random score between 65 and 95 for vehicles not in mock data
            results[vehicleId] = Math.round(65 + Math.random() * 30);
            
            // Store in mock data for consistency
            MOCK_TRUST_SCORES[vehicleId] = results[vehicleId];
          }
        } catch (error) {
          console.error(`Error fetching trust score for ${vehicleId}:`, error);
        }
      }
      
      setTrustScores(prev => ({...prev, ...results}));
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error fetching trust scores:", error);
      setIsLoading(false);
    }
  }, [isConnected, vehicleIds]);
  
  // Auto connect on mount if enabled
  useEffect(() => {
    if (options.autoConnect) {
      connect().then(success => {
        if (success) {
          fetchTrustScores();
        }
      });
    }
  }, [connect, fetchTrustScores, options.autoConnect]);
  
  // Fetch scores when vehicle IDs change and we're connected
  useEffect(() => {
    if (isConnected && vehicleIds.length > 0) {
      fetchTrustScores();
    }
  }, [isConnected, fetchTrustScores, vehicleIds.join(',')]);
  
  // Set up simulated real-time updates
  useEffect(() => {
    if (!isConnected) return;
    
    // Simulate blockchain event listener with random updates
    const intervalId = setInterval(() => {
      if (vehicleIds.length === 0) return;
      
      // Pick a random vehicle to update
      const randomIndex = Math.floor(Math.random() * vehicleIds.length);
      const vehicleId = vehicleIds[randomIndex];
      
      // Generate small change to trust score
      const currentScore = trustScores[vehicleId] || 75;
      const change = Math.random() > 0.5 ? 1 : -1;
      const newScore = Math.max(0, Math.min(100, currentScore + change));
      
      // Update the score
      setTrustScores(prev => ({
        ...prev,
        [vehicleId]: newScore
      }));
      
      // Set last update info
      const update = {
        vehicleId,
        score: newScore,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      setLastUpdate(update);
      
      // Call onUpdate callback if provided
      if (options.onUpdate) {
        options.onUpdate(update);
      }
      
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [isConnected, trustScores, vehicleIds, options.onUpdate]);

  return {
    trustScores,
    isLoading,
    isConnected,
    lastUpdate,
    connect,
    fetchTrustScores
  };
}
