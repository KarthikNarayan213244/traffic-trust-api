
import React, { useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import MLControls from "./MLControls";
import ApiKeyControl from "./ApiKeyControl";
import { useMapApiKey, markGoogleMapsAsLoaded } from "@/hooks/useMapApiKey";
import { useMLSimulation } from "@/hooks/useMLSimulation";
import { useScaledTrafficData } from "@/hooks/useScaledTrafficData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface TrafficMapProps {
  vehicles?: any[];
  rsus?: any[];
  isLoading?: boolean;
  congestionData?: any[];
  onBoundsChanged?: (bounds: any, zoom: number) => void;
  vehicleCountSummary?: string;
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehicles: initialVehicles = [],
  rsus: initialRsus = [],
  isLoading: initialLoading = false,
  congestionData: initialCongestionData = [],
  onBoundsChanged,
  vehicleCountSummary
}) => {
  // Custom hooks to manage state
  const { apiKey, handleApiKeySet } = useMapApiKey();
  const { 
    isLiveMonitoring, selectedAmbulance, destination, modelAccuracy, optimizedRoute,
    isModelLoading, modelsLoaded, modelLoadingProgress,
    toggleLiveMonitoring, handleAmbulanceSelect, handleDestinationSelect, resetRouting,
    changeModelAccuracy
  } = useMLSimulation();
  
  // Map bounds and zoom state
  const [currentBounds, setCurrentBounds] = useState<any>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  
  // Using our scaled traffic data hook
  const { 
    data, 
    isLoading: isDataLoading, 
    refreshData,
    lastUpdated 
  } = useScaledTrafficData({
    initialRefreshInterval: 60000,
    visibleBounds: currentBounds,
    zoomLevel: currentZoom
  });
  
  // Use provided data if available, otherwise use from hook
  const vehicles = initialVehicles.length > 0 ? initialVehicles : data.vehicles;
  const rsus = initialRsus.length > 0 ? initialRsus : data.rsus;
  const congestionData = initialCongestionData.length > 0 ? initialCongestionData : data.congestion;
  const anomalies = data.anomalies;

  const [mlUpdateCountdown, setMlUpdateCountdown] = useState<number>(0);

  // Only initialize Google Maps when we have an API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",  // Use empty string if no key is available
    libraries,
    id: "google-map-script", // Ensure consistent ID to prevent multiple initializations
  });

  // Mark the Google Maps API as loaded to prevent multiple initializations
  useEffect(() => {
    if (isLoaded) {
      markGoogleMapsAsLoaded();
    }
  }, [isLoaded]);
  
  // Set up periodic data refresh
  useEffect(() => {
    if (!isLiveMonitoring) return;
    
    const intervalId = setInterval(() => {
      refreshData();
      
      // Show minimal notification
      toast({
        title: "Data Refreshed",
        description: "Updated traffic data with live information",
        duration: 2000, // 2 seconds
      });
    }, 60000); // Every 60 seconds
    
    return () => clearInterval(intervalId);
  }, [isLiveMonitoring, refreshData]);
  
  // Handle map bounds changed
  const handleMapBoundsChanged = (bounds: any, zoom: number) => {
    setCurrentBounds(bounds);
    setCurrentZoom(zoom);
    
    // Propagate to parent if needed
    if (onBoundsChanged) {
      onBoundsChanged(bounds, zoom);
    }
  };
  
  // Combined loading state
  const isLoading = initialLoading || isDataLoading;

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
          selectedAmbulance={selectedAmbulance as Vehicle | null}
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
          selectedAmbulance={selectedAmbulance as Vehicle | null}
          onAmbulanceSelect={handleAmbulanceSelect}
          destination={destination}
          optimizedRoute={optimizedRoute}
          onMapClick={(latLng) => handleDestinationSelect(latLng, congestionData)}
          onBoundsChanged={handleMapBoundsChanged}
          vehicleCountSummary={vehicleCountSummary}
        />
      )}
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {isLiveMonitoring ? (
            <>
              <span className="text-green-500">●</span> LIVE: {vehicleCountSummary || `${vehicles.length.toLocaleString()} vehicles, ${rsus.length} RSUs`}, {anomalies.length} anomalies detected
            </>
          ) : (
            <>
              <span className="text-amber-500">●</span> PAUSED: Real-time updates disabled
            </>
          )}
        </span>
        <span>Last refreshed: {lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default TrafficMap;
