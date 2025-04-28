
import React from "react";
import { Marker, Circle } from "@react-google-maps/api";
import { defaultCenter } from "./constants";

interface RsuMarkersProps {
  rsus: any[];
}

const RsuMarkers: React.FC<RsuMarkersProps> = ({ rsus }) => {
  return (
    <>
      {rsus.map((rsu) => (
        <React.Fragment key={rsu.rsu_id}>
          <Marker
            position={{
              lat: rsu.lat || (defaultCenter.lat + (Math.random() * 0.12 - 0.06)),
              lng: rsu.lng || (defaultCenter.lng + (Math.random() * 0.12 - 0.06)),
            }}
            icon={{
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: rsu.status === "Active" ? "#4ADE80" : "#94A3B8",
              fillOpacity: 0.9,
              strokeWeight: 1,
              strokeColor: "#FFFFFF",
            }}
            title={`${rsu.rsu_id} - ${rsu.location}`}
          />
          <Circle
            center={{
              lat: rsu.lat || (defaultCenter.lat + (Math.random() * 0.12 - 0.06)),
              lng: rsu.lng || (defaultCenter.lng + (Math.random() * 0.12 - 0.06)),
            }}
            radius={rsu.coverage_radius || 500}
            options={{
              strokeColor: rsu.status === "Active" ? "#4ADE80" : "#94A3B8",
              strokeOpacity: 0.8,
              strokeWeight: 1,
              fillColor: rsu.status === "Active" ? "#4ADE80" : "#94A3B8",
              fillOpacity: 0.15,
            }}
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default RsuMarkers;
