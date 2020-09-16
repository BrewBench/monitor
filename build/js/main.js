webpackJsonp([1],{

/***/ 328:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(128);
__webpack_require__(350);
__webpack_require__(552);
__webpack_require__(554);
__webpack_require__(555);
__webpack_require__(556);
module.exports = __webpack_require__(557);


/***/ }),

/***/ 552:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(62);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(163);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(164);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_angular2.default.module('brewbench-monitor', ['ui.router', 'nvd3', 'ngTouch', 'duScroll', 'ui.knob', 'rzModule']).config(function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider, $compileProvider) {

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

/***/ 554:
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
  $scope.share = !$state.params.file && BrewService.settings('share') ? BrewService.settings('share') : {
    file: $state.params.file || null,
    password: null,
    needPassword: false,
    access: 'readOnly',
    deleteAfter: 14
  };

  $scope.openSketches = function () {
    $('#settingsModal').modal('hide');
    $('#sketchesModal').modal('show');
  };

  $scope.sumValues = function (obj) {
    return _.sumBy(obj, 'amount');
  };

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
          event.srcElement.innerHTML = 'Connect';
          arduino.board = info.BrewBench.board;
          if (info.BrewBench.RSSI) arduino.RSSI = info.BrewBench.RSSI;
          arduino.version = info.BrewBench.version;
          arduino.status.dt = new Date();
          arduino.status.error = '';
          arduino.status.message = '';
          if (arduino.board.indexOf('ESP32') == 0) {
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
    login: function login() {
      $scope.settings.tplink.status = 'Connecting';
      BrewService.tplink().login($scope.settings.tplink.user, $scope.settings.tplink.pass).then(function (response) {
        if (response.token) {
          $scope.settings.tplink.status = 'Connected';
          $scope.settings.tplink.token = response.token;
          $scope.tplink.scan(response.token);
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
      temp: { pin: 'A0', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0, volts: 0 },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: arduino,
      message: { type: 'error', message: '', version: '', count: 0, location: '' },
      notify: { slack: false, dweet: false, streams: false }
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

  $scope.createShare = function () {
    if (!$scope.settings.recipe.brewer.name || !$scope.settings.recipe.brewer.email) return;
    $scope.share_status = 'Creating share link...';
    return BrewService.createShare($scope.share).then(function (response) {
      if (response.share && response.share.url) {
        $scope.share_status = '';
        $scope.share_success = true;
        $scope.share_link = response.share.url;
      } else {
        $scope.share_success = false;
      }
      BrewService.settings('share', $scope.share);
    }).catch(function (err) {
      $scope.share_status = err;
      $scope.share_success = false;
      BrewService.settings('share', $scope.share);
    });
  };

  $scope.shareTest = function (arduino) {
    arduino.testing = true;
    BrewService.shareTest(arduino).then(function (response) {
      arduino.testing = false;
      if (response.http_code == 200) arduino.public = true;else arduino.public = false;
    }).catch(function (err) {
      arduino.testing = false;
      arduino.public = false;
    });
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
      return BrewService.app().auth(true).then(function (response) {
        $scope.settings.app.status = 'Connected';
      }).catch(function (err) {
        $scope.settings.app.status = 'Failed to Connect';
      });
    }
  };

  $scope.shareAccess = function (access) {
    if ($scope.settings.general.shared) {
      if (access) {
        if (access == 'embed') {
          return Boolean(window.frameElement);
        } else {
          return Boolean($scope.share.access && $scope.share.access === access);
        }
      }
      return true;
    } else if (access && access == 'embed') {
      return Boolean(window.frameElement);
    }
    return true;
  };

  $scope.loadShareFile = function () {
    BrewService.clear();
    $scope.settings = BrewService.reset();
    $scope.settings.general.shared = true;
    return BrewService.loadShareFile($scope.share.file, $scope.share.password || null).then(function (contents) {
      if (contents) {
        if (contents.needPassword) {
          $scope.share.needPassword = true;
          if (contents.settings.recipe) {
            $scope.settings.recipe = contents.settings.recipe;
          }
          return false;
        } else {
          $scope.share.needPassword = false;
          if (contents.share && contents.share.access) {
            $scope.share.access = contents.share.access;
          }
          if (contents.settings) {
            $scope.settings = contents.settings;
            $scope.settings.notifications = { on: false, timers: true, high: true, low: true, target: true, slack: '', last: '' };
          }
          if (contents.kettles) {
            _.each(contents.kettles, function (kettle) {
              kettle.knob = angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: 200 + 5, subText: { enabled: true, text: 'starting...', color: 'gray', font: 'auto' } });
              kettle.values = [];
            });
            $scope.kettles = contents.kettles;
          }
          return $scope.processTemps();
        }
      } else {
        return false;
      }
    }).catch(function (err) {
      $scope.setErrorMessage("Opps, there was a problem loading the shared session.");
    });
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
    $scope.showSettings = !$scope.settings.general.shared;
    if ($scope.share.file) return $scope.loadShareFile();

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
    if (Boolean($scope.settings.general.shared)) {
      $scope.error.type = 'warning';
      $scope.error.message = $sce.trustAsHtml('The monitor seems to be off-line, re-connecting...');
    } else {
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
    kettle.temp.current = parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust);
    // set raw
    kettle.temp.raw = response.raw;
    kettle.temp.volts = response.volts;

    // volt check
    if (kettle.temp.type != 'BMP180' && !kettle.temp.volts && !kettle.temp.raw) {
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
      kettle.percent = response.percent;
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
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.slack || kettle.notify.dweet) {
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
      downloadSketch(sketch.name, sketch.actions, sketch.triggers, sketch.headers, 'BrewBench' + sketchName);
    });
  };

  function downloadSketch(name, actions, hasTriggers, headers, sketch) {
    // tp link connection
    var tplink_connection_string = BrewService.tplink().connection();
    var autogen = '/*\nSketch Auto Generated from http://monitor.brewbench.co\nVersion ' + $scope.pkg.sketch_version + ' ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + '\n*/\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = autogen + response.data.replace('// [ACTIONS]', actions.length ? actions.join('\n') : '').replace('// [HEADERS]', headers.length ? headers.join('\n') : '').replace(/\[VERSION\]/g, $scope.pkg.sketch_version).replace(/\[TPLINK_CONNECTION\]/g, tplink_connection_string).replace(/\[SLACK_CONNECTION\]/g, $scope.settings.notifications.slack);

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
    var unitType = '\xB0';
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
    if ($scope.settings.notifications.slack.indexOf('http') === 0) {
      BrewService.slack($scope.settings.notifications.slack, message, color, icon, kettle).then(function (response) {
        $scope.resetError();
      }).catch(function (err) {
        if (err.message) $scope.setErrorMessage('Failed posting to Slack ' + err.message);else $scope.setErrorMessage('Failed posting to Slack ' + JSON.stringify(err));
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
    //don't allow changing kettles on shared sessions
    //this could be dangerous if doing this remotely
    if ($scope.settings.general.shared) return;
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
      $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart, session: $scope.settings.app.session });
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
    $scope.kettles.splice($index, 1);
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(63)))

/***/ }),

/***/ 555:
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

/***/ 556:
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

/***/ 557:
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
        window.localStorage.removeItem('share');
        window.localStorage.removeItem('accessToken');
      }
    },

    accessToken: function accessToken(token) {
      if (token) return window.localStorage.setItem('accessToken', token);else return window.localStorage.getItem('accessToken');
    },

    reset: function reset() {
      var defaultSettings = {
        general: { debug: false, pollSeconds: 10, unit: 'F', shared: false, heatSafety: false },
        chart: { show: true, military: false, area: false },
        sensors: { DHT: false, DS18B20: false, BMP: false },
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        arduinos: [{ id: 'local-' + btoa('brewbench'), board: '', RSSI: false, url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '', message: '' } }],
        tplink: { user: '', pass: '', token: '', status: '', plugs: [] },
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
        temp: { pin: 'A0', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false }
      }, {
        name: 'Mash',
        id: null,
        type: 'grain',
        active: false,
        sticky: false,
        heater: { pin: 'D4', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D5', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A1', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false }
      }, {
        name: 'Boil',
        id: null,
        type: 'hop',
        active: false,
        sticky: false,
        heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A2', vcc: '', index: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0, volts: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false }
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
      var sensors = [{ name: 'Thermistor', analog: true, digital: false, esp: true }, { name: 'DS18B20', analog: false, digital: true, esp: true }, { name: 'PT100', analog: true, digital: true, esp: true }, { name: 'DHT11', analog: false, digital: true, esp: true }, { name: 'DHT12', analog: false, digital: true, esp: false }, { name: 'DHT21', analog: false, digital: true, esp: false }, { name: 'DHT22', analog: false, digital: true, esp: true }, { name: 'DHT33', analog: false, digital: true, esp: false }, { name: 'DHT44', analog: false, digital: true, esp: false }, { name: 'SoilMoisture', analog: true, digital: false, vcc: true, percent: true, esp: true }, { name: 'BMP180', analog: true, digital: false, esp: true }];
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

    loadShareFile: function loadShareFile(file, password) {
      var q = $q.defer();
      var query = '';
      if (password) query = '?password=' + md5(password);
      $http({ url: 'https://monitor.brewbench.co/share/get/' + file + query, method: 'GET' }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    // TODO finish this
    // deleteShareFile: function(file, password){
    //   var q = $q.defer();
    //   $http({url: 'https://monitor.brewbench.co/share/delete/'+file, method: 'GET'})
    //     .then(response => {
    //       q.resolve(response.data);
    //     })
    //     .catch(err => {
    //       q.reject(err);
    //     });
    //   return q.promise;
    // },

    createShare: function createShare(share) {
      var q = $q.defer();
      var settings = this.settings('settings');
      var kettles = this.settings('kettles');
      var sh = Object.assign({}, { password: share.password, access: share.access });
      //remove some things we don't need to share
      _.each(kettles, function (kettle, i) {
        delete kettles[i].knob;
        delete kettles[i].values;
      });
      delete settings.app;
      delete settings.influxdb;
      delete settings.tplink;
      delete settings.notifications;
      delete settings.sketches;
      settings.shared = true;
      if (sh.password) sh.password = md5(sh.password);
      $http({ url: 'https://monitor.brewbench.co/share/create/',
        method: 'POST',
        data: { 'share': sh, 'settings': settings, 'kettles': kettles },
        headers: { 'Content-Type': 'application/json' }
      }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    shareTest: function shareTest(arduino) {
      var q = $q.defer();
      var query = 'url=' + arduino.url;

      if (arduino.password) query += '&auth=' + btoa('root:' + arduino.password.trim());

      $http({ url: 'https://monitor.brewbench.co/share/test/?' + query, method: 'GET' }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    ip: function ip(arduino) {
      var q = $q.defer();

      $http({ url: 'https://monitor.brewbench.co/share/ip', method: 'GET' }).then(function (response) {
        q.resolve(response.data);
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    dweet: function dweet() {
      return {
        latest: function latest() {
          var q = $q.defer();
          $http({ url: 'https://dweet.io/get/latest/dweet/for/brewbench', method: 'GET' }).then(function (response) {
            q.resolve(response.data);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        all: function all() {
          var q = $q.defer();
          $http({ url: 'https://dweet.io/get/dweets/for/brewbench', method: 'GET' }).then(function (response) {
            q.resolve(response.data);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        }
      };
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

    app: function app() {
      var _this2 = this;

      var settings = this.settings('settings');
      var request = { url: 'https://sensor.brewbench.co', headers: {}, timeout: settings.general.pollSeconds * 10000 };

      return {
        auth: async function auth(ping) {
          var q = $q.defer();
          if (settings.app.api_key && settings.app.email) {
            request.url += ping ? '/users/ping' : '/users/auth';
            request.method = 'POST';
            request.headers['Content-Type'] = 'application/json';
            request.headers['X-API-KEY'] = '' + settings.app.api_key;
            $http(request).then(function (response) {
              if (response && response.data && response.data.access && response.data.access.id) _this2.accessToken(response.data.access.id);
              q.resolve(response);
            }).catch(function (err) {
              q.reject(err);
            });
          } else {
            q.reject(false);
          }
          return q.promise;
        },
        kettles: {
          get: async function get() {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.app().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url += '/kettles';
            request.method = 'GET';
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          },
          save: async function save(kettle) {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.app().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            var updatedKettle = angular.copy(kettle);
            // remove not needed data
            delete updatedKettle.values;
            delete updatedKettle.message;
            delete updatedKettle.timers;
            delete updatedKettle.knob;
            updatedKettle.temp.adjust = settings.general.unit == 'F' && Boolean(updatedKettle.temp.adjust) ? $filter('round')(updatedKettle.temp.adjust * 0.555, 3) : updatedKettle.temp.adjust;
            request.url += '/kettles/arm';
            request.method = 'POST';
            request.data = {
              session: settings.app.session,
              kettle: updatedKettle,
              notifications: settings.notifications
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          }
        },
        sessions: {
          get: async function get() {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.app().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url += '/sessions';
            request.method = 'GET';
            request.data = {
              sessionId: sessionId,
              kettle: kettle
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          },
          save: async function save(session) {
            var q = $q.defer();
            if (!_this2.accessToken()) {
              var auth = await _this2.app().auth();
              if (!_this2.accessToken()) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url += '/sessions/' + session.id;
            request.method = 'PATCH';
            request.data = {
              name: session.name,
              type: session.type
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this2.accessToken();
            $http(request).then(function (response) {
              q.resolve(response.data);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          }
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
            console.log(response);
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
      var sg = 1 + plato / (258.6 - plato / 258.2 * 227.1);
      return parseFloat(sg).toFixed(3);
    },
    plato: function plato(sg) {
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(63)))

/***/ })

},[328]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiQm9vbGVhbiIsImRvY3VtZW50IiwicHJvdG9jb2wiLCJodHRwc191cmwiLCJob3N0IiwiZXNwIiwidHlwZSIsInNzaWQiLCJzc2lkX3Bhc3MiLCJob3N0bmFtZSIsImFyZHVpbm9fcGFzcyIsImF1dG9jb25uZWN0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiYXBwIiwiZW1haWwiLCJhcGlfa2V5Iiwic3RhdHVzIiwiZ2VuZXJhbCIsImNoYXJ0T3B0aW9ucyIsInVuaXQiLCJjaGFydCIsImRlZmF1bHRLZXR0bGVzIiwic2hhcmUiLCJwYXJhbXMiLCJmaWxlIiwicGFzc3dvcmQiLCJuZWVkUGFzc3dvcmQiLCJhY2Nlc3MiLCJkZWxldGVBZnRlciIsIm9wZW5Ta2V0Y2hlcyIsIiQiLCJtb2RhbCIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFN0YXR1c0NsYXNzIiwiZW5kc1dpdGgiLCJnZXRQb3J0UmFuZ2UiLCJudW1iZXIiLCJBcnJheSIsImZpbGwiLCJtYXAiLCJpZHgiLCJhcmR1aW5vcyIsImFkZCIsIm5vdyIsIkRhdGUiLCJwdXNoIiwiYnRvYSIsImJvYXJkIiwiUlNTSSIsImFuYWxvZyIsImRpZ2l0YWwiLCJhZGMiLCJzZWN1cmUiLCJ2ZXJzaW9uIiwiZHQiLCJlYWNoIiwiYXJkdWlubyIsInVwZGF0ZSIsImRlbGV0ZSIsInNwbGljZSIsImNvbm5lY3QiLCJ0aGVuIiwiaW5mbyIsIkJyZXdCZW5jaCIsImV2ZW50Iiwic3JjRWxlbWVudCIsImlubmVySFRNTCIsInRvdWNoIiwiY2F0Y2giLCJlcnIiLCJyZWJvb3QiLCJ0cGxpbmsiLCJsb2dpbiIsInVzZXIiLCJwYXNzIiwicmVzcG9uc2UiLCJ0b2tlbiIsInNjYW4iLCJzZXRFcnJvck1lc3NhZ2UiLCJtc2ciLCJwbHVncyIsImRldmljZUxpc3QiLCJwbHVnIiwicmVzcG9uc2VEYXRhIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJlbWV0ZXIiLCJnZXRfcmVhbHRpbWUiLCJlcnJfY29kZSIsInBvd2VyIiwiZGV2aWNlIiwidG9nZ2xlIiwib2ZmT3JPbiIsInJlbGF5X3N0YXRlIiwiYWRkS2V0dGxlIiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwidmNjIiwiaGl0IiwibWVhc3VyZWQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJyYXciLCJ2b2x0cyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwiY291bnQiLCJub3RpZnkiLCJzbGFjayIsImR3ZWV0Iiwic3RyZWFtcyIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJoZWF0SXNPbiIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwiaXNFU1AiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNoYW5nZVNlbnNvciIsInNlbnNvclR5cGVzIiwicGVyY2VudCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJhdXRoIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwib24iLCJoaWdoIiwibG93IiwibGFzdCIsInN1YlRleHQiLCJlbmFibGVkIiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRvb2x0aXAiLCJhbmltYXRlZCIsInBsYWNlbWVudCIsInNob3ciLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidXBkYXRlQXJkdWlub1N0YXR1cyIsImRvbWFpbiIsInNrZXRjaF92ZXJzaW9uIiwidXBkYXRlVGVtcCIsImtleSIsInRlbXBzIiwic2hpZnQiLCJhbHRpdHVkZSIsInByZXNzdXJlIiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhlYXRTYWZldHkiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJiZiIsIkRIVCIsIkRTMThCMjAiLCJCTVAiLCJrZXR0bGVUeXBlIiwidW5zaGlmdCIsImEiLCJ0b0xvd2VyQ2FzZSIsImRvd25sb2FkU2tldGNoIiwiaGFzVHJpZ2dlcnMiLCJ0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmciLCJjb25uZWN0aW9uIiwiYXV0b2dlbiIsImdldCIsImpvaW4iLCJtZDUiLCJ0cmltIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiVEhDIiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsImNoYW5nZVVuaXRzIiwidiIsInNlc3Npb24iLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwicmVtb3ZlS2V0dGxlIiwiJGluZGV4IiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsInVwZGF0ZUxvY2FsIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZGJtIiwia2ciLCJpc05hTiIsImZhY3RvcnkiLCJsb2NhbFN0b3JhZ2UiLCJyZW1vdmVJdGVtIiwiYWNjZXNzVG9rZW4iLCJzZXRJdGVtIiwiZ2V0SXRlbSIsImRlYnVnIiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsInJldHVybl92ZXJzaW9uIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJlbmRwb2ludCIsInJlcXVlc3QiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJBdXRob3JpemF0aW9uIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJzYXZlIiwidXBkYXRlZEtldHRsZSIsInNlc3Npb25zIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJjb25zb2xlIiwic2VyaWVzIiwidGl0bGUiLCJlbmFibGUiLCJub0RhdGEiLCJoZWlnaHQiLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsImludGVycG9sYXRlIiwibGVnZW5kIiwiaXNBcmVhIiwieEF4aXMiLCJheGlzTGFiZWwiLCJ0aWNrRm9ybWF0IiwidGltZSIsIm9yaWVudCIsInRpY2tQYWRkaW5nIiwiYXhpc0xhYmVsRGlzdGFuY2UiLCJzdGFnZ2VyTGFiZWxzIiwiZm9yY2VZIiwieUF4aXMiLCJzaG93TWF4TWluIiwidG9GaXhlZCIsIm9wIiwiZnAiLCJwb3ciLCJzdWJzdHJpbmciLCJGX1JfTkFNRSIsIkZfUl9TVFlMRSIsIkZfU19DQVRFR09SWSIsIkZfUl9EQVRFIiwiRl9SX0JSRVdFUiIsIkZfU19NQVhfT0ciLCJGX1NfTUlOX09HIiwiRl9TX01BWF9GRyIsIkZfU19NSU5fRkciLCJGX1NfTUFYX0FCViIsIkZfU19NSU5fQUJWIiwiRl9TX01BWF9JQlUiLCJwYXJzZUludCIsIkZfU19NSU5fSUJVIiwiSW5ncmVkaWVudHMiLCJHcmFpbiIsIkZfR19OQU1FIiwiRl9HX0JPSUxfVElNRSIsIkZfR19BTU9VTlQiLCJIb3BzIiwiRl9IX05BTUUiLCJGX0hfRFJZX0hPUF9USU1FIiwiRl9IX0JPSUxfVElNRSIsIkZfSF9BTU9VTlQiLCJNaXNjIiwiRl9NX05BTUUiLCJGX01fVElNRSIsIkZfTV9BTU9VTlQiLCJZZWFzdCIsIkZfWV9MQUIiLCJGX1lfUFJPRFVDVF9JRCIsIkZfWV9OQU1FIiwibWFzaF90aW1lIiwiTkFNRSIsIlNUWUxFIiwiQ0FURUdPUlkiLCJCUkVXRVIiLCJPRyIsIkZHIiwiSUJVIiwiQUJWX01BWCIsIkFCVl9NSU4iLCJNQVNIIiwiTUFTSF9TVEVQUyIsIk1BU0hfU1RFUCIsIlNURVBfVElNRSIsIkZFUk1FTlRBQkxFUyIsIkZFUk1FTlRBQkxFIiwiQU1PVU5UIiwiSE9QUyIsIkhPUCIsIkZPUk0iLCJVU0UiLCJUSU1FIiwiTUlTQ1MiLCJNSVNDIiwiWUVBU1RTIiwiWUVBU1QiLCJjb250ZW50IiwiaHRtbGNoYXJzIiwiZiIsInIiLCJjaGFyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUEsa0JBQVFBLE1BQVIsQ0FBZSxtQkFBZixFQUFvQyxDQUNsQyxXQURrQyxFQUVqQyxNQUZpQyxFQUdqQyxTQUhpQyxFQUlqQyxVQUppQyxFQUtq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RUF1UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UWMsRUF3UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UWMsRUF5UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UWMsRUEwUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUWMsRUEyUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUWMsRUE0UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1UWMsRUE2UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3UWMsRUE4UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5UWMsRUErUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvUWMsRUFnUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoUmMsRUFpUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqUmMsRUFrUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsUmMsRUFtUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuUmMsRUFvUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwUmMsRUFxUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyUmMsRUFzUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0UmMsRUF1UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UmMsRUF3UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UmMsRUF5UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UmMsRUEwUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUmMs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Q0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcmZjLEVBc2ZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRmYyxFQXVmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZmYyxFQXdmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxLQUFoQixFQXhmYyxFQXlmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXpmYyxFQTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkFoakIsUUFBRW9FLElBQUYsQ0FBTzBlLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVFqakIsT0FBUixDQUFnQnFqQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUWxqQixPQUFSLENBQWdCd1ksT0FBTzhLLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBdnBESSxHQUFQO0FBeXBERCxDQTVwREQsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICB3aW5kb3cubG9jYXRpb24uaHJlZj0nLyc7XG59O1xuXG5pZiggJHN0YXRlLmN1cnJlbnQubmFtZSA9PSAncmVzZXQnKVxuICAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuXG52YXIgbm90aWZpY2F0aW9uID0gbnVsbDtcbnZhciByZXNldENoYXJ0ID0gMTAwO1xudmFyIHRpbWVvdXQgPSBudWxsOyAvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuQnJld1NlcnZpY2UgPSBCcmV3U2VydmljZTtcbiRzY29wZS5zaXRlID0ge2h0dHBzOiBCb29sZWFuKGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sPT0naHR0cHM6JylcbiAgLCBodHRwc191cmw6IGBodHRwczovLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH1gXG59O1xuJHNjb3BlLmVzcCA9IHtcbiAgdHlwZTogJycsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJ2JiZXNwJyxcbiAgYXJkdWlub19wYXNzOiAnYmJhZG1pbicsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZihsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG5pZiAoISRzY29wZS5zZXR0aW5ncy5hcHApXG4gICRzY29wZS5zZXR0aW5ncy5hcHAgPSB7IGVtYWlsOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycgfTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnR9KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLm9wZW5Ta2V0Y2hlcyA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzZXR0aW5nc01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgJCgnI3NrZXRjaGVzTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59O1xuXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS5nZXRTdGF0dXNDbGFzcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIGlmKHN0YXR1cyA9PSAnQ29ubmVjdGVkJylcbiAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICBlbHNlIGlmKF8uZW5kc1dpdGgoc3RhdHVzLCdpbmcnKSlcbiAgICByZXR1cm4gJ3NlY29uZGFyeSc7XG4gIGVsc2VcbiAgICByZXR1cm4gJ2Rhbmdlcic7XG59XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGJvYXJkOiAnJyxcbiAgICAgICAgUlNTSTogZmFsc2UsXG4gICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgZGlnaXRhbDogMTMsXG4gICAgICAgIGFkYzogMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbjogJycsXG4gICAgICAgIHN0YXR1czoge2Vycm9yOiAnJyxkdDogJycsbWVzc2FnZTonJ31cbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnQ29ubmVjdGluZy4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvJylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLkJyZXdCZW5jaCl7XG4gICAgICAgICAgICBldmVudC5zcmNFbGVtZW50LmlubmVySFRNTCA9ICdDb25uZWN0JztcbiAgICAgICAgICAgIGFyZHVpbm8uYm9hcmQgPSBpbmZvLkJyZXdCZW5jaC5ib2FyZDtcbiAgICAgICAgICAgIGlmKGluZm8uQnJld0JlbmNoLlJTU0kpXG4gICAgICAgICAgICAgIGFyZHVpbm8uUlNTSSA9IGluZm8uQnJld0JlbmNoLlJTU0k7XG4gICAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSBpbmZvLkJyZXdCZW5jaC52ZXJzaW9uO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQMzInKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAgICAgIGFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQODI2NicpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAgICAgICAgICAgIGFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ1JlYm9vdGluZy4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdyZWJvb3QnKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ1JlYm9vdCBTdWNjZXNzLCB0cnkgY29ubmVjdGluZyBpbiBhIGZldyBzZWNvbmRzLic7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpZihwa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5tc2cgfHwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ1NjYW5uaW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnNjYW4odG9rZW4pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZihyZXNwb25zZS5kZXZpY2VMaXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoQm9vbGVhbihwbHVnLnN0YXR1cykpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgdmFyIG9mZk9yT24gPSBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxID8gMCA6IDE7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS50b2dnbGUoZGV2aWNlLCBvZmZPck9uKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSBvZmZPck9uO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS50aGVuKHRvZ2dsZVJlc3BvbnNlID0+IHtcbiAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5mb1xuICAgICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICBkZXZpY2UuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgdmFyIGFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfTtcbiAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCxkaWZmOiRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogYXJkdWlub1xuICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcbiAgXG4gICRzY29wZS5oZWF0SXNPbiA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQm9vbGVhbihfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2hlYXRlcic6IHsncnVubmluZyc6IHRydWV9fSkubGVuZ3RoKTtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKGFyZHVpbm8sIHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8pKXtcbiAgICAgICAgaWYoQnJld1NlcnZpY2UuaXNFU1AoYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKVxuICAgICAgICAgIHJldHVybiBwaW4ucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBwaW4ucmVwbGFjZSgnQScsJ0dQSU8nKS5yZXBsYWNlKCdEJywnR1BJTycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBpbjtcbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUucGluSW5Vc2UgPSBmdW5jdGlvbihwaW4sYXJkdWlub0lkKXtcbiAgICB2YXIga2V0dGxlID0gXy5maW5kKCRzY29wZS5rZXR0bGVzLCBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgKGtldHRsZS5hcmR1aW5vLmlkPT1hcmR1aW5vSWQpICYmXG4gICAgICAgIChcbiAgICAgICAgICAoa2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS50ZW1wLnZjYz09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUuaGVhdGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKCFrZXR0bGUuY29vbGVyICYmIGtldHRsZS5wdW1wLnBpbj09cGluKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiBrZXR0bGUgfHwgZmFsc2U7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVNlbnNvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSl7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwQjAnO1xuICAgIH1cbiAgICBrZXR0bGUudGVtcC52Y2MgPSAnJztcbiAgICBrZXR0bGUudGVtcC5pbmRleCA9ICcnO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlVGVzdCA9IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgIGFyZHVpbm8udGVzdGluZyA9IHRydWU7XG4gICAgQnJld1NlcnZpY2Uuc2hhcmVUZXN0KGFyZHVpbm8pXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5odHRwX2NvZGUgPT0gMjAwKVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmluZmx1eGRiID0ge1xuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIgPSBkZWZhdWx0U2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQgfHwgcmVzcG9uc2Uuc3RhdHVzID09IDIwMCl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFwcCA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSAmJlxuICAgICAgICBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPT0gJ0Nvbm5lY3RlZCdcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IGRlZmF1bHRTZXR0aW5ncy5hcHA7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSB8fCAhQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkpKVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5hcHAoKS5hdXRoKHRydWUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc2hhcmVBY2Nlc3MgPSBmdW5jdGlvbihhY2Nlc3Mpe1xuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICAgaWYoYWNjZXNzKXtcbiAgICAgICAgICBpZihhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgICAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4oJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU2hhcmVGaWxlID0gZnVuY3Rpb24oKXtcbiAgICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAgICRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKEJvb2xlYW4oZm9ybWF0dGVkX2NvbnRlbnQpKXtcbiAgICAgICAgdmFyIHgyanMgPSBuZXcgWDJKUygpO1xuICAgICAgICBqc29uT2JqID0geDJqcy54bWxfc3RyMmpzb24oIGZvcm1hdHRlZF9jb250ZW50ICk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFqc29uT2JqKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCRleHQ9PSdic214Jyl7XG4gICAgICAgIGlmKEJvb2xlYW4oanNvbk9iai5SZWNpcGVzKSAmJiBCb29sZWFuKGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSkpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKEJvb2xlYW4oanNvbk9iai5TZWxlY3Rpb25zKSAmJiBCb29sZWFuKGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZSkpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZihCb29sZWFuKGpzb25PYmouUkVDSVBFUykgJiYgQm9vbGVhbihqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJFQ0lQRVMuUkVDSVBFO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclhNTChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZighcmVjaXBlKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLm9nKSlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLmZnKSlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGdyYWluLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoaG9wLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogaG9wLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoaG9wLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTond2F0ZXInfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUubWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBtaXNjLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IG1pc2Mubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUueWVhc3QubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdCA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLnllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogeWVhc3QubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTdHlsZXMgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc3R5bGVzKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnN0eWxlcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkc2NvcGUuc3R5bGVzID0gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjb25maWcgPSBbXTtcbiAgICBpZighJHNjb3BlLnBrZyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCh7XG4gICAgICBhbmltYXRlZDogJ2ZhZGUnLFxuICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgICAgaHRtbDogdHJ1ZVxuICAgIH0pO1xuICAgIGlmKCQoJyNnaXRjb21taXQgYScpLnRleHQoKSAhPSAnZ2l0X2NvbW1pdCcpe1xuICAgICAgJCgnI2dpdGNvbW1pdCcpLnNob3coKTtcbiAgICB9XG4gICAgJHNjb3BlLnNob3dTZXR0aW5ncyA9ICEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQ7XG4gICAgaWYoJHNjb3BlLnNoYXJlLmZpbGUpXG4gICAgICByZXR1cm4gJHNjb3BlLmxvYWRTaGFyZUZpbGUoKTtcblxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGltZXJzKSAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKEJvb2xlYW4oJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKSl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihlcnIuc3RhdHVzVGV4dCkpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuc3RhdHVzVGV4dDtcbiAgICAgIGVsc2UgaWYoZXJyLmNvbmZpZyAmJiBlcnIuY29uZmlnLnVybClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5jb25maWcudXJsO1xuICAgICAgZWxzZSBpZihlcnIudmVyc2lvbil7XG4gICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS52ZXJzaW9uID0gZXJyLnZlcnNpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoZXJyKTtcbiAgICAgICAgaWYobWVzc2FnZSA9PSAne30nKSBtZXNzYWdlID0gJyc7XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4obWVzc2FnZSkpe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgaWYobG9jYXRpb24pXG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwgbWVzc2FnZSk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWApO1xuICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5jdXJyZW50KSlcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLDIpO1xuICAgIC8vIGFkZCBhZGp1c3RtZW50XG4gICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgIT0gJ0JNUDE4MCcgJiZcbiAgICAgICFrZXR0bGUudGVtcC52b2x0cyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnJhdyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgJiZcbiAgICAgIHJlc3BvbnNlLnRlbXAgPT0gLTEyNyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyByZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXMuc2hpZnQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUIHNlbnNvcnMgaGF2ZSBodW1pZGl0eSBhcyBhIHBlcmNlbnRcbiAgICAvL1NvaWxNb2lzdHVyZUQgaGFzIG1vaXN0dXJlIGFzIGEgcGVyY2VudFxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUucGVyY2VudCA9IHJlc3BvbnNlLnBlcmNlbnQ7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKEJvb2xlYW4oQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCkgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaC1hbHQnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgIHZhciBrO1xuICAgIHZhciBoZWF0SXNPbiA9ICRzY29wZS5oZWF0SXNPbigpO1xuICAgIFxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgIGlmIChpdGVtID09ICdoZWF0JyAmJiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5oZWF0U2FmZXR5ICYmIGhlYXRJc09uKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ0EgaGVhdGVyIGlzIGFscmVhZHkgcnVubmluZy4nLCBrZXR0bGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMpXG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycyA9IHt9O1xuICAgIC8vIGFwcGVuZCBlc3AgdHlwZVxuICAgIGlmKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xKVxuICAgICAgc2tldGNoTmFtZSArPSAkc2NvcGUuZXNwLnR5cGU7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vID8ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpIDogJ0RlZmF1bHQnO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6IGFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIHR5cGU6IHNrZXRjaE5hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlLFxuICAgICAgICAgIGJmOiAoc2tldGNoTmFtZS5pbmRleE9mKCdCRicpICE9PSAtMSkgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiBCb29sZWFuKGtldHRsZS50ZW1wLmFkanVzdCkpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiYgJHNjb3BlLmVzcC5hdXRvY29ubmVjdCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QXV0b0Nvbm5lY3QuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKChza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSB8fCBCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykpICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYmVlZ2VlLXRva3lvL0RIVGVzcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKTtcbiAgICAgIH0gZWxzZSBpZighQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5EUzE4QjIwIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPE9uZVdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAxODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhlIGFjdGlvbnMgY29tbWFuZFxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYgKGtldHRsZS50ZW1wLnZjYylcbiAgICAgICAga2V0dGxlVHlwZSArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICBcbiAgICAgIGlmIChrZXR0bGUudGVtcC5pbmRleCkga2V0dGxlVHlwZSArPSAnLScgKyBrZXR0bGUudGVtcC5pbmRleDsgICAgICBcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTtcbiAgICAgIFxuICAgICAgaWYgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSAmJiBrZXR0bGUucGVyY2VudCkge1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBhY3Rpb25zUGVyY2VudENvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJy1IdW1pZGl0eVwiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGRlbGF5KDUwMCk7Jyk7ICAgICAgICBcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICB0cmlnZ2VyKEYoXCJoZWF0XCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJytCb29sZWFuKGtldHRsZS5ub3RpZnkuc2xhY2spKycpOycpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICB0cmlnZ2VyKEYoXCJjb29sXCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJytCb29sZWFuKGtldHRsZS5ub3RpZnkuc2xhY2spKycpOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYgKHNrZXRjaC50cmlnZ2VycyB8fCBza2V0Y2guYmYpIHtcbiAgICAgICAgaWYgKHNrZXRjaC50eXBlLmluZGV4T2YoJ001JykgPT09IC0xKSB7XG4gICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7Jyk7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZikge1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgYW1iaWVudCA9IDAuMDA7Jyk7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCBodW1pZGl0eSA9IDAuMDA7Jyk7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdjb25zdCBTdHJpbmcgZXF1aXBtZW50X25hbWUgPSBcIicrJHNjb3BlLnNldHRpbmdzLmJmLm5hbWUrJ1wiOycpOyAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kIFxuICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IHNrZXRjaC5hY3Rpb25zLmxlbmd0aDsgYSsrKXtcbiAgICAgICAgICBpZiAoc2tldGNoLmJmICYmIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h1bWlkaXR5JykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAvLyBCRiBsb2dpY1xuICAgICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zUGVyY2VudENvbW1hbmQoJywgJ2h1bWlkaXR5ID0gYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2tldGNoLmJmICYmIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xICYmXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYW1iaWVudCcpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywgJ2FtYmllbnQgPSBhY3Rpb25zQ29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyBBbGwgb3RoZXIgbG9naWNcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICd0ZW1wID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignQXBwJyApICE9PSAtMSl7XG4gICAgICAgICAgLy8gYXBwIGNvbm5lY3Rpb25cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUFBfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdCRll1bicgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGJmIGFwaSBrZXkgaGVhZGVyXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQkZfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5iZi5hcGlfa2V5LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZiggQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgIGlmIChCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyKSAmJiBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKSlcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYDtcbiAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5USEMpIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gVEhDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLScrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgaWYoQm9vbGVhbih0aW1lcikpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHRpbWVyLm5vdGVzKSlcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoQm9vbGVhbih0aW1lcikgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKChCb29sZWFuKHRpbWVyKSkgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoQm9vbGVhbihCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KSAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAudGFyZ2V0KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuY3VycmVudCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAubWVhc3VyZWQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnByZXZpb3VzLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLnRhcmdldCwwKTtcbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5hZGp1c3QpKXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5hcHAuc2Vzc2lvbn0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoIEJvb2xlYW4oa2V0dGxlKSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoQm9vbGVhbihrZXR0bGUpKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy9vbmx5IHByb2Nlc3MgYWN0aXZlIHNlbnNvcnNcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrLCBpKSA9PiB7XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5hY3RpdmUpe1xuICAgICAgICBhbGxTZW5zb3JzLnB1c2goQnJld1NlcnZpY2UudGVtcCgkc2NvcGUua2V0dGxlc1tpXSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwgJHNjb3BlLmtldHRsZXNbaV0pKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdXBkYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudClcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQrKztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50ID09IDcpe1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0wO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwgJHNjb3BlLmtldHRsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEuYWxsKGFsbFNlbnNvcnMpXG4gICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAvL3JlIHByb2Nlc3Mgb24gdGltZW91dFxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSxCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZUtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSwkaW5kZXgpe1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZihCb29sZWFuKGxvYWRlZCkpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuXG4gIC8vIHVwZGF0ZSBsb2NhbCBjYWNoZVxuICAkc2NvcGUudXBkYXRlTG9jYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJywgJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJywgJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSwgNTAwMCk7XG4gIH07XG4gIFxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9IEJvb2xlYW4oc2NvcGUudHlwZSkgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblx0XHRcdGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKG9uQ2hhbmdlRXZlbnQpIHtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC52YWwobnVsbCk7XG5cdFx0XHRcdCAgICB9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oY2Vsc2l1cykge1xuICAgIGNlbHNpdXMgPSBwYXJzZUZsb2F0KGNlbHNpdXMpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKGNlbHNpdXMqOS81KzMyLDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZhaHJlbmhlaXQpIHtcbiAgICBmYWhyZW5oZWl0ID0gcGFyc2VGbG9hdChmYWhyZW5oZWl0KTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKSgoZmFocmVuaGVpdC0zMikqNS85LDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3JvdW5kJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odmFsLGRlY2ltYWxzKSB7XG4gICAgcmV0dXJuIE51bWJlcigoTWF0aC5yb3VuZCh2YWwgKyBcImVcIiArIGRlY2ltYWxzKSAgKyBcImUtXCIgKyBkZWNpbWFscykpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RpdGxlY2FzZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCl7XG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGV4dC5zbGljZSgxKSk7XG4gIH07XG59KVxuLmZpbHRlcignZGJtUGVyY2VudCcsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24oZGJtKXtcbiAgICByZXR1cm4gMiAqIChkYm0gKyAxMDApO1xuICB9O1xufSlcbi5maWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbiAoa2cpIHtcbiAgICBpZiAodHlwZW9mIGtnID09PSAndW5kZWZpbmVkJyB8fCBpc05hTihrZykpIHJldHVybiAnJztcbiAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoa2cgKiAzNS4yNzQsIDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbiAoa2cpIHtcbiAgICBpZiAodHlwZW9mIGtnID09PSAndW5kZWZpbmVkJyB8fCBpc05hTihrZykpIHJldHVybiAnJztcbiAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoa2cgKiAyLjIwNDYyLCAyKTtcbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2ZpbHRlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZhY3RvcnkoJ0JyZXdTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkZmlsdGVyKXtcblxuICByZXR1cm4ge1xuXG4gICAgLy9jb29raWVzIHNpemUgNDA5NiBieXRlc1xuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xuICAgICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSl7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2V0dGluZ3MnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdrZXR0bGVzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2hhcmUnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBhY2Nlc3NUb2tlbjogZnVuY3Rpb24odG9rZW4pe1xuICAgICAgaWYodG9rZW4pXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FjY2Vzc1Rva2VuJyx0b2tlbik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgZGVmYXVsdFNldHRpbmdzID0ge1xuICAgICAgICBnZW5lcmFsOiB7ZGVidWc6IGZhbHNlLCBwb2xsU2Vjb25kczogMTAsIHVuaXQ6ICdGJywgc2hhcmVkOiBmYWxzZSwgaGVhdFNhZmV0eTogZmFsc2V9XG4gICAgICAgICxjaGFydDoge3Nob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2V9XG4gICAgICAgICxzZW5zb3JzOiB7REhUOiBmYWxzZSwgRFMxOEIyMDogZmFsc2UsIEJNUDogZmFsc2V9XG4gICAgICAgICxyZWNpcGU6IHsnbmFtZSc6JycsJ2JyZXdlcic6e25hbWU6JycsJ2VtYWlsJzonJ30sJ3llYXN0JzpbXSwnaG9wcyc6W10sJ2dyYWlucyc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhcmR1aW5vczogW3tpZDonbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSxib2FyZDonJyxSU1NJOmZhbHNlLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2UsdmVyc2lvbjonJyxzdGF0dXM6e2Vycm9yOicnLGR0OicnLG1lc3NhZ2U6Jyd9fV1cbiAgICAgICAgLHRwbGluazoge3VzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46JycsIHN0YXR1czogJycsIHBsdWdzOiBbXX1cbiAgICAgICAgLGluZmx1eGRiOiB7dXJsOiAnJywgcG9ydDogJycsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6W10sIHN0YXR1czogJyd9XG4gICAgICAgICxhcHA6IHtlbWFpbDogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBkZWZhdWx0U2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbmFtZTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdNYXNoJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9IGVsc2UgaWYoa2V5ID09ICdzZXR0aW5ncycpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnU29pbE1vaXN0dXJlJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgdmNjOiB0cnVlLCBwZXJjZW50OiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDE4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidUZW1wJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J3NlZWRsaW5nJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1BsYW50JywndHlwZSc6J2Nhbm5hYmlzJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoQm9vbGVhbihhcmR1aW5vLnNlY3VyZSkpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgaXNFU1A6IGZ1bmN0aW9uKGFyZHVpbm8sIHJldHVybl92ZXJzaW9uKXtcbiAgICAgIGlmKHJldHVybl92ZXJzaW9uKXtcbiAgICAgICAgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzMyJykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnMzInO1xuICAgICAgICBlbHNlIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCc4MjY2JykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnODI2Nic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gQm9vbGVhbihhcmR1aW5vICYmIGFyZHVpbm8uYm9hcmQgJiYgKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdlc3AnKSAhPT0gLTEgfHwgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ25vZGVtY3UnKSAhPT0gLTEpKTtcbiAgICB9LFxuICBcbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykrJy9hcmR1aW5vLycrZW5kcG9pbnQ7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDApXG4gICAgICAgICAgdXJsICs9ICc/YXBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHVybCArPSAnP2RwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAudmNjKSAmJiBbJzNWJywnNVYnXS5pbmRleE9mKGtldHRsZS50ZW1wLnZjYykgPT09IC0xKSAvL1NvaWxNb2lzdHVyZSBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmRwaW49JytrZXR0bGUudGVtcC52Y2M7XG4gICAgICAgIGVsc2UgaWYoQm9vbGVhbihrZXR0bGUudGVtcC5pbmRleCkpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZihCb29sZWFuKGtldHRsZS50ZW1wLnZjYykgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKEJvb2xlYW4oa2V0dGxlLnRlbXAuaW5kZXgpKSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcbiAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9hcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIHZhciBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5hcHA7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgICBkZWxldGUgc2V0dGluZ3MudHBsaW5rO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLm5vdGlmaWNhdGlvbnM7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc2tldGNoZXM7XG4gICAgICBzZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgICAgaWYoc2gucGFzc3dvcmQpXG4gICAgICAgIHNoLnBhc3N3b3JkID0gbWQ1KHNoLnBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2NyZWF0ZS8nLFxuICAgICAgICAgIG1ldGhvZDonUE9TVCcsXG4gICAgICAgICAgZGF0YTogeydzaGFyZSc6IHNoLCAnc2V0dGluZ3MnOiBzZXR0aW5ncywgJ2tldHRsZXMnOiBrZXR0bGVzfSxcbiAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzaGFyZVRlc3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gYHVybD0ke2FyZHVpbm8udXJsfWBcblxuICAgICAgaWYoYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgcXVlcnkgKz0gJyZhdXRoPScrYnRvYSgncm9vdDonK2FyZHVpbm8ucGFzc3dvcmQudHJpbSgpKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGU6IChkZXZpY2UsIHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogdG9nZ2xlIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBhcHA6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiAnaHR0cHM6Ly9zZW5zb3IuYnJld2JlbmNoLmNvJywgaGVhZGVyczoge30sIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAocGluZykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5hcHAuYXBpX2tleSAmJiBzZXR0aW5ncy5hcHAuZW1haWwpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gKHBpbmcpID8gJy91c2Vycy9waW5nJyA6ICcvdXNlcnMvYXV0aCc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS0VZJ10gPSBgJHtzZXR0aW5ncy5hcHAuYXBpX2tleX1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpXG4gICAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuKHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKTtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBrZXR0bGVzOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLmFwcCgpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoa2V0dGxlKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLmFwcCgpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cGRhdGVkS2V0dGxlID0gYW5ndWxhci5jb3B5KGtldHRsZSk7XG4gICAgICAgICAgICAvLyByZW1vdmUgbm90IG5lZWRlZCBkYXRhXG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS52YWx1ZXM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5tZXNzYWdlO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudGltZXJzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUua25vYjtcbiAgICAgICAgICAgIHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QgPSAoc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgQm9vbGVhbih1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KSkgPyAkZmlsdGVyKCdyb3VuZCcpKHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzL2FybSc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbjogc2V0dGluZ3MuYXBwLnNlc3Npb24sXG4gICAgICAgICAgICAgIGtldHRsZTogdXBkYXRlZEtldHRsZSxcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczogc2V0dGluZ3Mubm90aWZpY2F0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5hcHAoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBrZXR0bGU6IGtldHRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKHNlc3Npb24pID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuYXBwKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucy8nK3Nlc3Npb24uaWQ7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQQVRDSCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIG5hbWU6IHNlc3Npb24ubmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc2Vzc2lvbi50eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZihCb29sZWFuKHNldHRpbmdzLmluZmx1eGRiLnBvcnQpKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6IChpbmZsdXhkYikgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVybCl7XG4gICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uID0gYCR7aW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgICBpZihCb29sZWFuKGluZmx1eGRiLnBvcnQpKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudChgQ1JFQVRFIERBVEFCQVNFIFwiJHtuYW1lfVwiYCl9YCwgbWV0aG9kOiAnUE9TVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcGtnOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGdyYWluczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ncmFpbnMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBob3BzOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2hvcHMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB3YXRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS93YXRlci5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHN0eWxlczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3N0eWxlZ3VpZGUuanNvbicpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG92aWJvbmQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvbG92aWJvbmQuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjaGFydE9wdGlvbnM6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpbmVDaGFydCcsXG4gICAgICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlOiBCb29sZWFuKG9wdGlvbnMuc2Vzc2lvbiksXG4gICAgICAgICAgICAgICAgdGV4dDogQm9vbGVhbihvcHRpb25zLnNlc3Npb24pID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gQm9vbGVhbihvcHRpb25zLmNoYXJ0LmFyZWEpIH0sXG4gICAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZihCb29sZWFuKG9wdGlvbnMuY2hhcnQubWlsaXRhcnkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSDolTTolUycpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMlcCcpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCFvcHRpb25zLnVuaXQgfHwgb3B0aW9ucy51bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShkLDApKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0bykudG9GaXhlZCgyKTs7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX05BTUUpKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfREFURSkpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfQlJFV0VSKSlcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSkpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKSl7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKSl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QpKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgdmFyIG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5OQU1FKSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuU1RZTEUuQ0FURUdPUlkpKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoQm9vbGVhbihyZWNpcGUuRl9SX0RBVEUpKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuQlJFV0VSKSlcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5PRykpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5GRykpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKEJvb2xlYW4ocmVjaXBlLklCVSkpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5TVFlMRS5BQlZfTUFYKSlcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKEJvb2xlYW4ocmVjaXBlLlNUWUxFLkFCVl9NSU4pKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuRkVSTUVOVEFCTEVTKSl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihCb29sZWFuKHJlY2lwZS5IT1BTKSl7XG4gICAgICAgIHZhciBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuTUlTQ1MpKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoQm9vbGVhbihyZWNpcGUuWUVBU1RTKSl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==