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
  $scope.hops;
  $scope.grains;
  $scope.water;
  $scope.lovibond;
  $scope.pkg;
  $scope.kettleTypes = BrewService.kettleTypes();
  $scope.chartOptions = BrewService.chartOptions();
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
        digital: 13
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
                  var sysinfo = JSON.parse(info.responseData).system.get_sysinfo;
                  plug.info = sysinfo;
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
      if (device.info.relay_state == 1) {
        BrewService.tplink().off(device).then(function (response) {
          device.info.relay_state = 0;
          return response;
        });
      } else {
        BrewService.tplink().on(device).then(function (response) {
          device.info.relay_state = 1;
          return response;
        });
      }
    }
  };

  $scope.addKettle = function (type) {
    if (!$scope.kettles) $scope.kettles = [];
    $scope.kettles.push({
      name: type ? _.find($scope.kettleTypes, { type: type }).name : $scope.kettleTypes[0].name,
      type: type || $scope.kettleTypes[0].type,
      active: false,
      sticky: false,
      heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff, raw: 0 },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : null,
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
    }).catch(function (err) {
      $scope.share_status = err;
      $scope.share_success = false;
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
      BrewService.influxdb().ping().then(function (response) {
        if (response.status == 204) {
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
        if (err.status == 401 || err.status == 403) {
          $('#influxdbUser').addClass('is-invalid');
          $('#influxdbPass').addClass('is-invalid');
          $scope.setErrorMessage("Enter your Username and Password for InfluxDB");
        } else {
          $scope.setErrorMessage("Opps, there was a problem creating the database.");
        }
      });
    }
  };

  $scope.streams = {
    remove: function remove() {
      var defaultSettings = BrewService.reset();
      $scope.settings.streams = defaultSettings.streams;
    },
    connect: function connect() {
      if (!$scope.settings.streams.username || !$scope.settings.streams.api_key) return;
      $scope.settings.streams.status = 'Connecting';
      BrewService.streams().ping().then(function (response) {
        $scope.settings.streams.status = 'Connected';
      }).catch(function (err) {
        $scope.settings.streams.status = 'Failed to Connect';
      });
    },
    kettles: function kettles(kettle, relay) {
      if (relay) {
        kettle[relay].sketch = !kettle[relay].sketch;
        if (!kettle.notify.streams) return;
      } else {
        kettle.notify.streams = !kettle.notify.streams;
      }
      BrewService.streams().kettles.save(kettle).then(function (response) {
        kettle.message.type = 'success';
        if (kettle.notify.streams) {
          kettle.message.location = 'sketches';
          kettle.message.message = $sce.trustAsHtml('Added to Streams');
        } else {
          kettle.message.location = 'sketches';
          kettle.message.message = $sce.trustAsHtml('Removed from Streams');
        }
      }).catch(function (err) {
        kettle.notify.streams = !kettle.notify.streams;
        if (err && err.data && err.data.error && err.data.error.message) $scope.setErrorMessage(err.data.error.message, kettle, 'sketches');else $scope.setErrorMessage(err, kettle, 'sketches');
      });
    },
    enabled: function enabled(kettle) {
      return !!$scope.settings.streams.api_key && $scope.settings.streams.status == 'Connected' && !!$scope.settings.streams.session.name && !!kettle.valus.length;
    }
  };

  $scope.shareAccess = function (access) {
    if ($scope.settings.shared) {
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
    $scope.settings.shared = true;
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
        $scope.settings.sketch_version = response.sketch_version;
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
    $scope.showSettings = !$scope.settings.shared;
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
    if (!!$scope.settings.shared) {
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
        message = 'Sketch Version is out of date.  <a href="" data-toggle="modal" data-target="#settingsModal">Download here</a>.' + '<br/>Your Version: ' + err.version + '<br/>Current Version: ' + $scope.settings.sketch_version;
      } else {
        message = JSON.stringify(err);
        if (message == '{}') message = '';
      }

      if (!!message) {
        if (kettle) {
          kettle.message.type = 'danger';
          kettle.message.count = 0;
          kettle.message.message = $sce.trustAsHtml('Connection error: ' + message);
          kettle.message.location = location;
          $scope.updateKnobCopy(kettle);
        } else {
          $scope.error.message = $sce.trustAsHtml('Error: ' + message);
        }
      } else if (kettle) {
        kettle.message.count = 0;
        kettle.message.message = 'Error connecting to ' + BrewService.domain(kettle.arduino);
      } else {
        $scope.error.message = $sce.trustAsHtml('Connection error:');
      }
    }
  };

  $scope.resetError = function (kettle) {
    if (kettle) {
      kettle.message.count = 0;
      kettle.message.message = $sce.trustAsHtml('');
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

    var temps = [];
    //chart date
    var date = new Date();
    //update datatype
    response.temp = parseFloat(response.temp);
    response.raw = parseFloat(response.raw);
    // temp response is in C
    kettle.temp.previous = $scope.settings.unit == 'F' ? $filter('toFahrenheit')(response.temp) : $filter('round')(response.temp, 2);
    // add adjustment
    kettle.temp.current = parseFloat(kettle.temp.previous) + parseFloat(kettle.temp.adjust);
    // set raw
    kettle.temp.raw = response.raw;
    //reset all kettles every resetChart
    if (kettle.values.length > resetChart) {
      $scope.kettles.map(function (k) {
        return k.values = [];
      });
    }

    //DHT sensors have humidity
    if (response.humidity) {
      kettle.humidity = response.humidity;
    }

    kettle.values.push([date.getTime(), kettle.temp.current]);

    $scope.updateKnobCopy(kettle);

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

  $scope.ignoreVersionError = function (kettle) {
    $scope.settings.sketches.ignore_version_error = true;
    $scope.resetError(kettle);
  };

  $scope.arduinoList = function () {
    var list = [];
    _.each($scope.kettles, function (kettle, i) {
      list.push(kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, ""));
    });
    return list;
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
      var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      kettle.temp.adjust = parseFloat(kettle.temp.adjust);
      var adjust = $scope.settings.unit == 'F' && !!kettle.temp.adjust ? $filter('round')(kettle.temp.adjust * 0.555, 3) : kettle.temp.adjust;
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
      if (kettle.notify.dweet) {
        currentSketch.triggers = true;
        currentSketch.actions.push('dweetAutoCommand(F("' + kettle.name.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + $scope.settings.recipe.brewer.name + '"),F("' + $scope.settings.recipe.name + '"),temp);');
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
    var autogen = '/* Sketch Auto Generated from http://monitor.brewbench.co on ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + '*/\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = autogen + response.data.replace('// [actions]', actions.length ? actions.join('\n') : '').replace('// [headers]', headers.length ? headers.join('\n') : '').replace('[TPLINK_CONNECTION]', tplink_connection_string).replace('[SLACK_CONNECTION]', $scope.settings.notifications.slack).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
      if (sketch.indexOf('Streams') !== -1) {
        // streams connection
        var connection_string = 'https://' + $scope.settings.streams.username + '.streams.brewbench.co';
        response.data = response.data.replace(/\[PROXY_CONNECTION\]/g, connection_string);
        response.data = response.data.replace(/\[PROXY_AUTH\]/g, 'Authorization: Basic ' + btoa($scope.settings.streams.username + ':' + $scope.settings.streams.api_key));
      }if (sketch.indexOf('InfluxDB') !== -1) {
        // influx db connection
        var connection_string = '' + $scope.settings.influxdb.url;
        if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
        connection_string += '/write?';
        // add user/pass
        if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
        // add db
        connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));
        response.data = response.data.replace('[PROXY_CONNECTION]', connection_string);
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
      //close the previous notification
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
    if ($scope.settings.shared) return;
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
  };

  $scope.changeUnits = function (unit) {
    if ($scope.settings.unit != unit) {
      $scope.settings.unit = unit;
      _.each($scope.kettles, function (kettle) {
        kettle.temp.target = parseFloat(kettle.temp.target);
        kettle.temp.current = parseFloat(kettle.temp.current);
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current, unit);
        kettle.temp.previous = $filter('formatDegrees')(kettle.temp.previous, unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target, unit);
        kettle.temp.target = $filter('round')(kettle.temp.target, 0);
        if (!!kettle.temp.adjust) {
          kettle.temp.adjust = parseFloat(kettle.temp.adjust);
          if (unit === 'C') kettle.temp.adjust = $filter('round')(kettle.temp.adjust * 0.555, 3);else kettle.temp.adjust = $filter('round')(kettle.temp.adjust * 1.8, 0);
        }
        // update knob
        kettle.knob.value = kettle.temp.current;
        kettle.knob.max = kettle.temp.target + kettle.temp.diff + 10;
        $scope.updateKnobCopy(kettle);
      });
      $scope.chartOptions = BrewService.chartOptions(unit);
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

  $scope.changeValue = function (kettle, field, up) {

    if (timeout) $timeout.cancel(timeout);

    if (up) kettle.temp[field]++;else kettle.temp[field]--;

    if (field == 'adjust') {
      kettle.temp.current = parseFloat(kettle.temp.previous) + parseFloat(kettle.temp.adjust);
    }

    //update knob after 1 seconds, otherwise we get a lot of refresh on the knob when clicking plus or minus
    timeout = $timeout(function () {
      //update max
      kettle.knob.max = kettle.temp['target'] + kettle.temp['diff'] + 10;
      $scope.updateKnobCopy(kettle);
    }, 1000);
  };

  $scope.loadConfig() // load config
  .then($scope.init) // init
  .then(function (loaded) {
    if (!!loaded) $scope.processTemps(); // start polling
  });
  // scope watch
  $scope.$watch('settings', function (newValue, oldValue) {
    BrewService.settings('settings', newValue);
  }, true);

  $scope.$watch('kettles', function (newValue, oldValue) {
    BrewService.settings('kettles', newValue);
  }, true);

  $scope.$watch('share', function (newValue, oldValue) {
    BrewService.settings('share', newValue);
  }, true);
});

$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
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
    if (format) return moment(date.toString()).format(format);else return moment(date.toString()).fromNow();
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

    accessToken: 'v0jybQms9kXNvVf6OEthPXXYSlQOjzyo1jIgW8MI8dNLjG4Pl0WmvMhEAhd0zZgo',

    //cookies size 4096 bytes
    clear: function clear() {
      if (window.localStorage) {
        window.localStorage.removeItem('settings');
        window.localStorage.removeItem('kettles');
        window.localStorage.removeItem('share');
      }
    },

    reset: function reset() {
      var defaultSettings = {
        debug: false,
        pollSeconds: 10,
        unit: 'F',
        layout: 'card',
        chart: true,
        shared: false,
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        arduinos: [{
          id: btoa('brewbench'),
          url: 'arduino.local',
          analog: 5,
          digital: 13,
          secure: false
        }],
        tplink: { user: '', pass: '', token: '', status: '', plugs: [] },
        sketches: { frequency: 60, version: 0, ignore_version_error: false },
        influxdb: { url: '', port: 8086, user: '', pass: '', db: '', dbs: [], status: '' },
        streams: { username: '', api_key: '', accessToken: null, status: '', session: { id: '', name: '', type: 'fermentation' } }
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
        type: 'water',
        active: false,
        sticky: false,
        heater: { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D3', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 170, diff: 2, raw: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false, streams: false }
      }, {
        name: 'Mash',
        type: 'grain',
        active: false,
        sticky: false,
        heater: { pin: 'D4', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D5', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A1', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 152, diff: 2, raw: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 },
        message: { type: 'error', message: '', version: '', count: 0, location: '' },
        notify: { slack: false, dweet: false, streams: false }
      }, {
        name: 'Boil',
        type: 'hop',
        active: false,
        sticky: false,
        heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A2', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 200, diff: 2, raw: 0 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 },
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
      var _this = this;

      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/' + kettle.temp.type + '/' + kettle.temp.pin;
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
      }

      $http(request).then(function (response) {
        if (!settings.shared && !settings.sketches.ignore_version_error && (response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') < settings.sketch_version)) {
          q.reject({ version: response.headers('X-Sketch-Version') });
        } else {
          if (settings.sketches.version != response.headers('X-Sketch-Version')) {
            settings.sketches.version = response.headers('X-Sketch-Version');
            _this.settings('settings', settings);
          }
          q.resolve(response.data);
        }
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },
    // read/write heater
    // http://arduinotronics.blogspot.com/2013/01/working-with-sainsmart-5v-relay-board.html
    // http://myhowtosandprojects.blogspot.com/2014/02/sainsmart-2-channel-5v-relay-arduino.html
    digital: function digital(kettle, sensor, value) {
      var _this2 = this;

      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/digital/' + sensor + '/' + value;
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
      }

      $http(request).then(function (response) {
        if (!settings.shared && !settings.sketches.ignore_version_error && (response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') < settings.sketch_version)) {
          q.reject({ version: response.headers('X-Sketch-Version') });
        } else {
          if (settings.sketches.version != response.headers('X-Sketch-Version')) {
            settings.sketches.version = response.headers('X-Sketch-Version');
            _this2.settings('settings', settings);
          }
          q.resolve(response.data);
        }
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    analog: function analog(kettle, sensor, value) {
      var _this3 = this;

      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/analog/' + sensor + '/' + value;
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
      }

      $http(request).then(function (response) {
        if (!settings.shared && !settings.sketches.ignore_version_error && (response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') < settings.sketch_version)) {
          q.reject({ version: response.headers('X-Sketch-Version') });
        } else {
          if (settings.sketches.version != response.headers('X-Sketch-Version')) {
            settings.sketches.version = response.headers('X-Sketch-Version');
            _this3.settings('settings', settings);
          }
          q.resolve(response.data);
        }
      }).catch(function (err) {
        q.reject(err);
      });
      return q.promise;
    },

    digitalRead: function digitalRead(kettle, sensor, timeout) {
      var _this4 = this;

      if (!kettle.arduino) return $q.reject('Select an arduino to use.');
      var q = $q.defer();
      var url = this.domain(kettle.arduino) + '/arduino/digital/' + sensor;
      var settings = this.settings('settings');
      var request = { url: url, method: 'GET', timeout: settings.pollSeconds * 10000 };

      if (kettle.arduino.password) {
        request.withCredentials = true;
        request.headers = { 'Authorization': 'Basic ' + btoa('root:' + kettle.arduino.password) };
      }

      $http(request).then(function (response) {
        if (!settings.shared && !settings.sketches.ignore_version_error && (response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') < settings.sketch_version)) {
          q.reject({ version: response.headers('X-Sketch-Version') });
        } else {
          if (settings.sketches.version != response.headers('X-Sketch-Version')) {
            settings.sketches.version = response.headers('X-Sketch-Version');
            _this4.settings('settings', settings);
          }
          q.resolve(response.data);
        }
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
      delete settings.notifications;
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
      var _this5 = this;

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
          var settings = _this5.settings('settings');
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
          var settings = _this5.settings('settings');
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
          var settings = _this5.settings('settings');
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
        on: function on(device) {
          var command = { "system": { "set_relay_state": { "state": 1 } } };
          return _this5.tplink().command(device, command);
        },
        off: function off(device) {
          var command = { "system": { "set_relay_state": { "state": 0 } } };
          return _this5.tplink().command(device, command);
        },
        info: function info(device) {
          var command = { "system": { "get_sysinfo": null }, "emeter": { "get_realtime": null } };
          return _this5.tplink().command(device, command);
        }
      };
    },

    streams: function streams() {
      var _this6 = this;

      var settings = this.settings('settings');
      var url = 'https://' + settings.streams.username + '.streams.brewbench.co';
      var request = { url: url, headers: {}, timeout: settings.pollSeconds * 10000 };

      return {
        auth: async function auth() {
          var q = $q.defer();
          if (settings.streams.api_key) {
            request.url = 'http://localhost:3001/api/users/auth';
            request.method = 'POST';
            request.headers['Content-Type'] = 'application/json';
            request.headers['X-API-Key'] = '' + settings.streams.api_key;
            request.headers['X-BB-User'] = '' + settings.streams.username;
            $http(request).then(function (response) {
              if (response && response.data && response.data.accessToken) _this6.accessToken = response.data.accessToken;
              q.resolve(response);
            }).catch(function (err) {
              q.reject(err);
            });
          } else {
            q.reject(false);
          }
          return q.promise;
        },
        ping: function ping() {
          var q = $q.defer();
          if (settings.streams.api_key) {
            request.withCredentials = true;
            request.headers['Authorization'] = 'Basic ' + btoa(settings.streams.username + ':' + settings.streams.api_key);
          }
          request.url += '/ping';
          request.method = 'GET';
          $http(request).then(function (response) {
            q.resolve(response);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        kettles: {
          save: async function save(kettle) {
            var q = $q.defer();
            if (!_this6.accessToken) {
              var auth = await _this6.streams().auth();
              if (!_this6.accessToken) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url = 'http://localhost:3001/api/kettles/arm';
            request.method = 'POST';
            request.data = {
              session: settings.streams.session,
              kettle: kettle,
              notifications: settings.notifications
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this6.accessToken;
            $http(request).then(function (response) {
              q.resolve(response);
            }).catch(function (err) {
              q.reject(err);
            });
            return q.promise;
          }
        },
        sessions: {
          get: async function get() {
            var q = $q.defer();
            if (!_this6.accessToken) {
              var auth = await _this6.streams().auth();
              if (!_this6.accessToken) {
                q.reject('Sorry Bad Authentication');
                return q.promise;
              }
            }
            request.url = 'http://localhost:3001/api/sessions';
            request.method = 'POST';
            request.data = {
              sessionId: sessionId,
              kettle: kettle
            };
            request.headers['Content-Type'] = 'application/json';
            request.headers['Authorization'] = _this6.accessToken;
            $http(request).then(function (response) {
              q.resolve(response);
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
        ping: function ping() {
          $http({ url: influxConnection + '/ping', method: 'GET' }).then(function (response) {
            q.resolve(response);
          }).catch(function (err) {
            q.reject(err);
          });
          return q.promise;
        },
        dbs: function dbs() {
          $http({ url: influxConnection + '/query?u=' + settings.influxdb.user + '&p=' + settings.influxdb.pass + '&q=' + encodeURIComponent('show databases'), method: 'GET' }).then(function (response) {
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
          $http({ url: influxConnection + '/query?u=' + settings.influxdb.user + '&p=' + settings.influxdb.pass + '&q=' + encodeURIComponent('CREATE DATABASE "' + name + '"'), method: 'POST' }).then(function (response) {
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

    chartOptions: function chartOptions(unit) {
      return {
        chart: {
          type: 'lineChart',
          noData: 'BrewBench Live',
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

          xAxis: {
            axisLabel: 'Time',
            tickFormat: function tickFormat(d) {
              return d3.time.format('%I:%M:%S')(new Date(d));
            },
            orient: 'bottom',
            tickPadding: 20,
            axisLabelDistance: 40,
            staggerLabels: true
          },
          forceY: !unit || unit == 'F' ? [0, 220] : [-17, 104],
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNob3dTZXR0aW5ncyIsImVycm9yIiwibWVzc2FnZSIsInR5cGUiLCJzbGlkZXIiLCJtaW4iLCJvcHRpb25zIiwiZmxvb3IiLCJjZWlsIiwic3RlcCIsInRyYW5zbGF0ZSIsInZhbHVlIiwib25FbmQiLCJrZXR0bGVJZCIsIm1vZGVsVmFsdWUiLCJoaWdoVmFsdWUiLCJwb2ludGVyVHlwZSIsImtldHRsZSIsInNwbGl0IiwiayIsImtldHRsZXMiLCJoZWF0ZXIiLCJjb29sZXIiLCJwdW1wIiwiYWN0aXZlIiwicHdtIiwicnVubmluZyIsInRvZ2dsZVJlbGF5IiwiZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyIsImluZGV4IiwiT2JqZWN0IiwiYXNzaWduIiwiaWQiLCJnZXRMb3ZpYm9uZENvbG9yIiwicmFuZ2UiLCJyZXBsYWNlIiwiaW5kZXhPZiIsInJBcnIiLCJwYXJzZUZsb2F0IiwibCIsIl8iLCJmaWx0ZXIiLCJpdGVtIiwic3JtIiwiaGV4IiwibGVuZ3RoIiwic2V0dGluZ3MiLCJyZXNldCIsImRlZmF1bHRLZXR0bGVzIiwic2hhcmUiLCJwYXJhbXMiLCJmaWxlIiwicGFzc3dvcmQiLCJuZWVkUGFzc3dvcmQiLCJhY2Nlc3MiLCJkZWxldGVBZnRlciIsInN1bVZhbHVlcyIsIm9iaiIsInN1bUJ5IiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFN0YXR1c0NsYXNzIiwic3RhdHVzIiwiZW5kc1dpdGgiLCJnZXRQb3J0UmFuZ2UiLCJudW1iZXIiLCJBcnJheSIsImZpbGwiLCJtYXAiLCJpZHgiLCJhcmR1aW5vcyIsImFkZCIsIm5vdyIsIkRhdGUiLCJwdXNoIiwiYnRvYSIsImFuYWxvZyIsImRpZ2l0YWwiLCJlYWNoIiwiYXJkdWlubyIsInVwZGF0ZSIsImRlbGV0ZSIsInNwbGljZSIsInRwbGluayIsImxvZ2luIiwidXNlciIsInBhc3MiLCJ0aGVuIiwicmVzcG9uc2UiLCJ0b2tlbiIsInNjYW4iLCJjYXRjaCIsInNldEVycm9yTWVzc2FnZSIsImVyciIsIm1zZyIsInBsdWdzIiwiZGV2aWNlTGlzdCIsInBsdWciLCJpbmZvIiwicmVzcG9uc2VEYXRhIiwic3lzaW5mbyIsIkpTT04iLCJwYXJzZSIsInN5c3RlbSIsImdldF9zeXNpbmZvIiwiZGV2aWNlIiwidG9nZ2xlIiwicmVsYXlfc3RhdGUiLCJvZmYiLCJvbiIsImFkZEtldHRsZSIsImZpbmQiLCJzdGlja3kiLCJwaW4iLCJhdXRvIiwiZHV0eUN5Y2xlIiwic2tldGNoIiwidGVtcCIsImhpdCIsInByZXZpb3VzIiwiYWRqdXN0IiwiZGlmZiIsInJhdyIsInZhbHVlcyIsInRpbWVycyIsImtub2IiLCJjb3B5IiwiZGVmYXVsdEtub2JPcHRpb25zIiwibWF4IiwidmVyc2lvbiIsImNvdW50Iiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsInN0cmVhbXMiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwicGluRGlzcGxheSIsImRldmljZUlkIiwic3Vic3RyIiwiYWxpYXMiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwiZW1haWwiLCJzaGFyZV9zdGF0dXMiLCJzaGFyZV9zdWNjZXNzIiwic2hhcmVfbGluayIsInNoYXJlVGVzdCIsInRlc3RpbmciLCJodHRwX2NvZGUiLCJwdWJsaWMiLCJpbmZsdXhkYiIsInJlbW92ZSIsImRlZmF1bHRTZXR0aW5ncyIsImNvbm5lY3QiLCJwaW5nIiwiJCIsInJlbW92ZUNsYXNzIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJkYiIsImFkZENsYXNzIiwiY3JlYXRlIiwibW9tZW50IiwiZm9ybWF0IiwiY3JlYXRlZCIsImNyZWF0ZURCIiwiZGF0YSIsInJlc3VsdHMiLCJyZXNldEVycm9yIiwidXNlcm5hbWUiLCJhcGlfa2V5IiwicmVsYXkiLCJzYXZlIiwidHJ1c3RBc0h0bWwiLCJlbmFibGVkIiwic2Vzc2lvbiIsInZhbHVzIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwidGV4dCIsImNvbG9yIiwiZm9udCIsInByb2Nlc3NUZW1wcyIsImltcG9ydFJlY2lwZSIsIiRmaWxlQ29udGVudCIsIiRleHQiLCJmb3JtYXR0ZWRfY29udGVudCIsImZvcm1hdFhNTCIsImpzb25PYmoiLCJ4MmpzIiwiWDJKUyIsInhtbF9zdHIyanNvbiIsInJlY2lwZV9zdWNjZXNzIiwiUmVjaXBlcyIsIkRhdGEiLCJSZWNpcGUiLCJTZWxlY3Rpb25zIiwicmVjaXBlQmVlclNtaXRoIiwiUkVDSVBFUyIsIlJFQ0lQRSIsInJlY2lwZUJlZXJYTUwiLCJjYXRlZ29yeSIsImlidSIsImRhdGUiLCJncmFpbiIsImxhYmVsIiwiYW1vdW50IiwiYWRkVGltZXIiLCJub3RlcyIsImhvcCIsIm1pc2MiLCJ5ZWFzdCIsImxvYWRTdHlsZXMiLCJzdHlsZXMiLCJsb2FkQ29uZmlnIiwic2tldGNoX3ZlcnNpb24iLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5Iiwia2V5cyIsInN0YXR1c1RleHQiLCJzdHJpbmdpZnkiLCJkb21haW4iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJ1bml0IiwiaHVtaWRpdHkiLCJnZXRUaW1lIiwiZ2V0TmF2T2Zmc2V0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGFzU2tldGNoZXMiLCJoYXNBU2tldGNoIiwic3RhcnRTdG9wS2V0dGxlIiwiTWF0aCIsInJvdW5kIiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImlnbm9yZVZlcnNpb25FcnJvciIsInNrZXRjaGVzIiwiaWdub3JlX3ZlcnNpb25fZXJyb3IiLCJhcmR1aW5vTGlzdCIsImxpc3QiLCJjb21waWxlU2tldGNoIiwic2tldGNoTmFtZSIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImFjdGlvbnMiLCJ0cmlnZ2VycyIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRTa2V0Y2giLCJoYXNUcmlnZ2VycyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJhdXRvZ2VuIiwiZ2V0Iiwiam9pbiIsImZyZXF1ZW5jeSIsInBhcnNlSW50IiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsImNsaWNrIiwiZ2V0SVBBZGRyZXNzIiwiaXBBZGRyZXNzIiwiaXAiLCJpY29uIiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwiYWxlcnQiLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwiYm9keSIsInJlcXVlc3RQZXJtaXNzaW9uIiwidHJhY2tDb2xvciIsImJhckNvbG9yIiwiY2hhbmdlS2V0dGxlVHlwZSIsImtldHRsZUluZGV4IiwiZmluZEluZGV4Iiwia2V0dGxlVHlwZSIsImNoYW5nZVVuaXRzIiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCIkd2F0Y2giLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwicmVhZHkiLCJ0b29sdGlwIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwidHJpbSIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwic3JjRWxlbWVudCIsImZpbGVzIiwiZXh0ZW5zaW9uIiwicG9wIiwidG9Mb3dlckNhc2UiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJ0b1N0cmluZyIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsImRlY2ltYWxzIiwiTnVtYmVyIiwicGhyYXNlIiwiUmVnRXhwIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsImZhY3RvcnkiLCJhY2Nlc3NUb2tlbiIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJkZWJ1ZyIsImxheW91dCIsImNoYXJ0Iiwic2VjdXJlIiwicmVhZE9ubHkiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsImtleSIsInNldEl0ZW0iLCJnZXRJdGVtIiwic2Vuc29yVHlwZXMiLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwicmVxdWVzdCIsIndpdGhDcmVkZW50aWFscyIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImxhdGVzdCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiYXV0aCIsInNlc3Npb25zIiwic2Vzc2lvbklkIiwiYml0Y2FsYyIsImF2ZXJhZ2UiLCJmbWFwIiwieCIsImluX21pbiIsImluX21heCIsIm91dF9taW4iLCJvdXRfbWF4IiwiVEhFUk1JU1RPUk5PTUlOQUwiLCJURU1QRVJBVFVSRU5PTUlOQUwiLCJOVU1TQU1QTEVTIiwiQkNPRUZGSUNJRU5UIiwiU0VSSUVTUkVTSVNUT1IiLCJzdGVpbmhhcnQiLCJsb2ciLCJpbmZsdXhDb25uZWN0aW9uIiwic2VyaWVzIiwibm9EYXRhIiwiaGVpZ2h0IiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsIkZfU19NSU5fSUJVIiwiSW5ncmVkaWVudHMiLCJHcmFpbiIsIkZfR19OQU1FIiwiRl9HX0JPSUxfVElNRSIsIkZfR19BTU9VTlQiLCJIb3BzIiwiRl9IX05BTUUiLCJGX0hfRFJZX0hPUF9USU1FIiwiRl9IX0JPSUxfVElNRSIsIkZfSF9BTU9VTlQiLCJNaXNjIiwiRl9NX05BTUUiLCJGX01fVElNRSIsIkZfTV9BTU9VTlQiLCJZZWFzdCIsIkZfWV9MQUIiLCJGX1lfUFJPRFVDVF9JRCIsIkZfWV9OQU1FIiwibWFzaF90aW1lIiwiTkFNRSIsIlNUWUxFIiwiQ0FURUdPUlkiLCJCUkVXRVIiLCJPRyIsIkZHIiwiSUJVIiwiQUJWX01BWCIsIkFCVl9NSU4iLCJNQVNIIiwiTUFTSF9TVEVQUyIsIk1BU0hfU1RFUCIsIlNURVBfVElNRSIsIkZFUk1FTlRBQkxFUyIsIkZFUk1FTlRBQkxFIiwiQU1PVU5UIiwiSE9QUyIsIkhPUCIsIkZPUk0iLCJVU0UiLCJUSU1FIiwiTUlTQ1MiLCJNSVNDIiwiWUVBU1RTIiwiWUVBU1QiLCJjb250ZW50IiwiaHRtbGNoYXJzIiwiZiIsInIiLCJjaGFyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUEsa0JBQVFBLE1BQVIsQ0FBZSxtQkFBZixFQUFvQyxDQUNsQyxXQURrQyxFQUVqQyxNQUZpQyxFQUdqQyxTQUhpQyxFQUlqQyxVQUppQyxFQUtqQyxTQUxpQyxFQU1qQyxVQU5pQyxDQUFwQyxFQVFDQyxNQVJELENBUVEsVUFBU0MsY0FBVCxFQUF5QkMsa0JBQXpCLEVBQTZDQyxhQUE3QyxFQUE0REMsaUJBQTVELEVBQStFQyxnQkFBL0UsRUFBaUc7O0FBRXZHRixnQkFBY0csUUFBZCxDQUF1QkMsVUFBdkIsR0FBb0MsSUFBcEM7QUFDQUosZ0JBQWNHLFFBQWQsQ0FBdUJFLE9BQXZCLENBQStCQyxNQUEvQixHQUF3QyxnQ0FBeEM7QUFDQSxTQUFPTixjQUFjRyxRQUFkLENBQXVCRSxPQUF2QixDQUErQkMsTUFBL0IsQ0FBc0Msa0JBQXRDLENBQVA7O0FBRUFMLG9CQUFrQk0sVUFBbEIsQ0FBNkIsRUFBN0I7QUFDQUwsbUJBQWlCTSwwQkFBakIsQ0FBNEMsb0VBQTVDOztBQUVBVixpQkFDR1csS0FESCxDQUNTLE1BRFQsRUFDaUI7QUFDYkMsU0FBSyxFQURRO0FBRWJDLGlCQUFhLG9CQUZBO0FBR2JDLGdCQUFZO0FBSEMsR0FEakIsRUFNR0gsS0FOSCxDQU1TLE9BTlQsRUFNa0I7QUFDZEMsU0FBSyxXQURTO0FBRWRDLGlCQUFhLG9CQUZDO0FBR2RDLGdCQUFZO0FBSEUsR0FObEIsRUFXR0gsS0FYSCxDQVdTLE9BWFQsRUFXa0I7QUFDZEMsU0FBSyxRQURTO0FBRWRDLGlCQUFhLG9CQUZDO0FBR2RDLGdCQUFZO0FB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QUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFJjLEVBdVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlJjLEVBd1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFJjLEVBeVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelJjLEVBMFJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVJjLEVBMlJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1JjLEVBNFJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNVJjLEVBNlJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxH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bEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBOWYsUUFBRW9ELElBQUYsQ0FBT3djLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVEvZixPQUFSLENBQWdCbWdCLEtBQUtGLENBQXJCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7QUFDaENGLG9CQUFVQSxRQUFRaGdCLE9BQVIsQ0FBZ0JpVyxPQUFPbUssS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUFoa0RJLEdBQVA7QUFra0RELENBcmtERCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsXG4gICxyZXNldENoYXJ0ID0gMTAwXG4gICx0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuQnJld1NlcnZpY2UgPSBCcmV3U2VydmljZTtcbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5wa2c7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucygpO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLmdldFN0YXR1c0NsYXNzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgaWYoc3RhdHVzID09ICdDb25uZWN0ZWQnKVxuICAgIHJldHVybiAnc3VjY2Vzcyc7XG4gIGVsc2UgaWYoXy5lbmRzV2l0aChzdGF0dXMsJ2luZycpKVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JztcbiAgZWxzZVxuICAgIHJldHVybiAnZGFuZ2VyJztcbn1cblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxM1xuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5tc2cgfHwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsuc3RhdHVzID0gJ1NjYW5uaW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnNjYW4odG9rZW4pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZihyZXNwb25zZS5kZXZpY2VMaXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoISFwbHVnLnN0YXR1cyl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIHZhciBzeXNpbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gc3lzaW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIGlmKGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEpe1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IDA7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAxO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmYscmF3OjB9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IG51bGxcbiAgICAgICAgLG1lc3NhZ2U6IHt0eXBlOidlcnJvcicsbWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjAsbG9jYXRpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gcGluO1xuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhcmR1aW5vSWQsYW5hbG9nKXtcbiAgICB2YXIga2V0dGxlID0gXy5maW5kKCRzY29wZS5rZXR0bGVzLCBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgKGtldHRsZS5hcmR1aW5vLmlkPT1hcmR1aW5vSWQpICYmXG4gICAgICAgICgoYW5hbG9nICYmIGtldHRsZS50ZW1wLnR5cGU9PSdUaGVybWlzdG9yJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLnRlbXAudHlwZT09J0RTMThCMjAnICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoa2V0dGxlLnRlbXAudHlwZT09J1BUMTAwJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiAha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICkpO1xuICAgIH0pO1xuICAgIHJldHVybiBrZXR0bGUgfHwgZmFsc2U7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZVNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIuZW1haWwpXG4gICAgICByZXR1cm47XG4gICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICdDcmVhdGluZyBzaGFyZSBsaW5rLi4uJztcbiAgICByZXR1cm4gQnJld1NlcnZpY2UuY3JlYXRlU2hhcmUoJHNjb3BlLnNoYXJlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYocmVzcG9uc2Uuc2hhcmUgJiYgcmVzcG9uc2Uuc2hhcmUudXJsKXtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJyc7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9saW5rID0gcmVzcG9uc2Uuc2hhcmUudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbmZsdXhkYiA9IHtcbiAgICByZW1vdmU6ICgpID0+IHtcbiAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiID0gZGVmYXVsdFNldHRpbmdzLmluZmx1eGRiO1xuICAgIH0sXG4gICAgY29ubmVjdDogKCkgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0KXtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0Nvbm5lY3RlZCc7XG4gICAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgIHZhciBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuc3RhdHVzID0gJ0ZhaWxlZCB0byBDb25uZWN0JztcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgaWYoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpe1xuICAgICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN0cmVhbXMgPSB7XG4gICAgcmVtb3ZlOiAoKSA9PiB7XG4gICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zID0gZGVmYXVsdFNldHRpbmdzLnN0cmVhbXM7XG4gICAgfSxcbiAgICBjb25uZWN0OiAoKSA9PiB7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpXG4gICAgICAgIHJldHVybjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0aW5nJztcbiAgICAgIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5waW5nKClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cyA9ICdDb25uZWN0ZWQnO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc3RyZWFtcy5zdGF0dXMgPSAnRmFpbGVkIHRvIENvbm5lY3QnO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBrZXR0bGVzOiAoa2V0dGxlLCByZWxheSkgPT4ge1xuICAgICAgICBpZihyZWxheSl7XG4gICAgICAgICAga2V0dGxlW3JlbGF5XS5za2V0Y2ggPSAha2V0dGxlW3JlbGF5XS5za2V0Y2g7XG4gICAgICAgICAgaWYoIWtldHRsZS5ub3RpZnkuc3RyZWFtcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSAha2V0dGxlLm5vdGlmeS5zdHJlYW1zO1xuICAgICAgICB9XG4gICAgICAgIEJyZXdTZXJ2aWNlLnN0cmVhbXMoKS5rZXR0bGVzLnNhdmUoa2V0dGxlKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnc3VjY2Vzcyc7XG4gICAgICAgICAgICBpZihrZXR0bGUubm90aWZ5LnN0cmVhbXMpe1xuICAgICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9ICdza2V0Y2hlcyc7XG4gICAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdBZGRlZCB0byBTdHJlYW1zJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBrZXR0bGUubWVzc2FnZS5sb2NhdGlvbiA9ICdza2V0Y2hlcyc7XG4gICAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdSZW1vdmVkIGZyb20gU3RyZWFtcycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgPSAha2V0dGxlLm5vdGlmeS5zdHJlYW1zO1xuICAgICAgICAgICAgaWYoZXJyICYmIGVyci5kYXRhICYmIGVyci5kYXRhLmVycm9yICYmIGVyci5kYXRhLmVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLmRhdGEuZXJyb3IubWVzc2FnZSwga2V0dGxlLCAnc2tldGNoZXMnKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSwgJ3NrZXRjaGVzJyk7XG4gICAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgZW5hYmxlZDogKGtldHRsZSkgPT4ge1xuICAgICAgICByZXR1cm4gKCEhJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMuYXBpX2tleSAmJlxuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnN0YXR1cz09J0Nvbm5lY3RlZCcgJiZcbiAgICAgICAgICAhISRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24ubmFtZSAmJlxuICAgICAgICAgICEha2V0dGxlLnZhbHVzLmxlbmd0aCk7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGdyYWluLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoaG9wLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogaG9wLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoaG9wLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTond2F0ZXInfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUubWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBtaXNjLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IG1pc2Mubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUueWVhc3QubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdCA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLnllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogeWVhc3QubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTdHlsZXMgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc3R5bGVzKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnN0eWxlcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkc2NvcGUuc3R5bGVzID0gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjb25maWcgPSBbXTtcbiAgICBpZighJHNjb3BlLnBrZyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5wa2coKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucGtnID0gcmVzcG9uc2U7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2Uuc2tldGNoX3ZlcnNpb247XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuZ3JhaW5zKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJHNjb3BlLnNob3dTZXR0aW5ncyA9ICEkc2NvcGUuc2V0dGluZ3Muc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSwgbG9jYXRpb24pe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUubWVzc2FnZS52ZXJzaW9uID0gZXJyLnZlcnNpb247XG4gICAgICAgIG1lc3NhZ2UgPSAnU2tldGNoIFZlcnNpb24gaXMgb3V0IG9mIGRhdGUuICA8YSBocmVmPVwiXCIgZGF0YS10b2dnbGU9XCJtb2RhbFwiIGRhdGEtdGFyZ2V0PVwiI3NldHRpbmdzTW9kYWxcIj5Eb3dubG9hZCBoZXJlPC9hPi4nK1xuICAgICAgICAgICc8YnIvPllvdXIgVmVyc2lvbjogJytlcnIudmVyc2lvbitcbiAgICAgICAgICAnPGJyLz5DdXJyZW50IFZlcnNpb246ICcrJHNjb3BlLnNldHRpbmdzLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICAgIGtldHRsZS5tZXNzYWdlLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAga2V0dGxlLm1lc3NhZ2UubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5jb3VudD0wO1xuICAgICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ0Nvbm5lY3Rpb24gZXJyb3I6Jyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50PTA7XG4gICAgICBrZXR0bGUubWVzc2FnZS5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UudGVtcCl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgIHZhciB0ZW1wcyA9IFtdO1xuICAgIC8vY2hhcnQgZGF0ZVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvL3VwZGF0ZSBkYXRhdHlwZVxuICAgIHJlc3BvbnNlLnRlbXAgPSBwYXJzZUZsb2F0KHJlc3BvbnNlLnRlbXApO1xuICAgIHJlc3BvbnNlLnJhdyA9IHBhcnNlRmxvYXQocmVzcG9uc2UucmF3KTtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgICRmaWx0ZXIoJ3JvdW5kJykocmVzcG9uc2UudGVtcCwyKTtcbiAgICAvLyBhZGQgYWRqdXN0bWVudFxuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAocGFyc2VGbG9hdChrZXR0bGUudGVtcC5wcmV2aW91cykgKyBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCkpO1xuICAgIC8vIHNldCByYXdcbiAgICBrZXR0bGUudGVtcC5yYXcgPSByZXNwb25zZS5yYXc7XG4gICAgLy9yZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXM9W107XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVCBzZW5zb3JzIGhhdmUgaHVtaWRpdHlcbiAgICBpZiggcmVzcG9uc2UuaHVtaWRpdHkgKXtcbiAgICAgIGtldHRsZS5odW1pZGl0eSA9IHJlc3BvbnNlLmh1bWlkaXR5O1xuICAgIH1cblxuICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnN0cmVhbXMgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5zbGFjayB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApIHtcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuXG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGtldHRsZS5tZXNzYWdlLmNvdW50Kys7XG4gICAgICAgICAgICBpZihrZXR0bGUubWVzc2FnZS5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5pZ25vcmVWZXJzaW9uRXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciA9IHRydWU7XG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub0xpc3QgPSBmdW5jdGlvbigpe1xuICAgIHZhciBsaXN0ID0gW107XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBsaXN0LnB1c2goa2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbGlzdDtcbiAgfTtcblxuICAkc2NvcGUuY29tcGlsZVNrZXRjaCA9IGZ1bmN0aW9uKHNrZXRjaE5hbWUpe1xuICAgIHZhciBza2V0Y2hlcyA9IFtdO1xuICAgIHZhciBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWluby51cmwucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIik7XG4gICAgICB2YXIgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICBoZWFkZXJzOiBbXSxcbiAgICAgICAgICB0cmlnZ2VyczogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5hZGp1c3QpO1xuICAgICAgdmFyIGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnICYmICEha2V0dGxlLnRlbXAuYWRqdXN0KSA/ICRmaWx0ZXIoJ3JvdW5kJykoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1LDMpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgaWYoa2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdESFQnKSAhPT0gLTEgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUTGliLnppcCcpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJykgPT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL2NhY3R1c19pb19EUzE4QjIwLnppcCcpO1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCdhY3Rpb25zQ29tbWFuZChGKFwiJytrZXR0bGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZS50ZW1wLnR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoRihcImhlYXRcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoRihcImNvb2xcIiksRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5ub3RpZnkuZHdlZXQpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2R3ZWV0QXV0b0NvbW1hbmQoRihcIicra2V0dGxlLm5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lKydcIiksRihcIicrJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lKydcIiksdGVtcCk7Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBpZihza2V0Y2gudHJpZ2dlcnMpe1xuICAgICAgICBza2V0Y2guYWN0aW9ucy51bnNoaWZ0KCdmbG9hdCB0ZW1wID0gMC4wMDsnKVxuICAgICAgICAvLyB1cGRhdGUgYXV0b0NvbW1hbmRcbiAgICAgICAgZm9yKHZhciBhID0gMDsgYSA8IHNrZXRjaC5hY3Rpb25zLmxlbmd0aDsgYSsrKXtcbiAgICAgICAgICBpZihza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLmluZGV4T2YoJ2FjdGlvbnNDb21tYW5kKCcpICE9PSAtMSlcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2FjdGlvbnNDb21tYW5kKCcsJ3RlbXAgPSBhY3Rpb25zQ29tbWFuZCgnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC50cmlnZ2Vycywgc2tldGNoLmhlYWRlcnMsICdCcmV3QmVuY2gnK3NrZXRjaE5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRvd25sb2FkU2tldGNoKG5hbWUsIGFjdGlvbnMsIGhhc1RyaWdnZXJzLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIHZhciB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgdmFyIGF1dG9nZW4gPSAnLyogU2tldGNoIEF1dG8gR2VuZXJhdGVkIGZyb20gaHR0cDovL21vbml0b3IuYnJld2JlbmNoLmNvIG9uICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKycqL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbYWN0aW9uc10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2hlYWRlcnNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJ1tUUExJTktfQ09OTkVDVElPTl0nLCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgICAgLnJlcGxhY2UoJ1tTTEFDS19DT05ORUNUSU9OXScsICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKVxuICAgICAgICAgIC5yZXBsYWNlKCdbRlJFUVVFTkNZX1NFQ09ORFNdJywgJHNjb3BlLnNldHRpbmdzLnNrZXRjaGVzLmZyZXF1ZW5jeSA/IHBhcnNlSW50KCRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3ksMTApIDogNjApO1xuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ1N0cmVhbXMnKSAhPT0gLTEpe1xuICAgICAgICAgIC8vIHN0cmVhbXMgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGBodHRwczovLyR7JHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWV9LnN0cmVhbXMuYnJld2JlbmNoLmNvYDtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtQUk9YWV9DT05ORUNUSU9OXFxdL2csIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXFtQUk9YWV9BVVRIXFxdL2csICdBdXRob3JpemF0aW9uOiBCYXNpYyAnK2J0b2EoJHNjb3BlLnNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUrJzonKyRzY29wZS5zZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpKTtcbiAgICAgICAgfSBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICAvLyBpbmZsdXggZGIgY29ubmVjdGlvblxuICAgICAgICAgIHZhciBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgICAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICAgICAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgICAgICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgICAgICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIgJiYgISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcylcbiAgICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYFxuICAgICAgICAgIC8vIGFkZCBkYlxuICAgICAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnW1BST1hZX0NPTk5FQ1RJT05dJywgY29ubmVjdGlvbl9zdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERIVCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBEUzE4QjIwIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGFzVHJpZ2dlcnMpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyB0cmlnZ2VycyAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgc2tldGNoKyctJytuYW1lKycuaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubm90aWZ5ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICB2YXIgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5uYW1lKycgaXMgJyskZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZiwwKSsnXFx1MDBCMCBsb3cnO1xuICAgICAgY29sb3IgPSAnIzM0OThEQic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdsb3cnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGFyZ2V0IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSd0YXJnZXQnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLm5hbWUrJyBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2tldHRsZS50ZW1wLmN1cnJlbnQrJ1xcdTAwQjAnO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBwcmV2aW91cyBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLm5hbWUrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5uYW1lKycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5zbGFjaygkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIGljb24sXG4gICAgICAgICAga2V0dGxlXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgaWYoZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7SlNPTi5zdHJpbmdpZnkoZXJyKX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVLbm9iQ29weSA9IGZ1bmN0aW9uKGtldHRsZSl7XG5cbiAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnbm90IHJ1bm5pbmcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcblxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUubWVzc2FnZS5tZXNzYWdlICYmIGtldHRsZS5tZXNzYWdlLnR5cGUgPT0gJ2Rhbmdlcicpe1xuICAgICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcblxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBrZXR0bGUudGVtcC5jdXJyZW50LWtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAkZmlsdGVyKCdyb3VuZCcpKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYsMCkrJ1xcdTAwQjAgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICAgIC8vIHVwZGF0ZSBzdWJ0ZXh0IHRvIGluY2x1ZGUgaHVtaWRpdHlcbiAgICBpZihrZXR0bGUuaHVtaWRpdHkpe1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0ga2V0dGxlLmh1bWlkaXR5KyclJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5uYW1lID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC50YXJnZXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gcGFyc2VGbG9hdChrZXR0bGUudGVtcC5jdXJyZW50KTtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5wcmV2aW91cyx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC50YXJnZXQsMCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBwYXJzZUZsb2F0KGtldHRsZS50ZW1wLmFkanVzdCk7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUsMyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gJGZpbHRlcigncm91bmQnKShrZXR0bGUudGVtcC5hZGp1c3QqMS44LDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHVuaXQpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoICEha2V0dGxlICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5ub3RpZnkoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZighIWtldHRsZSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLm5vdGlmeShrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgLy9vbmx5IHByb2Nlc3MgYWN0aXZlIHNlbnNvcnNcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrLCBpKSA9PiB7XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5hY3RpdmUpe1xuICAgICAgICBhbGxTZW5zb3JzLnB1c2goQnJld1NlcnZpY2UudGVtcCgkc2NvcGUua2V0dGxlc1tpXSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwgJHNjb3BlLmtldHRsZXNbaV0pKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQpXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTE7XG4gICAgICAgICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCA9PSA3KXtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgaWYoZmllbGQgPT0gJ2FkanVzdCcpe1xuICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9IChwYXJzZUZsb2F0KGtldHRsZS50ZW1wLnByZXZpb3VzKSArIHBhcnNlRmxvYXQoa2V0dGxlLnRlbXAuYWRqdXN0KSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG4gIC8vIHNjb3BlIHdhdGNoXG4gICRzY29wZS4kd2F0Y2goJ3NldHRpbmdzJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgna2V0dGxlcycsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgnc2hhcmUnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcbn0pO1xuXG4kKCBkb2N1bWVudCApLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQoZGF0ZS50b1N0cmluZygpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlLnRvU3RyaW5nKCkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICBjZWxzaXVzID0gcGFyc2VGbG9hdChjZWxzaXVzKTtcbiAgICByZXR1cm4gJGZpbHRlcigncm91bmQnKShjZWxzaXVzKjkvNSszMiwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgZmFocmVuaGVpdCA9IHBhcnNlRmxvYXQoZmFocmVuaGVpdCk7XG4gICAgcmV0dXJuICRmaWx0ZXIoJ3JvdW5kJykoKGZhaHJlbmhlaXQtMzIpKjUvOSwyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdyb3VuZCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbCxkZWNpbWFscykge1xuICAgIHJldHVybiBOdW1iZXIoKE1hdGgucm91bmQodmFsICsgXCJlXCIgKyBkZWNpbWFscykgICsgXCJlLVwiICsgZGVjaW1hbHMpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0aXRsZWNhc2UnLCBmdW5jdGlvbigkZmlsdGVyKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQpe1xuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRleHQuc2xpY2UoMSkpO1xuICB9XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIGFjY2Vzc1Rva2VuOiAndjBqeWJRbXM5a1hOdlZmNk9FdGhQWFhZU2xRT2p6eW8xaklnVzhNSThkTkxqRzRQbDBXbXZNaEVBaGQwelpnbycsXG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgZGVidWc6IGZhbHNlXG4gICAgICAgICxwb2xsU2Vjb25kczogMTBcbiAgICAgICAgLHVuaXQ6ICdGJ1xuICAgICAgICAsbGF5b3V0OiAnY2FyZCdcbiAgICAgICAgLGNoYXJ0OiB0cnVlXG4gICAgICAgICxzaGFyZWQ6IGZhbHNlXG4gICAgICAgICxyZWNpcGU6IHsnbmFtZSc6JycsJ2JyZXdlcic6e25hbWU6JycsJ2VtYWlsJzonJ30sJ3llYXN0JzpbXSwnaG9wcyc6W10sJ2dyYWlucyc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhcmR1aW5vczogW3tcbiAgICAgICAgICBpZDogYnRvYSgnYnJld2JlbmNoJyksXG4gICAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2VcbiAgICAgICAgfV1cbiAgICAgICAgLHRwbGluazoge3VzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46JycsIHN0YXR1czogJycsIHBsdWdzOiBbXX1cbiAgICAgICAgLHNrZXRjaGVzOiB7ZnJlcXVlbmN5OiA2MCwgdmVyc2lvbjogMCwgaWdub3JlX3ZlcnNpb25fZXJyb3I6IGZhbHNlfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiA4MDg2LCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBzdGF0dXM6ICcnfVxuICAgICAgICAsc3RyZWFtczoge3VzZXJuYW1lOiAnJywgYXBpX2tleTogJycsIGFjY2Vzc1Rva2VuOiBudWxsLCBzdGF0dXM6ICcnLCBzZXNzaW9uOiB7aWQ6ICcnLCBuYW1lOiAnJywgdHlwZTogJ2Zlcm1lbnRhdGlvbid9fVxuICAgICAgfTtcbiAgICAgIHJldHVybiBkZWZhdWx0U2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbmFtZTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyLHJhdzowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIG5hbWU6ICdNYXNoJ1xuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6MixyYXc6MH1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLHVybDonYXJkdWluby5sb2NhbCcsYW5hbG9nOjUsZGlnaXRhbDoxM31cbiAgICAgICAgICAsbWVzc2FnZToge3R5cGU6J2Vycm9yJyxtZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MCxsb2NhdGlvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2UsIHN0cmVhbXM6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBuYW1lOiAnQm9pbCdcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyLHJhdzowfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksdXJsOidhcmR1aW5vLmxvY2FsJyxhbmFsb2c6NSxkaWdpdGFsOjEzfVxuICAgICAgICAgICxtZXNzYWdlOiB7dHlwZTonZXJyb3InLG1lc3NhZ2U6JycsdmVyc2lvbjonJyxjb3VudDowLGxvY2F0aW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZSwgc3RyZWFtczogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9IGVsc2UgaWYoa2V5ID09ICdzZXR0aW5ncycpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDEyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDMzJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUNDQnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgdmFyIGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0FpcicsJ3R5cGUnOidhaXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgdmFyIHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUubmFtZSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZSsnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKHNldHRpbmdzLnNrZXRjaGVzLnZlcnNpb24gIT0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKXtcbiAgICAgICAgICAgICAgc2V0dGluZ3Muc2tldGNoZXMudmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnLHNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKHNldHRpbmdzLnNrZXRjaGVzLnZlcnNpb24gIT0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKXtcbiAgICAgICAgICAgICAgc2V0dGluZ3Muc2tldGNoZXMudmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnLHNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgdGltZW91dDogc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMDB9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZCl7XG4gICAgICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdC5oZWFkZXJzID0geydBdXRob3JpemF0aW9uJzogJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKX07XG4gICAgICB9XG5cbiAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZihzZXR0aW5ncy5za2V0Y2hlcy52ZXJzaW9uICE9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSl7XG4gICAgICAgICAgICAgIHNldHRpbmdzLnNrZXRjaGVzLnZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyxzZXR0aW5ncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGRpZ2l0YWxSZWFkOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHRpbWVvdXQpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsLycrc2Vuc29yO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciByZXF1ZXN0ID0ge3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKXtcbiAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMgPSB7J0F1dGhvcml6YXRpb24nOiAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpfTtcbiAgICAgIH1cblxuICAgICAgJGh0dHAocmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKHNldHRpbmdzLnNrZXRjaGVzLnZlcnNpb24gIT0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKXtcbiAgICAgICAgICAgICAgc2V0dGluZ3Muc2tldGNoZXMudmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnLHNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG9hZFNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHF1ZXJ5ID0gJyc7XG4gICAgICBpZihwYXNzd29yZClcbiAgICAgICAgcXVlcnkgPSAnP3Bhc3N3b3JkPScrbWQ1KHBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2dldC8nK2ZpbGUrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gZmluaXNoIHRoaXNcbiAgICAvLyBkZWxldGVTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAvLyAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAvLyAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2RlbGV0ZS8nK2ZpbGUsIG1ldGhvZDogJ0dFVCd9KVxuICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgLy8gICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAvLyAgICAgICBxLnJlamVjdChlcnIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIHJldHVybiBxLnByb21pc2U7XG4gICAgLy8gfSxcblxuICAgIGNyZWF0ZVNoYXJlOiBmdW5jdGlvbihzaGFyZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGtldHRsZXMgPSB0aGlzLnNldHRpbmdzKCdrZXR0bGVzJyk7XG4gICAgICB2YXIgc2ggPSBPYmplY3QuYXNzaWduKHt9LCB7cGFzc3dvcmQ6IHNoYXJlLnBhc3N3b3JkLCBhY2Nlc3M6IHNoYXJlLmFjY2Vzc30pO1xuICAgICAgLy9yZW1vdmUgc29tZSB0aGluZ3Mgd2UgZG9uJ3QgbmVlZCB0byBzaGFyZVxuICAgICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0ua25vYjtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0udmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgc2V0dGluZ3Muc3RyZWFtcztcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5pbmZsdXhkYjtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHZhciB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBvbjogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogMSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBvZmY6IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDAgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIHZhciBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHN0cmVhbXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIHVybCA9IGBodHRwczovLyR7c2V0dGluZ3Muc3RyZWFtcy51c2VybmFtZX0uc3RyZWFtcy5icmV3YmVuY2guY29gO1xuICAgICAgdmFyIHJlcXVlc3QgPSB7dXJsOiB1cmwsIGhlYWRlcnM6IHt9LCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwMH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGF1dGg6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoc2V0dGluZ3Muc3RyZWFtcy5hcGlfa2V5KXtcbiAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6MzAwMS9hcGkvdXNlcnMvYXV0aGA7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1BUEktS2V5J10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXl9YDtcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snWC1CQi1Vc2VyJ10gPSBgJHtzZXR0aW5ncy5zdHJlYW1zLnVzZXJuYW1lfWA7XG4gICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLmFjY2Vzc1Rva2VuKVxuICAgICAgICAgICAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbiA9IHJlc3BvbnNlLmRhdGEuYWNjZXNzVG9rZW47XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVqZWN0KGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgcGluZzogKCkgPT4ge1xuICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy5zdHJlYW1zLmFwaV9rZXkpe1xuICAgICAgICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSAnQmFzaWMgJytidG9hKHNldHRpbmdzLnN0cmVhbXMudXNlcm5hbWUrJzonK3NldHRpbmdzLnN0cmVhbXMuYXBpX2tleSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlcXVlc3QudXJsICs9ICcvcGluZyc7XG4gICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnR0VUJztcbiAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBrZXR0bGVzOiB7XG4gICAgICAgICAgc2F2ZTogYXN5bmMgKGtldHRsZSkgPT4ge1xuICAgICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4pe1xuICAgICAgICAgICAgICB2YXIgYXV0aCA9IGF3YWl0IHRoaXMuc3RyZWFtcygpLmF1dGgoKTtcbiAgICAgICAgICAgICAgaWYoIXRoaXMuYWNjZXNzVG9rZW4pe1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KCdTb3JyeSBCYWQgQXV0aGVudGljYXRpb24nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0LnVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDEvYXBpL2tldHRsZXMvYXJtJztcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICAgICAgcmVxdWVzdC5kYXRhID0ge1xuICAgICAgICAgICAgICBzZXNzaW9uOiBzZXR0aW5ncy5zdHJlYW1zLnNlc3Npb24sXG4gICAgICAgICAgICAgIGtldHRsZToga2V0dGxlLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiBzZXR0aW5ncy5ub3RpZmljYXRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbjtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbnM6IHtcbiAgICAgICAgICBnZXQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKXtcbiAgICAgICAgICAgICAgdmFyIGF1dGggPSBhd2FpdCB0aGlzLnN0cmVhbXMoKS5hdXRoKCk7XG4gICAgICAgICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKXtcbiAgICAgICAgICAgICAgICBxLnJlamVjdCgnU29ycnkgQmFkIEF1dGhlbnRpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC51cmwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaS9zZXNzaW9ucyc7XG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IHtcbiAgICAgICAgICAgICAgc2Vzc2lvbklkOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGtldHRsZToga2V0dGxlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gdGhpcy5hY2Nlc3NUb2tlbjtcbiAgICAgICAgICAgICRodHRwKHJlcXVlc3QpXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8vIGRvIGNhbGNzIHRoYXQgZXhpc3Qgb24gdGhlIHNrZXRjaFxuICAgIGJpdGNhbGM6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICB2YXIgYXZlcmFnZSA9IGtldHRsZS50ZW1wLnJhdztcbiAgICAgIC8vIGh0dHBzOi8vd3d3LmFyZHVpbm8uY2MvcmVmZXJlbmNlL2VuL2xhbmd1YWdlL2Z1bmN0aW9ucy9tYXRoL21hcC9cbiAgICAgIGZ1bmN0aW9uIGZtYXAgKHgsaW5fbWluLGluX21heCxvdXRfbWluLG91dF9tYXgpe1xuICAgICAgICByZXR1cm4gKHggLSBpbl9taW4pICogKG91dF9tYXggLSBvdXRfbWluKSAvIChpbl9tYXggLSBpbl9taW4pICsgb3V0X21pbjtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InKXtcbiAgICAgICAgY29uc3QgVEhFUk1JU1RPUk5PTUlOQUwgPSAxMDAwMDtcbiAgICAgICAgLy8gdGVtcC4gZm9yIG5vbWluYWwgcmVzaXN0YW5jZSAoYWxtb3N0IGFsd2F5cyAyNSBDKVxuICAgICAgICBjb25zdCBURU1QRVJBVFVSRU5PTUlOQUwgPSAyNTtcbiAgICAgICAgLy8gaG93IG1hbnkgc2FtcGxlcyB0byB0YWtlIGFuZCBhdmVyYWdlLCBtb3JlIHRha2VzIGxvbmdlclxuICAgICAgICAvLyBidXQgaXMgbW9yZSAnc21vb3RoJ1xuICAgICAgICBjb25zdCBOVU1TQU1QTEVTID0gNTtcbiAgICAgICAgLy8gVGhlIGJldGEgY29lZmZpY2llbnQgb2YgdGhlIHRoZXJtaXN0b3IgKHVzdWFsbHkgMzAwMC00MDAwKVxuICAgICAgICBjb25zdCBCQ09FRkZJQ0lFTlQgPSAzOTUwO1xuICAgICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlICdvdGhlcicgcmVzaXN0b3JcbiAgICAgICAgY29uc3QgU0VSSUVTUkVTSVNUT1IgPSAxMDAwMDtcbiAgICAgICAvLyBjb252ZXJ0IHRoZSB2YWx1ZSB0byByZXNpc3RhbmNlXG4gICAgICAgYXZlcmFnZSA9IDEwMjMgLyBhdmVyYWdlIC0gMTtcbiAgICAgICBhdmVyYWdlID0gU0VSSUVTUkVTSVNUT1IgLyBhdmVyYWdlO1xuXG4gICAgICAgdmFyIHN0ZWluaGFydCA9IGF2ZXJhZ2UgLyBUSEVSTUlTVE9STk9NSU5BTDsgICAgIC8vIChSL1JvKVxuICAgICAgIHN0ZWluaGFydCA9IE1hdGgubG9nKHN0ZWluaGFydCk7ICAgICAgICAgICAgICAgICAgLy8gbG4oUi9SbylcbiAgICAgICBzdGVpbmhhcnQgLz0gQkNPRUZGSUNJRU5UOyAgICAgICAgICAgICAgICAgICAvLyAxL0IgKiBsbihSL1JvKVxuICAgICAgIHN0ZWluaGFydCArPSAxLjAgLyAoVEVNUEVSQVRVUkVOT01JTkFMICsgMjczLjE1KTsgLy8gKyAoMS9UbylcbiAgICAgICBzdGVpbmhhcnQgPSAxLjAgLyBzdGVpbmhhcnQ7ICAgICAgICAgICAgICAgICAvLyBJbnZlcnRcbiAgICAgICBzdGVpbmhhcnQgLT0gMjczLjE1O1xuICAgICAgIHJldHVybiBzdGVpbmhhcnQ7XG4gICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcpe1xuICAgICAgIGlmIChyYXc+NDA5KXtcbiAgICAgICAgcmV0dXJuICgxNTAqZm1hcChyYXcsNDEwLDEwMjMsMCw2MTQpKS82MTQ7XG4gICAgICAgfVxuICAgICB9XG4gICAgICByZXR1cm4gJ04vQSc7XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZiggISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcGtnOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGdyYWluczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ncmFpbnMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBob3BzOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2hvcHMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB3YXRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS93YXRlci5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHN0eWxlczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3N0eWxlZ3VpZGUuanNvbicpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG92aWJvbmQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvbG92aWJvbmQuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjaGFydE9wdGlvbnM6IGZ1bmN0aW9uKHVuaXQpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpbmVDaGFydCcsXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBMaXZlJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcblxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUycpKG5ldyBEYXRlKGQpKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCF1bml0IHx8IHVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGQsMCkrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uKHBsYXRvKXtcbiAgICAgIHZhciBzZyA9ICggMSArIChwbGF0byAvICgyNTguNiAtICggKHBsYXRvLzI1OC4yKSAqIDIyNy4xKSApICkgKS50b0ZpeGVkKDMpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpO1xuICAgIH0sXG4gICAgcGxhdG86IGZ1bmN0aW9uKHNnKXtcbiAgICAgIHZhciBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIHZhciByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZighIXJlY2lwZS5GX1JfTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5GX1JfTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkZfUl9CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYsMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pe1xuICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4sZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5GX0dfTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoZ3JhaW4uRl9HX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2Mpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0KXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgdmFyIG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZighIXJlY2lwZS5OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuU1RZTEUuQ0FURUdPUlk7XG5cbiAgICAgIC8vIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk9HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLk9HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLklCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NQVgpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUFYLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUlOKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5GRVJNRU5UQUJMRVMpe1xuICAgICAgICB2YXIgZ3JhaW5zID0gKHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgJiYgcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRS5sZW5ndGgpID8gcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSA6IHJlY2lwZS5GRVJNRU5UQUJMRVM7XG4gICAgICAgIF8uZWFjaChncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtYXNoX3RpbWUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMiksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIHZhciBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==