import React, { useState } from 'react';
import { Sprout, Lock, Mail, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { register } from '../services/authService';
import { login } from '../services/authService';
import { setAuthToken } from '../services/predictionService';

interface RegisterPageProps {
  onRegister: () => void;
  onLoginClick: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onLoginClick }) => {
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    
    try {
      await register(username, email, password);
      const loginResponse = await login(username, password);
      setAuthToken(loginResponse.access_token);
      onRegister();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`max-w-md w-full rounded-2xl shadow-xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-center relative overflow-hidden">
           {/* Decorative circles */}
           <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8"></div>
           <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 translate-y-12"></div>
           
           <div className="relative z-10">
             <div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4 border border-white/20 shadow-inner">
                <Sprout className="text-white" size={32} />
             </div>
             <h1 className="text-2xl font-bold text-white mb-1">Join Smart Crop</h1>
             <p className="text-green-100 text-sm">Create your farming profile</p>
           </div>
        </div>
        
        <div className="p-8">
          {error && (
            <div className={`mb-4 p-3 rounded-lg border ${isDark ? 'bg-red-950 border-red-800' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Username</label>
              <div className="relative group">
                <User className={`absolute left-3 top-3 group-focus-within:text-green-600 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
                <input 
                  type="text" 
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
              <div className="relative group">
                <Mail className={`absolute left-3 top-3 group-focus-within:text-green-600 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
                <input 
                  type="email" 
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
              <div className="relative group">
                <Lock className={`absolute left-3 top-3 group-focus-within:text-green-600 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
                <input 
                  type="password" 
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Confirm Password</label>
              <div className="relative group">
                <Lock className={`absolute left-3 top-3 group-focus-within:text-green-600 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
                <input 
                  type="password" 
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg mt-6 ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 shadow-slate-900' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className={`mt-6 pt-6 border-t text-center ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <button 
                onClick={onLoginClick}
                className={`text-sm flex items-center justify-center gap-2 mx-auto transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ArrowLeft size={16} /> Already have an account? <span className="text-green-600 font-bold hover:underline">Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;