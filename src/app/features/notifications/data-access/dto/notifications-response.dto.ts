import { InternalNotificationDto } from './notification.dto';

export interface PaginatedResponse {
  items: InternalNotificationDto[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
