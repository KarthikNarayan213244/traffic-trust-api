
import { fetchTomTomTrafficFlow, fetchTomTomTrafficIncidents } from '@/services/api/external/tomtomApi';
import { toast } from '@/hooks/use-toast';
import { 
  processTrafficData, 
  createSyntheticSegments
} from '../processor';
import { 
  generateVehiclesForSegment
} from '../generators';
import { Vehicle, CongestionZone } from '@/services/api/types';

/**
 * Fetch traffic flow data from external API
 */
export async function fetchTrafficData() {
  console.log("Fetching fresh traffic data from TomTom API");
  
  try {
    // Fetch traffic flow data
    const { vehicles: sampleVehicles, congestion } = await fetchTomTomTrafficFlow();
    
    // Process data into internal format
    const rawTrafficData = processTrafficData({
      flowSegmentData: {
        freeFlowSpeed: 60,
        currentSpeed: 45,
        coordinates: sampleVehicles.map(v => ({
          latitude: v.lat,
          longitude: v.lng
        }))
      }
    });
    
    // If we don't have enough segments, create synthetic ones
    let processedTrafficData = rawTrafficData;
    if (rawTrafficData.segments.length < 100) {
      processedTrafficData = createSyntheticSegments(rawTrafficData);
    }
    
    // Return the processed data along with congestion zones
    return {
      trafficData: processedTrafficData,
      congestionZones: congestion as CongestionZone[]
    };
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    throw error;
  }
}

/**
 * Fetch traffic incidents from external API
 */
export async function fetchIncidents() {
  try {
    const anomalies = await fetchTomTomTrafficIncidents();
    return anomalies;
  } catch (error) {
    console.error("Error fetching traffic incidents:", error);
    return [];
  }
}

/**
 * Generate vehicles for all segments in the traffic data
 */
export function generateAllVehicles(trafficData: any) {
  const allVehicles: Vehicle[] = [];
  for (const segment of trafficData.segments) {
    const segmentVehicles = generateVehiclesForSegment(segment);
    allVehicles.push(...segmentVehicles);
  }
  return allVehicles;
}
