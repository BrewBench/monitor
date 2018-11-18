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
    type: '8266',
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
    if (kettle.temp.volts) {
      if (kettle.temp.type == 'Thermistor' && kettle.temp.pin.indexOf('A') === 0 && !BrewService.isESP(kettle.arduino) && kettle.temp.volts < 2) {
        $scope.setErrorMessage('Sensor is not connected', kettle);
        return;
      }
    } else if (kettle.temp.type != 'BMP180' && !kettle.temp.volts && !kettle.temp.raw) {
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
      arduinoName = kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, "");
      var currentSketch = _.find(sketches, { name: arduinoName });
      if (!currentSketch) {
        sketches.push({
          name: arduinoName,
          actions: [],
          headers: [],
          triggers: false
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
      var kettleType = kettle.temp.type;
      if (kettle.temp.vcc) kettleType += kettle.temp.vcc;
      if (kettle.temp.index) kettleType += '-' + kettle.temp.index;
      currentSketch.actions.push('  actionsCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettleType + '"),' + adjust + ');');
      currentSketch.actions.push('  delay(500);');
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
      if (sketch.triggers) {
        sketch.actions.unshift('float temp = 0.00;');
        // update autoCommand
        for (var a = 0; a < sketch.actions.length; a++) {
          if (sketches[i].actions[a].indexOf('actionsCommand(') !== -1) sketches[i].actions[a] = sketches[i].actions[a].replace('actionsCommand(', 'temp = actionsCommand(');
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
      }if (sketch.indexOf('InfluxDB') !== -1) {
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

  $(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip({
      animated: 'fade',
      placement: 'right',
      html: true
    });
  });
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
      return !!(arduino.board && (arduino.board.toLowerCase().indexOf('esp') !== -1 || arduino.board.toLowerCase().indexOf('nodemcu') !== -1));
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
            notes: $filter('number')(grain.F_G_AMOUNT / 16, 2) + ' lbs.',
            amount: $filter('number')(grain.F_G_AMOUNT / 16, 2)
          });
        });
      }

      if (!!recipe.Ingredients.Data.Hops) {
        _.each(recipe.Ingredients.Data.Hops, function (hop) {
          response.hops.push({
            label: hop.F_H_NAME,
            min: parseInt(hop.F_H_DRY_HOP_TIME, 10) > 0 ? null : parseInt(hop.F_H_BOIL_TIME, 10),
            notes: parseInt(hop.F_H_DRY_HOP_TIME, 10) > 0 ? 'Dry Hop ' + $filter('number')(hop.F_H_AMOUNT, 2) + ' oz.' + ' for ' + parseInt(hop.F_H_DRY_HOP_TIME, 10) + ' Days' : $filter('number')(hop.F_H_AMOUNT, 2) + ' oz.',
            amount: $filter('number')(hop.F_H_AMOUNT, 2)
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
            notes: $filter('number')(grain.AMOUNT, 2) + ' lbs.',
            amount: $filter('number')(grain.AMOUNT, 2)
          });
        });
      }

      if (!!recipe.HOPS) {
        var hops = recipe.HOPS.HOP && recipe.HOPS.HOP.length ? recipe.HOPS.HOP : recipe.HOPS;
        _.each(hops, function (hop) {
          response.hops.push({
            label: hop.NAME + ' (' + hop.FORM + ')',
            min: hop.USE == 'Dry Hop' ? 0 : parseInt(hop.TIME, 10),
            notes: hop.USE == 'Dry Hop' ? hop.USE + ' ' + $filter('number')(hop.AMOUNT * 1000 / 28.3495, 2) + ' oz.' + ' for ' + parseInt(hop.TIME / 60 / 24, 10) + ' Days' : hop.USE + ' ' + $filter('number')(hop.AMOUNT * 1000 / 28.3495, 2) + ' oz.',
            amount: $filter('number')(hop.AMOUNT * 1000 / 28.3495, 2)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXJkdWlub19wYXNzIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0Iiwic2Vzc2lvbiIsInN0cmVhbXMiLCJkZWZhdWx0S2V0dGxlcyIsInNoYXJlIiwicGFyYW1zIiwiZmlsZSIsInBhc3N3b3JkIiwibmVlZFBhc3N3b3JkIiwiYWNjZXNzIiwiZGVsZXRlQWZ0ZXIiLCJvcGVuU2tldGNoZXMiLCIkIiwibW9kYWwiLCJzdW1WYWx1ZXMiLCJvYmoiLCJzdW1CeSIsInVwZGF0ZUFCViIsInJlY2lwZSIsInNjYWxlIiwibWV0aG9kIiwiYWJ2Iiwib2ciLCJmZyIsImFidmEiLCJhYnciLCJhdHRlbnVhdGlvbiIsInBsYXRvIiwiY2Fsb3JpZXMiLCJyZSIsInNnIiwiY2hhbmdlTWV0aG9kIiwiY2hhbmdlU2NhbGUiLCJnZXRTdGF0dXNDbGFzcyIsInN0YXR1cyIsImVuZHNXaXRoIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsIlJTU0kiLCJhbmFsb2ciLCJkaWdpdGFsIiwiYWRjIiwic2VjdXJlIiwidmVyc2lvbiIsImR0IiwiZWFjaCIsImFyZHVpbm8iLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJjb25uZWN0IiwidGhlbiIsImluZm8iLCJCcmV3QmVuY2giLCJldmVudCIsInNyY0VsZW1lbnQiLCJpbm5lckhUTUwiLCJ0b3VjaCIsImNhdGNoIiwiZXJyIiwicmVib290IiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInJlc3BvbnNlIiwidG9rZW4iLCJzY2FuIiwic2V0RXJyb3JNZXNzYWdlIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInJlc3BvbnNlRGF0YSIsIkpTT04iLCJwYXJzZSIsInN5c3RlbSIsImdldF9zeXNpbmZvIiwiZW1ldGVyIiwiZ2V0X3JlYWx0aW1lIiwiZXJyX2NvZGUiLCJwb3dlciIsImRldmljZSIsInRvZ2dsZSIsIm9mZk9yT24iLCJyZWxheV9zdGF0ZSIsImFkZEtldHRsZSIsImZpbmQiLCJzdGlja3kiLCJwaW4iLCJhdXRvIiwiZHV0eUN5Y2xlIiwic2tldGNoIiwidGVtcCIsInZjYyIsImhpdCIsIm1lYXN1cmVkIiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwicmF3Iiwidm9sdHMiLCJ2YWx1ZXMiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsImlzRVNQIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjaGFuZ2VTZW5zb3IiLCJzZW5zb3JUeXBlcyIsInBlcmNlbnQiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJicmV3YmVuY2hIb3N0ZWQiLCJob3N0ZWQiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYiIsImRicyIsImNvbmNhdCIsImFwcGx5IiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJ1c2VybmFtZSIsImFwaV9rZXkiLCJhdXRoIiwicmVsYXkiLCJzYXZlIiwia2V0dGxlUmVzcG9uc2UiLCJtZXJnZSIsImNvbnNvbGUiLCJzZXNzaW9ucyIsInNoYXJlQWNjZXNzIiwic2hhcmVkIiwiZnJhbWVFbGVtZW50IiwibG9hZFNoYXJlRmlsZSIsImNvbnRlbnRzIiwibm90aWZpY2F0aW9ucyIsIm9uIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJsYWJlbCIsImFtb3VudCIsImFkZFRpbWVyIiwibm90ZXMiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwidXBkYXRlQXJkdWlub1N0YXR1cyIsImRvbWFpbiIsInNrZXRjaF92ZXJzaW9uIiwidXBkYXRlVGVtcCIsImtleSIsInRlbXBzIiwic2hpZnQiLCJhbHRpdHVkZSIsInByZXNzdXJlIiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIk1hdGgiLCJyb3VuZCIsIm9mZiIsImltcG9ydFNldHRpbmdzIiwicHJvZmlsZUNvbnRlbnQiLCJleHBvcnRTZXR0aW5ncyIsImkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjb21waWxlU2tldGNoIiwic2tldGNoTmFtZSIsInNlbnNvcnMiLCJza2V0Y2hlcyIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImFjdGlvbnMiLCJ0cmlnZ2VycyIsIkRIVCIsIkRTMThCMjAiLCJCTVAiLCJrZXR0bGVUeXBlIiwidW5zaGlmdCIsImEiLCJkb3dubG9hZFNrZXRjaCIsImhhc1RyaWdnZXJzIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImF1dG9nZW4iLCJnZXQiLCJqb2luIiwibWQ1IiwiY29ubmVjdGlvbl9zdHJpbmciLCJ0cmltIiwiYWRkaXRpb25hbF9wb3N0X3BhcmFtcyIsInBvcnQiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwic3R5bGUiLCJkaXNwbGF5IiwiYm9keSIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmVDaGlsZCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsImFsZXJ0IiwicGxheSIsImNsb3NlIiwiTm90aWZpY2F0aW9uIiwicGVybWlzc2lvbiIsInJlcXVlc3RQZXJtaXNzaW9uIiwidHJhY2tDb2xvciIsImJhckNvbG9yIiwiY2hhbmdlS2V0dGxlVHlwZSIsImtldHRsZUluZGV4IiwiZmluZEluZGV4IiwidXBkYXRlU3RyZWFtcyIsImNoYW5nZVVuaXRzIiwidiIsInRpbWVyUnVuIiwibmV4dFRpbWVyIiwiY2FuY2VsIiwiaW50ZXJ2YWwiLCJhbGxTZW5zb3JzIiwicG9sbFNlY29uZHMiLCJyZW1vdmVLZXR0bGUiLCIkaW5kZXgiLCJjaGFuZ2VWYWx1ZSIsImZpZWxkIiwibG9hZGVkIiwidXBkYXRlTG9jYWwiLCJyZWFkeSIsInRvb2x0aXAiLCJhbmltYXRlZCIsInBsYWNlbWVudCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZGJtIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJhY2Nlc3NUb2tlbiIsInNldEl0ZW0iLCJnZXRJdGVtIiwiZGVidWciLCJzaG93IiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsInJldHVybl92ZXJzaW9uIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJlbmRwb2ludCIsInJlcXVlc3QiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJkaWdpdGFsUmVhZCIsInF1ZXJ5Iiwic2giLCJsYXRlc3QiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsInVwZGF0ZWRLZXR0bGUiLCJzZXNzaW9uSWQiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsImxuIiwibG9nIiwia2VsdmluIiwic3RlaW5oYXJ0IiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0Ms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QyxHQUFHLEdBQWxCLEVBbFFjLEVBbVFkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBblFjLEVBb1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFFjLEVBcVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclFjLEVBc1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFFjLEVBdVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlFjLEVBd1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFFjLEVBeVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFj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ZixFQWhmYyxFQWlmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWpmYyxFQWtmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWxmYyxFQW1mZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuZmMsRUFvZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGZjLEVBcWZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJmYyxFQXNmZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0ZmMsRUF1ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBampCLFFBQUVtRSxJQUFGLENBQU80ZSxTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRbGpCLE9BQVIsQ0FBZ0JzakIsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVFuakIsT0FBUixDQUFnQjhZLE9BQU95SyxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQTlxREksR0FBUDtBQWdyREQsQ0FuckRELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6TW9kdWxlJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGw7XG52YXIgcmVzZXRDaGFydCA9IDEwMDtcbnZhciB0aW1lb3V0ID0gbnVsbDsgLy9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogISEoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnODI2NicsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJ2JiZXNwJyxcbiAgYXJkdWlub19wYXNzOiAnYmJhZG1pbicsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLm9wZW5Ta2V0Y2hlcyA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzZXR0aW5nc01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgJCgnI3NrZXRjaGVzTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59O1xuXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS5nZXRTdGF0dXNDbGFzcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIGlmKHN0YXR1cyA9PSAnQ29ubmVjdGVkJylcbiAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICBlbHNlIGlmKF8uZW5kc1dpdGgoc3RhdHVzLCdpbmcnKSlcbiAgICByZXR1cm4gJ3NlY29uZGFyeSc7XG4gIGVsc2VcbiAgICByZXR1cm4gJ2Rhbmdlcic7XG59XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGJvYXJkOiAnJyxcbiAgICAgICAgUlNTSTogZmFsc2UsXG4gICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgZGlnaXRhbDogMTMsXG4gICAgICAgIGFkYzogMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbjogJycsXG4gICAgICAgIHN0YXR1czoge2Vycm9yOiAnJyxkdDogJycsbWVzc2FnZTonJ31cbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnQ29ubmVjdGluZy4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvJylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLkJyZXdCZW5jaCl7XG4gICAgICAgICAgICBldmVudC5zcmNFbGVtZW50LmlubmVySFRNTCA9ICdDb25uZWN0JztcbiAgICAgICAgICAgIGFyZHVpbm8uYm9hcmQgPSBpbmZvLkJyZXdCZW5jaC5ib2FyZDtcbiAgICAgICAgICAgIGlmKGluZm8uQnJld0JlbmNoLlJTU0kpXG4gICAgICAgICAgICAgIGFyZHVpbm8uUlNTSSA9IGluZm8uQnJld0JlbmNoLlJTU0k7XG4gICAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSBpbmZvLkJyZXdCZW5jaC52ZXJzaW9uO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQMzInKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAgICAgIGFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQODI2NicpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAgICAgICAgICAgIGFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ1JlYm9vdGluZy4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdyZWJvb3QnKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ1JlYm9vdCBTdWNjZXNzLCB0cnkgY29ubmVjdGluZyBpbiBhIGZldyBzZWNvbmRzLic7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpZihwa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5tc2cgfHwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ1NjYW5uaW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnNjYW4odG9rZW4pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZihyZXNwb25zZS5kZXZpY2VMaXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoISFwbHVnLnN0YXR1cyl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIHBsdWcuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICB2YXIgb2ZmT3JPbiA9IGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEgPyAwIDogMTtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnRvZ2dsZShkZXZpY2UsIG9mZk9yT24pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IG9mZk9yT247XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pLnRoZW4odG9nZ2xlUmVzcG9uc2UgPT4ge1xuICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmZvXG4gICAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgIGRldmljZS5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFkZEtldHRsZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIGlmKCEkc2NvcGUua2V0dGxlcykgJHNjb3BlLmtldHRsZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGggPyAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF0gOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9O1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiB0eXBlID8gXy5maW5kKCRzY29wZS5rZXR0bGVUeXBlcyx7dHlwZTogdHlwZX0pLm5hbWUgOiAkc2NvcGUua2V0dGxlVHlwZXNbMF0ubmFtZVxuICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiBhcmR1aW5vXG4gICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24oYXJkdWlubywgcGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2UgaWYoQnJld1NlcnZpY2UuaXNFU1AoYXJkdWlubykpe1xuICAgICAgICBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdEJywnR1BJTycpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdBJywnR1BJTycpLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGluO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKFxuICAgICAgICAgIChrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLnRlbXAudmNjPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlU2Vuc29yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbmZsdXhkYiA9IHtcbiAgICBicmV3YmVuY2hIb3N0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5pbmZsdXhkYigpLmhvc3RlZCgkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIgPSBkZWZhdWx0U2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQgfHwgcmVzcG9uc2Uuc3RhdHVzID09IDIwMCl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmRicygpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgICAgdmFyIGRicyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGNyZWF0ZTogKCkgPT4ge1xuICAgICAgdmFyIGRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IGZhbHNlO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5jcmVhdGVEQihkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIC8vIHByb21wdCBmb3IgcGFzc3dvcmRcbiAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9IGRiO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIuc3RhdHVzICYmIChlcnIuc3RhdHVzID09IDQwMSB8fCBlcnIuc3RhdHVzID09IDQwMykpe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgICAgfSBlbHNlIGlmKGVycil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdHJlYW1zID0ge1xuICAgIGNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuICghISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lICYmXG4gICAgICAgICEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJlxuICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPT0gJ0Nvbm5lY3RlZCdcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMgPSBkZWZhdWx0U2V0dGluZ3Muc3RyZWFtcztcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zID0gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5hdXRoKHRydWUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBrZXR0bGVzOiAoa2V0dGxlLCByZWxheSkgPT4ge1xuICAgICAgaWYocmVsYXkpe1xuICAgICAgICBrZXR0bGVbcmVsYXldLnNrZXRjaCA9ICFrZXR0bGVbcmVsYXldLnNrZXRjaDtcbiAgICAgICAgaWYoIWtldHRsZS5ub3RpZnkuc3RyZWFtcylcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9ICdza2V0Y2hlcyc7XG4gICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2luZm8nO1xuICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMDtcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkua2V0dGxlcy5zYXZlKGtldHRsZSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHZhciBrZXR0bGVSZXNwb25zZSA9IHJlc3BvbnNlLmtldHRsZTtcbiAgICAgICAgICAvLyB1cGRhdGUga2V0dGxlIHZhcnNcbiAgICAgICAgICBrZXR0bGUuaWQgPSBrZXR0bGVSZXNwb25zZS5pZDtcbiAgICAgICAgICAvLyB1cGRhdGUgYXJkdWlubyBpZFxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MsIGFyZHVpbm8gPT4ge1xuICAgICAgICAgICAgaWYoYXJkdWluby5pZCA9PSBrZXR0bGUuYXJkdWluby5pZClcbiAgICAgICAgICAgICAgYXJkdWluby5pZCA9IGtldHRsZVJlc3BvbnNlLmRldmljZUlkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmlkID0ga2V0dGxlUmVzcG9uc2UuZGV2aWNlSWQ7XG4gICAgICAgICAgLy8gdXBkYXRlIHNlc3Npb24gdmFyc1xuICAgICAgICAgIF8ubWVyZ2UoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbiwga2V0dGxlUmVzcG9uc2Uuc2Vzc2lvbik7XG5cbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ3N1Y2Nlc3MnO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDI7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyA9ICFrZXR0bGUubm90aWZ5LnN0cmVhbXM7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMTtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLmRhdGEgJiYgZXJyLmRhdGEuZXJyb3IgJiYgZXJyLmRhdGEuZXJyb3IubWVzc2FnZSl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5kYXRhLmVycm9yLm1lc3NhZ2UsIGtldHRsZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdCcmV3QmVuY2ggU3RyZWFtcyBFcnJvcicsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNlc3Npb25zOiB7XG4gICAgICBzYXZlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkuc2Vzc2lvbnMuc2F2ZSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcblxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc2hhcmVBY2Nlc3MgPSBmdW5jdGlvbihhY2Nlc3Mpe1xuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICAgaWYoYWNjZXNzKXtcbiAgICAgICAgICBpZihhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAhISgkc2NvcGUuc2hhcmUuYWNjZXNzICYmICRzY29wZS5zaGFyZS5hY2Nlc3MgPT09IGFjY2Vzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmKGFjY2VzcyAmJiBhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU2hhcmVGaWxlID0gZnVuY3Rpb24oKXtcbiAgICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAgICRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGdyYWluLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoaG9wLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogaG9wLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoaG9wLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTond2F0ZXInfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUubWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBtaXNjLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IG1pc2Mubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUueWVhc3QubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdCA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLnllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogeWVhc3QubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTdHlsZXMgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc3R5bGVzKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnN0eWxlcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkc2NvcGUuc3R5bGVzID0gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjb25maWcgPSBbXTtcbiAgICBpZighJHNjb3BlLnBrZyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkc2NvcGUuc2hvd1NldHRpbmdzID0gISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUsIGxvY2F0aW9uKXtcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzID0gZnVuY3Rpb24ocmVzcG9uc2UsIGVycm9yKXtcbiAgICB2YXIgYXJkdWlubyA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywge2lkOiByZXNwb25zZS5rZXR0bGUuYXJkdWluby5pZH0pO1xuICAgIGlmKGFyZHVpbm8ubGVuZ3RoKXtcbiAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICBhcmR1aW5vWzBdLnZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIGlmKGVycm9yKVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9IGVycm9yO1xuICAgICAgZWxzZVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2Upe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgLy8gbmVlZGVkIGZvciBjaGFydHNcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlLm5hbWU7XG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vdXBkYXRlIGRhdGF0eXBlXG4gICAgcmVzcG9uc2UudGVtcCA9IHBhcnNlRmxvYXQocmVzcG9uc2UudGVtcCk7XG4gICAgcmVzcG9uc2UucmF3ID0gcGFyc2VGbG9hdChyZXNwb25zZS5yYXcpO1xuICAgIGlmKHJlc3BvbnNlLnZvbHRzKVxuICAgICAgcmVzcG9uc2Uudm9sdHMgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnZvbHRzKTtcblxuICAgIGlmKCEha2V0dGxlLnRlbXAuY3VycmVudClcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLDIpO1xuICAgIC8vIGFkZCBhZGp1c3RtZW50XG4gICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuXG4gICAgLy8gdm9sdCBjaGVja1xuICAgIGlmKGtldHRsZS50ZW1wLnZvbHRzKXtcbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InICYmXG4gICAgICAgIGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDAgJiZcbiAgICAgICAgIUJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJlxuICAgICAgICBrZXR0bGUudGVtcC52b2x0cyA8IDIpe1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgIT0gJ0JNUDE4MCcgJiZcbiAgICAgICFrZXR0bGUudGVtcC52b2x0cyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnJhdyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgJiZcbiAgICAgIHJlc3BvbnNlLnRlbXAgPT0gLTEyNyl7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyByZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXMuc2hpZnQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUIHNlbnNvcnMgaGF2ZSBodW1pZGl0eSBhcyBhIHBlcmNlbnRcbiAgICAvL1NvaWxNb2lzdHVyZUQgaGFzIG1vaXN0dXJlIGFzIGEgcGVyY2VudFxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUucGVyY2VudCA9IHJlc3BvbnNlLnBlcmNlbnQ7XG4gICAgfVxuICAgIC8vIEJNUCBzZW5zb3JzIGhhdmUgYWx0aXR1ZGUgYW5kIHByZXNzdXJlXG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5hbHRpdHVkZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUuYWx0aXR1ZGUgPSByZXNwb25zZS5hbHRpdHVkZTtcbiAgICB9XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wcmVzc3VyZSAhPSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBwYXNjYWwgdG8gaW5jaGVzIG9mIG1lcmN1cnlcbiAgICAgIGtldHRsZS5wcmVzc3VyZSA9IHJlc3BvbnNlLnByZXNzdXJlIC8gMzM4Ni4zODk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoLWFsdCcpKSBidG4gPSBidG4ucGFyZW50KCk7XG5cbiAgICBpZighYnRuLmhhc0NsYXNzKCdidG4tZGFuZ2VyJykpe1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tbGlnaHQnKS5hZGRDbGFzcygnYnRuLWRhbmdlcicpO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAgfSwyMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVBXTSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUucHdtID0gIWtldHRsZS5wd207XG4gICAgICBpZihrZXR0bGUucHdtKVxuICAgICAgICBrZXR0bGUuc3NyID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlS2V0dGxlID0gZnVuY3Rpb24oaXRlbSwga2V0dGxlKXtcblxuICAgIHZhciBrO1xuXG4gICAgc3dpdGNoIChpdGVtKSB7XG4gICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgayA9IGtldHRsZS5oZWF0ZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgIGsgPSBrZXR0bGUuY29vbGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICBrID0ga2V0dGxlLnB1bXA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmKCFrKVxuICAgICAgcmV0dXJuO1xuXG4gICAgay5ydW5uaW5nID0gIWsucnVubmluZztcblxuICAgIGlmKGtldHRsZS5hY3RpdmUgJiYgay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYoIWsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5oYXNTa2V0Y2hlcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgdmFyIGhhc0FTa2V0Y2ggPSBmYWxzZTtcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHxcbiAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMpXG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycyA9IHt9O1xuICAgIC8vIGFwcGVuZCBlc3AgdHlwZVxuICAgIGlmKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xKVxuICAgICAgc2tldGNoTmFtZSArPSAkc2NvcGUuZXNwLnR5cGU7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKTtcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgfVxuICAgICAgdmFyIHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEha2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgaWYoQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmICRzY29wZS5lc3AuYXV0b2Nvbm5lY3Qpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEF1dG9Db25uZWN0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigoc2tldGNoTmFtZS5pbmRleE9mKCdFU1AnKSAhPT0gLTEgfHwgQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKSAmJlxuICAgICAgICAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKSAmJlxuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2JlZWdlZS10b2t5by9ESFRlc3AnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgXCJESFRlc3AuaFwiJyk7XG4gICAgICB9IGVsc2UgaWYoIUJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJlxuICAgICAgICAoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuREhUIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKSAmJlxuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVGxpYi0xLjIuOS56aXAnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuRFMxOEIyMCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxPbmVXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpO1xuICAgICAgfVxuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMuQk1QIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignQk1QMTgwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpO1xuICAgICAgfVxuICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDAgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hZGFmcnVpdC9BZGFmcnVpdF9BRFMxWDE1Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpO1xuICAgICAgfVxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYoa2V0dGxlLnRlbXAudmNjKSBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIGlmKGtldHRsZS50ZW1wLmluZGV4KSBrZXR0bGVUeXBlICs9ICctJytrZXR0bGUudGVtcC5pbmRleDtcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTtcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgdHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICB0cmlnZ2VyKEYoXCJjb29sXCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBpZihza2V0Y2gudHJpZ2dlcnMpe1xuICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCB0ZW1wID0gMC4wMDsnKVxuICAgICAgICAvLyB1cGRhdGUgYXV0b0NvbW1hbmRcbiAgICAgICAgZm9yKHZhciBhID0gMDsgYSA8IHNrZXRjaC5hY3Rpb25zLmxlbmd0aDsgYSsrKXtcbiAgICAgICAgICBpZihza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSlcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsJ3RlbXAgPSBhY3Rpb25zQ29tbWFuZCgnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLypcXG5Ta2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY29cXG5WZXJzaW9uICcrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKydcXG4qL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbQUNUSU9OU10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0hFQURFUlNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKTtcblxuICAgICAgICAvLyBFU1AgdmFyaWFibGVzXG4gICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZCl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3Auc3NpZF9wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuYXJkdWlub19wYXNzKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJHNjb3BlLmVzcC5hcmR1aW5vX3Bhc3MpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbQVJEVUlOT19QQVNTXFxdL2csIG1kNSgnYmJhZG1pbicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoJHNjb3BlLmVzcC5ob3N0bmFtZSl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJ2JiZXNwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUucmVwbGFjZSgnLmxvY2FsJywnJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignU3RyZWFtcycpICE9PSAtMSl7XG4gICAgICAgICAgLy8gc3RyZWFtcyBjb25uZWN0aW9uXG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYGh0dHBzOi8vJHskc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX0uaG9zdGVkLmJyZXdiZW5jaC5jb2A7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1RSRUFNU19DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0FVVEhcXF0vZywgJ0F1dGhvcml6YXRpb246IEJhc2ljICcrYnRvYSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZS50cmltKCkrJzonKyRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkudHJpbSgpKSk7XG4gICAgICAgIH0gaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvYmJwJztcbiAgICAgICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IGh0dHBzXG4gICAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25fc3RyaW5nLmluZGV4T2YoJ2h0dHBzOicpID09PSAwKVxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nID0gY29ubmVjdGlvbl9zdHJpbmcucmVwbGFjZSgnaHR0cHM6JywnaHR0cDonKTtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCBidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FQSV9LRVlcXF0vZywgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zID0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIi1IXCIpKTtcXG4nO1xuICAgICAgICAgICAgICBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zICs9ICcgIHAuYWRkUGFyYW1ldGVyKEYoXCJYLUFQSS1LRVk6ICcrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MrJ1wiKSk7JztcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnLy8gYWRkaXRpb25hbF9wb3N0X3BhcmFtcycsIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLScrJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbisnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBtZWFzdXJlZCBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5zbGFjaygkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIGljb24sXG4gICAgICAgICAga2V0dGxlXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgaWYoZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7SlNPTi5zdHJpbmdpZnkoZXJyKX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVLbm9iQ29weSA9IGZ1bmN0aW9uKGtldHRsZSl7XG5cbiAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnbm90IHJ1bm5pbmcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLm1lc3NhZ2UubWVzc2FnZSAmJiBrZXR0bGUubWVzc2FnZS50eXBlID09ICdkYW5nZXInKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVW5pdHMgPSBmdW5jdGlvbih1bml0KXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ICE9IHVuaXQpe1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC50YXJnZXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5jdXJyZW50KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5tZWFzdXJlZCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAucHJldmlvdXMsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC50YXJnZXQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAudGFyZ2V0LDApO1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLmFkanVzdCl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0LCBzZXNzaW9uOiAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9ufSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggISFrZXR0bGUgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKCEha2V0dGxlKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy9vbmx5IHByb2Nlc3MgYWN0aXZlIHNlbnNvcnNcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrLCBpKSA9PiB7XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5hY3RpdmUpe1xuICAgICAgICBhbGxTZW5zb3JzLnB1c2goQnJld1NlcnZpY2UudGVtcCgkc2NvcGUua2V0dGxlc1tpXSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwgJHNjb3BlLmtldHRsZXNbaV0pKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdXBkYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudClcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQrKztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50ID09IDcpe1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0wO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwgJHNjb3BlLmtldHRsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEuYWxsKGFsbFNlbnNvcnMpXG4gICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAvL3JlIHByb2Nlc3Mgb24gdGltZW91dFxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlLCRpbmRleCl7XG4gICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgICAkc2NvcGUua2V0dGxlcy5zcGxpY2UoJGluZGV4LDEpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIGlmKGZpZWxkID09ICdhZGp1c3QnKXtcbiAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIH1cblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIC8vdXBkYXRlIHN0cmVhbXNcbiAgICBpZigkc2NvcGUuc3RyZWFtcy5jb25uZWN0ZWQoKSAmJiBrZXR0bGUubm90aWZ5LnN0cmVhbXMpe1xuICAgICAgJHNjb3BlLnN0cmVhbXMua2V0dGxlcyhrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoISFsb2FkZWQpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuXG4gIC8vIHVwZGF0ZSBsb2NhbCBjYWNoZVxuICAkc2NvcGUudXBkYXRlTG9jYWwgPSBmdW5jdGlvbigpe1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLCAkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLCRzY29wZS5rZXR0bGVzKTtcbiAgICAgICRzY29wZS51cGRhdGVMb2NhbCgpO1xuICAgIH0sNTAwMCk7XG4gIH1cbiAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG5cbiAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcbiAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCh7XG4gICAgICBhbmltYXRlZDogJ2ZhZGUnLFxuICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgICAgaHRtbDogdHJ1ZVxuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oY2Vsc2l1cykge1xuICAgIGNlbHNpdXMgPSBwYXJzZUZsb2F0KGNlbHNpdXMpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKGNlbHNpdXMqOS81KzMyLDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZhaHJlbmhlaXQpIHtcbiAgICBmYWhyZW5oZWl0ID0gcGFyc2VGbG9hdChmYWhyZW5oZWl0KTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKSgoZmFocmVuaGVpdC0zMikqNS85LDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3JvdW5kJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odmFsLGRlY2ltYWxzKSB7XG4gICAgcmV0dXJuIE51bWJlcigoTWF0aC5yb3VuZCh2YWwgKyBcImVcIiArIGRlY2ltYWxzKSAgKyBcImUtXCIgKyBkZWNpbWFscykpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RpdGxlY2FzZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCl7XG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGV4dC5zbGljZSgxKSk7XG4gIH07XG59KVxuLmZpbHRlcignZGJtUGVyY2VudCcsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24oZGJtKXtcbiAgICByZXR1cm4gMiAqIChkYm0gKyAxMDApO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFjY2Vzc1Rva2VuOiBmdW5jdGlvbih0b2tlbil7XG4gICAgICBpZih0b2tlbilcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLHRva2VuKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYWNjZXNzVG9rZW4nKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlfVxuICAgICAgICAsY2hhcnQ6IHtzaG93OiB0cnVlLCBtaWxpdGFyeTogZmFsc2UsIGFyZWE6IGZhbHNlfVxuICAgICAgICAsc2Vuc29yczoge0RIVDogZmFsc2UsIERTMThCMjA6IGZhbHNlLCBCTVA6IGZhbHNlfVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYXJkdWlub3M6IFt7aWQ6J2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksYm9hcmQ6JycsUlNTSTpmYWxzZSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlLHZlcnNpb246Jycsc3RhdHVzOntlcnJvcjonJyxkdDonJyxtZXNzYWdlOicnfX1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBzdGF0dXM6ICcnLCBwbHVnczogW119XG4gICAgICAgICxpbmZsdXhkYjoge3VybDogJycsIHBvcnQ6ICcnLCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBzdGF0dXM6ICcnfVxuICAgICAgICAsc3RyZWFtczoge3VzZXJuYW1lOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycsIHNlc3Npb246IHtpZDogJycsIG5hbWU6ICcnLCB0eXBlOiAnZmVybWVudGF0aW9uJ319XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdNYXNoJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ0JvaWwnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTInLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMTgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1RlbXAnLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1NvaWwnLCd0eXBlJzonc2VlZGxpbmcnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonUGxhbnQnLCd0eXBlJzonY2FubmFiaXMnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vLCByZXR1cm5fdmVyc2lvbil7XG4gICAgICBpZihyZXR1cm5fdmVyc2lvbil7XG4gICAgICAgIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCczMicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzMyJztcbiAgICAgICAgZWxzZSBpZihhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignODI2NicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzgyNjYnO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICEhKGFyZHVpbm8uYm9hcmQgJiYgKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdlc3AnKSAhPT0gLTEgfHwgYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ25vZGVtY3UnKSAhPT0gLTEpKTtcbiAgICB9LFxuXG4gICAgc2xhY2s6IGZ1bmN0aW9uKHdlYmhvb2tfdXJsLCBtc2csIGNvbG9yLCBpY29uLCBrZXR0bGUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICB2YXIgcG9zdE9iaiA9IHsnYXR0YWNobWVudHMnOiBbeydmYWxsYmFjayc6IG1zZyxcbiAgICAgICAgICAgICd0aXRsZSc6IGtldHRsZS5uYW1lLFxuICAgICAgICAgICAgJ3RpdGxlX2xpbmsnOiAnaHR0cDovLycrZG9jdW1lbnQubG9jYXRpb24uaG9zdCxcbiAgICAgICAgICAgICdmaWVsZHMnOiBbeyd2YWx1ZSc6IG1zZ31dLFxuICAgICAgICAgICAgJ2NvbG9yJzogY29sb3IsXG4gICAgICAgICAgICAnbXJrZHduX2luJzogWyd0ZXh0JywgJ2ZhbGxiYWNrJywgJ2ZpZWxkcyddLFxuICAgICAgICAgICAgJ3RodW1iX3VybCc6IGljb25cbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAkaHR0cCh7dXJsOiB3ZWJob29rX3VybCwgbWV0aG9kOidQT1NUJywgZGF0YTogJ3BheWxvYWQ9JytKU09OLnN0cmluZ2lmeShwb3N0T2JqKSwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY29ubmVjdDogZnVuY3Rpb24oYXJkdWlubywgZW5kcG9pbnQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pKycvYXJkdWluby8nK2VuZHBvaW50O1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykpXG4gICAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gVGhlcm1pc3RvciwgRFMxOEIyMCwgb3IgUFQxMDBcbiAgICAvLyBodHRwczovL2xlYXJuLmFkYWZydWl0LmNvbS90aGVybWlzdG9yL3VzaW5nLWEtdGhlcm1pc3RvclxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzM4MSlcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMjkwIGFuZCBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMzI4XG4gICAgdGVtcDogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vJytrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQScpID09PSAwKVxuICAgICAgICAgIHVybCArPSAnP2FwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB1cmwgKz0gJz9kcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLnZjYyAmJiBbJzNWJywnNVYnXS5pbmRleE9mKGtldHRsZS50ZW1wLnZjYykgPT09IC0xKSAvL1NvaWxNb2lzdHVyZSBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmRwaW49JytrZXR0bGUudGVtcC52Y2M7XG4gICAgICAgIGVsc2UgaWYoISFrZXR0bGUudGVtcC5pbmRleCkgLy9EUzE4QjIwIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmaW5kZXg9JytrZXR0bGUudGVtcC5pbmRleDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAudmNjICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGFuYWxvZzogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2FuYWxvZyc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2FwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGRpZ2l0YWxSZWFkOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHRpbWVvdXQpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/ZHBpbj0nK3NlbnNvcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgdmFyIHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgICBkZWxldGUgc2V0dGluZ3MudHBsaW5rO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLm5vdGlmaWNhdGlvbnM7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc2tldGNoZXM7XG4gICAgICBzZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgICAgaWYoc2gucGFzc3dvcmQpXG4gICAgICAgIHNoLnBhc3N3b3JkID0gbWQ1KHNoLnBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2NyZWF0ZS8nLFxuICAgICAgICAgIG1ldGhvZDonUE9TVCcsXG4gICAgICAgICAgZGF0YTogeydzaGFyZSc6IHNoLCAnc2V0dGluZ3MnOiBzZXR0aW5ncywgJ2tldHRsZXMnOiBrZXR0bGVzfSxcbiAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzaGFyZVRlc3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gYHVybD0ke2FyZHVpbm8udXJsfWBcblxuICAgICAgaWYoYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgcXVlcnkgKz0gJyZhdXRoPScrYnRvYSgncm9vdDonK2FyZHVpbm8ucGFzc3dvcmQudHJpbSgpKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGU6IChkZXZpY2UsIHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogdG9nZ2xlIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBzdHJlYW1zOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMS9hcGknLCBoZWFkZXJzOiB7fSwgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGF1dGg6IGFzeW5jIChwaW5nKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJiBzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9IChwaW5nKSA/ICcvdXNlcnMvcGluZycgOiAnL3VzZXJzL2F1dGgnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0nYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtleSddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5fWA7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQkItVXNlciddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpXG4gICAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuKHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKTtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBrZXR0bGVzOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKGtldHRsZSkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHVwZGF0ZWRLZXR0bGUgPSBhbmd1bGFyLmNvcHkoa2V0dGxlKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBub3QgbmVlZGVkIGRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnZhbHVlcztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLm1lc3NhZ2U7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS50aW1lcnM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5rbm9iO1xuICAgICAgICAgICAgdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCA9IChzZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIXVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKSh1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDogdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcy9hcm0nO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb246IHNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbixcbiAgICAgICAgICAgICAga2V0dGxlOiB1cGRhdGVkS2V0dGxlLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiBzZXR0aW5ncy5ub3RpZmljYXRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25zOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBrZXR0bGU6IGtldHRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKHNlc3Npb24pID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMvJytzZXNzaW9uLmlkO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUEFUQ0gnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBuYW1lOiBzZXNzaW9uLm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6IHNlc3Npb24udHlwZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gZG8gY2FsY3MgdGhhdCBleGlzdCBvbiB0aGUgc2tldGNoXG4gICAgYml0Y2FsYzogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHZhciBhdmVyYWdlID0ga2V0dGxlLnRlbXAucmF3O1xuICAgICAgLy8gaHR0cHM6Ly93d3cuYXJkdWluby5jYy9yZWZlcmVuY2UvZW4vbGFuZ3VhZ2UvZnVuY3Rpb25zL21hdGgvbWFwL1xuICAgICAgZnVuY3Rpb24gZm1hcCAoeCxpbl9taW4saW5fbWF4LG91dF9taW4sb3V0X21heCl7XG4gICAgICAgIHJldHVybiAoeCAtIGluX21pbikgKiAob3V0X21heCAtIG91dF9taW4pIC8gKGluX21heCAtIGluX21pbikgKyBvdXRfbWluO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3Rvcicpe1xuICAgICAgICBjb25zdCBUSEVSTUlTVE9STk9NSU5BTCA9IDEwMDAwO1xuICAgICAgICAvLyB0ZW1wLiBmb3Igbm9taW5hbCByZXNpc3RhbmNlIChhbG1vc3QgYWx3YXlzIDI1IEMpXG4gICAgICAgIGNvbnN0IFRFTVBFUkFUVVJFTk9NSU5BTCA9IDI1O1xuICAgICAgICAvLyBob3cgbWFueSBzYW1wbGVzIHRvIHRha2UgYW5kIGF2ZXJhZ2UsIG1vcmUgdGFrZXMgbG9uZ2VyXG4gICAgICAgIC8vIGJ1dCBpcyBtb3JlICdzbW9vdGgnXG4gICAgICAgIGNvbnN0IE5VTVNBTVBMRVMgPSA1O1xuICAgICAgICAvLyBUaGUgYmV0YSBjb2VmZmljaWVudCBvZiB0aGUgdGhlcm1pc3RvciAodXN1YWxseSAzMDAwLTQwMDApXG4gICAgICAgIGNvbnN0IEJDT0VGRklDSUVOVCA9IDM5NTA7XG4gICAgICAgIC8vIHRoZSB2YWx1ZSBvZiB0aGUgJ290aGVyJyByZXNpc3RvclxuICAgICAgICBjb25zdCBTRVJJRVNSRVNJU1RPUiA9IDEwMDAwO1xuICAgICAgIC8vIGNvbnZlcnQgdGhlIHZhbHVlIHRvIHJlc2lzdGFuY2VcbiAgICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDApe1xuICAgICAgICAgYXZlcmFnZSA9IChhdmVyYWdlICogKDUuMCAvIDY1NTM1KSkgLyAwLjAwMDE7XG4gICAgICAgICB2YXIgbG4gPSBNYXRoLmxvZyhhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUwpO1xuICAgICAgICAgdmFyIGtlbHZpbiA9IDEgLyAoMC4wMDMzNTQwMTcwICsgKDAuMDAwMjU2MTcyNDQgKiBsbikgKyAoMC4wMDAwMDIxNDAwOTQzICogbG4gKiBsbikgKyAoLTAuMDAwMDAwMDcyNDA1MjE5ICogbG4gKiBsbiAqIGxuKSk7XG4gICAgICAgICAgLy8ga2VsdmluIHRvIGNlbHNpdXNcbiAgICAgICAgIHJldHVybiBrZWx2aW4gLSAyNzMuMTU7XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGF2ZXJhZ2UgPSAxMDIzIC8gYXZlcmFnZSAtIDE7XG4gICAgICAgICBhdmVyYWdlID0gU0VSSUVTUkVTSVNUT1IgLyBhdmVyYWdlO1xuXG4gICAgICAgICB2YXIgc3RlaW5oYXJ0ID0gYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMOyAgICAgLy8gKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgPSBNYXRoLmxvZyhzdGVpbmhhcnQpOyAgICAgICAgICAgICAgICAgIC8vIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgLz0gQkNPRUZGSUNJRU5UOyAgICAgICAgICAgICAgICAgICAvLyAxL0IgKiBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ICs9IDEuMCAvIChURU1QRVJBVFVSRU5PTUlOQUwgKyAyNzMuMTUpOyAvLyArICgxL1RvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gMS4wIC8gc3RlaW5oYXJ0OyAgICAgICAgICAgICAgICAgLy8gSW52ZXJ0XG4gICAgICAgICBzdGVpbmhhcnQgLT0gMjczLjE1O1xuICAgICAgICAgcmV0dXJuIHN0ZWluaGFydDtcbiAgICAgICB9XG4gICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcpe1xuICAgICAgIGlmIChrZXR0bGUudGVtcC5yYXcgJiYga2V0dGxlLnRlbXAucmF3PjQwOSl7XG4gICAgICAgIHJldHVybiAoMTUwKmZtYXAoa2V0dGxlLnRlbXAucmF3LDQxMCwxMDIzLDAsNjE0KSkvNjE0O1xuICAgICAgIH1cbiAgICAgfVxuICAgICAgcmV0dXJuICdOL0EnO1xuICAgIH0sXG5cbiAgICBpbmZsdXhkYjogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgaW5mbHV4Q29ubmVjdGlvbiA9IGAke3NldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgaWYoISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0ICYmICF0aGlzLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSlcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBob3N0ZWQ6ICh1cmwpID0+IHtcbiAgICAgICAgICByZXR1cm4gKHVybC5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSB8fFxuICAgICAgICAgICAgdXJsLmluZGV4T2YoJ2hvc3RlZC5icmV3YmVuY2guY28nKSAhPT0gLTEpO1xuICAgICAgICB9LFxuICAgICAgICBwaW5nOiAoaW5mbHV4ZGIpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51cmwpe1xuICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiA9IGAke2luZmx1eGRiLnVybH1gO1xuICAgICAgICAgICAgaWYoICEhaW5mbHV4ZGIucG9ydCAmJiAhdGhpcy5pbmZsdXhkYigpLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSlcbiAgICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7aW5mbHV4ZGIucG9ydH1gXG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn1gLCBtZXRob2Q6ICdHRVQnfTtcbiAgICAgICAgICBpZih0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2A7XG4gICAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51c2VyICYmIGluZmx1eGRiLnBhc3Mpe1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoaW5mbHV4ZGIudXNlci50cmltKCkrJzonK2luZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2Eoc2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCkrJzonK3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICBpZih0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKXtcbiAgICAgICAgICAgIHEucmVzb2x2ZShbc2V0dGluZ3MuaW5mbHV4ZGIudXNlcl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICBpZih0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KCdEYXRhYmFzZSBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6ICEhb3B0aW9ucy5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6ICEhb3B0aW9ucy5zZXNzaW9uID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gISFvcHRpb25zLmNoYXJ0LmFyZWEgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCEhb3B0aW9ucy5jaGFydC5taWxpdGFyeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgdmFyIHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgdmFyIHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICB2YXIgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9