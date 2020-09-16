#include <Process.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
#include <avr/wdt.h>
// https://www.brewbench.co/libs/DHTlib-1.2.9.zip
// DHT #include <dht.h>
// DS18B20 #include <OneWire.h>
// DS18B20 #include <DallasTemperature.h>
// DS18B20 #include <Wire.h>
// BMP180 #include <Adafruit_BMP085.h>

String HOSTNAME = "[HOSTNAME]";
BridgeServer server;
// ADC Adafruit_ADS1115 ads(0x48);

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

void processRest(BridgeClient client) {
  String command = client.readStringUntil('/');
  command.trim();

  client.println(F("Status: 200"));
  client.println(F("Access-Control-Allow-Origin: *"));
  client.println(F("Access-Control-Allow-Methods: GET"));
  client.println(F("Access-Control-Expose-Headers: X-Sketch-Version"));
  client.println(F("X-Sketch-Version: [VERSION]"));
  client.println(F("Content-Type: application/json"));
  client.println(F("Connection: close"));
  client.println();

  if (command == "digital" || command == "analog" || command == "adc") {
    adCommand(client, command);
  }
  else if (command == "reboot") {
    client.print("{\"reboot\":true}");
    reboot();
  }
  else if (command == "Thermistor" || command == "PT100" ||
      command == "DHT11" || command == "DHT12" || command == "DHT21" ||
      command == "DHT22" || command == "DHT33" || command == "DHT44" ||
      command == "BMP180" ||
      command.substring(0,12) == "SoilMoisture" ||
      command.substring(0,7) == "DS18B20") {
    sensorCommand(client, command);
  }
  else {
    client.print("{\"BrewBench\": {\"board\": \""+String(ARDUINO_BOARD)+"\", \"version\": \"[VERSION]\"}}");
  }
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
    // ADC else if( type == "adc" ){
    // ADC   value = ads.readADC_SingleEnded(pin);
    // ADC }
  }

  // Send JSON response to client
  client.print("{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"value\":\""+String(value)+"\",\"sensor\":\""+String(type)+"\"}");
}

void sensorCommand(BridgeClient client, String type) {
  String spin = client.readString();
  spin.trim();
  uint8_t pin = spin.substring(1).toInt();
  float temp = 0.00;
  float raw = 0.00;
  float percent = 0.00;
  float volts = 0.00;
  // ADC int16_t adc0 = 0;
  float resistance = 0.0;

  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"sensor\":\""+String(type)+"\"";

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }
  // ADC else if( spin.substring(0,1) == "C" ){
  // ADC   adc0 = ads.readADC_SingleEnded(pin);
  // ADC   // raw adc value
  // ADC   raw = adc0;
  // ADC   volts = (raw * 0.1875)/1000;
  // ADC }

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
    // ADC else if( spin.substring(0,1) == "C" ){
    // ADC   // resistance = (voltage) / current
    // ADC   resistance = (adc0 * (5.0 / 65535)) / 0.0001;
    // ADC   float ln = log(resistance / THERMISTORNOMINAL);
    // ADC   float kelvin = 1 / (0.0033540170 + (0.00025617244 * ln) + (0.0000021400943 * ln * ln) + (-0.000000072405219 * ln * ln * ln));
    // ADC   // kelvin to celsius
    // ADC   temp = kelvin - 273.15;
    // ADC }
  }
  else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
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
    percent = map(raw, 0, 880, 0, 100);
    data += ",\"percent\":"+String(percent);
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
  // DHT else if(type == "DHT11" || type == "DHT12" || type == "DHT21" || type == "DHT22" || type == "DHT33" || type == "DHT44"){
  // DHT   int chk = -1;
  // DHT   if(type == "DHT11")
  // DHT     chk = DHT.read11(pin);
  // DHT   else if(type == "DHT12")
  // DHT     chk = DHT.read12(pin);
  // DHT   else if(type == "DHT21")
  // DHT     chk = DHT.read21(pin);
  // DHT   else if(type == "DHT22")
  // DHT     chk = DHT.read22(pin);
  // DHT   else if(type == "DHT33")
  // DHT     chk = DHT.read33(pin);
  // DHT   else if(type == "DHT44")
  // DHT     chk = DHT.read44(pin);
  // DHT   if( chk == DHTLIB_OK ){
  // DHT     temp = DHT.temperature;
  // DHT     percent = DHT.humidity;
  // DHT     data += ",\"percent\":"+String(percent);
  // DHT   }
  // DHT }
  // BMP180 else if(type == "BMP180"){
  // BMP180   if (bmp.begin()) {
  // BMP180     temp = bmp.readTemperature();
  // BMP180     data += ",\"altitude\":"+String(bmp.readAltitude());
  // BMP180     data += ",\"pressure\":"+String(bmp.readPressure());
  // BMP180   }
  // BMP180 } 
    else {
      data += ",\"altitude\":0";
      data += ",\"pressure\":0";
  }  

  data += ",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);
  data += "}";
  // Send JSON response to client
  client.print(data);
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

void setup() {

  Bridge.begin();
  // Uncomment for REST API open
  server.listenOnLocalhost();
  // Uncomment for REST API with password
  // server.noListenOnLocalhost();
  server.begin();
  getHostname();
  // ADC ads.begin();
}

void loop() {
  BridgeClient client = server.accept();

  if (client) {
    processRest(client);
    client.stop();
  }

  delay(1000);
}
