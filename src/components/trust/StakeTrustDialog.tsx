
import React, { useState, useEffect } from "react";
import { stakeTrust } from "@/services/blockchain";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStakingContract } from "@/services/blockchain/provider";

interface StakeTrustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRsuId?: string; // Added this prop to support RSU staking
}

const StakeTrustDialog: React.FC<StakeTrustDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRsuId = "",
}) => {
  const [vehicleId, setVehicleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.1");
  const [isStaking, setIsStaking] = useState<boolean>(false);

  // Set the vehicleId when initialRsuId changes
  useEffect(() => {
    if (initialRsuId) {
      setVehicleId(initialRsuId);
    }
  }, [initialRsuId]);

  // Use the staking contract for this operation
  useEffect(() => {
    if (isOpen) {
      // Set the contract to Staking when the dialog opens
      useStakingContract();
    }
  }, [isOpen]);

  const handleStake = async () => {
    try {
      if (!vehicleId.trim()) {
        toast({
          title: "Input Error",
          description: "Please enter a valid vehicle or RSU ID",
          variant: "destructive",
        });
        return;
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        toast({
          title: "Input Error",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        return;
      }

      setIsStaking(true);
      console.log("Attempting to stake", {
        vehicleId,
        amount: amountValue
      });
      
      // Directly use stakeTrust function
      const result = await stakeTrust(vehicleId, amountValue);
      
      if (result) {
        console.log("Staking successful");
        onClose();
        onSuccess();
      }
    } catch (error) {
      console.error("Stake operation failed:", error);
      toast({
        title: "Stake Failed",
        description: "Failed to stake trust. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stake Trust for Vehicle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle or RSU ID</Label>
            <Input
              id="vehicleId"
              placeholder="e.g., HYD001 or RSU-A-1"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isStaking}>
            Cancel
          </Button>
          <Button onClick={handleStake} disabled={!vehicleId || isStaking}>
            {isStaking ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                <span>Processing...</span>
              </div>
            ) : (
              "Stake Trust"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StakeTrustDialog;
