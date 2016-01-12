#include <Console.h>
#include <HttpClient.h>
#include <Process.h>
#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>

int led_giallo = 13;
int led_rosso = 12;
String parameters = "";           //String of POST parameters
String macAddr = "";

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
  if (command == "mode") {
    modeCommand(client);
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
  client.print("{\"pin\":\"D"+String(pin)+"\",\"value\":\""+String(value)+"\"}");
  
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
    client.print("{\"pin\":\"D"+String(pin)+"\",\"value\":\""+String(value)+"\"}");
    
    String key = "D";
    key += pin;
    Bridge.put(key, String(value));
  }
  else {
    value = analogRead(pin);

    // Send JSON response to client
    client.print("{\"pin\":\"A"+String(pin)+"\",\"value\":\""+String(value)+"\"}");

    String key = "A";
    key += pin;
    Bridge.put(key, String(value));
  }
}

void modeCommand(BridgeClient client) {
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
    client.print("{\"pin\":\"D"+String(pin)+"\",\"value\":\""+String(mode)+"\"}");
    return;
  }

  if (mode == "output") {
    pinMode(pin, OUTPUT);
    // Send JSON response to client
    client.print("{\"pin\":\"D"+String(pin)+"\",\"value\":\""+String(mode)+"\"}");
    return;
  }

  client.print(F("error: invalid mode "));
  client.print(mode);
}

  
void setup() {
  Serial.begin(9600);
  pinMode(13,OUTPUT);
  digitalWrite(13, LOW);
  Bridge.begin();
  digitalWrite(13, HIGH);

  server.listenOnLocalhost();
  server.begin();
    
  /*
  pinMode(led_rosso,OUTPUT);
  pinMode(led_giallo,OUTPUT);
  digitalWrite(led_giallo,HIGH);
  digitalWrite(led_rosso,LOW);
  delay(2500);
  digitalWrite(led_giallo,LOW);
    */                   
  //get macAddr
  /*
  Process wifiCheck;
  wifiCheck.runShellCommand("/usr/bin/pretty-wifi-info.lua");
  while (wifiCheck.available() > 0) {
    char c = wifiCheck.read();
    Serial.print(c);
  }

  Serial.println("wifiCheck");
  */
  
  //download config
  /*HttpClient uClient;
  uClient.get("http://brewmachine.andrewvantassel.com/user/"+macAddr+"/config.json");
  while (uClient.available()) {
    char c = uClient.read();
    Serial.print(c);
  }
  */  
  
}

void loop() {
  BridgeClient client = server.accept();
          
  if (client) {
    process(client);
    client.stop();
  }

  delay(50); 
}
