import { IVendorNotificationDto } from '../dto/vendor-notification.dto';
import { IVendorNotificationsResponseDto } from '../dto/vendor-notifications-response.dto';
import { IVendorNotificationItem, NotificationIconType } from '../../interfaces';

export interface INotificationsMappedResult {
  items: IVendorNotificationItem[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const ICON_KEYWORDS: Record<string, NotificationIconType> = {
  order: 'order',
  طلب: 'order',
  revenue: 'revenue',
  إيراد: 'revenue',
  ربح: 'revenue',
  review: 'review',
  تقييم: 'review',
  مراجعة: 'review',
  alert: 'alert',
  تنبيه: 'alert',
  important: 'alert',
  مهم: 'alert',
};

function inferIcon(title: string, message: string): NotificationIconType {
  const text = `${title} ${message}`.toLowerCase();

  for (const [keyword, icon] of Object.entries(ICON_KEYWORDS)) {
    if (text.includes(keyword)) {
      return icon;
    }
  }

  return 'system';
}

function parseDate(value: string | undefined | null): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapNotificationItem(dto: IVendorNotificationDto): IVendorNotificationItem {
  return {
    id: dto.id,
    title: dto.title ?? '',
    message: dto.message ?? '',
    isRead: dto.isRead ?? false,
    createdAt: parseDate(dto.createdAt),
    icon: inferIcon(dto.title ?? '', dto.message ?? ''),
  };
}

export function mapNotificationsResponse(
  response: IVendorNotificationsResponseDto
): INotificationsMappedResult {
  return {
    items: (response.items ?? []).map(mapNotificationItem),
    totalCount: response.totalCount ?? 0,
    totalPages: response.totalPages ?? 0,
    pageNumber: response.pageNumber ?? 1,
    pageSize: response.pageSize ?? 10,
    hasPreviousPage: response.hasPreviousPage ?? false,
    hasNextPage: response.hasNextPage ?? false,
  };
}
