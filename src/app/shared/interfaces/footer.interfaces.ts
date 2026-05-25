export interface FooterLink {
  labelEn: string;
  labelAr: string;
  route: string;
  highlight?: boolean;
}

export interface FooterColumn {
  titleEn: string;
  titleAr: string;
  links: FooterLink[];
}

export interface SocialLink {
  id: string;
  iconClass: string;
  labelEn: string;
  labelAr: string;
  url: string;
}

export interface PaymentBrand {
  id: string;
  label: string;
}

export interface FooterTagline {
  line1En: string;
  line1Ar: string;
  line2En: string;
  line2Ar: string;
}
