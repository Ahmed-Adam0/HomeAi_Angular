export interface IReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  title?: string;
  verifiedPurchase: boolean;
  createdAt: string;
}
