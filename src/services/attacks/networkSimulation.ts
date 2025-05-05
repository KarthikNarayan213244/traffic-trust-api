
import { AttackVector } from './attackTypes';

// Represents a connection between two nodes in the network
export interface NetworkConnection {
  sourceId: string;
  targetId: string;
  bandwidth: number;     // Max bandwidth in Mbps
  latency: number;       // Base latency in ms
  packetLoss: number;    // Base packet loss rate (0-1)
  encrypted: boolean;    // Whether connection is encrypted
  status: 'normal' | 'degraded' | 'disrupted' | 'down';
  activeAttacks: AttackVector[];
}

// State of a network node (RSU or Vehicle)
export interface NetworkNode {
  id: string;
  type: 'RSU' | 'Vehicle';
  status: 'normal' | 'degraded' | 'compromised' | 'quarantined';
  connections: NetworkConnection[];
  throughput: number;    // Current throughput in Mbps
  processingLoad: number; // Current CPU load (0-1)
  activeAttacks: AttackVector[];
  securityLevel: number; // Security level (0-1)
  detectionCapability: number; // Ability to detect attacks (0-1)
  lastUpdateTime: number; // Timestamp of last update
}

// Entire network topology
export class NetworkTopology {
  nodes: Map<string, NetworkNode> = new Map();
  connections: NetworkConnection[] = [];
  
  // Add a node to the network
  addNode(node: NetworkNode) {
    this.nodes.set(node.id, node);
  }
  
  // Get a node by ID
  getNode(nodeId: string): NetworkNode | undefined {
    return this.nodes.get(nodeId);
  }
  
  // Add a connection between nodes
  addConnection(connection: NetworkConnection) {
    // Add connection to the global list
    this.connections.push(connection);
    
    // Add connection to the source node
    const sourceNode = this.nodes.get(connection.sourceId);
    if (sourceNode) {
      sourceNode.connections.push(connection);
    }
    
    // Add a reverse connection for the target node
    const targetNode = this.nodes.get(connection.targetId);
    if (targetNode) {
      const reverseConnection = {
        ...connection,
        sourceId: connection.targetId,
        targetId: connection.sourceId
      };
      targetNode.connections.push(reverseConnection);
    }
  }
  
  // Find all connections between two nodes
  getConnections(nodeId1: string, nodeId2: string): NetworkConnection[] {
    return this.connections.filter(
      conn => (conn.sourceId === nodeId1 && conn.targetId === nodeId2) || 
              (conn.sourceId === nodeId2 && conn.targetId === nodeId1)
    );
  }
  
  // Apply attack effects to a node
  applyAttackToNode(nodeId: string, attack: AttackVector) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // Add attack to active attacks if not already present
    if (!node.activeAttacks.some(a => a.id === attack.id)) {
      node.activeAttacks.push(attack);
    }
    
    // Apply attack effects
    switch (attack.severity) {
      case 'Critical':
        node.status = 'compromised';
        node.processingLoad = Math.min(1, node.processingLoad + 0.5);
        node.throughput = Math.max(0, node.throughput * 0.2);
        break;
      case 'High':
        node.status = node.status === 'normal' ? 'degraded' : node.status;
        node.processingLoad = Math.min(1, node.processingLoad + 0.3);
        node.throughput = Math.max(0, node.throughput * 0.5);
        break;
      case 'Medium':
        node.status = node.status === 'normal' ? 'degraded' : node.status;
        node.processingLoad = Math.min(1, node.processingLoad + 0.2);
        node.throughput = Math.max(0, node.throughput * 0.7);
        break;
      case 'Low':
        node.processingLoad = Math.min(1, node.processingLoad + 0.1);
        node.throughput = Math.max(0, node.throughput * 0.9);
        break;
    }
    
    node.lastUpdateTime = Date.now();
    
    // Apply effects to connections from this node
    for (const connection of node.connections) {
      this.applyAttackToConnection(connection, attack);
    }
  }
  
  // Apply attack effects to a connection
  applyAttackToConnection(connection: NetworkConnection, attack: AttackVector) {
    // Add attack to active attacks if not already present
    if (!connection.activeAttacks.some(a => a.id === attack.id)) {
      connection.activeAttacks.push(attack);
    }
    
    // Apply effects based on attack type and severity
    if (attack.id === 'ddos' || attack.id === 'jamming') {
      connection.status = 'disrupted';
      connection.packetLoss = Math.min(1, connection.packetLoss + 0.4);
    } else if (attack.id === 'mitm') {
      connection.status = 'degraded';
      // MITM doesn't necessarily cause obvious performance degradation
      connection.latency = connection.latency * 1.5; // Slight latency increase
    } else {
      // General degradation for other attacks
      connection.status = 'degraded';
      connection.packetLoss = Math.min(1, connection.packetLoss + 0.2);
      connection.latency = connection.latency * 1.2;
    }
  }
  
  // Create a node from RSU data
  createNodeFromRSU(rsu: any): NetworkNode {
    return {
      id: rsu.rsu_id,
      type: 'RSU',
      status: rsu.quarantined ? 'quarantined' : 
              rsu.attack_detected ? 'compromised' : 
              (rsu.trust_score < 70) ? 'degraded' : 'normal',
      connections: [],
      throughput: 100, // 100 Mbps default
      processingLoad: 0.3, // 30% base load
      activeAttacks: [],
      securityLevel: (rsu.trust_score || 90) / 100,
      detectionCapability: 0.7, // 70% default detection capability
      lastUpdateTime: Date.now()
    };
  }
  
  // Create connections between RSUs based on proximity
  createConnectionsFromRSUs(rsus: any[]) {
    for (let i = 0; i < rsus.length; i++) {
      const rsu1 = rsus[i];
      
      for (let j = i + 1; j < rsus.length; j++) {
        const rsu2 = rsus[j];
        
        // Calculate distance between RSUs
        const distance = calculateDistance(
          { lat: rsu1.lat, lng: rsu1.lng },
          { lat: rsu2.lat, lng: rsu2.lng }
        );
        
        // Create connection if within range (3km)
        if (distance < 3) {
          const bandwidth = 100 - (distance * 20); // Decrease bandwidth with distance
          const latency = 5 + (distance * 2); // Increase latency with distance
          const packetLoss = 0.01 + (distance * 0.01); // Increase packet loss with distance
          
          this.addConnection({
            sourceId: rsu1.rsu_id,
            targetId: rsu2.rsu_id,
            bandwidth,
            latency,
            packetLoss,
            encrypted: true,
            status: 'normal',
            activeAttacks: []
          });
        }
      }
    }
  }
  
  // Initialize the network topology from RSU data
  initializeFromRSUs(rsus: any[]) {
    // Clear existing data
    this.nodes.clear();
    this.connections = [];
    
    // Create nodes for each RSU
    for (const rsu of rsus) {
      const node = this.createNodeFromRSU(rsu);
      this.addNode(node);
    }
    
    // Create connections between RSUs
    this.createConnectionsFromRSUs(rsus);
  }
  
  // Get compromised RSUs
  getCompromisedRSUs(): string[] {
    return Array.from(this.nodes.values())
      .filter(node => node.status === 'compromised')
      .map(node => node.id);
  }
  
  // Get network-wide statistics
  getNetworkStats() {
    const nodes = Array.from(this.nodes.values());
    
    return {
      totalNodes: nodes.length,
      compromisedNodes: nodes.filter(n => n.status === 'compromised').length,
      quarantinedNodes: nodes.filter(n => n.status === 'quarantined').length,
      degradedNodes: nodes.filter(n => n.status === 'degraded').length,
      activeAttacks: nodes.reduce((sum, node) => sum + node.activeAttacks.length, 0),
      averageThroughput: nodes.reduce((sum, node) => sum + node.throughput, 0) / nodes.length,
      criticalConnections: this.connections.filter(c => c.status === 'down').length,
    };
  }
}

// Helper function to calculate distance between two points in km
function calculateDistance(
  point1: { lat: number, lng: number }, 
  point2: { lat: number, lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = degreesToRadians(point2.lat - point1.lat);
  const dLon = degreesToRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degreesToRadians(point1.lat)) * Math.cos(degreesToRadians(point2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI/180);
}

// Create and export a global network topology
export const globalNetworkTopology = new NetworkTopology();
