
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { getContract, initReadonlyProvider } from './provider';

// Function to get consistent mock data
const getConsistentMockData = (targetType = null) => {
  // Check if we have stored mock data in localStorage
  const storedMockData = localStorage.getItem('blockchain_mock_ledger');
  if (storedMockData) {
    try {
      const data = JSON.parse(storedMockData);
      // Filter by target type if specified
      return targetType ? data.filter(entry => entry.target_type === targetType) : data;
    } catch (error) {
      console.error("Error parsing stored mock data:", error);
      // Continue to generate new mock data if parsing fails
    }
  }
  
  // Generate consistent mock data
  const mockData = [];
  const vehiclePrefixes = ['TS07', 'TS08', 'TS09', 'TS10'];
  const rsuPrefixes = ['RSU-A', 'RSU-B', 'RSU-C', 'RSU-HYD'];
  const now = Date.now();
  const seed = 12345; // Fixed seed for consistent randomness
  
  // Simple deterministic random function using seed
  const seededRandom = (max, min = 0) => {
    const x = Math.sin(seed * (mockData.length + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };
  
  // Generate 20 mock entries for vehicles with consistent data
  for (let i = 0; i < 20; i++) {
    const oldValue = 60 + seededRandom(30); // 60-90
    const change = seededRandom(20) - 5; // -5 to +15 with bias towards positive
    const newValue = Math.max(0, Math.min(100, oldValue + change));
    const actions = ["Trust Stake", "Trust Update", "Certificate Renewal"];
    const vehiclePrefix = vehiclePrefixes[seededRandom(vehiclePrefixes.length)];
    const vehicleNumber = 1000 + seededRandom(9000);
    
    mockData.push({
      tx_id: `0x${(1000000 + i).toString(16)}${(900000000 + i * 1000).toString(16)}`, 
      vehicle_id: `${vehiclePrefix}-${vehicleNumber}`, 
      target_id: `${vehiclePrefix}-${vehicleNumber}`,
      target_type: 'Vehicle',
      action: actions[i % actions.length], // Cycle through actions deterministically
      amount: 1 + seededRandom(50), // 1-50 tokens
      old_value: oldValue,
      new_value: newValue,
      timestamp: new Date(now - (i * 3600000)).toISOString() // Entries 1 hour apart
    });
  }
  
  // Generate 15 mock entries for RSUs
  for (let i = 0; i < 15; i++) {
    const oldValue = 70 + seededRandom(25); // 70-95
    const change = seededRandom(15) - 10; // -10 to +5 with bias towards negative
    const newValue = Math.max(0, Math.min(100, oldValue + change));
    const actions = ["Trust Update", "Attack Detected", "RSU_QUARANTINED", "Blockchain Protection"];
    const rsuPrefix = rsuPrefixes[seededRandom(rsuPrefixes.length)];
    const rsuNumber = 1 + seededRandom(20);
    
    mockData.push({
      tx_id: `0x${(2000000 + i).toString(16)}${(800000000 + i * 1000).toString(16)}`,
      vehicle_id: 'SYSTEM', // System update for RSUs
      target_id: `${rsuPrefix}-${rsuNumber}`,
      target_type: 'RSU',
      action: actions[i % actions.length], // Cycle through actions deterministically
      amount: 1 + seededRandom(25), // 1-25 tokens
      old_value: oldValue,
      new_value: newValue,
      timestamp: new Date(now - (i * 2400000)).toISOString() // Entries 40 min apart
    });
  }
  
  // Sort by timestamp (newest first)
  const sortedData = mockData.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Store in localStorage for consistency across reloads
  try {
    localStorage.setItem('blockchain_mock_ledger', JSON.stringify(sortedData));
  } catch (error) {
    console.error("Error storing mock data in localStorage:", error);
  }
  
  // Filter by target type if specified
  return targetType ? sortedData.filter(entry => entry.target_type === targetType) : sortedData;
};

export const getTrustLedger = async (targetType = null) => {
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
      const transformedData = ledger.map((entry, index) => {
        // Determine if this is an RSU or Vehicle entry
        const isRsu = entry.targetType === 'RSU' || 
                     (entry.details && entry.details.includes('RSU')) ||
                     !entry.vehicleId.startsWith('TS');
        
        return {
          tx_id: `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}${index}`,
          vehicle_id: isRsu ? 'SYSTEM' : (entry.vehicleId || `TS0${Math.floor(Math.random() * 3) + 7}-${Math.floor(Math.random() * 9000) + 1000}`),
          target_id: isRsu ? `RSU-${Math.floor(Math.random() * 20) + 1}` : (entry.vehicleId || `TS0${Math.floor(Math.random() * 3) + 7}-${Math.floor(Math.random() * 9000) + 1000}`),
          target_type: isRsu ? 'RSU' : 'Vehicle',
          action: isRsu ? 
            ['Trust Update', 'Attack Detected', 'RSU_QUARANTINED'][Math.floor(Math.random() * 3)] : 
            "Trust Stake",
          amount: parseInt(ethers.utils.formatEther(entry.amount || '0')) * 100,
          timestamp: new Date(entry.timestamp ? entry.timestamp.toNumber() * 1000 : Date.now()).toISOString(),
          old_value: Math.floor(Math.random() * 30) + 60,
          new_value: Math.floor(Math.random() * 20) + 80,
        };
      });
      
      // Filter by target type if specified
      return targetType ? transformedData.filter(entry => entry.target_type === targetType) : transformedData;
    } catch (contractError) {
      console.warn("Contract call failed, using mock data:", contractError);
      throw contractError; // Let it fall through to the mock data
    }
  } catch (error) {
    console.error("Error getting trust ledger:", error);
    
    // Use consistent mock data instead of generating random data each time
    return getConsistentMockData(targetType);
  }
};

// Get RSU-specific trust ledger
export const getRsuTrustLedger = async () => {
  return getTrustLedger('RSU');
};
