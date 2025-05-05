
import React from "react";
import { Button } from "@/components/ui/button";
import { Layers, EyeOff, Eye, AlertTriangle } from "lucide-react";

interface MapOverlaysProps {
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  showAttacks?: boolean;
  setShowAttacks?: (show: boolean) => void;
}

const MapOverlays: React.FC<MapOverlaysProps> = ({ 
  showHeatmap, 
  setShowHeatmap,
  showAttacks = true,
  setShowAttacks
}) => {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2">
      <Button
        variant="secondary"
        size="sm"
        className="bg-white bg-opacity-90 border border-gray-200"
        onClick={() => setShowHeatmap(!showHeatmap)}
      >
        <Layers className="h-4 w-4 mr-1" />
        {showHeatmap ? 'Hide' : 'Show'} Traffic
      </Button>
      
      {setShowAttacks && (
        <Button
          variant="secondary"
          size="sm"
          className="bg-white bg-opacity-90 border border-gray-200"
          onClick={() => setShowAttacks(!showAttacks)}
        >
          {showAttacks ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showAttacks ? 'Hide' : 'Show'} Attacks
          {showAttacks && (
            <span className="ml-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </Button>
      )}
    </div>
  );
};

export default MapOverlays;
