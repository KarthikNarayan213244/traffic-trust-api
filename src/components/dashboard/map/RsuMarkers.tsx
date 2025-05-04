
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
        
        // Determine RSU appearance based on status and coverage
        const isActive = rsu.status === "Active";
        const fillColor = isActive ? "#4ADE80" : "#94A3B8";
        const strokeColor = isActive ? "#22C55E" : "#64748B";
        const coverage = rsu.coverage_radius || 500;
        
        return (
          <React.Fragment key={rsu.rsu_id}>
            <Marker
              position={position}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: fillColor,
                fillOpacity: 0.9,
                strokeWeight: 1,
                strokeColor: "#FFFFFF",
                rotation: rsu.heading || 0
              }}
              title={`${rsu.rsu_id} - ${rsu.location || 'Unknown Location'}`}
            />
            <Circle
              center={position}
              radius={coverage}
              options={{
                strokeColor: strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: 1.5,
                fillColor: fillColor,
                fillOpacity: 0.15,
                clickable: false,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default RsuMarkers;
