
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
    this.networkTopology.initializeFromRSUs(initialRsus);
    
    // Add attackers to the pool
    for (let i = 0; i < 5; i++) {
      this.attackerPool.addAttacker();
    }
    
    const interval = this.calculateSimulationInterval();
    const nodes = Array.from(this.networkTopology.nodes.values());
    this.simulationTimer = setInterval(() => this.simulationCycle(nodes), interval);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.simulationTimer);
    
    // Clear the attackers
    while (this.attackerPool.attackers.length > 0) {
      this.attackerPool.removeAttacker(0);
    }
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
    
    // Get a random attack vector and convert it to Attack type
    const attackVector: AttackVector = getRandomAttackVector();
    const attack: Attack = this.convertVectorToAttack(attackVector);
    
    const attacker: Attacker = this.attackerPool.getRandomAttacker();
    const attackSuccess = Math.random() < (attacker.profile.skill);
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
      attackerProfile: attacker.profile.name,
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

  // Convert AttackVector to Attack for consistency
  private convertVectorToAttack(vector: AttackVector): Attack {
    return {
      id: vector.id,
      name: vector.name,
      description: vector.description,
      severity: vector.severity,
      category: this.getCategoryForAttack(vector.id),
      targetType: 'RSU',
      likelyImpact: `Reduces trust score by ${vector.trustImpact}% and affects network performance by ${vector.networkImpact * 100}%`,
      prerequisites: vector.requiresCompromisedRSU ? ['Compromised RSU Access'] : [],
      mitigationStrategies: [vector.mitigationStrategy],
      executionDetails: {
        method: 'Automated Simulation',
        payload: { signature: vector.signature }
      }
    };
  }

  // Helper to determine the category for an attack
  private getCategoryForAttack(attackId: string): string {
    const attackVectors = require('./attackTypes').ATTACK_VECTORS;
    for (const [category, attacks] of Object.entries(attackVectors)) {
      if (Array.isArray(attacks) && attacks.some((a: any) => a.id === attackId)) {
        return category;
      }
    }
    return 'unknown';
  }

  private updateNetworkEffects(rsus: any[]) {
    if (!this.running) return;
    
    let totalNetworkDegradation = 0;
    
    rsus.forEach(rsu => {
      // For each RSU, get its neighboring RSUs
      const neighborIds = this.getNeighboringRSUs(rsu.id, rsus);
      
      neighborIds.forEach(neighborId => {
        const neighbor = rsus.find(r => r.rsu_id === neighborId);
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

  // Helper method to get neighboring RSUs based on location proximity
  private getNeighboringRSUs(rsuId: string, allRsus: any[]): string[] {
    const currentRsu = allRsus.find(r => r.rsu_id === rsuId);
    if (!currentRsu) return [];
    
    // Simple proximity calculation (in real world, would use actual network topology)
    return allRsus
      .filter(r => r.rsu_id !== rsuId)
      .filter(r => this.calculateDistance(
        { lat: currentRsu.lat, lng: currentRsu.lng },
        { lat: r.lat, lng: r.lng }
      ) < 3) // 3km radius
      .map(r => r.rsu_id);
  }

  // Calculate distance between two points in km
  private calculateDistance(
    point1: { lat: number, lng: number }, 
    point2: { lat: number, lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.degreesToRadians(point2.lat - point1.lat);
    const dLon = this.degreesToRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(point1.lat)) * Math.cos(this.degreesToRadians(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI/180);
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
      const nodes = Array.from(this.networkTopology.nodes.values());
      this.simulationTimer = setInterval(() => this.simulationCycle(nodes), newInterval);
    }
  }
}

export const globalAttackSimulationEngine = new AttackSimulationEngine();
