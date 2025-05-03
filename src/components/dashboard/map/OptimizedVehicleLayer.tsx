
import React, { useEffect, useRef, useMemo } from "react";
import { Vehicle } from "@/services/api/types";
import { getTrustScoreColor, getVehicleSize } from "./utils";
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
    
    // Use WebGL if available for better performance with large datasets
    const useWebGL = zoomLevel < 12 && vehicles.length > 5000;

    if (useWebGL && window.WebGLRenderingContext) {
      renderWithWebGL(canvas, vehicles);
      return;
    }
    
    // Draw vehicles using Canvas 2D API
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
        const size = getVehicleSize(zoomLevel, vehicle.vehicle_type, isSelected);
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
      if (i > 0 && i % 2000 === 0 && i < vehicles.length - 1) {
        // Schedule the next chunk of rendering
        renderRequestRef.current = requestAnimationFrame(() => {
          renderVehicles();
        });
        break;
      }
    }
  };
  
  // WebGL rendering for better performance with large datasets
  const renderWithWebGL = (canvas: HTMLCanvasElement, vehicles: Vehicle[]) => {
    try {
      // Basic implementation - in a real app, this would be more sophisticated
      // using proper shaders, etc.
      const gl = canvas.getContext('webgl');
      if (!gl) return;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      console.log(`Using WebGL to render ${vehicles.length} vehicles`);
      
      // For now, we'll just create a simplified representation with density maps
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Create a density heatmap
      const gridSize = 50;
      const gridCells: Record<string, {count: number, avgTrust: number}> = {};
      
      vehicles.forEach(vehicle => {
        if (!vehicle.lat || !vehicle.lng) return;
        
        try {
          const position = new google.maps.LatLng(vehicle.lat, vehicle.lng);
          const point = projectionRef.current.fromLatLngToDivPixel(position);
          if (!point) return;
          
          // Assign to grid cell
          const gridX = Math.floor(point.x / gridSize);
          const gridY = Math.floor(point.y / gridSize);
          const cellKey = `${gridX},${gridY}`;
          
          if (!gridCells[cellKey]) {
            gridCells[cellKey] = { count: 0, avgTrust: 0 };
          }
          
          const cell = gridCells[cellKey];
          const trustScore = vehicle.trust_score || 75;
          
          // Update running average
          cell.avgTrust = (cell.avgTrust * cell.count + trustScore) / (cell.count + 1);
          cell.count++;
        } catch (e) {
          // Ignore errors
        }
      });
      
      // Draw density cells
      Object.entries(gridCells).forEach(([key, data]) => {
        const [gridX, gridY] = key.split(',').map(Number);
        const x = gridX * gridSize;
        const y = gridY * gridSize;
        const radius = Math.min(gridSize / 2, Math.max(3, Math.log(data.count) * 3));
        
        ctx.beginPath();
        ctx.arc(x + gridSize/2, y + gridSize/2, radius, 0, Math.PI * 2);
        ctx.fillStyle = getTrustScoreColor(data.avgTrust);
        ctx.globalAlpha = Math.min(0.8, 0.3 + Math.min(0.5, data.count / 100));
        ctx.fill();
      });
      
      ctx.globalAlpha = 1.0;
      
      // Also render any ambulances for selection
      vehicles.forEach(vehicle => {
        if (!vehicle.lat || !vehicle.lng || vehicle.vehicle_type !== 'ambulance') return;
        
        try {
          const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
          const position = new google.maps.LatLng(vehicle.lat, vehicle.lng);
          const point = projectionRef.current.fromLatLngToDivPixel(position);
          if (!point) return;
          
          const size = getVehicleSize(zoomLevel, 'ambulance', isSelected);
          
          // Store for click detection
          clickableVehiclesRef.current.set(vehicle.vehicle_id, {
            vehicle, 
            x: point.x,
            y: point.y,
            size: size * 3
          });
          
          // Draw ambulance
          ctx.beginPath();
          ctx.moveTo(point.x, point.y - size);
          ctx.lineTo(point.x - size, point.y + size);
          ctx.lineTo(point.x + size, point.y + size);
          ctx.fillStyle = getTrustScoreColor(vehicle.trust_score);
          ctx.fill();
          
          if (isSelected) {
            ctx.strokeStyle = "#FFFF00";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } catch (e) {
          // Ignore errors
        }
      });
      
    } catch (error) {
      console.error("WebGL rendering failed, falling back to Canvas:", error);
      renderVehicles();
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
