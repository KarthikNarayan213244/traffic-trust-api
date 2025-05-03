import { Vehicle, RSU, CongestionZone } from '@/services/api/types';
import { fetchTomTomTrafficFlow, fetchTomTomTrafficIncidents } from '@/services/api/external/tomtomApi';
import { API_PROVIDERS, HYDERABAD_BOUNDING_BOX } from '@/services/api/external/config';
import { toast } from '@/hooks/use-toast';

// Configuration with defaults that can be overridden by environment variables
const CONFIG = {
  // Target number of vehicles to generate across Hyderabad
  VEHICLE_TARGET: parseInt(import.meta.env.VITE_HYD_VEHICLE_TARGET || '3500000', 10),
  
  // RSU density (one RSU per X kilometers of major road)
  RSU_DENSITY_KM: parseFloat(import.meta.env.VITE_HYD_RSU_DENSITY || '2.5'),
  
  // Minimum distance between RSUs in kilometers
  MIN_RSU_DISTANCE_KM: parseFloat(import.meta.env.VITE_MIN_RSU_DISTANCE || '0.5'),
  
  // Cache timeout in milliseconds (60 seconds)
  CACHE_TIMEOUT: 60000,
  
  // Vehicle types distribution (percentages)
  VEHICLE_TYPES: {
    car: 65,
    two_wheeler: 25,
    truck: 5,
    bus: 3,
    ambulance: 1,
    other: 1
  },
  
  // Sample owner names for generated vehicles
  OWNER_NAMES: [
    "Raj Kumar", "Priya Singh", "Amit Patel", "Deepa Sharma", "Mohammed Khan", 
    "Sunita Reddy", "Venkat Rao", "Lakshmi Devi", "Arjun Nair", "Fatima Begum",
    "Rajesh Khanna", "Ananya Das", "Surya Prakash", "Kavita Joshi", "Imran Ahmed"
  ],
  
  // Trust score ranges by vehicle types
  TRUST_SCORE_RANGES: {
    car: { min: 60, max: 95 },
    two_wheeler: { min: 50, max: 90 },
    truck: { min: 55, max: 85 },
    bus: { min: 65, max: 90 },
    ambulance: { min: 75, max: 99 },
    other: { min: 40, max: 85 }
  }
};

// Types for internal representation of traffic data
type RoadSegment = {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  length: number; // in km
  congestion: number; // 0-100
  freeFlowSpeed: number;
  currentSpeed: number;
  vehicleCount: number;
};

type TrafficData = {
  segments: RoadSegment[];
  totalLength: number;
  totalVehicles: number;
};

// Singleton class to handle traffic scaling
class TrafficScaler {
  private vehicles: Vehicle[] = [];
  private rsus: RSU[] = [];
  private congestionZones: CongestionZone[] = [];
  private incidents: any[] = [];
  private trafficData: TrafficData = { segments: [], totalLength: 0, totalVehicles: 0 };
  
  // Cache timestamp
  private lastFetched: number = 0;
  
  // Spatial index for RSUs to ensure proper distribution
  private rsuLocations: Array<{lat: number, lng: number}> = [];
  
  // Clustering data for performance
  private clusters: Map<string, {count: number, avgLat: number, avgLng: number, vehicles: Vehicle[]}> = new Map();
  
  constructor() {
    console.log(`Initializing TrafficScaler with target of ${CONFIG.VEHICLE_TARGET.toLocaleString()} vehicles`);
  }
  
  // Convert degrees to radians
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  // Calculate distance between two points in km using Haversine formula
  private getDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    return distance;
  }
  
  // Check if an RSU location is valid (not too close to existing ones)
  private isValidRsuLocation(lat: number, lng: number): boolean {
    for (const loc of this.rsuLocations) {
      const distance = this.getDistanceInKm(lat, lng, loc.lat, loc.lng);
      if (distance < CONFIG.MIN_RSU_DISTANCE_KM) {
        return false;
      }
    }
    return true;
  }
  
  // Generate vehicles for a road segment based on its properties
  private generateVehiclesForSegment(segment: RoadSegment): Vehicle[] {
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
      const heading = Math.atan2(latDiff, lngDiff) * (180 / Math.PI);
      
      // Generate unique ID using timestamp and random values
      const id = `HYD-${vehicleType.substring(0, 2).toUpperCase()}-${Date.now().toString(36).substring(4)}-${Math.random().toString(36).substring(2, 6)}`;
      
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
        // Fix: replace last_seen with timestamp which is in the Vehicle type
        timestamp: new Date().toISOString(),
        // Add missing location property to match Vehicle type
        location: {
          lat,
          lng
        }
      });
    }
    
    return vehicles;
  }
  
  // Generate RSUs along road segments
  private generateRSUs(): RSU[] {
    const rsus: RSU[] = [];
    this.rsuLocations = [];
    
    // Target number of RSUs based on total road length and configured density
    const targetRSUs = Math.ceil(this.trafficData.totalLength / CONFIG.RSU_DENSITY_KM);
    console.log(`Generating approximately ${targetRSUs} RSUs based on road network`);
    
    // Select major segments for RSU placement
    const majorSegments = this.trafficData.segments
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
        if (this.isValidRsuLocation(lat, lng)) {
          this.rsuLocations.push({lat, lng});
          
          // Generate RSU coverage radius based on road type
          const coverage = 250 + Math.random() * 250;
          
          // Random but fixed RSU ID
          const rsuId = `HYD-RSU-${this.rsuLocations.length.toString().padStart(3, '0')}`;
          
          // Generate heading based on segment orientation
          const heading = Math.atan2(
            segment.endLat - segment.startLat, 
            segment.endLng - segment.startLng
          ) * (180 / Math.PI);
          
          rsus.push({
            rsu_id: rsuId,
            lat,
            lng,
            status: Math.random() > 0.05 ? "Active" : "Inactive", // 5% chance of inactive
            location: {
              lat,
              lng
            }, // Fix: add proper location object instead of string
            coverage_radius: coverage,
            heading,
          });
          
          if (rsus.length >= targetRSUs) break;
        }
      }
    }
    
    return rsus;
  }
  
  // Process raw traffic flow data into our internal format
  private processTrafficData(tomTomData: any): TrafficData {
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
        const length = this.getDistanceInKm(
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
  
  // Distribute vehicles across segments based on length and congestion
  private distributeVehicles(data: TrafficData): TrafficData {
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
  
  // Create spatial clusters for vehicles to improve rendering performance
  private clusterVehicles(vehicles: Vehicle[], gridSize: number = 0.01): Map<string, {count: number, avgLat: number, avgLng: number, vehicles: Vehicle[]}> {
    const clusters = new Map<string, {count: number, avgLat: number, avgLng: number, vehicles: Vehicle[]}>();
    
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
  
  // Main method to fetch traffic data from TomTom and scale it
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
      
      // Use the flow data to create our scaled model
      // We're transforming a small sample into millions of vehicles
      
      // Process data into internal format
      const rawTrafficData = this.processTrafficData({
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
      if (rawTrafficData.segments.length < 100) {
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
              length: this.getDistanceInKm(lat, lng, lat, lng + lngStep),
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
              length: this.getDistanceInKm(lat, lng, lat + latStep, lng),
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
      }
      
      // Distribute vehicles across segments
      this.trafficData = this.distributeVehicles(rawTrafficData);
      
      console.log(`Created ${this.trafficData.segments.length} road segments with total length ${this.trafficData.totalLength.toFixed(2)}km`);
      
      // Generate vehicles for each segment
      const allVehicles: Vehicle[] = [];
      for (const segment of this.trafficData.segments) {
        const segmentVehicles = this.generateVehiclesForSegment(segment);
        allVehicles.push(...segmentVehicles);
      }
      
      // Generate RSUs
      const rsus = this.generateRSUs();
      
      // Update state
      this.vehicles = allVehicles;
      this.rsus = rsus;
      this.congestionZones = congestion;
      this.lastFetched = now;
      
      // Create clusters for rendering optimization
      this.clusters = this.clusterVehicles(allVehicles);
      
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
  
  // API methods for getting data chunks
  
  // Get vehicles in a specific view bounds
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
  
  // Get RSUs in a specific view bounds
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
  
  // Get congestion data
  getCongestionData(): CongestionZone[] {
    return this.congestionZones;
  }
  
  // Get cluster stats
  getStats(): {
    totalVehicles: number;
    totalRSUs: number;
    clusters: number;
    segments: number;
    lastUpdated: Date;
  } {
    return {
      totalVehicles: this.vehicles.length,
      totalRSUs: this.rsus.length,
      clusters: this.clusters.size,
      segments: this.trafficData.segments.length,
      lastUpdated: new Date(this.lastFetched)
    };
  }
}

// Create and export singleton instance
export const trafficScaler = new TrafficScaler();

// Export helper functions
export const getScaledVehicles = (bounds?: any, zoomLevel?: number) => trafficScaler.getVehicles(bounds, zoomLevel);
export const getScaledRSUs = (bounds?: any) => trafficScaler.getRSUs(bounds);
export const getScaledCongestionData = () => trafficScaler.getCongestionData();
export const refreshScaledTrafficData = () => trafficScaler.fetchAndScaleTraffic();
export const getTrafficStats = () => trafficScaler.getStats();
