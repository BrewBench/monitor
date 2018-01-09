#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// https://www.brewbench.co/libs/DHTLib.zip
#include <dht.h>
// https://www.brewbench.co/libs/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"

const PROGMEM char VERSION[] = "3.1.3";
const PROGMEM int FREQUENCY_SECONDS = [FREQUENCY_SECONDS];
int secondCounter = 0;

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
  if (command == "Thermistor" || command == "DS18B20" || command == "PT100" || command == "DHT11" || command == "DHT21" || command == "DHT22") {
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
  client.print("{\"pin\":\""+String(spin)+String(pin)+"\",\"value\":\""+String(value)+"\"}");
}

// https://www.arduino.cc/en/Reference/AnalogWrite
void analogCommand(BridgeClient client) {
  char spin = client.read();
  int pin = client.parseInt();
  int value;

  if (client.read() == '/') {
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
  char spin = client.read();
  int pin = client.parseInt();
  float temp;
  float humidity;

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
  else if(type == "DHT11" || type == "DHT21" || type == "DHT22"){
    int chk;
    if(type == "DHT11")
      chk = DHT.read11(pin);
    else if(type == "DHT21")
      chk = DHT.read21(pin);
    else if(type == "DHT22")
      chk = DHT.read22(pin);
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

void digitalAutoCommand(int pin, int value) {
  pinMode(pin, OUTPUT);
  if(value == 1)
    digitalWrite(pin, LOW);//turn on relay
  else if(value == 0)
    digitalWrite(pin, HIGH);//turn off relay
}

void analogAutoCommand(int pin, int value) {
  pinMode(pin, OUTPUT);
  analogWrite(pin, value);
}

void postData(String connection, String data, String dataType, String contentType){
  Process p;
  p.begin(F("curl"));
  p.addParameter(F("-k"));
  p.addParameter(F("-XPOST"));
  if(contentType != ""){
    p.addParameter(F("-H"));
    p.addParameter(contentType);
  }
  if(dataType == "")
    p.addParameter(F("-d"));
  else
    p.addParameter(dataType);
  p.addParameter(data);
  p.addParameter(connection);
  p.run();
  while(p.running());
}

String dweetAutoCommand(String source, String brewer, String beer, float temp){
  postData(F("https://dweet.io/dweet/for/brewbench"), "{\"brewer\":\""+brewer+"\",\"beer\":\""+beer+"\",\"source\":\""+source+"\",\"temp\":"+String(temp)+"}", "", F("Content-Type: application/json"));
}

String slackAutoCommand(String type, String source, String pin, float temp, int target, int diff) {
  String msg = "";
  String color = "";
  if(type=="heat"){
    msg = source+" temp is "+String(temp)+"\u00B0 and is heating";
    color = F("danger");
  } else if(type=="cool"){
    msg = source+" temp is "+String(temp)+"\u00B0 and is cooling";
    color = F("#3498DB");
  }
  String data = "{\"attachments\": [{\"fallback\": "+msg+",\"title\": \""+source+"\",\"fields\": [{\"value\": "+msg+"}],\"color\": \""+color+"\",\"mrkdwn_in\": [\"text\", \"fallback\", \"fields\"],\"thumb_url\": \"https://monitor.brewbench.co/assets/img/fermenter.png\"}]}";
  postData(F("[SLACK_CONNECTION]"), "payload="+data, "", F("Content-Type: application/x-www-form-urlencoded"));
}

void tplinkAutoCommand(String deviceId, int value){
  String data = "{\"method\":\"passthrough\",\"params\":{\"deviceId\":\""+String(deviceId)+"\",\"requestData\":\"{\\\"system\\\":{\\\"set_relay_state\\\":{\\\"state\\\":"+String(value)+"}}}\"}}";
  postData(F("[TPLINK_CONNECTION]"), data, "", F("Content-Type: application/json"));
}

float influxDBCommand(String source, String spin, String type, int adjustTemp) {
  float temp;
  float humidity;
  int pin = spin.substring(1).toInt();
  if(type == "Thermistor")
    temp = Thermistor(pin);
  else if(type == "PT100"){
    float tvoltage;
    if( spin.substring(0,1) == "A" )
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
  else if(type == "DHT11" || type == "DHT21" || type == "DHT22"){
    int chk;
    if(type == "DHT11")
      chk = DHT.read11(pin);
    else if(type == "DHT21")
      chk = DHT.read21(pin);
    else if(type == "DHT22")
      chk = DHT.read22(pin);
    if( chk == DHTLIB_OK ){
      temp = DHT.temperature;
      humidity = DHT.humidity;
    }
  }
  // adjust temp if we have it
  if(temp) temp = temp+adjustTemp;
  // Send JSON response to client
  String data = "temperature,sensor="+type+",pin="+spin+",source="+source+" temp="+String(temp);
  // Add humidity if we have it
  if(humidity) data = data+" humidity="+String(humidity);

  postData(F("[INFLUXDB_CONNECTION]"), data, F("--data-binary"), "");

  return temp;
}

void trigger(String type, String source, String spin, float temp, int target, int diff, boolean slack) {
  String pinType = spin.substring(0,1);
  String deviceId;
  int pinNumber;
  int changeTo;
  if(pinType == "T"){ //TP Link
    deviceId = spin.substring(3);
  } else {
    pinNumber = spin.substring(1).toInt();
  }

  if(type == "heat"){
    if( temp < (target+diff) )
      changeTo = 1;
    else
      changeTo = 0;
  } else if(type == "cool"){
    if( temp > (target+diff) )
      changeTo = 1;
    else
      changeTo = 0;
  }
  if(pinType == "A")
    analogAutoCommand(pinNumber, changeTo);
  else if(pinType == "D")
    digitalAutoCommand(pinNumber, changeTo);
  else if(pinType == "T" && deviceId)
    tplinkAutoCommand(deviceId, changeTo);

  if(slack && changeTo == 1)
    slackAutoCommand(type, source, spin, temp, target, diff);
}

void InfluxDB(){
  float temp;
  // [actions]
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
  secondCounter+=1;
  if( secondCounter == FREQUENCY_SECONDS ){
    // reset the secondCounter
    secondCounter = 0;
    InfluxDB();
  }

  delay(1000);
}
