
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

  // Initialize real-time service if not already done
  useEffect(() => {
    if (!isInitialized && supabase) {
      realtimeService.initializeWebSockets(supabase);
      isInitialized = true;
    }
    
    return () => {
      // Don't cleanup on component unmount as other components may be using it
      // We'll handle cleanup on app unmount separately
    };
  }, []);

  // Subscribe to real-time updates for this data type
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
    });
    
    return () => {
      unsubscribe();
    };
  }, [dataType]);

  // Initial data fetch function
  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Fetch data based on type
      switch (dataType) {
        case 'vehicle':
          response = await supabase.from('vehicles').select('*').limit(1000);
          break;
        case 'congestion':
          response = await supabase.from('zones_congestion').select('*').limit(500);
          break;
        case 'anomaly':
          response = await supabase.from('anomalies').select('*').limit(500);
          break;
        case 'rsu':
          response = await supabase.from('rsus').select('*').limit(100);
          break;
      }
      
      if (response.error) throw new Error(response.error.message);
      
      setData(response.data as T[]);
      console.log(`Loaded ${response.data.length} ${dataType} records from database`);
    } catch (err: any) {
      setError(err);
      console.error(`Error fetching initial ${dataType} data:`, err);
      toast({
        title: `Data Fetch Error`,
        description: `Could not load ${dataType} data from the server. Please try again later.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const refreshData = () => {
    fetchInitialData();
  };

  // Initial data load
  useEffect(() => {
    fetchInitialData();
  }, [dataType]);

  return {
    data,
    isLoading,
    error,
    refreshData,
  };
};

// App-level cleanup function to call on app unmount if needed
export const cleanupRealTimeConnections = () => {
  realtimeService.cleanup();
  isInitialized = false;
};
