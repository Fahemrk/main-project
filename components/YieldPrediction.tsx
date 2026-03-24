import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { TrendingUp, AlertCircle, CheckCircle, Loader2, BarChart3 } from 'lucide-react';

interface YieldData {
  crop: string;
  season: string;
  state: string;
  rainfall: number | string;
  fertilizer: number | string;
  pesticide: number | string;
  area: number | string;
  year: number | string;
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
      [name]: value
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

      const payload = {
        ...formData,
        rainfall: Number(formData.rainfall),
        fertilizer: Number(formData.fertilizer),
        pesticide: Number(formData.pesticide),
        area: Number(formData.area) * 0.404686, // Convert acres to hectares
        year: Number(formData.year)
      };

      const response = await fetch('http://localhost:5000/predict-yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
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

        <div className="space-y-8">
          {/* Form Section */}
          <form onSubmit={handleSubmit} className={`relative rounded-3xl shadow-sm border p-8 md:p-10 backdrop-blur-xl transition-all duration-300 overflow-hidden ${
            isDark
              ? 'bg-slate-800/40 border-white/5'
              : 'bg-white/60 border-slate-200/50 hover:shadow-xl'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
               <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg text-white">
                 <AlertCircle size={20} />
               </div>
               Crop Details & Area Parameters
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Crop Name</label>
                <select name="crop" value={formData.crop} onChange={handleChange} className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Season</label>
                <select name="season" value={formData.season} onChange={handleChange} className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>State</label>
                <select name="state" value={formData.state} onChange={handleChange} className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Area (acres)</label>
                <input type="number" name="area" value={formData.area} onChange={handleChange} min="0" step="any" className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>
            </div>

            <h2 className={`text-2xl font-bold mb-8 mt-12 flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
               <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg text-white">
                 <AlertCircle size={20} />
               </div>
               Growth Variables
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Annual Rainfall (mm)</label>
                <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} min="0" step="any" className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>
              
              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Fertilizer Used (kg)</label>
                <input type="number" name="fertilizer" value={formData.fertilizer} onChange={handleChange} min="0" step="any" className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>

              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Pesticide Used (kg)</label>
                <input type="number" name="pesticide" value={formData.pesticide} onChange={handleChange} min="0" step="any" className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>

              <div className={`group p-6 rounded-3xl shadow-sm border transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 ${isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60' : 'bg-white/60 border-slate-200/50 hover:bg-white hover:shadow-xl'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Year</label>
                <input type="number" name="year" value={formData.year} onChange={handleChange} min="2020" max="2030" className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent focus:outline-none font-bold text-base transition-all shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>
            </div>

            {error && (
              <div className={`flex gap-3 p-4 rounded-xl border mt-6 backdrop-blur-md ${isDark ? 'bg-red-950/40 border-red-500/50 text-red-300' : 'bg-red-50/80 border-red-200 text-red-600'}`}>
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Prediction Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                group relative w-full lg:w-96 mx-auto block mt-10 px-6 py-5 rounded-full text-white font-bold text-xl shadow-xl overflow-hidden transition-all duration-300 
                ${isLoading 
                  ? 'bg-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] active:scale-95'}
              `}
            >
              {!isLoading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
              <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <BarChart3 size={24} />
                  Calculate Expected Yield
                </>
              )}
              </span>
            </button>
          </form>

          {/* Results Section */}
          {hasSubmitted && result && (
            <div className="animate-fade-in-up mt-8">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 transition-transform duration-700 group-hover:scale-105"></div>
                <div className="absolute inset-0 bg-black/10"></div>
                
                <div className="relative z-10 p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 h-full">
                    <div className="text-center md:text-left w-full flex flex-col items-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 text-blue-100 uppercase tracking-widest text-xs font-bold">
                         <CheckCircle size={14} /> Expected Production
                      </div>
                      
                      <div className="flex items-baseline justify-center gap-4 mb-2 filter drop-shadow-md">
                        <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter">
                          {(result.predicted_yield * 0.404686).toFixed(2)}
                        </h2>
                        <span className="text-2xl text-blue-100 font-medium">MT/acre</span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-blue-50 text-lg font-medium opacity-90">
                        <span>{(result.confidence * 100).toFixed(1)}% AI Model Confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Grid */}
              <div className="grid md:grid-cols-2 gap-6 pb-20">
                <div className={`rounded-3xl shadow-sm border p-8 backdrop-blur-xl ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white/60 border-slate-200/50'}`}>
                  <h3 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Input Parameters Evaluated
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: 'Crop', v: result.crop },
                      { l: 'Season', v: result.season },
                      { l: 'State', v: result.state },
                      { l: 'Area', v: `${(result.area / 0.404686).toFixed(2)} acres` },
                      { l: 'Rainfall', v: `${result.rainfall} mm` },
                      { l: 'Fertilizer', v: `${result.fertilizer} kg` },
                    ].map((item, i) => (
                      <div key={i} className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                        <div className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.l}</div>
                        <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-3xl shadow-sm border p-8 backdrop-blur-xl ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white/60 border-slate-200/50'}`}>
                  <h3 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Genetic Algorithm Feature Importance
                  </h3>
                  <div className="space-y-4">
                    {result.top_features.map((feature, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm font-medium mb-2">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{feature.feature.charAt(0).toUpperCase() + feature.feature.slice(1)}</span>
                          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{feature.percentage.toFixed(1)}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
                          <div className="bg-gradient-to-r from-blue-400 to-indigo-600 h-2 rounded-full" style={{ width: `${feature.percentage}%` }}></div>
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
