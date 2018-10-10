#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
// https://github.com/beegee-tokyo/DHTesp
#include "DHTesp.h"
#include <OneWire.h>
#include <DallasTemperature.h>

String HOSTNAME = "[HOSTNAME_TBD]";
const char* ssid     = "[SSID]";
const char* password = "[SSID_PASS]";

ESP8266WebServer server(80);
DHTesp dht;

void setupRest() {

  server.on("/", [](){
    String data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"}}";
    sendHeaders();
    server.send(200, "application/json", data);
  });

  server.on("/arduino/info", [](){
    String data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"}}";
    sendHeaders();
    server.send(200, "application/json", data);
  });

  server.on("/arduino/PT100", [](){
    sendHeaders();
    processRest("PT100");
  });
  server.on("/arduino/DS18B20", [](){
    sendHeaders();
    processRest("DS18B20");
  });
  server.on("/arduino/DHT11", [](){
    sendHeaders();
    processRest("DHT11");
  });
  server.on("/arduino/DHT22", [](){
    sendHeaders();
    processRest("DHT22");
  });
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
  else if (command == "DS18B20" || command == "PT100" ||
      command == "DHT11" || command == "DHT22" || command == "SoilMoisture") {
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
    pin = gpio(dpin);
  else
    pin = apin.substring(1).toInt();

  // write
  if ( value >= 0 ) {
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
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(dpin)+"\",\"value\":"+String(value)+"\",\"sensor\":\""+String(type)+"\"}";
  if( apin != "" )
    data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(apin)+"\",\"value\":"+String(value)+"\",\"sensor\":\""+String(type)+"\"}";

  return data;
}

String sensorCommand(const String dpin, const String apin, const int16_t index, const String type) {
  uint8_t pin;
  if( dpin != "" )
    pin = gpio(dpin);
  else
    pin = apin.substring(1).toInt();
  float temp = 0.00;
  float raw = 0.00;
  float percent = 0.00;
  float volts = 0.00;
  // ADC int16_t adc0 = 0;
  float resistance = 0.0;

  if( apin != "" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( dpin != "" ){
    raw = digitalRead(pin);
  }

  // Start sensors
  if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  else if(type == "DS18B20"){
    OneWire oneWire(pin);
    DallasTemperature sensors(&oneWire);
    sensors.begin();
    sensors.requestTemperatures();
    if( index > 0 )
      temp = sensors.getTempCByIndex(index);
    else
      temp = sensors.getTempCByIndex(0);
  }
  else if(type == "SoilMoisture"){
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
    delay(10);
    raw = analogRead(apin.substring(1).toInt());
    digitalWrite(pin, LOW);
    percent = map(raw, 0, 880, 0, 100);
  }
  else if(type == "DHT11" || type == "DHT12"){
    if(type == "DHT11"){
      dht.setup(pin, DHTesp::DHT11);
      delay(dht.getMinimumSamplingPeriod());
      temp = dht.getTemperature();
      percent = dht.getHumidity();
    } else if(type == "DHT22"){
      dht.setup(pin, DHTesp::DHT22);
      delay(dht.getMinimumSamplingPeriod());
      temp = dht.getTemperature();
      percent = dht.getHumidity();
    }
    if(isnan(temp)) temp = 0;
    if(isnan(percent)) percent = 0;
  }

  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(dpin)+"\",\"temp\":"+String(temp)+",\"sensor\":\""+String(type)+"\"";
  if( apin != "" )
    data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(apin)+"\",\"temp\":"+String(temp)+",\"sensor\":\""+String(type)+"\"";
  data += ",\"raw\":"+String(raw)+",\"volts\":"+String(volts);
  if(percent || type == "SoilMoisture" || type.substring(0,3) == "DHT") {
    data += ",\"percent\":"+String(percent);
  }
  data += "}";

  return data;
}

uint8_t gpio(String spin){
  switch( spin.substring(1).toInt() ){
    case 0:
      return 16;
    case 1:
      return 5;
    case 2:
      return 4;
    case 3:
      return 0;
    case 4:
      return 2;
    case 5:
      return 14;
    case 6:
      return 12;
    case 7:
      return 13;
    case 8:
      return 15;
    case 9:
      return 3;
    case 10:
      return 1;
  }
  return -1;
}

void connect(){
  WiFi.mode(WIFI_STA);
  if (String(WiFi.SSID()) != String(ssid)) {
    WiFi.begin(ssid, password);
  }
  while (WiFi.status() != WL_CONNECTED) {
    delay(50);
  }
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Start the mDNS responder to set hostname bbesp.local
  if (MDNS.begin("bbesp"))
    HOSTNAME = "bbesp.local";
  else
    HOSTNAME = WiFi.hostname();

  Serial.print("Host: ");
  Serial.println(HOSTNAME);
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
