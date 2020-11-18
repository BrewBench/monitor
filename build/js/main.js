webpackJsonp([1],{

/***/ 334:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(335);
__webpack_require__(537);
__webpack_require__(539);
__webpack_require__(540);
__webpack_require__(541);
module.exports = __webpack_require__(542);


/***/ }),

/***/ 537:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(65);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(167);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(168);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_angular2.default.module('brewbench-monitor', ['ui.router', 'nvd3', 'ngTouch', 'duScroll', 'ui.knob', 'rzSlider']).config(function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider, $compileProvider) {

  $httpProvider.defaults.useXDomain = true;
  $httpProvider.defaults.headers.common = 'Content-Type: application/json';
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $locationProvider.hashPrefix('');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob|chrome-extension|data|local):/);

  $stateProvider.state('home', {
    url: '',
    templateUrl: 'views/monitor.html',
    controller: 'mainCtrl'
  }).state('share', {
    url: '/sh/:file',
    templateUrl: 'views/monitor.html',
    controller: 'mainCtrl'
  }).state('reset', {
    url: '/reset',
    templateUrl: 'views/monitor.html',
    controller: 'mainCtrl'
  }).state('otherwise', {
    url: '*path',
    templateUrl: 'views/not-found.html'
  });
});

/***/ }),

/***/ 539:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

angular.module('brewbench-monitor').controller('mainCtrl', function ($scope, $state, $filter, $timeout, $interval, $q, $http, $sce, BrewService) {

  $scope.clearSettings = function (e) {
    if (e) {
      angular.element(e.target).html('Removing...');
    }
    BrewService.clear();
    window.location.href = '/';
  };

  if ($state.current.name == 'reset') $scope.clearSettings();

  var notification = null;
  var resetChart = 100;
  var timeout = null; //reset chart after 100 polls

  $scope.BrewService = BrewService;
  $scope.site = { https: Boolean(document.location.protocol == 'https:'),
    https_url: 'https://' + document.location.host
  };
  $scope.esp = {
    type: '',
    ssid: '',
    ssid_pass: '',
    hostname: 'bbesp',
    arduino_pass: 'bbadmin',
    autoconnect: false
  };
  $scope.modalInfo = {};
  $scope.hops;
  $scope.grains;
  $scope.water;
  $scope.lovibond;
  $scope.pkg;
  $scope.kettleTypes = BrewService.kettleTypes();
  $scope.showSettings = true;
  $scope.error = { message: '', type: 'danger' };
  $scope.slider = {
    min: 0,
    options: {
      floor: 0,
      ceil: 100,
      step: 1,
      translate: function translate(value) {
        return value + '%';
      },
      onEnd: function onEnd(kettleId, modelValue, highValue, pointerType) {
        var kettle = kettleId.split('_');
        var k;

        switch (kettle[0]) {
          case 'heat':
            k = $scope.kettles[kettle[1]].heater;
            break;
          case 'cool':
            k = $scope.kettles[kettle[1]].cooler;
            break;
          case 'pump':
            k = $scope.kettles[kettle[1]].pump;
            break;
        }

        if (!k) return;
        if ($scope.kettles[kettle[1]].active && k.pwm && k.running) {
          return $scope.toggleRelay($scope.kettles[kettle[1]], k, true);
        }
      }
    }
  };

  $scope.openInfoModal = function (arduino) {
    $scope.modalInfo = arduino;
    $('#arduino-info').modal('toggle');
  };

  $scope.replaceKettlesWithPins = function (arduino) {
    if (arduino.info && arduino.info.pins && arduino.info.pins.length) {
      $scope.kettles = [];
      _.each(arduino.info.pins, function (pin) {
        $scope.kettles.push({
          name: pin.name,
          id: null,
          type: $scope.kettleTypes[4].type,
          active: false,
          sticky: false,
          heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
          pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
          temp: { pin: pin.pin, vcc: '', index: '', type: pin.type, adc: false, hit: false, ifttt: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[4].target, diff: $scope.kettleTypes[4].diff, raw: 0, volts: 0 },
          values: [],
          timers: [],
          knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[4].target + $scope.kettleTypes[4].diff }),
          arduino: arduino,
          message: { type: 'error', message: '', version: '', count: 0, location: '' },
          notify: { slack: false }
        });
      });
    }
  };

  $scope.getKettleSliderOptions = function (type, index) {
    return Object.assign($scope.slider.options, { id: type + '_' + index });
  };

  $scope.getLovibondColor = function (range) {
    range = range.replace(/°/g, '').replace(/ /g, '');
    if (range.indexOf('-') !== -1) {
      var rArr = range.split('-');
      range = (parseFloat(rArr[0]) + parseFloat(rArr[1])) / 2;
    } else {
      range = parseFloat(range);
    }
    if (!range) return '';
    var l = _.filter($scope.lovibond, function (item) {
      return item.srm <= range ? item.hex : '';
    });
    if (l.length) return l[l.length - 1].hex;
    return '';
  };

  //default settings values
  $scope.settings = BrewService.settings('settings') || BrewService.reset();
  if (!$scope.settings.app) $scope.settings.app = { email: '', api_key: '', status: '' };
  // general check and update
  if (!$scope.settings.general) return $scope.clearSettings();
  $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart });
  $scope.kettles = BrewService.settings('kettles') || BrewService.defaultKettles();

  $scope.openSketches = function () {
    $('#settingsModal').modal('hide');
    $('#sketchesModal').modal('show');
  };

  $scope.sumValues = function (obj) {
    return _.sumBy(obj, 'amount');
  };

  $scope.changeArduino = function (kettle) {
    if (!kettle.arduino) kettle.arduino = $scope.settings.arduinos[0];
    if (BrewService.isESP(kettle.arduino, true) == '32') {
      kettle.arduino.analog = 39;
      kettle.arduino.digital = 39;
      kettle.arduino.touch = [4, 0, 2, 15, 13, 12, 14, 27, 33, 32];
    } else if (BrewService.isESP(kettle.arduino, true) == '8266') {
      kettle.arduino.analog = 0;
      kettle.arduino.digital = 16;
    }
  };
  // check kettle type ports
  _.each($scope.kettles, function (kettle) {
    if (!kettle.arduino) kettle.arduino = $scope.settings.arduinos[0];
    if (BrewService.isESP(kettle.arduino, true) == '32') {
      kettle.arduino.analog = 39;
      kettle.arduino.digital = 39;
      kettle.arduino.touch = [4, 0, 2, 15, 13, 12, 14, 27, 33, 32];
    } else if (BrewService.isESP(kettle.arduino, true) == '8266') {
      kettle.arduino.analog = 0;
      kettle.arduino.digital = 16;
    }
  });

  // init calc values
  $scope.updateABV = function () {
    if ($scope.settings.recipe.scale == 'gravity') {
      if ($scope.settings.recipe.method == 'papazian') $scope.settings.recipe.abv = BrewService.abv($scope.settings.recipe.og, $scope.settings.recipe.fg);else $scope.settings.recipe.abv = BrewService.abva($scope.settings.recipe.og, $scope.settings.recipe.fg);
      $scope.settings.recipe.abw = BrewService.abw($scope.settings.recipe.abv, $scope.settings.recipe.fg);
      $scope.settings.recipe.attenuation = BrewService.attenuation(BrewService.plato($scope.settings.recipe.og), BrewService.plato($scope.settings.recipe.fg));
      $scope.settings.recipe.calories = BrewService.calories($scope.settings.recipe.abw, BrewService.re(BrewService.plato($scope.settings.recipe.og), BrewService.plato($scope.settings.recipe.fg)), $scope.settings.recipe.fg);
    } else {
      if ($scope.settings.recipe.method == 'papazian') $scope.settings.recipe.abv = BrewService.abv(BrewService.sg($scope.settings.recipe.og), BrewService.sg($scope.settings.recipe.fg));else $scope.settings.recipe.abv = BrewService.abva(BrewService.sg($scope.settings.recipe.og), BrewService.sg($scope.settings.recipe.fg));
      $scope.settings.recipe.abw = BrewService.abw($scope.settings.recipe.abv, BrewService.sg($scope.settings.recipe.fg));
      $scope.settings.recipe.attenuation = BrewService.attenuation($scope.settings.recipe.og, $scope.settings.recipe.fg);
      $scope.settings.recipe.calories = BrewService.calories($scope.settings.recipe.abw, BrewService.re($scope.settings.recipe.og, $scope.settings.recipe.fg), BrewService.sg($scope.settings.recipe.fg));
    }
  };

  $scope.changeMethod = function (method) {
    $scope.settings.recipe.method = method;
    $scope.updateABV();
  };

  $scope.changeScale = function (scale) {
    $scope.settings.recipe.scale = scale;
    if (scale == 'gravity') {
      $scope.settings.recipe.og = BrewService.sg($scope.settings.recipe.og);
      $scope.settings.recipe.fg = BrewService.sg($scope.settings.recipe.fg);
    } else {
      $scope.settings.recipe.og = BrewService.plato($scope.settings.recipe.og);
      $scope.settings.recipe.fg = BrewService.plato($scope.settings.recipe.fg);
    }
  };

  $scope.getStatusClass = function (status) {
    if (status == 'Connected') return 'success';else if (_.endsWith(status, 'ing')) return 'secondary';else return 'danger';
  };

  $scope.updateABV();

  $scope.getPortRange = function (number) {
    number++;
    return Array(number).fill().map(function (_, idx) {
      return 0 + idx;
    });
  };

  $scope.arduinos = {
    add: function add() {
      $('[data-toggle="tooltip"]').tooltip('hide');
      var now = new Date();
      if (!$scope.settings.arduinos) $scope.settings.arduinos = [];
      $scope.settings.arduinos.push({
        id: btoa(now + '' + $scope.settings.arduinos.length + 1),
        url: 'arduino.local',
        board: '',
        RSSI: false,
        analog: 5,
        digital: 13,
        adc: 0,
        secure: false,
        version: '',
        status: { error: '', dt: '', message: '' },
        info: {}
      });
      _.each($scope.kettles, function (kettle) {
        if (!kettle.arduino) kettle.arduino = $scope.settings.arduinos[0];
        if (BrewService.isESP(kettle.arduino, true) == '32') {
          kettle.arduino.analog = 39;
          kettle.arduino.digital = 39;
          kettle.arduino.touch = [4, 0, 2, 15, 13, 12, 14, 27, 33, 32];
        } else if (BrewService.isESP(kettle.arduino, true) == '8266') {
          kettle.arduino.analog = 0;
          kettle.arduino.digital = 16;
        }
      });
    },
    update: function update(arduino) {
      $('[data-toggle="tooltip"]').tooltip('hide');
      _.each($scope.kettles, function (kettle) {
        if (kettle.arduino && kettle.arduino.id == arduino.id) kettle.arduino = arduino;
      });
    },
    delete: function _delete(index, arduino) {
      $('[data-toggle="tooltip"]').tooltip('hide');
      $scope.settings.arduinos.splice(index, 1);
      _.each($scope.kettles, function (kettle) {
        if (kettle.arduino && kettle.arduino.id == arduino.id) delete kettle.arduino;
      });
    },
    connect: function connect(arduino) {
      $('[data-toggle="tooltip"]').tooltip('hide');
      arduino.status.dt = '';
      arduino.status.error = '';
      arduino.status.message = 'Connecting...';
      BrewService.connect(arduino, 'info').then(function (info) {
        if (info && info.BrewBench) {
          arduino.board = info.BrewBench.board;
          if (info.BrewBench.RSSI) arduino.RSSI = info.BrewBench.RSSI;
          arduino.version = info.BrewBench.version;
          arduino.status.dt = new Date();
          arduino.status.error = '';
          arduino.status.message = '';
          if (arduino.board.indexOf('ESP32') == 0 || arduino.board.indexOf('NodeMCU_32S') == 0) {
            arduino.analog = 39;
            arduino.digital = 39;
            arduino.touch = [4, 0, 2, 15, 13, 12, 14, 27, 33, 32];
          } else if (arduino.board.indexOf('ESP8266') == 0) {
            arduino.analog = 0;
            arduino.digital = 16;
          }
        }
      }).catch(function (err) {
        if (err && err.status == -1) {
          arduino.status.dt = '';
          arduino.status.message = '';
          arduino.status.error = 'Could not connect';
        }
      });
    },
    info: function info(arduino) {
      $('[data-toggle="tooltip"]').tooltip('hide');
      arduino.status.error = '';
      arduino.status.message = 'Getting Info...';
      BrewService.connect(arduino, 'info-ext').then(function (info) {
        arduino.info = info;
        arduino.status.error = '';
        arduino.status.message = '';
      }).catch(function (err) {
        arduino.info = {};
        if (err && err.status == -1) {
          arduino.status.message = '';
          if ($scope.pkg.version < 4.2) arduino.status.error = 'Upgrade to support reboot';else arduino.status.error = 'Could not connect';
        }
      });
    },
    reboot: function reboot(arduino) {
      $('[data-toggle="tooltip"]').tooltip('hide');
      arduino.status.dt = '';
      arduino.status.error = '';
      arduino.status.message = 'Rebooting...';
      BrewService.connect(arduino, 'reboot').then(function (info) {
        arduino.version = '';
        arduino.status.message = 'Reboot Success, try connecting in a few seconds.';
      }).catch(function (err) {
        if (err && err.status == -1) {
          arduino.status.dt = '';
          arduino.status.message = '';
          if (pkg.version < 4.2) arduino.status.error = 'Upgrade to support reboot';else arduino.status.error = 'Could not connect';
        }
      });
    }
  };

  $scope.tplink = {
    clear: function clear() {
      $scope.settings.tplink = { user: '', pass: '', token: '', status: '', plugs: [] };
    },
    login: function login() {
      $scope.settings.tplink.status = 'Connecting';
      BrewService.tplink().login($scope.settings.tplink.user, $scope.settings.tplink.pass).then(function (response) {
        if (response.token) {
          $scope.settings.tplink.status = 'Connected';
          $scope.settings.tplink.token = response.token;
          $scope.tplink.scan(response.token);
        } else if (response.error_code && response.msg) {
          $scope.settings.tplink.status = 'Failed to Connect';
          $scope.setErrorMessage(response.msg);
        }
      }).catch(function (err) {
        $scope.settings.tplink.status = 'Failed to Connect';
        $scope.setErrorMessage(err.msg || err);
      });
    },
    scan: function scan(token) {
      $scope.settings.tplink.plugs = [];
      $scope.settings.tplink.status = 'Scanning';
      BrewService.tplink().scan(token).then(function (response) {
        if (response.deviceList) {
          $scope.settings.tplink.status = 'Connected';
          $scope.settings.tplink.plugs = response.deviceList;
          // get device info if online (ie. status==1)
          _.each($scope.settings.tplink.plugs, function (plug) {
            if (Boolean(plug.status)) {
              BrewService.tplink().info(plug).then(function (info) {
                if (info && info.responseData) {
                  plug.info = JSON.parse(info.responseData).system.get_sysinfo;
                  if (JSON.parse(info.responseData).emeter.get_realtime.err_code == 0) {
                    plug.power = JSON.parse(info.responseData).emeter.get_realtime;
                  } else {
                    plug.power = null;
                  }
                }
              });
            }
          });
        }
      });
    },
    info: function info(device) {
      BrewService.tplink().info(device).then(function (response) {
        return response;
      });
    },
    toggle: function toggle(device) {
      var offOrOn = device.info.relay_state == 1 ? 0 : 1;
      BrewService.tplink().toggle(device, offOrOn).then(function (response) {
        device.info.relay_state = offOrOn;
        return response;
      }).then(function (toggleResponse) {
        $timeout(function () {
          // update the info
          return BrewService.tplink().info(device).then(function (info) {
            if (info && info.responseData) {
              device.info = JSON.parse(info.responseData).system.get_sysinfo;
              if (JSON.parse(info.responseData).emeter.get_realtime.err_code == 0) {
                device.power = JSON.parse(info.responseData).emeter.get_realtime;
              } else {
                device.power = null;
              }
              return device;
            }
            return device;
          });
        }, 1000);
      });
    }
  };

  $scope.ifttt = {
    clear: function clear() {
      $scope.settings.ifttt = { url: '', method: 'GET', auth: { key: '', value: '' }, status: '' };
    },
    connect: function connect() {
      $scope.settings.ifttt.status = 'Connecting';
      BrewService.ifttt().connect().then(function (response) {
        if (response) {
          $scope.settings.ifttt.status = 'Connected';
        }
      }).catch(function (err) {
        $scope.settings.ifttt.status = 'Failed to Connect';
        $scope.setErrorMessage(err.msg || err);
      });
    }
  };

  $scope.addKettle = function (type) {
    if (!$scope.kettles) $scope.kettles = [];
    var arduino = $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false };
    $scope.kettles.push({
      name: type ? _.find($scope.kettleTypes, { type: type }).name : $scope.kettleTypes[0].name,
      id: null,
      type: type || $scope.kettleTypes[0].type,
      active: false,
      sticky: false,
      heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      temp: { pin: 'A0', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, ifttt: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0, volts: 0 },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: arduino,
      message: { type: 'error', message: '', version: '', count: 0, location: '' },
      notify: { slack: false }
    });
  };

  $scope.hasStickyKettles = function (type) {
    return _.filter($scope.kettles, { 'sticky': true }).length;
  };

  $scope.kettleCount = function (type) {
    return _.filter($scope.kettles, { 'type': type }).length;
  };

  $scope.activeKettles = function () {
    return _.filter($scope.kettles, { 'active': true }).length;
  };

  $scope.heatIsOn = function () {
    return Boolean(_.filter($scope.kettles, { 'heater': { 'running': true } }).length);
  };

  $scope.pinDisplay = function (arduino, pin) {
    if (pin.indexOf('TP-') === 0) {
      var device = _.filter($scope.settings.tplink.plugs, { deviceId: pin.substr(3) })[0];
      return device ? device.alias : '';
    } else if (BrewService.isESP(arduino)) {
      if (BrewService.isESP(arduino, true) == '8266') return pin.replace('D', 'GPIO');else return pin.replace('A', 'GPIO').replace('D', 'GPIO');
    } else {
      return pin;
    }
  };

  $scope.pinInUse = function (pin, arduinoId) {
    var kettle = _.find($scope.kettles, function (kettle) {
      return kettle.arduino.id == arduinoId && (kettle.temp.pin == pin || kettle.temp.vcc == pin || kettle.heater.pin == pin || kettle.cooler && kettle.cooler.pin == pin || !kettle.cooler && kettle.pump.pin == pin);
    });
    return kettle || false;
  };

  $scope.changeSensor = function (kettle) {
    if (Boolean(BrewService.sensorTypes(kettle.temp.type).percent)) {
      kettle.knob.unit = '%';
    } else {
      kettle.knob.unit = '\xB0';
    }
    kettle.temp.vcc = '';
    kettle.temp.index = '';
  };

  $scope.influxdb = {
    remove: function remove() {
      var defaultSettings = BrewService.reset();
      $scope.settings.influxdb = defaultSettings.influxdb;
    },
    connect: function connect() {
      $scope.settings.influxdb.status = 'Connecting';
      BrewService.influxdb().ping($scope.settings.influxdb).then(function (response) {
        if (response.status == 204 || response.status == 200) {
          $('#influxdbUrl').removeClass('is-invalid');
          $scope.settings.influxdb.status = 'Connected';
          //get list of databases
          BrewService.influxdb().dbs().then(function (response) {
            if (response.length) {
              var dbs = [].concat.apply([], response);
              $scope.settings.influxdb.dbs = _.remove(dbs, function (db) {
                return db != "_internal";
              });
            }
          });
        } else {
          $('#influxdbUrl').addClass('is-invalid');
          $scope.settings.influxdb.status = 'Failed to Connect';
        }
      }).catch(function (err) {
        $('#influxdbUrl').addClass('is-invalid');
        $scope.settings.influxdb.status = 'Failed to Connect';
      });
    },
    create: function create() {
      var db = $scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD');
      $scope.settings.influxdb.created = false;
      BrewService.influxdb().createDB(db).then(function (response) {
        // prompt for password
        if (response.data && response.data.results && response.data.results.length) {
          $scope.settings.influxdb.db = db;
          $scope.settings.influxdb.created = true;
          $('#influxdbUser').removeClass('is-invalid');
          $('#influxdbPass').removeClass('is-invalid');
          $scope.resetError();
        } else {
          $scope.setErrorMessage("Opps, there was a problem creating the database.");
        }
      }).catch(function (err) {
        if (err.status && (err.status == 401 || err.status == 403)) {
          $('#influxdbUser').addClass('is-invalid');
          $('#influxdbPass').addClass('is-invalid');
          $scope.setErrorMessage("Enter your Username and Password for InfluxDB");
        } else if (err) {
          $scope.setErrorMessage(err);
        } else {
          $scope.setErrorMessage("Opps, there was a problem creating the database.");
        }
      });
    }
  };

  $scope.app = {
    connected: function connected() {
      return Boolean($scope.settings.app.email) && Boolean($scope.settings.app.api_key) && $scope.settings.app.status == 'Connected';
    },
    remove: function remove() {
      var defaultSettings = BrewService.reset();
      $scope.settings.app = defaultSettings.app;
    },
    connect: function connect() {
      if (!Boolean($scope.settings.app.email) || !Boolean($scope.settings.app.api_key)) return;
      $scope.settings.app.status = 'Connecting';
      return BrewService.app().auth().then(function (response) {
        $scope.settings.app.status = 'Connected';
      }).catch(function (err) {
        console.error(err);
        $scope.settings.app.status = 'Failed to Connect';
      });
    }
  };

  $scope.importRecipe = function ($fileContent, $ext) {

    // parse the imported content
    var formatted_content = BrewService.formatXML($fileContent);
    var jsonObj,
        recipe = null;

    if (Boolean(formatted_content)) {
      var x2js = new X2JS();
      jsonObj = x2js.xml_str2json(formatted_content);
    }

    if (!jsonObj) return $scope.recipe_success = false;

    if ($ext == 'bsmx') {
      if (Boolean(jsonObj.Recipes) && Boolean(jsonObj.Recipes.Data.Recipe)) recipe = jsonObj.Recipes.Data.Recipe;else if (Boolean(jsonObj.Selections) && Boolean(jsonObj.Selections.Data.Recipe)) recipe = jsonObj.Selections.Data.Recipe;
      if (recipe) recipe = BrewService.recipeBeerSmith(recipe);else return $scope.recipe_success = false;
    } else if ($ext == 'xml') {
      if (Boolean(jsonObj.RECIPES) && Boolean(jsonObj.RECIPES.RECIPE)) recipe = jsonObj.RECIPES.RECIPE;
      if (recipe) recipe = BrewService.recipeBeerXML(recipe);else return $scope.recipe_success = false;
    }

    if (!recipe) return $scope.recipe_success = false;

    if (Boolean(recipe.og)) $scope.settings.recipe.og = recipe.og;
    if (Boolean(recipe.fg)) $scope.settings.recipe.fg = recipe.fg;

    $scope.settings.recipe.name = recipe.name;
    $scope.settings.recipe.category = recipe.category;
    $scope.settings.recipe.abv = recipe.abv;
    $scope.settings.recipe.ibu = recipe.ibu;
    $scope.settings.recipe.date = recipe.date;
    $scope.settings.recipe.brewer = recipe.brewer;

    if (recipe.grains.length) {
      // recipe display
      $scope.settings.recipe.grains = [];
      _.each(recipe.grains, function (grain) {
        if ($scope.settings.recipe.grains.length && _.filter($scope.settings.recipe.grains, { name: grain.label }).length) {
          _.filter($scope.settings.recipe.grains, { name: grain.label })[0].amount += parseFloat(grain.amount);
        } else {
          $scope.settings.recipe.grains.push({
            name: grain.label, amount: parseFloat(grain.amount)
          });
        }
      });
      // timers
      var kettle = _.filter($scope.kettles, { type: 'grain' })[0];
      if (kettle) {
        kettle.timers = [];
        _.each(recipe.grains, function (grain) {
          if (kettle) {
            $scope.addTimer(kettle, {
              label: grain.label,
              min: grain.min,
              notes: grain.notes
            });
          }
        });
      }
    }

    if (recipe.hops.length) {
      // recipe display
      $scope.settings.recipe.hops = [];
      _.each(recipe.hops, function (hop) {
        if ($scope.settings.recipe.hops.length && _.filter($scope.settings.recipe.hops, { name: hop.label }).length) {
          _.filter($scope.settings.recipe.hops, { name: hop.label })[0].amount += parseFloat(hop.amount);
        } else {
          $scope.settings.recipe.hops.push({
            name: hop.label, amount: parseFloat(hop.amount)
          });
        }
      });
      // timers
      var kettle = _.filter($scope.kettles, { type: 'hop' })[0];
      if (kettle) {
        kettle.timers = [];
        _.each(recipe.hops, function (hop) {
          if (kettle) {
            $scope.addTimer(kettle, {
              label: hop.label,
              min: hop.min,
              notes: hop.notes
            });
          }
        });
      }
    }
    if (recipe.misc.length) {
      // timers
      var kettle = _.filter($scope.kettles, { type: 'water' })[0];
      if (kettle) {
        kettle.timers = [];
        _.each(recipe.misc, function (misc) {
          $scope.addTimer(kettle, {
            label: misc.label,
            min: misc.min,
            notes: misc.notes
          });
        });
      }
    }
    if (recipe.yeast.length) {
      // recipe display
      $scope.settings.recipe.yeast = [];
      _.each(recipe.yeast, function (yeast) {
        $scope.settings.recipe.yeast.push({
          name: yeast.name
        });
      });
    }
    $scope.recipe_success = true;
  };

  $scope.loadStyles = function () {
    if (!$scope.styles) {
      BrewService.styles().then(function (response) {
        $scope.styles = response;
      });
    }
  };

  $scope.loadConfig = function () {
    var config = [];
    if (!$scope.pkg) {
      config.push(BrewService.pkg().then(function (response) {
        $scope.pkg = response;
      }));
    }

    if (!$scope.grains) {
      config.push(BrewService.grains().then(function (response) {
        return $scope.grains = _.sortBy(_.uniqBy(response, 'name'), 'name');
      }));
    }

    if (!$scope.hops) {
      config.push(BrewService.hops().then(function (response) {
        return $scope.hops = _.sortBy(_.uniqBy(response, 'name'), 'name');
      }));
    }

    if (!$scope.water) {
      config.push(BrewService.water().then(function (response) {
        return $scope.water = _.sortBy(_.uniqBy(response, 'salt'), 'salt');
      }));
    }

    if (!$scope.lovibond) {
      config.push(BrewService.lovibond().then(function (response) {
        return $scope.lovibond = response;
      }));
    }

    return $q.all(config);
  };

  // check if pump or heater are running
  $scope.init = function () {
    $('[data-toggle="tooltip"]').tooltip({
      animated: 'fade',
      placement: 'right',
      html: true
    });
    if ($('#gitcommit a').text() != 'git_commit') {
      $('#gitcommit').show();
    }

    _.each($scope.kettles, function (kettle) {
      //update max
      kettle.knob.max = kettle.temp['target'] + kettle.temp['diff'] + 10;
      // check timers for running
      if (Boolean(kettle.timers) && kettle.timers.length) {
        _.each(kettle.timers, function (timer) {
          if (timer.running) {
            timer.running = false;
            $scope.timerStart(timer, kettle);
          } else if (!timer.running && timer.queue) {
            $timeout(function () {
              $scope.timerStart(timer, kettle);
            }, 60000);
          } else if (timer.up && timer.up.running) {
            timer.up.running = false;
            $scope.timerStart(timer.up);
          }
        });
      }
      $scope.updateKnobCopy(kettle);
    });

    return true;
  };

  $scope.setErrorMessage = function (err, kettle, location) {
    var message;

    if (typeof err == 'string' && err.indexOf('{') !== -1) {
      if (!Object.keys(err).length) return;
      err = JSON.parse(err);
      if (!Object.keys(err).length) return;
    }

    if (typeof err == 'string') message = err;else if (Boolean(err.statusText)) message = err.statusText;else if (err.config && err.config.url) message = err.config.url;else if (err.version) {
      if (kettle) kettle.message.version = err.version;
    } else {
      message = JSON.stringify(err);
      if (message == '{}') message = '';
    }

    if (Boolean(message)) {
      if (kettle) {
        kettle.message.type = 'danger';
        kettle.message.count = 0;
        kettle.message.message = $sce.trustAsHtml('Connection error: ' + message);
        if (location) kettle.message.location = location;
        $scope.updateArduinoStatus({ kettle: kettle }, message);
        $scope.updateKnobCopy(kettle);
      } else {
        $scope.error.message = $sce.trustAsHtml('Error: ' + message);
      }
    } else if (kettle) {
      kettle.message.count = 0;
      kettle.message.message = $sce.trustAsHtml('Error connecting to ' + BrewService.domain(kettle.arduino));
      $scope.updateArduinoStatus({ kettle: kettle }, kettle.message.message);
    } else {
      $scope.error.message = $sce.trustAsHtml('Connection error:');
    }
  };
  $scope.updateArduinoStatus = function (response, error) {
    var arduino = _.filter($scope.settings.arduinos, { id: response.kettle.arduino.id });
    if (arduino.length) {
      arduino[0].status.dt = new Date();
      if (response.sketch_version) arduino[0].version = response.sketch_version;
      if (error) arduino[0].status.error = error;else arduino[0].status.error = '';
    }
  };

  $scope.resetError = function (kettle) {
    if (kettle) {
      kettle.message.count = 0;
      kettle.message.message = $sce.trustAsHtml('');
      $scope.updateArduinoStatus({ kettle: kettle });
    } else {
      $scope.error.type = 'danger';
      $scope.error.message = $sce.trustAsHtml('');
    }
  };

  $scope.updateTemp = function (response, kettle) {
    if (!response) {
      return false;
    }

    $scope.resetError(kettle);
    // needed for charts
    kettle.key = kettle.name;
    var temps = [];
    //chart date
    var date = new Date();
    //update datatype
    response.temp = parseFloat(response.temp);
    response.raw = parseFloat(response.raw);
    if (response.volts) response.volts = parseFloat(response.volts);

    if (Boolean(kettle.temp.current)) kettle.temp.previous = kettle.temp.current;
    // temp response is in C
    kettle.temp.measured = $scope.settings.general.unit == 'F' ? $filter('toFahrenheit')(response.temp) : $filter('round')(response.temp, 2);

    // add adjustment
    kettle.temp.current = $filter('round')(parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust), 0);
    // set raw
    kettle.temp.raw = response.raw;
    kettle.temp.volts = response.volts;

    // volt check
    if (kettle.temp.type != 'BMP180' && kettle.temp.type != 'BMP280' && !kettle.temp.volts && !kettle.temp.raw) {
      $scope.setErrorMessage('Sensor is not connected', kettle);
      return;
    } else if (kettle.temp.type == 'DS18B20' && response.temp == -127) {
      $scope.setErrorMessage('Sensor is not connected', kettle);
      return;
    }

    // reset all kettles every resetChart
    if (kettle.values.length > resetChart) {
      $scope.kettles.map(function (k) {
        return k.values.shift();
      });
    }

    //DHT sensors have humidity as a percent
    //SoilMoistureD has moisture as a percent
    if (typeof response.percent != 'undefined') {
      kettle.percent = $filter('round')(response.percent, 0);
    }
    // BMP sensors have altitude and pressure
    if (typeof response.altitude != 'undefined') {
      kettle.altitude = response.altitude;
    }
    if (typeof response.pressure != 'undefined') {
      // pascal to inches of mercury
      kettle.pressure = response.pressure / 3386.389;
    }
    if (typeof response.co2_ppm != 'undefined') {
      // pascal to inches of mercury
      kettle.co2_ppm = response.co2_ppm;
    }

    $scope.updateKnobCopy(kettle);
    $scope.updateArduinoStatus({ kettle: kettle, sketch_version: response.sketch_version });

    var currentValue = kettle.temp.current;
    var unitType = '\xB0';
    //percent?
    if (Boolean(BrewService.sensorTypes(kettle.temp.type).percent) && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    } else {
      kettle.values.push([date.getTime(), currentValue]);
    }

    //is temp too high?
    if (currentValue > kettle.temp.target + kettle.temp.diff) {
      $scope.notify(kettle);
      //stop the heating element
      if (kettle.heater && kettle.heater.auto && kettle.heater.running) {
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if (kettle.pump && kettle.pump.auto && kettle.pump.running) {
        temps.push($scope.toggleRelay(kettle, kettle.pump, false));
      }
      //start the chiller
      if (kettle.cooler && kettle.cooler.auto && !kettle.cooler.running) {
        temps.push($scope.toggleRelay(kettle, kettle.cooler, true).then(function (cooler) {
          kettle.knob.subText.text = 'cooling';
          kettle.knob.subText.color = 'rgba(52,152,219,1)';
        }));
      }
    } //is temp too low?
    else if (currentValue < kettle.temp.target - kettle.temp.diff) {
        $scope.notify(kettle);
        //start the heating element
        if (kettle.heater && kettle.heater.auto && !kettle.heater.running) {
          temps.push($scope.toggleRelay(kettle, kettle.heater, true).then(function (heating) {
            kettle.knob.subText.text = 'heating';
            kettle.knob.subText.color = 'rgba(200,47,47,1)';
          }));
        }
        //start the pump
        if (kettle.pump && kettle.pump.auto && !kettle.pump.running) {
          temps.push($scope.toggleRelay(kettle, kettle.pump, true));
        }
        //stop the cooler
        if (kettle.cooler && kettle.cooler.auto && kettle.cooler.running) {
          temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
        }
      } else {
        // within target!
        kettle.temp.hit = new Date(); //set the time the target was hit so we can now start alerts
        $scope.notify(kettle);
        //stop the heater
        if (kettle.heater && kettle.heater.auto && kettle.heater.running) {
          temps.push($scope.toggleRelay(kettle, kettle.heater, false));
        }
        //stop the pump
        if (kettle.pump && kettle.pump.auto && kettle.pump.running) {
          temps.push($scope.toggleRelay(kettle, kettle.pump, false));
        }
        //stop the cooler
        if (kettle.cooler && kettle.cooler.auto && kettle.cooler.running) {
          temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
        }
      }
    return $q.all(temps);
  };

  $scope.getNavOffset = function () {
    return 125 + angular.element(document.getElementById('navbar'))[0].offsetHeight;
  };

  $scope.addTimer = function (kettle, options) {
    if (!kettle.timers) kettle.timers = [];
    if (options) {
      options.min = options.min ? options.min : 0;
      options.sec = options.sec ? options.sec : 0;
      options.running = options.running ? options.running : false;
      options.queue = options.queue ? options.queue : false;
      kettle.timers.push(options);
    } else {
      kettle.timers.push({ label: 'Edit label', min: 60, sec: 0, running: false, queue: false });
    }
  };

  $scope.removeTimers = function (e, kettle) {
    var btn = angular.element(e.target);
    if (btn.hasClass('fa-trash-alt')) btn = btn.parent();

    if (!btn.hasClass('btn-danger')) {
      btn.removeClass('btn-light').addClass('btn-danger');
      $timeout(function () {
        btn.removeClass('btn-danger').addClass('btn-light');
      }, 2000);
    } else {
      btn.removeClass('btn-danger').addClass('btn-light');
      kettle.timers = [];
    }
  };

  $scope.togglePWM = function (kettle) {
    kettle.pwm = !kettle.pwm;
    if (kettle.pwm) kettle.ssr = true;
  };

  $scope.toggleKettle = function (item, kettle) {

    $scope.resetError(kettle);
    var k;
    var heatIsOn = $scope.heatIsOn();

    switch (item) {
      case 'heat':
        k = kettle.heater;
        break;
      case 'cool':
        k = kettle.cooler;
        break;
      case 'pump':
        k = kettle.pump;
        break;
    }

    if (!k) return;

    if (!k.running) {
      //start the relay
      if (item == 'heat' && $scope.settings.general.heatSafety && heatIsOn) {
        $scope.setErrorMessage('A heater is already running.', kettle);
      } else {
        k.running = !k.running;
        $scope.toggleRelay(kettle, k, true);
      }
    } else if (k.running) {
      //stop the relay
      k.running = !k.running;
      $scope.toggleRelay(kettle, k, false);
    }
  };

  $scope.hasSketches = function (kettle) {
    var hasASketch = false;
    _.each($scope.kettles, function (kettle) {
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.slack) {
        hasASketch = true;
      }
    });
    return hasASketch;
  };

  $scope.startStopKettle = function (kettle) {
    kettle.active = !kettle.active;
    $scope.resetError(kettle);
    var date = new Date();
    if (kettle.active) {
      kettle.knob.subText.text = 'starting...';

      BrewService.temp(kettle).then(function (response) {
        return $scope.updateTemp(response, kettle);
      }).catch(function (err) {
        // udpate chart with current
        kettle.values.push([date.getTime(), kettle.temp.current]);
        kettle.message.count++;
        if (kettle.message.count == 7) $scope.setErrorMessage(err, kettle);
      });

      // start the relays
      if (kettle.heater.running) {
        $scope.toggleRelay(kettle, kettle.heater, true);
      }
      if (kettle.pump && kettle.pump.running) {
        $scope.toggleRelay(kettle, kettle.pump, true);
      }
      if (kettle.cooler && kettle.cooler.running) {
        $scope.toggleRelay(kettle, kettle.cooler, true);
      }
    } else {

      //stop the heater
      if (!kettle.active && kettle.heater.running) {
        $scope.toggleRelay(kettle, kettle.heater, false);
      }
      //stop the pump
      if (!kettle.active && kettle.pump && kettle.pump.running) {
        $scope.toggleRelay(kettle, kettle.pump, false);
      }
      //stop the cooler
      if (!kettle.active && kettle.cooler && kettle.cooler.running) {
        $scope.toggleRelay(kettle, kettle.cooler, false);
      }
      if (!kettle.active) {
        if (kettle.pump) kettle.pump.auto = false;
        if (kettle.heater) kettle.heater.auto = false;
        if (kettle.cooler) kettle.cooler.auto = false;
        $scope.updateKnobCopy(kettle);
      }
    }
  };

  $scope.toggleRelay = function (kettle, element, on) {
    if (on) {
      if (element.pin.indexOf('TP-') === 0) {
        var device = _.filter($scope.settings.tplink.plugs, { deviceId: element.pin.substr(3) })[0];
        return BrewService.tplink().on(device).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else if (element.pwm) {
        return BrewService.analog(kettle, element.pin, Math.round(255 * element.dutyCycle / 100)).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else if (element.ssr) {
        return BrewService.analog(kettle, element.pin, 255).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else {
        return BrewService.digital(kettle, element.pin, 1).then(function () {
          //started
          element.running = true;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      }
    } else {
      if (element.pin.indexOf('TP-') === 0) {
        var device = _.filter($scope.settings.tplink.plugs, { deviceId: element.pin.substr(3) })[0];
        return BrewService.tplink().off(device).then(function () {
          //started
          element.running = false;
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else if (element.pwm || element.ssr) {
        return BrewService.analog(kettle, element.pin, 0).then(function () {
          element.running = false;
          $scope.updateKnobCopy(kettle);
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      } else {
        return BrewService.digital(kettle, element.pin, 0).then(function () {
          element.running = false;
          $scope.updateKnobCopy(kettle);
        }).catch(function (err) {
          return $scope.setErrorMessage(err, kettle);
        });
      }
    }
  };

  $scope.importSettings = function ($fileContent, $ext) {
    try {
      var profileContent = JSON.parse($fileContent);
      $scope.settings = profileContent.settings || BrewService.reset();
      $scope.kettles = profileContent.kettles || BrewService.defaultKettles();
    } catch (e) {
      // error importing
      $scope.setErrorMessage(e);
    }
  };

  $scope.exportSettings = function () {
    var kettles = angular.copy($scope.kettles);
    _.each(kettles, function (kettle, i) {
      kettles[i].values = [];
      kettles[i].active = false;
    });
    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ "settings": $scope.settings, "kettles": kettles }));
  };

  $scope.compileSketch = function (sketchName) {
    if (!$scope.settings.sensors) $scope.settings.sensors = {};
    // append esp type
    if (sketchName.indexOf('ESP') !== -1 && !sketchName.indexOf('ESP32') === -1) sketchName += $scope.esp.type;
    var sketches = [];
    var arduinoName = '';
    _.each($scope.kettles, function (kettle, i) {
      arduinoName = kettle.arduino ? kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, "") : 'Default';
      var currentSketch = _.find(sketches, { name: arduinoName });
      if (!currentSketch) {
        sketches.push({
          name: arduinoName,
          type: sketchName,
          actions: [],
          pins: [],
          headers: [],
          triggers: false,
          bf: sketchName.indexOf('BF') !== -1 ? true : false
        });
        currentSketch = _.find(sketches, { name: arduinoName });
      }
      var target = $scope.settings.general.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      kettle.temp.adjust = parseFloat(kettle.temp.adjust);
      var adjust = $scope.settings.general.unit == 'F' && Boolean(kettle.temp.adjust) ? $filter('round')(kettle.temp.adjust * 0.555, 3) : kettle.temp.adjust;
      if (BrewService.isESP(kettle.arduino) && $scope.esp.autoconnect) {
        currentSketch.headers.push('#include <AutoConnect.h>');
      }
      if ((sketchName.indexOf('ESP') !== -1 || BrewService.isESP(kettle.arduino)) && ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1) && currentSketch.headers.indexOf('#include "DHTesp.h"') === -1) {
        currentSketch.headers.push('// https://github.com/beegee-tokyo/DHTesp');
        currentSketch.headers.push('#include "DHTesp.h"');
      } else if (!BrewService.isESP(kettle.arduino) && ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1) && currentSketch.headers.indexOf('#include <dht.h>') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTlib-1.2.9.zip');
        currentSketch.headers.push('#include <dht.h>');
      }
      if ($scope.settings.sensors.DS18B20 || kettle.temp.type.indexOf('DS18B20') !== -1) {
        if (currentSketch.headers.indexOf('#include <OneWire.h>') === -1) currentSketch.headers.push('#include <OneWire.h>');
        if (currentSketch.headers.indexOf('#include <DallasTemperature.h>') === -1) currentSketch.headers.push('#include <DallasTemperature.h>');
      }
      if ($scope.settings.sensors.BMP || kettle.temp.type.indexOf('BMP180') !== -1) {
        if (currentSketch.headers.indexOf('#include <Wire.h>') === -1) currentSketch.headers.push('#include <Wire.h>');
        if (currentSketch.headers.indexOf('#include <Adafruit_BMP085.h>') === -1) currentSketch.headers.push('#include <Adafruit_BMP085.h>');
      }
      if ($scope.settings.sensors.BMP || kettle.temp.type.indexOf('BMP280') !== -1) {
        if (currentSketch.headers.indexOf('#include <Wire.h>') === -1) currentSketch.headers.push('#include <Wire.h>');
        if (currentSketch.headers.indexOf('#include <Adafruit_BMP280.h>') === -1) currentSketch.headers.push('#include <Adafruit_BMP280.h>');
      }
      // Are we using ADC?
      if (kettle.temp.pin.indexOf('C') === 0 && currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) {
        currentSketch.headers.push('// https://github.com/adafruit/Adafruit_ADS1X15');
        if (currentSketch.headers.indexOf('#include <OneWire.h>') === -1) currentSketch.headers.push('#include <Wire.h>');
        if (currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) currentSketch.headers.push('#include <Adafruit_ADS1015.h>');
      }
      // add the actions command
      var kettleType = kettle.temp.type;
      if (kettle.temp.vcc) kettleType += kettle.temp.vcc;

      if (kettle.temp.index) kettleType += '-' + kettle.temp.index;
      currentSketch.actions.push('  actionsCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettleType + '"),' + adjust + ');');
      currentSketch.actions.push('  delay(500);');
      // used for info endpoint
      if (currentSketch.pins.length) {
        currentSketch.pins.push(' pins += ", {\\"name\\":\\"" + String("' + kettle.name + '") + "\\",\\"pin\\":\\"" + String("' + kettle.temp.pin + '") + "\\",\\"type\\":\\"" + String("' + kettleType + '") + "\\",\\"adjust\\":\\"" + String("' + adjust + '") + "\\"}";');
      } else {
        currentSketch.pins.push(' pins += "{\\"name\\":\\"" + String("' + kettle.name + '") + "\\",\\"pin\\":\\"" + String("' + kettle.temp.pin + '") + "\\",\\"type\\":\\"" + String("' + kettleType + '") + "\\",\\"adjust\\":\\"" + String("' + adjust + '") + "\\"}";');
      }

      if ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1 && kettle.percent) {
        currentSketch.actions.push('  actionsPercentCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '-Humidity"),F("' + kettle.temp.pin + '"),F("' + kettleType + '"),' + adjust + ');');
        currentSketch.actions.push('  delay(500);');
      }

      //look for triggers
      if (kettle.heater && kettle.heater.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('  trigger(F("heat"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + Boolean(kettle.notify.slack) + ');');
      }
      if (kettle.cooler && kettle.cooler.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('  trigger(F("cool"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + Boolean(kettle.notify.slack) + ');');
      }
    });
    _.each(sketches, function (sketch, i) {
      if (sketch.triggers || sketch.bf) {
        if (sketch.type.indexOf('M5') === -1) {
          sketch.actions.unshift('float temp = 0.00;');
          if (sketch.bf) {
            sketch.actions.unshift('float ambient = 0.00;');
            sketch.actions.unshift('float humidity = 0.00;');
            sketch.actions.unshift('const String equipment_name = "' + $scope.settings.bf.name + '";');
          }
        }
        // update autoCommand 
        for (var a = 0; a < sketch.actions.length; a++) {
          if (sketch.bf && sketches[i].actions[a].indexOf('actionsPercentCommand(') !== -1 && sketches[i].actions[a].toLowerCase().indexOf('humidity') !== -1) {
            // BF logic
            sketches[i].actions[a] = sketches[i].actions[a].replace('actionsPercentCommand(', 'humidity = actionsPercentCommand(');
          } else if (sketch.bf && sketches[i].actions[a].indexOf('actionsCommand(') !== -1 && sketches[i].actions[a].toLowerCase().indexOf('ambient') !== -1) {
            // BF logic
            sketches[i].actions[a] = sketches[i].actions[a].replace('actionsCommand(', 'ambient = actionsCommand(');
          } else if (sketches[i].actions[a].indexOf('actionsCommand(') !== -1) {
            // All other logic
            sketches[i].actions[a] = sketches[i].actions[a].replace('actionsCommand(', 'temp = actionsCommand(');
          }
        }
      }
      downloadSketch(sketch.name, sketch.actions, sketch.pins, sketch.triggers, sketch.headers, 'BrewBench' + sketchName);
    });
  };

  function downloadSketch(name, actions, pins, hasTriggers, headers, sketch) {
    // tp link connection
    var tplink_connection_string = BrewService.tplink().connection();
    var autogen = '/*\nSketch Auto Generated from http://monitor.brewbench.co\nVersion ' + $scope.pkg.sketch_version + ' ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + '\n*/\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = autogen + response.data.replace('// [ACTIONS]', actions.length ? actions.join('\n') : '').replace('// [PINS]', pins.length ? pins.join('\n') : '').replace('// [HEADERS]', headers.length ? headers.join('\n') : '').replace(/\[VERSION\]/g, $scope.pkg.sketch_version).replace(/\[TPLINK_CONNECTION\]/g, tplink_connection_string).replace(/\[SLACK_CONNECTION\]/g, $scope.settings.notifications.slack);

      // ESP variables
      if (sketch.indexOf('ESP') !== -1) {
        if ($scope.esp.ssid) {
          response.data = response.data.replace(/\[SSID\]/g, $scope.esp.ssid);
        }
        if ($scope.esp.ssid_pass) {
          response.data = response.data.replace(/\[SSID_PASS\]/g, $scope.esp.ssid_pass);
        }
        if ($scope.esp.arduino_pass) {
          response.data = response.data.replace(/\[ARDUINO_PASS\]/g, md5($scope.esp.arduino_pass));
        } else {
          response.data = response.data.replace(/\[ARDUINO_PASS\]/g, md5('bbadmin'));
        }
        if ($scope.esp.hostname) {
          response.data = response.data.replace(/\[HOSTNAME\]/g, $scope.esp.hostname);
        } else {
          response.data = response.data.replace(/\[HOSTNAME\]/g, 'bbesp');
        }
      } else {
        response.data = response.data.replace(/\[HOSTNAME\]/g, name.replace('.local', ''));
      }
      if (sketch.indexOf('App') !== -1) {
        // app connection
        response.data = response.data.replace(/\[APP_AUTH\]/g, 'X-API-KEY: ' + $scope.settings.app.api_key.trim());
      } else if (sketch.indexOf('BFYun') !== -1) {
        // bf api key header
        response.data = response.data.replace(/\[BF_AUTH\]/g, 'X-API-KEY: ' + $scope.settings.bf.api_key.trim());
      } else if (sketch.indexOf('InfluxDB') !== -1) {
        // influx db connection
        var connection_string = '' + $scope.settings.influxdb.url;
        if (Boolean($scope.settings.influxdb.port)) connection_string += ':' + $scope.settings.influxdb.port;
        connection_string += '/write?';
        // add user/pass
        if (Boolean($scope.settings.influxdb.user) && Boolean($scope.settings.influxdb.pass)) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
        // add db
        connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));
        response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, '');
        response.data = response.data.replace(/\[INFLUXDB_CONNECTION\]/g, connection_string);
      }
      if ($scope.settings.sensors.THC) {
        response.data = response.data.replace(/\/\/ THC /g, '');
      }
      if (headers.indexOf('#include <dht.h>') !== -1 || headers.indexOf('#include "DHTesp.h"') !== -1) {
        response.data = response.data.replace(/\/\/ DHT /g, '');
      }
      if (headers.indexOf('#include <DallasTemperature.h>') !== -1) {
        response.data = response.data.replace(/\/\/ DS18B20 /g, '');
      }
      if (headers.indexOf('#include <Adafruit_ADS1015.h>') !== -1) {
        response.data = response.data.replace(/\/\/ ADC /g, '');
      }
      if (headers.indexOf('#include <Adafruit_BMP085.h>') !== -1) {
        response.data = response.data.replace(/\/\/ BMP180 /g, '');
      }
      if (headers.indexOf('#include <Adafruit_BMP280.h>') !== -1) {
        response.data = response.data.replace(/\/\/ BMP280 /g, '');
      }
      if (hasTriggers) {
        response.data = response.data.replace(/\/\/ triggers /g, '');
      }
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', sketch + '-' + name + '-' + $scope.pkg.sketch_version + '.ino');
      streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
      streamSketch.style.display = 'none';
      document.body.appendChild(streamSketch);
      streamSketch.click();
      document.body.removeChild(streamSketch);
    }).catch(function (err) {
      $scope.setErrorMessage('Failed to download sketch ' + err.message);
    });
  }

  $scope.getIPAddress = function () {
    $scope.settings.ipAddress = "";
    BrewService.ip().then(function (response) {
      $scope.settings.ipAddress = response.ip;
    }).catch(function (err) {
      $scope.setErrorMessage(err);
    });
  };

  $scope.notify = function (kettle, timer) {

    //don't start alerts until we have hit the temp.target
    if (!timer && kettle && !kettle.temp.hit || $scope.settings.notifications.on === false) {
      return;
    }
    var date = new Date();
    // Desktop / Slack Notification
    var message,
        icon = '/assets/img/brewbench-logo.png',
        color = 'good';

    if (kettle && ['hop', 'grain', 'water', 'fermenter'].indexOf(kettle.type) !== -1) icon = '/assets/img/' + kettle.type + '.png';

    //don't alert if the heater is running and temp is too low
    if (kettle && kettle.low && kettle.heater.running) return;

    var currentValue = kettle && kettle.temp ? kettle.temp.current : 0;
    var unitType = '\xB0' + $scope.settings.general.unit;
    //percent?
    if (kettle && Boolean(BrewService.sensorTypes(kettle.temp.type).percent) && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    } else if (kettle) {
      kettle.values.push([date.getTime(), currentValue]);
    }

    if (Boolean(timer)) {
      //kettle is a timer object
      if (!$scope.settings.notifications.timers) return;
      if (timer.up) message = 'Your timers are done';else if (Boolean(timer.notes)) message = 'Time to add ' + timer.notes + ' of ' + timer.label;else message = 'Time to add ' + timer.label;
    } else if (kettle && kettle.high) {
      if (!$scope.settings.notifications.high || $scope.settings.notifications.last == 'high') return;
      message = kettle.name + ' is ' + $filter('round')(kettle.high - kettle.temp.diff, 0) + unitType + ' high';
      color = 'danger';
      $scope.settings.notifications.last = 'high';
    } else if (kettle && kettle.low) {
      if (!$scope.settings.notifications.low || $scope.settings.notifications.last == 'low') return;
      message = kettle.name + ' is ' + $filter('round')(kettle.low - kettle.temp.diff, 0) + unitType + ' low';
      color = '#3498DB';
      $scope.settings.notifications.last = 'low';
    } else if (kettle) {
      if (!$scope.settings.notifications.target || $scope.settings.notifications.last == 'target') return;
      message = kettle.name + ' is within the target at ' + currentValue + unitType;
      color = 'good';
      $scope.settings.notifications.last = 'target';
    } else if (!kettle) {
      message = 'Testing Alerts, you are ready to go, click play on a kettle.';
    }

    // Mobile Vibrate Notification
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 300, 500]);
    }

    // Sound Notification
    if ($scope.settings.sounds.on === true) {
      //don't alert if the heater is running and temp is too low
      if (Boolean(timer) && kettle && kettle.low && kettle.heater.running) return;
      var snd = new Audio(Boolean(timer) ? $scope.settings.sounds.timer : $scope.settings.sounds.alert); // buffers automatically when created
      snd.play();
    }

    // Window Notification
    if ("Notification" in window) {
      //close the measured notification
      if (notification) notification.close();

      if (Notification.permission === "granted") {
        if (message) {
          if (kettle) notification = new Notification(kettle.name + ' kettle', { body: message, icon: icon });else notification = new Notification('Test kettle', { body: message, icon: icon });
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if (message) {
              notification = new Notification(kettle.name + ' kettle', { body: message, icon: icon });
            }
          }
        });
      }
    }
    // Slack Notification
    if ($scope.settings.notifications.slack && $scope.settings.notifications.slack.indexOf('http') === 0) {
      BrewService.slack($scope.settings.notifications.slack, message, color, icon, kettle).then(function (response) {
        $scope.resetError();
      }).catch(function (err) {
        if (err.message) $scope.setErrorMessage('Failed posting to Slack ' + err.message);else $scope.setErrorMessage('Failed posting to Slack ' + JSON.stringify(err));
      });
    }
    // IFTTT Notification
    if (Boolean(kettle.temp.ifttt) && $scope.settings.ifttt.url && $scope.settings.ifttt.url.indexOf('http') === 0) {
      BrewService.ifttt().send({
        message: message,
        color: color,
        unit: $scope.settings.general.unit,
        name: kettle.name,
        type: kettle.type,
        temp: kettle.temp,
        heater: kettle.heater,
        pump: kettle.pump,
        cooler: kettle.cooler || {},
        arduino: kettle.arduino
      }).then(function (response) {
        $scope.resetError();
      }).catch(function (err) {
        if (err.message) $scope.setErrorMessage('Failed sending to IFTTT ' + err.message);else $scope.setErrorMessage('Failed sending to IFTTT ' + JSON.stringify(err));
      });
    }
  };

  $scope.updateKnobCopy = function (kettle) {

    if (!kettle.active) {
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'not running';
      kettle.knob.subText.color = 'gray';
      return;
    } else if (kettle.message.message && kettle.message.type == 'danger') {
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'error';
      kettle.knob.subText.color = 'gray';
      return;
    }
    var currentValue = kettle.temp.current;
    var unitType = '\xB0';
    //percent?
    if (Boolean(BrewService.sensorTypes(kettle.temp.type).percent) && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    }
    //is currentValue too high?
    if (currentValue > kettle.temp.target + kettle.temp.diff) {
      kettle.knob.barColor = 'rgba(255,0,0,.6)';
      kettle.knob.trackColor = 'rgba(255,0,0,.1)';
      kettle.high = currentValue - kettle.temp.target;
      kettle.low = null;
      if (kettle.cooler && kettle.cooler.running) {
        kettle.knob.subText.text = 'cooling';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.high - kettle.temp.diff, 0) + unitType + ' high';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      }
    } else if (currentValue < kettle.temp.target - kettle.temp.diff) {
      kettle.knob.barColor = 'rgba(52,152,219,.5)';
      kettle.knob.trackColor = 'rgba(52,152,219,.1)';
      kettle.low = kettle.temp.target - currentValue;
      kettle.high = null;
      if (kettle.heater.running) {
        kettle.knob.subText.text = 'heating';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.low - kettle.temp.diff, 0) + unitType + ' low';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      }
    } else {
      kettle.knob.barColor = 'rgba(44,193,133,.6)';
      kettle.knob.trackColor = 'rgba(44,193,133,.1)';
      kettle.knob.subText.text = 'within target';
      kettle.knob.subText.color = 'gray';
      kettle.low = null;
      kettle.high = null;
    }
  };

  $scope.changeKettleType = function (kettle) {
    // find current kettle
    var kettleIndex = _.findIndex($scope.kettleTypes, { type: kettle.type });
    // move to next or first kettle in array
    kettleIndex++;
    var kettleType = $scope.kettleTypes[kettleIndex] ? $scope.kettleTypes[kettleIndex] : $scope.kettleTypes[0];
    //update kettle options if changed
    kettle.name = kettleType.name;
    kettle.type = kettleType.type;
    kettle.temp.target = kettleType.target;
    kettle.temp.diff = kettleType.diff;
    kettle.knob = angular.copy(BrewService.defaultKnobOptions(), { value: kettle.temp.current, min: 0, max: kettleType.target + kettleType.diff });
    if (kettleType.type == 'fermenter' || kettleType.type == 'air') {
      kettle.cooler = { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false };
      delete kettle.pump;
    } else {
      kettle.pump = { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false };
      delete kettle.cooler;
    }
  };

  $scope.changeUnits = function (unit) {
    if ($scope.settings.general.unit != unit) {
      $scope.settings.general.unit = unit;
      _.each($scope.kettles, function (kettle) {
        kettle.temp.target = parseFloat(kettle.temp.target);
        kettle.temp.current = parseFloat(kettle.temp.current);
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current, unit);
        kettle.temp.measured = $filter('formatDegrees')(kettle.temp.measured, unit);
        kettle.temp.previous = $filter('formatDegrees')(kettle.temp.previous, unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target, unit);
        kettle.temp.target = $filter('round')(kettle.temp.target, 0);
        if (Boolean(kettle.temp.adjust)) {
          kettle.temp.adjust = parseFloat(kettle.temp.adjust);
          if (unit === 'C') kettle.temp.adjust = $filter('round')(kettle.temp.adjust * 0.555, 3);else kettle.temp.adjust = $filter('round')(kettle.temp.adjust * 1.8, 0);
        }
        // update chart values
        if (kettle.values.length) {
          _.each(kettle.values, function (v, i) {
            kettle.values[i] = [kettle.values[i][0], $filter('formatDegrees')(kettle.values[i][1], unit)];
          });
        }
        // update knob
        kettle.knob.value = kettle.temp.current;
        kettle.knob.max = kettle.temp.target + kettle.temp.diff + 10;
        $scope.updateKnobCopy(kettle);
      });
      $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart });
    }
  };

  $scope.timerRun = function (timer, kettle) {
    return $interval(function () {
      //cancel interval if zero out
      if (!timer.up && timer.min == 0 && timer.sec == 0) {
        //stop running
        timer.running = false;
        //start up counter
        timer.up = { min: 0, sec: 0, running: true };
        //if all timers are done send an alert
        if (Boolean(kettle) && _.filter(kettle.timers, { up: { running: true } }).length == kettle.timers.length) $scope.notify(kettle, timer);
      } else if (!timer.up && timer.sec > 0) {
        //count down seconds
        timer.sec--;
      } else if (timer.up && timer.up.sec < 59) {
        //count up seconds
        timer.up.sec++;
      } else if (!timer.up) {
        //should we start the next timer?
        if (Boolean(kettle)) {
          _.each(_.filter(kettle.timers, { running: false, min: timer.min, queue: false }), function (nextTimer) {
            $scope.notify(kettle, nextTimer);
            nextTimer.queue = true;
            $timeout(function () {
              $scope.timerStart(nextTimer, kettle);
            }, 60000);
          });
        }
        //cound down minutes and seconds
        timer.sec = 59;
        timer.min--;
      } else if (timer.up) {
        //cound up minutes and seconds
        timer.up.sec = 0;
        timer.up.min++;
      }
    }, 1000);
  };

  $scope.timerStart = function (timer, kettle) {
    if (timer.up && timer.up.running) {
      //stop timer
      timer.up.running = false;
      $interval.cancel(timer.interval);
    } else if (timer.running) {
      //stop timer
      timer.running = false;
      $interval.cancel(timer.interval);
    } else {
      //start timer
      timer.running = true;
      timer.queue = false;
      timer.interval = $scope.timerRun(timer, kettle);
    }
  };

  $scope.processTemps = function () {
    var allSensors = [];
    var date = new Date();
    //only process active sensors
    _.each($scope.kettles, function (k, i) {
      if ($scope.kettles[i].active) {
        allSensors.push(BrewService.temp($scope.kettles[i]).then(function (response) {
          return $scope.updateTemp(response, $scope.kettles[i]);
        }).catch(function (err) {
          // update chart with current
          kettle.values.push([date.getTime(), kettle.temp.current]);
          if ($scope.kettles[i].error.count) $scope.kettles[i].error.count++;else $scope.kettles[i].error.count = 1;
          if ($scope.kettles[i].error.count == 7) {
            $scope.kettles[i].error.count = 0;
            $scope.setErrorMessage(err, $scope.kettles[i]);
          }
          return err;
        }));
      }
    });

    return $q.all(allSensors).then(function (values) {
      //re process on timeout
      $timeout(function () {
        return $scope.processTemps();
      }, Boolean($scope.settings.pollSeconds) ? $scope.settings.pollSeconds * 1000 : 10000);
    }).catch(function (err) {
      $timeout(function () {
        return $scope.processTemps();
      }, Boolean($scope.settings.pollSeconds) ? $scope.settings.pollSeconds * 1000 : 10000);
    });
  };

  $scope.removeKettle = function (kettle, $index) {
    if (confirm('Are you sure you want to remove this kettle?')) $scope.kettles.splice($index, 1);
  };

  $scope.clearKettle = function (kettle, $index) {
    $scope.kettles[$index].values = [];
  };

  $scope.changeValue = function (kettle, field, up) {

    if (timeout) $timeout.cancel(timeout);

    if (up) kettle.temp[field]++;else kettle.temp[field]--;

    if (field == 'adjust') {
      kettle.temp.current = parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust);
    }

    //update knob after 1 seconds, otherwise we get a lot of refresh on the knob when clicking plus or minus
    timeout = $timeout(function () {
      //update max
      kettle.knob.max = kettle.temp['target'] + kettle.temp['diff'] + 10;
      $scope.updateKnobCopy(kettle);
    }, 1000);
  };

  $scope.loadConfig() // load config
  .then($scope.init) // init
  .then(function (loaded) {
    if (Boolean(loaded)) $scope.processTemps(); // start polling
  });

  // update local cache
  $scope.updateLocal = function () {
    $timeout(function () {
      BrewService.settings('settings', $scope.settings);
      BrewService.settings('kettles', $scope.kettles);
      $scope.updateLocal();
    }, 5000);
  };

  $scope.updateLocal();
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(66)))

/***/ }),

/***/ 540:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


angular.module('brewbench-monitor').directive('editable', function () {
    return {
        restrict: 'E',
        scope: { model: '=', type: '@?', trim: '@?', change: '&?', enter: '&?', placeholder: '@?' },
        replace: false,
        template: '<span>' + '<input type="{{type}}" ng-model="model" ng-show="edit" ng-enter="edit=false" ng-change="{{change||false}}" class="editable"></input>' + '<span class="editable" ng-show="!edit">{{(trim) ? ((type=="password") ? "*******" : ((model || placeholder) | limitTo:trim)+"...") :' + ' ((type=="password") ? "*******" : (model || placeholder))}}</span>' + '</span>',
        link: function link(scope, element, attrs) {
            scope.edit = false;
            scope.type = Boolean(scope.type) ? scope.type : 'text';
            element.bind('click', function () {
                scope.$apply(scope.edit = true);
            });
            if (scope.enter) scope.enter();
        }
    };
}).directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind('keypress', function (e) {
            if (e.charCode === 13 || e.keyCode === 13) {
                scope.$apply(attrs.ngEnter);
                if (scope.change) scope.$apply(scope.change);
            }
        });
    };
}).directive('onReadFile', function ($parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function link(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);
            element.on('change', function (onChangeEvent) {
                var reader = new FileReader();
                var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];
                var extension = file ? file.name.split('.').pop().toLowerCase() : '';
                reader.onload = function (onLoadEvent) {
                    scope.$apply(function () {
                        fn(scope, { $fileContent: onLoadEvent.target.result, $ext: extension });
                        element.val(null);
                    });
                };
                reader.readAsText(file);
            });
        }
    };
});

/***/ }),

/***/ 541:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


angular.module('brewbench-monitor').filter('moment', function () {
  return function (date, format) {
    if (!date) return '';
    if (format) return moment(new Date(date)).format(format);else return moment(new Date(date)).fromNow();
  };
}).filter('formatDegrees', function ($filter) {
  return function (temp, unit) {
    if (unit == 'F') return $filter('toFahrenheit')(temp);else return $filter('toCelsius')(temp);
  };
}).filter('toFahrenheit', function ($filter) {
  return function (celsius) {
    celsius = parseFloat(celsius);
    return $filter('round')(celsius * 9 / 5 + 32, 2);
  };
}).filter('toCelsius', function ($filter) {
  return function (fahrenheit) {
    fahrenheit = parseFloat(fahrenheit);
    return $filter('round')((fahrenheit - 32) * 5 / 9, 2);
  };
}).filter('round', function ($filter) {
  return function (val, decimals) {
    return Number(Math.round(val + "e" + decimals) + "e-" + decimals);
  };
}).filter('highlight', function ($sce) {
  return function (text, phrase) {
    if (text && phrase) {
      text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span class="highlighted">$1</span>');
    } else if (!text) {
      text = '';
    }
    return $sce.trustAsHtml(text.toString());
  };
}).filter('titlecase', function ($filter) {
  return function (text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
}).filter('dbmPercent', function ($filter) {
  return function (dbm) {
    return 2 * (dbm + 100);
  };
}).filter('kilogramsToOunces', function ($filter) {
  return function (kg) {
    if (typeof kg === 'undefined' || isNaN(kg)) return '';
    return $filter('number')(kg * 35.274, 2);
  };
}).filter('kilogramsToPounds', function ($filter) {
  return function (kg) {
    if (typeof kg === 'undefined' || isNaN(kg)) return '';
    return $filter('number')(kg * 2.20462, 2);
  };
});

/***/ }),

/***/ 542:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(jQuery) {

angular.module('brewbench-monitor').factory('BrewService', function ($http, $q, $filter) {

  return {

    //cookies size 4096 bytes
    clear: function clear() {
      if (window.localStorage) {
        window.localStorage.removeItem('settings');
        window.localStorage.removeItem('kettles');
      }
    },

    reset: function reset() {
      var defaultSettings = {
        general: { debug: false, pollSeconds: 10, unit: 'F', heatSafety: false },
        chart: { show: true, military: false, area: false },
        sensors: { DHT: false, DS18B20: false, BMP: false },
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        arduinos: [{ id: 'local-' + btoa('brewbench'), board: '', RSSI: false, url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '', message: '' }, info: {} }],
        tplink: { user: '', pass: '', token: '', status: '', plugs: [] },
        ifttt: { url: '', method: 'GET', auth: { key: '', value: '' }, status: '' },
        influxdb: { url: '', port: '', user: '', pass: '', db: '', dbs: [], status: '' },
        app: { email: '', api_key: '', status: '' }
      };
      return defaultSettings;
    },

    defaultKnobOptions: function defaultKnobOptions() {
      return {
        readOnly: true,
        unit: '\xB0',
        subText: {
          enabled: true,
          text: '',
          color: 'gray',
          font: 'auto'
        },
        trackWidth: 40,
        barWidth: 25,
        barCap: 25,
        trackColor: '#ddd',
        barColor: '#777',
        dynamicOptions: true,
        displayPrevious: true,
        prevBarColor: '#777'
      };
    },

    defaultKettles: function defaultKettles() {
      return [{
        name: 'Hot Liquor',
        id: null,
        type: 'water',
        active: false,
        sticky: false,
        heater: { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D3', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A0', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, ifttt: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false }
      }, {
        name: 'Mash',
        id: null,
        type: 'grain',
        active: false,
        sticky: false,
        heater: { pin: 'D4', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D5', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A1', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, ifttt: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false }
      }, {
        name: 'Boil',
        id: null,
        type: 'hop',
        active: false,
        sticky: false,
        heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A2', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, ifttt: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false }
      }];
    },

    settings: function settings(key, values) {
      if (!window.localStorage) return values;
      try {
        if (values) {
          return window.localStorage.setItem(key, JSON.stringify(values));
        } else if (window.localStorage.getItem(key)) {
          return JSON.parse(window.localStorage.getItem(key));
        } else if (key == 'settings') {
          return this.reset();
        }
      } catch (e) {
        /*JSON parse error*/
      }
      return values;
    },

    sensorTypes: function sensorTypes(name) {
      var sensors = [{ name: 'Thermistor', analog: true, digital: false, esp: true }, { name: 'DS18B20', analog: false, digital: true, esp: true }, { name: 'PT100', analog: true, digital: true, esp: true }, { name: 'DHT11', analog: false, digital: true, esp: true }, { name: 'DHT12', analog: false, digital: true, esp: false }, { name: 'DHT21', analog: false, digital: true, esp: false }, { name: 'DHT22', analog: false, digital: true, esp: true }, { name: 'DHT33', analog: false, digital: true, esp: false }, { name: 'DHT44', analog: false, digital: true, esp: false }, { name: 'SoilMoisture', analog: true, digital: false, vcc: true, percent: true, esp: true }, { name: 'BMP180', analog: true, digital: false, esp: true }, { name: 'BMP280', analog: true, digital: false, esp: true }, { name: 'SHT3X', analog: true, digital: false, esp: true }, { name: 'MH-Z16', analog: true, digital: false, esp: true }];
      if (name) return _.filter(sensors, { 'name': name })[0];
      return sensors;
    },

    kettleTypes: function kettleTypes(type) {
      var kettles = [{ 'name': 'Boil', 'type': 'hop', 'target': 200, 'diff': 2 }, { 'name': 'Mash', 'type': 'grain', 'target': 152, 'diff': 2 }, { 'name': 'Hot Liquor', 'type': 'water', 'target': 170, 'diff': 2 }, { 'name': 'Fermenter', 'type': 'fermenter', 'target': 74, 'diff': 2 }, { 'name': 'Temp', 'type': 'air', 'target': 74, 'diff': 2 }, { 'name': 'Soil', 'type': 'seedling', 'target': 60, 'diff': 2 }, { 'name': 'Plant', 'type': 'cannabis', 'target': 60, 'diff': 2 }];
      if (type) return _.filter(kettles, { 'type': type })[0];
      return kettles;
    },

    domain: function domain(arduino) {
      var settings = this.settings('settings');
      var domain = 'http://arduino.local';

      if (arduino && arduino.url) {
        domain = arduino.url.indexOf('//') !== -1 ? arduino.url.substr(arduino.url.indexOf('//') + 2) : arduino.url;

        if (Boolean(arduino.secure)) domain = 'https://' + domain;else domain = 'http://' + domain;
      }

      return domain;
    },

    isESP: function isESP(arduino, return_version) {
      if (return_version) {
        if (arduino.board.toLowerCase().indexOf('32') !== -1 || arduino.board.toLowerCase().indexOf('m5stick_c') !== -1) return '32';else if (arduino.board.toLowerCase().indexOf('8266') !== -1) return '8266';else return false;
      }
      return Boolean(arduino && arduino.board && (arduino.board.toLowerCase().indexOf('esp') !== -1 || arduino.board.toLowerCase().indexOf('nodemcu') !== -1 || arduino.board.toLowerCase().indexOf('m5stick_c') !== -1));
    },

    slack: function slack(webhook_url, msg, color, icon, kettle) {
      var q = $q.defer();

      var postObj = { 'attachments': [{ 'fallback': msg,
          'title': kettle.name,
          'title_link': 'http://' + document.location.host,
          'fields': [{ 'value': msg }],
          'color': color,
          'mrkdwn_in': ['text', 'fallback', 'fields'],
          'thumb_url': icon
        }]
      };

      $http({ url: webhook_url, method: 'POST', data: 'payload=' + JSON.stringify(postObj), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    connect: function connect(arduino, endpoint) {
      var q = $q.defer();
      var url = this.domain(arduino) + '/arduino/' + endpoint;
      // extended info
      if (endpoint == 'info-ext') url = this.domain(arduino) + '/info';
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: 10000 };
      $http(request).then(function (response) {
        if (response.headers('X-Sketch-Version')) response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },
    // Thermistor, DS18B20, or PT100
    // https://learn.adafruit.com/thermistor/using-a-thermistor
    // https://www.adafruit.com/product/381)
    // https://www.adafruit.com/product/3290 and https://www.adafruit.com/product/3328
    temp: function temp(kettle) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/' + kettle.temp.type;
      if (this.isESP(kettle.arduino)) {
        if (kettle.temp.pin.indexOf('A') === 0 || kettle.temp.pin.indexOf('G') === 0) url += '?apin=' + kettle.temp.pin;else url += '?dpin=' + kettle.temp.pin;
        if (Boolean(kettle.temp.vcc) && ['3V', '5V'].indexOf(kettle.temp.vcc) === -1) //SoilMoisture logic
          url += '&dpin=' + kettle.temp.vcc;else if (Boolean(kettle.temp.index)) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
      } else {
        if (Boolean(kettle.temp.vcc) && ['3V', '5V'].indexOf(kettle.temp.vcc) === -1) //SoilMoisture logic
          url += kettle.temp.vcc;else if (Boolean(kettle.temp.index)) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
        url += '/' + kettle.temp.pin;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },
    // read/write heater
    // http://arduinotronics.blogspot.com/2013/01/working-with-sainsmart-5v-relay-board.html
    // http://myhowtosandprojects.blogspot.com/2014/02/sainsmart-2-channel-5v-relay-arduino.html
    digital: function digital(kettle, sensor, value) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/digital';
      if (this.isESP(kettle.arduino)) {
        url += '?dpin=' + sensor + '&value=' + value;
      } else {
        url += '/' + sensor + '/' + value;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };
      request.headers = { 'Content-Type': 'application/json' };
      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password.trim());
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    analog: function analog(kettle, sensor, value) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/analog';
      if (this.isESP(kettle.arduino)) {
        url += '?apin=' + sensor + '&value=' + value;
      } else {
        url += '/' + sensor + '/' + value;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    digitalRead: function digitalRead(kettle, sensor, timeout) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/digital';
      if (this.isESP(kettle.arduino)) {
        url += '?dpin=' + sensor;
      } else {
        url += '/' + sensor;
      }
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password.trim()) };
      }

      $http(request).then(function (response) {
        response.data.sketch_version = response.headers('X-Sketch-Version');
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    tplink: function tplink() {
      var _this = this;

      var url = "https://wap.tplinkcloud.com";
      var params = {
        appName: 'Kasa_Android',
        termID: 'BrewBench',
        appVer: '1.4.4.607',
        ospf: 'Android+6.0.1',
        netType: 'wifi',
        locale: 'es_EN'
      };
      return {
        connection: function connection() {
          var settings = _this.settings('settings');
          if (settings.tplink.token) {
            params.token = settings.tplink.token;
            return url + '/?' + jQuery.param(params);
          }
          return '';
        },
        login: function login(user, pass) {
          var q = $q.defer();
          if (!user || !pass) return q.reject('Invalid Login');
          var login_payload = {
            "method": "login",
            "url": url,
            "params": {
              "appType": "Kasa_Android",
              "cloudPassword": pass,
              "cloudUserName": user,
              "terminalUUID": params.termID
            }
          };
          $http({ url: url,
            method: 'POST',
            params: params,
            data: JSON.stringify(login_payload),
            headers: { 'Content-Type': 'application/json' }
          }).then(function (response) {
            // save the token
            if (response.data.result) {
              q.resolve(response.data.result);
            } else {
              q.reject(response.data);
            }
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        scan: function scan(token) {
          var q = $q.defer();
          var settings = _this.settings('settings');
          token = token || settings.tplink.token;
          if (!token) return q.reject('Invalid token');
          $http({ url: url,
            method: 'POST',
            params: { token: token },
            data: JSON.stringify({ method: "getDeviceList" }),
            headers: { 'Content-Type': 'application/json' }
          }).then(function (response) {
            q.resolve(response.data.result);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        command: function command(device, _command) {
          var q = $q.defer();
          var settings = _this.settings('settings');
          var token = settings.tplink.token;
          var payload = {
            "method": "passthrough",
            "params": {
              "deviceId": device.deviceId,
              "requestData": JSON.stringify(_command)
            }
          };
          // set the token
          if (!token) return q.reject('Invalid token');
          params.token = token;
          $http({ url: device.appServerUrl,
            method: 'POST',
            params: params,
            data: JSON.stringify(payload),
            headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' }
          }).then(function (response) {
            q.resolve(response.data.result);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        toggle: function toggle(device, _toggle) {
          var command = { "system": { "set_relay_state": { "state": _toggle } } };
          return _this.tplink().command(device, command);
        },
        info: function info(device) {
          var command = { "system": { "get_sysinfo": null }, "emeter": { "get_realtime": null } };
          return _this.tplink().command(device, command);
        }
      };
    },

    ifttt: function ifttt() {
      var _this2 = this;

      return {
        config: function config(data) {
          var settings = _this2.settings('settings');
          var headers = { 'Content-Type': 'application/json' };
          if (settings.ifttt.auth.key && settings.ifttt.auth.value) {
            headers[settings.ifttt.auth.key] = settings.ifttt.auth.value;
          }
          var http = {
            url: settings.ifttt.url,
            method: settings.ifttt.method,
            headers: headers
          };
          if (settings.ifttt.method == 'GET') http.params = data;else http.data = data;
          return http;
        },

        connect: function connect() {
          var q = $q.defer();
          var data = { 'brewbench': true };
          var http_config = _this2.ifttt().config(data);

          if (!http_config.url) {
            return q.reject('Missing URL');
          }

          $http(http_config).then(function (response) {
            if (response.status) {
              q.resolve('Connection status ' + response.status);
            } else {
              q.reject(response.data);
            }
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },

        send: function send(data) {
          var q = $q.defer();
          var http_config = _this2.ifttt().config(data);

          if (!http_config.url) {
            return q.reject('Missing URL');
          }

          $http(http_config).then(function (response) {
            if (response.status) {
              q.resolve('Connection status ' + response.status);
            } else {
              q.reject(response.data);
            }
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        }
      };
    },

    app: function app() {
      var settings = this.settings('settings');
      var request = { url: 'https://sensor.brewbench.co/', headers: {}, timeout: 10000 };

      return {
        auth: async function auth() {
          var q = $q.defer();
          if (settings.app.api_key && settings.app.email) {
            request.url += 'users/' + settings.app.api_key;
            request.method = 'GET';
            request.headers['X-API-KEY'] = '' + settings.app.api_key;
            request.headers['X-API-EMAIL'] = '' + settings.app.email;
            $http(request).then(function (response) {
              if (response && response.data && response.data.success) q.resolve(response);else q.reject("User not found");
            }).catch(function (err) {
              q.reject(err);
            });
          } else {
            q.reject(false);
          }
          return q.promise;
        }
      };
    },

    // do calcs that exist on the sketch
    bitcalc: function bitcalc(kettle) {
      var average = kettle.temp.raw;
      // https://www.arduino.cc/reference/en/language/functions/math/map/
      function fmap(x, in_min, in_max, out_min, out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
      }
      if (kettle.temp.type == 'Thermistor') {
        var THERMISTORNOMINAL = 10000;
        // temp. for nominal resistance (almost always 25 C)
        var TEMPERATURENOMINAL = 25;
        // how many samples to take and average, more takes longer
        // but is more 'smooth'
        var NUMSAMPLES = 5;
        // The beta coefficient of the thermistor (usually 3000-4000)
        var BCOEFFICIENT = 3950;
        // the value of the 'other' resistor
        var SERIESRESISTOR = 10000;
        // convert the value to resistance
        // Are we using ADC?
        if (kettle.temp.pin.indexOf('C') === 0) {
          average = average * (5.0 / 65535) / 0.0001;
          var ln = Math.log(average / THERMISTORNOMINAL);
          var kelvin = 1 / (0.0033540170 + 0.00025617244 * ln + 0.0000021400943 * ln * ln + -0.000000072405219 * ln * ln * ln);
          // kelvin to celsius
          return kelvin - 273.15;
        } else {
          average = 1023 / average - 1;
          average = SERIESRESISTOR / average;

          var steinhart = average / THERMISTORNOMINAL; // (R/Ro)
          steinhart = Math.log(steinhart); // ln(R/Ro)
          steinhart /= BCOEFFICIENT; // 1/B * ln(R/Ro)
          steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
          steinhart = 1.0 / steinhart; // Invert
          steinhart -= 273.15;
          return steinhart;
        }
      } else if (kettle.temp.type == 'PT100') {
        if (kettle.temp.raw && kettle.temp.raw > 409) {
          return 150 * fmap(kettle.temp.raw, 410, 1023, 0, 614) / 614;
        }
      }
      return 'N/A';
    },

    influxdb: function influxdb() {
      var q = $q.defer();
      var settings = this.settings('settings');
      var influxConnection = '' + settings.influxdb.url;
      if (Boolean(settings.influxdb.port)) influxConnection += ':' + settings.influxdb.port;

      return {
        ping: function ping(influxdb) {
          if (influxdb && influxdb.url) {
            influxConnection = '' + influxdb.url;
            if (Boolean(influxdb.port)) influxConnection += ':' + influxdb.port;
          }
          var request = { url: '' + influxConnection, method: 'GET' };
          $http(request).then(function (response) {
            q.resolve(response);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        dbs: function dbs() {
          $http({ url: influxConnection + '/query?u=' + settings.influxdb.user.trim() + '&p=' + settings.influxdb.pass.trim() + '&q=' + encodeURIComponent('show databases'), method: 'GET' }).then(function (response) {
            if (response.data && response.data.results && response.data.results.length && response.data.results[0].series && response.data.results[0].series.length && response.data.results[0].series[0].values) {
              q.resolve(response.data.results[0].series[0].values);
            } else {
              q.resolve([]);
            }
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        createDB: function createDB(name) {
          $http({ url: influxConnection + '/query?u=' + settings.influxdb.user.trim() + '&p=' + settings.influxdb.pass.trim() + '&q=' + encodeURIComponent('CREATE DATABASE "' + name + '"'), method: 'POST' }).then(function (response) {
            q.resolve(response);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        }
      };
    },

    pkg: function pkg() {
      var q = $q.defer();
      $http.get('/package.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    grains: function grains() {
      var q = $q.defer();
      $http.get('/assets/data/grains.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    hops: function hops() {
      var q = $q.defer();
      $http.get('/assets/data/hops.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    water: function water() {
      var q = $q.defer();
      $http.get('/assets/data/water.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    styles: function styles() {
      var q = $q.defer();
      $http.get('/assets/data/styleguide.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    lovibond: function lovibond() {
      var q = $q.defer();
      $http.get('/assets/data/lovibond.json').then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    chartOptions: function chartOptions(options) {
      return {
        chart: {
          type: 'lineChart',
          title: {
            enable: Boolean(options.session),
            text: Boolean(options.session) ? options.session : ''
          },
          noData: 'BrewBench Monitor',
          height: 350,
          margin: {
            top: 20,
            right: 20,
            bottom: 100,
            left: 65
          },
          x: function x(d) {
            return d && d.length ? d[0] : d;
          },
          y: function y(d) {
            return d && d.length ? d[1] : d;
          },
          // average: function(d) { return d.mean },

          color: d3.scale.category10().range(),
          duration: 300,
          useInteractiveGuideline: true,
          clipVoronoi: false,
          interpolate: 'basis',
          legend: {
            key: function key(d) {
              return d.name;
            }
          },
          isArea: function isArea(d) {
            return Boolean(options.chart.area);
          },
          xAxis: {
            axisLabel: 'Time',
            tickFormat: function tickFormat(d) {
              if (Boolean(options.chart.military)) return d3.time.format('%H:%M:%S')(new Date(d)).toLowerCase();else return d3.time.format('%I:%M:%S%p')(new Date(d)).toLowerCase();
            },
            orient: 'bottom',
            tickPadding: 20,
            axisLabelDistance: 40,
            staggerLabels: true
          },
          forceY: !options.unit || options.unit == 'F' ? [0, 220] : [-17, 104],
          yAxis: {
            axisLabel: 'Temperature',
            tickFormat: function tickFormat(d) {
              return $filter('number')(d, 0) + '\xB0';
            },
            orient: 'left',
            showMaxMin: true,
            axisLabelDistance: 0
          }
        }
      };
    },
    // http://www.brewersfriend.com/2011/06/16/alcohol-by-volume-calculator-updated/
    // Papazian
    abv: function abv(og, fg) {
      return ((og - fg) * 131.25).toFixed(2);
    },
    // Daniels, used for high gravity beers
    abva: function abva(og, fg) {
      return (76.08 * (og - fg) / (1.775 - og) * (fg / 0.794)).toFixed(2);
    },
    // http://hbd.org/ensmingr/
    abw: function abw(abv, fg) {
      return (0.79 * abv / fg).toFixed(2);
    },
    re: function re(op, fp) {
      return 0.1808 * op + 0.8192 * fp;
    },
    attenuation: function attenuation(op, fp) {
      return ((1 - fp / op) * 100).toFixed(2);
    },
    calories: function calories(abw, re, fg) {
      return ((6.9 * abw + 4.0 * (re - 0.1)) * fg * 3.55).toFixed(1);
    },
    // http://www.brewersfriend.com/plato-to-sg-conversion-chart/
    sg: function sg(plato) {
      if (!plato) return '';
      var sg = 1 + plato / (258.6 - plato / 258.2 * 227.1);
      return parseFloat(sg).toFixed(3);
    },
    plato: function plato(sg) {
      if (!sg) return '';
      var plato = (-1 * 616.868 + 1111.14 * sg - 630.272 * Math.pow(sg, 2) + 135.997 * Math.pow(sg, 3)).toString();
      if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) == 5) plato = plato.substring(0, plato.indexOf('.') + 2);else if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) < 5) plato = plato.substring(0, plato.indexOf('.'));else if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) > 5) {
        plato = plato.substring(0, plato.indexOf('.'));
        plato = parseFloat(plato) + 1;
      }
      return parseFloat(plato).toFixed(2);;
    },
    recipeBeerSmith: function recipeBeerSmith(recipe) {
      var response = { name: '', date: '', brewer: { name: '' }, category: '', abv: '', og: 0.000, fg: 0.000, ibu: 0, hops: [], grains: [], yeast: [], misc: [] };
      if (Boolean(recipe.F_R_NAME)) response.name = recipe.F_R_NAME;
      if (Boolean(recipe.F_R_STYLE.F_S_CATEGORY)) response.category = recipe.F_R_STYLE.F_S_CATEGORY;
      if (Boolean(recipe.F_R_DATE)) response.date = recipe.F_R_DATE;
      if (Boolean(recipe.F_R_BREWER)) response.brewer.name = recipe.F_R_BREWER;

      if (Boolean(recipe.F_R_STYLE.F_S_MAX_OG)) response.og = parseFloat(recipe.F_R_STYLE.F_S_MAX_OG).toFixed(3);else if (Boolean(recipe.F_R_STYLE.F_S_MIN_OG)) response.og = parseFloat(recipe.F_R_STYLE.F_S_MIN_OG).toFixed(3);
      if (Boolean(recipe.F_R_STYLE.F_S_MAX_FG)) response.fg = parseFloat(recipe.F_R_STYLE.F_S_MAX_FG).toFixed(3);else if (Boolean(recipe.F_R_STYLE.F_S_MIN_FG)) response.fg = parseFloat(recipe.F_R_STYLE.F_S_MIN_FG).toFixed(3);

      if (Boolean(recipe.F_R_STYLE.F_S_MAX_ABV)) response.abv = $filter('number')(recipe.F_R_STYLE.F_S_MAX_ABV, 2);else if (Boolean(recipe.F_R_STYLE.F_S_MIN_ABV)) response.abv = $filter('number')(recipe.F_R_STYLE.F_S_MIN_ABV, 2);

      if (Boolean(recipe.F_R_STYLE.F_S_MAX_IBU)) response.ibu = parseInt(recipe.F_R_STYLE.F_S_MAX_IBU, 10);else if (Boolean(recipe.F_R_STYLE.F_S_MIN_IBU)) response.ibu = parseInt(recipe.F_R_STYLE.F_S_MIN_IBU, 10);

      if (Boolean(recipe.Ingredients.Data.Grain)) {
        _.each(recipe.Ingredients.Data.Grain, function (grain) {
          response.grains.push({
            label: grain.F_G_NAME,
            min: parseInt(grain.F_G_BOIL_TIME, 10),
            notes: $filter('kilogramsToPounds')(grain.F_G_AMOUNT) + ' lb',
            amount: $filter('kilogramsToPounds')(grain.F_G_AMOUNT)
          });
        });
      }

      if (Boolean(recipe.Ingredients.Data.Hops)) {
        _.each(recipe.Ingredients.Data.Hops, function (hop) {
          response.hops.push({
            label: hop.F_H_NAME,
            min: parseInt(hop.F_H_DRY_HOP_TIME, 10) > 0 ? null : parseInt(hop.F_H_BOIL_TIME, 10),
            notes: parseInt(hop.F_H_DRY_HOP_TIME, 10) > 0 ? 'Dry Hop ' + $filter('kilogramsToOunces')(hop.F_H_AMOUNT) + ' oz.' + ' for ' + parseInt(hop.F_H_DRY_HOP_TIME, 10) + ' Days' : $filter('kilogramsToOunces')(hop.F_H_AMOUNT) + ' oz.',
            amount: $filter('kilogramsToOunces')(hop.F_H_AMOUNT)
          });
          // hop.F_H_ALPHA
          // hop.F_H_DRY_HOP_TIME
          // hop.F_H_ORIGIN
        });
      }

      if (Boolean(recipe.Ingredients.Data.Misc)) {
        if (recipe.Ingredients.Data.Misc.length) {
          _.each(recipe.Ingredients.Data.Misc, function (misc) {
            response.misc.push({
              label: misc.F_M_NAME,
              min: parseInt(misc.F_M_TIME, 10),
              notes: $filter('number')(misc.F_M_AMOUNT, 2) + ' g.',
              amount: $filter('number')(misc.F_M_AMOUNT, 2)
            });
          });
        } else {
          response.misc.push({
            label: recipe.Ingredients.Data.Misc.F_M_NAME,
            min: parseInt(recipe.Ingredients.Data.Misc.F_M_TIME, 10),
            notes: $filter('number')(recipe.Ingredients.Data.Misc.F_M_AMOUNT, 2) + ' g.',
            amount: $filter('number')(recipe.Ingredients.Data.Misc.F_M_AMOUNT, 2)
          });
        }
      }

      if (Boolean(recipe.Ingredients.Data.Yeast)) {
        if (recipe.Ingredients.Data.Yeast.length) {
          _.each(recipe.Ingredients.Data.Yeast, function (yeast) {
            response.yeast.push({
              name: yeast.F_Y_LAB + ' ' + (yeast.F_Y_PRODUCT_ID ? yeast.F_Y_PRODUCT_ID : yeast.F_Y_NAME)
            });
          });
        } else {
          response.yeast.push({
            name: recipe.Ingredients.Data.Yeast.F_Y_LAB + ' ' + (recipe.Ingredients.Data.Yeast.F_Y_PRODUCT_ID ? recipe.Ingredients.Data.Yeast.F_Y_PRODUCT_ID : recipe.Ingredients.Data.Yeast.F_Y_NAME)
          });
        }
      }
      return response;
    },
    recipeBeerXML: function recipeBeerXML(recipe) {
      var response = { name: '', date: '', brewer: { name: '' }, category: '', abv: '', og: 0.000, fg: 0.000, ibu: 0, hops: [], grains: [], yeast: [], misc: [] };
      var mash_time = 60;

      if (Boolean(recipe.NAME)) response.name = recipe.NAME;
      if (Boolean(recipe.STYLE.CATEGORY)) response.category = recipe.STYLE.CATEGORY;

      // if(Boolean(recipe.F_R_DATE))
      //   response.date = recipe.F_R_DATE;
      if (Boolean(recipe.BREWER)) response.brewer.name = recipe.BREWER;

      if (Boolean(recipe.OG)) response.og = parseFloat(recipe.OG).toFixed(3);
      if (Boolean(recipe.FG)) response.fg = parseFloat(recipe.FG).toFixed(3);

      if (Boolean(recipe.IBU)) response.ibu = parseInt(recipe.IBU, 10);

      if (Boolean(recipe.STYLE.ABV_MAX)) response.abv = $filter('number')(recipe.STYLE.ABV_MAX, 2);else if (Boolean(recipe.STYLE.ABV_MIN)) response.abv = $filter('number')(recipe.STYLE.ABV_MIN, 2);

      if (Boolean(recipe.MASH.MASH_STEPS.MASH_STEP && recipe.MASH.MASH_STEPS.MASH_STEP.length && recipe.MASH.MASH_STEPS.MASH_STEP[0].STEP_TIME)) {
        mash_time = recipe.MASH.MASH_STEPS.MASH_STEP[0].STEP_TIME;
      }

      if (Boolean(recipe.FERMENTABLES)) {
        var grains = recipe.FERMENTABLES.FERMENTABLE && recipe.FERMENTABLES.FERMENTABLE.length ? recipe.FERMENTABLES.FERMENTABLE : recipe.FERMENTABLES;
        _.each(grains, function (grain) {
          response.grains.push({
            label: grain.NAME,
            min: parseInt(mash_time, 10),
            notes: $filter('kilogramsToPounds')(grain.AMOUNT) + ' lb',
            amount: $filter('kilogramsToPounds')(grain.AMOUNT)
          });
        });
      }

      if (Boolean(recipe.HOPS)) {
        var hops = recipe.HOPS.HOP && recipe.HOPS.HOP.length ? recipe.HOPS.HOP : recipe.HOPS;
        _.each(hops, function (hop) {
          response.hops.push({
            label: hop.NAME + ' (' + hop.FORM + ')',
            min: hop.USE == 'Dry Hop' ? 0 : parseInt(hop.TIME, 10),
            notes: hop.USE == 'Dry Hop' ? hop.USE + ' ' + $filter('kilogramsToOunces')(hop.AMOUNT) + ' oz.' + ' for ' + parseInt(hop.TIME / 60 / 24, 10) + ' Days' : hop.USE + ' ' + $filter('kilogramsToOunces')(hop.AMOUNT) + ' oz.',
            amount: $filter('kilogramsToOunces')(hop.AMOUNT)
          });
        });
      }

      if (Boolean(recipe.MISCS)) {
        var misc = recipe.MISCS.MISC && recipe.MISCS.MISC.length ? recipe.MISCS.MISC : recipe.MISCS;
        _.each(misc, function (misc) {
          response.misc.push({
            label: misc.NAME,
            min: parseInt(misc.TIME, 10),
            notes: 'Add ' + misc.AMOUNT + ' to ' + misc.USE,
            amount: misc.AMOUNT
          });
        });
      }

      if (Boolean(recipe.YEASTS)) {
        var yeast = recipe.YEASTS.YEAST && recipe.YEASTS.YEAST.length ? recipe.YEASTS.YEAST : recipe.YEASTS;
        _.each(yeast, function (yeast) {
          response.yeast.push({
            name: yeast.NAME
          });
        });
      }
      return response;
    },
    formatXML: function formatXML(content) {
      var htmlchars = [{ f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Euml;', r: 'Ë' }, { f: '&euml;', r: 'ë' }, { f: '&#262;', r: 'Ć' }, { f: '&#263;', r: 'ć' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#272;', r: 'Đ' }, { f: '&#273;', r: 'đ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&middot;', r: '·' }, { f: '&#262;', r: 'Ć' }, { f: '&#263;', r: 'ć' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#272;', r: 'Đ' }, { f: '&#273;', r: 'đ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#270;', r: 'Ď' }, { f: '&#271;', r: 'ď' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&#282;', r: 'Ě' }, { f: '&#283;', r: 'ě' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&#327;', r: 'Ň' }, { f: '&#328;', r: 'ň' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&#344;', r: 'Ř' }, { f: '&#345;', r: 'ř' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#356;', r: 'Ť' }, { f: '&#357;', r: 'ť' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&#366;', r: 'Ů' }, { f: '&#367;', r: 'ů' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&Aring;', r: 'Å' }, { f: '&aring;', r: 'å' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Euml;', r: 'Ë' }, { f: '&euml;', r: 'ë' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&#264;', r: 'Ĉ' }, { f: '&#265;', r: 'ĉ' }, { f: '&#284;', r: 'Ĝ' }, { f: '&#285;', r: 'ĝ' }, { f: '&#292;', r: 'Ĥ' }, { f: '&#293;', r: 'ĥ' }, { f: '&#308;', r: 'Ĵ' }, { f: '&#309;', r: 'ĵ' }, { f: '&#348;', r: 'Ŝ' }, { f: '&#349;', r: 'ŝ' }, { f: '&#364;', r: 'Ŭ' }, { f: '&#365;', r: 'ŭ' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Otilde;', r: 'Õ' }, { f: '&otilde;', r: 'õ' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&ETH;', r: 'Ð' }, { f: '&eth;', r: 'ð' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Ecirc;', r: 'Ê' }, { f: '&ecirc;', r: 'ê' }, { f: '&Euml;', r: 'Ë' }, { f: '&euml;', r: 'ë' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ocirc;', r: 'Ô' }, { f: '&ocirc;', r: 'ô' }, { f: '&OElig;', r: 'Œ' }, { f: '&oelig;', r: 'œ' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Ucirc;', r: 'Û' }, { f: '&ucirc;', r: 'û' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&#376;', r: 'Ÿ' }, { f: '&yuml;', r: 'ÿ' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&szlig;', r: 'ß' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Atilde;', r: 'Ã' }, { f: '&atilde;', r: 'ã' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&#296;', r: 'Ĩ' }, { f: '&#297;', r: 'ĩ' }, { f: '&Uacute;', r: 'Ú' }, { f: '&ugrave;', r: 'ù' }, { f: '&Ucirc;', r: 'Û' }, { f: '&ucirc;', r: 'û' }, { f: '&#360;', r: 'Ũ' }, { f: '&#361;', r: 'ũ' }, { f: '&#312;', r: 'ĸ' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&#336;', r: 'Ő' }, { f: '&#337;', r: 'ő' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&#368;', r: 'Ű' }, { f: '&#369;', r: 'ű' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&ETH;', r: 'Ð' }, { f: '&eth;', r: 'ð' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&THORN;', r: 'Þ' }, { f: '&thorn;', r: 'þ' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Ouml;', r: 'Ö' }, { f: '&uml;', r: 'ö' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Ecirc;', r: 'Ê' }, { f: '&ecirc;', r: 'ê' }, { f: '&Igrave;', r: 'Ì' }, { f: '&igrave;', r: 'ì' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Ocirc;', r: 'Ô' }, { f: '&ocirc;', r: 'ô' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Ucirc;', r: 'Û' }, { f: '&ucirc;', r: 'û' }, { f: '&#256;', r: 'Ā' }, { f: '&#257;', r: 'ā' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#274;', r: 'Ē' }, { f: '&#275;', r: 'ē' }, { f: '&#290;', r: 'Ģ' }, { f: '&#291;', r: 'ģ' }, { f: '&#298;', r: 'Ī' }, { f: '&#299;', r: 'ī' }, { f: '&#310;', r: 'Ķ' }, { f: '&#311;', r: 'ķ' }, { f: '&#315;', r: 'Ļ' }, { f: '&#316;', r: 'ļ' }, { f: '&#325;', r: 'Ņ' }, { f: '&#326;', r: 'ņ' }, { f: '&#342;', r: 'Ŗ' }, { f: '&#343;', r: 'ŗ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#362;', r: 'Ū' }, { f: '&#363;', r: 'ū' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&AElig;', r: 'Æ' }, { f: '&aelig;', r: 'æ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&Aring;', r: 'Å' }, { f: '&aring;', r: 'å' }, { f: '&#260;', r: 'Ą' }, { f: '&#261;', r: 'ą' }, { f: '&#262;', r: 'Ć' }, { f: '&#263;', r: 'ć' }, { f: '&#280;', r: 'Ę' }, { f: '&#281;', r: 'ę' }, { f: '&#321;', r: 'Ł' }, { f: '&#322;', r: 'ł' }, { f: '&#323;', r: 'Ń' }, { f: '&#324;', r: 'ń' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&#346;', r: 'Ś' }, { f: '&#347;', r: 'ś' }, { f: '&#377;', r: 'Ź' }, { f: '&#378;', r: 'ź' }, { f: '&#379;', r: 'Ż' }, { f: '&#380;', r: 'ż' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Atilde;', r: 'Ã' }, { f: '&atilde;', r: 'ã' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Ecirc;', r: 'Ê' }, { f: '&ecirc;', r: 'ê' }, { f: '&Igrave;', r: 'Ì' }, { f: '&igrave;', r: 'ì' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Iuml;', r: 'Ï' }, { f: '&iuml;', r: 'ï' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Otilde;', r: 'Õ' }, { f: '&otilde;', r: 'õ' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&ordf;', r: 'ª' }, { f: '&ordm;', r: 'º' }, { f: '&#258;', r: 'Ă' }, { f: '&#259;', r: 'ă' }, { f: '&Acirc;', r: 'Â' }, { f: '&acirc;', r: 'â' }, { f: '&Icirc;', r: 'Î' }, { f: '&icirc;', r: 'î' }, { f: '&#350;', r: 'Ş' }, { f: '&#351;', r: 'ş' }, { f: '&#354;', r: 'Ţ' }, { f: '&#355;', r: 'ţ' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#272;', r: 'Đ' }, { f: '&#273;', r: 'đ' }, { f: '&#330;', r: 'Ŋ' }, { f: '&#331;', r: 'ŋ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#358;', r: 'Ŧ' }, { f: '&#359;', r: 'ŧ' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Agrave;', r: 'À' }, { f: '&agrave;', r: 'à' }, { f: '&Egrave;', r: 'È' }, { f: '&egrave;', r: 'è' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Igrave;', r: 'Ì' }, { f: '&igrave;', r: 'ì' }, { f: '&Ograve;', r: 'Ò' }, { f: '&ograve;', r: 'ò' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ugrave;', r: 'Ù' }, { f: '&ugrave;', r: 'ù' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#270;', r: 'Ď' }, { f: '&#271;', r: 'ď' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&#313;', r: 'Ĺ' }, { f: '&#314;', r: 'ĺ' }, { f: '&#317;', r: 'Ľ' }, { f: '&#318;', r: 'ľ' }, { f: '&#327;', r: 'Ň' }, { f: '&#328;', r: 'ň' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ocirc;', r: 'Ô' }, { f: '&ocirc;', r: 'ô' }, { f: '&#340;', r: 'Ŕ' }, { f: '&#341;', r: 'ŕ' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#356;', r: 'Ť' }, { f: '&#357;', r: 'ť' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Yacute;', r: 'Ý' }, { f: '&yacute;', r: 'ý' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&#268;', r: 'Č' }, { f: '&#269;', r: 'č' }, { f: '&#352;', r: 'Š' }, { f: '&#353;', r: 'š' }, { f: '&#381;', r: 'Ž' }, { f: '&#382;', r: 'ž' }, { f: '&Aacute;', r: 'Á' }, { f: '&aacute;', r: 'á' }, { f: '&Eacute;', r: 'É' }, { f: '&eacute;', r: 'é' }, { f: '&Iacute;', r: 'Í' }, { f: '&iacute;', r: 'í' }, { f: '&Oacute;', r: 'Ó' }, { f: '&oacute;', r: 'ó' }, { f: '&Ntilde;', r: 'Ñ' }, { f: '&ntilde;', r: 'ñ' }, { f: '&Uacute;', r: 'Ú' }, { f: '&uacute;', r: 'ú' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&iexcl;', r: '¡' }, { f: '&ordf;', r: 'ª' }, { f: '&iquest;', r: '¿' }, { f: '&ordm;', r: 'º' }, { f: '&Aring;', r: 'Å' }, { f: '&aring;', r: 'å' }, { f: '&Auml;', r: 'Ä' }, { f: '&auml;', r: 'ä' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&Ccedil;', r: 'Ç' }, { f: '&ccedil;', r: 'ç' }, { f: '&#286;', r: 'Ğ' }, { f: '&#287;', r: 'ğ' }, { f: '&#304;', r: 'İ' }, { f: '&#305;', r: 'ı' }, { f: '&Ouml;', r: 'Ö' }, { f: '&ouml;', r: 'ö' }, { f: '&#350;', r: 'Ş' }, { f: '&#351;', r: 'ş' }, { f: '&Uuml;', r: 'Ü' }, { f: '&uuml;', r: 'ü' }, { f: '&euro;', r: '€' }, { f: '&pound;', r: '£' }, { f: '&laquo;', r: '«' }, { f: '&raquo;', r: '»' }, { f: '&bull;', r: '•' }, { f: '&dagger;', r: '†' }, { f: '&copy;', r: '©' }, { f: '&reg;', r: '®' }, { f: '&trade;', r: '™' }, { f: '&deg;', r: '°' }, { f: '&permil;', r: '‰' }, { f: '&micro;', r: 'µ' }, { f: '&middot;', r: '·' }, { f: '&ndash;', r: '–' }, { f: '&mdash;', r: '—' }, { f: '&#8470;', r: '№' }, { f: '&reg;', r: '®' }, { f: '&para;', r: '¶' }, { f: '&plusmn;', r: '±' }, { f: '&middot;', r: '·' }, { f: 'less-t', r: '<' }, { f: 'greater-t', r: '>' }, { f: '&not;', r: '¬' }, { f: '&curren;', r: '¤' }, { f: '&brvbar;', r: '¦' }, { f: '&deg;', r: '°' }, { f: '&acute;', r: '´' }, { f: '&uml;', r: '¨' }, { f: '&macr;', r: '¯' }, { f: '&cedil;', r: '¸' }, { f: '&laquo;', r: '«' }, { f: '&raquo;', r: '»' }, { f: '&sup1;', r: '¹' }, { f: '&sup2;', r: '²' }, { f: '&sup3;', r: '³' }, { f: '&ordf;', r: 'ª' }, { f: '&ordm;', r: 'º' }, { f: '&iexcl;', r: '¡' }, { f: '&iquest;', r: '¿' }, { f: '&micro;', r: 'µ' }, { f: 'hy;	', r: '&' }, { f: '&ETH;', r: 'Ð' }, { f: '&eth;', r: 'ð' }, { f: '&Ntilde;', r: 'Ñ' }, { f: '&ntilde;', r: 'ñ' }, { f: '&Oslash;', r: 'Ø' }, { f: '&oslash;', r: 'ø' }, { f: '&szlig;', r: 'ß' }, { f: '&amp;', r: 'and' }, { f: '&ldquo;', r: '"' }, { f: '&rdquo;', r: '"' }, { f: '&rsquo;', r: "'" }];

      _.each(htmlchars, function (char) {
        if (content.indexOf(char.f) !== -1) {
          content = content.replace(RegExp(char.f, 'g'), char.r);
        }
      });
      return content;
    }
  };
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(66)))

/***/ })

},[334]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwibW9kYWxJbmZvIiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJvcGVuSW5mb01vZGFsIiwiYXJkdWlubyIsIiQiLCJtb2RhbCIsInJlcGxhY2VLZXR0bGVzV2l0aFBpbnMiLCJpbmZvIiwicGlucyIsImxlbmd0aCIsIl8iLCJlYWNoIiwicHVzaCIsInBpbiIsImlkIiwic3RpY2t5IiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJpbmRleCIsImFkYyIsImhpdCIsImlmdHR0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwidmVyc2lvbiIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJmaWx0ZXIiLCJpdGVtIiwic3JtIiwiaGV4Iiwic2V0dGluZ3MiLCJyZXNldCIsImFwcCIsImVtYWlsIiwiYXBpX2tleSIsInN0YXR1cyIsImdlbmVyYWwiLCJjaGFydE9wdGlvbnMiLCJ1bml0IiwiY2hhcnQiLCJkZWZhdWx0S2V0dGxlcyIsIm9wZW5Ta2V0Y2hlcyIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwiY2hhbmdlQXJkdWlubyIsImFyZHVpbm9zIiwiaXNFU1AiLCJhbmFsb2ciLCJkaWdpdGFsIiwidG91Y2giLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFkZCIsInRvb2x0aXAiLCJub3ciLCJEYXRlIiwiYnRvYSIsImJvYXJkIiwiUlNTSSIsInNlY3VyZSIsImR0IiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwiY29ubmVjdCIsInRoZW4iLCJCcmV3QmVuY2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsInVzZXIiLCJwYXNzIiwidG9rZW4iLCJwbHVncyIsImxvZ2luIiwicmVzcG9uc2UiLCJzY2FuIiwiZXJyb3JfY29kZSIsIm1zZyIsInNldEVycm9yTWVzc2FnZSIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiYXV0aCIsImtleSIsImFkZEtldHRsZSIsImZpbmQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwiaGVhdElzT24iLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiYXJkdWlub0lkIiwiY2hhbmdlU2Vuc29yIiwic2Vuc29yVHlwZXMiLCJwZXJjZW50IiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJjb25zb2xlIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImJyZXdlciIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJ0ZXh0Iiwic2hvdyIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidHJ1c3RBc0h0bWwiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJzaGlmdCIsImFsdGl0dWRlIiwicHJlc3N1cmUiLCJjbzJfcHBtIiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwic3ViVGV4dCIsImNvbG9yIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhlYXRTYWZldHkiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJvbiIsIk1hdGgiLCJyb3VuZCIsIm9mZiIsImltcG9ydFNldHRpbmdzIiwicHJvZmlsZUNvbnRlbnQiLCJleHBvcnRTZXR0aW5ncyIsImkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjb21waWxlU2tldGNoIiwic2tldGNoTmFtZSIsInNlbnNvcnMiLCJza2V0Y2hlcyIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImFjdGlvbnMiLCJ0cmlnZ2VycyIsImJmIiwiREhUIiwiRFMxOEIyMCIsIkJNUCIsImtldHRsZVR5cGUiLCJ1bnNoaWZ0IiwiYSIsInRvTG93ZXJDYXNlIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsIm5vdGlmaWNhdGlvbnMiLCJtZDUiLCJ0cmltIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiVEhDIiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJsb3ciLCJoaWdoIiwibGFzdCIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsImFsZXJ0IiwicGxheSIsImNsb3NlIiwiTm90aWZpY2F0aW9uIiwicGVybWlzc2lvbiIsInJlcXVlc3RQZXJtaXNzaW9uIiwic2VuZCIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsImNoYW5nZVVuaXRzIiwidiIsInRpbWVyUnVuIiwibmV4dFRpbWVyIiwiY2FuY2VsIiwiaW50ZXJ2YWwiLCJwcm9jZXNzVGVtcHMiLCJhbGxTZW5zb3JzIiwicG9sbFNlY29uZHMiLCJyZW1vdmVLZXR0bGUiLCIkaW5kZXgiLCJjb25maXJtIiwiY2xlYXJLZXR0bGUiLCJjaGFuZ2VWYWx1ZSIsImZpZWxkIiwibG9hZGVkIiwidXBkYXRlTG9jYWwiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJjaGFuZ2UiLCJlbnRlciIsInBsYWNlaG9sZGVyIiwidGVtcGxhdGUiLCJsaW5rIiwiYXR0cnMiLCJlZGl0IiwiYmluZCIsIiRhcHBseSIsImNoYXJDb2RlIiwia2V5Q29kZSIsIm5nRW50ZXIiLCIkcGFyc2UiLCJmbiIsIm9uUmVhZEZpbGUiLCJvbkNoYW5nZUV2ZW50IiwicmVhZGVyIiwiRmlsZVJlYWRlciIsImZpbGUiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImRlYnVnIiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJlbmFibGVkIiwiZm9udCIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0IiwicGFzc3dvcmQiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJBdXRob3JpemF0aW9uIiwiZGlnaXRhbFJlYWQiLCJwYXJhbXMiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsImh0dHAiLCJodHRwX2NvbmZpZyIsInN1Y2Nlc3MiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsImxuIiwibG9nIiwia2VsdmluIiwic3RlaW5oYXJ0IiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwic2Vzc2lvbiIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FK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Qm9WLE9BQU82SyxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQXovQ0ksR0FBUDtBQTIvQ0QsQ0E5L0NELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6U2xpZGVyJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGw7XG52YXIgcmVzZXRDaGFydCA9IDEwMDtcbnZhciB0aW1lb3V0ID0gbnVsbDsgLy9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogQm9vbGVhbihkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbD09J2h0dHBzOicpXG4gICwgaHR0cHNfdXJsOiBgaHR0cHM6Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9YFxufTtcbiRzY29wZS5lc3AgPSB7XG4gIHR5cGU6ICcnLFxuICBzc2lkOiAnJyxcbiAgc3NpZF9wYXNzOiAnJyxcbiAgaG9zdG5hbWU6ICdiYmVzcCcsXG4gIGFyZHVpbm9fcGFzczogJ2JiYWRtaW4nLFxuICBhdXRvY29ubmVjdDogZmFsc2Vcbn07XG4kc2NvcGUubW9kYWxJbmZvID0ge307XG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUucGtnO1xuJHNjb3BlLmtldHRsZVR5cGVzID0gQnJld1NlcnZpY2Uua2V0dGxlVHlwZXMoKTtcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogMSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUub3BlbkluZm9Nb2RhbCA9IGZ1bmN0aW9uIChhcmR1aW5vKSB7XG4gICRzY29wZS5tb2RhbEluZm8gPSBhcmR1aW5vO1xuICAkKCcjYXJkdWluby1pbmZvJykubW9kYWwoJ3RvZ2dsZScpOyAgXG59O1xuICBcbiRzY29wZS5yZXBsYWNlS2V0dGxlc1dpdGhQaW5zID0gZnVuY3Rpb24gKGFyZHVpbm8pIHtcbiAgaWYgKGFyZHVpbm8uaW5mbyAmJiBhcmR1aW5vLmluZm8ucGlucyAmJiBhcmR1aW5vLmluZm8ucGlucy5sZW5ndGgpIHtcbiAgICAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIF8uZWFjaChhcmR1aW5vLmluZm8ucGlucywgcGluID0+IHtcbiAgICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiBwaW4ubmFtZVxuICAgICAgICAsIGlkOiBudWxsXG4gICAgICAgICwgdHlwZTogJHNjb3BlLmtldHRsZVR5cGVzWzRdLnR5cGVcbiAgICAgICAgLCBhY3RpdmU6IGZhbHNlXG4gICAgICAgICwgc3RpY2t5OiBmYWxzZVxuICAgICAgICAsIGhlYXRlcjogeyBwaW46ICdENicsIHJ1bm5pbmc6IGZhbHNlLCBhdXRvOiBmYWxzZSwgcHdtOiBmYWxzZSwgZHV0eUN5Y2xlOiAxMDAsIHNrZXRjaDogZmFsc2UgfVxuICAgICAgICAsIHB1bXA6IHsgcGluOiAnRDcnLCBydW5uaW5nOiBmYWxzZSwgYXV0bzogZmFsc2UsIHB3bTogZmFsc2UsIGR1dHlDeWNsZTogMTAwLCBza2V0Y2g6IGZhbHNlIH1cbiAgICAgICAgLCB0ZW1wOiB7IHBpbjogcGluLnBpbiwgdmNjOiAnJywgaW5kZXg6ICcnLCB0eXBlOiBwaW4udHlwZSwgYWRjOiBmYWxzZSwgaGl0OiBmYWxzZSwgaWZ0dHQ6IGZhbHNlLCBjdXJyZW50OiAwLCBtZWFzdXJlZDogMCwgcHJldmlvdXM6IDAsIGFkanVzdDogMCwgdGFyZ2V0OiAkc2NvcGUua2V0dGxlVHlwZXNbNF0udGFyZ2V0LCBkaWZmOiAkc2NvcGUua2V0dGxlVHlwZXNbNF0uZGlmZiwgcmF3OiAwLCB2b2x0czogMCB9XG4gICAgICAgICwgdmFsdWVzOiBbXVxuICAgICAgICAsIHRpbWVyczogW11cbiAgICAgICAgLCBrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCksIHsgdmFsdWU6IDAsIG1pbjogMCwgbWF4OiAkc2NvcGUua2V0dGxlVHlwZXNbNF0udGFyZ2V0ICsgJHNjb3BlLmtldHRsZVR5cGVzWzRdLmRpZmYgfSlcbiAgICAgICAgLCBhcmR1aW5vOiBhcmR1aW5vXG4gICAgICAgICwgbWVzc2FnZTogeyB0eXBlOiAnZXJyb3InLCBtZXNzYWdlOiAnJywgdmVyc2lvbjogJycsIGNvdW50OiAwLCBsb2NhdGlvbjogJycgfVxuICAgICAgICAsIG5vdGlmeTogeyBzbGFjazogZmFsc2UgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn07XG4gIFxuJHNjb3BlLmdldEtldHRsZVNsaWRlck9wdGlvbnMgPSBmdW5jdGlvbih0eXBlLCBpbmRleCl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKCRzY29wZS5zbGlkZXIub3B0aW9ucywge2lkOiBgJHt0eXBlfV8ke2luZGV4fWB9KTtcbn1cblxuJHNjb3BlLmdldExvdmlib25kQ29sb3IgPSBmdW5jdGlvbihyYW5nZSl7XG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZSgvwrAvZywnJykucmVwbGFjZSgvIC9nLCcnKTtcbiAgaWYocmFuZ2UuaW5kZXhPZignLScpIT09LTEpe1xuICAgIHZhciByQXJyPXJhbmdlLnNwbGl0KCctJyk7XG4gICAgcmFuZ2UgPSAocGFyc2VGbG9hdChyQXJyWzBdKStwYXJzZUZsb2F0KHJBcnJbMV0pKS8yO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gcGFyc2VGbG9hdChyYW5nZSk7XG4gIH1cbiAgaWYoIXJhbmdlKVxuICAgIHJldHVybiAnJztcbiAgdmFyIGwgPSBfLmZpbHRlcigkc2NvcGUubG92aWJvbmQsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiAoaXRlbS5zcm0gPD0gcmFuZ2UpID8gaXRlbS5oZXggOiAnJztcbiAgfSk7XG4gIGlmKGwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbmlmICghJHNjb3BlLnNldHRpbmdzLmFwcClcbiAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IHsgZW1haWw6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJyB9O1xuLy8gZ2VuZXJhbCBjaGVjayBhbmQgdXBkYXRlXG5pZighJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwpXG4gIHJldHVybiAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydH0pO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG5cbiRzY29wZS5vcGVuU2tldGNoZXMgPSBmdW5jdGlvbigpe1xuICAkKCcjc2V0dGluZ3NNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICQoJyNza2V0Y2hlc01vZGFsJykubW9kYWwoJ3Nob3cnKTtcbn07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW1CeShvYmosJ2Ftb3VudCcpO1xufTtcblxuJHNjb3BlLmNoYW5nZUFyZHVpbm8gPSBmdW5jdGlvbiAoa2V0dGxlKSB7XG4gIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnMzInKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLnRvdWNoID0gWzQsMCwyLDE1LDEzLDEyLDE0LDI3LDMzLDMyXTtcbiAgfSBlbHNlIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMTY7XG4gIH1cbn07XG4vLyBjaGVjayBrZXR0bGUgdHlwZSBwb3J0c1xuXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzMyJykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gIH0gZWxzZSBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICc4MjY2Jykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICB9XG59KTtcbiAgXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS5nZXRTdGF0dXNDbGFzcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIGlmKHN0YXR1cyA9PSAnQ29ubmVjdGVkJylcbiAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICBlbHNlIGlmKF8uZW5kc1dpdGgoc3RhdHVzLCdpbmcnKSlcbiAgICByZXR1cm4gJ3NlY29uZGFyeSc7XG4gIGVsc2VcbiAgICByZXR1cm4gJ2Rhbmdlcic7XG59XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zKSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICBib2FyZDogJycsXG4gICAgICAgIFJTU0k6IGZhbHNlLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHsgZXJyb3I6ICcnLCBkdDogJycsIG1lc3NhZ2U6ICcnIH0sXG4gICAgICAgIGluZm86IHt9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mbycpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5CcmV3QmVuY2gpe1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDAgfHwgYXJkdWluby5ib2FyZC5pbmRleE9mKCdOb2RlTUNVXzMyUycpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0dldHRpbmcgSW5mby4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvLWV4dCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IGluZm87XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IHt9O1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5wa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAncmVib290JylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gJyc7XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3QgU3VjY2VzcywgdHJ5IGNvbm5lY3RpbmcgaW4gYSBmZXcgc2Vjb25kcy4nO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYocGtnLnZlcnNpb24gPCA0LjIpXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ1VwZ3JhZGUgdG8gc3VwcG9ydCByZWJvb3QnO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBjbGVhcjogKCkgPT4geyBcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsgPSB7IHVzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46ICcnLCBzdGF0dXM6ICcnLCBwbHVnczogW10gfTtcbiAgICB9LFxuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9IGVsc2UgaWYocmVzcG9uc2UuZXJyb3JfY29kZSAmJiByZXNwb25zZS5tc2cpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShyZXNwb25zZS5tc2cpOyAgXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4ocGx1Zy5zdGF0dXMpKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaWZ0dHQgPSB7XG4gICAgY2xlYXI6ICgpID0+IHsgXG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQgPSB7IHVybDogJycsIG1ldGhvZDogJ0dFVCcsIGF1dGg6IHsga2V5OiAnJywgdmFsdWU6ICcnIH0sIHN0YXR1czogJycgfTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLmNvbm5lY3QoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gIH07XG4gIFxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG4gIFxuICAkc2NvcGUuaGVhdElzT24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydoZWF0ZXInOiB7J3J1bm5pbmcnOiB0cnVlfX0pLmxlbmd0aCk7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihhcmR1aW5vLCBwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZSBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vKSl7XG4gICAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8sIHRydWUpID09ICc4MjY2JylcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0EnLCdHUElPJykucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwaW47XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYXBwID0ge1xuICAgIGNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpICYmXG4gICAgICAgIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmFwcC5hcGlfa2V5KSAmJlxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwID0gZGVmYXVsdFNldHRpbmdzLmFwcDtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgIGlmKCFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpIHx8ICFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFwcCgpLmF1dGgoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZihCb29sZWFuKGZvcm1hdHRlZF9jb250ZW50KSl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZihCb29sZWFuKGpzb25PYmouUmVjaXBlcykgJiYgQm9vbGVhbihqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZihCb29sZWFuKGpzb25PYmouU2VsZWN0aW9ucykgJiYgQm9vbGVhbihqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoQm9vbGVhbihqc29uT2JqLlJFQ0lQRVMpICYmIEJvb2xlYW4oanNvbk9iai5SRUNJUEVTLlJFQ0lQRSkpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5vZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5mZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoe1xuICAgICAgYW5pbWF0ZWQ6ICdmYWRlJyxcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIGh0bWw6IHRydWVcbiAgICB9KTtcbiAgICBpZigkKCcjZ2l0Y29tbWl0IGEnKS50ZXh0KCkgIT0gJ2dpdF9jb21taXQnKXtcbiAgICAgICQoJyNnaXRjb21taXQnKS5zaG93KCk7XG4gICAgfVxuICAgIFxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGltZXJzKSAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24peyAgICBcbiAgICAgIHZhciBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4oZXJyLnN0YXR1c1RleHQpKVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKG1lc3NhZ2UpKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICBcbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5jdXJyZW50KSlcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLCAyKTtcbiAgICBcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpLCAwKTsgICAgXG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmIChrZXR0bGUudGVtcC50eXBlICE9ICdCTVAxODAnICYmXG4gICAgICBrZXR0bGUudGVtcC50eXBlICE9ICdCTVAyODAnICYmXG4gICAgICAha2V0dGxlLnRlbXAudm9sdHMgJiZcbiAgICAgICFrZXR0bGUudGVtcC5yYXcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnICYmXG4gICAgICByZXNwb25zZS50ZW1wID09IC0xMjcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHkgYXMgYSBwZXJjZW50XG4gICAgLy9Tb2lsTW9pc3R1cmVEIGhhcyBtb2lzdHVyZSBhcyBhIHBlcmNlbnRcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnBlcmNlbnQsMCk7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuY28yX3BwbSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5jbzJfcHBtID0gcmVzcG9uc2UuY28yX3BwbTtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZSwgc2tldGNoX3ZlcnNpb246cmVzcG9uc2Uuc2tldGNoX3ZlcnNpb259KTtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLmF1dG8gJiYgIWtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSkudGhlbihoZWF0aW5nID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDIwMCw0Nyw0NywxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYgIWtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB3aXRoaW4gdGFyZ2V0IVxuICAgICAga2V0dGxlLnRlbXAuaGl0PW5ldyBEYXRlKCk7Ly9zZXQgdGhlIHRpbWUgdGhlIHRhcmdldCB3YXMgaGl0IHNvIHdlIGNhbiBub3cgc3RhcnQgYWxlcnRzXG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoLWFsdCcpKSBidG4gPSBidG4ucGFyZW50KCk7XG5cbiAgICBpZighYnRuLmhhc0NsYXNzKCdidG4tZGFuZ2VyJykpe1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tbGlnaHQnKS5hZGRDbGFzcygnYnRuLWRhbmdlcicpO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAgfSwyMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVBXTSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUucHdtID0gIWtldHRsZS5wd207XG4gICAgICBpZihrZXR0bGUucHdtKVxuICAgICAgICBrZXR0bGUuc3NyID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlS2V0dGxlID0gZnVuY3Rpb24oaXRlbSwga2V0dGxlKXtcblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgdmFyIGs7XG4gICAgdmFyIGhlYXRJc09uID0gJHNjb3BlLmhlYXRJc09uKCk7XG4gICAgXG4gICAgc3dpdGNoIChpdGVtKSB7XG4gICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgayA9IGtldHRsZS5oZWF0ZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgIGsgPSBrZXR0bGUuY29vbGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICBrID0ga2V0dGxlLnB1bXA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmKCFrKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYoIWsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgaWYgKGl0ZW0gPT0gJ2hlYXQnICYmICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLmhlYXRTYWZldHkgJiYgaGVhdElzT24pIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnQSBoZWF0ZXIgaXMgYWxyZWFkeSBydW5uaW5nLicsIGtldHRsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoay5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aGUgcmVsYXlcbiAgICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5oYXNTa2V0Y2hlcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgdmFyIGhhc0FTa2V0Y2ggPSBmYWxzZTtcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHxcbiAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc2xhY2tcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMpXG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycyA9IHt9O1xuICAgIC8vIGFwcGVuZCBlc3AgdHlwZVxuICAgIGlmKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xICYmICFza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUDMyJykgPT09IC0xKVxuICAgICAgc2tldGNoTmFtZSArPSAkc2NvcGUuZXNwLnR5cGU7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vID8ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpIDogJ0RlZmF1bHQnO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6IGFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIHR5cGU6IHNrZXRjaE5hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgcGluczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlLFxuICAgICAgICAgIGJmOiAoc2tldGNoTmFtZS5pbmRleE9mKCdCRicpICE9PSAtMSkgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiBCb29sZWFuKGtldHRsZS50ZW1wLmFkanVzdCkpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiYgJHNjb3BlLmVzcC5hdXRvY29ubmVjdCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QXV0b0Nvbm5lY3QuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKChza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSB8fCBCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykpICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYmVlZ2VlLXRva3lvL0RIVGVzcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKTtcbiAgICAgIH0gZWxzZSBpZighQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5EUzE4QjIwIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPE9uZVdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAxODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAyODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMjgwLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMjgwLmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhlIGFjdGlvbnMgY29tbWFuZFxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYgKGtldHRsZS50ZW1wLnZjYylcbiAgICAgICAga2V0dGxlVHlwZSArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICBcbiAgICAgIGlmIChrZXR0bGUudGVtcC5pbmRleCkga2V0dGxlVHlwZSArPSAnLScgKyBrZXR0bGUudGVtcC5pbmRleDsgICAgICBcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTtcbiAgICAgIC8vIHVzZWQgZm9yIGluZm8gZW5kcG9pbnRcbiAgICAgIGlmIChjdXJyZW50U2tldGNoLnBpbnMubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gucGlucy5wdXNoKCcgcGlucyArPSBcIiwge1xcXFxcIm5hbWVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInICsga2V0dGxlLm5hbWUgKyAnXCIpICsgXCJcXFxcXCIsXFxcXFwicGluXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGtldHRsZS50ZW1wLnBpbiArICdcIikgKyBcIlxcXFxcIixcXFxcXCJ0eXBlXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGtldHRsZVR5cGUgKyAnXCIpICsgXCJcXFxcXCIsXFxcXFwiYWRqdXN0XFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGFkanVzdCArICdcIikgKyBcIlxcXFxcIn1cIjsnKTsgICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudFNrZXRjaC5waW5zLnB1c2goJyBwaW5zICs9IFwie1xcXFxcIm5hbWVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS5uYW1lKydcIikgKyBcIlxcXFxcIixcXFxcXCJwaW5cXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpICsgXCJcXFxcXCIsXFxcXFwidHlwZVxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicra2V0dGxlVHlwZSsnXCIpICsgXCJcXFxcXCIsXFxcXFwiYWRqdXN0XFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJythZGp1c3QrJ1wiKSArIFwiXFxcXFwifVwiOycpOyAgICAgICAgXG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEgJiYga2V0dGxlLnBlcmNlbnQpIHtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc1BlcmNlbnRDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKyctSHVtaWRpdHlcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpOyAgICAgICAgXG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrQm9vbGVhbihrZXR0bGUubm90aWZ5LnNsYWNrKSsnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrQm9vbGVhbihrZXR0bGUubm90aWZ5LnNsYWNrKSsnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmIChza2V0Y2gudHJpZ2dlcnMgfHwgc2tldGNoLmJmKSB7XG4gICAgICAgIGlmIChza2V0Y2gudHlwZS5pbmRleE9mKCdNNScpID09PSAtMSkge1xuICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpO1xuICAgICAgICAgIGlmIChza2V0Y2guYmYpIHtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGFtYmllbnQgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgaHVtaWRpdHkgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnY29uc3QgU3RyaW5nIGVxdWlwbWVudF9uYW1lID0gXCInKyRzY29wZS5zZXR0aW5ncy5iZi5uYW1lKydcIjsnKTsgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZCBcbiAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodW1pZGl0eScpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcsICdodW1pZGl0eSA9IGFjdGlvbnNQZXJjZW50Q29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2FtYmllbnQnKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICdhbWJpZW50ID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gQWxsIG90aGVyIGxvZ2ljXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gucGlucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaCcrc2tldGNoTmFtZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZG93bmxvYWRTa2V0Y2gobmFtZSwgYWN0aW9ucywgcGlucywgaGFzVHJpZ2dlcnMsIGhlYWRlcnMsIHNrZXRjaCl7XG4gICAgLy8gdHAgbGluayBjb25uZWN0aW9uXG4gICAgdmFyIHRwbGlua19jb25uZWN0aW9uX3N0cmluZyA9IEJyZXdTZXJ2aWNlLnRwbGluaygpLmNvbm5lY3Rpb24oKTtcbiAgICB2YXIgYXV0b2dlbiA9ICcvKlxcblNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jb1xcblZlcnNpb24gJyskc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKycgJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJ1xcbiovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtBQ1RJT05TXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbUElOU10nLCBwaW5zLmxlbmd0aCA/IHBpbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignQXBwJyApICE9PSAtMSl7XG4gICAgICAgICAgLy8gYXBwIGNvbm5lY3Rpb25cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUFBfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdCRll1bicgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGJmIGFwaSBrZXkgaGVhZGVyXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQkZfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5iZi5hcGlfa2V5LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZiggQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgIGlmIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyKSAmJiBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKSlcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYDtcbiAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5USEMpIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gVEhDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDI4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLScrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnKyRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiBCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICBpZihCb29sZWFuKHRpbWVyKSl7IC8va2V0dGxlIGlzIGEgdGltZXIgb2JqZWN0XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGltZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZih0aW1lci51cClcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHRpbWVycyBhcmUgZG9uZSc7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4odGltZXIubm90ZXMpKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZihCb29sZWFuKHRpbWVyKSAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKEJvb2xlYW4odGltZXIpKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgbWVhc3VyZWQgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayAmJiAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBJRlRUVCBOb3RpZmljYXRpb25cbiAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLmlmdHR0KSAmJiAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQudXJsICYmICRzY29wZS5zZXR0aW5ncy5pZnR0dC51cmwuaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLmlmdHR0KCkuc2VuZCh7XG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcjogY29sb3IsICAgICBcbiAgICAgICAgICB1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LFxuICAgICAgICAgIG5hbWU6IGtldHRsZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IGtldHRsZS50eXBlLFxuICAgICAgICAgIHRlbXA6IGtldHRsZS50ZW1wLFxuICAgICAgICAgIGhlYXRlcjoga2V0dGxlLmhlYXRlcixcbiAgICAgICAgICBwdW1wOiBrZXR0bGUucHVtcCxcbiAgICAgICAgICBjb29sZXI6IGtldHRsZS5jb29sZXIgfHwge30sXG4gICAgICAgICAgYXJkdWlubzoga2V0dGxlLmFyZHVpbm8gICAgICAgICAgXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHNlbmRpbmcgdG8gSUZUVFQgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgc2VuZGluZyB0byBJRlRUVCAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgJiYga2V0dGxlLm1lc3NhZ2UudHlwZSA9PSAnZGFuZ2VyJyl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAudGFyZ2V0KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuY3VycmVudCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAubWVhc3VyZWQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnByZXZpb3VzLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLnRhcmdldCwwKTtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5hZGp1c3QpKXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnR9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCBCb29sZWFuKGtldHRsZSkgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlKSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbiAoa2V0dGxlLCAkaW5kZXgpIHsgICAgXG4gICAgaWYoY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlbW92ZSB0aGlzIGtldHRsZT8nKSlcbiAgICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG4gIFxuICAkc2NvcGUuY2xlYXJLZXR0bGUgPSBmdW5jdGlvbiAoa2V0dGxlLCAkaW5kZXgpIHtcbiAgICAkc2NvcGUua2V0dGxlc1skaW5kZXhdLnZhbHVlcyA9IFtdO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIGlmKGZpZWxkID09ICdhZGp1c3QnKXtcbiAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIH1cblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoQm9vbGVhbihsb2FkZWQpKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcblxuICAvLyB1cGRhdGUgbG9jYWwgY2FjaGVcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsID0gZnVuY3Rpb24gKCkge1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsICRzY29wZS5rZXR0bGVzKTtcbiAgICAgICRzY29wZS51cGRhdGVMb2NhbCgpO1xuICAgIH0sIDUwMDApO1xuICB9O1xuICBcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSBCb29sZWFuKHNjb3BlLnR5cGUpID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHQgICAgfSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICBjZWxzaXVzID0gcGFyc2VGbG9hdChjZWxzaXVzKTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKShjZWxzaXVzKjkvNSszMiwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgZmFocmVuaGVpdCA9IHBhcnNlRmxvYXQoZmFocmVuaGVpdCk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoKGZhaHJlbmhlaXQtMzIpKjUvOSwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdyb3VuZCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbCxkZWNpbWFscykge1xuICAgIHJldHVybiBOdW1iZXIoKE1hdGgucm91bmQodmFsICsgXCJlXCIgKyBkZWNpbWFscykgICsgXCJlLVwiICsgZGVjaW1hbHMpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0aXRsZWNhc2UnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQpe1xuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRleHQuc2xpY2UoMSkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2RibVBlcmNlbnQnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRibSl7XG4gICAgcmV0dXJuIDIgKiAoZGJtICsgMTAwKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMzUuMjc0LCAyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMi4yMDQ2MiwgMik7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZ2VuZXJhbDogeyBkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBoZWF0U2FmZXR5OiBmYWxzZSB9XG4gICAgICAgICwgY2hhcnQ6IHsgc2hvdzogdHJ1ZSwgbWlsaXRhcnk6IGZhbHNlLCBhcmVhOiBmYWxzZSB9XG4gICAgICAgICwgc2Vuc29yczogeyBESFQ6IGZhbHNlLCBEUzE4QjIwOiBmYWxzZSwgQk1QOiBmYWxzZSB9XG4gICAgICAgICwgcmVjaXBlOiB7ICduYW1lJzogJycsICdicmV3ZXInOiB7IG5hbWU6ICcnLCAnZW1haWwnOiAnJyB9LCAneWVhc3QnOiBbXSwgJ2hvcHMnOiBbXSwgJ2dyYWlucyc6IFtdLCBzY2FsZTogJ2dyYXZpdHknLCBtZXRob2Q6ICdwYXBhemlhbicsICdvZyc6IDEuMDUwLCAnZmcnOiAxLjAxMCwgJ2Fidic6IDAsICdhYncnOiAwLCAnY2Fsb3JpZXMnOiAwLCAnYXR0ZW51YXRpb24nOiAwIH1cbiAgICAgICAgLCBub3RpZmljYXRpb25zOiB7IG9uOiB0cnVlLCB0aW1lcnM6IHRydWUsIGhpZ2g6IHRydWUsIGxvdzogdHJ1ZSwgdGFyZ2V0OiB0cnVlLCBzbGFjazogJycsIGxhc3Q6ICcnIH1cbiAgICAgICAgLCBzb3VuZHM6IHsgb246IHRydWUsIGFsZXJ0OiAnL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsIHRpbWVyOiAnL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJyB9XG4gICAgICAgICwgYXJkdWlub3M6IFt7IGlkOiAnbG9jYWwtJyArIGJ0b2EoJ2JyZXdiZW5jaCcpLCBib2FyZDogJycsIFJTU0k6IGZhbHNlLCB1cmw6ICdhcmR1aW5vLmxvY2FsJywgYW5hbG9nOiA1LCBkaWdpdGFsOiAxMywgYWRjOiAwLCBzZWN1cmU6IGZhbHNlLCB2ZXJzaW9uOiAnJywgc3RhdHVzOiB7IGVycm9yOiAnJywgZHQ6ICcnLCBtZXNzYWdlOiAnJyB9LCBpbmZvOiB7fSB9XVxuICAgICAgICAsIHRwbGluazogeyB1c2VyOiAnJywgcGFzczogJycsIHRva2VuOiAnJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdIH1cbiAgICAgICAgLCBpZnR0dDogeyB1cmw6ICcnLCBtZXRob2Q6ICdHRVQnLCBhdXRoOiB7IGtleTogJycsIHZhbHVlOiAnJyB9LCBzdGF0dXM6ICcnIH1cbiAgICAgICAgLCBpbmZsdXhkYjogeyB1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczogW10sIHN0YXR1czogJycgfVxuICAgICAgICAsIGFwcDogeyBlbWFpbDogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5hbWU6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDEyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMzMnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQ0NCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ1NvaWxNb2lzdHVyZScsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIHZjYzogdHJ1ZSwgcGVyY2VudDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdCTVAxODAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDI4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnU0hUM1gnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWUgfVxuICAgICAgICAse25hbWU6ICdNSC1aMTYnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWUgfSAgICAgICAgXG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICB2YXIga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonVGVtcCcsJ3R5cGUnOidhaXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonU29pbCcsJ3R5cGUnOidzZWVkbGluZycsJ3RhcmdldCc6NjAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidQbGFudCcsJ3R5cGUnOidjYW5uYWJpcycsJ3RhcmdldCc6NjAsJ2RpZmYnOjJ9XG4gICAgICBdO1xuICAgICAgaWYodHlwZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGtldHRsZXMsIHsndHlwZSc6IHR5cGV9KVswXTtcbiAgICAgIHJldHVybiBrZXR0bGVzO1xuICAgIH0sXG5cbiAgICBkb21haW46IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBkb21haW4gPSAnaHR0cDovL2FyZHVpbm8ubG9jYWwnO1xuXG4gICAgICBpZihhcmR1aW5vICYmIGFyZHVpbm8udXJsKXtcbiAgICAgICAgZG9tYWluID0gKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykgIT09IC0xKSA/XG4gICAgICAgICAgYXJkdWluby51cmwuc3Vic3RyKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykrMikgOlxuICAgICAgICAgIGFyZHVpbm8udXJsO1xuXG4gICAgICAgIGlmKEJvb2xlYW4oYXJkdWluby5zZWN1cmUpKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vLCByZXR1cm5fdmVyc2lvbil7XG4gICAgICBpZihyZXR1cm5fdmVyc2lvbil7XG4gICAgICAgIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCczMicpICE9PSAtMSB8fCBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbTVzdGlja19jJykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnMzInO1xuICAgICAgICBlbHNlIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCc4MjY2JykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnODI2Nic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gQm9vbGVhbihhcmR1aW5vICYmIGFyZHVpbm8uYm9hcmQgJiYgKFxuICAgICAgICAgIGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdlc3AnKSAhPT0gLTEgfHxcbiAgICAgICAgICBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbm9kZW1jdScpICE9PSAtMSB8fFxuICAgICAgICAgIGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdtNXN0aWNrX2MnKSAhPT0gLTFcbiAgICAgICkpO1xuICAgIH0sXG4gIFxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgdmFyIHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKGFyZHVpbm8sIGVuZHBvaW50KXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihhcmR1aW5vKSArICcvYXJkdWluby8nICsgZW5kcG9pbnQ7XG4gICAgICAvLyBleHRlbmRlZCBpbmZvXG4gICAgICBpZiAoZW5kcG9pbnQgPT0gJ2luZm8tZXh0JylcbiAgICAgICAgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykgKyAnL2luZm8nO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiAxMDAwMH07XG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKVxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKSA9PT0gMCB8fCBrZXR0bGUudGVtcC5waW4uaW5kZXhPZignRycpID09PSAwKVxuICAgICAgICAgIHVybCArPSAnP2FwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB1cmwgKz0gJz9kcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLnZjYykgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZkcGluPScra2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC52Y2MpICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZihCb29sZWFuKGtldHRsZS50ZW1wLmluZGV4KSkgLy9EUzE4QjIwIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmaW5kZXg9JytrZXR0bGUudGVtcC5pbmRleDtcbiAgICAgICAgdXJsICs9ICcvJytrZXR0bGUudGVtcC5waW47XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG4gICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfTtcbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpO1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/YXBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3I7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MudHBsaW5rLnRva2VuKXtcbiAgICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICAgIHJldHVybiB1cmwrJy8/JytqUXVlcnkucGFyYW0ocGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9LFxuICAgICAgICBsb2dpbjogKHVzZXIscGFzcykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZighdXNlciB8fCAhcGFzcylcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCBMb2dpbicpO1xuICAgICAgICAgIGNvbnN0IGxvZ2luX3BheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOiBcImxvZ2luXCIsXG4gICAgICAgICAgICBcInVybFwiOiB1cmwsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiYXBwVHlwZVwiOiBcIkthc2FfQW5kcm9pZFwiLFxuICAgICAgICAgICAgICBcImNsb3VkUGFzc3dvcmRcIjogcGFzcyxcbiAgICAgICAgICAgICAgXCJjbG91ZFVzZXJOYW1lXCI6IHVzZXIsXG4gICAgICAgICAgICAgIFwidGVybWluYWxVVUlEXCI6IHBhcmFtcy50ZXJtSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShsb2dpbl9wYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlblxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnJlc3VsdCl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdG9rZW4gPSB0b2tlbiB8fCBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7dG9rZW46IHRva2VufSxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6IFwiZ2V0RGV2aWNlTGlzdFwiIH0pLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjb21tYW5kOiAoZGV2aWNlLCBjb21tYW5kKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdmFyIHRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjpcInBhc3N0aHJvdWdoXCIsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiZGV2aWNlSWRcIjogZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgICAgICBcInJlcXVlc3REYXRhXCI6IEpTT04uc3RyaW5naWZ5KCBjb21tYW5kIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHNldCB0aGUgdG9rZW5cbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICBwYXJhbXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBkZXZpY2UuYXBwU2VydmVyVXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogKGRldmljZSwgdG9nZ2xlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiB0b2dnbGUgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGlmdHR0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25maWc6IChkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5pZnR0dC5hdXRoLmtleSAmJiBzZXR0aW5ncy5pZnR0dC5hdXRoLnZhbHVlKSB7XG4gICAgICAgICAgICBoZWFkZXJzW3NldHRpbmdzLmlmdHR0LmF1dGgua2V5XSA9IHNldHRpbmdzLmlmdHR0LmF1dGgudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBodHRwID0ge1xuICAgICAgICAgICAgdXJsOiBzZXR0aW5ncy5pZnR0dC51cmwsXG4gICAgICAgICAgICBtZXRob2Q6IHNldHRpbmdzLmlmdHR0Lm1ldGhvZCxcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5pZnR0dC5tZXRob2QgPT0gJ0dFVCcpXG4gICAgICAgICAgICBodHRwLnBhcmFtcyA9IGRhdGE7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaHR0cC5kYXRhID0gZGF0YTtcbiAgICAgICAgICByZXR1cm4gaHR0cDtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIGRhdGEgPSB7ICdicmV3YmVuY2gnOiB0cnVlIH07XG4gICAgICAgICAgdmFyIGh0dHBfY29uZmlnID0gdGhpcy5pZnR0dCgpLmNvbmZpZyhkYXRhKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoIWh0dHBfY29uZmlnLnVybCkge1xuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdNaXNzaW5nIFVSTCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAkaHR0cChodHRwX2NvbmZpZylcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cykge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShgQ29ubmVjdGlvbiBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBzZW5kOiAoZGF0YSkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgaHR0cF9jb25maWcgPSB0aGlzLmlmdHR0KCkuY29uZmlnKGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaHR0cF9jb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ01pc3NpbmcgVVJMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgICRodHRwKGh0dHBfY29uZmlnKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKGBDb25uZWN0aW9uIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGFwcDogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6ICdodHRwczovL3NlbnNvci5icmV3YmVuY2guY28vJywgaGVhZGVyczoge30sIHRpbWVvdXQ6IDEwMDAwfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXV0aDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5hcHAuYXBpX2tleSAmJiBzZXR0aW5ncy5hcHAuZW1haWwpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gYHVzZXJzLyR7c2V0dGluZ3MuYXBwLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtFWSddID0gYCR7c2V0dGluZ3MuYXBwLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktRU1BSUwnXSA9IGAke3NldHRpbmdzLmFwcC5lbWFpbH1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5zdWNjZXNzKVxuICAgICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICBxLnJlamVjdChcIlVzZXIgbm90IGZvdW5kXCIpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZihCb29sZWFuKHNldHRpbmdzLmluZmx1eGRiLnBvcnQpKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6IChpbmZsdXhkYikgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVybCl7XG4gICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uID0gYCR7aW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgICBpZihCb29sZWFuKGluZmx1eGRiLnBvcnQpKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdzaG93IGRhdGFiYXNlcycpfWAsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzICl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6IEJvb2xlYW4ob3B0aW9ucy5zZXNzaW9uKSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBCb29sZWFuKG9wdGlvbnMuc2Vzc2lvbikgPyBvcHRpb25zLnNlc3Npb24gOiAnJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTW9uaXRvcicsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG4gICAgICAgICAgICAgIGludGVycG9sYXRlOiAnYmFzaXMnLFxuICAgICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBrZXk6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLm5hbWUgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpc0FyZWE6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBCb29sZWFuKG9wdGlvbnMuY2hhcnQuYXJlYSkgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKEJvb2xlYW4ob3B0aW9ucy5jaGFydC5taWxpdGFyeSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVIOiVNOiVTJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUyVwJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnYm90dG9tJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tQYWRkaW5nOiAyMCxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiA0MCxcbiAgICAgICAgICAgICAgICAgIHN0YWdnZXJMYWJlbHM6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZm9yY2VZOiAoIW9wdGlvbnMudW5pdCB8fCBvcHRpb25zLnVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGQsMCkrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uIChwbGF0bykge1xuICAgICAgaWYgKCFwbGF0bykgcmV0dXJuICcnO1xuICAgICAgdmFyIHNnID0gKDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoKHBsYXRvIC8gMjU4LjIpICogMjI3LjEpKSkpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpLnRvRml4ZWQoMyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24gKHNnKSB7XG4gICAgICBpZiAoIXNnKSByZXR1cm4gJyc7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0bykudG9GaXhlZCgyKTs7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX05BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfQlJFV0VSKSlcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSkpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKSl7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKSl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgdmFyIG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5OQU1FKSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQ0FURUdPUlkpKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoQm9vbGVhbihyZWNpcGUuRl9SX0RBVEUpKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuQlJFV0VSKSlcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRykpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLklCVSkpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5BQlZfTUFYKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NSU4pKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRkVSTUVOVEFCTEVTKSl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5IT1BTKSl7XG4gICAgICAgIHZhciBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuTUlTQ1MpKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuWUVBU1RTKSl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==