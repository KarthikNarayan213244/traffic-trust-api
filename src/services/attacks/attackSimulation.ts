import { AttackVector, ALL_ATTACK_VECTORS, getRandomAttackVector } from './attackTypes';
import { Attacker, AttackerPool, globalAttackerPool } from './attackerModel';
import { NetworkTopology, globalNetworkTopology } from './networkSimulation';
import { stakeTrust } from "@/services/blockchain";
import { toast } from "@/hooks/use-toast";

export interface AttackSimulationOptions {
  attackFrequency: number;       // 0-100 scale for attack frequency
  attackerSkillLevel: number;    // 0-100 scale for attacker skill
  defenseLevel: number;          // 0-100 scale for defense capability
  enableNetworkEffects: boolean; // Whether to simulate network effects
  enableVisualization: boolean;  // Whether to show visual indicators of attacks
  realTimeSimulation: boolean;   // Whether to run in real-time or accelerated
}

export interface AttackResult {
  id: string;
  timestamp: string;
  attackerId: string;
  attackerProfile: string;
  targetId: string;
  targetType: 'RSU' | 'Vehicle';
  attack: AttackVector;
  success: boolean;
  detected: boolean;
  mitigated: boolean;
  affectedNodes: string[];
  trustImpact: number;
  networkImpact: number;
  isSimulated: boolean;
}

export interface SimulationStats {
  attacksAttempted: number;
  attacksSuccessful: number;
  attacksDetected: number;
  attacksMitigated: number;
  rsusCompromised: number;
  rsusQuarantined: number;
  trustUpdates: number;
  blockchainTxs: number;
  activeAttackers: number;
  networkDegradation: number; // 0-1 scale
}

export class AttackSimulationEngine {
  private options: AttackSimulationOptions;
  private stats: SimulationStats;
  private attackers: AttackerPool;
  private networkTopology: NetworkTopology;
  private running: boolean = false;
  private simulationTimer: NodeJS.Timeout | null = null;
  private attackResults: AttackResult[] = [];
  private lastSimulationTime: number = 0;
  
  // Callbacks for updating various components
  private onAttackGenerated: ((attack: AttackResult) => void) | null = null;
  private onStatsUpdated: ((stats: SimulationStats) => void) | null = null;
  private onRsusUpdated: ((rsus: any[]) => void) | null = null;
  
  constructor(options: Partial<AttackSimulationOptions> = {}) {
    // Default options
    this.options = {
      attackFrequency: 5,
      attackerSkillLevel: 50,
      defenseLevel: 70,
      enableNetworkEffects: true,
      enableVisualization: true,
      realTimeSimulation: true,
      ...options
    };
    
    // Initialize stats
    this.stats = {
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
    };
    
    // Use global instances by default
    this.attackers = globalAttackerPool;
    this.networkTopology = globalNetworkTopology;
    
    // Adjust attacker skills based on options
    this.updateAttackerSkills();
  }
  
  // Set callback for attack generation
  setOnAttackGenerated(callback: (attack: AttackResult) => void) {
    this.onAttackGenerated = callback;
  }
  
  // Set callback for stats updates
  setOnStatsUpdated(callback: (stats: SimulationStats) => void) {
    this.onStatsUpdated = callback;
  }
  
  // Set callback for RSU updates
  setOnRsusUpdated(callback: (rsus: any[]) => void) {
    this.onRsusUpdated = callback;
  }
  
  // Update attacker skills based on simulation options
  private updateAttackerSkills() {
    const skillFactor = this.options.attackerSkillLevel / 100;
    
    // Adjust attacker skills based on options
    this.attackers.attackers.forEach(attacker => {
      attacker.profile.skill = Math.min(1, 0.2 + skillFactor * 0.8);
      attacker.profile.resources = Math.min(1, 0.2 + skillFactor * 0.8);
      attacker.profile.stealthiness = Math.min(1, 0.2 + skillFactor * 0.8);
    });
    
    // Update stats
    this.stats.activeAttackers = this.attackers.attackers.length;
  }
  
  // Start the simulation
  start(rsus: any[]) {
    if (this.running) return;
    
    this.running = true;
    this.lastSimulationTime = Date.now();
    
    // Initialize network topology with RSUs
    this.networkTopology.initializeFromRSUs(rsus);
    
    // Calculate initial interval based on attack frequency
    const baseInterval = this.calculateSimulationInterval();
    
    console.log(`Starting realistic attack simulation with interval: ${baseInterval}ms`);
    
    // Show toast notification
    toast({
      title: "Realistic Attack Simulation Started",
      description: "Advanced attacks with network effects are now being simulated",
    });
    
    // Start the simulation loop
    this.simulationTimer = setInterval(() => this.simulationCycle(rsus), baseInterval);
  }
  
  // Stop the simulation
  stop() {
    if (!this.running) return;
    
    this.running = false;
    
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    
    console.log("Stopped realistic attack simulation");
    
    // Show toast notification
    toast({
      title: "Attack Simulation Stopped",
      description: "The realistic attack simulation has been stopped",
    });
  }
  
  // Update simulation options
  updateOptions(options: Partial<AttackSimulationOptions>) {
    this.options = { ...this.options, ...options };
    
    // Update attacker skills
    this.updateAttackerSkills();
    
    // Update simulation interval if running
    if (this.running && this.simulationTimer) {
      clearInterval(this.simulationTimer);
      const newInterval = this.calculateSimulationInterval();
      this.simulationTimer = setInterval(() => this.simulationCycle(Array.from(this.networkTopology.nodes.values())), newInterval);
    }
  }
  
  // Reset simulation statistics
  resetStats() {
    this.stats = {
      attacksAttempted: 0,
      attacksSuccessful: 0,
      attacksDetected: 0,
      attacksMitigated: 0,
      rsusCompromised: 0,
      rsusQuarantined: 0,
      trustUpdates: 0,
      blockchainTxs: 0,
      activeAttackers: this.attackers.attackers.length,
      networkDegradation: 0
    };
    
    // Notify listeners
    if (this.onStatsUpdated) {
      this.onStatsUpdated(this.stats);
    }
  }
  
  // Get current simulation statistics
  getStats(): SimulationStats {
    return { ...this.stats };
  }
  
  // Calculate delay between simulation cycles based on options
  private calculateSimulationInterval(): number {
    // Base interval adjusted by attack frequency
    const frequencyFactor = this.options.attackFrequency / 100;
    let interval = 15000 * (1 - frequencyFactor * 0.8);
    
    // Adjust for real-time vs accelerated simulation
    if (!this.options.realTimeSimulation) {
      interval = interval / 3; // 3x faster for accelerated simulation
    }
    
    // Ensure interval is reasonable
    return Math.max(3000, Math.min(30000, interval));
  }
  
  // Main simulation cycle
  private async simulationCycle(rsus: any[]) {
    if (!this.running) return;
    
    try {
      // Update network topology with latest RSU data
      this.networkTopology.initializeFromRSUs(rsus);
      
      // Calculate attack probability based on frequency setting
      const attackProbability = (this.options.attackFrequency / 100) * 0.7;
      
      // Determine defense level normalized to 0-1
      const defenseLevel = this.options.defenseLevel / 100;
      
      // Get list of compromised RSUs for advanced attacks
      const compromisedRSUs = this.networkTopology.getCompromisedRSUs();
      
      // For each RSU, determine if it should be attacked
      const attackResults: AttackResult[] = [];
      const updatedRsus = [...rsus];
      let trustUpdates = 0;
      let blockchainTxs = 0;
      
      for (const rsu of updatedRsus) {
        // Skip already quarantined RSUs
        if (rsu.quarantined) continue;
        
        // For each RSU, there's a chance of attack
        if (Math.random() < attackProbability) {
          // Get a random attacker from the pool
          const attacker = this.attackers.getRandomAttacker();
          
          // Attacker attempts an attack
          const { success, detected, attack, attackerId } = attacker.attemptAttack(
            rsu.rsu_id,
            defenseLevel
          );
          
          // Increment attempted attacks counter
          this.stats.attacksAttempted++;
          
          // Skip if no suitable attack was found
          if (!attack) continue;
          
          // Determine if the attack is mitigated
          const mitigationChance = defenseLevel * (detected ? 0.8 : 0.2);
          const mitigated = detected && Math.random() < mitigationChance;
          
          if (mitigated) {
            this.stats.attacksMitigated++;
          }
          
          // Create attack result
          const attackResult: AttackResult = {
            id: `attack-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
            attackerId,
            attackerProfile: attacker.profile.name,
            targetId: rsu.rsu_id,
            targetType: 'RSU',
            attack,
            success: success && !mitigated,
            detected,
            mitigated,
            affectedNodes: [],
            trustImpact: success && !mitigated ? attack.trustImpact : 0,
            networkImpact: success && !mitigated ? attack.networkImpact : 0,
            isSimulated: true
          };
          
          // Update attack statistics
          if (success && !mitigated) {
            this.stats.attacksSuccessful++;
            
            // Apply attack to network topology if network effects are enabled
            if (this.options.enableNetworkEffects) {
              this.networkTopology.applyAttackToNode(rsu.rsu_id, attack);
              
              // Add affected nodes
              const node = this.networkTopology.getNode(rsu.rsu_id);
              if (node) {
                attackResult.affectedNodes = node.connections
                  .map(conn => conn.targetId)
                  .filter(id => id !== rsu.rsu_id);
              }
            }
            
            // Update RSU status based on attack
            if (attack.severity === 'Critical') {
              rsu.attack_detected = true;
              
              // Check for full compromise
              if (attack.id === 'compromise') {
                // 50% chance of quarantine for compromised RSUs
                if (Math.random() < 0.5) {
                  rsu.quarantined = true;
                  this.stats.rsusQuarantined++;
                } else {
                  this.stats.rsusCompromised++;
                }
              } else {
                this.stats.rsusCompromised++;
              }
            } else if (attack.severity === 'High' || attack.severity === 'Medium') {
              rsu.attack_detected = true;
            }
            
            // Update trust score
            const oldTrustScore = rsu.trust_score || 90;
            rsu.trust_score = Math.max(0, oldTrustScore - attack.trustImpact);
            rsu.trust_score_change = rsu.trust_score - oldTrustScore;
            
            // Count as trust update
            trustUpdates++;
            
            // Log significant trust changes to blockchain
            if (Math.abs(rsu.trust_score_change) >= 10 || rsu.quarantined) {
              try {
                await stakeTrust(
                  rsu.rsu_id,
                  rsu.trust_score,
                  `ATTACK_${attack.id.toUpperCase()}`
                );
                blockchainTxs++;
              } catch (error) {
                console.error(`Failed to log attack to blockchain for RSU ${rsu.rsu_id}:`, error);
              }
            }
          }
          
          if (detected) {
            this.stats.attacksDetected++;
          }
          
          // Add attack result to the list
          attackResults.push(attackResult);
        }
      }
      
      // Calculate network degradation
      const networkStats = this.networkTopology.getNetworkStats();
      this.stats.networkDegradation = 1 - (networkStats.averageThroughput / 100);
      
      // Update simulation stats
      this.stats.rsusCompromised = updatedRsus.filter(r => r.attack_detected && !r.quarantined).length;
      this.stats.rsusQuarantined = updatedRsus.filter(r => r.quarantined).length;
      this.stats.trustUpdates += trustUpdates;
      this.stats.blockchainTxs += blockchainTxs;
      
      // Notify listeners about new attacks
      if (this.onAttackGenerated && attackResults.length > 0) {
        attackResults.forEach(attack => {
          if (this.onAttackGenerated) this.onAttackGenerated(attack);
        });
      }
      
      // Notify listeners about updated stats
      if (this.onStatsUpdated) {
        this.onStatsUpdated(this.stats);
      }
      
      // Notify listeners about updated RSUs
      if (this.onRsusUpdated) {
        this.onRsusUpdated(updatedRsus);
      }
      
      // Update last simulation time
      this.lastSimulationTime = Date.now();
      
      return {
        attackResults,
        updatedRsus,
        stats: { ...this.stats }
      };
    } catch (error) {
      console.error("Error in attack simulation cycle:", error);
      return null;
    }
  }
}

// Create and export a global attack simulation engine
export const globalAttackSimulationEngine = new AttackSimulationEngine();
