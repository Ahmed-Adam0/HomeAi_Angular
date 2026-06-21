import { IVendorOrderDashboardDto } from '../dto/vendor-order-dashboard.dto';
import { IOrder } from '../../../orders/interfaces/iorder';


import { IVendorOrdersFilterResponseDto } from '../dto/vendor-orders-filter-response.dto';
import { IVendorOrderDetailsDto } from '../dto/vendor-order-details.dto';
import { IVendorDashboardMetricsDto } from '../dto/vendor-dashboard-metrics.dto';
import { IVendorOrderAnalyticsDto } from '../dto/vendor-order-analytics.dto';
import { IVendorOrder, IVendorOrderSummary } from '../../interfaces/ivendor-order';
import { IVendorAnalytics } from '../../interfaces/ivendor-analytics';
import { IVendorDashboardMetrics } from '../../interfaces/ivendor-dashboard-metrics';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';
import { VendorMetricType } from '../../models/vendor-metric-type.enum';
import { STATUS_FRONTEND_MAP } from './vendor-order-status.mapper';

/**
 * Maps a VendorOrderDashboardDto from the API to the frontend IVendorOrderSummary model.
 */
export function mapVendorOrderDashboard(
  dto: IVendorOrderDashboardDto
): IVendorOrderSummary {
  return {
    id: dto.id?.toString() ?? '',
    orderNumber: `ORD-${dto.id}`,
    customerName: dto.customerName ?? '',
    status: dto.status ? mapStringToStatus(dto.status) : VendorOrderStatus.Pending,
    totalAmount: dto.totalPrice ?? 0,
    currency: 'EGP',
    itemCount: dto.itemCount ?? 0,
    placedAt: dto.createdAt ?? '',
  };
}

/**
 * Maps a paginated VendorOrdersFilterResponseDto to an array of IOrder.
 */
export function mapVendorOrdersFilterResponse(
  response: IVendorOrdersFilterResponseDto
): IOrder[] {
  return response.data ?? [];
}


/**
 * Maps a string status to VendorOrderStatus enum.
 */
function mapStringToStatus(status: string): VendorOrderStatus {
  const mapped = STATUS_FRONTEND_MAP[status];
  if (mapped) {
    return mapped;
  }
  console.warn(`[VendorOrderMapper] Unknown status received from API: "${status}". Falling back to "Pending".`);
  return VendorOrderStatus.Pending;
}

/**
 * Maps a VendorOrderDetailsDto to the frontend IVendorOrder model.
 */
export function mapVendorOrderDetails(
  dto: IVendorOrderDetailsDto
): IVendorOrder {
  return {
    id: dto.id?.toString() ?? '',
    orderNumber: `ORD-${dto.id}`,
    vendorId: '',
    customer: {
      id: dto.userId ?? '',
      fullName: dto.customerName ?? '',
      email: '',
      phone: dto.customerPhone ?? '',
    },
    items: (dto.items ?? []).map((item) => ({
      id: item.productId?.toString() ?? '',
      productId: item.productId?.toString() ?? '',
      productName: item.productName ?? '',
      quantity: item.quantity ?? 0,
      unitPrice: item.unitPrice ?? 0,
      lineTotal: item.total ?? 0,
    })),
    status: dto.status ? mapStringToStatus(dto.status) : VendorOrderStatus.Pending,
    paymentStatus: 'pending',
    subtotal: dto.totalPrice ?? 0,
    shippingCost: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: dto.totalPrice ?? 0,
    currency: 'EGP',
    shippingAddress: {
      addressLine1: dto.address ?? '',
      city: '',
      postalCode: '',
      country: '',
    },
    notes: dto.notes ?? undefined,
    statusHistory: dto.statusHistory ? {
      id: dto.statusHistory.id,
      oldStatus: dto.statusHistory.oldStatus,
      newStatus: dto.statusHistory.newStatus,
      createdAt: dto.statusHistory.createdAt,
    } : null,
    placedAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt || dto.createdAt || '',
    estimatedDeliveryDate: dto.estimatedDeliveryDate ?? undefined,
  };
}


/**
 * Maps VendorDashboardMetricsDto to IVendorAnalytics model.
 */
export function mapVendorDashboardMetrics(
  dto: IVendorDashboardMetricsDto
): IVendorAnalytics {
  return {
    periodStart: '',
    periodEnd: '',
    metrics: [
      {
        type: VendorMetricType.Orders,
        label: 'Total Orders',
        value: dto.totalOrders,
        changePercent: dto.orderGrowthPercentage,
      },
      {
        type: VendorMetricType.Orders,
        label: 'Active Orders',
        value: dto.activeOrders,
      },
      {
        type: VendorMetricType.Orders,
        label: 'Completed Orders',
        value: dto.completedOrders,
      },
      {
        type: VendorMetricType.Sales,
        label: 'Total Sales',
        value: dto.totalRevenue,
        currency: 'EGP',
        changePercent: dto.orderGrowthPercentage,
      },
      {
        type: VendorMetricType.Revenue,
        label: 'Total Revenue',
        value: dto.totalRevenue,
        currency: 'EGP',
        changePercent: dto.orderGrowthPercentage,
      },
      {
        type: VendorMetricType.Revenue,
        label: 'Average Order Value',
        value: dto.averageOrderValue,
        currency: 'EGP',
      },
    ],
    trends: [],
    topProducts: [],
  };
}

/**
 * Maps VendorDashboardMetricsDto directly to IVendorDashboardMetrics model.
 * Used by the dashboard component for dedicated dashboard metrics display.
 */
export function mapVendorDashboardMetricsDtoToViewModel(
  dto: IVendorDashboardMetricsDto
): IVendorDashboardMetrics {
  return {
    totalOrders: dto.totalOrders,
    activeOrders: dto.activeOrders,
    completedOrders: dto.completedOrders,
    totalRevenue: dto.totalRevenue,
    newCustomersCount: dto.newCustomersCount,
    orderGrowthPercentage: dto.orderGrowthPercentage,
    averageOrderValue: dto.averageOrderValue,
  };
}

/**
 * Maps IVendorOrderAnalyticsDto to IVendorAnalytics model.
 */
export function mapVendorOrderAnalytics(
  dto: IVendorOrderAnalyticsDto
): IVendorAnalytics {
  return {
    periodStart: '',
    periodEnd: '',
    metrics: [
      {
        type: VendorMetricType.Sales,
        label: 'Total Sales',
        value: dto.totalOrders * dto.averageOrderValue,
        currency: 'EGP',
      },
      {
        type: VendorMetricType.Orders,
        label: 'Completed Orders',
        value: dto.completedOrders,
      },
      {
        type: VendorMetricType.Orders,
        label: 'Active Orders',
        value: dto.pendingOrders + dto.inProgressOrders,
      },
    ],
    trends: [],
    topProducts: [],
  };
}
