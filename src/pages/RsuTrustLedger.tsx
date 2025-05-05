import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import WalletConnectButton from "@/components/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Shield, AlertTriangle, PlusCircle } from "lucide-react";
import { useRsuTrustLedger } from "@/hooks/useRsuTrustLedger";
import RsuTrustLedger from "@/components/trust/RsuTrustLedger";
import BlockchainLedger from "@/components/trust/BlockchainLedger";
import StakeTrustDialog from "@/components/trust/StakeTrustDialog";
import NetworkInfo from "@/components/trust/NetworkInfo";
import { generateRsuAttacks } from "@/services/ml/rsuTrustScoring";
import { fetchFromSupabase } from "@/services/api/supabase/fetch";
import { createAnomalies } from "@/services/api/trustLedger"; 
import { toast } from "@/hooks/use-toast";

const RsuTrustLedgerPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedRsuId, setSelectedRsuId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const {
    rsuLedgerData,
    blockchainLedgerData,
    isLoading,
    isError,
    isBlockchainLoading,
    isBlockchainError,
    handleRefresh,
    loadRsuLedgerData,
    loadBlockchainData,
  } = useRsuTrustLedger();

  // Get summary statistics
  const getStats = () => {
    if (!rsuLedgerData.length) return { total: 0, attacks: 0, quarantined: 0, blockchain: 0 };
    
    const attacks = rsuLedgerData.filter(entry => 
      entry.status === 'Attack Detected' || 
      entry.action === 'Attack Detected' ||
      entry.action === 'ATTACK_DETECTED'
    ).length;
    
    const quarantined = rsuLedgerData.filter(entry => 
      entry.status === 'Quarantined' || 
      entry.action === 'RSU_QUARANTINED'
    ).length;
    
    const blockchain = blockchainLedgerData.length;
    
    return {
      total: rsuLedgerData.length,
      attacks,
      quarantined,
      blockchain
    };
  };

  // Generate simulated RSU security events
  const handleGenerateEvents = async () => {
    try {
      setIsGenerating(true);
      toast({
        title: "Generating Events",
        description: "Creating simulated RSU security events...",
      });
      
      // Fetch RSUs first
      const rsus = await fetchFromSupabase('rsus', { limit: 50 });
      
      if (!rsus || rsus.length === 0) {
        toast({
          title: "No RSUs Found",
          description: "Please add RSUs to generate security events",
          variant: "destructive",
        });
        return;
      }
      
      // Generate simulated attacks (50% chance)
      const anomalies = generateRsuAttacks(rsus, 0.5);
      
      if (anomalies.length === 0) {
        toast({
          title: "No Events Generated",
          description: "Try again to generate security events",
          variant: "destructive",
        });
        return;
      }
      
      // Log the anomalies to the console
      console.log(`Generated ${anomalies.length} simulated RSU security events`);
      
      // Store the anomalies using our direct function
      const storedAnomalies = await createAnomalies(anomalies);
      
      toast({
        title: "Events Generated",
        description: `Created ${storedAnomalies.length} simulated RSU security events`,
      });
      
      // Refresh the ledger data
      handleRefresh();
    } catch (error) {
      console.error("Error generating RSU events:", error);
      toast({
        title: "Error",
        description: "Failed to generate RSU security events",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = getStats();

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">RSU Trust Ledger</h1>
            <p className="text-muted-foreground">Track RSU security events and blockchain protection</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isBlockchainLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isLoading || isBlockchainLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateEvents}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Generate Events</span>
            </Button>
            <WalletConnectButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-amber-500">{stats.attacks}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <AlertTriangle size={14} className="mr-1 text-amber-500" />
                Attacks Detected
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-red-500">{stats.quarantined}</div>
              <div className="text-sm text-muted-foreground">RSUs Quarantined</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-blue-500">{stats.blockchain}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Shield size={14} className="mr-1 text-blue-500" />
                Blockchain Protected
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rsu-ledger">
          <TabsList className="mb-4">
            <TabsTrigger value="rsu-ledger">RSU Trust Ledger</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain Protection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rsu-ledger">
            <Card>
              <CardHeader>
                <CardTitle>RSU Trust Events</CardTitle>
                <CardDescription>
                  Historical record of trust score changes and security events for roadside units
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RsuTrustLedger
                  data={rsuLedgerData}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="blockchain">
            <BlockchainLedger 
              data={blockchainLedgerData.filter(entry => entry.target_type === 'RSU')}
              isLoading={isBlockchainLoading}
              isError={isBlockchainError}
              etherscanUrl=""
              onRetry={loadBlockchainData}
              onStakeClick={() => {
                setSelectedRsuId("");
                setIsDialogOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>

        <StakeTrustDialog 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={loadBlockchainData}
          initialRsuId={selectedRsuId}
        />
      </div>
    </MainLayout>
  );
};

export default RsuTrustLedgerPage;
