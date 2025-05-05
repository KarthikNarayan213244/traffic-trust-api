
import React, { useMemo } from "react";
import { HeatmapLayer } from "@react-google-maps/api";
import { defaultCenter } from "./constants";
import { CongestionZone } from "@/services/api/types";

interface CongestionHeatmapProps {
  congestionData: CongestionZone[];
}

const CongestionHeatmap: React.FC<CongestionHeatmapProps> = ({ congestionData }) => {
  // Prepare heatmap data with enhanced density for more realistic patterns
  const heatmapData = useMemo(() => {
    if (!congestionData || !congestionData.length) {
      console.log("No congestion data available for heatmap");
      return [];
    }
    
    if (!window.google) {
      console.log("Google Maps API not loaded yet in CongestionHeatmap");
      return [];
    }
    
    console.log(`Processing ${congestionData.length} congestion data points for heatmap`);
    
    // Create the base heatmap points from real data
    const basePoints = congestionData.map(zone => {
      // Get congestion level from the standard property
      const congestionLevel = zone.congestion_level;
      
      // Scale weight by congestion level (0.1 to 1)
      const weight = congestionLevel / 100;
      
      return {
        location: new google.maps.LatLng(zone.lat, zone.lng),
        weight: weight
      };
    });
    
    return basePoints;
  }, [congestionData]);

  // No congestion data, don't render anything
  if (!congestionData || !congestionData.length) {
    console.log("No congestion data to render heatmap");
    return null;
  }
  
  if (!window.google) {
    console.log("Google Maps API not loaded yet");
    return null;
  }

  console.log(`Rendering heatmap with ${heatmapData.length} points`);

  return (
    <HeatmapLayer
      data={heatmapData}
      options={{
        radius: 20, 
        opacity: 0.8,
        dissipating: true,
        maxIntensity: 1,
        gradient: [
          'rgba(0, 255, 0, 0)',   
          'rgba(0, 255, 0, 1)',   
          'rgba(255, 255, 0, 1)', 
          'rgba(255, 165, 0, 1)', 
          'rgba(255, 0, 0, 1)',   
          'rgba(165, 0, 0, 1)'    
        ]
      }}
    />
  );
};

export default CongestionHeatmap;
