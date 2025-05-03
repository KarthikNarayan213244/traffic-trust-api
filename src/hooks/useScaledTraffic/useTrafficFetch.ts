import { useState, useCallback, useRef } from "react";
import { 
  getScaledVehicles, 
  getScaledRSUs, 
  getScaledCongestionData,
  getTrafficStats,
  refreshScaledTrafficData
} from "@/services/trafficScaler";
import { fetchAnomalies } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { TrafficStats, TrafficData } from "./types";
import { Vehicle, RSU, CongestionZone, Anomaly } from "@/services/api/types";

interface UseTrafficFetchProps {
  visibleBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevel: number;
}

export function useTrafficFetch({ visibleBounds, zoomLevel }: UseTrafficFetchProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rsus, setRSUs] = useState<RSU[]>([]);
  const [congestionData, setCongestionData] = useState<CongestionZone[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [stats, setStats] = useState<TrafficStats>({
    totalVehicles: 0,
    visibleVehicles: 0,
    totalRSUs: 0,
    visibleRSUs: 0
  });
  
  // Store previous bounds for comparison
  const prevBoundsRef = useRef<any>(null);
  const prevZoomRef = useRef<number>(zoomLevel);
  
  // Improved debouncing mechanism
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if bounds have changed significantly
  const haveBoundsChanged = useCallback((newBounds: any, threshold: number = 0.01) => {
    if (!prevBoundsRef.current || !newBounds) return true;
    const prev = prevBoundsRef.current;
    
    return Math.abs(newBounds.north - prev.north) > threshold ||
           Math.abs(newBounds.south - prev.south) > threshold ||
           Math.abs(newBounds.east - prev.east) > threshold ||
           Math.abs(newBounds.west - prev.west) > threshold;
  }, []);
  
  // Fetch data with improved error handling
  const fetchData = useCallback(async (force: boolean = false) => {
    if (isRefreshing && !force) return;
    
    setIsRefreshing(true);
    
    try {
      // Get stats first to avoid unnecessary data fetching
      const trafficStats = getTrafficStats();
      
      // If we have no vehicles yet, initialize or refresh the traffic scaler data
      if (trafficStats.totalVehicles === 0) {
        await refreshScaledTrafficData();
      }
      
      // Apply dynamic limits based on zoom level to improve performance
      const maxVehicles = zoomLevel < 12 ? 200 : zoomLevel < 14 ? 500 : 1000;
      
      // Get data for the current view with limits
      const vehiclesData = getScaledVehicles(visibleBounds, zoomLevel);
      const rsusData = getScaledRSUs(visibleBounds);
      const congestionResults = getScaledCongestionData();
      
      // Limit data size for better performance
      const limitedVehicles = vehiclesData.slice(0, maxVehicles);
      const limitedRSUs = rsusData.slice(0, 100);
      const limitedCongestion = congestionResults.slice(0, 200);
      
      // Update state with results - batch updates for better performance
      setVehicles(limitedVehicles);
      setRSUs(limitedRSUs);
      setCongestionData(limitedCongestion);
      
      // Fetch anomalies separately
      try {
        // Limit anomalies to improve performance
        const anomaliesData = await fetchAnomalies({ limit: 50 });
        setAnomalies(anomaliesData);
      } catch (error) {
        console.error("Error fetching anomalies:", error);
        // Don't reset all anomalies on error - keep previous state
      }
      
      // Update stats
      const updatedStats = getTrafficStats();
      setStats({
        totalVehicles: updatedStats.totalVehicles,
        visibleVehicles: limitedVehicles.length,
        totalRSUs: updatedStats.totalRSUs,
        visibleRSUs: limitedRSUs.length
      });
      
      // Update last updated timestamp
      setLastUpdated(new Date());
      
      // Store current bounds and zoom for future comparison
      if (visibleBounds) {
        prevBoundsRef.current = { ...visibleBounds };
      }
      prevZoomRef.current = zoomLevel;
      
    } catch (error) {
      console.error("Error fetching scaled traffic data:", error);
      toast({
        title: "Data Fetch Error",
        description: "Could not refresh traffic data. Will try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, visibleBounds, zoomLevel]);
  
  // Throttle and debounce fetch operations
  const debouncedFetchData = useCallback((force: boolean = false) => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      fetchData(force);
      debounceTimerRef.current = null;
    }, 250); // 250ms debounce time
  }, [fetchData]);

  return {
    trafficData: {
      vehicles,
      rsus,
      congestionData,
      anomalies
    },
    stats,
    isLoading,
    isRefreshing,
    lastUpdated,
    debouncedFetchData,
    fetchData,
    haveBoundsChanged,
    debounceTimerRef,
    prevBoundsRef,
    prevZoomRef
  };
}
