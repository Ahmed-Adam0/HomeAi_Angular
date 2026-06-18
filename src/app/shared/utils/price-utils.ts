import { IProduct } from '../../features/products/interfaces/iproduct';

export const DISCOUNT_PERCENTAGE = 20;

export function calculateOldPrice(currentPrice: number): number {
  if (currentPrice <= 0) return 0;
  return currentPrice / (1 - DISCOUNT_PERCENTAGE / 100);
}

export function calculateDiscountPercentage(product?: IProduct): number {
  return DISCOUNT_PERCENTAGE;
}
