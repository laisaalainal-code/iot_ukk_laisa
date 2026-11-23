/**
 * ======================================================================
 * PROYEK 2: DHT11 DENGAN TAMPILAN OLED I2C (SSD1306)
 * File: 02-DHT11-OLED-Display.ino
 * 
 * TUJUAN PEMBELAJARAN:
 * 1. Mengintegrasikan display visual lokal (OLED I2C 128x64) dengan ESP32.
 * 2. Menggunakan kembali modul dht_sensor.h dari Proyek 1 tanpa modifikasi.
 * 3. Menampilkan data suhu & kelembapan pada layar fisik mandiri tanpa kabel USB/PC.
 * 
 * PERSIAPAN LIBRARY DI ARDUINO IDE:
 * - "DHT sensor library" by Adafruit
 * - "Adafruit SSD1306" by Adafruit
 * - "Adafruit GFX Library" by Adafruit
 * ======================================================================
 */

#include "config.h"
#include "dht_sensor.h"
#include "oled_display.h"

// Variabel Pewaktuan Non-Blocking
static unsigned long lastReadMillis = 0;
static float currentTemp = 0.0;
static float currentHum = 0.0;
static unsigned long packetCount = 0;

void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    Serial.println();
    Serial.println("==================================================");
    Serial.println(" PROYEK 2: DHT11 DENGAN TAMPILAN OLED I2C ");
    Serial.println(" Modul Layar: SSD1306 128x64 I2C (0x3C) ");
    Serial.println("==================================================");

    // 1. Inisialisasi Layar OLED & Tampilkan Splash Screen
    if (initOLED()) {
        showSplashScreen();
    }

    // 2. Inisialisasi Sensor DHT11
    initDHT();

    Serial.println("[SYSTEM] Inisialisasi selesai. Menampilkan data pada OLED...");
}

void loop() {
    unsigned long now = millis();

    // Pewaktuan non-blocking setiap 2 detik
    if (now - lastReadMillis >= SENSOR_READ_INTERVAL) {
        lastReadMillis = now;
        packetCount++;

        if (readDHT(currentTemp, currentHum)) {
            // 1. Tampilkan ke Serial Monitor
            Serial.print("[DATA #");
            Serial.print(packetCount);
            Serial.print("] Suhu: ");
            Serial.print(currentTemp, 1);
            Serial.print(" °C | Kelembapan: ");
            Serial.print(currentHum, 1);
            Serial.println(" %");

            // 2. Perbarui Grafis pada Layar OLED Fisik
            drawClimateScreen(currentTemp, currentHum, packetCount);
        } else {
            Serial.println("[ERROR] Gagal membaca sensor!");
            drawSensorError();
        }
    }
}