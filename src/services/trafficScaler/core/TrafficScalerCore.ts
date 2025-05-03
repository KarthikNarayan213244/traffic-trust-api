
import { Vehicle, RSU, CongestionZone } from '@/services/api/types';
import { toast } from '@/hooks/use-toast';
import { 
  TrafficData, 
  TrafficStats
} from '../types';
import { CONFIG } from '../config';
import { fetchTrafficData } from './fetchTrafficData';
import { createVehicleIndex, filterVehiclesByBounds } from './vehicleFiltering';
import { generateRSUs, distributeVehicles } from '../generators';

/**
 * Core class to handle traffic scaling functionality
 */
export class TrafficScalerCore {
  protected vehicles: Vehicle[] = [];
  protected rsus: RSU[] = [];
  protected congestionZones: CongestionZone[] = [];
  protected incidents: any[] = [];
  protected trafficData: TrafficData = { segments: [], totalLength: 0, totalVehicles: 0 };
  
  // Cache timestamp
  protected lastFetched: number = 0;
  
  // Spatial index for vehicles
  protected vehicleIndex: Map<string, Vehicle[]> = new Map();
  
  constructor() {
    console.log(`Initializing TrafficScaler with target of ${CONFIG.VEHICLE_TARGET.toLocaleString()} vehicles`);
  }
  
  /**
   * Get traffic statistics
   */
  getStats(): TrafficStats {
    return {
      totalVehicles: this.vehicles.length,
      totalRSUs: this.rsus.length,
      clusters: this.vehicleIndex.size,
      segments: this.trafficData.segments.length,
      lastUpdated: new Date(this.lastFetched)
    };
  }
  
  /**
   * Get congestion data
   */
  getCongestionData(): CongestionZone[] {
    return this.congestionZones;
  }
}
