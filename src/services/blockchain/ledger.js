
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from './provider';
import { toast } from "@/hooks/use-toast";
import { TRUST_LEDGER_ABI, TRUST_LEDGER_ADDRESS } from './constants';

/**
 * Get trust ledger entries from the blockchain
 */
export const getTrustLedger = async () => {
  try {
    const contract = getContract();
    if (!contract) {
      console.warn("Contract not initialized, using mock data");
      return getMockTrustLedgerData();
    }
    
    // Check if the contract has a getTrustLedger method
    if (typeof contract.getTrustLedger === 'function') {
      // If the contract has a getTrustLedger method, use it
      const ledger = await contract.getTrustLedger();
      console.log("Blockchain trust ledger retrieved:", ledger);
      return formatTrustLedgerData(ledger);
    } 
    
    // Fall back to querying events if the contract doesn't have a direct method
    // This will look for TrustUpdated or similar events from the contract
    const provider = getProvider();
    if (!provider) {
      console.warn("Provider not available, using mock data");
      return getMockTrustLedgerData();
    }
    
    // Look for past events (adjust event name based on your actual contract)
    const filter = contract.filters.TrustUpdated ? 
      contract.filters.TrustUpdated() : 
      contract.filters.Staked ? 
        contract.filters.Staked() : 
        { address: contract.address };
    
    const events = await provider.getLogs({
      fromBlock: 0,
      toBlock: "latest",
      address: contract.address
    });
    
    console.log("Retrieved blockchain events:", events.length);
    
    if (events.length === 0) {
      // If no events are found, return mock data
      return getMockTrustLedgerData();
    }
    
    return events.map(event => formatEventToLedgerEntry(event));
  } catch (error) {
    console.error("Error getting trust ledger:", error);
    console.warn("Contract call failed, using mock data:", error);
    return getMockTrustLedgerData();
  }
};

/**
 * Format raw blockchain events to our ledger format
 */
const formatEventToLedgerEntry = (event) => {
  return {
    tx_id: event.transactionHash,
    timestamp: new Date().toISOString(), // Blockchain doesn't provide exact time
    vehicle_id: 'BLOCKCHAIN',
    action: 'TRUST_UPDATE',
    old_value: 0,
    new_value: 0,
    details: 'Blockchain trust update',
    target_id: 'Unknown',
    target_type: 'RSU'
  };
};

/**
 * Format raw trust ledger data from the blockchain
 */
const formatTrustLedgerData = (ledger) => {
  if (!Array.isArray(ledger)) {
    console.warn("Ledger data is not an array, using mock data");
    return getMockTrustLedgerData();
  }
  
  return ledger.map(entry => ({
    tx_id: entry.txHash || `0x${Math.random().toString(36).substring(2, 15)}`,
    timestamp: entry.timestamp ? new Date(entry.timestamp * 1000).toISOString() : new Date().toISOString(),
    vehicle_id: entry.vehicle || entry.entityId || 'BLOCKCHAIN',
    action: entry.action || 'TRUST_UPDATE',
    old_value: entry.oldScore || 0,
    new_value: entry.newScore || entry.score || 0,
    details: entry.details || 'Blockchain trust update',
    target_id: entry.entityId || entry.target || 'Unknown',
    target_type: entry.targetType || 'RSU'
  }));
};

/**
 * Generate mock trust ledger data for testing
 */
const getMockTrustLedgerData = () => {
  const now = new Date();
  
  return [
    {
      tx_id: `0x${Math.random().toString(36).substring(2, 15)}`,
      timestamp: now.toISOString(),
      vehicle_id: 'BLOCKCHAIN',
      action: 'TRUST_UPDATE',
      old_value: 80,
      new_value: 90,
      details: 'Blockchain protection added to RSU',
      target_id: 'RSU-001',
      target_type: 'RSU'
    },
    {
      tx_id: `0x${Math.random().toString(36).substring(2, 15)}`,
      timestamp: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
      vehicle_id: 'BLOCKCHAIN',
      action: 'ATTACK_MITIGATED',
      old_value: 65,
      new_value: 75,
      details: 'Attack mitigated through blockchain validation',
      target_id: 'RSU-002',
      target_type: 'RSU'
    },
    {
      tx_id: `0x${Math.random().toString(36).substring(2, 15)}`,
      timestamp: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
      vehicle_id: 'BLOCKCHAIN',
      action: 'STAKE_ADDED',
      old_value: 70,
      new_value: 70,
      details: 'Stake added for RSU protection',
      target_id: 'RSU-003',
      target_type: 'RSU'
    }
  ];
};
