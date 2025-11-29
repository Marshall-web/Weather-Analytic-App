import React, { useState, useEffect } from 'react';
import './App.css';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, MapPin, Search, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export default function WeatherAnalyticsApp() {
  const [location, setLocation] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async (city) => {
    setLoading(true);
    setError('');
    try {
      // First, get coordinates from Open-Meteo geocoding API
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
      );
      
      if (!geoResponse.ok) throw new Error('City not found');
      
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }
    const bestMatch =
        geoData.results.find(r => r.feature_code === 'PPLC') || // capital
        geoData.results.find(r => r.feature_code === 'PPLA') || // main city
        geoData.results[0];
      const { latitude, longitude, name, country } = bestMatch;
      
      // Fetch weather data from Open-Meteo (no API key required, CORS-friendly)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability&timezone=auto&forecast_days=2`
      );
      
      if (!weatherResponse.ok) throw new Error('Unable to fetch weather data');
      
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      
      // Map weather codes to descriptions
      const getWeatherDescription = (code) => {
        const weatherCodes = {
          0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
          45: 'Foggy', 48: 'Foggy', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
          61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
          80: 'Light showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm'
        };
        return weatherCodes[code] || 'Unknown';
      };
      
      const weatherDesc = getWeatherDescription(current.weather_code);
      
      const transformedData = {
        name: `${name}${country ? ', ' + country : ''}`,
        main: {
          temp: current.temperature_2m,
          feels_like: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          pressure: current.surface_pressure
        },
        weather: [{
          main: weatherDesc.includes('rain') || weatherDesc.includes('shower') ? 'Rain' : 
                 weatherDesc.includes('cloud') || weatherDesc.includes('Overcast') ? 'Clouds' : 'Clear',
          description: weatherDesc.toLowerCase()
        }],
        wind: {
          speed: current.wind_speed_10m / 3.6 // Convert km/h to m/s
        }
      };
      
      setWeatherData(transformedData);
      setLocation(transformedData.name);
      
      // Process hourly forecast data for charts (next 24 hours)
      const now = new Date();
      const currentHour = now.getHours();
      const hourlyData = weatherData.hourly;
      
      const processedForecast = [];
      for (let i = 0; i < 8; i++) {
        const hour = currentHour + i;
        if (hour < hourlyData.time.length) {
          processedForecast.push({
            time: new Date(hourlyData.time[hour]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            temp: Math.round(hourlyData.temperature_2m[hour]),
            feels_like: Math.round(hourlyData.apparent_temperature[hour]),
            humidity: hourlyData.relative_humidity_2m[hour],
            rain: hourlyData.precipitation_probability[hour] || 0
          });
        }
      }
      
      setForecast(processedForecast);
    } catch (err) {
      setError('Unable to fetch weather data. Please try another city.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      fetchWeather(searchInput.trim());
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return <Cloud className="w-16 h-16" />;
    const main = condition.toLowerCase();
    if (main.includes('rain')) return <CloudRain className="w-16 h-16 text-blue-400" />;
    if (main.includes('cloud')) return <Cloud className="w-16 h-16 text-gray-400" />;
    return <Sun className="w-16 h-16 text-yellow-400" />;
  };

  const getRecommendations = () => {
    if (!weatherData) return [];
    const temp = weatherData.main.temp;
    const condition = weatherData.weather[0].main.toLowerCase();
    const recommendations = [];

    if (temp < 10) recommendations.push('🧥 Wear a warm jacket');
    else if (temp < 20) recommendations.push('👕 Light jacket recommended');
    else recommendations.push('☀️ Perfect for outdoor activities');

    if (condition.includes('rain')) recommendations.push('☂️ Don\'t forget your umbrella');
    if (weatherData.main.humidity > 70) recommendations.push('💧 High humidity - stay hydrated');
    if (weatherData.wind.speed > 10) recommendations.push('💨 Windy conditions expected');

    return recommendations;
  };

  useEffect(() => {
    fetchWeather('London');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="weather-header">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Cloud className="w-10 h-10 text-indigo-600" />
            Weather Analytics
          </h1>
          {/* Search Bar */}
          <div className="weather-search-bar">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Enter city name..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="weather-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading weather data...</p>
          </div>
        ) : weatherData ? (
          <>
            {/* Current Weather Card */}
            <div className="weather-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{location}</h2>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {getWeatherIcon(weatherData.weather[0].main)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-5xl font-bold text-gray-800">{Math.round(weatherData.main.temp)}°C</p>
                  <p className="text-gray-500 mt-2 capitalize">{weatherData.weather[0].description}</p>
                  <p className="text-sm text-gray-400 mt-1">Feels like {Math.round(weatherData.main.feels_like)}°C</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Wind Speed</p>
                      <p className="font-semibold">{weatherData.wind.speed} m/s</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Humidity</p>
                      <p className="font-semibold">{weatherData.main.humidity}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Pressure</p>
                      <p className="font-semibold">{weatherData.main.pressure} hPa</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Recommendations */}
            <div className="weather-recommendations">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getRecommendations().map((rec, idx) => (
                  <div key={idx} className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
            {/* Temperature Forecast Chart */}
            <div className="weather-chart">
              <h3 className="text-xl font-bold mb-4 text-gray-800">24-Hour Temperature Forecast</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={forecast}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="temp" stroke="#6366f1" fillOpacity={1} fill="url(#tempGradient)" />
                  <Line type="monotone" dataKey="feels_like" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                  <span className="text-gray-600">Temperature</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-gray-600">Feels Like</span>
                </div>
              </div>
            </div>
            {/* Humidity & Rain Probability */}
            <div className="weather-grid md:grid-cols-2">
              <div className="weather-chart">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <Droplets className="w-6 h-6 text-blue-500" />
                  Humidity Levels
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="weather-chart">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <CloudRain className="w-6 h-6 text-indigo-500" />
                  Rain Probability
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={forecast}>
                    <defs>
                      <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="rain" stroke="#3b82f6" fillOpacity={1} fill="url(#rainGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
    )}
