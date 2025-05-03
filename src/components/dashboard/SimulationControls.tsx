
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertCircle, RotateCcw, ChevronDown, Navigation } from "lucide-react";
import { Vehicle } from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SimulationControlsProps {
  isSimulationRunning: boolean;
  selectedAmbulance: Vehicle | null;
  simulationSpeed?: 'normal' | 'fast' | 'slow';
  toggleSimulation: () => void;
  resetRouting: () => void;
  changeSimulationSpeed?: (speed: 'normal' | 'fast' | 'slow') => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  isSimulationRunning,
  selectedAmbulance,
  simulationSpeed = 'normal',
  toggleSimulation,
  resetRouting,
  changeSimulationSpeed
}) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button 
        onClick={toggleSimulation}
        variant="outline"
        className={`transition-colors ${isSimulationRunning ? "bg-red-100 hover:bg-red-200" : "bg-green-100 hover:bg-green-200"}`}
      >
        {isSimulationRunning ? (
          <><Pause className="mr-1" size={16} /> Pause TomTom Data</>
        ) : (
          <><Play className="mr-1" size={16} /> Live TomTom Traffic</>
        )}
      </Button>
      
      {isSimulationRunning && (
        <Badge className="bg-green-600 animate-pulse">
          <span className="mr-1">●</span> LIVE
        </Badge>
      )}
      
      {selectedAmbulance && (
        <Button variant="outline" onClick={resetRouting} className="bg-blue-100 hover:bg-blue-200">
          <RotateCcw className="mr-1" size={16} />
          Cancel Route Planning
        </Button>
      )}
      
      {changeSimulationSpeed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Navigation className="mr-2" size={16} />
              Update: {simulationSpeed.charAt(0).toUpperCase() + simulationSpeed.slice(1)}
              <ChevronDown className="ml-1" size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeSimulationSpeed('slow')}>
              Slow (2 min)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeSimulationSpeed('normal')}>
              Normal (1 min)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeSimulationSpeed('fast')}>
              Fast (30 sec)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <AlertCircle className="mr-1" size={14} />
              TomTom API request frequency
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default SimulationControls;
