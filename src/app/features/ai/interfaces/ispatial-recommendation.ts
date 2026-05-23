export interface ISpatialRecommendation {
  productId: string;
  productName: string;
  coordinates: {
    x: number; // 3D local offset x
    y: number; // 3D local offset y
    z: number; // 3D local offset z
  };
  rotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  scale: number;
  reasonForRecommendation: string;
}
