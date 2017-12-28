# BrewBench Monitor

http://monitor.brewbench.co

<img src="src/assets/img/brewbench-logo-265.png?raw=true" alt="BrewBench logo" title="BrewBench" align="right" />

![codeship](https://codeship.com/projects/8b6f3bc0-b4fd-0134-65d1-5ed8b845772e/status?branch=master)
[![Stories in Ready](https://badge.waffle.io/BrewBench/monitor.png?label=ready&title=Ready)](https://waffle.io/BrewBench/monitor)
[![Join the chat at https://gitter.im/BrewBench/Lobby](https://badges.gitter.im/BrewBench/Lobby.svg)](https://gitter.im/BrewBench/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

BrewBench is an Arduino brew monitor, controller and alert system for the home brewer enthusiast.  It uses the Arduino REST API to interface with temp sensors.

#### RIMS
You can also connect a relay to the digital ports and add a heater / pump to create a RIMS system.  The software will start/stop the heater/pump based on the target temperature you set.

#### Fermenters
BrewBench Monitor can easily be used with fermenters with a thermowell.

## Setup the Arduino

See the Arduino sketches [README](arduino/).

Works with several types of sensors: Thermistors, DS18B20, PT100, DHT11, DHT21, DHT22 and Ranco temperature controls.

And several types of relays: Sainsmart relays, Solid State relays, or smart WiFi plugs from TP-Link.

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

[BrewBench](https://brewbench.co) is a brew monitor and controller Developed by [Andrew Van Tassel](https://www.andrewvantassel.com) and [Lee Kendrick](http://www.leekendrick.info) &copy;2017.  

## Help

For help look at the [forum](https://forum.brewbench.co) or start a conversation on [gitter](https://gitter.im/BrewBench/Lobby).

Made with <img src="src/assets/img/beer.png" width="45"> from Colorado
