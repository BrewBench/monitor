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
    hostname: '',
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
      BrewService.connect(arduino).then(function (info) {
        if (info && info.BrewBench) {
          event.srcElement.innerHTML = 'Connect';
          arduino.board = info.BrewBench.board;
          if (info.BrewBench.RSSI) arduino.RSSI = info.BrewBench.RSSI;
          arduino.version = info.BrewBench.version;
          arduino.status.dt = new Date();
          arduino.status.error = '';
          arduino.status.message = '';
          if (arduino.board.indexOf('ESP32') == 0) {
            arduino.analog = 0;
            arduino.digital = 33;
          } else if (arduino.board.indexOf('ESP8266') == 0) {
            arduino.analog = 0;
            arduino.digital = 10;
          }
        }
      }).catch(function (err) {
        if (err && err.status == -1) {
          arduino.status.dt = '';
          arduino.status.message = '';
          arduino.status.error = 'Could not connect';
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

  $scope.pinDisplay = function (pin) {
    if (pin.indexOf('TP-') === 0) {
      var device = _.filter($scope.settings.tplink.plugs, { deviceId: pin.substr(3) })[0];
      return device ? device.alias : '';
    } else return pin;
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
    if (btn.hasClass('fa-trash')) btn = btn.parent();

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
      currentSketch.actions.push('actionsCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettleType + '"),' + adjust + ');');
      //look for triggers
      if (kettle.heater && kettle.heater.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('trigger(F("heat"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      }
      if (kettle.cooler && kettle.cooler.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('trigger(F("cool"),F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
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
    var autogen = '/* Sketch Auto Generated from http://monitor.brewbench.co on ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + ' */\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = autogen + response.data.replace('// [ACTIONS]', actions.length ? actions.join('\n') : '').replace('// [HEADERS]', headers.length ? headers.join('\n') : '').replace(/\[VERSION\]/g, $scope.pkg.sketch_version).replace(/\[TPLINK_CONNECTION\]/g, tplink_connection_string).replace(/\[SLACK_CONNECTION\]/g, $scope.settings.notifications.slack);

      if ($scope.esp.ssid) {
        response.data = response.data.replace(/\[SSID\]/g, $scope.esp.ssid);
      }
      if ($scope.esp.ssid_pass) {
        response.data = response.data.replace(/\[SSID_PASS\]/g, $scope.esp.ssid_pass);
      }
      if (sketch.indexOf('ESP') !== -1 && $scope.esp.hostname) {
        response.data = response.data.replace(/\[HOSTNAME\]/g, $scope.esp.hostname);
      } else if (sketch.indexOf('ESP') !== -1) {
        response.data = response.data.replace(/\[HOSTNAME\]/g, 'bbesp');
      } else {
        response.data = response.data.replace(/\[HOSTNAME\]/g, name);
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
      streamSketch.setAttribute('download', sketch + '-' + name + '.ino');
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
      var kettles = [{ 'name': 'Boil', 'type': 'hop', 'target': 200, 'diff': 2 }, { 'name': 'Mash', 'type': 'grain', 'target': 152, 'diff': 2 }, { 'name': 'Hot Liquor', 'type': 'water', 'target': 170, 'diff': 2 }, { 'name': 'Fermenter', 'type': 'fermenter', 'target': 74, 'diff': 2 }, { 'name': 'Temp', 'type': 'air', 'target': 74, 'diff': 2 }, { 'name': 'Soil', 'type': 'leaf', 'target': 60, 'diff': 2 }];
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

    isESP: function isESP(arduino) {
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

    connect: function connect(arduino) {
      var q = $q.defer();
      var url = this.domain(arduino) + '/arduino/info';
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
        if (!!kettle.temp.vcc) //SoilMoisture logic
          url += '&dpin=' + kettle.temp.vcc;else if (!!kettle.temp.index) //DS18B20 logic
          url += '&index=' + kettle.temp.index;
      } else {
        if (!!kettle.temp.vcc) //SoilMoisture logic
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJlc3AiLCJ0eXBlIiwic3NpZCIsInNzaWRfcGFzcyIsImhvc3RuYW1lIiwiYXV0b2Nvbm5lY3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xpZGVyIiwibWluIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInN0ZXAiLCJ0cmFuc2xhdGUiLCJ2YWx1ZSIsIm9uRW5kIiwia2V0dGxlSWQiLCJtb2RlbFZhbHVlIiwiaGlnaFZhbHVlIiwicG9pbnRlclR5cGUiLCJrZXR0bGUiLCJzcGxpdCIsImsiLCJrZXR0bGVzIiwiaGVhdGVyIiwiY29vbGVyIiwicHVtcCIsImFjdGl2ZSIsInB3bSIsInJ1bm5pbmciLCJ0b2dnbGVSZWxheSIsImdldEtldHRsZVNsaWRlck9wdGlvbnMiLCJpbmRleCIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiZ2V0TG92aWJvbmRDb2xvciIsInJhbmdlIiwicmVwbGFjZSIsImluZGV4T2YiLCJyQXJyIiwicGFyc2VGbG9hdCIsImwiLCJfIiwiZmlsdGVyIiwiaXRlbSIsInNybSIsImhleCIsImxlbmd0aCIsInNldHRpbmdzIiwicmVzZXQiLCJnZW5lcmFsIiwiY2hhcnRPcHRpb25zIiwidW5pdCIsImNoYXJ0Iiwic2Vzc2lvbiIsInN0cmVhbXMiLCJkZWZhdWx0S2V0dGxlcyIsInNoYXJlIiwicGFyYW1zIiwiZmlsZSIsInBhc3N3b3JkIiwibmVlZFBhc3N3b3JkIiwiYWNjZXNzIiwiZGVsZXRlQWZ0ZXIiLCJvcGVuU2tldGNoZXMiLCIkIiwibW9kYWwiLCJzdW1WYWx1ZXMiLCJvYmoiLCJzdW1CeSIsInVwZGF0ZUFCViIsInJlY2lwZSIsInNjYWxlIiwibWV0aG9kIiwiYWJ2Iiwib2ciLCJmZyIsImFidmEiLCJhYnciLCJhdHRlbnVhdGlvbiIsInBsYXRvIiwiY2Fsb3JpZXMiLCJyZSIsInNnIiwiY2hhbmdlTWV0aG9kIiwiY2hhbmdlU2NhbGUiLCJnZXRTdGF0dXNDbGFzcyIsInN0YXR1cyIsImVuZHNXaXRoIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJib2FyZCIsIlJTU0kiLCJhbmFsb2ciLCJkaWdpdGFsIiwiYWRjIiwic2VjdXJlIiwidmVyc2lvbiIsImR0IiwiZWFjaCIsImFyZHVpbm8iLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJjb25uZWN0IiwidGhlbiIsImluZm8iLCJCcmV3QmVuY2giLCJldmVudCIsInNyY0VsZW1lbnQiLCJpbm5lckhUTUwiLCJjYXRjaCIsImVyciIsInRwbGluayIsImxvZ2luIiwidXNlciIsInBhc3MiLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsInNldEVycm9yTWVzc2FnZSIsIm1zZyIsInBsdWdzIiwiZGV2aWNlTGlzdCIsInBsdWciLCJyZXNwb25zZURhdGEiLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImVtZXRlciIsImdldF9yZWFsdGltZSIsImVycl9jb2RlIiwicG93ZXIiLCJkZXZpY2UiLCJ0b2dnbGUiLCJvZmZPck9uIiwicmVsYXlfc3RhdGUiLCJhZGRLZXR0bGUiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJoaXQiLCJtZWFzdXJlZCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZvbHRzIiwidmFsdWVzIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJjb3VudCIsIm5vdGlmeSIsInNsYWNrIiwiZHdlZXQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwicGluRGlzcGxheSIsImRldmljZUlkIiwic3Vic3RyIiwiYWxpYXMiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNoYW5nZVNlbnNvciIsInNlbnNvclR5cGVzIiwicGVyY2VudCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwiZW1haWwiLCJzaGFyZV9zdGF0dXMiLCJzaGFyZV9zdWNjZXNzIiwic2hhcmVfbGluayIsInNoYXJlVGVzdCIsInRlc3RpbmciLCJodHRwX2NvZGUiLCJwdWJsaWMiLCJpbmZsdXhkYiIsImJyZXdiZW5jaEhvc3RlZCIsImhvc3RlZCIsInJlbW92ZSIsImRlZmF1bHRTZXR0aW5ncyIsInBpbmciLCJyZW1vdmVDbGFzcyIsImRiIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJhZGRDbGFzcyIsImNyZWF0ZSIsIm1vbWVudCIsImZvcm1hdCIsImNyZWF0ZWQiLCJjcmVhdGVEQiIsImRhdGEiLCJyZXN1bHRzIiwicmVzZXRFcnJvciIsImNvbm5lY3RlZCIsInVzZXJuYW1lIiwiYXBpX2tleSIsImF1dGgiLCJyZWxheSIsInNhdmUiLCJrZXR0bGVSZXNwb25zZSIsIm1lcmdlIiwiY29uc29sZSIsInNlc3Npb25zIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwib24iLCJoaWdoIiwibG93IiwibGFzdCIsInN1YlRleHQiLCJlbmFibGVkIiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsInRydXN0QXNIdG1sIiwia2V5cyIsInN0YXR1c1RleHQiLCJzdHJpbmdpZnkiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwia2V5IiwidGVtcHMiLCJpc0VTUCIsInNoaWZ0IiwiYWx0aXR1ZGUiLCJwcmVzc3VyZSIsImN1cnJlbnRWYWx1ZSIsInVuaXRUeXBlIiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJzZW5zb3JzIiwic2tldGNoZXMiLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJhY3Rpb25zIiwidHJpZ2dlcnMiLCJESFQiLCJEUzE4QjIwIiwiQk1QIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwidHJpbSIsImFkZGl0aW9uYWxfcG9zdF9wYXJhbXMiLCJwb3J0Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsInVwZGF0ZVN0cmVhbXMiLCJjaGFuZ2VVbml0cyIsInYiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwicmVtb3ZlS2V0dGxlIiwiJGluZGV4IiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsInVwZGF0ZUxvY2FsIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsInRvTG93ZXJDYXNlIiwib25sb2FkIiwib25Mb2FkRXZlbnQiLCJyZXN1bHQiLCJ2YWwiLCJyZWFkQXNUZXh0IiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwiZGVjaW1hbHMiLCJOdW1iZXIiLCJwaHJhc2UiLCJSZWdFeHAiLCJ0b1N0cmluZyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJkYm0iLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImFjY2Vzc1Rva2VuIiwic2V0SXRlbSIsImdldEl0ZW0iLCJkZWJ1ZyIsInNob3ciLCJtaWxpdGFyeSIsImFyZWEiLCJyZWFkT25seSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwicmVzb2x2ZSIsInJlamVjdCIsInByb21pc2UiLCJyZXF1ZXN0Iiwid2l0aENyZWRlbnRpYWxzIiwic2Vuc29yIiwiZGlnaXRhbFJlYWQiLCJxdWVyeSIsIm1kNSIsInNoIiwibGF0ZXN0IiwiYXBwTmFtZSIsInRlcm1JRCIsImFwcFZlciIsIm9zcGYiLCJuZXRUeXBlIiwibG9jYWxlIiwialF1ZXJ5IiwicGFyYW0iLCJsb2dpbl9wYXlsb2FkIiwiY29tbWFuZCIsInBheWxvYWQiLCJhcHBTZXJ2ZXJVcmwiLCJ1cGRhdGVkS2V0dGxlIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJsbiIsImxvZyIsImtlbHZpbiIsInN0ZWluaGFydCIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJ0aXRsZSIsImVuYWJsZSIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxr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QU9vZSxTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRMWlCLE9BQVIsQ0FBZ0I4aUIsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVEzaUIsT0FBUixDQUFnQnVZLE9BQU93SyxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQXJxREksR0FBUDtBQXVxREQsQ0ExcURELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6TW9kdWxlJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGw7XG52YXIgcmVzZXRDaGFydCA9IDEwMDtcbnZhciB0aW1lb3V0ID0gbnVsbDsgLy9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogISEoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuZXNwID0ge1xuICB0eXBlOiAnODI2NicsXG4gIHNzaWQ6ICcnLFxuICBzc2lkX3Bhc3M6ICcnLFxuICBob3N0bmFtZTogJycsXG4gIGF1dG9jb25uZWN0OiBmYWxzZVxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLm9wZW5Ta2V0Y2hlcyA9IGZ1bmN0aW9uKCl7XG4gICQoJyNzZXR0aW5nc01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgJCgnI3NrZXRjaGVzTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xufTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYm9hcmQ6ICcnLFxuICAgICAgICBSU1NJOiBmYWxzZSxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgYWRjOiAwLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7ZXJyb3I6ICcnLGR0OiAnJyxtZXNzYWdlOicnfVxuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKGFyZHVpbm8pID0+IHtcbiAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgYXJkdWluby5zdGF0dXMubWVzc2FnZSA9ICdDb25uZWN0aW5nLi4uJztcbiAgICAgIEJyZXdTZXJ2aWNlLmNvbm5lY3QoYXJkdWlubylcbiAgICAgICAgLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLkJyZXdCZW5jaCl7XG4gICAgICAgICAgICBldmVudC5zcmNFbGVtZW50LmlubmVySFRNTCA9ICdDb25uZWN0JztcbiAgICAgICAgICAgIGFyZHVpbm8uYm9hcmQgPSBpbmZvLkJyZXdCZW5jaC5ib2FyZDtcbiAgICAgICAgICAgIGlmKGluZm8uQnJld0JlbmNoLlJTU0kpXG4gICAgICAgICAgICAgIGFyZHVpbm8uUlNTSSA9IGluZm8uQnJld0JlbmNoLlJTU0k7XG4gICAgICAgICAgICBhcmR1aW5vLnZlcnNpb24gPSBpbmZvLkJyZXdCZW5jaC52ZXJzaW9uO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYXJkdWluby5zdGF0dXMuZXJyb3IgPSAnJztcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLm1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uYm9hcmQuaW5kZXhPZignRVNQMzInKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAzMztcbiAgICAgICAgICAgIH0gZWxzZSBpZihhcmR1aW5vLmJvYXJkLmluZGV4T2YoJ0VTUDgyNjYnKSA9PSAwKXtcbiAgICAgICAgICAgICAgYXJkdWluby5hbmFsb2cgPSAwO1xuICAgICAgICAgICAgICBhcmR1aW5vLmRpZ2l0YWwgPSAxMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuc3RhdHVzID09IC0xKXtcbiAgICAgICAgICAgIGFyZHVpbm8uc3RhdHVzLmR0ID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5tZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBhcmR1aW5vLnN0YXR1cy5lcnJvciA9ICdDb3VsZCBub3QgY29ubmVjdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKCEhcGx1Zy5zdGF0dXMpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgdmFyIG9mZk9yT24gPSBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxID8gMCA6IDE7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS50b2dnbGUoZGV2aWNlLCBvZmZPck9uKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSBvZmZPck9uO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS50aGVuKHRvZ2dsZVJlc3BvbnNlID0+IHtcbiAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5mb1xuICAgICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICBkZXZpY2UuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgdmFyIGFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfTtcbiAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCxkaWZmOiRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogYXJkdWlub1xuICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBwaW47XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCl7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwQjAnO1xuICAgIH1cbiAgICBrZXR0bGUudGVtcC52Y2MgPSAnJztcbiAgICBrZXR0bGUudGVtcC5pbmRleCA9ICcnO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlVGVzdCA9IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgIGFyZHVpbm8udGVzdGluZyA9IHRydWU7XG4gICAgQnJld1NlcnZpY2Uuc2hhcmVUZXN0KGFyZHVpbm8pXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5odHRwX2NvZGUgPT0gMjAwKVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmluZmx1eGRiID0ge1xuICAgIGJyZXdiZW5jaEhvc3RlZDogKCkgPT4ge1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuaG9zdGVkKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmwpO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vZ2V0IGxpc3Qgb2YgZGF0YWJhc2VzXG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN0cmVhbXMgPSB7XG4gICAgY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gKCEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgJiZcbiAgICAgICAgISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcyA9IGRlZmF1bHRTZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5KVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmF1dGgodHJ1ZSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGtldHRsZXM6IChrZXR0bGUsIHJlbGF5KSA9PiB7XG4gICAgICBpZihyZWxheSl7XG4gICAgICAgIGtldHRsZVtyZWxheV0uc2tldGNoID0gIWtldHRsZVtyZWxheV0uc2tldGNoO1xuICAgICAgICBpZigha2V0dGxlLm5vdGlmeS5zdHJlYW1zKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gJ3NrZXRjaGVzJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnaW5mbyc7XG4gICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAwO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5rZXR0bGVzLnNhdmUoa2V0dGxlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgdmFyIGtldHRsZVJlc3BvbnNlID0gcmVzcG9uc2Uua2V0dGxlO1xuICAgICAgICAgIC8vIHVwZGF0ZSBrZXR0bGUgdmFyc1xuICAgICAgICAgIGtldHRsZS5pZCA9IGtldHRsZVJlc3BvbnNlLmlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBhcmR1aW5vIGlkXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywgYXJkdWlubyA9PiB7XG4gICAgICAgICAgICBpZihhcmR1aW5vLmlkID09IGtldHRsZS5hcmR1aW5vLmlkKVxuICAgICAgICAgICAgICBhcmR1aW5vLmlkID0ga2V0dGxlUmVzcG9uc2UuZGV2aWNlSWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICAvLyB1cGRhdGUgc2Vzc2lvbiB2YXJzXG4gICAgICAgICAgXy5tZXJnZSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLCBrZXR0bGVSZXNwb25zZS5zZXNzaW9uKTtcblxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnc3VjY2Vzcyc7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zID0gIWtldHRsZS5ub3RpZnkuc3RyZWFtcztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAxO1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuZGF0YSAmJiBlcnIuZGF0YS5lcnJvciAmJiBlcnIuZGF0YS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLmRhdGEuZXJyb3IubWVzc2FnZSwga2V0dGxlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JyZXdCZW5jaCBTdHJlYW1zIEVycm9yJywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2Vzc2lvbnM6IHtcbiAgICAgIHNhdmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5zZXNzaW9ucy5zYXZlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuXG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5zaGFyZUFjY2VzcyA9IGZ1bmN0aW9uKGFjY2Vzcyl7XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQgPSB0cnVlO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5sb2FkU2hhcmVGaWxlKCRzY29wZS5zaGFyZS5maWxlLCAkc2NvcGUuc2hhcmUucGFzc3dvcmQgfHwgbnVsbClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGlmKGNvbnRlbnRzKXtcbiAgICAgICAgICBpZihjb250ZW50cy5uZWVkUGFzc3dvcmQpe1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IHRydWU7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncy5yZWNpcGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlID0gY29udGVudHMuc2V0dGluZ3MucmVjaXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gZmFsc2U7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zaGFyZSAmJiBjb250ZW50cy5zaGFyZS5hY2Nlc3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2hhcmUuYWNjZXNzID0gY29udGVudHMuc2hhcmUuYWNjZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBjb250ZW50cy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMgPSB7b246ZmFsc2UsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMua2V0dGxlcyl7XG4gICAgICAgICAgICAgIF8uZWFjaChjb250ZW50cy5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAgICAgICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMDArNSxzdWJUZXh0OntlbmFibGVkOiB0cnVlLHRleHQ6ICdzdGFydGluZy4uLicsY29sb3I6ICdncmF5Jyxmb250OiAnYXV0byd9fSk7XG4gICAgICAgICAgICAgICAga2V0dGxlLnZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXMgPSBjb250ZW50cy5rZXR0bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBsb2FkaW5nIHRoZSBzaGFyZWQgc2Vzc2lvbi5cIik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoISFmb3JtYXR0ZWRfY29udGVudCl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZighIWpzb25PYmouUmVjaXBlcyAmJiAhIWpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoISFqc29uT2JqLlNlbGVjdGlvbnMgJiYgISFqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZighIWpzb25PYmouUkVDSVBFUyAmJiAhIWpzb25PYmouUkVDSVBFUy5SRUNJUEUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZighIXJlY2lwZS5vZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKCEhcmVjaXBlLmZnKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChncmFpbi5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogZ3JhaW4ubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChncmFpbi5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChob3AuYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBob3AubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChob3AuYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5wa2coKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucGtnID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuZ3JhaW5zKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ3dhcm5pbmcnO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdUaGUgbW9uaXRvciBzZWVtcyB0byBiZSBvZmYtbGluZSwgcmUtY29ubmVjdGluZy4uLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZighIWVyci5zdGF0dXNUZXh0KVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgaWYobG9jYXRpb24pXG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwgbWVzc2FnZSk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWApO1xuICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoISFrZXR0bGUudGVtcC5jdXJyZW50KVxuICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIC8vIHRlbXAgcmVzcG9uc2UgaXMgaW4gQ1xuICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnRlbXAsMik7XG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICAvLyBzZXQgcmF3XG4gICAga2V0dGxlLnRlbXAucmF3ID0gcmVzcG9uc2UucmF3O1xuICAgIGtldHRsZS50ZW1wLnZvbHRzID0gcmVzcG9uc2Uudm9sdHM7XG5cbiAgICAvLyB2b2x0IGNoZWNrXG4gICAgaWYoa2V0dGxlLnRlbXAudm9sdHMpe1xuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3RvcicgJiZcbiAgICAgICAga2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKSA9PT0gMCAmJlxuICAgICAgICAhQnJld1NlcnZpY2UuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pICYmXG4gICAgICAgIGtldHRsZS50ZW1wLnZvbHRzIDwgMil7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSAhPSAnQk1QMTgwJyAmJlxuICAgICAgIWtldHRsZS50ZW1wLnZvbHRzICYmXG4gICAgICAha2V0dGxlLnRlbXAucmF3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdEUzE4QjIwJyAmJlxuICAgICAgcmVzcG9uc2UudGVtcCA9PSAtMTI3KXtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcy5zaGlmdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQgc2Vuc29ycyBoYXZlIGh1bWlkaXR5IGFzIGEgcGVyY2VudFxuICAgIC8vU29pbE1vaXN0dXJlRCBoYXMgbW9pc3R1cmUgYXMgYSBwZXJjZW50XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5wZXJjZW50ID0gcmVzcG9uc2UucGVyY2VudDtcbiAgICB9XG4gICAgLy8gQk1QIHNlbnNvcnMgaGF2ZSBhbHRpdHVkZSBhbmQgcHJlc3N1cmVcbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLmFsdGl0dWRlICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5hbHRpdHVkZSA9IHJlc3BvbnNlLmFsdGl0dWRlO1xuICAgIH1cbiAgICBpZiggdHlwZW9mIHJlc3BvbnNlLnByZXNzdXJlICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIC8vIHBhc2NhbCB0byBpbmNoZXMgb2YgbWVyY3VyeVxuICAgICAga2V0dGxlLnByZXNzdXJlID0gcmVzcG9uc2UucHJlc3N1cmUgLyAzMzg2LjM4OTtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZSwgc2tldGNoX3ZlcnNpb246cmVzcG9uc2Uuc2tldGNoX3ZlcnNpb259KTtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFjayB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5zZW5zb3JzKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnNlbnNvcnMgPSB7fTtcbiAgICAvLyBhcHBlbmQgZXNwIHR5cGVcbiAgICBpZihza2V0Y2hOYW1lLmluZGV4T2YoJ0VTUCcpICE9PSAtMSlcbiAgICAgIHNrZXRjaE5hbWUgKz0gJHNjb3BlLmVzcC50eXBlO1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWluby51cmwucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIik7XG4gICAgICB2YXIgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICBoZWFkZXJzOiBbXSxcbiAgICAgICAgICB0cmlnZ2VyczogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIWtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSAmJiAkc2NvcGUuZXNwLmF1dG9jb25uZWN0KXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBdXRvQ29ubmVjdC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoKHNrZXRjaE5hbWUuaW5kZXhPZignRVNQJykgIT09IC0xIHx8IEJyZXdTZXJ2aWNlLmlzRVNQKGtldHRsZS5hcmR1aW5vKSkgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpID09PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZWVnZWUtdG9reW8vREhUZXNwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiREhUZXNwLmhcIicpO1xuICAgICAgfSBlbHNlIGlmKCFCcmV3U2VydmljZS5pc0VTUChrZXR0bGUuYXJkdWlubykgJiZcbiAgICAgICAgKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRIVCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSkgJiZcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRsaWItMS4yLjkuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkRTMThCMjAgfHwga2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xKXtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxPbmVXaXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8T25lV2lyZS5oPicpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPERhbGxhc1RlbXBlcmF0dXJlLmg+JykgPT09IC0xKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zZW5zb3JzLkJNUCB8fCBrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0JNUDE4MCcpICE9PSAtMSl7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8V2lyZS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPFdpcmUuaD4nKTtcbiAgICAgICAgaWYoY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxBZGFmcnVpdF9CTVAwODUuaD4nKTtcbiAgICAgIH1cbiAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL2dpdGh1Yi5jb20vYWRhZnJ1aXQvQWRhZnJ1aXRfQURTMVgxNScpO1xuICAgICAgICBpZihjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPE9uZVdpcmUuaD4nKSA9PT0gLTEpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGlmKGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSlcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKTtcbiAgICAgIH1cbiAgICAgIHZhciBrZXR0bGVUeXBlID0ga2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmKGtldHRsZS50ZW1wLnZjYykga2V0dGxlVHlwZSArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICBpZihrZXR0bGUudGVtcC5pbmRleCkga2V0dGxlVHlwZSArPSAnLScra2V0dGxlLnRlbXAuaW5kZXg7XG4gICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnYWN0aW9uc0NvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKSxGKFwiJytrZXR0bGVUeXBlKydcIiksJythZGp1c3QrJyk7Jyk7XG4gICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJoZWF0XCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJjb29sXCIpLEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBpZihza2V0Y2gudHJpZ2dlcnMpe1xuICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCB0ZW1wID0gMC4wMDsnKVxuICAgICAgICAvLyB1cGRhdGUgYXV0b0NvbW1hbmRcbiAgICAgICAgZm9yKHZhciBhID0gMDsgYSA8IHNrZXRjaC5hY3Rpb25zLmxlbmd0aDsgYSsrKXtcbiAgICAgICAgICBpZihza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSlcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsJ3RlbXAgPSBhY3Rpb25zQ29tbWFuZCgnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLyogU2tldGNoIEF1dG8gR2VuZXJhdGVkIGZyb20gaHR0cDovL21vbml0b3IuYnJld2JlbmNoLmNvIG9uICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKycgKi9cXG4nO1xuICAgICRodHRwLmdldCgnYXNzZXRzL2FyZHVpbm8vJytza2V0Y2grJy8nK3NrZXRjaCsnLmlubycpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIC8vIHJlcGxhY2UgdmFyaWFibGVzXG4gICAgICAgIHJlc3BvbnNlLmRhdGEgPSBhdXRvZ2VuK3Jlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW0FDVElPTlNdJywgYWN0aW9ucy5sZW5ndGggPyBhY3Rpb25zLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFtIRUFERVJTXScsIGhlYWRlcnMubGVuZ3RoID8gaGVhZGVycy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtWRVJTSU9OXFxdL2csICRzY29wZS5wa2cuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1RQTElOS19DT05ORUNUSU9OXFxdL2csIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbU0xBQ0tfQ09OTkVDVElPTlxcXS9nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayk7XG5cbiAgICAgICAgaWYoJHNjb3BlLmVzcC5zc2lkKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTU0lEXFxdL2csICRzY29wZS5lc3Auc3NpZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoJHNjb3BlLmVzcC5zc2lkX3Bhc3Mpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NTSURfUEFTU1xcXS9nLCAkc2NvcGUuZXNwLnNzaWRfcGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc2tldGNoLmluZGV4T2YoJ0VTUCcpICE9PSAtMSAmJiAkc2NvcGUuZXNwLmhvc3RuYW1lKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtIT1NUTkFNRVxcXS9nLCAkc2NvcGUuZXNwLmhvc3RuYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csICdiYmVzcCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0hPU1ROQU1FXFxdL2csIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignU3RyZWFtcycpICE9PSAtMSl7XG4gICAgICAgICAgLy8gc3RyZWFtcyBjb25uZWN0aW9uXG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYGh0dHBzOi8vJHskc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX0uaG9zdGVkLmJyZXdiZW5jaC5jb2A7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1RSRUFNU19DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0FVVEhcXF0vZywgJ0F1dGhvcml6YXRpb246IEJhc2ljICcrYnRvYSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZS50cmltKCkrJzonKyRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkudHJpbSgpKSk7XG4gICAgICAgIH0gaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvYmJwJztcbiAgICAgICAgICAgIGlmKHNrZXRjaC5pbmRleE9mKCdFU1AnKSAhPT0gLTEpe1xuICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IGh0dHBzXG4gICAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25fc3RyaW5nLmluZGV4T2YoJ2h0dHBzOicpID09PSAwKVxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nID0gY29ubmVjdGlvbl9zdHJpbmcucmVwbGFjZSgnaHR0cHM6JywnaHR0cDonKTtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCBidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0FQSV9LRVlcXF0vZywgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zID0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIi1IXCIpKTtcXG4nO1xuICAgICAgICAgICAgICBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zICs9ICcgIHAuYWRkUGFyYW1ldGVyKEYoXCJYLUFQSS1LRVk6ICcrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MrJ1wiKSk7JztcbiAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnLy8gYWRkaXRpb25hbF9wb3N0X3BhcmFtcycsIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xIHx8IGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJESFRlc3AuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8RGFsbGFzVGVtcGVyYXR1cmUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEFEQyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0JNUDA4NS5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIEJNUDE4MCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzdHJlYW1Ta2V0Y2gpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIHZhciBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IChrZXR0bGUgJiYga2V0dGxlLnRlbXApID8ga2V0dGxlLnRlbXAuY3VycmVudCA6IDA7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZihrZXR0bGUgJiYgISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcrY3VycmVudFZhbHVlK3VuaXRUeXBlO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBtZWFzdXJlZCBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5zbGFjaygkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIGljb24sXG4gICAgICAgICAga2V0dGxlXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgaWYoZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7SlNPTi5zdHJpbmdpZnkoZXJyKX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVLbm9iQ29weSA9IGZ1bmN0aW9uKGtldHRsZSl7XG5cbiAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnbm90IHJ1bm5pbmcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLm1lc3NhZ2UubWVzc2FnZSAmJiBrZXR0bGUubWVzc2FnZS50eXBlID09ICdkYW5nZXInKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9XG4gICAgLy9pcyBjdXJyZW50VmFsdWUgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBjdXJyZW50VmFsdWUta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWN1cnJlbnRWYWx1ZTtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVW5pdHMgPSBmdW5jdGlvbih1bml0KXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ICE9IHVuaXQpe1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC50YXJnZXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5jdXJyZW50KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5tZWFzdXJlZCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAucHJldmlvdXMsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC50YXJnZXQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAudGFyZ2V0LDApO1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLmFkanVzdCl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0LCBzZXNzaW9uOiAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9ufSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggISFrZXR0bGUgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKCEha2V0dGxlKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy9vbmx5IHByb2Nlc3MgYWN0aXZlIHNlbnNvcnNcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrLCBpKSA9PiB7XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5hY3RpdmUpe1xuICAgICAgICBhbGxTZW5zb3JzLnB1c2goQnJld1NlcnZpY2UudGVtcCgkc2NvcGUua2V0dGxlc1tpXSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwgJHNjb3BlLmtldHRsZXNbaV0pKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdXBkYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudClcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQrKztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50ID09IDcpe1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0wO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwgJHNjb3BlLmtldHRsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEuYWxsKGFsbFNlbnNvcnMpXG4gICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAvL3JlIHByb2Nlc3Mgb24gdGltZW91dFxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlLCRpbmRleCl7XG4gICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgICAkc2NvcGUua2V0dGxlcy5zcGxpY2UoJGluZGV4LDEpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIGlmKGZpZWxkID09ICdhZGp1c3QnKXtcbiAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIH1cblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIC8vdXBkYXRlIHN0cmVhbXNcbiAgICBpZigkc2NvcGUuc3RyZWFtcy5jb25uZWN0ZWQoKSAmJiBrZXR0bGUubm90aWZ5LnN0cmVhbXMpe1xuICAgICAgJHNjb3BlLnN0cmVhbXMua2V0dGxlcyhrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoISFsb2FkZWQpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuXG4gIC8vIHVwZGF0ZSBsb2NhbCBjYWNoZVxuICAkc2NvcGUudXBkYXRlTG9jYWwgPSBmdW5jdGlvbigpe1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLCAkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLCRzY29wZS5rZXR0bGVzKTtcbiAgICAgICRzY29wZS51cGRhdGVMb2NhbCgpO1xuICAgIH0sNTAwMCk7XG4gIH1cbiAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gISFzY29wZS50eXBlID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cblx0XHRcdGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKG9uQ2hhbmdlRXZlbnQpIHtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgZWxlbWVudC52YWwobnVsbCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICBjZWxzaXVzID0gcGFyc2VGbG9hdChjZWxzaXVzKTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKShjZWxzaXVzKjkvNSszMiwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgZmFocmVuaGVpdCA9IHBhcnNlRmxvYXQoZmFocmVuaGVpdCk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoKGZhaHJlbmhlaXQtMzIpKjUvOSwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdyb3VuZCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbCxkZWNpbWFscykge1xuICAgIHJldHVybiBOdW1iZXIoKE1hdGgucm91bmQodmFsICsgXCJlXCIgKyBkZWNpbWFscykgICsgXCJlLVwiICsgZGVjaW1hbHMpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0aXRsZWNhc2UnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQpe1xuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRleHQuc2xpY2UoMSkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2RibVBlcmNlbnQnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRibSl7XG4gICAgcmV0dXJuIDIgKiAoZGJtICsgMTAwKTtcbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2ZpbHRlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZhY3RvcnkoJ0JyZXdTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkZmlsdGVyKXtcblxuICByZXR1cm4ge1xuXG4gICAgLy9jb29raWVzIHNpemUgNDA5NiBieXRlc1xuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xuICAgICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSl7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2V0dGluZ3MnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdrZXR0bGVzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2hhcmUnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBhY2Nlc3NUb2tlbjogZnVuY3Rpb24odG9rZW4pe1xuICAgICAgaWYodG9rZW4pXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FjY2Vzc1Rva2VuJyx0b2tlbik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgZGVmYXVsdFNldHRpbmdzID0ge1xuICAgICAgICBnZW5lcmFsOiB7ZGVidWc6IGZhbHNlLCBwb2xsU2Vjb25kczogMTAsIHVuaXQ6ICdGJywgc2hhcmVkOiBmYWxzZX1cbiAgICAgICAgLGNoYXJ0OiB7c2hvdzogdHJ1ZSwgbWlsaXRhcnk6IGZhbHNlLCBhcmVhOiBmYWxzZX1cbiAgICAgICAgLHNlbnNvcnM6IHtESFQ6IGZhbHNlLCBEUzE4QjIwOiBmYWxzZSwgQk1QOiBmYWxzZX1cbiAgICAgICAgLHJlY2lwZTogeyduYW1lJzonJywnYnJld2VyJzp7bmFtZTonJywnZW1haWwnOicnfSwneWVhc3QnOltdLCdob3BzJzpbXSwnZ3JhaW5zJzpbXSxzY2FsZTonZ3Jhdml0eScsbWV0aG9kOidwYXBhemlhbicsJ29nJzoxLjA1MCwnZmcnOjEuMDEwLCdhYnYnOjAsJ2Fidyc6MCwnY2Fsb3JpZXMnOjAsJ2F0dGVudWF0aW9uJzowfVxuICAgICAgICAsbm90aWZpY2F0aW9uczoge29uOnRydWUsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9XG4gICAgICAgICxzb3VuZHM6IHtvbjp0cnVlLGFsZXJ0OicvYXNzZXRzL2F1ZGlvL2Jpa2UubXAzJyx0aW1lcjonL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJ31cbiAgICAgICAgLGFyZHVpbm9zOiBbe2lkOidsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLGJvYXJkOicnLFJTU0k6ZmFsc2UsdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZSx2ZXJzaW9uOicnLHN0YXR1czp7ZXJyb3I6JycsZHQ6JycsbWVzc2FnZTonJ319XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczpbXSwgc3RhdHVzOiAnJ31cbiAgICAgICAgLHN0cmVhbXM6IHt1c2VybmFtZTogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnLCBzZXNzaW9uOiB7aWQ6ICcnLCBuYW1lOiAnJywgdHlwZTogJ2Zlcm1lbnRhdGlvbid9fVxuICAgICAgfTtcbiAgICAgIHJldHVybiBkZWZhdWx0U2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbmFtZTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLGluZGV4OicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnTWFzaCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2dyYWluJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENCcscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0ExJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdCb2lsJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx2Y2M6JycsaW5kZXg6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9IGVsc2UgaWYoa2V5ID09ICdzZXR0aW5ncycpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlLCBlc3A6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWUsIGVzcDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZSwgZXNwOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnU29pbE1vaXN0dXJlJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgdmNjOiB0cnVlLCBwZXJjZW50OiB0cnVlLCBlc3A6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0JNUDE4MCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2UsIGVzcDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidUZW1wJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J2xlYWYnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIGlzRVNQOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHJldHVybiAhIShhcmR1aW5vLmJvYXJkICYmIChhcmR1aW5vLmJvYXJkLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZXNwJykgIT09IC0xIHx8IGFyZHVpbm8uYm9hcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdub2RlbWN1JykgIT09IC0xKSk7XG4gICAgfSxcblxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgdmFyIHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGFyZHVpbm8pKycvYXJkdWluby9pbmZvJztcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKVxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZTtcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKSA9PT0gMClcbiAgICAgICAgICB1cmwgKz0gJz9hcGluPScra2V0dGxlLnRlbXAucGluO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdXJsICs9ICc/ZHBpbj0nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9ICcmZHBpbj0nK2tldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MpIC8vU29pbE1vaXN0dXJlIGxvZ2ljXG4gICAgICAgICAgdXJsICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgICAgZWxzZSBpZighIWtldHRsZS50ZW1wLmluZGV4KSAvL0RTMThCMjAgbG9naWNcbiAgICAgICAgICB1cmwgKz0gJyZpbmRleD0nK2tldHRsZS50ZW1wLmluZGV4O1xuICAgICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIH1cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbCc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2RwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGFuYWxvZzogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2FuYWxvZyc7XG4gICAgICBpZih0aGlzLmlzRVNQKGtldHRsZS5hcmR1aW5vKSl7XG4gICAgICAgIHVybCArPSAnP2FwaW49JytzZW5zb3IrJyZ2YWx1ZT0nK3ZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsICs9ICcvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGRpZ2l0YWxSZWFkOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHRpbWVvdXQpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsJztcbiAgICAgIGlmKHRoaXMuaXNFU1Aoa2V0dGxlLmFyZHVpbm8pKXtcbiAgICAgICAgdXJsICs9ICc/ZHBpbj0nK3NlbnNvcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCArPSAnLycrc2Vuc29yO1xuICAgICAgfVxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgdmFyIHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuaW5mbHV4ZGI7XG4gICAgICBkZWxldGUgc2V0dGluZ3MudHBsaW5rO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLm5vdGlmaWNhdGlvbnM7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc2tldGNoZXM7XG4gICAgICBzZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgICAgaWYoc2gucGFzc3dvcmQpXG4gICAgICAgIHNoLnBhc3N3b3JkID0gbWQ1KHNoLnBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2NyZWF0ZS8nLFxuICAgICAgICAgIG1ldGhvZDonUE9TVCcsXG4gICAgICAgICAgZGF0YTogeydzaGFyZSc6IHNoLCAnc2V0dGluZ3MnOiBzZXR0aW5ncywgJ2tldHRsZXMnOiBrZXR0bGVzfSxcbiAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzaGFyZVRlc3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gYHVybD0ke2FyZHVpbm8udXJsfWBcblxuICAgICAgaWYoYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgcXVlcnkgKz0gJyZhdXRoPScrYnRvYSgncm9vdDonK2FyZHVpbm8ucGFzc3dvcmQudHJpbSgpKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGU6IChkZXZpY2UsIHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogdG9nZ2xlIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBzdHJlYW1zOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMS9hcGknLCBoZWFkZXJzOiB7fSwgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGF1dGg6IGFzeW5jIChwaW5nKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJiBzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9IChwaW5nKSA/ICcvdXNlcnMvcGluZycgOiAnL3VzZXJzL2F1dGgnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0nYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtleSddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5fWA7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQkItVXNlciddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpXG4gICAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuKHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKTtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBrZXR0bGVzOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKGtldHRsZSkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHVwZGF0ZWRLZXR0bGUgPSBhbmd1bGFyLmNvcHkoa2V0dGxlKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBub3QgbmVlZGVkIGRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnZhbHVlcztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLm1lc3NhZ2U7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS50aW1lcnM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5rbm9iO1xuICAgICAgICAgICAgdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCA9IChzZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIXVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKSh1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDogdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcy9hcm0nO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb246IHNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbixcbiAgICAgICAgICAgICAga2V0dGxlOiB1cGRhdGVkS2V0dGxlLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiBzZXR0aW5ncy5ub3RpZmljYXRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25zOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBrZXR0bGU6IGtldHRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKHNlc3Npb24pID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMvJytzZXNzaW9uLmlkO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUEFUQ0gnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBuYW1lOiBzZXNzaW9uLm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6IHNlc3Npb24udHlwZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gZG8gY2FsY3MgdGhhdCBleGlzdCBvbiB0aGUgc2tldGNoXG4gICAgYml0Y2FsYzogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHZhciBhdmVyYWdlID0ga2V0dGxlLnRlbXAucmF3O1xuICAgICAgLy8gaHR0cHM6Ly93d3cuYXJkdWluby5jYy9yZWZlcmVuY2UvZW4vbGFuZ3VhZ2UvZnVuY3Rpb25zL21hdGgvbWFwL1xuICAgICAgZnVuY3Rpb24gZm1hcCAoeCxpbl9taW4saW5fbWF4LG91dF9taW4sb3V0X21heCl7XG4gICAgICAgIHJldHVybiAoeCAtIGluX21pbikgKiAob3V0X21heCAtIG91dF9taW4pIC8gKGluX21heCAtIGluX21pbikgKyBvdXRfbWluO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3Rvcicpe1xuICAgICAgICBjb25zdCBUSEVSTUlTVE9STk9NSU5BTCA9IDEwMDAwO1xuICAgICAgICAvLyB0ZW1wLiBmb3Igbm9taW5hbCByZXNpc3RhbmNlIChhbG1vc3QgYWx3YXlzIDI1IEMpXG4gICAgICAgIGNvbnN0IFRFTVBFUkFUVVJFTk9NSU5BTCA9IDI1O1xuICAgICAgICAvLyBob3cgbWFueSBzYW1wbGVzIHRvIHRha2UgYW5kIGF2ZXJhZ2UsIG1vcmUgdGFrZXMgbG9uZ2VyXG4gICAgICAgIC8vIGJ1dCBpcyBtb3JlICdzbW9vdGgnXG4gICAgICAgIGNvbnN0IE5VTVNBTVBMRVMgPSA1O1xuICAgICAgICAvLyBUaGUgYmV0YSBjb2VmZmljaWVudCBvZiB0aGUgdGhlcm1pc3RvciAodXN1YWxseSAzMDAwLTQwMDApXG4gICAgICAgIGNvbnN0IEJDT0VGRklDSUVOVCA9IDM5NTA7XG4gICAgICAgIC8vIHRoZSB2YWx1ZSBvZiB0aGUgJ290aGVyJyByZXNpc3RvclxuICAgICAgICBjb25zdCBTRVJJRVNSRVNJU1RPUiA9IDEwMDAwO1xuICAgICAgIC8vIGNvbnZlcnQgdGhlIHZhbHVlIHRvIHJlc2lzdGFuY2VcbiAgICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDApe1xuICAgICAgICAgYXZlcmFnZSA9IChhdmVyYWdlICogKDUuMCAvIDY1NTM1KSkgLyAwLjAwMDE7XG4gICAgICAgICB2YXIgbG4gPSBNYXRoLmxvZyhhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUwpO1xuICAgICAgICAgdmFyIGtlbHZpbiA9IDEgLyAoMC4wMDMzNTQwMTcwICsgKDAuMDAwMjU2MTcyNDQgKiBsbikgKyAoMC4wMDAwMDIxNDAwOTQzICogbG4gKiBsbikgKyAoLTAuMDAwMDAwMDcyNDA1MjE5ICogbG4gKiBsbiAqIGxuKSk7XG4gICAgICAgICAgLy8ga2VsdmluIHRvIGNlbHNpdXNcbiAgICAgICAgIHJldHVybiBrZWx2aW4gLSAyNzMuMTU7XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGF2ZXJhZ2UgPSAxMDIzIC8gYXZlcmFnZSAtIDE7XG4gICAgICAgICBhdmVyYWdlID0gU0VSSUVTUkVTSVNUT1IgLyBhdmVyYWdlO1xuXG4gICAgICAgICB2YXIgc3RlaW5oYXJ0ID0gYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMOyAgICAgLy8gKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgPSBNYXRoLmxvZyhzdGVpbmhhcnQpOyAgICAgICAgICAgICAgICAgIC8vIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgLz0gQkNPRUZGSUNJRU5UOyAgICAgICAgICAgICAgICAgICAvLyAxL0IgKiBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ICs9IDEuMCAvIChURU1QRVJBVFVSRU5PTUlOQUwgKyAyNzMuMTUpOyAvLyArICgxL1RvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gMS4wIC8gc3RlaW5oYXJ0OyAgICAgICAgICAgICAgICAgLy8gSW52ZXJ0XG4gICAgICAgICBzdGVpbmhhcnQgLT0gMjczLjE1O1xuICAgICAgICAgcmV0dXJuIHN0ZWluaGFydDtcbiAgICAgICB9XG4gICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcpe1xuICAgICAgIGlmIChrZXR0bGUudGVtcC5yYXcgJiYga2V0dGxlLnRlbXAucmF3PjQwOSl7XG4gICAgICAgIHJldHVybiAoMTUwKmZtYXAoa2V0dGxlLnRlbXAucmF3LDQxMCwxMDIzLDAsNjE0KSkvNjE0O1xuICAgICAgIH1cbiAgICAgfVxuICAgICAgcmV0dXJuICdOL0EnO1xuICAgIH0sXG5cbiAgICBpbmZsdXhkYjogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgaW5mbHV4Q29ubmVjdGlvbiA9IGAke3NldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgaWYoISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0ICYmICF0aGlzLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSlcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBob3N0ZWQ6ICh1cmwpID0+IHtcbiAgICAgICAgICByZXR1cm4gKHVybC5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSB8fFxuICAgICAgICAgICAgdXJsLmluZGV4T2YoJ2hvc3RlZC5icmV3YmVuY2guY28nKSAhPT0gLTEpO1xuICAgICAgICB9LFxuICAgICAgICBwaW5nOiAoaW5mbHV4ZGIpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51cmwpe1xuICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiA9IGAke2luZmx1eGRiLnVybH1gO1xuICAgICAgICAgICAgaWYoICEhaW5mbHV4ZGIucG9ydCAmJiAhdGhpcy5pbmZsdXhkYigpLmhvc3RlZChpbmZsdXhDb25uZWN0aW9uKSlcbiAgICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7aW5mbHV4ZGIucG9ydH1gXG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn1gLCBtZXRob2Q6ICdHRVQnfTtcbiAgICAgICAgICBpZih0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2A7XG4gICAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51c2VyICYmIGluZmx1eGRiLnBhc3Mpe1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoaW5mbHV4ZGIudXNlci50cmltKCkrJzonK2luZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2Eoc2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCkrJzonK3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICBpZih0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKXtcbiAgICAgICAgICAgIHEucmVzb2x2ZShbc2V0dGluZ3MuaW5mbHV4ZGIudXNlcl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICBpZih0aGlzLmluZmx1eGRiKCkuaG9zdGVkKGluZmx1eENvbm5lY3Rpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KCdEYXRhYmFzZSBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6ICEhb3B0aW9ucy5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6ICEhb3B0aW9ucy5zZXNzaW9uID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gISFvcHRpb25zLmNoYXJ0LmFyZWEgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCEhb3B0aW9ucy5jaGFydC5taWxpdGFyeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgdmFyIHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgdmFyIHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICB2YXIgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9