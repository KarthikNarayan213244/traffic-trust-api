
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

let trafficModel: tf.LayersModel | null = null;

// Initialize and load the traffic prediction model
export const initTrafficPredictionModel = async (): Promise<boolean> => {
  try {
    console.log("Loading traffic prediction model...");
    
    // For demonstration, we'll create a simple model
    // In production, you would load a pre-trained model
    if (!trafficModel) {
      // Simple sequential model for time series prediction
      const model = tf.sequential();
      
      model.add(tf.layers.dense({
        inputShape: [5], // Input features: time, day, location (lat/lng), historical congestion
        units: 32,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 16,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid' // Output between 0-1 for congestion level
      }));
      
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
      });
      
      trafficModel = model;
      console.log("Traffic prediction model initialized");
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing traffic prediction model:", error);
    toast({
      title: "ML Model Error",
      description: "Failed to initialize traffic prediction model",
      variant: "destructive",
    });
    return false;
  }
};

// Predict congestion levels for a given location and time
export const predictCongestion = async (
  lat: number, 
  lng: number, 
  timeOffset: number = 0 // Hours into future
): Promise<number> => {
  try {
    if (!trafficModel) {
      await initTrafficPredictionModel();
      if (!trafficModel) throw new Error("Model not initialized");
    }
    
    // Get current time features
    const now = new Date();
    const hourOfDay = (now.getHours() + timeOffset) % 24;
    const dayOfWeek = now.getDay();
    
    // Create tensor from features
    const input = tf.tensor2d([
      [
        hourOfDay / 24, // Normalized hour of day
        dayOfWeek / 7, // Normalized day of week
        lat,
        lng,
        0.5, // Historical congestion baseline (normalized)
      ]
    ]);
    
    // Get prediction
    const prediction = trafficModel.predict(input) as tf.Tensor;
    const congestionLevel = (await prediction.data())[0];
    
    // Scale to 0-100
    return Math.min(100, Math.max(0, Math.round(congestionLevel * 100)));
  } catch (error) {
    console.error("Error predicting congestion:", error);
    // Return a reasonable default
    return 50;
  }
};

// Update congestion data using the ML model
export const updateCongestionData = async (
  existingData: any[]
): Promise<any[]> => {
  try {
    // Ensure model is loaded
    if (!trafficModel) {
      await initTrafficPredictionModel();
    }
    
    // Update each congestion zone with a prediction
    return Promise.all(existingData.map(async (zone) => {
      // Get prediction for this zone
      const predictedLevel = await predictCongestion(zone.lat, zone.lng);
      
      return {
        ...zone,
        congestion_level: predictedLevel,
        is_predicted: true,
        prediction_confidence: 0.85, // Placeholder for model confidence
        updated_at: new Date().toISOString()
      };
    }));
  } catch (error) {
    console.error("Error updating congestion data with ML:", error);
    return existingData;
  }
};
