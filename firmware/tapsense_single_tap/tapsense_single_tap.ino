/*
 * TapSense Wave-2 — SINGLE TAP firmware (1 ESP → 1 YF-S201)
 * Prefer this for new installs (Phase 19 scale-out).
 *
 * Edit SETTINGS per board, then Upload.
 * Register device + tap in admin (/devices) or `python -m scripts.seed_wave2`.
 *
 * Pin: flow SIG = GPIO 25 · Library: PubSubClient
 * Board: ESP32 Dev Module
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <esp_task_wdt.h>
#include <time.h>

// ===================== SETTINGS (edit per device) =====================

const char *WIFI_SSID = "Jiofiber";
const char *WIFI_PASSWORD = "Farhan12135";

const char *MQTT_HOST = "broker.hivemq.com";
const uint16_t MQTT_PORT = 1883;
const char *MQTT_USER = "";
const char *MQTT_PASS = "";

// Unique per ESP
const char *DEVICE_ID = "device_02";
const char *TAP_ID = "tap_d";
const char *FIRMWARE_VERSION = "0.2.0-wave2";
const char *MQTT_TOPIC = "tapsense/pilot/device_02/telemetry";

const bool HTTP_INGEST_ENABLED = true;
const char *HTTP_INGEST_URL = "http://192.168.0.100:8000/api/v1/ingest/telemetry";
const char *DEVICE_API_KEY = "tapsense-device-key-9a4e2c8f1b6d0e3a7c5f2b8d1e4a9c6f";

const int PIN_FLOW = 25;
float PULSES_PER_LITER = 450.0f;

const uint32_t SESSION_IDLE_MS = 5000;
const uint32_t PULSE_DEBOUNCE_US = 800;
const uint32_t PUBLISH_INTERVAL_MS = 2000;
const uint32_t STATUS_INTERVAL_MS = 30000;
const uint32_t WIFI_RETRY_MS = 10000;
const uint32_t WDT_TIMEOUT_S = 30;

// ===================== END SETTINGS =====================

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

volatile uint32_t pulses = 0;
volatile uint32_t lastPulseMs = 0;
volatile uint32_t lastIsrUs = 0;
bool sessionOpen = false;
float sessionLiters = 0.0f;
uint32_t messageSeq = 0;
uint32_t bootId = 0;
uint32_t lastPublishMs = 0;
uint32_t lastStatusMs = 0;
uint32_t lastWifiAttemptMs = 0;

void IRAM_ATTR onPulse() {
  uint32_t nowUs = micros();
  if ((uint32_t)(nowUs - lastIsrUs) < PULSE_DEBOUNCE_US) return;
  lastIsrUs = nowUs;
  pulses++;
  lastPulseMs = millis();
}

unsigned long unixTs() {
  time_t now = time(nullptr);
  if (now < 1700000000) return millis();
  return (unsigned long)now;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  uint32_t now = millis();
  if (now - lastWifiAttemptMs < WIFI_RETRY_MS) return;
  lastWifiAttemptMs = now;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("WiFi connecting to %s…\n", WIFI_SSID);
}

void connectMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  String clientId = String("tapsense-") + DEVICE_ID + "-" + String((uint32_t)esp_random(), HEX);
  if (MQTT_USER[0]) mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
  else mqtt.connect(clientId.c_str());
}

void publishJson(const char *payload) {
  if (mqtt.connected()) mqtt.publish(MQTT_TOPIC, payload);
  if (!HTTP_INGEST_ENABLED) return;
  HTTPClient http;
  http.begin(HTTP_INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_API_KEY);
  int code = http.POST(payload);
  Serial.printf("HTTP ingest %d\n", code);
  http.end();
}

void publishStatus() {
  char payload[280];
  snprintf(
    payload,
    sizeof(payload),
    "{\"device_id\":\"%s\",\"type\":\"status\",\"wifi_rssi\":%d,\"uptime_ms\":%lu,\"firmware_version\":\"%s\"}",
    DEVICE_ID,
    WiFi.RSSI(),
    (unsigned long)millis(),
    FIRMWARE_VERSION
  );
  publishJson(payload);
}

void processFlow() {
  noInterrupts();
  uint32_t p = pulses;
  uint32_t last = lastPulseMs;
  pulses = 0;
  interrupts();

  uint32_t now = millis();
  if (p > 0) {
    float delta = (float)p / PULSES_PER_LITER;
    if (!sessionOpen) {
      sessionOpen = true;
      sessionLiters = 0.0f;
    }
    sessionLiters += delta;
    messageSeq++;
    char msgId[48];
    snprintf(msgId, sizeof(msgId), "%s-%08lx-%lu", DEVICE_ID, (unsigned long)bootId, (unsigned long)messageSeq);
    char payload[360];
    snprintf(
      payload,
      sizeof(payload),
      "{\"device_id\":\"%s\",\"tap_id\":\"%s\",\"ts\":%lu,\"liters_delta\":%.4f,\"session_liters\":%.4f,\"session_end\":false,\"message_id\":\"%s\",\"firmware_version\":\"%s\"}",
      DEVICE_ID,
      TAP_ID,
      unixTs(),
      delta,
      sessionLiters,
      msgId,
      FIRMWARE_VERSION
    );
    publishJson(payload);
  } else if (sessionOpen && (now - last) >= SESSION_IDLE_MS) {
    messageSeq++;
    char msgId[48];
    snprintf(msgId, sizeof(msgId), "%s-%08lx-%lu", DEVICE_ID, (unsigned long)bootId, (unsigned long)messageSeq);
    char payload[360];
    snprintf(
      payload,
      sizeof(payload),
      "{\"device_id\":\"%s\",\"tap_id\":\"%s\",\"ts\":%lu,\"liters_delta\":0,\"session_liters\":%.4f,\"session_end\":true,\"message_id\":\"%s\",\"firmware_version\":\"%s\"}",
      DEVICE_ID,
      TAP_ID,
      unixTs(),
      sessionLiters,
      msgId,
      FIRMWARE_VERSION
    );
    publishJson(payload);
    sessionOpen = false;
    sessionLiters = 0.0f;
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  bootId = (uint32_t)esp_random();
  Serial.println("TapSense SINGLE-TAP Wave-2");
  Serial.printf(" device=%s tap=%s fw=%s\n", DEVICE_ID, TAP_ID, FIRMWARE_VERSION);

  pinMode(PIN_FLOW, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), onPulse, FALLING);

  esp_task_wdt_init(WDT_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  connectWiFi();
  connectMqtt();
  configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
  publishStatus();
}

void loop() {
  esp_task_wdt_reset();
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMqtt();
  else mqtt.loop();

  uint32_t now = millis();
  if (now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    processFlow();
  }
  if (now - lastStatusMs >= STATUS_INTERVAL_MS) {
    lastStatusMs = now;
    publishStatus();
  }
}
