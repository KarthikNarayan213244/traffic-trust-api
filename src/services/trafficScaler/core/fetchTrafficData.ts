
import { fetchRealTimeTrafficData } from '@/services/api/external';
import { CongestionZone, Vehicle, Anomaly } from '@/services/api/types';
import { processTrafficData, createSyntheticSegments } from '../processor';
import { TrafficData } from '../types';
import { generateVehiclesForSegment } from '../generators';

/**
 * Fetch traffic data from external APIs and process it
 */
export async function fetchTrafficData(): Promise<{
  trafficData: TrafficData;
  congestionZones: CongestionZone[];
}> {
  try {
    // Fetch real traffic data from external API
    const { vehicles, congestion, anomalies } = await fetchRealTimeTrafficData();
    
    // Convert to our internal format
    let processedData: TrafficData = {
      segments: [],
      totalLength: 0,
      totalVehicles: vehicles.length
    };
    
    // If we have data, process it
    if (vehicles.length > 0) {
      // Process vehicle data into segments
      processedData = processTrafficData(vehicles);
    }
    
    // If not enough data, create synthetic segments
    if (processedData.segments.length < 20) {
      processedData = createSyntheticSegments(processedData);
    }
    
    // Extract congestion data for visualization
    const congestionZones: CongestionZone[] = congestion.length > 0 
      ? congestion 
      : processedData.segments
        .filter(segment => segment.congestion > 30) // Only show significant congestion
        .map(segment => {
          // Calculate a point in the middle of the segment
          const midLat = (segment.startLat + segment.endLat) / 2;
          const midLng = (segment.startLng + segment.endLng) / 2;
          
          return {
            id: segment.id,
            lat: midLat,
            lng: midLng,
            zone_name: `Zone ${segment.id}`,
            congestion_level: Math.round(segment.congestion),
            updated_at: new Date().toISOString()
          };
        });
    
    return { trafficData: processedData, congestionZones };
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    
    // Return minimal synthetic data in case of an error
    const emptyTrafficData: TrafficData = {
      segments: [],
      totalLength: 0,
      totalVehicles: 0
    };
    
    // Create some synthetic segments
    const fallbackData = createSyntheticSegments(emptyTrafficData);
    
    return {
      trafficData: fallbackData,
      congestionZones: []
    };
  }
}

/**
 * Generate vehicles for all segments
 */
export function generateAllVehicles(trafficData: TrafficData): Vehicle[] {
  let allVehicles: Vehicle[] = [];
  
  for (const segment of trafficData.segments) {
    const segmentVehicles = generateVehiclesForSegment(segment);
    allVehicles = allVehicles.concat(segmentVehicles);
  }
  
  return allVehicles;
}

/**
 * Fetch incidents/anomalies if available
 */
export async function fetchIncidents(): Promise<Anomaly[]> {
  try {
    // Get anomalies from the external API
    const { anomalies } = await fetchRealTimeTrafficData();
    return anomalies;
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return [];
  }
}
