import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";
import { stakeTrust } from "@/services/blockchain";

// Trust calculation parameters
const TRUST_INCREASE_FACTOR = 0.01;  // If no anomaly, increase trust by this factor * (1-currentTrust)
const TRUST_DECREASE_FACTOR = 0.1;   // If anomaly detected, decrease trust by this factor * severity
const DEFAULT_TRUST_SCORE = 90;      // Default trust score for new RSUs

// Keep track of RSU security status
interface RsuSecurityState {
  anomalyHistory: {
    timestamp: string;
    type: string;
    severity: number;
  }[];
  attackDetected: boolean;
  quarantined: boolean;
  lastUpdateTime: string;
  consecutiveAnomalies: number;
}

// RSU security state storage
const rsuSecurityStates: Record<string, RsuSecurityState> = {};

// Initialize RSU security state if not exists
const initRsuSecurityState = (rsuId: string): RsuSecurityState => {
  if (!rsuSecurityStates[rsuId]) {
    rsuSecurityStates[rsuId] = {
      anomalyHistory: [],
      attackDetected: false,
      quarantined: false,
      lastUpdateTime: new Date().toISOString(),
      consecutiveAnomalies: 0
    };
  }
  return rsuSecurityStates[rsuId];
};

// Calculate RSU trust score using the specified update rule
export const calculateRsuTrustScore = (
  rsuId: string,
  currentTrustScore: number,
  anomalies: any[]
): { 
  score: number;
  change: number;
  attackDetected: boolean;
  quarantined: boolean;
} => {
  try {
    // Get or initialize RSU security state
    const securityState = initRsuSecurityState(rsuId);
    
    // Find anomalies associated with this RSU
    const rsuAnomalies = anomalies.filter(a => 
      a.target_id === rsuId && a.target_type === 'RSU'
    );
    
    // Update security state with new anomalies
    const now = new Date();
    const newAnomalies = rsuAnomalies.filter(a => {
      const anomalyTime = new Date(a.timestamp);
      const timeSinceLastUpdate = new Date(securityState.lastUpdateTime);
      return anomalyTime > timeSinceLastUpdate;
    });
    
    if (newAnomalies.length > 0) {
      // Add new anomalies to history
      securityState.anomalyHistory.push(
        ...newAnomalies.map(a => ({
          timestamp: a.timestamp,
          type: a.type,
          severity: a.severity === 'High' ? 1.0 : 
                    a.severity === 'Medium' ? 0.6 : 0.3
        }))
      );
      
      // Keep only last 20 anomalies in history
      if (securityState.anomalyHistory.length > 20) {
        securityState.anomalyHistory = securityState.anomalyHistory.slice(-20);
      }
      
      // Consecutive anomalies counter
      securityState.consecutiveAnomalies += 1;
    } else {
      // Reset consecutive anomalies if no new anomalies
      securityState.consecutiveAnomalies = 0;
    }
    
    // Update quarantine status
    if (securityState.consecutiveAnomalies >= 3) {
      securityState.attackDetected = true;
      
      if (securityState.consecutiveAnomalies >= 5) {
        securityState.quarantined = true;
      }
    }
    
    // Calculate new trust score using the update rule
    let newTrustScore;
    const oldScore = currentTrustScore || DEFAULT_TRUST_SCORE;
    
    if (newAnomalies.length === 0) {
      // If no anomaly: Tₙ₊₁ = Tₙ + 0.01·(1–Tₙ)
      newTrustScore = oldScore + TRUST_INCREASE_FACTOR * (100 - oldScore);
    } else {
      // If anomaly: Tₙ₊₁ = Tₙ – 0.1·severity
      const avgSeverity = newAnomalies.reduce((sum, a) => {
        const severityValue = a.severity === 'High' ? 1.0 : 
                             a.severity === 'Medium' ? 0.6 : 0.3;
        return sum + severityValue;
      }, 0) / newAnomalies.length;
      
      newTrustScore = oldScore - TRUST_DECREASE_FACTOR * (avgSeverity * 100);
    }
    
    // Ensure trust score stays between 0 and 100
    newTrustScore = Math.min(100, Math.max(0, newTrustScore));
    
    // Update lastUpdateTime
    securityState.lastUpdateTime = now.toISOString();
    
    return {
      score: Math.round(newTrustScore),
      change: Math.round(newTrustScore - oldScore),
      attackDetected: securityState.attackDetected,
      quarantined: securityState.quarantined
    };
  } catch (error) {
    console.error("Error calculating RSU trust score:", error);
    
    // Return current trust score if there's an error
    return {
      score: currentTrustScore || DEFAULT_TRUST_SCORE,
      change: 0,
      attackDetected: false,
      quarantined: false
    };
  }
};

// Update trust scores for all RSUs
export const updateRsuTrustScores = async (
  rsus: any[],
  anomalies: any[]
): Promise<any[]> => {
  try {
    // Update each RSU with a new trust score
    const updatedRsus = await Promise.all(rsus.map(async (rsu) => {
      const trustResult = calculateRsuTrustScore(
        rsu.rsu_id,
        rsu.trust_score || DEFAULT_TRUST_SCORE,
        anomalies
      );
      
      const updatedRsu = {
        ...rsu,
        trust_score: trustResult.score,
        trust_score_change: trustResult.change,
        attack_detected: trustResult.attackDetected,
        quarantined: trustResult.quarantined,
        last_updated: new Date().toISOString()
      };
      
      // Log trust update to blockchain if significant change or security status change
      if (Math.abs(trustResult.change) >= 2 || 
          trustResult.attackDetected || 
          trustResult.quarantined) {
        try {
          // Use blockchain staking for significant trust changes
          await stakeTrust(
            rsu.rsu_id, 
            trustResult.score,
            `RSU_TRUST_UPDATE${trustResult.quarantined ? '_QUARANTINED' : 
              trustResult.attackDetected ? '_ATTACKED' : ''}`
          );
          console.log(`Logged trust update for RSU ${rsu.rsu_id} to blockchain: ${trustResult.score}`);
        } catch (error) {
          console.error(`Failed to log trust update to blockchain for RSU ${rsu.rsu_id}:`, error);
        }
      }
      
      return updatedRsu;
    }));
    
    return updatedRsus;
  } catch (error) {
    console.error("Error updating RSU trust scores:", error);
    return rsus;
  }
};

// Generate synthetic attacks on RSUs for simulation purposes
export const generateRsuAttacks = (
  rsus: any[],
  attackProbability: number = 0.05
): any[] => {
  const generatedAnomalies: any[] = [];
  const now = new Date().toISOString();
  
  // Possible attack types
  const attackTypes = [
    {type: "Sybil Attack", severity: "High"},
    {type: "Data Tampering", severity: "Medium"},
    {type: "Denial of Service", severity: "High"},
    {type: "Malicious Data Injection", severity: "High"},
    {type: "Message Replay", severity: "Medium"},
    {type: "Protocol Violation", severity: "Low"}
  ];
  
  // For each RSU, determine if it should be attacked
  rsus.forEach(rsu => {
    // Skip already quarantined RSUs
    if (rsu.quarantined) return;
    
    // Random chance to generate an attack
    if (Math.random() < attackProbability) {
      const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      
      // Create the anomaly record
      generatedAnomalies.push({
        id: `sim-anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: attack.type,
        timestamp: now,
        message: `Simulated ${attack.type} detected on RSU ${rsu.rsu_id}`,
        severity: attack.severity,
        status: "Detected",
        vehicle_id: null,
        target_id: rsu.rsu_id,
        target_type: "RSU",
        is_simulated: true
      });
      
      console.log(`Generated simulated ${attack.type} attack on RSU ${rsu.rsu_id}`);
    }
  });
  
  return generatedAnomalies;
};
