
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficMap from "@/components/dashboard/TrafficMap";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import SystemHealthMonitor from "@/components/dashboard/SystemHealthMonitor";
import DataSourceBadge from "@/components/dashboard/DataSourceBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Radio, AlertTriangle, Shield, Database, BarChart3, ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { seedDatabaseWithTestData } from "@/services/api/supabase";
import { useRealTimeTrafficData } from "@/hooks/useRealTimeTrafficData";
import { fetchTrustLedger } from "@/services/api";

const Dashboard: React.FC = () => {
  // Using our real-time traffic data hook
  const { 
    data: trafficData,
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshData,
    dataSource,
    isRealTimeSource,
    isRealtimeEnabled
  } = useRealTimeTrafficData({
    initialRefreshInterval: 30000, // 30 seconds
    enableAutoRefresh: true
  });
  
  const { vehicles, rsus, congestion: congestionData, anomalies } = trafficData;
  
  // For trust ledger data (not from real-time APIs)
  const [trustLedger, setTrustLedger] = useState<any[]>([]);
  const [isTrustLoading, setIsTrustLoading] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Load trust ledger data
  useEffect(() => {
    const loadTrustData = async () => {
      setIsTrustLoading(true);
      try {
        const result = await fetchTrustLedger({ limit: 100 });
        setTrustLedger(result);
      } catch (error) {
        console.error("Error loading trust ledger:", error);
      } finally {
        setIsTrustLoading(false);
      }
    };
    
    loadTrustData();
  }, []);

  // Seed database
  const seedDatabase = async () => {
    setIsSeeding(true);
    toast({
      title: "Seeding Traffic Database",
      description: "Please wait while we populate the database with trust and traffic data...",
    });
    
    try {
      const result = await seedDatabaseWithTestData(true);
      toast({
        title: "Database Seeded Successfully",
        description: `Added ${result.counts.trustEntries} trust entries, ${result.counts.anomalies} anomalies, and updated vehicles.`,
      });
      
      // Refresh all data
      refreshData();
      
      // Reload trust ledger data
      setIsTrustLoading(true);
      try {
        const updatedTrust = await fetchTrustLedger({ limit: 100 });
        setTrustLedger(updatedTrust);
      } catch (trustError) {
        console.error("Error refreshing trust data:", trustError);
      } finally {
        setIsTrustLoading(false);
      }
      
    } catch (error: any) {
      console.error("Error seeding database:", error);
      toast({
        title: "Error",
        description: `Failed to seed database: ${error.message || "Unknown error"}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const getLastUpdatedText = () => {
    return lastUpdated.toLocaleTimeString();
  };

  // Show critical anomalies count
  const criticalAnomalies = anomalies.filter(a => a.severity === "Critical").length;

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hyderabad Traffic Trust Platform</h1>
            <div className="flex items-center gap-2 mt-1">
              <DataSourceBadge
                provider={dataSource.provider}
                isRealTime={dataSource.isRealTime}
                apiCredits={dataSource.apiCredits}
              />
              {isRealtimeEnabled && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  Real-time Updates Active
                </span>
              )}
              <span className="text-xs text-muted-foreground">v2.1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {getLastUpdatedText()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ServerCrash className="h-4 w-4" />
              )}
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={seedDatabase}
              disabled={isSeeding}
              className="flex items-center gap-2"
            >
              <Database className={`h-4 w-4 ${isSeeding ? 'animate-pulse' : ''}`} />
              <span>{isSeeding ? 'Seeding...' : 'Seed Traffic Data'}</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Vehicles" 
            value={vehicles.length}
            isLoading={isLoading}
            icon={Car}
            trend={{
              value: vehicles.length > 100 ? "+12%" : "+0%",
              label: vehicles.length > 100 ? "from last hour" : "No change"
            }}
          />
          <KpiCard 
            title="Active RSUs" 
            value={rsus.filter(rsu => rsu.status === 'Active').length}
            total={rsus.length}
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
            trend={{
              value: criticalAnomalies > 0 ? 
                `${criticalAnomalies} critical` : 
                "0 critical",
              label: "issues detected"
            }}
          />
          <KpiCard 
            title="Trust Updates" 
            value={trustLedger.length}
            isLoading={isTrustLoading}
            icon={Shield}
            trend={{
              value: "+15%",
              label: "increase in trust"
            }}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Real-time Traffic Monitoring</CardTitle>
            <CardDescription>
              View and track vehicles and roadside units across Hyderabad 
              {isRealtimeEnabled && " with live updates"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TrafficMap 
              vehicles={vehicles}
              rsus={rsus}
              isLoading={isLoading}
              congestionData={congestionData}
            />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span>Anomaly Distribution</span>
              </CardTitle>
              <CardDescription>Recent vehicle anomalies by severity</CardDescription>
            </CardHeader>
            <CardContent>
              <AnomalyChart 
                data={anomalies} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
          
          <SystemHealthMonitor />
        </div>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Blockchain Trust Ledger</span>
            </CardTitle>
            <CardDescription>Real-time trust score changes secured by blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <TrustLedgerTable 
              data={trustLedger} 
              isLoading={isTrustLoading} 
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
