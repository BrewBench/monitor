webpackJsonp([1],{

/***/ 336:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(132);
__webpack_require__(358);
__webpack_require__(560);
__webpack_require__(562);
__webpack_require__(563);
__webpack_require__(564);
module.exports = __webpack_require__(565);


/***/ }),

/***/ 560:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(65);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(169);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(170);

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

/***/ 562:
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
    type: '32',
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
        analog: 11,
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
    if (sketchName.indexOf('ESP') !== -1) sketchName += $scope.esp.type;
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

/***/ 563:
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

/***/ 564:
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

/***/ 565:
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
        arduinos: [{ id: 'local-' + btoa('brewbench'), board: '', RSSI: false, url: 'arduino.local', analog: 11, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '', message: '' }, info: {} }],
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
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 11, digital: 13, adc: 0, secure: false },
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
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 11, digital: 13, adc: 0, secure: false },
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
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 11, digital: 13, adc: 0, secure: false },
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
      if (!arduino.board) return false;
      if (return_version) {
        if (arduino.board.toLowerCase().indexOf('32') !== -1 || arduino.board.toLowerCase().indexOf('m5stick_c') !== -1) return '32';else if (arduino.board.toLowerCase().indexOf('8266') !== -1) return '8266';else return false;
      }
      return Boolean(arduino && arduino.board && (arduino.board.toLowerCase().indexOf('esp') !== -1 || arduino.board.toLowerCase().indexOf('nodemcu') !== -1 || arduino.board.toLowerCase().indexOf('node32s') !== -1 || arduino.board.toLowerCase().indexOf('m5stick_c') !== -1));
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
          url += '&dpin=' + kettle.temp.vcc;else if (kettle.temp.index && !isNaN(kettle.temp.index)) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
      } else {
        if (Boolean(kettle.temp.vcc) && ['3V', '5V'].indexOf(kettle.temp.vcc) === -1) //SoilMoisture logic
          url += kettle.temp.vcc;else if (kettle.temp.index && !isNaN(kettle.temp.index)) //DS18B20 logic
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

},[336]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiYW5ndWxhciIsIm1vZHVsZSIsImNvbmZpZyIsIiRzdGF0ZVByb3ZpZGVyIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGh0dHBQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiJGNvbXBpbGVQcm92aWRlciIsImRlZmF1bHRzIiwidXNlWERvbWFpbiIsImhlYWRlcnMiLCJjb21tb24iLCJoYXNoUHJlZml4IiwiYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QiLCJzdGF0ZSIsInVybCIsInRlbXBsYXRlVXJsIiwiY29udHJvbGxlciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwibW9kYWxJbmZvIiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJvcGVuSW5mb01vZGFsIiwiYXJkdWlubyIsIiQiLCJtb2RhbCIsInJlcGxhY2VLZXR0bGVzV2l0aFBpbnMiLCJpbmZvIiwicGlucyIsImxlbmd0aCIsIl8iLCJlYWNoIiwicHVzaCIsInBpbiIsImlkIiwic3RpY2t5IiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJpbmRleCIsImFkYyIsImhpdCIsImlmdHR0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwidmVyc2lvbiIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJmaWx0ZXIiLCJpdGVtIiwic3JtIiwiaGV4Iiwic2V0dGluZ3MiLCJyZXNldCIsImFwcCIsImVtYWlsIiwiYXBpX2tleSIsInN0YXR1cyIsImdlbmVyYWwiLCJjaGFydE9wdGlvbnMiLCJ1bml0IiwiY2hhcnQiLCJkZWZhdWx0S2V0dGxlcyIsIm9wZW5Ta2V0Y2hlcyIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwiY2hhbmdlQXJkdWlubyIsImFyZHVpbm9zIiwiaXNFU1AiLCJhbmFsb2ciLCJkaWdpdGFsIiwidG91Y2giLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFkZCIsInRvb2x0aXAiLCJub3ciLCJEYXRlIiwiYnRvYSIsImJvYXJkIiwiUlNTSSIsInNlY3VyZSIsImR0IiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwiY29ubmVjdCIsInRoZW4iLCJCcmV3QmVuY2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsInVzZXIiLCJwYXNzIiwidG9rZW4iLCJwbHVncyIsImxvZ2luIiwicmVzcG9uc2UiLCJzY2FuIiwiZXJyb3JfY29kZSIsIm1zZyIsInNldEVycm9yTWVzc2FnZSIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiYXV0aCIsImtleSIsImFkZEtldHRsZSIsImZpbmQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwiaGVhdElzT24iLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiYXJkdWlub0lkIiwiY2hhbmdlU2Vuc29yIiwic2Vuc29yVHlwZXMiLCJwZXJjZW50IiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJjb25zb2xlIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImJyZXdlciIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJ0ZXh0Iiwic2hvdyIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidHJ1c3RBc0h0bWwiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJzaGlmdCIsImFsdGl0dWRlIiwicHJlc3N1cmUiLCJjbzJfcHBtIiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwic3ViVGV4dCIsImNvbG9yIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhlYXRTYWZldHkiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJvbiIsIk1hdGgiLCJyb3VuZCIsIm9mZiIsImltcG9ydFNldHRpbmdzIiwicHJvZmlsZUNvbnRlbnQiLCJleHBvcnRTZXR0aW5ncyIsImkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjb21waWxlU2tldGNoIiwic2tldGNoTmFtZSIsInNlbnNvcnMiLCJza2V0Y2hlcyIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImFjdGlvbnMiLCJ0cmlnZ2VycyIsImJmIiwiREhUIiwiRFMxOEIyMCIsIkJNUCIsImtldHRsZVR5cGUiLCJ1bnNoaWZ0IiwiYSIsInRvTG93ZXJDYXNlIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsIm5vdGlmaWNhdGlvbnMiLCJtZDUiLCJ0cmltIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiVEhDIiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJsb3ciLCJoaWdoIiwibGFzdCIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsImFsZXJ0IiwicGxheSIsImNsb3NlIiwiTm90aWZpY2F0aW9uIiwicGVybWlzc2lvbiIsInJlcXVlc3RQZXJtaXNzaW9uIiwic2VuZCIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsImNoYW5nZVVuaXRzIiwidiIsInRpbWVyUnVuIiwibmV4dFRpbWVyIiwiY2FuY2VsIiwiaW50ZXJ2YWwiLCJwcm9jZXNzVGVtcHMiLCJhbGxTZW5zb3JzIiwicG9sbFNlY29uZHMiLCJyZW1vdmVLZXR0bGUiLCIkaW5kZXgiLCJjb25maXJtIiwiY2xlYXJLZXR0bGUiLCJjaGFuZ2VWYWx1ZSIsImZpZWxkIiwibG9hZGVkIiwidXBkYXRlTG9jYWwiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJjaGFuZ2UiLCJlbnRlciIsInBsYWNlaG9sZGVyIiwidGVtcGxhdGUiLCJsaW5rIiwiYXR0cnMiLCJlZGl0IiwiYmluZCIsIiRhcHBseSIsImNoYXJDb2RlIiwia2V5Q29kZSIsIm5nRW50ZXIiLCIkcGFyc2UiLCJmbiIsIm9uUmVhZEZpbGUiLCJvbkNoYW5nZUV2ZW50IiwicmVhZGVyIiwiRmlsZVJlYWRlciIsImZpbGUiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImRlYnVnIiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJlbmFibGVkIiwiZm9udCIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0IiwicGFzc3dvcmQiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJBdXRob3JpemF0aW9uIiwiZGlnaXRhbFJlYWQiLCJwYXJhbXMiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsImh0dHAiLCJodHRwX2NvbmZpZyIsInN1Y2Nlc3MiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsImxuIiwibG9nIiwia2VsdmluIiwic3RlaW5oYXJ0IiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwic2Vzc2lvbiIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQUEsa0JBQVFDLE1BQVIsQ0FBZSxtQkFBZixFQUFvQyxDQUNsQyxXQURrQyxFQUVqQyxNQUZpQyxFQUdqQyxTQUhpQyxFQUlqQyxVQUppQyxFQUtqQyxTQUxpQyxFQU1qQyxVQU5pQyxDQUFwQyxFQVFDQyxNQVJELENBUVEsVUFBU0MsY0FBVCxFQUF5QkMsa0JBQXpCLEVBQTZDQyxhQUE3QyxFQUE0REMsaUJBQTVELEVBQStFQyxnQkFBL0UsRUFBaUc7O0FBRXZHRixnQkFBY0csUUFBZCxDQUF1QkMsVUFBdkIsR0FBb0MsSUFBcEM7QUFD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QUYsQ0FBT2lpQixTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRNWYsT0FBUixDQUFnQmdnQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUTdmLE9BQVIsQ0FBZ0JvVixPQUFPNkssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUE1L0NJLEdBQVA7QUE4L0NELENBamdERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyelNsaWRlcidcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsO1xudmFyIHJlc2V0Q2hhcnQgPSAxMDA7XG52YXIgdGltZW91dCA9IG51bGw7IC8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5CcmV3U2VydmljZSA9IEJyZXdTZXJ2aWNlO1xuJHNjb3BlLnNpdGUgPSB7aHR0cHM6IEJvb2xlYW4oZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnMzInLFxuICBzc2lkOiAnJyxcbiAgc3NpZF9wYXNzOiAnJyxcbiAgaG9zdG5hbWU6ICdiYmVzcCcsXG4gIGFyZHVpbm9fcGFzczogJ2JiYWRtaW4nLFxuICBhdXRvY29ubmVjdDogZmFsc2UgIFxufTtcbiRzY29wZS5tb2RhbEluZm8gPSB7fTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5vcGVuSW5mb01vZGFsID0gZnVuY3Rpb24gKGFyZHVpbm8pIHtcbiAgJHNjb3BlLm1vZGFsSW5mbyA9IGFyZHVpbm87XG4gICQoJyNhcmR1aW5vLWluZm8nKS5tb2RhbCgndG9nZ2xlJyk7ICBcbn07XG4gIFxuJHNjb3BlLnJlcGxhY2VLZXR0bGVzV2l0aFBpbnMgPSBmdW5jdGlvbiAoYXJkdWlubykge1xuICBpZiAoYXJkdWluby5pbmZvICYmIGFyZHVpbm8uaW5mby5waW5zICYmIGFyZHVpbm8uaW5mby5waW5zLmxlbmd0aCkge1xuICAgICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgXy5lYWNoKGFyZHVpbm8uaW5mby5waW5zLCBwaW4gPT4ge1xuICAgICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHBpbi5uYW1lXG4gICAgICAgICwgaWQ6IG51bGxcbiAgICAgICAgLCB0eXBlOiAkc2NvcGUua2V0dGxlVHlwZXNbNF0udHlwZVxuICAgICAgICAsIGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLCBzdGlja3k6IGZhbHNlXG4gICAgICAgICwgaGVhdGVyOiB7IHBpbjogJ0Q2JywgcnVubmluZzogZmFsc2UsIGF1dG86IGZhbHNlLCBwd206IGZhbHNlLCBkdXR5Q3ljbGU6IDEwMCwgc2tldGNoOiBmYWxzZSB9XG4gICAgICAgICwgcHVtcDogeyBwaW46ICdENycsIHJ1bm5pbmc6IGZhbHNlLCBhdXRvOiBmYWxzZSwgcHdtOiBmYWxzZSwgZHV0eUN5Y2xlOiAxMDAsIHNrZXRjaDogZmFsc2UgfVxuICAgICAgICAsIHRlbXA6IHsgcGluOiBwaW4ucGluLCB2Y2M6ICcnLCBpbmRleDogJycsIHR5cGU6IHBpbi50eXBlLCBhZGM6IGZhbHNlLCBoaXQ6IGZhbHNlLCBpZnR0dDogZmFsc2UsIGN1cnJlbnQ6IDAsIG1lYXN1cmVkOiAwLCBwcmV2aW91czogMCwgYWRqdXN0OiAwLCB0YXJnZXQ6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS50YXJnZXQsIGRpZmY6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS5kaWZmLCByYXc6IDAsIHZvbHRzOiAwIH1cbiAgICAgICAgLCB2YWx1ZXM6IFtdXG4gICAgICAgICwgdGltZXJzOiBbXVxuICAgICAgICAsIGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSwgeyB2YWx1ZTogMCwgbWluOiAwLCBtYXg6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS50YXJnZXQgKyAkc2NvcGUua2V0dGxlVHlwZXNbNF0uZGlmZiB9KVxuICAgICAgICAsIGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLCBtZXNzYWdlOiB7IHR5cGU6ICdlcnJvcicsIG1lc3NhZ2U6ICcnLCB2ZXJzaW9uOiAnJywgY291bnQ6IDAsIGxvY2F0aW9uOiAnJyB9XG4gICAgICAgICwgbm90aWZ5OiB7IHNsYWNrOiBmYWxzZSB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufTtcbiAgXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYobC5sZW5ndGgpXG4gICAgcmV0dXJuIGxbbC5sZW5ndGgtMV0uaGV4O1xuICByZXR1cm4gJyc7XG59O1xuXG4vL2RlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4kc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnKSB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuaWYgKCEkc2NvcGUuc2V0dGluZ3MuYXBwKVxuICAkc2NvcGUuc2V0dGluZ3MuYXBwID0geyBlbWFpbDogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnIH07XG4vLyBnZW5lcmFsIGNoZWNrIGFuZCB1cGRhdGVcbmlmKCEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbClcbiAgcmV0dXJuICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0fSk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcblxuJHNjb3BlLm9wZW5Ta2V0Y2hlcyA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzZXR0aW5nc01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgJCgnI3NrZXRjaGVzTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59O1xuXG4kc2NvcGUuY2hhbmdlQXJkdWlubyA9IGZ1bmN0aW9uIChrZXR0bGUpIHtcbiAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgfVxufTtcbi8vIGNoZWNrIGtldHRsZSB0eXBlIHBvcnRzXG5fLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnMzInKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLnRvdWNoID0gWzQsMCwyLDE1LDEzLDEyLDE0LDI3LDMzLDMyXTtcbiAgfSBlbHNlIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMTY7XG4gIH1cbn0pO1xuICBcbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGJvYXJkOiAnJyxcbiAgICAgICAgUlNTSTogZmFsc2UsXG4gICAgICAgIGFuYWxvZzogMTEsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHsgZXJyb3I6ICcnLCBkdDogJycsIG1lc3NhZ2U6ICcnIH0sXG4gICAgICAgIGluZm86IHt9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mbycpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5CcmV3QmVuY2gpe1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDAgfHwgYXJkdWluby5ib2FyZC5pbmRleE9mKCdOb2RlTUNVXzMyUycpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0dldHRpbmcgSW5mby4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvLWV4dCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IGluZm87XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IHt9O1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5wa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAncmVib290JylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gJyc7XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3QgU3VjY2VzcywgdHJ5IGNvbm5lY3RpbmcgaW4gYSBmZXcgc2Vjb25kcy4nO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYocGtnLnZlcnNpb24gPCA0LjIpXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ1VwZ3JhZGUgdG8gc3VwcG9ydCByZWJvb3QnO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBjbGVhcjogKCkgPT4geyBcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsgPSB7IHVzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46ICcnLCBzdGF0dXM6ICcnLCBwbHVnczogW10gfTtcbiAgICB9LFxuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9IGVsc2UgaWYocmVzcG9uc2UuZXJyb3JfY29kZSAmJiByZXNwb25zZS5tc2cpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShyZXNwb25zZS5tc2cpOyAgXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4ocGx1Zy5zdGF0dXMpKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaWZ0dHQgPSB7XG4gICAgY2xlYXI6ICgpID0+IHsgXG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQgPSB7IHVybDogJycsIG1ldGhvZDogJ0dFVCcsIGF1dGg6IHsga2V5OiAnJywgdmFsdWU6ICcnIH0sIHN0YXR1czogJycgfTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLmNvbm5lY3QoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gIH07XG4gIFxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG4gIFxuICAkc2NvcGUuaGVhdElzT24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydoZWF0ZXInOiB7J3J1bm5pbmcnOiB0cnVlfX0pLmxlbmd0aCk7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihhcmR1aW5vLCBwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZSBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vKSl7XG4gICAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8sIHRydWUpID09ICc4MjY2JylcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0EnLCdHUElPJykucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwaW47XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYXBwID0ge1xuICAgIGNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpICYmXG4gICAgICAgIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmFwcC5hcGlfa2V5KSAmJlxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwID0gZGVmYXVsdFNldHRpbmdzLmFwcDtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgIGlmKCFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpIHx8ICFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFwcCgpLmF1dGgoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZihCb29sZWFuKGZvcm1hdHRlZF9jb250ZW50KSl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZihCb29sZWFuKGpzb25PYmouUmVjaXBlcykgJiYgQm9vbGVhbihqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZihCb29sZWFuKGpzb25PYmouU2VsZWN0aW9ucykgJiYgQm9vbGVhbihqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoQm9vbGVhbihqc29uT2JqLlJFQ0lQRVMpICYmIEJvb2xlYW4oanNvbk9iai5SRUNJUEVTLlJFQ0lQRSkpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5vZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5mZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoe1xuICAgICAgYW5pbWF0ZWQ6ICdmYWRlJyxcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIGh0bWw6IHRydWVcbiAgICB9KTtcbiAgICBpZigkKCcjZ2l0Y29tbWl0IGEnKS50ZXh0KCkgIT0gJ2dpdF9jb21taXQnKXtcbiAgICAgICQoJyNnaXRjb21taXQnKS5zaG93KCk7XG4gICAgfVxuICAgIFxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGltZXJzKSAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24peyAgICBcbiAgICAgIHZhciBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4oZXJyLnN0YXR1c1RleHQpKVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKG1lc3NhZ2UpKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICBcbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5jdXJyZW50KSlcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLCAyKTtcbiAgICBcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpLCAwKTsgICAgXG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmIChrZXR0bGUudGVtcC50eXBlICE9ICdCTVAxODAnICYmXG4gICAgICBrZXR0bGUudGVtcC50eXBlICE9ICdCTVAyODAnICYmXG4gICAgICAha2V0dGxlLnRlbXAudm9sdHMgJiZcbiAgICAgICFrZXR0bGUudGVtcC5yYXcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnICYmXG4gICAgICByZXNwb25zZS50ZW1wID09IC0xMjcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHkgYXMgYSBwZXJjZW50XG4gICAgLy9Tb2lsTW9pc3R1cmVEIGhhcyBtb2lzdHVyZSBhcyBhIHBlcmNlbnRcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnBlcmNlbnQsMCk7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuY28yX3BwbSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5jbzJfcHBtID0gcmVzcG9uc2UuY28yX3BwbTtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZSwgc2tldGNoX3ZlcnNpb246cmVzcG9uc2Uuc2tldGNoX3ZlcnNpb259KTtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLmF1dG8gJiYgIWtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSkudGhlbihoZWF0aW5nID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDIwMCw0Nyw0NywxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYgIWtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB3aXRoaW4gdGFyZ2V0IVxuICAgICAga2V0dGxlLnRlbXAuaGl0PW5ldyBEYXRlKCk7Ly9zZXQgdGhlIHRpbWUgdGhlIHRhcmdldCB3YXMgaGl0IHNvIHdlIGNhbiBub3cgc3RhcnQgYWxlcnRzXG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoLWFsdCcpKSBidG4gPSBidG4ucGFyZW50KCk7XG5cbiAgICBpZighYnRuLmhhc0NsYXNzKCdidG4tZGFuZ2VyJykpe1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tbGlnaHQnKS5hZGRDbGFzcygnYnRuLWRhbmdlcicpO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAgfSwyMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVBXTSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUucHdtID0gIWtldHRsZS5wd207XG4gICAgICBpZihrZXR0bGUucHdtKVxuICAgICAgICBrZXR0bGUuc3NyID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlS2V0dGxlID0gZnVuY3Rpb24oaXRlbSwga2V0dGxlKXtcblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgdmFyIGs7XG4gICAgdmFyIGhlYXRJc09uID0gJHNjb3BlLmhlYXRJc09uKCk7XG4gICAgXG4gICAgc3dpdGNoIChpdGVtKSB7XG4gICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgayA9IGtldHRsZS5oZWF0ZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgIGsgPSBrZXR0bGUuY29vbGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICBrID0ga2V0dGxlLnB1bXA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmKCFrKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYoIWsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgaWYgKGl0ZW0gPT0gJ2hlYXQnICYmICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLmhlYXRTYWZldHkgJiYgaGVhdElzT24pIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnQSBoZWF0ZXIgaXMgYWxyZWFkeSBydW5uaW5nLicsIGtldHRsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoay5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aGUgcmVsYXlcbiAgICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5oYXNTa2V0Y2hlcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgdmFyIGhhc0FTa2V0Y2ggPSBmYWxzZTtcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHxcbiAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc2xhY2tcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMpXG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycyA9IHt9O1xuICAgIC8vIGFwcGVuZCBlc3AgdHlwZVxuICAgIGlmKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xKVxuICAgICAgc2tldGNoTmFtZSArPSAkc2NvcGUuZXNwLnR5cGU7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vID8ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpIDogJ0RlZmF1bHQnO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6IGFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIHR5cGU6IHNrZXRjaE5hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgcGluczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlLFxuICAgICAgICAgIGJmOiAoc2tldGNoTmFtZS5pbmRleE9mKCdCRicpICE9PSAtMSkgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiBCb29sZWFuKGtldHRsZS50ZW1wLmFkanVzdCkpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiYgJHNjb3BlLmVzcC5hdXRvY29ubmVjdCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QXV0b0Nvbm5lY3QuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKChza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSB8fCBCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykpICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYmVlZ2VlLXRva3lvL0RIVGVzcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKTtcbiAgICAgIH0gZWxzZSBpZighQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5EUzE4QjIwIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPE9uZVdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAxODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAyODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMjgwLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMjgwLmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhlIGFjdGlvbnMgY29tbWFuZFxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYgKGtldHRsZS50ZW1wLnZjYylcbiAgICAgICAga2V0dGxlVHlwZSArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICBcbiAgICAgIGlmIChrZXR0bGUudGVtcC5pbmRleCkga2V0dGxlVHlwZSArPSAnLScgKyBrZXR0bGUudGVtcC5pbmRleDsgICAgICBcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTtcbiAgICAgIC8vIHVzZWQgZm9yIGluZm8gZW5kcG9pbnRcbiAgICAgIGlmIChjdXJyZW50U2tldGNoLnBpbnMubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gucGlucy5wdXNoKCcgcGlucyArPSBcIiwge1xcXFxcIm5hbWVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInICsga2V0dGxlLm5hbWUgKyAnXCIpICsgXCJcXFxcXCIsXFxcXFwicGluXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGtldHRsZS50ZW1wLnBpbiArICdcIikgKyBcIlxcXFxcIixcXFxcXCJ0eXBlXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGtldHRsZVR5cGUgKyAnXCIpICsgXCJcXFxcXCIsXFxcXFwiYWRqdXN0XFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGFkanVzdCArICdcIikgKyBcIlxcXFxcIn1cIjsnKTsgICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudFNrZXRjaC5waW5zLnB1c2goJyBwaW5zICs9IFwie1xcXFxcIm5hbWVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS5uYW1lKydcIikgKyBcIlxcXFxcIixcXFxcXCJwaW5cXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpICsgXCJcXFxcXCIsXFxcXFwidHlwZVxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicra2V0dGxlVHlwZSsnXCIpICsgXCJcXFxcXCIsXFxcXFwiYWRqdXN0XFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJythZGp1c3QrJ1wiKSArIFwiXFxcXFwifVwiOycpOyAgICAgICAgXG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEgJiYga2V0dGxlLnBlcmNlbnQpIHtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc1BlcmNlbnRDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKyctSHVtaWRpdHlcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpOyAgICAgICAgXG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrQm9vbGVhbihrZXR0bGUubm90aWZ5LnNsYWNrKSsnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrQm9vbGVhbihrZXR0bGUubm90aWZ5LnNsYWNrKSsnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmIChza2V0Y2gudHJpZ2dlcnMgfHwgc2tldGNoLmJmKSB7XG4gICAgICAgIGlmIChza2V0Y2gudHlwZS5pbmRleE9mKCdNNScpID09PSAtMSkge1xuICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpO1xuICAgICAgICAgIGlmIChza2V0Y2guYmYpIHtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGFtYmllbnQgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgaHVtaWRpdHkgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnY29uc3QgU3RyaW5nIGVxdWlwbWVudF9uYW1lID0gXCInKyRzY29wZS5zZXR0aW5ncy5iZi5uYW1lKydcIjsnKTsgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZCBcbiAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodW1pZGl0eScpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcsICdodW1pZGl0eSA9IGFjdGlvbnNQZXJjZW50Q29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2FtYmllbnQnKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICdhbWJpZW50ID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gQWxsIG90aGVyIGxvZ2ljXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gucGlucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaCcrc2tldGNoTmFtZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZG93bmxvYWRTa2V0Y2gobmFtZSwgYWN0aW9ucywgcGlucywgaGFzVHJpZ2dlcnMsIGhlYWRlcnMsIHNrZXRjaCl7XG4gICAgLy8gdHAgbGluayBjb25uZWN0aW9uXG4gICAgdmFyIHRwbGlua19jb25uZWN0aW9uX3N0cmluZyA9IEJyZXdTZXJ2aWNlLnRwbGluaygpLmNvbm5lY3Rpb24oKTtcbiAgICB2YXIgYXV0b2dlbiA9ICcvKlxcblNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jb1xcblZlcnNpb24gJyskc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKycgJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJ1xcbiovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtBQ1RJT05TXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbUElOU10nLCBwaW5zLmxlbmd0aCA/IHBpbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignQXBwJyApICE9PSAtMSl7XG4gICAgICAgICAgLy8gYXBwIGNvbm5lY3Rpb25cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUFBfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdCRll1bicgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGJmIGFwaSBrZXkgaGVhZGVyXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQkZfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5iZi5hcGlfa2V5LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZiggQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgIGlmIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyKSAmJiBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKSlcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYDtcbiAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5USEMpIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gVEhDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDI4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLScrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnKyRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiBCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICBpZihCb29sZWFuKHRpbWVyKSl7IC8va2V0dGxlIGlzIGEgdGltZXIgb2JqZWN0XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGltZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZih0aW1lci51cClcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHRpbWVycyBhcmUgZG9uZSc7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4odGltZXIubm90ZXMpKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZihCb29sZWFuKHRpbWVyKSAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKEJvb2xlYW4odGltZXIpKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgbWVhc3VyZWQgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayAmJiAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBJRlRUVCBOb3RpZmljYXRpb25cbiAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLmlmdHR0KSAmJiAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQudXJsICYmICRzY29wZS5zZXR0aW5ncy5pZnR0dC51cmwuaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLmlmdHR0KCkuc2VuZCh7XG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcjogY29sb3IsICAgICBcbiAgICAgICAgICB1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LFxuICAgICAgICAgIG5hbWU6IGtldHRsZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IGtldHRsZS50eXBlLFxuICAgICAgICAgIHRlbXA6IGtldHRsZS50ZW1wLFxuICAgICAgICAgIGhlYXRlcjoga2V0dGxlLmhlYXRlcixcbiAgICAgICAgICBwdW1wOiBrZXR0bGUucHVtcCxcbiAgICAgICAgICBjb29sZXI6IGtldHRsZS5jb29sZXIgfHwge30sXG4gICAgICAgICAgYXJkdWlubzoga2V0dGxlLmFyZHVpbm8gICAgICAgICAgXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHNlbmRpbmcgdG8gSUZUVFQgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgc2VuZGluZyB0byBJRlRUVCAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgJiYga2V0dGxlLm1lc3NhZ2UudHlwZSA9PSAnZGFuZ2VyJyl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAudGFyZ2V0KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuY3VycmVudCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAubWVhc3VyZWQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnByZXZpb3VzLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLnRhcmdldCwwKTtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5hZGp1c3QpKXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnR9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCBCb29sZWFuKGtldHRsZSkgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlKSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbiAoa2V0dGxlLCAkaW5kZXgpIHsgICAgXG4gICAgaWYoY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlbW92ZSB0aGlzIGtldHRsZT8nKSlcbiAgICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG4gIFxuICAkc2NvcGUuY2xlYXJLZXR0bGUgPSBmdW5jdGlvbiAoa2V0dGxlLCAkaW5kZXgpIHtcbiAgICAkc2NvcGUua2V0dGxlc1skaW5kZXhdLnZhbHVlcyA9IFtdO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIGlmKGZpZWxkID09ICdhZGp1c3QnKXtcbiAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIH1cblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoQm9vbGVhbihsb2FkZWQpKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcblxuICAvLyB1cGRhdGUgbG9jYWwgY2FjaGVcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsID0gZnVuY3Rpb24gKCkge1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsICRzY29wZS5rZXR0bGVzKTtcbiAgICAgICRzY29wZS51cGRhdGVMb2NhbCgpO1xuICAgIH0sIDUwMDApO1xuICB9O1xuICBcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSBCb29sZWFuKHNjb3BlLnR5cGUpID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHQgICAgfSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICBjZWxzaXVzID0gcGFyc2VGbG9hdChjZWxzaXVzKTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKShjZWxzaXVzKjkvNSszMiwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgZmFocmVuaGVpdCA9IHBhcnNlRmxvYXQoZmFocmVuaGVpdCk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoKGZhaHJlbmhlaXQtMzIpKjUvOSwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdyb3VuZCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbCxkZWNpbWFscykge1xuICAgIHJldHVybiBOdW1iZXIoKE1hdGgucm91bmQodmFsICsgXCJlXCIgKyBkZWNpbWFscykgICsgXCJlLVwiICsgZGVjaW1hbHMpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0aXRsZWNhc2UnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQpe1xuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRleHQuc2xpY2UoMSkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2RibVBlcmNlbnQnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRibSl7XG4gICAgcmV0dXJuIDIgKiAoZGJtICsgMTAwKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMzUuMjc0LCAyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMi4yMDQ2MiwgMik7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZ2VuZXJhbDogeyBkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBoZWF0U2FmZXR5OiBmYWxzZSB9XG4gICAgICAgICwgY2hhcnQ6IHsgc2hvdzogdHJ1ZSwgbWlsaXRhcnk6IGZhbHNlLCBhcmVhOiBmYWxzZSB9XG4gICAgICAgICwgc2Vuc29yczogeyBESFQ6IGZhbHNlLCBEUzE4QjIwOiBmYWxzZSwgQk1QOiBmYWxzZSB9XG4gICAgICAgICwgcmVjaXBlOiB7ICduYW1lJzogJycsICdicmV3ZXInOiB7IG5hbWU6ICcnLCAnZW1haWwnOiAnJyB9LCAneWVhc3QnOiBbXSwgJ2hvcHMnOiBbXSwgJ2dyYWlucyc6IFtdLCBzY2FsZTogJ2dyYXZpdHknLCBtZXRob2Q6ICdwYXBhemlhbicsICdvZyc6IDEuMDUwLCAnZmcnOiAxLjAxMCwgJ2Fidic6IDAsICdhYncnOiAwLCAnY2Fsb3JpZXMnOiAwLCAnYXR0ZW51YXRpb24nOiAwIH1cbiAgICAgICAgLCBub3RpZmljYXRpb25zOiB7IG9uOiB0cnVlLCB0aW1lcnM6IHRydWUsIGhpZ2g6IHRydWUsIGxvdzogdHJ1ZSwgdGFyZ2V0OiB0cnVlLCBzbGFjazogJycsIGxhc3Q6ICcnIH1cbiAgICAgICAgLCBzb3VuZHM6IHsgb246IHRydWUsIGFsZXJ0OiAnL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsIHRpbWVyOiAnL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJyB9XG4gICAgICAgICwgYXJkdWlub3M6IFt7IGlkOiAnbG9jYWwtJyArIGJ0b2EoJ2JyZXdiZW5jaCcpLCBib2FyZDogJycsIFJTU0k6IGZhbHNlLCB1cmw6ICdhcmR1aW5vLmxvY2FsJywgYW5hbG9nOiAxMSwgZGlnaXRhbDogMTMsIGFkYzogMCwgc2VjdXJlOiBmYWxzZSwgdmVyc2lvbjogJycsIHN0YXR1czogeyBlcnJvcjogJycsIGR0OiAnJywgbWVzc2FnZTogJycgfSwgaW5mbzoge30gfV1cbiAgICAgICAgLCB0cGxpbms6IHsgdXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjogJycsIHN0YXR1czogJycsIHBsdWdzOiBbXSB9XG4gICAgICAgICwgaWZ0dHQ6IHsgdXJsOiAnJywgbWV0aG9kOiAnR0VUJywgYXV0aDogeyBrZXk6ICcnLCB2YWx1ZTogJycgfSwgc3RhdHVzOiAnJyB9XG4gICAgICAgICwgaW5mbHV4ZGI6IHsgdXJsOiAnJywgcG9ydDogJycsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6IFtdLCBzdGF0dXM6ICcnIH1cbiAgICAgICAgLCBhcHA6IHsgZW1haWw6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJyB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxpZnR0dDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzoxMSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnTWFzaCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2dyYWluJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENCcscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0ExJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxpZnR0dDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzoxMSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6MTEsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMTgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdCTVAyODAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1NIVDNYJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlIH1cbiAgICAgICAgLHtuYW1lOiAnTUgtWjE2JywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlIH0gICAgICAgIFxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1RlbXAnLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1NvaWwnLCd0eXBlJzonc2VlZGxpbmcnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonUGxhbnQnLCd0eXBlJzonY2FubmFiaXMnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZihCb29sZWFuKGFyZHVpbm8uc2VjdXJlKSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBpc0VTUDogZnVuY3Rpb24gKGFyZHVpbm8sIHJldHVybl92ZXJzaW9uKSB7XG4gICAgICBpZiAoIWFyZHVpbm8uYm9hcmQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGlmKHJldHVybl92ZXJzaW9uKXtcbiAgICAgICAgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzMyJykgIT09IC0xIHx8IGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdtNXN0aWNrX2MnKSAhPT0gLTEpXG4gICAgICAgICAgcmV0dXJuICczMic7XG4gICAgICAgIGVsc2UgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzgyNjYnKSAhPT0gLTEpXG4gICAgICAgICAgcmV0dXJuICc4MjY2JztcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBCb29sZWFuKGFyZHVpbm8gJiYgYXJkdWluby5ib2FyZCAmJiAoXG4gICAgICAgICAgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2VzcCcpICE9PSAtMSB8fFxuICAgICAgICAgIGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub2RlbWN1JykgIT09IC0xIHx8XG4gICAgICAgICAgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ25vZGUzMnMnKSAhPT0gLTEgfHxcbiAgICAgICAgICBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbTVzdGlja19jJykgIT09IC0xXG4gICAgICApKTtcbiAgICB9LFxuICBcbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykgKyAnL2FyZHVpbm8vJyArIGVuZHBvaW50O1xuICAgICAgLy8gZXh0ZW5kZWQgaW5mb1xuICAgICAgaWYgKGVuZHBvaW50ID09ICdpbmZvLWV4dCcpXG4gICAgICAgIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pICsgJy9pbmZvJztcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDAgfHwga2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0cnKSA9PT0gMClcbiAgICAgICAgICB1cmwgKz0gJz9hcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdXJsICs9ICc/ZHBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC52Y2MpICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC5pbmRleCAmJiAhaXNOYU4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC52Y2MpICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC5pbmRleCAmJiAhaXNOYU4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcbiAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9hcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgaWZ0dHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZzogKGRhdGEpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciBoZWFkZXJzID0geyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0LmF1dGgua2V5ICYmIHNldHRpbmdzLmlmdHR0LmF1dGgudmFsdWUpIHtcbiAgICAgICAgICAgIGhlYWRlcnNbc2V0dGluZ3MuaWZ0dHQuYXV0aC5rZXldID0gc2V0dGluZ3MuaWZ0dHQuYXV0aC52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGh0dHAgPSB7XG4gICAgICAgICAgICB1cmw6IHNldHRpbmdzLmlmdHR0LnVybCxcbiAgICAgICAgICAgIG1ldGhvZDogc2V0dGluZ3MuaWZ0dHQubWV0aG9kLFxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0Lm1ldGhvZCA9PSAnR0VUJylcbiAgICAgICAgICAgIGh0dHAucGFyYW1zID0gZGF0YTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBodHRwLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIHJldHVybiBodHRwO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgZGF0YSA9IHsgJ2JyZXdiZW5jaCc6IHRydWUgfTtcbiAgICAgICAgICB2YXIgaHR0cF9jb25maWcgPSB0aGlzLmlmdHR0KCkuY29uZmlnKGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaHR0cF9jb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ01pc3NpbmcgVVJMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgICRodHRwKGh0dHBfY29uZmlnKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKGBDb25uZWN0aW9uIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIHNlbmQ6IChkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBodHRwX2NvbmZpZyA9IHRoaXMuaWZ0dHQoKS5jb25maWcoZGF0YSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCFodHRwX2NvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnTWlzc2luZyBVUkwnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgJGh0dHAoaHR0cF9jb25maWcpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoYENvbm5lY3Rpb24gc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgYXBwOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHBzOi8vc2Vuc29yLmJyZXdiZW5jaC5jby8nLCBoZWFkZXJzOiB7fSwgdGltZW91dDogMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLmFwcC5hcGlfa2V5ICYmIHNldHRpbmdzLmFwcC5lbWFpbCl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSBgdXNlcnMvJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS0VZJ10gPSBgJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1FTUFJTCddID0gYCR7c2V0dGluZ3MuYXBwLmVtYWlsfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHEucmVqZWN0KFwiVXNlciBub3QgZm91bmRcIik7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwKXtcbiAgICAgICAgIGF2ZXJhZ2UgPSAoYXZlcmFnZSAqICg1LjAgLyA2NTUzNSkpIC8gMC4wMDAxO1xuICAgICAgICAgdmFyIGxuID0gTWF0aC5sb2coYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMKTtcbiAgICAgICAgIHZhciBrZWx2aW4gPSAxIC8gKDAuMDAzMzU0MDE3MCArICgwLjAwMDI1NjE3MjQ0ICogbG4pICsgKDAuMDAwMDAyMTQwMDk0MyAqIGxuICogbG4pICsgKC0wLjAwMDAwMDA3MjQwNTIxOSAqIGxuICogbG4gKiBsbikpO1xuICAgICAgICAgIC8vIGtlbHZpbiB0byBjZWxzaXVzXG4gICAgICAgICByZXR1cm4ga2VsdmluIC0gMjczLjE1O1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgICAgYXZlcmFnZSA9IFNFUklFU1JFU0lTVE9SIC8gYXZlcmFnZTtcblxuICAgICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0IC89IEJDT0VGRklDSUVOVDsgICAgICAgICAgICAgICAgICAgLy8gMS9CICogbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgICAgc3RlaW5oYXJ0IC09IDI3My4xNTtcbiAgICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgICAgfVxuICAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnKXtcbiAgICAgICBpZiAoa2V0dGxlLnRlbXAucmF3ICYmIGtldHRsZS50ZW1wLnJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKGtldHRsZS50ZW1wLnJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKEJvb2xlYW4oc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4oaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogQm9vbGVhbihvcHRpb25zLnNlc3Npb24pLFxuICAgICAgICAgICAgICAgIHRleHQ6IEJvb2xlYW4ob3B0aW9ucy5zZXNzaW9uKSA/IG9wdGlvbnMuc2Vzc2lvbiA6ICcnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBNb25pdG9yJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGU6ICdiYXNpcycsXG4gICAgICAgICAgICAgIGxlZ2VuZDoge1xuICAgICAgICAgICAgICAgIGtleTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlzQXJlYTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIEJvb2xlYW4ob3B0aW9ucy5jaGFydC5hcmVhKSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoQm9vbGVhbihvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24gKHBsYXRvKSB7XG4gICAgICBpZiAoIXBsYXRvKSByZXR1cm4gJyc7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbiAoc2cpIHtcbiAgICAgIGlmICghc2cpIHJldHVybiAnJztcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKS50b0ZpeGVkKDIpOztcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfTkFNRSkpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9EQVRFKSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcykpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCkpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk5BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk9HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NQVgpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQUJWX01JTikpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRVJNRU5UQUJMRVMpKXtcbiAgICAgICAgdmFyIGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uQU1PVU5UKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkhPUFMpKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NSVNDUykpe1xuICAgICAgICB2YXIgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5ZRUFTVFMpKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9