#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// https://www.brewbench.co/libs/DHTLib.zip
#include <dht.h>
// https://www.brewbench.co/libs/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"

const PROGMEM char VERSION[] = "3.2.1";

BridgeServer server;
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

void processRest(BridgeClient client) {
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
  if (command == "Thermistor" || command == "DS18B20" || command == "PT100" ||
      command == "DHT11" || command == "DHT12" || command == "DHT21" ||
      command == "DHT22" || command == "DHT33" || command == "DHT44") {
    responseOkHeader(client);
    tempCommand(client, command);
  }
}

void responseOkHeader(BridgeClient client){
  client.println(F("Status: 200"));
  client.println(F("Access-Control-Allow-Origin: *"));
  client.println(F("Access-Control-Allow-Methods: GET"));
  client.println(F("Access-Control-Expose-Headers: X-Sketch-Version"));
  client.print(F("X-Sketch-Version: "));
  client.println(VERSION);
  client.println(F("Content-Type: application/json"));
  client.println(F("Connection: close"));
  client.println();
}

void digitalCommand(BridgeClient client) {
  char spin = client.read();
  int pin = client.parseInt();
  int value;

  if (client.readString().substring(0,1) == "/") {
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
  client.print("{\"pin\":\""+String(spin)+String(pin)+"\",\"value\":\""+String(value)+"\"}");
}

// https://www.arduino.cc/en/Reference/AnalogWrite
void analogCommand(BridgeClient client) {
  char spin = client.read();
  int pin = client.parseInt();
  int value;

  if (client.readString().substring(0,1) == "/") {
    pinMode(pin, OUTPUT);
    value = client.parseInt();
    analogWrite(pin, value);//0 - 255
  }
  else {
    value = analogRead(pin);
  }

  // Send JSON response to client
  client.print("{\"pin\":\""+String(spin)+String(pin)+"\",\"value\":\""+String(value)+"\"}");
}

void tempCommand(BridgeClient client, String type) {
  const String spin = client.readString().substring(0,1);
  int pin = client.parseInt();
  float temp = 0.00;
  float humidity = 0.00;

  if(type == "Thermistor")
    temp = Thermistor(pin);
  else if(type == "PT100"){
    float tvoltage;
    if( spin == "A" )
      tvoltage = analogRead(pin);
    else
      tvoltage = digitalRead(pin);

    if (tvoltage>409){
      tvoltage = map(tvoltage,410,1023,0,614);
      temp = (150*tvoltage)/614;
    }
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
      humidity = DHT.humidity;
    }
  }
  String data = "{\"pin\":\""+String(spin)+String(pin)+"\",\"temp\":\""+String(temp)+"\"";
  if(humidity)
    data += ",\"humidity\":\""+String(humidity)+"\"}";
  else
    data += "}";
  // Send JSON response to client
  client.print(data);
}

void setup() {

  Bridge.begin();
  // Uncomment for REST API open
  server.listenOnLocalhost();
  // Uncomment for REST API with password
  // server.noListenOnLocalhost();
  server.begin();

}

void loop() {
  BridgeClient client = server.accept();

  if (client) {
    processRest(client);
    client.stop();
  }

  delay(1000);
}
