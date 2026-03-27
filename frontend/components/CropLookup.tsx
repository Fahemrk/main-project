import React, { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Search, Info, AlertCircle, TrendingUp } from 'lucide-react';
import cropDataRaw from '../data/cropData.json' with { type: 'json' };

interface NutrientRange {
  optimal: number;
  min: number;
  max: number;
  median: number;
  q25: number;
  q75: number;
}

interface CropStats {
  N: NutrientRange;
  P: NutrientRange;
  K: NutrientRange;
  temperature: NutrientRange;
  humidity: NutrientRange;
  ph: NutrientRange;
  rainfall: NutrientRange;
  sample_count?: number;
}

const CropLookup: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [cropStats, setCropStats] = useState<CropStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const cropList = useMemo(() => {
    const crops = Object.keys(cropDataRaw).sort();
    return crops;
  }, []);

  const handleGetDetails = async () => {
    if (!selectedCrop.trim()) {
      setError('Please select or enter a crop name');
      return;
    }

    setIsLoading(true);
    setError('');
    setCropStats(null);

    try {
      const cropName = selectedCrop.toLowerCase().trim();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/crop-optimal-conditions/${encodeURIComponent(cropName)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || `Crop "${selectedCrop}" not found in dataset`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setCropStats(data as CropStats);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error fetching crop details: ${errorMsg}. Make sure backend server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGetDetails();
    }
  };

  return (
    <div className={`rounded-xl shadow-lg border-2 p-8 mb-10 ${
      isDark
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
        : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl">
          <Search className="text-white" size={24} />
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Crop Information Lookup
        </h2>
      </div>

      <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        Enter a crop name from our dataset to view average NPK values, optimal climate conditions, and growing requirements.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="cropSelect" className={`block text-sm font-semibold mb-2 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Select or Enter Crop Name
          </label>
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <input
                list="crops"
                id="cropSelect"
                type="text"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., rice, wheat, cotton, coffee..."
                className={`w-full border-2 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none font-semibold transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                    : 'bg-white border-emerald-300 text-slate-800 placeholder-slate-400'
                }`}
              />
              <datalist id="crops">
                {cropList.map((crop) => (
                  <option key={crop} value={crop} />
                ))}
              </datalist>
            </div>
            <button
              onClick={handleGetDetails}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-emerald-700 hover:shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? 'Loading...' : 'Get Details'}
            </button>
          </div>
        </div>

        {error && (
          <div className={`flex gap-3 p-4 rounded-lg border-l-4 border-red-500 ${isDark ? 'bg-red-950' : 'bg-red-50'}`}>
            <AlertCircle className={`${isDark ? 'text-red-300' : 'text-red-600'}`} size={20} />
            <div>
              <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>Error</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-red-200' : 'text-red-600'}`}>{error}</p>
            </div>
          </div>
        )}

        {cropStats && (
          <div className={`rounded-lg border-2 p-6 mt-6 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-emerald-200'}`}>
            <h3 className={`text-xl font-bold mb-6 uppercase tracking-wide flex items-center gap-2 ${
              isDark ? 'text-emerald-300' : 'text-emerald-700'
            }`}>
              <Info size={20} />
              {selectedCrop} - Growing Requirements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* NPK Values */}
              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      Nitrogen (N)
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.N.q25.toFixed(0)}-{cropStats.N.q75.toFixed(0)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>kg/ha (optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.N.median.toFixed(1)} | Avg: {cropStats.N.optimal.toFixed(1)}
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      Phosphorus (P)
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.P.q25.toFixed(0)}-{cropStats.P.q75.toFixed(0)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>kg/ha (optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.P.median.toFixed(1)} | Avg: {cropStats.P.optimal.toFixed(1)}
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      Potassium (K)
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.K.q25.toFixed(0)}-{cropStats.K.q75.toFixed(0)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>kg/ha (optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-red-400' : 'text-red-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.K.median.toFixed(1)} | Avg: {cropStats.K.optimal.toFixed(1)}
                </p>
              </div>

              {/* Climate Requirements */}
              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                      Temperature
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.temperature.q25.toFixed(1)}-{cropStats.temperature.q75.toFixed(1)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>°C (optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.temperature.median.toFixed(1)}°C | Avg: {cropStats.temperature.optimal.toFixed(1)}°C
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                      Humidity
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.humidity.q25.toFixed(0)}-{cropStats.humidity.q75.toFixed(0)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>% (optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.humidity.median.toFixed(1)}% | Avg: {cropStats.humidity.optimal.toFixed(1)}%
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                      Soil pH
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.ph.q25.toFixed(2)}-{cropStats.ph.q75.toFixed(2)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>(optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.ph.median.toFixed(2)} | Avg: {cropStats.ph.optimal.toFixed(2)}
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 tracking-wide ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Rainfall
                    </p>
                    <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {cropStats.rainfall.q25.toFixed(0)}-{cropStats.rainfall.q75.toFixed(0)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>mm (optimal)</p>
                  </div>
                  <TrendingUp size={18} className={isDark ? 'text-green-400' : 'text-green-600'} />
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Median: {cropStats.rainfall.median.toFixed(1)} | Avg: {cropStats.rainfall.optimal.toFixed(1)}
                </p>
              </div>
            </div>

            {cropStats.sample_count && (
              <div className={`mt-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                📊 Based on <strong>{cropStats.sample_count}</strong> crop samples from training dataset
              </div>
            )}

            <div className={`mt-6 p-4 rounded-lg border-l-4 border-emerald-500 ${isDark ? 'bg-emerald-950' : 'bg-emerald-50'}`}>
              <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                <strong>📈 How to read:</strong> The main range (e.g., "60-100") shows the optimal conditions where 50% of crops thrive (25th-75th percentile). Median and Average values are provided for reference.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropLookup;
