
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Vehicle } from "@/services/api/types";
import { defaultCenter, mapContainerStyle, mapOptions, libraries } from "./constants";
import VehicleMarkers from "./VehicleMarkers";
import RsuMarkers from "./RsuMarkers";
import CongestionHeatmap from "./CongestionHeatmap";
import MapOverlays from "../MapOverlays";
import RsuTrustOverlay from "./RsuTrustOverlay";
import AttackVisualizations from "./AttackVisualizations";
import { createOptimizedWaypoints } from "./WaypointOptimizer";

// Update the props interface to include new fields
interface GoogleMapDisplayProps {
  vehicles: Vehicle[];
  rsus: any[];
  congestionData: any[];
  isLiveMonitoring?: boolean;
  selectedAmbulance: Vehicle | null;
  onAmbulanceSelect: (ambulance: Vehicle) => void;
  destination: google.maps.LatLngLiteral | null;
  optimizedRoute: google.maps.LatLngLiteral[] | null;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
  anomalies?: any[];
  apiKey?: string;
}

const GoogleMapDisplay: React.FC<GoogleMapDisplayProps> = ({
  vehicles,
  rsus,
  congestionData,
  isLiveMonitoring = false,
  selectedAmbulance,
  onAmbulanceSelect,
  destination,
  optimizedRoute,
  onMapClick,
  anomalies = [],
  apiKey,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showAttacks, setShowAttacks] = useState<boolean>(true);

  // Effect to calculate directions when destination or ambulance changes
  useEffect(() => {
    if (!window.google || !map || !selectedAmbulance || !destination) {
      setDirections(null);
      setShowDirections(false);
      return;
    }

    // Start position is the selected ambulance
    const origin = {
      lat: selectedAmbulance.lat || defaultCenter.lat,
      lng: selectedAmbulance.lng || defaultCenter.lng
    };

    // Prepare waypoints if we have an optimized route
    const waypoints = optimizedRoute ? 
      optimizedRoute.map(point => ({
        location: new google.maps.LatLng(point.lat, point.lng),
        stopover: false
      })) : 
      createOptimizedWaypoints(origin, destination, congestionData);

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
      provideRouteAlternatives: true,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.PESSIMISTIC
      }
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        setDirections(result);
        setShowDirections(true);
      } else {
        console.error(`Error fetching directions: ${status}`);
        setDirections(null);
      }
    });
  }, [map, selectedAmbulance, destination, optimizedRoute, congestionData]);

  // Map load handler
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Map click handler
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, [onMapClick]);

  // Render destination marker
  const renderDestinationMarker = useMemo(() => {
    if (!destination || !showDirections) return null;

    return (
      <Marker
        position={destination}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FF0000",
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: "#FFFFFF"
        }}
        zIndex={1000}
      />
    );
  }, [destination, showDirections]);

  // Render directions
  const renderDirections = useMemo(() => {
    if (!directions || !showDirections) return null;

    return (
      <DirectionsRenderer
        directions={directions}
        options={{
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#4285F4",
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        }}
      />
    );
  }, [directions, showDirections]);

  if (!window.google) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50">
        Loading Google Maps...
      </div>
    );
  }

  return (
    <div className="relative rounded-md overflow-hidden h-[600px] border">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        options={mapOptions}
        onLoad={onMapLoad}
        onClick={handleMapClick}
      >
        {/* Render congestion heatmap if enabled */}
        {showHeatmap && (
          <CongestionHeatmap 
            congestionData={congestionData} 
            map={map}
          />
        )}
        
        {/* Render vehicle markers */}
        <VehicleMarkers 
          vehicles={vehicles}
          isSimulationRunning={isLiveMonitoring}
          selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
          onAmbulanceSelect={onAmbulanceSelect}
        />
        
        {/* Render RSU markers */}
        <RsuMarkers rsus={rsus} />
        
        {/* Render destination and directions */}
        {renderDestinationMarker}
        {renderDirections}
        
        {/* Show trust overlay */}
        <RsuTrustOverlay 
          rsus={rsus}
          anomalies={anomalies}
        />
        
        {/* Show attack visualizations */}
        {showAttacks && isLiveMonitoring && (
          <AttackVisualizations 
            anomalies={anomalies}
            rsus={rsus}
          />
        )}
      </GoogleMap>
      
      {/* Map Controls */}
      <MapOverlays 
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showAttacks={showAttacks}
        setShowAttacks={setShowAttacks}
      />
    </div>
  );
};

export default GoogleMapDisplay;
