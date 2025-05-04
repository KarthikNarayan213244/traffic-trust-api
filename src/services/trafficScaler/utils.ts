
// Utility functions for traffic scaling

/**
 * Convert degrees to radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Calculate distance between two points in km using Haversine formula
 */
export function getDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;
  return distance;
}

/**
 * Calculate heading based on two coordinates
 */
export function calculateHeading(startLat: number, startLng: number, endLat: number, endLng: number): number {
  return Math.atan2(endLat - startLat, endLng - startLng) * (180 / Math.PI);
}

/**
 * Generate a unique ID with a prefix
 */
export function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).substring(4)}-${Math.random().toString(36).substring(2, 6)}`;
}
