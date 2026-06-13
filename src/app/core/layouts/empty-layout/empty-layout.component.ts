import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogContainer } from '../../../shared/components/confirm-dialog/confirm-dialog-container.component';
import { ToastContainer } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-empty-layout',
  imports: [RouterOutlet, ConfirmDialogContainer, ToastContainer],
  templateUrl: './empty-layout.component.html',
  styleUrl: './empty-layout.component.css'
})
export class EmptyLayoutComponent {}
