
import { useState, useEffect, useCallback } from "react";
import { fetchVehicles, fetchCongestionData, fetchAnomalies, fetchRSUs, Vehicle } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useMLModels } from "./useMLModels";
import { 
  updateCongestionData,
  processVehiclesForAnomalies,
  updateTrustScores,
  optimizeRoute
} from "@/services/ml";

export const useMLSimulation = (initiallyRunning = false) => {
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(initiallyRunning);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [modelAccuracy, setModelAccuracy] = useState<'standard' | 'high' | 'experimental'>('standard');
  const [optimizedRouteParams, setOptimizedRouteParams] = useState<{
    waypoints: google.maps.DirectionsWaypoint[];
    routePreference: google.maps.TravelMode;
    avoidances: google.maps.DirectionsRoutePreference[];
    optimizationConfidence: number;
  } | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<google.maps.LatLngLiteral[] | null>(null);
  
  // Use our ML models hook
  const { isModelLoading, modelsLoaded, modelLoadingProgress } = useMLModels();

  // Determine update intervals based on model accuracy
  const getIntervals = useCallback(() => {
    const accuracyMultipliers = {
      'standard': 1,
      'high': 1.5,
      'experimental': 2
    };
    const multiplier = accuracyMultipliers[modelAccuracy];
    
    return {
      vehicles: 5000 * multiplier, // 5 seconds normally
      congestion: 60000 * multiplier, // 1 minute normally
      anomalies: 30000 * multiplier, // 30 seconds normally
      rsus: 45000 * multiplier, // 45 seconds normally
      modelUpdate: 120000 * multiplier // 2 minutes normally
    };
  }, [modelAccuracy]);

  // Toggle live monitoring
  const toggleLiveMonitoring = () => {
    if (!isModelLoading) {
      setIsLiveMonitoring(prev => !prev);
      toast({
        title: !isLiveMonitoring ? "Live Monitoring Started" : "Live Monitoring Paused",
        description: !isLiveMonitoring ? 
          "ML-powered traffic analysis and prediction active." : 
          "Real-time analysis paused.",
      });
    } else {
      toast({
        title: "Models Still Loading",
        description: "Please wait for ML models to finish loading before starting monitoring.",
      });
    }
  };

  // Change model accuracy
  const changeModelAccuracy = (accuracy: 'standard' | 'high' | 'experimental') => {
    setModelAccuracy(accuracy);
    toast({
      title: `ML Model Accuracy: ${accuracy.toUpperCase()}`,
      description: `Analysis depth and prediction confidence adjusted to ${accuracy} level.`
    });
  };

  // Handle ambulance selection for routing
  const handleAmbulanceSelect = (ambulance: Vehicle) => {
    setSelectedAmbulance(ambulance);
    toast({
      title: "Emergency Vehicle Selected",
      description: "Click on the map to set a destination for ML-optimized routing.",
    });
  };

  // Handle destination selection for ML-optimized routing
  const handleDestinationSelect = async (latLng: google.maps.LatLngLiteral, congestionData: any[] = []) => {
    if (selectedAmbulance) {
      setDestination(latLng);
      
      // Get optimized route if models are loaded
      if (modelsLoaded) {
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
            setOptimizedRoute([]);
          }
        } catch (error) {
          console.error("Error optimizing route:", error);
          setOptimizedRouteParams(null);
          setOptimizedRoute(null);
        }
      } else {
        toast({
          title: "Standard Route Calculation",
          description: "ML models not fully loaded. Using standard route calculation.",
        });
      }
    }
  };

  // Reset routing
  const resetRouting = () => {
    setSelectedAmbulance(null);
    setDestination(null);
    setOptimizedRoute(null);
    setOptimizedRouteParams(null);
  };

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
    getIntervals,
    toggleLiveMonitoring,
    changeModelAccuracy,
    handleAmbulanceSelect,
    handleDestinationSelect,
    resetRouting,
    setIsLiveMonitoring
  };
};
