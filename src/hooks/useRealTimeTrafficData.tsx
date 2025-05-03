
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchVehicles, fetchRSUs, fetchCongestionData, fetchAnomalies } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { isRealTimeDataAvailable, getDataSourceInfo } from "@/services/api/external";
import { realtimeService } from "@/services/realtime";
import { Vehicle, RSU, CongestionZone, Anomaly } from "@/services/api/types";

interface UseRealTimeTrafficDataProps {
  initialRefreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
}

export function useRealTimeTrafficData({
  initialRefreshInterval = 60000, // Default: 1 minute
  enableAutoRefresh = true
}: UseRealTimeTrafficDataProps = {}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rsus, setRSUs] = useState<RSU[]>([]);
  const [congestionData, setCongestionData] = useState<CongestionZone[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(initialRefreshInterval);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(enableAutoRefresh);
  const [dataSource, setDataSource] = useState(getDataSourceInfo());
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(false);
  
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

  // Initialize realtime service
  useEffect(() => {
    const setupRealtime = async () => {
      try {
        // Check if we can use real-time updates
        const isRealtimeAvailable = await realtimeService.checkConnection();
        setRealtimeEnabled(isRealtimeAvailable);
        
        if (isRealtimeAvailable) {
          console.log("Real-time updates available, subscribing to channels");
          
          // Subscribe to vehicle updates
          realtimeService.subscribe('vehicle', (newVehicle) => {
            setVehicles(prevVehicles => {
              const index = prevVehicles.findIndex(v => 
                v.vehicle_id === newVehicle.vehicle_id
              );
              
              if (index >= 0) {
                const updated = [...prevVehicles];
                updated[index] = newVehicle;
                return updated;
              } else {
                return [...prevVehicles, newVehicle];
              }
            });
            setLastUpdated(new Date());
          });
          
          // Subscribe to RSU updates
          realtimeService.subscribe('rsu', (newRsu) => {
            setRSUs(prevRsus => {
              const index = prevRsus.findIndex(r => 
                r.rsu_id === newRsu.rsu_id
              );
              
              if (index >= 0) {
                const updated = [...prevRsus];
                updated[index] = newRsu;
                return updated;
              } else {
                return [...prevRsus, newRsu];
              }
            });
            setLastUpdated(new Date());
          });
          
          // Subscribe to congestion updates
          realtimeService.subscribe('congestion', (newCongestion) => {
            setCongestionData(prevCongestion => {
              const index = prevCongestion.findIndex(c => 
                c.id === newCongestion.id
              );
              
              if (index >= 0) {
                const updated = [...prevCongestion];
                updated[index] = newCongestion;
                return updated;
              } else {
                return [...prevCongestion, newCongestion];
              }
            });
            setLastUpdated(new Date());
          });
          
          // Subscribe to anomaly updates
          realtimeService.subscribe('anomaly', (newAnomaly) => {
            setAnomalies(prevAnomalies => {
              const index = prevAnomalies.findIndex(a => 
                a.id === newAnomaly.id
              );
              
              if (index >= 0) {
                const updated = [...prevAnomalies];
                updated[index] = newAnomaly;
                return updated;
              } else {
                const updatedAnomalies = [...prevAnomalies, newAnomaly];
                
                // Show a toast for critical anomalies
                if (newAnomaly.severity === 'Critical') {
                  toast({
                    title: "Critical Anomaly Detected",
                    description: `${newAnomaly.type} detected for vehicle ${newAnomaly.vehicle_id}`,
                    variant: "destructive"
                  });
                }
                
                return updatedAnomalies;
              }
            });
            setLastUpdated(new Date());
          });
        }
      } catch (error) {
        console.error("Error setting up realtime service:", error);
        setRealtimeEnabled(false);
      }
    };
    
    setupRealtime();
    
    // Cleanup function
    return () => {
      realtimeService.unsubscribeAll();
    };
  }, []);

  // Fetch all data types
  const fetchAllData = useCallback(async () => {
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
  }, [isRefreshing]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
    
    // Cleanup function to cancel any pending requests when component unmounts
    return () => {
      Object.values(currentRequests.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, [fetchAllData]);

  // Set up auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      console.log(`Auto-refreshing traffic data (${refreshInterval / 1000}s interval)`);
      fetchAllData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, autoRefresh, fetchAllData]);

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
    isRealtimeEnabled: realtimeEnabled,
    dataSource,
    refreshData,
    changeRefreshInterval,
    toggleAutoRefresh,
  };
}
