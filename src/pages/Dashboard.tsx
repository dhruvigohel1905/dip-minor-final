import { useState } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecentScans } from '@/components/dashboard/RecentScans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, BarChart3, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);

  const quickActions = [
    {
      icon: Camera,
      label: 'Scan Shelf',
      description: 'Capture shelf image',
      action: () => onNavigate?.('scan'),
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      icon: Upload,
      label: 'Upload Dataset',
      description: 'Import Excel file',
      action: () => onNavigate?.('import'),
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View reports',
      action: () => onNavigate?.('analytics'),
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      icon: FileText,
      label: 'Reports',
      description: 'Download PDF',
      action: () => onNavigate?.('reports'),
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Welcome back! Here's an overview of your library management system.
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DashboardStats onDataLoad={setStats} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center justify-center p-6 gap-3 hover:shadow-lg transition-all"
                  onClick={action.action}
                >
                  <div className={`${action.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Alerts Panel - spans 1 column on lg */}
        <div className="lg:col-span-1">
          <AlertsPanel />
        </div>

        {/* Recent Scans - spans 2 columns on lg */}
        <div className="lg:col-span-2">
          <RecentScans />
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current library system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database Connection</span>
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">OCR Service</span>
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notification Service</span>
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick setup guide</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">1.</span>
                <span>Upload your book dataset via Excel</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">2.</span>
                <span>Configure shelves and rack numbers</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">3.</span>
                <span>Start scanning shelves with camera</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">4.</span>
                <span>Review alerts and generate reports</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
