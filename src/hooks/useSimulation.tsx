
import { useState, useEffect } from "react";
import { fetchVehicles, fetchCongestionData, Vehicle } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const useSimulation = (initiallyRunning = false) => {
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(initiallyRunning);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);

  // Toggle live updates
  const toggleSimulation = () => {
    setIsSimulationRunning(prev => !prev);
    toast({
      title: !isSimulationRunning ? "Live Updates Enabled" : "Live Updates Paused",
      description: !isSimulationRunning ? 
        "Real-time data updates enabled. Vehicles update every 5 seconds, congestion every minute." : 
        "Data updates paused.",
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
    toggleSimulation,
    handleAmbulanceSelect,
    handleDestinationSelect,
    resetRouting,
    setIsSimulationRunning
  };
};
