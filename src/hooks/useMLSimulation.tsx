
import { useState, useEffect, useCallback } from "react";
import { Vehicle } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useMLModels } from "./useMLModels";
import { optimizeRoute } from "@/services/ml";

export const useMLSimulation = (initiallyRunning = false) => {
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(initiallyRunning);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [modelAccuracy, setModelAccuracy] = useState<'standard' | 'high' | 'experimental'>('standard');
  const [optimizedRouteParams, setOptimizedRouteParams] = useState<{
    waypoints: google.maps.DirectionsWaypoint[];
    routePreference: google.maps.TravelMode;
    avoidances: string[];
    optimizationConfidence: number;
  } | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [currentCongestionData, setCurrentCongestionData] = useState<any[]>([]);
  
  // Use our ML models hook with lazy loading enabled
  const { 
    isModelLoading, 
    modelsLoaded, 
    modelLoadingProgress, 
    loadModelsByType 
  } = useMLModels(false); // Do not load models immediately

  // Determine update intervals based on model accuracy
  const getIntervals = useCallback(() => {
    const accuracyMultipliers = {
      'standard': 1,
      'high': 1.5,
      'experimental': 2
    };
    const multiplier = accuracyMultipliers[modelAccuracy];
    
    // Increase base intervals to reduce load
    return {
      vehicles: 10000 * multiplier, // 10 seconds normally (was 5)
      congestion: 120000 * multiplier, // 2 minutes normally (was 1)
      anomalies: 60000 * multiplier, // 1 minute normally (was 30s)
      rsus: 90000 * multiplier, // 1.5 minutes normally (was 45s)
      modelUpdate: 180000 * multiplier // 3 minutes normally (was 2)
    };
  }, [modelAccuracy]);

  // Toggle live monitoring
  const toggleLiveMonitoring = useCallback(() => {
    // Only allow toggling if not in the middle of loading models
    if (!isModelLoading) {
      const newState = !isLiveMonitoring;
      setIsLiveMonitoring(newState);
      
      // If turning on monitoring, load models
      if (newState && !modelsLoaded) {
        // Start by loading traffic prediction model first
        loadModelsByType(['traffic']).then(success => {
          if (success) {
            toast({
              title: "Initial ML Model Loaded",
              description: "Traffic prediction model is now active. Other models will load as needed.",
            });
          }
        });
      }
      
      toast({
        title: newState ? "Live Monitoring Started" : "Live Monitoring Paused",
        description: newState ? 
          "ML-powered traffic analysis and prediction active." : 
          "Real-time analysis paused.",
      });
    } else {
      toast({
        title: "Models Still Loading",
        description: "Please wait for ML models to finish loading before starting monitoring.",
      });
    }
  }, [isModelLoading, isLiveMonitoring, modelsLoaded, loadModelsByType]);

  // Change model accuracy
  const changeModelAccuracy = useCallback((accuracy: 'standard' | 'high' | 'experimental') => {
    if (accuracy === modelAccuracy) return;
    
    setModelAccuracy(accuracy);
    
    toast({
      title: `ML Model Accuracy: ${accuracy.toUpperCase()}`,
      description: `Analysis depth and prediction confidence adjusted to ${accuracy} level.`
    });
  }, [modelAccuracy]);

  // Handle ambulance selection for routing
  const handleAmbulanceSelect = useCallback((ambulance: Vehicle) => {
    setSelectedAmbulance(ambulance);
    
    toast({
      title: "Emergency Vehicle Selected",
      description: "Click on the map to set a destination for ML-optimized routing.",
    });
  }, []);

  // Handle destination selection for ML-optimized routing
  const handleDestinationSelect = useCallback(async (latLng: google.maps.LatLngLiteral, congestionData: any[] = []) => {
    if (!selectedAmbulance) return;
    
    setDestination(latLng);
    setCurrentCongestionData(congestionData);
    
    // Load route optimization model if needed
    if (!modelsLoaded) {
      toast({
        title: "Loading Route Optimization Model",
        description: "Please wait while we load the route optimization model.",
      });
      
      const success = await loadModelsByType(['route']);
      if (!success) {
        toast({
          title: "Model Loading Failed",
          description: "Using standard Google Maps routing as fallback.",
          variant: "destructive",
        });
        return;
      }
    }
    
    toast({
      title: "Calculating ML-Optimized Route",
      description: "Analyzing traffic patterns and congestion for optimal emergency routing.",
    });
    
    try {
      const origin = { 
        lat: selectedAmbulance.lat || 0, 
        lng: selectedAmbulance.lng || 0 
      };
      
      const routeResult = await optimizeRoute(origin, latLng, 1.0, congestionData);
      setOptimizedRouteParams(routeResult);
      
      if (routeResult.waypoints && routeResult.waypoints.length > 0) {
        // Extract coordinates from waypoints for visualization
        const waypointCoords = routeResult.waypoints.map(wp => {
          const location = wp.location as google.maps.LatLng;
          return { 
            lat: location.lat(), 
            lng: location.lng() 
          };
        });
        setOptimizedRoute(waypointCoords);
        
        toast({
          title: "ML-Optimized Route Calculated",
          description: `Route optimized with ${Math.round(routeResult.optimizationConfidence * 100)}% confidence.`,
        });
      } else {
        // Even with no waypoints, we still need to set an optimized route to trigger the directions API
        setOptimizedRoute([]);
        toast({
          title: "Standard Route Calculated",
          description: "No congestion detected. Using standard routing.",
        });
      }
    } catch (error) {
      console.error("Error optimizing route:", error);
      setOptimizedRouteParams(null);
      setOptimizedRoute([]);
      toast({
        title: "Routing Error",
        description: "Using standard Google Maps routing as fallback.",
        variant: "destructive",
      });
    }
  }, [selectedAmbulance, modelsLoaded, loadModelsByType]);

  // Reset routing
  const resetRouting = useCallback(() => {
    setSelectedAmbulance(null);
    setDestination(null);
    setOptimizedRoute(null);
    setOptimizedRouteParams(null);
    setCurrentCongestionData([]);
  }, []);

  return {
    isLiveMonitoring,
    selectedAmbulance,
    destination,
    modelAccuracy,
    optimizedRoute,
    optimizedRouteParams,
    isModelLoading,
    modelsLoaded,
    modelLoadingProgress,
    loadModelsByType,
    getIntervals,
    toggleLiveMonitoring,
    changeModelAccuracy,
    handleAmbulanceSelect,
    handleDestinationSelect,
    resetRouting,
    setIsLiveMonitoring
  };
};
