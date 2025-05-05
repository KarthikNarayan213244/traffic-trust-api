
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";
import { stakeTrust } from "@/services/blockchain";

// Trust calculation parameters
const TRUST_INCREASE_FACTOR = 0.01;  // If no anomaly, increase trust by this factor * (1-currentTrust)
const TRUST_DECREASE_FACTOR = 0.1;   // If anomaly detected, decrease trust by this factor * severity
const DEFAULT_TRUST_SCORE = 90;      // Default trust score for new RSUs
const BLOCKCHAIN_UPDATE_THRESHOLD = 2; // Minimum trust change to trigger blockchain update

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
  blockchainTxId?: string; // Last blockchain transaction ID
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
  blockchainUpdated: boolean;
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
      console.log(`Found ${newAnomalies.length} new anomalies for RSU ${rsuId}`);
      
      // Add new anomalies to history
      securityState.anomalyHistory.push(
        ...newAnomalies.map(a => ({
          timestamp: a.timestamp,
          type: a.type,
          severity: a.severity === 'High' || a.severity === 'Critical' ? 1.0 : 
                    a.severity === 'Medium' ? 0.6 : 0.3
        }))
      );
      
      // Keep only last 20 anomalies in history
      if (securityState.anomalyHistory.length > 20) {
        securityState.anomalyHistory = securityState.anomalyHistory.slice(-20);
      }
      
      // Consecutive anomalies counter
      securityState.consecutiveAnomalies += 1;
      
      console.log(`RSU ${rsuId} now has ${securityState.consecutiveAnomalies} consecutive anomalies`);
    } else {
      // Reset consecutive anomalies if no new anomalies
      securityState.consecutiveAnomalies = Math.max(0, securityState.consecutiveAnomalies - 1);
    }
    
    // Update quarantine status
    if (securityState.consecutiveAnomalies >= 3) {
      securityState.attackDetected = true;
      console.log(`Attack detected on RSU ${rsuId}`);
      
      if (securityState.consecutiveAnomalies >= 5) {
        securityState.quarantined = true;
        console.log(`RSU ${rsuId} has been quarantined!`);
      }
    }
    
    // Calculate new trust score using the update rule
    let newTrustScore;
    const oldScore = currentTrustScore || DEFAULT_TRUST_SCORE;
    
    if (newAnomalies.length === 0) {
      // If no anomaly: Tₙ₊₁ = Tₙ + 0.01·(1–Tₙ/100)
      newTrustScore = oldScore + TRUST_INCREASE_FACTOR * (100 - oldScore);
    } else {
      // If anomaly: Tₙ₊₁ = Tₙ – 0.1·severity*100
      const avgSeverity = newAnomalies.reduce((sum, a) => {
        const severityValue = a.severity === 'High' || a.severity === 'Critical' ? 1.0 : 
                             a.severity === 'Medium' ? 0.6 : 0.3;
        return sum + severityValue;
      }, 0) / newAnomalies.length;
      
      newTrustScore = oldScore - TRUST_DECREASE_FACTOR * (avgSeverity * 100);
      console.log(`Trust score for RSU ${rsuId} decreased from ${oldScore} to ${newTrustScore} due to anomalies`);
    }
    
    // Ensure trust score stays between 0 and 100
    newTrustScore = Math.min(100, Math.max(0, newTrustScore));
    
    // Update lastUpdateTime
    securityState.lastUpdateTime = now.toISOString();
    
    // Determine if blockchain update is needed
    const trustChange = Math.round(newTrustScore - oldScore);
    const blockchainUpdateNeeded = 
      Math.abs(trustChange) >= BLOCKCHAIN_UPDATE_THRESHOLD || 
      securityState.attackDetected || 
      securityState.quarantined;
    
    if (blockchainUpdateNeeded) {
      console.log(`RSU ${rsuId} trust score change of ${trustChange} requires blockchain update`);
    }
    
    return {
      score: Math.round(newTrustScore),
      change: trustChange,
      attackDetected: securityState.attackDetected,
      quarantined: securityState.quarantined,
      blockchainUpdated: blockchainUpdateNeeded
    };
  } catch (error) {
    console.error("Error calculating RSU trust score:", error);
    
    // Return current trust score if there's an error
    return {
      score: currentTrustScore || DEFAULT_TRUST_SCORE,
      change: 0,
      attackDetected: false,
      quarantined: false,
      blockchainUpdated: false
    };
  }
};

// Update trust scores for all RSUs
export const updateRsuTrustScores = async (
  rsus: any[],
  anomalies: any[]
): Promise<any[]> => {
  try {
    console.log(`Updating trust scores for ${rsus.length} RSUs with ${anomalies.length} anomalies`);
    
    // Count of blockchain transactions in this update
    let blockchainTransactions = 0;
    
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
        last_updated: new Date().toISOString(),
        blockchain_protected: trustResult.blockchainUpdated
      };
      
      // Log trust update to blockchain if needed
      if (trustResult.blockchainUpdated) {
        try {
          // Prepare reason code
          const reasonCode = trustResult.quarantined ? 'RSU_QUARANTINED' : 
                            trustResult.attackDetected ? 'ATTACK_DETECTED' : 
                            'TRUST_UPDATE';
          
          // Use blockchain staking for significant trust changes
          const txId = await stakeTrust(
            rsu.rsu_id, 
            trustResult.score,
            reasonCode
          );
          
          // Store blockchain transaction ID
          const securityState = rsuSecurityStates[rsu.rsu_id];
          if (securityState) {
            securityState.blockchainTxId = txId;
          }
          
          blockchainTransactions++;
          console.log(`Successfully logged trust update for RSU ${rsu.rsu_id} to blockchain: ${trustResult.score}, txId: ${txId}`);
          
          // Show toast for quarantined RSUs
          if (trustResult.quarantined) {
            toast({
              title: "RSU Quarantined",
              description: `RSU ${rsu.rsu_id} has been quarantined due to suspicious activity. Trust score: ${trustResult.score}`,
              variant: "destructive"
            });
          } else if (trustResult.attackDetected) {
            toast({
              title: "Attack Detected",
              description: `Attack detected on RSU ${rsu.rsu_id}. Trust score decreased to: ${trustResult.score}`,
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error(`Failed to log trust update to blockchain for RSU ${rsu.rsu_id}:`, error);
        }
      }
      
      return updatedRsu;
    }));
    
    // Log blockchain transaction summary
    if (blockchainTransactions > 0) {
      console.log(`Updated ${blockchainTransactions} RSU trust scores on blockchain`);
      toast({
        title: "Trust Scores Updated",
        description: `Updated ${blockchainTransactions} RSU trust scores on the blockchain`,
        variant: "default"
      });
    }
    
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
    {type: "Malicious Data Injection", severity: "Critical"},
    {type: "Message Replay", severity: "Medium"},
    {type: "Protocol Violation", severity: "Low"}
  ];
  
  // For each RSU, determine if it should be attacked
  rsus.forEach(rsu => {
    // Skip already quarantined RSUs
    if (rsu.quarantined) return;
    
    // Random chance to generate an attack, increased if attack probability is higher
    if (Math.random() < attackProbability) {
      const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      
      // Create the anomaly record
      const anomalyId = `sim-anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      generatedAnomalies.push({
        id: anomalyId,
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
