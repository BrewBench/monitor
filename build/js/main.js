webpackJsonp([1],{

/***/ 317:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(128);
__webpack_require__(339);
__webpack_require__(541);
__webpack_require__(543);
__webpack_require__(544);
__webpack_require__(545);
module.exports = __webpack_require__(546);


/***/ }),

/***/ 541:
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

/***/ 543:
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
  // general check and update
  if (!$scope.settings.general) return $scope.clearSettings();
  $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart, session: $scope.settings.streams.session });
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
    brewbenchHosted: function brewbenchHosted() {
      return BrewService.influxdb().hosted($scope.settings.influxdb.url);
    },
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
          if ($scope.influxdb.brewbenchHosted()) {
            $scope.settings.influxdb.db = $scope.settings.influxdb.user;
          } else {
            //get list of databases
            BrewService.influxdb().dbs().then(function (response) {
              if (response.length) {
                var dbs = [].concat.apply([], response);
                $scope.settings.influxdb.dbs = _.remove(dbs, function (db) {
                  return db != "_internal";
                });
              }
            });
          }
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

  $scope.streams = {
    connected: function connected() {
      return !!$scope.settings.streams.username && !!$scope.settings.streams.api_key && $scope.settings.streams.status == 'Connected';
    },
    remove: function remove() {
      var defaultSettings = BrewService.reset();
      $scope.settings.streams = defaultSettings.streams;
      _.each($scope.kettles, function (kettle) {
        kettle.notify.streams = false;
      });
    },
    connect: function connect() {
      if (!$scope.settings.streams.username || !$scope.settings.streams.api_key) return;
      $scope.settings.streams.status = 'Connecting';
      return BrewService.streams().auth(true).then(function (response) {
        $scope.settings.streams.status = 'Connected';
      }).catch(function (err) {
        $scope.settings.streams.status = 'Failed to Connect';
      });
    },
    kettles: function kettles(kettle, relay) {
      if (relay) {
        kettle[relay].sketch = !kettle[relay].sketch;
        if (!kettle.notify.streams) return;
      }
      kettle.message.location = 'sketches';
      kettle.message.type = 'info';
      kettle.message.status = 0;
      return BrewService.streams().kettles.save(kettle).then(function (response) {
        var kettleResponse = response.kettle;
        // update kettle vars
        kettle.id = kettleResponse.id;
        // update arduino id
        _.each($scope.settings.arduinos, function (arduino) {
          if (arduino.id == kettle.arduino.id) arduino.id = kettleResponse.deviceId;
        });
        kettle.arduino.id = kettleResponse.deviceId;
        // update session vars
        _.merge($scope.settings.streams.session, kettleResponse.session);

        kettle.message.type = 'success';
        kettle.message.status = 2;
      }).catch(function (err) {
        kettle.notify.streams = !kettle.notify.streams;
        kettle.message.status = 1;
        if (err && err.data && err.data.error && err.data.error.message) {
          $scope.setErrorMessage(err.data.error.message, kettle);
          console.error('BrewBench Streams Error', err);
        }
      });
    },
    sessions: {
      save: function save() {
        return BrewService.streams().sessions.save($scope.settings.streams.session).then(function (response) {});
      }
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
      //stop the heating element
      if (kettle.heater.auto && kettle.heater.running) {
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
        if (kettle.heater.auto && !kettle.heater.running) {
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
        if (kettle.heater.auto && kettle.heater.running) {
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
      if (item == 'heat' && $scope.settings.general.heatSafty && heatIsOn) {
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
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.streams || kettle.notify.slack || kettle.notify.dweet) {
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
      if (sketch.indexOf('Streams') !== -1) {
        // streams connection
        var connection_string = 'https://' + $scope.settings.streams.username + '.hosted.brewbench.co';
        response.data = response.data.replace(/\[STREAMS_CONNECTION\]/g, connection_string);
        response.data = response.data.replace(/\[STREAMS_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.streams.username.trim() + ':' + $scope.settings.streams.api_key.trim()));
      } else if (sketch.indexOf('BFYun') !== -1) {
        // bf api key header
        response.data = response.data.replace(/\[BF_AUTH\]/g, 'X-API-KEY: ' + $scope.settings.bf.api_key.trim());
      } else if (sketch.indexOf('InfluxDB') !== -1) {
        // influx db connection
        var connection_string = '' + $scope.settings.influxdb.url;
        if ($scope.influxdb.brewbenchHosted()) {
          connection_string += '/bbp';
          if (sketch.indexOf('ESP') !== -1) {
            // does not support https
            if (connection_string.indexOf('https:') === 0) connection_string = connection_string.replace('https:', 'http:');
            response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, btoa($scope.settings.influxdb.user.trim() + ':' + $scope.settings.influxdb.pass.trim()));
            response.data = response.data.replace(/\[API_KEY\]/g, $scope.settings.influxdb.pass);
          } else {
            response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.influxdb.user.trim() + ':' + $scope.settings.influxdb.pass.trim()));
            var additional_post_params = '  p.addParameter(F("-H"));\n';
            additional_post_params += '  p.addParameter(F("X-API-KEY: ' + $scope.settings.influxdb.pass + '"));';
            response.data = response.data.replace('// additional_post_params', additional_post_params);
          }
        } else {
          if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
          connection_string += '/write?';
          // add user/pass
          if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
          // add db
          connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));
          response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, '');
        }
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
      $scope.chartOptions = BrewService.chartOptions({ unit: $scope.settings.general.unit, chart: $scope.settings.chart, session: $scope.settings.streams.session });
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

  $scope.updateStreams = function (kettle) {
    //update streams
    if ($scope.streams.connected() && kettle.notify.streams) {
      $scope.streams.kettles(kettle);
    }
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

/***/ 544:
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

/***/ 545:
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

/***/ 546:
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
        general: { debug: false, pollSeconds: 10, unit: 'F', shared: false, heatSafty: false },
        chart: { show: true, military: false, area: false },
        sensors: { DHT: false, DS18B20: false, BMP: false },
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        arduinos: [{ id: 'local-' + btoa('brewbench'), board: '', RSSI: false, url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '', message: '' } }],
        tplink: { user: '', pass: '', token: '', status: '', plugs: [] },
        influxdb: { url: '', port: '', user: '', pass: '', db: '', dbs: [], status: '' },
        streams: { username: '', api_key: '', status: '', session: { id: '', name: '', type: 'fermentation' } }
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
        notify: { slack: false, dweet: false, streams: false }
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
        notify: { slack: false, dweet: false, streams: false }
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
        notify: { slack: false, dweet: false, streams: false }
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
      delete settings.streams;
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

    streams: function streams() {
      var _this2 = this;

      var settings = this.settings('settings');
      var request = { url: 'http://localhost:3001/api', headers: {}, timeout: settings.general.pollSeconds * 10000 };

      return {
        auth: async function auth(ping) {
          var q = $q.defer();
          if (settings.streams.api_key && settings.streams.username) {
            request.url += ping ? '/users/ping' : '/users/auth';
            request.method = 'POST';
            request.headers['Content-Type'] = 'application/json';
            request.headers['X-API-Key'] = '' + settings.streams.api_key;
            request.headers['X-BB-User'] = '' + settings.streams.username;
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
              var auth = await _this2.streams().auth();
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
              var auth = await _this2.streams().auth();
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
              session: settings.streams.session,
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
              var auth = await _this2.streams().auth();
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
              var auth = await _this2.streams().auth();
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
      var _this3 = this;

      var q = $q.defer();
      var settings = this.settings('settings');
      var influxConnection = '' + settings.influxdb.url;
      if (!!settings.influxdb.port && !this.hosted(influxConnection)) influxConnection += ':' + settings.influxdb.port;

      return {
        hosted: function hosted(url) {
          return url.indexOf('streams.brewbench.co') !== -1 || url.indexOf('hosted.brewbench.co') !== -1;
        },
        ping: function ping(influxdb) {
          if (influxdb && influxdb.url) {
            influxConnection = '' + influxdb.url;
            if (!!influxdb.port && !_this3.influxdb().hosted(influxConnection)) influxConnection += ':' + influxdb.port;
          }
          var request = { url: '' + influxConnection, method: 'GET' };
          if (_this3.influxdb().hosted(influxConnection)) {
            request.url = influxConnection + '/ping';
            if (influxdb && influxdb.user && influxdb.pass) {
              request.headers = { 'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(influxdb.user.trim() + ':' + influxdb.pass.trim()) };
            } else {
              request.headers = { 'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(settings.influxdb.user.trim() + ':' + settings.influxdb.pass.trim()) };
            }
          }
          $http(request).then(function (response) {
            console.log(response);
            q.resolve(response);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        dbs: function dbs() {
          if (_this3.influxdb().hosted(influxConnection)) {
            q.resolve([settings.influxdb.user]);
          } else {
            $http({ url: influxConnection + '/query?u=' + settings.influxdb.user.trim() + '&p=' + settings.influxdb.pass.trim() + '&q=' + encodeURIComponent('show databases'), method: 'GET' }).then(function (response) {
              if (response.data && response.data.results && response.data.results.length && response.data.results[0].series && response.data.results[0].series.length && response.data.results[0].series[0].values) {
                q.resolve(response.data.results[0].series[0].values);
              } else {
                q.resolve([]);
              }
            }).catch(function (err) {
              q.reject(err);
            });
          }
          return q.promise;
        },
        createDB: function createDB(name) {
          if (_this3.influxdb().hosted(influxConnection)) {
            q.reject('Database already exists');
          } else {
            $http({ url: influxConnection + '/query?u=' + settings.influxdb.user.trim() + '&p=' + settings.influxdb.pass.trim() + '&q=' + encodeURIComponent('CREATE DATABASE "' + name + '"'), method: 'POST' }).then(function (response) {
              q.resolve(response);
            }).catch(function (err) {
              q.reject(err);
            });
          }
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

},[317]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXJkdWlub19wYXNzIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0Iiwic2Vzc2lvbiIsInN0cmVhbXMiLCJkZWZhdWx0S2V0dGxlcyIsInNoYXJlIiwicGFyYW1zIiwiZmlsZSIsInBhc3N3b3JkIiwibmVlZFBhc3N3b3JkIiwiYWNjZXNzIiwiZGVsZXRlQWZ0ZXIiLCJvcGVuU2tldGNoZXMiLCIkIiwibW9kYWwiLCJzdW1WYWx1ZXMiLCJvYmoiLCJzdW1CeSIsInVwZGF0ZUFCViIsInJlY2lwZSIsInNjYWxlIiwibWV0aG9kIiwiYWJ2Iiwib2ciLCJmZyIsImFidmEiLCJhYnciLCJhdHRlbnVhdGlvbiIsInBsYXRvIiwiY2Fsb3JpZXMiLCJyZSIsInNnIiwiY2hhbmdlTWV0aG9kIiwiY2hhbmdlU2NhbGUiLCJnZXRTdGF0dXNDbGFzcyIsInN0YXR1cyIsImVuZHNXaXRoIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsIlJTU0kiLCJhbmFsb2ciLCJkaWdpdGFsIiwiYWRjIiwic2VjdXJlIiwidmVyc2lvbiIsImR0IiwiZWFjaCIsImFyZHVpbm8iLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJjb25uZWN0IiwidGhlbiIsImluZm8iLCJCcmV3QmVuY2giLCJldmVudCIsInNyY0VsZW1lbnQiLCJpbm5lckhUTUwiLCJ0b3VjaCIsImNhdGNoIiwiZXJyIiwicmVib290IiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInJlc3BvbnNlIiwidG9rZW4iLCJzY2FuIiwic2V0RXJyb3JNZXNzYWdlIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInJlc3BvbnNlRGF0YSIsIkpTT04iLCJwYXJzZSIsInN5c3RlbSIsImdldF9zeXNpbmZvIiwiZW1ldGVyIiwiZ2V0X3JlYWx0aW1lIiwiZXJyX2NvZGUiLCJwb3dlciIsImRldmljZSIsInRvZ2dsZSIsIm9mZk9yT24iLCJyZWxheV9zdGF0ZSIsImFkZEtldHRsZSIsImZpbmQiLCJzdGlja3kiLCJwaW4iLCJhdXRvIiwiZHV0eUN5Y2xlIiwic2tldGNoIiwidGVtcCIsInZjYyIsImhpdCIsIm1lYXN1cmVkIiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwicmF3Iiwidm9sdHMiLCJ2YWx1ZXMiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJoZWF0SXNPbiIsIkJvb2xlYW4iLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsImlzRVNQIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjaGFuZ2VTZW5zb3IiLCJzZW5zb3JUeXBlcyIsInBlcmNlbnQiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJicmV3YmVuY2hIb3N0ZWQiLCJob3N0ZWQiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYiIsImRicyIsImNvbmNhdCIsImFwcGx5IiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJ1c2VybmFtZSIsImFwaV9rZXkiLCJhdXRoIiwicmVsYXkiLCJzYXZlIiwia2V0dGxlUmVzcG9uc2UiLCJtZXJnZSIsImNvbnNvbGUiLCJzZXNzaW9ucyIsInNoYXJlQWNjZXNzIiwic2hhcmVkIiwiZnJhbWVFbGVtZW50IiwibG9hZFNoYXJlRmlsZSIsImNvbnRlbnRzIiwibm90aWZpY2F0aW9ucyIsIm9uIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJsYWJlbCIsImFtb3VudCIsImFkZFRpbWVyIiwibm90ZXMiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0b29sdGlwIiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJzaG93IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsInVwZGF0ZUFyZHVpbm9TdGF0dXMiLCJkb21haW4iLCJza2V0Y2hfdmVyc2lvbiIsInVwZGF0ZVRlbXAiLCJrZXkiLCJ0ZW1wcyIsInNoaWZ0IiwiYWx0aXR1ZGUiLCJwcmVzc3VyZSIsImN1cnJlbnRWYWx1ZSIsInVuaXRUeXBlIiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoZWF0U2FmdHkiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJiZiIsIkRIVCIsIkRTMThCMjAiLCJCTVAiLCJrZXR0bGVUeXBlIiwidW5zaGlmdCIsImEiLCJ0b0xvd2VyQ2FzZSIsImRvd25sb2FkU2tldGNoIiwiaGFzVHJpZ2dlcnMiLCJ0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmciLCJjb25uZWN0aW9uIiwiYXV0b2dlbiIsImdldCIsImpvaW4iLCJtZDUiLCJjb25uZWN0aW9uX3N0cmluZyIsInRyaW0iLCJhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zIiwicG9ydCIsIlRIQyIsInN0cmVhbVNrZXRjaCIsImNyZWF0ZUVsZW1lbnQiLCJzZXRBdHRyaWJ1dGUiLCJzdHlsZSIsImRpc3BsYXkiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJjbGljayIsInJlbW92ZUNoaWxkIiwiZ2V0SVBBZGRyZXNzIiwiaXBBZGRyZXNzIiwiaXAiLCJpY29uIiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJ1cGRhdGVTdHJlYW1zIiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImFjY2Vzc1Rva2VuIiwic2V0SXRlbSIsImdldEl0ZW0iLCJkZWJ1ZyIsIm1pbGl0YXJ5IiwiYXJlYSIsInJlYWRPbmx5IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0Iiwid2l0aENyZWRlbnRpYWxzIiwic2Vuc29yIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJ1cGRhdGVkS2V0dGxlIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJ0aXRsZSIsImVuYWJsZSIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7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RUF1UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UWMsRUF3UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UWMsRUF5UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UWMsRUEwUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUWMsRUEyUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUWMsRUE0UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1UWMsRUE2UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3UWMsRUE4UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5UWMsRUErUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvUWMsRUFnUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoUmMsRUFpUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqUmMsRUFrUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsUmMsRUFtUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuUmMsRUFvUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwUmMsRUFxUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyUmMsRUFzUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0UmMsRUF1UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UmMsRUF3UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UmMsRUF5UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UmMsRUEwUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUmMs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Q0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcmZjLEVBc2ZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRmYyxFQXVmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZmYyxFQXdmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxLQUFoQixFQXhmYyxFQXlmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXpmYyxFQTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkF2akIsUUFBRW1FLElBQUYsQ0FBT2tmLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVF4akIsT0FBUixDQUFnQjRqQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUXpqQixPQUFSLENBQWdCbVosT0FBTzBLLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBOXFESSxHQUFQO0FBZ3JERCxDQW5yREQsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICB3aW5kb3cubG9jYXRpb24uaHJlZj0nLyc7XG59O1xuXG5pZiggJHN0YXRlLmN1cnJlbnQubmFtZSA9PSAncmVzZXQnKVxuICAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuXG52YXIgbm90aWZpY2F0aW9uID0gbnVsbDtcbnZhciByZXNldENoYXJ0ID0gMTAwO1xudmFyIHRpbWVvdXQgPSBudWxsOyAvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuQnJld1NlcnZpY2UgPSBCcmV3U2VydmljZTtcbiRzY29wZS5zaXRlID0ge2h0dHBzOiAhIShkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbD09J2h0dHBzOicpXG4gICwgaHR0cHNfdXJsOiBgaHR0cHM6Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9YFxufTtcbiRzY29wZS5lc3AgPSB7XG4gIHR5cGU6ICcnLFxuICBzc2lkOiAnJyxcbiAgc3NpZF9wYXNzOiAnJyxcbiAgaG9zdG5hbWU6ICdiYmVzcCcsXG4gIGFyZHVpbm9fcGFzczogJ2JiYWRtaW4nLFxuICBhdXRvY29ubmVjdDogZmFsc2Vcbn07XG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUucGtnO1xuJHNjb3BlLmtldHRsZVR5cGVzID0gQnJld1NlcnZpY2Uua2V0dGxlVHlwZXMoKTtcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogMSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYoISFsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4vLyBnZW5lcmFsIGNoZWNrIGFuZCB1cGRhdGVcbmlmKCEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbClcbiAgcmV0dXJuICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0LCBzZXNzaW9uOiAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9ufSk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiRzY29wZS5zaGFyZSA9ICghJHN0YXRlLnBhcmFtcy5maWxlICYmIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpKSA/IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpIDoge1xuICAgICAgZmlsZTogJHN0YXRlLnBhcmFtcy5maWxlIHx8IG51bGxcbiAgICAgICwgcGFzc3dvcmQ6IG51bGxcbiAgICAgICwgbmVlZFBhc3N3b3JkOiBmYWxzZVxuICAgICAgLCBhY2Nlc3M6ICdyZWFkT25seSdcbiAgICAgICwgZGVsZXRlQWZ0ZXI6IDE0XG4gIH07XG5cbiRzY29wZS5vcGVuU2tldGNoZXMgPSBmdW5jdGlvbigpe1xuICAkKCcjc2V0dGluZ3NNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICQoJyNza2V0Y2hlc01vZGFsJykubW9kYWwoJ3Nob3cnKTtcbn07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW1CeShvYmosJ2Ftb3VudCcpO1xufTtcblxuLy8gaW5pdCBjYWxjIHZhbHVlc1xuJHNjb3BlLnVwZGF0ZUFCViA9IGZ1bmN0aW9uKCl7XG4gIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbihCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpXG4gICAgICAsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidihCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidixCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKVxuICAgICAgLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgfVxufTtcblxuJHNjb3BlLmNoYW5nZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kID0gbWV0aG9kO1xuICAkc2NvcGUudXBkYXRlQUJWKCk7XG59O1xuXG4kc2NvcGUuY2hhbmdlU2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGUgPSBzY2FsZTtcbiAgaWYoc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9XG59O1xuXG4kc2NvcGUuZ2V0U3RhdHVzQ2xhc3MgPSBmdW5jdGlvbihzdGF0dXMpe1xuICBpZihzdGF0dXMgPT0gJ0Nvbm5lY3RlZCcpXG4gICAgcmV0dXJuICdzdWNjZXNzJztcbiAgZWxzZSBpZihfLmVuZHNXaXRoKHN0YXR1cywnaW5nJykpXG4gICAgcmV0dXJuICdzZWNvbmRhcnknO1xuICBlbHNlXG4gICAgcmV0dXJuICdkYW5nZXInO1xufVxuXG4kc2NvcGUudXBkYXRlQUJWKCk7XG5cbiAgJHNjb3BlLmdldFBvcnRSYW5nZSA9IGZ1bmN0aW9uKG51bWJlcil7XG4gICAgICBudW1iZXIrKztcbiAgICAgIHJldHVybiBBcnJheShudW1iZXIpLmZpbGwoKS5tYXAoKF8sIGlkeCkgPT4gMCArIGlkeCk7XG4gIH07XG5cbiAgJHNjb3BlLmFyZHVpbm9zID0ge1xuICAgIGFkZDogKCkgPT4ge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zKSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICBib2FyZDogJycsXG4gICAgICAgIFJTU0k6IGZhbHNlLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBhZGM6IDAsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICcnLFxuICAgICAgICBzdGF0dXM6IHtlcnJvcjogJycsZHQ6ICcnLG1lc3NhZ2U6Jyd9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSBhcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IChpbmRleCwgYXJkdWlubykgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAgZGVsZXRlIGtldHRsZS5hcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoYXJkdWlubykgPT4ge1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ0Nvbm5lY3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAnaW5mbycpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5CcmV3QmVuY2gpe1xuICAgICAgICAgICAgZXZlbnQuc3JjRWxlbWVudC5pbm5lckhUTUwgPSAnQ29ubmVjdCc7XG4gICAgICAgICAgICBhcmR1aW5vLmJvYXJkID0gaW5mby5CcmV3QmVuY2guYm9hcmQ7XG4gICAgICAgICAgICBpZihpbmZvLkJyZXdCZW5jaC5SU1NJKVxuICAgICAgICAgICAgICBhcmR1aW5vLlJTU0kgPSBpbmZvLkJyZXdCZW5jaC5SU1NJO1xuICAgICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gaW5mby5CcmV3QmVuY2gudmVyc2lvbjtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpZihhcmR1aW5vLmJvYXJkLmluZGV4T2YoJ0VTUDMyJykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMzk7XG4gICAgICAgICAgICAgIGFyZHVpbm8uZGlnaXRhbCA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLnRvdWNoID0gWzQsMCwyLDE1LDEzLDEyLDE0LDI3LDMzLDMyXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihhcmR1aW5vLmJvYXJkLmluZGV4T2YoJ0VTUDgyNjYnKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAxNjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHJlYm9vdDogKGFyZHVpbm8pID0+IHtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3RpbmcuLi4nO1xuICAgICAgQnJld1NlcnZpY2UuY29ubmVjdChhcmR1aW5vLCAncmVib290JylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgYXJkdWluby52ZXJzaW9uID0gJyc7XG4gICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdSZWJvb3QgU3VjY2VzcywgdHJ5IGNvbm5lY3RpbmcgaW4gYSBmZXcgc2Vjb25kcy4nO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYocGtnLnZlcnNpb24gPCA0LjIpXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ1VwZ3JhZGUgdG8gc3VwcG9ydCByZWJvb3QnO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKCEhcGx1Zy5zdGF0dXMpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgdmFyIG9mZk9yT24gPSBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxID8gMCA6IDE7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS50b2dnbGUoZGV2aWNlLCBvZmZPck9uKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSBvZmZPck9uO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS50aGVuKHRvZ2dsZVJlc3BvbnNlID0+IHtcbiAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5mb1xuICAgICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICBkZXZpY2UuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgdmFyIGFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfTtcbiAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCxkaWZmOiRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogYXJkdWlub1xuICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcbiAgXG4gICRzY29wZS5oZWF0SXNPbiA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQm9vbGVhbihfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2hlYXRlcic6IHsncnVubmluZyc6IHRydWV9fSkubGVuZ3RoKTtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKGFyZHVpbm8sIHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8pKXtcbiAgICAgICAgaWYoQnJld1NlcnZpY2UuaXNFU1AoYXJkdWlubywgdHJ1ZSkgPT0gJzgyNjYnKVxuICAgICAgICAgIHJldHVybiBwaW4ucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBwaW4ucmVwbGFjZSgnQScsJ0dQSU8nKS5yZXBsYWNlKCdEJywnR1BJTycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBpbjtcbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUucGluSW5Vc2UgPSBmdW5jdGlvbihwaW4sYXJkdWlub0lkKXtcbiAgICB2YXIga2V0dGxlID0gXy5maW5kKCRzY29wZS5rZXR0bGVzLCBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgKGtldHRsZS5hcmR1aW5vLmlkPT1hcmR1aW5vSWQpICYmXG4gICAgICAgIChcbiAgICAgICAgICAoa2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS50ZW1wLnZjYz09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUuaGVhdGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKCFrZXR0bGUuY29vbGVyICYmIGtldHRsZS5wdW1wLnBpbj09cGluKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiBrZXR0bGUgfHwgZmFsc2U7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVNlbnNvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50KXtcbiAgICAgIGtldHRsZS5rbm9iLnVuaXQgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLnVuaXQgPSAnXFx1MDBCMCc7XG4gICAgfVxuICAgIGtldHRsZS50ZW1wLnZjYyA9ICcnO1xuICAgIGtldHRsZS50ZW1wLmluZGV4ID0gJyc7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZVNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIuZW1haWwpXG4gICAgICByZXR1cm47XG4gICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICdDcmVhdGluZyBzaGFyZSBsaW5rLi4uJztcbiAgICByZXR1cm4gQnJld1NlcnZpY2UuY3JlYXRlU2hhcmUoJHNjb3BlLnNoYXJlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYocmVzcG9uc2Uuc2hhcmUgJiYgcmVzcG9uc2Uuc2hhcmUudXJsKXtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJyc7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9saW5rID0gcmVzcG9uc2Uuc2hhcmUudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gZXJyO1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVUZXN0ID0gZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgYXJkdWluby50ZXN0aW5nID0gdHJ1ZTtcbiAgICBCcmV3U2VydmljZS5zaGFyZVRlc3QoYXJkdWlubylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLmh0dHBfY29kZSA9PSAyMDApXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSB0cnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgYnJld2JlbmNoSG9zdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5ob3N0ZWQoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybCk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiID0gZGVmYXVsdFNldHRpbmdzLmluZmx1eGRiO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0IHx8IHJlc3BvbnNlLnN0YXR1cyA9PSAyMDApe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5pbmZsdXhkYi5icmV3YmVuY2hIb3N0ZWQoKSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3RyZWFtcyA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSAmJlxuICAgICAgICAhISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID09ICdDb25uZWN0ZWQnXG4gICAgICApO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zID0gZGVmYXVsdFNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkuYXV0aCh0cnVlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAga2V0dGxlczogKGtldHRsZSwgcmVsYXkpID0+IHtcbiAgICAgIGlmKHJlbGF5KXtcbiAgICAgICAga2V0dGxlW3JlbGF5XS5za2V0Y2ggPSAha2V0dGxlW3JlbGF5XS5za2V0Y2g7XG4gICAgICAgIGlmKCFrZXR0bGUubm90aWZ5LnN0cmVhbXMpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSAnc2tldGNoZXMnO1xuICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdpbmZvJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDA7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmtldHRsZXMuc2F2ZShrZXR0bGUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICB2YXIga2V0dGxlUmVzcG9uc2UgPSByZXNwb25zZS5rZXR0bGU7XG4gICAgICAgICAgLy8gdXBkYXRlIGtldHRsZSB2YXJzXG4gICAgICAgICAga2V0dGxlLmlkID0ga2V0dGxlUmVzcG9uc2UuaWQ7XG4gICAgICAgICAgLy8gdXBkYXRlIGFyZHVpbm8gaWRcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCBhcmR1aW5vID0+IHtcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uaWQgPT0ga2V0dGxlLmFyZHVpbm8uaWQpXG4gICAgICAgICAgICAgIGFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5pZCA9IGtldHRsZVJlc3BvbnNlLmRldmljZUlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBzZXNzaW9uIHZhcnNcbiAgICAgICAgICBfLm1lcmdlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sIGtldHRsZVJlc3BvbnNlLnNlc3Npb24pO1xuXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdzdWNjZXNzJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAyO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSAha2V0dGxlLm5vdGlmeS5zdHJlYW1zO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDE7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5kYXRhICYmIGVyci5kYXRhLmVycm9yICYmIGVyci5kYXRhLmVycm9yLm1lc3NhZ2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIuZGF0YS5lcnJvci5tZXNzYWdlLCBrZXR0bGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQnJld0JlbmNoIFN0cmVhbXMgRXJyb3InLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXNzaW9uczoge1xuICAgICAgc2F2ZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLnNlc3Npb25zLnNhdmUoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbilcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAgIGlmKGFjY2Vzcyl7XG4gICAgICAgICAgaWYoYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gISEoJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFNoYXJlRmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCA9IHRydWU7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmxvYWRTaGFyZUZpbGUoJHNjb3BlLnNoYXJlLmZpbGUsICRzY29wZS5zaGFyZS5wYXNzd29yZCB8fCBudWxsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY29udGVudHMpIHtcbiAgICAgICAgaWYoY29udGVudHMpe1xuICAgICAgICAgIGlmKGNvbnRlbnRzLm5lZWRQYXNzd29yZCl7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUgPSBjb250ZW50cy5zZXR0aW5ncy5yZWNpcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNoYXJlICYmIGNvbnRlbnRzLnNoYXJlLmFjY2Vzcyl7XG4gICAgICAgICAgICAgICRzY29wZS5zaGFyZS5hY2Nlc3MgPSBjb250ZW50cy5zaGFyZS5hY2Nlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncyl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncyA9IGNvbnRlbnRzLnNldHRpbmdzO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucyA9IHtvbjpmYWxzZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5rZXR0bGVzKXtcbiAgICAgICAgICAgICAgXy5lYWNoKGNvbnRlbnRzLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgICAgICAgICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIwMCs1LHN1YlRleHQ6e2VuYWJsZWQ6IHRydWUsdGV4dDogJ3N0YXJ0aW5nLi4uJyxjb2xvcjogJ2dyYXknLGZvbnQ6ICdhdXRvJ319KTtcbiAgICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzID0gW107XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlcyA9IGNvbnRlbnRzLmtldHRsZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGxvYWRpbmcgdGhlIHNoYXJlZCBzZXNzaW9uLlwiKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZighIWZvcm1hdHRlZF9jb250ZW50KXtcbiAgICAgICAgdmFyIHgyanMgPSBuZXcgWDJKUygpO1xuICAgICAgICBqc29uT2JqID0geDJqcy54bWxfc3RyMmpzb24oIGZvcm1hdHRlZF9jb250ZW50ICk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFqc29uT2JqKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCRleHQ9PSdic214Jyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SZWNpcGVzICYmICEhanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZighIWpzb25PYmouU2VsZWN0aW9ucyAmJiAhIWpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SRUNJUEVTICYmICEhanNvbk9iai5SRUNJUEVTLlJFQ0lQRSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJFQ0lQRVMuUkVDSVBFO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclhNTChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZighcmVjaXBlKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCEhcmVjaXBlLm9nKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoISFyZWNpcGUuZmcpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoe1xuICAgICAgYW5pbWF0ZWQ6ICdmYWRlJyxcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIGh0bWw6IHRydWVcbiAgICB9KTtcbiAgICBpZigkKCcjZ2l0Y29tbWl0IGEnKS50ZXh0KCkgIT0gJ2dpdF9jb21taXQnKXtcbiAgICAgICQoJyNnaXRjb21taXQnKS5zaG93KCk7XG4gICAgfVxuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ3dhcm5pbmcnO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdUaGUgbW9uaXRvciBzZWVtcyB0byBiZSBvZmYtbGluZSwgcmUtY29ubmVjdGluZy4uLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZighIWVyci5zdGF0dXNUZXh0KVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgaWYobG9jYXRpb24pXG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwgbWVzc2FnZSk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWApO1xuICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoISFrZXR0bGUudGVtcC5jdXJyZW50KVxuICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIC8vIHRlbXAgcmVzcG9uc2UgaXMgaW4gQ1xuICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnRlbXAsMik7XG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICAvLyBzZXQgcmF3XG4gICAga2V0dGxlLnRlbXAucmF3ID0gcmVzcG9uc2UucmF3O1xuICAgIGtldHRsZS50ZW1wLnZvbHRzID0gcmVzcG9uc2Uudm9sdHM7XG5cbiAgICAvLyB2b2x0IGNoZWNrXG4gICAgaWYoa2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMTgwJyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnZvbHRzICYmXG4gICAgICAha2V0dGxlLnRlbXAucmF3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdEUzE4QjIwJyAmJlxuICAgICAgcmVzcG9uc2UudGVtcCA9PSAtMTI3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcy5zaGlmdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQgc2Vuc29ycyBoYXZlIGh1bWlkaXR5IGFzIGEgcGVyY2VudFxuICAgIC8vU29pbE1vaXN0dXJlRCBoYXMgbW9pc3R1cmUgYXMgYSBwZXJjZW50XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5wZXJjZW50ID0gcmVzcG9uc2UucGVyY2VudDtcbiAgICB9XG4gICAgLy8gQk1QIHNlbnNvcnMgaGF2ZSBhbHRpdHVkZSBhbmQgcHJlc3N1cmVcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLmFsdGl0dWRlICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5hbHRpdHVkZSA9IHJlc3BvbnNlLmFsdGl0dWRlO1xuICAgIH1cbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnByZXNzdXJlICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIC8vIHBhc2NhbCB0byBpbmNoZXMgb2YgbWVyY3VyeVxuICAgICAga2V0dGxlLnByZXNzdXJlID0gcmVzcG9uc2UucHJlc3N1cmUgLyAzMzg2LjM4OTtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZSwgc2tldGNoX3ZlcnNpb246cmVzcG9uc2Uuc2tldGNoX3ZlcnNpb259KTtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gtYWx0JykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICB2YXIgaztcbiAgICB2YXIgaGVhdElzT24gPSAkc2NvcGUuaGVhdElzT24oKTtcbiAgICBcbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICBpZiAoaXRlbSA9PSAnaGVhdCcgJiYgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuaGVhdFNhZnR5ICYmIGhlYXRJc09uKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ0EgaGVhdGVyIGlzIGFscmVhZHkgcnVubmluZy4nLCBrZXR0bGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgay5ydW5uaW5nID0gIWsucnVubmluZztcbiAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFjayB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5zZW5zb3JzKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMgPSB7fTtcbiAgICAvLyBhcHBlbmQgZXNwIHR5cGVcbiAgICBpZihza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSlcbiAgICAgIHNrZXRjaE5hbWUgKz0gJHNjb3BlLmVzcC50eXBlO1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWlubyA/IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSA6ICdEZWZhdWx0JztcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOiBhcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICB0eXBlOiBza2V0Y2hOYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZSxcbiAgICAgICAgICBiZjogKHNrZXRjaE5hbWUuaW5kZXhPZignQkYnKSAhPT0gLTEpID8gdHJ1ZSA6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISFrZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiYgJHNjb3BlLmVzcC5hdXRvY29ubmVjdCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QXV0b0Nvbm5lY3QuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKChza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSB8fCBCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykpICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYmVlZ2VlLXRva3lvL0RIVGVzcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKTtcbiAgICAgIH0gZWxzZSBpZighQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5EUzE4QjIwIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPE9uZVdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAxODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhlIGFjdGlvbnMgY29tbWFuZFxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYgKGtldHRsZS50ZW1wLnZjYylcbiAgICAgICAga2V0dGxlVHlwZSArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICBcbiAgICAgIGlmIChrZXR0bGUudGVtcC5pbmRleCkga2V0dGxlVHlwZSArPSAnLScgKyBrZXR0bGUudGVtcC5pbmRleDsgICAgICBcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTtcbiAgICAgIFxuICAgICAgaWYgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSAmJiBrZXR0bGUucGVyY2VudCkge1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBhY3Rpb25zUGVyY2VudENvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJy1IdW1pZGl0eVwiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGRlbGF5KDUwMCk7Jyk7ICAgICAgICBcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICB0cmlnZ2VyKEYoXCJoZWF0XCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmIChza2V0Y2gudHJpZ2dlcnMgfHwgc2tldGNoLmJmKSB7XG4gICAgICAgIGlmIChza2V0Y2gudHlwZS5pbmRleE9mKCdNNScpID09PSAtMSkge1xuICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpO1xuICAgICAgICAgIGlmIChza2V0Y2guYmYpIHtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGFtYmllbnQgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgaHVtaWRpdHkgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnY29uc3QgU3RyaW5nIGVxdWlwbWVudF9uYW1lID0gXCInKyRzY29wZS5zZXR0aW5ncy5iZi5uYW1lKydcIjsnKTsgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZCBcbiAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodW1pZGl0eScpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcsICdodW1pZGl0eSA9IGFjdGlvbnNQZXJjZW50Q29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2FtYmllbnQnKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICdhbWJpZW50ID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gQWxsIG90aGVyIGxvZ2ljXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gudHJpZ2dlcnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoJytza2V0Y2hOYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICB2YXIgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIHZhciBhdXRvZ2VuID0gJy8qXFxuU2tldGNoIEF1dG8gR2VuZXJhdGVkIGZyb20gaHR0cDovL21vbml0b3IuYnJld2JlbmNoLmNvXFxuVmVyc2lvbiAnKyRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24rJyAnK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDpNTTpTUycpKycgZm9yICcrbmFtZSsnXFxuKi9cXG4nO1xuICAgICRodHRwLmdldCgnYXNzZXRzL2FyZHVpbm8vJytza2V0Y2grJy8nK3NrZXRjaCsnLmlubycpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIC8vIHJlcGxhY2UgdmFyaWFibGVzXG4gICAgICAgIHJlc3BvbnNlLmRhdGEgPSBhdXRvZ2VuK3Jlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0FDVElPTlNdJywgYWN0aW9ucy5sZW5ndGggPyBhY3Rpb25zLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtIRUFERVJTXScsIGhlYWRlcnMubGVuZ3RoID8gaGVhZGVycy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtWRVJTSU9OXFxdL2csICRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1RQTElOS19DT05ORUNUSU9OXFxdL2csIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbU0xBQ0tfQ09OTkVDVElPTlxcXS9nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayk7XG5cbiAgICAgICAgLy8gRVNQIHZhcmlhYmxlc1xuICAgICAgICBpZihza2V0Y2guaW5kZXhPZignRVNQJykgIT09IC0xKXtcbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWQpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1NJRFxcXS9nLCAkc2NvcGUuZXNwLnNzaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWRfcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEX1BBU1NcXF0vZywgJHNjb3BlLmVzcC5zc2lkX3Bhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLmFyZHVpbm9fcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUkRVSU5PX1BBU1NcXF0vZywgbWQ1KCRzY29wZS5lc3AuYXJkdWlub19wYXNzKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJ2JiYWRtaW4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuaG9zdG5hbWUpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJHNjb3BlLmVzcC5ob3N0bmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csICdiYmVzcCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCBuYW1lLnJlcGxhY2UoJy5sb2NhbCcsJycpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ1N0cmVhbXMnICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBzdHJlYW1zIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgaHR0cHM6Ly8keyRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lfS5ob3N0ZWQuYnJld2JlbmNoLmNvYDtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NUUkVBTVNfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleS50cmltKCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKCBza2V0Y2guaW5kZXhPZignQkZZdW4nICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBiZiBhcGkga2V5IGhlYWRlclxuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0JGX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYmYuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvYmJwJztcbiAgICAgICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IGh0dHBzXG4gICAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25fc3RyaW5nLmluZGV4T2YoJ2h0dHBzOicpID09PSAwKVxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nID0gY29ubmVjdGlvbl9zdHJpbmcucmVwbGFjZSgnaHR0cHM6JywnaHR0cDonKTtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCBidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FQSV9LRVlcXF0vZywgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zID0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIi1IXCIpKTtcXG4nO1xuICAgICAgICAgICAgICBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zICs9ICcgIHAuYWRkUGFyYW1ldGVyKEYoXCJYLUFQSS1LRVk6ICcrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MrJ1wiKSk7JztcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnLy8gYWRkaXRpb25hbF9wb3N0X3BhcmFtcycsIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLlRIQykge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBUSEMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEgfHwgaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERTMThCMjAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQURDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQk1QMTgwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGFzVHJpZ2dlcnMpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyB0cmlnZ2VycyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgc2tldGNoKyctJytuYW1lKyctJyskc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKycuaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5ub3RpZnkgPSBmdW5jdGlvbihrZXR0bGUsdGltZXIpe1xuXG4gICAgLy9kb24ndCBzdGFydCBhbGVydHMgdW50aWwgd2UgaGF2ZSBoaXQgdGhlIHRlbXAudGFyZ2V0XG4gICAgaWYoIXRpbWVyICYmIGtldHRsZSAmJiAha2V0dGxlLnRlbXAuaGl0XG4gICAgICB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5vbiA9PT0gZmFsc2Upe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgdmFyIG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0gKGtldHRsZSAmJiBrZXR0bGUudGVtcCkgPyBrZXR0bGUudGVtcC5jdXJyZW50IDogMDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiAhIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZighIXRpbWVyICYmIGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgdmFyIHNuZCA9IG5ldyBBdWRpbygoISF0aW1lcikgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLm5hbWUgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJyl7XG4gICAgICBrZXR0bGUuY29vbGVyID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5wdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUucHVtcCA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUuY29vbGVyO1xuICAgIH1cbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1cGRhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUsJGluZGV4KXtcbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudXBkYXRlU3RyZWFtcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy91cGRhdGUgc3RyZWFtc1xuICAgIGlmKCRzY29wZS5zdHJlYW1zLmNvbm5lY3RlZCgpICYmIGtldHRsZS5ub3RpZnkuc3RyZWFtcyl7XG4gICAgICAkc2NvcGUuc3RyZWFtcy5rZXR0bGVzKGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uKCl7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSw1MDAwKTtcbiAgfVxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdkYm1QZXJjZW50JywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbihkYm0pe1xuICAgIHJldHVybiAyICogKGRibSArIDEwMCk7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDM1LjI3NCwgMik7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDIuMjA0NjIsIDIpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFjY2Vzc1Rva2VuOiBmdW5jdGlvbih0b2tlbil7XG4gICAgICBpZih0b2tlbilcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLHRva2VuKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYWNjZXNzVG9rZW4nKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlLCBoZWF0U2FmdHk6IGZhbHNlfVxuICAgICAgICAsY2hhcnQ6IHtzaG93OiB0cnVlLCBtaWxpdGFyeTogZmFsc2UsIGFyZWE6IGZhbHNlfVxuICAgICAgICAsc2Vuc29yczoge0RIVDogZmFsc2UsIERTMThCMjA6IGZhbHNlLCBCTVA6IGZhbHNlfVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYXJkdWlub3M6IFt7aWQ6J2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksYm9hcmQ6JycsUlNTSTpmYWxzZSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlLHZlcnNpb246Jycsc3RhdHVzOntlcnJvcjonJyxkdDonJyxtZXNzYWdlOicnfX1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBzdGF0dXM6ICcnLCBwbHVnczogW119XG4gICAgICAgICxpbmZsdXhkYjoge3VybDogJycsIHBvcnQ6ICcnLCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBzdGF0dXM6ICcnfVxuICAgICAgICAsc3RyZWFtczoge3VzZXJuYW1lOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycsIHNlc3Npb246IHtpZDogJycsIG5hbWU6ICcnLCB0eXBlOiAnZmVybWVudGF0aW9uJ319XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdNYXNoJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ0JvaWwnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTInLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMTgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1RlbXAnLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1NvaWwnLCd0eXBlJzonc2VlZGxpbmcnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonUGxhbnQnLCd0eXBlJzonY2FubmFiaXMnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vLCByZXR1cm5fdmVyc2lvbil7XG4gICAgICBpZihyZXR1cm5fdmVyc2lvbil7XG4gICAgICAgIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCczMicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzMyJztcbiAgICAgICAgZWxzZSBpZihhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignODI2NicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzgyNjYnO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICEhKGFyZHVpbm8gJiYgYXJkdWluby5ib2FyZCAmJiAoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2VzcCcpICE9PSAtMSB8fCBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbm9kZW1jdScpICE9PSAtMSkpO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykrJy9hcmR1aW5vLycrZW5kcG9pbnQ7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDApXG4gICAgICAgICAgdXJsICs9ICc/YXBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHVybCArPSAnP2RwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAudmNjICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKCEha2V0dGxlLnRlbXAuaW5kZXgpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICAgIHVybCArPSAnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyByZWFkL3dyaXRlIGhlYXRlclxuICAgIC8vIGh0dHA6Ly9hcmR1aW5vdHJvbmljcy5ibG9nc3BvdC5jb20vMjAxMy8wMS93b3JraW5nLXdpdGgtc2FpbnNtYXJ0LTV2LXJlbGF5LWJvYXJkLmh0bWxcbiAgICAvLyBodHRwOi8vbXlob3d0b3NhbmRwcm9qZWN0cy5ibG9nc3BvdC5jb20vMjAxNC8wMi9zYWluc21hcnQtMi1jaGFubmVsLTV2LXJlbGF5LWFyZHVpbm8uaHRtbFxuICAgIGRpZ2l0YWw6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/ZHBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/YXBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3I7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG9hZFNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gJyc7XG4gICAgICBpZihwYXNzd29yZClcbiAgICAgICAgcXVlcnkgPSAnP3Bhc3N3b3JkPScrbWQ1KHBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2dldC8nK2ZpbGUrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gZmluaXNoIHRoaXNcbiAgICAvLyBkZWxldGVTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAvLyAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAvLyAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2RlbGV0ZS8nK2ZpbGUsIG1ldGhvZDogJ0dFVCd9KVxuICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgLy8gICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAvLyAgICAgICBxLnJlamVjdChlcnIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIHJldHVybiBxLnByb21pc2U7XG4gICAgLy8gfSxcblxuICAgIGNyZWF0ZVNoYXJlOiBmdW5jdGlvbihzaGFyZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGtldHRsZXMgPSB0aGlzLnNldHRpbmdzKCdrZXR0bGVzJyk7XG4gICAgICB2YXIgc2ggPSBPYmplY3QuYXNzaWduKHt9LCB7cGFzc3dvcmQ6IHNoYXJlLnBhc3N3b3JkLCBhY2Nlc3M6IHNoYXJlLmFjY2Vzc30pO1xuICAgICAgLy9yZW1vdmUgc29tZSB0aGluZ3Mgd2UgZG9uJ3QgbmVlZCB0byBzaGFyZVxuICAgICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0ua25vYjtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0udmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc3RyZWFtcztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5pbmZsdXhkYjtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy50cGxpbms7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5za2V0Y2hlcztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZC50cmltKCkpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS90ZXN0Lz8nK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBpcDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2lwJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZHdlZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbGF0ZXN0OiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvbGF0ZXN0L2R3ZWV0L2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYWxsOiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvZHdlZXRzL2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MudHBsaW5rLnRva2VuKXtcbiAgICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICAgIHJldHVybiB1cmwrJy8/JytqUXVlcnkucGFyYW0ocGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9LFxuICAgICAgICBsb2dpbjogKHVzZXIscGFzcykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZighdXNlciB8fCAhcGFzcylcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCBMb2dpbicpO1xuICAgICAgICAgIGNvbnN0IGxvZ2luX3BheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOiBcImxvZ2luXCIsXG4gICAgICAgICAgICBcInVybFwiOiB1cmwsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiYXBwVHlwZVwiOiBcIkthc2FfQW5kcm9pZFwiLFxuICAgICAgICAgICAgICBcImNsb3VkUGFzc3dvcmRcIjogcGFzcyxcbiAgICAgICAgICAgICAgXCJjbG91ZFVzZXJOYW1lXCI6IHVzZXIsXG4gICAgICAgICAgICAgIFwidGVybWluYWxVVUlEXCI6IHBhcmFtcy50ZXJtSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShsb2dpbl9wYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlblxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnJlc3VsdCl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdG9rZW4gPSB0b2tlbiB8fCBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7dG9rZW46IHRva2VufSxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6IFwiZ2V0RGV2aWNlTGlzdFwiIH0pLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjb21tYW5kOiAoZGV2aWNlLCBjb21tYW5kKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdmFyIHRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjpcInBhc3N0aHJvdWdoXCIsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiZGV2aWNlSWRcIjogZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgICAgICBcInJlcXVlc3REYXRhXCI6IEpTT04uc3RyaW5naWZ5KCBjb21tYW5kIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHNldCB0aGUgdG9rZW5cbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICBwYXJhbXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBkZXZpY2UuYXBwU2VydmVyVXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogKGRldmljZSwgdG9nZ2xlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiB0b2dnbGUgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHN0cmVhbXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiAnaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaScsIGhlYWRlcnM6IHt9LCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXV0aDogYXN5bmMgKHBpbmcpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmIHNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gKHBpbmcpID8gJy91c2Vycy9waW5nJyA6ICcvdXNlcnMvYXV0aCc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS2V5J10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1CQi1Vc2VyJ10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLmFjY2VzcyAmJiByZXNwb25zZS5kYXRhLmFjY2Vzcy5pZClcbiAgICAgICAgICAgICAgICAgIHRoaXMuYWNjZXNzVG9rZW4ocmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpO1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGtldHRsZXM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoa2V0dGxlKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXBkYXRlZEtldHRsZSA9IGFuZ3VsYXIuY29weShrZXR0bGUpO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG5vdCBuZWVkZWQgZGF0YVxuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudmFsdWVzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUubWVzc2FnZTtcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnRpbWVycztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLmtub2I7XG4gICAgICAgICAgICB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0ID0gKHNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEhdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzL2FybSc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbjogc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLFxuICAgICAgICAgICAgICBrZXR0bGU6IHVwZGF0ZWRLZXR0bGUsXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnM6IHNldHRpbmdzLm5vdGlmaWNhdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbnM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbklkOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGtldHRsZToga2V0dGxlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoc2Vzc2lvbikgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucy8nK3Nlc3Npb24uaWQ7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQQVRDSCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIG5hbWU6IHNlc3Npb24ubmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc2Vzc2lvbi50eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZighIXNldHRpbmdzLmluZmx1eGRiLnBvcnQgJiYgIXRoaXMuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhvc3RlZDogKHVybCkgPT4ge1xuICAgICAgICAgIHJldHVybiAodXJsLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xIHx8XG4gICAgICAgICAgICB1cmwuaW5kZXhPZignaG9zdGVkLmJyZXdiZW5jaC5jbycpICE9PSAtMSk7XG4gICAgICAgIH0sXG4gICAgICAgIHBpbmc6IChpbmZsdXhkYikgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVybCl7XG4gICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uID0gYCR7aW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgICBpZiggISFpbmZsdXhkYi5wb3J0ICYmICF0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgIGlmKHRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgPSBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYDtcbiAgICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVzZXIgJiYgaW5mbHV4ZGIucGFzcyl7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShpbmZsdXhkYi51c2VyLnRyaW0oKSsnOicraW5mbHV4ZGIucGFzcy50cmltKCkpfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgIGlmKHRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpe1xuICAgICAgICAgICAgcS5yZXNvbHZlKFtzZXR0aW5ncy5pbmZsdXhkYi51c2VyXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgIGlmKHRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpe1xuICAgICAgICAgICAgcS5yZWplY3QoJ0RhdGFiYXNlIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudChgQ1JFQVRFIERBVEFCQVNFIFwiJHtuYW1lfVwiYCl9YCwgbWV0aG9kOiAnUE9TVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogISFvcHRpb25zLnNlc3Npb24sXG4gICAgICAgICAgICAgICAgdGV4dDogISFvcHRpb25zLnNlc3Npb24gPyBvcHRpb25zLnNlc3Npb24gOiAnJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTW9uaXRvcicsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG4gICAgICAgICAgICAgIGludGVycG9sYXRlOiAnYmFzaXMnLFxuICAgICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBrZXk6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLm5hbWUgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpc0FyZWE6IGZ1bmN0aW9uIChkKSB7IHJldHVybiAhIW9wdGlvbnMuY2hhcnQuYXJlYSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoISFvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSDolTTolUycpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMlcCcpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCFvcHRpb25zLnVuaXQgfHwgb3B0aW9ucy51bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShkLDApKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0bykudG9GaXhlZCgyKTs7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoISFyZWNpcGUuRl9SX05BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUsMTApO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIHZhciBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==