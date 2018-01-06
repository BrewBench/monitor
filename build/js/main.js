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
    _.each($scope.kettles, function (kettle, i) {
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch) {
        if (kettle.temp.type == 'Thermistor') actions += 'temp = thermistorAutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DS18B20') actions += 'temp = ds18B20AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'PT100') actions += 'temp = pt100AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT11') actions += 'temp = dht11AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT21') actions += 'temp = dht21AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';else if (kettle.temp.type == 'DHT22') actions += 'temp = dht22AutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '",' + kettle.temp.adjust + ');\n';
        //look for triggers
        var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
        if (kettle.heater && kettle.heater.sketch) actions += 'trigger("heat","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.heater.pin + '",temp,' + target + ',' + kettle.temp.diff + ');\n';
        if (kettle.cooler && kettle.cooler.sketch) actions += 'trigger("cool","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.cooler.pin + '",temp,' + target + ',' + kettle.temp.diff + ');\n';
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtIiwidmFsdWVzIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInN0YXR1cyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJzeXNpbmZvIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJkZXZpY2UiLCJ0b2dnbGUiLCJyZWxheV9zdGF0ZSIsIm9mZiIsIm9uIiwiYWRkS2V0dGxlIiwia2V5IiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwiaGl0IiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJ2ZXJzaW9uIiwiaGFzU3RpY2t5S2V0dGxlcyIsImtldHRsZUNvdW50IiwiYWN0aXZlS2V0dGxlcyIsInBpbkRpc3BsYXkiLCJkZXZpY2VJZCIsInN1YnN0ciIsImFsaWFzIiwicGluSW5Vc2UiLCJjcmVhdGVTaGFyZSIsImJyZXdlciIsImVtYWlsIiwic2hhcmVfc3RhdHVzIiwic2hhcmVfc3VjY2VzcyIsInNoYXJlX2xpbmsiLCJzaGFyZVRlc3QiLCJ0ZXN0aW5nIiwiaHR0cF9jb2RlIiwicHVibGljIiwidGVzdEluZmx1eERCIiwiaW5mbHV4ZGIiLCJjb25uZWN0ZWQiLCJwaW5nIiwiJCIsInJlbW92ZUNsYXNzIiwiZGJzIiwiY29uY2F0IiwiYXBwbHkiLCJyZW1vdmUiLCJkYiIsImFkZENsYXNzIiwiY3JlYXRlSW5mbHV4REIiLCJtb21lbnQiLCJmb3JtYXQiLCJjcmVhdGVkIiwiY3JlYXRlREIiLCJkYXRhIiwicmVzdWx0cyIsInJlc2V0RXJyb3IiLCJzaGFyZUFjY2VzcyIsInNoYXJlZCIsImZyYW1lRWxlbWVudCIsImxvYWRTaGFyZUZpbGUiLCJjb250ZW50cyIsIm5vdGlmaWNhdGlvbnMiLCJoaWdoIiwibG93Iiwic2xhY2siLCJsYXN0Iiwic3ViVGV4dCIsImVuYWJsZWQiLCJ0ZXh0IiwiY29sb3IiLCJmb250IiwicHJvY2Vzc1RlbXBzIiwiaW1wb3J0UmVjaXBlIiwiJGZpbGVDb250ZW50IiwiJGV4dCIsImZvcm1hdHRlZF9jb250ZW50IiwiZm9ybWF0WE1MIiwianNvbk9iaiIsIngyanMiLCJYMkpTIiwieG1sX3N0cjJqc29uIiwicmVjaXBlX3N1Y2Nlc3MiLCJSZWNpcGVzIiwiRGF0YSIsIlJlY2lwZSIsIlNlbGVjdGlvbnMiLCJyZWNpcGVCZWVyU21pdGgiLCJSRUNJUEVTIiwiUkVDSVBFIiwicmVjaXBlQmVlclhNTCIsImNhdGVnb3J5IiwiaWJ1IiwiZGF0ZSIsImdyYWluIiwiYWRkVGltZXIiLCJsYWJlbCIsIm5vdGVzIiwiTnVtYmVyIiwiYW1vdW50IiwiaG9wIiwibWlzYyIsInllYXN0IiwibG9hZFN0eWxlcyIsInN0eWxlcyIsImxvYWRDb25maWciLCJwa2ciLCJza2V0Y2hfdmVyc2lvbiIsImJiX3ZlcnNpb24iLCJzb3J0QnkiLCJ1bmlxQnkiLCJhbGwiLCJpbml0IiwidGltZXIiLCJ0aW1lclN0YXJ0IiwicXVldWUiLCJ1cCIsInVwZGF0ZUtub2JDb3B5IiwidHJ1c3RBc0h0bWwiLCJrZXlzIiwic3RhdHVzVGV4dCIsInN0cmluZ2lmeSIsImRvbWFpbiIsInVwZGF0ZVRlbXAiLCJ0ZW1wcyIsInVuaXQiLCJNYXRoIiwicm91bmQiLCJodW1pZGl0eSIsImdldFRpbWUiLCJhbGVydCIsImdldE5hdk9mZnNldCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJvZmZzZXRIZWlnaHQiLCJzZWMiLCJyZW1vdmVUaW1lcnMiLCJidG4iLCJoYXNDbGFzcyIsInBhcmVudCIsInRvZ2dsZVBXTSIsInNzciIsInRvZ2dsZUtldHRsZSIsImhhc1NrZXRjaGVzIiwiaGFzQVNrZXRjaCIsImtub2JDbGljayIsInN0YXJ0U3RvcEtldHRsZSIsInJlYWRPbmx5IiwiaW1wb3J0U2V0dGluZ3MiLCJwcm9maWxlQ29udGVudCIsImV4cG9ydFNldHRpbmdzIiwiaSIsImVuY29kZVVSSUNvbXBvbmVudCIsImlnbm9yZVZlcnNpb25FcnJvciIsInNrZXRjaGVzIiwiaWdub3JlX3ZlcnNpb25fZXJyb3IiLCJkb3dubG9hZEF1dG9Ta2V0Y2giLCJhY3Rpb25zIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImdldCIsImZyZXF1ZW5jeSIsInBhcnNlSW50Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsImNsaWNrIiwiZG93bmxvYWRJbmZsdXhEQlNrZXRjaCIsImNvbm5lY3Rpb25fc3RyaW5nIiwicG9ydCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJib2R5IiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJrZXR0bGVUeXBlIiwiY2hhbmdlVW5pdHMiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsIiR3YXRjaCIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJyZWFkeSIsInRvb2x0aXAiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJ0cmltIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsInRvU3RyaW5nIiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwicGhyYXNlIiwiUmVnRXhwIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJsYXlvdXQiLCJjaGFydCIsImFjY291bnQiLCJhcGlLZXkiLCJzZXNzaW9ucyIsInNlY3VyZSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiQXV0aG9yaXphdGlvbiIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIngiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixFQUE2Q0MsYUFBN0MsRUFBNERDLGlCQUE1RCxFQUErRUMsZ0JBQS9FLEVBQWlHOztBQUV2R0YsZ0JBQWNHLFFBQWQsQ0FBdUJDLFVBQXZCLEdBQW9DLElBQXBDO0FBQ0FKLGdC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RUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UWMsRUF5UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UWMsRUEwUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUWMsRUEyUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUWMsRUE0UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE1UWMsRUE2UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE3UWMsRUE4UWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUE5UWMsRUErUWQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEvUWMsRUFnUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFoUmMsRUFpUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFqUmMsRUFrUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFsUmMsRUFtUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFuUmMsRUFvUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFwUmMsRUFxUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUFyUmMsRUFzUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF0UmMsRUF1UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF2UmMsRUF3UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF4UmMsRUF5UmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUF6UmMsRUEwUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUExUmMsRUEyUmQsRUFBQ0QsR0FBRyxRQUFKLEVBQWNDLEdBQUcsR0FBakIsRUEzUmMsRUE0UmQs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QUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXRmYyxFQXVmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXZmYyxFQXdmZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxLQUFoQixFQXhmYyxFQXlmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQXpmYyxFQTBmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTFmYyxFQTJmZCxFQUFDRCxHQUFHLFNBQUosRUFBZUMsR0FBRyxHQUFsQixFQTNmYyxDQUFoQjs7QUE4ZkFqZCxRQUFFa0QsSUFBRixDQUFPNlosU0FBUCxFQUFrQixVQUFTRyxJQUFULEVBQWU7QUFDL0IsWUFBR0osUUFBUWxkLE9BQVIsQ0FBZ0JzZCxLQUFLRixDQUFyQixNQUE0QixDQUFDLENBQWhDLEVBQWtDO0FBQ2hDRixvQkFBVUEsUUFBUW5kLE9BQVIsQ0FBZ0I0VSxPQUFPMkksS0FBS0YsQ0FBWixFQUFjLEdBQWQsQ0FBaEIsRUFBb0NFLEtBQUtELENBQXpDLENBQVY7QUFDRDtBQUNGLE9BSkQ7QUFLQSxhQUFPSCxPQUFQO0FBQ0Q7QUFsM0NJLEdBQVA7QUFvM0NELENBdjNDRCxFIiwiZmlsZSI6ImpzL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ2Jvb3RzdHJhcCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicsIFtcbiAgJ3VpLnJvdXRlcidcbiAgLCdudmQzJ1xuICAsJ25nVG91Y2gnXG4gICwnZHVTY3JvbGwnXG4gICwndWkua25vYidcbiAgLCdyek1vZHVsZSdcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkY29tcGlsZVByb3ZpZGVyKSB7XG5cbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbiA9ICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nO1xuICBkZWxldGUgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddO1xuXG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJycpO1xuICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwcz98ZnRwfG1haWx0b3x0ZWx8ZmlsZXxibG9ifGNocm9tZS1leHRlbnNpb258ZGF0YXxsb2NhbCk6Lyk7XG5cbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdzaGFyZScsIHtcbiAgICAgIHVybDogJy9zaC86ZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Jlc2V0Jywge1xuICAgICAgdXJsOiAnL3Jlc2V0JyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnb3RoZXJ3aXNlJywge1xuICAgICB1cmw6ICcqcGF0aCcsXG4gICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvbm90LWZvdW5kLmh0bWwnXG4gICB9KTtcblxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvYXBwLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkZmlsdGVyLCAkdGltZW91dCwgJGludGVydmFsLCAkcSwgJGh0dHAsICRzY2UsIEJyZXdTZXJ2aWNlKXtcblxuJHNjb3BlLmNsZWFyU2V0dGluZ3MgPSBmdW5jdGlvbihlKXtcbiAgaWYoZSl7XG4gICAgYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KS5odG1sKCdSZW1vdmluZy4uLicpO1xuICB9XG4gIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWY9Jy8nO1xuICB9LDEwMDApO1xufTtcblxuaWYoICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT0gJ3Jlc2V0JylcbiAgJHNjb3BlLmNsZWFyU2V0dGluZ3MoKTtcblxudmFyIG5vdGlmaWNhdGlvbiA9IG51bGxcbiAgLHJlc2V0Q2hhcnQgPSAxMDBcbiAgLHRpbWVvdXQgPSBudWxsOy8vcmVzZXQgY2hhcnQgYWZ0ZXIgMTAwIHBvbGxzXG5cbiRzY29wZS5ob3BzO1xuJHNjb3BlLmdyYWlucztcbiRzY29wZS53YXRlcjtcbiRzY29wZS5sb3ZpYm9uZDtcbiRzY29wZS5rZXR0bGVUeXBlcyA9IEJyZXdTZXJ2aWNlLmtldHRsZVR5cGVzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKCk7XG4kc2NvcGUuc2Vuc29yVHlwZXMgPSBCcmV3U2VydmljZS5zZW5zb3JUeXBlcztcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogNSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYoISFsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiRzY29wZS5zaGFyZSA9ICghJHN0YXRlLnBhcmFtcy5maWxlICYmIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpKSA/IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpIDoge1xuICAgICAgZmlsZTogJHN0YXRlLnBhcmFtcy5maWxlIHx8IG51bGxcbiAgICAgICwgcGFzc3dvcmQ6IG51bGxcbiAgICAgICwgbmVlZFBhc3N3b3JkOiBmYWxzZVxuICAgICAgLCBhY2Nlc3M6ICdyZWFkT25seSdcbiAgICAgICwgZGVsZXRlQWZ0ZXI6IDE0XG4gIH07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW0oXy52YWx1ZXMob2JqKSk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxM1xuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoISFwbHVnLnN0YXR1cyl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIGxldCBzeXNpbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gc3lzaW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIGlmKGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEpe1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IDA7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAxO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIGtleTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDogbnVsbFxuICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmhhc1N0aWNreUtldHRsZXMgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsnc3RpY2t5JzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUua2V0dGxlQ291bnQgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMsIHsndHlwZSc6IHR5cGV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmFjdGl2ZUtldHRsZXMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7J2FjdGl2ZSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLnBpbkRpc3BsYXkgPSBmdW5jdGlvbihwaW4pe1xuICAgICAgaWYoIHBpbi5pbmRleE9mKCdUUC0nKT09PTAgKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBwaW4uc3Vic3RyKDMpfSlbMF07XG4gICAgICAgIHJldHVybiBkZXZpY2UgPyBkZXZpY2UuYWxpYXMgOiAnJztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gcGluO1xuICB9O1xuXG4gICRzY29wZS5waW5JblVzZSA9IGZ1bmN0aW9uKHBpbixhbmFsb2cpe1xuICAgIHZhciBrZXR0bGUgPSBfLmZpbmQoJHNjb3BlLmtldHRsZXMsIGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICByZXR1cm4gKFxuICAgICAgICAoYW5hbG9nICYmIGtldHRsZS50ZW1wLnR5cGU9PSdUaGVybWlzdG9yJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLnRlbXAudHlwZT09J0RTMThCMjAnICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoa2V0dGxlLnRlbXAudHlwZT09J1BUMTAwJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLmhlYXRlci5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiAha2V0dGxlLmNvb2xlciAmJiBrZXR0bGUucHVtcC5waW49PXBpbilcbiAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGtldHRsZSB8fCBmYWxzZTtcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lIHx8ICEkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5lbWFpbClcbiAgICAgIHJldHVybjtcbiAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJ0NyZWF0aW5nIHNoYXJlIGxpbmsuLi4nO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5jcmVhdGVTaGFyZSgkc2NvcGUuc2hhcmUpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZihyZXNwb25zZS5zaGFyZSAmJiByZXNwb25zZS5zaGFyZS51cmwpe1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnJztcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IHRydWU7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX2xpbmsgPSByZXNwb25zZS5zaGFyZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gZXJyO1xuICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlVGVzdCA9IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgIGFyZHVpbm8udGVzdGluZyA9IHRydWU7XG4gICAgQnJld1NlcnZpY2Uuc2hhcmVUZXN0KGFyZHVpbm8pXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5odHRwX2NvZGUgPT0gMjAwKVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGFyZHVpbm8udGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnRlc3RJbmZsdXhEQiA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnRlc3RpbmcgPSB0cnVlO1xuICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLnBpbmcoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudGVzdGluZyA9IGZhbHNlO1xuICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gMjA0KXtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIC8vZ2V0IGxpc3Qgb2YgZGF0YWJhc2VzXG4gICAgICAgICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5kYnMoKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGxldCBkYnMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGJzID0gXy5yZW1vdmUoZGJzLCAoZGIpID0+IGRiICE9IFwiX2ludGVybmFsXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkKCcjaW5mbHV4ZGJVcmwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudGVzdGluZyA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuY3JlYXRlSW5mbHV4REIgPSBmdW5jdGlvbigpe1xuICAgIHZhciBkYiA9ICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gZmFsc2U7XG4gICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5jcmVhdGVEQihkYilcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcHJvbXB0IGZvciBwYXNzd29yZFxuICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoKXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgPSBkYjtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGlmKGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKXtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiRW50ZXIgeW91ciBVc2VybmFtZSBhbmQgUGFzc3dvcmQgZm9yIEluZmx1eERCXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZUFjY2VzcyA9IGZ1bmN0aW9uKGFjY2Vzcyl7XG4gICAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2hhcmVkKXtcbiAgICAgICAgaWYoYWNjZXNzKXtcbiAgICAgICAgICBpZihhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAhISgkc2NvcGUuc2hhcmUuYWNjZXNzICYmICRzY29wZS5zaGFyZS5hY2Nlc3MgPT09IGFjY2Vzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmKGFjY2VzcyAmJiBhY2Nlc3MgPT0gJ2VtYmVkJyl7XG4gICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU2hhcmVGaWxlID0gZnVuY3Rpb24oKXtcbiAgICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAgICRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmxvYWRTaGFyZUZpbGUoJHNjb3BlLnNoYXJlLmZpbGUsICRzY29wZS5zaGFyZS5wYXNzd29yZCB8fCBudWxsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY29udGVudHMpIHtcbiAgICAgICAgaWYoY29udGVudHMpe1xuICAgICAgICAgIGlmKGNvbnRlbnRzLm5lZWRQYXNzd29yZCl7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZSl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUgPSBjb250ZW50cy5zZXR0aW5ncy5yZWNpcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNoYXJlICYmIGNvbnRlbnRzLnNoYXJlLmFjY2Vzcyl7XG4gICAgICAgICAgICAgICRzY29wZS5zaGFyZS5hY2Nlc3MgPSBjb250ZW50cy5zaGFyZS5hY2Nlc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncyl7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncyA9IGNvbnRlbnRzLnNldHRpbmdzO1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucyA9IHtvbjpmYWxzZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihjb250ZW50cy5rZXR0bGVzKXtcbiAgICAgICAgICAgICAgXy5lYWNoKGNvbnRlbnRzLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgICAgICAgICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIwMCs1LHN1YlRleHQ6e2VuYWJsZWQ6IHRydWUsdGV4dDogJ3N0YXJ0aW5nLi4uJyxjb2xvcjogJ2dyYXknLGZvbnQ6ICdhdXRvJ319KTtcbiAgICAgICAgICAgICAgICBrZXR0bGUudmFsdWVzID0gW107XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAkc2NvcGUua2V0dGxlcyA9IGNvbnRlbnRzLmtldHRsZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGxvYWRpbmcgdGhlIHNoYXJlZCBzZXNzaW9uLlwiKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5pbXBvcnRSZWNpcGUgPSBmdW5jdGlvbigkZmlsZUNvbnRlbnQsJGV4dCl7XG5cbiAgICAgIC8vIHBhcnNlIHRoZSBpbXBvcnRlZCBjb250ZW50XG4gICAgICB2YXIgZm9ybWF0dGVkX2NvbnRlbnQgPSBCcmV3U2VydmljZS5mb3JtYXRYTUwoJGZpbGVDb250ZW50KTtcbiAgICAgIHZhciBqc29uT2JqLCByZWNpcGUgPSBudWxsO1xuXG4gICAgICBpZighIWZvcm1hdHRlZF9jb250ZW50KXtcbiAgICAgICAgdmFyIHgyanMgPSBuZXcgWDJKUygpO1xuICAgICAgICBqc29uT2JqID0geDJqcy54bWxfc3RyMmpzb24oIGZvcm1hdHRlZF9jb250ZW50ICk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFqc29uT2JqKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCRleHQ9PSdic214Jyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SZWNpcGVzICYmICEhanNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZTtcbiAgICAgICAgZWxzZSBpZighIWpzb25PYmouU2VsZWN0aW9ucyAmJiAhIWpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyU21pdGgocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZigkZXh0PT0neG1sJyl7XG4gICAgICAgIGlmKCEhanNvbk9iai5SRUNJUEVTICYmICEhanNvbk9iai5SRUNJUEVTLlJFQ0lQRSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJFQ0lQRVMuUkVDSVBFO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclhNTChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZighcmVjaXBlKVxuICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIGlmKCEhcmVjaXBlLm9nKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gcmVjaXBlLm9nO1xuICAgICAgaWYoISFyZWNpcGUuZmcpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSByZWNpcGUuZmc7XG5cbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubmFtZSA9IHJlY2lwZS5uYW1lO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYXRlZ29yeSA9IHJlY2lwZS5jYXRlZ29yeTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gcmVjaXBlLmFidjtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaWJ1ID0gcmVjaXBlLmlidTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZGF0ZSA9IHJlY2lwZS5kYXRlO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIgPSByZWNpcGUuYnJld2VyO1xuXG4gICAgICBpZihyZWNpcGUuZ3JhaW5zLmxlbmd0aCl7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0gcmVjaXBlLmdyYWlucztcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidncmFpbid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zID0ge307XG4gICAgICAgIF8uZWFjaChyZWNpcGUuZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBncmFpbi5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBncmFpbi5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBncmFpbi5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN1bSB0aGUgYW1vdW50cyBmb3IgdGhlIGdyYWluc1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zW2dyYWluLmxhYmVsXSlcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zW2dyYWluLmxhYmVsXSArPSBOdW1iZXIoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWluc1tncmFpbi5sYWJlbF0gPSBOdW1iZXIoZ3JhaW4uYW1vdW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKHJlY2lwZS5ob3BzLmxlbmd0aCl7XG4gICAgICAgIGxldCBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonaG9wJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzID0ge307XG4gICAgICAgIF8uZWFjaChyZWNpcGUuaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBob3AubWluLFxuICAgICAgICAgICAgICBub3RlczogaG9wLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VtIHRoZSBhbW91bnRzIGZvciB0aGUgaG9wc1xuICAgICAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wc1tob3AubGFiZWxdKVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0gKz0gTnVtYmVyKGhvcC5hbW91bnQpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wc1tob3AubGFiZWxdID0gTnVtYmVyKGhvcC5hbW91bnQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS5taXNjLmxlbmd0aCl7XG4gICAgICAgIGxldCBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTond2F0ZXInfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUubWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5sYWJlbCxcbiAgICAgICAgICAgICAgbWluOiBtaXNjLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IG1pc2Mubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUueWVhc3QubGVuZ3RoKXtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdCA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLnllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogeWVhc3QubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTdHlsZXMgPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc3R5bGVzKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnN0eWxlcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAkc2NvcGUuc3R5bGVzID0gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjb25maWcgPSBbXTtcbiAgICBpZighJHNjb3BlLnBrZyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5wa2coKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucGtnID0gcmVzcG9uc2U7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnNrZXRjaF92ZXJzaW9uID0gcmVzcG9uc2Uuc2tldGNoX3ZlcnNpb247XG4gICAgICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5iYl92ZXJzaW9uKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5iYl92ZXJzaW9uID0gcmVzcG9uc2UudmVyc2lvbjtcbiAgICAgICAgICB9IGVsc2UgaWYoJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24gIT0gcmVzcG9uc2UudmVyc2lvbil7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdpbmZvJztcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoJ1RoZXJlIGlzIGEgbmV3IHZlcnNpb24gYXZhaWxhYmxlIGZvciBCcmV3QmVuY2guIFBsZWFzZSA8YSBocmVmPVwiIy9yZXNldFwiPmNsZWFyPC9hPiB5b3VyIHNldHRpbmdzLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ncmFpbnMpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UuZ3JhaW5zKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ncmFpbnMgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnbmFtZScpLCduYW1lJyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUuaG9wcyl7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2UuaG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUuaG9wcyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS53YXRlcil7XG4gICAgICBjb25maWcucHVzaChcbiAgICAgICAgQnJld1NlcnZpY2Uud2F0ZXIoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLndhdGVyID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ3NhbHQnKSwnc2FsdCcpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmxvdmlib25kKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5sb3ZpYm9uZCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUubG92aWJvbmQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRxLmFsbChjb25maWcpO1xufTtcblxuICAvLyBjaGVjayBpZiBwdW1wIG9yIGhlYXRlciBhcmUgcnVubmluZ1xuICAkc2NvcGUuaW5pdCA9ICgpID0+IHtcbiAgICAkc2NvcGUuc2hvd1NldHRpbmdzID0gISRzY29wZS5zZXR0aW5ncy5zaGFyZWQ7XG4gICAgaWYoJHNjb3BlLnNoYXJlLmZpbGUpXG4gICAgICByZXR1cm4gJHNjb3BlLmxvYWRTaGFyZUZpbGUoKTtcblxuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgLy91cGRhdGUgbWF4XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgICAvLyBjaGVjayB0aW1lcnMgZm9yIHJ1bm5pbmdcbiAgICAgICAgaWYoISFrZXR0bGUudGltZXJzICYmIGtldHRsZS50aW1lcnMubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2goa2V0dGxlLnRpbWVycywgdGltZXIgPT4ge1xuICAgICAgICAgICAgaWYodGltZXIucnVubmluZyl7XG4gICAgICAgICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQodGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZighdGltZXIucnVubmluZyAmJiB0aW1lci5xdWV1ZSl7XG4gICAgICAgICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIudXAucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lci51cCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSA9IGZ1bmN0aW9uKGVyciwga2V0dGxlKXtcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5zaGFyZWQpe1xuICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnd2FybmluZyc7XG4gICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJ1RoZSBtb25pdG9yIHNlZW1zIHRvIGJlIG9mZi1saW5lLCByZS1jb25uZWN0aW5nLi4uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBtZXNzYWdlO1xuXG4gICAgICBpZih0eXBlb2YgZXJyID09ICdzdHJpbmcnICYmIGVyci5pbmRleE9mKCd7JykgIT09IC0xKXtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVyciA9IEpTT04ucGFyc2UoZXJyKTtcbiAgICAgICAgaWYoIU9iamVjdC5rZXlzKGVycikubGVuZ3RoKSByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnI7XG4gICAgICBlbHNlIGlmKCEhZXJyLnN0YXR1c1RleHQpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuc3RhdHVzVGV4dDtcbiAgICAgIGVsc2UgaWYoZXJyLmNvbmZpZyAmJiBlcnIuY29uZmlnLnVybClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5jb25maWcudXJsO1xuICAgICAgZWxzZSBpZihlcnIudmVyc2lvbil7XG4gICAgICAgIGlmKGtldHRsZSkga2V0dGxlLmVycm9yLnZlcnNpb24gPSBlcnIudmVyc2lvbjtcbiAgICAgICAgbWVzc2FnZSA9ICdTa2V0Y2ggVmVyc2lvbiBpcyBvdXQgb2YgZGF0ZS4gIDxhIGhyZWY9XCJcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjc2V0dGluZ3NNb2RhbFwiPkRvd25sb2FkIGhlcmU8L2E+LicrXG4gICAgICAgICAgJzxici8+WW91ciBWZXJzaW9uOiAnK2Vyci52ZXJzaW9uK1xuICAgICAgICAgICc8YnIvPkN1cnJlbnQgVmVyc2lvbjogJyskc2NvcGUuc2V0dGluZ3Muc2tldGNoX3ZlcnNpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoZXJyKTtcbiAgICAgICAgaWYobWVzc2FnZSA9PSAne30nKSBtZXNzYWdlID0gJyc7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhbWVzc2FnZSl7XG4gICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAga2V0dGxlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBDb25uZWN0aW9uIGVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKGBFcnJvcjogJHttZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLmVycm9yLm1lc3NhZ2UgPSBgRXJyb3IgY29ubmVjdGluZyB0byAke0JyZXdTZXJ2aWNlLmRvbWFpbihrZXR0bGUuYXJkdWlubyl9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnQ29ubmVjdGlvbiBlcnJvcjonKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlc2V0RXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGlmKGtldHRsZSkge1xuICAgICAga2V0dGxlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJHNjb3BlLmVycm9yLnR5cGUgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnJyk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVUZW1wID0gZnVuY3Rpb24ocmVzcG9uc2UsIGtldHRsZSl7XG4gICAgaWYoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS50ZW1wKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAkc2NvcGUucmVzZXRFcnJvcihrZXR0bGUpO1xuXG4gICAgdmFyIHRlbXBzID0gW107XG4gICAgLy9jaGFydCBkYXRlXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIC8vIHRlbXAgcmVzcG9uc2UgaXMgaW4gQ1xuICAgIGtldHRsZS50ZW1wLnByZXZpb3VzID0gKCRzY29wZS5zZXR0aW5ncy51bml0ID09ICdGJykgP1xuICAgICAgJGZpbHRlcigndG9GYWhyZW5oZWl0JykocmVzcG9uc2UudGVtcCkgOlxuICAgICAgTWF0aC5yb3VuZChyZXNwb25zZS50ZW1wKTtcbiAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0ga2V0dGxlLnRlbXAucHJldmlvdXMra2V0dGxlLnRlbXAuYWRqdXN0O1xuXG4gICAgLy9yZXNldCBhbGwga2V0dGxlcyBldmVyeSByZXNldENoYXJ0XG4gICAgaWYoa2V0dGxlLnZhbHVlcy5sZW5ndGggPiByZXNldENoYXJ0KXtcbiAgICAgICRzY29wZS5rZXR0bGVzLm1hcCgoaykgPT4ge1xuICAgICAgICByZXR1cm4gay52YWx1ZXM9W107XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL0RIVDExIHNlbnNvciBoYXMgaHVtaWRpdHlcbiAgICBpZiggcmVzcG9uc2UuaHVtaWRpdHkgKXtcbiAgICAgIGtldHRsZS5odW1pZGl0eSA9IHJlc3BvbnNlLmh1bWlkaXR5O1xuICAgIH1cblxuICAgIGtldHRsZS52YWx1ZXMucHVzaChbZGF0ZS5nZXRUaW1lKCksa2V0dGxlLnRlbXAuY3VycmVudF0pO1xuXG4gICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgY2hpbGxlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYgIWtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSkudGhlbihjb29sZXIgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IC8vaXMgdGVtcCB0b28gbG93P1xuICAgIGVsc2UgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgICRzY29wZS5hbGVydChrZXR0bGUpO1xuICAgICAgLy9zdGFydCB0aGUgaGVhdGluZyBlbGVtZW50XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYgIWtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmhlYXRlciwgdHJ1ZSkudGhlbihoZWF0aW5nID0+IHtcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDIwMCw0Nyw0NywxKSc7XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIC8vc3RhcnQgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYgIWtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB3aXRoaW4gdGFyZ2V0IVxuICAgICAga2V0dGxlLnRlbXAuaGl0PW5ldyBEYXRlKCk7Ly9zZXQgdGhlIHRpbWUgdGhlIHRhcmdldCB3YXMgaGl0IHNvIHdlIGNhbiBub3cgc3RhcnQgYWxlcnRzXG4gICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlKTtcbiAgICAgIC8vc3RvcCB0aGUgaGVhdGVyXG4gICAgICBpZihrZXR0bGUuaGVhdGVyLmF1dG8gJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICBpZihrZXR0bGUucHVtcCAmJiBrZXR0bGUucHVtcC5hdXRvICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5hdXRvICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRxLmFsbCh0ZW1wcyk7XG4gIH07XG5cbiAgJHNjb3BlLmdldE5hdk9mZnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDEyNSthbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdmJhcicpKVswXS5vZmZzZXRIZWlnaHQ7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRpbWVyID0gZnVuY3Rpb24oa2V0dGxlLG9wdGlvbnMpe1xuICAgIGlmKCFrZXR0bGUudGltZXJzKVxuICAgICAga2V0dGxlLnRpbWVycz1bXTtcbiAgICBpZihvcHRpb25zKXtcbiAgICAgIG9wdGlvbnMubWluID0gb3B0aW9ucy5taW4gPyBvcHRpb25zLm1pbiA6IDA7XG4gICAgICBvcHRpb25zLnNlYyA9IG9wdGlvbnMuc2VjID8gb3B0aW9ucy5zZWMgOiAwO1xuICAgICAgb3B0aW9ucy5ydW5uaW5nID0gb3B0aW9ucy5ydW5uaW5nID8gb3B0aW9ucy5ydW5uaW5nIDogZmFsc2U7XG4gICAgICBvcHRpb25zLnF1ZXVlID0gb3B0aW9ucy5xdWV1ZSA/IG9wdGlvbnMucXVldWUgOiBmYWxzZTtcbiAgICAgIGtldHRsZS50aW1lcnMucHVzaChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKHtsYWJlbDonRWRpdCBsYWJlbCcsbWluOjYwLHNlYzowLHJ1bm5pbmc6ZmFsc2UscXVldWU6ZmFsc2V9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVRpbWVycyA9IGZ1bmN0aW9uKGUsa2V0dGxlKXtcbiAgICB2YXIgYnRuID0gYW5ndWxhci5lbGVtZW50KGUudGFyZ2V0KTtcbiAgICBpZihidG4uaGFzQ2xhc3MoJ2ZhLXRyYXNoJykpIGJ0biA9IGJ0bi5wYXJlbnQoKTtcblxuICAgIGlmKCFidG4uaGFzQ2xhc3MoJ2J0bi1kYW5nZXInKSl7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1saWdodCcpLmFkZENsYXNzKCdidG4tZGFuZ2VyJyk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICB9LDIwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBidG4ucmVtb3ZlQ2xhc3MoJ2J0bi1kYW5nZXInKS5hZGRDbGFzcygnYnRuLWxpZ2h0Jyk7XG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlUFdNID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGtldHRsZS5wd20gPSAha2V0dGxlLnB3bTtcbiAgICAgIGlmKGtldHRsZS5wd20pXG4gICAgICAgIGtldHRsZS5zc3IgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS50b2dnbGVLZXR0bGUgPSBmdW5jdGlvbihpdGVtLCBrZXR0bGUpe1xuXG4gICAgdmFyIGs7XG5cbiAgICBzd2l0Y2ggKGl0ZW0pIHtcbiAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICBrID0ga2V0dGxlLmhlYXRlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgayA9IGtldHRsZS5jb29sZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgIGsgPSBrZXR0bGUucHVtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYoIWspXG4gICAgICByZXR1cm47XG5cbiAgICBrLnJ1bm5pbmcgPSAhay5ydW5uaW5nO1xuXG4gICAgaWYoa2V0dGxlLmFjdGl2ZSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgLy9zdGFydCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIHRydWUpO1xuICAgIH0gZWxzZSBpZighay5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aGUgcmVsYXlcbiAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGssIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmhhc1NrZXRjaGVzID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICBsZXQgaGFzQVNrZXRjaCA9IGZhbHNlO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpXG4gICAgICAgIGhhc0FTa2V0Y2ggPSB0cnVlO1xuICAgICAgZWxzZSBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKVxuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUua25vYkNsaWNrID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIC8vc2V0IGFkanVzdG1lbnQgYW1vdW50XG4gICAgICBpZighIWtldHRsZS50ZW1wLnByZXZpb3VzKXtcbiAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0ga2V0dGxlLnRlbXAuY3VycmVudCAtIGtldHRsZS50ZW1wLnByZXZpb3VzO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICBsZXQgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICBsZXQga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5pZ25vcmVWZXJzaW9uRXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciA9IHRydWU7XG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgfTtcblxuICAkc2NvcGUuZG93bmxvYWRBdXRvU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICBsZXQgYWN0aW9ucyA9ICcnO1xuICAgIGxldCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHwgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpKXtcbiAgICAgICAgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1RoZXJtaXN0b3InIClcbiAgICAgICAgYWN0aW9ucyArPSAndGVtcCA9IHRoZXJtaXN0b3JBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gZHMxOEIyMEF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIiwnK2tldHRsZS50ZW1wLmFkanVzdCsnKTtcXG4nO1xuICAgICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdQVDEwMCcgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gcHQxMDBBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnREhUMTEnIClcbiAgICAgICAgYWN0aW9ucyArPSAndGVtcCA9IGRodDExQXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiLCcra2V0dGxlLnRlbXAuYWRqdXN0KycpO1xcbic7XG4gICAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIxJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQyMUF1dG9Db21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIiwnK2tldHRsZS50ZW1wLmFkanVzdCsnKTtcXG4nO1xuICAgICAgICBlbHNlIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdESFQyMicgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gZGh0MjJBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgICBsZXQgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaClcbiAgICAgICAgICBhY3Rpb25zICs9ICd0cmlnZ2VyKFwiaGVhdFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJyk7XFxuJztcbiAgICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaClcbiAgICAgICAgICBhY3Rpb25zICs9ICd0cmlnZ2VyKFwiY29vbFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJyk7XFxuJztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby9CcmV3QmVuY2hBdXRvWXVuL0JyZXdCZW5jaEF1dG9ZdW4uaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2FjdGlvbnNdJywgYWN0aW9ucylcbiAgICAgICAgICAucmVwbGFjZSgnW1RQTElOS19DT05ORUNUSU9OXScsIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW0ZSRVFVRU5DWV9TRUNPTkRTXScsICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3kgPyBwYXJzZUludCgkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5LDEwKSA6IDYwKTtcbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnQnJld0JlbmNoQXV0b1l1bi5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5kb3dubG9hZEluZmx1eERCU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybCkgcmV0dXJuO1xuXG4gICAgbGV0IGFjdGlvbnMgPSAnJztcbiAgICBsZXQgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgaWYoICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAvLyBhZGQgZGJcbiAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgIGxldCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG5cbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGlmKCBrZXR0bGUudGVtcC50eXBlID09ICdUaGVybWlzdG9yJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSB0aGVybWlzdG9ySW5mbHV4REJDb21tYW5kKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLnRlbXAucGluKydcIiwnK2tldHRsZS50ZW1wLmFkanVzdCsnKTtcXG4nO1xuICAgICAgZWxzZSBpZigga2V0dGxlLnRlbXAudHlwZSA9PSAnRFMxOEIyMCcgKVxuICAgICAgICBhY3Rpb25zICs9ICd0ZW1wID0gZHMxOEIyMEluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ1BUMTAwJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBwdDEwMEluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDExJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQxMUluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIxJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQyMUluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIGVsc2UgaWYoIGtldHRsZS50ZW1wLnR5cGUgPT0gJ0RIVDIyJyApXG4gICAgICAgIGFjdGlvbnMgKz0gJ3RlbXAgPSBkaHQyMkluZmx1eERCQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsJytrZXR0bGUudGVtcC5hZGp1c3QrJyk7XFxuJztcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaClcbiAgICAgICAgYWN0aW9ucyArPSAndHJpZ2dlcihcImhlYXRcIixcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS5oZWF0ZXIucGluKydcIix0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycpO1xcbic7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKVxuICAgICAgICBhY3Rpb25zICs9ICd0cmlnZ2VyKFwiY29vbFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJyk7XFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby9CcmV3QmVuY2hJbmZsdXhEQll1bi9CcmV3QmVuY2hJbmZsdXhEQll1bi5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbYWN0aW9uc10nLCBhY3Rpb25zKVxuICAgICAgICAgIC5yZXBsYWNlKCdbSU5GTFVYREJfQ09OTkVDVElPTl0nLCBjb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW1RQTElOS19DT05ORUNUSU9OXScsIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW0ZSRVFVRU5DWV9TRUNPTkRTXScsICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3kgPyBwYXJzZUludCgkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5LDEwKSA6IDYwKTtcbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnQnJld0JlbmNoSW5mbHV4REJZdW4uaW5vJyk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBcImRhdGE6dGV4dC9pbm87Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5kYXRhKSk7XG4gICAgICAgIHN0cmVhbVNrZXRjaC5jbGljaygpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgdG8gZG93bmxvYWQgc2tldGNoICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBsZXQgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9ICdZb3VyICcra2V0dGxlLmtleSsnIGtldHRsZSBpcyAnKyhrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0gJ1lvdXIgJytrZXR0bGUua2V5Kycga2V0dGxlIGlzICcrKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9ICdZb3VyICcra2V0dGxlLmtleSsnIGtldHRsZSBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2tldHRsZS50ZW1wLmN1cnJlbnQrJ1xcdTAwQjAnO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBwcmV2aW91cyBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLmtleSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLmtleSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjEpJztcbiAgICAgIGtldHRsZS5oaWdoID0ga2V0dGxlLnRlbXAuY3VycmVudC1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC41KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuMSknO1xuICAgICAga2V0dGxlLmxvdyA9IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IChrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgICAvLyB1cGRhdGUgc3VidGV4dCB0byBpbmNsdWRlIGh1bWlkaXR5XG4gICAgaWYoa2V0dGxlLmh1bWlkaXR5KXtcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IGtldHRsZS5odW1pZGl0eSsnJSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpXG4gICAgICByZXR1cm47XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICAvLyB1cGRhdGUga25vYlxuICAgICAgICBrZXR0bGUua25vYi52YWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKzEwO1xuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh1bml0KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZighIWtldHRsZSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwgJHNjb3BlLmtldHRsZXNbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEuYWxsKGFsbFNlbnNvcnMpXG4gICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAvL3JlIHByb2Nlc3Mgb24gdGltZW91dFxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKCEhbG9hZGVkKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcbiAgLy8gc2NvcGUgd2F0Y2hcbiAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcblxuICAkc2NvcGUuJHdhdGNoKCdrZXR0bGVzJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcblxuICAkc2NvcGUuJHdhdGNoKCdzaGFyZScsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICQoIGRvY3VtZW50ICkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKTtcbiAgfSk7XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gISFzY29wZS50eXBlID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cblx0XHRcdGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKG9uQ2hhbmdlRXZlbnQpIHtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgZWxlbWVudC52YWwobnVsbCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlLnRvU3RyaW5nKCkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KGRhdGUudG9TdHJpbmcoKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoY2Vsc2l1cyo5LzUrMzIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKChmYWhyZW5oZWl0LTMyKSo1LzkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBvbGxTZWNvbmRzOiAxMFxuICAgICAgICAsdW5pdDogJ0YnXG4gICAgICAgICxsYXlvdXQ6ICdjYXJkJ1xuICAgICAgICAsY2hhcnQ6IHRydWVcbiAgICAgICAgLHNoYXJlZDogZmFsc2VcbiAgICAgICAgLHJlY2lwZTogeyduYW1lJzonJywnYnJld2VyJzp7bmFtZTonJywnZW1haWwnOicnfSwneWVhc3QnOltdLCdob3BzJzpbXSwnbWFsdCc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhY2NvdW50OiB7YXBpS2V5OiAnJywgc2Vzc2lvbnM6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiA4MDg2LCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBjb25uZWN0ZWQ6IGZhbHNlfVxuICAgICAgICAsYXJkdWlub3M6IFt7XG4gICAgICAgICAgaWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLFxuICAgICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBwbHVnczogW119XG4gICAgICAgICxza2V0Y2hlczoge2ZyZXF1ZW5jeTogNjAsIGlnbm9yZV92ZXJzaW9uX2Vycm9yOiBmYWxzZX1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAga2V5OiAnSG90IExpcXVvcidcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgfSx7XG4gICAgICAgICAga2V5OiAnTWFzaCdcbiAgICAgICAgICAsdHlwZTogJ2dyYWluJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENCcscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDUnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0ExJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE1MixkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgfSx7XG4gICAgICAgICAga2V5OiAnQm9pbCdcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgbGV0IHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIGxldCBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidBaXInLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoISFhcmR1aW5vLnNlY3VyZSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIGxldCBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLmtleSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZSsnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcjtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiAodGltZW91dCB8fCBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwKX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgbGV0IHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmFjY291bnQ7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgbGV0IHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBsZXQgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgbGV0IHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDEgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiAwIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBpbmZsdXhkYjogZnVuY3Rpb24oKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaW5mbHV4Q29ubmVjdGlvbiA9IGAke3NldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgaWYoICEhc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YFxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwaW5nOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2AsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbih1bml0KXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTGl2ZScsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG5cbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMnKShuZXcgRGF0ZShkKSlcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghdW5pdCB8fCB1bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICBsZXQgc2cgPSAoIDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoIChwbGF0by8yNTguMikgKiAyMjcuMSkgKSApICkudG9GaXhlZCgzKTtcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHNnKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICBsZXQgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0byk7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICBsZXQgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoISFyZWNpcGUuRl9SX05BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUsMTApO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0Lmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5GX1lfTEFCKycgJysoeWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX0xBQisnICcrXG4gICAgICAgICAgICAgIChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyWE1MOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgbGV0IHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGxldCBtYXNoX3RpbWUgPSA2MDtcblxuICAgICAgaWYoISFyZWNpcGUuTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgIC8vICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkJSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5JQlUpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NQVgpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUFYLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUlOKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5GRVJNRU5UQUJMRVMpe1xuICAgICAgICBsZXQgZ3JhaW5zID0gKHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgJiYgcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRS5sZW5ndGgpID8gcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSA6IHJlY2lwZS5GRVJNRU5UQUJMRVM7XG4gICAgICAgIF8uZWFjaChncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtYXNoX3RpbWUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMiksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgbGV0IGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIGxldCBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIGxldCB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgbGV0IGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==