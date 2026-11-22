/*
======================================================
File: config.h

Konfigurasi harus dipusatkan di sini. Jika ingin memindah sensor ke GPIO lain,
ubah DHT_PIN saja; file .ino tidak perlu mengulang perubahan pada setiap fungsi.
======================================================
*/

// INCLUDE GUARD: cegah isi file ini dibaca ulang oleh compiler dengan nama sama.
#ifndef CONTOH_CONFIG_H
#define CONTOH_CONFIG_H

#include <Arduino.h>

#define DHT_PIN                 4
#define DHT_TYPE                DHT11
#define SERIAL_BAUD             115200
#define SENSOR_READ_INTERVAL    2000

#endif // CONTOH_CONFIG_H