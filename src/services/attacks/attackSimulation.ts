import { AttackVector, ALL_ATTACK_VECTORS, getRandomAttackVector } from './attackTypes';
import { Attacker, AttackerPool, globalAttackerPool } from './attackerModel';
import { NetworkTopology, globalNetworkTopology } from './networkSimulation';
import { v4 as uuidv4 } from 'uuid';

export interface Attack {
  id: string;
  name: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  targetType: 'RSU' | 'Vehicle' | 'Network';
  likelyImpact: string;
  prerequisites: string[];
  mitigationStrategies: string[];
  executionDetails: {
    method: string;
    payload: any;
  };
}

export interface AttackEvent {
  id: string;
  attack: Attack;
  attackerProfile: string;
  targetId: string;
  timestamp: Date;
  success: boolean;
  detected: boolean;
  mitigated: boolean;
  networkImpact: number;
  affectedNodes: string[];
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
  networkDegradation: number;
}

export interface AttackSimulationOptions {
  attackFrequency: number;
  attackerSkillLevel: number;
  defenseLevel: number;
  enableNetworkEffects: boolean;
  enableVisualization: boolean;
  realTimeSimulation: boolean;
}

export class AttackSimulationEngine {
  private running: boolean = false;
  private options: AttackSimulationOptions = {
    attackFrequency: 5,
    attackerSkillLevel: 50,
    defenseLevel: 70,
    enableNetworkEffects: true,
    enableVisualization: true,
    realTimeSimulation: true
  };
  private networkTopology: NetworkTopology = globalNetworkTopology;
  private attackerPool: AttackerPool = globalAttackerPool;
  private simulationTimer: any;
  private stats: SimulationStats = {
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
  private onAttackGeneratedCallback: ((attack: AttackEvent) => void) | null = null;
  private onStatsUpdatedCallback: ((stats: SimulationStats) => void) | null = null;
  private onRsusUpdatedCallback: ((rsus: any[]) => void) | null = null;

  constructor() {
    this.resetStats();
  }

  setOnAttackGenerated(callback: (attack: AttackEvent) => void) {
    this.onAttackGeneratedCallback = callback;
  }

  setOnStatsUpdated(callback: (stats: SimulationStats) => void) {
    this.onStatsUpdatedCallback = callback;
  }

  setOnRsusUpdated(callback: (rsus: any[]) => void) {
    this.onRsusUpdatedCallback = callback;
  }

  start(initialRsus: any[]) {
    if (this.running) return;
    this.running = true;
    this.networkTopology.initialize(initialRsus);
    this.attackerPool.seedAttackers(5);
    
    const interval = this.calculateSimulationInterval();
    this.simulationTimer = setInterval(() => this.simulationCycle(Array.from(this.networkTopology.nodes.values())), interval);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.simulationTimer);
    this.attackerPool.reset();
  }

  isRunning(): boolean {
    return this.running;
  }

  private calculateSimulationInterval(): number {
    // Slower = higher number
    const baseInterval = Math.max(1500, 3000 - (this.options.attackFrequency * 50));
    return baseInterval;
  }

  private simulationCycle(rsus: any[]) {
    if (!this.running) return;
    
    // Simulate attacks
    rsus.forEach(rsu => {
      if (Math.random() < (this.options.attackFrequency / 100)) {
        this.attemptAttack(rsu);
      }
    });
    
    // Update network effects
    if (this.options.enableNetworkEffects) {
      this.updateNetworkEffects(rsus);
    }
    
    // Update stats
    if (this.onStatsUpdatedCallback) {
      this.onStatsUpdatedCallback(this.stats);
    }
  }

  private attemptAttack(targetRsu: any) {
    if (!this.running) return;
    
    this.stats.attacksAttempted++;
    
    const attack: Attack = getRandomAttackVector();
    const attacker: Attacker = this.attackerPool.getRandomAttacker();
    const attackSuccess = Math.random() < (attacker.skillLevel / 100);
    const attackDetected = attackSuccess && (Math.random() > (this.options.defenseLevel / 100));
    const attackMitigated = attackDetected && (Math.random() > 0.5);
    const networkImpact = attackSuccess ? (Math.random() * 0.05) : 0;
    
    // Update RSU trust score based on attack
    if (attackSuccess) {
      targetRsu.trustScore -= (attack.severity === 'Critical' ? 0.3 : 0.1);
      targetRsu.trustScore = Math.max(0, targetRsu.trustScore);
      this.stats.rsusCompromised++;
    }
    
    // Update stats
    if (attackSuccess) this.stats.attacksSuccessful++;
    if (attackDetected) this.stats.attacksDetected++;
    if (attackMitigated) this.stats.attacksMitigated++;
    
    // Create attack event
    const attackEvent: AttackEvent = {
      id: uuidv4(),
      attack: attack,
      attackerProfile: attacker.profile,
      targetId: targetRsu.id,
      timestamp: new Date(),
      success: attackSuccess,
      detected: attackDetected,
      mitigated: attackMitigated,
      networkImpact: networkImpact,
      affectedNodes: [targetRsu.id]
    };
    
    // Trigger callback
    if (this.onAttackGeneratedCallback) {
      this.onAttackGeneratedCallback(attackEvent);
    }
  }

  private updateNetworkEffects(rsus: any[]) {
    if (!this.running) return;
    
    let totalNetworkDegradation = 0;
    
    rsus.forEach(rsu => {
      // Simulate trust propagation
      const neighbors = this.networkTopology.getNeighbors(rsu.id);
      neighbors.forEach(neighborId => {
        const neighbor = this.networkTopology.getNode(neighborId);
        if (neighbor) {
          // Propagate trust (or distrust)
          neighbor.trustScore += (rsu.trustScore - neighbor.trustScore) * 0.01;
          neighbor.trustScore = Math.max(0, Math.min(1, neighbor.trustScore));
          this.stats.trustUpdates++;
        }
      });
      
      // Simulate network degradation based on trust score
      const degradation = 1 - rsu.trustScore;
      totalNetworkDegradation += degradation;
    });
    
    // Normalize network degradation
    this.stats.networkDegradation = totalNetworkDegradation / rsus.length;
    
    // Update RSUs with new trust scores
    if (this.onRsusUpdatedCallback) {
      this.onRsusUpdatedCallback(rsus);
    }
  }

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
      activeAttackers: 0,
      networkDegradation: 0
    };
  }

  // Update simulation options
  updateOptions(options: Partial<AttackSimulationOptions>) {
    // Update simulation options
    this.options = {
      ...this.options,
      ...options
    };
    
    // Update simulation interval if already running
    if (this.running && this.simulationTimer) {
      clearInterval(this.simulationTimer);
      const newInterval = this.calculateSimulationInterval();
      this.simulationTimer = setInterval(() => this.simulationCycle(Array.from(this.networkTopology.nodes.values())), newInterval);
    }
  }
}

export const globalAttackSimulationEngine = new AttackSimulationEngine();
