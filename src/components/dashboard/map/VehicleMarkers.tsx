
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

  useEffect(() => {
    if (!isSimulationRunning || vehicles.length === 0) {
      return;
    }

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

    if (prevPositions.current.size === 0) {
      prevPositions.current = new Map(newPositions);
      setAnimatedPositions(new Map(newPositions));
      return;
    }

    animationProgress.current = 0;

    const animate = (timestamp: number) => {
      animationProgress.current = Math.min(1, animationProgress.current + 0.016);
      
      const currentPositions = new Map<string, google.maps.LatLng>();
      
      newPositions.forEach((newPos, id) => {
        const prevPos = prevPositions.current.get(id);
        
        if (prevPos) {
          const lat = prevPos.lat() + (newPos.lat() - prevPos.lat()) * animationProgress.current;
          const lng = prevPos.lng() + (newPos.lng() - prevPos.lng()) * animationProgress.current;
          currentPositions.set(id, new google.maps.LatLng(lat, lng));
        } else {
          currentPositions.set(id, newPos);
        }
      });
      
      setAnimatedPositions(new Map(currentPositions));
      
      if (animationProgress.current < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        prevPositions.current = new Map(newPositions);
      }
    };
    
    animationFrameId.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [vehicles, isSimulationRunning]);

  const getVehicleIcon = (vehicle: Vehicle, isSelected: boolean) => {
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
        // Use a filled circle with larger scale for bus instead of RECTANGLE
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

  return (
    <>
      {vehicles.map((vehicle) => {
        const isAmbulance = vehicle.vehicle_type?.toLowerCase() === 'ambulance';
        const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
        
        const position = isSimulationRunning && animatedPositions.has(vehicle.vehicle_id)
          ? animatedPositions.get(vehicle.vehicle_id)
          : new google.maps.LatLng(
              vehicle.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
              vehicle.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05))
            );
        
        return (
          <Marker
            key={vehicle.vehicle_id}
            position={position}
            icon={getVehicleIcon(vehicle, isSelected)}
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
