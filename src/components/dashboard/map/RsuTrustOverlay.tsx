
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, AlertTriangle, CheckCircle, Shield, Lock } from "lucide-react";

interface RsuTrustOverlayProps {
  rsus: any[];
  anomalies: any[];
  onBlockchainUpdate?: (rsuId: string, trustScore: number) => void;
}

const RsuTrustOverlay: React.FC<RsuTrustOverlayProps> = ({
  rsus,
  anomalies,
  onBlockchainUpdate
}) => {
  // Filter to only show RSUs with notable trust changes or security issues
  const notableRsus = rsus.filter(rsu => 
    rsu.attack_detected || 
    rsu.quarantined || 
    (rsu.trust_score_change && Math.abs(rsu.trust_score_change) >= 2) ||
    rsu.trust_score < 70 ||
    rsu.blockchain_protected
  );
  
  if (notableRsus.length === 0) {
    return null;
  }

  return (
    <Card className="absolute left-4 bottom-4 w-80 bg-background/90 backdrop-blur-sm border-muted shadow-lg max-h-80 overflow-auto">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-1">
            <Shield size={16} className="text-primary" />
            RSU Trust Monitoring
          </h3>
          <Badge variant="secondary" className="text-xs">Live</Badge>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-1 mb-3 text-xs border-b pb-2">
          <div className="text-center">
            <div className="font-medium">{rsus.filter(r => r.attack_detected).length}</div>
            <div className="text-muted-foreground">Compromised</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{rsus.filter(r => r.quarantined).length}</div>
            <div className="text-muted-foreground">Quarantined</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{rsus.filter(r => r.blockchain_protected).length}</div>
            <div className="text-muted-foreground">Blockchain</div>
          </div>
        </div>
        
        <div className="space-y-2 mt-2">
          {notableRsus.map((rsu) => {
            // Determine status icon and color
            let Icon = CheckCircle;
            let statusColor = "text-green-500";
            let bgColor = "bg-green-50";
            let statusText = "Secure";
            
            if (rsu.quarantined) {
              Icon = AlertOctagon;
              statusColor = "text-red-500";
              bgColor = "bg-red-50";
              statusText = "Quarantined";
            } else if (rsu.attack_detected) {
              Icon = AlertTriangle;
              statusColor = "text-amber-500";
              bgColor = "bg-amber-50";
              statusText = "Attack Detected";
            } else if (rsu.trust_score < 70) {
              Icon = AlertTriangle;
              statusColor = "text-amber-500";
              bgColor = "bg-amber-50";
              statusText = "Low Trust";
            }
            
            // Get recent anomalies for this RSU
            const recentAnomalies = anomalies
              .filter(a => a.target_id === rsu.rsu_id && a.target_type === 'RSU')
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 1);
            
            return (
              <div 
                key={rsu.rsu_id}
                className={`p-2 rounded-md ${bgColor} border border-${statusColor.replace('text-', '')} text-xs`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{rsu.rsu_id}</div>
                  <div className={`flex items-center gap-1 ${statusColor}`}>
                    <Icon size={14} />
                    <span>{statusText}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <div className="text-muted-foreground">Trust Score</div>
                    <div className="font-medium text-sm">
                      {rsu.trust_score} 
                      {rsu.trust_score_change && (
                        <span className={rsu.trust_score_change > 0 ? "text-green-600" : "text-red-600"}>
                          {" "}{rsu.trust_score_change > 0 ? "+" : ""}{rsu.trust_score_change}
                        </span>
                      )}
                    </div>
                  </div>
                  {rsu.blockchain_protected && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-blue-50 text-blue-800 flex items-center gap-1"
                    >
                      <Lock size={10} /> Blockchain
                    </Badge>
                  )}
                </div>
                
                {recentAnomalies.length > 0 && (
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-muted-foreground text-xs">Latest Anomaly:</div>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] ${
                        recentAnomalies[0].severity === 'Critical' ? 'bg-red-50 text-red-800' :
                        recentAnomalies[0].severity === 'High' ? 'bg-orange-50 text-orange-800' :
                        recentAnomalies[0].severity === 'Medium' ? 'bg-amber-50 text-amber-800' :
                        'bg-yellow-50 text-yellow-800'
                      }`}
                    >
                      {recentAnomalies[0].type}
                    </Badge>
                  </div>
                )}
                
                {rsu.location && (
                  <div className="text-muted-foreground mt-1">{rsu.location}</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RsuTrustOverlay;
