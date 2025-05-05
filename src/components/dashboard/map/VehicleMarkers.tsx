
import React, { useRef, useEffect, useState } from "react";
import { Marker } from "@react-google-maps/api";
import { getTrustScoreColor } from "./utils";
import { defaultCenter } from "./constants";
import { Vehicle } from "@/services/api";

interface VehicleMarkersProps {
  vehicles: Vehicle[];
  isSimulationRunning?: boolean;
  selectedAmbulanceId: string | null;
  onAmbulanceSelect: (vehicle: Vehicle) => void;
}

const VehicleMarkers: React.FC<VehicleMarkersProps> = ({ 
  vehicles,
  isSimulationRunning = false,
  selectedAmbulanceId,
  onAmbulanceSelect
}) => {
  
  const prevPositions = useRef<Map<string, google.maps.LatLng>>(new Map());
  const [animatedPositions, setAnimatedPositions] = useState<Map<string, google.maps.LatLng>>(new Map());
  
  const animationFrameId = useRef<number | null>(null);
  const animationProgress = useRef<number>(0);
  const animationDuration = 5000;

  // This effect handles the vehicle animation when new position data arrives
  useEffect(() => {
    // Clean up any existing animation
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    if (!isSimulationRunning || vehicles.length === 0 || !window.google) {
      return;
    }

    // Create map of new vehicle positions
    const newPositions = new Map<string, google.maps.LatLng>();
    vehicles.forEach(vehicle => {
      newPositions.set(
        vehicle.vehicle_id,
        new google.maps.LatLng(
          vehicle.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
          vehicle.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05))
        )
      );
    });

    // If this is first time, initialize previous positions
    if (prevPositions.current.size === 0) {
      prevPositions.current = new Map(newPositions);
      setAnimatedPositions(new Map(newPositions));
      return;
    }

    // Reset animation progress
    animationProgress.current = 0;

    // Animation function that will be called on each frame
    const animate = (timestamp: number) => {
      // Increment progress (roughly 60fps)
      animationProgress.current = Math.min(1, animationProgress.current + (16 / animationDuration));
      
      const currentPositions = new Map<string, google.maps.LatLng>();
      
      // Interpolate between previous and new positions based on progress
      newPositions.forEach((newPos, id) => {
        const prevPos = prevPositions.current.get(id);
        
        if (prevPos) {
          // Linear interpolation between previous and new positions
          const lat = prevPos.lat() + (newPos.lat() - prevPos.lat()) * animationProgress.current;
          const lng = prevPos.lng() + (newPos.lng() - prevPos.lng()) * animationProgress.current;
          currentPositions.set(id, new google.maps.LatLng(lat, lng));
        } else {
          // If no previous position, use new position directly
          currentPositions.set(id, newPos);
        }
      });
      
      // Update the animated positions state to re-render markers
      setAnimatedPositions(new Map(currentPositions));
      
      // Continue animation until complete
      if (animationProgress.current < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, update previous positions for next cycle
        prevPositions.current = new Map(newPositions);
      }
    };
    
    // Start the animation
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [vehicles, isSimulationRunning]);

  const getVehicleIcon = (vehicle: Vehicle, isSelected: boolean) => {
    
    if (!window.google) return null;
    
    const scale = isSelected ? 12 : 8;
    const strokeWeight = isSelected ? 3 : 1;
    
    const icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: scale,
      fillColor: getTrustScoreColor(vehicle.trust_score),
      fillOpacity: 0.8,
      strokeWeight: strokeWeight,
      strokeColor: isSelected ? "#FFFF00" : "#FFFFFF",
    };
    
    switch (vehicle.vehicle_type?.toLowerCase()) {
      case 'truck':
        return {
          ...icon,
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: scale + 2,
        };
      case 'bus':
        
        return {
          ...icon,
          path: google.maps.SymbolPath.CIRCLE,
          scale: scale + 3,
        };
      case 'ambulance':
        return {
          ...icon,
          fillColor: '#FF0000',
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: scale + 2,
        };
      case 'two-wheeler':
        return {
          ...icon,
          path: google.maps.SymbolPath.CIRCLE,
          scale: scale - 2,
        };
      default:
        return icon;
    }
  };

  const handleAmbulanceClick = (vehicle: Vehicle) => {
    if (vehicle.vehicle_type?.toLowerCase() === 'ambulance') {
      onAmbulanceSelect(vehicle);
    }
  };

  if (!window.google) {
    console.log("Google Maps API not loaded yet in VehicleMarkers");
    return null;
  }

  return (
    <>
      {vehicles.map((vehicle) => {
        const isAmbulance = vehicle.vehicle_type?.toLowerCase() === 'ambulance';
        const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
        
        let position;
        
        try {
          // Use animated position if simulation is running, otherwise use static position
          position = isSimulationRunning && animatedPositions.has(vehicle.vehicle_id)
            ? animatedPositions.get(vehicle.vehicle_id)
            : new google.maps.LatLng(
                vehicle.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
                vehicle.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05))
              );
        } catch (error) {
          console.error("Error creating LatLng for vehicle:", vehicle, error);
          return null;
        }
        
        if (!position) return null;
        
        const icon = getVehicleIcon(vehicle, isSelected);
        if (!icon) return null;
        
        return (
          <Marker
            key={vehicle.vehicle_id}
            position={position}
            icon={icon}
            title={`${vehicle.vehicle_id} - ${vehicle.vehicle_type} - Trust: ${vehicle.trust_score}`}
            onClick={() => isAmbulance && handleAmbulanceClick(vehicle)}
            clickable={isAmbulance}
            zIndex={isAmbulance ? 100 : 10}
            animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
          />
        );
      })}
    </>
  );
};

export default VehicleMarkers;
