
import React, { useRef, useEffect, useState, useMemo } from "react";
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
  const lastAnimationTime = useRef<number>(0);
  const animationDuration = 5000;
  const [mapZoom, setMapZoom] = useState<number>(13);

  // This value is used to reduce the number of vehicles rendered at lower zoom levels
  const maxVisibleVehicles = useMemo(() => {
    // At lower zoom levels, show fewer vehicles
    if (mapZoom < 10) return 50;
    if (mapZoom < 12) return 150;
    if (mapZoom < 14) return 300;
    return 1000; // Show all vehicles at high zoom levels
  }, [mapZoom]);

  // Monitor map zoom level for LOD adjustments
  useEffect(() => {
    if (!window.google || !window.google.maps) return;
    
    // Find the map instance (assuming there's only one on the page)
    const maps = document.querySelectorAll('div[aria-roledescription="map"]');
    if (maps.length > 0) {
      const mapElement = maps[0];
      const mapInstance = mapElement.__gm?.map;
      
      if (mapInstance) {
        const handleZoomChange = () => {
          const newZoom = mapInstance.getZoom();
          if (newZoom !== mapZoom) {
            setMapZoom(newZoom);
          }
        };
        
        // Add zoom change listener
        mapInstance.addListener('zoom_changed', handleZoomChange);
        
        // Set initial zoom
        handleZoomChange();
        
        return () => {
          // Clean up listener
          if (window.google && mapInstance) {
            google.maps.event.clearListeners(mapInstance, 'zoom_changed');
          }
        };
      }
    }
  }, [mapZoom]);

  // Filter vehicles based on zoom level and vehicle type
  const visibleVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    
    // Always show ambulances regardless of zoom
    const ambulances = vehicles.filter(v => v.vehicle_type?.toLowerCase() === 'ambulance');
    
    // For other vehicles, apply the maxVisibleVehicles limit
    let filteredVehicles = vehicles.filter(v => v.vehicle_type?.toLowerCase() !== 'ambulance');
    
    // If too many vehicles, take a random sample but prioritize those with anomalies
    if (filteredVehicles.length > maxVisibleVehicles) {
      // Prioritize vehicles with anomalies or low trust scores
      const priorityVehicles = filteredVehicles.filter(v => 
        v.trust_score < 30 || v.has_anomaly === true
      );
      
      // Take random sample from remaining vehicles
      const remainingVehicles = filteredVehicles.filter(v => 
        v.trust_score >= 30 && v.has_anomaly !== true
      );
      
      // Shuffle remaining vehicles
      const shuffled = [...remainingVehicles].sort(() => 0.5 - Math.random());
      
      // Take only as many as needed to reach maxVisibleVehicles
      const regularSample = shuffled.slice(0, Math.max(0, maxVisibleVehicles - priorityVehicles.length));
      
      // Combine priority vehicles with regular sample
      filteredVehicles = [...priorityVehicles, ...regularSample];
    }
    
    // Combine ambulances with filtered vehicles
    return [...ambulances, ...filteredVehicles];
  }, [vehicles, maxVisibleVehicles]);

  // This effect handles the vehicle animation when new position data arrives
  useEffect(() => {
    // Clean up any existing animation
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    if (!isSimulationRunning || visibleVehicles.length === 0 || !window.google) {
      return;
    }

    // Create map of new vehicle positions
    const newPositions = new Map<string, google.maps.LatLng>();
    visibleVehicles.forEach(vehicle => {
      // Skip if no valid coordinates
      if (!vehicle.lat || !vehicle.lng) return;
      
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
    lastAnimationTime.current = performance.now();

    // Animation function that will be called on each frame
    const animate = (timestamp: number) => {
      // Calculate delta time for smoother animation
      const deltaTime = timestamp - lastAnimationTime.current;
      lastAnimationTime.current = timestamp;
      
      // Progress increment based on actual time passed
      const progressIncrement = deltaTime / animationDuration;
      animationProgress.current = Math.min(1, animationProgress.current + progressIncrement);
      
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
        // Use low frame rate for better performance with many vehicles
        const frameRate = visibleVehicles.length > 100 ? 20 : 60; // 20fps for many vehicles, 60fps for fewer
        const frameDelay = 1000 / frameRate;
        
        // Schedule next frame with throttling
        setTimeout(() => {
          animationFrameId.current = requestAnimationFrame(animate);
        }, frameDelay);
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
  }, [visibleVehicles, isSimulationRunning]);

  // Pause animation when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      } else if (!document.hidden && isSimulationRunning) {
        // Force a re-render which will restart animation
        prevPositions.current = new Map();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSimulationRunning]);

  const getVehicleIcon = useCallback((vehicle: Vehicle, isSelected: boolean) => {
    if (!window.google) return null;
    
    const scale = isSelected ? 12 : (mapZoom < 12 ? 6 : 8);
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
  }, [mapZoom]);

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
      {visibleVehicles.map((vehicle) => {
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
            optimized={!isSelected} // Optimize non-selected markers for better performance
            animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
          />
        );
      })}
    </>
  );
};

export default VehicleMarkers;
