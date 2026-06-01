import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-unread-badge',
  standalone: true,
  imports: [],
  template: `
    @if (visible()) {
      <span
        class="unread-badge"
        [class.unread-badge--pulse]="pulse()"
        [attr.aria-label]="count() + ' unread notifications'"
      >
        {{ count() }}
      </span>
    }
  `,
  styleUrl: './unread-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnreadBadge {
  readonly count = input<number>(0);
  readonly pulse = input<boolean>(true);

  readonly visible = computed(() => this.count() > 0);
}
