# Change Log

## 4.7.8 - 2021-12-13

- Updated sketches to 4.6.5
- Updated BrewBench monitor app sketch for ESP32
- Fixed sketch handleNotFound JSON response

## 4.7.7 - 2021-04-14

- Added BrewBench monitor app sketch for ESP32

## 4.7.7 - 2021-02-15

- ESP32 Sketch Updates

## 4.7.6 - 2020-11-19

- Added post data to version

## 4.7.5 - 2020-11-17

- Bump asset version

## 4.7.4 - 2020-11-17

- Updated sketches to 4.6.4
- Added support for BrewBench Stick

## 4.7.3 - 2020-11-14

- Added info to app sketch with replace kettle functionality

## 4.7.2 - 2020-11-14

- Removed share code, this was not being used

## 4.7.1 - 2020-11-14

- Updated open source ESP32 sketch

## 4.7.0 - 2020-11-14

- Added IFTTT Support

## 4.6.3 - 2020-10-25

- Set knob rounding to zero

## 4.6.2 - 2020-10-25

- Icon updates

## 4.6.1 - 2020-10-25

- NPM Package updates
- Minor style updates to sketches

## 4.6.0 - 2020-10-18

- BrewBench App Support
- BMP280 Support on ESP32

## 4.5.4 - 2020-09-16

### Added
- Heater Safety that allows one heater to run at a time.

## 4.5.4 - 2020-05-29

### Added
- Changed PWM range from 5% to 1% for more accurate.

## 4.2.0 - 2018-11-16

### Added
- Timers for all kettle types
- Cannabis type
- Reboot option in settings
- Delay between actions
- Tooltips

### Updated
- ESP8266 and ESP32 to use GPIO input numbers instead of A/D mappings
- ESP8266 and ESP32 quick reference diagrams

### Fixed
- BMP180 on ESP8266
- SoilMoisture when operating on 3.3V or 5V and not D input

## 4.1.2 - 2018-11-14

### Added
- BMP180 support for ESP8266

## 4.1.1 - 2018-11-14

### Added
- ESP32 and ESP8266 OTA support for sketch updates

## 4.1.0 - 2018-11-14

### Added
- Support for BMP180 temp altitude and barometric pressure
- ESP32 and ESP8266 board support and sketches
- ESP WiFi signal

### Updated
- Icons to Font Awesome 5

## 4.0.0 - 2018-04-27

### Added
- raw analogRead/digitalRead value in response
- Debug settings option to view raw and unformatted temps
- Arduino online status
- Support for ADS1115 16bit Analog to Digital Convertor (ADC)
- Soil Moisture sensor
- Sensor percent support

### Updated
- Cleaned up Arduino and Settings styles
- JSON response from sketches to return not string "temp" is now just temp
  (This was an issue with angular number format)
- Sketches modal with more info
- InfluxDB temps to use default value

## 3.2.5 - 2018-02-25

### Fixed
- Sketch digital / analog URL parsing for value

## 3.2.4 - 2018-02-17

### Added
- Library links in the sketch modal

## 3.2.3 - 2018-02-12

### Added
- DHT12, DHT33, DHT44

### Fixed
- Duplicate sketch headers for DHT and DS18B20
- In Use pin for multiple Arduinos
- Sketch version char bug
- 500 connection error when running InfluxDB or Auto sketches in the background
- tempCommand in sketches
- PWM style

## 3.2.2 - 2018-01-13

### Updated
- js to use var instead of let due to iOS issues

## 3.2.1 - 2018-01-10

### Updated
- sketches to remove compile warnings
- removed sketch runAsynchronously to run since there seems to be [issues](https://forum.arduino.cc/index.php?topic=286841.0) with Bridge

## 3.2.0 - 2018-01-7

### Added
- [slack](https://slack.com) sketch notify feature
- [dweet.io](https://dweet.io) sketch notify feature
- multiple sketch download

### Fixed
- adjustment from F to C in auto sketches
- moment include

## 3.1.2 - 2018-01-06

### Fixed
- TP-Link issues

## 3.1.1 - 2018-01-05

### Added
- InfluxDB database list
- Kettle adjustment % to Auto and InfluxDB sketches
- Button styles
- TP-Link support

### Updated
- CSS styles
- Sketches

## 3.1.0 - 2018-01-03

### Added
- New Sketches config page under settings
- New Sketch for auto triggering heat and cool

### Fixed
- Sketches for DHT11, DHT21, DHT22

## 3.0.0 - 2017-12-27

### Added
- Support for DHT11, DHT21, DHT22
- Support for [TP-Link WiFi Plugs](http://www.tp-link.com/us/home-networking/smart-home/smart-plugs)
- Webpack for dev (replaced gulp)

## 2.9.7 - 2017-11-06

### Fixed
- IP lookup for share

## 2.9.6 - 2017-10-31

### Added
- InfluxDB user/pass login option [#17](https://github.com/BrewBench/monitor/issues/17)
- InfluxDB frequency seconds option

### Updated
- Sketches

### Fixed
- InfluxDB posting from Arduino to AWS

## 2.9.5 - 2017-10-30

### Added
- InfluxDB integration for alternate data store [#16](https://github.com/BrewBench/monitor/issues/16)
- Sticky kettles
- Air type monitor
- Import/Export Settings [#15](https://github.com/BrewBench/monitor/issues/15)

### Updated
- Layout options for list and cards
- Settings for InfluxDB

## 2.9.1 - 2017-10-23

### Added
- Kettle count to settings
- Added IBUs from recipe
- Embed display logic for share links

### Updated
- Kettle default temperatures

### Fixed
- Recipe import with missing kettles

## 2.9.0 - 2017-10-09

### Updated
- Bootstrap to v4

### Fixed
- Spacing and flex issues
- Water data populating dropdowns

## 2.8.1 - 2017-10-05

### Added
- Mobile styles and menu [#14](https://github.com/BrewBench/monitor/issues/14)

## 2.8.0 - 2017-10-05

### Added
- Support for multiple Arduinos [#12](https://github.com/BrewBench/monitor/issues/12)
- Layout Options [#10](https://github.com/BrewBench/monitor/issues/10)

### Updated
- Sketch Version 2.7.1
- Settings moved to a modal and added multiple Arduino support

## 2.7.5 - 2017-08-02

### Updated
- Sketches to check for Analog or Digital for PT100 options

## 2.7.4 - 2017-08-02

### Added
- Analog option for PT100 and DS18B20 sensors

### Fixed
- Clear settings for fullAccess share

## 2.7.3 - 2017-08-01

### Added
- Style Guide reference
- Reference highlighting

### Fixed
- All links to not reload the page
- Share all access showing all controls
- Error messages

## 2.7.2 - 2017-07-04

### Fixed
- Tests, started adding karma and jasmine tests
- BeerXML import

## 2.7.1 - 2017-07-03

### Added
- Share features for password and access level
- Refactored toggleRelay

## 2.7.0 - 2017-07-03

### Added
- SSR logic to updateTemp for auto start/stop of the relay

### Fixed
- gulp build

## 2.6.9 - 2017-07-01

### Added
- SSR option in pin dropdown as these should not use the digital port.

## 2.6.8 - 2017-06-29

### Changed
- Heater/Pump/Cooler to be either Analog or Digital for SSR relays support

### Added
- [Duty Cycle](https://www.arduino.cc/en/Tutorial/SecretsOfArduinoPWM) % adjustment to UI for when relay is digital
- Sketch to accept analogWrite command to support Duty Cycle for PWM pins and SSR relays

## 2.6.6 - 2017-06-20

### Added
- Share session

## 2.6.5 - 2017-05-07

### Added
- gulp build file and babel

## 2.6.4 - 2017-04-30

### Added
- Support for importing BeerXML recipes
- Refactored importing

## 2.6.3 - 2017-04-27

### Added
- Support for PT100 temp sensor
- Design changes for sensor selection and heat/pump/cool button groupings

### Fixed
- knob changing to Celsius

## 2.6.2 - 2017-04-16

### Added
- Ports in settings to support boards with more ports like the Arduino Mega
- Option to hide the settings
- Fermenter type with Cooling option for use with a Glycol Chiller
- New Logo

## 2.6.1 - 2017-03-22

### Added
- Remove all timers button
- Updated water additives
- Link to BrewBench on [Hackster](https://www.hackster.io/brewbench/brewbench-d64d90)!

### Fixed
- BeerSmith import with special characters

## 2.6.0 - 2017-02-04

### Notes
- Melvin 2x4 Day!

### Added
- Versioning for sketches and BrewBench console
  - BrewBench will alert if you are using an old Sketch
- Flexbox css
- Promises to loading config and init
- Notes on relay wiring in [README](README.md)
- Replace PIN if (In Use) on dropdown select
  - Previously user would need to find PIN and change it to one not being used.

### Fixed
- Timers Stop on counting up
- $http timeout to match pollSeconds
- Relay on/off comments and operation
