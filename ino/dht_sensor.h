/*
======================================================
File: dht_sensor.h

File ini berisi definisi modul sensor DHT11. File .ino hanya memanggil:
  initDHT();
  readDHT(currentTemperature, currentHumidity);

File .h mirip daftar modul/cetak biru yang menyediakan fungsi kepada .ino.
Ini bukan implementasi otomatis dari nama class HTML/CSS, melainkan mekanisme 
pembagian kode menjadi bagian-bagian yang dapat dicari dan dipakai ulang.
======================================================
*/

// ======================================================
// INCLUDE GUARD / PENGAMAN DUPLIKAT
// ======================================================
// #ifndef = "if not defined": jika CONTOH_DHT_SENSOR_H belum pernah didefinisikan,
//           maka compiler boleh membaca isi sampai baris #endif.
// #define = membuat tanda penanda agar compiler mengetahui header ini sudah dibaca.
// #endif  = menutup blok yang dibuka oleh #ifndef.
//
// Guard bukan kode Arduino utama. Guard mencegah header dibaca dua kali oleh
// #include berantai. Tanpa guard, definisi fungsi/variabel bisa terulang dan
// compiler dapat melaporkan "multiple definition" atau "already defined".
#ifndef CONTOH_DHT_SENSOR_H
#define CONTOH_DHT_SENSOR_H

#include <DHT.h>
#include "config.h"

// static di sini membatasi objek agar tidak bertabrakan pada unit kompilasi.
static DHT sensorExample(DHT_PIN, DHT_TYPE);

/*
  initDHT()
  ------------------------------------------------------
  Dipanggil dari setup() pada file .ino.
  Ini mengaktifkan komunikasi sensor pada pin yang telah ditentukan config.h.
*/
inline void initDHT() {
  sensorExample.begin();
  Serial.println("[dht_sensor.h] Sensor DHT11 dimulai pada GPIO " + String(DHT_PIN));
}

/*
  readDHT()
  ------------------------------------------------------
  Ini adalah satu-satunya tempat fungsi readDHT() dibuat pada contoh ini.
  Tempat pemanggilan tidak menentukan tempat pembuatannya:
    .ino: if (readDHT(...)) { ... }
    .h ini: inline bool readDHT(float &temp, float &hum) { ... }

  inline digunakan supaya definisi header mudah dipakai tanpa membuat file .cpp
  terpisah. Dalam proyek dasar ini, fungsi header dianggap sebagai modul ringkas.

  Parameter float &temp dan float &hum memakai referensi (&). Karena itu fungsi
  dapat menuliskan hasil pembacaan kembali ke variabel milik file .ino.
*/
inline bool readDHT(float &temp, float &hum) {
  float temperature = sensorExample.readTemperature();
  float humidity = sensorExample.readHumidity();

  // Librari mendeteksi NaN jika pembacaan tidak dapat dipercaya.
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[dht_sensor.h] Gagal membaca pembacaan DHT11 tidak valid");
    return false;
  }

  temp = temperature;
  hum = humidity;
  return true;
}

#endif // CONTOH_DHT_SENSOR_H