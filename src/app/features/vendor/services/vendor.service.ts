import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IVendorAnalytics,
  IVendorNotification,
  IVendorOrder,
  IVendorOrderStatusUpdate,
  IVendorRevenue,
  IWorkshopProfile,
  IWorkshopProfileUpdate,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  getOrders(): Observable<IVendorOrder[]> {
    throw new Error('VendorService.getOrders() is not implemented');
  }

  getOrderById(orderId: string): Observable<IVendorOrder> {
    throw new Error('VendorService.getOrderById() is not implemented');
  }

  updateOrderStatus(payload: IVendorOrderStatusUpdate): Observable<IVendorOrder> {
    throw new Error('VendorService.updateOrderStatus() is not implemented');
  }

  getRevenue(): Observable<IVendorRevenue> {
    throw new Error('VendorService.getRevenue() is not implemented');
  }

  getAnalytics(): Observable<IVendorAnalytics> {
    throw new Error('VendorService.getAnalytics() is not implemented');
  }

  getWorkshopProfile(): Observable<IWorkshopProfile> {
    throw new Error('VendorService.getWorkshopProfile() is not implemented');
  }

  updateWorkshopProfile(payload: IWorkshopProfileUpdate): Observable<IWorkshopProfile> {
    throw new Error('VendorService.updateWorkshopProfile() is not implemented');
  }

  getNotifications(): Observable<IVendorNotification[]> {
    throw new Error('VendorService.getNotifications() is not implemented');
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    throw new Error('VendorService.markNotificationAsRead() is not implemented');
  }

  markAllNotificationsAsRead(): Observable<void> {
    throw new Error('VendorService.markAllNotificationsAsRead() is not implemented');
  }
}
