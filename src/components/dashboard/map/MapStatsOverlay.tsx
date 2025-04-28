
import React from "react";

interface MapStatsOverlayProps {
  vehiclesCount: number;
  rsusCount: number;
}

const MapStatsOverlay: React.FC<MapStatsOverlayProps> = ({ vehiclesCount, rsusCount }) => {
  return (
    <div className="absolute top-2 right-2 bg-white/90 rounded-md p-2 text-xs">
      <p>{vehiclesCount} vehicles and {rsusCount} RSUs tracked</p>
    </div>
  );
};

export default MapStatsOverlay;
