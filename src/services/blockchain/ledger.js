
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { getContract, initReadonlyProvider } from './provider';

export const getTrustLedger = async () => {
  try {
    // Initialize readonly provider if not already connected with a wallet
    if (!getContract()) {
      const initialized = initReadonlyProvider();
      if (!initialized) {
        throw new Error("Failed to initialize blockchain connection");
      }
    }
    
    // Try to get data from the actual contract
    try {
      const contract = getContract();
      const ledger = await contract.getTrustLedger();
      
      // Transform the data to match our application format
      return ledger.map((entry, index) => ({
        tx_id: `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}${index}`,
        vehicle_id: entry.vehicleId,
        action: "Trust Stake",
        old_value: 0, 
        new_value: parseInt(ethers.utils.formatEther(entry.amount)) * 100,
        timestamp: new Date(entry.timestamp.toNumber() * 1000).toISOString(),
      }));
    } catch (contractError) {
      console.warn("Contract call failed, using mock data:", contractError);
      throw contractError; // Let it fall through to the mock data
    }
  } catch (error) {
    console.error("Error getting trust ledger:", error);
    
    // Return mock data if contract call fails
    return [
      { tx_id: "0x7a23b5ef8742c16d3b6eb0b42128f69081592bad", vehicle_id: "TS07-2345-AB", action: "Trust Stake", old_value: 90, new_value: 95, timestamp: new Date().toISOString() },
      { tx_id: "0x5bf1c6dde8dc48c21799e23751b612acf4d6d93c", vehicle_id: "TS08-5678-CD", action: "Trust Stake", old_value: 95, new_value: 88, timestamp: new Date(Date.now() - 86400000).toISOString() }
    ];
  }
};
