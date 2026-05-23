import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() title = '';
  @Input() visible = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.visible = false;
    this.close.emit();
  }
}
