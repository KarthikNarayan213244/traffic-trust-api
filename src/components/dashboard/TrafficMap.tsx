
import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle, HeatmapLayer } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import MapApiKeyForm from "./MapApiKeyForm";

// Storage key for API key
const API_KEY_STORAGE_KEY = "traffic_management_maps_api_key";

// Hyderabad coordinates
const defaultCenter = {
  lat: 17.3850,
  lng: 78.4867
};

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

// Libraries to load with Google Maps
const libraries = ["visualization"];

// Map theme - slightly muted colors to make markers stand out
const mapTheme = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c93a3" }, { lightness: "-10" }]
  },
  {
    featureType: "administrative.country",
    elementType: "geometry",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.fill",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: "#f7f7f7" }]
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#c7eced" }]
  }
];

// Helper function to generate a marker color based on trust score
const getTrustScoreColor = (score: number) => {
  if (score >= 90) return "green";
  if (score >= 70) return "yellow";
  if (score >= 50) return "orange";
  return "red";
};

interface TrafficMapProps {
  vehicles?: any[];
  rsus?: any[];
  isLoading?: boolean;
  congestionData?: any[];
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehicles = [],
  rsus = [],
  isLoading = false,
  congestionData = []
}) => {
  // State for Google Maps API key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  });
  
  // Setup Google Maps JS API loader with the libraries array as a constant reference
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Handle API key update
  const handleApiKeySet = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    // Force reload the page to re-initialize the Google Maps API with the new key
    if (newApiKey !== apiKey) {
      window.location.reload();
    }
  }, [apiKey]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  }, []);

  // Prepare heatmap data if congestion data is available
  const heatmapData = React.useMemo(() => {
    if (!isLoaded || !congestionData.length) return [];
    
    return congestionData.map(zone => ({
      location: new google.maps.LatLng(
        zone.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
        zone.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05))
      ),
      weight: zone.level / 10
    }));
  }, [congestionData, isLoaded]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show API key form if no key is set
  if (!apiKey) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 flex-col">
        <p className="text-lg mb-4">Google Maps API Key Required</p>
        <MapApiKeyForm onApiKeySet={handleApiKeySet} />
      </div>
    );
  }

  // Show error if Google Maps failed to load
  if (loadError) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <h3 className="text-lg font-medium text-red-600">Failed to load Google Maps</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please check your internet connection and API key, then try again
          </p>
          <MapApiKeyForm onApiKeySet={handleApiKeySet} />
        </div>
      </div>
    );
  }

  // Show message if Google Maps is not loaded yet
  if (!isLoaded) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Loading maps...</span>
      </div>
    );
  }

  return (
    <div className="h-[400px] relative">
      <MapApiKeyForm onApiKeySet={handleApiKeySet} />
      
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
        {/* Render vehicle markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={{
              lat: vehicle.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
              lng: vehicle.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05)),
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: getTrustScoreColor(vehicle.trust_score),
              fillOpacity: 0.7,
              strokeWeight: 1,
              strokeColor: "#FFFFFF",
            }}
            title={`${vehicle.vehicle_id} - Trust: ${vehicle.trust_score}`}
          />
        ))}

        {/* Render RSU markers with coverage radius */}
        {rsus.map((rsu) => (
          <React.Fragment key={rsu.rsu_id}>
            <Marker
              position={{
                lat: rsu.lat || (defaultCenter.lat + (Math.random() * 0.12 - 0.06)),
                lng: rsu.lng || (defaultCenter.lng + (Math.random() * 0.12 - 0.06)),
              }}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: rsu.status === "Active" ? "#4ADE80" : "#94A3B8",
                fillOpacity: 0.9,
                strokeWeight: 1,
                strokeColor: "#FFFFFF",
              }}
              title={`${rsu.rsu_id} - ${rsu.location}`}
            />
            <Circle
              center={{
                lat: rsu.lat || (defaultCenter.lat + (Math.random() * 0.12 - 0.06)),
                lng: rsu.lng || (defaultCenter.lng + (Math.random() * 0.12 - 0.06)),
              }}
              radius={rsu.coverage_radius || 500}
              options={{
                strokeColor: rsu.status === "Active" ? "#4ADE80" : "#94A3B8",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: rsu.status === "Active" ? "#4ADE80" : "#94A3B8",
                fillOpacity: 0.15,
              }}
            />
          </React.Fragment>
        ))}

        {/* Render congestion heatmap if data is available */}
        {congestionData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 20,
              opacity: 0.6,
              gradient: [
                'rgba(0, 255, 255, 0)',
                'rgba(0, 255, 255, 1)',
                'rgba(0, 191, 255, 1)',
                'rgba(0, 127, 255, 1)',
                'rgba(0, 63, 255, 1)',
                'rgba(0, 0, 255, 1)',
                'rgba(0, 0, 223, 1)',
                'rgba(0, 0, 191, 1)',
                'rgba(0, 0, 159, 1)',
                'rgba(0, 0, 127, 1)',
                'rgba(63, 0, 91, 1)',
                'rgba(127, 0, 63, 1)',
                'rgba(191, 0, 31, 1)',
                'rgba(255, 0, 0, 1)'
              ]
            }}
          />
        )}
      </GoogleMap>

      {/* Info overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 rounded-md p-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
            High Trust
          </span>
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
            Medium Trust
          </span>
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
            Low Trust
          </span>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-2 right-2 bg-white/90 rounded-md p-2 text-xs">
        <p>{vehicles.length} vehicles and {rsus.length} RSUs tracked</p>
      </div>
    </div>
  );
};

export default TrafficMap;
