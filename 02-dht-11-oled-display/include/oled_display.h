
/**
 * ======================================================================
 * PROYEK 2: DHT11 DENGAN TAMPILAN OLED I2C (SSD1306)
 * File: oled_display.h
 * 
 * DESKRIPSI:
 * Modul terpisah untuk mengontrol grafis pada layar OLED SSD1306 128x64 I2C.
 * Menyediakan fungsi splash screen pembuka dan rendering layout pemantau suhu/kelembapan.
 * ======================================================================
 */

#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

// Inisialisasi Objek Layar SSD1306
static Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
static bool oledAvailable = false;

/**
 * Inisialisasi komunikasi I2C dan driver layar OLED.
 */
inline bool initOLED() {
    Wire.begin(OLED_SDA, OLED_SCL);

    // Inisialisasi SSD1306 dengan alamat I2C 0x3C
    if (!oled.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
        Serial.println("[OLED ERROR] Gagal mendeteksi modul SSD1306 pada I2C 0x3C!");
        oledAvailable = false;
        return false;
    }

    oledAvailable = true;
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    Serial.println("[OLED] Layar SSD1306 128x64 berhasil diinisialisasi.");

    // Teks Judul
    oled.setTextSize(1);
    oled.setCursor(18, 12);
    oled.print("PROYEK AKHIR IoT");

    oled.setCursor(14, 26);
    oled.print("CLIMATE MONITOR CAHYO");

    oled.drawLine(14, 38, 114, 38, SSD1306_WHITE);

    oled.setCursor(22, 44);
    oled.print("ESP32 + DHT11");

    oled.display();
    delay(2500); // Tampilkan splash screen selama 2.5 detik

    return true;
}

/**
 * Menampilkan Splash Screen Pembuka (Judul Proyek Akhir)
 */
inline void showSplashScreen() {
    if (!oledAvailable) return;

    oled.clearDisplay();

    // Bingkai Luar Layar
    oled.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
    oled.drawRect(2, 2, SCREEN_WIDTH - 4, SCREEN_HEIGHT - 4, SSD1306_WHITE);

    // Teks Judul
    oled.setTextSize(1);
    oled.setCursor(18, 12);
    oled.print("PROYEK AKHIR IoT");

    oled.setCursor(14, 26);
    oled.print("CLIMATE MONITOR CAHYO");

    oled.drawLine(14, 38, 114, 38, SSD1306_WHITE);

    oled.setCursor(22, 44);
    oled.print("ESP32 + DHT11");

    oled.display();
    delay(2500); // Tampilkan splash screen selama 2.5 detik
}

/**
 * Menggambar Layar Utama Pemantau Suhu & Kelembapan
 * 
 * @param temp Suhu dalam Celsius
 * @param hum Kelembapan dalam % RH
 * @param packetCount Nomor urut data paket
 */
inline void drawClimateScreen(float temp, float hum, unsigned long packetCount) {
    if (!oledAvailable) return;

    oled.clearDisplay();

    // 1. Header Bar Atas
    oled.fillRect(0, 0, SCREEN_WIDTH, 14, SSD1306_WHITE);
    oled.setTextColor(SSD1306_BLACK, SSD1306_WHITE); // Teks hitam di atas bar putih
    oled.setTextSize(1);
    oled.setCursor(4, 3);
    oled.print("CLIMATE NODE #");
    oled.print(packetCount);

    // 2. Area Nilai Suhu (Sisi Kiri)
    oled.setTextColor(SSD1306_WHITE);
    oled.setTextSize(1);
    oled.setCursor(6, 20);
    oled.print("SUHU (C)");

    oled.setTextSize(2);
    oled.setCursor(6, 32);
    oled.print(temp, 1);

    // 3. Garis Pembagi Vertikal Tengah
    oled.drawLine(64, 18, 64, 52, SSD1306_WHITE);

    // 4. Area Nilai Kelembapan (Sisi Kanan)
    oled.setTextSize(1);
    oled.setCursor(72, 20);
    oled.print("HUM (%RH)");

    oled.setTextSize(2);
    oled.setCursor(72, 32);
    oled.print(hum, 0);
    oled.print("%");

    // 5. Bar Status Bawah (Kenyamanan / Alert)
    oled.drawLine(0, 53, SCREEN_WIDTH, 53, SSD1306_WHITE);
    oled.setTextSize(1);
    oled.setCursor(4, 56);

    if (temp >= 20.0 && temp <= 26.0 && hum >= 40.0 && hum <= 60.0) {
        oled.print("STATUS: COMFORTABLE");
    } else if (temp > 30.0 || hum > 80.0) {
        oled.print("STATUS: DANGER / HOT");
    } else {
        oled.print("STATUS: NORMAL/WARM");
    }

    oled.display();

} // Penutup fungsi drawClimateScreen()

/**
 * Menampilkan pesan error jika pembacaan sensor gagal
 */
inline void drawSensorError() {
    if (!oledAvailable) return;

    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setTextColor(SSD1306_WHITE);

    oled.setCursor(10, 16);
    oled.print("SENSOR DHT11 ERROR!");

    oled.setCursor(10, 32);
    oled.print("Periksa perkabelan");

    oled.setCursor(10, 44);
    oled.print("pada pin GPIO 4");

    oled.display();
}

#endif // OLED_DISPLAY_H
