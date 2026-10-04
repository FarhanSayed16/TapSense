/*
 * TapSense Pilot — LIVE / BATTERY firmware (single file)
 * ESP32 + 3× YF-S201 → Wi‑Fi → dashboard
 *
 * USB only for upload. Battery / barrel for normal use.
 * Edit WIFI below, then Upload in Arduino IDE.
 * PC API: uvicorn app.main:app --host 0.0.0.0 --port 8000
 *
 * Pins: tap_a=25 tap_b=26 tap_c=27 · Library: PubSubClient
 * Board: ESP32 Dev Module
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <esp_task_wdt.h>
#include <time.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ===================== SETTINGS (edit here) =====================

// Wi‑Fi — ESP32 needs 2.4 GHz (use Jiofiber, not Jiofiber_5G)
const char *WIFI_SSID = "Jiofiber";
const char *WIFI_PASSWORD = "Farhan12135";

// MQTT
const char *MQTT_HOST = "broker.hivemq.com";
const uint16_t MQTT_PORT = 1883;
const char *MQTT_USER = "";
const char *MQTT_PASS = "";
const char *MQTT_TOPIC = "tapsense/pilot/device_01/telemetry";

// HTTP → your PC (change IP if ipconfig shows different Wi‑Fi address)
const bool HTTP_INGEST_ENABLED = true;
const char *HTTP_INGEST_URL = "http://192.168.0.100:8000/api/v1/ingest/telemetry";
const char *DEVICE_API_KEY = "tapsense-device-key-9a4e2c8f1b6d0e3a7c5f2b8d1e4a9c6f";

const char *DEVICE_ID = "device_01";

const int PIN_TAP_A = 25;  // pipe 1 control
const int PIN_TAP_B = 26;  // pipe 2
const int PIN_TAP_C = 27;  // pipe 3

float PULSES_PER_LITER_A = 450.0f;
float PULSES_PER_LITER_B = 450.0f;
float PULSES_PER_LITER_C = 450.0f;

const uint32_t SESSION_IDLE_MS = 5000;
const uint32_t PULSE_DEBOUNCE_US = 800;
const uint32_t PUBLISH_INTERVAL_MS = 2000;
const uint32_t STATUS_INTERVAL_MS = 30000;
const uint32_t WIFI_RETRY_MS = 10000;
const uint32_t WDT_TIMEOUT_S = 30;

// 16×2 I2C LCD (SDA=21 SCL=22 VCC=5V GND=GND). Address often 0x27 or 0x3F.
const bool LCD_ENABLED = true;
const uint8_t LCD_ADDRESS = 0x27;
const int PIN_LCD_SDA = 21;
const int PIN_LCD_SCL = 22;
const uint32_t LCD_SWITCH_MS = 2000;

// Product phase display (phase-13 / phase-16 / phase-18 docs)
// 0 = Phase 0 silent — LCD status/IP only (never liters)
// 1 = Phase 1 — LCD Tap B & C liters only (NEVER Tap A / control)
// 2 = Phase 2 — same + wordless green/amber/red band (LCD letter + optional WS2812)
// 3 = Phase 3 — social field live: B/C liters + color band + P3 SOCIAL status (board is separate)
const int PRODUCT_PHASE_DISPLAY = 1;

// Phase 2 session thresholds (liters) — match /thresholds admin values after suggest
const float COLOR_THRESHOLD_B = 1.5f;
const float COLOR_THRESHOLD_C = 1.5f;
const float COLOR_GREEN_MAX_RATIO = 1.0f;   // < 1.0× → green
const float COLOR_AMBER_MAX_RATIO = 1.5f;   // < 1.5× → amber, else red

// Optional WS2812 on DIN=GPIO13 (B/C cue only). Keep 0 unless Adafruit NeoPixel installed.
#define USE_COLOR_LED 0
const int PIN_WS2812 = 13;
const uint8_t WS2812_COUNT = 1;

// ===================== END SETTINGS =====================

LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);
uint8_t lcdTapIndex = 0;
uint32_t lastLcdMs = 0;
// Unique per power-on so message_id never collides after reboot (API dedupes duplicates)
uint32_t bootId = 0;
uint8_t lastColorBandB = 0;  // 0=idle 1=G 2=A 3=R
uint8_t lastColorBandC = 0;
uint32_t colorPulseUntilMs = 0;

#if USE_COLOR_LED
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel colorLed(WS2812_COUNT, PIN_WS2812, NEO_GRB + NEO_KHZ800);
#endif

struct TapChannel {
  const char *tapId;
  int pin;
  float pulsesPerLiter;
  volatile uint32_t pulses;
  volatile uint32_t lastPulseMs;
  volatile uint32_t lastIsrUs;
  bool sessionOpen;
  float sessionLiters;
  uint32_t messageSeq;
};

TapChannel taps[3] = {
  {"tap_a", PIN_TAP_A, PULSES_PER_LITER_A, 0, 0, 0, false, 0.0f, 0},
  {"tap_b", PIN_TAP_B, PULSES_PER_LITER_B, 0, 0, 0, false, 0.0f, 0},
  {"tap_c", PIN_TAP_C, PULSES_PER_LITER_C, 0, 0, 0, false, 0.0f, 0},
};

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

uint32_t lastPublishMs = 0;
uint32_t lastStatusMs = 0;
uint32_t lastWifiAttemptMs = 0;
String serialLine;

void IRAM_ATTR onPulseIndexed(int idx) {
  uint32_t nowUs = micros();
  uint32_t last = taps[idx].lastIsrUs;
  if ((uint32_t)(nowUs - last) < PULSE_DEBOUNCE_US) return;
  taps[idx].lastIsrUs = nowUs;
  taps[idx].pulses++;
  taps[idx].lastPulseMs = millis();
}

void IRAM_ATTR onPulseA() { onPulseIndexed(0); }
void IRAM_ATTR onPulseB() { onPulseIndexed(1); }
void IRAM_ATTR onPulseC() { onPulseIndexed(2); }

unsigned long unixTs() {
  time_t now = time(nullptr);
  if (now < 1700000000) {
    // NTP not ready yet — backend accepts relative and uses server time
    return millis();
  }
  return (unsigned long)now;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  uint32_t now = millis();
  if (now - lastWifiAttemptMs < WIFI_RETRY_MS && lastWifiAttemptMs != 0) return;
  lastWifiAttemptMs = now;

  Serial.printf("[wifi] connecting to %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
    Serial.print(".");
    esp_task_wdt_reset();
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[wifi] ok ip=%s rssi=%d\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println("[wifi] failed — will retry");
  }
}

void connectMqtt() {
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
  String clientId = String("tapsense-") + DEVICE_ID + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);

  Serial.printf("[mqtt] connecting %s:%u as %s\n", MQTT_HOST, MQTT_PORT, clientId.c_str());

  bool ok;
  if (MQTT_USER[0] != '\0') {
    ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
  } else {
    ok = mqtt.connect(clientId.c_str());
  }

  if (ok) {
    Serial.println("[mqtt] connected");
  } else {
    Serial.printf("[mqtt] failed state=%d\n", mqtt.state());
  }
}

void publishHttp(const char *payload) {
  if (!HTTP_INGEST_ENABLED) return;
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(HTTP_INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Api-Key", DEVICE_API_KEY);
  int code = http.POST(payload);
  String body = http.getString();
  Serial.printf("[http] POST %d %s\n", code, body.c_str());
  http.end();
}

void publishJson(const char *payload) {
  // Prefer HTTP to local API (dashboard). MQTT as backup / second path.
  if (HTTP_INGEST_ENABLED) {
    publishHttp(payload);
  }
  if (mqtt.connected()) {
    bool mqttOk = mqtt.publish(MQTT_TOPIC, payload);
    Serial.printf("[mqtt] %s %s\n", mqttOk ? "ok" : "fail", payload);
  } else if (!HTTP_INGEST_ENABLED) {
    Serial.println("[mqtt] skip (offline)");
  }
}

void publishTap(TapChannel &tap, float litersDelta, bool sessionEnd) {
  tap.messageSeq++;
  char payload[360];
  snprintf(
    payload,
    sizeof(payload),
    "{\"device_id\":\"%s\",\"tap_id\":\"%s\",\"ts\":%lu,\"liters_delta\":%.4f,"
    "\"session_liters\":%.4f,\"session_end\":%s,\"message_id\":\"%s-%s-%08lx-%lu\"}",
    DEVICE_ID,
    tap.tapId,
    unixTs(),
    litersDelta,
    tap.sessionLiters,
    sessionEnd ? "true" : "false",
    DEVICE_ID,
    tap.tapId,
    (unsigned long)bootId,
    (unsigned long)tap.messageSeq
  );
  publishJson(payload);
}

void processTap(TapChannel &tap) {
  noInterrupts();
  uint32_t pulses = tap.pulses;
  tap.pulses = 0;
  uint32_t lastPulse = tap.lastPulseMs;
  interrupts();

  uint32_t now = millis();

  if (pulses > 0) {
    float liters = pulses / tap.pulsesPerLiter;
    if (!tap.sessionOpen) {
      tap.sessionOpen = true;
      tap.sessionLiters = 0.0f;
      Serial.printf("[session] %s START\n", tap.tapId);
    }
    tap.sessionLiters += liters;
    Serial.printf("[pulse] %s +%lu pulses -> +%.4f L (session %.4f L)\n",
                  tap.tapId, (unsigned long)pulses, liters, tap.sessionLiters);
    publishTap(tap, liters, false);
  } else if (tap.sessionOpen && (now - lastPulse) >= SESSION_IDLE_MS) {
    Serial.printf("[session] %s END total=%.3f L\n", tap.tapId, tap.sessionLiters);
    publishTap(tap, 0.0f, true);
    tap.sessionOpen = false;
    tap.sessionLiters = 0.0f;
  }
}

void publishStatus() {
  char payload[220];
  snprintf(
    payload,
    sizeof(payload),
    "{\"device_id\":\"%s\",\"type\":\"status\",\"wifi_rssi\":%d,\"uptime_ms\":%lu}",
    DEVICE_ID,
    WiFi.RSSI(),
    (unsigned long)millis()
  );
  publishJson(payload);
}

// Band: 0 idle, 1 green, 2 amber, 3 red — no guilt text
uint8_t bandForTapIndex(uint8_t idx) {
  if (idx == 0) return 0;  // control never cued
  TapChannel &tap = taps[idx];
  if (!tap.sessionOpen) return 0;
  float th = (idx == 1) ? COLOR_THRESHOLD_B : COLOR_THRESHOLD_C;
  if (th <= 0.0f) return 1;
  float ratio = tap.sessionLiters / th;
  if (ratio < COLOR_GREEN_MAX_RATIO) return 1;
  if (ratio < COLOR_AMBER_MAX_RATIO) return 2;
  return 3;
}

char bandLetter(uint8_t band) {
  if (band == 1) return 'G';
  if (band == 2) return 'A';
  if (band == 3) return 'R';
  return '-';
}

void setColorLed(uint8_t band, bool pulse) {
#if USE_COLOR_LED
  uint8_t r = 0, g = 0, b = 0;
  if (band == 1) { g = pulse ? 180 : 40; }
  else if (band == 2) { r = pulse ? 180 : 80; g = pulse ? 100 : 40; }
  else if (band == 3) { r = pulse ? 200 : 60; }
  colorLed.setPixelColor(0, colorLed.Color(r, g, b));
  colorLed.show();
#else
  (void)band;
  (void)pulse;
#endif
}

void updateColorCue() {
  if (PRODUCT_PHASE_DISPLAY < 2) {
    setColorLed(0, false);
    return;
  }
  // Prefer the actively flowing intervention tap; never A
  uint8_t activeIdx = 0;
  for (uint8_t i = 1; i <= 2; i++) {
    if (taps[i].sessionOpen) {
      activeIdx = i;
      break;
    }
  }
  uint8_t band = activeIdx ? bandForTapIndex(activeIdx) : 0;
  if (!activeIdx) {
    lastColorBandB = 0;
    lastColorBandC = 0;
  } else {
    uint8_t prev = (activeIdx == 1) ? lastColorBandB : lastColorBandC;
    if (band != prev && band >= 1) {
      colorPulseUntilMs = millis() + 400;
    }
    if (activeIdx == 1) lastColorBandB = band;
    else lastColorBandC = band;
  }
  bool pulse = colorPulseUntilMs && millis() < colorPulseUntilMs;
  setColorLed(band, pulse);
}

void updateLcd() {
  if (!LCD_ENABLED) return;
  uint32_t now = millis();
  if (now - lastLcdMs < LCD_SWITCH_MS) return;
  lastLcdMs = now;

  // Always show link status when offline
  if (WiFi.status() != WL_CONNECTED) {
    lcd.setCursor(0, 0);
    lcd.print("WIFI?           ");
    lcd.setCursor(0, 1);
    lcd.print("Reconnecting... ");
    return;
  }

  // Phase 0 silent: status / IP only — no user-facing liters (esp. not control)
  if (PRODUCT_PHASE_DISPLAY < 1) {
    lcd.setCursor(0, 0);
    lcd.print("P0 SILENT       ");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    lcd.print("        ");
    return;
  }

  // Phase 1/2: rotate status, Tap B, Tap C — NEVER Tap A (index 0)
  static uint8_t phaseFrame = 0;
  phaseFrame = (phaseFrame + 1) % 3;

  if (phaseFrame == 0) {
    lcd.setCursor(0, 0);
    if (PRODUCT_PHASE_DISPLAY >= 3) {
      lcd.print("P3 SOCIAL       ");
    } else if (PRODUCT_PHASE_DISPLAY >= 2) {
      lcd.print("P2 COLOR        ");
    } else {
      lcd.print("P1 VISIBILITY   ");
    }
    lcd.setCursor(0, 1);
    if (PRODUCT_PHASE_DISPLAY >= 3) {
      lcd.print("BOARD LIVE      ");
    } else {
      lcd.print("ONLINE          ");
    }
    return;
  }

  // frame 1 -> tap_b (index 1), frame 2 -> tap_c (index 2)
  uint8_t idx = phaseFrame;  // 1 or 2
  TapChannel &tap = taps[idx];
  lcd.setCursor(0, 0);
  lcd.print("TAP ");
  lcd.print(idx + 1);
  if (PRODUCT_PHASE_DISPLAY >= 2) {
    lcd.print(" ");
    lcd.print(bandLetter(bandForTapIndex(idx)));
    lcd.print("          ");
  } else {
    lcd.print("          ");
  }
  lcd.setCursor(0, 1);
  lcd.print(tap.sessionLiters, 3);
  lcd.print(" L       ");
}

void printPins() {
  Serial.println("Pin map:");
  Serial.printf("  tap_a (control) GPIO %d\n", PIN_TAP_A);
  Serial.printf("  tap_b           GPIO %d\n", PIN_TAP_B);
  Serial.printf("  tap_c           GPIO %d\n", PIN_TAP_C);
  Serial.println("  sensors VCC -> 5V · GND -> GND (shared)");
#if USE_COLOR_LED
  Serial.printf("  WS2812 DIN      GPIO %d (Phase 2 B/C only)\n", PIN_WS2812);
#endif
}

void printHelp() {
  Serial.println("Commands:");
  Serial.println("  help");
  Serial.println("  pins");
  Serial.println("  status");
  Serial.println("  sim a <pulses>   e.g. sim a 450  (~1 L if cal=450)");
  Serial.println("  sim b <pulses>");
  Serial.println("  sim c <pulses>");
}

int tapIndexFromLetter(char c) {
  if (c == 'a' || c == 'A') return 0;
  if (c == 'b' || c == 'B') return 1;
  if (c == 'c' || c == 'C') return 2;
  return -1;
}

void handleSerialLine(String line) {
  line.trim();
  if (line.length() == 0) return;

  if (line.equalsIgnoreCase("help")) {
    printHelp();
    return;
  }
  if (line.equalsIgnoreCase("pins")) {
    printPins();
    return;
  }
  if (line.equalsIgnoreCase("status")) {
    Serial.printf("wifi=%s mqtt=%s uptime_ms=%lu\n",
                  WiFi.status() == WL_CONNECTED ? "up" : "down",
                  mqtt.connected() ? "up" : "down",
                  (unsigned long)millis());
    for (int i = 0; i < 3; i++) {
      Serial.printf("  %s session=%s liters=%.3f\n",
                    taps[i].tapId,
                    taps[i].sessionOpen ? "open" : "closed",
                    taps[i].sessionLiters);
    }
    return;
  }

  if (line.startsWith("sim ")) {
    // sim a 50
    char letter = 0;
    int pulses = 0;
    if (sscanf(line.c_str(), "sim %c %d", &letter, &pulses) == 2 && pulses > 0) {
      int idx = tapIndexFromLetter(letter);
      if (idx < 0) {
        Serial.println("unknown tap — use a|b|c");
        return;
      }
      noInterrupts();
      taps[idx].pulses += (uint32_t)pulses;
      taps[idx].lastPulseMs = millis();
      interrupts();
      Serial.printf("[sim] queued %d pulses on %s\n", pulses, taps[idx].tapId);
      return;
    }
  }

  Serial.println("unknown command — type help");
}

void pollSerial() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialLine.length()) {
        handleSerialLine(serialLine);
        serialLine = "";
      }
    } else if (serialLine.length() < 80) {
      serialLine += c;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(400);
  bootId = (uint32_t)esp_random();
  Serial.println();
  Serial.println("========================================");
  Serial.println(" TapSense PILOT — WiFi live / battery OK");
  Serial.printf(" boot_id=%08lx\n", (unsigned long)bootId);
  Serial.println("========================================");
  printPins();
  printHelp();

  if (LCD_ENABLED) {
    Wire.begin(PIN_LCD_SDA, PIN_LCD_SCL);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("TapSense Pilot");
    lcd.setCursor(0, 1);
    lcd.print("WiFi starting");
  }

#if USE_COLOR_LED
  colorLed.begin();
  colorLed.clear();
  colorLed.show();
#endif

  pinMode(PIN_TAP_A, INPUT_PULLUP);
  pinMode(PIN_TAP_B, INPUT_PULLUP);
  pinMode(PIN_TAP_C, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(PIN_TAP_A), onPulseA, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_TAP_B), onPulseB, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_TAP_C), onPulseC, FALLING);

  // Watchdog — Arduino-ESP32 classic API (2.x / many 3.x builds)
  esp_task_wdt_init(WDT_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  connectWiFi();
  connectMqtt();
  publishStatus();

  if (LCD_ENABLED) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(WiFi.status() == WL_CONNECTED ? "WiFi OK" : "WiFi FAIL");
    lcd.setCursor(0, 1);
    if (WiFi.status() == WL_CONNECTED) {
      lcd.print(WiFi.localIP());
    } else {
      lcd.print("Check 2.4GHz");
    }
    delay(1500);
    lcd.clear();
  }
}

void loop() {
  esp_task_wdt_reset();
  pollSerial();

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqtt.connected()) {
    connectMqtt();
  } else {
    mqtt.loop();
  }

  uint32_t now = millis();

  if (now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    for (int i = 0; i < 3; i++) processTap(taps[i]);
  } else {
    for (int i = 0; i < 3; i++) {
      noInterrupts();
      uint32_t pulses = taps[i].pulses;
      uint32_t lastPulse = taps[i].lastPulseMs;
      interrupts();
      if (pulses == 0 && taps[i].sessionOpen && (now - lastPulse) >= SESSION_IDLE_MS) {
        processTap(taps[i]);
      }
    }
  }

  updateLcd();
  updateColorCue();

  if (now - lastStatusMs >= STATUS_INTERVAL_MS) {
    lastStatusMs = now;
    publishStatus();
  }
}
