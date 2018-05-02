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
      temp: { pin: 'A0', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0 },
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
      return kettle.arduino.id == arduinoId && (kettle.temp.pin == pin || kettle.heater.pin == pin || kettle.cooler && kettle.cooler.pin == pin || !kettle.cooler && kettle.pump.pin == pin);
    });
    return kettle || false;
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
    if (!response || !response.temp) {
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

    if (!!kettle.temp.current) kettle.temp.previous = kettle.temp.current;
    // temp response is in C
    kettle.temp.measured = $scope.settings.general.unit == 'F' ? $filter('toFahrenheit')(response.temp) : $filter('round')(response.temp, 2);
    // add adjustment
    kettle.temp.current = parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust);
    // set raw
    kettle.temp.raw = response.raw;
    // reset all kettles every resetChart
    if (kettle.values.length > resetChart) {
      $scope.kettles.map(function (k) {
        return k.values.shift();
      });
    }

    //DHT sensors have humidity
    if (response.humidity) {
      kettle.humidity = response.humidity;
    }

    kettle.values.push([date.getTime(), kettle.temp.current]);

    $scope.updateKnobCopy(kettle);
    $scope.updateArduinoStatus({ kettle: kettle, sketch_version: response.sketch_version });

    //is temp too high?
    if (kettle.temp.current > kettle.temp.target + kettle.temp.diff) {
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
    else if (kettle.temp.current < kettle.temp.target - kettle.temp.diff) {
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
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
        currentSketch.headers.push('#include <dht.h>');
      }
      if (kettle.temp.type.indexOf('DS18B20') !== -1 && currentSketch.headers.indexOf('#include "cactus_io_DS18B20.h"') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
        currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
      }
      if (!!kettle.temp.type.adc && currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1) {
        currentSketch.headers.push('#include <Wire.h>"');
        currentSketch.headers.push('#include <Adafruit_ADS1015.h>');
      }
      currentSketch.actions.push('actionsCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettle.temp.type + '"),' + adjust + ');');
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
          var additional_post_params = 'p.addParameter(F("-H"));\n';
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

    // Desktop / Slack Notification
    var message,
        icon = '/assets/img/brewbench-logo.png',
        color = 'good';

    if (kettle && ['hop', 'grain', 'water', 'fermenter'].indexOf(kettle.type) !== -1) icon = '/assets/img/' + kettle.type + '.png';

    //don't alert if the heater is running and temp is too low
    if (kettle && kettle.low && kettle.heater.running) return;

    if (!!timer) {
      //kettle is a timer object
      if (!$scope.settings.notifications.timers) return;
      if (timer.up) message = 'Your timers are done';else if (!!timer.notes) message = 'Time to add ' + timer.notes + ' of ' + timer.label;else message = 'Time to add ' + timer.label;
    } else if (kettle && kettle.high) {
      if (!$scope.settings.notifications.high || $scope.settings.notifications.last == 'high') return;
      message = kettle.name + ' is ' + $filter('round')(kettle.high - kettle.temp.diff, 0) + '\xB0 high';
      color = 'danger';
      $scope.settings.notifications.last = 'high';
    } else if (kettle && kettle.low) {
      if (!$scope.settings.notifications.low || $scope.settings.notifications.last == 'low') return;
      message = kettle.name + ' is ' + $filter('round')(kettle.low - kettle.temp.diff, 0) + '\xB0 low';
      color = '#3498DB';
      $scope.settings.notifications.last = 'low';
    } else if (kettle) {
      if (!$scope.settings.notifications.target || $scope.settings.notifications.last == 'target') return;
      message = kettle.name + ' is within the target at ' + kettle.temp.current + '\xB0';
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
    //is temp too high?
    if (kettle.temp.current > kettle.temp.target + kettle.temp.diff) {
      kettle.knob.barColor = 'rgba(255,0,0,.6)';
      kettle.knob.trackColor = 'rgba(255,0,0,.1)';
      kettle.high = kettle.temp.current - kettle.temp.target;
      kettle.low = null;
      if (kettle.cooler && kettle.cooler.running) {
        kettle.knob.subText.text = 'cooling';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.high - kettle.temp.diff, 0) + '\xB0 high';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      }
    } else if (kettle.temp.current < kettle.temp.target - kettle.temp.diff) {
      kettle.knob.barColor = 'rgba(52,152,219,.5)';
      kettle.knob.trackColor = 'rgba(52,152,219,.1)';
      kettle.low = kettle.temp.target - kettle.temp.current;
      kettle.high = null;
      if (kettle.heater.running) {
        kettle.knob.subText.text = 'heating';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.low - kettle.temp.diff, 0) + '\xB0 low';
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
    // update subtext to include humidity
    if (kettle.humidity) {
      kettle.knob.subText.text = kettle.humidity + '%';
      kettle.knob.subText.color = 'gray';
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
        temp: { pin: 'A0', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0 },
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
        temp: { pin: 'A1', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0 },
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
        temp: { pin: 'A2', type: 'Thermistor', adc: false, hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0 },
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
      var sensors = [{ name: 'Thermistor', analog: true, digital: false }, { name: 'DS18B20', analog: false, digital: true }, { name: 'PT100', analog: true, digital: true }, { name: 'DHT11', analog: false, digital: true }, { name: 'DHT12', analog: false, digital: true }, { name: 'DHT21', analog: false, digital: true }, { name: 'DHT22', analog: false, digital: true }, { name: 'DHT33', analog: false, digital: true }, { name: 'DHT44', analog: false, digital: true }];
      if (name) return _.filter(sensors, { 'name': name })[0];
      return sensors;
    },

    kettleTypes: function kettleTypes(type) {
      var kettles = [{ 'name': 'Boil', 'type': 'hop', 'target': 200, 'diff': 2 }, { 'name': 'Mash', 'type': 'grain', 'target': 152, 'diff': 2 }, { 'name': 'Hot Liquor', 'type': 'water', 'target': 170, 'diff': 2 }, { 'name': 'Fermenter', 'type': 'fermenter', 'target': 74, 'diff': 2 }, { 'name': 'Air', 'type': 'air', 'target': 74, 'diff': 2 }];
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
      var url = this.domain(kettle.arduino) + '/arduino/' + kettle.temp.type + '/' + kettle.temp.pin;
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
        average = 1023 / average - 1;
        average = SERIESRESISTOR / average;

        var steinhart = average / THERMISTORNOMINAL; // (R/Ro)
        steinhart = Math.log(steinhart); // ln(R/Ro)
        steinhart /= BCOEFFICIENT; // 1/B * ln(R/Ro)
        steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
        steinhart = 1.0 / steinhart; // Invert
        steinhart -= 273.15;
        return steinhart;
      } else if (kettle.temp.type == 'PT100') {
        if (raw > 409) {
          return 150 * fmap(raw, 410, 1023, 0, 614) / 614;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZ2VuZXJhbCIsImNoYXJ0T3B0aW9ucyIsInVuaXQiLCJjaGFydCIsInNlc3Npb24iLCJzdHJlYW1zIiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJzdGF0dXMiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImFkYyIsInNlY3VyZSIsInZlcnNpb24iLCJkdCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImVtZXRlciIsImdldF9yZWFsdGltZSIsImVycl9jb2RlIiwicG93ZXIiLCJkZXZpY2UiLCJ0b2dnbGUiLCJvZmZPck9uIiwicmVsYXlfc3RhdGUiLCJhZGRLZXR0bGUiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJoaXQiLCJtZWFzdXJlZCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwiY291bnQiLCJub3RpZnkiLCJzbGFjayIsImR3ZWV0IiwiaGFzU3RpY2t5S2V0dGxlcyIsImtldHRsZUNvdW50IiwiYWN0aXZlS2V0dGxlcyIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJicmV3YmVuY2hIb3N0ZWQiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJjb25uZWN0IiwicGluZyIsIiQiLCJyZW1vdmVDbGFzcyIsImRiIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJhZGRDbGFzcyIsImNyZWF0ZSIsIm1vbWVudCIsImZvcm1hdCIsImNyZWF0ZWQiLCJjcmVhdGVEQiIsImRhdGEiLCJyZXN1bHRzIiwicmVzZXRFcnJvciIsImNvbm5lY3RlZCIsInVzZXJuYW1lIiwiYXBpX2tleSIsImF1dGgiLCJyZWxheSIsInNhdmUiLCJrZXR0bGVSZXNwb25zZSIsIm1lcmdlIiwiY29uc29sZSIsInNlc3Npb25zIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwib24iLCJoaWdoIiwibG93IiwibGFzdCIsInN1YlRleHQiLCJlbmFibGVkIiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsInRydXN0QXNIdG1sIiwia2V5cyIsInN0YXR1c1RleHQiLCJzdHJpbmdpZnkiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwia2V5IiwidGVtcHMiLCJzaGlmdCIsImh1bWlkaXR5IiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJza2V0Y2hlcyIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImFjdGlvbnMiLCJ0cmlnZ2VycyIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwidHJpbSIsImFkZGl0aW9uYWxfcG9zdF9wYXJhbXMiLCJwb3J0Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsImtldHRsZVR5cGUiLCJ1cGRhdGVTdHJlYW1zIiwiY2hhbmdlVW5pdHMiLCJ2IiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsInJlbW92ZUtldHRsZSIsIiRpbmRleCIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCJ1cGRhdGVMb2NhbCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwic3JjRWxlbWVudCIsImZpbGVzIiwiZXh0ZW5zaW9uIiwicG9wIiwidG9Mb3dlckNhc2UiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJkZWNpbWFscyIsIk51bWJlciIsInBocmFzZSIsIlJlZ0V4cCIsInRvU3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImZhY3RvcnkiLCJsb2NhbFN0b3JhZ2UiLCJyZW1vdmVJdGVtIiwiYWNjZXNzVG9rZW4iLCJzZXRJdGVtIiwiZ2V0SXRlbSIsImRlYnVnIiwic2hvdyIsIm1pbGl0YXJ5IiwiYXJlYSIsInJlYWRPbmx5IiwidHJhY2tXaWR0aCIsImJhcldpZHRoIiwiYmFyQ2FwIiwiZHluYW1pY09wdGlvbnMiLCJkaXNwbGF5UHJldmlvdXMiLCJwcmV2QmFyQ29sb3IiLCJzZW5zb3JUeXBlcyIsInNlbnNvcnMiLCJ3ZWJob29rX3VybCIsInEiLCJkZWZlciIsInBvc3RPYmoiLCJyZXNvbHZlIiwicmVqZWN0IiwicHJvbWlzZSIsInJlcXVlc3QiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzZW5zb3IiLCJkaWdpdGFsUmVhZCIsInF1ZXJ5IiwibWQ1Iiwic2giLCJsYXRlc3QiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsInVwZGF0ZWRLZXR0bGUiLCJzZXNzaW9uSWQiLCJiaXRjYWxjIiwiYXZlcmFnZSIsImZtYXAiLCJ4IiwiaW5fbWluIiwiaW5fbWF4Iiwib3V0X21pbiIsIm91dF9tYXgiLCJUSEVSTUlTVE9STk9NSU5BTCIsIlRFTVBFUkFUVVJFTk9NSU5BTCIsIk5VTVNBTVBMRVMiLCJCQ09FRkZJQ0lFTlQiLCJTRVJJRVNSRVNJU1RPUiIsInN0ZWluaGFydCIsImxvZyIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJ0aXRsZSIsImVuYWJsZSIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsImQiLCJ5IiwiZDMiLCJjYXRlZ29yeTEwIiwiZHVyYXRpb24iLCJ1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZSIsImNsaXBWb3Jvbm9pIiwiaW50ZXJwb2xhdGUiLCJsZWdlbmQiLCJpc0FyZWEiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsInBhcnNlSW50IiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxrQkFBekIsRUFBNkNDLGFBQTdDLEVBQTREQyxpQkFBNUQsRUFBK0VDLGdCQUEvRSxFQUFpRzs7QUFFdkdGLGdCQUFjRyxRQUFkLENBQXVCQyxVQUF2QixHQUFvQyxJQUFwQztBQUNBSixnQkFBY0csUUFBZCxDQUF1QkUsT0FBdkIsQ0FBK0JDLE1BQS9CLEdBQXdDLGdDQUF4QztBQUNBLFNBQU9OLGNBQWNHLFFBQWQsQ0FBdUJFLE9BQXZCLENBQStCQyxNQUEvQixDQUFzQyxrQkFBdEMsQ0FBUDs7QUFFQUwsb0JBQWtCTSxVQUFsQixDQUE2QixFQUE3QjtB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YyxFQW1RZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQW5RYyxFQW9RZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBRYyxFQXFRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJRYyxFQXNRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRRYyxFQXVRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXZRYyxFQXdRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXhRYyxFQXlRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXpRYyxFQTBRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTFRYyxFQTJRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTNRYyxFQTRRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTVRYyxFQTZRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTdRYyxFQThRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQTlRYyxFQStRZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQS9RYyxFQWdSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWhSYyxFQWlSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWpSYyxFQWtSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQWxSYyxFQW1SZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQW5SYyxFQW9SZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXBSYyxFQXFSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXJSYyxFQXNSZCxFQUFDRCxHQUFHLFFBQUosRUFBY0MsR0FBRyxHQUFqQixFQXRS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Q0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUFqZmMsRUFrZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsR0FBaEIsRUFsZmMsRUFtZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBbmZjLEVBb2ZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXBmYyxFQXFmZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFyZmMsRUFzZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBdGZjLEVBdWZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBdmZjLEVBd2ZkLEVBQUNELEdBQUcsT0FBSixFQUFhQyxHQUFHLEtBQWhCLEVBeGZjLEVBeWZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBemZjLEVBMGZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBMWZjLEVBMmZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM2ZjLENBQWhCOztBQThmQW5oQixRQUFFOEQsSUFBRixDQUFPbWQsU0FBUCxFQUFrQixVQUFTRyxJQUFULEVBQWU7QUFDL0IsWUFBR0osUUFBUXBoQixPQUFSLENBQWdCd2hCLEtBQUtGLENBQXJCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7QUFDaENGLG9CQUFVQSxRQUFRcmhCLE9BQVIsQ0FBZ0JrWCxPQUFPdUssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUEvbERJLEdBQVA7QUFpbURELENBcG1ERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsXG4gICxyZXNldENoYXJ0ID0gMTAwXG4gICx0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuQnJld1NlcnZpY2UgPSBCcmV3U2VydmljZTtcbiRzY29wZS5zaXRlID0ge2h0dHBzOiAhIShkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbD09J2h0dHBzOicpXG4gICwgaHR0cHNfdXJsOiBgaHR0cHM6Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9YFxufTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbi8vIGdlbmVyYWwgY2hlY2sgYW5kIHVwZGF0ZVxuaWYoISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsKVxuICByZXR1cm4gJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgYWRjOiAwLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7ZXJyb3I6ICcnLGR0OiAnJ31cbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKCEhcGx1Zy5zdGF0dXMpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgdmFyIG9mZk9yT24gPSBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxID8gMCA6IDE7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS50b2dnbGUoZGV2aWNlLCBvZmZPck9uKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSBvZmZPck9uO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS50aGVuKHRvZ2dsZVJlc3BvbnNlID0+IHtcbiAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5mb1xuICAgICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICBkZXZpY2UuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgdmFyIGFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsYWRjOjAsc2VjdXJlOmZhbHNlfTtcbiAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogYXJkdWlub1xuICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBwaW47XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgKGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUuaGVhdGVyLnBpbj09cGluKSB8fFxuICAgICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucGluPT1waW4pIHx8XG4gICAgICAgICAgKCFrZXR0bGUuY29vbGVyICYmIGtldHRsZS5wdW1wLnBpbj09cGluKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiBrZXR0bGUgfHwgZmFsc2U7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZVNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIuZW1haWwpXG4gICAgICByZXR1cm47XG4gICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICdDcmVhdGluZyBzaGFyZSBsaW5rLi4uJztcbiAgICByZXR1cm4gQnJld1NlcnZpY2UuY3JlYXRlU2hhcmUoJHNjb3BlLnNoYXJlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYocmVzcG9uc2Uuc2hhcmUgJiYgcmVzcG9uc2Uuc2hhcmUudXJsKXtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJyc7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9saW5rID0gcmVzcG9uc2Uuc2hhcmUudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJywkc2NvcGUuc2hhcmUpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gZXJyO1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVUZXN0ID0gZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgYXJkdWluby50ZXN0aW5nID0gdHJ1ZTtcbiAgICBCcmV3U2VydmljZS5zaGFyZVRlc3QoYXJkdWlubylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLmh0dHBfY29kZSA9PSAyMDApXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSB0cnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW5mbHV4ZGIgPSB7XG4gICAgYnJld2JlbmNoSG9zdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmwuaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYiA9IGRlZmF1bHRTZXR0aW5ncy5pbmZsdXhkYjtcbiAgICB9LFxuICAgIGNvbm5lY3Q6ICgpID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT0gMjAwKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICBpZigkc2NvcGUuaW5mbHV4ZGIuYnJld2JlbmNoSG9zdGVkKCkpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vZ2V0IGxpc3Qgb2YgZGF0YWJhc2VzXG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgICB2YXIgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGlmKGVyci5zdGF0dXMgJiYgKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSl7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYoZXJyKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN0cmVhbXMgPSB7XG4gICAgY29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICByZXR1cm4gKCEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgJiZcbiAgICAgICAgISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5ICYmXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9PSAnQ29ubmVjdGVkJ1xuICAgICAgKTtcbiAgICB9LFxuICAgIHJlbW92ZTogKCkgPT4ge1xuICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcyA9IGRlZmF1bHRTZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5KVxuICAgICAgICByZXR1cm47XG4gICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmF1dGgodHJ1ZSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGtldHRsZXM6IChrZXR0bGUsIHJlbGF5KSA9PiB7XG4gICAgICBpZihyZWxheSl7XG4gICAgICAgIGtldHRsZVtyZWxheV0uc2tldGNoID0gIWtldHRsZVtyZWxheV0uc2tldGNoO1xuICAgICAgICBpZigha2V0dGxlLm5vdGlmeS5zdHJlYW1zKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGtldHRsZS5tZXNzYWdlLmxvY2F0aW9uID0gJ3NrZXRjaGVzJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnaW5mbyc7XG4gICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAwO1xuICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5rZXR0bGVzLnNhdmUoa2V0dGxlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgdmFyIGtldHRsZVJlc3BvbnNlID0gcmVzcG9uc2Uua2V0dGxlO1xuICAgICAgICAgIC8vIHVwZGF0ZSBrZXR0bGUgdmFyc1xuICAgICAgICAgIGtldHRsZS5pZCA9IGtldHRsZVJlc3BvbnNlLmlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBhcmR1aW5vIGlkXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywgYXJkdWlubyA9PiB7XG4gICAgICAgICAgICBpZihhcmR1aW5vLmlkID09IGtldHRsZS5hcmR1aW5vLmlkKVxuICAgICAgICAgICAgICBhcmR1aW5vLmlkID0ga2V0dGxlUmVzcG9uc2UuZGV2aWNlSWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICAvLyB1cGRhdGUgc2Vzc2lvbiB2YXJzXG4gICAgICAgICAgXy5tZXJnZSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9uLCBrZXR0bGVSZXNwb25zZS5zZXNzaW9uKTtcblxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnc3VjY2Vzcyc7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2Uuc3RhdHVzID0gMjtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zID0gIWtldHRsZS5ub3RpZnkuc3RyZWFtcztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAxO1xuICAgICAgICAgIGlmKGVyciAmJiBlcnIuZGF0YSAmJiBlcnIuZGF0YS5lcnJvciAmJiBlcnIuZGF0YS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLmRhdGEuZXJyb3IubWVzc2FnZSwga2V0dGxlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JyZXdCZW5jaCBTdHJlYW1zIEVycm9yJywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2Vzc2lvbnM6IHtcbiAgICAgIHNhdmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5zZXNzaW9ucy5zYXZlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuXG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5zaGFyZUFjY2VzcyA9IGZ1bmN0aW9uKGFjY2Vzcyl7XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC5zaGFyZWQgPSB0cnVlO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5sb2FkU2hhcmVGaWxlKCRzY29wZS5zaGFyZS5maWxlLCAkc2NvcGUuc2hhcmUucGFzc3dvcmQgfHwgbnVsbClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGlmKGNvbnRlbnRzKXtcbiAgICAgICAgICBpZihjb250ZW50cy5uZWVkUGFzc3dvcmQpe1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IHRydWU7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncy5yZWNpcGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlID0gY29udGVudHMuc2V0dGluZ3MucmVjaXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gZmFsc2U7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zaGFyZSAmJiBjb250ZW50cy5zaGFyZS5hY2Nlc3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2hhcmUuYWNjZXNzID0gY29udGVudHMuc2hhcmUuYWNjZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBjb250ZW50cy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMgPSB7b246ZmFsc2UsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMua2V0dGxlcyl7XG4gICAgICAgICAgICAgIF8uZWFjaChjb250ZW50cy5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAgICAgICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMDArNSxzdWJUZXh0OntlbmFibGVkOiB0cnVlLHRleHQ6ICdzdGFydGluZy4uLicsY29sb3I6ICdncmF5Jyxmb250OiAnYXV0byd9fSk7XG4gICAgICAgICAgICAgICAga2V0dGxlLnZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXMgPSBjb250ZW50cy5rZXR0bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBsb2FkaW5nIHRoZSBzaGFyZWQgc2Vzc2lvbi5cIik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoISFmb3JtYXR0ZWRfY29udGVudCl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZighIWpzb25PYmouUmVjaXBlcyAmJiAhIWpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoISFqc29uT2JqLlNlbGVjdGlvbnMgJiYgISFqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZighIWpzb25PYmouUkVDSVBFUyAmJiAhIWpzb25PYmouUkVDSVBFUy5SRUNJUEUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZighIXJlY2lwZS5vZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKCEhcmVjaXBlLmZnKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChncmFpbi5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogZ3JhaW4ubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChncmFpbi5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KVswXS5hbW91bnQgKz0gcGFyc2VGbG9hdChob3AuYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBob3AubGFiZWwsIGFtb3VudDogcGFyc2VGbG9hdChob3AuYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkc2NvcGUuc2hvd1NldHRpbmdzID0gISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUsIGxvY2F0aW9uKXtcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgIGlmKGxvY2F0aW9uKVxuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIG1lc3NhZ2UpO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gKTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGV9LCBrZXR0bGUubWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzID0gZnVuY3Rpb24ocmVzcG9uc2UsIGVycm9yKXtcbiAgICB2YXIgYXJkdWlubyA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcywge2lkOiByZXNwb25zZS5rZXR0bGUuYXJkdWluby5pZH0pO1xuICAgIGlmKGFyZHVpbm8ubGVuZ3RoKXtcbiAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmR0ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICBhcmR1aW5vWzBdLnZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIGlmKGVycm9yKVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9IGVycm9yO1xuICAgICAgZWxzZVxuICAgICAgICBhcmR1aW5vWzBdLnN0YXR1cy5lcnJvciA9ICcnO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnRlbXApe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gICAgLy8gbmVlZGVkIGZvciBjaGFydHNcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlLm5hbWU7XG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vdXBkYXRlIGRhdGF0eXBlXG4gICAgcmVzcG9uc2UudGVtcCA9IHBhcnNlRmxvYXQocmVzcG9uc2UudGVtcCk7XG4gICAgcmVzcG9uc2UucmF3ID0gcGFyc2VGbG9hdChyZXNwb25zZS5yYXcpO1xuXG4gICAgaWYoISFrZXR0bGUudGVtcC5jdXJyZW50KVxuICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgIC8vIHRlbXAgcmVzcG9uc2UgaXMgaW4gQ1xuICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICAkZmlsdGVyKCdyb3VuZCcpKHJlc3BvbnNlLnRlbXAsMik7XG4gICAgLy8gYWRkIGFkanVzdG1lbnRcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICAvLyBzZXQgcmF3XG4gICAga2V0dGxlLnRlbXAucmF3ID0gcmVzcG9uc2UucmF3O1xuICAgIC8vIHJlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcy5zaGlmdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQgc2Vuc29ycyBoYXZlIGh1bWlkaXR5XG4gICAgaWYoIHJlc3BvbnNlLmh1bWlkaXR5ICl7XG4gICAgICBrZXR0bGUuaHVtaWRpdHkgPSByZXNwb25zZS5odW1pZGl0eTtcbiAgICB9XG5cbiAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcblxuICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlLCBza2V0Y2hfdmVyc2lvbjpyZXNwb25zZS5za2V0Y2hfdmVyc2lvbn0pO1xuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoJykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgdmFyIGs7XG5cbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuXG4gICAgaWYoa2V0dGxlLmFjdGl2ZSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIHRydWUpO1xuICAgIH0gZWxzZSBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmhhc1NrZXRjaGVzID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICB2YXIgaGFzQVNrZXRjaCA9IGZhbHNlO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgIGlmKChrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKSB8fFxuICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCkgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zdHJlYW1zIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc2xhY2sgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5kd2VldFxuICAgICAgKSB7XG4gICAgICAgIGhhc0FTa2V0Y2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBoYXNBU2tldGNoO1xuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5jb21waWxlU2tldGNoID0gZnVuY3Rpb24oc2tldGNoTmFtZSl7XG4gICAgdmFyIHNrZXRjaGVzID0gW107XG4gICAgdmFyIGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKTtcbiAgICAgIHZhciBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGFyZHVpbm9OYW1lLFxuICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgIGhlYWRlcnM6IFtdLFxuICAgICAgICAgIHRyaWdnZXJzOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgfVxuICAgICAgdmFyIHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KTtcbiAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdD09J0YnICYmICEha2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUTGliLnppcCcpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9jYWN0dXNfaW9fRFMxOEIyMC56aXAnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJyk7XG4gICAgICB9XG4gICAgICBpZighIWtldHRsZS50ZW1wLnR5cGUuYWRjICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8V2lyZS5oPlwiJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8QWRhZnJ1aXRfQURTMTAxNS5oPicpO1xuICAgICAgfVxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2FjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlLnRlbXAudHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYoc2tldGNoLnRyaWdnZXJzKXtcbiAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7JylcbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kXG4gICAgICAgIGZvcih2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEpXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCd0ZW1wID0gYWN0aW9uc0NvbW1hbmQoJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gudHJpZ2dlcnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoJytza2V0Y2hOYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICB2YXIgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIHZhciBhdXRvZ2VuID0gJy8qIFNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jbyBvbiAnK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDpNTTpTUycpKycgZm9yICcrbmFtZSsnICovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFthY3Rpb25zXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbaGVhZGVyc10nLCBoZWFkZXJzLmxlbmd0aCA/IGhlYWRlcnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVkVSU0lPTlxcXS9nLCAkc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtUUExJTktfQ09OTkVDVElPTlxcXS9nLCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1NMQUNLX0NPTk5FQ1RJT05cXF0vZywgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2spXG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignU3RyZWFtcycpICE9PSAtMSl7XG4gICAgICAgICAgLy8gc3RyZWFtcyBjb25uZWN0aW9uXG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYGh0dHBzOi8vJHskc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX0uc3RyZWFtcy5icmV3YmVuY2guY29gO1xuICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nID0gJ2h0dHA6Ly8xMC4wLjEuMTQ6MzAwMSc7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1RSRUFNU19DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0FVVEhcXF0vZywgJ0F1dGhvcml6YXRpb246IEJhc2ljICcrYnRvYSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZS50cmltKCkrJzonKyRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkudHJpbSgpKSk7XG4gICAgICAgIH0gaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICAgICAgICB2YXIgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICAgICAgaWYoJHNjb3BlLmluZmx1eGRiLmJyZXdiZW5jaEhvc3RlZCgpKXtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvYmJwJztcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJ0F1dGhvcml6YXRpb246IEJhc2ljICcrYnRvYSgkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCkrJzonKyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzLnRyaW0oKSkpO1xuICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMgPSAncC5hZGRQYXJhbWV0ZXIoRihcIi1IXCIpKTtcXG4nO1xuICAgICAgICAgICAgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyArPSAnICBwLmFkZFBhcmFtZXRlcihGKFwiWC1BUEktS0VZOiAnKyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKydcIikpOyc7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKCcvLyBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zJywgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKCAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgICAvLyBhZGQgdXNlci9wYXNzXG4gICAgICAgICAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAgICAgICAgIC8vIGFkZCBkYlxuICAgICAgICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0FVVEhcXF0vZywgJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPEFkYWZydWl0X0FEUzEwMTUuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBBREMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoYXNUcmlnZ2Vycyl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc3RyZWFtU2tldGNoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLm5vdGlmeSA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgdmFyIG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApKydcXHUwMEIwIGhpZ2gnO1xuICAgICAgY29sb3IgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2hpZ2gnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUubG93KXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sb3cgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2xvdycpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUubmFtZSsnIGlzICcrJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytrZXR0bGUudGVtcC5jdXJyZW50KydcXHUwMEIwJztcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0ndGFyZ2V0JztcbiAgICB9XG4gICAgZWxzZSBpZigha2V0dGxlKXtcbiAgICAgIG1lc3NhZ2UgPSAnVGVzdGluZyBBbGVydHMsIHlvdSBhcmUgcmVhZHkgdG8gZ28sIGNsaWNrIHBsYXkgb24gYSBrZXR0bGUuJztcbiAgICB9XG5cbiAgICAvLyBNb2JpbGUgVmlicmF0ZSBOb3RpZmljYXRpb25cbiAgICBpZiAoXCJ2aWJyYXRlXCIgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3IudmlicmF0ZShbNTAwLCAzMDAsIDUwMF0pO1xuICAgIH1cblxuICAgIC8vIFNvdW5kIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zb3VuZHMub249PT10cnVlKXtcbiAgICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICAgIGlmKCEhdGltZXIgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKCghIXRpbWVyKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgbWVhc3VyZWQgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUubmFtZSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG5cbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLm1lc3NhZ2UubWVzc2FnZSAmJiBrZXR0bGUubWVzc2FnZS50eXBlID09ICdkYW5nZXInKXtcbiAgICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjEpJztcbiAgICAgIGtldHRsZS5oaWdoID0ga2V0dGxlLnRlbXAuY3VycmVudC1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmLDApKydcXHUwMEIwIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC41KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuMSknO1xuICAgICAga2V0dGxlLmxvdyA9IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmLDApKydcXHUwMEIwIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgICAvLyB1cGRhdGUgc3VidGV4dCB0byBpbmNsdWRlIGh1bWlkaXR5XG4gICAgaWYoa2V0dGxlLmh1bWlkaXR5KXtcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IGtldHRsZS5odW1pZGl0eSsnJSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVW5pdHMgPSBmdW5jdGlvbih1bml0KXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ICE9IHVuaXQpe1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC50YXJnZXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5jdXJyZW50KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5tZWFzdXJlZCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5tZWFzdXJlZCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAucHJldmlvdXMsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC50YXJnZXQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAudGFyZ2V0LDApO1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLmFkanVzdCl7XG4gICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCwwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgY2hhcnQgdmFsdWVzXG4gICAgICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZWFjaChrZXR0bGUudmFsdWVzLCAodiwgaSkgPT4ge1xuICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzW2ldID0gW2tldHRsZS52YWx1ZXNbaV1bMF0sJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS52YWx1ZXNbaV1bMV0sdW5pdCldO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHt1bml0OiAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0LCBjaGFydDogJHNjb3BlLnNldHRpbmdzLmNoYXJ0LCBzZXNzaW9uOiAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zZXNzaW9ufSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggISFrZXR0bGUgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKCEha2V0dGxlKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyB1ZHBhdGUgY2hhcnQgd2l0aCBjdXJyZW50XG4gICAgICAgICAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUsJGluZGV4KXtcbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICAgICRzY29wZS5rZXR0bGVzLnNwbGljZSgkaW5kZXgsMSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLm1lYXN1cmVkKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudXBkYXRlU3RyZWFtcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy91cGRhdGUgc3RyZWFtc1xuICAgIGlmKCRzY29wZS5zdHJlYW1zLmNvbm5lY3RlZCgpICYmIGtldHRsZS5ub3RpZnkuc3RyZWFtcyl7XG4gICAgICAkc2NvcGUuc3RyZWFtcy5rZXR0bGVzKGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG5cbiAgLy8gdXBkYXRlIGxvY2FsIGNhY2hlXG4gICRzY29wZS51cGRhdGVMb2NhbCA9IGZ1bmN0aW9uKCl7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsICRzY29wZS5zZXR0aW5ncyk7XG4gICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsJHNjb3BlLmtldHRsZXMpO1xuICAgICAgJHNjb3BlLnVwZGF0ZUxvY2FsKCk7XG4gICAgfSw1MDAwKTtcbiAgfVxuICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChuZXcgRGF0ZShkYXRlKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oY2Vsc2l1cykge1xuICAgIGNlbHNpdXMgPSBwYXJzZUZsb2F0KGNlbHNpdXMpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKGNlbHNpdXMqOS81KzMyLDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZhaHJlbmhlaXQpIHtcbiAgICBmYWhyZW5oZWl0ID0gcGFyc2VGbG9hdChmYWhyZW5oZWl0KTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKSgoZmFocmVuaGVpdC0zMikqNS85LDIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3JvdW5kJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odmFsLGRlY2ltYWxzKSB7XG4gICAgcmV0dXJuIE51bWJlcigoTWF0aC5yb3VuZCh2YWwgKyBcImVcIiArIGRlY2ltYWxzKSAgKyBcImUtXCIgKyBkZWNpbWFscykpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RpdGxlY2FzZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCl7XG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGV4dC5zbGljZSgxKSk7XG4gIH1cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2ZpbHRlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZhY3RvcnkoJ0JyZXdTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkZmlsdGVyKXtcblxuICByZXR1cm4ge1xuXG4gICAgLy9jb29raWVzIHNpemUgNDA5NiBieXRlc1xuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xuICAgICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSl7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2V0dGluZ3MnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdrZXR0bGVzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2hhcmUnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYWNjZXNzVG9rZW46IGZ1bmN0aW9uKHRva2VuKXtcbiAgICAgIGlmKHRva2VuKVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NUb2tlbicsdG9rZW4pO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhY2Nlc3NUb2tlbicpO1xuICAgIH0sXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgIGdlbmVyYWw6IHtkZWJ1ZzogZmFsc2UsIHBvbGxTZWNvbmRzOiAxMCwgdW5pdDogJ0YnLCBzaGFyZWQ6IGZhbHNlfVxuICAgICAgICAsY2hhcnQ6IHtzaG93OiB0cnVlLCBtaWxpdGFyeTogZmFsc2UsIGFyZWE6IGZhbHNlfVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYXJkdWlub3M6IFt7aWQ6J2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZSx2ZXJzaW9uOicnLHN0YXR1czp7ZXJyb3I6JycsZHQ6Jyd9fV1cbiAgICAgICAgLHRwbGluazoge3VzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46JycsIHN0YXR1czogJycsIHBsdWdzOiBbXX1cbiAgICAgICAgLGluZmx1eGRiOiB7dXJsOiAnJywgcG9ydDogJycsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6W10sIHN0YXR1czogJyd9XG4gICAgICAgICxzdHJlYW1zOiB7dXNlcm5hbWU6ICcnLCBhcGlfa2V5OiAnJywgc3RhdHVzOiAnJywgc2Vzc2lvbjoge2lkOiAnJywgbmFtZTogJycsIHR5cGU6ICdmZXJtZW50YXRpb24nfX1cbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5hbWU6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHR5cGU6J1RoZXJtaXN0b3InLGFkYzpmYWxzZSxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxhZGM6MCxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyLHJhdzowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdHlwZTonVGhlcm1pc3RvcicsYWRjOmZhbHNlLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyLHJhdzowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogJ2xvY2FsLScrYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzLGFkYzowLHNlY3VyZTpmYWxzZX1cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidBaXInLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoISFhcmR1aW5vLnNlY3VyZSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLm5hbWUsXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGUrJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcjtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQudHJpbSgpKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIHZhciBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmluZmx1eGRiO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnRwbGluaztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnNrZXRjaGVzO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkLnRyaW0oKSk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkd2VldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYXRlc3Q6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9sYXRlc3QvZHdlZXQvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9kd2VldHMvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiAoZGV2aWNlLCB0b2dnbGUpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IHRvZ2dsZSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgc3RyZWFtczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEvYXBpJywgaGVhZGVyczoge30sIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdXRoOiBhc3luYyAocGluZykgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiYgc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSl7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAocGluZykgPyAnL3VzZXJzL3BpbmcnIDogJy91c2Vycy9hdXRoJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9J2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUFQSS1LZXknXSA9IGAke3NldHRpbmdzLnN0cmVhbXMuYXBpX2tleX1gO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydYLUJCLVVzZXInXSA9IGAke3NldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9YDtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzICYmIHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKVxuICAgICAgICAgICAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbihyZXNwb25zZS5kYXRhLmFjY2Vzcy5pZCk7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVqZWN0KGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAga2V0dGxlczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9rZXR0bGVzJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNhdmU6IGFzeW5jIChrZXR0bGUpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cGRhdGVkS2V0dGxlID0gYW5ndWxhci5jb3B5KGtldHRsZSk7XG4gICAgICAgICAgICAvLyByZW1vdmUgbm90IG5lZWRlZCBkYXRhXG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS52YWx1ZXM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5tZXNzYWdlO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUudGltZXJzO1xuICAgICAgICAgICAgZGVsZXRlIHVwZGF0ZWRLZXR0bGUua25vYjtcbiAgICAgICAgICAgIHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QgPSAoc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISF1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykodXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCowLjU1NSwzKSA6IHVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMvYXJtJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uOiBzZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sXG4gICAgICAgICAgICAgIGtldHRsZTogdXBkYXRlZEtldHRsZSxcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczogc2V0dGluZ3Mubm90aWZpY2F0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uczoge1xuICAgICAgICAgIGdldDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgKz0gJy9zZXNzaW9ucyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uSWQ6IHNlc3Npb25JZCxcbiAgICAgICAgICAgICAga2V0dGxlOiBrZXR0bGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNhdmU6IGFzeW5jIChzZXNzaW9uKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zLycrc2Vzc2lvbi5pZDtcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BBVENIJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgbmFtZTogc2Vzc2lvbi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlOiBzZXNzaW9uLnR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSB0aGlzLmFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICBhdmVyYWdlID0gU0VSSUVTUkVTSVNUT1IgLyBhdmVyYWdlO1xuXG4gICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICBzdGVpbmhhcnQgLz0gQkNPRUZGSUNJRU5UOyAgICAgICAgICAgICAgICAgICAvLyAxL0IgKiBsbihSL1JvKVxuICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICBzdGVpbmhhcnQgLT0gMjczLjE1O1xuICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcpe1xuICAgICAgIGlmIChyYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChyYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZiggISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0ICYmIGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSA9PT0gLTEpXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKCAhIWluZmx1eGRiLnBvcnQgJiYgaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpID09PSAtMSlcbiAgICAgICAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7aW5mbHV4ZGIucG9ydH1gXG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn1gLCBtZXRob2Q6ICdHRVQnfTtcbiAgICAgICAgICBpZihpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2A7XG4gICAgICAgICAgICBpZihpbmZsdXhkYiAmJiBpbmZsdXhkYi51c2VyICYmIGluZmx1eGRiLnBhc3Mpe1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoaW5mbHV4ZGIudXNlci50cmltKCkrJzonK2luZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2Eoc2V0dGluZ3MuaW5mbHV4ZGIudXNlci50cmltKCkrJzonK3NldHRpbmdzLmluZmx1eGRiLnBhc3MudHJpbSgpKX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xKXtcbiAgICAgICAgICAgIHEucmVzb2x2ZShbc2V0dGluZ3MuaW5mbHV4ZGIudXNlcl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICBpZihpbmZsdXhDb25uZWN0aW9uLmluZGV4T2YoJ3N0cmVhbXMuYnJld2JlbmNoLmNvJykgIT09IC0xKXtcbiAgICAgICAgICAgIHEucmVqZWN0KCdEYXRhYmFzZSBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXIudHJpbSgpfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzcy50cmltKCl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6ICEhb3B0aW9ucy5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6ICEhb3B0aW9ucy5zZXNzaW9uID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gISFvcHRpb25zLmNoYXJ0LmFyZWEgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCEhb3B0aW9ucy5jaGFydC5taWxpdGFyeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgdmFyIHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgdmFyIHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICB2YXIgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9