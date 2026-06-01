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
import {
  IVendorAnalytics,
  IVendorDashboardMetrics,
  IVendorNotification,
  IVendorOrder,
  IVendorOrderSummary,
  IVendorOrderStatusUpdate,
  IVendorRevenue,
  IWorkshopProfile,
  IWorkshopProfileUpdate,
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

