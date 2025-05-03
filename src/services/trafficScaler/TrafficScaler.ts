
import { TrafficScalerCore } from './core/TrafficScalerCore';
import { Vehicle, RSU } from '@/services/api/types';
import { toast } from '@/hooks/use-toast';
import { fetchTrafficData, fetchIncidents, generateAllVehicles } from './core/fetchTrafficData';
import { createVehicleIndex, filterVehiclesByBounds, filterRSUsByBounds } from './core/vehicleFiltering';
import { distributeVehicles } from './generators';

/**
 * Main TrafficScaler class with public API
 */
export class TrafficScaler extends TrafficScalerCore {
  /**
   * Main method to fetch traffic data from TomTom and scale it
   */
  async fetchAndScaleTraffic(): Promise<void> {
    const now = Date.now();
    
    // Check if we can use cached data
    if (now - this.lastFetched < 60000 && this.vehicles.length > 0) {
      console.log(`Using cached traffic data (${this.vehicles.length.toLocaleString()} vehicles, ${this.rsus.length} RSUs)`);
      return;
    }
    
    try {
      // Step 1: Fetch and process traffic data
      const { trafficData, congestionZones } = await fetchTrafficData();
      
      // Step 2: Distribute vehicles across segments
      this.trafficData = distributeVehicles(trafficData);
      
      console.log(`Created ${this.trafficData.segments.length} road segments with total length ${this.trafficData.totalLength.toFixed(2)}km`);
      
      // Step 3: Generate vehicles for each segment
      const allVehicles = generateAllVehicles(this.trafficData);
      
      // Step 4: Generate RSUs
      const rsus = generateRSUs(this.trafficData);
      
      // Step 5: Create vehicle spatial index for efficient filtering
      this.vehicleIndex = createVehicleIndex(allVehicles);
      
      // Step 6: Update state
      this.vehicles = allVehicles;
      this.rsus = rsus;
      this.congestionZones = congestionZones;
      this.lastFetched = now;
      
      console.log(`Generated ${this.vehicles.length.toLocaleString()} vehicles and ${this.rsus.length} RSUs`);
      console.log(`Created ${this.vehicleIndex.size} vehicle grid cells for optimized rendering`);
      
      // Step 7: Try to fetch incidents as well
      const anomalies = await fetchIncidents();
      if (anomalies && anomalies.length > 0) {
        console.log(`Fetched ${anomalies.length} traffic incidents`);
      }
      
      toast({
        title: "Traffic Data Scaled",
        description: `Generated ${Math.round(this.vehicles.length/1000000)}M vehicles across ${this.trafficData.segments.length} road segments`,
      });
      
    } catch (error) {
      console.error("Error fetching and scaling traffic:", error);
      toast({
        title: "Traffic Data Error",
        description: "Failed to scale traffic data. Using previous data if available.",
        variant: "destructive",
      });
    }
  }
  
  /**
   * Get vehicles in a specific view bounds
   */
  getVehicles(bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, zoomLevel: number = 10): Vehicle[] {
    return filterVehiclesByBounds(
      this.vehicleIndex,
      this.vehicles,
      bounds,
      zoomLevel
    );
  }
  
  /**
   * Get RSUs in a specific view bounds
   */
  getRSUs(bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): RSU[] {
    return filterRSUsByBounds(this.rsus, bounds);
  }
}
