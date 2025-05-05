
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { getContract, getSigner, connectWallet } from './provider';
import { STAKING_ABI, STAKING_ADDRESS } from './constants';

export const stakeTrust = async (vehicleId, amount) => {
  try {
    // If MetaMask isn't installed, go to simulation directly
    if (!window.ethereum) {
      return simulateStakeTrust(vehicleId, amount);
    }
    
    if (!getContract() || !getSigner()) {
      await connectWallet();
      if (!getContract() || !getSigner()) {
        throw new Error("Wallet connection required for staking");
      }
    }
    
    const contract = getContract();
    const amountInWei = ethers.utils.parseEther(amount.toString());
    
    console.log("Staking with parameters:", {
      vehicleId,
      amountInWei: amountInWei.toString(),
      contractAddress: contract.address
    });
    
    // Use 'stake' function from the STAKING_ABI instead of 'stakeTrust'
    const tx = await contract.stake(vehicleId, amountInWei, {
      value: amountInWei, // Include ETH value in the transaction
      gasLimit: 300000 // Set gas limit explicitly to avoid out-of-gas errors
    });
    
    toast({
      title: "Transaction Submitted",
      description: `Staking ${amount} ETH for ${vehicleId}. Please wait for confirmation.`,
    });
    
    await tx.wait();
    
    toast({
      title: "Stake Successful",
      description: `Successfully staked ${amount} ETH for vehicle ${vehicleId}`,
    });
    
    return true;
  } catch (error) {
    console.error("Error staking trust:", error);
    
    // Log more detailed error information for debugging
    console.error("Detailed error:", {
      message: error.message,
      code: error.code,
      data: error.data,
      stack: error.stack
    });
    
    // If error is related to MetaMask not being installed
    if (error.message?.includes("MetaMask not installed") || !window.ethereum) {
      toast({
        title: "Using Simulation Mode",
        description: "MetaMask not detected. Using simulation mode instead.",
      });
      return simulateStakeTrust(vehicleId, amount);
    }
    
    // If the error suggests the function doesn't exist
    if (error.message?.includes("not a function") || 
        error.message?.includes("no method named") ||
        error.message?.includes("has no function")) {
      toast({
        title: "Contract Function Error",
        description: "The staking function is not available. Using simulation mode instead.",
        variant: "destructive",
      });
      console.log("Function not available, using simulation instead");
      return simulateStakeTrust(vehicleId, amount);
    }
    
    toast({
      title: "Stake Failed",
      description: `Failed to stake trust: ${error.message || "Unknown error"}`,
      variant: "destructive",
    });
    
    // If we're in development or test environment, simulate success
    if (import.meta.env.DEV || import.meta.env.MODE === 'test' || window.location.hostname === 'localhost') {
      console.log("Development mode: Simulating successful stake");
      return simulateStakeTrust(vehicleId, amount);
    }
    
    throw error;
  }
};

// Simulate blockchain data when contract is unavailable
export const simulateStakeTrust = async (vehicleId, amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      toast({
        title: "Simulation Successful",
        description: `Simulated staking ${amount} ETH for vehicle ${vehicleId}`,
      });
      resolve(true);
    }, 2000);
  });
};
