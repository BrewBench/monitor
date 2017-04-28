# Change Log

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
