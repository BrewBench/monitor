#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266mDNS.h>
#include <WiFiClient.h>
// [headers]

String HOSTNAME = "[HOSTNAME_TBD]";
const PROGMEM uint8_t FREQUENCY_SECONDS = 60;
uint8_t secondCounter = 0;
const char* ssid     = "[SSID]";
const char* password = "[SSID_PASS]";

ESP8266WebServer server(80);
HTTPClient http;
// DHT DHTesp dht;

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
  int16_t value;
  for (uint8_t i = 0; i < server.args(); i++) {
    if( server.argName(i) == "dpin" )
      dpin = server.arg(i);
    if( server.argName(i) == "apin" )
      apin = server.arg(i);
    else if( server.argName(i) == "value" )
      value = server.arg(i).toInt();
  }
  String data = "";

  if (command == "digital" || command == "analog" || command == "adc") {
    data = adCommand(dpin, apin, value, command);
  }
  else if (command == "DS18B20" || command == "PT100" ||
      command == "DHT11" || command == "DHT22" || command == "SoilMoisture") {
    data = sensorCommand(dpin, apin, command);
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
  if (value) {
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

String sensorCommand(const String dpin, const String apin, const String type) {
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

  if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  // DS18B20 else if(type == "DS18B20"){
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   temp = sensors.getTempCByIndex(0);
  // DS18B20 }
  else if(type == "SoilMoisture"){
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
    delay(10);
    raw = analogRead(apin.substring(1).toInt());
    digitalWrite(pin, LOW);
    percent = map(raw, 0, 880, 0, 100);
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
  // DHT }
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

float actionsCommand(const String source, const String spin, const String type, const float adjustTemp) {
  float temp = 0.00;
  float raw = 0.00;
  float volts = 0.00;
  uint8_t pin;
  if( spin.substring(0,1) == "A" )
    pin = spin.substring(1).toInt();
  else
    pin = gpio(spin);

  float percent = 0.00;
  // ADC int16_t adc0 = 0;
  float resistance = 0.0;

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }

  if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  // DS18B20 else if(type == "DS18B20"){
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   temp = sensors.getTempCByIndex(0);
  // DS18B20 }
  else if(type.substring(0,13) == "SoilMoistureD"){
    uint8_t dpin = type.substring(13).toInt();
    pinMode(dpin, OUTPUT);
    digitalWrite(dpin, HIGH);
    delay(10);
    raw = analogRead(pin);
    digitalWrite(dpin, LOW);
    percent = map(raw, 0, 880, 0, 100);
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
  // DHT }
  // adjust temp if we have it
  if(temp) temp = temp+adjustTemp;
  // Send JSON response to client
  String data = "temperature,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(temp);
  // SoilMoistureD only has percent so replace data
  if(type.substring(0,13) == "SoilMoistureD") {
    data = "percent,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(percent);
    data += "\nbits,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(raw);
  } else if(type.substring(0,3) == "DHT"){
    data += "\npercent,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(percent);
  } else if(percent){
    data += "\npercent,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(percent);
  } else {
    data += "\nbits,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(raw);
  }

  postData(data);

  if(type.substring(0,13) == "SoilMoistureD"){
    return percent;
  } else {
    return temp;
  }
}

void postData(const String data){

  if(http.begin("[INFLUXDB_CONNECTION]")){
    http.setAuthorization("[INFLUXDB_AUTH]");
    http.addHeader("X-API-KEY", "[API_KEY]");
    http.addHeader("User-Agent", "BrewBench/[VERSION]");
    int response = http.POST(data);
    Serial.print("InfluxDB POST Response: ");
    Serial.println(response);
    http.end();
  }

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

void runActions(){
  // [actions]
}

void setup() {

  Serial.begin(115200);

  connect();

  setupRest();

  server.begin();

  server.onNotFound(handleNotFound);

  http.setReuse(true);

  runActions();
}

void loop() {
  server.handleClient();

  secondCounter+=1;
  if( secondCounter == FREQUENCY_SECONDS ){
    // reset the secondCounter
    secondCounter = 0;
    runActions();
  }

  delay(1000);
}
