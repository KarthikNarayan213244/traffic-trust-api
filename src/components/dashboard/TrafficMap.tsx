
import React, { useEffect, useState, useRef } from "react";
import { fetchData, getMockData, Vehicle, Rsu, CongestionZone } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";

interface TrafficMapProps {
  vehiclesEndpoint: string;
  rsuEndpoint: string;
  congestionZonesEndpoint?: string;
}

declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehiclesEndpoint,
  rsuEndpoint,
  congestionZonesEndpoint,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rsus, setRsus] = useState<Rsu[]>([]);
  const [congestionZones, setCongestionZones] = useState<CongestionZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Use mock data for development
        const vehiclesData = getMockData(vehiclesEndpoint) as Vehicle[];
        const rsusData = getMockData(rsuEndpoint) as Rsu[];
        let congestionData: CongestionZone[] = [];
        
        if (congestionZonesEndpoint) {
          congestionData = getMockData(congestionZonesEndpoint) as CongestionZone[];
        }
        
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

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      // Define the callback function for the Google Maps API
      window.initMap = () => {
        setMapLoaded(true);
      };

      // Create and append the script tag
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBJn6irNLK_UVrBU3hFs_iTzCJGCCEraces&callback=initMap&libraries=visualization`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      // Cleanup function
      return () => {
        window.initMap = () => {};
        const scriptElement = document.getElementById('google-maps-script');
        if (scriptElement) {
          scriptElement.remove();
        }
      };
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map and add markers when data and Google Maps are loaded
  useEffect(() => {
    if (!isLoading && mapLoaded && mapRef.current) {
      // Clear previous markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Initialize map if not already initialized
      if (!googleMapRef.current) {
        // Hyderabad coordinates: 17.3850° N, 78.4867° E
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 17.3850, lng: 78.4867 },
          zoom: 12,
          styles: [
            {
              featureType: "administrative",
              elementType: "geometry",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "road",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
      }

      // Add RSU markers (blue)
      rsus.forEach((rsu, index) => {
        // Generate Hyderabad-based coordinates using RSU location
        let lat, lng;
        
        // Assign specific coordinates based on RSU locations in Hyderabad
        switch(rsu.location) {
          case "Hitech City":
            lat = 17.4435; 
            lng = 78.3772;
            break;
          case "Gachibowli":
            lat = 17.4401;
            lng = 78.3489;
            break;
          case "Banjara Hills":
            lat = 17.4134;
            lng = 78.4321;
            break;
          case "Secunderabad":
            lat = 17.4399;
            lng = 78.4983;
            break;
          default:
            // For any other locations, generate nearby coordinates
            lat = 17.3850 + (index * 0.01) % 0.1 - 0.05;
            lng = 78.4867 + (index * 0.02) % 0.2 - 0.1;
        }
        
        // Create marker
        const rsuMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: googleMapRef.current,
          title: rsu.rsu_id,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#1D4ED8",
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 8
          }
        });
        
        // Create coverage circle
        const coverageCircle = new window.google.maps.Circle({
          strokeColor: "#1D4ED8",
          strokeOpacity: 0.2,
          strokeWeight: 1,
          fillColor: "#1D4ED8",
          fillOpacity: 0.1,
          map: googleMapRef.current,
          center: { lat, lng },
          radius: rsu.coverage_radius || 500
        });
        
        markersRef.current.push(rsuMarker);
        markersRef.current.push(coverageCircle);
      });

      // Add vehicle markers
      vehicles.forEach((vehicle, index) => {
        // Generate pseudo-random coordinates around Hyderabad
        const lat = 17.3850 + (index * 0.015) % 0.15 - 0.075;
        const lng = 78.4867 + (index * 0.025) % 0.25 - 0.125;
        
        // Color based on trust score
        let fillColor = "#9CA3AF"; // Default gray
        if (vehicle.trust_score !== undefined) {
          if (vehicle.trust_score >= 90) {
            fillColor = "#22C55E"; // High trust - green
          } else if (vehicle.trust_score >= 70) {
            fillColor = "#FACC15"; // Medium trust - yellow
          } else {
            fillColor = "#EF4444"; // Low trust - red
          }
        }
        
        // Create marker
        const vehicleMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: googleMapRef.current,
          title: vehicle.vehicle_id,
          icon: {
            path: window.google.maps.SymbolPath.RECTANGLE,
            fillColor: fillColor,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#000000",
            scale: 6
          }
        });
        
        // Add info window
        const infoContent = `<div class="p-2">
          <p class="font-bold">${vehicle.vehicle_id}</p>
          <p>Trust Score: ${vehicle.trust_score}</p>
          <p>Type: ${vehicle.vehicle_type}</p>
        </div>`;
        
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });
        
        vehicleMarker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, vehicleMarker);
        });
        
        markersRef.current.push(vehicleMarker);
      });
      
      // Add congestion zone heatmap if data is available
      if (congestionZones.length > 0 && window.google.maps.visualization) {
        // Define specific coordinates for congestion zones based on location names
        const heatmapData = congestionZones.map(zone => {
          let lat, lng;
          
          switch(zone.location) {
            case "Hitech City":
              lat = 17.4435; 
              lng = 78.3772;
              break;
            case "Gachibowli":
              lat = 17.4401;
              lng = 78.3489;
              break;
            case "Banjara Hills":
              lat = 17.4134;
              lng = 78.4321;
              break;
            case "Secunderabad":
              lat = 17.4399;
              lng = 78.4983;
              break;
            default:
              // Default to city center with some variation
              lat = 17.3850 + (zone.id * 0.01) % 0.1 - 0.05;
              lng = 78.4867 + (zone.id * 0.02) % 0.2 - 0.1;
          }
          
          return {
            location: new window.google.maps.LatLng(lat, lng),
            weight: zone.level || 1
          };
        });
        
        const heatmap = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: googleMapRef.current,
          radius: 50
        });
        
        markersRef.current.push(heatmap);
      }
    }
  }, [isLoading, mapLoaded, vehicles, rsus, congestionZones]);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-white border-b">
        <CardTitle>Hyderabad Traffic Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading || !mapLoaded ? (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center space-y-2">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
        ) : (
          <div className="relative h-96">
            <div 
              ref={mapRef}
              className="w-full h-full"
            />
            <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md z-10">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-blue-600 mr-2 rounded-full"></div>
                <span className="text-xs">RSU</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-green-500 mr-2"></div>
                <span className="text-xs">High Trust Vehicle</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-yellow-400 mr-2"></div>
                <span className="text-xs">Medium Trust Vehicle</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 mr-2"></div>
                <span className="text-xs">Low Trust Vehicle</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficMap;
