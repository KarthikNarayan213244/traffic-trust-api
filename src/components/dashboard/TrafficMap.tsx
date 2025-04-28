
import React, { useEffect, useRef, useState } from "react";
import { fetchData, getMockData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrafficMapProps {
  vehiclesEndpoint: string;
  rsuEndpoint: string;
  congestionZonesEndpoint?: string;
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehiclesEndpoint,
  rsuEndpoint,
  congestionZonesEndpoint,
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [rsus, setRsus] = useState<any[]>([]);
  const [congestionZones, setCongestionZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Use mock data for development
        const vehiclesData = getMockData(vehiclesEndpoint);
        const rsusData = getMockData(rsuEndpoint);
        let congestionData: any[] = [];
        
        if (congestionZonesEndpoint) {
          congestionData = getMockData(congestionZonesEndpoint);
        }
        
        // In production, use actual API
        // const vehiclesData = await fetchData(vehiclesEndpoint as any);
        // const rsusData = await fetchData(rsuEndpoint as any);
        // let congestionData: any[] = [];
        // if (congestionZonesEndpoint) {
        //   congestionData = await fetchData(congestionZonesEndpoint as any);
        // }
        
        setVehicles(vehiclesData);
        setRsus(rsusData);
        setCongestionZones(congestionData);
      } catch (error) {
        console.error(`Error loading map data:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vehiclesEndpoint, rsuEndpoint, congestionZonesEndpoint]);

  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions to match display size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // Draw a mock map with grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw RSUs
    rsus.forEach((rsu, index) => {
      const x = 100 + (index * 180) % (canvas.width - 200);
      const y = 100 + Math.floor((index * 180) / (canvas.width - 200)) * 150;

      // Draw coverage radius
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(29, 78, 216, 0.1)";
      ctx.fill();
      
      // Draw RSU point
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1D4ED8";
      ctx.fill();
      
      // Draw label
      ctx.font = "12px Inter";
      ctx.fillStyle = "#1D4ED8";
      ctx.textAlign = "center";
      ctx.fillText(rsu.rsu_id, x, y - 15);
    });

    // Draw vehicles
    vehicles.forEach((vehicle, index) => {
      const x = 50 + (index * 100) % (canvas.width - 100);
      const y = 50 + Math.floor((index * 100) / (canvas.width - 100)) * 100;

      // Draw vehicle
      ctx.beginPath();
      ctx.rect(x - 5, y - 5, 10, 10);
      
      // Color based on trust score if available
      if (vehicle.trust_score !== undefined) {
        const score = vehicle.trust_score;
        if (score >= 90) {
          ctx.fillStyle = "#22C55E"; // High trust - green
        } else if (score >= 70) {
          ctx.fillStyle = "#FACC15"; // Medium trust - yellow
        } else {
          ctx.fillStyle = "#EF4444"; // Low trust - red
        }
      } else {
        ctx.fillStyle = "#9CA3AF"; // Default - gray
      }
      
      ctx.fill();
      
      // Draw label
      ctx.font = "10px Inter";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.fillText(vehicle.vehicle_id, x, y - 10);
    });

  }, [isLoading, vehicles, rsus, congestionZones]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="relative h-96">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
            <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-primary mr-2 rounded-full"></div>
                <span className="text-xs">RSU</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-accent mr-2"></div>
                <span className="text-xs">Vehicle</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficMap;
