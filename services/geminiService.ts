import { GoogleGenAI } from "@google/genai";
import { SoilData } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert agricultural consultant for the "Smart Crop Guidance System". 
Your goal is to provide detailed, actionable cultivation advice to farmers based on their specific soil and weather conditions and the machine learning model's predicted crop.
Keep the tone professional, encouraging, and easy to understand for a farmer.
Structure your response in clear sections using Markdown.
`;

export const getCultivationGuide = async (crop: string, inputData: SoilData): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;


  if (!apiKey) {
    return `
### API Key Missing
Unable to generate real-time AI guidance. Please ensure the API Key is configured in the environment.

**Fallback General Guide for ${crop}:**
*   **Soil:** Ensure good drainage.
*   **Watering:** Regular watering required.
*   **Fertilizer:** Apply NPK balanced fertilizer.
    `;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct location string from Lat/Long if available, otherwise fallback to name if it exists (though UI uses Lat/Long now)
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
        temperature: 0.4, // Low temperature for factual advice
      }
    });

    return response.text || "Failed to generate guide.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return `
### Error Generating Guide
We encountered an issue connecting to the AI consultant.

**Standard Guide for ${crop}:**
Please consult your local agricultural extension officer for specific advice regarding ${crop} in your region.
    `;
  }
};