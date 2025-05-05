
import React from "react";
import MapInfoOverlay from "./MapInfoOverlay";
import MapStatsOverlay from "./MapStatsOverlay";
import EmergencyRoutePanel from "./EmergencyRoutePanel";
import RsuTrustOverlay from "./RsuTrustOverlay";
import { Vehicle } from "@/services/api";

interface MapOverlaysProps {
  vehiclesCount: number;
  rsusCount: number;
  congestionZones: number;
  anomaliesCount: number;
  selectedAmbulance: Vehicle | null;
  destination: google.maps.LatLngLiteral | null;
  directionsStatus: google.maps.DirectionsStatus | null;
  rsus?: any[];
  anomalies?: any[];
  isSimulationRunning?: boolean;
}

const MapOverlays: React.FC<MapOverlaysProps> = ({
  vehiclesCount,
  rsusCount,
  congestionZones,
  anomaliesCount,
  selectedAmbulance,
  destination,
  directionsStatus,
  rsus = [],
  anomalies = [],
  isSimulationRunning = false
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
        />
      )}
      
      {isSimulationRunning && rsus.length > 0 && (
        <RsuTrustOverlay 
          rsus={rsus}
          anomalies={anomalies}
        />
      )}
    </>
  );
};

export default MapOverlays;
