const API_KEY = "d1b0c9d1a6eab23ddfe83f83e26cde67";



async function searchCity() {
    const city = document.getElementById("cityInput").value.trim();

    if (city === "") {
        alert("Please enter a city or village name");
        return;
    }

    try {
        // 1. Find location
        const geoUrl =
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;

        const geoResponse = await fetch(geoUrl);
        const locations = await geoResponse.json();

        if (!geoResponse.ok || locations.length === 0) {
            alert("Location not found. Try adding the district or state.");
            return;
        }

        const location = locations[0];

        const lat = location.lat;
        const lon = location.lon;

        // 2. Get current weather
        const weatherUrl =
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

        const weatherResponse = await fetch(weatherUrl);
        const data = await weatherResponse.json();

        if (!weatherResponse.ok) {
            alert("Weather data not available.");
            return;
        }

        // Current weather
        document.getElementById("cityName").textContent =
            `${location.name}${location.state ? ", " + location.state : ""}`;

        document.getElementById("temperature").textContent =
            `${Math.round(data.main.temp)}°C`;

        document.getElementById("description").textContent =
            data.weather[0].description;

        document.getElementById("humidity").textContent =
            `${data.main.humidity}%`;

        document.getElementById("windSpeed").textContent =
            `${data.wind.speed} m/s`;

        document.getElementById("feelsLike").textContent =
            `${Math.round(data.main.feels_like)}°C`;

        // 3. Get 5-day forecast
        const forecastUrl =
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            alert("5-day forecast unavailable.");
            return;
        }

        displayForecast(forecastData);

    } catch (error) {
        console.log("Error:", error);
        alert("Unable to fetch weather. Please try again.");
    }
}


function displayForecast(data) {
    const forecastContainer = document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    const dailyForecast = {};

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        if (!dailyForecast[day]) {
            dailyForecast[day] = [];
        }

        dailyForecast[day].push(item);
    });

    Object.keys(dailyForecast).slice(0, 5).forEach(day => {

        const temperatures = dailyForecast[day].map(
            item => item.main.temp
        );

        const maxTemp = Math.max(...temperatures);

        const weather = dailyForecast[day][0].weather[0];

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${day}</h3>
            <div class="forecast-icon">
                ${getWeatherEmoji(weather.main)}
            </div>
            <p>${Math.round(maxTemp)}°C</p>
            <small>${weather.description}</small>
        `;

        forecastContainer.appendChild(card);
    });
}


function getWeatherEmoji(weather) {

    if (weather === "Clear") {
        return "☀️";
    }

    if (weather === "Clouds") {
        return "☁️";
    }

    if (weather === "Rain") {
        return "🌧️";
    }

    if (weather === "Thunderstorm") {
        return "⛈️";
    }

    if (weather === "Snow") {
        return "❄️";
    }

    if (weather === "Drizzle") {
        return "🌦️";
    }

    if (weather === "Mist" || weather === "Fog") {
        return "🌫️";
    }

    return "🌤️";
}