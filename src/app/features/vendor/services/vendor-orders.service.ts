import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { unwrap } from '../../../core/utils/api-utils';
import { IOrder } from '../../orders/interfaces/iorder';
import { mapBackendToOrder } from '../../orders/data-access/orders.mapper';
import { IVendorOrdersPaginatedResponse } from '../interfaces/ivendor-order';
import { OrderStatus } from '../models/vendor-order-status.enum';



export interface IVendorOrderMetric {
  totalOrders: number;
  totalRevenue: number;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  activeOrdersCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class VendorOrdersService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  readonly ordersList = signal<IOrder[]>([]);
  readonly dashboardMetrics = signal<IVendorOrderMetric | null>(null);
  readonly activityFeed = signal<any[]>([]);
  readonly revenueAnalytics = signal<any[]>([]);
  readonly ordersAnalytics = signal<any[]>([]);

  /**
   * Fetch dashboard metrics.
   * Target: GET /api/VendorOrders/dashboard/metrics
   */
  getDashboardMetrics(): Observable<IVendorOrderMetric> {
    return this.http.get<any>(`${this.apiUrl}VendorOrders/dashboard/metrics`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        console.log('Vendor Orders Metrics API Response:', unwrapped);
        
        // Map backend properties safely
        return {
          totalOrders: Number(unwrapped?.totalOrders || unwrapped?.ordersCount || 0),
          totalRevenue: Number(unwrapped?.totalRevenue || unwrapped?.revenue || 0),
          pendingOrdersCount: Number(unwrapped?.pendingOrdersCount || unwrapped?.pendingCount || 0),
          completedOrdersCount: Number(unwrapped?.completedOrdersCount || unwrapped?.completedCount || 0),
          activeOrdersCount: Number(unwrapped?.activeOrdersCount || unwrapped?.activeCount || 0)
        };
      }),
      tap(metrics => this.dashboardMetrics.set(metrics))
    );
  }

  /**
   * Fetch filtered and paginated vendor orders list.
   * Target: POST /api/VendorOrders/orders/filter
   */
  getFilteredOrders(filter: { pageNumber?: number; pageSize?: number; status?: string | null; searchTerm?: string } = {}): Observable<IVendorOrdersPaginatedResponse> {
    const payload = {
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 10,
      status: filter.status || null,
      searchTerm: filter.searchTerm || ""
    };
    
    console.log('POST /api/VendorOrders/orders/filter Payload:', payload);
    
    return this.http.post<any>(`${this.apiUrl}VendorOrders/orders/filter`, payload).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        console.log('Vendor Orders Filter API Response:', unwrapped);
        
        const rawData = unwrapped?.data || unwrapped?.items || (Array.isArray(unwrapped) ? unwrapped : []);
        const mappedData = rawData.map((o: any) => mapBackendToOrder(o));
        
        return {
          data: mappedData,
          totalCount: unwrapped?.totalCount ?? mappedData.length,
          pageNumber: unwrapped?.pageNumber ?? payload.pageNumber,
          pageSize: unwrapped?.pageSize ?? payload.pageSize,
          totalPages: unwrapped?.totalPages ?? 1
        };
      }),
      tap(paginated => this.ordersList.set(paginated.data))
    );
  }


  /**
   * Fetch single order details.
   * Target: GET /api/VendorOrders/orders/{orderId}
   */
  getOrderById(orderId: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}VendorOrders/orders/${orderId}`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        console.log(`GET /api/VendorOrders/orders/${orderId} Response:`, unwrapped);
        return this.normalizeVendorOrder(unwrapped);
      })
    );
  }

  updateOrderStatus(orderId: string | number, status: OrderStatus): Observable<void> {
    const payload = { newStatus: status };
    console.log(`PUT /api/VendorOrders/orders/${orderId}/status Payload:`, payload);
    
    return this.http.put<void>(`${this.apiUrl}VendorOrders/orders/${orderId}/status`, payload).pipe(
      tap(res => {
        console.log(`PUT /api/VendorOrders/orders/${orderId}/status Response:`, res);
        // Refresh local orders list status
        const lowercaseStatus = status.toLowerCase() as any;
        this.ordersList.update(list =>
          list.map(o => o.id === String(orderId) || o.id === orderId ? { ...o, status: lowercaseStatus } : o)
        );
      })
    );
  }

  /**
   * Fetch activity feed / notifications.
   * Target: GET /api/VendorOrders/reports/activity
   */
  getActivityFeed(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}VendorOrders/reports/activity`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        console.log('Vendor Orders Activity Feed Response:', unwrapped);
        
        let items: any[] = [];
        if (Array.isArray(unwrapped)) {
          items = unwrapped;
        } else if (unwrapped && Array.isArray(unwrapped.items)) {
          items = unwrapped.items;
        }
        
        return items;
      }),
      tap(activities => this.activityFeed.set(activities))
    );
  }

  getCurrentMonthStartDate(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.formatDate(firstDay);
  }

  getCurrentDate(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Fetch revenue analytics.
   * Target: GET /api/VendorOrders/analytics/revenue
   */
  getRevenueAnalytics(): Observable<any[]> {
    const startDate = this.getCurrentMonthStartDate();
    const endDate = this.getCurrentDate();
    return this.http.get<any>(`${this.apiUrl}VendorOrders/analytics/revenue?startDate=${startDate}&endDate=${endDate}`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        console.log('Vendor Revenue Analytics Response:', unwrapped);
        return Array.isArray(unwrapped) ? unwrapped : (unwrapped?.points || unwrapped?.items || unwrapped?.data || []);
      }),
      tap(data => this.revenueAnalytics.set(data))
    );
  }

  /**
   * Fetch orders analytics.
   * Target: GET /api/VendorOrders/analytics/orders
   */
  getOrdersAnalytics(): Observable<any[]> {
    const startDate = this.getCurrentMonthStartDate();
    const endDate = this.getCurrentDate();
    return this.http.get<any>(`${this.apiUrl}VendorOrders/analytics/orders?startDate=${startDate}&endDate=${endDate}`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        console.log('Vendor Orders Analytics Response:', unwrapped);
        return Array.isArray(unwrapped) ? unwrapped : (unwrapped?.points || unwrapped?.items || unwrapped?.data || []);
      }),
      tap(data => this.ordersAnalytics.set(data))
    );
  }

  /**
   * Helper to normalize dynamic order schemas from backend to match frontend models.
   */
  private normalizeVendorOrder(order: any): any {
    if (!order) return order;

    // Construct customer object safely
    const customer = {
      id: order.customer?.id || order.userId || '',
      fullName: order.customer?.fullName || order.customerName || order.user?.fullName || (order.shippingAddress?.firstName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim() : '') || 'Customer',
      email: order.customer?.email || order.user?.email || '',
      phone: order.customer?.phone || order.phoneNumber || order.shippingAddress?.phone || ''
    };

    // Construct items array safely
    let items = order.items;
    if (items && Array.isArray(items)) {
      items = items.map((item: any) => ({
        id: item.id || '',
        productId: item.productId || '',
        productName: item.productName || item.product?.nameEn || item.product?.nameAr || 'Product',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.price || 0),
        lineTotal: Number(item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1)),
        thumbnailUrl: item.thumbnailUrl || item.product?.mainImageUrl || ''
      }));
    } else {
      items = [];
    }

    // Determine status values
    const rawStatus = (order.status || 'pending').toLowerCase();
    
    // Address mapping
    const shippingAddress = order.shippingAddress || {
      addressLine1: order.address || '',
      city: '',
      postalCode: '',
      country: ''
    };

    return {
      id: order.id ? String(order.id) : '',
      orderNumber: order.orderNumber || `ORD-${String(order.id || '').padStart(6, '0')}`,
      vendorId: order.vendorId || '',
      customer,
      items,
      status: rawStatus,
      paymentStatus: (order.paymentStatus || 'pending').toLowerCase(),
      subtotal: Number(order.subtotal || order.totalPrice || 0),
      shippingCost: Number(order.shippingCost || 0),
      taxAmount: Number(order.taxAmount || 0),
      discountAmount: Number(order.discountAmount || 0),
      totalAmount: Number(order.totalAmount || order.totalPrice || 0),
      currency: order.currency || 'EGP',
      shippingAddress,
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || '',
      notes: order.notes || '',
      placedAt: order.placedAt || order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
      statusHistory: order.statusHistory || []
    };
  }
}
