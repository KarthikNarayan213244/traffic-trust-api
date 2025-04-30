
import React, { useMemo } from "react";
import { HeatmapLayer } from "@react-google-maps/api";
import { defaultCenter } from "./constants";
import { CongestionZone } from "@/services/api/types";

interface CongestionHeatmapProps {
  congestionData: CongestionZone[];
}

const CongestionHeatmap: React.FC<CongestionHeatmapProps> = ({ congestionData }) => {
  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!congestionData || !congestionData.length) {
      console.log("No congestion data available for heatmap");
      return [];
    }
    
    if (!window.google) {
      console.log("Google Maps API not loaded yet in CongestionHeatmap");
      return [];
    }
    
    console.log(`Processing ${congestionData.length} congestion data points for heatmap:`, congestionData[0]);
    
    return congestionData.map(zone => {
      // Get congestion level from the standard property
      const congestionLevel = zone.congestion_level;
      
      // Scale weight by congestion level (0.1 to 1)
      const weight = congestionLevel / 100;
      
      // Use provided coordinates
      const lat = zone.lat;
      const lng = zone.lng;
      
      return {
        location: new google.maps.LatLng(lat, lng),
        weight: weight
      };
    });
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
        radius: 30,
        opacity: 0.7,
        dissipating: true,
        maxIntensity: 1,
        gradient: [
          'rgba(0, 255, 0, 0)',    // green (transparent)
          'rgba(0, 255, 0, 1)',    // green
          'rgba(255, 255, 0, 1)',  // yellow
          'rgba(255, 165, 0, 1)',  // orange
          'rgba(255, 0, 0, 1)',    // red
          'rgba(165, 0, 0, 1)'     // dark red
        ]
      }}
    />
  );
};

export default CongestionHeatmap;
