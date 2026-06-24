export interface IInspiration {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
}

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export interface IInspirationsResponse {
  data: IInspiration[];
  pagination: IPagination;
}
