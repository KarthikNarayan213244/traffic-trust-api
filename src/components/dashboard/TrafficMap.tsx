
import React, { useState, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { API_KEY_STORAGE_KEY, libraries } from "./map/constants";

interface TrafficMapProps {
  vehicles?: any[];
  rsus?: any[];
  isLoading?: boolean;
  congestionData?: any[];
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehicles = [],
  rsus = [],
  isLoading = false,
  congestionData = []
}) => {
  // State for Google Maps API key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  });
  
  // Setup Google Maps JS API loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Handle API key update
  const handleApiKeySet = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    // Force reload the page to re-initialize the Google Maps API with the new key
    if (newApiKey !== apiKey) {
      window.location.reload();
    }
  }, [apiKey]);

  // Show loading spinner
  if (isLoading) {
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
    <>
      <MapApiKeyForm onApiKeySet={handleApiKeySet} />
      <GoogleMapDisplay 
        vehicles={vehicles} 
        rsus={rsus} 
        congestionData={congestionData} 
      />
    </>
  );
};

export default TrafficMap;
