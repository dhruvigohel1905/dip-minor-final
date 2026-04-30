import { supabase } from "@/integrations/supabase/client";
import type { InAppNotification, SendNotificationPayload, EmailNotificationPayload } from "@/types/notifications";

/**
 * Send in-app notification
 */
export async function sendInAppNotification(payload: SendNotificationPayload): Promise<InAppNotification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: payload.user_id,
        type: "in_app",
        title: payload.title,
        message: payload.message,
        related_alert_id: payload.related_alert_id || null,
        is_read: false,
        sent_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InAppNotification;
}

/**
 * Send email notification via Supabase function
 */
export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<void> {
  try {
    await supabase.functions.invoke("send-email", {
      body: {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        html: payload.html || null,
      },
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email notification");
  }
}

/**
 * Send SMS notification via Supabase function (mock)
 */
export async function sendSMSNotification(phoneNumber: string, message: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-sms", {
      body: {
        to: phoneNumber,
        message: message,
      },
    });
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw new Error("Failed to send SMS notification");
  }
}

/**
 * Create alert notification
 * Sends notifications to relevant users when an alert is created
 */
export async function createAlertNotification(
  alert: any,
  librarians: any[]
): Promise<void> {
  const title = `Library Alert: ${alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)}`;
  const message = alert.message || `A ${alert.alert_type} book has been detected.`;

  // Send in-app notifications to all librarians
  for (const librarian of librarians) {
    try {
      await sendInAppNotification({
        user_id: librarian.id,
        type: "in_app",
        title,
        message,
        related_alert_id: alert.id,
      });
    } catch (error) {
      console.error("Failed to send notification to librarian:", error);
    }
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string): Promise<InAppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as InAppNotification[];
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<InAppNotification> {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InAppNotification;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
}

/**
 * Subscribe to notification changes for a user
 */
export function subscribeToNotifications(userId: string, callback: (notification: InAppNotification) => void) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as InAppNotification);
      }
    )
    .subscribe();

  return subscription;
}
