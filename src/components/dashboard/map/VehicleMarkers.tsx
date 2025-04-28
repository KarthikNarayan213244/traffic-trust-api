
import React from "react";
import { Marker } from "@react-google-maps/api";
import { getTrustScoreColor } from "./utils";
import { defaultCenter } from "./constants";

interface VehicleMarkersProps {
  vehicles: any[];
}

const VehicleMarkers: React.FC<VehicleMarkersProps> = ({ vehicles }) => {
  return (
    <>
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.vehicle_id}
          position={{
            lat: vehicle.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
            lng: vehicle.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05)),
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getTrustScoreColor(vehicle.trust_score),
            fillOpacity: 0.7,
            strokeWeight: 1,
            strokeColor: "#FFFFFF",
          }}
          title={`${vehicle.vehicle_id} - Trust: ${vehicle.trust_score}`}
        />
      ))}
    </>
  );
};

export default VehicleMarkers;
