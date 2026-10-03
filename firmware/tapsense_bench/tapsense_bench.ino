/*
  ============================================================
  TapSense — FINAL BENCH TEST FIRMWARE
  ESP32 + 3× YF-S201 + 16×2 I2C LCD
  ============================================================
  USB / Serial only — NO Wi-Fi / MQTT (prove hardware first).

  Library: LiquidCrystal_I2C (and Wire, built-in)
  Board:   ESP32 Dev Module · Serial 115200

  Pins (locked for this project):
    Tap A (control, pipe 1) -> GPIO 25
    Tap B (pipe 2)          -> GPIO 26
    Tap C (pipe 3)          -> GPIO 27
    LCD SDA/SCL             -> GPIO 21 / 22
    LCD VCC/GND             -> 5V / GND

  Commands: help | pins | status | reset | sim a 450 | sim b 450 | sim c 450

  After bench passes -> use firmware/tapsense_pilot/ (Wi-Fi + MQTT).
  ============================================================
*/

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define PIN_TAP_A 25
#define PIN_TAP_B 26
#define PIN_TAP_C 27
#define LCD_SDA 21
#define LCD_SCL 22

#define LCD_ADDRESS 0x27
#define LCD_COLUMNS 16
#define LCD_ROWS 2

LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLUMNS, LCD_ROWS);

// Initial only — replace after 1 L bucket calibration per sensor
float PULSES_PER_LITER_A = 450.0f;
float PULSES_PER_LITER_B = 450.0f;
float PULSES_PER_LITER_C = 450.0f;

#define SESSION_IDLE_MS 3000
#define PROCESS_INTERVAL_MS 500
#define LCD_SWITCH_INTERVAL_MS 2000
#define PULSE_DEBOUNCE_US 1000

struct TapChannel {
  const char *tapId;
  uint8_t pin;
  float pulsesPerLiter;
  volatile uint32_t pulses;
  volatile uint32_t lastPulseMs;
  volatile uint32_t lastIsrUs;
  bool sessionOpen;
  float sessionLiters;
  float totalLiters;
  uint32_t totalPulses;
};

TapChannel taps[3] = {
  {"tap_a", PIN_TAP_A, PULSES_PER_LITER_A, 0, 0, 0, false, 0.0f, 0.0f, 0},
  {"tap_b", PIN_TAP_B, PULSES_PER_LITER_B, 0, 0, 0, false, 0.0f, 0.0f, 0},
  {"tap_c", PIN_TAP_C, PULSES_PER_LITER_C, 0, 0, 0, false, 0.0f, 0.0f, 0},
};

uint32_t lastProcessMs = 0;
uint32_t lastLcdSwitchMs = 0;
uint8_t currentDisplayTap = 0;
String serialLine;

void IRAM_ATTR onPulseIndexed(int index) {
  uint32_t nowUs = micros();
  if ((uint32_t)(nowUs - taps[index].lastIsrUs) < PULSE_DEBOUNCE_US) return;
  taps[index].lastIsrUs = nowUs;
  taps[index].pulses++;
  taps[index].lastPulseMs = millis();
}

void IRAM_ATTR onPulseA() { onPulseIndexed(0); }
void IRAM_ATTR onPulseB() { onPulseIndexed(1); }
void IRAM_ATTR onPulseC() { onPulseIndexed(2); }

void clearLCDLine(uint8_t row) {
  lcd.setCursor(0, row);
  lcd.print("                ");
}

void displayTap(uint8_t index) {
  if (index >= 3) return;
  TapChannel &tap = taps[index];
  clearLCDLine(0);
  clearLCDLine(1);
  lcd.setCursor(0, 0);
  lcd.print("TAP ");
  lcd.print(index + 1);
  if (index == 0) lcd.print(" CTRL");
  lcd.setCursor(0, 1);
  lcd.print(tap.sessionLiters, 3);
  lcd.print(" L");
}

void displayStartup() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TapSense");
  lcd.setCursor(0, 1);
  lcd.print("Bench test");
  delay(1500);
  lcd.clear();
}

void processTap(TapChannel &tap) {
  uint32_t pulseCount;
  uint32_t lastPulse;

  noInterrupts();
  pulseCount = tap.pulses;
  tap.pulses = 0;
  lastPulse = tap.lastPulseMs;
  interrupts();

  uint32_t now = millis();

  if (pulseCount > 0) {
    float liters = (float)pulseCount / tap.pulsesPerLiter;

    if (!tap.sessionOpen) {
      tap.sessionOpen = true;
      tap.sessionLiters = 0.0f;
      Serial.println();
      Serial.print("[SESSION START] ");
      Serial.println(tap.tapId);
    }

    tap.sessionLiters += liters;
    tap.totalLiters += liters;
    tap.totalPulses += pulseCount;

    Serial.print("[FLOW] ");
    Serial.print(tap.tapId);
    Serial.print(" | Pulses: ");
    Serial.print(pulseCount);
    Serial.print(" | +");
    Serial.print(liters, 4);
    Serial.print(" L | Session: ");
    Serial.print(tap.sessionLiters, 4);
    Serial.print(" L | Total: ");
    Serial.print(tap.totalLiters, 4);
    Serial.println(" L");
  } else if (tap.sessionOpen && (now - lastPulse >= SESSION_IDLE_MS)) {
    Serial.println();
    Serial.print("[SESSION END] ");
    Serial.print(tap.tapId);
    Serial.print(" | Total: ");
    Serial.print(tap.sessionLiters, 4);
    Serial.println(" L");
    tap.sessionOpen = false;
  }
}

void processAllTaps() {
  for (int i = 0; i < 3; i++) processTap(taps[i]);
}

void printPins() {
  Serial.println();
  Serial.println("========== PIN MAP ==========");
  Serial.print("Tap A (pipe 1, control) GPIO ");
  Serial.println(PIN_TAP_A);
  Serial.print("Tap B (pipe 2)          GPIO ");
  Serial.println(PIN_TAP_B);
  Serial.print("Tap C (pipe 3)          GPIO ");
  Serial.println(PIN_TAP_C);
  Serial.println("LCD SDA GPIO 21 | SCL GPIO 22");
  Serial.println("YF-S201: VCC->5V  GND->GND  SIG->GPIO");
  Serial.println("=============================");
}

void printHelp() {
  Serial.println();
  Serial.println("========== COMMANDS ==========");
  Serial.println("help | pins | status | reset");
  Serial.println("sim a 450   (approx 1 L if cal=450)");
  Serial.println("sim b 450");
  Serial.println("sim c 450");
  Serial.println("==============================");
}

void printStatus() {
  Serial.println();
  Serial.println("========== STATUS ==========");
  for (int i = 0; i < 3; i++) {
    Serial.print(taps[i].tapId);
    Serial.print(" | ");
    Serial.print(taps[i].sessionOpen ? "OPEN" : "CLOSED");
    Serial.print(" | Session L: ");
    Serial.print(taps[i].sessionLiters, 4);
    Serial.print(" | Total L: ");
    Serial.print(taps[i].totalLiters, 4);
    Serial.print(" | Pulses: ");
    Serial.println(taps[i].totalPulses);
  }
  Serial.println("============================");
}

void resetCounters() {
  noInterrupts();
  for (int i = 0; i < 3; i++) {
    taps[i].pulses = 0;
    taps[i].lastPulseMs = 0;
    taps[i].lastIsrUs = 0;
  }
  interrupts();

  for (int i = 0; i < 3; i++) {
    taps[i].sessionOpen = false;
    taps[i].sessionLiters = 0.0f;
    taps[i].totalLiters = 0.0f;
    taps[i].totalPulses = 0;
  }

  Serial.println("[RESET] All counters reset.");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Counters Reset");
  delay(1000);
  lcd.clear();
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

  if (line.equalsIgnoreCase("help")) { printHelp(); return; }
  if (line.equalsIgnoreCase("pins")) { printPins(); return; }
  if (line.equalsIgnoreCase("status")) { printStatus(); return; }
  if (line.equalsIgnoreCase("reset")) { resetCounters(); return; }

  if (line.startsWith("sim ")) {
    char letter = 0;
    int pulses = 0;
    if (sscanf(line.c_str(), "sim %c %d", &letter, &pulses) == 2) {
      if (pulses <= 0) {
        Serial.println("Pulse count must be > 0.");
        return;
      }
      int index = tapIndexFromLetter(letter);
      if (index < 0) {
        Serial.println("Unknown tap. Use a, b or c.");
        return;
      }
      noInterrupts();
      taps[index].pulses += (uint32_t)pulses;
      taps[index].lastPulseMs = millis();
      interrupts();
      Serial.print("[SIM] ");
      Serial.print(taps[index].tapId);
      Serial.print(" +");
      Serial.print(pulses);
      Serial.println(" pulses queued.");
      return;
    }
  }

  Serial.println("Unknown command. Type 'help'.");
}

void pollSerial() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialLine.length() > 0) {
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
  delay(1000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("   TapSense Bench — USB / LCD only");
  Serial.println("========================================");

  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
  displayStartup();

  pinMode(PIN_TAP_A, INPUT_PULLUP);
  pinMode(PIN_TAP_B, INPUT_PULLUP);
  pinMode(PIN_TAP_C, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(PIN_TAP_A), onPulseA, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_TAP_B), onPulseB, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_TAP_C), onPulseC, FALLING);

  printPins();
  printHelp();
  Serial.println("System ready. Try: sim a 450");

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TapSense Ready");
  lcd.setCursor(0, 1);
  lcd.print("Open Serial");
  delay(1500);
  lcd.clear();
}

void loop() {
  pollSerial();

  uint32_t now = millis();
  if (now - lastProcessMs >= PROCESS_INTERVAL_MS) {
    lastProcessMs = now;
    processAllTaps();
  }

  if (now - lastLcdSwitchMs >= LCD_SWITCH_INTERVAL_MS) {
    lastLcdSwitchMs = now;
    currentDisplayTap = (currentDisplayTap + 1) % 3;
    displayTap(currentDisplayTap);
  }
}
