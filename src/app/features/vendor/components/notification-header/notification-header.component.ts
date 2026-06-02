import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { Button } from '../../../../shared/components/button/button.component';
import { UnreadBadge } from '../unread-badge/unread-badge.component';

@Component({
  selector: 'app-notification-header',
  standalone: true,
  imports: [TranslatePipe, Button, UnreadBadge],
  templateUrl: './notification-header.component.html',
  styleUrl: './notification-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationHeader {
  readonly unreadCount = input<number>(0);
  readonly hasUnread = input<boolean>(false);
  readonly markAllLoading = input<boolean>(false);
  readonly totalCount = input<number>(0);

  readonly markAllRead = output<void>();

  readonly showMarkAll = computed(() => this.hasUnread() && this.totalCount() > 1);
}
