
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
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionAttempts: number = 0;

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
   * Check if the real-time connection is possible and active
   */
  public async checkConnection(): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      // Test the connection
      const { error } = await supabase.from('vehicles').select('count', { count: 'exact' }).limit(1);
      
      if (error) {
        console.error("Supabase connection error:", error);
        this.isConnected = false;
        return false;
      }
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error("Error checking Supabase connection:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Returns current connection status
   */
  public isConnected(): boolean {
    return this.isConnected;
  }

  // Initialize WebSocket connection to real data sources
  public initializeWebSockets(): void {
    if (!supabase) {
      console.error("Supabase client not available");
      return;
    }
    
    try {
      console.log("Initializing real-time WebSocket connections...");
      this.connectionAttempts++;
      
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
            if (!this.isConnected) {
              toast({
                title: "Real-time Vehicle Data Active",
                description: "Now receiving live vehicle updates from the network."
              });
            }
            this.isConnected = true;
            this.connectionAttempts = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleConnectionError('vehicle');
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
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleConnectionError('congestion');
          }
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
        .subscribe((status: string) => {
          console.log(`Anomaly channel status: ${status}`);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleConnectionError('anomaly');
          }
        });
      
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
        .subscribe((status: string) => {
          console.log(`RSU channel status: ${status}`);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleConnectionError('rsu');
          }
        });
        
      console.log("All real-time WebSocket connections initialized");
      
      // Check connection status after a short delay
      setTimeout(() => this.checkConnection(), 5000);
      
    } catch (error) {
      console.error("Error initializing WebSocket connections:", error);
      toast({
        title: "WebSocket Connection Error",
        description: "Failed to establish real-time data connections. Retrying...",
        variant: "destructive"
      });
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }
  
  // Handle connection errors
  private handleConnectionError(channelType: string): void {
    console.error(`${channelType} channel error, attempting to reconnect`);
    this.isConnected = false;
    this.scheduleReconnect();
  }
  
  // Schedule a connection retry
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Exponential backoff with maximum of 1 minute
    const backoffMs = Math.min(30000, Math.pow(2, Math.min(this.connectionAttempts, 10)) * 1000);
    
    console.log(`Scheduling reconnect in ${backoffMs}ms (attempt ${this.connectionAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log("Attempting to reconnect WebSockets...");
      this.cleanup();
      this.initializeWebSockets();
    }, backoffMs);
  }

  // Resubscribe all channels
  public resubscribeAll(): void {
    console.log("Resubscribing all WebSocket channels");
    
    if (this.vehicleChannel) this.vehicleChannel.subscribe();
    if (this.congestionChannel) this.congestionChannel.subscribe();
    if (this.anomalyChannel) this.anomalyChannel.subscribe();
    if (this.rsuChannel) this.rsuChannel.subscribe();
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
    
    this.vehicleChannel = null;
    this.congestionChannel = null;
    this.anomalyChannel = null;
    this.rsuChannel = null;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    console.log("All WebSocket connections cleaned up");
  }
}

export const realtimeService = RealtimeService.getInstance();
