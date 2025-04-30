
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

let trustModel: tf.LayersModel | null = null;

// Initialize and load the trust scoring model
export const initTrustScoringModel = async (): Promise<boolean> => {
  try {
    console.log("Loading trust scoring model...");
    
    // For demonstration, we'll create a simple model
    if (!trustModel) {
      const model = tf.sequential();
      
      model.add(tf.layers.dense({
        inputShape: [5], // Features: anomaly count, speed compliance, historical trust, age, certification level
        units: 16,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid' // Output between 0-1 for trust score
      }));
      
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
      });
      
      trustModel = model;
      console.log("Trust scoring model initialized");
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing trust scoring model:", error);
    toast({
      title: "ML Model Error",
      description: "Failed to initialize trust scoring model",
      variant: "destructive",
    });
    return false;
  }
};

// Calculate trust score using ML model
export const calculateTrustScore = async (
  vehicleData: {
    vehicle_id: string;
    vehicle_type?: string;
    trust_score?: number;
  },
  anomalies: any[]
): Promise<{
  score: number;
  change: number;
  confidence: number;
}> => {
  try {
    if (!trustModel) {
      await initTrustScoringModel();
      if (!trustModel) throw new Error("Model not initialized");
    }
    
    // Get vehicle-specific anomalies
    const vehicleAnomalies = anomalies.filter(a => 
      a.vehicle_id === vehicleData.vehicle_id
    );
    
    // Extract features
    const anomalyCount = vehicleAnomalies.length;
    const speedCompliance = 0.9; // Would be calculated from real data
    const historicalTrust = vehicleData.trust_score ? vehicleData.trust_score / 100 : 0.7;
    const vehicleAge = Math.random(); // Simulated feature
    const certificationLevel = vehicleData.vehicle_type === 'ambulance' ? 1.0 : 
                              (vehicleData.vehicle_type === 'bus' ? 0.8 : 0.6);
    
    // Create tensor from features
    const input = tf.tensor2d([
      [
        Math.min(anomalyCount / 10, 1.0), // Normalized anomaly count
        speedCompliance,
        historicalTrust,
        vehicleAge,
        certificationLevel
      ]
    ]);
    
    // Get prediction
    const prediction = trustModel.predict(input) as tf.Tensor;
    const trustScore = (await prediction.data())[0];
    
    // Scale to 0-100
    const newScore = Math.min(100, Math.max(0, Math.round(trustScore * 100)));
    const oldScore = vehicleData.trust_score || 70;
    
    return {
      score: newScore,
      change: newScore - oldScore,
      confidence: 0.85 // Placeholder for model confidence
    };
  } catch (error) {
    console.error("Error calculating trust score:", error);
    // Return current trust score or default
    return {
      score: vehicleData.trust_score || 70,
      change: 0,
      confidence: 0
    };
  }
};

// Update trust scores for all vehicles
export const updateTrustScores = async (
  vehicles: any[],
  anomalies: any[]
): Promise<any[]> => {
  try {
    // Ensure model is loaded
    if (!trustModel) {
      await initTrustScoringModel();
    }
    
    // Update each vehicle with a new trust score
    return Promise.all(vehicles.map(async (vehicle) => {
      const trustResult = await calculateTrustScore(vehicle, anomalies);
      
      return {
        ...vehicle,
        trust_score: trustResult.score,
        trust_score_change: trustResult.change,
        trust_score_confidence: trustResult.confidence,
        last_updated: new Date().toISOString()
      };
    }));
  } catch (error) {
    console.error("Error updating trust scores with ML:", error);
    return vehicles;
  }
};
