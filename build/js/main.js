webpackJsonp([1],{

/***/ 335:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(131);
__webpack_require__(357);
__webpack_require__(559);
__webpack_require__(561);
__webpack_require__(562);
__webpack_require__(563);
module.exports = __webpack_require__(564);


/***/ }),

/***/ 559:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(65);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(168);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(169);

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

/***/ 561:
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

/***/ 562:
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

/***/ 563:
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

/***/ 564:
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

},[335]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwibW9kYWxJbmZvIiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJvcGVuSW5mb01vZGFsIiwiYXJkdWlubyIsIiQiLCJtb2RhbCIsInJlcGxhY2VLZXR0bGVzV2l0aFBpbnMiLCJpbmZvIiwicGlucyIsImxlbmd0aCIsIl8iLCJlYWNoIiwicHVzaCIsInBpbiIsImlkIiwic3RpY2t5IiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJpbmRleCIsImFkYyIsImhpdCIsImlmdHR0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwidmVyc2lvbiIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJmaWx0ZXIiLCJpdGVtIiwic3JtIiwiaGV4Iiwic2V0dGluZ3MiLCJyZXNldCIsImFwcCIsImVtYWlsIiwiYXBpX2tleSIsInN0YXR1cyIsImdlbmVyYWwiLCJjaGFydE9wdGlvbnMiLCJ1bml0IiwiY2hhcnQiLCJkZWZhdWx0S2V0dGxlcyIsIm9wZW5Ta2V0Y2hlcyIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwiY2hhbmdlQXJkdWlubyIsImFyZHVpbm9zIiwiaXNFU1AiLCJhbmFsb2ciLCJkaWdpdGFsIiwidG91Y2giLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFkZCIsInRvb2x0aXAiLCJub3ciLCJEYXRlIiwiYnRvYSIsImJvYXJkIiwiUlNTSSIsInNlY3VyZSIsImR0IiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwiY29ubmVjdCIsInRoZW4iLCJCcmV3QmVuY2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsInVzZXIiLCJwYXNzIiwidG9rZW4iLCJwbHVncyIsImxvZ2luIiwicmVzcG9uc2UiLCJzY2FuIiwiZXJyb3JfY29kZSIsIm1zZyIsInNldEVycm9yTWVzc2FnZSIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiYXV0aCIsImtleSIsImFkZEtldHRsZSIsImZpbmQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwiaGVhdElzT24iLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiYXJkdWlub0lkIiwiY2hhbmdlU2Vuc29yIiwic2Vuc29yVHlwZXMiLCJwZXJjZW50IiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJjb25zb2xlIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImJyZXdlciIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJ0ZXh0Iiwic2hvdyIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidHJ1c3RBc0h0bWwiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJzaGlmdCIsImFsdGl0dWRlIiwicHJlc3N1cmUiLCJjdXJyZW50VmFsdWUiLCJ1bml0VHlwZSIsImdldFRpbWUiLCJzdWJUZXh0IiwiY29sb3IiLCJnZXROYXZPZmZzZXQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGVhdFNhZmV0eSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIm9uIiwiTWF0aCIsInJvdW5kIiwib2ZmIiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImNvbXBpbGVTa2V0Y2giLCJza2V0Y2hOYW1lIiwic2Vuc29ycyIsInNrZXRjaGVzIiwiYXJkdWlub05hbWUiLCJjdXJyZW50U2tldGNoIiwiYWN0aW9ucyIsInRyaWdnZXJzIiwiYmYiLCJESFQiLCJEUzE4QjIwIiwiQk1QIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwidG9Mb3dlckNhc2UiLCJkb3dubG9hZFNrZXRjaCIsImhhc1RyaWdnZXJzIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImF1dG9nZW4iLCJnZXQiLCJqb2luIiwibm90aWZpY2F0aW9ucyIsIm1kNSIsInRyaW0iLCJjb25uZWN0aW9uX3N0cmluZyIsInBvcnQiLCJUSEMiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwic3R5bGUiLCJkaXNwbGF5IiwiYm9keSIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmVDaGlsZCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsImxvdyIsImhpZ2giLCJsYXN0IiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJzZW5kIiwidHJhY2tDb2xvciIsImJhckNvbG9yIiwiY2hhbmdlS2V0dGxlVHlwZSIsImtldHRsZUluZGV4IiwiZmluZEluZGV4IiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsInByb2Nlc3NUZW1wcyIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNvbmZpcm0iLCJjbGVhcktldHRsZSIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZSIsInNyY0VsZW1lbnQiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZGJtIiwia2ciLCJpc05hTiIsImZhY3RvcnkiLCJsb2NhbFN0b3JhZ2UiLCJyZW1vdmVJdGVtIiwiZGVidWciLCJtaWxpdGFyeSIsImFyZWEiLCJyZWFkT25seSIsImVuYWJsZWQiLCJmb250IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJzZXRJdGVtIiwiZ2V0SXRlbSIsInJldHVybl92ZXJzaW9uIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJlbmRwb2ludCIsInJlcXVlc3QiLCJwYXNzd29yZCIsIndpdGhDcmVkZW50aWFscyIsInNlbnNvciIsIkF1dGhvcml6YXRpb24iLCJkaWdpdGFsUmVhZCIsInBhcmFtcyIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaHR0cCIsImh0dHBfY29uZmlnIiwic3VjY2VzcyIsImJpdGNhbGMiLCJhdmVyYWdlIiwiZm1hcCIsIngiLCJpbl9taW4iLCJpbl9tYXgiLCJvdXRfbWluIiwib3V0X21heCIsIlRIRVJNSVNUT1JOT01JTkFMIiwiVEVNUEVSQVRVUkVOT01JTkFMIiwiTlVNU0FNUExFUyIsIkJDT0VGRklDSUVOVCIsIlNFUklFU1JFU0lTVE9SIiwibG4iLCJsb2ciLCJrZWx2aW4iLCJzdGVpbmhhcnQiLCJpbmZsdXhDb25uZWN0aW9uIiwic2VyaWVzIiwidGl0bGUiLCJlbmFibGUiLCJzZXNzaW9uIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdCQUFjRyxR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LEdBQWxCLEVBM2ZjLENBQWhCOztBQThmQW5pQixRQUFFQyxJQUFGLENBQU9naUIsU0FBUCxFQUFrQixVQUFTRyxJQUFULEVBQWU7QUFDL0IsWUFBR0osUUFBUTNmLE9BQVIsQ0FBZ0IrZixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUTVmLE9BQVIsQ0FBZ0JtVixPQUFPNkssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUFuL0NJLEdBQVA7QUFxL0NELENBeC9DRCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyelNsaWRlcidcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsO1xudmFyIHJlc2V0Q2hhcnQgPSAxMDA7XG52YXIgdGltZW91dCA9IG51bGw7IC8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5CcmV3U2VydmljZSA9IEJyZXdTZXJ2aWNlO1xuJHNjb3BlLnNpdGUgPSB7aHR0cHM6IEJvb2xlYW4oZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnJyxcbiAgc3NpZDogJycsXG4gIHNzaWRfcGFzczogJycsXG4gIGhvc3RuYW1lOiAnYmJlc3AnLFxuICBhcmR1aW5vX3Bhc3M6ICdiYmFkbWluJyxcbiAgYXV0b2Nvbm5lY3Q6IGZhbHNlXG59O1xuJHNjb3BlLm1vZGFsSW5mbyA9IHt9O1xuJHNjb3BlLmhvcHM7XG4kc2NvcGUuZ3JhaW5zO1xuJHNjb3BlLndhdGVyO1xuJHNjb3BlLmxvdmlib25kO1xuJHNjb3BlLnBrZztcbiRzY29wZS5rZXR0bGVUeXBlcyA9IEJyZXdTZXJ2aWNlLmtldHRsZVR5cGVzKCk7XG4kc2NvcGUuc2hvd1NldHRpbmdzID0gdHJ1ZTtcbiRzY29wZS5lcnJvciA9IHttZXNzYWdlOiAnJywgdHlwZTogJ2Rhbmdlcid9O1xuJHNjb3BlLnNsaWRlciA9IHtcbiAgbWluOiAwLFxuICBvcHRpb25zOiB7XG4gICAgZmxvb3I6IDAsXG4gICAgY2VpbDogMTAwLFxuICAgIHN0ZXA6IDEsXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gYCR7dmFsdWV9JWA7XG4gICAgfSxcbiAgICBvbkVuZDogZnVuY3Rpb24oa2V0dGxlSWQsIG1vZGVsVmFsdWUsIGhpZ2hWYWx1ZSwgcG9pbnRlclR5cGUpe1xuICAgICAgdmFyIGtldHRsZSA9IGtldHRsZUlkLnNwbGl0KCdfJyk7XG4gICAgICB2YXIgaztcblxuICAgICAgc3dpdGNoIChrZXR0bGVbMF0pIHtcbiAgICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uaGVhdGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5jb29sZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLnB1bXA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmKCFrKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmFjdGl2ZSAmJiBrLnB3bSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgICByZXR1cm4gJHNjb3BlLnRvZ2dsZVJlbGF5KCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0sIGssIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuJHNjb3BlLm9wZW5JbmZvTW9kYWwgPSBmdW5jdGlvbiAoYXJkdWlubykge1xuICAkc2NvcGUubW9kYWxJbmZvID0gYXJkdWlubztcbiAgJCgnI2FyZHVpbm8taW5mbycpLm1vZGFsKCd0b2dnbGUnKTsgIFxufTtcbiAgXG4kc2NvcGUucmVwbGFjZUtldHRsZXNXaXRoUGlucyA9IGZ1bmN0aW9uIChhcmR1aW5vKSB7XG4gIGlmIChhcmR1aW5vLmluZm8gJiYgYXJkdWluby5pbmZvLnBpbnMgJiYgYXJkdWluby5pbmZvLnBpbnMubGVuZ3RoKSB7XG4gICAgJHNjb3BlLmtldHRsZXMgPSBbXTtcbiAgICBfLmVhY2goYXJkdWluby5pbmZvLnBpbnMsIHBpbiA9PiB7XG4gICAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogcGluLm5hbWVcbiAgICAgICAgLCBpZDogbnVsbFxuICAgICAgICAsIHR5cGU6ICRzY29wZS5rZXR0bGVUeXBlc1s0XS50eXBlXG4gICAgICAgICwgYWN0aXZlOiBmYWxzZVxuICAgICAgICAsIHN0aWNreTogZmFsc2VcbiAgICAgICAgLCBoZWF0ZXI6IHsgcGluOiAnRDYnLCBydW5uaW5nOiBmYWxzZSwgYXV0bzogZmFsc2UsIHB3bTogZmFsc2UsIGR1dHlDeWNsZTogMTAwLCBza2V0Y2g6IGZhbHNlIH1cbiAgICAgICAgLCBwdW1wOiB7IHBpbjogJ0Q3JywgcnVubmluZzogZmFsc2UsIGF1dG86IGZhbHNlLCBwd206IGZhbHNlLCBkdXR5Q3ljbGU6IDEwMCwgc2tldGNoOiBmYWxzZSB9XG4gICAgICAgICwgdGVtcDogeyBwaW46IHBpbi5waW4sIHZjYzogJycsIGluZGV4OiAnJywgdHlwZTogcGluLnR5cGUsIGFkYzogZmFsc2UsIGhpdDogZmFsc2UsIGlmdHR0OiBmYWxzZSwgY3VycmVudDogMCwgbWVhc3VyZWQ6IDAsIHByZXZpb3VzOiAwLCBhZGp1c3Q6IDAsIHRhcmdldDogJHNjb3BlLmtldHRsZVR5cGVzWzRdLnRhcmdldCwgZGlmZjogJHNjb3BlLmtldHRsZVR5cGVzWzRdLmRpZmYsIHJhdzogMCwgdm9sdHM6IDAgfVxuICAgICAgICAsIHZhbHVlczogW11cbiAgICAgICAgLCB0aW1lcnM6IFtdXG4gICAgICAgICwga25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLCB7IHZhbHVlOiAwLCBtaW46IDAsIG1heDogJHNjb3BlLmtldHRsZVR5cGVzWzRdLnRhcmdldCArICRzY29wZS5rZXR0bGVUeXBlc1s0XS5kaWZmIH0pXG4gICAgICAgICwgYXJkdWlubzogYXJkdWlub1xuICAgICAgICAsIG1lc3NhZ2U6IHsgdHlwZTogJ2Vycm9yJywgbWVzc2FnZTogJycsIHZlcnNpb246ICcnLCBjb3VudDogMCwgbG9jYXRpb246ICcnIH1cbiAgICAgICAgLCBub3RpZnk6IHsgc2xhY2s6IGZhbHNlIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59O1xuICBcbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZihsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG5pZiAoISRzY29wZS5zZXR0aW5ncy5hcHApXG4gICRzY29wZS5zZXR0aW5ncy5hcHAgPSB7IGVtYWlsOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycgfTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnR9KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuXG4kc2NvcGUub3BlblNrZXRjaGVzID0gZnVuY3Rpb24oKXtcbiAgJCgnI3NldHRpbmdzTW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAkKCcjc2tldGNoZXNNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG59O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtQnkob2JqLCdhbW91bnQnKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VBcmR1aW5vID0gZnVuY3Rpb24gKGtldHRsZSkge1xuICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzMyJykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gIH0gZWxzZSBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICc4MjY2Jykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICB9XG59O1xuLy8gY2hlY2sga2V0dGxlIHR5cGUgcG9ydHNcbl8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgfVxufSk7XG4gIFxuLy8gaW5pdCBjYWxjIHZhbHVlc1xuJHNjb3BlLnVwZGF0ZUFCViA9IGZ1bmN0aW9uKCl7XG4gIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbihCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpXG4gICAgICAsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidihCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidixCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKVxuICAgICAgLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgfVxufTtcblxuJHNjb3BlLmNoYW5nZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kID0gbWV0aG9kO1xuICAkc2NvcGUudXBkYXRlQUJWKCk7XG59O1xuXG4kc2NvcGUuY2hhbmdlU2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGUgPSBzY2FsZTtcbiAgaWYoc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9XG59O1xuXG4kc2NvcGUuZ2V0U3RhdHVzQ2xhc3MgPSBmdW5jdGlvbihzdGF0dXMpe1xuICBpZihzdGF0dXMgPT0gJ0Nvbm5lY3RlZCcpXG4gICAgcmV0dXJuICdzdWNjZXNzJztcbiAgZWxzZSBpZihfLmVuZHNXaXRoKHN0YXR1cywnaW5nJykpXG4gICAgcmV0dXJuICdzZWNvbmRhcnknO1xuICBlbHNlXG4gICAgcmV0dXJuICdkYW5nZXInO1xufVxuXG4kc2NvcGUudXBkYXRlQUJWKCk7XG5cbiAgJHNjb3BlLmdldFBvcnRSYW5nZSA9IGZ1bmN0aW9uKG51bWJlcil7XG4gICAgICBudW1iZXIrKztcbiAgICAgIHJldHVybiBBcnJheShudW1iZXIpLmZpbGwoKS5tYXAoKF8sIGlkeCkgPT4gMCArIGlkeCk7XG4gIH07XG5cbiAgJHNjb3BlLmFyZHVpbm9zID0ge1xuICAgIGFkZDogKCkgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYm9hcmQ6ICcnLFxuICAgICAgICBSU1NJOiBmYWxzZSxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgYWRjOiAwLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7IGVycm9yOiAnJywgZHQ6ICcnLCBtZXNzYWdlOiAnJyB9LFxuICAgICAgICBpbmZvOiB7fVxuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgICAgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnMzInKSB7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMzk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDM5O1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLnRvdWNoID0gWzQsMCwyLDE1LDEzLDEyLDE0LDI3LDMzLDMyXTtcbiAgICAgICAgfSBlbHNlIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKSB7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgnaGlkZScpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAgZGVsZXRlIGtldHRsZS5hcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoYXJkdWlubykgPT4ge1xuICAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoJ2hpZGUnKTtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdDb25uZWN0aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ2luZm8nKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBpZihpbmZvICYmIGluZm8uQnJld0JlbmNoKXtcbiAgICAgICAgICAgIGFyZHVpbm8uYm9hcmQgPSBpbmZvLkJyZXdCZW5jaC5ib2FyZDtcbiAgICAgICAgICAgIGlmKGluZm8uQnJld0JlbmNoLlJTU0kpXG4gICAgICAgICAgICAgIGFyZHVpbm8uUlNTSSA9IGluZm8uQnJld0JlbmNoLlJTU0k7XG4gICAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSBpbmZvLkJyZXdCZW5jaC52ZXJzaW9uO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQMzInKSA9PSAwIHx8IGFyZHVpbm8uYm9hcmQuaW5kZXhPZignTm9kZU1DVV8zMlMnKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAgICAgIGFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQODI2NicpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAgICAgICAgICAgIGFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGFyZHVpbm8pID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdHZXR0aW5nIEluZm8uLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mby1leHQnKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBhcmR1aW5vLmluZm8gPSBpbmZvO1xuICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBhcmR1aW5vLmluZm8gPSB7fTtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpZigkc2NvcGUucGtnLnZlcnNpb24gPCA0LjIpXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ1VwZ3JhZGUgdG8gc3VwcG9ydCByZWJvb3QnO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHJlYm9vdDogKGFyZHVpbm8pID0+IHtcbiAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ3JlYm9vdCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9ICcnO1xuICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290IFN1Y2Nlc3MsIHRyeSBjb25uZWN0aW5nIGluIGEgZmV3IHNlY29uZHMuJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKHBrZy52ZXJzaW9uIDwgNC4yKVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdVcGdyYWRlIHRvIHN1cHBvcnQgcmVib290JztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgY2xlYXI6ICgpID0+IHsgXG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rID0geyB1c2VyOiAnJywgcGFzczogJycsIHRva2VuOiAnJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdIH07XG4gICAgfSxcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfSBlbHNlIGlmKHJlc3BvbnNlLmVycm9yX2NvZGUgJiYgcmVzcG9uc2UubXNnKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UocmVzcG9uc2UubXNnKTsgIFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnU2Nhbm5pbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZihCb29sZWFuKHBsdWcuc3RhdHVzKSl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIHBsdWcuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICB2YXIgb2ZmT3JPbiA9IGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEgPyAwIDogMTtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnRvZ2dsZShkZXZpY2UsIG9mZk9yT24pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IG9mZk9yT247XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pLnRoZW4odG9nZ2xlUmVzcG9uc2UgPT4ge1xuICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmZvXG4gICAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgIGRldmljZS5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmlmdHR0ID0ge1xuICAgIGNsZWFyOiAoKSA9PiB7IFxuICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0ID0geyB1cmw6ICcnLCBtZXRob2Q6ICdHRVQnLCBhdXRoOiB7IGtleTogJycsIHZhbHVlOiAnJyB9LCBzdGF0dXM6ICcnIH07XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaWZ0dHQoKS5jb25uZWN0KClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICB9O1xuICBcbiAgJHNjb3BlLmFkZEtldHRsZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIGlmKCEkc2NvcGUua2V0dGxlcykgJHNjb3BlLmtldHRsZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGggPyAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF0gOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9O1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiB0eXBlID8gXy5maW5kKCRzY29wZS5rZXR0bGVUeXBlcyx7dHlwZTogdHlwZX0pLm5hbWUgOiAkc2NvcGUua2V0dGxlVHlwZXNbMF0ubmFtZVxuICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxpZnR0dDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiBhcmR1aW5vXG4gICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuICBcbiAgJHNjb3BlLmhlYXRJc09uID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBCb29sZWFuKF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnaGVhdGVyJzogeydydW5uaW5nJzogdHJ1ZX19KS5sZW5ndGgpO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24oYXJkdWlubywgcGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2UgaWYoQnJld1NlcnZpY2UuaXNFU1AoYXJkdWlubykpe1xuICAgICAgICBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdEJywnR1BJTycpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdBJywnR1BJTycpLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGluO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKFxuICAgICAgICAgIChrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLnRlbXAudmNjPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlU2Vuc29yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpKXtcbiAgICAgIGtldHRsZS5rbm9iLnVuaXQgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLnVuaXQgPSAnXFx1MDBCMCc7XG4gICAgfVxuICAgIGtldHRsZS50ZW1wLnZjYyA9ICcnO1xuICAgIGtldHRsZS50ZW1wLmluZGV4ID0gJyc7XG4gIH07XG5cbiAgJHNjb3BlLmluZmx1eGRiID0ge1xuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIgPSBkZWZhdWx0U2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQgfHwgcmVzcG9uc2Uuc3RhdHVzID09IDIwMCl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFwcCA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSAmJlxuICAgICAgICBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPT0gJ0Nvbm5lY3RlZCdcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IGRlZmF1bHRTZXR0aW5ncy5hcHA7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSB8fCAhQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkpKVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5hcHAoKS5hdXRoKClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoQm9vbGVhbihmb3JtYXR0ZWRfY29udGVudCkpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoQm9vbGVhbihqc29uT2JqLlJlY2lwZXMpICYmIEJvb2xlYW4oanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoQm9vbGVhbihqc29uT2JqLlNlbGVjdGlvbnMpICYmIEJvb2xlYW4oanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKEJvb2xlYW4oanNvbk9iai5SRUNJUEVTKSAmJiBCb29sZWFuKGpzb25PYmouUkVDSVBFUy5SRUNJUEUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUub2cpKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuZmcpKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChncmFpbi5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogZ3JhaW4ubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChncmFpbi5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChob3AuYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBob3AubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChob3AuYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5wa2coKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucGtnID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuZ3JhaW5zKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKHtcbiAgICAgIGFuaW1hdGVkOiAnZmFkZScsXG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgICBodG1sOiB0cnVlXG4gICAgfSk7XG4gICAgaWYoJCgnI2dpdGNvbW1pdCBhJykudGV4dCgpICE9ICdnaXRfY29tbWl0Jyl7XG4gICAgICAkKCcjZ2l0Y29tbWl0Jykuc2hvdygpO1xuICAgIH1cbiAgICBcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRpbWVycykgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUsIGxvY2F0aW9uKXsgICAgXG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZihCb29sZWFuKGVyci5zdGF0dXNUZXh0KSlcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihtZXNzYWdlKSl7XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdkYW5nZXInO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICBpZihsb2NhdGlvbilcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBtZXNzYWdlKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3IgY29ubmVjdGluZyB0byAke0JyZXdTZXJ2aWNlLmRvbWFpbihrZXR0bGUuYXJkdWlubyl9YCk7XG4gICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ0Nvbm5lY3Rpb24gZXJyb3I6Jyk7XG4gICAgICB9XG4gICAgXG4gIH07XG4gICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzID0gZnVuY3Rpb24ocmVzcG9uc2UsIGVycm9yKXtcbiAgICB2YXIgYXJkdWlubyA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywge2lkOiByZXNwb25zZS5rZXR0bGUuYXJkdWluby5pZH0pO1xuICAgIGlmKGFyZHVpbm8ubGVuZ3RoKXtcbiAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICBhcmR1aW5vWzBdLnZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIGlmKGVycm9yKVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9IGVycm9yO1xuICAgICAgZWxzZVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2Upe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgLy8gbmVlZGVkIGZvciBjaGFydHNcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlLm5hbWU7XG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vdXBkYXRlIGRhdGF0eXBlXG4gICAgcmVzcG9uc2UudGVtcCA9IHBhcnNlRmxvYXQocmVzcG9uc2UudGVtcCk7XG4gICAgcmVzcG9uc2UucmF3ID0gcGFyc2VGbG9hdChyZXNwb25zZS5yYXcpO1xuICAgIGlmKHJlc3BvbnNlLnZvbHRzKVxuICAgICAgcmVzcG9uc2Uudm9sdHMgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnZvbHRzKTtcblxuICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuY3VycmVudCkpXG4gICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgICRmaWx0ZXIoJ3JvdW5kJykocmVzcG9uc2UudGVtcCwgMik7XG4gICAgXG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcigncm91bmQnKShwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSwgMCk7ICAgIFxuICAgIC8vIHNldCByYXdcbiAgICBrZXR0bGUudGVtcC5yYXcgPSByZXNwb25zZS5yYXc7XG4gICAga2V0dGxlLnRlbXAudm9sdHMgPSByZXNwb25zZS52b2x0cztcblxuICAgIC8vIHZvbHQgY2hlY2tcbiAgICBpZiAoa2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMTgwJyAmJlxuICAgICAga2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMjgwJyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnZvbHRzICYmXG4gICAgICAha2V0dGxlLnRlbXAucmF3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdEUzE4QjIwJyAmJlxuICAgICAgcmVzcG9uc2UudGVtcCA9PSAtMTI3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcy5zaGlmdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQgc2Vuc29ycyBoYXZlIGh1bWlkaXR5IGFzIGEgcGVyY2VudFxuICAgIC8vU29pbE1vaXN0dXJlRCBoYXMgbW9pc3R1cmUgYXMgYSBwZXJjZW50XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5wZXJjZW50ID0gJGZpbHRlcigncm91bmQnKShyZXNwb25zZS5wZXJjZW50LDApO1xuICAgIH1cbiAgICAvLyBCTVAgc2Vuc29ycyBoYXZlIGFsdGl0dWRlIGFuZCBwcmVzc3VyZVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuYWx0aXR1ZGUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLmFsdGl0dWRlID0gcmVzcG9uc2UuYWx0aXR1ZGU7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucHJlc3N1cmUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgLy8gcGFzY2FsIHRvIGluY2hlcyBvZiBtZXJjdXJ5XG4gICAgICBrZXR0bGUucHJlc3N1cmUgPSByZXNwb25zZS5wcmVzc3VyZSAvIDMzODYuMzg5O1xuICAgIH1cblxuICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlLCBza2V0Y2hfdmVyc2lvbjpyZXNwb25zZS5za2V0Y2hfdmVyc2lvbn0pO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoY3VycmVudFZhbHVlIDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdGFydCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gtYWx0JykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICB2YXIgaztcbiAgICB2YXIgaGVhdElzT24gPSAkc2NvcGUuaGVhdElzT24oKTtcbiAgICBcbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICBpZiAoaXRlbSA9PSAnaGVhdCcgJiYgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuaGVhdFNhZmV0eSAmJiBoZWF0SXNPbikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdBIGhlYXRlciBpcyBhbHJlYWR5IHJ1bm5pbmcuJywga2V0dGxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG4gICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmhhc1NrZXRjaGVzID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICB2YXIgaGFzQVNrZXRjaCA9IGZhbHNlO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgIGlmKChrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKSB8fFxuICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCkgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFja1xuICAgICAgKSB7XG4gICAgICAgIGhhc0FTa2V0Y2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBoYXNBU2tldGNoO1xuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKGtldHRsZS5hY3RpdmUpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnc3RhcnRpbmcuLi4nO1xuXG4gICAgICAgIEJyZXdTZXJ2aWNlLnRlbXAoa2V0dGxlKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCBrZXR0bGUpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdWRwYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudCsrO1xuICAgICAgICAgICAgaWYoa2V0dGxlLm1lc3NhZ2UuY291bnQ9PTcpXG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSByZWxheXNcbiAgICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAgICAgIGlmKGtldHRsZS5wdW1wKSBrZXR0bGUucHVtcC5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5oZWF0ZXIpIGtldHRsZS5oZWF0ZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuY29vbGVyKSBrZXR0bGUuY29vbGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUmVsYXkgPSBmdW5jdGlvbihrZXR0bGUsIGVsZW1lbnQsIG9uKXtcbiAgICBpZihvbikge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20pe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sTWF0aC5yb3VuZCgyNTUqZWxlbWVudC5kdXR5Q3ljbGUvMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSBpZihlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwyNTUpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDEpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20gfHwgZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS5pbXBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcbiAgICB0cnkge1xuICAgICAgdmFyIHByb2ZpbGVDb250ZW50ID0gSlNPTi5wYXJzZSgkZmlsZUNvbnRlbnQpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzID0gcHJvZmlsZUNvbnRlbnQuc2V0dGluZ3MgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5rZXR0bGVzID0gcHJvZmlsZUNvbnRlbnQua2V0dGxlcyB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAvLyBlcnJvciBpbXBvcnRpbmdcbiAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5leHBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGtldHRsZXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmtldHRsZXMpO1xuICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBrZXR0bGVzW2ldLnZhbHVlcyA9IFtdO1xuICAgICAga2V0dGxlc1tpXS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHtcInNldHRpbmdzXCI6ICRzY29wZS5zZXR0aW5ncyxcImtldHRsZXNcIjoga2V0dGxlc30pKTtcbiAgfTtcblxuICAkc2NvcGUuY29tcGlsZVNrZXRjaCA9IGZ1bmN0aW9uKHNrZXRjaE5hbWUpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zZW5zb3JzID0ge307XG4gICAgLy8gYXBwZW5kIGVzcCB0eXBlXG4gICAgaWYoc2tldGNoTmFtZS5pbmRleE9mKCdFU1AnKSAhPT0gLTEgJiYgIXNrZXRjaE5hbWUuaW5kZXhPZignRVNQMzInKSA9PT0gLTEpXG4gICAgICBza2V0Y2hOYW1lICs9ICRzY29wZS5lc3AudHlwZTtcbiAgICB2YXIgc2tldGNoZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8gPyBrZXR0bGUuYXJkdWluby51cmwucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikgOiAnRGVmYXVsdCc7XG4gICAgICB2YXIgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTogYXJkdWlub05hbWV9KTtcbiAgICAgIGlmKCFjdXJyZW50U2tldGNoKXtcbiAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgdHlwZTogc2tldGNoTmFtZSxcbiAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICBwaW5zOiBbXSxcbiAgICAgICAgICBoZWFkZXJzOiBbXSxcbiAgICAgICAgICB0cmlnZ2VyczogZmFsc2UsXG4gICAgICAgICAgYmY6IChza2V0Y2hOYW1lLmluZGV4T2YoJ0JGJykgIT09IC0xKSA/IHRydWUgOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgfVxuICAgICAgdmFyIHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmIEJvb2xlYW4oa2V0dGxlLnRlbXAuYWRqdXN0KSkgPyAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJiAkc2NvcGUuZXNwLmF1dG9jb25uZWN0KXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBdXRvQ29ubmVjdC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xIHx8IEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSkgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZWVnZWUtdG9reW8vREhUZXNwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpO1xuICAgICAgfSBlbHNlIGlmKCFCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRsaWItMS4yLjkuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRTMThCMjAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDE4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDI4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYWRhZnJ1aXQvQWRhZnJ1aXRfQURTMVgxNScpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCB0aGUgYWN0aW9ucyBjb21tYW5kXG4gICAgICB2YXIga2V0dGxlVHlwZSA9IGtldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZiAoa2V0dGxlLnRlbXAudmNjKVxuICAgICAgICBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIFxuICAgICAgaWYgKGtldHRsZS50ZW1wLmluZGV4KSBrZXR0bGVUeXBlICs9ICctJyArIGtldHRsZS50ZW1wLmluZGV4OyAgICAgIFxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc0NvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpO1xuICAgICAgLy8gdXNlZCBmb3IgaW5mbyBlbmRwb2ludFxuICAgICAgY3VycmVudFNrZXRjaC5waW5zLnB1c2goJyBwaW5zICs9IFwie1xcXFxcIm5hbWVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS5uYW1lKydcIikgKyBcIlxcXFxcIixcXFxcXCJwaW5cXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpICsgXCJcXFxcXCIsXFxcXFwidHlwZVxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicra2V0dGxlVHlwZSsnXCIpICsgXCJcXFxcXCIsXFxcXFwiYWRqdXN0XFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJythZGp1c3QrJ1wiKSArIFwiXFxcXFwifVwiOycpO1xuICAgICAgXG4gICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGtldHRsZS5wZXJjZW50KSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNQZXJjZW50Q29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnLUh1bWlkaXR5XCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTsgICAgICAgIFxuICAgICAgfVxuICAgICAgXG4gICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnK0Jvb2xlYW4oa2V0dGxlLm5vdGlmeS5zbGFjaykrJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnK0Jvb2xlYW4oa2V0dGxlLm5vdGlmeS5zbGFjaykrJyk7Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBpZiAoc2tldGNoLnRyaWdnZXJzIHx8IHNrZXRjaC5iZikge1xuICAgICAgICBpZiAoc2tldGNoLnR5cGUuaW5kZXhPZignTTUnKSA9PT0gLTEpIHtcbiAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCB0ZW1wID0gMC4wMDsnKTtcbiAgICAgICAgICBpZiAoc2tldGNoLmJmKSB7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCBhbWJpZW50ID0gMC4wMDsnKTtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGh1bWlkaXR5ID0gMC4wMDsnKTtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2NvbnN0IFN0cmluZyBlcXVpcG1lbnRfbmFtZSA9IFwiJyskc2NvcGUuc2V0dGluZ3MuYmYubmFtZSsnXCI7Jyk7ICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgYXV0b0NvbW1hbmQgXG4gICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmIChza2V0Y2guYmYgJiYgc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zUGVyY2VudENvbW1hbmQoJykgIT09IC0xICYmXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignaHVtaWRpdHknKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnLCAnaHVtaWRpdHkgPSBhY3Rpb25zUGVyY2VudENvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2guYmYgJiYgc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdhbWJpZW50JykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAvLyBCRiBsb2dpY1xuICAgICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAnYW1iaWVudCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEFsbCBvdGhlciBsb2dpY1xuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywgJ3RlbXAgPSBhY3Rpb25zQ29tbWFuZCgnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnBpbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIHBpbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW1BJTlNdJywgcGlucy5sZW5ndGggPyBwaW5zLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtIRUFERVJTXScsIGhlYWRlcnMubGVuZ3RoID8gaGVhZGVycy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtWRVJTSU9OXFxdL2csICRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1RQTElOS19DT05ORUNUSU9OXFxdL2csIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbU0xBQ0tfQ09OTkVDVElPTlxcXS9nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayk7XG5cbiAgICAgICAgLy8gRVNQIHZhcmlhYmxlc1xuICAgICAgICBpZihza2V0Y2guaW5kZXhPZignRVNQJykgIT09IC0xKXtcbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWQpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1NJRFxcXS9nLCAkc2NvcGUuZXNwLnNzaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWRfcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEX1BBU1NcXF0vZywgJHNjb3BlLmVzcC5zc2lkX3Bhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLmFyZHVpbm9fcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUkRVSU5PX1BBU1NcXF0vZywgbWQ1KCRzY29wZS5lc3AuYXJkdWlub19wYXNzKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJ2JiYWRtaW4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuaG9zdG5hbWUpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJHNjb3BlLmVzcC5ob3N0bmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csICdiYmVzcCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCBuYW1lLnJlcGxhY2UoJy5sb2NhbCcsJycpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ0FwcCcgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGFwcCBjb25uZWN0aW9uXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVBQX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkudHJpbSgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKCBza2V0Y2guaW5kZXhPZignQkZZdW4nICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBiZiBhcGkga2V5IGhlYWRlclxuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0JGX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYmYuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQpKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICAgICAgICBpZiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcikgJiYgQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcykpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmA7XG4gICAgICAgICAgLy8gYWRkIGRiXG4gICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuVEhDKSB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIFRIQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpICE9PSAtMSB8fCBoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERIVCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBBREMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAxODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAyODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoYXNUcmlnZ2Vycyl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy0nKyRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24rJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLm5vdGlmeSA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSAoa2V0dGxlICYmIGtldHRsZS50ZW1wKSA/IGtldHRsZS50ZW1wLmN1cnJlbnQgOiAwO1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJyskc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0O1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgaWYoQm9vbGVhbih0aW1lcikpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHRpbWVyLm5vdGVzKSlcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoQm9vbGVhbih0aW1lcikgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKChCb29sZWFuKHRpbWVyKSkgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2sgJiYgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gSUZUVFQgTm90aWZpY2F0aW9uXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5pZnR0dCkgJiYgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnVybCAmJiAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQudXJsLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLnNlbmQoe1xuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3I6IGNvbG9yLCAgICAgXG4gICAgICAgICAgdW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCxcbiAgICAgICAgICBuYW1lOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBrZXR0bGUudHlwZSxcbiAgICAgICAgICB0ZW1wOiBrZXR0bGUudGVtcCxcbiAgICAgICAgICBoZWF0ZXI6IGtldHRsZS5oZWF0ZXIsXG4gICAgICAgICAgcHVtcDoga2V0dGxlLnB1bXAsXG4gICAgICAgICAgY29vbGVyOiBrZXR0bGUuY29vbGVyIHx8IHt9LFxuICAgICAgICAgIGFyZHVpbm86IGtldHRsZS5hcmR1aW5vICAgICAgICAgIFxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBzZW5kaW5nIHRvIElGVFRUICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHNlbmRpbmcgdG8gSUZUVFQgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUubmFtZSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuYWRqdXN0KSl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0fSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggQm9vbGVhbihrZXR0bGUpICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZSkpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1cGRhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSxCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlS2V0dGxlID0gZnVuY3Rpb24gKGtldHRsZSwgJGluZGV4KSB7ICAgIFxuICAgIGlmKGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZW1vdmUgdGhpcyBrZXR0bGU/JykpXG4gICAgICAkc2NvcGUua2V0dGxlcy5zcGxpY2UoJGluZGV4LDEpO1xuICB9O1xuICBcbiAgJHNjb3BlLmNsZWFyS2V0dGxlID0gZnVuY3Rpb24gKGtldHRsZSwgJGluZGV4KSB7XG4gICAgJHNjb3BlLmtldHRsZXNbJGluZGV4XS52YWx1ZXMgPSBbXTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICBpZihmaWVsZCA9PSAnYWRqdXN0Jyl7XG4gICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICB9XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKEJvb2xlYW4obG9hZGVkKSlcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLCAkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLCAkc2NvcGUua2V0dGxlcyk7XG4gICAgICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbiAgICB9LCA1MDAwKTtcbiAgfTtcbiAgXG4gICRzY29wZS51cGRhdGVMb2NhbCgpO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gQm9vbGVhbihzY29wZS50eXBlKSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0ICAgIH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdkYm1QZXJjZW50JywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbihkYm0pe1xuICAgIHJldHVybiAyICogKGRibSArIDEwMCk7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDM1LjI3NCwgMik7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDIuMjA0NjIsIDIpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHsgZGVidWc6IGZhbHNlLCBwb2xsU2Vjb25kczogMTAsIHVuaXQ6ICdGJywgaGVhdFNhZmV0eTogZmFsc2UgfVxuICAgICAgICAsIGNoYXJ0OiB7IHNob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2UgfVxuICAgICAgICAsIHNlbnNvcnM6IHsgREhUOiBmYWxzZSwgRFMxOEIyMDogZmFsc2UsIEJNUDogZmFsc2UgfVxuICAgICAgICAsIHJlY2lwZTogeyAnbmFtZSc6ICcnLCAnYnJld2VyJzogeyBuYW1lOiAnJywgJ2VtYWlsJzogJycgfSwgJ3llYXN0JzogW10sICdob3BzJzogW10sICdncmFpbnMnOiBbXSwgc2NhbGU6ICdncmF2aXR5JywgbWV0aG9kOiAncGFwYXppYW4nLCAnb2cnOiAxLjA1MCwgJ2ZnJzogMS4wMTAsICdhYnYnOiAwLCAnYWJ3JzogMCwgJ2NhbG9yaWVzJzogMCwgJ2F0dGVudWF0aW9uJzogMCB9XG4gICAgICAgICwgbm90aWZpY2F0aW9uczogeyBvbjogdHJ1ZSwgdGltZXJzOiB0cnVlLCBoaWdoOiB0cnVlLCBsb3c6IHRydWUsIHRhcmdldDogdHJ1ZSwgc2xhY2s6ICcnLCBsYXN0OiAnJyB9XG4gICAgICAgICwgc291bmRzOiB7IG9uOiB0cnVlLCBhbGVydDogJy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLCB0aW1lcjogJy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMycgfVxuICAgICAgICAsIGFyZHVpbm9zOiBbeyBpZDogJ2xvY2FsLScgKyBidG9hKCdicmV3YmVuY2gnKSwgYm9hcmQ6ICcnLCBSU1NJOiBmYWxzZSwgdXJsOiAnYXJkdWluby5sb2NhbCcsIGFuYWxvZzogNSwgZGlnaXRhbDogMTMsIGFkYzogMCwgc2VjdXJlOiBmYWxzZSwgdmVyc2lvbjogJycsIHN0YXR1czogeyBlcnJvcjogJycsIGR0OiAnJywgbWVzc2FnZTogJycgfSwgaW5mbzoge30gfV1cbiAgICAgICAgLCB0cGxpbms6IHsgdXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjogJycsIHN0YXR1czogJycsIHBsdWdzOiBbXSB9XG4gICAgICAgICwgaWZ0dHQ6IHsgdXJsOiAnJywgbWV0aG9kOiAnR0VUJywgYXV0aDogeyBrZXk6ICcnLCB2YWx1ZTogJycgfSwgc3RhdHVzOiAnJyB9XG4gICAgICAgICwgaW5mbHV4ZGI6IHsgdXJsOiAnJywgcG9ydDogJycsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6IFtdLCBzdGF0dXM6ICcnIH1cbiAgICAgICAgLCBhcHA6IHsgZW1haWw6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJyB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxpZnR0dDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdNYXNoJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ0JvaWwnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTInLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMTgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdCTVAyODAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICB2YXIga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonVGVtcCcsJ3R5cGUnOidhaXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonU29pbCcsJ3R5cGUnOidzZWVkbGluZycsJ3RhcmdldCc6NjAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidQbGFudCcsJ3R5cGUnOidjYW5uYWJpcycsJ3RhcmdldCc6NjAsJ2RpZmYnOjJ9XG4gICAgICBdO1xuICAgICAgaWYodHlwZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGtldHRsZXMsIHsndHlwZSc6IHR5cGV9KVswXTtcbiAgICAgIHJldHVybiBrZXR0bGVzO1xuICAgIH0sXG5cbiAgICBkb21haW46IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBkb21haW4gPSAnaHR0cDovL2FyZHVpbm8ubG9jYWwnO1xuXG4gICAgICBpZihhcmR1aW5vICYmIGFyZHVpbm8udXJsKXtcbiAgICAgICAgZG9tYWluID0gKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykgIT09IC0xKSA/XG4gICAgICAgICAgYXJkdWluby51cmwuc3Vic3RyKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykrMikgOlxuICAgICAgICAgIGFyZHVpbm8udXJsO1xuXG4gICAgICAgIGlmKEJvb2xlYW4oYXJkdWluby5zZWN1cmUpKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vLCByZXR1cm5fdmVyc2lvbil7XG4gICAgICBpZihyZXR1cm5fdmVyc2lvbil7XG4gICAgICAgIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCczMicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzMyJztcbiAgICAgICAgZWxzZSBpZihhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignODI2NicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzgyNjYnO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIEJvb2xlYW4oYXJkdWlubyAmJiBhcmR1aW5vLmJvYXJkICYmIChhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZXNwJykgIT09IC0xIHx8IGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub2RlbWN1JykgIT09IC0xKSk7XG4gICAgfSxcbiAgXG4gICAgc2xhY2s6IGZ1bmN0aW9uKHdlYmhvb2tfdXJsLCBtc2csIGNvbG9yLCBpY29uLCBrZXR0bGUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICB2YXIgcG9zdE9iaiA9IHsnYXR0YWNobWVudHMnOiBbeydmYWxsYmFjayc6IG1zZyxcbiAgICAgICAgICAgICd0aXRsZSc6IGtldHRsZS5uYW1lLFxuICAgICAgICAgICAgJ3RpdGxlX2xpbmsnOiAnaHR0cDovLycrZG9jdW1lbnQubG9jYXRpb24uaG9zdCxcbiAgICAgICAgICAgICdmaWVsZHMnOiBbeyd2YWx1ZSc6IG1zZ31dLFxuICAgICAgICAgICAgJ2NvbG9yJzogY29sb3IsXG4gICAgICAgICAgICAnbXJrZHduX2luJzogWyd0ZXh0JywgJ2ZhbGxiYWNrJywgJ2ZpZWxkcyddLFxuICAgICAgICAgICAgJ3RodW1iX3VybCc6IGljb25cbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAkaHR0cCh7dXJsOiB3ZWJob29rX3VybCwgbWV0aG9kOidQT1NUJywgZGF0YTogJ3BheWxvYWQ9JytKU09OLnN0cmluZ2lmeShwb3N0T2JqKSwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY29ubmVjdDogZnVuY3Rpb24oYXJkdWlubywgZW5kcG9pbnQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pICsgJy9hcmR1aW5vLycgKyBlbmRwb2ludDtcbiAgICAgIC8vIGV4dGVuZGVkIGluZm9cbiAgICAgIGlmIChlbmRwb2ludCA9PSAnaW5mby1leHQnKVxuICAgICAgICB1cmwgPSB0aGlzLmRvbWFpbihhcmR1aW5vKSArICcvaW5mbyc7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IDEwMDAwfTtcbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykpXG4gICAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gVGhlcm1pc3RvciwgRFMxOEIyMCwgb3IgUFQxMDBcbiAgICAvLyBodHRwczovL2xlYXJuLmFkYWZydWl0LmNvbS90aGVybWlzdG9yL3VzaW5nLWEtdGhlcm1pc3RvclxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzM4MSlcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMjkwIGFuZCBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMzI4XG4gICAgdGVtcDogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vJytrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQScpID09PSAwKVxuICAgICAgICAgIHVybCArPSAnP2FwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB1cmwgKz0gJz9kcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLnZjYykgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZkcGluPScra2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC52Y2MpICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZihCb29sZWFuKGtldHRsZS50ZW1wLmluZGV4KSkgLy9EUzE4QjIwIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmaW5kZXg9JytrZXR0bGUudGVtcC5pbmRleDtcbiAgICAgICAgdXJsICs9ICcvJytrZXR0bGUudGVtcC5waW47XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG4gICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfTtcbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpO1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/YXBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3I7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MudHBsaW5rLnRva2VuKXtcbiAgICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICAgIHJldHVybiB1cmwrJy8/JytqUXVlcnkucGFyYW0ocGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9LFxuICAgICAgICBsb2dpbjogKHVzZXIscGFzcykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZighdXNlciB8fCAhcGFzcylcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCBMb2dpbicpO1xuICAgICAgICAgIGNvbnN0IGxvZ2luX3BheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOiBcImxvZ2luXCIsXG4gICAgICAgICAgICBcInVybFwiOiB1cmwsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiYXBwVHlwZVwiOiBcIkthc2FfQW5kcm9pZFwiLFxuICAgICAgICAgICAgICBcImNsb3VkUGFzc3dvcmRcIjogcGFzcyxcbiAgICAgICAgICAgICAgXCJjbG91ZFVzZXJOYW1lXCI6IHVzZXIsXG4gICAgICAgICAgICAgIFwidGVybWluYWxVVUlEXCI6IHBhcmFtcy50ZXJtSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShsb2dpbl9wYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlblxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnJlc3VsdCl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdG9rZW4gPSB0b2tlbiB8fCBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7dG9rZW46IHRva2VufSxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6IFwiZ2V0RGV2aWNlTGlzdFwiIH0pLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjb21tYW5kOiAoZGV2aWNlLCBjb21tYW5kKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdmFyIHRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjpcInBhc3N0aHJvdWdoXCIsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiZGV2aWNlSWRcIjogZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgICAgICBcInJlcXVlc3REYXRhXCI6IEpTT04uc3RyaW5naWZ5KCBjb21tYW5kIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHNldCB0aGUgdG9rZW5cbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICBwYXJhbXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBkZXZpY2UuYXBwU2VydmVyVXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogKGRldmljZSwgdG9nZ2xlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiB0b2dnbGUgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGlmdHR0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25maWc6IChkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5pZnR0dC5hdXRoLmtleSAmJiBzZXR0aW5ncy5pZnR0dC5hdXRoLnZhbHVlKSB7XG4gICAgICAgICAgICBoZWFkZXJzW3NldHRpbmdzLmlmdHR0LmF1dGgua2V5XSA9IHNldHRpbmdzLmlmdHR0LmF1dGgudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBodHRwID0ge1xuICAgICAgICAgICAgdXJsOiBzZXR0aW5ncy5pZnR0dC51cmwsXG4gICAgICAgICAgICBtZXRob2Q6IHNldHRpbmdzLmlmdHR0Lm1ldGhvZCxcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5pZnR0dC5tZXRob2QgPT0gJ0dFVCcpXG4gICAgICAgICAgICBodHRwLnBhcmFtcyA9IGRhdGE7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaHR0cC5kYXRhID0gZGF0YTtcbiAgICAgICAgICByZXR1cm4gaHR0cDtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIGRhdGEgPSB7ICdicmV3YmVuY2gnOiB0cnVlIH07XG4gICAgICAgICAgdmFyIGh0dHBfY29uZmlnID0gdGhpcy5pZnR0dCgpLmNvbmZpZyhkYXRhKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoIWh0dHBfY29uZmlnLnVybCkge1xuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdNaXNzaW5nIFVSTCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAkaHR0cChodHRwX2NvbmZpZylcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cykge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShgQ29ubmVjdGlvbiBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBzZW5kOiAoZGF0YSkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgaHR0cF9jb25maWcgPSB0aGlzLmlmdHR0KCkuY29uZmlnKGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaHR0cF9jb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ01pc3NpbmcgVVJMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgICRodHRwKGh0dHBfY29uZmlnKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKGBDb25uZWN0aW9uIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGFwcDogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6ICdodHRwczovL3NlbnNvci5icmV3YmVuY2guY28vJywgaGVhZGVyczoge30sIHRpbWVvdXQ6IDEwMDAwfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXV0aDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5hcHAuYXBpX2tleSAmJiBzZXR0aW5ncy5hcHAuZW1haWwpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gYHVzZXJzLyR7c2V0dGluZ3MuYXBwLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtFWSddID0gYCR7c2V0dGluZ3MuYXBwLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktRU1BSUwnXSA9IGAke3NldHRpbmdzLmFwcC5lbWFpbH1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5zdWNjZXNzKVxuICAgICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICBxLnJlamVjdChcIlVzZXIgbm90IGZvdW5kXCIpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZihCb29sZWFuKHNldHRpbmdzLmluZmx1eGRiLnBvcnQpKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6IChpbmZsdXhkYikgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVybCl7XG4gICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uID0gYCR7aW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgICBpZihCb29sZWFuKGluZmx1eGRiLnBvcnQpKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdzaG93IGRhdGFiYXNlcycpfWAsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzICl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6IEJvb2xlYW4ob3B0aW9ucy5zZXNzaW9uKSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBCb29sZWFuKG9wdGlvbnMuc2Vzc2lvbikgPyBvcHRpb25zLnNlc3Npb24gOiAnJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTW9uaXRvcicsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG4gICAgICAgICAgICAgIGludGVycG9sYXRlOiAnYmFzaXMnLFxuICAgICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBrZXk6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLm5hbWUgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpc0FyZWE6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBCb29sZWFuKG9wdGlvbnMuY2hhcnQuYXJlYSkgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKEJvb2xlYW4ob3B0aW9ucy5jaGFydC5taWxpdGFyeSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVIOiVNOiVTJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUyVwJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnYm90dG9tJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tQYWRkaW5nOiAyMCxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiA0MCxcbiAgICAgICAgICAgICAgICAgIHN0YWdnZXJMYWJlbHM6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZm9yY2VZOiAoIW9wdGlvbnMudW5pdCB8fCBvcHRpb25zLnVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGQsMCkrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uIChwbGF0bykge1xuICAgICAgaWYgKCFwbGF0bykgcmV0dXJuICcnO1xuICAgICAgdmFyIHNnID0gKDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoKHBsYXRvIC8gMjU4LjIpICogMjI3LjEpKSkpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpLnRvRml4ZWQoMyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24gKHNnKSB7XG4gICAgICBpZiAoIXNnKSByZXR1cm4gJyc7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0bykudG9GaXhlZCgyKTs7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX05BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfQlJFV0VSKSlcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSkpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKSl7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKSl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgdmFyIG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5OQU1FKSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQ0FURUdPUlkpKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoQm9vbGVhbihyZWNpcGUuRl9SX0RBVEUpKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuQlJFV0VSKSlcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRykpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLklCVSkpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5BQlZfTUFYKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NSU4pKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRkVSTUVOVEFCTEVTKSl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5IT1BTKSl7XG4gICAgICAgIHZhciBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuTUlTQ1MpKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuWUVBU1RTKSl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==