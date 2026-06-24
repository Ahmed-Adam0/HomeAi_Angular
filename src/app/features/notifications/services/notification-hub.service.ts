import { Injectable, inject, PLATFORM_ID, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants';
import { SignalRNotification, INotificationItem } from '../interfaces/inotification';
import { NotificationService as ToastService } from '../../../shared/services/notification.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationHubService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private hubConnection: signalR.HubConnection | null = null;
  private localIdCounter = 0;

  readonly isConnected = signal(false);
  readonly newNotifications$ = new Subject<INotificationItem>();

  constructor() {
    if (!this.isBrowser) return;

    effect(() => {
      if (this.authService.isAuthenticated()) {
        console.log('[NotificationHubService] Auth status changed: authenticated. Starting connection.');
        this.startConnection();
      } else {
        console.log('[NotificationHubService] Auth status changed: unauthenticated. Stopping connection.');
        this.stopConnection();
      }
    });
  }

  startConnection(): void {
    if (!this.isBrowser) return;

    if (this.hubConnection) {
      const state = this.hubConnection.state;
      if (
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        console.log(`[NotificationHubService] Connection already in state: ${state}. Skipping start.`);
        return;
      }
      this.stopConnection();
    }

    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.warn('[NotificationHubService] Cannot start connection: Access token not found in localStorage.');
      return;
    }

    const baseUrl = environment.apiUrl.replace(/\/api\/?\/?$/, '').replace(/\/+$/, '');
    const hubUrl = `${baseUrl}/hubs/notifications`;

    console.log(`[NotificationHubService] Creating new hub connection at URL: ${hubUrl}`);
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.registerHandlers();

    console.log('[NotificationHubService] Starting connection...');
    this.hubConnection
      .start()
      .then(() => {
        console.log('[NotificationHubService] Connection started successfully.');
        this.isConnected.set(true);
      })
      .catch((error) => {
        console.error('[NotificationHubService] Connection failed to start:', error);
        this.isConnected.set(false);
      });

    this.hubConnection.onreconnecting((error) => {
      console.warn('[NotificationHubService] Connection lost. Reconnecting...', error);
      this.isConnected.set(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log(`[NotificationHubService] Connection reconnected. Connection ID: ${connectionId}`);
      this.isConnected.set(true);
    });

    this.hubConnection.onclose((error) => {
      console.error('[NotificationHubService] Connection closed.', error);
      this.isConnected.set(false);
      this.hubConnection = null;
    });
  }

  stopConnection(): void {
    if (!this.hubConnection) return;

    console.log('[NotificationHubService] Stopping connection...');
    const connection = this.hubConnection;
    this.hubConnection = null;
    this.isConnected.set(false);

    try {
      connection.off('ReceiveNotification');
    } catch (e) {
      console.error('[NotificationHubService] Error turning off ReceiveNotification handler:', e);
    }

    connection
      .stop()
      .then(() => {
        console.log('[NotificationHubService] Connection stopped successfully.');
      })
      .catch((error) => {
        console.error('[NotificationHubService] Error while stopping connection:', error);
      });
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // Remove existing handler first to prevent duplicate registrations
    this.hubConnection.off('ReceiveNotification');

    this.hubConnection.on('ReceiveNotification', (data: SignalRNotification) => {
      console.log('[NotificationHubService] Notification received:', data);
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
