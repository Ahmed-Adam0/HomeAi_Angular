import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../interfaces/inotification';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notification-center-page',
  imports: [EmptyStateComponent, DatePipe],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css'
})
export class NotificationCenterComponent implements OnInit {
  protected notificationService = inject(NotificationService);

  readonly notificationsList = signal<INotification[]>([]);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe((data) => {
      this.notificationsList.set(data);
    });
  }

  markRead(id: string): void {
    this.notificationService.markAsRead(id);
    this.loadNotifications();
  }

  clearAll(): void {
    this.notificationService.clearAll();
    this.loadNotifications();
  }
}
