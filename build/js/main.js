webpackJsonp([1],{

/***/ 318:
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

var _lodash = __webpack_require__(164);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(165);

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
      step: 5,
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

    var k;

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

    k.running = !k.running;

    if (kettle.active && k.running) {
      //start the relay
      $scope.toggleRelay(kettle, k, true);
    } else if (!k.running) {
      //stop the relay
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
        general: { debug: false, pollSeconds: 10, unit: 'F', shared: false },
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
      var sg = (1 + plato / (258.6 - plato / 258.2 * 227.1)).toFixed(3);
      return parseFloat(sg);
    },
    plato: function plato(sg) {
      var plato = (-1 * 616.868 + 1111.14 * sg - 630.272 * Math.pow(sg, 2) + 135.997 * Math.pow(sg, 3)).toString();
      if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) == 5) plato = plato.substring(0, plato.indexOf('.') + 2);else if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) < 5) plato = plato.substring(0, plato.indexOf('.'));else if (plato.substring(plato.indexOf('.') + 1, plato.indexOf('.') + 2) > 5) {
        plato = plato.substring(0, plato.indexOf('.'));
        plato = parseFloat(plato) + 1;
      }
      return parseFloat(plato);
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

},[318]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXJkdWlub19wYXNzIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0Iiwic2Vzc2lvbiIsInN0cmVhbXMiLCJkZWZhdWx0S2V0dGxlcyIsInNoYXJlIiwicGFyYW1zIiwiZmlsZSIsInBhc3N3b3JkIiwibmVlZFBhc3N3b3JkIiwiYWNjZXNzIiwiZGVsZXRlQWZ0ZXIiLCJvcGVuU2tldGNoZXMiLCIkIiwibW9kYWwiLCJzdW1WYWx1ZXMiLCJvYmoiLCJzdW1CeSIsInVwZGF0ZUFCViIsInJlY2lwZSIsInNjYWxlIiwibWV0aG9kIiwiYWJ2Iiwib2ciLCJmZyIsImFidmEiLCJhYnciLCJhdHRlbnVhdGlvbiIsInBsYXRvIiwiY2Fsb3JpZXMiLCJyZSIsInNnIiwiY2hhbmdlTWV0aG9kIiwiY2hhbmdlU2NhbGUiLCJnZXRTdGF0dXNDbGFzcyIsInN0YXR1cyIsImVuZHNXaXRoIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsIlJTU0kiLCJhbmFsb2ciLCJkaWdpdGFsIiwiYWRjIiwic2VjdXJlIiwidmVyc2lvbiIsImR0IiwiZWFjaCIsImFyZHVpbm8iLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJjb25uZWN0IiwidGhlbiIsImluZm8iLCJCcmV3QmVuY2giLCJldmVudCIsInNyY0VsZW1lbnQiLCJpbm5lckhUTUwiLCJ0b3VjaCIsImNhdGNoIiwiZXJyIiwicmVib290IiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInJlc3BvbnNlIiwidG9rZW4iLCJzY2FuIiwic2V0RXJyb3JNZXNzYWdlIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInJlc3BvbnNlRGF0YSIsIkpTT04iLCJwYXJzZSIsInN5c3RlbSIsImdldF9zeXNpbmZvIiwiZW1ldGVyIiwiZ2V0X3JlYWx0aW1lIiwiZXJyX2NvZGUiLCJwb3dlciIsImRldmljZSIsInRvZ2dsZSIsIm9mZk9yT24iLCJyZWxheV9zdGF0ZSIsImFkZEtldHRsZSIsImZpbmQiLCJzdGlja3kiLCJwaW4iLCJhdXRvIiwiZHV0eUN5Y2xlIiwic2tldGNoIiwidGVtcCIsInZjYyIsImhpdCIsIm1lYXN1cmVkIiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwicmF3Iiwidm9sdHMiLCJ2YWx1ZXMiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsImlzRVNQIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjaGFuZ2VTZW5zb3IiLCJzZW5zb3JUeXBlcyIsInBlcmNlbnQiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJicmV3YmVuY2hIb3N0ZWQiLCJob3N0ZWQiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYiIsImRicyIsImNvbmNhdCIsImFwcGx5IiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJ1c2VybmFtZSIsImFwaV9rZXkiLCJhdXRoIiwicmVsYXkiLCJzYXZlIiwia2V0dGxlUmVzcG9uc2UiLCJtZXJnZSIsImNvbnNvbGUiLCJzZXNzaW9ucyIsInNoYXJlQWNjZXNzIiwic2hhcmVkIiwiZnJhbWVFbGVtZW50IiwibG9hZFNoYXJlRmlsZSIsImNvbnRlbnRzIiwibm90aWZpY2F0aW9ucyIsIm9uIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJsYWJlbCIsImFtb3VudCIsImFkZFRpbWVyIiwibm90ZXMiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0b29sdGlwIiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJzaG93IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsInVwZGF0ZUFyZHVpbm9TdGF0dXMiLCJkb21haW4iLCJza2V0Y2hfdmVyc2lvbiIsInVwZGF0ZVRlbXAiLCJrZXkiLCJ0ZW1wcyIsInNoaWZ0IiwiYWx0aXR1ZGUiLCJwcmVzc3VyZSIsImN1cnJlbnRWYWx1ZSIsInVuaXRUeXBlIiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJiZiIsIkRIVCIsIkRTMThCMjAiLCJCTVAiLCJrZXR0bGVUeXBlIiwidW5zaGlmdCIsImEiLCJ0b0xvd2VyQ2FzZSIsImRvd25sb2FkU2tldGNoIiwiaGFzVHJpZ2dlcnMiLCJ0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmciLCJjb25uZWN0aW9uIiwiYXV0b2dlbiIsImdldCIsImpvaW4iLCJtZDUiLCJjb25uZWN0aW9uX3N0cmluZyIsInRyaW0iLCJhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zIiwicG9ydCIsIlRIQyIsInN0cmVhbVNrZXRjaCIsImNyZWF0ZUVsZW1lbnQiLCJzZXRBdHRyaWJ1dGUiLCJzdHlsZSIsImRpc3BsYXkiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJjbGljayIsInJlbW92ZUNoaWxkIiwiZ2V0SVBBZGRyZXNzIiwiaXBBZGRyZXNzIiwiaXAiLCJpY29uIiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJ1cGRhdGVTdHJlYW1zIiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImFjY2Vzc1Rva2VuIiwic2V0SXRlbSIsImdldEl0ZW0iLCJkZWJ1ZyIsIm1pbGl0YXJ5IiwiYXJlYSIsInJlYWRPbmx5IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0Iiwid2l0aENyZWRlbnRpYWxzIiwic2Vuc29yIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJ1cGRhdGVkS2V0dGxlIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJ0aXRsZSIsImVuYWJsZSIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxrQkFBekIsRUFBNkNDLGFBQTdDLEVBQTREQyxpQkFBNUQsRUFBK0VDLGdCQUEvRSxFQUFpRzs7QUFFdkdGLGdCQUFjRyxRQUFkLENBQXVCQyxVQUF2QixHQUFvQyxJQUFwQztBQUNBSixnQkFBY0csUUFBZCxDQUF1QkUsT0FBdkIsQ0FBK0JDLE1BQS9CLEdBQXdDLGdDQUF4QztBQUNBLFNBQU9OLGNBQWNHLFFBQWQsQ0FBdUJFLE9BQXZCLENBQStCQyxNQUEvQixDQUFzQyxrQkFBdEMsQ0FBUDs7QUFFQUwsb0JBQWtCTSxVQUFsQixDQUE2QixFQUE3QjtBQUNBTCxtQkFBaUJNLDBCQUFqQixDQUE0QyxvRUFBNUM7O0FBRUFWLGlCQUNHVyxLQURILENBQ1MsTUFEVCxFQUNpQjtBQUNiQyxTQUFLLEVBRFE7QUFFYkMsaUJBQWEsb0JBRkE7QUFHYkMsZ0JBQVk7QUFIQyxHQURqQixFQU1HSCxLQU5ILENBTVMsT0FOVCxFQU1rQjtBQUNkQyxTQUFLLFdBRFM7QUFFZEMsaUJBQWEsb0JBRkM7QUFHZEMsZ0JBQVk7QUFIRSxHQU5sQixFQVdHSCxLQVhILENBV1MsT0FYVCxFQVdrQjtBQUNkQyxTQUFLLFFBRFM7QUFFZEMsaUJBQWEsb0JBRkM7QUFHZEMsZ0JBQVk7QUFIRSxHQVhsQixFQWdCR0gsS0FoQkgsQ0FnQlMsV0FoQlQsRUFnQnNCO0FBQ25CQyxTQUFLLE9BRGM7QUFFbkJDLGlCQUFhO0FBRk0sR0FoQnRCO0FBcUJELENBdENELEU7Ozs7Ozs7Ozs7QUNKQUUsUUFBUWpCLE1BQVIsQ0FBZSxtQkFBZixFQUNDZ0IsVUFERCxDQUNZLFVBRFosRUFDd0IsVUFBU0UsTUFBVCxFQUFpQkMsTUFBakIsRUFBeUJDLE9BQXpCLEVBQWtDQyxRQUFsQyxFQUE0Q0MsU0FBNUMsRUFBdURDLEVBQXZELEVBQTJEQyxLQUEzRCxFQUFrRUMsSUFBbEUsRUFBd0VDLFdBQXhFLEVBQW9GOztBQUU1R1IsU0FBT1MsYUFBUCxHQUF1QixVQUFTQyxDQUFULEVBQVc7QUFDaEMsUUFBR0EsQ0FBSCxFQUFLO0FBQ0hYLGNBQVFZLE9BQVIsQ0FBZ0JELEVBQUVFLE1BQWxCLEVBQTBCQyxJQUExQixDQUErQixhQUEvQjtBQUNEO0FBQ0RMLGdCQUFZTSxLQUFaO0FBQ0FDLFdBQU9DLFFBQVAsQ0FBZ0JDLElBQWhCLEdBQXFCLEdBQXJCO0FBQ0QsR0FORDs7QUFRQSxNQUFJaEIsT0FBT2lCLE9BQVAsQ0FBZUMsSUFBZixJQUF1QixPQUEzQixFQUNFbkIsT0FBT1MsYUFBUDs7QUFFRixNQUFJVyxlQUFlLElBQW5CO0FBQ0EsTUFBSUMsYUFBYSxHQUFqQjtBQUNBLE1BQUlDLFVBQVUsSUFBZCxDQWY0RyxDQWV4Rjs7QUFFcEJ0QixTQUFPUSxXQUFQLEdBQXFCQSxXQUFyQjtBQUNBUixTQUFPdUIsSUFBUCxHQUFjLEVBQUNDLE9BQU8sQ0FBQyxFQUFFQyxTQUFTVCxRQUFULENBQWtCVSxRQUFsQixJQUE0QixRQUE5QixDQUFUO0FBQ1ZDLDRCQUFzQkYsU0FBU1QsUUFBVCxDQUFrQlk7QUFEOUIsR0FBZDtBQUdBNUIsU0FBTzZCLEdBQVAsR0FBYTtBQUNYQyxVQUFNLEVBREs7QUFFWEMsVUFBTSxFQUZLO0FBR1hDLGVBQVcsRUFIQTtBQUlYQyxjQUFVLE9BSkM7QUFLWEMsa0JBQWMsU0FMSDtBQU1YQyxpQkFBYTtBQU5GLEdBQWI7QUFRQW5DLFNBQU9vQyxJQUFQO0FBQ0FwQyxTQUFPcUMsTUFBUDtBQUNBckMsU0FBT3NDLEtBQVA7QUFDQXRDLFNBQU91QyxRQUFQO0FBQ0F2QyxTQUFPd0MsR0FBUDtBQUNBeEMsU0FBT3lDLFdBQVAsR0FBcUJqQyxZQUFZaUMsV0FBWixFQUFyQjtBQUNBekMsU0FBTzBDLFlBQVAsR0FBc0IsSUFBdEI7QUFDQTFDLFNBQU8yQyxLQUFQLEdBQWUsRUFBQ0MsU0FBUyxFQUFWLEVBQWNkLE1BQU0sUUFBcEIsRUFBZjtBQUNBOUIsU0FBTzZDLE1BQVAsR0FBZ0I7QUFDZEMsU0FBSyxDQURTO0FBRWRDLGFBQVM7QUFDUEMsYUFBTyxDQURBO0FBRVBDLFlBQU0sR0FGQztBQUdQQyxZQUFNLENBSEM7QUFJUEMsaUJBQVcsbUJBQVNDLEtBQVQsRUFBZ0I7QUFDdkIsZUFBVUEsS0FBVjtBQUNILE9BTk07QUFPUEMsYUFBTyxlQUFTQyxRQUFULEVBQW1CQyxVQUFuQixFQUErQkMsU0FBL0IsRUFBMENDLFdBQTFDLEVBQXNEO0FBQzNELFlBQUlDLFNBQVNKLFNBQVNLLEtBQVQsQ0FBZSxHQUFmLENBQWI7QUFDQSxZQUFJQyxDQUFKOztBQUVBLGdCQUFRRixPQUFPLENBQVAsQ0FBUjtBQUNFLGVBQUssTUFBTDtBQUNFRSxnQkFBSTVELE9BQU82RCxPQUFQLENBQWVILE9BQU8sQ0FBUCxDQUFmLEVBQTBCSSxNQUE5QjtBQUNBO0FBQ0YsZUFBSyxNQUFMO0FBQ0VGLGdCQUFJNUQsT0FBTzZELE9BQVAsQ0FBZUgsT0FBTyxDQUFQLENBQWYsRUFBMEJLLE1BQTlCO0FBQ0E7QUFDRixlQUFLLE1BQUw7QUFDRUgsZ0JBQUk1RCxPQUFPNkQsT0FBUCxDQUFlSCxPQUFPLENBQVAsQ0FBZixFQUEwQk0sSUFBOUI7QUFDQTtBQVRKOztBQVlBLFlBQUcsQ0FBQ0osQ0FBSixFQUNFO0FBQ0YsWUFBRzVELE9BQU82RCxPQUFQLENBQWVILE9BQU8sQ0FBUCxDQUFmLEVBQTBCTyxNQUExQixJQUFvQ0wsRUFBRU0sR0FBdEMsSUFBNkNOLEVBQUVPLE9BQWxELEVBQTBEO0FBQ3hELGlCQUFPbkUsT0FBT29FLFdBQVAsQ0FBbUJwRSxPQUFPNkQsT0FBUCxDQUFlSCxPQUFPLENBQVAsQ0FBZixDQUFuQixFQUE4Q0UsQ0FBOUMsRUFBaUQsSUFBakQsQ0FBUDtBQUNEO0FBQ0Y7QUE1Qk07QUFGSyxHQUFoQjs7QUFrQ0E1RCxTQUFPcUUsc0JBQVAsR0FBZ0MsVUFBU3ZDLElBQVQsRUFBZXdDLEtBQWYsRUFBcUI7QUFDbkQsV0FBT0MsT0FBT0MsTUFBUCxDQUFjeEUsT0FBTzZDLE1BQVAsQ0FBY0UsT0FBNUIsRUFBcUMsRUFBQzBCLElBQU8zQyxJQUFQLFNBQWV3QyxLQUFoQixFQUFyQyxDQUFQO0FBQ0QsR0FGRDs7QUFJQXRFLFNBQU8wRSxnQkFBUCxHQUEwQixVQUFTQyxLQUFULEVBQWU7QUFDdkNBLFlBQVFBLE1BQU1DLE9BQU4sQ0FBYyxJQUFkLEVBQW1CLEVBQW5CLEVBQXVCQSxPQUF2QixDQUErQixJQUEvQixFQUFvQyxFQUFwQyxDQUFSO0FBQ0EsUUFBR0QsTUFBTUUsT0FBTixDQUFjLEdBQWQsTUFBcUIsQ0FBQyxDQUF6QixFQUEyQjtBQUN6QixVQUFJQyxPQUFLSCxNQUFNaEIsS0FBTixDQUFZLEdBQVosQ0FBVDtBQUNBZ0IsY0FBUSxDQUFDSSxXQUFXRCxLQUFLLENBQUwsQ0FBWCxJQUFvQkMsV0FBV0QsS0FBSyxDQUFMLENBQVgsQ0FBckIsSUFBMEMsQ0FBbEQ7QUFDRCxLQUhELE1BR087QUFDTEgsY0FBUUksV0FBV0osS0FBWCxDQUFSO0FBQ0Q7QUFDRCxRQUFHLENBQUNBLEtBQUosRUFDRSxPQUFPLEVBQVA7QUFDRixRQUFJSyxJQUFJQyxFQUFFQyxNQUFGLENBQVNsRixPQUFPdUMsUUFBaEIsRUFBMEIsVUFBUzRDLElBQVQsRUFBYztBQUM5QyxhQUFRQSxLQUFLQyxHQUFMLElBQVlULEtBQWIsR0FBc0JRLEtBQUtFLEdBQTNCLEdBQWlDLEVBQXhDO0FBQ0QsS0FGTyxDQUFSO0FBR0EsUUFBRyxDQUFDLENBQUNMLEVBQUVNLE1BQVAsRUFDRSxPQUFPTixFQUFFQSxFQUFFTSxNQUFGLEdBQVMsQ0FBWCxFQUFjRCxHQUFyQjtBQUNGLFdBQU8sRUFBUDtBQUNELEdBaEJEOztBQWtCQTtBQUNBckYsU0FBT3VGLFFBQVAsR0FBa0IvRSxZQUFZK0UsUUFBWixDQUFxQixVQUFyQixLQUFvQy9FLFlBQVlnRixLQUFaLEVBQXREO0FBQ0E7QUFDQSxNQUFHLENBQUN4RixPQUFPdUYsUUFBUCxDQUFnQkUsT0FBcEIsRUFDRSxPQUFPekYsT0FBT1MsYUFBUCxFQUFQO0FBQ0ZULFNBQU8wRixZQUFQLEdBQXNCbEYsWUFBWWtGLFlBQVosQ0FBeUIsRUFBQ0MsTUFBTTNGLE9BQU91RixRQUFQLENBQWdCRSxPQUFoQixDQUF3QkUsSUFBL0IsRUFBcUNDLE9BQU81RixPQUFPdUYsUUFBUCxDQUFnQkssS0FBNUQsRUFBbUVDLFNBQVM3RixPQUFPdUYsUUFBUCxDQUFnQk8sT0FBaEIsQ0FBd0JELE9BQXBHLEVBQXpCLENBQXRCO0FBQ0E3RixTQUFPNkQsT0FBUCxHQUFpQnJELFlBQVkrRSxRQUFaLENBQXFCLFNBQXJCLEtBQW1DL0UsWUFBWXVGLGNBQVosRUFBcEQ7QUFDQS9GLFNBQU9nRyxLQUFQLEdBQWdCLENBQUMvRixPQUFPZ0csTUFBUCxDQUFjQyxJQUFmLElBQXVCMUYsWUFBWStFLFFBQVosQ0FBcUIsT0FBckIsQ0FBeEIsR0FBeUQvRSxZQUFZK0UsUUFBWixDQUFxQixPQUFyQixDQUF6RCxHQUF5RjtBQUNsR1csVUFBTWpHLE9BQU9nRyxNQUFQLENBQWNDLElBQWQsSUFBc0IsSUFEc0U7QUFFaEdDLGNBQVUsSUFGc0Y7QUFHaEdDLGtCQUFjLEtBSGtGO0FBSWhHQyxZQUFRLFVBSndGO0FBS2hHQyxpQkFBYTtBQUxtRixHQUF4Rzs7QUFRQXRHLFNBQU91RyxZQUFQLEdBQXNCLFlBQVU7QUFDOUJDLE1BQUUsZ0JBQUYsRUFBb0JDLEtBQXBCLENBQTBCLE1BQTFCO0FBQ0FELE1BQUUsZ0JBQUYsRUFBb0JDLEtBQXBCLENBQTBCLE1BQTFCO0FBQ0QsR0FIRDs7QUFLQXpHLFNBQU8wRyxTQUFQLEdBQW1CLFVBQVNDLEdBQVQsRUFBYTtBQUM5QixXQUFPMUIsRUFBRTJCLEtBQUYsQ0FBUUQsR0FBUixFQUFZLFFBQVosQ0FBUDtBQUNELEdBRkQ7O0FBSUE7QUFDQTNHLFNBQU82RyxTQUFQLEdBQW1CLFlBQVU7QUFDM0IsUUFBRzdHLE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJDLEtBQXZCLElBQThCLFNBQWpDLEVBQTJDO0FBQ3pDLFVBQUcvRyxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCRSxNQUF2QixJQUErQixVQUFsQyxFQUNFaEgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkcsR0FBdkIsR0FBNkJ6RyxZQUFZeUcsR0FBWixDQUFnQmpILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJJLEVBQXZDLEVBQTBDbEgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkssRUFBakUsQ0FBN0IsQ0FERixLQUdFbkgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkcsR0FBdkIsR0FBNkJ6RyxZQUFZNEcsSUFBWixDQUFpQnBILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJJLEVBQXhDLEVBQTJDbEgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkssRUFBbEUsQ0FBN0I7QUFDRm5ILGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJPLEdBQXZCLEdBQTZCN0csWUFBWTZHLEdBQVosQ0FBZ0JySCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCRyxHQUF2QyxFQUEyQ2pILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQWxFLENBQTdCO0FBQ0FuSCxhQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCUSxXQUF2QixHQUFxQzlHLFlBQVk4RyxXQUFaLENBQXdCOUcsWUFBWStHLEtBQVosQ0FBa0J2SCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSSxFQUF6QyxDQUF4QixFQUFxRTFHLFlBQVkrRyxLQUFaLENBQWtCdkgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkssRUFBekMsQ0FBckUsQ0FBckM7QUFDQW5ILGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJVLFFBQXZCLEdBQWtDaEgsWUFBWWdILFFBQVosQ0FBcUJ4SCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCTyxHQUE1QyxFQUMvQjdHLFlBQVlpSCxFQUFaLENBQWVqSCxZQUFZK0csS0FBWixDQUFrQnZILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJJLEVBQXpDLENBQWYsRUFBNEQxRyxZQUFZK0csS0FBWixDQUFrQnZILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQXpDLENBQTVELENBRCtCLEVBRS9CbkgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkssRUFGUSxDQUFsQztBQUdELEtBVkQsTUFVTztBQUNMLFVBQUduSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCRSxNQUF2QixJQUErQixVQUFsQyxFQUNFaEgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkcsR0FBdkIsR0FBNkJ6RyxZQUFZeUcsR0FBWixDQUFnQnpHLFlBQVlrSCxFQUFaLENBQWUxSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSSxFQUF0QyxDQUFoQixFQUEwRDFHLFlBQVlrSCxFQUFaLENBQWUxSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSyxFQUF0QyxDQUExRCxDQUE3QixDQURGLEtBR0VuSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCRyxHQUF2QixHQUE2QnpHLFlBQVk0RyxJQUFaLENBQWlCNUcsWUFBWWtILEVBQVosQ0FBZTFILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJJLEVBQXRDLENBQWpCLEVBQTJEMUcsWUFBWWtILEVBQVosQ0FBZTFILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQXRDLENBQTNELENBQTdCO0FBQ0ZuSCxhQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCTyxHQUF2QixHQUE2QjdHLFlBQVk2RyxHQUFaLENBQWdCckgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkcsR0FBdkMsRUFBMkN6RyxZQUFZa0gsRUFBWixDQUFlMUgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkssRUFBdEMsQ0FBM0MsQ0FBN0I7QUFDQW5ILGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJRLFdBQXZCLEdBQXFDOUcsWUFBWThHLFdBQVosQ0FBd0J0SCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSSxFQUEvQyxFQUFrRGxILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQXpFLENBQXJDO0FBQ0FuSCxhQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCVSxRQUF2QixHQUFrQ2hILFlBQVlnSCxRQUFaLENBQXFCeEgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1Qk8sR0FBNUMsRUFDL0I3RyxZQUFZaUgsRUFBWixDQUFlekgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkksRUFBdEMsRUFBeUNsSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSyxFQUFoRSxDQUQrQixFQUUvQjNHLFlBQVlrSCxFQUFaLENBQWUxSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSyxFQUF0QyxDQUYrQixDQUFsQztBQUdEO0FBQ0YsR0F0QkQ7O0FBd0JBbkgsU0FBTzJILFlBQVAsR0FBc0IsVUFBU1gsTUFBVCxFQUFnQjtBQUNwQ2hILFdBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJFLE1BQXZCLEdBQWdDQSxNQUFoQztBQUNBaEgsV0FBTzZHLFNBQVA7QUFDRCxHQUhEOztBQUtBN0csU0FBTzRILFdBQVAsR0FBcUIsVUFBU2IsS0FBVCxFQUFlO0FBQ2xDL0csV0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkMsS0FBdkIsR0FBK0JBLEtBQS9CO0FBQ0EsUUFBR0EsU0FBTyxTQUFWLEVBQW9CO0FBQ2xCL0csYUFBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkksRUFBdkIsR0FBNEIxRyxZQUFZa0gsRUFBWixDQUFlMUgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkksRUFBdEMsQ0FBNUI7QUFDQWxILGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQXZCLEdBQTRCM0csWUFBWWtILEVBQVosQ0FBZTFILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQXRDLENBQTVCO0FBQ0QsS0FIRCxNQUdPO0FBQ0xuSCxhQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSSxFQUF2QixHQUE0QjFHLFlBQVkrRyxLQUFaLENBQWtCdkgsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkksRUFBekMsQ0FBNUI7QUFDQWxILGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJLLEVBQXZCLEdBQTRCM0csWUFBWStHLEtBQVosQ0FBa0J2SCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSyxFQUF6QyxDQUE1QjtBQUNEO0FBQ0YsR0FURDs7QUFXQW5ILFNBQU82SCxjQUFQLEdBQXdCLFVBQVNDLE1BQVQsRUFBZ0I7QUFDdEMsUUFBR0EsVUFBVSxXQUFiLEVBQ0UsT0FBTyxTQUFQLENBREYsS0FFSyxJQUFHN0MsRUFBRThDLFFBQUYsQ0FBV0QsTUFBWCxFQUFrQixLQUFsQixDQUFILEVBQ0gsT0FBTyxXQUFQLENBREcsS0FHSCxPQUFPLFFBQVA7QUFDSCxHQVBEOztBQVNBOUgsU0FBTzZHLFNBQVA7O0FBRUU3RyxTQUFPZ0ksWUFBUCxHQUFzQixVQUFTQyxNQUFULEVBQWdCO0FBQ2xDQTtBQUNBLFdBQU9DLE1BQU1ELE1BQU4sRUFBY0UsSUFBZCxHQUFxQkMsR0FBckIsQ0FBeUIsVUFBQ25ELENBQUQsRUFBSW9ELEdBQUo7QUFBQSxhQUFZLElBQUlBLEdBQWhCO0FBQUEsS0FBekIsQ0FBUDtBQUNILEdBSEQ7O0FBS0FySSxTQUFPc0ksUUFBUCxHQUFrQjtBQUNoQkMsU0FBSyxlQUFNO0FBQ1QsVUFBSUMsTUFBTSxJQUFJQyxJQUFKLEVBQVY7QUFDQSxVQUFHLENBQUN6SSxPQUFPdUYsUUFBUCxDQUFnQitDLFFBQXBCLEVBQThCdEksT0FBT3VGLFFBQVAsQ0FBZ0IrQyxRQUFoQixHQUEyQixFQUEzQjtBQUM5QnRJLGFBQU91RixRQUFQLENBQWdCK0MsUUFBaEIsQ0FBeUJJLElBQXpCLENBQThCO0FBQzVCakUsWUFBSWtFLEtBQUtILE1BQUksRUFBSixHQUFPeEksT0FBT3VGLFFBQVAsQ0FBZ0IrQyxRQUFoQixDQUF5QmhELE1BQWhDLEdBQXVDLENBQTVDLENBRHdCO0FBRTVCMUYsYUFBSyxlQUZ1QjtBQUc1QmdKLGVBQU8sRUFIcUI7QUFJNUJDLGNBQU0sS0FKc0I7QUFLNUJDLGdCQUFRLENBTG9CO0FBTTVCQyxpQkFBUyxFQU5tQjtBQU81QkMsYUFBSyxDQVB1QjtBQVE1QkMsZ0JBQVEsS0FSb0I7QUFTNUJDLGlCQUFTLEVBVG1CO0FBVTVCcEIsZ0JBQVEsRUFBQ25GLE9BQU8sRUFBUixFQUFXd0csSUFBSSxFQUFmLEVBQWtCdkcsU0FBUSxFQUExQjtBQVZvQixPQUE5QjtBQVlBcUMsUUFBRW1FLElBQUYsQ0FBT3BKLE9BQU82RCxPQUFkLEVBQXVCLGtCQUFVO0FBQy9CLFlBQUcsQ0FBQ0gsT0FBTzJGLE9BQVgsRUFDRTNGLE9BQU8yRixPQUFQLEdBQWlCckosT0FBT3VGLFFBQVAsQ0FBZ0IrQyxRQUFoQixDQUF5QixDQUF6QixDQUFqQjtBQUNILE9BSEQ7QUFJRCxLQXBCZTtBQXFCaEJnQixZQUFRLGdCQUFDRCxPQUFELEVBQWE7QUFDbkJwRSxRQUFFbUUsSUFBRixDQUFPcEosT0FBTzZELE9BQWQsRUFBdUIsa0JBQVU7QUFDL0IsWUFBR0gsT0FBTzJGLE9BQVAsSUFBa0IzRixPQUFPMkYsT0FBUCxDQUFlNUUsRUFBZixJQUFxQjRFLFFBQVE1RSxFQUFsRCxFQUNFZixPQUFPMkYsT0FBUCxHQUFpQkEsT0FBakI7QUFDSCxPQUhEO0FBSUQsS0ExQmU7QUEyQmhCRSxZQUFRLGlCQUFDakYsS0FBRCxFQUFRK0UsT0FBUixFQUFvQjtBQUMxQnJKLGFBQU91RixRQUFQLENBQWdCK0MsUUFBaEIsQ0FBeUJrQixNQUF6QixDQUFnQ2xGLEtBQWhDLEVBQXVDLENBQXZDO0FBQ0FXLFFBQUVtRSxJQUFGLENBQU9wSixPQUFPNkQsT0FBZCxFQUF1QixrQkFBVTtBQUMvQixZQUFHSCxPQUFPMkYsT0FBUCxJQUFrQjNGLE9BQU8yRixPQUFQLENBQWU1RSxFQUFmLElBQXFCNEUsUUFBUTVFLEVBQWxELEVBQ0UsT0FBT2YsT0FBTzJGLE9BQWQ7QUFDSCxPQUhEO0FBSUQsS0FqQ2U7QUFrQ2hCSSxhQUFTLGlCQUFDSixPQUFELEVBQWE7QUFDcEJBLGNBQVF2QixNQUFSLENBQWVxQixFQUFmLEdBQW9CLEVBQXBCO0FBQ0FFLGNBQVF2QixNQUFSLENBQWVuRixLQUFmLEdBQXVCLEVBQXZCO0FBQ0EwRyxjQUFRdkIsTUFBUixDQUFlbEYsT0FBZixHQUF5QixlQUF6QjtBQUNBcEMsa0JBQVlpSixPQUFaLENBQW9CSixPQUFwQixFQUE2QixNQUE3QixFQUNHSyxJQURILENBQ1EsZ0JBQVE7QUFDWixZQUFHQyxRQUFRQSxLQUFLQyxTQUFoQixFQUEwQjtBQUN4QkMsZ0JBQU1DLFVBQU4sQ0FBaUJDLFNBQWpCLEdBQTZCLFNBQTdCO0FBQ0FWLGtCQUFRVCxLQUFSLEdBQWdCZSxLQUFLQyxTQUFMLENBQWVoQixLQUEvQjtBQUNBLGNBQUdlLEtBQUtDLFNBQUwsQ0FBZWYsSUFBbEIsRUFDRVEsUUFBUVIsSUFBUixHQUFlYyxLQUFLQyxTQUFMLENBQWVmLElBQTlCO0FBQ0ZRLGtCQUFRSCxPQUFSLEdBQWtCUyxLQUFLQyxTQUFMLENBQWVWLE9BQWpDO0FBQ0FHLGtCQUFRdkIsTUFBUixDQUFlcUIsRUFBZixHQUFvQixJQUFJVixJQUFKLEVBQXBCO0FBQ0FZLGtCQUFRdkIsTUFBUixDQUFlbkYsS0FBZixHQUF1QixFQUF2QjtBQUNBMEcsa0JBQVF2QixNQUFSLENBQWVsRixPQUFmLEdBQXlCLEVBQXpCO0FBQ0EsY0FBR3lHLFFBQVFULEtBQVIsQ0FBYy9ELE9BQWQsQ0FBc0IsT0FBdEIsS0FBa0MsQ0FBckMsRUFBdUM7QUFDckN3RSxvQkFBUVAsTUFBUixHQUFpQixFQUFqQjtBQUNBTyxvQkFBUU4sT0FBUixHQUFrQixFQUFsQjtBQUNBTSxvQkFBUVcsS0FBUixHQUFnQixDQUFDLENBQUQsRUFBRyxDQUFILEVBQUssQ0FBTCxFQUFPLEVBQVAsRUFBVSxFQUFWLEVBQWEsRUFBYixFQUFnQixFQUFoQixFQUFtQixFQUFuQixFQUFzQixFQUF0QixFQUF5QixFQUF6QixDQUFoQjtBQUNELFdBSkQsTUFJTyxJQUFHWCxRQUFRVCxLQUFSLENBQWMvRCxPQUFkLENBQXNCLFNBQXRCLEtBQW9DLENBQXZDLEVBQXlDO0FBQzlDd0Usb0JBQVFQLE1BQVIsR0FBaUIsQ0FBakI7QUFDQU8sb0JBQVFOLE9BQVIsR0FBa0IsRUFBbEI7QUFDRDtBQUNGO0FBQ0YsT0FwQkgsRUFxQkdrQixLQXJCSCxDQXFCUyxlQUFPO0FBQ1osWUFBR0MsT0FBT0EsSUFBSXBDLE1BQUosSUFBYyxDQUFDLENBQXpCLEVBQTJCO0FBQ3pCdUIsa0JBQVF2QixNQUFSLENBQWVxQixFQUFmLEdBQW9CLEVBQXBCO0FBQ0FFLGtCQUFRdkIsTUFBUixDQUFlbEYsT0FBZixHQUF5QixFQUF6QjtBQUNBeUcsa0JBQVF2QixNQUFSLENBQWVuRixLQUFmLEdBQXVCLG1CQUF2QjtBQUNEO0FBQ0YsT0EzQkg7QUE0QkQsS0FsRWU7QUFtRWhCd0gsWUFBUSxnQkFBQ2QsT0FBRCxFQUFhO0FBQ25CQSxjQUFRdkIsTUFBUixDQUFlcUIsRUFBZixHQUFvQixFQUFwQjtBQUNBRSxjQUFRdkIsTUFBUixDQUFlbkYsS0FBZixHQUF1QixFQUF2QjtBQUNBMEcsY0FBUXZCLE1BQVIsQ0FBZWxGLE9BQWYsR0FBeUIsY0FBekI7QUFDQXBDLGtCQUFZaUosT0FBWixDQUFvQkosT0FBcEIsRUFBNkIsUUFBN0IsRUFDR0ssSUFESCxDQUNRLGdCQUFRO0FBQ1pMLGdCQUFRSCxPQUFSLEdBQWtCLEVBQWxCO0FBQ0FHLGdCQUFRdkIsTUFBUixDQUFlbEYsT0FBZixHQUF5QixrREFBekI7QUFDRCxPQUpILEVBS0dxSCxLQUxILENBS1MsZUFBTztBQUNaLFlBQUdDLE9BQU9BLElBQUlwQyxNQUFKLElBQWMsQ0FBQyxDQUF6QixFQUEyQjtBQUN6QnVCLGtCQUFRdkIsTUFBUixDQUFlcUIsRUFBZixHQUFvQixFQUFwQjtBQUNBRSxrQkFBUXZCLE1BQVIsQ0FBZWxGLE9BQWYsR0FBeUIsRUFBekI7QUFDQSxjQUFHSixJQUFJMEcsT0FBSixHQUFjLEdBQWpCLEVBQ0VHLFFBQVF2QixNQUFSLENBQWVuRixLQUFmLEdBQXVCLDJCQUF2QixDQURGLEtBR0UwRyxRQUFRdkIsTUFBUixDQUFlbkYsS0FBZixHQUF1QixtQkFBdkI7QUFDSDtBQUNGLE9BZEg7QUFlRDtBQXRGZSxHQUFsQjs7QUF5RkEzQyxTQUFPb0ssTUFBUCxHQUFnQjtBQUNkQyxXQUFPLGlCQUFNO0FBQ1hySyxhQUFPdUYsUUFBUCxDQUFnQjZFLE1BQWhCLENBQXVCdEMsTUFBdkIsR0FBZ0MsWUFBaEM7QUFDQXRILGtCQUFZNEosTUFBWixHQUFxQkMsS0FBckIsQ0FBMkJySyxPQUFPdUYsUUFBUCxDQUFnQjZFLE1BQWhCLENBQXVCRSxJQUFsRCxFQUF1RHRLLE9BQU91RixRQUFQLENBQWdCNkUsTUFBaEIsQ0FBdUJHLElBQTlFLEVBQ0diLElBREgsQ0FDUSxvQkFBWTtBQUNoQixZQUFHYyxTQUFTQyxLQUFaLEVBQWtCO0FBQ2hCekssaUJBQU91RixRQUFQLENBQWdCNkUsTUFBaEIsQ0FBdUJ0QyxNQUF2QixHQUFnQyxXQUFoQztBQUNBOUgsaUJBQU91RixRQUFQLENBQWdCNkUsTUFBaEIsQ0FBdUJLLEtBQXZCLEdBQStCRCxTQUFTQyxLQUF4QztBQUNBekssaUJBQU9vSyxNQUFQLENBQWNNLElBQWQsQ0FBbUJGLFNBQVNDLEtBQTVCO0FBQ0Q7QUFDRixPQVBILEVBUUdSLEtBUkgsQ0FRUyxlQUFPO0FBQ1pqSyxlQUFPdUYsUUFBUCxDQUFnQjZFLE1BQWhCLENBQXVCdEMsTUFBdkIsR0FBZ0MsbUJBQWhDO0FBQ0E5SCxlQUFPMkssZUFBUCxDQUF1QlQsSUFBSVUsR0FBSixJQUFXVixHQUFsQztBQUNELE9BWEg7QUFZRCxLQWZhO0FBZ0JkUSxVQUFNLGNBQUNELEtBQUQsRUFBVztBQUNmekssYUFBT3VGLFFBQVAsQ0FBZ0I2RSxNQUFoQixDQUF1QlMsS0FBdkIsR0FBK0IsRUFBL0I7QUFDQTdLLGFBQU91RixRQUFQLENBQWdCNkUsTUFBaEIsQ0FBdUJ0QyxNQUF2QixHQUFnQyxVQUFoQztBQUNBdEgsa0JBQVk0SixNQUFaLEdBQXFCTSxJQUFyQixDQUEwQkQsS0FBMUIsRUFBaUNmLElBQWpDLENBQXNDLG9CQUFZO0FBQ2hELFlBQUdjLFNBQVNNLFVBQVosRUFBdUI7QUFDckI5SyxpQkFBT3VGLFFBQVAsQ0FBZ0I2RSxNQUFoQixDQUF1QnRDLE1BQXZCLEdBQWdDLFdBQWhDO0FBQ0E5SCxpQkFBT3VGLFFBQVAsQ0FBZ0I2RSxNQUFoQixDQUF1QlMsS0FBdkIsR0FBK0JMLFNBQVNNLFVBQXhDO0FBQ0E7QUFDQTdGLFlBQUVtRSxJQUFGLENBQU9wSixPQUFPdUYsUUFBUCxDQUFnQjZFLE1BQWhCLENBQXVCUyxLQUE5QixFQUFxQyxnQkFBUTtBQUMzQyxnQkFBRyxDQUFDLENBQUNFLEtBQUtqRCxNQUFWLEVBQWlCO0FBQ2Z0SCwwQkFBWTRKLE1BQVosR0FBcUJULElBQXJCLENBQTBCb0IsSUFBMUIsRUFBZ0NyQixJQUFoQyxDQUFxQyxnQkFBUTtBQUMzQyxvQkFBR0MsUUFBUUEsS0FBS3FCLFlBQWhCLEVBQTZCO0FBQzNCRCx1QkFBS3BCLElBQUwsR0FBWXNCLEtBQUtDLEtBQUwsQ0FBV3ZCLEtBQUtxQixZQUFoQixFQUE4QkcsTUFBOUIsQ0FBcUNDLFdBQWpEO0FBQ0Esc0JBQUdILEtBQUtDLEtBQUwsQ0FBV3ZCLEtBQUtxQixZQUFoQixFQUE4QkssTUFBOUIsQ0FBcUNDLFlBQXJDLENBQWtEQyxRQUFsRCxJQUE4RCxDQUFqRSxFQUFtRTtBQUNqRVIseUJBQUtTLEtBQUwsR0FBYVAsS0FBS0MsS0FBTCxDQUFXdkIsS0FBS3FCLFlBQWhCLEVBQThCSyxNQUE5QixDQUFxQ0MsWUFBbEQ7QUFDRCxtQkFGRCxNQUVPO0FBQ0xQLHlCQUFLUyxLQUFMLEdBQWEsSUFBYjtBQUNEO0FBQ0Y7QUFDRixlQVREO0FBVUQ7QUFDRixXQWJEO0FBY0Q7QUFDRixPQXBCRDtBQXFCRCxLQXhDYTtBQXlDZDdCLFVBQU0sY0FBQzhCLE1BQUQsRUFBWTtBQUNoQmpMLGtCQUFZNEosTUFBWixHQUFxQlQsSUFBckIsQ0FBMEI4QixNQUExQixFQUFrQy9CLElBQWxDLENBQXVDLG9CQUFZO0FBQ2pELGVBQU9jLFFBQVA7QUFDRCxPQUZEO0FBR0QsS0E3Q2E7QUE4Q2RrQixZQUFRLGdCQUFDRCxNQUFELEVBQVk7QUFDbEIsVUFBSUUsVUFBVUYsT0FBTzlCLElBQVAsQ0FBWWlDLFdBQVosSUFBMkIsQ0FBM0IsR0FBK0IsQ0FBL0IsR0FBbUMsQ0FBakQ7QUFDQXBMLGtCQUFZNEosTUFBWixHQUFxQnNCLE1BQXJCLENBQTRCRCxNQUE1QixFQUFvQ0UsT0FBcEMsRUFBNkNqQyxJQUE3QyxDQUFrRCxvQkFBWTtBQUM1RCtCLGVBQU85QixJQUFQLENBQVlpQyxXQUFaLEdBQTBCRCxPQUExQjtBQUNBLGVBQU9uQixRQUFQO0FBQ0QsT0FIRCxFQUdHZCxJQUhILENBR1EsMEJBQWtCO0FBQ3hCdkosaUJBQVMsWUFBTTtBQUNiO0FBQ0EsaUJBQU9LLFlBQVk0SixNQUFaLEdBQXFCVCxJQUFyQixDQUEwQjhCLE1BQTFCLEVBQWtDL0IsSUFBbEMsQ0FBdUMsZ0JBQVE7QUFDcEQsZ0JBQUdDLFFBQVFBLEtBQUtxQixZQUFoQixFQUE2QjtBQUMzQlMscUJBQU85QixJQUFQLEdBQWNzQixLQUFLQyxLQUFMLENBQVd2QixLQUFLcUIsWUFBaEIsRUFBOEJHLE1BQTlCLENBQXFDQyxXQUFuRDtBQUNBLGtCQUFHSCxLQUFLQyxLQUFMLENBQVd2QixLQUFLcUIsWUFBaEIsRUFBOEJLLE1BQTlCLENBQXFDQyxZQUFyQyxDQUFrREMsUUFBbEQsSUFBOEQsQ0FBakUsRUFBbUU7QUFDakVFLHVCQUFPRCxLQUFQLEdBQWVQLEtBQUtDLEtBQUwsQ0FBV3ZCLEtBQUtxQixZQUFoQixFQUE4QkssTUFBOUIsQ0FBcUNDLFlBQXBEO0FBQ0QsZUFGRCxNQUVPO0FBQ0xHLHVCQUFPRCxLQUFQLEdBQWUsSUFBZjtBQUNEO0FBQ0QscUJBQU9DLE1BQVA7QUFDRDtBQUNELG1CQUFPQSxNQUFQO0FBQ0QsV0FYTSxDQUFQO0FBWUQsU0FkRCxFQWNHLElBZEg7QUFlRCxPQW5CRDtBQW9CRDtBQXBFYSxHQUFoQjs7QUF1RUF6TCxTQUFPNkwsU0FBUCxHQUFtQixVQUFTL0osSUFBVCxFQUFjO0FBQy9CLFFBQUcsQ0FBQzlCLE9BQU82RCxPQUFYLEVBQW9CN0QsT0FBTzZELE9BQVAsR0FBaUIsRUFBakI7QUFDcEIsUUFBSXdGLFVBQVVySixPQUFPdUYsUUFBUCxDQUFnQitDLFFBQWhCLENBQXlCaEQsTUFBekIsR0FBa0N0RixPQUFPdUYsUUFBUCxDQUFnQitDLFFBQWhCLENBQXlCLENBQXpCLENBQWxDLEdBQWdFLEVBQUM3RCxJQUFJLFdBQVNrRSxLQUFLLFdBQUwsQ0FBZCxFQUFnQy9JLEtBQUksZUFBcEMsRUFBb0RrSixRQUFPLENBQTNELEVBQTZEQyxTQUFRLEVBQXJFLEVBQXdFQyxLQUFJLENBQTVFLEVBQThFQyxRQUFPLEtBQXJGLEVBQTlFO0FBQ0FqSixXQUFPNkQsT0FBUCxDQUFlNkUsSUFBZixDQUFvQjtBQUNoQnZILFlBQU1XLE9BQU9tRCxFQUFFNkcsSUFBRixDQUFPOUwsT0FBT3lDLFdBQWQsRUFBMEIsRUFBQ1gsTUFBTUEsSUFBUCxFQUExQixFQUF3Q1gsSUFBL0MsR0FBc0RuQixPQUFPeUMsV0FBUCxDQUFtQixDQUFuQixFQUFzQnRCLElBRGxFO0FBRWZzRCxVQUFJLElBRlc7QUFHZjNDLFlBQU1BLFFBQVE5QixPQUFPeUMsV0FBUCxDQUFtQixDQUFuQixFQUFzQlgsSUFIckI7QUFJZm1DLGNBQVEsS0FKTztBQUtmOEgsY0FBUSxLQUxPO0FBTWZqSSxjQUFRLEVBQUNrSSxLQUFJLElBQUwsRUFBVTdILFNBQVEsS0FBbEIsRUFBd0I4SCxNQUFLLEtBQTdCLEVBQW1DL0gsS0FBSSxLQUF2QyxFQUE2Q2dJLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFOTztBQU9mbkksWUFBTSxFQUFDZ0ksS0FBSSxJQUFMLEVBQVU3SCxTQUFRLEtBQWxCLEVBQXdCOEgsTUFBSyxLQUE3QixFQUFtQy9ILEtBQUksS0FBdkMsRUFBNkNnSSxXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBUFM7QUFRZkMsWUFBTSxFQUFDSixLQUFJLElBQUwsRUFBVUssS0FBSSxFQUFkLEVBQWlCL0gsT0FBTSxFQUF2QixFQUEwQnhDLE1BQUssWUFBL0IsRUFBNENrSCxLQUFJLEtBQWhELEVBQXNEc0QsS0FBSSxLQUExRCxFQUFnRXBMLFNBQVEsQ0FBeEUsRUFBMEVxTCxVQUFTLENBQW5GLEVBQXFGQyxVQUFTLENBQTlGLEVBQWdHQyxRQUFPLENBQXZHLEVBQXlHN0wsUUFBT1osT0FBT3lDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0I3QixNQUF0SSxFQUE2SThMLE1BQUsxTSxPQUFPeUMsV0FBUCxDQUFtQixDQUFuQixFQUFzQmlLLElBQXhLLEVBQTZLQyxLQUFJLENBQWpMLEVBQW1MQyxPQUFNLENBQXpMLEVBUlM7QUFTZkMsY0FBUSxFQVRPO0FBVWZDLGNBQVEsRUFWTztBQVdmQyxZQUFNaE4sUUFBUWlOLElBQVIsQ0FBYXhNLFlBQVl5TSxrQkFBWixFQUFiLEVBQThDLEVBQUM3SixPQUFNLENBQVAsRUFBU04sS0FBSSxDQUFiLEVBQWVvSyxLQUFJbE4sT0FBT3lDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0I3QixNQUF0QixHQUE2QlosT0FBT3lDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0JpSyxJQUF0RSxFQUE5QyxDQVhTO0FBWWZyRCxlQUFTQSxPQVpNO0FBYWZ6RyxlQUFTLEVBQUNkLE1BQUssT0FBTixFQUFjYyxTQUFRLEVBQXRCLEVBQXlCc0csU0FBUSxFQUFqQyxFQUFvQ2lFLE9BQU0sQ0FBMUMsRUFBNENuTSxVQUFTLEVBQXJELEVBYk07QUFjZm9NLGNBQVEsRUFBQ0MsT0FBTyxLQUFSLEVBQWVDLE9BQU8sS0FBdEIsRUFBNkJ4SCxTQUFTLEtBQXRDO0FBZE8sS0FBcEI7QUFnQkQsR0FuQkQ7O0FBcUJBOUYsU0FBT3VOLGdCQUFQLEdBQTBCLFVBQVN6TCxJQUFULEVBQWM7QUFDdEMsV0FBT21ELEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU82RCxPQUFoQixFQUF5QixFQUFDLFVBQVUsSUFBWCxFQUF6QixFQUEyQ3lCLE1BQWxEO0FBQ0QsR0FGRDs7QUFJQXRGLFNBQU93TixXQUFQLEdBQXFCLFVBQVMxTCxJQUFULEVBQWM7QUFDakMsV0FBT21ELEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU82RCxPQUFoQixFQUF5QixFQUFDLFFBQVEvQixJQUFULEVBQXpCLEVBQXlDd0QsTUFBaEQ7QUFDRCxHQUZEOztBQUlBdEYsU0FBT3lOLGFBQVAsR0FBdUIsWUFBVTtBQUMvQixXQUFPeEksRUFBRUMsTUFBRixDQUFTbEYsT0FBTzZELE9BQWhCLEVBQXdCLEVBQUMsVUFBVSxJQUFYLEVBQXhCLEVBQTBDeUIsTUFBakQ7QUFDRCxHQUZEOztBQUlBdEYsU0FBTzBOLFVBQVAsR0FBb0IsVUFBU3JFLE9BQVQsRUFBa0IyQyxHQUFsQixFQUFzQjtBQUN0QyxRQUFJQSxJQUFJbkgsT0FBSixDQUFZLEtBQVosTUFBcUIsQ0FBekIsRUFBNEI7QUFDMUIsVUFBSTRHLFNBQVN4RyxFQUFFQyxNQUFGLENBQVNsRixPQUFPdUYsUUFBUCxDQUFnQjZFLE1BQWhCLENBQXVCUyxLQUFoQyxFQUFzQyxFQUFDOEMsVUFBVTNCLElBQUk0QixNQUFKLENBQVcsQ0FBWCxDQUFYLEVBQXRDLEVBQWlFLENBQWpFLENBQWI7QUFDQSxhQUFPbkMsU0FBU0EsT0FBT29DLEtBQWhCLEdBQXdCLEVBQS9CO0FBQ0QsS0FIRCxNQUdPLElBQUdyTixZQUFZc04sS0FBWixDQUFrQnpFLE9BQWxCLENBQUgsRUFBOEI7QUFDbkMsVUFBRzdJLFlBQVlzTixLQUFaLENBQWtCekUsT0FBbEIsRUFBMkIsSUFBM0IsS0FBb0MsTUFBdkMsRUFDRSxPQUFPMkMsSUFBSXBILE9BQUosQ0FBWSxHQUFaLEVBQWdCLE1BQWhCLENBQVAsQ0FERixLQUdFLE9BQU9vSCxJQUFJcEgsT0FBSixDQUFZLEdBQVosRUFBZ0IsTUFBaEIsRUFBd0JBLE9BQXhCLENBQWdDLEdBQWhDLEVBQW9DLE1BQXBDLENBQVA7QUFDSCxLQUxNLE1BS0E7QUFDTCxhQUFPb0gsR0FBUDtBQUNEO0FBQ0osR0FaRDs7QUFjQWhNLFNBQU8rTixRQUFQLEdBQWtCLFVBQVMvQixHQUFULEVBQWFnQyxTQUFiLEVBQXVCO0FBQ3ZDLFFBQUl0SyxTQUFTdUIsRUFBRTZHLElBQUYsQ0FBTzlMLE9BQU82RCxPQUFkLEVBQXVCLFVBQVNILE1BQVQsRUFBZ0I7QUFDbEQsYUFDR0EsT0FBTzJGLE9BQVAsQ0FBZTVFLEVBQWYsSUFBbUJ1SixTQUFwQixLQUVHdEssT0FBTzBJLElBQVAsQ0FBWUosR0FBWixJQUFpQkEsR0FBbEIsSUFDQ3RJLE9BQU8wSSxJQUFQLENBQVlDLEdBQVosSUFBaUJMLEdBRGxCLElBRUN0SSxPQUFPSSxNQUFQLENBQWNrSSxHQUFkLElBQW1CQSxHQUZwQixJQUdDdEksT0FBT0ssTUFBUCxJQUFpQkwsT0FBT0ssTUFBUCxDQUFjaUksR0FBZCxJQUFtQkEsR0FIckMsSUFJQyxDQUFDdEksT0FBT0ssTUFBUixJQUFrQkwsT0FBT00sSUFBUCxDQUFZZ0ksR0FBWixJQUFpQkEsR0FOdEMsQ0FERjtBQVVELEtBWFksQ0FBYjtBQVlBLFdBQU90SSxVQUFVLEtBQWpCO0FBQ0QsR0FkRDs7QUFnQkExRCxTQUFPaU8sWUFBUCxHQUFzQixVQUFTdkssTUFBVCxFQUFnQjtBQUNwQyxRQUFHLENBQUMsQ0FBQ2xELFlBQVkwTixXQUFaLENBQXdCeEssT0FBTzBJLElBQVAsQ0FBWXRLLElBQXBDLEVBQTBDcU0sT0FBL0MsRUFBdUQ7QUFDckR6SyxhQUFPcUosSUFBUCxDQUFZcEgsSUFBWixHQUFtQixHQUFuQjtBQUNELEtBRkQsTUFFTztBQUNMakMsYUFBT3FKLElBQVAsQ0FBWXBILElBQVosR0FBbUIsTUFBbkI7QUFDRDtBQUNEakMsV0FBTzBJLElBQVAsQ0FBWUMsR0FBWixHQUFrQixFQUFsQjtBQUNBM0ksV0FBTzBJLElBQVAsQ0FBWTlILEtBQVosR0FBb0IsRUFBcEI7QUFDRCxHQVJEOztBQVVBdEUsU0FBT29PLFdBQVAsR0FBcUIsWUFBVTtBQUM3QixRQUFHLENBQUNwTyxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCdUgsTUFBdkIsQ0FBOEJsTixJQUEvQixJQUF1QyxDQUFDbkIsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QnVILE1BQXZCLENBQThCQyxLQUF6RSxFQUNFO0FBQ0Z0TyxXQUFPdU8sWUFBUCxHQUFzQix3QkFBdEI7QUFDQSxXQUFPL04sWUFBWTROLFdBQVosQ0FBd0JwTyxPQUFPZ0csS0FBL0IsRUFDSjBELElBREksQ0FDQyxVQUFTYyxRQUFULEVBQW1CO0FBQ3ZCLFVBQUdBLFNBQVN4RSxLQUFULElBQWtCd0UsU0FBU3hFLEtBQVQsQ0FBZXBHLEdBQXBDLEVBQXdDO0FBQ3RDSSxlQUFPdU8sWUFBUCxHQUFzQixFQUF0QjtBQUNBdk8sZUFBT3dPLGFBQVAsR0FBdUIsSUFBdkI7QUFDQXhPLGVBQU95TyxVQUFQLEdBQW9CakUsU0FBU3hFLEtBQVQsQ0FBZXBHLEdBQW5DO0FBQ0QsT0FKRCxNQUlPO0FBQ0xJLGVBQU93TyxhQUFQLEdBQXVCLEtBQXZCO0FBQ0Q7QUFDRGhPLGtCQUFZK0UsUUFBWixDQUFxQixPQUFyQixFQUE2QnZGLE9BQU9nRyxLQUFwQztBQUNELEtBVkksRUFXSmlFLEtBWEksQ0FXRSxlQUFPO0FBQ1pqSyxhQUFPdU8sWUFBUCxHQUFzQnJFLEdBQXRCO0FBQ0FsSyxhQUFPd08sYUFBUCxHQUF1QixLQUF2QjtBQUNBaE8sa0JBQVkrRSxRQUFaLENBQXFCLE9BQXJCLEVBQTZCdkYsT0FBT2dHLEtBQXBDO0FBQ0QsS0FmSSxDQUFQO0FBZ0JELEdBcEJEOztBQXNCQWhHLFNBQU8wTyxTQUFQLEdBQW1CLFVBQVNyRixPQUFULEVBQWlCO0FBQ2xDQSxZQUFRc0YsT0FBUixHQUFrQixJQUFsQjtBQUNBbk8sZ0JBQVlrTyxTQUFaLENBQXNCckYsT0FBdEIsRUFDR0ssSUFESCxDQUNRLG9CQUFZO0FBQ2hCTCxjQUFRc0YsT0FBUixHQUFrQixLQUFsQjtBQUNBLFVBQUduRSxTQUFTb0UsU0FBVCxJQUFzQixHQUF6QixFQUNFdkYsUUFBUXdGLE1BQVIsR0FBaUIsSUFBakIsQ0FERixLQUdFeEYsUUFBUXdGLE1BQVIsR0FBaUIsS0FBakI7QUFDSCxLQVBILEVBUUc1RSxLQVJILENBUVMsZUFBTztBQUNaWixjQUFRc0YsT0FBUixHQUFrQixLQUFsQjtBQUNBdEYsY0FBUXdGLE1BQVIsR0FBaUIsS0FBakI7QUFDRCxLQVhIO0FBWUQsR0FkRDs7QUFnQkE3TyxTQUFPOE8sUUFBUCxHQUFrQjtBQUNoQkMscUJBQWlCLDJCQUFNO0FBQ3JCLGFBQU92TyxZQUFZc08sUUFBWixHQUF1QkUsTUFBdkIsQ0FBOEJoUCxPQUFPdUYsUUFBUCxDQUFnQnVKLFFBQWhCLENBQXlCbFAsR0FBdkQsQ0FBUDtBQUNELEtBSGU7QUFJaEJxUCxZQUFRLGtCQUFNO0FBQ1osVUFBSUMsa0JBQWtCMU8sWUFBWWdGLEtBQVosRUFBdEI7QUFDQXhGLGFBQU91RixRQUFQLENBQWdCdUosUUFBaEIsR0FBMkJJLGdCQUFnQkosUUFBM0M7QUFDRCxLQVBlO0FBUWhCckYsYUFBUyxtQkFBTTtBQUNiekosYUFBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5QmhILE1BQXpCLEdBQWtDLFlBQWxDO0FBQ0F0SCxrQkFBWXNPLFFBQVosR0FBdUJLLElBQXZCLENBQTRCblAsT0FBT3VGLFFBQVAsQ0FBZ0J1SixRQUE1QyxFQUNHcEYsSUFESCxDQUNRLG9CQUFZO0FBQ2hCLFlBQUdjLFNBQVMxQyxNQUFULElBQW1CLEdBQW5CLElBQTBCMEMsU0FBUzFDLE1BQVQsSUFBbUIsR0FBaEQsRUFBb0Q7QUFDbER0QixZQUFFLGNBQUYsRUFBa0I0SSxXQUFsQixDQUE4QixZQUE5QjtBQUNBcFAsaUJBQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJoSCxNQUF6QixHQUFrQyxXQUFsQztBQUNBLGNBQUc5SCxPQUFPOE8sUUFBUCxDQUFnQkMsZUFBaEIsRUFBSCxFQUFxQztBQUNuQy9PLG1CQUFPdUYsUUFBUCxDQUFnQnVKLFFBQWhCLENBQXlCTyxFQUF6QixHQUE4QnJQLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJ4RSxJQUF2RDtBQUNELFdBRkQsTUFFTztBQUNMO0FBQ0E5Six3QkFBWXNPLFFBQVosR0FBdUJRLEdBQXZCLEdBQ0M1RixJQURELENBQ00sb0JBQVk7QUFDaEIsa0JBQUdjLFNBQVNsRixNQUFaLEVBQW1CO0FBQ2pCLG9CQUFJZ0ssTUFBTSxHQUFHQyxNQUFILENBQVVDLEtBQVYsQ0FBZ0IsRUFBaEIsRUFBb0JoRixRQUFwQixDQUFWO0FBQ0F4Syx1QkFBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5QlEsR0FBekIsR0FBK0JySyxFQUFFZ0ssTUFBRixDQUFTSyxHQUFULEVBQWMsVUFBQ0QsRUFBRDtBQUFBLHlCQUFRQSxNQUFNLFdBQWQ7QUFBQSxpQkFBZCxDQUEvQjtBQUNEO0FBQ0YsYUFORDtBQU9EO0FBQ0YsU0FmRCxNQWVPO0FBQ0w3SSxZQUFFLGNBQUYsRUFBa0JpSixRQUFsQixDQUEyQixZQUEzQjtBQUNBelAsaUJBQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJoSCxNQUF6QixHQUFrQyxtQkFBbEM7QUFDRDtBQUNGLE9BckJILEVBc0JHbUMsS0F0QkgsQ0FzQlMsZUFBTztBQUNaekQsVUFBRSxjQUFGLEVBQWtCaUosUUFBbEIsQ0FBMkIsWUFBM0I7QUFDQXpQLGVBQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJoSCxNQUF6QixHQUFrQyxtQkFBbEM7QUFDRCxPQXpCSDtBQTBCRCxLQXBDZTtBQXFDaEI0SCxZQUFRLGtCQUFNO0FBQ1osVUFBSUwsS0FBS3JQLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJPLEVBQXpCLElBQStCLGFBQVdNLFNBQVNDLE1BQVQsQ0FBZ0IsWUFBaEIsQ0FBbkQ7QUFDQTVQLGFBQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJlLE9BQXpCLEdBQW1DLEtBQW5DO0FBQ0FyUCxrQkFBWXNPLFFBQVosR0FBdUJnQixRQUF2QixDQUFnQ1QsRUFBaEMsRUFDRzNGLElBREgsQ0FDUSxvQkFBWTtBQUNoQjtBQUNBLFlBQUdjLFNBQVN1RixJQUFULElBQWlCdkYsU0FBU3VGLElBQVQsQ0FBY0MsT0FBL0IsSUFBMEN4RixTQUFTdUYsSUFBVCxDQUFjQyxPQUFkLENBQXNCMUssTUFBbkUsRUFBMEU7QUFDeEV0RixpQkFBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5Qk8sRUFBekIsR0FBOEJBLEVBQTlCO0FBQ0FyUCxpQkFBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5QmUsT0FBekIsR0FBbUMsSUFBbkM7QUFDQXJKLFlBQUUsZUFBRixFQUFtQjRJLFdBQW5CLENBQStCLFlBQS9CO0FBQ0E1SSxZQUFFLGVBQUYsRUFBbUI0SSxXQUFuQixDQUErQixZQUEvQjtBQUNBcFAsaUJBQU9pUSxVQUFQO0FBQ0QsU0FORCxNQU1PO0FBQ0xqUSxpQkFBTzJLLGVBQVAsQ0FBdUIsa0RBQXZCO0FBQ0Q7QUFDRixPQVpILEVBYUdWLEtBYkgsQ0FhUyxlQUFPO0FBQ1osWUFBR0MsSUFBSXBDLE1BQUosS0FBZW9DLElBQUlwQyxNQUFKLElBQWMsR0FBZCxJQUFxQm9DLElBQUlwQyxNQUFKLElBQWMsR0FBbEQsQ0FBSCxFQUEwRDtBQUN4RHRCLFlBQUUsZUFBRixFQUFtQmlKLFFBQW5CLENBQTRCLFlBQTVCO0FBQ0FqSixZQUFFLGVBQUYsRUFBbUJpSixRQUFuQixDQUE0QixZQUE1QjtBQUNBelAsaUJBQU8ySyxlQUFQLENBQXVCLCtDQUF2QjtBQUNELFNBSkQsTUFJTyxJQUFHVCxHQUFILEVBQU87QUFDWmxLLGlCQUFPMkssZUFBUCxDQUF1QlQsR0FBdkI7QUFDRCxTQUZNLE1BRUE7QUFDTGxLLGlCQUFPMkssZUFBUCxDQUF1QixrREFBdkI7QUFDRDtBQUNGLE9BdkJIO0FBd0JBO0FBaEVjLEdBQWxCOztBQW1FQTNLLFNBQU84RixPQUFQLEdBQWlCO0FBQ2ZvSyxlQUFXLHFCQUFNO0FBQ2YsYUFBUSxDQUFDLENBQUNsUSxPQUFPdUYsUUFBUCxDQUFnQk8sT0FBaEIsQ0FBd0JxSyxRQUExQixJQUNOLENBQUMsQ0FBQ25RLE9BQU91RixRQUFQLENBQWdCTyxPQUFoQixDQUF3QnNLLE9BRHBCLElBRU5wUSxPQUFPdUYsUUFBUCxDQUFnQk8sT0FBaEIsQ0FBd0JnQyxNQUF4QixJQUFrQyxXQUZwQztBQUlELEtBTmM7QUFPZm1ILFlBQVEsa0JBQU07QUFDWixVQUFJQyxrQkFBa0IxTyxZQUFZZ0YsS0FBWixFQUF0QjtBQUNBeEYsYUFBT3VGLFFBQVAsQ0FBZ0JPLE9BQWhCLEdBQTBCb0osZ0JBQWdCcEosT0FBMUM7QUFDQWIsUUFBRW1FLElBQUYsQ0FBT3BKLE9BQU82RCxPQUFkLEVBQXVCLGtCQUFVO0FBQy9CSCxlQUFPMEosTUFBUCxDQUFjdEgsT0FBZCxHQUF3QixLQUF4QjtBQUNELE9BRkQ7QUFHRCxLQWJjO0FBY2YyRCxhQUFTLG1CQUFNO0FBQ2IsVUFBRyxDQUFDekosT0FBT3VGLFFBQVAsQ0FBZ0JPLE9BQWhCLENBQXdCcUssUUFBekIsSUFBcUMsQ0FBQ25RLE9BQU91RixRQUFQLENBQWdCTyxPQUFoQixDQUF3QnNLLE9BQWpFLEVBQ0U7QUFDRnBRLGFBQU91RixRQUFQLENBQWdCTyxPQUFoQixDQUF3QmdDLE1BQXhCLEdBQWlDLFlBQWpDO0FBQ0EsYUFBT3RILFlBQVlzRixPQUFaLEdBQXNCdUssSUFBdEIsQ0FBMkIsSUFBM0IsRUFDSjNHLElBREksQ0FDQyxvQkFBWTtBQUNoQjFKLGVBQU91RixRQUFQLENBQWdCTyxPQUFoQixDQUF3QmdDLE1BQXhCLEdBQWlDLFdBQWpDO0FBQ0QsT0FISSxFQUlKbUMsS0FKSSxDQUlFLGVBQU87QUFDWmpLLGVBQU91RixRQUFQLENBQWdCTyxPQUFoQixDQUF3QmdDLE1BQXhCLEdBQWlDLG1CQUFqQztBQUNELE9BTkksQ0FBUDtBQU9ELEtBekJjO0FBMEJmakUsYUFBUyxpQkFBQ0gsTUFBRCxFQUFTNE0sS0FBVCxFQUFtQjtBQUMxQixVQUFHQSxLQUFILEVBQVM7QUFDUDVNLGVBQU80TSxLQUFQLEVBQWNuRSxNQUFkLEdBQXVCLENBQUN6SSxPQUFPNE0sS0FBUCxFQUFjbkUsTUFBdEM7QUFDQSxZQUFHLENBQUN6SSxPQUFPMEosTUFBUCxDQUFjdEgsT0FBbEIsRUFDRTtBQUNIO0FBQ0RwQyxhQUFPZCxPQUFQLENBQWU1QixRQUFmLEdBQTBCLFVBQTFCO0FBQ0EwQyxhQUFPZCxPQUFQLENBQWVkLElBQWYsR0FBc0IsTUFBdEI7QUFDQTRCLGFBQU9kLE9BQVAsQ0FBZWtGLE1BQWYsR0FBd0IsQ0FBeEI7QUFDQSxhQUFPdEgsWUFBWXNGLE9BQVosR0FBc0JqQyxPQUF0QixDQUE4QjBNLElBQTlCLENBQW1DN00sTUFBbkMsRUFDSmdHLElBREksQ0FDQyxvQkFBWTtBQUNoQixZQUFJOEcsaUJBQWlCaEcsU0FBUzlHLE1BQTlCO0FBQ0E7QUFDQUEsZUFBT2UsRUFBUCxHQUFZK0wsZUFBZS9MLEVBQTNCO0FBQ0E7QUFDQVEsVUFBRW1FLElBQUYsQ0FBT3BKLE9BQU91RixRQUFQLENBQWdCK0MsUUFBdkIsRUFBaUMsbUJBQVc7QUFDMUMsY0FBR2UsUUFBUTVFLEVBQVIsSUFBY2YsT0FBTzJGLE9BQVAsQ0FBZTVFLEVBQWhDLEVBQ0U0RSxRQUFRNUUsRUFBUixHQUFhK0wsZUFBZTdDLFFBQTVCO0FBQ0gsU0FIRDtBQUlBakssZUFBTzJGLE9BQVAsQ0FBZTVFLEVBQWYsR0FBb0IrTCxlQUFlN0MsUUFBbkM7QUFDQTtBQUNBMUksVUFBRXdMLEtBQUYsQ0FBUXpRLE9BQU91RixRQUFQLENBQWdCTyxPQUFoQixDQUF3QkQsT0FBaEMsRUFBeUMySyxlQUFlM0ssT0FBeEQ7O0FBRUFuQyxlQUFPZCxPQUFQLENBQWVkLElBQWYsR0FBc0IsU0FBdEI7QUFDQTRCLGVBQU9kLE9BQVAsQ0FBZWtGLE1BQWYsR0FBd0IsQ0FBeEI7QUFDRCxPQWhCSSxFQWlCSm1DLEtBakJJLENBaUJFLGVBQU87QUFDWnZHLGVBQU8wSixNQUFQLENBQWN0SCxPQUFkLEdBQXdCLENBQUNwQyxPQUFPMEosTUFBUCxDQUFjdEgsT0FBdkM7QUFDQXBDLGVBQU9kLE9BQVAsQ0FBZWtGLE1BQWYsR0FBd0IsQ0FBeEI7QUFDQSxZQUFHb0MsT0FBT0EsSUFBSTZGLElBQVgsSUFBbUI3RixJQUFJNkYsSUFBSixDQUFTcE4sS0FBNUIsSUFBcUN1SCxJQUFJNkYsSUFBSixDQUFTcE4sS0FBVCxDQUFlQyxPQUF2RCxFQUErRDtBQUM3RDVDLGlCQUFPMkssZUFBUCxDQUF1QlQsSUFBSTZGLElBQUosQ0FBU3BOLEtBQVQsQ0FBZUMsT0FBdEMsRUFBK0NjLE1BQS9DO0FBQ0FnTixrQkFBUS9OLEtBQVIsQ0FBYyx5QkFBZCxFQUF5Q3VILEdBQXpDO0FBQ0Q7QUFDRixPQXhCSSxDQUFQO0FBeUJELEtBNURjO0FBNkRmeUcsY0FBVTtBQUNSSixZQUFNLGdCQUFNO0FBQ1YsZUFBTy9QLFlBQVlzRixPQUFaLEdBQXNCNkssUUFBdEIsQ0FBK0JKLElBQS9CLENBQW9DdlEsT0FBT3VGLFFBQVAsQ0FBZ0JPLE9BQWhCLENBQXdCRCxPQUE1RCxFQUNKNkQsSUFESSxDQUNDLG9CQUFZLENBRWpCLENBSEksQ0FBUDtBQUlEO0FBTk87QUE3REssR0FBakI7O0FBdUVBMUosU0FBTzRRLFdBQVAsR0FBcUIsVUFBU3ZLLE1BQVQsRUFBZ0I7QUFDakMsUUFBR3JHLE9BQU91RixRQUFQLENBQWdCRSxPQUFoQixDQUF3Qm9MLE1BQTNCLEVBQWtDO0FBQ2hDLFVBQUd4SyxNQUFILEVBQVU7QUFDUixZQUFHQSxVQUFVLE9BQWIsRUFBcUI7QUFDbkIsaUJBQU8sQ0FBQyxDQUFFdEYsT0FBTytQLFlBQWpCO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sQ0FBQyxFQUFFOVEsT0FBT2dHLEtBQVAsQ0FBYUssTUFBYixJQUF1QnJHLE9BQU9nRyxLQUFQLENBQWFLLE1BQWIsS0FBd0JBLE1BQWpELENBQVI7QUFDRDtBQUNGO0FBQ0QsYUFBTyxJQUFQO0FBQ0QsS0FURCxNQVNPLElBQUdBLFVBQVVBLFVBQVUsT0FBdkIsRUFBK0I7QUFDcEMsYUFBTyxDQUFDLENBQUV0RixPQUFPK1AsWUFBakI7QUFDRDtBQUNELFdBQU8sSUFBUDtBQUNILEdBZEQ7O0FBZ0JBOVEsU0FBTytRLGFBQVAsR0FBdUIsWUFBVTtBQUMvQnZRLGdCQUFZTSxLQUFaO0FBQ0FkLFdBQU91RixRQUFQLEdBQWtCL0UsWUFBWWdGLEtBQVosRUFBbEI7QUFDQXhGLFdBQU91RixRQUFQLENBQWdCRSxPQUFoQixDQUF3Qm9MLE1BQXhCLEdBQWlDLElBQWpDO0FBQ0EsV0FBT3JRLFlBQVl1USxhQUFaLENBQTBCL1EsT0FBT2dHLEtBQVAsQ0FBYUUsSUFBdkMsRUFBNkNsRyxPQUFPZ0csS0FBUCxDQUFhRyxRQUFiLElBQXlCLElBQXRFLEVBQ0p1RCxJQURJLENBQ0MsVUFBU3NILFFBQVQsRUFBbUI7QUFDdkIsVUFBR0EsUUFBSCxFQUFZO0FBQ1YsWUFBR0EsU0FBUzVLLFlBQVosRUFBeUI7QUFDdkJwRyxpQkFBT2dHLEtBQVAsQ0FBYUksWUFBYixHQUE0QixJQUE1QjtBQUNBLGNBQUc0SyxTQUFTekwsUUFBVCxDQUFrQnVCLE1BQXJCLEVBQTRCO0FBQzFCOUcsbUJBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsR0FBeUJrSyxTQUFTekwsUUFBVCxDQUFrQnVCLE1BQTNDO0FBQ0Q7QUFDRCxpQkFBTyxLQUFQO0FBQ0QsU0FORCxNQU1PO0FBQ0w5RyxpQkFBT2dHLEtBQVAsQ0FBYUksWUFBYixHQUE0QixLQUE1QjtBQUNBLGNBQUc0SyxTQUFTaEwsS0FBVCxJQUFrQmdMLFNBQVNoTCxLQUFULENBQWVLLE1BQXBDLEVBQTJDO0FBQ3pDckcsbUJBQU9nRyxLQUFQLENBQWFLLE1BQWIsR0FBc0IySyxTQUFTaEwsS0FBVCxDQUFlSyxNQUFyQztBQUNEO0FBQ0QsY0FBRzJLLFNBQVN6TCxRQUFaLEVBQXFCO0FBQ25CdkYsbUJBQU91RixRQUFQLEdBQWtCeUwsU0FBU3pMLFFBQTNCO0FBQ0F2RixtQkFBT3VGLFFBQVAsQ0FBZ0IwTCxhQUFoQixHQUFnQyxFQUFDQyxJQUFHLEtBQUosRUFBVXBFLFFBQU8sSUFBakIsRUFBc0JxRSxNQUFLLElBQTNCLEVBQWdDQyxLQUFJLElBQXBDLEVBQXlDeFEsUUFBTyxJQUFoRCxFQUFxRHlNLE9BQU0sRUFBM0QsRUFBOERnRSxNQUFLLEVBQW5FLEVBQWhDO0FBQ0Q7QUFDRCxjQUFHTCxTQUFTbk4sT0FBWixFQUFvQjtBQUNsQm9CLGNBQUVtRSxJQUFGLENBQU80SCxTQUFTbk4sT0FBaEIsRUFBeUIsa0JBQVU7QUFDakNILHFCQUFPcUosSUFBUCxHQUFjaE4sUUFBUWlOLElBQVIsQ0FBYXhNLFlBQVl5TSxrQkFBWixFQUFiLEVBQThDLEVBQUM3SixPQUFNLENBQVAsRUFBU04sS0FBSSxDQUFiLEVBQWVvSyxLQUFJLE1BQUksQ0FBdkIsRUFBeUJvRSxTQUFRLEVBQUNDLFNBQVMsSUFBVixFQUFlQyxNQUFNLGFBQXJCLEVBQW1DQyxPQUFPLE1BQTFDLEVBQWlEQyxNQUFNLE1BQXZELEVBQWpDLEVBQTlDLENBQWQ7QUFDQWhPLHFCQUFPbUosTUFBUCxHQUFnQixFQUFoQjtBQUNELGFBSEQ7QUFJQTdNLG1CQUFPNkQsT0FBUCxHQUFpQm1OLFNBQVNuTixPQUExQjtBQUNEO0FBQ0QsaUJBQU83RCxPQUFPMlIsWUFBUCxFQUFQO0FBQ0Q7QUFDRixPQXpCRCxNQXlCTztBQUNMLGVBQU8sS0FBUDtBQUNEO0FBQ0YsS0E5QkksRUErQkoxSCxLQS9CSSxDQStCRSxVQUFTQyxHQUFULEVBQWM7QUFDbkJsSyxhQUFPMkssZUFBUCxDQUF1Qix1REFBdkI7QUFDRCxLQWpDSSxDQUFQO0FBa0NELEdBdENEOztBQXdDQTNLLFNBQU80UixZQUFQLEdBQXNCLFVBQVNDLFlBQVQsRUFBc0JDLElBQXRCLEVBQTJCOztBQUU3QztBQUNBLFFBQUlDLG9CQUFvQnZSLFlBQVl3UixTQUFaLENBQXNCSCxZQUF0QixDQUF4QjtBQUNBLFFBQUlJLE9BQUo7QUFBQSxRQUFhbkwsU0FBUyxJQUF0Qjs7QUFFQSxRQUFHLENBQUMsQ0FBQ2lMLGlCQUFMLEVBQXVCO0FBQ3JCLFVBQUlHLE9BQU8sSUFBSUMsSUFBSixFQUFYO0FBQ0FGLGdCQUFVQyxLQUFLRSxZQUFMLENBQW1CTCxpQkFBbkIsQ0FBVjtBQUNEOztBQUVELFFBQUcsQ0FBQ0UsT0FBSixFQUNFLE9BQU9qUyxPQUFPcVMsY0FBUCxHQUF3QixLQUEvQjs7QUFFRixRQUFHUCxRQUFNLE1BQVQsRUFBZ0I7QUFDZCxVQUFHLENBQUMsQ0FBQ0csUUFBUUssT0FBVixJQUFxQixDQUFDLENBQUNMLFFBQVFLLE9BQVIsQ0FBZ0JDLElBQWhCLENBQXFCQyxNQUEvQyxFQUNFMUwsU0FBU21MLFFBQVFLLE9BQVIsQ0FBZ0JDLElBQWhCLENBQXFCQyxNQUE5QixDQURGLEtBRUssSUFBRyxDQUFDLENBQUNQLFFBQVFRLFVBQVYsSUFBd0IsQ0FBQyxDQUFDUixRQUFRUSxVQUFSLENBQW1CRixJQUFuQixDQUF3QkMsTUFBckQsRUFDSDFMLFNBQVNtTCxRQUFRUSxVQUFSLENBQW1CRixJQUFuQixDQUF3QkMsTUFBakM7QUFDRixVQUFHMUwsTUFBSCxFQUNFQSxTQUFTdEcsWUFBWWtTLGVBQVosQ0FBNEI1TCxNQUE1QixDQUFULENBREYsS0FHRSxPQUFPOUcsT0FBT3FTLGNBQVAsR0FBd0IsS0FBL0I7QUFDSCxLQVRELE1BU08sSUFBR1AsUUFBTSxLQUFULEVBQWU7QUFDcEIsVUFBRyxDQUFDLENBQUNHLFFBQVFVLE9BQVYsSUFBcUIsQ0FBQyxDQUFDVixRQUFRVSxPQUFSLENBQWdCQyxNQUExQyxFQUNFOUwsU0FBU21MLFFBQVFVLE9BQVIsQ0FBZ0JDLE1BQXpCO0FBQ0YsVUFBRzlMLE1BQUgsRUFDRUEsU0FBU3RHLFlBQVlxUyxhQUFaLENBQTBCL0wsTUFBMUIsQ0FBVCxDQURGLEtBR0UsT0FBTzlHLE9BQU9xUyxjQUFQLEdBQXdCLEtBQS9CO0FBQ0g7O0FBRUQsUUFBRyxDQUFDdkwsTUFBSixFQUNFLE9BQU85RyxPQUFPcVMsY0FBUCxHQUF3QixLQUEvQjs7QUFFRixRQUFHLENBQUMsQ0FBQ3ZMLE9BQU9JLEVBQVosRUFDRWxILE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJJLEVBQXZCLEdBQTRCSixPQUFPSSxFQUFuQztBQUNGLFFBQUcsQ0FBQyxDQUFDSixPQUFPSyxFQUFaLEVBQ0VuSCxPQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCSyxFQUF2QixHQUE0QkwsT0FBT0ssRUFBbkM7O0FBRUZuSCxXQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCM0YsSUFBdkIsR0FBOEIyRixPQUFPM0YsSUFBckM7QUFDQW5CLFdBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJnTSxRQUF2QixHQUFrQ2hNLE9BQU9nTSxRQUF6QztBQUNBOVMsV0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QkcsR0FBdkIsR0FBNkJILE9BQU9HLEdBQXBDO0FBQ0FqSCxXQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCaU0sR0FBdkIsR0FBNkJqTSxPQUFPaU0sR0FBcEM7QUFDQS9TLFdBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJrTSxJQUF2QixHQUE4QmxNLE9BQU9rTSxJQUFyQztBQUNBaFQsV0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QnVILE1BQXZCLEdBQWdDdkgsT0FBT3VILE1BQXZDOztBQUVBLFFBQUd2SCxPQUFPekUsTUFBUCxDQUFjaUQsTUFBakIsRUFBd0I7QUFDdEI7QUFDQXRGLGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJ6RSxNQUF2QixHQUFnQyxFQUFoQztBQUNBNEMsUUFBRW1FLElBQUYsQ0FBT3RDLE9BQU96RSxNQUFkLEVBQXFCLFVBQVM0USxLQUFULEVBQWU7QUFDbEMsWUFBR2pULE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJ6RSxNQUF2QixDQUE4QmlELE1BQTlCLElBQ0RMLEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUJ6RSxNQUFoQyxFQUF3QyxFQUFDbEIsTUFBTThSLE1BQU1DLEtBQWIsRUFBeEMsRUFBNkQ1TixNQUQvRCxFQUNzRTtBQUNwRUwsWUFBRUMsTUFBRixDQUFTbEYsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QnpFLE1BQWhDLEVBQXdDLEVBQUNsQixNQUFNOFIsTUFBTUMsS0FBYixFQUF4QyxFQUE2RCxDQUE3RCxFQUFnRUMsTUFBaEUsSUFBMEVwTyxXQUFXa08sTUFBTUUsTUFBakIsQ0FBMUU7QUFDRCxTQUhELE1BR087QUFDTG5ULGlCQUFPdUYsUUFBUCxDQUFnQnVCLE1BQWhCLENBQXVCekUsTUFBdkIsQ0FBOEJxRyxJQUE5QixDQUFtQztBQUNqQ3ZILGtCQUFNOFIsTUFBTUMsS0FEcUIsRUFDZEMsUUFBUXBPLFdBQVdrTyxNQUFNRSxNQUFqQjtBQURNLFdBQW5DO0FBR0Q7QUFDRixPQVREO0FBVUE7QUFDQSxVQUFJelAsU0FBU3VCLEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU82RCxPQUFoQixFQUF3QixFQUFDL0IsTUFBSyxPQUFOLEVBQXhCLEVBQXdDLENBQXhDLENBQWI7QUFDQSxVQUFHNEIsTUFBSCxFQUFXO0FBQ1RBLGVBQU9vSixNQUFQLEdBQWdCLEVBQWhCO0FBQ0E3SCxVQUFFbUUsSUFBRixDQUFPdEMsT0FBT3pFLE1BQWQsRUFBcUIsVUFBUzRRLEtBQVQsRUFBZTtBQUNsQyxjQUFHdlAsTUFBSCxFQUFVO0FBQ1IxRCxtQkFBT29ULFFBQVAsQ0FBZ0IxUCxNQUFoQixFQUF1QjtBQUNyQndQLHFCQUFPRCxNQUFNQyxLQURRO0FBRXJCcFEsbUJBQUttUSxNQUFNblEsR0FGVTtBQUdyQnVRLHFCQUFPSixNQUFNSTtBQUhRLGFBQXZCO0FBS0Q7QUFDRixTQVJEO0FBU0Q7QUFDRjs7QUFFRCxRQUFHdk0sT0FBTzFFLElBQVAsQ0FBWWtELE1BQWYsRUFBc0I7QUFDcEI7QUFDQXRGLGFBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUIxRSxJQUF2QixHQUE4QixFQUE5QjtBQUNBNkMsUUFBRW1FLElBQUYsQ0FBT3RDLE9BQU8xRSxJQUFkLEVBQW1CLFVBQVNrUixHQUFULEVBQWE7QUFDOUIsWUFBR3RULE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUIxRSxJQUF2QixDQUE0QmtELE1BQTVCLElBQ0RMLEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUIxRSxJQUFoQyxFQUFzQyxFQUFDakIsTUFBTW1TLElBQUlKLEtBQVgsRUFBdEMsRUFBeUQ1TixNQUQzRCxFQUNrRTtBQUNoRUwsWUFBRUMsTUFBRixDQUFTbEYsT0FBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QjFFLElBQWhDLEVBQXNDLEVBQUNqQixNQUFNbVMsSUFBSUosS0FBWCxFQUF0QyxFQUF5RCxDQUF6RCxFQUE0REMsTUFBNUQsSUFBc0VwTyxXQUFXdU8sSUFBSUgsTUFBZixDQUF0RTtBQUNELFNBSEQsTUFHTztBQUNMblQsaUJBQU91RixRQUFQLENBQWdCdUIsTUFBaEIsQ0FBdUIxRSxJQUF2QixDQUE0QnNHLElBQTVCLENBQWlDO0FBQy9Cdkgsa0JBQU1tUyxJQUFJSixLQURxQixFQUNkQyxRQUFRcE8sV0FBV3VPLElBQUlILE1BQWY7QUFETSxXQUFqQztBQUdEO0FBQ0YsT0FURDtBQVVBO0FBQ0EsVUFBSXpQLFNBQVN1QixFQUFFQyxNQUFGLENBQVNsRixPQUFPNkQsT0FBaEIsRUFBd0IsRUFBQy9CLE1BQUssS0FBTixFQUF4QixFQUFzQyxDQUF0QyxDQUFiO0FBQ0EsVUFBRzRCLE1BQUgsRUFBVztBQUNUQSxlQUFPb0osTUFBUCxHQUFnQixFQUFoQjtBQUNBN0gsVUFBRW1FLElBQUYsQ0FBT3RDLE9BQU8xRSxJQUFkLEVBQW1CLFVBQVNrUixHQUFULEVBQWE7QUFDOUIsY0FBRzVQLE1BQUgsRUFBVTtBQUNSMUQsbUJBQU9vVCxRQUFQLENBQWdCMVAsTUFBaEIsRUFBdUI7QUFDckJ3UCxxQkFBT0ksSUFBSUosS0FEVTtBQUVyQnBRLG1CQUFLd1EsSUFBSXhRLEdBRlk7QUFHckJ1USxxQkFBT0MsSUFBSUQ7QUFIVSxhQUF2QjtBQUtEO0FBQ0YsU0FSRDtBQVNEO0FBQ0Y7QUFDRCxRQUFHdk0sT0FBT3lNLElBQVAsQ0FBWWpPLE1BQWYsRUFBc0I7QUFDcEI7QUFDQSxVQUFJNUIsU0FBU3VCLEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU82RCxPQUFoQixFQUF3QixFQUFDL0IsTUFBSyxPQUFOLEVBQXhCLEVBQXdDLENBQXhDLENBQWI7QUFDQSxVQUFHNEIsTUFBSCxFQUFVO0FBQ1JBLGVBQU9vSixNQUFQLEdBQWdCLEVBQWhCO0FBQ0E3SCxVQUFFbUUsSUFBRixDQUFPdEMsT0FBT3lNLElBQWQsRUFBbUIsVUFBU0EsSUFBVCxFQUFjO0FBQy9CdlQsaUJBQU9vVCxRQUFQLENBQWdCMVAsTUFBaEIsRUFBdUI7QUFDckJ3UCxtQkFBT0ssS0FBS0wsS0FEUztBQUVyQnBRLGlCQUFLeVEsS0FBS3pRLEdBRlc7QUFHckJ1USxtQkFBT0UsS0FBS0Y7QUFIUyxXQUF2QjtBQUtELFNBTkQ7QUFPRDtBQUNGO0FBQ0QsUUFBR3ZNLE9BQU8wTSxLQUFQLENBQWFsTyxNQUFoQixFQUF1QjtBQUNyQjtBQUNBdEYsYUFBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QjBNLEtBQXZCLEdBQStCLEVBQS9CO0FBQ0F2TyxRQUFFbUUsSUFBRixDQUFPdEMsT0FBTzBNLEtBQWQsRUFBb0IsVUFBU0EsS0FBVCxFQUFlO0FBQ2pDeFQsZUFBT3VGLFFBQVAsQ0FBZ0J1QixNQUFoQixDQUF1QjBNLEtBQXZCLENBQTZCOUssSUFBN0IsQ0FBa0M7QUFDaEN2SCxnQkFBTXFTLE1BQU1yUztBQURvQixTQUFsQztBQUdELE9BSkQ7QUFLRDtBQUNEbkIsV0FBT3FTLGNBQVAsR0FBd0IsSUFBeEI7QUFDSCxHQWhJRDs7QUFrSUFyUyxTQUFPeVQsVUFBUCxHQUFvQixZQUFVO0FBQzVCLFFBQUcsQ0FBQ3pULE9BQU8wVCxNQUFYLEVBQWtCO0FBQ2hCbFQsa0JBQVlrVCxNQUFaLEdBQXFCaEssSUFBckIsQ0FBMEIsVUFBU2MsUUFBVCxFQUFrQjtBQUMxQ3hLLGVBQU8wVCxNQUFQLEdBQWdCbEosUUFBaEI7QUFDRCxPQUZEO0FBR0Q7QUFDRixHQU5EOztBQVFBeEssU0FBTzJULFVBQVAsR0FBb0IsWUFBVTtBQUM1QixRQUFJNVUsU0FBUyxFQUFiO0FBQ0EsUUFBRyxDQUFDaUIsT0FBT3dDLEdBQVgsRUFBZTtBQUNiekQsYUFBTzJKLElBQVAsQ0FDRWxJLFlBQVlnQyxHQUFaLEdBQWtCa0gsSUFBbEIsQ0FBdUIsVUFBU2MsUUFBVCxFQUFrQjtBQUN2Q3hLLGVBQU93QyxHQUFQLEdBQWFnSSxRQUFiO0FBQ0QsT0FGRCxDQURGO0FBS0Q7O0FBRUQsUUFBRyxDQUFDeEssT0FBT3FDLE1BQVgsRUFBa0I7QUFDaEJ0RCxhQUFPMkosSUFBUCxDQUNFbEksWUFBWTZCLE1BQVosR0FBcUJxSCxJQUFyQixDQUEwQixVQUFTYyxRQUFULEVBQWtCO0FBQzFDLGVBQU94SyxPQUFPcUMsTUFBUCxHQUFnQjRDLEVBQUUyTyxNQUFGLENBQVMzTyxFQUFFNE8sTUFBRixDQUFTckosUUFBVCxFQUFrQixNQUFsQixDQUFULEVBQW1DLE1BQW5DLENBQXZCO0FBQ0QsT0FGRCxDQURGO0FBS0Q7O0FBRUQsUUFBRyxDQUFDeEssT0FBT29DLElBQVgsRUFBZ0I7QUFDZHJELGFBQU8ySixJQUFQLENBQ0VsSSxZQUFZNEIsSUFBWixHQUFtQnNILElBQW5CLENBQXdCLFVBQVNjLFFBQVQsRUFBa0I7QUFDeEMsZUFBT3hLLE9BQU9vQyxJQUFQLEdBQWM2QyxFQUFFMk8sTUFBRixDQUFTM08sRUFBRTRPLE1BQUYsQ0FBU3JKLFFBQVQsRUFBa0IsTUFBbEIsQ0FBVCxFQUFtQyxNQUFuQyxDQUFyQjtBQUNELE9BRkQsQ0FERjtBQUtEOztBQUVELFFBQUcsQ0FBQ3hLLE9BQU9zQyxLQUFYLEVBQWlCO0FBQ2Z2RCxhQUFPMkosSUFBUCxDQUNFbEksWUFBWThCLEtBQVosR0FBb0JvSCxJQUFwQixDQUF5QixVQUFTYyxRQUFULEVBQWtCO0FBQ3pDLGVBQU94SyxPQUFPc0MsS0FBUCxHQUFlMkMsRUFBRTJPLE1BQUYsQ0FBUzNPLEVBQUU0TyxNQUFGLENBQVNySixRQUFULEVBQWtCLE1BQWxCLENBQVQsRUFBbUMsTUFBbkMsQ0FBdEI7QUFDRCxPQUZELENBREY7QUFLRDs7QUFFRCxRQUFHLENBQUN4SyxPQUFPdUMsUUFBWCxFQUFvQjtBQUNsQnhELGFBQU8ySixJQUFQLENBQ0VsSSxZQUFZK0IsUUFBWixHQUF1Qm1ILElBQXZCLENBQTRCLFVBQVNjLFFBQVQsRUFBa0I7QUFDNUMsZUFBT3hLLE9BQU91QyxRQUFQLEdBQWtCaUksUUFBekI7QUFDRCxPQUZELENBREY7QUFLRDs7QUFFRCxXQUFPbkssR0FBR3lULEdBQUgsQ0FBTy9VLE1BQVAsQ0FBUDtBQUNILEdBM0NDOztBQTZDQTtBQUNBaUIsU0FBTytULElBQVAsR0FBYyxZQUFNO0FBQ2xCdk4sTUFBRSx5QkFBRixFQUE2QndOLE9BQTdCLENBQXFDO0FBQ25DQyxnQkFBVSxNQUR5QjtBQUVuQ0MsaUJBQVcsT0FGd0I7QUFHbkNyVCxZQUFNO0FBSDZCLEtBQXJDO0FBS0EsUUFBRzJGLEVBQUUsY0FBRixFQUFrQmdMLElBQWxCLE1BQTRCLFlBQS9CLEVBQTRDO0FBQzFDaEwsUUFBRSxZQUFGLEVBQWdCMk4sSUFBaEI7QUFDRDtBQUNEblUsV0FBTzBDLFlBQVAsR0FBc0IsQ0FBQzFDLE9BQU91RixRQUFQLENBQWdCRSxPQUFoQixDQUF3Qm9MLE1BQS9DO0FBQ0EsUUFBRzdRLE9BQU9nRyxLQUFQLENBQWFFLElBQWhCLEVBQ0UsT0FBT2xHLE9BQU8rUSxhQUFQLEVBQVA7O0FBRUY5TCxNQUFFbUUsSUFBRixDQUFPcEosT0FBTzZELE9BQWQsRUFBdUIsa0JBQVU7QUFDN0I7QUFDQUgsYUFBT3FKLElBQVAsQ0FBWUcsR0FBWixHQUFrQnhKLE9BQU8wSSxJQUFQLENBQVksUUFBWixJQUFzQjFJLE9BQU8wSSxJQUFQLENBQVksTUFBWixDQUF0QixHQUEwQyxFQUE1RDtBQUNBO0FBQ0EsVUFBRyxDQUFDLENBQUMxSSxPQUFPb0osTUFBVCxJQUFtQnBKLE9BQU9vSixNQUFQLENBQWN4SCxNQUFwQyxFQUEyQztBQUN6Q0wsVUFBRW1FLElBQUYsQ0FBTzFGLE9BQU9vSixNQUFkLEVBQXNCLGlCQUFTO0FBQzdCLGNBQUdzSCxNQUFNalEsT0FBVCxFQUFpQjtBQUNmaVEsa0JBQU1qUSxPQUFOLEdBQWdCLEtBQWhCO0FBQ0FuRSxtQkFBT3FVLFVBQVAsQ0FBa0JELEtBQWxCLEVBQXdCMVEsTUFBeEI7QUFDRCxXQUhELE1BR08sSUFBRyxDQUFDMFEsTUFBTWpRLE9BQVAsSUFBa0JpUSxNQUFNRSxLQUEzQixFQUFpQztBQUN0Q25VLHFCQUFTLFlBQU07QUFDYkgscUJBQU9xVSxVQUFQLENBQWtCRCxLQUFsQixFQUF3QjFRLE1BQXhCO0FBQ0QsYUFGRCxFQUVFLEtBRkY7QUFHRCxXQUpNLE1BSUEsSUFBRzBRLE1BQU1HLEVBQU4sSUFBWUgsTUFBTUcsRUFBTixDQUFTcFEsT0FBeEIsRUFBZ0M7QUFDckNpUSxrQkFBTUcsRUFBTixDQUFTcFEsT0FBVCxHQUFtQixLQUFuQjtBQUNBbkUsbUJBQU9xVSxVQUFQLENBQWtCRCxNQUFNRyxFQUF4QjtBQUNEO0FBQ0YsU0FaRDtBQWFEO0FBQ0R2VSxhQUFPd1UsY0FBUCxDQUFzQjlRLE1BQXRCO0FBQ0QsS0FwQkg7O0FBc0JFLFdBQU8sSUFBUDtBQUNILEdBcENEOztBQXNDQTFELFNBQU8ySyxlQUFQLEdBQXlCLFVBQVNULEdBQVQsRUFBY3hHLE1BQWQsRUFBc0IxQyxRQUF0QixFQUErQjtBQUN0RCxRQUFHLENBQUMsQ0FBQ2hCLE9BQU91RixRQUFQLENBQWdCRSxPQUFoQixDQUF3Qm9MLE1BQTdCLEVBQW9DO0FBQ2xDN1EsYUFBTzJDLEtBQVAsQ0FBYWIsSUFBYixHQUFvQixTQUFwQjtBQUNBOUIsYUFBTzJDLEtBQVAsQ0FBYUMsT0FBYixHQUF1QnJDLEtBQUtrVSxXQUFMLENBQWlCLG9EQUFqQixDQUF2QjtBQUNELEtBSEQsTUFHTztBQUNMLFVBQUk3UixPQUFKOztBQUVBLFVBQUcsT0FBT3NILEdBQVAsSUFBYyxRQUFkLElBQTBCQSxJQUFJckYsT0FBSixDQUFZLEdBQVosTUFBcUIsQ0FBQyxDQUFuRCxFQUFxRDtBQUNuRCxZQUFHLENBQUNOLE9BQU9tUSxJQUFQLENBQVl4SyxHQUFaLEVBQWlCNUUsTUFBckIsRUFBNkI7QUFDN0I0RSxjQUFNZSxLQUFLQyxLQUFMLENBQVdoQixHQUFYLENBQU47QUFDQSxZQUFHLENBQUMzRixPQUFPbVEsSUFBUCxDQUFZeEssR0FBWixFQUFpQjVFLE1BQXJCLEVBQTZCO0FBQzlCOztBQUVELFVBQUcsT0FBTzRFLEdBQVAsSUFBYyxRQUFqQixFQUNFdEgsVUFBVXNILEdBQVYsQ0FERixLQUVLLElBQUcsQ0FBQyxDQUFDQSxJQUFJeUssVUFBVCxFQUNIL1IsVUFBVXNILElBQUl5SyxVQUFkLENBREcsS0FFQSxJQUFHekssSUFBSW5MLE1BQUosSUFBY21MLElBQUluTCxNQUFKLENBQVdhLEdBQTVCLEVBQ0hnRCxVQUFVc0gsSUFBSW5MLE1BQUosQ0FBV2EsR0FBckIsQ0FERyxLQUVBLElBQUdzSyxJQUFJaEIsT0FBUCxFQUFlO0FBQ2xCLFlBQUd4RixNQUFILEVBQ0VBLE9BQU9kLE9BQVAsQ0FBZXNHLE9BQWYsR0FBeUJnQixJQUFJaEIsT0FBN0I7QUFDSCxPQUhJLE1BR0U7QUFDTHRHLGtCQUFVcUksS0FBSzJKLFNBQUwsQ0FBZTFLLEdBQWYsQ0FBVjtBQUNBLFlBQUd0SCxXQUFXLElBQWQsRUFBb0JBLFVBQVUsRUFBVjtBQUNyQjs7QUFFRCxVQUFHLENBQUMsQ0FBQ0EsT0FBTCxFQUFhO0FBQ1gsWUFBR2MsTUFBSCxFQUFVO0FBQ1JBLGlCQUFPZCxPQUFQLENBQWVkLElBQWYsR0FBc0IsUUFBdEI7QUFDQTRCLGlCQUFPZCxPQUFQLENBQWV1SyxLQUFmLEdBQXFCLENBQXJCO0FBQ0F6SixpQkFBT2QsT0FBUCxDQUFlQSxPQUFmLEdBQXlCckMsS0FBS2tVLFdBQUwsd0JBQXNDN1IsT0FBdEMsQ0FBekI7QUFDQSxjQUFHNUIsUUFBSCxFQUNFMEMsT0FBT2QsT0FBUCxDQUFlNUIsUUFBZixHQUEwQkEsUUFBMUI7QUFDRmhCLGlCQUFPNlUsbUJBQVAsQ0FBMkIsRUFBQ25SLFFBQU9BLE1BQVIsRUFBM0IsRUFBNENkLE9BQTVDO0FBQ0E1QyxpQkFBT3dVLGNBQVAsQ0FBc0I5USxNQUF0QjtBQUNELFNBUkQsTUFRTztBQUNMMUQsaUJBQU8yQyxLQUFQLENBQWFDLE9BQWIsR0FBdUJyQyxLQUFLa1UsV0FBTCxhQUEyQjdSLE9BQTNCLENBQXZCO0FBQ0Q7QUFDRixPQVpELE1BWU8sSUFBR2MsTUFBSCxFQUFVO0FBQ2ZBLGVBQU9kLE9BQVAsQ0FBZXVLLEtBQWYsR0FBcUIsQ0FBckI7QUFDQXpKLGVBQU9kLE9BQVAsQ0FBZUEsT0FBZixHQUF5QnJDLEtBQUtrVSxXQUFMLDBCQUF3Q2pVLFlBQVlzVSxNQUFaLENBQW1CcFIsT0FBTzJGLE9BQTFCLENBQXhDLENBQXpCO0FBQ0FySixlQUFPNlUsbUJBQVAsQ0FBMkIsRUFBQ25SLFFBQU9BLE1BQVIsRUFBM0IsRUFBNENBLE9BQU9kLE9BQVAsQ0FBZUEsT0FBM0Q7QUFDRCxPQUpNLE1BSUE7QUFDTDVDLGVBQU8yQyxLQUFQLENBQWFDLE9BQWIsR0FBdUJyQyxLQUFLa1UsV0FBTCxDQUFpQixtQkFBakIsQ0FBdkI7QUFDRDtBQUNGO0FBQ0YsR0EvQ0Q7QUFnREF6VSxTQUFPNlUsbUJBQVAsR0FBNkIsVUFBU3JLLFFBQVQsRUFBbUI3SCxLQUFuQixFQUF5QjtBQUNwRCxRQUFJMEcsVUFBVXBFLEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU91RixRQUFQLENBQWdCK0MsUUFBekIsRUFBbUMsRUFBQzdELElBQUkrRixTQUFTOUcsTUFBVCxDQUFnQjJGLE9BQWhCLENBQXdCNUUsRUFBN0IsRUFBbkMsQ0FBZDtBQUNBLFFBQUc0RSxRQUFRL0QsTUFBWCxFQUFrQjtBQUNoQitELGNBQVEsQ0FBUixFQUFXdkIsTUFBWCxDQUFrQnFCLEVBQWxCLEdBQXVCLElBQUlWLElBQUosRUFBdkI7QUFDQSxVQUFHK0IsU0FBU3VLLGNBQVosRUFDRTFMLFFBQVEsQ0FBUixFQUFXSCxPQUFYLEdBQXFCc0IsU0FBU3VLLGNBQTlCO0FBQ0YsVUFBR3BTLEtBQUgsRUFDRTBHLFFBQVEsQ0FBUixFQUFXdkIsTUFBWCxDQUFrQm5GLEtBQWxCLEdBQTBCQSxLQUExQixDQURGLEtBR0UwRyxRQUFRLENBQVIsRUFBV3ZCLE1BQVgsQ0FBa0JuRixLQUFsQixHQUEwQixFQUExQjtBQUNEO0FBQ0osR0FYRDs7QUFhQTNDLFNBQU9pUSxVQUFQLEdBQW9CLFVBQVN2TSxNQUFULEVBQWdCO0FBQ2xDLFFBQUdBLE1BQUgsRUFBVztBQUNUQSxhQUFPZCxPQUFQLENBQWV1SyxLQUFmLEdBQXFCLENBQXJCO0FBQ0F6SixhQUFPZCxPQUFQLENBQWVBLE9BQWYsR0FBeUJyQyxLQUFLa1UsV0FBTCxDQUFpQixFQUFqQixDQUF6QjtBQUNBelUsYUFBTzZVLG1CQUFQLENBQTJCLEVBQUNuUixRQUFPQSxNQUFSLEVBQTNCO0FBQ0QsS0FKRCxNQUlPO0FBQ0wxRCxhQUFPMkMsS0FBUCxDQUFhYixJQUFiLEdBQW9CLFFBQXBCO0FBQ0E5QixhQUFPMkMsS0FBUCxDQUFhQyxPQUFiLEdBQXVCckMsS0FBS2tVLFdBQUwsQ0FBaUIsRUFBakIsQ0FBdkI7QUFDRDtBQUNGLEdBVEQ7O0FBV0F6VSxTQUFPZ1YsVUFBUCxHQUFvQixVQUFTeEssUUFBVCxFQUFtQjlHLE1BQW5CLEVBQTBCO0FBQzVDLFFBQUcsQ0FBQzhHLFFBQUosRUFBYTtBQUNYLGFBQU8sS0FBUDtBQUNEOztBQUVEeEssV0FBT2lRLFVBQVAsQ0FBa0J2TSxNQUFsQjtBQUNBO0FBQ0FBLFdBQU91UixHQUFQLEdBQWF2UixPQUFPdkMsSUFBcEI7QUFDQSxRQUFJK1QsUUFBUSxFQUFaO0FBQ0E7QUFDQSxRQUFJbEMsT0FBTyxJQUFJdkssSUFBSixFQUFYO0FBQ0E7QUFDQStCLGFBQVM0QixJQUFULEdBQWdCckgsV0FBV3lGLFNBQVM0QixJQUFwQixDQUFoQjtBQUNBNUIsYUFBU21DLEdBQVQsR0FBZTVILFdBQVd5RixTQUFTbUMsR0FBcEIsQ0FBZjtBQUNBLFFBQUduQyxTQUFTb0MsS0FBWixFQUNFcEMsU0FBU29DLEtBQVQsR0FBaUI3SCxXQUFXeUYsU0FBU29DLEtBQXBCLENBQWpCOztBQUVGLFFBQUcsQ0FBQyxDQUFDbEosT0FBTzBJLElBQVAsQ0FBWWxMLE9BQWpCLEVBQ0V3QyxPQUFPMEksSUFBUCxDQUFZSSxRQUFaLEdBQXVCOUksT0FBTzBJLElBQVAsQ0FBWWxMLE9BQW5DO0FBQ0Y7QUFDQXdDLFdBQU8wSSxJQUFQLENBQVlHLFFBQVosR0FBd0J2TSxPQUFPdUYsUUFBUCxDQUFnQkUsT0FBaEIsQ0FBd0JFLElBQXhCLElBQWdDLEdBQWpDLEdBQ3JCekYsUUFBUSxjQUFSLEVBQXdCc0ssU0FBUzRCLElBQWpDLENBRHFCLEdBRXJCbE0sUUFBUSxPQUFSLEVBQWlCc0ssU0FBUzRCLElBQTFCLEVBQStCLENBQS9CLENBRkY7QUFHQTtBQUNBMUksV0FBTzBJLElBQVAsQ0FBWWxMLE9BQVosR0FBdUI2RCxXQUFXckIsT0FBTzBJLElBQVAsQ0FBWUcsUUFBdkIsSUFBbUN4SCxXQUFXckIsT0FBTzBJLElBQVAsQ0FBWUssTUFBdkIsQ0FBMUQ7QUFDQTtBQUNBL0ksV0FBTzBJLElBQVAsQ0FBWU8sR0FBWixHQUFrQm5DLFNBQVNtQyxHQUEzQjtBQUNBakosV0FBTzBJLElBQVAsQ0FBWVEsS0FBWixHQUFvQnBDLFNBQVNvQyxLQUE3Qjs7QUFFQTtBQUNBLFFBQUdsSixPQUFPMEksSUFBUCxDQUFZdEssSUFBWixJQUFvQixRQUFwQixJQUNELENBQUM0QixPQUFPMEksSUFBUCxDQUFZUSxLQURaLElBRUQsQ0FBQ2xKLE9BQU8wSSxJQUFQLENBQVlPLEdBRmYsRUFFbUI7QUFDZjNNLGFBQU8ySyxlQUFQLENBQXVCLHlCQUF2QixFQUFrRGpILE1BQWxEO0FBQ0Y7QUFDRCxLQUxELE1BS08sSUFBR0EsT0FBTzBJLElBQVAsQ0FBWXRLLElBQVosSUFBb0IsU0FBcEIsSUFDUjBJLFNBQVM0QixJQUFULElBQWlCLENBQUMsR0FEYixFQUNpQjtBQUNwQnBNLGFBQU8ySyxlQUFQLENBQXVCLHlCQUF2QixFQUFrRGpILE1BQWxEO0FBQ0Y7QUFDRDs7QUFFRDtBQUNBLFFBQUdBLE9BQU9tSixNQUFQLENBQWN2SCxNQUFkLEdBQXVCakUsVUFBMUIsRUFBcUM7QUFDbkNyQixhQUFPNkQsT0FBUCxDQUFldUUsR0FBZixDQUFtQixVQUFDeEUsQ0FBRCxFQUFPO0FBQ3hCLGVBQU9BLEVBQUVpSixNQUFGLENBQVNzSSxLQUFULEVBQVA7QUFDRCxPQUZEO0FBR0Q7O0FBRUQ7QUFDQTtBQUNBLFFBQUksT0FBTzNLLFNBQVMyRCxPQUFoQixJQUEyQixXQUEvQixFQUEyQztBQUN6Q3pLLGFBQU95SyxPQUFQLEdBQWlCM0QsU0FBUzJELE9BQTFCO0FBQ0Q7QUFDRDtBQUNBLFFBQUksT0FBTzNELFNBQVM0SyxRQUFoQixJQUE0QixXQUFoQyxFQUE0QztBQUMxQzFSLGFBQU8wUixRQUFQLEdBQWtCNUssU0FBUzRLLFFBQTNCO0FBQ0Q7QUFDRCxRQUFJLE9BQU81SyxTQUFTNkssUUFBaEIsSUFBNEIsV0FBaEMsRUFBNEM7QUFDMUM7QUFDQTNSLGFBQU8yUixRQUFQLEdBQWtCN0ssU0FBUzZLLFFBQVQsR0FBb0IsUUFBdEM7QUFDRDs7QUFFRHJWLFdBQU93VSxjQUFQLENBQXNCOVEsTUFBdEI7QUFDQTFELFdBQU82VSxtQkFBUCxDQUEyQixFQUFDblIsUUFBT0EsTUFBUixFQUFnQnFSLGdCQUFldkssU0FBU3VLLGNBQXhDLEVBQTNCOztBQUVBLFFBQUlPLGVBQWU1UixPQUFPMEksSUFBUCxDQUFZbEwsT0FBL0I7QUFDQSxRQUFJcVUsV0FBVyxNQUFmO0FBQ0E7QUFDQSxRQUFHLENBQUMsQ0FBQy9VLFlBQVkwTixXQUFaLENBQXdCeEssT0FBTzBJLElBQVAsQ0FBWXRLLElBQXBDLEVBQTBDcU0sT0FBNUMsSUFBdUQsT0FBT3pLLE9BQU95SyxPQUFkLElBQXlCLFdBQW5GLEVBQStGO0FBQzdGbUgscUJBQWU1UixPQUFPeUssT0FBdEI7QUFDQW9ILGlCQUFXLEdBQVg7QUFDRCxLQUhELE1BR087QUFDTDdSLGFBQU9tSixNQUFQLENBQWNuRSxJQUFkLENBQW1CLENBQUNzSyxLQUFLd0MsT0FBTCxFQUFELEVBQWdCRixZQUFoQixDQUFuQjtBQUNEOztBQUVEO0FBQ0EsUUFBR0EsZUFBZTVSLE9BQU8wSSxJQUFQLENBQVl4TCxNQUFaLEdBQW1COEMsT0FBTzBJLElBQVAsQ0FBWU0sSUFBakQsRUFBc0Q7QUFDcEQ7QUFDQSxVQUFHaEosT0FBT0ksTUFBUCxDQUFjbUksSUFBZCxJQUFzQnZJLE9BQU9JLE1BQVAsQ0FBY0ssT0FBdkMsRUFBK0M7QUFDN0MrUSxjQUFNeE0sSUFBTixDQUFXMUksT0FBT29FLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSSxNQUFsQyxFQUEwQyxLQUExQyxDQUFYO0FBQ0Q7QUFDRDtBQUNBLFVBQUdKLE9BQU9NLElBQVAsSUFBZU4sT0FBT00sSUFBUCxDQUFZaUksSUFBM0IsSUFBbUN2SSxPQUFPTSxJQUFQLENBQVlHLE9BQWxELEVBQTBEO0FBQ3hEK1EsY0FBTXhNLElBQU4sQ0FBVzFJLE9BQU9vRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT00sSUFBbEMsRUFBd0MsS0FBeEMsQ0FBWDtBQUNEO0FBQ0Q7QUFDQSxVQUFHTixPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNrSSxJQUEvQixJQUF1QyxDQUFDdkksT0FBT0ssTUFBUCxDQUFjSSxPQUF6RCxFQUFpRTtBQUMvRCtRLGNBQU14TSxJQUFOLENBQVcxSSxPQUFPb0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9LLE1BQWxDLEVBQTBDLElBQTFDLEVBQWdEMkYsSUFBaEQsQ0FBcUQsa0JBQVU7QUFDeEVoRyxpQkFBT3FKLElBQVAsQ0FBWXVFLE9BQVosQ0FBb0JFLElBQXBCLEdBQTJCLFNBQTNCO0FBQ0E5TixpQkFBT3FKLElBQVAsQ0FBWXVFLE9BQVosQ0FBb0JHLEtBQXBCLEdBQTRCLG9CQUE1QjtBQUNELFNBSFUsQ0FBWDtBQUlEO0FBQ0YsS0FoQkQsQ0FnQkU7QUFoQkYsU0FpQkssSUFBRzZELGVBQWU1UixPQUFPMEksSUFBUCxDQUFZeEwsTUFBWixHQUFtQjhDLE9BQU8wSSxJQUFQLENBQVlNLElBQWpELEVBQXNEO0FBQ3pEMU0sZUFBT29OLE1BQVAsQ0FBYzFKLE1BQWQ7QUFDQTtBQUNBLFlBQUdBLE9BQU9JLE1BQVAsQ0FBY21JLElBQWQsSUFBc0IsQ0FBQ3ZJLE9BQU9JLE1BQVAsQ0FBY0ssT0FBeEMsRUFBZ0Q7QUFDOUMrUSxnQkFBTXhNLElBQU4sQ0FBVzFJLE9BQU9vRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT0ksTUFBbEMsRUFBMEMsSUFBMUMsRUFBZ0Q0RixJQUFoRCxDQUFxRCxtQkFBVztBQUN6RWhHLG1CQUFPcUosSUFBUCxDQUFZdUUsT0FBWixDQUFvQkUsSUFBcEIsR0FBMkIsU0FBM0I7QUFDQTlOLG1CQUFPcUosSUFBUCxDQUFZdUUsT0FBWixDQUFvQkcsS0FBcEIsR0FBNEIsbUJBQTVCO0FBQ0QsV0FIVSxDQUFYO0FBSUQ7QUFDRDtBQUNBLFlBQUcvTixPQUFPTSxJQUFQLElBQWVOLE9BQU9NLElBQVAsQ0FBWWlJLElBQTNCLElBQW1DLENBQUN2SSxPQUFPTSxJQUFQLENBQVlHLE9BQW5ELEVBQTJEO0FBQ3pEK1EsZ0JBQU14TSxJQUFOLENBQVcxSSxPQUFPb0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9NLElBQWxDLEVBQXdDLElBQXhDLENBQVg7QUFDRDtBQUNEO0FBQ0EsWUFBR04sT0FBT0ssTUFBUCxJQUFpQkwsT0FBT0ssTUFBUCxDQUFja0ksSUFBL0IsSUFBdUN2SSxPQUFPSyxNQUFQLENBQWNJLE9BQXhELEVBQWdFO0FBQzlEK1EsZ0JBQU14TSxJQUFOLENBQVcxSSxPQUFPb0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9LLE1BQWxDLEVBQTBDLEtBQTFDLENBQVg7QUFDRDtBQUNGLE9BakJJLE1BaUJFO0FBQ0w7QUFDQUwsZUFBTzBJLElBQVAsQ0FBWUUsR0FBWixHQUFnQixJQUFJN0QsSUFBSixFQUFoQixDQUZLLENBRXNCO0FBQzNCekksZUFBT29OLE1BQVAsQ0FBYzFKLE1BQWQ7QUFDQTtBQUNBLFlBQUdBLE9BQU9JLE1BQVAsQ0FBY21JLElBQWQsSUFBc0J2SSxPQUFPSSxNQUFQLENBQWNLLE9BQXZDLEVBQStDO0FBQzdDK1EsZ0JBQU14TSxJQUFOLENBQVcxSSxPQUFPb0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJBLE9BQU9JLE1BQWxDLEVBQTBDLEtBQTFDLENBQVg7QUFDRDtBQUNEO0FBQ0EsWUFBR0osT0FBT00sSUFBUCxJQUFlTixPQUFPTSxJQUFQLENBQVlpSSxJQUEzQixJQUFtQ3ZJLE9BQU9NLElBQVAsQ0FBWUcsT0FBbEQsRUFBMEQ7QUFDeEQrUSxnQkFBTXhNLElBQU4sQ0FBVzFJLE9BQU9vRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT00sSUFBbEMsRUFBd0MsS0FBeEMsQ0FBWDtBQUNEO0FBQ0Q7QUFDQSxZQUFHTixPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNrSSxJQUEvQixJQUF1Q3ZJLE9BQU9LLE1BQVAsQ0FBY0ksT0FBeEQsRUFBZ0U7QUFDOUQrUSxnQkFBTXhNLElBQU4sQ0FBVzFJLE9BQU9vRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT0ssTUFBbEMsRUFBMEMsS0FBMUMsQ0FBWDtBQUNEO0FBQ0Y7QUFDRCxXQUFPMUQsR0FBR3lULEdBQUgsQ0FBT29CLEtBQVAsQ0FBUDtBQUNELEdBaElEOztBQWtJQWxWLFNBQU95VixZQUFQLEdBQXNCLFlBQVU7QUFDOUIsV0FBTyxNQUFJMVYsUUFBUVksT0FBUixDQUFnQmMsU0FBU2lVLGNBQVQsQ0FBd0IsUUFBeEIsQ0FBaEIsRUFBbUQsQ0FBbkQsRUFBc0RDLFlBQWpFO0FBQ0QsR0FGRDs7QUFJQTNWLFNBQU9vVCxRQUFQLEdBQWtCLFVBQVMxUCxNQUFULEVBQWdCWCxPQUFoQixFQUF3QjtBQUN4QyxRQUFHLENBQUNXLE9BQU9vSixNQUFYLEVBQ0VwSixPQUFPb0osTUFBUCxHQUFjLEVBQWQ7QUFDRixRQUFHL0osT0FBSCxFQUFXO0FBQ1RBLGNBQVFELEdBQVIsR0FBY0MsUUFBUUQsR0FBUixHQUFjQyxRQUFRRCxHQUF0QixHQUE0QixDQUExQztBQUNBQyxjQUFRNlMsR0FBUixHQUFjN1MsUUFBUTZTLEdBQVIsR0FBYzdTLFFBQVE2UyxHQUF0QixHQUE0QixDQUExQztBQUNBN1MsY0FBUW9CLE9BQVIsR0FBa0JwQixRQUFRb0IsT0FBUixHQUFrQnBCLFFBQVFvQixPQUExQixHQUFvQyxLQUF0RDtBQUNBcEIsY0FBUXVSLEtBQVIsR0FBZ0J2UixRQUFRdVIsS0FBUixHQUFnQnZSLFFBQVF1UixLQUF4QixHQUFnQyxLQUFoRDtBQUNBNVEsYUFBT29KLE1BQVAsQ0FBY3BFLElBQWQsQ0FBbUIzRixPQUFuQjtBQUNELEtBTkQsTUFNTztBQUNMVyxhQUFPb0osTUFBUCxDQUFjcEUsSUFBZCxDQUFtQixFQUFDd0ssT0FBTSxZQUFQLEVBQW9CcFEsS0FBSSxFQUF4QixFQUEyQjhTLEtBQUksQ0FBL0IsRUFBaUN6UixTQUFRLEtBQXpDLEVBQStDbVEsT0FBTSxLQUFyRCxFQUFuQjtBQUNEO0FBQ0YsR0FaRDs7QUFjQXRVLFNBQU82VixZQUFQLEdBQXNCLFVBQVNuVixDQUFULEVBQVdnRCxNQUFYLEVBQWtCO0FBQ3RDLFFBQUlvUyxNQUFNL1YsUUFBUVksT0FBUixDQUFnQkQsRUFBRUUsTUFBbEIsQ0FBVjtBQUNBLFFBQUdrVixJQUFJQyxRQUFKLENBQWEsY0FBYixDQUFILEVBQWlDRCxNQUFNQSxJQUFJRSxNQUFKLEVBQU47O0FBRWpDLFFBQUcsQ0FBQ0YsSUFBSUMsUUFBSixDQUFhLFlBQWIsQ0FBSixFQUErQjtBQUM3QkQsVUFBSTFHLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNkJLLFFBQTdCLENBQXNDLFlBQXRDO0FBQ0F0UCxlQUFTLFlBQVU7QUFDakIyVixZQUFJMUcsV0FBSixDQUFnQixZQUFoQixFQUE4QkssUUFBOUIsQ0FBdUMsV0FBdkM7QUFDRCxPQUZELEVBRUUsSUFGRjtBQUdELEtBTEQsTUFLTztBQUNMcUcsVUFBSTFHLFdBQUosQ0FBZ0IsWUFBaEIsRUFBOEJLLFFBQTlCLENBQXVDLFdBQXZDO0FBQ0EvTCxhQUFPb0osTUFBUCxHQUFjLEVBQWQ7QUFDRDtBQUNGLEdBYkQ7O0FBZUE5TSxTQUFPaVcsU0FBUCxHQUFtQixVQUFTdlMsTUFBVCxFQUFnQjtBQUMvQkEsV0FBT1EsR0FBUCxHQUFhLENBQUNSLE9BQU9RLEdBQXJCO0FBQ0EsUUFBR1IsT0FBT1EsR0FBVixFQUNFUixPQUFPd1MsR0FBUCxHQUFhLElBQWI7QUFDTCxHQUpEOztBQU1BbFcsU0FBT21XLFlBQVAsR0FBc0IsVUFBU2hSLElBQVQsRUFBZXpCLE1BQWYsRUFBc0I7O0FBRTFDLFFBQUlFLENBQUo7O0FBRUEsWUFBUXVCLElBQVI7QUFDRSxXQUFLLE1BQUw7QUFDRXZCLFlBQUlGLE9BQU9JLE1BQVg7QUFDQTtBQUNGLFdBQUssTUFBTDtBQUNFRixZQUFJRixPQUFPSyxNQUFYO0FBQ0E7QUFDRixXQUFLLE1BQUw7QUFDRUgsWUFBSUYsT0FBT00sSUFBWDtBQUNBO0FBVEo7O0FBWUEsUUFBRyxDQUFDSixDQUFKLEVBQ0U7O0FBRUZBLE1BQUVPLE9BQUYsR0FBWSxDQUFDUCxFQUFFTyxPQUFmOztBQUVBLFFBQUdULE9BQU9PLE1BQVAsSUFBaUJMLEVBQUVPLE9BQXRCLEVBQThCO0FBQzVCO0FBQ0FuRSxhQUFPb0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJFLENBQTNCLEVBQThCLElBQTlCO0FBQ0QsS0FIRCxNQUdPLElBQUcsQ0FBQ0EsRUFBRU8sT0FBTixFQUFjO0FBQ25CO0FBQ0FuRSxhQUFPb0UsV0FBUCxDQUFtQlYsTUFBbkIsRUFBMkJFLENBQTNCLEVBQThCLEtBQTlCO0FBQ0Q7QUFDRixHQTVCRDs7QUE4QkE1RCxTQUFPb1csV0FBUCxHQUFxQixVQUFTMVMsTUFBVCxFQUFnQjtBQUNuQyxRQUFJMlMsYUFBYSxLQUFqQjtBQUNBcFIsTUFBRW1FLElBQUYsQ0FBT3BKLE9BQU82RCxPQUFkLEVBQXVCLGtCQUFVO0FBQy9CLFVBQUlILE9BQU9JLE1BQVAsSUFBaUJKLE9BQU9JLE1BQVAsQ0FBY3FJLE1BQWhDLElBQ0F6SSxPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNvSSxNQUQvQixJQUVEekksT0FBTzBKLE1BQVAsQ0FBY3RILE9BRmIsSUFHRHBDLE9BQU8wSixNQUFQLENBQWNDLEtBSGIsSUFJRDNKLE9BQU8wSixNQUFQLENBQWNFLEtBSmhCLEVBS0U7QUFDQStJLHFCQUFhLElBQWI7QUFDRDtBQUNGLEtBVEQ7QUFVQSxXQUFPQSxVQUFQO0FBQ0QsR0FiRDs7QUFlQXJXLFNBQU9zVyxlQUFQLEdBQXlCLFVBQVM1UyxNQUFULEVBQWdCO0FBQ3JDQSxXQUFPTyxNQUFQLEdBQWdCLENBQUNQLE9BQU9PLE1BQXhCO0FBQ0FqRSxXQUFPaVEsVUFBUCxDQUFrQnZNLE1BQWxCO0FBQ0EsUUFBSXNQLE9BQU8sSUFBSXZLLElBQUosRUFBWDtBQUNBLFFBQUcvRSxPQUFPTyxNQUFWLEVBQWlCO0FBQ2ZQLGFBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRSxJQUFwQixHQUEyQixhQUEzQjs7QUFFQWhSLGtCQUFZNEwsSUFBWixDQUFpQjFJLE1BQWpCLEVBQ0dnRyxJQURILENBQ1E7QUFBQSxlQUFZMUosT0FBT2dWLFVBQVAsQ0FBa0J4SyxRQUFsQixFQUE0QjlHLE1BQTVCLENBQVo7QUFBQSxPQURSLEVBRUd1RyxLQUZILENBRVMsZUFBTztBQUNaO0FBQ0F2RyxlQUFPbUosTUFBUCxDQUFjbkUsSUFBZCxDQUFtQixDQUFDc0ssS0FBS3dDLE9BQUwsRUFBRCxFQUFnQjlSLE9BQU8wSSxJQUFQLENBQVlsTCxPQUE1QixDQUFuQjtBQUNBd0MsZUFBT2QsT0FBUCxDQUFldUssS0FBZjtBQUNBLFlBQUd6SixPQUFPZCxPQUFQLENBQWV1SyxLQUFmLElBQXNCLENBQXpCLEVBQ0VuTixPQUFPMkssZUFBUCxDQUF1QlQsR0FBdkIsRUFBNEJ4RyxNQUE1QjtBQUNILE9BUkg7O0FBVUE7QUFDQSxVQUFHQSxPQUFPSSxNQUFQLENBQWNLLE9BQWpCLEVBQXlCO0FBQ3ZCbkUsZUFBT29FLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSSxNQUFsQyxFQUEwQyxJQUExQztBQUNEO0FBQ0QsVUFBR0osT0FBT00sSUFBUCxJQUFlTixPQUFPTSxJQUFQLENBQVlHLE9BQTlCLEVBQXNDO0FBQ3BDbkUsZUFBT29FLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPTSxJQUFsQyxFQUF3QyxJQUF4QztBQUNEO0FBQ0QsVUFBR04sT0FBT0ssTUFBUCxJQUFpQkwsT0FBT0ssTUFBUCxDQUFjSSxPQUFsQyxFQUEwQztBQUN4Q25FLGVBQU9vRSxXQUFQLENBQW1CVixNQUFuQixFQUEyQkEsT0FBT0ssTUFBbEMsRUFBMEMsSUFBMUM7QUFDRDtBQUNGLEtBdkJELE1BdUJPOztBQUVMO0FBQ0EsVUFBRyxDQUFDTCxPQUFPTyxNQUFSLElBQWtCUCxPQUFPSSxNQUFQLENBQWNLLE9BQW5DLEVBQTJDO0FBQ3pDbkUsZUFBT29FLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSSxNQUFsQyxFQUEwQyxLQUExQztBQUNEO0FBQ0Q7QUFDQSxVQUFHLENBQUNKLE9BQU9PLE1BQVIsSUFBa0JQLE9BQU9NLElBQXpCLElBQWlDTixPQUFPTSxJQUFQLENBQVlHLE9BQWhELEVBQXdEO0FBQ3REbkUsZUFBT29FLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPTSxJQUFsQyxFQUF3QyxLQUF4QztBQUNEO0FBQ0Q7QUFDQSxVQUFHLENBQUNOLE9BQU9PLE1BQVIsSUFBa0JQLE9BQU9LLE1BQXpCLElBQW1DTCxPQUFPSyxNQUFQLENBQWNJLE9BQXBELEVBQTREO0FBQzFEbkUsZUFBT29FLFdBQVAsQ0FBbUJWLE1BQW5CLEVBQTJCQSxPQUFPSyxNQUFsQyxFQUEwQyxLQUExQztBQUNEO0FBQ0QsVUFBRyxDQUFDTCxPQUFPTyxNQUFYLEVBQWtCO0FBQ2hCLFlBQUdQLE9BQU9NLElBQVYsRUFBZ0JOLE9BQU9NLElBQVAsQ0FBWWlJLElBQVosR0FBaUIsS0FBakI7QUFDaEIsWUFBR3ZJLE9BQU9JLE1BQVYsRUFBa0JKLE9BQU9JLE1BQVAsQ0FBY21JLElBQWQsR0FBbUIsS0FBbkI7QUFDbEIsWUFBR3ZJLE9BQU9LLE1BQVYsRUFBa0JMLE9BQU9LLE1BQVAsQ0FBY2tJLElBQWQsR0FBbUIsS0FBbkI7QUFDbEJqTSxlQUFPd1UsY0FBUCxDQUFzQjlRLE1BQXRCO0FBQ0Q7QUFDRjtBQUNKLEdBaEREOztBQWtEQTFELFNBQU9vRSxXQUFQLEdBQXFCLFVBQVNWLE1BQVQsRUFBaUIvQyxPQUFqQixFQUEwQnVRLEVBQTFCLEVBQTZCO0FBQ2hELFFBQUdBLEVBQUgsRUFBTztBQUNMLFVBQUd2USxRQUFRcUwsR0FBUixDQUFZbkgsT0FBWixDQUFvQixLQUFwQixNQUE2QixDQUFoQyxFQUFrQztBQUNoQyxZQUFJNEcsU0FBU3hHLEVBQUVDLE1BQUYsQ0FBU2xGLE9BQU91RixRQUFQLENBQWdCNkUsTUFBaEIsQ0FBdUJTLEtBQWhDLEVBQXNDLEVBQUM4QyxVQUFVaE4sUUFBUXFMLEdBQVIsQ0FBWTRCLE1BQVosQ0FBbUIsQ0FBbkIsQ0FBWCxFQUF0QyxFQUF5RSxDQUF6RSxDQUFiO0FBQ0EsZUFBT3BOLFlBQVk0SixNQUFaLEdBQXFCOEcsRUFBckIsQ0FBd0J6RixNQUF4QixFQUNKL0IsSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBL0ksa0JBQVF3RCxPQUFSLEdBQWdCLElBQWhCO0FBQ0QsU0FKSSxFQUtKOEYsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU2xLLE9BQU8ySyxlQUFQLENBQXVCVCxHQUF2QixFQUE0QnhHLE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRCxPQVJELE1BU0ssSUFBRy9DLFFBQVF1RCxHQUFYLEVBQWU7QUFDbEIsZUFBTzFELFlBQVlzSSxNQUFaLENBQW1CcEYsTUFBbkIsRUFBMkIvQyxRQUFRcUwsR0FBbkMsRUFBdUN1SyxLQUFLQyxLQUFMLENBQVcsTUFBSTdWLFFBQVF1TCxTQUFaLEdBQXNCLEdBQWpDLENBQXZDLEVBQ0p4QyxJQURJLENBQ0MsWUFBTTtBQUNWO0FBQ0EvSSxrQkFBUXdELE9BQVIsR0FBZ0IsSUFBaEI7QUFDRCxTQUpJLEVBS0o4RixLQUxJLENBS0UsVUFBQ0MsR0FBRDtBQUFBLGlCQUFTbEssT0FBTzJLLGVBQVAsQ0FBdUJULEdBQXZCLEVBQTRCeEcsTUFBNUIsQ0FBVDtBQUFBLFNBTEYsQ0FBUDtBQU1ELE9BUEksTUFPRSxJQUFHL0MsUUFBUXVWLEdBQVgsRUFBZTtBQUNwQixlQUFPMVYsWUFBWXNJLE1BQVosQ0FBbUJwRixNQUFuQixFQUEyQi9DLFFBQVFxTCxHQUFuQyxFQUF1QyxHQUF2QyxFQUNKdEMsSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBL0ksa0JBQVF3RCxPQUFSLEdBQWdCLElBQWhCO0FBQ0QsU0FKSSxFQUtKOEYsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU2xLLE9BQU8ySyxlQUFQLENBQXVCVCxHQUF2QixFQUE0QnhHLE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRCxPQVBNLE1BT0E7QUFDTCxlQUFPbEQsWUFBWXVJLE9BQVosQ0FBb0JyRixNQUFwQixFQUE0Qi9DLFFBQVFxTCxHQUFwQyxFQUF3QyxDQUF4QyxFQUNKdEMsSUFESSxDQUNDLFlBQU07QUFDVjtBQUNBL0ksa0JBQVF3RCxPQUFSLEdBQWdCLElBQWhCO0FBQ0QsU0FKSSxFQUtKOEYsS0FMSSxDQUtFLFVBQUNDLEdBQUQ7QUFBQSxpQkFBU2xLLE9BQU8ySyxlQUFQLENBQXVCVCxHQUF2QixFQUE0QnhHLE1BQTVCLENBQVQ7QUFBQSxTQUxGLENBQVA7QUFNRDtBQUNGLEtBaENELE1BZ0NPO0FBQ0wsVUFBRy9DLFFBQVFxTCxHQUFSLENBQVluSCxPQUFaLENBQW9CLEtBQXBCLE1BQTZCLENBQWhDLEVBQWtDO0FBQ2hDLFlBQUk0RyxTQUFTeEcsRUFBRUMsTUFBRixDQUFTbEYsT0FBT3VGLFFBQVAsQ0FBZ0I2RSxNQUFoQixDQUF1QlMsS0FBaEMsRUFBc0MsRUFBQzhDLFVBQVVoTixRQUFRcUwsR0FBUixDQUFZNEIsTUFBWixDQUFtQixDQUFuQixDQUFYLEVBQXRDLEVBQXlFLENBQXpFLENBQWI7QUFDQSxlQUFPcE4sWUFBWTRKLE1BQVosR0FBcUJxTSxHQUFyQixDQUF5QmhMLE1BQXpCLEVBQ0ovQixJQURJLENBQ0MsWUFBTTtBQUNWO0FBQ0EvSSxrQkFBUXdELE9BQVIsR0FBZ0IsS0FBaEI7QUFDRCxTQUpJLEVBS0o4RixLQUxJLENBS0UsVUFBQ0MsR0FBRDtBQUFBLGlCQUFTbEssT0FBTzJLLGVBQVAsQ0FBdUJULEdBQXZCLEVBQTRCeEcsTUFBNUIsQ0FBVDtBQUFBLFNBTEYsQ0FBUDtBQU1ELE9BUkQsTUFTSyxJQUFHL0MsUUFBUXVELEdBQVIsSUFBZXZELFFBQVF1VixHQUExQixFQUE4QjtBQUNqQyxlQUFPMVYsWUFBWXNJLE1BQVosQ0FBbUJwRixNQUFuQixFQUEyQi9DLFFBQVFxTCxHQUFuQyxFQUF1QyxDQUF2QyxFQUNKdEMsSUFESSxDQUNDLFlBQU07QUFDVi9JLGtCQUFRd0QsT0FBUixHQUFnQixLQUFoQjtBQUNBbkUsaUJBQU93VSxjQUFQLENBQXNCOVEsTUFBdEI7QUFDRCxTQUpJLEVBS0p1RyxLQUxJLENBS0UsVUFBQ0MsR0FBRDtBQUFBLGlCQUFTbEssT0FBTzJLLGVBQVAsQ0FBdUJULEdBQXZCLEVBQTRCeEcsTUFBNUIsQ0FBVDtBQUFBLFNBTEYsQ0FBUDtBQU1ELE9BUEksTUFPRTtBQUNMLGVBQU9sRCxZQUFZdUksT0FBWixDQUFvQnJGLE1BQXBCLEVBQTRCL0MsUUFBUXFMLEdBQXBDLEVBQXdDLENBQXhDLEVBQ0p0QyxJQURJLENBQ0MsWUFBTTtBQUNWL0ksa0JBQVF3RCxPQUFSLEdBQWdCLEtBQWhCO0FBQ0FuRSxpQkFBT3dVLGNBQVAsQ0FBc0I5USxNQUF0QjtBQUNELFNBSkksRUFLSnVHLEtBTEksQ0FLRSxVQUFDQyxHQUFEO0FBQUEsaUJBQVNsSyxPQUFPMkssZUFBUCxDQUF1QlQsR0FBdkIsRUFBNEJ4RyxNQUE1QixDQUFUO0FBQUEsU0FMRixDQUFQO0FBTUQ7QUFDRjtBQUNGLEdBM0REOztBQTZEQTFELFNBQU8wVyxjQUFQLEdBQXdCLFVBQVM3RSxZQUFULEVBQXNCQyxJQUF0QixFQUEyQjtBQUNqRCxRQUFJO0FBQ0YsVUFBSTZFLGlCQUFpQjFMLEtBQUtDLEtBQUwsQ0FBVzJHLFlBQVgsQ0FBckI7QUFDQTdSLGFBQU91RixRQUFQLEdBQWtCb1IsZUFBZXBSLFFBQWYsSUFBMkIvRSxZQUFZZ0YsS0FBWixFQUE3QztBQUNBeEYsYUFBTzZELE9BQVAsR0FBaUI4UyxlQUFlOVMsT0FBZixJQUEwQnJELFlBQVl1RixjQUFaLEVBQTNDO0FBQ0QsS0FKRCxDQUlFLE9BQU1yRixDQUFOLEVBQVE7QUFDUjtBQUNBVixhQUFPMkssZUFBUCxDQUF1QmpLLENBQXZCO0FBQ0Q7QUFDRixHQVREOztBQVdBVixTQUFPNFcsY0FBUCxHQUF3QixZQUFVO0FBQ2hDLFFBQUkvUyxVQUFVOUQsUUFBUWlOLElBQVIsQ0FBYWhOLE9BQU82RCxPQUFwQixDQUFkO0FBQ0FvQixNQUFFbUUsSUFBRixDQUFPdkYsT0FBUCxFQUFnQixVQUFDSCxNQUFELEVBQVNtVCxDQUFULEVBQWU7QUFDN0JoVCxjQUFRZ1QsQ0FBUixFQUFXaEssTUFBWCxHQUFvQixFQUFwQjtBQUNBaEosY0FBUWdULENBQVIsRUFBVzVTLE1BQVgsR0FBb0IsS0FBcEI7QUFDRCxLQUhEO0FBSUEsV0FBTyxrQ0FBa0M2UyxtQkFBbUI3TCxLQUFLMkosU0FBTCxDQUFlLEVBQUMsWUFBWTVVLE9BQU91RixRQUFwQixFQUE2QixXQUFXMUIsT0FBeEMsRUFBZixDQUFuQixDQUF6QztBQUNELEdBUEQ7O0FBU0E3RCxTQUFPK1csYUFBUCxHQUF1QixVQUFTQyxVQUFULEVBQW9CO0FBQ3pDLFFBQUcsQ0FBQ2hYLE9BQU91RixRQUFQLENBQWdCMFIsT0FBcEIsRUFDRWpYLE9BQU91RixRQUFQLENBQWdCMFIsT0FBaEIsR0FBMEIsRUFBMUI7QUFDRjtBQUNBLFFBQUdELFdBQVduUyxPQUFYLENBQW1CLEtBQW5CLE1BQThCLENBQUMsQ0FBbEMsRUFDRW1TLGNBQWNoWCxPQUFPNkIsR0FBUCxDQUFXQyxJQUF6QjtBQUNGLFFBQUlvVixXQUFXLEVBQWY7QUFDQSxRQUFJQyxjQUFjLEVBQWxCO0FBQ0FsUyxNQUFFbUUsSUFBRixDQUFPcEosT0FBTzZELE9BQWQsRUFBdUIsVUFBQ0gsTUFBRCxFQUFTbVQsQ0FBVCxFQUFlO0FBQ3BDTSxvQkFBY3pULE9BQU8yRixPQUFQLEdBQWlCM0YsT0FBTzJGLE9BQVAsQ0FBZXpKLEdBQWYsQ0FBbUJnRixPQUFuQixDQUEyQixpQkFBM0IsRUFBOEMsRUFBOUMsQ0FBakIsR0FBcUUsU0FBbkY7QUFDQSxVQUFJd1MsZ0JBQWdCblMsRUFBRTZHLElBQUYsQ0FBT29MLFFBQVAsRUFBZ0IsRUFBQy9WLE1BQU1nVyxXQUFQLEVBQWhCLENBQXBCO0FBQ0EsVUFBRyxDQUFDQyxhQUFKLEVBQWtCO0FBQ2hCRixpQkFBU3hPLElBQVQsQ0FBYztBQUNadkgsZ0JBQU1nVyxXQURNO0FBRVpyVixnQkFBTWtWLFVBRk07QUFHWkssbUJBQVMsRUFIRztBQUlaOVgsbUJBQVMsRUFKRztBQUtaK1gsb0JBQVUsS0FMRTtBQU1aQyxjQUFLUCxXQUFXblMsT0FBWCxDQUFtQixJQUFuQixNQUE2QixDQUFDLENBQS9CLEdBQW9DLElBQXBDLEdBQTJDO0FBTm5DLFNBQWQ7QUFRQXVTLHdCQUFnQm5TLEVBQUU2RyxJQUFGLENBQU9vTCxRQUFQLEVBQWdCLEVBQUMvVixNQUFLZ1csV0FBTixFQUFoQixDQUFoQjtBQUNEO0FBQ0QsVUFBSXZXLFNBQVVaLE9BQU91RixRQUFQLENBQWdCRSxPQUFoQixDQUF3QkUsSUFBeEIsSUFBOEIsR0FBL0IsR0FBc0N6RixRQUFRLFdBQVIsRUFBcUJ3RCxPQUFPMEksSUFBUCxDQUFZeEwsTUFBakMsQ0FBdEMsR0FBaUY4QyxPQUFPMEksSUFBUCxDQUFZeEwsTUFBMUc7QUFDQThDLGFBQU8wSSxJQUFQLENBQVlLLE1BQVosR0FBcUIxSCxXQUFXckIsT0FBTzBJLElBQVAsQ0FBWUssTUFBdkIsQ0FBckI7QUFDQSxVQUFJQSxTQUFVek0sT0FBT3VGLFFBQVAsQ0FBZ0JFLE9BQWhCLENBQXdCRSxJQUF4QixJQUE4QixHQUE5QixJQUFxQyxDQUFDLENBQUNqQyxPQUFPMEksSUFBUCxDQUFZSyxNQUFwRCxHQUE4RHZNLFFBQVEsT0FBUixFQUFpQndELE9BQU8wSSxJQUFQLENBQVlLLE1BQVosR0FBbUIsS0FBcEMsRUFBMEMsQ0FBMUMsQ0FBOUQsR0FBNkcvSSxPQUFPMEksSUFBUCxDQUFZSyxNQUF0STtBQUNBLFVBQUdqTSxZQUFZc04sS0FBWixDQUFrQnBLLE9BQU8yRixPQUF6QixLQUFxQ3JKLE9BQU82QixHQUFQLENBQVdNLFdBQW5ELEVBQStEO0FBQzdEaVYsc0JBQWM3WCxPQUFkLENBQXNCbUosSUFBdEIsQ0FBMkIsMEJBQTNCO0FBQ0Q7QUFDRCxVQUFHLENBQUNzTyxXQUFXblMsT0FBWCxDQUFtQixLQUFuQixNQUE4QixDQUFDLENBQS9CLElBQW9DckUsWUFBWXNOLEtBQVosQ0FBa0JwSyxPQUFPMkYsT0FBekIsQ0FBckMsTUFDQXJKLE9BQU91RixRQUFQLENBQWdCMFIsT0FBaEIsQ0FBd0JPLEdBQXhCLElBQStCOVQsT0FBTzBJLElBQVAsQ0FBWXRLLElBQVosQ0FBaUIrQyxPQUFqQixDQUF5QixLQUF6QixNQUFvQyxDQUFDLENBRHBFLEtBRUR1UyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLHFCQUE5QixNQUF5RCxDQUFDLENBRjVELEVBRThEO0FBQzFEdVMsc0JBQWM3WCxPQUFkLENBQXNCbUosSUFBdEIsQ0FBMkIsMkNBQTNCO0FBQ0EwTyxzQkFBYzdYLE9BQWQsQ0FBc0JtSixJQUF0QixDQUEyQixxQkFBM0I7QUFDSCxPQUxELE1BS08sSUFBRyxDQUFDbEksWUFBWXNOLEtBQVosQ0FBa0JwSyxPQUFPMkYsT0FBekIsQ0FBRCxLQUNQckosT0FBT3VGLFFBQVAsQ0FBZ0IwUixPQUFoQixDQUF3Qk8sR0FBeEIsSUFBK0I5VCxPQUFPMEksSUFBUCxDQUFZdEssSUFBWixDQUFpQitDLE9BQWpCLENBQXlCLEtBQXpCLE1BQW9DLENBQUMsQ0FEN0QsS0FFUnVTLGNBQWM3WCxPQUFkLENBQXNCc0YsT0FBdEIsQ0FBOEIsa0JBQTlCLE1BQXNELENBQUMsQ0FGbEQsRUFFb0Q7QUFDdkR1UyxzQkFBYzdYLE9BQWQsQ0FBc0JtSixJQUF0QixDQUEyQixtREFBM0I7QUFDQTBPLHNCQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLGtCQUEzQjtBQUNIO0FBQ0QsVUFBRzFJLE9BQU91RixRQUFQLENBQWdCMFIsT0FBaEIsQ0FBd0JRLE9BQXhCLElBQW1DL1QsT0FBTzBJLElBQVAsQ0FBWXRLLElBQVosQ0FBaUIrQyxPQUFqQixDQUF5QixTQUF6QixNQUF3QyxDQUFDLENBQS9FLEVBQWlGO0FBQy9FLFlBQUd1UyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLHNCQUE5QixNQUEwRCxDQUFDLENBQTlELEVBQ0V1UyxjQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLHNCQUEzQjtBQUNGLFlBQUcwTyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLGdDQUE5QixNQUFvRSxDQUFDLENBQXhFLEVBQ0V1UyxjQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLGdDQUEzQjtBQUNIO0FBQ0QsVUFBRzFJLE9BQU91RixRQUFQLENBQWdCMFIsT0FBaEIsQ0FBd0JTLEdBQXhCLElBQStCaFUsT0FBTzBJLElBQVAsQ0FBWXRLLElBQVosQ0FBaUIrQyxPQUFqQixDQUF5QixRQUF6QixNQUF1QyxDQUFDLENBQTFFLEVBQTRFO0FBQzFFLFlBQUd1UyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLG1CQUE5QixNQUF1RCxDQUFDLENBQTNELEVBQ0V1UyxjQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLG1CQUEzQjtBQUNGLFlBQUcwTyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLDhCQUE5QixNQUFrRSxDQUFDLENBQXRFLEVBQ0V1UyxjQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLDhCQUEzQjtBQUNIO0FBQ0Q7QUFDQSxVQUFHaEYsT0FBTzBJLElBQVAsQ0FBWUosR0FBWixDQUFnQm5ILE9BQWhCLENBQXdCLEdBQXhCLE1BQWlDLENBQWpDLElBQXNDdVMsY0FBYzdYLE9BQWQsQ0FBc0JzRixPQUF0QixDQUE4QiwrQkFBOUIsTUFBbUUsQ0FBQyxDQUE3RyxFQUErRztBQUM3R3VTLHNCQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLGlEQUEzQjtBQUNBLFlBQUcwTyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLHNCQUE5QixNQUEwRCxDQUFDLENBQTlELEVBQ0V1UyxjQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLG1CQUEzQjtBQUNGLFlBQUcwTyxjQUFjN1gsT0FBZCxDQUFzQnNGLE9BQXRCLENBQThCLCtCQUE5QixNQUFtRSxDQUFDLENBQXZFLEVBQ0V1UyxjQUFjN1gsT0FBZCxDQUFzQm1KLElBQXRCLENBQTJCLCtCQUEzQjtBQUNIO0FBQ0Q7QUFDQSxVQUFJaVAsYUFBYWpVLE9BQU8wSSxJQUFQLENBQVl0SyxJQUE3QjtBQUNBLFVBQUk0QixPQUFPMEksSUFBUCxDQUFZQyxHQUFoQixFQUNFc0wsY0FBY2pVLE9BQU8wSSxJQUFQLENBQVlDLEdBQTFCOztBQUVGLFVBQUkzSSxPQUFPMEksSUFBUCxDQUFZOUgsS0FBaEIsRUFBdUJxVCxjQUFjLE1BQU1qVSxPQUFPMEksSUFBUCxDQUFZOUgsS0FBaEM7QUFDdkI4UyxvQkFBY0MsT0FBZCxDQUFzQjNPLElBQXRCLENBQTJCLHlCQUF1QmhGLE9BQU92QyxJQUFQLENBQVl5RCxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxFQUF2QyxDQUF2QixHQUFrRSxRQUFsRSxHQUEyRWxCLE9BQU8wSSxJQUFQLENBQVlKLEdBQXZGLEdBQTJGLFFBQTNGLEdBQW9HMkwsVUFBcEcsR0FBK0csS0FBL0csR0FBcUhsTCxNQUFySCxHQUE0SCxJQUF2SjtBQUNBMkssb0JBQWNDLE9BQWQsQ0FBc0IzTyxJQUF0QixDQUEyQixlQUEzQjs7QUFFQSxVQUFJMUksT0FBT3VGLFFBQVAsQ0FBZ0IwUixPQUFoQixDQUF3Qk8sR0FBeEIsSUFBK0I5VCxPQUFPMEksSUFBUCxDQUFZdEssSUFBWixDQUFpQitDLE9BQWpCLENBQXlCLEtBQXpCLE1BQW9DLENBQUMsQ0FBckMsSUFBMENuQixPQUFPeUssT0FBcEYsRUFBNkY7QUFDM0ZpSixzQkFBY0MsT0FBZCxDQUFzQjNPLElBQXRCLENBQTJCLGdDQUE4QmhGLE9BQU92QyxJQUFQLENBQVl5RCxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxFQUF2QyxDQUE5QixHQUF5RSxpQkFBekUsR0FBMkZsQixPQUFPMEksSUFBUCxDQUFZSixHQUF2RyxHQUEyRyxRQUEzRyxHQUFvSDJMLFVBQXBILEdBQStILEtBQS9ILEdBQXFJbEwsTUFBckksR0FBNEksSUFBdks7QUFDQTJLLHNCQUFjQyxPQUFkLENBQXNCM08sSUFBdEIsQ0FBMkIsZUFBM0I7QUFDRDs7QUFFRDtBQUNBLFVBQUdoRixPQUFPSSxNQUFQLElBQWlCSixPQUFPSSxNQUFQLENBQWNxSSxNQUFsQyxFQUF5QztBQUN2Q2lMLHNCQUFjRSxRQUFkLEdBQXlCLElBQXpCO0FBQ0FGLHNCQUFjQyxPQUFkLENBQXNCM08sSUFBdEIsQ0FBMkIsNEJBQTBCaEYsT0FBT3ZDLElBQVAsQ0FBWXlELE9BQVosQ0FBb0IsaUJBQXBCLEVBQXVDLEVBQXZDLENBQTFCLEdBQXFFLFFBQXJFLEdBQThFbEIsT0FBT0ksTUFBUCxDQUFja0ksR0FBNUYsR0FBZ0csVUFBaEcsR0FBMkdwTCxNQUEzRyxHQUFrSCxHQUFsSCxHQUFzSDhDLE9BQU8wSSxJQUFQLENBQVlNLElBQWxJLEdBQXVJLEdBQXZJLEdBQTJJLENBQUMsQ0FBQ2hKLE9BQU8wSixNQUFQLENBQWNDLEtBQTNKLEdBQWlLLElBQTVMO0FBQ0Q7QUFDRCxVQUFHM0osT0FBT0ssTUFBUCxJQUFpQkwsT0FBT0ssTUFBUCxDQUFjb0ksTUFBbEMsRUFBeUM7QUFDdkNpTCxzQkFBY0UsUUFBZCxHQUF5QixJQUF6QjtBQUNBRixzQkFBY0MsT0FBZCxDQUFzQjNPLElBQXRCLENBQTJCLDRCQUEwQmhGLE9BQU92QyxJQUFQLENBQVl5RCxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxFQUF2QyxDQUExQixHQUFxRSxRQUFyRSxHQUE4RWxCLE9BQU9LLE1BQVAsQ0FBY2lJLEdBQTVGLEdBQWdHLFVBQWhHLEdBQTJHcEwsTUFBM0csR0FBa0gsR0FBbEgsR0FBc0g4QyxPQUFPMEksSUFBUCxDQUFZTSxJQUFsSSxHQUF1SSxHQUF2SSxHQUEySSxDQUFDLENBQUNoSixPQUFPMEosTUFBUCxDQUFjQyxLQUEzSixHQUFpSyxJQUE1TDtBQUNEO0FBQ0YsS0ExRUQ7QUEyRUFwSSxNQUFFbUUsSUFBRixDQUFPOE4sUUFBUCxFQUFpQixVQUFDL0ssTUFBRCxFQUFTMEssQ0FBVCxFQUFlO0FBQzlCLFVBQUkxSyxPQUFPbUwsUUFBUCxJQUFtQm5MLE9BQU9vTCxFQUE5QixFQUFrQztBQUNoQyxZQUFJcEwsT0FBT3JLLElBQVAsQ0FBWStDLE9BQVosQ0FBb0IsSUFBcEIsTUFBOEIsQ0FBQyxDQUFuQyxFQUFzQztBQUNwQ3NILGlCQUFPa0wsT0FBUCxDQUFlTyxPQUFmLENBQXVCLG9CQUF2QjtBQUNBLGNBQUl6TCxPQUFPb0wsRUFBWCxFQUFlO0FBQ2JwTCxtQkFBT2tMLE9BQVAsQ0FBZU8sT0FBZixDQUF1Qix1QkFBdkI7QUFDQXpMLG1CQUFPa0wsT0FBUCxDQUFlTyxPQUFmLENBQXVCLHdCQUF2QjtBQUNBekwsbUJBQU9rTCxPQUFQLENBQWVPLE9BQWYsQ0FBdUIsb0NBQWtDNVgsT0FBT3VGLFFBQVAsQ0FBZ0JnUyxFQUFoQixDQUFtQnBXLElBQXJELEdBQTBELElBQWpGO0FBQ0Q7QUFDRjtBQUNEO0FBQ0EsYUFBSyxJQUFJMFcsSUFBSSxDQUFiLEVBQWdCQSxJQUFJMUwsT0FBT2tMLE9BQVAsQ0FBZS9SLE1BQW5DLEVBQTJDdVMsR0FBM0MsRUFBK0M7QUFDN0MsY0FBSTFMLE9BQU9vTCxFQUFQLElBQWFMLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUJoVCxPQUF2QixDQUErQix3QkFBL0IsTUFBNkQsQ0FBQyxDQUEzRSxJQUNGcVMsU0FBU0wsQ0FBVCxFQUFZUSxPQUFaLENBQW9CUSxDQUFwQixFQUF1QkMsV0FBdkIsR0FBcUNqVCxPQUFyQyxDQUE2QyxVQUE3QyxNQUE2RCxDQUFDLENBRGhFLEVBQ21FO0FBQy9EO0FBQ0FxUyxxQkFBU0wsQ0FBVCxFQUFZUSxPQUFaLENBQW9CUSxDQUFwQixJQUF5QlgsU0FBU0wsQ0FBVCxFQUFZUSxPQUFaLENBQW9CUSxDQUFwQixFQUF1QmpULE9BQXZCLENBQStCLHdCQUEvQixFQUF5RCxtQ0FBekQsQ0FBekI7QUFDSCxXQUpELE1BSU8sSUFBSXVILE9BQU9vTCxFQUFQLElBQWFMLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUJoVCxPQUF2QixDQUErQixpQkFBL0IsTUFBc0QsQ0FBQyxDQUFwRSxJQUNUcVMsU0FBU0wsQ0FBVCxFQUFZUSxPQUFaLENBQW9CUSxDQUFwQixFQUF1QkMsV0FBdkIsR0FBcUNqVCxPQUFyQyxDQUE2QyxTQUE3QyxNQUE0RCxDQUFDLENBRHhELEVBQzJEO0FBQzlEO0FBQ0FxUyxxQkFBU0wsQ0FBVCxFQUFZUSxPQUFaLENBQW9CUSxDQUFwQixJQUF5QlgsU0FBU0wsQ0FBVCxFQUFZUSxPQUFaLENBQW9CUSxDQUFwQixFQUF1QmpULE9BQXZCLENBQStCLGlCQUEvQixFQUFrRCwyQkFBbEQsQ0FBekI7QUFDSCxXQUpNLE1BSUEsSUFBSXNTLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUJoVCxPQUF2QixDQUErQixpQkFBL0IsTUFBc0QsQ0FBQyxDQUEzRCxFQUE4RDtBQUNuRTtBQUNBcVMscUJBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsSUFBeUJYLFNBQVNMLENBQVQsRUFBWVEsT0FBWixDQUFvQlEsQ0FBcEIsRUFBdUJqVCxPQUF2QixDQUErQixpQkFBL0IsRUFBa0Qsd0JBQWxELENBQXpCO0FBQ0Q7QUFDRjtBQUNGO0FBQ0RtVCxxQkFBZTVMLE9BQU9oTCxJQUF0QixFQUE0QmdMLE9BQU9rTCxPQUFuQyxFQUE0Q2xMLE9BQU9tTCxRQUFuRCxFQUE2RG5MLE9BQU81TSxPQUFwRSxFQUE2RSxjQUFZeVgsVUFBekY7QUFDRCxLQTNCRDtBQTRCRCxHQS9HRDs7QUFpSEEsV0FBU2UsY0FBVCxDQUF3QjVXLElBQXhCLEVBQThCa1csT0FBOUIsRUFBdUNXLFdBQXZDLEVBQW9EelksT0FBcEQsRUFBNkQ0TSxNQUE3RCxFQUFvRTtBQUNsRTtBQUNBLFFBQUk4TCwyQkFBMkJ6WCxZQUFZNEosTUFBWixHQUFxQjhOLFVBQXJCLEVBQS9CO0FBQ0EsUUFBSUMsVUFBVSx5RUFBdUVuWSxPQUFPd0MsR0FBUCxDQUFXdVMsY0FBbEYsR0FBaUcsR0FBakcsR0FBcUdwRixTQUFTQyxNQUFULENBQWdCLHFCQUFoQixDQUFyRyxHQUE0SSxPQUE1SSxHQUFvSnpPLElBQXBKLEdBQXlKLFFBQXZLO0FBQ0FiLFVBQU04WCxHQUFOLENBQVUsb0JBQWtCak0sTUFBbEIsR0FBeUIsR0FBekIsR0FBNkJBLE1BQTdCLEdBQW9DLE1BQTlDLEVBQ0d6QyxJQURILENBQ1Esb0JBQVk7QUFDaEI7QUFDQWMsZUFBU3VGLElBQVQsR0FBZ0JvSSxVQUFRM04sU0FBU3VGLElBQVQsQ0FDckJuTCxPQURxQixDQUNiLGNBRGEsRUFDR3lTLFFBQVEvUixNQUFSLEdBQWlCK1IsUUFBUWdCLElBQVIsQ0FBYSxJQUFiLENBQWpCLEdBQXNDLEVBRHpDLEVBRXJCelQsT0FGcUIsQ0FFYixjQUZhLEVBRUdyRixRQUFRK0YsTUFBUixHQUFpQi9GLFFBQVE4WSxJQUFSLENBQWEsSUFBYixDQUFqQixHQUFzQyxFQUZ6QyxFQUdyQnpULE9BSHFCLENBR2IsY0FIYSxFQUdHNUUsT0FBT3dDLEdBQVAsQ0FBV3VTLGNBSGQsRUFJckJuUSxPQUpxQixDQUliLHdCQUphLEVBSWFxVCx3QkFKYixFQUtyQnJULE9BTHFCLENBS2IsdUJBTGEsRUFLWTVFLE9BQU91RixRQUFQLENBQWdCMEwsYUFBaEIsQ0FBOEI1RCxLQUwxQyxDQUF4Qjs7QUFPQTtBQUNBLFVBQUdsQixPQUFPdEgsT0FBUCxDQUFlLEtBQWYsTUFBMEIsQ0FBQyxDQUE5QixFQUFnQztBQUM5QixZQUFHN0UsT0FBTzZCLEdBQVAsQ0FBV0UsSUFBZCxFQUFtQjtBQUNqQnlJLG1CQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLFdBQXRCLEVBQW1DNUUsT0FBTzZCLEdBQVAsQ0FBV0UsSUFBOUMsQ0FBaEI7QUFDRDtBQUNELFlBQUcvQixPQUFPNkIsR0FBUCxDQUFXRyxTQUFkLEVBQXdCO0FBQ3RCd0ksbUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0IsZ0JBQXRCLEVBQXdDNUUsT0FBTzZCLEdBQVAsQ0FBV0csU0FBbkQsQ0FBaEI7QUFDRDtBQUNELFlBQUdoQyxPQUFPNkIsR0FBUCxDQUFXSyxZQUFkLEVBQTJCO0FBQ3pCc0ksbUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0IsbUJBQXRCLEVBQTJDMFQsSUFBSXRZLE9BQU82QixHQUFQLENBQVdLLFlBQWYsQ0FBM0MsQ0FBaEI7QUFDRCxTQUZELE1BRU87QUFDTHNJLG1CQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLG1CQUF0QixFQUEyQzBULElBQUksU0FBSixDQUEzQyxDQUFoQjtBQUNEO0FBQ0QsWUFBR3RZLE9BQU82QixHQUFQLENBQVdJLFFBQWQsRUFBdUI7QUFDckJ1SSxtQkFBU3VGLElBQVQsR0FBZ0J2RixTQUFTdUYsSUFBVCxDQUFjbkwsT0FBZCxDQUFzQixlQUF0QixFQUF1QzVFLE9BQU82QixHQUFQLENBQVdJLFFBQWxELENBQWhCO0FBQ0QsU0FGRCxNQUVPO0FBQ0x1SSxtQkFBU3VGLElBQVQsR0FBZ0J2RixTQUFTdUYsSUFBVCxDQUFjbkwsT0FBZCxDQUFzQixlQUF0QixFQUF1QyxPQUF2QyxDQUFoQjtBQUNEO0FBQ0YsT0FqQkQsTUFpQk87QUFDTDRGLGlCQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLGVBQXRCLEVBQXVDekQsS0FBS3lELE9BQUwsQ0FBYSxRQUFiLEVBQXNCLEVBQXRCLENBQXZDLENBQWhCO0FBQ0Q7QUFDRCxVQUFJdUgsT0FBT3RILE9BQVAsQ0FBZSxTQUFmLE1BQStCLENBQUMsQ0FBcEMsRUFBc0M7QUFDcEM7QUFDQSxZQUFJMFQsaUNBQStCdlksT0FBT3VGLFFBQVAsQ0FBZ0JPLE9BQWhCLENBQXdCcUssUUFBdkQseUJBQUo7QUFDQTNGLGlCQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLHlCQUF0QixFQUFpRDJULGlCQUFqRCxDQUFoQjtBQUNBL04saUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0IsbUJBQXRCLEVBQTJDLDBCQUF3QitELEtBQUszSSxPQUFPdUYsUUFBUCxDQUFnQk8sT0FBaEIsQ0FBd0JxSyxRQUF4QixDQUFpQ3FJLElBQWpDLEtBQXdDLEdBQXhDLEdBQTRDeFksT0FBT3VGLFFBQVAsQ0FBZ0JPLE9BQWhCLENBQXdCc0ssT0FBeEIsQ0FBZ0NvSSxJQUFoQyxFQUFqRCxDQUFuRSxDQUFoQjtBQUNELE9BTEQsTUFNSyxJQUFJck0sT0FBT3RILE9BQVAsQ0FBZSxPQUFmLE1BQTZCLENBQUMsQ0FBbEMsRUFBb0M7QUFDdkM7QUFDQTJGLGlCQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLGNBQXRCLEVBQXNDLGdCQUFjNUUsT0FBT3VGLFFBQVAsQ0FBZ0JnUyxFQUFoQixDQUFtQm5ILE9BQW5CLENBQTJCb0ksSUFBM0IsRUFBcEQsQ0FBaEI7QUFDRCxPQUhJLE1BSUEsSUFBSXJNLE9BQU90SCxPQUFQLENBQWUsVUFBZixNQUErQixDQUFDLENBQXBDLEVBQXNDO0FBQ3pDO0FBQ0EsWUFBSTBULHlCQUF1QnZZLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJsUCxHQUFwRDtBQUNBLFlBQUdJLE9BQU84TyxRQUFQLENBQWdCQyxlQUFoQixFQUFILEVBQXFDO0FBQ25Dd0osK0JBQXFCLE1BQXJCO0FBQ0EsY0FBR3BNLE9BQU90SCxPQUFQLENBQWUsS0FBZixNQUEwQixDQUFDLENBQTlCLEVBQWdDO0FBQzlCO0FBQ0EsZ0JBQUcwVCxrQkFBa0IxVCxPQUFsQixDQUEwQixRQUExQixNQUF3QyxDQUEzQyxFQUNFMFQsb0JBQW9CQSxrQkFBa0IzVCxPQUFsQixDQUEwQixRQUExQixFQUFtQyxPQUFuQyxDQUFwQjtBQUNGNEYscUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0Isb0JBQXRCLEVBQTRDK0QsS0FBSzNJLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJ4RSxJQUF6QixDQUE4QmtPLElBQTlCLEtBQXFDLEdBQXJDLEdBQXlDeFksT0FBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5QnZFLElBQXpCLENBQThCaU8sSUFBOUIsRUFBOUMsQ0FBNUMsQ0FBaEI7QUFDQWhPLHFCQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLGNBQXRCLEVBQXNDNUUsT0FBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5QnZFLElBQS9ELENBQWhCO0FBQ0QsV0FORCxNQU1PO0FBQ0xDLHFCQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLG9CQUF0QixFQUE0QywwQkFBd0IrRCxLQUFLM0ksT0FBT3VGLFFBQVAsQ0FBZ0J1SixRQUFoQixDQUF5QnhFLElBQXpCLENBQThCa08sSUFBOUIsS0FBcUMsR0FBckMsR0FBeUN4WSxPQUFPdUYsUUFBUCxDQUFnQnVKLFFBQWhCLENBQXlCdkUsSUFBekIsQ0FBOEJpTyxJQUE5QixFQUE5QyxDQUFwRSxDQUFoQjtBQUNBLGdCQUFJQyx5QkFBeUIsOEJBQTdCO0FBQ0FBLHNDQUEwQixvQ0FBa0N6WSxPQUFPdUYsUUFBUCxDQUFnQnVKLFFBQWhCLENBQXlCdkUsSUFBM0QsR0FBZ0UsTUFBMUY7QUFDQUMscUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0IsMkJBQXRCLEVBQW1ENlQsc0JBQW5ELENBQWhCO0FBQ0Q7QUFDRixTQWRELE1BY087QUFDTCxjQUFJLENBQUMsQ0FBQ3pZLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUI0SixJQUEvQixFQUNFSCwyQkFBeUJ2WSxPQUFPdUYsUUFBUCxDQUFnQnVKLFFBQWhCLENBQXlCNEosSUFBbEQ7QUFDRkgsK0JBQXFCLFNBQXJCO0FBQ0E7QUFDQSxjQUFHLENBQUMsQ0FBQ3ZZLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJ4RSxJQUEzQixJQUFtQyxDQUFDLENBQUN0SyxPQUFPdUYsUUFBUCxDQUFnQnVKLFFBQWhCLENBQXlCdkUsSUFBakUsRUFDQWdPLDRCQUEwQnZZLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJ4RSxJQUFuRCxXQUE2RHRLLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJ2RSxJQUF0RjtBQUNBO0FBQ0FnTywrQkFBcUIsU0FBT3ZZLE9BQU91RixRQUFQLENBQWdCdUosUUFBaEIsQ0FBeUJPLEVBQXpCLElBQStCLGFBQVdNLFNBQVNDLE1BQVQsQ0FBZ0IsWUFBaEIsQ0FBakQsQ0FBckI7QUFDQXBGLG1CQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLG9CQUF0QixFQUE0QyxFQUE1QyxDQUFoQjtBQUNEO0FBQ0Q0RixpQkFBU3VGLElBQVQsR0FBZ0J2RixTQUFTdUYsSUFBVCxDQUFjbkwsT0FBZCxDQUFzQiwwQkFBdEIsRUFBa0QyVCxpQkFBbEQsQ0FBaEI7QUFDRDtBQUNELFVBQUl2WSxPQUFPdUYsUUFBUCxDQUFnQjBSLE9BQWhCLENBQXdCMEIsR0FBNUIsRUFBaUM7QUFDL0JuTyxpQkFBU3VGLElBQVQsR0FBZ0J2RixTQUFTdUYsSUFBVCxDQUFjbkwsT0FBZCxDQUFzQixZQUF0QixFQUFvQyxFQUFwQyxDQUFoQjtBQUNEO0FBQ0QsVUFBR3JGLFFBQVFzRixPQUFSLENBQWdCLGtCQUFoQixNQUF3QyxDQUFDLENBQXpDLElBQThDdEYsUUFBUXNGLE9BQVIsQ0FBZ0IscUJBQWhCLE1BQTJDLENBQUMsQ0FBN0YsRUFBK0Y7QUFDN0YyRixpQkFBU3VGLElBQVQsR0FBZ0J2RixTQUFTdUYsSUFBVCxDQUFjbkwsT0FBZCxDQUFzQixZQUF0QixFQUFvQyxFQUFwQyxDQUFoQjtBQUNEO0FBQ0QsVUFBR3JGLFFBQVFzRixPQUFSLENBQWdCLGdDQUFoQixNQUFzRCxDQUFDLENBQTFELEVBQTREO0FBQzFEMkYsaUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0IsZ0JBQXRCLEVBQXdDLEVBQXhDLENBQWhCO0FBQ0Q7QUFDRCxVQUFHckYsUUFBUXNGLE9BQVIsQ0FBZ0IsK0JBQWhCLE1BQXFELENBQUMsQ0FBekQsRUFBMkQ7QUFDekQyRixpQkFBU3VGLElBQVQsR0FBZ0J2RixTQUFTdUYsSUFBVCxDQUFjbkwsT0FBZCxDQUFzQixZQUF0QixFQUFvQyxFQUFwQyxDQUFoQjtBQUNEO0FBQ0QsVUFBR3JGLFFBQVFzRixPQUFSLENBQWdCLDhCQUFoQixNQUFvRCxDQUFDLENBQXhELEVBQTBEO0FBQ3hEMkYsaUJBQVN1RixJQUFULEdBQWdCdkYsU0FBU3VGLElBQVQsQ0FBY25MLE9BQWQsQ0FBc0IsZUFBdEIsRUFBdUMsRUFBdkMsQ0FBaEI7QUFDRDtBQUNELFVBQUdvVCxXQUFILEVBQWU7QUFDYnhOLGlCQUFTdUYsSUFBVCxHQUFnQnZGLFNBQVN1RixJQUFULENBQWNuTCxPQUFkLENBQXNCLGlCQUF0QixFQUF5QyxFQUF6QyxDQUFoQjtBQUNEO0FBQ0QsVUFBSWdVLGVBQWVuWCxTQUFTb1gsYUFBVCxDQUF1QixHQUF2QixDQUFuQjtBQUNBRCxtQkFBYUUsWUFBYixDQUEwQixVQUExQixFQUFzQzNNLFNBQU8sR0FBUCxHQUFXaEwsSUFBWCxHQUFnQixHQUFoQixHQUFvQm5CLE9BQU93QyxHQUFQLENBQVd1UyxjQUEvQixHQUE4QyxNQUFwRjtBQUNBNkQsbUJBQWFFLFlBQWIsQ0FBMEIsTUFBMUIsRUFBa0MsaUNBQWlDaEMsbUJBQW1CdE0sU0FBU3VGLElBQTVCLENBQW5FO0FBQ0E2SSxtQkFBYUcsS0FBYixDQUFtQkMsT0FBbkIsR0FBNkIsTUFBN0I7QUFDQXZYLGVBQVN3WCxJQUFULENBQWNDLFdBQWQsQ0FBMEJOLFlBQTFCO0FBQ0FBLG1CQUFhTyxLQUFiO0FBQ0ExWCxlQUFTd1gsSUFBVCxDQUFjRyxXQUFkLENBQTBCUixZQUExQjtBQUNELEtBaEdILEVBaUdHM08sS0FqR0gsQ0FpR1MsZUFBTztBQUNaakssYUFBTzJLLGVBQVAsZ0NBQW9EVCxJQUFJdEgsT0FBeEQ7QUFDRCxLQW5HSDtBQW9HRDs7QUFFRDVDLFNBQU9xWixZQUFQLEdBQXNCLFlBQVU7QUFDOUJyWixXQUFPdUYsUUFBUCxDQUFnQitULFNBQWhCLEdBQTRCLEVBQTVCO0FBQ0E5WSxnQkFBWStZLEVBQVosR0FDRzdQLElBREgsQ0FDUSxvQkFBWTtBQUNoQjFKLGFBQU91RixRQUFQLENBQWdCK1QsU0FBaEIsR0FBNEI5TyxTQUFTK08sRUFBckM7QUFDRCxLQUhILEVBSUd0UCxLQUpILENBSVMsZUFBTztBQUNaakssYUFBTzJLLGVBQVAsQ0FBdUJULEdBQXZCO0FBQ0QsS0FOSDtBQU9ELEdBVEQ7O0FBV0FsSyxTQUFPb04sTUFBUCxHQUFnQixVQUFTMUosTUFBVCxFQUFnQjBRLEtBQWhCLEVBQXNCOztBQUVwQztBQUNBLFFBQUcsQ0FBQ0EsS0FBRCxJQUFVMVEsTUFBVixJQUFvQixDQUFDQSxPQUFPMEksSUFBUCxDQUFZRSxHQUFqQyxJQUNFdE0sT0FBT3VGLFFBQVAsQ0FBZ0IwTCxhQUFoQixDQUE4QkMsRUFBOUIsS0FBcUMsS0FEMUMsRUFDZ0Q7QUFDNUM7QUFDSDtBQUNELFFBQUk4QixPQUFPLElBQUl2SyxJQUFKLEVBQVg7QUFDQTtBQUNBLFFBQUk3RixPQUFKO0FBQUEsUUFDRTRXLE9BQU8sZ0NBRFQ7QUFBQSxRQUVFL0gsUUFBUSxNQUZWOztBQUlBLFFBQUcvTixVQUFVLENBQUMsS0FBRCxFQUFPLE9BQVAsRUFBZSxPQUFmLEVBQXVCLFdBQXZCLEVBQW9DbUIsT0FBcEMsQ0FBNENuQixPQUFPNUIsSUFBbkQsTUFBMkQsQ0FBQyxDQUF6RSxFQUNFMFgsT0FBTyxpQkFBZTlWLE9BQU81QixJQUF0QixHQUEyQixNQUFsQzs7QUFFRjtBQUNBLFFBQUc0QixVQUFVQSxPQUFPME4sR0FBakIsSUFBd0IxTixPQUFPSSxNQUFQLENBQWNLLE9BQXpDLEVBQ0U7O0FBRUYsUUFBSW1SLGVBQWdCNVIsVUFBVUEsT0FBTzBJLElBQWxCLEdBQTBCMUksT0FBTzBJLElBQVAsQ0FBWWxMLE9BQXRDLEdBQWdELENBQW5FO0FBQ0EsUUFBSXFVLFdBQVcsTUFBZjtBQUNBO0FBQ0EsUUFBRzdSLFVBQVUsQ0FBQyxDQUFDbEQsWUFBWTBOLFdBQVosQ0FBd0J4SyxPQUFPMEksSUFBUCxDQUFZdEssSUFBcEMsRUFBMENxTSxPQUF0RCxJQUFpRSxPQUFPekssT0FBT3lLLE9BQWQsSUFBeUIsV0FBN0YsRUFBeUc7QUFDdkdtSCxxQkFBZTVSLE9BQU95SyxPQUF0QjtBQUNBb0gsaUJBQVcsR0FBWDtBQUNELEtBSEQsTUFHTyxJQUFHN1IsTUFBSCxFQUFVO0FBQ2ZBLGFBQU9tSixNQUFQLENBQWNuRSxJQUFkLENBQW1CLENBQUNzSyxLQUFLd0MsT0FBTCxFQUFELEVBQWdCRixZQUFoQixDQUFuQjtBQUNEOztBQUVELFFBQUcsQ0FBQyxDQUFDbEIsS0FBTCxFQUFXO0FBQUU7QUFDWCxVQUFHLENBQUNwVSxPQUFPdUYsUUFBUCxDQUFnQjBMLGFBQWhCLENBQThCbkUsTUFBbEMsRUFDRTtBQUNGLFVBQUdzSCxNQUFNRyxFQUFULEVBQ0UzUixVQUFVLHNCQUFWLENBREYsS0FFSyxJQUFHLENBQUMsQ0FBQ3dSLE1BQU1mLEtBQVgsRUFDSHpRLFVBQVUsaUJBQWV3UixNQUFNZixLQUFyQixHQUEyQixNQUEzQixHQUFrQ2UsTUFBTWxCLEtBQWxELENBREcsS0FHSHRRLFVBQVUsaUJBQWV3UixNQUFNbEIsS0FBL0I7QUFDSCxLQVRELE1BVUssSUFBR3hQLFVBQVVBLE9BQU95TixJQUFwQixFQUF5QjtBQUM1QixVQUFHLENBQUNuUixPQUFPdUYsUUFBUCxDQUFnQjBMLGFBQWhCLENBQThCRSxJQUEvQixJQUF1Q25SLE9BQU91RixRQUFQLENBQWdCMEwsYUFBaEIsQ0FBOEJJLElBQTlCLElBQW9DLE1BQTlFLEVBQ0U7QUFDRnpPLGdCQUFVYyxPQUFPdkMsSUFBUCxHQUFZLE1BQVosR0FBbUJqQixRQUFRLE9BQVIsRUFBaUJ3RCxPQUFPeU4sSUFBUCxHQUFZek4sT0FBTzBJLElBQVAsQ0FBWU0sSUFBekMsRUFBOEMsQ0FBOUMsQ0FBbkIsR0FBb0U2SSxRQUFwRSxHQUE2RSxPQUF2RjtBQUNBOUQsY0FBUSxRQUFSO0FBQ0F6UixhQUFPdUYsUUFBUCxDQUFnQjBMLGFBQWhCLENBQThCSSxJQUE5QixHQUFtQyxNQUFuQztBQUNELEtBTkksTUFPQSxJQUFHM04sVUFBVUEsT0FBTzBOLEdBQXBCLEVBQXdCO0FBQzNCLFVBQUcsQ0FBQ3BSLE9BQU91RixRQUFQLENBQWdCMEwsYUFBaEIsQ0FBOEJHLEdBQS9CLElBQXNDcFIsT0FBT3VGLFFBQVAsQ0FBZ0IwTCxhQUFoQixDQUE4QkksSUFBOUIsSUFBb0MsS0FBN0UsRUFDRTtBQUNGek8sZ0JBQVVjLE9BQU92QyxJQUFQLEdBQVksTUFBWixHQUFtQmpCLFFBQVEsT0FBUixFQUFpQndELE9BQU8wTixHQUFQLEdBQVcxTixPQUFPMEksSUFBUCxDQUFZTSxJQUF4QyxFQUE2QyxDQUE3QyxDQUFuQixHQUFtRTZJLFFBQW5FLEdBQTRFLE1BQXRGO0FBQ0E5RCxjQUFRLFNBQVI7QUFDQXpSLGFBQU91RixRQUFQLENBQWdCMEwsYUFBaEIsQ0FBOEJJLElBQTlCLEdBQW1DLEtBQW5DO0FBQ0QsS0FOSSxNQU9BLElBQUczTixNQUFILEVBQVU7QUFDYixVQUFHLENBQUMxRCxPQUFPdUYsUUFBUCxDQUFnQjBMLGFBQWhCLENBQThCclEsTUFBL0IsSUFBeUNaLE9BQU91RixRQUFQLENBQWdCMEwsYUFBaEIsQ0FBOEJJLElBQTlCLElBQW9DLFFBQWhGLEVBQ0U7QUFDRnpPLGdCQUFVYyxPQUFPdkMsSUFBUCxHQUFZLDJCQUFaLEdBQXdDbVUsWUFBeEMsR0FBcURDLFFBQS9EO0FBQ0E5RCxjQUFRLE1BQVI7QUFDQXpSLGFBQU91RixRQUFQLENBQWdCMEwsYUFBaEIsQ0FBOEJJLElBQTlCLEdBQW1DLFFBQW5DO0FBQ0QsS0FOSSxNQU9BLElBQUcsQ0FBQzNOLE1BQUosRUFBVztBQUNkZCxnQkFBVSw4REFBVjtBQUNEOztBQUVEO0FBQ0EsUUFBSSxhQUFhNlcsU0FBakIsRUFBNEI7QUFDMUJBLGdCQUFVQyxPQUFWLENBQWtCLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBQWxCO0FBQ0Q7O0FBRUQ7QUFDQSxRQUFHMVosT0FBT3VGLFFBQVAsQ0FBZ0JvVSxNQUFoQixDQUF1QnpJLEVBQXZCLEtBQTRCLElBQS9CLEVBQW9DO0FBQ2xDO0FBQ0EsVUFBRyxDQUFDLENBQUNrRCxLQUFGLElBQVcxUSxNQUFYLElBQXFCQSxPQUFPME4sR0FBNUIsSUFBbUMxTixPQUFPSSxNQUFQLENBQWNLLE9BQXBELEVBQ0U7QUFDRixVQUFJeVYsTUFBTSxJQUFJQyxLQUFKLENBQVcsQ0FBQyxDQUFDekYsS0FBSCxHQUFZcFUsT0FBT3VGLFFBQVAsQ0FBZ0JvVSxNQUFoQixDQUF1QnZGLEtBQW5DLEdBQTJDcFUsT0FBT3VGLFFBQVAsQ0FBZ0JvVSxNQUFoQixDQUF1QkcsS0FBNUUsQ0FBVixDQUprQyxDQUk0RDtBQUM5RkYsVUFBSUcsSUFBSjtBQUNEOztBQUVEO0FBQ0EsUUFBRyxrQkFBa0JoWixNQUFyQixFQUE0QjtBQUMxQjtBQUNBLFVBQUdLLFlBQUgsRUFDRUEsYUFBYTRZLEtBQWI7O0FBRUYsVUFBR0MsYUFBYUMsVUFBYixLQUE0QixTQUEvQixFQUF5QztBQUN2QyxZQUFHdFgsT0FBSCxFQUFXO0FBQ1QsY0FBR2MsTUFBSCxFQUNFdEMsZUFBZSxJQUFJNlksWUFBSixDQUFpQnZXLE9BQU92QyxJQUFQLEdBQVksU0FBN0IsRUFBdUMsRUFBQzhYLE1BQUtyVyxPQUFOLEVBQWM0VyxNQUFLQSxJQUFuQixFQUF2QyxDQUFmLENBREYsS0FHRXBZLGVBQWUsSUFBSTZZLFlBQUosQ0FBaUIsYUFBakIsRUFBK0IsRUFBQ2hCLE1BQUtyVyxPQUFOLEVBQWM0VyxNQUFLQSxJQUFuQixFQUEvQixDQUFmO0FBQ0g7QUFDRixPQVBELE1BT08sSUFBR1MsYUFBYUMsVUFBYixLQUE0QixRQUEvQixFQUF3QztBQUM3Q0QscUJBQWFFLGlCQUFiLENBQStCLFVBQVVELFVBQVYsRUFBc0I7QUFDbkQ7QUFDQSxjQUFJQSxlQUFlLFNBQW5CLEVBQThCO0FBQzVCLGdCQUFHdFgsT0FBSCxFQUFXO0FBQ1R4Qiw2QkFBZSxJQUFJNlksWUFBSixDQUFpQnZXLE9BQU92QyxJQUFQLEdBQVksU0FBN0IsRUFBdUMsRUFBQzhYLE1BQUtyVyxPQUFOLEVBQWM0VyxNQUFLQSxJQUFuQixFQUF2QyxDQUFmO0FBQ0Q7QUFDRjtBQUNGLFNBUEQ7QUFRRDtBQUNGO0FBQ0Q7QUFDQSxRQUFHeFosT0FBT3VGLFFBQVAsQ0FBZ0IwTCxhQUFoQixDQUE4QjVELEtBQTlCLENBQW9DeEksT0FBcEMsQ0FBNEMsTUFBNUMsTUFBd0QsQ0FBM0QsRUFBNkQ7QUFDM0RyRSxrQkFBWTZNLEtBQVosQ0FBa0JyTixPQUFPdUYsUUFBUCxDQUFnQjBMLGFBQWhCLENBQThCNUQsS0FBaEQsRUFDSXpLLE9BREosRUFFSTZPLEtBRkosRUFHSStILElBSEosRUFJSTlWLE1BSkosRUFLSWdHLElBTEosQ0FLUyxVQUFTYyxRQUFULEVBQWtCO0FBQ3ZCeEssZUFBT2lRLFVBQVA7QUFDRCxPQVBILEVBUUdoRyxLQVJILENBUVMsVUFBU0MsR0FBVCxFQUFhO0FBQ2xCLFlBQUdBLElBQUl0SCxPQUFQLEVBQ0U1QyxPQUFPMkssZUFBUCw4QkFBa0RULElBQUl0SCxPQUF0RCxFQURGLEtBR0U1QyxPQUFPMkssZUFBUCw4QkFBa0RNLEtBQUsySixTQUFMLENBQWUxSyxHQUFmLENBQWxEO0FBQ0gsT0FiSDtBQWNEO0FBQ0YsR0F4SEQ7O0FBMEhBbEssU0FBT3dVLGNBQVAsR0FBd0IsVUFBUzlRLE1BQVQsRUFBZ0I7O0FBRXRDLFFBQUcsQ0FBQ0EsT0FBT08sTUFBWCxFQUFrQjtBQUNoQlAsYUFBT3FKLElBQVAsQ0FBWXFOLFVBQVosR0FBeUIsTUFBekI7QUFDQTFXLGFBQU9xSixJQUFQLENBQVlzTixRQUFaLEdBQXVCLE1BQXZCO0FBQ0EzVyxhQUFPcUosSUFBUCxDQUFZdUUsT0FBWixDQUFvQkUsSUFBcEIsR0FBMkIsYUFBM0I7QUFDQTlOLGFBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRyxLQUFwQixHQUE0QixNQUE1QjtBQUNBO0FBQ0QsS0FORCxNQU1PLElBQUcvTixPQUFPZCxPQUFQLENBQWVBLE9BQWYsSUFBMEJjLE9BQU9kLE9BQVAsQ0FBZWQsSUFBZixJQUF1QixRQUFwRCxFQUE2RDtBQUNsRTRCLGFBQU9xSixJQUFQLENBQVlxTixVQUFaLEdBQXlCLE1BQXpCO0FBQ0ExVyxhQUFPcUosSUFBUCxDQUFZc04sUUFBWixHQUF1QixNQUF2QjtBQUNBM1csYUFBT3FKLElBQVAsQ0FBWXVFLE9BQVosQ0FBb0JFLElBQXBCLEdBQTJCLE9BQTNCO0FBQ0E5TixhQUFPcUosSUFBUCxDQUFZdUUsT0FBWixDQUFvQkcsS0FBcEIsR0FBNEIsTUFBNUI7QUFDQTtBQUNEO0FBQ0QsUUFBSTZELGVBQWU1UixPQUFPMEksSUFBUCxDQUFZbEwsT0FBL0I7QUFDQSxRQUFJcVUsV0FBVyxNQUFmO0FBQ0E7QUFDQSxRQUFHLENBQUMsQ0FBQy9VLFlBQVkwTixXQUFaLENBQXdCeEssT0FBTzBJLElBQVAsQ0FBWXRLLElBQXBDLEVBQTBDcU0sT0FBNUMsSUFBdUQsT0FBT3pLLE9BQU95SyxPQUFkLElBQXlCLFdBQW5GLEVBQStGO0FBQzdGbUgscUJBQWU1UixPQUFPeUssT0FBdEI7QUFDQW9ILGlCQUFXLEdBQVg7QUFDRDtBQUNEO0FBQ0EsUUFBR0QsZUFBZTVSLE9BQU8wSSxJQUFQLENBQVl4TCxNQUFaLEdBQW1COEMsT0FBTzBJLElBQVAsQ0FBWU0sSUFBakQsRUFBc0Q7QUFDcERoSixhQUFPcUosSUFBUCxDQUFZc04sUUFBWixHQUF1QixrQkFBdkI7QUFDQTNXLGFBQU9xSixJQUFQLENBQVlxTixVQUFaLEdBQXlCLGtCQUF6QjtBQUNBMVcsYUFBT3lOLElBQVAsR0FBY21FLGVBQWE1UixPQUFPMEksSUFBUCxDQUFZeEwsTUFBdkM7QUFDQThDLGFBQU8wTixHQUFQLEdBQWEsSUFBYjtBQUNBLFVBQUcxTixPQUFPSyxNQUFQLElBQWlCTCxPQUFPSyxNQUFQLENBQWNJLE9BQWxDLEVBQTBDO0FBQ3hDVCxlQUFPcUosSUFBUCxDQUFZdUUsT0FBWixDQUFvQkUsSUFBcEIsR0FBMkIsU0FBM0I7QUFDQTlOLGVBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRyxLQUFwQixHQUE0QixvQkFBNUI7QUFDRCxPQUhELE1BR087QUFDTDtBQUNBL04sZUFBT3FKLElBQVAsQ0FBWXVFLE9BQVosQ0FBb0JFLElBQXBCLEdBQTJCdFIsUUFBUSxPQUFSLEVBQWlCd0QsT0FBT3lOLElBQVAsR0FBWXpOLE9BQU8wSSxJQUFQLENBQVlNLElBQXpDLEVBQThDLENBQTlDLElBQWlENkksUUFBakQsR0FBMEQsT0FBckY7QUFDQTdSLGVBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRyxLQUFwQixHQUE0QixrQkFBNUI7QUFDRDtBQUNGLEtBYkQsTUFhTyxJQUFHNkQsZUFBZTVSLE9BQU8wSSxJQUFQLENBQVl4TCxNQUFaLEdBQW1COEMsT0FBTzBJLElBQVAsQ0FBWU0sSUFBakQsRUFBc0Q7QUFDM0RoSixhQUFPcUosSUFBUCxDQUFZc04sUUFBWixHQUF1QixxQkFBdkI7QUFDQTNXLGFBQU9xSixJQUFQLENBQVlxTixVQUFaLEdBQXlCLHFCQUF6QjtBQUNBMVcsYUFBTzBOLEdBQVAsR0FBYTFOLE9BQU8wSSxJQUFQLENBQVl4TCxNQUFaLEdBQW1CMFUsWUFBaEM7QUFDQTVSLGFBQU95TixJQUFQLEdBQWMsSUFBZDtBQUNBLFVBQUd6TixPQUFPSSxNQUFQLENBQWNLLE9BQWpCLEVBQXlCO0FBQ3ZCVCxlQUFPcUosSUFBUCxDQUFZdUUsT0FBWixDQUFvQkUsSUFBcEIsR0FBMkIsU0FBM0I7QUFDQTlOLGVBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRyxLQUFwQixHQUE0QixrQkFBNUI7QUFDRCxPQUhELE1BR087QUFDTDtBQUNBL04sZUFBT3FKLElBQVAsQ0FBWXVFLE9BQVosQ0FBb0JFLElBQXBCLEdBQTJCdFIsUUFBUSxPQUFSLEVBQWlCd0QsT0FBTzBOLEdBQVAsR0FBVzFOLE9BQU8wSSxJQUFQLENBQVlNLElBQXhDLEVBQTZDLENBQTdDLElBQWdENkksUUFBaEQsR0FBeUQsTUFBcEY7QUFDQTdSLGVBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRyxLQUFwQixHQUE0QixvQkFBNUI7QUFDRDtBQUNGLEtBYk0sTUFhQTtBQUNML04sYUFBT3FKLElBQVAsQ0FBWXNOLFFBQVosR0FBdUIscUJBQXZCO0FBQ0EzVyxhQUFPcUosSUFBUCxDQUFZcU4sVUFBWixHQUF5QixxQkFBekI7QUFDQTFXLGFBQU9xSixJQUFQLENBQVl1RSxPQUFaLENBQW9CRSxJQUFwQixHQUEyQixlQUEzQjtBQUNBOU4sYUFBT3FKLElBQVAsQ0FBWXVFLE9BQVosQ0FBb0JHLEtBQXBCLEdBQTRCLE1BQTVCO0FBQ0EvTixhQUFPME4sR0FBUCxHQUFhLElBQWI7QUFDQTFOLGFBQU95TixJQUFQLEdBQWMsSUFBZDtBQUNEO0FBQ0YsR0F6REQ7O0FBMkRBblIsU0FBT3NhLGdCQUFQLEdBQTBCLFVBQVM1VyxNQUFULEVBQWdCO0FBQ3hDO0FBQ0E7QUFDQSxRQUFHMUQsT0FBT3VGLFFBQVAsQ0FBZ0JFLE9BQWhCLENBQXdCb0wsTUFBM0IsRUFDRTtBQUNGO0FBQ0EsUUFBSTBKLGNBQWN0VixFQUFFdVYsU0FBRixDQUFZeGEsT0FBT3lDLFdBQW5CLEVBQWdDLEVBQUNYLE1BQU00QixPQUFPNUIsSUFBZCxFQUFoQyxDQUFsQjtBQUNBO0FBQ0F5WTtBQUNBLFFBQUk1QyxhQUFjM1gsT0FBT3lDLFdBQVAsQ0FBbUI4WCxXQUFuQixDQUFELEdBQW9DdmEsT0FBT3lDLFdBQVAsQ0FBbUI4WCxXQUFuQixDQUFwQyxHQUFzRXZhLE9BQU95QyxXQUFQLENBQW1CLENBQW5CLENBQXZGO0FBQ0E7QUFDQWlCLFdBQU92QyxJQUFQLEdBQWN3VyxXQUFXeFcsSUFBekI7QUFDQXVDLFdBQU81QixJQUFQLEdBQWM2VixXQUFXN1YsSUFBekI7QUFDQTRCLFdBQU8wSSxJQUFQLENBQVl4TCxNQUFaLEdBQXFCK1csV0FBVy9XLE1BQWhDO0FBQ0E4QyxXQUFPMEksSUFBUCxDQUFZTSxJQUFaLEdBQW1CaUwsV0FBV2pMLElBQTlCO0FBQ0FoSixXQUFPcUosSUFBUCxHQUFjaE4sUUFBUWlOLElBQVIsQ0FBYXhNLFlBQVl5TSxrQkFBWixFQUFiLEVBQThDLEVBQUM3SixPQUFNTSxPQUFPMEksSUFBUCxDQUFZbEwsT0FBbkIsRUFBMkI0QixLQUFJLENBQS9CLEVBQWlDb0ssS0FBSXlLLFdBQVcvVyxNQUFYLEdBQWtCK1csV0FBV2pMLElBQWxFLEVBQTlDLENBQWQ7QUFDQSxRQUFHaUwsV0FBVzdWLElBQVgsSUFBbUIsV0FBbkIsSUFBa0M2VixXQUFXN1YsSUFBWCxJQUFtQixLQUF4RCxFQUE4RDtBQUM1RDRCLGFBQU9LLE1BQVAsR0FBZ0IsRUFBQ2lJLEtBQUksSUFBTCxFQUFVN0gsU0FBUSxLQUFsQixFQUF3QjhILE1BQUssS0FBN0IsRUFBbUMvSCxLQUFJLEtBQXZDLEVBQTZDZ0ksV0FBVSxHQUF2RCxFQUEyREMsUUFBTyxLQUFsRSxFQUFoQjtBQUNBLGFBQU96SSxPQUFPTSxJQUFkO0FBQ0QsS0FIRCxNQUdPO0FBQ0xOLGFBQU9NLElBQVAsR0FBYyxFQUFDZ0ksS0FBSSxJQUFMLEVBQVU3SCxTQUFRLEtBQWxCLEVBQXdCOEgsTUFBSyxLQUE3QixFQUFtQy9ILEtBQUksS0FBdkMsRUFBNkNnSSxXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBQWQ7QUFDQSxhQUFPekksT0FBT0ssTUFBZDtBQUNEO0FBQ0QvRCxXQUFPeWEsYUFBUCxDQUFxQi9XLE1BQXJCO0FBQ0QsR0F4QkQ7O0FBMEJBMUQsU0FBTzBhLFdBQVAsR0FBcUIsVUFBUy9VLElBQVQsRUFBYztBQUNqQyxRQUFHM0YsT0FBT3VGLFFBQVAsQ0FBZ0JFLE9BQWhCLENBQXdCRSxJQUF4QixJQUFnQ0EsSUFBbkMsRUFBd0M7QUFDdEMzRixhQUFPdUYsUUFBUCxDQUFnQkUsT0FBaEIsQ0FBd0JFLElBQXhCLEdBQStCQSxJQUEvQjtBQUNBVixRQUFFbUUsSUFBRixDQUFPcEosT0FBTzZELE9BQWQsRUFBc0IsVUFBU0gsTUFBVCxFQUFnQjtBQUNwQ0EsZUFBTzBJLElBQVAsQ0FBWXhMLE1BQVosR0FBcUJtRSxXQUFXckIsT0FBTzBJLElBQVAsQ0FBWXhMLE1BQXZCLENBQXJCO0FBQ0E4QyxlQUFPMEksSUFBUCxDQUFZbEwsT0FBWixHQUFzQjZELFdBQVdyQixPQUFPMEksSUFBUCxDQUFZbEwsT0FBdkIsQ0FBdEI7QUFDQXdDLGVBQU8wSSxJQUFQLENBQVlsTCxPQUFaLEdBQXNCaEIsUUFBUSxlQUFSLEVBQXlCd0QsT0FBTzBJLElBQVAsQ0FBWWxMLE9BQXJDLEVBQTZDeUUsSUFBN0MsQ0FBdEI7QUFDQWpDLGVBQU8wSSxJQUFQLENBQVlHLFFBQVosR0FBdUJyTSxRQUFRLGVBQVIsRUFBeUJ3RCxPQUFPMEksSUFBUCxDQUFZRyxRQUFyQyxFQUE4QzVHLElBQTlDLENBQXZCO0FBQ0FqQyxlQUFPMEksSUFBUCxDQUFZSSxRQUFaLEdBQXVCdE0sUUFBUSxlQUFSLEVBQXlCd0QsT0FBTzBJLElBQVAsQ0FBWUksUUFBckMsRUFBOEM3RyxJQUE5QyxDQUF2QjtBQUNBakMsZUFBTzBJLElBQVAsQ0FBWXhMLE1BQVosR0FBcUJWLFFBQVEsZUFBUixFQUF5QndELE9BQU8wSSxJQUFQLENBQVl4TCxNQUFyQyxFQUE0QytFLElBQTVDLENBQXJCO0FBQ0FqQyxlQUFPMEksSUFBUCxDQUFZeEwsTUFBWixHQUFxQlYsUUFBUSxPQUFSLEVBQWlCd0QsT0FBTzBJLElBQVAsQ0FBWXhMLE1BQTdCLEVBQW9DLENBQXBDLENBQXJCO0FBQ0EsWUFBRyxDQUFDLENBQUM4QyxPQUFPMEksSUFBUCxDQUFZSyxNQUFqQixFQUF3QjtBQUN0Qi9JLGlCQUFPMEksSUFBUCxDQUFZSyxNQUFaLEdBQXFCMUgsV0FBV3JCLE9BQU8wSSxJQUFQLENBQVlLLE1BQXZCLENBQXJCO0FBQ0EsY0FBRzlHLFNBQVMsR0FBWixFQUNFakMsT0FBTzBJLElBQVAsQ0FBWUssTUFBWixHQUFxQnZNLFFBQVEsT0FBUixFQUFpQndELE9BQU8wSSxJQUFQLENBQVlLLE1BQVosR0FBbUIsS0FBcEMsRUFBMEMsQ0FBMUMsQ0FBckIsQ0FERixLQUdFL0ksT0FBTzBJLElBQVAsQ0FBWUssTUFBWixHQUFxQnZNLFFBQVEsT0FBUixFQUFpQndELE9BQU8wSSxJQUFQLENBQVlLLE1BQVosR0FBbUIsR0FBcEMsRUFBd0MsQ0FBeEMsQ0FBckI7QUFDSDtBQUNEO0FBQ0EsWUFBRy9JLE9BQU9tSixNQUFQLENBQWN2SCxNQUFqQixFQUF3QjtBQUNwQkwsWUFBRW1FLElBQUYsQ0FBTzFGLE9BQU9tSixNQUFkLEVBQXNCLFVBQUM4TixDQUFELEVBQUk5RCxDQUFKLEVBQVU7QUFDOUJuVCxtQkFBT21KLE1BQVAsQ0FBY2dLLENBQWQsSUFBbUIsQ0FBQ25ULE9BQU9tSixNQUFQLENBQWNnSyxDQUFkLEVBQWlCLENBQWpCLENBQUQsRUFBcUIzVyxRQUFRLGVBQVIsRUFBeUJ3RCxPQUFPbUosTUFBUCxDQUFjZ0ssQ0FBZCxFQUFpQixDQUFqQixDQUF6QixFQUE2Q2xSLElBQTdDLENBQXJCLENBQW5CO0FBQ0gsV0FGQztBQUdIO0FBQ0Q7QUFDQWpDLGVBQU9xSixJQUFQLENBQVkzSixLQUFaLEdBQW9CTSxPQUFPMEksSUFBUCxDQUFZbEwsT0FBaEM7QUFDQXdDLGVBQU9xSixJQUFQLENBQVlHLEdBQVosR0FBa0J4SixPQUFPMEksSUFBUCxDQUFZeEwsTUFBWixHQUFtQjhDLE9BQU8wSSxJQUFQLENBQVlNLElBQS9CLEdBQW9DLEVBQXREO0FBQ0ExTSxlQUFPd1UsY0FBUCxDQUFzQjlRLE1BQXRCO0FBQ0QsT0F6QkQ7QUEwQkExRCxhQUFPMEYsWUFBUCxHQUFzQmxGLFlBQVlrRixZQUFaLENBQXlCLEVBQUNDLE1BQU0zRixPQUFPdUYsUUFBUCxDQUFnQkUsT0FBaEIsQ0FBd0JFLElBQS9CLEVBQXFDQyxPQUFPNUYsT0FBT3VGLFFBQVAsQ0FBZ0JLLEtBQTVELEVBQW1FQyxTQUFTN0YsT0FBT3VGLFFBQVAsQ0FBZ0JPLE9BQWhCLENBQXdCRCxPQUFwRyxFQUF6QixDQUF0QjtBQUNEO0FBQ0YsR0EvQkQ7O0FBaUNBN0YsU0FBTzRhLFFBQVAsR0FBa0IsVUFBU3hHLEtBQVQsRUFBZTFRLE1BQWYsRUFBc0I7QUFDdEMsV0FBT3RELFVBQVUsWUFBWTtBQUMzQjtBQUNBLFVBQUcsQ0FBQ2dVLE1BQU1HLEVBQVAsSUFBYUgsTUFBTXRSLEdBQU4sSUFBVyxDQUF4QixJQUE2QnNSLE1BQU13QixHQUFOLElBQVcsQ0FBM0MsRUFBNkM7QUFDM0M7QUFDQXhCLGNBQU1qUSxPQUFOLEdBQWdCLEtBQWhCO0FBQ0E7QUFDQWlRLGNBQU1HLEVBQU4sR0FBVyxFQUFDelIsS0FBSSxDQUFMLEVBQU84UyxLQUFJLENBQVgsRUFBYXpSLFNBQVEsSUFBckIsRUFBWDtBQUNBO0FBQ0EsWUFBSSxDQUFDLENBQUNULE1BQUYsSUFBWXVCLEVBQUVDLE1BQUYsQ0FBU3hCLE9BQU9vSixNQUFoQixFQUF3QixFQUFDeUgsSUFBSSxFQUFDcFEsU0FBUSxJQUFULEVBQUwsRUFBeEIsRUFBOENtQixNQUE5QyxJQUF3RDVCLE9BQU9vSixNQUFQLENBQWN4SCxNQUF0RixFQUNFdEYsT0FBT29OLE1BQVAsQ0FBYzFKLE1BQWQsRUFBcUIwUSxLQUFyQjtBQUNILE9BUkQsTUFRTyxJQUFHLENBQUNBLE1BQU1HLEVBQVAsSUFBYUgsTUFBTXdCLEdBQU4sR0FBWSxDQUE1QixFQUE4QjtBQUNuQztBQUNBeEIsY0FBTXdCLEdBQU47QUFDRCxPQUhNLE1BR0EsSUFBR3hCLE1BQU1HLEVBQU4sSUFBWUgsTUFBTUcsRUFBTixDQUFTcUIsR0FBVCxHQUFlLEVBQTlCLEVBQWlDO0FBQ3RDO0FBQ0F4QixjQUFNRyxFQUFOLENBQVNxQixHQUFUO0FBQ0QsT0FITSxNQUdBLElBQUcsQ0FBQ3hCLE1BQU1HLEVBQVYsRUFBYTtBQUNsQjtBQUNBLFlBQUcsQ0FBQyxDQUFDN1EsTUFBTCxFQUFZO0FBQ1Z1QixZQUFFbUUsSUFBRixDQUFPbkUsRUFBRUMsTUFBRixDQUFTeEIsT0FBT29KLE1BQWhCLEVBQXdCLEVBQUMzSSxTQUFRLEtBQVQsRUFBZXJCLEtBQUlzUixNQUFNdFIsR0FBekIsRUFBNkJ3UixPQUFNLEtBQW5DLEVBQXhCLENBQVAsRUFBMEUsVUFBU3VHLFNBQVQsRUFBbUI7QUFDM0Y3YSxtQkFBT29OLE1BQVAsQ0FBYzFKLE1BQWQsRUFBcUJtWCxTQUFyQjtBQUNBQSxzQkFBVXZHLEtBQVYsR0FBZ0IsSUFBaEI7QUFDQW5VLHFCQUFTLFlBQVU7QUFDakJILHFCQUFPcVUsVUFBUCxDQUFrQndHLFNBQWxCLEVBQTRCblgsTUFBNUI7QUFDRCxhQUZELEVBRUUsS0FGRjtBQUdELFdBTkQ7QUFPRDtBQUNEO0FBQ0EwUSxjQUFNd0IsR0FBTixHQUFVLEVBQVY7QUFDQXhCLGNBQU10UixHQUFOO0FBQ0QsT0FkTSxNQWNBLElBQUdzUixNQUFNRyxFQUFULEVBQVk7QUFDakI7QUFDQUgsY0FBTUcsRUFBTixDQUFTcUIsR0FBVCxHQUFhLENBQWI7QUFDQXhCLGNBQU1HLEVBQU4sQ0FBU3pSLEdBQVQ7QUFDRDtBQUNGLEtBbkNNLEVBbUNMLElBbkNLLENBQVA7QUFvQ0QsR0FyQ0Q7O0FBdUNBOUMsU0FBT3FVLFVBQVAsR0FBb0IsVUFBU0QsS0FBVCxFQUFlMVEsTUFBZixFQUFzQjtBQUN4QyxRQUFHMFEsTUFBTUcsRUFBTixJQUFZSCxNQUFNRyxFQUFOLENBQVNwUSxPQUF4QixFQUFnQztBQUM5QjtBQUNBaVEsWUFBTUcsRUFBTixDQUFTcFEsT0FBVCxHQUFpQixLQUFqQjtBQUNBL0QsZ0JBQVUwYSxNQUFWLENBQWlCMUcsTUFBTTJHLFFBQXZCO0FBQ0QsS0FKRCxNQUlPLElBQUczRyxNQUFNalEsT0FBVCxFQUFpQjtBQUN0QjtBQUNBaVEsWUFBTWpRLE9BQU4sR0FBYyxLQUFkO0FBQ0EvRCxnQkFBVTBhLE1BQVYsQ0FBaUIxRyxNQUFNMkcsUUFBdkI7QUFDRCxLQUpNLE1BSUE7QUFDTDtBQUNBM0csWUFBTWpRLE9BQU4sR0FBYyxJQUFkO0FBQ0FpUSxZQUFNRSxLQUFOLEdBQVksS0FBWjtBQUNBRixZQUFNMkcsUUFBTixHQUFpQi9hLE9BQU80YSxRQUFQLENBQWdCeEcsS0FBaEIsRUFBc0IxUSxNQUF0QixDQUFqQjtBQUNEO0FBQ0YsR0FmRDs7QUFpQkExRCxTQUFPMlIsWUFBUCxHQUFzQixZQUFVO0FBQzlCLFFBQUlxSixhQUFhLEVBQWpCO0FBQ0EsUUFBSWhJLE9BQU8sSUFBSXZLLElBQUosRUFBWDtBQUNBO0FBQ0F4RCxNQUFFbUUsSUFBRixDQUFPcEosT0FBTzZELE9BQWQsRUFBdUIsVUFBQ0QsQ0FBRCxFQUFJaVQsQ0FBSixFQUFVO0FBQy9CLFVBQUc3VyxPQUFPNkQsT0FBUCxDQUFlZ1QsQ0FBZixFQUFrQjVTLE1BQXJCLEVBQTRCO0FBQzFCK1csbUJBQVd0UyxJQUFYLENBQWdCbEksWUFBWTRMLElBQVosQ0FBaUJwTSxPQUFPNkQsT0FBUCxDQUFlZ1QsQ0FBZixDQUFqQixFQUNibk4sSUFEYSxDQUNSO0FBQUEsaUJBQVkxSixPQUFPZ1YsVUFBUCxDQUFrQnhLLFFBQWxCLEVBQTRCeEssT0FBTzZELE9BQVAsQ0FBZWdULENBQWYsQ0FBNUIsQ0FBWjtBQUFBLFNBRFEsRUFFYjVNLEtBRmEsQ0FFUCxlQUFPO0FBQ1o7QUFDQXZHLGlCQUFPbUosTUFBUCxDQUFjbkUsSUFBZCxDQUFtQixDQUFDc0ssS0FBS3dDLE9BQUwsRUFBRCxFQUFnQjlSLE9BQU8wSSxJQUFQLENBQVlsTCxPQUE1QixDQUFuQjtBQUNBLGNBQUdsQixPQUFPNkQsT0FBUCxDQUFlZ1QsQ0FBZixFQUFrQmxVLEtBQWxCLENBQXdCd0ssS0FBM0IsRUFDRW5OLE9BQU82RCxPQUFQLENBQWVnVCxDQUFmLEVBQWtCbFUsS0FBbEIsQ0FBd0J3SyxLQUF4QixHQURGLEtBR0VuTixPQUFPNkQsT0FBUCxDQUFlZ1QsQ0FBZixFQUFrQmxVLEtBQWxCLENBQXdCd0ssS0FBeEIsR0FBOEIsQ0FBOUI7QUFDRixjQUFHbk4sT0FBTzZELE9BQVAsQ0FBZWdULENBQWYsRUFBa0JsVSxLQUFsQixDQUF3QndLLEtBQXhCLElBQWlDLENBQXBDLEVBQXNDO0FBQ3BDbk4sbUJBQU82RCxPQUFQLENBQWVnVCxDQUFmLEVBQWtCbFUsS0FBbEIsQ0FBd0J3SyxLQUF4QixHQUE4QixDQUE5QjtBQUNBbk4sbUJBQU8ySyxlQUFQLENBQXVCVCxHQUF2QixFQUE0QmxLLE9BQU82RCxPQUFQLENBQWVnVCxDQUFmLENBQTVCO0FBQ0Q7QUFDRCxpQkFBTzNNLEdBQVA7QUFDRCxTQWRhLENBQWhCO0FBZUQ7QUFDRixLQWxCRDs7QUFvQkEsV0FBTzdKLEdBQUd5VCxHQUFILENBQU9rSCxVQUFQLEVBQ0p0UixJQURJLENBQ0Msa0JBQVU7QUFDZDtBQUNBdkosZUFBUyxZQUFVO0FBQ2YsZUFBT0gsT0FBTzJSLFlBQVAsRUFBUDtBQUNILE9BRkQsRUFFRyxDQUFDLENBQUMzUixPQUFPdUYsUUFBUCxDQUFnQjBWLFdBQW5CLEdBQWtDamIsT0FBT3VGLFFBQVAsQ0FBZ0IwVixXQUFoQixHQUE0QixJQUE5RCxHQUFxRSxLQUZ2RTtBQUdELEtBTkksRUFPSmhSLEtBUEksQ0FPRSxlQUFPO0FBQ1o5SixlQUFTLFlBQVU7QUFDZixlQUFPSCxPQUFPMlIsWUFBUCxFQUFQO0FBQ0gsT0FGRCxFQUVHLENBQUMsQ0FBQzNSLE9BQU91RixRQUFQLENBQWdCMFYsV0FBbkIsR0FBa0NqYixPQUFPdUYsUUFBUCxDQUFnQjBWLFdBQWhCLEdBQTRCLElBQTlELEdBQXFFLEtBRnZFO0FBR0gsS0FYTSxDQUFQO0FBWUQsR0FwQ0Q7O0FBc0NBamIsU0FBT2tiLFlBQVAsR0FBc0IsVUFBU3hYLE1BQVQsRUFBZ0J5WCxNQUFoQixFQUF1QjtBQUMzQ25iLFdBQU95YSxhQUFQLENBQXFCL1csTUFBckI7QUFDQTFELFdBQU82RCxPQUFQLENBQWUyRixNQUFmLENBQXNCMlIsTUFBdEIsRUFBNkIsQ0FBN0I7QUFDRCxHQUhEOztBQUtBbmIsU0FBT29iLFdBQVAsR0FBcUIsVUFBUzFYLE1BQVQsRUFBZ0IyWCxLQUFoQixFQUFzQjlHLEVBQXRCLEVBQXlCOztBQUU1QyxRQUFHalQsT0FBSCxFQUNFbkIsU0FBUzJhLE1BQVQsQ0FBZ0J4WixPQUFoQjs7QUFFRixRQUFHaVQsRUFBSCxFQUNFN1EsT0FBTzBJLElBQVAsQ0FBWWlQLEtBQVosSUFERixLQUdFM1gsT0FBTzBJLElBQVAsQ0FBWWlQLEtBQVo7O0FBRUYsUUFBR0EsU0FBUyxRQUFaLEVBQXFCO0FBQ25CM1gsYUFBTzBJLElBQVAsQ0FBWWxMLE9BQVosR0FBdUI2RCxXQUFXckIsT0FBTzBJLElBQVAsQ0FBWUcsUUFBdkIsSUFBbUN4SCxXQUFXckIsT0FBTzBJLElBQVAsQ0FBWUssTUFBdkIsQ0FBMUQ7QUFDRDs7QUFFRDtBQUNBbkwsY0FBVW5CLFNBQVMsWUFBVTtBQUMzQjtBQUNBdUQsYUFBT3FKLElBQVAsQ0FBWUcsR0FBWixHQUFrQnhKLE9BQU8wSSxJQUFQLENBQVksUUFBWixJQUFzQjFJLE9BQU8wSSxJQUFQLENBQVksTUFBWixDQUF0QixHQUEwQyxFQUE1RDtBQUNBcE0sYUFBT3dVLGNBQVAsQ0FBc0I5USxNQUF0QjtBQUNBMUQsYUFBT3lhLGFBQVAsQ0FBcUIvVyxNQUFyQjtBQUNELEtBTFMsRUFLUixJQUxRLENBQVY7QUFNRCxHQXJCRDs7QUF1QkExRCxTQUFPeWEsYUFBUCxHQUF1QixVQUFTL1csTUFBVCxFQUFnQjtBQUNyQztBQUNBLFFBQUcxRCxPQUFPOEYsT0FBUCxDQUFlb0ssU0FBZixNQUE4QnhNLE9BQU8wSixNQUFQLENBQWN0SCxPQUEvQyxFQUF1RDtBQUNyRDlGLGFBQU84RixPQUFQLENBQWVqQyxPQUFmLENBQXVCSCxNQUF2QjtBQUNEO0FBQ0YsR0FMRDs7QUFPQTFELFNBQU8yVCxVQUFQLEdBQW9CO0FBQXBCLEdBQ0dqSyxJQURILENBQ1ExSixPQUFPK1QsSUFEZixFQUNxQjtBQURyQixHQUVHckssSUFGSCxDQUVRLGtCQUFVO0FBQ2QsUUFBRyxDQUFDLENBQUM0UixNQUFMLEVBQ0V0YixPQUFPMlIsWUFBUCxHQUZZLENBRVc7QUFDMUIsR0FMSDs7QUFPQTtBQUNBM1IsU0FBT3ViLFdBQVAsR0FBcUIsWUFBVTtBQUM3QnBiLGFBQVMsWUFBVTtBQUNqQkssa0JBQVkrRSxRQUFaLENBQXFCLFVBQXJCLEVBQWlDdkYsT0FBT3VGLFFBQXhDO0FBQ0EvRSxrQkFBWStFLFFBQVosQ0FBcUIsU0FBckIsRUFBK0J2RixPQUFPNkQsT0FBdEM7QUFDQTdELGFBQU91YixXQUFQO0FBQ0QsS0FKRCxFQUlFLElBSkY7QUFLRCxHQU5EO0FBT0F2YixTQUFPdWIsV0FBUDtBQUVELENBdjJERCxFOzs7Ozs7Ozs7OztBQ0FBeGIsUUFBUWpCLE1BQVIsQ0FBZSxtQkFBZixFQUNDMGMsU0FERCxDQUNXLFVBRFgsRUFDdUIsWUFBVztBQUM5QixXQUFPO0FBQ0hDLGtCQUFVLEdBRFA7QUFFSEMsZUFBTyxFQUFDQyxPQUFNLEdBQVAsRUFBVzdaLE1BQUssSUFBaEIsRUFBcUIwVyxNQUFLLElBQTFCLEVBQStCb0QsUUFBTyxJQUF0QyxFQUEyQ0MsT0FBTSxJQUFqRCxFQUFzREMsYUFBWSxJQUFsRSxFQUZKO0FBR0hsWCxpQkFBUyxLQUhOO0FBSUhtWCxrQkFDUixXQUNJLHNJQURKLEdBRVEsc0lBRlIsR0FHUSxxRUFIUixHQUlBLFNBVFc7QUFVSEMsY0FBTSxjQUFTTixLQUFULEVBQWdCL2EsT0FBaEIsRUFBeUJzYixLQUF6QixFQUFnQztBQUNsQ1Asa0JBQU1RLElBQU4sR0FBYSxLQUFiO0FBQ0FSLGtCQUFNNVosSUFBTixHQUFhLENBQUMsQ0FBQzRaLE1BQU01WixJQUFSLEdBQWU0WixNQUFNNVosSUFBckIsR0FBNEIsTUFBekM7QUFDQW5CLG9CQUFRd2IsSUFBUixDQUFhLE9BQWIsRUFBc0IsWUFBVztBQUM3QlQsc0JBQU1VLE1BQU4sQ0FBYVYsTUFBTVEsSUFBTixHQUFhLElBQTFCO0FBQ0gsYUFGRDtBQUdBLGdCQUFHUixNQUFNRyxLQUFULEVBQWdCSCxNQUFNRyxLQUFOO0FBQ25CO0FBakJFLEtBQVA7QUFtQkgsQ0FyQkQsRUFzQkNMLFNBdEJELENBc0JXLFNBdEJYLEVBc0JzQixZQUFXO0FBQzdCLFdBQU8sVUFBU0UsS0FBVCxFQUFnQi9hLE9BQWhCLEVBQXlCc2IsS0FBekIsRUFBZ0M7QUFDbkN0YixnQkFBUXdiLElBQVIsQ0FBYSxVQUFiLEVBQXlCLFVBQVN6YixDQUFULEVBQVk7QUFDakMsZ0JBQUlBLEVBQUUyYixRQUFGLEtBQWUsRUFBZixJQUFxQjNiLEVBQUU0YixPQUFGLEtBQWEsRUFBdEMsRUFBMkM7QUFDekNaLHNCQUFNVSxNQUFOLENBQWFILE1BQU1NLE9BQW5CO0FBQ0Esb0JBQUdiLE1BQU1FLE1BQVQsRUFDRUYsTUFBTVUsTUFBTixDQUFhVixNQUFNRSxNQUFuQjtBQUNIO0FBQ0osU0FORDtBQU9ILEtBUkQ7QUFTSCxDQWhDRCxFQWlDQ0osU0FqQ0QsQ0FpQ1csWUFqQ1gsRUFpQ3lCLFVBQVVnQixNQUFWLEVBQWtCO0FBQzFDLFdBQU87QUFDTmYsa0JBQVUsR0FESjtBQUVOQyxlQUFPLEtBRkQ7QUFHTk0sY0FBTSxjQUFTTixLQUFULEVBQWdCL2EsT0FBaEIsRUFBeUJzYixLQUF6QixFQUFnQztBQUNsQyxnQkFBSVEsS0FBS0QsT0FBT1AsTUFBTVMsVUFBYixDQUFUOztBQUVIL2Isb0JBQVF1USxFQUFSLENBQVcsUUFBWCxFQUFxQixVQUFTeUwsYUFBVCxFQUF3QjtBQUM1QyxvQkFBSUMsU0FBUyxJQUFJQyxVQUFKLEVBQWI7QUFDSSxvQkFBSTNXLE9BQU8sQ0FBQ3lXLGNBQWM3UyxVQUFkLElBQTRCNlMsY0FBYy9iLE1BQTNDLEVBQW1Ea2MsS0FBbkQsQ0FBeUQsQ0FBekQsQ0FBWDtBQUNBLG9CQUFJQyxZQUFhN1csSUFBRCxHQUFTQSxLQUFLL0UsSUFBTCxDQUFVd0MsS0FBVixDQUFnQixHQUFoQixFQUFxQnFaLEdBQXJCLEdBQTJCbEYsV0FBM0IsRUFBVCxHQUFvRCxFQUFwRTs7QUFFSjhFLHVCQUFPSyxNQUFQLEdBQWdCLFVBQVNDLFdBQVQsRUFBc0I7QUFDckN4QiwwQkFBTVUsTUFBTixDQUFhLFlBQVc7QUFDakJLLDJCQUFHZixLQUFILEVBQVUsRUFBQzdKLGNBQWNxTCxZQUFZdGMsTUFBWixDQUFtQnVjLE1BQWxDLEVBQTBDckwsTUFBTWlMLFNBQWhELEVBQVY7QUFDQXBjLGdDQUFReWMsR0FBUixDQUFZLElBQVo7QUFDTixxQkFIRDtBQUlBLGlCQUxEO0FBTUFSLHVCQUFPUyxVQUFQLENBQWtCblgsSUFBbEI7QUFDQSxhQVpEO0FBYUE7QUFuQkssS0FBUDtBQXFCQSxDQXZERCxFOzs7Ozs7Ozs7O0FDQUFuRyxRQUFRakIsTUFBUixDQUFlLG1CQUFmLEVBQ0NvRyxNQURELENBQ1EsUUFEUixFQUNrQixZQUFXO0FBQzNCLFNBQU8sVUFBUzhOLElBQVQsRUFBZXBELE1BQWYsRUFBdUI7QUFDMUIsUUFBRyxDQUFDb0QsSUFBSixFQUNFLE9BQU8sRUFBUDtBQUNGLFFBQUdwRCxNQUFILEVBQ0UsT0FBT0QsT0FBTyxJQUFJbEgsSUFBSixDQUFTdUssSUFBVCxDQUFQLEVBQXVCcEQsTUFBdkIsQ0FBOEJBLE1BQTlCLENBQVAsQ0FERixLQUdFLE9BQU9ELE9BQU8sSUFBSWxILElBQUosQ0FBU3VLLElBQVQsQ0FBUCxFQUF1QnNLLE9BQXZCLEVBQVA7QUFDSCxHQVBIO0FBUUQsQ0FWRCxFQVdDcFksTUFYRCxDQVdRLGVBWFIsRUFXeUIsVUFBU2hGLE9BQVQsRUFBa0I7QUFDekMsU0FBTyxVQUFTa00sSUFBVCxFQUFjekcsSUFBZCxFQUFvQjtBQUN6QixRQUFHQSxRQUFNLEdBQVQsRUFDRSxPQUFPekYsUUFBUSxjQUFSLEVBQXdCa00sSUFBeEIsQ0FBUCxDQURGLEtBR0UsT0FBT2xNLFFBQVEsV0FBUixFQUFxQmtNLElBQXJCLENBQVA7QUFDSCxHQUxEO0FBTUQsQ0FsQkQsRUFtQkNsSCxNQW5CRCxDQW1CUSxjQW5CUixFQW1Cd0IsVUFBU2hGLE9BQVQsRUFBa0I7QUFDeEMsU0FBTyxVQUFTcWQsT0FBVCxFQUFrQjtBQUN2QkEsY0FBVXhZLFdBQVd3WSxPQUFYLENBQVY7QUFDQSxXQUFPcmQsUUFBUSxPQUFSLEVBQWlCcWQsVUFBUSxDQUFSLEdBQVUsQ0FBVixHQUFZLEVBQTdCLEVBQWdDLENBQWhDLENBQVA7QUFDRCxHQUhEO0FBSUQsQ0F4QkQsRUF5QkNyWSxNQXpCRCxDQXlCUSxXQXpCUixFQXlCcUIsVUFBU2hGLE9BQVQsRUFBa0I7QUFDckMsU0FBTyxVQUFTc2QsVUFBVCxFQUFxQjtBQUMxQkEsaUJBQWF6WSxXQUFXeVksVUFBWCxDQUFiO0FBQ0EsV0FBT3RkLFFBQVEsT0FBUixFQUFpQixDQUFDc2QsYUFBVyxFQUFaLElBQWdCLENBQWhCLEdBQWtCLENBQW5DLEVBQXFDLENBQXJDLENBQVA7QUFDRCxHQUhEO0FBSUQsQ0E5QkQsRUErQkN0WSxNQS9CRCxDQStCUSxPQS9CUixFQStCaUIsVUFBU2hGLE9BQVQsRUFBa0I7QUFDakMsU0FBTyxVQUFTa2QsR0FBVCxFQUFhSyxRQUFiLEVBQXVCO0FBQzVCLFdBQU9DLE9BQVFuSCxLQUFLQyxLQUFMLENBQVc0RyxNQUFNLEdBQU4sR0FBWUssUUFBdkIsSUFBb0MsSUFBcEMsR0FBMkNBLFFBQW5ELENBQVA7QUFDRCxHQUZEO0FBR0QsQ0FuQ0QsRUFvQ0N2WSxNQXBDRCxDQW9DUSxXQXBDUixFQW9DcUIsVUFBUzNFLElBQVQsRUFBZTtBQUNsQyxTQUFPLFVBQVNpUixJQUFULEVBQWVtTSxNQUFmLEVBQXVCO0FBQzVCLFFBQUluTSxRQUFRbU0sTUFBWixFQUFvQjtBQUNsQm5NLGFBQU9BLEtBQUs1TSxPQUFMLENBQWEsSUFBSWdaLE1BQUosQ0FBVyxNQUFJRCxNQUFKLEdBQVcsR0FBdEIsRUFBMkIsSUFBM0IsQ0FBYixFQUErQyxxQ0FBL0MsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFHLENBQUNuTSxJQUFKLEVBQVM7QUFDZEEsYUFBTyxFQUFQO0FBQ0Q7QUFDRCxXQUFPalIsS0FBS2tVLFdBQUwsQ0FBaUJqRCxLQUFLcU0sUUFBTCxFQUFqQixDQUFQO0FBQ0QsR0FQRDtBQVFELENBN0NELEVBOENDM1ksTUE5Q0QsQ0E4Q1EsV0E5Q1IsRUE4Q3FCLFVBQVNoRixPQUFULEVBQWlCO0FBQ3BDLFNBQU8sVUFBU3NSLElBQVQsRUFBYztBQUNuQixXQUFRQSxLQUFLc00sTUFBTCxDQUFZLENBQVosRUFBZUMsV0FBZixLQUErQnZNLEtBQUt3TSxLQUFMLENBQVcsQ0FBWCxDQUF2QztBQUNELEdBRkQ7QUFHRCxDQWxERCxFQW1EQzlZLE1BbkRELENBbURRLFlBbkRSLEVBbURzQixVQUFTaEYsT0FBVCxFQUFpQjtBQUNyQyxTQUFPLFVBQVMrZCxHQUFULEVBQWE7QUFDbEIsV0FBTyxLQUFLQSxNQUFNLEdBQVgsQ0FBUDtBQUNELEdBRkQ7QUFHRCxDQXZERCxFQXdEQy9ZLE1BeERELENBd0RRLG1CQXhEUixFQXdENkIsVUFBU2hGLE9BQVQsRUFBaUI7QUFDNUMsU0FBTyxVQUFVZ2UsRUFBVixFQUFjO0FBQ25CLFFBQUksT0FBT0EsRUFBUCxLQUFjLFdBQWQsSUFBNkJDLE1BQU1ELEVBQU4sQ0FBakMsRUFBNEMsT0FBTyxFQUFQO0FBQzVDLFdBQU9oZSxRQUFRLFFBQVIsRUFBa0JnZSxLQUFLLE1BQXZCLEVBQStCLENBQS9CLENBQVA7QUFDRCxHQUhEO0FBSUQsQ0E3REQsRUE4RENoWixNQTlERCxDQThEUSxtQkE5RFIsRUE4RDZCLFVBQVNoRixPQUFULEVBQWlCO0FBQzVDLFNBQU8sVUFBVWdlLEVBQVYsRUFBYztBQUNuQixRQUFJLE9BQU9BLEVBQVAsS0FBYyxXQUFkLElBQTZCQyxNQUFNRCxFQUFOLENBQWpDLEVBQTRDLE9BQU8sRUFBUDtBQUM1QyxXQUFPaGUsUUFBUSxRQUFSLEVBQWtCZ2UsS0FBSyxPQUF2QixFQUFnQyxDQUFoQyxDQUFQO0FBQ0QsR0FIRDtBQUlELENBbkVELEU7Ozs7Ozs7Ozs7QUNBQW5lLFFBQVFqQixNQUFSLENBQWUsbUJBQWYsRUFDQ3NmLE9BREQsQ0FDUyxhQURULEVBQ3dCLFVBQVM5ZCxLQUFULEVBQWdCRCxFQUFoQixFQUFvQkgsT0FBcEIsRUFBNEI7O0FBRWxELFNBQU87O0FBRUw7QUFDQVksV0FBTyxpQkFBVTtBQUNmLFVBQUdDLE9BQU9zZCxZQUFWLEVBQXVCO0FBQ3JCdGQsZUFBT3NkLFlBQVAsQ0FBb0JDLFVBQXBCLENBQStCLFVBQS9CO0FBQ0F2ZCxlQUFPc2QsWUFBUCxDQUFvQkMsVUFBcEIsQ0FBK0IsU0FBL0I7QUFDQXZkLGVBQU9zZCxZQUFQLENBQW9CQyxVQUFwQixDQUErQixPQUEvQjtBQUNBdmQsZUFBT3NkLFlBQVAsQ0FBb0JDLFVBQXBCLENBQStCLGFBQS9CO0FBQ0Q7QUFDRixLQVZJOztBQVlMQyxpQkFBYSxxQkFBUzlULEtBQVQsRUFBZTtBQUMxQixVQUFHQSxLQUFILEVBQ0UsT0FBTzFKLE9BQU9zZCxZQUFQLENBQW9CRyxPQUFwQixDQUE0QixhQUE1QixFQUEwQy9ULEtBQTFDLENBQVAsQ0FERixLQUdFLE9BQU8xSixPQUFPc2QsWUFBUCxDQUFvQkksT0FBcEIsQ0FBNEIsYUFBNUIsQ0FBUDtBQUNILEtBakJJOztBQW1CTGpaLFdBQU8saUJBQVU7QUFDZixVQUFNMEosa0JBQWtCO0FBQ3RCekosaUJBQVMsRUFBQ2laLE9BQU8sS0FBUixFQUFlekQsYUFBYSxFQUE1QixFQUFnQ3RWLE1BQU0sR0FBdEMsRUFBMkNrTCxRQUFRLEtBQW5ELEVBRGE7QUFFckJqTCxlQUFPLEVBQUN1TyxNQUFNLElBQVAsRUFBYXdLLFVBQVUsS0FBdkIsRUFBOEJDLE1BQU0sS0FBcEMsRUFGYztBQUdyQjNILGlCQUFTLEVBQUNPLEtBQUssS0FBTixFQUFhQyxTQUFTLEtBQXRCLEVBQTZCQyxLQUFLLEtBQWxDLEVBSFk7QUFJckI1USxnQkFBUSxFQUFDLFFBQU8sRUFBUixFQUFXLFVBQVMsRUFBQzNGLE1BQUssRUFBTixFQUFTLFNBQVEsRUFBakIsRUFBcEIsRUFBeUMsU0FBUSxFQUFqRCxFQUFvRCxRQUFPLEVBQTNELEVBQThELFVBQVMsRUFBdkUsRUFBMEU0RixPQUFNLFNBQWhGLEVBQTBGQyxRQUFPLFVBQWpHLEVBQTRHLE1BQUssS0FBakgsRUFBdUgsTUFBSyxLQUE1SCxFQUFrSSxPQUFNLENBQXhJLEVBQTBJLE9BQU0sQ0FBaEosRUFBa0osWUFBVyxDQUE3SixFQUErSixlQUFjLENBQTdLLEVBSmE7QUFLckJpSyx1QkFBZSxFQUFDQyxJQUFHLElBQUosRUFBU3BFLFFBQU8sSUFBaEIsRUFBcUJxRSxNQUFLLElBQTFCLEVBQStCQyxLQUFJLElBQW5DLEVBQXdDeFEsUUFBTyxJQUEvQyxFQUFvRHlNLE9BQU0sRUFBMUQsRUFBNkRnRSxNQUFLLEVBQWxFLEVBTE07QUFNckJzSSxnQkFBUSxFQUFDekksSUFBRyxJQUFKLEVBQVM0SSxPQUFNLHdCQUFmLEVBQXdDMUYsT0FBTSwwQkFBOUMsRUFOYTtBQU9yQjlMLGtCQUFVLENBQUMsRUFBQzdELElBQUcsV0FBU2tFLEtBQUssV0FBTCxDQUFiLEVBQStCQyxPQUFNLEVBQXJDLEVBQXdDQyxNQUFLLEtBQTdDLEVBQW1EakosS0FBSSxlQUF2RCxFQUF1RWtKLFFBQU8sQ0FBOUUsRUFBZ0ZDLFNBQVEsRUFBeEYsRUFBMkZDLEtBQUksQ0FBL0YsRUFBaUdDLFFBQU8sS0FBeEcsRUFBOEdDLFNBQVEsRUFBdEgsRUFBeUhwQixRQUFPLEVBQUNuRixPQUFNLEVBQVAsRUFBVXdHLElBQUcsRUFBYixFQUFnQnZHLFNBQVEsRUFBeEIsRUFBaEksRUFBRCxDQVBXO0FBUXJCd0gsZ0JBQVEsRUFBQ0UsTUFBTSxFQUFQLEVBQVdDLE1BQU0sRUFBakIsRUFBcUJFLE9BQU0sRUFBM0IsRUFBK0IzQyxRQUFRLEVBQXZDLEVBQTJDK0MsT0FBTyxFQUFsRCxFQVJhO0FBU3JCaUUsa0JBQVUsRUFBQ2xQLEtBQUssRUFBTixFQUFVOFksTUFBTSxFQUFoQixFQUFvQnBPLE1BQU0sRUFBMUIsRUFBOEJDLE1BQU0sRUFBcEMsRUFBd0M4RSxJQUFJLEVBQTVDLEVBQWdEQyxLQUFJLEVBQXBELEVBQXdEeEgsUUFBUSxFQUFoRSxFQVRXO0FBVXJCaEMsaUJBQVMsRUFBQ3FLLFVBQVUsRUFBWCxFQUFlQyxTQUFTLEVBQXhCLEVBQTRCdEksUUFBUSxFQUFwQyxFQUF3Q2pDLFNBQVMsRUFBQ3BCLElBQUksRUFBTCxFQUFTdEQsTUFBTSxFQUFmLEVBQW1CVyxNQUFNLGNBQXpCLEVBQWpEO0FBVlksT0FBeEI7QUFZQSxhQUFPb04sZUFBUDtBQUNELEtBakNJOztBQW1DTGpDLHdCQUFvQiw4QkFBVTtBQUM1QixhQUFPO0FBQ0w0UixrQkFBVSxJQURMO0FBRUxsWixjQUFNLE1BRkQ7QUFHTDJMLGlCQUFTO0FBQ1BDLG1CQUFTLElBREY7QUFFUEMsZ0JBQU0sRUFGQztBQUdQQyxpQkFBTyxNQUhBO0FBSVBDLGdCQUFNO0FBSkMsU0FISjtBQVNMb04sb0JBQVksRUFUUDtBQVVMQyxrQkFBVSxFQVZMO0FBV0xDLGdCQUFRLEVBWEg7QUFZTDVFLG9CQUFZLE1BWlA7QUFhTEMsa0JBQVUsTUFiTDtBQWNMNEUsd0JBQWdCLElBZFg7QUFlTEMseUJBQWlCLElBZlo7QUFnQkxDLHNCQUFjO0FBaEJULE9BQVA7QUFrQkQsS0F0REk7O0FBd0RMcFosb0JBQWdCLDBCQUFVO0FBQ3hCLGFBQU8sQ0FBQztBQUNKNUUsY0FBTSxZQURGO0FBRUhzRCxZQUFJLElBRkQ7QUFHSDNDLGNBQU0sT0FISDtBQUlIbUMsZ0JBQVEsS0FKTDtBQUtIOEgsZ0JBQVEsS0FMTDtBQU1IakksZ0JBQVEsRUFBQ2tJLEtBQUksSUFBTCxFQUFVN0gsU0FBUSxLQUFsQixFQUF3QjhILE1BQUssS0FBN0IsRUFBbUMvSCxLQUFJLEtBQXZDLEVBQTZDZ0ksV0FBVSxHQUF2RCxFQUEyREMsUUFBTyxLQUFsRSxFQU5MO0FBT0huSSxjQUFNLEVBQUNnSSxLQUFJLElBQUwsRUFBVTdILFNBQVEsS0FBbEIsRUFBd0I4SCxNQUFLLEtBQTdCLEVBQW1DL0gsS0FBSSxLQUF2QyxFQUE2Q2dJLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFQSDtBQVFIQyxjQUFNLEVBQUNKLEtBQUksSUFBTCxFQUFVSyxLQUFJLEVBQWQsRUFBaUIvSCxPQUFNLEVBQXZCLEVBQTBCeEMsTUFBSyxZQUEvQixFQUE0Q2tILEtBQUksS0FBaEQsRUFBc0RzRCxLQUFJLEtBQTFELEVBQWdFcEwsU0FBUSxDQUF4RSxFQUEwRXFMLFVBQVMsQ0FBbkYsRUFBcUZDLFVBQVMsQ0FBOUYsRUFBZ0dDLFFBQU8sQ0FBdkcsRUFBeUc3TCxRQUFPLEdBQWhILEVBQW9IOEwsTUFBSyxDQUF6SCxFQUEySEMsS0FBSSxDQUEvSCxFQUFpSUMsT0FBTSxDQUF2SSxFQVJIO0FBU0hDLGdCQUFRLEVBVEw7QUFVSEMsZ0JBQVEsRUFWTDtBQVdIQyxjQUFNaE4sUUFBUWlOLElBQVIsQ0FBYSxLQUFLQyxrQkFBTCxFQUFiLEVBQXVDLEVBQUM3SixPQUFNLENBQVAsRUFBU04sS0FBSSxDQUFiLEVBQWVvSyxLQUFJLEdBQW5CLEVBQXZDLENBWEg7QUFZSDdELGlCQUFTLEVBQUM1RSxJQUFJLFdBQVNrRSxLQUFLLFdBQUwsQ0FBZCxFQUFnQy9JLEtBQUksZUFBcEMsRUFBb0RrSixRQUFPLENBQTNELEVBQTZEQyxTQUFRLEVBQXJFLEVBQXdFQyxLQUFJLENBQTVFLEVBQThFQyxRQUFPLEtBQXJGLEVBWk47QUFhSHJHLGlCQUFTLEVBQUNkLE1BQUssT0FBTixFQUFjYyxTQUFRLEVBQXRCLEVBQXlCc0csU0FBUSxFQUFqQyxFQUFvQ2lFLE9BQU0sQ0FBMUMsRUFBNENuTSxVQUFTLEVBQXJELEVBYk47QUFjSG9NLGdCQUFRLEVBQUNDLE9BQU8sS0FBUixFQUFlQyxPQUFPLEtBQXRCLEVBQTZCeEgsU0FBUyxLQUF0QztBQWRMLE9BQUQsRUFlSDtBQUNBM0UsY0FBTSxNQUROO0FBRUNzRCxZQUFJLElBRkw7QUFHQzNDLGNBQU0sT0FIUDtBQUlDbUMsZ0JBQVEsS0FKVDtBQUtDOEgsZ0JBQVEsS0FMVDtBQU1DakksZ0JBQVEsRUFBQ2tJLEtBQUksSUFBTCxFQUFVN0gsU0FBUSxLQUFsQixFQUF3QjhILE1BQUssS0FBN0IsRUFBbUMvSCxLQUFJLEtBQXZDLEVBQTZDZ0ksV0FBVSxHQUF2RCxFQUEyREMsUUFBTyxLQUFsRSxFQU5UO0FBT0NuSSxjQUFNLEVBQUNnSSxLQUFJLElBQUwsRUFBVTdILFNBQVEsS0FBbEIsRUFBd0I4SCxNQUFLLEtBQTdCLEVBQW1DL0gsS0FBSSxLQUF2QyxFQUE2Q2dJLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFQUDtBQVFDQyxjQUFNLEVBQUNKLEtBQUksSUFBTCxFQUFVSyxLQUFJLEVBQWQsRUFBaUIvSCxPQUFNLEVBQXZCLEVBQTBCeEMsTUFBSyxZQUEvQixFQUE0Q2tILEtBQUksS0FBaEQsRUFBc0RzRCxLQUFJLEtBQTFELEVBQWdFcEwsU0FBUSxDQUF4RSxFQUEwRXFMLFVBQVMsQ0FBbkYsRUFBcUZDLFVBQVMsQ0FBOUYsRUFBZ0dDLFFBQU8sQ0FBdkcsRUFBeUc3TCxRQUFPLEdBQWhILEVBQW9IOEwsTUFBSyxDQUF6SCxFQUEySEMsS0FBSSxDQUEvSCxFQUFpSUMsT0FBTSxDQUF2SSxFQVJQO0FBU0NDLGdCQUFRLEVBVFQ7QUFVQ0MsZ0JBQVEsRUFWVDtBQVdDQyxjQUFNaE4sUUFBUWlOLElBQVIsQ0FBYSxLQUFLQyxrQkFBTCxFQUFiLEVBQXVDLEVBQUM3SixPQUFNLENBQVAsRUFBU04sS0FBSSxDQUFiLEVBQWVvSyxLQUFJLEdBQW5CLEVBQXZDLENBWFA7QUFZQzdELGlCQUFTLEVBQUM1RSxJQUFJLFdBQVNrRSxLQUFLLFdBQUwsQ0FBZCxFQUFnQy9JLEtBQUksZUFBcEMsRUFBb0RrSixRQUFPLENBQTNELEVBQTZEQyxTQUFRLEVBQXJFLEVBQXdFQyxLQUFJLENBQTVFLEVBQThFQyxRQUFPLEtBQXJGLEVBWlY7QUFhQ3JHLGlCQUFTLEVBQUNkLE1BQUssT0FBTixFQUFjYyxTQUFRLEVBQXRCLEVBQXlCc0csU0FBUSxFQUFqQyxFQUFvQ2lFLE9BQU0sQ0FBMUMsRUFBNENuTSxVQUFTLEVBQXJELEVBYlY7QUFjQ29NLGdCQUFRLEVBQUNDLE9BQU8sS0FBUixFQUFlQyxPQUFPLEtBQXRCLEVBQTZCeEgsU0FBUyxLQUF0QztBQWRULE9BZkcsRUE4Qkg7QUFDQTNFLGNBQU0sTUFETjtBQUVDc0QsWUFBSSxJQUZMO0FBR0MzQyxjQUFNLEtBSFA7QUFJQ21DLGdCQUFRLEtBSlQ7QUFLQzhILGdCQUFRLEtBTFQ7QUFNQ2pJLGdCQUFRLEVBQUNrSSxLQUFJLElBQUwsRUFBVTdILFNBQVEsS0FBbEIsRUFBd0I4SCxNQUFLLEtBQTdCLEVBQW1DL0gsS0FBSSxLQUF2QyxFQUE2Q2dJLFdBQVUsR0FBdkQsRUFBMkRDLFFBQU8sS0FBbEUsRUFOVDtBQU9DbkksY0FBTSxFQUFDZ0ksS0FBSSxJQUFMLEVBQVU3SCxTQUFRLEtBQWxCLEVBQXdCOEgsTUFBSyxLQUE3QixFQUFtQy9ILEtBQUksS0FBdkMsRUFBNkNnSSxXQUFVLEdBQXZELEVBQTJEQyxRQUFPLEtBQWxFLEVBUFA7QUFRQ0MsY0FBTSxFQUFDSixLQUFJLElBQUwsRUFBVUssS0FBSSxFQUFkLEVBQWlCL0gsT0FBTSxFQUF2QixFQUEwQnhDLE1BQUssWUFBL0IsRUFBNENrSCxLQUFJLEtBQWhELEVBQXNEc0QsS0FBSSxLQUExRCxFQUFnRXBMLFNBQVEsQ0FBeEUsRUFBMEVxTCxVQUFTLENBQW5GLEVBQXFGQyxVQUFTLENBQTlGLEVBQWdHQyxRQUFPLENBQXZHLEVBQXlHN0wsUUFBTyxHQUFoSCxFQUFvSDhMLE1BQUssQ0FBekgsRUFBMkhDLEtBQUksQ0FBL0gsRUFBaUlDLE9BQU0sQ0FBdkksRUFSUDtBQVNDQyxnQkFBUSxFQVRUO0FBVUNDLGdCQUFRLEVBVlQ7QUFXQ0MsY0FBTWhOLFFBQVFpTixJQUFSLENBQWEsS0FBS0Msa0JBQUwsRUFBYixFQUF1QyxFQUFDN0osT0FBTSxDQUFQLEVBQVNOLEtBQUksQ0FBYixFQUFlb0ssS0FBSSxHQUFuQixFQUF2QyxDQVhQO0FBWUM3RCxpQkFBUyxFQUFDNUUsSUFBSSxXQUFTa0UsS0FBSyxXQUFMLENBQWQsRUFBZ0MvSSxLQUFJLGVBQXBDLEVBQW9Ea0osUUFBTyxDQUEzRCxFQUE2REMsU0FBUSxFQUFyRSxFQUF3RUMsS0FBSSxDQUE1RSxFQUE4RUMsUUFBTyxLQUFyRixFQVpWO0FBYUNyRyxpQkFBUyxFQUFDZCxNQUFLLE9BQU4sRUFBY2MsU0FBUSxFQUF0QixFQUF5QnNHLFNBQVEsRUFBakMsRUFBb0NpRSxPQUFNLENBQTFDLEVBQTRDbk0sVUFBUyxFQUFyRCxFQWJWO0FBY0NvTSxnQkFBUSxFQUFDQyxPQUFPLEtBQVIsRUFBZUMsT0FBTyxLQUF0QixFQUE2QnhILFNBQVMsS0FBdEM7QUFkVCxPQTlCRyxDQUFQO0FBOENELEtBdkdJOztBQXlHTFAsY0FBVSxrQkFBUzBQLEdBQVQsRUFBYXBJLE1BQWIsRUFBb0I7QUFDNUIsVUFBRyxDQUFDOUwsT0FBT3NkLFlBQVgsRUFDRSxPQUFPeFIsTUFBUDtBQUNGLFVBQUk7QUFDRixZQUFHQSxNQUFILEVBQVU7QUFDUixpQkFBTzlMLE9BQU9zZCxZQUFQLENBQW9CRyxPQUFwQixDQUE0QnZKLEdBQTVCLEVBQWdDaEssS0FBSzJKLFNBQUwsQ0FBZS9ILE1BQWYsQ0FBaEMsQ0FBUDtBQUNELFNBRkQsTUFHSyxJQUFHOUwsT0FBT3NkLFlBQVAsQ0FBb0JJLE9BQXBCLENBQTRCeEosR0FBNUIsQ0FBSCxFQUFvQztBQUN2QyxpQkFBT2hLLEtBQUtDLEtBQUwsQ0FBV25LLE9BQU9zZCxZQUFQLENBQW9CSSxPQUFwQixDQUE0QnhKLEdBQTVCLENBQVgsQ0FBUDtBQUNELFNBRkksTUFFRSxJQUFHQSxPQUFPLFVBQVYsRUFBcUI7QUFDMUIsaUJBQU8sS0FBS3pQLEtBQUwsRUFBUDtBQUNEO0FBQ0YsT0FURCxDQVNFLE9BQU05RSxDQUFOLEVBQVE7QUFDUjtBQUNEO0FBQ0QsYUFBT21NLE1BQVA7QUFDRCxLQXpISTs7QUEySExxQixpQkFBYSxxQkFBUy9NLElBQVQsRUFBYztBQUN6QixVQUFJOFYsVUFBVSxDQUNaLEVBQUM5VixNQUFNLFlBQVAsRUFBcUIySCxRQUFRLElBQTdCLEVBQW1DQyxTQUFTLEtBQTVDLEVBQW1EbEgsS0FBSyxJQUF4RCxFQURZLEVBRVgsRUFBQ1YsTUFBTSxTQUFQLEVBQWtCMkgsUUFBUSxLQUExQixFQUFpQ0MsU0FBUyxJQUExQyxFQUFnRGxILEtBQUssSUFBckQsRUFGVyxFQUdYLEVBQUNWLE1BQU0sT0FBUCxFQUFnQjJILFFBQVEsSUFBeEIsRUFBOEJDLFNBQVMsSUFBdkMsRUFBNkNsSCxLQUFLLElBQWxELEVBSFcsRUFJWCxFQUFDVixNQUFNLE9BQVAsRUFBZ0IySCxRQUFRLEtBQXhCLEVBQStCQyxTQUFTLElBQXhDLEVBQThDbEgsS0FBSyxJQUFuRCxFQUpXLEVBS1gsRUFBQ1YsTUFBTSxPQUFQLEVBQWdCMkgsUUFBUSxLQUF4QixFQUErQkMsU0FBUyxJQUF4QyxFQUE4Q2xILEtBQUssS0FBbkQsRUFMVyxFQU1YLEVBQUNWLE1BQU0sT0FBUCxFQUFnQjJILFFBQVEsS0FBeEIsRUFBK0JDLFNBQVMsSUFBeEMsRUFBOENsSCxLQUFLLEtBQW5ELEVBTlcsRUFPWCxFQUFDVixNQUFNLE9BQVAsRUFBZ0IySCxRQUFRLEtBQXhCLEVBQStCQyxTQUFTLElBQXhDLEVBQThDbEgsS0FBSyxJQUFuRCxFQVBXLEVBUVgsRUFBQ1YsTUFBTSxPQUFQLEVBQWdCMkgsUUFBUSxLQUF4QixFQUErQkMsU0FBUyxJQUF4QyxFQUE4Q2xILEtBQUssS0FBbkQsRUFSVyxFQVNYLEVBQUNWLE1BQU0sT0FBUCxFQUFnQjJILFFBQVEsS0FBeEIsRUFBK0JDLFNBQVMsSUFBeEMsRUFBOENsSCxLQUFLLEtBQW5ELEVBVFcsRUFVWCxFQUFDVixNQUFNLGNBQVAsRUFBdUIySCxRQUFRLElBQS9CLEVBQXFDQyxTQUFTLEtBQTlDLEVBQXFEc0QsS0FBSyxJQUExRCxFQUFnRThCLFNBQVMsSUFBekUsRUFBK0V0TSxLQUFLLElBQXBGLEVBVlcsRUFXWCxFQUFDVixNQUFNLFFBQVAsRUFBaUIySCxRQUFRLElBQXpCLEVBQStCQyxTQUFTLEtBQXhDLEVBQStDbEgsS0FBSyxJQUFwRCxFQVhXLENBQWQ7QUFhQSxVQUFHVixJQUFILEVBQ0UsT0FBTzhELEVBQUVDLE1BQUYsQ0FBUytSLE9BQVQsRUFBa0IsRUFBQyxRQUFROVYsSUFBVCxFQUFsQixFQUFrQyxDQUFsQyxDQUFQO0FBQ0YsYUFBTzhWLE9BQVA7QUFDRCxLQTVJSTs7QUE4SUx4VSxpQkFBYSxxQkFBU1gsSUFBVCxFQUFjO0FBQ3pCLFVBQUkrQixVQUFVLENBQ1osRUFBQyxRQUFPLE1BQVIsRUFBZSxRQUFPLEtBQXRCLEVBQTRCLFVBQVMsR0FBckMsRUFBeUMsUUFBTyxDQUFoRCxFQURZLEVBRVgsRUFBQyxRQUFPLE1BQVIsRUFBZSxRQUFPLE9BQXRCLEVBQThCLFVBQVMsR0FBdkMsRUFBMkMsUUFBTyxDQUFsRCxFQUZXLEVBR1gsRUFBQyxRQUFPLFlBQVIsRUFBcUIsUUFBTyxPQUE1QixFQUFvQyxVQUFTLEdBQTdDLEVBQWlELFFBQU8sQ0FBeEQsRUFIVyxFQUlYLEVBQUMsUUFBTyxXQUFSLEVBQW9CLFFBQU8sV0FBM0IsRUFBdUMsVUFBUyxFQUFoRCxFQUFtRCxRQUFPLENBQTFELEVBSlcsRUFLWCxFQUFDLFFBQU8sTUFBUixFQUFlLFFBQU8sS0FBdEIsRUFBNEIsVUFBUyxFQUFyQyxFQUF3QyxRQUFPLENBQS9DLEVBTFcsRUFNWCxFQUFDLFFBQU8sTUFBUixFQUFlLFFBQU8sVUFBdEIsRUFBaUMsVUFBUyxFQUExQyxFQUE2QyxRQUFPLENBQXBELEVBTlcsRUFPWCxFQUFDLFFBQU8sT0FBUixFQUFnQixRQUFPLFVBQXZCLEVBQWtDLFVBQVMsRUFBM0MsRUFBOEMsUUFBTyxDQUFyRCxFQVBXLENBQWQ7QUFTQSxVQUFHL0IsSUFBSCxFQUNFLE9BQU9tRCxFQUFFQyxNQUFGLENBQVNyQixPQUFULEVBQWtCLEVBQUMsUUFBUS9CLElBQVQsRUFBbEIsRUFBa0MsQ0FBbEMsQ0FBUDtBQUNGLGFBQU8rQixPQUFQO0FBQ0QsS0EzSkk7O0FBNkpMaVIsWUFBUSxnQkFBU3pMLE9BQVQsRUFBaUI7QUFDdkIsVUFBSTlELFdBQVcsS0FBS0EsUUFBTCxDQUFjLFVBQWQsQ0FBZjtBQUNBLFVBQUl1UCxTQUFTLHNCQUFiOztBQUVBLFVBQUd6TCxXQUFXQSxRQUFRekosR0FBdEIsRUFBMEI7QUFDeEJrVixpQkFBVXpMLFFBQVF6SixHQUFSLENBQVlpRixPQUFaLENBQW9CLElBQXBCLE1BQThCLENBQUMsQ0FBaEMsR0FDUHdFLFFBQVF6SixHQUFSLENBQVlnTyxNQUFaLENBQW1CdkUsUUFBUXpKLEdBQVIsQ0FBWWlGLE9BQVosQ0FBb0IsSUFBcEIsSUFBMEIsQ0FBN0MsQ0FETyxHQUVQd0UsUUFBUXpKLEdBRlY7O0FBSUEsWUFBRyxDQUFDLENBQUN5SixRQUFRSixNQUFiLEVBQ0U2TCxzQkFBb0JBLE1BQXBCLENBREYsS0FHRUEscUJBQW1CQSxNQUFuQjtBQUNIOztBQUVELGFBQU9BLE1BQVA7QUFDRCxLQTdLSTs7QUErS0xoSCxXQUFPLGVBQVN6RSxPQUFULEVBQWtCK1YsY0FBbEIsRUFBaUM7QUFDdEMsVUFBR0EsY0FBSCxFQUFrQjtBQUNoQixZQUFHL1YsUUFBUVQsS0FBUixDQUFja1AsV0FBZCxHQUE0QmpULE9BQTVCLENBQW9DLElBQXBDLE1BQThDLENBQUMsQ0FBbEQsRUFDRSxPQUFPLElBQVAsQ0FERixLQUVLLElBQUd3RSxRQUFRVCxLQUFSLENBQWNrUCxXQUFkLEdBQTRCalQsT0FBNUIsQ0FBb0MsTUFBcEMsTUFBZ0QsQ0FBQyxDQUFwRCxFQUNILE9BQU8sTUFBUCxDQURHLEtBR0gsT0FBTyxLQUFQO0FBQ0g7QUFDRCxhQUFPLENBQUMsRUFBRXdFLFdBQVdBLFFBQVFULEtBQW5CLEtBQTZCUyxRQUFRVCxLQUFSLENBQWNrUCxXQUFkLEdBQTRCalQsT0FBNUIsQ0FBb0MsS0FBcEMsTUFBK0MsQ0FBQyxDQUFoRCxJQUFxRHdFLFFBQVFULEtBQVIsQ0FBY2tQLFdBQWQsR0FBNEJqVCxPQUE1QixDQUFvQyxTQUFwQyxNQUFtRCxDQUFDLENBQXRJLENBQUYsQ0FBUjtBQUNELEtBekxJOztBQTJMTHdJLFdBQU8sZUFBU2dTLFdBQVQsRUFBc0J6VSxHQUF0QixFQUEyQjZHLEtBQTNCLEVBQWtDK0gsSUFBbEMsRUFBd0M5VixNQUF4QyxFQUErQztBQUNwRCxVQUFJNGIsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7O0FBRUEsVUFBSUMsVUFBVSxFQUFDLGVBQWUsQ0FBQyxFQUFDLFlBQVk1VSxHQUFiO0FBQ3pCLG1CQUFTbEgsT0FBT3ZDLElBRFM7QUFFekIsd0JBQWMsWUFBVU0sU0FBU1QsUUFBVCxDQUFrQlksSUFGakI7QUFHekIsb0JBQVUsQ0FBQyxFQUFDLFNBQVNnSixHQUFWLEVBQUQsQ0FIZTtBQUl6QixtQkFBUzZHLEtBSmdCO0FBS3pCLHVCQUFhLENBQUMsTUFBRCxFQUFTLFVBQVQsRUFBcUIsUUFBckIsQ0FMWTtBQU16Qix1QkFBYStIO0FBTlksU0FBRDtBQUFoQixPQUFkOztBQVVBbFosWUFBTSxFQUFDVixLQUFLeWYsV0FBTixFQUFtQnJZLFFBQU8sTUFBMUIsRUFBa0MrSSxNQUFNLGFBQVc5RSxLQUFLMkosU0FBTCxDQUFlNEssT0FBZixDQUFuRCxFQUE0RWpnQixTQUFTLEVBQUUsZ0JBQWdCLG1DQUFsQixFQUFyRixFQUFOLEVBQ0dtSyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNELEtBaE5JOztBQWtOTGxXLGFBQVMsaUJBQVNKLE9BQVQsRUFBa0J1VyxRQUFsQixFQUEyQjtBQUNsQyxVQUFJTixJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLFVBQUkzZixNQUFNLEtBQUtrVixNQUFMLENBQVl6TCxPQUFaLElBQXFCLFdBQXJCLEdBQWlDdVcsUUFBM0M7QUFDQSxVQUFJcmEsV0FBVyxLQUFLQSxRQUFMLENBQWMsVUFBZCxDQUFmO0FBQ0EsVUFBSXNhLFVBQVUsRUFBQ2pnQixLQUFLQSxHQUFOLEVBQVdvSCxRQUFRLEtBQW5CLEVBQTBCMUYsU0FBU2lFLFNBQVNFLE9BQVQsQ0FBaUJ3VixXQUFqQixHQUE2QixLQUFoRSxFQUFkO0FBQ0EzYSxZQUFNdWYsT0FBTixFQUNHblcsSUFESCxDQUNRLG9CQUFZO0FBQ2hCLFlBQUdjLFNBQVNqTCxPQUFULENBQWlCLGtCQUFqQixDQUFILEVBQ0VpTCxTQUFTdUYsSUFBVCxDQUFjZ0YsY0FBZCxHQUErQnZLLFNBQVNqTCxPQUFULENBQWlCLGtCQUFqQixDQUEvQjtBQUNGK2YsVUFBRUcsT0FBRixDQUFValYsU0FBU3VGLElBQW5CO0FBQ0QsT0FMSCxFQU1HOUYsS0FOSCxDQU1TLGVBQU87QUFDWnFWLFVBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxPQVJIO0FBU0EsYUFBT29WLEVBQUVLLE9BQVQ7QUFDRCxLQWpPSTtBQWtPTDtBQUNBO0FBQ0E7QUFDQTtBQUNBdlQsVUFBTSxjQUFTMUksTUFBVCxFQUFnQjtBQUNwQixVQUFHLENBQUNBLE9BQU8yRixPQUFYLEVBQW9CLE9BQU9oSixHQUFHcWYsTUFBSCxDQUFVLDJCQUFWLENBQVA7QUFDcEIsVUFBSUosSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxVQUFJM2YsTUFBTSxLQUFLa1YsTUFBTCxDQUFZcFIsT0FBTzJGLE9BQW5CLElBQTRCLFdBQTVCLEdBQXdDM0YsT0FBTzBJLElBQVAsQ0FBWXRLLElBQTlEO0FBQ0EsVUFBRyxLQUFLZ00sS0FBTCxDQUFXcEssT0FBTzJGLE9BQWxCLENBQUgsRUFBOEI7QUFDNUIsWUFBRzNGLE9BQU8wSSxJQUFQLENBQVlKLEdBQVosQ0FBZ0JuSCxPQUFoQixDQUF3QixHQUF4QixNQUFpQyxDQUFwQyxFQUNFakYsT0FBTyxXQUFTOEQsT0FBTzBJLElBQVAsQ0FBWUosR0FBNUIsQ0FERixLQUdFcE0sT0FBTyxXQUFTOEQsT0FBTzBJLElBQVAsQ0FBWUosR0FBNUI7QUFDRixZQUFHLENBQUMsQ0FBQ3RJLE9BQU8wSSxJQUFQLENBQVlDLEdBQWQsSUFBcUIsQ0FBQyxJQUFELEVBQU0sSUFBTixFQUFZeEgsT0FBWixDQUFvQm5CLE9BQU8wSSxJQUFQLENBQVlDLEdBQWhDLE1BQXlDLENBQUMsQ0FBbEUsRUFBcUU7QUFDbkV6TSxpQkFBTyxXQUFTOEQsT0FBTzBJLElBQVAsQ0FBWUMsR0FBNUIsQ0FERixLQUVLLElBQUcsQ0FBQyxDQUFDM0ksT0FBTzBJLElBQVAsQ0FBWTlILEtBQWpCLEVBQXdCO0FBQzNCMUUsaUJBQU8sWUFBVThELE9BQU8wSSxJQUFQLENBQVk5SCxLQUE3QjtBQUNILE9BVEQsTUFTTztBQUNMLFlBQUcsQ0FBQyxDQUFDWixPQUFPMEksSUFBUCxDQUFZQyxHQUFkLElBQXFCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBWXhILE9BQVosQ0FBb0JuQixPQUFPMEksSUFBUCxDQUFZQyxHQUFoQyxNQUF5QyxDQUFDLENBQWxFLEVBQXFFO0FBQ25Fek0saUJBQU84RCxPQUFPMEksSUFBUCxDQUFZQyxHQUFuQixDQURGLEtBRUssSUFBRyxDQUFDLENBQUMzSSxPQUFPMEksSUFBUCxDQUFZOUgsS0FBakIsRUFBd0I7QUFDM0IxRSxpQkFBTyxZQUFVOEQsT0FBTzBJLElBQVAsQ0FBWTlILEtBQTdCO0FBQ0YxRSxlQUFPLE1BQUk4RCxPQUFPMEksSUFBUCxDQUFZSixHQUF2QjtBQUNEO0FBQ0QsVUFBSXpHLFdBQVcsS0FBS0EsUUFBTCxDQUFjLFVBQWQsQ0FBZjtBQUNBLFVBQUlzYSxVQUFVLEVBQUNqZ0IsS0FBS0EsR0FBTixFQUFXb0gsUUFBUSxLQUFuQixFQUEwQjFGLFNBQVNpRSxTQUFTRSxPQUFULENBQWlCd1YsV0FBakIsR0FBNkIsS0FBaEUsRUFBZDs7QUFFQSxVQUFHdlgsT0FBTzJGLE9BQVAsQ0FBZWxELFFBQWxCLEVBQTJCO0FBQ3pCMFosZ0JBQVFDLGVBQVIsR0FBMEIsSUFBMUI7QUFDQUQsZ0JBQVF0Z0IsT0FBUixHQUFrQixFQUFDLGlCQUFpQixXQUFTb0osS0FBSyxVQUFRakYsT0FBTzJGLE9BQVAsQ0FBZWxELFFBQWYsQ0FBd0JxUyxJQUF4QixFQUFiLENBQTNCLEVBQWxCO0FBQ0Q7O0FBRURsWSxZQUFNdWYsT0FBTixFQUNHblcsSUFESCxDQUNRLG9CQUFZO0FBQ2hCYyxpQkFBU3VGLElBQVQsQ0FBY2dGLGNBQWQsR0FBK0J2SyxTQUFTakwsT0FBVCxDQUFpQixrQkFBakIsQ0FBL0I7QUFDQStmLFVBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFuQjtBQUNELE9BSkgsRUFLRzlGLEtBTEgsQ0FLUyxlQUFPO0FBQ1pxVixVQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsT0FQSDtBQVFBLGFBQU9vVixFQUFFSyxPQUFUO0FBQ0QsS0EzUUk7QUE0UUw7QUFDQTtBQUNBO0FBQ0E1VyxhQUFTLGlCQUFTckYsTUFBVCxFQUFnQnFjLE1BQWhCLEVBQXVCM2MsS0FBdkIsRUFBNkI7QUFDcEMsVUFBRyxDQUFDTSxPQUFPMkYsT0FBWCxFQUFvQixPQUFPaEosR0FBR3FmLE1BQUgsQ0FBVSwyQkFBVixDQUFQO0FBQ3BCLFVBQUlKLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0EsVUFBSTNmLE1BQU0sS0FBS2tWLE1BQUwsQ0FBWXBSLE9BQU8yRixPQUFuQixJQUE0QixrQkFBdEM7QUFDQSxVQUFHLEtBQUt5RSxLQUFMLENBQVdwSyxPQUFPMkYsT0FBbEIsQ0FBSCxFQUE4QjtBQUM1QnpKLGVBQU8sV0FBU21nQixNQUFULEdBQWdCLFNBQWhCLEdBQTBCM2MsS0FBakM7QUFDRCxPQUZELE1BRU87QUFDTHhELGVBQU8sTUFBSW1nQixNQUFKLEdBQVcsR0FBWCxHQUFlM2MsS0FBdEI7QUFDRDtBQUNELFVBQUltQyxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJc2EsVUFBVSxFQUFDamdCLEtBQUtBLEdBQU4sRUFBV29ILFFBQVEsS0FBbkIsRUFBMEIxRixTQUFTaUUsU0FBU0UsT0FBVCxDQUFpQndWLFdBQWpCLEdBQTZCLEtBQWhFLEVBQWQ7O0FBRUEsVUFBR3ZYLE9BQU8yRixPQUFQLENBQWVsRCxRQUFsQixFQUEyQjtBQUN6QjBaLGdCQUFRQyxlQUFSLEdBQTBCLElBQTFCO0FBQ0FELGdCQUFRdGdCLE9BQVIsR0FBa0IsRUFBQyxpQkFBaUIsV0FBU29KLEtBQUssVUFBUWpGLE9BQU8yRixPQUFQLENBQWVsRCxRQUFmLENBQXdCcVMsSUFBeEIsRUFBYixDQUEzQixFQUFsQjtBQUNEOztBQUVEbFksWUFBTXVmLE9BQU4sRUFDR25XLElBREgsQ0FDUSxvQkFBWTtBQUNoQmMsaUJBQVN1RixJQUFULENBQWNnRixjQUFkLEdBQStCdkssU0FBU2pMLE9BQVQsQ0FBaUIsa0JBQWpCLENBQS9CO0FBQ0ErZixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUpILEVBS0c5RixLQUxILENBS1MsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BUEg7QUFRQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNELEtBelNJOztBQTJTTDdXLFlBQVEsZ0JBQVNwRixNQUFULEVBQWdCcWMsTUFBaEIsRUFBdUIzYyxLQUF2QixFQUE2QjtBQUNuQyxVQUFHLENBQUNNLE9BQU8yRixPQUFYLEVBQW9CLE9BQU9oSixHQUFHcWYsTUFBSCxDQUFVLDJCQUFWLENBQVA7QUFDcEIsVUFBSUosSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxVQUFJM2YsTUFBTSxLQUFLa1YsTUFBTCxDQUFZcFIsT0FBTzJGLE9BQW5CLElBQTRCLGlCQUF0QztBQUNBLFVBQUcsS0FBS3lFLEtBQUwsQ0FBV3BLLE9BQU8yRixPQUFsQixDQUFILEVBQThCO0FBQzVCekosZUFBTyxXQUFTbWdCLE1BQVQsR0FBZ0IsU0FBaEIsR0FBMEIzYyxLQUFqQztBQUNELE9BRkQsTUFFTztBQUNMeEQsZUFBTyxNQUFJbWdCLE1BQUosR0FBVyxHQUFYLEdBQWUzYyxLQUF0QjtBQUNEO0FBQ0QsVUFBSW1DLFdBQVcsS0FBS0EsUUFBTCxDQUFjLFVBQWQsQ0FBZjtBQUNBLFVBQUlzYSxVQUFVLEVBQUNqZ0IsS0FBS0EsR0FBTixFQUFXb0gsUUFBUSxLQUFuQixFQUEwQjFGLFNBQVNpRSxTQUFTRSxPQUFULENBQWlCd1YsV0FBakIsR0FBNkIsS0FBaEUsRUFBZDs7QUFFQSxVQUFHdlgsT0FBTzJGLE9BQVAsQ0FBZWxELFFBQWxCLEVBQTJCO0FBQ3pCMFosZ0JBQVFDLGVBQVIsR0FBMEIsSUFBMUI7QUFDQUQsZ0JBQVF0Z0IsT0FBUixHQUFrQixFQUFDLGlCQUFpQixXQUFTb0osS0FBSyxVQUFRakYsT0FBTzJGLE9BQVAsQ0FBZWxELFFBQWYsQ0FBd0JxUyxJQUF4QixFQUFiLENBQTNCLEVBQWxCO0FBQ0Q7O0FBRURsWSxZQUFNdWYsT0FBTixFQUNHblcsSUFESCxDQUNRLG9CQUFZO0FBQ2hCYyxpQkFBU3VGLElBQVQsQ0FBY2dGLGNBQWQsR0FBK0J2SyxTQUFTakwsT0FBVCxDQUFpQixrQkFBakIsQ0FBL0I7QUFDQStmLFVBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFuQjtBQUNELE9BSkgsRUFLRzlGLEtBTEgsQ0FLUyxlQUFPO0FBQ1pxVixVQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsT0FQSDtBQVFBLGFBQU9vVixFQUFFSyxPQUFUO0FBQ0QsS0FyVUk7O0FBdVVMSyxpQkFBYSxxQkFBU3RjLE1BQVQsRUFBZ0JxYyxNQUFoQixFQUF1QnplLE9BQXZCLEVBQStCO0FBQzFDLFVBQUcsQ0FBQ29DLE9BQU8yRixPQUFYLEVBQW9CLE9BQU9oSixHQUFHcWYsTUFBSCxDQUFVLDJCQUFWLENBQVA7QUFDcEIsVUFBSUosSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxVQUFJM2YsTUFBTSxLQUFLa1YsTUFBTCxDQUFZcFIsT0FBTzJGLE9BQW5CLElBQTRCLGtCQUF0QztBQUNBLFVBQUcsS0FBS3lFLEtBQUwsQ0FBV3BLLE9BQU8yRixPQUFsQixDQUFILEVBQThCO0FBQzVCekosZUFBTyxXQUFTbWdCLE1BQWhCO0FBQ0QsT0FGRCxNQUVPO0FBQ0xuZ0IsZUFBTyxNQUFJbWdCLE1BQVg7QUFDRDtBQUNELFVBQUl4YSxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJc2EsVUFBVSxFQUFDamdCLEtBQUtBLEdBQU4sRUFBV29ILFFBQVEsS0FBbkIsRUFBMEIxRixTQUFTaUUsU0FBU0UsT0FBVCxDQUFpQndWLFdBQWpCLEdBQTZCLEtBQWhFLEVBQWQ7O0FBRUEsVUFBR3ZYLE9BQU8yRixPQUFQLENBQWVsRCxRQUFsQixFQUEyQjtBQUN6QjBaLGdCQUFRQyxlQUFSLEdBQTBCLElBQTFCO0FBQ0FELGdCQUFRdGdCLE9BQVIsR0FBa0IsRUFBQyxpQkFBaUIsV0FBU29KLEtBQUssVUFBUWpGLE9BQU8yRixPQUFQLENBQWVsRCxRQUFmLENBQXdCcVMsSUFBeEIsRUFBYixDQUEzQixFQUFsQjtBQUNEOztBQUVEbFksWUFBTXVmLE9BQU4sRUFDR25XLElBREgsQ0FDUSxvQkFBWTtBQUNoQmMsaUJBQVN1RixJQUFULENBQWNnRixjQUFkLEdBQStCdkssU0FBU2pMLE9BQVQsQ0FBaUIsa0JBQWpCLENBQS9CO0FBQ0ErZixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUpILEVBS0c5RixLQUxILENBS1MsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BUEg7QUFRQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNELEtBaldJOztBQW1XTDVPLG1CQUFlLHVCQUFTN0ssSUFBVCxFQUFlQyxRQUFmLEVBQXdCO0FBQ3JDLFVBQUltWixJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLFVBQUlVLFFBQVEsRUFBWjtBQUNBLFVBQUc5WixRQUFILEVBQ0U4WixRQUFRLGVBQWEzSCxJQUFJblMsUUFBSixDQUFyQjtBQUNGN0YsWUFBTSxFQUFDVixLQUFLLDRDQUEwQ3NHLElBQTFDLEdBQStDK1osS0FBckQsRUFBNERqWixRQUFRLEtBQXBFLEVBQU4sRUFDRzBDLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLFVBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFuQjtBQUNELE9BSEgsRUFJRzlGLEtBSkgsQ0FJUyxlQUFPO0FBQ1pxVixVQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsT0FOSDtBQU9BLGFBQU9vVixFQUFFSyxPQUFUO0FBQ0QsS0FoWEk7O0FBa1hMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQXZSLGlCQUFhLHFCQUFTcEksS0FBVCxFQUFlO0FBQzFCLFVBQUlzWixJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLFVBQUloYSxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJMUIsVUFBVSxLQUFLMEIsUUFBTCxDQUFjLFNBQWQsQ0FBZDtBQUNBLFVBQUkyYSxLQUFLM2IsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsRUFBQzJCLFVBQVVILE1BQU1HLFFBQWpCLEVBQTJCRSxRQUFRTCxNQUFNSyxNQUF6QyxFQUFsQixDQUFUO0FBQ0E7QUFDQXBCLFFBQUVtRSxJQUFGLENBQU92RixPQUFQLEVBQWdCLFVBQUNILE1BQUQsRUFBU21ULENBQVQsRUFBZTtBQUM3QixlQUFPaFQsUUFBUWdULENBQVIsRUFBVzlKLElBQWxCO0FBQ0EsZUFBT2xKLFFBQVFnVCxDQUFSLEVBQVdoSyxNQUFsQjtBQUNELE9BSEQ7QUFJQSxhQUFPdEgsU0FBU08sT0FBaEI7QUFDQSxhQUFPUCxTQUFTdUosUUFBaEI7QUFDQSxhQUFPdkosU0FBUzZFLE1BQWhCO0FBQ0EsYUFBTzdFLFNBQVMwTCxhQUFoQjtBQUNBLGFBQU8xTCxTQUFTMlIsUUFBaEI7QUFDQTNSLGVBQVNzTCxNQUFULEdBQWtCLElBQWxCO0FBQ0EsVUFBR3FQLEdBQUcvWixRQUFOLEVBQ0UrWixHQUFHL1osUUFBSCxHQUFjbVMsSUFBSTRILEdBQUcvWixRQUFQLENBQWQ7QUFDRjdGLFlBQU0sRUFBQ1YsS0FBSyw0Q0FBTjtBQUNGb0gsZ0JBQU8sTUFETDtBQUVGK0ksY0FBTSxFQUFDLFNBQVNtUSxFQUFWLEVBQWMsWUFBWTNhLFFBQTFCLEVBQW9DLFdBQVcxQixPQUEvQyxFQUZKO0FBR0Z0RSxpQkFBUyxFQUFDLGdCQUFnQixrQkFBakI7QUFIUCxPQUFOLEVBS0dtSyxJQUxILENBS1Esb0JBQVk7QUFDaEI0VixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQVBILEVBUUc5RixLQVJILENBUVMsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BVkg7QUFXQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNELEtBN1pJOztBQStaTGpSLGVBQVcsbUJBQVNyRixPQUFULEVBQWlCO0FBQzFCLFVBQUlpVyxJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLFVBQUlVLGlCQUFlNVcsUUFBUXpKLEdBQTNCOztBQUVBLFVBQUd5SixRQUFRbEQsUUFBWCxFQUNFOFosU0FBUyxXQUFTdFgsS0FBSyxVQUFRVSxRQUFRbEQsUUFBUixDQUFpQnFTLElBQWpCLEVBQWIsQ0FBbEI7O0FBRUZsWSxZQUFNLEVBQUNWLEtBQUssOENBQTRDcWdCLEtBQWxELEVBQXlEalosUUFBUSxLQUFqRSxFQUFOLEVBQ0cwQyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNELEtBOWFJOztBQWdiTHBHLFFBQUksWUFBU2xRLE9BQVQsRUFBaUI7QUFDbkIsVUFBSWlXLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSOztBQUVBamYsWUFBTSxFQUFDVixLQUFLLHVDQUFOLEVBQStDb0gsUUFBUSxLQUF2RCxFQUFOLEVBQ0cwQyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNELEtBM2JJOztBQTZiTHJTLFdBQU8saUJBQVU7QUFDYixhQUFPO0FBQ0w2UyxnQkFBUSxrQkFBTTtBQUNaLGNBQUliLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0FqZixnQkFBTSxFQUFDVixLQUFLLGlEQUFOLEVBQXlEb0gsUUFBUSxLQUFqRSxFQUFOLEVBQ0cwQyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixjQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxXQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsY0FBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELFdBTkg7QUFPQSxpQkFBT29WLEVBQUVLLE9BQVQ7QUFDRCxTQVhJO0FBWUw3TCxhQUFLLGVBQU07QUFDVCxjQUFJd0wsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQWpmLGdCQUFNLEVBQUNWLEtBQUssMkNBQU4sRUFBbURvSCxRQUFRLEtBQTNELEVBQU4sRUFDRzBDLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLGNBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFuQjtBQUNELFdBSEgsRUFJRzlGLEtBSkgsQ0FJUyxlQUFPO0FBQ1pxVixjQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsV0FOSDtBQU9BLGlCQUFPb1YsRUFBRUssT0FBVDtBQUNEO0FBdEJJLE9BQVA7QUF3QkgsS0F0ZEk7O0FBd2RMdlYsWUFBUSxrQkFBVTtBQUFBOztBQUNoQixVQUFNeEssTUFBTSw2QkFBWjtBQUNBLFVBQUlxRyxTQUFTO0FBQ1htYSxpQkFBUyxjQURFO0FBRVhDLGdCQUFRLFdBRkc7QUFHWEMsZ0JBQVEsV0FIRztBQUlYQyxjQUFNLGVBSks7QUFLWEMsaUJBQVMsTUFMRTtBQU1YQyxnQkFBUTtBQU5HLE9BQWI7QUFRQSxhQUFPO0FBQ0x2SSxvQkFBWSxzQkFBTTtBQUNoQixjQUFJM1MsV0FBVyxNQUFLQSxRQUFMLENBQWMsVUFBZCxDQUFmO0FBQ0EsY0FBR0EsU0FBUzZFLE1BQVQsQ0FBZ0JLLEtBQW5CLEVBQXlCO0FBQ3ZCeEUsbUJBQU93RSxLQUFQLEdBQWVsRixTQUFTNkUsTUFBVCxDQUFnQkssS0FBL0I7QUFDQSxtQkFBTzdLLE1BQUksSUFBSixHQUFTOGdCLE9BQU9DLEtBQVAsQ0FBYTFhLE1BQWIsQ0FBaEI7QUFDRDtBQUNELGlCQUFPLEVBQVA7QUFDRCxTQVJJO0FBU0xvRSxlQUFPLGVBQUNDLElBQUQsRUFBTUMsSUFBTixFQUFlO0FBQ3BCLGNBQUkrVSxJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLGNBQUcsQ0FBQ2pWLElBQUQsSUFBUyxDQUFDQyxJQUFiLEVBQ0UsT0FBTytVLEVBQUVJLE1BQUYsQ0FBUyxlQUFULENBQVA7QUFDRixjQUFNa0IsZ0JBQWdCO0FBQ3BCLHNCQUFVLE9BRFU7QUFFcEIsbUJBQU9oaEIsR0FGYTtBQUdwQixzQkFBVTtBQUNSLHlCQUFXLGNBREg7QUFFUiwrQkFBaUIySyxJQUZUO0FBR1IsK0JBQWlCRCxJQUhUO0FBSVIsOEJBQWdCckUsT0FBT29hO0FBSmY7QUFIVSxXQUF0QjtBQVVBL2YsZ0JBQU0sRUFBQ1YsS0FBS0EsR0FBTjtBQUNGb0gsb0JBQVEsTUFETjtBQUVGZixvQkFBUUEsTUFGTjtBQUdGOEosa0JBQU05RSxLQUFLMkosU0FBTCxDQUFlZ00sYUFBZixDQUhKO0FBSUZyaEIscUJBQVMsRUFBQyxnQkFBZ0Isa0JBQWpCO0FBSlAsV0FBTixFQU1HbUssSUFOSCxDQU1RLG9CQUFZO0FBQ2hCO0FBQ0EsZ0JBQUdjLFNBQVN1RixJQUFULENBQWNvTixNQUFqQixFQUF3QjtBQUN0Qm1DLGdCQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBVCxDQUFjb04sTUFBeEI7QUFDRCxhQUZELE1BRU87QUFDTG1DLGdCQUFFSSxNQUFGLENBQVNsVixTQUFTdUYsSUFBbEI7QUFDRDtBQUNGLFdBYkgsRUFjRzlGLEtBZEgsQ0FjUyxlQUFPO0FBQ1pxVixjQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsV0FoQkg7QUFpQkEsaUJBQU9vVixFQUFFSyxPQUFUO0FBQ0QsU0F6Q0k7QUEwQ0xqVixjQUFNLGNBQUNELEtBQUQsRUFBVztBQUNmLGNBQUk2VSxJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLGNBQUloYSxXQUFXLE1BQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQWtGLGtCQUFRQSxTQUFTbEYsU0FBUzZFLE1BQVQsQ0FBZ0JLLEtBQWpDO0FBQ0EsY0FBRyxDQUFDQSxLQUFKLEVBQ0UsT0FBTzZVLEVBQUVJLE1BQUYsQ0FBUyxlQUFULENBQVA7QUFDRnBmLGdCQUFNLEVBQUNWLEtBQUtBLEdBQU47QUFDRm9ILG9CQUFRLE1BRE47QUFFRmYsb0JBQVEsRUFBQ3dFLE9BQU9BLEtBQVIsRUFGTjtBQUdGc0Ysa0JBQU05RSxLQUFLMkosU0FBTCxDQUFlLEVBQUU1TixRQUFRLGVBQVYsRUFBZixDQUhKO0FBSUZ6SCxxQkFBUyxFQUFDLGdCQUFnQixrQkFBakI7QUFKUCxXQUFOLEVBTUdtSyxJQU5ILENBTVEsb0JBQVk7QUFDaEI0VixjQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBVCxDQUFjb04sTUFBeEI7QUFDRCxXQVJILEVBU0dsVCxLQVRILENBU1MsZUFBTztBQUNacVYsY0FBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELFdBWEg7QUFZQSxpQkFBT29WLEVBQUVLLE9BQVQ7QUFDRCxTQTdESTtBQThETGtCLGlCQUFTLGlCQUFDcFYsTUFBRCxFQUFTb1YsUUFBVCxFQUFxQjtBQUM1QixjQUFJdkIsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxjQUFJaGEsV0FBVyxNQUFLQSxRQUFMLENBQWMsVUFBZCxDQUFmO0FBQ0EsY0FBSWtGLFFBQVFsRixTQUFTNkUsTUFBVCxDQUFnQkssS0FBNUI7QUFDQSxjQUFJcVcsVUFBVTtBQUNaLHNCQUFTLGFBREc7QUFFWixzQkFBVTtBQUNSLDBCQUFZclYsT0FBT2tDLFFBRFg7QUFFUiw2QkFBZTFDLEtBQUsySixTQUFMLENBQWdCaU0sUUFBaEI7QUFGUDtBQUZFLFdBQWQ7QUFPQTtBQUNBLGNBQUcsQ0FBQ3BXLEtBQUosRUFDRSxPQUFPNlUsRUFBRUksTUFBRixDQUFTLGVBQVQsQ0FBUDtBQUNGelosaUJBQU93RSxLQUFQLEdBQWVBLEtBQWY7QUFDQW5LLGdCQUFNLEVBQUNWLEtBQUs2TCxPQUFPc1YsWUFBYjtBQUNGL1osb0JBQVEsTUFETjtBQUVGZixvQkFBUUEsTUFGTjtBQUdGOEosa0JBQU05RSxLQUFLMkosU0FBTCxDQUFla00sT0FBZixDQUhKO0FBSUZ2aEIscUJBQVMsRUFBQyxpQkFBaUIsVUFBbEIsRUFBOEIsZ0JBQWdCLGtCQUE5QztBQUpQLFdBQU4sRUFNR21LLElBTkgsQ0FNUSxvQkFBWTtBQUNoQjRWLGNBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFULENBQWNvTixNQUF4QjtBQUNELFdBUkgsRUFTR2xULEtBVEgsQ0FTUyxlQUFPO0FBQ1pxVixjQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsV0FYSDtBQVlBLGlCQUFPb1YsRUFBRUssT0FBVDtBQUNELFNBMUZJO0FBMkZMalUsZ0JBQVEsZ0JBQUNELE1BQUQsRUFBU0MsT0FBVCxFQUFvQjtBQUMxQixjQUFJbVYsVUFBVSxFQUFDLFVBQVMsRUFBQyxtQkFBa0IsRUFBQyxTQUFTblYsT0FBVixFQUFuQixFQUFWLEVBQWQ7QUFDQSxpQkFBTyxNQUFLdEIsTUFBTCxHQUFjeVcsT0FBZCxDQUFzQnBWLE1BQXRCLEVBQThCb1YsT0FBOUIsQ0FBUDtBQUNELFNBOUZJO0FBK0ZMbFgsY0FBTSxjQUFDOEIsTUFBRCxFQUFZO0FBQ2hCLGNBQUlvVixVQUFVLEVBQUMsVUFBUyxFQUFDLGVBQWMsSUFBZixFQUFWLEVBQStCLFVBQVMsRUFBQyxnQkFBZSxJQUFoQixFQUF4QyxFQUFkO0FBQ0EsaUJBQU8sTUFBS3pXLE1BQUwsR0FBY3lXLE9BQWQsQ0FBc0JwVixNQUF0QixFQUE4Qm9WLE9BQTlCLENBQVA7QUFDRDtBQWxHSSxPQUFQO0FBb0dELEtBdGtCSTs7QUF3a0JML2EsYUFBUyxtQkFBVTtBQUFBOztBQUNqQixVQUFJUCxXQUFXLEtBQUtBLFFBQUwsQ0FBYyxVQUFkLENBQWY7QUFDQSxVQUFJc2EsVUFBVSxFQUFDamdCLEtBQUssMkJBQU4sRUFBbUNMLFNBQVMsRUFBNUMsRUFBZ0QrQixTQUFTaUUsU0FBU0UsT0FBVCxDQUFpQndWLFdBQWpCLEdBQTZCLEtBQXRGLEVBQWQ7O0FBRUEsYUFBTztBQUNMNUssY0FBTSxvQkFBT2xCLElBQVAsRUFBZ0I7QUFDcEIsY0FBSW1RLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0EsY0FBR2hhLFNBQVNPLE9BQVQsQ0FBaUJzSyxPQUFqQixJQUE0QjdLLFNBQVNPLE9BQVQsQ0FBaUJxSyxRQUFoRCxFQUF5RDtBQUN2RDBQLG9CQUFRamdCLEdBQVIsSUFBZ0J1UCxJQUFELEdBQVMsYUFBVCxHQUF5QixhQUF4QztBQUNBMFEsb0JBQVE3WSxNQUFSLEdBQWlCLE1BQWpCO0FBQ0E2WSxvQkFBUXRnQixPQUFSLENBQWdCLGNBQWhCLElBQWlDLGtCQUFqQztBQUNBc2dCLG9CQUFRdGdCLE9BQVIsQ0FBZ0IsV0FBaEIsU0FBa0NnRyxTQUFTTyxPQUFULENBQWlCc0ssT0FBbkQ7QUFDQXlQLG9CQUFRdGdCLE9BQVIsQ0FBZ0IsV0FBaEIsU0FBa0NnRyxTQUFTTyxPQUFULENBQWlCcUssUUFBbkQ7QUFDQTdQLGtCQUFNdWYsT0FBTixFQUNHblcsSUFESCxDQUNRLG9CQUFZO0FBQ2hCLGtCQUFHYyxZQUFZQSxTQUFTdUYsSUFBckIsSUFBNkJ2RixTQUFTdUYsSUFBVCxDQUFjMUosTUFBM0MsSUFBcURtRSxTQUFTdUYsSUFBVCxDQUFjMUosTUFBZCxDQUFxQjVCLEVBQTdFLEVBQ0UsT0FBSzhaLFdBQUwsQ0FBaUIvVCxTQUFTdUYsSUFBVCxDQUFjMUosTUFBZCxDQUFxQjVCLEVBQXRDO0FBQ0Y2YSxnQkFBRUcsT0FBRixDQUFValYsUUFBVjtBQUNELGFBTEgsRUFNR1AsS0FOSCxDQU1TLGVBQU87QUFDWnFWLGdCQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsYUFSSDtBQVNELFdBZkQsTUFlTztBQUNMb1YsY0FBRUksTUFBRixDQUFTLEtBQVQ7QUFDRDtBQUNELGlCQUFPSixFQUFFSyxPQUFUO0FBQ0QsU0F0Qkk7QUF1Qkw5YixpQkFBUztBQUNQdVUsZUFBSyxxQkFBWTtBQUNmLGdCQUFJa0gsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxnQkFBRyxDQUFDLE9BQUtoQixXQUFMLEVBQUosRUFBdUI7QUFDckIsa0JBQUlsTyxPQUFPLE1BQU0sT0FBS3ZLLE9BQUwsR0FBZXVLLElBQWYsRUFBakI7QUFDQSxrQkFBRyxDQUFDLE9BQUtrTyxXQUFMLEVBQUosRUFBdUI7QUFDckJlLGtCQUFFSSxNQUFGLENBQVMsMEJBQVQ7QUFDQSx1QkFBT0osRUFBRUssT0FBVDtBQUNEO0FBQ0Y7QUFDREUsb0JBQVFqZ0IsR0FBUixJQUFlLFVBQWY7QUFDQWlnQixvQkFBUTdZLE1BQVIsR0FBaUIsS0FBakI7QUFDQTZZLG9CQUFRdGdCLE9BQVIsQ0FBZ0IsY0FBaEIsSUFBa0Msa0JBQWxDO0FBQ0FzZ0Isb0JBQVF0Z0IsT0FBUixDQUFnQixlQUFoQixJQUFtQyxPQUFLZ2YsV0FBTCxFQUFuQztBQUNBamUsa0JBQU11ZixPQUFOLEVBQ0duVyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixnQkFBRUcsT0FBRixDQUFValYsU0FBU3VGLElBQW5CO0FBQ0QsYUFISCxFQUlHOUYsS0FKSCxDQUlTLGVBQU87QUFDWnFWLGdCQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsYUFOSDtBQU9FLG1CQUFPb1YsRUFBRUssT0FBVDtBQUNILFdBdEJNO0FBdUJQcFAsZ0JBQU0sb0JBQU83TSxNQUFQLEVBQWtCO0FBQ3RCLGdCQUFJNGIsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxnQkFBRyxDQUFDLE9BQUtoQixXQUFMLEVBQUosRUFBdUI7QUFDckIsa0JBQUlsTyxPQUFPLE1BQU0sT0FBS3ZLLE9BQUwsR0FBZXVLLElBQWYsRUFBakI7QUFDQSxrQkFBRyxDQUFDLE9BQUtrTyxXQUFMLEVBQUosRUFBdUI7QUFDckJlLGtCQUFFSSxNQUFGLENBQVMsMEJBQVQ7QUFDQSx1QkFBT0osRUFBRUssT0FBVDtBQUNEO0FBQ0Y7QUFDRCxnQkFBSXFCLGdCQUFnQmpoQixRQUFRaU4sSUFBUixDQUFhdEosTUFBYixDQUFwQjtBQUNBO0FBQ0EsbUJBQU9zZCxjQUFjblUsTUFBckI7QUFDQSxtQkFBT21VLGNBQWNwZSxPQUFyQjtBQUNBLG1CQUFPb2UsY0FBY2xVLE1BQXJCO0FBQ0EsbUJBQU9rVSxjQUFjalUsSUFBckI7QUFDQWlVLDBCQUFjNVUsSUFBZCxDQUFtQkssTUFBbkIsR0FBNkJsSCxTQUFTRSxPQUFULENBQWlCRSxJQUFqQixJQUF1QixHQUF2QixJQUE4QixDQUFDLENBQUNxYixjQUFjNVUsSUFBZCxDQUFtQkssTUFBcEQsR0FBOER2TSxRQUFRLE9BQVIsRUFBaUI4Z0IsY0FBYzVVLElBQWQsQ0FBbUJLLE1BQW5CLEdBQTBCLEtBQTNDLEVBQWlELENBQWpELENBQTlELEdBQW9IdVUsY0FBYzVVLElBQWQsQ0FBbUJLLE1BQW5LO0FBQ0FvVCxvQkFBUWpnQixHQUFSLElBQWUsY0FBZjtBQUNBaWdCLG9CQUFRN1ksTUFBUixHQUFpQixNQUFqQjtBQUNBNlksb0JBQVE5UCxJQUFSLEdBQWU7QUFDYmxLLHVCQUFTTixTQUFTTyxPQUFULENBQWlCRCxPQURiO0FBRWJuQyxzQkFBUXNkLGFBRks7QUFHYi9QLDZCQUFlMUwsU0FBUzBMO0FBSFgsYUFBZjtBQUtBNE8sb0JBQVF0Z0IsT0FBUixDQUFnQixjQUFoQixJQUFrQyxrQkFBbEM7QUFDQXNnQixvQkFBUXRnQixPQUFSLENBQWdCLGVBQWhCLElBQW1DLE9BQUtnZixXQUFMLEVBQW5DO0FBQ0FqZSxrQkFBTXVmLE9BQU4sRUFDR25XLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLGdCQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxhQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsZ0JBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxhQU5IO0FBT0UsbUJBQU9vVixFQUFFSyxPQUFUO0FBQ0Q7QUF4REksU0F2Qko7QUFpRkxoUCxrQkFBVTtBQUNSeUgsZUFBSyxxQkFBWTtBQUNmLGdCQUFJa0gsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQSxnQkFBRyxDQUFDLE9BQUtoQixXQUFMLEVBQUosRUFBdUI7QUFDckIsa0JBQUlsTyxPQUFPLE1BQU0sT0FBS3ZLLE9BQUwsR0FBZXVLLElBQWYsRUFBakI7QUFDQSxrQkFBRyxDQUFDLE9BQUtrTyxXQUFMLEVBQUosRUFBdUI7QUFDckJlLGtCQUFFSSxNQUFGLENBQVMsMEJBQVQ7QUFDQSx1QkFBT0osRUFBRUssT0FBVDtBQUNEO0FBQ0Y7QUFDREUsb0JBQVFqZ0IsR0FBUixJQUFlLFdBQWY7QUFDQWlnQixvQkFBUTdZLE1BQVIsR0FBaUIsS0FBakI7QUFDQTZZLG9CQUFROVAsSUFBUixHQUFlO0FBQ2JrUix5QkFBV0EsU0FERTtBQUVidmQsc0JBQVFBO0FBRkssYUFBZjtBQUlBbWMsb0JBQVF0Z0IsT0FBUixDQUFnQixjQUFoQixJQUFrQyxrQkFBbEM7QUFDQXNnQixvQkFBUXRnQixPQUFSLENBQWdCLGVBQWhCLElBQW1DLE9BQUtnZixXQUFMLEVBQW5DO0FBQ0FqZSxrQkFBTXVmLE9BQU4sRUFDR25XLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLGdCQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxhQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsZ0JBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxhQU5IO0FBT0UsbUJBQU9vVixFQUFFSyxPQUFUO0FBQ0gsV0ExQk87QUEyQlJwUCxnQkFBTSxvQkFBTzFLLE9BQVAsRUFBbUI7QUFDdkIsZ0JBQUl5WixJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBLGdCQUFHLENBQUMsT0FBS2hCLFdBQUwsRUFBSixFQUF1QjtBQUNyQixrQkFBSWxPLE9BQU8sTUFBTSxPQUFLdkssT0FBTCxHQUFldUssSUFBZixFQUFqQjtBQUNBLGtCQUFHLENBQUMsT0FBS2tPLFdBQUwsRUFBSixFQUF1QjtBQUNyQmUsa0JBQUVJLE1BQUYsQ0FBUywwQkFBVDtBQUNBLHVCQUFPSixFQUFFSyxPQUFUO0FBQ0Q7QUFDRjtBQUNERSxvQkFBUWpnQixHQUFSLElBQWUsZUFBYWlHLFFBQVFwQixFQUFwQztBQUNBb2Isb0JBQVE3WSxNQUFSLEdBQWlCLE9BQWpCO0FBQ0E2WSxvQkFBUTlQLElBQVIsR0FBZTtBQUNiNU8sb0JBQU0wRSxRQUFRMUUsSUFERDtBQUViVyxvQkFBTStELFFBQVEvRDtBQUZELGFBQWY7QUFJQStkLG9CQUFRdGdCLE9BQVIsQ0FBZ0IsY0FBaEIsSUFBa0Msa0JBQWxDO0FBQ0FzZ0Isb0JBQVF0Z0IsT0FBUixDQUFnQixlQUFoQixJQUFtQyxPQUFLZ2YsV0FBTCxFQUFuQztBQUNBamUsa0JBQU11ZixPQUFOLEVBQ0duVyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixnQkFBRUcsT0FBRixDQUFValYsU0FBU3VGLElBQW5CO0FBQ0QsYUFISCxFQUlHOUYsS0FKSCxDQUlTLGVBQU87QUFDWnFWLGdCQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsYUFOSDtBQU9FLG1CQUFPb1YsRUFBRUssT0FBVDtBQUNIO0FBcERPO0FBakZMLE9BQVA7QUF3SUQsS0FwdEJJOztBQXN0Qkw7QUFDQXVCLGFBQVMsaUJBQVN4ZCxNQUFULEVBQWdCO0FBQ3ZCLFVBQUl5ZCxVQUFVemQsT0FBTzBJLElBQVAsQ0FBWU8sR0FBMUI7QUFDQTtBQUNBLGVBQVN5VSxJQUFULENBQWVDLENBQWYsRUFBaUJDLE1BQWpCLEVBQXdCQyxNQUF4QixFQUErQkMsT0FBL0IsRUFBdUNDLE9BQXZDLEVBQStDO0FBQzdDLGVBQU8sQ0FBQ0osSUFBSUMsTUFBTCxLQUFnQkcsVUFBVUQsT0FBMUIsS0FBc0NELFNBQVNELE1BQS9DLElBQXlERSxPQUFoRTtBQUNEO0FBQ0QsVUFBRzlkLE9BQU8wSSxJQUFQLENBQVl0SyxJQUFaLElBQW9CLFlBQXZCLEVBQW9DO0FBQ2xDLFlBQU00ZixvQkFBb0IsS0FBMUI7QUFDQTtBQUNBLFlBQU1DLHFCQUFxQixFQUEzQjtBQUNBO0FBQ0E7QUFDQSxZQUFNQyxhQUFhLENBQW5CO0FBQ0E7QUFDQSxZQUFNQyxlQUFlLElBQXJCO0FBQ0E7QUFDQSxZQUFNQyxpQkFBaUIsS0FBdkI7QUFDRDtBQUNBO0FBQ0EsWUFBR3BlLE9BQU8wSSxJQUFQLENBQVlKLEdBQVosQ0FBZ0JuSCxPQUFoQixDQUF3QixHQUF4QixNQUFpQyxDQUFwQyxFQUFzQztBQUNwQ3NjLG9CQUFXQSxXQUFXLE1BQU0sS0FBakIsQ0FBRCxHQUE0QixNQUF0QztBQUNBLGNBQUlZLEtBQUt4TCxLQUFLeUwsR0FBTCxDQUFTYixVQUFVTyxpQkFBbkIsQ0FBVDtBQUNBLGNBQUlPLFNBQVMsS0FBSyxlQUFnQixnQkFBZ0JGLEVBQWhDLEdBQXVDLGtCQUFrQkEsRUFBbEIsR0FBdUJBLEVBQTlELEdBQXFFLENBQUMsaUJBQUQsR0FBcUJBLEVBQXJCLEdBQTBCQSxFQUExQixHQUErQkEsRUFBekcsQ0FBYjtBQUNDO0FBQ0QsaUJBQU9FLFNBQVMsTUFBaEI7QUFDRCxTQU5ELE1BTU87QUFDTGQsb0JBQVUsT0FBT0EsT0FBUCxHQUFpQixDQUEzQjtBQUNBQSxvQkFBVVcsaUJBQWlCWCxPQUEzQjs7QUFFQSxjQUFJZSxZQUFZZixVQUFVTyxpQkFBMUIsQ0FKSyxDQUk0QztBQUNqRFEsc0JBQVkzTCxLQUFLeUwsR0FBTCxDQUFTRSxTQUFULENBQVosQ0FMSyxDQUs2QztBQUNsREEsdUJBQWFMLFlBQWIsQ0FOSyxDQU13QztBQUM3Q0ssdUJBQWEsT0FBT1AscUJBQXFCLE1BQTVCLENBQWIsQ0FQSyxDQU82QztBQUNsRE8sc0JBQVksTUFBTUEsU0FBbEIsQ0FSSyxDQVF3QztBQUM3Q0EsdUJBQWEsTUFBYjtBQUNBLGlCQUFPQSxTQUFQO0FBQ0Q7QUFDRixPQS9CQSxNQStCTSxJQUFHeGUsT0FBTzBJLElBQVAsQ0FBWXRLLElBQVosSUFBb0IsT0FBdkIsRUFBK0I7QUFDcEMsWUFBSTRCLE9BQU8wSSxJQUFQLENBQVlPLEdBQVosSUFBbUJqSixPQUFPMEksSUFBUCxDQUFZTyxHQUFaLEdBQWdCLEdBQXZDLEVBQTJDO0FBQzFDLGlCQUFRLE1BQUl5VSxLQUFLMWQsT0FBTzBJLElBQVAsQ0FBWU8sR0FBakIsRUFBcUIsR0FBckIsRUFBeUIsSUFBekIsRUFBOEIsQ0FBOUIsRUFBZ0MsR0FBaEMsQ0FBTCxHQUEyQyxHQUFsRDtBQUNBO0FBQ0Y7QUFDQSxhQUFPLEtBQVA7QUFDRCxLQWx3Qkk7O0FBb3dCTG1DLGNBQVUsb0JBQVU7QUFBQTs7QUFDbEIsVUFBSXdRLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0EsVUFBSWhhLFdBQVcsS0FBS0EsUUFBTCxDQUFjLFVBQWQsQ0FBZjtBQUNBLFVBQUk0Yyx3QkFBc0I1YyxTQUFTdUosUUFBVCxDQUFrQmxQLEdBQTVDO0FBQ0EsVUFBRyxDQUFDLENBQUMyRixTQUFTdUosUUFBVCxDQUFrQjRKLElBQXBCLElBQTRCLENBQUMsS0FBSzFKLE1BQUwsQ0FBWW1ULGdCQUFaLENBQWhDLEVBQ0VBLDBCQUF3QjVjLFNBQVN1SixRQUFULENBQWtCNEosSUFBMUM7O0FBRUYsYUFBTztBQUNMMUosZ0JBQVEsZ0JBQUNwUCxHQUFELEVBQVM7QUFDZixpQkFBUUEsSUFBSWlGLE9BQUosQ0FBWSxzQkFBWixNQUF3QyxDQUFDLENBQXpDLElBQ05qRixJQUFJaUYsT0FBSixDQUFZLHFCQUFaLE1BQXVDLENBQUMsQ0FEMUM7QUFFRCxTQUpJO0FBS0xzSyxjQUFNLGNBQUNMLFFBQUQsRUFBYztBQUNsQixjQUFHQSxZQUFZQSxTQUFTbFAsR0FBeEIsRUFBNEI7QUFDMUJ1aUIsb0NBQXNCclQsU0FBU2xQLEdBQS9CO0FBQ0EsZ0JBQUksQ0FBQyxDQUFDa1AsU0FBUzRKLElBQVgsSUFBbUIsQ0FBQyxPQUFLNUosUUFBTCxHQUFnQkUsTUFBaEIsQ0FBdUJtVCxnQkFBdkIsQ0FBeEIsRUFDRUEsMEJBQXdCclQsU0FBUzRKLElBQWpDO0FBQ0g7QUFDRCxjQUFJbUgsVUFBVSxFQUFDamdCLFVBQVF1aUIsZ0JBQVQsRUFBNkJuYixRQUFRLEtBQXJDLEVBQWQ7QUFDQSxjQUFHLE9BQUs4SCxRQUFMLEdBQWdCRSxNQUFoQixDQUF1Qm1ULGdCQUF2QixDQUFILEVBQTRDO0FBQzFDdEMsb0JBQVFqZ0IsR0FBUixHQUFpQnVpQixnQkFBakI7QUFDQSxnQkFBR3JULFlBQVlBLFNBQVN4RSxJQUFyQixJQUE2QndFLFNBQVN2RSxJQUF6QyxFQUE4QztBQUM1Q3NWLHNCQUFRdGdCLE9BQVIsR0FBa0IsRUFBQyxnQkFBZ0Isa0JBQWpCO0FBQ2hCLGlDQUFpQixXQUFTb0osS0FBS21HLFNBQVN4RSxJQUFULENBQWNrTyxJQUFkLEtBQXFCLEdBQXJCLEdBQXlCMUosU0FBU3ZFLElBQVQsQ0FBY2lPLElBQWQsRUFBOUIsQ0FEVixFQUFsQjtBQUVELGFBSEQsTUFHTztBQUNMcUgsc0JBQVF0Z0IsT0FBUixHQUFrQixFQUFDLGdCQUFnQixrQkFBakI7QUFDaEIsaUNBQWlCLFdBQVNvSixLQUFLcEQsU0FBU3VKLFFBQVQsQ0FBa0J4RSxJQUFsQixDQUF1QmtPLElBQXZCLEtBQThCLEdBQTlCLEdBQWtDalQsU0FBU3VKLFFBQVQsQ0FBa0J2RSxJQUFsQixDQUF1QmlPLElBQXZCLEVBQXZDLENBRFYsRUFBbEI7QUFFRDtBQUNGO0FBQ0RsWSxnQkFBTXVmLE9BQU4sRUFDR25XLElBREgsQ0FDUSxvQkFBWTtBQUNoQmdILG9CQUFRc1IsR0FBUixDQUFZeFgsUUFBWjtBQUNBOFUsY0FBRUcsT0FBRixDQUFValYsUUFBVjtBQUNELFdBSkgsRUFLR1AsS0FMSCxDQUtTLGVBQU87QUFDWnFWLGNBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxXQVBIO0FBUUUsaUJBQU9vVixFQUFFSyxPQUFUO0FBQ0gsU0EvQkk7QUFnQ0xyUSxhQUFLLGVBQU07QUFDVCxjQUFHLE9BQUtSLFFBQUwsR0FBZ0JFLE1BQWhCLENBQXVCbVQsZ0JBQXZCLENBQUgsRUFBNEM7QUFDMUM3QyxjQUFFRyxPQUFGLENBQVUsQ0FBQ2xhLFNBQVN1SixRQUFULENBQWtCeEUsSUFBbkIsQ0FBVjtBQUNELFdBRkQsTUFFTztBQUNQaEssa0JBQU0sRUFBQ1YsS0FBUXVpQixnQkFBUixpQkFBb0M1YyxTQUFTdUosUUFBVCxDQUFrQnhFLElBQWxCLENBQXVCa08sSUFBdkIsRUFBcEMsV0FBdUVqVCxTQUFTdUosUUFBVCxDQUFrQnZFLElBQWxCLENBQXVCaU8sSUFBdkIsRUFBdkUsV0FBMEcxQixtQkFBbUIsZ0JBQW5CLENBQTNHLEVBQW1KOVAsUUFBUSxLQUEzSixFQUFOLEVBQ0cwQyxJQURILENBQ1Esb0JBQVk7QUFDaEIsa0JBQUdjLFNBQVN1RixJQUFULElBQ0R2RixTQUFTdUYsSUFBVCxDQUFjQyxPQURiLElBRUR4RixTQUFTdUYsSUFBVCxDQUFjQyxPQUFkLENBQXNCMUssTUFGckIsSUFHRGtGLFNBQVN1RixJQUFULENBQWNDLE9BQWQsQ0FBc0IsQ0FBdEIsRUFBeUJvUyxNQUh4QixJQUlENVgsU0FBU3VGLElBQVQsQ0FBY0MsT0FBZCxDQUFzQixDQUF0QixFQUF5Qm9TLE1BQXpCLENBQWdDOWMsTUFKL0IsSUFLRGtGLFNBQVN1RixJQUFULENBQWNDLE9BQWQsQ0FBc0IsQ0FBdEIsRUFBeUJvUyxNQUF6QixDQUFnQyxDQUFoQyxFQUFtQ3ZWLE1BTHJDLEVBSzZDO0FBQzNDeVMsa0JBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFULENBQWNDLE9BQWQsQ0FBc0IsQ0FBdEIsRUFBeUJvUyxNQUF6QixDQUFnQyxDQUFoQyxFQUFtQ3ZWLE1BQTdDO0FBQ0QsZUFQRCxNQU9PO0FBQ0x5UyxrQkFBRUcsT0FBRixDQUFVLEVBQVY7QUFDRDtBQUNGLGFBWkgsRUFhR3hWLEtBYkgsQ0FhUyxlQUFPO0FBQ1pxVixnQkFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELGFBZkg7QUFnQkM7QUFDRCxpQkFBT29WLEVBQUVLLE9BQVQ7QUFDRCxTQXRESTtBQXVETDdQLGtCQUFVLGtCQUFDM08sSUFBRCxFQUFVO0FBQ2xCLGNBQUcsT0FBSzJOLFFBQUwsR0FBZ0JFLE1BQWhCLENBQXVCbVQsZ0JBQXZCLENBQUgsRUFBNEM7QUFDMUM3QyxjQUFFSSxNQUFGLENBQVMseUJBQVQ7QUFDRCxXQUZELE1BRU87QUFDUHBmLGtCQUFNLEVBQUNWLEtBQVF1aUIsZ0JBQVIsaUJBQW9DNWMsU0FBU3VKLFFBQVQsQ0FBa0J4RSxJQUFsQixDQUF1QmtPLElBQXZCLEVBQXBDLFdBQXVFalQsU0FBU3VKLFFBQVQsQ0FBa0J2RSxJQUFsQixDQUF1QmlPLElBQXZCLEVBQXZFLFdBQTBHMUIseUNBQXVDM1YsSUFBdkMsT0FBM0csRUFBOEo2RixRQUFRLE1BQXRLLEVBQU4sRUFDRzBDLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLGdCQUFFRyxPQUFGLENBQVVqVixRQUFWO0FBQ0QsYUFISCxFQUlHUCxLQUpILENBSVMsZUFBTztBQUNacVYsZ0JBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxhQU5IO0FBT0M7QUFDRCxpQkFBT29WLEVBQUVLLE9BQVQ7QUFDRDtBQXBFSSxPQUFQO0FBc0VELEtBajFCSTs7QUFtMUJMbmQsU0FBSyxlQUFVO0FBQ1gsVUFBSThjLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0FqZixZQUFNOFgsR0FBTixDQUFVLGVBQVYsRUFDRzFPLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLFVBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFuQjtBQUNELE9BSEgsRUFJRzlGLEtBSkgsQ0FJUyxlQUFPO0FBQ1pxVixVQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsT0FOSDtBQU9FLGFBQU9vVixFQUFFSyxPQUFUO0FBQ0wsS0E3MUJJOztBQSsxQkx0ZCxZQUFRLGtCQUFVO0FBQ2QsVUFBSWlkLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0FqZixZQUFNOFgsR0FBTixDQUFVLDBCQUFWLEVBQ0cxTyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNILEtBejJCSTs7QUEyMkJMdmQsVUFBTSxnQkFBVTtBQUNaLFVBQUlrZCxJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBamYsWUFBTThYLEdBQU4sQ0FBVSx3QkFBVixFQUNHMU8sSUFESCxDQUNRLG9CQUFZO0FBQ2hCNFYsVUFBRUcsT0FBRixDQUFValYsU0FBU3VGLElBQW5CO0FBQ0QsT0FISCxFQUlHOUYsS0FKSCxDQUlTLGVBQU87QUFDWnFWLFVBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxPQU5IO0FBT0EsYUFBT29WLEVBQUVLLE9BQVQ7QUFDSCxLQXIzQkk7O0FBdTNCTHJkLFdBQU8saUJBQVU7QUFDYixVQUFJZ2QsSUFBSWpmLEdBQUdrZixLQUFILEVBQVI7QUFDQWpmLFlBQU04WCxHQUFOLENBQVUseUJBQVYsRUFDRzFPLElBREgsQ0FDUSxvQkFBWTtBQUNoQjRWLFVBQUVHLE9BQUYsQ0FBVWpWLFNBQVN1RixJQUFuQjtBQUNELE9BSEgsRUFJRzlGLEtBSkgsQ0FJUyxlQUFPO0FBQ1pxVixVQUFFSSxNQUFGLENBQVN4VixHQUFUO0FBQ0QsT0FOSDtBQU9BLGFBQU9vVixFQUFFSyxPQUFUO0FBQ0gsS0FqNEJJOztBQW00QkxqTSxZQUFRLGtCQUFVO0FBQ2hCLFVBQUk0TCxJQUFJamYsR0FBR2tmLEtBQUgsRUFBUjtBQUNBamYsWUFBTThYLEdBQU4sQ0FBVSw4QkFBVixFQUNHMU8sSUFESCxDQUNRLG9CQUFZO0FBQ2hCNFYsVUFBRUcsT0FBRixDQUFValYsU0FBU3VGLElBQW5CO0FBQ0QsT0FISCxFQUlHOUYsS0FKSCxDQUlTLGVBQU87QUFDWnFWLFVBQUVJLE1BQUYsQ0FBU3hWLEdBQVQ7QUFDRCxPQU5IO0FBT0EsYUFBT29WLEVBQUVLLE9BQVQ7QUFDRCxLQTc0Qkk7O0FBKzRCTHBkLGNBQVUsb0JBQVU7QUFDaEIsVUFBSStjLElBQUlqZixHQUFHa2YsS0FBSCxFQUFSO0FBQ0FqZixZQUFNOFgsR0FBTixDQUFVLDRCQUFWLEVBQ0cxTyxJQURILENBQ1Esb0JBQVk7QUFDaEI0VixVQUFFRyxPQUFGLENBQVVqVixTQUFTdUYsSUFBbkI7QUFDRCxPQUhILEVBSUc5RixLQUpILENBSVMsZUFBTztBQUNacVYsVUFBRUksTUFBRixDQUFTeFYsR0FBVDtBQUNELE9BTkg7QUFPQSxhQUFPb1YsRUFBRUssT0FBVDtBQUNILEtBejVCSTs7QUEyNUJMamEsa0JBQWMsc0JBQVMzQyxPQUFULEVBQWlCO0FBQzdCLGFBQU87QUFDTDZDLGVBQU87QUFDRDlELGdCQUFNLFdBREw7QUFFRHVnQixpQkFBTztBQUNMQyxvQkFBUSxDQUFDLENBQUN2ZixRQUFROEMsT0FEYjtBQUVMMkwsa0JBQU0sQ0FBQyxDQUFDek8sUUFBUThDLE9BQVYsR0FBb0I5QyxRQUFROEMsT0FBNUIsR0FBc0M7QUFGdkMsV0FGTjtBQU1EMGMsa0JBQVEsbUJBTlA7QUFPREMsa0JBQVEsR0FQUDtBQVFEQyxrQkFBUztBQUNMQyxpQkFBSyxFQURBO0FBRUxDLG1CQUFPLEVBRkY7QUFHTEMsb0JBQVEsR0FISDtBQUlMQyxrQkFBTTtBQUpELFdBUlI7QUFjRHhCLGFBQUcsV0FBU3lCLENBQVQsRUFBVztBQUFFLG1CQUFRQSxLQUFLQSxFQUFFeGQsTUFBUixHQUFrQndkLEVBQUUsQ0FBRixDQUFsQixHQUF5QkEsQ0FBaEM7QUFBb0MsV0FkbkQ7QUFlREMsYUFBRyxXQUFTRCxDQUFULEVBQVc7QUFBRSxtQkFBUUEsS0FBS0EsRUFBRXhkLE1BQVIsR0FBa0J3ZCxFQUFFLENBQUYsQ0FBbEIsR0FBeUJBLENBQWhDO0FBQW9DLFdBZm5EO0FBZ0JEOztBQUVBclIsaUJBQU91UixHQUFHamMsS0FBSCxDQUFTa2MsVUFBVCxHQUFzQnRlLEtBQXRCLEVBbEJOO0FBbUJEdWUsb0JBQVUsR0FuQlQ7QUFvQkRDLG1DQUF5QixJQXBCeEI7QUFxQkRDLHVCQUFhLEtBckJaO0FBc0JEQyx1QkFBYSxPQXRCWjtBQXVCREMsa0JBQVE7QUFDTnJPLGlCQUFLLGFBQVU2TixDQUFWLEVBQWE7QUFBRSxxQkFBT0EsRUFBRTNoQixJQUFUO0FBQWU7QUFEN0IsV0F2QlA7QUEwQkRvaUIsa0JBQVEsZ0JBQVVULENBQVYsRUFBYTtBQUFFLG1CQUFPLENBQUMsQ0FBQy9mLFFBQVE2QyxLQUFSLENBQWNnWixJQUF2QjtBQUE2QixXQTFCbkQ7QUEyQkQ0RSxpQkFBTztBQUNIQyx1QkFBVyxNQURSO0FBRUhDLHdCQUFZLG9CQUFTWixDQUFULEVBQVk7QUFDcEIsa0JBQUcsQ0FBQyxDQUFDL2YsUUFBUTZDLEtBQVIsQ0FBYytZLFFBQW5CLEVBQ0UsT0FBT3FFLEdBQUdXLElBQUgsQ0FBUS9ULE1BQVIsQ0FBZSxVQUFmLEVBQTJCLElBQUluSCxJQUFKLENBQVNxYSxDQUFULENBQTNCLEVBQXdDaEwsV0FBeEMsRUFBUCxDQURGLEtBR0UsT0FBT2tMLEdBQUdXLElBQUgsQ0FBUS9ULE1BQVIsQ0FBZSxZQUFmLEVBQTZCLElBQUluSCxJQUFKLENBQVNxYSxDQUFULENBQTdCLEVBQTBDaEwsV0FBMUMsRUFBUDtBQUNMLGFBUEU7QUFRSDhMLG9CQUFRLFFBUkw7QUFTSEMseUJBQWEsRUFUVjtBQVVIQywrQkFBbUIsRUFWaEI7QUFXSEMsMkJBQWU7QUFYWixXQTNCTjtBQXdDREMsa0JBQVMsQ0FBQ2poQixRQUFRNEMsSUFBVCxJQUFpQjVDLFFBQVE0QyxJQUFSLElBQWMsR0FBaEMsR0FBdUMsQ0FBQyxDQUFELEVBQUcsR0FBSCxDQUF2QyxHQUFpRCxDQUFDLENBQUMsRUFBRixFQUFLLEdBQUwsQ0F4Q3hEO0FBeUNEc2UsaUJBQU87QUFDSFIsdUJBQVcsYUFEUjtBQUVIQyx3QkFBWSxvQkFBU1osQ0FBVCxFQUFXO0FBQ25CLHFCQUFPNWlCLFFBQVEsUUFBUixFQUFrQjRpQixDQUFsQixFQUFvQixDQUFwQixJQUF1QixNQUE5QjtBQUNILGFBSkU7QUFLSGMsb0JBQVEsTUFMTDtBQU1ITSx3QkFBWSxJQU5UO0FBT0hKLCtCQUFtQjtBQVBoQjtBQXpDTjtBQURGLE9BQVA7QUFxREQsS0FqOUJJO0FBazlCTDtBQUNBO0FBQ0E3YyxTQUFLLGFBQVNDLEVBQVQsRUFBWUMsRUFBWixFQUFlO0FBQ2xCLGFBQU8sQ0FBQyxDQUFFRCxLQUFLQyxFQUFQLElBQWMsTUFBZixFQUF1QmdkLE9BQXZCLENBQStCLENBQS9CLENBQVA7QUFDRCxLQXQ5Qkk7QUF1OUJMO0FBQ0EvYyxVQUFNLGNBQVNGLEVBQVQsRUFBWUMsRUFBWixFQUFlO0FBQ25CLGFBQU8sQ0FBRyxTQUFVRCxLQUFLQyxFQUFmLEtBQXdCLFFBQVFELEVBQWhDLENBQUYsSUFBNENDLEtBQUssS0FBakQsQ0FBRCxFQUEyRGdkLE9BQTNELENBQW1FLENBQW5FLENBQVA7QUFDRCxLQTE5Qkk7QUEyOUJMO0FBQ0E5YyxTQUFLLGFBQVNKLEdBQVQsRUFBYUUsRUFBYixFQUFnQjtBQUNuQixhQUFPLENBQUUsT0FBT0YsR0FBUixHQUFlRSxFQUFoQixFQUFvQmdkLE9BQXBCLENBQTRCLENBQTVCLENBQVA7QUFDRCxLQTk5Qkk7QUErOUJMMWMsUUFBSSxZQUFTMmMsRUFBVCxFQUFZQyxFQUFaLEVBQWU7QUFDakIsYUFBUSxTQUFTRCxFQUFWLEdBQWlCLFNBQVNDLEVBQWpDO0FBQ0QsS0FqK0JJO0FBaytCTC9jLGlCQUFhLHFCQUFTOGMsRUFBVCxFQUFZQyxFQUFaLEVBQWU7QUFDMUIsYUFBTyxDQUFDLENBQUMsSUFBS0EsS0FBR0QsRUFBVCxJQUFjLEdBQWYsRUFBb0JELE9BQXBCLENBQTRCLENBQTVCLENBQVA7QUFDRCxLQXArQkk7QUFxK0JMM2MsY0FBVSxrQkFBU0gsR0FBVCxFQUFhSSxFQUFiLEVBQWdCTixFQUFoQixFQUFtQjtBQUMzQixhQUFPLENBQUMsQ0FBRSxNQUFNRSxHQUFQLEdBQWMsT0FBT0ksS0FBSyxHQUFaLENBQWYsSUFBbUNOLEVBQW5DLEdBQXdDLElBQXpDLEVBQStDZ2QsT0FBL0MsQ0FBdUQsQ0FBdkQsQ0FBUDtBQUNELEtBditCSTtBQXcrQkw7QUFDQXpjLFFBQUksWUFBU0gsS0FBVCxFQUFlO0FBQ2pCLFVBQUlHLEtBQUssQ0FBRSxJQUFLSCxTQUFTLFFBQVdBLFFBQU0sS0FBUCxHQUFnQixLQUFuQyxDQUFQLEVBQXVENGMsT0FBdkQsQ0FBK0QsQ0FBL0QsQ0FBVDtBQUNBLGFBQU9wZixXQUFXMkMsRUFBWCxDQUFQO0FBQ0QsS0E1K0JJO0FBNitCTEgsV0FBTyxlQUFTRyxFQUFULEVBQVk7QUFDakIsVUFBSUgsUUFBUSxDQUFFLENBQUMsQ0FBRCxHQUFLLE9BQU4sR0FBa0IsVUFBVUcsRUFBNUIsR0FBbUMsVUFBVTZPLEtBQUsrTixHQUFMLENBQVM1YyxFQUFULEVBQVksQ0FBWixDQUE3QyxHQUFnRSxVQUFVNk8sS0FBSytOLEdBQUwsQ0FBUzVjLEVBQVQsRUFBWSxDQUFaLENBQTNFLEVBQTRGbVcsUUFBNUYsRUFBWjtBQUNBLFVBQUd0VyxNQUFNZ2QsU0FBTixDQUFnQmhkLE1BQU0xQyxPQUFOLENBQWMsR0FBZCxJQUFtQixDQUFuQyxFQUFxQzBDLE1BQU0xQyxPQUFOLENBQWMsR0FBZCxJQUFtQixDQUF4RCxLQUE4RCxDQUFqRSxFQUNFMEMsUUFBUUEsTUFBTWdkLFNBQU4sQ0FBZ0IsQ0FBaEIsRUFBa0JoZCxNQUFNMUMsT0FBTixDQUFjLEdBQWQsSUFBbUIsQ0FBckMsQ0FBUixDQURGLEtBRUssSUFBRzBDLE1BQU1nZCxTQUFOLENBQWdCaGQsTUFBTTFDLE9BQU4sQ0FBYyxHQUFkLElBQW1CLENBQW5DLEVBQXFDMEMsTUFBTTFDLE9BQU4sQ0FBYyxHQUFkLElBQW1CLENBQXhELElBQTZELENBQWhFLEVBQ0gwQyxRQUFRQSxNQUFNZ2QsU0FBTixDQUFnQixDQUFoQixFQUFrQmhkLE1BQU0xQyxPQUFOLENBQWMsR0FBZCxDQUFsQixDQUFSLENBREcsS0FFQSxJQUFHMEMsTUFBTWdkLFNBQU4sQ0FBZ0JoZCxNQUFNMUMsT0FBTixDQUFjLEdBQWQsSUFBbUIsQ0FBbkMsRUFBcUMwQyxNQUFNMUMsT0FBTixDQUFjLEdBQWQsSUFBbUIsQ0FBeEQsSUFBNkQsQ0FBaEUsRUFBa0U7QUFDckUwQyxnQkFBUUEsTUFBTWdkLFNBQU4sQ0FBZ0IsQ0FBaEIsRUFBa0JoZCxNQUFNMUMsT0FBTixDQUFjLEdBQWQsQ0FBbEIsQ0FBUjtBQUNBMEMsZ0JBQVF4QyxXQUFXd0MsS0FBWCxJQUFvQixDQUE1QjtBQUNEO0FBQ0QsYUFBT3hDLFdBQVd3QyxLQUFYLENBQVA7QUFDRCxLQXgvQkk7QUF5L0JMbUwscUJBQWlCLHlCQUFTNUwsTUFBVCxFQUFnQjtBQUMvQixVQUFJMEQsV0FBVyxFQUFDckosTUFBSyxFQUFOLEVBQVU2UixNQUFLLEVBQWYsRUFBbUIzRSxRQUFRLEVBQUNsTixNQUFLLEVBQU4sRUFBM0IsRUFBc0MyUixVQUFTLEVBQS9DLEVBQW1EN0wsS0FBSSxFQUF2RCxFQUEyREMsSUFBRyxLQUE5RCxFQUFxRUMsSUFBRyxLQUF4RSxFQUErRTRMLEtBQUksQ0FBbkYsRUFBc0YzUSxNQUFLLEVBQTNGLEVBQStGQyxRQUFPLEVBQXRHLEVBQTBHbVIsT0FBTSxFQUFoSCxFQUFvSEQsTUFBSyxFQUF6SCxFQUFmO0FBQ0EsVUFBRyxDQUFDLENBQUN6TSxPQUFPMGQsUUFBWixFQUNFaGEsU0FBU3JKLElBQVQsR0FBZ0IyRixPQUFPMGQsUUFBdkI7QUFDRixVQUFHLENBQUMsQ0FBQzFkLE9BQU8yZCxTQUFQLENBQWlCQyxZQUF0QixFQUNFbGEsU0FBU3NJLFFBQVQsR0FBb0JoTSxPQUFPMmQsU0FBUCxDQUFpQkMsWUFBckM7QUFDRixVQUFHLENBQUMsQ0FBQzVkLE9BQU82ZCxRQUFaLEVBQ0VuYSxTQUFTd0ksSUFBVCxHQUFnQmxNLE9BQU82ZCxRQUF2QjtBQUNGLFVBQUcsQ0FBQyxDQUFDN2QsT0FBTzhkLFVBQVosRUFDRXBhLFNBQVM2RCxNQUFULENBQWdCbE4sSUFBaEIsR0FBdUIyRixPQUFPOGQsVUFBOUI7O0FBRUYsVUFBRyxDQUFDLENBQUM5ZCxPQUFPMmQsU0FBUCxDQUFpQkksVUFBdEIsRUFDRXJhLFNBQVN0RCxFQUFULEdBQWNuQyxXQUFXK0IsT0FBTzJkLFNBQVAsQ0FBaUJJLFVBQTVCLEVBQXdDVixPQUF4QyxDQUFnRCxDQUFoRCxDQUFkLENBREYsS0FFSyxJQUFHLENBQUMsQ0FBQ3JkLE9BQU8yZCxTQUFQLENBQWlCSyxVQUF0QixFQUNIdGEsU0FBU3RELEVBQVQsR0FBY25DLFdBQVcrQixPQUFPMmQsU0FBUCxDQUFpQkssVUFBNUIsRUFBd0NYLE9BQXhDLENBQWdELENBQWhELENBQWQ7QUFDRixVQUFHLENBQUMsQ0FBQ3JkLE9BQU8yZCxTQUFQLENBQWlCTSxVQUF0QixFQUNFdmEsU0FBU3JELEVBQVQsR0FBY3BDLFdBQVcrQixPQUFPMmQsU0FBUCxDQUFpQk0sVUFBNUIsRUFBd0NaLE9BQXhDLENBQWdELENBQWhELENBQWQsQ0FERixLQUVLLElBQUcsQ0FBQyxDQUFDcmQsT0FBTzJkLFNBQVAsQ0FBaUJPLFVBQXRCLEVBQ0h4YSxTQUFTckQsRUFBVCxHQUFjcEMsV0FBVytCLE9BQU8yZCxTQUFQLENBQWlCTyxVQUE1QixFQUF3Q2IsT0FBeEMsQ0FBZ0QsQ0FBaEQsQ0FBZDs7QUFFRixVQUFHLENBQUMsQ0FBQ3JkLE9BQU8yZCxTQUFQLENBQWlCUSxXQUF0QixFQUNFemEsU0FBU3ZELEdBQVQsR0FBZS9HLFFBQVEsUUFBUixFQUFrQjRHLE9BQU8yZCxTQUFQLENBQWlCUSxXQUFuQyxFQUErQyxDQUEvQyxDQUFmLENBREYsS0FFSyxJQUFHLENBQUMsQ0FBQ25lLE9BQU8yZCxTQUFQLENBQWlCUyxXQUF0QixFQUNIMWEsU0FBU3ZELEdBQVQsR0FBZS9HLFFBQVEsUUFBUixFQUFrQjRHLE9BQU8yZCxTQUFQLENBQWlCUyxXQUFuQyxFQUErQyxDQUEvQyxDQUFmOztBQUVGLFVBQUcsQ0FBQyxDQUFDcGUsT0FBTzJkLFNBQVAsQ0FBaUJVLFdBQXRCLEVBQ0UzYSxTQUFTdUksR0FBVCxHQUFlcVMsU0FBU3RlLE9BQU8yZCxTQUFQLENBQWlCVSxXQUExQixFQUFzQyxFQUF0QyxDQUFmLENBREYsS0FFSyxJQUFHLENBQUMsQ0FBQ3JlLE9BQU8yZCxTQUFQLENBQWlCWSxXQUF0QixFQUNIN2EsU0FBU3VJLEdBQVQsR0FBZXFTLFNBQVN0ZSxPQUFPMmQsU0FBUCxDQUFpQlksV0FBMUIsRUFBc0MsRUFBdEMsQ0FBZjs7QUFFRixVQUFHLENBQUMsQ0FBQ3ZlLE9BQU93ZSxXQUFQLENBQW1CL1MsSUFBbkIsQ0FBd0JnVCxLQUE3QixFQUFtQztBQUNqQ3RnQixVQUFFbUUsSUFBRixDQUFPdEMsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QmdULEtBQS9CLEVBQXFDLFVBQVN0UyxLQUFULEVBQWU7QUFDbER6SSxtQkFBU25JLE1BQVQsQ0FBZ0JxRyxJQUFoQixDQUFxQjtBQUNuQndLLG1CQUFPRCxNQUFNdVMsUUFETTtBQUVuQjFpQixpQkFBS3NpQixTQUFTblMsTUFBTXdTLGFBQWYsRUFBNkIsRUFBN0IsQ0FGYztBQUduQnBTLG1CQUFPblQsUUFBUSxtQkFBUixFQUE2QitTLE1BQU15UyxVQUFuQyxJQUErQyxLQUhuQztBQUluQnZTLG9CQUFRalQsUUFBUSxtQkFBUixFQUE2QitTLE1BQU15UyxVQUFuQztBQUpXLFdBQXJCO0FBTUQsU0FQRDtBQVFEOztBQUVELFVBQUcsQ0FBQyxDQUFDNWUsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3Qm9ULElBQTdCLEVBQWtDO0FBQzlCMWdCLFVBQUVtRSxJQUFGLENBQU90QyxPQUFPd2UsV0FBUCxDQUFtQi9TLElBQW5CLENBQXdCb1QsSUFBL0IsRUFBb0MsVUFBU3JTLEdBQVQsRUFBYTtBQUMvQzlJLG1CQUFTcEksSUFBVCxDQUFjc0csSUFBZCxDQUFtQjtBQUNqQndLLG1CQUFPSSxJQUFJc1MsUUFETTtBQUVqQjlpQixpQkFBS3NpQixTQUFTOVIsSUFBSXVTLGdCQUFiLEVBQThCLEVBQTlCLElBQW9DLENBQXBDLEdBQXdDLElBQXhDLEdBQStDVCxTQUFTOVIsSUFBSXdTLGFBQWIsRUFBMkIsRUFBM0IsQ0FGbkM7QUFHakJ6UyxtQkFBTytSLFNBQVM5UixJQUFJdVMsZ0JBQWIsRUFBOEIsRUFBOUIsSUFBb0MsQ0FBcEMsR0FDSCxhQUFXM2xCLFFBQVEsbUJBQVIsRUFBNkJvVCxJQUFJeVMsVUFBakMsQ0FBWCxHQUF3RCxNQUF4RCxHQUErRCxPQUEvRCxHQUF1RVgsU0FBUzlSLElBQUl1UyxnQkFBYixFQUE4QixFQUE5QixDQUF2RSxHQUF5RyxPQUR0RyxHQUVIM2xCLFFBQVEsbUJBQVIsRUFBNkJvVCxJQUFJeVMsVUFBakMsSUFBNkMsTUFMaEM7QUFNakI1UyxvQkFBUWpULFFBQVEsbUJBQVIsRUFBNkJvVCxJQUFJeVMsVUFBakM7QUFOUyxXQUFuQjtBQVFBO0FBQ0E7QUFDQTtBQUNELFNBWkQ7QUFhSDs7QUFFRCxVQUFHLENBQUMsQ0FBQ2pmLE9BQU93ZSxXQUFQLENBQW1CL1MsSUFBbkIsQ0FBd0J5VCxJQUE3QixFQUFrQztBQUNoQyxZQUFHbGYsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QnlULElBQXhCLENBQTZCMWdCLE1BQWhDLEVBQXVDO0FBQ3JDTCxZQUFFbUUsSUFBRixDQUFPdEMsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QnlULElBQS9CLEVBQW9DLFVBQVN6UyxJQUFULEVBQWM7QUFDaEQvSSxxQkFBUytJLElBQVQsQ0FBYzdLLElBQWQsQ0FBbUI7QUFDakJ3SyxxQkFBT0ssS0FBSzBTLFFBREs7QUFFakJuakIsbUJBQUtzaUIsU0FBUzdSLEtBQUsyUyxRQUFkLEVBQXVCLEVBQXZCLENBRlk7QUFHakI3UyxxQkFBT25ULFFBQVEsUUFBUixFQUFrQnFULEtBQUs0UyxVQUF2QixFQUFrQyxDQUFsQyxJQUFxQyxLQUgzQjtBQUlqQmhULHNCQUFRalQsUUFBUSxRQUFSLEVBQWtCcVQsS0FBSzRTLFVBQXZCLEVBQWtDLENBQWxDO0FBSlMsYUFBbkI7QUFNRCxXQVBEO0FBUUQsU0FURCxNQVNPO0FBQ0wzYixtQkFBUytJLElBQVQsQ0FBYzdLLElBQWQsQ0FBbUI7QUFDakJ3SyxtQkFBT3BNLE9BQU93ZSxXQUFQLENBQW1CL1MsSUFBbkIsQ0FBd0J5VCxJQUF4QixDQUE2QkMsUUFEbkI7QUFFakJuakIsaUJBQUtzaUIsU0FBU3RlLE9BQU93ZSxXQUFQLENBQW1CL1MsSUFBbkIsQ0FBd0J5VCxJQUF4QixDQUE2QkUsUUFBdEMsRUFBK0MsRUFBL0MsQ0FGWTtBQUdqQjdTLG1CQUFPblQsUUFBUSxRQUFSLEVBQWtCNEcsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QnlULElBQXhCLENBQTZCRyxVQUEvQyxFQUEwRCxDQUExRCxJQUE2RCxLQUhuRDtBQUlqQmhULG9CQUFRalQsUUFBUSxRQUFSLEVBQWtCNEcsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QnlULElBQXhCLENBQTZCRyxVQUEvQyxFQUEwRCxDQUExRDtBQUpTLFdBQW5CO0FBTUQ7QUFDRjs7QUFFRCxVQUFHLENBQUMsQ0FBQ3JmLE9BQU93ZSxXQUFQLENBQW1CL1MsSUFBbkIsQ0FBd0I2VCxLQUE3QixFQUFtQztBQUNqQyxZQUFHdGYsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QjZULEtBQXhCLENBQThCOWdCLE1BQWpDLEVBQXdDO0FBQ3RDTCxZQUFFbUUsSUFBRixDQUFPdEMsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QjZULEtBQS9CLEVBQXFDLFVBQVM1UyxLQUFULEVBQWU7QUFDbERoSixxQkFBU2dKLEtBQVQsQ0FBZTlLLElBQWYsQ0FBb0I7QUFDbEJ2SCxvQkFBTXFTLE1BQU02UyxPQUFOLEdBQWMsR0FBZCxJQUFtQjdTLE1BQU04UyxjQUFOLEdBQ3ZCOVMsTUFBTThTLGNBRGlCLEdBRXZCOVMsTUFBTStTLFFBRkY7QUFEWSxhQUFwQjtBQUtELFdBTkQ7QUFPRCxTQVJELE1BUU87QUFDTC9iLG1CQUFTZ0osS0FBVCxDQUFlOUssSUFBZixDQUFvQjtBQUNsQnZILGtCQUFNMkYsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QjZULEtBQXhCLENBQThCQyxPQUE5QixHQUFzQyxHQUF0QyxJQUNIdmYsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QjZULEtBQXhCLENBQThCRSxjQUE5QixHQUNDeGYsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QjZULEtBQXhCLENBQThCRSxjQUQvQixHQUVDeGYsT0FBT3dlLFdBQVAsQ0FBbUIvUyxJQUFuQixDQUF3QjZULEtBQXhCLENBQThCRyxRQUg1QjtBQURZLFdBQXBCO0FBTUQ7QUFDRjtBQUNELGFBQU8vYixRQUFQO0FBQ0QsS0F6bENJO0FBMGxDTHFJLG1CQUFlLHVCQUFTL0wsTUFBVCxFQUFnQjtBQUM3QixVQUFJMEQsV0FBVyxFQUFDckosTUFBSyxFQUFOLEVBQVU2UixNQUFLLEVBQWYsRUFBbUIzRSxRQUFRLEVBQUNsTixNQUFLLEVBQU4sRUFBM0IsRUFBc0MyUixVQUFTLEVBQS9DLEVBQW1EN0wsS0FBSSxFQUF2RCxFQUEyREMsSUFBRyxLQUE5RCxFQUFxRUMsSUFBRyxLQUF4RSxFQUErRTRMLEtBQUksQ0FBbkYsRUFBc0YzUSxNQUFLLEVBQTNGLEVBQStGQyxRQUFPLEVBQXRHLEVBQTBHbVIsT0FBTSxFQUFoSCxFQUFvSEQsTUFBSyxFQUF6SCxFQUFmO0FBQ0EsVUFBSWlULFlBQVksRUFBaEI7O0FBRUEsVUFBRyxDQUFDLENBQUMxZixPQUFPMmYsSUFBWixFQUNFamMsU0FBU3JKLElBQVQsR0FBZ0IyRixPQUFPMmYsSUFBdkI7QUFDRixVQUFHLENBQUMsQ0FBQzNmLE9BQU80ZixLQUFQLENBQWFDLFFBQWxCLEVBQ0VuYyxTQUFTc0ksUUFBVCxHQUFvQmhNLE9BQU80ZixLQUFQLENBQWFDLFFBQWpDOztBQUVGO0FBQ0E7QUFDQSxVQUFHLENBQUMsQ0FBQzdmLE9BQU84ZixNQUFaLEVBQ0VwYyxTQUFTNkQsTUFBVCxDQUFnQmxOLElBQWhCLEdBQXVCMkYsT0FBTzhmLE1BQTlCOztBQUVGLFVBQUcsQ0FBQyxDQUFDOWYsT0FBTytmLEVBQVosRUFDRXJjLFNBQVN0RCxFQUFULEdBQWNuQyxXQUFXK0IsT0FBTytmLEVBQWxCLEVBQXNCMUMsT0FBdEIsQ0FBOEIsQ0FBOUIsQ0FBZDtBQUNGLFVBQUcsQ0FBQyxDQUFDcmQsT0FBT2dnQixFQUFaLEVBQ0V0YyxTQUFTckQsRUFBVCxHQUFjcEMsV0FBVytCLE9BQU9nZ0IsRUFBbEIsRUFBc0IzQyxPQUF0QixDQUE4QixDQUE5QixDQUFkOztBQUVGLFVBQUcsQ0FBQyxDQUFDcmQsT0FBT2lnQixHQUFaLEVBQ0V2YyxTQUFTdUksR0FBVCxHQUFlcVMsU0FBU3RlLE9BQU9pZ0IsR0FBaEIsRUFBb0IsRUFBcEIsQ0FBZjs7QUFFRixVQUFHLENBQUMsQ0FBQ2pnQixPQUFPNGYsS0FBUCxDQUFhTSxPQUFsQixFQUNFeGMsU0FBU3ZELEdBQVQsR0FBZS9HLFFBQVEsUUFBUixFQUFrQjRHLE9BQU80ZixLQUFQLENBQWFNLE9BQS9CLEVBQXVDLENBQXZDLENBQWYsQ0FERixLQUVLLElBQUcsQ0FBQyxDQUFDbGdCLE9BQU80ZixLQUFQLENBQWFPLE9BQWxCLEVBQ0h6YyxTQUFTdkQsR0FBVCxHQUFlL0csUUFBUSxRQUFSLEVBQWtCNEcsT0FBTzRmLEtBQVAsQ0FBYU8sT0FBL0IsRUFBdUMsQ0FBdkMsQ0FBZjs7QUFFRixVQUFHLENBQUMsQ0FBQ25nQixPQUFPb2dCLElBQVAsQ0FBWUMsVUFBWixDQUF1QkMsU0FBekIsSUFBc0N0Z0IsT0FBT29nQixJQUFQLENBQVlDLFVBQVosQ0FBdUJDLFNBQXZCLENBQWlDOWhCLE1BQXZFLElBQWlGd0IsT0FBT29nQixJQUFQLENBQVlDLFVBQVosQ0FBdUJDLFNBQXZCLENBQWlDLENBQWpDLEVBQW9DQyxTQUF4SCxFQUFrSTtBQUNoSWIsb0JBQVkxZixPQUFPb2dCLElBQVAsQ0FBWUMsVUFBWixDQUF1QkMsU0FBdkIsQ0FBaUMsQ0FBakMsRUFBb0NDLFNBQWhEO0FBQ0Q7O0FBRUQsVUFBRyxDQUFDLENBQUN2Z0IsT0FBT3dnQixZQUFaLEVBQXlCO0FBQ3ZCLFlBQUlqbEIsU0FBVXlFLE9BQU93Z0IsWUFBUCxDQUFvQkMsV0FBcEIsSUFBbUN6Z0IsT0FBT3dnQixZQUFQLENBQW9CQyxXQUFwQixDQUFnQ2ppQixNQUFwRSxHQUE4RXdCLE9BQU93Z0IsWUFBUCxDQUFvQkMsV0FBbEcsR0FBZ0h6Z0IsT0FBT3dnQixZQUFwSTtBQUNBcmlCLFVBQUVtRSxJQUFGLENBQU8vRyxNQUFQLEVBQWMsVUFBUzRRLEtBQVQsRUFBZTtBQUMzQnpJLG1CQUFTbkksTUFBVCxDQUFnQnFHLElBQWhCLENBQXFCO0FBQ25Cd0ssbUJBQU9ELE1BQU13VCxJQURNO0FBRW5CM2pCLGlCQUFLc2lCLFNBQVNvQixTQUFULEVBQW1CLEVBQW5CLENBRmM7QUFHbkJuVCxtQkFBT25ULFFBQVEsbUJBQVIsRUFBNkIrUyxNQUFNdVUsTUFBbkMsSUFBMkMsS0FIL0I7QUFJbkJyVSxvQkFBUWpULFFBQVEsbUJBQVIsRUFBNkIrUyxNQUFNdVUsTUFBbkM7QUFKVyxXQUFyQjtBQU1ELFNBUEQ7QUFRRDs7QUFFRCxVQUFHLENBQUMsQ0FBQzFnQixPQUFPMmdCLElBQVosRUFBaUI7QUFDZixZQUFJcmxCLE9BQVEwRSxPQUFPMmdCLElBQVAsQ0FBWUMsR0FBWixJQUFtQjVnQixPQUFPMmdCLElBQVAsQ0FBWUMsR0FBWixDQUFnQnBpQixNQUFwQyxHQUE4Q3dCLE9BQU8yZ0IsSUFBUCxDQUFZQyxHQUExRCxHQUFnRTVnQixPQUFPMmdCLElBQWxGO0FBQ0F4aUIsVUFBRW1FLElBQUYsQ0FBT2hILElBQVAsRUFBWSxVQUFTa1IsR0FBVCxFQUFhO0FBQ3ZCOUksbUJBQVNwSSxJQUFULENBQWNzRyxJQUFkLENBQW1CO0FBQ2pCd0ssbUJBQU9JLElBQUltVCxJQUFKLEdBQVMsSUFBVCxHQUFjblQsSUFBSXFVLElBQWxCLEdBQXVCLEdBRGI7QUFFakI3a0IsaUJBQUt3USxJQUFJc1UsR0FBSixJQUFXLFNBQVgsR0FBdUIsQ0FBdkIsR0FBMkJ4QyxTQUFTOVIsSUFBSXVVLElBQWIsRUFBa0IsRUFBbEIsQ0FGZjtBQUdqQnhVLG1CQUFPQyxJQUFJc1UsR0FBSixJQUFXLFNBQVgsR0FDSHRVLElBQUlzVSxHQUFKLEdBQVEsR0FBUixHQUFZMW5CLFFBQVEsbUJBQVIsRUFBNkJvVCxJQUFJa1UsTUFBakMsQ0FBWixHQUFxRCxNQUFyRCxHQUE0RCxPQUE1RCxHQUFvRXBDLFNBQVM5UixJQUFJdVUsSUFBSixHQUFTLEVBQVQsR0FBWSxFQUFyQixFQUF3QixFQUF4QixDQUFwRSxHQUFnRyxPQUQ3RixHQUVIdlUsSUFBSXNVLEdBQUosR0FBUSxHQUFSLEdBQVkxbkIsUUFBUSxtQkFBUixFQUE2Qm9ULElBQUlrVSxNQUFqQyxDQUFaLEdBQXFELE1BTHhDO0FBTWpCclUsb0JBQVFqVCxRQUFRLG1CQUFSLEVBQTZCb1QsSUFBSWtVLE1BQWpDO0FBTlMsV0FBbkI7QUFRRCxTQVREO0FBVUQ7O0FBRUQsVUFBRyxDQUFDLENBQUMxZ0IsT0FBT2doQixLQUFaLEVBQWtCO0FBQ2hCLFlBQUl2VSxPQUFRek0sT0FBT2doQixLQUFQLENBQWFDLElBQWIsSUFBcUJqaEIsT0FBT2doQixLQUFQLENBQWFDLElBQWIsQ0FBa0J6aUIsTUFBeEMsR0FBa0R3QixPQUFPZ2hCLEtBQVAsQ0FBYUMsSUFBL0QsR0FBc0VqaEIsT0FBT2doQixLQUF4RjtBQUNBN2lCLFVBQUVtRSxJQUFGLENBQU9tSyxJQUFQLEVBQVksVUFBU0EsSUFBVCxFQUFjO0FBQ3hCL0ksbUJBQVMrSSxJQUFULENBQWM3SyxJQUFkLENBQW1CO0FBQ2pCd0ssbUJBQU9LLEtBQUtrVCxJQURLO0FBRWpCM2pCLGlCQUFLc2lCLFNBQVM3UixLQUFLc1UsSUFBZCxFQUFtQixFQUFuQixDQUZZO0FBR2pCeFUsbUJBQU8sU0FBT0UsS0FBS2lVLE1BQVosR0FBbUIsTUFBbkIsR0FBMEJqVSxLQUFLcVUsR0FIckI7QUFJakJ6VSxvQkFBUUksS0FBS2lVO0FBSkksV0FBbkI7QUFNRCxTQVBEO0FBUUQ7O0FBRUQsVUFBRyxDQUFDLENBQUMxZ0IsT0FBT2toQixNQUFaLEVBQW1CO0FBQ2pCLFlBQUl4VSxRQUFTMU0sT0FBT2toQixNQUFQLENBQWNDLEtBQWQsSUFBdUJuaEIsT0FBT2toQixNQUFQLENBQWNDLEtBQWQsQ0FBb0IzaUIsTUFBNUMsR0FBc0R3QixPQUFPa2hCLE1BQVAsQ0FBY0MsS0FBcEUsR0FBNEVuaEIsT0FBT2toQixNQUEvRjtBQUNFL2lCLFVBQUVtRSxJQUFGLENBQU9vSyxLQUFQLEVBQWEsVUFBU0EsS0FBVCxFQUFlO0FBQzFCaEosbUJBQVNnSixLQUFULENBQWU5SyxJQUFmLENBQW9CO0FBQ2xCdkgsa0JBQU1xUyxNQUFNaVQ7QUFETSxXQUFwQjtBQUdELFNBSkQ7QUFLSDtBQUNELGFBQU9qYyxRQUFQO0FBQ0QsS0F4cUNJO0FBeXFDTHdILGVBQVcsbUJBQVNrVyxPQUFULEVBQWlCO0FBQzFCLFVBQUlDLFlBQVksQ0FDZCxFQUFDQyxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFEYyxFQUVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQUZjLEVBR2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFIYyxFQUlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBSmMsRUFLZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQUxjLEVBTWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFOYyxFQU9kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBUGMsRUFRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQVJjLEVBU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFUYyxFQVVkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBVmMsRUFXZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQVhjLEVBWWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFaYyxFQWFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBYmMsRUFjZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWRjLEVBZWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBZmMsRUFnQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaEJjLEVBaUJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpCYyxFQWtCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsQmMsRUFtQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbkJjLEVBb0JkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBCYyxFQXFCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyQmMsRUFzQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdEJjLEVBdUJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZCYyxFQXdCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4QmMsRUF5QmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6QmMsRUEwQmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExQmMsRUEyQmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBM0JjLEVBNEJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVCYyxFQTZCZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3QmMsRUE4QmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOUJjLEVBK0JkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQS9CYyxFQWdDZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFoQ2MsRUFpQ2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqQ2MsRUFrQ2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsQ2MsRUFtQ2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbkNjLEVBb0NkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcENjLEVBcUNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBckNjLEVBc0NkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdENjLEVBdUNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdkNjLEVBd0NkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeENjLEVBeUNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBekNjLEVBMENkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMUNjLEVBMkNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0NjLEVBNENkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNUNjLEVBNkNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN0NjLEVBOENkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlDYyxFQStDZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvQ2MsRUFnRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoRGMsRUFpRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqRGMsRUFrRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsRGMsRUFtRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuRGMsRUFvRGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcERjLEVBcURkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJEYyxFQXNEZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXREYyxFQXVEZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZEYyxFQXdEZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4RGMsRUF5RGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekRjLEVBMERkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMURjLEVBMkRkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0RjLEVBNERkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVEYyxFQTZEZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3RGMsRUE4RGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5RGMsRUErRGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvRGMsRUFnRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoRWMsRUFpRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqRWMsRUFrRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsRWMsRUFtRWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuRWMsRUFvRWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcEVjLEVBcUVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJFYyxFQXNFZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRFYyxFQXVFZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZFYyxFQXdFZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4RWMsRUF5RWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekVjLEVBMEVkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMUVjLEVBMkVkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0VjLEVBNEVkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNUVjLEVBNkVkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN0VjLEVBOEVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlFYyxFQStFZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvRWMsRUFnRmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFoRmMsRUFpRmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFqRmMsRUFrRmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbEZjLEVBbUZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5GYyxFQW9GZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBGYyxFQXFGZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJGYyxFQXNGZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRGYyxFQXVGZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZGYyxFQXdGZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4RmMsRUF5RmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekZjLEVBMEZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMUZjLEVBMkZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM0ZjLEVBNEZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNUZjLEVBNkZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN0ZjLEVBOEZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOUZjLEVBK0ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL0ZjLEVBZ0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaEdjLEVBaUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBakdjLEVBa0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbEdjLEVBbUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbkdjLEVBb0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcEdjLEVBcUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBckdjLEVBc0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdEdjLEVBdUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdkdjLEVBd0dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeEdjLEVBeUdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBekdjLEVBMEdkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTFHYyxFQTJHZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEzR2MsRUE0R2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1R2MsRUE2R2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3R2MsRUE4R2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOUdjLEVBK0dkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQS9HYyxFQWdIZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWhIYyxFQWlIZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWpIYyxFQWtIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsSGMsRUFtSGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbkhjLEVBb0hkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBIYyxFQXFIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFySGMsRUFzSGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdEhjLEVBdUhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZIYyxFQXdIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4SGMsRUF5SGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekhjLEVBMEhkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMUhjLEVBMkhkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM0hjLEVBNEhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVIYyxFQTZIZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3SGMsRUE4SGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5SGMsRUErSGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvSGMsRUFnSWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoSWMsRUFpSWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqSWMsRUFrSWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbEljLEVBbUlkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5JYyxFQW9JZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXBJYyxFQXFJZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXJJYyxFQXNJZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0SWMsRUF1SWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdkljLEVBd0lkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXhJYyxFQXlJZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF6SWMsRUEwSWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMUljLEVBMklkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNJYyxFQTRJZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTVJYyxFQTZJZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTdJYyxFQThJZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlJYyxFQStJZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9JYyxFQWdKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWhKYyxFQWlKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWpKYyxFQWtKZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxKYyxFQW1KZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5KYyxFQW9KZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXBKYyxFQXFKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXJKYyxFQXNKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXRKYyxFQXVKZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZKYyxFQXdKZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4SmMsRUF5SmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBekpjLEVBMEpkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMUpjLEVBMkpkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM0pjLEVBNEpkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNUpjLEVBNkpkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN0pjLEVBOEpkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOUpjLEVBK0pkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL0pjLEVBZ0tkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaEtjLEVBaUtkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaktjLEVBa0tkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbEtjLEVBbUtkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbktjLEVBb0tkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcEtjLEVBcUtkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcktjLEVBc0tkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdEtjLEVBdUtkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZLYyxFQXdLZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4S2MsRUF5S2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6S2MsRUEwS2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExS2MsRUEyS2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBM0tjLEVBNEtkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVLYyxFQTZLZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3S2MsRUE4S2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOUtjLEVBK0tkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBL0tjLEVBZ0xkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBaExjLEVBaUxkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBakxjLEVBa0xkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbExjLEVBbUxkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5MYyxFQW9MZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwTGMsRUFxTGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFyTGMsRUFzTGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF0TGMsRUF1TGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2TGMsRUF3TGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4TGMsRUF5TGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6TGMsRUEwTGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMUxjLEVBMkxkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNMYyxFQTRMZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1TGMsRUE2TGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN0xjLEVBOExkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlMYyxFQStMZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvTGMsRUFnTWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaE1jLEVBaU1kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpNYyxFQWtNZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxNYyxFQW1NZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5NYyxFQW9NZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBNYyxFQXFNZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJNYyxFQXNNZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0TWMsRUF1TWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdk1jLEVBd01kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeE1jLEVBeU1kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBek1jLEVBME1kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMU1jLEVBMk1kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM01jLEVBNE1kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTVNYyxFQTZNZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3TWMsRUE4TWQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUE5TWMsRUErTWQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUEvTWMsRUFnTmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaE5jLEVBaU5kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpOYyxFQWtOZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsTmMsRUFtTmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbk5jLEVBb05kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBOYyxFQXFOZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyTmMsRUFzTmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdE5jLEVBdU5kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZOYyxFQXdOZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4TmMsRUF5TmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBek5jLEVBME5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMU5jLEVBMk5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM05jLEVBNE5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNU5jLEVBNk5kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN05jLEVBOE5kLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOU5jLEVBK05kLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEdBQWhCLEVBL05jLEVBZ09kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWhPYyxFQWlPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFqT2MsRUFrT2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbE9jLEVBbU9kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQW5PYyxFQW9PZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwT2MsRUFxT2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBck9jLEVBc09kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRPYyxFQXVPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2T2MsRUF3T2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBeE9jLEVBeU9kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXpPYyxFQTBPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUExT2MsRUEyT2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBM09jLEVBNE9kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNU9jLEVBNk9kLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN09jLEVBOE9kLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlPYyxFQStPZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvT2MsRUFnUGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFBjLEVBaVBkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpQYyxFQWtQZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWxQYyxFQW1QZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5QYyxFQW9QZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwUGMsRUFxUGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBclBjLEVBc1BkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRQYyxFQXVQZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2UGMsRUF3UGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF4UGMsRUF5UGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6UGMsRUEwUGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUGMsRUEyUGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUGMsRUE0UGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBNVBjLEVBNlBkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTdQYyxFQThQZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTlQYyxFQStQZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQS9QYyxFQWdRZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFoUWMsRUFpUWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBalFjLEVBa1FkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBbFFjLEVBbVFkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBblFjLEVBb1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFFjLEVBcVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclFjLEVBc1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFFjLEVBdVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlFjLEVBd1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFFjLEVBeVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFJjLEVBdVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlJjLEVBd1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFJjLEVBeVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelJjLEVBMFJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVJjLEVBMlJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1JjLEVBNFJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNVJjLEVBNlJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN1JjLEVBOFJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlSYyxFQStSZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvUmMsRUFnU2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFoU2MsRUFpU2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFqU2MsRUFrU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsU2MsRUFtU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuU2MsRUFvU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwU2MsRUFxU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyU2MsRUFzU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0U2MsRUF1U2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2U2MsRUF3U2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4U2MsRUF5U2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6U2MsRUEwU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExU2MsRUEyU2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzU2MsRUE0U2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBNVNjLEVBNlNkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTdTYyxFQThTZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlTYyxFQStTZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9TYyxFQWdUZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWhUYyxFQWlUZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWpUYyxFQWtUZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxUYyxFQW1UZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5UYyxFQW9UZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwVGMsRUFxVGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBclRjLEVBc1RkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRUYyxFQXVUZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2VGMsRUF3VGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF4VGMsRUF5VGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6VGMsRUEwVGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMVRjLEVBMlRkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNUYyxFQTRUZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1VGMsRUE2VGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN1RjLEVBOFRkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlUYyxFQStUZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvVGMsRUFnVWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFVjLEVBaVVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpVYyxFQWtVZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWxVYyxFQW1VZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5VYyxFQW9VZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwVWMsRUFxVWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBclVjLEVBc1VkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRVYyxFQXVVZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2VWMsRUF3VWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4VWMsRUF5VWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6VWMsRUEwVWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMVVjLEVBMlVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNVYyxFQTRVZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1VWMsRUE2VWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN1VjLEVBOFVkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlVYyxFQStVZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvVWMsRUFnVmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFZjLEVBaVZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpWYyxFQWtWZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsVmMsRUFtVmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBblZjLEVBb1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFZjLEVBcVZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclZjLEVBc1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFZjLEVBdVZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlZjLEVBd1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFZjLEVBeVZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelZjLEVBMFZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMVZjLEVBMlZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM1ZjLEVBNFZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNVZjLEVBNlZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBN1ZjLEVBOFZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVZjLEVBK1ZkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1ZjLEVBZ1dkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFdjLEVBaVdkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaldjLEVBa1dkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWxXYyxFQW1XZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuV2MsRUFvV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwV2MsRUFxV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyV2MsRUFzV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0V2MsRUF1V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2V2MsRUF3V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4V2MsRUF5V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6V2MsRUEwV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExV2MsRUEyV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzV2MsRUE0V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1V2MsRUE2V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3V2MsRUE4V2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5V2MsRUErV2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvV2MsRUFnWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBaFhjLEVBaVhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWpYYyxFQWtYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFsWGMsRUFtWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBblhjLEVBb1hkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBYYyxFQXFYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyWGMsRUFzWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdFhjLEVBdVhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXZYYyxFQXdYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4WGMsRUF5WGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBelhjLEVBMFhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTFYYyxFQTJYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEzWGMsRUE0WGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBNVhjLEVBNlhkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTdYYyxFQThYZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE5WGMsRUErWGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBL1hjLEVBZ1lkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFljLEVBaVlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalljLEVBa1lkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFljLEVBbVlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblljLEVBb1lkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFljLEVBcVlkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclljLEVBc1lkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRZYyxFQXVZZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF2WWMsRUF3WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4WWMsRUF5WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6WWMsRUEwWWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExWWMsRUEyWWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzWWMsRUE0WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1WWMsRUE2WWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3WWMsRUE4WWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBOVljLEVBK1lkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQS9ZYyxFQWdaZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWhaYyxFQWlaZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWpaYyxFQWtaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxaYyxFQW1aZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5aYyxFQW9aZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBaYyxFQXFaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJaYyxFQXNaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRaYyxFQXVaZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZaYyxFQXdaZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF4WmMsRUF5WmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBelpjLEVBMFpkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTFaYyxFQTJaZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEzWmMsRUE0WmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1WmMsRUE2WmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3WmMsRUE4WmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5WmMsRUErWmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvWmMsRUFnYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoYWMsRUFpYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqYWMsRUFrYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsYWMsRUFtYWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuYWMsRUFvYWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGFjLEVBcWFkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJhYyxFQXNhZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0YWMsRUF1YWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdmFjLEVBd2FkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXhhYyxFQXlhZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF6YWMsRUEwYWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMWFjLEVBMmFkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNhYyxFQTRhZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE1YWMsRUE2YWQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN2FjLEVBOGFkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTlhYyxFQSthZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUEvYWMsRUFnYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoYmMsRUFpYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqYmMsRUFrYmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFsYmMsRUFtYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuYmMsRUFvYmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGJjLEVBcWJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcmJjLEVBc2JkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdGJjLEVBdWJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdmJjLEVBd2JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeGJjLEVBeWJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBemJjLEVBMGJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMWJjLEVBMmJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM2JjLEVBNGJkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTViYyxFQTZiZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE3YmMsRUE4YmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5YmMsRUErYmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvYmMsRUFnY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoY2MsRUFpY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqY2MsRUFrY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsY2MsRUFtY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuY2MsRUFvY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwY2MsRUFxY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyY2MsRUFzY2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0Y2MsRUF1Y2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2Y2MsRUF3Y2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4Y2MsRUF5Y2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6Y2MsRUEwY2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExY2MsRUEyY2QsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzY2MsRUE0Y2QsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1Y2MsRUE2Y2QsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBN2NjLEVBOGNkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOWNjLEVBK2NkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEdBQWhCLEVBL2NjLEVBZ2RkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBaGRjLEVBaWRkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEdBQWhCLEVBamRjLEVBa2RkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWxkYyxFQW1kZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5kYyxFQW9kZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFwZGMsRUFxZGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUFyZGMsRUFzZGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF0ZGMsRUF1ZGQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZGMsRUF3ZGQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUF4ZGMsRUF5ZGQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6ZGMsRUEwZGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBMWRjLEVBMmRkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQTNkYyxFQTRkZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVkYyxFQTZkZCxFQUFDRCxHQUFHLFdBQUosRUFBaUJDLEdBQUcsR0FBcEIsRUE3ZGMsRUE4ZGQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUE5ZGMsRUErZGQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBL2RjLEVBZ2VkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQWhlYyxFQWllZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWplYyxFQWtlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQWxlYyxFQW1lZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQW5lYyxFQW9lZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBlYyxFQXFlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXJlYyxFQXNlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXRlYyxFQXVlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZlYyxFQXdlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhlYyxFQXllZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXplYyxFQTBlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFlYyxFQTJlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTNlYyxFQTRlZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVlYyxFQTZlZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTdlYyxFQThlZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUE5ZWMsRUErZWQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEvZWMsRUFnZmQsRUFBQ0QsR0FBRyxNQUFKLEVBQVlDLEdBQUcsR0FBZixFQWhmYyxFQWlmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWpmYyxFQWtmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWxmYyxFQW1mZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuZmMsRUFvZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGZjLEVBcWZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJmYyxFQXNmZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0ZmMsRUF1ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBcGpCLFFBQUVtRSxJQUFGLENBQU8rZSxTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRcmpCLE9BQVIsQ0FBZ0J5akIsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVF0akIsT0FBUixDQUFnQmdaLE9BQU8wSyxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQTlxREksR0FBUDtBQWdyREQsQ0FuckRELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6TW9kdWxlJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGw7XG52YXIgcmVzZXRDaGFydCA9IDEwMDtcbnZhciB0aW1lb3V0ID0gbnVsbDsgLy9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogISEoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnJyxcbiAgc3NpZDogJycsXG4gIHNzaWRfcGFzczogJycsXG4gIGhvc3RuYW1lOiAnYmJlc3AnLFxuICBhcmR1aW5vX3Bhc3M6ICdiYmFkbWluJyxcbiAgYXV0b2Nvbm5lY3Q6IGZhbHNlXG59O1xuJHNjb3BlLmhvcHM7XG4kc2NvcGUuZ3JhaW5zO1xuJHNjb3BlLndhdGVyO1xuJHNjb3BlLmxvdmlib25kO1xuJHNjb3BlLnBrZztcbiRzY29wZS5rZXR0bGVUeXBlcyA9IEJyZXdTZXJ2aWNlLmtldHRsZVR5cGVzKCk7XG4kc2NvcGUuc2hvd1NldHRpbmdzID0gdHJ1ZTtcbiRzY29wZS5lcnJvciA9IHttZXNzYWdlOiAnJywgdHlwZTogJ2Rhbmdlcid9O1xuJHNjb3BlLnNsaWRlciA9IHtcbiAgbWluOiAwLFxuICBvcHRpb25zOiB7XG4gICAgZmxvb3I6IDAsXG4gICAgY2VpbDogMTAwLFxuICAgIHN0ZXA6IDUsXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gYCR7dmFsdWV9JWA7XG4gICAgfSxcbiAgICBvbkVuZDogZnVuY3Rpb24oa2V0dGxlSWQsIG1vZGVsVmFsdWUsIGhpZ2hWYWx1ZSwgcG9pbnRlclR5cGUpe1xuICAgICAgdmFyIGtldHRsZSA9IGtldHRsZUlkLnNwbGl0KCdfJyk7XG4gICAgICB2YXIgaztcblxuICAgICAgc3dpdGNoIChrZXR0bGVbMF0pIHtcbiAgICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uaGVhdGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5jb29sZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLnB1bXA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmKCFrKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmFjdGl2ZSAmJiBrLnB3bSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgICByZXR1cm4gJHNjb3BlLnRvZ2dsZVJlbGF5KCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0sIGssIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuJHNjb3BlLmdldEtldHRsZVNsaWRlck9wdGlvbnMgPSBmdW5jdGlvbih0eXBlLCBpbmRleCl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKCRzY29wZS5zbGlkZXIub3B0aW9ucywge2lkOiBgJHt0eXBlfV8ke2luZGV4fWB9KTtcbn1cblxuJHNjb3BlLmdldExvdmlib25kQ29sb3IgPSBmdW5jdGlvbihyYW5nZSl7XG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZSgvwrAvZywnJykucmVwbGFjZSgvIC9nLCcnKTtcbiAgaWYocmFuZ2UuaW5kZXhPZignLScpIT09LTEpe1xuICAgIHZhciByQXJyPXJhbmdlLnNwbGl0KCctJyk7XG4gICAgcmFuZ2UgPSAocGFyc2VGbG9hdChyQXJyWzBdKStwYXJzZUZsb2F0KHJBcnJbMV0pKS8yO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gcGFyc2VGbG9hdChyYW5nZSk7XG4gIH1cbiAgaWYoIXJhbmdlKVxuICAgIHJldHVybiAnJztcbiAgdmFyIGwgPSBfLmZpbHRlcigkc2NvcGUubG92aWJvbmQsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiAoaXRlbS5zcm0gPD0gcmFuZ2UpID8gaXRlbS5oZXggOiAnJztcbiAgfSk7XG4gIGlmKCEhbC5sZW5ndGgpXG4gICAgcmV0dXJuIGxbbC5sZW5ndGgtMV0uaGV4O1xuICByZXR1cm4gJyc7XG59O1xuXG4vL2RlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4kc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnKSB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuLy8gZ2VuZXJhbCBjaGVjayBhbmQgdXBkYXRlXG5pZighJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwpXG4gIHJldHVybiAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydCwgc2Vzc2lvbjogJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbn0pO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4kc2NvcGUuc2hhcmUgPSAoISRzdGF0ZS5wYXJhbXMuZmlsZSAmJiBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSkgPyBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSA6IHtcbiAgICAgIGZpbGU6ICRzdGF0ZS5wYXJhbXMuZmlsZSB8fCBudWxsXG4gICAgICAsIHBhc3N3b3JkOiBudWxsXG4gICAgICAsIG5lZWRQYXNzd29yZDogZmFsc2VcbiAgICAgICwgYWNjZXNzOiAncmVhZE9ubHknXG4gICAgICAsIGRlbGV0ZUFmdGVyOiAxNFxuICB9O1xuXG4kc2NvcGUub3BlblNrZXRjaGVzID0gZnVuY3Rpb24oKXtcbiAgJCgnI3NldHRpbmdzTW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAkKCcjc2tldGNoZXNNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG59O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtQnkob2JqLCdhbW91bnQnKTtcbn07XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYm9hcmQ6ICcnLFxuICAgICAgICBSU1NJOiBmYWxzZSxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgYWRjOiAwLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7ZXJyb3I6ICcnLGR0OiAnJyxtZXNzYWdlOicnfVxuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKGFyZHVpbm8pID0+IHtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdDb25uZWN0aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ2luZm8nKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBpZihpbmZvICYmIGluZm8uQnJld0JlbmNoKXtcbiAgICAgICAgICAgIGV2ZW50LnNyY0VsZW1lbnQuaW5uZXJIVE1MID0gJ0Nvbm5lY3QnO1xuICAgICAgICAgICAgYXJkdWluby5ib2FyZCA9IGluZm8uQnJld0JlbmNoLmJvYXJkO1xuICAgICAgICAgICAgaWYoaW5mby5CcmV3QmVuY2guUlNTSSlcbiAgICAgICAgICAgICAgYXJkdWluby5SU1NJID0gaW5mby5CcmV3QmVuY2guUlNTSTtcbiAgICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9IGluZm8uQnJld0JlbmNoLnZlcnNpb247XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1AzMicpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDM5O1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby50b3VjaCA9IFs0LDAsMiwxNSwxMywxMiwxNCwyNywzMywzMl07XG4gICAgICAgICAgICB9IGVsc2UgaWYoYXJkdWluby5ib2FyZC5pbmRleE9mKCdFU1A4MjY2JykgPT0gMCl7XG4gICAgICAgICAgICAgIGFyZHVpbm8uYW5hbG9nID0gMDtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMTY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLnN0YXR1cyA9PSAtMSl7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZWJvb3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubywgJ3JlYm9vdCcpXG4gICAgICAgIC50aGVuKGluZm8gPT4ge1xuICAgICAgICAgIGFyZHVpbm8udmVyc2lvbiA9ICcnO1xuICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnUmVib290IFN1Y2Nlc3MsIHRyeSBjb25uZWN0aW5nIGluIGEgZmV3IHNlY29uZHMuJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKHBrZy52ZXJzaW9uIDwgNC4yKVxuICAgICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdVcGdyYWRlIHRvIHN1cHBvcnQgcmVib290JztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnQ291bGQgbm90IGNvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgbG9naW46ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkubG9naW4oJHNjb3BlLnNldHRpbmdzLnRwbGluay51c2VyLCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGFzcylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnRva2VuKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnRva2VuID0gcmVzcG9uc2UudG9rZW47XG4gICAgICAgICAgICAkc2NvcGUudHBsaW5rLnNjYW4ocmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnU2Nhbm5pbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZighIXBsdWcuc3RhdHVzKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihhcmR1aW5vLCBwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZSBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vKSl7XG4gICAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGFyZHVpbm8sIHRydWUpID09ICc4MjY2JylcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcGluLnJlcGxhY2UoJ0EnLCdHUElPJykucmVwbGFjZSgnRCcsJ0dQSU8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwaW47XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCl7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwQjAnO1xuICAgIH1cbiAgICBrZXR0bGUudGVtcC52Y2MgPSAnJztcbiAgICBrZXR0bGUudGVtcC5pbmRleCA9ICcnO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlVGVzdCA9IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgIGFyZHVpbm8udGVzdGluZyA9IHRydWU7XG4gICAgQnJld1NlcnZpY2Uuc2hhcmVUZXN0KGFyZHVpbm8pXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5odHRwX2NvZGUgPT0gMjAwKVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmluZmx1eGRiID0ge1xuICAgIGJyZXdiZW5jaEhvc3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuaG9zdGVkKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmwpO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vZ2V0IGxpc3Qgb2YgZGF0YWJhc2VzXG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN0cmVhbXMgPSB7XG4gICAgY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gKCEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgJiZcbiAgICAgICAgISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcyA9IGRlZmF1bHRTZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5KVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmF1dGgodHJ1ZSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGtldHRsZXM6IChrZXR0bGUsIHJlbGF5KSA9PiB7XG4gICAgICBpZihyZWxheSl7XG4gICAgICAgIGtldHRsZVtyZWxheV0uc2tldGNoID0gIWtldHRsZVtyZWxheV0uc2tldGNoO1xuICAgICAgICBpZigha2V0dGxlLm5vdGlmeS5zdHJlYW1zKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gJ3NrZXRjaGVzJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnaW5mbyc7XG4gICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAwO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5rZXR0bGVzLnNhdmUoa2V0dGxlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgdmFyIGtldHRsZVJlc3BvbnNlID0gcmVzcG9uc2Uua2V0dGxlO1xuICAgICAgICAgIC8vIHVwZGF0ZSBrZXR0bGUgdmFyc1xuICAgICAgICAgIGtldHRsZS5pZCA9IGtldHRsZVJlc3BvbnNlLmlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBhcmR1aW5vIGlkXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywgYXJkdWlubyA9PiB7XG4gICAgICAgICAgICBpZihhcmR1aW5vLmlkID09IGtldHRsZS5hcmR1aW5vLmlkKVxuICAgICAgICAgICAgICBhcmR1aW5vLmlkID0ga2V0dGxlUmVzcG9uc2UuZGV2aWNlSWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICAvLyB1cGRhdGUgc2Vzc2lvbiB2YXJzXG4gICAgICAgICAgXy5tZXJnZSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLCBrZXR0bGVSZXNwb25zZS5zZXNzaW9uKTtcblxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnc3VjY2Vzcyc7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zID0gIWtldHRsZS5ub3RpZnkuc3RyZWFtcztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAxO1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuZGF0YSAmJiBlcnIuZGF0YS5lcnJvciAmJiBlcnIuZGF0YS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLmRhdGEuZXJyb3IubWVzc2FnZSwga2V0dGxlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JyZXdCZW5jaCBTdHJlYW1zIEVycm9yJywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2Vzc2lvbnM6IHtcbiAgICAgIHNhdmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5zZXNzaW9ucy5zYXZlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuXG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5zaGFyZUFjY2VzcyA9IGZ1bmN0aW9uKGFjY2Vzcyl7XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQgPSB0cnVlO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5sb2FkU2hhcmVGaWxlKCRzY29wZS5zaGFyZS5maWxlLCAkc2NvcGUuc2hhcmUucGFzc3dvcmQgfHwgbnVsbClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGlmKGNvbnRlbnRzKXtcbiAgICAgICAgICBpZihjb250ZW50cy5uZWVkUGFzc3dvcmQpe1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IHRydWU7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncy5yZWNpcGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlID0gY29udGVudHMuc2V0dGluZ3MucmVjaXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gZmFsc2U7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zaGFyZSAmJiBjb250ZW50cy5zaGFyZS5hY2Nlc3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2hhcmUuYWNjZXNzID0gY29udGVudHMuc2hhcmUuYWNjZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBjb250ZW50cy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMgPSB7b246ZmFsc2UsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMua2V0dGxlcyl7XG4gICAgICAgICAgICAgIF8uZWFjaChjb250ZW50cy5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAgICAgICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMDArNSxzdWJUZXh0OntlbmFibGVkOiB0cnVlLHRleHQ6ICdzdGFydGluZy4uLicsY29sb3I6ICdncmF5Jyxmb250OiAnYXV0byd9fSk7XG4gICAgICAgICAgICAgICAga2V0dGxlLnZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXMgPSBjb250ZW50cy5rZXR0bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBsb2FkaW5nIHRoZSBzaGFyZWQgc2Vzc2lvbi5cIik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoISFmb3JtYXR0ZWRfY29udGVudCl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZighIWpzb25PYmouUmVjaXBlcyAmJiAhIWpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoISFqc29uT2JqLlNlbGVjdGlvbnMgJiYgISFqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZighIWpzb25PYmouUkVDSVBFUyAmJiAhIWpzb25PYmouUkVDSVBFUy5SRUNJUEUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZighIXJlY2lwZS5vZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKCEhcmVjaXBlLmZnKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChncmFpbi5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogZ3JhaW4ubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChncmFpbi5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChob3AuYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBob3AubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChob3AuYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5wa2coKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucGtnID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuZ3JhaW5zKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKHtcbiAgICAgIGFuaW1hdGVkOiAnZmFkZScsXG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgICBodG1sOiB0cnVlXG4gICAgfSk7XG4gICAgaWYoJCgnI2dpdGNvbW1pdCBhJykudGV4dCgpICE9ICdnaXRfY29tbWl0Jyl7XG4gICAgICAkKCcjZ2l0Y29tbWl0Jykuc2hvdygpO1xuICAgIH1cbiAgICAkc2NvcGUuc2hvd1NldHRpbmdzID0gISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUsIGxvY2F0aW9uKXtcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzID0gZnVuY3Rpb24ocmVzcG9uc2UsIGVycm9yKXtcbiAgICB2YXIgYXJkdWlubyA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywge2lkOiByZXNwb25zZS5rZXR0bGUuYXJkdWluby5pZH0pO1xuICAgIGlmKGFyZHVpbm8ubGVuZ3RoKXtcbiAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICBhcmR1aW5vWzBdLnZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIGlmKGVycm9yKVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9IGVycm9yO1xuICAgICAgZWxzZVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2Upe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgLy8gbmVlZGVkIGZvciBjaGFydHNcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlLm5hbWU7XG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vdXBkYXRlIGRhdGF0eXBlXG4gICAgcmVzcG9uc2UudGVtcCA9IHBhcnNlRmxvYXQocmVzcG9uc2UudGVtcCk7XG4gICAgcmVzcG9uc2UucmF3ID0gcGFyc2VGbG9hdChyZXNwb25zZS5yYXcpO1xuICAgIGlmKHJlc3BvbnNlLnZvbHRzKVxuICAgICAgcmVzcG9uc2Uudm9sdHMgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnZvbHRzKTtcblxuICAgIGlmKCEha2V0dGxlLnRlbXAuY3VycmVudClcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLDIpO1xuICAgIC8vIGFkZCBhZGp1c3RtZW50XG4gICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgIT0gJ0JNUDE4MCcgJiZcbiAgICAgICFrZXR0bGUudGVtcC52b2x0cyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnJhdyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgJiZcbiAgICAgIHJlc3BvbnNlLnRlbXAgPT0gLTEyNyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyByZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXMuc2hpZnQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUIHNlbnNvcnMgaGF2ZSBodW1pZGl0eSBhcyBhIHBlcmNlbnRcbiAgICAvL1NvaWxNb2lzdHVyZUQgaGFzIG1vaXN0dXJlIGFzIGEgcGVyY2VudFxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUucGVyY2VudCA9IHJlc3BvbnNlLnBlcmNlbnQ7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoLWFsdCcpKSBidG4gPSBidG4ucGFyZW50KCk7XG5cbiAgICBpZighYnRuLmhhc0NsYXNzKCdidG4tZGFuZ2VyJykpe1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tbGlnaHQnKS5hZGRDbGFzcygnYnRuLWRhbmdlcicpO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAgfSwyMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVBXTSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUucHdtID0gIWtldHRsZS5wd207XG4gICAgICBpZihrZXR0bGUucHdtKVxuICAgICAgICBrZXR0bGUuc3NyID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlS2V0dGxlID0gZnVuY3Rpb24oaXRlbSwga2V0dGxlKXtcblxuICAgIHZhciBrO1xuXG4gICAgc3dpdGNoIChpdGVtKSB7XG4gICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgayA9IGtldHRsZS5oZWF0ZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgIGsgPSBrZXR0bGUuY29vbGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICBrID0ga2V0dGxlLnB1bXA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmKCFrKVxuICAgICAgcmV0dXJuO1xuXG4gICAgay5ydW5uaW5nID0gIWsucnVubmluZztcblxuICAgIGlmKGtldHRsZS5hY3RpdmUgJiYgay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYoIWsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5oYXNTa2V0Y2hlcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgdmFyIGhhc0FTa2V0Y2ggPSBmYWxzZTtcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHxcbiAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMpXG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycyA9IHt9O1xuICAgIC8vIGFwcGVuZCBlc3AgdHlwZVxuICAgIGlmKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xKVxuICAgICAgc2tldGNoTmFtZSArPSAkc2NvcGUuZXNwLnR5cGU7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vID8ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpIDogJ0RlZmF1bHQnO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6IGFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIHR5cGU6IHNrZXRjaE5hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlLFxuICAgICAgICAgIGJmOiAoc2tldGNoTmFtZS5pbmRleE9mKCdCRicpICE9PSAtMSkgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIWtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJiAkc2NvcGUuZXNwLmF1dG9jb25uZWN0KXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBdXRvQ29ubmVjdC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xIHx8IEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSkgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZWVnZWUtdG9reW8vREhUZXNwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpO1xuICAgICAgfSBlbHNlIGlmKCFCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRsaWItMS4yLjkuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRTMThCMjAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDE4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYWRhZnJ1aXQvQWRhZnJ1aXRfQURTMVgxNScpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCB0aGUgYWN0aW9ucyBjb21tYW5kXG4gICAgICB2YXIga2V0dGxlVHlwZSA9IGtldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZiAoa2V0dGxlLnRlbXAudmNjKVxuICAgICAgICBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIFxuICAgICAgaWYgKGtldHRsZS50ZW1wLmluZGV4KSBrZXR0bGVUeXBlICs9ICctJyArIGtldHRsZS50ZW1wLmluZGV4OyAgICAgIFxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgYWN0aW9uc0NvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBkZWxheSg1MDApOycpO1xuICAgICAgXG4gICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGtldHRsZS5wZXJjZW50KSB7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNQZXJjZW50Q29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnLUh1bWlkaXR5XCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTsgICAgICAgIFxuICAgICAgfVxuICAgICAgXG4gICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYgKHNrZXRjaC50cmlnZ2VycyB8fCBza2V0Y2guYmYpIHtcbiAgICAgICAgaWYgKHNrZXRjaC50eXBlLmluZGV4T2YoJ001JykgPT09IC0xKSB7XG4gICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7Jyk7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZikge1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgYW1iaWVudCA9IDAuMDA7Jyk7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCBodW1pZGl0eSA9IDAuMDA7Jyk7XG4gICAgICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdjb25zdCBTdHJpbmcgZXF1aXBtZW50X25hbWUgPSBcIicrJHNjb3BlLnNldHRpbmdzLmJmLm5hbWUrJ1wiOycpOyAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kIFxuICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IHNrZXRjaC5hY3Rpb25zLmxlbmd0aDsgYSsrKXtcbiAgICAgICAgICBpZiAoc2tldGNoLmJmICYmIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h1bWlkaXR5JykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAvLyBCRiBsb2dpY1xuICAgICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zUGVyY2VudENvbW1hbmQoJywgJ2h1bWlkaXR5ID0gYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2tldGNoLmJmICYmIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xICYmXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYW1iaWVudCcpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywgJ2FtYmllbnQgPSBhY3Rpb25zQ29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyBBbGwgb3RoZXIgbG9naWNcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICd0ZW1wID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignU3RyZWFtcycgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIHN0cmVhbXMgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGBodHRwczovLyR7JHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9Lmhvc3RlZC5icmV3YmVuY2guY29gO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NUUkVBTVNfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1RSRUFNU19BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5LnRyaW0oKSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdCRll1bicgKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGJmIGFwaSBrZXkgaGVhZGVyXG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQkZfQVVUSFxcXS9nLCAnWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5iZi5hcGlfa2V5LnRyaW0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy9iYnAnO1xuICAgICAgICAgICAgaWYoc2tldGNoLmluZGV4T2YoJ0VTUCcpICE9PSAtMSl7XG4gICAgICAgICAgICAgIC8vIGRvZXMgbm90IHN1cHBvcnQgaHR0cHNcbiAgICAgICAgICAgICAgaWYoY29ubmVjdGlvbl9zdHJpbmcuaW5kZXhPZignaHR0cHM6JykgPT09IDApXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgPSBjb25uZWN0aW9uX3N0cmluZy5yZXBsYWNlKCdodHRwczonLCdodHRwOicpO1xuICAgICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csIGJ0b2EoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpKTtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVBJX0tFWVxcXS9nLCAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpKTtcbiAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMgPSAnICBwLmFkZFBhcmFtZXRlcihGKFwiLUhcIikpO1xcbic7XG4gICAgICAgICAgICAgIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMgKz0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIlgtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcysnXCIpKTsnO1xuICAgICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKCcvLyBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zJywgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKCAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgICAvLyBhZGQgdXNlci9wYXNzXG4gICAgICAgICAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAgICAgICAgIC8vIGFkZCBkYlxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuVEhDKSB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIFRIQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpICE9PSAtMSB8fCBoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERIVCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBBREMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBCTVAxODAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoYXNUcmlnZ2Vycyl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy0nKyRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24rJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLm5vdGlmeSA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSAoa2V0dGxlICYmIGtldHRsZS50ZW1wKSA/IGtldHRsZS50ZW1wLmN1cnJlbnQgOiAwO1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoa2V0dGxlICYmICEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgaWYoISF0aW1lcil7IC8va2V0dGxlIGlzIGEgdGltZXIgb2JqZWN0XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGltZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZih0aW1lci51cClcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHRpbWVycyBhcmUgZG9uZSc7XG4gICAgICBlbHNlIGlmKCEhdGltZXIubm90ZXMpXG4gICAgICAgIG1lc3NhZ2UgPSAnVGltZSB0byBhZGQgJyt0aW1lci5ub3RlcysnIG9mICcrdGltZXIubGFiZWw7XG4gICAgICBlbHNlXG4gICAgICAgIG1lc3NhZ2UgPSAnVGltZSB0byBhZGQgJyt0aW1lci5sYWJlbDtcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmhpZ2gpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmhpZ2ggfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2hpZ2gnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgY29sb3IgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2hpZ2gnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUubG93KXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sb3cgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2xvdycpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBsb3cnO1xuICAgICAgY29sb3IgPSAnIzM0OThEQic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdsb3cnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGFyZ2V0IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSd0YXJnZXQnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2N1cnJlbnRWYWx1ZSt1bml0VHlwZTtcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0ndGFyZ2V0JztcbiAgICB9XG4gICAgZWxzZSBpZigha2V0dGxlKXtcbiAgICAgIG1lc3NhZ2UgPSAnVGVzdGluZyBBbGVydHMsIHlvdSBhcmUgcmVhZHkgdG8gZ28sIGNsaWNrIHBsYXkgb24gYSBrZXR0bGUuJztcbiAgICB9XG5cbiAgICAvLyBNb2JpbGUgVmlicmF0ZSBOb3RpZmljYXRpb25cbiAgICBpZiAoXCJ2aWJyYXRlXCIgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3IudmlicmF0ZShbNTAwLCAzMDAsIDUwMF0pO1xuICAgIH1cblxuICAgIC8vIFNvdW5kIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zb3VuZHMub249PT10cnVlKXtcbiAgICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICAgIGlmKCEhdGltZXIgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKCghIXRpbWVyKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgbWVhc3VyZWQgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgJiYga2V0dGxlLm1lc3NhZ2UudHlwZSA9PSAnZGFuZ2VyJyl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfVxuICAgIC8vaXMgY3VycmVudFZhbHVlIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjEpJztcbiAgICAgIGtldHRsZS5oaWdoID0gY3VycmVudFZhbHVlLWtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoY3VycmVudFZhbHVlIDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC41KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuMSknO1xuICAgICAga2V0dGxlLmxvdyA9IGtldHRsZS50ZW1wLnRhcmdldC1jdXJyZW50VmFsdWU7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBsb3cnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjEpJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICd3aXRoaW4gdGFyZ2V0JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZUtldHRsZVR5cGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIC8vZG9uJ3QgYWxsb3cgY2hhbmdpbmcga2V0dGxlcyBvbiBzaGFyZWQgc2Vzc2lvbnNcbiAgICAvL3RoaXMgY291bGQgYmUgZGFuZ2Vyb3VzIGlmIGRvaW5nIHRoaXMgcmVtb3RlbHlcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpXG4gICAgICByZXR1cm47XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUubmFtZSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAudGFyZ2V0KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuY3VycmVudCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAubWVhc3VyZWQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnByZXZpb3VzLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLnRhcmdldCwwKTtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC5hZGp1c3Qpe1xuICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgICAgICBpZih1bml0ID09PSAnQycpXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCoxLjgsMCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGNoYXJ0IHZhbHVlc1xuICAgICAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmVhY2goa2V0dGxlLnZhbHVlcywgKHYsIGkpID0+IHtcbiAgICAgICAgICAgICAga2V0dGxlLnZhbHVlc1tpXSA9IFtrZXR0bGUudmFsdWVzW2ldWzBdLCRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudmFsdWVzW2ldWzFdLHVuaXQpXTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUga25vYlxuICAgICAgICBrZXR0bGUua25vYi52YWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKzEwO1xuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydCwgc2Vzc2lvbjogJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbn0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoICEha2V0dGxlICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZighIWtldHRsZSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZUtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSwkaW5kZXgpe1xuICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgJHNjb3BlLmtldHRsZXMuc3BsaWNlKCRpbmRleCwxKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICBpZihmaWVsZCA9PSAnYWRqdXN0Jyl7XG4gICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICB9XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS51cGRhdGVTdHJlYW1zID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL3VwZGF0ZSBzdHJlYW1zXG4gICAgaWYoJHNjb3BlLnN0cmVhbXMuY29ubmVjdGVkKCkgJiYga2V0dGxlLm5vdGlmeS5zdHJlYW1zKXtcbiAgICAgICRzY29wZS5zdHJlYW1zLmtldHRsZXMoa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKCEhbG9hZGVkKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcblxuICAvLyB1cGRhdGUgbG9jYWwgY2FjaGVcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsID0gZnVuY3Rpb24oKXtcbiAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJywgJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJywkc2NvcGUua2V0dGxlcyk7XG4gICAgICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbiAgICB9LDUwMDApO1xuICB9XG4gICRzY29wZS51cGRhdGVMb2NhbCgpO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gISFzY29wZS50eXBlID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cblx0XHRcdGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKG9uQ2hhbmdlRXZlbnQpIHtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgZWxlbWVudC52YWwobnVsbCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICBjZWxzaXVzID0gcGFyc2VGbG9hdChjZWxzaXVzKTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKShjZWxzaXVzKjkvNSszMiwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgZmFocmVuaGVpdCA9IHBhcnNlRmxvYXQoZmFocmVuaGVpdCk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoKGZhaHJlbmhlaXQtMzIpKjUvOSwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdyb3VuZCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbCxkZWNpbWFscykge1xuICAgIHJldHVybiBOdW1iZXIoKE1hdGgucm91bmQodmFsICsgXCJlXCIgKyBkZWNpbWFscykgICsgXCJlLVwiICsgZGVjaW1hbHMpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0aXRsZWNhc2UnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQpe1xuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRleHQuc2xpY2UoMSkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2RibVBlcmNlbnQnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRibSl7XG4gICAgcmV0dXJuIDIgKiAoZGJtICsgMTAwKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMzUuMjc0LCAyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24gKGtnKSB7XG4gICAgaWYgKHR5cGVvZiBrZyA9PT0gJ3VuZGVmaW5lZCcgfHwgaXNOYU4oa2cpKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGtnICogMi4yMDQ2MiwgMik7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NoYXJlJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnYWNjZXNzVG9rZW4nKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYWNjZXNzVG9rZW46IGZ1bmN0aW9uKHRva2VuKXtcbiAgICAgIGlmKHRva2VuKVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NUb2tlbicsdG9rZW4pO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZ2VuZXJhbDoge2RlYnVnOiBmYWxzZSwgcG9sbFNlY29uZHM6IDEwLCB1bml0OiAnRicsIHNoYXJlZDogZmFsc2V9XG4gICAgICAgICxjaGFydDoge3Nob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2V9XG4gICAgICAgICxzZW5zb3JzOiB7REhUOiBmYWxzZSwgRFMxOEIyMDogZmFsc2UsIEJNUDogZmFsc2V9XG4gICAgICAgICxyZWNpcGU6IHsnbmFtZSc6JycsJ2JyZXdlcic6e25hbWU6JycsJ2VtYWlsJzonJ30sJ3llYXN0JzpbXSwnaG9wcyc6W10sJ2dyYWlucyc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhcmR1aW5vczogW3tpZDonbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSxib2FyZDonJyxSU1NJOmZhbHNlLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2UsdmVyc2lvbjonJyxzdGF0dXM6e2Vycm9yOicnLGR0OicnLG1lc3NhZ2U6Jyd9fV1cbiAgICAgICAgLHRwbGluazoge3VzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46JycsIHN0YXR1czogJycsIHBsdWdzOiBbXX1cbiAgICAgICAgLGluZmx1eGRiOiB7dXJsOiAnJywgcG9ydDogJycsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6W10sIHN0YXR1czogJyd9XG4gICAgICAgICxzdHJlYW1zOiB7dXNlcm5hbWU6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJywgc2Vzc2lvbjoge2lkOiAnJywgbmFtZTogJycsIHR5cGU6ICdmZXJtZW50YXRpb24nfX1cbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5hbWU6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDEyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMzMnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQ0NCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ1NvaWxNb2lzdHVyZScsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIHZjYzogdHJ1ZSwgcGVyY2VudDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdCTVAxODAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICB2YXIga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonVGVtcCcsJ3R5cGUnOidhaXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonU29pbCcsJ3R5cGUnOidzZWVkbGluZycsJ3RhcmdldCc6NjAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidQbGFudCcsJ3R5cGUnOidjYW5uYWJpcycsJ3RhcmdldCc6NjAsJ2RpZmYnOjJ9XG4gICAgICBdO1xuICAgICAgaWYodHlwZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGtldHRsZXMsIHsndHlwZSc6IHR5cGV9KVswXTtcbiAgICAgIHJldHVybiBrZXR0bGVzO1xuICAgIH0sXG5cbiAgICBkb21haW46IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBkb21haW4gPSAnaHR0cDovL2FyZHVpbm8ubG9jYWwnO1xuXG4gICAgICBpZihhcmR1aW5vICYmIGFyZHVpbm8udXJsKXtcbiAgICAgICAgZG9tYWluID0gKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykgIT09IC0xKSA/XG4gICAgICAgICAgYXJkdWluby51cmwuc3Vic3RyKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykrMikgOlxuICAgICAgICAgIGFyZHVpbm8udXJsO1xuXG4gICAgICAgIGlmKCEhYXJkdWluby5zZWN1cmUpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgaXNFU1A6IGZ1bmN0aW9uKGFyZHVpbm8sIHJldHVybl92ZXJzaW9uKXtcbiAgICAgIGlmKHJldHVybl92ZXJzaW9uKXtcbiAgICAgICAgaWYoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzMyJykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnMzInO1xuICAgICAgICBlbHNlIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCc4MjY2JykgIT09IC0xKVxuICAgICAgICAgIHJldHVybiAnODI2Nic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gISEoYXJkdWlubyAmJiBhcmR1aW5vLmJvYXJkICYmIChhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZXNwJykgIT09IC0xIHx8IGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub2RlbWN1JykgIT09IC0xKSk7XG4gICAgfSxcblxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgdmFyIHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKGFyZHVpbm8sIGVuZHBvaW50KXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihhcmR1aW5vKSsnL2FyZHVpbm8vJytlbmRwb2ludDtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKVxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKSA9PT0gMClcbiAgICAgICAgICB1cmwgKz0gJz9hcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdXJsICs9ICc/ZHBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZkcGluPScra2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKCEha2V0dGxlLnRlbXAuaW5kZXgpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLnZjYyAmJiBbJzNWJywnNVYnXS5pbmRleE9mKGtldHRsZS50ZW1wLnZjYykgPT09IC0xKSAvL1NvaWxNb2lzdHVyZSBsb2dpY1xuICAgICAgICAgIHVybCArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICAgIGVsc2UgaWYoISFrZXR0bGUudGVtcC5pbmRleCkgLy9EUzE4QjIwIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmaW5kZXg9JytrZXR0bGUudGVtcC5pbmRleDtcbiAgICAgICAgdXJsICs9ICcvJytrZXR0bGUudGVtcC5waW47XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9hcGluPScrc2Vuc29yKycmdmFsdWU9Jyt2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIHZhciBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmluZmx1eGRiO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnRwbGluaztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnNrZXRjaGVzO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkd2VldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYXRlc3Q6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9sYXRlc3QvZHdlZXQvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9kd2VldHMvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgc3RyZWFtczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEvYXBpJywgaGVhZGVyczoge30sIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAocGluZykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiYgc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAocGluZykgPyAnL3VzZXJzL3BpbmcnIDogJy91c2Vycy9hdXRoJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9J2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1LZXknXSA9IGAke3NldHRpbmdzLnN0cmVhbXMuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUJCLVVzZXInXSA9IGAke3NldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9YDtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKVxuICAgICAgICAgICAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbihyZXNwb25zZS5kYXRhLmFjY2Vzcy5pZCk7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVqZWN0KGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAga2V0dGxlczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNhdmU6IGFzeW5jIChrZXR0bGUpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cGRhdGVkS2V0dGxlID0gYW5ndWxhci5jb3B5KGtldHRsZSk7XG4gICAgICAgICAgICAvLyByZW1vdmUgbm90IG5lZWRlZCBkYXRhXG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS52YWx1ZXM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5tZXNzYWdlO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudGltZXJzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUua25vYjtcbiAgICAgICAgICAgIHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QgPSAoc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISF1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykodXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMvYXJtJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uOiBzZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sXG4gICAgICAgICAgICAgIGtldHRsZTogdXBkYXRlZEtldHRsZSxcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczogc2V0dGluZ3Mubm90aWZpY2F0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uSWQ6IHNlc3Npb25JZCxcbiAgICAgICAgICAgICAga2V0dGxlOiBrZXR0bGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNhdmU6IGFzeW5jIChzZXNzaW9uKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zLycrc2Vzc2lvbi5pZDtcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BBVENIJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgbmFtZTogc2Vzc2lvbi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlOiBzZXNzaW9uLnR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwKXtcbiAgICAgICAgIGF2ZXJhZ2UgPSAoYXZlcmFnZSAqICg1LjAgLyA2NTUzNSkpIC8gMC4wMDAxO1xuICAgICAgICAgdmFyIGxuID0gTWF0aC5sb2coYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMKTtcbiAgICAgICAgIHZhciBrZWx2aW4gPSAxIC8gKDAuMDAzMzU0MDE3MCArICgwLjAwMDI1NjE3MjQ0ICogbG4pICsgKDAuMDAwMDAyMTQwMDk0MyAqIGxuICogbG4pICsgKC0wLjAwMDAwMDA3MjQwNTIxOSAqIGxuICogbG4gKiBsbikpO1xuICAgICAgICAgIC8vIGtlbHZpbiB0byBjZWxzaXVzXG4gICAgICAgICByZXR1cm4ga2VsdmluIC0gMjczLjE1O1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgICAgYXZlcmFnZSA9IFNFUklFU1JFU0lTVE9SIC8gYXZlcmFnZTtcblxuICAgICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0IC89IEJDT0VGRklDSUVOVDsgICAgICAgICAgICAgICAgICAgLy8gMS9CICogbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgICAgc3RlaW5oYXJ0IC09IDI3My4xNTtcbiAgICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgICAgfVxuICAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnKXtcbiAgICAgICBpZiAoa2V0dGxlLnRlbXAucmF3ICYmIGtldHRsZS50ZW1wLnJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKGtldHRsZS50ZW1wLnJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKCEhc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCAmJiAhdGhpcy5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaG9zdGVkOiAodXJsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuICh1cmwuaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEgfHxcbiAgICAgICAgICAgIHVybC5pbmRleE9mKCdob3N0ZWQuYnJld2JlbmNoLmNvJykgIT09IC0xKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKCAhIWluZmx1eGRiLnBvcnQgJiYgIXRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpXG4gICAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke2luZmx1eGRiLnBvcnR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259YCwgbWV0aG9kOiAnR0VUJ307XG4gICAgICAgICAgaWYodGhpcy5pbmZsdXhkYigpLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCA9IGAke2luZmx1eENvbm5lY3Rpb259L3BpbmdgO1xuICAgICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXNlciAmJiBpbmZsdXhkYi5wYXNzKXtcbiAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKGluZmx1eGRiLnVzZXIudHJpbSgpKyc6JytpbmZsdXhkYi5wYXNzLnRyaW0oKSl9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKHNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6JytzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKSl9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgaWYodGhpcy5pbmZsdXhkYigpLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSl7XG4gICAgICAgICAgICBxLnJlc29sdmUoW3NldHRpbmdzLmluZmx1eGRiLnVzZXJdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdzaG93IGRhdGFiYXNlcycpfWAsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzICl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgaWYodGhpcy5pbmZsdXhkYigpLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCgnRGF0YWJhc2UgYWxyZWFkeSBleGlzdHMnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKX0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcGtnOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGdyYWluczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ncmFpbnMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBob3BzOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2hvcHMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB3YXRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS93YXRlci5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHN0eWxlczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3N0eWxlZ3VpZGUuanNvbicpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG92aWJvbmQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvbG92aWJvbmQuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjaGFydE9wdGlvbnM6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpbmVDaGFydCcsXG4gICAgICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlOiAhIW9wdGlvbnMuc2Vzc2lvbixcbiAgICAgICAgICAgICAgICB0ZXh0OiAhIW9wdGlvbnMuc2Vzc2lvbiA/IG9wdGlvbnMuc2Vzc2lvbiA6ICcnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBNb25pdG9yJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGU6ICdiYXNpcycsXG4gICAgICAgICAgICAgIGxlZ2VuZDoge1xuICAgICAgICAgICAgICAgIGtleTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlzQXJlYTogZnVuY3Rpb24gKGQpIHsgcmV0dXJuICEhb3B0aW9ucy5jaGFydC5hcmVhIH0sXG4gICAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZighIW9wdGlvbnMuY2hhcnQubWlsaXRhcnkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVIOiVNOiVTJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUyVwJykobmV3IERhdGUoZCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnYm90dG9tJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tQYWRkaW5nOiAyMCxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiA0MCxcbiAgICAgICAgICAgICAgICAgIHN0YWdnZXJMYWJlbHM6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZm9yY2VZOiAoIW9wdGlvbnMudW5pdCB8fCBvcHRpb25zLnVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGQsMCkrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uKHBsYXRvKXtcbiAgICAgIHZhciBzZyA9ICggMSArIChwbGF0byAvICgyNTguNiAtICggKHBsYXRvLzI1OC4yKSAqIDIyNy4xKSApICkgKS50b0ZpeGVkKDMpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpO1xuICAgIH0sXG4gICAgcGxhdG86IGZ1bmN0aW9uKHNnKXtcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZighIXJlY2lwZS5GX1JfTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5GX1JfTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkZfUl9CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYsMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pe1xuICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4sZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5GX0dfTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoZ3JhaW4uRl9HX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5GX0dfQU1PVU5UKSsnIGxiJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5GX0dfQU1PVU5UKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVCkrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0Lmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5GX1lfTEFCKycgJysoeWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX0xBQisnICcrXG4gICAgICAgICAgICAgIChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyWE1MOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIHZhciBtYXNoX3RpbWUgPSA2MDtcblxuICAgICAgaWYoISFyZWNpcGUuTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgIC8vICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkJSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUFYKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01JTilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NSU4sMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAgJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAubGVuZ3RoICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuRkVSTUVOVEFCTEVTKXtcbiAgICAgICAgdmFyIGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uQU1PVU5UKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICB2YXIgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5USU1FLzYwLzI0LDEwKSsnIERheXMnXG4gICAgICAgICAgICAgIDogaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9