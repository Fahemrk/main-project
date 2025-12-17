import { GoogleGenAI } from "@google/genai";
import { SoilData } from "../types";
import { retryAsync } from "../utils/retry";
import { getCacheKey, getCache, setCache } from "../utils/apiCache";
import { sanitizeString } from "../utils/sanitize";

const CACHE_TTL_MS = 3600000;

const SYSTEM_INSTRUCTION = `
You are an expert agricultural consultant for the "Smart Crop Guidance System". 
Your goal is to provide detailed, actionable cultivation advice to farmers based on their specific soil and weather conditions and the machine learning model's predicted crop.
Keep the tone professional, encouraging, and easy to understand for a farmer.
Structure your response in clear sections using Markdown.
`;

export const getCultivationGuide = async (crop: string, inputData: SoilData): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please set it in your .env.local file.');
  }

  try {
    const cacheKey = getCacheKey('/cultivation-guide', { crop, ...inputData });
    const cached = getCache<string>(cacheKey);
    if (cached) {
      console.log('Returning cached cultivation guide');
      return cached;
    }

    const guide = await retryAsync(
      async () => {
        const ai = new GoogleGenAI({ apiKey });
        
        const locationInfo = inputData.latitude && inputData.longitude 
          ? `\n- Coordinates: ${inputData.latitude}, ${inputData.longitude}` 
          : (inputData.location ? `\n- Location: ${inputData.location}` : '');

        const prompt = `
          The Machine Learning model has predicted **${crop}** as the best crop for the following conditions:
          ${locationInfo}
          - Nitrogen: ${inputData.N}
          - Phosphorus: ${inputData.P}
          - Potassium: ${inputData.K}
          - pH: ${inputData.ph}
          - Temperature: ${inputData.temperature}°C
          - Humidity: ${inputData.humidity}%
          - Rainfall: ${inputData.rainfall}mm

          Please provide a comprehensive step-by-step cultivation guide. Include the following sections:
          1. **Soil Preparation**: How to adjust the current soil nutrients (N, P, K, pH) for optimal growth.
          2. **Climate Suitability**: Comment on how the current weather and provided location coordinates match the crop's needs. If coordinates are provided, mention specific seasonal advice for that region.
          3. **Sowing & Land Prep**: Steps for planting.
          4. **Fertilizer Schedule**: Specific recommendations based on the input NPK levels.
          5. **Irrigation**: Water management.
          6. **Disease Management**: Common pests for ${crop} and organic precautions.
          7. **Harvesting**: Signs of maturity and expected yield.
          
          Keep it concise but detailed.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.4,
          }
        });

        if (!response.text) {
          throw new Error('Gemini API returned empty response');
        }

        return sanitizeString(response.text, 10000);
      },
      { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 5000 }
    );

    setCache(cacheKey, guide, CACHE_TTL_MS);
    return guide;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Gemini API Error:", errorMessage);
    
    if (errorMessage.includes('API key')) {
      throw new Error('Invalid or missing Gemini API key');
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      throw new Error('Gemini API request timed out. Please try again.');
    }
    
    throw new Error(`Failed to generate cultivation guide: ${errorMessage}`);
  }
};