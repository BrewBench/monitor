webpackJsonp([1],{

/***/ 185:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(31);
__webpack_require__(206);
__webpack_require__(208);
__webpack_require__(209);
__webpack_require__(210);
module.exports = __webpack_require__(211);


/***/ }),

/***/ 206:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(12);

var _angular2 = _interopRequireDefault(_angular);

var _lodash = __webpack_require__(33);

var _lodash2 = _interopRequireDefault(_lodash);

__webpack_require__(34);

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

/***/ 208:
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

  $scope.hops;
  $scope.grains;
  $scope.water;
  $scope.lovibond;
  $scope.pkg;
  $scope.kettleTypes = BrewService.kettleTypes();
  $scope.chartOptions = BrewService.chartOptions();
  $scope.sensorTypes = BrewService.sensorTypes;
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
      BrewService.tplink().login($scope.settings.tplink.user, $scope.settings.tplink.pass).then(function (response) {
        if (response.token) {
          $scope.settings.tplink.token = response.token;
          $scope.tplink.scan(response.token);
        }
      }).catch(function (err) {
        $scope.setErrorMessage(err.msg || err);
      });
    },
    scan: function scan(token) {
      $scope.settings.tplink.plugs = [];
      BrewService.tplink().scan(token).then(function (response) {
        if (response.deviceList) {
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
      key: type ? _.find($scope.kettleTypes, { type: type }).name : $scope.kettleTypes[0].name,
      type: type || $scope.kettleTypes[0].type,
      active: false,
      sticky: false,
      heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : null,
      error: { message: '', version: '', count: 0 },
      notify: { slack: false, dweet: false }
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

  $scope.testInfluxDB = function () {
    $scope.settings.influxdb.testing = true;
    $scope.settings.influxdb.connected = false;
    BrewService.influxdb().ping().then(function (response) {
      $scope.settings.influxdb.testing = false;
      if (response.status == 204) {
        $('#influxdbUrl').removeClass('is-invalid');
        $scope.settings.influxdb.connected = true;
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
        $scope.settings.influxdb.connected = false;
      }
    }).catch(function (err) {
      $('#influxdbUrl').addClass('is-invalid');
      $scope.settings.influxdb.testing = false;
      $scope.settings.influxdb.connected = false;
    });
  };

  $scope.createInfluxDB = function () {
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

  $scope.setErrorMessage = function (err, kettle) {
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
        if (kettle) kettle.error.version = err.version;
        message = 'Sketch Version is out of date.  <a href="" data-toggle="modal" data-target="#settingsModal">Download here</a>.' + '<br/>Your Version: ' + err.version + '<br/>Current Version: ' + $scope.settings.sketch_version;
      } else {
        message = JSON.stringify(err);
        if (message == '{}') message = '';
      }

      if (!!message) {
        if (kettle) {
          kettle.error.count = 0;
          kettle.error.message = $sce.trustAsHtml('Connection error: ' + message);
          $scope.updateKnobCopy(kettle);
        } else {
          $scope.error.message = $sce.trustAsHtml('Error: ' + message);
        }
      } else if (kettle) {
        kettle.error.count = 0;
        kettle.error.message = 'Error connecting to ' + BrewService.domain(kettle.arduino);
      } else {
        $scope.error.message = $sce.trustAsHtml('Connection error:');
      }
    }
  };

  $scope.resetError = function (kettle) {
    if (kettle) {
      kettle.error.count = 0;
      kettle.error.message = $sce.trustAsHtml('');
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
    // temp response is in C
    kettle.temp.previous = $scope.settings.unit == 'F' ? $filter('toFahrenheit')(response.temp) : Math.round(response.temp);
    kettle.temp.current = kettle.temp.previous + kettle.temp.adjust;

    //reset all kettles every resetChart
    if (kettle.values.length > resetChart) {
      $scope.kettles.map(function (k) {
        return k.values = [];
      });
    }

    //DHT11 sensor has humidity
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
        $scope.alert(kettle);
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
        $scope.alert(kettle);
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
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.slack || kettle.notify.dweet) {
        hasASketch = true;
      }
    });
    return hasASketch;
  };

  $scope.knobClick = function (kettle) {
    //set adjustment amount
    if (!!kettle.temp.previous) {
      kettle.temp.adjust = kettle.temp.current - kettle.temp.previous;
    }
  };

  $scope.startStopKettle = function (kettle) {
    kettle.active = !kettle.active;
    $scope.resetError(kettle);

    if (kettle.active) {
      kettle.knob.subText.text = 'starting...';
      kettle.knob.readOnly = false;

      BrewService.temp(kettle).then(function (response) {
        return $scope.updateTemp(response, kettle);
      }).catch(function (err) {
        kettle.error.count++;
        if (kettle.error.count == 7) $scope.setErrorMessage(err, kettle);
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
      kettle.knob.readOnly = true;
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

  function downloadSketch(name, actions, hasTriggers, headers, sketch) {
    // tp link connection
    var tplink_connection_string = BrewService.tplink().connection();
    // influx db connection
    var connection_string = '' + $scope.settings.influxdb.url;
    if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
    connection_string += '/write?';
    // add user/pass
    if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
    // add db
    connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));
    var autogen = '/* Sketch Auto Generated from http://monitor.brewbench.co on ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + '*/\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = autogen + response.data.replace('// [actions]', actions.length ? actions.join('\n') : '').replace('// [headers]', headers.length ? headers.join('\n') : '').replace('[TPLINK_CONNECTION]', tplink_connection_string).replace('[SLACK_CONNECTION]', $scope.settings.notifications.slack).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
      if (sketch.indexOf('InfluxDB') !== -1) {
        response.data = response.data.replace('[INFLUXDB_CONNECTION]', connection_string);
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

  $scope.downloadAutoSketch = function () {
    var sketches = [];
    var arduinoName = '';
    _.each($scope.kettles, function (kettle, i) {
      // reset the actions
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.dweet) {
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
        var adjust = $scope.settings.unit == 'F' && kettle.temp.adjust != 0 ? Math.round(kettle.temp.adjust * 0.555) : kettle.temp.adjust;
        if (kettle.temp.type.indexOf('DHT') !== -1 && currentSketch.headers.indexOf('#include <dht.h>') === -1) {
          currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
          currentSketch.headers.push('#include <dht.h>');
        } else if (kettle.temp.type.indexOf('DS18B20') !== -1 && currentSketch.headers.indexOf('#include "cactus_io_DS18B20.h"') === -1) {
          currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
          currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
        }
        currentSketch.actions.push('autoCommand("' + kettle.temp.pin + '","' + kettle.temp.type + '",' + adjust + ');');
        //look for triggers
        if (kettle.heater && kettle.heater.sketch) {
          currentSketch.triggers = true;
          currentSketch.actions.push('trigger("heat","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.heater.pin + '",temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
        }
        if (kettle.cooler && kettle.cooler.sketch) {
          currentSketch.triggers = true;
          currentSketch.actions.push('trigger("cool","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.cooler.pin + '",temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
        }
        if (kettle.notify.dweet) {
          currentSketch.triggers = true;
          currentSketch.actions.push('dweetAutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + $scope.settings.recipe.brewer.name + '","' + $scope.settings.recipe.name + '",temp);');
        }
      }
    });
    _.each(sketches, function (sketch, i) {
      if (sketch.triggers) {
        sketch.actions.unshift('float temp = 0.00;');
        // update autoCommand
        for (var a = 0; a < sketch.actions.length; a++) {
          if (sketches[i].actions[a].indexOf('autoCommand(') !== -1) sketches[i].actions[a] = sketches[i].actions[a].replace('autoCommand(', 'temp = autoCommand(');
        }
      }
      downloadSketch(sketch.name, sketch.actions, sketch.triggers, sketch.headers, 'BrewBenchAutoYun');
    });
  };

  $scope.downloadInfluxDBSketch = function () {
    if (!$scope.settings.influxdb.url) return;
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
      var adjust = $scope.settings.unit == 'F' && kettle.temp.adjust != 0 ? Math.round(kettle.temp.adjust * 0.555) : kettle.temp.adjust;
      if (kettle.temp.type.indexOf('DHT') !== -1 && currentSketch.headers.indexOf('#include <dht.h>') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
        currentSketch.headers.push('#include <dht.h>');
      } else if (kettle.temp.type.indexOf('DS18B20') !== -1 && currentSketch.headers.indexOf('#include "cactus_io_DS18B20.h"') === -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
        currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
      }
      currentSketch.actions.push('influxDBCommand(F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettle.temp.type + '"),' + adjust + ');');
      //look for triggers
      if (kettle.heater && kettle.heater.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('trigger(F("heat"),F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      }
      if (kettle.cooler && kettle.cooler.sketch) {
        currentSketch.triggers = true;
        currentSketch.actions.push('trigger(F("cool"),F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      }
      if (kettle.notify.dweet) {
        currentSketch.triggers = true;
        currentSketch.actions.push('dweetAutoCommand(F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + $scope.settings.recipe.brewer.name + '"),F("' + $scope.settings.recipe.name + '"),temp);');
      }
    });
    _.each(sketches, function (sketch, i) {
      if (sketch.triggers) {
        sketch.actions.unshift('float temp = 0.00;');
        // update autoCommand
        for (var a = 0; a < sketch.actions.length; a++) {
          if (sketches[i].actions[a].indexOf('influxDBCommand(') !== -1) sketches[i].actions[a] = sketches[i].actions[a].replace('influxDBCommand(', 'temp = influxDBCommand(');
        }
      }
      downloadSketch(sketch.name, sketch.actions, sketch.triggers, sketch.headers, 'BrewBenchInfluxDBYun');
    });
  };

  $scope.getIPAddress = function () {
    $scope.settings.ipAddress = "";
    BrewService.ip().then(function (response) {
      $scope.settings.ipAddress = response.ip;
    }).catch(function (err) {
      $scope.setErrorMessage(err);
    });
  };

  $scope.alert = function (kettle, timer) {

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
      message = kettle.key + ' is ' + (kettle.high - kettle.temp.diff) + '\xB0 high';
      color = 'danger';
      $scope.settings.notifications.last = 'high';
    } else if (kettle && kettle.low) {
      if (!$scope.settings.notifications.low || $scope.settings.notifications.last == 'low') return;
      message = kettle.key + ' is ' + (kettle.low - kettle.temp.diff) + '\xB0 low';
      color = '#3498DB';
      $scope.settings.notifications.last = 'low';
    } else if (kettle) {
      if (!$scope.settings.notifications.target || $scope.settings.notifications.last == 'target') return;
      message = kettle.key + ' is within the target at ' + kettle.temp.current + '\xB0';
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
          if (kettle) notification = new Notification(kettle.key + ' kettle', { body: message, icon: icon });else notification = new Notification('Test kettle', { body: message, icon: icon });
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if (message) {
              notification = new Notification(kettle.key + ' kettle', { body: message, icon: icon });
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
      kettle.knob.readOnly = true;
      return;
    } else if (kettle.error.message) {
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'error';
      kettle.knob.subText.color = 'gray';
      kettle.knob.readOnly = true;
      return;
    }

    kettle.knob.readOnly = false;

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
        kettle.knob.subText.text = kettle.high - kettle.temp.diff + '\xB0 high';
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
        kettle.knob.subText.text = kettle.low - kettle.temp.diff + '\xB0 low';
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
    kettle.key = kettleType.name;
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
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current, unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target, unit);
        if (!!kettle.temp.adjust) {
          if (unit === 'C') kettle.temp.adjust = Math.round(kettle.temp.adjust * 0.555);else kettle.temp.adjust = Math.round(kettle.temp.adjust * 1.8);
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
        if (!!kettle && _.filter(kettle.timers, { up: { running: true } }).length == kettle.timers.length) $scope.alert(kettle, timer);
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
            $scope.alert(kettle, nextTimer);
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ }),

/***/ 209:
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

/***/ 210:
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
}).filter('toFahrenheit', function () {
  return function (celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  };
}).filter('toCelsius', function () {
  return function (fahrenheit) {
    return Math.round((fahrenheit - 32) * 5 / 9);
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
});

/***/ }),

/***/ 211:
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
      }
    },

    reset: function reset() {
      return {
        pollSeconds: 10,
        unit: 'F',
        layout: 'card',
        chart: true,
        shared: false,
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'grains': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        account: { apiKey: '', sessions: [] },
        influxdb: { url: '', port: 8086, user: '', pass: '', db: '', dbs: [], connected: false },
        arduinos: [{
          id: btoa('brewbench'),
          url: 'arduino.local',
          analog: 5,
          digital: 13,
          secure: false
        }],
        tplink: { user: '', pass: '', token: '', plugs: [] },
        sketches: { frequency: 60, version: 0, ignore_version_error: false }
      };
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
        key: 'Hot Liquor',
        type: 'water',
        active: false,
        sticky: false,
        heater: { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D3', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 170, diff: 2 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 },
        error: { message: '', version: '', count: 0 },
        notify: { slack: false, dweet: false }
      }, {
        key: 'Mash',
        type: 'grain',
        active: false,
        sticky: false,
        heater: { pin: 'D4', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D5', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A1', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 152, diff: 2 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 },
        error: { message: '', version: '', count: 0 },
        notify: { slack: false, dweet: false }
      }, {
        key: 'Boil',
        type: 'hop',
        active: false,
        sticky: false,
        heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
        temp: { pin: 'A2', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 200, diff: 2 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 },
        error: { message: '', version: '', count: 0 },
        notify: { slack: false, dweet: false }
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
          'title': kettle.key,
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
      var headers = {};

      if (kettle.arduino.password) headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password);

      $http({ url: url, method: 'GET', headers: headers, timeout: settings.pollSeconds * 10000 }).then(function (response) {
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
      var headers = {};

      if (kettle.arduino.password) headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password);

      $http({ url: url, method: 'GET', headers: headers, timeout: settings.pollSeconds * 1000 }).then(function (response) {
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
      var headers = {};

      if (kettle.arduino.password) headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password);

      $http({ url: url, method: 'GET', headers: headers, timeout: settings.pollSeconds * 1000 }).then(function (response) {
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
      var headers = {};

      if (kettle.arduino.password) headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password);

      $http({ url: url, method: 'GET', headers: headers, timeout: timeout || settings.pollSeconds * 1000 }).then(function (response) {
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
      delete settings.account;
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
              return d + '\xB0';
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

      if (!!recipe.IBU) response.fg = parseInt(recipe.IBU, 10);

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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ })

},[185]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtQnkiLCJ1cGRhdGVBQlYiLCJyZWNpcGUiLCJzY2FsZSIsIm1ldGhvZCIsImFidiIsIm9nIiwiZmciLCJhYnZhIiwiYWJ3IiwiYXR0ZW51YXRpb24iLCJwbGF0byIsImNhbG9yaWVzIiwicmUiLCJzZyIsImNoYW5nZU1ldGhvZCIsImNoYW5nZVNjYWxlIiwiZ2V0UG9ydFJhbmdlIiwibnVtYmVyIiwiQXJyYXkiLCJmaWxsIiwibWFwIiwiaWR4IiwiYXJkdWlub3MiLCJhZGQiLCJub3ciLCJEYXRlIiwicHVzaCIsImJ0b2EiLCJhbmFsb2ciLCJkaWdpdGFsIiwiZWFjaCIsImFyZHVpbm8iLCJ1cGRhdGUiLCJkZWxldGUiLCJzcGxpY2UiLCJ0cGxpbmsiLCJsb2dpbiIsInVzZXIiLCJwYXNzIiwidGhlbiIsInJlc3BvbnNlIiwidG9rZW4iLCJzY2FuIiwiY2F0Y2giLCJzZXRFcnJvck1lc3NhZ2UiLCJlcnIiLCJtc2ciLCJwbHVncyIsImRldmljZUxpc3QiLCJwbHVnIiwic3RhdHVzIiwiaW5mbyIsInJlc3BvbnNlRGF0YSIsInN5c2luZm8iLCJKU09OIiwicGFyc2UiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImRldmljZSIsInRvZ2dsZSIsInJlbGF5X3N0YXRlIiwib2ZmIiwib24iLCJhZGRLZXR0bGUiLCJrZXkiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsImR1dHlDeWNsZSIsInNrZXRjaCIsInRlbXAiLCJoaXQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJ2YWx1ZXMiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsInZlcnNpb24iLCJjb3VudCIsIm5vdGlmeSIsInNsYWNrIiwiZHdlZXQiLCJoYXNTdGlja3lLZXR0bGVzIiwia2V0dGxlQ291bnQiLCJhY3RpdmVLZXR0bGVzIiwicGluRGlzcGxheSIsImRldmljZUlkIiwic3Vic3RyIiwiYWxpYXMiLCJwaW5JblVzZSIsImFyZHVpbm9JZCIsImNyZWF0ZVNoYXJlIiwiYnJld2VyIiwiZW1haWwiLCJzaGFyZV9zdGF0dXMiLCJzaGFyZV9zdWNjZXNzIiwic2hhcmVfbGluayIsInNoYXJlVGVzdCIsInRlc3RpbmciLCJodHRwX2NvZGUiLCJwdWJsaWMiLCJ0ZXN0SW5mbHV4REIiLCJpbmZsdXhkYiIsImNvbm5lY3RlZCIsInBpbmciLCIkIiwicmVtb3ZlQ2xhc3MiLCJkYnMiLCJjb25jYXQiLCJhcHBseSIsInJlbW92ZSIsImRiIiwiYWRkQ2xhc3MiLCJjcmVhdGVJbmZsdXhEQiIsIm1vbWVudCIsImZvcm1hdCIsImNyZWF0ZWQiLCJjcmVhdGVEQiIsImRhdGEiLCJyZXN1bHRzIiwicmVzZXRFcnJvciIsInNoYXJlQWNjZXNzIiwic2hhcmVkIiwiZnJhbWVFbGVtZW50IiwibG9hZFNoYXJlRmlsZSIsImNvbnRlbnRzIiwibm90aWZpY2F0aW9ucyIsImhpZ2giLCJsb3ciLCJsYXN0Iiwic3ViVGV4dCIsImVuYWJsZWQiLCJ0ZXh0IiwiY29sb3IiLCJmb250IiwicHJvY2Vzc1RlbXBzIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImdyYWluIiwibGFiZWwiLCJhbW91bnQiLCJhZGRUaW1lciIsIm5vdGVzIiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJza2V0Y2hfdmVyc2lvbiIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwiZG9tYWluIiwidXBkYXRlVGVtcCIsInRlbXBzIiwidW5pdCIsIk1hdGgiLCJyb3VuZCIsImh1bWlkaXR5IiwiZ2V0VGltZSIsImFsZXJ0IiwiZ2V0TmF2T2Zmc2V0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGFzU2tldGNoZXMiLCJoYXNBU2tldGNoIiwia25vYkNsaWNrIiwic3RhcnRTdG9wS2V0dGxlIiwicmVhZE9ubHkiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaWdub3JlVmVyc2lvbkVycm9yIiwic2tldGNoZXMiLCJpZ25vcmVfdmVyc2lvbl9lcnJvciIsImRvd25sb2FkU2tldGNoIiwiYWN0aW9ucyIsImhhc1RyaWdnZXJzIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwicG9ydCIsImF1dG9nZW4iLCJnZXQiLCJqb2luIiwiZnJlcXVlbmN5IiwicGFyc2VJbnQiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiY2xpY2siLCJkb3dubG9hZEF1dG9Ta2V0Y2giLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJ0cmlnZ2VycyIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRJbmZsdXhEQlNrZXRjaCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJib2R5IiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJrZXR0bGVUeXBlIiwiY2hhbmdlVW5pdHMiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsIiR3YXRjaCIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJyZWFkeSIsInRvb2x0aXAiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJ0cmltIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsInRvU3RyaW5nIiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwicGhyYXNlIiwiUmVnRXhwIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJsYXlvdXQiLCJjaGFydCIsImFjY291bnQiLCJhcGlLZXkiLCJzZXNzaW9ucyIsInNlY3VyZSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiQXV0aG9yaXphdGlvbiIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImxhdGVzdCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIngiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxD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S0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUFyNkNJLEdBQVA7QUF1NkNELENBMTZDRCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsXG4gICxyZXNldENoYXJ0ID0gMTAwXG4gICx0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUucGtnO1xuJHNjb3BlLmtldHRsZVR5cGVzID0gQnJld1NlcnZpY2Uua2V0dGxlVHlwZXMoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoKTtcbiRzY29wZS5zZW5zb3JUeXBlcyA9IEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bUJ5KG9iaiwnYW1vdW50Jyk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxM1xuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoISFwbHVnLnN0YXR1cyl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIHZhciBzeXNpbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gc3lzaW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIGlmKGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEpe1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IDA7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAxO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIGtleTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDogbnVsbFxuICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MH1cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24ocGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIHZhciBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2VcbiAgICAgICAgcmV0dXJuIHBpbjtcbiAgfTtcblxuICAkc2NvcGUucGluSW5Vc2UgPSBmdW5jdGlvbihwaW4sYXJkdWlub0lkLGFuYWxvZyl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChrZXR0bGUuYXJkdWluby5pZD09YXJkdWlub0lkKSAmJlxuICAgICAgICAoKGFuYWxvZyAmJiBrZXR0bGUudGVtcC50eXBlPT0nVGhlcm1pc3RvcicgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS50ZW1wLnR5cGU9PSdEUzE4QjIwJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKGtldHRsZS50ZW1wLnR5cGU9PSdQVDEwMCcgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYgIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICApKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVUZXN0ID0gZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgYXJkdWluby50ZXN0aW5nID0gdHJ1ZTtcbiAgICBCcmV3U2VydmljZS5zaGFyZVRlc3QoYXJkdWlubylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLmh0dHBfY29kZSA9PSAyMDApXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSB0cnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUudGVzdEluZmx1eERCID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudGVzdGluZyA9IHRydWU7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmRicygpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgdmFyIGRicyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVJbmZsdXhEQiA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9IGRiO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgaWYoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgLy8gcmVjaXBlIGRpc3BsYXlcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMsIHtuYW1lOiBncmFpbi5sYWJlbH0pLmxlbmd0aCl7XG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucywge25hbWU6IGdyYWluLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IGdyYWluLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoZ3JhaW4uYW1vdW50KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGltZXJzXG4gICAgICAgIHZhciBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkge1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIC8vIHJlY2lwZSBkaXNwbGF5XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMubGVuZ3RoICYmXG4gICAgICAgICAgICBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMsIHtuYW1lOiBob3AubGFiZWx9KS5sZW5ndGgpe1xuICAgICAgICAgICAgXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzLCB7bmFtZTogaG9wLmxhYmVsfSlbMF0uYW1vdW50ICs9IHBhcnNlRmxvYXQoaG9wLmFtb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogaG9wLmxhYmVsLCBhbW91bnQ6IHBhcnNlRmxvYXQoaG9wLmFtb3VudClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRpbWVyc1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSB7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICB2YXIga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUpe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUuZXJyb3IudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgICBtZXNzYWdlID0gJ1NrZXRjaCBWZXJzaW9uIGlzIG91dCBvZiBkYXRlLiAgPGEgaHJlZj1cIlwiIGRhdGEtdG9nZ2xlPVwibW9kYWxcIiBkYXRhLXRhcmdldD1cIiNzZXR0aW5nc01vZGFsXCI+RG93bmxvYWQgaGVyZTwvYT4uJytcbiAgICAgICAgICAnPGJyLz5Zb3VyIFZlcnNpb246ICcrZXJyLnZlcnNpb24rXG4gICAgICAgICAgJzxici8+Q3VycmVudCBWZXJzaW9uOiAnKyRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUuZXJyb3IuY291bnQ9MDtcbiAgICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUuZXJyb3IuY291bnQ9MDtcbiAgICAgICAga2V0dGxlLmVycm9yLm1lc3NhZ2UgPSBgRXJyb3IgY29ubmVjdGluZyB0byAke0JyZXdTZXJ2aWNlLmRvbWFpbihrZXR0bGUuYXJkdWlubyl9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLmVycm9yLmNvdW50PTA7XG4gICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnRlbXApe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG5cbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICBNYXRoLnJvdW5kKHJlc3BvbnNlLnRlbXApO1xuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBrZXR0bGUudGVtcC5wcmV2aW91cytrZXR0bGUudGVtcC5hZGp1c3Q7XG5cbiAgICAvL3Jlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcz1bXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUMTEgc2Vuc29yIGhhcyBodW1pZGl0eVxuICAgIGlmKCByZXNwb25zZS5odW1pZGl0eSApe1xuICAgICAga2V0dGxlLmh1bWlkaXR5ID0gcmVzcG9uc2UuaHVtaWRpdHk7XG4gICAgfVxuXG4gICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5hbGVydChrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIHZhciBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUua25vYkNsaWNrID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIC8vc2V0IGFkanVzdG1lbnQgYW1vdW50XG4gICAgICBpZighIWtldHRsZS50ZW1wLnByZXZpb3VzKXtcbiAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0ga2V0dGxlLnRlbXAuY3VycmVudCAtIGtldHRsZS50ZW1wLnByZXZpb3VzO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBrZXR0bGUuZXJyb3IuY291bnQrKztcbiAgICAgICAgICAgIGlmKGtldHRsZS5lcnJvci5jb3VudD09NylcbiAgICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICB2YXIgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgdmFyIGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICB2YXIgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5pZ25vcmVWZXJzaW9uRXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciA9IHRydWU7XG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICB2YXIgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIC8vIGluZmx1eCBkYiBjb25uZWN0aW9uXG4gICAgdmFyIGNvbm5lY3Rpb25fc3RyaW5nID0gYCR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgIGlmKCAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvd3JpdGU/JztcbiAgICAvLyBhZGQgdXNlci9wYXNzXG4gICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgLy8gYWRkIGRiXG4gICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICB2YXIgYXV0b2dlbiA9ICcvKiBTa2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY28gb24gJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJyovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFthY3Rpb25zXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbaGVhZGVyc10nLCBoZWFkZXJzLmxlbmd0aCA/IGhlYWRlcnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnW1RQTElOS19DT05ORUNUSU9OXScsIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW1NMQUNLX0NPTk5FQ1RJT05dJywgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2spXG4gICAgICAgICAgLnJlcGxhY2UoJ1tGUkVRVUVOQ1lfU0VDT05EU10nLCAkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5ID8gcGFyc2VJbnQoJHNjb3BlLnNldHRpbmdzLnNrZXRjaGVzLmZyZXF1ZW5jeSwxMCkgOiA2MCk7XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignSW5mbHV4REInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoJ1tJTkZMVVhEQl9DT05ORUNUSU9OXScsIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZG93bmxvYWRBdXRvU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2tldGNoZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIC8vIHJlc2V0IHRoZSBhY3Rpb25zXG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHxcbiAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICl7XG4gICAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgICB2YXIgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgICB0cmlnZ2VyczogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJyAmJiBrZXR0bGUudGVtcC5hZGp1c3QgIT0gMCkgPyBNYXRoLnJvdW5kKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSkgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xICYmIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUTGliLnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEgJiYgY3VycmVudFNrZXRjaC5oZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJykgPT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJyk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2F1dG9Db21tYW5kKFwiJytrZXR0bGUudGVtcC5waW4rJ1wiLFwiJytrZXR0bGUudGVtcC50eXBlKydcIiwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihcImhlYXRcIixcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS5oZWF0ZXIucGluKydcIix0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoXCJjb29sXCIsXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIsdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5ub3RpZnkuZHdlZXQpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCdkd2VldEF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicrJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSsnXCIsXCInKyRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSsnXCIsdGVtcCk7Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmKHNrZXRjaC50cmlnZ2Vycyl7XG4gICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpXG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZFxuICAgICAgICBmb3IodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignYXV0b0NvbW1hbmQoJykgIT09IC0xKVxuICAgICAgICAgICAgc2tldGNoZXNbaV0uYWN0aW9uc1thXSA9IHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0ucmVwbGFjZSgnYXV0b0NvbW1hbmQoJywndGVtcCA9IGF1dG9Db21tYW5kKCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaEF1dG9ZdW4nKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZG93bmxvYWRJbmZsdXhEQlNrZXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmwpIHJldHVybjtcbiAgICB2YXIgc2tldGNoZXMgPSBbXTtcbiAgICB2YXIgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgdmFyIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIGlmKCFjdXJyZW50U2tldGNoKXtcbiAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgdHJpZ2dlcnM6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICB9XG4gICAgICB2YXIgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIHZhciBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJyAmJiBrZXR0bGUudGVtcC5hZGp1c3QgIT0gMCkgPyBNYXRoLnJvdW5kKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSkgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgPGRodC5oPicpID09PSAtMSl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9ESFRMaWIuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignRFMxOEIyMCcpICE9PSAtMSAmJiBjdXJyZW50U2tldGNoLmhlYWRlcnMuaW5kZXhPZignI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKSA9PT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpO1xuICAgICAgfVxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2luZmx1eERCQ29tbWFuZChGKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlLnRlbXAudHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJjb29sXCIpLEYoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5ub3RpZnkuZHdlZXQpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2R3ZWV0QXV0b0NvbW1hbmQoRihcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInKyRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUrJ1wiKSxGKFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUrJ1wiKSx0ZW1wKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmKHNrZXRjaC50cmlnZ2Vycyl7XG4gICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpXG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZFxuICAgICAgICBmb3IodmFyIGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignaW5mbHV4REJDb21tYW5kKCcpICE9PSAtMSlcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2luZmx1eERCQ29tbWFuZCgnLCd0ZW1wID0gaW5mbHV4REJDb21tYW5kKCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaEluZmx1eERCWXVuJyk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5hbGVydCA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgdmFyIG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUua2V5KycgaXMgJysoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5rZXkrJyBpcyAnKyhrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUua2V5KycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytrZXR0bGUudGVtcC5jdXJyZW50KydcXHUwMEIwJztcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0ndGFyZ2V0JztcbiAgICB9XG4gICAgZWxzZSBpZigha2V0dGxlKXtcbiAgICAgIG1lc3NhZ2UgPSAnVGVzdGluZyBBbGVydHMsIHlvdSBhcmUgcmVhZHkgdG8gZ28sIGNsaWNrIHBsYXkgb24gYSBrZXR0bGUuJztcbiAgICB9XG5cbiAgICAvLyBNb2JpbGUgVmlicmF0ZSBOb3RpZmljYXRpb25cbiAgICBpZiAoXCJ2aWJyYXRlXCIgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3IudmlicmF0ZShbNTAwLCAzMDAsIDUwMF0pO1xuICAgIH1cblxuICAgIC8vIFNvdW5kIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zb3VuZHMub249PT10cnVlKXtcbiAgICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICAgIGlmKCEhdGltZXIgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKCghIXRpbWVyKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgcHJldmlvdXMgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5rZXkrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5rZXkrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUuZXJyb3IubWVzc2FnZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IGZhbHNlO1xuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGtldHRsZS50ZW1wLmN1cnJlbnQta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IChrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBoaWdoJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBsb3cnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjEpJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICd3aXRoaW4gdGFyZ2V0JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICB9XG4gICAgLy8gdXBkYXRlIHN1YnRleHQgdG8gaW5jbHVkZSBodW1pZGl0eVxuICAgIGlmKGtldHRsZS5odW1pZGl0eSl7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSBrZXR0bGUuaHVtaWRpdHkrJyUnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZUtldHRsZVR5cGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIC8vZG9uJ3QgYWxsb3cgY2hhbmdpbmcga2V0dGxlcyBvbiBzaGFyZWQgc2Vzc2lvbnNcbiAgICAvL3RoaXMgY291bGQgYmUgZGFuZ2Vyb3VzIGlmIGRvaW5nIHRoaXMgcmVtb3RlbHlcbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLmtleSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy51bml0ICE9IHVuaXQpe1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC5hZGp1c3Qpe1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBNYXRoLnJvdW5kKGtldHRsZS50ZW1wLmFkanVzdCoxLjgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHVuaXQpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoICEha2V0dGxlICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5hbGVydChrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKCEha2V0dGxlKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50KVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudCsrO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlc1tpXS5lcnJvci5jb3VudD0xO1xuICAgICAgICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uZXJyb3IuY291bnQgPT0gNyl7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzW2ldLmVycm9yLmNvdW50PTA7XG4gICAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoISFsb2FkZWQpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuICAvLyBzY29wZSB3YXRjaFxuICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICRzY29wZS4kd2F0Y2goJ2tldHRsZXMnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICRzY29wZS4kd2F0Y2goJ3NoYXJlJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG59KTtcblxuJCggZG9jdW1lbnQgKS5yZWFkeShmdW5jdGlvbigpIHtcbiAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KGRhdGUudG9TdHJpbmcoKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQoZGF0ZS50b1N0cmluZygpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChjZWxzaXVzKjkvNSszMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKGZhaHJlbmhlaXQtMzIpKjUvOSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NoYXJlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9sbFNlY29uZHM6IDEwXG4gICAgICAgICx1bml0OiAnRidcbiAgICAgICAgLGxheW91dDogJ2NhcmQnXG4gICAgICAgICxjaGFydDogdHJ1ZVxuICAgICAgICAsc2hhcmVkOiBmYWxzZVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYWNjb3VudDoge2FwaUtleTogJycsIHNlc3Npb25zOiBbXX1cbiAgICAgICAgLGluZmx1eGRiOiB7dXJsOiAnJywgcG9ydDogODA4NiwgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczpbXSwgY29ubmVjdGVkOiBmYWxzZX1cbiAgICAgICAgLGFyZHVpbm9zOiBbe1xuICAgICAgICAgIGlkOiBidG9hKCdicmV3YmVuY2gnKSxcbiAgICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgICAgZGlnaXRhbDogMTMsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZVxuICAgICAgICB9XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgcGx1Z3M6IFtdfVxuICAgICAgICAsc2tldGNoZXM6IHtmcmVxdWVuY3k6IDYwLCB2ZXJzaW9uOiAwLCBpZ25vcmVfdmVyc2lvbl9lcnJvcjogZmFsc2V9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIGtleTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MH1cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIGtleTogJ01hc2gnXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246JycsY291bnQ6MH1cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIGtleTogJ0JvaWwnXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTInLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MjAwLGRpZmY6Mn1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLCB1cmw6ICdhcmR1aW5vLmxvY2FsJyxhbmFsb2c6IDUsZGlnaXRhbDogMTN9XG4gICAgICAgICAgLGVycm9yOiB7bWVzc2FnZTonJyx2ZXJzaW9uOicnLGNvdW50OjB9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfSBlbHNlIGlmKGtleSA9PSAnc2V0dGluZ3MnKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQzMycsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDQ0JywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIHZhciBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidBaXInLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgdmFyIGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoISFhcmR1aW5vLnNlY3VyZSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLmtleSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZSsnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKHNldHRpbmdzLnNrZXRjaGVzLnZlcnNpb24gIT0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpKXtcbiAgICAgICAgICAgICAgc2V0dGluZ3Muc2tldGNoZXMudmVyc2lvbiA9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKTtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnLHNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoc2V0dGluZ3Muc2tldGNoZXMudmVyc2lvbiAhPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykpe1xuICAgICAgICAgICAgICBzZXR0aW5ncy5za2V0Y2hlcy52ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycsc2V0dGluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoc2V0dGluZ3Muc2tldGNoZXMudmVyc2lvbiAhPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykpe1xuICAgICAgICAgICAgICBzZXR0aW5ncy5za2V0Y2hlcy52ZXJzaW9uID0gcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpO1xuICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycsc2V0dGluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcjtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiAodGltZW91dCB8fCBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwKX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZihzZXR0aW5ncy5za2V0Y2hlcy52ZXJzaW9uICE9IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSl7XG4gICAgICAgICAgICAgIHNldHRpbmdzLnNrZXRjaGVzLnZlcnNpb24gPSByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyk7XG4gICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyxzZXR0aW5ncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIHZhciBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgdmFyIHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmFjY291bnQ7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkd2VldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYXRlc3Q6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9sYXRlc3QvZHdlZXQvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9kd2VldHMvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDEgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiAwIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICB2YXIgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBpbmZsdXhkYjogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICB2YXIgaW5mbHV4Q29ubmVjdGlvbiA9IGAke3NldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgaWYoICEhc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YFxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwaW5nOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2AsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbih1bml0KXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTGl2ZScsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG5cbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMnKShuZXcgRGF0ZShkKSlcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghdW5pdCB8fCB1bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICB2YXIgc2cgPSAoIDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoIChwbGF0by8yNTguMikgKiAyMjcuMSkgKSApICkudG9GaXhlZCgzKTtcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHNnKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICB2YXIgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0byk7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoISFyZWNpcGUuRl9SX05BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUsMTApO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0Lmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5GX1lfTEFCKycgJysoeWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX0xBQisnICcrXG4gICAgICAgICAgICAgIChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyWE1MOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgdmFyIHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIHZhciBtYXNoX3RpbWUgPSA2MDtcblxuICAgICAgaWYoISFyZWNpcGUuTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgIC8vICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkJSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5JQlUpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NQVgpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUFYLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUlOKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5GRVJNRU5UQUJMRVMpe1xuICAgICAgICB2YXIgZ3JhaW5zID0gKHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgJiYgcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRS5sZW5ndGgpID8gcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSA6IHJlY2lwZS5GRVJNRU5UQUJMRVM7XG4gICAgICAgIF8uZWFjaChncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtYXNoX3RpbWUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMiksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgdmFyIGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIHZhciBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIHZhciB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgdmFyIGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==