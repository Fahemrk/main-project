import { SoilData, CropPrediction } from '../types';
import { retryAsync, isRetryableError } from '../utils/retry';
import { getCacheKey, getCache, setCache } from '../utils/apiCache';
import { sanitizeJSON, validateSoilData, validateCoordinates } from '../utils/sanitize';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const CACHE_TTL_MS = 3600000;

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('access_token');
};

export const predictCrop = async (input: SoilData): Promise<CropPrediction> => {
  try {
    validateCoordinates(input.latitude!, input.longitude!);
    validateSoilData(input);

    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

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
          latitude: input.latitude,
          longitude: input.longitude,
        };

        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          if (response.status === 403) {
            throw new Error('Access denied. You do not have permission.');
          }
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

        return {
          crop: data.crop,
          confidence: data.confidence || 0,
          probabilities: data.probabilities || [],
          shapValues: data.shapValues ? sanitizeJSON(data.shapValues) : [],
          limeExplanation: data.limeExplanation ? sanitizeJSON(data.limeExplanation) : null,
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


