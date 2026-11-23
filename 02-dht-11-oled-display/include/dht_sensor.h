/**
 * ======================================================================
 * PROYEK 2: DHT11 DENGAN TAMPILAN OLED I2C (SSD1306)
 * File: dht_sensor.h
 * 
 * Modul pembacaan sensor DHT11 yang sama persis dengan Proyek 1.
 * Ini membuktikan keunggulan arsitektur modular: kode dapat langsung dipakai ulang!
 * ======================================================================
 */

#ifndef DHT_SENSOR_H
#define DHT_SENSOR_H

#include <DHT.h>
#include "config.h"

static DHT dhtSensor(DHT_PIN, DHT_TYPE);

inline void initDHT() {
    dhtSensor.begin();
    Serial.println("[DHT11] Driver sensor berhasil diinisialisasi pada GPIO " + String(DHT_PIN));
}

inline bool readDHT(float &temp, float &hum) {
    float t = dhtSensor.readTemperature();
    float h = dhtSensor.readHumidity();

    if (isnan(t) || isnan(h)) {
        Serial.println("[DHT11 ERROR] Gagal membaca sensor!");
        return false;
    }

    temp = t;
    hum = h;
    return true;
}

#endif // DHT_SENSOR_H
