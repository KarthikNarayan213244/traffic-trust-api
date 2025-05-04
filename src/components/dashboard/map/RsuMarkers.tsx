
import React, { useEffect, useState } from "react";
import { Marker, Circle } from "@react-google-maps/api";
import { defaultCenter } from "./constants";
import { toast } from "@/hooks/use-toast";
import { RSU } from "@/services/api/types";

interface RsuMarkersProps {
  rsus: RSU[];
}

const RsuMarkers: React.FC<RsuMarkersProps> = ({ rsus }) => {
  const [lastUpdatedRsu, setLastUpdatedRsu] = useState<string | null>(null);
  
  // Flash RSU marker when it's updated in real-time
  useEffect(() => {
    if (rsus.length === 0) return;
    
    // Find the most recently updated RSU
    const sorted = [...rsus].sort((a, b) => {
      // Since RSU doesn't have a timestamp property, use last_seen if available
      // or fallback to current date
      const dateA = a.last_seen ? new Date(a.last_seen).getTime() : new Date().getTime();
      const dateB = b.last_seen ? new Date(b.last_seen).getTime() : new Date().getTime();
      return dateB - dateA;
    });
    
    const mostRecent = sorted[0];
    
    // Only highlight if this is a different RSU from the last update
    if (mostRecent && mostRecent.rsu_id !== lastUpdatedRsu) {
      setLastUpdatedRsu(mostRecent.rsu_id);
      
      // Clear the highlight after 3 seconds
      const timer = setTimeout(() => {
        setLastUpdatedRsu(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [rsus, lastUpdatedRsu]);
  
  if (!window.google) {
    console.log("Google Maps API not loaded yet in RsuMarkers");
    return null;
  }

  console.log(`Rendering ${rsus.length} RSUs on map`);

  // Ensure we're rendering all RSUs by removing any filtering
  return (
    <>
      {rsus.map((rsu) => {
        if (!rsu || !rsu.lat || !rsu.lng) {
          console.warn("RSU missing coordinates", rsu);
          return null;
        }

        const position = {
          lat: rsu.lat,
          lng: rsu.lng
        };
        
        // Determine RSU appearance based on status and coverage
        const isActive = rsu.status === "Active";
        const isHighlighted = rsu.rsu_id === lastUpdatedRsu;
        
        // Base colors - making them more visible
        const baseColor = isActive ? "#22c55e" : "#94a3b8";
        const baseStrokeColor = isActive ? "#16a34a" : "#64748b";
        
        // Highlight colors for recently updated RSUs
        const fillColor = isHighlighted ? "#3b82f6" : baseColor;
        const strokeColor = isHighlighted ? "#2563eb" : baseStrokeColor;
        
        // Use provided coverage radius or default to 500m
        const coverage = rsu.coverage_radius || 500;
        
        // Slightly larger icons for better visibility
        const iconScale = isHighlighted ? 8 : 6;
        const circleOpacity = isHighlighted ? 0.25 : 0.1;
        
        // Format location display
        const locationDisplay = rsu.location ? 
          (typeof rsu.location === 'string' ? rsu.location : `${rsu.lat.toFixed(4)}, ${rsu.lng.toFixed(4)}`) : 
          `${rsu.lat.toFixed(4)}, ${rsu.lng.toFixed(4)}`;
        
        return (
          <React.Fragment key={rsu.rsu_id}>
            <Marker
              position={position}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: iconScale,
                fillColor: fillColor,
                fillOpacity: 0.9,
                strokeWeight: isHighlighted ? 2 : 1,
                strokeColor: "#FFFFFF",
                rotation: 0
              }}
              title={`${rsu.rsu_id} - ${locationDisplay}`}
              animation={isHighlighted ? google.maps.Animation.BOUNCE : null}
              onClick={() => {
                if (isActive) {
                  toast({
                    title: `RSU ${rsu.rsu_id}`,
                    description: `Location: ${locationDisplay}, Status: Active, Coverage: ${coverage}m`,
                  });
                } else {
                  toast({
                    title: `RSU ${rsu.rsu_id}`,
                    description: `Location: ${locationDisplay}, Status: Inactive, Coverage: ${coverage}m`,
                    variant: "destructive",
                  });
                }
              }}
            />
            <Circle
              center={position}
              radius={coverage}
              options={{
                strokeColor: strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: isHighlighted ? 2 : 1.5,
                fillColor: fillColor,
                fillOpacity: circleOpacity,
                clickable: false,
                zIndex: isHighlighted ? 100 : 10
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default React.memo(RsuMarkers);
