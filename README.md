# BrewBench Monitor

http://monitor.brewbench.co

<img src="src/assets/img/brewbench-logo20.png?raw=true" width="200" alt="BrewBench logo" title="BrewBench" align="right" />

![codeship](https://codeship.com/projects/8b6f3bc0-b4fd-0134-65d1-5ed8b845772e/status?branch=master)
[![Join the chat at https://gitter.im/BrewBench/Lobby](https://badges.gitter.im/BrewBench/Lobby.svg)](https://gitter.im/BrewBench/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

BrewBench is an Arduino brew monitor, controller and alert system for the homebrewers and pro brewers.  It uses the Arduino REST API to interface with temp sensors.

#### RIMS
You can also connect a relay to the digital ports and add a heater / pump to create a RIMS system.  The software will start/stop the heater/pump based on the target temperature you set.

#### Fermenters
BrewBench Monitor can easily be used on fermenters with a thermowell.

#### BrewBench works with many popular sensors, controllers, and Arduino boards.

| | | |
| ------ | ------ | ------ |
| Sensor | [Thermistors](https://smile.amazon.com/gp/product/B01MZ6Y336/) | Temperature |
| Sensor | [DS18B20](https://smile.amazon.com/gp/product/B00KUNKR3M/) | Temperature |
| Sensor | [PT100](https://smile.amazon.com/gp/product/B00M3SXI0Q/) | Temperature |
| Sensor | [DHT11](https://smile.amazon.com/gp/product/B01DKC2GQ0/) | Temperature / Humidity |
| Sensor | [DHT12](https://smile.amazon.com/gp/product/B089W74DT1/) | Temperature / Humidity |
| Sensor | [DHT22](https://smile.amazon.com/gp/product/B0795F19W6/) | Temperature / Humidity |
| Sensor | [BMP280](https://www.adafruit.com/product/2651) | Temperature / Pressure |
| Sensor | [SEN-13322](https://www.sparkfun.com/products/13322) | Moisture |
| Controller | [Ranco](https://smile.amazon.com/RANCO-ETC-111000-Digital-Temperature-Control/dp/B0015NV5BE/) | Temperature |
| Controller| [InkBird ITC-1000](https://smile.amazon.com/Inkbird-All-Purpose-Temperature-Controller-ITC-1000/dp/B00OXPE8U6/) | Temperature |
| Board | [ESP32](https://smile.amazon.com/HiLetgo-ESP-WROOM-32-Development-Microcontroller-Integrated/dp/B0718T232Z/) | [Monitor](http://monitor.brewbench.co) or [App](https://www.brewbench.co) |
| Board | [ESP8266](https://smile.amazon.com/HiLetgo-Internet-Development-Wireless-Micropython/dp/B010O1G1ES/) | [Monitor](http://monitor.brewbench.co) |
| Board | [Yun Rev 2](https://store.arduino.cc/usa/arduino-yun-rev-2) | [Monitor](http://monitor.brewbench.co) |


## Setup the Arduino

Download a sketch from the sketches link in the header and install with the [Arduino IDE](https://www.arduino.cc/en/Main/Software).

## Open BrewBench

Go to [BrewBench monitor](http://monitor.brewbench.co) or clone this repo and follow dev instructions below.

## Development

Install [NodeJS](https://nodejs.org)

```sh
# install
npm install
# run tests
npm test
# start dev web server
npm start
```

## Deployment

Code is compiled to a `build` directory, build the code and copy that to your web server.

```sh
# install
npm install
# build files for deployment
npm run build
```

<img src="src/assets/img/screenshot-fermenter.png?raw=true" alt="BrewBench fermenter" align="center" width="200" />

<img src="src/assets/img/screenshot-desktop.png?raw=true" alt="BrewBench screenshot" align="center" />

<img src="src/assets/img/BrewBench-wiring-diagram.png?raw=true" alt="BrewBench Wiring Diagram" align="center" />

[Download the Fritzing Diagram here](src/assets/BrewBench-wiring-diagram.fzz)

<img src="src/assets/img/BrewBench-wiring-diagram-SSR.png?raw=true" alt="BrewBench Wiring Diagram" align="center" />

[Download the Fritzing Diagram here](src/assets/BrewBench-wiring-diagram-SSR.fzz)

<img src="src/assets/img/brewbench-wiredup.jpg?raw=true" alt="BrewBench wired up" align="center" />

## Thanks

* For the Lovibond Hex colors: http://brookstonbeerbulletin.com/thinking-about-beer-color
* For the SVG icons:
  * https://thenounproject.com/dejv
  * https://thenounproject.com/creativestall
* For the Hop and Grain reference: https://byo.com
* For the recipes: http://beersmithrecipes.com
* For the bell sounds: http://www.orangefreesounds.com/category/sound-effects/bell-sound

## About

[BrewBench](https://brewbench.co) is a brew monitor and controller Developed by [Andrew Van Tassel](https://www.andrewvantassel.com) &copy;2020.  

## Help

For help look at the [forum](https://forum.brewbench.co) or start a conversation on [gitter](https://gitter.im/BrewBench/Lobby).

Made with <img src="src/assets/img/beer.png" width="45"> from Colorado
