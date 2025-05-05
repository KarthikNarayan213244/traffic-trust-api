
// Define various types of attacks against RSUs with detailed properties
export interface AttackVector {
  id: string;
  name: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  successProbability: number; // 0-1 probability of successful attack
  detectionDifficulty: number; // 0-1 how hard it is to detect (higher = harder)
  propagationFactor: number; // 0-1 likelihood to spread to connected RSUs
  trustImpact: number; // Amount of trust score reduction
  networkImpact: number; // Reduction in network performance (0-1)
  recoveryTime: number; // Time in seconds to recover if unmitigated
  requiresCompromisedRSU: boolean; // Whether this attack requires another compromised RSU
  signature: string[]; // Patterns that can be used to identify this attack
  mitigationStrategy: string; // How this attack can be mitigated
}

// Collection of attack vectors organized by category
export const ATTACK_VECTORS: Record<string, AttackVector[]> = {
  network: [
    {
      id: 'ddos',
      name: 'Distributed Denial of Service',
      description: 'Floods RSU with excessive traffic to disrupt services',
      severity: 'High',
      successProbability: 0.75,
      detectionDifficulty: 0.5,
      propagationFactor: 0.3,
      trustImpact: 15,
      networkImpact: 0.8,
      recoveryTime: 600,
      requiresCompromisedRSU: false,
      signature: ['high_bandwidth_usage', 'connection_flood', 'rapid_requests'],
      mitigationStrategy: 'Traffic filtering, rate limiting, and load balancing'
    },
    {
      id: 'jamming',
      name: 'Signal Jamming',
      description: 'Interferes with RSU wireless communications',
      severity: 'Critical',
      successProbability: 0.6,
      detectionDifficulty: 0.7,
      propagationFactor: 0.1,
      trustImpact: 25,
      networkImpact: 0.9,
      recoveryTime: 300,
      requiresCompromisedRSU: false,
      signature: ['signal_loss', 'communication_errors', 'intermittent_connectivity'],
      mitigationStrategy: 'Frequency hopping, signal boosting, and redundant channels'
    }
  ],
  protocol: [
    {
      id: 'sybil',
      name: 'Sybil Attack',
      description: 'Creates multiple fake identities to manipulate system',
      severity: 'High',
      successProbability: 0.65,
      detectionDifficulty: 0.8,
      propagationFactor: 0.5,
      trustImpact: 20,
      networkImpact: 0.4,
      recoveryTime: 900,
      requiresCompromisedRSU: false,
      signature: ['duplicate_ids', 'inconsistent_behavior', 'geographical_impossibilities'],
      mitigationStrategy: 'Strong identity verification and behavior analysis'
    },
    {
      id: 'replay',
      name: 'Message Replay',
      description: 'Captures and repeats legitimate messages to cause confusion',
      severity: 'Medium',
      successProbability: 0.8,
      detectionDifficulty: 0.6,
      propagationFactor: 0.2,
      trustImpact: 10,
      networkImpact: 0.3,
      recoveryTime: 180,
      requiresCompromisedRSU: false,
      signature: ['duplicate_messages', 'out_of_sequence_timestamps', 'repeated_patterns'],
      mitigationStrategy: 'Timestamp verification and nonce usage in communications'
    }
  ],
  data: [
    {
      id: 'injection',
      name: 'Malicious Data Injection',
      description: 'Inserts false data into the network to mislead vehicles',
      severity: 'Critical',
      successProbability: 0.7,
      detectionDifficulty: 0.75,
      propagationFactor: 0.6,
      trustImpact: 30,
      networkImpact: 0.5,
      recoveryTime: 1200,
      requiresCompromisedRSU: true,
      signature: ['data_inconsistency', 'logical_impossibilities', 'pattern_deviation'],
      mitigationStrategy: 'Data validation, cross-checking, and plausibility analysis'
    },
    {
      id: 'tampering',
      name: 'Data Tampering',
      description: 'Modifies legitimate data during transmission',
      severity: 'High',
      successProbability: 0.6,
      detectionDifficulty: 0.7,
      propagationFactor: 0.4,
      trustImpact: 20,
      networkImpact: 0.4,
      recoveryTime: 600,
      requiresCompromisedRSU: false,
      signature: ['checksum_failure', 'integrity_violations', 'modified_fields'],
      mitigationStrategy: 'Cryptographic signatures and data integrity checks'
    }
  ],
  infrastructure: [
    {
      id: 'mitm',
      name: 'Man-in-the-Middle',
      description: 'Intercepts communications between RSUs and vehicles',
      severity: 'Critical',
      successProbability: 0.5,
      detectionDifficulty: 0.85,
      propagationFactor: 0.3,
      trustImpact: 25,
      networkImpact: 0.6,
      recoveryTime: 1500,
      requiresCompromisedRSU: false,
      signature: ['routing_anomalies', 'certificate_mismatches', 'latency_spikes'],
      mitigationStrategy: 'TLS/SSL with certificate pinning and connection validation'
    },
    {
      id: 'compromise',
      name: 'RSU Compromise',
      description: 'Takes complete control of an RSU through software vulnerability',
      severity: 'Critical',
      successProbability: 0.4,
      detectionDifficulty: 0.9,
      propagationFactor: 0.7,
      trustImpact: 50,
      networkImpact: 0.7,
      recoveryTime: 3600,
      requiresCompromisedRSU: false,
      signature: ['unauthorized_access', 'unusual_commands', 'behavioral_changes'],
      mitigationStrategy: 'Regular security updates, intrusion detection, and hardware security modules'
    }
  ]
};

// Flattened list of all attack vectors for easy access
export const ALL_ATTACK_VECTORS = Object.values(ATTACK_VECTORS).flat();

// Get a random attack vector with optional category filter
export const getRandomAttackVector = (category?: string): AttackVector => {
  const vectors = category ? ATTACK_VECTORS[category] : ALL_ATTACK_VECTORS;
  return vectors[Math.floor(Math.random() * vectors.length)];
};
