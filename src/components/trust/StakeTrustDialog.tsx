
import React, { useState } from "react";
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

interface StakeTrustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StakeTrustDialog: React.FC<StakeTrustDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [vehicleId, setVehicleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.1");
  const [isStaking, setIsStaking] = useState<boolean>(false);

  const handleStake = async () => {
    try {
      setIsStaking(true);
      
      // Directly use stakeTrust function
      const result = await stakeTrust(vehicleId, parseFloat(amount));
      
      if (result) {
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
            <Label htmlFor="vehicleId">Vehicle ID</Label>
            <Input
              id="vehicleId"
              placeholder="e.g., HYD001"
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
