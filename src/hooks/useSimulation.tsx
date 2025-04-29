
import { useState, useEffect, useCallback } from "react";
import { fetchVehicles, fetchCongestionData, Vehicle } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const useSimulation = (initiallyRunning = false) => {
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(initiallyRunning);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Toggle live updates
  const toggleSimulation = useCallback(() => {
    setIsSimulationRunning(prev => !prev);
    toast({
      title: !isSimulationRunning ? "Live Updates Enabled" : "Live Updates Paused",
      description: !isSimulationRunning ? 
        "Real-time data updates enabled. Vehicles update every 5 seconds, congestion every minute." : 
        "Data updates paused.",
      variant: !isSimulationRunning ? "default" : "destructive",
    });
  }, [isSimulationRunning]);

  // Handle ambulance selection for routing
  const handleAmbulanceSelect = useCallback((ambulance: Vehicle) => {
    setSelectedAmbulance(ambulance);
    toast({
      title: "Ambulance Selected",
      description: "Click on the map to set a destination for route optimization.",
      variant: "default",
    });
  }, []);

  // Handle destination selection for routing
  const handleDestinationSelect = useCallback((latLng: google.maps.LatLngLiteral) => {
    if (selectedAmbulance) {
      setDestination(latLng);
      toast({
        title: "Destination Set",
        description: `Calculating optimal route for ambulance ${selectedAmbulance.vehicle_id}.`,
        variant: "default",
      });
    }
  }, [selectedAmbulance]);

  // Reset routing
  const resetRouting = useCallback(() => {
    setSelectedAmbulance(null);
    setDestination(null);
    toast({
      title: "Route Planning Canceled",
      description: "Ambulance routing has been canceled.",
      variant: "default",
    });
  }, []);

  // Update simulation speed
  const updateSimulationSpeed = useCallback((speed: number) => {
    setSimulationSpeed(speed);
    toast({
      title: "Simulation Speed Updated",
      description: `Data refresh rate is now ${speed}x.`,
      variant: "default",
    });
  }, []);

  // Update last refresh time
  const updateRefreshTime = useCallback(() => {
    setLastRefreshTime(new Date());
  }, []);

  return {
    isSimulationRunning,
    selectedAmbulance,
    destination,
    simulationSpeed,
    lastRefreshTime,
    toggleSimulation,
    handleAmbulanceSelect,
    handleDestinationSelect,
    resetRouting,
    updateSimulationSpeed,
    updateRefreshTime,
    setIsSimulationRunning
  };
};
