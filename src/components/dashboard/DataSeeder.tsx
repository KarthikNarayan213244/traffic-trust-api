
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { seedDatabaseWithTestData } from "@/services/api";

export function DataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabaseWithTestData(clearExisting);
      
      if (result.success) {
        toast({
          title: "Trust database seeded successfully",
          description: `Added ${result.counts?.anomalies} anomalies and ${result.counts?.trustEntries} trust entries.`,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Trust Database Seeder
        </CardTitle>
        <CardDescription>
          Populate your trust database with realistic test data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="clearExisting" 
            checked={clearExisting} 
            onCheckedChange={(checked) => setClearExisting(!!checked)} 
          />
          <Label htmlFor="clearExisting">Clear existing trust data before seeding</Label>
        </div>
        <p className="text-sm text-gray-500">
          {clearExisting 
            ? "Warning: This will delete all existing trust and anomaly data before adding new records." 
            : "New trust and anomaly data will be added without removing existing records."}
        </p>
        <p className="text-xs text-blue-600">
          Note: Traffic data is now provided by TomTom API in real-time.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSeedData} 
          disabled={isSeeding}
          className="w-full"
          variant="outline"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Trust Database...
            </>
          ) : (
            "Seed Trust Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
