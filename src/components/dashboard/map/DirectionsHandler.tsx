
import React, { useCallback, useEffect, useState } from "react";
import { DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { Vehicle } from "@/services/api";

interface DirectionsHandlerProps {
  map: google.maps.Map | null;
  selectedAmbulance: Vehicle | null;
  destination: google.maps.LatLngLiteral | null;
  optimizedWaypoints: google.maps.DirectionsWaypoint[];
  keyIsSet: boolean;
}

const DirectionsHandler: React.FC<DirectionsHandlerProps> = ({
  map,
  selectedAmbulance,
  destination,
  optimizedWaypoints,
  keyIsSet
}) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | null>(null);
  const [isCalculatingDirections, setIsCalculatingDirections] = useState<boolean>(false);
  const [lastRouteRequest, setLastRouteRequest] = useState<string>('');

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
  }, [selectedAmbulance, destination]);

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

  // Focus the map on the route
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

  // Only use directions service when we have all required elements and a valid API key
  if (!window.google || !selectedAmbulance || !destination || !keyIsSet || !isCalculatingDirections) {
    return null;
  }

  return (
    <>
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
    </>
  );
};

export default DirectionsHandler;
