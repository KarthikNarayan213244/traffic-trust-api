
import React, { useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api";
import SimulationControls from "./SimulationControls";
import ApiKeyControl from "./ApiKeyControl";
import { useMapData } from "@/hooks/useMapData";
import { useSimulation } from "@/hooks/useSimulation";
import { useMapApiKey } from "@/hooks/useMapApiKey";

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
  const { vehicles, rsus, congestionData, isLoading } = useMapData(
    initialVehicles, 
    initialRsus, 
    initialCongestionData, 
    initialLoading
  );
  const { 
    isSimulationRunning, selectedAmbulance, destination, 
    toggleSimulation, handleAmbulanceSelect, handleDestinationSelect, resetRouting 
  } = useSimulation();

  // Setup Google Maps JS API loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Set up interval for data updates when simulation is running
  useEffect(() => {
    if (!isSimulationRunning) return;

    const vehicleInterval = setInterval(() => {
      fetchVehicles().then(data => {
        setVehicles(data);
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
  }, [isSimulationRunning]);

  // Show loading spinner
  if (initialLoading && isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show API key form if no key is set
  if (!apiKey) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 flex-col">
        <p className="text-lg mb-4">Google Maps API Key Required</p>
        <MapApiKeyForm onApiKeySet={handleApiKeySet} />
      </div>
    );
  }

  // Show error if Google Maps failed to load
  if (loadError) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <h3 className="text-lg font-medium text-red-600">Failed to load Google Maps</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please check your internet connection and API key, then try again
          </p>
          <MapApiKeyForm onApiKeySet={handleApiKeySet} />
        </div>
      </div>
    );
  }

  // Show message if Google Maps is not loaded yet
  if (!isLoaded) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Loading maps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <SimulationControls
          isSimulationRunning={isSimulationRunning}
          selectedAmbulance={selectedAmbulance}
          toggleSimulation={toggleSimulation}
          resetRouting={resetRouting}
        />
        
        <ApiKeyControl
          apiKey={apiKey}
          onApiKeySet={handleApiKeySet}
        />
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
    </div>
  );
};

export default TrafficMap;
