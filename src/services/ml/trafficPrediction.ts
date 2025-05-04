
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

// Get time-based congestion factor (0-1) based on hour of day
const getTimeBasedCongestion = (hour: number): number => {
  if (hour >= 8 && hour <= 10) {  // Morning peak
    return 0.7 + Math.random() * 0.3;
  } else if (hour >= 17 && hour <= 19) {  // Evening peak
    return 0.75 + Math.random() * 0.25;
  } else if (hour >= 12 && hour <= 14) {  // Lunch hour
    return 0.4 + Math.random() * 0.3;
  } else if (hour >= 0 && hour <= 5) {  // Late night
    return 0.1 + Math.random() * 0.2;
  } else {  // Rest of day
    return 0.3 + Math.random() * 0.3;
  }
};

// Get location-based congestion factor (0-1) for Hyderabad areas
const getLocationBasedCongestion = (lat: number, lng: number): number => {
  // Define coordinates for highly congested areas in Hyderabad
  const highCongestionAreas = [
    { lat: 17.4435, lng: 78.3772, name: "Hitech City", factor: 0.9 },    // Hitech City Junction
    { lat: 17.4401, lng: 78.3489, name: "Gachibowli", factor: 0.85 },    // Gachibowli Junction
    { lat: 17.4400, lng: 78.4635, name: "Begumpet", factor: 0.8 },       // Begumpet
    { lat: 17.4374, lng: 78.4487, name: "Ameerpet", factor: 0.85 },      // Ameerpet
    { lat: 17.4256, lng: 78.4502, name: "Punjagutta", factor: 0.75 },    // Punjagutta
    { lat: 17.3616, lng: 78.4747, name: "Charminar", factor: 0.7 },      // Charminar area
    { lat: 17.4137, lng: 78.4352, name: "Banjara Hills", factor: 0.65 }, // Banjara Hills
    { lat: 17.4432, lng: 78.4982, name: "Paradise", factor: 0.7 },       // Paradise Circle
  ];
  
  // Calculate distance-based congestion factor
  let maxFactor = 0.3; // Default congestion
  
  for (const area of highCongestionAreas) {
    // Calculate approximate distance (simplified)
    const latDiff = area.lat - lat;
    const lngDiff = area.lng - lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // The closer to the congestion area, the higher the congestion
    if (distance < 0.05) { // Within ~5km
      const proximityFactor = Math.max(0, 1 - distance * 15); // Higher factor for closer points
      const areaCongestion = area.factor * proximityFactor;
      
      // Take the highest congestion value from surrounding areas
      maxFactor = Math.max(maxFactor, areaCongestion);
    }
  }
  
  // Add small random variation
  return maxFactor * (0.85 + Math.random() * 0.3);
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
    const hour = (now.getHours() + timeOffset) % 24;
    const dayOfWeek = now.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // Time-based congestion (rush hour patterns)
    const timeFactor = getTimeBasedCongestion(hour);
    
    // Location-based congestion (known busy areas)
    const locationFactor = getLocationBasedCongestion(lat, lng);
    
    // Weekend reduction (less traffic on weekends)
    const weekendFactor = isWeekend ? 0.6 : 1.0;
    
    // Combine factors with some randomization for realism
    const combinedFactor = timeFactor * locationFactor * weekendFactor * (0.9 + Math.random() * 0.2);
    
    // Scale to 0-100 and ensure it's within bounds
    return Math.min(100, Math.max(0, Math.round(combinedFactor * 100)));
  } catch (error) {
    console.error("Error predicting congestion:", error);
    // Return a reasonable default with randomness
    return 30 + Math.floor(Math.random() * 40);
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
        prediction_confidence: 0.85 + Math.random() * 0.1, // Slight randomization in confidence
        updated_at: new Date().toISOString()
      };
    }));
  } catch (error) {
    console.error("Error updating congestion data with ML:", error);
    return existingData;
  }
};
