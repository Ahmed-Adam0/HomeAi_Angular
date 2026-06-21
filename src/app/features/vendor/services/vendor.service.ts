import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { IVendorOrdersFilterRequestDto } from '../data-access/dto/vendor-orders-filter-request.dto';
import { IVendorOrdersFilterResponseDto } from '../data-access/dto/vendor-orders-filter-response.dto';
import { IVendorOrderDetailsDto } from '../data-access/dto/vendor-order-details.dto';
import { IVendorDashboardMetricsDto } from '../data-access/dto/vendor-dashboard-metrics.dto';
import { IVendorRevenueStatisticsDto } from '../data-access/dto/vendor-revenue-statistics.dto';
import { IVendorOrderAnalyticsDto } from '../data-access/dto/vendor-order-analytics.dto';
import { VendorOrderStatus, OrderStatus } from '../models/vendor-order-status.enum';
import {
  mapVendorOrderDetails,
  mapVendorDashboardMetricsDtoToViewModel,
  mapVendorOrderAnalytics,
} from '../data-access/mappers/vendor-order.mapper';
import { mapVendorRevenueStatistics } from '../data-access/mappers/vendor-revenue.mapper';
import { mapVendorProfileResponseDto } from '../data-access/mappers/vendor-profile.mapper';
import { IVendorProfileResponseDto } from '../data-access/dto/vendor-profile-response.dto';
import { IVendorProfileRequestDto } from '../data-access/dto/vendor-profile-request.dto';
import { IVendorNotificationsResponseDto } from '../data-access/dto/vendor-notifications-response.dto';
import { IUnreadCountDto } from '../data-access/dto/unread-count.dto';
import { mapNotificationsResponse, INotificationsMappedResult } from '../data-access/mappers/vendor-notification.mapper';
import { mapBackendToOrder } from '../../orders/data-access/orders.mapper';
import { IOrder } from '../../orders/interfaces/iorder';
import {
  IVendorAnalytics,
  IVendorDashboardMetrics,
  IVendorOrder,
  IVendorOrderSummary,
  IVendorOrderStatusUpdate,
  IVendorProfile,
  IVendorProfileUpdateRequest,
  IVendorRevenue,
  StatusUpdateResponse,
  IVendorOrdersPaginatedResponse,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getOrders(filter: IVendorOrdersFilterRequestDto = { pageNumber: 1, pageSize: 20, sortDescending: true }): Observable<IVendorOrdersPaginatedResponse> {
    return this.http
      .post<IVendorOrdersFilterResponseDto>(
        `${this.apiUrl}${API_URLS.VENDOR.ORDERS_FILTER}`,
        filter
      )
      .pipe(
        map((res) => ({
          data: (res.data || []).map((o: any) => mapBackendToOrder(o)),
          totalCount: res.totalCount ?? 0,
          pageNumber: res.pageNumber ?? 1,
          pageSize: res.pageSize ?? 20,
          totalPages: res.totalPages ?? 1,
        }))
      );
  }

  getOrderById(orderId: string): Observable<IVendorOrder> {
    return this.http
      .get<IVendorOrderDetailsDto>(
        `${this.apiUrl}${API_URLS.VENDOR.ORDER_DETAILS(orderId)}`
      )
      .pipe(map(mapVendorOrderDetails));
  }


  updateOrderStatus(orderId: number, status: OrderStatus): Observable<StatusUpdateResponse> {
    const requestBody = { newStatus: status };
    return this.http.put<StatusUpdateResponse>(
      `${this.apiUrl}${API_URLS.VENDOR.UPDATE_ORDER_STATUS(orderId)}`,
      requestBody
    );
  }

  proposeDeliveryDate(orderId: number | string, estimatedDeliveryDate: string): Observable<{ message: string }> {
    const requestBody = { estimatedDeliveryDate };
    return this.http.put<{ message: string }>(
      `${this.apiUrl}VendorOrders/orders/${orderId}/propose-date`,
      requestBody
    );
  }

  getDashboardMetrics(): Observable<IVendorDashboardMetrics> {
    return this.http
      .get<IVendorDashboardMetricsDto>(
        `${this.apiUrl}${API_URLS.VENDOR.DASHBOARD_METRICS}`
      )
      .pipe(
        map(mapVendorDashboardMetricsDtoToViewModel)
      );
  }

  getRevenue(): Observable<IVendorRevenue> {
    return this.http
      .get<IVendorRevenueStatisticsDto>(
        `${this.apiUrl}${API_URLS.VENDOR.REVENUE_ANALYTICS}`
      )
      .pipe(map(mapVendorRevenueStatistics));
  }

  getAnalytics(): Observable<IVendorAnalytics> {
    return this.http
      .get<IVendorOrderAnalyticsDto>(
        `${this.apiUrl}${API_URLS.VENDOR.ORDERS_ANALYTICS}`
      )
      .pipe(map(mapVendorOrderAnalytics));
  }

  getWorkshopProfile(): Observable<IVendorProfile> {
    return this.http
      .get<IVendorProfileResponseDto>(`${this.apiUrl}${API_URLS.VENDOR.PROFILE}`)
      .pipe(map(mapVendorProfileResponseDto));
  }

  updateWorkshopProfile(payload: IVendorProfileUpdateRequest): Observable<IVendorProfile> {
    const request: IVendorProfileRequestDto = {
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
      email: payload.email,
      preferredLanguage: payload.preferredLanguage,
      workshopNameAr: payload.workshopNameAr,
      workshopNameEn: payload.workshopNameEn,
      descriptionAr: payload.descriptionAr,
      descriptionEn: payload.descriptionEn,
      workshopAddress: {
        city: payload.workshopAddress.city,
        area: payload.workshopAddress.area,
        street: payload.workshopAddress.street,
        buildingNumber: payload.workshopAddress.buildingNumber,
        notes: payload.workshopAddress.notes,
      },
    };

    return this.http
      .put<IVendorProfileResponseDto>(`${this.apiUrl}${API_URLS.VENDOR.PROFILE}`, request)
      .pipe(map(mapVendorProfileResponseDto));
  }

  uploadWorkshopLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file, file.name);

    for (const entry of (formData as any).entries()) {
      console.log('[VendorService] formData entry:', entry);
    }
    console.log('[VendorService] file object:', file);

    return this.http.put<{ logoUrl: string }>(
      `${this.apiUrl}${API_URLS.VENDOR.UPLOAD_LOGO}`,
      formData
    );
  }

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    console.log('[VendorService] profileImage file:', file.name, file.type, file.size);

    return this.http.put(
      `${this.apiUrl}${API_URLS.PROFILE.IMAGE_UPLOAD}`,
      formData
    );
  }

  getNotifications(page: number, pageSize: number): Observable<INotificationsMappedResult> {
    return this.http
      .get<IVendorNotificationsResponseDto>(
        `${this.apiUrl}${API_URLS.VENDOR.NOTIFICATIONS}`,
        { params: { page: page.toString(), pageSize: pageSize.toString() } }
      )
      .pipe(map(mapNotificationsResponse));
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<IUnreadCountDto>(`${this.apiUrl}${API_URLS.VENDOR.NOTIFICATIONS_UNREAD_COUNT}`)
      .pipe(map((dto) => dto.unreadCount ?? 0));
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}${API_URLS.VENDOR.NOTIFICATION_READ(notificationId)}`, null);
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}${API_URLS.VENDOR.NOTIFICATIONS_READ_ALL}`, null);
  }

  getVendorMaterials(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}${API_URLS.VENDOR.MATERIALS}`);
  }

  createMaterial(nameAr: string, nameEn: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${API_URLS.VENDOR.CREATE_GROUP}`, { nameAr, nameEn });
  }

  deleteMaterial(groupId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_URLS.VENDOR.DELETE_GROUP(groupId)}`);
  }

  createOption(groupId: string | number, valueAr: string, valueEn: string, priceDelta: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${API_URLS.VENDOR.ADD_OPTION(groupId)}`, { valueAr, valueEn, priceDelta });
  }

  deleteOption(optionId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_URLS.VENDOR.DELETE_OPTION(optionId)}`);
  }

  updateMaterial(groupId: string | number, nameAr: string, nameEn: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}${API_URLS.VENDOR.MATERIALS}/Groups/${groupId}`, { nameAr, nameEn });
  }

  updateOption(optionId: string | number, valueAr: string, valueEn: string, priceDelta: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}${API_URLS.VENDOR.MATERIALS}/Options/${optionId}`, { valueAr, valueEn, priceDelta });
  }
}

