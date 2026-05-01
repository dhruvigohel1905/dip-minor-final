import { supabase } from "@/integrations/supabase/client";
import type { Scan, ScanItem, Alert, ScanWithDetails } from "@/types/database";

/**
 * Create a new scan record
 */
export async function createScan(
  userId: string,
  shelfScanned: string,
  totalBooksFound: number,
  snapshotUrl?: string
): Promise<Scan> {
  const { data, error } = await supabase
    .from("scans")
    .insert([
      {
        user_id: userId,
        shelf_scanned: shelfScanned,
        total_books_found: totalBooksFound,
        timestamp: new Date().toISOString(),
        snapshot_url: snapshotUrl || null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Scan;
}

/**
 * Update scan with results
 */
export async function updateScan(
  scanId: string,
  updates: Partial<Scan>
): Promise<Scan> {
  const { data, error } = await supabase
    .from("scans")
    .update(updates)
    .eq("id", scanId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Scan;
}

/**
 * Add scan item
 */
export async function addScanItem(
  scanId: string,
  bookId: string | null,
  detectedTitle: string,
  detectedAuthor?: string,
  confidence?: number,
  positionInShelf?: number,
  isMatch?: boolean
): Promise<ScanItem> {
  const { data, error } = await supabase
    .from("scan_items")
    .insert([
      {
        scan_id: scanId,
        book_id: bookId || null,
        detected_title: detectedTitle,
        detected_author: detectedAuthor || null,
        confidence: confidence || null,
        position_in_shelf: positionInShelf || null,
        is_match: isMatch || false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ScanItem;
}

/**
 * Get scan with details
 */
export async function getScanWithDetails(scanId: string): Promise<ScanWithDetails> {
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("*")
    .eq("id", scanId)
    .single();

  if (scanError) throw new Error(scanError.message);

  const { data: items, error: itemsError } = await supabase
    .from("scan_items")
    .select("*")
    .eq("scan_id", scanId);

  if (itemsError) throw new Error(itemsError.message);

  return {
    ...scan,
    items: items || [],
  } as ScanWithDetails;
}

/**
 * Get scans by shelf
 */
export async function getScansByShelf(
  shelfNumber: string,
  limit: number = 10
): Promise<Scan[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("shelf_scanned", shelfNumber)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as Scan[];
}

/**
 * Get scans by user
 */
export async function getScansByUser(
  userId: string,
  limit: number = 20
): Promise<Scan[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as Scan[];
}

/**
 * Get recent scans
 */
export async function getRecentScans(limit: number = 10): Promise<Scan[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as Scan[];
}

import { createAlertNotification } from "./notificationService";

/**
 * Create alert
 */
export async function createAlert(
  alertType: 'misplaced' | 'missing' | 'new_book',
  bookId: string | null,
  scanId: string | null,
  expectedShelf: string | null,
  detectedShelf: string | null,
  message: string
): Promise<Alert> {
  const { data: alert, error } = await supabase
    .from("alerts")
    .insert([
      {
        alert_type: alertType,
        book_id: bookId || null,
        scan_id: scanId || null,
        expected_shelf: expectedShelf || null,
        detected_shelf: detectedShelf || null,
        message,
        is_resolved: false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Fetch librarians to notify
  let librarians: any[] = [];
  const { data, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("role", "librarian");
  
  if (!fetchError && data) {
    librarians = data;
  } else {
    console.warn("Could not fetch librarians from users table (table might be missing or empty)");
  }

  if (librarians.length > 0) {
    await createAlertNotification(alert as Alert, librarians);
  }

  return alert as Alert;
}

/**
 * Get alerts
 */
export async function getAlerts(
  options?: {
    resolved?: boolean;
    limit?: number;
    alertType?: string;
  }
): Promise<Alert[]> {
  let query = supabase.from("alerts").select("*");

  if (options?.resolved !== undefined) {
    query = query.eq("is_resolved", options.resolved);
  }

  if (options?.alertType) {
    query = query.eq("alert_type", options.alertType);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(options?.limit || 50);

  if (error) throw new Error(error.message);
  return data as Alert[];
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string): Promise<Alert> {
  const { data, error } = await supabase
    .from("alerts")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Alert;
}

/**
 * Get unresolved alerts count
 */
export async function getUnresolvedAlertsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("is_resolved", false);

  if (error) throw new Error(error.message);
  return count || 0;
}

/**
 * Get statistics for dashboard
 */
export async function getDashboardStats(): Promise<{
  totalBooks: number;
  totalScans: number;
  unresolvedAlerts: number;
  misplacedBooks: number;
  missingBooks: number;
}> {
  const [
    { count: totalBooks },
    { count: totalScans },
    { count: unresolvedAlerts },
    { data: alerts },
  ] = await Promise.all([
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("scans").select("*", { count: "exact", head: true }),
    supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("is_resolved", false),
    supabase
      .from("alerts")
      .select("alert_type")
      .eq("is_resolved", false),
  ]);

  const misplacedCount = alerts?.filter((a) => a.alert_type === "misplaced").length || 0;
  const missingCount = alerts?.filter((a) => a.alert_type === "missing").length || 0;

  return {
    totalBooks: totalBooks || 0,
    totalScans: totalScans || 0,
    unresolvedAlerts: unresolvedAlerts || 0,
    misplacedBooks: misplacedCount,
    missingBooks: missingCount,
  };
}
