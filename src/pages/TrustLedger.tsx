import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { fetchTrustLedger } from "@/services/api";
import { getTrustLedger, stakeTrust, simulateStakeTrust, getConnectedAddress } from "@/services/blockchain";
import WalletConnectButton from "@/components/WalletConnectButton";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrustLedger: React.FC = () => {
  const [apiData, setApiData] = useState<any[]>([]);
  const [blockchainData, setBlockchainData] = useState<any[]>([]);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const [isApiError, setIsApiError] = useState<boolean>(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState<boolean>(false);
  const [isBlockchainError, setIsBlockchainError] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.1");
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [etherscanUrl, setEtherscanUrl] = useState<string>('');

  const loadApiData = async () => {
    try {
      setIsApiLoading(true);
      setIsApiError(false);
      const data = await fetchTrustLedger();
      setApiData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching API trust ledger:", error);
      setIsApiError(true);
      toast({
        title: "Error",
        description: "Failed to load trust ledger data from API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApiLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      setIsBlockchainLoading(true);
      setIsBlockchainError(false);
      
      const address = getConnectedAddress();
      setConnectedWallet(address);
      
      const data = await getTrustLedger();
      setBlockchainData(Array.isArray(data) ? data : []);
      
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || 
        localStorage.getItem('env_VITE_CONTRACT_ADDRESS');
      
      if (contractAddress) {
        setEtherscanUrl(`https://goerli.etherscan.io/address/${contractAddress}`);
      }
    } catch (error) {
      console.error("Error fetching blockchain trust ledger:", error);
      setIsBlockchainError(true);
      toast({
        title: "Error",
        description: "Failed to load blockchain trust ledger. Please connect your wallet and try again.",
        variant: "destructive",
      });
    } finally {
      setIsBlockchainLoading(false);
    }
  };

  useEffect(() => {
    loadApiData();
    loadBlockchainData();
  }, []);

  const handleRefresh = () => {
    loadApiData();
    loadBlockchainData();
  };

  const handleStake = async () => {
    try {
      setIsStaking(true);
      try {
        await stakeTrust(vehicleId, amount);
      } catch (error) {
        await simulateStakeTrust(vehicleId, amount);
      }
      setIsDialogOpen(false);
      loadBlockchainData();
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const getNetworkInfo = () => {
    const rpcUrl = import.meta.env.VITE_RPC_URL || 
      localStorage.getItem('env_VITE_RPC_URL') || 
      'Goerli Testnet';
    
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">
          {rpcUrl.includes('goerli') ? 'Goerli Testnet' : 'Custom Network'}
        </Badge>
        {etherscanUrl && (
          <a 
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            View on Etherscan
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trust Ledger</h1>
            {getNetworkInfo()}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isApiLoading || isBlockchainLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isApiLoading || isBlockchainLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <WalletConnectButton />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Blockchain Trust Ledger</CardTitle>
              <CardDescription>
                Trust attestations recorded on the blockchain
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              Stake Trust
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Staked Amount (ETH)</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBlockchainLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isBlockchainError ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <div className="flex flex-col items-center space-y-4">
                          <p>Failed to load blockchain data</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={loadBlockchainData}
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : blockchainData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <div className="flex flex-col items-center space-y-4">
                          <p>No blockchain trust entries yet</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                          >
                            Simulate Stake
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    blockchainData.map((entry) => (
                      <TableRow key={entry.tx_id}>
                        <TableCell className="font-mono text-xs">
                          {entry.tx_id}
                        </TableCell>
                        <TableCell>{entry.vehicle_id}</TableCell>
                        <TableCell>{entry.amount}</TableCell>
                        <TableCell>
                          {formatTimestamp(entry.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Trust Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Trust Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isApiLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isApiError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex flex-col items-center space-y-4">
                          <p>Failed to load trust ledger entries</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={loadApiData}
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : apiData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        No trust ledger entries available
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiData.map((entry) => (
                      <TableRow key={entry.tx_id}>
                        <TableCell className="font-mono text-xs">
                          {entry.tx_id}
                        </TableCell>
                        <TableCell>
                          {formatTimestamp(entry.timestamp)}
                        </TableCell>
                        <TableCell>{entry.vehicle_id}</TableCell>
                        <TableCell>{entry.action}</TableCell>
                        <TableCell>
                          {entry.old_value < entry.new_value ? (
                            <span className="text-green-500">+{entry.new_value - entry.old_value}</span>
                          ) : entry.old_value > entry.new_value ? (
                            <span className="text-red-500">{entry.new_value - entry.old_value}</span>
                          ) : (
                            <span className="text-gray-500">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isStaking}>
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
      </div>
    </MainLayout>
  );
};

export default TrustLedger;
