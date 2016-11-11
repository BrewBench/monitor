// http://labs.arduino.org/RestServer+and+RestClient
#include <Wire.h>
#include <ArduinoWiFi.h>
// https://www.adafruit.com/product/381
// http://static.cactus.io/downloads/library/ds18b20/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"
#include "thermistor.h"

uint16_t temp;

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
  int pin, value;
  pin = client.parseInt();
  DS18B20 ds(pin);
  ds.readSensor();
  value = ds.getTemperature_C();

  // Send JSON response to client
  client.print("{\"pin\":\""+String(pin)+"\",\"temp\":\""+String(value)+"\"}");
  client.println();    //char terminator
}

void thermistorCommand(WifiData client) {
  int pin, value;
  pin = client.parseInt();
  THERMISTOR thermistor(pin,        // Analog pin
                      10000,          // Nominal resistance at 25 ºC
                      3950,           // thermistor's beta coefficient
                      10000);         // Value of the series resistor

   temp = thermistor.read();
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
