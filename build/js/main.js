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
  $scope.site = { https: !!(document.location.protocol == 'https:'),
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
    if (!!l.length) return l[l.length - 1].hex;
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
            if (!!plug.status) {
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
    if (!!BrewService.sensorTypes(kettle.temp.type).percent) {
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
          return !!window.frameElement;
        } else {
          return !!($scope.share.access && $scope.share.access === access);
        }
      }
      return true;
    } else if (access && access == 'embed') {
      return !!window.frameElement;
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

    if (!!formatted_content) {
      var x2js = new X2JS();
      jsonObj = x2js.xml_str2json(formatted_content);
    }

    if (!jsonObj) return $scope.recipe_success = false;

    if ($ext == 'bsmx') {
      if (!!jsonObj.Recipes && !!jsonObj.Recipes.Data.Recipe) recipe = jsonObj.Recipes.Data.Recipe;else if (!!jsonObj.Selections && !!jsonObj.Selections.Data.Recipe) recipe = jsonObj.Selections.Data.Recipe;
      if (recipe) recipe = BrewService.recipeBeerSmith(recipe);else return $scope.recipe_success = false;
    } else if ($ext == 'xml') {
      if (!!jsonObj.RECIPES && !!jsonObj.RECIPES.RECIPE) recipe = jsonObj.RECIPES.RECIPE;
      if (recipe) recipe = BrewService.recipeBeerXML(recipe);else return $scope.recipe_success = false;
    }

    if (!recipe) return $scope.recipe_success = false;

    if (!!recipe.og) $scope.settings.recipe.og = recipe.og;
    if (!!recipe.fg) $scope.settings.recipe.fg = recipe.fg;

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
      if (!!kettle.timers && kettle.timers.length) {
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
    if (!!$scope.settings.general.shared) {
      $scope.error.type = 'warning';
      $scope.error.message = $sce.trustAsHtml('The monitor seems to be off-line, re-connecting...');
    } else {
      var message;

      if (typeof err == 'string' && err.indexOf('{') !== -1) {
        if (!Object.keys(err).length) return;
        err = JSON.parse(err);
        if (!Object.keys(err).length) return;
      }

      if (typeof err == 'string') message = err;else if (!!err.statusText) message = err.statusText;else if (err.config && err.config.url) message = err.config.url;else if (err.version) {
        if (kettle) kettle.message.version = err.version;
      } else {
        message = JSON.stringify(err);
        if (message == '{}') message = '';
      }

      if (!!message) {
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

    if (!!kettle.temp.current) kettle.temp.previous = kettle.temp.current;
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
    if (!!BrewService.sensorTypes(kettle.temp.type).percent && typeof kettle.percent != 'undefined') {
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
      var adjust = $scope.settings.general.unit == 'F' && !!kettle.temp.adjust ? $filter('round')(kettle.temp.adjust * 0.555, 3) : kettle.temp.adjust;
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
        currentSketch.actions.push('  trigger(F("heat"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      }
      if (kettle.cooler && kettle.cooler.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('  trigger(F("cool"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
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
        if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
        connection_string += '/write?';
        // add user/pass
        if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
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
    if (kettle && !!BrewService.sensorTypes(kettle.temp.type).percent && typeof kettle.percent != 'undefined') {
      currentValue = kettle.percent;
      unitType = '%';
    } else if (kettle) {
      kettle.values.push([date.getTime(), currentValue]);
    }

    if (!!timer) {
      //kettle is a timer object
      if (!$scope.settings.notifications.timers) return;
      if (timer.up) message = 'Your timers are done';else if (!!timer.notes) message = 'Time to add ' + timer.notes + ' of ' + timer.label;else message = 'Time to add ' + timer.label;
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
      if (!!timer && kettle && kettle.low && kettle.heater.running) return;
      var snd = new Audio(!!timer ? $scope.settings.sounds.timer : $scope.settings.sounds.alert); // buffers automatically when created
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
    if (!!BrewService.sensorTypes(kettle.temp.type).percent && typeof kettle.percent != 'undefined') {
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
    $scope.updateStreams(kettle);
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
        if (!!kettle.temp.adjust) {
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
        if (!!kettle && _.filter(kettle.timers, { up: { running: true } }).length == kettle.timers.length) $scope.notify(kettle, timer);
      } else if (!timer.up && timer.sec > 0) {
        //count down seconds
        timer.sec--;
      } else if (timer.up && timer.up.sec < 59) {
        //count up seconds
        timer.up.sec++;
      } else if (!timer.up) {
        //should we start the next timer?
        if (!!kettle) {
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
      }, !!$scope.settings.pollSeconds ? $scope.settings.pollSeconds * 1000 : 10000);
    }).catch(function (err) {
      $timeout(function () {
        return $scope.processTemps();
      }, !!$scope.settings.pollSeconds ? $scope.settings.pollSeconds * 1000 : 10000);
    });
  };

  $scope.removeKettle = function (kettle, $index) {
    $scope.updateStreams(kettle);
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
      $scope.updateStreams(kettle);
    }, 1000);
  };

  $scope.loadConfig() // load config
  .then($scope.init) // init
  .then(function (loaded) {
    if (!!loaded) $scope.processTemps(); // start polling
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
            scope.type = !!scope.type ? scope.type : 'text';
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

        if (!!arduino.secure) domain = 'https://' + domain;else domain = 'http://' + domain;
      }

      return domain;
    },

    isESP: function isESP(arduino, return_version) {
      if (return_version) {
        if (arduino.board.toLowerCase().indexOf('32') !== -1) return '32';else if (arduino.board.toLowerCase().indexOf('8266') !== -1) return '8266';else return false;
      }
      return !!(arduino && arduino.board && (arduino.board.toLowerCase().indexOf('esp') !== -1 || arduino.board.toLowerCase().indexOf('nodemcu') !== -1));
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
        if (!!kettle.temp.vcc && ['3V', '5V'].indexOf(kettle.temp.vcc) === -1) //SoilMoisture logic
          url += '&dpin=' + kettle.temp.vcc;else if (!!kettle.temp.index) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
      } else {
        if (!!kettle.temp.vcc && ['3V', '5V'].indexOf(kettle.temp.vcc) === -1) //SoilMoisture logic
          url += kettle.temp.vcc;else if (!!kettle.temp.index) //DS18B20 logic
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
            updatedKettle.temp.adjust = settings.general.unit == 'F' && !!updatedKettle.temp.adjust ? $filter('round')(updatedKettle.temp.adjust * 0.555, 3) : updatedKettle.temp.adjust;
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
      if (!!settings.influxdb.port) influxConnection += ':' + settings.influxdb.port;

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
            enable: !!options.session,
            text: !!options.session ? options.session : ''
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
            return !!options.chart.area;
          },
          xAxis: {
            axisLabel: 'Time',
            tickFormat: function tickFormat(d) {
              if (!!options.chart.military) return d3.time.format('%H:%M:%S')(new Date(d)).toLowerCase();else return d3.time.format('%I:%M:%S%p')(new Date(d)).toLowerCase();
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
      if (!!recipe.F_R_NAME) response.name = recipe.F_R_NAME;
      if (!!recipe.F_R_STYLE.F_S_CATEGORY) response.category = recipe.F_R_STYLE.F_S_CATEGORY;
      if (!!recipe.F_R_DATE) response.date = recipe.F_R_DATE;
      if (!!recipe.F_R_BREWER) response.brewer.name = recipe.F_R_BREWER;

      if (!!recipe.F_R_STYLE.F_S_MAX_OG) response.og = parseFloat(recipe.F_R_STYLE.F_S_MAX_OG).toFixed(3);else if (!!recipe.F_R_STYLE.F_S_MIN_OG) response.og = parseFloat(recipe.F_R_STYLE.F_S_MIN_OG).toFixed(3);
      if (!!recipe.F_R_STYLE.F_S_MAX_FG) response.fg = parseFloat(recipe.F_R_STYLE.F_S_MAX_FG).toFixed(3);else if (!!recipe.F_R_STYLE.F_S_MIN_FG) response.fg = parseFloat(recipe.F_R_STYLE.F_S_MIN_FG).toFixed(3);

      if (!!recipe.F_R_STYLE.F_S_MAX_ABV) response.abv = $filter('number')(recipe.F_R_STYLE.F_S_MAX_ABV, 2);else if (!!recipe.F_R_STYLE.F_S_MIN_ABV) response.abv = $filter('number')(recipe.F_R_STYLE.F_S_MIN_ABV, 2);

      if (!!recipe.F_R_STYLE.F_S_MAX_IBU) response.ibu = parseInt(recipe.F_R_STYLE.F_S_MAX_IBU, 10);else if (!!recipe.F_R_STYLE.F_S_MIN_IBU) response.ibu = parseInt(recipe.F_R_STYLE.F_S_MIN_IBU, 10);

      if (!!recipe.Ingredients.Data.Grain) {
        _.each(recipe.Ingredients.Data.Grain, function (grain) {
          response.grains.push({
            label: grain.F_G_NAME,
            min: parseInt(grain.F_G_BOIL_TIME, 10),
            notes: $filter('kilogramsToPounds')(grain.F_G_AMOUNT) + ' lb',
            amount: $filter('kilogramsToPounds')(grain.F_G_AMOUNT)
          });
        });
      }

      if (!!recipe.Ingredients.Data.Hops) {
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

      if (!!recipe.Ingredients.Data.Misc) {
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

      if (!!recipe.Ingredients.Data.Yeast) {
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

      if (!!recipe.NAME) response.name = recipe.NAME;
      if (!!recipe.STYLE.CATEGORY) response.category = recipe.STYLE.CATEGORY;

      // if(!!recipe.F_R_DATE)
      //   response.date = recipe.F_R_DATE;
      if (!!recipe.BREWER) response.brewer.name = recipe.BREWER;

      if (!!recipe.OG) response.og = parseFloat(recipe.OG).toFixed(3);
      if (!!recipe.FG) response.fg = parseFloat(recipe.FG).toFixed(3);

      if (!!recipe.IBU) response.ibu = parseInt(recipe.IBU, 10);

      if (!!recipe.STYLE.ABV_MAX) response.abv = $filter('number')(recipe.STYLE.ABV_MAX, 2);else if (!!recipe.STYLE.ABV_MIN) response.abv = $filter('number')(recipe.STYLE.ABV_MIN, 2);

      if (!!recipe.MASH.MASH_STEPS.MASH_STEP && recipe.MASH.MASH_STEPS.MASH_STEP.length && recipe.MASH.MASH_STEPS.MASH_STEP[0].STEP_TIME) {
        mash_time = recipe.MASH.MASH_STEPS.MASH_STEP[0].STEP_TIME;
      }

      if (!!recipe.FERMENTABLES) {
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

      if (!!recipe.HOPS) {
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

      if (!!recipe.MISCS) {
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

      if (!!recipe.YEASTS) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXJkdWlub19wYXNzIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJhcHAiLCJlbWFpbCIsImFwaV9rZXkiLCJzdGF0dXMiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwib3BlblNrZXRjaGVzIiwiJCIsIm1vZGFsIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYm9hcmQiLCJSU1NJIiwiYW5hbG9nIiwiZGlnaXRhbCIsImFkYyIsInNlY3VyZSIsInZlcnNpb24iLCJkdCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwiY29ubmVjdCIsInRoZW4iLCJpbmZvIiwiQnJld0JlbmNoIiwiZXZlbnQiLCJzcmNFbGVtZW50IiwiaW5uZXJIVE1MIiwidG91Y2giLCJjYXRjaCIsImVyciIsInJlYm9vdCIsInRwbGluayIsImxvZ2luIiwidXNlciIsInBhc3MiLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsInNldEVycm9yTWVzc2FnZSIsIm1zZyIsInBsdWdzIiwiZGV2aWNlTGlzdCIsInBsdWciLCJyZXNwb25zZURhdGEiLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImVtZXRlciIsImdldF9yZWFsdGltZSIsImVycl9jb2RlIiwicG93ZXIiLCJkZXZpY2UiLCJ0b2dnbGUiLCJvZmZPck9uIiwicmVsYXlfc3RhdGUiLCJhZGRLZXR0bGUiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJoaXQiLCJtZWFzdXJlZCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZvbHRzIiwidmFsdWVzIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJjb3VudCIsIm5vdGlmeSIsInNsYWNrIiwiZHdlZXQiLCJzdHJlYW1zIiwiaGFzU3RpY2t5S2V0dGxlcyIsImtldHRsZUNvdW50IiwiYWN0aXZlS2V0dGxlcyIsImhlYXRJc09uIiwiQm9vbGVhbiIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwiaXNFU1AiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNoYW5nZVNlbnNvciIsInNlbnNvclR5cGVzIiwicGVyY2VudCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJhdXRoIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwib24iLCJoaWdoIiwibG93IiwibGFzdCIsInN1YlRleHQiLCJlbmFibGVkIiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRvb2x0aXAiLCJhbmltYXRlZCIsInBsYWNlbWVudCIsInNob3ciLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidXBkYXRlQXJkdWlub1N0YXR1cyIsImRvbWFpbiIsInNrZXRjaF92ZXJzaW9uIiwidXBkYXRlVGVtcCIsImtleSIsInRlbXBzIiwic2hpZnQiLCJhbHRpdHVkZSIsInByZXNzdXJlIiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhlYXRTYWZldHkiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJiZiIsIkRIVCIsIkRTMThCMjAiLCJCTVAiLCJrZXR0bGVUeXBlIiwidW5zaGlmdCIsImEiLCJ0b0xvd2VyQ2FzZSIsImRvd25sb2FkU2tldGNoIiwiaGFzVHJpZ2dlcnMiLCJ0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmciLCJjb25uZWN0aW9uIiwiYXV0b2dlbiIsImdldCIsImpvaW4iLCJtZDUiLCJ0cmltIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiVEhDIiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsInVwZGF0ZVN0cmVhbXMiLCJjaGFuZ2VVbml0cyIsInYiLCJzZXNzaW9uIiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImFjY2Vzc1Rva2VuIiwic2V0SXRlbSIsImdldEl0ZW0iLCJkZWJ1ZyIsIm1pbGl0YXJ5IiwiYXJlYSIsInJlYWRPbmx5IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0Iiwid2l0aENyZWRlbnRpYWxzIiwic2Vuc29yIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJzYXZlIiwidXBkYXRlZEtldHRsZSIsInNlc3Npb25zIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJjb25zb2xlIiwic2VyaWVzIiwidGl0bGUiLCJlbmFibGUiLCJub0RhdGEiLCJoZWlnaHQiLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsImludGVycG9sYXRlIiwibGVnZW5kIiwiaXNBcmVhIiwieEF4aXMiLCJheGlzTGFiZWwiLCJ0aWNrRm9ybWF0IiwidGltZSIsIm9yaWVudCIsInRpY2tQYWRkaW5nIiwiYXhpc0xhYmVsRGlzdGFuY2UiLCJzdGFnZ2VyTGFiZWxzIiwiZm9yY2VZIiwieUF4aXMiLCJzaG93TWF4TWluIiwidG9GaXhlZCIsIm9wIiwiZnAiLCJwb3ciLCJzdWJzdHJpbmciLCJGX1JfTkFNRSIsIkZfUl9TVFlMRSIsIkZfU19DQVRFR09SWSIsIkZfUl9EQVRFIiwiRl9SX0JSRVdFUiIsIkZfU19NQVhfT0ciLCJGX1NfTUlOX09HIiwiRl9TX01BWF9GRyIsIkZfU19NSU5fRkciLCJGX1NfTUFYX0FCViIsIkZfU19NSU5fQUJWIiwiRl9TX01BWF9JQlUiLCJwYXJzZUludCIsIkZfU19NSU5fSUJVIiwiSW5ncmVkaWVudHMiLCJHcmFpbiIsIkZfR19OQU1FIiwiRl9HX0JPSUxfVElNRSIsIkZfR19BTU9VTlQiLCJIb3BzIiwiRl9IX05BTUUiLCJGX0hfRFJZX0hPUF9USU1FIiwiRl9IX0JPSUxfVElNRSIsIkZfSF9BTU9VTlQiLCJNaXNjIiwiRl9NX05BTUUiLCJGX01fVElNRSIsIkZfTV9BTU9VTlQiLCJZZWFzdCIsIkZfWV9MQUIiLCJGX1lfUFJPRFVDVF9JRCIsIkZfWV9OQU1FIiwibWFzaF90aW1lIiwiTkFNRSIsIlNUWUxFIiwiQ0FURUdPUlkiLCJCUkVXRVIiLCJPRyIsIkZHIiwiSUJVIiwiQUJWX01BWCIsIkFCVl9NSU4iLCJNQVNIIiwiTUFTSF9TVEVQUyIsIk1BU0hfU1RFUCIsIlNURVBfVElNRSIsIkZFUk1FTlRBQkxFUyIsIkZFUk1FTlRBQkxFIiwiQU1PVU5UIiwiSE9QUyIsIkhPUCIsIkZPUk0iLCJVU0UiLCJUSU1FIiwiTUlTQ1MiLCJNSVNDIiwiWUVBU1RTIiwiWUVBU1QiLCJjb250ZW50IiwiaHRtbGNoYXJzIiwiZiIsInIiLCJjaGFyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUEsa0JBQVFBLE1BQVIsQ0FBZSxtQkFBZixFQUFvQyxDQUNsQyxXQURrQyxFQUVqQyxNQUZpQyxFQUdqQyxTQUhpQyxFQUlqQyxVQUppQyxFQUtq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ZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhRYyxFQXlRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXpRYyxFQTBRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFRYyxFQTJRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTNRYyxFQTRRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVRYyxFQTZRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTdRYyxFQThRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlRYyxFQStRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9RYyxFQWdSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWhSYyxFQWlSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWpSYyxFQWtSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxSYyxFQW1SZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5SYyxFQW9SZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBSYyxFQXFSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJSYyxFQXNSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRSYyxFQXVSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZSYyxFQXdSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhSYyxFQXlSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXpSYyxFQTBSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFSYyxFQTJSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTNSYyxFQTRS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R0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdGZjLEVBdWZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdmZjLEVBd2ZkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEtBQWhCLEVBeGZjLEVBeWZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBemZjLEVBMGZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMWZjLEVBMmZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM2ZjLENBQWhCOztBQThmQWpqQixRQUFFb0UsSUFBRixDQUFPMmUsU0FBUCxFQUFrQixVQUFTRyxJQUFULEVBQWU7QUFDL0IsWUFBR0osUUFBUWxqQixPQUFSLENBQWdCc2pCLEtBQUtGLENBQXJCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7QUFDaENGLG9CQUFVQSxRQUFRbmpCLE9BQVIsQ0FBZ0IwWSxPQUFPNkssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUF2cERJLEdBQVA7QUF5cERELENBNXBERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsO1xudmFyIHJlc2V0Q2hhcnQgPSAxMDA7XG52YXIgdGltZW91dCA9IG51bGw7IC8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5CcmV3U2VydmljZSA9IEJyZXdTZXJ2aWNlO1xuJHNjb3BlLnNpdGUgPSB7aHR0cHM6ICEhKGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sPT0naHR0cHM6JylcbiAgLCBodHRwc191cmw6IGBodHRwczovLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH1gXG59O1xuJHNjb3BlLmVzcCA9IHtcbiAgdHlwZTogJycsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJ2JiZXNwJyxcbiAgYXJkdWlub19wYXNzOiAnYmJhZG1pbicsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbmlmICghJHNjb3BlLnNldHRpbmdzLmFwcClcbiAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IHsgZW1haWw6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJyB9O1xuLy8gZ2VuZXJhbCBjaGVjayBhbmQgdXBkYXRlXG5pZighJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwpXG4gIHJldHVybiAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydH0pO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4kc2NvcGUuc2hhcmUgPSAoISRzdGF0ZS5wYXJhbXMuZmlsZSAmJiBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSkgPyBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSA6IHtcbiAgICAgIGZpbGU6ICRzdGF0ZS5wYXJhbXMuZmlsZSB8fCBudWxsXG4gICAgICAsIHBhc3N3b3JkOiBudWxsXG4gICAgICAsIG5lZWRQYXNzd29yZDogZmFsc2VcbiAgICAgICwgYWNjZXNzOiAncmVhZE9ubHknXG4gICAgICAsIGRlbGV0ZUFmdGVyOiAxNFxuICB9O1xuXG4kc2NvcGUub3BlblNrZXRjaGVzID0gZnVuY3Rpb24oKXtcbiAgJCgnI3NldHRpbmdzTW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAkKCcjc2tldGNoZXNNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG59O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtQnkob2JqLCdhbW91bnQnKTtcbn07XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYm9hcmQ6ICcnLFxuICAgICAgICBSU1NJOiBmYWxzZSxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgYWRjOiAwLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7ZXJyb3I6ICcnLGR0OiAnJyxtZXNzYWdlOicnfVxuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKGFyZHVpbm8pID0+IHtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdDb25uZWN0aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ2luZm8nKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBpZihpbmZvICYmIGluZm8uQnJld0JlbmNoKXtcbiAgICAgICAgICAgIGV2ZW50LnNyY0VsZW1lbnQuaW5uZXJIVE1MID0gJ0Nvbm5lY3QnO1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZWJvb3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ3JlYm9vdCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9ICcnO1xuICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290IFN1Y2Nlc3MsIHRyeSBjb25uZWN0aW5nIGluIGEgZmV3IHNlY29uZHMuJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKHBrZy52ZXJzaW9uIDwgNC4yKVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdVcGdyYWRlIHRvIHN1cHBvcnQgcmVib290JztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgbG9naW46ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkubG9naW4oJHNjb3BlLnNldHRpbmdzLnRwbGluay51c2VyLCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGFzcylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnRva2VuKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnRva2VuID0gcmVzcG9uc2UudG9rZW47XG4gICAgICAgICAgICAkc2NvcGUudHBsaW5rLnNjYW4ocmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnU2Nhbm5pbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZighIXBsdWcuc3RhdHVzKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG4gIFxuICAkc2NvcGUuaGVhdElzT24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydoZWF0ZXInOiB7J3J1bm5pbmcnOiB0cnVlfX0pLmxlbmd0aCk7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihhcmR1aW5vLCBwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZSBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vKSl7XG4gICAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8sIHRydWUpID09ICc4MjY2JylcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0EnLCdHUElPJykucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwaW47XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCl7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwQjAnO1xuICAgIH1cbiAgICBrZXR0bGUudGVtcC52Y2MgPSAnJztcbiAgICBrZXR0bGUudGVtcC5pbmRleCA9ICcnO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlVGVzdCA9IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgIGFyZHVpbm8udGVzdGluZyA9IHRydWU7XG4gICAgQnJld1NlcnZpY2Uuc2hhcmVUZXN0KGFyZHVpbm8pXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5odHRwX2NvZGUgPT0gMjAwKVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmluZmx1eGRiID0ge1xuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIgPSBkZWZhdWx0U2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQgfHwgcmVzcG9uc2Uuc3RhdHVzID09IDIwMCl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFwcCA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSAmJlxuICAgICAgICBCb29sZWFuKCRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleSkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcC5zdGF0dXMgPT0gJ0Nvbm5lY3RlZCdcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFwcCA9IGRlZmF1bHRTZXR0aW5ncy5hcHA7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmVtYWlsKSB8fCAhQm9vbGVhbigkc2NvcGUuc2V0dGluZ3MuYXBwLmFwaV9rZXkpKVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5hcHAoKS5hdXRoKHRydWUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYXBwLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc2hhcmVBY2Nlc3MgPSBmdW5jdGlvbihhY2Nlc3Mpe1xuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICAgaWYoYWNjZXNzKXtcbiAgICAgICAgICBpZihhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAhISgkc2NvcGUuc2hhcmUuYWNjZXNzICYmICRzY29wZS5zaGFyZS5hY2Nlc3MgPT09IGFjY2Vzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmKGFjY2VzcyAmJiBhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU2hhcmVGaWxlID0gZnVuY3Rpb24oKXtcbiAgICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAgICRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGdyYWluLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoaG9wLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogaG9wLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoaG9wLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTond2F0ZXInfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUubWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBtaXNjLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IG1pc2Mubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUueWVhc3QubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdCA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLnllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogeWVhc3QubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTdHlsZXMgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc3R5bGVzKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnN0eWxlcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkc2NvcGUuc3R5bGVzID0gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjb25maWcgPSBbXTtcbiAgICBpZighJHNjb3BlLnBrZyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCh7XG4gICAgICBhbmltYXRlZDogJ2ZhZGUnLFxuICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgICAgaHRtbDogdHJ1ZVxuICAgIH0pO1xuICAgIGlmKCQoJyNnaXRjb21taXQgYScpLnRleHQoKSAhPSAnZ2l0X2NvbW1pdCcpe1xuICAgICAgJCgnI2dpdGNvbW1pdCcpLnNob3coKTtcbiAgICB9XG4gICAgJHNjb3BlLnNob3dTZXR0aW5ncyA9ICEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQ7XG4gICAgaWYoJHNjb3BlLnNoYXJlLmZpbGUpXG4gICAgICByZXR1cm4gJHNjb3BlLmxvYWRTaGFyZUZpbGUoKTtcblxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoISFrZXR0bGUudGltZXJzICYmIGtldHRsZS50aW1lcnMubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2goa2V0dGxlLnRpbWVycywgdGltZXIgPT4ge1xuICAgICAgICAgICAgaWYodGltZXIucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZighdGltZXIucnVubmluZyAmJiB0aW1lci5xdWV1ZSl7XG4gICAgICAgICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIudXAucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lci51cCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSA9IGZ1bmN0aW9uKGVyciwga2V0dGxlLCBsb2NhdGlvbil7XG4gICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpe1xuICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnd2FybmluZyc7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ1RoZSBtb25pdG9yIHNlZW1zIHRvIGJlIG9mZi1saW5lLCByZS1jb25uZWN0aW5nLi4uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKCEhZXJyLnN0YXR1c1RleHQpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuc3RhdHVzVGV4dDtcbiAgICAgIGVsc2UgaWYoZXJyLmNvbmZpZyAmJiBlcnIuY29uZmlnLnVybClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5jb25maWcudXJsO1xuICAgICAgZWxzZSBpZihlcnIudmVyc2lvbil7XG4gICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS52ZXJzaW9uID0gZXJyLnZlcnNpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoZXJyKTtcbiAgICAgICAgaWYobWVzc2FnZSA9PSAne30nKSBtZXNzYWdlID0gJyc7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhbWVzc2FnZSl7XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdkYW5nZXInO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICBpZihsb2NhdGlvbilcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBtZXNzYWdlKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3IgY29ubmVjdGluZyB0byAke0JyZXdTZXJ2aWNlLmRvbWFpbihrZXR0bGUuYXJkdWlubyl9YCk7XG4gICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ0Nvbm5lY3Rpb24gZXJyb3I6Jyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBlcnJvcil7XG4gICAgdmFyIGFyZHVpbm8gPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MsIHtpZDogcmVzcG9uc2Uua2V0dGxlLmFyZHVpbm8uaWR9KTtcbiAgICBpZihhcmR1aW5vLmxlbmd0aCl7XG4gICAgICBhcmR1aW5vWzBdLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihyZXNwb25zZS5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgYXJkdWlub1swXS52ZXJzaW9uID0gcmVzcG9uc2Uuc2tldGNoX3ZlcnNpb247XG4gICAgICBpZihlcnJvcilcbiAgICAgICAgYXJkdWlub1swXS5zdGF0dXMuZXJyb3IgPSBlcnJvcjtcbiAgICAgIGVsc2VcbiAgICAgICAgYXJkdWlub1swXS5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVzZXRFcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoa2V0dGxlKSB7XG4gICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVUZW1wID0gZnVuY3Rpb24ocmVzcG9uc2UsIGtldHRsZSl7XG4gICAgaWYoIXJlc3BvbnNlKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgIC8vIG5lZWRlZCBmb3IgY2hhcnRzXG4gICAga2V0dGxlLmtleSA9IGtldHRsZS5uYW1lO1xuICAgIHZhciB0ZW1wcyA9IFtdO1xuICAgIC8vY2hhcnQgZGF0ZVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL3VwZGF0ZSBkYXRhdHlwZVxuICAgIHJlc3BvbnNlLnRlbXAgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnRlbXApO1xuICAgIHJlc3BvbnNlLnJhdyA9IHBhcnNlRmxvYXQocmVzcG9uc2UucmF3KTtcbiAgICBpZihyZXNwb25zZS52b2x0cylcbiAgICAgIHJlc3BvbnNlLnZvbHRzID0gcGFyc2VGbG9hdChyZXNwb25zZS52b2x0cyk7XG5cbiAgICBpZighIWtldHRsZS50ZW1wLmN1cnJlbnQpXG4gICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgICRmaWx0ZXIoJ3JvdW5kJykocmVzcG9uc2UudGVtcCwyKTtcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIC8vIHNldCByYXdcbiAgICBrZXR0bGUudGVtcC5yYXcgPSByZXNwb25zZS5yYXc7XG4gICAga2V0dGxlLnRlbXAudm9sdHMgPSByZXNwb25zZS52b2x0cztcblxuICAgIC8vIHZvbHQgY2hlY2tcbiAgICBpZihrZXR0bGUudGVtcC50eXBlICE9ICdCTVAxODAnICYmXG4gICAgICAha2V0dGxlLnRlbXAudm9sdHMgJiZcbiAgICAgICFrZXR0bGUudGVtcC5yYXcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnICYmXG4gICAgICByZXNwb25zZS50ZW1wID09IC0xMjcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHkgYXMgYSBwZXJjZW50XG4gICAgLy9Tb2lsTW9pc3R1cmVEIGhhcyBtb2lzdHVyZSBhcyBhIHBlcmNlbnRcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSByZXNwb25zZS5wZXJjZW50O1xuICAgIH1cbiAgICAvLyBCTVAgc2Vuc29ycyBoYXZlIGFsdGl0dWRlIGFuZCBwcmVzc3VyZVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuYWx0aXR1ZGUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLmFsdGl0dWRlID0gcmVzcG9uc2UuYWx0aXR1ZGU7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucHJlc3N1cmUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgLy8gcGFzY2FsIHRvIGluY2hlcyBvZiBtZXJjdXJ5XG4gICAgICBrZXR0bGUucHJlc3N1cmUgPSByZXNwb25zZS5wcmVzc3VyZSAvIDMzODYuMzg5O1xuICAgIH1cblxuICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlLCBza2V0Y2hfdmVyc2lvbjpyZXNwb25zZS5za2V0Y2hfdmVyc2lvbn0pO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaC1hbHQnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgIHZhciBrO1xuICAgIHZhciBoZWF0SXNPbiA9ICRzY29wZS5oZWF0SXNPbigpO1xuICAgIFxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgIGlmIChpdGVtID09ICdoZWF0JyAmJiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5oZWF0U2FmZXR5ICYmIGhlYXRJc09uKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ0EgaGVhdGVyIGlzIGFscmVhZHkgcnVubmluZy4nLCBrZXR0bGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMpXG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycyA9IHt9O1xuICAgIC8vIGFwcGVuZCBlc3AgdHlwZVxuICAgIGlmKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xKVxuICAgICAgc2tldGNoTmFtZSArPSAkc2NvcGUuZXNwLnR5cGU7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vID8ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpIDogJ0RlZmF1bHQnO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6IGFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIHR5cGU6IHNrZXRjaE5hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlLFxuICAgICAgICAgIGJmOiAoc2tldGNoTmFtZS5pbmRleE9mKCdCRicpICE9PSAtMSkgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIWtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJiAkc2NvcGUuZXNwLmF1dG9jb25uZWN0KXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBdXRvQ29ubmVjdC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xIHx8IEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSkgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZWVnZWUtdG9reW8vREhUZXNwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpO1xuICAgICAgfSBlbHNlIGlmKCFCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRsaWItMS4yLjkuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRTMThCMjAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDE4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYWRhZnJ1aXQvQWRhZnJ1aXRfQURTMVgxNScpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCB0aGUgYWN0aW9ucyBjb21tYW5kXG4gICAgICB2YXIga2V0dGxlVHlwZSA9IGtldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZiAoa2V0dGxlLnRlbXAudmNjKVxuICAgICAgICBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIFxuICAgICAgaWYgKGtldHRsZS50ZW1wLmluZGV4KSBrZXR0bGVUeXBlICs9ICctJyArIGtldHRsZS50ZW1wLmluZGV4OyAgICAgIFxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc0NvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpO1xuICAgICAgXG4gICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGtldHRsZS5wZXJjZW50KSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNQZXJjZW50Q29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnLUh1bWlkaXR5XCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTsgICAgICAgIFxuICAgICAgfVxuICAgICAgXG4gICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYgKHNrZXRjaC50cmlnZ2VycyB8fCBza2V0Y2guYmYpIHtcbiAgICAgICAgaWYgKHNrZXRjaC50eXBlLmluZGV4T2YoJ001JykgPT09IC0xKSB7XG4gICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7Jyk7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZikge1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgYW1iaWVudCA9IDAuMDA7Jyk7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCBodW1pZGl0eSA9IDAuMDA7Jyk7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdjb25zdCBTdHJpbmcgZXF1aXBtZW50X25hbWUgPSBcIicrJHNjb3BlLnNldHRpbmdzLmJmLm5hbWUrJ1wiOycpOyAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kIFxuICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IHNrZXRjaC5hY3Rpb25zLmxlbmd0aDsgYSsrKXtcbiAgICAgICAgICBpZiAoc2tldGNoLmJmICYmIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h1bWlkaXR5JykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAvLyBCRiBsb2dpY1xuICAgICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zUGVyY2VudENvbW1hbmQoJywgJ2h1bWlkaXR5ID0gYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2tldGNoLmJmICYmIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xICYmXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYW1iaWVudCcpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywgJ2FtYmllbnQgPSBhY3Rpb25zQ29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyBBbGwgb3RoZXIgbG9naWNcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICd0ZW1wID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignQXBwJyApICE9PSAtMSl7XG4gICAgICAgICAgLy8gYXBwIGNvbm5lY3Rpb25cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUFBfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5hcHAuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdCRll1bicgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGJmIGFwaSBrZXkgaGVhZGVyXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQkZfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5iZi5hcGlfa2V5LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIgJiYgISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcylcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5USEMpIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gVEhDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLScrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBtZWFzdXJlZCBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5zbGFjaygkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIGljb24sXG4gICAgICAgICAga2V0dGxlXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgaWYoZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7SlNPTi5zdHJpbmdpZnkoZXJyKX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVLbm9iQ29weSA9IGZ1bmN0aW9uKGtldHRsZSl7XG5cbiAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnbm90IHJ1bm5pbmcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLm1lc3NhZ2UubWVzc2FnZSAmJiBrZXR0bGUubWVzc2FnZS50eXBlID09ICdkYW5nZXInKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVW5pdHMgPSBmdW5jdGlvbih1bml0KXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ICE9IHVuaXQpe1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC50YXJnZXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5jdXJyZW50KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5tZWFzdXJlZCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAucHJldmlvdXMsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC50YXJnZXQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAudGFyZ2V0LDApO1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLmFkanVzdCl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0LCBzZXNzaW9uOiAkc2NvcGUuc2V0dGluZ3MuYXBwLnNlc3Npb259KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1cGRhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUsJGluZGV4KXtcbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoISFsb2FkZWQpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuXG4gIC8vIHVwZGF0ZSBsb2NhbCBjYWNoZVxuICAkc2NvcGUudXBkYXRlTG9jYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJywgJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJywgJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSwgNTAwMCk7XG4gIH07XG4gIFxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdkYm1QZXJjZW50JywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbihkYm0pe1xuICAgIHJldHVybiAyICogKGRibSArIDEwMCk7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDM1LjI3NCwgMik7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDIuMjA0NjIsIDIpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFjY2Vzc1Rva2VuOiBmdW5jdGlvbih0b2tlbil7XG4gICAgICBpZih0b2tlbilcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLHRva2VuKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYWNjZXNzVG9rZW4nKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlLCBoZWF0U2FmZXR5OiBmYWxzZX1cbiAgICAgICAgLGNoYXJ0OiB7c2hvdzogdHJ1ZSwgbWlsaXRhcnk6IGZhbHNlLCBhcmVhOiBmYWxzZX1cbiAgICAgICAgLHNlbnNvcnM6IHtESFQ6IGZhbHNlLCBEUzE4QjIwOiBmYWxzZSwgQk1QOiBmYWxzZX1cbiAgICAgICAgLHJlY2lwZTogeyduYW1lJzonJywnYnJld2VyJzp7bmFtZTonJywnZW1haWwnOicnfSwneWVhc3QnOltdLCdob3BzJzpbXSwnZ3JhaW5zJzpbXSxzY2FsZTonZ3Jhdml0eScsbWV0aG9kOidwYXBhemlhbicsJ29nJzoxLjA1MCwnZmcnOjEuMDEwLCdhYnYnOjAsJ2Fidyc6MCwnY2Fsb3JpZXMnOjAsJ2F0dGVudWF0aW9uJzowfVxuICAgICAgICAsbm90aWZpY2F0aW9uczoge29uOnRydWUsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9XG4gICAgICAgICxzb3VuZHM6IHtvbjp0cnVlLGFsZXJ0OicvYXNzZXRzL2F1ZGlvL2Jpa2UubXAzJyx0aW1lcjonL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJ31cbiAgICAgICAgLGFyZHVpbm9zOiBbe2lkOidsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLGJvYXJkOicnLFJTU0k6ZmFsc2UsdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZSx2ZXJzaW9uOicnLHN0YXR1czp7ZXJyb3I6JycsZHQ6JycsbWVzc2FnZTonJ319XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczpbXSwgc3RhdHVzOiAnJ31cbiAgICAgICAgLGFwcDoge2VtYWlsOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJyd9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdCb2lsJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMTgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1RlbXAnLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1NvaWwnLCd0eXBlJzonc2VlZGxpbmcnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonUGxhbnQnLCd0eXBlJzonY2FubmFiaXMnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vLCByZXR1cm5fdmVyc2lvbil7XG4gICAgICBpZihyZXR1cm5fdmVyc2lvbil7XG4gICAgICAgIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCczMicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzMyJztcbiAgICAgICAgZWxzZSBpZihhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignODI2NicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzgyNjYnO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICEhKGFyZHVpbm8gJiYgYXJkdWluby5ib2FyZCAmJiAoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2VzcCcpICE9PSAtMSB8fCBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbm9kZW1jdScpICE9PSAtMSkpO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykrJy9hcmR1aW5vLycrZW5kcG9pbnQ7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDApXG4gICAgICAgICAgdXJsICs9ICc/YXBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHVybCArPSAnP2RwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAudmNjICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKCEha2V0dGxlLnRlbXAuaW5kZXgpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICAgIHVybCArPSAnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyByZWFkL3dyaXRlIGhlYXRlclxuICAgIC8vIGh0dHA6Ly9hcmR1aW5vdHJvbmljcy5ibG9nc3BvdC5jb20vMjAxMy8wMS93b3JraW5nLXdpdGgtc2FpbnNtYXJ0LTV2LXJlbGF5LWJvYXJkLmh0bWxcbiAgICAvLyBodHRwOi8vbXlob3d0b3NhbmRwcm9qZWN0cy5ibG9nc3BvdC5jb20vMjAxNC8wMi9zYWluc21hcnQtMi1jaGFubmVsLTV2LXJlbGF5LWFyZHVpbm8uaHRtbFxuICAgIGRpZ2l0YWw6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/ZHBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/YXBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3I7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG9hZFNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gJyc7XG4gICAgICBpZihwYXNzd29yZClcbiAgICAgICAgcXVlcnkgPSAnP3Bhc3N3b3JkPScrbWQ1KHBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2dldC8nK2ZpbGUrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gZmluaXNoIHRoaXNcbiAgICAvLyBkZWxldGVTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAvLyAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAvLyAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2RlbGV0ZS8nK2ZpbGUsIG1ldGhvZDogJ0dFVCd9KVxuICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgLy8gICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAvLyAgICAgICBxLnJlamVjdChlcnIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIHJldHVybiBxLnByb21pc2U7XG4gICAgLy8gfSxcblxuICAgIGNyZWF0ZVNoYXJlOiBmdW5jdGlvbihzaGFyZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGtldHRsZXMgPSB0aGlzLnNldHRpbmdzKCdrZXR0bGVzJyk7XG4gICAgICB2YXIgc2ggPSBPYmplY3QuYXNzaWduKHt9LCB7cGFzc3dvcmQ6IHNoYXJlLnBhc3N3b3JkLCBhY2Nlc3M6IHNoYXJlLmFjY2Vzc30pO1xuICAgICAgLy9yZW1vdmUgc29tZSB0aGluZ3Mgd2UgZG9uJ3QgbmVlZCB0byBzaGFyZVxuICAgICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0ua25vYjtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0udmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuYXBwO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmluZmx1eGRiO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnRwbGluaztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnNrZXRjaGVzO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkd2VldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYXRlc3Q6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9sYXRlc3QvZHdlZXQvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9kd2VldHMvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgYXBwOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHBzOi8vc2Vuc29yLmJyZXdiZW5jaC5jbycsIGhlYWRlcnM6IHt9LCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXV0aDogYXN5bmMgKHBpbmcpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MuYXBwLmFwaV9rZXkgJiYgc2V0dGluZ3MuYXBwLmVtYWlsKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9IChwaW5nKSA/ICcvdXNlcnMvcGluZycgOiAnL3VzZXJzL2F1dGgnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0nYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtFWSddID0gYCR7c2V0dGluZ3MuYXBwLmFwaV9rZXl9YDtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKVxuICAgICAgICAgICAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbihyZXNwb25zZS5kYXRhLmFjY2Vzcy5pZCk7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVqZWN0KGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAga2V0dGxlczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5hcHAoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKGtldHRsZSkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5hcHAoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXBkYXRlZEtldHRsZSA9IGFuZ3VsYXIuY29weShrZXR0bGUpO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG5vdCBuZWVkZWQgZGF0YVxuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudmFsdWVzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUubWVzc2FnZTtcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnRpbWVycztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLmtub2I7XG4gICAgICAgICAgICB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0ID0gKHNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEhdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzL2FybSc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbjogc2V0dGluZ3MuYXBwLnNlc3Npb24sXG4gICAgICAgICAgICAgIGtldHRsZTogdXBkYXRlZEtldHRsZSxcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczogc2V0dGluZ3Mubm90aWZpY2F0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5hcHAoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBrZXR0bGU6IGtldHRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKHNlc3Npb24pID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuYXBwKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucy8nK3Nlc3Npb24uaWQ7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQQVRDSCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIG5hbWU6IHNlc3Npb24ubmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc2Vzc2lvbi50eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZighIXNldHRpbmdzLmluZmx1eGRiLnBvcnQpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKEJvb2xlYW4oaW5mbHV4ZGIucG9ydCkpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdzaG93IGRhdGFiYXNlcycpfWAsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzICl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6ICEhb3B0aW9ucy5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6ICEhb3B0aW9ucy5zZXNzaW9uID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gISFvcHRpb25zLmNoYXJ0LmFyZWEgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCEhb3B0aW9ucy5jaGFydC5taWxpdGFyeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgdmFyIHNnID0gKDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoKHBsYXRvIC8gMjU4LjIpICogMjI3LjEpKSkpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpLnRvRml4ZWQoMyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgdmFyIHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pLnRvRml4ZWQoMik7O1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkZfR19BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2Mpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0KXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgdmFyIG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZighIXJlY2lwZS5OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuU1RZTEUuQ0FURUdPUlk7XG5cbiAgICAgIC8vIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk9HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLk9HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLklCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NQVgpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUFYLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUlOKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5GRVJNRU5UQUJMRVMpe1xuICAgICAgICB2YXIgZ3JhaW5zID0gKHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgJiYgcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRS5sZW5ndGgpID8gcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSA6IHJlY2lwZS5GRVJNRU5UQUJMRVM7XG4gICAgICAgIF8uZWFjaChncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtYXNoX3RpbWUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uQU1PVU5UKSsnIGxiJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5BTU9VTlQpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSE9QUyl7XG4gICAgICAgIHZhciBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuTUlTQ1Mpe1xuICAgICAgICB2YXIgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5ZRUFTVFMpe1xuICAgICAgICB2YXIgeWVhc3QgPSAocmVjaXBlLllFQVNUUy5ZRUFTVCAmJiByZWNpcGUuWUVBU1RTLllFQVNULmxlbmd0aCkgPyByZWNpcGUuWUVBU1RTLllFQVNUIDogcmVjaXBlLllFQVNUUztcbiAgICAgICAgICBfLmVhY2goeWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0Lk5BTUVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgZm9ybWF0WE1MOiBmdW5jdGlvbihjb250ZW50KXtcbiAgICAgIHZhciBodG1sY2hhcnMgPSBbXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMjgyOycsIHI6ICfEmid9LFxuICAgICAgICB7ZjogJyYjMjgzOycsIHI6ICfEmyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDQ7JywgcjogJ8WYJ30sXG4gICAgICAgIHtmOiAnJiMzNDU7JywgcjogJ8WZJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyYjMzY2OycsIHI6ICfFrid9LFxuICAgICAgICB7ZjogJyYjMzY3OycsIHI6ICfFryd9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMyNjQ7JywgcjogJ8SIJ30sXG4gICAgICAgIHtmOiAnJiMyNjU7JywgcjogJ8SJJ30sXG4gICAgICAgIHtmOiAnJiMyODQ7JywgcjogJ8ScJ30sXG4gICAgICAgIHtmOiAnJiMyODU7JywgcjogJ8SdJ30sXG4gICAgICAgIHtmOiAnJiMyOTI7JywgcjogJ8SkJ30sXG4gICAgICAgIHtmOiAnJiMyOTM7JywgcjogJ8SlJ30sXG4gICAgICAgIHtmOiAnJiMzMDg7JywgcjogJ8S0J30sXG4gICAgICAgIHtmOiAnJiMzMDk7JywgcjogJ8S1J30sXG4gICAgICAgIHtmOiAnJiMzNDg7JywgcjogJ8WcJ30sXG4gICAgICAgIHtmOiAnJiMzNDk7JywgcjogJ8WdJ30sXG4gICAgICAgIHtmOiAnJiMzNjQ7JywgcjogJ8WsJ30sXG4gICAgICAgIHtmOiAnJiMzNjU7JywgcjogJ8WtJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZPRWxpZzsnLCByOiAnxZInfSxcbiAgICAgICAge2Y6ICcmb2VsaWc7JywgcjogJ8WTJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNzY7JywgcjogJ8W4J30sXG4gICAgICAgIHtmOiAnJnl1bWw7JywgcjogJ8O/J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzI5NjsnLCByOiAnxKgnfSxcbiAgICAgICAge2Y6ICcmIzI5NzsnLCByOiAnxKknfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzM2MDsnLCByOiAnxagnfSxcbiAgICAgICAge2Y6ICcmIzM2MTsnLCByOiAnxaknfSxcbiAgICAgICAge2Y6ICcmIzMxMjsnLCByOiAnxLgnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzMzY7JywgcjogJ8WQJ30sXG4gICAgICAgIHtmOiAnJiMzMzc7JywgcjogJ8WRJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzY4OycsIHI6ICfFsCd9LFxuICAgICAgICB7ZjogJyYjMzY5OycsIHI6ICfFsSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmVEhPUk47JywgcjogJ8OeJ30sXG4gICAgICAgIHtmOiAnJnRob3JuOycsIHI6ICfDvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMyNTY7JywgcjogJ8SAJ30sXG4gICAgICAgIHtmOiAnJiMyNTc7JywgcjogJ8SBJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzQ7JywgcjogJ8SSJ30sXG4gICAgICAgIHtmOiAnJiMyNzU7JywgcjogJ8STJ30sXG4gICAgICAgIHtmOiAnJiMyOTA7JywgcjogJ8SiJ30sXG4gICAgICAgIHtmOiAnJiMyOTE7JywgcjogJ8SjJ30sXG4gICAgICAgIHtmOiAnJiMyOTg7JywgcjogJ8SqJ30sXG4gICAgICAgIHtmOiAnJiMyOTk7JywgcjogJ8SrJ30sXG4gICAgICAgIHtmOiAnJiMzMTA7JywgcjogJ8S2J30sXG4gICAgICAgIHtmOiAnJiMzMTE7JywgcjogJ8S3J30sXG4gICAgICAgIHtmOiAnJiMzMTU7JywgcjogJ8S7J30sXG4gICAgICAgIHtmOiAnJiMzMTY7JywgcjogJ8S8J30sXG4gICAgICAgIHtmOiAnJiMzMjU7JywgcjogJ8WFJ30sXG4gICAgICAgIHtmOiAnJiMzMjY7JywgcjogJ8WGJ30sXG4gICAgICAgIHtmOiAnJiMzNDI7JywgcjogJ8WWJ30sXG4gICAgICAgIHtmOiAnJiMzNDM7JywgcjogJ8WXJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNjI7JywgcjogJ8WqJ30sXG4gICAgICAgIHtmOiAnJiMzNjM7JywgcjogJ8WrJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmIzI2MDsnLCByOiAnxIQnfSxcbiAgICAgICAge2Y6ICcmIzI2MTsnLCByOiAnxIUnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI4MDsnLCByOiAnxJgnfSxcbiAgICAgICAge2Y6ICcmIzI4MTsnLCByOiAnxJknfSxcbiAgICAgICAge2Y6ICcmIzMyMTsnLCByOiAnxYEnfSxcbiAgICAgICAge2Y6ICcmIzMyMjsnLCByOiAnxYInfSxcbiAgICAgICAge2Y6ICcmIzMyMzsnLCByOiAnxYMnfSxcbiAgICAgICAge2Y6ICcmIzMyNDsnLCByOiAnxYQnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDY7JywgcjogJ8WaJ30sXG4gICAgICAgIHtmOiAnJiMzNDc7JywgcjogJ8WbJ30sXG4gICAgICAgIHtmOiAnJiMzNzc7JywgcjogJ8W5J30sXG4gICAgICAgIHtmOiAnJiMzNzg7JywgcjogJ8W6J30sXG4gICAgICAgIHtmOiAnJiMzNzk7JywgcjogJ8W7J30sXG4gICAgICAgIHtmOiAnJiMzODA7JywgcjogJ8W8J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmIzI1ODsnLCByOiAnxIInfSxcbiAgICAgICAge2Y6ICcmIzI1OTsnLCByOiAnxIMnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJiMzNTQ7JywgcjogJ8WiJ30sXG4gICAgICAgIHtmOiAnJiMzNTU7JywgcjogJ8WjJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzMwOycsIHI6ICfFiid9LFxuICAgICAgICB7ZjogJyYjMzMxOycsIHI6ICfFiyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU4OycsIHI6ICfFpid9LFxuICAgICAgICB7ZjogJyYjMzU5OycsIHI6ICfFpyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMzEzOycsIHI6ICfEuSd9LFxuICAgICAgICB7ZjogJyYjMzE0OycsIHI6ICfEuid9LFxuICAgICAgICB7ZjogJyYjMzE3OycsIHI6ICfEvSd9LFxuICAgICAgICB7ZjogJyYjMzE4OycsIHI6ICfEvid9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyYjMzQwOycsIHI6ICfFlCd9LFxuICAgICAgICB7ZjogJyYjMzQxOycsIHI6ICfFlSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJiMyODY7JywgcjogJ8SeJ30sXG4gICAgICAgIHtmOiAnJiMyODc7JywgcjogJ8SfJ30sXG4gICAgICAgIHtmOiAnJiMzMDQ7JywgcjogJ8SwJ30sXG4gICAgICAgIHtmOiAnJiMzMDU7JywgcjogJ8SxJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmV1cm87JywgcjogJ+KCrCd9LFxuICAgICAgICB7ZjogJyZwb3VuZDsnLCByOiAnwqMnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZidWxsOycsIHI6ICfigKInfSxcbiAgICAgICAge2Y6ICcmZGFnZ2VyOycsIHI6ICfigKAnfSxcbiAgICAgICAge2Y6ICcmY29weTsnLCByOiAnwqknfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZ0cmFkZTsnLCByOiAn4oSiJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmcGVybWlsOycsIHI6ICfigLAnfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmbmRhc2g7JywgcjogJ+KAkyd9LFxuICAgICAgICB7ZjogJyZtZGFzaDsnLCByOiAn4oCUJ30sXG4gICAgICAgIHtmOiAnJiM4NDcwOycsIHI6ICfihJYnfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZwYXJhOycsIHI6ICfCtid9LFxuICAgICAgICB7ZjogJyZwbHVzbW47JywgcjogJ8KxJ30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICdsZXNzLXQnLCByOiAnPCd9LFxuICAgICAgICB7ZjogJ2dyZWF0ZXItdCcsIHI6ICc+J30sXG4gICAgICAgIHtmOiAnJm5vdDsnLCByOiAnwqwnfSxcbiAgICAgICAge2Y6ICcmY3VycmVuOycsIHI6ICfCpCd9LFxuICAgICAgICB7ZjogJyZicnZiYXI7JywgcjogJ8KmJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmYWN1dGU7JywgcjogJ8K0J30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnwqgnfSxcbiAgICAgICAge2Y6ICcmbWFjcjsnLCByOiAnwq8nfSxcbiAgICAgICAge2Y6ICcmY2VkaWw7JywgcjogJ8K4J30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmc3VwMTsnLCByOiAnwrknfSxcbiAgICAgICAge2Y6ICcmc3VwMjsnLCByOiAnwrInfSxcbiAgICAgICAge2Y6ICcmc3VwMzsnLCByOiAnwrMnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnaHk7XHQnLCByOiAnJid9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmYW1wOycsIHI6ICdhbmQnfSxcbiAgICAgICAge2Y6ICcmbGRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyc3F1bzsnLCByOiBcIidcIn1cbiAgICAgIF07XG5cbiAgICAgIF8uZWFjaChodG1sY2hhcnMsIGZ1bmN0aW9uKGNoYXIpIHtcbiAgICAgICAgaWYoY29udGVudC5pbmRleE9mKGNoYXIuZikgIT09IC0xKXtcbiAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKFJlZ0V4cChjaGFyLmYsJ2cnKSwgY2hhci5yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9zZXJ2aWNlcy5qcyJdLCJzb3VyY2VSb290IjoiIn0=