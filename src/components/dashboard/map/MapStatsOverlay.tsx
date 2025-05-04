
import React from "react";
import { formatNumber } from "@/lib/utils";

interface MapStatsOverlayProps {
  vehiclesCount: number;
  totalVehiclesCount?: number;
  rsusCount: number;
  totalRsusCount?: number;
  congestionZones: number;
  anomaliesCount: number;
  vehicleCountSummary?: string;
}

const MapStatsOverlay: React.FC<MapStatsOverlayProps> = ({
  vehiclesCount,
  totalVehiclesCount = 3500000, // Default: 3.5M vehicles
  rsusCount,
  totalRsusCount = 900, // Default: 900 RSUs
  congestionZones,
  anomaliesCount,
  vehicleCountSummary
}) => {
  // Format numbers for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  };

  return (
    <div className="absolute top-2 right-2 bg-white/95 rounded-md p-3 text-xs shadow-md border border-gray-200 z-10">
      <h4 className="font-semibold mb-1.5">Traffic Statistics</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex justify-between">
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
            Vehicles:
          </span>
          <span className="font-mono font-medium">
            {formatCount(vehiclesCount)} / {formatCount(totalVehiclesCount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
            RSUs:
          </span>
          <span className="font-mono font-medium">
            {formatCount(rsusCount)} / {formatCount(totalRsusCount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
            Congestion:
          </span>
          <span className="font-mono font-medium">{formatCount(congestionZones)}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
            Anomalies:
          </span>
          <span className="font-mono font-medium">{formatCount(anomaliesCount)}</span>
        </div>
      </div>
      {vehicleCountSummary && (
        <div className="mt-1.5 pt-1.5 text-xs text-muted-foreground border-t border-gray-200">
          {vehicleCountSummary}
        </div>
      )}
    </div>
  );
};

export default MapStatsOverlay;
