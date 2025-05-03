
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useTrustScores } from '@/hooks/useTrustScores';
import { Skeleton } from "@/components/ui/skeleton";

interface VehicleTrustCardProps {
  vehicles: any[];
  className?: string;
}

const VehicleTrustCard: React.FC<VehicleTrustCardProps> = ({ vehicles, className }) => {
  // Get vehicle IDs for trust score lookup
  const vehicleIds = vehicles.map(v => v.vehicle_id).slice(0, 100);
  
  // Get real-time trust scores from blockchain
  const { 
    trustScores, 
    isLoading, 
    lastUpdate, 
    isConnected, 
    connect 
  } = useTrustScores(vehicleIds, {
    autoConnect: true,
    onUpdate: (update) => {
      console.log("Real-time trust score update:", update);
    }
  });

  // Calculate average trust score
  const averageTrustScore = React.useMemo(() => {
    if (Object.keys(trustScores).length === 0) {
      // Fallback to local trust scores if blockchain scores not available
      const localScores = vehicles.map(v => v.trust_score).filter(Boolean);
      if (localScores.length === 0) return 75; // Default trust score
      return Math.round(localScores.reduce((sum, score) => sum + score, 0) / localScores.length);
    }

    const scores = Object.values(trustScores);
    if (scores.length === 0) return 75; // Default trust score
    return Math.round(scores.reduce((sum, score) => sum + Number(score), 0) / scores.length);
  }, [trustScores, vehicles]);
  
  // Find vehicles with highest and lowest trust
  const [highestTrust, lowestTrust] = React.useMemo(() => {
    if (vehicles.length === 0) return [{ score: 0, id: 'N/A' }, { score: 0, id: 'N/A' }];
    
    let highest = { score: -1, id: '' };
    let lowest = { score: 101, id: '' };
    
    vehicles.forEach(vehicle => {
      const id = vehicle.vehicle_id;
      const score = trustScores[id] !== undefined ? 
        trustScores[id] : (vehicle.trust_score || 75);
      
      if (score > highest.score) {
        highest = { score, id };
      }
      
      if (score < lowest.score) {
        lowest = { score, id };
      }
    });
    
    return [highest, lowest];
  }, [vehicles, trustScores]);

  // Whether we should show blockchain connection status
  const showChainStatus = lastUpdate || isLoading || !isConnected;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span>Trust Scores</span>
          {showChainStatus && (
            <span className="text-xs font-normal text-muted-foreground ml-auto flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Blockchain Connected' : 'Blockchain Disconnected'}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Real-time trust scores from blockchain ledger
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Trust Score</span>
              {isLoading ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <span className="font-medium">{averageTrustScore}</span>
              )}
            </div>
            <Progress value={averageTrustScore} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span>Highest Trust</span>
              </div>
              <div className="text-xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  highestTrust.score
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `Vehicle ID: ${highestTrust.id}`
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-red-600">
                <TrendingDown className="mr-1 h-4 w-4" />
                <span>Lowest Trust</span>
              </div>
              <div className="text-xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  lowestTrust.score
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `Vehicle ID: ${lowestTrust.id}`
                )}
              </div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="text-xs text-muted-foreground mt-2">
              Last update: {new Date(lastUpdate.timestamp * 1000).toLocaleTimeString()} for {lastUpdate.vehicleId}
            </div>
          )}
          
          {!isConnected && (
            <button
              onClick={connect}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 mt-2 w-full"
            >
              Connect to Blockchain
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleTrustCard;
