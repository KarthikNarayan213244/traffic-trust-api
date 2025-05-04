
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
      overlay.setMap(window.map); // Set map reference
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
      if (!projectionRef.current) {
        console.log("Trying to initialize projection");
        setTimeout(renderVehicles, 500); // Retry after 500ms
        return;
      }
    }
    
    // Use WebGL if available for better performance with large datasets
    const useWebGL = zoomLevel < 12 && vehicles.length > 5000;

    if (useWebGL && window.WebGLRenderingContext) {
      renderWithWebGL(canvas, vehicles);
      return;
    }
    
    // Draw vehicles using Canvas 2D API
    let drawnCount = 0;
    
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      if (!vehicle || !vehicle.lat || !vehicle.lng) continue;
      
      try {
        const isAmbulance = vehicle.vehicle_type?.toLowerCase() === 'ambulance';
        const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
        
        // Convert lat/lng to pixel coordinates
        const position = new google.maps.LatLng(
          vehicle.lat,
          vehicle.lng
        );
        
        const point = projectionRef.current.fromLatLngToDivPixel(position);
        if (!point) continue;
        
        // Skip if outside canvas with some margin
        if (point.x < -50 || point.y < -50 || 
            point.x > canvas.width + 50 || 
            point.y > canvas.height + 50) {
          continue;
        }
        
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
        if (vehicle.vehicle_type === 'Ambulance' || vehicle.vehicle_type === 'ambulance') {
          // Triangle for ambulance
          ctx.moveTo(point.x, point.y - size);
          ctx.lineTo(point.x - size, point.y + size);
          ctx.lineTo(point.x + size, point.y + size);
        } else if (vehicle.vehicle_type === 'Truck' || vehicle.vehicle_type === 'truck') {
          // Rectangle for truck
          ctx.rect(point.x - size, point.y - size, size * 2, size * 1.5);
        } else {
          // Triangle for other vehicles (match image provided)
          ctx.moveTo(point.x, point.y - size);
          ctx.lineTo(point.x - size, point.y + size);
          ctx.lineTo(point.x + size, point.y + size);
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
        
        drawnCount++;
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
    
    console.log(`Drew ${drawnCount} vehicles of ${vehicles.length} total`);
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
          
          // Skip if outside canvas
          if (point.x < -50 || point.y < -50 || 
              point.x > canvas.width + 50 || 
              point.y > canvas.height + 50) {
            return;
          }
          
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
      let cellCount = 0;
      Object.entries(gridCells).forEach(([key, data]) => {
        const [gridX, gridY] = key.split(',').map(Number);
        const x = gridX * gridSize;
        const y = gridY * gridSize;
        
        // Draw triangles for cell clusters (match image provided)
        const size = Math.min(gridSize / 2, Math.max(8, Math.log(data.count) * 5));
        
        ctx.beginPath();
        ctx.moveTo(x + gridSize/2, y + gridSize/2 - size);
        ctx.lineTo(x + gridSize/2 - size, y + gridSize/2 + size);
        ctx.lineTo(x + gridSize/2 + size, y + gridSize/2 + size);
        
        ctx.fillStyle = getTrustScoreColor(data.avgTrust);
        ctx.globalAlpha = Math.min(0.9, 0.3 + Math.min(0.6, data.count / 100));
        ctx.fill();
        
        // Add stroke for better visibility
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        cellCount++;
      });
      
      console.log(`Drew ${cellCount} vehicle clusters`);
      
      ctx.globalAlpha = 1.0;
      
      // Also render any ambulances for selection
      let ambulanceCount = 0;
      vehicles.forEach(vehicle => {
        if (!vehicle.lat || !vehicle.lng || vehicle.vehicle_type?.toLowerCase() !== 'ambulance') return;
        
        try {
          const isSelected = vehicle.vehicle_id === selectedAmbulanceId;
          const position = new google.maps.LatLng(vehicle.lat, vehicle.lng);
          const point = projectionRef.current.fromLatLngToDivPixel(position);
          if (!point) return;
          
          // Skip if outside canvas
          if (point.x < -50 || point.y < -50 || 
              point.x > canvas.width + 50 || 
              point.y > canvas.height + 50) {
            return;
          }
          
          const size = getVehicleSize(zoomLevel, 'ambulance', isSelected) * 1.5;
          
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
          } else {
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          
          ambulanceCount++;
        } catch (e) {
          // Ignore errors
        }
      });
      
      console.log(`Drew ${ambulanceCount} ambulances separately`);
      
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
    
    // Store map reference globally for projection
    if (window.google && window.google.maps) {
      window.map = window.google.maps.Map;
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Render vehicles when data changes
  useEffect(() => {
    // Wait a bit for the map to fully initialize
    const timer = setTimeout(() => {
      // Cancel any pending render
      if (renderRequestRef.current) {
        cancelAnimationFrame(renderRequestRef.current);
      }
      
      // Schedule a new render
      renderRequestRef.current = requestAnimationFrame(renderVehicles);
    }, 100);
    
    // Cleanup
    return () => {
      clearTimeout(timer);
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
