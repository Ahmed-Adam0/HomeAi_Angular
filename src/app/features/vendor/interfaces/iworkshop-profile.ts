export interface IWorkshopBusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IWorkshopSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedIn?: string;
}

export interface IWorkshopProfile {
  id: string;
  vendorId: string;
  workshopName: string;
  slug: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  categories: string[];
  specialties: string[];
  businessHours: IWorkshopBusinessHours[];
  socialLinks: IWorkshopSocialLinks;
  averageRating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkshopProfileUpdate {
  workshopName: string;
  tagline?: string;
  description: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  categories: string[];
  specialties: string[];
  businessHours: IWorkshopBusinessHours[];
  socialLinks: IWorkshopSocialLinks;
}
