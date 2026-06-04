import { INotificationDto } from './notification.dto';

export interface INotificationsResponseDto {
  items: INotificationDto[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
