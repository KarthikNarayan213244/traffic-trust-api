
import React, { memo } from "react";
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
          vehicles={vehicles}
          rsus={rsus}
          isLoading={isLoading}
          congestionData={congestionData}
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
