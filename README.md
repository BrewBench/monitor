# BrewMachine

<img src="img/brewmachine.png?raw=true" alt="BrewMachine logo" title="BrewMachine" align="right" />

Is an Arduino Yun brew monitor

Currently will monitor [Thermistor](https://learn.adafruit.com/thermistor/using-a-thermistor) temperature sensors on ports A0, A1, A2

## Setup the Arduino

* Connect it to your WiFi (see [ArduinoYun](https://www.arduino.cc/en/Guide/ArduinoYun))
* Enable the REST API (see [ArduinoYun](https://www.arduino.cc/en/Guide/ArduinoYun))
* Upload the [Arduino sketch](arduino/BrewMachine/BrewMachine.ino)


## Clone this repo and copy the code to your Arduino

```
git clone https://github.com/avantassel/brewmachine
cd brewmachine

# copy to your arduino
scp -r ./ root@arduino.local:/www/brewmachine
```

## Open a browser

* [http://arduino.local/brewmachine/](http://arduino.local/brewmachine/)

<img src="img/screenshot-desktop.png?raw=true" alt="BrewMachine logo" title="BrewMachine" align="center" />
