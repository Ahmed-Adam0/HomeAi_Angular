import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogContainer } from '../../../shared/components/confirm-dialog/confirm-dialog-container.component';
import { ToastContainer } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, ConfirmDialogContainer, ToastContainer],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent {}
