
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { realtimeService } from "@/services/realtime";
import { toast } from "@/hooks/use-toast";

// Initialize real-time connection on first use
let isInitialized = false;

export const useRealTimeData = <T extends any>(
  dataType: 'vehicle' | 'congestion' | 'anomaly' | 'rsu',
  initialData: T[] = []
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Initialize real-time service if not already done
  useEffect(() => {
    if (!isInitialized && supabase) {
      realtimeService.initializeWebSockets();
      isInitialized = true;
      console.log("Real-time WebSocket connections initialized");
    }
    
    return () => {
      // Don't cleanup on component unmount as other components may be using it
      // We'll handle cleanup on app unmount separately
    };
  }, []);

  // Subscribe to real-time updates for this data type with reconnection logic
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = realtimeService.subscribe(dataType, (newItem) => {
      setData(prevData => {
        // Find if this item already exists
        const existingIndex = prevData.findIndex((item: any) => 
          item.id === newItem.id || 
          (dataType === 'vehicle' && item.vehicle_id === newItem.vehicle_id) ||
          (dataType === 'rsu' && item.rsu_id === newItem.rsu_id)
        );
        
        if (existingIndex >= 0) {
          // Update existing item
          const updatedData = [...prevData];
          updatedData[existingIndex] = newItem;
          return updatedData;
        } else {
          // Add new item
          return [...prevData, newItem];
        }
      });
      
      setLastUpdated(new Date());
    });
    
    // Setup automatic reconnection
    const connectionCheckInterval = setInterval(() => {
      if (!realtimeService.isConnected()) {
        setConnectionAttempts(prev => prev + 1);
        console.log(`Real-time connection lost. Attempting reconnect (${connectionAttempts + 1})...`);
        
        // Initialize WebSockets again
        realtimeService.initializeWebSockets();
        
        // Re-subscribe if needed
        realtimeService.resubscribeAll();
        
        // Refresh data
        fetchInitialData();
        
        if (connectionAttempts > 0 && connectionAttempts % 3 === 0) {
          toast({
            title: "Connection Issues",
            description: "Attempting to restore real-time traffic data connection...",
            variant: "destructive",
          });
        }
      } else if (connectionAttempts > 0) {
        setConnectionAttempts(0);
        toast({
          title: "Connection Restored",
          description: "Real-time traffic data connection restored successfully.",
          variant: "default",
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      unsubscribe();
      clearInterval(connectionCheckInterval);
    };
  }, [dataType, connectionAttempts]);

  // Initial data fetch function with considerably higher limits
  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Set higher limits for each data type to get more data
      switch (dataType) {
        case 'vehicle':
          response = await supabase.from('vehicles').select('*').limit(10000); // Increased from 1000 to 10000
          break;
        case 'congestion':
          response = await supabase.from('zones_congestion').select('*').limit(2000); // Increased from 500 to 2000
          break;
        case 'anomaly':
          response = await supabase.from('anomalies').select('*').limit(2000); // Increased from 500 to 2000
          break;
        case 'rsu':
          response = await supabase.from('rsus').select('*').limit(1000); // Increased from 100 to 1000
          break;
      }
      
      if (response.error) throw new Error(response.error.message);
      
      // Set the new data if it contains more entries than we already have
      if (response.data && response.data.length > 0) {
        if (response.data.length > data.length) {
          setData(response.data as T[]);
          console.log(`Loaded ${response.data.length} ${dataType} records from database`);
        } else {
          console.log(`Kept existing ${data.length} ${dataType} records (more than newly fetched ${response.data.length})`);
        }
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err);
      console.error(`Error fetching initial ${dataType} data:`, err);
      toast({
        title: `Data Fetch Error`,
        description: `Could not load ${dataType} data from the server. Retrying...`,
        variant: "destructive",
      });
      
      // Setup an automatic retry
      setTimeout(() => fetchInitialData(), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function - fetch more data than usual
  const refreshData = async () => {
    setIsLoading(true);
    
    try {
      let response;
      
      // Set even higher limits for manual refresh
      switch (dataType) {
        case 'vehicle':
          response = await supabase.from('vehicles').select('*').limit(20000);
          break;
        case 'congestion':
          response = await supabase.from('zones_congestion').select('*').limit(5000);
          break;
        case 'anomaly':
          response = await supabase.from('anomalies').select('*').limit(5000);
          break;
        case 'rsu':
          response = await supabase.from('rsus').select('*').limit(2000);
          break;
      }
      
      if (response.error) throw new Error(response.error.message);
      
      setData(response.data as T[]);
      setLastUpdated(new Date());
      
      console.log(`Manually refreshed ${response.data.length} ${dataType} records from database`);
      
      toast({
        title: "Data Refreshed",
        description: `Successfully loaded ${response.data.length} ${dataType} records`,
        duration: 3000,
      });
    } catch (err: any) {
      setError(err);
      console.error(`Error refreshing ${dataType} data:`, err);
      toast({
        title: `Data Refresh Error`,
        description: `Could not refresh ${dataType} data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchInitialData();
    
    // Set up periodic refresh to ensure data is always up-to-date
    const intervalId = setInterval(() => {
      fetchInitialData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [dataType]);

  return {
    data,
    isLoading,
    error,
    refreshData,
    lastUpdated,
    connectionStatus: realtimeService.isConnected() ? 'connected' : 'reconnecting'
  };
};

// App-level cleanup function to call on app unmount if needed
export const cleanupRealTimeConnections = () => {
  realtimeService.cleanup();
  isInitialized = false;
};
