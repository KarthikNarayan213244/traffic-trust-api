
import React from "react";
import MLControls from "../MLControls";
import ApiKeyControl from "../ApiKeyControl";
import { Vehicle } from "@/services/api/types";

interface MapToolbarProps {
  isLiveMonitoring: boolean;
  selectedAmbulance: Vehicle | null;
  modelAccuracy: number;
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
  return (
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
        onApiKeySet={onApiKeySet}
      />
    </div>
  );
};

export default MapToolbar;
