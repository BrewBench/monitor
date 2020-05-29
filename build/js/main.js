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

},[318]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXJkdWlub19wYXNzIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0Iiwic2Vzc2lvbiIsInN0cmVhbXMiLCJkZWZhdWx0S2V0dGxlcyIsInNoYXJlIiwicGFyYW1zIiwiZmlsZSIsInBhc3N3b3JkIiwibmVlZFBhc3N3b3JkIiwiYWNjZXNzIiwiZGVsZXRlQWZ0ZXIiLCJvcGVuU2tldGNoZXMiLCIkIiwibW9kYWwiLCJzdW1WYWx1ZXMiLCJvYmoiLCJzdW1CeSIsInVwZGF0ZUFCViIsInJlY2lwZSIsInNjYWxlIiwibWV0aG9kIiwiYWJ2Iiwib2ciLCJmZyIsImFidmEiLCJhYnciLCJhdHRlbnVhdGlvbiIsInBsYXRvIiwiY2Fsb3JpZXMiLCJyZSIsInNnIiwiY2hhbmdlTWV0aG9kIiwiY2hhbmdlU2NhbGUiLCJnZXRTdGF0dXNDbGFzcyIsInN0YXR1cyIsImVuZHNXaXRoIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsIlJTU0kiLCJhbmFsb2ciLCJkaWdpdGFsIiwiYWRjIiwic2VjdXJlIiwidmVyc2lvbiIsImR0IiwiZWFjaCIsImFyZHVpbm8iLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJjb25uZWN0IiwidGhlbiIsImluZm8iLCJCcmV3QmVuY2giLCJldmVudCIsInNyY0VsZW1lbnQiLCJpbm5lckhUTUwiLCJ0b3VjaCIsImNhdGNoIiwiZXJyIiwicmVib290IiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInJlc3BvbnNlIiwidG9rZW4iLCJzY2FuIiwic2V0RXJyb3JNZXNzYWdlIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInJlc3BvbnNlRGF0YSIsIkpTT04iLCJwYXJzZSIsInN5c3RlbSIsImdldF9zeXNpbmZvIiwiZW1ldGVyIiwiZ2V0X3JlYWx0aW1lIiwiZXJyX2NvZGUiLCJwb3dlciIsImRldmljZSIsInRvZ2dsZSIsIm9mZk9yT24iLCJyZWxheV9zdGF0ZSIsImFkZEtldHRsZSIsImZpbmQiLCJzdGlja3kiLCJwaW4iLCJhdXRvIiwiZHV0eUN5Y2xlIiwic2tldGNoIiwidGVtcCIsInZjYyIsImhpdCIsIm1lYXN1cmVkIiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwicmF3Iiwidm9sdHMiLCJ2YWx1ZXMiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsImlzRVNQIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjaGFuZ2VTZW5zb3IiLCJzZW5zb3JUeXBlcyIsInBlcmNlbnQiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJicmV3YmVuY2hIb3N0ZWQiLCJob3N0ZWQiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJwaW5nIiwicmVtb3ZlQ2xhc3MiLCJkYiIsImRicyIsImNvbmNhdCIsImFwcGx5IiwiYWRkQ2xhc3MiLCJjcmVhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJjb25uZWN0ZWQiLCJ1c2VybmFtZSIsImFwaV9rZXkiLCJhdXRoIiwicmVsYXkiLCJzYXZlIiwia2V0dGxlUmVzcG9uc2UiLCJtZXJnZSIsImNvbnNvbGUiLCJzZXNzaW9ucyIsInNoYXJlQWNjZXNzIiwic2hhcmVkIiwiZnJhbWVFbGVtZW50IiwibG9hZFNoYXJlRmlsZSIsImNvbnRlbnRzIiwibm90aWZpY2F0aW9ucyIsIm9uIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJsYWJlbCIsImFtb3VudCIsImFkZFRpbWVyIiwibm90ZXMiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0b29sdGlwIiwiYW5pbWF0ZWQiLCJwbGFjZW1lbnQiLCJzaG93IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsInVwZGF0ZUFyZHVpbm9TdGF0dXMiLCJkb21haW4iLCJza2V0Y2hfdmVyc2lvbiIsInVwZGF0ZVRlbXAiLCJrZXkiLCJ0ZW1wcyIsInNoaWZ0IiwiYWx0aXR1ZGUiLCJwcmVzc3VyZSIsImN1cnJlbnRWYWx1ZSIsInVuaXRUeXBlIiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJiZiIsIkRIVCIsIkRTMThCMjAiLCJCTVAiLCJrZXR0bGVUeXBlIiwidW5zaGlmdCIsImEiLCJ0b0xvd2VyQ2FzZSIsImRvd25sb2FkU2tldGNoIiwiaGFzVHJpZ2dlcnMiLCJ0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmciLCJjb25uZWN0aW9uIiwiYXV0b2dlbiIsImdldCIsImpvaW4iLCJtZDUiLCJjb25uZWN0aW9uX3N0cmluZyIsInRyaW0iLCJhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zIiwicG9ydCIsIlRIQyIsInN0cmVhbVNrZXRjaCIsImNyZWF0ZUVsZW1lbnQiLCJzZXRBdHRyaWJ1dGUiLCJzdHlsZSIsImRpc3BsYXkiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJjbGljayIsInJlbW92ZUNoaWxkIiwiZ2V0SVBBZGRyZXNzIiwiaXBBZGRyZXNzIiwiaXAiLCJpY29uIiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJ1cGRhdGVTdHJlYW1zIiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImRibSIsImtnIiwiaXNOYU4iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImFjY2Vzc1Rva2VuIiwic2V0SXRlbSIsImdldEl0ZW0iLCJkZWJ1ZyIsIm1pbGl0YXJ5IiwiYXJlYSIsInJlYWRPbmx5IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJyZXR1cm5fdmVyc2lvbiIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiZW5kcG9pbnQiLCJyZXF1ZXN0Iiwid2l0aENyZWRlbnRpYWxzIiwic2Vuc29yIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJ1cGRhdGVkS2V0dGxlIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJ0aXRsZSIsImVuYWJsZSIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVB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LE9BQVIsQ0FBZ0JnWixPQUFPMEssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUE5cURJLEdBQVA7QUFnckRELENBbnJERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsO1xudmFyIHJlc2V0Q2hhcnQgPSAxMDA7XG52YXIgdGltZW91dCA9IG51bGw7IC8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5CcmV3U2VydmljZSA9IEJyZXdTZXJ2aWNlO1xuJHNjb3BlLnNpdGUgPSB7aHR0cHM6ICEhKGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sPT0naHR0cHM6JylcbiAgLCBodHRwc191cmw6IGBodHRwczovLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH1gXG59O1xuJHNjb3BlLmVzcCA9IHtcbiAgdHlwZTogJycsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJ2JiZXNwJyxcbiAgYXJkdWlub19wYXNzOiAnYmJhZG1pbicsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLm9wZW5Ta2V0Y2hlcyA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzZXR0aW5nc01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgJCgnI3NrZXRjaGVzTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59O1xuXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS5nZXRTdGF0dXNDbGFzcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIGlmKHN0YXR1cyA9PSAnQ29ubmVjdGVkJylcbiAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICBlbHNlIGlmKF8uZW5kc1dpdGgoc3RhdHVzLCdpbmcnKSlcbiAgICByZXR1cm4gJ3NlY29uZGFyeSc7XG4gIGVsc2VcbiAgICByZXR1cm4gJ2Rhbmdlcic7XG59XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGJvYXJkOiAnJyxcbiAgICAgICAgUlNTSTogZmFsc2UsXG4gICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgZGlnaXRhbDogMTMsXG4gICAgICAgIGFkYzogMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbjogJycsXG4gICAgICAgIHN0YXR1czoge2Vycm9yOiAnJyxkdDogJycsbWVzc2FnZTonJ31cbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6IChhcmR1aW5vKSA9PiB7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5kdCA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnQ29ubmVjdGluZy4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdpbmZvJylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLkJyZXdCZW5jaCl7XG4gICAgICAgICAgICBldmVudC5zcmNFbGVtZW50LmlubmVySFRNTCA9ICdDb25uZWN0JztcbiAgICAgICAgICAgIGFyZHVpbm8uYm9hcmQgPSBpbmZvLkJyZXdCZW5jaC5ib2FyZDtcbiAgICAgICAgICAgIGlmKGluZm8uQnJld0JlbmNoLlJTU0kpXG4gICAgICAgICAgICAgIGFyZHVpbm8uUlNTSSA9IGluZm8uQnJld0JlbmNoLlJTU0k7XG4gICAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSBpbmZvLkJyZXdCZW5jaC52ZXJzaW9uO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQMzInKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAzOTtcbiAgICAgICAgICAgICAgYXJkdWluby5kaWdpdGFsID0gMzk7XG4gICAgICAgICAgICAgIGFyZHVpbm8udG91Y2ggPSBbNCwwLDIsMTUsMTMsMTIsMTQsMjcsMzMsMzJdO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQODI2NicpID09IDApe1xuICAgICAgICAgICAgICBhcmR1aW5vLmFuYWxvZyA9IDA7XG4gICAgICAgICAgICAgIGFyZHVpbm8uZGlnaXRhbCA9IDE2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5zdGF0dXMgPT0gLTEpe1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVib290OiAoYXJkdWlubykgPT4ge1xuICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSAnJztcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ1JlYm9vdGluZy4uLic7XG4gICAgICBCcmV3U2VydmljZS5jb25uZWN0KGFyZHVpbm8sICdyZWJvb3QnKVxuICAgICAgICAudGhlbihpbmZvID0+IHtcbiAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSAnJztcbiAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJ1JlYm9vdCBTdWNjZXNzLCB0cnkgY29ubmVjdGluZyBpbiBhIGZldyBzZWNvbmRzLic7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpZihwa2cudmVyc2lvbiA8IDQuMilcbiAgICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnVXBncmFkZSB0byBzdXBwb3J0IHJlYm9vdCc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmVycm9yID0gJ0NvdWxkIG5vdCBjb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5tc2cgfHwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ1NjYW5uaW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnNjYW4odG9rZW4pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZihyZXNwb25zZS5kZXZpY2VMaXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoISFwbHVnLnN0YXR1cyl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIHBsdWcuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICB2YXIgb2ZmT3JPbiA9IGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEgPyAwIDogMTtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnRvZ2dsZShkZXZpY2UsIG9mZk9yT24pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IG9mZk9yT247XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pLnRoZW4odG9nZ2xlUmVzcG9uc2UgPT4ge1xuICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmZvXG4gICAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgIGRldmljZS5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFkZEtldHRsZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIGlmKCEkc2NvcGUua2V0dGxlcykgJHNjb3BlLmtldHRsZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGggPyAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF0gOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9O1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiB0eXBlID8gXy5maW5kKCRzY29wZS5rZXR0bGVUeXBlcyx7dHlwZTogdHlwZX0pLm5hbWUgOiAkc2NvcGUua2V0dGxlVHlwZXNbMF0ubmFtZVxuICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiBhcmR1aW5vXG4gICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24oYXJkdWlubywgcGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2UgaWYoQnJld1NlcnZpY2UuaXNFU1AoYXJkdWlubykpe1xuICAgICAgICBpZihCcmV3U2VydmljZS5pc0VTUChhcmR1aW5vLCB0cnVlKSA9PSAnODI2NicpXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdEJywnR1BJTycpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHBpbi5yZXBsYWNlKCdBJywnR1BJTycpLnJlcGxhY2UoJ0QnLCdHUElPJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGluO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKFxuICAgICAgICAgIChrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLnRlbXAudmNjPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlU2Vuc29yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gICAga2V0dGxlLnRlbXAuaW5kZXggPSAnJztcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbmZsdXhkYiA9IHtcbiAgICBicmV3YmVuY2hIb3N0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5pbmZsdXhkYigpLmhvc3RlZCgkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIgPSBkZWZhdWx0U2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQgfHwgcmVzcG9uc2Uuc3RhdHVzID09IDIwMCl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmRicygpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgICAgdmFyIGRicyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGNyZWF0ZTogKCkgPT4ge1xuICAgICAgdmFyIGRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IGZhbHNlO1xuICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5jcmVhdGVEQihkYilcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIC8vIHByb21wdCBmb3IgcGFzc3dvcmRcbiAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9IGRiO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBpZihlcnIuc3RhdHVzICYmIChlcnIuc3RhdHVzID09IDQwMSB8fCBlcnIuc3RhdHVzID09IDQwMykpe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgICAgfSBlbHNlIGlmKGVycil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdHJlYW1zID0ge1xuICAgIGNvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuICghISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lICYmXG4gICAgICAgICEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJlxuICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPT0gJ0Nvbm5lY3RlZCdcbiAgICAgICk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMgPSBkZWZhdWx0U2V0dGluZ3Muc3RyZWFtcztcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zID0gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5hdXRoKHRydWUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBrZXR0bGVzOiAoa2V0dGxlLCByZWxheSkgPT4ge1xuICAgICAgaWYocmVsYXkpe1xuICAgICAgICBrZXR0bGVbcmVsYXldLnNrZXRjaCA9ICFrZXR0bGVbcmVsYXldLnNrZXRjaDtcbiAgICAgICAgaWYoIWtldHRsZS5ub3RpZnkuc3RyZWFtcylcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9ICdza2V0Y2hlcyc7XG4gICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2luZm8nO1xuICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMDtcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkua2V0dGxlcy5zYXZlKGtldHRsZSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHZhciBrZXR0bGVSZXNwb25zZSA9IHJlc3BvbnNlLmtldHRsZTtcbiAgICAgICAgICAvLyB1cGRhdGUga2V0dGxlIHZhcnNcbiAgICAgICAgICBrZXR0bGUuaWQgPSBrZXR0bGVSZXNwb25zZS5pZDtcbiAgICAgICAgICAvLyB1cGRhdGUgYXJkdWlubyBpZFxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MsIGFyZHVpbm8gPT4ge1xuICAgICAgICAgICAgaWYoYXJkdWluby5pZCA9PSBrZXR0bGUuYXJkdWluby5pZClcbiAgICAgICAgICAgICAgYXJkdWluby5pZCA9IGtldHRsZVJlc3BvbnNlLmRldmljZUlkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGtldHRsZS5hcmR1aW5vLmlkID0ga2V0dGxlUmVzcG9uc2UuZGV2aWNlSWQ7XG4gICAgICAgICAgLy8gdXBkYXRlIHNlc3Npb24gdmFyc1xuICAgICAgICAgIF8ubWVyZ2UoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbiwga2V0dGxlUmVzcG9uc2Uuc2Vzc2lvbik7XG5cbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ3N1Y2Nlc3MnO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDI7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyA9ICFrZXR0bGUubm90aWZ5LnN0cmVhbXM7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMTtcbiAgICAgICAgICBpZihlcnIgJiYgZXJyLmRhdGEgJiYgZXJyLmRhdGEuZXJyb3IgJiYgZXJyLmRhdGEuZXJyb3IubWVzc2FnZSl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5kYXRhLmVycm9yLm1lc3NhZ2UsIGtldHRsZSk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdCcmV3QmVuY2ggU3RyZWFtcyBFcnJvcicsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNlc3Npb25zOiB7XG4gICAgICBzYXZlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkuc2Vzc2lvbnMuc2F2ZSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcblxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc2hhcmVBY2Nlc3MgPSBmdW5jdGlvbihhY2Nlc3Mpe1xuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICAgaWYoYWNjZXNzKXtcbiAgICAgICAgICBpZihhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAhISgkc2NvcGUuc2hhcmUuYWNjZXNzICYmICRzY29wZS5zaGFyZS5hY2Nlc3MgPT09IGFjY2Vzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmKGFjY2VzcyAmJiBhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU2hhcmVGaWxlID0gZnVuY3Rpb24oKXtcbiAgICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAgICRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGdyYWluLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoaG9wLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogaG9wLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoaG9wLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTond2F0ZXInfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUubWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBtaXNjLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IG1pc2Mubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUueWVhc3QubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdCA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLnllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogeWVhc3QubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTdHlsZXMgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc3R5bGVzKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnN0eWxlcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkc2NvcGUuc3R5bGVzID0gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjb25maWcgPSBbXTtcbiAgICBpZighJHNjb3BlLnBrZyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCh7XG4gICAgICBhbmltYXRlZDogJ2ZhZGUnLFxuICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgICAgaHRtbDogdHJ1ZVxuICAgIH0pO1xuICAgIGlmKCQoJyNnaXRjb21taXQgYScpLnRleHQoKSAhPSAnZ2l0X2NvbW1pdCcpe1xuICAgICAgJCgnI2dpdGNvbW1pdCcpLnNob3coKTtcbiAgICB9XG4gICAgJHNjb3BlLnNob3dTZXR0aW5ncyA9ICEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQ7XG4gICAgaWYoJHNjb3BlLnNoYXJlLmZpbGUpXG4gICAgICByZXR1cm4gJHNjb3BlLmxvYWRTaGFyZUZpbGUoKTtcblxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoISFrZXR0bGUudGltZXJzICYmIGtldHRsZS50aW1lcnMubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2goa2V0dGxlLnRpbWVycywgdGltZXIgPT4ge1xuICAgICAgICAgICAgaWYodGltZXIucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZighdGltZXIucnVubmluZyAmJiB0aW1lci5xdWV1ZSl7XG4gICAgICAgICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIudXAucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lci51cCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSA9IGZ1bmN0aW9uKGVyciwga2V0dGxlLCBsb2NhdGlvbil7XG4gICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpe1xuICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnd2FybmluZyc7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ1RoZSBtb25pdG9yIHNlZW1zIHRvIGJlIG9mZi1saW5lLCByZS1jb25uZWN0aW5nLi4uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKCEhZXJyLnN0YXR1c1RleHQpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuc3RhdHVzVGV4dDtcbiAgICAgIGVsc2UgaWYoZXJyLmNvbmZpZyAmJiBlcnIuY29uZmlnLnVybClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5jb25maWcudXJsO1xuICAgICAgZWxzZSBpZihlcnIudmVyc2lvbil7XG4gICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS52ZXJzaW9uID0gZXJyLnZlcnNpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoZXJyKTtcbiAgICAgICAgaWYobWVzc2FnZSA9PSAne30nKSBtZXNzYWdlID0gJyc7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhbWVzc2FnZSl7XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdkYW5nZXInO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICBpZihsb2NhdGlvbilcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBtZXNzYWdlKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3IgY29ubmVjdGluZyB0byAke0JyZXdTZXJ2aWNlLmRvbWFpbihrZXR0bGUuYXJkdWlubyl9YCk7XG4gICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ0Nvbm5lY3Rpb24gZXJyb3I6Jyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBlcnJvcil7XG4gICAgdmFyIGFyZHVpbm8gPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MsIHtpZDogcmVzcG9uc2Uua2V0dGxlLmFyZHVpbm8uaWR9KTtcbiAgICBpZihhcmR1aW5vLmxlbmd0aCl7XG4gICAgICBhcmR1aW5vWzBdLnN0YXR1cy5kdCA9IG5ldyBEYXRlKCk7XG4gICAgICBpZihyZXNwb25zZS5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgYXJkdWlub1swXS52ZXJzaW9uID0gcmVzcG9uc2Uuc2tldGNoX3ZlcnNpb247XG4gICAgICBpZihlcnJvcilcbiAgICAgICAgYXJkdWlub1swXS5zdGF0dXMuZXJyb3IgPSBlcnJvcjtcbiAgICAgIGVsc2VcbiAgICAgICAgYXJkdWlub1swXS5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVzZXRFcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoa2V0dGxlKSB7XG4gICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVUZW1wID0gZnVuY3Rpb24ocmVzcG9uc2UsIGtldHRsZSl7XG4gICAgaWYoIXJlc3BvbnNlKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgIC8vIG5lZWRlZCBmb3IgY2hhcnRzXG4gICAga2V0dGxlLmtleSA9IGtldHRsZS5uYW1lO1xuICAgIHZhciB0ZW1wcyA9IFtdO1xuICAgIC8vY2hhcnQgZGF0ZVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL3VwZGF0ZSBkYXRhdHlwZVxuICAgIHJlc3BvbnNlLnRlbXAgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnRlbXApO1xuICAgIHJlc3BvbnNlLnJhdyA9IHBhcnNlRmxvYXQocmVzcG9uc2UucmF3KTtcbiAgICBpZihyZXNwb25zZS52b2x0cylcbiAgICAgIHJlc3BvbnNlLnZvbHRzID0gcGFyc2VGbG9hdChyZXNwb25zZS52b2x0cyk7XG5cbiAgICBpZighIWtldHRsZS50ZW1wLmN1cnJlbnQpXG4gICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgICRmaWx0ZXIoJ3JvdW5kJykocmVzcG9uc2UudGVtcCwyKTtcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIC8vIHNldCByYXdcbiAgICBrZXR0bGUudGVtcC5yYXcgPSByZXNwb25zZS5yYXc7XG4gICAga2V0dGxlLnRlbXAudm9sdHMgPSByZXNwb25zZS52b2x0cztcblxuICAgIC8vIHZvbHQgY2hlY2tcbiAgICBpZihrZXR0bGUudGVtcC50eXBlICE9ICdCTVAxODAnICYmXG4gICAgICAha2V0dGxlLnRlbXAudm9sdHMgJiZcbiAgICAgICFrZXR0bGUudGVtcC5yYXcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnICYmXG4gICAgICByZXNwb25zZS50ZW1wID09IC0xMjcpe1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdTZW5zb3IgaXMgbm90IGNvbm5lY3RlZCcsIGtldHRsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHkgYXMgYSBwZXJjZW50XG4gICAgLy9Tb2lsTW9pc3R1cmVEIGhhcyBtb2lzdHVyZSBhcyBhIHBlcmNlbnRcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLnBlcmNlbnQgPSByZXNwb25zZS5wZXJjZW50O1xuICAgIH1cbiAgICAvLyBCTVAgc2Vuc29ycyBoYXZlIGFsdGl0dWRlIGFuZCBwcmVzc3VyZVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UuYWx0aXR1ZGUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAga2V0dGxlLmFsdGl0dWRlID0gcmVzcG9uc2UuYWx0aXR1ZGU7XG4gICAgfVxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucHJlc3N1cmUgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgLy8gcGFzY2FsIHRvIGluY2hlcyBvZiBtZXJjdXJ5XG4gICAgICBrZXR0bGUucHJlc3N1cmUgPSByZXNwb25zZS5wcmVzc3VyZSAvIDMzODYuMzg5O1xuICAgIH1cblxuICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlLCBza2V0Y2hfdmVyc2lvbjpyZXNwb25zZS5za2V0Y2hfdmVyc2lvbn0pO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoY3VycmVudFZhbHVlIDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdGFydCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYgIWtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSkudGhlbihoZWF0aW5nID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDIwMCw0Nyw0NywxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYgIWtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB3aXRoaW4gdGFyZ2V0IVxuICAgICAga2V0dGxlLnRlbXAuaGl0PW5ldyBEYXRlKCk7Ly9zZXQgdGhlIHRpbWUgdGhlIHRhcmdldCB3YXMgaGl0IHNvIHdlIGNhbiBub3cgc3RhcnQgYWxlcnRzXG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaC1hbHQnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFjayB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5zZW5zb3JzKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMgPSB7fTtcbiAgICAvLyBhcHBlbmQgZXNwIHR5cGVcbiAgICBpZihza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSlcbiAgICAgIHNrZXRjaE5hbWUgKz0gJHNjb3BlLmVzcC50eXBlO1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWlubyA/IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSA6ICdEZWZhdWx0JztcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOiBhcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICB0eXBlOiBza2V0Y2hOYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZSxcbiAgICAgICAgICBiZjogKHNrZXRjaE5hbWUuaW5kZXhPZignQkYnKSAhPT0gLTEpID8gdHJ1ZSA6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISFrZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiYgJHNjb3BlLmVzcC5hdXRvY29ubmVjdCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QXV0b0Nvbm5lY3QuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKChza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSB8fCBCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykpICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYmVlZ2VlLXRva3lvL0RIVGVzcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKTtcbiAgICAgIH0gZWxzZSBpZighQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgICgkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5ESFQgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEpICYmXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5EUzE4QjIwIHx8IGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPE9uZVdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+Jyk7XG4gICAgICB9XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2Vuc29ycy5CTVAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdCTVAxODAnKSAhPT0gLTEpe1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPFdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+Jyk7XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhlIGFjdGlvbnMgY29tbWFuZFxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYgKGtldHRsZS50ZW1wLnZjYylcbiAgICAgICAga2V0dGxlVHlwZSArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICBcbiAgICAgIGlmIChrZXR0bGUudGVtcC5pbmRleCkga2V0dGxlVHlwZSArPSAnLScgKyBrZXR0bGUudGVtcC5pbmRleDsgICAgICBcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGFjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlVHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJyAgZGVsYXkoNTAwKTsnKTtcbiAgICAgIFxuICAgICAgaWYgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSAmJiBrZXR0bGUucGVyY2VudCkge1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICBhY3Rpb25zUGVyY2VudENvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJy1IdW1pZGl0eVwiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIGRlbGF5KDUwMCk7Jyk7ICAgICAgICBcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnICB0cmlnZ2VyKEYoXCJoZWF0XCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCcgIHRyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmIChza2V0Y2gudHJpZ2dlcnMgfHwgc2tldGNoLmJmKSB7XG4gICAgICAgIGlmIChza2V0Y2gudHlwZS5pbmRleE9mKCdNNScpID09PSAtMSkge1xuICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpO1xuICAgICAgICAgIGlmIChza2V0Y2guYmYpIHtcbiAgICAgICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IGFtYmllbnQgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgaHVtaWRpdHkgPSAwLjAwOycpO1xuICAgICAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnY29uc3QgU3RyaW5nIGVxdWlwbWVudF9uYW1lID0gXCInKyRzY29wZS5zZXR0aW5ncy5iZi5uYW1lKydcIjsnKTsgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZCBcbiAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNQZXJjZW50Q29tbWFuZCgnKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodW1pZGl0eScpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgLy8gQkYgbG9naWNcbiAgICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc1BlcmNlbnRDb21tYW5kKCcsICdodW1pZGl0eSA9IGFjdGlvbnNQZXJjZW50Q29tbWFuZCgnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNrZXRjaC5iZiAmJiBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSAmJlxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2FtYmllbnQnKSAhPT0gLTEpIHsgXG4gICAgICAgICAgICAgIC8vIEJGIGxvZ2ljXG4gICAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsICdhbWJpZW50ID0gYWN0aW9uc0NvbW1hbmQoJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gQWxsIG90aGVyIGxvZ2ljXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCAndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gudHJpZ2dlcnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoJytza2V0Y2hOYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICB2YXIgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIHZhciBhdXRvZ2VuID0gJy8qXFxuU2tldGNoIEF1dG8gR2VuZXJhdGVkIGZyb20gaHR0cDovL21vbml0b3IuYnJld2JlbmNoLmNvXFxuVmVyc2lvbiAnKyRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24rJyAnK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDpNTTpTUycpKycgZm9yICcrbmFtZSsnXFxuKi9cXG4nO1xuICAgICRodHRwLmdldCgnYXNzZXRzL2FyZHVpbm8vJytza2V0Y2grJy8nK3NrZXRjaCsnLmlubycpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIC8vIHJlcGxhY2UgdmFyaWFibGVzXG4gICAgICAgIHJlc3BvbnNlLmRhdGEgPSBhdXRvZ2VuK3Jlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0FDVElPTlNdJywgYWN0aW9ucy5sZW5ndGggPyBhY3Rpb25zLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtIRUFERVJTXScsIGhlYWRlcnMubGVuZ3RoID8gaGVhZGVycy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtWRVJTSU9OXFxdL2csICRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1RQTElOS19DT05ORUNUSU9OXFxdL2csIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbU0xBQ0tfQ09OTkVDVElPTlxcXS9nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayk7XG5cbiAgICAgICAgLy8gRVNQIHZhcmlhYmxlc1xuICAgICAgICBpZihza2V0Y2guaW5kZXhPZignRVNQJykgIT09IC0xKXtcbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWQpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1NJRFxcXS9nLCAkc2NvcGUuZXNwLnNzaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLnNzaWRfcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEX1BBU1NcXF0vZywgJHNjb3BlLmVzcC5zc2lkX3Bhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZigkc2NvcGUuZXNwLmFyZHVpbm9fcGFzcyl7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtBUkRVSU5PX1BBU1NcXF0vZywgbWQ1KCRzY29wZS5lc3AuYXJkdWlub19wYXNzKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FSRFVJTk9fUEFTU1xcXS9nLCBtZDUoJ2JiYWRtaW4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKCRzY29wZS5lc3AuaG9zdG5hbWUpe1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSE9TVE5BTUVcXF0vZywgJHNjb3BlLmVzcC5ob3N0bmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csICdiYmVzcCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCBuYW1lLnJlcGxhY2UoJy5sb2NhbCcsJycpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ1N0cmVhbXMnICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBzdHJlYW1zIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgaHR0cHM6Ly8keyRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lfS5ob3N0ZWQuYnJld2JlbmNoLmNvYDtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NUUkVBTVNfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleS50cmltKCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKCBza2V0Y2guaW5kZXhPZignQkZZdW4nICkgIT09IC0xKXtcbiAgICAgICAgICAvLyBiZiBhcGkga2V5IGhlYWRlclxuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0JGX0FVVEhcXF0vZywgJ1gtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuYmYuYXBpX2tleS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvYmJwJztcbiAgICAgICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IGh0dHBzXG4gICAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25fc3RyaW5nLmluZGV4T2YoJ2h0dHBzOicpID09PSAwKVxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nID0gY29ubmVjdGlvbl9zdHJpbmcucmVwbGFjZSgnaHR0cHM6JywnaHR0cDonKTtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCBidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FQSV9LRVlcXF0vZywgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zID0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIi1IXCIpKTtcXG4nO1xuICAgICAgICAgICAgICBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zICs9ICcgIHAuYWRkUGFyYW1ldGVyKEYoXCJYLUFQSS1LRVk6ICcrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MrJ1wiKSk7JztcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnLy8gYWRkaXRpb25hbF9wb3N0X3BhcmFtcycsIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLlRIQykge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBUSEMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEgfHwgaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcIkRIVGVzcC5oXCInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxEYWxsYXNUZW1wZXJhdHVyZS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERTMThCMjAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQURDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQk1QMDg1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQk1QMTgwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGFzVHJpZ2dlcnMpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyB0cmlnZ2VycyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgc2tldGNoKyctJytuYW1lKyctJyskc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKycuaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5ub3RpZnkgPSBmdW5jdGlvbihrZXR0bGUsdGltZXIpe1xuXG4gICAgLy9kb24ndCBzdGFydCBhbGVydHMgdW50aWwgd2UgaGF2ZSBoaXQgdGhlIHRlbXAudGFyZ2V0XG4gICAgaWYoIXRpbWVyICYmIGtldHRsZSAmJiAha2V0dGxlLnRlbXAuaGl0XG4gICAgICB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5vbiA9PT0gZmFsc2Upe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgdmFyIG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0gKGtldHRsZSAmJiBrZXR0bGUudGVtcCkgPyBrZXR0bGUudGVtcC5jdXJyZW50IDogMDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiAhIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZighIXRpbWVyICYmIGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgdmFyIHNuZCA9IG5ldyBBdWRpbygoISF0aW1lcikgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLm5hbWUgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJyl7XG4gICAgICBrZXR0bGUuY29vbGVyID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5wdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUucHVtcCA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUuY29vbGVyO1xuICAgIH1cbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1cGRhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUsJGluZGV4KXtcbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudXBkYXRlU3RyZWFtcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy91cGRhdGUgc3RyZWFtc1xuICAgIGlmKCRzY29wZS5zdHJlYW1zLmNvbm5lY3RlZCgpICYmIGtldHRsZS5ub3RpZnkuc3RyZWFtcyl7XG4gICAgICAkc2NvcGUuc3RyZWFtcy5rZXR0bGVzKGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uKCl7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSw1MDAwKTtcbiAgfVxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdkYm1QZXJjZW50JywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbihkYm0pe1xuICAgIHJldHVybiAyICogKGRibSArIDEwMCk7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDM1LjI3NCwgMik7XG4gIH07XG59KVxuLmZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChrZykge1xuICAgIGlmICh0eXBlb2Yga2cgPT09ICd1bmRlZmluZWQnIHx8IGlzTmFOKGtnKSkgcmV0dXJuICcnO1xuICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShrZyAqIDIuMjA0NjIsIDIpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFjY2Vzc1Rva2VuOiBmdW5jdGlvbih0b2tlbil7XG4gICAgICBpZih0b2tlbilcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLHRva2VuKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYWNjZXNzVG9rZW4nKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlfVxuICAgICAgICAsY2hhcnQ6IHtzaG93OiB0cnVlLCBtaWxpdGFyeTogZmFsc2UsIGFyZWE6IGZhbHNlfVxuICAgICAgICAsc2Vuc29yczoge0RIVDogZmFsc2UsIERTMThCMjA6IGZhbHNlLCBCTVA6IGZhbHNlfVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYXJkdWlub3M6IFt7aWQ6J2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksYm9hcmQ6JycsUlNTSTpmYWxzZSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlLHZlcnNpb246Jycsc3RhdHVzOntlcnJvcjonJyxkdDonJyxtZXNzYWdlOicnfX1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBzdGF0dXM6ICcnLCBwbHVnczogW119XG4gICAgICAgICxpbmZsdXhkYjoge3VybDogJycsIHBvcnQ6ICcnLCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBzdGF0dXM6ICcnfVxuICAgICAgICAsc3RyZWFtczoge3VzZXJuYW1lOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycsIHNlc3Npb246IHtpZDogJycsIG5hbWU6ICcnLCB0eXBlOiAnZmVybWVudGF0aW9uJ319XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdNYXNoJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ0JvaWwnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTInLHZjYzonJyxpbmRleDonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnQk1QMTgwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1RlbXAnLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J1NvaWwnLCd0eXBlJzonc2VlZGxpbmcnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonUGxhbnQnLCd0eXBlJzonY2FubmFiaXMnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vLCByZXR1cm5fdmVyc2lvbil7XG4gICAgICBpZihyZXR1cm5fdmVyc2lvbil7XG4gICAgICAgIGlmKGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCczMicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzMyJztcbiAgICAgICAgZWxzZSBpZihhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignODI2NicpICE9PSAtMSlcbiAgICAgICAgICByZXR1cm4gJzgyNjYnO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICEhKGFyZHVpbm8gJiYgYXJkdWluby5ib2FyZCAmJiAoYXJkdWluby5ib2FyZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2VzcCcpICE9PSAtMSB8fCBhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbm9kZW1jdScpICE9PSAtMSkpO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjb25uZWN0OiBmdW5jdGlvbihhcmR1aW5vLCBlbmRwb2ludCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oYXJkdWlubykrJy9hcmR1aW5vLycrZW5kcG9pbnQ7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSlcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGU7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJykgPT09IDApXG4gICAgICAgICAgdXJsICs9ICc/YXBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHVybCArPSAnP2RwaW49JytrZXR0bGUudGVtcC5waW47XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAudmNjICYmIFsnM1YnLCc1ViddLmluZGV4T2Yoa2V0dGxlLnRlbXAudmNjKSA9PT0gLTEpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MgJiYgWyczVicsJzVWJ10uaW5kZXhPZihrZXR0bGUudGVtcC52Y2MpID09PSAtMSkgLy9Tb2lsTW9pc3R1cmUgbG9naWNcbiAgICAgICAgICB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgICBlbHNlIGlmKCEha2V0dGxlLnRlbXAuaW5kZXgpIC8vRFMxOEIyMCBsb2dpY1xuICAgICAgICAgIHVybCArPSAnJmluZGV4PScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICAgIHVybCArPSAnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyByZWFkL3dyaXRlIGhlYXRlclxuICAgIC8vIGh0dHA6Ly9hcmR1aW5vdHJvbmljcy5ibG9nc3BvdC5jb20vMjAxMy8wMS93b3JraW5nLXdpdGgtc2FpbnNtYXJ0LTV2LXJlbGF5LWJvYXJkLmh0bWxcbiAgICAvLyBodHRwOi8vbXlob3d0b3NhbmRwcm9qZWN0cy5ibG9nc3BvdC5jb20vMjAxNC8wMi9zYWluc21hcnQtMi1jaGFubmVsLTV2LXJlbGF5LWFyZHVpbm8uaHRtbFxuICAgIGRpZ2l0YWw6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/ZHBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/YXBpbj0nK3NlbnNvcisnJnZhbHVlPScrdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgKz0gJy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwnO1xuICAgICAgaWYodGhpcy5pc0VTUChrZXR0bGUuYXJkdWlubykpe1xuICAgICAgICB1cmwgKz0gJz9kcGluPScrc2Vuc29yO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3I7XG4gICAgICB9XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG9hZFNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gJyc7XG4gICAgICBpZihwYXNzd29yZClcbiAgICAgICAgcXVlcnkgPSAnP3Bhc3N3b3JkPScrbWQ1KHBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2dldC8nK2ZpbGUrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gZmluaXNoIHRoaXNcbiAgICAvLyBkZWxldGVTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAvLyAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAvLyAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2RlbGV0ZS8nK2ZpbGUsIG1ldGhvZDogJ0dFVCd9KVxuICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgLy8gICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAvLyAgICAgICBxLnJlamVjdChlcnIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIHJldHVybiBxLnByb21pc2U7XG4gICAgLy8gfSxcblxuICAgIGNyZWF0ZVNoYXJlOiBmdW5jdGlvbihzaGFyZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGtldHRsZXMgPSB0aGlzLnNldHRpbmdzKCdrZXR0bGVzJyk7XG4gICAgICB2YXIgc2ggPSBPYmplY3QuYXNzaWduKHt9LCB7cGFzc3dvcmQ6IHNoYXJlLnBhc3N3b3JkLCBhY2Nlc3M6IHNoYXJlLmFjY2Vzc30pO1xuICAgICAgLy9yZW1vdmUgc29tZSB0aGluZ3Mgd2UgZG9uJ3QgbmVlZCB0byBzaGFyZVxuICAgICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0ua25vYjtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0udmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc3RyZWFtcztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5pbmZsdXhkYjtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy50cGxpbms7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5za2V0Y2hlcztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZC50cmltKCkpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS90ZXN0Lz8nK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBpcDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2lwJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZHdlZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbGF0ZXN0OiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvbGF0ZXN0L2R3ZWV0L2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYWxsOiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvZHdlZXRzL2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MudHBsaW5rLnRva2VuKXtcbiAgICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICAgIHJldHVybiB1cmwrJy8/JytqUXVlcnkucGFyYW0ocGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9LFxuICAgICAgICBsb2dpbjogKHVzZXIscGFzcykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZighdXNlciB8fCAhcGFzcylcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCBMb2dpbicpO1xuICAgICAgICAgIGNvbnN0IGxvZ2luX3BheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOiBcImxvZ2luXCIsXG4gICAgICAgICAgICBcInVybFwiOiB1cmwsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiYXBwVHlwZVwiOiBcIkthc2FfQW5kcm9pZFwiLFxuICAgICAgICAgICAgICBcImNsb3VkUGFzc3dvcmRcIjogcGFzcyxcbiAgICAgICAgICAgICAgXCJjbG91ZFVzZXJOYW1lXCI6IHVzZXIsXG4gICAgICAgICAgICAgIFwidGVybWluYWxVVUlEXCI6IHBhcmFtcy50ZXJtSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShsb2dpbl9wYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlblxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnJlc3VsdCl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdG9rZW4gPSB0b2tlbiB8fCBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7dG9rZW46IHRva2VufSxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6IFwiZ2V0RGV2aWNlTGlzdFwiIH0pLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjb21tYW5kOiAoZGV2aWNlLCBjb21tYW5kKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdmFyIHRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjpcInBhc3N0aHJvdWdoXCIsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiZGV2aWNlSWRcIjogZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgICAgICBcInJlcXVlc3REYXRhXCI6IEpTT04uc3RyaW5naWZ5KCBjb21tYW5kIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHNldCB0aGUgdG9rZW5cbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICBwYXJhbXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBkZXZpY2UuYXBwU2VydmVyVXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogKGRldmljZSwgdG9nZ2xlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiB0b2dnbGUgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHN0cmVhbXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiAnaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaScsIGhlYWRlcnM6IHt9LCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXV0aDogYXN5bmMgKHBpbmcpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmIHNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gKHBpbmcpID8gJy91c2Vycy9waW5nJyA6ICcvdXNlcnMvYXV0aCc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS2V5J10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1CQi1Vc2VyJ10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLmFjY2VzcyAmJiByZXNwb25zZS5kYXRhLmFjY2Vzcy5pZClcbiAgICAgICAgICAgICAgICAgIHRoaXMuYWNjZXNzVG9rZW4ocmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpO1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGtldHRsZXM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoa2V0dGxlKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXBkYXRlZEtldHRsZSA9IGFuZ3VsYXIuY29weShrZXR0bGUpO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG5vdCBuZWVkZWQgZGF0YVxuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudmFsdWVzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUubWVzc2FnZTtcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnRpbWVycztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLmtub2I7XG4gICAgICAgICAgICB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0ID0gKHNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEhdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzL2FybSc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbjogc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLFxuICAgICAgICAgICAgICBrZXR0bGU6IHVwZGF0ZWRLZXR0bGUsXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnM6IHNldHRpbmdzLm5vdGlmaWNhdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbnM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbklkOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGtldHRsZToga2V0dGxlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoc2Vzc2lvbikgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucy8nK3Nlc3Npb24uaWQ7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQQVRDSCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIG5hbWU6IHNlc3Npb24ubmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc2Vzc2lvbi50eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZighIXNldHRpbmdzLmluZmx1eGRiLnBvcnQgJiYgIXRoaXMuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhvc3RlZDogKHVybCkgPT4ge1xuICAgICAgICAgIHJldHVybiAodXJsLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xIHx8XG4gICAgICAgICAgICB1cmwuaW5kZXhPZignaG9zdGVkLmJyZXdiZW5jaC5jbycpICE9PSAtMSk7XG4gICAgICAgIH0sXG4gICAgICAgIHBpbmc6IChpbmZsdXhkYikgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVybCl7XG4gICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uID0gYCR7aW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgICBpZiggISFpbmZsdXhkYi5wb3J0ICYmICF0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgIGlmKHRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgPSBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYDtcbiAgICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVzZXIgJiYgaW5mbHV4ZGIucGFzcyl7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShpbmZsdXhkYi51c2VyLnRyaW0oKSsnOicraW5mbHV4ZGIucGFzcy50cmltKCkpfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgIGlmKHRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpe1xuICAgICAgICAgICAgcS5yZXNvbHZlKFtzZXR0aW5ncy5pbmZsdXhkYi51c2VyXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgIGlmKHRoaXMuaW5mbHV4ZGIoKS5ob3N0ZWQoaW5mbHV4Q29ubmVjdGlvbikpe1xuICAgICAgICAgICAgcS5yZWplY3QoJ0RhdGFiYXNlIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudChgQ1JFQVRFIERBVEFCQVNFIFwiJHtuYW1lfVwiYCl9YCwgbWV0aG9kOiAnUE9TVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogISFvcHRpb25zLnNlc3Npb24sXG4gICAgICAgICAgICAgICAgdGV4dDogISFvcHRpb25zLnNlc3Npb24gPyBvcHRpb25zLnNlc3Npb24gOiAnJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTW9uaXRvcicsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG4gICAgICAgICAgICAgIGludGVycG9sYXRlOiAnYmFzaXMnLFxuICAgICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBrZXk6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLm5hbWUgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpc0FyZWE6IGZ1bmN0aW9uIChkKSB7IHJldHVybiAhIW9wdGlvbnMuY2hhcnQuYXJlYSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoISFvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSDolTTolUycpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMlcCcpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCFvcHRpb25zLnVuaXQgfHwgb3B0aW9ucy51bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShkLDApKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICB2YXIgc2cgPSAoMSArIChwbGF0byAvICgyNTguNiAtICgocGxhdG8gLyAyNTguMikgKiAyMjcuMSkpKSk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZykudG9GaXhlZCgzKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0bykudG9GaXhlZCgyKTs7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoISFyZWNpcGUuRl9SX05BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUsMTApO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVCkrJyBsYicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ2tpbG9ncmFtc1RvUG91bmRzJykoZ3JhaW4uRl9HX0FNT1VOVClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkZfSF9BTU9VTlQpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5GX0hfQU1PVU5UKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuRl9IX0FNT1VOVClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcigna2lsb2dyYW1zVG9Qb3VuZHMnKShncmFpbi5BTU9VTlQpKycgbGInLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb1BvdW5kcycpKGdyYWluLkFNT1VOVCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcigna2lsb2dyYW1zVG9PdW5jZXMnKShob3AuQU1PVU5UKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ2tpbG9ncmFtc1RvT3VuY2VzJykoaG9wLkFNT1VOVCkrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdraWxvZ3JhbXNUb091bmNlcycpKGhvcC5BTU9VTlQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIHZhciBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==