
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { initAnomalyDetectionModel, processVehiclesForAnomalies } from "./anomalyDetection";
import { initTrafficPredictionModel } from "./trafficPrediction";
import { initTrustScoringModel } from "./trustScoring";
import { initRouteOptimizationModel } from "./routeOptimization";

// Re-export initialization functions
export { 
  initAnomalyDetectionModel, 
  initTrafficPredictionModel,
  initTrustScoringModel,
  initRouteOptimizationModel
};

// Use for all ML model interactions
export async function callMLInference(action: string, data: any) {
  try {
    const { data: response, error } = await supabase.functions.invoke("ml-inference", {
      body: { action, data }
    });
    
    if (error) throw error;
    return response;
  } catch (error) {
    console.error(`ML inference error (${action}):`, error);
    return null;
  }
}

// Initialize all ML models - this now just checks connectivity to our ML function
export async function initMLModels() {
  try {
    const testResponse = await callMLInference("predict_congestion", { 
      zones: [{ id: "test", congestion_level: 50 }],
      persist: false
    });
    
    return !!testResponse;
  } catch (error) {
    console.error("ML models initialization error:", error);
    return false;
  }
}

// Traffic prediction model now calls the edge function
export async function updateCongestionData(congestionData: any[]) {
  try {
    // If no data to update, return original
    if (!congestionData || congestionData.length === 0) return congestionData;
    
    const response = await callMLInference("predict_congestion", {
      zones: congestionData,
      persist: true
    });
    
    if (!response?.predictions) return congestionData;
    
    // Update the congestion data with predictions
    return congestionData.map(zone => {
      const prediction = response.predictions.find((p: any) => 
        p.zone_id === zone.id || p.zone_id === zone.zone_id
      );
      
      if (prediction) {
        return {
          ...zone,
          congestion_level: prediction.predicted_congestion,
          predicted_by_ml: true,
          ml_confidence: prediction.confidence
        };
      }
      
      return zone;
    });
  } catch (error) {
    console.error("Error updating congestion data with ML:", error);
    return congestionData;
  }
}

// Anomaly detection now calls the edge function
export async function processVehiclesForAnomalies(vehicles: any[]) {
  try {
    if (!vehicles || vehicles.length === 0) return [];
    
    const response = await callMLInference("detect_anomalies", {
      vehicles,
      persist: true
    });
    
    if (!response?.anomalies) return [];
    
    return response.anomalies;
  } catch (error) {
    console.error("Error detecting anomalies with ML:", error);
    return [];
  }
}

// Trust scoring now calls the edge function
export async function updateTrustScores(vehicles: any[], anomalies: any[]) {
  try {
    if (!vehicles || vehicles.length === 0) return vehicles;
    
    const response = await callMLInference("calculate_trust", {
      vehicles,
      anomalies,
      persist: true
    });
    
    if (!response?.trust_scores) return vehicles;
    
    // Update vehicles with new trust scores
    return vehicles.map(vehicle => {
      const trustUpdate = response.trust_scores.find((t: any) => 
        t.vehicle_id === vehicle.vehicle_id
      );
      
      if (trustUpdate) {
        return {
          ...vehicle,
          trust_score: trustUpdate.new_score,
          trust_score_change: trustUpdate.change,
          trust_score_confidence: trustUpdate.confidence
        };
      }
      
      return vehicle;
    });
  } catch (error) {
    console.error("Error updating trust scores with ML:", error);
    return vehicles;
  }
}

// Route optimization now calls the edge function
export async function optimizeRoute(
  origin: google.maps.LatLngLiteral, 
  destination: google.maps.LatLngLiteral,
  optimization_level: number = 1.0,
  congestion_data: any[] = []
) {
  try {
    if (!origin || !destination) {
      throw new Error("Origin and destination are required");
    }
    
    const response = await callMLInference("optimize_route", {
      origin,
      destination,
      optimization_level,
      congestion_data
    });
    
    if (!response) {
      throw new Error("Failed to get route optimization");
    }
    
    return {
      waypoints: response.waypoints || [],
      routePreference: response.travel_mode,
      avoidances: response.avoidances || [],
      optimizationConfidence: response.optimization_confidence || 0.5
    };
  } catch (error) {
    console.error("Error optimizing route with ML:", error);
    // Return default route (no waypoints)
    return {
      waypoints: [],
      routePreference: google.maps.TravelMode.DRIVING,
      avoidances: [],
      optimizationConfidence: 0
    };
  }
}
