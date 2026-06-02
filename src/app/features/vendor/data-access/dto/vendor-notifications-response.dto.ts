import { IVendorNotificationDto } from './vendor-notification.dto';

export interface IVendorNotificationsResponseDto {
  items: IVendorNotificationDto[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
