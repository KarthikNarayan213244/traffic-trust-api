
import { useState, useEffect, useCallback } from "react";
import { fetchVehicles, fetchCongestionData, fetchAnomalies, fetchTrustLedger, Vehicle } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const useSimulation = (initiallyRunning = false) => {
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(initiallyRunning);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Toggle live updates
  const toggleSimulation = useCallback(() => {
    setIsSimulationRunning(prev => !prev);
    
    toast({
      title: !isSimulationRunning ? "Live Updates Enabled" : "Live Updates Paused",
      description: !isSimulationRunning ? 
        "Real-time data updates enabled. Vehicles update every 5 seconds, congestion every minute." : 
        "Data updates paused.",
    });
    
    // Update the last refreshed timestamp
    setLastRefreshed(new Date());
  }, [isSimulationRunning]);

  // Handle ambulance selection for routing
  const handleAmbulanceSelect = useCallback((ambulance: Vehicle) => {
    setSelectedAmbulance(ambulance);
    toast({
      title: "Ambulance Selected",
      description: "Click on the map to set a destination for route optimization.",
    });
  }, []);

  // Handle destination selection for routing
  const handleDestinationSelect = useCallback((latLng: google.maps.LatLngLiteral) => {
    if (selectedAmbulance) {
      setDestination(latLng);
      
      toast({
        title: "Destination Set",
        description: `Calculating optimal route for ambulance ${selectedAmbulance.vehicle_id}`,
      });
    }
  }, [selectedAmbulance]);

  // Reset routing
  const resetRouting = useCallback(() => {
    setSelectedAmbulance(null);
    setDestination(null);
    
    toast({
      title: "Route Planning Cancelled",
      description: "Ambulance routing has been cancelled",
      variant: "default",
    });
  }, []);
  
  // Handle data refresh
  const refreshData = useCallback(async () => {
    console.log("Refreshing simulation data...");
    setLastRefreshed(new Date());
    
    try {
      // This is just for tracking, actual data fetching is done in the useMapData hook
      return true;
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  return {
    isSimulationRunning,
    selectedAmbulance,
    destination,
    lastRefreshed,
    toggleSimulation,
    handleAmbulanceSelect,
    handleDestinationSelect,
    resetRouting,
    refreshData,
    setIsSimulationRunning
  };
};
