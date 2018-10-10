#include <Process.h>
#include <BridgeServer.h>
#include <BridgeClient.h>
// [headers]

String HOSTNAME = "[HOSTNAME]";
const PROGMEM uint8_t FREQUENCY_SECONDS = 60;
uint8_t secondCounter = 0;
BridgeServer server;

// DHT dht DHT;
// ADC Adafruit_ADS1115 ads(0x48);

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

  if (command == "digital" || command == "analog" || command == "adc") {
    adCommand(client, command);
  }
  else if (command == "Thermistor" || command == "PT100" ||
      command == "DHT11" || command == "DHT12" || command == "DHT21" ||
      command == "DHT22" || command == "DHT33" || command == "DHT44" ||
      command.substring(0,13) == "SoilMoistureD" ||
      command.substring(0,7) == "DS18B20") {
    sensorCommand(client, command);
  }
  else {
    client.print("{\"BrewBench\": {\"board\": \"YUN\", \"version\": \"[VERSION]\"}}");
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
    // ADC else if( type == "adc" ){
    // ADC   value = ads.readADC_SingleEnded(pin);
    // ADC }
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
  // ADC int16_t adc0 = 0;
  float resistance = 0.0;

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }
  // ADC else if( spin.substring(0,1) == "C" ){
  // ADC   adc0 = ads.readADC_SingleEnded(pin);
  // ADC   // raw adc value
  // ADC   raw = adc0;
  // ADC   volts = (raw * 0.1875)/1000;
  // ADC }

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
    // ADC else if( spin.substring(0,1) == "C" ){
    // ADC   // resistance = (voltage) / current
    // ADC   resistance = (adc0 * (5.0 / 65535)) / 0.0001;
    // ADC   float ln = log(resistance / THERMISTORNOMINAL);
    // ADC   float kelvin = 1 / (0.0033540170 + (0.00025617244 * ln) + (0.0000021400943 * ln * ln) + (-0.000000072405219 * ln * ln * ln));
    // ADC   // kelvin to celsius
    // ADC   temp = kelvin - 273.15;
    // ADC }
  }
  else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  else if(type.substring(0,13) == "SoilMoistureD"){
    uint8_t dpin = type.substring(13).toInt();
    pinMode(dpin, OUTPUT);
    digitalWrite(dpin, HIGH);
    delay(10);
    raw = analogRead(pin);
    digitalWrite(dpin, LOW);
    percent = map(raw, 0, 880, 0, 100);
  }
  // DS18B20 else if(type.substring(0,7) == "DS18B20"){
  // DS18B20   // format DS18B20-index
  // DS18B20   int16_t index = -1;
  // DS18B20   if( type.length() > 7 )
  // DS18B20     index = type.substring(8).toInt();
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   if( index > 0 )
  // DS18B20     temp = sensors.getTempCByIndex(index);
  // DS18B20   else
  // DS18B20     temp = sensors.getTempCByIndex(0);
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
  // DHT     percent = DHT.humidity;
  // DHT   }
  // DHT }
  String data = "{\"hostname\":\""+String(HOSTNAME)+"\",\"pin\":\""+String(spin)+"\",\"temp\":"+String(temp);
  data += ",\"raw\":"+String(raw);
  data += ",\"volts\":"+String(volts);
  if(percent || type.substring(0,13) == "SoilMoistureD" || type.substring(0,3) == "DHT") {
    data += ",\"percent\":"+String(percent);
  }
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
  // additional_post_params
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

// triggers void slackAutoCommand(const String type, const String source, const float temp) {
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

// triggers void tplinkAutoCommand(const String deviceId, const int value){
// triggers   String data = "{\"method\":\"passthrough\",\"params\":{\"deviceId\":\""+String(deviceId)+"\",\"requestData\":\"{\\\"system\\\":{\\\"set_relay_state\\\":{\\\"state\\\":"+String(value)+"}}}\"}}";
// triggers   postData(F("[TPLINK_CONNECTION]"), data, "", F("Content-Type: application/json"));
// triggers }

float actionsCommand(const String source, const String spin, const String type, const float adjustTemp) {
  float temp = 0.00;
  float raw = 0.00;
  float volts = 0.00;
  uint8_t pin = spin.substring(1).toInt();

  float percent = 0.00;
  // ADC int16_t adc0 = 0;
  float resistance = 0.0;

  if( spin.substring(0,1) == "A" ){
    raw = analogRead(pin);
    volts = raw * 0.0049;
  }
  else if( spin.substring(0,1) == "D" ){
    raw = digitalRead(pin);
  }
  // ADC else if( spin.substring(0,1) == "C" ){
  // ADC   adc0 = ads.readADC_SingleEnded(pin);
  // ADC   // raw adc value
  // ADC   raw = adc0;
  // ADC }

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
    // ADC else if( spin.substring(0,1) == "C" ){
    // ADC   // resistance = (voltage) / current
    // ADC   resistance = (adc0 * (5.0 / 65535)) / 0.0001;
    // ADC   float ln = log(resistance / THERMISTORNOMINAL);
    // ADC   float kelvin = 1 / (0.0033540170 + (0.00025617244 * ln) + (0.0000021400943 * ln * ln) + (-0.000000072405219 * ln * ln * ln));
    // ADC   // kelvin to celsius
    // ADC   temp = kelvin - 273.15;
    // ADC }
  }
  else if(type == "PT100"){
    if (raw>409){
      temp = (150*map(raw,410,1023,0,614))/614;
    }
  }
  else if(type.substring(0,13) == "SoilMoistureD"){
    uint8_t dpin = type.substring(13).toInt();
    pinMode(dpin, OUTPUT);
    digitalWrite(dpin, HIGH);
    delay(10);
    raw = analogRead(pin);
    digitalWrite(dpin, LOW);
    percent = map(raw, 0, 880, 0, 100);
  }
  // DS18B20 else if(type.substring(0,7) == "DS18B20"){
  // DS18B20   // format DS18B20-index
  // DS18B20   int16_t index = -1;
  // DS18B20   if( type.length() > 7 )
  // DS18B20     index = type.substring(8).toInt();
  // DS18B20   OneWire oneWire(pin);
  // DS18B20   DallasTemperature sensors(&oneWire);
  // DS18B20   sensors.begin();
  // DS18B20   sensors.requestTemperatures();
  // DS18B20   if( index > 0 )
  // DS18B20     temp = sensors.getTempCByIndex(index);
  // DS18B20   else
  // DS18B20     temp = sensors.getTempCByIndex(0);
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
  // DHT     percent = DHT.humidity;
  // DHT   }
  // DHT }
  // adjust temp if we have it
  if(temp) temp = temp+adjustTemp;
  // Send JSON response to client
  String data = "temperature,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(temp);
  // SoilMoistureD only has percent so replace data
  if(type.substring(0,13) == "SoilMoistureD") {
    data = "percent,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(percent);
    data += "\nbits,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(raw);
  } else if(type.substring(0,3) == "DHT"){
    data += "\npercent,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(percent);
  } else if(percent){
    data += "\npercent,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(percent);
  } else {
    data += "\nbits,sensor="+type+",pin="+spin+",source="+source+",host="+String(HOSTNAME)+" value="+String(raw);
  }

  postData(F("[INFLUXDB_CONNECTION]"), data, F("--data-binary"), "[INFLUXDB_AUTH]");

  if(type.substring(0,13) == "SoilMoistureD"){
    return percent;
  } else {
    return temp;
  }
}

// triggers void trigger(const String type, const String source, const String spin, const float temp, const int target, const int diff, const boolean slack) {
// triggers   if(!temp || temp == -1) return;
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
  // Uncomment for REST API open
  server.listenOnLocalhost();
  // Uncomment for REST API with password
  // server.noListenOnLocalhost();
  server.begin();
  // ADC ads.begin();
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
