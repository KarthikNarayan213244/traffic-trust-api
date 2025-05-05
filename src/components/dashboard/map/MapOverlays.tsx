
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
  rsus = [],
  anomalies = [],
  isSimulationRunning = false,
  apiKey
}) => {
  // Check if there are RSUs with notable trust changes to show in the overlay
  const hasNotableRsus = rsus.some(rsu => 
    rsu.attack_detected || 
    rsu.quarantined || 
    (rsu.trust_score_change && Math.abs(rsu.trust_score_change) >= 2) ||
    rsu.trust_score < 70 ||
    rsu.blockchain_protected
  );

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
      
      {/* Always show the RSU Trust overlay if there are notable RSUs */}
      {hasNotableRsus && rsus.length > 0 && (
        <RsuTrustOverlay 
          rsus={rsus}
          anomalies={anomalies}
        />
      )}
    </>
  );
};

export default MapOverlays;
