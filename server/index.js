import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());

const jsonFetch = async (url) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AtmosWeatherDemo/1.0' }
  });
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  return response.json();
};

app.get('/api/geocode', async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (name.length < 2) return res.status(400).json({ error: 'Enter at least two characters for a city.' });
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', name);
    url.searchParams.set('count', '8');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    const data = await jsonFetch(url);
    res.json({ results: (data.results || []).map((place) => ({
      id: place.id,
      name: place.name,
      admin1: place.admin1 || '',
      country: place.country || '',
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone || 'auto'
    })) });
  } catch (error) {
    console.error('Geocoding error:', error.message);
    res.status(502).json({ error: 'Could not search for that city right now. Please try again.' });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('current', [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'is_day', 'precipitation', 'weather_code', 'wind_speed_10m'
    ].join(','));
    url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
    url.searchParams.set('daily', [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'sunrise', 'sunset', 'uv_index_max', 'precipitation_probability_max'
    ].join(','));
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');
    const data = await jsonFetch(url);
    res.json(data);
  } catch (error) {
    console.error('Forecast error:', error.message);
    res.status(502).json({ error: 'Weather data is temporarily unavailable. Please try again.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Atmos API server running at http://localhost:${PORT}`));
