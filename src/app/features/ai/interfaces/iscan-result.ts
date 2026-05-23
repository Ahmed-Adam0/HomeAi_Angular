export interface IDetectedObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface IScanResult {
  scanId: string;
  roomType: string;
  analyzedImageUrl: string;
  detectedObjects: IDetectedObject[];
  styleAnalysis: string; // e.g., "Scandinavian Mid-Century Modern"
  recommendedProductIds: string[];
}
