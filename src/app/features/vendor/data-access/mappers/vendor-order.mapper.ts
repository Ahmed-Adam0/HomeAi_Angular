import { IVendorOrderDashboardDto } from '../dto/vendor-order-dashboard.dto';
import { IVendorOrdersFilterResponseDto } from '../dto/vendor-orders-filter-response.dto';
import { IVendorOrderDetailsDto } from '../dto/vendor-order-details.dto';
import { IVendorDashboardMetricsDto } from '../dto/vendor-dashboard-metrics.dto';
import { IVendorOrderAnalyticsDto } from '../dto/vendor-order-analytics.dto';
import { IVendorOrder, IVendorOrderSummary } from '../../interfaces/ivendor-order';
import { IVendorAnalytics } from '../../interfaces/ivendor-analytics';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';
import { VendorMetricType } from '../../models/vendor-metric-type.enum';

/**
 * Maps a VendorOrderDashboardDto from the API to the frontend IVendorOrderSummary model.
 */
export function mapVendorOrderDashboard(
  dto: IVendorOrderDashboardDto
): IVendorOrderSummary {
  let mappedStatus: VendorOrderStatus;

  switch (dto.status) {
    case 'Pending':
      mappedStatus = VendorOrderStatus.Pending;
      break;
    case 'Confirmed':
      mappedStatus = VendorOrderStatus.Confirmed;
      break;
    case 'In Progress':
      mappedStatus = VendorOrderStatus.Processing;
      break;
    case 'Ready for Pickup':
      mappedStatus = VendorOrderStatus.Shipped;
      break;
    case 'Delivered':
      mappedStatus = VendorOrderStatus.Delivered;
      break;
    case 'Cancelled':
      mappedStatus = VendorOrderStatus.Cancelled;
      break;
    default:
      mappedStatus = VendorOrderStatus.Pending;
      break;
  }

  return {
    id: dto.id.toString(),
    orderNumber: `ORD-${dto.id}`,
    customerName: dto.customerName,
    status: mappedStatus,
    totalAmount: dto.totalPrice,
    currency: 'EGP',
    itemCount: dto.itemCount,
    placedAt: dto.createdAt,
  };
}

/**
 * Maps a paginated VendorOrdersFilterResponseDto to an array of IVendorOrderSummary.
 */
export function mapVendorOrdersFilterResponse(
  response: IVendorOrdersFilterResponseDto
): IVendorOrderSummary[] {
  return response.data.map(mapVendorOrderDashboard);
}

/**
 * Maps a string status to VendorOrderStatus enum.
 */
function mapStringToStatus(status: string): VendorOrderStatus {
  switch (status) {
    case 'Pending':
      return VendorOrderStatus.Pending;
    case 'Confirmed':
      return VendorOrderStatus.Confirmed;
    case 'In Progress':
      return VendorOrderStatus.Processing;
    case 'Ready for Pickup':
      return VendorOrderStatus.Shipped;
    case 'Delivered':
      return VendorOrderStatus.Delivered;
    case 'Cancelled':
      return VendorOrderStatus.Cancelled;
    default:
      return VendorOrderStatus.Pending;
  }
}

/**
 * Maps a VendorOrderDetailsDto to the frontend IVendorOrder model.
 */
export function mapVendorOrderDetails(
  dto: IVendorOrderDetailsDto
): IVendorOrder {
  return {
    id: dto.id.toString(),
    orderNumber: `ORD-${dto.id}`,
    vendorId: '',
    customer: {
      id: dto.userId,
      fullName: dto.customerName,
      email: '',
      phone: dto.customerPhone,
    },
    items: dto.items.map((item) => ({
      id: item.productId.toString(),
      productId: item.productId.toString(),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.total,
    })),
    status: mapStringToStatus(dto.status),
    paymentStatus: 'pending',
    subtotal: dto.totalPrice,
    shippingCost: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: dto.totalPrice,
    currency: 'EGP',
    shippingAddress: {
      addressLine1: dto.address,
      city: '',
      postalCode: '',
      country: '',
    },
    notes: dto.notes ?? undefined,
    statusHistory: dto.statusHistory.map((history) => ({
      id: history.id.toString(),
      previousStatus: mapStringToStatus(history.oldStatus),
      newStatus: mapStringToStatus(history.newStatus),
      changedAt: history.createdAt,
    })),
    placedAt: dto.createdAt,
    updatedAt: dto.updatedAt || dto.createdAt,
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
