
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
  const [lastRouteRequest, setLastRouteRequest] = useState<string>('');

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log("Google Map loaded successfully");
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

  // Reset directions when ambulance or destination change
  useEffect(() => {
    if (!window.google) {
      console.log("Google Maps API not loaded yet in directions effect");
      return;
    }

    if (selectedAmbulance && destination) {
      const requestKey = `${selectedAmbulance.vehicle_id}-${destination.lat.toFixed(6)}-${destination.lng.toFixed(6)}`;
      
      // Only recalculate if this is a new request
      if (requestKey !== lastRouteRequest) {
        setLastRouteRequest(requestKey);
        setDirections(null);
        setDirectionsStatus(null);
        setIsCalculatingDirections(true);
      }
    } else {
      setLastRouteRequest('');
      setDirections(null);
      setDirectionsStatus(null);
      setIsCalculatingDirections(false);
    }
  }, [selectedAmbulance, destination, optimizedRoute]);

  // Prepare optimized waypoints for directions service
  const optimizedWaypoints = useMemo(() => {
    if (!optimizedRoute || optimizedRoute.length === 0 || !window.google) {
      return [];
    }
    
    try {
      // Only use a reasonable number of waypoints (max 8) to avoid overloading the API
      // and to ensure we get a realistic route that the API can optimize
      const waypointCount = Math.min(optimizedRoute.length, 8);
      const step = optimizedRoute.length / waypointCount;
      
      const waypoints = [];
      for (let i = 0; i < waypointCount; i++) {
        const index = Math.floor(i * step);
        if (index < optimizedRoute.length) {
          const point = optimizedRoute[index];
          waypoints.push({
            location: new google.maps.LatLng(point.lat, point.lng),
            stopover: false
          });
        }
      }
      
      return waypoints;
    } catch (error) {
      console.error("Error creating waypoints:", error);
      return [];
    }
  }, [optimizedRoute]);

  // Directions callback
  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      console.log("Directions API response:", status, result?.routes?.length || 0, "routes");
      setIsCalculatingDirections(false);
      setDirectionsStatus(status);
      
      if (result !== null && status === google.maps.DirectionsStatus.OK) {
        setDirections(result);
        
        // Pan to fit the route
        if (map && result.routes[0]?.bounds) {
          map.fitBounds(result.routes[0].bounds);
        }
      } else {
        console.error(`Directions request failed: ${status}`);
      }
    },
    [map]
  );

  // Focus the map on the route when available
  useEffect(() => {
    if (!window.google || !map || !selectedAmbulance || !destination) {
      return;
    }

    try {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(selectedAmbulance.lat, selectedAmbulance.lng));
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));
      
      // Add a bit of padding around the bounds
      map.fitBounds(bounds, 50); // 50 pixels of padding
    } catch (error) {
      console.error("Error fitting bounds:", error);
    }
  }, [map, selectedAmbulance, destination]);

  // Safety check - don't render if Google Maps API is not available
  if (!window.google) {
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
          onAmbulanceSelect={onAmbulanceSelect}
          selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
        />
        
        {/* RSU markers */}
        <RsuMarkers rsus={rsus} />
        
        {/* Congestion heatmap */}
        <CongestionHeatmap congestionData={congestionData} />
        
        {/* Only use directions service when we have all required elements and a valid API key */}
        {window.google && selectedAmbulance && destination && apiKey && isCalculatingDirections && (
          <DirectionsService
            options={{
              origin: { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng },
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: true,
              waypoints: optimizedWaypoints,
              provideRouteAlternatives: true,
              avoidTolls: optimizedWaypoints.length > 0,
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
