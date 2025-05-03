
import { fetchRealTimeTrafficData } from '@/services/api/external';
import { CongestionZone, Vehicle, Anomaly, RSU } from '@/services/api/types';
import { processTrafficData, createSyntheticSegments } from '../processor';
import { TrafficData } from '../types';
import { generateVehiclesForSegment, generateRSUs } from '../generators';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch traffic data from external APIs and process it
 */
export async function fetchTrafficData(): Promise<{
  trafficData: TrafficData;
  congestionZones: CongestionZone[];
  rsus: RSU[];
}> {
  try {
    // Fetch real traffic data from external API
    console.log("Fetching real-time traffic data from external APIs...");
    const { vehicles, congestion, anomalies, rsus } = await fetchRealTimeTrafficData();
    
    console.log(`Received data: ${vehicles.length} vehicles, ${congestion.length} congestion zones, ${rsus.length} RSUs`);
    
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
      console.log(`Processed ${processedData.segments.length} segments from vehicle data`);
    }
    
    // If not enough data, create synthetic segments
    if (processedData.segments.length < 20) {
      console.log("Not enough segments from real data, creating synthetic ones");
      processedData = createSyntheticSegments(processedData);
      console.log(`Created total of ${processedData.segments.length} segments after synthetic generation`);
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
    
    // Use real RSUs from API if available, otherwise generate them
    const rsuData = rsus.length > 0 ? rsus : generateRSUs(processedData);
    console.log(`Using ${rsus.length > 0 ? 'real' : 'generated'} RSU data: ${rsuData.length} units`);
    
    return { trafficData: processedData, congestionZones, rsus: rsuData };
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    toast({
      title: "Traffic Data Error",
      description: "Failed to fetch real-time data. Using synthetic data instead.",
      variant: "destructive",
    });
    
    // Return minimal synthetic data in case of an error
    const emptyTrafficData: TrafficData = {
      segments: [],
      totalLength: 0,
      totalVehicles: 0
    };
    
    // Create some synthetic segments
    const fallbackData = createSyntheticSegments(emptyTrafficData);
    const syntheticRsus = generateRSUs(fallbackData);
    
    return {
      trafficData: fallbackData,
      congestionZones: [],
      rsus: syntheticRsus
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
  
  console.log(`Generated ${allVehicles.length} vehicles across ${trafficData.segments.length} road segments`);
  return allVehicles;
}

/**
 * Fetch incidents/anomalies if available
 */
export async function fetchIncidents(): Promise<Anomaly[]> {
  try {
    // Get anomalies from the external API
    const { anomalies } = await fetchRealTimeTrafficData();
    console.log(`Fetched ${anomalies.length} traffic incidents`);
    return anomalies;
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return [];
  }
}
