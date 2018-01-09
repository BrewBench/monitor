webpackJsonp([1],{

/***/ 180:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(24);
__webpack_require__(201);
__webpack_require__(204);
__webpack_require__(205);
__webpack_require__(206);
module.exports = __webpack_require__(207);


/***/ }),

/***/ 201:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _angular = __webpack_require__(13);

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

/***/ 204:
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
      error: { message: '', version: '' },
      notify: { slack: false, dweet: true }
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

  function downloadSketch(actions, sketch, name) {
    console.log('name', name);
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
    var header = '/* Sketch Auto Generated from http://monitor.brewbench.co on ' + moment().format('YYYY-MM-DD HH:MM:SS') + ' for ' + name + '*/\n';
    $http.get('assets/arduino/' + sketch + '/' + sketch + '.ino').then(function (response) {
      // replace variables
      response.data = header + response.data.replace('// [actions]', actions.length ? actions.join('\n') : '').replace('[TPLINK_CONNECTION]', tplink_connection_string).replace('[SLACK_CONNECTION]', $scope.settings.notifications.slack).replace('[FREQUENCY_SECONDS]', $scope.settings.sketches.frequency ? parseInt($scope.settings.sketches.frequency, 10) : 60);
      if (sketch.indexOf('InfluxDB') !== -1) {
        response.data = response.data.replace('[INFLUXDB_CONNECTION]', connection_string);
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
    var actions = [];
    var lastArduino = '';
    _.each(_.orderBy($scope.kettles, 'arduino.url', 'asc'), function (kettle, i) {
      lastArduino = kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, "");
      // reset the actions
      if (kettle.heater && kettle.heater.sketch || kettle.cooler && kettle.cooler.sketch || kettle.notify.dweet) {
        if (sketches.indexOf(lastArduino) === -1) sketches.push(lastArduino);
        // download previous sketch
        if (sketches.length > 1 && lastArduino != sketches[sketches.length - 2]) {
          downloadSketch(actions, 'BrewBenchAutoYun', sketches[sketches.length - 2]);
          // reset actions
          actions = [];
        }
        var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
        var adjust = $scope.settings.unit == 'F' && kettle.temp.adjust != 0 ? Math.round(kettle.temp.adjust * 0.555) : kettle.temp.adjust;
        actions.push('temp = autoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.temp.pin + '","' + kettle.temp.type + '",' + adjust + ');');
        //look for triggers
        if (kettle.heater && kettle.heater.sketch) actions.push('trigger("heat","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.heater.pin + '",temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
        if (kettle.cooler && kettle.cooler.sketch) actions.push('trigger("cool","' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + kettle.cooler.pin + '",temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
        if (kettle.notify.dweet) actions.push('dweetAutoCommand("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '","' + $scope.settings.recipe.brewer.name + '","' + $scope.settings.recipe.name + '",temp);');
      }
    });
    downloadSketch(actions, 'BrewBenchAutoYun', sketches[sketches.length - 1]);
  };

  $scope.downloadInfluxDBSketch = function () {
    if (!$scope.settings.influxdb.url) return;
    var sketches = [];
    var actions = [];
    var lastArduino = '';
    _.each(_.orderBy($scope.kettles, 'arduino.url', 'asc'), function (kettle, i) {
      lastArduino = kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, "");
      if (sketches.indexOf(lastArduino) === -1) sketches.push(lastArduino);
      // download previous sketch
      if (sketches.length > 1 && lastArduino != sketches[sketches.length - 2]) {
        downloadSketch(actions, 'BrewBenchInfluxDBYun', sketches[sketches.length - 2]);
        // reset actions
        actions = [];
      }
      var target = $scope.settings.unit == 'F' ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      var adjust = $scope.settings.unit == 'F' && kettle.temp.adjust != 0 ? Math.round(kettle.temp.adjust * 0.555) : kettle.temp.adjust;
      actions.push('temp = influxDBCommand(F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.temp.pin + '"),F("' + kettle.temp.type + '"),' + adjust + ');');
      //look for triggers
      if (kettle.heater && kettle.heater.sketch) actions.push('trigger(F("heat"),F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.heater.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      if (kettle.cooler && kettle.cooler.sketch) actions.push('trigger(F("cool"),F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + kettle.cooler.pin + '"),temp,' + target + ',' + kettle.temp.diff + ',' + !!kettle.notify.slack + ');');
      if (kettle.notify.dweet) actions.push('dweetAutoCommand(F("' + kettle.key.replace(/[^a-zA-Z0-9-.]/g, "") + '"),F("' + $scope.settings.recipe.brewer.name + '"),F("' + $scope.settings.recipe.name + '"),temp);');
    });
    downloadSketch(actions, 'BrewBenchInfluxDBYun', sketches[sketches.length - 1]);
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

  $(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)))

/***/ }),

/***/ 205:
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

/***/ 206:
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

/***/ 207:
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
        notify: { slack: false, dweet: true }
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
        notify: { slack: false, dweet: true }
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
        notify: { slack: false, dweet: true }
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)))

/***/ })

},[180]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtIiwidmFsdWVzIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInN0YXR1cyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJzeXNpbmZvIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJkZXZpY2UiLCJ0b2dnbGUiLCJyZWxheV9zdGF0ZSIsIm9mZiIsIm9uIiwiYWRkS2V0dGxlIiwia2V5IiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwiaGl0IiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJ2ZXJzaW9uIiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiY3JlYXRlU2hhcmUiLCJicmV3ZXIiLCJlbWFpbCIsInNoYXJlX3N0YXR1cyIsInNoYXJlX3N1Y2Nlc3MiLCJzaGFyZV9saW5rIiwic2hhcmVUZXN0IiwidGVzdGluZyIsImh0dHBfY29kZSIsInB1YmxpYyIsInRlc3RJbmZsdXhEQiIsImluZmx1eGRiIiwiY29ubmVjdGVkIiwicGluZyIsIiQiLCJyZW1vdmVDbGFzcyIsImRicyIsImNvbmNhdCIsImFwcGx5IiwicmVtb3ZlIiwiZGIiLCJhZGRDbGFzcyIsImNyZWF0ZUluZmx1eERCIiwibW9tZW50IiwiZm9ybWF0IiwiY3JlYXRlZCIsImNyZWF0ZURCIiwiZGF0YSIsInJlc3VsdHMiLCJyZXNldEVycm9yIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJhZGRUaW1lciIsImxhYmVsIiwibm90ZXMiLCJOdW1iZXIiLCJhbW91bnQiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInBrZyIsInNrZXRjaF92ZXJzaW9uIiwiYmJfdmVyc2lvbiIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwiZG9tYWluIiwidXBkYXRlVGVtcCIsInRlbXBzIiwidW5pdCIsIk1hdGgiLCJyb3VuZCIsImh1bWlkaXR5IiwiZ2V0VGltZSIsImFsZXJ0IiwiZ2V0TmF2T2Zmc2V0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGFzU2tldGNoZXMiLCJoYXNBU2tldGNoIiwia25vYkNsaWNrIiwic3RhcnRTdG9wS2V0dGxlIiwicmVhZE9ubHkiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaWdub3JlVmVyc2lvbkVycm9yIiwic2tldGNoZXMiLCJpZ25vcmVfdmVyc2lvbl9lcnJvciIsImRvd25sb2FkU2tldGNoIiwiYWN0aW9ucyIsImNvbnNvbGUiLCJsb2ciLCJ0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmciLCJjb25uZWN0aW9uIiwiY29ubmVjdGlvbl9zdHJpbmciLCJwb3J0IiwiaGVhZGVyIiwiZ2V0Iiwiam9pbiIsImZyZXF1ZW5jeSIsInBhcnNlSW50Iiwic3RyZWFtU2tldGNoIiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsImNsaWNrIiwiZG93bmxvYWRBdXRvU2tldGNoIiwibGFzdEFyZHVpbm8iLCJvcmRlckJ5IiwiZG93bmxvYWRJbmZsdXhEQlNrZXRjaCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJib2R5IiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJrZXR0bGVUeXBlIiwiY2hhbmdlVW5pdHMiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsIiR3YXRjaCIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJyZWFkeSIsInRvb2x0aXAiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJ0cmltIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsInRvU3RyaW5nIiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwicGhyYXNlIiwiUmVnRXhwIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJsYXlvdXQiLCJjaGFydCIsImFjY291bnQiLCJhcGlLZXkiLCJzZXNzaW9ucyIsInNlY3VyZSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiQXV0aG9yaXphdGlvbiIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImxhdGVzdCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIngiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxDQVFRLFVBQVNDLGNBQVQsRUFBeUJDLGtCQUF6QixF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LEVBblFjLEVBb1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFFjLEVBcVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclFjLEVBc1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFFjLEVBdVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdlFjLEVBd1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBeFFjLEVBeVFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBelFjLEVBMFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBMVFjLEVBMlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBM1FjLEVBNFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBNVFjLEVBNlFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBN1FjLEVBOFFkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBOVFjLEVBK1FkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBL1FjLEVBZ1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBaFJjLEVBaVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBalJjLEVBa1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBbFJjLEVBbVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBblJjLEVBb1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBcFJjLEVBcVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBclJjLEVBc1JkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpCLEVBdFJjLEVBdVJkLEVBQUNELEdBQUcsUUFBSixFQUFjQyxHQUFHLEdBQWpC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ZCxFQUFDRCxHQUFHLE9BQUosRUFBYUMsR0FBRyxHQUFoQixFQWxmYyxFQW1mZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUFuZmMsRUFvZmQsRUFBQ0QsR0FBRyxVQUFKLEVBQWdCQyxHQUFHLEdBQW5CLEVBcGZjLEVBcWZkLEVBQUNELEdBQUcsVUFBSixFQUFnQkMsR0FBRyxHQUFuQixFQXJmYyxFQXNmZCxFQUFDRCxHQUFHLFVBQUosRUFBZ0JDLEdBQUcsR0FBbkIsRUF0ZmMsRUF1ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF2ZmMsRUF3ZmQsRUFBQ0QsR0FBRyxPQUFKLEVBQWFDLEdBQUcsS0FBaEIsRUF4ZmMsRUF5ZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUF6ZmMsRUEwZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBM2QsUUFBRWtELElBQUYsQ0FBT3VhLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVE1ZCxPQUFSLENBQWdCZ2UsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVE3ZCxPQUFSLENBQWdCcVYsT0FBTzRJLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBaDVDSSxHQUFQO0FBazVDRCxDQXI1Q0QsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbiAgfSwxMDAwKTtcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsXG4gICxyZXNldENoYXJ0ID0gMTAwXG4gICx0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUua2V0dGxlVHlwZXMgPSBCcmV3U2VydmljZS5rZXR0bGVUeXBlcygpO1xuJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucygpO1xuJHNjb3BlLnNlbnNvclR5cGVzID0gQnJld1NlcnZpY2Uuc2Vuc29yVHlwZXM7XG4kc2NvcGUuc2hvd1NldHRpbmdzID0gdHJ1ZTtcbiRzY29wZS5lcnJvciA9IHttZXNzYWdlOiAnJywgdHlwZTogJ2Rhbmdlcid9O1xuJHNjb3BlLnNsaWRlciA9IHtcbiAgbWluOiAwLFxuICBvcHRpb25zOiB7XG4gICAgZmxvb3I6IDAsXG4gICAgY2VpbDogMTAwLFxuICAgIHN0ZXA6IDUsXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gYCR7dmFsdWV9JWA7XG4gICAgfSxcbiAgICBvbkVuZDogZnVuY3Rpb24oa2V0dGxlSWQsIG1vZGVsVmFsdWUsIGhpZ2hWYWx1ZSwgcG9pbnRlclR5cGUpe1xuICAgICAgdmFyIGtldHRsZSA9IGtldHRsZUlkLnNwbGl0KCdfJyk7XG4gICAgICB2YXIgaztcblxuICAgICAgc3dpdGNoIChrZXR0bGVbMF0pIHtcbiAgICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uaGVhdGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb29sJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5jb29sZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3B1bXAnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLnB1bXA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmKCFrKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZigkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmFjdGl2ZSAmJiBrLnB3bSAmJiBrLnJ1bm5pbmcpe1xuICAgICAgICByZXR1cm4gJHNjb3BlLnRvZ2dsZVJlbGF5KCRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0sIGssIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuJHNjb3BlLmdldEtldHRsZVNsaWRlck9wdGlvbnMgPSBmdW5jdGlvbih0eXBlLCBpbmRleCl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKCRzY29wZS5zbGlkZXIub3B0aW9ucywge2lkOiBgJHt0eXBlfV8ke2luZGV4fWB9KTtcbn1cblxuJHNjb3BlLmdldExvdmlib25kQ29sb3IgPSBmdW5jdGlvbihyYW5nZSl7XG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZSgvwrAvZywnJykucmVwbGFjZSgvIC9nLCcnKTtcbiAgaWYocmFuZ2UuaW5kZXhPZignLScpIT09LTEpe1xuICAgIHZhciByQXJyPXJhbmdlLnNwbGl0KCctJyk7XG4gICAgcmFuZ2UgPSAocGFyc2VGbG9hdChyQXJyWzBdKStwYXJzZUZsb2F0KHJBcnJbMV0pKS8yO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gcGFyc2VGbG9hdChyYW5nZSk7XG4gIH1cbiAgaWYoIXJhbmdlKVxuICAgIHJldHVybiAnJztcbiAgdmFyIGwgPSBfLmZpbHRlcigkc2NvcGUubG92aWJvbmQsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiAoaXRlbS5zcm0gPD0gcmFuZ2UpID8gaXRlbS5oZXggOiAnJztcbiAgfSk7XG4gIGlmKCEhbC5sZW5ndGgpXG4gICAgcmV0dXJuIGxbbC5sZW5ndGgtMV0uaGV4O1xuICByZXR1cm4gJyc7XG59O1xuXG4vL2RlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4kc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnKSB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuJHNjb3BlLmtldHRsZXMgPSBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycpIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4kc2NvcGUuc2hhcmUgPSAoISRzdGF0ZS5wYXJhbXMuZmlsZSAmJiBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSkgPyBCcmV3U2VydmljZS5zZXR0aW5ncygnc2hhcmUnKSA6IHtcbiAgICAgIGZpbGU6ICRzdGF0ZS5wYXJhbXMuZmlsZSB8fCBudWxsXG4gICAgICAsIHBhc3N3b3JkOiBudWxsXG4gICAgICAsIG5lZWRQYXNzd29yZDogZmFsc2VcbiAgICAgICwgYWNjZXNzOiAncmVhZE9ubHknXG4gICAgICAsIGRlbGV0ZUFmdGVyOiAxNFxuICB9O1xuXG4kc2NvcGUuc3VtVmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuIF8uc3VtKF8udmFsdWVzKG9iaikpO1xufVxuXG4vLyBpbml0IGNhbGMgdmFsdWVzXG4kc2NvcGUudXBkYXRlQUJWID0gZnVuY3Rpb24oKXtcbiAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZT09J2dyYXZpdHknKXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYncgPSBCcmV3U2VydmljZS5hYncoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZShCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSlcbiAgICAgICwkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm1ldGhvZD09J3BhcGF6aWFuJylcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2KEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICBlbHNlXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidmEoQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmF0dGVudWF0aW9uID0gQnJld1NlcnZpY2UuYXR0ZW51YXRpb24oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhbG9yaWVzID0gQnJld1NlcnZpY2UuY2Fsb3JpZXMoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYndcbiAgICAgICxCcmV3U2VydmljZS5yZSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpXG4gICAgICAsQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpO1xuICB9XG59O1xuXG4kc2NvcGUuY2hhbmdlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2QgPSBtZXRob2Q7XG4gICRzY29wZS51cGRhdGVBQlYoKTtcbn07XG5cbiRzY29wZS5jaGFuZ2VTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5zY2FsZSA9IHNjYWxlO1xuICBpZihzY2FsZT09J2dyYXZpdHknKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2Uuc2coJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9IGVsc2Uge1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSBCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH1cbn07XG5cbiRzY29wZS51cGRhdGVBQlYoKTtcblxuICAkc2NvcGUuZ2V0UG9ydFJhbmdlID0gZnVuY3Rpb24obnVtYmVyKXtcbiAgICAgIG51bWJlcisrO1xuICAgICAgcmV0dXJuIEFycmF5KG51bWJlcikuZmlsbCgpLm1hcCgoXywgaWR4KSA9PiAwICsgaWR4KTtcbiAgfTtcblxuICAkc2NvcGUuYXJkdWlub3MgPSB7XG4gICAgYWRkOiAoKSA9PiB7XG4gICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MpICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcyA9IFtdO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnB1c2goe1xuICAgICAgICBpZDogYnRvYShub3crJycrJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCsxKSxcbiAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgIGFuYWxvZzogNSxcbiAgICAgICAgZGlnaXRhbDogMTNcbiAgICAgIH0pO1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICBpZigha2V0dGxlLmFyZHVpbm8pXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZTogKGFyZHVpbm8pID0+IHtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBrZXR0bGUuYXJkdWlubyA9IGFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogKGluZGV4LCBhcmR1aW5vKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoa2V0dGxlLmFyZHVpbm8gJiYga2V0dGxlLmFyZHVpbm8uaWQgPT0gYXJkdWluby5pZClcbiAgICAgICAgICBkZWxldGUga2V0dGxlLmFyZHVpbm87XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRwbGluayA9IHtcbiAgICBsb2dpbjogKCkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkubG9naW4oJHNjb3BlLnNldHRpbmdzLnRwbGluay51c2VyLCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGFzcylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKHJlc3BvbnNlLnRva2VuKXtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsudG9rZW4gPSByZXNwb25zZS50b2tlbjtcbiAgICAgICAgICAgICRzY29wZS50cGxpbmsuc2NhbihyZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyci5tc2cgfHwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzY2FuOiAodG9rZW4pID0+IHtcbiAgICAgICRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3MgPSBbXTtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLnNjYW4odG9rZW4pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZihyZXNwb25zZS5kZXZpY2VMaXN0KXtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gcmVzcG9uc2UuZGV2aWNlTGlzdDtcbiAgICAgICAgICAvLyBnZXQgZGV2aWNlIGluZm8gaWYgb25saW5lIChpZS4gc3RhdHVzPT0xKVxuICAgICAgICAgIF8uZWFjaCgkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLCBwbHVnID0+IHtcbiAgICAgICAgICAgIGlmKCEhcGx1Zy5zdGF0dXMpe1xuICAgICAgICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKHBsdWcpLnRoZW4oaW5mbyA9PiB7XG4gICAgICAgICAgICAgICAgaWYoaW5mbyAmJiBpbmZvLnJlc3BvbnNlRGF0YSl7XG4gICAgICAgICAgICAgICAgICBsZXQgc3lzaW5mbyA9IEpTT04ucGFyc2UoaW5mby5yZXNwb25zZURhdGEpLnN5c3RlbS5nZXRfc3lzaW5mbztcbiAgICAgICAgICAgICAgICAgIHBsdWcuaW5mbyA9IHN5c2luZm87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5pbmZvKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9nZ2xlOiAoZGV2aWNlKSA9PiB7XG4gICAgICBpZihkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9PSAxKXtcbiAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkub2ZmKGRldmljZSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPSAwO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5vbihkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gMTtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuYWRkS2V0dGxlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgaWYoISRzY29wZS5rZXR0bGVzKSAkc2NvcGUua2V0dGxlcyA9IFtdO1xuICAgICRzY29wZS5rZXR0bGVzLnB1c2goe1xuICAgICAgICBrZXk6IHR5cGUgPyBfLmZpbmQoJHNjb3BlLmtldHRsZVR5cGVzLHt0eXBlOiB0eXBlfSkubmFtZSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXS5uYW1lXG4gICAgICAgICx0eXBlOiB0eXBlIHx8ICRzY29wZS5rZXR0bGVUeXBlc1swXS50eXBlXG4gICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICxoZWF0ZXI6IHtwaW46J0Q2JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0LGRpZmY6JHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9XG4gICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkoQnJld1NlcnZpY2UuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OiRzY29wZS5rZXR0bGVUeXBlc1swXS50YXJnZXQrJHNjb3BlLmtldHRsZVR5cGVzWzBdLmRpZmZ9KVxuICAgICAgICAsYXJkdWlubzogJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLmxlbmd0aCA/ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vc1swXSA6IG51bGxcbiAgICAgICAgLGVycm9yOiB7bWVzc2FnZTonJyx2ZXJzaW9uOicnfVxuICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogdHJ1ZX1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaGFzU3RpY2t5S2V0dGxlcyA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeydzdGlja3knOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5rZXR0bGVDb3VudCA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBfLmZpbHRlcigkc2NvcGUua2V0dGxlcywgeyd0eXBlJzogdHlwZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUuYWN0aXZlS2V0dGxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHsnYWN0aXZlJzogdHJ1ZX0pLmxlbmd0aDtcbiAgfTtcblxuICAkc2NvcGUucGluRGlzcGxheSA9IGZ1bmN0aW9uKHBpbil7XG4gICAgICBpZiggcGluLmluZGV4T2YoJ1RQLScpPT09MCApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IHBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIGRldmljZSA/IGRldmljZS5hbGlhcyA6ICcnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBwaW47XG4gIH07XG5cbiAgJHNjb3BlLnBpbkluVXNlID0gZnVuY3Rpb24ocGluLGFuYWxvZyl7XG4gICAgdmFyIGtldHRsZSA9IF8uZmluZCgkc2NvcGUua2V0dGxlcywgZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIChhbmFsb2cgJiYga2V0dGxlLnRlbXAudHlwZT09J1RoZXJtaXN0b3InICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUudGVtcC50eXBlPT0nRFMxOEIyMCcgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgIChrZXR0bGUudGVtcC50eXBlPT0nUFQxMDAnICYmIGtldHRsZS50ZW1wLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUuaGVhdGVyLnBpbj09cGluKSB8fFxuICAgICAgICAoIWFuYWxvZyAmJiBrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmICFrZXR0bGUuY29vbGVyICYmIGtldHRsZS5wdW1wLnBpbj09cGluKVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2V0dGxlIHx8IGZhbHNlO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUgfHwgISRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLmVtYWlsKVxuICAgICAgcmV0dXJuO1xuICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSAnQ3JlYXRpbmcgc2hhcmUgbGluay4uLic7XG4gICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmNyZWF0ZVNoYXJlKCRzY29wZS5zaGFyZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmKHJlc3BvbnNlLnNoYXJlICYmIHJlc3BvbnNlLnNoYXJlLnVybCl7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICcnO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfbGluayA9IHJlc3BvbnNlLnNoYXJlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdGF0dXMgPSBlcnI7XG4gICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVUZXN0ID0gZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgYXJkdWluby50ZXN0aW5nID0gdHJ1ZTtcbiAgICBCcmV3U2VydmljZS5zaGFyZVRlc3QoYXJkdWlubylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLmh0dHBfY29kZSA9PSAyMDApXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSB0cnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgYXJkdWluby50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGFyZHVpbm8ucHVibGljID0gZmFsc2U7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUudGVzdEluZmx1eERCID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudGVzdGluZyA9IHRydWU7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkucGluZygpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmKHJlc3BvbnNlLnN0YXR1cyA9PSAyMDQpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgLy9nZXQgbGlzdCBvZiBkYXRhYmFzZXNcbiAgICAgICAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmRicygpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgbGV0IGRicyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYnMgPSBfLnJlbW92ZShkYnMsIChkYikgPT4gZGIgIT0gXCJfaW50ZXJuYWxcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICQoJyNpbmZsdXhkYlVybCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jcmVhdGVJbmZsdXhEQiA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGRiID0gJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICBCcmV3U2VydmljZS5pbmZsdXhkYigpLmNyZWF0ZURCKGRiKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyBwcm9tcHQgZm9yIHBhc3N3b3JkXG4gICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGgpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiA9IGRiO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJVc2VyJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkKCcjaW5mbHV4ZGJQYXNzJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJPcHBzLCB0aGVyZSB3YXMgYSBwcm9ibGVtIGNyZWF0aW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgaWYoZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpe1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoXCJFbnRlciB5b3VyIFVzZXJuYW1lIGFuZCBQYXNzd29yZCBmb3IgSW5mbHV4REJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnNoYXJlQWNjZXNzID0gZnVuY3Rpb24oYWNjZXNzKXtcbiAgICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zaGFyZWQpe1xuICAgICAgICBpZihhY2Nlc3Mpe1xuICAgICAgICAgIGlmKGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgICAgIHJldHVybiAhISh3aW5kb3cuZnJhbWVFbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhKCRzY29wZS5zaGFyZS5hY2Nlc3MgJiYgJHNjb3BlLnNoYXJlLmFjY2VzcyA9PT0gYWNjZXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYoYWNjZXNzICYmIGFjY2VzcyA9PSAnZW1iZWQnKXtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRTaGFyZUZpbGUgPSBmdW5jdGlvbigpe1xuICAgIEJyZXdTZXJ2aWNlLmNsZWFyKCk7XG4gICAgJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2UucmVzZXQoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gQnJld1NlcnZpY2UubG9hZFNoYXJlRmlsZSgkc2NvcGUuc2hhcmUuZmlsZSwgJHNjb3BlLnNoYXJlLnBhc3N3b3JkIHx8IG51bGwpXG4gICAgICAudGhlbihmdW5jdGlvbihjb250ZW50cykge1xuICAgICAgICBpZihjb250ZW50cyl7XG4gICAgICAgICAgaWYoY29udGVudHMubmVlZFBhc3N3b3JkKXtcbiAgICAgICAgICAgICRzY29wZS5zaGFyZS5uZWVkUGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3MucmVjaXBlKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZSA9IGNvbnRlbnRzLnNldHRpbmdzLnJlY2lwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYoY29udGVudHMuc2hhcmUgJiYgY29udGVudHMuc2hhcmUuYWNjZXNzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNoYXJlLmFjY2VzcyA9IGNvbnRlbnRzLnNoYXJlLmFjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLnNldHRpbmdzKXtcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gY29udGVudHMuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zID0ge29uOmZhbHNlLHRpbWVyczp0cnVlLGhpZ2g6dHJ1ZSxsb3c6dHJ1ZSx0YXJnZXQ6dHJ1ZSxzbGFjazonJyxsYXN0OicnfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbnRlbnRzLmtldHRsZXMpe1xuICAgICAgICAgICAgICBfLmVhY2goY29udGVudHMua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgICAgICAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjAwKzUsc3ViVGV4dDp7ZW5hYmxlZDogdHJ1ZSx0ZXh0OiAnc3RhcnRpbmcuLi4nLGNvbG9yOiAnZ3JheScsZm9udDogJ2F1dG8nfX0pO1xuICAgICAgICAgICAgICAgIGtldHRsZS52YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICRzY29wZS5rZXR0bGVzID0gY29udGVudHMua2V0dGxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gbG9hZGluZyB0aGUgc2hhcmVkIHNlc3Npb24uXCIpO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmltcG9ydFJlY2lwZSA9IGZ1bmN0aW9uKCRmaWxlQ29udGVudCwkZXh0KXtcblxuICAgICAgLy8gcGFyc2UgdGhlIGltcG9ydGVkIGNvbnRlbnRcbiAgICAgIHZhciBmb3JtYXR0ZWRfY29udGVudCA9IEJyZXdTZXJ2aWNlLmZvcm1hdFhNTCgkZmlsZUNvbnRlbnQpO1xuICAgICAgdmFyIGpzb25PYmosIHJlY2lwZSA9IG51bGw7XG5cbiAgICAgIGlmKCEhZm9ybWF0dGVkX2NvbnRlbnQpe1xuICAgICAgICB2YXIgeDJqcyA9IG5ldyBYMkpTKCk7XG4gICAgICAgIGpzb25PYmogPSB4MmpzLnhtbF9zdHIyanNvbiggZm9ybWF0dGVkX2NvbnRlbnQgKTtcbiAgICAgIH1cblxuICAgICAgaWYoIWpzb25PYmopXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoJGV4dD09J2JzbXgnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJlY2lwZXMgJiYgISFqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SZWNpcGVzLkRhdGEuUmVjaXBlO1xuICAgICAgICBlbHNlIGlmKCEhanNvbk9iai5TZWxlY3Rpb25zICYmICEhanNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouU2VsZWN0aW9ucy5EYXRhLlJlY2lwZTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJTbWl0aChyZWNpcGUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmKCRleHQ9PSd4bWwnKXtcbiAgICAgICAgaWYoISFqc29uT2JqLlJFQ0lQRVMgJiYgISFqc29uT2JqLlJFQ0lQRVMuUkVDSVBFKVxuICAgICAgICAgIHJlY2lwZSA9IGpzb25PYmouUkVDSVBFUy5SRUNJUEU7XG4gICAgICAgIGlmKHJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBCcmV3U2VydmljZS5yZWNpcGVCZWVyWE1MKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCFyZWNpcGUpXG4gICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgaWYoISFyZWNpcGUub2cpXG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cgPSByZWNpcGUub2c7XG4gICAgICBpZighIXJlY2lwZS5mZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IHJlY2lwZS5mZztcblxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lID0gcmVjaXBlLm5hbWU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmNhdGVnb3J5ID0gcmVjaXBlLmNhdGVnb3J5O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSByZWNpcGUuYWJ2O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5pYnUgPSByZWNpcGUuaWJ1O1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5kYXRlID0gcmVjaXBlLmRhdGU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlciA9IHJlY2lwZS5icmV3ZXI7XG5cbiAgICAgIGlmKHJlY2lwZS5ncmFpbnMubGVuZ3RoKXtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSByZWNpcGUuZ3JhaW5zO1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2dyYWluJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnMgPSB7fTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ncmFpbnMsZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIGlmKGtldHRsZSl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IGdyYWluLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IGdyYWluLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IGdyYWluLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VtIHRoZSBhbW91bnRzIGZvciB0aGUgZ3JhaW5zXG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdKVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdICs9IE51bWJlcihncmFpbi5hbW91bnQpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZ3JhaW5zW2dyYWluLmxhYmVsXSA9IE51bWJlcihncmFpbi5hbW91bnQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYocmVjaXBlLmhvcHMubGVuZ3RoKXtcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOidob3AnfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS5ob3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IGhvcC5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBob3Aubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdW0gdGhlIGFtb3VudHMgZm9yIHRoZSBob3BzXG4gICAgICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0pXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSArPSBOdW1iZXIoaG9wLmFtb3VudCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ob3BzW2hvcC5sYWJlbF0gPSBOdW1iZXIoaG9wLmFtb3VudCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYocmVjaXBlLm1pc2MubGVuZ3RoKXtcbiAgICAgICAgbGV0IGtldHRsZSA9IF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLHt0eXBlOid3YXRlcid9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5taXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLmxhYmVsLFxuICAgICAgICAgICAgICBtaW46IG1pc2MubWluLFxuICAgICAgICAgICAgICBub3RlczogbWlzYy5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKHJlY2lwZS55ZWFzdC5sZW5ndGgpe1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLnllYXN0ID0gW107XG4gICAgICAgIF8uZWFjaChyZWNpcGUueWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB5ZWFzdC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFN0eWxlcyA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoISRzY29wZS5zdHlsZXMpe1xuICAgICAgQnJld1NlcnZpY2Uuc3R5bGVzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICRzY29wZS5zdHlsZXMgPSByZXNwb25zZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNvbmZpZyA9IFtdO1xuICAgIGlmKCEkc2NvcGUucGtnKXtcbiAgICAgIGNvbmZpZy5wdXNoKEJyZXdTZXJ2aWNlLnBrZygpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICRzY29wZS5wa2cgPSByZXNwb25zZTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24gPSByZXNwb25zZS5za2V0Y2hfdmVyc2lvbjtcbiAgICAgICAgICBpZighJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24pe1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmJiX3ZlcnNpb24gPSByZXNwb25zZS52ZXJzaW9uO1xuICAgICAgICAgIH0gZWxzZSBpZigkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbiAhPSByZXNwb25zZS52ZXJzaW9uKXtcbiAgICAgICAgICAgICRzY29wZS5lcnJvci50eXBlID0gJ2luZm8nO1xuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZSgnVGhlcmUgaXMgYSBuZXcgdmVyc2lvbiBhdmFpbGFibGUgZm9yIEJyZXdCZW5jaC4gUGxlYXNlIDxhIGhyZWY9XCIjL3Jlc2V0XCI+Y2xlYXI8L2E+IHlvdXIgc2V0dGluZ3MuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUpe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUuZXJyb3IudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgICBtZXNzYWdlID0gJ1NrZXRjaCBWZXJzaW9uIGlzIG91dCBvZiBkYXRlLiAgPGEgaHJlZj1cIlwiIGRhdGEtdG9nZ2xlPVwibW9kYWxcIiBkYXRhLXRhcmdldD1cIiNzZXR0aW5nc01vZGFsXCI+RG93bmxvYWQgaGVyZTwvYT4uJytcbiAgICAgICAgICAnPGJyLz5Zb3VyIFZlcnNpb246ICcrZXJyLnZlcnNpb24rXG4gICAgICAgICAgJzxici8+Q3VycmVudCBWZXJzaW9uOiAnKyRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9IGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVzZXRFcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoa2V0dGxlKSB7XG4gICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnRlbXApe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG5cbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICBNYXRoLnJvdW5kKHJlc3BvbnNlLnRlbXApO1xuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBrZXR0bGUudGVtcC5wcmV2aW91cytrZXR0bGUudGVtcC5hZGp1c3Q7XG5cbiAgICAvL3Jlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcz1bXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUMTEgc2Vuc29yIGhhcyBodW1pZGl0eVxuICAgIGlmKCByZXNwb25zZS5odW1pZGl0eSApe1xuICAgICAga2V0dGxlLmh1bWlkaXR5ID0gcmVzcG9uc2UuaHVtaWRpdHk7XG4gICAgfVxuXG4gICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5hbGVydChrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGxldCBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUua25vYkNsaWNrID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIC8vc2V0IGFkanVzdG1lbnQgYW1vdW50XG4gICAgICBpZighIWtldHRsZS50ZW1wLnByZXZpb3VzKXtcbiAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0ga2V0dGxlLnRlbXAuY3VycmVudCAtIGtldHRsZS50ZW1wLnByZXZpb3VzO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICBsZXQgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICBsZXQga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5pZ25vcmVWZXJzaW9uRXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciA9IHRydWU7XG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChhY3Rpb25zLCBza2V0Y2gsIG5hbWUpe1xuICAgIGNvbnNvbGUubG9nKCduYW1lJyxuYW1lKVxuICAgIC8vIHRwIGxpbmsgY29ubmVjdGlvblxuICAgIGxldCB0cGxpbmtfY29ubmVjdGlvbl9zdHJpbmcgPSBCcmV3U2VydmljZS50cGxpbmsoKS5jb25uZWN0aW9uKCk7XG4gICAgLy8gaW5mbHV4IGRiIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbl9zdHJpbmcgPSBgJHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgaWYoICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYDokeyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWA7XG4gICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJy93cml0ZT8nO1xuICAgIC8vIGFkZCB1c2VyL3Bhc3NcbiAgICBpZighISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyICYmICEhJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3MpXG4gICAgICBjb25uZWN0aW9uX3N0cmluZyArPSBgdT0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnBhc3N9JmBcbiAgICAvLyBhZGQgZGJcbiAgICBjb25uZWN0aW9uX3N0cmluZyArPSAnZGI9JysoJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiIHx8ICdzZXNzaW9uLScrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREJykpO1xuICAgIGxldCBoZWFkZXIgPSAnLyogU2tldGNoIEF1dG8gR2VuZXJhdGVkIGZyb20gaHR0cDovL21vbml0b3IuYnJld2JlbmNoLmNvIG9uICcrbW9tZW50KCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOk1NOlNTJykrJyBmb3IgJytuYW1lKycqL1xcbic7XG4gICAgJGh0dHAuZ2V0KCdhc3NldHMvYXJkdWluby8nK3NrZXRjaCsnLycrc2tldGNoKycuaW5vJylcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gcmVwbGFjZSB2YXJpYWJsZXNcbiAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGhlYWRlcityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFthY3Rpb25zXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCdbVFBMSU5LX0NPTk5FQ1RJT05dJywgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nKVxuICAgICAgICAgIC5yZXBsYWNlKCdbU0xBQ0tfQ09OTkVDVElPTl0nLCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjaylcbiAgICAgICAgICAucmVwbGFjZSgnW0ZSRVFVRU5DWV9TRUNPTkRTXScsICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5mcmVxdWVuY3kgPyBwYXJzZUludCgkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5LDEwKSA6IDYwKTtcbiAgICAgICAgaWYoIHNrZXRjaC5pbmRleE9mKCdJbmZsdXhEQicpICE9PSAtMSl7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVwbGFjZSgnW0lORkxVWERCX0NPTk5FQ1RJT05dJywgY29ubmVjdGlvbl9zdHJpbmcpXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0cmVhbVNrZXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBza2V0Y2grJy0nK25hbWUrJy5pbm8nKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLnNldEF0dHJpYnV0ZSgnaHJlZicsIFwiZGF0YTp0ZXh0L2lubztjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLmRhdGEpKTtcbiAgICAgICAgc3RyZWFtU2tldGNoLmNsaWNrKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCB0byBkb3dubG9hZCBza2V0Y2ggJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmRvd25sb2FkQXV0b1NrZXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgbGV0IHNrZXRjaGVzID0gW107XG4gICAgbGV0IGFjdGlvbnMgPSBbXTtcbiAgICBsZXQgbGFzdEFyZHVpbm8gPSAnJztcbiAgICBfLmVhY2goXy5vcmRlckJ5KCRzY29wZS5rZXR0bGVzLCAnYXJkdWluby51cmwnLCAnYXNjJyksIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGxhc3RBcmR1aW5vID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgLy8gcmVzZXQgdGhlIGFjdGlvbnNcbiAgICAgIGlmKChrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKSB8fFxuICAgICAgICAoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnNrZXRjaCkgfHxcbiAgICAgICAga2V0dGxlLm5vdGlmeS5kd2VldFxuICAgICAgKXtcbiAgICAgICAgaWYoIHNrZXRjaGVzLmluZGV4T2YobGFzdEFyZHVpbm8pID09PSAtMSApIHNrZXRjaGVzLnB1c2gobGFzdEFyZHVpbm8pO1xuICAgICAgICAvLyBkb3dubG9hZCBwcmV2aW91cyBza2V0Y2hcbiAgICAgICAgaWYoIHNrZXRjaGVzLmxlbmd0aCA+IDEgJiYgbGFzdEFyZHVpbm8gIT0gc2tldGNoZXNbc2tldGNoZXMubGVuZ3RoLTJdKXtcbiAgICAgICAgICBkb3dubG9hZFNrZXRjaChhY3Rpb25zLCAnQnJld0JlbmNoQXV0b1l1bicsIHNrZXRjaGVzW3NrZXRjaGVzLmxlbmd0aC0yXSk7XG4gICAgICAgICAgLy8gcmVzZXQgYWN0aW9uc1xuICAgICAgICAgIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGFyZ2V0ID0gKCRzY29wZS5zZXR0aW5ncy51bml0PT0nRicpID8gJGZpbHRlcigndG9DZWxzaXVzJykoa2V0dGxlLnRlbXAudGFyZ2V0KSA6IGtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgICAgbGV0IGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnICYmIGtldHRsZS50ZW1wLmFkanVzdCAhPSAwKSA/IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1KSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgICAgYWN0aW9ucy5wdXNoKCd0ZW1wID0gYXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJytrZXR0bGUudGVtcC5waW4rJ1wiLFwiJytrZXR0bGUudGVtcC50eXBlKydcIiwnK2FkanVzdCsnKTsnKTtcbiAgICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyICYmIGtldHRsZS5oZWF0ZXIuc2tldGNoKVxuICAgICAgICAgIGFjdGlvbnMucHVzaCgndHJpZ2dlcihcImhlYXRcIixcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS5oZWF0ZXIucGluKydcIix0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpXG4gICAgICAgICAgYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKFwiY29vbFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgICAgaWYoa2V0dGxlLm5vdGlmeS5kd2VldClcbiAgICAgICAgICBhY3Rpb25zLnB1c2goJ2R3ZWV0QXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lKydcIixcIicrJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lKydcIix0ZW1wKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBkb3dubG9hZFNrZXRjaChhY3Rpb25zLCAnQnJld0JlbmNoQXV0b1l1bicsIHNrZXRjaGVzW3NrZXRjaGVzLmxlbmd0aC0xXSk7XG4gIH07XG5cbiAgJHNjb3BlLmRvd25sb2FkSW5mbHV4REJTa2V0Y2ggPSBmdW5jdGlvbigpe1xuICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXJsKSByZXR1cm47XG4gICAgbGV0IHNrZXRjaGVzID0gW107XG4gICAgbGV0IGFjdGlvbnMgPSBbXTtcbiAgICBsZXQgbGFzdEFyZHVpbm8gPSAnJztcbiAgICBfLmVhY2goXy5vcmRlckJ5KCRzY29wZS5rZXR0bGVzLCAnYXJkdWluby51cmwnLCAnYXNjJyksIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGxhc3RBcmR1aW5vID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgaWYoIHNrZXRjaGVzLmluZGV4T2YobGFzdEFyZHVpbm8pID09PSAtMSApIHNrZXRjaGVzLnB1c2gobGFzdEFyZHVpbm8pO1xuICAgICAgLy8gZG93bmxvYWQgcHJldmlvdXMgc2tldGNoXG4gICAgICBpZiggc2tldGNoZXMubGVuZ3RoID4gMSAmJiBsYXN0QXJkdWlubyAhPSBza2V0Y2hlc1tza2V0Y2hlcy5sZW5ndGgtMl0pe1xuICAgICAgICBkb3dubG9hZFNrZXRjaChhY3Rpb25zLCAnQnJld0JlbmNoSW5mbHV4REJZdW4nLCBza2V0Y2hlc1tza2V0Y2hlcy5sZW5ndGgtMl0pO1xuICAgICAgICAvLyByZXNldCBhY3Rpb25zXG4gICAgICAgIGFjdGlvbnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgbGV0IGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnICYmIGtldHRsZS50ZW1wLmFkanVzdCAhPSAwKSA/IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1KSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGFjdGlvbnMucHVzaCgndGVtcCA9IGluZmx1eERCQ29tbWFuZChGKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlLnRlbXAudHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaClcbiAgICAgICAgYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJoZWF0XCIpLEYoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuaGVhdGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIGlmKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpXG4gICAgICAgIGFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiY29vbFwiKSxGKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmNvb2xlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICBpZihrZXR0bGUubm90aWZ5LmR3ZWV0KVxuICAgICAgICBhY3Rpb25zLnB1c2goJ2R3ZWV0QXV0b0NvbW1hbmQoRihcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInKyRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUrJ1wiKSxGKFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUrJ1wiKSx0ZW1wKTsnKTtcbiAgICB9KTtcbiAgICBkb3dubG9hZFNrZXRjaChhY3Rpb25zLCAnQnJld0JlbmNoSW5mbHV4REJZdW4nLCBza2V0Y2hlc1tza2V0Y2hlcy5sZW5ndGgtMV0pO1xuICB9O1xuXG4gICRzY29wZS5nZXRJUEFkZHJlc3MgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pcEFkZHJlc3MgPSBcIlwiO1xuICAgIEJyZXdTZXJ2aWNlLmlwKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IHJlc3BvbnNlLmlwO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbihrZXR0bGUsdGltZXIpe1xuXG4gICAgLy9kb24ndCBzdGFydCBhbGVydHMgdW50aWwgd2UgaGF2ZSBoaXQgdGhlIHRlbXAudGFyZ2V0XG4gICAgaWYoIXRpbWVyICYmIGtldHRsZSAmJiAha2V0dGxlLnRlbXAuaGl0XG4gICAgICB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5vbiA9PT0gZmFsc2Upe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRGVza3RvcCAvIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGxldCBtZXNzYWdlLFxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy9icmV3YmVuY2gtbG9nby5wbmcnLFxuICAgICAgY29sb3IgPSAnZ29vZCc7XG5cbiAgICBpZihrZXR0bGUgJiYgWydob3AnLCdncmFpbicsJ3dhdGVyJywnZmVybWVudGVyJ10uaW5kZXhPZihrZXR0bGUudHlwZSkhPT0tMSlcbiAgICAgIGljb24gPSAnL2Fzc2V0cy9pbWcvJytrZXR0bGUudHlwZSsnLnBuZyc7XG5cbiAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYoISF0aW1lcil7IC8va2V0dGxlIGlzIGEgdGltZXIgb2JqZWN0XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGltZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgICBpZih0aW1lci51cClcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHRpbWVycyBhcmUgZG9uZSc7XG4gICAgICBlbHNlIGlmKCEhdGltZXIubm90ZXMpXG4gICAgICAgIG1lc3NhZ2UgPSAnVGltZSB0byBhZGQgJyt0aW1lci5ub3RlcysnIG9mICcrdGltZXIubGFiZWw7XG4gICAgICBlbHNlXG4gICAgICAgIG1lc3NhZ2UgPSAnVGltZSB0byBhZGQgJyt0aW1lci5sYWJlbDtcbiAgICB9XG4gICAgZWxzZSBpZihrZXR0bGUgJiYga2V0dGxlLmhpZ2gpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmhpZ2ggfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2hpZ2gnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLmtleSsnIGlzICcrKGtldHRsZS5oaWdoLWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGhpZ2gnO1xuICAgICAgY29sb3IgPSAnZGFuZ2VyJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2hpZ2gnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUubG93KXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sb3cgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J2xvdycpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUua2V5KycgaXMgJysoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBsb3cnO1xuICAgICAgY29sb3IgPSAnIzM0OThEQic7XG4gICAgICAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PSdsb3cnO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMudGFyZ2V0IHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9PSd0YXJnZXQnKVxuICAgICAgICByZXR1cm47XG4gICAgICBtZXNzYWdlID0ga2V0dGxlLmtleSsnIGlzIHdpdGhpbiB0aGUgdGFyZ2V0IGF0ICcra2V0dGxlLnRlbXAuY3VycmVudCsnXFx1MDBCMCc7XG4gICAgICBjb2xvciA9ICdnb29kJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J3RhcmdldCc7XG4gICAgfVxuICAgIGVsc2UgaWYoIWtldHRsZSl7XG4gICAgICBtZXNzYWdlID0gJ1Rlc3RpbmcgQWxlcnRzLCB5b3UgYXJlIHJlYWR5IHRvIGdvLCBjbGljayBwbGF5IG9uIGEga2V0dGxlLic7XG4gICAgfVxuXG4gICAgLy8gTW9iaWxlIFZpYnJhdGUgTm90aWZpY2F0aW9uXG4gICAgaWYgKFwidmlicmF0ZVwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnZpYnJhdGUoWzUwMCwgMzAwLCA1MDBdKTtcbiAgICB9XG5cbiAgICAvLyBTb3VuZCBOb3RpZmljYXRpb25cbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc291bmRzLm9uPT09dHJ1ZSl7XG4gICAgICAvL2Rvbid0IGFsZXJ0IGlmIHRoZSBoZWF0ZXIgaXMgcnVubmluZyBhbmQgdGVtcCBpcyB0b28gbG93XG4gICAgICBpZighIXRpbWVyICYmIGtldHRsZSAmJiBrZXR0bGUubG93ICYmIGtldHRsZS5oZWF0ZXIucnVubmluZylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgdmFyIHNuZCA9IG5ldyBBdWRpbygoISF0aW1lcikgPyAkc2NvcGUuc2V0dGluZ3Muc291bmRzLnRpbWVyIDogJHNjb3BlLnNldHRpbmdzLnNvdW5kcy5hbGVydCk7IC8vIGJ1ZmZlcnMgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0ZWRcbiAgICAgIHNuZC5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gV2luZG93IE5vdGlmaWNhdGlvblxuICAgIGlmKFwiTm90aWZpY2F0aW9uXCIgaW4gd2luZG93KXtcbiAgICAgIC8vY2xvc2UgdGhlIHByZXZpb3VzIG5vdGlmaWNhdGlvblxuICAgICAgaWYobm90aWZpY2F0aW9uKVxuICAgICAgICBub3RpZmljYXRpb24uY2xvc2UoKTtcblxuICAgICAgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKXtcbiAgICAgICAgaWYobWVzc2FnZSl7XG4gICAgICAgICAgaWYoa2V0dGxlKVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUua2V5Kycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24oJ1Rlc3Qga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdkZW5pZWQnKXtcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChwZXJtaXNzaW9uKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjZXB0cywgbGV0J3MgY3JlYXRlIGEgbm90aWZpY2F0aW9uXG4gICAgICAgICAgaWYgKHBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihrZXR0bGUua2V5Kycga2V0dGxlJyx7Ym9keTptZXNzYWdlLGljb246aWNvbn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNsYWNrIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCl7XG4gICAgICBCcmV3U2VydmljZS5zbGFjaygkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5zbGFjayxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIGljb24sXG4gICAgICAgICAga2V0dGxlXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3IoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgaWYoZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGBGYWlsZWQgcG9zdGluZyB0byBTbGFjayAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7SlNPTi5zdHJpbmdpZnkoZXJyKX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS51cGRhdGVLbm9iQ29weSA9IGZ1bmN0aW9uKGtldHRsZSl7XG5cbiAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAnIzc3Nyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnbm90IHJ1bm5pbmcnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYoa2V0dGxlLmVycm9yLm1lc3NhZ2Upe1xuICAgICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJyNkZGQnO1xuICAgICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Vycm9yJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSBmYWxzZTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAga2V0dGxlLmtub2IuYmFyQ29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICBrZXR0bGUua25vYi50cmFja0NvbG9yID0gJ3JnYmEoMjU1LDAsMCwuMSknO1xuICAgICAga2V0dGxlLmhpZ2ggPSBrZXR0bGUudGVtcC5jdXJyZW50LWtldHRsZS50ZW1wLnRhcmdldDtcbiAgICAgIGtldHRsZS5sb3cgPSBudWxsO1xuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnY29vbGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPCBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjUpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LC4xKSc7XG4gICAgICBrZXR0bGUubG93ID0ga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnaGVhdGluZyc7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSgyNTUsMCwwLC42KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL3VwZGF0ZSBrbm9iIHRleHRcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gKGtldHRsZS5sb3cta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgbG93JztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSg0NCwxOTMsMTMzLC4xKSc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnd2l0aGluIHRhcmdldCc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBrZXR0bGUuaGlnaCA9IG51bGw7XG4gICAgfVxuICAgIC8vIHVwZGF0ZSBzdWJ0ZXh0IHRvIGluY2x1ZGUgaHVtaWRpdHlcbiAgICBpZihrZXR0bGUuaHVtaWRpdHkpe1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0ga2V0dGxlLmh1bWlkaXR5KyclJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VLZXR0bGVUeXBlID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAvL2Rvbid0IGFsbG93IGNoYW5naW5nIGtldHRsZXMgb24gc2hhcmVkIHNlc3Npb25zXG4gICAgLy90aGlzIGNvdWxkIGJlIGRhbmdlcm91cyBpZiBkb2luZyB0aGlzIHJlbW90ZWx5XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnNoYXJlZClcbiAgICAgIHJldHVybjtcbiAgICAvLyBmaW5kIGN1cnJlbnQga2V0dGxlXG4gICAgdmFyIGtldHRsZUluZGV4ID0gXy5maW5kSW5kZXgoJHNjb3BlLmtldHRsZVR5cGVzLCB7dHlwZToga2V0dGxlLnR5cGV9KTtcbiAgICAvLyBtb3ZlIHRvIG5leHQgb3IgZmlyc3Qga2V0dGxlIGluIGFycmF5XG4gICAga2V0dGxlSW5kZXgrKztcbiAgICB2YXIga2V0dGxlVHlwZSA9ICgkc2NvcGUua2V0dGxlVHlwZXNba2V0dGxlSW5kZXhdKSA/ICRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0gOiAkc2NvcGUua2V0dGxlVHlwZXNbMF07XG4gICAgLy91cGRhdGUga2V0dGxlIG9wdGlvbnMgaWYgY2hhbmdlZFxuICAgIGtldHRsZS5rZXkgPSBrZXR0bGVUeXBlLm5hbWU7XG4gICAga2V0dGxlLnR5cGUgPSBrZXR0bGVUeXBlLnR5cGU7XG4gICAga2V0dGxlLnRlbXAudGFyZ2V0ID0ga2V0dGxlVHlwZS50YXJnZXQ7XG4gICAga2V0dGxlLnRlbXAuZGlmZiA9IGtldHRsZVR5cGUuZGlmZjtcbiAgICBrZXR0bGUua25vYiA9IGFuZ3VsYXIuY29weShCcmV3U2VydmljZS5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6a2V0dGxlLnRlbXAuY3VycmVudCxtaW46MCxtYXg6a2V0dGxlVHlwZS50YXJnZXQra2V0dGxlVHlwZS5kaWZmfSk7XG4gICAgaWYoa2V0dGxlVHlwZS50eXBlID09ICdmZXJtZW50ZXInIHx8IGtldHRsZVR5cGUudHlwZSA9PSAnYWlyJyl7XG4gICAgICBrZXR0bGUuY29vbGVyID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5wdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUucHVtcCA9IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfTtcbiAgICAgIGRlbGV0ZSBrZXR0bGUuY29vbGVyO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVW5pdHMgPSBmdW5jdGlvbih1bml0KXtcbiAgICBpZigkc2NvcGUuc2V0dGluZ3MudW5pdCAhPSB1bml0KXtcbiAgICAgICRzY29wZS5zZXR0aW5ncy51bml0ID0gdW5pdDtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcyxmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUudGVtcC5jdXJyZW50ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLmN1cnJlbnQsdW5pdCk7XG4gICAgICAgIGtldHRsZS50ZW1wLnRhcmdldCA9ICRmaWx0ZXIoJ2Zvcm1hdERlZ3JlZXMnKShrZXR0bGUudGVtcC50YXJnZXQsdW5pdCk7XG4gICAgICAgIGlmKCEha2V0dGxlLnRlbXAuYWRqdXN0KXtcbiAgICAgICAgICBpZih1bml0ID09PSAnQycpXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBNYXRoLnJvdW5kKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0gTWF0aC5yb3VuZChrZXR0bGUudGVtcC5hZGp1c3QqMS44KTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUga25vYlxuICAgICAgICBrZXR0bGUua25vYi52YWx1ZSA9IGtldHRsZS50ZW1wLmN1cnJlbnQ7XG4gICAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wLnRhcmdldCtrZXR0bGUudGVtcC5kaWZmKzEwO1xuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLmNoYXJ0T3B0aW9ucyA9IEJyZXdTZXJ2aWNlLmNoYXJ0T3B0aW9ucyh1bml0KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyUnVuID0gZnVuY3Rpb24odGltZXIsa2V0dGxlKXtcbiAgICByZXR1cm4gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vY2FuY2VsIGludGVydmFsIGlmIHplcm8gb3V0XG4gICAgICBpZighdGltZXIudXAgJiYgdGltZXIubWluPT0wICYmIHRpbWVyLnNlYz09MCl7XG4gICAgICAgIC8vc3RvcCBydW5uaW5nXG4gICAgICAgIHRpbWVyLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgLy9zdGFydCB1cCBjb3VudGVyXG4gICAgICAgIHRpbWVyLnVwID0ge21pbjowLHNlYzowLHJ1bm5pbmc6dHJ1ZX07XG4gICAgICAgIC8vaWYgYWxsIHRpbWVycyBhcmUgZG9uZSBzZW5kIGFuIGFsZXJ0XG4gICAgICAgIGlmKCAhIWtldHRsZSAmJiBfLmZpbHRlcihrZXR0bGUudGltZXJzLCB7dXA6IHtydW5uaW5nOnRydWV9fSkubGVuZ3RoID09IGtldHRsZS50aW1lcnMubGVuZ3RoIClcbiAgICAgICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlLHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZighdGltZXIudXAgJiYgdGltZXIuc2VjID4gMCl7XG4gICAgICAgIC8vY291bnQgZG93biBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYy0tO1xuICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnNlYyA8IDU5KXtcbiAgICAgICAgLy9jb3VudCB1cCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnVwLnNlYysrO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCl7XG4gICAgICAgIC8vc2hvdWxkIHdlIHN0YXJ0IHRoZSBuZXh0IHRpbWVyP1xuICAgICAgICBpZighIWtldHRsZSl7XG4gICAgICAgICAgXy5lYWNoKF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHtydW5uaW5nOmZhbHNlLG1pbjp0aW1lci5taW4scXVldWU6ZmFsc2V9KSxmdW5jdGlvbihuZXh0VGltZXIpe1xuICAgICAgICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSxuZXh0VGltZXIpO1xuICAgICAgICAgICAgbmV4dFRpbWVyLnF1ZXVlPXRydWU7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydChuZXh0VGltZXIsa2V0dGxlKTtcbiAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vY291bmQgZG93biBtaW51dGVzIGFuZCBzZWNvbmRzXG4gICAgICAgIHRpbWVyLnNlYz01OTtcbiAgICAgICAgdGltZXIubWluLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXApe1xuICAgICAgICAvL2NvdW5kIHVwIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjPTA7XG4gICAgICAgIHRpbWVyLnVwLm1pbisrO1xuICAgICAgfVxuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLnRpbWVyU3RhcnQgPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci51cC5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIGlmKHRpbWVyLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRpbWVyXG4gICAgICB0aW1lci5ydW5uaW5nPWZhbHNlO1xuICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lci5pbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vc3RhcnQgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9dHJ1ZTtcbiAgICAgIHRpbWVyLnF1ZXVlPWZhbHNlO1xuICAgICAgdGltZXIuaW50ZXJ2YWwgPSAkc2NvcGUudGltZXJSdW4odGltZXIsa2V0dGxlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnByb2Nlc3NUZW1wcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFNlbnNvcnMgPSBbXTtcbiAgICAvL29ubHkgcHJvY2VzcyBhY3RpdmUgc2Vuc29yc1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGssIGkpID0+IHtcbiAgICAgIGlmKCRzY29wZS5rZXR0bGVzW2ldLmFjdGl2ZSl7XG4gICAgICAgIGFsbFNlbnNvcnMucHVzaChCcmV3U2VydmljZS50ZW1wKCRzY29wZS5rZXR0bGVzW2ldKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+ICRzY29wZS51cGRhdGVUZW1wKHJlc3BvbnNlLCAkc2NvcGUua2V0dGxlc1tpXSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwgJHNjb3BlLmtldHRsZXNbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHEuYWxsKGFsbFNlbnNvcnMpXG4gICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAvL3JlIHByb2Nlc3Mgb24gdGltZW91dFxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgfSwoISEkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMpID8gJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDAgOiAxMDAwMCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbihrZXR0bGUsZmllbGQsdXApe1xuXG4gICAgaWYodGltZW91dClcbiAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcblxuICAgIGlmKHVwKVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdKys7XG4gICAgZWxzZVxuICAgICAga2V0dGxlLnRlbXBbZmllbGRdLS07XG5cbiAgICAvL3VwZGF0ZSBrbm9iIGFmdGVyIDEgc2Vjb25kcywgb3RoZXJ3aXNlIHdlIGdldCBhIGxvdCBvZiByZWZyZXNoIG9uIHRoZSBrbm9iIHdoZW4gY2xpY2tpbmcgcGx1cyBvciBtaW51c1xuICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy91cGRhdGUgbWF4XG4gICAgICBrZXR0bGUua25vYi5tYXggPSBrZXR0bGUudGVtcFsndGFyZ2V0J10ra2V0dGxlLnRlbXBbJ2RpZmYnXSsxMDtcbiAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgIH0sMTAwMCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvYWRDb25maWcoKSAvLyBsb2FkIGNvbmZpZ1xuICAgIC50aGVuKCRzY29wZS5pbml0KSAvLyBpbml0XG4gICAgLnRoZW4obG9hZGVkID0+IHtcbiAgICAgIGlmKCEhbG9hZGVkKVxuICAgICAgICAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7IC8vIHN0YXJ0IHBvbGxpbmdcbiAgICB9KTtcbiAgLy8gc2NvcGUgd2F0Y2hcbiAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygnc2V0dGluZ3MnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcblxuICAkc2NvcGUuJHdhdGNoKCdrZXR0bGVzJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnLG5ld1ZhbHVlKTtcbiAgfSx0cnVlKTtcblxuICAkc2NvcGUuJHdhdGNoKCdzaGFyZScsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzaGFyZScsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICQoIGRvY3VtZW50ICkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKTtcbiAgfSk7XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9jb250cm9sbGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZGlyZWN0aXZlKCdlZGl0YWJsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7bW9kZWw6Jz0nLHR5cGU6J0A/Jyx0cmltOidAPycsY2hhbmdlOicmPycsZW50ZXI6JyY/JyxwbGFjZWhvbGRlcjonQD8nfSxcbiAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgIHRlbXBsYXRlOlxuJzxzcGFuPicrXG4gICAgJzxpbnB1dCB0eXBlPVwie3t0eXBlfX1cIiBuZy1tb2RlbD1cIm1vZGVsXCIgbmctc2hvdz1cImVkaXRcIiBuZy1lbnRlcj1cImVkaXQ9ZmFsc2VcIiBuZy1jaGFuZ2U9XCJ7e2NoYW5nZXx8ZmFsc2V9fVwiIGNsYXNzPVwiZWRpdGFibGVcIj48L2lucHV0PicrXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImVkaXRhYmxlXCIgbmctc2hvdz1cIiFlZGl0XCI+e3sodHJpbSkgPyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6ICgobW9kZWwgfHwgcGxhY2Vob2xkZXIpIHwgbGltaXRUbzp0cmltKStcIi4uLlwiKSA6JytcbiAgICAgICAgJyAoKHR5cGU9PVwicGFzc3dvcmRcIikgPyBcIioqKioqKipcIiA6IChtb2RlbCB8fCBwbGFjZWhvbGRlcikpfX08L3NwYW4+Jytcbic8L3NwYW4+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5lZGl0ID0gZmFsc2U7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gISFzY29wZS50eXBlID8gc2NvcGUudHlwZSA6ICd0ZXh0JztcbiAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuZWRpdCA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihzY29wZS5lbnRlcikgc2NvcGUuZW50ZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChlLmNoYXJDb2RlID09PSAxMyB8fCBlLmtleUNvZGUgPT09MTMgKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgaWYoc2NvcGUuY2hhbmdlKVxuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5jaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ29uUmVhZEZpbGUnLCBmdW5jdGlvbiAoJHBhcnNlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRzY29wZTogZmFsc2UsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMub25SZWFkRmlsZSk7XG5cblx0XHRcdGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKG9uQ2hhbmdlRXZlbnQpIHtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBmaWxlID0gKG9uQ2hhbmdlRXZlbnQuc3JjRWxlbWVudCB8fCBvbkNoYW5nZUV2ZW50LnRhcmdldCkuZmlsZXNbMF07XG4gICAgICAgIHZhciBleHRlbnNpb24gPSAoZmlsZSkgPyBmaWxlLm5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZEV2ZW50KSB7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4oc2NvcGUsIHskZmlsZUNvbnRlbnQ6IG9uTG9hZEV2ZW50LnRhcmdldC5yZXN1bHQsICRleHQ6IGV4dGVuc2lvbn0pO1xuICAgICAgICAgICAgZWxlbWVudC52YWwobnVsbCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmlsdGVyKCdtb21lbnQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xuICAgICAgaWYoIWRhdGUpXG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIGlmKGZvcm1hdClcbiAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlLnRvU3RyaW5nKCkpLmZvcm1hdChmb3JtYXQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbW9tZW50KGRhdGUudG9TdHJpbmcoKSkuZnJvbU5vdygpO1xuICAgIH07XG59KVxuLmZpbHRlcignZm9ybWF0RGVncmVlcycsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRlbXAsdW5pdCkge1xuICAgIGlmKHVuaXQ9PSdGJylcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKSh0ZW1wKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gJGZpbHRlcigndG9DZWxzaXVzJykodGVtcCk7XG4gIH07XG59KVxuLmZpbHRlcigndG9GYWhyZW5oZWl0JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihjZWxzaXVzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoY2Vsc2l1cyo5LzUrMzIpO1xuICB9O1xufSlcbi5maWx0ZXIoJ3RvQ2Vsc2l1cycsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZmFocmVuaGVpdCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKChmYWhyZW5oZWl0LTMyKSo1LzkpO1xuICB9O1xufSlcbi5maWx0ZXIoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKCRzY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRleHQsIHBocmFzZSkge1xuICAgIGlmICh0ZXh0ICYmIHBocmFzZSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKCcoJytwaHJhc2UrJyknLCAnZ2knKSwgJzxzcGFuIGNsYXNzPVwiaGlnaGxpZ2h0ZWRcIj4kMTwvc3Bhbj4nKTtcbiAgICB9IGVsc2UgaWYoIXRleHQpe1xuICAgICAgdGV4dCA9ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0LnRvU3RyaW5nKCkpO1xuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvZmlsdGVycy5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uZmFjdG9yeSgnQnJld1NlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRmaWx0ZXIpe1xuXG4gIHJldHVybiB7XG5cbiAgICAvL2Nvb2tpZXMgc2l6ZSA0MDk2IGJ5dGVzXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCl7XG4gICAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKXtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzZXR0aW5ncycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2tldHRsZXMnKTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdzaGFyZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBvbGxTZWNvbmRzOiAxMFxuICAgICAgICAsdW5pdDogJ0YnXG4gICAgICAgICxsYXlvdXQ6ICdjYXJkJ1xuICAgICAgICAsY2hhcnQ6IHRydWVcbiAgICAgICAgLHNoYXJlZDogZmFsc2VcbiAgICAgICAgLHJlY2lwZTogeyduYW1lJzonJywnYnJld2VyJzp7bmFtZTonJywnZW1haWwnOicnfSwneWVhc3QnOltdLCdob3BzJzpbXSwnZ3JhaW5zJzpbXSxzY2FsZTonZ3Jhdml0eScsbWV0aG9kOidwYXBhemlhbicsJ29nJzoxLjA1MCwnZmcnOjEuMDEwLCdhYnYnOjAsJ2Fidyc6MCwnY2Fsb3JpZXMnOjAsJ2F0dGVudWF0aW9uJzowfVxuICAgICAgICAsbm90aWZpY2F0aW9uczoge29uOnRydWUsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9XG4gICAgICAgICxzb3VuZHM6IHtvbjp0cnVlLGFsZXJ0OicvYXNzZXRzL2F1ZGlvL2Jpa2UubXAzJyx0aW1lcjonL2Fzc2V0cy9hdWRpby9zY2hvb2wubXAzJ31cbiAgICAgICAgLGFjY291bnQ6IHthcGlLZXk6ICcnLCBzZXNzaW9uczogW119XG4gICAgICAgICxpbmZsdXhkYjoge3VybDogJycsIHBvcnQ6IDgwODYsIHVzZXI6ICcnLCBwYXNzOiAnJywgZGI6ICcnLCBkYnM6W10sIGNvbm5lY3RlZDogZmFsc2V9XG4gICAgICAgICxhcmR1aW5vczogW3tcbiAgICAgICAgICBpZDogYnRvYSgnYnJld2JlbmNoJyksXG4gICAgICAgICAgdXJsOiAnYXJkdWluby5sb2NhbCcsXG4gICAgICAgICAgYW5hbG9nOiA1LFxuICAgICAgICAgIGRpZ2l0YWw6IDEzLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2VcbiAgICAgICAgfV1cbiAgICAgICAgLHRwbGluazoge3VzZXI6ICcnLCBwYXNzOiAnJywgdG9rZW46JycsIHBsdWdzOiBbXX1cbiAgICAgICAgLHNrZXRjaGVzOiB7ZnJlcXVlbmN5OiA2MCwgaWdub3JlX3ZlcnNpb25fZXJyb3I6IGZhbHNlfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtub2JPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXG4gICAgICAgIHVuaXQ6ICdcXHUwMEIwJyxcbiAgICAgICAgc3ViVGV4dDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgY29sb3I6ICdncmF5JyxcbiAgICAgICAgICBmb250OiAnYXV0bydcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2tXaWR0aDogNDAsXG4gICAgICAgIGJhcldpZHRoOiAyNSxcbiAgICAgICAgYmFyQ2FwOiAyNSxcbiAgICAgICAgdHJhY2tDb2xvcjogJyNkZGQnLFxuICAgICAgICBiYXJDb2xvcjogJyM3NzcnLFxuICAgICAgICBkeW5hbWljT3B0aW9uczogdHJ1ZSxcbiAgICAgICAgZGlzcGxheVByZXZpb3VzOiB0cnVlLFxuICAgICAgICBwcmV2QmFyQ29sb3I6ICcjNzc3J1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZGVmYXVsdEtldHRsZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgICBrZXk6ICdIb3QgTGlxdW9yJ1xuICAgICAgICAgICx0eXBlOiAnd2F0ZXInXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0QyJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidEMycscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTAnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTcwLGRpZmY6Mn1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLCB1cmw6ICdhcmR1aW5vLmxvY2FsJyxhbmFsb2c6IDUsZGlnaXRhbDogMTN9XG4gICAgICAgICAgLGVycm9yOiB7bWVzc2FnZTonJyx2ZXJzaW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiB0cnVlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBrZXk6ICdNYXNoJ1xuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6Mn1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLCB1cmw6ICdhcmR1aW5vLmxvY2FsJyxhbmFsb2c6IDUsZGlnaXRhbDogMTN9XG4gICAgICAgICAgLGVycm9yOiB7bWVzc2FnZTonJyx2ZXJzaW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiB0cnVlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBrZXk6ICdCb2lsJ1xuICAgICAgICAgICx0eXBlOiAnaG9wJ1xuICAgICAgICAgICxhY3RpdmU6IGZhbHNlXG4gICAgICAgICAgLHN0aWNreTogZmFsc2VcbiAgICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAscHVtcDoge3BpbjonRDcnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHRlbXA6IHtwaW46J0EyJyx0eXBlOidUaGVybWlzdG9yJyxoaXQ6ZmFsc2UsY3VycmVudDowLHByZXZpb3VzOjAsYWRqdXN0OjAsdGFyZ2V0OjIwMCxkaWZmOjJ9XG4gICAgICAgICAgLHZhbHVlczogW11cbiAgICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAgICxrbm9iOiBhbmd1bGFyLmNvcHkodGhpcy5kZWZhdWx0S25vYk9wdGlvbnMoKSx7dmFsdWU6MCxtaW46MCxtYXg6MjIwfSlcbiAgICAgICAgICAsYXJkdWlubzoge2lkOiBidG9hKCdicmV3YmVuY2gnKSwgdXJsOiAnYXJkdWluby5sb2NhbCcsYW5hbG9nOiA1LGRpZ2l0YWw6IDEzfVxuICAgICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgICAsbm90aWZ5OiB7c2xhY2s6IGZhbHNlLCBkd2VldDogdHJ1ZX1cbiAgICAgICAgfV07XG4gICAgfSxcblxuICAgIHNldHRpbmdzOiBmdW5jdGlvbihrZXksdmFsdWVzKXtcbiAgICAgIGlmKCF3aW5kb3cubG9jYWxTdG9yYWdlKVxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYodmFsdWVzKXtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSxKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKXtcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIC8qSlNPTiBwYXJzZSBlcnJvciovXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzZW5zb3JUeXBlczogZnVuY3Rpb24obmFtZSl7XG4gICAgICBsZXQgc2Vuc29ycyA9IFtcbiAgICAgICAge25hbWU6ICdUaGVybWlzdG9yJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiBmYWxzZX1cbiAgICAgICAgLHtuYW1lOiAnRFMxOEIyMCcsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ1BUMTAwJywgYW5hbG9nOiB0cnVlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQxMScsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDIxJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjInLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmKG5hbWUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihzZW5zb3JzLCB7J25hbWUnOiBuYW1lfSlbMF07XG4gICAgICByZXR1cm4gc2Vuc29ycztcbiAgICB9LFxuXG4gICAga2V0dGxlVHlwZXM6IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgbGV0IGtldHRsZXMgPSBbXG4gICAgICAgIHsnbmFtZSc6J0JvaWwnLCd0eXBlJzonaG9wJywndGFyZ2V0JzoyMDAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidNYXNoJywndHlwZSc6J2dyYWluJywndGFyZ2V0JzoxNTIsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidIb3QgTGlxdW9yJywndHlwZSc6J3dhdGVyJywndGFyZ2V0JzoxNzAsJ2RpZmYnOjJ9XG4gICAgICAgICx7J25hbWUnOidGZXJtZW50ZXInLCd0eXBlJzonZmVybWVudGVyJywndGFyZ2V0Jzo3NCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0FpcicsJ3R5cGUnOidhaXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgXTtcbiAgICAgIGlmKHR5cGUpXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihrZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSlbMF07XG4gICAgICByZXR1cm4ga2V0dGxlcztcbiAgICB9LFxuXG4gICAgZG9tYWluOiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgZG9tYWluID0gJ2h0dHA6Ly9hcmR1aW5vLmxvY2FsJztcblxuICAgICAgaWYoYXJkdWlubyAmJiBhcmR1aW5vLnVybCl7XG4gICAgICAgIGRvbWFpbiA9IChhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpICE9PSAtMSkgP1xuICAgICAgICAgIGFyZHVpbm8udXJsLnN1YnN0cihhcmR1aW5vLnVybC5pbmRleE9mKCcvLycpKzIpIDpcbiAgICAgICAgICBhcmR1aW5vLnVybDtcblxuICAgICAgICBpZighIWFyZHVpbm8uc2VjdXJlKVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwczovLyR7ZG9tYWlufWA7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBkb21haW4gPSBgaHR0cDovLyR7ZG9tYWlufWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSxcblxuICAgIHNsYWNrOiBmdW5jdGlvbih3ZWJob29rX3VybCwgbXNnLCBjb2xvciwgaWNvbiwga2V0dGxlKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcblxuICAgICAgbGV0IHBvc3RPYmogPSB7J2F0dGFjaG1lbnRzJzogW3snZmFsbGJhY2snOiBtc2csXG4gICAgICAgICAgICAndGl0bGUnOiBrZXR0bGUua2V5LFxuICAgICAgICAgICAgJ3RpdGxlX2xpbmsnOiAnaHR0cDovLycrZG9jdW1lbnQubG9jYXRpb24uaG9zdCxcbiAgICAgICAgICAgICdmaWVsZHMnOiBbeyd2YWx1ZSc6IG1zZ31dLFxuICAgICAgICAgICAgJ2NvbG9yJzogY29sb3IsXG4gICAgICAgICAgICAnbXJrZHduX2luJzogWyd0ZXh0JywgJ2ZhbGxiYWNrJywgJ2ZpZWxkcyddLFxuICAgICAgICAgICAgJ3RodW1iX3VybCc6IGljb25cbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAkaHR0cCh7dXJsOiB3ZWJob29rX3VybCwgbWV0aG9kOidQT1NUJywgZGF0YTogJ3BheWxvYWQ9JytKU09OLnN0cmluZ2lmeShwb3N0T2JqKSwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfX0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVGhlcm1pc3RvciwgRFMxOEIyMCwgb3IgUFQxMDBcbiAgICAvLyBodHRwczovL2xlYXJuLmFkYWZydWl0LmNvbS90aGVybWlzdG9yL3VzaW5nLWEtdGhlcm1pc3RvclxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzM4MSlcbiAgICAvLyBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMjkwIGFuZCBodHRwczovL3d3dy5hZGFmcnVpdC5jb20vcHJvZHVjdC8zMzI4XG4gICAgdGVtcDogZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vJytrZXR0bGUudGVtcC50eXBlKycvJytrZXR0bGUudGVtcC5waW47XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgaGVhZGVyczogaGVhZGVycywgdGltZW91dDogc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMDB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG4gICAgLy8gcmVhZC93cml0ZSBoZWF0ZXJcbiAgICAvLyBodHRwOi8vYXJkdWlub3Ryb25pY3MuYmxvZ3Nwb3QuY29tLzIwMTMvMDEvd29ya2luZy13aXRoLXNhaW5zbWFydC01di1yZWxheS1ib2FyZC5odG1sXG4gICAgLy8gaHR0cDovL215aG93dG9zYW5kcHJvamVjdHMuYmxvZ3Nwb3QuY29tLzIwMTQvMDIvc2FpbnNtYXJ0LTItY2hhbm5lbC01di1yZWxheS1hcmR1aW5vLmh0bWxcbiAgICBkaWdpdGFsOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vZGlnaXRhbC8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgaGVhZGVyczogaGVhZGVycywgdGltZW91dDogc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGFuYWxvZzogZnVuY3Rpb24oa2V0dGxlLHNlbnNvcix2YWx1ZSl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2FuYWxvZy8nK3NlbnNvcisnLycrdmFsdWU7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgaGVhZGVyczogaGVhZGVycywgdGltZW91dDogc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGRpZ2l0YWxSZWFkOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHRpbWVvdXQpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsLycrc2Vuc29yO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBoZWFkZXJzID0ge307XG5cbiAgICAgIGlmKGtldHRsZS5hcmR1aW5vLnBhc3N3b3JkKVxuICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmFzaWMgJytidG9hKCdyb290Oicra2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiB1cmwsIG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMsIHRpbWVvdXQ6ICh0aW1lb3V0IHx8IHNldHRpbmdzLnBvbGxTZWNvbmRzKjEwMDApfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG9hZFNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHF1ZXJ5ID0gJyc7XG4gICAgICBpZihwYXNzd29yZClcbiAgICAgICAgcXVlcnkgPSAnP3Bhc3N3b3JkPScrbWQ1KHBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2dldC8nK2ZpbGUrcXVlcnksIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gZmluaXNoIHRoaXNcbiAgICAvLyBkZWxldGVTaGFyZUZpbGU6IGZ1bmN0aW9uKGZpbGUsIHBhc3N3b3JkKXtcbiAgICAvLyAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAvLyAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2RlbGV0ZS8nK2ZpbGUsIG1ldGhvZDogJ0dFVCd9KVxuICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgLy8gICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAvLyAgICAgICBxLnJlamVjdChlcnIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIHJldHVybiBxLnByb21pc2U7XG4gICAgLy8gfSxcblxuICAgIGNyZWF0ZVNoYXJlOiBmdW5jdGlvbihzaGFyZSl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGtldHRsZXMgPSB0aGlzLnNldHRpbmdzKCdrZXR0bGVzJyk7XG4gICAgICBsZXQgc2ggPSBPYmplY3QuYXNzaWduKHt9LCB7cGFzc3dvcmQ6IHNoYXJlLnBhc3N3b3JkLCBhY2Nlc3M6IHNoYXJlLmFjY2Vzc30pO1xuICAgICAgLy9yZW1vdmUgc29tZSB0aGluZ3Mgd2UgZG9uJ3QgbmVlZCB0byBzaGFyZVxuICAgICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0ua25vYjtcbiAgICAgICAgZGVsZXRlIGtldHRsZXNbaV0udmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuYWNjb3VudDtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5ub3RpZmljYXRpb25zO1xuICAgICAgc2V0dGluZ3Muc2hhcmVkID0gdHJ1ZTtcbiAgICAgIGlmKHNoLnBhc3N3b3JkKVxuICAgICAgICBzaC5wYXNzd29yZCA9IG1kNShzaC5wYXNzd29yZCk7XG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9jcmVhdGUvJyxcbiAgICAgICAgICBtZXRob2Q6J1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHsnc2hhcmUnOiBzaCwgJ3NldHRpbmdzJzogc2V0dGluZ3MsICdrZXR0bGVzJzoga2V0dGxlc30sXG4gICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc2hhcmVUZXN0OiBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBxdWVyeSA9IGB1cmw9JHthcmR1aW5vLnVybH1gXG5cbiAgICAgIGlmKGFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIHF1ZXJ5ICs9ICcmYXV0aD0nK2J0b2EoJ3Jvb3Q6JythcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvdGVzdC8/JytxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgaXA6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS9pcCcsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGR3ZWV0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhdGVzdDogKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2xhdGVzdC9kd2VldC9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vZHdlZXQuaW8vZ2V0L2R3ZWV0cy9mb3IvYnJld2JlbmNoJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRwbGluazogZnVuY3Rpb24oKXtcbiAgICAgIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93YXAudHBsaW5rY2xvdWQuY29tXCI7XG4gICAgICBsZXQgcGFyYW1zID0ge1xuICAgICAgICBhcHBOYW1lOiAnS2FzYV9BbmRyb2lkJyxcbiAgICAgICAgdGVybUlEOiAnQnJld0JlbmNoJyxcbiAgICAgICAgYXBwVmVyOiAnMS40LjQuNjA3JyxcbiAgICAgICAgb3NwZjogJ0FuZHJvaWQrNi4wLjEnLFxuICAgICAgICBuZXRUeXBlOiAnd2lmaScsXG4gICAgICAgIGxvY2FsZTogJ2VzX0VOJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbm5lY3Rpb246ICgpID0+IHtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGlmKHNldHRpbmdzLnRwbGluay50b2tlbil7XG4gICAgICAgICAgICBwYXJhbXMudG9rZW4gPSBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgICByZXR1cm4gdXJsKycvPycralF1ZXJ5LnBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW46ICh1c2VyLHBhc3MpID0+IHtcbiAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgaWYoIXVzZXIgfHwgIXBhc3MpXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgTG9naW4nKTtcbiAgICAgICAgICBjb25zdCBsb2dpbl9wYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjogXCJsb2dpblwiLFxuICAgICAgICAgICAgXCJ1cmxcIjogdXJsLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImFwcFR5cGVcIjogXCJLYXNhX0FuZHJvaWRcIixcbiAgICAgICAgICAgICAgXCJjbG91ZFBhc3N3b3JkXCI6IHBhc3MsXG4gICAgICAgICAgICAgIFwiY2xvdWRVc2VyTmFtZVwiOiB1c2VyLFxuICAgICAgICAgICAgICBcInRlcm1pbmFsVVVJRFwiOiBwYXJhbXMudGVybUlEXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkaHR0cCh7dXJsOiB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5fcGF5bG9hZCksXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5yZXN1bHQpe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNjYW46ICh0b2tlbikgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIHRva2VuID0gdG9rZW4gfHwgc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGlmKCF0b2tlbilcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCB0b2tlbicpO1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczoge3Rva2VuOiB0b2tlbn0sXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kOiBcImdldERldmljZUxpc3RcIiB9KSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGRldmljZSwgY29tbWFuZCkgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgICAgIGxldCB0b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICBsZXQgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIFwibWV0aG9kXCI6XCJwYXNzdGhyb3VnaFwiLFxuICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICBcImRldmljZUlkXCI6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgXCJyZXF1ZXN0RGF0YVwiOiBKU09OLnN0cmluZ2lmeSggY29tbWFuZCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRva2VuXG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgcGFyYW1zLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgJGh0dHAoe3VybDogZGV2aWNlLmFwcFNlcnZlclVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBvbjogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogMSB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBvZmY6IChkZXZpY2UpID0+IHtcbiAgICAgICAgICBsZXQgY29tbWFuZCA9IHtcInN5c3RlbVwiOntcInNldF9yZWxheV9zdGF0ZVwiOntcInN0YXRlXCI6IDAgfX19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wiZ2V0X3N5c2luZm9cIjpudWxsfSxcImVtZXRlclwiOntcImdldF9yZWFsdGltZVwiOm51bGx9fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIGluZmx1eGRiOiBmdW5jdGlvbigpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBpbmZsdXhDb25uZWN0aW9uID0gYCR7c2V0dGluZ3MuaW5mbHV4ZGIudXJsfWA7XG4gICAgICBpZiggISFzZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgICAgaW5mbHV4Q29ubmVjdGlvbiArPSBgOiR7c2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBpbmc6ICgpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9waW5nYCwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRiczogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mcT0ke2VuY29kZVVSSUNvbXBvbmVudCgnc2hvdyBkYXRhYmFzZXMnKX1gLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cyAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzWzBdLnNlcmllcy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyApe1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzWzBdLnZhbHVlcyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVEQjogKG5hbWUpID0+IHtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBgJHtpbmZsdXhDb25uZWN0aW9ufS9xdWVyeT91PSR7c2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0ke3NldHRpbmdzLmluZmx1eGRiLnBhc3N9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoYENSRUFURSBEQVRBQkFTRSBcIiR7bmFtZX1cImApfWAsIG1ldGhvZDogJ1BPU1QnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcGtnOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGdyYWluczogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9ncmFpbnMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBob3BzOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2hvcHMuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICB3YXRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS93YXRlci5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHN0eWxlczogZnVuY3Rpb24oKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3N0eWxlZ3VpZGUuanNvbicpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgbG92aWJvbmQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvbG92aWJvbmQuanNvbicpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBjaGFydE9wdGlvbnM6IGZ1bmN0aW9uKHVuaXQpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpbmVDaGFydCcsXG4gICAgICAgICAgICAgIG5vRGF0YTogJ0JyZXdCZW5jaCBMaXZlJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgIG1hcmdpbiA6IHtcbiAgICAgICAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICAgICAgICByaWdodDogMjAsXG4gICAgICAgICAgICAgICAgICBib3R0b206IDEwMCxcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDY1XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFswXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGQpeyByZXR1cm4gKGQgJiYgZC5sZW5ndGgpID8gZFsxXSA6IGQ7IH0sXG4gICAgICAgICAgICAgIC8vIGF2ZXJhZ2U6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWVhbiB9LFxuXG4gICAgICAgICAgICAgIGNvbG9yOiBkMy5zY2FsZS5jYXRlZ29yeTEwKCkucmFuZ2UoKSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgdXNlSW50ZXJhY3RpdmVHdWlkZWxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIGNsaXBWb3Jvbm9pOiBmYWxzZSxcblxuICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGltZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQzLnRpbWUuZm9ybWF0KCclSTolTTolUycpKG5ldyBEYXRlKGQpKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgICAgICAgICB0aWNrUGFkZGluZzogMjAsXG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWxEaXN0YW5jZTogNDAsXG4gICAgICAgICAgICAgICAgICBzdGFnZ2VyTGFiZWxzOiB0cnVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvcmNlWTogKCF1bml0IHx8IHVuaXQ9PSdGJykgPyBbMCwyMjBdIDogWy0xNywxMDRdLFxuICAgICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiAnVGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdDogZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQrJ1xcdTAwQjAnO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIG9yaWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgc2hvd01heE1pbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiAwXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tLzIwMTEvMDYvMTYvYWxjb2hvbC1ieS12b2x1bWUtY2FsY3VsYXRvci11cGRhdGVkL1xuICAgIC8vIFBhcGF6aWFuXG4gICAgYWJ2OiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggb2cgLSBmZyApICogMTMxLjI1KS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gRGFuaWVscywgdXNlZCBmb3IgaGlnaCBncmF2aXR5IGJlZXJzXG4gICAgYWJ2YTogZnVuY3Rpb24ob2csZmcpe1xuICAgICAgcmV0dXJuICgoIDc2LjA4ICogKCBvZyAtIGZnICkgLyAoIDEuNzc1IC0gb2cgKSkgKiAoIGZnIC8gMC43OTQgKSkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly9oYmQub3JnL2Vuc21pbmdyL1xuICAgIGFidzogZnVuY3Rpb24oYWJ2LGZnKXtcbiAgICAgIHJldHVybiAoKDAuNzkgKiBhYnYpIC8gZmcpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICByZTogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgwLjE4MDggKiBvcCkgKyAoMC44MTkyICogZnApO1xuICAgIH0sXG4gICAgYXR0ZW51YXRpb246IGZ1bmN0aW9uKG9wLGZwKXtcbiAgICAgIHJldHVybiAoKDEgLSAoZnAvb3ApKSoxMDApLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICBjYWxvcmllczogZnVuY3Rpb24oYWJ3LHJlLGZnKXtcbiAgICAgIHJldHVybiAoKCg2LjkgKiBhYncpICsgNC4wICogKHJlIC0gMC4xKSkgKiBmZyAqIDMuNTUpLnRvRml4ZWQoMSk7XG4gICAgfSxcbiAgICAvLyBodHRwOi8vd3d3LmJyZXdlcnNmcmllbmQuY29tL3BsYXRvLXRvLXNnLWNvbnZlcnNpb24tY2hhcnQvXG4gICAgc2c6IGZ1bmN0aW9uKHBsYXRvKXtcbiAgICAgIGxldCBzZyA9ICggMSArIChwbGF0byAvICgyNTguNiAtICggKHBsYXRvLzI1OC4yKSAqIDIyNy4xKSApICkgKS50b0ZpeGVkKDMpO1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2cpO1xuICAgIH0sXG4gICAgcGxhdG86IGZ1bmN0aW9uKHNnKXtcbiAgICAgIGxldCBwbGF0byA9ICgoLTEgKiA2MTYuODY4KSArICgxMTExLjE0ICogc2cpIC0gKDYzMC4yNzIgKiBNYXRoLnBvdyhzZywyKSkgKyAoMTM1Ljk5NyAqIE1hdGgucG93KHNnLDMpKSkudG9TdHJpbmcoKTtcbiAgICAgIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPT0gNSlcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykrMik7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPCA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICBlbHNlIGlmKHBsYXRvLnN1YnN0cmluZyhwbGF0by5pbmRleE9mKCcuJykrMSxwbGF0by5pbmRleE9mKCcuJykrMikgPiA1KXtcbiAgICAgICAgcGxhdG8gPSBwbGF0by5zdWJzdHJpbmcoMCxwbGF0by5pbmRleE9mKCcuJykpO1xuICAgICAgICBwbGF0byA9IHBhcnNlRmxvYXQocGxhdG8pICsgMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHBsYXRvKTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJTbWl0aDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIGxldCByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBpZighIXJlY2lwZS5GX1JfTkFNRSlcbiAgICAgICAgcmVzcG9uc2UubmFtZSA9IHJlY2lwZS5GX1JfTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlkpXG4gICAgICAgIHJlc3BvbnNlLmNhdGVnb3J5ID0gcmVjaXBlLkZfUl9TVFlMRS5GX1NfQ0FURUdPUlk7XG4gICAgICBpZighIXJlY2lwZS5GX1JfREFURSlcbiAgICAgICAgcmVzcG9uc2UuZGF0ZSA9IHJlY2lwZS5GX1JfREFURTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkZfUl9CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX09HKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRylcbiAgICAgICAgcmVzcG9uc2Uub2cgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9PRykudG9GaXhlZCgzKTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0ZHKS50b0ZpeGVkKDMpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfQUJWLDIpO1xuICAgICAgZWxzZSBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01JTl9BQlYsMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUFYX0lCVSwxMCk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSlcbiAgICAgICAgcmVzcG9uc2UuaWJ1ID0gcGFyc2VJbnQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0lCVSwxMCk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4pe1xuICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuR3JhaW4sZnVuY3Rpb24oZ3JhaW4pe1xuICAgICAgICAgIHJlc3BvbnNlLmdyYWlucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBncmFpbi5GX0dfTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoZ3JhaW4uRl9HX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uRl9HX0FNT1VOVC8xNiwyKSsnIGxicy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5Ib3BzLGZ1bmN0aW9uKGhvcCl7XG4gICAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogaG9wLkZfSF9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSA+IDAgPyBudWxsIDogcGFyc2VJbnQoaG9wLkZfSF9CT0lMX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMFxuICAgICAgICAgICAgICAgID8gJ0RyeSBIb3AgJyskZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICAgIDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMikrJyBvei4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfQUxQSEFcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfRFJZX0hPUF9USU1FXG4gICAgICAgICAgICAvLyBob3AuRl9IX09SSUdJTlxuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2Mpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLmxlbmd0aCl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogbWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgICAgbm90ZXM6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKSsnIGcuJyxcbiAgICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShtaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0KXtcbiAgICAgICAgaWYocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0LkZfWV9MQUIrJyAnKyh5ZWFzdC5GX1lfUFJPRFVDVF9JRCA/XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX1BST0RVQ1RfSUQgOlxuICAgICAgICAgICAgICAgIHllYXN0LkZfWV9OQU1FKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTEFCKycgJytcbiAgICAgICAgICAgICAgKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIHJlY2lwZUJlZXJYTUw6IGZ1bmN0aW9uKHJlY2lwZSl7XG4gICAgICBsZXQgcmVzcG9uc2UgPSB7bmFtZTonJywgZGF0ZTonJywgYnJld2VyOiB7bmFtZTonJ30sIGNhdGVnb3J5OicnLCBhYnY6JycsIG9nOjAuMDAwLCBmZzowLjAwMCwgaWJ1OjAsIGhvcHM6W10sIGdyYWluczpbXSwgeWVhc3Q6W10sIG1pc2M6W119O1xuICAgICAgbGV0IG1hc2hfdGltZSA9IDYwO1xuXG4gICAgICBpZighIXJlY2lwZS5OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLk5BTUU7XG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuU1RZTEUuQ0FURUdPUlk7XG5cbiAgICAgIC8vIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgLy8gICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuQlJFV0VSKVxuICAgICAgICByZXNwb25zZS5icmV3ZXIubmFtZSA9IHJlY2lwZS5CUkVXRVI7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk9HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLk9HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRkcpLnRvRml4ZWQoMyk7XG5cbiAgICAgIGlmKCEhcmVjaXBlLklCVSlcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUludChyZWNpcGUuSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01BWClcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NQVgsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLlNUWUxFLkFCVl9NSU4pXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5TVFlMRS5BQlZfTUlOLDIpO1xuXG4gICAgICBpZighIXJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQLmxlbmd0aCAmJiByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUUpe1xuICAgICAgICBtYXNoX3RpbWUgPSByZWNpcGUuTUFTSC5NQVNIX1NURVBTLk1BU0hfU1RFUFswXS5TVEVQX1RJTUU7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkZFUk1FTlRBQkxFUyl7XG4gICAgICAgIGxldCBncmFpbnMgPSAocmVjaXBlLkZFUk1FTlRBQkxFUy5GRVJNRU5UQUJMRSAmJiByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFLmxlbmd0aCkgPyByZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFIDogcmVjaXBlLkZFUk1FTlRBQkxFUztcbiAgICAgICAgXy5lYWNoKGdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLk5BTUUsXG4gICAgICAgICAgICBtaW46IHBhcnNlSW50KG1hc2hfdGltZSwxMCksXG4gICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkFNT1VOVCwyKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkhPUFMpe1xuICAgICAgICBsZXQgaG9wcyA9IChyZWNpcGUuSE9QUy5IT1AgJiYgcmVjaXBlLkhPUFMuSE9QLmxlbmd0aCkgPyByZWNpcGUuSE9QUy5IT1AgOiByZWNpcGUuSE9QUztcbiAgICAgICAgXy5lYWNoKGhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICByZXNwb25zZS5ob3BzLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGhvcC5OQU1FKycgKCcraG9wLkZPUk0rJyknLFxuICAgICAgICAgICAgbWluOiBob3AuVVNFID09ICdEcnkgSG9wJyA/IDAgOiBwYXJzZUludChob3AuVElNRSwxMCksXG4gICAgICAgICAgICBub3RlczogaG9wLlVTRSA9PSAnRHJ5IEhvcCdcbiAgICAgICAgICAgICAgPyBob3AuVVNFKycgJyskZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKSsnIG96LicrJyBmb3IgJytwYXJzZUludChob3AuVElNRS82MC8yNCwxMCkrJyBEYXlzJ1xuICAgICAgICAgICAgICA6IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1JU0NTKXtcbiAgICAgICAgbGV0IG1pc2MgPSAocmVjaXBlLk1JU0NTLk1JU0MgJiYgcmVjaXBlLk1JU0NTLk1JU0MubGVuZ3RoKSA/IHJlY2lwZS5NSVNDUy5NSVNDIDogcmVjaXBlLk1JU0NTO1xuICAgICAgICBfLmVhY2gobWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICByZXNwb25zZS5taXNjLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IG1pc2MuTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWlzYy5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAnQWRkICcrbWlzYy5BTU9VTlQrJyB0byAnK21pc2MuVVNFLFxuICAgICAgICAgICAgYW1vdW50OiBtaXNjLkFNT1VOVFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuWUVBU1RTKXtcbiAgICAgICAgbGV0IHllYXN0ID0gKHJlY2lwZS5ZRUFTVFMuWUVBU1QgJiYgcmVjaXBlLllFQVNUUy5ZRUFTVC5sZW5ndGgpID8gcmVjaXBlLllFQVNUUy5ZRUFTVCA6IHJlY2lwZS5ZRUFTVFM7XG4gICAgICAgICAgXy5lYWNoKHllYXN0LGZ1bmN0aW9uKHllYXN0KXtcbiAgICAgICAgICAgIHJlc3BvbnNlLnllYXN0LnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiB5ZWFzdC5OQU1FXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9LFxuICAgIGZvcm1hdFhNTDogZnVuY3Rpb24oY29udGVudCl7XG4gICAgICBsZXQgaHRtbGNoYXJzID0gW1xuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzI7JywgcjogJ8SQJ30sXG4gICAgICAgIHtmOiAnJiMyNzM7JywgcjogJ8SRJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzI4MjsnLCByOiAnxJonfSxcbiAgICAgICAge2Y6ICcmIzI4MzsnLCByOiAnxJsnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJiMzMjc7JywgcjogJ8WHJ30sXG4gICAgICAgIHtmOiAnJiMzMjg7JywgcjogJ8WIJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ0OycsIHI6ICfFmCd9LFxuICAgICAgICB7ZjogJyYjMzQ1OycsIHI6ICfFmSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmIzM2NjsnLCByOiAnxa4nfSxcbiAgICAgICAge2Y6ICcmIzM2NzsnLCByOiAnxa8nfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMjY0OycsIHI6ICfEiCd9LFxuICAgICAgICB7ZjogJyYjMjY1OycsIHI6ICfEiSd9LFxuICAgICAgICB7ZjogJyYjMjg0OycsIHI6ICfEnCd9LFxuICAgICAgICB7ZjogJyYjMjg1OycsIHI6ICfEnSd9LFxuICAgICAgICB7ZjogJyYjMjkyOycsIHI6ICfEpCd9LFxuICAgICAgICB7ZjogJyYjMjkzOycsIHI6ICfEpSd9LFxuICAgICAgICB7ZjogJyYjMzA4OycsIHI6ICfEtCd9LFxuICAgICAgICB7ZjogJyYjMzA5OycsIHI6ICfEtSd9LFxuICAgICAgICB7ZjogJyYjMzQ4OycsIHI6ICfFnCd9LFxuICAgICAgICB7ZjogJyYjMzQ5OycsIHI6ICfFnSd9LFxuICAgICAgICB7ZjogJyYjMzY0OycsIHI6ICfFrCd9LFxuICAgICAgICB7ZjogJyYjMzY1OycsIHI6ICfFrSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZPdGlsZGU7JywgcjogJ8OVJ30sXG4gICAgICAgIHtmOiAnJm90aWxkZTsnLCByOiAnw7UnfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmT0VsaWc7JywgcjogJ8WSJ30sXG4gICAgICAgIHtmOiAnJm9lbGlnOycsIHI6ICfFkyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzc2OycsIHI6ICfFuCd9LFxuICAgICAgICB7ZjogJyZ5dW1sOycsIHI6ICfDvyd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMyOTY7JywgcjogJ8SoJ30sXG4gICAgICAgIHtmOiAnJiMyOTc7JywgcjogJ8SpJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMzNjA7JywgcjogJ8WoJ30sXG4gICAgICAgIHtmOiAnJiMzNjE7JywgcjogJ8WpJ30sXG4gICAgICAgIHtmOiAnJiMzMTI7JywgcjogJ8S4J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzM2OycsIHI6ICfFkCd9LFxuICAgICAgICB7ZjogJyYjMzM3OycsIHI6ICfFkSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmIzM2ODsnLCByOiAnxbAnfSxcbiAgICAgICAge2Y6ICcmIzM2OTsnLCByOiAnxbEnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVUSDsnLCByOiAnw5AnfSxcbiAgICAgICAge2Y6ICcmZXRoOycsIHI6ICfDsCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJlRIT1JOOycsIHI6ICfDnid9LFxuICAgICAgICB7ZjogJyZ0aG9ybjsnLCByOiAnw74nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJklncmF2ZTsnLCByOiAnw4wnfSxcbiAgICAgICAge2Y6ICcmaWdyYXZlOycsIHI6ICfDrCd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWNpcmM7JywgcjogJ8ObJ30sXG4gICAgICAgIHtmOiAnJnVjaXJjOycsIHI6ICfDuyd9LFxuICAgICAgICB7ZjogJyYjMjU2OycsIHI6ICfEgCd9LFxuICAgICAgICB7ZjogJyYjMjU3OycsIHI6ICfEgSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjc0OycsIHI6ICfEkid9LFxuICAgICAgICB7ZjogJyYjMjc1OycsIHI6ICfEkyd9LFxuICAgICAgICB7ZjogJyYjMjkwOycsIHI6ICfEoid9LFxuICAgICAgICB7ZjogJyYjMjkxOycsIHI6ICfEoyd9LFxuICAgICAgICB7ZjogJyYjMjk4OycsIHI6ICfEqid9LFxuICAgICAgICB7ZjogJyYjMjk5OycsIHI6ICfEqyd9LFxuICAgICAgICB7ZjogJyYjMzEwOycsIHI6ICfEtid9LFxuICAgICAgICB7ZjogJyYjMzExOycsIHI6ICfEtyd9LFxuICAgICAgICB7ZjogJyYjMzE1OycsIHI6ICfEuyd9LFxuICAgICAgICB7ZjogJyYjMzE2OycsIHI6ICfEvCd9LFxuICAgICAgICB7ZjogJyYjMzI1OycsIHI6ICfFhSd9LFxuICAgICAgICB7ZjogJyYjMzI2OycsIHI6ICfFhid9LFxuICAgICAgICB7ZjogJyYjMzQyOycsIHI6ICfFlid9LFxuICAgICAgICB7ZjogJyYjMzQzOycsIHI6ICfFlyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzYyOycsIHI6ICfFqid9LFxuICAgICAgICB7ZjogJyYjMzYzOycsIHI6ICfFqyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJiMyNjA7JywgcjogJ8SEJ30sXG4gICAgICAgIHtmOiAnJiMyNjE7JywgcjogJ8SFJ30sXG4gICAgICAgIHtmOiAnJiMyNjI7JywgcjogJ8SGJ30sXG4gICAgICAgIHtmOiAnJiMyNjM7JywgcjogJ8SHJ30sXG4gICAgICAgIHtmOiAnJiMyODA7JywgcjogJ8SYJ30sXG4gICAgICAgIHtmOiAnJiMyODE7JywgcjogJ8SZJ30sXG4gICAgICAgIHtmOiAnJiMzMjE7JywgcjogJ8WBJ30sXG4gICAgICAgIHtmOiAnJiMzMjI7JywgcjogJ8WCJ30sXG4gICAgICAgIHtmOiAnJiMzMjM7JywgcjogJ8WDJ30sXG4gICAgICAgIHtmOiAnJiMzMjQ7JywgcjogJ8WEJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyYjMzQ2OycsIHI6ICfFmid9LFxuICAgICAgICB7ZjogJyYjMzQ3OycsIHI6ICfFmyd9LFxuICAgICAgICB7ZjogJyYjMzc3OycsIHI6ICfFuSd9LFxuICAgICAgICB7ZjogJyYjMzc4OycsIHI6ICfFuid9LFxuICAgICAgICB7ZjogJyYjMzc5OycsIHI6ICfFuyd9LFxuICAgICAgICB7ZjogJyYjMzgwOycsIHI6ICfFvCd9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmQXRpbGRlOycsIHI6ICfDgyd9LFxuICAgICAgICB7ZjogJyZhdGlsZGU7JywgcjogJ8OjJ30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJdW1sOycsIHI6ICfDjyd9LFxuICAgICAgICB7ZjogJyZpdW1sOycsIHI6ICfDryd9LFxuICAgICAgICB7ZjogJyZPZ3JhdmU7JywgcjogJ8OSJ30sXG4gICAgICAgIHtmOiAnJm9ncmF2ZTsnLCByOiAnw7InfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJiMyNTg7JywgcjogJ8SCJ30sXG4gICAgICAgIHtmOiAnJiMyNTk7JywgcjogJ8SDJ30sXG4gICAgICAgIHtmOiAnJkFjaXJjOycsIHI6ICfDgid9LFxuICAgICAgICB7ZjogJyZhY2lyYzsnLCByOiAnw6InfSxcbiAgICAgICAge2Y6ICcmSWNpcmM7JywgcjogJ8OOJ30sXG4gICAgICAgIHtmOiAnJmljaXJjOycsIHI6ICfDrid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyYjMzU0OycsIHI6ICfFoid9LFxuICAgICAgICB7ZjogJyYjMzU1OycsIHI6ICfFoyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzMzMDsnLCByOiAnxYonfSxcbiAgICAgICAge2Y6ICcmIzMzMTsnLCByOiAnxYsnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1ODsnLCByOiAnxaYnfSxcbiAgICAgICAge2Y6ICcmIzM1OTsnLCByOiAnxacnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWdyYXZlOycsIHI6ICfDgCd9LFxuICAgICAgICB7ZjogJyZhZ3JhdmU7JywgcjogJ8OgJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWdyYXZlOycsIHI6ICfDmSd9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcwOycsIHI6ICfEjid9LFxuICAgICAgICB7ZjogJyYjMjcxOycsIHI6ICfEjyd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmIzMxMzsnLCByOiAnxLknfSxcbiAgICAgICAge2Y6ICcmIzMxNDsnLCByOiAnxLonfSxcbiAgICAgICAge2Y6ICcmIzMxNzsnLCByOiAnxL0nfSxcbiAgICAgICAge2Y6ICcmIzMxODsnLCByOiAnxL4nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk9jaXJjOycsIHI6ICfDlCd9LFxuICAgICAgICB7ZjogJyZvY2lyYzsnLCByOiAnw7QnfSxcbiAgICAgICAge2Y6ICcmIzM0MDsnLCByOiAnxZQnfSxcbiAgICAgICAge2Y6ICcmIzM0MTsnLCByOiAnxZUnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM1NjsnLCByOiAnxaQnfSxcbiAgICAgICAge2Y6ICcmIzM1NzsnLCByOiAnxaUnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZpZXhjbDsnLCByOiAnwqEnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmaXF1ZXN0OycsIHI6ICfCvyd9LFxuICAgICAgICB7ZjogJyZvcmRtOycsIHI6ICfCuid9LFxuICAgICAgICB7ZjogJyZBcmluZzsnLCByOiAnw4UnfSxcbiAgICAgICAge2Y6ICcmYXJpbmc7JywgcjogJ8OlJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyYjMjg2OycsIHI6ICfEnid9LFxuICAgICAgICB7ZjogJyYjMjg3OycsIHI6ICfEnyd9LFxuICAgICAgICB7ZjogJyYjMzA0OycsIHI6ICfEsCd9LFxuICAgICAgICB7ZjogJyYjMzA1OycsIHI6ICfEsSd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyYjMzUwOycsIHI6ICfFnid9LFxuICAgICAgICB7ZjogJyYjMzUxOycsIHI6ICfFnyd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZldXJvOycsIHI6ICfigqwnfSxcbiAgICAgICAge2Y6ICcmcG91bmQ7JywgcjogJ8KjJ30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmYnVsbDsnLCByOiAn4oCiJ30sXG4gICAgICAgIHtmOiAnJmRhZ2dlcjsnLCByOiAn4oCgJ30sXG4gICAgICAgIHtmOiAnJmNvcHk7JywgcjogJ8KpJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmdHJhZGU7JywgcjogJ+KEoid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJnBlcm1pbDsnLCByOiAn4oCwJ30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnJm5kYXNoOycsIHI6ICfigJMnfSxcbiAgICAgICAge2Y6ICcmbWRhc2g7JywgcjogJ+KAlCd9LFxuICAgICAgICB7ZjogJyYjODQ3MDsnLCByOiAn4oSWJ30sXG4gICAgICAgIHtmOiAnJnJlZzsnLCByOiAnwq4nfSxcbiAgICAgICAge2Y6ICcmcGFyYTsnLCByOiAnwrYnfSxcbiAgICAgICAge2Y6ICcmcGx1c21uOycsIHI6ICfCsSd9LFxuICAgICAgICB7ZjogJyZtaWRkb3Q7JywgcjogJ8K3J30sXG4gICAgICAgIHtmOiAnbGVzcy10JywgcjogJzwnfSxcbiAgICAgICAge2Y6ICdncmVhdGVyLXQnLCByOiAnPid9LFxuICAgICAgICB7ZjogJyZub3Q7JywgcjogJ8KsJ30sXG4gICAgICAgIHtmOiAnJmN1cnJlbjsnLCByOiAnwqQnfSxcbiAgICAgICAge2Y6ICcmYnJ2YmFyOycsIHI6ICfCpid9LFxuICAgICAgICB7ZjogJyZkZWc7JywgcjogJ8KwJ30sXG4gICAgICAgIHtmOiAnJmFjdXRlOycsIHI6ICfCtCd9LFxuICAgICAgICB7ZjogJyZ1bWw7JywgcjogJ8KoJ30sXG4gICAgICAgIHtmOiAnJm1hY3I7JywgcjogJ8KvJ30sXG4gICAgICAgIHtmOiAnJmNlZGlsOycsIHI6ICfCuCd9LFxuICAgICAgICB7ZjogJyZsYXF1bzsnLCByOiAnwqsnfSxcbiAgICAgICAge2Y6ICcmcmFxdW87JywgcjogJ8K7J30sXG4gICAgICAgIHtmOiAnJnN1cDE7JywgcjogJ8K5J30sXG4gICAgICAgIHtmOiAnJnN1cDI7JywgcjogJ8KyJ30sXG4gICAgICAgIHtmOiAnJnN1cDM7JywgcjogJ8KzJ30sXG4gICAgICAgIHtmOiAnJm9yZGY7JywgcjogJ8KqJ30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm1pY3JvOycsIHI6ICfCtSd9LFxuICAgICAgICB7ZjogJ2h5O1x0JywgcjogJyYnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJk50aWxkZTsnLCByOiAnw5EnfSxcbiAgICAgICAge2Y6ICcmbnRpbGRlOycsIHI6ICfDsSd9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmc3psaWc7JywgcjogJ8OfJ30sXG4gICAgICAgIHtmOiAnJmFtcDsnLCByOiAnYW5kJ30sXG4gICAgICAgIHtmOiAnJmxkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyZHF1bzsnLCByOiAnXCInfSxcbiAgICAgICAge2Y6ICcmcnNxdW87JywgcjogXCInXCJ9XG4gICAgICBdO1xuXG4gICAgICBfLmVhY2goaHRtbGNoYXJzLCBmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgIGlmKGNvbnRlbnQuaW5kZXhPZihjaGFyLmYpICE9PSAtMSl7XG4gICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShSZWdFeHAoY2hhci5mLCdnJyksIGNoYXIucik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9O1xufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvanMvc2VydmljZXMuanMiXSwic291cmNlUm9vdCI6IiJ9