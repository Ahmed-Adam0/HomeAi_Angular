export interface CreateShowcaseRequest {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  buttonTextAr: string;
  buttonTextEn: string;
  buttonLink: string;
  displayOrder: number;
  isActive: boolean;
  backgroundImage?: File;
  hotspotsJson: string;
}
