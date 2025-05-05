
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Vehicle } from "@/services/api";
import { useMapApiKey } from "@/hooks/useMapApiKey";
import MapContainer from "./MapContainer";
import DirectionsHandler from "./DirectionsHandler";
import MapOverlays from "./MapOverlays";
import { createOptimizedWaypoints } from "./WaypointOptimizer";

interface GoogleMapDisplayProps {
  vehicles: any[];
  rsus: any[];
  congestionData: any[];
  isLiveMonitoring?: boolean;
  selectedAmbulance: Vehicle | null;
  destination: google.maps.LatLngLiteral | null;
  optimizedRoute: google.maps.LatLngLiteral[] | null;
  onAmbulanceSelect: (vehicle: Vehicle) => void;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
}

const GoogleMapDisplay: React.FC<GoogleMapDisplayProps> = ({
  vehicles,
  rsus,
  congestionData,
  isLiveMonitoring = false,
  selectedAmbulance,
  destination,
  optimizedRoute,
  onAmbulanceSelect,
  onMapClick
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { apiKey, keyIsSet } = useMapApiKey();
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Check if Google Maps API is available
  const googleMapsLoaded = Boolean(typeof window !== 'undefined' && window.google && window.google.maps);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log("Google Map loaded successfully");
    mapRef.current = mapInstance;
    setMap(mapInstance);
    setIsMapReady(true);
  }, []);

  // Handle map click for destination selection
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && selectedAmbulance) {
      const clickLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      onMapClick(clickLocation);
    }
  }, [selectedAmbulance, onMapClick]);

  // Create optimized waypoints for directions
  const optimizedWaypoints = createOptimizedWaypoints(optimizedRoute);

  // Safety check - don't render if Google Maps API is not available
  if (!googleMapsLoaded) {
    console.log("Google Maps API not loaded yet in GoogleMapDisplay render");
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Initializing maps...</span>
      </div>
    );
  }

  return (
    <div className="h-[400px] relative">
      <MapContainer
        onMapLoad={onMapLoad}
        onMapClick={handleMapClick}
        vehicles={vehicles}
        rsus={rsus}
        congestionData={congestionData}
        selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
        onAmbulanceSelect={onAmbulanceSelect}
        isMapReady={isMapReady}
      >
        {/* Directions handler component for routing */}
        {isMapReady && (
          <DirectionsHandler
            map={map}
            selectedAmbulance={selectedAmbulance}
            destination={destination}
            optimizedWaypoints={optimizedWaypoints}
            keyIsSet={keyIsSet}
          />
        )}
      </MapContainer>

      {/* Map overlays (info, stats, emergency panel) */}
      <MapOverlays 
        vehiclesCount={vehicles.length} 
        rsusCount={rsus.length} 
        congestionZones={congestionData.length > 0 ? Math.ceil(congestionData.length / 3) : 0}
        anomaliesCount={vehicles.filter(v => v.status === 'Warning' || v.status === 'Alert').length}
        selectedAmbulance={selectedAmbulance}
        destination={destination}
        directionsStatus={directionsStatus}
        apiKey={apiKey}
      />
    </div>
  );
};

export default GoogleMapDisplay;
