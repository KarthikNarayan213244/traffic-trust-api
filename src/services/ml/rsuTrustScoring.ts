
import * as tf from '@tensorflow/tfjs';
import { createRsuAttackEntry } from "@/services/api/rsuTrustLedger";

// Supported attack types
const ATTACK_TYPES = [
  'Sybil Attack',
  'Denial of Service',
  'GPS Spoofing',
  'Malicious Data Injection',
  'Replay Attack'
];

// Generate simulated RSU attacks
export function generateRsuAttacks(rsus: any[], probability: number = 0.2): any[] {
  if (!rsus || !Array.isArray(rsus) || rsus.length === 0) {
    console.warn("No RSUs provided for attack simulation");
    return [];
  }
  
  const attacks: any[] = [];
  
  // For each RSU, decide if it will be attacked
  rsus.forEach(rsu => {
    // Skip RSUs that don't have an ID
    if (!rsu.rsu_id) return;
    
    // Determine if this RSU will be attacked
    if (Math.random() < probability) {
      // Random attack type
      const attackType = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
      
      // Random severity
      const severities = ['Low', 'Medium', 'High', 'Critical'];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      // Generate trust impact based on severity
      const oldTrust = Math.floor(Math.random() * 20) + 80; // 80-100 range
      let newTrust;
      
      switch (severity) {
        case 'Critical':
          newTrust = Math.max(0, oldTrust - (Math.random() * 30 + 20)); // 20-50 drop
          break;
        case 'High':
          newTrust = Math.max(0, oldTrust - (Math.random() * 20 + 10)); // 10-30 drop
          break;
        case 'Medium':
          newTrust = Math.max(0, oldTrust - (Math.random() * 10 + 5)); // 5-15 drop
          break;
        case 'Low':
        default:
          newTrust = Math.max(0, oldTrust - (Math.random() * 5 + 1)); // 1-6 drop
          break;
      }
      
      // Round trust values
      newTrust = Math.round(newTrust);
      
      // Generate attack message
      const messages = [
        `${attackType} detected on ${rsu.rsu_id} with ${severity.toLowerCase()} severity`,
        `Security alert: ${attackType} targeting ${rsu.rsu_id}`,
        `${severity} alert: ${attackType} affecting ${rsu.rsu_id}`,
        `${rsu.rsu_id} compromised by ${attackType}`,
        `Network integrity breach: ${attackType} on ${rsu.rsu_id}`
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Add attack to list
      attacks.push({
        rsu_id: rsu.rsu_id,
        attack_type: attackType,
        severity: severity,
        details: message,
        old_trust: oldTrust,
        new_trust: newTrust,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return attacks;
}

// Detect RSU attacks from anomaly data and store them
export async function detectAndStoreRsuAttacks(anomalies: any[]): Promise<any[]> {
  try {
    if (!anomalies || !Array.isArray(anomalies) || anomalies.length === 0) {
      return [];
    }
    
    const rsuAttacks = [];
    
    // Filter for RSU-related anomalies
    const rsuAnomalies = anomalies.filter(anomaly => 
      (anomaly.target_type === 'RSU' || 
       (anomaly.target_id && anomaly.target_id.includes('RSU')) ||
       (anomaly.details && anomaly.details.toLowerCase().includes('rsu')))
    );
    
    // Process each anomaly and create RSU attack entries
    for (const anomaly of rsuAnomalies) {
      try {
        const attackEntry = {
          rsu_id: anomaly.target_id || anomaly.rsu_id || 'RSU-unknown',
          attack_type: anomaly.type || 'Unknown Attack',
          severity: anomaly.severity || 'Medium',
          details: anomaly.message || anomaly.details || `Attack detected on ${anomaly.target_id || 'RSU'}`,
          old_trust: anomaly.old_trust || 90,
          new_trust: anomaly.new_trust || 70
        };
        
        // Store attack in RSU trust ledger
        const result = await createRsuAttackEntry(attackEntry);
        rsuAttacks.push(result);
      } catch (error) {
        console.error("Failed to process RSU anomaly:", error);
      }
    }
    
    return rsuAttacks;
  } catch (error) {
    console.error("Error detecting and storing RSU attacks:", error);
    return [];
  }
}

// Calculate new trust score for an RSU after an attack
export function calculateRsuTrustAfterAttack(currentTrust: number, attackType: string, severity: string): number {
  // Default impact values
  const impacts = {
    'Sybil Attack': { Critical: 40, High: 30, Medium: 20, Low: 10 },
    'Denial of Service': { Critical: 50, High: 35, Medium: 25, Low: 15 },
    'GPS Spoofing': { Critical: 45, High: 30, Medium: 20, Low: 10 },
    'Malicious Data Injection': { Critical: 40, High: 30, Medium: 20, Low: 10 },
    'Replay Attack': { Critical: 35, High: 25, Medium: 15, Low: 5 },
    'Default': { Critical: 40, High: 30, Medium: 20, Low: 10 }
  };
  
  // Get impact based on attack type and severity
  const impactCategory = impacts[attackType] || impacts['Default'];
  const impact = impactCategory[severity] || impactCategory['Medium'];
  
  // Calculate new trust score
  const newTrust = Math.max(0, currentTrust - impact);
  
  return Math.round(newTrust);
}
