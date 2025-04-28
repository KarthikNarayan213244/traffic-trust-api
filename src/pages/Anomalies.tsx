
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DataTable from "@/components/dashboard/DataTable";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import { fetchAnomalies } from "@/services/api";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Anomalies: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await fetchAnomalies();
      setAnomalies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching anomalies:", error);
      setIsError(true);
      toast({
        title: "Error",
        description: "Failed to load anomaly data. Please try again.",
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
          <h1 className="text-2xl font-bold">Anomalies</h1>
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
            <p className="text-red-800">Failed to load anomaly data</p>
            <Button variant="outline" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <AnomalyChart data={anomalies} isLoading={isLoading} />
            
            <DataTable 
              columns={["id", "timestamp", "type", "severity", "vehicle_id"]}
              data={anomalies}
              isLoading={isLoading}
              title="Detected Anomalies"
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Anomalies;
