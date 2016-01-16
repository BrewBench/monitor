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
# Add rsync to your Arduino
ssh root@arduino.local
opkg update
opkg install rsync
exit
```

```
# get the web code
git clone https://github.com/avantassel/brewmachine
cd brewmachine

# copy to your Arduino
rsync -rav -e ssh --delete --exclude-from '.rsyncignore' ./ root@arduino.local:/www/brewmachine
```

## Development

```
npm install
gulp
```

## Open a browser

* [http://arduino.local/brewmachine/](http://arduino.local/brewmachine/)

<img src="img/screenshot-desktop.png?raw=true" alt="BrewMachine logo" title="BrewMachine" align="center" />

## TODO
* Add sensors A4 and A5
* Allow add/edit of kettles
* Save settings to key/value data store on the Arduino
* Load settings from key/value data store on the Arduino
* Add option to post readings to a cloud based DB
* Add option to poll cloud based DB instead of the Arduino
* Add option to save readings to an SD card
* Add option to load readings from an SD card
* Add option to save a brew session
* Add option to load a brew session
* Add txt message alert option
