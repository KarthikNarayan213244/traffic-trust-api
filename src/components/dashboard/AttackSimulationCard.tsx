
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  AlertTriangle, 
  Shield, 
  Activity,
  CirclePercent,
  Lock,
  Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  globalAttackSimulationEngine,
  SimulationStats, 
  AttackEvent
} from "@/services/attacks/attackSimulation";

interface AttackSimulationCardProps {
  rsus: any[];
  isLiveMonitoring: boolean;
  setRsus: (rsus: any[]) => void;
  setAnomalies: React.Dispatch<React.SetStateAction<any[]>>;
}

const AttackSimulationCard: React.FC<AttackSimulationCardProps> = ({
  rsus,
  isLiveMonitoring,
  setRsus,
  setAnomalies
}) => {
  const [attackFrequency, setAttackFrequency] = useState<number>(5);
  const [defenseLevel, setDefenseLevel] = useState<number>(70);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [stats, setStats] = useState<SimulationStats>({
    attacksAttempted: 0,
    attacksSuccessful: 0,
    attacksDetected: 0,
    attacksMitigated: 0,
    rsusCompromised: 0,
    rsusQuarantined: 0,
    trustUpdates: 0,
    blockchainTxs: 0,
    activeAttackers: 0,
    networkDegradation: 0
  });
  const [selectedTab, setSelectedTab] = useState("overview");
  const [countdownToNextAttack, setCountdownToNextAttack] = useState<number>(0);

  // Calculate derived statistics
  const getSuccessRate = () => {
    if (stats.attacksAttempted === 0) return 0;
    return Math.round((stats.attacksSuccessful / stats.attacksAttempted) * 100);
  };

  const getDetectionRate = () => {
    if (stats.attacksAttempted === 0) return 0;
    return Math.round((stats.attacksDetected / stats.attacksAttempted) * 100);
  };

  const getMitigationRate = () => {
    if (stats.attacksDetected === 0) return 0;
    return Math.round((stats.attacksMitigated / stats.attacksDetected) * 100);
  };

  const getNetworkHealth = () => {
    return Math.round((1 - stats.networkDegradation) * 100);
  };

  // Initialize the attack simulation engine
  useEffect(() => {
    const handleAttack = (attack: AttackEvent) => {
      console.log("Attack event received:", attack);
      
      // Add attack to anomalies
      setAnomalies(prevAnomalies => {
        // Don't add duplicate attacks
        if (prevAnomalies.some(a => a.id === attack.id)) {
          return prevAnomalies;
        }
        
        // Create new anomaly object
        const newAnomaly = {
          id: attack.id,
          type: attack.attack.name,
          timestamp: attack.timestamp.toISOString(),
          message: `${attack.attackerProfile} attempted ${attack.attack.name} on RSU ${attack.targetId}`,
          severity: attack.attack.severity,
          status: attack.detected ? (attack.mitigated ? "Mitigated" : "Detected") : "Undetected",
          vehicle_id: null,
          target_id: attack.targetId,
          target_type: "RSU",
          is_simulated: true,
          attacker_profile: attack.attackerProfile,
          attack_success: attack.success,
          network_impact: attack.networkImpact,
          affected_nodes: attack.affectedNodes
        };
        
        return [...prevAnomalies, newAnomaly];
      });
      
      // Show toast for critical attacks
      if (attack.attack.severity === 'Critical' && attack.success) {
        toast({
          title: "Critical Attack Detected",
          description: `${attack.attackerProfile} executed ${attack.attack.name} on RSU ${attack.targetId}`,
          variant: "destructive"
        });
      }
    };

    // Set callbacks for the simulation engine
    globalAttackSimulationEngine.setOnAttackGenerated(handleAttack);
    globalAttackSimulationEngine.setOnStatsUpdated(newStats => {
      console.log("Stats updated:", newStats);
      setStats(newStats);
    });
    globalAttackSimulationEngine.setOnRsusUpdated(updatedRsus => {
      console.log("RSUs updated:", updatedRsus.length);
      setRsus(updatedRsus);
    });
    
    return () => {
      // Clean up
      globalAttackSimulationEngine.stop();
    };
  }, [setAnomalies, setRsus]);

  // Handle simulation state
  useEffect(() => {
    if (!simulationActive || !isLiveMonitoring) {
      if (simulationActive && !isLiveMonitoring) {
        // Stop simulation if live monitoring is disabled
        globalAttackSimulationEngine.stop();
        setSimulationActive(false);
        toast({
          title: "Attack Simulation Paused",
          description: "Live monitoring is required for attack simulations.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Update options if they've changed
    globalAttackSimulationEngine.updateOptions({
      attackFrequency,
      defenseLevel
    });
    
    // Start the simulation if not already running
    if (!globalAttackSimulationEngine.isRunning()) {
      globalAttackSimulationEngine.start(rsus);
    }
    
    // Countdown timer for next attack
    const countdownInterval = setInterval(() => {
      setCountdownToNextAttack(prev => {
        if (prev <= 0) {
          // Calculate countdown based on frequency (higher frequency = shorter interval)
          const baseInterval = Math.max(10, 30 - (attackFrequency / 2));
          return Math.floor(baseInterval);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
      
      if (!simulationActive) {
        globalAttackSimulationEngine.stop();
      }
    };
  }, [simulationActive, isLiveMonitoring, rsus, attackFrequency, defenseLevel, toast]);

  // Toggle simulation
  const toggleSimulation = () => {
    if (!isLiveMonitoring) {
      toast({
        title: "Live Monitoring Required",
        description: "Please enable live monitoring first to run attack simulations.",
        variant: "destructive"
      });
      return;
    }
    
    setSimulationActive(prev => {
      const newState = !prev;
      
      if (newState) {
        // Starting simulation
        globalAttackSimulationEngine.start(rsus);
        toast({
          title: "Attack Simulation Started",
          description: "Simulating attacks on RSUs with blockchain protection",
        });
      } else {
        // Stopping simulation
        globalAttackSimulationEngine.stop();
        toast({
          title: "Simulation Stopped",
          description: "Attack simulation has been stopped",
        });
      }
      
      return newState;
    });
  };

  // Reset stats
  const resetStats = () => {
    globalAttackSimulationEngine.resetStats();
    toast({
      title: "Statistics Reset",
      description: "All simulation statistics have been reset"
    });
  };

  // Update simulation options
  const updateSimulationOptions = () => {
    globalAttackSimulationEngine.updateOptions({
      attackFrequency,
      defenseLevel
    });
    
    toast({
      title: "Simulation Settings Updated",
      description: "Attack frequency and defense level have been updated"
    });
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary mr-1" />
            <span>RSU Attack Simulation</span>
          </div>
          {simulationActive && (
            <Badge variant="outline" className="bg-red-100 text-red-800 animate-pulse">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="text-amber-500 mb-1" size={20} />
                <div className="text-xs text-gray-500">Attacks</div>
                <div className="text-2xl font-bold">{stats.attacksAttempted}</div>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <CirclePercent className="text-blue-500 mb-1" size={20} />
                <div className="text-xs text-gray-500">Success Rate</div>
                <div className="text-2xl font-bold">{getSuccessRate()}%</div>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <Shield className="text-red-500 mb-1" size={20} />
                <div className="text-xs text-gray-500">RSUs Compromised</div>
                <div className="text-2xl font-bold">{stats.rsusCompromised}</div>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <Activity className="text-green-500 mb-1" size={20} />
                <div className="text-xs text-gray-500">Network Health</div>
                <div className="text-2xl font-bold">{getNetworkHealth()}%</div>
              </div>
            </div>
            
            {simulationActive && (
              <div className="text-center text-sm my-3">
                Next attack simulation in: 
                <span className="font-medium ml-1">
                  {countdownToNextAttack}s
                </span>
              </div>
            )}
            
            <div className="flex flex-col gap-2 mt-4">
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
                <div className="text-center text-xs text-amber-500 flex items-center justify-center gap-1 mt-1">
                  <Zap size={14} />
                  Enable Live Monitoring to run simulation
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Attack Frequency</div>
                  <div className="text-sm font-medium">{attackFrequency}%</div>
                </div>
                <Slider
                  value={[attackFrequency]}
                  onValueChange={(values) => setAttackFrequency(values[0])}
                  min={1}
                  max={30}
                  step={1}
                  onValueCommit={updateSimulationOptions}
                />
                <div className="text-xs text-gray-500">
                  Controls how often attacks are attempted. Higher values increase attack frequency.
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Defense Level</div>
                  <div className="text-sm font-medium">{defenseLevel}%</div>
                </div>
                <Slider
                  value={[defenseLevel]}
                  onValueChange={(values) => setDefenseLevel(values[0])}
                  min={30}
                  max={90}
                  step={5}
                  onValueCommit={updateSimulationOptions}
                />
                <div className="text-xs text-gray-500">
                  Security level of RSUs. Higher values improve attack detection and blockchain-based protection.
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} className="text-green-600" />
                  <span className="text-sm font-medium">Blockchain Protection</span>
                </div>
                <div className="text-xs text-gray-500">
                  RSUs with significant trust changes or detected attacks are automatically protected with blockchain
                  transactions, making their security status tamper-proof.
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="statistics" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Detection Rate</div>
                  <div className="font-medium text-lg">
                    {getDetectionRate()}%
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Mitigation Rate</div>
                  <div className="font-medium text-lg">
                    {getMitigationRate()}%
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Trust Protection</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Trust Updates</div>
                    <div className="font-medium">{stats.trustUpdates}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Blockchain Txs</div>
                    <div className="font-medium">{stats.blockchainTxs}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Blockchain transactions record trust changes and protect against tampering
                </div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">RSU Security Status</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-medium">{rsus.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Compromised</div>
                    <div className="font-medium text-red-600">{stats.rsusCompromised}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Quarantined</div>
                    <div className="font-medium text-amber-600">{stats.rsusQuarantined}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AttackSimulationCard;
