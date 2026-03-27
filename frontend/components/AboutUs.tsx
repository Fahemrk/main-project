import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Github, Mail, Linkedin, Code2, Database, Layout, Server, Shield, BrainCircuit } from 'lucide-react';

const teamMembers = [
  {
    name: 'Fahem Raseek',
    email: 'fahemraseek123@gmail.com',
    description: 'Designed and optimized the crop recommendation model using Random Forest and Decision Trees. Handled data preprocessing, REST API backend in Flask, responsive React frontend components, and comprehensive testing of the prediction pipeline.',
    icon: <BrainCircuit className="w-10 h-10 text-emerald-500" />,
    skills: ['Machine Learning Pipeline', 'Data Handling', 'Backend API', 'Frontend Integration', 'Testing & Optimization']
  },
  {
    name: 'George Sebastian',
    email: 'georgesebastian4321@gmail.com',
    description: 'Developed the crop yield prediction system using XGBoost Regressor. Authored advanced feature engineering techniques, Flask API implementation for yield prediction, and interactive React dashboards for visualizing productivity indicators.',
    icon: <Database className="w-10 h-10 text-blue-500" />,
    skills: ['Machine Learning Pipeline', 'Feature Engineering', 'Backend API', 'Frontend Dashboard', 'Model Evaluation']
  },
  {
    name: 'Joseph Paul',
    email: 'jopaulareeckal@gmail.com',
    description: 'Developed the crop price prediction system using advanced XGBoost models and hybrid time-series approaches. Managed historical market data collection, backend API processing, and dynamic price charting using Recharts.',
    icon: <Layout className="w-10 h-10 text-amber-500" />,
    skills: ['Price Prediction Model', 'Data Processing', 'Backend API', 'Visualization', 'Performance Evaluation']
  },
  {
    name: 'Grigary M Varkey',
    email: 'grigaryvarkey16@gmail.com',
    description: 'Implemented Explainable AI (SHAP and LIME) to interpret models, and optimized features using Genetic Algorithms. Designed the overall Flask backend architecture, JWT security, MongoDB schemas, and React frontend structures.',
    icon: <Shield className="w-10 h-10 text-purple-500" />,
    skills: ['Explainable AI', 'Feature Optimization', 'Backend Security', 'System Integration', 'Frontend Architecture']
  }
];

const AboutUs: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600">Team</span>
        </h2>
        <p className={`text-lg md:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          The minds behind the Smart Crop Guidance System. We are passionate about integrating advanced Machine Learning and Genetic Algorithms into agriculture to empower modern farming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {teamMembers.map((member, index) => (
          <div 
            key={index} 
            className={`flex flex-col h-full rounded-2xl p-8 transition-all duration-300 border ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 shadow-lg shadow-black/20' 
                : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-200 hover:shadow-emerald-100/50'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  {member.icon}
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {member.name}
                  </h3>
                </div>
              </div>
            </div>

            <p className={`mb-6 leading-relaxed flex-grow text-[15px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {member.description}
            </p>

            <div className="space-y-4 mt-auto">
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isDark 
                        ? 'bg-slate-700/50 text-slate-300 border border-slate-600' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className={`pt-4 flex items-center gap-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <a 
                  href={`mailto:${member.email}`} 
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  {member.email}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUs;
