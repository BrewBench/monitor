#include <Process.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
#include <avr/wdt.h>
// https://www.brewbench.co/libs/DHTlib-1.2.8.zip
#include <dht.h>
// https://www.brewbench.co/libs/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"
// https://github.com/adafruit/Adafruit_ADS1X15
#include <Wire.h>
#include <Adafruit_ADS1015.h>

String HOSTNAME = "notset";
BridgeServer server;
Adafruit_ADS1115 ads(0x48);

dht DHT;

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
  if (command == "reboot") {
    client.print("{\"reboot\":true}");
    reboot();
  }
  if (command == "Thermistor" || command == "DS18B20" || command == "PT100" ||
      command == "DHT11" || command == "DHT12" || command == "DHT21" ||
      command == "DHT22" || command == "DHT33" || command == "DHT44" ||
      command.substring(0,13) == "SoilMoistureD") {
    sensorCommand(client, command);
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
    else if( type == "adc" ){
      value = ads.readADC_SingleEnded(pin);
    }
  }

  // Send JSON response to client
  client.print("{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"value\":"+String(value)+"}");
}

void sensorCommand(BridgeClient client, String type) {
  String spin = client.readString();
  spin.trim();
  uint8_t pin = spin.substring(1).toInt();
  float temp = 0.00;
  float raw = 0.00;
  float percent = 0.00;
  float volts = 0.00;
  int16_t adc0 = 0;
  float resistance = 0.0;

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }
  else if( spin.substring(0,1) == "C" ){
    adc0 = ads.readADC_SingleEnded(pin);
    // raw adc value
    raw = adc0;
    volts = (raw * 0.1875)/1000;
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
    else if( spin.substring(0,1) == "C" ){
      // resistance = (voltage) / current
      resistance = (adc0 * (5.0 / 65535)) / 0.0001;
      float ln = log(resistance / THERMISTORNOMINAL);
      float kelvin = 1 / (0.0033540170 + (0.00025617244 * ln) + (0.0000021400943 * ln * ln) + (-0.000000072405219 * ln * ln * ln));
      // kelvin to celsius
      temp = kelvin - 273.15;
    }
  }
  else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  else if(type.substring(0,13) == "SoilMoistureD"){
    uint8_t dpin = type.substring(13).toInt();
    pinMode(dpin, OUTPUT);
    digitalWrite(dpin, HIGH);
    delay(10);
    raw = analogRead(pin);
    digitalWrite(dpin, LOW);
    percent = map(raw, 0, 880, 0, 100);
  }
  else if(type == "DS18B20"){
    DS18B20 ds(pin);
    ds.readSensor();
    temp = ds.getTemperature_C();
  }
  else if(type == "DHT11" || type == "DHT12" || type == "DHT21" || type == "DHT22" || type == "DHT33" || type == "DHT44"){
    int chk = -1;
    if(type == "DHT11")
      chk = DHT.read11(pin);
    else if(type == "DHT12")
      chk = DHT.read12(pin);
    else if(type == "DHT21")
      chk = DHT.read21(pin);
    else if(type == "DHT22")
      chk = DHT.read22(pin);
    else if(type == "DHT33")
      chk = DHT.read33(pin);
    else if(type == "DHT44")
      chk = DHT.read44(pin);
    if( chk == DHTLIB_OK ){
      temp = DHT.temperature;
      percent = DHT.humidity;
    }
  }
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);
  if(percent || type.substring(0,13) == "SoilMoistureD" || type.substring(0,3) == "DHT") {
    data += ",\"percent\":"+String(percent);
  }
  data += "}";
  // Send JSON response to client
  client.print(data);
}

void getHostname(){
  Process p;
  p.runShellCommand("hostname");
  while(p.running());
  if(p.available() > 0) {
   HOSTNAME = p.readString();
  }
  HOSTNAME.trim();
  if(HOSTNAME == "")
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
  ads.begin();
}

void loop() {
  BridgeClient client = server.accept();

  if (client) {
    processRest(client);
    client.stop();
  }

  delay(1000);
}
