export interface IVendorOrdersFilterRequestDto {
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  customerName?: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy?: string | null;
  sortDescending: boolean;
}
