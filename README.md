# BrewMachine

Is an Arduino Yun brew monitor

Currently will monitor [Thermistor](https://learn.adafruit.com/thermistor/using-a-thermistor) temperature sensors on ports A0, A1, A2

## Setup the Arduino

* Connect it to your WiFi
* Enable the REST API


## Clone this repo and copy the code to your Arduino

```
git clone https://github.com/avantassel/brewmachine
cd brewmachine

# copy to your arduino
scp -r ./ root@arduino.local:/www/brewmachine
```

[http://arduino.local/brewmachine/](http://arduino.local/brewmachine/)
