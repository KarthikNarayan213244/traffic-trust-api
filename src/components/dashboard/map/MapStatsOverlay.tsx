
import React from "react";
import { Car, Radio, AlertTriangle } from "lucide-react";

interface MapStatsOverlayProps {
  vehiclesCount: number;
  rsusCount: number;
  congestionZones: number;
  anomaliesCount: number;
  vehicleCountSummary?: string;
}

const MapStatsOverlay: React.FC<MapStatsOverlayProps> = ({
  vehiclesCount,
  rsusCount,
  congestionZones,
  anomaliesCount,
  vehicleCountSummary
}) => {
  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1 z-20 bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 shadow text-xs">
      <div className="flex items-center gap-1">
        <Car className="h-3 w-3" />
        <span className="font-medium">
          {vehicleCountSummary || 
            (vehiclesCount > 1000 
              ? `${(vehiclesCount / 1000).toFixed(1)}k Vehicles` 
              : `${vehiclesCount} Vehicles`)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Radio className="h-3 w-3" />
        <span className="font-medium">{rsusCount} RSUs</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded-full bg-red-400 opacity-70"></div>
        <span className="font-medium">{congestionZones} Congested Areas</span>
      </div>
      {anomaliesCount > 0 && (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="font-medium">{anomaliesCount} Anomalies</span>
        </div>
      )}
    </div>
  );
};

export default MapStatsOverlay;
