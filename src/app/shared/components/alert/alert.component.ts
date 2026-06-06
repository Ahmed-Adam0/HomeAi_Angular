import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {
  @Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info';
  @Input() message = '';
  @Input() action: { label: string; routerLink: string } | null = null;
  @Input() dismissible = true;
  @Input() inline = false;

  @Output() close = new EventEmitter<void>();

  visible = true;

  onClose(): void {
    this.visible = false;
    this.close.emit();
  }
}
