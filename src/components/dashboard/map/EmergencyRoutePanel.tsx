
import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Ambulance } from "lucide-react";
import { formatTimestamp } from "./utils";
import { Vehicle } from "@/services/api";

interface EmergencyRoutePanelProps {
  ambulance: Vehicle;
  destination: google.maps.LatLngLiteral | null;
  directionsStatus: google.maps.DirectionsStatus | null;
}

const EmergencyRoutePanel: React.FC<EmergencyRoutePanelProps> = ({
  ambulance,
  destination,
  directionsStatus
}) => {
  return (
    <div className="absolute bottom-3 right-3 bg-white/90 p-3 rounded-md shadow-md w-64 border border-gray-200 z-10">
      <div className="flex items-center space-x-2 mb-2">
        <Ambulance className="text-red-500" size={20} />
        <h3 className="font-semibold">Emergency Response</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Vehicle ID:</strong> {ambulance.vehicle_id}
        </div>
        <div>
          <strong>Current Location:</strong> {ambulance.location || 'Unknown'}
        </div>
        <div>
          <strong>Status:</strong> {ambulance.status || 'Active'}
        </div>
        <div>
          <strong>Last Updated:</strong> {ambulance.timestamp ? formatTimestamp(ambulance.timestamp) : 'N/A'}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          {!destination ? (
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              Click on map to set destination
            </Badge>
          ) : (
            <>
              <div>
                <strong>Destination:</strong> {`${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
              </div>
              <div className="mt-1">
                <strong>Route Status:</strong>{" "}
                {directionsStatus === google.maps.DirectionsStatus.OK ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700">Route calculated</Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {directionsStatus || 'Calculating...'}
                  </Badge>
                )}
              </div>
              {directionsStatus && directionsStatus !== google.maps.DirectionsStatus.OK && (
                <div className="mt-1 text-xs text-gray-500 italic">
                  Note: Real-time route suggestions require the Directions API permissions.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyRoutePanel;
