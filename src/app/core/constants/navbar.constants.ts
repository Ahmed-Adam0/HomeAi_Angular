import { LanguageOption, CurrencyOption, Category, MegaMenuColumn, PromoBanner, NavLink } from '../../shared/interfaces/navbar.interfaces';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' }
];

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'EGP', symbol: 'EGP', label: 'EGP' }
];

export const MAIN_NAV_LINKS: NavLink[] = [
  { labelEn: 'Home', labelAr: 'الرئيسية', route: '/' },
  { labelEn: 'Products', labelAr: 'المنتجات', route: '/products' },
  { labelEn: 'AI Accent', labelAr: 'لمسة الذكاء', route: '/room-upload' },
  { labelEn: 'Inspirations', labelAr: 'الأفكار الملهمة', route: '/inspirations' },
];

export const CATEGORIES: Category[] = [
  {
    id: 'sofas',
    nameEn: 'Sofas',
    nameAr: 'كنب',
    icon: 'bi bi-couch',
    svgPath: 'M2 10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4zm2-1a1 1 0 0 0-1 1v4h18v-4a1 1 0 0 0-1-1H4zm0 6v2h1v-2H4zm11 0v2h1v-2h-1zm-6-8V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h-4z'
  },
  {
    id: 'wardrobes',
    nameEn: 'Wardrobes',
    nameAr: 'خزائن ملابس',
    icon: 'bi bi-door-closed',
    svgPath: 'M4 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm1 2h4.5v16H5V4zm10 16h-4.5V4H15v16zm-5-9H9v2h1v-2zm2 0h1v2h-1v-2z'
  },
  {
    id: 'chairs',
    nameEn: 'Chairs',
    nameAr: 'كراسي',
    icon: 'bi bi-chair',
    svgPath: 'M6 2v8h8V2H6zm0 9v8h2v-8H6zm6 0v8h2v-8h-2z'
  },
  {
    id: 'desks',
    nameEn: 'Desks',
    nameAr: 'مكاتب',
    icon: 'bi bi-laptop',
    svgPath: 'M2 4h20v2H2V4zm2 4h16v10H4V8zm1 1v8h14V9H5z'
  },
  {
    id: 'tables',
    nameEn: 'Tables',
    nameAr: 'طاولات',
    icon: 'bi bi-border-top',
    svgPath: 'M2 6h20v4H2V6zm2 4h2v8H4v-8zm12 0h2v8h-2v-8z'
  },
  {
    id: 'cabinets',
    nameEn: 'Cabinets',
    nameAr: 'خزائن',
    icon: 'bi bi-archive',
    svgPath: 'M3 3h18v4H3V3zm1 14h16v4H4v-4zm0-7h16v4H4v-4zm4-5v2h8V5H8zm-2 7v2h12v-2H6zm0 7v2h12v-2H6z'
  },
  {
    id: 'office',
    nameEn: 'Office',
    nameAr: 'مكاتب عمل',
    icon: 'bi bi-briefcase',
    svgPath: 'M4 4h16v12H4V4zm2 2v8h12V6H6z'
  }
];

export const MEGA_MENU_COLUMNS: MegaMenuColumn[] = [
  {
    titleEn: 'Products',
    titleAr: 'المنتجات',
    items: [
      { nameEn: 'Desks', nameAr: 'مكاتب' },
      { nameEn: 'Chairs', nameAr: 'كراسي' },
      { nameEn: 'Sofas and Couches', nameAr: 'كنب وأرائك' },
      { nameEn: 'Storage', nameAr: 'وحدات تخزين' },
      { nameEn: 'Tables', nameAr: 'طاولات' },
      { nameEn: 'Credenzas', nameAr: 'خزائن جانبية' },
      { nameEn: 'Lighting', nameAr: 'إضاءة' }
    ]
  },
  {
    titleEn: 'Rooms',
    titleAr: 'الغرف',
    items: [
      { nameEn: 'Living room', nameAr: 'غرفة المعيشة' },
      { nameEn: 'Bedroom', nameAr: 'غرفة النوم' },
      { nameEn: 'Kitchen', nameAr: 'المطبخ' },
      { nameEn: 'Dining room', nameAr: 'غرفة الطعام' },
      { nameEn: 'Children\'s room', nameAr: 'غرفة الأطفال' },
      { nameEn: 'Home Office', nameAr: 'المكتب المنزلي' },
      { nameEn: 'Hallway', nameAr: 'الممر / المدخل' }
    ]
  },
  {
    titleEn: 'Brands',
    titleAr: 'العلامات التجارية',
    items: [
      { nameEn: 'Roche Bobois', nameAr: 'روش بوبوا' },
      { nameEn: 'Herman Miller', nameAr: 'هيرمان ميلر' },
      { nameEn: 'Kartell', nameAr: 'كارتيل' },
      { nameEn: 'Ligne Roset', nameAr: 'ليني روزيه' },
      { nameEn: 'Poltrona Frau', nameAr: 'بولترونا فراو' },
      { nameEn: 'Minotti', nameAr: 'مينوتي' },
      { nameEn: 'B&B Italia', nameAr: 'بي أند بي إيطاليا' }
    ]
  },
  {
    titleEn: 'Style',
    titleAr: 'الأشكال والتصاميم',
    items: [
      { nameEn: 'Mid-Century Modern', nameAr: 'العصر الحديث' },
      { nameEn: 'Scandinavian', nameAr: 'الاسكندنافي' },
      { nameEn: 'Industrial', nameAr: 'الصناعي' },
      { nameEn: 'Traditional', nameAr: 'التقليدي' },
      { nameEn: 'Contemporary', nameAr: 'المعاصر' },
      { nameEn: 'Minimalist', nameAr: 'المبسط' },
      { nameEn: 'Japandi', nameAr: 'الياباني الاسكندنافي' }
    ]
  }
];

export const PROMO_BANNER: PromoBanner = {
  imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=600&auto=format&fit=crop',
  titleEn: 'Darker, mysterious',
  titleAr: 'أكثر قتامة وغموضاً',
  subtitleEn: 'Elevate your space with our curated noir and velvet furniture ensembles.',
  subtitleAr: 'ارتقِ بمساحتك مع مجموعتنا المختارة من الأثاث المخملي والداكن الأنيق.',
  ctaTextEn: 'Shop now',
  ctaTextAr: 'تسوق الآن',
  link: '/offers/noir-collection'
};
