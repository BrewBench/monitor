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
        if (kettle.temp.type.indexOf('DHT') !== -1) {
          currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
          currentSketch.headers.push('#include <dht.h>');
        } else if (kettle.temp.type.indexOf('DS18B20') !== -1) {
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
      if (kettle.temp.type.indexOf('DHT') !== -1) {
        currentSketch.headers.push('// https://www.brewbench.co/libs/DHTLib.zip');
        currentSketch.headers.push('#include <dht.h>');
      } else if (kettle.temp.type.indexOf('DS18B20') !== -1) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb250cm9sbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZGlyZWN0aXZlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCIkY29tcGlsZVByb3ZpZGVyIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwiaGVhZGVycyIsImNvbW1vbiIsImhhc2hQcmVmaXgiLCJhSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiYW5ndWxhciIsIiRzY29wZSIsIiRzdGF0ZSIsIiRmaWx0ZXIiLCIkdGltZW91dCIsIiRpbnRlcnZhbCIsIiRxIiwiJGh0dHAiLCIkc2NlIiwiQnJld1NlcnZpY2UiLCJjbGVhclNldHRpbmdzIiwiZSIsImVsZW1lbnQiLCJ0YXJnZXQiLCJodG1sIiwiY2xlYXIiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJjdXJyZW50IiwibmFtZSIsIm5vdGlmaWNhdGlvbiIsInJlc2V0Q2hhcnQiLCJ0aW1lb3V0IiwiaG9wcyIsImdyYWlucyIsIndhdGVyIiwibG92aWJvbmQiLCJwa2ciLCJrZXR0bGVUeXBlcyIsImNoYXJ0T3B0aW9ucyIsInNlbnNvclR5cGVzIiwic2hvd1NldHRpbmdzIiwiZXJyb3IiLCJtZXNzYWdlIiwidHlwZSIsInNsaWRlciIsIm1pbiIsIm9wdGlvbnMiLCJmbG9vciIsImNlaWwiLCJzdGVwIiwidHJhbnNsYXRlIiwidmFsdWUiLCJvbkVuZCIsImtldHRsZUlkIiwibW9kZWxWYWx1ZSIsImhpZ2hWYWx1ZSIsInBvaW50ZXJUeXBlIiwia2V0dGxlIiwic3BsaXQiLCJrIiwia2V0dGxlcyIsImhlYXRlciIsImNvb2xlciIsInB1bXAiLCJhY3RpdmUiLCJwd20iLCJydW5uaW5nIiwidG9nZ2xlUmVsYXkiLCJnZXRLZXR0bGVTbGlkZXJPcHRpb25zIiwiaW5kZXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsImdldExvdmlib25kQ29sb3IiLCJyYW5nZSIsInJlcGxhY2UiLCJpbmRleE9mIiwickFyciIsInBhcnNlRmxvYXQiLCJsIiwiXyIsImZpbHRlciIsIml0ZW0iLCJzcm0iLCJoZXgiLCJsZW5ndGgiLCJzZXR0aW5ncyIsInJlc2V0IiwiZGVmYXVsdEtldHRsZXMiLCJzaGFyZSIsInBhcmFtcyIsImZpbGUiLCJwYXNzd29yZCIsIm5lZWRQYXNzd29yZCIsImFjY2VzcyIsImRlbGV0ZUFmdGVyIiwic3VtVmFsdWVzIiwib2JqIiwic3VtIiwidmFsdWVzIiwidXBkYXRlQUJWIiwicmVjaXBlIiwic2NhbGUiLCJtZXRob2QiLCJhYnYiLCJvZyIsImZnIiwiYWJ2YSIsImFidyIsImF0dGVudWF0aW9uIiwicGxhdG8iLCJjYWxvcmllcyIsInJlIiwic2ciLCJjaGFuZ2VNZXRob2QiLCJjaGFuZ2VTY2FsZSIsImdldFBvcnRSYW5nZSIsIm51bWJlciIsIkFycmF5IiwiZmlsbCIsIm1hcCIsImlkeCIsImFyZHVpbm9zIiwiYWRkIiwibm93IiwiRGF0ZSIsInB1c2giLCJidG9hIiwiYW5hbG9nIiwiZGlnaXRhbCIsImVhY2giLCJhcmR1aW5vIiwidXBkYXRlIiwiZGVsZXRlIiwic3BsaWNlIiwidHBsaW5rIiwibG9naW4iLCJ1c2VyIiwicGFzcyIsInRoZW4iLCJyZXNwb25zZSIsInRva2VuIiwic2NhbiIsImNhdGNoIiwic2V0RXJyb3JNZXNzYWdlIiwiZXJyIiwibXNnIiwicGx1Z3MiLCJkZXZpY2VMaXN0IiwicGx1ZyIsInN0YXR1cyIsImluZm8iLCJyZXNwb25zZURhdGEiLCJzeXNpbmZvIiwiSlNPTiIsInBhcnNlIiwic3lzdGVtIiwiZ2V0X3N5c2luZm8iLCJkZXZpY2UiLCJ0b2dnbGUiLCJyZWxheV9zdGF0ZSIsIm9mZiIsIm9uIiwiYWRkS2V0dGxlIiwia2V5IiwiZmluZCIsInN0aWNreSIsInBpbiIsImF1dG8iLCJkdXR5Q3ljbGUiLCJza2V0Y2giLCJ0ZW1wIiwiaGl0IiwicHJldmlvdXMiLCJhZGp1c3QiLCJkaWZmIiwidGltZXJzIiwia25vYiIsImNvcHkiLCJkZWZhdWx0S25vYk9wdGlvbnMiLCJtYXgiLCJ2ZXJzaW9uIiwibm90aWZ5Iiwic2xhY2siLCJkd2VldCIsImhhc1N0aWNreUtldHRsZXMiLCJrZXR0bGVDb3VudCIsImFjdGl2ZUtldHRsZXMiLCJwaW5EaXNwbGF5IiwiZGV2aWNlSWQiLCJzdWJzdHIiLCJhbGlhcyIsInBpbkluVXNlIiwiY3JlYXRlU2hhcmUiLCJicmV3ZXIiLCJlbWFpbCIsInNoYXJlX3N0YXR1cyIsInNoYXJlX3N1Y2Nlc3MiLCJzaGFyZV9saW5rIiwic2hhcmVUZXN0IiwidGVzdGluZyIsImh0dHBfY29kZSIsInB1YmxpYyIsInRlc3RJbmZsdXhEQiIsImluZmx1eGRiIiwiY29ubmVjdGVkIiwicGluZyIsIiQiLCJyZW1vdmVDbGFzcyIsImRicyIsImNvbmNhdCIsImFwcGx5IiwicmVtb3ZlIiwiZGIiLCJhZGRDbGFzcyIsImNyZWF0ZUluZmx1eERCIiwibW9tZW50IiwiZm9ybWF0IiwiY3JlYXRlZCIsImNyZWF0ZURCIiwiZGF0YSIsInJlc3VsdHMiLCJyZXNldEVycm9yIiwic2hhcmVBY2Nlc3MiLCJzaGFyZWQiLCJmcmFtZUVsZW1lbnQiLCJsb2FkU2hhcmVGaWxlIiwiY29udGVudHMiLCJub3RpZmljYXRpb25zIiwiaGlnaCIsImxvdyIsImxhc3QiLCJzdWJUZXh0IiwiZW5hYmxlZCIsInRleHQiLCJjb2xvciIsImZvbnQiLCJwcm9jZXNzVGVtcHMiLCJpbXBvcnRSZWNpcGUiLCIkZmlsZUNvbnRlbnQiLCIkZXh0IiwiZm9ybWF0dGVkX2NvbnRlbnQiLCJmb3JtYXRYTUwiLCJqc29uT2JqIiwieDJqcyIsIlgySlMiLCJ4bWxfc3RyMmpzb24iLCJyZWNpcGVfc3VjY2VzcyIsIlJlY2lwZXMiLCJEYXRhIiwiUmVjaXBlIiwiU2VsZWN0aW9ucyIsInJlY2lwZUJlZXJTbWl0aCIsIlJFQ0lQRVMiLCJSRUNJUEUiLCJyZWNpcGVCZWVyWE1MIiwiY2F0ZWdvcnkiLCJpYnUiLCJkYXRlIiwiZ3JhaW4iLCJhZGRUaW1lciIsImxhYmVsIiwibm90ZXMiLCJOdW1iZXIiLCJhbW91bnQiLCJob3AiLCJtaXNjIiwieWVhc3QiLCJsb2FkU3R5bGVzIiwic3R5bGVzIiwibG9hZENvbmZpZyIsInNrZXRjaF92ZXJzaW9uIiwiYmJfdmVyc2lvbiIsInNvcnRCeSIsInVuaXFCeSIsImFsbCIsImluaXQiLCJ0aW1lciIsInRpbWVyU3RhcnQiLCJxdWV1ZSIsInVwIiwidXBkYXRlS25vYkNvcHkiLCJ0cnVzdEFzSHRtbCIsImtleXMiLCJzdGF0dXNUZXh0Iiwic3RyaW5naWZ5IiwiZG9tYWluIiwidXBkYXRlVGVtcCIsInRlbXBzIiwidW5pdCIsIk1hdGgiLCJyb3VuZCIsImh1bWlkaXR5IiwiZ2V0VGltZSIsImFsZXJ0IiwiZ2V0TmF2T2Zmc2V0IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9mZnNldEhlaWdodCIsInNlYyIsInJlbW92ZVRpbWVycyIsImJ0biIsImhhc0NsYXNzIiwicGFyZW50IiwidG9nZ2xlUFdNIiwic3NyIiwidG9nZ2xlS2V0dGxlIiwiaGFzU2tldGNoZXMiLCJoYXNBU2tldGNoIiwia25vYkNsaWNrIiwic3RhcnRTdG9wS2V0dGxlIiwicmVhZE9ubHkiLCJpbXBvcnRTZXR0aW5ncyIsInByb2ZpbGVDb250ZW50IiwiZXhwb3J0U2V0dGluZ3MiLCJpIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaWdub3JlVmVyc2lvbkVycm9yIiwic2tldGNoZXMiLCJpZ25vcmVfdmVyc2lvbl9lcnJvciIsImRvd25sb2FkU2tldGNoIiwiYWN0aW9ucyIsImhhc1RyaWdnZXJzIiwidHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nIiwiY29ubmVjdGlvbiIsImNvbm5lY3Rpb25fc3RyaW5nIiwicG9ydCIsImF1dG9nZW4iLCJnZXQiLCJqb2luIiwiZnJlcXVlbmN5IiwicGFyc2VJbnQiLCJzdHJlYW1Ta2V0Y2giLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiY2xpY2siLCJkb3dubG9hZEF1dG9Ta2V0Y2giLCJhcmR1aW5vTmFtZSIsImN1cnJlbnRTa2V0Y2giLCJ0cmlnZ2VycyIsInVuc2hpZnQiLCJhIiwiZG93bmxvYWRJbmZsdXhEQlNrZXRjaCIsImdldElQQWRkcmVzcyIsImlwQWRkcmVzcyIsImlwIiwiaWNvbiIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJzb3VuZHMiLCJzbmQiLCJBdWRpbyIsInBsYXkiLCJjbG9zZSIsIk5vdGlmaWNhdGlvbiIsInBlcm1pc3Npb24iLCJib2R5IiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0cmFja0NvbG9yIiwiYmFyQ29sb3IiLCJjaGFuZ2VLZXR0bGVUeXBlIiwia2V0dGxlSW5kZXgiLCJmaW5kSW5kZXgiLCJrZXR0bGVUeXBlIiwiY2hhbmdlVW5pdHMiLCJ0aW1lclJ1biIsIm5leHRUaW1lciIsImNhbmNlbCIsImludGVydmFsIiwiYWxsU2Vuc29ycyIsInBvbGxTZWNvbmRzIiwiY2hhbmdlVmFsdWUiLCJmaWVsZCIsImxvYWRlZCIsIiR3YXRjaCIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJyZWFkeSIsInRvb2x0aXAiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibW9kZWwiLCJ0cmltIiwiY2hhbmdlIiwiZW50ZXIiLCJwbGFjZWhvbGRlciIsInRlbXBsYXRlIiwibGluayIsImF0dHJzIiwiZWRpdCIsImJpbmQiLCIkYXBwbHkiLCJjaGFyQ29kZSIsImtleUNvZGUiLCJuZ0VudGVyIiwiJHBhcnNlIiwiZm4iLCJvblJlYWRGaWxlIiwib25DaGFuZ2VFdmVudCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJzcmNFbGVtZW50IiwiZmlsZXMiLCJleHRlbnNpb24iLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsIm9ubG9hZCIsIm9uTG9hZEV2ZW50IiwicmVzdWx0IiwidmFsIiwicmVhZEFzVGV4dCIsInRvU3RyaW5nIiwiZnJvbU5vdyIsImNlbHNpdXMiLCJmYWhyZW5oZWl0IiwicGhyYXNlIiwiUmVnRXhwIiwiZmFjdG9yeSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJsYXlvdXQiLCJjaGFydCIsImFjY291bnQiLCJhcGlLZXkiLCJzZXNzaW9ucyIsInNlY3VyZSIsInRyYWNrV2lkdGgiLCJiYXJXaWR0aCIsImJhckNhcCIsImR5bmFtaWNPcHRpb25zIiwiZGlzcGxheVByZXZpb3VzIiwicHJldkJhckNvbG9yIiwic2V0SXRlbSIsImdldEl0ZW0iLCJzZW5zb3JzIiwid2ViaG9va191cmwiLCJxIiwiZGVmZXIiLCJwb3N0T2JqIiwiaG9zdCIsInJlc29sdmUiLCJyZWplY3QiLCJwcm9taXNlIiwiQXV0aG9yaXphdGlvbiIsInNlbnNvciIsImRpZ2l0YWxSZWFkIiwicXVlcnkiLCJtZDUiLCJzaCIsImxhdGVzdCIsImFwcE5hbWUiLCJ0ZXJtSUQiLCJhcHBWZXIiLCJvc3BmIiwibmV0VHlwZSIsImxvY2FsZSIsImpRdWVyeSIsInBhcmFtIiwibG9naW5fcGF5bG9hZCIsImNvbW1hbmQiLCJwYXlsb2FkIiwiYXBwU2VydmVyVXJsIiwiaW5mbHV4Q29ubmVjdGlvbiIsInNlcmllcyIsIm5vRGF0YSIsImhlaWdodCIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIngiLCJkIiwieSIsImQzIiwiY2F0ZWdvcnkxMCIsImR1cmF0aW9uIiwidXNlSW50ZXJhY3RpdmVHdWlkZWxpbmUiLCJjbGlwVm9yb25vaSIsInhBeGlzIiwiYXhpc0xhYmVsIiwidGlja0Zvcm1hdCIsInRpbWUiLCJvcmllbnQiLCJ0aWNrUGFkZGluZyIsImF4aXNMYWJlbERpc3RhbmNlIiwic3RhZ2dlckxhYmVscyIsImZvcmNlWSIsInlBeGlzIiwic2hvd01heE1pbiIsInRvRml4ZWQiLCJvcCIsImZwIiwicG93Iiwic3Vic3RyaW5nIiwiRl9SX05BTUUiLCJGX1JfU1RZTEUiLCJGX1NfQ0FURUdPUlkiLCJGX1JfREFURSIsIkZfUl9CUkVXRVIiLCJGX1NfTUFYX09HIiwiRl9TX01JTl9PRyIsIkZfU19NQVhfRkciLCJGX1NfTUlOX0ZHIiwiRl9TX01BWF9BQlYiLCJGX1NfTUlOX0FCViIsIkZfU19NQVhfSUJVIiwiRl9TX01JTl9JQlUiLCJJbmdyZWRpZW50cyIsIkdyYWluIiwiRl9HX05BTUUiLCJGX0dfQk9JTF9USU1FIiwiRl9HX0FNT1VOVCIsIkhvcHMiLCJGX0hfTkFNRSIsIkZfSF9EUllfSE9QX1RJTUUiLCJGX0hfQk9JTF9USU1FIiwiRl9IX0FNT1VOVCIsIk1pc2MiLCJGX01fTkFNRSIsIkZfTV9USU1FIiwiRl9NX0FNT1VOVCIsIlllYXN0IiwiRl9ZX0xBQiIsIkZfWV9QUk9EVUNUX0lEIiwiRl9ZX05BTUUiLCJtYXNoX3RpbWUiLCJOQU1FIiwiU1RZTEUiLCJDQVRFR09SWSIsIkJSRVdFUiIsIk9HIiwiRkciLCJJQlUiLCJBQlZfTUFYIiwiQUJWX01JTiIsIk1BU0giLCJNQVNIX1NURVBTIiwiTUFTSF9TVEVQIiwiU1RFUF9USU1FIiwiRkVSTUVOVEFCTEVTIiwiRkVSTUVOVEFCTEUiLCJBTU9VTlQiLCJIT1BTIiwiSE9QIiwiRk9STSIsIlVTRSIsIlRJTUUiLCJNSVNDUyIsIk1JU0MiLCJZRUFTVFMiLCJZRUFTVCIsImNvbnRlbnQiLCJodG1sY2hhcnMiLCJmIiwiciIsImNoYXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLGtCQUFRQSxNQUFSLENBQWUsbUJBQWYsRUFBb0MsQ0FDbEMsV0FEa0MsRUFFakMsTUFGaUMsRUFHakMsU0FIaUMsRUFJakMsVUFKaUMsRUFLakMsU0FMaUMsRUFNakMsVUFOaUMsQ0FBcEMsRUFRQ0MsTUFSRCxD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LEVBQWVDLEdBQUcsR0FBbEIsRUExZmMsRUEyZmQsRUFBQ0QsR0FBRyxTQUFKLEVBQWVDLEdBQUcsR0FBbEIsRUEzZmMsQ0FBaEI7O0FBOGZBNWQsUUFBRWtELElBQUYsQ0FBT3dhLFNBQVAsRUFBa0IsVUFBU0csSUFBVCxFQUFlO0FBQy9CLFlBQUdKLFFBQVE3ZCxPQUFSLENBQWdCaWUsS0FBS0YsQ0FBckIsTUFBNEIsQ0FBQyxDQUFoQyxFQUFrQztBQUNoQ0Ysb0JBQVVBLFFBQVE5ZCxPQUFSLENBQWdCc1YsT0FBTzRJLEtBQUtGLENBQVosRUFBYyxHQUFkLENBQWhCLEVBQW9DRSxLQUFLRCxDQUF6QyxDQUFWO0FBQ0Q7QUFDRixPQUpEO0FBS0EsYUFBT0gsT0FBUDtBQUNEO0FBaDVDSSxHQUFQO0FBazVDRCxDQXI1Q0QsRSIsImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICdib290c3RyYXAnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYnJld2JlbmNoLW1vbml0b3InLCBbXG4gICd1aS5yb3V0ZXInXG4gICwnbnZkMydcbiAgLCduZ1RvdWNoJ1xuICAsJ2R1U2Nyb2xsJ1xuICAsJ3VpLmtub2InXG4gICwncnpNb2R1bGUnXG5dKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XG4gICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb24gPSAnQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uJztcbiAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCcnKTtcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHM/fGZ0cHxtYWlsdG98dGVsfGZpbGV8YmxvYnxjaHJvbWUtZXh0ZW5zaW9ufGRhdGF8bG9jYWwpOi8pO1xuXG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbW9uaXRvci5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdtYWluQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgnc2hhcmUnLCB7XG4gICAgICB1cmw6ICcvc2gvOmZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tb25pdG9yLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ21haW5DdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdyZXNldCcsIHtcbiAgICAgIHVybDogJy9yZXNldCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21vbml0b3IuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnbWFpbkN0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ290aGVyd2lzZScsIHtcbiAgICAgdXJsOiAnKnBhdGgnLFxuICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25vdC1mb3VuZC5odG1sJ1xuICAgfSk7XG5cbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2FwcC5qcyIsImFuZ3VsYXIubW9kdWxlKCdicmV3YmVuY2gtbW9uaXRvcicpXG4uY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGZpbHRlciwgJHRpbWVvdXQsICRpbnRlcnZhbCwgJHEsICRodHRwLCAkc2NlLCBCcmV3U2VydmljZSl7XG5cbiRzY29wZS5jbGVhclNldHRpbmdzID0gZnVuY3Rpb24oZSl7XG4gIGlmKGUpe1xuICAgIGFuZ3VsYXIuZWxlbWVudChlLnRhcmdldCkuaHRtbCgnUmVtb3ZpbmcuLi4nKTtcbiAgfVxuICBCcmV3U2VydmljZS5jbGVhcigpO1xuICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScvJztcbiAgfSwxMDAwKTtcbn07XG5cbmlmKCAkc3RhdGUuY3VycmVudC5uYW1lID09ICdyZXNldCcpXG4gICRzY29wZS5jbGVhclNldHRpbmdzKCk7XG5cbnZhciBub3RpZmljYXRpb24gPSBudWxsXG4gICxyZXNldENoYXJ0ID0gMTAwXG4gICx0aW1lb3V0ID0gbnVsbDsvL3Jlc2V0IGNoYXJ0IGFmdGVyIDEwMCBwb2xsc1xuXG4kc2NvcGUuaG9wcztcbiRzY29wZS5ncmFpbnM7XG4kc2NvcGUud2F0ZXI7XG4kc2NvcGUubG92aWJvbmQ7XG4kc2NvcGUucGtnO1xuJHNjb3BlLmtldHRsZVR5cGVzID0gQnJld1NlcnZpY2Uua2V0dGxlVHlwZXMoKTtcbiRzY29wZS5jaGFydE9wdGlvbnMgPSBCcmV3U2VydmljZS5jaGFydE9wdGlvbnMoKTtcbiRzY29wZS5zZW5zb3JUeXBlcyA9IEJyZXdTZXJ2aWNlLnNlbnNvclR5cGVzO1xuJHNjb3BlLnNob3dTZXR0aW5ncyA9IHRydWU7XG4kc2NvcGUuZXJyb3IgPSB7bWVzc2FnZTogJycsIHR5cGU6ICdkYW5nZXInfTtcbiRzY29wZS5zbGlkZXIgPSB7XG4gIG1pbjogMCxcbiAgb3B0aW9uczoge1xuICAgIGZsb29yOiAwLFxuICAgIGNlaWw6IDEwMCxcbiAgICBzdGVwOiA1LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbHVlfSVgO1xuICAgIH0sXG4gICAgb25FbmQ6IGZ1bmN0aW9uKGtldHRsZUlkLCBtb2RlbFZhbHVlLCBoaWdoVmFsdWUsIHBvaW50ZXJUeXBlKXtcbiAgICAgIHZhciBrZXR0bGUgPSBrZXR0bGVJZC5zcGxpdCgnXycpO1xuICAgICAgdmFyIGs7XG5cbiAgICAgIHN3aXRjaCAoa2V0dGxlWzBdKSB7XG4gICAgICAgIGNhc2UgJ2hlYXQnOlxuICAgICAgICAgIGsgPSAkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLmhlYXRlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29vbCc6XG4gICAgICAgICAgayA9ICRzY29wZS5rZXR0bGVzW2tldHRsZVsxXV0uY29vbGVyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgICBrID0gJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5wdW1wO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZighaylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNba2V0dGxlWzFdXS5hY3RpdmUgJiYgay5wd20gJiYgay5ydW5uaW5nKXtcbiAgICAgICAgcmV0dXJuICRzY29wZS50b2dnbGVSZWxheSgkc2NvcGUua2V0dGxlc1trZXR0bGVbMV1dLCBrLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbiRzY29wZS5nZXRLZXR0bGVTbGlkZXJPcHRpb25zID0gZnVuY3Rpb24odHlwZSwgaW5kZXgpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbigkc2NvcGUuc2xpZGVyLm9wdGlvbnMsIHtpZDogYCR7dHlwZX1fJHtpbmRleH1gfSk7XG59XG5cbiRzY29wZS5nZXRMb3ZpYm9uZENvbG9yID0gZnVuY3Rpb24ocmFuZ2Upe1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoL8KwL2csJycpLnJlcGxhY2UoLyAvZywnJyk7XG4gIGlmKHJhbmdlLmluZGV4T2YoJy0nKSE9PS0xKXtcbiAgICB2YXIgckFycj1yYW5nZS5zcGxpdCgnLScpO1xuICAgIHJhbmdlID0gKHBhcnNlRmxvYXQockFyclswXSkrcGFyc2VGbG9hdChyQXJyWzFdKSkvMjtcbiAgfSBlbHNlIHtcbiAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpO1xuICB9XG4gIGlmKCFyYW5nZSlcbiAgICByZXR1cm4gJyc7XG4gIHZhciBsID0gXy5maWx0ZXIoJHNjb3BlLmxvdmlib25kLCBmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gKGl0ZW0uc3JtIDw9IHJhbmdlKSA/IGl0ZW0uaGV4IDogJyc7XG4gIH0pO1xuICBpZighIWwubGVuZ3RoKVxuICAgIHJldHVybiBsW2wubGVuZ3RoLTFdLmhleDtcbiAgcmV0dXJuICcnO1xufTtcblxuLy9kZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuJHNjb3BlLnNldHRpbmdzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NldHRpbmdzJykgfHwgQnJld1NlcnZpY2UucmVzZXQoKTtcbiRzY29wZS5rZXR0bGVzID0gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ2tldHRsZXMnKSB8fCBCcmV3U2VydmljZS5kZWZhdWx0S2V0dGxlcygpO1xuJHNjb3BlLnNoYXJlID0gKCEkc3RhdGUucGFyYW1zLmZpbGUgJiYgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykpID8gQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJykgOiB7XG4gICAgICBmaWxlOiAkc3RhdGUucGFyYW1zLmZpbGUgfHwgbnVsbFxuICAgICAgLCBwYXNzd29yZDogbnVsbFxuICAgICAgLCBuZWVkUGFzc3dvcmQ6IGZhbHNlXG4gICAgICAsIGFjY2VzczogJ3JlYWRPbmx5J1xuICAgICAgLCBkZWxldGVBZnRlcjogMTRcbiAgfTtcblxuJHNjb3BlLnN1bVZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBfLnN1bShfLnZhbHVlcyhvYmopKTtcbn1cblxuLy8gaW5pdCBjYWxjIHZhbHVlc1xuJHNjb3BlLnVwZGF0ZUFCViA9IGZ1bmN0aW9uKCl7XG4gIGlmKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgIGVsc2VcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2ID0gQnJld1NlcnZpY2UuYWJ2YSgkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nLCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3ID0gQnJld1NlcnZpY2UuYWJ3KCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ2LCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYXR0ZW51YXRpb24gPSBCcmV3U2VydmljZS5hdHRlbnVhdGlvbihCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5wbGF0bygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyksQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZykpXG4gICAgICAsJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gIH0gZWxzZSB7XG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5tZXRob2Q9PSdwYXBhemlhbicpXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IEJyZXdTZXJ2aWNlLmFidihCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nKSxCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgZWxzZVxuICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hYnYgPSBCcmV3U2VydmljZS5hYnZhKEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidyA9IEJyZXdTZXJ2aWNlLmFidygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidixCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKSk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5hdHRlbnVhdGlvbiA9IEJyZXdTZXJ2aWNlLmF0dGVudWF0aW9uKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2csJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5jYWxvcmllcyA9IEJyZXdTZXJ2aWNlLmNhbG9yaWVzKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYWJ3XG4gICAgICAsQnJld1NlcnZpY2UucmUoJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZywkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKVxuICAgICAgLEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpKTtcbiAgfVxufTtcblxuJHNjb3BlLmNoYW5nZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUubWV0aG9kID0gbWV0aG9kO1xuICAkc2NvcGUudXBkYXRlQUJWKCk7XG59O1xuXG4kc2NvcGUuY2hhbmdlU2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuc2NhbGUgPSBzY2FsZTtcbiAgaWYoc2NhbGU9PSdncmF2aXR5Jyl7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IEJyZXdTZXJ2aWNlLnNnKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUub2cpO1xuICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcgPSBCcmV3U2VydmljZS5zZygkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnKTtcbiAgfSBlbHNlIHtcbiAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm9nID0gQnJld1NlcnZpY2UucGxhdG8oJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyk7XG4gICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5mZyA9IEJyZXdTZXJ2aWNlLnBsYXRvKCRzY29wZS5zZXR0aW5ncy5yZWNpcGUuZmcpO1xuICB9XG59O1xuXG4kc2NvcGUudXBkYXRlQUJWKCk7XG5cbiAgJHNjb3BlLmdldFBvcnRSYW5nZSA9IGZ1bmN0aW9uKG51bWJlcil7XG4gICAgICBudW1iZXIrKztcbiAgICAgIHJldHVybiBBcnJheShudW1iZXIpLmZpbGwoKS5tYXAoKF8sIGlkeCkgPT4gMCArIGlkeCk7XG4gIH07XG5cbiAgJHNjb3BlLmFyZHVpbm9zID0ge1xuICAgIGFkZDogKCkgPT4ge1xuICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zKSAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3MgPSBbXTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5wdXNoKHtcbiAgICAgICAgaWQ6IGJ0b2Eobm93KycnKyRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGgrMSksXG4gICAgICAgIHVybDogJ2FyZHVpbm8ubG9jYWwnLFxuICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgIGRpZ2l0YWw6IDEzXG4gICAgICB9KTtcbiAgICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywga2V0dGxlID0+IHtcbiAgICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKVxuICAgICAgICAgIGtldHRsZS5hcmR1aW5vID0gJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zWzBdO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB1cGRhdGU6IChhcmR1aW5vKSA9PiB7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAga2V0dGxlLmFyZHVpbm8gPSBhcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IChpbmRleCwgYXJkdWlubykgPT4ge1xuICAgICAgJHNjb3BlLnNldHRpbmdzLmFyZHVpbm9zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIGtldHRsZSA9PiB7XG4gICAgICAgIGlmKGtldHRsZS5hcmR1aW5vICYmIGtldHRsZS5hcmR1aW5vLmlkID09IGFyZHVpbm8uaWQpXG4gICAgICAgICAgZGVsZXRlIGtldHRsZS5hcmR1aW5vO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50cGxpbmsgPSB7XG4gICAgbG9naW46ICgpID0+IHtcbiAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLmxvZ2luKCRzY29wZS5zZXR0aW5ncy50cGxpbmsudXNlciwkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBhc3MpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZihyZXNwb25zZS50b2tlbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnRva2VuID0gcmVzcG9uc2UudG9rZW47XG4gICAgICAgICAgICAkc2NvcGUudHBsaW5rLnNjYW4ocmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIubXNnIHx8IGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzID0gW107XG4gICAgICBCcmV3U2VydmljZS50cGxpbmsoKS5zY2FuKHRva2VuKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYocmVzcG9uc2UuZGV2aWNlTGlzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyA9IHJlc3BvbnNlLmRldmljZUxpc3Q7XG4gICAgICAgICAgLy8gZ2V0IGRldmljZSBpbmZvIGlmIG9ubGluZSAoaWUuIHN0YXR1cz09MSlcbiAgICAgICAgICBfLmVhY2goJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncywgcGx1ZyA9PiB7XG4gICAgICAgICAgICBpZighIXBsdWcuc3RhdHVzKXtcbiAgICAgICAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhwbHVnKS50aGVuKGluZm8gPT4ge1xuICAgICAgICAgICAgICAgIGlmKGluZm8gJiYgaW5mby5yZXNwb25zZURhdGEpe1xuICAgICAgICAgICAgICAgICAgbGV0IHN5c2luZm8gPSBKU09OLnBhcnNlKGluZm8ucmVzcG9uc2VEYXRhKS5zeXN0ZW0uZ2V0X3N5c2luZm87XG4gICAgICAgICAgICAgICAgICBwbHVnLmluZm8gPSBzeXNpbmZvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5mbzogKGRldmljZSkgPT4ge1xuICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkuaW5mbyhkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZTogKGRldmljZSkgPT4ge1xuICAgICAgaWYoZGV2aWNlLmluZm8ucmVsYXlfc3RhdGUgPT0gMSl7XG4gICAgICAgIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGRldmljZS5pbmZvLnJlbGF5X3N0YXRlID0gMDtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBkZXZpY2UuaW5mby5yZWxheV9zdGF0ZSA9IDE7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmFkZEtldHRsZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgIGlmKCEkc2NvcGUua2V0dGxlcykgJHNjb3BlLmtldHRsZXMgPSBbXTtcbiAgICAkc2NvcGUua2V0dGxlcy5wdXNoKHtcbiAgICAgICAga2V5OiB0eXBlID8gXy5maW5kKCRzY29wZS5rZXR0bGVUeXBlcyx7dHlwZTogdHlwZX0pLm5hbWUgOiAkc2NvcGUua2V0dGxlVHlwZXNbMF0ubmFtZVxuICAgICAgICAsdHlwZTogdHlwZSB8fCAkc2NvcGUua2V0dGxlVHlwZXNbMF0udHlwZVxuICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAsaGVhdGVyOiB7cGluOidENicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAsdGVtcDoge3BpbjonQTAnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6JHNjb3BlLmtldHRsZVR5cGVzWzBdLnRhcmdldCxkaWZmOiRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfVxuICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAsdGltZXJzOiBbXVxuICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDokc2NvcGUua2V0dGxlVHlwZXNbMF0udGFyZ2V0KyRzY29wZS5rZXR0bGVUeXBlc1swXS5kaWZmfSlcbiAgICAgICAgLGFyZHVpbm86ICRzY29wZS5zZXR0aW5ncy5hcmR1aW5vcy5sZW5ndGggPyAkc2NvcGUuc2V0dGluZ3MuYXJkdWlub3NbMF0gOiBudWxsXG4gICAgICAgICxlcnJvcjoge21lc3NhZ2U6JycsdmVyc2lvbjonJ31cbiAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5oYXNTdGlja3lLZXR0bGVzID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3N0aWNreSc6IHRydWV9KS5sZW5ndGg7XG4gIH07XG5cbiAgJHNjb3BlLmtldHRsZUNvdW50ID0gZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKCRzY29wZS5rZXR0bGVzLCB7J3R5cGUnOiB0eXBlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5hY3RpdmVLZXR0bGVzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMseydhY3RpdmUnOiB0cnVlfSkubGVuZ3RoO1xuICB9O1xuXG4gICRzY29wZS5waW5EaXNwbGF5ID0gZnVuY3Rpb24ocGluKXtcbiAgICAgIGlmKCBwaW4uaW5kZXhPZignVFAtJyk9PT0wICl7XG4gICAgICAgIGxldCBkZXZpY2UgPSBfLmZpbHRlcigkc2NvcGUuc2V0dGluZ3MudHBsaW5rLnBsdWdzLHtkZXZpY2VJZDogcGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gZGV2aWNlID8gZGV2aWNlLmFsaWFzIDogJyc7XG4gICAgICB9IGVsc2VcbiAgICAgICAgcmV0dXJuIHBpbjtcbiAgfTtcblxuICAkc2NvcGUucGluSW5Vc2UgPSBmdW5jdGlvbihwaW4sYW5hbG9nKXtcbiAgICB2YXIga2V0dGxlID0gXy5maW5kKCRzY29wZS5rZXR0bGVzLCBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgKGFuYWxvZyAmJiBrZXR0bGUudGVtcC50eXBlPT0nVGhlcm1pc3RvcicgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS50ZW1wLnR5cGU9PSdEUzE4QjIwJyAmJiBrZXR0bGUudGVtcC5waW49PXBpbikgfHxcbiAgICAgICAgKGtldHRsZS50ZW1wLnR5cGU9PSdQVDEwMCcgJiYga2V0dGxlLnRlbXAucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS5oZWF0ZXIucGluPT1waW4pIHx8XG4gICAgICAgICghYW5hbG9nICYmIGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5waW49PXBpbikgfHxcbiAgICAgICAgKCFhbmFsb2cgJiYgIWtldHRsZS5jb29sZXIgJiYga2V0dGxlLnB1bXAucGluPT1waW4pXG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiBrZXR0bGUgfHwgZmFsc2U7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZVNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIubmFtZSB8fCAhJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5icmV3ZXIuZW1haWwpXG4gICAgICByZXR1cm47XG4gICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9ICdDcmVhdGluZyBzaGFyZSBsaW5rLi4uJztcbiAgICByZXR1cm4gQnJld1NlcnZpY2UuY3JlYXRlU2hhcmUoJHNjb3BlLnNoYXJlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYocmVzcG9uc2Uuc2hhcmUgJiYgcmVzcG9uc2Uuc2hhcmUudXJsKXtcbiAgICAgICAgICAkc2NvcGUuc2hhcmVfc3RhdHVzID0gJyc7XG4gICAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5zaGFyZV9saW5rID0gcmVzcG9uc2Uuc2hhcmUudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5zaGFyZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N0YXR1cyA9IGVycjtcbiAgICAgICAgJHNjb3BlLnNoYXJlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaGFyZVRlc3QgPSBmdW5jdGlvbihhcmR1aW5vKXtcbiAgICBhcmR1aW5vLnRlc3RpbmcgPSB0cnVlO1xuICAgIEJyZXdTZXJ2aWNlLnNoYXJlVGVzdChhcmR1aW5vKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2UuaHR0cF9jb2RlID09IDIwMClcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IHRydWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcmR1aW5vLnB1YmxpYyA9IGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBhcmR1aW5vLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgYXJkdWluby5wdWJsaWMgPSBmYWxzZTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS50ZXN0SW5mbHV4REIgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi50ZXN0aW5nID0gdHJ1ZTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgQnJld1NlcnZpY2UuaW5mbHV4ZGIoKS5waW5nKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYocmVzcG9uc2Uuc3RhdHVzID09IDIwNCl7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAvL2dldCBsaXN0IG9mIGRhdGFiYXNlc1xuICAgICAgICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuZGJzKClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgaWYocmVzcG9uc2UubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBsZXQgZGJzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRicyA9IF8ucmVtb3ZlKGRicywgKGRiKSA9PiBkYiAhPSBcIl9pbnRlcm5hbFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJCgnI2luZmx1eGRiVXJsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnRlc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmNyZWF0ZUluZmx1eERCID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgZGIgPSAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuZGIgfHwgJ3Nlc3Npb24tJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIuY3JlYXRlZCA9IGZhbHNlO1xuICAgIEJyZXdTZXJ2aWNlLmluZmx1eGRiKCkuY3JlYXRlREIoZGIpXG4gICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIC8vIHByb21wdCBmb3IgcGFzc3dvcmRcbiAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3VsdHMgJiYgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmRiID0gZGI7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLmNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlVzZXInKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICQoJyNpbmZsdXhkYlBhc3MnKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpO1xuICAgICAgICAgICRzY29wZS5yZXNldEVycm9yKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIk9wcHMsIHRoZXJlIHdhcyBhIHByb2JsZW0gY3JlYXRpbmcgdGhlIGRhdGFiYXNlLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBpZihlcnIuc3RhdHVzID09IDQwMSB8fCBlcnIuc3RhdHVzID09IDQwMyl7XG4gICAgICAgICAgJCgnI2luZmx1eGRiVXNlcicpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJCgnI2luZmx1eGRiUGFzcycpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XG4gICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShcIkVudGVyIHlvdXIgVXNlcm5hbWUgYW5kIFBhc3N3b3JkIGZvciBJbmZsdXhEQlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBjcmVhdGluZyB0aGUgZGF0YWJhc2UuXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuc2hhcmVBY2Nlc3MgPSBmdW5jdGlvbihhY2Nlc3Mpe1xuICAgICAgaWYoJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAgIGlmKGFjY2Vzcyl7XG4gICAgICAgICAgaWYoYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5mcmFtZUVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gISEoJHNjb3BlLnNoYXJlLmFjY2VzcyAmJiAkc2NvcGUuc2hhcmUuYWNjZXNzID09PSBhY2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihhY2Nlc3MgJiYgYWNjZXNzID09ICdlbWJlZCcpe1xuICAgICAgICByZXR1cm4gISEod2luZG93LmZyYW1lRWxlbWVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUubG9hZFNoYXJlRmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgQnJld1NlcnZpY2UuY2xlYXIoKTtcbiAgICAkc2NvcGUuc2V0dGluZ3MgPSBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICRzY29wZS5zZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgIHJldHVybiBCcmV3U2VydmljZS5sb2FkU2hhcmVGaWxlKCRzY29wZS5zaGFyZS5maWxlLCAkc2NvcGUuc2hhcmUucGFzc3dvcmQgfHwgbnVsbClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGlmKGNvbnRlbnRzKXtcbiAgICAgICAgICBpZihjb250ZW50cy5uZWVkUGFzc3dvcmQpe1xuICAgICAgICAgICAgJHNjb3BlLnNoYXJlLm5lZWRQYXNzd29yZCA9IHRydWU7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zZXR0aW5ncy5yZWNpcGUpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlID0gY29udGVudHMuc2V0dGluZ3MucmVjaXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuc2hhcmUubmVlZFBhc3N3b3JkID0gZmFsc2U7XG4gICAgICAgICAgICBpZihjb250ZW50cy5zaGFyZSAmJiBjb250ZW50cy5zaGFyZS5hY2Nlc3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2hhcmUuYWNjZXNzID0gY29udGVudHMuc2hhcmUuYWNjZXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMuc2V0dGluZ3Mpe1xuICAgICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBjb250ZW50cy5zZXR0aW5ncztcbiAgICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMgPSB7b246ZmFsc2UsdGltZXJzOnRydWUsaGlnaDp0cnVlLGxvdzp0cnVlLHRhcmdldDp0cnVlLHNsYWNrOicnLGxhc3Q6Jyd9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29udGVudHMua2V0dGxlcyl7XG4gICAgICAgICAgICAgIF8uZWFjaChjb250ZW50cy5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAgICAgICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMDArNSxzdWJUZXh0OntlbmFibGVkOiB0cnVlLHRleHQ6ICdzdGFydGluZy4uLicsY29sb3I6ICdncmF5Jyxmb250OiAnYXV0byd9fSk7XG4gICAgICAgICAgICAgICAga2V0dGxlLnZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHNjb3BlLmtldHRsZXMgPSBjb250ZW50cy5rZXR0bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9jZXNzVGVtcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKFwiT3BwcywgdGhlcmUgd2FzIGEgcHJvYmxlbSBsb2FkaW5nIHRoZSBzaGFyZWQgc2Vzc2lvbi5cIik7XG4gICAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuaW1wb3J0UmVjaXBlID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuXG4gICAgICAvLyBwYXJzZSB0aGUgaW1wb3J0ZWQgY29udGVudFxuICAgICAgdmFyIGZvcm1hdHRlZF9jb250ZW50ID0gQnJld1NlcnZpY2UuZm9ybWF0WE1MKCRmaWxlQ29udGVudCk7XG4gICAgICB2YXIganNvbk9iaiwgcmVjaXBlID0gbnVsbDtcblxuICAgICAgaWYoISFmb3JtYXR0ZWRfY29udGVudCl7XG4gICAgICAgIHZhciB4MmpzID0gbmV3IFgySlMoKTtcbiAgICAgICAganNvbk9iaiA9IHgyanMueG1sX3N0cjJqc29uKCBmb3JtYXR0ZWRfY29udGVudCApO1xuICAgICAgfVxuXG4gICAgICBpZighanNvbk9iailcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZigkZXh0PT0nYnNteCcpe1xuICAgICAgICBpZighIWpzb25PYmouUmVjaXBlcyAmJiAhIWpzb25PYmouUmVjaXBlcy5EYXRhLlJlY2lwZSlcbiAgICAgICAgICByZWNpcGUgPSBqc29uT2JqLlJlY2lwZXMuRGF0YS5SZWNpcGU7XG4gICAgICAgIGVsc2UgaWYoISFqc29uT2JqLlNlbGVjdGlvbnMgJiYgISFqc29uT2JqLlNlbGVjdGlvbnMuRGF0YS5SZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5TZWxlY3Rpb25zLkRhdGEuUmVjaXBlO1xuICAgICAgICBpZihyZWNpcGUpXG4gICAgICAgICAgcmVjaXBlID0gQnJld1NlcnZpY2UucmVjaXBlQmVlclNtaXRoKHJlY2lwZSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLnJlY2lwZV9zdWNjZXNzID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYoJGV4dD09J3htbCcpe1xuICAgICAgICBpZighIWpzb25PYmouUkVDSVBFUyAmJiAhIWpzb25PYmouUkVDSVBFUy5SRUNJUEUpXG4gICAgICAgICAgcmVjaXBlID0ganNvbk9iai5SRUNJUEVTLlJFQ0lQRTtcbiAgICAgICAgaWYocmVjaXBlKVxuICAgICAgICAgIHJlY2lwZSA9IEJyZXdTZXJ2aWNlLnJlY2lwZUJlZXJYTUwocmVjaXBlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYoIXJlY2lwZSlcbiAgICAgICAgcmV0dXJuICRzY29wZS5yZWNpcGVfc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICBpZighIXJlY2lwZS5vZylcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5vZyA9IHJlY2lwZS5vZztcbiAgICAgIGlmKCEhcmVjaXBlLmZnKVxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmZnID0gcmVjaXBlLmZnO1xuXG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUgPSByZWNpcGUubmFtZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuY2F0ZWdvcnkgPSByZWNpcGUuY2F0ZWdvcnk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmFidiA9IHJlY2lwZS5hYnY7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmlidSA9IHJlY2lwZS5pYnU7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmRhdGUgPSByZWNpcGUuZGF0ZTtcbiAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyID0gcmVjaXBlLmJyZXdlcjtcblxuICAgICAgaWYocmVjaXBlLmdyYWlucy5sZW5ndGgpe1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IHJlY2lwZS5ncmFpbnM7XG4gICAgICAgIGxldCBrZXR0bGUgPSBfLmZpbHRlcigkc2NvcGUua2V0dGxlcyx7dHlwZTonZ3JhaW4nfSlbMF07XG4gICAgICAgIGlmKGtldHRsZSkga2V0dGxlLnRpbWVycyA9IFtdO1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWlucyA9IHt9O1xuICAgICAgICBfLmVhY2gocmVjaXBlLmdyYWlucyxmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICAgICRzY29wZS5hZGRUaW1lcihrZXR0bGUse1xuICAgICAgICAgICAgICBsYWJlbDogZ3JhaW4ubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogZ3JhaW4ubWluLFxuICAgICAgICAgICAgICBub3RlczogZ3JhaW4ubm90ZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdW0gdGhlIGFtb3VudHMgZm9yIHRoZSBncmFpbnNcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWluc1tncmFpbi5sYWJlbF0pXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmdyYWluc1tncmFpbi5sYWJlbF0gKz0gTnVtYmVyKGdyYWluLmFtb3VudCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5ncmFpbnNbZ3JhaW4ubGFiZWxdID0gTnVtYmVyKGdyYWluLmFtb3VudCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZihyZWNpcGUuaG9wcy5sZW5ndGgpe1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J2hvcCd9KVswXTtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUudGltZXJzID0gW107XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wcyA9IFtdO1xuICAgICAgICBfLmVhY2gocmVjaXBlLmhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgICAgJHNjb3BlLmFkZFRpbWVyKGtldHRsZSx7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogaG9wLm1pbixcbiAgICAgICAgICAgICAgbm90ZXM6IGhvcC5ub3Rlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN1bSB0aGUgYW1vdW50cyBmb3IgdGhlIGhvcHNcbiAgICAgICAgICBpZigkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSlcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUuaG9wc1tob3AubGFiZWxdICs9IE51bWJlcihob3AuYW1vdW50KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MucmVjaXBlLmhvcHNbaG9wLmxhYmVsXSA9IE51bWJlcihob3AuYW1vdW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZihyZWNpcGUubWlzYy5sZW5ndGgpe1xuICAgICAgICBsZXQga2V0dGxlID0gXy5maWx0ZXIoJHNjb3BlLmtldHRsZXMse3R5cGU6J3dhdGVyJ30pWzBdO1xuICAgICAgICBpZihrZXR0bGUpe1xuICAgICAgICAgIGtldHRsZS50aW1lcnMgPSBbXTtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLm1pc2MsZnVuY3Rpb24obWlzYyl7XG4gICAgICAgICAgICAkc2NvcGUuYWRkVGltZXIoa2V0dGxlLHtcbiAgICAgICAgICAgICAgbGFiZWw6IG1pc2MubGFiZWwsXG4gICAgICAgICAgICAgIG1pbjogbWlzYy5taW4sXG4gICAgICAgICAgICAgIG5vdGVzOiBtaXNjLm5vdGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVjaXBlLnllYXN0Lmxlbmd0aCl7XG4gICAgICAgICRzY29wZS5zZXR0aW5ncy5yZWNpcGUueWVhc3QgPSBbXTtcbiAgICAgICAgXy5lYWNoKHJlY2lwZS55ZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgJHNjb3BlLnNldHRpbmdzLnJlY2lwZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHllYXN0Lm5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkc2NvcGUucmVjaXBlX3N1Y2Nlc3MgPSB0cnVlO1xuICB9O1xuXG4gICRzY29wZS5sb2FkU3R5bGVzID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnN0eWxlcyl7XG4gICAgICBCcmV3U2VydmljZS5zdHlsZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgJHNjb3BlLnN0eWxlcyA9IHJlc3BvbnNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5sb2FkQ29uZmlnID0gZnVuY3Rpb24oKXtcbiAgICBsZXQgY29uZmlnID0gW107XG4gICAgaWYoISRzY29wZS5wa2cpe1xuICAgICAgY29uZmlnLnB1c2goQnJld1NlcnZpY2UucGtnKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgJHNjb3BlLnBrZyA9IHJlc3BvbnNlO1xuICAgICAgICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbiA9IHJlc3BvbnNlLnNrZXRjaF92ZXJzaW9uO1xuICAgICAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbil7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3MuYmJfdmVyc2lvbiA9IHJlc3BvbnNlLnZlcnNpb247XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLmdyYWlucyl7XG4gICAgICBjb25maWcucHVzaChCcmV3U2VydmljZS5ncmFpbnMoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICByZXR1cm4gJHNjb3BlLmdyYWlucyA9IF8uc29ydEJ5KF8udW5pcUJ5KHJlc3BvbnNlLCduYW1lJyksJ25hbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYoISRzY29wZS5ob3BzKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS5ob3BzKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5ob3BzID0gXy5zb3J0QnkoXy51bmlxQnkocmVzcG9uc2UsJ25hbWUnKSwnbmFtZScpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZighJHNjb3BlLndhdGVyKXtcbiAgICAgIGNvbmZpZy5wdXNoKFxuICAgICAgICBCcmV3U2VydmljZS53YXRlcigpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc2NvcGUud2F0ZXIgPSBfLnNvcnRCeShfLnVuaXFCeShyZXNwb25zZSwnc2FsdCcpLCdzYWx0Jyk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmKCEkc2NvcGUubG92aWJvbmQpe1xuICAgICAgY29uZmlnLnB1c2goXG4gICAgICAgIEJyZXdTZXJ2aWNlLmxvdmlib25kKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzY29wZS5sb3ZpYm9uZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHEuYWxsKGNvbmZpZyk7XG59O1xuXG4gIC8vIGNoZWNrIGlmIHB1bXAgb3IgaGVhdGVyIGFyZSBydW5uaW5nXG4gICRzY29wZS5pbml0ID0gKCkgPT4ge1xuICAgICRzY29wZS5zaG93U2V0dGluZ3MgPSAhJHNjb3BlLnNldHRpbmdzLnNoYXJlZDtcbiAgICBpZigkc2NvcGUuc2hhcmUuZmlsZSlcbiAgICAgIHJldHVybiAkc2NvcGUubG9hZFNoYXJlRmlsZSgpO1xuXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXBbJ3RhcmdldCddK2tldHRsZS50ZW1wWydkaWZmJ10rMTA7XG4gICAgICAgIC8vIGNoZWNrIHRpbWVycyBmb3IgcnVubmluZ1xuICAgICAgICBpZighIWtldHRsZS50aW1lcnMgJiYga2V0dGxlLnRpbWVycy5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChrZXR0bGUudGltZXJzLCB0aW1lciA9PiB7XG4gICAgICAgICAgICBpZih0aW1lci5ydW5uaW5nKXtcbiAgICAgICAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAkc2NvcGUudGltZXJTdGFydCh0aW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKCF0aW1lci5ydW5uaW5nICYmIHRpbWVyLnF1ZXVlKXtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLGtldHRsZSk7XG4gICAgICAgICAgICAgIH0sNjAwMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHRpbWVyLnVwICYmIHRpbWVyLnVwLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICB0aW1lci51cC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KHRpbWVyLnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyLCBrZXR0bGUpe1xuICAgIGlmKCEhJHNjb3BlLnNldHRpbmdzLnNoYXJlZCl7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICd3YXJuaW5nJztcbiAgICAgICRzY29wZS5lcnJvci5tZXNzYWdlID0gJHNjZS50cnVzdEFzSHRtbCgnVGhlIG1vbml0b3Igc2VlbXMgdG8gYmUgb2ZmLWxpbmUsIHJlLWNvbm5lY3RpbmcuLi4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG1lc3NhZ2U7XG5cbiAgICAgIGlmKHR5cGVvZiBlcnIgPT0gJ3N0cmluZycgJiYgZXJyLmluZGV4T2YoJ3snKSAhPT0gLTEpe1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgZXJyID0gSlNPTi5wYXJzZShlcnIpO1xuICAgICAgICBpZighT2JqZWN0LmtleXMoZXJyKS5sZW5ndGgpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZW9mIGVyciA9PSAnc3RyaW5nJylcbiAgICAgICAgbWVzc2FnZSA9IGVycjtcbiAgICAgIGVsc2UgaWYoISFlcnIuc3RhdHVzVGV4dClcbiAgICAgICAgbWVzc2FnZSA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZWxzZSBpZihlcnIuY29uZmlnICYmIGVyci5jb25maWcudXJsKVxuICAgICAgICBtZXNzYWdlID0gZXJyLmNvbmZpZy51cmw7XG4gICAgICBlbHNlIGlmKGVyci52ZXJzaW9uKXtcbiAgICAgICAgaWYoa2V0dGxlKSBrZXR0bGUuZXJyb3IudmVyc2lvbiA9IGVyci52ZXJzaW9uO1xuICAgICAgICBtZXNzYWdlID0gJ1NrZXRjaCBWZXJzaW9uIGlzIG91dCBvZiBkYXRlLiAgPGEgaHJlZj1cIlwiIGRhdGEtdG9nZ2xlPVwibW9kYWxcIiBkYXRhLXRhcmdldD1cIiNzZXR0aW5nc01vZGFsXCI+RG93bmxvYWQgaGVyZTwvYT4uJytcbiAgICAgICAgICAnPGJyLz5Zb3VyIFZlcnNpb246ICcrZXJyLnZlcnNpb24rXG4gICAgICAgICAgJzxici8+Q3VycmVudCBWZXJzaW9uOiAnKyRzY29wZS5zZXR0aW5ncy5za2V0Y2hfdmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xuICAgICAgICBpZihtZXNzYWdlID09ICd7fScpIG1lc3NhZ2UgPSAnJztcbiAgICAgIH1cblxuICAgICAgaWYoISFtZXNzYWdlKXtcbiAgICAgICAgaWYoa2V0dGxlKXtcbiAgICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYENvbm5lY3Rpb24gZXJyb3I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoYEVycm9yOiAke21lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihrZXR0bGUpe1xuICAgICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9IGBFcnJvciBjb25uZWN0aW5nIHRvICR7QnJld1NlcnZpY2UuZG9tYWluKGtldHRsZS5hcmR1aW5vKX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCdDb25uZWN0aW9uIGVycm9yOicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVzZXRFcnJvciA9IGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgaWYoa2V0dGxlKSB7XG4gICAgICBrZXR0bGUuZXJyb3IubWVzc2FnZSA9ICRzY2UudHJ1c3RBc0h0bWwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkc2NvcGUuZXJyb3IudHlwZSA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLmVycm9yLm1lc3NhZ2UgPSAkc2NlLnRydXN0QXNIdG1sKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZVRlbXAgPSBmdW5jdGlvbihyZXNwb25zZSwga2V0dGxlKXtcbiAgICBpZighcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnRlbXApe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldEVycm9yKGtldHRsZSk7XG5cbiAgICB2YXIgdGVtcHMgPSBbXTtcbiAgICAvL2NoYXJ0IGRhdGVcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgLy8gdGVtcCByZXNwb25zZSBpcyBpbiBDXG4gICAga2V0dGxlLnRlbXAucHJldmlvdXMgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQgPT0gJ0YnKSA/XG4gICAgICAkZmlsdGVyKCd0b0ZhaHJlbmhlaXQnKShyZXNwb25zZS50ZW1wKSA6XG4gICAgICBNYXRoLnJvdW5kKHJlc3BvbnNlLnRlbXApO1xuICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSBrZXR0bGUudGVtcC5wcmV2aW91cytrZXR0bGUudGVtcC5hZGp1c3Q7XG5cbiAgICAvL3Jlc2V0IGFsbCBrZXR0bGVzIGV2ZXJ5IHJlc2V0Q2hhcnRcbiAgICBpZihrZXR0bGUudmFsdWVzLmxlbmd0aCA+IHJlc2V0Q2hhcnQpe1xuICAgICAgJHNjb3BlLmtldHRsZXMubWFwKChrKSA9PiB7XG4gICAgICAgIHJldHVybiBrLnZhbHVlcz1bXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vREhUMTEgc2Vuc29yIGhhcyBodW1pZGl0eVxuICAgIGlmKCByZXNwb25zZS5odW1pZGl0eSApe1xuICAgICAga2V0dGxlLmh1bWlkaXR5ID0gcmVzcG9uc2UuaHVtaWRpdHk7XG4gICAgfVxuXG4gICAga2V0dGxlLnZhbHVlcy5wdXNoKFtkYXRlLmdldFRpbWUoKSxrZXR0bGUudGVtcC5jdXJyZW50XSk7XG5cbiAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcblxuICAgIC8vaXMgdGVtcCB0b28gaGlnaD9cbiAgICBpZihrZXR0bGUudGVtcC5jdXJyZW50ID4ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgLy9zdG9wIHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0YXJ0IHRoZSBjaGlsbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiAha2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCB0cnVlKS50aGVuKGNvb2xlciA9PiB7XG4gICAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC50ZXh0ID0gJ2Nvb2xpbmcnO1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAncmdiYSg1MiwxNTIsMjE5LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gLy9pcyB0ZW1wIHRvbyBsb3c/XG4gICAgZWxzZSBpZihrZXR0bGUudGVtcC5jdXJyZW50IDwga2V0dGxlLnRlbXAudGFyZ2V0LWtldHRsZS50ZW1wLmRpZmYpe1xuICAgICAgJHNjb3BlLmFsZXJ0KGtldHRsZSk7XG4gICAgICAvL3N0YXJ0IHRoZSBoZWF0aW5nIGVsZW1lbnRcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiAha2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCB0cnVlKS50aGVuKGhlYXRpbmcgPT4ge1xuICAgICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoMjAwLDQ3LDQ3LDEpJztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgLy9zdGFydCB0aGUgcHVtcFxuICAgICAgaWYoa2V0dGxlLnB1bXAgJiYga2V0dGxlLnB1bXAuYXV0byAmJiAha2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIHRydWUpKTtcbiAgICAgIH1cbiAgICAgIC8vc3RvcCB0aGUgY29vbGVyXG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuYXV0byAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdpdGhpbiB0YXJnZXQhXG4gICAgICBrZXR0bGUudGVtcC5oaXQ9bmV3IERhdGUoKTsvL3NldCB0aGUgdGltZSB0aGUgdGFyZ2V0IHdhcyBoaXQgc28gd2UgY2FuIG5vdyBzdGFydCBhbGVydHNcbiAgICAgICRzY29wZS5hbGVydChrZXR0bGUpO1xuICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIuYXV0byAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICB0ZW1wcy5wdXNoKCRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIHB1bXBcbiAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLmF1dG8gJiYga2V0dGxlLnB1bXAucnVubmluZyl7XG4gICAgICAgIHRlbXBzLnB1c2goJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLnB1bXAsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICAvL3N0b3AgdGhlIGNvb2xlclxuICAgICAgaWYoa2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLmF1dG8gJiYga2V0dGxlLmNvb2xlci5ydW5uaW5nKXtcbiAgICAgICAgdGVtcHMucHVzaCgkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuY29vbGVyLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHEuYWxsKHRlbXBzKTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TmF2T2Zmc2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gMTI1K2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2YmFyJykpWzBdLm9mZnNldEhlaWdodDtcbiAgfTtcblxuICAkc2NvcGUuYWRkVGltZXIgPSBmdW5jdGlvbihrZXR0bGUsb3B0aW9ucyl7XG4gICAgaWYoIWtldHRsZS50aW1lcnMpXG4gICAgICBrZXR0bGUudGltZXJzPVtdO1xuICAgIGlmKG9wdGlvbnMpe1xuICAgICAgb3B0aW9ucy5taW4gPSBvcHRpb25zLm1pbiA/IG9wdGlvbnMubWluIDogMDtcbiAgICAgIG9wdGlvbnMuc2VjID0gb3B0aW9ucy5zZWMgPyBvcHRpb25zLnNlYyA6IDA7XG4gICAgICBvcHRpb25zLnJ1bm5pbmcgPSBvcHRpb25zLnJ1bm5pbmcgPyBvcHRpb25zLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgIG9wdGlvbnMucXVldWUgPSBvcHRpb25zLnF1ZXVlID8gb3B0aW9ucy5xdWV1ZSA6IGZhbHNlO1xuICAgICAga2V0dGxlLnRpbWVycy5wdXNoKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXR0bGUudGltZXJzLnB1c2goe2xhYmVsOidFZGl0IGxhYmVsJyxtaW46NjAsc2VjOjAscnVubmluZzpmYWxzZSxxdWV1ZTpmYWxzZX0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlVGltZXJzID0gZnVuY3Rpb24oZSxrZXR0bGUpe1xuICAgIHZhciBidG4gPSBhbmd1bGFyLmVsZW1lbnQoZS50YXJnZXQpO1xuICAgIGlmKGJ0bi5oYXNDbGFzcygnZmEtdHJhc2gnKSkgYnRuID0gYnRuLnBhcmVudCgpO1xuXG4gICAgaWYoIWJ0bi5oYXNDbGFzcygnYnRuLWRhbmdlcicpKXtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWxpZ2h0JykuYWRkQ2xhc3MoJ2J0bi1kYW5nZXInKTtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIH0sMjAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnYnRuLWRhbmdlcicpLmFkZENsYXNzKCdidG4tbGlnaHQnKTtcbiAgICAgIGtldHRsZS50aW1lcnM9W107XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVQV00gPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLnB3bSA9ICFrZXR0bGUucHdtO1xuICAgICAgaWYoa2V0dGxlLnB3bSlcbiAgICAgICAga2V0dGxlLnNzciA9IHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZUtldHRsZSA9IGZ1bmN0aW9uKGl0ZW0sIGtldHRsZSl7XG5cbiAgICB2YXIgaztcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgY2FzZSAnaGVhdCc6XG4gICAgICAgIGsgPSBrZXR0bGUuaGVhdGVyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nvb2wnOlxuICAgICAgICBrID0ga2V0dGxlLmNvb2xlcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwdW1wJzpcbiAgICAgICAgayA9IGtldHRsZS5wdW1wO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZighaylcbiAgICAgIHJldHVybjtcblxuICAgIGsucnVubmluZyA9ICFrLnJ1bm5pbmc7XG5cbiAgICBpZihrZXR0bGUuYWN0aXZlICYmIGsucnVubmluZyl7XG4gICAgICAvL3N0YXJ0IHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmKCFrLnJ1bm5pbmcpe1xuICAgICAgLy9zdG9wIHRoZSByZWxheVxuICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwgaywgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaGFzU2tldGNoZXMgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIGxldCBoYXNBU2tldGNoID0gZmFsc2U7XG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCBrZXR0bGUgPT4ge1xuICAgICAgaWYoKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpIHx8XG4gICAgICAgIChrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKSB8fFxuICAgICAgICBrZXR0bGUubm90aWZ5LnNsYWNrIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICkge1xuICAgICAgICBoYXNBU2tldGNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaGFzQVNrZXRjaDtcbiAgfTtcblxuICAkc2NvcGUua25vYkNsaWNrID0gZnVuY3Rpb24oa2V0dGxlKXtcbiAgICAgIC8vc2V0IGFkanVzdG1lbnQgYW1vdW50XG4gICAgICBpZighIWtldHRsZS50ZW1wLnByZXZpb3VzKXtcbiAgICAgICAga2V0dGxlLnRlbXAuYWRqdXN0ID0ga2V0dGxlLnRlbXAuY3VycmVudCAtIGtldHRsZS50ZW1wLnByZXZpb3VzO1xuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS5zdGFydFN0b3BLZXR0bGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAga2V0dGxlLmFjdGl2ZSA9ICFrZXR0bGUuYWN0aXZlO1xuICAgICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcblxuICAgICAgaWYoa2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdzdGFydGluZy4uLic7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICAgICAgQnJld1NlcnZpY2UudGVtcChrZXR0bGUpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsIGtldHRsZSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHJlbGF5c1xuICAgICAgICBpZihrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5oZWF0ZXIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgICAgJHNjb3BlLnRvZ2dsZVJlbGF5KGtldHRsZSwga2V0dGxlLmNvb2xlciwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtldHRsZS5rbm9iLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAgICAgLy9zdG9wIHRoZSBoZWF0ZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKXtcbiAgICAgICAgICAkc2NvcGUudG9nZ2xlUmVsYXkoa2V0dGxlLCBrZXR0bGUuaGVhdGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBwdW1wXG4gICAgICAgIGlmKCFrZXR0bGUuYWN0aXZlICYmIGtldHRsZS5wdW1wICYmIGtldHRsZS5wdW1wLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5wdW1wLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdG9wIHRoZSBjb29sZXJcbiAgICAgICAgaWYoIWtldHRsZS5hY3RpdmUgJiYga2V0dGxlLmNvb2xlciAmJiBrZXR0bGUuY29vbGVyLnJ1bm5pbmcpe1xuICAgICAgICAgICRzY29wZS50b2dnbGVSZWxheShrZXR0bGUsIGtldHRsZS5jb29sZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZigha2V0dGxlLmFjdGl2ZSl7XG4gICAgICAgICAgaWYoa2V0dGxlLnB1bXApIGtldHRsZS5wdW1wLmF1dG89ZmFsc2U7XG4gICAgICAgICAgaWYoa2V0dGxlLmhlYXRlcikga2V0dGxlLmhlYXRlci5hdXRvPWZhbHNlO1xuICAgICAgICAgIGlmKGtldHRsZS5jb29sZXIpIGtldHRsZS5jb29sZXIuYXV0bz1mYWxzZTtcbiAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9O1xuXG4gICRzY29wZS50b2dnbGVSZWxheSA9IGZ1bmN0aW9uKGtldHRsZSwgZWxlbWVudCwgb24pe1xuICAgIGlmKG9uKSB7XG4gICAgICBpZihlbGVtZW50LnBpbi5pbmRleE9mKCdUUC0nKT09PTApe1xuICAgICAgICBsZXQgZGV2aWNlID0gXy5maWx0ZXIoJHNjb3BlLnNldHRpbmdzLnRwbGluay5wbHVncyx7ZGV2aWNlSWQ6IGVsZW1lbnQucGluLnN1YnN0cigzKX0pWzBdO1xuICAgICAgICByZXR1cm4gQnJld1NlcnZpY2UudHBsaW5rKCkub24oZGV2aWNlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSl7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbixNYXRoLnJvdW5kKDI1NSplbGVtZW50LmR1dHlDeWNsZS8xMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vc3RhcnRlZFxuICAgICAgICAgICAgZWxlbWVudC5ydW5uaW5nPXRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfSBlbHNlIGlmKGVsZW1lbnQuc3NyKXtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLmFuYWxvZyhrZXR0bGUsIGVsZW1lbnQucGluLDI1NSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvL3N0YXJ0ZWRcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz10cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZWxlbWVudC5waW4uaW5kZXhPZignVFAtJyk9PT0wKXtcbiAgICAgICAgbGV0IGRldmljZSA9IF8uZmlsdGVyKCRzY29wZS5zZXR0aW5ncy50cGxpbmsucGx1Z3Mse2RldmljZUlkOiBlbGVtZW50LnBpbi5zdWJzdHIoMyl9KVswXTtcbiAgICAgICAgcmV0dXJuIEJyZXdTZXJ2aWNlLnRwbGluaygpLm9mZihkZXZpY2UpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy9zdGFydGVkXG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT4gJHNjb3BlLnNldEVycm9yTWVzc2FnZShlcnIsIGtldHRsZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihlbGVtZW50LnB3bSB8fCBlbGVtZW50LnNzcil7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5hbmFsb2coa2V0dGxlLCBlbGVtZW50LnBpbiwwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGVsZW1lbnQucnVubmluZz1mYWxzZTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+ICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCBrZXR0bGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCcmV3U2VydmljZS5kaWdpdGFsKGtldHRsZSwgZWxlbWVudC5waW4sMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlS25vYkNvcHkoa2V0dGxlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiAkc2NvcGUuc2V0RXJyb3JNZXNzYWdlKGVyciwga2V0dGxlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLmltcG9ydFNldHRpbmdzID0gZnVuY3Rpb24oJGZpbGVDb250ZW50LCRleHQpe1xuICAgIHRyeSB7XG4gICAgICBsZXQgcHJvZmlsZUNvbnRlbnQgPSBKU09OLnBhcnNlKCRmaWxlQ29udGVudCk7XG4gICAgICAkc2NvcGUuc2V0dGluZ3MgPSBwcm9maWxlQ29udGVudC5zZXR0aW5ncyB8fCBCcmV3U2VydmljZS5yZXNldCgpO1xuICAgICAgJHNjb3BlLmtldHRsZXMgPSBwcm9maWxlQ29udGVudC5rZXR0bGVzIHx8IEJyZXdTZXJ2aWNlLmRlZmF1bHRLZXR0bGVzKCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgIC8vIGVycm9yIGltcG9ydGluZ1xuICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShlKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmV4cG9ydFNldHRpbmdzID0gZnVuY3Rpb24oKXtcbiAgICBsZXQga2V0dGxlcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUua2V0dGxlcyk7XG4gICAgXy5lYWNoKGtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIGtldHRsZXNbaV0udmFsdWVzID0gW107XG4gICAgICBrZXR0bGVzW2ldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHJldHVybiBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoe1wic2V0dGluZ3NcIjogJHNjb3BlLnNldHRpbmdzLFwia2V0dGxlc1wiOiBrZXR0bGVzfSkpO1xuICB9O1xuXG4gICRzY29wZS5pZ25vcmVWZXJzaW9uRXJyb3IgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgICRzY29wZS5zZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciA9IHRydWU7XG4gICAgJHNjb3BlLnJlc2V0RXJyb3Ioa2V0dGxlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBkb3dubG9hZFNrZXRjaChuYW1lLCBhY3Rpb25zLCBoYXNUcmlnZ2VycywgaGVhZGVycywgc2tldGNoKXtcbiAgICAvLyB0cCBsaW5rIGNvbm5lY3Rpb25cbiAgICBsZXQgdHBsaW5rX2Nvbm5lY3Rpb25fc3RyaW5nID0gQnJld1NlcnZpY2UudHBsaW5rKCkuY29ubmVjdGlvbigpO1xuICAgIC8vIGluZmx1eCBkYiBjb25uZWN0aW9uXG4gICAgbGV0IGNvbm5lY3Rpb25fc3RyaW5nID0gYCR7JHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybH1gO1xuICAgIGlmKCAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wb3J0IClcbiAgICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9IGA6JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIucG9ydH1gO1xuICAgIGNvbm5lY3Rpb25fc3RyaW5nICs9ICcvd3JpdGU/JztcbiAgICAvLyBhZGQgdXNlci9wYXNzXG4gICAgaWYoISEkc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlciAmJiAhISRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzKVxuICAgICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gYHU9JHskc2NvcGUuc2V0dGluZ3MuaW5mbHV4ZGIudXNlcn0mcD0keyRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZgXG4gICAgLy8gYWRkIGRiXG4gICAgY29ubmVjdGlvbl9zdHJpbmcgKz0gJ2RiPScrKCRzY29wZS5zZXR0aW5ncy5pbmZsdXhkYi5kYiB8fCAnc2Vzc2lvbi0nK21vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICBsZXQgYXV0b2dlbiA9ICcvKiBTa2V0Y2ggQXV0byBHZW5lcmF0ZWQgZnJvbSBodHRwOi8vbW9uaXRvci5icmV3YmVuY2guY28gb24gJyttb21lbnQoKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6TU06U1MnKSsnIGZvciAnK25hbWUrJyovXFxuJztcbiAgICAkaHR0cC5nZXQoJ2Fzc2V0cy9hcmR1aW5vLycrc2tldGNoKycvJytza2V0Y2grJy5pbm8nKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyByZXBsYWNlIHZhcmlhYmxlc1xuICAgICAgICByZXNwb25zZS5kYXRhID0gYXV0b2dlbityZXNwb25zZS5kYXRhXG4gICAgICAgICAgLnJlcGxhY2UoJy8vIFthY3Rpb25zXScsIGFjdGlvbnMubGVuZ3RoID8gYWN0aW9ucy5qb2luKCdcXG4nKSA6ICcnKVxuICAgICAgICAgIC5yZXBsYWNlKCcvLyBbaGVhZGVyc10nLCBoZWFkZXJzLmxlbmd0aCA/IGhlYWRlcnMuam9pbignXFxuJykgOiAnJylcbiAgICAgICAgICAucmVwbGFjZSgnW1RQTElOS19DT05ORUNUSU9OXScsIHRwbGlua19jb25uZWN0aW9uX3N0cmluZylcbiAgICAgICAgICAucmVwbGFjZSgnW1NMQUNLX0NPTk5FQ1RJT05dJywgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2spXG4gICAgICAgICAgLnJlcGxhY2UoJ1tGUkVRVUVOQ1lfU0VDT05EU10nLCAkc2NvcGUuc2V0dGluZ3Muc2tldGNoZXMuZnJlcXVlbmN5ID8gcGFyc2VJbnQoJHNjb3BlLnNldHRpbmdzLnNrZXRjaGVzLmZyZXF1ZW5jeSwxMCkgOiA2MCk7XG4gICAgICAgIGlmKCBza2V0Y2guaW5kZXhPZignSW5mbHV4REInKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoJ1tJTkZMVVhEQl9DT05ORUNUSU9OXScsIGNvbm5lY3Rpb25fc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIDxkaHQuaD4nKSAhPT0gLTEpe1xuICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSByZXNwb25zZS5kYXRhLnJlcGxhY2UoL1xcL1xcLyBESFQgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihoZWFkZXJzLmluZGV4T2YoJyNpbmNsdWRlIFwiY2FjdHVzX2lvX0RTMThCMjAuaFwiJykgIT09IC0xKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gRFMxOEIyMCAvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhhc1RyaWdnZXJzKXtcbiAgICAgICAgICByZXNwb25zZS5kYXRhID0gcmVzcG9uc2UuZGF0YS5yZXBsYWNlKC9cXC9cXC8gdHJpZ2dlcnMgL2csICcnKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RyZWFtU2tldGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHNrZXRjaCsnLScrbmFtZSsnLmlubycpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guc2V0QXR0cmlidXRlKCdocmVmJywgXCJkYXRhOnRleHQvaW5vO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQocmVzcG9uc2UuZGF0YSkpO1xuICAgICAgICBzdHJlYW1Ta2V0Y2guY2xpY2soKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHRvIGRvd25sb2FkIHNrZXRjaCAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZG93bmxvYWRBdXRvU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICBsZXQgc2tldGNoZXMgPSBbXTtcbiAgICBsZXQgYXJkdWlub05hbWUgPSAnJztcbiAgICBfLmVhY2goJHNjb3BlLmtldHRsZXMsIChrZXR0bGUsIGkpID0+IHtcbiAgICAgIC8vIHJlc2V0IHRoZSBhY3Rpb25zXG4gICAgICBpZigoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCkgfHxcbiAgICAgICAgKGtldHRsZS5jb29sZXIgJiYga2V0dGxlLmNvb2xlci5za2V0Y2gpIHx8XG4gICAgICAgIGtldHRsZS5ub3RpZnkuZHdlZXRcbiAgICAgICl7XG4gICAgICAgIGFyZHVpbm9OYW1lID0ga2V0dGxlLmFyZHVpbm8udXJsLnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpO1xuICAgICAgICBsZXQgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgICBpZighY3VycmVudFNrZXRjaCl7XG4gICAgICAgICAgc2tldGNoZXMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgaGVhZGVyczogW10sXG4gICAgICAgICAgICB0cmlnZ2VyczogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoID0gXy5maW5kKHNrZXRjaGVzLHtuYW1lOmFyZHVpbm9OYW1lfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnKSA/ICRmaWx0ZXIoJ3RvQ2Vsc2l1cycpKGtldHRsZS50ZW1wLnRhcmdldCkgOiBrZXR0bGUudGVtcC50YXJnZXQ7XG4gICAgICAgIGxldCBhZGp1c3QgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJyAmJiBrZXR0bGUudGVtcC5hZGp1c3QgIT0gMCkgPyBNYXRoLnJvdW5kKGtldHRsZS50ZW1wLmFkanVzdCowLjU1NSkgOiBrZXR0bGUudGVtcC5hZGp1c3Q7XG4gICAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvREhUTGliLnppcCcpO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSA8ZGh0Lmg+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcvLyBodHRwczovL3d3dy5icmV3YmVuY2guY28vbGlicy9jYWN0dXNfaW9fRFMxOEIyMC56aXAnKTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnI2luY2x1ZGUgXCJjYWN0dXNfaW9fRFMxOEIyMC5oXCInKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgnYXV0b0NvbW1hbmQoXCInK2tldHRsZS50ZW1wLnBpbisnXCIsXCInK2tldHRsZS50ZW1wLnR5cGUrJ1wiLCcrYWRqdXN0KycpOycpO1xuICAgICAgICAvL2xvb2sgZm9yIHRyaWdnZXJzXG4gICAgICAgIGlmKGtldHRsZS5oZWF0ZXIgJiYga2V0dGxlLmhlYXRlci5za2V0Y2gpe1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKFwiaGVhdFwiLFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIixcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihcImNvb2xcIixcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIsXCInK2tldHRsZS5jb29sZXIucGluKydcIix0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoa2V0dGxlLm5vdGlmeS5kd2VldCl7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2R3ZWV0QXV0b0NvbW1hbmQoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiLFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLmJyZXdlci5uYW1lKydcIixcIicrJHNjb3BlLnNldHRpbmdzLnJlY2lwZS5uYW1lKydcIix0ZW1wKTsnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZWFjaChza2V0Y2hlcywgKHNrZXRjaCwgaSkgPT4ge1xuICAgICAgaWYoc2tldGNoLnRyaWdnZXJzKXtcbiAgICAgICAgc2tldGNoLmFjdGlvbnMudW5zaGlmdCgnZmxvYXQgdGVtcCA9IDAuMDA7JylcbiAgICAgICAgLy8gdXBkYXRlIGF1dG9Db21tYW5kXG4gICAgICAgIGZvcihsZXQgYSA9IDA7IGEgPCBza2V0Y2guYWN0aW9ucy5sZW5ndGg7IGErKyl7XG4gICAgICAgICAgaWYoc2tldGNoZXNbaV0uYWN0aW9uc1thXS5pbmRleE9mKCdhdXRvQ29tbWFuZCgnKSAhPT0gLTEpXG4gICAgICAgICAgICBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdID0gc2tldGNoZXNbaV0uYWN0aW9uc1thXS5yZXBsYWNlKCdhdXRvQ29tbWFuZCgnLCd0ZW1wID0gYXV0b0NvbW1hbmQoJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG93bmxvYWRTa2V0Y2goc2tldGNoLm5hbWUsIHNrZXRjaC5hY3Rpb25zLCBza2V0Y2gudHJpZ2dlcnMsIHNrZXRjaC5oZWFkZXJzLCAnQnJld0JlbmNoQXV0b1l1bicpO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5kb3dubG9hZEluZmx1eERCU2tldGNoID0gZnVuY3Rpb24oKXtcbiAgICBpZighJHNjb3BlLnNldHRpbmdzLmluZmx1eGRiLnVybCkgcmV0dXJuO1xuICAgIGxldCBza2V0Y2hlcyA9IFtdO1xuICAgIGxldCBhcmR1aW5vTmFtZSA9ICcnO1xuICAgIF8uZWFjaCgkc2NvcGUua2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgYXJkdWlub05hbWUgPSBrZXR0bGUuYXJkdWluby51cmwucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIik7XG4gICAgICBsZXQgY3VycmVudFNrZXRjaCA9IF8uZmluZChza2V0Y2hlcyx7bmFtZTphcmR1aW5vTmFtZX0pO1xuICAgICAgaWYoIWN1cnJlbnRTa2V0Y2gpe1xuICAgICAgICBza2V0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBhcmR1aW5vTmFtZSxcbiAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICBoZWFkZXJzOiBbXSxcbiAgICAgICAgICB0cmlnZ2VyczogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2ggPSBfLmZpbmQoc2tldGNoZXMse25hbWU6YXJkdWlub05hbWV9KTtcbiAgICAgIH1cbiAgICAgIGxldCB0YXJnZXQgPSAoJHNjb3BlLnNldHRpbmdzLnVuaXQ9PSdGJykgPyAkZmlsdGVyKCd0b0NlbHNpdXMnKShrZXR0bGUudGVtcC50YXJnZXQpIDoga2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAgbGV0IGFkanVzdCA9ICgkc2NvcGUuc2V0dGluZ3MudW5pdD09J0YnICYmIGtldHRsZS50ZW1wLmFkanVzdCAhPSAwKSA/IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1KSA6IGtldHRsZS50ZW1wLmFkanVzdDtcbiAgICAgIGlmKGtldHRsZS50ZW1wLnR5cGUuaW5kZXhPZignREhUJykgIT09IC0xKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJy8vIGh0dHBzOi8vd3d3LmJyZXdiZW5jaC5jby9saWJzL0RIVExpYi56aXAnKTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5oZWFkZXJzLnB1c2goJyNpbmNsdWRlIDxkaHQuaD4nKVxuICAgICAgfVxuICAgICAgZWxzZSBpZihrZXR0bGUudGVtcC50eXBlLmluZGV4T2YoJ0RTMThCMjAnKSAhPT0gLTEpe1xuICAgICAgICBjdXJyZW50U2tldGNoLmhlYWRlcnMucHVzaCgnLy8gaHR0cHM6Ly93d3cuYnJld2JlbmNoLmNvL2xpYnMvY2FjdHVzX2lvX0RTMThCMjAuemlwJyk7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guaGVhZGVycy5wdXNoKCcjaW5jbHVkZSBcImNhY3R1c19pb19EUzE4QjIwLmhcIicpO1xuICAgICAgfVxuICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2luZmx1eERCQ29tbWFuZChGKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLnRlbXAucGluKydcIiksRihcIicra2V0dGxlLnRlbXAudHlwZSsnXCIpLCcrYWRqdXN0KycpOycpO1xuICAgICAgLy9sb29rIGZvciB0cmlnZ2Vyc1xuICAgICAgaWYoa2V0dGxlLmhlYXRlciAmJiBrZXR0bGUuaGVhdGVyLnNrZXRjaCl7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2gudHJpZ2dlcnMgPSB0cnVlO1xuICAgICAgICBjdXJyZW50U2tldGNoLmFjdGlvbnMucHVzaCgndHJpZ2dlcihGKFwiaGVhdFwiKSxGKFwiJytrZXR0bGUua2V5LnJlcGxhY2UoL1teYS16QS1aMC05LS5dL2csIFwiXCIpKydcIiksRihcIicra2V0dGxlLmhlYXRlci5waW4rJ1wiKSx0ZW1wLCcrdGFyZ2V0KycsJytrZXR0bGUudGVtcC5kaWZmKycsJyshIWtldHRsZS5ub3RpZnkuc2xhY2srJyk7Jyk7XG4gICAgICB9XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIuc2tldGNoKXtcbiAgICAgICAgY3VycmVudFNrZXRjaC50cmlnZ2VycyA9IHRydWU7XG4gICAgICAgIGN1cnJlbnRTa2V0Y2guYWN0aW9ucy5wdXNoKCd0cmlnZ2VyKEYoXCJjb29sXCIpLEYoXCInK2tldHRsZS5rZXkucmVwbGFjZSgvW15hLXpBLVowLTktLl0vZywgXCJcIikrJ1wiKSxGKFwiJytrZXR0bGUuY29vbGVyLnBpbisnXCIpLHRlbXAsJyt0YXJnZXQrJywnK2tldHRsZS50ZW1wLmRpZmYrJywnKyEha2V0dGxlLm5vdGlmeS5zbGFjaysnKTsnKTtcbiAgICAgIH1cbiAgICAgIGlmKGtldHRsZS5ub3RpZnkuZHdlZXQpe1xuICAgICAgICBjdXJyZW50U2tldGNoLnRyaWdnZXJzID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudFNrZXRjaC5hY3Rpb25zLnB1c2goJ2R3ZWV0QXV0b0NvbW1hbmQoRihcIicra2V0dGxlLmtleS5yZXBsYWNlKC9bXmEtekEtWjAtOS0uXS9nLCBcIlwiKSsnXCIpLEYoXCInKyRzY29wZS5zZXR0aW5ncy5yZWNpcGUuYnJld2VyLm5hbWUrJ1wiKSxGKFwiJyskc2NvcGUuc2V0dGluZ3MucmVjaXBlLm5hbWUrJ1wiKSx0ZW1wKTsnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2tldGNoZXMsIChza2V0Y2gsIGkpID0+IHtcbiAgICAgIGlmKHNrZXRjaC50cmlnZ2Vycyl7XG4gICAgICAgIHNrZXRjaC5hY3Rpb25zLnVuc2hpZnQoJ2Zsb2F0IHRlbXAgPSAwLjAwOycpXG4gICAgICAgIC8vIHVwZGF0ZSBhdXRvQ29tbWFuZFxuICAgICAgICBmb3IobGV0IGEgPSAwOyBhIDwgc2tldGNoLmFjdGlvbnMubGVuZ3RoOyBhKyspe1xuICAgICAgICAgIGlmKHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0uaW5kZXhPZignaW5mbHV4REJDb21tYW5kKCcpICE9PSAtMSlcbiAgICAgICAgICAgIHNrZXRjaGVzW2ldLmFjdGlvbnNbYV0gPSBza2V0Y2hlc1tpXS5hY3Rpb25zW2FdLnJlcGxhY2UoJ2luZmx1eERCQ29tbWFuZCgnLCd0ZW1wID0gaW5mbHV4REJDb21tYW5kKCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvd25sb2FkU2tldGNoKHNrZXRjaC5uYW1lLCBza2V0Y2guYWN0aW9ucywgc2tldGNoLnRyaWdnZXJzLCBza2V0Y2guaGVhZGVycywgJ0JyZXdCZW5jaEluZmx1eERCWXVuJyk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmdldElQQWRkcmVzcyA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnNldHRpbmdzLmlwQWRkcmVzcyA9IFwiXCI7XG4gICAgQnJld1NlcnZpY2UuaXAoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MuaXBBZGRyZXNzID0gcmVzcG9uc2UuaXA7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5hbGVydCA9IGZ1bmN0aW9uKGtldHRsZSx0aW1lcil7XG5cbiAgICAvL2Rvbid0IHN0YXJ0IGFsZXJ0cyB1bnRpbCB3ZSBoYXZlIGhpdCB0aGUgdGVtcC50YXJnZXRcbiAgICBpZighdGltZXIgJiYga2V0dGxlICYmICFrZXR0bGUudGVtcC5oaXRcbiAgICAgIHx8ICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLm9uID09PSBmYWxzZSl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wIC8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgbGV0IG1lc3NhZ2UsXG4gICAgICBpY29uID0gJy9hc3NldHMvaW1nL2JyZXdiZW5jaC1sb2dvLnBuZycsXG4gICAgICBjb2xvciA9ICdnb29kJztcblxuICAgIGlmKGtldHRsZSAmJiBbJ2hvcCcsJ2dyYWluJywnd2F0ZXInLCdmZXJtZW50ZXInXS5pbmRleE9mKGtldHRsZS50eXBlKSE9PS0xKVxuICAgICAgaWNvbiA9ICcvYXNzZXRzL2ltZy8nK2tldHRsZS50eXBlKycucG5nJztcblxuICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICBpZihrZXR0bGUgJiYga2V0dGxlLmxvdyAmJiBrZXR0bGUuaGVhdGVyLnJ1bm5pbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBpZighIXRpbWVyKXsgLy9rZXR0bGUgaXMgYSB0aW1lciBvYmplY3RcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50aW1lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmKHRpbWVyLnVwKVxuICAgICAgICBtZXNzYWdlID0gJ1lvdXIgdGltZXJzIGFyZSBkb25lJztcbiAgICAgIGVsc2UgaWYoISF0aW1lci5ub3RlcylcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLm5vdGVzKycgb2YgJyt0aW1lci5sYWJlbDtcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9ICdUaW1lIHRvIGFkZCAnK3RpbWVyLmxhYmVsO1xuICAgIH1cbiAgICBlbHNlIGlmKGtldHRsZSAmJiBrZXR0bGUuaGlnaCl7XG4gICAgICBpZighJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuaGlnaCB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0naGlnaCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUua2V5KycgaXMgJysoa2V0dGxlLmhpZ2gta2V0dGxlLnRlbXAuZGlmZikrJ1xcdTAwQjAgaGlnaCc7XG4gICAgICBjb2xvciA9ICdkYW5nZXInO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0naGlnaCc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlICYmIGtldHRsZS5sb3cpe1xuICAgICAgaWYoISRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxvdyB8fCAkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy5sYXN0PT0nbG93JylcbiAgICAgICAgcmV0dXJuO1xuICAgICAgbWVzc2FnZSA9IGtldHRsZS5rZXkrJyBpcyAnKyhrZXR0bGUubG93LWtldHRsZS50ZW1wLmRpZmYpKydcXHUwMEIwIGxvdyc7XG4gICAgICBjb2xvciA9ICcjMzQ5OERCJztcbiAgICAgICRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLmxhc3Q9J2xvdyc7XG4gICAgfVxuICAgIGVsc2UgaWYoa2V0dGxlKXtcbiAgICAgIGlmKCEkc2NvcGUuc2V0dGluZ3Mubm90aWZpY2F0aW9ucy50YXJnZXQgfHwgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD09J3RhcmdldCcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIG1lc3NhZ2UgPSBrZXR0bGUua2V5KycgaXMgd2l0aGluIHRoZSB0YXJnZXQgYXQgJytrZXR0bGUudGVtcC5jdXJyZW50KydcXHUwMEIwJztcbiAgICAgIGNvbG9yID0gJ2dvb2QnO1xuICAgICAgJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMubGFzdD0ndGFyZ2V0JztcbiAgICB9XG4gICAgZWxzZSBpZigha2V0dGxlKXtcbiAgICAgIG1lc3NhZ2UgPSAnVGVzdGluZyBBbGVydHMsIHlvdSBhcmUgcmVhZHkgdG8gZ28sIGNsaWNrIHBsYXkgb24gYSBrZXR0bGUuJztcbiAgICB9XG5cbiAgICAvLyBNb2JpbGUgVmlicmF0ZSBOb3RpZmljYXRpb25cbiAgICBpZiAoXCJ2aWJyYXRlXCIgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3IudmlicmF0ZShbNTAwLCAzMDAsIDUwMF0pO1xuICAgIH1cblxuICAgIC8vIFNvdW5kIE5vdGlmaWNhdGlvblxuICAgIGlmKCRzY29wZS5zZXR0aW5ncy5zb3VuZHMub249PT10cnVlKXtcbiAgICAgIC8vZG9uJ3QgYWxlcnQgaWYgdGhlIGhlYXRlciBpcyBydW5uaW5nIGFuZCB0ZW1wIGlzIHRvbyBsb3dcbiAgICAgIGlmKCEhdGltZXIgJiYga2V0dGxlICYmIGtldHRsZS5sb3cgJiYga2V0dGxlLmhlYXRlci5ydW5uaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgICB2YXIgc25kID0gbmV3IEF1ZGlvKCghIXRpbWVyKSA/ICRzY29wZS5zZXR0aW5ncy5zb3VuZHMudGltZXIgOiAkc2NvcGUuc2V0dGluZ3Muc291bmRzLmFsZXJ0KTsgLy8gYnVmZmVycyBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRlZFxuICAgICAgc25kLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBXaW5kb3cgTm90aWZpY2F0aW9uXG4gICAgaWYoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpe1xuICAgICAgLy9jbG9zZSB0aGUgcHJldmlvdXMgbm90aWZpY2F0aW9uXG4gICAgICBpZihub3RpZmljYXRpb24pXG4gICAgICAgIG5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuXG4gICAgICBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpe1xuICAgICAgICBpZihtZXNzYWdlKXtcbiAgICAgICAgICBpZihrZXR0bGUpXG4gICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5rZXkrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbignVGVzdCBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZihOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2RlbmllZCcpe1xuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHBlcm1pc3Npb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdXNlciBhY2NlcHRzLCBsZXQncyBjcmVhdGUgYSBub3RpZmljYXRpb25cbiAgICAgICAgICBpZiAocGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIGlmKG1lc3NhZ2Upe1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKGtldHRsZS5rZXkrJyBrZXR0bGUnLHtib2R5Om1lc3NhZ2UsaWNvbjppY29ufSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2xhY2sgTm90aWZpY2F0aW9uXG4gICAgaWYoJHNjb3BlLnNldHRpbmdzLm5vdGlmaWNhdGlvbnMuc2xhY2suaW5kZXhPZignaHR0cCcpID09PSAwKXtcbiAgICAgIEJyZXdTZXJ2aWNlLnNsYWNrKCRzY29wZS5zZXR0aW5ncy5ub3RpZmljYXRpb25zLnNsYWNrLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgaWNvbixcbiAgICAgICAgICBrZXR0bGVcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAkc2NvcGUucmVzZXRFcnJvcigpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICBpZihlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoYEZhaWxlZCBwb3N0aW5nIHRvIFNsYWNrICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJHNjb3BlLnNldEVycm9yTWVzc2FnZShgRmFpbGVkIHBvc3RpbmcgdG8gU2xhY2sgJHtKU09OLnN0cmluZ2lmeShlcnIpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5ID0gZnVuY3Rpb24oa2V0dGxlKXtcblxuICAgIGlmKCFrZXR0bGUuYWN0aXZlKXtcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICcjNzc3JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdub3QgcnVubmluZyc7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAga2V0dGxlLmtub2IucmVhZE9ubHkgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZihrZXR0bGUuZXJyb3IubWVzc2FnZSl7XG4gICAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAnI2RkZCc7XG4gICAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJyM3NzcnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAnZXJyb3InO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ2dyYXknO1xuICAgICAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBrZXR0bGUua25vYi5yZWFkT25seSA9IGZhbHNlO1xuXG4gICAgLy9pcyB0ZW1wIHRvbyBoaWdoP1xuICAgIGlmKGtldHRsZS50ZW1wLmN1cnJlbnQgPiBrZXR0bGUudGVtcC50YXJnZXQra2V0dGxlLnRlbXAuZGlmZil7XG4gICAgICBrZXR0bGUua25vYi5iYXJDb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIGtldHRsZS5rbm9iLnRyYWNrQ29sb3IgPSAncmdiYSgyNTUsMCwwLC4xKSc7XG4gICAgICBrZXR0bGUuaGlnaCA9IGtldHRsZS50ZW1wLmN1cnJlbnQta2V0dGxlLnRlbXAudGFyZ2V0O1xuICAgICAga2V0dGxlLmxvdyA9IG51bGw7XG4gICAgICBpZihrZXR0bGUuY29vbGVyICYmIGtldHRsZS5jb29sZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdjb29saW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksMSknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy91cGRhdGUga25vYiB0ZXh0XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9IChrZXR0bGUuaGlnaC1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBoaWdoJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoa2V0dGxlLnRlbXAuY3VycmVudCA8IGtldHRsZS50ZW1wLnRhcmdldC1rZXR0bGUudGVtcC5kaWZmKXtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwuNSknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDUyLDE1MiwyMTksLjEpJztcbiAgICAgIGtldHRsZS5sb3cgPSBrZXR0bGUudGVtcC50YXJnZXQta2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICAgIGlmKGtldHRsZS5oZWF0ZXIucnVubmluZyl7XG4gICAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICdoZWF0aW5nJztcbiAgICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdyZ2JhKDI1NSwwLDAsLjYpJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vdXBkYXRlIGtub2IgdGV4dFxuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSAoa2V0dGxlLmxvdy1rZXR0bGUudGVtcC5kaWZmKSsnXFx1MDBCMCBsb3cnO1xuICAgICAgICBrZXR0bGUua25vYi5zdWJUZXh0LmNvbG9yID0gJ3JnYmEoNTIsMTUyLDIxOSwxKSc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5rbm9iLmJhckNvbG9yID0gJ3JnYmEoNDQsMTkzLDEzMywuNiknO1xuICAgICAga2V0dGxlLmtub2IudHJhY2tDb2xvciA9ICdyZ2JhKDQ0LDE5MywxMzMsLjEpJztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQudGV4dCA9ICd3aXRoaW4gdGFyZ2V0JztcbiAgICAgIGtldHRsZS5rbm9iLnN1YlRleHQuY29sb3IgPSAnZ3JheSc7XG4gICAgICBrZXR0bGUubG93ID0gbnVsbDtcbiAgICAgIGtldHRsZS5oaWdoID0gbnVsbDtcbiAgICB9XG4gICAgLy8gdXBkYXRlIHN1YnRleHQgdG8gaW5jbHVkZSBodW1pZGl0eVxuICAgIGlmKGtldHRsZS5odW1pZGl0eSl7XG4gICAgICBrZXR0bGUua25vYi5zdWJUZXh0LnRleHQgPSBrZXR0bGUuaHVtaWRpdHkrJyUnO1xuICAgICAga2V0dGxlLmtub2Iuc3ViVGV4dC5jb2xvciA9ICdncmF5JztcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZUtldHRsZVR5cGUgPSBmdW5jdGlvbihrZXR0bGUpe1xuICAgIC8vZG9uJ3QgYWxsb3cgY2hhbmdpbmcga2V0dGxlcyBvbiBzaGFyZWQgc2Vzc2lvbnNcbiAgICAvL3RoaXMgY291bGQgYmUgZGFuZ2Vyb3VzIGlmIGRvaW5nIHRoaXMgcmVtb3RlbHlcbiAgICBpZigkc2NvcGUuc2V0dGluZ3Muc2hhcmVkKVxuICAgICAgcmV0dXJuO1xuICAgIC8vIGZpbmQgY3VycmVudCBrZXR0bGVcbiAgICB2YXIga2V0dGxlSW5kZXggPSBfLmZpbmRJbmRleCgkc2NvcGUua2V0dGxlVHlwZXMsIHt0eXBlOiBrZXR0bGUudHlwZX0pO1xuICAgIC8vIG1vdmUgdG8gbmV4dCBvciBmaXJzdCBrZXR0bGUgaW4gYXJyYXlcbiAgICBrZXR0bGVJbmRleCsrO1xuICAgIHZhciBrZXR0bGVUeXBlID0gKCRzY29wZS5rZXR0bGVUeXBlc1trZXR0bGVJbmRleF0pID8gJHNjb3BlLmtldHRsZVR5cGVzW2tldHRsZUluZGV4XSA6ICRzY29wZS5rZXR0bGVUeXBlc1swXTtcbiAgICAvL3VwZGF0ZSBrZXR0bGUgb3B0aW9ucyBpZiBjaGFuZ2VkXG4gICAga2V0dGxlLmtleSA9IGtldHRsZVR5cGUubmFtZTtcbiAgICBrZXR0bGUudHlwZSA9IGtldHRsZVR5cGUudHlwZTtcbiAgICBrZXR0bGUudGVtcC50YXJnZXQgPSBrZXR0bGVUeXBlLnRhcmdldDtcbiAgICBrZXR0bGUudGVtcC5kaWZmID0ga2V0dGxlVHlwZS5kaWZmO1xuICAgIGtldHRsZS5rbm9iID0gYW5ndWxhci5jb3B5KEJyZXdTZXJ2aWNlLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTprZXR0bGUudGVtcC5jdXJyZW50LG1pbjowLG1heDprZXR0bGVUeXBlLnRhcmdldCtrZXR0bGVUeXBlLmRpZmZ9KTtcbiAgICBpZihrZXR0bGVUeXBlLnR5cGUgPT0gJ2Zlcm1lbnRlcicgfHwga2V0dGxlVHlwZS50eXBlID09ICdhaXInKXtcbiAgICAgIGtldHRsZS5jb29sZXIgPSB7cGluOidEMicscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX07XG4gICAgICBkZWxldGUga2V0dGxlLnB1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtldHRsZS5wdW1wID0ge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9O1xuICAgICAgZGVsZXRlIGtldHRsZS5jb29sZXI7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VVbml0cyA9IGZ1bmN0aW9uKHVuaXQpe1xuICAgIGlmKCRzY29wZS5zZXR0aW5ncy51bml0ICE9IHVuaXQpe1xuICAgICAgJHNjb3BlLnNldHRpbmdzLnVuaXQgPSB1bml0O1xuICAgICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLGZ1bmN0aW9uKGtldHRsZSl7XG4gICAgICAgIGtldHRsZS50ZW1wLmN1cnJlbnQgPSAkZmlsdGVyKCdmb3JtYXREZWdyZWVzJykoa2V0dGxlLnRlbXAuY3VycmVudCx1bml0KTtcbiAgICAgICAga2V0dGxlLnRlbXAudGFyZ2V0ID0gJGZpbHRlcignZm9ybWF0RGVncmVlcycpKGtldHRsZS50ZW1wLnRhcmdldCx1bml0KTtcbiAgICAgICAgaWYoISFrZXR0bGUudGVtcC5hZGp1c3Qpe1xuICAgICAgICAgIGlmKHVuaXQgPT09ICdDJylcbiAgICAgICAgICAgIGtldHRsZS50ZW1wLmFkanVzdCA9IE1hdGgucm91bmQoa2V0dGxlLnRlbXAuYWRqdXN0KjAuNTU1KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBrZXR0bGUudGVtcC5hZGp1c3QgPSBNYXRoLnJvdW5kKGtldHRsZS50ZW1wLmFkanVzdCoxLjgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBrbm9iXG4gICAgICAgIGtldHRsZS5rbm9iLnZhbHVlID0ga2V0dGxlLnRlbXAuY3VycmVudDtcbiAgICAgICAga2V0dGxlLmtub2IubWF4ID0ga2V0dGxlLnRlbXAudGFyZ2V0K2tldHRsZS50ZW1wLmRpZmYrMTA7XG4gICAgICAgICRzY29wZS51cGRhdGVLbm9iQ29weShrZXR0bGUpO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuY2hhcnRPcHRpb25zID0gQnJld1NlcnZpY2UuY2hhcnRPcHRpb25zKHVuaXQpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUudGltZXJSdW4gPSBmdW5jdGlvbih0aW1lcixrZXR0bGUpe1xuICAgIHJldHVybiAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgLy9jYW5jZWwgaW50ZXJ2YWwgaWYgemVybyBvdXRcbiAgICAgIGlmKCF0aW1lci51cCAmJiB0aW1lci5taW49PTAgJiYgdGltZXIuc2VjPT0wKXtcbiAgICAgICAgLy9zdG9wIHJ1bm5pbmdcbiAgICAgICAgdGltZXIucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAvL3N0YXJ0IHVwIGNvdW50ZXJcbiAgICAgICAgdGltZXIudXAgPSB7bWluOjAsc2VjOjAscnVubmluZzp0cnVlfTtcbiAgICAgICAgLy9pZiBhbGwgdGltZXJzIGFyZSBkb25lIHNlbmQgYW4gYWxlcnRcbiAgICAgICAgaWYoICEha2V0dGxlICYmIF8uZmlsdGVyKGtldHRsZS50aW1lcnMsIHt1cDoge3J1bm5pbmc6dHJ1ZX19KS5sZW5ndGggPT0ga2V0dGxlLnRpbWVycy5sZW5ndGggKVxuICAgICAgICAgICRzY29wZS5hbGVydChrZXR0bGUsdGltZXIpO1xuICAgICAgfSBlbHNlIGlmKCF0aW1lci51cCAmJiB0aW1lci5zZWMgPiAwKXtcbiAgICAgICAgLy9jb3VudCBkb3duIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjLS07XG4gICAgICB9IGVsc2UgaWYodGltZXIudXAgJiYgdGltZXIudXAuc2VjIDwgNTkpe1xuICAgICAgICAvL2NvdW50IHVwIHNlY29uZHNcbiAgICAgICAgdGltZXIudXAuc2VjKys7XG4gICAgICB9IGVsc2UgaWYoIXRpbWVyLnVwKXtcbiAgICAgICAgLy9zaG91bGQgd2Ugc3RhcnQgdGhlIG5leHQgdGltZXI/XG4gICAgICAgIGlmKCEha2V0dGxlKXtcbiAgICAgICAgICBfLmVhY2goXy5maWx0ZXIoa2V0dGxlLnRpbWVycywge3J1bm5pbmc6ZmFsc2UsbWluOnRpbWVyLm1pbixxdWV1ZTpmYWxzZX0pLGZ1bmN0aW9uKG5leHRUaW1lcil7XG4gICAgICAgICAgICAkc2NvcGUuYWxlcnQoa2V0dGxlLG5leHRUaW1lcik7XG4gICAgICAgICAgICBuZXh0VGltZXIucXVldWU9dHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRzY29wZS50aW1lclN0YXJ0KG5leHRUaW1lcixrZXR0bGUpO1xuICAgICAgICAgICAgfSw2MDAwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb3VuZCBkb3duIG1pbnV0ZXMgYW5kIHNlY29uZHNcbiAgICAgICAgdGltZXIuc2VjPTU5O1xuICAgICAgICB0aW1lci5taW4tLTtcbiAgICAgIH0gZWxzZSBpZih0aW1lci51cCl7XG4gICAgICAgIC8vY291bmQgdXAgbWludXRlcyBhbmQgc2Vjb25kc1xuICAgICAgICB0aW1lci51cC5zZWM9MDtcbiAgICAgICAgdGltZXIudXAubWluKys7XG4gICAgICB9XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUudGltZXJTdGFydCA9IGZ1bmN0aW9uKHRpbWVyLGtldHRsZSl7XG4gICAgaWYodGltZXIudXAgJiYgdGltZXIudXAucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnVwLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2UgaWYodGltZXIucnVubmluZyl7XG4gICAgICAvL3N0b3AgdGltZXJcbiAgICAgIHRpbWVyLnJ1bm5pbmc9ZmFsc2U7XG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyLmludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9zdGFydCB0aW1lclxuICAgICAgdGltZXIucnVubmluZz10cnVlO1xuICAgICAgdGltZXIucXVldWU9ZmFsc2U7XG4gICAgICB0aW1lci5pbnRlcnZhbCA9ICRzY29wZS50aW1lclJ1bih0aW1lcixrZXR0bGUpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucHJvY2Vzc1RlbXBzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgYWxsU2Vuc29ycyA9IFtdO1xuICAgIC8vb25seSBwcm9jZXNzIGFjdGl2ZSBzZW5zb3JzXG4gICAgXy5lYWNoKCRzY29wZS5rZXR0bGVzLCAoaywgaSkgPT4ge1xuICAgICAgaWYoJHNjb3BlLmtldHRsZXNbaV0uYWN0aXZlKXtcbiAgICAgICAgYWxsU2Vuc29ycy5wdXNoKEJyZXdTZXJ2aWNlLnRlbXAoJHNjb3BlLmtldHRsZXNbaV0pXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gJHNjb3BlLnVwZGF0ZVRlbXAocmVzcG9uc2UsICRzY29wZS5rZXR0bGVzW2ldKSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICRzY29wZS5zZXRFcnJvck1lc3NhZ2UoZXJyLCAkc2NvcGUua2V0dGxlc1tpXSk7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiAkcS5hbGwoYWxsU2Vuc29ycylcbiAgICAgIC50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgIC8vcmUgcHJvY2VzcyBvbiB0aW1lb3V0XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2Nlc3NUZW1wcygpO1xuICAgICAgICB9LCghISRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcykgPyAkc2NvcGUuc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCA6IDEwMDAwKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUucHJvY2Vzc1RlbXBzKCk7XG4gICAgICAgIH0sKCEhJHNjb3BlLnNldHRpbmdzLnBvbGxTZWNvbmRzKSA/ICRzY29wZS5zZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwIDogMTAwMDApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKGtldHRsZSxmaWVsZCx1cCl7XG5cbiAgICBpZih0aW1lb3V0KVxuICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuXG4gICAgaWYodXApXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0rKztcbiAgICBlbHNlXG4gICAgICBrZXR0bGUudGVtcFtmaWVsZF0tLTtcblxuICAgIC8vdXBkYXRlIGtub2IgYWZ0ZXIgMSBzZWNvbmRzLCBvdGhlcndpc2Ugd2UgZ2V0IGEgbG90IG9mIHJlZnJlc2ggb24gdGhlIGtub2Igd2hlbiBjbGlja2luZyBwbHVzIG9yIG1pbnVzXG4gICAgdGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvL3VwZGF0ZSBtYXhcbiAgICAgIGtldHRsZS5rbm9iLm1heCA9IGtldHRsZS50ZW1wWyd0YXJnZXQnXStrZXR0bGUudGVtcFsnZGlmZiddKzEwO1xuICAgICAgJHNjb3BlLnVwZGF0ZUtub2JDb3B5KGtldHRsZSk7XG4gICAgfSwxMDAwKTtcbiAgfTtcblxuICAkc2NvcGUubG9hZENvbmZpZygpIC8vIGxvYWQgY29uZmlnXG4gICAgLnRoZW4oJHNjb3BlLmluaXQpIC8vIGluaXRcbiAgICAudGhlbihsb2FkZWQgPT4ge1xuICAgICAgaWYoISFsb2FkZWQpXG4gICAgICAgICRzY29wZS5wcm9jZXNzVGVtcHMoKTsgLy8gc3RhcnQgcG9sbGluZ1xuICAgIH0pO1xuICAvLyBzY29wZSB3YXRjaFxuICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsZnVuY3Rpb24obmV3VmFsdWUsb2xkVmFsdWUpe1xuICAgIEJyZXdTZXJ2aWNlLnNldHRpbmdzKCdzZXR0aW5ncycsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICRzY29wZS4kd2F0Y2goJ2tldHRsZXMnLGZ1bmN0aW9uKG5ld1ZhbHVlLG9sZFZhbHVlKXtcbiAgICBCcmV3U2VydmljZS5zZXR0aW5ncygna2V0dGxlcycsbmV3VmFsdWUpO1xuICB9LHRydWUpO1xuXG4gICRzY29wZS4kd2F0Y2goJ3NoYXJlJyxmdW5jdGlvbihuZXdWYWx1ZSxvbGRWYWx1ZSl7XG4gICAgQnJld1NlcnZpY2Uuc2V0dGluZ3MoJ3NoYXJlJyxuZXdWYWx1ZSk7XG4gIH0sdHJ1ZSk7XG59KTtcblxuJCggZG9jdW1lbnQgKS5yZWFkeShmdW5jdGlvbigpIHtcbiAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2pzL2NvbnRyb2xsZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5kaXJlY3RpdmUoJ2VkaXRhYmxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHttb2RlbDonPScsdHlwZTonQD8nLHRyaW06J0A/JyxjaGFuZ2U6JyY/JyxlbnRlcjonJj8nLHBsYWNlaG9sZGVyOidAPyd9LFxuICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgdGVtcGxhdGU6XG4nPHNwYW4+JytcbiAgICAnPGlucHV0IHR5cGU9XCJ7e3R5cGV9fVwiIG5nLW1vZGVsPVwibW9kZWxcIiBuZy1zaG93PVwiZWRpdFwiIG5nLWVudGVyPVwiZWRpdD1mYWxzZVwiIG5nLWNoYW5nZT1cInt7Y2hhbmdlfHxmYWxzZX19XCIgY2xhc3M9XCJlZGl0YWJsZVwiPjwvaW5wdXQ+JytcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdGFibGVcIiBuZy1zaG93PVwiIWVkaXRcIj57eyh0cmltKSA/ICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKChtb2RlbCB8fCBwbGFjZWhvbGRlcikgfCBsaW1pdFRvOnRyaW0pK1wiLi4uXCIpIDonK1xuICAgICAgICAnICgodHlwZT09XCJwYXNzd29yZFwiKSA/IFwiKioqKioqKlwiIDogKG1vZGVsIHx8IHBsYWNlaG9sZGVyKSl9fTwvc3Bhbj4nK1xuJzwvc3Bhbj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIHNjb3BlLmVkaXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnR5cGUgPSAhIXNjb3BlLnR5cGUgPyBzY29wZS50eXBlIDogJ3RleHQnO1xuICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5lZGl0ID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHNjb3BlLmVudGVyKSBzY29wZS5lbnRlcigpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGUuY2hhckNvZGUgPT09IDEzIHx8IGUua2V5Q29kZSA9PT0xMyApIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLm5nRW50ZXIpO1xuICAgICAgICAgICAgICBpZihzY29wZS5jaGFuZ2UpXG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmNoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgnb25SZWFkRmlsZScsIGZ1bmN0aW9uICgkcGFyc2UpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHNjb3BlOiBmYWxzZSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciBmbiA9ICRwYXJzZShhdHRycy5vblJlYWRGaWxlKTtcblxuXHRcdFx0ZWxlbWVudC5vbignY2hhbmdlJywgZnVuY3Rpb24ob25DaGFuZ2VFdmVudCkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGZpbGUgPSAob25DaGFuZ2VFdmVudC5zcmNFbGVtZW50IHx8IG9uQ2hhbmdlRXZlbnQudGFyZ2V0KS5maWxlc1swXTtcbiAgICAgICAgdmFyIGV4dGVuc2lvbiA9IChmaWxlKSA/IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24ob25Mb2FkRXZlbnQpIHtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihzY29wZSwgeyRmaWxlQ29udGVudDogb25Mb2FkRXZlbnQudGFyZ2V0LnJlc3VsdCwgJGV4dDogZXh0ZW5zaW9ufSk7XG4gICAgICAgICAgICBlbGVtZW50LnZhbChudWxsKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9kaXJlY3RpdmVzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5maWx0ZXIoJ21vbWVudCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgICBpZighZGF0ZSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgaWYoZm9ybWF0KVxuICAgICAgICByZXR1cm4gbW9tZW50KGRhdGUudG9TdHJpbmcoKSkuZm9ybWF0KGZvcm1hdCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBtb21lbnQoZGF0ZS50b1N0cmluZygpKS5mcm9tTm93KCk7XG4gICAgfTtcbn0pXG4uZmlsdGVyKCdmb3JtYXREZWdyZWVzJywgZnVuY3Rpb24oJGZpbHRlcikge1xuICByZXR1cm4gZnVuY3Rpb24odGVtcCx1bml0KSB7XG4gICAgaWYodW5pdD09J0YnKVxuICAgICAgcmV0dXJuICRmaWx0ZXIoJ3RvRmFocmVuaGVpdCcpKHRlbXApO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAkZmlsdGVyKCd0b0NlbHNpdXMnKSh0ZW1wKTtcbiAgfTtcbn0pXG4uZmlsdGVyKCd0b0ZhaHJlbmhlaXQnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNlbHNpdXMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChjZWxzaXVzKjkvNSszMik7XG4gIH07XG59KVxuLmZpbHRlcigndG9DZWxzaXVzJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihmYWhyZW5oZWl0KSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKGZhaHJlbmhlaXQtMzIpKjUvOSk7XG4gIH07XG59KVxuLmZpbHRlcignaGlnaGxpZ2h0JywgZnVuY3Rpb24oJHNjZSkge1xuICByZXR1cm4gZnVuY3Rpb24odGV4dCwgcGhyYXNlKSB7XG4gICAgaWYgKHRleHQgJiYgcGhyYXNlKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJygnK3BocmFzZSsnKScsICdnaScpLCAnPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRlZFwiPiQxPC9zcGFuPicpO1xuICAgIH0gZWxzZSBpZighdGV4dCl7XG4gICAgICB0ZXh0ID0gJyc7XG4gICAgfVxuICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKHRleHQudG9TdHJpbmcoKSk7XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9maWx0ZXJzLmpzIiwiYW5ndWxhci5tb2R1bGUoJ2JyZXdiZW5jaC1tb25pdG9yJylcbi5mYWN0b3J5KCdCcmV3U2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJGZpbHRlcil7XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vY29va2llcyBzaXplIDQwOTYgYnl0ZXNcbiAgICBjbGVhcjogZnVuY3Rpb24oKXtcbiAgICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2Upe1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NldHRpbmdzJyk7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgna2V0dGxlcycpO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3NoYXJlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9sbFNlY29uZHM6IDEwXG4gICAgICAgICx1bml0OiAnRidcbiAgICAgICAgLGxheW91dDogJ2NhcmQnXG4gICAgICAgICxjaGFydDogdHJ1ZVxuICAgICAgICAsc2hhcmVkOiBmYWxzZVxuICAgICAgICAscmVjaXBlOiB7J25hbWUnOicnLCdicmV3ZXInOntuYW1lOicnLCdlbWFpbCc6Jyd9LCd5ZWFzdCc6W10sJ2hvcHMnOltdLCdncmFpbnMnOltdLHNjYWxlOidncmF2aXR5JyxtZXRob2Q6J3BhcGF6aWFuJywnb2cnOjEuMDUwLCdmZyc6MS4wMTAsJ2Fidic6MCwnYWJ3JzowLCdjYWxvcmllcyc6MCwnYXR0ZW51YXRpb24nOjB9XG4gICAgICAgICxub3RpZmljYXRpb25zOiB7b246dHJ1ZSx0aW1lcnM6dHJ1ZSxoaWdoOnRydWUsbG93OnRydWUsdGFyZ2V0OnRydWUsc2xhY2s6JycsbGFzdDonJ31cbiAgICAgICAgLHNvdW5kczoge29uOnRydWUsYWxlcnQ6Jy9hc3NldHMvYXVkaW8vYmlrZS5tcDMnLHRpbWVyOicvYXNzZXRzL2F1ZGlvL3NjaG9vbC5tcDMnfVxuICAgICAgICAsYWNjb3VudDoge2FwaUtleTogJycsIHNlc3Npb25zOiBbXX1cbiAgICAgICAgLGluZmx1eGRiOiB7dXJsOiAnJywgcG9ydDogODA4NiwgdXNlcjogJycsIHBhc3M6ICcnLCBkYjogJycsIGRiczpbXSwgY29ubmVjdGVkOiBmYWxzZX1cbiAgICAgICAgLGFyZHVpbm9zOiBbe1xuICAgICAgICAgIGlkOiBidG9hKCdicmV3YmVuY2gnKSxcbiAgICAgICAgICB1cmw6ICdhcmR1aW5vLmxvY2FsJyxcbiAgICAgICAgICBhbmFsb2c6IDUsXG4gICAgICAgICAgZGlnaXRhbDogMTMsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZVxuICAgICAgICB9XVxuICAgICAgICAsdHBsaW5rOiB7dXNlcjogJycsIHBhc3M6ICcnLCB0b2tlbjonJywgcGx1Z3M6IFtdfVxuICAgICAgICAsc2tldGNoZXM6IHtmcmVxdWVuY3k6IDYwLCBpZ25vcmVfdmVyc2lvbl9lcnJvcjogZmFsc2V9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S25vYk9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFkT25seTogdHJ1ZSxcbiAgICAgICAgdW5pdDogJ1xcdTAwQjAnLFxuICAgICAgICBzdWJUZXh0OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICBjb2xvcjogJ2dyYXknLFxuICAgICAgICAgIGZvbnQ6ICdhdXRvJ1xuICAgICAgICB9LFxuICAgICAgICB0cmFja1dpZHRoOiA0MCxcbiAgICAgICAgYmFyV2lkdGg6IDI1LFxuICAgICAgICBiYXJDYXA6IDI1LFxuICAgICAgICB0cmFja0NvbG9yOiAnI2RkZCcsXG4gICAgICAgIGJhckNvbG9yOiAnIzc3NycsXG4gICAgICAgIGR5bmFtaWNPcHRpb25zOiB0cnVlLFxuICAgICAgICBkaXNwbGF5UHJldmlvdXM6IHRydWUsXG4gICAgICAgIHByZXZCYXJDb2xvcjogJyM3NzcnXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWZhdWx0S2V0dGxlczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICAgIGtleTogJ0hvdCBMaXF1b3InXG4gICAgICAgICAgLHR5cGU6ICd3YXRlcidcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDInLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0QzJyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMCcsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoxNzAsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgICAgICB9LHtcbiAgICAgICAgICBrZXk6ICdNYXNoJ1xuICAgICAgICAgICx0eXBlOiAnZ3JhaW4nXG4gICAgICAgICAgLGFjdGl2ZTogZmFsc2VcbiAgICAgICAgICAsc3RpY2t5OiBmYWxzZVxuICAgICAgICAgICxoZWF0ZXI6IHtwaW46J0Q0JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICxwdW1wOiB7cGluOidENScscnVubmluZzpmYWxzZSxhdXRvOmZhbHNlLHB3bTpmYWxzZSxkdXR5Q3ljbGU6MTAwLHNrZXRjaDpmYWxzZX1cbiAgICAgICAgICAsdGVtcDoge3BpbjonQTEnLHR5cGU6J1RoZXJtaXN0b3InLGhpdDpmYWxzZSxjdXJyZW50OjAscHJldmlvdXM6MCxhZGp1c3Q6MCx0YXJnZXQ6MTUyLGRpZmY6Mn1cbiAgICAgICAgICAsdmFsdWVzOiBbXVxuICAgICAgICAgICx0aW1lcnM6IFtdXG4gICAgICAgICAgLGtub2I6IGFuZ3VsYXIuY29weSh0aGlzLmRlZmF1bHRLbm9iT3B0aW9ucygpLHt2YWx1ZTowLG1pbjowLG1heDoyMjB9KVxuICAgICAgICAgICxhcmR1aW5vOiB7aWQ6IGJ0b2EoJ2JyZXdiZW5jaCcpLCB1cmw6ICdhcmR1aW5vLmxvY2FsJyxhbmFsb2c6IDUsZGlnaXRhbDogMTN9XG4gICAgICAgICAgLGVycm9yOiB7bWVzc2FnZTonJyx2ZXJzaW9uOicnfVxuICAgICAgICAgICxub3RpZnk6IHtzbGFjazogZmFsc2UsIGR3ZWV0OiBmYWxzZX1cbiAgICAgICAgfSx7XG4gICAgICAgICAga2V5OiAnQm9pbCdcbiAgICAgICAgICAsdHlwZTogJ2hvcCdcbiAgICAgICAgICAsYWN0aXZlOiBmYWxzZVxuICAgICAgICAgICxzdGlja3k6IGZhbHNlXG4gICAgICAgICAgLGhlYXRlcjoge3BpbjonRDYnLHJ1bm5pbmc6ZmFsc2UsYXV0bzpmYWxzZSxwd206ZmFsc2UsZHV0eUN5Y2xlOjEwMCxza2V0Y2g6ZmFsc2V9XG4gICAgICAgICAgLHB1bXA6IHtwaW46J0Q3JyxydW5uaW5nOmZhbHNlLGF1dG86ZmFsc2UscHdtOmZhbHNlLGR1dHlDeWNsZToxMDAsc2tldGNoOmZhbHNlfVxuICAgICAgICAgICx0ZW1wOiB7cGluOidBMicsdHlwZTonVGhlcm1pc3RvcicsaGl0OmZhbHNlLGN1cnJlbnQ6MCxwcmV2aW91czowLGFkanVzdDowLHRhcmdldDoyMDAsZGlmZjoyfVxuICAgICAgICAgICx2YWx1ZXM6IFtdXG4gICAgICAgICAgLHRpbWVyczogW11cbiAgICAgICAgICAsa25vYjogYW5ndWxhci5jb3B5KHRoaXMuZGVmYXVsdEtub2JPcHRpb25zKCkse3ZhbHVlOjAsbWluOjAsbWF4OjIyMH0pXG4gICAgICAgICAgLGFyZHVpbm86IHtpZDogYnRvYSgnYnJld2JlbmNoJyksIHVybDogJ2FyZHVpbm8ubG9jYWwnLGFuYWxvZzogNSxkaWdpdGFsOiAxM31cbiAgICAgICAgICAsZXJyb3I6IHttZXNzYWdlOicnLHZlcnNpb246Jyd9XG4gICAgICAgICAgLG5vdGlmeToge3NsYWNrOiBmYWxzZSwgZHdlZXQ6IGZhbHNlfVxuICAgICAgICB9XTtcbiAgICB9LFxuXG4gICAgc2V0dGluZ3M6IGZ1bmN0aW9uKGtleSx2YWx1ZXMpe1xuICAgICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB0cnkge1xuICAgICAgICBpZih2YWx1ZXMpe1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpe1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgLypKU09OIHBhcnNlIGVycm9yKi9cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSxcblxuICAgIHNlbnNvclR5cGVzOiBmdW5jdGlvbihuYW1lKXtcbiAgICAgIGxldCBzZW5zb3JzID0gW1xuICAgICAgICB7bmFtZTogJ1RoZXJtaXN0b3InLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IGZhbHNlfVxuICAgICAgICAse25hbWU6ICdEUzE4QjIwJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnUFQxMDAnLCBhbmFsb2c6IHRydWUsIGRpZ2l0YWw6IHRydWV9XG4gICAgICAgICx7bmFtZTogJ0RIVDExJywgYW5hbG9nOiBmYWxzZSwgZGlnaXRhbDogdHJ1ZX1cbiAgICAgICAgLHtuYW1lOiAnREhUMjEnLCBhbmFsb2c6IGZhbHNlLCBkaWdpdGFsOiB0cnVlfVxuICAgICAgICAse25hbWU6ICdESFQyMicsIGFuYWxvZzogZmFsc2UsIGRpZ2l0YWw6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYobmFtZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHNlbnNvcnMsIHsnbmFtZSc6IG5hbWV9KVswXTtcbiAgICAgIHJldHVybiBzZW5zb3JzO1xuICAgIH0sXG5cbiAgICBrZXR0bGVUeXBlczogZnVuY3Rpb24odHlwZSl7XG4gICAgICBsZXQga2V0dGxlcyA9IFtcbiAgICAgICAgeyduYW1lJzonQm9pbCcsJ3R5cGUnOidob3AnLCd0YXJnZXQnOjIwMCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J01hc2gnLCd0eXBlJzonZ3JhaW4nLCd0YXJnZXQnOjE1MiwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0hvdCBMaXF1b3InLCd0eXBlJzond2F0ZXInLCd0YXJnZXQnOjE3MCwnZGlmZic6Mn1cbiAgICAgICAgLHsnbmFtZSc6J0Zlcm1lbnRlcicsJ3R5cGUnOidmZXJtZW50ZXInLCd0YXJnZXQnOjc0LCdkaWZmJzoyfVxuICAgICAgICAseyduYW1lJzonQWlyJywndHlwZSc6J2FpcicsJ3RhcmdldCc6NzQsJ2RpZmYnOjJ9XG4gICAgICBdO1xuICAgICAgaWYodHlwZSlcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGtldHRsZXMsIHsndHlwZSc6IHR5cGV9KVswXTtcbiAgICAgIHJldHVybiBrZXR0bGVzO1xuICAgIH0sXG5cbiAgICBkb21haW46IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgbGV0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncygnc2V0dGluZ3MnKTtcbiAgICAgIGxldCBkb21haW4gPSAnaHR0cDovL2FyZHVpbm8ubG9jYWwnO1xuXG4gICAgICBpZihhcmR1aW5vICYmIGFyZHVpbm8udXJsKXtcbiAgICAgICAgZG9tYWluID0gKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykgIT09IC0xKSA/XG4gICAgICAgICAgYXJkdWluby51cmwuc3Vic3RyKGFyZHVpbm8udXJsLmluZGV4T2YoJy8vJykrMikgOlxuICAgICAgICAgIGFyZHVpbm8udXJsO1xuXG4gICAgICAgIGlmKCEhYXJkdWluby5zZWN1cmUpXG4gICAgICAgICAgZG9tYWluID0gYGh0dHBzOi8vJHtkb21haW59YDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGRvbWFpbiA9IGBodHRwOi8vJHtkb21haW59YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9LFxuXG4gICAgc2xhY2s6IGZ1bmN0aW9uKHdlYmhvb2tfdXJsLCBtc2csIGNvbG9yLCBpY29uLCBrZXR0bGUpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuXG4gICAgICBsZXQgcG9zdE9iaiA9IHsnYXR0YWNobWVudHMnOiBbeydmYWxsYmFjayc6IG1zZyxcbiAgICAgICAgICAgICd0aXRsZSc6IGtldHRsZS5rZXksXG4gICAgICAgICAgICAndGl0bGVfbGluayc6ICdodHRwOi8vJytkb2N1bWVudC5sb2NhdGlvbi5ob3N0LFxuICAgICAgICAgICAgJ2ZpZWxkcyc6IFt7J3ZhbHVlJzogbXNnfV0sXG4gICAgICAgICAgICAnY29sb3InOiBjb2xvcixcbiAgICAgICAgICAgICdtcmtkd25faW4nOiBbJ3RleHQnLCAnZmFsbGJhY2snLCAnZmllbGRzJ10sXG4gICAgICAgICAgICAndGh1bWJfdXJsJzogaWNvblxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICRodHRwKHt1cmw6IHdlYmhvb2tfdXJsLCBtZXRob2Q6J1BPU1QnLCBkYXRhOiAncGF5bG9hZD0nK0pTT04uc3RyaW5naWZ5KHBvc3RPYmopLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9fSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICAvLyBUaGVybWlzdG9yLCBEUzE4QjIwLCBvciBQVDEwMFxuICAgIC8vIGh0dHBzOi8vbGVhcm4uYWRhZnJ1aXQuY29tL3RoZXJtaXN0b3IvdXNpbmctYS10aGVybWlzdG9yXG4gICAgLy8gaHR0cHM6Ly93d3cuYWRhZnJ1aXQuY29tL3Byb2R1Y3QvMzgxKVxuICAgIC8vIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMyOTAgYW5kIGh0dHBzOi8vd3d3LmFkYWZydWl0LmNvbS9wcm9kdWN0LzMzMjhcbiAgICB0ZW1wOiBmdW5jdGlvbihrZXR0bGUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby8nK2tldHRsZS50ZW1wLnR5cGUrJy8nK2tldHRsZS50ZW1wLnBpbjtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwMH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZighc2V0dGluZ3Muc2hhcmVkICYmXG4gICAgICAgICAgICAhc2V0dGluZ3Muc2tldGNoZXMuaWdub3JlX3ZlcnNpb25fZXJyb3IgJiZcbiAgICAgICAgICAgIChyZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPT0gbnVsbCB8fCByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJykgPCBzZXR0aW5ncy5za2V0Y2hfdmVyc2lvbikpe1xuICAgICAgICAgICAgcS5yZWplY3Qoe3ZlcnNpb246IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcbiAgICAvLyByZWFkL3dyaXRlIGhlYXRlclxuICAgIC8vIGh0dHA6Ly9hcmR1aW5vdHJvbmljcy5ibG9nc3BvdC5jb20vMjAxMy8wMS93b3JraW5nLXdpdGgtc2FpbnNtYXJ0LTV2LXJlbGF5LWJvYXJkLmh0bWxcbiAgICAvLyBodHRwOi8vbXlob3d0b3NhbmRwcm9qZWN0cy5ibG9nc3BvdC5jb20vMjAxNC8wMi9zYWluc21hcnQtMi1jaGFubmVsLTV2LXJlbGF5LWFyZHVpbm8uaHRtbFxuICAgIGRpZ2l0YWw6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdmFsdWUpe1xuICAgICAgaWYoIWtldHRsZS5hcmR1aW5vKSByZXR1cm4gJHEucmVqZWN0KCdTZWxlY3QgYW4gYXJkdWlubyB0byB1c2UuJyk7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgdXJsID0gdGhpcy5kb21haW4oa2V0dGxlLmFyZHVpbm8pKycvYXJkdWluby9kaWdpdGFsLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgYW5hbG9nOiBmdW5jdGlvbihrZXR0bGUsc2Vuc29yLHZhbHVlKXtcbiAgICAgIGlmKCFrZXR0bGUuYXJkdWlubykgcmV0dXJuICRxLnJlamVjdCgnU2VsZWN0IGFuIGFyZHVpbm8gdG8gdXNlLicpO1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHVybCA9IHRoaXMuZG9tYWluKGtldHRsZS5hcmR1aW5vKSsnL2FyZHVpbm8vYW5hbG9nLycrc2Vuc29yKycvJyt2YWx1ZTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQgaGVhZGVycyA9IHt9O1xuXG4gICAgICBpZihrZXR0bGUuYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcrYnRvYSgncm9vdDonK2tldHRsZS5hcmR1aW5vLnBhc3N3b3JkKTtcblxuICAgICAgJGh0dHAoe3VybDogdXJsLCBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzLCB0aW1lb3V0OiBzZXR0aW5ncy5wb2xsU2Vjb25kcyoxMDAwfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmKCFzZXR0aW5ncy5zaGFyZWQgJiZcbiAgICAgICAgICAgICFzZXR0aW5ncy5za2V0Y2hlcy5pZ25vcmVfdmVyc2lvbl9lcnJvciAmJlxuICAgICAgICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA9PSBudWxsIHx8IHJlc3BvbnNlLmhlYWRlcnMoJ1gtU2tldGNoLVZlcnNpb24nKSA8IHNldHRpbmdzLnNrZXRjaF92ZXJzaW9uKSl7XG4gICAgICAgICAgICBxLnJlamVjdCh7dmVyc2lvbjogcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZGlnaXRhbFJlYWQ6IGZ1bmN0aW9uKGtldHRsZSxzZW5zb3IsdGltZW91dCl7XG4gICAgICBpZigha2V0dGxlLmFyZHVpbm8pIHJldHVybiAkcS5yZWplY3QoJ1NlbGVjdCBhbiBhcmR1aW5vIHRvIHVzZS4nKTtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCB1cmwgPSB0aGlzLmRvbWFpbihrZXR0bGUuYXJkdWlubykrJy9hcmR1aW5vL2RpZ2l0YWwvJytzZW5zb3I7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGhlYWRlcnMgPSB7fTtcblxuICAgICAgaWYoa2V0dGxlLmFyZHVpbm8ucGFzc3dvcmQpXG4gICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnK2J0b2EoJ3Jvb3Q6JytrZXR0bGUuYXJkdWluby5wYXNzd29yZCk7XG5cbiAgICAgICRodHRwKHt1cmw6IHVybCwgbWV0aG9kOiAnR0VUJywgaGVhZGVyczogaGVhZGVycywgdGltZW91dDogKHRpbWVvdXQgfHwgc2V0dGluZ3MucG9sbFNlY29uZHMqMTAwMCl9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYoIXNldHRpbmdzLnNoYXJlZCAmJlxuICAgICAgICAgICAgIXNldHRpbmdzLnNrZXRjaGVzLmlnbm9yZV92ZXJzaW9uX2Vycm9yICYmXG4gICAgICAgICAgICAocmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpID09IG51bGwgfHwgcmVzcG9uc2UuaGVhZGVycygnWC1Ta2V0Y2gtVmVyc2lvbicpIDwgc2V0dGluZ3Muc2tldGNoX3ZlcnNpb24pKXtcbiAgICAgICAgICAgIHEucmVqZWN0KHt2ZXJzaW9uOiByZXNwb25zZS5oZWFkZXJzKCdYLVNrZXRjaC1WZXJzaW9uJyl9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb2FkU2hhcmVGaWxlOiBmdW5jdGlvbihmaWxlLCBwYXNzd29yZCl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgcXVlcnkgPSAnJztcbiAgICAgIGlmKHBhc3N3b3JkKVxuICAgICAgICBxdWVyeSA9ICc/cGFzc3dvcmQ9JyttZDUocGFzc3dvcmQpO1xuICAgICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZ2V0LycrZmlsZStxdWVyeSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgLy8gVE9ETyBmaW5pc2ggdGhpc1xuICAgIC8vIGRlbGV0ZVNoYXJlRmlsZTogZnVuY3Rpb24oZmlsZSwgcGFzc3dvcmQpe1xuICAgIC8vICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgIC8vICAgJGh0dHAoe3VybDogJ2h0dHBzOi8vbW9uaXRvci5icmV3YmVuY2guY28vc2hhcmUvZGVsZXRlLycrZmlsZSwgbWV0aG9kOiAnR0VUJ30pXG4gICAgLy8gICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAvLyAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAvLyB9LFxuXG4gICAgY3JlYXRlU2hhcmU6IGZ1bmN0aW9uKHNoYXJlKXtcbiAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICBsZXQga2V0dGxlcyA9IHRoaXMuc2V0dGluZ3MoJ2tldHRsZXMnKTtcbiAgICAgIGxldCBzaCA9IE9iamVjdC5hc3NpZ24oe30sIHtwYXNzd29yZDogc2hhcmUucGFzc3dvcmQsIGFjY2Vzczogc2hhcmUuYWNjZXNzfSk7XG4gICAgICAvL3JlbW92ZSBzb21lIHRoaW5ncyB3ZSBkb24ndCBuZWVkIHRvIHNoYXJlXG4gICAgICBfLmVhY2goa2V0dGxlcywgKGtldHRsZSwgaSkgPT4ge1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS5rbm9iO1xuICAgICAgICBkZWxldGUga2V0dGxlc1tpXS52YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5hY2NvdW50O1xuICAgICAgZGVsZXRlIHNldHRpbmdzLm5vdGlmaWNhdGlvbnM7XG4gICAgICBzZXR0aW5ncy5zaGFyZWQgPSB0cnVlO1xuICAgICAgaWYoc2gucGFzc3dvcmQpXG4gICAgICAgIHNoLnBhc3N3b3JkID0gbWQ1KHNoLnBhc3N3b3JkKTtcbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2NyZWF0ZS8nLFxuICAgICAgICAgIG1ldGhvZDonUE9TVCcsXG4gICAgICAgICAgZGF0YTogeydzaGFyZSc6IHNoLCAnc2V0dGluZ3MnOiBzZXR0aW5ncywgJ2tldHRsZXMnOiBrZXR0bGVzfSxcbiAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBzaGFyZVRlc3Q6IGZ1bmN0aW9uKGFyZHVpbm8pe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgbGV0IHF1ZXJ5ID0gYHVybD0ke2FyZHVpbm8udXJsfWBcblxuICAgICAgaWYoYXJkdWluby5wYXNzd29yZClcbiAgICAgICAgcXVlcnkgKz0gJyZhdXRoPScrYnRvYSgncm9vdDonK2FyZHVpbm8ucGFzc3dvcmQpO1xuXG4gICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9tb25pdG9yLmJyZXdiZW5jaC5jby9zaGFyZS90ZXN0Lz8nK3F1ZXJ5LCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBpcDogZnVuY3Rpb24oYXJkdWlubyl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHt1cmw6ICdodHRwczovL21vbml0b3IuYnJld2JlbmNoLmNvL3NoYXJlL2lwJywgbWV0aG9kOiAnR0VUJ30pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZHdlZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbGF0ZXN0OiAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvbGF0ZXN0L2R3ZWV0L2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYWxsOiAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAkaHR0cCh7dXJsOiAnaHR0cHM6Ly9kd2VldC5pby9nZXQvZHdlZXRzL2Zvci9icmV3YmVuY2gnLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdHBsaW5rOiBmdW5jdGlvbigpe1xuICAgICAgY29uc3QgdXJsID0gXCJodHRwczovL3dhcC50cGxpbmtjbG91ZC5jb21cIjtcbiAgICAgIGxldCBwYXJhbXMgPSB7XG4gICAgICAgIGFwcE5hbWU6ICdLYXNhX0FuZHJvaWQnLFxuICAgICAgICB0ZXJtSUQ6ICdCcmV3QmVuY2gnLFxuICAgICAgICBhcHBWZXI6ICcxLjQuNC42MDcnLFxuICAgICAgICBvc3BmOiAnQW5kcm9pZCs2LjAuMScsXG4gICAgICAgIG5ldFR5cGU6ICd3aWZpJyxcbiAgICAgICAgbG9jYWxlOiAnZXNfRU4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgaWYoc2V0dGluZ3MudHBsaW5rLnRva2VuKXtcbiAgICAgICAgICAgIHBhcmFtcy50b2tlbiA9IHNldHRpbmdzLnRwbGluay50b2tlbjtcbiAgICAgICAgICAgIHJldHVybiB1cmwrJy8/JytqUXVlcnkucGFyYW0ocGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9LFxuICAgICAgICBsb2dpbjogKHVzZXIscGFzcykgPT4ge1xuICAgICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICBpZighdXNlciB8fCAhcGFzcylcbiAgICAgICAgICAgIHJldHVybiBxLnJlamVjdCgnSW52YWxpZCBMb2dpbicpO1xuICAgICAgICAgIGNvbnN0IGxvZ2luX3BheWxvYWQgPSB7XG4gICAgICAgICAgICBcIm1ldGhvZFwiOiBcImxvZ2luXCIsXG4gICAgICAgICAgICBcInVybFwiOiB1cmwsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiYXBwVHlwZVwiOiBcIkthc2FfQW5kcm9pZFwiLFxuICAgICAgICAgICAgICBcImNsb3VkUGFzc3dvcmRcIjogcGFzcyxcbiAgICAgICAgICAgICAgXCJjbG91ZFVzZXJOYW1lXCI6IHVzZXIsXG4gICAgICAgICAgICAgIFwidGVybWluYWxVVUlEXCI6IHBhcmFtcy50ZXJtSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRodHRwKHt1cmw6IHVybCxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShsb2dpbl9wYXlsb2FkKSxcbiAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlblxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnJlc3VsdCl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2NhbjogKHRva2VuKSA9PiB7XG4gICAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgdG9rZW4gPSB0b2tlbiB8fCBzZXR0aW5ncy50cGxpbmsudG9rZW47XG4gICAgICAgICAgaWYoIXRva2VuKVxuICAgICAgICAgICAgcmV0dXJuIHEucmVqZWN0KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgICAgICAgJGh0dHAoe3VybDogdXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7dG9rZW46IHRva2VufSxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6IFwiZ2V0RGV2aWNlTGlzdFwiIH0pLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ31cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9LFxuICAgICAgICBjb21tYW5kOiAoZGV2aWNlLCBjb21tYW5kKSA9PiB7XG4gICAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAgIGxldCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MoJ3NldHRpbmdzJyk7XG4gICAgICAgICAgbGV0IHRva2VuID0gc2V0dGluZ3MudHBsaW5rLnRva2VuO1xuICAgICAgICAgIGxldCBwYXlsb2FkID0ge1xuICAgICAgICAgICAgXCJtZXRob2RcIjpcInBhc3N0aHJvdWdoXCIsXG4gICAgICAgICAgICBcInBhcmFtc1wiOiB7XG4gICAgICAgICAgICAgIFwiZGV2aWNlSWRcIjogZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgICAgICBcInJlcXVlc3REYXRhXCI6IEpTT04uc3RyaW5naWZ5KCBjb21tYW5kIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHNldCB0aGUgdG9rZW5cbiAgICAgICAgICBpZighdG9rZW4pXG4gICAgICAgICAgICByZXR1cm4gcS5yZWplY3QoJ0ludmFsaWQgdG9rZW4nKTtcbiAgICAgICAgICBwYXJhbXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAkaHR0cCh7dXJsOiBkZXZpY2UuYXBwU2VydmVyVXJsLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIG9uOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJzZXRfcmVsYXlfc3RhdGVcIjp7XCJzdGF0ZVwiOiAxIH19fTtcbiAgICAgICAgICByZXR1cm4gdGhpcy50cGxpbmsoKS5jb21tYW5kKGRldmljZSwgY29tbWFuZCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9mZjogKGRldmljZSkgPT4ge1xuICAgICAgICAgIGxldCBjb21tYW5kID0ge1wic3lzdGVtXCI6e1wic2V0X3JlbGF5X3N0YXRlXCI6e1wic3RhdGVcIjogMCB9fX07XG4gICAgICAgICAgcmV0dXJuIHRoaXMudHBsaW5rKCkuY29tbWFuZChkZXZpY2UsIGNvbW1hbmQpO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbW1hbmQgPSB7XCJzeXN0ZW1cIjp7XCJnZXRfc3lzaW5mb1wiOm51bGx9LFwiZW1ldGVyXCI6e1wiZ2V0X3JlYWx0aW1lXCI6bnVsbH19O1xuICAgICAgICAgIHJldHVybiB0aGlzLnRwbGluaygpLmNvbW1hbmQoZGV2aWNlLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgaW5mbHV4ZGI6IGZ1bmN0aW9uKCl7XG4gICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBsZXQgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKCdzZXR0aW5ncycpO1xuICAgICAgbGV0IGluZmx1eENvbm5lY3Rpb24gPSBgJHtzZXR0aW5ncy5pbmZsdXhkYi51cmx9YDtcbiAgICAgIGlmKCAhIXNldHRpbmdzLmluZmx1eGRiLnBvcnQgKVxuICAgICAgICBpbmZsdXhDb25uZWN0aW9uICs9IGA6JHtzZXR0aW5ncy5pbmZsdXhkYi5wb3J0fWBcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGluZzogKCkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3BpbmdgLCBtZXRob2Q6ICdHRVQnfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGJzOiAoKSA9PiB7XG4gICAgICAgICAgJGh0dHAoe3VybDogYCR7aW5mbHV4Q29ubmVjdGlvbn0vcXVlcnk/dT0ke3NldHRpbmdzLmluZmx1eGRiLnVzZXJ9JnA9JHtzZXR0aW5ncy5pbmZsdXhkYi5wYXNzfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdzaG93IGRhdGFiYXNlcycpfWAsIG1ldGhvZDogJ0dFVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzICYmXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHRzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXMgJiZcbiAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnJlc3VsdHNbMF0uc2VyaWVzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzICl7XG4gICAgICAgICAgICAgICAgcS5yZXNvbHZlKHJlc3BvbnNlLmRhdGEucmVzdWx0c1swXS5zZXJpZXNbMF0udmFsdWVzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBxLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZURCOiAobmFtZSkgPT4ge1xuICAgICAgICAgICRodHRwKHt1cmw6IGAke2luZmx1eENvbm5lY3Rpb259L3F1ZXJ5P3U9JHtzZXR0aW5ncy5pbmZsdXhkYi51c2VyfSZwPSR7c2V0dGluZ3MuaW5mbHV4ZGIucGFzc30mcT0ke2VuY29kZVVSSUNvbXBvbmVudChgQ1JFQVRFIERBVEFCQVNFIFwiJHtuYW1lfVwiYCl9YCwgbWV0aG9kOiAnUE9TVCd9KVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBxLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBwa2c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvcGFja2FnZS5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgZ3JhaW5zOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL2dyYWlucy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGhvcHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBxID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvaG9wcy5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIHdhdGVyOiBmdW5jdGlvbigpe1xuICAgICAgICBsZXQgcSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCgnL2Fzc2V0cy9kYXRhL3dhdGVyLmpzb24nKVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3R5bGVzOiBmdW5jdGlvbigpe1xuICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAuZ2V0KCcvYXNzZXRzL2RhdGEvc3R5bGVndWlkZS5qc29uJylcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHEucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcS5yZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gcS5wcm9taXNlO1xuICAgIH0sXG5cbiAgICBsb3ZpYm9uZDogZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHEgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQoJy9hc3NldHMvZGF0YS9sb3ZpYm9uZC5qc29uJylcbiAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBxLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHEucmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBxLnByb21pc2U7XG4gICAgfSxcblxuICAgIGNoYXJ0T3B0aW9uczogZnVuY3Rpb24odW5pdCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB0eXBlOiAnbGluZUNoYXJ0JyxcbiAgICAgICAgICAgICAgbm9EYXRhOiAnQnJld0JlbmNoIExpdmUnLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgbWFyZ2luIDoge1xuICAgICAgICAgICAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAyMCxcbiAgICAgICAgICAgICAgICAgIGJvdHRvbTogMTAwLFxuICAgICAgICAgICAgICAgICAgbGVmdDogNjVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzBdIDogZDsgfSxcbiAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZCl7IHJldHVybiAoZCAmJiBkLmxlbmd0aCkgPyBkWzFdIDogZDsgfSxcbiAgICAgICAgICAgICAgLy8gYXZlcmFnZTogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZWFuIH0sXG5cbiAgICAgICAgICAgICAgY29sb3I6IGQzLnNjYWxlLmNhdGVnb3J5MTAoKS5yYW5nZSgpLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZUd1aWRlbGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgY2xpcFZvcm9ub2k6IGZhbHNlLFxuXG4gICAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tGb3JtYXQ6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMudGltZS5mb3JtYXQoJyVJOiVNOiVTJykobmV3IERhdGUoZCkpXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnYm90dG9tJyxcbiAgICAgICAgICAgICAgICAgIHRpY2tQYWRkaW5nOiAyMCxcbiAgICAgICAgICAgICAgICAgIGF4aXNMYWJlbERpc3RhbmNlOiA0MCxcbiAgICAgICAgICAgICAgICAgIHN0YWdnZXJMYWJlbHM6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZm9yY2VZOiAoIXVuaXQgfHwgdW5pdD09J0YnKSA/IFswLDIyMF0gOiBbLTE3LDEwNF0sXG4gICAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgICBheGlzTGFiZWw6ICdUZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgICB0aWNrRm9ybWF0OiBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZCsnXFx1MDBCMCc7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgb3JpZW50OiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgICBzaG93TWF4TWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsRGlzdGFuY2U6IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vMjAxMS8wNi8xNi9hbGNvaG9sLWJ5LXZvbHVtZS1jYWxjdWxhdG9yLXVwZGF0ZWQvXG4gICAgLy8gUGFwYXppYW5cbiAgICBhYnY6IGZ1bmN0aW9uKG9nLGZnKXtcbiAgICAgIHJldHVybiAoKCBvZyAtIGZnICkgKiAxMzEuMjUpLnRvRml4ZWQoMik7XG4gICAgfSxcbiAgICAvLyBEYW5pZWxzLCB1c2VkIGZvciBoaWdoIGdyYXZpdHkgYmVlcnNcbiAgICBhYnZhOiBmdW5jdGlvbihvZyxmZyl7XG4gICAgICByZXR1cm4gKCggNzYuMDggKiAoIG9nIC0gZmcgKSAvICggMS43NzUgLSBvZyApKSAqICggZmcgLyAwLjc5NCApKS50b0ZpeGVkKDIpO1xuICAgIH0sXG4gICAgLy8gaHR0cDovL2hiZC5vcmcvZW5zbWluZ3IvXG4gICAgYWJ3OiBmdW5jdGlvbihhYnYsZmcpe1xuICAgICAgcmV0dXJuICgoMC43OSAqIGFidikgLyBmZykudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIHJlOiBmdW5jdGlvbihvcCxmcCl7XG4gICAgICByZXR1cm4gKDAuMTgwOCAqIG9wKSArICgwLjgxOTIgKiBmcCk7XG4gICAgfSxcbiAgICBhdHRlbnVhdGlvbjogZnVuY3Rpb24ob3AsZnApe1xuICAgICAgcmV0dXJuICgoMSAtIChmcC9vcCkpKjEwMCkudG9GaXhlZCgyKTtcbiAgICB9LFxuICAgIGNhbG9yaWVzOiBmdW5jdGlvbihhYncscmUsZmcpe1xuICAgICAgcmV0dXJuICgoKDYuOSAqIGFidykgKyA0LjAgKiAocmUgLSAwLjEpKSAqIGZnICogMy41NSkudG9GaXhlZCgxKTtcbiAgICB9LFxuICAgIC8vIGh0dHA6Ly93d3cuYnJld2Vyc2ZyaWVuZC5jb20vcGxhdG8tdG8tc2ctY29udmVyc2lvbi1jaGFydC9cbiAgICBzZzogZnVuY3Rpb24ocGxhdG8pe1xuICAgICAgbGV0IHNnID0gKCAxICsgKHBsYXRvIC8gKDI1OC42IC0gKCAocGxhdG8vMjU4LjIpICogMjI3LjEpICkgKSApLnRvRml4ZWQoMyk7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChzZyk7XG4gICAgfSxcbiAgICBwbGF0bzogZnVuY3Rpb24oc2cpe1xuICAgICAgbGV0IHBsYXRvID0gKCgtMSAqIDYxNi44NjgpICsgKDExMTEuMTQgKiBzZykgLSAoNjMwLjI3MiAqIE1hdGgucG93KHNnLDIpKSArICgxMzUuOTk3ICogTWF0aC5wb3coc2csMykpKS50b1N0cmluZygpO1xuICAgICAgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA9PSA1KVxuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSsyKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA8IDUpXG4gICAgICAgIHBsYXRvID0gcGxhdG8uc3Vic3RyaW5nKDAscGxhdG8uaW5kZXhPZignLicpKTtcbiAgICAgIGVsc2UgaWYocGxhdG8uc3Vic3RyaW5nKHBsYXRvLmluZGV4T2YoJy4nKSsxLHBsYXRvLmluZGV4T2YoJy4nKSsyKSA+IDUpe1xuICAgICAgICBwbGF0byA9IHBsYXRvLnN1YnN0cmluZygwLHBsYXRvLmluZGV4T2YoJy4nKSk7XG4gICAgICAgIHBsYXRvID0gcGFyc2VGbG9hdChwbGF0bykgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGxhdG8pO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclNtaXRoOiBmdW5jdGlvbihyZWNpcGUpe1xuICAgICAgbGV0IHJlc3BvbnNlID0ge25hbWU6JycsIGRhdGU6JycsIGJyZXdlcjoge25hbWU6Jyd9LCBjYXRlZ29yeTonJywgYWJ2OicnLCBvZzowLjAwMCwgZmc6MC4wMDAsIGlidTowLCBob3BzOltdLCBncmFpbnM6W10sIHllYXN0OltdLCBtaXNjOltdfTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9OQU1FKVxuICAgICAgICByZXNwb25zZS5uYW1lID0gcmVjaXBlLkZfUl9OQU1FO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWSlcbiAgICAgICAgcmVzcG9uc2UuY2F0ZWdvcnkgPSByZWNpcGUuRl9SX1NUWUxFLkZfU19DQVRFR09SWTtcbiAgICAgIGlmKCEhcmVjaXBlLkZfUl9EQVRFKVxuICAgICAgICByZXNwb25zZS5kYXRlID0gcmVjaXBlLkZfUl9EQVRFO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX0JSRVdFUilcbiAgICAgICAgcmVzcG9uc2UuYnJld2VyLm5hbWUgPSByZWNpcGUuRl9SX0JSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfT0cpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKVxuICAgICAgICByZXNwb25zZS5vZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX09HKS50b0ZpeGVkKDMpO1xuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpXG4gICAgICAgIHJlc3BvbnNlLmZnID0gcGFyc2VGbG9hdChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfRkcpLnRvRml4ZWQoMyk7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlRmxvYXQocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0ZHKS50b0ZpeGVkKDMpO1xuXG4gICAgICBpZighIXJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYpXG4gICAgICAgIHJlc3BvbnNlLmFidiA9ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5GX1JfU1RZTEUuRl9TX01BWF9BQlYsMik7XG4gICAgICBlbHNlIGlmKCEhcmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCVilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLkZfUl9TVFlMRS5GX1NfTUlOX0FCViwyKTtcblxuICAgICAgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NQVhfSUJVLDEwKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVKVxuICAgICAgICByZXNwb25zZS5pYnUgPSBwYXJzZUludChyZWNpcGUuRl9SX1NUWUxFLkZfU19NSU5fSUJVLDEwKTtcblxuICAgICAgaWYoISFyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbil7XG4gICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5HcmFpbixmdW5jdGlvbihncmFpbil7XG4gICAgICAgICAgcmVzcG9uc2UuZ3JhaW5zLnB1c2goe1xuICAgICAgICAgICAgbGFiZWw6IGdyYWluLkZfR19OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChncmFpbi5GX0dfQk9JTF9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5GX0dfQU1PVU5ULzE2LDIpKycgbGJzLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKGdyYWluLkZfR19BTU9VTlQvMTYsMilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuSG9wcyl7XG4gICAgICAgICAgXy5lYWNoKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLkhvcHMsZnVuY3Rpb24oaG9wKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBob3AuRl9IX05BTUUsXG4gICAgICAgICAgICAgIG1pbjogcGFyc2VJbnQoaG9wLkZfSF9EUllfSE9QX1RJTUUsMTApID4gMCA/IG51bGwgOiBwYXJzZUludChob3AuRl9IX0JPSUxfVElNRSwxMCksXG4gICAgICAgICAgICAgIG5vdGVzOiBwYXJzZUludChob3AuRl9IX0RSWV9IT1BfVElNRSwxMCkgPiAwXG4gICAgICAgICAgICAgICAgPyAnRHJ5IEhvcCAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5GX0hfQU1PVU5ULDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5GX0hfRFJZX0hPUF9USU1FLDEwKSsnIERheXMnXG4gICAgICAgICAgICAgICAgOiAkZmlsdGVyKCdudW1iZXInKShob3AuRl9IX0FNT1VOVCwyKSsnIG96LicsXG4gICAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoaG9wLkZfSF9BTU9VTlQsMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaG9wLkZfSF9BTFBIQVxuICAgICAgICAgICAgLy8gaG9wLkZfSF9EUllfSE9QX1RJTUVcbiAgICAgICAgICAgIC8vIGhvcC5GX0hfT1JJR0lOXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyl7XG4gICAgICAgIGlmKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MubGVuZ3RoKXtcbiAgICAgICAgICBfLmVhY2gocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuTWlzYyxmdW5jdGlvbihtaXNjKXtcbiAgICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBtaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgICBtaW46IHBhcnNlSW50KG1pc2MuRl9NX1RJTUUsMTApLFxuICAgICAgICAgICAgICBub3RlczogJGZpbHRlcignbnVtYmVyJykobWlzYy5GX01fQU1PVU5ULDIpKycgZy4nLFxuICAgICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKG1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UubWlzYy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5NaXNjLkZfTV9BTU9VTlQsMikrJyBnLicsXG4gICAgICAgICAgICBhbW91bnQ6ICRmaWx0ZXIoJ251bWJlcicpKHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLk1pc2MuRl9NX0FNT1VOVCwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCEhcmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3Qpe1xuICAgICAgICBpZihyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5sZW5ndGgpe1xuICAgICAgICAgIF8uZWFjaChyZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdCxmdW5jdGlvbih5ZWFzdCl7XG4gICAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogeWVhc3QuRl9ZX0xBQisnICcrKHllYXN0LkZfWV9QUk9EVUNUX0lEID9cbiAgICAgICAgICAgICAgICB5ZWFzdC5GX1lfUFJPRFVDVF9JRCA6XG4gICAgICAgICAgICAgICAgeWVhc3QuRl9ZX05BTUUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZS55ZWFzdC5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9MQUIrJyAnK1xuICAgICAgICAgICAgICAocmVjaXBlLkluZ3JlZGllbnRzLkRhdGEuWWVhc3QuRl9ZX1BST0RVQ1RfSUQgP1xuICAgICAgICAgICAgICAgIHJlY2lwZS5JbmdyZWRpZW50cy5EYXRhLlllYXN0LkZfWV9QUk9EVUNUX0lEIDpcbiAgICAgICAgICAgICAgICByZWNpcGUuSW5ncmVkaWVudHMuRGF0YS5ZZWFzdC5GX1lfTkFNRSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgcmVjaXBlQmVlclhNTDogZnVuY3Rpb24ocmVjaXBlKXtcbiAgICAgIGxldCByZXNwb25zZSA9IHtuYW1lOicnLCBkYXRlOicnLCBicmV3ZXI6IHtuYW1lOicnfSwgY2F0ZWdvcnk6JycsIGFidjonJywgb2c6MC4wMDAsIGZnOjAuMDAwLCBpYnU6MCwgaG9wczpbXSwgZ3JhaW5zOltdLCB5ZWFzdDpbXSwgbWlzYzpbXX07XG4gICAgICBsZXQgbWFzaF90aW1lID0gNjA7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk5BTUUpXG4gICAgICAgIHJlc3BvbnNlLm5hbWUgPSByZWNpcGUuTkFNRTtcbiAgICAgIGlmKCEhcmVjaXBlLlNUWUxFLkNBVEVHT1JZKVxuICAgICAgICByZXNwb25zZS5jYXRlZ29yeSA9IHJlY2lwZS5TVFlMRS5DQVRFR09SWTtcblxuICAgICAgLy8gaWYoISFyZWNpcGUuRl9SX0RBVEUpXG4gICAgICAvLyAgIHJlc3BvbnNlLmRhdGUgPSByZWNpcGUuRl9SX0RBVEU7XG4gICAgICBpZighIXJlY2lwZS5CUkVXRVIpXG4gICAgICAgIHJlc3BvbnNlLmJyZXdlci5uYW1lID0gcmVjaXBlLkJSRVdFUjtcblxuICAgICAgaWYoISFyZWNpcGUuT0cpXG4gICAgICAgIHJlc3BvbnNlLm9nID0gcGFyc2VGbG9hdChyZWNpcGUuT0cpLnRvRml4ZWQoMyk7XG4gICAgICBpZighIXJlY2lwZS5GRylcbiAgICAgICAgcmVzcG9uc2UuZmcgPSBwYXJzZUZsb2F0KHJlY2lwZS5GRykudG9GaXhlZCgzKTtcblxuICAgICAgaWYoISFyZWNpcGUuSUJVKVxuICAgICAgICByZXNwb25zZS5mZyA9IHBhcnNlSW50KHJlY2lwZS5JQlUsMTApO1xuXG4gICAgICBpZighIXJlY2lwZS5TVFlMRS5BQlZfTUFYKVxuICAgICAgICByZXNwb25zZS5hYnYgPSAkZmlsdGVyKCdudW1iZXInKShyZWNpcGUuU1RZTEUuQUJWX01BWCwyKTtcbiAgICAgIGVsc2UgaWYoISFyZWNpcGUuU1RZTEUuQUJWX01JTilcbiAgICAgICAgcmVzcG9uc2UuYWJ2ID0gJGZpbHRlcignbnVtYmVyJykocmVjaXBlLlNUWUxFLkFCVl9NSU4sMik7XG5cbiAgICAgIGlmKCEhcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAgJiYgcmVjaXBlLk1BU0guTUFTSF9TVEVQUy5NQVNIX1NURVAubGVuZ3RoICYmIHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRSl7XG4gICAgICAgIG1hc2hfdGltZSA9IHJlY2lwZS5NQVNILk1BU0hfU1RFUFMuTUFTSF9TVEVQWzBdLlNURVBfVElNRTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuRkVSTUVOVEFCTEVTKXtcbiAgICAgICAgbGV0IGdyYWlucyA9IChyZWNpcGUuRkVSTUVOVEFCTEVTLkZFUk1FTlRBQkxFICYmIHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUubGVuZ3RoKSA/IHJlY2lwZS5GRVJNRU5UQUJMRVMuRkVSTUVOVEFCTEUgOiByZWNpcGUuRkVSTUVOVEFCTEVTO1xuICAgICAgICBfLmVhY2goZ3JhaW5zLGZ1bmN0aW9uKGdyYWluKXtcbiAgICAgICAgICByZXNwb25zZS5ncmFpbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogZ3JhaW4uTkFNRSxcbiAgICAgICAgICAgIG1pbjogcGFyc2VJbnQobWFzaF90aW1lLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiAkZmlsdGVyKCdudW1iZXInKShncmFpbi5BTU9VTlQsMikrJyBsYnMuJyxcbiAgICAgICAgICAgIGFtb3VudDogJGZpbHRlcignbnVtYmVyJykoZ3JhaW4uQU1PVU5ULDIpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuSE9QUyl7XG4gICAgICAgIGxldCBob3BzID0gKHJlY2lwZS5IT1BTLkhPUCAmJiByZWNpcGUuSE9QUy5IT1AubGVuZ3RoKSA/IHJlY2lwZS5IT1BTLkhPUCA6IHJlY2lwZS5IT1BTO1xuICAgICAgICBfLmVhY2goaG9wcyxmdW5jdGlvbihob3Ape1xuICAgICAgICAgIHJlc3BvbnNlLmhvcHMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogaG9wLk5BTUUrJyAoJytob3AuRk9STSsnKScsXG4gICAgICAgICAgICBtaW46IGhvcC5VU0UgPT0gJ0RyeSBIb3AnID8gMCA6IHBhcnNlSW50KGhvcC5USU1FLDEwKSxcbiAgICAgICAgICAgIG5vdGVzOiBob3AuVVNFID09ICdEcnkgSG9wJ1xuICAgICAgICAgICAgICA/IGhvcC5VU0UrJyAnKyRmaWx0ZXIoJ251bWJlcicpKGhvcC5BTU9VTlQqMTAwMC8yOC4zNDk1LDIpKycgb3ouJysnIGZvciAnK3BhcnNlSW50KGhvcC5USU1FLzYwLzI0LDEwKSsnIERheXMnXG4gICAgICAgICAgICAgIDogaG9wLlVTRSsnICcrJGZpbHRlcignbnVtYmVyJykoaG9wLkFNT1VOVCoxMDAwLzI4LjM0OTUsMikrJyBvei4nLFxuICAgICAgICAgICAgYW1vdW50OiAkZmlsdGVyKCdudW1iZXInKShob3AuQU1PVU5UKjEwMDAvMjguMzQ5NSwyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoISFyZWNpcGUuTUlTQ1Mpe1xuICAgICAgICBsZXQgbWlzYyA9IChyZWNpcGUuTUlTQ1MuTUlTQyAmJiByZWNpcGUuTUlTQ1MuTUlTQy5sZW5ndGgpID8gcmVjaXBlLk1JU0NTLk1JU0MgOiByZWNpcGUuTUlTQ1M7XG4gICAgICAgIF8uZWFjaChtaXNjLGZ1bmN0aW9uKG1pc2Mpe1xuICAgICAgICAgIHJlc3BvbnNlLm1pc2MucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogbWlzYy5OQU1FLFxuICAgICAgICAgICAgbWluOiBwYXJzZUludChtaXNjLlRJTUUsMTApLFxuICAgICAgICAgICAgbm90ZXM6ICdBZGQgJyttaXNjLkFNT1VOVCsnIHRvICcrbWlzYy5VU0UsXG4gICAgICAgICAgICBhbW91bnQ6IG1pc2MuQU1PVU5UXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZighIXJlY2lwZS5ZRUFTVFMpe1xuICAgICAgICBsZXQgeWVhc3QgPSAocmVjaXBlLllFQVNUUy5ZRUFTVCAmJiByZWNpcGUuWUVBU1RTLllFQVNULmxlbmd0aCkgPyByZWNpcGUuWUVBU1RTLllFQVNUIDogcmVjaXBlLllFQVNUUztcbiAgICAgICAgICBfLmVhY2goeWVhc3QsZnVuY3Rpb24oeWVhc3Qpe1xuICAgICAgICAgICAgcmVzcG9uc2UueWVhc3QucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHllYXN0Lk5BTUVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgZm9ybWF0WE1MOiBmdW5jdGlvbihjb250ZW50KXtcbiAgICAgIGxldCBodG1sY2hhcnMgPSBbXG4gICAgICAgIHtmOiAnJkNjZWRpbDsnLCByOiAnw4cnfSxcbiAgICAgICAge2Y6ICcmY2NlZGlsOycsIHI6ICfDpyd9LFxuICAgICAgICB7ZjogJyZFdW1sOycsIHI6ICfDiyd9LFxuICAgICAgICB7ZjogJyZldW1sOycsIHI6ICfDqyd9LFxuICAgICAgICB7ZjogJyYjMjYyOycsIHI6ICfEhid9LFxuICAgICAgICB7ZjogJyYjMjYzOycsIHI6ICfEhyd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI2ODsnLCByOiAnxIwnfSxcbiAgICAgICAge2Y6ICcmIzI2OTsnLCByOiAnxI0nfSxcbiAgICAgICAge2Y6ICcmIzI3MjsnLCByOiAnxJAnfSxcbiAgICAgICAge2Y6ICcmIzI3MzsnLCByOiAnxJEnfSxcbiAgICAgICAge2Y6ICcmIzM1MjsnLCByOiAnxaAnfSxcbiAgICAgICAge2Y6ICcmIzM1MzsnLCByOiAnxaEnfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMjgyOycsIHI6ICfEmid9LFxuICAgICAgICB7ZjogJyYjMjgzOycsIHI6ICfEmyd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmIzMyNzsnLCByOiAnxYcnfSxcbiAgICAgICAge2Y6ICcmIzMyODsnLCByOiAnxYgnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDQ7JywgcjogJ8WYJ30sXG4gICAgICAgIHtmOiAnJiMzNDU7JywgcjogJ8WZJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNTY7JywgcjogJ8WkJ30sXG4gICAgICAgIHtmOiAnJiMzNTc7JywgcjogJ8WlJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyYjMzY2OycsIHI6ICfFrid9LFxuICAgICAgICB7ZjogJyYjMzY3OycsIHI6ICfFryd9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmIzM4MTsnLCByOiAnxb0nfSxcbiAgICAgICAge2Y6ICcmIzM4MjsnLCByOiAnxb4nfSxcbiAgICAgICAge2Y6ICcmQUVsaWc7JywgcjogJ8OGJ30sXG4gICAgICAgIHtmOiAnJmFlbGlnOycsIHI6ICfDpid9LFxuICAgICAgICB7ZjogJyZPc2xhc2g7JywgcjogJ8OYJ30sXG4gICAgICAgIHtmOiAnJm9zbGFzaDsnLCByOiAnw7gnfSxcbiAgICAgICAge2Y6ICcmQXJpbmc7JywgcjogJ8OFJ30sXG4gICAgICAgIHtmOiAnJmFyaW5nOycsIHI6ICfDpSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRXVtbDsnLCByOiAnw4snfSxcbiAgICAgICAge2Y6ICcmZXVtbDsnLCByOiAnw6snfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMyNjQ7JywgcjogJ8SIJ30sXG4gICAgICAgIHtmOiAnJiMyNjU7JywgcjogJ8SJJ30sXG4gICAgICAgIHtmOiAnJiMyODQ7JywgcjogJ8ScJ30sXG4gICAgICAgIHtmOiAnJiMyODU7JywgcjogJ8SdJ30sXG4gICAgICAgIHtmOiAnJiMyOTI7JywgcjogJ8SkJ30sXG4gICAgICAgIHtmOiAnJiMyOTM7JywgcjogJ8SlJ30sXG4gICAgICAgIHtmOiAnJiMzMDg7JywgcjogJ8S0J30sXG4gICAgICAgIHtmOiAnJiMzMDk7JywgcjogJ8S1J30sXG4gICAgICAgIHtmOiAnJiMzNDg7JywgcjogJ8WcJ30sXG4gICAgICAgIHtmOiAnJiMzNDk7JywgcjogJ8WdJ30sXG4gICAgICAgIHtmOiAnJiMzNjQ7JywgcjogJ8WsJ30sXG4gICAgICAgIHtmOiAnJiMzNjU7JywgcjogJ8WtJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJk90aWxkZTsnLCByOiAnw5UnfSxcbiAgICAgICAge2Y6ICcmb3RpbGRlOycsIHI6ICfDtSd9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJllhY3V0ZTsnLCByOiAnw50nfSxcbiAgICAgICAge2Y6ICcmeWFjdXRlOycsIHI6ICfDvSd9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZBdW1sOycsIHI6ICfDhCd9LFxuICAgICAgICB7ZjogJyZhdW1sOycsIHI6ICfDpCd9LFxuICAgICAgICB7ZjogJyZPdW1sOycsIHI6ICfDlid9LFxuICAgICAgICB7ZjogJyZvdW1sOycsIHI6ICfDtid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZDY2VkaWw7JywgcjogJ8OHJ30sXG4gICAgICAgIHtmOiAnJmNjZWRpbDsnLCByOiAnw6cnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZFY2lyYzsnLCByOiAnw4onfSxcbiAgICAgICAge2Y6ICcmZWNpcmM7JywgcjogJ8OqJ30sXG4gICAgICAgIHtmOiAnJkV1bWw7JywgcjogJ8OLJ30sXG4gICAgICAgIHtmOiAnJmV1bWw7JywgcjogJ8OrJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmSXVtbDsnLCByOiAnw48nfSxcbiAgICAgICAge2Y6ICcmaXVtbDsnLCByOiAnw68nfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyZPRWxpZzsnLCByOiAnxZInfSxcbiAgICAgICAge2Y6ICcmb2VsaWc7JywgcjogJ8WTJ30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJiMzNzY7JywgcjogJ8W4J30sXG4gICAgICAgIHtmOiAnJnl1bWw7JywgcjogJ8O/J30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJnN6bGlnOycsIHI6ICfDnyd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkljaXJjOycsIHI6ICfDjid9LFxuICAgICAgICB7ZjogJyZpY2lyYzsnLCByOiAnw64nfSxcbiAgICAgICAge2Y6ICcmIzI5NjsnLCByOiAnxKgnfSxcbiAgICAgICAge2Y6ICcmIzI5NzsnLCByOiAnxKknfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1Z3JhdmU7JywgcjogJ8O5J30sXG4gICAgICAgIHtmOiAnJlVjaXJjOycsIHI6ICfDmyd9LFxuICAgICAgICB7ZjogJyZ1Y2lyYzsnLCByOiAnw7snfSxcbiAgICAgICAge2Y6ICcmIzM2MDsnLCByOiAnxagnfSxcbiAgICAgICAge2Y6ICcmIzM2MTsnLCByOiAnxaknfSxcbiAgICAgICAge2Y6ICcmIzMxMjsnLCByOiAnxLgnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzMzY7JywgcjogJ8WQJ30sXG4gICAgICAgIHtmOiAnJiMzMzc7JywgcjogJ8WRJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZVdW1sOycsIHI6ICfDnCd9LFxuICAgICAgICB7ZjogJyZ1dW1sOycsIHI6ICfDvCd9LFxuICAgICAgICB7ZjogJyYjMzY4OycsIHI6ICfFsCd9LFxuICAgICAgICB7ZjogJyYjMzY5OycsIHI6ICfFsSd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmRVRIOycsIHI6ICfDkCd9LFxuICAgICAgICB7ZjogJyZldGg7JywgcjogJ8OwJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZZYWN1dGU7JywgcjogJ8OdJ30sXG4gICAgICAgIHtmOiAnJnlhY3V0ZTsnLCByOiAnw70nfSxcbiAgICAgICAge2Y6ICcmVEhPUk47JywgcjogJ8OeJ30sXG4gICAgICAgIHtmOiAnJnRob3JuOycsIHI6ICfDvid9LFxuICAgICAgICB7ZjogJyZBRWxpZzsnLCByOiAnw4YnfSxcbiAgICAgICAge2Y6ICcmYWVsaWc7JywgcjogJ8OmJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJYWN1dGU7JywgcjogJ8ONJ30sXG4gICAgICAgIHtmOiAnJmlhY3V0ZTsnLCByOiAnw60nfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJlVhY3V0ZTsnLCByOiAnw5onfSxcbiAgICAgICAge2Y6ICcmdWFjdXRlOycsIHI6ICfDuid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZFZ3JhdmU7JywgcjogJ8OIJ30sXG4gICAgICAgIHtmOiAnJmVncmF2ZTsnLCByOiAnw6gnfSxcbiAgICAgICAge2Y6ICcmRWFjdXRlOycsIHI6ICfDiSd9LFxuICAgICAgICB7ZjogJyZlYWN1dGU7JywgcjogJ8OpJ30sXG4gICAgICAgIHtmOiAnJkVjaXJjOycsIHI6ICfDiid9LFxuICAgICAgICB7ZjogJyZlY2lyYzsnLCByOiAnw6onfSxcbiAgICAgICAge2Y6ICcmSWdyYXZlOycsIHI6ICfDjCd9LFxuICAgICAgICB7ZjogJyZpZ3JhdmU7JywgcjogJ8OsJ30sXG4gICAgICAgIHtmOiAnJklhY3V0ZTsnLCByOiAnw40nfSxcbiAgICAgICAge2Y6ICcmaWFjdXRlOycsIHI6ICfDrSd9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPY2lyYzsnLCByOiAnw5QnfSxcbiAgICAgICAge2Y6ICcmb2NpcmM7JywgcjogJ8O0J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVY2lyYzsnLCByOiAnw5snfSxcbiAgICAgICAge2Y6ICcmdWNpcmM7JywgcjogJ8O7J30sXG4gICAgICAgIHtmOiAnJiMyNTY7JywgcjogJ8SAJ30sXG4gICAgICAgIHtmOiAnJiMyNTc7JywgcjogJ8SBJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzQ7JywgcjogJ8SSJ30sXG4gICAgICAgIHtmOiAnJiMyNzU7JywgcjogJ8STJ30sXG4gICAgICAgIHtmOiAnJiMyOTA7JywgcjogJ8SiJ30sXG4gICAgICAgIHtmOiAnJiMyOTE7JywgcjogJ8SjJ30sXG4gICAgICAgIHtmOiAnJiMyOTg7JywgcjogJ8SqJ30sXG4gICAgICAgIHtmOiAnJiMyOTk7JywgcjogJ8SrJ30sXG4gICAgICAgIHtmOiAnJiMzMTA7JywgcjogJ8S2J30sXG4gICAgICAgIHtmOiAnJiMzMTE7JywgcjogJ8S3J30sXG4gICAgICAgIHtmOiAnJiMzMTU7JywgcjogJ8S7J30sXG4gICAgICAgIHtmOiAnJiMzMTY7JywgcjogJ8S8J30sXG4gICAgICAgIHtmOiAnJiMzMjU7JywgcjogJ8WFJ30sXG4gICAgICAgIHtmOiAnJiMzMjY7JywgcjogJ8WGJ30sXG4gICAgICAgIHtmOiAnJiMzNDI7JywgcjogJ8WWJ30sXG4gICAgICAgIHtmOiAnJiMzNDM7JywgcjogJ8WXJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzNjI7JywgcjogJ8WqJ30sXG4gICAgICAgIHtmOiAnJiMzNjM7JywgcjogJ8WrJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFFbGlnOycsIHI6ICfDhid9LFxuICAgICAgICB7ZjogJyZhZWxpZzsnLCByOiAnw6YnfSxcbiAgICAgICAge2Y6ICcmT3NsYXNoOycsIHI6ICfDmCd9LFxuICAgICAgICB7ZjogJyZvc2xhc2g7JywgcjogJ8O4J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmIzI2MDsnLCByOiAnxIQnfSxcbiAgICAgICAge2Y6ICcmIzI2MTsnLCByOiAnxIUnfSxcbiAgICAgICAge2Y6ICcmIzI2MjsnLCByOiAnxIYnfSxcbiAgICAgICAge2Y6ICcmIzI2MzsnLCByOiAnxIcnfSxcbiAgICAgICAge2Y6ICcmIzI4MDsnLCByOiAnxJgnfSxcbiAgICAgICAge2Y6ICcmIzI4MTsnLCByOiAnxJknfSxcbiAgICAgICAge2Y6ICcmIzMyMTsnLCByOiAnxYEnfSxcbiAgICAgICAge2Y6ICcmIzMyMjsnLCByOiAnxYInfSxcbiAgICAgICAge2Y6ICcmIzMyMzsnLCByOiAnxYMnfSxcbiAgICAgICAge2Y6ICcmIzMyNDsnLCByOiAnxYQnfSxcbiAgICAgICAge2Y6ICcmT2FjdXRlOycsIHI6ICfDkyd9LFxuICAgICAgICB7ZjogJyZvYWN1dGU7JywgcjogJ8OzJ30sXG4gICAgICAgIHtmOiAnJiMzNDY7JywgcjogJ8WaJ30sXG4gICAgICAgIHtmOiAnJiMzNDc7JywgcjogJ8WbJ30sXG4gICAgICAgIHtmOiAnJiMzNzc7JywgcjogJ8W5J30sXG4gICAgICAgIHtmOiAnJiMzNzg7JywgcjogJ8W6J30sXG4gICAgICAgIHtmOiAnJiMzNzk7JywgcjogJ8W7J30sXG4gICAgICAgIHtmOiAnJiMzODA7JywgcjogJ8W8J30sXG4gICAgICAgIHtmOiAnJkFncmF2ZTsnLCByOiAnw4AnfSxcbiAgICAgICAge2Y6ICcmYWdyYXZlOycsIHI6ICfDoCd9LFxuICAgICAgICB7ZjogJyZBYWN1dGU7JywgcjogJ8OBJ30sXG4gICAgICAgIHtmOiAnJmFhY3V0ZTsnLCByOiAnw6EnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZBdGlsZGU7JywgcjogJ8ODJ30sXG4gICAgICAgIHtmOiAnJmF0aWxkZTsnLCByOiAnw6MnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJkVncmF2ZTsnLCByOiAnw4gnfSxcbiAgICAgICAge2Y6ICcmZWdyYXZlOycsIHI6ICfDqCd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmRWNpcmM7JywgcjogJ8OKJ30sXG4gICAgICAgIHtmOiAnJmVjaXJjOycsIHI6ICfDqid9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJkl1bWw7JywgcjogJ8OPJ30sXG4gICAgICAgIHtmOiAnJml1bWw7JywgcjogJ8OvJ30sXG4gICAgICAgIHtmOiAnJk9ncmF2ZTsnLCByOiAnw5InfSxcbiAgICAgICAge2Y6ICcmb2dyYXZlOycsIHI6ICfDsid9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT3RpbGRlOycsIHI6ICfDlSd9LFxuICAgICAgICB7ZjogJyZvdGlsZGU7JywgcjogJ8O1J30sXG4gICAgICAgIHtmOiAnJlVncmF2ZTsnLCByOiAnw5knfSxcbiAgICAgICAge2Y6ICcmdWdyYXZlOycsIHI6ICfDuSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmVXVtbDsnLCByOiAnw5wnfSxcbiAgICAgICAge2Y6ICcmdXVtbDsnLCByOiAnw7wnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmIzI1ODsnLCByOiAnxIInfSxcbiAgICAgICAge2Y6ICcmIzI1OTsnLCByOiAnxIMnfSxcbiAgICAgICAge2Y6ICcmQWNpcmM7JywgcjogJ8OCJ30sXG4gICAgICAgIHtmOiAnJmFjaXJjOycsIHI6ICfDoid9LFxuICAgICAgICB7ZjogJyZJY2lyYzsnLCByOiAnw44nfSxcbiAgICAgICAge2Y6ICcmaWNpcmM7JywgcjogJ8OuJ30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJiMzNTQ7JywgcjogJ8WiJ30sXG4gICAgICAgIHtmOiAnJiMzNTU7JywgcjogJ8WjJ30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyYjMjY4OycsIHI6ICfEjCd9LFxuICAgICAgICB7ZjogJyYjMjY5OycsIHI6ICfEjSd9LFxuICAgICAgICB7ZjogJyYjMjcyOycsIHI6ICfEkCd9LFxuICAgICAgICB7ZjogJyYjMjczOycsIHI6ICfEkSd9LFxuICAgICAgICB7ZjogJyYjMzMwOycsIHI6ICfFiid9LFxuICAgICAgICB7ZjogJyYjMzMxOycsIHI6ICfFiyd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU4OycsIHI6ICfFpid9LFxuICAgICAgICB7ZjogJyYjMzU5OycsIHI6ICfFpyd9LFxuICAgICAgICB7ZjogJyYjMzgxOycsIHI6ICfFvSd9LFxuICAgICAgICB7ZjogJyYjMzgyOycsIHI6ICfFvid9LFxuICAgICAgICB7ZjogJyZBZ3JhdmU7JywgcjogJ8OAJ30sXG4gICAgICAgIHtmOiAnJmFncmF2ZTsnLCByOiAnw6AnfSxcbiAgICAgICAge2Y6ICcmRWdyYXZlOycsIHI6ICfDiCd9LFxuICAgICAgICB7ZjogJyZlZ3JhdmU7JywgcjogJ8OoJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyZJZ3JhdmU7JywgcjogJ8OMJ30sXG4gICAgICAgIHtmOiAnJmlncmF2ZTsnLCByOiAnw6wnfSxcbiAgICAgICAge2Y6ICcmT2dyYXZlOycsIHI6ICfDkid9LFxuICAgICAgICB7ZjogJyZvZ3JhdmU7JywgcjogJ8OyJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZVZ3JhdmU7JywgcjogJ8OZJ30sXG4gICAgICAgIHtmOiAnJnVncmF2ZTsnLCByOiAnw7knfSxcbiAgICAgICAge2Y6ICcmQWFjdXRlOycsIHI6ICfDgSd9LFxuICAgICAgICB7ZjogJyZhYWN1dGU7JywgcjogJ8OhJ30sXG4gICAgICAgIHtmOiAnJkF1bWw7JywgcjogJ8OEJ30sXG4gICAgICAgIHtmOiAnJmF1bWw7JywgcjogJ8OkJ30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMyNzA7JywgcjogJ8SOJ30sXG4gICAgICAgIHtmOiAnJiMyNzE7JywgcjogJ8SPJ30sXG4gICAgICAgIHtmOiAnJkVhY3V0ZTsnLCByOiAnw4knfSxcbiAgICAgICAge2Y6ICcmZWFjdXRlOycsIHI6ICfDqSd9LFxuICAgICAgICB7ZjogJyYjMzEzOycsIHI6ICfEuSd9LFxuICAgICAgICB7ZjogJyYjMzE0OycsIHI6ICfEuid9LFxuICAgICAgICB7ZjogJyYjMzE3OycsIHI6ICfEvSd9LFxuICAgICAgICB7ZjogJyYjMzE4OycsIHI6ICfEvid9LFxuICAgICAgICB7ZjogJyYjMzI3OycsIHI6ICfFhyd9LFxuICAgICAgICB7ZjogJyYjMzI4OycsIHI6ICfFiCd9LFxuICAgICAgICB7ZjogJyZPYWN1dGU7JywgcjogJ8OTJ30sXG4gICAgICAgIHtmOiAnJm9hY3V0ZTsnLCByOiAnw7MnfSxcbiAgICAgICAge2Y6ICcmT2NpcmM7JywgcjogJ8OUJ30sXG4gICAgICAgIHtmOiAnJm9jaXJjOycsIHI6ICfDtCd9LFxuICAgICAgICB7ZjogJyYjMzQwOycsIHI6ICfFlCd9LFxuICAgICAgICB7ZjogJyYjMzQxOycsIHI6ICfFlSd9LFxuICAgICAgICB7ZjogJyYjMzUyOycsIHI6ICfFoCd9LFxuICAgICAgICB7ZjogJyYjMzUzOycsIHI6ICfFoSd9LFxuICAgICAgICB7ZjogJyYjMzU2OycsIHI6ICfFpCd9LFxuICAgICAgICB7ZjogJyYjMzU3OycsIHI6ICfFpSd9LFxuICAgICAgICB7ZjogJyZVYWN1dGU7JywgcjogJ8OaJ30sXG4gICAgICAgIHtmOiAnJnVhY3V0ZTsnLCByOiAnw7onfSxcbiAgICAgICAge2Y6ICcmWWFjdXRlOycsIHI6ICfDnSd9LFxuICAgICAgICB7ZjogJyZ5YWN1dGU7JywgcjogJ8O9J30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJiMyNjg7JywgcjogJ8SMJ30sXG4gICAgICAgIHtmOiAnJiMyNjk7JywgcjogJ8SNJ30sXG4gICAgICAgIHtmOiAnJiMzNTI7JywgcjogJ8WgJ30sXG4gICAgICAgIHtmOiAnJiMzNTM7JywgcjogJ8WhJ30sXG4gICAgICAgIHtmOiAnJiMzODE7JywgcjogJ8W9J30sXG4gICAgICAgIHtmOiAnJiMzODI7JywgcjogJ8W+J30sXG4gICAgICAgIHtmOiAnJkFhY3V0ZTsnLCByOiAnw4EnfSxcbiAgICAgICAge2Y6ICcmYWFjdXRlOycsIHI6ICfDoSd9LFxuICAgICAgICB7ZjogJyZFYWN1dGU7JywgcjogJ8OJJ30sXG4gICAgICAgIHtmOiAnJmVhY3V0ZTsnLCByOiAnw6knfSxcbiAgICAgICAge2Y6ICcmSWFjdXRlOycsIHI6ICfDjSd9LFxuICAgICAgICB7ZjogJyZpYWN1dGU7JywgcjogJ8OtJ30sXG4gICAgICAgIHtmOiAnJk9hY3V0ZTsnLCByOiAnw5MnfSxcbiAgICAgICAge2Y6ICcmb2FjdXRlOycsIHI6ICfDsyd9LFxuICAgICAgICB7ZjogJyZOdGlsZGU7JywgcjogJ8ORJ30sXG4gICAgICAgIHtmOiAnJm50aWxkZTsnLCByOiAnw7EnfSxcbiAgICAgICAge2Y6ICcmVWFjdXRlOycsIHI6ICfDmid9LFxuICAgICAgICB7ZjogJyZ1YWN1dGU7JywgcjogJ8O6J30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmlleGNsOycsIHI6ICfCoSd9LFxuICAgICAgICB7ZjogJyZvcmRmOycsIHI6ICfCqid9LFxuICAgICAgICB7ZjogJyZpcXVlc3Q7JywgcjogJ8K/J30sXG4gICAgICAgIHtmOiAnJm9yZG07JywgcjogJ8K6J30sXG4gICAgICAgIHtmOiAnJkFyaW5nOycsIHI6ICfDhSd9LFxuICAgICAgICB7ZjogJyZhcmluZzsnLCByOiAnw6UnfSxcbiAgICAgICAge2Y6ICcmQXVtbDsnLCByOiAnw4QnfSxcbiAgICAgICAge2Y6ICcmYXVtbDsnLCByOiAnw6QnfSxcbiAgICAgICAge2Y6ICcmT3VtbDsnLCByOiAnw5YnfSxcbiAgICAgICAge2Y6ICcmb3VtbDsnLCByOiAnw7YnfSxcbiAgICAgICAge2Y6ICcmQ2NlZGlsOycsIHI6ICfDhyd9LFxuICAgICAgICB7ZjogJyZjY2VkaWw7JywgcjogJ8OnJ30sXG4gICAgICAgIHtmOiAnJiMyODY7JywgcjogJ8SeJ30sXG4gICAgICAgIHtmOiAnJiMyODc7JywgcjogJ8SfJ30sXG4gICAgICAgIHtmOiAnJiMzMDQ7JywgcjogJ8SwJ30sXG4gICAgICAgIHtmOiAnJiMzMDU7JywgcjogJ8SxJ30sXG4gICAgICAgIHtmOiAnJk91bWw7JywgcjogJ8OWJ30sXG4gICAgICAgIHtmOiAnJm91bWw7JywgcjogJ8O2J30sXG4gICAgICAgIHtmOiAnJiMzNTA7JywgcjogJ8WeJ30sXG4gICAgICAgIHtmOiAnJiMzNTE7JywgcjogJ8WfJ30sXG4gICAgICAgIHtmOiAnJlV1bWw7JywgcjogJ8OcJ30sXG4gICAgICAgIHtmOiAnJnV1bWw7JywgcjogJ8O8J30sXG4gICAgICAgIHtmOiAnJmV1cm87JywgcjogJ+KCrCd9LFxuICAgICAgICB7ZjogJyZwb3VuZDsnLCByOiAnwqMnfSxcbiAgICAgICAge2Y6ICcmbGFxdW87JywgcjogJ8KrJ30sXG4gICAgICAgIHtmOiAnJnJhcXVvOycsIHI6ICfCuyd9LFxuICAgICAgICB7ZjogJyZidWxsOycsIHI6ICfigKInfSxcbiAgICAgICAge2Y6ICcmZGFnZ2VyOycsIHI6ICfigKAnfSxcbiAgICAgICAge2Y6ICcmY29weTsnLCByOiAnwqknfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZ0cmFkZTsnLCByOiAn4oSiJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmcGVybWlsOycsIHI6ICfigLAnfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICcmbmRhc2g7JywgcjogJ+KAkyd9LFxuICAgICAgICB7ZjogJyZtZGFzaDsnLCByOiAn4oCUJ30sXG4gICAgICAgIHtmOiAnJiM4NDcwOycsIHI6ICfihJYnfSxcbiAgICAgICAge2Y6ICcmcmVnOycsIHI6ICfCrid9LFxuICAgICAgICB7ZjogJyZwYXJhOycsIHI6ICfCtid9LFxuICAgICAgICB7ZjogJyZwbHVzbW47JywgcjogJ8KxJ30sXG4gICAgICAgIHtmOiAnJm1pZGRvdDsnLCByOiAnwrcnfSxcbiAgICAgICAge2Y6ICdsZXNzLXQnLCByOiAnPCd9LFxuICAgICAgICB7ZjogJ2dyZWF0ZXItdCcsIHI6ICc+J30sXG4gICAgICAgIHtmOiAnJm5vdDsnLCByOiAnwqwnfSxcbiAgICAgICAge2Y6ICcmY3VycmVuOycsIHI6ICfCpCd9LFxuICAgICAgICB7ZjogJyZicnZiYXI7JywgcjogJ8KmJ30sXG4gICAgICAgIHtmOiAnJmRlZzsnLCByOiAnwrAnfSxcbiAgICAgICAge2Y6ICcmYWN1dGU7JywgcjogJ8K0J30sXG4gICAgICAgIHtmOiAnJnVtbDsnLCByOiAnwqgnfSxcbiAgICAgICAge2Y6ICcmbWFjcjsnLCByOiAnwq8nfSxcbiAgICAgICAge2Y6ICcmY2VkaWw7JywgcjogJ8K4J30sXG4gICAgICAgIHtmOiAnJmxhcXVvOycsIHI6ICfCqyd9LFxuICAgICAgICB7ZjogJyZyYXF1bzsnLCByOiAnwrsnfSxcbiAgICAgICAge2Y6ICcmc3VwMTsnLCByOiAnwrknfSxcbiAgICAgICAge2Y6ICcmc3VwMjsnLCByOiAnwrInfSxcbiAgICAgICAge2Y6ICcmc3VwMzsnLCByOiAnwrMnfSxcbiAgICAgICAge2Y6ICcmb3JkZjsnLCByOiAnwqonfSxcbiAgICAgICAge2Y6ICcmb3JkbTsnLCByOiAnwronfSxcbiAgICAgICAge2Y6ICcmaWV4Y2w7JywgcjogJ8KhJ30sXG4gICAgICAgIHtmOiAnJmlxdWVzdDsnLCByOiAnwr8nfSxcbiAgICAgICAge2Y6ICcmbWljcm87JywgcjogJ8K1J30sXG4gICAgICAgIHtmOiAnaHk7XHQnLCByOiAnJid9LFxuICAgICAgICB7ZjogJyZFVEg7JywgcjogJ8OQJ30sXG4gICAgICAgIHtmOiAnJmV0aDsnLCByOiAnw7AnfSxcbiAgICAgICAge2Y6ICcmTnRpbGRlOycsIHI6ICfDkSd9LFxuICAgICAgICB7ZjogJyZudGlsZGU7JywgcjogJ8OxJ30sXG4gICAgICAgIHtmOiAnJk9zbGFzaDsnLCByOiAnw5gnfSxcbiAgICAgICAge2Y6ICcmb3NsYXNoOycsIHI6ICfDuCd9LFxuICAgICAgICB7ZjogJyZzemxpZzsnLCByOiAnw58nfSxcbiAgICAgICAge2Y6ICcmYW1wOycsIHI6ICdhbmQnfSxcbiAgICAgICAge2Y6ICcmbGRxdW87JywgcjogJ1wiJ30sXG4gICAgICAgIHtmOiAnJnJkcXVvOycsIHI6ICdcIid9LFxuICAgICAgICB7ZjogJyZyc3F1bzsnLCByOiBcIidcIn1cbiAgICAgIF07XG5cbiAgICAgIF8uZWFjaChodG1sY2hhcnMsIGZ1bmN0aW9uKGNoYXIpIHtcbiAgICAgICAgaWYoY29udGVudC5pbmRleE9mKGNoYXIuZikgIT09IC0xKXtcbiAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKFJlZ0V4cChjaGFyLmYsJ2cnKSwgY2hhci5yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9XG4gIH07XG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9qcy9zZXJ2aWNlcy5qcyJdLCJzb3VyY2VSb290IjoiIn0=