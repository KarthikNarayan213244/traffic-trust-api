
import React, { useState, useEffect, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import { useMapApiKey, markGoogleMapsAsLoaded } from "@/hooks/useMapApiKey";
import { useMLSimulation } from "@/hooks/useMLSimulation";
import { toast } from "@/hooks/use-toast";
import MapLoadingStates from "./map/MapLoadingStates";
import MapToolbar from "./map/MapToolbar";
import MapStatusFooter from "./map/MapStatusFooter";

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
  
  // Limit data size to prevent rendering issues
  // Use useMemo to prevent unnecessary recalculations
  const limitedVehicles = useMemo(() => {
    // Start with a more reasonable limit that can be displayed
    const baseLimit = 10000;
    
    // Adjust based on zoom level - show more when zoomed out
    const zoomFactor = currentZoom < 10 ? 10 : 
                       currentZoom < 12 ? 5 : 
                       currentZoom < 14 ? 2 : 1;
    
    const limit = baseLimit * zoomFactor;
    
    // Apply the calculated limit
    return initialVehicles.slice(0, limit);
  }, [initialVehicles, currentZoom]);
  
  const limitedRsus = useMemo(() => {
    // Show more RSUs when zoomed out
    const rsuLimit = currentZoom < 12 ? 500 : 200;
    return initialRsus.slice(0, rsuLimit);
  }, [initialRsus, currentZoom]);
  
  const limitedCongestionData = useMemo(() => {
    // Limit congestion data
    return initialCongestionData.slice(0, 300);
  }, [initialCongestionData]);

  // Track last update time
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
  
  // Set up periodic data refresh with a cleanup function
  useEffect(() => {
    if (!isLiveMonitoring) return;
    
    // Update last updated timestamp
    const refreshTimestamp = () => {
      setLastUpdated(new Date());
    };
    
    const intervalId = setInterval(() => {
      refreshTimestamp();
      
      // Show minimal notification
      toast({
        title: "Data Refreshed",
        description: "Updated traffic data with live information",
        duration: 2000, // 2 seconds
      });
    }, 60000); // Every 60 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isLiveMonitoring]);
  
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
  const isLoading = initialLoading;

  // First, handle all loading states with the new component
  const loadingState = (
    <MapLoadingStates 
      isLoading={isLoading}
      apiKey={apiKey}
      loadError={loadError}
      isLoaded={isLoaded}
      handleApiKeySet={handleApiKeySet}
    />
  );
  
  if (isLoading || !apiKey || loadError || !isLoaded) {
    return loadingState;
  }

  // Convert modelLoadingProgress to number to fix the type error
  const modelProgressValue = typeof modelLoadingProgress === 'string' 
    ? parseInt(modelLoadingProgress, 10) 
    : modelLoadingProgress;

  return (
    <div className="space-y-2">
      <MapToolbar 
        isLiveMonitoring={isLiveMonitoring}
        selectedAmbulance={selectedAmbulance as Vehicle | null}
        modelAccuracy={modelAccuracy}
        toggleLiveMonitoring={toggleLiveMonitoring}
        resetRouting={resetRouting}
        changeModelAccuracy={changeModelAccuracy}
        isModelLoading={isModelLoading}
        modelLoadingProgress={modelProgressValue}
        apiKey={apiKey}
        onApiKeySet={handleApiKeySet}
      />

      {/* Only render the GoogleMapDisplay when the Google Maps API is loaded */}
      {isLoaded && (
        <GoogleMapDisplay 
          vehicles={limitedVehicles} 
          rsus={limitedRsus} 
          congestionData={limitedCongestionData} 
          isLiveMonitoring={isLiveMonitoring}
          selectedAmbulance={selectedAmbulance as Vehicle | null}
          onAmbulanceSelect={handleAmbulanceSelect}
          destination={destination}
          optimizedRoute={optimizedRoute}
          onMapClick={(latLng) => handleDestinationSelect(latLng, limitedCongestionData)}
          onBoundsChanged={handleMapBoundsChanged}
          vehicleCountSummary={vehicleCountSummary}
        />
      )}
      
      <MapStatusFooter 
        isLiveMonitoring={isLiveMonitoring}
        vehicleCountSummary={vehicleCountSummary}
        vehicleCount={initialVehicles.length}
        rsuCount={initialRsus.length}
        lastUpdated={lastUpdated}
      />
    </div>
  );
};

export default TrafficMap;
