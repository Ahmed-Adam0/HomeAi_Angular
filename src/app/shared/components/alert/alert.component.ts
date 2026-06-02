import { Component, Input, Output, EventEmitter } from '@angular/core';

import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {
  @Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info';
  @Input() message = '';
  @Input() dismissible = true;

  @Output() close = new EventEmitter<void>();

  visible = true;

  onClose(): void {
    this.visible = false;
    this.close.emit();
  }
}
