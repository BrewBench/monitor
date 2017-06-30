#include <Console.h>
#include <HttpClient.h>
#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// https://www.adafruit.com/product/381
// http://static.cactus.io/downloads/library/ds18b20/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"

const char VERSION[] = "2.6.8";

BridgeServer server;

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

int samples[NUMSAMPLES];

float Thermistor(int pin) {
   uint8_t i;
   float average;

   // take N samples in a row, with a slight delay
   for (i=0; i< NUMSAMPLES; i++) {
     samples[i] = analogRead(pin);
     delay(10);
   }
   // average all the samples out
   average = 0;
   for (i=0; i< NUMSAMPLES; i++) {
      average += samples[i];
   }
   average /= NUMSAMPLES;
   // convert the value to resistance
   average = 1023 / average - 1;
   average = SERIESRESISTOR / average;

   float steinhart;
   steinhart = average / THERMISTORNOMINAL;     // (R/Ro)
   steinhart = log(steinhart);                  // ln(R/Ro)
   steinhart /= BCOEFFICIENT;                   // 1/B * ln(R/Ro)
   steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
   steinhart = 1.0 / steinhart;                 // Invert
   steinhart -= 273.15;

   return steinhart;
}

void process(BridgeClient client) {
  String command = client.readStringUntil('/');
  command.trim();

  if (command == "digital") {
    responseOkHeader(client);
    digitalCommand(client);
  }
  if (command == "analog") {
    responseOkHeader(client);
    analogCommand(client);
  }
  if (command == "DS18B20") {
    responseOkHeader(client);
    ds18B20Command(client);
  }
  if (command == "Thermistor") {
    responseOkHeader(client);
    thermistorCommand(client);
  }
  if (command == "PT100") {
    responseOkHeader(client);
    pt100Command(client);
  }
}

void responseOkHeader(BridgeClient client){
    client.println("Status: 200");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Access-Control-Allow-Methods: GET");
    client.println("Access-Control-Expose-Headers: X-Sketch-Version");
    client.println("X-Sketch-Version: "+String(VERSION));
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println();
}

void digitalCommand(BridgeClient client) {
  int pin, value;
  pin = client.parseInt();

  if (client.read() == '/') {
    //set pin as output
    pinMode(pin, OUTPUT);
    value = client.parseInt();
    if(value == 1)
      digitalWrite(pin, LOW);//turn on relay
    else
      digitalWrite(pin, HIGH);//turn off relay
  }
  else {
    value = digitalRead(pin);
  }

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(value)+"\"}");
}

// https://www.arduino.cc/en/Reference/AnalogWrite
void analogCommand(YunClient client) {
  int pin, value;
  pin = client.parseInt();

  if (client.read() == '/') {
    value = client.parseInt();
    analogWrite(pin, value);//0 - 255
  }
  else {
    value = analogRead(pin);
  }

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(value)+"\"}");
}

void ds18B20Command(BridgeClient client) {
  int pin;
  float temp;
  pin = client.parseInt();
  DS18B20 ds(pin);
  ds.readSensor();
  temp = ds.getTemperature_C();

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(temp)+"\"}");
}

void thermistorCommand(BridgeClient client) {
  int pin;
  float temp;
  pin = client.parseInt();
  temp = Thermistor(pin);

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(temp)+"\"}");
}

// http://www.instructables.com/id/Temperature-Measurement-Tutorial-Part1/
void pt100Command(BridgeClient client) {
  int pin;
  float tvoltage;
  float temp;
  pin = client.parseInt();
  tvoltage = analogRead(pin);
  if (tvoltage>409){
    tvoltage = map(tvoltage,410,1023,0,614);
    temp = (150*tvoltage)/614;
  }

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(temp)+"\"}");
}

void setup() {

  Bridge.begin();
  server.listenOnLocalhost();
  server.begin();

}

void loop() {
  BridgeClient client = server.accept();

  if (client) {
    process(client);
    client.stop();
  }

  delay(1000);
}
