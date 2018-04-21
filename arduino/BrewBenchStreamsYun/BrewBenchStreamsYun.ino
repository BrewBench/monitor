#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
#include <ArduinoJson.h>
// [headers]

String HOSTNAME = "";
const String VERSION = "4.0.0";
const PROGMEM int FREQUENCY_SECONDS = 60;
int secondCounter = 0;
BridgeServer server;
JsonObject& brewbenchSettings;

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
  client.println("X-Sketch-Version: "+VERSION);
  client.println(F("Content-Type: application/json"));
  client.println(F("Connection: close"));
  client.println();
}

void digitalCommand(BridgeClient client) {
  String spin = client.readString();
  spin.trim();
  int pin = spin.substring(1,spin.indexOf("/")).toInt();
  int value = spin.substring(spin.indexOf("/")+1).toInt();

  if (spin.indexOf("/") != -1) {
    pinMode(pin, OUTPUT);
    if(value == 1)
      digitalWrite(pin, LOW);//turn on relay
    else
      digitalWrite(pin, HIGH);//turn off relay
  }
  else {
    pinMode(pin, INPUT);
    value = digitalRead(pin);
  }

  // Send JSON response to client
  client.print("{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+spin.substring(0,spin.indexOf("/"))+"\",\"value\":"+String(value)+"}");
}

// https://www.arduino.cc/en/Reference/AnalogWrite
void analogCommand(BridgeClient client) {
  String spin = client.readString();
  spin.trim();
  int pin = spin.substring(1,spin.indexOf("/")).toInt();
  int value = spin.substring(spin.indexOf("/")+1).toInt();

  if (spin.indexOf("/") != -1) {
    pinMode(pin, OUTPUT);
    analogWrite(pin, value);//0 - 255
  }
  else {
    value = analogRead(pin);
  }

  // Send JSON response to client
  client.print("{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+String(pin)+"\",\"value\":"+String(value)+"}");
}

void tempCommand(BridgeClient client, const String type) {
  String spin = client.readString();
  spin.trim();
  int pin = spin.substring(1).toInt();
  float temp = 0.00;
  float raw = 0.00;
// DHT float humidity = 0.00;

  if( spin.substring(0,1) == "A" )
    raw = analogRead(pin);
  else
    raw = digitalRead(pin);

  if(type == "Thermistor"){
    samples[0] = raw;
    uint8_t i;
    // take N samples in a row, with a slight delay
    for (i=1; i< NUMSAMPLES; i++) {
      samples[i] = analogRead(pin);
      delay(10);
    }
    // average all the samples out
    float average = 0;
    for (i=0; i< NUMSAMPLES; i++) {
       average += samples[i];
    }
    average /= NUMSAMPLES;
    raw = average;
    temp = Thermistor(average);
  } else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  // DS18B20 else if(type == "DS18B20"){
  // DS18B20 DS18B20 ds(pin);
  // DS18B20 ds.readSensor();
  // DS18B20 temp = ds.getTemperature_C();
  // DS18B20 }
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
  // DHT     humidity = DHT.humidity;
  // DHT   }
  // DHT }
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"temp\":"+String(temp)+",\"raw\":"+String(raw)+"";
// DHT  if(humidity) data += ",\"humidity\":"+String(humidity)+"";
  data += "}";
  // Send JSON response to client
  client.print(data);
}

void postData(const String &connection, const String &data, const String &dataType, const String &contentType, const String &additionalHeader){
  Process p;
  p.begin(F("curl"));
  p.addParameter(F("-k"));
  p.addParameter(F("-XPOST"));
  p.addParameter("User-Agent: BrewBench/"+VERSION);
  if(contentType != ""){
    p.addParameter(F("-H"));
    p.addParameter(contentType);
  }
  if(additionalHeader != ""){
    p.addParameter(F("-H"));
    p.addParameter(additionalHeader);
  }
  if(dataType == "")
    p.addParameter(F("-d"));
  else
    p.addParameter(dataType);
  p.addParameter(data);
  p.addParameter(connection);
  p.runAsynchronously();
  while(p.running());
}

void dweetAutoCommand(const String &source, const String &brewer, const String &beer, const float &temp){
  postData(F("https://dweet.io/dweet/for/brewbench"), "{\"brewer\":\""+brewer+"\",\"beer\":\""+beer+"\",\"source\":\""+source+"\",\"temp\":"+String(temp)+"}", "", F("Content-Type: application/json"), "");
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

void tplinkAutoCommand(const String &deviceId, const int &value){
  String data = "{\"method\":\"passthrough\",\"params\":{\"deviceId\":\""+String(deviceId)+"\",\"requestData\":\"{\\\"system\\\":{\\\"set_relay_state\\\":{\\\"state\\\":"+String(value)+"}}}\"}}";
  postData(F("[TPLINK_CONNECTION]"), data, "", F("Content-Type: application/json"), "");
}

float actionsCommand(const String &source, const String &spin, const String &type, const int &adjustTemp) {
  float temp = 0.00;
  float raw = 0.00;
// DHT  float humidity = 0.00;
  int pin = spin.substring(1).toInt();

  if( spin.substring(0,1) == "A" )
    raw = analogRead(pin);
  else
    raw = digitalRead(pin);

  if(type == "Thermistor"){
    samples[0] = raw;
    uint8_t i;
    // take N samples in a row, with a slight delay
    for (i=1; i< NUMSAMPLES; i++) {
      samples[i] = analogRead(pin);
      delay(10);
    }
    // average all the samples out
    float average = 0;
    for (i=0; i< NUMSAMPLES; i++) {
       average += samples[i];
    }
    average /= NUMSAMPLES;
    raw = average;
    temp = Thermistor(average);
  } else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  // DS18B20 else if(type == "DS18B20"){
  // DS18B20 DS18B20 ds(pin);
  // DS18B20 ds.readSensor();
  // DS18B20 temp = ds.getTemperature_C();
  // DS18B20 }
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
  // DHT     humidity = DHT.humidity;
  // DHT   }
  // DHT }
  // adjust temp if we have it
  if(temp) temp = temp+adjustTemp;
  // Send JSON response to client
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"temp\":"+String(temp)+",\"raw\":"+String(raw)+"";
  data += ",\"sensor\":\""+String(type)+"\"";
  data += ",\"source\":\""+String(source)+"\"";
  data += ",\"adjust\":\""+String(adjustTemp)+"\"";
// DHT  if(humidity) data += ",\"humidity\":"+String(humidity)+"";
  data += "}";

  postTemp(data);

  return temp;
}

void postTemp(const &data String){
  Process p;
  String jsonRaw;
  p.begin(F("curl"));
  p.addParameter(F("-k"));
  p.addParameter(F("-XPOST"));
  p.addParameter(F("-H"));
  p.addParameter("User-Agent: BrewBench/"+VERSION);
  p.addParameter(F("-H"));
  p.addParameter(F("Content-Type: application/json"));
  p.addParameter(F("-d"));
  p.addParameter(data);
  p.addParameter(F("[STREAMS_AUTH]"));
  p.addParameter(F("[STREAMS_CONNECTION]/api/temps/arduino"));
  p.runAsynchronously();
  while (p.available()) {
    jsonRaw = p.readString();
  }
  // if there is a response then something changed and update brewbenchSettings
  if(jsonRaw){
    DynamicJsonBuffer jsonBuffer;
    JsonObject &root = jsonBuffer.parseObject(jsonRaw);
    // if parsing succeeds then update settings
    if(root.success()){
      brewbenchSettings = root;
    }
  }
}

void trigger(const String &type, const String &source, const String &spin, const float &temp, const int &target, const int &diff) {
  String pinType = spin.substring(0,1);
  String deviceId = "";
  int pinNumber = -1;
  int changeTo = 0;
  if(pinType == "T"){ //TP Link
    deviceId = spin.substring(3);
  } else {
    pinNumber = spin.substring(1).toInt();
  }

  if(type == "heat"){
    if( temp < (target+diff) )
      changeTo = 1;
  } else if(type == "cool"){
    if( temp > (target+diff) )
      changeTo = 1;
  }
  if(pinType == "A")
    analogAutoCommand(pinNumber, changeTo);
  else if(pinType == "D")
    digitalAutoCommand(pinNumber, changeTo);
  else if(pinType == "T" && deviceId)
    tplinkAutoCommand(deviceId, changeTo);
}

void runActions(){
  if(!brewbenchSettings || brewbenchSettings['kettles'].length == 0)
    return;
  float temp = 0.00;
  for (int k = 0; k < brewbenchSettings['kettles'].length; k++) {
    if(brewbenchSettings['kettles'][k]['notify']['streams'] ==  false)
      continue;
    temp = actionsCommand(brewbenchSettings['kettles'][k]['name'], brewbenchSettings['kettles'][k]['temp']['pin'], brewbenchSettings['kettles'][k]['temp']['type'], brewbenchSettings['kettles'][k]['temp']['adjust'])
    if(brewbenchSettings['kettles'][k]['heater']['sketch'] == true){
      trigger("heat", brewbenchSettings['kettles'][k]['name'], brewbenchSettings['kettles'][k]['heater']['pin'], temp, brewbenchSettings['kettles'][k]['temp']['target'], brewbenchSettings['kettles'][k]['temp']['diff']);
    }
    if(brewbenchSettings['kettles'][k]['cooler']['sketch'] == true){
      trigger("cool", brewbenchSettings['kettles'][k]['name'], brewbenchSettings['kettles'][k]['cooler']['pin'], temp, brewbenchSettings['kettles'][k]['temp']['target'], brewbenchSettings['kettles'][k]['temp']['diff']);
    }
  }
}

void getHostname(){
  Process p;
  char c;
  p.runShellCommand("hostname");
  while(p.available() > 0) {
   c = p.read();
   Serial.print(c);
   HOSTNAME.concat(c);
  }
  HOSTNAME.trim();
}

void setup() {

  Bridge.begin();
  // Uncomment for REST API open
  server.listenOnLocalhost();
  // Uncomment for REST API with password
  // server.noListenOnLocalhost();
  server.begin();
  getHostname();
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
