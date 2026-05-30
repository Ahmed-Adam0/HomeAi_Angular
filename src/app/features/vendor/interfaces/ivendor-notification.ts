import { VendorNotificationType } from '../models/vendor-notification-type.enum';

export interface IVendorNotification {
  id: string;
  vendorId: string;
  type: VendorNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface IVendorNotificationSummary {
  unreadCount: number;
  recent: IVendorNotification[];
}
