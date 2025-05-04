
import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Ambulance, ExternalLink } from "lucide-react";
import { formatTimestamp } from "./utils";
import { Vehicle } from "@/services/api";

interface EmergencyRoutePanelProps {
  ambulance: Vehicle;
  destination: google.maps.LatLngLiteral | null;
  directionsStatus: google.maps.DirectionsStatus | null;
  apiKey?: string;
}

const EmergencyRoutePanel: React.FC<EmergencyRoutePanelProps> = ({
  ambulance,
  destination,
  directionsStatus,
  apiKey
}) => {
  // Helper function to display appropriate message based on directions status
  const getDirectionsStatusMessage = () => {
    if (directionsStatus === google.maps.DirectionsStatus.OK) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700">Route calculated</Badge>
      );
    }
    
    if (directionsStatus === google.maps.DirectionsStatus.REQUEST_DENIED) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 flex items-center gap-1">
          <AlertCircle size={12} />
          Permission Denied
        </Badge>
      );
    }
    
    if (directionsStatus) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <AlertCircle size={12} />
          {directionsStatus}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1">
        Calculating...
      </Badge>
    );
  };
  
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
          <strong>Current Location:</strong> {ambulance.location ? 
            `${ambulance.location.lat.toFixed(4)}, ${ambulance.location.lng.toFixed(4)}` : 'Unknown'}
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
                {getDirectionsStatusMessage()}
              </div>
              
              {directionsStatus === google.maps.DirectionsStatus.REQUEST_DENIED && (
                <div className="mt-2 text-xs bg-amber-50 p-2 rounded border border-amber-200">
                  {!apiKey ? (
                    <>
                      <p className="font-semibold text-amber-800">API Key Required:</p>
                      <p className="mt-1 text-amber-700">Please set your Google Maps API key in the settings.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-amber-800">API Configuration Required:</p>
                      <ol className="list-decimal ml-4 mt-1 text-amber-700 space-y-1">
                        <li>Go to <a href="https://console.cloud.google.com/google/maps-apis/api-list" target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">
                          Google Cloud Console <ExternalLink size={10} />
                        </a></li>
                        <li>Enable the <strong>Directions API</strong> for your project</li>
                        <li>Your API key must have the Directions API permission</li>
                        <li>Update your API key in the app settings</li>
                      </ol>
                    </>
                  )}
                </div>
              )}
              
              {directionsStatus && 
               directionsStatus !== google.maps.DirectionsStatus.OK && 
               directionsStatus !== google.maps.DirectionsStatus.REQUEST_DENIED && (
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
