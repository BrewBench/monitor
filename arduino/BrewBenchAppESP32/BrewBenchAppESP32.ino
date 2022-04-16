// BrewBench App ESP32
// copyright 2020 Andrew Van Tassel
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>
#include <WiFiClient.h>
#include <Preferences.h>
// [HEADERS]

const IPAddress apIP(192, 168, 4, 1);
const char *apSSID = "BrewBench_SETUP";
uint32_t FREQUENCY_SECONDS = 900;
uint32_t secondCounter = 0;
boolean settingMode = false;
boolean offlineMode = false;
String ssidList;
String wifi_ssid;
String wifi_password;
String api_key;
String device_name;
String device_id;
String temp_unit = "F";
String pressure_unit = "Pa";
float temp = 0.00;
float temp_adjust = 0.00;
float ambient = NULL;
float ambient_adjust = 0.00;
float humidity = NULL;
float moisture = NULL;
float pressure = NULL;
int postResponse;
// DHT DHT12 dht12;
// DHT DHTesp dht22;

WebServer webServer(80);

HTTPClient http;

// wifi/settings store
Preferences preferences;

// DHT DHTesp dht;
// BMP180 Adafruit_BMP085 bmp;
// BMP280 Adafruit_BMP280 bme;

#ifndef ARDUINO_BOARD
#define ARDUINO_BOARD "ESP32"
#endif

#define NUMSAMPLES 5
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

void actionsCommand(const String sensor_name, const String spin, const String type, const float temp_offset)
{
  uint8_t pin = spin.substring(1).toInt();
  float raw = 0.00;
  float volts = 0.00;
  // ADC int16_t adc0 = 0;
  float resistance = 0.0;
  
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
    if (temp && temp_adjust && !isnan(temp_adjust))
      temp = temp + temp_adjust;
    else if (temp && temp_offset && !isnan(temp_offset))
      temp = temp + temp_offset;
  }
  else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
      if (temp && temp_adjust && !isnan(temp_adjust))
        temp = temp + temp_adjust;
      else if (temp && temp_offset && !isnan(temp_offset))
        temp = temp + temp_offset;
    }
  }
  // DS18B20 else if (type.substring(0,7) == "DS18B20")
  // DS18B20 {
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   int8_t index = 0;
  // DS18B20   if( type.length() > 7 )
  // DS18B20     index = type.substring(8).toInt();
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   temp = sensors.getTempCByIndex(index);
  // DS18B20   if (temp != DEVICE_DISCONNECTED_C && temp_adjust && !isnan(temp_adjust))
  // DS18B20     temp = temp + temp_adjust;
  // DS18B20   else if (temp != DEVICE_DISCONNECTED_C && temp_offset && !isnan(temp_offset))
  // DS18B20     temp = temp + temp_offset;
  // DS18B20 }
  // DHT else if (type == "DHT12")
  // DHT {
  // DHT   ambient = dht12.readTemperature();
  // DHT   humidity = dht12.readHumidity();
  // DHT   // not connected check
  // DHT   if (String(humidity) == "0.01")
  // DHT   {
  // DHT     ambient = NULL;
  // DHT     humidity = NULL;
  // DHT   }
  // DHT   else if (ambient_adjust && !isnan(ambient_adjust))
  // DHT   {
  // DHT     ambient = ambient + ambient_adjust;
  // DHT   }
  // DHT   else if (temp_offset && !isnan(temp_offset))
  // DHT   {
  // DHT     ambient = ambient + temp_offset;
  // DHT   }
  // DHT }
  // DHT else if (type == "DHT22")
  // DHT {
  // DHT   dht22.setup(pin, DHTesp::DHT22);
  // DHT   delay(dht22.getMinimumSamplingPeriod());
  // DHT   ambient = dht22.getTemperature();
  // DHT   humidity = dht22.getHumidity();
  // DHT   // not connected check
  // DHT   if (String(humidity) == "0.01")
  // DHT   {
  // DHT     ambient = NULL;
  // DHT     humidity = NULL;
  // DHT   }
  // DHT   else if (ambient_adjust && !isnan(ambient_adjust))
  // DHT   {
  // DHT     ambient = ambient + ambient_adjust;
  // DHT   }
  // DHT   else if (temp_offset && !isnan(temp_offset))
  // DHT   {
  // DHT     ambient = ambient + temp_offset;
  // DHT   }
  // DHT }  
  // BMP180 else if(type == "BMP180"){
  // BMP180   if (bmp.begin()) {
  // BMP180     ambient = bmp.readTemperature();  
  // BMP180     pressure = bmp.readPressure();
  // BMP180   }
  // BMP180 } 
  // BMP280 else if(type == "BMP280"){
  // BMP280   if (bme.begin()) {
  // BMP280     ambient = bme.readTemperature();  
  // BMP280     pressure = bme.readPressure();
  // BMP280   }
  // BMP280 } 
  else if(type.substring(0,12) == "SoilMoisture"){
    uint8_t dpin = -1;
    if(type.substring(0,13) == "SoilMoistureD"){
      dpin = type.substring(13).toInt();
      pinMode(dpin, OUTPUT);
      digitalWrite(dpin, HIGH);
      delay(10);
    }
    raw = analogRead(pin);
    if(dpin >= 0){
      digitalWrite(dpin, LOW);
    }
    moisture = map(raw, 0, 880, 0, 100);
  }
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
  String data = "{\"pin\":\""+String(dpin)+"\",\"value\":\""+String(value)+"\",\"sensor\":\""+String(type)+"\"}";
  if( apin != "" )
    data = "{\"pin\":\""+String(apin)+"\",\"value\":\""+String(value)+"\",\"sensor\":\""+String(type)+"\"}";

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

  String data = "{\"sensor\":\""+String(type)+"\"";
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
    data += ",\"moisture\":"+String(percent);
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

void createSensor(){

  if(device_id == "notset"){
    if (http.begin(F("https://sensor.brewbench.co/sensors_from_device")))
    {
      http.addHeader("X-API-KEY", String(api_key));
      http.addHeader("User-Agent", "BrewBench-Stick/[VERSION]");
      http.addHeader("Content-Type", "application/json");
      String data = "{\"device_name\":\"" + String(device_name) + "\"";
      data += ",\"uid\":\"" + String(api_key) + "\"";            
      data += ",\"type\":\"temp\"";
      data += ",\"model\":\"BrewBench OpenSource\"";
      data += ",\"version\":\"[VERSION]\"";
      data += ",\"temp\":\""+String(temp)+"\"";
      data += ",\"temp_unit\":\"C\"";
      data += ",\"temp_adjust\":\""+String(temp_adjust)+"\"";
      data += ",\"ambient\":\""+String(ambient)+"\"";
      data += ",\"ambient_unit\":\"C\"";
      data += ",\"ambient_adjust\":\""+String(ambient_adjust)+"\"";
      data += ",\"moisture\": \""+String(moisture)+"\"";
      data += ",\"pressure\":" + String(pressure);
      data += ",\"pressure_unit\":\""+String(pressure_unit)+"\"";    
      data += ",\"frequency\":"+String(FREQUENCY_SECONDS);      
      data += ",\"device_ip\":\"" + WiFi.localIP().toString() + "\"";
      data += ",\"rssi\": "+String(WiFi.RSSI());
      data += ",\"mac\":\"" + String(WiFi.macAddress())+"\"";
      data += "}";
      postResponse = http.POST(data);
      if(postResponse == 200){
        
        String body = http.getString();
        if(body.length() > 0 && body.indexOf("{") == -1)
          device_id = urlDecode(body);        
      }      

      Serial.println("Sensor Response");
      Serial.println(device_id);
    
      http.end();
      preferences.begin("brewbench", false);
      preferences.putString("DEVICE_ID", urlDecode(device_id));
      preferences.end();    
    }
  }
}

void postData()
{
  if (api_key.length() > 0 && device_name.length() > 0)
  {
    if(device_id.length() == 0 || device_id == "notset"){
      createSensor();
      delay(10);
    }
    
    String data = "{\"device_name\":\"" + String(device_name) + "\"";
    data += ",\"version\":\"[VERSION]\"";
    data += ",\"uid\":\"" + String(api_key) + "\"";
    data += ",\"sensorsId\":\"" + String(device_id) + "\"";
    // always send temp
    if (temp && !isnan(temp))
      data += ",\"temp\":" + String(temp);
    else
      data += ",\"temp\": \"\"";
    data += ",\"temp_unit\":\"C\"";
    data += ",\"temp_adjust\":" + String(temp_adjust);
    
    // ambient
    if (ambient && !isnan(ambient) && ambient != NULL)
    {
      data += ",\"ambient\":" + String(ambient);
      data += ",\"ambient_unit\":\"C\"";
      data += ",\"ambient_adjust\":" + String(ambient_adjust);
    }
    // humidity
    if (humidity && !isnan(humidity) && humidity != NULL)
      data += ",\"humidity\":" + String(humidity);
      
    // moisture
    if (moisture && !isnan(moisture) && moisture != NULL)
      data += ",\"moisture\":" + String(moisture);
      
    // pressure
    if (pressure && !isnan(pressure) && pressure != NULL){
      data += ",\"pressure\":" + String(pressure);
      data += ",\"pressure_unit\":\""+String(pressure_unit)+"\"";
    }
    
    data += ",\"device_ip\":\"" + WiFi.localIP().toString() + "\"";
    data += ",\"rssi\":" + String(WiFi.RSSI());
    data += "}";

    Serial.println("Posting Data");
    Serial.println(data);

    if (http.begin(F("https://sensor.brewbench.co/readings")))
    {
      http.addHeader("X-API-KEY", String(api_key));
      http.addHeader("User-Agent", "BrewBench-Stick/[VERSION]");
      http.addHeader("Content-Type", "application/json");
      postResponse = http.POST(data);
      Serial.print("POST Response: ");
      Serial.println(postResponse);
      http.end();

      if (postResponse == -1)
      {       
        WiFi.disconnect(true, true);
        ESP.restart();
      }
    }
  }
}

void getTemps()
{
  runActions();

  Serial.println("Temp: " + String(temp) + " C");
  Serial.println("Ambient: " + String(ambient) + " C");
  Serial.println("Humidity: " + String(humidity) + " %");
  
}

boolean restoreConfig()
{  
  preferences.begin("brewbench", false);
  wifi_ssid = preferences.getString("WIFI_SSID");
  wifi_password = preferences.getString("WIFI_PASSWD");
  preferences.end();  
    
  Serial.print("WIFI-SSID: ");
  Serial.println(wifi_ssid);

  Serial.print("WIFI-PASSWD: ");
  Serial.println(wifi_password);

  if (wifi_ssid.length() > 0)
  {
    WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
    MDNS.begin("brewbench");
    return true;
  }
  else
  {
    return false;
  }
}

boolean checkConnection()
{
  int count = 0;
  Serial.println("Waiting for Wi-Fi connection");
  while (count < 30)
  {
    if (WiFi.status() == WL_CONNECTED)
    {
      Serial.println("Connected!");
      return (true);
    }
    delay(500);
    count++;
  }
  return false;
}

void sendHeaders(){
  webServer.sendHeader("Access-Control-Allow-Origin", "*");
  webServer.sendHeader("Access-Control-Allow-Methods", "GET");
  webServer.sendHeader("Access-Control-Expose-Headers", "X-Sketch-Version");
  webServer.sendHeader("X-Sketch-Version", "[VERSION]");
  webServer.sendHeader("Connection", "close");
}

void processRest(const String command) {
  String apin = "";
  String dpin = "";
  int16_t value = -1;
  uint8_t index = 0;
  for (uint8_t i = 0; i < webServer.args(); i++) {
    if( webServer.argName(i) == "dpin" )
      dpin = webServer.arg(i);
    else if( webServer.argName(i) == "apin" )
      apin = webServer.arg(i);
    else if( webServer.argName(i) == "value" )
      value = webServer.arg(i).toInt();
    else if( webServer.argName(i) == "index" )
      index = webServer.arg(i).toInt();
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
  webServer.send(200, "application/json", data);
}

void handleNotFound() {
  String message = "{";
  message += "\"uri\": \""+webServer.uri()+"\"";
  message += ",\"method\": \"";
  message += (webServer.method() == HTTP_GET) ? "GET" : "POST";
  message += "\",\"arguments\": {";
  for (uint8_t i = 0; i < webServer.args(); i++) {
    message += "\"" + webServer.argName(i) + "\":";
    message += "\"" + webServer.arg(i) + "\"";
  }
  message += "}}";

  webServer.send(404, "text/plain", message);
}

void startWebServer()
{
  preferences.begin("brewbench", false);
  api_key = preferences.getString("API_KEY");
  device_name = preferences.getString("DEVICE_NAME");
  device_id = preferences.getString("DEVICE_ID");
  temp_unit = preferences.getString("TEMP_UNIT");
  temp_adjust = preferences.getFloat("TEMP_ADJ") ? preferences.getFloat("TEMP_ADJ") : 0.00;
  ambient_adjust = preferences.getFloat("AMB_ADJ") ? preferences.getFloat("AMB_ADJ") : 0.00;

  if (preferences.getUInt("FREQ_SEC") >= 900)
    FREQUENCY_SECONDS = preferences.getUInt("FREQ_SEC");
  else
    FREQUENCY_SECONDS = 900;
  
  preferences.end();
  webServer.begin();
  webServer.onNotFound(handleNotFound);
  
  webServer.on("/info", []() {
    String data = "{";
    data += "\"model\": \"BrewBench ESP32\"";
    data += ",\"type\":\"opensource\"";
    data += ",\"version\": \"[VERSION]\"";
    data += ",\"temp\": \""+String(temp)+"\"";
    data += ",\"temp_unit\":\"C\"";
    data += ",\"temp_adjust\": \""+String(temp_adjust)+"\"";
    data += ",\"ambient\": \""+String(ambient)+"\"";
    data += ",\"ambient_unit\":\"C\"";
    data += ",\"ambient_adjust\": \""+String(ambient_adjust)+"\"";
    data += ",\"humidity\": \""+String(humidity)+"\"";
    data += ",\"moisture\": \""+String(moisture)+"\"";
    data += ",\"pressure\":" + String(pressure);
    data += ",\"pressure_unit\":\""+String(pressure_unit)+"\"";    
    data += ",\"frequency\": "+String(FREQUENCY_SECONDS)+"";
    data += ",\"device_id\":\"" + String(device_id) + "\"";
    data += ",\"device_name\": \""+String(device_name)+"\"";
    data += ",\"device_ip\": \""+ WiFi.localIP().toString()+"\"";
    data += ",\"rssi\": "+String(WiFi.RSSI());
    data += ",\"mac\":\"" + String(WiFi.macAddress())+"\"";
    if(postResponse)
      data += ",\"last_response_code\": \""+String(postResponse)+"\"";    
    data += getPins();
    data += "}";
    sendHeaders();
    webServer.send(200, "application/json", data);
  });
  
  // endpoints for monitor.brewbench.co
  webServer.on("/arduino/info", [](){
    String data = "{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"";
    data += ",\"RSSI\":"+String(WiFi.RSSI());
    data += ",\"IP\":\""+WiFi.localIP().toString()+"\"";
    data += "}}";
    sendHeaders();
    webServer.send(200, "application/json", data);
  });
  
  webServer.on("/arduino/reboot", [](){
    sendHeaders();
    webServer.send(200, "application/json", "{\"reboot\":true}");
    delay(500);
    ESP.restart();
  });
  
  webServer.on("/arduino/Thermistor", [](){
    sendHeaders();
    processRest("Thermistor");
  });
  webServer.on("/arduino/PT100", [](){
    sendHeaders();
    processRest("PT100");
  });
  webServer.on("/arduino/SoilMoisture", [](){
    sendHeaders();
    processRest("SoilMoisture");
  });
  // DS18B20 webServer.on("/arduino/DS18B20", [](){
  // DS18B20   sendHeaders();
  // DS18B20   processRest("DS18B20");
  // DS18B20 });
  // DHT webServer.on("/arduino/DHT11", [](){
  // DHT   sendHeaders();
  // DHT   processRest("DHT11");
  // DHT });
  // DHT webServer.on("/arduino/DHT22", [](){
  // DHT   sendHeaders();
  // DHT   processRest("DHT22");
  // DHT });
  // BMP180 webServer.on("/arduino/BMP180", [](){
  // BMP180   sendHeaders();
  // BMP180   processRest("BMP180");
  // BMP180 });
    
  if (settingMode)
  {

    Serial.println("Starting Web Server at ");
    Serial.println(WiFi.softAPIP());
    
    webServer.on("/settings", []() {
      String s = "<h1 class='ui header'>Wi-Fi Settings</h1>";
      s += "<p>Please select your Wi-Fi SSID and enter the Wi-Fi password.</p>";
      s += "<form method='get' action='setap' class='ui form' style='max-width: 400px;'>";
      s += "<h4 class='ui dividing header'>Wi-Fi Settings</h4>";
      s += "<div class='field'>";
      s += "<label>SSID</label>";
      if (ssidList != "")
      {
        s += "<select name='ssid' class='ui dropdown'>";
        s += ssidList;
        s += "</select>";
      }
      else
      {
        s += "<input name='ssid' type='text'>";
      }
      s += "</div>";
      s += "<div class='field'><label>Password </label><input name='pass' length=64 type='text'></div>";
      s += "<h4 class='ui dividing header'>BrewBench Settings</h4>";
      s += "<i>(These can be updated/entered later)</i><br/>";
      s += "<a href='https://brewbench.co' target='_blank'>https://brewbench.co</a><br/><br/>";
      s += "<div class='field'><label>API Key</label><input name='api_key' length=255 type='text'></div>";
      if(device_id.length() > 0 && device_id != "notset")
        s += "<div class='field'><label>Device Name</label><input name='device_name' length=255 type='text'></div>";
      else
        s += "<div class='field'><label class='ui red label'>Device Name</label><input name='device_name' length=255 type='text'></div>";      
      s += "<div class='field'><label>Frequency Update</label><div class='ui right labeled input'>";
      s += "<input name='freq' min='15' type='number' length=255 value='" + String(FREQUENCY_SECONDS / 60) + "'> <div class='ui basic label'>Minutes</div></div></div>";
      s += "<div class='field'><label>Temp Adjustment</label><div class='ui right labeled input'><input name='temp_adjust' step='any' type='number' value='" + String(temp_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Ambient Adjustment</label><div class='ui right labeled input'><input name='ambient_adjust' step='any' type='number' value='" + String(ambient_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Display Temp Unit</label><select name='temp_unit' class='ui dropdown'>";
      if (temp_unit == "F")
        s += "<option selected>F</option>";
      else
        s += "<option>F</option>";
      if (temp_unit == "C")
        s += "<option selected>C</option>";
      else
        s += "<option>C</option>";
      s += "</select></div><br/>";
      s += "<input type='submit' value='Save Settings' class='ui primary button'>";
      s += "</form><br/>";
      webServer.send(200, "text/html", makePage("Wi-Fi Settings", s));
    });

    webServer.on("/reset", []() {
      String s = "<div class='ui positive message'><div class='header'>BrewBench Wi-Fi reset.</div>";
      s += "<p>Device is rebooting...Wait 10 seconds then connect to the <label class='ui label'>" + String(apSSID) + "</label> access point and go to <a href='http://192.168.4.1'>http://192.168.4.1.</a></p></div>";
      webServer.send(200, "text/html", makePage("Reset Wi-Fi Settings", s));
      reset();
    });
    
    webServer.on("/setap", []() {
      String ssid = urlDecode(webServer.arg("ssid"));
      Serial.print("SSID: ");
      
      Serial.println(ssid);
      
      String pass = urlDecode(webServer.arg("pass"));
      Serial.print("Password: ");
      Serial.println(pass);
      Serial.println("Writing SSID to EEPROM...");

      preferences.begin("brewbench", false);

      // Store wifi config
      Serial.println("Writing Password to nvr...");
      preferences.putString("WIFI_SSID", ssid);
      preferences.putString("WIFI_PASSWD", pass);

      // Store api key
      api_key = urlDecode(webServer.arg("api_key"));
      Serial.println("Writing API Key to nvr...");
      preferences.putString("API_KEY", urlDecode(webServer.arg("api_key")));

      // Store name
      Serial.println("Writing Name to nvr...");
      preferences.putString("DEVICE_NAME", urlDecode(webServer.arg("device_name")));
      if(webServer.arg("device_id").length() > 0)
        preferences.putString("DEVICE_ID", urlDecode(webServer.arg("device_id")));
        
      if (urlDecode(webServer.arg("temp_unit")) == "C" || urlDecode(webServer.arg("temp_unit")) == "F")
        preferences.putString("TEMP_UNIT", urlDecode(webServer.arg("temp_unit")));
      else
        preferences.putString("TEMP_UNIT", temp_unit);

      if (urlDecode(webServer.arg("freq")).toInt() >= 15)
        preferences.putUInt("FREQ_SEC", (urlDecode(webServer.arg("freq")).toInt() * 60));
      else
        preferences.putUInt("FREQ_SEC", 900);

      preferences.putFloat("TEMP_ADJ", urlDecode(webServer.arg("temp_adj")).toFloat());
      preferences.putFloat("AMB_ADJ", urlDecode(webServer.arg("amb_adj")).toFloat());

      preferences.end();

      Serial.println("Write nvr done!");

      String s = "<div class='ui positive message'><div class='header'>Wi-Fi Connect.</div>";
      s += "<p>Device is rebooting and will connect to the <label class='ui label'>" + String(ssid) + "</label> Wi-Fi network.</p>";
      s += "<p>Look at the device for the web service IP address then connect to that in your browser.</p>";
      s += "</div>";

      webServer.send(200, "text/html", makePage("Wi-Fi Settings", s));

      delay(3000);
      WiFi.disconnect(true, true);
      ESP.restart();
    });
    webServer.onNotFound([]() {
      String s = "<h1 class='ui header'>BrewBench AP mode</h1>";
      s += "<p><a href='settings' class='ui button'>Configure Wi-Fi Settings</a></p>";
      s += "<p><a href='reset' class='ui button'>Reset All Settings</a></p>";
      webServer.send(200, "text/html", makePage("AP mode", s));
    });
  }
  else
  {

    Serial.print("Starting Web Server at ");
    Serial.println(WiFi.localIP());
    
    webServer.on("/post", []() {
      secondCounter = 0;
      postData();
      String s = "<div class='ui positive message'><div class='header'>BrewBench Data has been Posted</div>";
      s += "<p><a href='/'>return to main settings page.</a></p></div>";
      webServer.send(200, "text/html", makePage("Post Data", s));
    });

    webServer.on("/", []() {
      String s = "<h1 class='ui header'>BrewBench OpenSource</h1>";
      if(device_id.length() == 0)
        s += "<div class='ui warning message'>Connect this device with the BrewBench Monitor App.</div>";      
      s += "<form method='get' action='edit' class='ui form' style='max-width: 400px;'>";
      s += "<h4 class='ui dividing header'>Settings</h4>";
      s += "<p><a href='/restart' class='ui button'>Restart Device</a>";
      s += "&nbsp;<a href='/reset' class='ui button' onclick=\"return confirm('Are you sure you want to reset WiFi and all settings?');\">Reset All Settings</a></p>";      
      s += "<h4 class='ui dividing header'>Firmware Settings</h4>";
      s += "<div class='two fields'>";
      s += "<div class='field'><label>Version</label> [VERSION]</div>";
      s += "</div><h4 class='ui dividing header'>Device Info</h4>";
      s += "<a href='/info'>View JSON Device Info</a>";
      s += "</div><h4 class='ui dividing header'>BrewBench Settings</h4>";
      s += "<div class='ui info message'>Set alerts in the app</div>";
      s += "<div class='three fields'>";
      if (api_key.length() > 0)
        s += "<div class='field'><label>API Key</label> Ok <span style='font-size: 18px; color:#21ba45;'>&check;</span></div>";
      else
        s += "<div class='field'><label>API Key</label> Missing <span style='font-size: 18px; color:#db2828;'>&times;</span></div>";
      s += "<div class='field'><label>Frequency</label> " + String(FREQUENCY_SECONDS / 60) + " Minutes</div>";
      s += "<div class='field'><label>Next Post</label> " + String(FREQUENCY_SECONDS - secondCounter) + " Seconds</div></div>";
      s += "<div class='three fields'>";
      s += "<div class='field'><label>Display Temp Unit</label> &deg;" + String(temp_unit) + "</div>";
      s += "<div class='field'><label>Temp Adjustment</label> " + String(temp_adjust) + " &deg;C</div>";
      s += "<div class='field'><label>Ambient Adjustment</label> " + String(ambient_adjust) + " &deg;C</div>";
      s += "</div><div class='ui fluid card'><div class='content center aligned'><div class='header'>";
      if (device_name.length() > 0)
        s += device_name + " <span style='font-size: 18px; color:#21ba45;'>&check;</span>";
      else
        s += "Missing Name <span style='font-size: 18px; color:#db2828;'>&times;</span>";
      
      s += "</div></div><div class='content center aligned'><div class='ui tiny three statistics'>";

      if (!temp || temp == NULL || isnan(temp))
        s += "<div class='blue statistic'><div class='value'>N/A</div><div class='label'>Temp</div></div>";
      else if (temp && temp != NULL && temp_unit == "F")
        s += "<div class='blue statistic'><div class='value'>" + String((temp * 9 / 5) + 32) + "&deg;F</div><div class='label'>Temp</div></div>";
      else if (temp && temp != NULL)
        s += "<div class='blue statistic'><div class='value'>" + String(temp) + "&deg;C</div><div class='label'>Temp</div></div>";
      else
        s += "<div class='blue statistic'><div class='value'>N/A</div><div class='label'>Temp</div></div>";

      if (ambient && ambient != NULL && temp_unit == "F")
        s += "<div class='purple statistic'><div class='value'>" + String((ambient * 9 / 5) + 32) + "&deg;F</div><div class='label'>Ambient</div></div>";
      else if (ambient && ambient != NULL)
        s += "<div class='purple statistic'><div class='value'>" + String(ambient) + "&deg;C</div><div class='label'>Ambient</div></div>";
      else
        s += "<div class='purple statistic'><div class='value'>N/A</div><div class='label'>Ambient</div></div>";

      if (humidity && humidity != NULL)
        s += "<div class='orange statistic'><div class='value'>" + String(humidity) + "%</div><div class='label'>Humidity</div></div>";
      else
        s += "<div class='orange statistic'><div class='value'>N/A</div><div class='label'>Humidity</div></div>";
        
      if (pressure && pressure != NULL)
        s += "<div class='teal statistic' style='min-width: 100%;'><div class='value'>" + String(pressure) + " " + String(pressure_unit) + "</div><div class='label'>Pressure</div></div>";
        
      s += "</div></div></div>";
      s += "<div class='field center aligned'><a class='ui button' href='/post'>Post Data</a> <input type='submit' value='Edit Settings' class='ui primary button'></div>";
      s += "</form>";
      webServer.send(200, "text/html", makePage("BrewBench OpenSource", s));
    });
    webServer.on("/reset", []() {
      String s = "<div class='ui positive message'><div class='header'>BrewBench Wi-Fi reset.</div>";
      s += "<p>Device is rebooting...Wait 10 seconds then connect to the <label class='ui label'>" + String(apSSID) + "</label> access point and go to <a href='http://192.168.4.1'>http://192.168.4.1.</a></p></div>";
      webServer.send(200, "text/html", makePage("Reset Wi-Fi Settings", s));
      reset();
    });
    webServer.on("/restart", []() {
      String s = "<div class='ui positive message'><div class='header'>BrewBench Restart.</div>";
      s += "<p>Device is rebooting...Wait 10 seconds then <a href='/'>return to main settings page.</a></p></div>";
      webServer.send(200, "text/html", makePage("Restarting", s));
      delay(3000);
      ESP.restart();
    });
    webServer.on("/edit", []() {
      String s = "<h1 class='ui header'>Settings</h1>";
      s += "<div class='ui info message'>Connect this device with the BrewBench Monitor App. ";
      s += "<a href='https://brewbench.co' target='_blank'>https://brewbench.co</a></div>";
      s += "<form method='get' action='update_settings' class='ui form' style='max-width: 400px;'>";
      s += "<div class='field'><label>API Key</label><input name='api_key' length=255 type='text' value='" + api_key + "'></div>";
      if(device_id.length() > 0 && device_id != "notset")
        s += "<div class='field'><label>Device Name</label><input name='device_name' length=255 type='text' value='" + device_name + "'></div>";
      else
        s += "<div class='field'><label class='ui red label'>Device Name</label><input name='device_name' length=255 type='text' value='" + device_name + "'></div>";
      s += "<div class='field'><label>Frequency Update</label><div class='ui right labeled input'>";
      s += "<input name='freq' min='15' type='number' length=255 value='" + String(FREQUENCY_SECONDS / 60) + "'> <div class='ui basic label'>Minutes</div></div></div>";
      s += "<div class='field'><label>Temp Adjustment</label><div class='ui right labeled input'><input name='temp_adjust' step='any' type='number' value='" + String(temp_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Ambient Adjustment</label><div class='ui right labeled input'><input name='ambient_adjust' step='any' type='number' value='" + String(ambient_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Display Temp Unit</label><select name='temp_unit' class='ui dropdown'>";
      if (temp_unit == "F")
        s += "<option selected>F</option>";
      else
        s += "<option>F</option>";
      if (temp_unit == "C")
        s += "<option selected>C</option>";
      else
        s += "<option>C</option>";
      s += "</select></div>";
      s += "<div class='field center aligned'><a href='/' class='ui button'>Cancel</a> <input type='submit' value='Save Settings' class='ui primary button'></div>";
      s += "</form>";
      webServer.send(200, "text/html", makePage("Edit Settings", s));
    });
    webServer.on("/update_settings", []() {
      preferences.begin("brewbench", false);

      // Store api key
      Serial.println("Writing API Key to nvr...");
      preferences.putString("API_KEY", urlDecode(webServer.arg("api_key")));

      // Store name
      Serial.println("Writing Name to nvr...");
      preferences.putString("DEVICE_NAME", urlDecode(webServer.arg("device_name")));
      if(webServer.arg("device_id").length() > 0)
        preferences.putString("DEVICE_ID", urlDecode(webServer.arg("device_id")));
        
      if (urlDecode(webServer.arg("temp_unit")) == "C" || urlDecode(webServer.arg("temp_unit")) == "F")
        preferences.putString("TEMP_UNIT", urlDecode(webServer.arg("temp_unit")));
      else
        preferences.putString("TEMP_UNIT", temp_unit);

      if (urlDecode(webServer.arg("freq")).toInt() >= 15)
        preferences.putUInt("FREQ_SEC", (urlDecode(webServer.arg("freq")).toInt() * 60));
      else
        preferences.putUInt("FREQ_SEC", 900);

      preferences.putFloat("TEMP_ADJ", urlDecode(webServer.arg("temp_adjust")).toFloat());
      preferences.putFloat("AMB_ADJ", urlDecode(webServer.arg("ambient_adjust")).toFloat());

      preferences.end();

      Serial.println("Write nvr done!");
      String s = "<div class='ui positive message'><div class='header'>Settings Updated</div>";
      s += "<p>Device is rebooting...Wait 10 seconds then <a href='/'>return to main settings page.</a></p></div>";
      webServer.send(200, "text/html", makePage("Settings", s));
      delay(3000);
      ESP.restart();
    });
  }
  webServer.begin();
}

void reset(){
  settingMode = true;
        
  // reset the config
  preferences.begin("brewbench", false);
  preferences.remove("WIFI_SSID");
  preferences.remove("WIFI_PASSWD");
  preferences.remove("API_KEY");
  preferences.remove("DEVICE_NAME");
  preferences.remove("DEVICE_ID");
  preferences.remove("TEMP_UNIT");
  preferences.remove("TEMP_ADJ");
  preferences.remove("AMB_ADJ");
  preferences.end();
  WiFi.disconnect(true, true);
  ESP.restart();
}

void setupMode()
{
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_MODE_STA);
  delay(100);
  int n = WiFi.scanNetworks();
  delay(100);

  for (int i = 0; i < n; ++i)
  {
    ssidList += "<option value=\"";
    ssidList += WiFi.SSID(i);
    ssidList += "\">";
    ssidList += WiFi.SSID(i) + " " + WiFi.RSSI(i) + "dBm";
    ssidList += "</option>";
  }
  delay(100);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  String macSSID = String(apSSID) + "-" + random(1000, 9999);
  WiFi.softAP(macSSID.c_str());
  WiFi.mode(WIFI_MODE_AP);
  startWebServer();
  Serial.println("Starting Access Point at:");
  Serial.print(macSSID);
  
}

String makePage(String title, String contents)
{
  String s = "<!DOCTYPE html><html><head>";
  s += "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/fomantic-ui/2.8.4/semantic.min.css\" crossorigin=\"anonymous\" />";
  s += "<meta name=\"viewport\" content=\"width=device-width,user-scalable=0\">";
  if (title == "BrewBench OpenSource")
    s += "<meta http-equiv='refresh' content='60'>";
  s += "<title>" + title;
  if (device_name.length() > 0)
  {
    s += " | " + device_name;
  }
  s += "</title></head><body style='padding: 10px;'>";
  s += contents;
  s += "<div class='ui message'>Version: [VERSION] &copy; 2021 <a href='https://www.brewbench.co' target='_blank'>BrewBench</a></div>";
  s += "</body></html>";
  return s;
}

String urlDecode(String input)
{
  String s = input;
  s.replace("%20", " ");
  s.replace("+", " ");
  s.replace("%21", "!");
  s.replace("%22", "\"");
  s.replace("%23", "#");
  s.replace("%24", "$");
  s.replace("%25", "%");
  s.replace("%26", "&");
  s.replace("%27", "\'");
  s.replace("%28", "(");
  s.replace("%29", ")");
  s.replace("%30", "*");
  s.replace("%31", "+");
  s.replace("%2C", ",");
  s.replace("%2E", ".");
  s.replace("%2F", "/");
  s.replace("%2C", ",");
  s.replace("%3A", ":");
  s.replace("%3A", ";");
  s.replace("%3C", "<");
  s.replace("%3D", "=");
  s.replace("%3E", ">");
  s.replace("%3F", "?");
  s.replace("%40", "@");
  s.replace("%5B", "[");
  s.replace("%5C", "\\");
  s.replace("%5D", "]");
  s.replace("%5E", "^");
  s.replace("%5F", "-");
  s.replace("%60", "`");
  return s;
}

void setup()
{

  Serial.begin(115200);

  delay(10);

  if (restoreConfig() && checkConnection())
  {
    settingMode = false;
    startWebServer();
    return;  
  }
  settingMode = true;
  setupMode();
}

void loop()
{
  secondCounter += 1;

  webServer.handleClient();

  if (!offlineMode && !settingMode)
  {
    if (secondCounter == FREQUENCY_SECONDS)
    {
      secondCounter = 0;
      getTemps();
      postData();
    }
  } else if(!offlineMode && settingMode){
    preferences.begin("brewbench", false);
    api_key = preferences.getString("API_KEY");
    device_id = preferences.getString("DEVICE_ID");
    preferences.end();
    // let's reboot incase we got offline
    if(secondCounter == FREQUENCY_SECONDS && api_key.length() > 0 && device_id.length() > 0){
      ESP.restart();
    }
  }
  
  // UPDATE TEMPS every 10 seconds for the web admin
  if(secondCounter % 10 == 0){
    getTemps();
  }

  delay(1000);
  
}
