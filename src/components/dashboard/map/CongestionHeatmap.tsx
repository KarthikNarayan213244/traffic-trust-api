
import React, { useMemo } from "react";
import { HeatmapLayer } from "@react-google-maps/api";
import { defaultCenter } from "./constants";

interface CongestionHeatmapProps {
  congestionData: any[];
}

const CongestionHeatmap: React.FC<CongestionHeatmapProps> = ({ congestionData }) => {
  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!congestionData.length) return [];
    
    return congestionData.map(zone => ({
      location: new google.maps.LatLng(
        zone.lat || (defaultCenter.lat + (Math.random() * 0.1 - 0.05)),
        zone.lng || (defaultCenter.lng + (Math.random() * 0.1 - 0.05))
      ),
      weight: (zone.congestion_level || zone.level) / 100 * 3 // Normalized and amplified weight
    }));
  }, [congestionData]);

  // No congestion data, don't render anything
  if (!congestionData.length) return null;

  return (
    <HeatmapLayer
      data={heatmapData}
      options={{
        radius: 30,
        opacity: 0.7,
        dissipating: true,
        maxIntensity: 3,
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
