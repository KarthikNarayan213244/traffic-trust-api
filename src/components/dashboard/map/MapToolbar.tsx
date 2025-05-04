
import React from "react";
import MLControls from "../MLControls";
import ApiKeyControl from "../ApiKeyControl";
import { Vehicle } from "@/services/api/types";

interface MapToolbarProps {
  isLiveMonitoring: boolean;
  selectedAmbulance: Vehicle | null;
  modelAccuracy: number | 'standard' | 'high' | 'experimental';
  toggleLiveMonitoring: () => void;
  resetRouting: () => void;
  changeModelAccuracy: (accuracy: 'standard' | 'high' | 'experimental') => void;
  isModelLoading: boolean;
  modelLoadingProgress: number;
  apiKey: string;
  onApiKeySet: (apiKey: string) => void;
}

const MapToolbar: React.FC<MapToolbarProps> = ({
  isLiveMonitoring,
  selectedAmbulance,
  modelAccuracy,
  toggleLiveMonitoring,
  resetRouting,
  changeModelAccuracy,
  isModelLoading,
  modelLoadingProgress,
  apiKey,
  onApiKeySet,
}) => {
  // Convert modelAccuracy to the expected string type if it's a number
  const formattedModelAccuracy = typeof modelAccuracy === 'number' 
    ? 'standard' as const 
    : modelAccuracy;
    
  return (
    <div className="flex justify-between items-center">
      <MLControls
        isLiveMonitoring={isLiveMonitoring}
        selectedAmbulance={selectedAmbulance}
        modelAccuracy={formattedModelAccuracy}
        toggleLiveMonitoring={toggleLiveMonitoring}
        resetRouting={resetRouting}
        changeModelAccuracy={changeModelAccuracy}
        modelProgress={isModelLoading ? modelLoadingProgress : 100}
      />
      
      <ApiKeyControl
        apiKey={apiKey}
        onApiKeySet={onApiKeySet}
      />
    </div>
  );
};

export default MapToolbar;
