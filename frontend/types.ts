
export interface SoilData {
  location?: string;
  latitude?: number;
  longitude?: number;
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropPrediction {
  crop: string;
  confidence: number;
  probabilities: { name: string; value: number }[];
  shapValues: { feature: string; value: number; impact: 'positive' | 'negative' }[];
  limeExplanation: { feature: string; condition: string; contribution: number }[];
}

export enum AppState {
  LANDING,
  LOGIN,
  REGISTER,
  INPUT,
  PROCESSING,
  RESULT,
  YIELD_PREDICTION,
  CROP_LOOKUP,
  PRICE_PREDICTION,
  ABOUT_US
}

export interface CultivationGuide {
  soilPrep: string;
  climate: string;
  fertilizers: string;
  irrigation: string;
  pestControl: string;
  harvest: string;
}
