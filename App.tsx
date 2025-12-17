import React, { useState, useEffect } from 'react';
import { AppState, SoilData, CropPrediction } from './types';
import { predictCrop, getAuthToken, clearAuthToken } from './services/predictionService';
import { logout as logoutAPI } from './services/authService';
import { getCultivationGuide } from './services/geminiService';
import InputForm from './components/InputForm';
import XAICharts from './components/XAICharts';
import CultivationGuide from './components/CultivationGuide';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorAlert from './components/ErrorAlert';
import { ThemeProvider } from './context/ThemeContext';
import { Sprout, BarChart3, BookOpen, ArrowLeft, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useTheme } from './hooks/useTheme';

interface AppError {
  title: string;
  message: string;
}

const AppContent: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [state, setState] = useState<AppState>(AppState.LANDING);
  const [inputData, setInputData] = useState<SoilData | null>(null);
  const [prediction, setPrediction] = useState<CropPrediction | null>(null);
  const [guide, setGuide] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setState(AppState.INPUT);
    }
  }, []);

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

  const logout = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        await logoutAPI(token);
      } catch (err) {
        console.warn('Logout API call failed:', err);
      }
    }
    clearAuthToken();
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
        <div className={isDark ? 'dark' : ''}>
          <LandingPage onLogin={handleNavigateToLogin} onRegister={handleNavigateToRegister} />
        </div>
      </ErrorBoundary>
    );
  }

  // Render Login Page independently
  if (state === AppState.LOGIN) {
    return (
      <ErrorBoundary>
        <div className={isDark ? 'dark' : ''}>
          <LoginPage onLogin={handleLogin} onRegisterClick={handleNavigateToRegister} />
        </div>
      </ErrorBoundary>
    );
  }

  // Render Register Page independently
  if (state === AppState.REGISTER) {
    return (
      <ErrorBoundary>
        <div className={isDark ? 'dark' : ''}>
          <RegisterPage onRegister={handleRegisterSuccess} onLoginClick={handleNavigateToLogin} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'} flex flex-col`}>
        {/* Header */}
        <header className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
              <div className="bg-green-600 p-2 rounded-lg">
                  <Sprout className="text-white" size={24} />
              </div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} tracking-tight`}>
                Smart Crop <span className="text-green-600">Guidance</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
               <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} hidden sm:block`}>
                Powered by GA-RF Model & GenAI
              </div>
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={logout} 
                className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${isDark ? 'text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`}
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
                  <h2 className={`text-3xl font-extrabold sm:text-4xl mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Maximize Your Yield
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                <div className={`w-24 h-24 border-4 rounded-full animate-spin ${isDark ? 'border-slate-700 border-t-green-600' : 'border-slate-200 border-t-green-600'}`}></div>
                <Sprout className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600" size={32} />
             </div>
             <h3 className={`mt-8 text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{loadingStep}</h3>
             <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analyzing soil nutrient composition...</p>
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
            <div className={`rounded-xl shadow ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <div className={`border-b p-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
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

        <footer className={`border-t mt-auto py-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`container mx-auto px-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <p>&copy; {new Date().getFullYear()} Smart Crop Guidance System.</p>
            <p className="mt-2">Based on research: "An Approach for Crop Prediction in Agriculture: Integrating Genetic Algorithms and Machine Learning"</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
