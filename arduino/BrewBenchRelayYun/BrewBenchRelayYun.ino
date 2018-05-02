#include <Process.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// [headers]

String HOSTNAME = "notset";
const PROGMEM uint8_t FREQUENCY_SECONDS = 60;
int secondCounter = 0;
BridgeServer server;

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

  if (command == "digital") {
    adCommand(client, true);
  }
  if (command == "analog") {
    adCommand(client, false);
  }
  if (command == "Thermistor" || command == "DS18B20" || command == "PT100" ||
    command == "DHT11" || command == "DHT12" || command == "DHT21" ||
    command == "DHT22" || command == "DHT33" || command == "DHT44") {
      tempCommand(client, command);
  }
}

void adCommand(BridgeClient client, const boolean digital) {
  String spin = client.readString();
  spin.trim();
  int pin = spin.substring(1,spin.indexOf("/")).toInt();
  int value = spin.substring(spin.indexOf("/")+1).toInt();

  if (spin.indexOf("/") != -1) {
    pinMode(pin, OUTPUT);
    if(digital){
      if(value == 1)
        digitalWrite(pin, LOW);//turn on relay
      else
        digitalWrite(pin, HIGH);//turn off relay
    } else {
      analogWrite(pin, value);//0 - 255
    }
  } else {
    pinMode(pin, INPUT);
    if(digital){
      value = digitalRead(pin);
    } else {
      value = analogRead(pin);
    }
  }

  // Send JSON response to client
  client.print("{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+String(pin)+"\",\"value\":"+String(value)+"}");
}

void tempCommand(BridgeClient client, const String type) {
  String spin = client.readString();
  spin.trim();
  uint8_t pin = spin.substring(1).toInt();
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
  // DHT if(humidity) data += ",\"humidity\":"+String(humidity)+"";
  data += "}";
  // Send JSON response to client
  client.print(data);
}

void postData(const String connection, const String data, const String dataType, const String contentType){
  Process p;
  p.begin(F("curl"));
  p.addParameter(F("-k"));
  p.addParameter(F("-XPOST"));
  p.addParameter(F("-H"));
  p.addParameter(F("User-Agent: BrewBench/[VERSION]"));
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
  p.runAsynchronously();
  while(p.running());
}

// triggers void digitalAutoCommand(int pin, int value) {
// triggers   pinMode(pin, OUTPUT);
// triggers   if(value == 1)
// triggers     digitalWrite(pin, LOW);//turn on relay
// triggers   else if(value == 0)
// triggers     digitalWrite(pin, HIGH);//turn off relay
// triggers }

// triggers void analogAutoCommand(int pin, int value) {
// triggers   pinMode(pin, OUTPUT);
// triggers   analogWrite(pin, value);
// triggers }

// triggers void slackAutoCommand(const String &type, const String &source, const float &temp) {
// triggers   String msg = "";
// triggers   String color = "";
// triggers   if(type=="heat"){
// triggers     msg = source+" temp is "+String(temp)+"\u00B0 and is heating";
// triggers     color = F("danger");
// triggers   } else if(type=="cool"){
// triggers     msg = source+" temp is "+String(temp)+"\u00B0 and is cooling";
// triggers     color = F("#3498DB");
// triggers   }
// triggers   String data = "{\"attachments\": [{\"fallback\": "+msg+",\"title\": \""+source+"\",\"fields\": [{\"value\": "+msg+"}],\"color\": \""+color+"\",\"mrkdwn_in\": [\"text\", \"fallback\", \"fields\"],\"thumb_url\": \"https://monitor.brewbench.co/assets/img/fermenter.png\"}]}";
// triggers   postData(F("[SLACK_CONNECTION]"), "payload="+data, "", F("Content-Type: application/x-www-form-urlencoded"));
// triggers }

// triggers void tplinkAutoCommand(const String &deviceId, const int &value){
// triggers   String data = "{\"method\":\"passthrough\",\"params\":{\"deviceId\":\""+String(deviceId)+"\",\"requestData\":\"{\\\"system\\\":{\\\"set_relay_state\\\":{\\\"state\\\":"+String(value)+"}}}\"}}";
// triggers   postData(F("[TPLINK_CONNECTION]"), data, "", F("Content-Type: application/json"));
// triggers }

float actionsCommand(const String source, const String spin, const String type, const float adjustTemp) {
  float temp = 0.00;
  float raw = 0.00;
// DHT  float humidity = 0.00;
  uint8_t pin = spin.substring(1).toInt();

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
  return temp;
}

// triggers void trigger(const String type, const String source, const String spin, const float temp, const uint8_t target, const char diff, const boolean slack) {
// triggers   String pinType = spin.substring(0,1);
// triggers   String deviceId = "";
// triggers   int pinNumber = -1;
// triggers   uint8_t changeTo = 0;
// triggers   if(pinType == "T"){ //TP Link
// triggers     deviceId = spin.substring(3);
// triggers   } else {
// triggers     pinNumber = spin.substring(1).toInt();
// triggers   }

// triggers   if(type == "heat"){
// triggers     if( temp < (target+diff) )
// triggers       changeTo = 1;
// triggers   } else if(type == "cool"){
// triggers     if( temp > (target+diff) )
// triggers       changeTo = 1;
// triggers   }
// triggers   if(pinType == "A")
// triggers     analogAutoCommand(pinNumber, changeTo);
// triggers   else if(pinType == "D")
// triggers     digitalAutoCommand(pinNumber, changeTo);
// triggers   else if(pinType == "T" && deviceId)
// triggers     tplinkAutoCommand(deviceId, changeTo);

// triggers   if(slack && changeTo == 1)
// triggers     slackAutoCommand(type, source, temp);
// triggers }

void runActions(){
  // [actions]
}

void getHostname(){
  Process p;
  p.runShellCommand("hostname");
  while(p.running());
  if(p.available() > 0) {
   HOSTNAME = p.readString();
  }
  HOSTNAME.trim();
  if(HOSTNAME == "")
    HOSTNAME = "missing";
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
