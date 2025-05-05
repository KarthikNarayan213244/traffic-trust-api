
import React from "react";
import { Marker, Circle } from "@react-google-maps/api";
import { defaultCenter } from "./constants";

interface RsuMarkersProps {
  rsus: any[];
}

const RsuMarkers: React.FC<RsuMarkersProps> = ({ rsus }) => {
  if (!window.google) {
    console.log("Google Maps API not loaded yet in RsuMarkers");
    return null;
  }

  return (
    <>
      {rsus.map((rsu) => {
        const position = {
          lat: rsu.lat || (defaultCenter.lat + (Math.random() * 0.12 - 0.06)),
          lng: rsu.lng || (defaultCenter.lng + (Math.random() * 0.12 - 0.06)),
        };
        
        // Determine RSU appearance based on status, trust score, and security
        const isActive = rsu.status === "Active";
        const isQuarantined = rsu.quarantined === true;
        const isUnderAttack = !isQuarantined && rsu.attack_detected === true;
        const hasLowTrust = !isQuarantined && !isUnderAttack && rsu.trust_score && rsu.trust_score < 70;
        
        // Choose colors based on status
        let fillColor = isActive ? "#4ADE80" : "#94A3B8";  // Default green or gray
        let strokeColor = isActive ? "#22C55E" : "#64748B"; // Default green or gray
        
        // Override for security states
        if (isQuarantined) {
          fillColor = "#EF4444";  // Red for quarantined
          strokeColor = "#B91C1C";
        } else if (isUnderAttack) {
          fillColor = "#F97316";  // Orange for under attack
          strokeColor = "#C2410C";
        } else if (hasLowTrust) {
          fillColor = "#FACC15";  // Yellow for low trust
          strokeColor = "#CA8A04";
        }
        
        // Calculate coverage radius based on trust - lower trust = smaller radius
        const trustFactor = (rsu.trust_score || 90) / 100;
        const baseRadius = rsu.coverage_radius || 500;
        const coverage = isQuarantined ? baseRadius * 0.3 : baseRadius * Math.max(0.5, trustFactor);
        
        // Use key for both markers to ensure uniqueness
        const markerId = `rsu-${rsu.rsu_id}`;
        const circleId = `rsu-circle-${rsu.rsu_id}`;
        
        return [
          <Marker
            key={markerId}
            position={position}
            icon={{
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: fillColor,
              fillOpacity: 0.9,
              strokeWeight: 1,
              strokeColor: "#FFFFFF",
              rotation: rsu.heading || 0
            }}
            title={`${rsu.rsu_id} - ${rsu.location || 'Unknown Location'}${
              rsu.trust_score ? ` - Trust: ${rsu.trust_score}` : ''
            }${isQuarantined ? ' (QUARANTINED)' : isUnderAttack ? ' (UNDER ATTACK)' : ''}`}
          />,
          <Circle
            key={circleId}
            center={position}
            radius={coverage}
            options={{
              strokeColor: strokeColor,
              strokeOpacity: 0.8,
              strokeWeight: 1.5,
              fillColor: fillColor,
              fillOpacity: isQuarantined ? 0.05 : isUnderAttack ? 0.1 : 0.15,
              clickable: false,
            }}
          />
        ];
      }).flat()}
    </>
  );
};

export default RsuMarkers;
