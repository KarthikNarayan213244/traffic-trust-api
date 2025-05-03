
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
  totalVehiclesCount = 3500000,
  rsusCount,
  totalRsusCount = 900,
  congestionZones,
  anomaliesCount,
  vehicleCountSummary
}) => {
  return (
    <div className="absolute top-2 right-2 bg-white/90 rounded-md p-2 text-xs">
      <h4 className="font-semibold mb-1">Traffic Statistics</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span>Vehicles:</span>
          <span className="font-mono">
            {vehiclesCount.toLocaleString()} / {formatNumber(totalVehiclesCount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>RSUs:</span>
          <span className="font-mono">
            {rsusCount.toLocaleString()} / {formatNumber(totalRsusCount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Congestion:</span>
          <span className="font-mono">{congestionZones.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Anomalies:</span>
          <span className="font-mono">{anomaliesCount.toLocaleString()}</span>
        </div>
      </div>
      {vehicleCountSummary && (
        <div className="mt-1 text-xs text-muted-foreground border-t pt-1">
          {vehicleCountSummary}
        </div>
      )}
    </div>
  );
};

export default MapStatsOverlay;
