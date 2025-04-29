
import React, { useEffect, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import { fetchVehicles, fetchCongestionData } from "@/services/api";
import SimulationControls from "./SimulationControls";
import ApiKeyControl from "./ApiKeyControl";
import { useMapData } from "@/hooks/useMapData";
import { useSimulation } from "@/hooks/useSimulation";
import { useMapApiKey } from "@/hooks/useMapApiKey";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TrafficMapProps {
  vehicles?: any[];
  rsus?: any[];
  isLoading?: boolean;
  congestionData?: any[];
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehicles: initialVehicles = [],
  rsus: initialRsus = [],
  isLoading: initialLoading = false,
  congestionData: initialCongestionData = []
}) => {
  // Custom hooks to manage state
  const { apiKey, handleApiKeySet } = useMapApiKey();
  const { vehicles, rsus, congestionData, isLoading, setVehicles, setCongestionData } = useMapData(
    initialVehicles, 
    initialRsus, 
    initialCongestionData, 
    initialLoading
  );
  const { 
    isSimulationRunning, 
    selectedAmbulance, 
    destination, 
    simulationSpeed,
    lastRefreshTime,
    toggleSimulation, 
    handleAmbulanceSelect, 
    handleDestinationSelect, 
    resetRouting,
    updateRefreshTime
  } = useSimulation();
  
  const [vehicleCount, setVehicleCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  // Only initialize Google Maps when we have an API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",  // Use empty string if no key is available
    libraries,
    id: "google-map-script", // Ensure consistent ID to prevent multiple initializations
  });

  // Set up interval for data updates when live updates are running
  useEffect(() => {
    if (!isSimulationRunning) return;

    const vehicleInterval = setInterval(() => {
      fetchVehicles().then(data => {
        setVehicles(data);
        updateRefreshTime();
      }).catch(error => {
        console.error("Error updating vehicles:", error);
      });
    }, 5000); // Update vehicles every 5 seconds

    const congestionInterval = setInterval(() => {
      fetchCongestionData().then(data => {
        setCongestionData(data);
      }).catch(error => {
        console.error("Error updating congestion data:", error);
      });
    }, 60000); // Update congestion every minute

    return () => {
      clearInterval(vehicleInterval);
      clearInterval(congestionInterval);
    };
  }, [isSimulationRunning, setVehicles, setCongestionData, updateRefreshTime]);

  // Animated counter for vehicle count
  useEffect(() => {
    if (!vehicles) return;
    
    setVehicleCount(vehicles.length);
    
    // Animated counter
    const startValue = displayCount;
    const endValue = vehicles.length;
    const duration = 1000; // ms
    const stepTime = 20; // ms
    const steps = duration / stepTime;
    const increment = (endValue - startValue) / steps;
    
    let currentStep = 0;
    let currentValue = startValue;
    
    const interval = setInterval(() => {
      currentStep++;
      currentValue += increment;
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayCount(endValue);
      } else {
        setDisplayCount(Math.floor(currentValue));
      }
    }, stepTime);
    
    return () => clearInterval(interval);
  }, [vehicles, displayCount]);

  // Show loading skeleton
  if (initialLoading && isLoading) {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  // Show API key form if no key is set
  if (!apiKey) {
    return (
      <Card className="overflow-hidden">
        <div className="h-[400px] flex items-center justify-center bg-gray-50 flex-col p-6">
          <p className="text-lg mb-4 font-medium">Google Maps API Key Required</p>
          <MapApiKeyForm onApiKeySet={handleApiKeySet} />
        </div>
      </Card>
    );
  }

  // Show error if Google Maps failed to load
  if (loadError) {
    return (
      <Card className="overflow-hidden">
        <div className="h-[400px] flex items-center justify-center bg-gray-50">
          <div className="text-center p-4">
            <h3 className="text-lg font-medium text-red-600">Failed to load Google Maps</h3>
            <p className="text-sm text-gray-500 mt-2">
              Please check your internet connection and API key, then try again
            </p>
            <MapApiKeyForm onApiKeySet={handleApiKeySet} />
          </div>
        </div>
      </Card>
    );
  }

  // Show message if Google Maps is not loaded yet
  if (!isLoaded) {
    return (
      <Card className="overflow-hidden">
        <div className="h-[400px] flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3">Loading maps...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <SimulationControls
              isSimulationRunning={isSimulationRunning}
              selectedAmbulance={selectedAmbulance}
              toggleSimulation={toggleSimulation}
              resetRouting={resetRouting}
            />
            
            {vehicleCount > 0 && (
              <div className="ml-4 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                {displayCount.toLocaleString()} vehicles tracked
              </div>
            )}
          </div>
          
          <ApiKeyControl
            apiKey={apiKey}
            onApiKeySet={handleApiKeySet}
          />
        </div>
      </div>

      <GoogleMapDisplay 
        vehicles={vehicles} 
        rsus={rsus} 
        congestionData={congestionData} 
        isSimulationRunning={isSimulationRunning}
        selectedAmbulance={selectedAmbulance}
        onAmbulanceSelect={handleAmbulanceSelect}
        destination={destination}
        onMapClick={handleDestinationSelect}
      />
    </Card>
  );
};

export default TrafficMap;
