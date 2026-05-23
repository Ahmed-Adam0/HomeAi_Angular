export interface IPromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl: string; // internal route or external link
  buttonText?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}
