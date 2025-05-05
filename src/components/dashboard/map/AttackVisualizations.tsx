
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, Wifi, WifiOff, ActivitySquare, Network } from "lucide-react";

interface AttackVisualizationsProps {
  anomalies: any[];
  rsus: any[];
}

const AttackVisualizations: React.FC<AttackVisualizationsProps> = ({
  anomalies,
  rsus
}) => {
  // Filter to only show recent attacks
  const recentAttacks = anomalies
    .filter(a => 
      a.is_simulated && 
      a.attack_success && 
      new Date(a.timestamp).getTime() > Date.now() - 3 * 60 * 1000 // Last 3 minutes
    )
    .slice(0, 5);
  
  if (recentAttacks.length === 0) {
    return null;
  }

  return (
    <Card className="absolute right-4 top-4 w-72 bg-background/90 backdrop-blur-sm border-muted shadow-lg max-h-80 overflow-auto">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-1">
            <AlertOctagon size={16} className="text-red-500" />
            <span>Active Attacks</span>
          </h3>
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 animate-pulse">Live</Badge>
        </div>
        
        <div className="space-y-2 mt-2">
          {recentAttacks.map((attack) => {
            // Determine attack icon and color
            let Icon = AlertOctagon;
            let iconColor = "text-red-500";
            
            if (attack.type === "Signal Jamming") {
              Icon = WifiOff;
              iconColor = "text-red-500";
            } else if (attack.type === "Distributed Denial of Service") {
              Icon = Network;
              iconColor = "text-orange-500";
            } else if (attack.type === "Sybil Attack" || attack.type === "Man-in-the-Middle") {
              Icon = Wifi;
              iconColor = "text-amber-500";
            } else if (attack.type?.includes("Data")) {
              Icon = ActivitySquare;
              iconColor = "text-purple-500";
            }
            
            // Find target RSU
            const targetRsu = rsus.find(r => r.rsu_id === attack.target_id);
            
            return (
              <div 
                key={attack.id}
                className="p-2 rounded-md bg-red-50 border border-red-200 text-xs"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{attack.type}</div>
                  <div className={`flex items-center gap-1 ${iconColor}`}>
                    <Icon size={14} />
                    <span>{attack.severity}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <div className="text-muted-foreground">Target</div>
                    <div className="font-medium">
                      {attack.target_id}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                  >
                    {attack.attacker_profile || "Unknown Attacker"}
                  </Badge>
                </div>
                
                {targetRsu && (
                  <div className="text-muted-foreground mt-1">
                    {targetRsu.location || "Unknown Location"}
                  </div>
                )}
                
                {attack.affected_nodes && attack.affected_nodes.length > 0 && (
                  <div className="mt-1">
                    <span className="text-muted-foreground">Network Impact: </span>
                    <span className="text-red-600">{attack.affected_nodes.length} nodes affected</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttackVisualizations;
