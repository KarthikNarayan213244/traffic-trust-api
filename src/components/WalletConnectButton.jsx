
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, getConnectedAddress } from "@/services/blockchain";
import { Wallet, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const WalletConnectButton = () => {
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Check if wallet is already connected on component mount
    const connectedAddress = getConnectedAddress();
    if (connectedAddress) {
      setAddress(connectedAddress);
    }
    
    // Listen for account changes from window.ethereum
    const handleAccountsChanged = (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        setAddress(null);
        setConnectionError("Wallet disconnected");
      } else {
        setAddress(accounts[0]);
        setConnectionError(null);
      }
    };
    
    const handleChainChanged = (chainId) => {
      console.log("Chain changed:", chainId);
      // Reset connection state when chain changes
      setConnectionError(null);
    };
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
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

    // Check if MetaMask is installed
    if (!window.ethereum) {
      setShowWalletDialog(true);
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      console.log("Attempting wallet connection...");
      const connectedAddress = await connectWallet();
      
      if (connectedAddress) {
        setAddress(connectedAddress);
        setConnectionError(null);
        console.log("Wallet connected successfully:", connectedAddress);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setConnectionError(error.message);
      
      let errorMessage = "Could not connect to wallet. Please try again.";
      let variant = "destructive";
      
      if (error.message.includes("MetaMask not installed")) {
        setShowWalletDialog(true);
        return;
      } else if (error.message.includes("rejected")) {
        errorMessage = "Connection rejected by user";
        variant = "default";
      } else if (error.message.includes("pending")) {
        errorMessage = "Connection request pending. Please check MetaMask.";
        variant = "default";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: variant,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getButtonVariant = () => {
    if (connectionError && !address) return "destructive";
    if (address) return "outline";
    return "default";
  };

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span>Connecting...</span>
        </>
      );
    }
    
    if (connectionError && !address) {
      return (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Retry</span>
        </>
      );
    }
    
    if (address) {
      return (
        <>
          <Wallet className="h-4 w-4" />
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </>
      );
    }
    
    return (
      <>
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </>
    );
  };

  return (
    <>
      <Button 
        variant={getButtonVariant()} 
        size="sm" 
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        {getButtonContent()}
      </Button>

      {/* No Wallet Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Extension Required</DialogTitle>
            <DialogDescription>
              To connect your wallet, you need to install a wallet extension first.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">You have several options:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">M</span>
                </div>
                <div>
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Install MetaMask <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-sm text-gray-600">The most popular Ethereum wallet</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">C</span>
                </div>
                <div>
                  <a 
                    href="https://www.coinbase.com/wallet" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Install Coinbase Wallet <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-sm text-gray-600">Secure crypto wallet by Coinbase</p>
                </div>
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWalletDialog(false);
                toast({
                  title: "Using Simulation Mode",
                  description: "You'll be able to use simulated blockchain features without a real wallet",
                });
              }}
            >
              Continue in Simulation Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletConnectButton;
