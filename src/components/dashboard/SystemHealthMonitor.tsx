
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Radio, 
  Database, 
  Shield, 
  Cpu 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from "@/integrations/supabase/client";

interface SystemComponentStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  icon: React.ReactNode;
  description: string;
}

const SystemHealthMonitor: React.FC = () => {
  const [systemComponents, setSystemComponents] = useState<SystemComponentStatus[]>([
    { 
      name: 'Vehicle Data Pipeline', 
      status: 'operational', 
      latency: 120,
      icon: <Activity className="h-4 w-4" />,
      description: 'Real-time vehicle data ingest and processing'
    },
    { 
      name: 'RSU Network', 
      status: 'operational', 
      latency: 87,
      icon: <Radio className="h-4 w-4" />,
      description: 'Connected roadside unit network status'
    },
    { 
      name: 'ML Processing', 
      status: 'operational', 
      latency: 210,
      icon: <Cpu className="h-4 w-4" />,
      description: 'Machine learning inference services'
    },
    { 
      name: 'Trust Ledger', 
      status: 'operational', 
      latency: 320,
      icon: <Shield className="h-4 w-4" />,
      description: 'Blockchain trust verification system'
    },
    { 
      name: 'Database', 
      status: 'operational', 
      latency: 45,
      icon: <Database className="h-4 w-4" />,
      description: 'Primary database cluster status'
    }
  ]);
  
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [dbConnection, setDbConnection] = useState<'connected' | 'disconnected'>('connected');

  // Check system health periodically
  useEffect(() => {
    const checkSystemHealth = async () => {
      // Check database connection
      try {
        const { data, error } = await supabase.from('vehicles').select('count').limit(1);
        
        if (error) {
          throw error;
        }
        
        // Database is connected
        setDbConnection('connected');
        updateComponentStatus('Database', 'operational');
      } catch (error) {
        console.error("Database connection error:", error);
        setDbConnection('disconnected');
        updateComponentStatus('Database', 'down');
      }
      
      // Simulate checking other components (in a real system, you would check actual services)
      simulateComponentChecks();
      
      setLastChecked(new Date());
    };
    
    // Initial check
    checkSystemHealth();
    
    // Set up interval for periodic checks
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const simulateComponentChecks = () => {
    // Simulate variable latencies and occasional degraded status
    setSystemComponents(prev => prev.map(component => {
      // Generate random latency variations (+/- 20%)
      const latencyVariation = component.latency ? component.latency * (0.8 + Math.random() * 0.4) : 100;
      
      // Simulate occasional issues based on random chance
      const randomStatus = Math.random();
      let status = component.status;
      
      if (randomStatus > 0.95) {
        status = 'degraded'; // 5% chance of degraded
      } else if (randomStatus > 0.995) {
        status = 'down'; // 0.5% chance of down
      } else {
        status = 'operational';
      }
      
      return {
        ...component,
        latency: Math.round(latencyVariation),
        status: status as 'operational' | 'degraded' | 'down'
      };
    }));
  };
  
  const updateComponentStatus = (componentName: string, status: 'operational' | 'degraded' | 'down') => {
    setSystemComponents(prev => prev.map(component => 
      component.name === componentName 
        ? { ...component, status } 
        : component
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Operational</Badge>;
      case 'degraded':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Degraded</Badge>;
      case 'down':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'bg-green-500';
    if (latency < 200) return 'bg-blue-500';
    if (latency < 300) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>System Health</span>
          <Badge 
            variant="outline"
            className={`${dbConnection === 'connected' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
          >
            {dbConnection === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {systemComponents.map(component => (
            <div key={component.name} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gray-100 rounded">
                  {component.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{component.name}</div>
                  <div className="text-xs text-muted-foreground">{component.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs">{component.latency}ms</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getLatencyColor(component.latency || 0)}`}
                        style={{ width: `${Math.min(100, (component.latency || 0) / 5)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  {getStatusBadge(component.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthMonitor;
