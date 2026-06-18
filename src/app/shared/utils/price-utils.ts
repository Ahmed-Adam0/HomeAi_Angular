import { IProduct } from '../../features/products/interfaces/iproduct';

export function calculateDiscountPercentage(product?: IProduct): number {
  if (!product) return 0;
  if (product.discountPercentage !== undefined && product.discountPercentage !== null) {
    return product.discountPercentage;
  }
  return 0;
}

export function calculateOldPrice(currentPrice: number, product?: IProduct): number {
  if (currentPrice <= 0) return 0;
  const pct = calculateDiscountPercentage(product);
  if (pct <= 0) return 0;
  return currentPrice / (1 - pct / 100);
}
