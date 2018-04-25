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
    $scope.kettles.push({
      name: type ? _.find($scope.kettleTypes, { type: type }).name : $scope.kettleTypes[0].name,
      id: null,
      type: type || $scope.kettleTypes[0].type,
      active: false,
      sticky: false,
      heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0 },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, secure: false },
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

  $scope.pinInUse = function (pin, arduinoId, analog) {
    var kettle = _.find($scope.kettles, function (kettle) {
      return kettle.arduino.id == arduinoId && (analog && kettle.temp.type == 'Thermistor' && kettle.temp.pin == pin || !analog && kettle.temp.type == 'DS18B20' && kettle.temp.pin == pin || kettle.temp.type == 'PT100' && kettle.temp.pin == pin || !analog && kettle.heater.pin == pin || !analog && kettle.cooler && kettle.cooler.pin == pin || !analog && !kettle.cooler && kettle.pump.pin == pin);
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
      } else if (kettle.temp.type.indexOf('DS18B20') !== -1 && currentSketch.headers.indexOf('#include "cactus_io_DS18B20.h"') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
        currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
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
        response.data = response.data.replace(/\[STREAMS_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.streams.username + ':' + $scope.settings.streams.api_key));
      }if (sketch.indexOf('InfluxDB') !== -1) {
        // influx db connection
        var connection_string = '' + $scope.settings.influxdb.url;
        if ($scope.influxdb.brewbenchHosted()) {
          connection_string += '/bbp';
          response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.influxdb.user + ':' + $scope.settings.influxdb.pass));
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
      if (hasTriggers) {
        response.data = response.data.replace(/\/\/ triggers /g, '');
      }
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', sketch + '-' + name + '.ino');
      streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
      streamSketch.click();
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
        arduinos: [{ id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, secure: false, version: '', status: { error: '', dt: '' } }],
        tplink: { user: '', pass: '', token: '', status: '', plugs: [] },
        influxdb: { url: '', port: 8086, user: '', pass: '', db: '', dbs: [], status: '' },
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
        temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, secure: false },
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
        temp: { pin: 'A1', type: 'Thermistor', hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, secure: false },
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
        temp: { pin: 'A2', type: 'Thermistor', hit: false, current: 0, measured: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: 'local-' + btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13, secure: false },
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
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
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
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
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
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
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
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
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

      if (arduino.password) query += '&auth=' + btoa('root:' + arduino.password);

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
      if (!!settings.influxdb.port) influxConnection += ':' + settings.influxdb.port;

      return {
        ping: function ping(influxdb) {
          if (influxdb && influxdb.url) {
            influxConnection = '' + influxdb.url;
            if (!!influxdb.port) influxConnection += ':' + influxdb.port;
          }
          var request = { url: '' + influxConnection, method: 'GET' };
          if (influxConnection.indexOf('streams.brewbench.co') !== -1) {
            request.url = influxConnection + '/ping';
            if (influxdb && influxdb.user && influxdb.pass) {
              request.headers = { 'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(influxdb.user + ':' + influxdb.pass) };
            } else {
              request.headers = { 'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(settings.influxdb.user + ':' + settings.influxdb.pass) };
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
            $http({ url: influxConnection + '/query?u=' + settings.influxdb.user + '&p=' + settings.influxdb.pass + '&q=' + encodeURIComponent('show databases'), method: 'GET' }).then(function (response) {
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
            $http({ url: influxConnection + '/query?u=' + settings.influxdb.user + '&p=' + settings.influxdb.pass + '&q=' + encodeURIComponent('CREATE DATABASE "' + name + '"'), method: 'POST' }).then(function (response) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0Iiwic2l0ZSIsImh0dHBzIiwiZG9jdW1lbnQiLCJwcm90b2NvbCIsImh0dHBzX3VybCIsImhvc3QiLCJob3BzIiwiZ3JhaW5zIiwid2F0ZXIiLCJsb3ZpYm9uZCIsInBrZyIsImtldHRsZVR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZ2VuZXJhbCIsImNoYXJ0T3B0aW9ucyIsInVuaXQiLCJjaGFydCIsInNlc3Npb24iLCJzdHJlYW1zIiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0U3RhdHVzQ2xhc3MiLCJzdGF0dXMiLCJlbmRzV2l0aCIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsInNlY3VyZSIsInZlcnNpb24iLCJkdCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImVtZXRlciIsImdldF9yZWFsdGltZSIsImVycl9jb2RlIiwicG93ZXIiLCJkZXZpY2UiLCJ0b2dnbGUiLCJvZmZPck9uIiwicmVsYXlfc3RhdGUiLCJhZGRLZXR0bGUiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJoaXQiLCJtZWFzdXJlZCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwiY291bnQiLCJub3RpZnkiLCJzbGFjayIsImR3ZWV0IiwiaGFzU3RpY2t5S2V0dGxlcyIsImtldHRsZUNvdW50IiwiYWN0aXZlS2V0dGxlcyIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwicGluSW5Vc2UiLCJhcmR1aW5vSWQiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwiaW5mbHV4ZGIiLCJicmV3YmVuY2hIb3N0ZWQiLCJyZW1vdmUiLCJkZWZhdWx0U2V0dGluZ3MiLCJjb25uZWN0IiwicGluZyIsIiQiLCJyZW1vdmVDbGFzcyIsImRiIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJhZGRDbGFzcyIsImNyZWF0ZSIsIm1vbWVudCIsImZvcm1hdCIsImNyZWF0ZWQiLCJjcmVhdGVEQiIsImRhdGEiLCJyZXN1bHRzIiwicmVzZXRFcnJvciIsImNvbm5lY3RlZCIsInVzZXJuYW1lIiwiYXBpX2tleSIsImF1dGgiLCJyZWxheSIsInNhdmUiLCJrZXR0bGVSZXNwb25zZSIsIm1lcmdlIiwiY29uc29sZSIsInNlc3Npb25zIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwib24iLCJoaWdoIiwibG93IiwibGFzdCIsInN1YlRleHQiLCJlbmFibGVkIiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsInRydXN0QXNIdG1sIiwia2V5cyIsInN0YXR1c1RleHQiLCJzdHJpbmdpZnkiLCJ1cGRhdGVBcmR1aW5vU3RhdHVzIiwiZG9tYWluIiwic2tldGNoX3ZlcnNpb24iLCJ1cGRhdGVUZW1wIiwia2V5IiwidGVtcHMiLCJzaGlmdCIsImh1bWlkaXR5IiwiZ2V0VGltZSIsImdldE5hdk9mZnNldCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJoYXNTa2V0Y2hlcyIsImhhc0FTa2V0Y2giLCJzdGFydFN0b3BLZXR0bGUiLCJNYXRoIiwicm91bmQiLCJvZmYiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY29tcGlsZVNrZXRjaCIsInNrZXRjaE5hbWUiLCJza2V0Y2hlcyIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImFjdGlvbnMiLCJ0cmlnZ2VycyIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwiYWRkaXRpb25hbF9wb3N0X3BhcmFtcyIsInBvcnQiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiY2xpY2siLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJhbGVydCIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJib2R5IiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJrZXR0bGVUeXBlIiwidXBkYXRlU3RyZWFtcyIsImNoYW5nZVVuaXRzIiwidiIsInRpbWVyUnVuIiwibmV4dFRpbWVyIiwiY2FuY2VsIiwiaW50ZXJ2YWwiLCJhbGxTZW5zb3JzIiwicG9sbFNlY29uZHMiLCJyZW1vdmVLZXR0bGUiLCIkaW5kZXgiLCJjaGFuZ2VWYWx1ZSIsImZpZWxkIiwibG9hZGVkIiwidXBkYXRlTG9jYWwiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJ0cmltIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwidG9TdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJhY2Nlc3NUb2tlbiIsInNldEl0ZW0iLCJnZXRJdGVtIiwiZGVidWciLCJzaG93IiwibWlsaXRhcnkiLCJhcmVhIiwicmVhZE9ubHkiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsInNlbnNvclR5cGVzIiwic2Vuc29ycyIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwicmVxdWVzdCIsIndpdGhDcmVkZW50aWFscyIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImxhdGVzdCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwidXBkYXRlZEtldHRsZSIsInNlc3Npb25JZCIsImJpdGNhbGMiLCJhdmVyYWdlIiwiZm1hcCIsIngiLCJpbl9taW4iLCJpbl9tYXgiLCJvdXRfbWluIiwib3V0X21heCIsIlRIRVJNSVNUT1JOT01JTkFMIiwiVEVNUEVSQVRVUkVOT01JTkFMIiwiTlVNU0FNUExFUyIsIkJDT0VGRklDSUVOVCIsIlNFUklFU1JFU0lTVE9SIiwic3RlaW5oYXJ0IiwibG9nIiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsInRpdGxlIiwiZW5hYmxlIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJpbnRlcnBvbGF0ZSIsImxlZ2VuZCIsImlzQXJlYSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwicGFyc2VJbnQiLCJGX1NfTUlOX0lCVSIsIkluZ3JlZGllbnRzIiwiR3JhaW4iLCJGX0dfTkFNRSIsIkZfR19CT0lMX1RJTUUiLCJGX0dfQU1PVU5UIiwiSG9wcyIsIkZfSF9OQU1FIiwiRl9IX0RSWV9IT1BfVElNRSIsIkZfSF9CT0lMX1RJTUUiLCJGX0hfQU1PVU5UIiwiTWlzYyIsIkZfTV9OQU1FIiwiRl9NX1RJTUUiLCJGX01fQU1PVU5UIiwiWWVhc3QiLCJGX1lfTEFCIiwiRl9ZX1BST0RVQ1RfSUQiLCJGX1lfTkFNRSIsIm1hc2hfdGltZSIsIk5BTUUiLCJTVFlMRSIsIkNBVEVHT1JZIiwiQlJFV0VSIiwiT0ciLCJGRyIsIklCVSIsIkFCVl9NQVgiLCJBQlZfTUlOIiwiTUFTSCIsIk1BU0hfU1RFUFMiLCJNQVNIX1NURVAiLCJTVEVQX1RJTUUiLCJGRVJNRU5UQUJMRVMiLCJGRVJNRU5UQUJMRSIsIkFNT1VOVCIsIkhPUFMiLCJIT1AiLCJGT1JNIiwiVVNFIiwiVElNRSIsIk1JU0NTIiwiTUlTQyIsIllFQVNUUyIsIllFQVNUIiwiY29udGVudCIsImh0bWxjaGFycyIsImYiLCJyIiwiY2hhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdCQUFjRyxRQUFkLENBQXVCRSxPQUF2QixDQUErQkMsTUFBL0IsR0FBd0MsZ0NBQXhDO0FBQ0EsU0FBT04sY0FBY0csUUFBZCxDQUF1QkUsT0FBdkIsQ0FBK0JDLE1BQS9CLENBQXNDLGtCQUF0QyxDQUFQOztBQUVBTCxvQkFBa0JNLFVBQWxCLENBQTZCLEVBQTdCO0FBQ0FMLG1CQUFpQk0sMEJBQWpCLENBQTRDLG9FQUE1Qzs7QUFFQVYsaUJBQ0dXLEtBREgs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QyxHQUFHLEdBQWpCLEVBcFFjLEVBcVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclFjLEVBc1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFFjLEVBdVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlFjLEVBd1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFFjLEVBeVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFJjLEVBdVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlJjLEVBd1JkLEVBQUNELEdBQUcsUUFBSixFQUFj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QixFQWxmYyxFQW1mZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuZmMsRUFvZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGZjLEVBcWZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJmYyxFQXNmZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0ZmMsRUF1ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBOWdCLFFBQUU2RCxJQUFGLENBQU8rYyxTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRL2dCLE9BQVIsQ0FBZ0JtaEIsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVFoaEIsT0FBUixDQUFnQjZXLE9BQU91SyxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQS9sREksR0FBUDtBQWltREQsQ0FwbURELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6TW9kdWxlJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGxcbiAgLHJlc2V0Q2hhcnQgPSAxMDBcbiAgLHRpbWVvdXQgPSBudWxsOy8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5CcmV3U2VydmljZSA9IEJyZXdTZXJ2aWNlO1xuJHNjb3BlLnNpdGUgPSB7aHR0cHM6ICEhKGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sPT0naHR0cHM6JylcbiAgLCBodHRwc191cmw6IGBodHRwczovLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH1gXG59O1xuJHNjb3BlLmhvcHM7XG4kc2NvcGUuZ3JhaW5zO1xuJHNjb3BlLndhdGVyO1xuJHNjb3BlLmxvdmlib25kO1xuJHNjb3BlLnBrZztcbiRzY29wZS5rZXR0bGVUeXBlcyA9IEJyZXdTZXJ2aWNlLmtldHRsZVR5cGVzKCk7XG4kc2NvcGUuc2hvd1NldHRpbmdzID0gdHJ1ZTtcbiRzY29wZS5lcnJvciA9IHttZXNzYWdlOiAnJywgdHlwZTogJ2Rhbmdlcid9O1xuJHNjb3BlLnNsaWRlciA9IHtcbiAgbWluOiAwLFxuICBvcHRpb25zOiB7XG4gICAgZmxvb3I6IDAsXG4gICAgY2VpbDogMTAwLFxuICAgIHN0ZXA6IDUsXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gYCR7dmFsdWV9JWA7XG4gICAgfSxcbiAgICBvbkVuZDogZnVuY3Rpb24oa2V0dGxlSWQsIG1vZGVsVmFsdWUsIGhpZ2hWYWx1ZSwgcG9pbnRlclR5cGUpe1xuICAgICAgdmFyIGtldHRsZSA9IGtldHRsZUlkLnNwbGl0KCdfJyk7XG4gICAgICB2YXIgaztcblxuICAgICAgc3dpdGNoIChrZXR0bGVbMF0pIHtcbiAgICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uaGVhdGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5jb29sZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLnB1bXA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmKCFrKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmFjdGl2ZSAmJiBrLnB3bSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgICByZXR1cm4gJHNjb3BlLnRvZ2dsZVJlbGF5KCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0sIGssIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuJHNjb3BlLmdldEtldHRsZVNsaWRlck9wdGlvbnMgPSBmdW5jdGlvbih0eXBlLCBpbmRleCl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKCRzY29wZS5zbGlkZXIub3B0aW9ucywge2lkOiBgJHt0eXBlfV8ke2luZGV4fWB9KTtcbn1cblxuJHNjb3BlLmdldExvdmlib25kQ29sb3IgPSBmdW5jdGlvbihyYW5nZSl7XG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZSgvwrAvZywnJykucmVwbGFjZSgvIC9nLCcnKTtcbiAgaWYocmFuZ2UuaW5kZXhPZignLScpIT09LTEpe1xuICAgIHZhciByQXJyPXJhbmdlLnNwbGl0KCctJyk7XG4gICAgcmFuZ2UgPSAocGFyc2VGbG9hdChyQXJyWzBdKStwYXJzZUZsb2F0KHJBcnJbMV0pKS8yO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gcGFyc2VGbG9hdChyYW5nZSk7XG4gIH1cbiAgaWYoIXJhbmdlKVxuICAgIHJldHVybiAnJztcbiAgdmFyIGwgPSBfLmZpbHRlcigkc2NvcGUubG92aWJvbmQsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiAoaXRlbS5zcm0gPD0gcmFuZ2UpID8gaXRlbS5oZXggOiAnJztcbiAgfSk7XG4gIGlmKCEhbC5sZW5ndGgpXG4gICAgcmV0dXJuIGxbbC5sZW5ndGgtMV0uaGV4O1xuICByZXR1cm4gJyc7XG59O1xuXG4vL2RlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4kc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnKSB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuLy8gZ2VuZXJhbCBjaGVjayBhbmQgdXBkYXRlXG5pZighJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwpXG4gIHJldHVybiAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh7dW5pdDogJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCwgY2hhcnQ6ICRzY29wZS5zZXR0aW5ncy5jaGFydCwgc2Vzc2lvbjogJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbn0pO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4kc2NvcGUuc2hhcmUgPSAoISRzdGF0ZS5wYXJhbXMuZmlsZSAmJiBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSkgPyBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSA6IHtcbiAgICAgIGZpbGU6ICRzdGF0ZS5wYXJhbXMuZmlsZSB8fCBudWxsXG4gICAgICAsIHBhc3N3b3JkOiBudWxsXG4gICAgICAsIG5lZWRQYXNzd29yZDogZmFsc2VcbiAgICAgICwgYWNjZXNzOiAncmVhZE9ubHknXG4gICAgICAsIGRlbGV0ZUFmdGVyOiAxNFxuICB9O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtQnkob2JqLCdhbW91bnQnKTtcbn1cblxuLy8gaW5pdCBjYWxjIHZhbHVlc1xuJHNjb3BlLnVwZGF0ZUFCViA9IGZ1bmN0aW9uKCl7XG4gIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbihCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpXG4gICAgICAsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidihCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidixCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKVxuICAgICAgLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgfVxufTtcblxuJHNjb3BlLmNoYW5nZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kID0gbWV0aG9kO1xuICAkc2NvcGUudXBkYXRlQUJWKCk7XG59O1xuXG4kc2NvcGUuY2hhbmdlU2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGUgPSBzY2FsZTtcbiAgaWYoc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9XG59O1xuXG4kc2NvcGUuZ2V0U3RhdHVzQ2xhc3MgPSBmdW5jdGlvbihzdGF0dXMpe1xuICBpZihzdGF0dXMgPT0gJ0Nvbm5lY3RlZCcpXG4gICAgcmV0dXJuICdzdWNjZXNzJztcbiAgZWxzZSBpZihfLmVuZHNXaXRoKHN0YXR1cywnaW5nJykpXG4gICAgcmV0dXJuICdzZWNvbmRhcnknO1xuICBlbHNlXG4gICAgcmV0dXJuICdkYW5nZXInO1xufVxuXG4kc2NvcGUudXBkYXRlQUJWKCk7XG5cbiAgJHNjb3BlLmdldFBvcnRSYW5nZSA9IGZ1bmN0aW9uKG51bWJlcil7XG4gICAgICBudW1iZXIrKztcbiAgICAgIHJldHVybiBBcnJheShudW1iZXIpLmZpbGwoKS5tYXAoKF8sIGlkeCkgPT4gMCArIGlkeCk7XG4gIH07XG5cbiAgJHNjb3BlLmFyZHVpbm9zID0ge1xuICAgIGFkZDogKCkgPT4ge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zKSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAnJyxcbiAgICAgICAgc3RhdHVzOiB7ZXJyb3I6ICcnLGR0OiAnJ31cbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdTY2FubmluZyc7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKCEhcGx1Zy5zdGF0dXMpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBpZihKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lLmVycl9jb2RlID09IDApe1xuICAgICAgICAgICAgICAgICAgICBwbHVnLnBvd2VyID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWcucG93ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgdmFyIG9mZk9yT24gPSBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxID8gMCA6IDE7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS50b2dnbGUoZGV2aWNlLCBvZmZPck9uKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSBvZmZPck9uO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS50aGVuKHRvZ2dsZVJlc3BvbnNlID0+IHtcbiAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5mb1xuICAgICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICBkZXZpY2UuaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgaWYoSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuZW1ldGVyLmdldF9yZWFsdGltZS5lcnJfY29kZSA9PSAwKXtcbiAgICAgICAgICAgICAgICBkZXZpY2UucG93ZXIgPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5lbWV0ZXIuZ2V0X3JlYWx0aW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZS5wb3dlciA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICxpZDogbnVsbFxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAsbWVhc3VyZWQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsc2VjdXJlOmZhbHNlfVxuICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBwaW47XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFyZHVpbm9JZCxhbmFsb2cpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoa2V0dGxlLmFyZHVpbm8uaWQ9PWFyZHVpbm9JZCkgJiZcbiAgICAgICAgKChhbmFsb2cgJiYga2V0dGxlLnRlbXAudHlwZT09J1RoZXJtaXN0b3InICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUudGVtcC50eXBlPT0nRFMxOEIyMCcgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgIChrZXR0bGUudGVtcC50eXBlPT0nUFQxMDAnICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUuaGVhdGVyLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmICFrZXR0bGUuY29vbGVyICYmIGtldHRsZS5wdW1wLnBpbj09cGluKVxuICAgICAgKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLCRzY29wZS5zaGFyZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsJHNjb3BlLnNoYXJlKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbmZsdXhkYiA9IHtcbiAgICBicmV3YmVuY2hIb3N0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybC5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSk7XG4gICAgfSxcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiID0gZGVmYXVsdFNldHRpbmdzLmluZmx1eGRiO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0IHx8IHJlc3BvbnNlLnN0YXR1cyA9PSAyMDApe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnQ29ubmVjdGVkJztcbiAgICAgICAgICAgIGlmKCRzY29wZS5pbmZsdXhkYi5icmV3YmVuY2hIb3N0ZWQoKSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyAmJiAoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpKXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICAgIH0gZWxzZSBpZihlcnIpe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3RyZWFtcyA9IHtcbiAgICBjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgIHJldHVybiAoISEkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSAmJlxuICAgICAgICAhISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkgJiZcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID09ICdDb25uZWN0ZWQnXG4gICAgICApO1xuICAgIH0sXG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zID0gZGVmYXVsdFNldHRpbmdzLnN0cmVhbXM7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGtldHRsZS5ub3RpZnkuc3RyZWFtcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIHJldHVybiBCcmV3U2VydmljZS5zdHJlYW1zKCkuYXV0aCh0cnVlKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdGYWlsZWQgdG8gQ29ubmVjdCc7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAga2V0dGxlczogKGtldHRsZSwgcmVsYXkpID0+IHtcbiAgICAgIGlmKHJlbGF5KXtcbiAgICAgICAga2V0dGxlW3JlbGF5XS5za2V0Y2ggPSAha2V0dGxlW3JlbGF5XS5za2V0Y2g7XG4gICAgICAgIGlmKCFrZXR0bGUubm90aWZ5LnN0cmVhbXMpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSAnc2tldGNoZXMnO1xuICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdpbmZvJztcbiAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDA7XG4gICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLmtldHRsZXMuc2F2ZShrZXR0bGUpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICB2YXIga2V0dGxlUmVzcG9uc2UgPSByZXNwb25zZS5rZXR0bGU7XG4gICAgICAgICAgLy8gdXBkYXRlIGtldHRsZSB2YXJzXG4gICAgICAgICAga2V0dGxlLmlkID0ga2V0dGxlUmVzcG9uc2UuaWQ7XG4gICAgICAgICAgLy8gdXBkYXRlIGFyZHVpbm8gaWRcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCBhcmR1aW5vID0+IHtcbiAgICAgICAgICAgIGlmKGFyZHVpbm8uaWQgPT0ga2V0dGxlLmFyZHVpbm8uaWQpXG4gICAgICAgICAgICAgIGFyZHVpbm8uaWQgPSBrZXR0bGVSZXNwb25zZS5kZXZpY2VJZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBrZXR0bGUuYXJkdWluby5pZCA9IGtldHRsZVJlc3BvbnNlLmRldmljZUlkO1xuICAgICAgICAgIC8vIHVwZGF0ZSBzZXNzaW9uIHZhcnNcbiAgICAgICAgICBfLm1lcmdlKCRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sIGtldHRsZVJlc3BvbnNlLnNlc3Npb24pO1xuXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudHlwZSA9ICdzdWNjZXNzJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5zdGF0dXMgPSAyO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSAha2V0dGxlLm5vdGlmeS5zdHJlYW1zO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnN0YXR1cyA9IDE7XG4gICAgICAgICAgaWYoZXJyICYmIGVyci5kYXRhICYmIGVyci5kYXRhLmVycm9yICYmIGVyci5kYXRhLmVycm9yLm1lc3NhZ2Upe1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIuZGF0YS5lcnJvci5tZXNzYWdlLCBrZXR0bGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQnJld0JlbmNoIFN0cmVhbXMgRXJyb3InLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXNzaW9uczoge1xuICAgICAgc2F2ZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2Uuc3RyZWFtcygpLnNlc3Npb25zLnNhdmUoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbilcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCl7XG4gICAgICAgIGlmKGFjY2Vzcyl7XG4gICAgICAgICAgaWYoYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gISEoJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFNoYXJlRmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnNoYXJlZCA9IHRydWU7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmxvYWRTaGFyZUZpbGUoJHNjb3BlLnNoYXJlLmZpbGUsICRzY29wZS5zaGFyZS5wYXNzd29yZCB8fCBudWxsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY29udGVudHMpIHtcbiAgICAgICAgaWYoY29udGVudHMpe1xuICAgICAgICAgIGlmKGNvbnRlbnRzLm5lZWRQYXNzd29yZCl7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUgPSBjb250ZW50cy5zZXR0aW5ncy5yZWNpcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNoYXJlICYmIGNvbnRlbnRzLnNoYXJlLmFjY2Vzcyl7XG4gICAgICAgICAgICAgICRzY29wZS5zaGFyZS5hY2Nlc3MgPSBjb250ZW50cy5zaGFyZS5hY2Nlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncyl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncyA9IGNvbnRlbnRzLnNldHRpbmdzO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucyA9IHtvbjpmYWxzZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5rZXR0bGVzKXtcbiAgICAgICAgICAgICAgXy5lYWNoKGNvbnRlbnRzLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgICAgICAgICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIwMCs1LHN1YlRleHQ6e2VuYWJsZWQ6IHRydWUsdGV4dDogJ3N0YXJ0aW5nLi4uJyxjb2xvcjogJ2dyYXknLGZvbnQ6ICdhdXRvJ319KTtcbiAgICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzID0gW107XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlcyA9IGNvbnRlbnRzLmtldHRsZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGxvYWRpbmcgdGhlIHNoYXJlZCBzZXNzaW9uLlwiKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZighIWZvcm1hdHRlZF9jb250ZW50KXtcbiAgICAgICAgdmFyIHgyanMgPSBuZXcgWDJKUygpO1xuICAgICAgICBqc29uT2JqID0geDJqcy54bWxfc3RyMmpzb24oIGZvcm1hdHRlZF9jb250ZW50ICk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFqc29uT2JqKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCRleHQ9PSdic214Jyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SZWNpcGVzICYmICEhanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZighIWpzb25PYmouU2VsZWN0aW9ucyAmJiAhIWpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SRUNJUEVTICYmICEhanNvbk9iai5SRUNJUEVTLlJFQ0lQRSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJFQ0lQRVMuUkVDSVBFO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclhNTChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZighcmVjaXBlKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCEhcmVjaXBlLm9nKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoISFyZWNpcGUuZmcpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucy5sZW5ndGggJiZcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLCB7bmFtZTogZ3JhaW4ubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBncmFpbi5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGdyYWluLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIHtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICAvLyByZWNpcGUgZGlzcGxheVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSkubGVuZ3RoKXtcbiAgICAgICAgICAgIF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcywge25hbWU6IGhvcC5sYWJlbH0pWzBdLmFtb3VudCArPSBwYXJzZUZsb2F0KGhvcC5hbW91bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGhvcC5sYWJlbCwgYW1vdW50OiBwYXJzZUZsb2F0KGhvcC5hbW91bnQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aW1lcnNcbiAgICAgICAgdmFyIGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKXtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ3dhcm5pbmcnO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdUaGUgbW9uaXRvciBzZWVtcyB0byBiZSBvZmYtbGluZSwgcmUtY29ubmVjdGluZy4uLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZighIWVyci5zdGF0dXNUZXh0KVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgaWYobG9jYXRpb24pXG4gICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSwgbWVzc2FnZSk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLm1lc3NhZ2UubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWApO1xuICAgICAgICAkc2NvcGUudXBkYXRlQXJkdWlub1N0YXR1cyh7a2V0dGxlOmtldHRsZX0sIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMgPSBmdW5jdGlvbihyZXNwb25zZSwgZXJyb3Ipe1xuICAgIHZhciBhcmR1aW5vID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLCB7aWQ6IHJlc3BvbnNlLmtldHRsZS5hcmR1aW5vLmlkfSk7XG4gICAgaWYoYXJkdWluby5sZW5ndGgpe1xuICAgICAgYXJkdWlub1swXS5zdGF0dXMuZHQgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYocmVzcG9uc2Uuc2tldGNoX3ZlcnNpb24pXG4gICAgICAgIGFyZHVpbm9bMF0udmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgaWYoZXJyb3IpXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gZXJyb3I7XG4gICAgICBlbHNlXG4gICAgICAgIGFyZHVpbm9bMF0uc3RhdHVzLmVycm9yID0gJyc7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQ9MDtcbiAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICAgICRzY29wZS51cGRhdGVBcmR1aW5vU3RhdHVzKHtrZXR0bGU6a2V0dGxlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UudGVtcCl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgICAvLyBuZWVkZWQgZm9yIGNoYXJ0c1xuICAgIGtldHRsZS5rZXkgPSBrZXR0bGUubmFtZTtcbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy91cGRhdGUgZGF0YXR5cGVcbiAgICByZXNwb25zZS50ZW1wID0gcGFyc2VGbG9hdChyZXNwb25zZS50ZW1wKTtcbiAgICByZXNwb25zZS5yYXcgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnJhdyk7XG5cbiAgICBpZighIWtldHRsZS50ZW1wLmN1cnJlbnQpXG4gICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAubWVhc3VyZWQgPSAoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgICRmaWx0ZXIoJ3JvdW5kJykocmVzcG9uc2UudGVtcCwyKTtcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5tZWFzdXJlZCkgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIC8vIHNldCByYXdcbiAgICBrZXR0bGUudGVtcC5yYXcgPSByZXNwb25zZS5yYXc7XG4gICAgLy8gcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzLnNoaWZ0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHlcbiAgICBpZiggcmVzcG9uc2UuaHVtaWRpdHkgKXtcbiAgICAgIGtldHRsZS5odW1pZGl0eSA9IHJlc3BvbnNlLmh1bWlkaXR5O1xuICAgIH1cblxuICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgJHNjb3BlLnVwZGF0ZUFyZHVpbm9TdGF0dXMoe2tldHRsZTprZXR0bGUsIHNrZXRjaF92ZXJzaW9uOnJlc3BvbnNlLnNrZXRjaF92ZXJzaW9ufSk7XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFjayB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuXG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAga2V0dGxlLm1lc3NhZ2UuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5tZXNzYWdlLmNvdW50PT03KVxuICAgICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBpZihrZXR0bGUucHVtcCkga2V0dGxlLnB1bXAuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuaGVhdGVyKSBrZXR0bGUuaGVhdGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmNvb2xlcikga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBpbGVTa2V0Y2ggPSBmdW5jdGlvbihza2V0Y2hOYW1lKXtcbiAgICB2YXIgc2tldGNoZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIGlmKCFjdXJyZW50U2tldGNoKXtcbiAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0PT0nRicgJiYgISFrZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMykgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRMaWIuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpO1xuICAgICAgfVxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2FjdGlvbnNDb21tYW5kKEYoXCInK2tldHRsZS5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlLnRlbXAudHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5oZWF0ZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS5jb29sZXIucGluKydcIiksdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYoc2tldGNoLnRyaWdnZXJzKXtcbiAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7JylcbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kXG4gICAgICAgIGZvcih2YXIgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhY3Rpb25zQ29tbWFuZCgnKSAhPT0gLTEpXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhY3Rpb25zQ29tbWFuZCgnLCd0ZW1wID0gYWN0aW9uc0NvbW1hbmQoJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gudHJpZ2dlcnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoJytza2V0Y2hOYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICB2YXIgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIHZhciBhdXRvZ2VuID0gJy8qIFNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jbyBvbiAnK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDpNTTpTUycpKycgZm9yICcrbmFtZSsnICovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFthY3Rpb25zXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbaGVhZGVyc10nLCBoZWFkZXJzLmxlbmd0aCA/IGhlYWRlcnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxbVkVSU0lPTlxcXS9nLCAkc2NvcGUucGtnLnNrZXRjaF92ZXJzaW9uKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFtUUExJTktfQ09OTkVDVElPTlxcXS9nLCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcW1NMQUNLX0NPTk5FQ1RJT05cXF0vZywgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2spXG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignU3RyZWFtcycpICE9PSAtMSl7XG4gICAgICAgICAgLy8gc3RyZWFtcyBjb25uZWN0aW9uXG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYGh0dHBzOi8vJHskc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX0uc3RyZWFtcy5icmV3YmVuY2guY29gO1xuICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nID0gJ2h0dHA6Ly8xMC4wLjEuMTQ6MzAwMSc7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbU1RSRUFNU19DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtTVFJFQU1TX0FVVEhcXF0vZywgJ0F1dGhvcml6YXRpb246IEJhc2ljICcrYnRvYSgkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZSsnOicrJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSkpO1xuICAgICAgICB9IGlmKCBza2V0Y2guaW5kZXhPZignSW5mbHV4REInKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIGluZmx1eCBkYiBjb25uZWN0aW9uXG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYCR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgICAgIGlmKCRzY29wZS5pbmZsdXhkYi5icmV3YmVuY2hIb3N0ZWQoKSl7XG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL2JicCc7XG4gICAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtJTkZMVVhEQl9BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIrJzonKyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKSk7XG4gICAgICAgICAgICB2YXIgYWRkaXRpb25hbF9wb3N0X3BhcmFtcyA9ICdwLmFkZFBhcmFtZXRlcihGKFwiLUhcIikpO1xcbic7XG4gICAgICAgICAgICBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zICs9ICcgIHAuYWRkUGFyYW1ldGVyKEYoXCJYLUFQSS1LRVk6ICcrJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MrJ1wiKSk7JztcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoJy8vIGFkZGl0aW9uYWxfcG9zdF9wYXJhbXMnLCBhZGRpdGlvbmFsX3Bvc3RfcGFyYW1zKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvd3JpdGU/JztcbiAgICAgICAgICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICAgICAgICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIgJiYgISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcylcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYFxuICAgICAgICAgICAgLy8gYWRkIGRiXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFxbSU5GTFVYREJfQVVUSFxcXS9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcW0lORkxVWERCX0NPTk5FQ1RJT05cXF0vZywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERIVCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGFzVHJpZ2dlcnMpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyB0cmlnZ2VycyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgc2tldGNoKyctJytuYW1lKycuaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSsnXFx1MDBCMCBsb3cnO1xuICAgICAgY29sb3IgPSAnIzM0OThEQic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdsb3cnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGFyZ2V0IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSd0YXJnZXQnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2tldHRsZS50ZW1wLmN1cnJlbnQrJ1xcdTAwQjAnO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBtZWFzdXJlZCBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5zbGFjaygkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIGljb24sXG4gICAgICAgICAga2V0dGxlXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgaWYoZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7SlNPTi5zdHJpbmdpZnkoZXJyKX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVLbm9iQ29weSA9IGZ1bmN0aW9uKGtldHRsZSl7XG5cbiAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnbm90IHJ1bm5pbmcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcblxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcblxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBrZXR0bGUudGVtcC5jdXJyZW50LWtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICAgIC8vIHVwZGF0ZSBzdWJ0ZXh0IHRvIGluY2x1ZGUgaHVtaWRpdHlcbiAgICBpZihrZXR0bGUuaHVtaWRpdHkpe1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0ga2V0dGxlLmh1bWlkaXR5KyclJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLmdlbmVyYWwuc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLm5hbWUgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJyl7XG4gICAgICBrZXR0bGUuY29vbGVyID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5wdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUucHVtcCA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUuY29vbGVyO1xuICAgIH1cbiAgICAkc2NvcGUudXBkYXRlU3RyZWFtcyhrZXR0bGUpO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuZ2VuZXJhbC51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnRhcmdldCk7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmN1cnJlbnQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLm1lYXN1cmVkID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLm1lYXN1cmVkLHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBjaGFydCB2YWx1ZXNcbiAgICAgICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICAgICAgXy5lYWNoKGtldHRsZS52YWx1ZXMsICh2LCBpKSA9PiB7XG4gICAgICAgICAgICAgIGtldHRsZS52YWx1ZXNbaV0gPSBba2V0dGxlLnZhbHVlc1tpXVswXSwkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnZhbHVlc1tpXVsxXSx1bml0KV07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoe3VuaXQ6ICRzY29wZS5zZXR0aW5ncy5nZW5lcmFsLnVuaXQsIGNoYXJ0OiAkc2NvcGUuc2V0dGluZ3MuY2hhcnQsIHNlc3Npb246ICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb259KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUubm90aWZ5KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIHVkcGF0ZSBjaGFydCB3aXRoIGN1cnJlbnRcbiAgICAgICAgICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZUtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSwkaW5kZXgpe1xuICAgICRzY29wZS51cGRhdGVTdHJlYW1zKGtldHRsZSk7XG4gICAgJHNjb3BlLmtldHRsZXMuc3BsaWNlKCRpbmRleCwxKTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICBpZihmaWVsZCA9PSAnYWRqdXN0Jyl7XG4gICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gKHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAubWVhc3VyZWQpICsgcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpKTtcbiAgICB9XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgJHNjb3BlLnVwZGF0ZVN0cmVhbXMoa2V0dGxlKTtcbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS51cGRhdGVTdHJlYW1zID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL3VwZGF0ZSBzdHJlYW1zXG4gICAgaWYoJHNjb3BlLnN0cmVhbXMuY29ubmVjdGVkKCkgJiYga2V0dGxlLm5vdGlmeS5zdHJlYW1zKXtcbiAgICAgICRzY29wZS5zdHJlYW1zLmtldHRsZXMoa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKCEhbG9hZGVkKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcblxuICAvLyB1cGRhdGUgbG9jYWwgY2FjaGVcbiAgJHNjb3BlLnVwZGF0ZUxvY2FsID0gZnVuY3Rpb24oKXtcbiAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJywgJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJywkc2NvcGUua2V0dGxlcyk7XG4gICAgICAkc2NvcGUudXBkYXRlTG9jYWwoKTtcbiAgICB9LDUwMDApO1xuICB9XG4gICRzY29wZS51cGRhdGVMb2NhbCgpO1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQobmV3IERhdGUoZGF0ZSkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KG5ldyBEYXRlKGRhdGUpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgY2Vsc2l1cyA9IHBhcnNlRmxvYXQoY2Vsc2l1cyk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoY2Vsc2l1cyo5LzUrMzIsMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIGZhaHJlbmhlaXQgPSBwYXJzZUZsb2F0KGZhaHJlbmhlaXQpO1xuICAgIHJldHVybiAkZmlsdGVyKCdyb3VuZCcpKChmYWhyZW5oZWl0LTMyKSo1LzksMik7XG4gIH07XG59KVxuLmZpbHRlcigncm91bmQnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWwsZGVjaW1hbHMpIHtcbiAgICByZXR1cm4gTnVtYmVyKChNYXRoLnJvdW5kKHZhbCArIFwiZVwiICsgZGVjaW1hbHMpICArIFwiZS1cIiArIGRlY2ltYWxzKSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KVxuLmZpbHRlcigndGl0bGVjYXNlJywgZnVuY3Rpb24oJGZpbHRlcil7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0KXtcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpKTtcbiAgfVxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBhY2Nlc3NUb2tlbjogZnVuY3Rpb24odG9rZW4pe1xuICAgICAgaWYodG9rZW4pXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FjY2Vzc1Rva2VuJyx0b2tlbik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgfSxcbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZ2VuZXJhbDoge2RlYnVnOiBmYWxzZSwgcG9sbFNlY29uZHM6IDEwLCB1bml0OiAnRicsIHNoYXJlZDogZmFsc2V9XG4gICAgICAgICxjaGFydDoge3Nob3c6IHRydWUsIG1pbGl0YXJ5OiBmYWxzZSwgYXJlYTogZmFsc2V9XG4gICAgICAgICxyZWNpcGU6IHsnbmFtZSc6JycsJ2JyZXdlcic6e25hbWU6JycsJ2VtYWlsJzonJ30sJ3llYXN0JzpbXSwnaG9wcyc6W10sJ2dyYWlucyc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhcmR1aW5vczogW3tpZDonbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsc2VjdXJlOmZhbHNlLHZlcnNpb246Jycsc3RhdHVzOntlcnJvcjonJyxkdDonJ319XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgc3RhdHVzOiAnJywgcGx1Z3M6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiA4MDg2LCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBzdGF0dXM6ICcnfVxuICAgICAgICAsc3RyZWFtczoge3VzZXJuYW1lOiAnJywgYXBpX2tleTogJycsIHN0YXR1czogJycsIHNlc3Npb246IHtpZDogJycsIG5hbWU6ICcnLCB0eXBlOiAnZmVybWVudGF0aW9uJ319XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBuYW1lOiAnSG90IExpcXVvcidcbiAgICAgICAgICAsaWQ6IG51bGxcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6MixyYXc6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAgbmFtZTogJ01hc2gnXG4gICAgICAgICAgLGlkOiBudWxsXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxtZWFzdXJlZDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjIscmF3OjB9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiAnbG9jYWwtJytidG9hKCdicmV3YmVuY2gnKSx1cmw6J2FyZHVpbm8ubG9jYWwnLGFuYWxvZzo1LGRpZ2l0YWw6MTMsc2VjdXJlOmZhbHNlfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdCb2lsJ1xuICAgICAgICAgICxpZDogbnVsbFxuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLG1lYXN1cmVkOjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6MixyYXc6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6ICdsb2NhbC0nK2J0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxMyxzZWN1cmU6ZmFsc2V9XG4gICAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlLCBzdHJlYW1zOiBmYWxzZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH0gZWxzZSBpZihrZXkgPT0gJ3NldHRpbmdzJyl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMzMnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQ0NCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICB2YXIga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonQWlyJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICBdO1xuICAgICAgaWYodHlwZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGtldHRsZXMsIHsndHlwZSc6IHR5cGV9KVswXTtcbiAgICAgIHJldHVybiBrZXR0bGVzO1xuICAgIH0sXG5cbiAgICBkb21haW46IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBkb21haW4gPSAnaHR0cDovL2FyZHVpbm8ubG9jYWwnO1xuXG4gICAgICBpZihhcmR1aW5vICYmIGFyZHVpbm8udXJsKXtcbiAgICAgICAgZG9tYWluID0gKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykgIT09IC0xKSA/XG4gICAgICAgICAgYXJkdWluby51cmwuc3Vic3RyKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykrMikgOlxuICAgICAgICAgIGFyZHVpbm8udXJsO1xuXG4gICAgICAgIGlmKCEhYXJkdWluby5zZWN1cmUpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgc2xhY2s6IGZ1bmN0aW9uKHdlYmhvb2tfdXJsLCBtc2csIGNvbG9yLCBpY29uLCBrZXR0bGUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICB2YXIgcG9zdE9iaiA9IHsnYXR0YWNobWVudHMnOiBbeydmYWxsYmFjayc6IG1zZyxcbiAgICAgICAgICAgICd0aXRsZSc6IGtldHRsZS5uYW1lLFxuICAgICAgICAgICAgJ3RpdGxlX2xpbmsnOiAnaHR0cDovLycrZG9jdW1lbnQubG9jYXRpb24uaG9zdCxcbiAgICAgICAgICAgICdmaWVsZHMnOiBbeyd2YWx1ZSc6IG1zZ31dLFxuICAgICAgICAgICAgJ2NvbG9yJzogY29sb3IsXG4gICAgICAgICAgICAnbXJrZHduX2luJzogWyd0ZXh0JywgJ2ZhbGxiYWNrJywgJ2ZpZWxkcyddLFxuICAgICAgICAgICAgJ3RodW1iX3VybCc6IGljb25cbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAkaHR0cCh7dXJsOiB3ZWJob29rX3VybCwgbWV0aG9kOidQT1NUJywgZGF0YTogJ3BheWxvYWQ9JytKU09OLnN0cmluZ2lmeShwb3N0T2JqKSwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVGhlcm1pc3RvciwgRFMxOEIyMCwgb3IgUFQxMDBcbiAgICAvLyBodHRwczovL2xlYXJuLmFkYWZydWl0LmNvbS90aGVybWlzdG9yL3VzaW5nLWEtdGhlcm1pc3RvclxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzM4MSlcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMjkwIGFuZCBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMzI4XG4gICAgdGVtcDogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vJytrZXR0bGUudGVtcC50eXBlKycvJytrZXR0bGUudGVtcC5waW47XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5nZW5lcmFsLnBvbGxTZWNvbmRzKjEwMDAwfTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpe1xuICAgICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZCl9O1xuICAgICAgfVxuXG4gICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3I7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIHRpbWVvdXQ6IHNldHRpbmdzLmdlbmVyYWwucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5kYXRhLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIHZhciBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5zdHJlYW1zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmluZmx1eGRiO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnRwbGluaztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLnNrZXRjaGVzO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGU6IChkZXZpY2UsIHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogdG9nZ2xlIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBzdHJlYW1zOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMS9hcGknLCBoZWFkZXJzOiB7fSwgdGltZW91dDogc2V0dGluZ3MuZ2VuZXJhbC5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGF1dGg6IGFzeW5jIChwaW5nKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJiBzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lKXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9IChwaW5nKSA/ICcvdXNlcnMvcGluZycgOiAnL3VzZXJzL2F1dGgnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0nYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQVBJLUtleSddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5fWA7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ1gtQkItVXNlciddID0gYCR7c2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX1gO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MgJiYgcmVzcG9uc2UuZGF0YS5hY2Nlc3MuaWQpXG4gICAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuKHJlc3BvbnNlLmRhdGEuYWNjZXNzLmlkKTtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZWplY3QoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBrZXR0bGVzOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL2tldHRsZXMnO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKGtldHRsZSkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgIHZhciBhdXRoID0gYXdhaXQgdGhpcy5zdHJlYW1zKCkuYXV0aCgpO1xuICAgICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHVwZGF0ZWRLZXR0bGUgPSBhbmd1bGFyLmNvcHkoa2V0dGxlKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBub3QgbmVlZGVkIGRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLnZhbHVlcztcbiAgICAgICAgICAgIGRlbGV0ZSB1cGRhdGVkS2V0dGxlLm1lc3NhZ2U7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS50aW1lcnM7XG4gICAgICAgICAgICBkZWxldGUgdXBkYXRlZEtldHRsZS5rbm9iO1xuICAgICAgICAgICAgdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdCA9IChzZXR0aW5ncy5nZW5lcmFsLnVuaXQ9PSdGJyAmJiAhIXVwZGF0ZWRLZXR0bGUudGVtcC5hZGp1c3QpID8gJGZpbHRlcigncm91bmQnKSh1cGRhdGVkS2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDogdXBkYXRlZEtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcva2V0dGxlcy9hcm0nO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb246IHNldHRpbmdzLnN0cmVhbXMuc2Vzc2lvbixcbiAgICAgICAgICAgICAga2V0dGxlOiB1cGRhdGVkS2V0dGxlLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiBzZXR0aW5ncy5ub3RpZmljYXRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25zOiB7XG4gICAgICAgICAgZ2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5hY2Nlc3NUb2tlbigpKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCArPSAnL3Nlc3Npb25zJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ0dFVCc7XG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBrZXR0bGU6IGtldHRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2F2ZTogYXN5bmMgKHNlc3Npb24pID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKCkpe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4oKSl7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ1NvcnJ5IEJhZCBBdXRoZW50aWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvc2Vzc2lvbnMvJytzZXNzaW9uLmlkO1xuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnUEFUQ0gnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBuYW1lOiBzZXNzaW9uLm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6IHNlc3Npb24udHlwZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IHRoaXMuYWNjZXNzVG9rZW4oKTtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgLy8gZG8gY2FsY3MgdGhhdCBleGlzdCBvbiB0aGUgc2tldGNoXG4gICAgYml0Y2FsYzogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHZhciBhdmVyYWdlID0ga2V0dGxlLnRlbXAucmF3O1xuICAgICAgLy8gaHR0cHM6Ly93d3cuYXJkdWluby5jYy9yZWZlcmVuY2UvZW4vbGFuZ3VhZ2UvZnVuY3Rpb25zL21hdGgvbWFwL1xuICAgICAgZnVuY3Rpb24gZm1hcCAoeCxpbl9taW4saW5fbWF4LG91dF9taW4sb3V0X21heCl7XG4gICAgICAgIHJldHVybiAoeCAtIGluX21pbikgKiAob3V0X21heCAtIG91dF9taW4pIC8gKGluX21heCAtIGluX21pbikgKyBvdXRfbWluO1xuICAgICAgfVxuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZSA9PSAnVGhlcm1pc3Rvcicpe1xuICAgICAgICBjb25zdCBUSEVSTUlTVE9STk9NSU5BTCA9IDEwMDAwO1xuICAgICAgICAvLyB0ZW1wLiBmb3Igbm9taW5hbCByZXNpc3RhbmNlIChhbG1vc3QgYWx3YXlzIDI1IEMpXG4gICAgICAgIGNvbnN0IFRFTVBFUkFUVVJFTk9NSU5BTCA9IDI1O1xuICAgICAgICAvLyBob3cgbWFueSBzYW1wbGVzIHRvIHRha2UgYW5kIGF2ZXJhZ2UsIG1vcmUgdGFrZXMgbG9uZ2VyXG4gICAgICAgIC8vIGJ1dCBpcyBtb3JlICdzbW9vdGgnXG4gICAgICAgIGNvbnN0IE5VTVNBTVBMRVMgPSA1O1xuICAgICAgICAvLyBUaGUgYmV0YSBjb2VmZmljaWVudCBvZiB0aGUgdGhlcm1pc3RvciAodXN1YWxseSAzMDAwLTQwMDApXG4gICAgICAgIGNvbnN0IEJDT0VGRklDSUVOVCA9IDM5NTA7XG4gICAgICAgIC8vIHRoZSB2YWx1ZSBvZiB0aGUgJ290aGVyJyByZXNpc3RvclxuICAgICAgICBjb25zdCBTRVJJRVNSRVNJU1RPUiA9IDEwMDAwO1xuICAgICAgIC8vIGNvbnZlcnQgdGhlIHZhbHVlIHRvIHJlc2lzdGFuY2VcbiAgICAgICBhdmVyYWdlID0gMTAyMyAvIGF2ZXJhZ2UgLSAxO1xuICAgICAgIGF2ZXJhZ2UgPSBTRVJJRVNSRVNJU1RPUiAvIGF2ZXJhZ2U7XG5cbiAgICAgICB2YXIgc3RlaW5oYXJ0ID0gYXZlcmFnZSAvIFRIRVJNSVNUT1JOT01JTkFMOyAgICAgLy8gKFIvUm8pXG4gICAgICAgc3RlaW5oYXJ0ID0gTWF0aC5sb2coc3RlaW5oYXJ0KTsgICAgICAgICAgICAgICAgICAvLyBsbihSL1JvKVxuICAgICAgIHN0ZWluaGFydCAvPSBCQ09FRkZJQ0lFTlQ7ICAgICAgICAgICAgICAgICAgIC8vIDEvQiAqIGxuKFIvUm8pXG4gICAgICAgc3RlaW5oYXJ0ICs9IDEuMCAvIChURU1QRVJBVFVSRU5PTUlOQUwgKyAyNzMuMTUpOyAvLyArICgxL1RvKVxuICAgICAgIHN0ZWluaGFydCA9IDEuMCAvIHN0ZWluaGFydDsgICAgICAgICAgICAgICAgIC8vIEludmVydFxuICAgICAgIHN0ZWluaGFydCAtPSAyNzMuMTU7XG4gICAgICAgcmV0dXJuIHN0ZWluaGFydDtcbiAgICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyl7XG4gICAgICAgaWYgKHJhdz40MDkpe1xuICAgICAgICByZXR1cm4gKDE1MCpmbWFwKHJhdyw0MTAsMTAyMywwLDYxNCkpLzYxNDtcbiAgICAgICB9XG4gICAgIH1cbiAgICAgIHJldHVybiAnTi9BJztcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKCAhIXNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWBcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKGluZmx1eGRiKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4ZGIgJiYgaW5mbHV4ZGIudXJsKXtcbiAgICAgICAgICAgIGluZmx1eENvbm5lY3Rpb24gPSBgJHtpbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICAgIGlmKCAhIWluZmx1eGRiLnBvcnQgKVxuICAgICAgICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtpbmZsdXhkYi5wb3J0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufWAsIG1ldGhvZDogJ0dFVCd9O1xuICAgICAgICAgIGlmKGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpe1xuICAgICAgICAgICAgcmVxdWVzdC51cmwgPSBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYDtcbiAgICAgICAgICAgIGlmKGluZmx1eGRiICYmIGluZmx1eGRiLnVzZXIgJiYgaW5mbHV4ZGIucGFzcyl7XG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycyA9IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYShpbmZsdXhkYi51c2VyKyc6JytpbmZsdXhkYi5wYXNzKX07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCYXNpYyAnK2J0b2Eoc2V0dGluZ3MuaW5mbHV4ZGIudXNlcisnOicrc2V0dGluZ3MuaW5mbHV4ZGIucGFzcyl9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgaWYoaW5mbHV4Q29ubmVjdGlvbi5pbmRleE9mKCdzdHJlYW1zLmJyZXdiZW5jaC5jbycpICE9PSAtMSl7XG4gICAgICAgICAgICBxLnJlc29sdmUoW3NldHRpbmdzLmluZmx1eGRiLnVzZXJdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgIGlmKGluZmx1eENvbm5lY3Rpb24uaW5kZXhPZignc3RyZWFtcy5icmV3YmVuY2guY28nKSAhPT0gLTEpe1xuICAgICAgICAgICAgcS5yZWplY3QoJ0RhdGFiYXNlIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICBlbmFibGU6ICEhb3B0aW9ucy5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHRleHQ6ICEhb3B0aW9ucy5zZXNzaW9uID8gb3B0aW9ucy5zZXNzaW9uIDogJydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIE1vbml0b3InLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZTogJ2Jhc2lzJyxcbiAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAga2V5OiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaXNBcmVhOiBmdW5jdGlvbiAoZCkgeyByZXR1cm4gISFvcHRpb25zLmNoYXJ0LmFyZWEgfSxcbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCEhb3B0aW9ucy5jaGFydC5taWxpdGFyeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUg6JU06JVMnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJXAnKShuZXcgRGF0ZShkKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghb3B0aW9ucy51bml0IHx8IG9wdGlvbnMudW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoZCwwKSsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgdmFyIHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgdmFyIHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICB2YXIgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIHZhciBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICB2YXIgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgdmFyIG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgdmFyIHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICB2YXIgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9