
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, AlertTriangle, RotateCw } from "lucide-react";
import { Vehicle } from "@/services/api";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="space-x-2 flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={toggleSimulation}
              variant={isSimulationRunning ? "destructive" : "default"}
              className={`transition-all duration-300 ${isSimulationRunning ? "shadow-red-200 shadow-inner" : "shadow-green-200 shadow"}`}
              size="sm"
            >
              {isSimulationRunning ? (
                <><Pause className="mr-1" size={16} /> Pause Live Updates</>
              ) : (
                <><Play className="mr-1" size={16} /> Start Live Updates</>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSimulationRunning ? "Pause real-time data updates" : "Enable real-time data updates"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {selectedAmbulance && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={resetRouting} className="bg-blue-50 border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-all duration-200">
                <X size={14} />
                <span>Cancel Route</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel the current ambulance route planning</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isSimulationRunning && (
        <div className="flex items-center ml-2 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
          <span className="animate-pulse relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </div>
      )}
    </div>
  );
};

export default SimulationControls;
