<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$storageFile = __DIR__ . "/dht_latest.json";

// Terima data dari ESP32 (via POST JSON atau GET query)
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $raw = file_get_contents("php://input");
    $body = json_decode($raw, true) ?? [];

    $temp = $body["temperature"] ?? $body["suhu"] ?? $body["temp"] ?? null;
    $hum  = $body["humidity"] ?? $body["kelembaban"] ?? $body["hum"] ?? null;

    if ($temp !== null || $hum !== null) {
        $existing = file_exists($storageFile)
            ? json_decode(file_get_contents($storageFile), true)
            : ["temperature" => null, "humidity" => null, "updatedAt" => null];

        $data = [
            "temperature" => $temp !== null ? (float)$temp : $existing["temperature"],
            "humidity"    => $hum !== null ? (float)$hum : $existing["humidity"],
            "updatedAt"   => date("H:i:s"),
        ];
        file_put_contents($storageFile, json_encode($data));
        echo json_encode(["status" => "ok", "data" => $data]);
        exit;
    }
}

// Kalau ESP32 kirim lewat GET (?suhu=29&kelembaban=70)
if (isset($_GET["temperature"]) || isset($_GET["suhu"]) || isset($_GET["temp"]) ||
    isset($_GET["humidity"]) || isset($_GET["kelembaban"]) || isset($_GET["hum"])) {
    $temp = $_GET["temperature"] ?? $_GET["suhu"] ?? $_GET["temp"] ?? null;
    $hum  = $_GET["humidity"] ?? $_GET["kelembaban"] ?? $_GET["hum"] ?? null;

    $existing = file_exists($storageFile)
        ? json_decode(file_get_contents($storageFile), true)
        : ["temperature" => null, "humidity" => null, "updatedAt" => null];

    $data = [
        "temperature" => $temp !== null ? (float)$temp : $existing["temperature"],
        "humidity"    => $hum !== null ? (float)$hum : $existing["humidity"],
        "updatedAt"   => date("H:i:s"),
    ];
    file_put_contents($storageFile, json_encode($data));
    echo json_encode(["status" => "ok", "data" => $data]);
    exit;
}

// Kalau dipanggil script.js untuk ambil data terbaru
if (file_exists($storageFile)) {
    echo file_get_contents($storageFile);
} else {
    echo json_encode(["temperature" => null, "humidity" => null, "updatedAt" => null]);
}