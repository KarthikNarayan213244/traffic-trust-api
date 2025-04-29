
import { useState, useCallback, useEffect } from "react";
import { fetchVehicles, fetchRSUs, fetchCongestionData } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const useMapData = (initialVehicles = [], initialRsus = [], initialCongestionData = [], initialLoading = false) => {
  // State for data
  const [vehicles, setVehicles] = useState<any[]>(initialVehicles);
  const [rsus, setRsus] = useState<any[]>(initialRsus);
  const [congestionData, setCongestionData] = useState<any[]>(initialCongestionData);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch vehicles data
      const vehiclesData = await fetchVehicles({ limit: 1000 });
      console.log(`Loaded ${vehiclesData?.length || 0} vehicles`);
      setVehicles(vehiclesData);
      
      // Fetch RSUs data
      const rsusData = await fetchRSUs({ limit: 100 });
      console.log(`Loaded ${rsusData?.length || 0} RSUs`);
      setRsus(rsusData);
      
      // Fetch congestion data
      const congestionData = await fetchCongestionData({ limit: 500 });
      console.log(`Loaded ${congestionData?.length || 0} congestion data points`);
      setCongestionData(congestionData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "Could not fetch traffic data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
    
    // Set up a refresh interval for data
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // Refresh every minute
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  // Return both state and setter functions
  return { 
    vehicles, setVehicles, 
    rsus, setRsus, 
    congestionData, setCongestionData, 
    isLoading, setIsLoading,
    fetchData 
  };
};
