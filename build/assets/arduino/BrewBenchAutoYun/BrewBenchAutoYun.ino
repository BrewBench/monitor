#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// [headers]

const String VERSION = "3.2.3";
const PROGMEM int FREQUENCY_SECONDS = [FREQUENCY_SECONDS];
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
  client.println("X-Sketch-Version: "+VERSION);
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

void tempCommand(BridgeClient client, const String type) {
  String spin = client.readString();
  spin.trim();
  int pin = spin.substring(1).toInt();
  float temp = 0.00;
  // DHT float humidity = 0.00;

  if(type == "Thermistor")
    temp = Thermistor(pin);
  else if(type == "PT100"){
    float tvoltage = 0;
    if( spin == "A" )
      tvoltage = analogRead(pin);
    else
      tvoltage = digitalRead(pin);

    if (tvoltage>409){
      tvoltage = map(tvoltage,410,1023,0,614);
      temp = (150*tvoltage)/614;
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
  String data = "{\"pin\":\""+String(spin)+"\",\"temp\":\""+String(temp)+"\"";
  // DHT if(humidity) data += ",\"humidity\":\""+String(humidity)+"\"";
  data += "}";
  // Send JSON response to client
  client.print(data);
}

void postData(String connection, String data, String dataType, String contentType){
  Process p;
  p.begin(F("curl"));
  p.addParameter(F("-k"));
  p.addParameter(F("-XPOST"));
  p.addParameter(F("-H"));
  if(contentType != "")
    p.addParameter(contentType);
  if(dataType == "")
    p.addParameter(F("-d"));
  else
    p.addParameter(dataType);
  p.addParameter(data);
  p.addParameter(connection);
  p.runAsynchronously();
  while(p.running());
}

// triggers void dweetAutoCommand(const String &source, const String &brewer, const String &beer, const float &temp){
// triggers   postData(F("https://dweet.io/dweet/for/brewbench"), "{\"brewer\":\""+brewer+"\",\"beer\":\""+beer+"\",\"source\":\""+source+"\",\"temp\":"+String(temp)+"}", "", F("Content-Type: application/json"));
// triggers }

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

float autoCommand(String spin, String type, int adjustTemp) {
  float temp = 0.00;
  // DHT float humidity = 0.00;
  int pin = spin.substring(1).toInt();
  if(type == "Thermistor")
    temp = Thermistor(pin);
  else if(type == "PT100"){
    float tvoltage = 0;
    if( spin.substring(0,1) == "A" )
      tvoltage = analogRead(pin);
    else
      tvoltage = digitalRead(pin);

    if (tvoltage>409){
      tvoltage = map(tvoltage,410,1023,0,614);
      temp = (150*tvoltage)/614;
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

// triggers void trigger(const String &type, const String &source, const String &spin, const float &temp, const int &target, const int &diff, const boolean &slack) {
// triggers   String pinType = spin.substring(0,1);
// triggers   String deviceId = "";
// triggers   int pinNumber = -1;
// triggers   int changeTo = 0;
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
    runActions();
  }

  delay(1000);
}
