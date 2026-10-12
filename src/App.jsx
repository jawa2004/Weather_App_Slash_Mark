import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, MapPin, LocateFixed, Wind, Droplets, Thermometer,
  Sunrise, Sunset, Sun, CloudSun, Cloud, CloudRain, CloudSnow,
  CloudLightning, CloudFog, Umbrella, Gauge, CalendarDays,
  LoaderCircle, AlertCircle, RefreshCw, Navigation
} from 'lucide-react';

const WEATHER = {
  0: ['Clear sky', Sun], 1: ['Mainly clear', CloudSun], 2: ['Partly cloudy', CloudSun],
  3: ['Overcast', Cloud], 45: ['Foggy', CloudFog], 48: ['Rime fog', CloudFog],
  51: ['Light drizzle', CloudRain], 53: ['Drizzle', CloudRain], 55: ['Heavy drizzle', CloudRain],
  56: ['Freezing drizzle', CloudRain], 57: ['Freezing drizzle', CloudRain],
  61: ['Light rain', CloudRain], 63: ['Rain', CloudRain], 65: ['Heavy rain', CloudRain],
  66: ['Freezing rain', CloudRain], 67: ['Freezing rain', CloudRain],
  71: ['Light snow', CloudSnow], 73: ['Snow', CloudSnow], 75: ['Heavy snow', CloudSnow],
  77: ['Snow grains', CloudSnow], 80: ['Rain showers', CloudRain], 81: ['Rain showers', CloudRain],
  82: ['Heavy showers', CloudRain], 85: ['Snow showers', CloudSnow], 86: ['Heavy snow showers', CloudSnow],
  95: ['Thunderstorm', CloudLightning], 96: ['Thunderstorm with hail', CloudLightning],
  99: ['Thunderstorm with hail', CloudLightning]
};
const weatherInfo = (code) => WEATHER[code] || ['Weather conditions', CloudSun];
const round = (value) => Math.round(Number(value) || 0);
const fmtTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';
const fmtDay = (value, index) => index === 0 ? 'Today' : new Date(`${value}T12:00:00`).toLocaleDateString([], { weekday: 'short' });
const placeTitle = (place) => [place.name, place.admin1 && place.admin1 !== place.name ? place.admin1 : '', place.country].filter(Boolean).join(', ');

function WeatherIcon({ code, size = 28, className = '' }) {
  const Icon = weatherInfo(code)[1];
  return <Icon size={size} strokeWidth={1.7} className={className} />;
}

function Metric({ icon: Icon, label, value, unit, note }) {
  return <div className="metric-card">
    <div className="metric-top"><span className="metric-icon"><Icon size={18} /></span><span>{label}</span></div>
    <div className="metric-value">{value}<small>{unit}</small></div>
    {note && <div className="metric-note">{note}</div>}
  </div>;
}

export default function App() {
  const [place, setPlace] = useState({ name: 'Coimbatore', admin1: 'Tamil Nadu', country: 'India', latitude: 11.0168, longitude: 76.9558 });
  const [weather, setWeather] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [unit, setUnit] = useState('C');

  const loadWeather = useCallback(async (target) => {
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/weather?latitude=${encodeURIComponent(target.latitude)}&longitude=${encodeURIComponent(target.longitude)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load weather.');
      setWeather(data);
      setPlace(target);
      setNotice('');
    } catch (e) {
      setError(e.message || 'Unable to load weather. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { loadWeather(place); }, []); // Load the starter city on first visit.

  const searchCities = async (event) => {
    event?.preventDefault();
    const value = query.trim();
    if (value.length < 2) { setError('Type at least two letters to search for a city.'); return; }
    setSearchBusy(true); setError(''); setNotice(''); setResults([]);
    try {
      const response = await fetch(`/api/geocode?name=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'City search failed.');
      if (!data.results?.length) { setError('No matching cities found. Try a different spelling.'); return; }
      if (data.results.length === 1) {
        const found = data.results[0];
        await loadWeather({ ...found, displayName: placeTitle(found) });
        setQuery('');
      } else setResults(data.results);
    } catch (e) {
      setError(e.message || 'Could not search right now.');
    } finally { setSearchBusy(false); }
  };

  const chooseCity = async (found) => {
    setResults([]);
    setQuery('');
    await loadWeather({ ...found, displayName: placeTitle(found) });
  };

  const useLocation = () => {
    setError(''); setNotice('');
    if (!navigator.geolocation) {
      setError('Your browser does not support location detection. Search for a city instead.');
      return;
    }
    setNotice('Waiting for location permission…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setNotice('Location found. Loading local weather…');
        let target = { name: 'Your location', admin1: '', country: '', latitude: coords.latitude, longitude: coords.longitude };
        try {
          const response = await fetch(`/api/geocode?name=${encodeURIComponent(`${coords.latitude},${coords.longitude}`)}`);
          const data = await response.json();
          if (response.ok && data.results?.[0]) target = { ...data.results[0], latitude: coords.latitude, longitude: coords.longitude };
        } catch { /* Coordinates are enough to retrieve weather. */ }
        await loadWeather(target);
      },
      (geoError) => {
        const message = geoError.code === 1 ? 'Location permission was denied. Allow location access in your browser, or search for a city.' :
          geoError.code === 2 ? 'Your location could not be determined. Try again or search for a city.' :
          'Location request timed out. Try again or search for a city.';
        setNotice(''); setError(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  };

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const temp = (c) => unit === 'C' ? round(c) : round((Number(c) * 9) / 5 + 32);
  const tempUnit = unit === 'C' ? '°C' : '°F';
  const currentInfo = current ? weatherInfo(current.weather_code) : ['Loading conditions', CloudSun];
  const currentTime = weather?.current?.time ? new Date(weather.current.time) : new Date();
  const hourlyItems = useMemo(() => {
    if (!hourly || !current) return [];
    const start = Math.max(0, hourly.time.findIndex((time) => time >= current.time));
    return hourly.time.slice(start, start + 6).map((time, i) => ({
      time, temperature: hourly.temperature_2m[start + i],
      chance: hourly.precipitation_probability[start + i],
      code: hourly.weather_code[start + i]
    }));
  }, [hourly, current]);

  return <main className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="dashboard">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Atmos home"><span className="brand-mark"><CloudSun size={25} /></span><span>atmos<span className="brand-dot">.</span><small>WEATHER, REIMAGINED</small></span></a>
        <div className="topbar-right"><span className="live-dot" /> LIVE FORECAST <span className="top-divider" /> <span className="local-date">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
      </header>

      <section className="intro-row">
        <div><p className="eyebrow">YOUR DAILY WEATHER BRIEFING</p><h1>Forecast at a <span>glance.</span></h1><p className="subtitle">A little clarity for whatever the day brings.</p></div>
        <form className="search-form" onSubmit={searchCities}>
          <Search size={19} className="search-icon" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setResults([]); }} placeholder="Search city or town…" aria-label="Search city or town" />
          <button type="submit" disabled={searchBusy} aria-label="Search city">{searchBusy ? <LoaderCircle className="spin" size={19} /> : <Search size={18} />}</button>
          {results.length > 0 && <div className="search-results">{results.map((item) => <button type="button" key={item.id} onClick={() => chooseCity(item)}><MapPin size={16} /><span><strong>{item.name}</strong><small>{[item.admin1, item.country].filter(Boolean).join(', ')}</small></span><span className="result-arrow">↗</span></button>)}</div>}
        </form>
      </section>

      {(error || notice) && <div className={`message ${error ? 'message-error' : 'message-notice'}`} role="status"><AlertCircle size={17} /><span>{error || notice}</span>{error && <button onClick={() => setError('')} aria-label="Dismiss message">×</button>}</div>}

      <section className="hero-grid">
        <div className="current-card">
          <div className="card-orb orb-a" /><div className="card-orb orb-b" />
          <div className="current-card-top"><div className="location-label"><MapPin size={16} /><span>{place.displayName || placeTitle(place)}</span></div><button className="location-button" onClick={useLocation} title="Use my current location"><LocateFixed size={17} /><span>Use my location</span></button></div>
          <div className="current-main">
            <div className="current-reading"><p className="current-label">CURRENT WEATHER</p><div className="temperature">{current ? temp(current.temperature_2m) : '—'}<span>{tempUnit}</span></div><div className="condition">{currentInfo[0]}</div><div className="feels-like">Feels like {current ? `${temp(current.apparent_temperature)}${tempUnit}` : '—'}</div></div>
            <div className="hero-weather-icon"><WeatherIcon code={current?.weather_code ?? 1} size={112} /></div>
          </div>
          <div className="hero-footer"><span><span className="tiny-pulse" /> {current ? 'Updated just now' : 'Connecting to forecast'}</span><button onClick={() => loadWeather(place)} disabled={busy} aria-label="Refresh weather"><RefreshCw size={15} className={busy ? 'spin' : ''} /> Refresh</button></div>
        </div>

        <div className="side-panel">
          <div className="panel-heading"><div><p className="eyebrow">RIGHT NOW</p><h2>Conditions</h2></div><span className="heading-icon"><Sun size={18} /></span></div>
          <div className="metric-grid">
            <Metric icon={Thermometer} label="Feels like" value={current ? temp(current.apparent_temperature) : '—'} unit={tempUnit} note="Perceived temperature" />
            <Metric icon={Droplets} label="Humidity" value={current?.relative_humidity_2m ?? '—'} unit="%" note="Relative humidity" />
            <Metric icon={Wind} label="Wind speed" value={current ? round(current.wind_speed_10m) : '—'} unit=" km/h" note="Near-surface wind" />
            <Metric icon={Umbrella} label="Precipitation" value={current ? Number(current.precipitation).toFixed(1) : '—'} unit=" mm" note="Current amount" />
          </div>
          <div className="unit-toggle"><span>Temperature unit</span><div><button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>°C</button><button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>°F</button></div></div>
        </div>
      </section>

      <section className="content-grid">
        <div className="section-card hourly-card">
          <div className="section-title"><div><p className="eyebrow">THE NEXT FEW HOURS</p><h2>Hourly outlook</h2></div><span className="section-icon"><CalendarDays size={18} /></span></div>
          <div className="hourly-list">{hourlyItems.length ? hourlyItems.map((item, i) => <div className={`hour-item ${i === 0 ? 'hour-now' : ''}`} key={item.time}><span className="hour-time">{i === 0 ? 'Now' : fmtTime(item.time)}</span><WeatherIcon code={item.code} size={25} className="hour-weather" /><strong>{temp(item.temperature)}°</strong><span className="hour-rain"><Droplets size={12} /> {item.chance ?? 0}%</span></div>) : <div className="empty-state">{busy ? 'Loading hourly forecast…' : 'Hourly forecast will appear here.'}</div>}</div>
          <p className="card-footnote">Chance of precipitation shown below each hour.</p>
        </div>

        <div className="section-card sun-card">
          <div className="section-title"><div><p className="eyebrow">DAYLIGHT</p><h2>Sun & sky</h2></div><span className="section-icon"><Sunrise size={18} /></span></div>
          <div className="sun-times">
            <div className="sun-time-row"><span className="sun-symbol sunrise"><Sunrise size={23} /></span><div><small>SUNRISE</small><strong>{daily ? fmtTime(daily.sunrise[0]) : '—'}</strong></div><span className="sun-side-note">Start fresh</span></div>
            <div className="sun-track"><span /></div>
            <div className="sun-time-row"><span className="sun-symbol sunset"><Sunset size={23} /></span><div><small>SUNSET</small><strong>{daily ? fmtTime(daily.sunset[0]) : '—'}</strong></div><span className="sun-side-note">Golden hour</span></div>
          </div>
          <div className="sun-extra"><div><Gauge size={16} /><span>Max UV index</span><strong>{daily ? Number(daily.uv_index_max[0]).toFixed(1) : '—'}</strong></div><div><Droplets size={16} /><span>Rain chance</span><strong>{daily ? `${daily.precipitation_probability_max[0] ?? 0}%` : '—'}</strong></div></div>
        </div>
      </section>

      <section className="section-card forecast-card">
        <div className="section-title forecast-heading"><div><p className="eyebrow">PLAN AHEAD</p><h2>7-day forecast</h2><p className="section-subtitle">A snapshot of the week ahead.</p></div><span className="forecast-badge"><CalendarDays size={15} /> 7 DAYS</span></div>
        <div className="forecast-list">{daily ? daily.time.map((day, index) => {
          const [label] = weatherInfo(daily.weather_code[index]);
          return <div className={`forecast-row ${index === 0 ? 'forecast-today' : ''}`} key={day}>
            <div className="forecast-day">{fmtDay(day, index)}{index === 0 && <span className="today-pill">TODAY</span>}</div>
            <div className="forecast-condition"><WeatherIcon code={daily.weather_code[index]} size={25} /><span>{label}</span></div>
            <div className="forecast-rain"><Droplets size={14} /> {daily.precipitation_probability_max[index] ?? 0}%</div>
            <div className="forecast-range"><span>{temp(daily.temperature_2m_min[index])}°</span><div className="range-track"><i style={{ left: `${Math.max(0, Math.min(80, (daily.temperature_2m_min[index] - Math.min(...daily.temperature_2m_min)) / Math.max(1, Math.max(...daily.temperature_2m_max) - Math.min(...daily.temperature_2m_min)) * 100))}%`, width: `${Math.max(12, (daily.temperature_2m_max[index] - daily.temperature_2m_min[index]) / Math.max(1, Math.max(...daily.temperature_2m_max) - Math.min(...daily.temperature_2m_min)) * 100)}%` }} /></div><span>{temp(daily.temperature_2m_max[index])}°</span></div>
          </div>;
        }) : <div className="empty-state">{busy ? 'Loading your 7-day forecast…' : 'Forecast data will appear here.'}</div>}</div>
      </section>

      <footer className="footer"><div className="footer-brand"><CloudSun size={19} /><strong>atmos<span>.</span></strong></div><span>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span><span className="footer-note">Look up. Step out. Feel prepared.</span></footer>
    </div>
  </main>;
}
