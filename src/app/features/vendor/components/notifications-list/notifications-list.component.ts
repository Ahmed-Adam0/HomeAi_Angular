import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IVendorNotification } from '../../interfaces';
import { VendorNotificationType } from '../../models/vendor-notification-type.enum';

type NotificationIcon =
  | 'order'
  | 'revenue'
  | 'system'
  | 'review'
  | 'alert';

type NotificationTypeVariant = 'primary' | 'success' | 'secondary' | 'info' | 'warning';

interface NotificationVm {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  typeLabelKey: string;
  typeClass: string;
  icon: NotificationIcon;
}

const NOTIFICATION_TYPE_KEYS: Record<VendorNotificationType, string> = {
  [VendorNotificationType.Order]: 'VENDOR.NOTIFICATIONS.TYPE.ORDER',
  [VendorNotificationType.Revenue]: 'VENDOR.NOTIFICATIONS.TYPE.REVENUE',
  [VendorNotificationType.System]: 'VENDOR.NOTIFICATIONS.TYPE.SYSTEM',
  [VendorNotificationType.Review]: 'VENDOR.NOTIFICATIONS.TYPE.REVIEW',
  [VendorNotificationType.Alert]: 'VENDOR.NOTIFICATIONS.TYPE.ALERT',
};

const NOTIFICATION_TYPE_VARIANTS: Record<VendorNotificationType, NotificationTypeVariant> = {
  [VendorNotificationType.Order]: 'primary',
  [VendorNotificationType.Revenue]: 'success',
  [VendorNotificationType.System]: 'secondary',
  [VendorNotificationType.Review]: 'info',
  [VendorNotificationType.Alert]: 'warning',
};

const NOTIFICATION_TYPE_ICONS: Record<VendorNotificationType, NotificationIcon> = {
  [VendorNotificationType.Order]: 'order',
  [VendorNotificationType.Revenue]: 'revenue',
  [VendorNotificationType.System]: 'system',
  [VendorNotificationType.Review]: 'review',
  [VendorNotificationType.Alert]: 'alert',
};

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './notifications-list.component.html',
  styleUrl: './notifications-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsList {
  readonly notifications = input.required<IVendorNotification[]>();
  readonly markAsRead = output<string>();

  readonly items = computed((): NotificationVm[] =>
    (this.notifications() ?? []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      typeLabelKey: NOTIFICATION_TYPE_KEYS[notification.type],
      typeClass: `notification-type--${NOTIFICATION_TYPE_VARIANTS[notification.type]}`,
      icon: NOTIFICATION_TYPE_ICONS[notification.type],
    }))
  );

  protected onMarkAsRead(notificationId: string): void {
    this.markAsRead.emit(notificationId);
  }
}
