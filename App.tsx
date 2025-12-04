const apiKey = process.env.GEMINI_API_KEY;

import React, { useState, useEffect } from 'react';
import { AppState, SoilData, CropPrediction } from './types';
import { predictCrop } from './services/predictionService';
import { getCultivationGuide } from './services/geminiService';
import InputForm from './components/InputForm';
import XAICharts from './components/XAICharts';
import CultivationGuide from './components/CultivationGuide';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorAlert from './components/ErrorAlert';
import { Sprout, BarChart3, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AppError {
  title: string;
  message: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LANDING);
  const [inputData, setInputData] = useState<SoilData | null>(null);
  const [prediction, setPrediction] = useState<CropPrediction | null>(null);
  const [guide, setGuide] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<AppError | null>(null);

  const handleLogin = () => {
    setState(AppState.INPUT);
  };

  const handleRegisterSuccess = () => {
    // Auto-login after registration
    setState(AppState.INPUT);
  };

  const handleNavigateToRegister = () => {
    setState(AppState.REGISTER);
  };

  const handleNavigateToLogin = () => {
    setState(AppState.LOGIN);
  };

  const handleFormSubmit = async (data: SoilData) => {
    setInputData(data);
    setState(AppState.PROCESSING);
    setError(null);
    
    try {
      // Step 1: Prediction
      setLoadingStep('Genetic Algorithm: Selecting optimal features...');
      await new Promise(r => setTimeout(r, 800)); // Visual delay
      setLoadingStep('Random Forest: Classifying crop suitability...');
      
      const result = await predictCrop(data);
      setPrediction(result);

      // Step 2: Generation
      setLoadingStep('Generative AI: Generating cultivation guide...');
      const guideText = await getCultivationGuide(result.crop, data);
      setGuide(guideText);

      setState(AppState.RESULT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      console.error('Prediction error:', err);
      
      setError({
        title: 'Analysis Failed',
        message: errorMessage || 'Could not complete crop analysis. Please check your inputs and try again.',
      });
      setState(AppState.INPUT);
    }
  };

  const retryFormSubmit = () => {
    if (inputData) {
      handleFormSubmit(inputData);
    }
  };

  const reset = () => {
    setState(AppState.INPUT);
    setPrediction(null);
    setGuide('');
  };

  const logout = () => {
    setState(AppState.LANDING);
    setPrediction(null);
    setGuide('');
    setInputData(null);
  }

  // Logic to handle logo click based on auth state
  const handleLogoClick = () => {
    if ([AppState.INPUT, AppState.PROCESSING, AppState.RESULT].includes(state)) {
      // User is logged in, go to Dashboard (Input) and reset current progress
      reset();
    } else {
      // User is not logged in, go to Landing
      setState(AppState.LANDING);
    }
  };

  // Render Landing Page
  if (state === AppState.LANDING) {
    return (
      <ErrorBoundary>
        <LandingPage onLogin={handleNavigateToLogin} onRegister={handleNavigateToRegister} />
      </ErrorBoundary>
    );
  }

  // Render Login Page independently
  if (state === AppState.LOGIN) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={handleLogin} onRegisterClick={handleNavigateToRegister} />
      </ErrorBoundary>
    );
  }

  // Render Register Page independently
  if (state === AppState.REGISTER) {
    return (
      <ErrorBoundary>
        <RegisterPage onRegister={handleRegisterSuccess} onLoginClick={handleNavigateToLogin} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
              <div className="bg-green-600 p-2 rounded-lg">
                  <Sprout className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Smart Crop <span className="text-green-600">Guidance</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-sm text-slate-500 hidden sm:block">
                Powered by GA-RF Model & GenAI
              </div>
              <button 
                onClick={logout} 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors"
              >
                Sign Out
              </button>
            </div>
           
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {error && (
            <ErrorAlert
              title={error.title}
              message={error.message}
              onDismiss={() => setError(null)}
              onRetry={state === AppState.INPUT ? retryFormSubmit : undefined}
            />
          )}
          
          {state === AppState.INPUT && (
            <div className="animate-fade-in-up">
              <div className="text-center max-w-2xl mx-auto mb-10">
                  <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
                      Maximize Your Yield
                  </h2>
                  <p className="text-lg text-slate-600">
                      Enter your soil and weather parameters below. Our hybrid Machine Learning model 
                      will predict the most profitable crop for your land.
                  </p>
              </div>
              <InputForm onSubmit={handleFormSubmit} isLoading={false} />
            </div>
          )}

        {state === AppState.PROCESSING && (
           <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
             <div className="relative">
                <div className="w-24 h-24 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
                <Sprout className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600" size={32} />
             </div>
             <h3 className="mt-8 text-xl font-semibold text-slate-800">{loadingStep}</h3>
             <p className="text-slate-500 mt-2">Analyzing soil nutrient composition...</p>
           </div>
        )}

        {state === AppState.RESULT && prediction && (
          <div className="animate-fade-in space-y-8">
            {/* Top Result Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Sprout size={200} />
                </div>
                <div className="relative z-10">
                    <button onClick={reset} className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={16} /> Back to inputs
                    </button>
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                        <div>
                            <p className="text-green-400 font-medium mb-1 tracking-wide uppercase text-sm">Recommended Crop</p>
                            <h2 className="text-5xl font-extrabold text-white mb-2">{prediction.crop}</h2>
                            <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 size={18} className="text-green-400" />
                                <span>{(prediction.confidence * 100).toFixed(1)}% Confidence Score</span>
                            </div>
                        </div>
                        <div className="flex-grow"></div>
                        <div className="flex gap-4">
                            {prediction.probabilities.slice(1, 3).map((p, idx) => (
                                <div key={idx} className="text-right">
                                    <p className="text-xs text-slate-400 uppercase">Alternative</p>
                                    <p className="font-semibold text-slate-200">{p.name} ({(p.value * 100).toFixed(0)}%)</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Section - Full Width */}
            <div className="bg-white rounded-xl shadow">
                <div className="border-b border-slate-100 p-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" size={20} /> Explainable AI Analysis
                    </h3>
                </div>
                <div className="p-6">
                    <XAICharts prediction={prediction} />
                </div>
            </div>

            {/* Cultivation Guide Section - Full Width */}
            <div>
                <CultivationGuide crop={prediction.crop} guide={guide} />
            </div>
          </div>
        )}

      </main>

        <footer className="bg-white border-t border-slate-200 mt-auto py-8">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Smart Crop Guidance System.</p>
            <p className="mt-2">Based on research: "An Approach for Crop Prediction in Agriculture: Integrating Genetic Algorithms and Machine Learning"</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
