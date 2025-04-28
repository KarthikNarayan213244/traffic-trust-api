
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DataTable from "@/components/dashboard/DataTable";
import { fetchVehicles } from "@/services/api";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Vehicles: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await fetchVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setIsError(true);
      toast({
        title: "Error",
        description: "Failed to load vehicle data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
        
        {isError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex flex-col items-center justify-center space-y-3">
            <p className="text-red-800">Failed to load vehicle data</p>
            <Button variant="outline" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        ) : (
          <DataTable 
            columns={["vehicle_id", "owner_name", "vehicle_type", "trust_score"]}
            data={vehicles}
            isLoading={isLoading}
            title="Registered Vehicles"
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Vehicles;
