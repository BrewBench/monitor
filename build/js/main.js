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
        status: { error: '', dt: '', message: '' }
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
      _.each($scope.kettles, function (kettle) {
        if (kettle.arduino && kettle.arduino.id == arduino.id) kettle.arduino = arduino;
      });
    },
    delete: function _delete(index, arduino) {
      $scope.settings.arduinos.splice(index, 1);
      _.each($scope.kettles, function (kettle) {
        if (kettle.arduino && kettle.arduino.id == arduino.id) delete kettle.arduino;
      });
    },
    connect: function connect(arduino) {
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
    reboot: function reboot(arduino) {
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
        arduinos: [{ id: 'local-' + btoa('brewbench'), board: '', RSSI: false, url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '', message: '' } }],
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
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.general.pollSeconds * 10000 };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiYXBwIiwiZW1haWwiLCJhcGlfa2V5Iiwic3RhdHVzIiwiZ2VuZXJhbCIsImNoYXJ0T3B0aW9ucyIsInVuaXQiLCJjaGFydCIsImRlZmF1bHRLZXR0bGVzIiwib3BlblNrZXRjaGVzIiwiJCIsIm1vZGFsIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJjaGFuZ2VBcmR1aW5vIiwiYXJkdWlubyIsImFyZHVpbm9zIiwiaXNFU1AiLCJhbmFsb2ciLCJkaWdpdGFsIiwidG91Y2giLCJlYWNoIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFN0YXR1c0NsYXNzIiwiZW5kc1dpdGgiLCJnZXRQb3J0UmFuZ2UiLCJudW1iZXIiLCJBcnJheSIsImZpbGwiLCJtYXAiLCJpZHgiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsIlJTU0kiLCJhZGMiLCJzZWN1cmUiLCJ2ZXJzaW9uIiwiZHQiLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJjb25uZWN0IiwidGhlbiIsImluZm8iLCJCcmV3QmVuY2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsInVzZXIiLCJwYXNzIiwidG9rZW4iLCJwbHVncyIsImxvZ2luIiwicmVzcG9uc2UiLCJzY2FuIiwiZXJyb3JfY29kZSIsIm1zZyIsInNldEVycm9yTWVzc2FnZSIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiaWZ0dHQiLCJhdXRoIiwia2V5IiwiYWRkS2V0dGxlIiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwidmNjIiwiaGl0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwiY291bnQiLCJub3RpZnkiLCJzbGFjayIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJoZWF0SXNPbiIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjaGFuZ2VTZW5zb3IiLCJzZW5zb3JUeXBlcyIsInBlcmNlbnQiLCJpbmZsdXhkYiIsInJlbW92ZSIsImRlZmF1bHRTZXR0aW5ncyIsInBpbmciLCJyZW1vdmVDbGFzcyIsImRicyIsImNvbmNhdCIsImFwcGx5IiwiZGIiLCJhZGRDbGFzcyIsImNyZWF0ZSIsIm1vbWVudCIsImZvcm1hdCIsImNyZWF0ZWQiLCJjcmVhdGVEQiIsImRhdGEiLCJyZXN1bHRzIiwicmVzZXRFcnJvciIsImNvbm5lY3RlZCIsImNvbnNvbGUiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiYnJld2VyIiwiZ3JhaW4iLCJsYWJlbCIsImFtb3VudCIsImFkZFRpbWVyIiwibm90ZXMiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0b29sdGlwIiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJ0ZXh0Iiwic2hvdyIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidHJ1c3RBc0h0bWwiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJzaGlmdCIsImFsdGl0dWRlIiwicHJlc3N1cmUiLCJjdXJyZW50VmFsdWUiLCJ1bml0VHlwZSIsImdldFRpbWUiLCJzdWJUZXh0IiwiY29sb3IiLCJnZXROYXZPZmZzZXQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGVhdFNhZmV0eSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIm9uIiwiTWF0aCIsInJvdW5kIiwib2ZmIiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImNvbXBpbGVTa2V0Y2giLCJza2V0Y2hOYW1lIiwic2Vuc29ycyIsInNrZXRjaGVzIiwiYXJkdWlub05hbWUiLCJjdXJyZW50U2tldGNoIiwiYWN0aW9ucyIsInBpbnMiLCJ0cmlnZ2VycyIsImJmIiwiREhUIiwiRFMxOEIyMCIsIkJNUCIsImtldHRsZVR5cGUiLCJ1bnNoaWZ0IiwiYSIsInRvTG93ZXJDYXNlIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsIm5vdGlmaWNhdGlvbnMiLCJtZDUiLCJ0cmltIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiVEhDIiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJsb3ciLCJoaWdoIiwibGFzdCIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsImFsZXJ0IiwicGxheSIsImNsb3NlIiwiTm90aWZpY2F0aW9uIiwicGVybWlzc2lvbiIsInJlcXVlc3RQZXJtaXNzaW9uIiwic2VuZCIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsImNoYW5nZVVuaXRzIiwidiIsInRpbWVyUnVuIiwibmV4dFRpbWVyIiwiY2FuY2VsIiwiaW50ZXJ2YWwiLCJwcm9jZXNzVGVtcHMiLCJhbGxTZW5zb3JzIiwicG9sbFNlY29uZHMiLCJyZW1vdmVLZXR0bGUiLCIkaW5kZXgiLCJjb25maXJtIiwiY2xlYXJLZXR0bGUiLCJjaGFuZ2VWYWx1ZSIsImZpZWxkIiwibG9hZGVkIiwidXBkYXRlTG9jYWwiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJjaGFuZ2UiLCJlbnRlciIsInBsYWNlaG9sZGVyIiwidGVtcGxhdGUiLCJsaW5rIiwiYXR0cnMiLCJlZGl0IiwiYmluZCIsIiRhcHBseSIsImNoYXJDb2RlIiwia2V5Q29kZSIsIm5nRW50ZXIiLCIkcGFyc2UiLCJmbiIsIm9uUmVhZEZpbGUiLCJvbkNoYW5nZUV2ZW50IiwicmVhZGVyIiwiRmlsZVJlYWRlciIsImZpbGUiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImRlYnVnIiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJlbmFibGVkIiwiZm9udCIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0IiwicGFzc3dvcmQiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJBdXRob3JpemF0aW9uIiwiZGlnaXRhbFJlYWQiLCJwYXJhbXMiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsImh0dHAiLCJodHRwX2NvbmZpZyIsInN1Y2Nlc3MiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsImxuIiwibG9nIiwia2VsdmluIiwic3RlaW5oYXJ0IiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwic2Vzc2lvbiIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdCQUFjRyxRQUFkLENBQXVCRSxPQUF2QixDQUErQkMsTUFBL0IsR0FBd0MsZ0NBQXhDO0FBQ0EsU0FBT04s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QTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkE3aEIsUUFBRThCLElBQUYsQ0FBTzZmLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVE5aEIsT0FBUixDQUFnQmtpQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUS9oQixPQUFSLENBQWdCc1gsT0FBTzZLLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBaC9DSSxHQUFQO0FBay9DRCxDQXIvQ0QsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpTbGlkZXInXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICB3aW5kb3cubG9jYXRpb24uaHJlZj0nLyc7XG59O1xuXG5pZiggJHN0YXRlLmN1cnJlbnQubmFtZSA9PSAncmVzZXQnKVxuICAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuXG52YXIgbm90aWZpY2F0aW9uID0gbnVsbDtcbnZhciByZXNldENoYXJ0ID0gMTAwO1xudmFyIHRpbWVvdXQgPSBudWxsOyAvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuQnJld1NlcnZpY2UgPSBCcmV3U2VydmljZTtcbiRzY29wZS5zaXRlID0ge2h0dHBzOiBCb29sZWFuKGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sPT0naHR0cHM6JylcbiAgLCBodHRwc191cmw6IGBodHRwczovLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH1gXG59O1xuJHNjb3BlLmVzcCA9IHtcbiAgdHlwZTogJycsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJ2JiZXNwJyxcbiAgYXJkdWlub19wYXNzOiAnYmJhZG1pbicsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZihsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG5pZiAoISRzY29wZS5zZXR0aW5ncy5hcHApXG4gICRzY29wZS5zZXR0aW5ncy5hcHAgPSB7IGVtYWlsOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycgfTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnR9KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuXG4kc2NvcGUub3BlblNrZXRjaGVzID0gZnVuY3Rpb24oKXtcbiAgJCgnI3NldHRpbmdzTW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAkKCcjc2tldGNoZXNNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG59O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtQnkob2JqLCdhbW91bnQnKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VBcmR1aW5vID0gZnVuY3Rpb24gKGtldHRsZSkge1xuICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gIGlmIChCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubywgdHJ1ZSkgPT0gJzMyJykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gIH0gZWxzZSBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICc4MjY2Jykge1xuICAgIGtldHRsZS5hcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAga2V0dGxlLmFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICB9XG59O1xuLy8gY2hlY2sga2V0dGxlIHR5cGUgcG9ydHNcbl8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgfVxufSk7XG4gIFxuLy8gaW5pdCBjYWxjIHZhbHVlc1xuJHNjb3BlLnVwZGF0ZUFCViA9IGZ1bmN0aW9uKCl7XG4gIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbihCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpXG4gICAgICAsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidihCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidixCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKVxuICAgICAgLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgfVxufTtcblxuJHNjb3BlLmNoYW5nZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kID0gbWV0aG9kO1xuICAkc2NvcGUudXBkYXRlQUJWKCk7XG59O1xuXG4kc2NvcGUuY2hhbmdlU2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGUgPSBzY2FsZTtcbiAgaWYoc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9XG59O1xuXG4kc2NvcGUuZ2V0U3RhdHVzQ2xhc3MgPSBmdW5jdGlvbihzdGF0dXMpe1xuICBpZihzdGF0dXMgPT0gJ0Nvbm5lY3RlZCcpXG4gICAgcmV0dXJuICdzdWNjZXNzJztcbiAgZWxzZSBpZihfLmVuZHNXaXRoKHN0YXR1cywnaW5nJykpXG4gICAgcmV0dXJuICdzZWNvbmRhcnknO1xuICBlbHNlXG4gICAgcmV0dXJuICdkYW5nZXInO1xufVxuXG4kc2NvcGUudXBkYXRlQUJWKCk7XG5cbiAgJHNjb3BlLmdldFBvcnRSYW5nZSA9IGZ1bmN0aW9uKG51bWJlcil7XG4gICAgICBudW1iZXIrKztcbiAgICAgIHJldHVybiBBcnJheShudW1iZXIpLmZpbGwoKS5tYXAoKF8sIGlkeCkgPT4gMCArIGlkeCk7XG4gIH07XG5cbiAgJHNjb3BlLmFyZHVpbm9zID0ge1xuICAgIGFkZDogKCkgPT4ge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zKSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICBib2FyZDogJycsXG4gICAgICAgIFJTU0k6IGZhbHNlLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHtlcnJvcjogJycsZHQ6ICcnLG1lc3NhZ2U6Jyd9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgICBpZiAoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8sIHRydWUpID09ICczMicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICB9IGVsc2UgaWYgKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpIHtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSBhcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IChpbmRleCwgYXJkdWlubykgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAgZGVsZXRlIGtldHRsZS5hcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoYXJkdWlubykgPT4ge1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mbycpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5CcmV3QmVuY2gpe1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDAgfHwgYXJkdWluby5ib2FyZC5pbmRleE9mKCdOb2RlTUNVXzMyUycpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZWJvb3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ3JlYm9vdCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9ICcnO1xuICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290IFN1Y2Nlc3MsIHRyeSBjb25uZWN0aW5nIGluIGEgZmV3IHNlY29uZHMuJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKHBrZy52ZXJzaW9uIDwgNC4yKVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdVcGdyYWRlIHRvIHN1cHBvcnQgcmVib290JztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgY2xlYXI6ICgpID0+IHsgXG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rID0geyB1c2VyOiAnJywgcGFzczogJycsIHRva2VuOiAnJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdIH07XG4gICAgfSxcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfSBlbHNlIGlmKHJlc3BvbnNlLmVycm9yX2NvZGUgJiYgcmVzcG9uc2UubXNnKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UocmVzcG9uc2UubXNnKTsgIFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnU2Nhbm5pbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZihCb29sZWFuKHBsdWcuc3RhdHVzKSl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIHBsdWcuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICB2YXIgb2ZmT3JPbiA9IGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEgPyAwIDogMTtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnRvZ2dsZShkZXZpY2UsIG9mZk9yT24pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IG9mZk9yT247XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pLnRoZW4odG9nZ2xlUmVzcG9uc2UgPT4ge1xuICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmZvXG4gICAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgIGRldmljZS5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmlmdHR0ID0ge1xuICAgIGNsZWFyOiAoKSA9PiB7IFxuICAgICAgJHNjb3BlLnNldHRpbmdzLmlmdHR0ID0geyB1cmw6ICcnLCBtZXRob2Q6ICdHRVQnLCBhdXRoOiB7IGtleTogJycsIHZhbHVlOiAnJyB9LCBzdGF0dXM6ICcnIH07XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaWZ0dHQoKS5jb25uZWN0KClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pZnR0dC5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICB9O1xuICBcbiAgJHNjb3BlLmFkZEtldHRsZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIGlmKCEkc2NvcGUua2V0dGxlcykgJHNjb3BlLmtldHRsZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGggPyAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF0gOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9O1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiB0eXBlID8gXy5maW5kKCRzY29wZS5rZXR0bGVUeXBlcyx7dHlwZTogdHlwZX0pLm5hbWUgOiAkc2NvcGUua2V0dGxlVHlwZXNbMF0ubmFtZVxuICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxpZnR0dDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiBhcmR1aW5vXG4gICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuICBcbiAgJHNjb3BlLmhlYXRJc09uID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBCb29sZWFuKF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnaGVhdGVyJzogeydydW5uaW5nJzogdHJ1ZX19KS5sZW5ndGgpO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24oYXJkdWlubywgcGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2UgaWYoQnJld1NlcnZpY2UuaXNFU1AoYXJkdWlubykpe1xuICAgICAgICBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdEJywnR1BJTycpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdBJywnR1BJTycpLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGluO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKFxuICAgICAgICAgIChrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLnRlbXAudmNjPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlU2Vuc29yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpKXtcbiAgICAgIGtldHRsZS5rbm9iLnVuaXQgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLnVuaXQgPSAnXFx1MDBCMCc7XG4gICAgfVxuICAgIGtldHRsZS50ZW1wLnZjYyA9ICcnO1xuICAgIGtldHRsZS50ZW1wLmluZGV4ID0gJyc7XG4gIH07XG5cbiAgJHNjb3BlLmluZmx1eGRiID0ge1xuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIgPSBkZWZhdWx0U2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQgfHwgcmVzcG9uc2Uuc3RhdHVzID09IDIwMCl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFwcCA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSAmJlxuICAgICAgICBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPT0gJ0Nvbm5lY3RlZCdcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IGRlZmF1bHRTZXR0aW5ncy5hcHA7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSB8fCAhQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkpKVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5hcHAoKS5hdXRoKClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5hcHAuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoQm9vbGVhbihmb3JtYXR0ZWRfY29udGVudCkpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoQm9vbGVhbihqc29uT2JqLlJlY2lwZXMpICYmIEJvb2xlYW4oanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoQm9vbGVhbihqc29uT2JqLlNlbGVjdGlvbnMpICYmIEJvb2xlYW4oanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKEJvb2xlYW4oanNvbk9iai5SRUNJUEVTKSAmJiBCb29sZWFuKGpzb25PYmouUkVDSVBFUy5SRUNJUEUpKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUub2cpKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuZmcpKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChncmFpbi5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogZ3JhaW4ubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChncmFpbi5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChob3AuYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBob3AubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChob3AuYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5wa2coKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucGtnID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuZ3JhaW5zKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKHtcbiAgICAgIGFuaW1hdGVkOiAnZmFkZScsXG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgICBodG1sOiB0cnVlXG4gICAgfSk7XG4gICAgaWYoJCgnI2dpdGNvbW1pdCBhJykudGV4dCgpICE9ICdnaXRfY29tbWl0Jyl7XG4gICAgICAkKCcjZ2l0Y29tbWl0Jykuc2hvdygpO1xuICAgIH1cbiAgICBcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRpbWVycykgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUsIGxvY2F0aW9uKXsgICAgXG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZihCb29sZWFuKGVyci5zdGF0dXNUZXh0KSlcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihtZXNzYWdlKSl7XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdkYW5nZXInO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICBpZihsb2NhdGlvbilcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBtZXNzYWdlKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3IgY29ubmVjdGluZyB0byAke0JyZXdTZXJ2aWNlLmRvbWFpbihrZXR0bGUuYXJkdWlubyl9YCk7XG4gICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ0Nvbm5lY3Rpb24gZXJyb3I6Jyk7XG4gICAgICB9XG4gICAgXG4gIH07XG4gICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzID0gZnVuY3Rpb24ocmVzcG9uc2UsIGVycm9yKXtcbiAgICB2YXIgYXJkdWlubyA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywge2lkOiByZXNwb25zZS5rZXR0bGUuYXJkdWluby5pZH0pO1xuICAgIGlmKGFyZHVpbm8ubGVuZ3RoKXtcbiAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICBhcmR1aW5vWzBdLnZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIGlmKGVycm9yKVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9IGVycm9yO1xuICAgICAgZWxzZVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2Upe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgLy8gbmVlZGVkIGZvciBjaGFydHNcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlLm5hbWU7XG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vdXBkYXRlIGRhdGF0eXBlXG4gICAgcmVzcG9uc2UudGVtcCA9IHBhcnNlRmxvYXQocmVzcG9uc2UudGVtcCk7XG4gICAgcmVzcG9uc2UucmF3ID0gcGFyc2VGbG9hdChyZXNwb25zZS5yYXcpO1xuICAgIGlmKHJlc3BvbnNlLnZvbHRzKVxuICAgICAgcmVzcG9uc2Uudm9sdHMgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnZvbHRzKTtcblxuICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuY3VycmVudCkpXG4gICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgICRmaWx0ZXIoJ3JvdW5kJykocmVzcG9uc2UudGVtcCwgMik7XG4gICAgXG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcigncm91bmQnKShwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSwgMCk7ICAgIFxuICAgIC8vIHNldCByYXdcbiAgICBrZXR0bGUudGVtcC5yYXcgPSByZXNwb25zZS5yYXc7XG4gICAga2V0dGxlLnRlbXAudm9sdHMgPSByZXNwb25zZS52b2x0cztcblxuICAgIC8vIHZvbHQgY2hlY2tcbiAgICBpZiAoa2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMTgwJyAmJlxuICAgICAga2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMjgwJyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnZvbHRzICYmXG4gICAgICAha2V0dGxlLnRlbXAucmF3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdEUzE4QjIwJyAmJlxuICAgICAgcmVzcG9uc2UudGVtcCA9PSAtMTI3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcy5zaGlmdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQgc2Vuc29ycyBoYXZlIGh1bWlkaXR5IGFzIGEgcGVyY2VudFxuICAgIC8vU29pbE1vaXN0dXJlRCBoYXMgbW9pc3R1cmUgYXMgYSBwZXJjZW50XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5wZXJjZW50ID0gJGZpbHRlcigncm91bmQnKShyZXNwb25zZS5wZXJjZW50LDApO1xuICAgIH1cbiAgICAvLyBCTVAgc2Vuc29ycyBoYXZlIGFsdGl0dWRlIGFuZCBwcmVzc3VyZVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuYWx0aXR1ZGUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLmFsdGl0dWRlID0gcmVzcG9uc2UuYWx0aXR1ZGU7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucHJlc3N1cmUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgLy8gcGFzY2FsIHRvIGluY2hlcyBvZiBtZXJjdXJ5XG4gICAgICBrZXR0bGUucHJlc3N1cmUgPSByZXNwb25zZS5wcmVzc3VyZSAvIDMzODYuMzg5O1xuICAgIH1cblxuICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlLCBza2V0Y2hfdmVyc2lvbjpyZXNwb25zZS5za2V0Y2hfdmVyc2lvbn0pO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihCb29sZWFuKEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoY3VycmVudFZhbHVlIDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdGFydCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gtYWx0JykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICB2YXIgaztcbiAgICB2YXIgaGVhdElzT24gPSAkc2NvcGUuaGVhdElzT24oKTtcbiAgICBcbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICBpZiAoaXRlbSA9PSAnaGVhdCcgJiYgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuaGVhdFNhZmV0eSAmJiBoZWF0SXNPbikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdBIGhlYXRlciBpcyBhbHJlYWR5IHJ1bm5pbmcuJywga2V0dGxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG4gICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmhhc1NrZXRjaGVzID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICB2YXIgaGFzQVNrZXRjaCA9IGZhbHNlO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgIGlmKChrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKSB8fFxuICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCkgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFja1xuICAgICAgKSB7XG4gICAgICAgIGhhc0FTa2V0Y2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBoYXNBU2tldGNoO1xuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKGtldHRsZS5hY3RpdmUpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnc3RhcnRpbmcuLi4nO1xuXG4gICAgICAgIEJyZXdTZXJ2aWNlLnRlbXAoa2V0dGxlKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCBrZXR0bGUpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdWRwYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudCsrO1xuICAgICAgICAgICAgaWYoa2V0dGxlLm1lc3NhZ2UuY291bnQ9PTcpXG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSByZWxheXNcbiAgICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAgICAgIGlmKGtldHRsZS5wdW1wKSBrZXR0bGUucHVtcC5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5oZWF0ZXIpIGtldHRsZS5oZWF0ZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuY29vbGVyKSBrZXR0bGUuY29vbGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUmVsYXkgPSBmdW5jdGlvbihrZXR0bGUsIGVsZW1lbnQsIG9uKXtcbiAgICBpZihvbikge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20pe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sTWF0aC5yb3VuZCgyNTUqZWxlbWVudC5kdXR5Q3ljbGUvMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSBpZihlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwyNTUpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDEpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20gfHwgZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS5pbXBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcbiAgICB0cnkge1xuICAgICAgdmFyIHByb2ZpbGVDb250ZW50ID0gSlNPTi5wYXJzZSgkZmlsZUNvbnRlbnQpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzID0gcHJvZmlsZUNvbnRlbnQuc2V0dGluZ3MgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5rZXR0bGVzID0gcHJvZmlsZUNvbnRlbnQua2V0dGxlcyB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAvLyBlcnJvciBpbXBvcnRpbmdcbiAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5leHBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGtldHRsZXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmtldHRsZXMpO1xuICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBrZXR0bGVzW2ldLnZhbHVlcyA9IFtdO1xuICAgICAga2V0dGxlc1tpXS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHtcInNldHRpbmdzXCI6ICRzY29wZS5zZXR0aW5ncyxcImtldHRsZXNcIjoga2V0dGxlc30pKTtcbiAgfTtcblxuICAkc2NvcGUuY29tcGlsZVNrZXRjaCA9IGZ1bmN0aW9uKHNrZXRjaE5hbWUpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zZW5zb3JzID0ge307XG4gICAgLy8gYXBwZW5kIGVzcCB0eXBlXG4gICAgaWYoc2tldGNoTmFtZS5pbmRleE9mKCdFU1AnKSAhPT0gLTEgJiYgIXNrZXRjaE5hbWUuaW5kZXhPZignRVNQMzInKSA9PT0gLTEpXG4gICAgICBza2V0Y2hOYW1lICs9ICRzY29wZS5lc3AudHlwZTtcbiAgICB2YXIgc2tldGNoZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8gPyBrZXR0bGUuYXJkdWluby51cmwucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikgOiAnRGVmYXVsdCc7XG4gICAgICB2YXIgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTogYXJkdWlub05hbWV9KTtcbiAgICAgIGlmKCFjdXJyZW50U2tldGNoKXtcbiAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgdHlwZTogc2tldGNoTmFtZSxcbiAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICBwaW5zOiBbXSxcbiAgICAgICAgICBoZWFkZXJzOiBbXSxcbiAgICAgICAgICB0cmlnZ2VyczogZmFsc2UsXG4gICAgICAgICAgYmY6IChza2V0Y2hOYW1lLmluZGV4T2YoJ0JGJykgIT09IC0xKSA/IHRydWUgOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgfVxuICAgICAgdmFyIHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmIEJvb2xlYW4oa2V0dGxlLnRlbXAuYWRqdXN0KSkgPyAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJiAkc2NvcGUuZXNwLmF1dG9jb25uZWN0KXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBdXRvQ29ubmVjdC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xIHx8IEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSkgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZWVnZWUtdG9reW8vREhUZXNwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpO1xuICAgICAgfSBlbHNlIGlmKCFCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRsaWItMS4yLjkuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRTMThCMjAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDE4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDI4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYWRhZnJ1aXQvQWRhZnJ1aXRfQURTMVgxNScpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCB0aGUgYWN0aW9ucyBjb21tYW5kXG4gICAgICB2YXIga2V0dGxlVHlwZSA9IGtldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZiAoa2V0dGxlLnRlbXAudmNjKVxuICAgICAgICBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIFxuICAgICAgaWYgKGtldHRsZS50ZW1wLmluZGV4KSBrZXR0bGVUeXBlICs9ICctJyArIGtldHRsZS50ZW1wLmluZGV4OyAgICAgIFxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc0NvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpO1xuICAgICAgLy8gdXNlZCBmb3IgaW5mbyBlbmRwb2ludFxuICAgICAgY3VycmVudFNrZXRjaC5waW5zLnB1c2goJyBwaW5zICs9IFwie1xcXFxcIm5hbWVcXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS5uYW1lKydcIikgKyBcIlxcXFxcIixcXFxcXCJwaW5cXFxcXCI6XFxcXFwiXCIgKyBTdHJpbmcoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpICsgXCJcXFxcXCIsXFxcXFwidHlwZVxcXFxcIjpcXFxcXCJcIiArIFN0cmluZyhcIicra2V0dGxlVHlwZSsnXCIpICsgXCJcXFxcXCIsXFxcXFwiYWRqdXN0XFxcXFwiOlxcXFxcIlwiICsgU3RyaW5nKFwiJythZGp1c3QrJ1wiKSArIFwiXFxcXFwifVwiOycpO1xuICAgICAgXG4gICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGtldHRsZS5wZXJjZW50KSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNQZXJjZW50Q29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnLUh1bWlkaXR5XCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTsgICAgICAgIFxuICAgICAgfVxuICAgICAgXG4gICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnK0Jvb2xlYW4oa2V0dGxlLm5vdGlmeS5zbGFjaykrJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnK0Jvb2xlYW4oa2V0dGxlLm5vdGlmeS5zbGFjaykrJyk7Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBpZiAoc2tldGNoLnRyaWdnZXJzIHx8IHNrZXRjaC5iZikge1xuICAgICAgICBpZiAoc2tldGNoLnR5cGUuaW5kZXhPZignTTUnKSA9PT0gLTEpIHtcbiAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCB0ZW1wID0gMC4wMDsnKTtcbiAgICAgICAgICBpZiAoc2tldGNoLmJmKSB7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCBhbWJpZW50ID0gMC4wMDsnKTtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGh1bWlkaXR5ID0gMC4wMDsnKTtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2NvbnN0IFN0cmluZyBlcXVpcG1lbnRfbmFtZSA9IFwiJyskc2NvcGUuc2V0dGluZ3MuYmYubmFtZSsnXCI7Jyk7ICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgYXV0b0NvbW1hbmQgXG4gICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmIChza2V0Y2guYmYgJiYgc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zUGVyY2VudENvbW1hbmQoJykgIT09IC0xICYmXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignaHVtaWRpdHknKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnLCAnaHVtaWRpdHkgPSBhY3Rpb25zUGVyY2VudENvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2guYmYgJiYgc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdhbWJpZW50JykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAvLyBCRiBsb2dpY1xuICAgICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAnYW1iaWVudCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEFsbCBvdGhlciBsb2dpY1xuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywgJ3RlbXAgPSBhY3Rpb25zQ29tbWFuZCgnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnBpbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIHBpbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW1BJTlNdJywgcGlucy5sZW5ndGggPyBwaW5zLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtIRUFERVJTXScsIGhlYWRlcnMubGVuZ3RoID8gaGVhZGVycy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtWRVJTSU9OXFxdL2csICRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1RQTElOS19DT05ORUNUSU9OXFxdL2csIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbU0xBQ0tfQ09OTkVDVElPTlxcXS9nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayk7XG5cbiAgICAgICAgLy8gRVNQIHZhcmlhYmxlc1xuICAgICAgICBpZihza2V0Y2guaW5kZXhPZignRVNQJykgIT09IC0xKXtcbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWQpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1NJRFxcXS9nLCAkc2NvcGUuZXNwLnNzaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWRfcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEX1BBU1NcXF0vZywgJHNjb3BlLmVzcC5zc2lkX3Bhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLmFyZHVpbm9fcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUkRVSU5PX1BBU1NcXF0vZywgbWQ1KCRzY29wZS5lc3AuYXJkdWlub19wYXNzKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJ2JiYWRtaW4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuaG9zdG5hbWUpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJHNjb3BlLmVzcC5ob3N0bmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csICdiYmVzcCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCBuYW1lLnJlcGxhY2UoJy5sb2NhbCcsJycpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ0FwcCcgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGFwcCBjb25uZWN0aW9uXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVBQX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkudHJpbSgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKCBza2V0Y2guaW5kZXhPZignQkZZdW4nICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBiZiBhcGkga2V5IGhlYWRlclxuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0JGX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYmYuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoIEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQpKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICAgICAgICBpZiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcikgJiYgQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcykpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmA7XG4gICAgICAgICAgLy8gYWRkIGRiXG4gICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuVEhDKSB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIFRIQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpICE9PSAtMSB8fCBoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERIVCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBBREMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAxODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAyODAuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAyODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoYXNUcmlnZ2Vycyl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy0nKyRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24rJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLm5vdGlmeSA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSAoa2V0dGxlICYmIGtldHRsZS50ZW1wKSA/IGtldHRsZS50ZW1wLmN1cnJlbnQgOiAwO1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJyskc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0O1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgaWYoQm9vbGVhbih0aW1lcikpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHRpbWVyLm5vdGVzKSlcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoQm9vbGVhbih0aW1lcikgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKChCb29sZWFuKHRpbWVyKSkgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2sgJiYgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gSUZUVFQgTm90aWZpY2F0aW9uXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5pZnR0dCkgJiYgJHNjb3BlLnNldHRpbmdzLmlmdHR0LnVybCAmJiAkc2NvcGUuc2V0dGluZ3MuaWZ0dHQudXJsLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5pZnR0dCgpLnNlbmQoe1xuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3I6IGNvbG9yLCAgICAgXG4gICAgICAgICAgdW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCxcbiAgICAgICAgICBuYW1lOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBrZXR0bGUudHlwZSxcbiAgICAgICAgICB0ZW1wOiBrZXR0bGUudGVtcCxcbiAgICAgICAgICBoZWF0ZXI6IGtldHRsZS5oZWF0ZXIsXG4gICAgICAgICAgcHVtcDoga2V0dGxlLnB1bXAsXG4gICAgICAgICAgY29vbGVyOiBrZXR0bGUuY29vbGVyIHx8IHt9LFxuICAgICAgICAgIGFyZHVpbm86IGtldHRsZS5hcmR1aW5vICAgICAgICAgIFxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBzZW5kaW5nIHRvIElGVFRUICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHNlbmRpbmcgdG8gSUZUVFQgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUubmFtZSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuYWRqdXN0KSl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0fSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggQm9vbGVhbihrZXR0bGUpICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZSkpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1cGRhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSxCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlS2V0dGxlID0gZnVuY3Rpb24gKGtldHRsZSwgJGluZGV4KSB7ICAgIFxuICAgIGlmKGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZW1vdmUgdGhpcyBrZXR0bGU/JykpXG4gICAgICAkc2NvcGUua2V0dGxlcy5zcGxpY2UoJGluZGV4LDEpO1xuICB9O1xuICBcbiAgJHNjb3BlLmNsZWFyS2V0dGxlID0gZnVuY3Rpb24gKGtldHRsZSwgJGluZGV4KSB7XG4gICAgJHNjb3BlLmtldHRsZXNbJGluZGV4XS52YWx1ZXMgPSBbXTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICBpZihmaWVsZCA9PSAnYWRqdXN0Jyl7XG4gICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICB9XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKEJvb2xlYW4obG9hZGVkKSlcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLCAkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLCAkc2NvcGUua2V0dGxlcyk7XG4gICAgICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbiAgICB9LCA1MDAwKTtcbiAgfTtcbiAgXG4gICRzY29wZS51cGRhdGVMb2NhbCgpO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gQm9vbGVhbihzY29wZS50eXBlKSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0ICAgIH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdkYm1QZXJjZW50JywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbihkYm0pe1xuICAgIHJldHVybiAyICogKGRibSArIDEwMCk7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDM1LjI3NCwgMik7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDIuMjA0NjIsIDIpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHsgZGVidWc6IGZhbHNlLCBwb2xsU2Vjb25kczogMTAsIHVuaXQ6ICdGJywgaGVhdFNhZmV0eTogZmFsc2UgfVxuICAgICAgICAsIGNoYXJ0OiB7IHNob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2UgfVxuICAgICAgICAsIHNlbnNvcnM6IHsgREhUOiBmYWxzZSwgRFMxOEIyMDogZmFsc2UsIEJNUDogZmFsc2UgfVxuICAgICAgICAsIHJlY2lwZTogeyAnbmFtZSc6ICcnLCAnYnJld2VyJzogeyBuYW1lOiAnJywgJ2VtYWlsJzogJycgfSwgJ3llYXN0JzogW10sICdob3BzJzogW10sICdncmFpbnMnOiBbXSwgc2NhbGU6ICdncmF2aXR5JywgbWV0aG9kOiAncGFwYXppYW4nLCAnb2cnOiAxLjA1MCwgJ2ZnJzogMS4wMTAsICdhYnYnOiAwLCAnYWJ3JzogMCwgJ2NhbG9yaWVzJzogMCwgJ2F0dGVudWF0aW9uJzogMCB9XG4gICAgICAgICwgbm90aWZpY2F0aW9uczogeyBvbjogdHJ1ZSwgdGltZXJzOiB0cnVlLCBoaWdoOiB0cnVlLCBsb3c6IHRydWUsIHRhcmdldDogdHJ1ZSwgc2xhY2s6ICcnLCBsYXN0OiAnJyB9XG4gICAgICAgICwgc291bmRzOiB7IG9uOiB0cnVlLCBhbGVydDogJy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLCB0aW1lcjogJy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMycgfVxuICAgICAgICAsIGFyZHVpbm9zOiBbeyBpZDogJ2xvY2FsLScgKyBidG9hKCdicmV3YmVuY2gnKSwgYm9hcmQ6ICcnLCBSU1NJOiBmYWxzZSwgdXJsOiAnYXJkdWluby5sb2NhbCcsIGFuYWxvZzogNSwgZGlnaXRhbDogMTMsIGFkYzogMCwgc2VjdXJlOiBmYWxzZSwgdmVyc2lvbjogJycsIHN0YXR1czogeyBlcnJvcjogJycsIGR0OiAnJywgbWVzc2FnZTogJycgfSB9XVxuICAgICAgICAsIHRwbGluazogeyB1c2VyOiAnJywgcGFzczogJycsIHRva2VuOiAnJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdIH1cbiAgICAgICAgLCBpZnR0dDogeyB1cmw6ICcnLCBtZXRob2Q6ICdHRVQnLCBhdXRoOiB7IGtleTogJycsIHZhbHVlOiAnJyB9LCBzdGF0dXM6ICcnIH1cbiAgICAgICAgLCBpbmZsdXhkYjogeyB1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczogW10sIHN0YXR1czogJycgfVxuICAgICAgICAsIGFwcDogeyBlbWFpbDogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5hbWU6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGlmdHR0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsaWZ0dHQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDEyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMzMnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQ0NCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ1NvaWxNb2lzdHVyZScsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIHZjYzogdHJ1ZSwgcGVyY2VudDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdCTVAxODAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDI4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidUZW1wJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J3NlZWRsaW5nJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1BsYW50JywndHlwZSc6J2Nhbm5hYmlzJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoQm9vbGVhbihhcmR1aW5vLnNlY3VyZSkpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgaXNFU1A6IGZ1bmN0aW9uKGFyZHVpbm8sIHJldHVybl92ZXJzaW9uKXtcbiAgICAgIGlmKHJldHVybl92ZXJzaW9uKXtcbiAgICAgICAgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzMyJykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnMzInO1xuICAgICAgICBlbHNlIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCc4MjY2JykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnODI2Nic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gQm9vbGVhbihhcmR1aW5vICYmIGFyZHVpbm8uYm9hcmQgJiYgKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdlc3AnKSAhPT0gLTEgfHwgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ25vZGVtY3UnKSAhPT0gLTEpKTtcbiAgICB9LFxuICBcbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykrJy9hcmR1aW5vLycrZW5kcG9pbnQ7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDApXG4gICAgICAgICAgdXJsICs9ICc/YXBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHVybCArPSAnP2RwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAudmNjKSAmJiBbJzNWJywnNVYnXS5pbmRleE9mKGtldHRsZS50ZW1wLnZjYykgPT09IC0xKSAvL1NvaWxNb2lzdHVyZSBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmRwaW49JytrZXR0bGUudGVtcC52Y2M7XG4gICAgICAgIGVsc2UgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5pbmRleCkpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLnZjYykgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcbiAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9hcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgaWZ0dHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZzogKGRhdGEpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciBoZWFkZXJzID0geyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0LmF1dGgua2V5ICYmIHNldHRpbmdzLmlmdHR0LmF1dGgudmFsdWUpIHtcbiAgICAgICAgICAgIGhlYWRlcnNbc2V0dGluZ3MuaWZ0dHQuYXV0aC5rZXldID0gc2V0dGluZ3MuaWZ0dHQuYXV0aC52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGh0dHAgPSB7XG4gICAgICAgICAgICB1cmw6IHNldHRpbmdzLmlmdHR0LnVybCxcbiAgICAgICAgICAgIG1ldGhvZDogc2V0dGluZ3MuaWZ0dHQubWV0aG9kLFxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlmdHR0Lm1ldGhvZCA9PSAnR0VUJylcbiAgICAgICAgICAgIGh0dHAucGFyYW1zID0gZGF0YTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBodHRwLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIHJldHVybiBodHRwO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgZGF0YSA9IHsgJ2JyZXdiZW5jaCc6IHRydWUgfTtcbiAgICAgICAgICB2YXIgaHR0cF9jb25maWcgPSB0aGlzLmlmdHR0KCkuY29uZmlnKGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaHR0cF9jb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ01pc3NpbmcgVVJMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgICRodHRwKGh0dHBfY29uZmlnKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKGBDb25uZWN0aW9uIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIHNlbmQ6IChkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBodHRwX2NvbmZpZyA9IHRoaXMuaWZ0dHQoKS5jb25maWcoZGF0YSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCFodHRwX2NvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnTWlzc2luZyBVUkwnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgJGh0dHAoaHR0cF9jb25maWcpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoYENvbm5lY3Rpb24gc3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgYXBwOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHBzOi8vc2Vuc29yLmJyZXdiZW5jaC5jby8nLCBoZWFkZXJzOiB7fSwgdGltZW91dDogMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLmFwcC5hcGlfa2V5ICYmIHNldHRpbmdzLmFwcC5lbWFpbCl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSBgdXNlcnMvJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS0VZJ10gPSBgJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1FTUFJTCddID0gYCR7c2V0dGluZ3MuYXBwLmVtYWlsfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHEucmVqZWN0KFwiVXNlciBub3QgZm91bmRcIik7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwKXtcbiAgICAgICAgIGF2ZXJhZ2UgPSAoYXZlcmFnZSAqICg1LjAgLyA2NTUzNSkpIC8gMC4wMDAxO1xuICAgICAgICAgdmFyIGxuID0gTWF0aC5sb2coYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMKTtcbiAgICAgICAgIHZhciBrZWx2aW4gPSAxIC8gKDAuMDAzMzU0MDE3MCArICgwLjAwMDI1NjE3MjQ0ICogbG4pICsgKDAuMDAwMDAyMTQwMDk0MyAqIGxuICogbG4pICsgKC0wLjAwMDAwMDA3MjQwNTIxOSAqIGxuICogbG4gKiBsbikpO1xuICAgICAgICAgIC8vIGtlbHZpbiB0byBjZWxzaXVzXG4gICAgICAgICByZXR1cm4ga2VsdmluIC0gMjczLjE1O1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgICAgYXZlcmFnZSA9IFNFUklFU1JFU0lTVE9SIC8gYXZlcmFnZTtcblxuICAgICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0IC89IEJDT0VGRklDSUVOVDsgICAgICAgICAgICAgICAgICAgLy8gMS9CICogbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgICAgc3RlaW5oYXJ0IC09IDI3My4xNTtcbiAgICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgICAgfVxuICAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnKXtcbiAgICAgICBpZiAoa2V0dGxlLnRlbXAucmF3ICYmIGtldHRsZS50ZW1wLnJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKGtldHRsZS50ZW1wLnJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKEJvb2xlYW4oc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4oaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogQm9vbGVhbihvcHRpb25zLnNlc3Npb24pLFxuICAgICAgICAgICAgICAgIHRleHQ6IEJvb2xlYW4ob3B0aW9ucy5zZXNzaW9uKSA/IG9wdGlvbnMuc2Vzc2lvbiA6ICcnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBNb25pdG9yJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGU6ICdiYXNpcycsXG4gICAgICAgICAgICAgIGxlZ2VuZDoge1xuICAgICAgICAgICAgICAgIGtleTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlzQXJlYTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIEJvb2xlYW4ob3B0aW9ucy5jaGFydC5hcmVhKSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoQm9vbGVhbihvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24gKHBsYXRvKSB7XG4gICAgICBpZiAoIXBsYXRvKSByZXR1cm4gJyc7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbiAoc2cpIHtcbiAgICAgIGlmICghc2cpIHJldHVybiAnJztcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKS50b0ZpeGVkKDIpOztcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfTkFNRSkpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9EQVRFKSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcykpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCkpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk5BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5CUkVXRVIpKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLk9HKSlcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NQVgpKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQUJWX01JTikpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRVJNRU5UQUJMRVMpKXtcbiAgICAgICAgdmFyIGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uQU1PVU5UKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkhPUFMpKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5NSVNDUykpe1xuICAgICAgICB2YXIgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5ZRUFTVFMpKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9