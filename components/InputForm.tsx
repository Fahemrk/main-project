
import React, { useState } from 'react';
import { SoilData } from '../types';
import { Leaf, Droplets, Thermometer, Wind, FlaskConical, MapPin, CloudSun, Loader2, Crosshair } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: SoilData) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value
    }));
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
      // Fetch past 92 days (approx 1 season) to get averages instead of just "today's" weather
      // Rainfall needs to be CUMULATIVE over a season, not just today's rain (which is often 0)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${formData.latitude}&longitude=${formData.longitude}&current=relative_humidity_2m&daily=temperature_2m_mean,precipitation_sum&past_days=92&forecast_days=1&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      if (weatherData.daily && weatherData.daily.precipitation_sum) {
        // Calculate Seasonal Rainfall (Sum of past ~3 months)
        const rainArray = weatherData.daily.precipitation_sum as number[];
        const totalRainfall = rainArray.reduce((acc, curr) => acc + (curr || 0), 0);

        // Calculate Average Temperature (Mean of past ~3 months)
        const tempArray = weatherData.daily.temperature_2m_mean as number[];
        const avgTemp = tempArray.reduce((acc, curr) => acc + (curr || 0), 0) / tempArray.length;

        setFormData(prev => ({
          ...prev,
          temperature: parseFloat(avgTemp.toFixed(1)),
          humidity: weatherData.current?.relative_humidity_2m || prev.humidity,
          rainfall: parseFloat(((totalRainfall * 25.4) / 90).toFixed(1))
        }));
      } else {
        alert("Weather data unavailable for these coordinates.");
      }

    } catch (error) {
      console.error("Weather Fetch Error:", error);
      alert("Could not fetch weather data. Please enter manually.");
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const InputField = ({ label, name, icon: Icon, min, max, step = 1, unit }: any) => (
    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-green-300 transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg group-hover:scale-110 transition-transform">
          <Icon size={16} className="text-white" />
        </div>
        <label htmlFor={name} className="text-slate-700 font-semibold text-sm">{label}</label>
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
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 py-8">
      
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
