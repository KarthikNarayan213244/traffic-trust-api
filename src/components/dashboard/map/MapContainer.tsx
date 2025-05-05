
import React, { useState, useCallback, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import VehicleMarkers from "./VehicleMarkers";
import RsuMarkers from "./RsuMarkers";
import CongestionHeatmap from "./CongestionHeatmap";
import { mapContainerStyle, mapOptions, mapTheme, defaultCenter } from "./constants";
import { Vehicle } from "@/services/api";

interface MapContainerProps {
  onMapLoad: (map: google.maps.Map) => void;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
  vehicles: any[];
  rsus: any[];
  congestionData: any[];
  selectedAmbulanceId: string | null;
  onAmbulanceSelect: (vehicle: Vehicle) => void;
  isMapReady: boolean;
  children?: React.ReactNode;
}

const MapContainer: React.FC<MapContainerProps> = ({
  onMapLoad,
  onMapClick,
  vehicles,
  rsus,
  congestionData,
  selectedAmbulanceId,
  onAmbulanceSelect,
  isMapReady,
  children
}) => {
  // Safety check - don't render if Google Maps API is not available
  if (!window.google) {
    console.log("Google Maps API not loaded yet in MapContainer render");
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Initializing maps...</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={12}
      options={{
        ...mapOptions,
        styles: mapTheme,
      }}
      onLoad={onMapLoad}
      onClick={onMapClick}
    >
      {/* Vehicle markers */}
      {isMapReady && (
        <VehicleMarkers 
          vehicles={vehicles} 
          onAmbulanceSelect={onAmbulanceSelect}
          selectedAmbulanceId={selectedAmbulanceId}
        />
      )}
      
      {/* RSU markers */}
      {isMapReady && <RsuMarkers rsus={rsus} />}
      
      {/* Congestion heatmap */}
      {isMapReady && <CongestionHeatmap congestionData={congestionData} />}
      
      {/* Additional children (like DirectionsHandler) */}
      {children}
    </GoogleMap>
  );
};

export default MapContainer;
