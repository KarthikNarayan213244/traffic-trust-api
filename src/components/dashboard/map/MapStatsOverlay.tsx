
import React from "react";

interface MapStatsOverlayProps {
  vehiclesCount: number;
  rsusCount: number;
  congestionZones?: number;
  anomaliesCount?: number;
}

const MapStatsOverlay: React.FC<MapStatsOverlayProps> = ({ 
  vehiclesCount, 
  rsusCount, 
  congestionZones = 0,
  anomaliesCount = 0
}) => {
  return (
    <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-md p-3 text-xs shadow-md">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <p>{vehiclesCount} vehicles</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <p>{rsusCount} RSUs</p>
        </div>
        
        {congestionZones > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p>{congestionZones} zones</p>
          </div>
        )}
        
        {anomaliesCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <p>{anomaliesCount} anomalies</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapStatsOverlay;
