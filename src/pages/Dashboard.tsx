
import React, { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficMap from "@/components/dashboard/TrafficMap";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import SystemHealthMonitor from "@/components/dashboard/SystemHealthMonitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Radio, AlertTriangle, Shield, Database, BarChart3, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { seedDatabaseWithTestData } from "@/services/api/supabase";
import { useRealTimeData, cleanupRealTimeConnections } from "@/hooks/useRealTimeData";

const Dashboard: React.FC = () => {
  // Using real-time data hooks instead of traditional loading
  const { 
    data: vehicles, 
    isLoading: isVehiclesLoading, 
    refreshData: refreshVehicles 
  } = useRealTimeData('vehicle', []);
  
  const { 
    data: rsus, 
    isLoading: isRsusLoading, 
    refreshData: refreshRsus 
  } = useRealTimeData('rsu', []);
  
  const { 
    data: anomalies, 
    isLoading: isAnomaliesLoading, 
    refreshData: refreshAnomalies 
  } = useRealTimeData('anomaly', []);
  
  const { 
    data: trustLedger, 
    isLoading: isTrustLoading, 
    refreshData: refreshTrust 
  } = useRealTimeData('trust', []);
  
  const { 
    data: congestionData, 
    isLoading: isCongestionLoading, 
    refreshData: refreshCongestion 
  } = useRealTimeData('congestion', []);

  const [isSeeding, setIsSeeding] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Combined loading state
  const isLoading = isVehiclesLoading || isRsusLoading || isAnomaliesLoading || isTrustLoading || isCongestionLoading;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRealTimeConnections();
    };
  }, []);

  // Refresh all data
  const refreshAllData = () => {
    refreshVehicles();
    refreshRsus();
    refreshAnomalies();
    refreshTrust();
    refreshCongestion();
    setLastUpdated(new Date());
  };

  const seedDatabase = async () => {
    setIsSeeding(true);
    toast({
      title: "Seeding Database",
      description: "Please wait while we populate the database with sample data...",
    });
    
    try {
      const result = await seedDatabaseWithTestData(true);
      toast({
        title: "Database Seeded Successfully",
        description: `Added ${result.counts.vehicles} vehicles, ${result.counts.rsus} RSUs, ${result.counts.anomalies} anomalies, ${result.counts.trustEntries} trust entries, and ${result.counts.congestionEntries} congestion entries.`,
      });
      
      refreshAllData();
    } catch (error) {
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

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hyderabad Traffic Trust Platform</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">REAL-TIME</span>
              <span className="text-xs text-muted-foreground">v2.0.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {getLastUpdatedText()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ServerCrash className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Now</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={seedDatabase}
              disabled={isSeeding}
              className="flex items-center gap-2"
            >
              <Database className={`h-4 w-4 ${isSeeding ? 'animate-pulse' : ''}`} />
              <span>{isSeeding ? 'Seeding...' : 'Seed Database'}</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Vehicles" 
            value={vehicles.length}
            isLoading={isVehiclesLoading}
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
            isLoading={isRsusLoading}
            icon={Radio}
            color="accent"
          />
          <KpiCard 
            title="Recent Anomalies" 
            value={anomalies.length}
            isLoading={isAnomaliesLoading}
            icon={AlertTriangle}
            color="danger"
            trend={{
              value: anomalies.filter(a => a.severity === "Critical").length > 0 ? 
                `${anomalies.filter(a => a.severity === "Critical").length} critical` : 
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
            <CardDescription>View and track vehicles and roadside units across Hyderabad in real-time</CardDescription>
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
                isLoading={isAnomaliesLoading} 
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
