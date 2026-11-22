
#include <WiFi.h>
#include <HTTPClient.h>

#include "config.h"
#include "dht_sensor.h"

//## KONFIGURASI WIFI
const char* ssid = "RZQ28";
const char* password = "Mucus1981";

// ## ALAMAT API LAPTOP
const char* serverUrl = "http://192.168.1.7:3001/api/dht";

// VARIABEL SENSOR
float currentTemperature = 0.0;
float currentHumidity = 0.0;
unsigned long lastReadMillis = 0;
unsigned long readCount = 0;

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);

  Serial.println("Memulai ESP32 + DHT11");

  // Memulai sensor
  initDHT();

  //## Menghubungkan WiFi
  Serial.println("Menghubungkan ke WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi berhasil terhubung!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

//## FUNGSI MENGIRIM DATA KE API
void sendDHTData(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi terputus!");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"temperature\":";
  payload += String(temperature, 1);
  payload += ",\"humidity\":";
  payload += String(humidity, 1);
  payload += "}";

  int httpCode = http.POST(payload);

  Serial.print("HTTP Response: ");
  Serial.println(httpCode);

  http.end();
}

void loop() {
  unsigned long nowMillis = millis();

  if (nowMillis - lastReadMillis >= SENSOR_READ_INTERVAL) {
    lastReadMillis = nowMillis;
    readCount++;

    if (readDHT(currentTemperature, currentHumidity)) {
      Serial.print("Pembacaan #");
      Serial.print(readCount);
      Serial.print(" | Suhu: ");
      Serial.print(currentTemperature, 1);
      Serial.print(" C | Kelembapan: ");
      Serial.print(currentHumidity, 1);
      Serial.println(" %RH");

      // MENGIRIM DATA SENSOR KE API
      sendDHTData(currentTemperature, currentHumidity);

    } else {
      Serial.println("Sensor gagal dibaca.");
    }
  }
}
