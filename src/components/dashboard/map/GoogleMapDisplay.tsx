
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { GoogleMap } from "@react-google-maps/api";
import OptimizedVehicleLayer from "./OptimizedVehicleLayer";
import RsuMarkers from "./RsuMarkers";
import CongestionHeatmap from "./CongestionHeatmap";
import MapInfoOverlay from "./MapInfoOverlay";
import MapStatsOverlay from "./MapStatsOverlay";
import EmergencyRoutePanel from "./EmergencyRoutePanel";
import { defaultCenter, mapContainerStyle, mapOptions, mapTheme } from "./constants";
import { Vehicle } from "@/services/api/types";
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
  onBoundsChanged?: (bounds: any, zoom: number) => void;
  vehicleCountSummary?: string;
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
  onMapClick,
  onBoundsChanged,
  vehicleCountSummary
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | null>(null);
  const [isCalculatingDirections, setIsCalculatingDirections] = useState<boolean>(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsChangedListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const { apiKey } = useMapApiKey();
  
  // Create memoized datasets to prevent unnecessary re-renders
  const memoizedVehicles = useMemo(() => vehicles.slice(0, 1000), [vehicles]);
  const memoizedRsus = useMemo(() => rsus.slice(0, 100), [rsus]); 
  const memoizedCongestion = useMemo(() => congestionData.slice(0, 200), [congestionData]);

  // Handle map load with optimized event bindings
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log("Google Map loaded successfully");
    mapRef.current = mapInstance;
    setMap(mapInstance);
    setZoomLevel(mapInstance.getZoom());
    
    // Clean up any existing listener
    if (boundsChangedListenerRef.current) {
      google.maps.event.removeListener(boundsChangedListenerRef.current);
    }
    
    // Add map event listeners with throttling
    let boundsUpdateTimeout: NodeJS.Timeout | null = null;
    
    boundsChangedListenerRef.current = mapInstance.addListener("bounds_changed", () => {
      // Clear previous timeout to implement throttling
      if (boundsUpdateTimeout) {
        clearTimeout(boundsUpdateTimeout);
      }
      
      // Set new timeout to throttle updates
      boundsUpdateTimeout = setTimeout(() => {
        if (onBoundsChanged && mapInstance) {
          const bounds = mapInstance.getBounds()?.toJSON();
          const zoom = mapInstance.getZoom();
          if (bounds) {
            onBoundsChanged(bounds, zoom);
            setZoomLevel(zoom);
          }
        }
        boundsUpdateTimeout = null;
      }, 250); // 250ms throttle
    });
  }, [onBoundsChanged]);

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      if (boundsChangedListenerRef.current && google && google.maps) {
        google.maps.event.removeListener(boundsChangedListenerRef.current);
      }
    };
  }, []);

  // Optimize click handling with useCallback
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && selectedAmbulance) {
      const clickLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      onMapClick(clickLocation);
    }
  }, [selectedAmbulance, onMapClick]);

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

  // Create loading placeholder
  if (!window.google) {
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
        {/* Optimized vehicle layer with memoized data */}
        <OptimizedVehicleLayer 
          vehicles={memoizedVehicles}
          onAmbulanceSelect={onAmbulanceSelect}
          selectedAmbulanceId={selectedAmbulance?.vehicle_id || null}
          isSimulationRunning={isLiveMonitoring}
          zoomLevel={zoomLevel}
        />
        
        {/* RSU markers with memoized data */}
        <RsuMarkers rsus={memoizedRsus} />
        
        {/* Congestion heatmap with memoized data */}
        <CongestionHeatmap congestionData={memoizedCongestion} />
      </GoogleMap>

      <MapInfoOverlay />
      <MapStatsOverlay 
        vehiclesCount={memoizedVehicles.length} 
        rsusCount={memoizedRsus.length} 
        congestionZones={memoizedCongestion.length > 0 ? Math.ceil(memoizedCongestion.length / 3) : 0}
        anomaliesCount={memoizedVehicles.filter(v => v.status === 'Warning' || v.status === 'Alert').length}
        vehicleCountSummary={vehicleCountSummary}
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
