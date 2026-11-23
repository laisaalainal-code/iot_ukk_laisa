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

//----------------------------KREDENSIAL WI-FI --------------------------

#define WIFI_SSID   "RPL SMK MVP"
#define WIFI_PASS   "*#Mufa161073

//---------------------------------- PINOUT SENSOR DHT 11----------------------------
#define DHT_PIN   4
#define DHT_TYPE  DHT11


//---------------------------------- PINOUT LAYAR OLED 12C -------------------------
#define OLED_SDA       21
#define OLED_SCL       22
#define OLED_12C_ADDR  0x3C
#define SCREEN_WIDTH   128
#define SCREEN_HEIGHT  64
#define OLED_RESET     -1



//----------------------------------- KONFIGURASI SISTEM ------------------
#define SERIAL_BAUD             115200
#define SENSOR_READ_INTERVAL    2000

#endif // CONTOH_CONFIG_H