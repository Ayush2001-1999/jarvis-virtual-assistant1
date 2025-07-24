const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const API_KEY = "b3eff18950185e977e38c02e184fd0ce";

app.use(cors());

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Country-to-city fallback mapping
const countryToCapital = {
  India: "New Delhi",
  USA: "Washington",
  UnitedStates: "Washington",
  "United States": "Washington",
  France: "Paris",
  Germany: "Berlin",
  Japan: "Tokyo",
  Canada: "Ottawa",
  China: "Beijing",
  Russia: "Moscow",
  Australia: "Canberra",
  Brazil: "Brasília",
  Italy: "Rome",
  UK: "London",
  "United Kingdom": "London",
  Spain: "Madrid",
  Mexico: "Mexico City",
  Argentina: "Buenos Aires",
  Egypt: "Cairo",
  SouthAfrica: "Pretoria",
  "South Africa": "Pretoria"
};

app.get("/weather", async (req, res) => {
  let location = req.query.location;
  if (!location) {
    return res.status(400).json({ error: "Missing location parameter" });
  }

  // Clean and map country to default city if available
  location = location.trim();
  const mappedLocation = countryToCapital[location] || location;

  try {
    // Step 1: Get coordinates from mapped location
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(mappedLocation)}&limit=1&appid=${API_KEY}`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.length) {
      return res.status(404).json({ error: "Location not found" });
    }

    const { lat, lon, name: cityName } = geoData[0];

    // Step 2: Get hourly forecast using forecast API
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    console.log("ForecastData:", forecastData);

    if (!forecastData.list) {
      return res.status(500).json({ error: "Forecast data not available" });
    }

    const hourlyForecast = forecastData.list.slice(0, 6).map(entry => ({
      time: entry.dt_txt,
      temp: entry.main.temp,
      description: entry.weather[0].description,
      icon: entry.weather[0].icon
    }));

    res.json({ city: cityName, hourlyForecast });
  } catch (error) {
    console.error("Error fetching hourly forecast:", error);
    res.status(500).json({ error: "Failed to fetch hourly weather" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
