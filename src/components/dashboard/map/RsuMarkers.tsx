
import React, { useEffect, useState } from "react";
import { Marker, Circle } from "@react-google-maps/api";
import { defaultCenter } from "./constants";
import { toast } from "@/hooks/use-toast";

interface RsuMarkersProps {
  rsus: any[];
}

const RsuMarkers: React.FC<RsuMarkersProps> = ({ rsus }) => {
  const [lastUpdatedRsu, setLastUpdatedRsu] = useState<string | null>(null);
  
  // Flash RSU marker when it's updated in real-time
  useEffect(() => {
    if (rsus.length === 0) return;
    
    // Find the most recently updated RSU based on last_seen
    const sorted = [...rsus].sort((a, b) => {
      const dateA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const dateB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
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

  return (
    <>
      {rsus.map((rsu) => {
        const position = {
          lat: rsu.lat || (defaultCenter.lat + (Math.random() * 0.12 - 0.06)),
          lng: rsu.lng || (defaultCenter.lng + (Math.random() * 0.12 - 0.06)),
        };
        
        // Determine RSU appearance based on status and coverage
        const isActive = rsu.status === "Active";
        const isHighlighted = rsu.rsu_id === lastUpdatedRsu;
        
        // Base colors
        const baseColor = isActive ? "#4ADE80" : "#94A3B8";
        const baseStrokeColor = isActive ? "#22C55E" : "#64748B";
        
        // Highlight colors for recently updated RSUs
        const fillColor = isHighlighted ? "#3B82F6" : baseColor;
        const strokeColor = isHighlighted ? "#2563EB" : baseStrokeColor;
        
        const coverage = rsu.coverage_radius || 500;
        
        const iconScale = isHighlighted ? 8 : 6;
        const circleOpacity = isHighlighted ? 0.3 : 0.15;
        
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
                rotation: rsu.heading || 0
              }}
              title={`${rsu.rsu_id} - ${rsu.location || 'Unknown Location'}`}
              animation={isHighlighted ? google.maps.Animation.BOUNCE : null}
              onClick={() => {
                if (isActive) {
                  toast({
                    title: `RSU ${rsu.rsu_id}`,
                    description: `Location: ${rsu.location || 'Unknown'}, Status: Active, Coverage: ${coverage}m`,
                  });
                } else {
                  toast({
                    title: `RSU ${rsu.rsu_id}`,
                    description: `Location: ${rsu.location || 'Unknown'}, Status: Inactive, Coverage: ${coverage}m`,
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

export default RsuMarkers;
