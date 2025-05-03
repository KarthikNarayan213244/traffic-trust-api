
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "@/hooks/use-toast";
import { seedDatabaseWithTestData } from "@/services/api/supabase";
import { refreshScaledTrafficData, getTrafficStats } from "@/services/trafficScaler";
import { useTrustLedger } from "@/hooks/useTrustLedger";
import { batchUpdateTrustScores } from "@/services/blockchain";
import { useScaledTrafficData } from "@/hooks/useScaledTraffic";

// Import new refactored components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardKpis from "@/components/dashboard/DashboardKpis";
import TrafficMonitorCard from "@/components/dashboard/TrafficMonitorCard";
import ChartsRow from "@/components/dashboard/ChartsRow";
import MonitoringRow from "@/components/dashboard/MonitoringRow";

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

  // Format vehicle count for display
  const getVehicleCountSummary = () => {
    if (counts.totalVehicles === 0) return "";
    
    const totalMillions = (counts.totalVehicles / 1000000).toFixed(1);
    const visibleThousands = Math.round(counts.vehicles / 1000);
    
    return `${totalMillions}M vehicles in Hyderabad, ${visibleThousands}K visible`;
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <DashboardHeader 
          counts={counts}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isSeeding={isSeeding}
          isUpdatingTrust={isUpdatingTrust}
          vehicles={vehicles}
          refreshData={refreshData}
          seedDatabase={seedDatabase}
          updateTrustScores={updateTrustScores}
        />
        
        <DashboardKpis 
          counts={counts}
          rsus={rsus}
          anomalies={anomalies}
          trustBlockchainData={trustBlockchainData}
          trustApiData={trustApiData}
          isLoading={isLoading}
          isBlockchainLoading={isBlockchainLoading}
        />
        
        <TrafficMonitorCard 
          vehicles={vehicles}
          rsus={rsus}
          congestionData={congestionData}
          isLoading={isLoading}
          onBoundsChanged={handleMapViewChanged}
          vehicleCountSummary={getVehicleCountSummary()}
        />
        
        <ChartsRow 
          anomalies={anomalies}
          vehicles={vehicles}
          isLoading={isLoading}
        />
        
        <MonitoringRow 
          trustBlockchainData={trustBlockchainData}
          trustApiData={trustApiData}
          isBlockchainLoading={isBlockchainLoading}
          connectedWallet={connectedWallet}
          etherscanUrl={etherscanUrl}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
