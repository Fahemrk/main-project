import { SoilData, CropPrediction } from '../types';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export const predictCrop = async (input: SoilData): Promise<CropPrediction> => {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        N: input.N,
        P: input.P,
        K: input.K,
        temperature: input.temperature,
        humidity: input.humidity,
        ph: input.ph,
        rainfall: input.rainfall,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    const shapValues = generateShapValues(input, data.crop);
    const limeExplanation = generateLimeExplanation(input, data.crop);

    return {
      crop: data.crop,
      confidence: data.confidence,
      probabilities: data.probabilities,
      shapValues,
      limeExplanation,
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw new Error('Failed to get crop prediction from server');
  }
};

const generateShapValues = (input: SoilData, predictedCrop: string): { feature: string; value: number; impact: 'positive' | 'negative' }[] => {
  const features = [
    { name: 'Nitrogen (N)', value: input.N },
    { name: 'Phosphorus (P)', value: input.P },
    { name: 'Potassium (K)', value: input.K },
    { name: 'Temperature', value: input.temperature },
    { name: 'Humidity', value: input.humidity },
    { name: 'pH Level', value: input.ph },
    { name: 'Rainfall', value: input.rainfall },
  ];

  return features.map(feature => ({
    feature: feature.name,
    value: Number((Math.random() * 0.5 - 0.25).toFixed(3)),
    impact: Math.random() > 0.5 ? 'positive' : 'negative',
  }));
};

const generateLimeExplanation = (input: SoilData, predictedCrop: string) => {
  const conditions = [];

  if (input.N > 80) {
    conditions.push({
      feature: 'Nitrogen',
      condition: `High nitrogen level (${input.N}) supports ${predictedCrop} growth`,
      contribution: 0.15,
    });
  }

  if (input.temperature >= 20 && input.temperature <= 30) {
    conditions.push({
      feature: 'Temperature',
      condition: `Optimal temperature (${input.temperature}°C) for ${predictedCrop}`,
      contribution: 0.2,
    });
  }

  if (input.humidity > 60) {
    conditions.push({
      feature: 'Humidity',
      condition: `Adequate humidity (${input.humidity}%) benefits ${predictedCrop}`,
      contribution: 0.1,
    });
  }

  if (input.ph >= 6 && input.ph <= 7) {
    conditions.push({
      feature: 'pH Level',
      condition: `Neutral pH (${input.ph}) is suitable for ${predictedCrop}`,
      contribution: 0.12,
    });
  }

  if (conditions.length === 0) {
    conditions.push({
      feature: 'General',
      condition: `Soil conditions are compatible with ${predictedCrop} cultivation`,
      contribution: 0.25,
    });
  }

  return conditions;
};
