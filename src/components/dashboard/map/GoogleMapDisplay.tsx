
import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import VehicleMarkers from "./VehicleMarkers";
import RsuMarkers from "./RsuMarkers";
import CongestionHeatmap from "./CongestionHeatmap";
import MapInfoOverlay from "./MapInfoOverlay";
import MapStatsOverlay from "./MapStatsOverlay";
import EmergencyRoutePanel from "./EmergencyRoutePanel";
import { defaultCenter, mapContainerStyle, mapOptions, mapTheme } from "./constants";
import { Vehicle } from "@/services/api";

interface GoogleMapDisplayProps {
  vehicles: any[];
  rsus: any[];
  congestionData: any[];
  isSimulationRunning?: boolean;
  selectedAmbulance: Vehicle | null;
  destination: google.maps.LatLngLiteral | null;
  onAmbulanceSelect: (vehicle: Vehicle) => void;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
}

const GoogleMapDisplay: React.FC<GoogleMapDisplayProps> = ({
  vehicles,
  rsus,
  congestionData,
  isSimulationRunning = false,
  selectedAmbulance,
  destination,
  onAmbulanceSelect,
  onMapClick
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
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

  // Get directions when ambulance and destination are selected
  useEffect(() => {
    if (selectedAmbulance && destination) {
      // Clear previous directions
      setDirections(null);
      setDirectionsStatus(null);
    }
  }, [selectedAmbulance, destination]);

  // Directions callback
  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (result !== null && status === google.maps.DirectionsStatus.OK) {
        setDirections(result);
        setDirectionsStatus(status);
      } else {
        console.error(`Directions request failed: ${status}`);
        setDirectionsStatus(status);
      }
    },
    []
  );

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
        onClick={handleMapClick}
      >
        {/* Vehicle markers */}
        <VehicleMarkers 
          vehicles={vehicles} 
          isSimulationRunning={isSimulationRunning} 
          onAmbulanceSelect={onAmbulanceSelect}
          selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
        />
        
        {/* RSU markers */}
        <RsuMarkers rsus={rsus} />
        
        {/* Congestion heatmap */}
        <CongestionHeatmap congestionData={congestionData} />
        
        {/* Directions service and renderer */}
        {selectedAmbulance && destination && (
          <DirectionsService
            options={{
              origin: { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng },
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: true
            }}
            callback={directionsCallback}
          />
        )}
        
        {directions && (
          <DirectionsRenderer
            options={{
              directions: directions,
              markerOptions: { visible: false },
              polylineOptions: {
                strokeColor: '#0055FF',
                strokeWeight: 6,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>

      <MapInfoOverlay />
      <MapStatsOverlay vehiclesCount={vehicles.length} rsusCount={rsus.length} />
      
      {selectedAmbulance && (
        <EmergencyRoutePanel 
          ambulance={selectedAmbulance} 
          destination={destination} 
          directionsStatus={directionsStatus}
        />
      )}
    </div>
  );
};

export default GoogleMapDisplay;
