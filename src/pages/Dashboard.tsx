
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficMap from "@/components/dashboard/TrafficMap";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Radio, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchVehicles, fetchRSUs, fetchAnomalies, fetchTrustLedger } from "@/services/api";

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [rsus, setRsus] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [trustLedger, setTrustLedger] = useState<any[]>([]);

  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      // We use Promise.allSettled to continue even if some requests fail
      const [vehiclesResult, rsusResult, anomaliesResult, trustResult] = 
        await Promise.allSettled([
          fetchVehicles(),
          fetchRSUs(),
          fetchAnomalies(),
          fetchTrustLedger()
        ]);
      
      // Handle each result individually
      if (vehiclesResult.status === 'fulfilled') {
        setVehicles(Array.isArray(vehiclesResult.value) ? vehiclesResult.value : []);
      }
      
      if (rsusResult.status === 'fulfilled') {
        setRsus(Array.isArray(rsusResult.value) ? rsusResult.value : []);
      }
      
      if (anomaliesResult.status === 'fulfilled') {
        setAnomalies(Array.isArray(anomaliesResult.value) ? anomaliesResult.value : []);
      }
      
      if (trustResult.status === 'fulfilled') {
        setTrustLedger(Array.isArray(trustResult.value) ? trustResult.value : []);
      }
      
      // Check if any requests failed
      const failedRequests = [vehiclesResult, rsusResult, anomaliesResult, trustResult]
        .filter(result => result.status === 'rejected');
      
      if (failedRequests.length > 0) {
        toast({
          title: "Some data failed to load",
          description: "Some dashboard data couldn't be retrieved. Please refresh to try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hyderabad Traffic Trust Platform</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">BETA</span>
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Dashboard</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Vehicles" 
            value={vehicles.length}
            isLoading={isLoading}
            icon={Car}
          />
          <KpiCard 
            title="Active RSUs" 
            value={rsus.filter(rsu => rsu.status === 'Active').length}
            isLoading={isLoading}
            icon={Radio}
            color="accent"
          />
          <KpiCard 
            title="Recent Anomalies" 
            value={anomalies.length}
            isLoading={isLoading}
            icon={AlertTriangle}
            color="danger"
          />
          <KpiCard 
            title="Trust Updates" 
            value={trustLedger.length}
            isLoading={isLoading}
            icon={Shield}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Real-time Traffic Monitoring</CardTitle>
            <CardDescription>View and track vehicles and roadside units across Hyderabad in real-time</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TrafficMap 
              vehicles={vehicles}
              rsus={rsus}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Anomaly Distribution</CardTitle>
              <CardDescription>Recent vehicle anomalies by severity</CardDescription>
            </CardHeader>
            <CardContent>
              <AnomalyChart 
                data={anomalies} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Blockchain Trust Ledger</CardTitle>
              <CardDescription>Recent trust score changes secured by blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <TrustLedgerTable 
                data={trustLedger} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
