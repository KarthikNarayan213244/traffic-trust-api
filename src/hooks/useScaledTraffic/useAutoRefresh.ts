
import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoRefreshProps {
  initialRefreshInterval: number;
  enableAutoRefresh: boolean;
  refreshFunction: () => void;
}

export function useAutoRefresh({ 
  initialRefreshInterval, 
  enableAutoRefresh, 
  refreshFunction 
}: UseAutoRefreshProps) {
  const [refreshInterval, setRefreshInterval] = useState<number>(initialRefreshInterval);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(enableAutoRefresh);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up auto refresh with proper cleanup
  useEffect(() => {
    // Clear any existing timer
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    
    // Only set up a new timer if auto refresh is enabled
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        console.log(`Auto-refreshing traffic data (${refreshInterval / 1000}s interval)`);
        refreshFunction();
      }, refreshInterval);
    }
    
    // Cleanup function
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [refreshInterval, autoRefresh, refreshFunction]);
  
  // Change refresh interval
  const changeRefreshInterval = useCallback((newInterval: number) => {
    setRefreshInterval(newInterval);
  }, []);
  
  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);
  
  return {
    refreshInterval,
    autoRefresh,
    changeRefreshInterval,
    toggleAutoRefresh
  };
}
