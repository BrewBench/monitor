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
      heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false },
      temp: { pin: 'A0', type: 'Thermistor', hit: false, current: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[0].target, diff: $scope.kettleTypes[0].diff },
      values: [],
      timers: [],
      knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[0].target + $scope.kettleTypes[0].diff }),
      arduino: $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : null,
      error: { message: '', version: '' }
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
          kettle.error.message = $sce.trustAsHtml('Connection error: ' + message);
          $scope.updateKnobCopy(kettle);
        } else {
          $scope.error.message = $sce.trustAsHtml('Error: ' + message);
        }
      } else if (kettle) {
        kettle.error.message = 'Error connecting to ' + BrewService.domain(kettle.arduino);
      } else {
        $scope.error.message = $sce.trustAsHtml('Connection error:');
      }
    }
  };

  $scope.resetError = function (kettle) {
    if (kettle) {
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
      if (kettle.heater && kettle.heater.sketch) hasASketch = true;else if (kettle.cooler && kettle.cooler.sketch) hasASketch = true;
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
        return $scope.setErrorMessage(err, kettle);
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
    var actions = '';
    var tplink_connection_string = BrewService.tplink().connection();
    var kettles = _.filter($scope.kettles, { sketch: true });
    _.each(kettles, function (kettle, i) {
      if (kettle.temp.type == 'Thermistor') actions += 'temp = thermistorAutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DS18B20') actions += 'temp = ds18B20AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'PT100') actions += 'temp = pt100AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT11') actions += 'temp = dht11AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT21') actions += 'temp = dht21AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT22') actions += 'temp = dht22AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';
      //look for triggers
      var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      if (kettle.heater && kettle.heater.sketch) actions += 'trigger("heat","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.heater.pin + '",temp,' + target + ',' + kettle.temp.diff + ');\n';
      if (kettle.cooler && kettle.cooler.sketch) actions += 'trigger("cool","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.cooler.pin + '",temp,' + target + ',' + kettle.temp.diff + ');\n';
    });
    return $http.get('assets/arduino/BrewBenchAutoYun/BrewBenchAutoYun.ino').then(function (response) {
      // replace variables
      response.data = response.data.replace('// [actions]', actions).replace('[TPLINK_CONNECTION]', tplink_connection_string).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
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

    var actions = '';
    var connection_string = '' + $scope.settings.influxdb.url;
    if (!!$scope.settings.influxdb.port) connection_string += ':' + $scope.settings.influxdb.port;
    connection_string += '/write?';
    // add user/pass
    if (!!$scope.settings.influxdb.user && !!$scope.settings.influxdb.pass) connection_string += 'u=' + $scope.settings.influxdb.user + '&p=' + $scope.settings.influxdb.pass + '&';
    // add db
    connection_string += 'db=' + ($scope.settings.influxdb.db || 'session-' + moment().format('YYYY-MM-DD'));
    var tplink_connection_string = BrewService.tplink().connection();

    _.each($scope.kettles, function (kettle, i) {
      if (kettle.temp.type == 'Thermistor') actions += 'temp = thermistorInfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DS18B20') actions += 'temp = ds18B20InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'PT100') actions += 'temp = pt100InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT11') actions += 'temp = dht11InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT21') actions += 'temp = dht21InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT22') actions += 'temp = dht22InfluxDBCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';
      //look for triggers
      var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      if (kettle.heater && kettle.heater.sketch) actions += 'trigger("heat","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.heater.pin + '",temp,' + target + ',' + kettle.temp.diff + ');\n';
      if (kettle.cooler && kettle.cooler.sketch) actions += 'trigger("cool","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.cooler.pin + '",temp,' + target + ',' + kettle.temp.diff + ');\n';
    });
    return $http.get('assets/arduino/BrewBenchInfluxDBYun/BrewBenchInfluxDBYun.ino').then(function (response) {
      // replace variables
      response.data = response.data.replace('// [actions]', actions).replace('[INFLUXDB_CONNECTION]', connection_string).replace('[TPLINK_CONNECTION]', tplink_connection_string).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
      var streamSketch = document.createElement('a');
      streamSketch.setAttribute('download', 'BrewBenchInfluxDBYun.ino');
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

  $(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

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
        recipe: { 'name': '', 'brewer': { name: '', 'email': '' }, 'yeast': [], 'hops': [], 'malt': [], scale: 'gravity', method: 'papazian', 'og': 1.050, 'fg': 1.010, 'abv': 0, 'abw': 0, 'calories': 0, 'attenuation': 0 },
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
        sketches: { frequency: 60, ignore_version_error: false }
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
        error: { message: '', version: '' }
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
        error: { message: '', version: '' }
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
        error: { message: '', version: '' }
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
        connection: function connection() {
          var settings = _this.settings('settings');
          if (settings.tplink.token) {
            params.token = settings.tplink.token;
            return url + '?' + jQuery.param(params);
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

},[180]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtIiwidmFsdWVzIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwiaW5mbyIsInBsdWciLCJzeXNpbmZvIiwiSlNPTiIsInBhcnNlIiwicmVzcG9uc2VEYXRhIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJkZXZpY2UiLCJ0b2dnbGUiLCJyZWxheV9zdGF0ZSIsIm9mZiIsIm9uIiwiYWRkS2V0dGxlIiwia2V5IiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwiaGl0IiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJ2ZXJzaW9uIiwiaGFzU3RpY2t5S2V0dGxlcyIsImtldHRsZUNvdW50IiwiYWN0aXZlS2V0dGxlcyIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwicGluSW5Vc2UiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwidGVzdEluZmx1eERCIiwiaW5mbHV4ZGIiLCJjb25uZWN0ZWQiLCJwaW5nIiwic3RhdHVzIiwiJCIsInJlbW92ZUNsYXNzIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJyZW1vdmUiLCJkYiIsImFkZENsYXNzIiwiY3JlYXRlSW5mbHV4REIiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJzaGFyZUFjY2VzcyIsInNoYXJlZCIsImZyYW1lRWxlbWVudCIsImxvYWRTaGFyZUZpbGUiLCJjb250ZW50cyIsIm5vdGlmaWNhdGlvbnMiLCJoaWdoIiwibG93Iiwic2xhY2siLCJsYXN0Iiwic3ViVGV4dCIsImVuYWJsZWQiLCJ0ZXh0IiwiY29sb3IiLCJmb250IiwicHJvY2Vzc1RlbXBzIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImdyYWluIiwiYWRkVGltZXIiLCJsYWJlbCIsIm5vdGVzIiwiTnVtYmVyIiwiYW1vdW50IiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJwa2ciLCJza2V0Y2hfdmVyc2lvbiIsImJiX3ZlcnNpb24iLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsImRvbWFpbiIsInVwZGF0ZVRlbXAiLCJ0ZW1wcyIsInVuaXQiLCJNYXRoIiwicm91bmQiLCJodW1pZGl0eSIsImdldFRpbWUiLCJhbGVydCIsImdldE5hdk9mZnNldCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsImtub2JDbGljayIsInN0YXJ0U3RvcEtldHRsZSIsInJlYWRPbmx5IiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImlnbm9yZVZlcnNpb25FcnJvciIsInNrZXRjaGVzIiwiaWdub3JlX3ZlcnNpb25fZXJyb3IiLCJkb3dubG9hZEF1dG9Ta2V0Y2giLCJhY3Rpb25zIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImdldCIsImZyZXF1ZW5jeSIsInBhcnNlSW50Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsImNsaWNrIiwiZG93bmxvYWRJbmZsdXhEQlNrZXRjaCIsImNvbm5lY3Rpb25fc3RyaW5nIiwicG9ydCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJib2R5IiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJrZXR0bGVUeXBlIiwiY2hhbmdlVW5pdHMiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsIiR3YXRjaCIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJyZWFkeSIsInRvb2x0aXAiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJ0cmltIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsInRvU3RyaW5nIiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwicGhyYXNlIiwiUmVnRXhwIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJsYXlvdXQiLCJjaGFydCIsImFjY291bnQiLCJhcGlLZXkiLCJzZXNzaW9ucyIsInNlY3VyZSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiQXV0aG9yaXphdGlvbiIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIngiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdC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ZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXpmYyxFQTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkFqZCxRQUFFa0QsSUFBRixDQUFPNlosU0FBUCxFQUFrQixVQUFTRyxJQUFULEVBQWU7QUFDL0IsWUFBR0osUUFBUWxkLE9BQVIsQ0FBZ0JzZCxLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUW5kLE9BQVIsQ0FBZ0I0VSxPQUFPMkksS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUFsM0NJLEdBQVA7QUFvM0NELENBdjNDRCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xuICB9LDEwMDApO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGxcbiAgLHJlc2V0Q2hhcnQgPSAxMDBcbiAgLHRpbWVvdXQgPSBudWxsOy8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5rZXR0bGVUeXBlcyA9IEJyZXdTZXJ2aWNlLmtldHRsZVR5cGVzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKCk7XG4kc2NvcGUuc2Vuc29yVHlwZXMgPSBCcmV3U2VydmljZS5zZW5zb3JUeXBlcztcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogNSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYoISFsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiRzY29wZS5zaGFyZSA9ICghJHN0YXRlLnBhcmFtcy5maWxlICYmIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpKSA/IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpIDoge1xuICAgICAgZmlsZTogJHN0YXRlLnBhcmFtcy5maWxlIHx8IG51bGxcbiAgICAgICwgcGFzc3dvcmQ6IG51bGxcbiAgICAgICwgbmVlZFBhc3N3b3JkOiBmYWxzZVxuICAgICAgLCBhY2Nlc3M6ICdyZWFkT25seSdcbiAgICAgICwgZGVsZXRlQWZ0ZXI6IDE0XG4gIH07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW0oXy52YWx1ZXMob2JqKSk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxM1xuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mb1xuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgbGV0IHN5c2luZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgIHBsdWcuaW5mbyA9IHN5c2luZm87XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICBpZihkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxKXtcbiAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAwO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gMTtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBrZXk6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IG51bGxcbiAgICAgICAgLGVycm9yOiB7bWVzc2FnZTonJyx2ZXJzaW9uOicnfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24ocGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIGxldCBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2VcbiAgICAgICAgcmV0dXJuIHBpbjtcbiAgfTtcblxuICAkc2NvcGUucGluSW5Vc2UgPSBmdW5jdGlvbihwaW4sYW5hbG9nKXtcbiAgICB2YXIga2V0dGxlID0gXy5maW5kKCRzY29wZS5rZXR0bGVzLCBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgKGFuYWxvZyAmJiBrZXR0bGUudGVtcC50eXBlPT0nVGhlcm1pc3RvcicgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS50ZW1wLnR5cGU9PSdEUzE4QjIwJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKGtldHRsZS50ZW1wLnR5cGU9PSdQVDEwMCcgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYgIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiBrZXR0bGUgfHwgZmFsc2U7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZVNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIuZW1haWwpXG4gICAgICByZXR1cm47XG4gICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICdDcmVhdGluZyBzaGFyZSBsaW5rLi4uJztcbiAgICByZXR1cm4gQnJld1NlcnZpY2UuY3JlYXRlU2hhcmUoJHNjb3BlLnNoYXJlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYocmVzcG9uc2Uuc2hhcmUgJiYgcmVzcG9uc2Uuc2hhcmUudXJsKXtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJyc7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9saW5rID0gcmVzcG9uc2Uuc2hhcmUudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS50ZXN0SW5mbHV4REIgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gdHJ1ZTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCl7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBsZXQgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZUluZmx1eERCID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IGZhbHNlO1xuICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIC8vIHByb21wdCBmb3IgcGFzc3dvcmRcbiAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBpZihlcnIuc3RhdHVzID09IDQwMSB8fCBlcnIuc3RhdHVzID09IDQwMyl7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVBY2Nlc3MgPSBmdW5jdGlvbihhY2Nlc3Mpe1xuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAgIGlmKGFjY2Vzcyl7XG4gICAgICAgICAgaWYoYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gISEoJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFNoYXJlRmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICRzY29wZS5zZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5sb2FkU2hhcmVGaWxlKCRzY29wZS5zaGFyZS5maWxlLCAkc2NvcGUuc2hhcmUucGFzc3dvcmQgfHwgbnVsbClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGlmKGNvbnRlbnRzKXtcbiAgICAgICAgICBpZihjb250ZW50cy5uZWVkUGFzc3dvcmQpe1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IHRydWU7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncy5yZWNpcGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlID0gY29udGVudHMuc2V0dGluZ3MucmVjaXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gZmFsc2U7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zaGFyZSAmJiBjb250ZW50cy5zaGFyZS5hY2Nlc3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2hhcmUuYWNjZXNzID0gY29udGVudHMuc2hhcmUuYWNjZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBjb250ZW50cy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMgPSB7b246ZmFsc2UsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMua2V0dGxlcyl7XG4gICAgICAgICAgICAgIF8uZWFjaChjb250ZW50cy5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAgICAgICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMDArNSxzdWJUZXh0OntlbmFibGVkOiB0cnVlLHRleHQ6ICdzdGFydGluZy4uLicsY29sb3I6ICdncmF5Jyxmb250OiAnYXV0byd9fSk7XG4gICAgICAgICAgICAgICAga2V0dGxlLnZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXMgPSBjb250ZW50cy5rZXR0bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBsb2FkaW5nIHRoZSBzaGFyZWQgc2Vzc2lvbi5cIik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoISFmb3JtYXR0ZWRfY29udGVudCl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZighIWpzb25PYmouUmVjaXBlcyAmJiAhIWpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoISFqc29uT2JqLlNlbGVjdGlvbnMgJiYgISFqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZighIWpzb25PYmouUkVDSVBFUyAmJiAhIWpzb25PYmouUkVDSVBFUy5SRUNJUEUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZighIXJlY2lwZS5vZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKCEhcmVjaXBlLmZnKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IHJlY2lwZS5ncmFpbnM7XG4gICAgICAgIGxldCBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IHt9O1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdW0gdGhlIGFtb3VudHMgZm9yIHRoZSBncmFpbnNcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWluc1tncmFpbi5sYWJlbF0pXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWluc1tncmFpbi5sYWJlbF0gKz0gTnVtYmVyKGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdID0gTnVtYmVyKGdyYWluLmFtb3VudCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IHt9O1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN1bSB0aGUgYW1vdW50cyBmb3IgdGhlIGhvcHNcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSlcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wc1tob3AubGFiZWxdICs9IE51bWJlcihob3AuYW1vdW50KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSA9IE51bWJlcihob3AuYW1vdW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbiA9IHJlc3BvbnNlLnZlcnNpb247XG4gICAgICAgICAgfSBlbHNlIGlmKCRzY29wZS5zZXR0aW5ncy5iYl92ZXJzaW9uICE9IHJlc3BvbnNlLnZlcnNpb24pe1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnaW5mbyc7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKCdUaGVyZSBpcyBhIG5ldyB2ZXJzaW9uIGF2YWlsYWJsZSBmb3IgQnJld0JlbmNoLiBQbGVhc2UgPGEgaHJlZj1cIiMvcmVzZXRcIj5jbGVhcjwvYT4geW91ciBzZXR0aW5ncy4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuZ3JhaW5zKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLmdyYWlucygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuZ3JhaW5zID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmhvcHMpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmhvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmhvcHMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUud2F0ZXIpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLndhdGVyKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS53YXRlciA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCdzYWx0JyksJ3NhbHQnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5sb3ZpYm9uZCl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UubG92aWJvbmQoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvdmlib25kID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAkcS5hbGwoY29uZmlnKTtcbn07XG5cbiAgLy8gY2hlY2sgaWYgcHVtcCBvciBoZWF0ZXIgYXJlIHJ1bm5pbmdcbiAgJHNjb3BlLmluaXQgPSAoKSA9PiB7XG4gICAgJHNjb3BlLnNob3dTZXR0aW5ncyA9ICEkc2NvcGUuc2V0dGluZ3Muc2hhcmVkO1xuICAgIGlmKCRzY29wZS5zaGFyZS5maWxlKVxuICAgICAgcmV0dXJuICRzY29wZS5sb2FkU2hhcmVGaWxlKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIG1heFxuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICAgLy8gY2hlY2sgdGltZXJzIGZvciBydW5uaW5nXG4gICAgICAgIGlmKCEha2V0dGxlLnRpbWVycyAmJiBrZXR0bGUudGltZXJzLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKGtldHRsZS50aW1lcnMsIHRpbWVyID0+IHtcbiAgICAgICAgICAgIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRpbWVyLnJ1bm5pbmcgJiYgdGltZXIucXVldWUpe1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnVwLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIudXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5zZXRFcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihlcnIsIGtldHRsZSl7XG4gICAgaWYoISEkc2NvcGUuc2V0dGluZ3Muc2hhcmVkKXtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ3dhcm5pbmcnO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdUaGUgbW9uaXRvciBzZWVtcyB0byBiZSBvZmYtbGluZSwgcmUtY29ubmVjdGluZy4uLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbWVzc2FnZTtcblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJyAmJiBlcnIuaW5kZXhPZigneycpICE9PSAtMSl7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBlcnIgPSBKU09OLnBhcnNlKGVycik7XG4gICAgICAgIGlmKCFPYmplY3Qua2V5cyhlcnIpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnKVxuICAgICAgICBtZXNzYWdlID0gZXJyO1xuICAgICAgZWxzZSBpZighIWVyci5zdGF0dXNUZXh0KVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlbHNlIGlmKGVyci5jb25maWcgJiYgZXJyLmNvbmZpZy51cmwpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29uZmlnLnVybDtcbiAgICAgIGVsc2UgaWYoZXJyLnZlcnNpb24pe1xuICAgICAgICBpZihrZXR0bGUpIGtldHRsZS5lcnJvci52ZXJzaW9uID0gZXJyLnZlcnNpb247XG4gICAgICAgIG1lc3NhZ2UgPSAnU2tldGNoIFZlcnNpb24gaXMgb3V0IG9mIGRhdGUuICA8YSBocmVmPVwiXCIgZGF0YS10b2dnbGU9XCJtb2RhbFwiIGRhdGEtdGFyZ2V0PVwiI3NldHRpbmdzTW9kYWxcIj5Eb3dubG9hZCBoZXJlPC9hPi4nK1xuICAgICAgICAgICc8YnIvPllvdXIgVmVyc2lvbjogJytlcnIudmVyc2lvbitcbiAgICAgICAgICAnPGJyLz5DdXJyZW50IFZlcnNpb246ICcrJHNjb3BlLnNldHRpbmdzLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KGVycik7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gJ3t9JykgbWVzc2FnZSA9ICcnO1xuICAgICAgfVxuXG4gICAgICBpZighIW1lc3NhZ2Upe1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgQ29ubmVjdGlvbiBlcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbChgRXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS5lcnJvci5tZXNzYWdlID0gYEVycm9yIGNvbm5lY3RpbmcgdG8gJHtCcmV3U2VydmljZS5kb21haW4oa2V0dGxlLmFyZHVpbm8pfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ0Nvbm5lY3Rpb24gZXJyb3I6Jyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZXNldEVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBpZihrZXR0bGUpIHtcbiAgICAgIGtldHRsZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlVGVtcCA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBrZXR0bGUpe1xuICAgIGlmKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UudGVtcCl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgIHZhciB0ZW1wcyA9IFtdO1xuICAgIC8vY2hhcnQgZGF0ZVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAvLyB0ZW1wIHJlc3BvbnNlIGlzIGluIENcbiAgICBrZXR0bGUudGVtcC5wcmV2aW91cyA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdCA9PSAnRicpID9cbiAgICAgICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHJlc3BvbnNlLnRlbXApIDpcbiAgICAgIE1hdGgucm91bmQocmVzcG9uc2UudGVtcCk7XG4gICAga2V0dGxlLnRlbXAuY3VycmVudCA9IGtldHRsZS50ZW1wLnByZXZpb3VzK2tldHRsZS50ZW1wLmFkanVzdDtcblxuICAgIC8vcmVzZXQgYWxsIGtldHRsZXMgZXZlcnkgcmVzZXRDaGFydFxuICAgIGlmKGtldHRsZS52YWx1ZXMubGVuZ3RoID4gcmVzZXRDaGFydCl7XG4gICAgICAkc2NvcGUua2V0dGxlcy5tYXAoKGspID0+IHtcbiAgICAgICAgcmV0dXJuIGsudmFsdWVzPVtdO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9ESFQxMSBzZW5zb3IgaGFzIGh1bWlkaXR5XG4gICAgaWYoIHJlc3BvbnNlLmh1bWlkaXR5ICl7XG4gICAgICBrZXR0bGUuaHVtaWRpdHkgPSByZXNwb25zZS5odW1pZGl0eTtcbiAgICB9XG5cbiAgICBrZXR0bGUudmFsdWVzLnB1c2goW2RhdGUuZ2V0VGltZSgpLGtldHRsZS50ZW1wLmN1cnJlbnRdKTtcblxuICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIGNoaWxsZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmICFrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpLnRoZW4oY29vbGVyID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSAvL2lzIHRlbXAgdG9vIGxvdz9cbiAgICBlbHNlIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlKTtcbiAgICAgIC8vc3RhcnQgdGhlIGhlYXRpbmcgZWxlbWVudFxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmICFrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpLnRoZW4oaGVhdGluZyA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyMDAsNDcsNDcsMSknO1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmICFrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2l0aGluIHRhcmdldCFcbiAgICAgIGtldHRsZS50ZW1wLmhpdD1uZXcgRGF0ZSgpOy8vc2V0IHRoZSB0aW1lIHRoZSB0YXJnZXQgd2FzIGhpdCBzbyB3ZSBjYW4gbm93IHN0YXJ0IGFsZXJ0c1xuICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSk7XG4gICAgICAvL3N0b3AgdGhlIGhlYXRlclxuICAgICAgaWYoa2V0dGxlLmhlYXRlci5hdXRvICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcS5hbGwodGVtcHMpO1xuICB9O1xuXG4gICRzY29wZS5nZXROYXZPZmZzZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAxMjUrYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZiYXInKSlbMF0ub2Zmc2V0SGVpZ2h0O1xuICB9O1xuXG4gICRzY29wZS5hZGRUaW1lciA9IGZ1bmN0aW9uKGtldHRsZSxvcHRpb25zKXtcbiAgICBpZigha2V0dGxlLnRpbWVycylcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgaWYob3B0aW9ucyl7XG4gICAgICBvcHRpb25zLm1pbiA9IG9wdGlvbnMubWluID8gb3B0aW9ucy5taW4gOiAwO1xuICAgICAgb3B0aW9ucy5zZWMgPSBvcHRpb25zLnNlYyA/IG9wdGlvbnMuc2VjIDogMDtcbiAgICAgIG9wdGlvbnMucnVubmluZyA9IG9wdGlvbnMucnVubmluZyA/IG9wdGlvbnMucnVubmluZyA6IGZhbHNlO1xuICAgICAgb3B0aW9ucy5xdWV1ZSA9IG9wdGlvbnMucXVldWUgPyBvcHRpb25zLnF1ZXVlIDogZmFsc2U7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2gob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaCh7bGFiZWw6J0VkaXQgbGFiZWwnLG1pbjo2MCxzZWM6MCxydW5uaW5nOmZhbHNlLHF1ZXVlOmZhbHNlfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5yZW1vdmVUaW1lcnMgPSBmdW5jdGlvbihlLGtldHRsZSl7XG4gICAgdmFyIGJ0biA9IGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCk7XG4gICAgaWYoYnRuLmhhc0NsYXNzKCdmYS10cmFzaCcpKSBidG4gPSBidG4ucGFyZW50KCk7XG5cbiAgICBpZighYnRuLmhhc0NsYXNzKCdidG4tZGFuZ2VyJykpe1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tbGlnaHQnKS5hZGRDbGFzcygnYnRuLWRhbmdlcicpO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAgfSwyMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdidG4tZGFuZ2VyJykuYWRkQ2xhc3MoJ2J0bi1saWdodCcpO1xuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVBXTSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBrZXR0bGUucHdtID0gIWtldHRsZS5wd207XG4gICAgICBpZihrZXR0bGUucHdtKVxuICAgICAgICBrZXR0bGUuc3NyID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlS2V0dGxlID0gZnVuY3Rpb24oaXRlbSwga2V0dGxlKXtcblxuICAgIHZhciBrO1xuXG4gICAgc3dpdGNoIChpdGVtKSB7XG4gICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgayA9IGtldHRsZS5oZWF0ZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgIGsgPSBrZXR0bGUuY29vbGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICBrID0ga2V0dGxlLnB1bXA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmKCFrKVxuICAgICAgcmV0dXJuO1xuXG4gICAgay5ydW5uaW5nID0gIWsucnVubmluZztcblxuICAgIGlmKGtldHRsZS5hY3RpdmUgJiYgay5ydW5uaW5nKXtcbiAgICAgIC8vc3RhcnQgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYoIWsucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGhlIHJlbGF5XG4gICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5oYXNTa2V0Y2hlcyA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgbGV0IGhhc0FTa2V0Y2ggPSBmYWxzZTtcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKVxuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIGVsc2UgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaClcbiAgICAgICAgaGFzQVNrZXRjaCA9IHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhc0FTa2V0Y2g7XG4gIH07XG5cbiAgJHNjb3BlLmtub2JDbGljayA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAvL3NldCBhZGp1c3RtZW50IGFtb3VudFxuICAgICAgaWYoISFrZXR0bGUudGVtcC5wcmV2aW91cyl7XG4gICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IGtldHRsZS50ZW1wLmN1cnJlbnQgLSBrZXR0bGUudGVtcC5wcmV2aW91cztcbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3RhcnRTdG9wS2V0dGxlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5hY3RpdmUgPSAha2V0dGxlLmFjdGl2ZTtcbiAgICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG5cbiAgICAgIGlmKGtldHRsZS5hY3RpdmUpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnc3RhcnRpbmcuLi4nO1xuICAgICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IGZhbHNlO1xuXG4gICAgICAgIEJyZXdTZXJ2aWNlLnRlbXAoa2V0dGxlKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCBrZXR0bGUpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSByZWxheXNcbiAgICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IHRydWU7XG4gICAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgcHVtcFxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSAmJiBrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUucHVtcCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAgICAgIGlmKGtldHRsZS5wdW1wKSBrZXR0bGUucHVtcC5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5oZWF0ZXIpIGtldHRsZS5oZWF0ZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICBpZihrZXR0bGUuY29vbGVyKSBrZXR0bGUuY29vbGVyLmF1dG89ZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUmVsYXkgPSBmdW5jdGlvbihrZXR0bGUsIGVsZW1lbnQsIG9uKXtcbiAgICBpZihvbikge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20pe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sTWF0aC5yb3VuZCgyNTUqZWxlbWVudC5kdXR5Q3ljbGUvMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSBpZihlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwyNTUpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDEpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9dHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGVsZW1lbnQucGluLmluZGV4T2YoJ1RQLScpPT09MCl7XG4gICAgICAgIGxldCBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogZWxlbWVudC5waW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZWxlbWVudC5wd20gfHwgZWxlbWVudC5zc3Ipe1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuYW5hbG9nKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UuZGlnaXRhbChrZXR0bGUsIGVsZW1lbnQucGluLDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPWZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS5pbXBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcbiAgICB0cnkge1xuICAgICAgbGV0IHByb2ZpbGVDb250ZW50ID0gSlNPTi5wYXJzZSgkZmlsZUNvbnRlbnQpO1xuICAgICAgJHNjb3BlLnNldHRpbmdzID0gcHJvZmlsZUNvbnRlbnQuc2V0dGluZ3MgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAgICRzY29wZS5rZXR0bGVzID0gcHJvZmlsZUNvbnRlbnQua2V0dGxlcyB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAvLyBlcnJvciBpbXBvcnRpbmdcbiAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5leHBvcnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCl7XG4gICAgbGV0IGtldHRsZXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmtldHRsZXMpO1xuICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBrZXR0bGVzW2ldLnZhbHVlcyA9IFtdO1xuICAgICAga2V0dGxlc1tpXS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHtcInNldHRpbmdzXCI6ICRzY29wZS5zZXR0aW5ncyxcImtldHRsZXNcIjoga2V0dGxlc30pKTtcbiAgfTtcblxuICAkc2NvcGUuaWdub3JlVmVyc2lvbkVycm9yID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgPSB0cnVlO1xuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG4gIH07XG5cbiAgJHNjb3BlLmRvd25sb2FkQXV0b1NrZXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgbGV0IGFjdGlvbnMgPSAnJztcbiAgICBsZXQgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIGxldCBrZXR0bGVzID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3NrZXRjaDp0cnVlfSk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSB0aGVybWlzdG9yQXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiLCcra2V0dGxlLnRlbXAuYWRqdXN0KycpO1xcbic7XG4gICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdEUzE4QjIwJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkczE4QjIwQXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiLCcra2V0dGxlLnRlbXAuYWRqdXN0KycpO1xcbic7XG4gICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gcHQxMDBBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDExJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQxMUF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIiwnK2tldHRsZS50ZW1wLmFkanVzdCsnKTtcXG4nO1xuICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnREhUMjEnIClcbiAgICAgICAgYWN0aW9ucyArPSAndGVtcCA9IGRodDIxQXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiLCcra2V0dGxlLnRlbXAuYWRqdXN0KycpO1xcbic7XG4gICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdESFQyMicgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gZGh0MjJBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaClcbiAgICAgICAgYWN0aW9ucyArPSAndHJpZ2dlcihcImhlYXRcIixcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS5oZWF0ZXIucGluKydcIix0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycpO1xcbic7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKVxuICAgICAgICBhY3Rpb25zICs9ICd0cmlnZ2VyKFwiY29vbFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJyk7XFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby9CcmV3QmVuY2hBdXRvWXVuL0JyZXdCZW5jaEF1dG9ZdW4uaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2FjdGlvbnNdJywgYWN0aW9ucylcbiAgICAgICAgICAucmVwbGFjZSgnW1RQTElOS19DT05ORUNUSU9OXScsIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW0ZSRVFVRU5DWV9TRUNPTkRTXScsICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3kgPyBwYXJzZUludCgkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5LDEwKSA6IDYwKTtcbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnQnJld0JlbmNoQXV0b1l1bi5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5kb3dubG9hZEluZmx1eERCU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybCkgcmV0dXJuO1xuXG4gICAgbGV0IGFjdGlvbnMgPSAnJztcbiAgICBsZXQgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgaWYoICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAvLyBhZGQgZGJcbiAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgIGxldCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSB0aGVybWlzdG9ySW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIiwnK2tldHRsZS50ZW1wLmFkanVzdCsnKTtcXG4nO1xuICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gZHMxOEIyMEluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBwdDEwMEluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDExJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQxMUluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIxJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQyMUluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIyJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQyMkluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaClcbiAgICAgICAgYWN0aW9ucyArPSAndHJpZ2dlcihcImhlYXRcIixcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS5oZWF0ZXIucGluKydcIix0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycpO1xcbic7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKVxuICAgICAgICBhY3Rpb25zICs9ICd0cmlnZ2VyKFwiY29vbFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJyk7XFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby9CcmV3QmVuY2hJbmZsdXhEQll1bi9CcmV3QmVuY2hJbmZsdXhEQll1bi5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbYWN0aW9uc10nLCBhY3Rpb25zKVxuICAgICAgICAgIC5yZXBsYWNlKCdbSU5GTFVYREJfQ09OTkVDVElPTl0nLCBjb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW1RQTElOS19DT05ORUNUSU9OXScsIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW0ZSRVFVRU5DWV9TRUNPTkRTXScsICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3kgPyBwYXJzZUludCgkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5LDEwKSA6IDYwKTtcbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnQnJld0JlbmNoSW5mbHV4REJZdW4uaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBsZXQgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9ICdZb3VyICcra2V0dGxlLmtleSsnIGtldHRsZSBpcyAnKyhrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0gJ1lvdXIgJytrZXR0bGUua2V5Kycga2V0dGxlIGlzICcrKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9ICdZb3VyICcra2V0dGxlLmtleSsnIGtldHRsZSBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2tldHRsZS50ZW1wLmN1cnJlbnQrJ1xcdTAwQjAnO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBwcmV2aW91cyBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLmtleSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLmtleSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjEpJztcbiAgICAgIGtldHRsZS5oaWdoID0ga2V0dGxlLnRlbXAuY3VycmVudC1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC41KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuMSknO1xuICAgICAga2V0dGxlLmxvdyA9IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IChrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgICAvLyB1cGRhdGUgc3VidGV4dCB0byBpbmNsdWRlIGh1bWlkaXR5XG4gICAgaWYoa2V0dGxlLmh1bWlkaXR5KXtcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IGtldHRsZS5odW1pZGl0eSsnJSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpXG4gICAgICByZXR1cm47XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICAvLyB1cGRhdGUga25vYlxuICAgICAgICBrZXR0bGUua25vYi52YWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKzEwO1xuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh1bml0KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZighIWtldHRsZSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwgJHNjb3BlLmtldHRsZXNbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEuYWxsKGFsbFNlbnNvcnMpXG4gICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAvL3JlIHByb2Nlc3Mgb24gdGltZW91dFxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKCEhbG9hZGVkKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcbiAgLy8gc2NvcGUgd2F0Y2hcbiAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcblxuICAkc2NvcGUuJHdhdGNoKCdrZXR0bGVzJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcblxuICAkc2NvcGUuJHdhdGNoKCdzaGFyZScsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICQoIGRvY3VtZW50ICkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKTtcbiAgfSk7XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gISFzY29wZS50eXBlID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cblx0XHRcdGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKG9uQ2hhbmdlRXZlbnQpIHtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgZWxlbWVudC52YWwobnVsbCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlLnRvU3RyaW5nKCkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KGRhdGUudG9TdHJpbmcoKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoY2Vsc2l1cyo5LzUrMzIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKChmYWhyZW5oZWl0LTMyKSo1LzkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBvbGxTZWNvbmRzOiAxMFxuICAgICAgICAsdW5pdDogJ0YnXG4gICAgICAgICxsYXlvdXQ6ICdjYXJkJ1xuICAgICAgICAsY2hhcnQ6IHRydWVcbiAgICAgICAgLHNoYXJlZDogZmFsc2VcbiAgICAgICAgLHJlY2lwZTogeyduYW1lJzonJywnYnJld2VyJzp7bmFtZTonJywnZW1haWwnOicnfSwneWVhc3QnOltdLCdob3BzJzpbXSwnbWFsdCc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhY2NvdW50OiB7YXBpS2V5OiAnJywgc2Vzc2lvbnM6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiA4MDg2LCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBjb25uZWN0ZWQ6IGZhbHNlfVxuICAgICAgICAsYXJkdWlub3M6IFt7XG4gICAgICAgICAgaWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLFxuICAgICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBwbHVnczogW119XG4gICAgICAgICxza2V0Y2hlczoge2ZyZXF1ZW5jeTogNjAsIGlnbm9yZV92ZXJzaW9uX2Vycm9yOiBmYWxzZX1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAga2V5OiAnSG90IExpcXVvcidcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgfSx7XG4gICAgICAgICAga2V5OiAnTWFzaCdcbiAgICAgICAgICAsdHlwZTogJ2dyYWluJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENCcscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0ExJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgfSx7XG4gICAgICAgICAga2V5OiAnQm9pbCdcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgbGV0IHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIGxldCBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidBaXInLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoISFhcmR1aW5vLnNlY3VyZSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIGxldCBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLmtleSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZSsnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcjtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiAodGltZW91dCB8fCBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwKX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgbGV0IHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmFjY291bnQ7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgbGV0IHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGxldCB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBsZXQgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBvbjogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogMSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBvZmY6IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDAgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZiggISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcGtnOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGdyYWluczogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ncmFpbnMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBob3BzOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2hvcHMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB3YXRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS93YXRlci5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHN0eWxlczogZnVuY3Rpb24oKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3N0eWxlZ3VpZGUuanNvbicpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG92aWJvbmQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvbG92aWJvbmQuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjaGFydE9wdGlvbnM6IGZ1bmN0aW9uKHVuaXQpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpbmVDaGFydCcsXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBMaXZlJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcblxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUycpKG5ldyBEYXRlKGQpKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCF1bml0IHx8IHVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uKHBsYXRvKXtcbiAgICAgIGxldCBzZyA9ICggMSArIChwbGF0byAvICgyNTguNiAtICggKHBsYXRvLzI1OC4yKSAqIDIyNy4xKSApICkgKS50b0ZpeGVkKDMpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpO1xuICAgIH0sXG4gICAgcGxhdG86IGZ1bmN0aW9uKHNnKXtcbiAgICAgIGxldCBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIGxldCByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZighIXJlY2lwZS5GX1JfTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5GX1JfTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkZfUl9CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYsMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pe1xuICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4sZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5GX0dfTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoZ3JhaW4uRl9HX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2Mpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0KXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICBsZXQgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgbGV0IG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZighIXJlY2lwZS5OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuU1RZTEUuQ0FURUdPUlk7XG5cbiAgICAgIC8vIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk9HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLk9HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLklCVSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIGxldCBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICBsZXQgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgbGV0IG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgbGV0IHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICBsZXQgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9