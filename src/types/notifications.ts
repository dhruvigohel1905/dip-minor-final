// Notification types

export interface InAppNotification {
  id: string;
  user_id: string;
  type: 'email' | 'in_app' | 'sms';
  title: string | null;
  message: string | null;
  related_alert_id: string | null;
  is_read: boolean;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  email: boolean;
  in_app: boolean;
  sms: boolean;
}

export interface SendNotificationPayload {
  user_id: string;
  type: 'email' | 'in_app' | 'sms';
  title: string;
  message: string;
  related_alert_id?: string;
}

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}
