
import { TrafficScaler } from './TrafficScaler';
import { TrafficStats } from './types';

// Create and export singleton instance
export const trafficScaler = new TrafficScaler();

// Export helper functions
export const getScaledVehicles = (bounds?: any, zoomLevel?: number) => trafficScaler.getVehicles(bounds, zoomLevel);
export const getScaledRSUs = (bounds?: any) => trafficScaler.getRSUs(bounds);
export const getScaledCongestionData = () => trafficScaler.getCongestionData();
export const refreshScaledTrafficData = () => trafficScaler.fetchAndScaleTraffic();
export const getTrafficStats = () => trafficScaler.getStats();

// Re-export the types
export * from './types';
