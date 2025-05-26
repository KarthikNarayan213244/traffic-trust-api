
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
import { createRsuTrustEvents, createAnomalies } from "@/services/api/rsuTrustEvents";
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
    etherscanUrl,
  } = useRsuTrustLedger();

  // Get summary statistics
  const getStats = () => {
    if (!rsuLedgerData.length) return { total: 0, attacks: 0, quarantined: 0, blockchain: 0 };
    
    const attacks = rsuLedgerData.filter(entry => 
      entry.attack_type && entry.attack_type !== 'Trust Update'
    ).length;
    
    const quarantined = rsuLedgerData.filter(entry => 
      entry.severity === 'Critical' || entry.severity === 'High'
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
      let rsus;
      try {
        rsus = await fetchFromSupabase('rsus', { limit: 50 });
        console.log(`Fetched ${rsus?.length || 0} RSUs for event generation`);
      } catch (error) {
        console.error("Error fetching RSUs:", error);
        
        // Create mock RSUs if none are found
        rsus = Array.from({ length: 10 }, (_, i) => ({
          rsu_id: `RSU-10${i.toString().padStart(2, '0')}`,
          location: `Location ${i+1}`,
          status: 'Active'
        }));
        
        console.log("Created mock RSUs for event generation:", rsus);
      }
      
      if (!rsus || rsus.length === 0) {
        rsus = Array.from({ length: 10 }, (_, i) => ({
          rsu_id: `RSU-10${i.toString().padStart(2, '0')}`,
          location: `Location ${i+1}`,
          status: 'Active'
        }));
        
        toast({
          title: "Using Mock RSUs",
          description: "Created mock RSUs to generate security events",
        });
      }
      
      // Generate simulated attacks with higher probability (70% chance)
      const attacks = generateRsuAttacks(rsus, 0.7);
      
      if (attacks.length === 0) {
        toast({
          title: "No Events Generated",
          description: "Try again to generate security events",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Generated ${attacks.length} simulated RSU security events`);
      
      // Transform attacks for RSU trust ledger
      const trustEvents = attacks.map(attack => ({
        rsu_id: attack.target_id || attack.vehicle_id,
        attack_type: attack.type,
        severity: attack.severity,
        old_trust: Math.floor(Math.random() * 100),
        new_trust: Math.floor(Math.random() * 100),
        timestamp: attack.timestamp,
        details: attack.message
      }));
      
      // Transform attacks for anomalies table
      const anomalies = attacks.map(attack => ({
        vehicle_id: attack.target_id || attack.vehicle_id,
        type: attack.type,
        severity: attack.severity,
        timestamp: attack.timestamp,
        message: attack.message,
        status: 'Detected'
      }));
      
      try {
        // Store in both tables
        const [trustResults, anomalyResults] = await Promise.all([
          createRsuTrustEvents(trustEvents),
          createAnomalies(anomalies)
        ]);
        
        console.log("Stored trust events:", trustResults?.length || 0);
        console.log("Stored anomalies:", anomalyResults?.length || 0);
        
        toast({
          title: "Events Generated Successfully",
          description: `Created ${attacks.length} RSU security events and stored in database`,
        });
        
        // Refresh the data after a short delay
        setTimeout(() => {
          handleRefresh();
        }, 1000);
        
      } catch (error) {
        console.error("Failed to store events:", error);
        toast({
          title: "Storage Error",
          description: "Events were generated but couldn't be stored in the database",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Error generating RSU events:", error);
      toast({
        title: "Generation Error",
        description: "Failed to generate RSU security events",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = getStats();

  // For debugging - enhance logging
  React.useEffect(() => {
    console.log("RSU Ledger Data:", rsuLedgerData.length, "entries");
    console.log("Blockchain Data:", blockchainLedgerData.length, "entries");
    console.log("Stats:", stats);
  }, [rsuLedgerData, blockchainLedgerData, stats]);

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">RSU Trust Ledger</h1>
            <p className="text-muted-foreground">Track RSU security events and blockchain protection</p>
            {etherscanUrl && <NetworkInfo etherscanUrl={etherscanUrl} />}
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
              <PlusCircle className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Generate Events'}</span>
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
              <div className="text-sm text-muted-foreground">High Risk Events</div>
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
              data={blockchainLedgerData}
              isLoading={isBlockchainLoading}
              isError={isBlockchainError}
              etherscanUrl={etherscanUrl || ""}
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
