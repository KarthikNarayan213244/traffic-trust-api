
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, getConnectedAddress } from "@/services/blockchain";
import { Wallet } from "lucide-react";

const WalletConnectButton = () => {
  const [address, setAddress] = useState(getConnectedAddress());
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const connectedAddress = await connectWallet();
      setAddress(connectedAddress);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
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
