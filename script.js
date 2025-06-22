let pollutantChart = null;

async function fetchData() {
  const location = document.getElementById('location').value.trim();
  const errorMessage = document.getElementById('error-message');
  const dataContainer = document.getElementById('data-container');
  const temperatureElem = document.getElementById('temperature');
  const statusText = document.getElementById('status-text');
  const airStatusElem = document.getElementById('air-status');

  errorMessage.textContent = '';
  dataContainer.style.display = 'none';
  temperatureElem.textContent = '';
  statusText.textContent = '';

  if (!location || !/^[a-zA-Z\s]+$/.test(location)) {
    errorMessage.textContent = 'Please enter a valid location using letters only.';
    return;
  }

  try {
    const apiKey = '8e9068bccebc50945fab73e3708a53a6'; // Your OpenWeatherMap API key

    // Fetch geo coordinates for the location
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`);
    if (!geoRes.ok) throw new Error('Location not found.');
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error('Location not found.');

    const { lat, lon } = geoData[0];

    // Fetch air pollution data & weather temperature
    const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    if (!airRes.ok || !weatherRes.ok) throw new Error('Failed to fetch air or weather data.');

    const airData = await airRes.json();
    const weatherData = await weatherRes.json();

    // Show temperature
    temperatureElem.textContent = weatherData.main.temp.toFixed(2) + ' °C';

    // Process air pollution data
    const components = airData.list[0].components;
    const pm25 = components.pm2_5;
    const pollutantValues = [pm25, components.pm10, components.no2, components.o3, components.so2];
    const pollutantLabels = ['PM2.5', 'PM10', 'NO2', 'O3', 'SO2'];

    // Determine air quality status
    let status = '';
    if (pm25 <= 12) status = 'Excellent';
    else if (pm25 <= 35.4) status = 'Good';
    else if (pm25 <= 55.4) status = 'Moderate';
    else if (pm25 <= 150.4) status = 'Unhealthy for Sensitive Groups';
    else if (pm25 <= 250.4) status = 'Unhealthy';
    else status = 'Hazardous';

    airStatusElem.childNodes[1].textContent = ''; // clear previous text

    statusText.textContent = status;
    statusText.className = ''; // reset
    switch(status) {
      case 'Excellent': statusText.classList.add('status-excellent'); break;
      case 'Good': statusText.classList.add('status-good'); break;
      case 'Moderate': statusText.classList.add('status-moderate'); break;
      case 'Unhealthy for Sensitive Groups': statusText.classList.add('status-unhealthy-sensitive'); break;
      case 'Unhealthy': statusText.classList.add('status-unhealthy'); break;
      case 'Hazardous': statusText.classList.add('status-hazardous'); break;
    }

    dataContainer.style.display = 'block';

    // Draw pie chart
    const ctx = document.getElementById('pollutantChart').getContext('2d');
    if (pollutantChart) {
      pollutantChart.destroy();
    }
    pollutantChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: pollutantLabels,
        datasets: [{
          data: pollutantValues,
          backgroundColor: ['#f39c12', '#e74c3c', '#8e44ad', '#3498db', '#2ecc71'],
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 14 },
            formatter: (value, context) => {
              const sum = context.chart.data.datasets[0].data.reduce((a,b) => a+b, 0);
              if(sum === 0) return '0%';
              return ((value / sum) * 100).toFixed(1) + '%';
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

  } catch (error) {
    errorMessage.textContent = error.message;
  }
}
