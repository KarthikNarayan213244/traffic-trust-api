
import { HYDERABAD_BOUNDING_BOX } from '@/services/api/external/config';
import { RoadSegment, TrafficData, VehicleCluster } from './types';
import { Vehicle } from '@/services/api/types';
import { getDistanceInKm } from './utils';

/**
 * Process raw traffic flow data into our internal format
 */
export function processTrafficData(tomTomData: any): TrafficData {
  const segments: RoadSegment[] = [];
  let totalLength = 0;
  
  try {
    if (!tomTomData?.flowSegmentData?.freeFlowSpeed) {
      throw new Error("Invalid TomTom data format");
    }
    
    const processSegment = (segment: any) => {
      if (!segment || !segment.coordinates || segment.coordinates.length < 2) return;
      
      // Extract start and end points
      const startPoint = segment.coordinates[0];
      const endPoint = segment.coordinates[segment.coordinates.length - 1];
      
      if (!startPoint || !endPoint) return;
      
      // Calculate segment length
      const length = getDistanceInKm(
        startPoint.latitude, 
        startPoint.longitude, 
        endPoint.latitude, 
        endPoint.longitude
      );
      
      // Calculate congestion level
      const freeFlowSpeed = segment.freeFlowSpeed || 60;
      const currentSpeed = segment.currentSpeed || freeFlowSpeed * 0.8;
      const congestionLevel = Math.max(0, Math.min(100, 100 * (1 - (currentSpeed / freeFlowSpeed))));
      
      totalLength += length;
      
      segments.push({
        id: `segment-${segments.length}`,
        startLat: startPoint.latitude,
        startLng: startPoint.longitude,
        endLat: endPoint.latitude,
        endLng: endPoint.longitude,
        length,
        congestion: congestionLevel,
        freeFlowSpeed,
        currentSpeed,
        vehicleCount: 0 // Will be calculated later
      });
    };
    
    // Process main segment
    processSegment(tomTomData.flowSegmentData);
    
    // Process child segments if available
    if (tomTomData.flowSegmentData.coordinates) {
      for (let i = 0; i < tomTomData.flowSegmentData.coordinates.length - 1; i++) {
        const childSegment = {
          coordinates: [
            tomTomData.flowSegmentData.coordinates[i],
            tomTomData.flowSegmentData.coordinates[i+1]
          ],
          freeFlowSpeed: tomTomData.flowSegmentData.freeFlowSpeed,
          currentSpeed: tomTomData.flowSegmentData.currentSpeed
        };
        processSegment(childSegment);
      }
    }
    
  } catch (error) {
    console.error("Error processing TomTom data:", error);
  }
  
  return { segments, totalLength, totalVehicles: 0 };
}

/**
 * Create synthetic road segments if needed
 */
export function createSyntheticSegments(rawTrafficData: TrafficData): TrafficData {
  console.log("Not enough segments from API, creating synthetic segments");
  
  // Create a grid of segments across Hyderabad
  const latStep = (HYDERABAD_BOUNDING_BOX.north - HYDERABAD_BOUNDING_BOX.south) / 30;
  const lngStep = (HYDERABAD_BOUNDING_BOX.east - HYDERABAD_BOUNDING_BOX.west) / 30;
  
  for (let lat = HYDERABAD_BOUNDING_BOX.south; lat < HYDERABAD_BOUNDING_BOX.north; lat += latStep) {
    for (let lng = HYDERABAD_BOUNDING_BOX.west; lng < HYDERABAD_BOUNDING_BOX.east; lng += lngStep) {
      // Create horizontal and vertical segments
      const hSegment = {
        id: `h-${rawTrafficData.segments.length}`,
        startLat: lat,
        startLng: lng,
        endLat: lat,
        endLng: lng + lngStep,
        length: getDistanceInKm(lat, lng, lat, lng + lngStep),
        congestion: Math.random() * 80,
        freeFlowSpeed: 40 + Math.random() * 40,
        currentSpeed: 0, // Will be calculated
        vehicleCount: 0 // Will be calculated
      };
      
      const vSegment = {
        id: `v-${rawTrafficData.segments.length + 1}`,
        startLat: lat,
        startLng: lng,
        endLat: lat + latStep,
        endLng: lng,
        length: getDistanceInKm(lat, lng, lat + latStep, lng),
        congestion: Math.random() * 80,
        freeFlowSpeed: 40 + Math.random() * 40,
        currentSpeed: 0, // Will be calculated
        vehicleCount: 0 // Will be calculated
      };
      
      // Calculate current speed based on congestion
      hSegment.currentSpeed = hSegment.freeFlowSpeed * (1 - (hSegment.congestion / 100));
      vSegment.currentSpeed = vSegment.freeFlowSpeed * (1 - (vSegment.congestion / 100));
      
      rawTrafficData.segments.push(hSegment);
      rawTrafficData.segments.push(vSegment);
      rawTrafficData.totalLength += hSegment.length + vSegment.length;
    }
  }
  
  return rawTrafficData;
}

/**
 * Create spatial clusters for vehicles to improve rendering performance
 */
export function clusterVehicles(
  vehicles: Vehicle[], 
  gridSize: number = 0.01
): Map<string, VehicleCluster> {
  const clusters = new Map<string, VehicleCluster>();
  
  for (const vehicle of vehicles) {
    // Create grid cell key based on coordinates
    const gridX = Math.floor(vehicle.lat / gridSize);
    const gridY = Math.floor(vehicle.lng / gridSize);
    const key = `${gridX}:${gridY}`;
    
    if (!clusters.has(key)) {
      clusters.set(key, {
        count: 0,
        avgLat: 0,
        avgLng: 0,
        vehicles: []
      });
    }
    
    const cluster = clusters.get(key)!;
    
    // Update average position
    cluster.avgLat = (cluster.avgLat * cluster.count + vehicle.lat) / (cluster.count + 1);
    cluster.avgLng = (cluster.avgLng * cluster.count + vehicle.lng) / (cluster.count + 1);
    cluster.count += 1;
    
    // Only store the first 1000 vehicles per cluster to save memory
    // The rest will be generated on demand when zoomed in
    if (cluster.vehicles.length < 1000) {
      cluster.vehicles.push(vehicle);
    }
  }
  
  return clusters;
}
