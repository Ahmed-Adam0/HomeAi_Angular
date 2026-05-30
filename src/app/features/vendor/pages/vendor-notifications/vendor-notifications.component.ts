import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { NotificationsList } from '../../components';
import { IVendorNotification } from '../../interfaces';

@Component({
  selector: 'app-vendor-notifications',
  standalone: true,
  imports: [NotificationsList],
  templateUrl: './vendor-notifications.component.html',
  styleUrl: './vendor-notifications.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorNotifications {
  readonly notifications = signal<IVendorNotification[]>([]);
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  onMarkAsRead(id: string): void {}
}
