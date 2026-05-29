import { Component, inject } from '@angular/core';
import { AuthRequiredService } from '../../services/auth-required.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-auth-required-dialog',
  imports: [ConfirmDialog],
  templateUrl: './auth-required-dialog.component.html',
  styleUrl: './auth-required-dialog.component.css'
})
export class AuthRequiredDialogComponent {
  private readonly authRequiredService = inject(AuthRequiredService);

  readonly dialogState = this.authRequiredService.dialogState;

  onConfirm(): void {
    this.authRequiredService.confirm();
  }

  onCancel(): void {
    this.authRequiredService.cancel();
  }
}
