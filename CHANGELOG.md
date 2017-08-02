# Change Log

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
