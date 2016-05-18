#include <Console.h>
#include <HttpClient.h>
#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
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

BridgeServer server;

void process(BridgeClient client) {
  String command = client.readStringUntil('/');
  command.trim();

  client.println("Status: 200");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Access-Control-Allow-Methods: GET");
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.println();

  if (command == "digital") {
    digitalCommand(client);
  }
  if (command == "DS18B20") {
    ds18B20Command(client);
  }    
  if (command == "Thermistor") {
    thermistorCommand(client);
  }
}

void digitalCommand(BridgeClient client) {
  int pin, value;
  pin = client.parseInt();

  if (client.read() == '/') {
    //set pin as output
    pinMode(pin, OUTPUT);
    value = client.parseInt();
    if(value == 1)
      digitalWrite(pin, HIGH);//turn on relay
    else
      digitalWrite(pin, LOW);//turn off relay
  }
  else {
    value = digitalRead(pin);
  }

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(value)+"\"}");

  String key = "D";
  key += pin;
  Bridge.put(key, String(value));
}

void ds18B20Command(BridgeClient client) {
  int pin, value;
  pin = client.parseInt();
  DS18B20 ds(pin);
  ds.readSensor();
  value = ds.getTemperature_C();
  
  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(value)+"\"}");

  String key = "D";
  key += pin;
  Bridge.put(key, String(value));
}

void thermistorCommand(BridgeClient client) {
  int pin, value;

  pin = client.parseInt();

  if (client.read() == '/') {
    value = client.parseInt();
    analogWrite(pin, value);

    // Send JSON response to client
    client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(value)+"\"}");

    String key = "D";
    key += pin;
    Bridge.put(key, String(value));
  }
  else {
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
    steinhart += 1.0 / (TEMPERATURENOMINAL + 295.15); // + (1/To)
    steinhart = 1.0 / steinhart;                 // Invert
    steinhart -= 295.15;

    // Send JSON response to client
    client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(steinhart)+"\",\"average\":\""+String(average)+"\",\"samples\":\""+String(NUMSAMPLES)+"\"}");

    String key = "A";
    key += pin;
    Bridge.put(key, String(value));
  }
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
