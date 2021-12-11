#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ArduinoOTA.h>
// [HEADERS]

String HOSTNAME = "[HOSTNAME]";
const char* ssid     = "[SSID]";
const char* password = "[SSID_PASS]";

WebServer server(80);

// DHT DHTesp dht;
// BMP180 Adafruit_BMP085 bmp;

#ifndef ARDUINO_BOARD
#define ARDUINO_BOARD "ESP32"
#endif

// how many samples to take and average, more takes longer
// but is more 'smooth'
#define NUMSAMPLES 5
// the value of the 'other' resistor
#define SERIESRESISTOR 147000

uint16_t samples[NUMSAMPLES];

float Thermistor(float average) {
  float V_NTC = average / 1024;
  float R_NTC = (SERIESRESISTOR * V_NTC) / (3.3 - V_NTC);
  R_NTC = log(R_NTC);
  float Temp = 1 / (0.001129148 + (0.000234125 + (0.0000000876741 * R_NTC * R_NTC ))* R_NTC );
  Temp = Temp - 273.15;
  return Temp;
}

void setupRest() {

  server.on("/", [](){
    String data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"";
    data += ",\"RSSI\":"+String(WiFi.RSSI());
    data += ",\"IP\":\""+WiFi.localIP().toString()+"\"";
    data += "}}";
    sendHeaders();
    server.send(200, "application/json", data);
  });

  server.on("/arduino/info", [](){
    String data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\", \"status\": \"restarting\"";
    data += ",\"RSSI\":"+String(WiFi.RSSI());
    data += ",\"IP\":\""+WiFi.localIP().toString()+"\"";
    data += "}}";
    sendHeaders();
    server.send(200, "application/json", data);
  });

  server.on("/arduino/reboot", [](){
    sendHeaders();
    server.send(200, "application/json", "{\"reboot\":true}");
    delay(500);
    ESP.restart();
  });

  server.on("/arduino/Thermistor", [](){
    sendHeaders();
    processRest("Thermistor");
  });
  server.on("/arduino/PT100", [](){
    sendHeaders();
    processRest("PT100");
  });
  server.on("/arduino/SoilMoisture", [](){
    sendHeaders();
    processRest("SoilMoisture");
  });
  // DS18B20 server.on("/arduino/DS18B20", [](){
  // DS18B20   sendHeaders();
  // DS18B20   processRest("DS18B20");
  // DS18B20 });
  // DHT server.on("/arduino/DHT11", [](){
  // DHT   sendHeaders();
  // DHT   processRest("DHT11");
  // DHT });
  // DHT server.on("/arduino/DHT22", [](){
  // DHT   sendHeaders();
  // DHT   processRest("DHT22");
  // DHT });
  // BMP180 server.on("/arduino/BMP180", [](){
  // BMP180   sendHeaders();
  // BMP180   processRest("BMP180");
  // BMP180 });
}

void sendHeaders(){
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET");
  server.sendHeader("Access-Control-Expose-Headers", "X-Sketch-Version");
  server.sendHeader("X-Sketch-Version", "[VERSION]");
  server.sendHeader("Connection", "close");
}

void processRest(const String command) {
  String apin = "";
  String dpin = "";
  int16_t value = -1;
  uint8_t index = 0;
  for (uint8_t i = 0; i < server.args(); i++) {
    if( server.argName(i) == "dpin" )
      dpin = server.arg(i);
    else if( server.argName(i) == "apin" )
      apin = server.arg(i);
    else if( server.argName(i) == "value" )
      value = server.arg(i).toInt();
    else if( server.argName(i) == "index" )
      index = server.arg(i).toInt();
  }
  String data = "";

  if (command == "digital" || command == "analog" || command == "adc") {
    data = adCommand(dpin, apin, value, command);
  }
  else if (command == "Thermistor" || command == "DS18B20" || command == "PT100" ||
      command == "DHT11" || command == "DHT22" || command == "SoilMoisture" ||
      command == "BMP180") {
    data = sensorCommand(dpin, apin, index, command);
  }
  server.send(200, "application/json", data);
}

void handleNotFound() {
  String message = "{";
  message += "\"uri\": \""+server.uri()+"\"";
  message += ",\"method\": \"";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\",\"arguments\": {";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += "\"" + server.argName(i) + "\":";
    message += "\"" + server.arg(i) + "\"";
  }
  message += "}}";
  
  server.send(404, "text/plain", message);
}

String adCommand(const String dpin, const String apin, int16_t value, const String type) {
  uint8_t pin;
  if( dpin != "" )
    pin = dpin.substring(1).toInt();
  else
    pin = apin.substring(1).toInt();

  // write
  if ( value >= 0 ) {
    pinMode(pin, OUTPUT);
    if( type == "analog" ){
      ledcWrite(pin, value);//0 - 255
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
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(dpin)+"\",\"value\":\""+String(value)+"\",\"sensor\":\""+String(type)+"\"}";
  if( apin != "" )
    data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(apin)+"\",\"value\":\""+String(value)+"\",\"sensor\":\""+String(type)+"\"}";

  return data;
}

String sensorCommand(const String dpin, const String apin, const uint8_t index, const String type) {
  uint8_t pin;
  if( dpin != "" )
    pin = dpin.substring(1).toInt();
  else
    pin = apin.substring(1).toInt();
  float temp = 0.00;
  float raw = 0.00;
  float percent = 0.00;
  float volts = 0.00;
  float resistance = 0.0;

  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"sensor\":\""+String(type)+"\"";
  if( dpin != "" )
    data += ",\"pin\":\""+String(dpin)+"\"";
  else
    data += ",\"pin\":\""+String(apin)+"\"";

  if( dpin != "" ){
    raw = digitalRead(pin);
  } else {
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }

  // Start sensors
  if(type == "Thermistor"){
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
  else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  else if(type == "SoilMoisture"){
    if( dpin != "" ){
      pinMode(pin, OUTPUT);
      digitalWrite(pin, HIGH);
      delay(10);
    }
    raw = analogRead(apin.substring(1).toInt());
    if( dpin != "" ){
      digitalWrite(pin, LOW);
    }
    // ESP32 has 12bits of resolution instead of 10
    raw = map(raw, 0, 4095, 0, 880);
    percent = map(raw, 0, 880, 0, 100);
    data += ",\"percent\":"+String(percent);
  }
  // DS18B20 else if(type == "DS18B20"){
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   if( index > 0 )
  // DS18B20     temp = sensors.getTempCByIndex(index);
  // DS18B20   else
  // DS18B20     temp = sensors.getTempCByIndex(0);
  // DS18B20 }
  // DHT else if(type == "DHT11" || type == "DHT12"){
  // DHT   if(type == "DHT11"){
  // DHT     dht.setup(pin, DHTesp::DHT11);
  // DHT     delay(dht.getMinimumSamplingPeriod());
  // DHT     temp = dht.getTemperature();
  // DHT     percent = dht.getHumidity();
  // DHT   } else if(type == "DHT22"){
  // DHT     dht.setup(pin, DHTesp::DHT22);
  // DHT     delay(dht.getMinimumSamplingPeriod());
  // DHT     temp = dht.getTemperature();
  // DHT     percent = dht.getHumidity();
  // DHT   }
  // DHT   if(isnan(temp)) temp = 0;
  // DHT   if(isnan(percent)) percent = 0;
  // DHT   data += ",\"percent\":"+String(percent);
  // DHT }
  // BMP180 else if(type == "BMP180"){
  // BMP180   if (bmp.begin()) {
  // BMP180     temp = bmp.readTemperature();
  // BMP180     data += ",\"altitude\":"+String(bmp.readAltitude());
  // BMP180     data += ",\"pressure\":"+String(bmp.readPressure());
  // BMP180   } else {
  // BMP180     data += ",\"altitude\":0";
  // BMP180     data += ",\"pressure\":0";
  // BMP180   }
  // BMP180 }

  data += ",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);
  data += "}";

  return data;
}

void connect(){
  WiFi.mode(WIFI_STA);
  if (String(WiFi.SSID()) != String(ssid)) {
    WiFi.begin(ssid, password);
  }
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
   Serial.println("Connection Failed! Rebooting...");
   delay(5000);
   ESP.restart();
 }

  if (MDNS.begin("[HOSTNAME]"))
    HOSTNAME = "[HOSTNAME]";
  else
    HOSTNAME = WiFi.setHostname("[HOSTNAME]");

  Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Host %s.local\n", HOSTNAME.c_str());
  Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());
}

void setup() {

  Serial.begin(115200);

  connect();

  setupRest();

  server.begin();

  server.onNotFound(handleNotFound);

  ArduinoOTA.setPort(3232);

  ArduinoOTA.setHostname(HOSTNAME.c_str());

  ArduinoOTA.setPasswordHash("[ARDUINO_PASS]");

  ArduinoOTA.onStart([]() {
    String type;

    if (ArduinoOTA.getCommand() == U_FLASH)
      type = "sketch";
    else // U_SPIFFS
      type = "filesystem";

    // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
    Serial.println("Start updating " + type);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });

  ArduinoOTA.begin();
}

void loop() {
  server.handleClient();
  ArduinoOTA.handle();
  delay(1000);
}
