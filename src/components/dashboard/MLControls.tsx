
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertCircle, RotateCcw, ChevronDown, Brain } from "lucide-react";
import { Vehicle } from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface MLControlsProps {
  isLiveMonitoring: boolean;
  selectedAmbulance: Vehicle | null;
  modelAccuracy?: 'standard' | 'high' | 'experimental';
  toggleLiveMonitoring: () => void;
  resetRouting: () => void;
  changeModelAccuracy?: (accuracy: 'standard' | 'high' | 'experimental') => void;
  modelProgress?: number;
}

const MLControls: React.FC<MLControlsProps> = ({
  isLiveMonitoring,
  selectedAmbulance,
  modelAccuracy = 'standard',
  toggleLiveMonitoring,
  resetRouting,
  changeModelAccuracy,
  modelProgress = 100
}) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button 
        onClick={toggleLiveMonitoring}
        variant="outline"
        className={`transition-colors ${isLiveMonitoring ? "bg-red-100 hover:bg-red-200" : "bg-green-100 hover:bg-green-200"}`}
      >
        {isLiveMonitoring ? (
          <><Pause className="mr-1" size={16} /> Pause Monitoring</>
        ) : (
          <><Play className="mr-1" size={16} /> Real Time Monitoring</>
        )}
      </Button>
      
      {isLiveMonitoring && (
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
      
      {changeModelAccuracy && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Brain className="mr-1" size={16} />
              ML Mode: {modelAccuracy.charAt(0).toUpperCase() + modelAccuracy.slice(1)}
              <ChevronDown className="ml-1" size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeModelAccuracy('standard')}>
              Standard Accuracy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeModelAccuracy('high')}>
              High Accuracy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeModelAccuracy('experimental')}>
              Experimental Models
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <AlertCircle className="mr-1" size={14} />
              Higher accuracy requires more processing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {modelProgress < 100 && (
        <div className="flex items-center ml-2">
          <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${modelProgress}%` }}
            ></div>
          </div>
          <span className="text-xs ml-2">{modelProgress}%</span>
        </div>
      )}
    </div>
  );
};

export default MLControls;
