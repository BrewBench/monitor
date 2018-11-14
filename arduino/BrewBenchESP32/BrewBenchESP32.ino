#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
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
    String data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"";
    data += ",\"RSSI\":"+String(WiFi.RSSI());
    data += ",\"IP\":\""+WiFi.localIP().toString()+"\"";
    data += "}}";
    sendHeaders();
    server.send(200, "application/json", data);
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
  int16_t index = -1;
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
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";

  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }

  server.send(404, "text/plain", message);
}

String adCommand(const String dpin, const String apin, int16_t value, const String type) {
  uint8_t pin;
  if( dpin != "" )
    pin = dpin.substring(1).toInt();
  else
    pin = gpio(apin);

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
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(dpin)+"\",\"value\":"+String(value)+"\",\"sensor\":\""+String(type)+"\"}";
  if( apin != "" )
    data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(apin)+"\",\"value\":"+String(value)+"\",\"sensor\":\""+String(type)+"\"}";

  return data;
}

String sensorCommand(const String dpin, const String apin, const int16_t index, const String type) {
  uint8_t pin;
  if( dpin != "" )
    pin = dpin.substring(1).toInt();
  else
    pin = gpio(apin);
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

  if( apin != "" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( dpin != "" ){
    raw = digitalRead(pin);
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
  else if(type == "SoilMoisture"){
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
    delay(10);
    raw = gpio(apin);
    digitalWrite(pin, LOW);
    percent = map(raw, 0, 880, 0, 100);
    data += ",\"percent\":"+String(percent);
  }
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
  // BMP180   }
  // BMP180 }

  data += ",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);
  data += "}";

  return data;
}

uint8_t gpio(String spin){
  switch( spin.substring(1).toInt() ){
    case 0:
      return 36;
    case 3:
      return 39;
    case 4:
      return 32;
    case 5:
      return 33;
    case 6:
      return 34;
    case 7:
      return 35;
    case 10:
      return 4;
    case 11:
      return 0;
    case 12:
      return 12;
    case 13:
      return 15;
    case 14:
      return 13;
    case 15:
      return 12;
    case 16:
      return 14;
    case 17:
      return 27;
    case 18:
      return 25;
    case 19:
      return 26;
    default:
      return -1;
  }
}

void connect(){
  WiFi.mode(WIFI_STA);
  if (String(WiFi.SSID()) != String(ssid)) {
    WiFi.begin(ssid, password);
  }
  while (WiFi.status() != WL_CONNECTED) {
    delay(50);
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

}

void loop() {
  server.handleClient();
  delay(1000);
}
