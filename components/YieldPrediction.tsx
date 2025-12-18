import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { TrendingUp, AlertCircle, CheckCircle, Loader2, BarChart3 } from 'lucide-react';

interface YieldData {
  crop: string;
  season: string;
  state: string;
  rainfall: number;
  fertilizer: number;
  pesticide: number;
  area: number;
  year: number;
}

interface YieldPredictionResult {
  predicted_yield: number;
  confidence: number;
  crop: string;
  season: string;
  state: string;
  area: number;
  rainfall: number;
  fertilizer: number;
  pesticide: number;
  year: number;
  feature_importance: Array<{
    feature: string;
    importance: number;
    percentage: number;
  }>;
  top_features: Array<{
    feature: string;
    importance: number;
    percentage: number;
  }>;
}

const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Winter', 'Autumn', 'Whole Year'];
const STATES = [
  'Assam', 'Karnataka', 'Kerala', 'Meghalaya', 'West Bengal', 
  'Goa', 'Puducherry'
];
const CROPS = [
  'Arecanut', 'Arhar/Tur', 'Banana', 'Castor seed', 'Coconut', 
  'Cotton(lint)', 'Dry chillies', 'Garlic', 'Ginger', 'Gram',
  'Groundnut', 'Jowar', 'Jute', 'Maize', 'Onion', 'Potato',
  'Rapeseed &Mustard', 'Rice', 'Sugarcane', 'Turmeric', 'Wheat'
];

const YieldPrediction: React.FC = () => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<YieldData>({
    crop: 'Rice',
    season: 'Kharif',
    state: 'Assam',
    rainfall: 200,
    fertilizer: 50000,
    pesticide: 500,
    area: 1000,
    year: 2024
  });

  const [result, setResult] = useState<YieldPredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(Number(value)) ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setHasSubmitted(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/predict-yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to predict yield');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error: ${errorMsg}. Make sure backend server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-emerald-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
              <TrendingUp className="text-white" size={28} />
            </div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Crop Yield Prediction
            </h1>
          </div>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Predict your crop yield using machine learning trained with Random Forest and Genetic Algorithm optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className={`rounded-xl shadow-lg border-2 p-6 ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-blue-200'
            }`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                Input Parameters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Crop Name
                  </label>
                  <select
                    name="crop"
                    value={formData.crop}
                    onChange={handleChange}
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  >
                    {CROPS.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Season
                  </label>
                  <select
                    name="season"
                    value={formData.season}
                    onChange={handleChange}
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  >
                    {SEASONS.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    State
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  >
                    {STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Area (hectares)
                  </label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Annual Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fertilizer Used
                  </label>
                  <input
                    type="number"
                    name="fertilizer"
                    value={formData.fertilizer}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Pesticide Used
                  </label>
                  <input
                    type="number"
                    name="pesticide"
                    value={formData.pesticide}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2020"
                    max="2025"
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-blue-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {error && (
                <div className={`flex gap-3 p-4 rounded-lg border-l-4 border-red-500 mt-6 ${isDark ? 'bg-red-950' : 'bg-red-50'}`}>
                  <AlertCircle className={`${isDark ? 'text-red-300' : 'text-red-600'}`} size={20} />
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>Error</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-red-200' : 'text-red-600'}`}>{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-blue-700 hover:shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <BarChart3 size={20} />
                    Predict Yield
                  </>
                )}
              </button>
            </form>
          </div>

          {hasSubmitted && result && (
            <div className="lg:col-span-3">
              <div className={`rounded-xl shadow-lg border-2 p-6 ${
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-blue-200'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="text-green-500" size={28} />
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Prediction Results
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className={`p-6 rounded-lg border-2 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'}`}>
                    <p className={`text-sm font-semibold uppercase mb-2 tracking-wide ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Predicted Yield
                    </p>
                    <p className={`text-4xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {result.predicted_yield.toFixed(2)}
                    </p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      metric tons/hectare
                    </p>
                  </div>

                  <div className={`p-6 rounded-lg border-2 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300'}`}>
                    <p className={`text-sm font-semibold uppercase mb-2 tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      Model Confidence
                    </p>
                    <p className={`text-4xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </p>
                    <div className={`w-full bg-gray-300 rounded-full h-2 mt-3 ${isDark ? 'bg-slate-600' : ''}`}>
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-6 border-2 mb-6 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Input Parameters Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Crop:</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{result.crop}</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Season:</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{result.season}</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>State:</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{result.state}</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Area:</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{result.area} hectares</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Rainfall:</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{result.rainfall} mm</p>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Fertilizer:</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{result.fertilizer}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Top 5 Feature Importance
                  </h3>
                  <div className="space-y-3">
                    {result.top_features.map((feature, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {feature.feature.charAt(0).toUpperCase() + feature.feature.slice(1)}
                          </span>
                          <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {feature.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className={`w-full bg-gray-300 rounded-full h-2.5 ${isDark ? 'bg-slate-600' : ''}`}>
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-blue-600 h-2.5 rounded-full"
                            style={{ width: `${feature.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YieldPrediction;
