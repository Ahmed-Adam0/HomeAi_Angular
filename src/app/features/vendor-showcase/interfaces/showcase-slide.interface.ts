import { ShowcaseHotspot } from './showcase-hotspot.interface';

export interface ShowcaseSlide {
  id: number;
  title: string;
  titleAr?: string;
  titleEn?: string;
  subtitle: string;
  subtitleAr?: string;
  subtitleEn?: string;
  buttonText: string;
  buttonTextAr?: string;
  buttonTextEn?: string;
  buttonLink: string;
  backgroundImageUrl: string;
  displayOrder: number;
  isActive: boolean;
  workshopId: number | null;
  hotspots: ShowcaseHotspot[];
}
