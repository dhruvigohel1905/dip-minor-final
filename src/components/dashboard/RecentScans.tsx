import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecentScans } from '@/services/scanService';
import type { Scan } from '@/types/database';
import { ScanLine, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface RecentScansProps {
  limit?: number;
}

export const RecentScans = ({ limit = 8 }: RecentScansProps) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();

    // Refresh scans every 30 seconds
    const interval = setInterval(loadScans, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadScans = async () => {
    try {
      setLoading(true);
      const data = await getRecentScans(limit);
      setScans(data);
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Latest library shelf scans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Latest library shelf scans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <ScanLine className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-center text-muted-foreground">
              No scans yet. Start scanning shelves to see them here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Scans</CardTitle>
        <CardDescription>Latest {scans.length} shelf scans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scans.map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ScanLine className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Shelf {scan.shelf_scanned}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scan.total_books_found} books found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(scan.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  {scan.missing_books_count > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {scan.missing_books_count} missing
                    </p>
                  )}
                  {scan.misplaced_books_count > 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      {scan.misplaced_books_count} misplaced
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
