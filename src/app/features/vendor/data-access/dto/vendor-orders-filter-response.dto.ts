import { IOrder } from '../../../orders/interfaces/iorder';


export interface IVendorOrdersFilterResponseDto {
  data: IOrder[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

