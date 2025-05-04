
import { ethers } from 'ethers';
import { toast } from "@/hooks/use-toast";
import { getContract, getSigner, connectWallet } from './provider';

// Update trust score on the blockchain
export const updateTrustScore = async (vehicleId, score) => {
  try {
    if (!vehicleId || typeof score !== 'number') {
      throw new Error("Invalid parameters for trust score update");
    }
    
    // Connect wallet if needed
    if (!getContract() || !getSigner()) {
      await connectWallet();
      if (!getContract() || !getSigner()) {
        throw new Error("Wallet connection required for updating trust scores");
      }
    }
    
    const contract = getContract();
    // Convert score to integer if needed (contract expects uint256)
    const scoreValue = Math.round(score);
    
    console.log(`Updating trust score for ${vehicleId} to ${scoreValue}`);
    const tx = await contract.updateTrustScore(vehicleId, scoreValue);
    
    // Display a toast for the pending transaction
    toast({
      title: "Trust Score Update Submitted",
      description: `Trust score update for ${vehicleId} submitted to blockchain`,
    });
    
    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("Trust score update transaction confirmed:", receipt.transactionHash);
    
    toast({
      title: "Trust Score Updated",
      description: `Trust score for ${vehicleId} updated to ${scoreValue}`,
    });
    
    return true;
  } catch (error) {
    console.error("Error updating trust score:", error);
    
    toast({
      title: "Trust Score Update Failed",
      description: `Failed to update trust score: ${error.message || "Unknown error"}`,
      variant: "destructive",
    });
    
    throw error;
  }
};

// Batch update multiple trust scores in a single transaction
export const batchUpdateTrustScores = async (updates) => {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("Invalid updates array");
    }
    
    // Connect wallet if needed
    if (!getContract() || !getSigner()) {
      await connectWallet();
      if (!getContract() || !getSigner()) {
        throw new Error("Wallet connection required for updating trust scores");
      }
    }
    
    // Process updates in batches to avoid gas limits
    const batchSize = 10;
    let successCount = 0;
    
    toast({
      title: "Processing Trust Updates",
      description: `Processing ${updates.length} trust score updates in batches`,
    });
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const promises = batch.map(({ vehicleId, score }) => 
        updateTrustScore(vehicleId, score)
          .then(() => {
            successCount++;
            return true;
          })
          .catch(err => {
            console.error(`Failed to update trust for ${vehicleId}:`, err);
            return false;
          })
      );
      
      await Promise.all(promises);
      
      // If this isn't the last batch, wait a bit to avoid overwhelming the blockchain
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    toast({
      title: "Trust Updates Complete",
      description: `Successfully updated ${successCount} out of ${updates.length} trust scores`,
      variant: successCount === updates.length ? "default" : "warning",
    });
    
    return successCount;
  } catch (error) {
    console.error("Error in batch updating trust scores:", error);
    
    toast({
      title: "Batch Trust Update Failed",
      description: `Failed to update trust scores in batch: ${error.message || "Unknown error"}`,
      variant: "destructive",
    });
    
    throw error;
  }
};
