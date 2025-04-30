
import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { useMapApiKey } from "@/hooks/useMapApiKey";
import { useSimulation } from "@/hooks/useSimulation";
import MapApiKeyForm from "@/components/dashboard/MapApiKeyForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Car, MapPin, Navigation, Radio, ShieldCheck, StopCircle } from "lucide-react";
import { API_KEY_STORAGE_KEY } from "./map/constants";
import { Loader2 } from "lucide-react";

interface TrafficMapProps {
  vehicles: any[];
  rsus: any[];
  isLoading: boolean;
  congestionData?: any[];
}

const TrafficMap: React.FC<TrafficMapProps> = ({ 
  vehicles, 
  rsus, 
  isLoading, 
  congestionData = [] 
}) => {
  const { apiKey, handleApiKeySet, keyLoading } = useMapApiKey();
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  
  // Show key prompt only after a small delay if no API key is found
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!apiKey) {
      // Wait a moment before showing the prompt to avoid flickering
      timer = setTimeout(() => {
        setShowKeyPrompt(true);
      }, 1000);
    } else {
      setShowKeyPrompt(false);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [apiKey]);
  
  const mapContainerStyle = {
    width: '100%',
    height: '600px',
  };
  
  const hyderabadCoordinates = {
    lat: 17.3850,
    lng: 78.4867
  };
  
  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };
  
  const [map, setMap] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);
  
  const { 
    isSimulationRunning, 
    selectedAmbulance, 
    destination, 
    handleAmbulanceSelect, 
    handleDestinationSelect, 
    resetRouting 
  } = useSimulation();
  
  const onLoad = useCallback(function callback(map) {
    setMap(map)
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null)
  }, []);
  
  // Function to handle map clicks for setting destination
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (selectedAmbulance && isSimulationRunning) {
      handleDestinationSelect({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  }, [selectedAmbulance, isSimulationRunning, handleDestinationSelect]);
  
  // Function to calculate directions
  const calculateRoute = useCallback(() => {
    if (selectedAmbulance && destination) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng },
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
            setError(null);
          } else {
            setError(status);
            console.error(`Error fetching directions ${result}`);
          }
        }
      );
    }
  }, [selectedAmbulance, destination]);
  
  // Trigger route calculation when ambulance or destination changes
  useEffect(() => {
    if (selectedAmbulance && destination) {
      calculateRoute();
    }
  }, [selectedAmbulance, destination, calculateRoute]);
  
  // InfoWindow content component
  const MapInfoOverlay = ({ vehicle }) => (
    <Card className="w-[350px] shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-4 w-4" />
          <span>{vehicle.owner_name}</span>
        </CardTitle>
        <CardDescription>
          Vehicle ID: {vehicle.vehicle_id}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Type</p>
          <p className="text-blue-500">{vehicle.vehicle_type}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Location</p>
          <p>{vehicle.location}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Trust Score</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>{vehicle.trust_score}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Speed</p>
          <p>{vehicle.speed} km/h</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Status</p>
          <p className={vehicle.status === 'Active' ? 'text-green-500' : 'text-red-500'}>{vehicle.status}</p>
        </div>
      </CardContent>
      <CardContent className="flex items-center justify-between">
        {isSimulationRunning && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAmbulanceSelect(vehicle)}
            disabled={selectedAmbulance !== null}
          >
            <Navigation className="mr-2 h-4 w-4" />
            {selectedAmbulance ? 'Ambulance Selected' : 'Select as Ambulance'}
          </Button>
        )}
        {vehicle.status !== 'Active' && (
          <div className="text-red-500 flex items-center gap-1">
            <StopCircle className="h-4 w-4" />
            <span>Inactive</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Emergency Route Panel
  const EmergencyRoutePanel = () => (
    <Card className="absolute top-4 left-4 z-10 w-[350px]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Emergency Route</CardTitle>
        <CardDescription>
          {selectedAmbulance ? 
            `Route from ${selectedAmbulance.owner_name} to destination` : 
            'Select an ambulance and a destination to calculate the route.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedAmbulance && destination ? (
          <>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              <span>Ambulance: {selectedAmbulance.owner_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <span>Destination: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</span>
            </div>
            {error && (
              <div className="text-red-500">
                Error: {error}
              </div>
            )}
          </>
        ) : (
          <p>No route calculated.</p>
        )}
      </CardContent>
      <CardContent className="flex justify-between">
        <Button variant="outline" size="sm" onClick={resetRouting} disabled={!selectedAmbulance}>
          Reset Route
        </Button>
      </CardContent>
    </Card>
  );
  
  // Show a prompt to enter API key if none is found
  if (!apiKey && showKeyPrompt) {
    return (
      <div className="h-[600px] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center p-6 max-w-md">
          <h3 className="text-lg font-medium mb-3">Google Maps API Key Required</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            To display the traffic map, please provide your Google Maps API key. 
            This will be saved for future sessions.
          </p>
          <MapApiKeyForm onApiKeySet={handleApiKeySet} initialOpen={true} keyLoading={keyLoading} />
        </div>
      </div>
    );
  }
  
  // Show loading state while API key is being processed
  if (keyLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium">Initializing Map</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Applying your Google Maps API key...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={hyderabadCoordinates}
        zoom={12}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {/* Emergency Route Panel */}
        {selectedAmbulance && destination && (
          <EmergencyRoutePanel />
        )}
        
        {/* Render directions if available */}
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
        
        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            onClick={() => setSelectedVehicle(vehicle)}
            icon={{
              url: "/car-marker.svg",
              scaledSize: new google.maps.Size(30, 30),
            }}
          />
        ))}
        
        {/* RSU Markers */}
        {rsus.map((rsu) => (
          <Marker
            key={rsu.rsu_id}
            position={{ lat: rsu.lat, lng: rsu.lng }}
            icon={{
              url: "/rsu-marker.svg",
              scaledSize: new google.maps.Size(30, 30),
            }}
          />
        ))}
        
        {/* Congestion Heatmap (Placeholder) */}
        {congestionData.map(zone => (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              left: `${((zone.lng - hyderabadCoordinates.lng) / 0.1) * 50 + 50}%`,
              top: `${((zone.lat - hyderabadCoordinates.lat) / 0.1) * 50 + 50}%`,
              width: `${zone.congestion_level}%`,
              height: `${zone.congestion_level}%`,
              backgroundColor: `rgba(255, 0, 0, ${zone.congestion_level / 100})`,
              borderRadius: '50%',
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        
        {/* Selected Vehicle InfoWindow */}
        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
            onCloseClick={() => setSelectedVehicle(null)}
          >
            <MapInfoOverlay vehicle={selectedVehicle} />
          </InfoWindow>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-4 left-4 bg-white p-4 rounded-md shadow-md z-10">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading Traffic Data...</span>
            </div>
            <Progress value={50} className="mt-2" />
          </div>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default TrafficMap;
