
// Helper function to generate a marker color based on trust score
export const getTrustScoreColor = (score: number) => {
  if (score >= 90) return "green";
  if (score >= 70) return "yellow";
  if (score >= 50) return "orange";
  return "red";
};

// Helper function to generate a congestion level color
export const getCongestionColor = (level: number) => {
  if (level < 30) return "green";
  if (level < 60) return "yellow";
  if (level < 80) return "orange";
  return "red";
};

// Helper function to format timestamps for display
export const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid date";
  }
};

// Helper function to get a color based on anomaly severity
export const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return "#EF4444"; // Red
    case 'high':
      return "#F59E0B"; // Amber
    case 'medium':
      return "#3B82F6"; // Blue
    case 'low':
      return "#10B981"; // Green
    default:
      return "#6B7280"; // Gray
  }
};

// Helper function to generate realistic movement patterns
export const calculateNewPosition = (
  lat: number, 
  lng: number, 
  speed: number, 
  heading: number,
  timestamp: number
): { lat: number, lng: number } => {
  // Convert speed from km/h to degrees/second
  // Approximation: 1 degree is about 111 km
  const speedDegPerHour = speed / 111;
  const speedDegPerSecond = speedDegPerHour / 3600;
  
  // Convert heading to radians
  const headingRad = heading * Math.PI / 180;
  
  // Calculate movement in degrees
  // We use timestamp to ensure movement is consistent with time
  const moveTime = timestamp / 1000; // Convert to seconds
  const latChange = Math.cos(headingRad) * speedDegPerSecond * moveTime;
  const lngChange = Math.sin(headingRad) * speedDegPerSecond * moveTime;
  
  return {
    lat: lat + latChange,
    lng: lng + lngChange
  };
};
