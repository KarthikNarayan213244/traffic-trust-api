import { useState, useEffect, useCallback } from 'react';
import { realtimeService } from '@/services/realtime';

type DataType = 'vehicle' | 'congestion' | 'anomaly' | 'rsu';

interface UseRealTimeDataOptions {
  enableAutoRefresh?: boolean;
  initialRefreshInterval?: number;
}

export function useRealTimeData<T>(
  dataType: DataType,
  initialData: T[] = [],
  options: UseRealTimeDataOptions = {}
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<Error | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(
    options.initialRefreshInterval || 60000
  );
  const [enableAutoRefresh, setEnableAutoRefresh] = useState<boolean>(
    options.enableAutoRefresh || false
  );
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState<boolean>(false);

  // Function to refresh data manually
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    // Since we're using real-time updates, this function just indicates
    // that we're requesting/waiting for fresh data
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 500);
  }, []);

  // Check if real-time is connected
  useEffect(() => {
    const checkRealtimeStatus = async () => {
      try {
        // Fixed: isConnected is now a method, not a property
        const isConnected = realtimeService.isConnected();
        setIsRealtimeEnabled(isConnected);
        
        if (!isConnected) {
          const connectionResult = await realtimeService.checkConnection();
          setIsRealtimeEnabled(connectionResult);
        }
      } catch (err) {
        console.error("Error checking realtime connection:", err);
        setIsRealtimeEnabled(false);
      }
    };
    
    checkRealtimeStatus();
    
    // Check periodically
    const interval = setInterval(checkRealtimeStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!dataType) return;
    
    setIsLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = realtimeService.subscribe(dataType, (newData) => {
      setData(currentData => {
        // If this is a batch update, replace the entire dataset
        if (Array.isArray(newData)) {
          return newData as T[];
        }
        
        // Otherwise, check if this item already exists and update it, or add it
        const existingIndex = currentData.findIndex((item: any) => 
          item.id === newData.id || 
          item.vehicle_id === newData.vehicle_id ||
          item.rsu_id === newData.rsu_id ||
          item.zone_id === newData.zone_id
        );
        
        if (existingIndex >= 0) {
          const updatedData = [...currentData];
          updatedData[existingIndex] = newData as T;
          return updatedData;
        } else {
          return [...currentData, newData as T];
        }
      });
      
      setLastUpdated(new Date());
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [dataType]);

  // Auto refresh interval
  useEffect(() => {
    if (!enableAutoRefresh) return;
    
    const intervalId = setInterval(refreshData, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshData, refreshInterval, enableAutoRefresh]);

  // Check for realtime service status periodically
  useEffect(() => {
    const checkRealtimeConnection = async () => {
      try {
        // Fixed: isConnected is now a method, not a property
        const isConnected = realtimeService.isConnected();
        setIsRealtimeEnabled(isConnected);
      } catch (err) {
        console.error("Failed to check real-time connection:", err);
        setIsRealtimeEnabled(false);
      }
    };
    
    const intervalId = setInterval(checkRealtimeConnection, 10000);
    
    // Initial check
    checkRealtimeConnection();
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return {
    data,
    setData,
    isLoading,
    isRefreshing,
    lastUpdated,
    error,
    refreshData,
    refreshInterval,
    setRefreshInterval,
    enableAutoRefresh,
    setEnableAutoRefresh,
    isRealtimeEnabled
  };
}
