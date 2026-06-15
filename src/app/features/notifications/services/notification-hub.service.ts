import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants';
import { SignalRNotification, INotificationItem } from '../interfaces/inotification';
import { NotificationService as ToastService } from '../../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationHubService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toastService = inject(ToastService);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private hubConnection: signalR.HubConnection | null = null;
  private localIdCounter = 0;

  readonly isConnected = signal(false);
  readonly newNotifications$ = new Subject<INotificationItem>();

  startConnection(): void {
    if (!this.isBrowser) return;
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return;

    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;

    const baseUrl = environment.apiUrl.replace(/\/api\/?\/?$/, '').replace(/\/+$/, '');
    const hubUrl = `${baseUrl}/hubs/notifications`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.registerHandlers();

    this.hubConnection
      .start()
      .then(() => this.isConnected.set(true))
      .catch(() => this.isConnected.set(false));

    this.hubConnection.onreconnecting(() => this.isConnected.set(false));
    this.hubConnection.onreconnected(() => this.isConnected.set(true));
    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
      this.hubConnection = null;
    });
  }

  stopConnection(): void {
    if (!this.hubConnection) return;

    const connection = this.hubConnection;
    this.hubConnection = null;
    this.isConnected.set(false);

    connection
      .stop()
      .catch(() => {});
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveNotification', (data: SignalRNotification) => {
      this.localIdCounter -= 1;

      const notification: INotificationItem = {
        id: data.id ?? this.localIdCounter,
        title: data.title,
        message: data.message,
        isRead: data.isRead ?? false,
        createdAt: new Date(data.createdAt),
      };

      this.newNotifications$.next(notification);
      this.toastService.info(`${data.title}: ${data.message}`);
    });
  }
}
