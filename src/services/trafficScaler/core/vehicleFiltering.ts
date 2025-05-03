
import { Vehicle } from '@/services/api/types';

/**
 * Create spatial index for vehicles to optimize filtering
 */
export function createVehicleIndex(vehicles: Vehicle[], gridSize: number = 0.1): Map<string, Vehicle[]> {
  const index = new Map<string, Vehicle[]>();
  
  for (const vehicle of vehicles) {
    const gridX = Math.floor(vehicle.lat / gridSize);
    const gridY = Math.floor(vehicle.lng / gridSize);
    const key = `${gridX}:${gridY}`;
    
    if (!index.has(key)) {
      index.set(key, []);
    }
    
    index.get(key)!.push(vehicle);
  }
  
  return index;
}

/**
 * Filter vehicles by map bounds and zoom level
 */
export function filterVehiclesByBounds(
  vehicleIndex: Map<string, Vehicle[]>,
  allVehicles: Vehicle[],
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  zoomLevel: number = 10,
  gridSize: number = 0.1
): Vehicle[] {
  if (allVehicles.length === 0) {
    return [];
  }
  
  // If no bounds provided or zoom is very low, return a small sample for overview
  if (!bounds || zoomLevel < 8) {
    // Return samples from the index for a low-zoom overview
    const samples: Vehicle[] = [];
    let count = 0;
    
    // Get one vehicle from each grid cell
    for (const vehicles of vehicleIndex.values()) {
      if (vehicles.length > 0) {
        samples.push(vehicles[0]);
        count++;
      }
      
      if (count >= 5000) break; // Limit to 5000 markers maximum
    }
    
    return samples;
  }
  
  // For medium zoom (8-12), return sample from each relevant grid cell
  if (zoomLevel < 13) {
    const relevantGridCells: string[] = [];
    const samples: Vehicle[] = [];
    
    // Find grid cells that overlap with the viewport
    const minGridX = Math.floor(bounds.south / gridSize);
    const maxGridX = Math.ceil(bounds.north / gridSize);
    const minGridY = Math.floor(bounds.west / gridSize);
    const maxGridY = Math.ceil(bounds.east / gridSize);
    
    // Calculate how many vehicles to sample based on zoom level
    const samplesPerCell = Math.max(1, Math.floor((zoomLevel - 8) * 5));
    
    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        const key = `${x}:${y}`;
        if (vehicleIndex.has(key)) {
          const cellVehicles = vehicleIndex.get(key)!;
          
          // Take samples from this cell
          if (cellVehicles.length <= samplesPerCell) {
            samples.push(...cellVehicles);
          } else {
            // Take random samples
            const cellSamples = new Set<number>();
            while (cellSamples.size < samplesPerCell) {
              cellSamples.add(Math.floor(Math.random() * cellVehicles.length));
            }
            for (const index of cellSamples) {
              samples.push(cellVehicles[index]);
            }
          }
        }
      }
    }
    
    // Limit total returned vehicles
    const maxVehicles = Math.min(50000, Math.pow(10, zoomLevel - 6));
    return samples.slice(0, maxVehicles);
  }
  
  // For high zoom (13+), return individual vehicles in viewport
  return allVehicles.filter(vehicle => {
    return vehicle.lat <= bounds.north && 
           vehicle.lat >= bounds.south && 
           vehicle.lng <= bounds.east && 
           vehicle.lng >= bounds.west;
  }).slice(0, 100000); // Hard limit at 100k vehicles for performance
}

/**
 * Filter RSUs by map bounds
 */
export function filterRSUsByBounds(
  rsus: any[],
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): any[] {
  if (!bounds) {
    return rsus;
  }
  
  return rsus.filter(rsu => {
    return rsu.lat <= bounds.north && 
           rsu.lat >= bounds.south && 
           rsu.lng <= bounds.east && 
           rsu.lng >= bounds.west;
  });
}
