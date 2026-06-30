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
      { labelEn: 'AI Designer', labelAr: 'المصمم الذكي', route: NAV_ROUTES.ROOM_UPLOAD },
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
    url: 'https://www.facebook.com/share/1NUpe2SWCn/',
  },
];

/** Display-only payment marks. Only Paymob is supported. */
export const PAYMENT_BRANDS: PaymentBrand[] = [
  { id: 'paymob', label: 'Paymob' },
];
