const API_KEY = "d1b0c9d1a6eab23ddfe83f83e26cde67";


async function searchCity() {

    const city = document.getElementById("cityInput").value;

    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {

        const response = await fetch(url);
        const data = await response.json();

        console.log(data);

        document.getElementById("cityName").textContent = data.name;
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

    } catch (error) {
        console.log("Error:", error);
        alert("Something went wrong. Please try again.");
    }
}

