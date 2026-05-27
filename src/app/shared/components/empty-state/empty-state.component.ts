import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Button } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  imports: [Button],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() title = 'No results found';
  @Input() description = 'We could not find what you were looking for.';
  @Input() icon = '📦';
  @Input() actionText = '';

  @Output() actionClick = new EventEmitter<void>();

  onAction(): void {
    this.actionClick.emit();
  }
}
