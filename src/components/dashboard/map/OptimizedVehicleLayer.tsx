
import React, { useEffect, useRef } from "react";
import { Vehicle } from "@/services/api/types";
import { getTrustScoreColor } from "./utils";
import { defaultCenter } from "./constants";
import { OverlayView } from "@react-google-maps/api";

interface OptimizedVehicleLayerProps {
  vehicles: Vehicle[];
  isSimulationRunning?: boolean;
  selectedAmbulanceId: string | null;
  onAmbulanceSelect: (vehicle: Vehicle) => void;
  zoomLevel: number;
}

// This component uses canvas instead of individual markers for better performance
const OptimizedVehicleLayer: React.FC<OptimizedVehicleLayerProps> = ({
  vehicles,
  isSimulationRunning = false,
  selectedAmbulanceId,
  onAmbulanceSelect,
  zoomLevel
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clickableVehiclesRef = useRef<Map<string, Vehicle>>(new Map());
  
  // Get appropriate marker size based on zoom
  const getMarkerSize = (vehicleType: string | undefined, isSelected: boolean): number => {
    const baseSize = Math.max(1, Math.min(8, zoomLevel - 8));
    
    if (isSelected) return baseSize * 2;
    
    switch (vehicleType?.toLowerCase()) {
      case 'truck': return baseSize * 1.3;
      case 'bus': return baseSize * 1.5;
      case 'ambulance': return baseSize * 1.8;
      case 'two-wheeler': return baseSize * 0.7;
      default: return baseSize;
    }
  };
  
  // Render vehicles on canvas for performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.google) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear clickable vehicles map
    clickableVehiclesRef.current.clear();
    
    // Create a projection function to convert lat/lng to pixel coordinates
    const overlay = new google.maps.OverlayView();
    
    overlay.draw = () => {}; // Required but does nothing
    
    // Get the current map's projection
    const projection = overlay.getProjection();
    if (!projection) return;
    
    // Draw vehicles
    vehicles.forEach(vehicle => {
      try {
        const isAmbulance = vehicle.vehicle_type?.toLowerCase() === 'ambulance';
        const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
        
        // Store ambulances for click detection
        if (isAmbulance) {
          clickableVehiclesRef.current.set(vehicle.vehicle_id, vehicle);
        }
        
        // Convert lat/lng to pixel coordinates
        const position = new google.maps.LatLng(
          vehicle.lat || defaultCenter.lat,
          vehicle.lng || defaultCenter.lng
        );
        
        const point = projection.fromLatLngToDivPixel(position);
        if (!point) return;
        
        // Get marker size and color
        const size = getMarkerSize(vehicle.vehicle_type, isSelected);
        const color = getTrustScoreColor(vehicle.trust_score);
        
        // Draw the marker
        ctx.beginPath();
        
        // Different shapes based on vehicle type
        if (vehicle.vehicle_type === 'ambulance') {
          // Triangle for ambulance
          ctx.moveTo(point.x, point.y - size);
          ctx.lineTo(point.x - size, point.y + size);
          ctx.lineTo(point.x + size, point.y + size);
        } else if (vehicle.vehicle_type === 'truck') {
          // Rectangle for truck
          ctx.rect(point.x - size, point.y - size, size * 2, size * 1.5);
        } else {
          // Circle for other vehicles
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        }
        
        // Fill and stroke
        ctx.fillStyle = color;
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = "#FFFF00";
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      } catch (error) {
        // Silently handle any rendering errors
      }
    });
  }, [vehicles, selectedAmbulanceId, zoomLevel]);
  
  // Handle canvas clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !window.google || clickableVehiclesRef.current.size === 0) return;
    
    // Get click coordinates
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check all ambulances for clicks
    for (const vehicle of clickableVehiclesRef.current.values()) {
      try {
        // Convert vehicle position to pixels
        const overlay = new google.maps.OverlayView();
        overlay.draw = () => {};
        
        const projection = overlay.getProjection();
        if (!projection) continue;
        
        const position = new google.maps.LatLng(
          vehicle.lat || defaultCenter.lat,
          vehicle.lng || defaultCenter.lng
        );
        
        const point = projection.fromLatLngToDivPixel(position);
        if (!point) continue;
        
        // Check if click is within marker area
        const size = getMarkerSize('ambulance', false) * 3; // Make clickable area larger
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        
        if (distance <= size) {
          onAmbulanceSelect(vehicle);
          break;
        }
      } catch (error) {
        continue;
      }
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={handleCanvasClick}
      style={{ pointerEvents: 'auto' }}
    />
  );
};

export default OptimizedVehicleLayer;
