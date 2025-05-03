
import { toast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Singleton for managing realtime connections
class RealtimeService {
  private static instance: RealtimeService;
  private vehicleChannel: RealtimeChannel | null = null;
  private congestionChannel: RealtimeChannel | null = null;
  private anomalyChannel: RealtimeChannel | null = null;
  private rsuChannel: RealtimeChannel | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected: boolean = false;

  private constructor() {
    // Initialize subscribers map for different event types
    this.subscribers.set('vehicle', new Set());
    this.subscribers.set('congestion', new Set());
    this.subscribers.set('anomaly', new Set());
    this.subscribers.set('rsu', new Set());
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Check if the real-time connection is possible
   */
  public async checkConnection(): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      // Test the connection
      const { error } = await supabase.from('vehicles').select('count', { count: 'exact' }).limit(1);
      
      if (error) {
        console.error("Supabase connection error:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking Supabase connection:", error);
      return false;
    }
  }

  // Initialize WebSocket connection to real data sources
  public initializeWebSockets(): void {
    if (!supabase) {
      console.error("Supabase client not available");
      return;
    }
    
    try {
      console.log("Initializing real-time WebSocket connections...");
      
      // Initialize vehicle data channel
      this.vehicleChannel = supabase
        .channel('realtime-vehicles')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'vehicles' }, 
          (payload: any) => {
            console.log("Received real-time vehicle update:", payload);
            this.notifySubscribers('vehicle', payload.new);
          }
        )
        .subscribe((status: string) => {
          console.log(`Vehicle channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            toast({
              title: "Real-time Vehicle Data Active",
              description: "Now receiving live vehicle updates from the network."
            });
            this.isConnected = true;
          }
        });
      
      // Initialize congestion data channel
      this.congestionChannel = supabase
        .channel('realtime-congestion')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'zones_congestion' }, 
          (payload: any) => {
            console.log("Received real-time congestion update:", payload);
            this.notifySubscribers('congestion', payload.new);
          }
        )
        .subscribe((status: string) => {
          console.log(`Congestion channel status: ${status}`);
        });
      
      // Initialize anomaly detection channel
      this.anomalyChannel = supabase
        .channel('realtime-anomalies')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'anomalies' }, 
          (payload: any) => {
            console.log("Received real-time anomaly detection:", payload);
            this.notifySubscribers('anomaly', payload.new);
            
            if (payload.new && payload.new.severity === 'Critical') {
              toast({
                title: "Critical Anomaly Detected",
                description: `${payload.new.type} detected for vehicle ${payload.new.vehicle_id}`,
                variant: "destructive"
              });
            }
          }
        )
        .subscribe();
      
      // Initialize RSU status channel
      this.rsuChannel = supabase
        .channel('realtime-rsus')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'rsus' }, 
          (payload: any) => {
            console.log("Received real-time RSU update:", payload);
            this.notifySubscribers('rsu', payload.new);
            
            // Notify on RSU status changes
            if (payload.old && payload.new && payload.old.status !== payload.new.status) {
              toast({
                title: "RSU Status Change",
                description: `${payload.new.rsu_id} changed status to ${payload.new.status}`,
                variant: payload.new.status === 'Active' ? 'default' : 'destructive'
              });
            }
          }
        )
        .subscribe();
        
      console.log("All real-time WebSocket connections initialized");
    } catch (error) {
      console.error("Error initializing WebSocket connections:", error);
      toast({
        title: "WebSocket Connection Error",
        description: "Failed to establish real-time data connections. Some features may be limited.",
        variant: "destructive"
      });
      this.isConnected = false;
    }
  }

  // Subscribe to real-time updates
  public subscribe(eventType: 'vehicle' | 'congestion' | 'anomaly' | 'rsu', callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    // Initialize WebSockets if this is our first subscriber
    if (!this.isConnected && supabase) {
      this.initializeWebSockets();
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  // Notify subscribers of new data
  private notifySubscribers(eventType: string, data: any): void {
    this.subscribers.get(eventType)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error notifying ${eventType} subscriber:`, error);
      }
    });
  }

  // Unsubscribe a specific event type
  public unsubscribe(eventType: 'vehicle' | 'congestion' | 'anomaly' | 'rsu'): void {
    this.subscribers.get(eventType)?.clear();
  }

  // Unsubscribe all event types
  public unsubscribeAll(): void {
    this.subscribers.forEach(subscriberSet => subscriberSet.clear());
  }

  // Cleanup all WebSocket connections
  public cleanup(): void {
    console.log("Cleaning up WebSocket connections...");
    
    if (this.vehicleChannel) this.vehicleChannel.unsubscribe();
    if (this.congestionChannel) this.congestionChannel.unsubscribe();
    if (this.anomalyChannel) this.anomalyChannel.unsubscribe();
    if (this.rsuChannel) this.rsuChannel.unsubscribe();
    
    this.unsubscribeAll();
    this.isConnected = false;
    
    console.log("All WebSocket connections cleaned up");
  }
}

export const realtimeService = RealtimeService.getInstance();
