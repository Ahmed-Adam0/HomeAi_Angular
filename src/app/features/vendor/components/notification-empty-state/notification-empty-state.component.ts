import {
  ChangeDetectionStrategy,
  Component,
  output,
} from '@angular/core';
import { Button } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-notification-empty-state',
  standalone: true,
  imports: [Button],
  templateUrl: './notification-empty-state.component.html',
  styleUrl: './notification-empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationEmptyState {
  readonly refresh = output<void>();
}
