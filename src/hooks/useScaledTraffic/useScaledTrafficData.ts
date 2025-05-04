
import { useState, useEffect, useCallback } from 'react';
import { useTrafficFetch } from './useTrafficFetch';
import { TrafficData, TrafficStats, TrafficCounts } from './types';
import { toast } from '@/hooks/use-toast';

interface UseScaledTrafficDataProps {
  initialRefreshInterval?: number;
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
  initialRefreshInterval = 60000,
  enableAutoRefresh = true,
  visibleBounds,
  zoomLevel = 10
}: UseScaledTrafficDataProps = {}) {
  // Get the traffic data with filtering capabilities
  const {
    trafficData,
    stats,
    isLoading,
    isRefreshing,
    lastUpdated,
    debouncedFetchData,
    fetchData,
    haveBoundsChanged,
    prevBoundsRef
  } = useTrafficFetch({ visibleBounds, zoomLevel });
  
  // Extract values from traffic data for easier access
  const { vehicles, rsus, congestionData: congestion, anomalies } = trafficData;
  
  // Create counts object for KPIs
  const counts: TrafficCounts = {
    vehicles: vehicles.length,
    rsus: rsus.length,
    congestion: congestion.length,
    anomalies: anomalies.length,
    totalVehicles: stats.totalVehicles,
    totalRSUs: stats.totalRSUs
  };

  // Setup auto-refresh
  useEffect(() => {
    if (!enableAutoRefresh) return;

    // Initial fetch
    fetchData(true);
    
    // Set up interval for auto-refresh
    const intervalId = setInterval(() => {
      fetchData();
    }, initialRefreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [enableAutoRefresh, initialRefreshInterval, fetchData]);
  
  // Update when bounds change significantly
  useEffect(() => {
    if (visibleBounds && haveBoundsChanged(visibleBounds, 0.01)) {
      debouncedFetchData();
    }
  }, [visibleBounds, haveBoundsChanged, debouncedFetchData]);

  // Refresh data method - can be called manually
  const refreshData = useCallback(() => {
    toast({
      title: "Refreshing Traffic Data",
      description: "Fetching the latest traffic information from TomTom API...",
    });
    return fetchData(true);
  }, [fetchData]);

  return {
    data: {
      vehicles,
      rsus,
      congestion,
      anomalies
    } as TrafficData,
    stats,
    counts,
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshData
  };
}
