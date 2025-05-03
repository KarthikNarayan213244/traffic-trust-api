
import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrafficMap from "@/components/dashboard/TrafficMap";

interface TrafficMonitorCardProps {
  vehicles: any[];
  rsus: any[];
  congestionData: any[];
  isLoading: boolean;
  onBoundsChanged: (bounds: any, zoom: number) => void;
  vehicleCountSummary: string;
}

// Memoize the component to prevent unnecessary re-renders
const TrafficMonitorCard: React.FC<TrafficMonitorCardProps> = memo(({
  vehicles,
  rsus,
  congestionData,
  isLoading,
  onBoundsChanged,
  vehicleCountSummary
}) => {
  // Use memoized data for better performance
  const memoizedVehicles = useMemo(() => vehicles, [vehicles]);
  const memoizedRsus = useMemo(() => rsus, [rsus]);
  const memoizedCongestionData = useMemo(() => congestionData, [congestionData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Traffic Monitoring</CardTitle>
        <CardDescription>
          View and track {vehicleCountSummary} across Hyderabad with live updates
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <TrafficMap 
          vehicles={memoizedVehicles}
          rsus={memoizedRsus}
          isLoading={isLoading}
          congestionData={memoizedCongestionData}
          onBoundsChanged={onBoundsChanged}
          vehicleCountSummary={vehicleCountSummary}
        />
      </CardContent>
    </Card>
  );
});

// Display name for debugging
TrafficMonitorCard.displayName = "TrafficMonitorCard";

export default TrafficMonitorCard;
