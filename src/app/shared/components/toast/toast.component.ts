import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertComponent } from '../alert/alert.component';

@Component({
  selector: 'app-toast',
  imports: [AlertComponent],
  template: `
    <div class="toast-stack">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div class="toast-item">
          <app-alert
            [type]="notification.type"
            [message]="notification.message"
            [action]="notification.action ?? null"
            (close)="notificationService.dismiss(notification.id)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1100;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    :host-context([dir="rtl"]) .toast-stack,
    :host-context(.rtl-layout) .toast-stack {
      right: auto;
      left: 16px;
    }
    :host-context([dir="rtl"]) .toast-item,
    :host-context(.rtl-layout) .toast-item {
      animation: toastSlideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes toastSlideInLeft {
      from { opacity: 0; transform: translateX(-100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `],
})
export class ToastContainer {
  protected readonly notificationService = inject(NotificationService);
}
