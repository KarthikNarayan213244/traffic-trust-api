
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
  
  // Check if bounds have changed significantly
  const haveBoundsChanged = useCallback((newBounds: any, threshold: number = 0.01) => {
    if (!prevBoundsRef.current) return true;
    const prev = prevBoundsRef.current;
    
    return Math.abs(newBounds.north - prev.north) > threshold ||
           Math.abs(newBounds.south - prev.south) > threshold ||
           Math.abs(newBounds.east - prev.east) > threshold ||
           Math.abs(newBounds.west - prev.west) > threshold;
  }, []);
  
  // Fetch all data
  const fetchAllData = useCallback(async (force: boolean = false) => {
    if (isRefreshing && !force) return;
    
    setIsRefreshing(true);
    
    try {
      // Initialize or refresh the traffic scaler data
      await refreshScaledTrafficData();
      
      // Get data for the current view
      const vehiclesData = getScaledVehicles(visibleBounds, zoomLevel);
      const rsusData = getScaledRSUs(visibleBounds);
      const congestionResults = getScaledCongestionData();
      
      // Update state with results
      setVehicles(vehiclesData);
      setRSUs(rsusData);
      setCongestionData(congestionResults);
      
      // Fetch anomalies separately (we're not scaling these)
      try {
        const anomaliesData = await fetchAnomalies({ limit: 200 });
        setAnomalies(anomaliesData);
      } catch (error) {
        console.error("Error fetching anomalies:", error);
      }
      
      // Update stats
      const trafficStats = getTrafficStats();
      setStats({
        totalVehicles: trafficStats.totalVehicles,
        visibleVehicles: vehiclesData.length,
        totalRSUs: trafficStats.totalRSUs,
        visibleRSUs: rsusData.length
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
      console.log("Map view changed, updating vehicle data");
      fetchAllData(true);
    }
  }, [visibleBounds, zoomLevel, haveBoundsChanged, fetchAllData]);
  
  // Initial data load
  useEffect(() => {
    fetchAllData();
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
    fetchAllData(true);
  };
  
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
