/*----------------------Disable Inspect----------------------*/

document.addEventListener('contextmenu', e => e.preventDefault());
  document.onkeydown = function(e) {
    if (e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
      return false;
    }
  };

/*--------------------Disable Copying Text--------------------*/

  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'u')) {
        e.preventDefault();
    }
});
  
  document.addEventListener('DOMContentLoaded', () => {


/*-------------------NavBar Toggle-------------------*/

  const themeToggle = document.getElementById('themeToggle');

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = '🌞';
  } else {
    themeToggle.textContent = '🌙';
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggle.textContent = isLight ? '🌞' : '🌙';
  });


/*-------------------Search Button-------------------*/  
  
    document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  if (city) {
    getCoordinates(city);
  }
});

function getCoordinates(city) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;

        // Show city name in location
        document.getElementById("location").textContent = `📍 ${data[0].display_name}`;
        document.getElementById("time").textContent = `🕒 ${new Date().toLocaleString()}`;

        // Call your existing weather fetch function
        fetchWeather(lat, lon);
      } else {
        alert("❌ City not found.");
      }
    })
    .catch(() => {
      alert("❌ Error getting location.");
    });
}

  /*-------------------UpperLeft(Location and Time-------------------*/

  const timeElement = document.getElementById('time');
  const updateTime = () => {
    const now = new Date();
    timeElement.textContent = "⏰ Current Time: " + now.toLocaleTimeString();
  };
  updateTime();
  setInterval(updateTime, 1000);

  const locationElement = document.getElementById('location');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            const city = data.address.city || data.address.town || data.address.village || "Unknown location";
            locationElement.textContent = "📡 Location: " + city;
            fetchWeather(latitude, longitude);
          })
          .catch(() => {
            locationElement.textContent = "Location: Unable to detect city";
          });
      },
      error => {
        locationElement.textContent = "Location access denied.";
      }
    );
  } else {
    locationElement.textContent = "Geolocation not supported.";
  }

/*-------------------UpperRight(Calender)-------------------*/

  const calendar = document.getElementById("calendar");
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function generateCalendar(month, year) {
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHTML = `<div class="calendar-header">${monthNames[month]} ${year}</div>`;
    calendarHTML += `<div class="calendar-grid">
      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
    `;

    for (let i = 0; i < firstDay; i++) {
      calendarHTML += `<div class="empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      calendarHTML += `<div class="day${isToday ? ' today' : ''}">${day}</div>`;
    }

    calendarHTML += `</div>`;
    calendar.innerHTML = calendarHTML;
  }

  generateCalendar(currentMonth, currentYear);

/*-------------------Weather Dashboard-------------------*/

  let hourlyChart, dailyChart;

  const weatherCodeMap = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️',
    51: '🌧️', 61: '🌦️', 80: '🌧️', 95: '⛈️'
  };

  function fetchWeather(lat, lon) {
    const api = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

    fetch(api)
      .then(res => res.json())
      .then(data => {
        renderHourly(data.hourly);
        renderDailyCards(data.daily, data.hourly);
        renderHourlyForDay(data.hourly, data.daily.time[0], new Date(data.daily.time[0]).toLocaleDateString('en-US', { weekday: 'short' }));
        renderTodayHighlights(data.daily, 0); // ✅ FIXED: Now inside this block
      });
  }

  function renderHourly(hourly) {
    const hours = hourly.time.slice(0, 12).map(t => t.split('T')[1]);
    const temps = hourly.temperature_2m.slice(0, 12);

    if (hourlyChart) hourlyChart.destroy();
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    hourlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Temp (°C)',
          data: temps,
          borderColor: '#eaffba',
          backgroundColor: 'rgba(235, 255, 161, 0.2)',
          fill: true
        }]
      }
    });
  }

  function renderDailyCards(daily, hourly) {
    const weekCards = document.getElementById('weekCards');
    weekCards.innerHTML = '';

    daily.time.forEach((date, i) => {
      const dayObj = new Date(date);
      const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayDate = dayObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const icon = weatherCodeMap[daily.weathercode[i]] || '❓';

      const card = document.createElement('div');
      card.className = 'day-card';
      card.innerHTML = `
        <p><strong>${dayName}</strong> (${dayDate})</p>
        <p style="font-size: 1.5rem;">${icon}</p>
        <p>${daily.temperature_2m_max[i]}° / ${daily.temperature_2m_min[i]}°</p>
      `;
      card.onclick = () => renderHourlyForDay(hourly, date, `${dayName} (${dayDate})`);
      weekCards.appendChild(card);
    });
  }

  function renderHourlyForDay(hourly, selectedDate, labelDay) {
    const filtered = hourly.time
      .map((time, i) => {
        if (time.startsWith(selectedDate)) {
          return { hour: time.split('T')[1], temp: hourly.temperature_2m[i] };
        }
        return null;
      })
      .filter(Boolean);

    const labels = filtered.map(e => e.hour);
    const temps = filtered.map(e => e.temp);

    if (dailyChart) dailyChart.destroy();
    const ctx = document.getElementById('dailyChart').getContext('2d');
    dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Hourly Temp for ${labelDay}`,
          data: temps,
          borderColor: '#455ae0ff',
          backgroundColor: 'rgba(72, 103, 199, 0.2)',
          fill: true,
          tension: 0.4
        }]
      }
    });
  }

  function renderTodayHighlights(daily, i) {
    const container = document.querySelector('#todayHighlights .highlight-cards');
    const icon = weatherCodeMap[daily.weathercode[i]] || '❓';

    container.innerHTML = `
      <div class="highlight-card">
        <p>🌡️ Max Temp</p>
        <p>${daily.temperature_2m_max[i]} °C</p>
      </div>
      <div class="highlight-card">
        <p>🌡️ Min Temp</p>
        <p>${daily.temperature_2m_min[i]} °C</p>
      </div>
      <div class="highlight-card">
        <p>🌤️ Condition</p>
        <p>${icon}</p>
      </div>
      <div class="highlight-card">
        <p>📅 Date</p>
        <p>${new Date(daily.time[i]).toLocaleDateString()}</p>
      </div>
    `;
  }

/*-------------------Tabs( Today | Week )-------------------*/

  const todayBtn = document.querySelector('#todayBtn');
  const weekBtn = document.querySelector('#weekBtn');
  const todayTab = document.querySelector('#today');
  const weekTab = document.querySelector('#week');

  if (todayBtn && weekBtn) {
    todayBtn.addEventListener('click', () => {
      todayTab.style.display = 'block';
      weekTab.style.display = 'none';
    });

    weekBtn.addEventListener('click', () => {
      todayTab.style.display = 'none';
      weekTab.style.display = 'block';
    });

    todayBtn.click(); 
  }

});







