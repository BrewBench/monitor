webpackJsonp([1],{

/***/ 309:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(121);
__webpack_require__(330);
__webpack_require__(532);
__webpack_require__(534);
__webpack_require__(535);
__webpack_require__(536);
module.exports = __webpack_require__(537);


/***/ }),

/***/ 532:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(61);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(157);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(158);

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

/***/ 534:
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

  var notification = null,
      resetChart = 100,
      timeout = null; //reset chart after 100 polls

  $scope.BrewService = BrewService;
  $scope.site = { https: !!(document.location.protocol == 'https:'),
    https_url: 'https://' + document.location.host
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
        analog: 5,
        digital: 13,
        adc: 0,
        secure: false,
        version: '',
        status: { error: '', dt: '' }
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
      temp: { pin: 'A0', vcc: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0, volts: 0 },
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
      return $scope.settings.influxdb.url.indexOf('streams.brewbench.co') !== -1;
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
    // volt check
    if (response.volts) {
      kettle.temp.volts = response.volts;
      if (kettle.temp.type == 'Thermistor' && kettle.temp.pin.indexOf('A') === 0 && response.volts < 2) {
        $scope.setErrorMessage('Sensor is not connected', kettle);
        return;
      }
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
      if (kettle.temp.type.indexOf('DHT') !== -1 && currentSketch.headers.indexOf('#include <dht.h>') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTlib-1.2.9.zip');
        currentSketch.headers.push('#include <dht.h>');
      }
      if (kettle.temp.type.indexOf('DS18B20') !== -1 && currentSketch.headers.indexOf('#include "cactus_io_DS18B20.h"') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
        currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
      }
      // Are we using ADC?
      if (kettle.temp.pin.indexOf('C') === 0 && currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) {
        currentSketch.headers.push('// https://github.com/adafruit/Adafruit_ADS1X15');
        currentSketch.headers.push('#include <Wire.h>');
        currentSketch.headers.push('#include <Adafruit_ADS1015.h>');
      }
      var kettleType = kettle.temp.type;
      if (kettle.temp.vcc) kettleType += kettle.temp.vcc;
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
      response.data = autogen + response.data.replace('// [actions]', actions.length ? actions.join('\n') : '').replace('// [headers]', headers.length ? headers.join('\n') : '').replace(/\[VERSION\]/g, $scope.pkg.sketch_version).replace(/\[TPLINK_CONNECTION\]/g, tplink_connection_string).replace(/\[SLACK_CONNECTION\]/g, $scope.settings.notifications.slack);
      if (sketch.indexOf('Streams') !== -1) {
        // streams connection
        var connection_string = 'https://' + $scope.settings.streams.username + '.streams.brewbench.co';
        response.data = response.data.replace(/\[STREAMS_CONNECTION\]/g, connection_string);
        response.data = response.data.replace(/\[STREAMS_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.streams.username.trim() + ':' + $scope.settings.streams.api_key.trim()));
      }if (sketch.indexOf('InfluxDB') !== -1) {
        // influx db connection
        var connection_string = '' + $scope.settings.influxdb.url;
        if ($scope.influxdb.brewbenchHosted()) {
          connection_string += '/bbp';
          response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.influxdb.user.trim() + ':' + $scope.settings.influxdb.pass.trim()));
          var additional_post_params = '  p.addParameter(F("-H"));\n';
          additional_post_params += '  p.addParameter(F("X-API-KEY: ' + $scope.settings.influxdb.pass + '"));';
          response.data = response.data.replace('// additional_post_params', additional_post_params);
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
      if (headers.indexOf('#include <dht.h>') !== -1) {
        response.data = response.data.replace(/\/\/ DHT /g, '');
      }
      if (headers.indexOf('#include "cactus_io_DS18B20.h"') !== -1) {
        response.data = response.data.replace(/\/\/ DS18B20 /g, '');
      }
      if (headers.indexOf('#include <Adafruit_ADS1015.h>') !== -1) {
        response.data = response.data.replace(/\/\/ ADC /g, '');
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
          // udpate chart with current
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(62)))

/***/ }),

/***/ 535:
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

/***/ 536:
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
});

/***/ }),

/***/ 537:
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
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        arduinos: [{ id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, adc: 0, secure: false, version: '', status: { error: '', dt: '' } }],
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
        temp: { pin: 'A0', vcc: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0, volts: 0 },
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
        temp: { pin: 'A1', vcc: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0, volts: 0 },
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
        temp: { pin: 'A2', vcc: '', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0, volts: 0 },
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
      var sensors = [{ name: 'Thermistor', analog: true, digital: false }, { name: 'DS18B20', analog: false, digital: true }, { name: 'PT100', analog: true, digital: true }, { name: 'DHT11', analog: false, digital: true }, { name: 'DHT12', analog: false, digital: true }, { name: 'DHT21', analog: false, digital: true }, { name: 'DHT22', analog: false, digital: true }, { name: 'DHT33', analog: false, digital: true }, { name: 'DHT44', analog: false, digital: true }, { name: 'SoilMoisture', analog: true, digital: false, vcc: true, percent: true }];
      if (name) return _.filter(sensors, { 'name': name })[0];
      return sensors;
    },

    kettleTypes: function kettleTypes(type) {
      var kettles = [{ 'name': 'Boil', 'type': 'hop', 'target': 200, 'diff': 2 }, { 'name': 'Mash', 'type': 'grain', 'target': 152, 'diff': 2 }, { 'name': 'Hot Liquor', 'type': 'water', 'target': 170, 'diff': 2 }, { 'name': 'Fermenter', 'type': 'fermenter', 'target': 74, 'diff': 2 }, { 'name': 'Air', 'type': 'air', 'target': 74, 'diff': 2 }, { 'name': 'Soil', 'type': 'leaf', 'target': 60, 'diff': 2 }];
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

    // Thermistor, DS18B20, or PT100
    // https://learn.adafruit.com/thermistor/using-a-thermistor
    // https://www.adafruit.com/product/381)
    // https://www.adafruit.com/product/3290 and https://www.adafruit.com/product/3328
    temp: function temp(kettle) {
      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/' + kettle.temp.type;
      if (!!kettle.temp.vcc) url += kettle.temp.vcc;
      url += '/' + kettle.temp.pin;
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
      var url = this.domain(kettle.arduino) + '/arduino/digital/' + sensor + '/' + value;
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
      var url = this.domain(kettle.arduino) + '/arduino/analog/' + sensor + '/' + value;
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
      var url = this.domain(kettle.arduino) + '/arduino/digital/' + sensor;
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
      var q = $q.defer();
      var settings = this.settings('settings');
      var influxConnection = '' + settings.influxdb.url;
      if (!!settings.influxdb.port && influxConnection.indexOf('streams.brewbench.co') === -1) influxConnection += ':' + settings.influxdb.port;

      return {
        ping: function ping(influxdb) {
          if (influxdb && influxdb.url) {
            influxConnection = '' + influxdb.url;
            if (!!influxdb.port && influxConnection.indexOf('streams.brewbench.co') === -1) influxConnection += ':' + influxdb.port;
          }
          var request = { url: '' + influxConnection, method: 'GET' };
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
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
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
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
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(62)))

/***/ })

},[309]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZ2VuZXJhbCIsImNoYXJ0T3B0aW9ucyIsInVuaXQiLCJjaGFydCIsInNlc3Npb24iLCJzdHJlYW1zIiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJzdGF0dXMiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImFkYyIsInNlY3VyZSIsInZlcnNpb24iLCJkdCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImVtZXRlciIsImdldF9yZWFsdGltZSIsImVycl9jb2RlIiwicG93ZXIiLCJkZXZpY2UiLCJ0b2dnbGUiLCJvZmZPck9uIiwicmVsYXlfc3RhdGUiLCJhZGRLZXR0bGUiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJoaXQiLCJtZWFzdXJlZCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZvbHRzIiwidmFsdWVzIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJjb3VudCIsIm5vdGlmeSIsInNsYWNrIiwiZHdlZXQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwicGluRGlzcGxheSIsImRldmljZUlkIiwic3Vic3RyIiwiYWxpYXMiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNoYW5nZVNlbnNvciIsInNlbnNvclR5cGVzIiwicGVyY2VudCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwiZW1haWwiLCJzaGFyZV9zdGF0dXMiLCJzaGFyZV9zdWNjZXNzIiwic2hhcmVfbGluayIsInNoYXJlVGVzdCIsInRlc3RpbmciLCJodHRwX2NvZGUiLCJwdWJsaWMiLCJpbmZsdXhkYiIsImJyZXdiZW5jaEhvc3RlZCIsInJlbW92ZSIsImRlZmF1bHRTZXR0aW5ncyIsImNvbm5lY3QiLCJwaW5nIiwiJCIsInJlbW92ZUNsYXNzIiwiZGIiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImFkZENsYXNzIiwiY3JlYXRlIiwibW9tZW50IiwiZm9ybWF0IiwiY3JlYXRlZCIsImNyZWF0ZURCIiwiZGF0YSIsInJlc3VsdHMiLCJyZXNldEVycm9yIiwiY29ubmVjdGVkIiwidXNlcm5hbWUiLCJhcGlfa2V5IiwiYXV0aCIsInJlbGF5Iiwic2F2ZSIsImtldHRsZVJlc3BvbnNlIiwibWVyZ2UiLCJjb25zb2xlIiwic2Vzc2lvbnMiLCJzaGFyZUFjY2VzcyIsInNoYXJlZCIsImZyYW1lRWxlbWVudCIsImxvYWRTaGFyZUZpbGUiLCJjb250ZW50cyIsIm5vdGlmaWNhdGlvbnMiLCJvbiIsImhpZ2giLCJsb3ciLCJsYXN0Iiwic3ViVGV4dCIsImVuYWJsZWQiLCJ0ZXh0IiwiY29sb3IiLCJmb250IiwicHJvY2Vzc1RlbXBzIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsInVwZGF0ZUFyZHVpbm9TdGF0dXMiLCJkb21haW4iLCJza2V0Y2hfdmVyc2lvbiIsInVwZGF0ZVRlbXAiLCJrZXkiLCJ0ZW1wcyIsInNoaWZ0IiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIk1hdGgiLCJyb3VuZCIsIm9mZiIsImltcG9ydFNldHRpbmdzIiwicHJvZmlsZUNvbnRlbnQiLCJleHBvcnRTZXR0aW5ncyIsImkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjb21waWxlU2tldGNoIiwic2tldGNoTmFtZSIsInNrZXRjaGVzIiwiYXJkdWlub05hbWUiLCJjdXJyZW50U2tldGNoIiwiYWN0aW9ucyIsInRyaWdnZXJzIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwidHJpbSIsImFkZGl0aW9uYWxfcG9zdF9wYXJhbXMiLCJwb3J0Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsInVwZGF0ZVN0cmVhbXMiLCJjaGFuZ2VVbml0cyIsInYiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwicmVtb3ZlS2V0dGxlIiwiJGluZGV4IiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsInVwZGF0ZUxvY2FsIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJhY2Nlc3NUb2tlbiIsInNldEl0ZW0iLCJnZXRJdGVtIiwiZGVidWciLCJzaG93IiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsInNlbnNvcnMiLCJ3ZWJob29rX3VybCIsInEiLCJkZWZlciIsInBvc3RPYmoiLCJyZXNvbHZlIiwicmVqZWN0IiwicHJvbWlzZSIsInJlcXVlc3QiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJkaWdpdGFsUmVhZCIsInF1ZXJ5IiwibWQ1Iiwic2giLCJsYXRlc3QiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsInVwZGF0ZWRLZXR0bGUiLCJzZXNzaW9uSWQiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsImxuIiwibG9nIiwia2VsdmluIiwic3RlaW5oYXJ0IiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdCQUFjRyxRQUFkLENBQXVCRSxPQUF2QixDQUErQkMsTUFBL0IsR0FBd0MsZ0NBQXhDO0FBQ0EsU0FBT04sY0FBY0csUUFBZCxDQUF1QkUsT0FB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QixFQXZRYyxFQXdRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhRYyxFQXlRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXpRYyxFQTBRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFRYyxFQTJRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTNRYyxFQTRRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVRYyxFQTZRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTdRYyxFQThRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlRYyxFQStRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9RYyxFQWdSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWhSYyxFQWlSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWpSYyxFQWtSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxSYyxFQW1SZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5SYyxFQW9SZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBSYyxFQXFSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJSYyxFQXNSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRSYyxFQXVSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZSYyxFQXdSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhSYyxFQXlSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXpSYyxFQTBSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFSYyxFQTJSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFq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RUFzZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdGZjLEVBdWZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdmZjLEVBd2ZkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEtBQWhCLEVBeGZjLEVBeWZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBemZjLEVBMGZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMWZjLEVBMmZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM2ZjLENBQWhCOztBQThmQTFoQixRQUFFOEQsSUFBRixDQUFPMGQsU0FBUCxFQUFrQixVQUFTRyxJQUFULEVBQWU7QUFDL0IsWUFBR0osUUFBUTNoQixPQUFSLENBQWdCK2hCLEtBQUtGLENBQXJCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7QUFDaENGLG9CQUFVQSxRQUFRNWhCLE9BQVIsQ0FBZ0J3WCxPQUFPd0ssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUE1bURJLEdBQVA7QUE4bURELENBam5ERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsLFxuICByZXNldENoYXJ0ID0gMTAwLFxuICB0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuQnJld1NlcnZpY2UgPSBCcmV3U2VydmljZTtcbiRzY29wZS5zaXRlID0ge2h0dHBzOiAhIShkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbD09J2h0dHBzOicpXG4gICwgaHR0cHNfdXJsOiBgaHR0cHM6Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9YFxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgYWRjOiAwLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7ZXJyb3I6ICcnLGR0OiAnJ31cbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKCEhcGx1Zy5zdGF0dXMpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgdmFyIG9mZk9yT24gPSBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxID8gMCA6IDE7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS50b2dnbGUoZGV2aWNlLCBvZmZPck9uKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSBvZmZPck9uO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS50aGVuKHRvZ2dsZVJlc3BvbnNlID0+IHtcbiAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5mb1xuICAgICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICBkZXZpY2UuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgdmFyIGFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfTtcbiAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCxkaWZmOiRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogYXJkdWlub1xuICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBwaW47XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUudGVtcC52Y2M9PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgICgha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VTZW5zb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCl7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi51bml0ID0gJ1xcdTAwQjAnO1xuICAgIH1cbiAgICBrZXR0bGUudGVtcC52Y2MgPSAnJztcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbmZsdXhkYiA9IHtcbiAgICBicmV3YmVuY2hIb3N0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybC5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiID0gZGVmYXVsdFNldHRpbmdzLmluZmx1eGRiO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0IHx8IHJlc3BvbnNlLnN0YXR1cyA9PSAyMDApe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5pbmZsdXhkYi5icmV3YmVuY2hIb3N0ZWQoKSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3RyZWFtcyA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSAmJlxuICAgICAgICAhISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID09ICdDb25uZWN0ZWQnXG4gICAgICApO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zID0gZGVmYXVsdFNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkuYXV0aCh0cnVlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAga2V0dGxlczogKGtldHRsZSwgcmVsYXkpID0+IHtcbiAgICAgIGlmKHJlbGF5KXtcbiAgICAgICAga2V0dGxlW3JlbGF5XS5za2V0Y2ggPSAha2V0dGxlW3JlbGF5XS5za2V0Y2g7XG4gICAgICAgIGlmKCFrZXR0bGUubm90aWZ5LnN0cmVhbXMpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSAnc2tldGNoZXMnO1xuICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdpbmZvJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDA7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmtldHRsZXMuc2F2ZShrZXR0bGUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICB2YXIga2V0dGxlUmVzcG9uc2UgPSByZXNwb25zZS5rZXR0bGU7XG4gICAgICAgICAgLy8gdXBkYXRlIGtldHRsZSB2YXJzXG4gICAgICAgICAga2V0dGxlLmlkID0ga2V0dGxlUmVzcG9uc2UuaWQ7XG4gICAgICAgICAgLy8gdXBkYXRlIGFyZHVpbm8gaWRcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCBhcmR1aW5vID0+IHtcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uaWQgPT0ga2V0dGxlLmFyZHVpbm8uaWQpXG4gICAgICAgICAgICAgIGFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5pZCA9IGtldHRsZVJlc3BvbnNlLmRldmljZUlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBzZXNzaW9uIHZhcnNcbiAgICAgICAgICBfLm1lcmdlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sIGtldHRsZVJlc3BvbnNlLnNlc3Npb24pO1xuXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdzdWNjZXNzJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAyO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSAha2V0dGxlLm5vdGlmeS5zdHJlYW1zO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDE7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5kYXRhICYmIGVyci5kYXRhLmVycm9yICYmIGVyci5kYXRhLmVycm9yLm1lc3NhZ2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIuZGF0YS5lcnJvci5tZXNzYWdlLCBrZXR0bGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQnJld0JlbmNoIFN0cmVhbXMgRXJyb3InLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXNzaW9uczoge1xuICAgICAgc2F2ZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLnNlc3Npb25zLnNhdmUoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbilcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAgIGlmKGFjY2Vzcyl7XG4gICAgICAgICAgaWYoYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gISEoJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFNoYXJlRmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCA9IHRydWU7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmxvYWRTaGFyZUZpbGUoJHNjb3BlLnNoYXJlLmZpbGUsICRzY29wZS5zaGFyZS5wYXNzd29yZCB8fCBudWxsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY29udGVudHMpIHtcbiAgICAgICAgaWYoY29udGVudHMpe1xuICAgICAgICAgIGlmKGNvbnRlbnRzLm5lZWRQYXNzd29yZCl7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUgPSBjb250ZW50cy5zZXR0aW5ncy5yZWNpcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNoYXJlICYmIGNvbnRlbnRzLnNoYXJlLmFjY2Vzcyl7XG4gICAgICAgICAgICAgICRzY29wZS5zaGFyZS5hY2Nlc3MgPSBjb250ZW50cy5zaGFyZS5hY2Nlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncyl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncyA9IGNvbnRlbnRzLnNldHRpbmdzO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucyA9IHtvbjpmYWxzZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5rZXR0bGVzKXtcbiAgICAgICAgICAgICAgXy5lYWNoKGNvbnRlbnRzLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgICAgICAgICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIwMCs1LHN1YlRleHQ6e2VuYWJsZWQ6IHRydWUsdGV4dDogJ3N0YXJ0aW5nLi4uJyxjb2xvcjogJ2dyYXknLGZvbnQ6ICdhdXRvJ319KTtcbiAgICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzID0gW107XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlcyA9IGNvbnRlbnRzLmtldHRsZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGxvYWRpbmcgdGhlIHNoYXJlZCBzZXNzaW9uLlwiKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZighIWZvcm1hdHRlZF9jb250ZW50KXtcbiAgICAgICAgdmFyIHgyanMgPSBuZXcgWDJKUygpO1xuICAgICAgICBqc29uT2JqID0geDJqcy54bWxfc3RyMmpzb24oIGZvcm1hdHRlZF9jb250ZW50ICk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFqc29uT2JqKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCRleHQ9PSdic214Jyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SZWNpcGVzICYmICEhanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZighIWpzb25PYmouU2VsZWN0aW9ucyAmJiAhIWpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SRUNJUEVTICYmICEhanNvbk9iai5SRUNJUEVTLlJFQ0lQRSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJFQ0lQRVMuUkVDSVBFO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclhNTChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZighcmVjaXBlKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCEhcmVjaXBlLm9nKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoISFyZWNpcGUuZmcpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ3dhcm5pbmcnO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdUaGUgbW9uaXRvciBzZWVtcyB0byBiZSBvZmYtbGluZSwgcmUtY29ubmVjdGluZy4uLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZighIWVyci5zdGF0dXNUZXh0KVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgaWYobG9jYXRpb24pXG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwgbWVzc2FnZSk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWApO1xuICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG4gICAgaWYocmVzcG9uc2Uudm9sdHMpXG4gICAgICByZXNwb25zZS52b2x0cyA9IHBhcnNlRmxvYXQocmVzcG9uc2Uudm9sdHMpO1xuXG4gICAgaWYoISFrZXR0bGUudGVtcC5jdXJyZW50KVxuICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIC8vIHRlbXAgcmVzcG9uc2UgaXMgaW4gQ1xuICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnRlbXAsMik7XG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICAvLyBzZXQgcmF3XG4gICAga2V0dGxlLnRlbXAucmF3ID0gcmVzcG9uc2UucmF3O1xuICAgIC8vIHZvbHQgY2hlY2tcbiAgICBpZihyZXNwb25zZS52b2x0cyl7XG4gICAgICBrZXR0bGUudGVtcC52b2x0cyA9IHJlc3BvbnNlLnZvbHRzO1xuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3RvcicgJiZcbiAgICAgICAga2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0EnKT09PTAgJiZcbiAgICAgICAgcmVzcG9uc2Uudm9sdHMgPCAyKVxuICAgICAgICB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnU2Vuc29yIGlzIG5vdCBjb25uZWN0ZWQnLCBrZXR0bGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcy5zaGlmdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQgc2Vuc29ycyBoYXZlIGh1bWlkaXR5IGFzIGEgcGVyY2VudFxuICAgIC8vU29pbE1vaXN0dXJlRCBoYXMgbW9pc3R1cmUgYXMgYSBwZXJjZW50XG4gICAgaWYoIHR5cGVvZiByZXNwb25zZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGtldHRsZS5wZXJjZW50ID0gcmVzcG9uc2UucGVyY2VudDtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZSwgc2tldGNoX3ZlcnNpb246cmVzcG9uc2Uuc2tldGNoX3ZlcnNpb259KTtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFjayB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKTtcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgfVxuICAgICAgdmFyIHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEha2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUbGliLTEuMi45LnppcCcpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9jYWN0dXNfaW9fRFMxOEIyMC56aXAnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJyk7XG4gICAgICB9XG4gICAgICAvLyBBcmUgd2UgdXNpbmcgQURDP1xuICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly9naXRodWIuY29tL2FkYWZydWl0L0FkYWZydWl0X0FEUzFYMTUnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpO1xuICAgICAgfVxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYoa2V0dGxlLnRlbXAudmNjKSBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCdhY3Rpb25zQ29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmKHNrZXRjaC50cmlnZ2Vycyl7XG4gICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpXG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZFxuICAgICAgICBmb3IodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xKVxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaCcrc2tldGNoTmFtZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZG93bmxvYWRTa2V0Y2gobmFtZSwgYWN0aW9ucywgaGFzVHJpZ2dlcnMsIGhlYWRlcnMsIHNrZXRjaCl7XG4gICAgLy8gdHAgbGluayBjb25uZWN0aW9uXG4gICAgdmFyIHRwbGlua19jb25uZWN0aW9uX3N0cmluZyA9IEJyZXdTZXJ2aWNlLnRwbGluaygpLmNvbm5lY3Rpb24oKTtcbiAgICB2YXIgYXV0b2dlbiA9ICcvKiBTa2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY28gb24gJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJyAqL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbYWN0aW9uc10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2hlYWRlcnNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ1N0cmVhbXMnKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIHN0cmVhbXMgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGBodHRwczovLyR7JHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9LnN0cmVhbXMuYnJld2JlbmNoLmNvYDtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NUUkVBTVNfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleS50cmltKCkpKTtcbiAgICAgICAgfSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy9iYnAnO1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCAnQXV0aG9yaXphdGlvbjogQmFzaWMgJytidG9hKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKSk7XG4gICAgICAgICAgICB2YXIgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyA9ICcgIHAuYWRkUGFyYW1ldGVyKEYoXCItSFwiKSk7XFxuJztcbiAgICAgICAgICAgIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMgKz0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIlgtQVBJLUtFWTogJyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcysnXCIpKTsnO1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnLy8gYWRkaXRpb25hbF9wb3N0X3BhcmFtcycsIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgICAgICAgICAvLyBhZGQgZGJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERTMThCMjAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gQURDIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGFzVHJpZ2dlcnMpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyB0cmlnZ2VycyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgc2tldGNoKyctJytuYW1lKycuaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHN0cmVhbVNrZXRjaCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5ub3RpZnkgPSBmdW5jdGlvbihrZXR0bGUsdGltZXIpe1xuXG4gICAgLy9kb24ndCBzdGFydCBhbGVydHMgdW50aWwgd2UgaGF2ZSBoaXQgdGhlIHRlbXAudGFyZ2V0XG4gICAgaWYoIXRpbWVyICYmIGtldHRsZSAmJiAha2V0dGxlLnRlbXAuaGl0XG4gICAgICB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5vbiA9PT0gZmFsc2Upe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgdmFyIG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0gKGtldHRsZSAmJiBrZXR0bGUudGVtcCkgPyBrZXR0bGUudGVtcC5jdXJyZW50IDogMDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKGtldHRsZSAmJiAhIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGN1cnJlbnRWYWx1ZV0pO1xuICAgIH1cblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytjdXJyZW50VmFsdWUrdW5pdFR5cGU7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZighIXRpbWVyICYmIGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgdmFyIHNuZCA9IG5ldyBBdWRpbygoISF0aW1lcikgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIG1lYXN1cmVkIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoISFCcmV3U2VydmljZS5zZW5zb3JUeXBlcyhrZXR0bGUudGVtcC50eXBlKS5wZXJjZW50ICYmIHR5cGVvZiBrZXR0bGUucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXR0bGUucGVyY2VudDtcbiAgICAgIHVuaXRUeXBlID0gJ1xcdTAwMjUnO1xuICAgIH1cbiAgICAvL2lzIGN1cnJlbnRWYWx1ZSB0b28gaGlnaD9cbiAgICBpZihjdXJyZW50VmFsdWUgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGN1cnJlbnRWYWx1ZS1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGN1cnJlbnRWYWx1ZSA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQtY3VycmVudFZhbHVlO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApK3VuaXRUeXBlKycgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLm5hbWUgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJyl7XG4gICAgICBrZXR0bGUuY29vbGVyID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5wdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUucHVtcCA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUuY29vbGVyO1xuICAgIH1cbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUsJGluZGV4KXtcbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudXBkYXRlU3RyZWFtcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy91cGRhdGUgc3RyZWFtc1xuICAgIGlmKCRzY29wZS5zdHJlYW1zLmNvbm5lY3RlZCgpICYmIGtldHRsZS5ub3RpZnkuc3RyZWFtcyl7XG4gICAgICAkc2NvcGUuc3RyZWFtcy5rZXR0bGVzKGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uKCl7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSw1MDAwKTtcbiAgfVxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oY2Vsc2l1cykge1xuICAgIGNlbHNpdXMgPSBwYXJzZUZsb2F0KGNlbHNpdXMpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKGNlbHNpdXMqOS81KzMyLDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZhaHJlbmhlaXQpIHtcbiAgICBmYWhyZW5oZWl0ID0gcGFyc2VGbG9hdChmYWhyZW5oZWl0KTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKSgoZmFocmVuaGVpdC0zMikqNS85LDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3JvdW5kJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odmFsLGRlY2ltYWxzKSB7XG4gICAgcmV0dXJuIE51bWJlcigoTWF0aC5yb3VuZCh2YWwgKyBcImVcIiArIGRlY2ltYWxzKSAgKyBcImUtXCIgKyBkZWNpbWFscykpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RpdGxlY2FzZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCl7XG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGV4dC5zbGljZSgxKSk7XG4gIH1cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2ZpbHRlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZhY3RvcnkoJ0JyZXdTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkZmlsdGVyKXtcblxuICByZXR1cm4ge1xuXG4gICAgLy9jb29raWVzIHNpemUgNDA5NiBieXRlc1xuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xuICAgICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSl7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2V0dGluZ3MnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdrZXR0bGVzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2hhcmUnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYWNjZXNzVG9rZW46IGZ1bmN0aW9uKHRva2VuKXtcbiAgICAgIGlmKHRva2VuKVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NUb2tlbicsdG9rZW4pO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgIH0sXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlfVxuICAgICAgICAsY2hhcnQ6IHtzaG93OiB0cnVlLCBtaWxpdGFyeTogZmFsc2UsIGFyZWE6IGZhbHNlfVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYXJkdWlub3M6IFt7aWQ6J2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZSx2ZXJzaW9uOicnLHN0YXR1czp7ZXJyb3I6JycsZHQ6Jyd9fV1cbiAgICAgICAgLHRwbGluazoge3VzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46JycsIHN0YXR1czogJycsIHBsdWdzOiBbXX1cbiAgICAgICAgLGluZmx1eGRiOiB7dXJsOiAnJywgcG9ydDogJycsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6W10sIHN0YXR1czogJyd9XG4gICAgICAgICxzdHJlYW1zOiB7dXNlcm5hbWU6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJywgc2Vzc2lvbjoge2lkOiAnJywgbmFtZTogJycsIHR5cGU6ICdmZXJtZW50YXRpb24nfX1cbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5hbWU6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjIscmF3OjAsdm9sdHM6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdmNjOicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdmNjOicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnU29pbE1vaXN0dXJlJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZSwgdmNjOiB0cnVlLCBwZXJjZW50OiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0FpcicsJ3R5cGUnOidhaXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonU29pbCcsJ3R5cGUnOidsZWFmJywndGFyZ2V0Jzo2MCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoISFhcmR1aW5vLnNlY3VyZSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGVcbiAgICAgIGlmKCEha2V0dGxlLnRlbXAudmNjKSB1cmwgKz0ga2V0dGxlLnRlbXAudmNjO1xuICAgICAgdXJsICs9ICcvJytrZXR0bGUudGVtcC5waW47XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZC50cmltKCkpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEuc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGFuYWxvZzogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2FuYWxvZy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3I7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG9hZFNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gJyc7XG4gICAgICBpZihwYXNzd29yZClcbiAgICAgICAgcXVlcnkgPSAnP3Bhc3N3b3JkPScrbWQ1KHBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2dldC8nK2ZpbGUrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gZmluaXNoIHRoaXNcbiAgICAvLyBkZWxldGVTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAvLyAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAvLyAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2RlbGV0ZS8nK2ZpbGUsIG1ldGhvZDogJ0dFVCd9KVxuICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgLy8gICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAvLyAgICAgICBxLnJlamVjdChlcnIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIHJldHVybiBxLnByb21pc2U7XG4gICAgLy8gfSxcblxuICAgIGNyZWF0ZVNoYXJlOiBmdW5jdGlvbihzaGFyZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGtldHRsZXMgPSB0aGlzLnNldHRpbmdzKCdrZXR0bGVzJyk7XG4gICAgICB2YXIgc2ggPSBPYmplY3QuYXNzaWduKHt9LCB7cGFzc3dvcmQ6IHNoYXJlLnBhc3N3b3JkLCBhY2Nlc3M6IHNoYXJlLmFjY2Vzc30pO1xuICAgICAgLy9yZW1vdmUgc29tZSB0aGluZ3Mgd2UgZG9uJ3QgbmVlZCB0byBzaGFyZVxuICAgICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0ua25vYjtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0udmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc3RyZWFtcztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5pbmZsdXhkYjtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy50cGxpbms7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5za2V0Y2hlcztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZC50cmltKCkpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS90ZXN0Lz8nK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBpcDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2lwJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZHdlZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbGF0ZXN0OiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvbGF0ZXN0L2R3ZWV0L2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYWxsOiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvZHdlZXRzL2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MudHBsaW5rLnRva2VuKXtcbiAgICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICAgIHJldHVybiB1cmwrJy8/JytqUXVlcnkucGFyYW0ocGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9LFxuICAgICAgICBsb2dpbjogKHVzZXIscGFzcykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZighdXNlciB8fCAhcGFzcylcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCBMb2dpbicpO1xuICAgICAgICAgIGNvbnN0IGxvZ2luX3BheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOiBcImxvZ2luXCIsXG4gICAgICAgICAgICBcInVybFwiOiB1cmwsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiYXBwVHlwZVwiOiBcIkthc2FfQW5kcm9pZFwiLFxuICAgICAgICAgICAgICBcImNsb3VkUGFzc3dvcmRcIjogcGFzcyxcbiAgICAgICAgICAgICAgXCJjbG91ZFVzZXJOYW1lXCI6IHVzZXIsXG4gICAgICAgICAgICAgIFwidGVybWluYWxVVUlEXCI6IHBhcmFtcy50ZXJtSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShsb2dpbl9wYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlblxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnJlc3VsdCl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdG9rZW4gPSB0b2tlbiB8fCBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7dG9rZW46IHRva2VufSxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6IFwiZ2V0RGV2aWNlTGlzdFwiIH0pLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjb21tYW5kOiAoZGV2aWNlLCBjb21tYW5kKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdmFyIHRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjpcInBhc3N0aHJvdWdoXCIsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiZGV2aWNlSWRcIjogZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgICAgICBcInJlcXVlc3REYXRhXCI6IEpTT04uc3RyaW5naWZ5KCBjb21tYW5kIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHNldCB0aGUgdG9rZW5cbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICBwYXJhbXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBkZXZpY2UuYXBwU2VydmVyVXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogKGRldmljZSwgdG9nZ2xlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiB0b2dnbGUgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHN0cmVhbXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiAnaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaScsIGhlYWRlcnM6IHt9LCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXV0aDogYXN5bmMgKHBpbmcpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmIHNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gKHBpbmcpID8gJy91c2Vycy9waW5nJyA6ICcvdXNlcnMvYXV0aCc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS2V5J10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1CQi1Vc2VyJ10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLmFjY2VzcyAmJiByZXNwb25zZS5kYXRhLmFjY2Vzcy5pZClcbiAgICAgICAgICAgICAgICAgIHRoaXMuYWNjZXNzVG9rZW4ocmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpO1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlamVjdChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGtldHRsZXM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoa2V0dGxlKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXBkYXRlZEtldHRsZSA9IGFuZ3VsYXIuY29weShrZXR0bGUpO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG5vdCBuZWVkZWQgZGF0YVxuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudmFsdWVzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUubWVzc2FnZTtcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnRpbWVycztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLmtub2I7XG4gICAgICAgICAgICB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0ID0gKHNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEhdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiB1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzL2FybSc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbjogc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLFxuICAgICAgICAgICAgICBrZXR0bGU6IHVwZGF0ZWRLZXR0bGUsXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnM6IHNldHRpbmdzLm5vdGlmaWNhdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbnM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbklkOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGtldHRsZToga2V0dGxlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzYXZlOiBhc3luYyAoc2Vzc2lvbikgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucy8nK3Nlc3Npb24uaWQ7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQQVRDSCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIG5hbWU6IHNlc3Npb24ubmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc2Vzc2lvbi50eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBkbyBjYWxjcyB0aGF0IGV4aXN0IG9uIHRoZSBza2V0Y2hcbiAgICBiaXRjYWxjOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgdmFyIGF2ZXJhZ2UgPSBrZXR0bGUudGVtcC5yYXc7XG4gICAgICAvLyBodHRwczovL3d3dy5hcmR1aW5vLmNjL3JlZmVyZW5jZS9lbi9sYW5ndWFnZS9mdW5jdGlvbnMvbWF0aC9tYXAvXG4gICAgICBmdW5jdGlvbiBmbWFwICh4LGluX21pbixpbl9tYXgsb3V0X21pbixvdXRfbWF4KXtcbiAgICAgICAgcmV0dXJuICh4IC0gaW5fbWluKSAqIChvdXRfbWF4IC0gb3V0X21pbikgLyAoaW5fbWF4IC0gaW5fbWluKSArIG91dF9taW47XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyl7XG4gICAgICAgIGNvbnN0IFRIRVJNSVNUT1JOT01JTkFMID0gMTAwMDA7XG4gICAgICAgIC8vIHRlbXAuIGZvciBub21pbmFsIHJlc2lzdGFuY2UgKGFsbW9zdCBhbHdheXMgMjUgQylcbiAgICAgICAgY29uc3QgVEVNUEVSQVRVUkVOT01JTkFMID0gMjU7XG4gICAgICAgIC8vIGhvdyBtYW55IHNhbXBsZXMgdG8gdGFrZSBhbmQgYXZlcmFnZSwgbW9yZSB0YWtlcyBsb25nZXJcbiAgICAgICAgLy8gYnV0IGlzIG1vcmUgJ3Ntb290aCdcbiAgICAgICAgY29uc3QgTlVNU0FNUExFUyA9IDU7XG4gICAgICAgIC8vIFRoZSBiZXRhIGNvZWZmaWNpZW50IG9mIHRoZSB0aGVybWlzdG9yICh1c3VhbGx5IDMwMDAtNDAwMClcbiAgICAgICAgY29uc3QgQkNPRUZGSUNJRU5UID0gMzk1MDtcbiAgICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSAnb3RoZXInIHJlc2lzdG9yXG4gICAgICAgIGNvbnN0IFNFUklFU1JFU0lTVE9SID0gMTAwMDA7XG4gICAgICAgLy8gY29udmVydCB0aGUgdmFsdWUgdG8gcmVzaXN0YW5jZVxuICAgICAgIC8vIEFyZSB3ZSB1c2luZyBBREM/XG4gICAgICAgaWYoa2V0dGxlLnRlbXAucGluLmluZGV4T2YoJ0MnKSA9PT0gMCl7XG4gICAgICAgICBhdmVyYWdlID0gKGF2ZXJhZ2UgKiAoNS4wIC8gNjU1MzUpKSAvIDAuMDAwMTtcbiAgICAgICAgIHZhciBsbiA9IE1hdGgubG9nKGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTCk7XG4gICAgICAgICB2YXIga2VsdmluID0gMSAvICgwLjAwMzM1NDAxNzAgKyAoMC4wMDAyNTYxNzI0NCAqIGxuKSArICgwLjAwMDAwMjE0MDA5NDMgKiBsbiAqIGxuKSArICgtMC4wMDAwMDAwNzI0MDUyMTkgKiBsbiAqIGxuICogbG4pKTtcbiAgICAgICAgICAvLyBrZWx2aW4gdG8gY2Vsc2l1c1xuICAgICAgICAgcmV0dXJuIGtlbHZpbiAtIDI3My4xNTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICAgIHZhciBzdGVpbmhhcnQgPSBhdmVyYWdlIC8gVEhFUk1JU1RPUk5PTUlOQUw7ICAgICAvLyAoUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgICBzdGVpbmhhcnQgKz0gMS4wIC8gKFRFTVBFUkFUVVJFTk9NSU5BTCArIDI3My4xNSk7IC8vICsgKDEvVG8pXG4gICAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgICByZXR1cm4gc3RlaW5oYXJ0O1xuICAgICAgIH1cbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKGtldHRsZS50ZW1wLnJhdyAmJiBrZXR0bGUudGVtcC5yYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChrZXR0bGUudGVtcC5yYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZiggISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0ICYmIGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSA9PT0gLTEpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKCAhIWluZmx1eGRiLnBvcnQgJiYgaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpID09PSAtMSlcbiAgICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7aW5mbHV4ZGIucG9ydH1gXG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn1gLCBtZXRob2Q6ICdHRVQnfTtcbiAgICAgICAgICBpZihpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2A7XG4gICAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51c2VyICYmIGluZmx1eGRiLnBhc3Mpe1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoaW5mbHV4ZGIudXNlci50cmltKCkrJzonK2luZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2Eoc2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCkrJzonK3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xKXtcbiAgICAgICAgICAgIHEucmVzb2x2ZShbc2V0dGluZ3MuaW5mbHV4ZGIudXNlcl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xKXtcbiAgICAgICAgICAgIHEucmVqZWN0KCdEYXRhYmFzZSBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6ICEhb3B0aW9ucy5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6ICEhb3B0aW9ucy5zZXNzaW9uID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gISFvcHRpb25zLmNoYXJ0LmFyZWEgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCEhb3B0aW9ucy5jaGFydC5taWxpdGFyeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgdmFyIHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgdmFyIHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICB2YXIgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9