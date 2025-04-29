
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import { Vehicle } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface SimulationControlsProps {
  isSimulationRunning: boolean;
  selectedAmbulance: Vehicle | null;
  toggleSimulation: () => void;
  resetRouting: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  isSimulationRunning,
  selectedAmbulance,
  toggleSimulation,
  resetRouting
}) => {
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isSimulationRunning ? "default" : "outline"}
        className={`${isSimulationRunning ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"} animate-pulse`}
      >
        {isSimulationRunning ? "LIVE" : "PAUSED"}
      </Badge>
      
      <Button 
        onClick={toggleSimulation}
        variant="outline"
        className={`flex items-center gap-1.5 ${isSimulationRunning ? "bg-red-50 hover:bg-red-100 border-red-200" : "bg-green-50 hover:bg-green-100 border-green-200"}`}
        size="sm"
      >
        {isSimulationRunning ? (
          <><Pause className="h-3.5 w-3.5" /> Pause Live Updates</>
        ) : (
          <><Play className="h-3.5 w-3.5" /> Start Live Updates</>
        )}
      </Button>
      
      {selectedAmbulance && (
        <Button 
          variant="outline" 
          onClick={resetRouting} 
          className="bg-blue-50 hover:bg-blue-100 border-blue-200 flex items-center gap-1.5"
          size="sm"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Cancel Route
        </Button>
      )}
    </div>
  );
};

export default SimulationControls;
