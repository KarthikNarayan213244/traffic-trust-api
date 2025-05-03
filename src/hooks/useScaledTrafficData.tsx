import { useState, useEffect, useCallback, useRef } from "react";
import { Vehicle, RSU, CongestionZone, Anomaly } from "@/services/api/types";
import { 
  trafficScaler, 
  getScaledVehicles, 
  getScaledRSUs, 
  getScaledCongestionData,
  refreshScaledTrafficData,
  getTrafficStats
} from "@/services/trafficScaler";
import { fetchAnomalies } from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface UseScaledTrafficDataProps {
  initialRefreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
  visibleBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevel?: number;
}

export function useScaledTrafficData({
  initialRefreshInterval = 60000, // Default: 1 minute
  enableAutoRefresh = true,
  visibleBounds,
  zoomLevel = 10
}: UseScaledTrafficDataProps = {}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rsus, setRSUs] = useState<RSU[]>([]);
  const [congestionData, setCongestionData] = useState<CongestionZone[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(initialRefreshInterval);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(enableAutoRefresh);
  
  const [stats, setStats] = useState({
    totalVehicles: 0,
    visibleVehicles: 0,
    totalRSUs: 0,
    visibleRSUs: 0
  });
  
  // Store previous bounds for comparison
  const prevBoundsRef = useRef<any>(null);
  const prevZoomRef = useRef<number>(zoomLevel);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Update data when bounds or zoom changes
  useEffect(() => {
    const boundsChanged = visibleBounds && haveBoundsChanged(visibleBounds);
    const zoomChanged = Math.abs(prevZoomRef.current - zoomLevel) >= 1;
    
    if (boundsChanged || zoomChanged) {
      debouncedFetchData(false);
    }
  }, [visibleBounds, zoomLevel, haveBoundsChanged, debouncedFetchData]);
  
  // Initial data load
  useEffect(() => {
    debouncedFetchData(true);
    
    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedFetchData]);
  
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
        debouncedFetchData(false);
      }, refreshInterval);
    }
    
    // Cleanup function
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [refreshInterval, autoRefresh, debouncedFetchData]);
  
  // Change refresh interval
  const changeRefreshInterval = useCallback((newInterval: number) => {
    setRefreshInterval(newInterval);
  }, []);
  
  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);
  
  // Manual refresh
  const refreshData = useCallback(() => {
    debouncedFetchData(true);
  }, [debouncedFetchData]);
  
  return {
    data: {
      vehicles,
      rsus,
      congestion: congestionData,
      anomalies,
    },
    stats,
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshInterval,
    autoRefresh,
    refreshData,
    changeRefreshInterval,
    toggleAutoRefresh,
    counts: {
      vehicles: vehicles.length,
      rsus: rsus.length,
      congestion: congestionData.length,
      anomalies: anomalies.length,
      totalVehicles: stats.totalVehicles,
      totalRSUs: stats.totalRSUs
    }
  };
}
