
// Utility for creating optimized waypoints from route data
export const createOptimizedWaypoints = (
  optimizedRoute: google.maps.LatLngLiteral[] | null
): google.maps.DirectionsWaypoint[] => {
  if (!optimizedRoute || optimizedRoute.length === 0 || !window.google) {
    return [];
  }
  
  try {
    // Only use a reasonable number of waypoints (max 8) to avoid overloading the API
    // and to ensure we get a realistic route that the API can optimize
    const waypointCount = Math.min(optimizedRoute.length, 8);
    const step = optimizedRoute.length / waypointCount;
    
    const waypoints = [];
    for (let i = 0; i < waypointCount; i++) {
      const index = Math.floor(i * step);
      if (index < optimizedRoute.length) {
        const point = optimizedRoute[index];
        waypoints.push({
          location: new google.maps.LatLng(point.lat, point.lng),
          stopover: false
        });
      }
    }
    
    return waypoints;
  } catch (error) {
    console.error("Error creating waypoints:", error);
    return [];
  }
};
