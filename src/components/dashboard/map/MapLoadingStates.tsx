
import React from "react";
import MapApiKeyForm from "../MapApiKeyForm";
import { Skeleton } from "@/components/ui/skeleton";

interface MapLoadingStatesProps {
  isLoading: boolean;
  apiKey: string;
  loadError: Error | undefined;
  isLoaded: boolean;
  handleApiKeySet: (apiKey: string) => void;
}

const MapLoadingStates: React.FC<MapLoadingStatesProps> = ({
  isLoading,
  apiKey,
  loadError,
  isLoaded,
  handleApiKeySet,
}) => {
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

  // If we reach here, the map should be loaded and ready
  return null;
};

export default MapLoadingStates;
