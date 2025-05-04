
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

// Add a global map reference for optimized rendering
declare global {
  interface Window {
    map: any;
  }
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
    // Start with a reasonable limit that can be displayed
    const baseLimit = Math.min(15000, initialVehicles.length);
    
    // Adjust based on zoom level - show more when zoomed in
    const zoomFactor = currentZoom < 10 ? 0.5 : 
                       currentZoom < 12 ? 0.7 : 
                       currentZoom < 14 ? 1 : 1.5;
    
    const limit = Math.floor(baseLimit * zoomFactor);
    
    console.log(`Limiting vehicles to ${limit} from ${initialVehicles.length} (zoom ${currentZoom})`);
    
    // Apply the calculated limit
    return initialVehicles.slice(0, limit);
  }, [initialVehicles, currentZoom]);
  
  const limitedRsus = useMemo(() => {
    // Show all RSUs - they're much fewer than vehicles
    const rsuLimit = Math.min(500, initialRsus.length);
    console.log(`Using ${rsuLimit} RSUs from ${initialRsus.length} available`);
    return initialRsus.slice(0, rsuLimit);
  }, [initialRsus]);
  
  const limitedCongestionData = useMemo(() => {
    // Limit congestion data
    const limit = Math.min(300, initialCongestionData.length);
    return initialCongestionData.slice(0, limit);
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
      
      // Log when map loads
      console.log("Google Maps API loaded successfully");
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
        description: `Updated with ${limitedVehicles.length.toLocaleString()} vehicles and ${limitedRsus.length} RSUs`,
        duration: 2000, // 2 seconds
      });
    }, 60000); // Every 60 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isLiveMonitoring, limitedVehicles.length, limitedRsus.length]);
  
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

  // Log initial render statistics
  console.log(`TrafficMap rendering with ${limitedVehicles.length} vehicles, ${limitedRsus.length} RSUs`);
    
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
