
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
      const vehiclesData = await fetchVehicles();
      setVehicles(vehiclesData);
      
      // Fetch RSUs data
      const rsusData = await fetchRSUs();
      setRsus(rsusData);
      
      // Fetch congestion data
      const congestionData = await fetchCongestionData();
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
  }, [fetchData]);

  return { vehicles, rsus, congestionData, isLoading, fetchData };
};
