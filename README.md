# BrewBench Monitor

http://monitor.brewbench.co

<img src="src/assets/img/brewbench-logo-265.png?raw=true" alt="BrewBench logo" title="BrewBench" align="right" />

[![Stories in Ready](https://badge.waffle.io/BrewBench/web-controller.png?label=ready&title=Ready)](https://waffle.io/BrewBench/web-controller)
![codeship](https://codeship.com/projects/8b6f3bc0-b4fd-0134-65d1-5ed8b845772e/status?branch=master)

BrewBench is an Arduino brew monitor, controller and alert system for the home brewer enthusiast.  It uses the Arduino REST API to interface with temp sensors.

#### RIMS
You can also connect a relay to the digital ports and add a heater / pump to create a RIMS system.  The software will start/stop the heater/pump based on the target temperature you set.

#### Fermenter
BrewBench Monitor can also be used with fermenters.  I have an [SS Brewtech Chronical](https://www.ssbrewtech.com/collections/chronicals) that I thread the thermistor into the temperature [thermowell](https://www.ssbrewtech.com/collections/accessories/products/weldless-thermowell-with-lcd-temp-display) along with the digital one provided.

## Setup the Arduino

See the Arduino sketches [README](arduino/)

## Open BrewBench

Go to [brewbench.co](http://brewbench.co) or clone this repo and follow dev instructions below

## Development

Install [NodeJS](https://nodejs.org)

```sh
# install yarn
npm install -g yarn
# install dependencies
yarn
# run tests
yarn test
# start dev web server
gulp
```

## Deployment

Code is compiled to a `build` directory, build the code and copy that to your web server.

```sh
# install yarn
npm install -g yarn
# install dependencies
yarn
# build files for deployment
yarn run build
```

<img src="src/assets/img/screenshot-fermenter.png?raw=true" alt="BrewBench fermenter" align="center" width="400" />

<img src="src/assets/img/screenshot-desktop.png?raw=true" alt="BrewBench screenshot" align="center" />

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

[BrewBench](//brewbench.co) is a brew monitor and controller Developed by [Andrew Van Tassel](https://www.andrewvantassel.com) and [Lee Kendrick](http://www.leekendrick.info) &copy;2017.

Made with <img src="src/assets/img/beer.png" width="45"> from Colorado
