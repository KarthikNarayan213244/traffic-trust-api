
import React, { useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import MLControls from "./MLControls";
import ApiKeyControl from "./ApiKeyControl";
import { useMapApiKey } from "@/hooks/useMapApiKey";
import { useMLSimulation } from "@/hooks/useMLSimulation";
import { useRealTimeData } from "@/hooks/useRealTimeData";
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
  const { 
    isLiveMonitoring, selectedAmbulance, destination, modelAccuracy, optimizedRoute,
    isModelLoading, modelsLoaded, modelLoadingProgress,
    toggleLiveMonitoring, handleAmbulanceSelect, handleDestinationSelect, resetRouting,
    changeModelAccuracy
  } = useMLSimulation();
  
  // Using our new real-time data hooks
  const { 
    data: vehicles, 
    isLoading: isVehiclesLoading, 
    refreshData: refreshVehicles 
  } = useRealTimeData('vehicle', initialVehicles);
  
  const { 
    data: rsus, 
    isLoading: isRsusLoading, 
    refreshData: refreshRsus 
  } = useRealTimeData('rsu', initialRsus);
  
  const { 
    data: congestionData, 
    isLoading: isCongestionLoading, 
    refreshData: refreshCongestion 
  } = useRealTimeData('congestion', initialCongestionData);
  
  const { 
    data: anomalies, 
    isLoading: isAnomaliesLoading 
  } = useRealTimeData('anomaly', []);

  const [mlUpdateCountdown, setMlUpdateCountdown] = useState<number>(0);

  // Only initialize Google Maps when we have an API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",  // Use empty string if no key is available
    libraries,
    id: "google-map-script", // Ensure consistent ID to prevent multiple initializations
  });
  
  // Combined loading state
  const isLoading = initialLoading || isVehiclesLoading || isRsusLoading || isCongestionLoading || isAnomaliesLoading;

  // Show loading skeleton
  if (isLoading) {
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
        <MLControls
          isLiveMonitoring={isLiveMonitoring}
          selectedAmbulance={selectedAmbulance}
          modelAccuracy={modelAccuracy}
          toggleLiveMonitoring={toggleLiveMonitoring}
          resetRouting={resetRouting}
          changeModelAccuracy={changeModelAccuracy}
          modelProgress={isModelLoading ? modelLoadingProgress : 100}
        />
        
        <ApiKeyControl
          apiKey={apiKey}
          onApiKeySet={handleApiKeySet}
        />
      </div>

      {/* Only render the GoogleMapDisplay when the Google Maps API is loaded */}
      {isLoaded && (
        <GoogleMapDisplay 
          vehicles={vehicles} 
          rsus={rsus} 
          congestionData={congestionData} 
          isLiveMonitoring={isLiveMonitoring}
          selectedAmbulance={selectedAmbulance}
          onAmbulanceSelect={handleAmbulanceSelect}
          destination={destination}
          optimizedRoute={optimizedRoute}
          onMapClick={(latLng) => handleDestinationSelect(latLng, congestionData)}
        />
      )}
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {isLiveMonitoring ? (
            <>
              <span className="text-green-500">●</span> LIVE: {vehicles.length} vehicles, {rsus.length} RSUs, {anomalies.length} anomalies detected
            </>
          ) : (
            <>
              <span className="text-amber-500">●</span> PAUSED: Real-time updates disabled
            </>
          )}
        </span>
        {modelsLoaded && isLiveMonitoring && (
          <span>ML Model Update in: {mlUpdateCountdown}s</span>
        )}
      </div>
    </div>
  );
};

export default TrafficMap;
