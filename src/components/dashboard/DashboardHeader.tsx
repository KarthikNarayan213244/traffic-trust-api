
import React from "react";
import DataSourceBadge from "@/components/dashboard/DataSourceBadge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ServerCrash, Database, Shield } from "lucide-react";

interface DashboardHeaderProps {
  counts: {
    totalVehicles: number;
    vehicles: number;
  };
  lastUpdated: Date;
  isLoading: boolean;
  isRefreshing: boolean;
  isSeeding: boolean;
  isUpdatingTrust: boolean;
  vehicles: any[];
  refreshData: () => void;
  seedDatabase: () => void;
  updateTrustScores: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  counts,
  lastUpdated,
  isLoading,
  isRefreshing,
  isSeeding,
  isUpdatingTrust,
  vehicles,
  refreshData,
  seedDatabase,
  updateTrustScores,
}) => {
  const getLastUpdatedText = () => {
    return lastUpdated.toLocaleTimeString();
  };

  return (
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
  );
};

export default DashboardHeader;
