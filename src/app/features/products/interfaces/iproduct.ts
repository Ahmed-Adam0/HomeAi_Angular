export interface IDimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'inch' | 'mm';
}

export interface IProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  primaryImage: string;
  rating: number;
  reviewsCount: number;
  dimensions: IDimensions;
  weight: number; // in kg
  weightUnit: string;
  materials: string[];
  colors: string[];
  brand: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  model3dUrl?: string; // URL to the .gltf or .usdz 3D file for AR feature
  assemblyRequired: boolean;
  assemblyInstructionUrl?: string;
  createdAt: string;
  tags: string[];
}
