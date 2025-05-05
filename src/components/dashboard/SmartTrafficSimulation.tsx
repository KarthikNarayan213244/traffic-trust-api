
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, AlertTriangle, RefreshCw, 
  Shield, Database, Activity, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRsuAttacks, updateRsuTrustScores } from "@/services/ml/rsuTrustScoring";

interface SmartTrafficSimulationProps {
  rsus: any[];
  anomalies: any[];
  isLiveMonitoring: boolean;
  setRsus: (rsus: any[]) => void;
  setAnomalies: (anomalies: any[]) => void;
}

const SmartTrafficSimulation: React.FC<SmartTrafficSimulationProps> = ({
  rsus,
  anomalies,
  isLiveMonitoring,
  setRsus,
  setAnomalies
}) => {
  const { toast } = useToast();
  const [attackFrequency, setAttackFrequency] = useState<number>(5);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationStats, setSimulationStats] = useState({
    attacksGenerated: 0,
    rsusQuarantined: 0,
    trustUpdates: 0,
    blockchainTxs: 0,
  });
  const [countdownToNextAttack, setCountdownToNextAttack] = useState<number>(0);

  // Effect for trust simulation when both simulation and live monitoring are active
  useEffect(() => {
    if (!simulationActive || !isLiveMonitoring) return;

    // Initial update
    runTrustSimulationCycle();
    
    // Set up interval for simulation steps
    const interval = setInterval(() => {
      runTrustSimulationCycle();
    }, 15000); // Run every 15 seconds
    
    // Countdown timer for next attack
    const countdownInterval = setInterval(() => {
      setCountdownToNextAttack(prev => {
        if (prev <= 0) {
          // If we reach 0, restart from attack frequency
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [simulationActive, isLiveMonitoring, rsus, anomalies, attackFrequency]);

  // Function to run a simulation cycle
  const runTrustSimulationCycle = async () => {
    try {
      // Step 1: Generate attacks based on frequency
      const attackProbability = attackFrequency / 100;
      const newAttacks = generateRsuAttacks(rsus, attackProbability);
      
      if (newAttacks.length > 0) {
        // Add new attacks to anomalies
        setAnomalies(prev => [...newAttacks, ...prev]);
        
        // Update stats
        setSimulationStats(prev => ({
          ...prev,
          attacksGenerated: prev.attacksGenerated + newAttacks.length
        }));
        
        // Show toast for significant attacks
        if (newAttacks.some(a => a.severity === "High")) {
          toast({
            title: "High Severity Attack Detected",
            description: `${newAttacks.filter(a => a.severity === "High").length} RSUs under serious attack`,
            variant: "destructive"
          });
        }
      }
      
      // Step 2: Update RSU trust scores
      const allAnomalies = [...newAttacks, ...anomalies];
      const updatedRsus = await updateRsuTrustScores(rsus, allAnomalies);
      
      // Count blockchain transactions and quarantined RSUs
      const newQuarantinedCount = updatedRsus.filter(r => r.quarantined).length - 
                                 rsus.filter(r => r.quarantined).length;
      
      const trustUpdateCount = updatedRsus.filter((r, i) => {
        const oldRsu = rsus[i];
        return oldRsu && r.trust_score !== oldRsu.trust_score;
      }).length;
      
      // Update UI with new RSU data
      setRsus(updatedRsus);
      
      // Update stats
      setSimulationStats(prev => ({
        ...prev,
        rsusQuarantined: prev.rsusQuarantined + Math.max(0, newQuarantinedCount),
        trustUpdates: prev.trustUpdates + trustUpdateCount,
        blockchainTxs: prev.blockchainTxs + 
          Math.min(trustUpdateCount, Math.floor(trustUpdateCount * 0.7)) // Not all updates go to blockchain
      }));
      
      // Reset countdown
      setCountdownToNextAttack(15);
      
    } catch (error) {
      console.error("Error in trust simulation cycle:", error);
      toast({
        title: "Simulation Error",
        description: "An error occurred during the trust simulation cycle",
        variant: "destructive"
      });
    }
  };

  // Toggle simulation
  const toggleSimulation = () => {
    if (!simulationActive) {
      // Starting simulation
      setSimulationActive(true);
      toast({
        title: "Smart Traffic Trust Simulation Started",
        description: "Simulating RSU attacks and trust verification via blockchain",
      });
    } else {
      // Stopping simulation
      setSimulationActive(false);
      toast({
        title: "Simulation Paused",
        description: "Smart Traffic Trust Simulation has been paused",
      });
    }
  };

  // Reset simulation stats
  const resetStats = () => {
    setSimulationStats({
      attacksGenerated: 0,
      rsusQuarantined: 0,
      trustUpdates: 0,
      blockchainTxs: 0,
    });
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <span>Smart Traffic Trust Simulation</span>
          </div>
          {simulationActive && isLiveMonitoring && (
            <Badge 
              variant="outline" 
              className="bg-green-100 text-green-800 animate-pulse"
            >
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="text-sm text-muted-foreground">
          Simulates RSU attacks and blockchain-based trust verification
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="border rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Attacks Generated</div>
              <div className="font-medium flex items-center justify-center gap-1">
                <AlertTriangle size={14} className="text-amber-500" />
                {simulationStats.attacksGenerated}
              </div>
            </div>
            <div className="border rounded-lg p-2">
              <div className="text-xs text-muted-foreground">RSUs Quarantined</div>
              <div className="font-medium flex items-center justify-center gap-1">
                <Shield size={14} className="text-red-500" />
                {simulationStats.rsusQuarantined}
              </div>
            </div>
            <div className="border rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Trust Updates</div>
              <div className="font-medium flex items-center justify-center gap-1">
                <Database size={14} className="text-blue-500" />
                {simulationStats.trustUpdates}
              </div>
            </div>
            <div className="border rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Blockchain Txs</div>
              <div className="font-medium flex items-center justify-center gap-1">
                <Activity size={14} className="text-purple-500" />
                {simulationStats.blockchainTxs}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">Attack Frequency</div>
              <div className="text-sm font-medium">{attackFrequency}%</div>
            </div>
            <Slider
              defaultValue={[5]}
              value={[attackFrequency]}
              onValueChange={(values) => setAttackFrequency(values[0])}
              min={1}
              max={30}
              step={1}
              disabled={!simulationActive || !isLiveMonitoring}
            />
          </div>
          
          {simulationActive && isLiveMonitoring && (
            <div className="text-center text-sm">
              Next attack simulation in: 
              <span className="font-medium ml-1">
                {countdownToNextAttack}s
              </span>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={toggleSimulation}
              variant={simulationActive ? "destructive" : "default"}
              disabled={!isLiveMonitoring}
              className="w-full"
            >
              {simulationActive ? (
                <>
                  <Pause size={16} className="mr-2" />
                  Stop Simulation
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Start Simulation
                </>
              )}
            </Button>
            
            <Button
              onClick={resetStats}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw size={14} className="mr-2" />
              Reset Stats
            </Button>
            
            {!isLiveMonitoring && (
              <div className="text-center text-xs text-amber-500 flex items-center justify-center gap-1">
                <Zap size={14} />
                Enable Live Monitoring to run simulation
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartTrafficSimulation;
