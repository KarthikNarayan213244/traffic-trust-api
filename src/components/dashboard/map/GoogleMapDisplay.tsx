import React, { useState, useCallback, useMemo } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Vehicle } from "@/services/api/types";
import { defaultCenter, mapContainerStyle, mapOptions, libraries } from "./constants";
import VehicleMarkers from "./VehicleMarkers";
import RsuMarkers from "./RsuMarkers";
import CongestionOverlay from "./CongestionOverlay";
import MapOverlays from "./MapOverlays";
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
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load stored map styles from local storage or use default
  const storedMapStyle = typeof window !== 'undefined' ? localStorage.getItem('mapStyle') : null;
  const defaultMapStyle = [
    {
      "featureType": "poi",
      "stylers": [
        { "visibility": "off" }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        { "visibility": "off" }
      ]
    }
  ];
  const initialMapStyle = storedMapStyle ? JSON.parse(storedMapStyle) : defaultMapStyle;
  const [mapStyle, setMapStyle] = useState(initialMapStyle);

  // Save map style to local storage
  const handleStyleChange = useCallback((newStyle) => {
    setMapStyle(newStyle);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mapStyle', JSON.stringify(newStyle));
    }
  }, []);

  // Load map
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Unload map
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate directions
  useEffect(() => {
    if (!destination || !selectedAmbulance || !window.google) return;

    const service = new window.google.maps.DirectionsService();
    const origin = new window.google.maps.LatLng(selectedAmbulance.lat, selectedAmbulance.lng);
    const destinationLatLng = new window.google.maps.LatLng(destination.lat, destination.lng);
    
    // Use optimized waypoints if available
    const waypoints = createOptimizedWaypoints(optimizedRoute);
    
    service.route(
      {
        origin: origin,
        destination: destinationLatLng,
        travelMode: window.google.maps.TravelMode.DRIVING,
        waypoints: waypoints,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          setDirectionsStatus(status);
        } else {
          console.error("Directions request failed:", status);
          setDirectionsStatus(status);
        }
      }
    );
  }, [destination, selectedAmbulance, optimizedRoute]);
  
  // Count congestion zones
  const congestionZones = useMemo(() => {
    return congestionData.length;
  }, [congestionData]);
  
  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden border shadow-sm">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={defaultCenter}
        options={{
          ...mapOptions,
          styles: mapStyle,
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={(event) => {
          const latLng = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          onMapClick(latLng);
        }}
      >
        <VehicleMarkers 
          vehicles={vehicles} 
          selectedAmbulance={selectedAmbulance}
          onAmbulanceSelect={onAmbulanceSelect}
        />
        
        <RsuMarkers rsus={rsus} />
        
        <CongestionOverlay congestionData={congestionData} />
        
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#2563eb",
                strokeOpacity: 0.7,
                strokeWeight: 5,
              },
              suppressMarkers: true,
            }}
          />
        )}
        
        <MapOverlays
          vehiclesCount={vehicles?.length || 0}
          rsusCount={rsus?.length || 0}
          congestionZones={congestionZones}
          anomaliesCount={anomalies?.length || 0}
          selectedAmbulance={selectedAmbulance}
          destination={destination}
          directionsStatus={directionsStatus}
          apiKey={apiKey}
          rsus={rsus}
          anomalies={anomalies}
          isSimulationRunning={isLiveMonitoring}
        />
      </GoogleMap>
    </div>
  );
};

export default GoogleMapDisplay;
