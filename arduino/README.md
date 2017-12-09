# BrewBench Monitor Arduino Sketches

## Setup the Arduino

### Choose a Temperature Sensor

  * [Thermistors](https://learn.adafruit.com/thermistor/using-a-thermistor) (Analog) 10K or 100K resistor

    <img src="../src/assets/img/thermistor.png?raw=true" alt="BrewBench fermenter" align="center" width="400" />

  * [DS18B20](https://www.adafruit.com/product/381) (Digital) 4.7K resistor
    * Will need the [cactus](http://static.cactus.io/downloads/library/ds18b20/cactus_io_DS18B20.zip) library

    <img src="../src/assets/img/DS18S20.png?raw=true" alt="BrewBench fermenter" align="center" width="400" />

  * [PT100](https://www.adafruit.com/product/3290) (Analog)

    <img src="../src/assets/img/PT100.png?raw=true" alt="BrewBench fermenter" align="center" width="400" />

### Choose a Relay

  * [Solid State Relay (SSR)](https://www.sparkfun.com/products/13015)
    * Arduino GRD -> Relay DC Negative
    * Arduino Digital (D3) PWM ~ Port -> Relay DC Positive

      <img src="../src/assets/img/ssr-relay.jpg?raw=true" alt="BrewBench fermenter" align="center" width="300" />

  * [Sainsmart 2 channel relay](http://www.sainsmart.com/arduino-pro-mini.html)
    * Arduino GND -> Relay GND
    * Arduino 5V -> Relay VCC
    * Arduino Vin -> Relay JD-VCC (no jumper needed)
    * Arduino Digital (D2) Port -> Relay IN1 (heater)
    * Arduino Digital (D4) Port -> Relay IN2 (pump)

      <img src="../src/assets/img/sainsmart.png?raw=true" alt="BrewBench fermenter" align="center" width="300" />

## Arduino Boards

1. Power up and connect to the default IP http://192.168.240.1
1. Set the digital pin or analog pin depending on which temp sensor you're using.
1. Press play, you can adjust the temp by sliding the temp knob.
1. Download the [Arduino IDE](https://www.arduino.cc/en/Main/Software) >= 1.8.5

### Arduino Yun
  * If the WiFi network starts with Arduino use password: arduino
  * Set REST API access to open
    * you can password protect the REST API but will need to update the [sketch](arduino/BrewBenchYun/BrewBenchYun.ino#L185)
  * Change or remember the host name or IP address (you will need this later)
  * Save to reboot
  * Using the [Arduino IDE](https://www.arduino.cc/en/Main/Software) upload the [BrewBenchYun sketch](arduino/BrewBenchYun/BrewBenchYun.ino)

### Arduino Leonardo, Arduino Uno, Arduino Mega 2560 with a Dragino Yun Shield
  * Add the boards following these instructions

    * http://wiki.dragino.com/index.php?title=Getting_Start_with_Arduino_Yun#Automatically_Add_Board_Profile_in_Arduino_IDE


### Setup with Home Assistant
This is a cool option for monitoring, check out https://home-assistant.io

Depending on which sensor and pin you are using you would setup the resource in the format, `http://<arduino Domain or IP>/arduino/<sensor>/<pin>`

Sensors are:
* Thermistor
* DS18B20
* PT100

Then add this to your `/home/user/.homeassistant/configuration.yaml`

```yaml
  sensor:
    # https://home-assistant.io/components/sensor.rest/    
    - platform: rest
      resource: http://arduino.local/arduino/Thermistor/2
      method: GET
      name: BrewBench Fermenter
      unit_of_measurement: "°F"
      value_template: "{{ ((float(value_json.temp) * 9 / 5 )  +  32) | round(1) }}"
```

### Setup with InfluxDB

Use the [InfluxDB]() sketch, download from the app and it will create the kettles you have connected.  Then use docker and  [Grafana](https://grafana.com/grafana/download?platform=docker) for graphs.

Download the fermentation dashboard https://grafana.com/dashboards/3957

```sh
brew update
brew install influxdb

#then use grafana for the graphs
docker run -d --name=grafana -p 3000:3000 grafana/grafana
```

<img src="../src/assets/img/screenshot-influxdb.png?raw=true" alt="BrewBench" align="center" width="100%" />
