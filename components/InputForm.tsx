
import React, { useState } from 'react';
import { SoilData } from '../types';
import { sanitizeNumber } from '../utils/sanitize';
import { Leaf, Droplets, Thermometer, Wind, FlaskConical, MapPin, CloudSun, Loader2, Crosshair } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: SoilData) => void;
  isLoading: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [formData, setFormData] = useState<SoilData>({
    latitude: 21.14,
    longitude: 79.08,
    N: 90,
    P: 42,
    K: 43,
    temperature: 20.8,
    humidity: 82,
    ph: 6.5,
    rainfall: 202
  });

  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    try {
      if (type === 'number' || type === 'range') {
        const num = sanitizeNumber(value);
        setFormData(prev => ({
          ...prev,
          [name]: num
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } catch (error) {
      console.warn(`Invalid value for ${name}:`, value);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(4)),
          longitude: parseFloat(position.coords.longitude.toFixed(4))
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Please enter manually.");
        setIsLocating(false);
      }
    );
  };

  const handleFetchWeather = async () => {
    if (!formData.latitude || !formData.longitude) {
      alert("Please enter Latitude and Longitude first.");
      return;
    }

    setIsFetchingWeather(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${formData.latitude}&longitude=${formData.longitude}&current=relative_humidity_2m&daily=temperature_2m_mean,precipitation_sum&past_days=92&forecast_days=1&timezone=auto`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!weatherRes.ok) {
        throw new Error(`Weather API error: ${weatherRes.statusText}`);
      }

      const weatherData = await weatherRes.json();

      if (!weatherData.daily || !weatherData.daily.precipitation_sum) {
        alert("Weather data unavailable for these coordinates.");
        return;
      }

      const rainArray = weatherData.daily.precipitation_sum as number[];
      const totalRainfall = rainArray.reduce((acc, curr) => acc + (sanitizeNumber(curr) || 0), 0);

      const tempArray = weatherData.daily.temperature_2m_mean as number[];
      const avgTemp = tempArray.reduce((acc, curr) => acc + (sanitizeNumber(curr) || 0), 0) / tempArray.length;

      const humidity = sanitizeNumber(weatherData.current?.relative_humidity_2m || prev.humidity);
      const temperature = sanitizeNumber(avgTemp);
      const rainfall = sanitizeNumber((totalRainfall * 25.4) / 90);

      setFormData(prev => ({
        ...prev,
        temperature: parseFloat(temperature.toFixed(1)),
        humidity: humidity,
        rainfall: parseFloat(rainfall.toFixed(1))
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        alert("Weather request timed out. Please try again or enter manually.");
      } else {
        console.error("Weather Fetch Error:", error);
        alert("Could not fetch weather data. Please enter manually.");
      }
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    if (!formData.latitude || !formData.longitude) {
      errors.push({ field: 'location', message: 'Latitude and longitude are required' });
    }

    if (formData.latitude! < -90 || formData.latitude! > 90) {
      errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90' });
    }

    if (formData.longitude! < -180 || formData.longitude! > 180) {
      errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180' });
    }

    if (formData.N < 0 || formData.N > 140) {
      errors.push({ field: 'N', message: 'Nitrogen must be between 0 and 140 kg/ha' });
    }

    if (formData.P < 5 || formData.P > 145) {
      errors.push({ field: 'P', message: 'Phosphorus must be between 5 and 145 kg/ha' });
    }

    if (formData.K < 5 || formData.K > 205) {
      errors.push({ field: 'K', message: 'Potassium must be between 5 and 205 kg/ha' });
    }

    if (formData.ph < 3.5 || formData.ph > 10) {
      errors.push({ field: 'ph', message: 'pH must be between 3.5 and 10' });
    }

    if (formData.temperature < 8 || formData.temperature > 45) {
      errors.push({ field: 'temperature', message: 'Temperature must be between 8 and 45°C' });
    }

    if (formData.humidity < 10 || formData.humidity > 100) {
      errors.push({ field: 'humidity', message: 'Humidity must be between 10 and 100%' });
    }

    if (formData.rainfall < 0 || formData.rainfall > 1500) {
      errors.push({ field: 'rainfall', message: 'Rainfall must be between 0 and 1500 mm' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const InputField = ({ label, name, icon: Icon, min, max, step = 1, unit }: any) => {
    const error = validationErrors.find(e => e.field === name);
    const hasError = !!error;

    return (
    <div className={`group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl shadow-md border-2 transition-all duration-300 ${
      hasError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:shadow-lg hover:border-green-300'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${
          hasError 
            ? 'bg-red-400' 
            : 'bg-gradient-to-br from-green-400 to-green-600'
        }`}>
          <Icon size={16} className="text-white" />
        </div>
        <label htmlFor={name} className={`font-semibold text-sm ${
          hasError ? 'text-red-700' : 'text-slate-700'
        }`}>{label}</label>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="number"
          id={name}
          name={name}
          value={formData[name as keyof SoilData]}
          onChange={handleChange}
          className="flex-1 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none text-slate-800 font-bold text-lg hover:border-green-300 transition-colors"
          min={min}
          max={max}
          step={step}
          required
        />
        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">{unit}</span>
      </div>
      <div className="space-y-1">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          name={name}
          value={formData[name as keyof SoilData] || min} 
          onChange={handleChange}
          className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-600 transition-colors"
        />
        <div className="flex justify-between text-xs text-slate-500 px-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      {hasError && (
        <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1">
          <span>⚠</span> {error?.message}
        </p>
      )}
    </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 py-8">
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8">
          <h3 className="font-bold text-red-800 mb-2">Please fix the following errors:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((err, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span>•</span> {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Location Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl shadow-lg border-2 border-blue-200 mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
            <MapPin className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Geographic Details</h2>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Location Coordinates</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
             <div className="relative">
                <label htmlFor="latitude" className="absolute -top-3 left-4 bg-gradient-to-r from-blue-50 to-blue-100 px-2 text-xs font-bold text-blue-700 uppercase">Latitude</label>
                <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    step="0.0001"
                    placeholder="21.1458"
                    className="w-full bg-white border-2 border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-slate-800 font-semibold hover:border-blue-400 transition-colors"
                />
             </div>
             <div className="relative">
                <label htmlFor="longitude" className="absolute -top-3 left-4 bg-gradient-to-r from-blue-50 to-blue-100 px-2 text-xs font-bold text-blue-700 uppercase">Longitude</label>
                <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    step="0.0001"
                    placeholder="79.0882"
                    className="w-full bg-white border-2 border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-slate-800 font-semibold hover:border-blue-400 transition-colors"
                />
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <button
              type="button"
              onClick={handleGeolocation}
              disabled={isLocating}
              className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 border-2 border-slate-700 hover:shadow-lg hover:scale-105 disabled:opacity-75"
            >
              {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
              Current Location
            </button>
            <button
              type="button"
              onClick={handleFetchWeather}
              disabled={isFetchingWeather}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 border-2 border-blue-700 hover:shadow-lg hover:scale-105 disabled:opacity-75"
            >
              {isFetchingWeather ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CloudSun size={18} />
              )}
              Fetch Weather
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-3 italic">
            💡 Tip: Use coordinates to auto-fill seasonal temperature & rainfall data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-3 mb-2">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
                    <FlaskConical className="text-white" size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Soil Composition</h2>
            </div>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-2"></div>
        </div>
        <InputField label="Nitrogen (N)" name="N" icon={Leaf} min={0} max={140} unit="kg/ha" />
        <InputField label="Phosphorus (P)" name="P" icon={Leaf} min={5} max={145} unit="kg/ha" />
        <InputField label="Potassium (K)" name="K" icon={Leaf} min={5} max={205} unit="kg/ha" />
        <InputField label="Soil pH" name="ph" icon={FlaskConical} min={3.5} max={10} step={0.1} unit="" />

        <div className="lg:col-span-3 mt-8 mb-2">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg">
                    <Wind className="text-white" size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Climate Conditions</h2>
            </div>
            <div className="h-1 w-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mt-2"></div>
        </div>
        <InputField label="Temperature" name="temperature" icon={Thermometer} min={8} max={45} step={0.1} unit="°C" />
        <InputField label="Humidity" name="humidity" icon={Droplets} min={10} max={100} step={0.1} unit="%" />
        <InputField label="Rainfall" name="rainfall" icon={Droplets} min={0} max={1500} step={0.1} unit="mm" />
      </div>

      <div className="flex justify-center sticky bottom-8 z-20">
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl transform transition-all duration-300 border-2
            ${isLoading 
              ? 'bg-slate-400 cursor-not-allowed border-slate-500 shadow-slate-400/50' 
              : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:scale-110 hover:shadow-green-500/50 border-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 active:scale-95'}
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing with GA-RF...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Leaf size={20} />
              Predict Optimal Crop
            </span>
          )}
        </button>
      </div>
    </form>
  );
};

export default InputForm;
