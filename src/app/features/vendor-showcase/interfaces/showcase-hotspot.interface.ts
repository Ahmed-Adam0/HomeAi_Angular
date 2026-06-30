import { ShowcaseProduct } from './showcase-product.interface';

export interface ShowcaseHotspot {
  id: number;
  x: number;
  y: number;
  displayOrder: number;
  isActive: boolean;
  product?: ShowcaseProduct;
  productId?: number;
}
