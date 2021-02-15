// BrewBench App Yun
// copyright 2020 Andrew Van Tassel
#include <Process.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <avr/wdt.h>
// https://www.brewbench.co/libs/DHTlib-1.2.9.zip
// DHT #include <dht.h>
// DS18B20 #include <OneWire.h>
// DS18B20 #include <DallasTemperature.h>
// DS18B20 #include <Wire.h>
// BMP180 #include <Adafruit_BMP085.h>
// [HEADERS]

String HOSTNAME = "[HOSTNAME]";
uint32_t FREQUENCY_SECONDS = 900;
uint32_t secondCounter = 0;
boolean settingMode = false;
boolean offlineMode = false;
String api_key;
String temp_unit = "F";
BridgeServer server;
// ADC Adafruit_ADS1115 ads(0x48);

HTTPClient http;

// wifi/settings store
Preferences preferences;

#ifndef ARDUINO_BOARD
#define ARDUINO_BOARD "YUN"
#endif

// DHT dht DHT;
// BMP180 Adafruit_BMP085 bmp;

// https://learn.adafruit.com/thermistor/using-a-thermistor
// resistance at 25 degrees C
#define THERMISTORNOMINAL 10000
// temp. for nominal resistance (almost always 25 C)
#define TEMPERATURENOMINAL 25
// how many samples to take and average, more takes longer
// but is more 'smooth'
#define NUMSAMPLES 5
// The beta coefficient of the thermistor (usually 3000-4000)
#define BCOEFFICIENT 3950
// the value of the 'other' resistor
#define SERIESRESISTOR 10000

uint16_t samples[NUMSAMPLES];

void reboot() {
  wdt_disable();
  wdt_enable(WDTO_15MS);
  while (1) {}
}

float Thermistor(float average) {
   // convert the value to resistance
   average = 1023 / average - 1;
   average = SERIESRESISTOR / average;

   float steinhart = average / THERMISTORNOMINAL;     // (R/Ro)
   steinhart = log(steinhart);                  // ln(R/Ro)
   steinhart /= BCOEFFICIENT;                   // 1/B * ln(R/Ro)
   steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
   steinhart = 1.0 / steinhart;                 // Invert
   steinhart -= 273.15;

   return steinhart;
}

void sendHeaders(){
  client.println(F("Status: 200"));
  client.println(F("Access-Control-Allow-Origin: *"));
  client.println(F("Access-Control-Allow-Methods: GET"));
  client.println(F("Access-Control-Expose-Headers: X-Sketch-Version"));
  client.println(F("X-Sketch-Version: [VERSION]"));
  client.println(F("Content-Type: application/json"));
  client.println(F("Connection: close"));
  client.println();
}

void processRest(BridgeClient client) {
  String command = client.readStringUntil('/');
  command.trim();

  String data = "";
  if (command == "digital" || command == "analog" || command == "adc") {
    data = adCommand(client, command);
  }
  else if (command == "reboot") {
    data = client.print("{\"reboot\":true}");
    reboot();
  }
  else if (command == "Thermistor" || command == "PT100" ||
      command == "DHT11" || command == "DHT12" || command == "DHT21" ||
      command == "DHT22" || command == "DHT33" || command == "DHT44" ||
      command == "BMP180" ||
      command.substring(0,12) == "SoilMoisture" ||
      command.substring(0,7) == "DS18B20") {
    data = sensorCommand(client, command);
  }
  else {
    data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"}}";
  }
  webServer.send(200, "application/json", data);
}

void adCommand(BridgeClient client, const String type) {
  String spin = client.readString();
  spin.trim();
  uint8_t pin = spin.substring(1,spin.indexOf("/")).toInt();
  int16_t value = spin.substring(spin.indexOf("/")+1).toInt();

  // write
  if (spin.indexOf("/") != -1) {
    pinMode(pin, OUTPUT);
    if( type == "analog" ){
      analogWrite(pin, value);//0 - 255
    }
    else if( type == "digital" ){
      if(value == 1)
        digitalWrite(pin, LOW);//turn on relay
      else
        digitalWrite(pin, HIGH);//turn off relay
    }
  } else {
    // read
    pinMode(pin, INPUT);
    if( type == "analog" ){
      value = analogRead(pin);
    }
    else if( type == "digital" ){
      value = digitalRead(pin);
    }    
  }

  // Send JSON response to client
  client.print("{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"value\":\""+String(value)+"\",\"sensor\":\""+String(type)+"\"}");
}

String sensorCommand(BridgeClient client, String type) {
  String spin = client.readString();
  spin.trim();
  uint8_t pin = spin.substring(1).toInt();
  float temp = 0.00;
  float raw = 0.00;
  float percent = 0.00;
  float volts = 0.00;
  float resistance = 0.0;

  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"sensor\":\""+String(type)+"\"";

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }
  
  if(type == "Thermistor"){
    if( spin.substring(0,1) == "A" ){
      samples[0] = raw;
      uint8_t i;
      // take N samples in a row, with a slight delay
      for (i=1; i< NUMSAMPLES; i++) {
        samples[i] = analogRead(pin);
        delay(10);
      }
      // average all the samples out
      for (i=0; i< NUMSAMPLES; i++) {
         resistance += samples[i];
      }
      resistance /= NUMSAMPLES;
      raw = resistance;
      temp = Thermistor(resistance);
    }    
  }  
  // DS18B20 else if(type.substring(0,7) == "DS18B20"){
  // DS18B20   int16_t index = -1;
  // DS18B20   if( type.length() > 7 )
  // DS18B20     index = type.substring(8).toInt();
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   if( index > 0 )
  // DS18B20     temp = sensors.getTempCByIndex(index);
  // DS18B20   else
  // DS18B20     temp = sensors.getTempCByIndex(0);
  // DS18B20 }
  
  data += ",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);
  data += "}";
  
  return data;
}

String getPins(){
  String pins = ",\"pins\": [";
  // [PINS]
  pins += "]";
  return pins;
}

void runActions()
{
  // [ACTIONS]  
}

void getHostname(){
  Process p;
  p.runShellCommand("uname -n");
  while(p.running());
  if(p.available() > 0) {
   HOSTNAME = p.readString();
  }
  HOSTNAME.trim();
  if(!HOSTNAME || HOSTNAME == "")
    HOSTNAME = "missing";
}

boolean restoreConfig()
{  
  preferences.begin("brewbench", false);
  api_key = preferences.getString("API_KEY");
  temp_unit = preferences.getString("TEMP_UNIT");
  
  if (preferences.getUInt("FREQ_SEC") >= 900)
    FREQUENCY_SECONDS = preferences.getUInt("FREQ_SEC");
  else
    FREQUENCY_SECONDS = 900;
  
  preferences.end();
}

void setup() {
  
  Serial.begin(115200);
  
  Bridge.begin();
  
  server.listenOnLocalhost();
  
  server.begin();
  
  getHostname();  
  
}

void loop() {
  
  secondCounter += 1;
  
  BridgeClient client = server.accept();

  if (restoreConfig() && client) {
    processRest(client);
    client.stop();
  }

  delay(1000);
}
