import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { IVendorNotificationItem } from '../../interfaces';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCard {
  readonly notification = input.required<IVendorNotificationItem>();
  readonly isMarking = input<boolean>(false);

  readonly markAsRead = output<void>();

  readonly isUnread = computed(() => !this.notification().isRead);
  readonly iconType = computed(() => this.notification().icon);
  readonly timeAgo = computed(() => {
    const now = Date.now();
    const then = this.notification().createdAt.getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return this.notification().createdAt.toLocaleDateString();
  });

  protected onMarkAsRead(): void {
    if (!this.isMarking()) {
      this.markAsRead.emit();
    }
  }
}
