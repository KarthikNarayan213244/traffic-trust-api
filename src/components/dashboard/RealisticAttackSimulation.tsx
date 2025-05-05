import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, ShieldAlert, RefreshCw, 
  Shield, Network, Activity, Zap, Bomb, 
  Lock, AlertTriangle, BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AttackSimulationEngine,
  globalAttackSimulationEngine,
  SimulationStats,
  AttackSimulationOptions
} from "@/services/attacks/attackSimulation";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RealisticAttackSimulationProps {
  rsus: any[];
  anomalies: any[];
  isLiveMonitoring: boolean;
  setRsus: (rsus: any[]) => void;
  setAnomalies: (anomalies: any[]) => void;
}

const RealisticAttackSimulation: React.FC<RealisticAttackSimulationProps> = ({
  rsus,
  anomalies,
  isLiveMonitoring,
  setRsus,
  setAnomalies
}) => {
  const { toast } = useToast();
  const [attackFrequency, setAttackFrequency] = useState<number>(5);
  const [attackerSkillLevel, setAttackerSkillLevel] = useState<number>(50);
  const [defenseLevel, setDefenseLevel] = useState<number>(70);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationStats, setSimulationStats] = useState<SimulationStats>({
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
  const [countdownToNextAttack, setCountdownToNextAttack] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<string>("overview");

  // Initialize the attack simulation engine
  useEffect(() => {
    // Set callback for receiving attack results
    globalAttackSimulationEngine.setOnAttackGenerated((attack) => {
      // Add attack to anomalies if not already present
      setAnomalies(prevAnomalies => {
        const newAnomaly = {
          id: attack.id,
          type: attack.attack.name,
          timestamp: attack.timestamp,
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
        
        // Only add if not already present
        if (!prevAnomalies.some(a => a.id === attack.id)) {
          return [...prevAnomalies, newAnomaly];
        }
        return prevAnomalies;
      });
      
      // Show toast for critical attacks
      if (attack.attack.severity === 'Critical' && attack.success) {
        toast({
          title: "Critical Attack Successful",
          description: `${attack.attackerProfile} successfully executed ${attack.attack.name} on RSU ${attack.targetId}`,
          variant: "destructive"
        });
      }
    });
    
    // Set callback for receiving stats updates
    globalAttackSimulationEngine.setOnStatsUpdated((stats) => {
      setSimulationStats(stats);
    });
    
    // Set callback for receiving RSU updates
    globalAttackSimulationEngine.setOnRsusUpdated((updatedRsus) => {
      setRsus(updatedRsus);
    });
    
    // Update simulation options
    globalAttackSimulationEngine.updateOptions({
      attackFrequency,
      attackerSkillLevel,
      defenseLevel,
      enableNetworkEffects: true,
      enableVisualization: true,
      realTimeSimulation: true
    });
    
    return () => {
      // Clean up
      globalAttackSimulationEngine.stop();
    };
  }, [setAnomalies, setRsus, toast]);

  // Effect for attack simulation when both simulation and live monitoring are active
  useEffect(() => {
    if (!simulationActive || !isLiveMonitoring) {
      if (simulationActive && !isLiveMonitoring) {
        // Stop simulation if live monitoring is disabled
        globalAttackSimulationEngine.stop();
        setSimulationActive(false);
        toast({
          title: "Attack Simulation Paused",
          description: "Live monitoring is required to run attack simulations.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Update options if they've changed
    globalAttackSimulationEngine.updateOptions({
      attackFrequency,
      attackerSkillLevel,
      defenseLevel
    });
    
    // Start the simulation if not already running
    globalAttackSimulationEngine.start(rsus);
    
    // Countdown timer for next attack
    const countdownInterval = setInterval(() => {
      setCountdownToNextAttack(prev => {
        if (prev <= 0) {
          // Calculate countdown based on frequency
          const baseInterval = Math.max(15, 30 - (attackFrequency / 5));
          return Math.floor(baseInterval);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
      
      // Stop the simulation if component unmounts
      if (!simulationActive) {
        globalAttackSimulationEngine.stop();
      }
    };
  }, [simulationActive, isLiveMonitoring, rsus, attackFrequency, attackerSkillLevel, defenseLevel, toast]);

  // Toggle simulation
  const toggleSimulation = () => {
    if (!isLiveMonitoring) {
      toast({
        title: "Live Monitoring Required",
        description: "Please enable live monitoring first to run the attack simulation.",
        variant: "destructive"
      });
      return;
    }
    
    if (!simulationActive) {
      // Starting simulation
      setSimulationActive(true);
      globalAttackSimulationEngine.start(rsus);
      toast({
        title: "Realistic Attack Simulation Started",
        description: "Advanced attack simulation with network effects is now active.",
      });
    } else {
      // Stopping simulation
      setSimulationActive(false);
      globalAttackSimulationEngine.stop();
      toast({
        title: "Simulation Paused",
        description: "Realistic attack simulation has been paused.",
      });
    }
  };

  // Reset simulation stats
  const resetStats = () => {
    globalAttackSimulationEngine.resetStats();
  };

  // Update simulation options
  const updateSimulationOptions = () => {
    globalAttackSimulationEngine.updateOptions({
      attackFrequency,
      attackerSkillLevel,
      defenseLevel
    });
  };

  // Get detection success rate
  const getDetectionRate = () => {
    if (simulationStats.attacksAttempted === 0) return 0;
    return Math.round((simulationStats.attacksDetected / simulationStats.attacksAttempted) * 100);
  };

  // Get mitigation success rate
  const getMitigationRate = () => {
    if (simulationStats.attacksDetected === 0) return 0;
    return Math.round((simulationStats.attacksMitigated / simulationStats.attacksDetected) * 100);
  };

  // Get network health percentage
  const getNetworkHealth = () => {
    return Math.round((1 - simulationStats.networkDegradation) * 100);
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-primary" />
            <span>Advanced Attack Simulation</span>
          </div>
          {simulationActive && isLiveMonitoring && (
            <Badge 
              variant="outline" 
              className="bg-red-100 text-red-800 animate-pulse"
            >
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="text-sm text-muted-foreground">
          Simulates realistic cyber attacks with network effects and advanced attacker behavior
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="border rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Attacks</div>
                <div className="font-medium flex items-center justify-center gap-1">
                  <AlertTriangle size={14} className="text-amber-500" />
                  {simulationStats.attacksAttempted}
                </div>
              </div>
              <div className="border rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Success Rate</div>
                <div className="font-medium flex items-center justify-center gap-1">
                  <Bomb size={14} className="text-red-500" />
                  {simulationStats.attacksAttempted === 0 ? 0 : 
                    Math.round((simulationStats.attacksSuccessful / simulationStats.attacksAttempted) * 100)}%
                </div>
              </div>
              <div className="border rounded-lg p-2">
                <div className="text-xs text-muted-foreground">RSUs Compromised</div>
                <div className="font-medium flex items-center justify-center gap-1">
                  <Shield size={14} className="text-red-500" />
                  {simulationStats.rsusCompromised}
                </div>
              </div>
              <div className="border rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Network Health</div>
                <div className="font-medium flex items-center justify-center gap-1">
                  <Network size={14} className="text-blue-500" />
                  {getNetworkHealth()}%
                </div>
              </div>
            </div>
            
            {simulationActive && isLiveMonitoring && (
              <div className="text-center text-sm mt-4">
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
                <div className="text-center text-xs text-amber-500 flex items-center justify-center gap-1">
                  <Zap size={14} />
                  Enable Live Monitoring to run simulation
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Attack Frequency</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm font-medium flex items-center">
                          {attackFrequency}%
                          <AlertTriangle size={12} className="ml-1 text-amber-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How often attacks are attempted. Higher values increase attack frequency.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider
                  value={[attackFrequency]}
                  onValueChange={(values) => setAttackFrequency(values[0])}
                  min={1}
                  max={30}
                  step={1}
                  onValueCommit={updateSimulationOptions}
                  disabled={!simulationActive || !isLiveMonitoring}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Attacker Skill Level</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm font-medium flex items-center">
                          {attackerSkillLevel}%
                          <Shield size={12} className="ml-1 text-red-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Skill level of attackers. Higher values make attacks more effective and harder to detect.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider
                  value={[attackerSkillLevel]}
                  onValueChange={(values) => setAttackerSkillLevel(values[0])}
                  min={20}
                  max={90}
                  step={5}
                  onValueCommit={updateSimulationOptions}
                  disabled={!simulationActive || !isLiveMonitoring}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Defense Level</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm font-medium flex items-center">
                          {defenseLevel}%
                          <Lock size={12} className="ml-1 text-green-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Security level of the RSUs. Higher values improve attack detection and mitigation.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider
                  value={[defenseLevel]}
                  onValueChange={(values) => setDefenseLevel(values[0])}
                  min={30}
                  max={90}
                  step={5}
                  onValueCommit={updateSimulationOptions}
                  disabled={!simulationActive || !isLiveMonitoring}
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Shield className="mr-2 h-4 w-4" />
                  Advanced Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem>
                  Network Effects: Enabled
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Attacker Profiles: Dynamic
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Attack Propagation: Enabled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Detection Rate</div>
                  <div className="font-medium">
                    {getDetectionRate()}%
                  </div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Mitigation Rate</div>
                  <div className="font-medium">
                    {getMitigationRate()}%
                  </div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Trust Updates</div>
                  <div className="font-medium">
                    {simulationStats.trustUpdates}
                  </div>
                </div>
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Blockchain Txs</div>
                  <div className="font-medium">
                    {simulationStats.blockchainTxs}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                  <BarChart3 size={14} className="mr-1" />
                  Attack Distribution
                </div>
                <div className="h-20 flex items-end gap-1">
                  <div className="h-full flex flex-col justify-end">
                    <div className="bg-amber-400 w-6" 
                      style={{height: `${Math.min(100, (simulationStats.attacksAttempted / Math.max(1, simulationStats.attacksAttempted)) * 100)}%`}}>
                    </div>
                    <div className="text-xs text-center">Total</div>
                  </div>
                  <div className="h-full flex flex-col justify-end">
                    <div className="bg-red-400 w-6" 
                      style={{height: `${Math.min(100, (simulationStats.attacksSuccessful / Math.max(1, simulationStats.attacksAttempted)) * 100)}%`}}>
                    </div>
                    <div className="text-xs text-center">Success</div>
                  </div>
                  <div className="h-full flex flex-col justify-end">
                    <div className="bg-blue-400 w-6" 
                      style={{height: `${Math.min(100, (simulationStats.attacksDetected / Math.max(1, simulationStats.attacksAttempted)) * 100)}%`}}>
                    </div>
                    <div className="text-xs text-center">Detected</div>
                  </div>
                  <div className="h-full flex flex-col justify-end">
                    <div className="bg-green-400 w-6" 
                      style={{height: `${Math.min(100, (simulationStats.attacksMitigated / Math.max(1, simulationStats.attacksAttempted)) * 100)}%`}}>
                    </div>
                    <div className="text-xs text-center">Mitigated</div>
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

export default RealisticAttackSimulation;
