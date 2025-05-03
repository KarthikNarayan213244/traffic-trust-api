
import { Vehicle, RSU, CongestionZone } from '@/services/api/types';
import { fetchTomTomTrafficFlow, fetchTomTomTrafficIncidents } from '@/services/api/external/tomtomApi';
import { toast } from '@/hooks/use-toast';
import { 
  TrafficData, 
  TrafficStats, 
  RSULocation,
  VehicleCluster
} from './types';
import { CONFIG } from './config';
import { 
  processTrafficData, 
  createSyntheticSegments,
  clusterVehicles 
} from './processor';
import {
  generateVehiclesForSegment,
  generateRSUs,
  distributeVehicles
} from './generators';

/**
 * Main class to handle traffic scaling
 */
export class TrafficScaler {
  private vehicles: Vehicle[] = [];
  private rsus: RSU[] = [];
  private congestionZones: CongestionZone[] = [];
  private incidents: any[] = [];
  private trafficData: TrafficData = { segments: [], totalLength: 0, totalVehicles: 0 };
  
  // Cache timestamp
  private lastFetched: number = 0;
  
  // Spatial index for RSUs
  private rsuLocations: RSULocation[] = [];
  
  // Clustering data for performance
  private clusters: Map<string, VehicleCluster> = new Map();
  
  constructor() {
    console.log(`Initializing TrafficScaler with target of ${CONFIG.VEHICLE_TARGET.toLocaleString()} vehicles`);
  }
  
  /**
   * Main method to fetch traffic data from TomTom and scale it
   */
  async fetchAndScaleTraffic(): Promise<void> {
    const now = Date.now();
    
    // Check if we can use cached data
    if (now - this.lastFetched < CONFIG.CACHE_TIMEOUT && this.vehicles.length > 0) {
      console.log(`Using cached traffic data (${this.vehicles.length.toLocaleString()} vehicles, ${this.rsus.length} RSUs)`);
      return;
    }
    
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
      
      // Distribute vehicles across segments
      this.trafficData = distributeVehicles(processedTrafficData);
      
      console.log(`Created ${this.trafficData.segments.length} road segments with total length ${this.trafficData.totalLength.toFixed(2)}km`);
      
      // Generate vehicles for each segment
      const allVehicles: Vehicle[] = [];
      for (const segment of this.trafficData.segments) {
        const segmentVehicles = generateVehiclesForSegment(segment);
        allVehicles.push(...segmentVehicles);
      }
      
      // Generate RSUs
      const rsus = generateRSUs(this.trafficData);
      
      // Update state
      this.vehicles = allVehicles;
      this.rsus = rsus;
      this.congestionZones = congestion;
      this.lastFetched = now;
      
      // Create clusters for rendering optimization
      this.clusters = clusterVehicles(allVehicles);
      
      console.log(`Generated ${this.vehicles.length.toLocaleString()} vehicles and ${this.rsus.length} RSUs`);
      console.log(`Created ${this.clusters.size} vehicle clusters for optimized rendering`);
      
      // Try to fetch incidents as well
      try {
        const anomalies = await fetchTomTomTrafficIncidents();
        if (anomalies && anomalies.length > 0) {
          console.log(`Fetched ${anomalies.length} traffic incidents`);
        }
      } catch (error) {
        console.error("Error fetching traffic incidents:", error);
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
    if (this.vehicles.length === 0) {
      return [];
    }
    
    // If no bounds provided or zoom is very low, return a small sample for overview
    if (!bounds || zoomLevel < 8) {
      // Return one vehicle per cluster for a low-zoom overview
      return Array.from(this.clusters.values())
        .map(cluster => ({
          ...cluster.vehicles[0],
          lat: cluster.avgLat,
          lng: cluster.avgLng,
          vehicle_id: `cluster-${cluster.vehicles[0].vehicle_id}`,
          cluster_size: cluster.count
        }))
        .slice(0, 5000); // Limit to 5000 markers maximum
    }
    
    // For medium zoom (8-12), return cluster representatives
    if (zoomLevel < 13) {
      // Filter clusters that are in the viewport
      const visibleClusters = Array.from(this.clusters.entries())
        .filter(([_, cluster]) => {
          return cluster.avgLat <= bounds.north && 
                 cluster.avgLat >= bounds.south && 
                 cluster.avgLng <= bounds.east && 
                 cluster.avgLng >= bounds.west;
        })
        .map(([_, cluster]) => cluster);
      
      // Return samples from each visible cluster, proportional to zoom
      const samplesPerCluster = Math.max(1, Math.floor((zoomLevel - 8) * 50));
      
      const samples: Vehicle[] = [];
      for (const cluster of visibleClusters) {
        if (cluster.vehicles.length <= samplesPerCluster) {
          samples.push(...cluster.vehicles);
        } else {
          // Take random samples from this cluster
          const clusterSamples = new Set<number>();
          while (clusterSamples.size < samplesPerCluster) {
            clusterSamples.add(Math.floor(Math.random() * cluster.vehicles.length));
          }
          for (const index of clusterSamples) {
            samples.push(cluster.vehicles[index]);
          }
        }
      }
      
      // Limit total returned vehicles
      const maxVehicles = Math.min(50000, Math.pow(10, zoomLevel - 6));
      return samples.slice(0, maxVehicles);
    }
    
    // For high zoom (13+), return individual vehicles in viewport
    return this.vehicles.filter(vehicle => {
      return vehicle.lat <= bounds.north && 
             vehicle.lat >= bounds.south && 
             vehicle.lng <= bounds.east && 
             vehicle.lng >= bounds.west;
    }).slice(0, 100000); // Hard limit at 100k vehicles for performance
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
    if (!bounds) {
      return this.rsus;
    }
    
    return this.rsus.filter(rsu => {
      return rsu.lat <= bounds.north && 
             rsu.lat >= bounds.south && 
             rsu.lng <= bounds.east && 
             rsu.lng >= bounds.west;
    });
  }
  
  /**
   * Get congestion data
   */
  getCongestionData(): CongestionZone[] {
    return this.congestionZones;
  }
  
  /**
   * Get cluster stats
   */
  getStats(): TrafficStats {
    return {
      totalVehicles: this.vehicles.length,
      totalRSUs: this.rsus.length,
      clusters: this.clusters.size,
      segments: this.trafficData.segments.length,
      lastUpdated: new Date(this.lastFetched)
    };
  }
}
