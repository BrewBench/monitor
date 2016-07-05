[![Stories in Ready](https://badge.waffle.io/BrewBench/web-controller.png?label=ready&title=Ready)](https://waffle.io/BrewBench/web-controller)
# BrewBench

<img src="img/brewbench-logo.png?raw=true" alt="BrewBench logo" title="BrewBench" align="right" />

BrewBench is an Arduino brew monitor, controller and alert system for the home brewer enthusiast.  It uses the Arduino REST API to interface with thermistors connected to the analog ports.  You can also connect a relay to the digital ports and add a heater / pump to create a RIMS system.  The software will start/stop the heater/pump based on the target temperature you set.

## Setup the Arduino

* Connect it to your WiFi (see [ArduinoYun](https://www.arduino.cc/en/Guide/ArduinoYun#toc14))
* Enable the REST API (see [ArduinoYun](https://www.arduino.cc/en/Guide/ArduinoYun#toc5))
* Upload the [Arduino sketch](arduino/BrewBench/BrewBench.ino)
* Temp Sensors (See [Hackster](https://www.hackster.io/brewbench/brewbench-d64d90) for wiring details)
  * Analog [Thermistors](https://learn.adafruit.com/thermistor/using-a-thermistor)
  * Digital [DS18B20](https://www.adafruit.com/product/381)
    * Will need the [cactus](http://static.cactus.io/downloads/library/ds18b20/cactus_io_DS18B20.zip) library

```sh
# get the web code
git clone https://github.com/brewbench/web-controller brewbench
cd brewbench
```

## Deployment

There are three options here, you can either run the code on your Arduino or on a webserver.

### 1. BrewBench Hosted

Once you have uploaded the [sketch](arduino/BrewBench/BrewBench.ino), simply use: [brewbench.io](http://brewbench.io)

### 2. Arduino Hosted

The Arduino has a built in webserver running in `/www/`.

```sh
# Add rsync to your Arduino
ssh root@arduino.local
opkg update
opkg install rsync
exit

# Copy the code to your Arduino
rsync -rav -e ssh --delete --exclude-from '.rsyncignore' ./ root@arduino.local:/www/brewbench
```

* [http://arduino.local/brewbench/](http://arduino.local/brewbench/)

### 3.  Local Network Hosted
Copy to your local webserver or run locally
```sh
npm install
live-server
```

* [http://localhost/brewbench/](http://localhost/brewbench/)

## Development

For development just run `npm install`, and look at [index.html](index.html) for un-commenting the un-minified files.

```sh
npm install
gulp
```

<img src="img/screenshot-desktop.png?raw=true" alt="BrewBench screenshot" align="center" />

<img src="img/brewbench-wiredup.jpg?raw=true" alt="BrewBench wired up" align="center" />

## Thanks

* For the Lovibond Hex colors: http://brookstonbeerbulletin.com/thinking-about-beer-color
* For the SVG icons:
  * https://thenounproject.com/dejv
  * https://thenounproject.com/creativestall
* For the Hop and Grain reference: https://byo.com
* For the recipes: http://beersmithrecipes.com
* For the bell sounds: http://www.orangefreesounds.com/category/sound-effects/bell-sound

## About

[BrewBench](//brewbench.co) is a brew monitor and controller Developed by [Andrew Van Tassel](//www.andrewvantassel.com) and [Lee Kendrick](http://www.leekendrick.info) &copy;2016.

Made with <img src="img/beer.png" width="45"> from Colorado
