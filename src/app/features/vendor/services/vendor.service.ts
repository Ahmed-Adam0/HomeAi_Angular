import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { IVendorOrdersFilterRequestDto } from '../data-access/dto/vendor-orders-filter-request.dto';
import { IVendorOrdersFilterResponseDto } from '../data-access/dto/vendor-orders-filter-response.dto';
import { IVendorOrderDetailsDto } from '../data-access/dto/vendor-order-details.dto';
import { IVendorUpdateOrderStatusRequestDto, VendorOrderStatusApi } from '../data-access/dto/vendor-update-order-status-request.dto';
import { STATUS_API_MAP } from '../data-access/mappers/vendor-order-status.mapper';
import { IVendorDashboardMetricsDto } from '../data-access/dto/vendor-dashboard-metrics.dto';
import { IVendorRevenueStatisticsDto } from '../data-access/dto/vendor-revenue-statistics.dto';
import { IVendorOrderAnalyticsDto } from '../data-access/dto/vendor-order-analytics.dto';
import { VendorOrderStatus } from '../models/vendor-order-status.enum';
import {
  mapVendorOrdersFilterResponse,
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
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getOrders(): Observable<IVendorOrderSummary[]> {
    const request: IVendorOrdersFilterRequestDto = {
      pageNumber: 1,
      pageSize: 20,
      sortDescending: true,
    };

    return this.http
      .post<IVendorOrdersFilterResponseDto>(
        `${this.apiUrl}${API_URLS.VENDOR.ORDERS_FILTER}`,
        request
      )
      .pipe(
        map(mapVendorOrdersFilterResponse)
      );
  }

  getOrderById(orderId: string): Observable<IVendorOrder> {
    return this.http
      .get<IVendorOrderDetailsDto>(
        `${this.apiUrl}${API_URLS.VENDOR.ORDER_DETAILS(orderId)}`
      )
      .pipe(map(mapVendorOrderDetails));
  }

  updateOrderStatus(orderId: number, newStatus: VendorOrderStatus): Observable<StatusUpdateResponse>;
  updateOrderStatus(payload: IVendorOrderStatusUpdate): Observable<StatusUpdateResponse>;
  updateOrderStatus(
    orderIdOrPayload: number | IVendorOrderStatusUpdate,
    newStatus?: VendorOrderStatus
  ): Observable<StatusUpdateResponse> {
    if (typeof orderIdOrPayload === 'number') {
      const requestBody: IVendorUpdateOrderStatusRequestDto = {
        newStatus: STATUS_API_MAP[newStatus!] as VendorOrderStatusApi,
      };

      return this.http
        .put<StatusUpdateResponse>(
          `${this.apiUrl}${API_URLS.VENDOR.UPDATE_ORDER_STATUS(orderIdOrPayload)}`,
          requestBody
        );
    }

    const requestBody: IVendorUpdateOrderStatusRequestDto = {
      newStatus: STATUS_API_MAP[orderIdOrPayload.status] as VendorOrderStatusApi,
    };

    return this.http
      .put<StatusUpdateResponse>(
        `${this.apiUrl}${API_URLS.VENDOR.UPDATE_ORDER_STATUS(orderIdOrPayload.orderId)}`,
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
}

