#include <Console.h>
#include <HttpClient.h>
#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>

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
  if (command == "analog") {
    analogCommand(client);
  }
  if (command == "blink") {
    blinkCommand(client);
  }
}

void digitalCommand(BridgeClient client) {
  int pin, value;
  pin = client.parseInt();

  if (client.read() == '/') {
    value = client.parseInt();
    digitalWrite(pin, value);
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

void analogCommand(BridgeClient client) {
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

void blinkCommand(BridgeClient client) {
  int pin;
  pin = client.parseInt();

  if (client.read() != '/') {
    client.println(F("error"));
    return;
  }

  String mode = client.readStringUntil('\r');

  if (mode == "input") {
    pinMode(pin, INPUT);
    // Send JSON response to client
    client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(mode)+"\"}");
    return;
  }

  if (mode == "output") {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);   // turn the LED on (HIGH is the voltage level)
    delay(1000);              // wait for a second
    digitalWrite(pin, LOW);    // turn the LED off by making the voltage LOW
    delay(1000);
    // Send JSON response to client
    client.print("{\"pin\":\""+String(pin)+"\",\"value\":\""+String(mode)+"\"}");
    return;
  }

  client.print(F("error: invalid mode "));
  client.print(mode);
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
