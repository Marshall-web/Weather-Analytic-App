import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  Calendar,
  Cloud,
  CloudRain,
  Droplets,
  Gauge,
  MapPin,
  Search,
  Sparkles,
  Sun,
  Thermometer,
  TrendingUp,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const weatherCodes = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
};

function getWeatherDescription(code) {
  return weatherCodes[code] || 'Mixed conditions';
}

function getWeatherMain(description) {
  const value = description.toLowerCase();
  if (value.includes('rain') || value.includes('shower') || value.includes('drizzle')) return 'Rain';
  if (value.includes('cloud') || value.includes('overcast') || value.includes('fog')) return 'Clouds';
  if (value.includes('snow')) return 'Snow';
  if (value.includes('thunder')) return 'Storm';
  return 'Clear';
}

function WeatherIcon({ condition }) {
  const main = condition?.toLowerCase() || '';

  if (main.includes('rain') || main.includes('storm')) {
    return <CloudRain className="condition-icon condition-icon-rain" aria-hidden="true" />;
  }

  if (main.includes('cloud') || main.includes('snow')) {
    return <Cloud className="condition-icon condition-icon-cloud" aria-hidden="true" />;
  }

  return <Sun className="condition-icon condition-icon-sun" aria-hidden="true" />;
}

function formatWind(speed) {
  return `${speed.toFixed(1)} m/s`;
}

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
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
      );

      if (!geoResponse.ok) throw new Error('City not found');

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }

      const bestMatch =
        geoData.results.find((result) => result.feature_code === 'PPLC') ||
        geoData.results.find((result) => result.feature_code === 'PPLA') ||
        geoData.results[0];

      const { latitude, longitude, name, country } = bestMatch;

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability&timezone=auto&forecast_days=2`
      );

      if (!weatherResponse.ok) throw new Error('Unable to fetch weather data');

      const weatherResult = await weatherResponse.json();
      const current = weatherResult.current;
      const description = getWeatherDescription(current.weather_code);
      const main = getWeatherMain(description);

      const transformedData = {
        name: `${name}${country ? `, ${country}` : ''}`,
        main: {
          temp: current.temperature_2m,
          feels_like: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          pressure: current.surface_pressure,
        },
        weather: [
          {
            main,
            description: description.toLowerCase(),
          },
        ],
        wind: {
          speed: current.wind_speed_10m / 3.6,
        },
      };

      const currentHourIndex = weatherResult.hourly.time.findIndex(
        (time) => time >= current.time
      );
      const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;

      const processedForecast = weatherResult.hourly.time
        .slice(startIndex, startIndex + 12)
        .map((time, index) => {
          const dataIndex = startIndex + index;

          return {
            time: new Date(time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              hour12: true,
            }),
            temp: Math.round(weatherResult.hourly.temperature_2m[dataIndex]),
            feels_like: Math.round(weatherResult.hourly.apparent_temperature[dataIndex]),
            humidity: weatherResult.hourly.relative_humidity_2m[dataIndex],
            rain: weatherResult.hourly.precipitation_probability[dataIndex] || 0,
          };
        });

      setWeatherData(transformedData);
      setLocation(transformedData.name);
      setForecast(processedForecast);
    } catch (err) {
      setError('Unable to fetch weather data. Try another city or check your connection.');
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

  const recommendations = useMemo(() => {
    if (!weatherData) return [];

    const temp = weatherData.main.temp;
    const condition = weatherData.weather[0].main.toLowerCase();
    const notes = [];

    if (temp < 10) notes.push('Layer up with a warm jacket.');
    else if (temp < 20) notes.push('A light jacket should feel comfortable.');
    else notes.push('Great window for outdoor plans.');

    if (condition.includes('rain') || condition.includes('storm')) {
      notes.push('Keep an umbrella close today.');
    }

    if (weatherData.main.humidity > 70) {
      notes.push('Humidity is high, so hydrate often.');
    }

    if (weatherData.wind.speed > 10) {
      notes.push('Expect stronger wind gusts outside.');
    }

    return notes;
  }, [weatherData]);

  useEffect(() => {
    fetchWeather('London');
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main className="app-shell">
      <section
        className="hero-section"
        style={{ '--hero-image': `url(${process.env.PUBLIC_URL}/weather.webp)` }}
      >
        <div className="hero-content">
          <div className="brand-row">
            <span className="brand-mark">
              <Cloud aria-hidden="true" />
            </span>
            <span>Weather Analytics</span>
          </div>

          <div className="hero-copy">
            <p className="eyebrow">Live atmospheric dashboard</p>
            <h1>Plan your day with weather that feels clear at a glance.</h1>
          </div>

          <div className="search-panel" role="search">
            <MapPin className="search-location-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
              placeholder="Search city, region, or capital"
              aria-label="Search for a city"
            />
            <button onClick={handleSearch} type="button" aria-label="Search weather">
              <Search aria-hidden="true" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {weatherData && (
          <aside className="current-weather-panel" aria-label="Current weather">
            <div className="panel-topline">
              <span className="status-pill">Now</span>
              <WeatherIcon condition={weatherData.weather[0].main} />
            </div>
            <p className="current-location">{location}</p>
            <div className="temperature-row">
              <span>{Math.round(weatherData.main.temp)}</span>
              <sup>C</sup>
            </div>
            <p className="condition-copy">{weatherData.weather[0].description}</p>
            <p className="date-copy">
              <Calendar aria-hidden="true" />
              {currentDate}
            </p>
          </aside>
        )}
      </section>

      <section className="dashboard-section">
        {error && <div className="weather-error">{error}</div>}

        {loading ? (
          <div className="loading-state" aria-live="polite">
            <div className="spinner" />
            <p>Loading weather data...</p>
          </div>
        ) : weatherData ? (
          <>
            <div className="metric-grid">
              <article className="metric-card primary-metric">
                <div className="metric-icon">
                  <Thermometer aria-hidden="true" />
                </div>
                <p>Feels like</p>
                <strong>{Math.round(weatherData.main.feels_like)} C</strong>
                <span>Compared with {Math.round(weatherData.main.temp)} C actual</span>
              </article>

              <article className="metric-card">
                <div className="metric-icon">
                  <Wind aria-hidden="true" />
                </div>
                <p>Wind</p>
                <strong>{formatWind(weatherData.wind.speed)}</strong>
                <span>Current surface wind speed</span>
              </article>

              <article className="metric-card">
                <div className="metric-icon">
                  <Droplets aria-hidden="true" />
                </div>
                <p>Humidity</p>
                <strong>{weatherData.main.humidity}%</strong>
                <span>Moisture in the air</span>
              </article>

              <article className="metric-card">
                <div className="metric-icon">
                  <Gauge aria-hidden="true" />
                </div>
                <p>Pressure</p>
                <strong>{Math.round(weatherData.main.pressure)} hPa</strong>
                <span>Surface pressure reading</span>
              </article>
            </div>

            <div className="content-grid">
              <section className="chart-panel wide-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Next 12 hours</p>
                    <h2>Temperature trend</h2>
                  </div>
                  <TrendingUp aria-hidden="true" />
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={forecast} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef7d4d" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef7d4d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 8" stroke="#d9e2ea" vertical={false} />
                    <XAxis dataKey="time" stroke="#637083" tickLine={false} axisLine={false} />
                    <YAxis stroke="#637083" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d9e2ea' }} />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="#ef7d4d"
                      strokeWidth={3}
                      fill="url(#tempGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="feels_like"
                      stroke="#256f8f"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <div className="chart-legend">
                  <span><i className="legend-dot temp-dot" />Temperature</span>
                  <span><i className="legend-dot feels-dot" />Feels like</span>
                </div>
              </section>

              <section className="recommendation-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Smart notes</p>
                    <h2>Today&apos;s guidance</h2>
                  </div>
                  <Sparkles aria-hidden="true" />
                </div>

                <div className="recommendation-list">
                  {recommendations.map((recommendation) => (
                    <p key={recommendation}>{recommendation}</p>
                  ))}
                </div>
              </section>

              <section className="chart-panel">
                <div className="section-heading compact-heading">
                  <h2>Humidity</h2>
                  <Droplets aria-hidden="true" />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={forecast} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 8" stroke="#d9e2ea" vertical={false} />
                    <XAxis dataKey="time" stroke="#637083" tickLine={false} axisLine={false} />
                    <YAxis stroke="#637083" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d9e2ea' }} />
                    <Line type="monotone" dataKey="humidity" stroke="#256f8f" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              <section className="chart-panel">
                <div className="section-heading compact-heading">
                  <h2>Rain chance</h2>
                  <CloudRain aria-hidden="true" />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={forecast} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2f9b84" stopOpacity={0.36} />
                        <stop offset="95%" stopColor="#2f9b84" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 8" stroke="#d9e2ea" vertical={false} />
                    <XAxis dataKey="time" stroke="#637083" tickLine={false} axisLine={false} />
                    <YAxis stroke="#637083" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d9e2ea' }} />
                    <Area
                      type="monotone"
                      dataKey="rain"
                      stroke="#2f9b84"
                      strokeWidth={3}
                      fill="url(#rainGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
