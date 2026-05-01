import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Filter,
  Check,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { getAlerts, resolveAlert } from '@/services/scanService';
import type { Alert } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function NotificationCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts({ 
        resolved: filter === 'all' ? undefined : filter === 'resolved',
        limit: 20
      });
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      toast({
        title: "Alert Resolved",
        description: "The shelf issue has been marked as resolved.",
      });
      loadAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive"
      });
    }
  };

  const unreadCount = alerts.filter(a => !a.is_resolved).length;

  return (
    <Card className="glass-card border-white/10 shadow-2xl h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-display font-bold">Notification Center</CardTitle>
              <CardDescription className="text-xs">
                {unreadCount} pending alerts require your attention
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
            {(['unresolved', 'resolved', 'all'] as const).map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f)}
                className={cn(
                  "h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  filter === f ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                )}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
              <CheckCircle2 className="h-12 w-12 mb-4 text-green-500" />
              <p className="font-display font-bold text-lg">All caught up!</p>
              <p className="text-xs">No pending alerts for your library.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "p-5 transition-all hover:bg-white/5 group relative",
                    !alert.is_resolved && "border-l-4 border-primary"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                      alert.alert_type === 'misplaced' ? "bg-red-500/20 text-red-500" : 
                      alert.alert_type === 'missing' ? "bg-yellow-500/20 text-yellow-500" : 
                      "bg-blue-500/20 text-blue-500"
                    )}>
                      {alert.alert_type === 'misplaced' ? <AlertTriangle className="h-5 w-5" /> : 
                       alert.alert_type === 'missing' ? <AlertCircle className="h-5 w-5" /> : 
                       <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {alert.alert_type} Book Alert
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.created_at))} ago
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center gap-4 pt-2">
                        {alert.expected_shelf && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">Expected:</span>
                            <Badge variant="outline" className="h-4 py-0 border-white/20 text-white/60">
                              Shelf {alert.expected_shelf}
                            </Badge>
                          </div>
                        )}
                        {alert.detected_shelf && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">Detected:</span>
                            <Badge variant="outline" className="h-4 py-0 border-primary/20 text-primary/80 bg-primary/5">
                              Shelf {alert.detected_shelf}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!alert.is_resolved && (
                    <div className="absolute right-5 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleResolve(alert.id)}
                        className="h-8 px-3 text-[10px] font-bold bg-primary text-white hover:bg-primary/90"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" /> Resolve Issue
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
