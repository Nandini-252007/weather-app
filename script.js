// SkyCast student project: accounts, roles, and search history use browser Local Storage.
const API_KEY = "d1b0c9d1a6eab23ddfe83f83e26cde67";
const USERS_KEY = "skycast_users_v1";
const SESSION_KEY = "skycast_session_v1";
const HISTORY_KEY = "skycast_searches_v1";

const byId = (id) => document.getElementById(id);
let currentUser = null;

function showAlert(message, type = "success") {
  let container = byId("alertContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "alertContainer";
    container.className = "alert-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
  }

  const alert = document.createElement("div");
  alert.className = `app-alert ${type}`;
  alert.setAttribute("role", type === "error" ? "alert" : "status");
  alert.innerHTML = `<span>${escapeHtml(message)}</span><button type="button" aria-label="Dismiss notification">×</button>`;
  container.appendChild(alert);

  const dismiss = () => alert.remove();
  alert.querySelector("button").addEventListener("click", dismiss);
  window.setTimeout(dismiss, 4500);
}

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initializeDemoAdmin() {
  const users = readStorage(USERS_KEY, []);

  if (!users.some((user) => user.role === "admin")) {
    users.push({
      id: "skycast-demo-admin",
      name: "Weather Admin",
      email: "admin@skycast.demo",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString()
    });

    saveStorage(USERS_KEY, users);
  }
}

function setAuthTab(tab) {
  const loginSelected = tab === "login";

  byId("loginForm").classList.toggle("hidden", !loginSelected);
  byId("signupForm").classList.toggle("hidden", loginSelected);
  byId("loginTab").classList.toggle("active", loginSelected);
  byId("signupTab").classList.toggle("active", !loginSelected);
  byId("loginTab").setAttribute("aria-selected", String(loginSelected));
  byId("signupTab").setAttribute("aria-selected", String(!loginSelected));
  byId("authMessage").textContent = "";
}

function showAuth(message = "") {
  currentUser = null;
  saveStorage(SESSION_KEY, null);

  byId("authView").classList.remove("hidden");
  byId("userView").classList.add("hidden");
  byId("adminView").classList.add("hidden");
  byId("mainNav").innerHTML = "";
  byId("authMessage").textContent = message;
}

function enterAsGuest() {
  currentUser = null;
  saveStorage(SESSION_KEY, null);

  byId("authView").classList.add("hidden");
  byId("userView").classList.remove("hidden");
  byId("adminView").classList.add("hidden");
  byId("userDisplayName").textContent = "Guest";

  byId("mainNav").innerHTML = `
    <span class="nav-user">Guest access</span>
    <button class="button" id="accountButton" type="button">Log in / Sign up</button>
  `;

  byId("accountButton").addEventListener("click", () => {
    byId("authView").classList.remove("hidden");
    byId("userView").classList.add("hidden");
    byId("mainNav").innerHTML = "";
    setAuthTab("login");
  });

  renderRecentSearches();
}

function openModule(user) {
  currentUser = user;
  saveStorage(SESSION_KEY, user.id);

  byId("authView").classList.add("hidden");
  byId("userView").classList.toggle("hidden", user.role !== "user");
  byId("adminView").classList.toggle("hidden", user.role !== "admin");

  byId("mainNav").innerHTML = `
    ${
      user.role === "user"
        ? '<a class="nav-link active" href="#dashboard">Dashboard</a>'
        : '<a class="nav-link active" href="#admin">Admin panel</a>'
    }
    <span class="nav-user">${escapeHtml(user.name)}</span>
    <button class="button" id="logoutButton" type="button">Log out</button>
  `;

  byId("logoutButton").addEventListener("click", () => {
    showAuth("You have logged out.");
    showAlert("You have logged out.");
  });

  if (user.role === "user") {
    byId("userDisplayName").textContent = user.name;
    renderRecentSearches();
  } else {
    renderAdminDashboard();
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function signup(event) {
  event.preventDefault();

  const name = byId("signupName").value.trim();
  const email = byId("signupEmail").value.trim().toLowerCase();
  const password = byId("signupPassword").value;
  const users = readStorage(USERS_KEY, []);

  if (users.some((user) => user.email === email)) {
    byId("authMessage").textContent =
      "An account with that email already exists. Log in instead.";
    showAlert("An account with that email already exists.", "error");
    return;
  }

  const user = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    email,
    password,
    role: "user",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveStorage(USERS_KEY, users);
  saveStorage(HISTORY_KEY, {
    ...readStorage(HISTORY_KEY, {}),
    [user.id]: []
  });

  byId("signupForm").reset();
  openModule(user);
  showAlert(`Welcome to SkyCast, ${name}!`);
}

function login(event) {
  event.preventDefault();

  const email = byId("loginEmail").value.trim().toLowerCase();
  const password = byId("loginPassword").value;
  const users = readStorage(USERS_KEY, []);
  const user = users.find(
    (entry) => entry.email === email && entry.password === password
  );

  if (!user) {
    byId("authMessage").textContent =
      "Email or password is incorrect. Please try again.";
    showAlert("Email or password is incorrect.", "error");
    return;
  }

  byId("loginForm").reset();
  openModule(user);
  showAlert(`Welcome back, ${user.name}!`);
}

function renderAdminDashboard() {
  const users = readStorage(USERS_KEY, []);
  const history = readStorage(HISTORY_KEY, {});
  const searches = Object.values(history).reduce(
    (sum, list) => sum + list.length,
    0
  );

  byId("userCount").textContent =
    users.filter((user) => user.role === "user").length;

  byId("searchCount").textContent = searches;

  byId("usersTable").innerHTML = users.map((user) => {
    const recent = (history[user.id] || [])[0];
    const lastSearch = recent
      ? `${escapeHtml(recent.city)} · ${new Date(recent.at).toLocaleDateString()}`
      : "No searches yet";

    return `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${lastSearch}</td>
        <td>
          <span class="role-badge ${user.role}">
            ${escapeHtml(user.role)}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

function getUserHistory() {
  if (!currentUser) {
    return [];
  }

  const history = readStorage(HISTORY_KEY, {});
  return history[currentUser.id] || [];
}

function addSearch(city) {
  if (!currentUser) {
    return;
  }

  const history = readStorage(HISTORY_KEY, {});
  const searches = history[currentUser.id] || [];

  history[currentUser.id] = [
    { city, at: new Date().toISOString() },
    ...searches.filter(
      (entry) => entry.city.toLowerCase() !== city.toLowerCase()
    )
  ].slice(0, 5);

  saveStorage(HISTORY_KEY, history);
  renderRecentSearches();
}

function renderRecentSearches() {
  const searches = getUserHistory();
  const container = byId("recentSearches");

  container.innerHTML = searches.length
    ? searches.map((entry) => `
        <button
          class="recent-chip"
          type="button"
          data-city="${escapeHtml(entry.city)}"
        >
          ${escapeHtml(entry.city)}
        </button>
      `).join("")
    : '<p class="muted">Your searches will appear here.</p>';

  container.querySelectorAll("[data-city]").forEach((button) => {
    button.addEventListener("click", () => {
      loadWeather(button.dataset.city);
    });
  });
}

async function loadWeather(city) {
  const normalizedCity = city.trim();

  if (!normalizedCity) {
    byId("weatherMessage").textContent = "Please enter a city name.";
    showAlert("Please enter a city name.", "error");
    return;
  }

  byId("weatherMessage").classList.remove("success");
  byId("weatherMessage").textContent = "Looking up current weather…";

  try {
    const geoUrl =
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(normalizedCity)}&limit=1&appid=${API_KEY}`;

    const geoResponse = await fetch(geoUrl);
    const locations = await geoResponse.json();

    if (!geoResponse.ok || !locations.length) {
      throw new Error("Location not found. Try another city name.");
    }

    const location = locations[0];
    const query =
      `lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`;

    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${query}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}`)
    ]);

    const [weatherData, forecastData] = await Promise.all([
      weatherResponse.json(),
      forecastResponse.json()
    ]);

    if (!weatherResponse.ok) {
      throw new Error(
        weatherData.message || "Current weather is unavailable."
      );
    }

    if (!forecastResponse.ok) {
      throw new Error(
        forecastData.message || "The five-day forecast is unavailable."
      );
    }

    byId("cityName").textContent =
      `${location.name}${location.state ? `, ${location.state}` : ""}`;

    byId("weatherLocation").textContent = location.country
      ? `CURRENT CONDITIONS · ${location.country}`
      : "CURRENT CONDITIONS";

    byId("temperature").textContent =
      `${Math.round(weatherData.main.temp)}°`;

    byId("description").textContent =
      weatherData.weather[0].description;

    byId("weatherIcon").textContent =
      getWeatherEmoji(weatherData.weather[0].main);

    byId("humidity").textContent =
      `${weatherData.main.humidity}%`;

    byId("windSpeed").textContent =
      `${weatherData.wind.speed} m/s`;

    byId("feelsLike").textContent =
      `${Math.round(weatherData.main.feels_like)}°`;

    displayForecast(forecastData);
    addSearch(normalizedCity);

    byId("weatherMessage").textContent = "Weather updated.";
    byId("weatherMessage").classList.add("success");
    showAlert(`Weather updated for ${location.name}.`);
  } catch (error) {
    byId("weatherMessage").textContent =
      error.message || "Unable to fetch weather. Check your connection and try again.";
    showAlert(
      error.message || "Unable to fetch weather. Please try again.",
      "error"
    );
  }
}

function displayForecast(data) {
  const daily = new Map();

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const key = date.toISOString().slice(0, 10);

    if (!daily.has(key)) {
      daily.set(key, []);
    }

    daily.get(key).push(item);
  });

  byId("forecast").innerHTML = [...daily.entries()]
    .slice(0, 5)
    .map(([key, items]) => {
      const noon = items.reduce((best, item) => {
        const itemHour = new Date(item.dt * 1000).getHours();
        const bestHour = new Date(best.dt * 1000).getHours();

        return Math.abs(itemHour - 12) < Math.abs(bestHour - 12)
          ? item
          : best;
      }, items[0]);

      const day = new Date(`${key}T12:00:00`).toLocaleDateString(
        "en-US",
        { weekday: "short" }
      );

      const high = Math.round(
        Math.max(...items.map((item) => item.main.temp_max))
      );

      const low = Math.round(
        Math.min(...items.map((item) => item.main.temp_min))
      );

      const condition = noon.weather[0];

      return `
        <article class="forecast-card">
          <h3>${day}</h3>
          <div class="forecast-icon" aria-hidden="true">
            ${getWeatherEmoji(condition.main)}
          </div>
          <p>${high}° <span class="muted">${low}°</span></p>
          <small>${escapeHtml(condition.description)}</small>
        </article>
      `;
    })
    .join("");
}

function getWeatherEmoji(condition) {
  const icons = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Drizzle: "🌦️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️"
  };

  return icons[condition] || "🌤️";
}

byId("loginTab").addEventListener("click", () => setAuthTab("login"));
byId("signupTab").addEventListener("click", () => setAuthTab("signup"));
byId("guestButton").addEventListener("click", enterAsGuest);
byId("loginForm").addEventListener("submit", login);
byId("signupForm").addEventListener("submit", signup);

byId("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  loadWeather(byId("cityInput").value);
});

initializeDemoAdmin();

const savedId = readStorage(SESSION_KEY, null);
const savedUser = readStorage(USERS_KEY, []).find(
  (user) => user.id === savedId
);

if (savedUser) {
  openModule(savedUser);
}
     

       
   

        

       
   
   
