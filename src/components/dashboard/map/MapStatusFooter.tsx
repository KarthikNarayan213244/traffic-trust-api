
import React from "react";

interface MapStatusFooterProps {
  isLiveMonitoring: boolean;
  vehicleCountSummary?: string;
  vehicleCount: number;
  rsuCount: number;
  lastUpdated: Date;
}

const MapStatusFooter: React.FC<MapStatusFooterProps> = ({
  isLiveMonitoring,
  vehicleCountSummary,
  vehicleCount,
  rsuCount,
  lastUpdated,
}) => {
  return (
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>
        {isLiveMonitoring ? (
          <>
            <span className="text-green-500">●</span> LIVE: {vehicleCountSummary || `${vehicleCount.toLocaleString()} vehicles, ${rsuCount} RSUs`}
          </>
        ) : (
          <>
            <span className="text-amber-500">●</span> PAUSED: Real-time updates disabled
          </>
        )}
      </span>
      <span>Last refreshed: {lastUpdated.toLocaleTimeString()}</span>
    </div>
  );
};

export default MapStatusFooter;
