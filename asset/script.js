const API_URL = "http://localhost:3001/api/dht";

async function fetchDhtData() {
  const tempEl = document.getElementById("temperature");
  const humEl = document.getElementById("humidity");
  const infoEls = document.querySelectorAll(".card-info");
  const updatedEl = infoEls[0];

  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengambil data");

    const data = await res.json();

    if (data.temperature !== null) {
      tempEl.textContent = `${data.temperature}°C`;
    }
    if (data.humidity !== null) {
      humEl.textContent = `${data.humidity}%`;
    }
    if (updatedEl) {
      updatedEl.innerHTML = `<i class="fa-regular fa-clock"></i> Updated: ${
        data.updatedAt ?? "Menunggu data ESP32..."
      }`;
    }
  } catch (err) {
    if (updatedEl) {
      updatedEl.innerHTML = `<i class="fa-regular fa-clock"></i> Updated: Connection Error`;
    }
  }
}

fetchDhtData();
setInterval(fetchDhtData, 2000);