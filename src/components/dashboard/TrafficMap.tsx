
import React, { useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import { fetchVehicles, fetchCongestionData, fetchRSUs, fetchAnomalies } from "@/services/api";
import SimulationControls from "./SimulationControls";
import ApiKeyControl from "./ApiKeyControl";
import { useMapData } from "@/hooks/useMapData";
import { useSimulation } from "@/hooks/useSimulation";
import { useMapApiKey } from "@/hooks/useMapApiKey";
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
  const { vehicles, rsus, congestionData, isLoading, setVehicles, setRsus, setCongestionData } = useMapData(
    initialVehicles, 
    initialRsus, 
    initialCongestionData, 
    initialLoading
  );
  const { 
    isSimulationRunning, selectedAmbulance, destination, simulationSpeed,
    toggleSimulation, handleAmbulanceSelect, handleDestinationSelect, resetRouting,
    changeSimulationSpeed, getIntervals 
  } = useSimulation();

  // Only initialize Google Maps when we have an API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",  // Use empty string if no key is available
    libraries,
    id: "google-map-script", // Ensure consistent ID to prevent multiple initializations
  });

  // Set up interval for data updates when simulation is running
  useEffect(() => {
    if (!isSimulationRunning) return;

    const intervals = getIntervals();
    
    const vehicleInterval = setInterval(() => {
      fetchVehicles({ limit: 1000 }).then(data => {
        if (Array.isArray(data)) {
          setVehicles(data);
          console.log(`Updated ${data.length} vehicles`);
        }
      }).catch(error => {
        console.error("Error updating vehicles:", error);
      });
    }, intervals.vehicles);

    const congestionInterval = setInterval(() => {
      fetchCongestionData({ limit: 500 }).then(data => {
        if (Array.isArray(data)) {
          setCongestionData(data);
          console.log(`Updated ${data.length} congestion data points`);
        }
      }).catch(error => {
        console.error("Error updating congestion data:", error);
      });
    }, intervals.congestion);
    
    const rsuInterval = setInterval(() => {
      fetchRSUs({ limit: 100 }).then(data => {
        if (Array.isArray(data)) {
          setRsus(data);
          console.log(`Updated ${data.length} RSUs`);
        }
      }).catch(error => {
        console.error("Error updating RSUs:", error);
      });
    }, intervals.rsus);

    return () => {
      clearInterval(vehicleInterval);
      clearInterval(congestionInterval);
      clearInterval(rsuInterval);
    };
  }, [isSimulationRunning, setVehicles, setRsus, setCongestionData, getIntervals]);

  // Show loading skeleton
  if (initialLoading && isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
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
          simulationSpeed={simulationSpeed}
          toggleSimulation={toggleSimulation}
          resetRouting={resetRouting}
          changeSimulationSpeed={changeSimulationSpeed}
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
