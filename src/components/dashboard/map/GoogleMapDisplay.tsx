
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  const [isCalculatingDirections, setIsCalculatingDirections] = useState<boolean>(false);
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

  // Get directions when ambulance and destination are selected or when optimizedRoute changes
  useEffect(() => {
    if (selectedAmbulance && destination) {
      // Clear previous directions
      setDirections(null);
      setDirectionsStatus(null);
      setIsCalculatingDirections(true);
    }
  }, [selectedAmbulance, destination, optimizedRoute]);

  // Directions callback
  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      setIsCalculatingDirections(false);
      if (result !== null && status === google.maps.DirectionsStatus.OK) {
        setDirections(result);
        setDirectionsStatus(status);
        
        // Pan to fit the route
        if (map && result.routes[0]?.bounds) {
          map.fitBounds(result.routes[0].bounds);
        }
      } else {
        console.error(`Directions request failed: ${status}`);
        setDirectionsStatus(status);
      }
    },
    [map]
  );

  // Prepare optimized waypoints for directions service
  const optimizedWaypoints = useMemo(() => {
    if (!optimizedRoute || !optimizedRoute.length) {
      return [];
    }
    
    return optimizedRoute.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      stopover: false
    }));
  }, [optimizedRoute]);

  // Focus the map on the route when available
  useEffect(() => {
    if (map && selectedAmbulance && destination) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(selectedAmbulance.lat, selectedAmbulance.lng));
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));
      
      if (optimizedRoute) {
        optimizedRoute.forEach(point => {
          bounds.extend(new google.maps.LatLng(point.lat, point.lng));
        });
      }
      
      map.fitBounds(bounds);
    }
  }, [map, selectedAmbulance, destination, optimizedRoute]);

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
          isSimulationRunning={isLiveMonitoring} 
          onAmbulanceSelect={onAmbulanceSelect}
          selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
        />
        
        {/* RSU markers */}
        <RsuMarkers rsus={rsus} />
        
        {/* Congestion heatmap */}
        <CongestionHeatmap congestionData={congestionData} />
        
        {/* Use Google Maps Directions service with optimized waypoints */}
        {selectedAmbulance && destination && apiKey && isCalculatingDirections && (
          <DirectionsService
            options={{
              origin: { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng },
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: true,
              waypoints: optimizedWaypoints,
              provideRouteAlternatives: true,
              avoidTolls: optimizedRoute ? optimizedRoute.length > 0 : false,
              avoidFerries: true
            }}
            callback={directionsCallback}
          />
        )}
        
        {/* Render the directions once received */}
        {directions && (
          <DirectionsRenderer
            options={{
              directions: directions,
              markerOptions: { 
                visible: false  // Hide default markers
              },
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
        congestionZones={congestionData.length > 0 ? Math.ceil(congestionData.length / 3) : 0}
        anomaliesCount={vehicles.filter(v => v.status === 'Warning' || v.status === 'Alert').length}
      />
      
      {selectedAmbulance && (
        <EmergencyRoutePanel 
          ambulance={selectedAmbulance} 
          destination={destination} 
          directionsStatus={directionsStatus}
          apiKey={apiKey}
        />
      )}
    </div>
  );
};

export default GoogleMapDisplay;
