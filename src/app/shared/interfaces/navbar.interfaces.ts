export interface LanguageOption {
  code: 'en' | 'ar';
  label: string;
  flag: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  icon?: string;
  imageUrl?: string;
  svgPath?: string;
}

export interface MegaMenuItem {
  nameEn: string;
  nameAr: string;
  link?: string;
}

export interface MegaMenuColumn {
  titleEn: string;
  titleAr: string;
  items: MegaMenuItem[];
}

export interface PromoBanner {
  imageUrl: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaTextEn: string;
  ctaTextAr: string;
  link: string;
}

export interface NavLink {
  labelEn: string;
  labelAr: string;
  route: string;
  hasDropdown?: boolean;
}
