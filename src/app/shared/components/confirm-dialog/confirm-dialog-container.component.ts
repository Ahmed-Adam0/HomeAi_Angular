import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { ConfirmDialog } from './confirm-dialog.component';

@Component({
  selector: 'app-confirm-dialog-container',
  imports: [ConfirmDialog],
  template: `
    @if (dialogService.state(); as state) {
      <app-confirm-dialog
        [visible]="state.visible"
        [title]="state.config.title"
        [message]="state.config.message"
        [confirmText]="state.config.confirmText || 'Confirm'"
        [cancelText]="state.config.cancelText || 'Cancel'"
        [variant]="state.config.variant || 'danger'"
        (confirm)="dialogService.confirm()"
        (cancel)="dialogService.cancel()"
      />
    }
  `,
})
export class ConfirmDialogContainer {
  protected readonly dialogService = inject(DialogService);
}
