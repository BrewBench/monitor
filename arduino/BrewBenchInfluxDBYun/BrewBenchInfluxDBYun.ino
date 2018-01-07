#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// https://www.brewbench.co/libs/DHTLib.zip
#include <dht.h>
// https://www.brewbench.co/libs/cactus_io_DS18B20.zip
#include "cactus_io_DS18B20.h"

const String VERSION = "3.1.3";
const String INFLUXDB_CONNECTION = "[INFLUXDB_CONNECTION]";
const String TPLINK_CONNECTION = "[TPLINK_CONNECTION]";
const String SLACK_CONNECTION = "[SLACK_CONNECTION]";
const String DWEET_CONNECTION = "https://dweet.io/dweet/for/brewbench";
const int FREQUENCY_SECONDS = [FREQUENCY_SECONDS];
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
  if (command == "test") {
    responseOkHeader(client);
    testCommand(client);
  }
  if (command == "Thermistor" || command == "DS18B20" || command == "PT100" || command == "DHT11" || command == "DHT21" || command == "DHT22") {
    responseOkHeader(client);
    tempCommand(client, command);
  }
}

void responseOkHeader(BridgeClient client){
    client.println("Status: 200");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Access-Control-Allow-Methods: GET");
    client.println("Access-Control-Expose-Headers: X-Sketch-Version");
    client.println("X-Sketch-Version: "+VERSION);
    client.println("Content-Type: application/json");
    client.println("Connection: close");
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

void testCommand(BridgeClient client) {
  // Dweet Test
  client.println("Testing Dweet");
  String response = dweetAutoCommand("Test", "BrewBench", "Big IPA", 20);
  client.println(response);
  // Slack Test
  if(SLACK_CONNECTION != ""){
    client.println("Testing Slack");
    response = slackAutoCommand("cool", "Test", "A0", 20, 22, 1);
    client.println(response);
  }
  client.print("");
}

void tempCommand(BridgeClient client, String type) {
  char spin = client.read();
  int pin = client.parseInt();
  float tvoltage;
  int chk;
  float temp;
  float humidity;

  if(type == "Thermistor")
    temp = Thermistor(pin);
  else if(type == "PT100"){
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
  else if(type == "DHT11")
    chk = DHT.read11(pin);
  else if(type == "DHT21")
    chk = DHT.read21(pin);
  else if(type == "DHT22")
    chk = DHT.read22(pin);
  if(type == "DHT11" || type == "DHT21" || type == "DHT22"){
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

String postData(String connection, String data, String dataType, String contentType){
  String response = "";
  Process p;
  p.begin("curl");
  p.addParameter("-k");
  p.addParameter("-XPOST");
  p.addParameter("-H");
  if(contentType != "")
    p.addParameter("Content-Type: "+contentType);
  if(dataType == "")
    p.addParameter("-d");
  else
    p.addParameter(dataType);
  p.addParameter(data);
  p.addParameter(connection);
  /* p.runAsynchronously(); */
  p.run();
  while(p.running());
  while(p.available() > 0)
    response = p.readString();
  return response;
}

String dweetAutoCommand(String source, String brewer, String beer, float temp){
  String data = "{\"brewer\":\""+brewer+"\",\"beer\":\""+beer+"\",\"source\":\""+source+"\",\"temp\":"+String(temp)+"}";
  String response = postData(DWEET_CONNECTION, data, "", "application/json");
  return response;
}

String slackAutoCommand(String type, String source, String pin, float temp, int target, int diff) {
  String msg = "";
  String color = "";
  if(type=="heat"){
    msg = source+" temp is "+String(temp)+"\u00B0 and is heating";
    color = "danger";
  } else if(type=="cool"){
    msg = source+" temp is "+String(temp)+"\u00B0 and is cooling";
    color = "#3498DB";
  }
  String data = "{\"attachments\": [{\"fallback\": "+msg+",\"title\": \""+source+"\",\"fields\": [{\"value\": "+msg+"}],\"color\": \""+color+"\",\"mrkdwn_in\": [\"text\", \"fallback\", \"fields\"],\"thumb_url\": \"https://monitor.brewbench.co/assets/img/fermenter.png\"}]}";
  String response = postData(SLACK_CONNECTION, "payload="+data, "", "application/x-www-form-urlencoded");
  return response;
}

void tplinkAutoCommand(String deviceId, int value){
  String data = "{\"method\":\"passthrough\",\"params\":{\"deviceId\":\""+String(deviceId)+"\",\"requestData\":\"{\\\"system\\\":{\\\"set_relay_state\\\":{\\\"state\\\":"+String(value)+"}}}\"}}";
  postData(TPLINK_CONNECTION, data, "", "application/json");
}

float influxDBCommand(String source, String spin, String type, int adjust) {
  float tvoltage;
  int chk;
  float temp;
  float humidity;
  int pin = spin.substring(1).toInt();
  if(type == "Thermistor")
    temp = Thermistor(pin);
  else if(type == "PT100"){
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
  else if(type == "DHT11")
    chk = DHT.read11(pin);
  else if(type == "DHT21")
    chk = DHT.read21(pin);
  else if(type == "DHT22")
    chk = DHT.read22(pin);
  if(type == "DHT11" || type == "DHT21" || type == "DHT22"){
    if( chk == DHTLIB_OK ){
      temp = DHT.temperature;
      humidity = DHT.humidity;
    }
  }
  // adjust temp if we have it
  if(temp) temp = temp+adjust;
  // Send JSON response to client
  String data = "temperature,sensor="+type+",pin="+pin+",source="+source+" temp="+String(temp);
  // Add humidity if we have it
  if(humidity) data = data+" humidity="+String(humidity);

  postData(INFLUXDB_CONNECTION, data, "--data-binary", "");

  return temp;
}

void trigger(String type, String source, String pin, float temp, int target, int diff, bool slack) {
  String pinType = pin.substring(0,1);
  String deviceId;
  int pinNumber;
  int changeTo;
  if(pinType == "T"){ //TP Link
    deviceId = pin.substring(3);
  } else {
    pinNumber = pin.substring(1).toInt();
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

  if(slack && changeTo == 1 && SLACK_CONNECTION != "")
    slackAutoCommand(type, source, pin, temp, target, diff);
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
