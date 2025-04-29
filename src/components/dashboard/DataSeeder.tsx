
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Database, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { seedDatabaseWithTestData } from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from '@/components/ui/input';

export function DataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [vehicles, setVehicles] = useState<number>(10000);
  const [rsus, setRsus] = useState<number>(200);
  const [anomalies, setAnomalies] = useState<number>(1000);
  const [trustEntries, setTrustEntries] = useState<number>(1000);
  const [congestionEntries, setCongestionEntries] = useState<number>(500);

  const handleSeedData = async () => {
    setIsSeeding(true);
    toast({
      title: "Starting Data Generation",
      description: "Seeding large volume data. This may take a few minutes...",
    });
    
    try {
      const result = await seedDatabaseWithTestData(clearExisting, {
        vehicles,
        rsus,
        anomalies, 
        trustEntries,
        congestionEntries
      });
      
      if (result.success) {
        toast({
          title: "Database seeded successfully",
          description: `Added ${result.counts?.vehicles.toLocaleString()} vehicles, ${result.counts?.rsus.toLocaleString()} RSUs, ${result.counts?.anomalies.toLocaleString()} anomalies, ${result.counts?.trustEntries.toLocaleString()} trust entries, and ${result.counts?.congestionEntries.toLocaleString()} congestion entries.`,
        });
      } else {
        toast({
          title: "Seeding completed with warnings",
          description: result.message,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "Seeding Failed",
        description: `Error: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="h-5 w-5" />
          High-Volume Data Generator
        </CardTitle>
        <CardDescription>
          Generate realistic traffic data for Hyderabad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="clearExisting" 
            checked={clearExisting} 
            onCheckedChange={(checked) => setClearExisting(!!checked)} 
          />
          <Label htmlFor="clearExisting" className="font-medium">Clear existing data before seeding</Label>
        </div>
        
        {clearExisting && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800">
              Warning: This will delete all existing data in the database before adding new data.
            </p>
          </div>
        )}
        
        <Separator className="my-3" />
        
        <div className="grid gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <Label htmlFor="vehicles">Vehicles</Label>
              <span className="text-sm text-gray-500">{vehicles.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Slider 
                id="vehicles" 
                min={1000} 
                max={50000} 
                step={1000}
                value={[vehicles]} 
                onValueChange={(vals) => setVehicles(vals[0])} 
              />
              <Input 
                type="number" 
                value={vehicles}
                onChange={(e) => setVehicles(Number(e.target.value))} 
                className="w-20"
                min={1000}
                max={50000}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Label htmlFor="rsus">Roadside Units</Label>
              <span className="text-sm text-gray-500">{rsus.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Slider 
                id="rsus" 
                min={50} 
                max={1000} 
                step={50}
                value={[rsus]} 
                onValueChange={(vals) => setRsus(vals[0])}
              />
              <Input 
                type="number" 
                value={rsus}
                onChange={(e) => setRsus(Number(e.target.value))} 
                className="w-20"
                min={50}
                max={1000}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Label htmlFor="anomalies">Anomaly Records</Label>
              <span className="text-sm text-gray-500">{anomalies.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Slider 
                id="anomalies" 
                min={100} 
                max={10000} 
                step={100}
                value={[anomalies]} 
                onValueChange={(vals) => setAnomalies(vals[0])}
              />
              <Input 
                type="number" 
                value={anomalies}
                onChange={(e) => setAnomalies(Number(e.target.value))} 
                className="w-20"
                min={100}
                max={10000}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Label htmlFor="trustEntries">Trust Ledger Entries</Label>
              <span className="text-sm text-gray-500">{trustEntries.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Slider 
                id="trustEntries" 
                min={100} 
                max={10000} 
                step={100}
                value={[trustEntries]} 
                onValueChange={(vals) => setTrustEntries(vals[0])}
              />
              <Input 
                type="number" 
                value={trustEntries}
                onChange={(e) => setTrustEntries(Number(e.target.value))} 
                className="w-20"
                min={100}
                max={10000}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Label htmlFor="congestionEntries">Congestion Zone Entries</Label>
              <span className="text-sm text-gray-500">{congestionEntries.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Slider 
                id="congestionEntries" 
                min={50} 
                max={1000} 
                step={50}
                value={[congestionEntries]} 
                onValueChange={(vals) => setCongestionEntries(vals[0])}
              />
              <Input 
                type="number" 
                value={congestionEntries}
                onChange={(e) => setCongestionEntries(Number(e.target.value))} 
                className="w-20"
                min={50}
                max={1000}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSeedData} 
          disabled={isSeeding}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Data ({vehicles.toLocaleString()} records)...
            </>
          ) : (
            "Generate High-Volume Data"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
