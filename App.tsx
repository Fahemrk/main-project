import React, { useState, useEffect } from 'react';
import { AppState, SoilData, CropPrediction } from './types';
import { predictCrop, getAuthToken, clearAuthToken } from './services/predictionService';
import { logout as logoutAPI } from './services/authService';
import { getCultivationGuide } from './services/geminiService';
import InputForm from './components/InputForm';
import CropLookup from './components/CropLookup';
import YieldPrediction from './components/YieldPrediction';
import PricePrediction from './components/PricePrediction';
import XAICharts from './components/XAICharts';
import CultivationGuide from './components/CultivationGuide';
import AboutUs from './components/AboutUs';
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
      await new Promise(r => setTimeout(r, 800));
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

      if (errorMessage.includes('Session expired') || errorMessage.includes('Please log in')) {
        clearAuthToken();
        setState(AppState.LOGIN);
        return;
      }

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
    // Check if user is in any authenticated state
    if ([
      AppState.INPUT,
      AppState.PROCESSING,
      AppState.RESULT,
      AppState.YIELD_PREDICTION,
      AppState.PRICE_PREDICTION,
      AppState.CROP_LOOKUP,
      AppState.ABOUT_US
    ].includes(state)) {
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
      <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-300`}>
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${isDark ? 'bg-slate-950/70 border-white/5' : 'bg-white/70 border-slate-200/50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
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
                onClick={() => setState(AppState.ABOUT_US)}
                className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                About Us
              </button>
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

              <div className="flex justify-center gap-3 mb-10 flex-wrap">
                <button
                  onClick={() => setState(AppState.INPUT)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 shadow-sm border bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5`}
                >
                  Crop Prediction
                </button>
                <button
                  onClick={() => setState(AppState.YIELD_PREDICTION)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 shadow-sm border ${
                    isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white backdrop-blur-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  Yield Prediction
                </button>
                <button
                  onClick={() => setState(AppState.PRICE_PREDICTION)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 shadow-sm border ${
                    isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white backdrop-blur-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  Price Forecast
                </button>
                <button
                  onClick={() => setState(AppState.CROP_LOOKUP)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 shadow-sm border ${
                    isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white backdrop-blur-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  Crop Lookup
                </button>
              </div>

              <InputForm onSubmit={handleFormSubmit} isLoading={false} />
            </div>
          )}

          {state === AppState.YIELD_PREDICTION && (
            <div className="animate-fade-in-up">
              <div className="mb-6">
                <button
                  onClick={() => setState(AppState.INPUT)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  <ArrowLeft size={18} /> Back to Crop Prediction
                </button>
              </div>
              <YieldPrediction />
            </div>
          )}

          {state === AppState.PRICE_PREDICTION && (
            <div className="animate-fade-in-up">
              <div className="mb-6">
                <button
                  onClick={() => setState(AppState.INPUT)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  <ArrowLeft size={18} /> Back to Crop Prediction
                </button>
              </div>
              <PricePrediction />
            </div>
          )}

          {state === AppState.CROP_LOOKUP && (
            <div className="animate-fade-in-up">
              <div className="mb-6">
                <button
                  onClick={() => setState(AppState.INPUT)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  <ArrowLeft size={18} /> Back to Crop Prediction
                </button>
              </div>
              <CropLookup />
            </div>
          )}

          {state === AppState.ABOUT_US && (
            <div className="animate-fade-in-up">
              <div className="mb-6">
                <button
                  onClick={() => setState(AppState.INPUT)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  <ArrowLeft size={18} /> Back to Dashboard
                </button>
              </div>
              <AboutUs />
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
              <div className="mb-2">
                <button
                  onClick={reset}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  <ArrowLeft size={18} /> Back to Inputs
                </button>
              </div>
              {/* Top Result Banner */}
              <div className={`relative overflow-hidden rounded-3xl shadow-[0_8px_40px_-12px_rgba(16,185,129,0.3)] p-8 md:p-12 text-white bg-gradient-to-br transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(16,185,129,0.5)] ${isDark ? 'from-slate-900 via-emerald-950 to-slate-900 border border-white/10' : 'from-emerald-600 via-green-500 to-teal-600 border border-green-400'}`}>
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 p-10 opacity-10 blur-sm mix-blend-overlay pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150">
                  <Sprout size={400} />
                </div>
                <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 h-full">
                  <div className="text-center md:text-left w-full flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-4 text-emerald-100 uppercase tracking-widest text-xs font-bold">
                       <CheckCircle2 size={14} /> Top Recommendation
                    </div>
                    <h2 className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tighter filter drop-shadow-md">{prediction.crop}</h2>
                    <div className="flex items-center justify-center gap-2 text-emerald-50 text-lg font-medium opacity-90">
                      <span>{(prediction.confidence * 100).toFixed(1)}% Artificial Intelligence Confidence</span>
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
