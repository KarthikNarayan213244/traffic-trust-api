
import React, { useState, useCallback, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import VehicleMarkers from "./VehicleMarkers";
import RsuMarkers from "./RsuMarkers";
import CongestionHeatmap from "./CongestionHeatmap";
import MapInfoOverlay from "./MapInfoOverlay";
import MapStatsOverlay from "./MapStatsOverlay";
import { defaultCenter, mapContainerStyle, mapOptions, mapTheme } from "./constants";

interface GoogleMapDisplayProps {
  vehicles: any[];
  rsus: any[];
  congestionData: any[];
}

const GoogleMapDisplay: React.FC<GoogleMapDisplayProps> = ({
  vehicles,
  rsus,
  congestionData
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  }, []);

  return (
    <div className="h-[400px] relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
        options={{
          ...mapOptions,
          styles: mapTheme,
        }}
        onLoad={onMapLoad}
      >
        <VehicleMarkers vehicles={vehicles} />
        <RsuMarkers rsus={rsus} />
        <CongestionHeatmap congestionData={congestionData} />
      </GoogleMap>

      <MapInfoOverlay />
      <MapStatsOverlay vehiclesCount={vehicles.length} rsusCount={rsus.length} />
    </div>
  );
};

export default GoogleMapDisplay;
