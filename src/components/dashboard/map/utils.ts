
// Get color based on trust score
export const getTrustScoreColor = (score?: number): string => {
  // Default score if none provided
  const trustScore = score !== undefined ? score : 75;
  
  // High trust (85-100): Ocean Blue
  if (trustScore >= 85) {
    return '#0EA5E9'; // Ocean Blue for high trust
  } 
  // Medium trust (70-84): Vivid Purple
  else if (trustScore >= 70) {
    return '#8B5CF6'; // Vivid Purple for medium trust
  } 
  // Low trust (0-69): Red
  else {
    return '#ea384c'; // Red for low trust
  }
};

// Map style utilities
export const getVehicleSize = (zoomLevel: number, vehicleType?: string, isSelected: boolean = false): number => {
  // Base size scales with zoom level
  const baseSize = Math.max(1.5, Math.min(6, zoomLevel - 8));
  
  if (isSelected) return baseSize * 1.8;
  
  switch (vehicleType?.toLowerCase()) {
    case 'truck': return baseSize * 1.2;
    case 'bus': return baseSize * 1.3;
    case 'ambulance': return baseSize * 1.5;
    case 'two-wheeler': return baseSize * 0.7;
    default: return baseSize;
  }
};

// Clustering configuration for large numbers of vehicles
export const getClusteringOptions = (zoomLevel: number) => {
  return {
    radius: Math.max(40, 100 - zoomLevel * 3), // Radius decreases as zoom increases
    maxZoom: 16,
    minPoints: zoomLevel < 12 ? 5 : zoomLevel < 14 ? 3 : 2
  };
};

// Format timestamp to human-readable string (needed for compatibility)
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return 'Invalid time';
  }
};
