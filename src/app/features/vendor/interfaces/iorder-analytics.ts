export interface IOrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  averageOrderValue: number;
  averageCompletionTimeHours: number;
  completionRate: number;
}
