import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CropPrediction } from '../types';
import { useTheme } from '../hooks/useTheme';
import { Info } from 'lucide-react';

interface XAIChartsProps {
  prediction: CropPrediction;
}

const XAICharts: React.FC<XAIChartsProps> = ({ prediction }) => {
  const { isDark } = useTheme();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
      {/* SHAP Chart */}
      <div className={`p-6 rounded-xl shadow-md border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Feature Importance (SHAP)</h3>
          <div className="group relative">
            <Info className={`cursor-help ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
            <div className={`absolute right-0 w-64 p-3 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none ${
              isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-800 text-white'
            }`}>
              Shows how much each feature contributed to choosing {prediction.crop} over other crops.
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prediction.shapValues}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#475569' : '#e2e8f0'} />
              <XAxis type="number" hide />
              <YAxis dataKey="feature" type="category" width={80} tick={{fontSize: 12, fill: isDark ? '#cbd5e1' : '#333'}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#e5e7eb' : '#000' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {prediction.shapValues.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.impact === 'positive' ? '#16a34a' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={`text-xs text-center mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-1"></span> Positive Impact
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-1"></span> Negative Impact
        </p>
      </div>

      {/* LIME Explanation */}
      <div className={`p-6 rounded-xl shadow-md border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Local Interpretation (LIME)</h3>
          <div className="group relative">
            <Info className={`cursor-help ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
            <div className={`absolute right-0 w-64 p-3 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none ${
              isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-800 text-white'
            }`}>
              Explains the decision rules used for this specific prediction instance.
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Why <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{prediction.crop}</span>? 
                The model prioritized these conditions:
            </p>
            {prediction.limeExplanation.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-blue-500 ${
                  isDark ? 'bg-slate-600' : 'bg-slate-50'
                }`}>
                    <span className={`font-medium uppercase text-xs tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.feature}</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.condition}</span>
                </div>
            ))}
             <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-600' : 'border-slate-100'}`}>
                <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Model Confidence</h4>
                <div className={`w-full rounded-full h-4 overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                    <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${prediction.confidence * 100}%` }}
                    ></div>
                </div>
                <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>0%</span>
                    <span className="font-bold text-blue-400">{(prediction.confidence * 100).toFixed(1)}% Accuracy</span>
                    <span>100%</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default XAICharts;
