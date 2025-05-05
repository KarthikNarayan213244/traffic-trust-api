
import React from "react";
import MapInfoOverlay from "./MapInfoOverlay";
import MapStatsOverlay from "./MapStatsOverlay";
import EmergencyRoutePanel from "./EmergencyRoutePanel";
import { Vehicle } from "@/services/api";

interface MapOverlaysProps {
  vehiclesCount: number;
  rsusCount: number;
  congestionZones: number;
  anomaliesCount: number;
  selectedAmbulance: Vehicle | null;
  destination: google.maps.LatLngLiteral | null;
  directionsStatus: google.maps.DirectionsStatus | null;
  apiKey?: string;
}

const MapOverlays: React.FC<MapOverlaysProps> = ({
  vehiclesCount,
  rsusCount,
  congestionZones,
  anomaliesCount,
  selectedAmbulance,
  destination,
  directionsStatus,
  apiKey
}) => {
  return (
    <>
      <MapInfoOverlay />
      <MapStatsOverlay 
        vehiclesCount={vehiclesCount} 
        rsusCount={rsusCount} 
        congestionZones={congestionZones}
        anomaliesCount={anomaliesCount}
      />
      
      {selectedAmbulance && (
        <EmergencyRoutePanel 
          ambulance={selectedAmbulance} 
          destination={destination} 
          directionsStatus={directionsStatus}
          apiKey={apiKey}
        />
      )}
    </>
  );
};

export default MapOverlays;
