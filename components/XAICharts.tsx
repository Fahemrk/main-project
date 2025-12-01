import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CropPrediction } from '../types';
import { Info } from 'lucide-react';

interface XAIChartsProps {
  prediction: CropPrediction;
}

const XAICharts: React.FC<XAIChartsProps> = ({ prediction }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
      {/* SHAP Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Feature Importance (SHAP)</h3>
          <div className="group relative">
            <Info className="text-slate-400 cursor-help" size={20} />
            <div className="absolute right-0 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Shows how much each feature contributed to choosing {prediction.crop} over other crops.
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prediction.shapValues}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="feature" type="category" width={80} tick={{fontSize: 12}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {prediction.shapValues.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.impact === 'positive' ? '#16a34a' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-slate-500 mt-2">
            <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-1"></span> Positive Impact
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-1"></span> Negative Impact
        </p>
      </div>

      {/* LIME Explanation */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Local Interpretation (LIME)</h3>
          <div className="group relative">
            <Info className="text-slate-400 cursor-help" size={20} />
            <div className="absolute right-0 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Explains the decision rules used for this specific prediction instance.
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
                Why <span className="font-bold text-green-700">{prediction.crop}</span>? 
                The model prioritized these conditions:
            </p>
            {prediction.limeExplanation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                    <span className="font-medium text-slate-700 uppercase text-xs tracking-wider">{item.feature}</span>
                    <span className="font-mono text-slate-900 font-bold">{item.condition}</span>
                </div>
            ))}
             <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Model Confidence</h4>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${prediction.confidence * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span className="font-bold text-blue-700">{(prediction.confidence * 100).toFixed(1)}% Accuracy</span>
                    <span>100%</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default XAICharts;
