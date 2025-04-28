
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
      weight: zone.level / 10
    }));
  }, [congestionData]);

  if (!congestionData.length) return null;

  return (
    <HeatmapLayer
      data={heatmapData}
      options={{
        radius: 20,
        opacity: 0.6,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ]
      }}
    />
  );
};

export default CongestionHeatmap;
