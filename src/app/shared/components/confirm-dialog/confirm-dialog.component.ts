import { Component, input, output, HostListener } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialog {
  readonly title = input('Confirm Action');
  readonly message = input('Are you sure you want to proceed?');
  readonly confirmText = input('Confirm');
  readonly cancelText = input('Cancel');
  readonly visible = input(false);
  readonly variant = input<'danger' | 'warning' | 'info'>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onCancel();
  }
}
