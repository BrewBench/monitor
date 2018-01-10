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
      error: { message: '', version: '' },
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
      $scope.settings.recipe.hops = [];
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

  function downloadSketch(name, actions, headers, sketch) {
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
    console.log(headers);
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
      if (actions.length) {
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
            headers: []
          });
          currentSketch = _.find(sketches, { name: arduinoName });
        }
        var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
        var adjust = $scope.settings.unit == 'F' && kettle.temp.adjust != 0 ? Math.round(kettle.temp.adjust * 0.555) : kettle.temp.adjust;
        if (kettle.temp.type.indexOf('DHT') !== -1) {
          currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
          currentSketch.headers.push('#include <dht.h>');
        } else if (kettle.temp.type.indexOf('DS18B20') !== -1) {
          currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
          currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
        }
        currentSketch.actions.push('temp = autoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '","' + kettle.temp.type + '",' + adjust + ');');
        //look for triggers
        if (kettle.heater && kettle.heater.sketch) currentSketch.actions.push('trigger("heat","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.heater.pin + '",temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
        if (kettle.cooler && kettle.cooler.sketch) currentSketch.actions.push('trigger("cool","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.cooler.pin + '",temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
        if (kettle.notify.dweet) currentSketch.actions.push('dweetAutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + $scope.settings.recipe.brewer.name + '","' + $scope.settings.recipe.name + '",temp);');
      }
    });
    _.each(sketches, function (sketch, i) {
      downloadSketch(sketch.name, sketch.actions, sketch.headers, 'BrewBenchAutoYun');
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
          headers: []
        });
        currentSketch = _.find(sketches, { name: arduinoName });
      }
      var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      var adjust = $scope.settings.unit == 'F' && kettle.temp.adjust != 0 ? Math.round(kettle.temp.adjust * 0.555) : kettle.temp.adjust;
      if (kettle.temp.type.indexOf('DHT') !== -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
        currentSketch.headers.push('#include <dht.h>');
      } else if (kettle.temp.type.indexOf('DS18B20') !== -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/cactus_io_DS18B20.zip');
        currentSketch.headers.push('#include "cactus_io_DS18B20.h"');
      }
      currentSketch.actions.push('temp = influxDBCommand(F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettle.temp.type + '"),' + adjust + ');');
      //look for triggers
      if (kettle.heater && kettle.heater.sketch) currentSketch.actions.push('trigger(F("heat"),F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      if (kettle.cooler && kettle.cooler.sketch) currentSketch.actions.push('trigger(F("cool"),F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      if (kettle.notify.dweet) currentSketch.actions.push('dweetAutoCommand(F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + $scope.settings.recipe.brewer.name + '"),F("' + $scope.settings.recipe.name + '"),temp);');
    });
    _.each(sketches, function (sketch, i) {
      downloadSketch(sketch.name, sketch.actions, sketch.headers, 'BrewBenchInfluxDBYun');
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

$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
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
        error: { message: '', version: '' },
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
        error: { message: '', version: '' },
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
        error: { message: '', version: '' },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtIiwidmFsdWVzIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInN0YXR1cyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJzeXNpbmZvIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJkZXZpY2UiLCJ0b2dnbGUiLCJyZWxheV9zdGF0ZSIsIm9mZiIsIm9uIiwiYWRkS2V0dGxlIiwia2V5IiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwiaGl0IiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJ2ZXJzaW9uIiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiY3JlYXRlU2hhcmUiLCJicmV3ZXIiLCJlbWFpbCIsInNoYXJlX3N0YXR1cyIsInNoYXJlX3N1Y2Nlc3MiLCJzaGFyZV9saW5rIiwic2hhcmVUZXN0IiwidGVzdGluZyIsImh0dHBfY29kZSIsInB1YmxpYyIsInRlc3RJbmZsdXhEQiIsImluZmx1eGRiIiwiY29ubmVjdGVkIiwicGluZyIsIiQiLCJyZW1vdmVDbGFzcyIsImRicyIsImNvbmNhdCIsImFwcGx5IiwicmVtb3ZlIiwiZGIiLCJhZGRDbGFzcyIsImNyZWF0ZUluZmx1eERCIiwibW9tZW50IiwiZm9ybWF0IiwiY3JlYXRlZCIsImNyZWF0ZURCIiwiZGF0YSIsInJlc3VsdHMiLCJyZXNldEVycm9yIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJhZGRUaW1lciIsImxhYmVsIiwibm90ZXMiLCJOdW1iZXIiLCJhbW91bnQiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNrZXRjaF92ZXJzaW9uIiwiYmJfdmVyc2lvbiIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwiZG9tYWluIiwidXBkYXRlVGVtcCIsInRlbXBzIiwidW5pdCIsIk1hdGgiLCJyb3VuZCIsImh1bWlkaXR5IiwiZ2V0VGltZSIsImFsZXJ0IiwiZ2V0TmF2T2Zmc2V0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGFzU2tldGNoZXMiLCJoYXNBU2tldGNoIiwia25vYkNsaWNrIiwic3RhcnRTdG9wS2V0dGxlIiwicmVhZE9ubHkiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaWdub3JlVmVyc2lvbkVycm9yIiwic2tldGNoZXMiLCJpZ25vcmVfdmVyc2lvbl9lcnJvciIsImRvd25sb2FkU2tldGNoIiwiYWN0aW9ucyIsInRwbGlua19jb25uZWN0aW9uX3N0cmluZyIsImNvbm5lY3Rpb24iLCJjb25uZWN0aW9uX3N0cmluZyIsInBvcnQiLCJhdXRvZ2VuIiwiY29uc29sZSIsImxvZyIsImdldCIsImpvaW4iLCJmcmVxdWVuY3kiLCJwYXJzZUludCIsInN0cmVhbVNrZXRjaCIsImNyZWF0ZUVsZW1lbnQiLCJzZXRBdHRyaWJ1dGUiLCJjbGljayIsImRvd25sb2FkQXV0b1NrZXRjaCIsImFyZHVpbm9OYW1lIiwiY3VycmVudFNrZXRjaCIsImRvd25sb2FkSW5mbHV4REJTa2V0Y2giLCJnZXRJUEFkZHJlc3MiLCJpcEFkZHJlc3MiLCJpcCIsImljb24iLCJuYXZpZ2F0b3IiLCJ2aWJyYXRlIiwic291bmRzIiwic25kIiwiQXVkaW8iLCJwbGF5IiwiY2xvc2UiLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwiYm9keSIsInJlcXVlc3RQZXJtaXNzaW9uIiwidHJhY2tDb2xvciIsImJhckNvbG9yIiwiY2hhbmdlS2V0dGxlVHlwZSIsImtldHRsZUluZGV4IiwiZmluZEluZGV4Iiwia2V0dGxlVHlwZSIsImNoYW5nZVVuaXRzIiwidGltZXJSdW4iLCJuZXh0VGltZXIiLCJjYW5jZWwiLCJpbnRlcnZhbCIsImFsbFNlbnNvcnMiLCJwb2xsU2Vjb25kcyIsImNoYW5nZVZhbHVlIiwiZmllbGQiLCJsb2FkZWQiLCIkd2F0Y2giLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwicmVhZHkiLCJ0b29sdGlwIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsIm1vZGVsIiwidHJpbSIsImNoYW5nZSIsImVudGVyIiwicGxhY2Vob2xkZXIiLCJ0ZW1wbGF0ZSIsImxpbmsiLCJhdHRycyIsImVkaXQiLCJiaW5kIiwiJGFwcGx5IiwiY2hhckNvZGUiLCJrZXlDb2RlIiwibmdFbnRlciIsIiRwYXJzZSIsImZuIiwib25SZWFkRmlsZSIsIm9uQ2hhbmdlRXZlbnQiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwic3JjRWxlbWVudCIsImZpbGVzIiwiZXh0ZW5zaW9uIiwicG9wIiwidG9Mb3dlckNhc2UiLCJvbmxvYWQiLCJvbkxvYWRFdmVudCIsInJlc3VsdCIsInZhbCIsInJlYWRBc1RleHQiLCJ0b1N0cmluZyIsImZyb21Ob3ciLCJjZWxzaXVzIiwiZmFocmVuaGVpdCIsInBocmFzZSIsIlJlZ0V4cCIsImZhY3RvcnkiLCJsb2NhbFN0b3JhZ2UiLCJyZW1vdmVJdGVtIiwibGF5b3V0IiwiY2hhcnQiLCJhY2NvdW50IiwiYXBpS2V5Iiwic2Vzc2lvbnMiLCJzZWN1cmUiLCJ0cmFja1dpZHRoIiwiYmFyV2lkdGgiLCJiYXJDYXAiLCJkeW5hbWljT3B0aW9ucyIsImRpc3BsYXlQcmV2aW91cyIsInByZXZCYXJDb2xvciIsInNldEl0ZW0iLCJnZXRJdGVtIiwic2Vuc29ycyIsIndlYmhvb2tfdXJsIiwicSIsImRlZmVyIiwicG9zdE9iaiIsImhvc3QiLCJyZXNvbHZlIiwicmVqZWN0IiwicHJvbWlzZSIsIkF1dGhvcml6YXRpb24iLCJzZW5zb3IiLCJkaWdpdGFsUmVhZCIsInF1ZXJ5IiwibWQ1Iiwic2giLCJsYXRlc3QiLCJhcHBOYW1lIiwidGVybUlEIiwiYXBwVmVyIiwib3NwZiIsIm5ldFR5cGUiLCJsb2NhbGUiLCJqUXVlcnkiLCJwYXJhbSIsImxvZ2luX3BheWxvYWQiLCJjb21tYW5kIiwicGF5bG9hZCIsImFwcFNlcnZlclVybCIsImluZmx1eENvbm5lY3Rpb24iLCJzZXJpZXMiLCJub0RhdGEiLCJoZWlnaHQiLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ4IiwiZCIsInkiLCJkMyIsImNhdGVnb3J5MTAiLCJkdXJhdGlvbiIsInVzZUludGVyYWN0aXZlR3VpZGVsaW5lIiwiY2xpcFZvcm9ub2kiLCJ4QXhpcyIsImF4aXNMYWJlbCIsInRpY2tGb3JtYXQiLCJ0aW1lIiwib3JpZW50IiwidGlja1BhZGRpbmciLCJheGlzTGFiZWxEaXN0YW5jZSIsInN0YWdnZXJMYWJlbHMiLCJmb3JjZVkiLCJ5QXhpcyIsInNob3dNYXhNaW4iLCJ0b0ZpeGVkIiwib3AiLCJmcCIsInBvdyIsInN1YnN0cmluZyIsIkZfUl9OQU1FIiwiRl9SX1NUWUxFIiwiRl9TX0NBVEVHT1JZIiwiRl9SX0RBVEUiLCJGX1JfQlJFV0VSIiwiRl9TX01BWF9PRyIsIkZfU19NSU5fT0ciLCJGX1NfTUFYX0ZHIiwiRl9TX01JTl9GRyIsIkZfU19NQVhfQUJWIiwiRl9TX01JTl9BQlYiLCJGX1NfTUFYX0lCVSIsIkZfU19NSU5fSUJVIiwiSW5ncmVkaWVudHMiLCJHcmFpbiIsIkZfR19OQU1FIiwiRl9HX0JPSUxfVElNRSIsIkZfR19BTU9VTlQiLCJIb3BzIiwiRl9IX05BTUUiLCJGX0hfRFJZX0hPUF9USU1FIiwiRl9IX0JPSUxfVElNRSIsIkZfSF9BTU9VTlQiLCJNaXNjIiwiRl9NX05BTUUiLCJGX01fVElNRSIsIkZfTV9BTU9VTlQiLCJZZWFzdCIsIkZfWV9MQUIiLCJGX1lfUFJPRFVDVF9JRCIsIkZfWV9OQU1FIiwibWFzaF90aW1lIiwiTkFNRSIsIlNUWUxFIiwiQ0FURUdPUlkiLCJCUkVXRVIiLCJPRyIsIkZHIiwiSUJVIiwiQUJWX01BWCIsIkFCVl9NSU4iLCJNQVNIIiwiTUFTSF9TVEVQUyIsIk1BU0hfU1RFUCIsIlNURVBfVElNRSIsIkZFUk1FTlRBQkxFUyIsIkZFUk1FTlRBQkxFIiwiQU1PVU5UIiwiSE9QUyIsIkhPUCIsIkZPUk0iLCJVU0UiLCJUSU1FIiwiTUlTQ1MiLCJNSVNDIiwiWUVBU1RTIiwiWUVBU1QiLCJjb250ZW50IiwiaHRtbGNoYXJzIiwiZiIsInIiLCJjaGFyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxrQkFBUUEsTUFBUixDQUFlLG1CQUFmLEVBQW9DLENBQ2xDLFdBRGtDLEVBRWpDLE1BRmlDLEVBR2pDLFNBSGlDLEVBSWpDLFVBSmlDLEVBS2pDLFNBTGlDLEVBTWpDLFVBTmlDLENBQXBDLEVBUUNDLE1BUkQsQ0FRUSxVQUFTQyxjQUFULEVBQXlCQyxr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QyxHQUFHLEdBQWxCLEVBMWZjLEVBMmZkLEVBQUNELEdBQUcsU0FBSixFQUFlQyxHQUFHLEdBQWxCLEVBM2ZjLENBQWhCOztBQThmQTFkLFFBQUVrRCxJQUFGLENBQU9zYSxTQUFQLEVBQWtCLFVBQVNHLElBQVQsRUFBZTtBQUMvQixZQUFHSixRQUFRM2QsT0FBUixDQUFnQitkLEtBQUtGLENBQXJCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7QUFDaENGLG9CQUFVQSxRQUFRNWQsT0FBUixDQUFnQm9WLE9BQU80SSxLQUFLRixDQUFaLEVBQWMsR0FBZCxDQUFoQixFQUFvQ0UsS0FBS0QsQ0FBekMsQ0FBVjtBQUNEO0FBQ0YsT0FKRDtBQUtBLGFBQU9ILE9BQVA7QUFDRDtBQWg1Q0ksR0FBUDtBQWs1Q0QsQ0FyNUNELEUiLCJmaWxlIjoianMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAnYm9vdHN0cmFwJztcblxuYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJywgW1xuICAndWkucm91dGVyJ1xuICAsJ252ZDMnXG4gICwnbmdUb3VjaCdcbiAgLCdkdVNjcm9sbCdcbiAgLCd1aS5rbm9iJ1xuICAsJ3J6TW9kdWxlJ1xuXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRjb21waWxlUHJvdmlkZXIpIHtcblxuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xuICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uID0gJ0NvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbic7XG4gIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XG5cbiAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnJyk7XG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xmdHB8bWFpbHRvfHRlbHxmaWxlfGJsb2J8Y2hyb21lLWV4dGVuc2lvbnxkYXRhfGxvY2FsKTovKTtcblxuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgIHVybDogJycsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3NoYXJlJywge1xuICAgICAgdXJsOiAnL3NoLzpmaWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgncmVzZXQnLCB7XG4gICAgICB1cmw6ICcvcmVzZXQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdvdGhlcndpc2UnLCB7XG4gICAgIHVybDogJypwYXRoJyxcbiAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ub3QtZm91bmQuaHRtbCdcbiAgIH0pO1xuXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9hcHAuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRmaWx0ZXIsICR0aW1lb3V0LCAkaW50ZXJ2YWwsICRxLCAkaHR0cCwgJHNjZSwgQnJld1NlcnZpY2Upe1xuXG4kc2NvcGUuY2xlYXJTZXR0aW5ncyA9IGZ1bmN0aW9uKGUpe1xuICBpZihlKXtcbiAgICBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpLmh0bWwoJ1JlbW92aW5nLi4uJyk7XG4gIH1cbiAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZj0nLyc7XG4gIH0sMTAwMCk7XG59O1xuXG5pZiggJHN0YXRlLmN1cnJlbnQubmFtZSA9PSAncmVzZXQnKVxuICAkc2NvcGUuY2xlYXJTZXR0aW5ncygpO1xuXG52YXIgbm90aWZpY2F0aW9uID0gbnVsbFxuICAscmVzZXRDaGFydCA9IDEwMFxuICAsdGltZW91dCA9IG51bGw7Ly9yZXNldCBjaGFydCBhZnRlciAxMDAgcG9sbHNcblxuJHNjb3BlLmhvcHM7XG4kc2NvcGUuZ3JhaW5zO1xuJHNjb3BlLndhdGVyO1xuJHNjb3BlLmxvdmlib25kO1xuJHNjb3BlLnBrZztcbiRzY29wZS5rZXR0bGVUeXBlcyA9IEJyZXdTZXJ2aWNlLmtldHRsZVR5cGVzKCk7XG4kc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKCk7XG4kc2NvcGUuc2Vuc29yVHlwZXMgPSBCcmV3U2VydmljZS5zZW5zb3JUeXBlcztcbiRzY29wZS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuJHNjb3BlLmVycm9yID0ge21lc3NhZ2U6ICcnLCB0eXBlOiAnZGFuZ2VyJ307XG4kc2NvcGUuc2xpZGVyID0ge1xuICBtaW46IDAsXG4gIG9wdGlvbnM6IHtcbiAgICBmbG9vcjogMCxcbiAgICBjZWlsOiAxMDAsXG4gICAgc3RlcDogNSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbihrZXR0bGVJZCwgbW9kZWxWYWx1ZSwgaGlnaFZhbHVlLCBwb2ludGVyVHlwZSl7XG4gICAgICB2YXIga2V0dGxlID0ga2V0dGxlSWQuc3BsaXQoJ18nKTtcbiAgICAgIHZhciBrO1xuXG4gICAgICBzd2l0Y2ggKGtldHRsZVswXSkge1xuICAgICAgICBjYXNlICdoZWF0JzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5oZWF0ZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmNvb2xlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHVtcCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0ucHVtcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYoIWspXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uYWN0aXZlICYmIGsucHdtICYmIGsucnVubmluZyl7XG4gICAgICAgIHJldHVybiAkc2NvcGUudG9nZ2xlUmVsYXkoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXSwgaywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4kc2NvcGUuZ2V0S2V0dGxlU2xpZGVyT3B0aW9ucyA9IGZ1bmN0aW9uKHR5cGUsIGluZGV4KXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oJHNjb3BlLnNsaWRlci5vcHRpb25zLCB7aWQ6IGAke3R5cGV9XyR7aW5kZXh9YH0pO1xufVxuXG4kc2NvcGUuZ2V0TG92aWJvbmRDb2xvciA9IGZ1bmN0aW9uKHJhbmdlKXtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKC/CsC9nLCcnKS5yZXBsYWNlKC8gL2csJycpO1xuICBpZihyYW5nZS5pbmRleE9mKCctJykhPT0tMSl7XG4gICAgdmFyIHJBcnI9cmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICByYW5nZSA9IChwYXJzZUZsb2F0KHJBcnJbMF0pK3BhcnNlRmxvYXQockFyclsxXSkpLzI7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UgPSBwYXJzZUZsb2F0KHJhbmdlKTtcbiAgfVxuICBpZighcmFuZ2UpXG4gICAgcmV0dXJuICcnO1xuICB2YXIgbCA9IF8uZmlsdGVyKCRzY29wZS5sb3ZpYm9uZCwgZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIChpdGVtLnNybSA8PSByYW5nZSkgPyBpdGVtLmhleCA6ICcnO1xuICB9KTtcbiAgaWYoISFsLmxlbmd0aClcbiAgICByZXR1cm4gbFtsLmxlbmd0aC0xXS5oZXg7XG4gIHJldHVybiAnJztcbn07XG5cbi8vZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiRzY29wZS5zZXR0aW5ncyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycpIHx8IEJyZXdTZXJ2aWNlLnJlc2V0KCk7XG4kc2NvcGUua2V0dGxlcyA9IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJykgfHwgQnJld1NlcnZpY2UuZGVmYXVsdEtldHRsZXMoKTtcbiRzY29wZS5zaGFyZSA9ICghJHN0YXRlLnBhcmFtcy5maWxlICYmIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpKSA/IEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScpIDoge1xuICAgICAgZmlsZTogJHN0YXRlLnBhcmFtcy5maWxlIHx8IG51bGxcbiAgICAgICwgcGFzc3dvcmQ6IG51bGxcbiAgICAgICwgbmVlZFBhc3N3b3JkOiBmYWxzZVxuICAgICAgLCBhY2Nlc3M6ICdyZWFkT25seSdcbiAgICAgICwgZGVsZXRlQWZ0ZXI6IDE0XG4gIH07XG5cbiRzY29wZS5zdW1WYWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gXy5zdW0oXy52YWx1ZXMob2JqKSk7XG59XG5cbi8vIGluaXQgY2FsYyB2YWx1ZXNcbiRzY29wZS51cGRhdGVBQlYgPSBmdW5jdGlvbigpe1xuICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlPT0nZ3Jhdml0eScpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKVxuICAgICAgLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kPT0ncGFwYXppYW4nKVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnYoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YShCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2Fsb3JpZXMgPSBCcmV3U2VydmljZS5jYWxvcmllcygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFid1xuICAgICAgLEJyZXdTZXJ2aWNlLnJlKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZylcbiAgICAgICxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gIH1cbn07XG5cbiRzY29wZS5jaGFuZ2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2Qpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZCA9IG1ldGhvZDtcbiAgJHNjb3BlLnVwZGF0ZUFCVigpO1xufTtcblxuJHNjb3BlLmNoYW5nZVNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnNjYWxlID0gc2NhbGU7XG4gIGlmKHNjYWxlPT0nZ3Jhdml0eScpe1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfVxufTtcblxuJHNjb3BlLnVwZGF0ZUFCVigpO1xuXG4gICRzY29wZS5nZXRQb3J0UmFuZ2UgPSBmdW5jdGlvbihudW1iZXIpe1xuICAgICAgbnVtYmVyKys7XG4gICAgICByZXR1cm4gQXJyYXkobnVtYmVyKS5maWxsKCkubWFwKChfLCBpZHgpID0+IDAgKyBpZHgpO1xuICB9O1xuXG4gICRzY29wZS5hcmR1aW5vcyA9IHtcbiAgICBhZGQ6ICgpID0+IHtcbiAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcykgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zID0gW107XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MucHVzaCh7XG4gICAgICAgIGlkOiBidG9hKG5vdysnJyskc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoKzEpLFxuICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICBkaWdpdGFsOiAxM1xuICAgICAgfSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKCFrZXR0bGUuYXJkdWlubylcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdXBkYXRlOiAoYXJkdWlubykgPT4ge1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoaW5kZXgsIGFyZHVpbm8pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZihrZXR0bGUuYXJkdWlubyAmJiBrZXR0bGUuYXJkdWluby5pZCA9PSBhcmR1aW5vLmlkKVxuICAgICAgICAgIGRlbGV0ZSBrZXR0bGUuYXJkdWlubztcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudHBsaW5rID0ge1xuICAgIGxvZ2luOiAoKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5sb2dpbigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnVzZXIsJHNjb3BlLnNldHRpbmdzLnRwbGluay5wYXNzKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYocmVzcG9uc2UudG9rZW4pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay50b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuICAgICAgICAgICAgJHNjb3BlLnRwbGluay5zY2FuKHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLm1zZyB8fCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IFtdO1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuc2Nhbih0b2tlbikudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmKHJlc3BvbnNlLmRldmljZUxpc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSByZXNwb25zZS5kZXZpY2VMaXN0O1xuICAgICAgICAgIC8vIGdldCBkZXZpY2UgaW5mbyBpZiBvbmxpbmUgKGllLiBzdGF0dXM9PTEpXG4gICAgICAgICAgXy5lYWNoKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MsIHBsdWcgPT4ge1xuICAgICAgICAgICAgaWYoISFwbHVnLnN0YXR1cyl7XG4gICAgICAgICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8ocGx1ZykudGhlbihpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZihpbmZvICYmIGluZm8ucmVzcG9uc2VEYXRhKXtcbiAgICAgICAgICAgICAgICAgIGxldCBzeXNpbmZvID0gSlNPTi5wYXJzZShpbmZvLnJlc3BvbnNlRGF0YSkuc3lzdGVtLmdldF9zeXNpbmZvO1xuICAgICAgICAgICAgICAgICAgcGx1Zy5pbmZvID0gc3lzaW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmluZm8oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b2dnbGU6IChkZXZpY2UpID0+IHtcbiAgICAgIGlmKGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID09IDEpe1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vZmYoZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IDA7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9uKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAxO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5hZGRLZXR0bGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICBpZighJHNjb3BlLmtldHRsZXMpICRzY29wZS5rZXR0bGVzID0gW107XG4gICAgJHNjb3BlLmtldHRsZXMucHVzaCh7XG4gICAgICAgIGtleTogdHlwZSA/IF8uZmluZCgkc2NvcGUua2V0dGxlVHlwZXMse3R5cGU6IHR5cGV9KS5uYW1lIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdLm5hbWVcbiAgICAgICAgLHR5cGU6IHR5cGUgfHwgJHNjb3BlLmtldHRsZVR5cGVzWzBdLnR5cGVcbiAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICxwdW1wOiB7cGluOidENycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQsZGlmZjokc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn1cbiAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCskc2NvcGUua2V0dGxlVHlwZXNbMF0uZGlmZn0pXG4gICAgICAgICxhcmR1aW5vOiAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MubGVuZ3RoID8gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdIDogbnVsbFxuICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBwaW47XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFuYWxvZyl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChhbmFsb2cgJiYga2V0dGxlLnRlbXAudHlwZT09J1RoZXJtaXN0b3InICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUudGVtcC50eXBlPT0nRFMxOEIyMCcgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgIChrZXR0bGUudGVtcC50eXBlPT0nUFQxMDAnICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUuaGVhdGVyLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmICFrZXR0bGUuY29vbGVyICYmIGtldHRsZS5wdW1wLnBpbj09cGluKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVUZXN0ID0gZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgYXJkdWluby50ZXN0aW5nID0gdHJ1ZTtcbiAgICBCcmV3U2VydmljZS5zaGFyZVRlc3QoYXJkdWlubylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLmh0dHBfY29kZSA9PSAyMDApXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSB0cnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUudGVzdEluZmx1eERCID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudGVzdGluZyA9IHRydWU7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmRicygpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgbGV0IGRicyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVJbmZsdXhEQiA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9IGRiO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgaWYoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSByZWNpcGUuZ3JhaW5zO1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSB7fTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VtIHRoZSBhbW91bnRzIGZvciB0aGUgZ3JhaW5zXG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdKVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdICs9IE51bWJlcihncmFpbi5hbW91bnQpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zW2dyYWluLmxhYmVsXSA9IE51bWJlcihncmFpbi5hbW91bnQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdW0gdGhlIGFtb3VudHMgZm9yIHRoZSBob3BzXG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0pXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSArPSBOdW1iZXIoaG9wLmFtb3VudCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0gPSBOdW1iZXIoaG9wLmFtb3VudCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgbGV0IGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgICAgICBpZighJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24gPSByZXNwb25zZS52ZXJzaW9uO1xuICAgICAgICAgIH0gZWxzZSBpZigkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbiAhPSByZXNwb25zZS52ZXJzaW9uKXtcbiAgICAgICAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2luZm8nO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnVGhlcmUgaXMgYSBuZXcgdmVyc2lvbiBhdmFpbGFibGUgZm9yIEJyZXdCZW5jaC4gUGxlYXNlIDxhIGhyZWY9XCIjL3Jlc2V0XCI+Y2xlYXI8L2E+IHlvdXIgc2V0dGluZ3MuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUpe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUuZXJyb3IudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgICBtZXNzYWdlID0gJ1NrZXRjaCBWZXJzaW9uIGlzIG91dCBvZiBkYXRlLiAgPGEgaHJlZj1cIlwiIGRhdGEtdG9nZ2xlPVwibW9kYWxcIiBkYXRhLXRhcmdldD1cIiNzZXR0aW5nc01vZGFsXCI+RG93bmxvYWQgaGVyZTwvYT4uJytcbiAgICAgICAgICAnPGJyLz5Zb3VyIFZlcnNpb246ICcrZXJyLnZlcnNpb24rXG4gICAgICAgICAgJzxici8+Q3VycmVudCBWZXJzaW9uOiAnKyRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9IGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVzZXRFcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoa2V0dGxlKSB7XG4gICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnRlbXApe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG5cbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICBNYXRoLnJvdW5kKHJlc3BvbnNlLnRlbXApO1xuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBrZXR0bGUudGVtcC5wcmV2aW91cytrZXR0bGUudGVtcC5hZGp1c3Q7XG5cbiAgICAvL3Jlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcz1bXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUMTEgc2Vuc29yIGhhcyBodW1pZGl0eVxuICAgIGlmKCByZXNwb25zZS5odW1pZGl0eSApe1xuICAgICAga2V0dGxlLmh1bWlkaXR5ID0gcmVzcG9uc2UuaHVtaWRpdHk7XG4gICAgfVxuXG4gICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5hbGVydChrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGxldCBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUua25vYkNsaWNrID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIC8vc2V0IGFkanVzdG1lbnQgYW1vdW50XG4gICAgICBpZighIWtldHRsZS50ZW1wLnByZXZpb3VzKXtcbiAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0ga2V0dGxlLnRlbXAuY3VycmVudCAtIGtldHRsZS50ZW1wLnByZXZpb3VzO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICBsZXQgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICBsZXQga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5pZ25vcmVWZXJzaW9uRXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciA9IHRydWU7XG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoZWFkZXJzLCBza2V0Y2gpe1xuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIGxldCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgaWYoICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAvLyBhZGQgZGJcbiAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgIGxldCBhdXRvZ2VuID0gJy8qIFNrZXRjaCBBdXRvIEdlbmVyYXRlZCBmcm9tIGh0dHA6Ly9tb25pdG9yLmJyZXdiZW5jaC5jbyBvbiAnK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDpNTTpTUycpKycgZm9yICcrbmFtZSsnKi9cXG4nO1xuICAgIGNvbnNvbGUubG9nKGhlYWRlcnMpXG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGF1dG9nZW4rcmVzcG9uc2UuZGF0YVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbYWN0aW9uc10nLCBhY3Rpb25zLmxlbmd0aCA/IGFjdGlvbnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnLy8gW2hlYWRlcnNdJywgaGVhZGVycy5sZW5ndGggPyBoZWFkZXJzLmpvaW4oJ1xcbicpIDogJycpXG4gICAgICAgICAgLnJlcGxhY2UoJ1tUUExJTktfQ09OTkVDVElPTl0nLCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgICAgLnJlcGxhY2UoJ1tTTEFDS19DT05ORUNUSU9OXScsICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrKVxuICAgICAgICAgIC5yZXBsYWNlKCdbRlJFUVVFTkNZX1NFQ09ORFNdJywgJHNjb3BlLnNldHRpbmdzLnNrZXRjaGVzLmZyZXF1ZW5jeSA/IHBhcnNlSW50KCRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3ksMTApIDogNjApO1xuICAgICAgICBpZiggc2tldGNoLmluZGV4T2YoJ0luZmx1eERCJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKCdbSU5GTFVYREJfQ09OTkVDVElPTl0nLCBjb25uZWN0aW9uX3N0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSA8ZGh0Lmg+JykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gREhUIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaGVhZGVycy5pbmRleE9mKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIERTMThCMjAgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihhY3Rpb25zLmxlbmd0aCl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgvXFwvXFwvIHRyaWdnZXJzIC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmRvd25sb2FkQXV0b1NrZXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgbGV0IHNrZXRjaGVzID0gW107XG4gICAgbGV0IGFyZHVpbm9OYW1lID0gJyc7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAvLyByZXNldCB0aGUgYWN0aW9uc1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LmR3ZWV0XG4gICAgICApe1xuICAgICAgICBhcmR1aW5vTmFtZSA9IGtldHRsZS5hcmR1aW5vLnVybC5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKTtcbiAgICAgICAgbGV0IGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICAgIHNrZXRjaGVzLnB1c2goe1xuICAgICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIGhlYWRlcnM6IFtdXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgICBsZXQgYWRqdXN0ID0gKCRzY29wZS5zZXR0aW5ncy51bml0PT0nRicgJiYga2V0dGxlLnRlbXAuYWRqdXN0ICE9IDApID8gTWF0aC5yb3VuZChrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUpIDoga2V0dGxlLnRlbXAuYWRqdXN0O1xuICAgICAgICBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RIVCcpICE9PSAtMSl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVExpYi56aXAnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgPGRodC5oPicpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoa2V0dGxlLnRlbXAudHlwZS5pbmRleE9mKCdEUzE4QjIwJykgIT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJyk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RlbXAgPSBhdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS50ZW1wLnBpbisnXCIsXCInK2tldHRsZS50ZW1wLnR5cGUrJ1wiLCcrYWRqdXN0KycpOycpO1xuICAgICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpXG4gICAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RyaWdnZXIoXCJoZWF0XCIsXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIsdGVtcCwnK3RhcmdldCsnLCcra2V0dGxlLnRlbXAuZGlmZisnLCcrISFrZXR0bGUubm90aWZ5LnNsYWNrKycpOycpO1xuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKVxuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKFwiY29vbFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgICAgaWYoa2V0dGxlLm5vdGlmeS5kd2VldClcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnZHdlZXRBdXRvQ29tbWFuZChcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInKyRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUrJ1wiLFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUrJ1wiLHRlbXApOycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaEF1dG9ZdW4nKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZG93bmxvYWRJbmZsdXhEQlNrZXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51cmwpIHJldHVybjtcbiAgICBsZXQgc2tldGNoZXMgPSBbXTtcbiAgICBsZXQgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgbGV0IGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIGlmKCFjdXJyZW50U2tldGNoKXtcbiAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTogYXJkdWlub05hbWUsXG4gICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgaGVhZGVyczogW11cbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgbGV0IGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnICYmIGtldHRsZS50ZW1wLmFkanVzdCAhPSAwKSA/IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1KSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVExpYi56aXAnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKVxuICAgICAgfVxuICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpO1xuICAgICAgfVxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ3RlbXAgPSBpbmZsdXhEQkNvbW1hbmQoRihcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInK2tldHRsZS50ZW1wLnBpbisnXCIpLEYoXCInK2tldHRsZS50ZW1wLnR5cGUrJ1wiKSwnK2FkanVzdCsnKTsnKTtcbiAgICAgIC8vbG9vayBmb3IgdHJpZ2dlcnNcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJoZWF0XCIpLEYoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJjb29sXCIpLEYoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIGlmKGtldHRsZS5ub3RpZnkuZHdlZXQpXG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCdkd2VldEF1dG9Db21tYW5kKEYoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lKydcIiksRihcIicrJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lKydcIiksdGVtcCk7Jyk7XG4gICAgfSk7XG4gICAgXy5lYWNoKHNrZXRjaGVzLCAoc2tldGNoLCBpKSA9PiB7XG4gICAgICBkb3dubG9hZFNrZXRjaChza2V0Y2gubmFtZSwgc2tldGNoLmFjdGlvbnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoSW5mbHV4REJZdW4nKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0SVBBZGRyZXNzID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gXCJcIjtcbiAgICBCcmV3U2VydmljZS5pcCgpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSByZXNwb25zZS5pcDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24oa2V0dGxlLHRpbWVyKXtcblxuICAgIC8vZG9uJ3Qgc3RhcnQgYWxlcnRzIHVudGlsIHdlIGhhdmUgaGl0IHRoZSB0ZW1wLnRhcmdldFxuICAgIGlmKCF0aW1lciAmJiBrZXR0bGUgJiYgIWtldHRsZS50ZW1wLmhpdFxuICAgICAgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMub24gPT09IGZhbHNlKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3AgLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBsZXQgbWVzc2FnZSxcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvYnJld2JlbmNoLWxvZ28ucG5nJyxcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuXG4gICAgaWYoa2V0dGxlICYmIFsnaG9wJywnZ3JhaW4nLCd3YXRlcicsJ2Zlcm1lbnRlciddLmluZGV4T2Yoa2V0dGxlLnR5cGUpIT09LTEpXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nLycra2V0dGxlLnR5cGUrJy5wbmcnO1xuXG4gICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgIGlmKGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgIHJldHVybjtcblxuICAgIGlmKCEhdGltZXIpeyAvL2tldHRsZSBpcyBhIHRpbWVyIG9iamVjdFxuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRpbWVycylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYodGltZXIudXApXG4gICAgICAgIG1lc3NhZ2UgPSAnWW91ciB0aW1lcnMgYXJlIGRvbmUnO1xuICAgICAgZWxzZSBpZighIXRpbWVyLm5vdGVzKVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubm90ZXMrJyBvZiAnK3RpbWVyLmxhYmVsO1xuICAgICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gJ1RpbWUgdG8gYWRkICcrdGltZXIubGFiZWw7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5oaWdoKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5oaWdoIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdoaWdoJylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5rZXkrJyBpcyAnKyhrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBoaWdoJztcbiAgICAgIGNvbG9yID0gJ2Rhbmdlcic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdoaWdoJztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubG93IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSdsb3cnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLmtleSsnIGlzICcrKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgbG93JztcbiAgICAgIGNvbG9yID0gJyMzNDk4REInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0nbG93JztcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnRhcmdldCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0ndGFyZ2V0JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5rZXkrJyBpcyB3aXRoaW4gdGhlIHRhcmdldCBhdCAnK2tldHRsZS50ZW1wLmN1cnJlbnQrJ1xcdTAwQjAnO1xuICAgICAgY29sb3IgPSAnZ29vZCc7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSd0YXJnZXQnO1xuICAgIH1cbiAgICBlbHNlIGlmKCFrZXR0bGUpe1xuICAgICAgbWVzc2FnZSA9ICdUZXN0aW5nIEFsZXJ0cywgeW91IGFyZSByZWFkeSB0byBnbywgY2xpY2sgcGxheSBvbiBhIGtldHRsZS4nO1xuICAgIH1cblxuICAgIC8vIE1vYmlsZSBWaWJyYXRlIE5vdGlmaWNhdGlvblxuICAgIGlmIChcInZpYnJhdGVcIiBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIG5hdmlnYXRvci52aWJyYXRlKFs1MDAsIDMwMCwgNTAwXSk7XG4gICAgfVxuXG4gICAgLy8gU291bmQgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5vbj09PXRydWUpe1xuICAgICAgLy9kb24ndCBhbGVydCBpZiB0aGUgaGVhdGVyIGlzIHJ1bm5pbmcgYW5kIHRlbXAgaXMgdG9vIGxvd1xuICAgICAgaWYoISF0aW1lciAmJiBrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHZhciBzbmQgPSBuZXcgQXVkaW8oKCEhdGltZXIpID8gJHNjb3BlLnNldHRpbmdzLnNvdW5kcy50aW1lciA6ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMuYWxlcnQpOyAvLyBidWZmZXJzIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGVkXG4gICAgICBzbmQucGxheSgpO1xuICAgIH1cblxuICAgIC8vIFdpbmRvdyBOb3RpZmljYXRpb25cbiAgICBpZihcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyl7XG4gICAgICAvL2Nsb3NlIHRoZSBwcmV2aW91cyBub3RpZmljYXRpb25cbiAgICAgIGlmKG5vdGlmaWNhdGlvbilcbiAgICAgICAgbm90aWZpY2F0aW9uLmNsb3NlKCk7XG5cbiAgICAgIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIil7XG4gICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgIGlmKGtldHRsZSlcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLmtleSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKCdUZXN0IGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSAnZGVuaWVkJyl7XG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAocGVybWlzc2lvbikge1xuICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2VwdHMsIGxldCdzIGNyZWF0ZSBhIG5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oa2V0dGxlLmtleSsnIGtldHRsZScse2JvZHk6bWVzc2FnZSxpY29uOmljb259KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTbGFjayBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjay5pbmRleE9mKCdodHRwJykgPT09IDApe1xuICAgICAgQnJld1NlcnZpY2Uuc2xhY2soJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2ssXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICBpY29uLFxuICAgICAgICAgIGtldHRsZVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgIGlmKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke0pTT04uc3RyaW5naWZ5KGVycil9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudXBkYXRlS25vYkNvcHkgPSBmdW5jdGlvbihrZXR0bGUpe1xuXG4gICAgaWYoIWtldHRsZS5hY3RpdmUpe1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ25vdCBydW5uaW5nJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmKGtldHRsZS5lcnJvci5tZXNzYWdlKXtcbiAgICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICcjZGRkJztcbiAgICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdlcnJvcic7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAvL2lzIHRlbXAgdG9vIGhpZ2g/XG4gICAgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA+IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjEpJztcbiAgICAgIGtldHRsZS5oaWdoID0ga2V0dGxlLnRlbXAuY3VycmVudC1rZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGhpZ2gnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC41KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuMSknO1xuICAgICAga2V0dGxlLmxvdyA9IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2hlYXRpbmcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjU1LDAsMCwuNiknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IChrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGxvdyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuMSknO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ3dpdGhpbiB0YXJnZXQnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAga2V0dGxlLmhpZ2ggPSBudWxsO1xuICAgIH1cbiAgICAvLyB1cGRhdGUgc3VidGV4dCB0byBpbmNsdWRlIGh1bWlkaXR5XG4gICAgaWYoa2V0dGxlLmh1bWlkaXR5KXtcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IGtldHRsZS5odW1pZGl0eSsnJSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlS2V0dGxlVHlwZSA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgLy9kb24ndCBhbGxvdyBjaGFuZ2luZyBrZXR0bGVzIG9uIHNoYXJlZCBzZXNzaW9uc1xuICAgIC8vdGhpcyBjb3VsZCBiZSBkYW5nZXJvdXMgaWYgZG9pbmcgdGhpcyByZW1vdGVseVxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpXG4gICAgICByZXR1cm47XG4gICAgLy8gZmluZCBjdXJyZW50IGtldHRsZVxuICAgIHZhciBrZXR0bGVJbmRleCA9IF8uZmluZEluZGV4KCRzY29wZS5rZXR0bGVUeXBlcywge3R5cGU6IGtldHRsZS50eXBlfSk7XG4gICAgLy8gbW92ZSB0byBuZXh0IG9yIGZpcnN0IGtldHRsZSBpbiBhcnJheVxuICAgIGtldHRsZUluZGV4Kys7XG4gICAgdmFyIGtldHRsZVR5cGUgPSAoJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSkgPyAkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdIDogJHNjb3BlLmtldHRsZVR5cGVzWzBdO1xuICAgIC8vdXBkYXRlIGtldHRsZSBvcHRpb25zIGlmIGNoYW5nZWRcbiAgICBrZXR0bGUua2V5ID0ga2V0dGxlVHlwZS5uYW1lO1xuICAgIGtldHRsZS50eXBlID0ga2V0dGxlVHlwZS50eXBlO1xuICAgIGtldHRsZS50ZW1wLnRhcmdldCA9IGtldHRsZVR5cGUudGFyZ2V0O1xuICAgIGtldHRsZS50ZW1wLmRpZmYgPSBrZXR0bGVUeXBlLmRpZmY7XG4gICAga2V0dGxlLmtub2IgPSBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOmtldHRsZS50ZW1wLmN1cnJlbnQsbWluOjAsbWF4OmtldHRsZVR5cGUudGFyZ2V0K2tldHRsZVR5cGUuZGlmZn0pO1xuICAgIGlmKGtldHRsZVR5cGUudHlwZSA9PSAnZmVybWVudGVyJyB8fCBrZXR0bGVUeXBlLnR5cGUgPT0gJ2Fpcicpe1xuICAgICAga2V0dGxlLmNvb2xlciA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUucHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V0dGxlLnB1bXAgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLmNvb2xlcjtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVVuaXRzID0gZnVuY3Rpb24odW5pdCl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnVuaXQgIT0gdW5pdCl7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudW5pdCA9IHVuaXQ7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgICAga2V0dGxlLnRlbXAuY3VycmVudCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC5jdXJyZW50LHVuaXQpO1xuICAgICAgICBrZXR0bGUudGVtcC50YXJnZXQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAudGFyZ2V0LHVuaXQpO1xuICAgICAgICBpZighIWtldHRsZS50ZW1wLmFkanVzdCl7XG4gICAgICAgICAgaWYodW5pdCA9PT0gJ0MnKVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gTWF0aC5yb3VuZChrZXR0bGUudGVtcC5hZGp1c3QqMC41NTUpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjEuOCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGtub2JcbiAgICAgICAga2V0dGxlLmtub2IudmFsdWUgPSBrZXR0bGUudGVtcC5jdXJyZW50O1xuICAgICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZisxMDtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnModW5pdCk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50aW1lclJ1biA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgcmV0dXJuICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAvL2NhbmNlbCBpbnRlcnZhbCBpZiB6ZXJvIG91dFxuICAgICAgaWYoIXRpbWVyLnVwICYmIHRpbWVyLm1pbj09MCAmJiB0aW1lci5zZWM9PTApe1xuICAgICAgICAvL3N0b3AgcnVubmluZ1xuICAgICAgICB0aW1lci5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIC8vc3RhcnQgdXAgY291bnRlclxuICAgICAgICB0aW1lci51cCA9IHttaW46MCxzZWM6MCxydW5uaW5nOnRydWV9O1xuICAgICAgICAvL2lmIGFsbCB0aW1lcnMgYXJlIGRvbmUgc2VuZCBhbiBhbGVydFxuICAgICAgICBpZiggISFrZXR0bGUgJiYgXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3VwOiB7cnVubmluZzp0cnVlfX0pLmxlbmd0aCA9PSBrZXR0bGUudGltZXJzLmxlbmd0aCApXG4gICAgICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSx0aW1lcik7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwICYmIHRpbWVyLnNlYyA+IDApe1xuICAgICAgICAvL2NvdW50IGRvd24gc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWMtLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCAmJiB0aW1lci51cC5zZWMgPCA1OSl7XG4gICAgICAgIC8vY291bnQgdXAgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWMrKztcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXApe1xuICAgICAgICAvL3Nob3VsZCB3ZSBzdGFydCB0aGUgbmV4dCB0aW1lcj9cbiAgICAgICAgaWYoISFrZXR0bGUpe1xuICAgICAgICAgIF8uZWFjaChfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7cnVubmluZzpmYWxzZSxtaW46dGltZXIubWluLHF1ZXVlOmZhbHNlfSksZnVuY3Rpb24obmV4dFRpbWVyKXtcbiAgICAgICAgICAgICRzY29wZS5hbGVydChrZXR0bGUsbmV4dFRpbWVyKTtcbiAgICAgICAgICAgIG5leHRUaW1lci5xdWV1ZT10cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnRpbWVyU3RhcnQobmV4dFRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICB9LDYwMDAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvdW5kIGRvd24gbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci5zZWM9NTk7XG4gICAgICAgIHRpbWVyLm1pbi0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwKXtcbiAgICAgICAgLy9jb3VuZCB1cCBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYz0wO1xuICAgICAgICB0aW1lci51cC5taW4rKztcbiAgICAgIH1cbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS50aW1lclN0YXJ0ID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICBpZih0aW1lci51cCAmJiB0aW1lci51cC5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIudXAucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgIC8vc3RvcCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz1mYWxzZTtcbiAgICAgICRpbnRlcnZhbC5jYW5jZWwodGltZXIuaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3N0YXJ0IHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPXRydWU7XG4gICAgICB0aW1lci5xdWV1ZT1mYWxzZTtcbiAgICAgIHRpbWVyLmludGVydmFsID0gJHNjb3BlLnRpbWVyUnVuKHRpbWVyLGtldHRsZSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5wcm9jZXNzVGVtcHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBhbGxTZW5zb3JzID0gW107XG4gICAgLy9vbmx5IHByb2Nlc3MgYWN0aXZlIHNlbnNvcnNcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrLCBpKSA9PiB7XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1tpXS5hY3RpdmUpe1xuICAgICAgICBhbGxTZW5zb3JzLnB1c2goQnJld1NlcnZpY2UudGVtcCgkc2NvcGUua2V0dGxlc1tpXSlcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiAkc2NvcGUudXBkYXRlVGVtcChyZXNwb25zZSwgJHNjb3BlLmtldHRsZXNbaV0pKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsICRzY29wZS5rZXR0bGVzW2ldKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuICRxLmFsbChhbGxTZW5zb3JzKVxuICAgICAgLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgLy9yZSBwcm9jZXNzIG9uIHRpbWVvdXRcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24oa2V0dGxlLGZpZWxkLHVwKXtcblxuICAgIGlmKHRpbWVvdXQpXG4gICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dCk7XG5cbiAgICBpZih1cClcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXSsrO1xuICAgIGVsc2VcbiAgICAgIGtldHRsZS50ZW1wW2ZpZWxkXS0tO1xuXG4gICAgLy91cGRhdGUga25vYiBhZnRlciAxIHNlY29uZHMsIG90aGVyd2lzZSB3ZSBnZXQgYSBsb3Qgb2YgcmVmcmVzaCBvbiB0aGUga25vYiB3aGVuIGNsaWNraW5nIHBsdXMgb3IgbWludXNcbiAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIC8vdXBkYXRlIG1heFxuICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICB9LDEwMDApO1xuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnKCkgLy8gbG9hZCBjb25maWdcbiAgICAudGhlbigkc2NvcGUuaW5pdCkgLy8gaW5pdFxuICAgIC50aGVuKGxvYWRlZCA9PiB7XG4gICAgICBpZighIWxvYWRlZClcbiAgICAgICAgJHNjb3BlLnByb2Nlc3NUZW1wcygpOyAvLyBzdGFydCBwb2xsaW5nXG4gICAgfSk7XG4gIC8vIHNjb3BlIHdhdGNoXG4gICRzY29wZS4kd2F0Y2goJ3NldHRpbmdzJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgna2V0dGxlcycsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdrZXR0bGVzJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgnc2hhcmUnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcbn0pO1xuXG4kKCBkb2N1bWVudCApLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvY29udHJvbGxlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmRpcmVjdGl2ZSgnZWRpdGFibGUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge21vZGVsOic9Jyx0eXBlOidAPycsdHJpbTonQD8nLGNoYW5nZTonJj8nLGVudGVyOicmPycscGxhY2Vob2xkZXI6J0A/J30sXG4gICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICB0ZW1wbGF0ZTpcbic8c3Bhbj4nK1xuICAgICc8aW5wdXQgdHlwZT1cInt7dHlwZX19XCIgbmctbW9kZWw9XCJtb2RlbFwiIG5nLXNob3c9XCJlZGl0XCIgbmctZW50ZXI9XCJlZGl0PWZhbHNlXCIgbmctY2hhbmdlPVwie3tjaGFuZ2V8fGZhbHNlfX1cIiBjbGFzcz1cImVkaXRhYmxlXCI+PC9pbnB1dD4nK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0YWJsZVwiIG5nLXNob3c9XCIhZWRpdFwiPnt7KHRyaW0pID8gKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAoKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSB8IGxpbWl0VG86dHJpbSkrXCIuLi5cIikgOicrXG4gICAgICAgICcgKCh0eXBlPT1cInBhc3N3b3JkXCIpID8gXCIqKioqKioqXCIgOiAobW9kZWwgfHwgcGxhY2Vob2xkZXIpKX19PC9zcGFuPicrXG4nPC9zcGFuPicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgc2NvcGUuZWRpdCA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudHlwZSA9ICEhc2NvcGUudHlwZSA/IHNjb3BlLnR5cGUgOiAndGV4dCc7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmVkaXQgPSB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYoc2NvcGUuZW50ZXIpIHNjb3BlLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PTEzICkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMubmdFbnRlcik7XG4gICAgICAgICAgICAgIGlmKHNjb3BlLmNoYW5nZSlcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuY2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdvblJlYWRGaWxlJywgZnVuY3Rpb24gKCRwYXJzZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0c2NvcGU6IGZhbHNlLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIGZuID0gJHBhcnNlKGF0dHJzLm9uUmVhZEZpbGUpO1xuXG5cdFx0XHRlbGVtZW50Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihvbkNoYW5nZUV2ZW50KSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmlsZSA9IChvbkNoYW5nZUV2ZW50LnNyY0VsZW1lbnQgfHwgb25DaGFuZ2VFdmVudC50YXJnZXQpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgZXh0ZW5zaW9uID0gKGZpbGUpID8gZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihvbkxvYWRFdmVudCkge1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZuKHNjb3BlLCB7JGZpbGVDb250ZW50OiBvbkxvYWRFdmVudC50YXJnZXQucmVzdWx0LCAkZXh0OiBleHRlbnNpb259KTtcbiAgICAgICAgICAgIGVsZW1lbnQudmFsKG51bGwpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2RpcmVjdGl2ZXMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZpbHRlcignbW9tZW50JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcbiAgICAgIGlmKCFkYXRlKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBpZihmb3JtYXQpXG4gICAgICAgIHJldHVybiBtb21lbnQoZGF0ZS50b1N0cmluZygpKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlLnRvU3RyaW5nKCkpLmZyb21Ob3coKTtcbiAgICB9O1xufSlcbi5maWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZW1wLHVuaXQpIHtcbiAgICBpZih1bml0PT0nRicpXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9GYWhyZW5oZWl0JykodGVtcCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKHRlbXApO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvRmFocmVuaGVpdCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oY2Vsc2l1cykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKGNlbHNpdXMqOS81KzMyKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0NlbHNpdXMnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZhaHJlbmhlaXQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgoZmFocmVuaGVpdC0zMikqNS85KTtcbiAgfTtcbn0pXG4uZmlsdGVyKCdoaWdobGlnaHQnLCBmdW5jdGlvbigkc2NlKSB7XG4gIHJldHVybiBmdW5jdGlvbih0ZXh0LCBwaHJhc2UpIHtcbiAgICBpZiAodGV4dCAmJiBwaHJhc2UpIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cCgnKCcrcGhyYXNlKycpJywgJ2dpJyksICc8c3BhbiBjbGFzcz1cImhpZ2hsaWdodGVkXCI+JDE8L3NwYW4+Jyk7XG4gICAgfSBlbHNlIGlmKCF0ZXh0KXtcbiAgICAgIHRleHQgPSAnJztcbiAgICB9XG4gICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dC50b1N0cmluZygpKTtcbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2ZpbHRlcnMuanMiLCJhbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InKVxuLmZhY3RvcnkoJ0JyZXdTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkZmlsdGVyKXtcblxuICByZXR1cm4ge1xuXG4gICAgLy9jb29raWVzIHNpemUgNDA5NiBieXRlc1xuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xuICAgICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSl7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2V0dGluZ3MnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdrZXR0bGVzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2hhcmUnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwb2xsU2Vjb25kczogMTBcbiAgICAgICAgLHVuaXQ6ICdGJ1xuICAgICAgICAsbGF5b3V0OiAnY2FyZCdcbiAgICAgICAgLGNoYXJ0OiB0cnVlXG4gICAgICAgICxzaGFyZWQ6IGZhbHNlXG4gICAgICAgICxyZWNpcGU6IHsnbmFtZSc6JycsJ2JyZXdlcic6e25hbWU6JycsJ2VtYWlsJzonJ30sJ3llYXN0JzpbXSwnaG9wcyc6W10sJ2dyYWlucyc6W10sc2NhbGU6J2dyYXZpdHknLG1ldGhvZDoncGFwYXppYW4nLCdvZyc6MS4wNTAsJ2ZnJzoxLjAxMCwnYWJ2JzowLCdhYncnOjAsJ2NhbG9yaWVzJzowLCdhdHRlbnVhdGlvbic6MH1cbiAgICAgICAgLG5vdGlmaWNhdGlvbnM6IHtvbjp0cnVlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfVxuICAgICAgICAsc291bmRzOiB7b246dHJ1ZSxhbGVydDonL2Fzc2V0cy9hdWRpby9iaWtlLm1wMycsdGltZXI6Jy9hc3NldHMvYXVkaW8vc2Nob29sLm1wMyd9XG4gICAgICAgICxhY2NvdW50OiB7YXBpS2V5OiAnJywgc2Vzc2lvbnM6IFtdfVxuICAgICAgICAsaW5mbHV4ZGI6IHt1cmw6ICcnLCBwb3J0OiA4MDg2LCB1c2VyOiAnJywgcGFzczogJycsIGRiOiAnJywgZGJzOltdLCBjb25uZWN0ZWQ6IGZhbHNlfVxuICAgICAgICAsYXJkdWlub3M6IFt7XG4gICAgICAgICAgaWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLFxuICAgICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgICBkaWdpdGFsOiAxMyxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgICAgICx0cGxpbms6IHt1c2VyOiAnJywgcGFzczogJycsIHRva2VuOicnLCBwbHVnczogW119XG4gICAgICAgICxza2V0Y2hlczoge2ZyZXF1ZW5jeTogNjAsIGlnbm9yZV92ZXJzaW9uX2Vycm9yOiBmYWxzZX1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLbm9iT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICB1bml0OiAnXFx1MDBCMCcsXG4gICAgICAgIHN1YlRleHQ6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgIGNvbG9yOiAnZ3JheScsXG4gICAgICAgICAgZm9udDogJ2F1dG8nXG4gICAgICAgIH0sXG4gICAgICAgIHRyYWNrV2lkdGg6IDQwLFxuICAgICAgICBiYXJXaWR0aDogMjUsXG4gICAgICAgIGJhckNhcDogMjUsXG4gICAgICAgIHRyYWNrQ29sb3I6ICcjZGRkJyxcbiAgICAgICAgYmFyQ29sb3I6ICcjNzc3JyxcbiAgICAgICAgZHluYW1pY09wdGlvbnM6IHRydWUsXG4gICAgICAgIGRpc3BsYXlQcmV2aW91czogdHJ1ZSxcbiAgICAgICAgcHJldkJhckNvbG9yOiAnIzc3NydcbiAgICAgIH07XG4gICAgfSxcblxuICAgIGRlZmF1bHRLZXR0bGVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAga2V5OiAnSG90IExpcXVvcidcbiAgICAgICAgICAsdHlwZTogJ3dhdGVyJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDMnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EwJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjE3MCxkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH0se1xuICAgICAgICAgIGtleTogJ01hc2gnXG4gICAgICAgICAgLHR5cGU6ICdncmFpbidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDQnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q1JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMScsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNTIsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBrZXk6ICdCb2lsJ1xuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogZmFsc2V9XG4gICAgICAgIH1dO1xuICAgIH0sXG5cbiAgICBzZXR0aW5nczogZnVuY3Rpb24oa2V5LHZhbHVlcyl7XG4gICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHZhbHVlcyl7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSl7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAvKkpTT04gcGFyc2UgZXJyb3IqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2Vuc29yVHlwZXM6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgbGV0IHNlbnNvcnMgPSBbXG4gICAgICAgIHtuYW1lOiAnVGhlcm1pc3RvcicsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogZmFsc2V9XG4gICAgICAgICx7bmFtZTogJ0RTMThCMjAnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdQVDEwMCcsIGFuYWxvZzogdHJ1ZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMTEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIyJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZihuYW1lKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoc2Vuc29ycywgeyduYW1lJzogbmFtZX0pWzBdO1xuICAgICAgcmV0dXJuIHNlbnNvcnM7XG4gICAgfSxcblxuICAgIGtldHRsZVR5cGVzOiBmdW5jdGlvbih0eXBlKXtcbiAgICAgIGxldCBrZXR0bGVzID0gW1xuICAgICAgICB7J25hbWUnOidCb2lsJywndHlwZSc6J2hvcCcsJ3RhcmdldCc6MjAwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonTWFzaCcsJ3R5cGUnOidncmFpbicsJ3RhcmdldCc6MTUyLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonSG90IExpcXVvcicsJ3R5cGUnOid3YXRlcicsJ3RhcmdldCc6MTcwLCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonRmVybWVudGVyJywndHlwZSc6J2Zlcm1lbnRlcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidBaXInLCd0eXBlJzonYWlyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgIF07XG4gICAgICBpZih0eXBlKVxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoa2V0dGxlcywgeyd0eXBlJzogdHlwZX0pWzBdO1xuICAgICAgcmV0dXJuIGtldHRsZXM7XG4gICAgfSxcblxuICAgIGRvbWFpbjogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGRvbWFpbiA9ICdodHRwOi8vYXJkdWluby5sb2NhbCc7XG5cbiAgICAgIGlmKGFyZHVpbm8gJiYgYXJkdWluby51cmwpe1xuICAgICAgICBkb21haW4gPSAoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSAhPT0gLTEpID9cbiAgICAgICAgICBhcmR1aW5vLnVybC5zdWJzdHIoYXJkdWluby51cmwuaW5kZXhPZignLy8nKSsyKSA6XG4gICAgICAgICAgYXJkdWluby51cmw7XG5cbiAgICAgICAgaWYoISFhcmR1aW5vLnNlY3VyZSlcbiAgICAgICAgICBkb21haW4gPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZG9tYWluID0gYGh0dHA6Ly8ke2RvbWFpbn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0sXG5cbiAgICBzbGFjazogZnVuY3Rpb24od2ViaG9va191cmwsIG1zZywgY29sb3IsIGljb24sIGtldHRsZSl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIGxldCBwb3N0T2JqID0geydhdHRhY2htZW50cyc6IFt7J2ZhbGxiYWNrJzogbXNnLFxuICAgICAgICAgICAgJ3RpdGxlJzoga2V0dGxlLmtleSxcbiAgICAgICAgICAgICd0aXRsZV9saW5rJzogJ2h0dHA6Ly8nK2RvY3VtZW50LmxvY2F0aW9uLmhvc3QsXG4gICAgICAgICAgICAnZmllbGRzJzogW3sndmFsdWUnOiBtc2d9XSxcbiAgICAgICAgICAgICdjb2xvcic6IGNvbG9yLFxuICAgICAgICAgICAgJ21ya2R3bl9pbic6IFsndGV4dCcsICdmYWxsYmFjaycsICdmaWVsZHMnXSxcbiAgICAgICAgICAgICd0aHVtYl91cmwnOiBpY29uXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgJGh0dHAoe3VybDogd2ViaG9va191cmwsIG1ldGhvZDonUE9TVCcsIGRhdGE6ICdwYXlsb2FkPScrSlNPTi5zdHJpbmdpZnkocG9zdE9iaiksIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH19KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRoZXJtaXN0b3IsIERTMThCMjAsIG9yIFBUMTAwXG4gICAgLy8gaHR0cHM6Ly9sZWFybi5hZGFmcnVpdC5jb20vdGhlcm1pc3Rvci91c2luZy1hLXRoZXJtaXN0b3JcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zODEpXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzI5MCBhbmQgaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzMyOFxuICAgIHRlbXA6IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vLycra2V0dGxlLnRlbXAudHlwZSsnLycra2V0dGxlLnRlbXAucGluO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuICAgIC8vIHJlYWQvd3JpdGUgaGVhdGVyXG4gICAgLy8gaHR0cDovL2FyZHVpbm90cm9uaWNzLmJsb2dzcG90LmNvbS8yMDEzLzAxL3dvcmtpbmctd2l0aC1zYWluc21hcnQtNXYtcmVsYXktYm9hcmQuaHRtbFxuICAgIC8vIGh0dHA6Ly9teWhvd3Rvc2FuZHByb2plY3RzLmJsb2dzcG90LmNvbS8yMDE0LzAyL3NhaW5zbWFydC0yLWNoYW5uZWwtNXYtcmVsYXktYXJkdWluby5odG1sXG4gICAgZGlnaXRhbDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBhbmFsb2c6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9hbmFsb2cvJytzZW5zb3IrJy8nK3ZhbHVlO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkaWdpdGFsUmVhZDogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix0aW1lb3V0KXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcjtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiAodGltZW91dCB8fCBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwKX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvYWRTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBxdWVyeSA9ICcnO1xuICAgICAgaWYocGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ID0gJz9wYXNzd29yZD0nK21kNShwYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9nZXQvJytmaWxlK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIGZpbmlzaCB0aGlzXG4gICAgLy8gZGVsZXRlU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgLy8gICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgLy8gICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9kZWxldGUvJytmaWxlLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIC8vICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgLy8gICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICByZXR1cm4gcS5wcm9taXNlO1xuICAgIC8vIH0sXG5cbiAgICBjcmVhdGVTaGFyZTogZnVuY3Rpb24oc2hhcmUpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBrZXR0bGVzID0gdGhpcy5zZXR0aW5ncygna2V0dGxlcycpO1xuICAgICAgbGV0IHNoID0gT2JqZWN0LmFzc2lnbih7fSwge3Bhc3N3b3JkOiBzaGFyZS5wYXNzd29yZCwgYWNjZXNzOiBzaGFyZS5hY2Nlc3N9KTtcbiAgICAgIC8vcmVtb3ZlIHNvbWUgdGhpbmdzIHdlIGRvbid0IG5lZWQgdG8gc2hhcmVcbiAgICAgIF8uZWFjaChrZXR0bGVzLCAoa2V0dGxlLCBpKSA9PiB7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLmtub2I7XG4gICAgICAgIGRlbGV0ZSBrZXR0bGVzW2ldLnZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHNldHRpbmdzLmFjY291bnQ7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mubm90aWZpY2F0aW9ucztcbiAgICAgIHNldHRpbmdzLnNoYXJlZCA9IHRydWU7XG4gICAgICBpZihzaC5wYXNzd29yZClcbiAgICAgICAgc2gucGFzc3dvcmQgPSBtZDUoc2gucGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvY3JlYXRlLycsXG4gICAgICAgICAgbWV0aG9kOidQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7J3NoYXJlJzogc2gsICdzZXR0aW5ncyc6IHNldHRpbmdzLCAna2V0dGxlcyc6IGtldHRsZXN9LFxuICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHNoYXJlVGVzdDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgcXVlcnkgPSBgdXJsPSR7YXJkdWluby51cmx9YFxuXG4gICAgICBpZihhcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBxdWVyeSArPSAnJmF1dGg9JytidG9hKCdyb290OicrYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL3Rlc3QvPycrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGlwOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvaXAnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBkd2VldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYXRlc3Q6ICgpID0+IHtcbiAgICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9sYXRlc3QvZHdlZXQvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbGw6ICgpID0+IHtcbiAgICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICRodHRwKHt1cmw6ICdodHRwczovL2R3ZWV0LmlvL2dldC9kd2VldHMvZm9yL2JyZXdiZW5jaCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0cGxpbms6IGZ1bmN0aW9uKCl7XG4gICAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vd2FwLnRwbGlua2Nsb3VkLmNvbVwiO1xuICAgICAgbGV0IHBhcmFtcyA9IHtcbiAgICAgICAgYXBwTmFtZTogJ0thc2FfQW5kcm9pZCcsXG4gICAgICAgIHRlcm1JRDogJ0JyZXdCZW5jaCcsXG4gICAgICAgIGFwcFZlcjogJzEuNC40LjYwNycsXG4gICAgICAgIG9zcGY6ICdBbmRyb2lkKzYuMC4xJyxcbiAgICAgICAgbmV0VHlwZTogJ3dpZmknLFxuICAgICAgICBsb2NhbGU6ICdlc19FTidcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBpZihzZXR0aW5ncy50cGxpbmsudG9rZW4pe1xuICAgICAgICAgICAgcGFyYW1zLnRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgICAgcmV0dXJuIHVybCsnLz8nK2pRdWVyeS5wYXJhbShwYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luOiAodXNlcixwYXNzKSA9PiB7XG4gICAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGlmKCF1c2VyIHx8ICFwYXNzKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIExvZ2luJyk7XG4gICAgICAgICAgY29uc3QgbG9naW5fcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6IFwibG9naW5cIixcbiAgICAgICAgICAgIFwidXJsXCI6IHVybCxcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJhcHBUeXBlXCI6IFwiS2FzYV9BbmRyb2lkXCIsXG4gICAgICAgICAgICAgIFwiY2xvdWRQYXNzd29yZFwiOiBwYXNzLFxuICAgICAgICAgICAgICBcImNsb3VkVXNlck5hbWVcIjogdXNlcixcbiAgICAgICAgICAgICAgXCJ0ZXJtaW5hbFVVSURcIjogcGFyYW1zLnRlcm1JRFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGxvZ2luX3BheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEucmVzdWx0KXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICB0b2tlbiA9IHRva2VuIHx8IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHt0b2tlbjogdG9rZW59LFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZDogXCJnZXREZXZpY2VMaXN0XCIgfSksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1hbmQ6IChkZXZpY2UsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgICAgICBsZXQgdG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgbGV0IHBheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOlwicGFzc3Rocm91Z2hcIixcbiAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgXCJkZXZpY2VJZFwiOiBkZXZpY2UuZGV2aWNlSWQsXG4gICAgICAgICAgICAgIFwicmVxdWVzdERhdGFcIjogSlNPTi5zdHJpbmdpZnkoIGNvbW1hbmQgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gc2V0IHRoZSB0b2tlblxuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICRodHRwKHt1cmw6IGRldmljZS5hcHBTZXJ2ZXJVcmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDEgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiAwIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcImdldF9zeXNpbmZvXCI6bnVsbH0sXCJlbWV0ZXJcIjp7XCJnZXRfcmVhbHRpbWVcIjpudWxsfX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBpbmZsdXhkYjogZnVuY3Rpb24oKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaW5mbHV4Q29ubmVjdGlvbiA9IGAke3NldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgICAgaWYoICEhc2V0dGluZ3MuaW5mbHV4ZGIucG9ydCApXG4gICAgICAgIGluZmx1eENvbm5lY3Rpb24gKz0gYDoke3NldHRpbmdzLmluZmx1eGRiLnBvcnR9YFxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwaW5nOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcGluZ2AsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBkYnM6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoJ3Nob3cgZGF0YWJhc2VzJyl9YCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMgKXtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllc1swXS52YWx1ZXMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlREI6IChuYW1lKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGBDUkVBVEUgREFUQUJBU0UgXCIke25hbWV9XCJgKX1gLCBtZXRob2Q6ICdQT1NUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHBrZzogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9wYWNrYWdlLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBncmFpbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvZ3JhaW5zLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaG9wczogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ob3BzLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgd2F0ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvd2F0ZXIuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzdHlsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9zdHlsZWd1aWRlLmpzb24nKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGxvdmlib25kOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2xvdmlib25kLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgY2hhcnRPcHRpb25zOiBmdW5jdGlvbih1bml0KXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaW5lQ2hhcnQnLFxuICAgICAgICAgICAgICBub0RhdGE6ICdCcmV3QmVuY2ggTGl2ZScsXG4gICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICBtYXJnaW4gOiB7XG4gICAgICAgICAgICAgICAgICB0b3A6IDIwLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDIwLFxuICAgICAgICAgICAgICAgICAgYm90dG9tOiAxMDAsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiA2NVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB4OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMF0gOiBkOyB9LFxuICAgICAgICAgICAgICB5OiBmdW5jdGlvbihkKXsgcmV0dXJuIChkICYmIGQubGVuZ3RoKSA/IGRbMV0gOiBkOyB9LFxuICAgICAgICAgICAgICAvLyBhdmVyYWdlOiBmdW5jdGlvbihkKSB7IHJldHVybiBkLm1lYW4gfSxcblxuICAgICAgICAgICAgICBjb2xvcjogZDMuc2NhbGUuY2F0ZWdvcnkxMCgpLnJhbmdlKCksXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlR3VpZGVsaW5lOiB0cnVlLFxuICAgICAgICAgICAgICBjbGlwVm9yb25vaTogZmFsc2UsXG5cbiAgICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RpbWUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy50aW1lLmZvcm1hdCgnJUk6JU06JVMnKShuZXcgRGF0ZShkKSlcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdib3R0b20nLFxuICAgICAgICAgICAgICAgICAgdGlja1BhZGRpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDQwLFxuICAgICAgICAgICAgICAgICAgc3RhZ2dlckxhYmVsczogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmb3JjZVk6ICghdW5pdCB8fCB1bml0PT0nRicpID8gWzAsMjIwXSA6IFstMTcsMTA0XSxcbiAgICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbDogJ1RlbXBlcmF0dXJlJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkKydcXHUwMEIwJztcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBvcmllbnQ6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgIHNob3dNYXhNaW46IHRydWUsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS8yMDExLzA2LzE2L2FsY29ob2wtYnktdm9sdW1lLWNhbGN1bGF0b3ItdXBkYXRlZC9cbiAgICAvLyBQYXBhemlhblxuICAgIGFidjogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIG9nIC0gZmcgKSAqIDEzMS4yNSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIERhbmllbHMsIHVzZWQgZm9yIGhpZ2ggZ3Jhdml0eSBiZWVyc1xuICAgIGFidmE6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCA3Ni4wOCAqICggb2cgLSBmZyApIC8gKCAxLjc3NSAtIG9nICkpICogKCBmZyAvIDAuNzk0ICkpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vaGJkLm9yZy9lbnNtaW5nci9cbiAgICBhYnc6IGZ1bmN0aW9uKGFidixmZyl7XG4gICAgICByZXR1cm4gKCgwLjc5ICogYWJ2KSAvIGZnKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgcmU6IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoMC4xODA4ICogb3ApICsgKDAuODE5MiAqIGZwKTtcbiAgICB9LFxuICAgIGF0dGVudWF0aW9uOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKCgxIC0gKGZwL29wKSkqMTAwKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgY2Fsb3JpZXM6IGZ1bmN0aW9uKGFidyxyZSxmZyl7XG4gICAgICByZXR1cm4gKCgoNi45ICogYWJ3KSArIDQuMCAqIChyZSAtIDAuMSkpICogZmcgKiAzLjU1KS50b0ZpeGVkKDEpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL3d3dy5icmV3ZXJzZnJpZW5kLmNvbS9wbGF0by10by1zZy1jb252ZXJzaW9uLWNoYXJ0L1xuICAgIHNnOiBmdW5jdGlvbihwbGF0byl7XG4gICAgICBsZXQgc2cgPSAoIDEgKyAocGxhdG8gLyAoMjU4LjYgLSAoIChwbGF0by8yNTguMikgKiAyMjcuMSkgKSApICkudG9GaXhlZCgzKTtcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHNnKTtcbiAgICB9LFxuICAgIHBsYXRvOiBmdW5jdGlvbihzZyl7XG4gICAgICBsZXQgcGxhdG8gPSAoKC0xICogNjE2Ljg2OCkgKyAoMTExMS4xNCAqIHNnKSAtICg2MzAuMjcyICogTWF0aC5wb3coc2csMikpICsgKDEzNS45OTcgKiBNYXRoLnBvdyhzZywzKSkpLnRvU3RyaW5nKCk7XG4gICAgICBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID09IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKzIpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpIDwgNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgZWxzZSBpZihwbGF0by5zdWJzdHJpbmcocGxhdG8uaW5kZXhPZignLicpKzEscGxhdG8uaW5kZXhPZignLicpKzIpID4gNSl7XG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgICAgcGxhdG8gPSBwYXJzZUZsb2F0KHBsYXRvKSArIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChwbGF0byk7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyU21pdGg6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICBsZXQgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgaWYoISFyZWNpcGUuRl9SX05BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuRl9SX05BTUU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5GX1JfU1RZTEUuRl9TX0NBVEVHT1JZO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5GX1JfQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5GX1JfQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9PRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9GRykudG9GaXhlZCgzKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0FCViwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fQUJWLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9JQlUsMTApO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUpXG4gICAgICAgIHJlc3BvbnNlLmlidSA9IHBhcnNlSW50KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluKXtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkdyYWluLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uRl9HX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KGdyYWluLkZfR19CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IGhvcC5GX0hfTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwID8gbnVsbCA6IHBhcnNlSW50KGhvcC5GX0hfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDBcbiAgICAgICAgICAgICAgICA/ICdEcnkgSG9wICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgICA6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBob3AuRl9IX0FMUEhBXG4gICAgICAgICAgICAvLyBob3AuRl9IX0RSWV9IT1BfVElNRVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9PUklHSU5cbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjKXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX05BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0Lmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5GX1lfTEFCKycgJysoeWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgbmFtZTogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX0xBQisnICcrXG4gICAgICAgICAgICAgIChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICByZWNpcGVCZWVyWE1MOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgbGV0IHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGxldCBtYXNoX3RpbWUgPSA2MDtcblxuICAgICAgaWYoISFyZWNpcGUuTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLlNUWUxFLkNBVEVHT1JZO1xuXG4gICAgICAvLyBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgIC8vICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkJSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuQlJFV0VSO1xuXG4gICAgICBpZighIXJlY2lwZS5PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5JQlUpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VJbnQocmVjaXBlLklCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NQVgpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUFYLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUlOKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01JTiwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUC5sZW5ndGggJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FKXtcbiAgICAgICAgbWFzaF90aW1lID0gcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVBbMF0uU1RFUF9USU1FO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5GRVJNRU5UQUJMRVMpe1xuICAgICAgICBsZXQgZ3JhaW5zID0gKHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgJiYgcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRS5sZW5ndGgpID8gcmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSA6IHJlY2lwZS5GRVJNRU5UQUJMRVM7XG4gICAgICAgIF8uZWFjaChncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtYXNoX3RpbWUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMiksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5IT1BTKXtcbiAgICAgICAgbGV0IGhvcHMgPSAocmVjaXBlLkhPUFMuSE9QICYmIHJlY2lwZS5IT1BTLkhPUC5sZW5ndGgpID8gcmVjaXBlLkhPUFMuSE9QIDogcmVjaXBlLkhPUFM7XG4gICAgICAgIF8uZWFjaChob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgcmVzcG9uc2UuaG9wcy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBob3AuTkFNRSsnICgnK2hvcC5GT1JNKycpJyxcbiAgICAgICAgICAgIG1pbjogaG9wLlVTRSA9PSAnRHJ5IEhvcCcgPyAwIDogcGFyc2VJbnQoaG9wLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6IGhvcC5VU0UgPT0gJ0RyeSBIb3AnXG4gICAgICAgICAgICAgID8gaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nKycgZm9yICcrcGFyc2VJbnQoaG9wLlRJTUUvNjAvMjQsMTApKycgRGF5cydcbiAgICAgICAgICAgICAgOiBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5NSVNDUyl7XG4gICAgICAgIGxldCBtaXNjID0gKHJlY2lwZS5NSVNDUy5NSVNDICYmIHJlY2lwZS5NSVNDUy5NSVNDLmxlbmd0aCkgPyByZWNpcGUuTUlTQ1MuTUlTQyA6IHJlY2lwZS5NSVNDUztcbiAgICAgICAgXy5lYWNoKG1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBtaXNjLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJ0FkZCAnK21pc2MuQU1PVU5UKycgdG8gJyttaXNjLlVTRSxcbiAgICAgICAgICAgIGFtb3VudDogbWlzYy5BTU9VTlRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLllFQVNUUyl7XG4gICAgICAgIGxldCB5ZWFzdCA9IChyZWNpcGUuWUVBU1RTLllFQVNUICYmIHJlY2lwZS5ZRUFTVFMuWUVBU1QubGVuZ3RoKSA/IHJlY2lwZS5ZRUFTVFMuWUVBU1QgOiByZWNpcGUuWUVBU1RTO1xuICAgICAgICAgIF8uZWFjaCh5ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuTkFNRVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBmb3JtYXRYTUw6IGZ1bmN0aW9uKGNvbnRlbnQpe1xuICAgICAgbGV0IGh0bWxjaGFycyA9IFtcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMyODI7JywgcjogJ8SaJ30sXG4gICAgICAgIHtmOiAnJiMyODM7JywgcjogJ8SbJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NDsnLCByOiAnxZgnfSxcbiAgICAgICAge2Y6ICcmIzM0NTsnLCByOiAnxZknfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJiMzNjY7JywgcjogJ8WuJ30sXG4gICAgICAgIHtmOiAnJiMzNjc7JywgcjogJ8WvJ30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzI2NDsnLCByOiAnxIgnfSxcbiAgICAgICAge2Y6ICcmIzI2NTsnLCByOiAnxIknfSxcbiAgICAgICAge2Y6ICcmIzI4NDsnLCByOiAnxJwnfSxcbiAgICAgICAge2Y6ICcmIzI4NTsnLCByOiAnxJ0nfSxcbiAgICAgICAge2Y6ICcmIzI5MjsnLCByOiAnxKQnfSxcbiAgICAgICAge2Y6ICcmIzI5MzsnLCByOiAnxKUnfSxcbiAgICAgICAge2Y6ICcmIzMwODsnLCByOiAnxLQnfSxcbiAgICAgICAge2Y6ICcmIzMwOTsnLCByOiAnxLUnfSxcbiAgICAgICAge2Y6ICcmIzM0ODsnLCByOiAnxZwnfSxcbiAgICAgICAge2Y6ICcmIzM0OTsnLCByOiAnxZ0nfSxcbiAgICAgICAge2Y6ICcmIzM2NDsnLCByOiAnxawnfSxcbiAgICAgICAge2Y6ICcmIzM2NTsnLCByOiAnxa0nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJk9FbGlnOycsIHI6ICfFkid9LFxuICAgICAgICB7ZjogJyZvZWxpZzsnLCByOiAnxZMnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM3NjsnLCByOiAnxbgnfSxcbiAgICAgICAge2Y6ICcmeXVtbDsnLCByOiAnw78nfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMjk2OycsIHI6ICfEqCd9LFxuICAgICAgICB7ZjogJyYjMjk3OycsIHI6ICfEqSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMzYwOycsIHI6ICfFqCd9LFxuICAgICAgICB7ZjogJyYjMzYxOycsIHI6ICfFqSd9LFxuICAgICAgICB7ZjogJyYjMzEyOycsIHI6ICfEuCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzMzNjsnLCByOiAnxZAnfSxcbiAgICAgICAge2Y6ICcmIzMzNzsnLCByOiAnxZEnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNjg7JywgcjogJ8WwJ30sXG4gICAgICAgIHtmOiAnJiMzNjk7JywgcjogJ8WxJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZUSE9STjsnLCByOiAnw54nfSxcbiAgICAgICAge2Y6ICcmdGhvcm47JywgcjogJ8O+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzI1NjsnLCByOiAnxIAnfSxcbiAgICAgICAge2Y6ICcmIzI1NzsnLCByOiAnxIEnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3NDsnLCByOiAnxJInfSxcbiAgICAgICAge2Y6ICcmIzI3NTsnLCByOiAnxJMnfSxcbiAgICAgICAge2Y6ICcmIzI5MDsnLCByOiAnxKInfSxcbiAgICAgICAge2Y6ICcmIzI5MTsnLCByOiAnxKMnfSxcbiAgICAgICAge2Y6ICcmIzI5ODsnLCByOiAnxKonfSxcbiAgICAgICAge2Y6ICcmIzI5OTsnLCByOiAnxKsnfSxcbiAgICAgICAge2Y6ICcmIzMxMDsnLCByOiAnxLYnfSxcbiAgICAgICAge2Y6ICcmIzMxMTsnLCByOiAnxLcnfSxcbiAgICAgICAge2Y6ICcmIzMxNTsnLCByOiAnxLsnfSxcbiAgICAgICAge2Y6ICcmIzMxNjsnLCByOiAnxLwnfSxcbiAgICAgICAge2Y6ICcmIzMyNTsnLCByOiAnxYUnfSxcbiAgICAgICAge2Y6ICcmIzMyNjsnLCByOiAnxYYnfSxcbiAgICAgICAge2Y6ICcmIzM0MjsnLCByOiAnxZYnfSxcbiAgICAgICAge2Y6ICcmIzM0MzsnLCByOiAnxZcnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM2MjsnLCByOiAnxaonfSxcbiAgICAgICAge2Y6ICcmIzM2MzsnLCByOiAnxasnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyYjMjYwOycsIHI6ICfEhCd9LFxuICAgICAgICB7ZjogJyYjMjYxOycsIHI6ICfEhSd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjgwOycsIHI6ICfEmCd9LFxuICAgICAgICB7ZjogJyYjMjgxOycsIHI6ICfEmSd9LFxuICAgICAgICB7ZjogJyYjMzIxOycsIHI6ICfFgSd9LFxuICAgICAgICB7ZjogJyYjMzIyOycsIHI6ICfFgid9LFxuICAgICAgICB7ZjogJyYjMzIzOycsIHI6ICfFgyd9LFxuICAgICAgICB7ZjogJyYjMzI0OycsIHI6ICfFhCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmIzM0NjsnLCByOiAnxZonfSxcbiAgICAgICAge2Y6ICcmIzM0NzsnLCByOiAnxZsnfSxcbiAgICAgICAge2Y6ICcmIzM3NzsnLCByOiAnxbknfSxcbiAgICAgICAge2Y6ICcmIzM3ODsnLCByOiAnxbonfSxcbiAgICAgICAge2Y6ICcmIzM3OTsnLCByOiAnxbsnfSxcbiAgICAgICAge2Y6ICcmIzM4MDsnLCByOiAnxbwnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkF0aWxkZTsnLCByOiAnw4MnfSxcbiAgICAgICAge2Y6ICcmYXRpbGRlOycsIHI6ICfDoyd9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyYjMjU4OycsIHI6ICfEgid9LFxuICAgICAgICB7ZjogJyYjMjU5OycsIHI6ICfEgyd9LFxuICAgICAgICB7ZjogJyZBY2lyYzsnLCByOiAnw4InfSxcbiAgICAgICAge2Y6ICcmYWNpcmM7JywgcjogJ8OiJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmIzM1NDsnLCByOiAnxaInfSxcbiAgICAgICAge2Y6ICcmIzM1NTsnLCByOiAnxaMnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzMzA7JywgcjogJ8WKJ30sXG4gICAgICAgIHtmOiAnJiMzMzE7JywgcjogJ8WLJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTg7JywgcjogJ8WmJ30sXG4gICAgICAgIHtmOiAnJiMzNTk7JywgcjogJ8WnJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MDsnLCByOiAnxI4nfSxcbiAgICAgICAge2Y6ICcmIzI3MTsnLCByOiAnxI8nfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJiMzMTM7JywgcjogJ8S5J30sXG4gICAgICAgIHtmOiAnJiMzMTQ7JywgcjogJ8S6J30sXG4gICAgICAgIHtmOiAnJiMzMTc7JywgcjogJ8S9J30sXG4gICAgICAgIHtmOiAnJiMzMTg7JywgcjogJ8S+J30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJiMzNDA7JywgcjogJ8WUJ30sXG4gICAgICAgIHtmOiAnJiMzNDE7JywgcjogJ8WVJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmIzI4NjsnLCByOiAnxJ4nfSxcbiAgICAgICAge2Y6ICcmIzI4NzsnLCByOiAnxJ8nfSxcbiAgICAgICAge2Y6ICcmIzMwNDsnLCByOiAnxLAnfSxcbiAgICAgICAge2Y6ICcmIzMwNTsnLCByOiAnxLEnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmIzM1MDsnLCByOiAnxZ4nfSxcbiAgICAgICAge2Y6ICcmIzM1MTsnLCByOiAnxZ8nfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmZXVybzsnLCByOiAn4oKsJ30sXG4gICAgICAgIHtmOiAnJnBvdW5kOycsIHI6ICfCoyd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJmJ1bGw7JywgcjogJ+KAoid9LFxuICAgICAgICB7ZjogJyZkYWdnZXI7JywgcjogJ+KAoCd9LFxuICAgICAgICB7ZjogJyZjb3B5OycsIHI6ICfCqSd9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnRyYWRlOycsIHI6ICfihKInfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZwZXJtaWw7JywgcjogJ+KAsCd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJyZuZGFzaDsnLCByOiAn4oCTJ30sXG4gICAgICAgIHtmOiAnJm1kYXNoOycsIHI6ICfigJQnfSxcbiAgICAgICAge2Y6ICcmIzg0NzA7JywgcjogJ+KElid9LFxuICAgICAgICB7ZjogJyZyZWc7JywgcjogJ8KuJ30sXG4gICAgICAgIHtmOiAnJnBhcmE7JywgcjogJ8K2J30sXG4gICAgICAgIHtmOiAnJnBsdXNtbjsnLCByOiAnwrEnfSxcbiAgICAgICAge2Y6ICcmbWlkZG90OycsIHI6ICfCtyd9LFxuICAgICAgICB7ZjogJ2xlc3MtdCcsIHI6ICc8J30sXG4gICAgICAgIHtmOiAnZ3JlYXRlci10JywgcjogJz4nfSxcbiAgICAgICAge2Y6ICcmbm90OycsIHI6ICfCrCd9LFxuICAgICAgICB7ZjogJyZjdXJyZW47JywgcjogJ8KkJ30sXG4gICAgICAgIHtmOiAnJmJydmJhcjsnLCByOiAnwqYnfSxcbiAgICAgICAge2Y6ICcmZGVnOycsIHI6ICfCsCd9LFxuICAgICAgICB7ZjogJyZhY3V0ZTsnLCByOiAnwrQnfSxcbiAgICAgICAge2Y6ICcmdW1sOycsIHI6ICfCqCd9LFxuICAgICAgICB7ZjogJyZtYWNyOycsIHI6ICfCryd9LFxuICAgICAgICB7ZjogJyZjZWRpbDsnLCByOiAnwrgnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZzdXAxOycsIHI6ICfCuSd9LFxuICAgICAgICB7ZjogJyZzdXAyOycsIHI6ICfCsid9LFxuICAgICAgICB7ZjogJyZzdXAzOycsIHI6ICfCsyd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZtaWNybzsnLCByOiAnwrUnfSxcbiAgICAgICAge2Y6ICdoeTtcdCcsIHI6ICcmJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZhbXA7JywgcjogJ2FuZCd9LFxuICAgICAgICB7ZjogJyZsZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcmRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJzcXVvOycsIHI6IFwiJ1wifVxuICAgICAgXTtcblxuICAgICAgXy5lYWNoKGh0bWxjaGFycywgZnVuY3Rpb24oY2hhcikge1xuICAgICAgICBpZihjb250ZW50LmluZGV4T2YoY2hhci5mKSAhPT0gLTEpe1xuICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoUmVnRXhwKGNoYXIuZiwnZycpLCBjaGFyLnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL3NlcnZpY2VzLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==