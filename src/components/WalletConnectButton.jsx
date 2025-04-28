
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, getConnectedAddress } from "@/services/blockchain";
import { Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WalletConnectButton = () => {
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected on component mount
    const connectedAddress = getConnectedAddress();
    if (connectedAddress) {
      setAddress(connectedAddress);
    }
  }, []);

  const handleConnect = async () => {
    if (address) {
      // If already connected, show address in toast
      toast({
        title: "Wallet Connected",
        description: `Currently connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      return;
    }

    try {
      setIsConnecting(true);
      const connectedAddress = await connectWallet();
      
      if (connectedAddress) {
        setAddress(connectedAddress);
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button 
      variant={address ? "outline" : "default"} 
      size="sm" 
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2"
    >
      {isConnecting ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span>Connecting...</span>
        </>
      ) : address ? (
        <>
          <Wallet className="h-4 w-4" />
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </Button>
  );
};

export default WalletConnectButton;
