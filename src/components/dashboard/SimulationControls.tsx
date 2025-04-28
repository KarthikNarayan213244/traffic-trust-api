
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { Vehicle } from "@/services/api";

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
    <div className="space-x-2">
      <Button 
        onClick={toggleSimulation}
        variant="outline"
        className={isSimulationRunning ? "bg-red-100" : "bg-green-100"}
      >
        {isSimulationRunning ? (
          <><Pause className="mr-1" size={16} /> Pause Live Updates</>
        ) : (
          <><Play className="mr-1" size={16} /> Start Live Updates</>
        )}
      </Button>
      
      {selectedAmbulance && (
        <Button variant="outline" onClick={resetRouting} className="bg-blue-100">
          Cancel Route Planning
        </Button>
      )}
    </div>
  );
};

export default SimulationControls;
