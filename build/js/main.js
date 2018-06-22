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
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTlib-1.2.8.zip');
        currentSketch.headers.push('#include <dht.h>');
      }
      if (kettle.temp.type.indexOf('DS18B20') !== -1 && currentSketch.headers.indexOf('#include "cactus_io_DS18B20.h"') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
        currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
      }
      // Are we using ADC?
      if (kettle.temp.pin.indexOf('C') === 0 && currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) {
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
        connection_string = 'http://10.0.1.14:3001';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZ2VuZXJhbCIsImNoYXJ0T3B0aW9ucyIsInVuaXQiLCJjaGFydCIsInNlc3Npb24iLCJzdHJlYW1zIiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJzdGF0dXMiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImFkYyIsInNlY3VyZSIsInZlcnNpb24iLCJkdCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImVtZXRlciIsImdldF9yZWFsdGltZSIsImVycl9jb2RlIiwicG93ZXIiLCJkZXZpY2UiLCJ0b2dnbGUiLCJvZmZPck9uIiwicmVsYXlfc3RhdGUiLCJhZGRLZXR0bGUiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJ2Y2MiLCJoaXQiLCJtZWFzdXJlZCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZvbHRzIiwidmFsdWVzIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJjb3VudCIsIm5vdGlmeSIsInNsYWNrIiwiZHdlZXQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwicGluRGlzcGxheSIsImRldmljZUlkIiwic3Vic3RyIiwiYWxpYXMiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNoYW5nZVNlbnNvciIsInNlbnNvclR5cGVzIiwicGVyY2VudCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwiZW1haWwiLCJzaGFyZV9zdGF0dXMiLCJzaGFyZV9zdWNjZXNzIiwic2hhcmVfbGluayIsInNoYXJlVGVzdCIsInRlc3RpbmciLCJodHRwX2NvZGUiLCJwdWJsaWMiLCJpbmZsdXhkYiIsImJyZXdiZW5jaEhvc3RlZCIsInJlbW92ZSIsImRlZmF1bHRTZXR0aW5ncyIsImNvbm5lY3QiLCJwaW5nIiwiJCIsInJlbW92ZUNsYXNzIiwiZGIiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsImFkZENsYXNzIiwiY3JlYXRlIiwibW9tZW50IiwiZm9ybWF0IiwiY3JlYXRlZCIsImNyZWF0ZURCIiwiZGF0YSIsInJlc3VsdHMiLCJyZXNldEVycm9yIiwiY29ubmVjdGVkIiwidXNlcm5hbWUiLCJhcGlfa2V5IiwiYXV0aCIsInJlbGF5Iiwic2F2ZSIsImtldHRsZVJlc3BvbnNlIiwibWVyZ2UiLCJjb25zb2xlIiwic2Vzc2lvbnMiLCJzaGFyZUFjY2VzcyIsInNoYXJlZCIsImZyYW1lRWxlbWVudCIsImxvYWRTaGFyZUZpbGUiLCJjb250ZW50cyIsIm5vdGlmaWNhdGlvbnMiLCJvbiIsImhpZ2giLCJsb3ciLCJsYXN0Iiwic3ViVGV4dCIsImVuYWJsZWQiLCJ0ZXh0IiwiY29sb3IiLCJmb250IiwicHJvY2Vzc1RlbXBzIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsInVwZGF0ZUFyZHVpbm9TdGF0dXMiLCJkb21haW4iLCJza2V0Y2hfdmVyc2lvbiIsInVwZGF0ZVRlbXAiLCJrZXkiLCJ0ZW1wcyIsInNoaWZ0IiwiY3VycmVudFZhbHVlIiwidW5pdFR5cGUiLCJnZXRUaW1lIiwiZ2V0TmF2T2Zmc2V0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsInN0YXJ0U3RvcEtldHRsZSIsIk1hdGgiLCJyb3VuZCIsIm9mZiIsImltcG9ydFNldHRpbmdzIiwicHJvZmlsZUNvbnRlbnQiLCJleHBvcnRTZXR0aW5ncyIsImkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjb21waWxlU2tldGNoIiwic2tldGNoTmFtZSIsInNrZXRjaGVzIiwiYXJkdWlub05hbWUiLCJjdXJyZW50U2tldGNoIiwiYWN0aW9ucyIsInRyaWdnZXJzIiwia2V0dGxlVHlwZSIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwidHJpbSIsImFkZGl0aW9uYWxfcG9zdF9wYXJhbXMiLCJwb3J0Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsInVwZGF0ZVN0cmVhbXMiLCJjaGFuZ2VVbml0cyIsInYiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwicmVtb3ZlS2V0dGxlIiwiJGluZGV4IiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsInVwZGF0ZUxvY2FsIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJhY2Nlc3NUb2tlbiIsInNldEl0ZW0iLCJnZXRJdGVtIiwiZGVidWciLCJzaG93IiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsInNlbnNvcnMiLCJ3ZWJob29rX3VybCIsInEiLCJkZWZlciIsInBvc3RPYmoiLCJyZXNvbHZlIiwicmVqZWN0IiwicHJvbWlzZSIsInJlcXVlc3QiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJkaWdpdGFsUmVhZCIsInF1ZXJ5IiwibWQ1Iiwic2giLCJsYXRlc3QiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsInVwZGF0ZWRLZXR0bGUiLCJzZXNzaW9uSWQiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsImxuIiwibG9nIiwia2VsdmluIiwic3RlaW5oYXJ0IiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdCQUFjRyxRQUFkLENBQXVCRSxPQUF2QixDQUErQkMsTUFBL0IsR0FBd0MsZ0NBQXhDO0FBQ0EsU0FBT04sY0FBY0csUUFBZCxDQUF1QkUsT0FB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QkMsR0FBRyxHQUFuQixFQXRmYyxFQXVmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZmYyxFQXdmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxLQUFoQixFQXhmYyxFQXlmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXpmYyxFQTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkExaEIsUUFBRThELElBQUYsQ0FBTzBkLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVEzaEIsT0FBUixDQUFnQitoQixLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUTVoQixPQUFSLENBQWdCd1gsT0FBT3dLLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBNW1ESSxHQUFQO0FBOG1ERCxDQWpuREQsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICB3aW5kb3cubG9jYXRpb24uaHJlZj0nLyc7XG59O1xuXG5pZiggJHN0YXRlLmN1cnJlbnQubmFtZSA9PSAncmVzZXQnKVxuICAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuXG52YXIgbm90aWZpY2F0aW9uID0gbnVsbCxcbiAgcmVzZXRDaGFydCA9IDEwMCxcbiAgdGltZW91dCA9IG51bGw7Ly9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLkJyZXdTZXJ2aWNlID0gQnJld1NlcnZpY2U7XG4kc2NvcGUuc2l0ZSA9IHtodHRwczogISEoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2w9PSdodHRwczonKVxuICAsIGh0dHBzX3VybDogYGh0dHBzOi8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fWBcbn07XG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUucGtnO1xuJHNjb3BlLmtldHRsZVR5cGVzID0gQnJld1NlcnZpY2Uua2V0dGxlVHlwZXMoKTtcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogNSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYoISFsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4vLyBnZW5lcmFsIGNoZWNrIGFuZCB1cGRhdGVcbmlmKCEkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbClcbiAgcmV0dXJuICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0LCBzZXNzaW9uOiAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9ufSk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiRzY29wZS5zaGFyZSA9ICghJHN0YXRlLnBhcmFtcy5maWxlICYmIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpKSA/IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpIDoge1xuICAgICAgZmlsZTogJHN0YXRlLnBhcmFtcy5maWxlIHx8IG51bGxcbiAgICAgICwgcGFzc3dvcmQ6IG51bGxcbiAgICAgICwgbmVlZFBhc3N3b3JkOiBmYWxzZVxuICAgICAgLCBhY2Nlc3M6ICdyZWFkT25seSdcbiAgICAgICwgZGVsZXRlQWZ0ZXI6IDE0XG4gIH07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW1CeShvYmosJ2Ftb3VudCcpO1xufVxuXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS5nZXRTdGF0dXNDbGFzcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIGlmKHN0YXR1cyA9PSAnQ29ubmVjdGVkJylcbiAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICBlbHNlIGlmKF8uZW5kc1dpdGgoc3RhdHVzLCdpbmcnKSlcbiAgICByZXR1cm4gJ3NlY29uZGFyeSc7XG4gIGVsc2VcbiAgICByZXR1cm4gJ2Rhbmdlcic7XG59XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgZGlnaXRhbDogMTMsXG4gICAgICAgIGFkYzogMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbjogJycsXG4gICAgICAgIHN0YXR1czoge2Vycm9yOiAnJyxkdDogJyd9XG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSBhcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IChpbmRleCwgYXJkdWlubykgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAgZGVsZXRlIGtldHRsZS5hcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgbG9naW46ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RpbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkubG9naW4oJHNjb3BlLnNldHRpbmdzLnRwbGluay51c2VyLCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGFzcylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnRva2VuKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnRva2VuID0gcmVzcG9uc2UudG9rZW47XG4gICAgICAgICAgICAkc2NvcGUudHBsaW5rLnNjYW4ocmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnU2Nhbm5pbmcnO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZighIXBsdWcuc3RhdHVzKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgcGx1Zy5wb3dlciA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWU7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIHZhciBvZmZPck9uID0gZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSA/IDAgOiAxO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkudG9nZ2xlKGRldmljZSwgb2ZmT3JPbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gb2ZmT3JPbjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkudGhlbih0b2dnbGVSZXNwb25zZSA9PiB7XG4gICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZm9cbiAgICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgZGV2aWNlLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIGlmKEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLmVtZXRlci5nZXRfcmVhbHRpbWUuZXJyX2NvZGUgPT0gMCl7XG4gICAgICAgICAgICAgICAgZGV2aWNlLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX07XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHZjYzonJyx0eXBlOidUaGVybWlzdG9yJyxhZGM6ZmFsc2UsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZixyYXc6MCx2b2x0czowfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86IGFyZHVpbm9cbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gcGluO1xuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKFxuICAgICAgICAgIChrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgICAoa2V0dGxlLnRlbXAudmNjPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgICAoIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlU2Vuc29yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQpe1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IudW5pdCA9ICdcXHUwMEIwJztcbiAgICB9XG4gICAga2V0dGxlLnRlbXAudmNjID0gJyc7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZVNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIuZW1haWwpXG4gICAgICByZXR1cm47XG4gICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICdDcmVhdGluZyBzaGFyZSBsaW5rLi4uJztcbiAgICByZXR1cm4gQnJld1NlcnZpY2UuY3JlYXRlU2hhcmUoJHNjb3BlLnNoYXJlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYocmVzcG9uc2Uuc2hhcmUgJiYgcmVzcG9uc2Uuc2hhcmUudXJsKXtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJyc7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9saW5rID0gcmVzcG9uc2Uuc2hhcmUudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gZXJyO1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVUZXN0ID0gZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgYXJkdWluby50ZXN0aW5nID0gdHJ1ZTtcbiAgICBCcmV3U2VydmljZS5zaGFyZVRlc3QoYXJkdWlubylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLmh0dHBfY29kZSA9PSAyMDApXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSB0cnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgYnJld2JlbmNoSG9zdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmwuaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vZ2V0IGxpc3Qgb2YgZGF0YWJhc2VzXG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN0cmVhbXMgPSB7XG4gICAgY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gKCEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgJiZcbiAgICAgICAgISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcyA9IGRlZmF1bHRTZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5KVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmF1dGgodHJ1ZSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGtldHRsZXM6IChrZXR0bGUsIHJlbGF5KSA9PiB7XG4gICAgICBpZihyZWxheSl7XG4gICAgICAgIGtldHRsZVtyZWxheV0uc2tldGNoID0gIWtldHRsZVtyZWxheV0uc2tldGNoO1xuICAgICAgICBpZigha2V0dGxlLm5vdGlmeS5zdHJlYW1zKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gJ3NrZXRjaGVzJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnaW5mbyc7XG4gICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAwO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5rZXR0bGVzLnNhdmUoa2V0dGxlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgdmFyIGtldHRsZVJlc3BvbnNlID0gcmVzcG9uc2Uua2V0dGxlO1xuICAgICAgICAgIC8vIHVwZGF0ZSBrZXR0bGUgdmFyc1xuICAgICAgICAgIGtldHRsZS5pZCA9IGtldHRsZVJlc3BvbnNlLmlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBhcmR1aW5vIGlkXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywgYXJkdWlubyA9PiB7XG4gICAgICAgICAgICBpZihhcmR1aW5vLmlkID09IGtldHRsZS5hcmR1aW5vLmlkKVxuICAgICAgICAgICAgICBhcmR1aW5vLmlkID0ga2V0dGxlUmVzcG9uc2UuZGV2aWNlSWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICAvLyB1cGRhdGUgc2Vzc2lvbiB2YXJzXG4gICAgICAgICAgXy5tZXJnZSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLCBrZXR0bGVSZXNwb25zZS5zZXNzaW9uKTtcblxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnc3VjY2Vzcyc7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zID0gIWtldHRsZS5ub3RpZnkuc3RyZWFtcztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAxO1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuZGF0YSAmJiBlcnIuZGF0YS5lcnJvciAmJiBlcnIuZGF0YS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLmRhdGEuZXJyb3IubWVzc2FnZSwga2V0dGxlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JyZXdCZW5jaCBTdHJlYW1zIEVycm9yJywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2Vzc2lvbnM6IHtcbiAgICAgIHNhdmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5zZXNzaW9ucy5zYXZlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuXG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5zaGFyZUFjY2VzcyA9IGZ1bmN0aW9uKGFjY2Vzcyl7XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQgPSB0cnVlO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5sb2FkU2hhcmVGaWxlKCRzY29wZS5zaGFyZS5maWxlLCAkc2NvcGUuc2hhcmUucGFzc3dvcmQgfHwgbnVsbClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGlmKGNvbnRlbnRzKXtcbiAgICAgICAgICBpZihjb250ZW50cy5uZWVkUGFzc3dvcmQpe1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IHRydWU7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncy5yZWNpcGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlID0gY29udGVudHMuc2V0dGluZ3MucmVjaXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gZmFsc2U7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zaGFyZSAmJiBjb250ZW50cy5zaGFyZS5hY2Nlc3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2hhcmUuYWNjZXNzID0gY29udGVudHMuc2hhcmUuYWNjZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBjb250ZW50cy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMgPSB7b246ZmFsc2UsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMua2V0dGxlcyl7XG4gICAgICAgICAgICAgIF8uZWFjaChjb250ZW50cy5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAgICAgICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMDArNSxzdWJUZXh0OntlbmFibGVkOiB0cnVlLHRleHQ6ICdzdGFydGluZy4uLicsY29sb3I6ICdncmF5Jyxmb250OiAnYXV0byd9fSk7XG4gICAgICAgICAgICAgICAga2V0dGxlLnZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXMgPSBjb250ZW50cy5rZXR0bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBsb2FkaW5nIHRoZSBzaGFyZWQgc2Vzc2lvbi5cIik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoISFmb3JtYXR0ZWRfY29udGVudCl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZighIWpzb25PYmouUmVjaXBlcyAmJiAhIWpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoISFqc29uT2JqLlNlbGVjdGlvbnMgJiYgISFqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZighIWpzb25PYmouUkVDSVBFUyAmJiAhIWpzb25PYmouUkVDSVBFUy5SRUNJUEUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZighIXJlY2lwZS5vZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKCEhcmVjaXBlLmZnKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChncmFpbi5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogZ3JhaW4ubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChncmFpbi5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChob3AuYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBob3AubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChob3AuYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkc2NvcGUuc2hvd1NldHRpbmdzID0gISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUsIGxvY2F0aW9uKXtcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzID0gZnVuY3Rpb24ocmVzcG9uc2UsIGVycm9yKXtcbiAgICB2YXIgYXJkdWlubyA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywge2lkOiByZXNwb25zZS5rZXR0bGUuYXJkdWluby5pZH0pO1xuICAgIGlmKGFyZHVpbm8ubGVuZ3RoKXtcbiAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICBhcmR1aW5vWzBdLnZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIGlmKGVycm9yKVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9IGVycm9yO1xuICAgICAgZWxzZVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2Upe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgLy8gbmVlZGVkIGZvciBjaGFydHNcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlLm5hbWU7XG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vdXBkYXRlIGRhdGF0eXBlXG4gICAgcmVzcG9uc2UudGVtcCA9IHBhcnNlRmxvYXQocmVzcG9uc2UudGVtcCk7XG4gICAgcmVzcG9uc2UucmF3ID0gcGFyc2VGbG9hdChyZXNwb25zZS5yYXcpO1xuICAgIGlmKHJlc3BvbnNlLnZvbHRzKVxuICAgICAgcmVzcG9uc2Uudm9sdHMgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnZvbHRzKTtcblxuICAgIGlmKCEha2V0dGxlLnRlbXAuY3VycmVudClcbiAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgJGZpbHRlcigncm91bmQnKShyZXNwb25zZS50ZW1wLDIpO1xuICAgIC8vIGFkZCBhZGp1c3RtZW50XG4gICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgLy8gc2V0IHJhd1xuICAgIGtldHRsZS50ZW1wLnJhdyA9IHJlc3BvbnNlLnJhdztcbiAgICAvLyB2b2x0IGNoZWNrXG4gICAgaWYocmVzcG9uc2Uudm9sdHMpe1xuICAgICAga2V0dGxlLnRlbXAudm9sdHMgPSByZXNwb25zZS52b2x0cztcbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InICYmXG4gICAgICAgIGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdBJyk9PT0wICYmXG4gICAgICAgIHJlc3BvbnNlLnZvbHRzIDwgMilcbiAgICAgICAge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1NlbnNvciBpcyBub3QgY29ubmVjdGVkJywga2V0dGxlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXMuc2hpZnQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUIHNlbnNvcnMgaGF2ZSBodW1pZGl0eSBhcyBhIHBlcmNlbnRcbiAgICAvL1NvaWxNb2lzdHVyZUQgaGFzIG1vaXN0dXJlIGFzIGEgcGVyY2VudFxuICAgIGlmKCB0eXBlb2YgcmVzcG9uc2UucGVyY2VudCAhPSAndW5kZWZpbmVkJyl7XG4gICAgICBrZXR0bGUucGVyY2VudCA9IHJlc3BvbnNlLnBlcmNlbnQ7XG4gICAgfVxuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICB2YXIgY3VycmVudFZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICB2YXIgdW5pdFR5cGUgPSAnXFx1MDBCMCc7XG4gICAgLy9wZXJjZW50P1xuICAgIGlmKCEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxjdXJyZW50VmFsdWVdKTtcbiAgICB9XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoY3VycmVudFZhbHVlID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihjdXJyZW50VmFsdWUgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoJykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgdmFyIGs7XG5cbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuXG4gICAgaWYoa2V0dGxlLmFjdGl2ZSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIHRydWUpO1xuICAgIH0gZWxzZSBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmhhc1NrZXRjaGVzID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICB2YXIgaGFzQVNrZXRjaCA9IGZhbHNlO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgIGlmKChrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKSB8fFxuICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCkgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc2xhY2sgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5kd2VldFxuICAgICAgKSB7XG4gICAgICAgIGhhc0FTa2V0Y2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBoYXNBU2tldGNoO1xuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKGtldHRsZS5hY3RpdmUpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnc3RhcnRpbmcuLi4nO1xuXG4gICAgICAgIEJyZXdTZXJ2aWNlLnRlbXAoa2V0dGxlKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCBrZXR0bGUpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gdWRwYXRlIGNoYXJ0IHdpdGggY3VycmVudFxuICAgICAgICAgICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudCsrO1xuICAgICAgICAgICAgaWYoa2V0dGxlLm1lc3NhZ2UuY291bnQ9PTcpXG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSByZWxheXNcbiAgICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAgICAgIGlmKGtldHRsZS5wdW1wKSBrZXR0bGUucHVtcC5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5oZWF0ZXIpIGtldHRsZS5oZWF0ZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuY29vbGVyKSBrZXR0bGUuY29vbGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUmVsYXkgPSBmdW5jdGlvbihrZXR0bGUsIGVsZW1lbnQsIG9uKXtcbiAgICBpZihvbikge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20pe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sTWF0aC5yb3VuZCgyNTUqZWxlbWVudC5kdXR5Q3ljbGUvMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSBpZihlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwyNTUpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDEpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20gfHwgZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS5pbXBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcbiAgICB0cnkge1xuICAgICAgdmFyIHByb2ZpbGVDb250ZW50ID0gSlNPTi5wYXJzZSgkZmlsZUNvbnRlbnQpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzID0gcHJvZmlsZUNvbnRlbnQuc2V0dGluZ3MgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5rZXR0bGVzID0gcHJvZmlsZUNvbnRlbnQua2V0dGxlcyB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAvLyBlcnJvciBpbXBvcnRpbmdcbiAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5leHBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGtldHRsZXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmtldHRsZXMpO1xuICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBrZXR0bGVzW2ldLnZhbHVlcyA9IFtdO1xuICAgICAga2V0dGxlc1tpXS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHtcInNldHRpbmdzXCI6ICRzY29wZS5zZXR0aW5ncyxcImtldHRsZXNcIjoga2V0dGxlc30pKTtcbiAgfTtcblxuICAkc2NvcGUuY29tcGlsZVNrZXRjaCA9IGZ1bmN0aW9uKHNrZXRjaE5hbWUpe1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWluby51cmwucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIik7XG4gICAgICB2YXIgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICBoZWFkZXJzOiBbXSxcbiAgICAgICAgICB0cmlnZ2VyczogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICB2YXIgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIWtldHRsZS50ZW1wLmFkanVzdCkgPyAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVGxpYi0xLjIuOC56aXAnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpO1xuICAgICAgfVxuICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgIGlmKGtldHRsZS50ZW1wLnBpbi5pbmRleE9mKCdDJykgPT09IDAgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxBZGFmcnVpdF9BRFMxMDE1Lmg+JykgPT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxXaXJlLmg+Jyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpO1xuICAgICAgfVxuICAgICAgdmFyIGtldHRsZVR5cGUgPSBrZXR0bGUudGVtcC50eXBlO1xuICAgICAgaWYoa2V0dGxlLnRlbXAudmNjKSBrZXR0bGVUeXBlICs9IGtldHRsZS50ZW1wLnZjYztcbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCdhY3Rpb25zQ29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZVR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmKHNrZXRjaC50cmlnZ2Vycyl7XG4gICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpXG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZFxuICAgICAgICBmb3IodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYWN0aW9uc0NvbW1hbmQoJykgIT09IC0xKVxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYWN0aW9uc0NvbW1hbmQoJywndGVtcCA9IGFjdGlvbnNDb21tYW5kKCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaCcrc2tldGNoTmFtZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZG93bmxvYWRTa2V0Y2gobmFtZSwgYWN0aW9ucywgaGFzVHJpZ2dlcnMsIGhlYWRlcnMsIHNrZXRjaCl7XG4gICAgLy8gdHAgbGluayBjb25uZWN0aW9uXG4gICAgdmFyIHRwbGlua19jb25uZWN0aW9uX3N0cmluZyA9IEJyZXdTZXJ2aWNlLnRwbGluaygpLmNvbm5lY3Rpb24oKTtcbiAgICB2YXIgYXV0b2dlbiA9ICcvKiBTa2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY28gb24gJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJyAqL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbYWN0aW9uc10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2hlYWRlcnNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1ZFUlNJT05cXF0vZywgJHNjb3BlLnBrZy5za2V0Y2hfdmVyc2lvbilcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVFBMSU5LX0NPTk5FQ1RJT05cXF0vZywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtTTEFDS19DT05ORUNUSU9OXFxdL2csICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKVxuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ1N0cmVhbXMnKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIHN0cmVhbXMgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGBodHRwczovLyR7JHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9LnN0cmVhbXMuYnJld2JlbmNoLmNvYDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyA9ICdodHRwOi8vMTAuMC4xLjE0OjMwMDEnO1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW1NUUkVBTVNfQ09OTkVDVElPTlxcXS9nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1RSRUFNU19BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5LnRyaW0oKSkpO1xuICAgICAgICB9IGlmKCBza2V0Y2guaW5kZXhPZignSW5mbHV4REInKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGluZmx1eCBkYiBjb25uZWN0aW9uXG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYCR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgICAgIGlmKCRzY29wZS5pbmZsdXhkYi5icmV3YmVuY2hIb3N0ZWQoKSl7XG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL2JicCc7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpKyc6Jyskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpKTtcbiAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zID0gJyAgcC5hZGRQYXJhbWV0ZXIoRihcIi1IXCIpKTtcXG4nO1xuICAgICAgICAgICAgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyArPSAnICBwLmFkZFBhcmFtZXRlcihGKFwiWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKydcIikpOyc7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKCcvLyBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zJywgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKCAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgICAvLyBhZGQgdXNlci9wYXNzXG4gICAgICAgICAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAgICAgICAgIC8vIGFkZCBkYlxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBBREMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoYXNUcmlnZ2Vycyl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLm5vdGlmeSA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIHZhciBjdXJyZW50VmFsdWUgPSAoa2V0dGxlICYmIGtldHRsZS50ZW1wKSA/IGtldHRsZS50ZW1wLmN1cnJlbnQgOiAwO1xuICAgIHZhciB1bml0VHlwZSA9ICdcXHUwMEIwJztcbiAgICAvL3BlcmNlbnQ/XG4gICAgaWYoa2V0dGxlICYmICEhQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXMoa2V0dGxlLnRlbXAudHlwZSkucGVyY2VudCAmJiB0eXBlb2Yga2V0dGxlLnBlcmNlbnQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgY3VycmVudFZhbHVlID0ga2V0dGxlLnBlcmNlbnQ7XG4gICAgICB1bml0VHlwZSA9ICdcXHUwMDI1JztcbiAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksY3VycmVudFZhbHVlXSk7XG4gICAgfVxuXG4gICAgaWYoISF0aW1lcil7IC8va2V0dGxlIGlzIGEgdGltZXIgb2JqZWN0XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGltZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZih0aW1lci51cClcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHRpbWVycyBhcmUgZG9uZSc7XG4gICAgICBlbHNlIGlmKCEhdGltZXIubm90ZXMpXG4gICAgICAgIG1lc3NhZ2UgPSAnVGltZSB0byBhZGQgJyt0aW1lci5ub3RlcysnIG9mICcrdGltZXIubGFiZWw7XG4gICAgICBlbHNlXG4gICAgICAgIG1lc3NhZ2UgPSAnVGltZSB0byBhZGQgJyt0aW1lci5sYWJlbDtcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmhpZ2gpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmhpZ2ggfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2hpZ2gnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyAnKyRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZiwwKSt1bml0VHlwZSsnIGhpZ2gnO1xuICAgICAgY29sb3IgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2hpZ2gnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUubG93KXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sb3cgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2xvdycpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBsb3cnO1xuICAgICAgY29sb3IgPSAnIzM0OThEQic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdsb3cnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGFyZ2V0IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSd0YXJnZXQnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2N1cnJlbnRWYWx1ZSt1bml0VHlwZTtcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0ndGFyZ2V0JztcbiAgICB9XG4gICAgZWxzZSBpZigha2V0dGxlKXtcbiAgICAgIG1lc3NhZ2UgPSAnVGVzdGluZyBBbGVydHMsIHlvdSBhcmUgcmVhZHkgdG8gZ28sIGNsaWNrIHBsYXkgb24gYSBrZXR0bGUuJztcbiAgICB9XG5cbiAgICAvLyBNb2JpbGUgVmlicmF0ZSBOb3RpZmljYXRpb25cbiAgICBpZiAoXCJ2aWJyYXRlXCIgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3IudmlicmF0ZShbNTAwLCAzMDAsIDUwMF0pO1xuICAgIH1cblxuICAgIC8vIFNvdW5kIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zb3VuZHMub249PT10cnVlKXtcbiAgICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICAgIGlmKCEhdGltZXIgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKCghIXRpbWVyKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgbWVhc3VyZWQgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgJiYga2V0dGxlLm1lc3NhZ2UudHlwZSA9PSAnZGFuZ2VyJyl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgdmFyIHVuaXRUeXBlID0gJ1xcdTAwQjAnO1xuICAgIC8vcGVyY2VudD9cbiAgICBpZighIUJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzKGtldHRsZS50ZW1wLnR5cGUpLnBlcmNlbnQgJiYgdHlwZW9mIGtldHRsZS5wZXJjZW50ICE9ICd1bmRlZmluZWQnKXtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGtldHRsZS5wZXJjZW50O1xuICAgICAgdW5pdFR5cGUgPSAnXFx1MDAyNSc7XG4gICAgfVxuICAgIC8vaXMgY3VycmVudFZhbHVlIHRvbyBoaWdoP1xuICAgIGlmKGN1cnJlbnRWYWx1ZSA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjEpJztcbiAgICAgIGtldHRsZS5oaWdoID0gY3VycmVudFZhbHVlLWtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBoaWdoJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoY3VycmVudFZhbHVlIDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC41KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuMSknO1xuICAgICAga2V0dGxlLmxvdyA9IGtldHRsZS50ZW1wLnRhcmdldC1jdXJyZW50VmFsdWU7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrdW5pdFR5cGUrJyBsb3cnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjEpJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICd3aXRoaW4gdGFyZ2V0JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZUtldHRsZVR5cGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIC8vZG9uJ3QgYWxsb3cgY2hhbmdpbmcga2V0dGxlcyBvbiBzaGFyZWQgc2Vzc2lvbnNcbiAgICAvL3RoaXMgY291bGQgYmUgZGFuZ2Vyb3VzIGlmIGRvaW5nIHRoaXMgcmVtb3RlbHlcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpXG4gICAgICByZXR1cm47XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUubmFtZSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAudGFyZ2V0KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuY3VycmVudCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAubWVhc3VyZWQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnByZXZpb3VzLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLnRhcmdldCwwKTtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC5hZGp1c3Qpe1xuICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgICAgICBpZih1bml0ID09PSAnQycpXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS50ZW1wLmFkanVzdCoxLjgsMCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGNoYXJ0IHZhbHVlc1xuICAgICAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmVhY2goa2V0dGxlLnZhbHVlcywgKHYsIGkpID0+IHtcbiAgICAgICAgICAgICAga2V0dGxlLnZhbHVlc1tpXSA9IFtrZXR0bGUudmFsdWVzW2ldWzBdLCRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudmFsdWVzW2ldWzFdLHVuaXQpXTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUga25vYlxuICAgICAgICBrZXR0bGUua25vYi52YWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKzEwO1xuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydCwgc2Vzc2lvbjogJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbn0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoICEha2V0dGxlICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZighIWtldHRsZSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZUtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSwkaW5kZXgpe1xuICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgJHNjb3BlLmtldHRsZXMuc3BsaWNlKCRpbmRleCwxKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICBpZihmaWVsZCA9PSAnYWRqdXN0Jyl7XG4gICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICB9XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS51cGRhdGVTdHJlYW1zID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL3VwZGF0ZSBzdHJlYW1zXG4gICAgaWYoJHNjb3BlLnN0cmVhbXMuY29ubmVjdGVkKCkgJiYga2V0dGxlLm5vdGlmeS5zdHJlYW1zKXtcbiAgICAgICRzY29wZS5zdHJlYW1zLmtldHRsZXMoa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKCEhbG9hZGVkKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcblxuICAvLyB1cGRhdGUgbG9jYWwgY2FjaGVcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsID0gZnVuY3Rpb24oKXtcbiAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJywgJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJywkc2NvcGUua2V0dGxlcyk7XG4gICAgICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbiAgICB9LDUwMDApO1xuICB9XG4gICRzY29wZS51cGRhdGVMb2NhbCgpO1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfVxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBhY2Nlc3NUb2tlbjogZnVuY3Rpb24odG9rZW4pe1xuICAgICAgaWYodG9rZW4pXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FjY2Vzc1Rva2VuJyx0b2tlbik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgfSxcbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZ2VuZXJhbDoge2RlYnVnOiBmYWxzZSwgcG9sbFNlY29uZHM6IDEwLCB1bml0OiAnRicsIHNoYXJlZDogZmFsc2V9XG4gICAgICAgICxjaGFydDoge3Nob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2V9XG4gICAgICAgICxyZWNpcGU6IHsnbmFtZSc6JycsJ2JyZXdlcic6e25hbWU6JycsJ2VtYWlsJzonJ30sJ3llYXN0JzpbXSwnaG9wcyc6W10sJ2dyYWlucyc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhcmR1aW5vczogW3tpZDonbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlLHZlcnNpb246Jycsc3RhdHVzOntlcnJvcjonJyxkdDonJ319XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiAnJywgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczpbXSwgc3RhdHVzOiAnJ31cbiAgICAgICAgLHN0cmVhbXM6IHt1c2VybmFtZTogJycsIGFwaV9rZXk6ICcnLCBzdGF0dXM6ICcnLCBzZXNzaW9uOiB7aWQ6ICcnLCBuYW1lOiAnJywgdHlwZTogJ2Zlcm1lbnRhdGlvbid9fVxuICAgICAgfTtcbiAgICAgIHJldHVybiBkZWZhdWx0U2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbmFtZTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdmNjOicnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MCx2b2x0czowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnTWFzaCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2dyYWluJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENCcscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0ExJyx2Y2M6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdCb2lsJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx2Y2M6JycsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyLHJhdzowLHZvbHRzOjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9IGVsc2UgaWYoa2V5ID09ICdzZXR0aW5ncycpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDEyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdTb2lsTW9pc3R1cmUnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlLCB2Y2M6IHRydWUsIHBlcmNlbnQ6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICB2YXIga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonQWlyJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidTb2lsJywndHlwZSc6J2xlYWYnLCd0YXJnZXQnOjYwLCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgdmFyIHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZVxuICAgICAgaWYoISFrZXR0bGUudGVtcC52Y2MpIHVybCArPSBrZXR0bGUudGVtcC52Y2M7XG4gICAgICB1cmwgKz0gJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcjtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIHZhciBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmluZmx1eGRiO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnRwbGluaztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnNrZXRjaGVzO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkd2VldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYXRlc3Q6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9sYXRlc3QvZHdlZXQvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9kd2VldHMvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgc3RyZWFtczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEvYXBpJywgaGVhZGVyczoge30sIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAocGluZykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiYgc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAocGluZykgPyAnL3VzZXJzL3BpbmcnIDogJy91c2Vycy9hdXRoJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9J2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1LZXknXSA9IGAke3NldHRpbmdzLnN0cmVhbXMuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUJCLVVzZXInXSA9IGAke3NldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9YDtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKVxuICAgICAgICAgICAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbihyZXNwb25zZS5kYXRhLmFjY2Vzcy5pZCk7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVqZWN0KGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAga2V0dGxlczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNhdmU6IGFzeW5jIChrZXR0bGUpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cGRhdGVkS2V0dGxlID0gYW5ndWxhci5jb3B5KGtldHRsZSk7XG4gICAgICAgICAgICAvLyByZW1vdmUgbm90IG5lZWRlZCBkYXRhXG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS52YWx1ZXM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5tZXNzYWdlO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudGltZXJzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUua25vYjtcbiAgICAgICAgICAgIHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QgPSAoc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISF1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykodXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMvYXJtJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uOiBzZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sXG4gICAgICAgICAgICAgIGtldHRsZTogdXBkYXRlZEtldHRsZSxcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczogc2V0dGluZ3Mubm90aWZpY2F0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uSWQ6IHNlc3Npb25JZCxcbiAgICAgICAgICAgICAga2V0dGxlOiBrZXR0bGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNhdmU6IGFzeW5jIChzZXNzaW9uKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zLycrc2Vzc2lvbi5pZDtcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BBVENIJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgbmFtZTogc2Vzc2lvbi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlOiBzZXNzaW9uLnR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgLy8gQXJlIHdlIHVzaW5nIEFEQz9cbiAgICAgICBpZihrZXR0bGUudGVtcC5waW4uaW5kZXhPZignQycpID09PSAwKXtcbiAgICAgICAgIGF2ZXJhZ2UgPSAoYXZlcmFnZSAqICg1LjAgLyA2NTUzNSkpIC8gMC4wMDAxO1xuICAgICAgICAgdmFyIGxuID0gTWF0aC5sb2coYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMKTtcbiAgICAgICAgIHZhciBrZWx2aW4gPSAxIC8gKDAuMDAzMzU0MDE3MCArICgwLjAwMDI1NjE3MjQ0ICogbG4pICsgKDAuMDAwMDAyMTQwMDk0MyAqIGxuICogbG4pICsgKC0wLjAwMDAwMDA3MjQwNTIxOSAqIGxuICogbG4gKiBsbikpO1xuICAgICAgICAgIC8vIGtlbHZpbiB0byBjZWxzaXVzXG4gICAgICAgICByZXR1cm4ga2VsdmluIC0gMjczLjE1O1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgICAgYXZlcmFnZSA9IFNFUklFU1JFU0lTVE9SIC8gYXZlcmFnZTtcblxuICAgICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgICAgc3RlaW5oYXJ0IC89IEJDT0VGRklDSUVOVDsgICAgICAgICAgICAgICAgICAgLy8gMS9CICogbG4oUi9SbylcbiAgICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgICAgc3RlaW5oYXJ0IC09IDI3My4xNTtcbiAgICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgICAgfVxuICAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnKXtcbiAgICAgICBpZiAoa2V0dGxlLnRlbXAucmF3ICYmIGtldHRsZS50ZW1wLnJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKGtldHRsZS50ZW1wLnJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKCAhIXNldHRpbmdzLmluZmx1eGRiLnBvcnQgJiYgaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpID09PSAtMSlcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwaW5nOiAoaW5mbHV4ZGIpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51cmwpe1xuICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiA9IGAke2luZmx1eGRiLnVybH1gO1xuICAgICAgICAgICAgaWYoICEhaW5mbHV4ZGIucG9ydCAmJiBpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgPT09IC0xKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgIGlmKGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgPSBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYDtcbiAgICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVzZXIgJiYgaW5mbHV4ZGIucGFzcyl7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShpbmZsdXhkYi51c2VyLnRyaW0oKSsnOicraW5mbHV4ZGIucGFzcy50cmltKCkpfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShzZXR0aW5ncy5pbmZsdXhkYi51c2VyLnRyaW0oKSsnOicrc2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCkpfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpe1xuICAgICAgICAgICAgcS5yZXNvbHZlKFtzZXR0aW5ncy5pbmZsdXhkYi51c2VyXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpe1xuICAgICAgICAgICAgcS5yZWplY3QoJ0RhdGFiYXNlIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCl9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudChgQ1JFQVRFIERBVEFCQVNFIFwiJHtuYW1lfVwiYCl9YCwgbWV0aG9kOiAnUE9TVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogISFvcHRpb25zLnNlc3Npb24sXG4gICAgICAgICAgICAgICAgdGV4dDogISFvcHRpb25zLnNlc3Npb24gPyBvcHRpb25zLnNlc3Npb24gOiAnJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTW9uaXRvcicsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG4gICAgICAgICAgICAgIGludGVycG9sYXRlOiAnYmFzaXMnLFxuICAgICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBrZXk6IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLm5hbWUgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBpc0FyZWE6IGZ1bmN0aW9uIChkKSB7IHJldHVybiAhIW9wdGlvbnMuY2hhcnQuYXJlYSB9LFxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoISFvcHRpb25zLmNoYXJ0Lm1pbGl0YXJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSDolTTolUycpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMlcCcpKG5ldyBEYXRlKGQpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCFvcHRpb25zLnVuaXQgfHwgb3B0aW9ucy51bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShkLDApKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICB2YXIgc2cgPSAoIDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoIChwbGF0by8yNTguMikgKiAyMjcuMSkgKSApICkudG9GaXhlZCgzKTtcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHNnKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0byk7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoISFyZWNpcGUuRl9SX05BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUsMTApO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0Lmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5GX1lfTEFCKycgJysoeWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX0xBQisnICcrXG4gICAgICAgICAgICAgIChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyWE1MOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIHZhciBtYXNoX3RpbWUgPSA2MDtcblxuICAgICAgaWYoISFyZWNpcGUuTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgIC8vICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkJSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUFYKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01JTilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NSU4sMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAgJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAubGVuZ3RoICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuRkVSTUVOVEFCTEVTKXtcbiAgICAgICAgdmFyIGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSE9QUyl7XG4gICAgICAgIHZhciBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5USU1FLzYwLzI0LDEwKSsnIERheXMnXG4gICAgICAgICAgICAgIDogaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuTUlTQ1Mpe1xuICAgICAgICB2YXIgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5ZRUFTVFMpe1xuICAgICAgICB2YXIgeWVhc3QgPSAocmVjaXBlLllFQVNUUy5ZRUFTVCAmJiByZWNpcGUuWUVBU1RTLllFQVNULmxlbmd0aCkgPyByZWNpcGUuWUVBU1RTLllFQVNUIDogcmVjaXBlLllFQVNUUztcbiAgICAgICAgICBfLmVhY2goeWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0Lk5BTUVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgZm9ybWF0WE1MOiBmdW5jdGlvbihjb250ZW50KXtcbiAgICAgIHZhciBodG1sY2hhcnMgPSBbXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMjgyOycsIHI6ICfEmid9LFxuICAgICAgICB7ZjogJyYjMjgzOycsIHI6ICfEmyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDQ7JywgcjogJ8WYJ30sXG4gICAgICAgIHtmOiAnJiMzNDU7JywgcjogJ8WZJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyYjMzY2OycsIHI6ICfFrid9LFxuICAgICAgICB7ZjogJyYjMzY3OycsIHI6ICfFryd9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMyNjQ7JywgcjogJ8SIJ30sXG4gICAgICAgIHtmOiAnJiMyNjU7JywgcjogJ8SJJ30sXG4gICAgICAgIHtmOiAnJiMyODQ7JywgcjogJ8ScJ30sXG4gICAgICAgIHtmOiAnJiMyODU7JywgcjogJ8SdJ30sXG4gICAgICAgIHtmOiAnJiMyOTI7JywgcjogJ8SkJ30sXG4gICAgICAgIHtmOiAnJiMyOTM7JywgcjogJ8SlJ30sXG4gICAgICAgIHtmOiAnJiMzMDg7JywgcjogJ8S0J30sXG4gICAgICAgIHtmOiAnJiMzMDk7JywgcjogJ8S1J30sXG4gICAgICAgIHtmOiAnJiMzNDg7JywgcjogJ8WcJ30sXG4gICAgICAgIHtmOiAnJiMzNDk7JywgcjogJ8WdJ30sXG4gICAgICAgIHtmOiAnJiMzNjQ7JywgcjogJ8WsJ30sXG4gICAgICAgIHtmOiAnJiMzNjU7JywgcjogJ8WtJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZPRWxpZzsnLCByOiAnxZInfSxcbiAgICAgICAge2Y6ICcmb2VsaWc7JywgcjogJ8WTJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNzY7JywgcjogJ8W4J30sXG4gICAgICAgIHtmOiAnJnl1bWw7JywgcjogJ8O/J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzI5NjsnLCByOiAnxKgnfSxcbiAgICAgICAge2Y6ICcmIzI5NzsnLCByOiAnxKknfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzM2MDsnLCByOiAnxagnfSxcbiAgICAgICAge2Y6ICcmIzM2MTsnLCByOiAnxaknfSxcbiAgICAgICAge2Y6ICcmIzMxMjsnLCByOiAnxLgnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzMzY7JywgcjogJ8WQJ30sXG4gICAgICAgIHtmOiAnJiMzMzc7JywgcjogJ8WRJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzY4OycsIHI6ICfFsCd9LFxuICAgICAgICB7ZjogJyYjMzY5OycsIHI6ICfFsSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmVEhPUk47JywgcjogJ8OeJ30sXG4gICAgICAgIHtmOiAnJnRob3JuOycsIHI6ICfDvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMyNTY7JywgcjogJ8SAJ30sXG4gICAgICAgIHtmOiAnJiMyNTc7JywgcjogJ8SBJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzQ7JywgcjogJ8SSJ30sXG4gICAgICAgIHtmOiAnJiMyNzU7JywgcjogJ8STJ30sXG4gICAgICAgIHtmOiAnJiMyOTA7JywgcjogJ8SiJ30sXG4gICAgICAgIHtmOiAnJiMyOTE7JywgcjogJ8SjJ30sXG4gICAgICAgIHtmOiAnJiMyOTg7JywgcjogJ8SqJ30sXG4gICAgICAgIHtmOiAnJiMyOTk7JywgcjogJ8SrJ30sXG4gICAgICAgIHtmOiAnJiMzMTA7JywgcjogJ8S2J30sXG4gICAgICAgIHtmOiAnJiMzMTE7JywgcjogJ8S3J30sXG4gICAgICAgIHtmOiAnJiMzMTU7JywgcjogJ8S7J30sXG4gICAgICAgIHtmOiAnJiMzMTY7JywgcjogJ8S8J30sXG4gICAgICAgIHtmOiAnJiMzMjU7JywgcjogJ8WFJ30sXG4gICAgICAgIHtmOiAnJiMzMjY7JywgcjogJ8WGJ30sXG4gICAgICAgIHtmOiAnJiMzNDI7JywgcjogJ8WWJ30sXG4gICAgICAgIHtmOiAnJiMzNDM7JywgcjogJ8WXJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNjI7JywgcjogJ8WqJ30sXG4gICAgICAgIHtmOiAnJiMzNjM7JywgcjogJ8WrJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmIzI2MDsnLCByOiAnxIQnfSxcbiAgICAgICAge2Y6ICcmIzI2MTsnLCByOiAnxIUnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI4MDsnLCByOiAnxJgnfSxcbiAgICAgICAge2Y6ICcmIzI4MTsnLCByOiAnxJknfSxcbiAgICAgICAge2Y6ICcmIzMyMTsnLCByOiAnxYEnfSxcbiAgICAgICAge2Y6ICcmIzMyMjsnLCByOiAnxYInfSxcbiAgICAgICAge2Y6ICcmIzMyMzsnLCByOiAnxYMnfSxcbiAgICAgICAge2Y6ICcmIzMyNDsnLCByOiAnxYQnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDY7JywgcjogJ8WaJ30sXG4gICAgICAgIHtmOiAnJiMzNDc7JywgcjogJ8WbJ30sXG4gICAgICAgIHtmOiAnJiMzNzc7JywgcjogJ8W5J30sXG4gICAgICAgIHtmOiAnJiMzNzg7JywgcjogJ8W6J30sXG4gICAgICAgIHtmOiAnJiMzNzk7JywgcjogJ8W7J30sXG4gICAgICAgIHtmOiAnJiMzODA7JywgcjogJ8W8J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmIzI1ODsnLCByOiAnxIInfSxcbiAgICAgICAge2Y6ICcmIzI1OTsnLCByOiAnxIMnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJiMzNTQ7JywgcjogJ8WiJ30sXG4gICAgICAgIHtmOiAnJiMzNTU7JywgcjogJ8WjJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzMwOycsIHI6ICfFiid9LFxuICAgICAgICB7ZjogJyYjMzMxOycsIHI6ICfFiyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU4OycsIHI6ICfFpid9LFxuICAgICAgICB7ZjogJyYjMzU5OycsIHI6ICfFpyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMzEzOycsIHI6ICfEuSd9LFxuICAgICAgICB7ZjogJyYjMzE0OycsIHI6ICfEuid9LFxuICAgICAgICB7ZjogJyYjMzE3OycsIHI6ICfEvSd9LFxuICAgICAgICB7ZjogJyYjMzE4OycsIHI6ICfEvid9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyYjMzQwOycsIHI6ICfFlCd9LFxuICAgICAgICB7ZjogJyYjMzQxOycsIHI6ICfFlSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJiMyODY7JywgcjogJ8SeJ30sXG4gICAgICAgIHtmOiAnJiMyODc7JywgcjogJ8SfJ30sXG4gICAgICAgIHtmOiAnJiMzMDQ7JywgcjogJ8SwJ30sXG4gICAgICAgIHtmOiAnJiMzMDU7JywgcjogJ8SxJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmV1cm87JywgcjogJ+KCrCd9LFxuICAgICAgICB7ZjogJyZwb3VuZDsnLCByOiAnwqMnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZidWxsOycsIHI6ICfigKInfSxcbiAgICAgICAge2Y6ICcmZGFnZ2VyOycsIHI6ICfigKAnfSxcbiAgICAgICAge2Y6ICcmY29weTsnLCByOiAnwqknfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZ0cmFkZTsnLCByOiAn4oSiJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmcGVybWlsOycsIHI6ICfigLAnfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmbmRhc2g7JywgcjogJ+KAkyd9LFxuICAgICAgICB7ZjogJyZtZGFzaDsnLCByOiAn4oCUJ30sXG4gICAgICAgIHtmOiAnJiM4NDcwOycsIHI6ICfihJYnfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZwYXJhOycsIHI6ICfCtid9LFxuICAgICAgICB7ZjogJyZwbHVzbW47JywgcjogJ8KxJ30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICdsZXNzLXQnLCByOiAnPCd9LFxuICAgICAgICB7ZjogJ2dyZWF0ZXItdCcsIHI6ICc+J30sXG4gICAgICAgIHtmOiAnJm5vdDsnLCByOiAnwqwnfSxcbiAgICAgICAge2Y6ICcmY3VycmVuOycsIHI6ICfCpCd9LFxuICAgICAgICB7ZjogJyZicnZiYXI7JywgcjogJ8KmJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmYWN1dGU7JywgcjogJ8K0J30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnwqgnfSxcbiAgICAgICAge2Y6ICcmbWFjcjsnLCByOiAnwq8nfSxcbiAgICAgICAge2Y6ICcmY2VkaWw7JywgcjogJ8K4J30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmc3VwMTsnLCByOiAnwrknfSxcbiAgICAgICAge2Y6ICcmc3VwMjsnLCByOiAnwrInfSxcbiAgICAgICAge2Y6ICcmc3VwMzsnLCByOiAnwrMnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnaHk7XHQnLCByOiAnJid9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmYW1wOycsIHI6ICdhbmQnfSxcbiAgICAgICAge2Y6ICcmbGRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyc3F1bzsnLCByOiBcIidcIn1cbiAgICAgIF07XG5cbiAgICAgIF8uZWFjaChodG1sY2hhcnMsIGZ1bmN0aW9uKGNoYXIpIHtcbiAgICAgICAgaWYoY29udGVudC5pbmRleE9mKGNoYXIuZikgIT09IC0xKXtcbiAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKFJlZ0V4cChjaGFyLmYsJ2cnKSwgY2hhci5yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9zZXJ2aWNlcy5qcyJdLCJzb3VyY2VSb290IjoiIn0=