
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
      
      // If this is ML predicted data, add slightly more weight to show its impact
      const mlBoost = zone.predicted_by_ml ? 0.2 : 0;
      
      return {
        location: new google.maps.LatLng(zone.lat, zone.lng),
        weight: weight + mlBoost
      };
    });
    
    // Create additional interpolated points to make congestion look more realistic
    // This creates "traffic corridors" between congested areas
    const enhancedPoints = [...basePoints];
    
    // Add intermediate points between highly congested areas to create "traffic corridors"
    if (congestionData.length > 1) {
      // Find high congestion zones (congestion level > 60)
      const highCongestionZones = congestionData.filter(zone => zone.congestion_level > 60);
      
      // Create connections between nearby high congestion zones
      highCongestionZones.forEach((zone, idx) => {
        // Find nearby high congestion zones to create "traffic corridors"
        const nearbyZones = highCongestionZones.filter((z, i) => {
          if (i === idx) return false; // Skip self
          
          // Calculate approximate distance (simplified)
          const latDiff = Math.abs(z.lat - zone.lat);
          const lngDiff = Math.abs(z.lng - zone.lng);
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          return distance < 0.03; // Only connect very nearby zones
        });
        
        // For each nearby zone, add intermediate points to create "traffic corridors"
        nearbyZones.forEach(nearby => {
          // Create 3 intermediate points between the two congested areas
          for (let step = 1; step <= 3; step++) {
            const ratio = step / 4;
            const lat = zone.lat + (nearby.lat - zone.lat) * ratio;
            const lng = zone.lng + (nearby.lng - zone.lng) * ratio;
            
            // Calculate intermediate congestion level (slightly lower than endpoints)
            const avgCongestion = (zone.congestion_level + nearby.congestion_level) / 2;
            const intermediateCongestion = avgCongestion * 0.8; // Reduce slightly
            
            enhancedPoints.push({
              location: new google.maps.LatLng(lat, lng),
              weight: intermediateCongestion / 100
            });
          }
        });
      });
      
      // Add some random noise points around high congestion areas to make them look more realistic
      highCongestionZones.forEach(zone => {
        // Add 5-10 noise points around each high congestion zone
        const noiseCount = 5 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < noiseCount; i++) {
          // Random offset within 0.005 degrees (roughly 500m)
          const latOffset = (Math.random() - 0.5) * 0.005;
          const lngOffset = (Math.random() - 0.5) * 0.005;
          
          // Reduce congestion level for noise points
          const noiseCongestion = zone.congestion_level * (0.5 + Math.random() * 0.3);
          
          enhancedPoints.push({
            location: new google.maps.LatLng(zone.lat + latOffset, zone.lng + lngOffset),
            weight: noiseCongestion / 100
          });
        }
      });
      
      // For ML-predicted congestion zones, add extra points to emphasize
      const mlPredictedZones = congestionData.filter(zone => zone.predicted_by_ml && zone.congestion_level > 70);
      
      mlPredictedZones.forEach(zone => {
        // Add 3-5 points in a small cluster to emphasize ML predictions
        const emphasisCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < emphasisCount; i++) {
          // Very small random offset to create a tight cluster
          const latOffset = (Math.random() - 0.5) * 0.002;
          const lngOffset = (Math.random() - 0.5) * 0.002;
          
          enhancedPoints.push({
            location: new google.maps.LatLng(zone.lat + latOffset, zone.lng + lngOffset),
            weight: (zone.congestion_level / 100) * 1.2 // 20% boost for ML predictions
          });
        }
      });
    }
    
    return enhancedPoints;
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
        radius: 20, // Smaller radius for more precise congestion areas
        opacity: 0.8, // Higher opacity for better visibility
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
