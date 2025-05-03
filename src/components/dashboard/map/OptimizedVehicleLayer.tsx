
import React, { useEffect, useRef, useMemo } from "react";
import { Vehicle } from "@/services/api/types";
import { getTrustScoreColor } from "./utils";
import { defaultCenter } from "./constants";

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
  const clickableVehiclesRef = useRef<Map<string, {vehicle: Vehicle, x: number, y: number, size: number}>>(new Map());
  const renderRequestRef = useRef<number | null>(null);
  const projectionRef = useRef<any>(null);
  
  // Get appropriate marker size based on zoom
  const getMarkerSize = useMemo(() => (vehicleType: string | undefined, isSelected: boolean): number => {
    const baseSize = Math.max(1, Math.min(8, zoomLevel - 8));
    
    if (isSelected) return baseSize * 2;
    
    switch (vehicleType?.toLowerCase()) {
      case 'truck': return baseSize * 1.3;
      case 'bus': return baseSize * 1.5;
      case 'ambulance': return baseSize * 1.8;
      case 'two-wheeler': return baseSize * 0.7;
      default: return baseSize;
    }
  }, [zoomLevel]);
  
  // Create projection helper function
  const createProjection = () => {
    if (!window.google) return null;
    
    try {
      const overlay = new google.maps.OverlayView();
      overlay.draw = () => {}; // Required but does nothing
      return overlay.getProjection();
    } catch (err) {
      console.error("Error creating projection:", err);
      return null;
    }
  };
  
  // Render vehicles on canvas for performance
  const renderVehicles = () => {
    renderRequestRef.current = null;
    
    const canvas = canvasRef.current;
    if (!canvas || !window.google) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear clickable vehicles map
    clickableVehiclesRef.current.clear();
    
    // Initialize projection if needed
    if (!projectionRef.current) {
      projectionRef.current = createProjection();
    }
    
    // If projection not available, skip drawing
    if (!projectionRef.current) {
      console.log("Projection not available, skipping render");
      return;
    }
    
    // Draw vehicles
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      if (!vehicle) continue;
      
      try {
        const isAmbulance = vehicle.vehicle_type?.toLowerCase() === 'ambulance';
        const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
        
        // Convert lat/lng to pixel coordinates
        const position = new google.maps.LatLng(
          vehicle.lat || defaultCenter.lat,
          vehicle.lng || defaultCenter.lng
        );
        
        const point = projectionRef.current.fromLatLngToDivPixel(position);
        if (!point) continue;
        
        // Get marker size and color
        const size = getMarkerSize(vehicle.vehicle_type, isSelected);
        const color = getTrustScoreColor(vehicle.trust_score);
        
        // Store ambulances for click detection
        if (isAmbulance) {
          clickableVehiclesRef.current.set(vehicle.vehicle_id, {
            vehicle, 
            x: point.x,
            y: point.y,
            size: size * 3 // Clickable area is larger
          });
        }
        
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
      
      // Break rendering into chunks if there are too many vehicles
      if (i > 0 && i % 500 === 0 && i < vehicles.length - 1) {
        // Schedule the next chunk of rendering
        renderRequestRef.current = requestAnimationFrame(() => {
          renderVehicles();
        });
        break;
      }
    }
  };
  
  // Update canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderVehicles();
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Render vehicles when data changes
  useEffect(() => {
    // Cancel any pending render
    if (renderRequestRef.current) {
      cancelAnimationFrame(renderRequestRef.current);
    }
    
    // Schedule a new render
    renderRequestRef.current = requestAnimationFrame(renderVehicles);
    
    // Cleanup
    return () => {
      if (renderRequestRef.current) {
        cancelAnimationFrame(renderRequestRef.current);
      }
    };
  }, [vehicles, selectedAmbulanceId, zoomLevel]);
  
  // Handle canvas clicks with optimized detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || clickableVehiclesRef.current.size === 0) return;
    
    // Get click coordinates
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check all ambulances for clicks
    for (const [_, data] of clickableVehiclesRef.current.entries()) {
      const distance = Math.sqrt(Math.pow(x - data.x, 2) + Math.pow(y - data.y, 2));
      
      if (distance <= data.size) {
        onAmbulanceSelect(data.vehicle);
        break;
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
      style={{ pointerEvents: clickableVehiclesRef.current.size > 0 ? 'auto' : 'none' }}
    />
  );
};

export default OptimizedVehicleLayer;
