
import { useState, useEffect } from "react";
import { useTrafficFetch } from "./useTrafficFetch";
import { useAutoRefresh } from "./useAutoRefresh";
import { UseScaledTrafficDataProps, UseScaledTrafficDataReturn } from "./types";
import { getTrafficStats } from "@/services/trafficScaler";

export function useScaledTrafficData({
  initialRefreshInterval = 60000, // Default: 1 minute
  enableAutoRefresh = true,
  visibleBounds,
  zoomLevel = 10
}: UseScaledTrafficDataProps = {}): UseScaledTrafficDataReturn {
  // Use the traffic fetch hook
  const {
    trafficData,
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
  } = useTrafficFetch({
    visibleBounds,
    zoomLevel
  });
  
  // Use the auto refresh hook
  const {
    refreshInterval,
    autoRefresh,
    changeRefreshInterval,
    toggleAutoRefresh
  } = useAutoRefresh({
    initialRefreshInterval,
    enableAutoRefresh,
    refreshFunction: () => debouncedFetchData(false)
  });

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

  // Manual refresh function
  const refreshData = () => {
    debouncedFetchData(true);
  };

  // Build combined traffic counts
  const counts = {
    vehicles: trafficData.vehicles.length,
    rsus: trafficData.rsus.length,
    congestion: trafficData.congestionData.length,
    anomalies: trafficData.anomalies.length,
    totalVehicles: stats.totalVehicles,
    totalRSUs: stats.totalRSUs
  };

  return {
    data: {
      vehicles: trafficData.vehicles,
      rsus: trafficData.rsus,
      congestion: trafficData.congestionData,
      anomalies: trafficData.anomalies,
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
    counts
  };
}

// Re-export the types
export * from "./types";
