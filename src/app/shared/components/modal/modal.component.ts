import { Component, input, output, HostListener } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  readonly title = input('');
  readonly visible = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly close = output<void>();

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }
}
