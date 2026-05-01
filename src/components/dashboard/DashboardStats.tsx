import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats } from '@/services/scanService';
import { BookOpen, BookMarked, AlertTriangle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

import { DashboardStatsData } from '@/types/dashboard';

interface DashboardStatsProps {
  onDataLoad?: (stats: DashboardStatsData) => void;
}

export const DashboardStats = ({ onDataLoad }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalScans: 0,
    unresolvedAlerts: 0,
    misplacedBooks: 0,
    missingBooks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        if (onDataLoad) onDataLoad(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [onDataLoad]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      trend: '+2.5%',
    },
    {
      title: 'Total Scans',
      value: stats.totalScans,
      icon: Zap,
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
      trend: '+12%',
    },
    {
      title: 'Misplaced Books',
      value: stats.misplacedBooks,
      icon: BookMarked,
      color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      trend: stats.misplacedBooks > 0 ? '-3%' : '0%',
    },
    {
      title: 'Missing Books',
      value: stats.missingBooks,
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400',
      trend: stats.missingBooks > 0 ? 'Critical' : 'None',
    },
    {
      title: 'Pending Alerts',
      value: stats.unresolvedAlerts,
      icon: AlertTriangle,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      trend: `${stats.unresolvedAlerts} unresolved`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2.5 rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
