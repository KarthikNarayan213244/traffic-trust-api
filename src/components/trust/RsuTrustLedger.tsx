
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface RsuTrustLedgerProps {
  data?: any[];
  isLoading?: boolean;
}

const RsuTrustLedger: React.FC<RsuTrustLedgerProps> = ({
  data = [],
  isLoading = false,
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Invalid timestamp:", timestamp);
      return "Invalid date";
    }
  };

  // Get attack type badge
  const getAttackTypeBadge = (attackType: string, severity: string) => {
    const normalizedType = attackType?.toUpperCase() || '';
    
    if (normalizedType.includes('SYBIL') || normalizedType.includes('SPOOF')) {
      return (
        <Badge className="bg-amber-500 flex items-center gap-1">
          <AlertTriangle size={12} /> {attackType}
        </Badge>
      );
    } else if (normalizedType.includes('DENIAL') || normalizedType.includes('DOS') || normalizedType.includes('DDOS')) {
      return (
        <Badge className="bg-red-500 flex items-center gap-1">
          <AlertTriangle size={12} /> {attackType}
        </Badge>
      );
    } else if (normalizedType.includes('TRUST') || normalizedType.includes('UPDATE')) {
      return (
        <Badge className="bg-blue-500 flex items-center gap-1">
          <Shield size={12} /> {attackType}
        </Badge>
      );
    } else if (normalizedType.includes('RECOVER')) {
      return (
        <Badge className="bg-green-500 flex items-center gap-1">
          <CheckCircle size={12} /> {attackType}
        </Badge>
      );
    } else {
      return <Badge>{attackType}</Badge>;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const normalizedSeverity = severity?.toUpperCase() || '';
    
    if (normalizedSeverity.includes('CRITICAL')) {
      return <Badge className="bg-red-600">Critical</Badge>;
    } else if (normalizedSeverity.includes('HIGH')) {
      return <Badge className="bg-red-500">High</Badge>;
    } else if (normalizedSeverity.includes('MEDIUM')) {
      return <Badge className="bg-amber-500">Medium</Badge>;
    } else if (normalizedSeverity.includes('LOW')) {
      return <Badge className="bg-amber-400">Low</Badge>;
    } else {
      return <Badge>{severity}</Badge>;
    }
  };

  // Get trust change badge
  const getTrustChangeBadge = (oldTrust: number, newTrust: number) => {
    if (oldTrust === undefined || newTrust === undefined) {
      return "-";
    }
    
    const difference = newTrust - oldTrust;
    
    if (difference < 0) {
      return <Badge className="bg-red-500">{difference}</Badge>;
    } else if (difference > 0) {
      return <Badge className="bg-green-500">+{difference}</Badge>;
    } else {
      return <Badge className="bg-gray-400">0</Badge>;
    }
  };

  // Sort by timestamp descending (most recent first)
  const sortedData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      try {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } catch (error) {
        return 0;
      }
    });
  }, [data]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RSU ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Attack Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Trust Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // No data state
  if (sortedData.length === 0) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RSU ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Attack Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Trust Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                No RSU trust ledger entries available. Try using the "Generate Events" button.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RSU ID</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Attack Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Trust Impact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry, index) => (
            <TableRow key={entry.id || index}>
              <TableCell>{entry.rsu_id}</TableCell>
              <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
              <TableCell>{getAttackTypeBadge(entry.attack_type, entry.severity)}</TableCell>
              <TableCell>{getSeverityBadge(entry.severity)}</TableCell>
              <TableCell>
                {getTrustChangeBadge(entry.old_trust, entry.new_trust)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RsuTrustLedger;
