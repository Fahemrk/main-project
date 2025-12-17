
import React from 'react';
import { Sprout, BrainCircuit, LineChart, ArrowRight, Leaf, ShieldCheck, Zap } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 backdrop-blur-md border-b ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg">
                <Sprout className="text-white" size={24} />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Smart Crop <span className="text-green-600">Guidance</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className={`font-medium px-4 py-2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Sign In
            </button>
            <button 
              onClick={onRegister}
              className={`text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-lg ${isDark ? 'bg-green-600 hover:bg-green-700 shadow-green-950' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm mb-6 ${isDark ? 'bg-slate-800 border border-slate-700 text-green-400' : 'bg-green-50 border border-green-100 text-green-700'}`}>
                <Zap size={16} fill="currentColor" /> Powered by Genetic Algorithms & Advanced AI
            </div>
            <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Farming Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                Reimagined for You.
              </span>
            </h1>
            <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Stop guessing. Start growing. Our hybrid ML model predicts the perfect crop for your soil, while AI generates your step-by-step cultivation roadmap.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onRegister}
                className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg hover:bg-green-700 hover:scale-105 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-2"
              >
                Start Predicting Now <ArrowRight size={20} />
              </button>
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                Existing User?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className={`py-24 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Why Choose Smart Crop?</h2>
                <p className={`max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>We combine traditional soil science with cutting-edge artificial intelligence to maximize your farm's potential.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className={`p-8 rounded-2xl shadow-sm border transition-shadow hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${isDark ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <BrainCircuit size={32} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>GA-RF Hybrid Engine</h3>
                    <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Our core engine uses Genetic Algorithms to optimize a Random Forest model, ensuring 99.3% accuracy in crop prediction based on soil nutrients.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className={`p-8 rounded-2xl shadow-sm border transition-shadow hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${isDark ? 'bg-purple-950 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                        <LineChart size={32} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Explainable AI (XAI)</h3>
                    <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Don't just get a result; understand it. We use SHAP and LIME visualizations to show you exactly <em>why</em> a specific crop was recommended.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className={`p-8 rounded-2xl shadow-sm border transition-shadow hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'}`}>
                        <Leaf size={32} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Smart AI Consultant</h3>
                    <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Integrated with advanced Generative AI to provide real-time, location-aware cultivation guides including fertilizer schedules and pest control.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className={`py-24 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="max-w-4xl mx-auto px-4 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-8 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                 <ShieldCheck size={14} /> Research Backed
              </div>
              <h2 className={`text-3xl font-bold mb-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Built on Proven Science</h2>
              <blockquote className={`text-xl italic mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  "Our approach integrates Genetic Algorithms and Machine Learning to achieve a remarkable accuracy rate of 99.3% in crop prediction."
              </blockquote>
              <div className={`flex items-center justify-center gap-4 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  <div className={`w-10 h-10 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      {/* Avatar Placeholder */}
                      <svg className={`w-full h-full ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                  </div>
                  <div>
                      Tanjim Mahmud et al. <br />
                      <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IEEE Access Research, 2024</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Footer */}
      <footer className={`border-t py-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                  <Sprout className="text-green-600" size={20} />
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Smart Crop Guidance</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  © {new Date().getFullYear()} All rights reserved.
              </p>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
