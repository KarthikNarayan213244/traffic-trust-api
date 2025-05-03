
import { useState, useEffect, useRef } from "react";
import { fetchVehicles, fetchRSUs, fetchCongestionData, fetchAnomalies } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { isRealTimeDataAvailable, getDataSourceInfo } from "@/services/api/external";

interface UseRealTimeTrafficDataProps {
  initialRefreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
}

export function useRealTimeTrafficData({
  initialRefreshInterval = 60000, // Default: 1 minute
  enableAutoRefresh = true
}: UseRealTimeTrafficDataProps = {}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [rsus, setRSUs] = useState<any[]>([]);
  const [congestionData, setCongestionData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(initialRefreshInterval);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(enableAutoRefresh);
  const [dataSource, setDataSource] = useState(getDataSourceInfo());
  
  // Refs for tracking current requests
  const currentRequests = useRef<{ [key: string]: AbortController | null }>({
    vehicles: null,
    rsus: null,
    congestion: null,
    anomalies: null
  });

  // Fetch data with abort controller
  const fetchDataWithAbort = async (
    fetchFn: (options: any) => Promise<any[]>, 
    dataType: string,
    options: any = {}
  ) => {
    // Cancel any existing request for this data type
    if (currentRequests.current[dataType]) {
      currentRequests.current[dataType]?.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    currentRequests.current[dataType] = abortController;
    
    try {
      // Add signal to options
      const fetchOptions = {
        ...options,
        signal: abortController.signal
      };
      
      // Fetch data
      return await fetchFn(fetchOptions);
    } catch (error: any) {
      // Don't report errors if the request was aborted
      if (error.name === 'AbortError') {
        console.log(`${dataType} request aborted`);
        return null;
      }
      throw error;
    } finally {
      // Clear the request reference if it's still the current one
      if (currentRequests.current[dataType] === abortController) {
        currentRequests.current[dataType] = null;
      }
    }
  };

  // Fetch all data types
  const fetchAllData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // Fetch all data in parallel
      const [vehiclesData, rsusData, congestionResults, anomaliesResults] = await Promise.allSettled([
        fetchDataWithAbort(fetchVehicles, 'vehicles', { limit: 1000 }),
        fetchDataWithAbort(fetchRSUs, 'rsus', { limit: 100 }),
        fetchDataWithAbort(fetchCongestionData, 'congestion', { limit: 500 }),
        fetchDataWithAbort(fetchAnomalies, 'anomalies', { limit: 200 })
      ]);
      
      // Update state with results that succeeded
      if (vehiclesData.status === 'fulfilled' && vehiclesData.value) {
        setVehicles(vehiclesData.value);
      }
      
      if (rsusData.status === 'fulfilled' && rsusData.value) {
        setRSUs(rsusData.value);
      }
      
      if (congestionResults.status === 'fulfilled' && congestionResults.value) {
        setCongestionData(congestionResults.value);
      }
      
      if (anomaliesResults.status === 'fulfilled' && anomaliesResults.value) {
        setAnomalies(anomaliesResults.value);
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
      
      // Update data source info
      setDataSource(getDataSourceInfo());
      
    } catch (error) {
      console.error("Error fetching traffic data:", error);
      toast({
        title: "Data Fetch Error",
        description: "Could not refresh traffic data. Will try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
    
    // Cleanup function to cancel any pending requests when component unmounts
    return () => {
      Object.values(currentRequests.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, []);

  // Set up auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      console.log(`Auto-refreshing traffic data (${refreshInterval / 1000}s interval)`);
      fetchAllData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, autoRefresh]);

  // Change refresh interval
  const changeRefreshInterval = (newInterval: number) => {
    setRefreshInterval(newInterval);
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Manual refresh
  const refreshData = () => {
    fetchAllData();
  };

  return {
    data: {
      vehicles,
      rsus,
      congestion: congestionData,
      anomalies,
    },
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshInterval,
    autoRefresh,
    isRealTimeSource: isRealTimeDataAvailable(),
    dataSource,
    refreshData,
    changeRefreshInterval,
    toggleAutoRefresh,
  };
}
