import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {
  @Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info';
  @Input() message = '';
  @Input() dismissible = true;
  @Input() inline = false;

  @Output() close = new EventEmitter<void>();

  visible = true;

  onClose(): void {
    this.visible = false;
    this.close.emit();
  }
}
