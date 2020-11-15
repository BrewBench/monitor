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
      currentSketch.pins.push(' pins += "{\\"name\\":\\"" + String("' + kettle.name + '") + "\\",\\"pin\\":\\"" + String("' + kettle.temp.pin + '") + "\\",\\"type\\":\\"" + String("' + kettleType + '") + "\\",\\"adjust\\":\\"" + String("' + adjust + '") + "\\"}";');

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
      var sensors = [{ name: 'Thermistor', analog: true, digital: false, esp: true }, { name: 'DS18B20', analog: false, digital: true, esp: true }, { name: 'PT100', analog: true, digital: true, esp: true }, { name: 'DHT11', analog: false, digital: true, esp: true }, { name: 'DHT12', analog: false, digital: true, esp: false }, { name: 'DHT21', analog: false, digital: true, esp: false }, { name: 'DHT22', analog: false, digital: true, esp: true }, { name: 'DHT33', analog: false, digital: true, esp: false }, { name: 'DHT44', analog: false, digital: true, esp: false }, { name: 'SoilMoisture', analog: true, digital: false, vcc: true, percent: true, esp: true }, { name: 'BMP180', analog: true, digital: false, esp: true }, { name: 'BMP280', analog: true, digital: false, esp: true }];
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
        if (arduino.board.toLowerCase().indexOf('32') !== -1) return '32';else if (arduino.board.toLowerCase().indexOf('8266') !== -1) return '8266';else return false;
      }
      return Boolean(arduino && arduino.board && (arduino.board.toLowerCase().indexOf('esp') !== -1 || arduino.board.toLowerCase().indexOf('nodemcu') !== -1));
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
        if (kettle.temp.pin.indexOf('A') === 0) url += '?apin=' + kettle.temp.pin;else url += '?dpin=' + kettle.temp.pin;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwibW9kYWxJbmZvIiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJvcGVuSW5mb01vZGFsIiwiYXJkdWlubyIsIiQiLCJtb2RhbCIsInJlcGxhY2VLZXR0bGVzV2l0aFBpbnMiLCJpbmZvIiwicGlucyIsImxlbmd0aCIsIl8iLCJlYWNoIiwicHVzaCIsInBpbiIsImlkIiwic3RpY2t5IiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJpbmRleCIsImFkYyIsImhpdCIsImlmdHR0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwidmVyc2lvbiIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJmaWx0ZXIiLCJpdGVtIiwic3JtIiwiaGV4Iiwic2V0dGluZ3MiLCJyZXNldCIsImFwcCIsImVtYWlsIiwiYXBpX2tleSIsInN0YXR1cyIsImdlbmVyYWwiLCJjaGFydE9wdGlvbnMiLCJ1bml0IiwiY2hhcnQiLCJkZWZhdWx0S2V0dGxlcyIsIm9wZW5Ta2V0Y2hlcyIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwiY2hhbmdlQXJkdWlubyIsImFyZHVpbm9zIiwiaXNFU1AiLCJhbmFsb2ciLCJkaWdpdGFsIiwidG91Y2giLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFkZCIsInRvb2x0aXAiLCJub3ciLCJEYXRlIiwiYnRvYSIsImJvYXJkIiwiUlNTSSIsInNlY3VyZSIsImR0IiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwiY29ubmVjdCIsInRoZW4iLCJCcmV3QmVuY2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsInVzZXIiLCJwYXNzIiwidG9rZW4iLCJwbHVncyIsImxvZ2luIiwicmVzcG9uc2UiLCJzY2FuIiwiZXJyb3JfY29kZSIsIm1zZyIsInNldEVycm9yTWVzc2FnZSIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiYXV0aCIsImtleSIsImFkZEtldHRsZSIsImZpbmQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwiaGVhdElzT24iLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiYXJkdWlub0lkIiwiY2hhbmdlU2Vuc29yIiwic2Vuc29yVHlwZXMiLCJwZXJjZW50IiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJjb25zb2xlIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImJyZXdlciIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJ0ZXh0Iiwic2hvdyIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidHJ1c3RBc0h0bWwiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJzaGlmdCIsImFsdGl0dWRlIiwicHJlc3N1cmUiLCJjdXJyZW50VmFsdWUiLCJ1bml0VHlwZSIsImdldFRpbWUiLCJzdWJUZXh0IiwiY29sb3IiLCJnZXROYXZPZmZzZXQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGVhdFNhZmV0eSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIm9uIiwiTWF0aCIsInJvdW5kIiwib2ZmIiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImNvbXBpbGVTa2V0Y2giLCJza2V0Y2hOYW1lIiwic2Vuc29ycyIsInNrZXRjaGVzIiwiYXJkdWlub05hbWUiLCJjdXJyZW50U2tldGNoIiwiYWN0aW9ucyIsInRyaWdnZXJzIiwiYmYiLCJESFQiLCJEUzE4QjIwIiwiQk1QIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwidG9Mb3dlckNhc2UiLCJkb3dubG9hZFNrZXRjaCIsImhhc1RyaWdnZXJzIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImF1dG9nZW4iLCJnZXQiLCJqb2luIiwibm90aWZpY2F0aW9ucyIsIm1kNSIsInRyaW0iLCJjb25uZWN0aW9uX3N0cmluZyIsInBvcnQiLCJUSEMiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwic3R5bGUiLCJkaXNwbGF5IiwiYm9keSIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmVDaGlsZCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsImxvdyIsImhpZ2giLCJsYXN0IiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJzZW5kIiwidHJhY2tDb2xvciIsImJhckNvbG9yIiwiY2hhbmdlS2V0dGxlVHlwZSIsImtldHRsZUluZGV4IiwiZmluZEluZGV4IiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsInByb2Nlc3NUZW1wcyIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNvbmZpcm0iLCJjbGVhcktldHRsZSIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZSIsInNyY0VsZW1lbnQiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZGJtIiwia2ciLCJpc05hTiIsImZhY3RvcnkiLCJsb2NhbFN0b3JhZ2UiLCJyZW1vdmVJdGVtIiwiZGVidWciLCJtaWxpdGFyeSIsImFyZWEiLCJyZWFkT25seSIsImVuYWJsZWQiLCJmb250IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJzZXRJdGVtIiwiZ2V0SXRlbSIsInJldHVybl92ZXJzaW9uIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJlbmRwb2ludCIsInJlcXVlc3QiLCJwYXNzd29yZCIsIndpdGhDcmVkZW50aWFscyIsInNlbnNvciIsIkF1dGhvcml6YXRpb24iLCJkaWdpdGFsUmVhZCIsInBhcmFtcyIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaHR0cCIsImh0dHBfY29uZmlnIiwic3VjY2VzcyIsImJpdGNhbGMiLCJhdmVyYWdlIiwiZm1hcCIsIngiLCJpbl9taW4iLCJpbl9tYXgiLCJvdXRfbWluIiwib3V0X21heCIsIlRIRVJNSVNUT1JOT01JTkFMIiwiVEVNUEVSQVRVUkVOT01JTkFMIiwiTlVNU0FNUExFUyIsIkJDT0VGRklDSUVOVCIsIlNFUklFU1JFU0lTVE9SIiwibG4iLCJsb2ciLCJrZWx2aW4iLCJzdGVpbmhhcnQiLCJpbmZsdXhDb25uZWN0aW9uIiwic2VyaWVzIiwidGl0bGUiLCJlbmFibGUiLCJzZXNzaW9uIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUEsa0JBQVFBLE1BQVIsQ0FBZSxtQkFBZixFQUFvQyxDQUNsQyxXQURrQyxFQUVqQyxNQUZpQyxFQUdqQyxTQUhpQyxFQUlqQyxVQUppQyxFQUtqQyxTQUxpQyxFQU1qQyxVQU5pQyxDQUFwQyxFQVFDQyxNQVJELENBUVEsVUFBU0MsY0FBVCxFQUF5QkMsa0JBQXpCLEVBQTZDQyxhQUE3QyxFQUE0REMsaUJBQTVELEVBQStFQyxnQkFBL0UsRUFBaUc7O0FBRXZHRixnQkFBY0csUUFBZCxDQUF1QkMsVUFBdkIsR0FBb0MsSUFBcEM7QUFDQUosZ0JBQWNHLFFB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R0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBbmlCLFFBQUVDLElBQUYsQ0FBT2dpQixTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRM2YsT0FBUixDQUFnQitmLEtBQUtGLENBQXJCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7QUFDaENGLG9CQUFVQSxRQUFRNWYsT0FBUixDQUFnQm1WLE9BQU82SyxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQW4vQ0ksR0FBUDtBQXEvQ0QsQ0F4L0NELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6U2xpZGVyJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGw7XG52YXIgcmVzZXRDaGFydCA9IDEwMDtcbnZhciB0aW1lb3V0ID0gbnVsbDsgLy9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogQm9vbGVhbihkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbD09J2h0dHBzOicpXG4gICwgaHR0cHNfdXJsOiBgaHR0cHM6Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9YFxufTtcbiRzY29wZS5lc3AgPSB7XG4gIHR5cGU6ICcnLFxuICBzc2lkOiAnJyxcbiAgc3NpZF9wYXNzOiAnJyxcbiAgaG9zdG5hbWU6ICdiYmVzcCcsXG4gIGFyZHVpbm9fcGFzczogJ2JiYWRtaW4nLFxuICBhdXRvY29ubmVjdDogZmFsc2Vcbn07XG4kc2NvcGUubW9kYWxJbmZvID0ge307XG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUucGtnO1xuJHNjb3BlLmtldHRsZVR5cGVzID0gQnJld1NlcnZpY2Uua2V0dGxlVHlwZXMoKTtcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogMSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUub3BlbkluZm9Nb2RhbCA9IGZ1bmN0aW9uIChhcmR1aW5vKSB7XG4gICRzY29wZS5tb2RhbEluZm8gPSBhcmR1aW5vO1xuICAkKCcjYXJkdWluby1pbmZvJykubW9kYWwoJ3RvZ2dsZScpOyAgXG59O1xuICBcbiRzY29wZS5yZXBsYWNlS2V0dGxlc1dpdGhQaW5zID0gZnVuY3Rpb24gKGFyZHVpbm8pIHtcbiAgaWYgKGFyZHVpbm8uaW5mbyAmJiBhcmR1aW5vLmluZm8ucGlucyAmJiBhcmR1aW5vLmluZm8ucGlucy5sZW5ndGgpIHtcbiAgICAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIF8uZWFjaChhcmR1aW5vLmluZm8ucGlucywgcGluID0+IHtcbiAgICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiBwaW4ubmFtZVxuICAgICAgICAsIGlkOiBudWxsXG4gICAgICAgICwgdHlwZTogJHNjb3BlLmtldHRsZVR5cGVzWzRdLnR5cGVcbiAgICAgICAgLCBhY3RpdmU6IGZhbHNlXG4gICAgICAgICwgc3RpY2t5OiBmYWxzZVxuICAgICAgICAsIGhlYXRlcjogeyBwaW46ICdENicsIHJ1bm5pbmc6IGZhbHNlLCBhdXRvOiBmYWxzZSwgcHdtOiBmYWxzZSwgZHV0eUN5Y2xlOiAxMDAsIHNrZXRjaDogZmFsc2UgfVxuICAgICAgICAsIHB1bXA6IHsgcGluOiAnRDcnLCBydW5uaW5nOiBmYWxzZSwgYXV0bzogZmFsc2UsIHB3bTogZmFsc2UsIGR1dHlDeWNsZTogMTAwLCBza2V0Y2g6IGZhbHNlIH1cbiAgICAgICAgLCB0ZW1wOiB7IHBpbjogcGluLnBpbiwgdmNjOiAnJywgaW5kZXg6ICcnLCB0eXBlOiBwaW4udHlwZSwgYWRjOiBmYWxzZSwgaGl0OiBmYWxzZSwgaWZ0dHQ6IGZhbHNlLCBjdXJyZW50OiAwLCBtZWFzdXJlZDogMCwgcHJldmlvdXM6IDAsIGFkanVzdDogMCwgdGFyZ2V0OiAkc2NvcGUua2V0dGxlVHlwZXNbNF0udGFyZ2V0LCBkaWZmOiAkc2NvcGUua2V0dGxlVHlwZXNbNF0uZGlmZiwgcmF3OiAwLCB2b2x0czogMCB9XG4gICAgICAgICwgdmFsdWVzOiBbXVxuICAgICAgICAsIHRpbWVyczogW11cbiAgICAgICAgLCBrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCksIHsgdmFsdWU6IDAsIG1pbjogMCwgbWF4OiAkc2NvcGUua2V0dGxlVHlwZXNbNF0udGFyZ2V0ICsgJHNjb3BlLmtldHRsZVR5cGVzWzRdLmRpZmYgfSlcbiAgICAgICAgLCBhcmR1aW5vOiBhcmR1aW5vXG4gICAgICAgICwgbWVzc2FnZTogeyB0eXBlOiAnZXJyb3InLCBtZXNzYWdlOiAnJywgdmVyc2lvbjogJycsIGNvdW50OiAwLCBsb2NhdGlvbjogJycgfVxuICAgICAgICAsIG5vdGlmeTogeyBzbGFjazogZmFsc2UgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn07XG4gIFxuJHNjb3BlLmdldEtldHRsZVNsaWRlck9wdGlvbnMgPSBmdW5jdGlvbih0eXBlLCBpbmRleCl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKCRzY29wZS5zbGlkZXIub3B0aW9ucywge2lkOiBgJHt0eXBlfV8ke2luZGV4fWB9KTtcbn1cblxuJHNjb3BlLmdldExvdmlib25kQ29sb3IgPSBmdW5jdGlvbihyYW5nZSl7XG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZSgvwrAvZywnJykucmVwbGFjZSgvIC9nLCcnKTtcbiAgaWYocmFuZ2UuaW5kZXhPZignLScpIT09LTEpe1xuICAgIHZhciByQXJyPXJhbmdlLnNwbGl0KCctJyk7XG4gICAgcmFuZ2UgPSAocGFyc2VGbG9hdChyQXJyWzBdKStwYXJzZUZsb2F0KHJBcnJbMV0pKS8yO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gcGFyc2VGbG9hdChyYW5nZSk7XG4gIH1cbiAgaWYoIXJhbmdlKVxuICAgIHJldHVybiAnJztcbiAgdmFyIGwgPSBfLmZpbHRlcigkc2NvcGUubG92aWJvbmQsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiAoaXRlbS5zcm0gPD0gcmFuZ2UpID8gaXRlbS5oZXggOiAnJztcbiAgfSk7XG4gIGlmKGwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbmlmICghJHNjb3BlLnNldHRpbmdzLmFwcClcbiAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IHsgZW1haWw6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJyB9O1xuLy8gZ2VuZXJhbCBjaGVjayBhbmQgdXBkYXRlXG5pZighJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwpXG4gIHJldHVybiAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydH0pO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG5cbiRzY29wZS5vcGVuU2tldGNoZXMgPSBmdW5jdGlvbigpe1xuICAkKCcjc2V0dGluZ3NNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICQoJyNza2V0Y2hlc01vZGFsJykubW9kYWwoJ3Nob3cnKTtcbn07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW1CeShvYmosJ2Ftb3VudCcpO1xufTtcblxuJHNjb3BlLmNoYW5nZUFyZHVpbm8gPSBmdW5jdGlvbiAoa2V0dGxlKSB7XG4gIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnMzInKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLnRvdWNoID0gWzQsMCwyLDE1LDEzLDEyLDE0LDI3LDMzLDMyXTtcbiAgfSBlbHNlIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMTY7XG4gIH1cbn07XG4vLyBjaGVjayBrZXR0bGUgdHlwZSBwb3J0c1xuXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzMyJykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gIH0gZWxzZSBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICc4MjY2Jykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICB9XG59KTtcbiAgXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS5nZXRTdGF0dXNDbGFzcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIGlmKHN0YXR1cyA9PSAnQ29ubmVjdGVkJylcbiAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICBlbHNlIGlmKF8uZW5kc1dpdGgoc3RhdHVzLCdpbmcnKSlcbiAgICByZXR1cm4gJ3NlY29uZGFyeSc7XG4gIGVsc2VcbiAgICByZXR1cm4gJ2Rhbmdlcic7XG59XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zKSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICBib2FyZDogJycsXG4gICAgICAgIFJTU0k6IGZhbHNlLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHsgZXJyb3I6ICcnLCBkdDogJycsIG1lc3NhZ2U6ICcnIH0sXG4gICAgICAgIGluZm86IHt9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mbycpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5CcmV3QmVuY2gpe1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDAgfHwgYXJkdWluby5ib2FyZC5pbmRleE9mKCdOb2RlTUNVXzMyUycpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0dldHRpbmcgSW5mby4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvLWV4dCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IGluZm87XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IHt9O1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5wa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAncmVib290JylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gJyc7XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3QgU3VjY2VzcywgdHJ5IGNvbm5lY3RpbmcgaW4gYSBmZXcgc2Vjb25kcy4nO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYocGtnLnZlcnNpb24gPCA0LjIpXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ1VwZ3JhZGUgdG8gc3VwcG9ydCByZWJvb3QnO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBjbGVhcjogKCkgPT4geyBcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsgPSB7IHVzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46ICcnLCBzdGF0dXM6ICcnLCBwbHVnczogW10gfTtcbiAgICB9LFxuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9IGVsc2UgaWYocmVzcG9uc2UuZXJyb3JfY29kZSAmJiByZXNwb25zZS5tc2cpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShyZXNwb25zZS5tc2cpOyAgXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4ocGx1Zy5zdGF0dXMpKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaWZ0dHQgPSB7XG4gICAgY2xlYXI6ICgpID0+IHsgXG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQgPSB7IHVybDogJycsIG1ldGhvZDogJ0dFVCcsIGF1dGg6IHsga2V5OiAnJywgdmFsdWU6ICcnIH0sIHN0YXR1czogJycgfTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLmNvbm5lY3QoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gIH07XG4gIFxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG4gIFxuICAkc2NvcGUuaGVhdElzT24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydoZWF0ZXInOiB7J3J1bm5pbmcnOiB0cnVlfX0pLmxlbmd0aCk7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihhcmR1aW5vLCBwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZSBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vKSl7XG4gICAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8sIHRydWUpID09ICc4MjY2JylcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0EnLCdHUElPJykucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwaW47XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYXBwID0ge1xuICAgIGNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpICYmXG4gICAgICAgIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmFwcC5hcGlfa2V5KSAmJlxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwID0gZGVmYXVsdFNldHRpbmdzLmFwcDtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgIGlmKCFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpIHx8ICFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFwcCgpLmF1dGgoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZihCb29sZWFuKGZvcm1hdHRlZF9jb250ZW50KSl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZihCb29sZWFuKGpzb25PYmouUmVjaXBlcykgJiYgQm9vbGVhbihqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZihCb29sZWFuKGpzb25PYmouU2VsZWN0aW9ucykgJiYgQm9vbGVhbihqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoQm9vbGVhbihqc29uT2JqLlJFQ0lQRVMpICYmIEJvb2xlYW4oanNvbk9iai5SRUNJUEVTLlJFQ0lQRSkpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5vZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5mZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoe1xuICAgICAgYW5pbWF0ZWQ6ICdmYWRlJyxcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIGh0bWw6IHRydWVcbiAgICB9KTtcbiAgICBpZigkKCcjZ2l0Y29tbWl0IGEnKS50ZXh0KCkgIT0gJ2dpdF9jb21taXQnKXtcbiAgICAgICQoJyNnaXRjb21taXQnKS5zaG93KCk7XG4gICAgfVxuICAgIFxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGltZXJzKSAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24peyAgICBcbiAgICAgIHZhciBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4oZXJyLnN0YXR1c1RleHQpKVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKG1lc3NhZ2UpKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICBcbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5jdXJyZW50KSlcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLCAyKTtcbiAgICBcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpLCAwKTsgICAgXG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmIChrZXR0bGUudGVtcC50eXBlICE9ICdCTVAxODAnICYmXG4gICAgICBrZXR0bGUudGVtcC50eXBlICE9ICdCTVAyODAnICYmXG4gICAgICAha2V0dGxlLnRlbXAudm9sdHMgJiZcbiAgICAgICFrZXR0bGUudGVtcC5yYXcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnICYmXG4gICAgICByZXNwb25zZS50ZW1wID09IC0xMjcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHkgYXMgYSBwZXJjZW50XG4gICAgLy9Tb2lsTW9pc3R1cmVEIGhhcyBtb2lzdHVyZSBhcyBhIHBlcmNlbnRcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnBlcmNlbnQsMCk7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaC1hbHQnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgIHZhciBrO1xuICAgIHZhciBoZWF0SXNPbiA9ICRzY29wZS5oZWF0SXNPbigpO1xuICAgIFxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgIGlmIChpdGVtID09ICdoZWF0JyAmJiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5oZWF0U2FmZXR5ICYmIGhlYXRJc09uKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ0EgaGVhdGVyIGlzIGFscmVhZHkgcnVubmluZy4nLCBrZXR0bGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrXG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5zZW5zb3JzKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMgPSB7fTtcbiAgICAvLyBhcHBlbmQgZXNwIHR5cGVcbiAgICBpZihza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSAmJiAhc2tldGNoTmFtZS5pbmRleE9mKCdFU1AzMicpID09PSAtMSlcbiAgICAgIHNrZXRjaE5hbWUgKz0gJHNjb3BlLmVzcC50eXBlO1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWlubyA/IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSA6ICdEZWZhdWx0JztcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOiBhcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICB0eXBlOiBza2V0Y2hOYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIHBpbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZSxcbiAgICAgICAgICBiZjogKHNrZXRjaE5hbWUuaW5kZXhPZignQkYnKSAhPT0gLTEpID8gdHJ1ZSA6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgQm9vbGVhbihrZXR0bGUudGVtcC5hZGp1c3QpKSA/ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgaWYoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmICRzY29wZS5lc3AuYXV0b2Nvbm5lY3Qpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEF1dG9Db25uZWN0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigoc2tldGNoTmFtZS5pbmRleE9mKCdFU1AnKSAhPT0gLTEgfHwgQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKSAmJlxuICAgICAgICAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKSAmJlxuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2JlZWdlZS10b2t5by9ESFRlc3AnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgXCJESFRlc3AuaFwiJyk7XG4gICAgICB9IGVsc2UgaWYoIUJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJlxuICAgICAgICAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKSAmJlxuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVGxpYi0xLjIuOS56aXAnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuRFMxOEIyMCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxPbmVXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuQk1QIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignQk1QMTgwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuQk1QIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignQk1QMjgwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpO1xuICAgICAgfVxuICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDAgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hZGFmcnVpdC9BZGFmcnVpdF9BRFMxWDE1Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpO1xuICAgICAgfVxuICAgICAgLy8gYWRkIHRoZSBhY3Rpb25zIGNvbW1hbmRcbiAgICAgIHZhciBrZXR0bGVUeXBlID0ga2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmIChrZXR0bGUudGVtcC52Y2MpXG4gICAgICAgIGtldHRsZVR5cGUgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgXG4gICAgICBpZiAoa2V0dGxlLnRlbXAuaW5kZXgpIGtldHRsZVR5cGUgKz0gJy0nICsga2V0dGxlLnRlbXAuaW5kZXg7ICAgICAgXG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBhY3Rpb25zQ29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGRlbGF5KDUwMCk7Jyk7XG4gICAgICAvLyB1c2VkIGZvciBpbmZvIGVuZHBvaW50XG4gICAgICBjdXJyZW50U2tldGNoLnBpbnMucHVzaCgnIHBpbnMgKz0gXCJ7XFxcXFwibmFtZVxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicra2V0dGxlLm5hbWUrJ1wiKSArIFwiXFxcXFwiLFxcXFxcInBpblxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicra2V0dGxlLnRlbXAucGluKydcIikgKyBcIlxcXFxcIixcXFxcXCJ0eXBlXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJytrZXR0bGVUeXBlKydcIikgKyBcIlxcXFxcIixcXFxcXCJhZGp1c3RcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2FkanVzdCsnXCIpICsgXCJcXFxcXCJ9XCI7Jyk7XG4gICAgICBcbiAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEgJiYga2V0dGxlLnBlcmNlbnQpIHtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc1BlcmNlbnRDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKyctSHVtaWRpdHlcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpOyAgICAgICAgXG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrQm9vbGVhbihrZXR0bGUubm90aWZ5LnNsYWNrKSsnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrQm9vbGVhbihrZXR0bGUubm90aWZ5LnNsYWNrKSsnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmIChza2V0Y2gudHJpZ2dlcnMgfHwgc2tldGNoLmJmKSB7XG4gICAgICAgIGlmIChza2V0Y2gudHlwZS5pbmRleE9mKCdNNScpID09PSAtMSkge1xuICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpO1xuICAgICAgICAgIGlmIChza2V0Y2guYmYpIHtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGFtYmllbnQgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgaHVtaWRpdHkgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnY29uc3QgU3RyaW5nIGVxdWlwbWVudF9uYW1lID0gXCInKyRzY29wZS5zZXR0aW5ncy5iZi5uYW1lKydcIjsnKTsgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZCBcbiAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodW1pZGl0eScpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcsICdodW1pZGl0eSA9IGFjdGlvbnNQZXJjZW50Q29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2FtYmllbnQnKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICdhbWJpZW50ID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gQWxsIG90aGVyIGxvZ2ljXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gucGlucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaCcrc2tldGNoTmFtZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZG93bmxvYWRTa2V0Y2gobmFtZSwgYWN0aW9ucywgcGlucywgaGFzVHJpZ2dlcnMsIGhlYWRlcnMsIHNrZXRjaCl7XG4gICAgLy8gdHAgbGluayBjb25uZWN0aW9uXG4gICAgdmFyIHRwbGlua19jb25uZWN0aW9uX3N0cmluZyA9IEJyZXdTZXJ2aWNlLnRwbGluaygpLmNvbm5lY3Rpb24oKTtcbiAgICB2YXIgYXV0b2dlbiA9ICcvKlxcblNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jb1xcblZlcnNpb24gJyskc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKycgJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJ1xcbiovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtBQ1RJT05TXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbUElOU10nLCBwaW5zLmxlbmd0aCA/IHBpbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignQXBwJyApICE9PSAtMSl7XG4gICAgICAgICAgLy8gYXBwIGNvbm5lY3Rpb25cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUFBfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdCRll1bicgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGJmIGFwaSBrZXkgaGVhZGVyXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQkZfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5iZi5hcGlfa2V5LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZiggQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgIGlmIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyKSAmJiBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKSlcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYDtcbiAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5USEMpIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gVEhDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDI4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLScrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnKyRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiBCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICBpZihCb29sZWFuKHRpbWVyKSl7IC8va2V0dGxlIGlzIGEgdGltZXIgb2JqZWN0XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGltZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZih0aW1lci51cClcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHRpbWVycyBhcmUgZG9uZSc7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4odGltZXIubm90ZXMpKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZihCb29sZWFuKHRpbWVyKSAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKEJvb2xlYW4odGltZXIpKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgbWVhc3VyZWQgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayAmJiAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBJRlRUVCBOb3RpZmljYXRpb25cbiAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLmlmdHR0KSAmJiAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQudXJsICYmICRzY29wZS5zZXR0aW5ncy5pZnR0dC51cmwuaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLmlmdHR0KCkuc2VuZCh7XG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcjogY29sb3IsICAgICBcbiAgICAgICAgICB1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LFxuICAgICAgICAgIG5hbWU6IGtldHRsZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IGtldHRsZS50eXBlLFxuICAgICAgICAgIHRlbXA6IGtldHRsZS50ZW1wLFxuICAgICAgICAgIGhlYXRlcjoga2V0dGxlLmhlYXRlcixcbiAgICAgICAgICBwdW1wOiBrZXR0bGUucHVtcCxcbiAgICAgICAgICBjb29sZXI6IGtldHRsZS5jb29sZXIgfHwge30sXG4gICAgICAgICAgYXJkdWlubzoga2V0dGxlLmFyZHVpbm8gICAgICAgICAgXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHNlbmRpbmcgdG8gSUZUVFQgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgc2VuZGluZyB0byBJRlRUVCAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgJiYga2V0dGxlLm1lc3NhZ2UudHlwZSA9PSAnZGFuZ2VyJyl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAudGFyZ2V0KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuY3VycmVudCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAubWVhc3VyZWQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnByZXZpb3VzLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLnRhcmdldCwwKTtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5hZGp1c3QpKXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnR9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCBCb29sZWFuKGtldHRsZSkgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlKSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbiAoa2V0dGxlLCAkaW5kZXgpIHsgICAgXG4gICAgaWYoY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlbW92ZSB0aGlzIGtldHRsZT8nKSlcbiAgICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG4gIFxuICAkc2NvcGUuY2xlYXJLZXR0bGUgPSBmdW5jdGlvbiAoa2V0dGxlLCAkaW5kZXgpIHtcbiAgICAkc2NvcGUua2V0dGxlc1skaW5kZXhdLnZhbHVlcyA9IFtdO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIGlmKGZpZWxkID09ICdhZGp1c3QnKXtcbiAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIH1cblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoQm9vbGVhbihsb2FkZWQpKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcblxuICAvLyB1cGRhdGUgbG9jYWwgY2FjaGVcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsID0gZnVuY3Rpb24gKCkge1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsICRzY29wZS5rZXR0bGVzKTtcbiAgICAgICRzY29wZS51cGRhdGVMb2NhbCgpO1xuICAgIH0sIDUwMDApO1xuICB9O1xuICBcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSBCb29sZWFuKHNjb3BlLnR5cGUpID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHQgICAgfSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICBjZWxzaXVzID0gcGFyc2VGbG9hdChjZWxzaXVzKTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKShjZWxzaXVzKjkvNSszMiwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgZmFocmVuaGVpdCA9IHBhcnNlRmxvYXQoZmFocmVuaGVpdCk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoKGZhaHJlbmhlaXQtMzIpKjUvOSwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdyb3VuZCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbCxkZWNpbWFscykge1xuICAgIHJldHVybiBOdW1iZXIoKE1hdGgucm91bmQodmFsICsgXCJlXCIgKyBkZWNpbWFscykgICsgXCJlLVwiICsgZGVjaW1hbHMpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0aXRsZWNhc2UnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQpe1xuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRleHQuc2xpY2UoMSkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2RibVBlcmNlbnQnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRibSl7XG4gICAgcmV0dXJuIDIgKiAoZGJtICsgMTAwKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMzUuMjc0LCAyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMi4yMDQ2MiwgMik7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZ2VuZXJhbDogeyBkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBoZWF0U2FmZXR5OiBmYWxzZSB9XG4gICAgICAgICwgY2hhcnQ6IHsgc2hvdzogdHJ1ZSwgbWlsaXRhcnk6IGZhbHNlLCBhcmVhOiBmYWxzZSB9XG4gICAgICAgICwgc2Vuc29yczogeyBESFQ6IGZhbHNlLCBEUzE4QjIwOiBmYWxzZSwgQk1QOiBmYWxzZSB9XG4gICAgICAgICwgcmVjaXBlOiB7ICduYW1lJzogJycsICdicmV3ZXInOiB7IG5hbWU6ICcnLCAnZW1haWwnOiAnJyB9LCAneWVhc3QnOiBbXSwgJ2hvcHMnOiBbXSwgJ2dyYWlucyc6IFtdLCBzY2FsZTogJ2dyYXZpdHknLCBtZXRob2Q6ICdwYXBhemlhbicsICdvZyc6IDEuMDUwLCAnZmcnOiAxLjAxMCwgJ2Fidic6IDAsICdhYncnOiAwLCAnY2Fsb3JpZXMnOiAwLCAnYXR0ZW51YXRpb24nOiAwIH1cbiAgICAgICAgLCBub3RpZmljYXRpb25zOiB7IG9uOiB0cnVlLCB0aW1lcnM6IHRydWUsIGhpZ2g6IHRydWUsIGxvdzogdHJ1ZSwgdGFyZ2V0OiB0cnVlLCBzbGFjazogJycsIGxhc3Q6ICcnIH1cbiAgICAgICAgLCBzb3VuZHM6IHsgb246IHRydWUsIGFsZXJ0OiAnL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsIHRpbWVyOiAnL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJyB9XG4gICAgICAgICwgYXJkdWlub3M6IFt7IGlkOiAnbG9jYWwtJyArIGJ0b2EoJ2JyZXdiZW5jaCcpLCBib2FyZDogJycsIFJTU0k6IGZhbHNlLCB1cmw6ICdhcmR1aW5vLmxvY2FsJywgYW5hbG9nOiA1LCBkaWdpdGFsOiAxMywgYWRjOiAwLCBzZWN1cmU6IGZhbHNlLCB2ZXJzaW9uOiAnJywgc3RhdHVzOiB7IGVycm9yOiAnJywgZHQ6ICcnLCBtZXNzYWdlOiAnJyB9LCBpbmZvOiB7fSB9XVxuICAgICAgICAsIHRwbGluazogeyB1c2VyOiAnJywgcGFzczogJycsIHRva2VuOiAnJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdIH1cbiAgICAgICAgLCBpZnR0dDogeyB1cmw6ICcnLCBtZXRob2Q6ICdHRVQnLCBhdXRoOiB7IGtleTogJycsIHZhbHVlOiAnJyB9LCBzdGF0dXM6ICcnIH1cbiAgICAgICAgLCBpbmZsdXhkYjogeyB1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczogW10sIHN0YXR1czogJycgfVxuICAgICAgICAsIGFwcDogeyBlbWFpbDogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5hbWU6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDEyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMzMnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQ0NCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ1NvaWxNb2lzdHVyZScsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIHZjYzogdHJ1ZSwgcGVyY2VudDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdCTVAxODAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDI4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidUZW1wJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J3NlZWRsaW5nJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1BsYW50JywndHlwZSc6J2Nhbm5hYmlzJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoQm9vbGVhbihhcmR1aW5vLnNlY3VyZSkpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgaXNFU1A6IGZ1bmN0aW9uKGFyZHVpbm8sIHJldHVybl92ZXJzaW9uKXtcbiAgICAgIGlmKHJldHVybl92ZXJzaW9uKXtcbiAgICAgICAgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzMyJykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnMzInO1xuICAgICAgICBlbHNlIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCc4MjY2JykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnODI2Nic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gQm9vbGVhbihhcmR1aW5vICYmIGFyZHVpbm8uYm9hcmQgJiYgKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdlc3AnKSAhPT0gLTEgfHwgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ25vZGVtY3UnKSAhPT0gLTEpKTtcbiAgICB9LFxuICBcbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykgKyAnL2FyZHVpbm8vJyArIGVuZHBvaW50O1xuICAgICAgLy8gZXh0ZW5kZWQgaW5mb1xuICAgICAgaWYgKGVuZHBvaW50ID09ICdpbmZvLWV4dCcpXG4gICAgICAgIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pICsgJy9pbmZvJztcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDApXG4gICAgICAgICAgdXJsICs9ICc/YXBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHVybCArPSAnP2RwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAudmNjKSAmJiBbJzNWJywnNVYnXS5pbmRleE9mKGtldHRsZS50ZW1wLnZjYykgPT09IC0xKSAvL1NvaWxNb2lzdHVyZSBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmRwaW49JytrZXR0bGUudGVtcC52Y2M7XG4gICAgICAgIGVsc2UgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5pbmRleCkpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLnZjYykgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcbiAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9hcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgaWZ0dHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZzogKGRhdGEpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciBoZWFkZXJzID0geyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0LmF1dGgua2V5ICYmIHNldHRpbmdzLmlmdHR0LmF1dGgudmFsdWUpIHtcbiAgICAgICAgICAgIGhlYWRlcnNbc2V0dGluZ3MuaWZ0dHQuYXV0aC5rZXldID0gc2V0dGluZ3MuaWZ0dHQuYXV0aC52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGh0dHAgPSB7XG4gICAgICAgICAgICB1cmw6IHNldHRpbmdzLmlmdHR0LnVybCxcbiAgICAgICAgICAgIG1ldGhvZDogc2V0dGluZ3MuaWZ0dHQubWV0aG9kLFxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0Lm1ldGhvZCA9PSAnR0VUJylcbiAgICAgICAgICAgIGh0dHAucGFyYW1zID0gZGF0YTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBodHRwLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIHJldHVybiBodHRwO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgZGF0YSA9IHsgJ2JyZXdiZW5jaCc6IHRydWUgfTtcbiAgICAgICAgICB2YXIgaHR0cF9jb25maWcgPSB0aGlzLmlmdHR0KCkuY29uZmlnKGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaHR0cF9jb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ01pc3NpbmcgVVJMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgICRodHRwKGh0dHBfY29uZmlnKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKGBDb25uZWN0aW9uIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIHNlbmQ6IChkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBodHRwX2NvbmZpZyA9IHRoaXMuaWZ0dHQoKS5jb25maWcoZGF0YSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCFodHRwX2NvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnTWlzc2luZyBVUkwnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgJGh0dHAoaHR0cF9jb25maWcpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoYENvbm5lY3Rpb24gc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgYXBwOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHBzOi8vc2Vuc29yLmJyZXdiZW5jaC5jby8nLCBoZWFkZXJzOiB7fSwgdGltZW91dDogMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLmFwcC5hcGlfa2V5ICYmIHNldHRpbmdzLmFwcC5lbWFpbCl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSBgdXNlcnMvJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS0VZJ10gPSBgJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1FTUFJTCddID0gYCR7c2V0dGluZ3MuYXBwLmVtYWlsfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHEucmVqZWN0KFwiVXNlciBub3QgZm91bmRcIik7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwKXtcbiAgICAgICAgIGF2ZXJhZ2UgPSAoYXZlcmFnZSAqICg1LjAgLyA2NTUzNSkpIC8gMC4wMDAxO1xuICAgICAgICAgdmFyIGxuID0gTWF0aC5sb2coYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMKTtcbiAgICAgICAgIHZhciBrZWx2aW4gPSAxIC8gKDAuMDAzMzU0MDE3MCArICgwLjAwMDI1NjE3MjQ0ICogbG4pICsgKDAuMDAwMDAyMTQwMDk0MyAqIGxuICogbG4pICsgKC0wLjAwMDAwMDA3MjQwNTIxOSAqIGxuICogbG4gKiBsbikpO1xuICAgICAgICAgIC8vIGtlbHZpbiB0byBjZWxzaXVzXG4gICAgICAgICByZXR1cm4ga2VsdmluIC0gMjczLjE1O1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgICAgYXZlcmFnZSA9IFNFUklFU1JFU0lTVE9SIC8gYXZlcmFnZTtcblxuICAgICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0IC89IEJDT0VGRklDSUVOVDsgICAgICAgICAgICAgICAgICAgLy8gMS9CICogbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgICAgc3RlaW5oYXJ0IC09IDI3My4xNTtcbiAgICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgICAgfVxuICAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnKXtcbiAgICAgICBpZiAoa2V0dGxlLnRlbXAucmF3ICYmIGtldHRsZS50ZW1wLnJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKGtldHRsZS50ZW1wLnJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKEJvb2xlYW4oc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4oaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogQm9vbGVhbihvcHRpb25zLnNlc3Npb24pLFxuICAgICAgICAgICAgICAgIHRleHQ6IEJvb2xlYW4ob3B0aW9ucy5zZXNzaW9uKSA/IG9wdGlvbnMuc2Vzc2lvbiA6ICcnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBNb25pdG9yJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGU6ICdiYXNpcycsXG4gICAgICAgICAgICAgIGxlZ2VuZDoge1xuICAgICAgICAgICAgICAgIGtleTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlzQXJlYTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIEJvb2xlYW4ob3B0aW9ucy5jaGFydC5hcmVhKSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoQm9vbGVhbihvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24gKHBsYXRvKSB7XG4gICAgICBpZiAoIXBsYXRvKSByZXR1cm4gJyc7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbiAoc2cpIHtcbiAgICAgIGlmICghc2cpIHJldHVybiAnJztcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKS50b0ZpeGVkKDIpOztcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfTkFNRSkpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9EQVRFKSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcykpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCkpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk5BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk9HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NQVgpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQUJWX01JTikpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRVJNRU5UQUJMRVMpKXtcbiAgICAgICAgdmFyIGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uQU1PVU5UKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkhPUFMpKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NSVNDUykpe1xuICAgICAgICB2YXIgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5ZRUFTVFMpKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9