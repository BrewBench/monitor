# BrewBench Monitor Arduino Sketches

You can download sketches from [BrewBench Monitor](http://monitor.brewbench.co)

## Setup the Arduino

There is a lot of network activity amd the arduino has issues over time and it's a good idea to do a network restart,

Add a cron job for this.

```sh
ssh root@arduino.local
crontab -e
# daily network restart at midnight
0 0  * * * /etc/init.d/network restart
```

### Choose a Temperature Sensor

  * [Thermistors](https://learn.adafruit.com/thermistor/using-a-thermistor) (Analog) 10K or 100K resistor

    <img src="../src/assets/img/thermistor.png?raw=true" alt="BrewBench thermistor" align="center" width="400" />

  * [DS18B20](https://www.adafruit.com/product/381) (Digital) 4.7K resistor
    * Will need the [cactus](http://static.cactus.io/downloads/library/ds18b20/cactus_io_DS18B20.zip) library

    <img src="../src/assets/img/DS18S20.png?raw=true" alt="BrewBench DS18B20" align="center" width="400" />

  * [PT100](https://www.adafruit.com/product/3290) (Analog)

    <img src="../src/assets/img/PT100.png?raw=true" alt="BrewBench PT100" align="center" width="400" />

  * DHT11, DHT12, DHT21, DHT22, DHT33, DHT44 Temperature and Humidity great addition for brew house monitoring.

    <img src="../src/assets/img/DHT11.png?raw=true" alt="BrewBench DHT" align="center" width="400" />

  * Ranco temperature controller (Uses a thermistor)

      Modify an existing temperature controller
      - White wire (data)
      - Black wire (ground)

### Choose a Relay

  * [Solid State Relay (SSR)](https://www.sparkfun.com/products/13015)
    * Arduino GRD -> Relay DC Negative
    * Arduino Digital (D3) PWM ~ Port -> Relay DC Positive

      <img src="../src/assets/img/ssr-relay.jpg?raw=true" alt="BrewBench SSR" align="center" width="300" />

  * [Sainsmart 2 channel relay](http://www.sainsmart.com/arduino-pro-mini.html)
    * Arduino GND -> Relay GND
    * Arduino 5V -> Relay VCC
    * Arduino Vin -> Relay JD-VCC (no jumper needed)
    * Arduino Digital (D2) Port -> Relay IN1 (heater)
    * Arduino Digital (D4) Port -> Relay IN2 (pump)

      <img src="../src/assets/img/sainsmart.png?raw=true" alt="BrewBench relay" align="center" width="300" />

## Arduino Boards

Download the [Arduino IDE](https://www.arduino.cc/en/Main/Software) >= 1.8.5

### Arduino Yun
  * Connect to the WiFi network starts with `Arduino Yun-`
  * Open http://192.168.240.1 in your browser
  * Default Password: `arduino`
  * Set REST API access to open
    * you can password protect the REST API but will need to update the [sketch](BrewBenchYun/BrewBenchYun.ino)
  * Change or remember the host name or IP address (you will need this later)
  * Connect to your WiFi
  * Save to reboot
  * Using the [Arduino IDE](https://www.arduino.cc/en/Main/Software) upload the [BrewBenchYun sketch](BrewBenchYun/BrewBenchYun.ino)

### Seeeduino
  * Connect to the WiFi network starts with `SeeeduinoCloud-`
  * Open http://192.168.240.1 in your browser
  * Default Password: `seeeduino`
  * Set REST API access to open
    * you can password protect the REST API but will need to update the [sketch](BrewBenchYun/BrewBenchYun.ino)
  * Change or remember the host name or IP address (you will need this later)
  * Connect to your WiFi
  * Save to reboot
  * Using the [Arduino IDE](https://www.arduino.cc/en/Main/Software) upload the [BrewBenchYun sketch](BrewBenchYun/BrewBenchYun.ino)

### Arduino Leonardo, Arduino Uno, Arduino Mega 2560 with a Dragino Yun Shield
  * Add the boards following these instructions

    * http://wiki.dragino.com/index.php?title=Getting_Start_with_Arduino_Yun#Automatically_Add_Board_Profile_in_Arduino_IDE

### ESP8266


## Monitoring

### BrewBench Streams

Monitor and control your temps remotely with history of all your fermentation sessions.

Sign up at https://app.brewbench.co for an API Key

Then enter your username and API key in the settings and download and install the Streams sketch.

<img src="../src/assets/img/screenshot-streams.png?raw=true" alt="BrewBench Streams" align="center" width="100%" />

## Home Assistant
This is a cool option for monitoring, check out https://home-assistant.io

Depending on which sensor and pin you are using you would setup the resource in the format, `http://<arduino Domain or IP>/arduino/<sensor>/<pin>`

Sensors are:
* Thermistor
* DS18B20
* PT100
* DHT11, DHT12, DHT21, DHT22, DHT33, DHT44

Then add this to your `/home/user/.homeassistant/configuration.yaml`

```yaml
  sensor:
    # https://home-assistant.io/components/sensor.rest/    
    - platform: rest
      resource: http://arduino.local/arduino/Thermistor/A2
      method: GET
      name: BrewBench
      unit_of_measurement: "°F"
      value_template: "{{ ((float(value_json.temp) * 9 / 5 )  +  32) | round(1) }}"
```

### InfluxDB & Grafana

Use the [InfluxDB]() sketch, download from the app and it will create the kettles you have connected.  Then use docker and  [Grafana](https://grafana.com/grafana/download?platform=docker) for graphs.

Download the [fermentation](https://grafana.com/dashboards/3957) or [session](https://grafana.com/dashboards/3960) dashboard from [Grafana](https://grafana.com/dashboards?search=BrewBench)

```sh
brew update
brew install influxdb

#then use grafana for the graphs
docker run -d --name=grafana -p 3000:3000 grafana/grafana
```

<img src="../src/assets/img/screenshot-influxdb.png?raw=true" alt="BrewBench InfluxDB" align="center" width="100%" />
