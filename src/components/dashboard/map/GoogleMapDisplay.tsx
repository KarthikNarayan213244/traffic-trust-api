
import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, DirectionsService, DirectionsRenderer, Polyline } from "@react-google-maps/api";
import VehicleMarkers from "./VehicleMarkers";
import RsuMarkers from "./RsuMarkers";
import CongestionHeatmap from "./CongestionHeatmap";
import MapInfoOverlay from "./MapInfoOverlay";
import MapStatsOverlay from "./MapStatsOverlay";
import EmergencyRoutePanel from "./EmergencyRoutePanel";
import { defaultCenter, mapContainerStyle, mapOptions, mapTheme } from "./constants";
import { Vehicle } from "@/services/api";
import { useMapApiKey } from "@/hooks/useMapApiKey";

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
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { apiKey } = useMapApiKey();

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

  // Prepare optimized route for rendering if available
  const optimizedRouteCoordinates = useMemo(() => {
    if (!selectedAmbulance || !destination || !optimizedRoute?.length) {
      return null;
    }
    
    // Create a complete path from origin through waypoints to destination
    return [
      { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng },
      ...optimizedRoute,
      destination
    ];
  }, [selectedAmbulance, destination, optimizedRoute]);

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
          isLiveMonitoring={isLiveMonitoring} 
          onAmbulanceSelect={onAmbulanceSelect}
          selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
        />
        
        {/* RSU markers */}
        <RsuMarkers rsus={rsus} />
        
        {/* Congestion heatmap */}
        <CongestionHeatmap congestionData={congestionData} />
        
        {/* ML-optimized route if available */}
        {optimizedRouteCoordinates && (
          <Polyline
            path={optimizedRouteCoordinates}
            options={{
              strokeColor: '#00A3FF',
              strokeWeight: 6,
              strokeOpacity: 0.8,
              geodesic: true,
              icons: [{
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#FFFFFF'
                },
                offset: '0',
                repeat: '80px'
              }]
            }}
          />
        )}
        
        {/* Standard directions service and renderer (fallback) */}
        {selectedAmbulance && destination && !optimizedRouteCoordinates && apiKey && (
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
        
        {!optimizedRouteCoordinates && directions && (
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
      <MapStatsOverlay 
        vehiclesCount={vehicles.length} 
        rsusCount={rsus.length} 
        isMLEnabled={isLiveMonitoring}
      />
      
      {selectedAmbulance && (
        <EmergencyRoutePanel 
          ambulance={selectedAmbulance} 
          destination={destination} 
          directionsStatus={directionsStatus}
          apiKey={apiKey}
          isMLOptimized={!!optimizedRouteCoordinates}
        />
      )}
    </div>
  );
};

export default GoogleMapDisplay;
