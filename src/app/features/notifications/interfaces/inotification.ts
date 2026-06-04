export interface INotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export interface INotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
