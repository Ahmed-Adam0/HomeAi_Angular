import { InternalNotificationDto } from '../dto/notification.dto';
import { PaginatedResponse } from '../dto/notifications-response.dto';
import { INotificationItem } from '../../interfaces/inotification';

export interface NotificationsMappedResult {
  items: INotificationItem[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

function parseDate(value: string | undefined | null): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapNotificationItem(dto: InternalNotificationDto): INotificationItem {
  return {
    id: dto.id,
    title: dto.title ?? '',
    message: dto.message ?? '',
    isRead: dto.isRead ?? false,
    createdAt: parseDate(dto.createdAt),
  };
}

export function mapNotificationsResponse(
  response: PaginatedResponse,
): NotificationsMappedResult {
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
