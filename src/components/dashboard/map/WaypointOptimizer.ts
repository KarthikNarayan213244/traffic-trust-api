
// Create optimized waypoints based on origin, destination, and congestion data
export const createOptimizedWaypoints = (
  origin: google.maps.LatLngLiteral, 
  destination: google.maps.LatLngLiteral,
  congestionData: any[] = []
): google.maps.DirectionsWaypoint[] => {
  // Simple implementation - create 1-3 waypoints to avoid high congestion areas
  const waypoints: google.maps.DirectionsWaypoint[] = [];
  
  // If we don't have congestion data, return empty waypoints
  if (!congestionData || congestionData.length === 0) {
    return waypoints;
  }
  
  try {
    // Get direction from origin to destination
    const bearing = calculateBearing(origin, destination);
    
    // Find congestion zones along the route
    const relevantCongestion = congestionData
      .filter(zone => isBetweenPoints(zone, origin, destination, 0.1))
      .filter(zone => zone.congestion_level > 70) // Only consider high congestion
      .sort((a, b) => b.congestion_level - a.congestion_level);
    
    // Take up to 2 highest congestion zones to avoid
    const avoidZones = relevantCongestion.slice(0, 2);
    
    // For each zone, create a waypoint that avoids it
    avoidZones.forEach(zone => {
      // Create a point perpendicular to the route to avoid the congestion
      const avoidPoint = createAvoidancePoint(
        { lat: zone.lat, lng: zone.lng },
        bearing,
        zone.congestion_level / 1000 // Distance based on congestion severity
      );
      
      waypoints.push({
        location: new google.maps.LatLng(avoidPoint.lat, avoidPoint.lng),
        stopover: false
      });
    });
    
    return waypoints;
  } catch (error) {
    console.error("Error creating optimized waypoints:", error);
    return [];
  }
};

// Helper function to calculate bearing between two points
function calculateBearing(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral): number {
  const startLat = start.lat * Math.PI / 180;
  const startLng = start.lng * Math.PI / 180;
  const endLat = end.lat * Math.PI / 180;
  const endLng = end.lng * Math.PI / 180;
  
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

// Helper function to check if a point is between start and end points
function isBetweenPoints(
  point: { lat: number, lng: number },
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral,
  tolerance: number
): boolean {
  // Simple check if point is in the bounding box with tolerance
  const minLat = Math.min(start.lat, end.lat) - tolerance;
  const maxLat = Math.max(start.lat, end.lat) + tolerance;
  const minLng = Math.min(start.lng, end.lng) - tolerance;
  const maxLng = Math.max(start.lng, end.lng) + tolerance;
  
  return point.lat >= minLat && point.lat <= maxLat && 
         point.lng >= minLng && point.lng <= maxLng;
}

// Create a point that avoids a congestion zone
function createAvoidancePoint(
  point: google.maps.LatLngLiteral,
  routeBearing: number,
  distance: number
): google.maps.LatLngLiteral {
  // Create a point perpendicular to the route
  const perpBearing = (routeBearing + 90) % 360;
  return movePoint(point, perpBearing, distance);
}

// Move a point by distance in the direction of bearing
function movePoint(
  point: google.maps.LatLngLiteral,
  bearing: number,
  distance: number
): google.maps.LatLngLiteral {
  const R = 6378.1; // Earth radius in km
  
  const bearingRad = bearing * Math.PI / 180;
  const lat1 = point.lat * Math.PI / 180;
  const lng1 = point.lng * Math.PI / 180;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
    Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI
  };
}
