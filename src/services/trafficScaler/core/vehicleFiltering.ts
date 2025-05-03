
import { Vehicle, RSU } from "@/services/api/types";

/**
 * Create a spatial index for vehicles to optimize spatial queries
 */
export function createVehicleIndex(vehicles: Vehicle[]): Map<string, Vehicle[]> {
  const index = new Map<string, Vehicle[]>();
  const cellSize = 0.01; // Approximately 1km cells at equator
  
  for (const vehicle of vehicles) {
    // Create a grid cell identifier based on lat/lng
    const cellX = Math.floor(vehicle.lng / cellSize);
    const cellY = Math.floor(vehicle.lat / cellSize);
    const cellId = `${cellX}:${cellY}`;
    
    // Add to existing cell or create new one
    if (index.has(cellId)) {
      index.get(cellId)!.push(vehicle);
    } else {
      index.set(cellId, [vehicle]);
    }
  }
  
  return index;
}

/**
 * Filter vehicles by map bounds with optimized spatial querying
 */
export function filterVehiclesByBounds(
  vehicleIndex: Map<string, Vehicle[]>,
  allVehicles: Vehicle[],
  bounds?: { north: number; south: number; east: number; west: number },
  zoomLevel: number = 10
): Vehicle[] {
  // If no bounds provided, limit to a small sample for performance
  if (!bounds) {
    return allVehicles.slice(0, 1000);
  }
  
  const { north, south, east, west } = bounds;
  const cellSize = 0.01; // Same cell size as in createVehicleIndex
  
  // Calculate cell range to query
  const minCellX = Math.floor(west / cellSize);
  const maxCellX = Math.ceil(east / cellSize);
  const minCellY = Math.floor(south / cellSize);
  const maxCellY = Math.ceil(north / cellSize);
  
  // Collect vehicles from relevant cells
  let filteredVehicles: Vehicle[] = [];
  
  for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
    for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
      const cellId = `${cellX}:${cellY}`;
      
      if (vehicleIndex.has(cellId)) {
        filteredVehicles.push(...vehicleIndex.get(cellId)!);
      }
    }
  }
  
  // Apply secondary filter to ensure bounds are respected
  filteredVehicles = filteredVehicles.filter(vehicle => 
    vehicle.lat >= south && 
    vehicle.lat <= north && 
    vehicle.lng >= west && 
    vehicle.lng <= east
  );
  
  // Apply density reduction based on zoom level
  // At low zoom levels, we don't want to render thousands of vehicles
  if (zoomLevel < 10) {
    const samplingRate = Math.max(0.01, (zoomLevel - 5) / 5);
    const maxVehicles = Math.floor(100 + (900 * samplingRate));
    
    // If we have too many vehicles, sample them
    if (filteredVehicles.length > maxVehicles) {
      // Priority sampling for emergency vehicles
      const emergencyVehicles = filteredVehicles.filter(v => 
        v.vehicle_type === 'Ambulance' || 
        v.vehicle_type === 'Police' || 
        v.vehicle_type === 'Fire'
      );
      
      // Get remaining vehicles
      const regularVehicles = filteredVehicles.filter(v => 
        v.vehicle_type !== 'Ambulance' && 
        v.vehicle_type !== 'Police' && 
        v.vehicle_type !== 'Fire'
      );
      
      // Sample regular vehicles
      const sampledRegular = regularVehicles
        .sort(() => 0.5 - Math.random())
        .slice(0, maxVehicles - emergencyVehicles.length);
      
      // Combine emergency and sampled regular vehicles
      filteredVehicles = [...emergencyVehicles, ...sampledRegular];
    }
  }
  
  return filteredVehicles;
}

/**
 * Filter RSUs by map bounds
 */
export function filterRSUsByBounds(
  rsus: RSU[],
  bounds?: { north: number; south: number; east: number; west: number }
): RSU[] {
  if (!bounds) {
    return rsus.slice(0, 100); // Limit if no bounds provided
  }
  
  const { north, south, east, west } = bounds;
  
  return rsus.filter(rsu => 
    rsu.lat >= south && 
    rsu.lat <= north && 
    rsu.lng >= west && 
    rsu.lng <= east
  );
}
