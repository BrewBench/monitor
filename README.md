# BrewBench

<img src="img/brewbench-logo.png?raw=true" alt="BrewBench logo" title="BrewBench" align="right" />

Is an Arduino Yun brew monitor for the home brewer enthusiast that uses the Arduino REST API to interface with thermistors connected to the analog ports.

See [Thermistor](https://learn.adafruit.com/thermistor/using-a-thermistor) for wiring these up on analog ports.

## Setup the Arduino

* Connect it to your WiFi (see [ArduinoYun](https://www.arduino.cc/en/Guide/ArduinoYun#toc14))
* Enable the REST API (see [ArduinoYun](https://www.arduino.cc/en/Guide/ArduinoYun#toc5))
* Upload the [Arduino sketch](arduino/BrewBench/BrewBench.ino)

```sh
# get the web code
git clone https://github.com/avantassel/brewbench
cd brewbench
```

## Deployment

There are three options here, you can either run the code on your Arduino or on a webserver.

### 1. BrewBench Hosted

Once you have uploaded the [sketch](arduino/BrewBench/BrewBench.ino), simply use: [brewbench.co](https://brewbench.co)

### 2. Arduino Deployment

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

### 3.  Webserver Deployment

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
