
import { Vehicle, RSU } from '@/services/api/types';
import { RoadSegment, RSULocation, TrafficData } from './types';
import { CONFIG } from './config';
import { getDistanceInKm, calculateHeading, generateUniqueId } from './utils';

/**
 * Generate vehicles for a road segment based on its properties
 */
export function generateVehiclesForSegment(segment: RoadSegment): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const segmentVehicles = segment.vehicleCount;
  
  // Calculate positions along the segment
  const latDiff = segment.endLat - segment.startLat;
  const lngDiff = segment.endLng - segment.startLng;
  
  for (let i = 0; i < segmentVehicles; i++) {
    // Position the vehicle somewhere along the segment
    const position = Math.random();
    const lat = segment.startLat + (latDiff * position);
    const lng = segment.startLng + (lngDiff * position);
    
    // Determine vehicle type based on distribution
    const vehicleTypeRand = Math.random() * 100;
    let vehicleType = "car";
    let cumulativePct = 0;
    
    for (const [type, percentage] of Object.entries(CONFIG.VEHICLE_TYPES)) {
      cumulativePct += percentage;
      if (vehicleTypeRand <= cumulativePct) {
        vehicleType = type;
        break;
      }
    }
    
    // Generate trust score based on vehicle type
    const trustRange = CONFIG.TRUST_SCORE_RANGES[vehicleType as keyof typeof CONFIG.TRUST_SCORE_RANGES] || 
                        CONFIG.TRUST_SCORE_RANGES.car;
    const trustScore = Math.floor(trustRange.min + Math.random() * (trustRange.max - trustRange.min));
    
    // Generate owner name
    const ownerName = CONFIG.OWNER_NAMES[Math.floor(Math.random() * CONFIG.OWNER_NAMES.length)];
    
    // Generate heading (direction of travel) based on segment orientation
    const heading = calculateHeading(segment.startLat, segment.startLng, segment.endLat, segment.endLng);
    
    // Generate unique ID
    const id = generateUniqueId(`HYD-${vehicleType.substring(0, 2).toUpperCase()}`);
    
    // Calculate speed as a percentage of free flow based on congestion
    const speedFactor = 1 - (segment.congestion / 100);
    const speed = Math.max(5, segment.freeFlowSpeed * speedFactor);
    
    // Determine vehicle status based on trust score and congestion
    let status = "Normal";
    if (trustScore < 60) {
      status = "Warning";
    } else if (segment.congestion > 80) {
      status = "Alert";
    }
    
    vehicles.push({
      vehicle_id: id,
      lat,
      lng,
      heading,
      speed,
      vehicle_type: vehicleType,
      status,
      trust_score: trustScore,
      owner_name: ownerName,
      timestamp: new Date().toISOString(),
      location: {
        lat,
        lng
      }
    });
  }
  
  return vehicles;
}

/**
 * Check if an RSU location is valid (not too close to existing ones)
 */
export function isValidRsuLocation(lat: number, lng: number, existingLocations: RSULocation[]): boolean {
  for (const loc of existingLocations) {
    const distance = getDistanceInKm(lat, lng, loc.lat, loc.lng);
    if (distance < CONFIG.MIN_RSU_DISTANCE_KM) {
      return false;
    }
  }
  return true;
}

/**
 * Generate RSUs along road segments
 */
export function generateRSUs(trafficData: TrafficData): RSU[] {
  const rsus: RSU[] = [];
  const rsuLocations: RSULocation[] = [];
  
  // Target number of RSUs based on total road length and configured density
  const targetRSUs = Math.ceil(trafficData.totalLength / CONFIG.RSU_DENSITY_KM);
  console.log(`Generating approximately ${targetRSUs} RSUs based on road network`);
  
  // Select major segments for RSU placement
  const majorSegments = trafficData.segments
    .filter(s => s.freeFlowSpeed > 40) // Only major roads
    .sort((a, b) => b.length - a.length); // Prioritize longer segments
  
  for (const segment of majorSegments) {
    if (rsus.length >= targetRSUs) break;
    
    // Number of RSUs to place on this segment based on its length
    const segmentRSUs = Math.max(1, Math.floor(segment.length / CONFIG.RSU_DENSITY_KM));
    
    for (let i = 0; i < segmentRSUs; i++) {
      // Position along the segment (avoid endpoints)
      const position = 0.1 + (0.8 * (i / segmentRSUs));
      const lat = segment.startLat + ((segment.endLat - segment.startLat) * position);
      const lng = segment.startLng + ((segment.endLng - segment.startLng) * position);
      
      // Check if this location is valid (not too close to other RSUs)
      if (isValidRsuLocation(lat, lng, rsuLocations)) {
        rsuLocations.push({lat, lng});
        
        // Generate RSU coverage radius based on road type
        const coverage = 250 + Math.random() * 250;
        
        // Random but fixed RSU ID
        const rsuId = `HYD-RSU-${rsuLocations.length.toString().padStart(3, '0')}`;
        
        // Generate heading based on segment orientation
        const heading = calculateHeading(
          segment.startLat, 
          segment.startLng, 
          segment.endLat, 
          segment.endLng
        );
        
        rsus.push({
          rsu_id: rsuId,
          lat,
          lng,
          status: Math.random() > 0.05 ? "Active" : "Inactive", // 5% chance of inactive
          location: {
            lat,
            lng
          },
          coverage_radius: coverage,
          heading,
        });
        
        if (rsus.length >= targetRSUs) break;
      }
    }
  }
  
  return rsus;
}

/**
 * Distribute vehicles across segments based on length and congestion
 */
export function distributeVehicles(data: TrafficData): TrafficData {
  // Calculate weights for vehicle distribution based on length and congestion
  const weights = data.segments.map(segment => {
    // Longer and more congested segments get more vehicles
    return segment.length * (1 + segment.congestion / 50);
  });
  
  // Calculate total weight
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Calculate vehicle count for each segment
  let remainingVehicles = CONFIG.VEHICLE_TARGET;
  
  for (let i = 0; i < data.segments.length; i++) {
    // Last segment gets all remaining vehicles to ensure we hit target exactly
    if (i === data.segments.length - 1) {
      data.segments[i].vehicleCount = remainingVehicles;
    } else {
      // Allocate vehicles proportionally by weight
      const segmentVehicles = Math.floor((weights[i] / totalWeight) * CONFIG.VEHICLE_TARGET);
      data.segments[i].vehicleCount = segmentVehicles;
      remainingVehicles -= segmentVehicles;
    }
  }
  
  data.totalVehicles = CONFIG.VEHICLE_TARGET;
  return data;
}
