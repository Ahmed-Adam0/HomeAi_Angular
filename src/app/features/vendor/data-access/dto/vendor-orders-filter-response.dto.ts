import { IVendorOrderDashboardDto } from './vendor-order-dashboard.dto';

export interface IVendorOrdersFilterResponseDto {
  data: IVendorOrderDashboardDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
