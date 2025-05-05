
import { AttackVector, getRandomAttackVector, ALL_ATTACK_VECTORS } from './attackTypes';

// Profile of an attacker with specific capabilities and behaviors
export interface AttackerProfile {
  id: string;
  name: string;
  description: string;
  skill: number; // 0-1 skill level (higher = more skilled)
  persistence: number; // 0-1 how likely to continue attacks after failure
  preferredVectors: string[]; // IDs of preferred attack vectors
  adaptability: number; // 0-1 how quickly they adapt to defenses
  stealthiness: number; // 0-1 ability to avoid detection
  resources: number; // 0-1 level of resources available
  motivation: 'Financial' | 'Disruption' | 'Data Theft' | 'Research' | 'Nation State';
}

// Predefined attacker profiles
export const ATTACKER_PROFILES: AttackerProfile[] = [
  {
    id: 'script_kiddie',
    name: 'Script Kiddie',
    description: 'Uses pre-made tools with limited understanding',
    skill: 0.2,
    persistence: 0.3,
    preferredVectors: ['ddos', 'jamming'],
    adaptability: 0.1,
    stealthiness: 0.1,
    resources: 0.2,
    motivation: 'Disruption'
  },
  {
    id: 'hacktivist',
    name: 'Hacktivist',
    description: 'Motivated by ideology to disrupt services',
    skill: 0.5,
    persistence: 0.7,
    preferredVectors: ['ddos', 'sybil', 'tampering'],
    adaptability: 0.4,
    stealthiness: 0.3,
    resources: 0.4,
    motivation: 'Disruption'
  },
  {
    id: 'cybercriminal',
    name: 'Cybercriminal',
    description: 'Profit-driven attacker targeting valuable data',
    skill: 0.7,
    persistence: 0.6,
    preferredVectors: ['mitm', 'injection', 'replay'],
    adaptability: 0.6,
    stealthiness: 0.6,
    resources: 0.5,
    motivation: 'Financial'
  },
  {
    id: 'apts',
    name: 'Advanced Persistent Threat',
    description: 'Highly skilled group with significant resources',
    skill: 0.9,
    persistence: 0.9,
    preferredVectors: ['compromise', 'mitm', 'injection'],
    adaptability: 0.8,
    stealthiness: 0.9,
    resources: 0.8,
    motivation: 'Nation State'
  }
];

export class Attacker {
  profile: AttackerProfile;
  activeAttacks: Map<string, AttackVector> = new Map();
  failedAttempts: Map<string, number> = new Map();
  successfulAttacks: Map<string, number> = new Map();
  lastAttackTime: number = 0;

  constructor(profileId: string = '') {
    // Use specified profile or random profile
    if (profileId && ATTACKER_PROFILES.some(p => p.id === profileId)) {
      this.profile = ATTACKER_PROFILES.find(p => p.id === profileId)!;
    } else {
      this.profile = ATTACKER_PROFILES[Math.floor(Math.random() * ATTACKER_PROFILES.length)];
    }
  }

  // Select an attack vector based on attacker profile
  selectAttackVector(compromisedRSUs: string[] = []): AttackVector | null {
    // Determine if attacker can use advanced attacks that require compromised RSUs
    const canUseAdvancedAttacks = compromisedRSUs.length > 0;
    
    // Filter attacks based on attacker preferences and available resources
    let availableVectors = ALL_ATTACK_VECTORS.filter(vector => {
      // Skip attacks requiring compromised RSU if none are available
      if (vector.requiresCompromisedRSU && !canUseAdvancedAttacks) {
        return false;
      }
      
      // Calculate probability of selecting this vector
      const isPreferred = this.profile.preferredVectors.includes(vector.id);
      const skillMatch = vector.detectionDifficulty <= this.profile.skill;
      const resourceMatch = vector.successProbability <= this.profile.resources;
      
      return isPreferred || (skillMatch && resourceMatch);
    });
    
    // If no attacks available, fall back to basic attacks
    if (availableVectors.length === 0) {
      availableVectors = ALL_ATTACK_VECTORS.filter(vector => 
        !vector.requiresCompromisedRSU && vector.detectionDifficulty <= 0.3
      );
    }
    
    // Still no attacks? Return null
    if (availableVectors.length === 0) {
      return null;
    }
    
    // Select from available vectors with preference to favorites
    const preferredVectors = availableVectors.filter(v => 
      this.profile.preferredVectors.includes(v.id)
    );
    
    if (preferredVectors.length > 0 && Math.random() < 0.7) {
      return preferredVectors[Math.floor(Math.random() * preferredVectors.length)];
    }
    
    return availableVectors[Math.floor(Math.random() * availableVectors.length)];
  }

  // Attempt an attack on a specific target
  attemptAttack(targetId: string, networkDefenseLevel: number = 0.5): {
    success: boolean;
    detected: boolean;
    attack: AttackVector | null;
    attackerId: string;
  } {
    const attack = this.selectAttackVector();
    if (!attack) {
      return { 
        success: false, 
        detected: false, 
        attack: null,
        attackerId: this.profile.id
      };
    }
    
    // Calculate success probability based on attack and attacker characteristics
    let successProbability = attack.successProbability;
    successProbability *= (0.5 + this.profile.skill * 0.5); // Skill influence
    successProbability *= (1 - networkDefenseLevel * 0.8); // Defense influence
    
    // Adjust based on failed attempts (attacker learns)
    const previousFails = this.failedAttempts.get(attack.id) || 0;
    if (previousFails > 0) {
      const adaptationBonus = Math.min(0.3, previousFails * 0.05 * this.profile.adaptability);
      successProbability += adaptationBonus;
    }
    
    // Detection probability calculation
    let detectionProbability = 1 - attack.detectionDifficulty;
    detectionProbability *= (0.3 + networkDefenseLevel * 0.7); // Defense influence
    detectionProbability *= (1 - this.profile.stealthiness * 0.8); // Stealth influence
    
    // Determine outcomes
    const success = Math.random() < successProbability;
    const detected = Math.random() < detectionProbability;
    
    // Update attack history
    if (success) {
      this.successfulAttacks.set(attack.id, (this.successfulAttacks.get(attack.id) || 0) + 1);
      this.activeAttacks.set(targetId, attack);
    } else {
      this.failedAttempts.set(attack.id, (this.failedAttempts.get(attack.id) || 0) + 1);
    }
    
    this.lastAttackTime = Date.now();
    
    return {
      success,
      detected,
      attack,
      attackerId: this.profile.id
    };
  }

  // Check if attacker is persisting after detection
  continueAfterDetection(): boolean {
    return Math.random() < this.profile.persistence;
  }
  
  // Get attacker stats
  getStats() {
    return {
      profile: this.profile,
      activeAttackCount: this.activeAttacks.size,
      totalSuccessfulAttacks: Array.from(this.successfulAttacks.values())
        .reduce((sum, count) => sum + count, 0),
      totalFailedAttacks: Array.from(this.failedAttempts.values())
        .reduce((sum, count) => sum + count, 0)
    };
  }
}

// Create an attacker pool to simulate multiple attackers in the system
export class AttackerPool {
  attackers: Attacker[] = [];
  
  constructor(initialCount: number = 3) {
    for (let i = 0; i < initialCount; i++) {
      this.attackers.push(new Attacker());
    }
  }
  
  // Get a random attacker from the pool
  getRandomAttacker(): Attacker {
    return this.attackers[Math.floor(Math.random() * this.attackers.length)];
  }
  
  // Add a new attacker to the pool
  addAttacker(profileId: string = '') {
    this.attackers.push(new Attacker(profileId));
  }
  
  // Remove an attacker from the pool
  removeAttacker(index: number) {
    if (index >= 0 && index < this.attackers.length) {
      this.attackers.splice(index, 1);
    }
  }
  
  // Get overall stats for all attackers
  getPoolStats() {
    return {
      attackerCount: this.attackers.length,
      attackersByMotivation: this.attackers.reduce((acc, attacker) => {
        const motivation = attacker.profile.motivation;
        acc[motivation] = (acc[motivation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalActiveAttacks: this.attackers.reduce(
        (sum, attacker) => sum + attacker.activeAttacks.size, 0
      ),
      highSkillAttackerCount: this.attackers.filter(a => a.profile.skill > 0.7).length,
    };
  }
}

// Create and export a global attacker pool
export const globalAttackerPool = new AttackerPool(3);
