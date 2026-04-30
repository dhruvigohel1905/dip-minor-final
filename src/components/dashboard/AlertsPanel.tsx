import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAlerts, resolveAlert } from '@/services/scanService';
import type { Alert } from '@/types/database';
import { AlertTriangle, CheckCircle2, BookMarked } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface AlertsPanelProps {
  limit?: number;
}

export const AlertsPanel = ({ limit = 5 }: AlertsPanelProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();

    // Refresh alerts every 20 seconds
    const interval = setInterval(loadAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts({
        resolved: false,
        limit,
      });
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setResolving(alertId);
    try {
      await resolveAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast({
        title: 'Alert resolved',
        description: 'The alert has been marked as resolved.',
      });
    } catch (error) {
      toast({
        title: 'Failed to resolve alert',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setResolving(null);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'misplaced':
        return <BookMarked className="h-4 w-4 text-yellow-600" />;
      case 'missing':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'new_book':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'misplaced':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'missing':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'new_book':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Recent library alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Recent library alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-center text-muted-foreground">
              No pending alerts. Great job keeping the library organized!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts ({alerts.length})</CardTitle>
        <CardDescription>Recent unresolved issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${getAlertColor(alert.alert_type)} border-current/20`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getAlertIcon(alert.alert_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">
                        {alert.alert_type}
                      </Badge>
                      {alert.expected_shelf && (
                        <span className="text-xs text-muted-foreground">
                          Expected: {alert.expected_shelf}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleResolveAlert(alert.id)}
                  disabled={resolving === alert.id}
                >
                  {resolving === alert.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
