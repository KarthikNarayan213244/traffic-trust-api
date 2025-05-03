import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficMap from "@/components/dashboard/TrafficMap";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import SystemHealthMonitor from "@/components/dashboard/SystemHealthMonitor";
import DataSourceBadge from "@/components/dashboard/DataSourceBadge";
import VehicleTrustCard from "@/components/dashboard/VehicleTrustCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Radio, AlertTriangle, Shield, Database, BarChart3, ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { seedDatabaseWithTestData } from "@/services/api/supabase";
import { useScaledTrafficData } from "@/hooks/useScaledTrafficData";
import { refreshScaledTrafficData, getTrafficStats } from "@/services/trafficScaler";
import { useTrustLedger } from "@/hooks/useTrustLedger";
import { updateTrustScore, batchUpdateTrustScores } from "@/services/blockchain";

const Dashboard: React.FC = () => {
  // State for map bounds and zoom
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [mapZoom, setMapZoom] = useState<number>(12);
  
  // Using our scaled traffic data hook
  const { 
    data: trafficData,
    stats: trafficStats,
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshData,
    counts
  } = useScaledTrafficData({
    initialRefreshInterval: 60000, // 60 seconds
    enableAutoRefresh: true,
    visibleBounds: mapBounds,
    zoomLevel: mapZoom
  });
  
  const { vehicles, rsus, congestion: congestionData, anomalies } = trafficData;
  
  // Use the useTrustLedger hook for blockchain data
  const { 
    apiData: trustApiData, 
    blockchainData: trustBlockchainData, 
    isBlockchainLoading, 
    handleRefresh: refreshTrustData, 
    connectedWallet,
    etherscanUrl
  } = useTrustLedger();
  
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isUpdatingTrust, setIsUpdatingTrust] = useState<boolean>(false);
  
  // Handle map bounds and zoom changes
  const handleMapViewChanged = (bounds: any, zoom: number) => {
    setMapBounds(bounds);
    setMapZoom(zoom);
  };
  
  // Initialize traffic scaler
  useEffect(() => {
    const initTrafficScaler = async () => {
      setIsSeeding(true);
      toast({
        title: "Initializing Traffic Data",
        description: "Scaling up traffic data for Hyderabad. This may take a moment...",
      });
      
      try {
        await refreshScaledTrafficData();
        const stats = getTrafficStats();
        
        toast({
          title: "Traffic Scaling Complete",
          description: `Generated ${Math.round(stats.totalVehicles/1000000)}M vehicles across ${stats.segments} road segments`,
        });
      } catch (error) {
        console.error("Error initializing traffic scaler:", error);
        toast({
          title: "Error",
          description: "Failed to initialize traffic scaling. Using default data.",
          variant: "destructive",
        });
      } finally {
        setIsSeeding(false);
      }
    };
    
    initTrafficScaler();
  }, []);

  // Seed database - now only seeds trust data, not traffic
  const seedDatabase = async () => {
    setIsSeeding(true);
    toast({
      title: "Seeding Trust Database",
      description: "Please wait while we populate the database with trust data...",
    });
    
    try {
      const result = await seedDatabaseWithTestData(true);
      toast({
        title: "Database Seeded Successfully",
        description: `Added ${result.counts.trustEntries} trust entries, ${result.counts.anomalies} anomalies.`,
      });
      
      // Refresh trust data
      refreshTrustData();
      
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
  
  // Update trust scores on blockchain
  const updateTrustScores = async () => {
    if (vehicles.length === 0) {
      toast({
        title: "No Vehicles Available",
        description: "Cannot update trust scores without vehicle data.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdatingTrust(true);
    toast({
      title: "Updating Trust Scores",
      description: "Submitting trust scores to blockchain. This may take a few moments.",
    });
    
    try {
      // Prepare trust updates for vehicles with trust scores
      const updates = vehicles
        .filter(v => v.trust_score !== undefined)
        .slice(0, 25) // Limit to 25 vehicles for this demo
        .map(vehicle => ({
          vehicleId: vehicle.vehicle_id,
          score: Math.round(vehicle.trust_score || 75)
        }));
      
      // Submit batch update to blockchain
      const successCount = await batchUpdateTrustScores(updates);
      
      toast({
        title: "Trust Scores Updated",
        description: `Successfully updated ${successCount} trust scores on blockchain`,
        variant: "default",
      });
      
      // Refresh trust data
      refreshTrustData();
      
    } catch (error: any) {
      console.error("Error updating trust scores on blockchain:", error);
      toast({
        title: "Trust Update Failed",
        description: error.message || "Failed to update trust scores on blockchain",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTrust(false);
    }
  };

  const getLastUpdatedText = () => {
    return lastUpdated.toLocaleTimeString();
  };

  // Format vehicle count for display
  const getVehicleCountSummary = () => {
    if (counts.totalVehicles === 0) return "";
    
    const totalMillions = (counts.totalVehicles / 1000000).toFixed(1);
    const visibleThousands = Math.round(counts.vehicles / 1000);
    
    return `${totalMillions}M vehicles in Hyderabad, ${visibleThousands}K visible`;
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
                provider="TomTom + Scaled Simulation"
                isRealTime={true}
                apiCredits={100}
              />
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {counts.totalVehicles ? `${(counts.totalVehicles / 1000000).toFixed(1)}M Vehicles` : "Scaling..."}
              </span>
              <span className="text-xs text-muted-foreground">v3.0.0</span>
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
              <span>{isSeeding ? 'Seeding...' : 'Seed Trust Data'}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={updateTrustScores}
              disabled={isUpdatingTrust || vehicles.length === 0}
              className="flex items-center gap-2"
            >
              <Shield className={`h-4 w-4 ${isUpdatingTrust ? 'animate-pulse' : ''}`} />
              <span>{isUpdatingTrust ? 'Updating...' : 'Update Trust On-Chain'}</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Vehicles" 
            value={counts.totalVehicles || 0}
            isLoading={isLoading}
            icon={Car}
            trend={{
              value: "3.5M", // Must be a string, not number
              label: "registered vehicles"
            }}
          />
          <KpiCard 
            title="Active RSUs" 
            value={rsus.filter(rsu => rsu.status === 'Active').length}
            total={counts.totalRSUs || 0}
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
            value={trustBlockchainData.length || trustApiData.length}
            isLoading={isBlockchainLoading}
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
              View and track {getVehicleCountSummary()} across Hyderabad with live updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TrafficMap 
              vehicles={vehicles}
              rsus={rsus}
              isLoading={isLoading}
              congestionData={congestionData}
              onBoundsChanged={handleMapViewChanged}
              vehicleCountSummary={getVehicleCountSummary()}
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
          
          <VehicleTrustCard vehicles={vehicles} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemHealthMonitor />
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Blockchain Trust Ledger</span>
              </CardTitle>
              <CardDescription>
                Real-time trust score changes secured by blockchain
                {connectedWallet && (
                  <span className="block text-xs mt-1">
                    Connected wallet: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrustLedgerTable 
                data={trustBlockchainData.length > 0 ? trustBlockchainData : trustApiData} 
                isLoading={isBlockchainLoading} 
                etherscanUrl={etherscanUrl}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
