import { SoilData, CropPrediction } from '../types';
import { retryAsync, isRetryableError } from '../utils/retry';
import { getCacheKey, getCache, setCache } from '../utils/apiCache';
import { sanitizeJSON, validateSoilData, validateCoordinates } from '../utils/sanitize';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const CACHE_TTL_MS = 3600000;

export const predictCrop = async (input: SoilData): Promise<CropPrediction> => {
  try {
    validateCoordinates(input.latitude!, input.longitude!);
    validateSoilData(input);

    const cacheKey = getCacheKey('/predict', input);
    const cached = getCache<CropPrediction>(cacheKey);
    if (cached) {
      console.log('Returning cached prediction');
      return cached;
    }

    const prediction = await retryAsync(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const requestBody = {
          N: input.N,
          P: input.P,
          K: input.K,
          temperature: input.temperature,
          humidity: input.humidity,
          ph: input.ph,
          rainfall: input.rainfall,
        };

        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 500) {
            throw new Error('Backend server error. Model may not be loaded.');
          }
          if (response.status === 404) {
            throw new Error('Backend API not found. Is the server running?');
          }
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.crop) {
          throw new Error('Invalid response from server - missing crop prediction');
        }

        if (!data.shapValues || !data.limeExplanation) {
          throw new Error('Backend response incomplete - missing SHAP/LIME values');
        }

        return {
          crop: data.crop,
          confidence: data.confidence || 0,
          probabilities: data.probabilities || [],
          shapValues: sanitizeJSON(data.shapValues),
          limeExplanation: sanitizeJSON(data.limeExplanation),
        };
      },
      { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 5000 }
    );

    setCache(cacheKey, prediction, CACHE_TTL_MS);
    return prediction;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Prediction error:', error);

    if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
      throw new Error('Prediction request timed out. Backend server may be slow or offline.');
    }
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_URL}. Is the server running?`);
    }

    throw new Error(errorMessage || 'Failed to get crop prediction from server');
  }
};


