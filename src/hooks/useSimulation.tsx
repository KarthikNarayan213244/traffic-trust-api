
import { useState, useEffect, useCallback } from "react";
import { fetchVehicles, fetchCongestionData, fetchAnomalies, fetchRSUs, Vehicle } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const useSimulation = (initiallyRunning = false) => {
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(initiallyRunning);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');

  // Determine update intervals based on simulation speed
  const getIntervals = useCallback(() => {
    const speedMultipliers = {
      'slow': 2,
      'normal': 1,
      'fast': 0.5
    };
    const multiplier = speedMultipliers[simulationSpeed];
    
    return {
      vehicles: 5000 * multiplier, // 5 seconds normally
      congestion: 60000 * multiplier, // 1 minute normally
      anomalies: 30000 * multiplier, // 30 seconds normally
      rsus: 45000 * multiplier // 45 seconds normally
    };
  }, [simulationSpeed]);

  // Toggle simulation
  const toggleSimulation = () => {
    setIsSimulationRunning(prev => !prev);
    toast({
      title: !isSimulationRunning ? "Simulation Started" : "Simulation Paused",
      description: !isSimulationRunning ? 
        "Live data updates enabled. Vehicles update every 5 seconds, congestion every minute." : 
        "Data updates paused.",
    });
  };

  // Change simulation speed
  const changeSimulationSpeed = (speed: 'normal' | 'fast' | 'slow') => {
    setSimulationSpeed(speed);
    toast({
      title: `Simulation Speed: ${speed.toUpperCase()}`,
      description: `Update frequency adjusted to ${speed} speed.`
    });
  };

  // Handle ambulance selection for routing
  const handleAmbulanceSelect = (ambulance: Vehicle) => {
    setSelectedAmbulance(ambulance);
    toast({
      title: "Ambulance Selected",
      description: "Click on the map to set a destination for route optimization.",
    });
  };

  // Handle destination selection for routing
  const handleDestinationSelect = (latLng: google.maps.LatLngLiteral) => {
    if (selectedAmbulance) {
      setDestination(latLng);
      toast({
        title: "Destination Set",
        description: "Calculating optimal route for emergency vehicle.",
      });
    }
  };

  // Reset routing
  const resetRouting = () => {
    setSelectedAmbulance(null);
    setDestination(null);
  };

  return {
    isSimulationRunning,
    selectedAmbulance,
    destination,
    simulationSpeed,
    getIntervals,
    toggleSimulation,
    changeSimulationSpeed,
    handleAmbulanceSelect,
    handleDestinationSelect,
    resetRouting,
    setIsSimulationRunning
  };
};
