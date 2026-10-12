# Atmos — Weather Forecast Website

A responsive weather dashboard built with React, Vite, Node.js, and Express. It shows current conditions, a six-hour outlook, sunrise/sunset, and a 7-day forecast. Users can search for a city or allow the browser to share their location.

## Features

- Current temperature, feels-like temperature, humidity, wind speed, and precipitation
- 6-hour outlook with weather icons and precipitation probability
- 7-day forecast with daily high/low temperatures and rain probability
- Sunrise, sunset, and maximum UV index
- Search by city, with a selectable list of matching locations
- Browser geolocation with a manual-search fallback
- Celsius/Fahrenheit toggle
- Responsive layout for desktop, tablet, and mobile
- Express backend that proxies requests to Open-Meteo; no API key required

## Requirements

- Node.js 18 or later (Node 20 LTS recommended)
- npm
- Internet connection

## Run locally

1. Extract the ZIP and open a terminal in the project folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the frontend and backend together:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite, usually `http://localhost:5173`.

The Express API runs at `http://localhost:4000`. Vite forwards `/api` requests to the backend during development.

## Other commands

```bash
npm run server   # API server only
npm run client   # Vite frontend only
npm run build    # Create production frontend build in dist/
npm run preview  # Preview the production frontend
```

For `npm run client`, the API server must also be running in a separate terminal.

## Location permissions

Click **Use my location** and allow the browser permission prompt. Geolocation generally requires HTTPS in production; localhost is treated as a secure context by modern browsers. If permission is denied or location is unavailable, use the city search field instead.

## Weather data and attribution

Forecasts and city geocoding are provided by [Open-Meteo](https://open-meteo.com/). Check its current terms and attribution requirements before public/commercial deployment.

## Project structure

```text
weather-forecast-website/
├── index.html
├── package.json
├── vite.config.js
├── server/
│   └── index.js
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```

## Troubleshooting

- **`npm` or `node` not found:** Install Node.js 18+ and restart the terminal.
- **Weather request fails:** Make sure both processes started, your internet is working, and the backend terminal has no errors.
- **Port already in use:** Stop the process using port 4000 or 5173, then restart.
- **Location does not work:** Use localhost, enable browser location permissions, or search manually.
- **Search returns no result:** Try the city name in English or add a more specific spelling.

## Production notes

The included Vite proxy is for development. For deployment, host the Express server and configure the frontend host/reverse proxy to route `/api/*` to it, or implement equivalent production routing. Do not expose private service credentials in frontend code. This project does not need a weather API key.
