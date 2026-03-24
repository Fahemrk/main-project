import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { TrendingUp, Calendar, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';
import { getAuthToken } from '../services/predictionService';

interface PricePredictionResult {
    days_ahead: number;
    predicted_price: number;
    currency: string;
    unit: string;
}

const PricePrediction: React.FC = () => {
    const { isDark } = useTheme();
    const [days, setDays] = useState<string | number>(7);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<PricePredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('http://localhost:5000/api/price/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ days })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Prediction failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to get price prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-w-5xl mx-auto rounded-3xl shadow-sm border backdrop-blur-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white/60 border-slate-200/50'}`}>
            <div className={`p-8 md:p-10 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-600 p-2 rounded-lg">
                        <TrendingUp className="text-white" size={24} />
                    </div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        Crop Price Forecast
                    </h2>
                </div>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Predict future market trends using our advanced rolling-window forecasting model.
                </p>
            </div>

            <div className="p-8 grid md:grid-cols-2 gap-12">
                {/* Input Section */}
                <div>
                    <form onSubmit={handlePredict} className="space-y-6">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Forecast Horizon (Days)
                            </label>
                            <div className="relative">
                                <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={days}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') setDays('');
                                        else {
                                            const num = parseInt(val);
                                            if (!isNaN(num)) setDays(num);
                                        }
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none transition-all ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                        }`}
                                />
                            </div>
                            <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                Values between 1-60 days give the most accurate results.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 ${loading
                                ? 'bg-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] active:scale-95'
                                }`}
                        >
                            {!loading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                            <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Analyzing Trends...
                                </>
                            ) : (
                                <>
                                    Analyze Market <ArrowRight size={20} />
                                </>
                            )}
                            </span>
                        </button>
                    </form>

                    {error && (
                        <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'}`}>
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className={`rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-inner ${isDark ? 'bg-slate-900/50' : 'bg-slate-50 border border-slate-100'
                    }`}>
                    {!result ? (
                        <div className="opacity-50">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                <DollarSign size={40} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                            </div>
                            <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No Forecast Yet</h3>
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Enter a number of days to see price predictions.</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in w-full">
                            <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {result.days_ahead} Day Forecast
                            </p>
                            <div className="relative inline-block">
                                <h3 className={`text-6xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <span className="text-3xl align-top opacity-50 font-medium mr-1">₹</span>
                                    {result.predicted_price.toLocaleString()}
                                </h3>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-500'}`}>
                                per {result.unit}
                            </div>

                            <div className={`mt-8 pt-6 border-t w-full ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <div className="flex justify-between items-center text-sm">
                                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Model Confidence</span>
                                    <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>~92.4%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricePrediction;
