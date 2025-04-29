
import { useState, useCallback, useEffect } from "react";
import { fetchVehicles, fetchRSUs, fetchCongestionData, fetchAnomalies } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const useMapData = (initialVehicles = [], initialRsus = [], initialCongestionData = [], initialLoading = false) => {
  // State for data
  const [vehicles, setVehicles] = useState<any[]>(initialVehicles);
  const [rsus, setRsus] = useState<any[]>(initialRsus);
  const [congestionData, setCongestionData] = useState<any[]>(initialCongestionData);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    console.log("Fetching map and dashboard data...");
    
    try {
      // Fetch vehicles data
      const vehiclesData = await fetchVehicles({ limit: 8500 });
      if (Array.isArray(vehiclesData)) {
        console.log(`Fetched ${vehiclesData.length} vehicles`);
        setVehicles(vehiclesData);
      }
      
      // Fetch RSUs data
      const rsusData = await fetchRSUs();
      if (Array.isArray(rsusData)) {
        console.log(`Fetched ${rsusData.length} RSUs`);
        setRsus(rsusData);
      }
      
      // Fetch congestion data
      const congestionData = await fetchCongestionData();
      if (Array.isArray(congestionData)) {
        console.log(`Fetched ${congestionData.length} congestion data points`);
        setCongestionData(congestionData);
      }
      
      // Fetch anomalies data
      const anomaliesData = await fetchAnomalies();
      if (Array.isArray(anomaliesData)) {
        console.log(`Fetched ${anomaliesData.length} anomalies`);
        setAnomalies(anomaliesData);
      }
      
      setLastUpdated(new Date());
      
      return true;
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "Could not fetch traffic data. Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
    
    // Set up periodic refresh (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  // Return both state and setter functions
  return { 
    vehicles, setVehicles, 
    rsus, setRsus, 
    congestionData, setCongestionData,
    anomalies, setAnomalies,
    isLoading, setIsLoading,
    lastUpdated, 
    fetchData 
  };
};
