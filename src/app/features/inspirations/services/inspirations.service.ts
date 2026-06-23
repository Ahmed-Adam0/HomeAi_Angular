import { Injectable, signal } from '@angular/core';
import { InspirationItem } from '../interfaces/inspiration.interface';

@Injectable({
  providedIn: 'root'
})
export class InspirationsService {
  private readonly inspirationsList = signal<InspirationItem[]>([
    {
      id: '1',
      titleEn: 'Luxury Nordic Living Room',
      titleAr: 'غرفة معيشة نورديك فاخرة',
      descriptionEn: 'Transforming a plain room into a warm Nordic minimalist sanctuary with a curved boucle sofa and warm travertine accents.',
      descriptionAr: 'تحويل غرفة عادية إلى ملاذ دافئ وبسيط على الطراز الاسكندنافي مع أريكة بوكليه منحنية وتفاصيل من الترافرتين الدافئ.',
      roomType: 'living',
      beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
      date: '2026-06-15',
      authorEn: 'Elena Rostova',
      authorAr: 'إيلينا روستوفا',
      likes: 124,
      itemsCount: 5
    },
    {
      id: '2',
      titleEn: 'Earthy Alabaster Bedroom',
      titleAr: 'غرفة نوم ألاباستر دافئة',
      descriptionEn: 'Upgrading a cluttered bedroom into a luxury retreat with linen wall panelling and brass lighting.',
      descriptionAr: 'ترقية غرفة نوم فوضوية إلى ملاذ فاخر مع ألواح حائط من الكتان وإضاءة نحاسية أنيقة.',
      roomType: 'bedroom',
      beforeImage: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop',
      date: '2026-06-10',
      authorEn: 'Marcus Aurel',
      authorAr: 'ماركوس أوريل',
      likes: 98,
      itemsCount: 4
    },
    {
      id: '3',
      titleEn: 'Modern Marble Kitchen',
      titleAr: 'مطبخ رخامي عصري',
      descriptionEn: 'Renovating a classic kitchen using luxury walnut cabinetry and Italian Calacatta marble surfaces.',
      descriptionAr: 'تجديد مطبخ كلاسيكي باستخدام خزائن فاخرة من خشب الجوز وأسطح رخام كالاكاتا الإيطالي.',
      roomType: 'kitchen',
      beforeImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?q=80&w=800&auto=format&fit=crop',
      date: '2026-06-08',
      authorEn: 'Sarah Jenkins',
      authorAr: 'سارة جينكينز',
      likes: 156,
      itemsCount: 7
    },
    {
      id: '4',
      titleEn: 'Contemporary Glass Dining',
      titleAr: 'غرفة طعام زجاجية معاصرة',
      descriptionEn: 'Creating an elegant dining area featuring premium leather chairs and sculptural glass pendant lights.',
      descriptionAr: 'إنشاء منطقة طعام أنيقة تتميز بكراسي جلدية فاخرة ومصابيح زجاجية متدلية منحوتة بشكل فني.',
      roomType: 'dining',
      beforeImage: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?q=80&w=800&auto=format&fit=crop',
      date: '2026-06-05',
      authorEn: 'Amir Fahmy',
      authorAr: 'أمير فهمي',
      likes: 87,
      itemsCount: 3
    },
    {
      id: '5',
      titleEn: 'Minimalist Oak Home Office',
      titleAr: 'مكتب منزلي مبسط من خشب البلوط',
      descriptionEn: 'Designing a high-productivity home office with warm oak desks and ergonomic designer chairs.',
      descriptionAr: 'تصميم مكتب منزلي عالي الإنتاجية مع مكاتب من خشب البلوط الدافئ وكراسي مريحة من مصممين عالميين.',
      roomType: 'office',
      beforeImage: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
      date: '2026-06-01',
      authorEn: 'Kenji Sato',
      authorAr: 'كينجي ساتو',
      likes: 112,
      itemsCount: 4
    },
    {
      id: '6',
      titleEn: 'Luxury Poolside Deck Patio',
      titleAr: 'فناء خارجي فاخر بجانب المسبح',
      descriptionEn: 'Transforming an empty patio into a luxury outdoor lounge with weather-resistant solid teak furniture.',
      descriptionAr: 'تحويل فناء خارجي فارغ إلى صالة خارجية فاخرة مع أثاث من خشب التيك الصلب المقاوم للعوامل الجوية.',
      roomType: 'outdoor',
      beforeImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',
      date: '2026-05-28',
      authorEn: 'Isabella Martinez',
      authorAr: 'إيزابيلا مارتينيز',
      likes: 143,
      itemsCount: 6
    },
    {
      id: '7',
      titleEn: 'Japandi Living Lounge',
      titleAr: 'صالة معيشة جاباندي هادئة',
      descriptionEn: 'Merging Japanese minimalism with Scandinavian warmth using light oak furniture and low-profile seating.',
      descriptionAr: 'دمج البساطة اليابانية مع الدفء الاسكندنافي باستخدام أثاث من خشب البلوط الفاتح ومقاعد منخفضة.',
      roomType: 'living',
      beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
      date: '2026-05-20',
      authorEn: 'Yuki Tanaka',
      authorAr: 'يوكي تاناكا',
      likes: 215,
      itemsCount: 5
    }
  ]);

  getInspirations(): InspirationItem[] {
    return this.inspirationsList();
  }
}
