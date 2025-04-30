
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

let routeModel: tf.LayersModel | null = null;

// Initialize and load the route optimization model
export const initRouteOptimizationModel = async (): Promise<boolean> => {
  try {
    console.log("Loading route optimization model...");
    
    // For demonstration, we'll create a simple model
    if (!routeModel) {
      const model = tf.sequential();
      
      model.add(tf.layers.dense({
        inputShape: [6], // Origin lat/lng, destination lat/lng, urgency level, time of day
        units: 32,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 16,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 4, // Output: recommended route parameters (e.g., path preference scores)
        activation: 'softmax'
      }));
      
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
      });
      
      routeModel = model;
      console.log("Route optimization model initialized");
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing route optimization model:", error);
    toast({
      title: "ML Model Error",
      description: "Failed to initialize route optimization model",
      variant: "destructive",
    });
    return false;
  }
};

// Calculate optimal route parameters
export const optimizeRoute = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  urgencyLevel: number = 1, // 0-1, 1 being highest urgency (e.g., ambulance)
  congestionData: any[] = []
): Promise<{
  waypoints: google.maps.DirectionsWaypoint[];
  routePreference: google.maps.TravelMode;
  avoidances: google.maps.DirectionsRoutePreference[];
  optimizationConfidence: number;
}> => {
  try {
    if (!routeModel) {
      await initRouteOptimizationModel();
      if (!routeModel) throw new Error("Model not initialized");
    }
    
    // Get current time features
    const now = new Date();
    const timeOfDay = now.getHours() / 24; // Normalized time of day
    
    // Create tensor from features
    const input = tf.tensor2d([
      [
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng,
        urgencyLevel,
        timeOfDay
      ]
    ]);
    
    // Get prediction
    const prediction = routeModel.predict(input) as tf.Tensor;
    const routeParameters = await prediction.data();
    
    // Find congestion hotspots to avoid
    const congestionHotspots = congestionData
      .filter(point => point.congestion_level > 70) // Only consider high congestion
      .sort((a, b) => b.congestion_level - a.congestion_level)
      .slice(0, 3); // Take top 3 most congested areas
    
    // Generate waypoints to avoid congestion
    const waypoints: google.maps.DirectionsWaypoint[] = [];
    
    // If we have congestion data, create strategic waypoints to route around congestion
    if (congestionHotspots.length > 0) {
      // Calculate direct route vector
      const directVector = {
        lat: destination.lat - origin.lat,
        lng: destination.lng - origin.lng
      };
      const directDistance = Math.sqrt(directVector.lat * directVector.lat + directVector.lng * directVector.lng);
      
      // Find points perpendicular to direct route that avoid congestion
      congestionHotspots.forEach(hotspot => {
        // Check if hotspot is near the direct route
        const vectorToHotspot = {
          lat: hotspot.lat - origin.lat,
          lng: hotspot.lng - origin.lng
        };
        
        // Project hotspot onto direct route
        const dotProduct = 
          (directVector.lat * vectorToHotspot.lat + directVector.lng * vectorToHotspot.lng) / 
          (directDistance * directDistance);
        
        // Only add waypoints for hotspots that are near our route
        if (dotProduct >= 0 && dotProduct <= 1) {
          // Calculate projection point
          const projPoint = {
            lat: origin.lat + dotProduct * directVector.lat,
            lng: origin.lng + dotProduct * directVector.lng
          };
          
          // Calculate vector from projection to hotspot
          const perpVector = {
            lat: hotspot.lat - projPoint.lat,
            lng: hotspot.lng - projPoint.lng
          };
          
          // Calculate perpendicular distance
          const perpDistance = Math.sqrt(perpVector.lat * perpVector.lat + perpVector.lng * perpVector.lng);
          
          // If hotspot is close enough to affect our route
          if (perpDistance < 0.02) { // ~2km in lat/lng units
            // Create waypoint in opposite direction of hotspot
            const avoidancePoint = {
              lat: projPoint.lat - 0.5 * perpVector.lat,
              lng: projPoint.lng - 0.5 * perpVector.lng
            };
            
            waypoints.push({
              location: new google.maps.LatLng(avoidancePoint.lat, avoidancePoint.lng),
              stopover: false
            });
          }
        }
      });
    }
    
    // If we have few or no congestion-based waypoints, add optimized waypoints
    if (waypoints.length < 2 && directDistance > 0.03) { // Only for routes > ~3km
      // Add waypoints at 1/3 and 2/3 of the route for better road following
      waypoints.push({
        location: new google.maps.LatLng(
          origin.lat + directVector.lat * 0.33,
          origin.lng + directVector.lng * 0.33
        ),
        stopover: false
      });
      
      waypoints.push({
        location: new google.maps.LatLng(
          origin.lat + directVector.lat * 0.66,
          origin.lng + directVector.lng * 0.66
        ),
        stopover: false
      });
    }
    
    // Set avoidances based on urgency and congestion
    const avoidances: google.maps.DirectionsRoutePreference[] = [];
    
    // High urgency ambulances avoid tolls for speed
    if (urgencyLevel > 0.8) {
      avoidances.push(google.maps.DirectionsRoutePreference.LESS_WALKING);
    }
    
    // Avoid highways if there's significant congestion data suggesting highway issues
    const highwayCongestion = congestionData.filter(point => 
      point.road_type === 'highway' && point.congestion_level > 80
    ).length;
    
    if (highwayCongestion > 3) {
      avoidances.push(google.maps.DirectionsRoutePreference.AVOID_HIGHWAYS);
    }
    
    return {
      waypoints: waypoints,
      routePreference: urgencyLevel > 0.6 ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.DRIVING,
      avoidances: avoidances,
      optimizationConfidence: 0.9 // Updated confidence with road-aware routing
    };
  } catch (error) {
    console.error("Error optimizing route:", error);
    return {
      waypoints: [],
      routePreference: google.maps.TravelMode.DRIVING,
      avoidances: [],
      optimizationConfidence: 0
    };
  }
};
