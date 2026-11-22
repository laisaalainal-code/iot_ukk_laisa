
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Tempat menyimpan data sensor terbaru
let dhtData = {
  temperature: null,
  humidity: null,
  updatedAt: null,
};

// ESP32 mengirim data ke alamat ini
app.post("/api/dht", (req, res) => {
  const { temperature, humidity } = req.body;

  if (
    typeof temperature !== "number" ||
    typeof humidity !== "number"
  ) {
    return res.status(400).json({
      error: "Data suhu dan kelembapan tidak valid",
    });
  }

  dhtData = {
    temperature,
    humidity,
    updatedAt: new Date().toLocaleString("id-ID"),
  };

  console.log("Data DHT diterima:", dhtData);

  res.json({
    message: "Data berhasil diterima",
    data: dhtData,
  });
});

// Website mengambil data dari alamat ini
app.get("/api/dht", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(dhtData);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server berjalan di port ${PORT}`);
});
