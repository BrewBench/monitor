webpackJsonp([1],{

/***/ 180:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(24);
__webpack_require__(201);
__webpack_require__(203);
__webpack_require__(204);
__webpack_require__(205);
module.exports = __webpack_require__(206);


/***/ }),

/***/ 201:
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

/***/ 203:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

angular.module('brewbench-monitor').controller('mainCtrl', function ($scope, $state, $filter, $timeout, $interval, $q, $http, $sce, BrewService) {

  $scope.clearSettings = function (e) {
    if (e) {
      angular.element(e.target).html('Removing...');
    }
    BrewService.clear();
    $timeout(function () {
      window.location.href = '/';
    }, 1000);
  };

  if ($state.current.name == 'reset') $scope.clearSettings();

  var notification = null,
      resetChart = 100,
      timeout = null; //reset chart after 100 polls

  $scope.hops;
  $scope.grains;
  $scope.water;
  $scope.lovibond;
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
    return _.sum(_.values(obj));
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

  $scope.sessions = {
    add: function add() {
      var now = new Date();
      if (!$scope.settings.account.sessions) $scope.settings.account.sessions = [];
      $scope.settings.account.sessions.push({
        id: btoa(now + '' + $scope.settings.arduinos.length + 1),
        name: 'Session Name',
        created: moment()
      });
    },
    update: function update(arduino) {},
    delete: function _delete(index, arduino) {}
  };

  $scope.tplink = {
    login: function login() {
      BrewService.tplink().login($scope.settings.tplink.user, $scope.settings.tplink.pass).then(function (response) {
        if (response.token) {
          $scope.settings.tplink.token = response.token;
          $scope.tplink.scan(response.token);
        }
      });
    },
    scan: function scan(token) {
      $scope.settings.tplink.plugs = [];
      BrewService.tplink().scan(token).then(function (response) {
        if (response.deviceList) {
          $scope.settings.tplink.plugs = response.deviceList;
          // get device info
          _.each($scope.settings.tplink.plugs, function (plug) {
            BrewService.tplink().info(plug).then(function (info) {
              var sysinfo = JSON.parse(info.responseData).system.get_sysinfo;
              plug.info = sysinfo;
            });
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
      heater: { pin: 'D6', running: false, auto: false },
      pump: { pin: 'D7', running: false, auto: false },
      temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : null
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

  $scope.pinInUse = function (pin, analog) {
    var kettle = _.find($scope.kettles, function (kettle) {
      return analog && kettle.temp.type == 'Thermistor' && kettle.temp.pin == pin || !analog && kettle.temp.type == 'DS18B20' && kettle.temp.pin == pin || kettle.temp.type == 'PT100' && kettle.temp.pin == pin || !analog && kettle.heater.pin == pin || !analog && kettle.cooler && kettle.cooler.pin == pin || !analog && !kettle.cooler && kettle.pump.pin == pin;
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
      $scope.settings.recipe.grains = recipe.grains;
      var kettle = _.filter($scope.kettles, { type: 'grain' })[0];
      if (kettle) kettle.timers = [];
      $scope.settings.recipe.grains = {};
      _.each(recipe.grains, function (grain) {
        if (kettle) {
          $scope.addTimer(kettle, {
            label: grain.label,
            min: grain.min,
            notes: grain.notes
          });
        }
        // sum the amounts for the grains
        if ($scope.settings.recipe.grains[grain.label]) $scope.settings.recipe.grains[grain.label] += Number(grain.amount);else $scope.settings.recipe.grains[grain.label] = Number(grain.amount);
      });
    }

    if (recipe.hops.length) {
      var _kettle = _.filter($scope.kettles, { type: 'hop' })[0];
      if (_kettle) _kettle.timers = [];
      $scope.settings.recipe.hops = {};
      _.each(recipe.hops, function (hop) {
        if (_kettle) {
          $scope.addTimer(_kettle, {
            label: hop.label,
            min: hop.min,
            notes: hop.notes
          });
        }
        // sum the amounts for the hops
        if ($scope.settings.recipe.hops[hop.label]) $scope.settings.recipe.hops[hop.label] += Number(hop.amount);else $scope.settings.recipe.hops[hop.label] = Number(hop.amount);
      });
    }
    if (recipe.misc.length) {
      var _kettle2 = _.filter($scope.kettles, { type: 'water' })[0];
      if (_kettle2) {
        _kettle2.timers = [];
        _.each(recipe.misc, function (misc) {
          $scope.addTimer(_kettle2, {
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
        if (!$scope.settings.bb_version) {
          $scope.settings.bb_version = response.version;
        } else if ($scope.settings.bb_version != response.version) {
          $scope.error.type = 'info';
          $scope.setErrorMessage('There is a new version available for BrewBench. Please <a href="#/reset">clear</a> your settings.');
        }
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
      var message = void 0;

      if (typeof err == 'string' && err.indexOf('{') !== -1) {
        if (!Object.keys(err).length) return;
        err = JSON.parse(err);
      }

      if (typeof err == 'string') message = err;else if (err.statusText) message = err.statusText;else if (err.config && err.config.url) message = err.config.url;else if (err.version) {
        message = 'Sketch Version is out of date.  <a href="" data-toggle="modal" data-target="#settingsModal">Download here</a>.' + '<br/>Your Version: ' + err.version + '<br/>Current Version: ' + $scope.settings.sketch_version;
      } else message = JSON.stringify(err);

      if (message) {
        if (kettle) {
          kettle.error = $sce.trustAsHtml('Connection error: ' + message);
          $scope.updateKnobCopy(kettle);
        } else $scope.error.message = $sce.trustAsHtml('Error: ' + message);
      } else if (kettle) {
        kettle.error = 'Error connecting to ' + BrewService.domain(kettle.arduino);
      } else {
        $scope.error.message = $sce.trustAsHtml('Connection error:');
      }
    }
  };

  $scope.resetError = function (kettle) {
    $scope.error.type = 'danger';
    $scope.error.message = $sce.trustAsHtml('');
    if (kettle) kettle.error = $sce.trustAsHtml('');
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
    if (kettle.temp.current >= kettle.temp.target + kettle.temp.diff) {
      //stop the heating element
      if (kettle.heater.auto && kettle.heater.running) {
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if (kettle.pump.auto && kettle.pump.running) {
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
    else if (kettle.temp.current <= kettle.temp.target - kettle.temp.diff) {
        $scope.alert(kettle);
        //start the heating element
        if (kettle.heater.auto && !kettle.heater.running) {
          temps.push($scope.toggleRelay(kettle, kettle.heater, true).then(function (heating) {
            kettle.knob.subText.text = 'heating';
            kettle.knob.subText.color = 'rgba(200,47,47,1)';
          }));
        }
        //start the pump
        if (kettle.pump.auto && !kettle.pump.running) {
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
        if (kettle.pump.auto && kettle.pump.running) {
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
        return $scope.setErrorMessage(err, kettle);
      });

      // start the relays
      if (kettle.heater.running) {
        $scope.toggleRelay(kettle, kettle.heater, true);
      }
      if (kettle.pump.running) {
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
      if (!kettle.active && kettle.pump.running) {
        $scope.toggleRelay(kettle, kettle.pump, false);
      }
      //stop the cooler
      if (!kettle.active && kettle.cooler && kettle.cooler.running) {
        $scope.toggleRelay(kettle, kettle.cooler, false);
      }
      if (!kettle.active) {
        kettle.pump.auto = false;
        kettle.heater.auto = false;
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
        var _device = _.filter($scope.settings.tplink.plugs, { deviceId: element.pin.substr(3) })[0];
        return BrewService.tplink().off(_device).then(function () {
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

  $scope.downloadAutoSketch = function () {
    _.each($scope.kettles, function (kettle, i) {
      if (kettle.temp.type == 'Thermistor') kettles += 'thermistorAutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DS18B20') kettles += 'ds18B20AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'PT100') kettles += 'pt100AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DHT11') kettles += 'dht11AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DHT21') kettles += 'dht21AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DHT22') kettles += 'dht22AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';
    });
    return $http.get('assets/BrewBenchAutoYun/BrewBenchAutoYun.ino').then(function (response) {
      // replace variables
      response.data = response.data.replace('// [kettles]', kettles).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', 'BrewBenchAutoYun.ino');
      streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
      streamSketch.click();
    }).catch(function (err) {
      $scope.setErrorMessage('Failed to download sketch ' + err.message);
    });
  };

  $scope.downloadInfluxDBSketch = function () {
    if (!$scope.settings.influxdb.url) return;

    var kettles = "";
    var connection_string = '' + $scope.settings.influxdb.url;
    if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
    connection_string += '/write?';
    // add user/pass
    if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
    // add db
    connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));

    _.each($scope.kettles, function (kettle, i) {
      if (kettle.temp.type == 'Thermistor') kettles += 'thermistorInfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DS18B20') kettles += 'ds18B20InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'PT100') kettles += 'pt100InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DHT11') kettles += 'dht11InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DHT21') kettles += 'dht21InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';else if (kettle.temp.type == 'DHT22') kettles += 'dht22InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '");\n';
    });
    return $http.get('assets/BrewBenchInfluxDBYun/BrewBenchInfluxDBYun.ino').then(function (response) {
      // replace variables
      response.data = response.data.replace('// [kettles]', kettles).replace('[INFLUXDB_CONNECTION]', connection_string).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', 'BrewBenchInfluxDBYun.ino');
      streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
      streamSketch.click();
    }).catch(function (err) {
      $scope.setErrorMessage('Failed to download sketch ' + err.message);
    });
  };

  $scope.downloadStreamsSketch = function (sessionId) {
    var kettles = "";
    _.each($scope.kettles, function (kettle, i) {
      if (kettle.temp.type == 'Thermistor') kettles += 'thermistorAPICommand("' + kettle.key + '","' + kettle.temp.pin + '");\n  ';else if (kettle.temp.type == 'DS18B20') kettles += 'ds18B20APICommand("' + kettle.key + '","' + kettle.temp.pin + '");\n  ';else if (kettle.temp.type == 'PT100') kettles += 'pt100APICommand("' + kettle.key + '","' + kettle.temp.pin + '");\n  ';
    });
    return $http.get('assets/BrewBenchStreamsYun/BrewBenchStreamsYun.ino').then(function (response) {
      response.data = response.data.replace('// [kettles]', kettles).replace('[API_KEY]', $scope.settings.account.apiKey).replace('[SESSION_ID]', sessionId);
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', 'BrewBenchStreamsYun.ino');
      streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
      streamSketch.click();
    }).catch(function (err) {
      $scope.setErrorMessage('Failed to download sketch ' + err.message);
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
    var message = void 0,
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
      message = 'Your ' + kettle.key + ' kettle is ' + (kettle.high - kettle.temp.diff) + '\xB0 high';
      color = 'danger';
      $scope.settings.notifications.last = 'high';
    } else if (kettle && kettle.low) {
      if (!$scope.settings.notifications.low || $scope.settings.notifications.last == 'low') return;
      message = 'Your ' + kettle.key + ' kettle is ' + (kettle.low - kettle.temp.diff) + '\xB0 low';
      color = '#3498DB';
      $scope.settings.notifications.last = 'low';
    } else if (kettle) {
      if (!$scope.settings.notifications.target || $scope.settings.notifications.last == 'target') return;
      message = 'Your ' + kettle.key + ' kettle is within the target at ' + kettle.temp.current + '\xB0';
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
    } else if (kettle.error) {
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
    if (kettleType.type == 'fermenter' || kettleType.type == 'air') kettle.cooler = { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100 };else delete kettle.cooler;
  };

  $scope.changeUnits = function (unit) {
    if ($scope.settings.unit != unit) {
      $scope.settings.unit = unit;
      _.each($scope.kettles, function (kettle) {
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current, unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target, unit);
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
          $scope.setErrorMessage(err, $scope.kettles[i]);
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),

/***/ 204:
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

/***/ 205:
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

/***/ 206:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


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
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'malt': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
        notifications: { on: true, timers: true, high: true, low: true, target: true, slack: '', last: '' },
        sounds: { on: true, alert: '/assets/audio/bike.mp3', timer: '/assets/audio/school.mp3' },
        account: { apiKey: '', sessions: [] },
        influxdb: { url: '', port: 8086, user: '', pass: '', db: '', connected: false },
        arduinos: [{
          id: btoa('brewbench'),
          url: 'arduino.local',
          analog: 5,
          digital: 13,
          secure: false
        }],
        tplink: { user: '', pass: '', token: '', plugs: [] },
        sketches: { include_triggers: false, frequency: 60, ignore_version_error: false }
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
        heater: { pin: 'D2', running: false, auto: false, pwm: false, dutyCycle: 100 },
        pump: { pin: 'D3', running: false, auto: false, pwm: false, dutyCycle: 100 },
        temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 170, diff: 2 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 }
      }, {
        key: 'Mash',
        type: 'grain',
        active: false,
        sticky: false,
        heater: { pin: 'D4', running: false, auto: false, pwm: false, dutyCycle: 100 },
        pump: { pin: 'D5', running: false, auto: false, pwm: false, dutyCycle: 100 },
        temp: { pin: 'A1', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 152, diff: 2 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 }
      }, {
        key: 'Boil',
        type: 'hop',
        active: false,
        sticky: false,
        heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100 },
        pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100 },
        temp: { pin: 'A2', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: 200, diff: 2 },
        values: [],
        timers: [],
        knob: angular.copy(this.defaultKnobOptions(), { value: 0, min: 0, max: 220 }),
        arduino: { id: btoa('brewbench'), url: 'arduino.local', analog: 5, digital: 13 }
      }];
    },

    settings: function settings(key, values) {
      if (!window.localStorage) return values;
      try {
        if (values) {
          return window.localStorage.setItem(key, JSON.stringify(values));
        } else if (window.localStorage.getItem(key)) {
          return JSON.parse(window.localStorage.getItem(key));
        }
      } catch (e) {
        /*JSON parse error*/
      }
      return values;
    },

    sensorTypes: function sensorTypes(name) {
      var sensors = [{ name: 'Thermistor', analog: true, digital: false }, { name: 'DS18B20', analog: false, digital: true }, { name: 'PT100', analog: true, digital: true }, { name: 'DHT11', analog: false, digital: true }, { name: 'DHT21', analog: false, digital: true }, { name: 'DHT22', analog: false, digital: true }];
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
          q.resolve(response.data);
        }
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
      var headers = {};

      if (kettle.arduino.password) headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password);

      $http({ url: url, method: 'GET', headers: headers, timeout: settings.pollSeconds * 1000 }).then(function (response) {
        if (!settings.shared && !settings.sketches.ignore_version_error && (response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') < settings.sketch_version)) {
          q.reject({ version: response.headers('X-Sketch-Version') });
        } else {
          q.resolve(response.data);
        }
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
      var headers = {};

      if (kettle.arduino.password) headers.Authorization = 'Basic ' + btoa('root:' + kettle.arduino.password);

      $http({ url: url, method: 'GET', headers: headers, timeout: timeout || settings.pollSeconds * 1000 }).then(function (response) {
        if (!settings.shared && !settings.sketches.ignore_version_error && (response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') < settings.sketch_version)) {
          q.reject({ version: response.headers('X-Sketch-Version') });
        } else {
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
    //   let q = $q.defer();
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
              q.reject('No response');
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
        on: function on(device) {
          var command = { "system": { "set_relay_state": { "state": 1 } } };
          return _this.tplink().command(device, command);
        },
        off: function off(device) {
          var command = { "system": { "set_relay_state": { "state": 0 } } };
          return _this.tplink().command(device, command);
        },
        info: function info(device) {
          var command = { "system": { "get_sysinfo": null }, "emeter": { "get_realtime": null } };
          return _this.tplink().command(device, command);
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

/***/ })

},[180]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtIiwidmFsdWVzIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwic2Vzc2lvbnMiLCJhY2NvdW50IiwiY3JlYXRlZCIsIm1vbWVudCIsInRwbGluayIsImxvZ2luIiwidXNlciIsInBhc3MiLCJ0aGVuIiwicmVzcG9uc2UiLCJ0b2tlbiIsInNjYW4iLCJwbHVncyIsImRldmljZUxpc3QiLCJpbmZvIiwicGx1ZyIsInN5c2luZm8iLCJKU09OIiwicGFyc2UiLCJyZXNwb25zZURhdGEiLCJzeXN0ZW0iLCJnZXRfc3lzaW5mbyIsImRldmljZSIsInRvZ2dsZSIsInJlbGF5X3N0YXRlIiwib2ZmIiwib24iLCJhZGRLZXR0bGUiLCJrZXkiLCJmaW5kIiwic3RpY2t5IiwicGluIiwiYXV0byIsInRlbXAiLCJoaXQiLCJwcmV2aW91cyIsImFkanVzdCIsImRpZmYiLCJ0aW1lcnMiLCJrbm9iIiwiY29weSIsImRlZmF1bHRLbm9iT3B0aW9ucyIsIm1heCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiY3JlYXRlU2hhcmUiLCJicmV3ZXIiLCJlbWFpbCIsInNoYXJlX3N0YXR1cyIsInNoYXJlX3N1Y2Nlc3MiLCJzaGFyZV9saW5rIiwiY2F0Y2giLCJlcnIiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwidGVzdEluZmx1eERCIiwiaW5mbHV4ZGIiLCJjb25uZWN0ZWQiLCJwaW5nIiwic3RhdHVzIiwiJCIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJjcmVhdGVJbmZsdXhEQiIsImRiIiwiZm9ybWF0IiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJzZXRFcnJvck1lc3NhZ2UiLCJzaGFyZUFjY2VzcyIsInNoYXJlZCIsImZyYW1lRWxlbWVudCIsImxvYWRTaGFyZUZpbGUiLCJjb250ZW50cyIsIm5vdGlmaWNhdGlvbnMiLCJoaWdoIiwibG93Iiwic2xhY2siLCJsYXN0Iiwic3ViVGV4dCIsImVuYWJsZWQiLCJ0ZXh0IiwiY29sb3IiLCJmb250IiwicHJvY2Vzc1RlbXBzIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImdyYWluIiwiYWRkVGltZXIiLCJsYWJlbCIsIm5vdGVzIiwiTnVtYmVyIiwiYW1vdW50IiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJwa2ciLCJza2V0Y2hfdmVyc2lvbiIsImJiX3ZlcnNpb24iLCJ2ZXJzaW9uIiwic29ydEJ5IiwidW5pcUJ5IiwiYWxsIiwiaW5pdCIsInRpbWVyIiwidGltZXJTdGFydCIsInF1ZXVlIiwidXAiLCJ1cGRhdGVLbm9iQ29weSIsInRydXN0QXNIdG1sIiwia2V5cyIsInN0YXR1c1RleHQiLCJzdHJpbmdpZnkiLCJkb21haW4iLCJ1cGRhdGVUZW1wIiwidGVtcHMiLCJ1bml0IiwiTWF0aCIsInJvdW5kIiwiaHVtaWRpdHkiLCJnZXRUaW1lIiwiYWxlcnQiLCJnZXROYXZPZmZzZXQiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib2Zmc2V0SGVpZ2h0Iiwic2VjIiwicmVtb3ZlVGltZXJzIiwiYnRuIiwiaGFzQ2xhc3MiLCJwYXJlbnQiLCJ0b2dnbGVQV00iLCJzc3IiLCJ0b2dnbGVLZXR0bGUiLCJrbm9iQ2xpY2siLCJzdGFydFN0b3BLZXR0bGUiLCJyZWFkT25seSIsImR1dHlDeWNsZSIsImltcG9ydFNldHRpbmdzIiwicHJvZmlsZUNvbnRlbnQiLCJleHBvcnRTZXR0aW5ncyIsImkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJpZ25vcmVWZXJzaW9uRXJyb3IiLCJza2V0Y2hlcyIsImlnbm9yZV92ZXJzaW9uX2Vycm9yIiwiZG93bmxvYWRBdXRvU2tldGNoIiwiZ2V0IiwiZnJlcXVlbmN5IiwicGFyc2VJbnQiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiY2xpY2siLCJkb3dubG9hZEluZmx1eERCU2tldGNoIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiZG93bmxvYWRTdHJlYW1zU2tldGNoIiwic2Vzc2lvbklkIiwiYXBpS2V5IiwiZ2V0SVBBZGRyZXNzIiwiaXBBZGRyZXNzIiwiaXAiLCJpY29uIiwibmF2aWdhdG9yIiwidmlicmF0ZSIsInNvdW5kcyIsInNuZCIsIkF1ZGlvIiwicGxheSIsImNsb3NlIiwiTm90aWZpY2F0aW9uIiwicGVybWlzc2lvbiIsImJvZHkiLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRyYWNrQ29sb3IiLCJiYXJDb2xvciIsImNoYW5nZUtldHRsZVR5cGUiLCJrZXR0bGVJbmRleCIsImZpbmRJbmRleCIsImtldHRsZVR5cGUiLCJjaGFuZ2VVbml0cyIsInRpbWVyUnVuIiwibmV4dFRpbWVyIiwiY2FuY2VsIiwiaW50ZXJ2YWwiLCJhbGxTZW5zb3JzIiwicG9sbFNlY29uZHMiLCJjaGFuZ2VWYWx1ZSIsImZpZWxkIiwibG9hZGVkIiwiJHdhdGNoIiwibmV3VmFsdWUiLCJvbGRWYWx1ZSIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJtb2RlbCIsInRyaW0iLCJjaGFuZ2UiLCJlbnRlciIsInBsYWNlaG9sZGVyIiwidGVtcGxhdGUiLCJsaW5rIiwiYXR0cnMiLCJlZGl0IiwiYmluZCIsIiRhcHBseSIsImNoYXJDb2RlIiwia2V5Q29kZSIsIm5nRW50ZXIiLCIkcGFyc2UiLCJmbiIsIm9uUmVhZEZpbGUiLCJvbkNoYW5nZUV2ZW50IiwicmVhZGVyIiwiRmlsZVJlYWRlciIsInNyY0VsZW1lbnQiLCJmaWxlcyIsImV4dGVuc2lvbiIsInBvcCIsInRvTG93ZXJDYXNlIiwib25sb2FkIiwib25Mb2FkRXZlbnQiLCJyZXN1bHQiLCJ2YWwiLCJyZWFkQXNUZXh0IiwidG9TdHJpbmciLCJmcm9tTm93IiwiY2Vsc2l1cyIsImZhaHJlbmhlaXQiLCJwaHJhc2UiLCJSZWdFeHAiLCJmYWN0b3J5IiwibG9jYWxTdG9yYWdlIiwicmVtb3ZlSXRlbSIsImxheW91dCIsImNoYXJ0Iiwic2VjdXJlIiwiaW5jbHVkZV90cmlnZ2VycyIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJtc2ciLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiQXV0aG9yaXphdGlvbiIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsImluZmx1eENvbm5lY3Rpb24iLCJub0RhdGEiLCJoZWlnaHQiLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ4IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsIkZfU19NSU5fSUJVIiwiSW5ncmVkaWVudHMiLCJHcmFpbiIsIkZfR19OQU1FIiwiRl9HX0JPSUxfVElNRSIsIkZfR19BTU9VTlQiLCJIb3BzIiwiRl9IX05BTUUiLCJGX0hfRFJZX0hPUF9USU1FIiwiRl9IX0JPSUxfVElNRSIsIkZfSF9BTU9VTlQiLCJNaXNjIiwiRl9NX05BTUUiLCJGX01fVElNRSIsIkZfTV9BTU9VTlQiLCJZZWFzdCIsIkZfWV9MQUIiLCJGX1lfUFJPRFVDVF9JRCIsIkZfWV9OQU1FIiwibWFzaF90aW1lIiwiTkFNRSIsIlNUWUxFIiwiQ0FURUdPUlkiLCJCUkVXRVIiLCJPRyIsIkZHIiwiSUJVIiwiQUJWX01BWCIsIkFCVl9NSU4iLCJNQVNIIiwiTUFTSF9TVEVQUyIsIk1BU0hfU1RFUCIsIlNURVBfVElNRSIsIkZFUk1FTlRBQkxFUyIsIkZFUk1FTlRBQkxFIiwiQU1PVU5UIiwiSE9QUyIsIkhPUCIsIkZPUk0iLCJVU0UiLCJUSU1FIiwiTUlTQ1MiLCJNSVNDIiwiWUVBU1RTIiwiWUVBU1QiLCJjb250ZW50IiwiaHRtbGNoYXJzIiwiZiIsInIiLCJjaGFyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxrQkFBekIsRUFBNkNDLGFBQTdDLEVBQTREQyxpQkFBNUQsRUFBK0VDLGdCQUEvRSxFQUFpRzs7QUFFdkdGLGdCQUFjRyxRQUFkLENBQXVCQyxVQUF2QixHQUFvQyxJQUFwQztBQUNBSixnQkFBY0csUUFBZCxDQUF1QkUsT0FBdkIsQ0FBK0JDLE1BQS9CLEdBQXdDLGdDQUF4QztBQUNBLFNBQU9OLGNBQWNHLFFBQWQsQ0FBdUJFLE9BQXZCLENBQStCQyxNQUEvQixDQUFzQyxrQkFB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LEVBeVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFJjLEVBdVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlJjLEVBd1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFJjLEVBeVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelJjLEVBMFJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVJjLEVBMlJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1JjLEVBNFJkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBNVJj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RUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBcmMsUUFBRWtELElBQUYsQ0FBT2laLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVF0YyxPQUFSLENBQWdCMGMsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVF2YyxPQUFSLENBQWdCb1UsT0FBT3VJLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBcDFDSSxHQUFQO0FBczFDRCxDQXoxQ0QsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbiAgfSwxMDAwKTtcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsXG4gICxyZXNldENoYXJ0ID0gMTAwXG4gICx0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucygpO1xuJHNjb3BlLnNlbnNvclR5cGVzID0gQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXM7XG4kc2NvcGUuc2hvd1NldHRpbmdzID0gdHJ1ZTtcbiRzY29wZS5lcnJvciA9IHttZXNzYWdlOiAnJywgdHlwZTogJ2Rhbmdlcid9O1xuJHNjb3BlLnNsaWRlciA9IHtcbiAgbWluOiAwLFxuICBvcHRpb25zOiB7XG4gICAgZmxvb3I6IDAsXG4gICAgY2VpbDogMTAwLFxuICAgIHN0ZXA6IDUsXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gYCR7dmFsdWV9JWA7XG4gICAgfSxcbiAgICBvbkVuZDogZnVuY3Rpb24oa2V0dGxlSWQsIG1vZGVsVmFsdWUsIGhpZ2hWYWx1ZSwgcG9pbnRlclR5cGUpe1xuICAgICAgdmFyIGtldHRsZSA9IGtldHRsZUlkLnNwbGl0KCdfJyk7XG4gICAgICB2YXIgaztcblxuICAgICAgc3dpdGNoIChrZXR0bGVbMF0pIHtcbiAgICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uaGVhdGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5jb29sZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLnB1bXA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmKCFrKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmFjdGl2ZSAmJiBrLnB3bSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgICByZXR1cm4gJHNjb3BlLnRvZ2dsZVJlbGF5KCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0sIGssIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuJHNjb3BlLmdldEtldHRsZVNsaWRlck9wdGlvbnMgPSBmdW5jdGlvbih0eXBlLCBpbmRleCl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKCRzY29wZS5zbGlkZXIub3B0aW9ucywge2lkOiBgJHt0eXBlfV8ke2luZGV4fWB9KTtcbn1cblxuJHNjb3BlLmdldExvdmlib25kQ29sb3IgPSBmdW5jdGlvbihyYW5nZSl7XG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZSgvwrAvZywnJykucmVwbGFjZSgvIC9nLCcnKTtcbiAgaWYocmFuZ2UuaW5kZXhPZignLScpIT09LTEpe1xuICAgIHZhciByQXJyPXJhbmdlLnNwbGl0KCctJyk7XG4gICAgcmFuZ2UgPSAocGFyc2VGbG9hdChyQXJyWzBdKStwYXJzZUZsb2F0KHJBcnJbMV0pKS8yO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gcGFyc2VGbG9hdChyYW5nZSk7XG4gIH1cbiAgaWYoIXJhbmdlKVxuICAgIHJldHVybiAnJztcbiAgdmFyIGwgPSBfLmZpbHRlcigkc2NvcGUubG92aWJvbmQsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiAoaXRlbS5zcm0gPD0gcmFuZ2UpID8gaXRlbS5oZXggOiAnJztcbiAgfSk7XG4gIGlmKCEhbC5sZW5ndGgpXG4gICAgcmV0dXJuIGxbbC5sZW5ndGgtMV0uaGV4O1xuICByZXR1cm4gJyc7XG59O1xuXG4vL2RlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4kc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnKSB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4kc2NvcGUuc2hhcmUgPSAoISRzdGF0ZS5wYXJhbXMuZmlsZSAmJiBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSkgPyBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSA6IHtcbiAgICAgIGZpbGU6ICRzdGF0ZS5wYXJhbXMuZmlsZSB8fCBudWxsXG4gICAgICAsIHBhc3N3b3JkOiBudWxsXG4gICAgICAsIG5lZWRQYXNzd29yZDogZmFsc2VcbiAgICAgICwgYWNjZXNzOiAncmVhZE9ubHknXG4gICAgICAsIGRlbGV0ZUFmdGVyOiAxNFxuICB9O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtKF8udmFsdWVzKG9iaikpO1xufVxuXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgZGlnaXRhbDogMTNcbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnNlc3Npb25zID0ge1xuICAgIGFkZDogKCkgPT4ge1xuICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFjY291bnQuc2Vzc2lvbnMpICRzY29wZS5zZXR0aW5ncy5hY2NvdW50LnNlc3Npb25zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYWNjb3VudC5zZXNzaW9ucy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIG5hbWU6ICdTZXNzaW9uIE5hbWUnLFxuICAgICAgICBjcmVhdGVkOiBtb21lbnQoKVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG5cbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG5cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkubG9naW4oJHNjb3BlLnNldHRpbmdzLnRwbGluay51c2VyLCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGFzcylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnRva2VuKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mb1xuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgbGV0IHN5c2luZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIHBsdWcuaW5mbyA9IHN5c2luZm87XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICBpZihkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxKXtcbiAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAwO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gMTtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBrZXk6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCxkaWZmOiRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGggPyAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF0gOiBudWxsXG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gcGluO1xuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhbmFsb2cpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoYW5hbG9nICYmIGtldHRsZS50ZW1wLnR5cGU9PSdUaGVybWlzdG9yJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLnRlbXAudHlwZT09J0RTMThCMjAnICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoa2V0dGxlLnRlbXAudHlwZT09J1BUMTAwJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiAha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gZXJyO1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlVGVzdCA9IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgIGFyZHVpbm8udGVzdGluZyA9IHRydWU7XG4gICAgQnJld1NlcnZpY2Uuc2hhcmVUZXN0KGFyZHVpbm8pXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5odHRwX2NvZGUgPT0gMjAwKVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnRlc3RJbmZsdXhEQiA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnRlc3RpbmcgPSB0cnVlO1xuICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0KXtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVJbmZsdXhEQiA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9IGRiO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgaWYoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSByZWNpcGUuZ3JhaW5zO1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSB7fTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VtIHRoZSBhbW91bnRzIGZvciB0aGUgZ3JhaW5zXG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdKVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdICs9IE51bWJlcihncmFpbi5hbW91bnQpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zW2dyYWluLmxhYmVsXSA9IE51bWJlcihncmFpbi5hbW91bnQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSB7fTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdW0gdGhlIGFtb3VudHMgZm9yIHRoZSBob3BzXG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0pXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSArPSBOdW1iZXIoaG9wLmFtb3VudCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0gPSBOdW1iZXIoaG9wLmFtb3VudCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgICAgICBpZighJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24gPSByZXNwb25zZS52ZXJzaW9uO1xuICAgICAgICAgIH0gZWxzZSBpZigkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbiAhPSByZXNwb25zZS52ZXJzaW9uKXtcbiAgICAgICAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2luZm8nO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnVGhlcmUgaXMgYSBuZXcgdmVyc2lvbiBhdmFpbGFibGUgZm9yIEJyZXdCZW5jaC4gUGxlYXNlIDxhIGhyZWY9XCIjL3Jlc2V0XCI+Y2xlYXI8L2E+IHlvdXIgc2V0dGluZ3MuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUpe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZihlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgbWVzc2FnZSA9ICdTa2V0Y2ggVmVyc2lvbiBpcyBvdXQgb2YgZGF0ZS4gIDxhIGhyZWY9XCJcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjc2V0dGluZ3NNb2RhbFwiPkRvd25sb2FkIGhlcmU8L2E+LicrXG4gICAgICAgICAgJzxici8+WW91ciBWZXJzaW9uOiAnK2Vyci52ZXJzaW9uK1xuICAgICAgICAgICc8YnIvPkN1cnJlbnQgVmVyc2lvbjogJyskc2NvcGUuc2V0dGluZ3Muc2tldGNoX3ZlcnNpb247XG4gICAgICB9IGVsc2VcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG5cbiAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5lcnJvciA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5lcnJvciA9IGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOmApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVzZXRFcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIGlmKGtldHRsZSkga2V0dGxlLmVycm9yID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnRlbXApe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG5cbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICBNYXRoLnJvdW5kKHJlc3BvbnNlLnRlbXApO1xuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBrZXR0bGUudGVtcC5wcmV2aW91cytrZXR0bGUudGVtcC5hZGp1c3Q7XG5cbiAgICAvL3Jlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcz1bXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUMTEgc2Vuc29yIGhhcyBodW1pZGl0eVxuICAgIGlmKCByZXNwb25zZS5odW1pZGl0eSApe1xuICAgICAga2V0dGxlLmh1bWlkaXR5ID0gcmVzcG9uc2UuaHVtaWRpdHk7XG4gICAgfVxuXG4gICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID49IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA8PSBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaCcpKSBidG4gPSBidG4ucGFyZW50KCk7XG5cbiAgICBpZighYnRuLmhhc0NsYXNzKCdidG4tZGFuZ2VyJykpe1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tbGlnaHQnKS5hZGRDbGFzcygnYnRuLWRhbmdlcicpO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAgfSwyMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVBXTSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUucHdtID0gIWtldHRsZS5wd207XG4gICAgICBpZihrZXR0bGUucHdtKVxuICAgICAgICBrZXR0bGUuc3NyID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlS2V0dGxlID0gZnVuY3Rpb24oaXRlbSwga2V0dGxlKXtcblxuICAgIHZhciBrO1xuXG4gICAgc3dpdGNoIChpdGVtKSB7XG4gICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgayA9IGtldHRsZS5oZWF0ZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgIGsgPSBrZXR0bGUuY29vbGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICBrID0ga2V0dGxlLnB1bXA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmKCFrKVxuICAgICAgcmV0dXJuO1xuXG4gICAgay5ydW5uaW5nID0gIWsucnVubmluZztcblxuICAgIGlmKGtldHRsZS5hY3RpdmUgJiYgay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYoIWsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5rbm9iQ2xpY2sgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgLy9zZXQgYWRqdXN0bWVudCBhbW91bnRcbiAgICAgIGlmKCEha2V0dGxlLnRlbXAucHJldmlvdXMpe1xuICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBrZXR0bGUudGVtcC5jdXJyZW50IC0ga2V0dGxlLnRlbXAucHJldmlvdXM7XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN0YXJ0U3RvcEtldHRsZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUuYWN0aXZlID0gIWtldHRsZS5hY3RpdmU7XG4gICAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuXG4gICAgICBpZihrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3N0YXJ0aW5nLi4uJztcbiAgICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSBmYWxzZTtcblxuICAgICAgICBCcmV3U2VydmljZS50ZW1wKGtldHRsZSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwga2V0dGxlKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgcmVsYXlzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSB0cnVlO1xuICAgICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgICAgICBrZXR0bGUucHVtcC5hdXRvPWZhbHNlO1xuICAgICAgICAgIGtldHRsZS5oZWF0ZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuY29vbGVyKVxuICAgICAgICAgICAga2V0dGxlLmNvb2xlci5hdXRvPWZhbHNlO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVJlbGF5ID0gZnVuY3Rpb24oa2V0dGxlLCBlbGVtZW50LCBvbil7XG4gICAgaWYob24pIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIGxldCBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLE1hdGgucm91bmQoMjU1KmVsZW1lbnQuZHV0eUN5Y2xlLzEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2UgaWYoZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMjU1KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwxKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVsZW1lbnQucHdtIHx8IGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmRpZ2l0YWwoa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkc2NvcGUuaW1wb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBwcm9maWxlQ29udGVudCA9IEpTT04ucGFyc2UoJGZpbGVDb250ZW50KTtcbiAgICAgICRzY29wZS5zZXR0aW5ncyA9IHByb2ZpbGVDb250ZW50LnNldHRpbmdzIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgICAkc2NvcGUua2V0dGxlcyA9IHByb2ZpbGVDb250ZW50LmtldHRsZXMgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgLy8gZXJyb3IgaW1wb3J0aW5nXG4gICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZXhwb3J0U2V0dGluZ3MgPSBmdW5jdGlvbigpe1xuICAgIGxldCBrZXR0bGVzID0gYW5ndWxhci5jb3B5KCRzY29wZS5rZXR0bGVzKTtcbiAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAga2V0dGxlc1tpXS52YWx1ZXMgPSBbXTtcbiAgICAgIGtldHRsZXNbaV0uYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh7XCJzZXR0aW5nc1wiOiAkc2NvcGUuc2V0dGluZ3MsXCJrZXR0bGVzXCI6IGtldHRsZXN9KSk7XG4gIH07XG5cbiAgJHNjb3BlLmlnbm9yZVZlcnNpb25FcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgJHNjb3BlLnNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yID0gdHJ1ZTtcbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuICB9O1xuXG4gICRzY29wZS5kb3dubG9hZEF1dG9Ta2V0Y2ggPSBmdW5jdGlvbigpe1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InIClcbiAgICAgICAga2V0dGxlcyArPSAndGhlcm1pc3RvckF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RTMThCMjAnIClcbiAgICAgICAga2V0dGxlcyArPSAnZHMxOEIyMEF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ3B0MTAwQXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKTtcXG4nO1xuICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnREhUMTEnIClcbiAgICAgICAga2V0dGxlcyArPSAnZGh0MTFBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIpO1xcbic7XG4gICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdESFQyMScgKVxuICAgICAgICBrZXR0bGVzICs9ICdkaHQyMUF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIyJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ2RodDIyQXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKTtcXG4nO1xuICAgIH0pO1xuICAgIHJldHVybiAkaHR0cC5nZXQoJ2Fzc2V0cy9CcmV3QmVuY2hBdXRvWXVuL0JyZXdCZW5jaEF1dG9ZdW4uaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2tldHRsZXNdJywga2V0dGxlcylcbiAgICAgICAgICAucmVwbGFjZSgnW0ZSRVFVRU5DWV9TRUNPTkRTXScsICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3kgPyBwYXJzZUludCgkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5LDEwKSA6IDYwKTtcbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnQnJld0JlbmNoQXV0b1l1bi5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5kb3dubG9hZEluZmx1eERCU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybCkgcmV0dXJuO1xuXG4gICAgbGV0IGtldHRsZXMgPSBcIlwiO1xuICAgIGxldCBjb25uZWN0aW9uX3N0cmluZyA9IGAkeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICBpZiggISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgOiR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnR9YDtcbiAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnL3dyaXRlPyc7XG4gICAgLy8gYWRkIHVzZXIvcGFzc1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXIgJiYgISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzcylcbiAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGB1PSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mYFxuICAgIC8vIGFkZCBkYlxuICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICdkYj0nKygkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKSk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ3RoZXJtaXN0b3JJbmZsdXhEQkNvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKTtcXG4nO1xuICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgKVxuICAgICAgICBrZXR0bGVzICs9ICdkczE4QjIwSW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ3B0MTAwSW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDExJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ2RodDExSW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIxJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ2RodDIxSW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIyJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ2RodDIySW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCdhc3NldHMvQnJld0JlbmNoSW5mbHV4REJZdW4vQnJld0JlbmNoSW5mbHV4REJZdW4uaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2tldHRsZXNdJywga2V0dGxlcylcbiAgICAgICAgICAucmVwbGFjZSgnW0lORkxVWERCX0NPTk5FQ1RJT05dJywgY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgICAgLnJlcGxhY2UoJ1tGUkVRVUVOQ1lfU0VDT05EU10nLCAkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5ID8gcGFyc2VJbnQoJHNjb3BlLnNldHRpbmdzLnNrZXRjaGVzLmZyZXF1ZW5jeSwxMCkgOiA2MCk7XG4gICAgICAgIGxldCBzdHJlYW1Ta2V0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgJ0JyZXdCZW5jaEluZmx1eERCWXVuLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmRvd25sb2FkU3RyZWFtc1NrZXRjaCA9IGZ1bmN0aW9uKHNlc3Npb25JZCl7XG4gICAgbGV0IGtldHRsZXMgPSBcIlwiO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InIClcbiAgICAgICAga2V0dGxlcyArPSAndGhlcm1pc3RvckFQSUNvbW1hbmQoXCInK2tldHRsZS5rZXkrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiKTtcXG4gICc7XG4gICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdEUzE4QjIwJyApXG4gICAgICAgIGtldHRsZXMgKz0gJ2RzMThCMjBBUElDb21tYW5kKFwiJytrZXR0bGUua2V5KydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuICAnO1xuICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnUFQxMDAnIClcbiAgICAgICAga2V0dGxlcyArPSAncHQxMDBBUElDb21tYW5kKFwiJytrZXR0bGUua2V5KydcIixcIicra2V0dGxlLnRlbXAucGluKydcIik7XFxuICAnO1xuICAgIH0pO1xuICAgIHJldHVybiAkaHR0cC5nZXQoJ2Fzc2V0cy9CcmV3QmVuY2hTdHJlYW1zWXVuL0JyZXdCZW5jaFN0cmVhbXNZdW4uaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2tldHRsZXNdJywga2V0dGxlcylcbiAgICAgICAgICAucmVwbGFjZSgnW0FQSV9LRVldJywgJHNjb3BlLnNldHRpbmdzLmFjY291bnQuYXBpS2V5KVxuICAgICAgICAgIC5yZXBsYWNlKCdbU0VTU0lPTl9JRF0nLCBzZXNzaW9uSWQpO1xuICAgICAgICBsZXQgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsICdCcmV3QmVuY2hTdHJlYW1zWXVuLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5hbGVydCA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgbGV0IG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSAnWW91ciAnK2tldHRsZS5rZXkrJyBrZXR0bGUgaXMgJysoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9ICdZb3VyICcra2V0dGxlLmtleSsnIGtldHRsZSBpcyAnKyhrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSAnWW91ciAnK2tldHRsZS5rZXkrJyBrZXR0bGUgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytrZXR0bGUudGVtcC5jdXJyZW50KydcXHUwMEIwJztcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0ndGFyZ2V0JztcbiAgICB9XG4gICAgZWxzZSBpZigha2V0dGxlKXtcbiAgICAgIG1lc3NhZ2UgPSAnVGVzdGluZyBBbGVydHMsIHlvdSBhcmUgcmVhZHkgdG8gZ28sIGNsaWNrIHBsYXkgb24gYSBrZXR0bGUuJztcbiAgICB9XG5cbiAgICAvLyBNb2JpbGUgVmlicmF0ZSBOb3RpZmljYXRpb25cbiAgICBpZiAoXCJ2aWJyYXRlXCIgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3IudmlicmF0ZShbNTAwLCAzMDAsIDUwMF0pO1xuICAgIH1cblxuICAgIC8vIFNvdW5kIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zb3VuZHMub249PT10cnVlKXtcbiAgICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICAgIGlmKCEhdGltZXIgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKCghIXRpbWVyKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgcHJldmlvdXMgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5rZXkrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5rZXkrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUuZXJyb3Ipe1xuICAgICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSBmYWxzZTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBrZXR0bGUudGVtcC5jdXJyZW50LWtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICAgIC8vIHVwZGF0ZSBzdWJ0ZXh0IHRvIGluY2x1ZGUgaHVtaWRpdHlcbiAgICBpZihrZXR0bGUuaHVtaWRpdHkpe1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0ga2V0dGxlLmh1bWlkaXR5KyclJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5rZXkgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJylcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwfTtcbiAgICBlbHNlXG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVW5pdHMgPSBmdW5jdGlvbih1bml0KXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC50YXJnZXQsdW5pdCk7XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHVuaXQpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoICEha2V0dGxlICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5hbGVydChrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKCEha2V0dGxlKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoISFsb2FkZWQpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuICAvLyBzY29wZSB3YXRjaFxuICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICRzY29wZS4kd2F0Y2goJ2tldHRsZXMnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICRzY29wZS4kd2F0Y2goJ3NoYXJlJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KGRhdGUudG9TdHJpbmcoKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQoZGF0ZS50b1N0cmluZygpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChjZWxzaXVzKjkvNSszMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKGZhaHJlbmhlaXQtMzIpKjUvOSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NoYXJlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9sbFNlY29uZHM6IDEwXG4gICAgICAgICx1bml0OiAnRidcbiAgICAgICAgLGxheW91dDogJ2NhcmQnXG4gICAgICAgICxjaGFydDogdHJ1ZVxuICAgICAgICAsc2hhcmVkOiBmYWxzZVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdtYWx0JzpbXSxzY2FsZTonZ3Jhdml0eScsbWV0aG9kOidwYXBhemlhbicsJ29nJzoxLjA1MCwnZmcnOjEuMDEwLCdhYnYnOjAsJ2Fidyc6MCwnY2Fsb3JpZXMnOjAsJ2F0dGVudWF0aW9uJzowfVxuICAgICAgICAsbm90aWZpY2F0aW9uczoge29uOnRydWUsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9XG4gICAgICAgICxzb3VuZHM6IHtvbjp0cnVlLGFsZXJ0OicvYXNzZXRzL2F1ZGlvL2Jpa2UubXAzJyx0aW1lcjonL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJ31cbiAgICAgICAgLGFjY291bnQ6IHthcGlLZXk6ICcnLCBzZXNzaW9uczogW119XG4gICAgICAgICxpbmZsdXhkYjoge3VybDogJycsIHBvcnQ6IDgwODYsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBjb25uZWN0ZWQ6IGZhbHNlfVxuICAgICAgICAsYXJkdWlub3M6IFt7XG4gICAgICAgICAgaWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLFxuICAgICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBwbHVnczogW119XG4gICAgICAgICxza2V0Y2hlczoge2luY2x1ZGVfdHJpZ2dlcnM6IGZhbHNlLCBmcmVxdWVuY3k6IDYwLCBpZ25vcmVfdmVyc2lvbl9lcnJvcjogZmFsc2V9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIGtleTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMH1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMH1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6Mn1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLCB1cmw6ICdhcmR1aW5vLmxvY2FsJyxhbmFsb2c6IDUsZGlnaXRhbDogMTN9XG4gICAgICAgIH0se1xuICAgICAgICAgIGtleTogJ01hc2gnXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMH1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMH1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6Mn1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLCB1cmw6ICdhcmR1aW5vLmxvY2FsJyxhbmFsb2c6IDUsZGlnaXRhbDogMTN9XG4gICAgICAgIH0se1xuICAgICAgICAgIGtleTogJ0JvaWwnXG4gICAgICAgICAgLHR5cGU6ICdob3AnXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDB9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDB9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIGxldCBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICBsZXQga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonQWlyJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICBdO1xuICAgICAgaWYodHlwZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGtldHRsZXMsIHsndHlwZSc6IHR5cGV9KVswXTtcbiAgICAgIHJldHVybiBrZXR0bGVzO1xuICAgIH0sXG5cbiAgICBkb21haW46IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBkb21haW4gPSAnaHR0cDovL2FyZHVpbm8ubG9jYWwnO1xuXG4gICAgICBpZihhcmR1aW5vICYmIGFyZHVpbm8udXJsKXtcbiAgICAgICAgZG9tYWluID0gKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykgIT09IC0xKSA/XG4gICAgICAgICAgYXJkdWluby51cmwuc3Vic3RyKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykrMikgOlxuICAgICAgICAgIGFyZHVpbm8udXJsO1xuXG4gICAgICAgIGlmKCEhYXJkdWluby5zZWN1cmUpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgc2xhY2s6IGZ1bmN0aW9uKHdlYmhvb2tfdXJsLCBtc2csIGNvbG9yLCBpY29uLCBrZXR0bGUpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICBsZXQgcG9zdE9iaiA9IHsnYXR0YWNobWVudHMnOiBbeydmYWxsYmFjayc6IG1zZyxcbiAgICAgICAgICAgICd0aXRsZSc6IGtldHRsZS5rZXksXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGUrJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwMH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyByZWFkL3dyaXRlIGhlYXRlclxuICAgIC8vIGh0dHA6Ly9hcmR1aW5vdHJvbmljcy5ibG9nc3BvdC5jb20vMjAxMy8wMS93b3JraW5nLXdpdGgtc2FpbnNtYXJ0LTV2LXJlbGF5LWJvYXJkLmh0bWxcbiAgICAvLyBodHRwOi8vbXlob3d0b3NhbmRwcm9qZWN0cy5ibG9nc3BvdC5jb20vMjAxNC8wMi9zYWluc21hcnQtMi1jaGFubmVsLTV2LXJlbGF5LWFyZHVpbm8uaHRtbFxuICAgIGRpZ2l0YWw6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3I7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgaGVhZGVyczogaGVhZGVycywgdGltZW91dDogKHRpbWVvdXQgfHwgc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCl9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIGxldCBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5hY2NvdW50O1xuICAgICAgZGVsZXRlIHNldHRpbmdzLm5vdGlmaWNhdGlvbnM7XG4gICAgICBzZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgICAgaWYoc2gucGFzc3dvcmQpXG4gICAgICAgIHNoLnBhc3N3b3JkID0gbWQ1KHNoLnBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2NyZWF0ZS8nLFxuICAgICAgICAgIG1ldGhvZDonUE9TVCcsXG4gICAgICAgICAgZGF0YTogeydzaGFyZSc6IHNoLCAnc2V0dGluZ3MnOiBzZXR0aW5ncywgJ2tldHRsZXMnOiBrZXR0bGVzfSxcbiAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzaGFyZVRlc3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHF1ZXJ5ID0gYHVybD0ke2FyZHVpbm8udXJsfWBcblxuICAgICAgaWYoYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgcXVlcnkgKz0gJyZhdXRoPScrYnRvYSgncm9vdDonK2FyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS90ZXN0Lz8nK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBpcDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2lwJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIGxldCBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoJ05vIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGxldCB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBsZXQgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBvbjogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogMSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBvZmY6IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDAgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZiggISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mcT0ke2VuY29kZVVSSUNvbXBvbmVudChgQ1JFQVRFIERBVEFCQVNFIFwiJHtuYW1lfVwiYCl9YCwgbWV0aG9kOiAnUE9TVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24odW5pdCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIExpdmUnLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuXG4gICAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJykobmV3IERhdGUoZCkpXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnYm90dG9tJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tQYWRkaW5nOiAyMCxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiA0MCxcbiAgICAgICAgICAgICAgICAgIHN0YWdnZXJMYWJlbHM6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZm9yY2VZOiAoIXVuaXQgfHwgdW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZCsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgbGV0IHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgbGV0IHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgbGV0IHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIGxldCByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBsZXQgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUFYKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01JTilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NSU4sMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAgJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAubGVuZ3RoICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuRkVSTUVOVEFCTEVTKXtcbiAgICAgICAgbGV0IGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSE9QUyl7XG4gICAgICAgIGxldCBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5USU1FLzYwLzI0LDEwKSsnIERheXMnXG4gICAgICAgICAgICAgIDogaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuTUlTQ1Mpe1xuICAgICAgICBsZXQgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5ZRUFTVFMpe1xuICAgICAgICBsZXQgeWVhc3QgPSAocmVjaXBlLllFQVNUUy5ZRUFTVCAmJiByZWNpcGUuWUVBU1RTLllFQVNULmxlbmd0aCkgPyByZWNpcGUuWUVBU1RTLllFQVNUIDogcmVjaXBlLllFQVNUUztcbiAgICAgICAgICBfLmVhY2goeWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0Lk5BTUVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgZm9ybWF0WE1MOiBmdW5jdGlvbihjb250ZW50KXtcbiAgICAgIGxldCBodG1sY2hhcnMgPSBbXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMjgyOycsIHI6ICfEmid9LFxuICAgICAgICB7ZjogJyYjMjgzOycsIHI6ICfEmyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDQ7JywgcjogJ8WYJ30sXG4gICAgICAgIHtmOiAnJiMzNDU7JywgcjogJ8WZJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyYjMzY2OycsIHI6ICfFrid9LFxuICAgICAgICB7ZjogJyYjMzY3OycsIHI6ICfFryd9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMyNjQ7JywgcjogJ8SIJ30sXG4gICAgICAgIHtmOiAnJiMyNjU7JywgcjogJ8SJJ30sXG4gICAgICAgIHtmOiAnJiMyODQ7JywgcjogJ8ScJ30sXG4gICAgICAgIHtmOiAnJiMyODU7JywgcjogJ8SdJ30sXG4gICAgICAgIHtmOiAnJiMyOTI7JywgcjogJ8SkJ30sXG4gICAgICAgIHtmOiAnJiMyOTM7JywgcjogJ8SlJ30sXG4gICAgICAgIHtmOiAnJiMzMDg7JywgcjogJ8S0J30sXG4gICAgICAgIHtmOiAnJiMzMDk7JywgcjogJ8S1J30sXG4gICAgICAgIHtmOiAnJiMzNDg7JywgcjogJ8WcJ30sXG4gICAgICAgIHtmOiAnJiMzNDk7JywgcjogJ8WdJ30sXG4gICAgICAgIHtmOiAnJiMzNjQ7JywgcjogJ8WsJ30sXG4gICAgICAgIHtmOiAnJiMzNjU7JywgcjogJ8WtJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZPRWxpZzsnLCByOiAnxZInfSxcbiAgICAgICAge2Y6ICcmb2VsaWc7JywgcjogJ8WTJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNzY7JywgcjogJ8W4J30sXG4gICAgICAgIHtmOiAnJnl1bWw7JywgcjogJ8O/J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzI5NjsnLCByOiAnxKgnfSxcbiAgICAgICAge2Y6ICcmIzI5NzsnLCByOiAnxKknfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzM2MDsnLCByOiAnxagnfSxcbiAgICAgICAge2Y6ICcmIzM2MTsnLCByOiAnxaknfSxcbiAgICAgICAge2Y6ICcmIzMxMjsnLCByOiAnxLgnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzMzY7JywgcjogJ8WQJ30sXG4gICAgICAgIHtmOiAnJiMzMzc7JywgcjogJ8WRJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzY4OycsIHI6ICfFsCd9LFxuICAgICAgICB7ZjogJyYjMzY5OycsIHI6ICfFsSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmVEhPUk47JywgcjogJ8OeJ30sXG4gICAgICAgIHtmOiAnJnRob3JuOycsIHI6ICfDvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMyNTY7JywgcjogJ8SAJ30sXG4gICAgICAgIHtmOiAnJiMyNTc7JywgcjogJ8SBJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzQ7JywgcjogJ8SSJ30sXG4gICAgICAgIHtmOiAnJiMyNzU7JywgcjogJ8STJ30sXG4gICAgICAgIHtmOiAnJiMyOTA7JywgcjogJ8SiJ30sXG4gICAgICAgIHtmOiAnJiMyOTE7JywgcjogJ8SjJ30sXG4gICAgICAgIHtmOiAnJiMyOTg7JywgcjogJ8SqJ30sXG4gICAgICAgIHtmOiAnJiMyOTk7JywgcjogJ8SrJ30sXG4gICAgICAgIHtmOiAnJiMzMTA7JywgcjogJ8S2J30sXG4gICAgICAgIHtmOiAnJiMzMTE7JywgcjogJ8S3J30sXG4gICAgICAgIHtmOiAnJiMzMTU7JywgcjogJ8S7J30sXG4gICAgICAgIHtmOiAnJiMzMTY7JywgcjogJ8S8J30sXG4gICAgICAgIHtmOiAnJiMzMjU7JywgcjogJ8WFJ30sXG4gICAgICAgIHtmOiAnJiMzMjY7JywgcjogJ8WGJ30sXG4gICAgICAgIHtmOiAnJiMzNDI7JywgcjogJ8WWJ30sXG4gICAgICAgIHtmOiAnJiMzNDM7JywgcjogJ8WXJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNjI7JywgcjogJ8WqJ30sXG4gICAgICAgIHtmOiAnJiMzNjM7JywgcjogJ8WrJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmIzI2MDsnLCByOiAnxIQnfSxcbiAgICAgICAge2Y6ICcmIzI2MTsnLCByOiAnxIUnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI4MDsnLCByOiAnxJgnfSxcbiAgICAgICAge2Y6ICcmIzI4MTsnLCByOiAnxJknfSxcbiAgICAgICAge2Y6ICcmIzMyMTsnLCByOiAnxYEnfSxcbiAgICAgICAge2Y6ICcmIzMyMjsnLCByOiAnxYInfSxcbiAgICAgICAge2Y6ICcmIzMyMzsnLCByOiAnxYMnfSxcbiAgICAgICAge2Y6ICcmIzMyNDsnLCByOiAnxYQnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDY7JywgcjogJ8WaJ30sXG4gICAgICAgIHtmOiAnJiMzNDc7JywgcjogJ8WbJ30sXG4gICAgICAgIHtmOiAnJiMzNzc7JywgcjogJ8W5J30sXG4gICAgICAgIHtmOiAnJiMzNzg7JywgcjogJ8W6J30sXG4gICAgICAgIHtmOiAnJiMzNzk7JywgcjogJ8W7J30sXG4gICAgICAgIHtmOiAnJiMzODA7JywgcjogJ8W8J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmIzI1ODsnLCByOiAnxIInfSxcbiAgICAgICAge2Y6ICcmIzI1OTsnLCByOiAnxIMnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJiMzNTQ7JywgcjogJ8WiJ30sXG4gICAgICAgIHtmOiAnJiMzNTU7JywgcjogJ8WjJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzMwOycsIHI6ICfFiid9LFxuICAgICAgICB7ZjogJyYjMzMxOycsIHI6ICfFiyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU4OycsIHI6ICfFpid9LFxuICAgICAgICB7ZjogJyYjMzU5OycsIHI6ICfFpyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMzEzOycsIHI6ICfEuSd9LFxuICAgICAgICB7ZjogJyYjMzE0OycsIHI6ICfEuid9LFxuICAgICAgICB7ZjogJyYjMzE3OycsIHI6ICfEvSd9LFxuICAgICAgICB7ZjogJyYjMzE4OycsIHI6ICfEvid9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyYjMzQwOycsIHI6ICfFlCd9LFxuICAgICAgICB7ZjogJyYjMzQxOycsIHI6ICfFlSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJiMyODY7JywgcjogJ8SeJ30sXG4gICAgICAgIHtmOiAnJiMyODc7JywgcjogJ8SfJ30sXG4gICAgICAgIHtmOiAnJiMzMDQ7JywgcjogJ8SwJ30sXG4gICAgICAgIHtmOiAnJiMzMDU7JywgcjogJ8SxJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmV1cm87JywgcjogJ+KCrCd9LFxuICAgICAgICB7ZjogJyZwb3VuZDsnLCByOiAnwqMnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZidWxsOycsIHI6ICfigKInfSxcbiAgICAgICAge2Y6ICcmZGFnZ2VyOycsIHI6ICfigKAnfSxcbiAgICAgICAge2Y6ICcmY29weTsnLCByOiAnwqknfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZ0cmFkZTsnLCByOiAn4oSiJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmcGVybWlsOycsIHI6ICfigLAnfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmbmRhc2g7JywgcjogJ+KAkyd9LFxuICAgICAgICB7ZjogJyZtZGFzaDsnLCByOiAn4oCUJ30sXG4gICAgICAgIHtmOiAnJiM4NDcwOycsIHI6ICfihJYnfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZwYXJhOycsIHI6ICfCtid9LFxuICAgICAgICB7ZjogJyZwbHVzbW47JywgcjogJ8KxJ30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICdsZXNzLXQnLCByOiAnPCd9LFxuICAgICAgICB7ZjogJ2dyZWF0ZXItdCcsIHI6ICc+J30sXG4gICAgICAgIHtmOiAnJm5vdDsnLCByOiAnwqwnfSxcbiAgICAgICAge2Y6ICcmY3VycmVuOycsIHI6ICfCpCd9LFxuICAgICAgICB7ZjogJyZicnZiYXI7JywgcjogJ8KmJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmYWN1dGU7JywgcjogJ8K0J30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnwqgnfSxcbiAgICAgICAge2Y6ICcmbWFjcjsnLCByOiAnwq8nfSxcbiAgICAgICAge2Y6ICcmY2VkaWw7JywgcjogJ8K4J30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmc3VwMTsnLCByOiAnwrknfSxcbiAgICAgICAge2Y6ICcmc3VwMjsnLCByOiAnwrInfSxcbiAgICAgICAge2Y6ICcmc3VwMzsnLCByOiAnwrMnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnaHk7XHQnLCByOiAnJid9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmYW1wOycsIHI6ICdhbmQnfSxcbiAgICAgICAge2Y6ICcmbGRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyc3F1bzsnLCByOiBcIidcIn1cbiAgICAgIF07XG5cbiAgICAgIF8uZWFjaChodG1sY2hhcnMsIGZ1bmN0aW9uKGNoYXIpIHtcbiAgICAgICAgaWYoY29udGVudC5pbmRleE9mKGNoYXIuZikgIT09IC0xKXtcbiAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKFJlZ0V4cChjaGFyLmYsJ2cnKSwgY2hhci5yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9zZXJ2aWNlcy5qcyJdLCJzb3VyY2VSb290IjoiIn0=