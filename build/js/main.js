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
    if (typeof response.moisture != 'undefined') {
      kettle.percent = $filter('round')(response.moisture, 0);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiYW5ndWxhciIsIm1vZHVsZSIsImNvbmZpZyIsIiRzdGF0ZVByb3ZpZGVyIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGh0dHBQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiJGNvbXBpbGVQcm92aWRlciIsImRlZmF1bHRzIiwidXNlWERvbWFpbiIsImhlYWRlcnMiLCJjb21tb24iLCJoYXNoUHJlZml4IiwiYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QiLCJzdGF0ZSIsInVybCIsInRlbXBsYXRlVXJsIiwiY29udHJvbGxlciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwibW9kYWxJbmZvIiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJvcGVuSW5mb01vZGFsIiwiYXJkdWlubyIsIiQiLCJtb2RhbCIsInJlcGxhY2VLZXR0bGVzV2l0aFBpbnMiLCJpbmZvIiwicGlucyIsImxlbmd0aCIsIl8iLCJlYWNoIiwicHVzaCIsInBpbiIsImlkIiwic3RpY2t5IiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJpbmRleCIsImFkYyIsImhpdCIsImlmdHR0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwidmVyc2lvbiIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJmaWx0ZXIiLCJpdGVtIiwic3JtIiwiaGV4Iiwic2V0dGluZ3MiLCJyZXNldCIsImFwcCIsImVtYWlsIiwiYXBpX2tleSIsInN0YXR1cyIsImdlbmVyYWwiLCJjaGFydE9wdGlvbnMiLCJ1bml0IiwiY2hhcnQiLCJkZWZhdWx0S2V0dGxlcyIsIm9wZW5Ta2V0Y2hlcyIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwiY2hhbmdlQXJkdWlubyIsImFyZHVpbm9zIiwiaXNFU1AiLCJhbmFsb2ciLCJkaWdpdGFsIiwidG91Y2giLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFkZCIsInRvb2x0aXAiLCJub3ciLCJEYXRlIiwiYnRvYSIsImJvYXJkIiwiUlNTSSIsInNlY3VyZSIsImR0IiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwiY29ubmVjdCIsInRoZW4iLCJCcmV3QmVuY2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsInVzZXIiLCJwYXNzIiwidG9rZW4iLCJwbHVncyIsImxvZ2luIiwicmVzcG9uc2UiLCJzY2FuIiwiZXJyb3JfY29kZSIsIm1zZyIsInNldEVycm9yTWVzc2FnZSIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiYXV0aCIsImtleSIsImFkZEtldHRsZSIsImZpbmQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwiaGVhdElzT24iLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiYXJkdWlub0lkIiwiY2hhbmdlU2Vuc29yIiwic2Vuc29yVHlwZXMiLCJwZXJjZW50IiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJjb25zb2xlIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImJyZXdlciIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJ0ZXh0Iiwic2hvdyIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidHJ1c3RBc0h0bWwiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJzaGlmdCIsIm1vaXN0dXJlIiwiYWx0aXR1ZGUiLCJwcmVzc3VyZSIsImNvMl9wcG0iLCJjdXJyZW50VmFsdWUiLCJ1bml0VHlwZSIsImdldFRpbWUiLCJzdWJUZXh0IiwiY29sb3IiLCJnZXROYXZPZmZzZXQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGVhdFNhZmV0eSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIm9uIiwiTWF0aCIsInJvdW5kIiwib2ZmIiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImNvbXBpbGVTa2V0Y2giLCJza2V0Y2hOYW1lIiwic2Vuc29ycyIsInNrZXRjaGVzIiwiYXJkdWlub05hbWUiLCJjdXJyZW50U2tldGNoIiwiYWN0aW9ucyIsInRyaWdnZXJzIiwiYmYiLCJESFQiLCJEUzE4QjIwIiwiQk1QIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwidG9Mb3dlckNhc2UiLCJkb3dubG9hZFNrZXRjaCIsImhhc1RyaWdnZXJzIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImF1dG9nZW4iLCJnZXQiLCJqb2luIiwibm90aWZpY2F0aW9ucyIsIm1kNSIsInRyaW0iLCJjb25uZWN0aW9uX3N0cmluZyIsInBvcnQiLCJUSEMiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwic3R5bGUiLCJkaXNwbGF5IiwiYm9keSIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmVDaGlsZCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsImxvdyIsImhpZ2giLCJsYXN0IiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJzZW5kIiwidHJhY2tDb2xvciIsImJhckNvbG9yIiwiY2hhbmdlS2V0dGxlVHlwZSIsImtldHRsZUluZGV4IiwiZmluZEluZGV4IiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsInByb2Nlc3NUZW1wcyIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNvbmZpcm0iLCJjbGVhcktldHRsZSIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZSIsInNyY0VsZW1lbnQiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZGJtIiwia2ciLCJpc05hTiIsImZhY3RvcnkiLCJsb2NhbFN0b3JhZ2UiLCJyZW1vdmVJdGVtIiwiZGVidWciLCJtaWxpdGFyeSIsImFyZWEiLCJyZWFkT25seSIsImVuYWJsZWQiLCJmb250IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJzZXRJdGVtIiwiZ2V0SXRlbSIsInJldHVybl92ZXJzaW9uIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJlbmRwb2ludCIsInJlcXVlc3QiLCJwYXNzd29yZCIsIndpdGhDcmVkZW50aWFscyIsInNlbnNvciIsIkF1dGhvcml6YXRpb24iLCJkaWdpdGFsUmVhZCIsInBhcmFtcyIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaHR0cCIsImh0dHBfY29uZmlnIiwic3VjY2VzcyIsImJpdGNhbGMiLCJhdmVyYWdlIiwiZm1hcCIsIngiLCJpbl9taW4iLCJpbl9tYXgiLCJvdXRfbWluIiwib3V0X21heCIsIlRIRVJNSVNUT1JOT01JTkFMIiwiVEVNUEVSQVRVUkVOT01JTkFMIiwiTlVNU0FNUExFUyIsIkJDT0VGRklDSUVOVCIsIlNFUklFU1JFU0lTVE9SIiwibG4iLCJsb2ciLCJrZWx2aW4iLCJzdGVpbmhhcnQiLCJpbmZsdXhDb25uZWN0aW9uIiwic2VyaWVzIiwidGl0bGUiLCJlbmFibGUiLCJzZXNzaW9uIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBQSxrQkFBUUMsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxrQkFBekIsRUFBNkNDLGFBQTdDLEVBQTREQyxpQkFBNUQsRUFBK0VDLGdCQUEvRSxFQUFpRzs7QUFFdkdGLGdCQUFjRyxRQUFkLENBQXVCQyxVQUF2QixHQUFvQyxJQUFwQztBQUNBSixnQkFBY0csUUFBZCxDQUF1QkUsT0FBdkIsQ0FBK0JDLE1BQS9CLEdBQXdDLGdDQUF4QztBQUNBLFNBQU9OLGNBQWNHLFFBQWQsQ0FBdUJFLE9BQXZCLENBQStCQyxNQUEvQixDQUFzQyxrQkFBdEMsQ0FBUDs7QUFFQUwsb0JBQWtCTSxVQUFsQixDQUE2QixFQUE3QjtBQUNBTCxtQkFBaUJNLDBCQUFqQixDQUE0QyxvRUFBNUM7O0FBRUFWLGlCQUNHVyxLQURILENBQ1MsTUFEVCxFQUNpQjtBQUNiQyxTQUFLLEVBRFE7QUFFYkMsaUJBQWEsb0JBRkE7QUFHYkMsZ0JBQVk7QUFIQyxHQURqQixFQU1HSCxLQU5ILENBTVMsT0FOVCxFQU1rQjtBQUNkQyxTQUFLLFdBRFM7QUFFZEMsaUJBQWEsb0JBRkM7QUFHZEMsZ0JBQVk7QUFIRSxHQU5sQixFQVdHSCxLQVhILENBV1MsT0FYVCxFQVdrQjtBQUNkQyxTQUFLLFFBRFM7QUFFZEMsaUJBQWEsb0JBRkM7QUFHZEMsZ0JBQVk7QUFIRSxHQVhsQixFQWdCR0gsS0FoQkgsQ0FnQlMsV0FoQlQsRUFnQnNCO0FBQ25CQyxTQUFLLE9BRGM7QUFFbkJDLGlCQUFhO0FBRk0sR0FoQnRCO0FBcUJELENBdENELEU7Ozs7Ozs7Ozs7QUNKQWhCLFFBQVFDLE1BQVIsQ0FBZSxtQkFBZixFQUNDZ0IsVUFERCxDQUNZLFVBRFosRUFDd0IsVUFBU0MsTUFBVCxFQUFpQkMsTUFBakIsRUFBeUJDLE9BQXpCLEVBQWtDQyxRQUFsQyxFQUE0Q0MsU0FBNUMsRUFBdURDLEVBQXZELEVBQTJEQyxLQUEzRCxFQUFrRUMsSUFBbEUsRUFBd0VDLFdBQXhFLEVBQW9GOztBQUU1R1IsU0FBT1MsYUFBUCxHQUF1QixVQUFTQyxDQUFULEVBQVc7QUFDaEMsUUFBR0EsQ0FBSCxFQUFLO0FBQ0g1QixjQUFRNkIsT0FBUixDQUFnQkQsRUFBRUUsTUFBbEIsRUFBMEJDLElBQTFCLENBQStCLGFBQS9CO0FBQ0Q7QUFDREwsZ0JBQVlNLEtBQVo7QUFDQUMsV0FBT0MsUUFBUCxDQUFnQkMsSUFBaEIsR0FBcUIsR0FBckI7QUFDRCxHQU5EOztBQVFBLE1BQUloQixPQUFPaUIsT0FBUCxDQUFlQyxJQUFmLElBQXVCLE9BQTNCLEVBQ0VuQixPQUFPUyxhQUFQOztBQUVGLE1BQUlXLGVBQWUsSUFBbkI7QUFDQSxNQUFJQyxhQUFhLEdBQWpCO0FBQ0EsTUFBSUMsVUFBVSxJQUFkLENBZjRHLENBZXhGOztBQUVwQnRCLFNBQU9RLFdBQVAsR0FBcUJBLFdBQXJCO0FBQ0FSLFNBQU91QixJQUFQLEdBQWMsRUFBQ0MsT0FBT0MsUUFBUUMsU0FBU1YsUUFBVCxDQUFrQlcsUUFBbEIsSUFBNEIsUUFBcEMsQ0FBUjtBQUNWQyw0QkFBc0JGLFNBQVNWLFFBQVQsQ0FBa0JhO0FBRDlCLEdBQWQ7QUFHQTdCLFNBQU84QixHQUFQLEdBQWE7QUFDWEMsVUFBTSxJQURLO0FBRVhDLFVBQU0sRUFGSztBQUdYQyxlQUFXLEVBSEE7QUFJWEMsY0FBVSxPQUpDO0FBS1hDLGtCQUFjLFNBTEg7QUFNWEMsaUJBQWE7QUFORixHQUFiO0FBUUFwQyxTQUFPcUMsU0FBUCxHQUFtQixFQUFuQjtBQUNBckMsU0FBT3NDLElBQVA7QUFDQXRDLFNBQU91QyxNQUFQO0FBQ0F2QyxTQUFPd0MsS0FBUDtBQUNBeEMsU0FBT3lDLFFBQVA7QUFDQXpDLFNBQU8wQyxHQUFQO0FBQ0ExQyxTQUFPMkMsV0FBUCxHQUFxQm5DLFlBQVltQyxXQUFaLEVBQXJCO0FBQ0EzQyxTQUFPNEMsWUFBUCxHQUFzQixJQUF0QjtBQUNBNUMsU0FBTzZDLEtBQVAsR0FBZSxFQUFDQyxTQUFTLEVBQVYsRUFBY2YsTUFBTSxRQUFwQixFQUFmO0FBQ0EvQixTQUFPK0MsTUFBUCxHQUFnQjtBQUNkQyxTQUFLLENBRFM7QUFFZEMsYUFBUztBQUNQQyxhQUFPLENBREE7QUFFUEMsWUFBTSxHQUZDO0FBR1BDLFlBQU0sQ0FIQztBQUlQQyxpQkFBVyxtQkFBU0MsS0FBVCxFQUFnQjtBQUN2QixlQUFVQSxLQUFWO0FBQ0gsT0FOTTtBQU9QQyxhQUFPLGVBQVNDLFFBQVQsRUFBbUJDLFVBQW5CLEVBQStCQyxTQUEvQixFQUEwQ0MsV0FBMUMsRUFBc0Q7QUFDM0QsWUFBSUMsU0FBU0osU0FBU0ssS0FBVCxDQUFlLEdBQWYsQ0FBYjtBQUNBLFlBQUlDLENBQUo7O0FBRUEsZ0JBQVFGLE9BQU8sQ0FBUCxDQUFSO0FBQ0UsZUFBSyxNQUFMO0FBQ0VFLGdCQUFJOUQsT0FBTytELE9BQVAsQ0FBZUgsT0FBTyxDQUFQLENBQWYsRUFBMEJJLE1BQTlCO0FBQ0E7QUFDRixlQUFLLE1BQUw7QUFDRUYsZ0JBQUk5RCxPQUFPK0QsT0FBUCxDQUFlSCxPQUFPLENBQVAsQ0FBZixFQUEwQkssTUFBOUI7QUFDQTtBQUNGLGVBQUssTUFBTDtBQUNFSCxnQkFBSTlELE9BQU8rRCxPQUFQLENBQWVILE9BQU8sQ0FBUCxDQUFmLEVBQTBCTSxJQUE5QjtBQUNBO0FBVEo7O0FBWUEsWUFBRyxDQUFDSixDQUFKLEVBQ0U7QUFDRixZQUFHOUQsT0FBTytELE9BQVAsQ0FBZUgsT0FBTyxDQUFQLENBQWYsRUFBMEJPLE1BQTFCLElBQW9DTCxFQUFFTSxHQUF0QyxJQUE2Q04sRUFBRU8sT0FBbEQsRUFBMEQ7QUFDeEQsaUJBQU9yRSxPQUFPc0UsV0FBUCxDQUFtQnRFLE9BQU8rRCxPQUFQLENBQWVILE9BQU8sQ0FBUCxDQUFmLENBQW5CLEVBQThDRSxDQUE5QyxFQUFpRCxJQUFqRCxDQUFQO0FBQ0Q7QUFDRjtBQTVCTTtBQUZLLEdBQWhCOztBQWtDQTlELFNBQU91RSxhQUFQLEdBQXVCLFVBQVVDLE9BQVYsRUFBbUI7QUFDeEN4RSxXQUFPcUMsU0FBUCxHQUFtQm1DLE9BQW5CO0FBQ0FDLE1BQUUsZUFBRixFQUFtQkMsS0FBbkIsQ0FBeUIsUUFBekI7QUFDRCxHQUhEOztBQUtBMUUsU0FBTzJFLHNCQUFQLEdBQWdDLFVBQVVILE9BQVYsRUFBbUI7QUFDakQsUUFBSUEsUUFBUUksSUFBUixJQUFnQkosUUFBUUksSUFBUixDQUFhQyxJQUE3QixJQUFxQ0wsUUFBUUksSUFBUixDQUFhQyxJQUFiLENBQWtCQyxNQUEzRCxFQUFtRTtBQUNqRTlFLGFBQU8rRCxPQUFQLEdBQWlCLEVBQWpCO0FBQ0FnQixRQUFFQyxJQUFGLENBQU9SLFFBQVFJLElBQVIsQ0FBYUMsSUFBcEIsRUFBMEIsZUFBTztBQUMvQjdFLGVBQU8rRCxPQUFQLENBQWVrQixJQUFmLENBQW9CO0FBQ2xCOUQsZ0JBQU0rRCxJQUFJL0QsSUFEUTtBQUVoQmdFLGNBQUksSUFGWTtBQUdoQnBELGdCQUFNL0IsT0FBTzJDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0JaLElBSFo7QUFJaEJvQyxrQkFBUSxLQUpRO0FBS2hCaUIsa0JBQVEsS0FMUTtBQU1oQnBCLGtCQUFRLEVBQUVrQixLQUFLLElBQVAsRUFBYWIsU0FBUyxLQUF0QixFQUE2QmdCLE1BQU0sS0FBbkMsRUFBMENqQixLQUFLLEtBQS9DLEVBQXNEa0IsV0FBVyxHQUFqRSxFQUFzRUMsUUFBUSxLQUE5RSxFQU5RO0FBT2hCckIsZ0JBQU0sRUFBRWdCLEtBQUssSUFBUCxFQUFhYixTQUFTLEtBQXRCLEVBQTZCZ0IsTUFBTSxLQUFuQyxFQUEwQ2pCLEtBQUssS0FBL0MsRUFBc0RrQixXQUFXLEdBQWpFLEVBQXNFQyxRQUFRLEtBQTlFLEVBUFU7QUFRaEJDLGdCQUFNLEVBQUVOLEtBQUtBLElBQUlBLEdBQVgsRUFBZ0JPLEtBQUssRUFBckIsRUFBeUJDLE9BQU8sRUFBaEMsRUFBb0MzRCxNQUFNbUQsSUFBSW5ELElBQTlDLEVBQW9ENEQsS0FBSyxLQUF6RCxFQUFnRUMsS0FBSyxLQUFyRSxFQUE0RUMsT0FBTyxLQUFuRixFQUEwRjNFLFNBQVMsQ0FBbkcsRUFBc0c0RSxVQUFVLENBQWhILEVBQW1IQyxVQUFVLENBQTdILEVBQWdJQyxRQUFRLENBQXhJLEVBQTJJcEYsUUFBUVosT0FBTzJDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0IvQixNQUF6SyxFQUFpTHFGLE1BQU1qRyxPQUFPMkMsV0FBUCxDQUFtQixDQUFuQixFQUFzQnNELElBQTdNLEVBQW1OQyxLQUFLLENBQXhOLEVBQTJOQyxPQUFPLENBQWxPLEVBUlU7QUFTaEJDLGtCQUFRLEVBVFE7QUFVaEJDLGtCQUFRLEVBVlE7QUFXaEJDLGdCQUFNeEgsUUFBUXlILElBQVIsQ0FBYS9GLFlBQVlnRyxrQkFBWixFQUFiLEVBQStDLEVBQUVsRCxPQUFPLENBQVQsRUFBWU4sS0FBSyxDQUFqQixFQUFvQnlELEtBQUt6RyxPQUFPMkMsV0FBUCxDQUFtQixDQUFuQixFQUFzQi9CLE1BQXRCLEdBQStCWixPQUFPMkMsV0FBUCxDQUFtQixDQUFuQixFQUFzQnNELElBQTlFLEVBQS9DLENBWFU7QUFZaEJ6QixtQkFBU0EsT0FaTztBQWFoQjFCLG1CQUFTLEVBQUVmLE1BQU0sT0FBUixFQUFpQmUsU0FBUyxFQUExQixFQUE4QjRELFNBQVMsRUFBdkMsRUFBMkNDLE9BQU8sQ0FBbEQsRUFBcUQzRixVQUFVLEVBQS9ELEVBYk87QUFjaEI0RixrQkFBUSxFQUFFQyxPQUFPLEtBQVQ7QUFkUSxTQUFwQjtBQWdCRCxPQWpCRDtBQWtCRDtBQUNGLEdBdEJEOztBQXdCQTdHLFNBQU84RyxzQkFBUCxHQUFnQyxVQUFTL0UsSUFBVCxFQUFlMkQsS0FBZixFQUFxQjtBQUNuRCxXQUFPcUIsT0FBT0MsTUFBUCxDQUFjaEgsT0FBTytDLE1BQVAsQ0FBY0UsT0FBNUIsRUFBcUMsRUFBQ2tDLElBQU9wRCxJQUFQLFNBQWUyRCxLQUFoQixFQUFyQyxDQUFQO0FBQ0QsR0FGRDs7QUFJQTFGLFNBQU9pSCxnQkFBUCxHQUEwQixVQUFTQyxLQUFULEVBQWU7QUFDdkNBLFlBQVFBLE1BQU1DLE9BQU4sQ0FBYyxJQUFkLEVBQW1CLEVBQW5CLEVBQXVCQSxPQUF2QixDQUErQixJQUEvQixFQUFvQyxFQUFwQyxDQUFSO0FBQ0EsUUFBR0QsTUFBTUUsT0FBTixDQUFjLEdBQWQsTUFBcUIsQ0FBQyxDQUF6QixFQUEyQjtBQUN6QixVQUFJQyxPQUFLSCxNQUFNckQsS0FBTixDQUFZLEdBQVosQ0FBVDtBQUNBcUQsY0FBUSxDQUFDSSxXQUFXRCxLQUFLLENBQUwsQ0FBWCxJQUFvQkMsV0FBV0QsS0FBSyxDQUFMLENBQVgsQ0FBckIsSUFBMEMsQ0FBbEQ7QUFDRCxLQUhELE1BR087QUFDTEgsY0FBUUksV0FBV0osS0FBWCxDQUFSO0FBQ0Q7QUFDRCxRQUFHLENBQUNBLEtBQUosRUFDRSxPQUFPLEVBQVA7QUFDRixRQUFJSyxJQUFJeEMsRUFBRXlDLE1BQUYsQ0FBU3hILE9BQU95QyxRQUFoQixFQUEwQixVQUFTZ0YsSUFBVCxFQUFjO0FBQzlDLGFBQVFBLEtBQUtDLEdBQUwsSUFBWVIsS0FBYixHQUFzQk8sS0FBS0UsR0FBM0IsR0FBaUMsRUFBeEM7QUFDRCxLQUZPLENBQVI7QUFHQSxRQUFHSixFQUFFekMsTUFBTCxFQUNFLE9BQU95QyxFQUFFQSxFQUFFekMsTUFBRixHQUFTLENBQVgsRUFBYzZDLEdBQXJCO0FBQ0YsV0FBTyxFQUFQO0FBQ0QsR0FoQkQ7O0FBa0JBO0FBQ0EzSCxTQUFPNEgsUUFBUCxHQUFrQnBILFlBQVlvSCxRQUFaLENBQXFCLFVBQXJCLEtBQW9DcEgsWUFBWXFILEtBQVosRUFBdEQ7QUFDQSxNQUFJLENBQUM3SCxPQUFPNEgsUUFBUCxDQUFnQkUsR0FBckIsRUFDRTlILE9BQU80SCxRQUFQLENBQWdCRSxHQUFoQixHQUFzQixFQUFFQyxPQUFPLEVBQVQsRUFBYUMsU0FBUyxFQUF0QixFQUEwQkMsUUFBUSxFQUFsQyxFQUF0QjtBQUNGO0FBQ0EsTUFBRyxDQUFDakksT0FBTzRILFFBQVAsQ0FBZ0JNLE9BQXBCLEVBQ0UsT0FBT2xJLE9BQU9TLGFBQVAsRUFBUDtBQUNGVCxTQUFPbUksWUFBUCxHQUFzQjNILFlBQVkySCxZQUFaLENBQXlCLEVBQUNDLE1BQU1wSSxPQUFPNEgsUUFBUCxDQUFnQk0sT0FBaEIsQ0FBd0JFLElBQS9CLEVBQXFDQyxPQUFPckksT0FBTzRILFFBQVAsQ0FBZ0JTLEtBQTVELEVBQXpCLENBQXRCO0FBQ0FySSxTQUFPK0QsT0FBUCxHQUFpQnZELFlBQVlvSCxRQUFaLENBQXFCLFNBQXJCLEtBQW1DcEgsWUFBWThILGNBQVosRUFBcEQ7O0FBRUF0SSxTQUFPdUksWUFBUCxHQUFzQixZQUFVO0FBQzlCOUQsTUFBRSxnQkFBRixFQUFvQkMsS0FBcEIsQ0FBMEIsTUFBMUI7QUFDQUQsTUFBRSxnQkFBRixFQUFvQkMsS0FBcEIsQ0FBMEIsTUFBMUI7QUFDRCxHQUhEOztBQUtBMUUsU0FBT3dJLFNBQVAsR0FBbUIsVUFBU0MsR0FBVCxFQUFhO0FBQzlCLFdBQU8xRCxFQUFFMkQsS0FBRixDQUFRRCxHQUFSLEVBQVksUUFBWixDQUFQO0FBQ0QsR0FGRDs7QUFJQXpJLFNBQU8ySSxhQUFQLEdBQXVCLFVBQVUvRSxNQUFWLEVBQWtCO0FBQ3ZDLFFBQUcsQ0FBQ0EsT0FBT1ksT0FBWCxFQUNFWixPQUFPWSxPQUFQLEdBQWlCeEUsT0FBTzRILFFBQVAsQ0FBZ0JnQixRQUFoQixDQUF5QixDQUF6QixDQUFqQjtBQUNGLFFBQUlwSSxZQUFZcUksS0FBWixDQUFrQmpGLE9BQU9ZLE9BQXpCLEVBQWtDLElBQWxDLEtBQTJDLElBQS9DLEVBQXFEO0FBQ25EWixhQUFPWSxPQUFQLENBQWVzRSxNQUFmLEdBQXdCLEVBQXhCO0FBQ0FsRixhQUFPWSxPQUFQLENBQWV1RSxPQUFmLEdBQXlCLEVBQXpCO0FBQ0FuRixhQUFPWSxPQUFQLENBQWV3RSxLQUFmLEdBQXVCLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiLEVBQWdCLEVBQWhCLEVBQW1CLEVBQW5CLEVBQXNCLEVBQXRCLEVBQXlCLEVBQXpCLENBQXZCO0FBQ0QsS0FKRCxNQUlPLElBQUl4SSxZQUFZcUksS0FBWixDQUFrQmpGLE9BQU9ZLE9BQXpCLEVBQWtDLElBQWxDLEtBQTJDLE1BQS9DLEVBQXVEO0FBQzVEWixhQUFPWSxPQUFQLENBQWVzRSxNQUFmLEdBQXdCLENBQXhCO0FBQ0FsRixhQUFPWSxPQUFQLENBQWV1RSxPQUFmLEdBQXlCLEVBQXpCO0FBQ0Q7QUFDRixHQVhEO0FBWUE7QUFDQWhFLElBQUVDLElBQUYsQ0FBT2hGLE9BQU8rRCxPQUFkLEVBQXVCLGtCQUFVO0FBQy9CLFFBQUcsQ0FBQ0gsT0FBT1ksT0FBWCxFQUNFWixPQUFPWSxPQUFQLEdBQWlCeEUsT0FBTzRILFFBQVAsQ0FBZ0JnQixRQUFoQixDQUF5QixDQUF6QixDQUFqQjtBQUNGLFFBQUlwSSxZQUFZcUksS0FBWixDQUFrQmpGLE9BQU9ZLE9BQXpCLEVBQWtDLElBQWxDLEtBQTJDLElBQS9DLEVBQXFEO0FBQ25EWixhQUFPWSxPQUFQLENBQWVzRSxNQUFmLEdBQXdCLEVBQXhCO0FBQ0FsRixhQUFPWSxPQUFQLENBQWV1RSxPQUFmLEdBQXlCLEVBQXpCO0FBQ0FuRixhQUFPWSxPQUFQLENBQWV3RSxLQUFmLEdBQXVCLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiLEVBQWdCLEVBQWhCLEVBQW1CLEVBQW5CLEVBQXNCLEVBQXRCLEVBQXlCLEVBQXpCLENBQXZCO0FBQ0QsS0FKRCxNQUlPLElBQUl4SSxZQUFZcUksS0FBWixDQUFrQmpGLE9BQU9ZLE9BQXpCLEVBQWtDLElBQWxDLEtBQTJDLE1BQS9DLEVBQXVEO0FBQzVEWixhQUFPWSxPQUFQLENBQWVzRSxNQUFmLEdBQXdCLENBQXhCO0FBQ0FsRixhQUFPWSxPQUFQLENBQWV1RSxPQUFmLEdBQXlCLEVBQXpCO0FBQ0Q7QUFDRixHQVhEOztBQWFBO0FBQ0EvSSxTQUFPaUosU0FBUCxHQUFtQixZQUFVO0FBQzNCLFFBQUdqSixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCQyxLQUF2QixJQUE4QixTQUFqQyxFQUEyQztBQUN6QyxVQUFHbkosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkUsTUFBdkIsSUFBK0IsVUFBbEMsRUFDRXBKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJHLEdBQXZCLEdBQTZCN0ksWUFBWTZJLEdBQVosQ0FBZ0JySixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSSxFQUF2QyxFQUEwQ3RKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJLLEVBQWpFLENBQTdCLENBREYsS0FHRXZKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJHLEdBQXZCLEdBQTZCN0ksWUFBWWdKLElBQVosQ0FBaUJ4SixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSSxFQUF4QyxFQUEyQ3RKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJLLEVBQWxFLENBQTdCO0FBQ0Z2SixhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCTyxHQUF2QixHQUE2QmpKLFlBQVlpSixHQUFaLENBQWdCekosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkcsR0FBdkMsRUFBMkNySixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUFsRSxDQUE3QjtBQUNBdkosYUFBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QlEsV0FBdkIsR0FBcUNsSixZQUFZa0osV0FBWixDQUF3QmxKLFlBQVltSixLQUFaLENBQWtCM0osT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkksRUFBekMsQ0FBeEIsRUFBcUU5SSxZQUFZbUosS0FBWixDQUFrQjNKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJLLEVBQXpDLENBQXJFLENBQXJDO0FBQ0F2SixhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCVSxRQUF2QixHQUFrQ3BKLFlBQVlvSixRQUFaLENBQXFCNUosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1Qk8sR0FBNUMsRUFDL0JqSixZQUFZcUosRUFBWixDQUFlckosWUFBWW1KLEtBQVosQ0FBa0IzSixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSSxFQUF6QyxDQUFmLEVBQTREOUksWUFBWW1KLEtBQVosQ0FBa0IzSixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF6QyxDQUE1RCxDQUQrQixFQUUvQnZKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJLLEVBRlEsQ0FBbEM7QUFHRCxLQVZELE1BVU87QUFDTCxVQUFHdkosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkUsTUFBdkIsSUFBK0IsVUFBbEMsRUFDRXBKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJHLEdBQXZCLEdBQTZCN0ksWUFBWTZJLEdBQVosQ0FBZ0I3SSxZQUFZc0osRUFBWixDQUFlOUosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkksRUFBdEMsQ0FBaEIsRUFBMEQ5SSxZQUFZc0osRUFBWixDQUFlOUosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkssRUFBdEMsQ0FBMUQsQ0FBN0IsQ0FERixLQUdFdkosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkcsR0FBdkIsR0FBNkI3SSxZQUFZZ0osSUFBWixDQUFpQmhKLFlBQVlzSixFQUFaLENBQWU5SixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSSxFQUF0QyxDQUFqQixFQUEyRDlJLFlBQVlzSixFQUFaLENBQWU5SixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF0QyxDQUEzRCxDQUE3QjtBQUNGdkosYUFBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1Qk8sR0FBdkIsR0FBNkJqSixZQUFZaUosR0FBWixDQUFnQnpKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJHLEdBQXZDLEVBQTJDN0ksWUFBWXNKLEVBQVosQ0FBZTlKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJLLEVBQXRDLENBQTNDLENBQTdCO0FBQ0F2SixhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCUSxXQUF2QixHQUFxQ2xKLFlBQVlrSixXQUFaLENBQXdCMUosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkksRUFBL0MsRUFBa0R0SixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF6RSxDQUFyQztBQUNBdkosYUFBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QlUsUUFBdkIsR0FBa0NwSixZQUFZb0osUUFBWixDQUFxQjVKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJPLEdBQTVDLEVBQy9CakosWUFBWXFKLEVBQVosQ0FBZTdKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJJLEVBQXRDLEVBQXlDdEosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkssRUFBaEUsQ0FEK0IsRUFFL0IvSSxZQUFZc0osRUFBWixDQUFlOUosT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkssRUFBdEMsQ0FGK0IsQ0FBbEM7QUFHRDtBQUNGLEdBdEJEOztBQXdCQXZKLFNBQU8rSixZQUFQLEdBQXNCLFVBQVNYLE1BQVQsRUFBZ0I7QUFDcENwSixXQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCRSxNQUF2QixHQUFnQ0EsTUFBaEM7QUFDQXBKLFdBQU9pSixTQUFQO0FBQ0QsR0FIRDs7QUFLQWpKLFNBQU9nSyxXQUFQLEdBQXFCLFVBQVNiLEtBQVQsRUFBZTtBQUNsQ25KLFdBQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJDLEtBQXZCLEdBQStCQSxLQUEvQjtBQUNBLFFBQUdBLFNBQU8sU0FBVixFQUFvQjtBQUNsQm5KLGFBQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJJLEVBQXZCLEdBQTRCOUksWUFBWXNKLEVBQVosQ0FBZTlKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJJLEVBQXRDLENBQTVCO0FBQ0F0SixhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF2QixHQUE0Qi9JLFlBQVlzSixFQUFaLENBQWU5SixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF0QyxDQUE1QjtBQUNELEtBSEQsTUFHTztBQUNMdkosYUFBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkksRUFBdkIsR0FBNEI5SSxZQUFZbUosS0FBWixDQUFrQjNKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJJLEVBQXpDLENBQTVCO0FBQ0F0SixhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF2QixHQUE0Qi9JLFlBQVltSixLQUFaLENBQWtCM0osT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkssRUFBekMsQ0FBNUI7QUFDRDtBQUNGLEdBVEQ7O0FBV0F2SixTQUFPaUssY0FBUCxHQUF3QixVQUFTaEMsTUFBVCxFQUFnQjtBQUN0QyxRQUFHQSxVQUFVLFdBQWIsRUFDRSxPQUFPLFNBQVAsQ0FERixLQUVLLElBQUdsRCxFQUFFbUYsUUFBRixDQUFXakMsTUFBWCxFQUFrQixLQUFsQixDQUFILEVBQ0gsT0FBTyxXQUFQLENBREcsS0FHSCxPQUFPLFFBQVA7QUFDSCxHQVBEOztBQVNBakksU0FBT2lKLFNBQVA7O0FBRUVqSixTQUFPbUssWUFBUCxHQUFzQixVQUFTQyxNQUFULEVBQWdCO0FBQ2xDQTtBQUNBLFdBQU9DLE1BQU1ELE1BQU4sRUFBY0UsSUFBZCxHQUFxQkMsR0FBckIsQ0FBeUIsVUFBQ3hGLENBQUQsRUFBSXlGLEdBQUo7QUFBQSxhQUFZLElBQUlBLEdBQWhCO0FBQUEsS0FBekIsQ0FBUDtBQUNILEdBSEQ7O0FBS0F4SyxTQUFPNEksUUFBUCxHQUFrQjtBQUNoQjZCLFNBQUssZUFBTTtBQUNUaEcsUUFBRSx5QkFBRixFQUE2QmlHLE9BQTdCLENBQXFDLE1BQXJDO0FBQ0EsVUFBSUMsTUFBTSxJQUFJQyxJQUFKLEVBQVY7QUFDQSxVQUFHLENBQUM1SyxPQUFPNEgsUUFBUCxDQUFnQmdCLFFBQXBCLEVBQThCNUksT0FBTzRILFFBQVAsQ0FBZ0JnQixRQUFoQixHQUEyQixFQUEzQjtBQUM5QjVJLGFBQU80SCxRQUFQLENBQWdCZ0IsUUFBaEIsQ0FBeUIzRCxJQUF6QixDQUE4QjtBQUM1QkUsWUFBSTBGLEtBQUtGLE1BQUksRUFBSixHQUFPM0ssT0FBTzRILFFBQVAsQ0FBZ0JnQixRQUFoQixDQUF5QjlELE1BQWhDLEdBQXVDLENBQTVDLENBRHdCO0FBRTVCakYsYUFBSyxlQUZ1QjtBQUc1QmlMLGVBQU8sRUFIcUI7QUFJNUJDLGNBQU0sS0FKc0I7QUFLNUJqQyxnQkFBUSxFQUxvQjtBQU01QkMsaUJBQVMsRUFObUI7QUFPNUJwRCxhQUFLLENBUHVCO0FBUTVCcUYsZ0JBQVEsS0FSb0I7QUFTNUJ0RSxpQkFBUyxFQVRtQjtBQVU1QnVCLGdCQUFRLEVBQUVwRixPQUFPLEVBQVQsRUFBYW9JLElBQUksRUFBakIsRUFBcUJuSSxTQUFTLEVBQTlCLEVBVm9CO0FBVzVCOEIsY0FBTTtBQVhzQixPQUE5QjtBQWFBRyxRQUFFQyxJQUFGLENBQU9oRixPQUFPK0QsT0FBZCxFQUF1QixrQkFBVTtBQUMvQixZQUFHLENBQUNILE9BQU9ZLE9BQVgsRUFDRVosT0FBT1ksT0FBUCxHQUFpQnhFLE9BQU80SCxRQUFQLENBQWdCZ0IsUUFBaEIsQ0FBeUIsQ0FBekIsQ0FBakI7QUFDRixZQUFJcEksWUFBWXFJLEtBQVosQ0FBa0JqRixPQUFPWSxPQUF6QixFQUFrQyxJQUFsQyxLQUEyQyxJQUEvQyxFQUFxRDtBQUNuRFosaUJBQU9ZLE9BQVAsQ0FBZXNFLE1BQWYsR0FBd0IsRUFBeEI7QUFDQWxGLGlCQUFPWSxPQUFQLENBQWV1RSxPQUFmLEdBQXlCLEVBQXpCO0FBQ0FuRixpQkFBT1ksT0FBUCxDQUFld0UsS0FBZixHQUF1QixDQUFDLENBQUQsRUFBRyxDQUFILEVBQUssQ0FBTCxFQUFPLEVBQVAsRUFBVSxFQUFWLEVBQWEsRUFBYixFQUFnQixFQUFoQixFQUFtQixFQUFuQixFQUFzQixFQUF0QixFQUF5QixFQUF6QixDQUF2QjtBQUNELFNBSkQsTUFJTyxJQUFJeEksWUFBWXFJLEtBQVosQ0FBa0JqRixPQUFPWSxPQUF6QixFQUFrQyxJQUFsQyxLQUEyQyxNQUEvQyxFQUF1RDtBQUM1RFosaUJBQU9ZLE9BQVAsQ0FBZXNFLE1BQWYsR0FBd0IsQ0FBeEI7QUFDQWxGLGlCQUFPWSxPQUFQLENBQWV1RSxPQUFmLEdBQXlCLEVBQXpCO0FBQ0Q7QUFDRixPQVhEO0FBWUQsS0E5QmU7QUErQmhCbUMsWUFBUSxnQkFBQzFHLE9BQUQsRUFBYTtBQUNuQkMsUUFBRSx5QkFBRixFQUE2QmlHLE9BQTdCLENBQXFDLE1BQXJDO0FBQ0EzRixRQUFFQyxJQUFGLENBQU9oRixPQUFPK0QsT0FBZCxFQUF1QixrQkFBVTtBQUMvQixZQUFHSCxPQUFPWSxPQUFQLElBQWtCWixPQUFPWSxPQUFQLENBQWVXLEVBQWYsSUFBcUJYLFFBQVFXLEVBQWxELEVBQ0V2QixPQUFPWSxPQUFQLEdBQWlCQSxPQUFqQjtBQUNILE9BSEQ7QUFJRCxLQXJDZTtBQXNDaEIyRyxZQUFRLGlCQUFDekYsS0FBRCxFQUFRbEIsT0FBUixFQUFvQjtBQUMxQkMsUUFBRSx5QkFBRixFQUE2QmlHLE9BQTdCLENBQXFDLE1BQXJDO0FBQ0ExSyxhQUFPNEgsUUFBUCxDQUFnQmdCLFFBQWhCLENBQXlCd0MsTUFBekIsQ0FBZ0MxRixLQUFoQyxFQUF1QyxDQUF2QztBQUNBWCxRQUFFQyxJQUFGLENBQU9oRixPQUFPK0QsT0FBZCxFQUF1QixrQkFBVTtBQUMvQixZQUFHSCxPQUFPWSxPQUFQLElBQWtCWixPQUFPWSxPQUFQLENBQWVXLEVBQWYsSUFBcUJYLFFBQVFXLEVBQWxELEVBQ0UsT0FBT3ZCLE9BQU9ZLE9BQWQ7QUFDSCxPQUhEO0FBSUQsS0E3Q2U7QUE4Q2hCNkcsYUFBUyxpQkFBQzdHLE9BQUQsRUFBYTtBQUNwQkMsUUFBRSx5QkFBRixFQUE2QmlHLE9BQTdCLENBQXFDLE1BQXJDO0FBQ0FsRyxjQUFReUQsTUFBUixDQUFlZ0QsRUFBZixHQUFvQixFQUFwQjtBQUNBekcsY0FBUXlELE1BQVIsQ0FBZXBGLEtBQWYsR0FBdUIsRUFBdkI7QUFDQTJCLGNBQVF5RCxNQUFSLENBQWVuRixPQUFmLEdBQXlCLGVBQXpCO0FBQ0F0QyxrQkFBWTZLLE9BQVosQ0FBb0I3RyxPQUFwQixFQUE2QixNQUE3QixFQUNHOEcsSUFESCxDQUNRLGdCQUFRO0FBQ1osWUFBRzFHLFFBQVFBLEtBQUsyRyxTQUFoQixFQUEwQjtBQUN4Qi9HLGtCQUFRc0csS0FBUixHQUFnQmxHLEtBQUsyRyxTQUFMLENBQWVULEtBQS9CO0FBQ0EsY0FBR2xHLEtBQUsyRyxTQUFMLENBQWVSLElBQWxCLEVBQ0V2RyxRQUFRdUcsSUFBUixHQUFlbkcsS0FBSzJHLFNBQUwsQ0FBZVIsSUFBOUI7QUFDRnZHLGtCQUFRa0MsT0FBUixHQUFrQjlCLEtBQUsyRyxTQUFMLENBQWU3RSxPQUFqQztBQUNBbEMsa0JBQVF5RCxNQUFSLENBQWVnRCxFQUFmLEdBQW9CLElBQUlMLElBQUosRUFBcEI7QUFDQXBHLGtCQUFReUQsTUFBUixDQUFlcEYsS0FBZixHQUF1QixFQUF2QjtBQUNBMkIsa0JBQVF5RCxNQUFSLENBQWVuRixPQUFmLEdBQXlCLEVBQXpCO0FBQ0EsY0FBRzBCLFFBQVFzRyxLQUFSLENBQWMxRCxPQUFkLENBQXNCLE9BQXRCLEtBQWtDLENBQWxDLElBQXVDNUMsUUFBUXNHLEtBQVIsQ0FBYzFELE9BQWQsQ0FBc0IsYUFBdEIsS0FBd0MsQ0FBbEYsRUFBb0Y7QUFDbEY1QyxvQkFBUXNFLE1BQVIsR0FBaUIsRUFBakI7QUFDQXRFLG9CQUFRdUUsT0FBUixHQUFrQixFQUFsQjtBQUNBdkUsb0JBQVF3RSxLQUFSLEdBQWdCLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMLEVBQU8sRUFBUCxFQUFVLEVBQVYsRUFBYSxFQUFiLEVBQWdCLEVBQWhCLEVBQW1CLEVBQW5CLEVBQXNCLEVBQXRCLEVBQXlCLEVBQXpCLENBQWhCO0FBQ0QsV0FKRCxNQUlPLElBQUd4RSxRQUFRc0csS0FBUixDQUFjMUQsT0FBZCxDQUFzQixTQUF0QixLQUFvQyxDQUF2QyxFQUF5QztBQUM5QzVDLG9CQUFRc0UsTUFBUixHQUFpQixDQUFqQjtBQUNBdEUsb0JBQVF1RSxPQUFSLEdBQWtCLEVBQWxCO0FBQ0Q7QUFDRjtBQUNGLE9BbkJILEVBb0JHeUMsS0FwQkgsQ0FvQlMsZUFBTztBQUNaLFlBQUdDLE9BQU9BLElBQUl4RCxNQUFKLElBQWMsQ0FBQyxDQUF6QixFQUEyQjtBQUN6QnpELGtCQUFReUQsTUFBUixDQUFlZ0QsRUFBZixHQUFvQixFQUFwQjtBQUNBekcsa0JBQVF5RCxNQUFSLENBQWVuRixPQUFmLEdBQXlCLEVBQXpCO0FBQ0EwQixrQkFBUXlELE1BQVIsQ0FBZXBGLEtBQWYsR0FBdUIsbUJBQXZCO0FBQ0Q7QUFDRixPQTFCSDtBQTJCRCxLQTlFZTtBQStFaEIrQixVQUFNLGNBQUNKLE9BQUQsRUFBYTtBQUNqQkMsUUFBRSx5QkFBRixFQUE2QmlHLE9BQTdCLENBQXFDLE1BQXJDO0FBQ0FsRyxjQUFReUQsTUFBUixDQUFlcEYsS0FBZixHQUF1QixFQUF2QjtBQUNBMkIsY0FBUXlELE1BQVIsQ0FBZW5GLE9BQWYsR0FBeUIsaUJBQXpCO0FBQ0F0QyxrQkFBWTZLLE9BQVosQ0FBb0I3RyxPQUFwQixFQUE2QixVQUE3QixFQUNHOEcsSUFESCxDQUNRLGdCQUFRO0FBQ1o5RyxnQkFBUUksSUFBUixHQUFlQSxJQUFmO0FBQ0FKLGdCQUFReUQsTUFBUixDQUFlcEYsS0FBZixHQUF1QixFQUF2QjtBQUNBMkIsZ0JBQVF5RCxNQUFSLENBQWVuRixPQUFmLEdBQXlCLEVBQXpCO0FBQ0QsT0FMSCxFQU1HMEksS0FOSCxDQU1TLGVBQU87QUFDWmhILGdCQUFRSSxJQUFSLEdBQWUsRUFBZjtBQUNBLFlBQUc2RyxPQUFPQSxJQUFJeEQsTUFBSixJQUFjLENBQUMsQ0FBekIsRUFBMkI7QUFDekJ6RCxrQkFBUXlELE1BQVIsQ0FBZW5GLE9BQWYsR0FBeUIsRUFBekI7QUFDQSxjQUFHOUMsT0FBTzBDLEdBQVAsQ0FBV2dFLE9BQVgsR0FBcUIsR0FBeEIsRUFDRWxDLFFBQVF5RCxNQUFSLENBQWVwRixLQUFmLEdBQXVCLDJCQUF2QixDQURGLEtBR0UyQixRQUFReUQsTUFBUixDQUFlcEYsS0FBZixHQUF1QixtQkFBdkI7QUFDSDtBQUNGLE9BZkg7QUFnQkQsS0FuR2U7QUFvR2hCNkksWUFBUSxnQkFBQ2xILE9BQUQsRUFBYTtBQUNuQkMsUUFBRSx5QkFBRixFQUE2QmlHLE9BQTdCLENBQXFDLE1BQXJDO0FBQ0FsRyxjQUFReUQsTUFBUixDQUFlZ0QsRUFBZixHQUFvQixFQUFwQjtBQUNBekcsY0FBUXlELE1BQVIsQ0FBZXBGLEtBQWYsR0FBdUIsRUFBdkI7QUFDQTJCLGNBQVF5RCxNQUFSLENBQWVuRixPQUFmLEdBQXlCLGNBQXpCO0FBQ0F0QyxrQkFBWTZLLE9BQVosQ0FBb0I3RyxPQUFwQixFQUE2QixRQUE3QixFQUNHOEcsSUFESCxDQUNRLGdCQUFRO0FBQ1o5RyxnQkFBUWtDLE9BQVIsR0FBa0IsRUFBbEI7QUFDQWxDLGdCQUFReUQsTUFBUixDQUFlbkYsT0FBZixHQUF5QixrREFBekI7QUFDRCxPQUpILEVBS0cwSSxLQUxILENBS1MsZUFBTztBQUNaLFlBQUdDLE9BQU9BLElBQUl4RCxNQUFKLElBQWMsQ0FBQyxDQUF6QixFQUEyQjtBQUN6QnpELGtCQUFReUQsTUFBUixDQUFlZ0QsRUFBZixHQUFvQixFQUFwQjtBQUNBekcsa0JBQVF5RCxNQUFSLENBQWVuRixPQUFmLEdBQXlCLEVBQXpCO0FBQ0EsY0FBR0osSUFBSWdFLE9BQUosR0FBYyxHQUFqQixFQUNFbEMsUUFBUXlELE1BQVIsQ0FBZXBGLEtBQWYsR0FBdUIsMkJBQXZCLENBREYsS0FHRTJCLFFBQVF5RCxNQUFSLENBQWVwRixLQUFmLEdBQXVCLG1CQUF2QjtBQUNIO0FBQ0YsT0FkSDtBQWVEO0FBeEhlLEdBQWxCOztBQTJIQTdDLFNBQU8yTCxNQUFQLEdBQWdCO0FBQ2Q3SyxXQUFPLGlCQUFNO0FBQ1hkLGFBQU80SCxRQUFQLENBQWdCK0QsTUFBaEIsR0FBeUIsRUFBRUMsTUFBTSxFQUFSLEVBQVlDLE1BQU0sRUFBbEIsRUFBc0JDLE9BQU8sRUFBN0IsRUFBaUM3RCxRQUFRLEVBQXpDLEVBQTZDOEQsT0FBTyxFQUFwRCxFQUF6QjtBQUNELEtBSGE7QUFJZEMsV0FBTyxpQkFBTTtBQUNYaE0sYUFBTzRILFFBQVAsQ0FBZ0IrRCxNQUFoQixDQUF1QjFELE1BQXZCLEdBQWdDLFlBQWhDO0FBQ0F6SCxrQkFBWW1MLE1BQVosR0FBcUJLLEtBQXJCLENBQTJCaE0sT0FBTzRILFFBQVAsQ0FBZ0IrRCxNQUFoQixDQUF1QkMsSUFBbEQsRUFBdUQ1TCxPQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCRSxJQUE5RSxFQUNHUCxJQURILENBQ1Esb0JBQVk7QUFDaEIsWUFBR1csU0FBU0gsS0FBWixFQUFrQjtBQUNoQjlMLGlCQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCMUQsTUFBdkIsR0FBZ0MsV0FBaEM7QUFDQWpJLGlCQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCRyxLQUF2QixHQUErQkcsU0FBU0gsS0FBeEM7QUFDQTlMLGlCQUFPMkwsTUFBUCxDQUFjTyxJQUFkLENBQW1CRCxTQUFTSCxLQUE1QjtBQUNELFNBSkQsTUFJTyxJQUFHRyxTQUFTRSxVQUFULElBQXVCRixTQUFTRyxHQUFuQyxFQUF1QztBQUM1Q3BNLGlCQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCMUQsTUFBdkIsR0FBZ0MsbUJBQWhDO0FBQ0FqSSxpQkFBT3FNLGVBQVAsQ0FBdUJKLFNBQVNHLEdBQWhDO0FBQ0Q7QUFDRixPQVZILEVBV0daLEtBWEgsQ0FXUyxlQUFPO0FBQ1p4TCxlQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCMUQsTUFBdkIsR0FBZ0MsbUJBQWhDO0FBQ0FqSSxlQUFPcU0sZUFBUCxDQUF1QlosSUFBSVcsR0FBSixJQUFXWCxHQUFsQztBQUNELE9BZEg7QUFlRCxLQXJCYTtBQXNCZFMsVUFBTSxjQUFDSixLQUFELEVBQVc7QUFDZjlMLGFBQU80SCxRQUFQLENBQWdCK0QsTUFBaEIsQ0FBdUJJLEtBQXZCLEdBQStCLEVBQS9CO0FBQ0EvTCxhQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCMUQsTUFBdkIsR0FBZ0MsVUFBaEM7QUFDQXpILGtCQUFZbUwsTUFBWixHQUFxQk8sSUFBckIsQ0FBMEJKLEtBQTFCLEVBQWlDUixJQUFqQyxDQUFzQyxvQkFBWTtBQUNoRCxZQUFHVyxTQUFTSyxVQUFaLEVBQXVCO0FBQ3JCdE0saUJBQU80SCxRQUFQLENBQWdCK0QsTUFBaEIsQ0FBdUIxRCxNQUF2QixHQUFnQyxXQUFoQztBQUNBakksaUJBQU80SCxRQUFQLENBQWdCK0QsTUFBaEIsQ0FBdUJJLEtBQXZCLEdBQStCRSxTQUFTSyxVQUF4QztBQUNBO0FBQ0F2SCxZQUFFQyxJQUFGLENBQU9oRixPQUFPNEgsUUFBUCxDQUFnQitELE1BQWhCLENBQXVCSSxLQUE5QixFQUFxQyxnQkFBUTtBQUMzQyxnQkFBR3RLLFFBQVE4SyxLQUFLdEUsTUFBYixDQUFILEVBQXdCO0FBQ3RCekgsMEJBQVltTCxNQUFaLEdBQXFCL0csSUFBckIsQ0FBMEIySCxJQUExQixFQUFnQ2pCLElBQWhDLENBQXFDLGdCQUFRO0FBQzNDLG9CQUFHMUcsUUFBUUEsS0FBSzRILFlBQWhCLEVBQTZCO0FBQzNCRCx1QkFBSzNILElBQUwsR0FBWTZILEtBQUtDLEtBQUwsQ0FBVzlILEtBQUs0SCxZQUFoQixFQUE4QkcsTUFBOUIsQ0FBcUNDLFdBQWpEO0FBQ0Esc0JBQUdILEtBQUtDLEtBQUwsQ0FBVzlILEtBQUs0SCxZQUFoQixFQUE4QkssTUFBOUIsQ0FBcUNDLFlBQXJDLENBQWtEQyxRQUFsRCxJQUE4RCxDQUFqRSxFQUFtRTtBQUNqRVIseUJBQUtTLEtBQUwsR0FBYVAsS0FBS0MsS0FBTCxDQUFXOUgsS0FBSzRILFlBQWhCLEVBQThCSyxNQUE5QixDQUFxQ0MsWUFBbEQ7QUFDRCxtQkFGRCxNQUVPO0FBQ0xQLHlCQUFLUyxLQUFMLEdBQWEsSUFBYjtBQUNEO0FBQ0Y7QUFDRixlQVREO0FBVUQ7QUFDRixXQWJEO0FBY0Q7QUFDRixPQXBCRDtBQXFCRCxLQTlDYTtBQStDZHBJLFVBQU0sY0FBQ3FJLE1BQUQsRUFBWTtBQUNoQnpNLGtCQUFZbUwsTUFBWixHQUFxQi9HLElBQXJCLENBQTBCcUksTUFBMUIsRUFBa0MzQixJQUFsQyxDQUF1QyxvQkFBWTtBQUNqRCxlQUFPVyxRQUFQO0FBQ0QsT0FGRDtBQUdELEtBbkRhO0FBb0RkaUIsWUFBUSxnQkFBQ0QsTUFBRCxFQUFZO0FBQ2xCLFVBQUlFLFVBQVVGLE9BQU9ySSxJQUFQLENBQVl3SSxXQUFaLElBQTJCLENBQTNCLEdBQStCLENBQS9CLEdBQW1DLENBQWpEO0FBQ0E1TSxrQkFBWW1MLE1BQVosR0FBcUJ1QixNQUFyQixDQUE0QkQsTUFBNUIsRUFBb0NFLE9BQXBDLEVBQTZDN0IsSUFBN0MsQ0FBa0Qsb0JBQVk7QUFDNUQyQixlQUFPckksSUFBUCxDQUFZd0ksV0FBWixHQUEwQkQsT0FBMUI7QUFDQSxlQUFPbEIsUUFBUDtBQUNELE9BSEQsRUFHR1gsSUFISCxDQUdRLDBCQUFrQjtBQUN4Qm5MLGlCQUFTLFlBQU07QUFDYjtBQUNBLGlCQUFPSyxZQUFZbUwsTUFBWixHQUFxQi9HLElBQXJCLENBQTBCcUksTUFBMUIsRUFBa0MzQixJQUFsQyxDQUF1QyxnQkFBUTtBQUNwRCxnQkFBRzFHLFFBQVFBLEtBQUs0SCxZQUFoQixFQUE2QjtBQUMzQlMscUJBQU9ySSxJQUFQLEdBQWM2SCxLQUFLQyxLQUFMLENBQVc5SCxLQUFLNEgsWUFBaEIsRUFBOEJHLE1BQTlCLENBQXFDQyxXQUFuRDtBQUNBLGtCQUFHSCxLQUFLQyxLQUFMLENBQVc5SCxLQUFLNEgsWUFBaEIsRUFBOEJLLE1BQTlCLENBQXFDQyxZQUFyQyxDQUFrREMsUUFBbEQsSUFBOEQsQ0FBakUsRUFBbUU7QUFDakVFLHVCQUFPRCxLQUFQLEdBQWVQLEtBQUtDLEtBQUwsQ0FBVzlILEtBQUs0SCxZQUFoQixFQUE4QkssTUFBOUIsQ0FBcUNDLFlBQXBEO0FBQ0QsZUFGRCxNQUVPO0FBQ0xHLHVCQUFPRCxLQUFQLEdBQWUsSUFBZjtBQUNEO0FBQ0QscUJBQU9DLE1BQVA7QUFDRDtBQUNELG1CQUFPQSxNQUFQO0FBQ0QsV0FYTSxDQUFQO0FBWUQsU0FkRCxFQWNHLElBZEg7QUFlRCxPQW5CRDtBQW9CRDtBQTFFYSxHQUFoQjs7QUE2RUFqTixTQUFPNkYsS0FBUCxHQUFlO0FBQ2IvRSxXQUFPLGlCQUFNO0FBQ1hkLGFBQU80SCxRQUFQLENBQWdCL0IsS0FBaEIsR0FBd0IsRUFBRWhHLEtBQUssRUFBUCxFQUFXdUosUUFBUSxLQUFuQixFQUEwQmlFLE1BQU0sRUFBRUMsS0FBSyxFQUFQLEVBQVdoSyxPQUFPLEVBQWxCLEVBQWhDLEVBQXdEMkUsUUFBUSxFQUFoRSxFQUF4QjtBQUNELEtBSFk7QUFJYm9ELGFBQVMsbUJBQU07QUFDYnJMLGFBQU80SCxRQUFQLENBQWdCL0IsS0FBaEIsQ0FBc0JvQyxNQUF0QixHQUErQixZQUEvQjtBQUNBekgsa0JBQVlxRixLQUFaLEdBQW9Cd0YsT0FBcEIsR0FDR0MsSUFESCxDQUNRLG9CQUFZO0FBQ2hCLFlBQUdXLFFBQUgsRUFBWTtBQUNWak0saUJBQU80SCxRQUFQLENBQWdCL0IsS0FBaEIsQ0FBc0JvQyxNQUF0QixHQUErQixXQUEvQjtBQUNEO0FBQ0YsT0FMSCxFQU1HdUQsS0FOSCxDQU1TLGVBQU87QUFDWnhMLGVBQU80SCxRQUFQLENBQWdCL0IsS0FBaEIsQ0FBc0JvQyxNQUF0QixHQUErQixtQkFBL0I7QUFDQWpJLGVBQU9xTSxlQUFQLENBQXVCWixJQUFJVyxHQUFKLElBQVdYLEdBQWxDO0FBQ0QsT0FUSDtBQVVEO0FBaEJZLEdBQWY7O0FBbUJBekwsU0FBT3VOLFNBQVAsR0FBbUIsVUFBU3hMLElBQVQsRUFBYztBQUMvQixRQUFHLENBQUMvQixPQUFPK0QsT0FBWCxFQUFvQi9ELE9BQU8rRCxPQUFQLEdBQWlCLEVBQWpCO0FBQ3BCLFFBQUlTLFVBQVV4RSxPQUFPNEgsUUFBUCxDQUFnQmdCLFFBQWhCLENBQXlCOUQsTUFBekIsR0FBa0M5RSxPQUFPNEgsUUFBUCxDQUFnQmdCLFFBQWhCLENBQXlCLENBQXpCLENBQWxDLEdBQWdFLEVBQUN6RCxJQUFJLFdBQVMwRixLQUFLLFdBQUwsQ0FBZCxFQUFnQ2hMLEtBQUksZUFBcEMsRUFBb0RpSixRQUFPLENBQTNELEVBQTZEQyxTQUFRLEVBQXJFLEVBQXdFcEQsS0FBSSxDQUE1RSxFQUE4RXFGLFFBQU8sS0FBckYsRUFBOUU7QUFDQWhMLFdBQU8rRCxPQUFQLENBQWVrQixJQUFmLENBQW9CO0FBQ2hCOUQsWUFBTVksT0FBT2dELEVBQUV5SSxJQUFGLENBQU94TixPQUFPMkMsV0FBZCxFQUEwQixFQUFDWixNQUFNQSxJQUFQLEVBQTFCLEVBQXdDWixJQUEvQyxHQUFzRG5CLE9BQU8yQyxXQUFQLENBQW1CLENBQW5CLEVBQXNCeEIsSUFEbEU7QUFFZmdFLFVBQUksSUFGVztBQUdmcEQsWUFBTUEsUUFBUS9CLE9BQU8yQyxXQUFQLENBQW1CLENBQW5CLEVBQXNCWixJQUhyQjtBQUlmb0MsY0FBUSxLQUpPO0FBS2ZpQixjQUFRLEtBTE87QUFNZnBCLGNBQVEsRUFBQ2tCLEtBQUksSUFBTCxFQUFVYixTQUFRLEtBQWxCLEVBQXdCZ0IsTUFBSyxLQUE3QixFQUFtQ2pCLEtBQUksS0FBdkMsRUFBNkNrQixXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBTk87QUFPZnJCLFlBQU0sRUFBQ2dCLEtBQUksSUFBTCxFQUFVYixTQUFRLEtBQWxCLEVBQXdCZ0IsTUFBSyxLQUE3QixFQUFtQ2pCLEtBQUksS0FBdkMsRUFBNkNrQixXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBUFM7QUFRZkMsWUFBTSxFQUFDTixLQUFJLElBQUwsRUFBVU8sS0FBSSxFQUFkLEVBQWlCQyxPQUFNLEVBQXZCLEVBQTBCM0QsTUFBSyxZQUEvQixFQUE0QzRELEtBQUksS0FBaEQsRUFBc0RDLEtBQUksS0FBMUQsRUFBZ0VDLE9BQU0sS0FBdEUsRUFBNEUzRSxTQUFRLENBQXBGLEVBQXNGNEUsVUFBUyxDQUEvRixFQUFpR0MsVUFBUyxDQUExRyxFQUE0R0MsUUFBTyxDQUFuSCxFQUFxSHBGLFFBQU9aLE9BQU8yQyxXQUFQLENBQW1CLENBQW5CLEVBQXNCL0IsTUFBbEosRUFBeUpxRixNQUFLakcsT0FBTzJDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0JzRCxJQUFwTCxFQUF5TEMsS0FBSSxDQUE3TCxFQUErTEMsT0FBTSxDQUFyTSxFQVJTO0FBU2ZDLGNBQVEsRUFUTztBQVVmQyxjQUFRLEVBVk87QUFXZkMsWUFBTXhILFFBQVF5SCxJQUFSLENBQWEvRixZQUFZZ0csa0JBQVosRUFBYixFQUE4QyxFQUFDbEQsT0FBTSxDQUFQLEVBQVNOLEtBQUksQ0FBYixFQUFleUQsS0FBSXpHLE9BQU8yQyxXQUFQLENBQW1CLENBQW5CLEVBQXNCL0IsTUFBdEIsR0FBNkJaLE9BQU8yQyxXQUFQLENBQW1CLENBQW5CLEVBQXNCc0QsSUFBdEUsRUFBOUMsQ0FYUztBQVlmekIsZUFBU0EsT0FaTTtBQWFmMUIsZUFBUyxFQUFDZixNQUFLLE9BQU4sRUFBY2UsU0FBUSxFQUF0QixFQUF5QjRELFNBQVEsRUFBakMsRUFBb0NDLE9BQU0sQ0FBMUMsRUFBNEMzRixVQUFTLEVBQXJELEVBYk07QUFjZjRGLGNBQVEsRUFBQ0MsT0FBTyxLQUFSO0FBZE8sS0FBcEI7QUFnQkQsR0FuQkQ7O0FBcUJBN0csU0FBT3lOLGdCQUFQLEdBQTBCLFVBQVMxTCxJQUFULEVBQWM7QUFDdEMsV0FBT2dELEVBQUV5QyxNQUFGLENBQVN4SCxPQUFPK0QsT0FBaEIsRUFBeUIsRUFBQyxVQUFVLElBQVgsRUFBekIsRUFBMkNlLE1BQWxEO0FBQ0QsR0FGRDs7QUFJQTlFLFNBQU8wTixXQUFQLEdBQXFCLFVBQVMzTCxJQUFULEVBQWM7QUFDakMsV0FBT2dELEVBQUV5QyxNQUFGLENBQVN4SCxPQUFPK0QsT0FBaEIsRUFBeUIsRUFBQyxRQUFRaEMsSUFBVCxFQUF6QixFQUF5QytDLE1BQWhEO0FBQ0QsR0FGRDs7QUFJQTlFLFNBQU8yTixhQUFQLEdBQXVCLFlBQVU7QUFDL0IsV0FBTzVJLEVBQUV5QyxNQUFGLENBQVN4SCxPQUFPK0QsT0FBaEIsRUFBd0IsRUFBQyxVQUFVLElBQVgsRUFBeEIsRUFBMENlLE1BQWpEO0FBQ0QsR0FGRDs7QUFJQTlFLFNBQU80TixRQUFQLEdBQWtCLFlBQVk7QUFDNUIsV0FBT25NLFFBQVFzRCxFQUFFeUMsTUFBRixDQUFTeEgsT0FBTytELE9BQWhCLEVBQXdCLEVBQUMsVUFBVSxFQUFDLFdBQVcsSUFBWixFQUFYLEVBQXhCLEVBQXVEZSxNQUEvRCxDQUFQO0FBQ0QsR0FGRDs7QUFJQTlFLFNBQU82TixVQUFQLEdBQW9CLFVBQVNySixPQUFULEVBQWtCVSxHQUFsQixFQUFzQjtBQUN0QyxRQUFJQSxJQUFJa0MsT0FBSixDQUFZLEtBQVosTUFBcUIsQ0FBekIsRUFBNEI7QUFDMUIsVUFBSTZGLFNBQVNsSSxFQUFFeUMsTUFBRixDQUFTeEgsT0FBTzRILFFBQVAsQ0FBZ0IrRCxNQUFoQixDQUF1QkksS0FBaEMsRUFBc0MsRUFBQytCLFVBQVU1SSxJQUFJNkksTUFBSixDQUFXLENBQVgsQ0FBWCxFQUF0QyxFQUFpRSxDQUFqRSxDQUFiO0FBQ0EsYUFBT2QsU0FBU0EsT0FBT2UsS0FBaEIsR0FBd0IsRUFBL0I7QUFDRCxLQUhELE1BR08sSUFBR3hOLFlBQVlxSSxLQUFaLENBQWtCckUsT0FBbEIsQ0FBSCxFQUE4QjtBQUNuQyxVQUFHaEUsWUFBWXFJLEtBQVosQ0FBa0JyRSxPQUFsQixFQUEyQixJQUEzQixLQUFvQyxNQUF2QyxFQUNFLE9BQU9VLElBQUlpQyxPQUFKLENBQVksR0FBWixFQUFnQixNQUFoQixDQUFQLENBREYsS0FHRSxPQUFPakMsSUFBSWlDLE9BQUosQ0FBWSxHQUFaLEVBQWdCLE1BQWhCLEVBQXdCQSxPQUF4QixDQUFnQyxHQUFoQyxFQUFvQyxNQUFwQyxDQUFQO0FBQ0gsS0FMTSxNQUtBO0FBQ0wsYUFBT2pDLEdBQVA7QUFDRDtBQUNKLEdBWkQ7O0FBY0FsRixTQUFPaU8sUUFBUCxHQUFrQixVQUFTL0ksR0FBVCxFQUFhZ0osU0FBYixFQUF1QjtBQUN2QyxRQUFJdEssU0FBU21CLEVBQUV5SSxJQUFGLENBQU94TixPQUFPK0QsT0FBZCxFQUF1QixVQUFTSCxNQUFULEVBQWdCO0FBQ2xELGFBQ0dBLE9BQU9ZLE9BQVAsQ0FBZVcsRUFBZixJQUFtQitJLFNBQXBCLEtBRUd0SyxPQUFPNEIsSUFBUCxDQUFZTixHQUFaLElBQWlCQSxHQUFsQixJQUNDdEIsT0FBTzRCLElBQVAsQ0FBWUMsR0FBWixJQUFpQlAsR0FEbEIsSUFFQ3RCLE9BQU9JLE1BQVAsQ0FBY2tCLEdBQWQsSUFBbUJBLEdBRnBCLElBR0N0QixPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNpQixHQUFkLElBQW1CQSxHQUhyQyxJQUlDLENBQUN0QixPQUFPSyxNQUFSLElBQWtCTCxPQUFPTSxJQUFQLENBQVlnQixHQUFaLElBQWlCQSxHQU50QyxDQURGO0FBVUQsS0FYWSxDQUFiO0FBWUEsV0FBT3RCLFVBQVUsS0FBakI7QUFDRCxHQWREOztBQWdCQTVELFNBQU9tTyxZQUFQLEdBQXNCLFVBQVN2SyxNQUFULEVBQWdCO0FBQ3BDLFFBQUduQyxRQUFRakIsWUFBWTROLFdBQVosQ0FBd0J4SyxPQUFPNEIsSUFBUCxDQUFZekQsSUFBcEMsRUFBMENzTSxPQUFsRCxDQUFILEVBQThEO0FBQzVEekssYUFBTzBDLElBQVAsQ0FBWThCLElBQVosR0FBbUIsR0FBbkI7QUFDRCxLQUZELE1BRU87QUFDTHhFLGFBQU8wQyxJQUFQLENBQVk4QixJQUFaLEdBQW1CLE1BQW5CO0FBQ0Q7QUFDRHhFLFdBQU80QixJQUFQLENBQVlDLEdBQVosR0FBa0IsRUFBbEI7QUFDQTdCLFdBQU80QixJQUFQLENBQVlFLEtBQVosR0FBb0IsRUFBcEI7QUFDRCxHQVJEOztBQVVBMUYsU0FBT3NPLFFBQVAsR0FBa0I7QUFDaEJDLFlBQVEsa0JBQU07QUFDWixVQUFJQyxrQkFBa0JoTyxZQUFZcUgsS0FBWixFQUF0QjtBQUNBN0gsYUFBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixHQUEyQkUsZ0JBQWdCRixRQUEzQztBQUNELEtBSmU7QUFLaEJqRCxhQUFTLG1CQUFNO0FBQ2JyTCxhQUFPNEgsUUFBUCxDQUFnQjBHLFFBQWhCLENBQXlCckcsTUFBekIsR0FBa0MsWUFBbEM7QUFDQXpILGtCQUFZOE4sUUFBWixHQUF1QkcsSUFBdkIsQ0FBNEJ6TyxPQUFPNEgsUUFBUCxDQUFnQjBHLFFBQTVDLEVBQ0doRCxJQURILENBQ1Esb0JBQVk7QUFDaEIsWUFBR1csU0FBU2hFLE1BQVQsSUFBbUIsR0FBbkIsSUFBMEJnRSxTQUFTaEUsTUFBVCxJQUFtQixHQUFoRCxFQUFvRDtBQUNsRHhELFlBQUUsY0FBRixFQUFrQmlLLFdBQWxCLENBQThCLFlBQTlCO0FBQ0ExTyxpQkFBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QnJHLE1BQXpCLEdBQWtDLFdBQWxDO0FBQ0E7QUFDQXpILHNCQUFZOE4sUUFBWixHQUF1QkssR0FBdkIsR0FDQ3JELElBREQsQ0FDTSxvQkFBWTtBQUNoQixnQkFBR1csU0FBU25ILE1BQVosRUFBbUI7QUFDakIsa0JBQUk2SixNQUFNLEdBQUdDLE1BQUgsQ0FBVUMsS0FBVixDQUFnQixFQUFoQixFQUFvQjVDLFFBQXBCLENBQVY7QUFDQWpNLHFCQUFPNEgsUUFBUCxDQUFnQjBHLFFBQWhCLENBQXlCSyxHQUF6QixHQUErQjVKLEVBQUV3SixNQUFGLENBQVNJLEdBQVQsRUFBYyxVQUFDRyxFQUFEO0FBQUEsdUJBQVFBLE1BQU0sV0FBZDtBQUFBLGVBQWQsQ0FBL0I7QUFDRDtBQUNGLFdBTkQ7QUFPRCxTQVhELE1BV087QUFDTHJLLFlBQUUsY0FBRixFQUFrQnNLLFFBQWxCLENBQTJCLFlBQTNCO0FBQ0EvTyxpQkFBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QnJHLE1BQXpCLEdBQWtDLG1CQUFsQztBQUNEO0FBQ0YsT0FqQkgsRUFrQkd1RCxLQWxCSCxDQWtCUyxlQUFPO0FBQ1ovRyxVQUFFLGNBQUYsRUFBa0JzSyxRQUFsQixDQUEyQixZQUEzQjtBQUNBL08sZUFBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QnJHLE1BQXpCLEdBQWtDLG1CQUFsQztBQUNELE9BckJIO0FBc0JELEtBN0JlO0FBOEJoQitHLFlBQVEsa0JBQU07QUFDWixVQUFJRixLQUFLOU8sT0FBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QlEsRUFBekIsSUFBK0IsYUFBV0csU0FBU0MsTUFBVCxDQUFnQixZQUFoQixDQUFuRDtBQUNBbFAsYUFBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QmEsT0FBekIsR0FBbUMsS0FBbkM7QUFDQTNPLGtCQUFZOE4sUUFBWixHQUF1QmMsUUFBdkIsQ0FBZ0NOLEVBQWhDLEVBQ0d4RCxJQURILENBQ1Esb0JBQVk7QUFDaEI7QUFDQSxZQUFHVyxTQUFTb0QsSUFBVCxJQUFpQnBELFNBQVNvRCxJQUFULENBQWNDLE9BQS9CLElBQTBDckQsU0FBU29ELElBQVQsQ0FBY0MsT0FBZCxDQUFzQnhLLE1BQW5FLEVBQTBFO0FBQ3hFOUUsaUJBQU80SCxRQUFQLENBQWdCMEcsUUFBaEIsQ0FBeUJRLEVBQXpCLEdBQThCQSxFQUE5QjtBQUNBOU8saUJBQU80SCxRQUFQLENBQWdCMEcsUUFBaEIsQ0FBeUJhLE9BQXpCLEdBQW1DLElBQW5DO0FBQ0ExSyxZQUFFLGVBQUYsRUFBbUJpSyxXQUFuQixDQUErQixZQUEvQjtBQUNBakssWUFBRSxlQUFGLEVBQW1CaUssV0FBbkIsQ0FBK0IsWUFBL0I7QUFDQTFPLGlCQUFPdVAsVUFBUDtBQUNELFNBTkQsTUFNTztBQUNMdlAsaUJBQU9xTSxlQUFQLENBQXVCLGtEQUF2QjtBQUNEO0FBQ0YsT0FaSCxFQWFHYixLQWJILENBYVMsZUFBTztBQUNaLFlBQUdDLElBQUl4RCxNQUFKLEtBQWV3RCxJQUFJeEQsTUFBSixJQUFjLEdBQWQsSUFBcUJ3RCxJQUFJeEQsTUFBSixJQUFjLEdBQWxELENBQUgsRUFBMEQ7QUFDeER4RCxZQUFFLGVBQUYsRUFBbUJzSyxRQUFuQixDQUE0QixZQUE1QjtBQUNBdEssWUFBRSxlQUFGLEVBQW1Cc0ssUUFBbkIsQ0FBNEIsWUFBNUI7QUFDQS9PLGlCQUFPcU0sZUFBUCxDQUF1QiwrQ0FBdkI7QUFDRCxTQUpELE1BSU8sSUFBR1osR0FBSCxFQUFPO0FBQ1p6TCxpQkFBT3FNLGVBQVAsQ0FBdUJaLEdBQXZCO0FBQ0QsU0FGTSxNQUVBO0FBQ0x6TCxpQkFBT3FNLGVBQVAsQ0FBdUIsa0RBQXZCO0FBQ0Q7QUFDRixPQXZCSDtBQXdCQTtBQXpEYyxHQUFsQjs7QUE0REFyTSxTQUFPOEgsR0FBUCxHQUFhO0FBQ1gwSCxlQUFXLHFCQUFNO0FBQ2YsYUFBUS9OLFFBQVF6QixPQUFPNEgsUUFBUCxDQUFnQkUsR0FBaEIsQ0FBb0JDLEtBQTVCLEtBQ050RyxRQUFRekIsT0FBTzRILFFBQVAsQ0FBZ0JFLEdBQWhCLENBQW9CRSxPQUE1QixDQURNLElBRU5oSSxPQUFPNEgsUUFBUCxDQUFnQkUsR0FBaEIsQ0FBb0JHLE1BQXBCLElBQThCLFdBRmhDO0FBSUQsS0FOVTtBQU9Yc0csWUFBUSxrQkFBTTtBQUNaLFVBQUlDLGtCQUFrQmhPLFlBQVlxSCxLQUFaLEVBQXRCO0FBQ0E3SCxhQUFPNEgsUUFBUCxDQUFnQkUsR0FBaEIsR0FBc0IwRyxnQkFBZ0IxRyxHQUF0QztBQUNELEtBVlU7QUFXWHVELGFBQVMsbUJBQU07QUFDYixVQUFHLENBQUM1SixRQUFRekIsT0FBTzRILFFBQVAsQ0FBZ0JFLEdBQWhCLENBQW9CQyxLQUE1QixDQUFELElBQXVDLENBQUN0RyxRQUFRekIsT0FBTzRILFFBQVAsQ0FBZ0JFLEdBQWhCLENBQW9CRSxPQUE1QixDQUEzQyxFQUNFO0FBQ0ZoSSxhQUFPNEgsUUFBUCxDQUFnQkUsR0FBaEIsQ0FBb0JHLE1BQXBCLEdBQTZCLFlBQTdCO0FBQ0EsYUFBT3pILFlBQVlzSCxHQUFaLEdBQWtCdUYsSUFBbEIsR0FDSi9CLElBREksQ0FDQyxvQkFBWTtBQUNoQnRMLGVBQU80SCxRQUFQLENBQWdCRSxHQUFoQixDQUFvQkcsTUFBcEIsR0FBNkIsV0FBN0I7QUFDRCxPQUhJLEVBSUp1RCxLQUpJLENBSUUsZUFBTztBQUNaaUUsZ0JBQVE1TSxLQUFSLENBQWM0SSxHQUFkO0FBQ0F6TCxlQUFPNEgsUUFBUCxDQUFnQkUsR0FBaEIsQ0FBb0JHLE1BQXBCLEdBQTZCLG1CQUE3QjtBQUNELE9BUEksQ0FBUDtBQVFEO0FBdkJVLEdBQWI7O0FBMEJBakksU0FBTzBQLFlBQVAsR0FBc0IsVUFBU0MsWUFBVCxFQUFzQkMsSUFBdEIsRUFBMkI7O0FBRTdDO0FBQ0EsUUFBSUMsb0JBQW9CclAsWUFBWXNQLFNBQVosQ0FBc0JILFlBQXRCLENBQXhCO0FBQ0EsUUFBSUksT0FBSjtBQUFBLFFBQWE3RyxTQUFTLElBQXRCOztBQUVBLFFBQUd6SCxRQUFRb08saUJBQVIsQ0FBSCxFQUE4QjtBQUM1QixVQUFJRyxPQUFPLElBQUlDLElBQUosRUFBWDtBQUNBRixnQkFBVUMsS0FBS0UsWUFBTCxDQUFtQkwsaUJBQW5CLENBQVY7QUFDRDs7QUFFRCxRQUFHLENBQUNFLE9BQUosRUFDRSxPQUFPL1AsT0FBT21RLGNBQVAsR0FBd0IsS0FBL0I7O0FBRUYsUUFBR1AsUUFBTSxNQUFULEVBQWdCO0FBQ2QsVUFBR25PLFFBQVFzTyxRQUFRSyxPQUFoQixLQUE0QjNPLFFBQVFzTyxRQUFRSyxPQUFSLENBQWdCQyxJQUFoQixDQUFxQkMsTUFBN0IsQ0FBL0IsRUFDRXBILFNBQVM2RyxRQUFRSyxPQUFSLENBQWdCQyxJQUFoQixDQUFxQkMsTUFBOUIsQ0FERixLQUVLLElBQUc3TyxRQUFRc08sUUFBUVEsVUFBaEIsS0FBK0I5TyxRQUFRc08sUUFBUVEsVUFBUixDQUFtQkYsSUFBbkIsQ0FBd0JDLE1BQWhDLENBQWxDLEVBQ0hwSCxTQUFTNkcsUUFBUVEsVUFBUixDQUFtQkYsSUFBbkIsQ0FBd0JDLE1BQWpDO0FBQ0YsVUFBR3BILE1BQUgsRUFDRUEsU0FBUzFJLFlBQVlnUSxlQUFaLENBQTRCdEgsTUFBNUIsQ0FBVCxDQURGLEtBR0UsT0FBT2xKLE9BQU9tUSxjQUFQLEdBQXdCLEtBQS9CO0FBQ0gsS0FURCxNQVNPLElBQUdQLFFBQU0sS0FBVCxFQUFlO0FBQ3BCLFVBQUduTyxRQUFRc08sUUFBUVUsT0FBaEIsS0FBNEJoUCxRQUFRc08sUUFBUVUsT0FBUixDQUFnQkMsTUFBeEIsQ0FBL0IsRUFDRXhILFNBQVM2RyxRQUFRVSxPQUFSLENBQWdCQyxNQUF6QjtBQUNGLFVBQUd4SCxNQUFILEVBQ0VBLFNBQVMxSSxZQUFZbVEsYUFBWixDQUEwQnpILE1BQTFCLENBQVQsQ0FERixLQUdFLE9BQU9sSixPQUFPbVEsY0FBUCxHQUF3QixLQUEvQjtBQUNIOztBQUVELFFBQUcsQ0FBQ2pILE1BQUosRUFDRSxPQUFPbEosT0FBT21RLGNBQVAsR0FBd0IsS0FBL0I7O0FBRUYsUUFBRzFPLFFBQVF5SCxPQUFPSSxFQUFmLENBQUgsRUFDRXRKLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJJLEVBQXZCLEdBQTRCSixPQUFPSSxFQUFuQztBQUNGLFFBQUc3SCxRQUFReUgsT0FBT0ssRUFBZixDQUFILEVBQ0V2SixPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCSyxFQUF2QixHQUE0QkwsT0FBT0ssRUFBbkM7O0FBRUZ2SixXQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCL0gsSUFBdkIsR0FBOEIrSCxPQUFPL0gsSUFBckM7QUFDQW5CLFdBQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUIwSCxRQUF2QixHQUFrQzFILE9BQU8wSCxRQUF6QztBQUNBNVEsV0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QkcsR0FBdkIsR0FBNkJILE9BQU9HLEdBQXBDO0FBQ0FySixXQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCMkgsR0FBdkIsR0FBNkIzSCxPQUFPMkgsR0FBcEM7QUFDQTdRLFdBQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUI0SCxJQUF2QixHQUE4QjVILE9BQU80SCxJQUFyQztBQUNBOVEsV0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QjZILE1BQXZCLEdBQWdDN0gsT0FBTzZILE1BQXZDOztBQUVBLFFBQUc3SCxPQUFPM0csTUFBUCxDQUFjdUMsTUFBakIsRUFBd0I7QUFDdEI7QUFDQTlFLGFBQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUIzRyxNQUF2QixHQUFnQyxFQUFoQztBQUNBd0MsUUFBRUMsSUFBRixDQUFPa0UsT0FBTzNHLE1BQWQsRUFBcUIsVUFBU3lPLEtBQVQsRUFBZTtBQUNsQyxZQUFHaFIsT0FBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QjNHLE1BQXZCLENBQThCdUMsTUFBOUIsSUFDREMsRUFBRXlDLE1BQUYsQ0FBU3hILE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUIzRyxNQUFoQyxFQUF3QyxFQUFDcEIsTUFBTTZQLE1BQU1DLEtBQWIsRUFBeEMsRUFBNkRuTSxNQUQvRCxFQUNzRTtBQUNwRUMsWUFBRXlDLE1BQUYsQ0FBU3hILE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUIzRyxNQUFoQyxFQUF3QyxFQUFDcEIsTUFBTTZQLE1BQU1DLEtBQWIsRUFBeEMsRUFBNkQsQ0FBN0QsRUFBZ0VDLE1BQWhFLElBQTBFNUosV0FBVzBKLE1BQU1FLE1BQWpCLENBQTFFO0FBQ0QsU0FIRCxNQUdPO0FBQ0xsUixpQkFBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QjNHLE1BQXZCLENBQThCMEMsSUFBOUIsQ0FBbUM7QUFDakM5RCxrQkFBTTZQLE1BQU1DLEtBRHFCLEVBQ2RDLFFBQVE1SixXQUFXMEosTUFBTUUsTUFBakI7QUFETSxXQUFuQztBQUdEO0FBQ0YsT0FURDtBQVVBO0FBQ0EsVUFBSXROLFNBQVNtQixFQUFFeUMsTUFBRixDQUFTeEgsT0FBTytELE9BQWhCLEVBQXdCLEVBQUNoQyxNQUFLLE9BQU4sRUFBeEIsRUFBd0MsQ0FBeEMsQ0FBYjtBQUNBLFVBQUc2QixNQUFILEVBQVc7QUFDVEEsZUFBT3lDLE1BQVAsR0FBZ0IsRUFBaEI7QUFDQXRCLFVBQUVDLElBQUYsQ0FBT2tFLE9BQU8zRyxNQUFkLEVBQXFCLFVBQVN5TyxLQUFULEVBQWU7QUFDbEMsY0FBR3BOLE1BQUgsRUFBVTtBQUNSNUQsbUJBQU9tUixRQUFQLENBQWdCdk4sTUFBaEIsRUFBdUI7QUFDckJxTixxQkFBT0QsTUFBTUMsS0FEUTtBQUVyQmpPLG1CQUFLZ08sTUFBTWhPLEdBRlU7QUFHckJvTyxxQkFBT0osTUFBTUk7QUFIUSxhQUF2QjtBQUtEO0FBQ0YsU0FSRDtBQVNEO0FBQ0Y7O0FBRUQsUUFBR2xJLE9BQU81RyxJQUFQLENBQVl3QyxNQUFmLEVBQXNCO0FBQ3BCO0FBQ0E5RSxhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCNUcsSUFBdkIsR0FBOEIsRUFBOUI7QUFDQXlDLFFBQUVDLElBQUYsQ0FBT2tFLE9BQU81RyxJQUFkLEVBQW1CLFVBQVMrTyxHQUFULEVBQWE7QUFDOUIsWUFBR3JSLE9BQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUI1RyxJQUF2QixDQUE0QndDLE1BQTVCLElBQ0RDLEVBQUV5QyxNQUFGLENBQVN4SCxPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCNUcsSUFBaEMsRUFBc0MsRUFBQ25CLE1BQU1rUSxJQUFJSixLQUFYLEVBQXRDLEVBQXlEbk0sTUFEM0QsRUFDa0U7QUFDaEVDLFlBQUV5QyxNQUFGLENBQVN4SCxPQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCNUcsSUFBaEMsRUFBc0MsRUFBQ25CLE1BQU1rUSxJQUFJSixLQUFYLEVBQXRDLEVBQXlELENBQXpELEVBQTREQyxNQUE1RCxJQUFzRTVKLFdBQVcrSixJQUFJSCxNQUFmLENBQXRFO0FBQ0QsU0FIRCxNQUdPO0FBQ0xsUixpQkFBTzRILFFBQVAsQ0FBZ0JzQixNQUFoQixDQUF1QjVHLElBQXZCLENBQTRCMkMsSUFBNUIsQ0FBaUM7QUFDL0I5RCxrQkFBTWtRLElBQUlKLEtBRHFCLEVBQ2RDLFFBQVE1SixXQUFXK0osSUFBSUgsTUFBZjtBQURNLFdBQWpDO0FBR0Q7QUFDRixPQVREO0FBVUE7QUFDQSxVQUFJdE4sU0FBU21CLEVBQUV5QyxNQUFGLENBQVN4SCxPQUFPK0QsT0FBaEIsRUFBd0IsRUFBQ2hDLE1BQUssS0FBTixFQUF4QixFQUFzQyxDQUF0QyxDQUFiO0FBQ0EsVUFBRzZCLE1BQUgsRUFBVztBQUNUQSxlQUFPeUMsTUFBUCxHQUFnQixFQUFoQjtBQUNBdEIsVUFBRUMsSUFBRixDQUFPa0UsT0FBTzVHLElBQWQsRUFBbUIsVUFBUytPLEdBQVQsRUFBYTtBQUM5QixjQUFHek4sTUFBSCxFQUFVO0FBQ1I1RCxtQkFBT21SLFFBQVAsQ0FBZ0J2TixNQUFoQixFQUF1QjtBQUNyQnFOLHFCQUFPSSxJQUFJSixLQURVO0FBRXJCak8sbUJBQUtxTyxJQUFJck8sR0FGWTtBQUdyQm9PLHFCQUFPQyxJQUFJRDtBQUhVLGFBQXZCO0FBS0Q7QUFDRixTQVJEO0FBU0Q7QUFDRjtBQUNELFFBQUdsSSxPQUFPb0ksSUFBUCxDQUFZeE0sTUFBZixFQUFzQjtBQUNwQjtBQUNBLFVBQUlsQixTQUFTbUIsRUFBRXlDLE1BQUYsQ0FBU3hILE9BQU8rRCxPQUFoQixFQUF3QixFQUFDaEMsTUFBSyxPQUFOLEVBQXhCLEVBQXdDLENBQXhDLENBQWI7QUFDQSxVQUFHNkIsTUFBSCxFQUFVO0FBQ1JBLGVBQU95QyxNQUFQLEdBQWdCLEVBQWhCO0FBQ0F0QixVQUFFQyxJQUFGLENBQU9rRSxPQUFPb0ksSUFBZCxFQUFtQixVQUFTQSxJQUFULEVBQWM7QUFDL0J0UixpQkFBT21SLFFBQVAsQ0FBZ0J2TixNQUFoQixFQUF1QjtBQUNyQnFOLG1CQUFPSyxLQUFLTCxLQURTO0FBRXJCak8saUJBQUtzTyxLQUFLdE8sR0FGVztBQUdyQm9PLG1CQUFPRSxLQUFLRjtBQUhTLFdBQXZCO0FBS0QsU0FORDtBQU9EO0FBQ0Y7QUFDRCxRQUFHbEksT0FBT3FJLEtBQVAsQ0FBYXpNLE1BQWhCLEVBQXVCO0FBQ3JCO0FBQ0E5RSxhQUFPNEgsUUFBUCxDQUFnQnNCLE1BQWhCLENBQXVCcUksS0FBdkIsR0FBK0IsRUFBL0I7QUFDQXhNLFFBQUVDLElBQUYsQ0FBT2tFLE9BQU9xSSxLQUFkLEVBQW9CLFVBQVNBLEtBQVQsRUFBZTtBQUNqQ3ZSLGVBQU80SCxRQUFQLENBQWdCc0IsTUFBaEIsQ0FBdUJxSSxLQUF2QixDQUE2QnRNLElBQTdCLENBQWtDO0FBQ2hDOUQsZ0JBQU1vUSxNQUFNcFE7QUFEb0IsU0FBbEM7QUFHRCxPQUpEO0FBS0Q7QUFDRG5CLFdBQU9tUSxjQUFQLEdBQXdCLElBQXhCO0FBQ0gsR0FoSUQ7O0FBa0lBblEsU0FBT3dSLFVBQVAsR0FBb0IsWUFBVTtBQUM1QixRQUFHLENBQUN4UixPQUFPeVIsTUFBWCxFQUFrQjtBQUNoQmpSLGtCQUFZaVIsTUFBWixHQUFxQm5HLElBQXJCLENBQTBCLFVBQVNXLFFBQVQsRUFBa0I7QUFDMUNqTSxlQUFPeVIsTUFBUCxHQUFnQnhGLFFBQWhCO0FBQ0QsT0FGRDtBQUdEO0FBQ0YsR0FORDs7QUFRQWpNLFNBQU8wUixVQUFQLEdBQW9CLFlBQVU7QUFDNUIsUUFBSTFTLFNBQVMsRUFBYjtBQUNBLFFBQUcsQ0FBQ2dCLE9BQU8wQyxHQUFYLEVBQWU7QUFDYjFELGFBQU9pRyxJQUFQLENBQ0V6RSxZQUFZa0MsR0FBWixHQUFrQjRJLElBQWxCLENBQXVCLFVBQVNXLFFBQVQsRUFBa0I7QUFDdkNqTSxlQUFPMEMsR0FBUCxHQUFhdUosUUFBYjtBQUNELE9BRkQsQ0FERjtBQUtEOztBQUVELFFBQUcsQ0FBQ2pNLE9BQU91QyxNQUFYLEVBQWtCO0FBQ2hCdkQsYUFBT2lHLElBQVAsQ0FDRXpFLFlBQVkrQixNQUFaLEdBQXFCK0ksSUFBckIsQ0FBMEIsVUFBU1csUUFBVCxFQUFrQjtBQUMxQyxlQUFPak0sT0FBT3VDLE1BQVAsR0FBZ0J3QyxFQUFFNE0sTUFBRixDQUFTNU0sRUFBRTZNLE1BQUYsQ0FBUzNGLFFBQVQsRUFBa0IsTUFBbEIsQ0FBVCxFQUFtQyxNQUFuQyxDQUF2QjtBQUNELE9BRkQsQ0FERjtBQUtEOztBQUVELFFBQUcsQ0FBQ2pNLE9BQU9zQyxJQUFYLEVBQWdCO0FBQ2R0RCxhQUFPaUcsSUFBUCxDQUNFekUsWUFBWThCLElBQVosR0FBbUJnSixJQUFuQixDQUF3QixVQUFTVyxRQUFULEVBQWtCO0FBQ3hDLGVBQU9qTSxPQUFPc0MsSUFBUCxHQUFjeUMsRUFBRTRNLE1BQUYsQ0FBUzVNLEVBQUU2TSxNQUFGLENBQVMzRixRQUFULEVBQWtCLE1BQWxCLENBQVQsRUFBbUMsTUFBbkMsQ0FBckI7QUFDRCxPQUZELENBREY7QUFLRDs7QUFFRCxRQUFHLENBQUNqTSxPQUFPd0MsS0FBWCxFQUFpQjtBQUNmeEQsYUFBT2lHLElBQVAsQ0FDRXpFLFlBQVlnQyxLQUFaLEdBQW9COEksSUFBcEIsQ0FBeUIsVUFBU1csUUFBVCxFQUFrQjtBQUN6QyxlQUFPak0sT0FBT3dDLEtBQVAsR0FBZXVDLEVBQUU0TSxNQUFGLENBQVM1TSxFQUFFNk0sTUFBRixDQUFTM0YsUUFBVCxFQUFrQixNQUFsQixDQUFULEVBQW1DLE1BQW5DLENBQXRCO0FBQ0QsT0FGRCxDQURGO0FBS0Q7O0FBRUQsUUFBRyxDQUFDak0sT0FBT3lDLFFBQVgsRUFBb0I7QUFDbEJ6RCxhQUFPaUcsSUFBUCxDQUNFekUsWUFBWWlDLFFBQVosR0FBdUI2SSxJQUF2QixDQUE0QixVQUFTVyxRQUFULEVBQWtCO0FBQzVDLGVBQU9qTSxPQUFPeUMsUUFBUCxHQUFrQndKLFFBQXpCO0FBQ0QsT0FGRCxDQURGO0FBS0Q7O0FBRUQsV0FBTzVMLEdBQUd3UixHQUFILENBQU83UyxNQUFQLENBQVA7QUFDSCxHQTNDQzs7QUE2Q0E7QUFDQWdCLFNBQU84UixJQUFQLEdBQWMsWUFBTTtBQUNsQnJOLE1BQUUseUJBQUYsRUFBNkJpRyxPQUE3QixDQUFxQztBQUNuQ3FILGdCQUFVLE1BRHlCO0FBRW5DQyxpQkFBVyxPQUZ3QjtBQUduQ25SLFlBQU07QUFINkIsS0FBckM7QUFLQSxRQUFHNEQsRUFBRSxjQUFGLEVBQWtCd04sSUFBbEIsTUFBNEIsWUFBL0IsRUFBNEM7QUFDMUN4TixRQUFFLFlBQUYsRUFBZ0J5TixJQUFoQjtBQUNEOztBQUVEbk4sTUFBRUMsSUFBRixDQUFPaEYsT0FBTytELE9BQWQsRUFBdUIsa0JBQVU7QUFDN0I7QUFDQUgsYUFBTzBDLElBQVAsQ0FBWUcsR0FBWixHQUFrQjdDLE9BQU80QixJQUFQLENBQVksUUFBWixJQUFzQjVCLE9BQU80QixJQUFQLENBQVksTUFBWixDQUF0QixHQUEwQyxFQUE1RDtBQUNBO0FBQ0EsVUFBRy9ELFFBQVFtQyxPQUFPeUMsTUFBZixLQUEwQnpDLE9BQU95QyxNQUFQLENBQWN2QixNQUEzQyxFQUFrRDtBQUNoREMsVUFBRUMsSUFBRixDQUFPcEIsT0FBT3lDLE1BQWQsRUFBc0IsaUJBQVM7QUFDN0IsY0FBRzhMLE1BQU05TixPQUFULEVBQWlCO0FBQ2Y4TixrQkFBTTlOLE9BQU4sR0FBZ0IsS0FBaEI7QUFDQXJFLG1CQUFPb1MsVUFBUCxDQUFrQkQsS0FBbEIsRUFBd0J2TyxNQUF4QjtBQUNELFdBSEQsTUFHTyxJQUFHLENBQUN1TyxNQUFNOU4sT0FBUCxJQUFrQjhOLE1BQU1FLEtBQTNCLEVBQWlDO0FBQ3RDbFMscUJBQVMsWUFBTTtBQUNiSCxxQkFBT29TLFVBQVAsQ0FBa0JELEtBQWxCLEVBQXdCdk8sTUFBeEI7QUFDRCxhQUZELEVBRUUsS0FGRjtBQUdELFdBSk0sTUFJQSxJQUFHdU8sTUFBTUcsRUFBTixJQUFZSCxNQUFNRyxFQUFOLENBQVNqTyxPQUF4QixFQUFnQztBQUNyQzhOLGtCQUFNRyxFQUFOLENBQVNqTyxPQUFULEdBQW1CLEtBQW5CO0FBQ0FyRSxtQkFBT29TLFVBQVAsQ0FBa0JELE1BQU1HLEVBQXhCO0FBQ0Q7QUFDRixTQVpEO0FBYUQ7QUFDRHRTLGFBQU91UyxjQUFQLENBQXNCM08sTUFBdEI7QUFDRCxLQXBCSDs7QUFzQkUsV0FBTyxJQUFQO0FBQ0gsR0FqQ0Q7O0FBbUNBNUQsU0FBT3FNLGVBQVAsR0FBeUIsVUFBU1osR0FBVCxFQUFjN0gsTUFBZCxFQUFzQjVDLFFBQXRCLEVBQStCO0FBQ3BELFFBQUk4QixPQUFKOztBQUVBLFFBQUcsT0FBTzJJLEdBQVAsSUFBYyxRQUFkLElBQTBCQSxJQUFJckUsT0FBSixDQUFZLEdBQVosTUFBcUIsQ0FBQyxDQUFuRCxFQUFxRDtBQUNuRCxVQUFHLENBQUNMLE9BQU95TCxJQUFQLENBQVkvRyxHQUFaLEVBQWlCM0csTUFBckIsRUFBNkI7QUFDN0IyRyxZQUFNZ0IsS0FBS0MsS0FBTCxDQUFXakIsR0FBWCxDQUFOO0FBQ0EsVUFBRyxDQUFDMUUsT0FBT3lMLElBQVAsQ0FBWS9HLEdBQVosRUFBaUIzRyxNQUFyQixFQUE2QjtBQUM5Qjs7QUFFRCxRQUFHLE9BQU8yRyxHQUFQLElBQWMsUUFBakIsRUFDRTNJLFVBQVUySSxHQUFWLENBREYsS0FFSyxJQUFHaEssUUFBUWdLLElBQUlnSCxVQUFaLENBQUgsRUFDSDNQLFVBQVUySSxJQUFJZ0gsVUFBZCxDQURHLEtBRUEsSUFBR2hILElBQUl6TSxNQUFKLElBQWN5TSxJQUFJek0sTUFBSixDQUFXYSxHQUE1QixFQUNIaUQsVUFBVTJJLElBQUl6TSxNQUFKLENBQVdhLEdBQXJCLENBREcsS0FFQSxJQUFHNEwsSUFBSS9FLE9BQVAsRUFBZTtBQUNsQixVQUFHOUMsTUFBSCxFQUNFQSxPQUFPZCxPQUFQLENBQWU0RCxPQUFmLEdBQXlCK0UsSUFBSS9FLE9BQTdCO0FBQ0gsS0FISSxNQUdFO0FBQ0w1RCxnQkFBVTJKLEtBQUtpRyxTQUFMLENBQWVqSCxHQUFmLENBQVY7QUFDQSxVQUFHM0ksV0FBVyxJQUFkLEVBQW9CQSxVQUFVLEVBQVY7QUFDckI7O0FBRUQsUUFBR3JCLFFBQVFxQixPQUFSLENBQUgsRUFBb0I7QUFDbEIsVUFBR2MsTUFBSCxFQUFVO0FBQ1JBLGVBQU9kLE9BQVAsQ0FBZWYsSUFBZixHQUFzQixRQUF0QjtBQUNBNkIsZUFBT2QsT0FBUCxDQUFlNkQsS0FBZixHQUFxQixDQUFyQjtBQUNBL0MsZUFBT2QsT0FBUCxDQUFlQSxPQUFmLEdBQXlCdkMsS0FBS29TLFdBQUwsd0JBQXNDN1AsT0FBdEMsQ0FBekI7QUFDQSxZQUFHOUIsUUFBSCxFQUNFNEMsT0FBT2QsT0FBUCxDQUFlOUIsUUFBZixHQUEwQkEsUUFBMUI7QUFDRmhCLGVBQU80UyxtQkFBUCxDQUEyQixFQUFDaFAsUUFBT0EsTUFBUixFQUEzQixFQUE0Q2QsT0FBNUM7QUFDQTlDLGVBQU91UyxjQUFQLENBQXNCM08sTUFBdEI7QUFDRCxPQVJELE1BUU87QUFDTDVELGVBQU82QyxLQUFQLENBQWFDLE9BQWIsR0FBdUJ2QyxLQUFLb1MsV0FBTCxhQUEyQjdQLE9BQTNCLENBQXZCO0FBQ0Q7QUFDRixLQVpELE1BWU8sSUFBR2MsTUFBSCxFQUFVO0FBQ2ZBLGFBQU9kLE9BQVAsQ0FBZTZELEtBQWYsR0FBcUIsQ0FBckI7QUFDQS9DLGFBQU9kLE9BQVAsQ0FBZUEsT0FBZixHQUF5QnZDLEtBQUtvUyxXQUFMLDBCQUF3Q25TLFlBQVlxUyxNQUFaLENBQW1CalAsT0FBT1ksT0FBMUIsQ0FBeEMsQ0FBekI7QUFDQXhFLGFBQU80UyxtQkFBUCxDQUEyQixFQUFDaFAsUUFBT0EsTUFBUixFQUEzQixFQUE0Q0EsT0FBT2QsT0FBUCxDQUFlQSxPQUEzRDtBQUNELEtBSk0sTUFJQTtBQUNMOUMsYUFBTzZDLEtBQVAsQ0FBYUMsT0FBYixHQUF1QnZDLEtBQUtvUyxXQUFMLENBQWlCLG1CQUFqQixDQUF2QjtBQUNEO0FBRUosR0EzQ0Q7QUE0Q0EzUyxTQUFPNFMsbUJBQVAsR0FBNkIsVUFBUzNHLFFBQVQsRUFBbUJwSixLQUFuQixFQUF5QjtBQUNwRCxRQUFJMkIsVUFBVU8sRUFBRXlDLE1BQUYsQ0FBU3hILE9BQU80SCxRQUFQLENBQWdCZ0IsUUFBekIsRUFBbUMsRUFBQ3pELElBQUk4RyxTQUFTckksTUFBVCxDQUFnQlksT0FBaEIsQ0FBd0JXLEVBQTdCLEVBQW5DLENBQWQ7QUFDQSxRQUFHWCxRQUFRTSxNQUFYLEVBQWtCO0FBQ2hCTixjQUFRLENBQVIsRUFBV3lELE1BQVgsQ0FBa0JnRCxFQUFsQixHQUF1QixJQUFJTCxJQUFKLEVBQXZCO0FBQ0EsVUFBR3FCLFNBQVM2RyxjQUFaLEVBQ0V0TyxRQUFRLENBQVIsRUFBV2tDLE9BQVgsR0FBcUJ1RixTQUFTNkcsY0FBOUI7QUFDRixVQUFHalEsS0FBSCxFQUNFMkIsUUFBUSxDQUFSLEVBQVd5RCxNQUFYLENBQWtCcEYsS0FBbEIsR0FBMEJBLEtBQTFCLENBREYsS0FHRTJCLFFBQVEsQ0FBUixFQUFXeUQsTUFBWCxDQUFrQnBGLEtBQWxCLEdBQTBCLEVBQTFCO0FBQ0Q7QUFDSixHQVhEOztBQWFBN0MsU0FBT3VQLFVBQVAsR0FBb0IsVUFBUzNMLE1BQVQsRUFBZ0I7QUFDbEMsUUFBR0EsTUFBSCxFQUFXO0FBQ1RBLGFBQU9kLE9BQVAsQ0FBZTZELEtBQWYsR0FBcUIsQ0FBckI7QUFDQS9DLGFBQU9kLE9BQVAsQ0FBZUEsT0FBZixHQUF5QnZDLEtBQUtvUyxXQUFMLENBQWlCLEVBQWpCLENBQXpCO0FBQ0EzUyxhQUFPNFMsbUJBQVAsQ0FBMkIsRUFBQ2hQLFFBQU9BLE1BQVIsRUFBM0I7QUFDRCxLQUpELE1BSU87QUFDTDVELGFBQU82QyxLQUFQLENBQWFkLElBQWIsR0FBb0IsUUFBcEI7QUFDQS9CLGFBQU82QyxLQUFQLENBQWFDLE9BQWIsR0FBdUJ2QyxLQUFLb1MsV0FBTCxDQUFpQixFQUFqQixDQUF2QjtBQUNEO0FBQ0YsR0FURDs7QUFXQTNTLFNBQU8rUyxVQUFQLEdBQW9CLFVBQVM5RyxRQUFULEVBQW1CckksTUFBbkIsRUFBMEI7QUFDNUMsUUFBRyxDQUFDcUksUUFBSixFQUFhO0FBQ1gsYUFBTyxLQUFQO0FBQ0Q7O0FBRURqTSxXQUFPdVAsVUFBUCxDQUFrQjNMLE1BQWxCO0FBQ0E7QUFDQUEsV0FBTzBKLEdBQVAsR0FBYTFKLE9BQU96QyxJQUFwQjtBQUNBLFFBQUk2UixRQUFRLEVBQVo7QUFDQTtBQUNBLFFBQUlsQyxPQUFPLElBQUlsRyxJQUFKLEVBQVg7QUFDQTtBQUNBcUIsYUFBU3pHLElBQVQsR0FBZ0I4QixXQUFXMkUsU0FBU3pHLElBQXBCLENBQWhCO0FBQ0F5RyxhQUFTL0YsR0FBVCxHQUFlb0IsV0FBVzJFLFNBQVMvRixHQUFwQixDQUFmO0FBQ0EsUUFBRytGLFNBQVM5RixLQUFaLEVBQ0U4RixTQUFTOUYsS0FBVCxHQUFpQm1CLFdBQVcyRSxTQUFTOUYsS0FBcEIsQ0FBakI7O0FBRUYsUUFBRzFFLFFBQVFtQyxPQUFPNEIsSUFBUCxDQUFZdEUsT0FBcEIsQ0FBSCxFQUNFMEMsT0FBTzRCLElBQVAsQ0FBWU8sUUFBWixHQUF1Qm5DLE9BQU80QixJQUFQLENBQVl0RSxPQUFuQztBQUNGO0FBQ0EwQyxXQUFPNEIsSUFBUCxDQUFZTSxRQUFaLEdBQXdCOUYsT0FBTzRILFFBQVAsQ0FBZ0JNLE9BQWhCLENBQXdCRSxJQUF4QixJQUFnQyxHQUFqQyxHQUNyQmxJLFFBQVEsY0FBUixFQUF3QitMLFNBQVN6RyxJQUFqQyxDQURxQixHQUVyQnRGLFFBQVEsT0FBUixFQUFpQitMLFNBQVN6RyxJQUExQixFQUFnQyxDQUFoQyxDQUZGOztBQUlBO0FBQ0E1QixXQUFPNEIsSUFBUCxDQUFZdEUsT0FBWixHQUFzQmhCLFFBQVEsT0FBUixFQUFpQm9ILFdBQVcxRCxPQUFPNEIsSUFBUCxDQUFZTSxRQUF2QixJQUFtQ3dCLFdBQVcxRCxPQUFPNEIsSUFBUCxDQUFZUSxNQUF2QixDQUFwRCxFQUFvRixDQUFwRixDQUF0QjtBQUNBO0FBQ0FwQyxXQUFPNEIsSUFBUCxDQUFZVSxHQUFaLEdBQWtCK0YsU0FBUy9GLEdBQTNCO0FBQ0F0QyxXQUFPNEIsSUFBUCxDQUFZVyxLQUFaLEdBQW9COEYsU0FBUzlGLEtBQTdCOztBQUVBO0FBQ0EsUUFBSXZDLE9BQU80QixJQUFQLENBQVl6RCxJQUFaLElBQW9CLFFBQXBCLElBQ0Y2QixPQUFPNEIsSUFBUCxDQUFZekQsSUFBWixJQUFvQixRQURsQixJQUVGLENBQUM2QixPQUFPNEIsSUFBUCxDQUFZVyxLQUZYLElBR0YsQ0FBQ3ZDLE9BQU80QixJQUFQLENBQVlVLEdBSGYsRUFHbUI7QUFDZmxHLGFBQU9xTSxlQUFQLENBQXVCLHlCQUF2QixFQUFrRHpJLE1BQWxEO0FBQ0Y7QUFDRCxLQU5ELE1BTU8sSUFBR0EsT0FBTzRCLElBQVAsQ0FBWXpELElBQVosSUFBb0IsU0FBcEIsSUFDUmtLLFNBQVN6RyxJQUFULElBQWlCLENBQUMsR0FEYixFQUNpQjtBQUNwQnhGLGFBQU9xTSxlQUFQLENBQXVCLHlCQUF2QixFQUFrRHpJLE1BQWxEO0FBQ0Y7QUFDRDs7QUFFRDtBQUNBLFFBQUdBLE9BQU93QyxNQUFQLENBQWN0QixNQUFkLEdBQXVCekQsVUFBMUIsRUFBcUM7QUFDbkNyQixhQUFPK0QsT0FBUCxDQUFld0csR0FBZixDQUFtQixVQUFDekcsQ0FBRCxFQUFPO0FBQ3hCLGVBQU9BLEVBQUVzQyxNQUFGLENBQVM2TSxLQUFULEVBQVA7QUFDRCxPQUZEO0FBR0Q7O0FBRUQ7QUFDQTtBQUNBLFFBQUksT0FBT2hILFNBQVNvQyxPQUFoQixJQUEyQixXQUEvQixFQUEyQztBQUN6Q3pLLGFBQU95SyxPQUFQLEdBQWlCbk8sUUFBUSxPQUFSLEVBQWlCK0wsU0FBU29DLE9BQTFCLEVBQWtDLENBQWxDLENBQWpCO0FBQ0Q7QUFDRCxRQUFJLE9BQU9wQyxTQUFTaUgsUUFBaEIsSUFBNEIsV0FBaEMsRUFBNEM7QUFDMUN0UCxhQUFPeUssT0FBUCxHQUFpQm5PLFFBQVEsT0FBUixFQUFpQitMLFNBQVNpSCxRQUExQixFQUFtQyxDQUFuQyxDQUFqQjtBQUNEO0FBQ0Q7QUFDQSxRQUFJLE9BQU9qSCxTQUFTa0gsUUFBaEIsSUFBNEIsV0FBaEMsRUFBNEM7QUFDMUN2UCxhQUFPdVAsUUFBUCxHQUFrQmxILFNBQVNrSCxRQUEzQjtBQUNEO0FBQ0QsUUFBSSxPQUFPbEgsU0FBU21ILFFBQWhCLElBQTRCLFdBQWhDLEVBQTRDO0FBQzFDO0FBQ0F4UCxhQUFPd1AsUUFBUCxHQUFrQm5ILFNBQVNtSCxRQUFULEdBQW9CLFFBQXRDO0FBQ0Q7QUFDRCxRQUFJLE9BQU9uSCxTQUFTb0gsT0FBaEIsSUFBMkIsV0FBL0IsRUFBMkM7QUFDekM7QUFDQXpQLGFBQU95UCxPQUFQLEdBQWlCcEgsU0FBU29ILE9BQTFCO0FBQ0Q7O0FBRURyVCxXQUFPdVMsY0FBUCxDQUFzQjNPLE1BQXRCO0FBQ0E1RCxXQUFPNFMsbUJBQVAsQ0FBMkIsRUFBQ2hQLFFBQU9BLE1BQVIsRUFBZ0JrUCxnQkFBZTdHLFNBQVM2RyxjQUF4QyxFQUEzQjs7QUFFQSxRQUFJUSxlQUFlMVAsT0FBTzRCLElBQVAsQ0FBWXRFLE9BQS9CO0FBQ0EsUUFBSXFTLFdBQVcsTUFBZjtBQUNBO0FBQ0EsUUFBRzlSLFFBQVFqQixZQUFZNE4sV0FBWixDQUF3QnhLLE9BQU80QixJQUFQLENBQVl6RCxJQUFwQyxFQUEwQ3NNLE9BQWxELEtBQThELE9BQU96SyxPQUFPeUssT0FBZCxJQUF5QixXQUExRixFQUFzRztBQUNwR2lGLHFCQUFlMVAsT0FBT3lLLE9BQXRCO0FBQ0FrRixpQkFBVyxHQUFYO0FBQ0QsS0FIRCxNQUdPO0FBQ0wzUCxhQUFPd0MsTUFBUCxDQUFjbkIsSUFBZCxDQUFtQixDQUFDNkwsS0FBSzBDLE9BQUwsRUFBRCxFQUFnQkYsWUFBaEIsQ0FBbkI7QUFDRDs7QUFFRDtBQUNBLFFBQUdBLGVBQWUxUCxPQUFPNEIsSUFBUCxDQUFZNUUsTUFBWixHQUFtQmdELE9BQU80QixJQUFQLENBQVlTLElBQWpELEVBQXNEO0FBQ3BEakcsYUFBTzRHLE1BQVAsQ0FBY2hELE1BQWQ7QUFDQTtBQUNBLFVBQUdBLE9BQU9JLE1BQVAsSUFBaUJKLE9BQU9JLE1BQVAsQ0FBY3FCLElBQS9CLElBQXVDekIsT0FBT0ksTUFBUCxDQUFjSyxPQUF4RCxFQUFnRTtBQUM5RDJPLGNBQU0vTixJQUFOLENBQVdqRixPQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9JLE1BQWxDLEVBQTBDLEtBQTFDLENBQVg7QUFDRDtBQUNEO0FBQ0EsVUFBR0osT0FBT00sSUFBUCxJQUFlTixPQUFPTSxJQUFQLENBQVltQixJQUEzQixJQUFtQ3pCLE9BQU9NLElBQVAsQ0FBWUcsT0FBbEQsRUFBMEQ7QUFDeEQyTyxjQUFNL04sSUFBTixDQUFXakYsT0FBT3NFLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPTSxJQUFsQyxFQUF3QyxLQUF4QyxDQUFYO0FBQ0Q7QUFDRDtBQUNBLFVBQUdOLE9BQU9LLE1BQVAsSUFBaUJMLE9BQU9LLE1BQVAsQ0FBY29CLElBQS9CLElBQXVDLENBQUN6QixPQUFPSyxNQUFQLENBQWNJLE9BQXpELEVBQWlFO0FBQy9EMk8sY0FBTS9OLElBQU4sQ0FBV2pGLE9BQU9zRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT0ssTUFBbEMsRUFBMEMsSUFBMUMsRUFBZ0RxSCxJQUFoRCxDQUFxRCxrQkFBVTtBQUN4RTFILGlCQUFPMEMsSUFBUCxDQUFZbU4sT0FBWixDQUFvQnhCLElBQXBCLEdBQTJCLFNBQTNCO0FBQ0FyTyxpQkFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0JDLEtBQXBCLEdBQTRCLG9CQUE1QjtBQUNELFNBSFUsQ0FBWDtBQUlEO0FBQ0YsS0FqQkQsQ0FpQkU7QUFqQkYsU0FrQkssSUFBR0osZUFBZTFQLE9BQU80QixJQUFQLENBQVk1RSxNQUFaLEdBQW1CZ0QsT0FBTzRCLElBQVAsQ0FBWVMsSUFBakQsRUFBc0Q7QUFDekRqRyxlQUFPNEcsTUFBUCxDQUFjaEQsTUFBZDtBQUNBO0FBQ0EsWUFBR0EsT0FBT0ksTUFBUCxJQUFpQkosT0FBT0ksTUFBUCxDQUFjcUIsSUFBL0IsSUFBdUMsQ0FBQ3pCLE9BQU9JLE1BQVAsQ0FBY0ssT0FBekQsRUFBaUU7QUFDL0QyTyxnQkFBTS9OLElBQU4sQ0FBV2pGLE9BQU9zRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT0ksTUFBbEMsRUFBMEMsSUFBMUMsRUFBZ0RzSCxJQUFoRCxDQUFxRCxtQkFBVztBQUN6RTFILG1CQUFPMEMsSUFBUCxDQUFZbU4sT0FBWixDQUFvQnhCLElBQXBCLEdBQTJCLFNBQTNCO0FBQ0FyTyxtQkFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0JDLEtBQXBCLEdBQTRCLG1CQUE1QjtBQUNELFdBSFUsQ0FBWDtBQUlEO0FBQ0Q7QUFDQSxZQUFHOVAsT0FBT00sSUFBUCxJQUFlTixPQUFPTSxJQUFQLENBQVltQixJQUEzQixJQUFtQyxDQUFDekIsT0FBT00sSUFBUCxDQUFZRyxPQUFuRCxFQUEyRDtBQUN6RDJPLGdCQUFNL04sSUFBTixDQUFXakYsT0FBT3NFLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPTSxJQUFsQyxFQUF3QyxJQUF4QyxDQUFYO0FBQ0Q7QUFDRDtBQUNBLFlBQUdOLE9BQU9LLE1BQVAsSUFBaUJMLE9BQU9LLE1BQVAsQ0FBY29CLElBQS9CLElBQXVDekIsT0FBT0ssTUFBUCxDQUFjSSxPQUF4RCxFQUFnRTtBQUM5RDJPLGdCQUFNL04sSUFBTixDQUFXakYsT0FBT3NFLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSyxNQUFsQyxFQUEwQyxLQUExQyxDQUFYO0FBQ0Q7QUFDRixPQWpCSSxNQWlCRTtBQUNMO0FBQ0FMLGVBQU80QixJQUFQLENBQVlJLEdBQVosR0FBZ0IsSUFBSWdGLElBQUosRUFBaEIsQ0FGSyxDQUVzQjtBQUMzQjVLLGVBQU80RyxNQUFQLENBQWNoRCxNQUFkO0FBQ0E7QUFDQSxZQUFHQSxPQUFPSSxNQUFQLElBQWlCSixPQUFPSSxNQUFQLENBQWNxQixJQUEvQixJQUF1Q3pCLE9BQU9JLE1BQVAsQ0FBY0ssT0FBeEQsRUFBZ0U7QUFDOUQyTyxnQkFBTS9OLElBQU4sQ0FBV2pGLE9BQU9zRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT0ksTUFBbEMsRUFBMEMsS0FBMUMsQ0FBWDtBQUNEO0FBQ0Q7QUFDQSxZQUFHSixPQUFPTSxJQUFQLElBQWVOLE9BQU9NLElBQVAsQ0FBWW1CLElBQTNCLElBQW1DekIsT0FBT00sSUFBUCxDQUFZRyxPQUFsRCxFQUEwRDtBQUN4RDJPLGdCQUFNL04sSUFBTixDQUFXakYsT0FBT3NFLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPTSxJQUFsQyxFQUF3QyxLQUF4QyxDQUFYO0FBQ0Q7QUFDRDtBQUNBLFlBQUdOLE9BQU9LLE1BQVAsSUFBaUJMLE9BQU9LLE1BQVAsQ0FBY29CLElBQS9CLElBQXVDekIsT0FBT0ssTUFBUCxDQUFjSSxPQUF4RCxFQUFnRTtBQUM5RDJPLGdCQUFNL04sSUFBTixDQUFXakYsT0FBT3NFLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSyxNQUFsQyxFQUEwQyxLQUExQyxDQUFYO0FBQ0Q7QUFDRjtBQUNELFdBQU81RCxHQUFHd1IsR0FBSCxDQUFPbUIsS0FBUCxDQUFQO0FBQ0QsR0ExSUQ7O0FBNElBaFQsU0FBTzJULFlBQVAsR0FBc0IsWUFBVTtBQUM5QixXQUFPLE1BQUk3VSxRQUFRNkIsT0FBUixDQUFnQmUsU0FBU2tTLGNBQVQsQ0FBd0IsUUFBeEIsQ0FBaEIsRUFBbUQsQ0FBbkQsRUFBc0RDLFlBQWpFO0FBQ0QsR0FGRDs7QUFJQTdULFNBQU9tUixRQUFQLEdBQWtCLFVBQVN2TixNQUFULEVBQWdCWCxPQUFoQixFQUF3QjtBQUN4QyxRQUFHLENBQUNXLE9BQU95QyxNQUFYLEVBQ0V6QyxPQUFPeUMsTUFBUCxHQUFjLEVBQWQ7QUFDRixRQUFHcEQsT0FBSCxFQUFXO0FBQ1RBLGNBQVFELEdBQVIsR0FBY0MsUUFBUUQsR0FBUixHQUFjQyxRQUFRRCxHQUF0QixHQUE0QixDQUExQztBQUNBQyxjQUFRNlEsR0FBUixHQUFjN1EsUUFBUTZRLEdBQVIsR0FBYzdRLFFBQVE2USxHQUF0QixHQUE0QixDQUExQztBQUNBN1EsY0FBUW9CLE9BQVIsR0FBa0JwQixRQUFRb0IsT0FBUixHQUFrQnBCLFFBQVFvQixPQUExQixHQUFvQyxLQUF0RDtBQUNBcEIsY0FBUW9QLEtBQVIsR0FBZ0JwUCxRQUFRb1AsS0FBUixHQUFnQnBQLFFBQVFvUCxLQUF4QixHQUFnQyxLQUFoRDtBQUNBek8sYUFBT3lDLE1BQVAsQ0FBY3BCLElBQWQsQ0FBbUJoQyxPQUFuQjtBQUNELEtBTkQsTUFNTztBQUNMVyxhQUFPeUMsTUFBUCxDQUFjcEIsSUFBZCxDQUFtQixFQUFDZ00sT0FBTSxZQUFQLEVBQW9Cak8sS0FBSSxFQUF4QixFQUEyQjhRLEtBQUksQ0FBL0IsRUFBaUN6UCxTQUFRLEtBQXpDLEVBQStDZ08sT0FBTSxLQUFyRCxFQUFuQjtBQUNEO0FBQ0YsR0FaRDs7QUFjQXJTLFNBQU8rVCxZQUFQLEdBQXNCLFVBQVNyVCxDQUFULEVBQVdrRCxNQUFYLEVBQWtCO0FBQ3RDLFFBQUlvUSxNQUFNbFYsUUFBUTZCLE9BQVIsQ0FBZ0JELEVBQUVFLE1BQWxCLENBQVY7QUFDQSxRQUFHb1QsSUFBSUMsUUFBSixDQUFhLGNBQWIsQ0FBSCxFQUFpQ0QsTUFBTUEsSUFBSUUsTUFBSixFQUFOOztBQUVqQyxRQUFHLENBQUNGLElBQUlDLFFBQUosQ0FBYSxZQUFiLENBQUosRUFBK0I7QUFDN0JELFVBQUl0RixXQUFKLENBQWdCLFdBQWhCLEVBQTZCSyxRQUE3QixDQUFzQyxZQUF0QztBQUNBNU8sZUFBUyxZQUFVO0FBQ2pCNlQsWUFBSXRGLFdBQUosQ0FBZ0IsWUFBaEIsRUFBOEJLLFFBQTlCLENBQXVDLFdBQXZDO0FBQ0QsT0FGRCxFQUVFLElBRkY7QUFHRCxLQUxELE1BS087QUFDTGlGLFVBQUl0RixXQUFKLENBQWdCLFlBQWhCLEVBQThCSyxRQUE5QixDQUF1QyxXQUF2QztBQUNBbkwsYUFBT3lDLE1BQVAsR0FBYyxFQUFkO0FBQ0Q7QUFDRixHQWJEOztBQWVBckcsU0FBT21VLFNBQVAsR0FBbUIsVUFBU3ZRLE1BQVQsRUFBZ0I7QUFDL0JBLFdBQU9RLEdBQVAsR0FBYSxDQUFDUixPQUFPUSxHQUFyQjtBQUNBLFFBQUdSLE9BQU9RLEdBQVYsRUFDRVIsT0FBT3dRLEdBQVAsR0FBYSxJQUFiO0FBQ0wsR0FKRDs7QUFNQXBVLFNBQU9xVSxZQUFQLEdBQXNCLFVBQVM1TSxJQUFULEVBQWU3RCxNQUFmLEVBQXNCOztBQUUxQzVELFdBQU91UCxVQUFQLENBQWtCM0wsTUFBbEI7QUFDQSxRQUFJRSxDQUFKO0FBQ0EsUUFBSThKLFdBQVc1TixPQUFPNE4sUUFBUCxFQUFmOztBQUVBLFlBQVFuRyxJQUFSO0FBQ0UsV0FBSyxNQUFMO0FBQ0UzRCxZQUFJRixPQUFPSSxNQUFYO0FBQ0E7QUFDRixXQUFLLE1BQUw7QUFDRUYsWUFBSUYsT0FBT0ssTUFBWDtBQUNBO0FBQ0YsV0FBSyxNQUFMO0FBQ0VILFlBQUlGLE9BQU9NLElBQVg7QUFDQTtBQVRKOztBQVlBLFFBQUcsQ0FBQ0osQ0FBSixFQUNFOztBQUVGLFFBQUcsQ0FBQ0EsRUFBRU8sT0FBTixFQUFjO0FBQ1o7QUFDQSxVQUFJb0QsUUFBUSxNQUFSLElBQWtCekgsT0FBTzRILFFBQVAsQ0FBZ0JNLE9BQWhCLENBQXdCb00sVUFBMUMsSUFBd0QxRyxRQUE1RCxFQUFzRTtBQUNwRTVOLGVBQU9xTSxlQUFQLENBQXVCLDhCQUF2QixFQUF1RHpJLE1BQXZEO0FBQ0QsT0FGRCxNQUVPO0FBQ0xFLFVBQUVPLE9BQUYsR0FBWSxDQUFDUCxFQUFFTyxPQUFmO0FBQ0FyRSxlQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJFLENBQTNCLEVBQThCLElBQTlCO0FBQ0Q7QUFDRixLQVJELE1BUU8sSUFBR0EsRUFBRU8sT0FBTCxFQUFhO0FBQ2xCO0FBQ0FQLFFBQUVPLE9BQUYsR0FBWSxDQUFDUCxFQUFFTyxPQUFmO0FBQ0FyRSxhQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJFLENBQTNCLEVBQThCLEtBQTlCO0FBQ0Q7QUFDRixHQWxDRDs7QUFvQ0E5RCxTQUFPdVUsV0FBUCxHQUFxQixVQUFTM1EsTUFBVCxFQUFnQjtBQUNuQyxRQUFJNFEsYUFBYSxLQUFqQjtBQUNBelAsTUFBRUMsSUFBRixDQUFPaEYsT0FBTytELE9BQWQsRUFBdUIsa0JBQVU7QUFDL0IsVUFBSUgsT0FBT0ksTUFBUCxJQUFpQkosT0FBT0ksTUFBUCxDQUFjdUIsTUFBaEMsSUFDQTNCLE9BQU9LLE1BQVAsSUFBaUJMLE9BQU9LLE1BQVAsQ0FBY3NCLE1BRC9CLElBRUQzQixPQUFPZ0QsTUFBUCxDQUFjQyxLQUZoQixFQUdFO0FBQ0EyTixxQkFBYSxJQUFiO0FBQ0Q7QUFDRixLQVBEO0FBUUEsV0FBT0EsVUFBUDtBQUNELEdBWEQ7O0FBYUF4VSxTQUFPeVUsZUFBUCxHQUF5QixVQUFTN1EsTUFBVCxFQUFnQjtBQUNyQ0EsV0FBT08sTUFBUCxHQUFnQixDQUFDUCxPQUFPTyxNQUF4QjtBQUNBbkUsV0FBT3VQLFVBQVAsQ0FBa0IzTCxNQUFsQjtBQUNBLFFBQUlrTixPQUFPLElBQUlsRyxJQUFKLEVBQVg7QUFDQSxRQUFHaEgsT0FBT08sTUFBVixFQUFpQjtBQUNmUCxhQUFPMEMsSUFBUCxDQUFZbU4sT0FBWixDQUFvQnhCLElBQXBCLEdBQTJCLGFBQTNCOztBQUVBelIsa0JBQVlnRixJQUFaLENBQWlCNUIsTUFBakIsRUFDRzBILElBREgsQ0FDUTtBQUFBLGVBQVl0TCxPQUFPK1MsVUFBUCxDQUFrQjlHLFFBQWxCLEVBQTRCckksTUFBNUIsQ0FBWjtBQUFBLE9BRFIsRUFFRzRILEtBRkgsQ0FFUyxlQUFPO0FBQ1o7QUFDQTVILGVBQU93QyxNQUFQLENBQWNuQixJQUFkLENBQW1CLENBQUM2TCxLQUFLMEMsT0FBTCxFQUFELEVBQWdCNVAsT0FBTzRCLElBQVAsQ0FBWXRFLE9BQTVCLENBQW5CO0FBQ0EwQyxlQUFPZCxPQUFQLENBQWU2RCxLQUFmO0FBQ0EsWUFBRy9DLE9BQU9kLE9BQVAsQ0FBZTZELEtBQWYsSUFBc0IsQ0FBekIsRUFDRTNHLE9BQU9xTSxlQUFQLENBQXVCWixHQUF2QixFQUE0QjdILE1BQTVCO0FBQ0gsT0FSSDs7QUFVQTtBQUNBLFVBQUdBLE9BQU9JLE1BQVAsQ0FBY0ssT0FBakIsRUFBeUI7QUFDdkJyRSxlQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9JLE1BQWxDLEVBQTBDLElBQTFDO0FBQ0Q7QUFDRCxVQUFHSixPQUFPTSxJQUFQLElBQWVOLE9BQU9NLElBQVAsQ0FBWUcsT0FBOUIsRUFBc0M7QUFDcENyRSxlQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9NLElBQWxDLEVBQXdDLElBQXhDO0FBQ0Q7QUFDRCxVQUFHTixPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNJLE9BQWxDLEVBQTBDO0FBQ3hDckUsZUFBT3NFLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSyxNQUFsQyxFQUEwQyxJQUExQztBQUNEO0FBQ0YsS0F2QkQsTUF1Qk87O0FBRUw7QUFDQSxVQUFHLENBQUNMLE9BQU9PLE1BQVIsSUFBa0JQLE9BQU9JLE1BQVAsQ0FBY0ssT0FBbkMsRUFBMkM7QUFDekNyRSxlQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9JLE1BQWxDLEVBQTBDLEtBQTFDO0FBQ0Q7QUFDRDtBQUNBLFVBQUcsQ0FBQ0osT0FBT08sTUFBUixJQUFrQlAsT0FBT00sSUFBekIsSUFBaUNOLE9BQU9NLElBQVAsQ0FBWUcsT0FBaEQsRUFBd0Q7QUFDdERyRSxlQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9NLElBQWxDLEVBQXdDLEtBQXhDO0FBQ0Q7QUFDRDtBQUNBLFVBQUcsQ0FBQ04sT0FBT08sTUFBUixJQUFrQlAsT0FBT0ssTUFBekIsSUFBbUNMLE9BQU9LLE1BQVAsQ0FBY0ksT0FBcEQsRUFBNEQ7QUFDMURyRSxlQUFPc0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9LLE1BQWxDLEVBQTBDLEtBQTFDO0FBQ0Q7QUFDRCxVQUFHLENBQUNMLE9BQU9PLE1BQVgsRUFBa0I7QUFDaEIsWUFBR1AsT0FBT00sSUFBVixFQUFnQk4sT0FBT00sSUFBUCxDQUFZbUIsSUFBWixHQUFpQixLQUFqQjtBQUNoQixZQUFHekIsT0FBT0ksTUFBVixFQUFrQkosT0FBT0ksTUFBUCxDQUFjcUIsSUFBZCxHQUFtQixLQUFuQjtBQUNsQixZQUFHekIsT0FBT0ssTUFBVixFQUFrQkwsT0FBT0ssTUFBUCxDQUFjb0IsSUFBZCxHQUFtQixLQUFuQjtBQUNsQnJGLGVBQU91UyxjQUFQLENBQXNCM08sTUFBdEI7QUFDRDtBQUNGO0FBQ0osR0FoREQ7O0FBa0RBNUQsU0FBT3NFLFdBQVAsR0FBcUIsVUFBU1YsTUFBVCxFQUFpQmpELE9BQWpCLEVBQTBCK1QsRUFBMUIsRUFBNkI7QUFDaEQsUUFBR0EsRUFBSCxFQUFPO0FBQ0wsVUFBRy9ULFFBQVF1RSxHQUFSLENBQVlrQyxPQUFaLENBQW9CLEtBQXBCLE1BQTZCLENBQWhDLEVBQWtDO0FBQ2hDLFlBQUk2RixTQUFTbEksRUFBRXlDLE1BQUYsQ0FBU3hILE9BQU80SCxRQUFQLENBQWdCK0QsTUFBaEIsQ0FBdUJJLEtBQWhDLEVBQXNDLEVBQUMrQixVQUFVbk4sUUFBUXVFLEdBQVIsQ0FBWTZJLE1BQVosQ0FBbUIsQ0FBbkIsQ0FBWCxFQUF0QyxFQUF5RSxDQUF6RSxDQUFiO0FBQ0EsZUFBT3ZOLFlBQVltTCxNQUFaLEdBQXFCK0ksRUFBckIsQ0FBd0J6SCxNQUF4QixFQUNKM0IsSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBM0ssa0JBQVEwRCxPQUFSLEdBQWdCLElBQWhCO0FBQ0QsU0FKSSxFQUtKbUgsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU3pMLE9BQU9xTSxlQUFQLENBQXVCWixHQUF2QixFQUE0QjdILE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRCxPQVJELE1BU0ssSUFBR2pELFFBQVF5RCxHQUFYLEVBQWU7QUFDbEIsZUFBTzVELFlBQVlzSSxNQUFaLENBQW1CbEYsTUFBbkIsRUFBMkJqRCxRQUFRdUUsR0FBbkMsRUFBdUN5UCxLQUFLQyxLQUFMLENBQVcsTUFBSWpVLFFBQVEyRSxTQUFaLEdBQXNCLEdBQWpDLENBQXZDLEVBQ0pnRyxJQURJLENBQ0MsWUFBTTtBQUNWO0FBQ0EzSyxrQkFBUTBELE9BQVIsR0FBZ0IsSUFBaEI7QUFDRCxTQUpJLEVBS0ptSCxLQUxJLENBS0UsVUFBQ0MsR0FBRDtBQUFBLGlCQUFTekwsT0FBT3FNLGVBQVAsQ0FBdUJaLEdBQXZCLEVBQTRCN0gsTUFBNUIsQ0FBVDtBQUFBLFNBTEYsQ0FBUDtBQU1ELE9BUEksTUFPRSxJQUFHakQsUUFBUXlULEdBQVgsRUFBZTtBQUNwQixlQUFPNVQsWUFBWXNJLE1BQVosQ0FBbUJsRixNQUFuQixFQUEyQmpELFFBQVF1RSxHQUFuQyxFQUF1QyxHQUF2QyxFQUNKb0csSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBM0ssa0JBQVEwRCxPQUFSLEdBQWdCLElBQWhCO0FBQ0QsU0FKSSxFQUtKbUgsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU3pMLE9BQU9xTSxlQUFQLENBQXVCWixHQUF2QixFQUE0QjdILE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRCxPQVBNLE1BT0E7QUFDTCxlQUFPcEQsWUFBWXVJLE9BQVosQ0FBb0JuRixNQUFwQixFQUE0QmpELFFBQVF1RSxHQUFwQyxFQUF3QyxDQUF4QyxFQUNKb0csSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBM0ssa0JBQVEwRCxPQUFSLEdBQWdCLElBQWhCO0FBQ0QsU0FKSSxFQUtKbUgsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU3pMLE9BQU9xTSxlQUFQLENBQXVCWixHQUF2QixFQUE0QjdILE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRDtBQUNGLEtBaENELE1BZ0NPO0FBQ0wsVUFBR2pELFFBQVF1RSxHQUFSLENBQVlrQyxPQUFaLENBQW9CLEtBQXBCLE1BQTZCLENBQWhDLEVBQWtDO0FBQ2hDLFlBQUk2RixTQUFTbEksRUFBRXlDLE1BQUYsQ0FBU3hILE9BQU80SCxRQUFQLENBQWdCK0QsTUFBaEIsQ0FBdUJJLEtBQWhDLEVBQXNDLEVBQUMrQixVQUFVbk4sUUFBUXVFLEdBQVIsQ0FBWTZJLE1BQVosQ0FBbUIsQ0FBbkIsQ0FBWCxFQUF0QyxFQUF5RSxDQUF6RSxDQUFiO0FBQ0EsZUFBT3ZOLFlBQVltTCxNQUFaLEdBQXFCa0osR0FBckIsQ0FBeUI1SCxNQUF6QixFQUNKM0IsSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBM0ssa0JBQVEwRCxPQUFSLEdBQWdCLEtBQWhCO0FBQ0QsU0FKSSxFQUtKbUgsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU3pMLE9BQU9xTSxlQUFQLENBQXVCWixHQUF2QixFQUE0QjdILE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRCxPQVJELE1BU0ssSUFBR2pELFFBQVF5RCxHQUFSLElBQWV6RCxRQUFReVQsR0FBMUIsRUFBOEI7QUFDakMsZUFBTzVULFlBQVlzSSxNQUFaLENBQW1CbEYsTUFBbkIsRUFBMkJqRCxRQUFRdUUsR0FBbkMsRUFBdUMsQ0FBdkMsRUFDSm9HLElBREksQ0FDQyxZQUFNO0FBQ1YzSyxrQkFBUTBELE9BQVIsR0FBZ0IsS0FBaEI7QUFDQXJFLGlCQUFPdVMsY0FBUCxDQUFzQjNPLE1BQXRCO0FBQ0QsU0FKSSxFQUtKNEgsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU3pMLE9BQU9xTSxlQUFQLENBQXVCWixHQUF2QixFQUE0QjdILE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRCxPQVBJLE1BT0U7QUFDTCxlQUFPcEQsWUFBWXVJLE9BQVosQ0FBb0JuRixNQUFwQixFQUE0QmpELFFBQVF1RSxHQUFwQyxFQUF3QyxDQUF4QyxFQUNKb0csSUFESSxDQUNDLFlBQU07QUFDVjNLLGtCQUFRMEQsT0FBUixHQUFnQixLQUFoQjtBQUNBckUsaUJBQU91UyxjQUFQLENBQXNCM08sTUFBdEI7QUFDRCxTQUpJLEVBS0o0SCxLQUxJLENBS0UsVUFBQ0MsR0FBRDtBQUFBLGlCQUFTekwsT0FBT3FNLGVBQVAsQ0FBdUJaLEdBQXZCLEVBQTRCN0gsTUFBNUIsQ0FBVDtBQUFBLFNBTEYsQ0FBUDtBQU1EO0FBQ0Y7QUFDRixHQTNERDs7QUE2REE1RCxTQUFPOFUsY0FBUCxHQUF3QixVQUFTbkYsWUFBVCxFQUFzQkMsSUFBdEIsRUFBMkI7QUFDakQsUUFBSTtBQUNGLFVBQUltRixpQkFBaUJ0SSxLQUFLQyxLQUFMLENBQVdpRCxZQUFYLENBQXJCO0FBQ0EzUCxhQUFPNEgsUUFBUCxHQUFrQm1OLGVBQWVuTixRQUFmLElBQTJCcEgsWUFBWXFILEtBQVosRUFBN0M7QUFDQTdILGFBQU8rRCxPQUFQLEdBQWlCZ1IsZUFBZWhSLE9BQWYsSUFBMEJ2RCxZQUFZOEgsY0FBWixFQUEzQztBQUNELEtBSkQsQ0FJRSxPQUFNNUgsQ0FBTixFQUFRO0FBQ1I7QUFDQVYsYUFBT3FNLGVBQVAsQ0FBdUIzTCxDQUF2QjtBQUNEO0FBQ0YsR0FURDs7QUFXQVYsU0FBT2dWLGNBQVAsR0FBd0IsWUFBVTtBQUNoQyxRQUFJalIsVUFBVWpGLFFBQVF5SCxJQUFSLENBQWF2RyxPQUFPK0QsT0FBcEIsQ0FBZDtBQUNBZ0IsTUFBRUMsSUFBRixDQUFPakIsT0FBUCxFQUFnQixVQUFDSCxNQUFELEVBQVNxUixDQUFULEVBQWU7QUFDN0JsUixjQUFRa1IsQ0FBUixFQUFXN08sTUFBWCxHQUFvQixFQUFwQjtBQUNBckMsY0FBUWtSLENBQVIsRUFBVzlRLE1BQVgsR0FBb0IsS0FBcEI7QUFDRCxLQUhEO0FBSUEsV0FBTyxrQ0FBa0MrUSxtQkFBbUJ6SSxLQUFLaUcsU0FBTCxDQUFlLEVBQUMsWUFBWTFTLE9BQU80SCxRQUFwQixFQUE2QixXQUFXN0QsT0FBeEMsRUFBZixDQUFuQixDQUF6QztBQUNELEdBUEQ7O0FBU0EvRCxTQUFPbVYsYUFBUCxHQUF1QixVQUFTQyxVQUFULEVBQW9CO0FBQ3pDLFFBQUcsQ0FBQ3BWLE9BQU80SCxRQUFQLENBQWdCeU4sT0FBcEIsRUFDRXJWLE9BQU80SCxRQUFQLENBQWdCeU4sT0FBaEIsR0FBMEIsRUFBMUI7QUFDRjtBQUNBLFFBQUdELFdBQVdoTyxPQUFYLENBQW1CLEtBQW5CLE1BQThCLENBQUMsQ0FBbEMsRUFDRWdPLGNBQWNwVixPQUFPOEIsR0FBUCxDQUFXQyxJQUF6QjtBQUNGLFFBQUl1VCxXQUFXLEVBQWY7QUFDQSxRQUFJQyxjQUFjLEVBQWxCO0FBQ0F4USxNQUFFQyxJQUFGLENBQU9oRixPQUFPK0QsT0FBZCxFQUF1QixVQUFDSCxNQUFELEVBQVNxUixDQUFULEVBQWU7QUFDcENNLG9CQUFjM1IsT0FBT1ksT0FBUCxHQUFpQlosT0FBT1ksT0FBUCxDQUFlM0UsR0FBZixDQUFtQnNILE9BQW5CLENBQTJCLGlCQUEzQixFQUE4QyxFQUE5QyxDQUFqQixHQUFxRSxTQUFuRjtBQUNBLFVBQUlxTyxnQkFBZ0J6USxFQUFFeUksSUFBRixDQUFPOEgsUUFBUCxFQUFnQixFQUFDblUsTUFBTW9VLFdBQVAsRUFBaEIsQ0FBcEI7QUFDQSxVQUFHLENBQUNDLGFBQUosRUFBa0I7QUFDaEJGLGlCQUFTclEsSUFBVCxDQUFjO0FBQ1o5RCxnQkFBTW9VLFdBRE07QUFFWnhULGdCQUFNcVQsVUFGTTtBQUdaSyxtQkFBUyxFQUhHO0FBSVo1USxnQkFBTSxFQUpNO0FBS1pyRixtQkFBUyxFQUxHO0FBTVprVyxvQkFBVSxLQU5FO0FBT1pDLGNBQUtQLFdBQVdoTyxPQUFYLENBQW1CLElBQW5CLE1BQTZCLENBQUMsQ0FBL0IsR0FBb0MsSUFBcEMsR0FBMkM7QUFQbkMsU0FBZDtBQVNBb08sd0JBQWdCelEsRUFBRXlJLElBQUYsQ0FBTzhILFFBQVAsRUFBZ0IsRUFBQ25VLE1BQUtvVSxXQUFOLEVBQWhCLENBQWhCO0FBQ0Q7QUFDRCxVQUFJM1UsU0FBVVosT0FBTzRILFFBQVAsQ0FBZ0JNLE9BQWhCLENBQXdCRSxJQUF4QixJQUE4QixHQUEvQixHQUFzQ2xJLFFBQVEsV0FBUixFQUFxQjBELE9BQU80QixJQUFQLENBQVk1RSxNQUFqQyxDQUF0QyxHQUFpRmdELE9BQU80QixJQUFQLENBQVk1RSxNQUExRztBQUNBZ0QsYUFBTzRCLElBQVAsQ0FBWVEsTUFBWixHQUFxQnNCLFdBQVcxRCxPQUFPNEIsSUFBUCxDQUFZUSxNQUF2QixDQUFyQjtBQUNBLFVBQUlBLFNBQVVoRyxPQUFPNEgsUUFBUCxDQUFnQk0sT0FBaEIsQ0FBd0JFLElBQXhCLElBQThCLEdBQTlCLElBQXFDM0csUUFBUW1DLE9BQU80QixJQUFQLENBQVlRLE1BQXBCLENBQXRDLEdBQXFFOUYsUUFBUSxPQUFSLEVBQWlCMEQsT0FBTzRCLElBQVAsQ0FBWVEsTUFBWixHQUFtQixLQUFwQyxFQUEwQyxDQUExQyxDQUFyRSxHQUFvSHBDLE9BQU80QixJQUFQLENBQVlRLE1BQTdJO0FBQ0EsVUFBR3hGLFlBQVlxSSxLQUFaLENBQWtCakYsT0FBT1ksT0FBekIsS0FBcUN4RSxPQUFPOEIsR0FBUCxDQUFXTSxXQUFuRCxFQUErRDtBQUM3RG9ULHNCQUFjaFcsT0FBZCxDQUFzQnlGLElBQXRCLENBQTJCLDBCQUEzQjtBQUNEO0FBQ0QsVUFBRyxDQUFDbVEsV0FBV2hPLE9BQVgsQ0FBbUIsS0FBbkIsTUFBOEIsQ0FBQyxDQUEvQixJQUFvQzVHLFlBQVlxSSxLQUFaLENBQWtCakYsT0FBT1ksT0FBekIsQ0FBckMsTUFDQXhFLE9BQU80SCxRQUFQLENBQWdCeU4sT0FBaEIsQ0FBd0JPLEdBQXhCLElBQStCaFMsT0FBTzRCLElBQVAsQ0FBWXpELElBQVosQ0FBaUJxRixPQUFqQixDQUF5QixLQUF6QixNQUFvQyxDQUFDLENBRHBFLEtBRURvTyxjQUFjaFcsT0FBZCxDQUFzQjRILE9BQXRCLENBQThCLHFCQUE5QixNQUF5RCxDQUFDLENBRjVELEVBRThEO0FBQzFEb08sc0JBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsMkNBQTNCO0FBQ0F1USxzQkFBY2hXLE9BQWQsQ0FBc0J5RixJQUF0QixDQUEyQixxQkFBM0I7QUFDSCxPQUxELE1BS08sSUFBRyxDQUFDekUsWUFBWXFJLEtBQVosQ0FBa0JqRixPQUFPWSxPQUF6QixDQUFELEtBQ1B4RSxPQUFPNEgsUUFBUCxDQUFnQnlOLE9BQWhCLENBQXdCTyxHQUF4QixJQUErQmhTLE9BQU80QixJQUFQLENBQVl6RCxJQUFaLENBQWlCcUYsT0FBakIsQ0FBeUIsS0FBekIsTUFBb0MsQ0FBQyxDQUQ3RCxLQUVSb08sY0FBY2hXLE9BQWQsQ0FBc0I0SCxPQUF0QixDQUE4QixrQkFBOUIsTUFBc0QsQ0FBQyxDQUZsRCxFQUVvRDtBQUN2RG9PLHNCQUFjaFcsT0FBZCxDQUFzQnlGLElBQXRCLENBQTJCLG1EQUEzQjtBQUNBdVEsc0JBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsa0JBQTNCO0FBQ0g7QUFDRCxVQUFHakYsT0FBTzRILFFBQVAsQ0FBZ0J5TixPQUFoQixDQUF3QlEsT0FBeEIsSUFBbUNqUyxPQUFPNEIsSUFBUCxDQUFZekQsSUFBWixDQUFpQnFGLE9BQWpCLENBQXlCLFNBQXpCLE1BQXdDLENBQUMsQ0FBL0UsRUFBaUY7QUFDL0UsWUFBR29PLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsc0JBQTlCLE1BQTBELENBQUMsQ0FBOUQsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsc0JBQTNCO0FBQ0YsWUFBR3VRLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsZ0NBQTlCLE1BQW9FLENBQUMsQ0FBeEUsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsZ0NBQTNCO0FBQ0g7QUFDRCxVQUFHakYsT0FBTzRILFFBQVAsQ0FBZ0J5TixPQUFoQixDQUF3QlMsR0FBeEIsSUFBK0JsUyxPQUFPNEIsSUFBUCxDQUFZekQsSUFBWixDQUFpQnFGLE9BQWpCLENBQXlCLFFBQXpCLE1BQXVDLENBQUMsQ0FBMUUsRUFBNEU7QUFDMUUsWUFBR29PLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsbUJBQTlCLE1BQXVELENBQUMsQ0FBM0QsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsbUJBQTNCO0FBQ0YsWUFBR3VRLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsOEJBQTlCLE1BQWtFLENBQUMsQ0FBdEUsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsOEJBQTNCO0FBQ0g7QUFDRCxVQUFHakYsT0FBTzRILFFBQVAsQ0FBZ0J5TixPQUFoQixDQUF3QlMsR0FBeEIsSUFBK0JsUyxPQUFPNEIsSUFBUCxDQUFZekQsSUFBWixDQUFpQnFGLE9BQWpCLENBQXlCLFFBQXpCLE1BQXVDLENBQUMsQ0FBMUUsRUFBNEU7QUFDMUUsWUFBR29PLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsbUJBQTlCLE1BQXVELENBQUMsQ0FBM0QsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsbUJBQTNCO0FBQ0YsWUFBR3VRLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsOEJBQTlCLE1BQWtFLENBQUMsQ0FBdEUsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsOEJBQTNCO0FBQ0g7QUFDRDtBQUNBLFVBQUdyQixPQUFPNEIsSUFBUCxDQUFZTixHQUFaLENBQWdCa0MsT0FBaEIsQ0FBd0IsR0FBeEIsTUFBaUMsQ0FBakMsSUFBc0NvTyxjQUFjaFcsT0FBZCxDQUFzQjRILE9BQXRCLENBQThCLCtCQUE5QixNQUFtRSxDQUFDLENBQTdHLEVBQStHO0FBQzdHb08sc0JBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsaURBQTNCO0FBQ0EsWUFBR3VRLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsc0JBQTlCLE1BQTBELENBQUMsQ0FBOUQsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsbUJBQTNCO0FBQ0YsWUFBR3VRLGNBQWNoVyxPQUFkLENBQXNCNEgsT0FBdEIsQ0FBOEIsK0JBQTlCLE1BQW1FLENBQUMsQ0FBdkUsRUFDRW9PLGNBQWNoVyxPQUFkLENBQXNCeUYsSUFBdEIsQ0FBMkIsK0JBQTNCO0FBQ0g7QUFDRDtBQUNBLFVBQUk4USxhQUFhblMsT0FBTzRCLElBQVAsQ0FBWXpELElBQTdCO0FBQ0EsVUFBSTZCLE9BQU80QixJQUFQLENBQVlDLEdBQWhCLEVBQ0VzUSxjQUFjblMsT0FBTzRCLElBQVAsQ0FBWUMsR0FBMUI7O0FBRUYsVUFBSTdCLE9BQU80QixJQUFQLENBQVlFLEtBQWhCLEVBQXVCcVEsY0FBYyxNQUFNblMsT0FBTzRCLElBQVAsQ0FBWUUsS0FBaEM7QUFDdkI4UCxvQkFBY0MsT0FBZCxDQUFzQnhRLElBQXRCLENBQTJCLHlCQUF1QnJCLE9BQU96QyxJQUFQLENBQVlnRyxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxFQUF2QyxDQUF2QixHQUFrRSxRQUFsRSxHQUEyRXZELE9BQU80QixJQUFQLENBQVlOLEdBQXZGLEdBQTJGLFFBQTNGLEdBQW9HNlEsVUFBcEcsR0FBK0csS0FBL0csR0FBcUgvUCxNQUFySCxHQUE0SCxJQUF2SjtBQUNBd1Asb0JBQWNDLE9BQWQsQ0FBc0J4USxJQUF0QixDQUEyQixlQUEzQjtBQUNBO0FBQ0EsVUFBSXVRLGNBQWMzUSxJQUFkLENBQW1CQyxNQUF2QixFQUErQjtBQUM3QjBRLHNCQUFjM1EsSUFBZCxDQUFtQkksSUFBbkIsQ0FBd0IsNENBQTRDckIsT0FBT3pDLElBQW5ELEdBQTBELHFDQUExRCxHQUFrR3lDLE9BQU80QixJQUFQLENBQVlOLEdBQTlHLEdBQW9ILHNDQUFwSCxHQUE2SjZRLFVBQTdKLEdBQTBLLHdDQUExSyxHQUFxTi9QLE1BQXJOLEdBQThOLGNBQXRQO0FBQ0QsT0FGRCxNQUVPO0FBQ0x3UCxzQkFBYzNRLElBQWQsQ0FBbUJJLElBQW5CLENBQXdCLDBDQUF3Q3JCLE9BQU96QyxJQUEvQyxHQUFvRCxxQ0FBcEQsR0FBMEZ5QyxPQUFPNEIsSUFBUCxDQUFZTixHQUF0RyxHQUEwRyxzQ0FBMUcsR0FBaUo2USxVQUFqSixHQUE0Six3Q0FBNUosR0FBcU0vUCxNQUFyTSxHQUE0TSxjQUFwTztBQUNEOztBQUVELFVBQUloRyxPQUFPNEgsUUFBUCxDQUFnQnlOLE9BQWhCLENBQXdCTyxHQUF4QixJQUErQmhTLE9BQU80QixJQUFQLENBQVl6RCxJQUFaLENBQWlCcUYsT0FBakIsQ0FBeUIsS0FBekIsTUFBb0MsQ0FBQyxDQUFyQyxJQUEwQ3hELE9BQU95SyxPQUFwRixFQUE2RjtBQUMzRm1ILHNCQUFjQyxPQUFkLENBQXNCeFEsSUFBdEIsQ0FBMkIsZ0NBQThCckIsT0FBT3pDLElBQVAsQ0FBWWdHLE9BQVosQ0FBb0IsaUJBQXBCLEVBQXVDLEVBQXZDLENBQTlCLEdBQXlFLGlCQUF6RSxHQUEyRnZELE9BQU80QixJQUFQLENBQVlOLEdBQXZHLEdBQTJHLFFBQTNHLEdBQW9INlEsVUFBcEgsR0FBK0gsS0FBL0gsR0FBcUkvUCxNQUFySSxHQUE0SSxJQUF2SztBQUNBd1Asc0JBQWNDLE9BQWQsQ0FBc0J4USxJQUF0QixDQUEyQixlQUEzQjtBQUNEOztBQUVEO0FBQ0EsVUFBR3JCLE9BQU9JLE1BQVAsSUFBaUJKLE9BQU9JLE1BQVAsQ0FBY3VCLE1BQWxDLEVBQXlDO0FBQ3ZDaVEsc0JBQWNFLFFBQWQsR0FBeUIsSUFBekI7QUFDQUYsc0JBQWNDLE9BQWQsQ0FBc0J4USxJQUF0QixDQUEyQiw0QkFBMEJyQixPQUFPekMsSUFBUCxDQUFZZ0csT0FBWixDQUFvQixpQkFBcEIsRUFBdUMsRUFBdkMsQ0FBMUIsR0FBcUUsUUFBckUsR0FBOEV2RCxPQUFPSSxNQUFQLENBQWNrQixHQUE1RixHQUFnRyxVQUFoRyxHQUEyR3RFLE1BQTNHLEdBQWtILEdBQWxILEdBQXNIZ0QsT0FBTzRCLElBQVAsQ0FBWVMsSUFBbEksR0FBdUksR0FBdkksR0FBMkl4RSxRQUFRbUMsT0FBT2dELE1BQVAsQ0FBY0MsS0FBdEIsQ0FBM0ksR0FBd0ssSUFBbk07QUFDRDtBQUNELFVBQUdqRCxPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNzQixNQUFsQyxFQUF5QztBQUN2Q2lRLHNCQUFjRSxRQUFkLEdBQXlCLElBQXpCO0FBQ0FGLHNCQUFjQyxPQUFkLENBQXNCeFEsSUFBdEIsQ0FBMkIsNEJBQTBCckIsT0FBT3pDLElBQVAsQ0FBWWdHLE9BQVosQ0FBb0IsaUJBQXBCLEVBQXVDLEVBQXZDLENBQTFCLEdBQXFFLFFBQXJFLEdBQThFdkQsT0FBT0ssTUFBUCxDQUFjaUIsR0FBNUYsR0FBZ0csVUFBaEcsR0FBMkd0RSxNQUEzRyxHQUFrSCxHQUFsSCxHQUFzSGdELE9BQU80QixJQUFQLENBQVlTLElBQWxJLEdBQXVJLEdBQXZJLEdBQTJJeEUsUUFBUW1DLE9BQU9nRCxNQUFQLENBQWNDLEtBQXRCLENBQTNJLEdBQXdLLElBQW5NO0FBQ0Q7QUFDRixLQXZGRDtBQXdGQTlCLE1BQUVDLElBQUYsQ0FBT3NRLFFBQVAsRUFBaUIsVUFBQy9QLE1BQUQsRUFBUzBQLENBQVQsRUFBZTtBQUM5QixVQUFJMVAsT0FBT21RLFFBQVAsSUFBbUJuUSxPQUFPb1EsRUFBOUIsRUFBa0M7QUFDaEMsWUFBSXBRLE9BQU94RCxJQUFQLENBQVlxRixPQUFaLENBQW9CLElBQXBCLE1BQThCLENBQUMsQ0FBbkMsRUFBc0M7QUFDcEM3QixpQkFBT2tRLE9BQVAsQ0FBZU8sT0FBZixDQUF1QixvQkFBdkI7QUFDQSxjQUFJelEsT0FBT29RLEVBQVgsRUFBZTtBQUNicFEsbUJBQU9rUSxPQUFQLENBQWVPLE9BQWYsQ0FBdUIsdUJBQXZCO0FBQ0F6USxtQkFBT2tRLE9BQVAsQ0FBZU8sT0FBZixDQUF1Qix3QkFBdkI7QUFDQXpRLG1CQUFPa1EsT0FBUCxDQUFlTyxPQUFmLENBQXVCLG9DQUFrQ2hXLE9BQU80SCxRQUFQLENBQWdCK04sRUFBaEIsQ0FBbUJ4VSxJQUFyRCxHQUEwRCxJQUFqRjtBQUNEO0FBQ0Y7QUFDRDtBQUNBLGFBQUssSUFBSThVLElBQUksQ0FBYixFQUFnQkEsSUFBSTFRLE9BQU9rUSxPQUFQLENBQWUzUSxNQUFuQyxFQUEyQ21SLEdBQTNDLEVBQStDO0FBQzdDLGNBQUkxUSxPQUFPb1EsRUFBUCxJQUFhTCxTQUFTTCxDQUFULEVBQVlRLE9BQVosQ0FBb0JRLENBQXBCLEVBQXVCN08sT0FBdkIsQ0FBK0Isd0JBQS9CLE1BQTZELENBQUMsQ0FBM0UsSUFDRmtPLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUJDLFdBQXZCLEdBQXFDOU8sT0FBckMsQ0FBNkMsVUFBN0MsTUFBNkQsQ0FBQyxDQURoRSxFQUNtRTtBQUMvRDtBQUNBa08scUJBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsSUFBeUJYLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUI5TyxPQUF2QixDQUErQix3QkFBL0IsRUFBeUQsbUNBQXpELENBQXpCO0FBQ0gsV0FKRCxNQUlPLElBQUk1QixPQUFPb1EsRUFBUCxJQUFhTCxTQUFTTCxDQUFULEVBQVlRLE9BQVosQ0FBb0JRLENBQXBCLEVBQXVCN08sT0FBdkIsQ0FBK0IsaUJBQS9CLE1BQXNELENBQUMsQ0FBcEUsSUFDVGtPLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUJDLFdBQXZCLEdBQXFDOU8sT0FBckMsQ0FBNkMsU0FBN0MsTUFBNEQsQ0FBQyxDQUR4RCxFQUMyRDtBQUM5RDtBQUNBa08scUJBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsSUFBeUJYLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUI5TyxPQUF2QixDQUErQixpQkFBL0IsRUFBa0QsMkJBQWxELENBQXpCO0FBQ0gsV0FKTSxNQUlBLElBQUltTyxTQUFTTCxDQUFULEVBQVlRLE9BQVosQ0FBb0JRLENBQXBCLEVBQXVCN08sT0FBdkIsQ0FBK0IsaUJBQS9CLE1BQXNELENBQUMsQ0FBM0QsRUFBOEQ7QUFDbkU7QUFDQWtPLHFCQUFTTCxDQUFULEVBQVlRLE9BQVosQ0FBb0JRLENBQXBCLElBQXlCWCxTQUFTTCxDQUFULEVBQVlRLE9BQVosQ0FBb0JRLENBQXBCLEVBQXVCOU8sT0FBdkIsQ0FBK0IsaUJBQS9CLEVBQWtELHdCQUFsRCxDQUF6QjtBQUNEO0FBQ0Y7QUFDRjtBQUNEZ1AscUJBQWU1USxPQUFPcEUsSUFBdEIsRUFBNEJvRSxPQUFPa1EsT0FBbkMsRUFBNENsUSxPQUFPVixJQUFuRCxFQUF5RFUsT0FBT21RLFFBQWhFLEVBQTBFblEsT0FBTy9GLE9BQWpGLEVBQTBGLGNBQVk0VixVQUF0RztBQUNELEtBM0JEO0FBNEJELEdBNUhEOztBQThIQSxXQUFTZSxjQUFULENBQXdCaFYsSUFBeEIsRUFBOEJzVSxPQUE5QixFQUF1QzVRLElBQXZDLEVBQTZDdVIsV0FBN0MsRUFBMEQ1VyxPQUExRCxFQUFtRStGLE1BQW5FLEVBQTBFO0FBQ3hFO0FBQ0EsUUFBSThRLDJCQUEyQjdWLFlBQVltTCxNQUFaLEdBQXFCMkssVUFBckIsRUFBL0I7QUFDQSxRQUFJQyxVQUFVLHlFQUF1RXZXLE9BQU8wQyxHQUFQLENBQVdvUSxjQUFsRixHQUFpRyxHQUFqRyxHQUFxRzdELFNBQVNDLE1BQVQsQ0FBZ0IscUJBQWhCLENBQXJHLEdBQTRJLE9BQTVJLEdBQW9KL04sSUFBcEosR0FBeUosUUFBdks7QUFDQWIsVUFBTWtXLEdBQU4sQ0FBVSxvQkFBa0JqUixNQUFsQixHQUF5QixHQUF6QixHQUE2QkEsTUFBN0IsR0FBb0MsTUFBOUMsRUFDRytGLElBREgsQ0FDUSxvQkFBWTtBQUNoQjtBQUNBVyxlQUFTb0QsSUFBVCxHQUFnQmtILFVBQVF0SyxTQUFTb0QsSUFBVCxDQUNyQmxJLE9BRHFCLENBQ2IsY0FEYSxFQUNHc08sUUFBUTNRLE1BQVIsR0FBaUIyUSxRQUFRZ0IsSUFBUixDQUFhLElBQWIsQ0FBakIsR0FBc0MsRUFEekMsRUFFckJ0UCxPQUZxQixDQUViLFdBRmEsRUFFQXRDLEtBQUtDLE1BQUwsR0FBY0QsS0FBSzRSLElBQUwsQ0FBVSxJQUFWLENBQWQsR0FBZ0MsRUFGaEMsRUFHckJ0UCxPQUhxQixDQUdiLGNBSGEsRUFHRzNILFFBQVFzRixNQUFSLEdBQWlCdEYsUUFBUWlYLElBQVIsQ0FBYSxJQUFiLENBQWpCLEdBQXNDLEVBSHpDLEVBSXJCdFAsT0FKcUIsQ0FJYixjQUphLEVBSUduSCxPQUFPMEMsR0FBUCxDQUFXb1EsY0FKZCxFQUtyQjNMLE9BTHFCLENBS2Isd0JBTGEsRUFLYWtQLHdCQUxiLEVBTXJCbFAsT0FOcUIsQ0FNYix1QkFOYSxFQU1ZbkgsT0FBTzRILFFBQVAsQ0FBZ0I4TyxhQUFoQixDQUE4QjdQLEtBTjFDLENBQXhCOztBQVFBO0FBQ0EsVUFBR3RCLE9BQU82QixPQUFQLENBQWUsS0FBZixNQUEwQixDQUFDLENBQTlCLEVBQWdDO0FBQzlCLFlBQUdwSCxPQUFPOEIsR0FBUCxDQUFXRSxJQUFkLEVBQW1CO0FBQ2pCaUssbUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0IsV0FBdEIsRUFBbUNuSCxPQUFPOEIsR0FBUCxDQUFXRSxJQUE5QyxDQUFoQjtBQUNEO0FBQ0QsWUFBR2hDLE9BQU84QixHQUFQLENBQVdHLFNBQWQsRUFBd0I7QUFDdEJnSyxtQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixnQkFBdEIsRUFBd0NuSCxPQUFPOEIsR0FBUCxDQUFXRyxTQUFuRCxDQUFoQjtBQUNEO0FBQ0QsWUFBR2pDLE9BQU84QixHQUFQLENBQVdLLFlBQWQsRUFBMkI7QUFDekI4SixtQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixtQkFBdEIsRUFBMkN3UCxJQUFJM1csT0FBTzhCLEdBQVAsQ0FBV0ssWUFBZixDQUEzQyxDQUFoQjtBQUNELFNBRkQsTUFFTztBQUNMOEosbUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0IsbUJBQXRCLEVBQTJDd1AsSUFBSSxTQUFKLENBQTNDLENBQWhCO0FBQ0Q7QUFDRCxZQUFHM1csT0FBTzhCLEdBQVAsQ0FBV0ksUUFBZCxFQUF1QjtBQUNyQitKLG1CQUFTb0QsSUFBVCxHQUFnQnBELFNBQVNvRCxJQUFULENBQWNsSSxPQUFkLENBQXNCLGVBQXRCLEVBQXVDbkgsT0FBTzhCLEdBQVAsQ0FBV0ksUUFBbEQsQ0FBaEI7QUFDRCxTQUZELE1BRU87QUFDTCtKLG1CQUFTb0QsSUFBVCxHQUFnQnBELFNBQVNvRCxJQUFULENBQWNsSSxPQUFkLENBQXNCLGVBQXRCLEVBQXVDLE9BQXZDLENBQWhCO0FBQ0Q7QUFDRixPQWpCRCxNQWlCTztBQUNMOEUsaUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0IsZUFBdEIsRUFBdUNoRyxLQUFLZ0csT0FBTCxDQUFhLFFBQWIsRUFBc0IsRUFBdEIsQ0FBdkMsQ0FBaEI7QUFDRDtBQUNELFVBQUk1QixPQUFPNkIsT0FBUCxDQUFlLEtBQWYsTUFBMkIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQztBQUNBNkUsaUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0IsZUFBdEIsRUFBdUMsZ0JBQWNuSCxPQUFPNEgsUUFBUCxDQUFnQkUsR0FBaEIsQ0FBb0JFLE9BQXBCLENBQTRCNE8sSUFBNUIsRUFBckQsQ0FBaEI7QUFDRCxPQUhELE1BSUssSUFBSXJSLE9BQU82QixPQUFQLENBQWUsT0FBZixNQUE2QixDQUFDLENBQWxDLEVBQW9DO0FBQ3ZDO0FBQ0E2RSxpQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixjQUF0QixFQUFzQyxnQkFBY25ILE9BQU80SCxRQUFQLENBQWdCK04sRUFBaEIsQ0FBbUIzTixPQUFuQixDQUEyQjRPLElBQTNCLEVBQXBELENBQWhCO0FBQ0QsT0FISSxNQUlBLElBQUlyUixPQUFPNkIsT0FBUCxDQUFlLFVBQWYsTUFBK0IsQ0FBQyxDQUFwQyxFQUFzQztBQUN6QztBQUNBLFlBQUl5UCx5QkFBdUI3VyxPQUFPNEgsUUFBUCxDQUFnQjBHLFFBQWhCLENBQXlCek8sR0FBcEQ7QUFDQSxZQUFJNEIsUUFBUXpCLE9BQU80SCxRQUFQLENBQWdCMEcsUUFBaEIsQ0FBeUJ3SSxJQUFqQyxDQUFKLEVBQ0VELDJCQUF5QjdXLE9BQU80SCxRQUFQLENBQWdCMEcsUUFBaEIsQ0FBeUJ3SSxJQUFsRDtBQUNGRCw2QkFBcUIsU0FBckI7QUFDQTtBQUNBLFlBQUlwVixRQUFRekIsT0FBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QjFDLElBQWpDLEtBQTBDbkssUUFBUXpCLE9BQU80SCxRQUFQLENBQWdCMEcsUUFBaEIsQ0FBeUJ6QyxJQUFqQyxDQUE5QyxFQUNFZ0wsNEJBQTBCN1csT0FBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QjFDLElBQW5ELFdBQTZENUwsT0FBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QnpDLElBQXRGO0FBQ0Y7QUFDQWdMLDZCQUFxQixTQUFPN1csT0FBTzRILFFBQVAsQ0FBZ0IwRyxRQUFoQixDQUF5QlEsRUFBekIsSUFBK0IsYUFBV0csU0FBU0MsTUFBVCxDQUFnQixZQUFoQixDQUFqRCxDQUFyQjtBQUNBakQsaUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0Isb0JBQXRCLEVBQTRDLEVBQTVDLENBQWhCO0FBQ0E4RSxpQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQiwwQkFBdEIsRUFBa0QwUCxpQkFBbEQsQ0FBaEI7QUFDRDtBQUNELFVBQUk3VyxPQUFPNEgsUUFBUCxDQUFnQnlOLE9BQWhCLENBQXdCMEIsR0FBNUIsRUFBaUM7QUFDL0I5SyxpQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixZQUF0QixFQUFvQyxFQUFwQyxDQUFoQjtBQUNEO0FBQ0QsVUFBRzNILFFBQVE0SCxPQUFSLENBQWdCLGtCQUFoQixNQUF3QyxDQUFDLENBQXpDLElBQThDNUgsUUFBUTRILE9BQVIsQ0FBZ0IscUJBQWhCLE1BQTJDLENBQUMsQ0FBN0YsRUFBK0Y7QUFDN0Y2RSxpQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixZQUF0QixFQUFvQyxFQUFwQyxDQUFoQjtBQUNEO0FBQ0QsVUFBRzNILFFBQVE0SCxPQUFSLENBQWdCLGdDQUFoQixNQUFzRCxDQUFDLENBQTFELEVBQTREO0FBQzFENkUsaUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0IsZ0JBQXRCLEVBQXdDLEVBQXhDLENBQWhCO0FBQ0Q7QUFDRCxVQUFHM0gsUUFBUTRILE9BQVIsQ0FBZ0IsK0JBQWhCLE1BQXFELENBQUMsQ0FBekQsRUFBMkQ7QUFDekQ2RSxpQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixZQUF0QixFQUFvQyxFQUFwQyxDQUFoQjtBQUNEO0FBQ0QsVUFBRzNILFFBQVE0SCxPQUFSLENBQWdCLDhCQUFoQixNQUFvRCxDQUFDLENBQXhELEVBQTBEO0FBQ3hENkUsaUJBQVNvRCxJQUFULEdBQWdCcEQsU0FBU29ELElBQVQsQ0FBY2xJLE9BQWQsQ0FBc0IsZUFBdEIsRUFBdUMsRUFBdkMsQ0FBaEI7QUFDRDtBQUNELFVBQUczSCxRQUFRNEgsT0FBUixDQUFnQiw4QkFBaEIsTUFBb0QsQ0FBQyxDQUF4RCxFQUEwRDtBQUN4RDZFLGlCQUFTb0QsSUFBVCxHQUFnQnBELFNBQVNvRCxJQUFULENBQWNsSSxPQUFkLENBQXNCLGVBQXRCLEVBQXVDLEVBQXZDLENBQWhCO0FBQ0Q7QUFDRCxVQUFHaVAsV0FBSCxFQUFlO0FBQ2JuSyxpQkFBU29ELElBQVQsR0FBZ0JwRCxTQUFTb0QsSUFBVCxDQUFjbEksT0FBZCxDQUFzQixpQkFBdEIsRUFBeUMsRUFBekMsQ0FBaEI7QUFDRDtBQUNELFVBQUk2UCxlQUFldFYsU0FBU3VWLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBbkI7QUFDQUQsbUJBQWFFLFlBQWIsQ0FBMEIsVUFBMUIsRUFBc0MzUixTQUFPLEdBQVAsR0FBV3BFLElBQVgsR0FBZ0IsR0FBaEIsR0FBb0JuQixPQUFPMEMsR0FBUCxDQUFXb1EsY0FBL0IsR0FBOEMsTUFBcEY7QUFDQWtFLG1CQUFhRSxZQUFiLENBQTBCLE1BQTFCLEVBQWtDLGlDQUFpQ2hDLG1CQUFtQmpKLFNBQVNvRCxJQUE1QixDQUFuRTtBQUNBMkgsbUJBQWFHLEtBQWIsQ0FBbUJDLE9BQW5CLEdBQTZCLE1BQTdCO0FBQ0ExVixlQUFTMlYsSUFBVCxDQUFjQyxXQUFkLENBQTBCTixZQUExQjtBQUNBQSxtQkFBYU8sS0FBYjtBQUNBN1YsZUFBUzJWLElBQVQsQ0FBY0csV0FBZCxDQUEwQlIsWUFBMUI7QUFDRCxLQWxGSCxFQW1GR3hMLEtBbkZILENBbUZTLGVBQU87QUFDWnhMLGFBQU9xTSxlQUFQLGdDQUFvRFosSUFBSTNJLE9BQXhEO0FBQ0QsS0FyRkg7QUFzRkQ7O0FBRUQ5QyxTQUFPeVgsWUFBUCxHQUFzQixZQUFVO0FBQzlCelgsV0FBTzRILFFBQVAsQ0FBZ0I4UCxTQUFoQixHQUE0QixFQUE1QjtBQUNBbFgsZ0JBQVltWCxFQUFaLEdBQ0dyTSxJQURILENBQ1Esb0JBQVk7QUFDaEJ0TCxhQUFPNEgsUUFBUCxDQUFnQjhQLFNBQWhCLEdBQTRCekwsU0FBUzBMLEVBQXJDO0FBQ0QsS0FISCxFQUlHbk0sS0FKSCxDQUlTLGVBQU87QUFDWnhMLGFBQU9xTSxlQUFQLENBQXVCWixHQUF2QjtBQUNELEtBTkg7QUFPRCxHQVREOztBQVdBekwsU0FBTzRHLE1BQVAsR0FBZ0IsVUFBU2hELE1BQVQsRUFBZ0J1TyxLQUFoQixFQUFzQjs7QUFFcEM7QUFDQSxRQUFHLENBQUNBLEtBQUQsSUFBVXZPLE1BQVYsSUFBb0IsQ0FBQ0EsT0FBTzRCLElBQVAsQ0FBWUksR0FBakMsSUFDRTVGLE9BQU80SCxRQUFQLENBQWdCOE8sYUFBaEIsQ0FBOEJoQyxFQUE5QixLQUFxQyxLQUQxQyxFQUNnRDtBQUM1QztBQUNIO0FBQ0QsUUFBSTVELE9BQU8sSUFBSWxHLElBQUosRUFBWDtBQUNBO0FBQ0EsUUFBSTlILE9BQUo7QUFBQSxRQUNFOFUsT0FBTyxnQ0FEVDtBQUFBLFFBRUVsRSxRQUFRLE1BRlY7O0FBSUEsUUFBRzlQLFVBQVUsQ0FBQyxLQUFELEVBQU8sT0FBUCxFQUFlLE9BQWYsRUFBdUIsV0FBdkIsRUFBb0N3RCxPQUFwQyxDQUE0Q3hELE9BQU83QixJQUFuRCxNQUEyRCxDQUFDLENBQXpFLEVBQ0U2VixPQUFPLGlCQUFlaFUsT0FBTzdCLElBQXRCLEdBQTJCLE1BQWxDOztBQUVGO0FBQ0EsUUFBRzZCLFVBQVVBLE9BQU9pVSxHQUFqQixJQUF3QmpVLE9BQU9JLE1BQVAsQ0FBY0ssT0FBekMsRUFDRTs7QUFFRixRQUFJaVAsZUFBZ0IxUCxVQUFVQSxPQUFPNEIsSUFBbEIsR0FBMEI1QixPQUFPNEIsSUFBUCxDQUFZdEUsT0FBdEMsR0FBZ0QsQ0FBbkU7QUFDQSxRQUFJcVMsV0FBVyxTQUFTdlQsT0FBTzRILFFBQVAsQ0FBZ0JNLE9BQWhCLENBQXdCRSxJQUFoRDtBQUNBO0FBQ0EsUUFBR3hFLFVBQVVuQyxRQUFRakIsWUFBWTROLFdBQVosQ0FBd0J4SyxPQUFPNEIsSUFBUCxDQUFZekQsSUFBcEMsRUFBMENzTSxPQUFsRCxDQUFWLElBQXdFLE9BQU96SyxPQUFPeUssT0FBZCxJQUF5QixXQUFwRyxFQUFnSDtBQUM5R2lGLHFCQUFlMVAsT0FBT3lLLE9BQXRCO0FBQ0FrRixpQkFBVyxHQUFYO0FBQ0QsS0FIRCxNQUdPLElBQUczUCxNQUFILEVBQVU7QUFDZkEsYUFBT3dDLE1BQVAsQ0FBY25CLElBQWQsQ0FBbUIsQ0FBQzZMLEtBQUswQyxPQUFMLEVBQUQsRUFBZ0JGLFlBQWhCLENBQW5CO0FBQ0Q7O0FBRUQsUUFBRzdSLFFBQVEwUSxLQUFSLENBQUgsRUFBa0I7QUFBRTtBQUNsQixVQUFHLENBQUNuUyxPQUFPNEgsUUFBUCxDQUFnQjhPLGFBQWhCLENBQThCclEsTUFBbEMsRUFDRTtBQUNGLFVBQUc4TCxNQUFNRyxFQUFULEVBQ0V4UCxVQUFVLHNCQUFWLENBREYsS0FFSyxJQUFHckIsUUFBUTBRLE1BQU1mLEtBQWQsQ0FBSCxFQUNIdE8sVUFBVSxpQkFBZXFQLE1BQU1mLEtBQXJCLEdBQTJCLE1BQTNCLEdBQWtDZSxNQUFNbEIsS0FBbEQsQ0FERyxLQUdIbk8sVUFBVSxpQkFBZXFQLE1BQU1sQixLQUEvQjtBQUNILEtBVEQsTUFVSyxJQUFHck4sVUFBVUEsT0FBT2tVLElBQXBCLEVBQXlCO0FBQzVCLFVBQUcsQ0FBQzlYLE9BQU80SCxRQUFQLENBQWdCOE8sYUFBaEIsQ0FBOEJvQixJQUEvQixJQUF1QzlYLE9BQU80SCxRQUFQLENBQWdCOE8sYUFBaEIsQ0FBOEJxQixJQUE5QixJQUFvQyxNQUE5RSxFQUNFO0FBQ0ZqVixnQkFBVWMsT0FBT3pDLElBQVAsR0FBWSxNQUFaLEdBQW1CakIsUUFBUSxPQUFSLEVBQWlCMEQsT0FBT2tVLElBQVAsR0FBWWxVLE9BQU80QixJQUFQLENBQVlTLElBQXpDLEVBQThDLENBQTlDLENBQW5CLEdBQW9Fc04sUUFBcEUsR0FBNkUsT0FBdkY7QUFDQUcsY0FBUSxRQUFSO0FBQ0ExVCxhQUFPNEgsUUFBUCxDQUFnQjhPLGFBQWhCLENBQThCcUIsSUFBOUIsR0FBbUMsTUFBbkM7QUFDRCxLQU5JLE1BT0EsSUFBR25VLFVBQVVBLE9BQU9pVSxHQUFwQixFQUF3QjtBQUMzQixVQUFHLENBQUM3WCxPQUFPNEgsUUFBUCxDQUFnQjhPLGFBQWhCLENBQThCbUIsR0FBL0IsSUFBc0M3WCxPQUFPNEgsUUFBUCxDQUFnQjhPLGFBQWhCLENBQThCcUIsSUFBOUIsSUFBb0MsS0FBN0UsRUFDRTtBQUNGalYsZ0JBQVVjLE9BQU96QyxJQUFQLEdBQVksTUFBWixHQUFtQmpCLFFBQVEsT0FBUixFQUFpQjBELE9BQU9pVSxHQUFQLEdBQVdqVSxPQUFPNEIsSUFBUCxDQUFZUyxJQUF4QyxFQUE2QyxDQUE3QyxDQUFuQixHQUFtRXNOLFFBQW5FLEdBQTRFLE1BQXRGO0FBQ0FHLGNBQVEsU0FBUjtBQUNBMVQsYUFBTzRILFFBQVAsQ0FBZ0I4TyxhQUFoQixDQUE4QnFCLElBQTlCLEdBQW1DLEtBQW5DO0FBQ0QsS0FOSSxNQU9BLElBQUduVSxNQUFILEVBQVU7QUFDYixVQUFHLENBQUM1RCxPQUFPNEgsUUFBUCxDQUFnQjhPLGFBQWhCLENBQThCOVYsTUFBL0IsSUFBeUNaLE9BQU80SCxRQUFQLENBQWdCOE8sYUFBaEIsQ0FBOEJxQixJQUE5QixJQUFvQyxRQUFoRixFQUNFO0FBQ0ZqVixnQkFBVWMsT0FBT3pDLElBQVAsR0FBWSwyQkFBWixHQUF3Q21TLFlBQXhDLEdBQXFEQyxRQUEvRDtBQUNBRyxjQUFRLE1BQVI7QUFDQTFULGFBQU80SCxRQUFQLENBQWdCOE8sYUFBaEIsQ0FBOEJxQixJQUE5QixHQUFtQyxRQUFuQztBQUNELEtBTkksTUFPQSxJQUFHLENBQUNuVSxNQUFKLEVBQVc7QUFDZGQsZ0JBQVUsOERBQVY7QUFDRDs7QUFFRDtBQUNBLFFBQUksYUFBYWtWLFNBQWpCLEVBQTRCO0FBQzFCQSxnQkFBVUMsT0FBVixDQUFrQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUFsQjtBQUNEOztBQUVEO0FBQ0EsUUFBR2pZLE9BQU80SCxRQUFQLENBQWdCc1EsTUFBaEIsQ0FBdUJ4RCxFQUF2QixLQUE0QixJQUEvQixFQUFvQztBQUNsQztBQUNBLFVBQUdqVCxRQUFRMFEsS0FBUixLQUFrQnZPLE1BQWxCLElBQTRCQSxPQUFPaVUsR0FBbkMsSUFBMENqVSxPQUFPSSxNQUFQLENBQWNLLE9BQTNELEVBQ0U7QUFDRixVQUFJOFQsTUFBTSxJQUFJQyxLQUFKLENBQVczVyxRQUFRMFEsS0FBUixDQUFELEdBQW1CblMsT0FBTzRILFFBQVAsQ0FBZ0JzUSxNQUFoQixDQUF1Qi9GLEtBQTFDLEdBQWtEblMsT0FBTzRILFFBQVAsQ0FBZ0JzUSxNQUFoQixDQUF1QkcsS0FBbkYsQ0FBVixDQUprQyxDQUltRTtBQUNyR0YsVUFBSUcsSUFBSjtBQUNEOztBQUVEO0FBQ0EsUUFBRyxrQkFBa0J2WCxNQUFyQixFQUE0QjtBQUMxQjtBQUNBLFVBQUdLLFlBQUgsRUFDRUEsYUFBYW1YLEtBQWI7O0FBRUYsVUFBR0MsYUFBYUMsVUFBYixLQUE0QixTQUEvQixFQUF5QztBQUN2QyxZQUFHM1YsT0FBSCxFQUFXO0FBQ1QsY0FBR2MsTUFBSCxFQUNFeEMsZUFBZSxJQUFJb1gsWUFBSixDQUFpQjVVLE9BQU96QyxJQUFQLEdBQVksU0FBN0IsRUFBdUMsRUFBQ2tXLE1BQUt2VSxPQUFOLEVBQWM4VSxNQUFLQSxJQUFuQixFQUF2QyxDQUFmLENBREYsS0FHRXhXLGVBQWUsSUFBSW9YLFlBQUosQ0FBaUIsYUFBakIsRUFBK0IsRUFBQ25CLE1BQUt2VSxPQUFOLEVBQWM4VSxNQUFLQSxJQUFuQixFQUEvQixDQUFmO0FBQ0g7QUFDRixPQVBELE1BT08sSUFBR1ksYUFBYUMsVUFBYixLQUE0QixRQUEvQixFQUF3QztBQUM3Q0QscUJBQWFFLGlCQUFiLENBQStCLFVBQVVELFVBQVYsRUFBc0I7QUFDbkQ7QUFDQSxjQUFJQSxlQUFlLFNBQW5CLEVBQThCO0FBQzVCLGdCQUFHM1YsT0FBSCxFQUFXO0FBQ1QxQiw2QkFBZSxJQUFJb1gsWUFBSixDQUFpQjVVLE9BQU96QyxJQUFQLEdBQVksU0FBN0IsRUFBdUMsRUFBQ2tXLE1BQUt2VSxPQUFOLEVBQWM4VSxNQUFLQSxJQUFuQixFQUF2QyxDQUFmO0FBQ0Q7QUFDRjtBQUNGLFNBUEQ7QUFRRDtBQUNGO0FBQ0Q7QUFDQSxRQUFHNVgsT0FBTzRILFFBQVAsQ0FBZ0I4TyxhQUFoQixDQUE4QjdQLEtBQTlCLElBQXVDN0csT0FBTzRILFFBQVAsQ0FBZ0I4TyxhQUFoQixDQUE4QjdQLEtBQTlCLENBQW9DTyxPQUFwQyxDQUE0QyxNQUE1QyxNQUF3RCxDQUFsRyxFQUFvRztBQUNsRzVHLGtCQUFZcUcsS0FBWixDQUFrQjdHLE9BQU80SCxRQUFQLENBQWdCOE8sYUFBaEIsQ0FBOEI3UCxLQUFoRCxFQUNJL0QsT0FESixFQUVJNFEsS0FGSixFQUdJa0UsSUFISixFQUlJaFUsTUFKSixFQUtJMEgsSUFMSixDQUtTLFVBQVNXLFFBQVQsRUFBa0I7QUFDdkJqTSxlQUFPdVAsVUFBUDtBQUNELE9BUEgsRUFRRy9ELEtBUkgsQ0FRUyxVQUFTQyxHQUFULEVBQWE7QUFDbEIsWUFBR0EsSUFBSTNJLE9BQVAsRUFDRTlDLE9BQU9xTSxlQUFQLDhCQUFrRFosSUFBSTNJLE9BQXRELEVBREYsS0FHRTlDLE9BQU9xTSxlQUFQLDhCQUFrREksS0FBS2lHLFNBQUwsQ0FBZWpILEdBQWYsQ0FBbEQ7QUFDSCxPQWJIO0FBY0Q7QUFDRDtBQUNBLFFBQUdoSyxRQUFRbUMsT0FBTzRCLElBQVAsQ0FBWUssS0FBcEIsS0FBOEI3RixPQUFPNEgsUUFBUCxDQUFnQi9CLEtBQWhCLENBQXNCaEcsR0FBcEQsSUFBMkRHLE9BQU80SCxRQUFQLENBQWdCL0IsS0FBaEIsQ0FBc0JoRyxHQUF0QixDQUEwQnVILE9BQTFCLENBQWtDLE1BQWxDLE1BQThDLENBQTVHLEVBQThHO0FBQzVHNUcsa0JBQVlxRixLQUFaLEdBQW9COFMsSUFBcEIsQ0FBeUI7QUFDckI3VixpQkFBU0EsT0FEWTtBQUVyQjRRLGVBQU9BLEtBRmM7QUFHckJ0TCxjQUFNcEksT0FBTzRILFFBQVAsQ0FBZ0JNLE9BQWhCLENBQXdCRSxJQUhUO0FBSXJCakgsY0FBTXlDLE9BQU96QyxJQUpRO0FBS3JCWSxjQUFNNkIsT0FBTzdCLElBTFE7QUFNckJ5RCxjQUFNNUIsT0FBTzRCLElBTlE7QUFPckJ4QixnQkFBUUosT0FBT0ksTUFQTTtBQVFyQkUsY0FBTU4sT0FBT00sSUFSUTtBQVNyQkQsZ0JBQVFMLE9BQU9LLE1BQVAsSUFBaUIsRUFUSjtBQVVyQk8saUJBQVNaLE9BQU9ZO0FBVkssT0FBekIsRUFXSzhHLElBWEwsQ0FXVSxVQUFTVyxRQUFULEVBQWtCO0FBQ3hCak0sZUFBT3VQLFVBQVA7QUFDRCxPQWJILEVBY0cvRCxLQWRILENBY1MsVUFBU0MsR0FBVCxFQUFhO0FBQ2xCLFlBQUdBLElBQUkzSSxPQUFQLEVBQ0U5QyxPQUFPcU0sZUFBUCw4QkFBa0RaLElBQUkzSSxPQUF0RCxFQURGLEtBR0U5QyxPQUFPcU0sZUFBUCw4QkFBa0RJLEtBQUtpRyxTQUFMLENBQWVqSCxHQUFmLENBQWxEO0FBQ0gsT0FuQkg7QUFvQkQ7QUFDRixHQS9JRDs7QUFpSkF6TCxTQUFPdVMsY0FBUCxHQUF3QixVQUFTM08sTUFBVCxFQUFnQjs7QUFFdEMsUUFBRyxDQUFDQSxPQUFPTyxNQUFYLEVBQWtCO0FBQ2hCUCxhQUFPMEMsSUFBUCxDQUFZc1MsVUFBWixHQUF5QixNQUF6QjtBQUNBaFYsYUFBTzBDLElBQVAsQ0FBWXVTLFFBQVosR0FBdUIsTUFBdkI7QUFDQWpWLGFBQU8wQyxJQUFQLENBQVltTixPQUFaLENBQW9CeEIsSUFBcEIsR0FBMkIsYUFBM0I7QUFDQXJPLGFBQU8wQyxJQUFQLENBQVltTixPQUFaLENBQW9CQyxLQUFwQixHQUE0QixNQUE1QjtBQUNBO0FBQ0QsS0FORCxNQU1PLElBQUc5UCxPQUFPZCxPQUFQLENBQWVBLE9BQWYsSUFBMEJjLE9BQU9kLE9BQVAsQ0FBZWYsSUFBZixJQUF1QixRQUFwRCxFQUE2RDtBQUNsRTZCLGFBQU8wQyxJQUFQLENBQVlzUyxVQUFaLEdBQXlCLE1BQXpCO0FBQ0FoVixhQUFPMEMsSUFBUCxDQUFZdVMsUUFBWixHQUF1QixNQUF2QjtBQUNBalYsYUFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0J4QixJQUFwQixHQUEyQixPQUEzQjtBQUNBck8sYUFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0JDLEtBQXBCLEdBQTRCLE1BQTVCO0FBQ0E7QUFDRDtBQUNELFFBQUlKLGVBQWUxUCxPQUFPNEIsSUFBUCxDQUFZdEUsT0FBL0I7QUFDQSxRQUFJcVMsV0FBVyxNQUFmO0FBQ0E7QUFDQSxRQUFHOVIsUUFBUWpCLFlBQVk0TixXQUFaLENBQXdCeEssT0FBTzRCLElBQVAsQ0FBWXpELElBQXBDLEVBQTBDc00sT0FBbEQsS0FBOEQsT0FBT3pLLE9BQU95SyxPQUFkLElBQXlCLFdBQTFGLEVBQXNHO0FBQ3BHaUYscUJBQWUxUCxPQUFPeUssT0FBdEI7QUFDQWtGLGlCQUFXLEdBQVg7QUFDRDtBQUNEO0FBQ0EsUUFBR0QsZUFBZTFQLE9BQU80QixJQUFQLENBQVk1RSxNQUFaLEdBQW1CZ0QsT0FBTzRCLElBQVAsQ0FBWVMsSUFBakQsRUFBc0Q7QUFDcERyQyxhQUFPMEMsSUFBUCxDQUFZdVMsUUFBWixHQUF1QixrQkFBdkI7QUFDQWpWLGFBQU8wQyxJQUFQLENBQVlzUyxVQUFaLEdBQXlCLGtCQUF6QjtBQUNBaFYsYUFBT2tVLElBQVAsR0FBY3hFLGVBQWExUCxPQUFPNEIsSUFBUCxDQUFZNUUsTUFBdkM7QUFDQWdELGFBQU9pVSxHQUFQLEdBQWEsSUFBYjtBQUNBLFVBQUdqVSxPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNJLE9BQWxDLEVBQTBDO0FBQ3hDVCxlQUFPMEMsSUFBUCxDQUFZbU4sT0FBWixDQUFvQnhCLElBQXBCLEdBQTJCLFNBQTNCO0FBQ0FyTyxlQUFPMEMsSUFBUCxDQUFZbU4sT0FBWixDQUFvQkMsS0FBcEIsR0FBNEIsb0JBQTVCO0FBQ0QsT0FIRCxNQUdPO0FBQ0w7QUFDQTlQLGVBQU8wQyxJQUFQLENBQVltTixPQUFaLENBQW9CeEIsSUFBcEIsR0FBMkIvUixRQUFRLE9BQVIsRUFBaUIwRCxPQUFPa1UsSUFBUCxHQUFZbFUsT0FBTzRCLElBQVAsQ0FBWVMsSUFBekMsRUFBOEMsQ0FBOUMsSUFBaURzTixRQUFqRCxHQUEwRCxPQUFyRjtBQUNBM1AsZUFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0JDLEtBQXBCLEdBQTRCLGtCQUE1QjtBQUNEO0FBQ0YsS0FiRCxNQWFPLElBQUdKLGVBQWUxUCxPQUFPNEIsSUFBUCxDQUFZNUUsTUFBWixHQUFtQmdELE9BQU80QixJQUFQLENBQVlTLElBQWpELEVBQXNEO0FBQzNEckMsYUFBTzBDLElBQVAsQ0FBWXVTLFFBQVosR0FBdUIscUJBQXZCO0FBQ0FqVixhQUFPMEMsSUFBUCxDQUFZc1MsVUFBWixHQUF5QixxQkFBekI7QUFDQWhWLGFBQU9pVSxHQUFQLEdBQWFqVSxPQUFPNEIsSUFBUCxDQUFZNUUsTUFBWixHQUFtQjBTLFlBQWhDO0FBQ0ExUCxhQUFPa1UsSUFBUCxHQUFjLElBQWQ7QUFDQSxVQUFHbFUsT0FBT0ksTUFBUCxDQUFjSyxPQUFqQixFQUF5QjtBQUN2QlQsZUFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0J4QixJQUFwQixHQUEyQixTQUEzQjtBQUNBck8sZUFBTzBDLElBQVAsQ0FBWW1OLE9BQVosQ0FBb0JDLEtBQXBCLEdBQTRCLGtCQUE1QjtBQUNELE9BSEQsTUFHTztBQUNMO0FBQ0E5UCxlQUFPMEMsSUFBUCxDQUFZbU4sT0FBWixDQUFvQnhCLElBQXBCLEdBQTJCL1IsUUFBUSxPQUFSLEVBQWlCMEQsT0FBT2lVLEdBQVAsR0FBV2pVLE9BQU80QixJQUFQLENBQVlTLElBQXhDLEVBQTZDLENBQTdDLElBQWdEc04sUUFBaEQsR0FBeUQsTUFBcEY7QUFDQTNQLGVBQU8wQyxJQUFQLENBQVltTixPQUFaLENBQW9CQyxLQUFwQixHQUE0QixvQkFBNUI7QUFDRDtBQUNGLEtBYk0sTUFhQTtBQUNMOVAsYUFBTzBDLElBQVAsQ0FBWXVTLFFBQVosR0FBdUIscUJBQXZCO0FBQ0FqVixhQUFPMEMsSUFBUCxDQUFZc1MsVUFBWixHQUF5QixxQkFBekI7QUFDQWhWLGFBQU8wQyxJQUFQLENBQVltTixPQUFaLENBQW9CeEIsSUFBcEIsR0FBMkIsZUFBM0I7QUFDQXJPLGFBQU8wQyxJQUFQLENBQVltTixPQUFaLENBQW9CQyxLQUFwQixHQUE0QixNQUE1QjtBQUNBOVAsYUFBT2lVLEdBQVAsR0FBYSxJQUFiO0FBQ0FqVSxhQUFPa1UsSUFBUCxHQUFjLElBQWQ7QUFDRDtBQUNGLEdBekREOztBQTJEQTlYLFNBQU84WSxnQkFBUCxHQUEwQixVQUFTbFYsTUFBVCxFQUFnQjtBQUN4QztBQUNBLFFBQUltVixjQUFjaFUsRUFBRWlVLFNBQUYsQ0FBWWhaLE9BQU8yQyxXQUFuQixFQUFnQyxFQUFDWixNQUFNNkIsT0FBTzdCLElBQWQsRUFBaEMsQ0FBbEI7QUFDQTtBQUNBZ1g7QUFDQSxRQUFJaEQsYUFBYy9WLE9BQU8yQyxXQUFQLENBQW1Cb1csV0FBbkIsQ0FBRCxHQUFvQy9ZLE9BQU8yQyxXQUFQLENBQW1Cb1csV0FBbkIsQ0FBcEMsR0FBc0UvWSxPQUFPMkMsV0FBUCxDQUFtQixDQUFuQixDQUF2RjtBQUNBO0FBQ0FpQixXQUFPekMsSUFBUCxHQUFjNFUsV0FBVzVVLElBQXpCO0FBQ0F5QyxXQUFPN0IsSUFBUCxHQUFjZ1UsV0FBV2hVLElBQXpCO0FBQ0E2QixXQUFPNEIsSUFBUCxDQUFZNUUsTUFBWixHQUFxQm1WLFdBQVduVixNQUFoQztBQUNBZ0QsV0FBTzRCLElBQVAsQ0FBWVMsSUFBWixHQUFtQjhQLFdBQVc5UCxJQUE5QjtBQUNBckMsV0FBTzBDLElBQVAsR0FBY3hILFFBQVF5SCxJQUFSLENBQWEvRixZQUFZZ0csa0JBQVosRUFBYixFQUE4QyxFQUFDbEQsT0FBTU0sT0FBTzRCLElBQVAsQ0FBWXRFLE9BQW5CLEVBQTJCOEIsS0FBSSxDQUEvQixFQUFpQ3lELEtBQUlzUCxXQUFXblYsTUFBWCxHQUFrQm1WLFdBQVc5UCxJQUFsRSxFQUE5QyxDQUFkO0FBQ0EsUUFBRzhQLFdBQVdoVSxJQUFYLElBQW1CLFdBQW5CLElBQWtDZ1UsV0FBV2hVLElBQVgsSUFBbUIsS0FBeEQsRUFBOEQ7QUFDNUQ2QixhQUFPSyxNQUFQLEdBQWdCLEVBQUNpQixLQUFJLElBQUwsRUFBVWIsU0FBUSxLQUFsQixFQUF3QmdCLE1BQUssS0FBN0IsRUFBbUNqQixLQUFJLEtBQXZDLEVBQTZDa0IsV0FBVSxHQUF2RCxFQUEyREMsUUFBTyxLQUFsRSxFQUFoQjtBQUNBLGFBQU8zQixPQUFPTSxJQUFkO0FBQ0QsS0FIRCxNQUdPO0FBQ0xOLGFBQU9NLElBQVAsR0FBYyxFQUFDZ0IsS0FBSSxJQUFMLEVBQVViLFNBQVEsS0FBbEIsRUFBd0JnQixNQUFLLEtBQTdCLEVBQW1DakIsS0FBSSxLQUF2QyxFQUE2Q2tCLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFBZDtBQUNBLGFBQU8zQixPQUFPSyxNQUFkO0FBQ0Q7QUFDRixHQW5CRDs7QUFxQkFqRSxTQUFPaVosV0FBUCxHQUFxQixVQUFTN1EsSUFBVCxFQUFjO0FBQ2pDLFFBQUdwSSxPQUFPNEgsUUFBUCxDQUFnQk0sT0FBaEIsQ0FBd0JFLElBQXhCLElBQWdDQSxJQUFuQyxFQUF3QztBQUN0Q3BJLGFBQU80SCxRQUFQLENBQWdCTSxPQUFoQixDQUF3QkUsSUFBeEIsR0FBK0JBLElBQS9CO0FBQ0FyRCxRQUFFQyxJQUFGLENBQU9oRixPQUFPK0QsT0FBZCxFQUFzQixVQUFTSCxNQUFULEVBQWdCO0FBQ3BDQSxlQUFPNEIsSUFBUCxDQUFZNUUsTUFBWixHQUFxQjBHLFdBQVcxRCxPQUFPNEIsSUFBUCxDQUFZNUUsTUFBdkIsQ0FBckI7QUFDQWdELGVBQU80QixJQUFQLENBQVl0RSxPQUFaLEdBQXNCb0csV0FBVzFELE9BQU80QixJQUFQLENBQVl0RSxPQUF2QixDQUF0QjtBQUNBMEMsZUFBTzRCLElBQVAsQ0FBWXRFLE9BQVosR0FBc0JoQixRQUFRLGVBQVIsRUFBeUIwRCxPQUFPNEIsSUFBUCxDQUFZdEUsT0FBckMsRUFBNkNrSCxJQUE3QyxDQUF0QjtBQUNBeEUsZUFBTzRCLElBQVAsQ0FBWU0sUUFBWixHQUF1QjVGLFFBQVEsZUFBUixFQUF5QjBELE9BQU80QixJQUFQLENBQVlNLFFBQXJDLEVBQThDc0MsSUFBOUMsQ0FBdkI7QUFDQXhFLGVBQU80QixJQUFQLENBQVlPLFFBQVosR0FBdUI3RixRQUFRLGVBQVIsRUFBeUIwRCxPQUFPNEIsSUFBUCxDQUFZTyxRQUFyQyxFQUE4Q3FDLElBQTlDLENBQXZCO0FBQ0F4RSxlQUFPNEIsSUFBUCxDQUFZNUUsTUFBWixHQUFxQlYsUUFBUSxlQUFSLEVBQXlCMEQsT0FBTzRCLElBQVAsQ0FBWTVFLE1BQXJDLEVBQTRDd0gsSUFBNUMsQ0FBckI7QUFDQXhFLGVBQU80QixJQUFQLENBQVk1RSxNQUFaLEdBQXFCVixRQUFRLE9BQVIsRUFBaUIwRCxPQUFPNEIsSUFBUCxDQUFZNUUsTUFBN0IsRUFBb0MsQ0FBcEMsQ0FBckI7QUFDQSxZQUFHYSxRQUFRbUMsT0FBTzRCLElBQVAsQ0FBWVEsTUFBcEIsQ0FBSCxFQUErQjtBQUM3QnBDLGlCQUFPNEIsSUFBUCxDQUFZUSxNQUFaLEdBQXFCc0IsV0FBVzFELE9BQU80QixJQUFQLENBQVlRLE1BQXZCLENBQXJCO0FBQ0EsY0FBR29DLFNBQVMsR0FBWixFQUNFeEUsT0FBTzRCLElBQVAsQ0FBWVEsTUFBWixHQUFxQjlGLFFBQVEsT0FBUixFQUFpQjBELE9BQU80QixJQUFQLENBQVlRLE1BQVosR0FBbUIsS0FBcEMsRUFBMEMsQ0FBMUMsQ0FBckIsQ0FERixLQUdFcEMsT0FBTzRCLElBQVAsQ0FBWVEsTUFBWixHQUFxQjlGLFFBQVEsT0FBUixFQUFpQjBELE9BQU80QixJQUFQLENBQVlRLE1BQVosR0FBbUIsR0FBcEMsRUFBd0MsQ0FBeEMsQ0FBckI7QUFDSDtBQUNEO0FBQ0EsWUFBR3BDLE9BQU93QyxNQUFQLENBQWN0QixNQUFqQixFQUF3QjtBQUNwQkMsWUFBRUMsSUFBRixDQUFPcEIsT0FBT3dDLE1BQWQsRUFBc0IsVUFBQzhTLENBQUQsRUFBSWpFLENBQUosRUFBVTtBQUM5QnJSLG1CQUFPd0MsTUFBUCxDQUFjNk8sQ0FBZCxJQUFtQixDQUFDclIsT0FBT3dDLE1BQVAsQ0FBYzZPLENBQWQsRUFBaUIsQ0FBakIsQ0FBRCxFQUFxQi9VLFFBQVEsZUFBUixFQUF5QjBELE9BQU93QyxNQUFQLENBQWM2TyxDQUFkLEVBQWlCLENBQWpCLENBQXpCLEVBQTZDN00sSUFBN0MsQ0FBckIsQ0FBbkI7QUFDSCxXQUZDO0FBR0g7QUFDRDtBQUNBeEUsZUFBTzBDLElBQVAsQ0FBWWhELEtBQVosR0FBb0JNLE9BQU80QixJQUFQLENBQVl0RSxPQUFoQztBQUNBMEMsZUFBTzBDLElBQVAsQ0FBWUcsR0FBWixHQUFrQjdDLE9BQU80QixJQUFQLENBQVk1RSxNQUFaLEdBQW1CZ0QsT0FBTzRCLElBQVAsQ0FBWVMsSUFBL0IsR0FBb0MsRUFBdEQ7QUFDQWpHLGVBQU91UyxjQUFQLENBQXNCM08sTUFBdEI7QUFDRCxPQXpCRDtBQTBCQTVELGFBQU9tSSxZQUFQLEdBQXNCM0gsWUFBWTJILFlBQVosQ0FBeUIsRUFBQ0MsTUFBTXBJLE9BQU80SCxRQUFQLENBQWdCTSxPQUFoQixDQUF3QkUsSUFBL0IsRUFBcUNDLE9BQU9ySSxPQUFPNEgsUUFBUCxDQUFnQlMsS0FBNUQsRUFBekIsQ0FBdEI7QUFDRDtBQUNGLEdBL0JEOztBQWlDQXJJLFNBQU9tWixRQUFQLEdBQWtCLFVBQVNoSCxLQUFULEVBQWV2TyxNQUFmLEVBQXNCO0FBQ3RDLFdBQU94RCxVQUFVLFlBQVk7QUFDM0I7QUFDQSxVQUFHLENBQUMrUixNQUFNRyxFQUFQLElBQWFILE1BQU1uUCxHQUFOLElBQVcsQ0FBeEIsSUFBNkJtUCxNQUFNMkIsR0FBTixJQUFXLENBQTNDLEVBQTZDO0FBQzNDO0FBQ0EzQixjQUFNOU4sT0FBTixHQUFnQixLQUFoQjtBQUNBO0FBQ0E4TixjQUFNRyxFQUFOLEdBQVcsRUFBQ3RQLEtBQUksQ0FBTCxFQUFPOFEsS0FBSSxDQUFYLEVBQWF6UCxTQUFRLElBQXJCLEVBQVg7QUFDQTtBQUNBLFlBQUk1QyxRQUFRbUMsTUFBUixLQUFtQm1CLEVBQUV5QyxNQUFGLENBQVM1RCxPQUFPeUMsTUFBaEIsRUFBd0IsRUFBQ2lNLElBQUksRUFBQ2pPLFNBQVEsSUFBVCxFQUFMLEVBQXhCLEVBQThDUyxNQUE5QyxJQUF3RGxCLE9BQU95QyxNQUFQLENBQWN2QixNQUE3RixFQUNFOUUsT0FBTzRHLE1BQVAsQ0FBY2hELE1BQWQsRUFBcUJ1TyxLQUFyQjtBQUNILE9BUkQsTUFRTyxJQUFHLENBQUNBLE1BQU1HLEVBQVAsSUFBYUgsTUFBTTJCLEdBQU4sR0FBWSxDQUE1QixFQUE4QjtBQUNuQztBQUNBM0IsY0FBTTJCLEdBQU47QUFDRCxPQUhNLE1BR0EsSUFBRzNCLE1BQU1HLEVBQU4sSUFBWUgsTUFBTUcsRUFBTixDQUFTd0IsR0FBVCxHQUFlLEVBQTlCLEVBQWlDO0FBQ3RDO0FBQ0EzQixjQUFNRyxFQUFOLENBQVN3QixHQUFUO0FBQ0QsT0FITSxNQUdBLElBQUcsQ0FBQzNCLE1BQU1HLEVBQVYsRUFBYTtBQUNsQjtBQUNBLFlBQUc3USxRQUFRbUMsTUFBUixDQUFILEVBQW1CO0FBQ2pCbUIsWUFBRUMsSUFBRixDQUFPRCxFQUFFeUMsTUFBRixDQUFTNUQsT0FBT3lDLE1BQWhCLEVBQXdCLEVBQUNoQyxTQUFRLEtBQVQsRUFBZXJCLEtBQUltUCxNQUFNblAsR0FBekIsRUFBNkJxUCxPQUFNLEtBQW5DLEVBQXhCLENBQVAsRUFBMEUsVUFBUytHLFNBQVQsRUFBbUI7QUFDM0ZwWixtQkFBTzRHLE1BQVAsQ0FBY2hELE1BQWQsRUFBcUJ3VixTQUFyQjtBQUNBQSxzQkFBVS9HLEtBQVYsR0FBZ0IsSUFBaEI7QUFDQWxTLHFCQUFTLFlBQVU7QUFDakJILHFCQUFPb1MsVUFBUCxDQUFrQmdILFNBQWxCLEVBQTRCeFYsTUFBNUI7QUFDRCxhQUZELEVBRUUsS0FGRjtBQUdELFdBTkQ7QUFPRDtBQUNEO0FBQ0F1TyxjQUFNMkIsR0FBTixHQUFVLEVBQVY7QUFDQTNCLGNBQU1uUCxHQUFOO0FBQ0QsT0FkTSxNQWNBLElBQUdtUCxNQUFNRyxFQUFULEVBQVk7QUFDakI7QUFDQUgsY0FBTUcsRUFBTixDQUFTd0IsR0FBVCxHQUFhLENBQWI7QUFDQTNCLGNBQU1HLEVBQU4sQ0FBU3RQLEdBQVQ7QUFDRDtBQUNGLEtBbkNNLEVBbUNMLElBbkNLLENBQVA7QUFvQ0QsR0FyQ0Q7O0FBdUNBaEQsU0FBT29TLFVBQVAsR0FBb0IsVUFBU0QsS0FBVCxFQUFldk8sTUFBZixFQUFzQjtBQUN4QyxRQUFHdU8sTUFBTUcsRUFBTixJQUFZSCxNQUFNRyxFQUFOLENBQVNqTyxPQUF4QixFQUFnQztBQUM5QjtBQUNBOE4sWUFBTUcsRUFBTixDQUFTak8sT0FBVCxHQUFpQixLQUFqQjtBQUNBakUsZ0JBQVVpWixNQUFWLENBQWlCbEgsTUFBTW1ILFFBQXZCO0FBQ0QsS0FKRCxNQUlPLElBQUduSCxNQUFNOU4sT0FBVCxFQUFpQjtBQUN0QjtBQUNBOE4sWUFBTTlOLE9BQU4sR0FBYyxLQUFkO0FBQ0FqRSxnQkFBVWlaLE1BQVYsQ0FBaUJsSCxNQUFNbUgsUUFBdkI7QUFDRCxLQUpNLE1BSUE7QUFDTDtBQUNBbkgsWUFBTTlOLE9BQU4sR0FBYyxJQUFkO0FBQ0E4TixZQUFNRSxLQUFOLEdBQVksS0FBWjtBQUNBRixZQUFNbUgsUUFBTixHQUFpQnRaLE9BQU9tWixRQUFQLENBQWdCaEgsS0FBaEIsRUFBc0J2TyxNQUF0QixDQUFqQjtBQUNEO0FBQ0YsR0FmRDs7QUFpQkE1RCxTQUFPdVosWUFBUCxHQUFzQixZQUFVO0FBQzlCLFFBQUlDLGFBQWEsRUFBakI7QUFDQSxRQUFJMUksT0FBTyxJQUFJbEcsSUFBSixFQUFYO0FBQ0E7QUFDQTdGLE1BQUVDLElBQUYsQ0FBT2hGLE9BQU8rRCxPQUFkLEVBQXVCLFVBQUNELENBQUQsRUFBSW1SLENBQUosRUFBVTtBQUMvQixVQUFHalYsT0FBTytELE9BQVAsQ0FBZWtSLENBQWYsRUFBa0I5USxNQUFyQixFQUE0QjtBQUMxQnFWLG1CQUFXdlUsSUFBWCxDQUFnQnpFLFlBQVlnRixJQUFaLENBQWlCeEYsT0FBTytELE9BQVAsQ0FBZWtSLENBQWYsQ0FBakIsRUFDYjNKLElBRGEsQ0FDUjtBQUFBLGlCQUFZdEwsT0FBTytTLFVBQVAsQ0FBa0I5RyxRQUFsQixFQUE0QmpNLE9BQU8rRCxPQUFQLENBQWVrUixDQUFmLENBQTVCLENBQVo7QUFBQSxTQURRLEVBRWJ6SixLQUZhLENBRVAsZUFBTztBQUNaO0FBQ0E1SCxpQkFBT3dDLE1BQVAsQ0FBY25CLElBQWQsQ0FBbUIsQ0FBQzZMLEtBQUswQyxPQUFMLEVBQUQsRUFBZ0I1UCxPQUFPNEIsSUFBUCxDQUFZdEUsT0FBNUIsQ0FBbkI7QUFDQSxjQUFHbEIsT0FBTytELE9BQVAsQ0FBZWtSLENBQWYsRUFBa0JwUyxLQUFsQixDQUF3QjhELEtBQTNCLEVBQ0UzRyxPQUFPK0QsT0FBUCxDQUFla1IsQ0FBZixFQUFrQnBTLEtBQWxCLENBQXdCOEQsS0FBeEIsR0FERixLQUdFM0csT0FBTytELE9BQVAsQ0FBZWtSLENBQWYsRUFBa0JwUyxLQUFsQixDQUF3QjhELEtBQXhCLEdBQThCLENBQTlCO0FBQ0YsY0FBRzNHLE9BQU8rRCxPQUFQLENBQWVrUixDQUFmLEVBQWtCcFMsS0FBbEIsQ0FBd0I4RCxLQUF4QixJQUFpQyxDQUFwQyxFQUFzQztBQUNwQzNHLG1CQUFPK0QsT0FBUCxDQUFla1IsQ0FBZixFQUFrQnBTLEtBQWxCLENBQXdCOEQsS0FBeEIsR0FBOEIsQ0FBOUI7QUFDQTNHLG1CQUFPcU0sZUFBUCxDQUF1QlosR0FBdkIsRUFBNEJ6TCxPQUFPK0QsT0FBUCxDQUFla1IsQ0FBZixDQUE1QjtBQUNEO0FBQ0QsaUJBQU94SixHQUFQO0FBQ0QsU0FkYSxDQUFoQjtBQWVEO0FBQ0YsS0FsQkQ7O0FBb0JBLFdBQU9wTCxHQUFHd1IsR0FBSCxDQUFPMkgsVUFBUCxFQUNKbE8sSUFESSxDQUNDLGtCQUFVO0FBQ2Q7QUFDQW5MLGVBQVMsWUFBVTtBQUNmLGVBQU9ILE9BQU91WixZQUFQLEVBQVA7QUFDSCxPQUZELEVBRUU5WCxRQUFRekIsT0FBTzRILFFBQVAsQ0FBZ0I2UixXQUF4QixJQUF1Q3paLE9BQU80SCxRQUFQLENBQWdCNlIsV0FBaEIsR0FBNEIsSUFBbkUsR0FBMEUsS0FGNUU7QUFHRCxLQU5JLEVBT0pqTyxLQVBJLENBT0UsZUFBTztBQUNackwsZUFBUyxZQUFVO0FBQ2YsZUFBT0gsT0FBT3VaLFlBQVAsRUFBUDtBQUNILE9BRkQsRUFFRTlYLFFBQVF6QixPQUFPNEgsUUFBUCxDQUFnQjZSLFdBQXhCLElBQXVDelosT0FBTzRILFFBQVAsQ0FBZ0I2UixXQUFoQixHQUE0QixJQUFuRSxHQUEwRSxLQUY1RTtBQUdILEtBWE0sQ0FBUDtBQVlELEdBcENEOztBQXNDQXpaLFNBQU8wWixZQUFQLEdBQXNCLFVBQVU5VixNQUFWLEVBQWtCK1YsTUFBbEIsRUFBMEI7QUFDOUMsUUFBR0MsUUFBUSw4Q0FBUixDQUFILEVBQ0U1WixPQUFPK0QsT0FBUCxDQUFlcUgsTUFBZixDQUFzQnVPLE1BQXRCLEVBQTZCLENBQTdCO0FBQ0gsR0FIRDs7QUFLQTNaLFNBQU82WixXQUFQLEdBQXFCLFVBQVVqVyxNQUFWLEVBQWtCK1YsTUFBbEIsRUFBMEI7QUFDN0MzWixXQUFPK0QsT0FBUCxDQUFlNFYsTUFBZixFQUF1QnZULE1BQXZCLEdBQWdDLEVBQWhDO0FBQ0QsR0FGRDs7QUFJQXBHLFNBQU84WixXQUFQLEdBQXFCLFVBQVNsVyxNQUFULEVBQWdCbVcsS0FBaEIsRUFBc0J6SCxFQUF0QixFQUF5Qjs7QUFFNUMsUUFBR2hSLE9BQUgsRUFDRW5CLFNBQVNrWixNQUFULENBQWdCL1gsT0FBaEI7O0FBRUYsUUFBR2dSLEVBQUgsRUFDRTFPLE9BQU80QixJQUFQLENBQVl1VSxLQUFaLElBREYsS0FHRW5XLE9BQU80QixJQUFQLENBQVl1VSxLQUFaOztBQUVGLFFBQUdBLFNBQVMsUUFBWixFQUFxQjtBQUNuQm5XLGFBQU80QixJQUFQLENBQVl0RSxPQUFaLEdBQXVCb0csV0FBVzFELE9BQU80QixJQUFQLENBQVlNLFFBQXZCLElBQW1Dd0IsV0FBVzFELE9BQU80QixJQUFQLENBQVlRLE1BQXZCLENBQTFEO0FBQ0Q7O0FBRUQ7QUFDQTFFLGNBQVVuQixTQUFTLFlBQVU7QUFDM0I7QUFDQXlELGFBQU8wQyxJQUFQLENBQVlHLEdBQVosR0FBa0I3QyxPQUFPNEIsSUFBUCxDQUFZLFFBQVosSUFBc0I1QixPQUFPNEIsSUFBUCxDQUFZLE1BQVosQ0FBdEIsR0FBMEMsRUFBNUQ7QUFDQXhGLGFBQU91UyxjQUFQLENBQXNCM08sTUFBdEI7QUFDRCxLQUpTLEVBSVIsSUFKUSxDQUFWO0FBS0QsR0FwQkQ7O0FBc0JBNUQsU0FBTzBSLFVBQVAsR0FBb0I7QUFBcEIsR0FDR3BHLElBREgsQ0FDUXRMLE9BQU84UixJQURmLEVBQ3FCO0FBRHJCLEdBRUd4RyxJQUZILENBRVEsa0JBQVU7QUFDZCxRQUFHN0osUUFBUXVZLE1BQVIsQ0FBSCxFQUNFaGEsT0FBT3VaLFlBQVAsR0FGWSxDQUVXO0FBQzFCLEdBTEg7O0FBT0E7QUFDQXZaLFNBQU9pYSxXQUFQLEdBQXFCLFlBQVk7QUFDL0I5WixhQUFTLFlBQVk7QUFDbkJLLGtCQUFZb0gsUUFBWixDQUFxQixVQUFyQixFQUFpQzVILE9BQU80SCxRQUF4QztBQUNBcEgsa0JBQVlvSCxRQUFaLENBQXFCLFNBQXJCLEVBQWdDNUgsT0FBTytELE9BQXZDO0FBQ0EvRCxhQUFPaWEsV0FBUDtBQUNELEtBSkQsRUFJRyxJQUpIO0FBS0QsR0FORDs7QUFRQWphLFNBQU9pYSxXQUFQO0FBRUQsQ0E1MURELEU7Ozs7Ozs7Ozs7O0FDQUFuYixRQUFRQyxNQUFSLENBQWUsbUJBQWYsRUFDQ21iLFNBREQsQ0FDVyxVQURYLEVBQ3VCLFlBQVc7QUFDOUIsV0FBTztBQUNIQyxrQkFBVSxHQURQO0FBRUhDLGVBQU8sRUFBQ0MsT0FBTSxHQUFQLEVBQVd0WSxNQUFLLElBQWhCLEVBQXFCNlUsTUFBSyxJQUExQixFQUErQjBELFFBQU8sSUFBdEMsRUFBMkNDLE9BQU0sSUFBakQsRUFBc0RDLGFBQVksSUFBbEUsRUFGSjtBQUdIclQsaUJBQVMsS0FITjtBQUlIc1Qsa0JBQ1IsV0FDSSxzSUFESixHQUVRLHNJQUZSLEdBR1EscUVBSFIsR0FJQSxTQVRXO0FBVUhDLGNBQU0sY0FBU04sS0FBVCxFQUFnQnpaLE9BQWhCLEVBQXlCZ2EsS0FBekIsRUFBZ0M7QUFDbENQLGtCQUFNUSxJQUFOLEdBQWEsS0FBYjtBQUNBUixrQkFBTXJZLElBQU4sR0FBYU4sUUFBUTJZLE1BQU1yWSxJQUFkLElBQXNCcVksTUFBTXJZLElBQTVCLEdBQW1DLE1BQWhEO0FBQ0FwQixvQkFBUWthLElBQVIsQ0FBYSxPQUFiLEVBQXNCLFlBQVc7QUFDN0JULHNCQUFNVSxNQUFOLENBQWFWLE1BQU1RLElBQU4sR0FBYSxJQUExQjtBQUNILGFBRkQ7QUFHQSxnQkFBR1IsTUFBTUcsS0FBVCxFQUFnQkgsTUFBTUcsS0FBTjtBQUNuQjtBQWpCRSxLQUFQO0FBbUJILENBckJELEVBc0JDTCxTQXRCRCxDQXNCVyxTQXRCWCxFQXNCc0IsWUFBVztBQUM3QixXQUFPLFVBQVNFLEtBQVQsRUFBZ0J6WixPQUFoQixFQUF5QmdhLEtBQXpCLEVBQWdDO0FBQ25DaGEsZ0JBQVFrYSxJQUFSLENBQWEsVUFBYixFQUF5QixVQUFTbmEsQ0FBVCxFQUFZO0FBQ2pDLGdCQUFJQSxFQUFFcWEsUUFBRixLQUFlLEVBQWYsSUFBcUJyYSxFQUFFc2EsT0FBRixLQUFhLEVBQXRDLEVBQTJDO0FBQ3pDWixzQkFBTVUsTUFBTixDQUFhSCxNQUFNTSxPQUFuQjtBQUNBLG9CQUFHYixNQUFNRSxNQUFULEVBQ0VGLE1BQU1VLE1BQU4sQ0FBYVYsTUFBTUUsTUFBbkI7QUFDSDtBQUNKLFNBTkQ7QUFPSCxLQVJEO0FBU0gsQ0FoQ0QsRUFpQ0NKLFNBakNELENBaUNXLFlBakNYLEVBaUN5QixVQUFVZ0IsTUFBVixFQUFrQjtBQUMxQyxXQUFPO0FBQ05mLGtCQUFVLEdBREo7QUFFTkMsZUFBTyxLQUZEO0FBR05NLGNBQU0sY0FBU04sS0FBVCxFQUFnQnpaLE9BQWhCLEVBQXlCZ2EsS0FBekIsRUFBZ0M7QUFDbEMsZ0JBQUlRLEtBQUtELE9BQU9QLE1BQU1TLFVBQWIsQ0FBVDtBQUNIemEsb0JBQVErVCxFQUFSLENBQVcsUUFBWCxFQUFxQixVQUFTMkcsYUFBVCxFQUF3QjtBQUM1QyxvQkFBSUMsU0FBUyxJQUFJQyxVQUFKLEVBQWI7QUFDWSxvQkFBSUMsT0FBTyxDQUFDSCxjQUFjSSxVQUFkLElBQTRCSixjQUFjemEsTUFBM0MsRUFBbUQ4YSxLQUFuRCxDQUF5RCxDQUF6RCxDQUFYO0FBQ0Esb0JBQUlDLFlBQWFILElBQUQsR0FBU0EsS0FBS3JhLElBQUwsQ0FBVTBDLEtBQVYsQ0FBZ0IsR0FBaEIsRUFBcUIrWCxHQUFyQixHQUEyQjFGLFdBQTNCLEVBQVQsR0FBb0QsRUFBcEU7QUFDWm9GLHVCQUFPTyxNQUFQLEdBQWdCLFVBQVNDLFdBQVQsRUFBc0I7QUFDckMxQiwwQkFBTVUsTUFBTixDQUFhLFlBQVc7QUFDVEssMkJBQUdmLEtBQUgsRUFBVSxFQUFDekssY0FBY21NLFlBQVlsYixNQUFaLENBQW1CbWIsTUFBbEMsRUFBMENuTSxNQUFNK0wsU0FBaEQsRUFBVjtBQUNBaGIsZ0NBQVFxYixHQUFSLENBQVksSUFBWjtBQUNYLHFCQUhKO0FBSUEsaUJBTEQ7QUFNQVYsdUJBQU9XLFVBQVAsQ0FBa0JULElBQWxCO0FBQ0EsYUFYRDtBQVlBO0FBakJLLEtBQVA7QUFtQkEsQ0FyREQsRTs7Ozs7Ozs7OztBQ0FBMWMsUUFBUUMsTUFBUixDQUFlLG1CQUFmLEVBQ0N5SSxNQURELENBQ1EsUUFEUixFQUNrQixZQUFXO0FBQzNCLFNBQU8sVUFBU3NKLElBQVQsRUFBZTVCLE1BQWYsRUFBdUI7QUFDMUIsUUFBRyxDQUFDNEIsSUFBSixFQUNFLE9BQU8sRUFBUDtBQUNGLFFBQUc1QixNQUFILEVBQ0UsT0FBT0QsT0FBTyxJQUFJckUsSUFBSixDQUFTa0csSUFBVCxDQUFQLEVBQXVCNUIsTUFBdkIsQ0FBOEJBLE1BQTlCLENBQVAsQ0FERixLQUdFLE9BQU9ELE9BQU8sSUFBSXJFLElBQUosQ0FBU2tHLElBQVQsQ0FBUCxFQUF1Qm9MLE9BQXZCLEVBQVA7QUFDSCxHQVBIO0FBUUQsQ0FWRCxFQVdDMVUsTUFYRCxDQVdRLGVBWFIsRUFXeUIsVUFBU3RILE9BQVQsRUFBa0I7QUFDekMsU0FBTyxVQUFTc0YsSUFBVCxFQUFjNEMsSUFBZCxFQUFvQjtBQUN6QixRQUFHQSxRQUFNLEdBQVQsRUFDRSxPQUFPbEksUUFBUSxjQUFSLEVBQXdCc0YsSUFBeEIsQ0FBUCxDQURGLEtBR0UsT0FBT3RGLFFBQVEsV0FBUixFQUFxQnNGLElBQXJCLENBQVA7QUFDSCxHQUxEO0FBTUQsQ0FsQkQsRUFtQkNnQyxNQW5CRCxDQW1CUSxjQW5CUixFQW1Cd0IsVUFBU3RILE9BQVQsRUFBa0I7QUFDeEMsU0FBTyxVQUFTaWMsT0FBVCxFQUFrQjtBQUN2QkEsY0FBVTdVLFdBQVc2VSxPQUFYLENBQVY7QUFDQSxXQUFPamMsUUFBUSxPQUFSLEVBQWlCaWMsVUFBUSxDQUFSLEdBQVUsQ0FBVixHQUFZLEVBQTdCLEVBQWdDLENBQWhDLENBQVA7QUFDRCxHQUhEO0FBSUQsQ0F4QkQsRUF5QkMzVSxNQXpCRCxDQXlCUSxXQXpCUixFQXlCcUIsVUFBU3RILE9BQVQsRUFBa0I7QUFDckMsU0FBTyxVQUFTa2MsVUFBVCxFQUFxQjtBQUMxQkEsaUJBQWE5VSxXQUFXOFUsVUFBWCxDQUFiO0FBQ0EsV0FBT2xjLFFBQVEsT0FBUixFQUFpQixDQUFDa2MsYUFBVyxFQUFaLElBQWdCLENBQWhCLEdBQWtCLENBQW5DLEVBQXFDLENBQXJDLENBQVA7QUFDRCxHQUhEO0FBSUQsQ0E5QkQsRUErQkM1VSxNQS9CRCxDQStCUSxPQS9CUixFQStCaUIsVUFBU3RILE9BQVQsRUFBa0I7QUFDakMsU0FBTyxVQUFTOGIsR0FBVCxFQUFhSyxRQUFiLEVBQXVCO0FBQzVCLFdBQU9DLE9BQVEzSCxLQUFLQyxLQUFMLENBQVdvSCxNQUFNLEdBQU4sR0FBWUssUUFBdkIsSUFBb0MsSUFBcEMsR0FBMkNBLFFBQW5ELENBQVA7QUFDRCxHQUZEO0FBR0QsQ0FuQ0QsRUFvQ0M3VSxNQXBDRCxDQW9DUSxXQXBDUixFQW9DcUIsVUFBU2pILElBQVQsRUFBZTtBQUNsQyxTQUFPLFVBQVMwUixJQUFULEVBQWVzSyxNQUFmLEVBQXVCO0FBQzVCLFFBQUl0SyxRQUFRc0ssTUFBWixFQUFvQjtBQUNsQnRLLGFBQU9BLEtBQUs5SyxPQUFMLENBQWEsSUFBSXFWLE1BQUosQ0FBVyxNQUFJRCxNQUFKLEdBQVcsR0FBdEIsRUFBMkIsSUFBM0IsQ0FBYixFQUErQyxxQ0FBL0MsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFHLENBQUN0SyxJQUFKLEVBQVM7QUFDZEEsYUFBTyxFQUFQO0FBQ0Q7QUFDRCxXQUFPMVIsS0FBS29TLFdBQUwsQ0FBaUJWLEtBQUt3SyxRQUFMLEVBQWpCLENBQVA7QUFDRCxHQVBEO0FBUUQsQ0E3Q0QsRUE4Q0NqVixNQTlDRCxDQThDUSxXQTlDUixFQThDcUIsVUFBU3RILE9BQVQsRUFBaUI7QUFDcEMsU0FBTyxVQUFTK1IsSUFBVCxFQUFjO0FBQ25CLFdBQVFBLEtBQUt5SyxNQUFMLENBQVksQ0FBWixFQUFlQyxXQUFmLEtBQStCMUssS0FBSzJLLEtBQUwsQ0FBVyxDQUFYLENBQXZDO0FBQ0QsR0FGRDtBQUdELENBbERELEVBbURDcFYsTUFuREQsQ0FtRFEsWUFuRFIsRUFtRHNCLFVBQVN0SCxPQUFULEVBQWlCO0FBQ3JDLFNBQU8sVUFBUzJjLEdBQVQsRUFBYTtBQUNsQixXQUFPLEtBQUtBLE1BQU0sR0FBWCxDQUFQO0FBQ0QsR0FGRDtBQUdELENBdkRELEVBd0RDclYsTUF4REQsQ0F3RFEsbUJBeERSLEVBd0Q2QixVQUFTdEgsT0FBVCxFQUFpQjtBQUM1QyxTQUFPLFVBQVU0YyxFQUFWLEVBQWM7QUFDbkIsUUFBSSxPQUFPQSxFQUFQLEtBQWMsV0FBZCxJQUE2QkMsTUFBTUQsRUFBTixDQUFqQyxFQUE0QyxPQUFPLEVBQVA7QUFDNUMsV0FBTzVjLFFBQVEsUUFBUixFQUFrQjRjLEtBQUssTUFBdkIsRUFBK0IsQ0FBL0IsQ0FBUDtBQUNELEdBSEQ7QUFJRCxDQTdERCxFQThEQ3RWLE1BOURELENBOERRLG1CQTlEUixFQThENkIsVUFBU3RILE9BQVQsRUFBaUI7QUFDNUMsU0FBTyxVQUFVNGMsRUFBVixFQUFjO0FBQ25CLFFBQUksT0FBT0EsRUFBUCxLQUFjLFdBQWQsSUFBNkJDLE1BQU1ELEVBQU4sQ0FBakMsRUFBNEMsT0FBTyxFQUFQO0FBQzVDLFdBQU81YyxRQUFRLFFBQVIsRUFBa0I0YyxLQUFLLE9BQXZCLEVBQWdDLENBQWhDLENBQVA7QUFDRCxHQUhEO0FBSUQsQ0FuRUQsRTs7Ozs7Ozs7OztBQ0FBaGUsUUFBUUMsTUFBUixDQUFlLG1CQUFmLEVBQ0NpZSxPQURELENBQ1MsYUFEVCxFQUN3QixVQUFTMWMsS0FBVCxFQUFnQkQsRUFBaEIsRUFBb0JILE9BQXBCLEVBQTRCOztBQUVsRCxTQUFPOztBQUVMO0FBQ0FZLFdBQU8saUJBQVU7QUFDZixVQUFHQyxPQUFPa2MsWUFBVixFQUF1QjtBQUNyQmxjLGVBQU9rYyxZQUFQLENBQW9CQyxVQUFwQixDQUErQixVQUEvQjtBQUNBbmMsZUFBT2tjLFlBQVAsQ0FBb0JDLFVBQXBCLENBQStCLFNBQS9CO0FBQ0Q7QUFDRixLQVJJOztBQVVMclYsV0FBTyxpQkFBVTtBQUNmLFVBQU0yRyxrQkFBa0I7QUFDdEJ0RyxpQkFBUyxFQUFFaVYsT0FBTyxLQUFULEVBQWdCMUQsYUFBYSxFQUE3QixFQUFpQ3JSLE1BQU0sR0FBdkMsRUFBNENrTSxZQUFZLEtBQXhELEVBRGE7QUFFcEJqTSxlQUFPLEVBQUU2SixNQUFNLElBQVIsRUFBY2tMLFVBQVUsS0FBeEIsRUFBK0JDLE1BQU0sS0FBckMsRUFGYTtBQUdwQmhJLGlCQUFTLEVBQUVPLEtBQUssS0FBUCxFQUFjQyxTQUFTLEtBQXZCLEVBQThCQyxLQUFLLEtBQW5DLEVBSFc7QUFJcEI1TSxnQkFBUSxFQUFFLFFBQVEsRUFBVixFQUFjLFVBQVUsRUFBRS9ILE1BQU0sRUFBUixFQUFZLFNBQVMsRUFBckIsRUFBeEIsRUFBbUQsU0FBUyxFQUE1RCxFQUFnRSxRQUFRLEVBQXhFLEVBQTRFLFVBQVUsRUFBdEYsRUFBMEZnSSxPQUFPLFNBQWpHLEVBQTRHQyxRQUFRLFVBQXBILEVBQWdJLE1BQU0sS0FBdEksRUFBNkksTUFBTSxLQUFuSixFQUEwSixPQUFPLENBQWpLLEVBQW9LLE9BQU8sQ0FBM0ssRUFBOEssWUFBWSxDQUExTCxFQUE2TCxlQUFlLENBQTVNLEVBSlk7QUFLcEJzTix1QkFBZSxFQUFFaEMsSUFBSSxJQUFOLEVBQVlyTyxRQUFRLElBQXBCLEVBQTBCeVIsTUFBTSxJQUFoQyxFQUFzQ0QsS0FBSyxJQUEzQyxFQUFpRGpYLFFBQVEsSUFBekQsRUFBK0RpRyxPQUFPLEVBQXRFLEVBQTBFa1IsTUFBTSxFQUFoRixFQUxLO0FBTXBCRyxnQkFBUSxFQUFFeEQsSUFBSSxJQUFOLEVBQVkyRCxPQUFPLHdCQUFuQixFQUE2Q2xHLE9BQU8sMEJBQXBELEVBTlk7QUFPcEJ2SixrQkFBVSxDQUFDLEVBQUV6RCxJQUFJLFdBQVcwRixLQUFLLFdBQUwsQ0FBakIsRUFBb0NDLE9BQU8sRUFBM0MsRUFBK0NDLE1BQU0sS0FBckQsRUFBNERsTCxLQUFLLGVBQWpFLEVBQWtGaUosUUFBUSxFQUExRixFQUE4RkMsU0FBUyxFQUF2RyxFQUEyR3BELEtBQUssQ0FBaEgsRUFBbUhxRixRQUFRLEtBQTNILEVBQWtJdEUsU0FBUyxFQUEzSSxFQUErSXVCLFFBQVEsRUFBRXBGLE9BQU8sRUFBVCxFQUFhb0ksSUFBSSxFQUFqQixFQUFxQm5JLFNBQVMsRUFBOUIsRUFBdkosRUFBMkw4QixNQUFNLEVBQWpNLEVBQUQsQ0FQVTtBQVFwQitHLGdCQUFRLEVBQUVDLE1BQU0sRUFBUixFQUFZQyxNQUFNLEVBQWxCLEVBQXNCQyxPQUFPLEVBQTdCLEVBQWlDN0QsUUFBUSxFQUF6QyxFQUE2QzhELE9BQU8sRUFBcEQsRUFSWTtBQVNwQmxHLGVBQU8sRUFBRWhHLEtBQUssRUFBUCxFQUFXdUosUUFBUSxLQUFuQixFQUEwQmlFLE1BQU0sRUFBRUMsS0FBSyxFQUFQLEVBQVdoSyxPQUFPLEVBQWxCLEVBQWhDLEVBQXdEMkUsUUFBUSxFQUFoRSxFQVRhO0FBVXBCcUcsa0JBQVUsRUFBRXpPLEtBQUssRUFBUCxFQUFXaVgsTUFBTSxFQUFqQixFQUFxQmxMLE1BQU0sRUFBM0IsRUFBK0JDLE1BQU0sRUFBckMsRUFBeUNpRCxJQUFJLEVBQTdDLEVBQWlESCxLQUFLLEVBQXRELEVBQTBEMUcsUUFBUSxFQUFsRSxFQVZVO0FBV3BCSCxhQUFLLEVBQUVDLE9BQU8sRUFBVCxFQUFhQyxTQUFTLEVBQXRCLEVBQTBCQyxRQUFRLEVBQWxDO0FBWGUsT0FBeEI7QUFhQSxhQUFPdUcsZUFBUDtBQUNELEtBekJJOztBQTJCTGhJLHdCQUFvQiw4QkFBVTtBQUM1QixhQUFPO0FBQ0w4VyxrQkFBVSxJQURMO0FBRUxsVixjQUFNLE1BRkQ7QUFHTHFMLGlCQUFTO0FBQ1A4SixtQkFBUyxJQURGO0FBRVB0TCxnQkFBTSxFQUZDO0FBR1B5QixpQkFBTyxNQUhBO0FBSVA4SixnQkFBTTtBQUpDLFNBSEo7QUFTTEMsb0JBQVksRUFUUDtBQVVMQyxrQkFBVSxFQVZMO0FBV0xDLGdCQUFRLEVBWEg7QUFZTC9FLG9CQUFZLE1BWlA7QUFhTEMsa0JBQVUsTUFiTDtBQWNMK0Usd0JBQWdCLElBZFg7QUFlTEMseUJBQWlCLElBZlo7QUFnQkxDLHNCQUFjO0FBaEJULE9BQVA7QUFrQkQsS0E5Q0k7O0FBZ0RMeFYsb0JBQWdCLDBCQUFVO0FBQ3hCLGFBQU8sQ0FBQztBQUNKbkgsY0FBTSxZQURGO0FBRUhnRSxZQUFJLElBRkQ7QUFHSHBELGNBQU0sT0FISDtBQUlIb0MsZ0JBQVEsS0FKTDtBQUtIaUIsZ0JBQVEsS0FMTDtBQU1IcEIsZ0JBQVEsRUFBQ2tCLEtBQUksSUFBTCxFQUFVYixTQUFRLEtBQWxCLEVBQXdCZ0IsTUFBSyxLQUE3QixFQUFtQ2pCLEtBQUksS0FBdkMsRUFBNkNrQixXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBTkw7QUFPSHJCLGNBQU0sRUFBQ2dCLEtBQUksSUFBTCxFQUFVYixTQUFRLEtBQWxCLEVBQXdCZ0IsTUFBSyxLQUE3QixFQUFtQ2pCLEtBQUksS0FBdkMsRUFBNkNrQixXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBUEg7QUFRSEMsY0FBTSxFQUFDTixLQUFJLElBQUwsRUFBVU8sS0FBSSxFQUFkLEVBQWlCQyxPQUFNLEVBQXZCLEVBQTBCM0QsTUFBSyxZQUEvQixFQUE0QzRELEtBQUksS0FBaEQsRUFBc0RDLEtBQUksS0FBMUQsRUFBZ0VDLE9BQU0sS0FBdEUsRUFBNEUzRSxTQUFRLENBQXBGLEVBQXNGNEUsVUFBUyxDQUEvRixFQUFpR0MsVUFBUyxDQUExRyxFQUE0R0MsUUFBTyxDQUFuSCxFQUFxSHBGLFFBQU8sR0FBNUgsRUFBZ0lxRixNQUFLLENBQXJJLEVBQXVJQyxLQUFJLENBQTNJLEVBQTZJQyxPQUFNLENBQW5KLEVBUkg7QUFTSEMsZ0JBQVEsRUFUTDtBQVVIQyxnQkFBUSxFQVZMO0FBV0hDLGNBQU14SCxRQUFReUgsSUFBUixDQUFhLEtBQUtDLGtCQUFMLEVBQWIsRUFBdUMsRUFBQ2xELE9BQU0sQ0FBUCxFQUFTTixLQUFJLENBQWIsRUFBZXlELEtBQUksR0FBbkIsRUFBdkMsQ0FYSDtBQVlIakMsaUJBQVMsRUFBQ1csSUFBSSxXQUFTMEYsS0FBSyxXQUFMLENBQWQsRUFBZ0NoTCxLQUFJLGVBQXBDLEVBQW9EaUosUUFBTyxFQUEzRCxFQUE4REMsU0FBUSxFQUF0RSxFQUF5RXBELEtBQUksQ0FBN0UsRUFBK0VxRixRQUFPLEtBQXRGLEVBWk47QUFhSGxJLGlCQUFTLEVBQUNmLE1BQUssT0FBTixFQUFjZSxTQUFRLEVBQXRCLEVBQXlCNEQsU0FBUSxFQUFqQyxFQUFvQ0MsT0FBTSxDQUExQyxFQUE0QzNGLFVBQVMsRUFBckQsRUFiTjtBQWNINEYsZ0JBQVEsRUFBQ0MsT0FBTyxLQUFSO0FBZEwsT0FBRCxFQWVIO0FBQ0ExRixjQUFNLE1BRE47QUFFQ2dFLFlBQUksSUFGTDtBQUdDcEQsY0FBTSxPQUhQO0FBSUNvQyxnQkFBUSxLQUpUO0FBS0NpQixnQkFBUSxLQUxUO0FBTUNwQixnQkFBUSxFQUFDa0IsS0FBSSxJQUFMLEVBQVViLFNBQVEsS0FBbEIsRUFBd0JnQixNQUFLLEtBQTdCLEVBQW1DakIsS0FBSSxLQUF2QyxFQUE2Q2tCLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFOVDtBQU9DckIsY0FBTSxFQUFDZ0IsS0FBSSxJQUFMLEVBQVViLFNBQVEsS0FBbEIsRUFBd0JnQixNQUFLLEtBQTdCLEVBQW1DakIsS0FBSSxLQUF2QyxFQUE2Q2tCLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFQUDtBQVFDQyxjQUFNLEVBQUNOLEtBQUksSUFBTCxFQUFVTyxLQUFJLEVBQWQsRUFBaUJDLE9BQU0sRUFBdkIsRUFBMEIzRCxNQUFLLFlBQS9CLEVBQTRDNEQsS0FBSSxLQUFoRCxFQUFzREMsS0FBSSxLQUExRCxFQUFnRUMsT0FBTSxLQUF0RSxFQUE0RTNFLFNBQVEsQ0FBcEYsRUFBc0Y0RSxVQUFTLENBQS9GLEVBQWlHQyxVQUFTLENBQTFHLEVBQTRHQyxRQUFPLENBQW5ILEVBQXFIcEYsUUFBTyxHQUE1SCxFQUFnSXFGLE1BQUssQ0FBckksRUFBdUlDLEtBQUksQ0FBM0ksRUFBNklDLE9BQU0sQ0FBbkosRUFSUDtBQVNDQyxnQkFBUSxFQVRUO0FBVUNDLGdCQUFRLEVBVlQ7QUFXQ0MsY0FBTXhILFFBQVF5SCxJQUFSLENBQWEsS0FBS0Msa0JBQUwsRUFBYixFQUF1QyxFQUFDbEQsT0FBTSxDQUFQLEVBQVNOLEtBQUksQ0FBYixFQUFleUQsS0FBSSxHQUFuQixFQUF2QyxDQVhQO0FBWUNqQyxpQkFBUyxFQUFDVyxJQUFJLFdBQVMwRixLQUFLLFdBQUwsQ0FBZCxFQUFnQ2hMLEtBQUksZUFBcEMsRUFBb0RpSixRQUFPLEVBQTNELEVBQThEQyxTQUFRLEVBQXRFLEVBQXlFcEQsS0FBSSxDQUE3RSxFQUErRXFGLFFBQU8sS0FBdEYsRUFaVjtBQWFDbEksaUJBQVMsRUFBQ2YsTUFBSyxPQUFOLEVBQWNlLFNBQVEsRUFBdEIsRUFBeUI0RCxTQUFRLEVBQWpDLEVBQW9DQyxPQUFNLENBQTFDLEVBQTRDM0YsVUFBUyxFQUFyRCxFQWJWO0FBY0M0RixnQkFBUSxFQUFDQyxPQUFPLEtBQVI7QUFkVCxPQWZHLEVBOEJIO0FBQ0ExRixjQUFNLE1BRE47QUFFQ2dFLFlBQUksSUFGTDtBQUdDcEQsY0FBTSxLQUhQO0FBSUNvQyxnQkFBUSxLQUpUO0FBS0NpQixnQkFBUSxLQUxUO0FBTUNwQixnQkFBUSxFQUFDa0IsS0FBSSxJQUFMLEVBQVViLFNBQVEsS0FBbEIsRUFBd0JnQixNQUFLLEtBQTdCLEVBQW1DakIsS0FBSSxLQUF2QyxFQUE2Q2tCLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFOVDtBQU9DckIsY0FBTSxFQUFDZ0IsS0FBSSxJQUFMLEVBQVViLFNBQVEsS0FBbEIsRUFBd0JnQixNQUFLLEtBQTdCLEVBQW1DakIsS0FBSSxLQUF2QyxFQUE2Q2tCLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFQUDtBQVFDQyxjQUFNLEVBQUNOLEtBQUksSUFBTCxFQUFVTyxLQUFJLEVBQWQsRUFBaUJDLE9BQU0sRUFBdkIsRUFBMEIzRCxNQUFLLFlBQS9CLEVBQTRDNEQsS0FBSSxLQUFoRCxFQUFzREMsS0FBSSxLQUExRCxFQUFnRUMsT0FBTSxLQUF0RSxFQUE0RTNFLFNBQVEsQ0FBcEYsRUFBc0Y0RSxVQUFTLENBQS9GLEVBQWlHQyxVQUFTLENBQTFHLEVBQTRHQyxRQUFPLENBQW5ILEVBQXFIcEYsUUFBTyxHQUE1SCxFQUFnSXFGLE1BQUssQ0FBckksRUFBdUlDLEtBQUksQ0FBM0ksRUFBNklDLE9BQU0sQ0FBbkosRUFSUDtBQVNDQyxnQkFBUSxFQVRUO0FBVUNDLGdCQUFRLEVBVlQ7QUFXQ0MsY0FBTXhILFFBQVF5SCxJQUFSLENBQWEsS0FBS0Msa0JBQUwsRUFBYixFQUF1QyxFQUFDbEQsT0FBTSxDQUFQLEVBQVNOLEtBQUksQ0FBYixFQUFleUQsS0FBSSxHQUFuQixFQUF2QyxDQVhQO0FBWUNqQyxpQkFBUyxFQUFDVyxJQUFJLFdBQVMwRixLQUFLLFdBQUwsQ0FBZCxFQUFnQ2hMLEtBQUksZUFBcEMsRUFBb0RpSixRQUFPLEVBQTNELEVBQThEQyxTQUFRLEVBQXRFLEVBQXlFcEQsS0FBSSxDQUE3RSxFQUErRXFGLFFBQU8sS0FBdEYsRUFaVjtBQWFDbEksaUJBQVMsRUFBQ2YsTUFBSyxPQUFOLEVBQWNlLFNBQVEsRUFBdEIsRUFBeUI0RCxTQUFRLEVBQWpDLEVBQW9DQyxPQUFNLENBQTFDLEVBQTRDM0YsVUFBUyxFQUFyRCxFQWJWO0FBY0M0RixnQkFBUSxFQUFDQyxPQUFPLEtBQVI7QUFkVCxPQTlCRyxDQUFQO0FBOENELEtBL0ZJOztBQWlHTGUsY0FBVSxrQkFBUzBGLEdBQVQsRUFBYWxILE1BQWIsRUFBb0I7QUFDNUIsVUFBRyxDQUFDckYsT0FBT2tjLFlBQVgsRUFDRSxPQUFPN1csTUFBUDtBQUNGLFVBQUk7QUFDRixZQUFHQSxNQUFILEVBQVU7QUFDUixpQkFBT3JGLE9BQU9rYyxZQUFQLENBQW9CYyxPQUFwQixDQUE0QnpRLEdBQTVCLEVBQWdDYixLQUFLaUcsU0FBTCxDQUFldE0sTUFBZixDQUFoQyxDQUFQO0FBQ0QsU0FGRCxNQUdLLElBQUdyRixPQUFPa2MsWUFBUCxDQUFvQmUsT0FBcEIsQ0FBNEIxUSxHQUE1QixDQUFILEVBQW9DO0FBQ3ZDLGlCQUFPYixLQUFLQyxLQUFMLENBQVczTCxPQUFPa2MsWUFBUCxDQUFvQmUsT0FBcEIsQ0FBNEIxUSxHQUE1QixDQUFYLENBQVA7QUFDRCxTQUZJLE1BRUUsSUFBR0EsT0FBTyxVQUFWLEVBQXFCO0FBQzFCLGlCQUFPLEtBQUt6RixLQUFMLEVBQVA7QUFDRDtBQUNGLE9BVEQsQ0FTRSxPQUFNbkgsQ0FBTixFQUFRO0FBQ1I7QUFDRDtBQUNELGFBQU8wRixNQUFQO0FBQ0QsS0FqSEk7O0FBbUhMZ0ksaUJBQWEscUJBQVNqTixJQUFULEVBQWM7QUFDekIsVUFBSWtVLFVBQVUsQ0FDWixFQUFDbFUsTUFBTSxZQUFQLEVBQXFCMkgsUUFBUSxJQUE3QixFQUFtQ0MsU0FBUyxLQUE1QyxFQUFtRGpILEtBQUssSUFBeEQsRUFEWSxFQUVYLEVBQUNYLE1BQU0sU0FBUCxFQUFrQjJILFFBQVEsS0FBMUIsRUFBaUNDLFNBQVMsSUFBMUMsRUFBZ0RqSCxLQUFLLElBQXJELEVBRlcsRUFHWCxFQUFDWCxNQUFNLE9BQVAsRUFBZ0IySCxRQUFRLElBQXhCLEVBQThCQyxTQUFTLElBQXZDLEVBQTZDakgsS0FBSyxJQUFsRCxFQUhXLEVBSVgsRUFBQ1gsTUFBTSxPQUFQLEVBQWdCMkgsUUFBUSxLQUF4QixFQUErQkMsU0FBUyxJQUF4QyxFQUE4Q2pILEtBQUssSUFBbkQsRUFKVyxFQUtYLEVBQUNYLE1BQU0sT0FBUCxFQUFnQjJILFFBQVEsS0FBeEIsRUFBK0JDLFNBQVMsSUFBeEMsRUFBOENqSCxLQUFLLEtBQW5ELEVBTFcsRUFNWCxFQUFDWCxNQUFNLE9BQVAsRUFBZ0IySCxRQUFRLEtBQXhCLEVBQStCQyxTQUFTLElBQXhDLEVBQThDakgsS0FBSyxLQUFuRCxFQU5XLEVBT1gsRUFBQ1gsTUFBTSxPQUFQLEVBQWdCMkgsUUFBUSxLQUF4QixFQUErQkMsU0FBUyxJQUF4QyxFQUE4Q2pILEtBQUssSUFBbkQsRUFQVyxFQVFYLEVBQUNYLE1BQU0sT0FBUCxFQUFnQjJILFFBQVEsS0FBeEIsRUFBK0JDLFNBQVMsSUFBeEMsRUFBOENqSCxLQUFLLEtBQW5ELEVBUlcsRUFTWCxFQUFDWCxNQUFNLE9BQVAsRUFBZ0IySCxRQUFRLEtBQXhCLEVBQStCQyxTQUFTLElBQXhDLEVBQThDakgsS0FBSyxLQUFuRCxFQVRXLEVBVVgsRUFBQ1gsTUFBTSxjQUFQLEVBQXVCMkgsUUFBUSxJQUEvQixFQUFxQ0MsU0FBUyxLQUE5QyxFQUFxRHRELEtBQUssSUFBMUQsRUFBZ0U0SSxTQUFTLElBQXpFLEVBQStFdk0sS0FBSyxJQUFwRixFQVZXLEVBV1gsRUFBQ1gsTUFBTSxRQUFQLEVBQWlCMkgsUUFBUSxJQUF6QixFQUErQkMsU0FBUyxLQUF4QyxFQUErQ2pILEtBQUssSUFBcEQsRUFYVyxFQVlYLEVBQUNYLE1BQU0sUUFBUCxFQUFpQjJILFFBQVEsSUFBekIsRUFBK0JDLFNBQVMsS0FBeEMsRUFBK0NqSCxLQUFLLElBQXBELEVBWlcsRUFhWCxFQUFDWCxNQUFNLE9BQVAsRUFBZ0IySCxRQUFRLElBQXhCLEVBQThCQyxTQUFTLEtBQXZDLEVBQThDakgsS0FBSyxJQUFuRCxFQWJXLEVBY1gsRUFBQ1gsTUFBTSxRQUFQLEVBQWlCMkgsUUFBUSxJQUF6QixFQUErQkMsU0FBUyxLQUF4QyxFQUErQ2pILEtBQUssSUFBcEQsRUFkVyxDQUFkO0FBZ0JBLFVBQUdYLElBQUgsRUFDRSxPQUFPNEQsRUFBRXlDLE1BQUYsQ0FBUzZOLE9BQVQsRUFBa0IsRUFBQyxRQUFRbFUsSUFBVCxFQUFsQixFQUFrQyxDQUFsQyxDQUFQO0FBQ0YsYUFBT2tVLE9BQVA7QUFDRCxLQXZJSTs7QUF5SUwxUyxpQkFBYSxxQkFBU1osSUFBVCxFQUFjO0FBQ3pCLFVBQUlnQyxVQUFVLENBQ1osRUFBQyxRQUFPLE1BQVIsRUFBZSxRQUFPLEtBQXRCLEVBQTRCLFVBQVMsR0FBckMsRUFBeUMsUUFBTyxDQUFoRCxFQURZLEVBRVgsRUFBQyxRQUFPLE1BQVIsRUFBZSxRQUFPLE9BQXRCLEVBQThCLFVBQVMsR0FBdkMsRUFBMkMsUUFBTyxDQUFsRCxFQUZXLEVBR1gsRUFBQyxRQUFPLFlBQVIsRUFBcUIsUUFBTyxPQUE1QixFQUFvQyxVQUFTLEdBQTdDLEVBQWlELFFBQU8sQ0FBeEQsRUFIVyxFQUlYLEVBQUMsUUFBTyxXQUFSLEVBQW9CLFFBQU8sV0FBM0IsRUFBdUMsVUFBUyxFQUFoRCxFQUFtRCxRQUFPLENBQTFELEVBSlcsRUFLWCxFQUFDLFFBQU8sTUFBUixFQUFlLFFBQU8sS0FBdEIsRUFBNEIsVUFBUyxFQUFyQyxFQUF3QyxRQUFPLENBQS9DLEVBTFcsRUFNWCxFQUFDLFFBQU8sTUFBUixFQUFlLFFBQU8sVUFBdEIsRUFBaUMsVUFBUyxFQUExQyxFQUE2QyxRQUFPLENBQXBELEVBTlcsRUFPWCxFQUFDLFFBQU8sT0FBUixFQUFnQixRQUFPLFVBQXZCLEVBQWtDLFVBQVMsRUFBM0MsRUFBOEMsUUFBTyxDQUFyRCxFQVBXLENBQWQ7QUFTQSxVQUFHaEMsSUFBSCxFQUNFLE9BQU9nRCxFQUFFeUMsTUFBRixDQUFTekQsT0FBVCxFQUFrQixFQUFDLFFBQVFoQyxJQUFULEVBQWxCLEVBQWtDLENBQWxDLENBQVA7QUFDRixhQUFPZ0MsT0FBUDtBQUNELEtBdEpJOztBQXdKTDhPLFlBQVEsZ0JBQVNyTyxPQUFULEVBQWlCO0FBQ3ZCLFVBQUlxTyxTQUFTLHNCQUFiOztBQUVBLFVBQUdyTyxXQUFXQSxRQUFRM0UsR0FBdEIsRUFBMEI7QUFDeEJnVCxpQkFBVXJPLFFBQVEzRSxHQUFSLENBQVl1SCxPQUFaLENBQW9CLElBQXBCLE1BQThCLENBQUMsQ0FBaEMsR0FDUDVDLFFBQVEzRSxHQUFSLENBQVlrTyxNQUFaLENBQW1CdkosUUFBUTNFLEdBQVIsQ0FBWXVILE9BQVosQ0FBb0IsSUFBcEIsSUFBMEIsQ0FBN0MsQ0FETyxHQUVQNUMsUUFBUTNFLEdBRlY7O0FBSUEsWUFBRzRCLFFBQVErQyxRQUFRd0csTUFBaEIsQ0FBSCxFQUNFNkgsc0JBQW9CQSxNQUFwQixDQURGLEtBR0VBLHFCQUFtQkEsTUFBbkI7QUFDSDs7QUFFRCxhQUFPQSxNQUFQO0FBQ0QsS0F2S0k7O0FBeUtMaEssV0FBTyxlQUFVckUsT0FBVixFQUFtQnlaLGNBQW5CLEVBQW1DO0FBQ3hDLFVBQUksQ0FBQ3paLFFBQVFzRyxLQUFiLEVBQ0UsT0FBTyxLQUFQO0FBQ0YsVUFBR21ULGNBQUgsRUFBa0I7QUFDaEIsWUFBR3paLFFBQVFzRyxLQUFSLENBQWNvTCxXQUFkLEdBQTRCOU8sT0FBNUIsQ0FBb0MsSUFBcEMsTUFBOEMsQ0FBQyxDQUEvQyxJQUFvRDVDLFFBQVFzRyxLQUFSLENBQWNvTCxXQUFkLEdBQTRCOU8sT0FBNUIsQ0FBb0MsV0FBcEMsTUFBcUQsQ0FBQyxDQUE3RyxFQUNFLE9BQU8sSUFBUCxDQURGLEtBRUssSUFBRzVDLFFBQVFzRyxLQUFSLENBQWNvTCxXQUFkLEdBQTRCOU8sT0FBNUIsQ0FBb0MsTUFBcEMsTUFBZ0QsQ0FBQyxDQUFwRCxFQUNILE9BQU8sTUFBUCxDQURHLEtBR0gsT0FBTyxLQUFQO0FBQ0g7QUFDRCxhQUFPM0YsUUFBUStDLFdBQVdBLFFBQVFzRyxLQUFuQixLQUNYdEcsUUFBUXNHLEtBQVIsQ0FBY29MLFdBQWQsR0FBNEI5TyxPQUE1QixDQUFvQyxLQUFwQyxNQUErQyxDQUFDLENBQWhELElBQ0E1QyxRQUFRc0csS0FBUixDQUFjb0wsV0FBZCxHQUE0QjlPLE9BQTVCLENBQW9DLFNBQXBDLE1BQW1ELENBQUMsQ0FEcEQsSUFFQTVDLFFBQVFzRyxLQUFSLENBQWNvTCxXQUFkLEdBQTRCOU8sT0FBNUIsQ0FBb0MsU0FBcEMsTUFBbUQsQ0FBQyxDQUZwRCxJQUdBNUMsUUFBUXNHLEtBQVIsQ0FBY29MLFdBQWQsR0FBNEI5TyxPQUE1QixDQUFvQyxXQUFwQyxNQUFxRCxDQUFDLENBSjNDLENBQVIsQ0FBUDtBQU1ELEtBMUxJOztBQTRMTFAsV0FBTyxlQUFTcVgsV0FBVCxFQUFzQjlSLEdBQXRCLEVBQTJCc0gsS0FBM0IsRUFBa0NrRSxJQUFsQyxFQUF3Q2hVLE1BQXhDLEVBQStDO0FBQ3BELFVBQUl1YSxJQUFJOWQsR0FBRytkLEtBQUgsRUFBUjs7QUFFQSxVQUFJQyxVQUFVLEVBQUMsZUFBZSxDQUFDLEVBQUMsWUFBWWpTLEdBQWI7QUFDekIsbUJBQVN4SSxPQUFPekMsSUFEUztBQUV6Qix3QkFBYyxZQUFVTyxTQUFTVixRQUFULENBQWtCYSxJQUZqQjtBQUd6QixvQkFBVSxDQUFDLEVBQUMsU0FBU3VLLEdBQVYsRUFBRCxDQUhlO0FBSXpCLG1CQUFTc0gsS0FKZ0I7QUFLekIsdUJBQWEsQ0FBQyxNQUFELEVBQVMsVUFBVCxFQUFxQixRQUFyQixDQUxZO0FBTXpCLHVCQUFha0U7QUFOWSxTQUFEO0FBQWhCLE9BQWQ7O0FBVUF0WCxZQUFNLEVBQUNULEtBQUtxZSxXQUFOLEVBQW1COVUsUUFBTyxNQUExQixFQUFrQ2lHLE1BQU0sYUFBVzVDLEtBQUtpRyxTQUFMLENBQWUyTCxPQUFmLENBQW5ELEVBQTRFN2UsU0FBUyxFQUFFLGdCQUFnQixtQ0FBbEIsRUFBckYsRUFBTixFQUNHOEwsSUFESCxDQUNRLG9CQUFZO0FBQ2hCNlMsVUFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQW5CO0FBQ0QsT0FISCxFQUlHN0QsS0FKSCxDQUlTLGVBQU87QUFDWjJTLFVBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxPQU5IO0FBT0EsYUFBTzBTLEVBQUVLLE9BQVQ7QUFDRCxLQWpOSTs7QUFtTkxuVCxhQUFTLGlCQUFTN0csT0FBVCxFQUFrQmlhLFFBQWxCLEVBQTJCO0FBQ2xDLFVBQUlOLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0EsVUFBSXZlLE1BQU0sS0FBS2dULE1BQUwsQ0FBWXJPLE9BQVosSUFBdUIsV0FBdkIsR0FBcUNpYSxRQUEvQztBQUNBO0FBQ0EsVUFBSUEsWUFBWSxVQUFoQixFQUNFNWUsTUFBTSxLQUFLZ1QsTUFBTCxDQUFZck8sT0FBWixJQUF1QixPQUE3QjtBQUNGLFVBQUlvRCxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJOFcsVUFBVSxFQUFDN2UsS0FBS0EsR0FBTixFQUFXdUosUUFBUSxLQUFuQixFQUEwQjlILFNBQVMsS0FBbkMsRUFBZDtBQUNBaEIsWUFBTW9lLE9BQU4sRUFDR3BULElBREgsQ0FDUSxvQkFBWTtBQUNoQixZQUFHVyxTQUFTek0sT0FBVCxDQUFpQixrQkFBakIsQ0FBSCxFQUNFeU0sU0FBU29ELElBQVQsQ0FBY3lELGNBQWQsR0FBK0I3RyxTQUFTek0sT0FBVCxDQUFpQixrQkFBakIsQ0FBL0I7QUFDRjJlLFVBQUVHLE9BQUYsQ0FBVXJTLFNBQVNvRCxJQUFuQjtBQUNELE9BTEgsRUFNRzdELEtBTkgsQ0FNUyxlQUFPO0FBQ1oyUyxVQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsT0FSSDtBQVNBLGFBQU8wUyxFQUFFSyxPQUFUO0FBQ0QsS0FyT0k7QUFzT0w7QUFDQTtBQUNBO0FBQ0E7QUFDQWhaLFVBQU0sY0FBUzVCLE1BQVQsRUFBZ0I7QUFDcEIsVUFBRyxDQUFDQSxPQUFPWSxPQUFYLEVBQW9CLE9BQU9uRSxHQUFHa2UsTUFBSCxDQUFVLDJCQUFWLENBQVA7QUFDcEIsVUFBSUosSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQSxVQUFJdmUsTUFBTSxLQUFLZ1QsTUFBTCxDQUFZalAsT0FBT1ksT0FBbkIsSUFBNEIsV0FBNUIsR0FBd0NaLE9BQU80QixJQUFQLENBQVl6RCxJQUE5RDtBQUNBLFVBQUcsS0FBSzhHLEtBQUwsQ0FBV2pGLE9BQU9ZLE9BQWxCLENBQUgsRUFBOEI7QUFDNUIsWUFBR1osT0FBTzRCLElBQVAsQ0FBWU4sR0FBWixDQUFnQmtDLE9BQWhCLENBQXdCLEdBQXhCLE1BQWlDLENBQWpDLElBQXNDeEQsT0FBTzRCLElBQVAsQ0FBWU4sR0FBWixDQUFnQmtDLE9BQWhCLENBQXdCLEdBQXhCLE1BQWlDLENBQTFFLEVBQ0V2SCxPQUFPLFdBQVMrRCxPQUFPNEIsSUFBUCxDQUFZTixHQUE1QixDQURGLEtBR0VyRixPQUFPLFdBQVMrRCxPQUFPNEIsSUFBUCxDQUFZTixHQUE1QjtBQUNGLFlBQUd6RCxRQUFRbUMsT0FBTzRCLElBQVAsQ0FBWUMsR0FBcEIsS0FBNEIsQ0FBQyxJQUFELEVBQU0sSUFBTixFQUFZMkIsT0FBWixDQUFvQnhELE9BQU80QixJQUFQLENBQVlDLEdBQWhDLE1BQXlDLENBQUMsQ0FBekUsRUFBNEU7QUFDMUU1RixpQkFBTyxXQUFTK0QsT0FBTzRCLElBQVAsQ0FBWUMsR0FBNUIsQ0FERixLQUVLLElBQUc3QixPQUFPNEIsSUFBUCxDQUFZRSxLQUFaLElBQXFCLENBQUNxWCxNQUFNblosT0FBTzRCLElBQVAsQ0FBWUUsS0FBbEIsQ0FBekIsRUFBbUQ7QUFDdEQ3RixpQkFBTyxZQUFVK0QsT0FBTzRCLElBQVAsQ0FBWUUsS0FBN0I7QUFDSCxPQVRELE1BU087QUFDTCxZQUFHakUsUUFBUW1DLE9BQU80QixJQUFQLENBQVlDLEdBQXBCLEtBQTRCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBWTJCLE9BQVosQ0FBb0J4RCxPQUFPNEIsSUFBUCxDQUFZQyxHQUFoQyxNQUF5QyxDQUFDLENBQXpFLEVBQTRFO0FBQzFFNUYsaUJBQU8rRCxPQUFPNEIsSUFBUCxDQUFZQyxHQUFuQixDQURGLEtBRUssSUFBRzdCLE9BQU80QixJQUFQLENBQVlFLEtBQVosSUFBcUIsQ0FBQ3FYLE1BQU1uWixPQUFPNEIsSUFBUCxDQUFZRSxLQUFsQixDQUF6QixFQUFtRDtBQUN0RDdGLGlCQUFPLFlBQVUrRCxPQUFPNEIsSUFBUCxDQUFZRSxLQUE3QjtBQUNGN0YsZUFBTyxNQUFJK0QsT0FBTzRCLElBQVAsQ0FBWU4sR0FBdkI7QUFDRDtBQUNELFVBQUkwQyxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJOFcsVUFBVSxFQUFDN2UsS0FBS0EsR0FBTixFQUFXdUosUUFBUSxLQUFuQixFQUEwQjlILFNBQVNzRyxTQUFTTSxPQUFULENBQWlCdVIsV0FBakIsR0FBNkIsS0FBaEUsRUFBZDs7QUFFQSxVQUFHN1YsT0FBT1ksT0FBUCxDQUFlbWEsUUFBbEIsRUFBMkI7QUFDekJELGdCQUFRRSxlQUFSLEdBQTBCLElBQTFCO0FBQ0FGLGdCQUFRbGYsT0FBUixHQUFrQixFQUFDLGlCQUFpQixXQUFTcUwsS0FBSyxVQUFRakgsT0FBT1ksT0FBUCxDQUFlbWEsUUFBZixDQUF3Qi9ILElBQXhCLEVBQWIsQ0FBM0IsRUFBbEI7QUFDRDs7QUFFRHRXLFlBQU1vZSxPQUFOLEVBQ0dwVCxJQURILENBQ1Esb0JBQVk7QUFDaEJXLGlCQUFTb0QsSUFBVCxDQUFjeUQsY0FBZCxHQUErQjdHLFNBQVN6TSxPQUFULENBQWlCLGtCQUFqQixDQUEvQjtBQUNBMmUsVUFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQW5CO0FBQ0QsT0FKSCxFQUtHN0QsS0FMSCxDQUtTLGVBQU87QUFDWjJTLFVBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxPQVBIO0FBUUEsYUFBTzBTLEVBQUVLLE9BQVQ7QUFDRCxLQS9RSTtBQWdSTDtBQUNBO0FBQ0E7QUFDQXpWLGFBQVMsaUJBQVNuRixNQUFULEVBQWdCaWIsTUFBaEIsRUFBdUJ2YixLQUF2QixFQUE2QjtBQUNwQyxVQUFHLENBQUNNLE9BQU9ZLE9BQVgsRUFBb0IsT0FBT25FLEdBQUdrZSxNQUFILENBQVUsMkJBQVYsQ0FBUDtBQUNwQixVQUFJSixJQUFJOWQsR0FBRytkLEtBQUgsRUFBUjtBQUNBLFVBQUl2ZSxNQUFNLEtBQUtnVCxNQUFMLENBQVlqUCxPQUFPWSxPQUFuQixJQUE0QixrQkFBdEM7QUFDQSxVQUFHLEtBQUtxRSxLQUFMLENBQVdqRixPQUFPWSxPQUFsQixDQUFILEVBQThCO0FBQzVCM0UsZUFBTyxXQUFTZ2YsTUFBVCxHQUFnQixTQUFoQixHQUEwQnZiLEtBQWpDO0FBQ0QsT0FGRCxNQUVPO0FBQ0x6RCxlQUFPLE1BQUlnZixNQUFKLEdBQVcsR0FBWCxHQUFldmIsS0FBdEI7QUFDRDtBQUNELFVBQUlzRSxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJOFcsVUFBVSxFQUFDN2UsS0FBS0EsR0FBTixFQUFXdUosUUFBUSxLQUFuQixFQUEwQjlILFNBQVNzRyxTQUFTTSxPQUFULENBQWlCdVIsV0FBakIsR0FBNkIsS0FBaEUsRUFBZDtBQUNBaUYsY0FBUWxmLE9BQVIsR0FBa0IsRUFBRSxnQkFBZ0Isa0JBQWxCLEVBQWxCO0FBQ0EsVUFBR29FLE9BQU9ZLE9BQVAsQ0FBZW1hLFFBQWxCLEVBQTJCO0FBQ3pCRCxnQkFBUUUsZUFBUixHQUEwQixJQUExQjtBQUNBRixnQkFBUWxmLE9BQVIsQ0FBZ0JzZixhQUFoQixHQUFnQyxXQUFTalUsS0FBSyxVQUFRakgsT0FBT1ksT0FBUCxDQUFlbWEsUUFBZixDQUF3Qi9ILElBQXhCLEVBQWIsQ0FBekM7QUFDRDs7QUFFRHRXLFlBQU1vZSxPQUFOLEVBQ0dwVCxJQURILENBQ1Esb0JBQVk7QUFDaEJXLGlCQUFTb0QsSUFBVCxDQUFjeUQsY0FBZCxHQUErQjdHLFNBQVN6TSxPQUFULENBQWlCLGtCQUFqQixDQUEvQjtBQUNBMmUsVUFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQW5CO0FBQ0QsT0FKSCxFQUtHN0QsS0FMSCxDQUtTLGVBQU87QUFDWjJTLFVBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxPQVBIO0FBUUEsYUFBTzBTLEVBQUVLLE9BQVQ7QUFDRCxLQTdTSTs7QUErU0wxVixZQUFRLGdCQUFTbEYsTUFBVCxFQUFnQmliLE1BQWhCLEVBQXVCdmIsS0FBdkIsRUFBNkI7QUFDbkMsVUFBRyxDQUFDTSxPQUFPWSxPQUFYLEVBQW9CLE9BQU9uRSxHQUFHa2UsTUFBSCxDQUFVLDJCQUFWLENBQVA7QUFDcEIsVUFBSUosSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQSxVQUFJdmUsTUFBTSxLQUFLZ1QsTUFBTCxDQUFZalAsT0FBT1ksT0FBbkIsSUFBNEIsaUJBQXRDO0FBQ0EsVUFBRyxLQUFLcUUsS0FBTCxDQUFXakYsT0FBT1ksT0FBbEIsQ0FBSCxFQUE4QjtBQUM1QjNFLGVBQU8sV0FBU2dmLE1BQVQsR0FBZ0IsU0FBaEIsR0FBMEJ2YixLQUFqQztBQUNELE9BRkQsTUFFTztBQUNMekQsZUFBTyxNQUFJZ2YsTUFBSixHQUFXLEdBQVgsR0FBZXZiLEtBQXRCO0FBQ0Q7QUFDRCxVQUFJc0UsV0FBVyxLQUFLQSxRQUFMLENBQWMsVUFBZCxDQUFmO0FBQ0EsVUFBSThXLFVBQVUsRUFBQzdlLEtBQUtBLEdBQU4sRUFBV3VKLFFBQVEsS0FBbkIsRUFBMEI5SCxTQUFTc0csU0FBU00sT0FBVCxDQUFpQnVSLFdBQWpCLEdBQTZCLEtBQWhFLEVBQWQ7O0FBRUEsVUFBRzdWLE9BQU9ZLE9BQVAsQ0FBZW1hLFFBQWxCLEVBQTJCO0FBQ3pCRCxnQkFBUUUsZUFBUixHQUEwQixJQUExQjtBQUNBRixnQkFBUWxmLE9BQVIsR0FBa0IsRUFBQyxpQkFBaUIsV0FBU3FMLEtBQUssVUFBUWpILE9BQU9ZLE9BQVAsQ0FBZW1hLFFBQWYsQ0FBd0IvSCxJQUF4QixFQUFiLENBQTNCLEVBQWxCO0FBQ0Q7O0FBRUR0VyxZQUFNb2UsT0FBTixFQUNHcFQsSUFESCxDQUNRLG9CQUFZO0FBQ2hCVyxpQkFBU29ELElBQVQsQ0FBY3lELGNBQWQsR0FBK0I3RyxTQUFTek0sT0FBVCxDQUFpQixrQkFBakIsQ0FBL0I7QUFDQTJlLFVBQUVHLE9BQUYsQ0FBVXJTLFNBQVNvRCxJQUFuQjtBQUNELE9BSkgsRUFLRzdELEtBTEgsQ0FLUyxlQUFPO0FBQ1oyUyxVQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsT0FQSDtBQVFBLGFBQU8wUyxFQUFFSyxPQUFUO0FBQ0QsS0F6VUk7O0FBMlVMTyxpQkFBYSxxQkFBU25iLE1BQVQsRUFBZ0JpYixNQUFoQixFQUF1QnZkLE9BQXZCLEVBQStCO0FBQzFDLFVBQUcsQ0FBQ3NDLE9BQU9ZLE9BQVgsRUFBb0IsT0FBT25FLEdBQUdrZSxNQUFILENBQVUsMkJBQVYsQ0FBUDtBQUNwQixVQUFJSixJQUFJOWQsR0FBRytkLEtBQUgsRUFBUjtBQUNBLFVBQUl2ZSxNQUFNLEtBQUtnVCxNQUFMLENBQVlqUCxPQUFPWSxPQUFuQixJQUE0QixrQkFBdEM7QUFDQSxVQUFHLEtBQUtxRSxLQUFMLENBQVdqRixPQUFPWSxPQUFsQixDQUFILEVBQThCO0FBQzVCM0UsZUFBTyxXQUFTZ2YsTUFBaEI7QUFDRCxPQUZELE1BRU87QUFDTGhmLGVBQU8sTUFBSWdmLE1BQVg7QUFDRDtBQUNELFVBQUlqWCxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJOFcsVUFBVSxFQUFDN2UsS0FBS0EsR0FBTixFQUFXdUosUUFBUSxLQUFuQixFQUEwQjlILFNBQVNzRyxTQUFTTSxPQUFULENBQWlCdVIsV0FBakIsR0FBNkIsS0FBaEUsRUFBZDs7QUFFQSxVQUFHN1YsT0FBT1ksT0FBUCxDQUFlbWEsUUFBbEIsRUFBMkI7QUFDekJELGdCQUFRRSxlQUFSLEdBQTBCLElBQTFCO0FBQ0FGLGdCQUFRbGYsT0FBUixHQUFrQixFQUFDLGlCQUFpQixXQUFTcUwsS0FBSyxVQUFRakgsT0FBT1ksT0FBUCxDQUFlbWEsUUFBZixDQUF3Qi9ILElBQXhCLEVBQWIsQ0FBM0IsRUFBbEI7QUFDRDs7QUFFRHRXLFlBQU1vZSxPQUFOLEVBQ0dwVCxJQURILENBQ1Esb0JBQVk7QUFDaEJXLGlCQUFTb0QsSUFBVCxDQUFjeUQsY0FBZCxHQUErQjdHLFNBQVN6TSxPQUFULENBQWlCLGtCQUFqQixDQUEvQjtBQUNBMmUsVUFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQW5CO0FBQ0QsT0FKSCxFQUtHN0QsS0FMSCxDQUtTLGVBQU87QUFDWjJTLFVBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxPQVBIO0FBUUEsYUFBTzBTLEVBQUVLLE9BQVQ7QUFDRCxLQXJXSTs7QUF1V0w3UyxZQUFRLGtCQUFVO0FBQUE7O0FBQ2hCLFVBQU05TCxNQUFNLDZCQUFaO0FBQ0EsVUFBSW1mLFNBQVM7QUFDWEMsaUJBQVMsY0FERTtBQUVYQyxnQkFBUSxXQUZHO0FBR1hDLGdCQUFRLFdBSEc7QUFJWEMsY0FBTSxlQUpLO0FBS1hDLGlCQUFTLE1BTEU7QUFNWEMsZ0JBQVE7QUFORyxPQUFiO0FBUUEsYUFBTztBQUNMaEosb0JBQVksc0JBQU07QUFDaEIsY0FBSTFPLFdBQVcsTUFBS0EsUUFBTCxDQUFjLFVBQWQsQ0FBZjtBQUNBLGNBQUdBLFNBQVMrRCxNQUFULENBQWdCRyxLQUFuQixFQUF5QjtBQUN2QmtULG1CQUFPbFQsS0FBUCxHQUFlbEUsU0FBUytELE1BQVQsQ0FBZ0JHLEtBQS9CO0FBQ0EsbUJBQU9qTSxNQUFJLElBQUosR0FBUzBmLE9BQU9DLEtBQVAsQ0FBYVIsTUFBYixDQUFoQjtBQUNEO0FBQ0QsaUJBQU8sRUFBUDtBQUNELFNBUkk7QUFTTGhULGVBQU8sZUFBQ0osSUFBRCxFQUFNQyxJQUFOLEVBQWU7QUFDcEIsY0FBSXNTLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0EsY0FBRyxDQUFDeFMsSUFBRCxJQUFTLENBQUNDLElBQWIsRUFDRSxPQUFPc1MsRUFBRUksTUFBRixDQUFTLGVBQVQsQ0FBUDtBQUNGLGNBQU1rQixnQkFBZ0I7QUFDcEIsc0JBQVUsT0FEVTtBQUVwQixtQkFBTzVmLEdBRmE7QUFHcEIsc0JBQVU7QUFDUix5QkFBVyxjQURIO0FBRVIsK0JBQWlCZ00sSUFGVDtBQUdSLCtCQUFpQkQsSUFIVDtBQUlSLDhCQUFnQm9ULE9BQU9FO0FBSmY7QUFIVSxXQUF0QjtBQVVBNWUsZ0JBQU0sRUFBQ1QsS0FBS0EsR0FBTjtBQUNGdUosb0JBQVEsTUFETjtBQUVGNFYsb0JBQVFBLE1BRk47QUFHRjNQLGtCQUFNNUMsS0FBS2lHLFNBQUwsQ0FBZStNLGFBQWYsQ0FISjtBQUlGamdCLHFCQUFTLEVBQUMsZ0JBQWdCLGtCQUFqQjtBQUpQLFdBQU4sRUFNRzhMLElBTkgsQ0FNUSxvQkFBWTtBQUNoQjtBQUNBLGdCQUFHVyxTQUFTb0QsSUFBVCxDQUFjME0sTUFBakIsRUFBd0I7QUFDdEJvQyxnQkFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQVQsQ0FBYzBNLE1BQXhCO0FBQ0QsYUFGRCxNQUVPO0FBQ0xvQyxnQkFBRUksTUFBRixDQUFTdFMsU0FBU29ELElBQWxCO0FBQ0Q7QUFDRixXQWJILEVBY0c3RCxLQWRILENBY1MsZUFBTztBQUNaMlMsY0FBRUksTUFBRixDQUFTOVMsR0FBVDtBQUNELFdBaEJIO0FBaUJBLGlCQUFPMFMsRUFBRUssT0FBVDtBQUNELFNBekNJO0FBMENMdFMsY0FBTSxjQUFDSixLQUFELEVBQVc7QUFDZixjQUFJcVMsSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQSxjQUFJeFcsV0FBVyxNQUFLQSxRQUFMLENBQWMsVUFBZCxDQUFmO0FBQ0FrRSxrQkFBUUEsU0FBU2xFLFNBQVMrRCxNQUFULENBQWdCRyxLQUFqQztBQUNBLGNBQUcsQ0FBQ0EsS0FBSixFQUNFLE9BQU9xUyxFQUFFSSxNQUFGLENBQVMsZUFBVCxDQUFQO0FBQ0ZqZSxnQkFBTSxFQUFDVCxLQUFLQSxHQUFOO0FBQ0Z1SixvQkFBUSxNQUROO0FBRUY0VixvQkFBUSxFQUFDbFQsT0FBT0EsS0FBUixFQUZOO0FBR0Z1RCxrQkFBTTVDLEtBQUtpRyxTQUFMLENBQWUsRUFBRXRKLFFBQVEsZUFBVixFQUFmLENBSEo7QUFJRjVKLHFCQUFTLEVBQUMsZ0JBQWdCLGtCQUFqQjtBQUpQLFdBQU4sRUFNRzhMLElBTkgsQ0FNUSxvQkFBWTtBQUNoQjZTLGNBQUVHLE9BQUYsQ0FBVXJTLFNBQVNvRCxJQUFULENBQWMwTSxNQUF4QjtBQUNELFdBUkgsRUFTR3ZRLEtBVEgsQ0FTUyxlQUFPO0FBQ1oyUyxjQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsV0FYSDtBQVlBLGlCQUFPMFMsRUFBRUssT0FBVDtBQUNELFNBN0RJO0FBOERMa0IsaUJBQVMsaUJBQUN6UyxNQUFELEVBQVN5UyxRQUFULEVBQXFCO0FBQzVCLGNBQUl2QixJQUFJOWQsR0FBRytkLEtBQUgsRUFBUjtBQUNBLGNBQUl4VyxXQUFXLE1BQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxjQUFJa0UsUUFBUWxFLFNBQVMrRCxNQUFULENBQWdCRyxLQUE1QjtBQUNBLGNBQUk2VCxVQUFVO0FBQ1osc0JBQVMsYUFERztBQUVaLHNCQUFVO0FBQ1IsMEJBQVkxUyxPQUFPYSxRQURYO0FBRVIsNkJBQWVyQixLQUFLaUcsU0FBTCxDQUFnQmdOLFFBQWhCO0FBRlA7QUFGRSxXQUFkO0FBT0E7QUFDQSxjQUFHLENBQUM1VCxLQUFKLEVBQ0UsT0FBT3FTLEVBQUVJLE1BQUYsQ0FBUyxlQUFULENBQVA7QUFDRlMsaUJBQU9sVCxLQUFQLEdBQWVBLEtBQWY7QUFDQXhMLGdCQUFNLEVBQUNULEtBQUtvTixPQUFPMlMsWUFBYjtBQUNGeFcsb0JBQVEsTUFETjtBQUVGNFYsb0JBQVFBLE1BRk47QUFHRjNQLGtCQUFNNUMsS0FBS2lHLFNBQUwsQ0FBZWlOLE9BQWYsQ0FISjtBQUlGbmdCLHFCQUFTLEVBQUMsaUJBQWlCLFVBQWxCLEVBQThCLGdCQUFnQixrQkFBOUM7QUFKUCxXQUFOLEVBTUc4TCxJQU5ILENBTVEsb0JBQVk7QUFDaEI2UyxjQUFFRyxPQUFGLENBQVVyUyxTQUFTb0QsSUFBVCxDQUFjME0sTUFBeEI7QUFDRCxXQVJILEVBU0d2USxLQVRILENBU1MsZUFBTztBQUNaMlMsY0FBRUksTUFBRixDQUFTOVMsR0FBVDtBQUNELFdBWEg7QUFZQSxpQkFBTzBTLEVBQUVLLE9BQVQ7QUFDRCxTQTFGSTtBQTJGTHRSLGdCQUFRLGdCQUFDRCxNQUFELEVBQVNDLE9BQVQsRUFBb0I7QUFDMUIsY0FBSXdTLFVBQVUsRUFBQyxVQUFTLEVBQUMsbUJBQWtCLEVBQUMsU0FBU3hTLE9BQVYsRUFBbkIsRUFBVixFQUFkO0FBQ0EsaUJBQU8sTUFBS3ZCLE1BQUwsR0FBYytULE9BQWQsQ0FBc0J6UyxNQUF0QixFQUE4QnlTLE9BQTlCLENBQVA7QUFDRCxTQTlGSTtBQStGTDlhLGNBQU0sY0FBQ3FJLE1BQUQsRUFBWTtBQUNoQixjQUFJeVMsVUFBVSxFQUFDLFVBQVMsRUFBQyxlQUFjLElBQWYsRUFBVixFQUErQixVQUFTLEVBQUMsZ0JBQWUsSUFBaEIsRUFBeEMsRUFBZDtBQUNBLGlCQUFPLE1BQUsvVCxNQUFMLEdBQWMrVCxPQUFkLENBQXNCelMsTUFBdEIsRUFBOEJ5UyxPQUE5QixDQUFQO0FBQ0Q7QUFsR0ksT0FBUDtBQW9HRCxLQXJkSTs7QUF1ZEw3WixXQUFPLGlCQUFZO0FBQUE7O0FBQ2pCLGFBQU87QUFDTDdHLGdCQUFRLGdCQUFDcVEsSUFBRCxFQUFVO0FBQ2hCLGNBQUl6SCxXQUFXLE9BQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxjQUFJcEksVUFBVSxFQUFFLGdCQUFnQixrQkFBbEIsRUFBZDtBQUNBLGNBQUlvSSxTQUFTL0IsS0FBVCxDQUFld0gsSUFBZixDQUFvQkMsR0FBcEIsSUFBMkIxRixTQUFTL0IsS0FBVCxDQUFld0gsSUFBZixDQUFvQi9KLEtBQW5ELEVBQTBEO0FBQ3hEOUQsb0JBQVFvSSxTQUFTL0IsS0FBVCxDQUFld0gsSUFBZixDQUFvQkMsR0FBNUIsSUFBbUMxRixTQUFTL0IsS0FBVCxDQUFld0gsSUFBZixDQUFvQi9KLEtBQXZEO0FBQ0Q7QUFDRCxjQUFJdWMsT0FBTztBQUNUaGdCLGlCQUFLK0gsU0FBUy9CLEtBQVQsQ0FBZWhHLEdBRFg7QUFFVHVKLG9CQUFReEIsU0FBUy9CLEtBQVQsQ0FBZXVELE1BRmQ7QUFHVDVKLHFCQUFTQTtBQUhBLFdBQVg7QUFLQSxjQUFJb0ksU0FBUy9CLEtBQVQsQ0FBZXVELE1BQWYsSUFBeUIsS0FBN0IsRUFDRXlXLEtBQUtiLE1BQUwsR0FBYzNQLElBQWQsQ0FERixLQUdFd1EsS0FBS3hRLElBQUwsR0FBWUEsSUFBWjtBQUNGLGlCQUFPd1EsSUFBUDtBQUNELFNBakJJOztBQW1CTHhVLGlCQUFTLG1CQUFNO0FBQ2IsY0FBSThTLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0EsY0FBSS9PLE9BQU8sRUFBRSxhQUFhLElBQWYsRUFBWDtBQUNBLGNBQUl5USxjQUFjLE9BQUtqYSxLQUFMLEdBQWE3RyxNQUFiLENBQW9CcVEsSUFBcEIsQ0FBbEI7O0FBRUEsY0FBSSxDQUFDeVEsWUFBWWpnQixHQUFqQixFQUFzQjtBQUNwQixtQkFBT3NlLEVBQUVJLE1BQUYsQ0FBUyxhQUFULENBQVA7QUFDRDs7QUFFRGplLGdCQUFNd2YsV0FBTixFQUNHeFUsSUFESCxDQUNRLG9CQUFZO0FBQ2hCLGdCQUFJVyxTQUFTaEUsTUFBYixFQUFxQjtBQUNuQmtXLGdCQUFFRyxPQUFGLHdCQUErQnJTLFNBQVNoRSxNQUF4QztBQUNELGFBRkQsTUFFTztBQUNMa1csZ0JBQUVJLE1BQUYsQ0FBU3RTLFNBQVNvRCxJQUFsQjtBQUNEO0FBQ0YsV0FQSCxFQVFHN0QsS0FSSCxDQVFTLGVBQU87QUFDWjJTLGNBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxXQVZIO0FBV0EsaUJBQU8wUyxFQUFFSyxPQUFUO0FBQ0QsU0F4Q0k7O0FBMENMN0YsY0FBTSxjQUFDdEosSUFBRCxFQUFVO0FBQ2QsY0FBSThPLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0EsY0FBSTBCLGNBQWMsT0FBS2phLEtBQUwsR0FBYTdHLE1BQWIsQ0FBb0JxUSxJQUFwQixDQUFsQjs7QUFFQSxjQUFJLENBQUN5USxZQUFZamdCLEdBQWpCLEVBQXNCO0FBQ3BCLG1CQUFPc2UsRUFBRUksTUFBRixDQUFTLGFBQVQsQ0FBUDtBQUNEOztBQUVEamUsZ0JBQU13ZixXQUFOLEVBQ0d4VSxJQURILENBQ1Esb0JBQVk7QUFDaEIsZ0JBQUlXLFNBQVNoRSxNQUFiLEVBQXFCO0FBQ25Ca1csZ0JBQUVHLE9BQUYsd0JBQStCclMsU0FBU2hFLE1BQXhDO0FBQ0QsYUFGRCxNQUVPO0FBQ0xrVyxnQkFBRUksTUFBRixDQUFTdFMsU0FBU29ELElBQWxCO0FBQ0Q7QUFDRixXQVBILEVBUUc3RCxLQVJILENBUVMsZUFBTztBQUNaMlMsY0FBRUksTUFBRixDQUFTOVMsR0FBVDtBQUNELFdBVkg7QUFXQSxpQkFBTzBTLEVBQUVLLE9BQVQ7QUFDRDtBQTlESSxPQUFQO0FBZ0VELEtBeGhCSTs7QUEwaEJMMVcsU0FBSyxlQUFVO0FBQ2IsVUFBSUYsV0FBVyxLQUFLQSxRQUFMLENBQWMsVUFBZCxDQUFmO0FBQ0EsVUFBSThXLFVBQVUsRUFBQzdlLEtBQUssOEJBQU4sRUFBc0NMLFNBQVMsRUFBL0MsRUFBbUQ4QixTQUFTLEtBQTVELEVBQWQ7O0FBRUEsYUFBTztBQUNMK0wsY0FBTSxzQkFBWTtBQUNoQixjQUFJOFEsSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQSxjQUFHeFcsU0FBU0UsR0FBVCxDQUFhRSxPQUFiLElBQXdCSixTQUFTRSxHQUFULENBQWFDLEtBQXhDLEVBQThDO0FBQzVDMlcsb0JBQVE3ZSxHQUFSLGVBQXdCK0gsU0FBU0UsR0FBVCxDQUFhRSxPQUFyQztBQUNBMFcsb0JBQVF0VixNQUFSLEdBQWlCLEtBQWpCO0FBQ0FzVixvQkFBUWxmLE9BQVIsQ0FBZ0IsV0FBaEIsU0FBa0NvSSxTQUFTRSxHQUFULENBQWFFLE9BQS9DO0FBQ0EwVyxvQkFBUWxmLE9BQVIsQ0FBZ0IsYUFBaEIsU0FBb0NvSSxTQUFTRSxHQUFULENBQWFDLEtBQWpEO0FBQ0F6SCxrQkFBTW9lLE9BQU4sRUFDR3BULElBREgsQ0FDUSxvQkFBWTtBQUNoQixrQkFBR1csWUFBWUEsU0FBU29ELElBQXJCLElBQTZCcEQsU0FBU29ELElBQVQsQ0FBYzBRLE9BQTlDLEVBQ0U1QixFQUFFRyxPQUFGLENBQVVyUyxRQUFWLEVBREYsS0FHRWtTLEVBQUVJLE1BQUYsQ0FBUyxnQkFBVDtBQUNILGFBTkgsRUFPRy9TLEtBUEgsQ0FPUyxlQUFPO0FBQ1oyUyxnQkFBRUksTUFBRixDQUFTOVMsR0FBVDtBQUNELGFBVEg7QUFVRCxXQWZELE1BZU87QUFDTDBTLGNBQUVJLE1BQUYsQ0FBUyxLQUFUO0FBQ0Q7QUFDRCxpQkFBT0osRUFBRUssT0FBVDtBQUNEO0FBdEJJLE9BQVA7QUF3QkQsS0F0akJJOztBQXdqQkw7QUFDQXdCLGFBQVMsaUJBQVNwYyxNQUFULEVBQWdCO0FBQ3ZCLFVBQUlxYyxVQUFVcmMsT0FBTzRCLElBQVAsQ0FBWVUsR0FBMUI7QUFDQTtBQUNBLGVBQVNnYSxJQUFULENBQWVDLENBQWYsRUFBaUJDLE1BQWpCLEVBQXdCQyxNQUF4QixFQUErQkMsT0FBL0IsRUFBdUNDLE9BQXZDLEVBQStDO0FBQzdDLGVBQU8sQ0FBQ0osSUFBSUMsTUFBTCxLQUFnQkcsVUFBVUQsT0FBMUIsS0FBc0NELFNBQVNELE1BQS9DLElBQXlERSxPQUFoRTtBQUNEO0FBQ0QsVUFBRzFjLE9BQU80QixJQUFQLENBQVl6RCxJQUFaLElBQW9CLFlBQXZCLEVBQW9DO0FBQ2xDLFlBQU15ZSxvQkFBb0IsS0FBMUI7QUFDQTtBQUNBLFlBQU1DLHFCQUFxQixFQUEzQjtBQUNBO0FBQ0E7QUFDQSxZQUFNQyxhQUFhLENBQW5CO0FBQ0E7QUFDQSxZQUFNQyxlQUFlLElBQXJCO0FBQ0E7QUFDQSxZQUFNQyxpQkFBaUIsS0FBdkI7QUFDRDtBQUNBO0FBQ0EsWUFBR2hkLE9BQU80QixJQUFQLENBQVlOLEdBQVosQ0FBZ0JrQyxPQUFoQixDQUF3QixHQUF4QixNQUFpQyxDQUFwQyxFQUFzQztBQUNwQzZZLG9CQUFXQSxXQUFXLE1BQU0sS0FBakIsQ0FBRCxHQUE0QixNQUF0QztBQUNBLGNBQUlZLEtBQUtsTSxLQUFLbU0sR0FBTCxDQUFTYixVQUFVTyxpQkFBbkIsQ0FBVDtBQUNBLGNBQUlPLFNBQVMsS0FBSyxlQUFnQixnQkFBZ0JGLEVBQWhDLEdBQXVDLGtCQUFrQkEsRUFBbEIsR0FBdUJBLEVBQTlELEdBQXFFLENBQUMsaUJBQUQsR0FBcUJBLEVBQXJCLEdBQTBCQSxFQUExQixHQUErQkEsRUFBekcsQ0FBYjtBQUNDO0FBQ0QsaUJBQU9FLFNBQVMsTUFBaEI7QUFDRCxTQU5ELE1BTU87QUFDTGQsb0JBQVUsT0FBT0EsT0FBUCxHQUFpQixDQUEzQjtBQUNBQSxvQkFBVVcsaUJBQWlCWCxPQUEzQjs7QUFFQSxjQUFJZSxZQUFZZixVQUFVTyxpQkFBMUIsQ0FKSyxDQUk0QztBQUNqRFEsc0JBQVlyTSxLQUFLbU0sR0FBTCxDQUFTRSxTQUFULENBQVosQ0FMSyxDQUs2QztBQUNsREEsdUJBQWFMLFlBQWIsQ0FOSyxDQU13QztBQUM3Q0ssdUJBQWEsT0FBT1AscUJBQXFCLE1BQTVCLENBQWIsQ0FQSyxDQU82QztBQUNsRE8sc0JBQVksTUFBTUEsU0FBbEIsQ0FSSyxDQVF3QztBQUM3Q0EsdUJBQWEsTUFBYjtBQUNBLGlCQUFPQSxTQUFQO0FBQ0Q7QUFDRixPQS9CQSxNQStCTSxJQUFHcGQsT0FBTzRCLElBQVAsQ0FBWXpELElBQVosSUFBb0IsT0FBdkIsRUFBK0I7QUFDcEMsWUFBSTZCLE9BQU80QixJQUFQLENBQVlVLEdBQVosSUFBbUJ0QyxPQUFPNEIsSUFBUCxDQUFZVSxHQUFaLEdBQWdCLEdBQXZDLEVBQTJDO0FBQzFDLGlCQUFRLE1BQUlnYSxLQUFLdGMsT0FBTzRCLElBQVAsQ0FBWVUsR0FBakIsRUFBcUIsR0FBckIsRUFBeUIsSUFBekIsRUFBOEIsQ0FBOUIsRUFBZ0MsR0FBaEMsQ0FBTCxHQUEyQyxHQUFsRDtBQUNBO0FBQ0Y7QUFDQSxhQUFPLEtBQVA7QUFDRCxLQXBtQkk7O0FBc21CTG9JLGNBQVUsb0JBQVU7QUFDbEIsVUFBSTZQLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0EsVUFBSXhXLFdBQVcsS0FBS0EsUUFBTCxDQUFjLFVBQWQsQ0FBZjtBQUNBLFVBQUlxWix3QkFBc0JyWixTQUFTMEcsUUFBVCxDQUFrQnpPLEdBQTVDO0FBQ0EsVUFBRzRCLFFBQVFtRyxTQUFTMEcsUUFBVCxDQUFrQndJLElBQTFCLENBQUgsRUFDRW1LLDBCQUF3QnJaLFNBQVMwRyxRQUFULENBQWtCd0ksSUFBMUM7O0FBRUYsYUFBTztBQUNMckksY0FBTSxjQUFDSCxRQUFELEVBQWM7QUFDbEIsY0FBR0EsWUFBWUEsU0FBU3pPLEdBQXhCLEVBQTRCO0FBQzFCb2hCLG9DQUFzQjNTLFNBQVN6TyxHQUEvQjtBQUNBLGdCQUFHNEIsUUFBUTZNLFNBQVN3SSxJQUFqQixDQUFILEVBQ0VtSywwQkFBd0IzUyxTQUFTd0ksSUFBakM7QUFDSDtBQUNELGNBQUk0SCxVQUFVLEVBQUM3ZSxVQUFRb2hCLGdCQUFULEVBQTZCN1gsUUFBUSxLQUFyQyxFQUFkO0FBQ0E5SSxnQkFBTW9lLE9BQU4sRUFDR3BULElBREgsQ0FDUSxvQkFBWTtBQUNoQjZTLGNBQUVHLE9BQUYsQ0FBVXJTLFFBQVY7QUFDRCxXQUhILEVBSUdULEtBSkgsQ0FJUyxlQUFPO0FBQ1oyUyxjQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsV0FOSDtBQU9FLGlCQUFPMFMsRUFBRUssT0FBVDtBQUNILFNBaEJJO0FBaUJMN1AsYUFBSyxlQUFNO0FBQ1RyTyxnQkFBTSxFQUFDVCxLQUFRb2hCLGdCQUFSLGlCQUFvQ3JaLFNBQVMwRyxRQUFULENBQWtCMUMsSUFBbEIsQ0FBdUJnTCxJQUF2QixFQUFwQyxXQUF1RWhQLFNBQVMwRyxRQUFULENBQWtCekMsSUFBbEIsQ0FBdUIrSyxJQUF2QixFQUF2RSxXQUEwRzFCLG1CQUFtQixnQkFBbkIsQ0FBM0csRUFBbUo5TCxRQUFRLEtBQTNKLEVBQU4sRUFDR2tDLElBREgsQ0FDUSxvQkFBWTtBQUNoQixnQkFBR1csU0FBU29ELElBQVQsSUFDRHBELFNBQVNvRCxJQUFULENBQWNDLE9BRGIsSUFFRHJELFNBQVNvRCxJQUFULENBQWNDLE9BQWQsQ0FBc0J4SyxNQUZyQixJQUdEbUgsU0FBU29ELElBQVQsQ0FBY0MsT0FBZCxDQUFzQixDQUF0QixFQUF5QjRSLE1BSHhCLElBSURqVixTQUFTb0QsSUFBVCxDQUFjQyxPQUFkLENBQXNCLENBQXRCLEVBQXlCNFIsTUFBekIsQ0FBZ0NwYyxNQUovQixJQUtEbUgsU0FBU29ELElBQVQsQ0FBY0MsT0FBZCxDQUFzQixDQUF0QixFQUF5QjRSLE1BQXpCLENBQWdDLENBQWhDLEVBQW1DOWEsTUFMckMsRUFLNkM7QUFDM0MrWCxnQkFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQVQsQ0FBY0MsT0FBZCxDQUFzQixDQUF0QixFQUF5QjRSLE1BQXpCLENBQWdDLENBQWhDLEVBQW1DOWEsTUFBN0M7QUFDRCxhQVBELE1BT087QUFDTCtYLGdCQUFFRyxPQUFGLENBQVUsRUFBVjtBQUNEO0FBQ0YsV0FaSCxFQWFHOVMsS0FiSCxDQWFTLGVBQU87QUFDWjJTLGNBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxXQWZIO0FBZ0JFLGlCQUFPMFMsRUFBRUssT0FBVDtBQUNILFNBbkNJO0FBb0NMcFAsa0JBQVUsa0JBQUNqTyxJQUFELEVBQVU7QUFDbEJiLGdCQUFNLEVBQUNULEtBQVFvaEIsZ0JBQVIsaUJBQW9DclosU0FBUzBHLFFBQVQsQ0FBa0IxQyxJQUFsQixDQUF1QmdMLElBQXZCLEVBQXBDLFdBQXVFaFAsU0FBUzBHLFFBQVQsQ0FBa0J6QyxJQUFsQixDQUF1QitLLElBQXZCLEVBQXZFLFdBQTBHMUIseUNBQXVDL1QsSUFBdkMsT0FBM0csRUFBOEppSSxRQUFRLE1BQXRLLEVBQU4sRUFDR2tDLElBREgsQ0FDUSxvQkFBWTtBQUNoQjZTLGNBQUVHLE9BQUYsQ0FBVXJTLFFBQVY7QUFDRCxXQUhILEVBSUdULEtBSkgsQ0FJUyxlQUFPO0FBQ1oyUyxjQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsV0FOSDtBQU9BLGlCQUFPMFMsRUFBRUssT0FBVDtBQUNEO0FBN0NJLE9BQVA7QUErQ0QsS0E1cEJJOztBQThwQkw5YixTQUFLLGVBQVU7QUFDWCxVQUFJeWIsSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQTlkLFlBQU1rVyxHQUFOLENBQVUsZUFBVixFQUNHbEwsSUFESCxDQUNRLG9CQUFZO0FBQ2hCNlMsVUFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQW5CO0FBQ0QsT0FISCxFQUlHN0QsS0FKSCxDQUlTLGVBQU87QUFDWjJTLFVBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxPQU5IO0FBT0UsYUFBTzBTLEVBQUVLLE9BQVQ7QUFDTCxLQXhxQkk7O0FBMHFCTGpjLFlBQVEsa0JBQVU7QUFDZCxVQUFJNGIsSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQTlkLFlBQU1rVyxHQUFOLENBQVUsMEJBQVYsRUFDR2xMLElBREgsQ0FDUSxvQkFBWTtBQUNoQjZTLFVBQUVHLE9BQUYsQ0FBVXJTLFNBQVNvRCxJQUFuQjtBQUNELE9BSEgsRUFJRzdELEtBSkgsQ0FJUyxlQUFPO0FBQ1oyUyxVQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsT0FOSDtBQU9BLGFBQU8wUyxFQUFFSyxPQUFUO0FBQ0gsS0FwckJJOztBQXNyQkxsYyxVQUFNLGdCQUFVO0FBQ1osVUFBSTZiLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0E5ZCxZQUFNa1csR0FBTixDQUFVLHdCQUFWLEVBQ0dsTCxJQURILENBQ1Esb0JBQVk7QUFDaEI2UyxVQUFFRyxPQUFGLENBQVVyUyxTQUFTb0QsSUFBbkI7QUFDRCxPQUhILEVBSUc3RCxLQUpILENBSVMsZUFBTztBQUNaMlMsVUFBRUksTUFBRixDQUFTOVMsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPMFMsRUFBRUssT0FBVDtBQUNILEtBaHNCSTs7QUFrc0JMaGMsV0FBTyxpQkFBVTtBQUNiLFVBQUkyYixJQUFJOWQsR0FBRytkLEtBQUgsRUFBUjtBQUNBOWQsWUFBTWtXLEdBQU4sQ0FBVSx5QkFBVixFQUNHbEwsSUFESCxDQUNRLG9CQUFZO0FBQ2hCNlMsVUFBRUcsT0FBRixDQUFVclMsU0FBU29ELElBQW5CO0FBQ0QsT0FISCxFQUlHN0QsS0FKSCxDQUlTLGVBQU87QUFDWjJTLFVBQUVJLE1BQUYsQ0FBUzlTLEdBQVQ7QUFDRCxPQU5IO0FBT0EsYUFBTzBTLEVBQUVLLE9BQVQ7QUFDSCxLQTVzQkk7O0FBOHNCTC9NLFlBQVEsa0JBQVU7QUFDaEIsVUFBSTBNLElBQUk5ZCxHQUFHK2QsS0FBSCxFQUFSO0FBQ0E5ZCxZQUFNa1csR0FBTixDQUFVLDhCQUFWLEVBQ0dsTCxJQURILENBQ1Esb0JBQVk7QUFDaEI2UyxVQUFFRyxPQUFGLENBQVVyUyxTQUFTb0QsSUFBbkI7QUFDRCxPQUhILEVBSUc3RCxLQUpILENBSVMsZUFBTztBQUNaMlMsVUFBRUksTUFBRixDQUFTOVMsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPMFMsRUFBRUssT0FBVDtBQUNELEtBeHRCSTs7QUEwdEJML2IsY0FBVSxvQkFBVTtBQUNoQixVQUFJMGIsSUFBSTlkLEdBQUcrZCxLQUFILEVBQVI7QUFDQTlkLFlBQU1rVyxHQUFOLENBQVUsNEJBQVYsRUFDR2xMLElBREgsQ0FDUSxvQkFBWTtBQUNoQjZTLFVBQUVHLE9BQUYsQ0FBVXJTLFNBQVNvRCxJQUFuQjtBQUNELE9BSEgsRUFJRzdELEtBSkgsQ0FJUyxlQUFPO0FBQ1oyUyxVQUFFSSxNQUFGLENBQVM5UyxHQUFUO0FBQ0QsT0FOSDtBQU9BLGFBQU8wUyxFQUFFSyxPQUFUO0FBQ0gsS0FwdUJJOztBQXN1QkxyVyxrQkFBYyxzQkFBU2xGLE9BQVQsRUFBaUI7QUFDN0IsYUFBTztBQUNMb0YsZUFBTztBQUNEdEcsZ0JBQU0sV0FETDtBQUVEb2YsaUJBQU87QUFDTEMsb0JBQVEzZixRQUFRd0IsUUFBUW9lLE9BQWhCLENBREg7QUFFTHBQLGtCQUFNeFEsUUFBUXdCLFFBQVFvZSxPQUFoQixJQUEyQnBlLFFBQVFvZSxPQUFuQyxHQUE2QztBQUY5QyxXQUZOO0FBTURDLGtCQUFRLG1CQU5QO0FBT0RDLGtCQUFRLEdBUFA7QUFRREMsa0JBQVM7QUFDTEMsaUJBQUssRUFEQTtBQUVMQyxtQkFBTyxFQUZGO0FBR0xDLG9CQUFRLEdBSEg7QUFJTEMsa0JBQU07QUFKRCxXQVJSO0FBY0R6QixhQUFHLFdBQVMwQixDQUFULEVBQVc7QUFBRSxtQkFBUUEsS0FBS0EsRUFBRS9jLE1BQVIsR0FBa0IrYyxFQUFFLENBQUYsQ0FBbEIsR0FBeUJBLENBQWhDO0FBQW9DLFdBZG5EO0FBZURDLGFBQUcsV0FBU0QsQ0FBVCxFQUFXO0FBQUUsbUJBQVFBLEtBQUtBLEVBQUUvYyxNQUFSLEdBQWtCK2MsRUFBRSxDQUFGLENBQWxCLEdBQXlCQSxDQUFoQztBQUFvQyxXQWZuRDtBQWdCRDs7QUFFQW5PLGlCQUFPcU8sR0FBRzVZLEtBQUgsQ0FBUzZZLFVBQVQsR0FBc0I5YSxLQUF0QixFQWxCTjtBQW1CRCthLG9CQUFVLEdBbkJUO0FBb0JEQyxtQ0FBeUIsSUFwQnhCO0FBcUJEQyx1QkFBYSxLQXJCWjtBQXNCREMsdUJBQWEsT0F0Qlo7QUF1QkRDLGtCQUFRO0FBQ04vVSxpQkFBSyxhQUFVdVUsQ0FBVixFQUFhO0FBQUUscUJBQU9BLEVBQUUxZ0IsSUFBVDtBQUFlO0FBRDdCLFdBdkJQO0FBMEJEbWhCLGtCQUFRLGdCQUFVVCxDQUFWLEVBQWE7QUFBRSxtQkFBT3BnQixRQUFRd0IsUUFBUW9GLEtBQVIsQ0FBY2dWLElBQXRCLENBQVA7QUFBb0MsV0ExQjFEO0FBMkJEa0YsaUJBQU87QUFDSEMsdUJBQVcsTUFEUjtBQUVIQyx3QkFBWSxvQkFBU1osQ0FBVCxFQUFZO0FBQ3BCLGtCQUFHcGdCLFFBQVF3QixRQUFRb0YsS0FBUixDQUFjK1UsUUFBdEIsQ0FBSCxFQUNFLE9BQU8yRSxHQUFHVyxJQUFILENBQVF4VCxNQUFSLENBQWUsVUFBZixFQUEyQixJQUFJdEUsSUFBSixDQUFTaVgsQ0FBVCxDQUEzQixFQUF3QzNMLFdBQXhDLEVBQVAsQ0FERixLQUdFLE9BQU82TCxHQUFHVyxJQUFILENBQVF4VCxNQUFSLENBQWUsWUFBZixFQUE2QixJQUFJdEUsSUFBSixDQUFTaVgsQ0FBVCxDQUE3QixFQUEwQzNMLFdBQTFDLEVBQVA7QUFDTCxhQVBFO0FBUUh5TSxvQkFBUSxRQVJMO0FBU0hDLHlCQUFhLEVBVFY7QUFVSEMsK0JBQW1CLEVBVmhCO0FBV0hDLDJCQUFlO0FBWFosV0EzQk47QUF3Q0RDLGtCQUFTLENBQUM5ZixRQUFRbUYsSUFBVCxJQUFpQm5GLFFBQVFtRixJQUFSLElBQWMsR0FBaEMsR0FBdUMsQ0FBQyxDQUFELEVBQUcsR0FBSCxDQUF2QyxHQUFpRCxDQUFDLENBQUMsRUFBRixFQUFLLEdBQUwsQ0F4Q3hEO0FBeUNENGEsaUJBQU87QUFDSFIsdUJBQVcsYUFEUjtBQUVIQyx3QkFBWSxvQkFBU1osQ0FBVCxFQUFXO0FBQ25CLHFCQUFPM2hCLFFBQVEsUUFBUixFQUFrQjJoQixDQUFsQixFQUFvQixDQUFwQixJQUF1QixNQUE5QjtBQUNILGFBSkU7QUFLSGMsb0JBQVEsTUFMTDtBQU1ITSx3QkFBWSxJQU5UO0FBT0hKLCtCQUFtQjtBQVBoQjtBQXpDTjtBQURGLE9BQVA7QUFxREQsS0E1eEJJO0FBNnhCTDtBQUNBO0FBQ0F4WixTQUFLLGFBQVNDLEVBQVQsRUFBWUMsRUFBWixFQUFlO0FBQ2xCLGFBQU8sQ0FBQyxDQUFFRCxLQUFLQyxFQUFQLElBQWMsTUFBZixFQUF1QjJaLE9BQXZCLENBQStCLENBQS9CLENBQVA7QUFDRCxLQWp5Qkk7QUFreUJMO0FBQ0ExWixVQUFNLGNBQVNGLEVBQVQsRUFBWUMsRUFBWixFQUFlO0FBQ25CLGFBQU8sQ0FBRyxTQUFVRCxLQUFLQyxFQUFmLEtBQXdCLFFBQVFELEVBQWhDLENBQUYsSUFBNENDLEtBQUssS0FBakQsQ0FBRCxFQUEyRDJaLE9BQTNELENBQW1FLENBQW5FLENBQVA7QUFDRCxLQXJ5Qkk7QUFzeUJMO0FBQ0F6WixTQUFLLGFBQVNKLEdBQVQsRUFBYUUsRUFBYixFQUFnQjtBQUNuQixhQUFPLENBQUUsT0FBT0YsR0FBUixHQUFlRSxFQUFoQixFQUFvQjJaLE9BQXBCLENBQTRCLENBQTVCLENBQVA7QUFDRCxLQXp5Qkk7QUEweUJMclosUUFBSSxZQUFTc1osRUFBVCxFQUFZQyxFQUFaLEVBQWU7QUFDakIsYUFBUSxTQUFTRCxFQUFWLEdBQWlCLFNBQVNDLEVBQWpDO0FBQ0QsS0E1eUJJO0FBNnlCTDFaLGlCQUFhLHFCQUFTeVosRUFBVCxFQUFZQyxFQUFaLEVBQWU7QUFDMUIsYUFBTyxDQUFDLENBQUMsSUFBS0EsS0FBR0QsRUFBVCxJQUFjLEdBQWYsRUFBb0JELE9BQXBCLENBQTRCLENBQTVCLENBQVA7QUFDRCxLQS95Qkk7QUFnekJMdFosY0FBVSxrQkFBU0gsR0FBVCxFQUFhSSxFQUFiLEVBQWdCTixFQUFoQixFQUFtQjtBQUMzQixhQUFPLENBQUMsQ0FBRSxNQUFNRSxHQUFQLEdBQWMsT0FBT0ksS0FBSyxHQUFaLENBQWYsSUFBbUNOLEVBQW5DLEdBQXdDLElBQXpDLEVBQStDMlosT0FBL0MsQ0FBdUQsQ0FBdkQsQ0FBUDtBQUNELEtBbHpCSTtBQW16Qkw7QUFDQXBaLFFBQUksWUFBVUgsS0FBVixFQUFpQjtBQUNuQixVQUFJLENBQUNBLEtBQUwsRUFBWSxPQUFPLEVBQVA7QUFDWixVQUFJRyxLQUFNLElBQUtILFNBQVMsUUFBVUEsUUFBUSxLQUFULEdBQWtCLEtBQXBDLENBQWY7QUFDQSxhQUFPckMsV0FBV3dDLEVBQVgsRUFBZW9aLE9BQWYsQ0FBdUIsQ0FBdkIsQ0FBUDtBQUNELEtBeHpCSTtBQXl6Qkx2WixXQUFPLGVBQVVHLEVBQVYsRUFBYztBQUNuQixVQUFJLENBQUNBLEVBQUwsRUFBUyxPQUFPLEVBQVA7QUFDVCxVQUFJSCxRQUFRLENBQUUsQ0FBQyxDQUFELEdBQUssT0FBTixHQUFrQixVQUFVRyxFQUE1QixHQUFtQyxVQUFVNkssS0FBSzBPLEdBQUwsQ0FBU3ZaLEVBQVQsRUFBWSxDQUFaLENBQTdDLEdBQWdFLFVBQVU2SyxLQUFLME8sR0FBTCxDQUFTdlosRUFBVCxFQUFZLENBQVosQ0FBM0UsRUFBNEYyUyxRQUE1RixFQUFaO0FBQ0EsVUFBRzlTLE1BQU0yWixTQUFOLENBQWdCM1osTUFBTXZDLE9BQU4sQ0FBYyxHQUFkLElBQW1CLENBQW5DLEVBQXFDdUMsTUFBTXZDLE9BQU4sQ0FBYyxHQUFkLElBQW1CLENBQXhELEtBQThELENBQWpFLEVBQ0V1QyxRQUFRQSxNQUFNMlosU0FBTixDQUFnQixDQUFoQixFQUFrQjNaLE1BQU12QyxPQUFOLENBQWMsR0FBZCxJQUFtQixDQUFyQyxDQUFSLENBREYsS0FFSyxJQUFHdUMsTUFBTTJaLFNBQU4sQ0FBZ0IzWixNQUFNdkMsT0FBTixDQUFjLEdBQWQsSUFBbUIsQ0FBbkMsRUFBcUN1QyxNQUFNdkMsT0FBTixDQUFjLEdBQWQsSUFBbUIsQ0FBeEQsSUFBNkQsQ0FBaEUsRUFDSHVDLFFBQVFBLE1BQU0yWixTQUFOLENBQWdCLENBQWhCLEVBQWtCM1osTUFBTXZDLE9BQU4sQ0FBYyxHQUFkLENBQWxCLENBQVIsQ0FERyxLQUVBLElBQUd1QyxNQUFNMlosU0FBTixDQUFnQjNaLE1BQU12QyxPQUFOLENBQWMsR0FBZCxJQUFtQixDQUFuQyxFQUFxQ3VDLE1BQU12QyxPQUFOLENBQWMsR0FBZCxJQUFtQixDQUF4RCxJQUE2RCxDQUFoRSxFQUFrRTtBQUNyRXVDLGdCQUFRQSxNQUFNMlosU0FBTixDQUFnQixDQUFoQixFQUFrQjNaLE1BQU12QyxPQUFOLENBQWMsR0FBZCxDQUFsQixDQUFSO0FBQ0F1QyxnQkFBUXJDLFdBQVdxQyxLQUFYLElBQW9CLENBQTVCO0FBQ0Q7QUFDRCxhQUFPckMsV0FBV3FDLEtBQVgsRUFBa0J1WixPQUFsQixDQUEwQixDQUExQixDQUFQLENBQW9DO0FBQ3JDLEtBcjBCSTtBQXMwQkwxUyxxQkFBaUIseUJBQVN0SCxNQUFULEVBQWdCO0FBQy9CLFVBQUkrQyxXQUFXLEVBQUM5SyxNQUFLLEVBQU4sRUFBVTJQLE1BQUssRUFBZixFQUFtQkMsUUFBUSxFQUFDNVAsTUFBSyxFQUFOLEVBQTNCLEVBQXNDeVAsVUFBUyxFQUEvQyxFQUFtRHZILEtBQUksRUFBdkQsRUFBMkRDLElBQUcsS0FBOUQsRUFBcUVDLElBQUcsS0FBeEUsRUFBK0VzSCxLQUFJLENBQW5GLEVBQXNGdk8sTUFBSyxFQUEzRixFQUErRkMsUUFBTyxFQUF0RyxFQUEwR2dQLE9BQU0sRUFBaEgsRUFBb0hELE1BQUssRUFBekgsRUFBZjtBQUNBLFVBQUc3UCxRQUFReUgsT0FBT3FhLFFBQWYsQ0FBSCxFQUNFdFgsU0FBUzlLLElBQVQsR0FBZ0IrSCxPQUFPcWEsUUFBdkI7QUFDRixVQUFHOWhCLFFBQVF5SCxPQUFPc2EsU0FBUCxDQUFpQkMsWUFBekIsQ0FBSCxFQUNFeFgsU0FBUzJFLFFBQVQsR0FBb0IxSCxPQUFPc2EsU0FBUCxDQUFpQkMsWUFBckM7QUFDRixVQUFHaGlCLFFBQVF5SCxPQUFPd2EsUUFBZixDQUFILEVBQ0V6WCxTQUFTNkUsSUFBVCxHQUFnQjVILE9BQU93YSxRQUF2QjtBQUNGLFVBQUdqaUIsUUFBUXlILE9BQU95YSxVQUFmLENBQUgsRUFDRTFYLFNBQVM4RSxNQUFULENBQWdCNVAsSUFBaEIsR0FBdUIrSCxPQUFPeWEsVUFBOUI7O0FBRUYsVUFBR2xpQixRQUFReUgsT0FBT3NhLFNBQVAsQ0FBaUJJLFVBQXpCLENBQUgsRUFDRTNYLFNBQVMzQyxFQUFULEdBQWNoQyxXQUFXNEIsT0FBT3NhLFNBQVAsQ0FBaUJJLFVBQTVCLEVBQXdDVixPQUF4QyxDQUFnRCxDQUFoRCxDQUFkLENBREYsS0FFSyxJQUFHemhCLFFBQVF5SCxPQUFPc2EsU0FBUCxDQUFpQkssVUFBekIsQ0FBSCxFQUNINVgsU0FBUzNDLEVBQVQsR0FBY2hDLFdBQVc0QixPQUFPc2EsU0FBUCxDQUFpQkssVUFBNUIsRUFBd0NYLE9BQXhDLENBQWdELENBQWhELENBQWQ7QUFDRixVQUFHemhCLFFBQVF5SCxPQUFPc2EsU0FBUCxDQUFpQk0sVUFBekIsQ0FBSCxFQUNFN1gsU0FBUzFDLEVBQVQsR0FBY2pDLFdBQVc0QixPQUFPc2EsU0FBUCxDQUFpQk0sVUFBNUIsRUFBd0NaLE9BQXhDLENBQWdELENBQWhELENBQWQsQ0FERixLQUVLLElBQUd6aEIsUUFBUXlILE9BQU9zYSxTQUFQLENBQWlCTyxVQUF6QixDQUFILEVBQ0g5WCxTQUFTMUMsRUFBVCxHQUFjakMsV0FBVzRCLE9BQU9zYSxTQUFQLENBQWlCTyxVQUE1QixFQUF3Q2IsT0FBeEMsQ0FBZ0QsQ0FBaEQsQ0FBZDs7QUFFRixVQUFHemhCLFFBQVF5SCxPQUFPc2EsU0FBUCxDQUFpQlEsV0FBekIsQ0FBSCxFQUNFL1gsU0FBUzVDLEdBQVQsR0FBZW5KLFFBQVEsUUFBUixFQUFrQmdKLE9BQU9zYSxTQUFQLENBQWlCUSxXQUFuQyxFQUErQyxDQUEvQyxDQUFmLENBREYsS0FFSyxJQUFHdmlCLFFBQVF5SCxPQUFPc2EsU0FBUCxDQUFpQlMsV0FBekIsQ0FBSCxFQUNIaFksU0FBUzVDLEdBQVQsR0FBZW5KLFFBQVEsUUFBUixFQUFrQmdKLE9BQU9zYSxTQUFQLENBQWlCUyxXQUFuQyxFQUErQyxDQUEvQyxDQUFmOztBQUVGLFVBQUd4aUIsUUFBUXlILE9BQU9zYSxTQUFQLENBQWlCVSxXQUF6QixDQUFILEVBQ0VqWSxTQUFTNEUsR0FBVCxHQUFlc1QsU0FBU2piLE9BQU9zYSxTQUFQLENBQWlCVSxXQUExQixFQUFzQyxFQUF0QyxDQUFmLENBREYsS0FFSyxJQUFHemlCLFFBQVF5SCxPQUFPc2EsU0FBUCxDQUFpQlksV0FBekIsQ0FBSCxFQUNIblksU0FBUzRFLEdBQVQsR0FBZXNULFNBQVNqYixPQUFPc2EsU0FBUCxDQUFpQlksV0FBMUIsRUFBc0MsRUFBdEMsQ0FBZjs7QUFFRixVQUFHM2lCLFFBQVF5SCxPQUFPbWIsV0FBUCxDQUFtQmhVLElBQW5CLENBQXdCaVUsS0FBaEMsQ0FBSCxFQUEwQztBQUN4Q3ZmLFVBQUVDLElBQUYsQ0FBT2tFLE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0JpVSxLQUEvQixFQUFxQyxVQUFTdFQsS0FBVCxFQUFlO0FBQ2xEL0UsbUJBQVMxSixNQUFULENBQWdCMEMsSUFBaEIsQ0FBcUI7QUFDbkJnTSxtQkFBT0QsTUFBTXVULFFBRE07QUFFbkJ2aEIsaUJBQUttaEIsU0FBU25ULE1BQU13VCxhQUFmLEVBQTZCLEVBQTdCLENBRmM7QUFHbkJwVCxtQkFBT2xSLFFBQVEsbUJBQVIsRUFBNkI4USxNQUFNeVQsVUFBbkMsSUFBK0MsS0FIbkM7QUFJbkJ2VCxvQkFBUWhSLFFBQVEsbUJBQVIsRUFBNkI4USxNQUFNeVQsVUFBbkM7QUFKVyxXQUFyQjtBQU1ELFNBUEQ7QUFRRDs7QUFFRCxVQUFHaGpCLFFBQVF5SCxPQUFPbWIsV0FBUCxDQUFtQmhVLElBQW5CLENBQXdCcVUsSUFBaEMsQ0FBSCxFQUF5QztBQUNyQzNmLFVBQUVDLElBQUYsQ0FBT2tFLE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0JxVSxJQUEvQixFQUFvQyxVQUFTclQsR0FBVCxFQUFhO0FBQy9DcEYsbUJBQVMzSixJQUFULENBQWMyQyxJQUFkLENBQW1CO0FBQ2pCZ00sbUJBQU9JLElBQUlzVCxRQURNO0FBRWpCM2hCLGlCQUFLbWhCLFNBQVM5UyxJQUFJdVQsZ0JBQWIsRUFBOEIsRUFBOUIsSUFBb0MsQ0FBcEMsR0FBd0MsSUFBeEMsR0FBK0NULFNBQVM5UyxJQUFJd1QsYUFBYixFQUEyQixFQUEzQixDQUZuQztBQUdqQnpULG1CQUFPK1MsU0FBUzlTLElBQUl1VCxnQkFBYixFQUE4QixFQUE5QixJQUFvQyxDQUFwQyxHQUNILGFBQVcxa0IsUUFBUSxtQkFBUixFQUE2Qm1SLElBQUl5VCxVQUFqQyxDQUFYLEdBQXdELE1BQXhELEdBQStELE9BQS9ELEdBQXVFWCxTQUFTOVMsSUFBSXVULGdCQUFiLEVBQThCLEVBQTlCLENBQXZFLEdBQXlHLE9BRHRHLEdBRUgxa0IsUUFBUSxtQkFBUixFQUE2Qm1SLElBQUl5VCxVQUFqQyxJQUE2QyxNQUxoQztBQU1qQjVULG9CQUFRaFIsUUFBUSxtQkFBUixFQUE2Qm1SLElBQUl5VCxVQUFqQztBQU5TLFdBQW5CO0FBUUE7QUFDQTtBQUNBO0FBQ0QsU0FaRDtBQWFIOztBQUVELFVBQUdyakIsUUFBUXlILE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0IwVSxJQUFoQyxDQUFILEVBQXlDO0FBQ3ZDLFlBQUc3YixPQUFPbWIsV0FBUCxDQUFtQmhVLElBQW5CLENBQXdCMFUsSUFBeEIsQ0FBNkJqZ0IsTUFBaEMsRUFBdUM7QUFDckNDLFlBQUVDLElBQUYsQ0FBT2tFLE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0IwVSxJQUEvQixFQUFvQyxVQUFTelQsSUFBVCxFQUFjO0FBQ2hEckYscUJBQVNxRixJQUFULENBQWNyTSxJQUFkLENBQW1CO0FBQ2pCZ00scUJBQU9LLEtBQUswVCxRQURLO0FBRWpCaGlCLG1CQUFLbWhCLFNBQVM3UyxLQUFLMlQsUUFBZCxFQUF1QixFQUF2QixDQUZZO0FBR2pCN1QscUJBQU9sUixRQUFRLFFBQVIsRUFBa0JvUixLQUFLNFQsVUFBdkIsRUFBa0MsQ0FBbEMsSUFBcUMsS0FIM0I7QUFJakJoVSxzQkFBUWhSLFFBQVEsUUFBUixFQUFrQm9SLEtBQUs0VCxVQUF2QixFQUFrQyxDQUFsQztBQUpTLGFBQW5CO0FBTUQsV0FQRDtBQVFELFNBVEQsTUFTTztBQUNMalosbUJBQVNxRixJQUFULENBQWNyTSxJQUFkLENBQW1CO0FBQ2pCZ00sbUJBQU8vSCxPQUFPbWIsV0FBUCxDQUFtQmhVLElBQW5CLENBQXdCMFUsSUFBeEIsQ0FBNkJDLFFBRG5CO0FBRWpCaGlCLGlCQUFLbWhCLFNBQVNqYixPQUFPbWIsV0FBUCxDQUFtQmhVLElBQW5CLENBQXdCMFUsSUFBeEIsQ0FBNkJFLFFBQXRDLEVBQStDLEVBQS9DLENBRlk7QUFHakI3VCxtQkFBT2xSLFFBQVEsUUFBUixFQUFrQmdKLE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0IwVSxJQUF4QixDQUE2QkcsVUFBL0MsRUFBMEQsQ0FBMUQsSUFBNkQsS0FIbkQ7QUFJakJoVSxvQkFBUWhSLFFBQVEsUUFBUixFQUFrQmdKLE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0IwVSxJQUF4QixDQUE2QkcsVUFBL0MsRUFBMEQsQ0FBMUQ7QUFKUyxXQUFuQjtBQU1EO0FBQ0Y7O0FBRUQsVUFBR3pqQixRQUFReUgsT0FBT21iLFdBQVAsQ0FBbUJoVSxJQUFuQixDQUF3QjhVLEtBQWhDLENBQUgsRUFBMEM7QUFDeEMsWUFBR2pjLE9BQU9tYixXQUFQLENBQW1CaFUsSUFBbkIsQ0FBd0I4VSxLQUF4QixDQUE4QnJnQixNQUFqQyxFQUF3QztBQUN0Q0MsWUFBRUMsSUFBRixDQUFPa0UsT0FBT21iLFdBQVAsQ0FBbUJoVSxJQUFuQixDQUF3QjhVLEtBQS9CLEVBQXFDLFVBQVM1VCxLQUFULEVBQWU7QUFDbER0RixxQkFBU3NGLEtBQVQsQ0FBZXRNLElBQWYsQ0FBb0I7QUFDbEI5RCxvQkFBTW9RLE1BQU02VCxPQUFOLEdBQWMsR0FBZCxJQUFtQjdULE1BQU04VCxjQUFOLEdBQ3ZCOVQsTUFBTThULGNBRGlCLEdBRXZCOVQsTUFBTStULFFBRkY7QUFEWSxhQUFwQjtBQUtELFdBTkQ7QUFPRCxTQVJELE1BUU87QUFDTHJaLG1CQUFTc0YsS0FBVCxDQUFldE0sSUFBZixDQUFvQjtBQUNsQjlELGtCQUFNK0gsT0FBT21iLFdBQVAsQ0FBbUJoVSxJQUFuQixDQUF3QjhVLEtBQXhCLENBQThCQyxPQUE5QixHQUFzQyxHQUF0QyxJQUNIbGMsT0FBT21iLFdBQVAsQ0FBbUJoVSxJQUFuQixDQUF3QjhVLEtBQXhCLENBQThCRSxjQUE5QixHQUNDbmMsT0FBT21iLFdBQVAsQ0FBbUJoVSxJQUFuQixDQUF3QjhVLEtBQXhCLENBQThCRSxjQUQvQixHQUVDbmMsT0FBT21iLFdBQVAsQ0FBbUJoVSxJQUFuQixDQUF3QjhVLEtBQXhCLENBQThCRyxRQUg1QjtBQURZLFdBQXBCO0FBTUQ7QUFDRjtBQUNELGFBQU9yWixRQUFQO0FBQ0QsS0F0NkJJO0FBdTZCTDBFLG1CQUFlLHVCQUFTekgsTUFBVCxFQUFnQjtBQUM3QixVQUFJK0MsV0FBVyxFQUFDOUssTUFBSyxFQUFOLEVBQVUyUCxNQUFLLEVBQWYsRUFBbUJDLFFBQVEsRUFBQzVQLE1BQUssRUFBTixFQUEzQixFQUFzQ3lQLFVBQVMsRUFBL0MsRUFBbUR2SCxLQUFJLEVBQXZELEVBQTJEQyxJQUFHLEtBQTlELEVBQXFFQyxJQUFHLEtBQXhFLEVBQStFc0gsS0FBSSxDQUFuRixFQUFzRnZPLE1BQUssRUFBM0YsRUFBK0ZDLFFBQU8sRUFBdEcsRUFBMEdnUCxPQUFNLEVBQWhILEVBQW9IRCxNQUFLLEVBQXpILEVBQWY7QUFDQSxVQUFJaVUsWUFBWSxFQUFoQjs7QUFFQSxVQUFHOWpCLFFBQVF5SCxPQUFPc2MsSUFBZixDQUFILEVBQ0V2WixTQUFTOUssSUFBVCxHQUFnQitILE9BQU9zYyxJQUF2QjtBQUNGLFVBQUcvakIsUUFBUXlILE9BQU91YyxLQUFQLENBQWFDLFFBQXJCLENBQUgsRUFDRXpaLFNBQVMyRSxRQUFULEdBQW9CMUgsT0FBT3VjLEtBQVAsQ0FBYUMsUUFBakM7O0FBRUY7QUFDQTtBQUNBLFVBQUdqa0IsUUFBUXlILE9BQU95YyxNQUFmLENBQUgsRUFDRTFaLFNBQVM4RSxNQUFULENBQWdCNVAsSUFBaEIsR0FBdUIrSCxPQUFPeWMsTUFBOUI7O0FBRUYsVUFBR2xrQixRQUFReUgsT0FBTzBjLEVBQWYsQ0FBSCxFQUNFM1osU0FBUzNDLEVBQVQsR0FBY2hDLFdBQVc0QixPQUFPMGMsRUFBbEIsRUFBc0IxQyxPQUF0QixDQUE4QixDQUE5QixDQUFkO0FBQ0YsVUFBR3poQixRQUFReUgsT0FBTzJjLEVBQWYsQ0FBSCxFQUNFNVosU0FBUzFDLEVBQVQsR0FBY2pDLFdBQVc0QixPQUFPMmMsRUFBbEIsRUFBc0IzQyxPQUF0QixDQUE4QixDQUE5QixDQUFkOztBQUVGLFVBQUd6aEIsUUFBUXlILE9BQU80YyxHQUFmLENBQUgsRUFDRTdaLFNBQVM0RSxHQUFULEdBQWVzVCxTQUFTamIsT0FBTzRjLEdBQWhCLEVBQW9CLEVBQXBCLENBQWY7O0FBRUYsVUFBR3JrQixRQUFReUgsT0FBT3VjLEtBQVAsQ0FBYU0sT0FBckIsQ0FBSCxFQUNFOVosU0FBUzVDLEdBQVQsR0FBZW5KLFFBQVEsUUFBUixFQUFrQmdKLE9BQU91YyxLQUFQLENBQWFNLE9BQS9CLEVBQXVDLENBQXZDLENBQWYsQ0FERixLQUVLLElBQUd0a0IsUUFBUXlILE9BQU91YyxLQUFQLENBQWFPLE9BQXJCLENBQUgsRUFDSC9aLFNBQVM1QyxHQUFULEdBQWVuSixRQUFRLFFBQVIsRUFBa0JnSixPQUFPdWMsS0FBUCxDQUFhTyxPQUEvQixFQUF1QyxDQUF2QyxDQUFmOztBQUVGLFVBQUd2a0IsUUFBUXlILE9BQU8rYyxJQUFQLENBQVlDLFVBQVosQ0FBdUJDLFNBQXZCLElBQW9DamQsT0FBTytjLElBQVAsQ0FBWUMsVUFBWixDQUF1QkMsU0FBdkIsQ0FBaUNyaEIsTUFBckUsSUFBK0VvRSxPQUFPK2MsSUFBUCxDQUFZQyxVQUFaLENBQXVCQyxTQUF2QixDQUFpQyxDQUFqQyxFQUFvQ0MsU0FBM0gsQ0FBSCxFQUF5STtBQUN2SWIsb0JBQVlyYyxPQUFPK2MsSUFBUCxDQUFZQyxVQUFaLENBQXVCQyxTQUF2QixDQUFpQyxDQUFqQyxFQUFvQ0MsU0FBaEQ7QUFDRDs7QUFFRCxVQUFHM2tCLFFBQVF5SCxPQUFPbWQsWUFBZixDQUFILEVBQWdDO0FBQzlCLFlBQUk5akIsU0FBVTJHLE9BQU9tZCxZQUFQLENBQW9CQyxXQUFwQixJQUFtQ3BkLE9BQU9tZCxZQUFQLENBQW9CQyxXQUFwQixDQUFnQ3hoQixNQUFwRSxHQUE4RW9FLE9BQU9tZCxZQUFQLENBQW9CQyxXQUFsRyxHQUFnSHBkLE9BQU9tZCxZQUFwSTtBQUNBdGhCLFVBQUVDLElBQUYsQ0FBT3pDLE1BQVAsRUFBYyxVQUFTeU8sS0FBVCxFQUFlO0FBQzNCL0UsbUJBQVMxSixNQUFULENBQWdCMEMsSUFBaEIsQ0FBcUI7QUFDbkJnTSxtQkFBT0QsTUFBTXdVLElBRE07QUFFbkJ4aUIsaUJBQUttaEIsU0FBU29CLFNBQVQsRUFBbUIsRUFBbkIsQ0FGYztBQUduQm5VLG1CQUFPbFIsUUFBUSxtQkFBUixFQUE2QjhRLE1BQU11VixNQUFuQyxJQUEyQyxLQUgvQjtBQUluQnJWLG9CQUFRaFIsUUFBUSxtQkFBUixFQUE2QjhRLE1BQU11VixNQUFuQztBQUpXLFdBQXJCO0FBTUQsU0FQRDtBQVFEOztBQUVELFVBQUc5a0IsUUFBUXlILE9BQU9zZCxJQUFmLENBQUgsRUFBd0I7QUFDdEIsWUFBSWxrQixPQUFRNEcsT0FBT3NkLElBQVAsQ0FBWUMsR0FBWixJQUFtQnZkLE9BQU9zZCxJQUFQLENBQVlDLEdBQVosQ0FBZ0IzaEIsTUFBcEMsR0FBOENvRSxPQUFPc2QsSUFBUCxDQUFZQyxHQUExRCxHQUFnRXZkLE9BQU9zZCxJQUFsRjtBQUNBemhCLFVBQUVDLElBQUYsQ0FBTzFDLElBQVAsRUFBWSxVQUFTK08sR0FBVCxFQUFhO0FBQ3ZCcEYsbUJBQVMzSixJQUFULENBQWMyQyxJQUFkLENBQW1CO0FBQ2pCZ00sbUJBQU9JLElBQUltVSxJQUFKLEdBQVMsSUFBVCxHQUFjblUsSUFBSXFWLElBQWxCLEdBQXVCLEdBRGI7QUFFakIxakIsaUJBQUtxTyxJQUFJc1YsR0FBSixJQUFXLFNBQVgsR0FBdUIsQ0FBdkIsR0FBMkJ4QyxTQUFTOVMsSUFBSXVWLElBQWIsRUFBa0IsRUFBbEIsQ0FGZjtBQUdqQnhWLG1CQUFPQyxJQUFJc1YsR0FBSixJQUFXLFNBQVgsR0FDSHRWLElBQUlzVixHQUFKLEdBQVEsR0FBUixHQUFZem1CLFFBQVEsbUJBQVIsRUFBNkJtUixJQUFJa1YsTUFBakMsQ0FBWixHQUFxRCxNQUFyRCxHQUE0RCxPQUE1RCxHQUFvRXBDLFNBQVM5UyxJQUFJdVYsSUFBSixHQUFTLEVBQVQsR0FBWSxFQUFyQixFQUF3QixFQUF4QixDQUFwRSxHQUFnRyxPQUQ3RixHQUVIdlYsSUFBSXNWLEdBQUosR0FBUSxHQUFSLEdBQVl6bUIsUUFBUSxtQkFBUixFQUE2Qm1SLElBQUlrVixNQUFqQyxDQUFaLEdBQXFELE1BTHhDO0FBTWpCclYsb0JBQVFoUixRQUFRLG1CQUFSLEVBQTZCbVIsSUFBSWtWLE1BQWpDO0FBTlMsV0FBbkI7QUFRRCxTQVREO0FBVUQ7O0FBRUQsVUFBRzlrQixRQUFReUgsT0FBTzJkLEtBQWYsQ0FBSCxFQUF5QjtBQUN2QixZQUFJdlYsT0FBUXBJLE9BQU8yZCxLQUFQLENBQWFDLElBQWIsSUFBcUI1ZCxPQUFPMmQsS0FBUCxDQUFhQyxJQUFiLENBQWtCaGlCLE1BQXhDLEdBQWtEb0UsT0FBTzJkLEtBQVAsQ0FBYUMsSUFBL0QsR0FBc0U1ZCxPQUFPMmQsS0FBeEY7QUFDQTloQixVQUFFQyxJQUFGLENBQU9zTSxJQUFQLEVBQVksVUFBU0EsSUFBVCxFQUFjO0FBQ3hCckYsbUJBQVNxRixJQUFULENBQWNyTSxJQUFkLENBQW1CO0FBQ2pCZ00sbUJBQU9LLEtBQUtrVSxJQURLO0FBRWpCeGlCLGlCQUFLbWhCLFNBQVM3UyxLQUFLc1YsSUFBZCxFQUFtQixFQUFuQixDQUZZO0FBR2pCeFYsbUJBQU8sU0FBT0UsS0FBS2lWLE1BQVosR0FBbUIsTUFBbkIsR0FBMEJqVixLQUFLcVYsR0FIckI7QUFJakJ6VixvQkFBUUksS0FBS2lWO0FBSkksV0FBbkI7QUFNRCxTQVBEO0FBUUQ7O0FBRUQsVUFBRzlrQixRQUFReUgsT0FBTzZkLE1BQWYsQ0FBSCxFQUEwQjtBQUN4QixZQUFJeFYsUUFBU3JJLE9BQU82ZCxNQUFQLENBQWNDLEtBQWQsSUFBdUI5ZCxPQUFPNmQsTUFBUCxDQUFjQyxLQUFkLENBQW9CbGlCLE1BQTVDLEdBQXNEb0UsT0FBTzZkLE1BQVAsQ0FBY0MsS0FBcEUsR0FBNEU5ZCxPQUFPNmQsTUFBL0Y7QUFDRWhpQixVQUFFQyxJQUFGLENBQU91TSxLQUFQLEVBQWEsVUFBU0EsS0FBVCxFQUFlO0FBQzFCdEYsbUJBQVNzRixLQUFULENBQWV0TSxJQUFmLENBQW9CO0FBQ2xCOUQsa0JBQU1vUSxNQUFNaVU7QUFETSxXQUFwQjtBQUdELFNBSkQ7QUFLSDtBQUNELGFBQU92WixRQUFQO0FBQ0QsS0FyL0JJO0FBcy9CTDZELGVBQVcsbUJBQVNtWCxPQUFULEVBQWlCO0FBQzFCLFVBQUlDLFlBQVksQ0FDZCxFQUFDQyxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFEYyxFQUVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQUZjLEVBR2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFIYyxFQUlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBSmMsRUFLZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQUxjLEVBTWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFOYyxFQU9kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBUGMsRUFRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQVJjLEVBU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFUYyxFQVVkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBVmMsRUFXZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQVhjLEVBWWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFaYyxFQWFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBYmMsRUFjZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWRjLEVBZWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBZmMsRUFnQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaEJjLEVBaUJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpCYyxFQWtCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsQmMsRUFtQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbkJjLEVBb0JkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBCYyxFQXFCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyQmMsRUFzQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdEJjLEVBdUJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZCYyxFQXdCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4QmMsRUF5QmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6QmMsRUEwQmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExQmMsRUEyQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBM0JjLEVBNEJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVCYyxFQTZCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3QmMsRUE4QmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOUJjLEVBK0JkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQS9CYyxFQWdDZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFoQ2MsRUFpQ2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqQ2MsRUFrQ2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsQ2MsRUFtQ2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbkNjLEVBb0NkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcENjLEVBcUNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBckNjLEVBc0NkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdENjLEVBdUNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdkNjLEVBd0NkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeENjLEVBeUNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBekNjLEVBMENkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMUNjLEVBMkNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0NjLEVBNENkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNUNjLEVBNkNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN0NjLEVBOENkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlDYyxFQStDZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvQ2MsRUFnRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoRGMsRUFpRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqRGMsRUFrRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsRGMsRUFtRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuRGMsRUFvRGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcERjLEVBcURkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJEYyxFQXNEZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXREYyxFQXVEZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZEYyxFQXdEZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4RGMsRUF5RGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekRjLEVBMERkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMURjLEVBMkRkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0RjLEVBNERkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVEYyxFQTZEZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3RGMsRUE4RGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5RGMsRUErRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvRGMsRUFnRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoRWMsRUFpRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqRWMsRUFrRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsRWMsRUFtRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuRWMsRUFvRWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcEVjLEVBcUVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJFYyxFQXNFZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRFYyxFQXVFZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZFYyxFQXdFZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4RWMsRUF5RWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekVjLEVBMEVkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMUVjLEVBMkVkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0VjLEVBNEVkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNUVjLEVBNkVkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN0VjLEVBOEVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlFYyxFQStFZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvRWMsRUFnRmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFoRmMsRUFpRmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFqRmMsRUFrRmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbEZjLEVBbUZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5GYyxFQW9GZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBGYyxFQXFGZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJGYyxFQXNGZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRGYyxFQXVGZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZGYyxFQXdGZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4RmMsRUF5RmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekZjLEVBMEZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMUZjLEVBMkZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0ZjLEVBNEZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNUZjLEVBNkZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN0ZjLEVBOEZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOUZjLEVBK0ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL0ZjLEVBZ0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaEdjLEVBaUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBakdjLEVBa0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbEdjLEVBbUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbkdjLEVBb0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcEdjLEVBcUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBckdjLEVBc0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdEdjLEVBdUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdkdjLEVBd0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeEdjLEVBeUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBekdjLEVBMEdkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTFHYyxFQTJHZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEzR2MsRUE0R2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1R2MsRUE2R2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3R2MsRUE4R2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOUdjLEVBK0dkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQS9HYyxFQWdIZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWhIYyxFQWlIZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWpIYyxFQWtIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsSGMsRUFtSGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbkhjLEVBb0hkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBIYyxFQXFIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFySGMsRUFzSGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdEhjLEVBdUhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZIYyxFQXdIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4SGMsRUF5SGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekhjLEVBMEhkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMUhjLEVBMkhkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM0hjLEVBNEhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVIYyxFQTZIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3SGMsRUE4SGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5SGMsRUErSGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvSGMsRUFnSWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoSWMsRUFpSWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqSWMsRUFrSWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbEljLEVBbUlkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5JYyxFQW9JZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXBJYyxFQXFJZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXJJYyxFQXNJZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0SWMsRUF1SWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdkljLEVBd0lkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXhJYyxFQXlJZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF6SWMsRUEwSWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMUljLEVBMklkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNJYyxFQTRJZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTVJYyxFQTZJZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTdJYyxFQThJZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlJYyxFQStJZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9JYyxFQWdKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWhKYyxFQWlKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWpKYyxFQWtKZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxKYyxFQW1KZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5KYyxFQW9KZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXBKYyxFQXFKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXJKYyxFQXNKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXRKYyxFQXVKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZKYyxFQXdKZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4SmMsRUF5SmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekpjLEVBMEpkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMUpjLEVBMkpkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM0pjLEVBNEpkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNUpjLEVBNkpkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN0pjLEVBOEpkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOUpjLEVBK0pkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL0pjLEVBZ0tkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaEtjLEVBaUtkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaktjLEVBa0tkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbEtjLEVBbUtkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbktjLEVBb0tkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcEtjLEVBcUtkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcktjLEVBc0tkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdEtjLEVBdUtkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZLYyxFQXdLZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4S2MsRUF5S2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6S2MsRUEwS2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExS2MsRUEyS2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBM0tjLEVBNEtkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVLYyxFQTZLZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3S2MsRUE4S2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOUtjLEVBK0tkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBL0tjLEVBZ0xkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBaExjLEVBaUxkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBakxjLEVBa0xkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbExjLEVBbUxkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5MYyxFQW9MZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwTGMsRUFxTGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFyTGMsRUFzTGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF0TGMsRUF1TGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2TGMsRUF3TGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4TGMsRUF5TGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6TGMsRUEwTGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMUxjLEVBMkxkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNMYyxFQTRMZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1TGMsRUE2TGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN0xjLEVBOExkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlMYyxFQStMZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvTGMsRUFnTWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaE1jLEVBaU1kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpNYyxFQWtNZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxNYyxFQW1NZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5NYyxFQW9NZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBNYyxFQXFNZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJNYyxFQXNNZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0TWMsRUF1TWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdk1jLEVBd01kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeE1jLEVBeU1kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBek1jLEVBME1kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMU1jLEVBMk1kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM01jLEVBNE1kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVNYyxFQTZNZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3TWMsRUE4TWQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUE5TWMsRUErTWQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUEvTWMsRUFnTmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaE5jLEVBaU5kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpOYyxFQWtOZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsTmMsRUFtTmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbk5jLEVBb05kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBOYyxFQXFOZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyTmMsRUFzTmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdE5jLEVBdU5kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZOYyxFQXdOZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4TmMsRUF5TmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBek5jLEVBME5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMU5jLEVBMk5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM05jLEVBNE5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNU5jLEVBNk5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN05jLEVBOE5kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOU5jLEVBK05kLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEdBQWhCLEVBL05jLEVBZ09kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWhPYyxFQWlPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFqT2MsRUFrT2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbE9jLEVBbU9kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5PYyxFQW9PZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwT2MsRUFxT2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBck9jLEVBc09kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRPYyxFQXVPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2T2MsRUF3T2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBeE9jLEVBeU9kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXpPYyxFQTBPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUExT2MsRUEyT2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBM09jLEVBNE9kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNU9jLEVBNk9kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN09jLEVBOE9kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlPYyxFQStPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvT2MsRUFnUGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFBjLEVBaVBkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpQYyxFQWtQZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWxQYyxFQW1QZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5QYyxFQW9QZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwUGMsRUFxUGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBclBjLEVBc1BkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRQYyxFQXVQZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2UGMsRUF3UGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF4UGMsRUF5UGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6UGMsRUEwUGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUGMsRUEyUGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUGMsRUE0UGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBNVBjLEVBNlBkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTdQYyxFQThQZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTlQYyxFQStQZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQS9QYyxFQWdRZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFoUWMsRUFpUWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBalFjLEVBa1FkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBbFFjLEVBbVFkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBblFjLEVBb1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFFjLEVBcVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclFjLEVBc1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFFjLEVBdVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlFjLEVBd1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFFjLEVBeVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFJjLEVBdVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlJjLEVBd1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFJjLEVBeVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelJjLEVBMFJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVJjLEVBMlJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1JjLEVBNFJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNVJjLEVBNlJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN1JjLEVBOFJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlSYyxFQStSZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvUmMsRUFnU2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFoU2MsRUFpU2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFqU2MsRUFrU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsU2MsRUFtU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuU2MsRUFvU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwU2MsRUFxU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyU2MsRUFzU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0U2MsRUF1U2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2U2MsRUF3U2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4U2MsRUF5U2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6U2MsRUEwU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExU2MsRUEyU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzU2MsRUE0U2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBNVNjLEVBNlNkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTdTYyxFQThTZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlTYyxFQStTZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9TYyxFQWdUZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWhUYyxFQWlUZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWpUYyxFQWtUZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxUYyxFQW1UZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5UYyxFQW9UZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwVGMsRUFxVGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBclRjLEVBc1RkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRUYyxFQXVUZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2VGMsRUF3VGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF4VGMsRUF5VGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6VGMsRUEwVGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMVRjLEVBMlRkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNUYyxFQTRUZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1VGMsRUE2VGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN1RjLEVBOFRkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlUYyxFQStUZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvVGMsRUFnVWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFVjLEVBaVVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpVYyxFQWtVZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWxVYyxFQW1VZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5VYyxFQW9VZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwVWMsRUFxVWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBclVjLEVBc1VkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRVYyxFQXVVZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2VWMsRUF3VWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4VWMsRUF5VWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6VWMsRUEwVWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMVVjLEVBMlVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNVYyxFQTRVZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1VWMsRUE2VWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN1VjLEVBOFVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlVYyxFQStVZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvVWMsRUFnVmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFZjLEVBaVZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpWYyxFQWtWZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsVmMsRUFtVmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBblZjLEVBb1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFZjLEVBcVZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclZjLEVBc1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFZjLEVBdVZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlZjLEVBd1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFZjLEVBeVZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelZjLEVBMFZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMVZjLEVBMlZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM1ZjLEVBNFZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNVZjLEVBNlZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN1ZjLEVBOFZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVZjLEVBK1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1ZjLEVBZ1dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFdjLEVBaVdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaldjLEVBa1dkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWxXYyxFQW1XZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuV2MsRUFvV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwV2MsRUFxV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyV2MsRUFzV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0V2MsRUF1V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2V2MsRUF3V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4V2MsRUF5V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6V2MsRUEwV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExV2MsRUEyV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzV2MsRUE0V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1V2MsRUE2V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3V2MsRUE4V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5V2MsRUErV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvV2MsRUFnWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFhjLEVBaVhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpYYyxFQWtYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsWGMsRUFtWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBblhjLEVBb1hkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBYYyxFQXFYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyWGMsRUFzWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdFhjLEVBdVhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZYYyxFQXdYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4WGMsRUF5WGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBelhjLEVBMFhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTFYYyxFQTJYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEzWGMsRUE0WGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBNVhjLEVBNlhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTdYYyxFQThYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE5WGMsRUErWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBL1hjLEVBZ1lkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFljLEVBaVlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalljLEVBa1lkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFljLEVBbVlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblljLEVBb1lkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFljLEVBcVlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclljLEVBc1lkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRZYyxFQXVZZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2WWMsRUF3WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4WWMsRUF5WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6WWMsRUEwWWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExWWMsRUEyWWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzWWMsRUE0WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1WWMsRUE2WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3WWMsRUE4WWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOVljLEVBK1lkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQS9ZYyxFQWdaZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWhaYyxFQWlaZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWpaYyxFQWtaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxaYyxFQW1aZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5aYyxFQW9aZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBaYyxFQXFaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJaYyxFQXNaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRaYyxFQXVaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZaYyxFQXdaZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4WmMsRUF5WmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBelpjLEVBMFpkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTFaYyxFQTJaZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEzWmMsRUE0WmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1WmMsRUE2WmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3WmMsRUE4WmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5WmMsRUErWmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvWmMsRUFnYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoYWMsRUFpYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqYWMsRUFrYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsYWMsRUFtYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuYWMsRUFvYWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGFjLEVBcWFkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJhYyxFQXNhZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0YWMsRUF1YWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdmFjLEVBd2FkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXhhYyxFQXlhZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF6YWMsRUEwYWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMWFjLEVBMmFkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNhYyxFQTRhZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1YWMsRUE2YWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN2FjLEVBOGFkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlhYyxFQSthZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvYWMsRUFnYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoYmMsRUFpYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqYmMsRUFrYmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFsYmMsRUFtYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuYmMsRUFvYmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGJjLEVBcWJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcmJjLEVBc2JkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdGJjLEVBdWJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdmJjLEVBd2JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeGJjLEVBeWJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBemJjLEVBMGJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMWJjLEVBMmJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM2JjLEVBNGJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTViYyxFQTZiZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3YmMsRUE4YmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5YmMsRUErYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvYmMsRUFnY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoY2MsRUFpY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqY2MsRUFrY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsY2MsRUFtY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuY2MsRUFvY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwY2MsRUFxY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyY2MsRUFzY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0Y2MsRUF1Y2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2Y2MsRUF3Y2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4Y2MsRUF5Y2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6Y2MsRUEwY2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExY2MsRUEyY2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzY2MsRUE0Y2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1Y2MsRUE2Y2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN2NjLEVBOGNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOWNjLEVBK2NkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEdBQWhCLEVBL2NjLEVBZ2RkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBaGRjLEVBaWRkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEdBQWhCLEVBamRjLEVBa2RkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWxkYyxFQW1kZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5kYyxFQW9kZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwZGMsRUFxZGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFyZGMsRUFzZGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF0ZGMsRUF1ZGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZGMsRUF3ZGQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUF4ZGMsRUF5ZGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6ZGMsRUEwZGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMWRjLEVBMmRkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNkYyxFQTRkZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVkYyxFQTZkZCxFQUFDRCxHQUFHLFdBQUosRUFBaUJDLEdBQUcsR0FBcEIsRUE3ZGMsRUE4ZGQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUE5ZGMsRUErZGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBL2RjLEVBZ2VkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWhlYyxFQWllZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWplYyxFQWtlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWxlYyxFQW1lZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQW5lYyxFQW9lZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBlYyxFQXFlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXJlYyxFQXNlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXRlYyxFQXVlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZlYyxFQXdlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhlYyxFQXllZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXplYyxFQTBlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFlYyxFQTJlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTNlYyxFQTRlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVlYyxFQTZlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTdlYyxFQThlZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE5ZWMsRUErZWQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEvZWMsRUFnZmQsRUFBQ0QsR0FBRyxNQUFKLEVBQVlDLEdBQUcsR0FBZixFQWhmYyxFQWlmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWpmYyxFQWtmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWxmYyxFQW1mZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuZmMsRUFvZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGZjLEVBcWZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJmYyxFQXNmZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0ZmMsRUF1ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBcmlCLFFBQUVDLElBQUYsQ0FBT2tpQixTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRN2YsT0FBUixDQUFnQmlnQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUTlmLE9BQVIsQ0FBZ0JxVixPQUFPNkssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUEzL0NJLEdBQVA7QUE2L0NELENBaGdERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyelNsaWRlcidcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsO1xudmFyIHJlc2V0Q2hhcnQgPSAxMDA7XG52YXIgdGltZW91dCA9IG51bGw7IC8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5CcmV3U2VydmljZSA9IEJyZXdTZXJ2aWNlO1xuJHNjb3BlLnNpdGUgPSB7aHR0cHM6IEJvb2xlYW4oZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnMzInLFxuICBzc2lkOiAnJyxcbiAgc3NpZF9wYXNzOiAnJyxcbiAgaG9zdG5hbWU6ICdiYmVzcCcsXG4gIGFyZHVpbm9fcGFzczogJ2JiYWRtaW4nLFxuICBhdXRvY29ubmVjdDogZmFsc2UgIFxufTtcbiRzY29wZS5tb2RhbEluZm8gPSB7fTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5vcGVuSW5mb01vZGFsID0gZnVuY3Rpb24gKGFyZHVpbm8pIHtcbiAgJHNjb3BlLm1vZGFsSW5mbyA9IGFyZHVpbm87XG4gICQoJyNhcmR1aW5vLWluZm8nKS5tb2RhbCgndG9nZ2xlJyk7ICBcbn07XG4gIFxuJHNjb3BlLnJlcGxhY2VLZXR0bGVzV2l0aFBpbnMgPSBmdW5jdGlvbiAoYXJkdWlubykge1xuICBpZiAoYXJkdWluby5pbmZvICYmIGFyZHVpbm8uaW5mby5waW5zICYmIGFyZHVpbm8uaW5mby5waW5zLmxlbmd0aCkge1xuICAgICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgXy5lYWNoKGFyZHVpbm8uaW5mby5waW5zLCBwaW4gPT4ge1xuICAgICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHBpbi5uYW1lXG4gICAgICAgICwgaWQ6IG51bGxcbiAgICAgICAgLCB0eXBlOiAkc2NvcGUua2V0dGxlVHlwZXNbNF0udHlwZVxuICAgICAgICAsIGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLCBzdGlja3k6IGZhbHNlXG4gICAgICAgICwgaGVhdGVyOiB7IHBpbjogJ0Q2JywgcnVubmluZzogZmFsc2UsIGF1dG86IGZhbHNlLCBwd206IGZhbHNlLCBkdXR5Q3ljbGU6IDEwMCwgc2tldGNoOiBmYWxzZSB9XG4gICAgICAgICwgcHVtcDogeyBwaW46ICdENycsIHJ1bm5pbmc6IGZhbHNlLCBhdXRvOiBmYWxzZSwgcHdtOiBmYWxzZSwgZHV0eUN5Y2xlOiAxMDAsIHNrZXRjaDogZmFsc2UgfVxuICAgICAgICAsIHRlbXA6IHsgcGluOiBwaW4ucGluLCB2Y2M6ICcnLCBpbmRleDogJycsIHR5cGU6IHBpbi50eXBlLCBhZGM6IGZhbHNlLCBoaXQ6IGZhbHNlLCBpZnR0dDogZmFsc2UsIGN1cnJlbnQ6IDAsIG1lYXN1cmVkOiAwLCBwcmV2aW91czogMCwgYWRqdXN0OiAwLCB0YXJnZXQ6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS50YXJnZXQsIGRpZmY6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS5kaWZmLCByYXc6IDAsIHZvbHRzOiAwIH1cbiAgICAgICAgLCB2YWx1ZXM6IFtdXG4gICAgICAgICwgdGltZXJzOiBbXVxuICAgICAgICAsIGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSwgeyB2YWx1ZTogMCwgbWluOiAwLCBtYXg6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS50YXJnZXQgKyAkc2NvcGUua2V0dGxlVHlwZXNbNF0uZGlmZiB9KVxuICAgICAgICAsIGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLCBtZXNzYWdlOiB7IHR5cGU6ICdlcnJvcicsIG1lc3NhZ2U6ICcnLCB2ZXJzaW9uOiAnJywgY291bnQ6IDAsIGxvY2F0aW9uOiAnJyB9XG4gICAgICAgICwgbm90aWZ5OiB7IHNsYWNrOiBmYWxzZSB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufTtcbiAgXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYobC5sZW5ndGgpXG4gICAgcmV0dXJuIGxbbC5sZW5ndGgtMV0uaGV4O1xuICByZXR1cm4gJyc7XG59O1xuXG4vL2RlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4kc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnKSB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuaWYgKCEkc2NvcGUuc2V0dGluZ3MuYXBwKVxuICAkc2NvcGUuc2V0dGluZ3MuYXBwID0geyBlbWFpbDogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnIH07XG4vLyBnZW5lcmFsIGNoZWNrIGFuZCB1cGRhdGVcbmlmKCEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbClcbiAgcmV0dXJuICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0fSk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcblxuJHNjb3BlLm9wZW5Ta2V0Y2hlcyA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzZXR0aW5nc01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgJCgnI3NrZXRjaGVzTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59O1xuXG4kc2NvcGUuY2hhbmdlQXJkdWlubyA9IGZ1bmN0aW9uIChrZXR0bGUpIHtcbiAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgfVxufTtcbi8vIGNoZWNrIGtldHRsZSB0eXBlIHBvcnRzXG5fLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnMzInKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLnRvdWNoID0gWzQsMCwyLDE1LDEzLDEyLDE0LDI3LDMzLDMyXTtcbiAgfSBlbHNlIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKSB7XG4gICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMTY7XG4gIH1cbn0pO1xuICBcbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGJvYXJkOiAnJyxcbiAgICAgICAgUlNTSTogZmFsc2UsXG4gICAgICAgIGFuYWxvZzogMTEsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHsgZXJyb3I6ICcnLCBkdDogJycsIG1lc3NhZ2U6ICcnIH0sXG4gICAgICAgIGluZm86IHt9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mbycpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5CcmV3QmVuY2gpe1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDAgfHwgYXJkdWluby5ib2FyZC5pbmRleE9mKCdOb2RlTUNVXzMyUycpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0dldHRpbmcgSW5mby4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvLWV4dCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IGluZm87XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGFyZHVpbm8uaW5mbyA9IHt9O1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5wa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAncmVib290JylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gJyc7XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3QgU3VjY2VzcywgdHJ5IGNvbm5lY3RpbmcgaW4gYSBmZXcgc2Vjb25kcy4nO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYocGtnLnZlcnNpb24gPCA0LjIpXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ1VwZ3JhZGUgdG8gc3VwcG9ydCByZWJvb3QnO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBjbGVhcjogKCkgPT4geyBcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsgPSB7IHVzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46ICcnLCBzdGF0dXM6ICcnLCBwbHVnczogW10gfTtcbiAgICB9LFxuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9IGVsc2UgaWYocmVzcG9uc2UuZXJyb3JfY29kZSAmJiByZXNwb25zZS5tc2cpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShyZXNwb25zZS5tc2cpOyAgXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4ocGx1Zy5zdGF0dXMpKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaWZ0dHQgPSB7XG4gICAgY2xlYXI6ICgpID0+IHsgXG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQgPSB7IHVybDogJycsIG1ldGhvZDogJ0dFVCcsIGF1dGg6IHsga2V5OiAnJywgdmFsdWU6ICcnIH0sIHN0YXR1czogJycgfTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLmNvbm5lY3QoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gIH07XG4gIFxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG4gIFxuICAkc2NvcGUuaGVhdElzT24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydoZWF0ZXInOiB7J3J1bm5pbmcnOiB0cnVlfX0pLmxlbmd0aCk7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihhcmR1aW5vLCBwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZSBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vKSl7XG4gICAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8sIHRydWUpID09ICc4MjY2JylcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0EnLCdHUElPJykucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwaW47XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYXBwID0ge1xuICAgIGNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpICYmXG4gICAgICAgIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmFwcC5hcGlfa2V5KSAmJlxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwID0gZGVmYXVsdFNldHRpbmdzLmFwcDtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgIGlmKCFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuZW1haWwpIHx8ICFCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFwcCgpLmF1dGgoKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZihCb29sZWFuKGZvcm1hdHRlZF9jb250ZW50KSl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZihCb29sZWFuKGpzb25PYmouUmVjaXBlcykgJiYgQm9vbGVhbihqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZihCb29sZWFuKGpzb25PYmouU2VsZWN0aW9ucykgJiYgQm9vbGVhbihqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoQm9vbGVhbihqc29uT2JqLlJFQ0lQRVMpICYmIEJvb2xlYW4oanNvbk9iai5SRUNJUEVTLlJFQ0lQRSkpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5vZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5mZykpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoe1xuICAgICAgYW5pbWF0ZWQ6ICdmYWRlJyxcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIGh0bWw6IHRydWVcbiAgICB9KTtcbiAgICBpZigkKCcjZ2l0Y29tbWl0IGEnKS50ZXh0KCkgIT0gJ2dpdF9jb21taXQnKXtcbiAgICAgICQoJyNnaXRjb21taXQnKS5zaG93KCk7XG4gICAgfVxuICAgIFxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGltZXJzKSAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24peyAgICBcbiAgICAgIHZhciBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4oZXJyLnN0YXR1c1RleHQpKVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKG1lc3NhZ2UpKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICBcbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5jdXJyZW50KSlcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLCAyKTtcbiAgICBcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpLCAwKTsgICAgXG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmIChrZXR0bGUudGVtcC50eXBlICE9ICdCTVAxODAnICYmXG4gICAgICBrZXR0bGUudGVtcC50eXBlICE9ICdCTVAyODAnICYmXG4gICAgICAha2V0dGxlLnRlbXAudm9sdHMgJiZcbiAgICAgICFrZXR0bGUudGVtcC5yYXcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnICYmXG4gICAgICByZXNwb25zZS50ZW1wID09IC0xMjcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHkgYXMgYSBwZXJjZW50XG4gICAgLy9Tb2lsTW9pc3R1cmVEIGhhcyBtb2lzdHVyZSBhcyBhIHBlcmNlbnRcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnBlcmNlbnQsMCk7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UubW9pc3R1cmUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLm1vaXN0dXJlLDApO1xuICAgIH1cbiAgICAvLyBCTVAgc2Vuc29ycyBoYXZlIGFsdGl0dWRlIGFuZCBwcmVzc3VyZVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuYWx0aXR1ZGUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLmFsdGl0dWRlID0gcmVzcG9uc2UuYWx0aXR1ZGU7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucHJlc3N1cmUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgLy8gcGFzY2FsIHRvIGluY2hlcyBvZiBtZXJjdXJ5XG4gICAgICBrZXR0bGUucHJlc3N1cmUgPSByZXNwb25zZS5wcmVzc3VyZSAvIDMzODYuMzg5O1xuICAgIH1cbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLmNvMl9wcG0gIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgLy8gcGFzY2FsIHRvIGluY2hlcyBvZiBtZXJjdXJ5XG4gICAgICBrZXR0bGUuY28yX3BwbSA9IHJlc3BvbnNlLmNvMl9wcG07XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaC1hbHQnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgIHZhciBrO1xuICAgIHZhciBoZWF0SXNPbiA9ICRzY29wZS5oZWF0SXNPbigpO1xuICAgIFxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgIGlmIChpdGVtID09ICdoZWF0JyAmJiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5oZWF0U2FmZXR5ICYmIGhlYXRJc09uKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ0EgaGVhdGVyIGlzIGFscmVhZHkgcnVubmluZy4nLCBrZXR0bGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrXG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5zZW5zb3JzKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMgPSB7fTtcbiAgICAvLyBhcHBlbmQgZXNwIHR5cGVcbiAgICBpZihza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSlcbiAgICAgIHNrZXRjaE5hbWUgKz0gJHNjb3BlLmVzcC50eXBlO1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWlubyA/IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSA6ICdEZWZhdWx0JztcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOiBhcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICB0eXBlOiBza2V0Y2hOYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIHBpbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZSxcbiAgICAgICAgICBiZjogKHNrZXRjaE5hbWUuaW5kZXhPZignQkYnKSAhPT0gLTEpID8gdHJ1ZSA6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgQm9vbGVhbihrZXR0bGUudGVtcC5hZGp1c3QpKSA/ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgaWYoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmICRzY29wZS5lc3AuYXV0b2Nvbm5lY3Qpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEF1dG9Db25uZWN0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigoc2tldGNoTmFtZS5pbmRleE9mKCdFU1AnKSAhPT0gLTEgfHwgQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKSAmJlxuICAgICAgICAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKSAmJlxuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2JlZWdlZS10b2t5by9ESFRlc3AnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgXCJESFRlc3AuaFwiJyk7XG4gICAgICB9IGVsc2UgaWYoIUJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJlxuICAgICAgICAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKSAmJlxuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVGxpYi0xLjIuOS56aXAnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuRFMxOEIyMCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxPbmVXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuQk1QIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignQk1QMTgwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuQk1QIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignQk1QMjgwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0JNUDI4MC5oPicpO1xuICAgICAgfVxuICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDAgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hZGFmcnVpdC9BZGFmcnVpdF9BRFMxWDE1Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpO1xuICAgICAgfVxuICAgICAgLy8gYWRkIHRoZSBhY3Rpb25zIGNvbW1hbmRcbiAgICAgIHZhciBrZXR0bGVUeXBlID0ga2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmIChrZXR0bGUudGVtcC52Y2MpXG4gICAgICAgIGtldHRsZVR5cGUgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgXG4gICAgICBpZiAoa2V0dGxlLnRlbXAuaW5kZXgpIGtldHRsZVR5cGUgKz0gJy0nICsga2V0dGxlLnRlbXAuaW5kZXg7ICAgICAgXG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBhY3Rpb25zQ29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGRlbGF5KDUwMCk7Jyk7XG4gICAgICAvLyB1c2VkIGZvciBpbmZvIGVuZHBvaW50XG4gICAgICBpZiAoY3VycmVudFNrZXRjaC5waW5zLmxlbmd0aCkge1xuICAgICAgICBjdXJyZW50U2tldGNoLnBpbnMucHVzaCgnIHBpbnMgKz0gXCIsIHtcXFxcXCJuYW1lXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJyArIGtldHRsZS5uYW1lICsgJ1wiKSArIFwiXFxcXFwiLFxcXFxcInBpblxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicgKyBrZXR0bGUudGVtcC5waW4gKyAnXCIpICsgXCJcXFxcXCIsXFxcXFwidHlwZVxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicgKyBrZXR0bGVUeXBlICsgJ1wiKSArIFwiXFxcXFwiLFxcXFxcImFkanVzdFxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicgKyBhZGp1c3QgKyAnXCIpICsgXCJcXFxcXCJ9XCI7Jyk7ICAgICAgICBcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gucGlucy5wdXNoKCcgcGlucyArPSBcIntcXFxcXCJuYW1lXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJytrZXR0bGUubmFtZSsnXCIpICsgXCJcXFxcXCIsXFxcXFwicGluXFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSArIFwiXFxcXFwiLFxcXFxcInR5cGVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZVR5cGUrJ1wiKSArIFwiXFxcXFwiLFxcXFxcImFkanVzdFxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicrYWRqdXN0KydcIikgKyBcIlxcXFxcIn1cIjsnKTsgICAgICAgIFxuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGtldHRsZS5wZXJjZW50KSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNQZXJjZW50Q29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnLUh1bWlkaXR5XCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTsgICAgICAgIFxuICAgICAgfVxuICAgICAgXG4gICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnK0Jvb2xlYW4oa2V0dGxlLm5vdGlmeS5zbGFjaykrJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnK0Jvb2xlYW4oa2V0dGxlLm5vdGlmeS5zbGFjaykrJyk7Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBpZiAoc2tldGNoLnRyaWdnZXJzIHx8IHNrZXRjaC5iZikge1xuICAgICAgICBpZiAoc2tldGNoLnR5cGUuaW5kZXhPZignTTUnKSA9PT0gLTEpIHtcbiAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCB0ZW1wID0gMC4wMDsnKTtcbiAgICAgICAgICBpZiAoc2tldGNoLmJmKSB7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCBhbWJpZW50ID0gMC4wMDsnKTtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGh1bWlkaXR5ID0gMC4wMDsnKTtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2NvbnN0IFN0cmluZyBlcXVpcG1lbnRfbmFtZSA9IFwiJyskc2NvcGUuc2V0dGluZ3MuYmYubmFtZSsnXCI7Jyk7ICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgYXV0b0NvbW1hbmQgXG4gICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmIChza2V0Y2guYmYgJiYgc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zUGVyY2VudENvbW1hbmQoJykgIT09IC0xICYmXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignaHVtaWRpdHknKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnLCAnaHVtaWRpdHkgPSBhY3Rpb25zUGVyY2VudENvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2guYmYgJiYgc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdhbWJpZW50JykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAvLyBCRiBsb2dpY1xuICAgICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAnYW1iaWVudCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEFsbCBvdGhlciBsb2dpY1xuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywgJ3RlbXAgPSBhY3Rpb25zQ29tbWFuZCgnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnBpbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIHBpbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW1BJTlNdJywgcGlucy5sZW5ndGggPyBwaW5zLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtIRUFERVJTXScsIGhlYWRlcnMubGVuZ3RoID8gaGVhZGVycy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtWRVJTSU9OXFxdL2csICRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1RQTElOS19DT05ORUNUSU9OXFxdL2csIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbU0xBQ0tfQ09OTkVDVElPTlxcXS9nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayk7XG5cbiAgICAgICAgLy8gRVNQIHZhcmlhYmxlc1xuICAgICAgICBpZihza2V0Y2guaW5kZXhPZignRVNQJykgIT09IC0xKXtcbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWQpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1NJRFxcXS9nLCAkc2NvcGUuZXNwLnNzaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWRfcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEX1BBU1NcXF0vZywgJHNjb3BlLmVzcC5zc2lkX3Bhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLmFyZHVpbm9fcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUkRVSU5PX1BBU1NcXF0vZywgbWQ1KCRzY29wZS5lc3AuYXJkdWlub19wYXNzKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJ2JiYWRtaW4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuaG9zdG5hbWUpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJHNjb3BlLmVzcC5ob3N0bmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csICdiYmVzcCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCBuYW1lLnJlcGxhY2UoJy5sb2NhbCcsJycpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ0FwcCcgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGFwcCBjb25uZWN0aW9uXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVBQX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkudHJpbSgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKCBza2V0Y2guaW5kZXhPZignQkZZdW4nICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBiZiBhcGkga2V5IGhlYWRlclxuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0JGX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYmYuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQpKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICAgICAgICBpZiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcikgJiYgQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcykpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmA7XG4gICAgICAgICAgLy8gYWRkIGRiXG4gICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuVEhDKSB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIFRIQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpICE9PSAtMSB8fCBoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERIVCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBBREMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAxODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAyODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoYXNUcmlnZ2Vycyl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy0nKyRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24rJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLm5vdGlmeSA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSAoa2V0dGxlICYmIGtldHRsZS50ZW1wKSA/IGtldHRsZS50ZW1wLmN1cnJlbnQgOiAwO1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJyskc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0O1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgaWYoQm9vbGVhbih0aW1lcikpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHRpbWVyLm5vdGVzKSlcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoQm9vbGVhbih0aW1lcikgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKChCb29sZWFuKHRpbWVyKSkgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2sgJiYgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gSUZUVFQgTm90aWZpY2F0aW9uXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5pZnR0dCkgJiYgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnVybCAmJiAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQudXJsLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLnNlbmQoe1xuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3I6IGNvbG9yLCAgICAgXG4gICAgICAgICAgdW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCxcbiAgICAgICAgICBuYW1lOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBrZXR0bGUudHlwZSxcbiAgICAgICAgICB0ZW1wOiBrZXR0bGUudGVtcCxcbiAgICAgICAgICBoZWF0ZXI6IGtldHRsZS5oZWF0ZXIsXG4gICAgICAgICAgcHVtcDoga2V0dGxlLnB1bXAsXG4gICAgICAgICAgY29vbGVyOiBrZXR0bGUuY29vbGVyIHx8IHt9LFxuICAgICAgICAgIGFyZHVpbm86IGtldHRsZS5hcmR1aW5vICAgICAgICAgIFxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBzZW5kaW5nIHRvIElGVFRUICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHNlbmRpbmcgdG8gSUZUVFQgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUubmFtZSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuYWRqdXN0KSl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0fSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggQm9vbGVhbihrZXR0bGUpICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZSkpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1cGRhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSxCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlS2V0dGxlID0gZnVuY3Rpb24gKGtldHRsZSwgJGluZGV4KSB7ICAgIFxuICAgIGlmKGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZW1vdmUgdGhpcyBrZXR0bGU/JykpXG4gICAgICAkc2NvcGUua2V0dGxlcy5zcGxpY2UoJGluZGV4LDEpO1xuICB9O1xuICBcbiAgJHNjb3BlLmNsZWFyS2V0dGxlID0gZnVuY3Rpb24gKGtldHRsZSwgJGluZGV4KSB7XG4gICAgJHNjb3BlLmtldHRsZXNbJGluZGV4XS52YWx1ZXMgPSBbXTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICBpZihmaWVsZCA9PSAnYWRqdXN0Jyl7XG4gICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICB9XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKEJvb2xlYW4obG9hZGVkKSlcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLCAkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLCAkc2NvcGUua2V0dGxlcyk7XG4gICAgICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbiAgICB9LCA1MDAwKTtcbiAgfTtcbiAgXG4gICRzY29wZS51cGRhdGVMb2NhbCgpO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gQm9vbGVhbihzY29wZS50eXBlKSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0ICAgIH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdkYm1QZXJjZW50JywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbihkYm0pe1xuICAgIHJldHVybiAyICogKGRibSArIDEwMCk7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDM1LjI3NCwgMik7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDIuMjA0NjIsIDIpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHsgZGVidWc6IGZhbHNlLCBwb2xsU2Vjb25kczogMTAsIHVuaXQ6ICdGJywgaGVhdFNhZmV0eTogZmFsc2UgfVxuICAgICAgICAsIGNoYXJ0OiB7IHNob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2UgfVxuICAgICAgICAsIHNlbnNvcnM6IHsgREhUOiBmYWxzZSwgRFMxOEIyMDogZmFsc2UsIEJNUDogZmFsc2UgfVxuICAgICAgICAsIHJlY2lwZTogeyAnbmFtZSc6ICcnLCAnYnJld2VyJzogeyBuYW1lOiAnJywgJ2VtYWlsJzogJycgfSwgJ3llYXN0JzogW10sICdob3BzJzogW10sICdncmFpbnMnOiBbXSwgc2NhbGU6ICdncmF2aXR5JywgbWV0aG9kOiAncGFwYXppYW4nLCAnb2cnOiAxLjA1MCwgJ2ZnJzogMS4wMTAsICdhYnYnOiAwLCAnYWJ3JzogMCwgJ2NhbG9yaWVzJzogMCwgJ2F0dGVudWF0aW9uJzogMCB9XG4gICAgICAgICwgbm90aWZpY2F0aW9uczogeyBvbjogdHJ1ZSwgdGltZXJzOiB0cnVlLCBoaWdoOiB0cnVlLCBsb3c6IHRydWUsIHRhcmdldDogdHJ1ZSwgc2xhY2s6ICcnLCBsYXN0OiAnJyB9XG4gICAgICAgICwgc291bmRzOiB7IG9uOiB0cnVlLCBhbGVydDogJy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLCB0aW1lcjogJy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMycgfVxuICAgICAgICAsIGFyZHVpbm9zOiBbeyBpZDogJ2xvY2FsLScgKyBidG9hKCdicmV3YmVuY2gnKSwgYm9hcmQ6ICcnLCBSU1NJOiBmYWxzZSwgdXJsOiAnYXJkdWluby5sb2NhbCcsIGFuYWxvZzogMTEsIGRpZ2l0YWw6IDEzLCBhZGM6IDAsIHNlY3VyZTogZmFsc2UsIHZlcnNpb246ICcnLCBzdGF0dXM6IHsgZXJyb3I6ICcnLCBkdDogJycsIG1lc3NhZ2U6ICcnIH0sIGluZm86IHt9IH1dXG4gICAgICAgICwgdHBsaW5rOiB7IHVzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46ICcnLCBzdGF0dXM6ICcnLCBwbHVnczogW10gfVxuICAgICAgICAsIGlmdHR0OiB7IHVybDogJycsIG1ldGhvZDogJ0dFVCcsIGF1dGg6IHsga2V5OiAnJywgdmFsdWU6ICcnIH0sIHN0YXR1czogJycgfVxuICAgICAgICAsIGluZmx1eGRiOiB7IHVybDogJycsIHBvcnQ6ICcnLCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOiBbXSwgc3RhdHVzOiAnJyB9XG4gICAgICAgICwgYXBwOiB7IGVtYWlsOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBkZWZhdWx0U2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbmFtZTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6MTEsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6MTEsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ0JvaWwnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTInLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjExLGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9IGVsc2UgaWYoa2V5ID09ICdzZXR0aW5ncycpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnU29pbE1vaXN0dXJlJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgdmNjOiB0cnVlLCBwZXJjZW50OiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDE4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMjgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdTSFQzWCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZSB9XG4gICAgICAgICx7bmFtZTogJ01ILVoxNicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZSB9ICAgICAgICBcbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidUZW1wJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J3NlZWRsaW5nJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1BsYW50JywndHlwZSc6J2Nhbm5hYmlzJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZihCb29sZWFuKGFyZHVpbm8uc2VjdXJlKSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBpc0VTUDogZnVuY3Rpb24gKGFyZHVpbm8sIHJldHVybl92ZXJzaW9uKSB7XG4gICAgICBpZiAoIWFyZHVpbm8uYm9hcmQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGlmKHJldHVybl92ZXJzaW9uKXtcbiAgICAgICAgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzMyJykgIT09IC0xIHx8IGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdtNXN0aWNrX2MnKSAhPT0gLTEpXG4gICAgICAgICAgcmV0dXJuICczMic7XG4gICAgICAgIGVsc2UgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzgyNjYnKSAhPT0gLTEpXG4gICAgICAgICAgcmV0dXJuICc4MjY2JztcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBCb29sZWFuKGFyZHVpbm8gJiYgYXJkdWluby5ib2FyZCAmJiAoXG4gICAgICAgICAgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2VzcCcpICE9PSAtMSB8fFxuICAgICAgICAgIGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub2RlbWN1JykgIT09IC0xIHx8XG4gICAgICAgICAgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ25vZGUzMnMnKSAhPT0gLTEgfHxcbiAgICAgICAgICBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbTVzdGlja19jJykgIT09IC0xXG4gICAgICApKTtcbiAgICB9LFxuICBcbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykgKyAnL2FyZHVpbm8vJyArIGVuZHBvaW50O1xuICAgICAgLy8gZXh0ZW5kZWQgaW5mb1xuICAgICAgaWYgKGVuZHBvaW50ID09ICdpbmZvLWV4dCcpXG4gICAgICAgIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pICsgJy9pbmZvJztcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDAgfHwga2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0cnKSA9PT0gMClcbiAgICAgICAgICB1cmwgKz0gJz9hcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdXJsICs9ICc/ZHBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC52Y2MpICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC5pbmRleCAmJiAhaXNOYU4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC52Y2MpICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC5pbmRleCAmJiAhaXNOYU4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcbiAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9hcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgaWZ0dHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZzogKGRhdGEpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciBoZWFkZXJzID0geyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0LmF1dGgua2V5ICYmIHNldHRpbmdzLmlmdHR0LmF1dGgudmFsdWUpIHtcbiAgICAgICAgICAgIGhlYWRlcnNbc2V0dGluZ3MuaWZ0dHQuYXV0aC5rZXldID0gc2V0dGluZ3MuaWZ0dHQuYXV0aC52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGh0dHAgPSB7XG4gICAgICAgICAgICB1cmw6IHNldHRpbmdzLmlmdHR0LnVybCxcbiAgICAgICAgICAgIG1ldGhvZDogc2V0dGluZ3MuaWZ0dHQubWV0aG9kLFxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0Lm1ldGhvZCA9PSAnR0VUJylcbiAgICAgICAgICAgIGh0dHAucGFyYW1zID0gZGF0YTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBodHRwLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIHJldHVybiBodHRwO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgZGF0YSA9IHsgJ2JyZXdiZW5jaCc6IHRydWUgfTtcbiAgICAgICAgICB2YXIgaHR0cF9jb25maWcgPSB0aGlzLmlmdHR0KCkuY29uZmlnKGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaHR0cF9jb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ01pc3NpbmcgVVJMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgICRodHRwKGh0dHBfY29uZmlnKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKGBDb25uZWN0aW9uIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIHNlbmQ6IChkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBodHRwX2NvbmZpZyA9IHRoaXMuaWZ0dHQoKS5jb25maWcoZGF0YSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCFodHRwX2NvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnTWlzc2luZyBVUkwnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgJGh0dHAoaHR0cF9jb25maWcpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoYENvbm5lY3Rpb24gc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgYXBwOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHBzOi8vc2Vuc29yLmJyZXdiZW5jaC5jby8nLCBoZWFkZXJzOiB7fSwgdGltZW91dDogMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLmFwcC5hcGlfa2V5ICYmIHNldHRpbmdzLmFwcC5lbWFpbCl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSBgdXNlcnMvJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS0VZJ10gPSBgJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1FTUFJTCddID0gYCR7c2V0dGluZ3MuYXBwLmVtYWlsfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHEucmVqZWN0KFwiVXNlciBub3QgZm91bmRcIik7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwKXtcbiAgICAgICAgIGF2ZXJhZ2UgPSAoYXZlcmFnZSAqICg1LjAgLyA2NTUzNSkpIC8gMC4wMDAxO1xuICAgICAgICAgdmFyIGxuID0gTWF0aC5sb2coYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMKTtcbiAgICAgICAgIHZhciBrZWx2aW4gPSAxIC8gKDAuMDAzMzU0MDE3MCArICgwLjAwMDI1NjE3MjQ0ICogbG4pICsgKDAuMDAwMDAyMTQwMDk0MyAqIGxuICogbG4pICsgKC0wLjAwMDAwMDA3MjQwNTIxOSAqIGxuICogbG4gKiBsbikpO1xuICAgICAgICAgIC8vIGtlbHZpbiB0byBjZWxzaXVzXG4gICAgICAgICByZXR1cm4ga2VsdmluIC0gMjczLjE1O1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgICAgYXZlcmFnZSA9IFNFUklFU1JFU0lTVE9SIC8gYXZlcmFnZTtcblxuICAgICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0IC89IEJDT0VGRklDSUVOVDsgICAgICAgICAgICAgICAgICAgLy8gMS9CICogbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgICAgc3RlaW5oYXJ0IC09IDI3My4xNTtcbiAgICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgICAgfVxuICAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnKXtcbiAgICAgICBpZiAoa2V0dGxlLnRlbXAucmF3ICYmIGtldHRsZS50ZW1wLnJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKGtldHRsZS50ZW1wLnJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKEJvb2xlYW4oc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4oaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogQm9vbGVhbihvcHRpb25zLnNlc3Npb24pLFxuICAgICAgICAgICAgICAgIHRleHQ6IEJvb2xlYW4ob3B0aW9ucy5zZXNzaW9uKSA/IG9wdGlvbnMuc2Vzc2lvbiA6ICcnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBNb25pdG9yJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGU6ICdiYXNpcycsXG4gICAgICAgICAgICAgIGxlZ2VuZDoge1xuICAgICAgICAgICAgICAgIGtleTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlzQXJlYTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIEJvb2xlYW4ob3B0aW9ucy5jaGFydC5hcmVhKSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoQm9vbGVhbihvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24gKHBsYXRvKSB7XG4gICAgICBpZiAoIXBsYXRvKSByZXR1cm4gJyc7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbiAoc2cpIHtcbiAgICAgIGlmICghc2cpIHJldHVybiAnJztcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKS50b0ZpeGVkKDIpOztcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfTkFNRSkpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9EQVRFKSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcykpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCkpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk5BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk9HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NQVgpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQUJWX01JTikpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRVJNRU5UQUJMRVMpKXtcbiAgICAgICAgdmFyIGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uQU1PVU5UKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkhPUFMpKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NSVNDUykpe1xuICAgICAgICB2YXIgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5ZRUFTVFMpKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9