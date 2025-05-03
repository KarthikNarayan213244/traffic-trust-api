
import { Vehicle, RSU } from '@/services/api/types';
import { RoadSegment, TrafficData } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate vehicles for a specific road segment
 */
export function generateVehiclesForSegment(segment: RoadSegment): Vehicle[] {
  const vehicles: Vehicle[] = [];
  
  // Calculate vehicle density based on length and congestion
  // More congested segments have more vehicles
  const baseDensity = 10; // vehicles per km
  const congestionFactor = 1 + (segment.congestion / 100);
  const vehicleCount = Math.round(segment.length * baseDensity * congestionFactor);
  
  // Update segment with vehicle count
  segment.vehicleCount = vehicleCount;
  
  // Generate vehicles along the segment
  for (let i = 0; i < vehicleCount; i++) {
    // Position vehicle somewhere along the segment
    const position = Math.random(); // 0 to 1
    const lat = segment.startLat + (segment.endLat - segment.startLat) * position;
    const lng = segment.startLng + (segment.endLng - segment.startLng) * position;
    
    // Calculate speed based on congestion (km/h)
    const speedFactor = 1 - (segment.congestion / 100);
    const baseSpeed = segment.freeFlowSpeed;
    const speed = baseSpeed * speedFactor;
    
    // Calculate heading (direction) in degrees
    const heading = Math.round(Math.atan2(
      segment.endLng - segment.startLng,
      segment.endLat - segment.startLat
    ) * (180 / Math.PI));
    
    // Determine vehicle type
    const vehicleTypes = ['Car', 'Truck', 'Bus', 'Two-Wheeler', 'Three-Wheeler', 'Ambulance'];
    const vehicleTypeDistribution = [0.7, 0.1, 0.1, 0.05, 0.04, 0.01]; // Probabilities
    
    // Select vehicle type based on probability
    let vehicleType = 'Car';
    const rand = Math.random();
    let cumulative = 0;
    
    for (let j = 0; j < vehicleTypes.length; j++) {
      cumulative += vehicleTypeDistribution[j];
      if (rand <= cumulative) {
        vehicleType = vehicleTypes[j];
        break;
      }
    }
    
    // Generate trust score (higher for emergency vehicles)
    let trustScore = Math.round(70 + Math.random() * 30);
    if (vehicleType === 'Ambulance' || vehicleType === 'Bus') {
      trustScore = Math.round(85 + Math.random() * 15); // Higher trust for essential vehicles
    }
    
    // Create vehicle ID with prefix based on type
    const prefix = vehicleType.substring(0, 2).toUpperCase();
    const vehicleId = `HYD-${prefix}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Create the vehicle - removing the invalid 'id' property and adding required location object
    vehicles.push({
      vehicle_id: vehicleId,
      vehicle_type: vehicleType,
      lat,
      lng,
      location: { lat, lng }, // Add the location object as required by the type
      speed,
      heading,
      trust_score: trustScore,
      status: Math.random() > 0.95 ? 'Warning' : 'Active', // Some vehicles have warnings
      owner_name: `Owner ${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    });
  }
  
  return vehicles;
}

/**
 * Generate RSUs (Road Side Units) across the road network
 */
export function generateRSUs(trafficData: TrafficData): RSU[] {
  const rsus: RSU[] = [];
  
  // Place RSUs at strategic locations (major intersections, high congestion areas)
  // For simplicity, we'll place RSUs based on segment density
  const segments = trafficData.segments;
  
  // Determine how many RSUs to create - roughly 1 per 5 segments but at least 10
  const rsuCount = Math.max(10, Math.ceil(segments.length / 5));
  
  // Create RSUs
  for (let i = 0; i < rsuCount; i++) {
    // Pick a segment (prefer segments with high congestion)
    const segmentIndex = Math.floor(Math.pow(Math.random(), 2) * segments.length);
    const segment = segments[segmentIndex];
    
    // Position RSU somewhere along the segment
    const position = Math.random(); // 0 to 1
    const lat = segment.startLat + (segment.endLat - segment.startLat) * position;
    const lng = segment.startLng + (segment.endLng - segment.startLng) * position;
    
    // Generate coverage radius (in meters) - bigger for congested areas
    const baseRadius = 500; // meters
    const congestionFactor = 1 + (segment.congestion / 100);
    const coverageRadius = Math.round(baseRadius * congestionFactor);
    
    // Create RSU ID
    const rsuId = `RSU-${i.toString().padStart(3, '0')}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Create the RSU - fixing the status to only use valid values and creating a proper location object
    rsus.push({
      rsu_id: rsuId,
      lat,
      lng,
      location: { lat, lng }, // Add the location object with the correct structure
      coverage_radius: coverageRadius,
      status: Math.random() > 0.1 ? 'Active' : 'Inactive' // Only use valid status values
    });
  }
  
  return rsus;
}

/**
 * Distribute vehicles across road segments
 */
export function distributeVehicles(trafficData: TrafficData): TrafficData {
  // This function updates the traffic data by distributing vehicles
  // more realistically across segments
  
  // Calculate total length for vehicle density calculations
  let totalVehicles = 0;
  
  for (const segment of trafficData.segments) {
    // Calculate vehicle density based on segment properties
    const congestionFactor = 1 + (segment.congestion / 100);
    const baseVehiclesPerKm = 50; // base vehicles per km
    const vehiclesForSegment = Math.round(segment.length * baseVehiclesPerKm * congestionFactor);
    
    // Update segment vehicle count
    segment.vehicleCount = vehiclesForSegment;
    totalVehicles += vehiclesForSegment;
  }
  
  // Update total vehicles count
  trafficData.totalVehicles = totalVehicles;
  
  return trafficData;
}
