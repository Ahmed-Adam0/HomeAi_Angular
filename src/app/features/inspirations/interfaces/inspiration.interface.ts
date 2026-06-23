export interface InspirationItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  roomType: 'living' | 'bedroom' | 'kitchen' | 'dining' | 'office' | 'outdoor';
  beforeImage: string;
  afterImage: string;
  date: string; // ISO string format or YYYY-MM-DD
  authorEn: string;
  authorAr: string;
  likes: number;
  itemsCount: number;
}
