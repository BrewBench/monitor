#include <Process.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// [HEADERS]

String HOSTNAME = "[HOSTNAME]";
const PROGMEM uint8_t FREQUENCY_SECONDS = 900; // every 15 minutes
uint8_t secondCounter = 0;
BridgeServer server;

#ifndef ARDUINO_BOARD
#define ARDUINO_BOARD "YUN"
#endif

// DHT dht DHT;

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

  if (command == "digital" || command == "analog") {
    adCommand(client, command);
  }
  else if (command == "Thermistor" ||
      command == "DHT11" || command == "DHT12" || command == "DHT21" ||
      command == "DHT22" || command == "DHT33" || command == "DHT44") {
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
  float volts = 0.00;
  float percent = 0.00;
  float resistance = 0.0;

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
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
  }
  // DHT else if(type == "DHT11" || type == "DHT12" || type == "DHT21" || type == "DHT22" || type == "DHT33" || type == "DHT44"){
  // DHT   int chk = -1;
  // DHT if(type == "DHT11")
  // DHT   chk = DHT.read11(pin);
  // DHT else if(type == "DHT12")
  // DHT   chk = DHT.read12(pin);
  // DHT else if(type == "DHT21")
  // DHT   chk = DHT.read21(pin);
  // DHT else if(type == "DHT22")
  // DHT   chk = DHT.read22(pin);
  // DHT else if(type == "DHT33")
  // DHT   chk = DHT.read33(pin);
  // DHT else if(type == "DHT44")
  // DHT   chk = DHT.read44(pin);
  // DHT if( chk == DHTLIB_OK ){
  // DHT     temp = DHT.temperature;
  // DHT     percent = DHT.humidity;
  // DHT   }
  // DHT }
  
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);  
  if(percent){
    data += ",\"percent\":"+String(percent);    
  }
  data += "}";
  // Send JSON response to client
  client.print(data);
}

float actionsCommand(const String source, const String spin, const String type, const float adjustTemp) {
  float temp = 0.00;
  float raw = 0.00;
  float volts = 0.00;
  uint8_t pin = spin.substring(1).toInt();  
  float resistance = 0.0;

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }
  
  if(type == "Thermistor"){
    if( spin.substring(0,1) == "A" ){
      // don't post if a sensor isn't connected
      if( volts < 2 )
        return -1;
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
  }
  // DHT else if(type == "DHT11" || type == "DHT12" || type == "DHT21" || type == "DHT22" || type == "DHT33" || type == "DHT44"){
  // DHT   int chk = -1;
  // DHT if(type == "DHT11")
  // DHT   chk = DHT.read11(pin);
  // DHT else if(type == "DHT12")
  // DHT   chk = DHT.read12(pin);
  // DHT else if(type == "DHT21")
  // DHT   chk = DHT.read21(pin);
  // DHT else if(type == "DHT22")
  // DHT   chk = DHT.read22(pin);
  // DHT else if(type == "DHT33")
  // DHT   chk = DHT.read33(pin);
  // DHT else if(type == "DHT44")
  // DHT   chk = DHT.read44(pin);
  // DHT if( chk == DHTLIB_OK ){
  // DHT     temp = DHT.temperature;
  // DHT   }
  // DHT }
  
  // adjust temp if we have it
  if(temp) temp = temp+adjustTemp;
  
  return temp;
}

float actionsPercentCommand(const String source, const String spin, const String type, const float adjustTemp) {
  uint8_t pin = spin.substring(1).toInt();
  
  float percent = 0.00;

  // DHT if(type == "DHT11" || type == "DHT12" || type == "DHT21" || type == "DHT22" || type == "DHT33" || type == "DHT44"){
  // DHT   int chk = -1;
  // DHT if(type == "DHT11")
  // DHT   chk = DHT.read11(pin);
  // DHT else if(type == "DHT12")
  // DHT   chk = DHT.read12(pin);
  // DHT else if(type == "DHT21")
  // DHT   chk = DHT.read21(pin);
  // DHT else if(type == "DHT22")
  // DHT   chk = DHT.read22(pin);
  // DHT else if(type == "DHT33")
  // DHT   chk = DHT.read33(pin);
  // DHT else if(type == "DHT44")
  // DHT   chk = DHT.read44(pin);
  // DHT if( chk == DHTLIB_OK ){
  // DHT     percent = DHT.humidity;
  // DHT   }
  // DHT }
  
  return percent;
}

void postStreams(const String data){
  Process p;
  p.begin(F("curl"));
  p.addParameter(F("-k"));
  p.addParameter(F("-XPOST"));
  p.addParameter(F("-H"));
  p.addParameter(F("User-Agent: BrewBench/[VERSION]"));
  p.addParameter(F("-H"));
  p.addParameter(F("Content-Type: application/json"));
  p.addParameter(F("-H"));
  p.addParameter(F("[BF_AUTH]"));
  p.addParameter(F("-d"));
  p.addParameter(data);
  p.addParameter(F("https://pro.brewersfriend.com/homebrew/equipment"));  
  p.runAsynchronously();
  while(p.running());
}

void runActions(){
  // [ACTIONS]
  
  if(equipment_name && temp){
    String data = "{\"name\":\""+String(equipment_name)+"\"";
    data += ",\"report_source\":\"BrewBench\"";
    data += ",\"temp\":"+String(temp);
    data += ",\"temp_unit\":\"C\"";    
    if(ambient){
      data += ",\"ambient\":"+String(ambient);  
    }
    if(humidity){
      data += ",\"humidity\":"+String(humidity);  
    }
    data += "}";
    postStreams(data);    
  }
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
  server.listenOnLocalhost();
  server.begin();
  getHostname();
  runActions();
}

void loop() {
  BridgeClient client = server.accept();

  if (client) {
    processRest(client);
    client.stop();
  }
  secondCounter+=1;
  if( secondCounter == FREQUENCY_SECONDS ){
    // reset the secondCounter
    secondCounter = 0;
    runActions();
  }

  delay(1000);
}
