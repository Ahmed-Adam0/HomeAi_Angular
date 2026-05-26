import { NAV_ROUTES } from './app-routes';
import {
  FooterColumn,
  FooterTagline,
  PaymentBrand,
  SocialLink,
} from '../../shared/interfaces/footer.interfaces';

export const FOOTER_TAGLINE: FooterTagline = {
  line1En: 'Bring Comfort to',
  line1Ar: 'أضف الراحة إلى',
  line2En: 'your Home',
  line2Ar: 'منزلك',
};

export const FOOTER_LINK_COLUMNS: FooterColumn[] = [
  {
    titleEn: 'Account',
    titleAr: 'الحساب',
    links: [
      { labelEn: 'Cart', labelAr: 'عربة التسوق', route: NAV_ROUTES.CART },
      { labelEn: 'My account', labelAr: 'حسابي', route: NAV_ROUTES.PROFILE },
      { labelEn: 'My orders', labelAr: 'طلباتي', route: NAV_ROUTES.ORDERS },
      { labelEn: 'Wishlist', labelAr: 'المفضلة', route: NAV_ROUTES.FAVORITES },
      { labelEn: 'AI Designer', labelAr: 'المصمم الذكي', route: NAV_ROUTES.AI_CHAT },
    ],
  },
  {
    titleEn: 'Information',
    titleAr: 'معلومات',
    links: [
      { labelEn: 'Track Order', labelAr: 'تتبع الطلب', route: NAV_ROUTES.ORDERS, highlight: true },
      { labelEn: 'Returns', labelAr: 'المرتجعات', route: '/contact' },
      { labelEn: 'Shipping Info', labelAr: 'معلومات الشحن', route: '/about' },
      { labelEn: 'Help', labelAr: 'المساعدة', route: '/contact' },
    ],
  },
  {
    titleEn: 'Legal',
    titleAr: 'قانوني',
    links: [
      { labelEn: 'Terms of Use', labelAr: 'شروط الاستخدام', route: '/about' },
      { labelEn: 'Privacy Policy', labelAr: 'سياسة الخصوصية', route: '/about' },
      { labelEn: 'Accessibility', labelAr: 'إمكانية الوصول', route: '/about' },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'facebook',
    iconClass: 'bi-facebook',
    labelEn: 'Facebook',
    labelAr: 'فيسبوك',
    url: 'https://www.facebook.com',
  },
  {
    id: 'instagram',
    iconClass: 'bi-instagram',
    labelEn: 'Instagram',
    labelAr: 'إنستغرام',
    url: 'https://www.instagram.com',
  },
  {
    id: 'x',
    iconClass: 'bi-twitter-x',
    labelEn: 'X',
    labelAr: 'إكس',
    url: 'https://x.com',
  },
  {
    id: 'linkedin',
    iconClass: 'bi-linkedin',
    labelEn: 'LinkedIn',
    labelAr: 'لينكد إن',
    url: 'https://www.linkedin.com',
  },
  {
    id: 'youtube',
    iconClass: 'bi-youtube',
    labelEn: 'YouTube',
    labelAr: 'يوتيوب',
    url: 'https://www.youtube.com',
  },
];

/** Display-only payment marks aligned with checkout providers (Stripe, PayPal, Paymob). */
export const PAYMENT_BRANDS: PaymentBrand[] = [
  { id: 'paypal', label: 'PayPal' },
  { id: 'apple-pay', label: 'Apple Pay' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'discover', label: 'Discover' },
  { id: 'jcb', label: 'JCB' },
  { id: 'google-pay', label: 'Google Pay' },
  { id: 'amex', label: 'American Express' },
];
