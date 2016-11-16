// http://labs.arduino.org/RestServer+and+RestClient
#include <Wire.h>
#include <ArduinoWiFi.h>
// https://www.adafruit.com/product/381
// http://static.cactus.io/downloads/library/ds18b20/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"

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

void process(WifiData client) {
  String command = client.readStringUntil('/');

  if (command == "digital") {
    printOkHeader(client);
    digitalCommand(client);
  }
  if (command == "DS18B20") {
    printOkHeader(client);
    ds18B20Command(client);
  }
  if (command == "Thermistor") {
    printOkHeader(client);
    thermistorCommand(client);
  }
}

void printOkHeader(WifiData client){
    client.println("Status: 200");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Access-Control-Allow-Methods: GET");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println();
}

void digitalCommand(WifiData client) {
  int pin, value;
  pin = client.parseInt();

  if (client.read() == '/') {
    //set pin as output
    pinMode(pin, OUTPUT);
    value = client.parseInt();
    if(value == 1)
      digitalWrite(pin, HIGH);//turn on relay
    else if(value == 0)
      digitalWrite(pin, LOW);//turn off relay
    else
      value = digitalRead(pin);
  }
  else {
    value = digitalRead(pin);
  }

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(value)+"\"}");
  client.println();    //char terminator
}

void ds18B20Command(WifiData client) {
  int pin;
  float temp;
  pin = client.parseInt();
  DS18B20 ds(pin);
  ds.readSensor();
  temp = ds.getTemperature_C();

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(temp)+"\"}");
  client.println();    //char terminator
}

void thermistorCommand(WifiData client) {
  int pin;
  float temp;
  pin = client.parseInt();
  temp = Thermistor(pin);
  
   // Send JSON response to client
   client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(temp)+"\"}");
   client.println();    //char terminator
}

void setup() {

 Wifi.begin();

}

void loop() {

 while(Wifi.available()){
     process(Wifi);
 }
 delay(1000);
}
