export type NotificationType = 'message' | 'meeting' | 'call' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

