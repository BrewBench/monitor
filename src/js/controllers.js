angular.module('brewbench-monitor')
.controller('mainCtrl', function($scope, $state, $filter, $timeout, $interval, $q, $http, $sce, BrewService){

$scope.clearSettings = function(e){
  if(e){
    angular.element(e.target).html('Removing...');
  }
  BrewService.clear();
  window.location.href='/';
};

if( $state.current.name == 'reset')
  $scope.clearSettings();

var notification = null;
var resetChart = 100;
var timeout = null; //reset chart after 100 polls

$scope.BrewService = BrewService;
$scope.site = {https: Boolean(document.location.protocol=='https:')
  , https_url: `https://${document.location.host}`
};
$scope.esp = {
  type: '32',
  ssid: '',
  ssid_pass: '',
  hostname: 'bbesp',
  arduino_pass: 'bbadmin',
  autoconnect: false  
};
$scope.modalInfo = {};
$scope.hops;
$scope.grains;
$scope.water;
$scope.lovibond;
$scope.pkg;
$scope.kettleTypes = BrewService.kettleTypes();
$scope.showSettings = true;
$scope.error = {message: '', type: 'danger'};
$scope.slider = {
  min: 0,
  options: {
    floor: 0,
    ceil: 100,
    step: 1,
    translate: function(value) {
        return `${value}%`;
    },
    onEnd: function(kettleId, modelValue, highValue, pointerType){
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

      if(!k)
        return;
      if($scope.kettles[kettle[1]].active && k.pwm && k.running){
        return $scope.toggleRelay($scope.kettles[kettle[1]], k, true);
      }
    }
  }
};

$scope.openInfoModal = function (arduino) {
  $scope.modalInfo = arduino;
  $('#arduino-info').modal('toggle');  
};
  
$scope.replaceKettlesWithPins = function (arduino) {
  if (arduino.info && arduino.info.pins && arduino.info.pins.length) {
    $scope.kettles = [];
    _.each(arduino.info.pins, pin => {
      $scope.kettles.push({
        name: pin.name
        , id: null
        , type: $scope.kettleTypes[4].type
        , active: false
        , sticky: false
        , heater: { pin: 'D6', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false }
        , pump: { pin: 'D7', running: false, auto: false, pwm: false, dutyCycle: 100, sketch: false }
        , temp: { pin: pin.pin, vcc: '', index: '', type: pin.type, adc: false, hit: false, ifttt: false, current: 0, measured: 0, previous: 0, adjust: 0, target: $scope.kettleTypes[4].target, diff: $scope.kettleTypes[4].diff, raw: 0, volts: 0 }
        , values: []
        , timers: []
        , knob: angular.copy(BrewService.defaultKnobOptions(), { value: 0, min: 0, max: $scope.kettleTypes[4].target + $scope.kettleTypes[4].diff })
        , arduino: arduino
        , message: { type: 'error', message: '', version: '', count: 0, location: '' }
        , notify: { slack: false }
      });
    });
  }
};
  
$scope.getKettleSliderOptions = function(type, index){
  return Object.assign($scope.slider.options, {id: `${type}_${index}`});
}

$scope.getLovibondColor = function(range){
  range = range.replace(/°/g,'').replace(/ /g,'');
  if(range.indexOf('-')!==-1){
    var rArr=range.split('-');
    range = (parseFloat(rArr[0])+parseFloat(rArr[1]))/2;
  } else {
    range = parseFloat(range);
  }
  if(!range)
    return '';
  var l = _.filter($scope.lovibond, function(item){
    return (item.srm <= range) ? item.hex : '';
  });
  if(l.length)
    return l[l.length-1].hex;
  return '';
};

//default settings values
$scope.settings = BrewService.settings('settings') || BrewService.reset();
if (!$scope.settings.app)
  $scope.settings.app = { email: '', api_key: '', status: '' };
// general check and update
if(!$scope.settings.general)
  return $scope.clearSettings();
$scope.chartOptions = BrewService.chartOptions({unit: $scope.settings.general.unit, chart: $scope.settings.chart});
$scope.kettles = BrewService.settings('kettles') || BrewService.defaultKettles();

$scope.openSketches = function(){
  $('#settingsModal').modal('hide');
  $('#sketchesModal').modal('show');
};

$scope.sumValues = function(obj){
  return _.sumBy(obj,'amount');
};

$scope.changeArduino = function (kettle) {
  if(!kettle.arduino)
    kettle.arduino = $scope.settings.arduinos[0];
  if (BrewService.isESP(kettle.arduino, true) == '32') {
    kettle.arduino.analog = 39;
    kettle.arduino.digital = 39;
    kettle.arduino.touch = [4,0,2,15,13,12,14,27,33,32];
  } else if (BrewService.isESP(kettle.arduino, true) == '8266') {
    kettle.arduino.analog = 0;
    kettle.arduino.digital = 16;
  }
};
// check kettle type ports
_.each($scope.kettles, kettle => {
  if(!kettle.arduino)
    kettle.arduino = $scope.settings.arduinos[0];
  if (BrewService.isESP(kettle.arduino, true) == '32') {
    kettle.arduino.analog = 39;
    kettle.arduino.digital = 39;
    kettle.arduino.touch = [4,0,2,15,13,12,14,27,33,32];
  } else if (BrewService.isESP(kettle.arduino, true) == '8266') {
    kettle.arduino.analog = 0;
    kettle.arduino.digital = 16;
  }
});
  
// init calc values
$scope.updateABV = function(){
  if($scope.settings.recipe.scale=='gravity'){
    if($scope.settings.recipe.method=='papazian')
      $scope.settings.recipe.abv = BrewService.abv($scope.settings.recipe.og,$scope.settings.recipe.fg);
    else
      $scope.settings.recipe.abv = BrewService.abva($scope.settings.recipe.og,$scope.settings.recipe.fg);
    $scope.settings.recipe.abw = BrewService.abw($scope.settings.recipe.abv,$scope.settings.recipe.fg);
    $scope.settings.recipe.attenuation = BrewService.attenuation(BrewService.plato($scope.settings.recipe.og),BrewService.plato($scope.settings.recipe.fg));
    $scope.settings.recipe.calories = BrewService.calories($scope.settings.recipe.abw
      ,BrewService.re(BrewService.plato($scope.settings.recipe.og),BrewService.plato($scope.settings.recipe.fg))
      ,$scope.settings.recipe.fg);
  } else {
    if($scope.settings.recipe.method=='papazian')
      $scope.settings.recipe.abv = BrewService.abv(BrewService.sg($scope.settings.recipe.og),BrewService.sg($scope.settings.recipe.fg));
    else
      $scope.settings.recipe.abv = BrewService.abva(BrewService.sg($scope.settings.recipe.og),BrewService.sg($scope.settings.recipe.fg));
    $scope.settings.recipe.abw = BrewService.abw($scope.settings.recipe.abv,BrewService.sg($scope.settings.recipe.fg));
    $scope.settings.recipe.attenuation = BrewService.attenuation($scope.settings.recipe.og,$scope.settings.recipe.fg);
    $scope.settings.recipe.calories = BrewService.calories($scope.settings.recipe.abw
      ,BrewService.re($scope.settings.recipe.og,$scope.settings.recipe.fg)
      ,BrewService.sg($scope.settings.recipe.fg));
  }
};

$scope.changeMethod = function(method){
  $scope.settings.recipe.method = method;
  $scope.updateABV();
};

$scope.changeScale = function(scale){
  $scope.settings.recipe.scale = scale;
  if(scale=='gravity'){
    $scope.settings.recipe.og = BrewService.sg($scope.settings.recipe.og);
    $scope.settings.recipe.fg = BrewService.sg($scope.settings.recipe.fg);
  } else {
    $scope.settings.recipe.og = BrewService.plato($scope.settings.recipe.og);
    $scope.settings.recipe.fg = BrewService.plato($scope.settings.recipe.fg);
  }
};

$scope.getStatusClass = function(status){
  if(status == 'Connected')
    return 'success';
  else if(_.endsWith(status,'ing'))
    return 'secondary';
  else
    return 'danger';
}

$scope.updateABV();

  $scope.getPortRange = function(number){
      number++;
      return Array(number).fill().map((_, idx) => 0 + idx);
  };

  $scope.arduinos = {
    add: () => {
      $('[data-toggle="tooltip"]').tooltip('hide');
      var now = new Date();
      if(!$scope.settings.arduinos) $scope.settings.arduinos = [];
      $scope.settings.arduinos.push({
        id: btoa(now+''+$scope.settings.arduinos.length+1),
        url: 'arduino.local',
        board: '',
        RSSI: false,
        analog: 11,
        digital: 13,
        adc: 0,
        secure: false,
        version: '',
        status: { error: '', dt: '', message: '' },
        info: {}
      });
      _.each($scope.kettles, kettle => {
        if(!kettle.arduino)
          kettle.arduino = $scope.settings.arduinos[0];
        if (BrewService.isESP(kettle.arduino, true) == '32') {
          kettle.arduino.analog = 39;
          kettle.arduino.digital = 39;
          kettle.arduino.touch = [4,0,2,15,13,12,14,27,33,32];
        } else if (BrewService.isESP(kettle.arduino, true) == '8266') {
          kettle.arduino.analog = 0;
          kettle.arduino.digital = 16;
        }
      });
    },
    update: (arduino) => {
      $('[data-toggle="tooltip"]').tooltip('hide');
      _.each($scope.kettles, kettle => {
        if(kettle.arduino && kettle.arduino.id == arduino.id)
          kettle.arduino = arduino;
      });
    },
    delete: (index, arduino) => {
      $('[data-toggle="tooltip"]').tooltip('hide');
      $scope.settings.arduinos.splice(index, 1);
      _.each($scope.kettles, kettle => {
        if(kettle.arduino && kettle.arduino.id == arduino.id)
          delete kettle.arduino;
      });
    },
    connect: (arduino) => {
      $('[data-toggle="tooltip"]').tooltip('hide');
      arduino.status.dt = '';
      arduino.status.error = '';
      arduino.status.message = 'Connecting...';
      BrewService.connect(arduino, 'info')
        .then(info => {
          if(info && info.BrewBench){
            arduino.board = info.BrewBench.board;
            if(info.BrewBench.RSSI)
              arduino.RSSI = info.BrewBench.RSSI;
            arduino.version = info.BrewBench.version;
            arduino.status.dt = new Date();
            arduino.status.error = '';
            arduino.status.message = '';
            if(arduino.board.indexOf('ESP32') == 0 || arduino.board.indexOf('NodeMCU_32S') == 0){
              arduino.analog = 39;
              arduino.digital = 39;
              arduino.touch = [4,0,2,15,13,12,14,27,33,32];
            } else if(arduino.board.indexOf('ESP8266') == 0){
              arduino.analog = 0;
              arduino.digital = 16;
            }
          }
        })
        .catch(err => {
          if(err && err.status == -1){
            arduino.status.dt = '';
            arduino.status.message = '';
            arduino.status.error = 'Could not connect';
          }
        });
    },
    info: (arduino) => {
      $('[data-toggle="tooltip"]').tooltip('hide');
      arduino.status.error = '';
      arduino.status.message = 'Getting Info...';
      BrewService.connect(arduino, 'info-ext')
        .then(info => {
          arduino.info = info;
          arduino.status.error = '';
          arduino.status.message = '';
        })
        .catch(err => {
          arduino.info = {};
          if(err && err.status == -1){
            arduino.status.message = '';
            if($scope.pkg.version < 4.2)
              arduino.status.error = 'Upgrade to support reboot';
            else
              arduino.status.error = 'Could not connect';
          }
        });
    },
    reboot: (arduino) => {
      $('[data-toggle="tooltip"]').tooltip('hide');
      arduino.status.dt = '';
      arduino.status.error = '';
      arduino.status.message = 'Rebooting...';
      BrewService.connect(arduino, 'reboot')
        .then(info => {
          arduino.version = '';
          arduino.status.message = 'Reboot Success, try connecting in a few seconds.';
        })
        .catch(err => {
          if(err && err.status == -1){
            arduino.status.dt = '';
            arduino.status.message = '';
            if(pkg.version < 4.2)
              arduino.status.error = 'Upgrade to support reboot';
            else
              arduino.status.error = 'Could not connect';
          }
        });
    }
  };

  $scope.tplink = {
    clear: () => { 
      $scope.settings.tplink = { user: '', pass: '', token: '', status: '', plugs: [] };
    },
    login: () => {
      $scope.settings.tplink.status = 'Connecting';
      BrewService.tplink().login($scope.settings.tplink.user,$scope.settings.tplink.pass)
        .then(response => {
          if(response.token){
            $scope.settings.tplink.status = 'Connected';
            $scope.settings.tplink.token = response.token;
            $scope.tplink.scan(response.token);
          } else if(response.error_code && response.msg){
            $scope.settings.tplink.status = 'Failed to Connect';
            $scope.setErrorMessage(response.msg);  
          }
        })
        .catch(err => {
          $scope.settings.tplink.status = 'Failed to Connect';
          $scope.setErrorMessage(err.msg || err);
        });
    },
    scan: (token) => {
      $scope.settings.tplink.plugs = [];
      $scope.settings.tplink.status = 'Scanning';
      BrewService.tplink().scan(token).then(response => {
        if(response.deviceList){
          $scope.settings.tplink.status = 'Connected';
          $scope.settings.tplink.plugs = response.deviceList;
          // get device info if online (ie. status==1)
          _.each($scope.settings.tplink.plugs, plug => {
            if(Boolean(plug.status)){
              BrewService.tplink().info(plug).then(info => {
                if(info && info.responseData){
                  plug.info = JSON.parse(info.responseData).system.get_sysinfo;
                  if(JSON.parse(info.responseData).emeter.get_realtime.err_code == 0){
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
    info: (device) => {
      BrewService.tplink().info(device).then(response => {
        return response;
      });
    },
    toggle: (device) => {
      var offOrOn = device.info.relay_state == 1 ? 0 : 1;
      BrewService.tplink().toggle(device, offOrOn).then(response => {
        device.info.relay_state = offOrOn;
        return response;
      }).then(toggleResponse => {
        $timeout(() => {
          // update the info
          return BrewService.tplink().info(device).then(info => {
            if(info && info.responseData){
              device.info = JSON.parse(info.responseData).system.get_sysinfo;
              if(JSON.parse(info.responseData).emeter.get_realtime.err_code == 0){
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

  $scope.ifttt = {
    clear: () => { 
      $scope.settings.ifttt = { url: '', method: 'GET', auth: { key: '', value: '' }, status: '' };
    },
    connect: () => {
      $scope.settings.ifttt.status = 'Connecting';
      BrewService.ifttt().connect()
        .then(response => {
          if(response){
            $scope.settings.ifttt.status = 'Connected';
          }
        })
        .catch(err => {
          $scope.settings.ifttt.status = 'Failed to Connect';
          $scope.setErrorMessage(err.msg || err);
        });
    },
  };
  
  $scope.addKettle = function(type){
    if(!$scope.kettles) $scope.kettles = [];
    var arduino = $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : {id: 'local-'+btoa('brewbench'),url:'arduino.local',analog:5,digital:13,adc:0,secure:false};
    $scope.kettles.push({
        name: type ? _.find($scope.kettleTypes,{type: type}).name : $scope.kettleTypes[0].name
        ,id: null
        ,type: type || $scope.kettleTypes[0].type
        ,active: false
        ,sticky: false
        ,heater: {pin:'D6',running:false,auto:false,pwm:false,dutyCycle:100,sketch:false}
        ,pump: {pin:'D7',running:false,auto:false,pwm:false,dutyCycle:100,sketch:false}
        ,temp: {pin:'A0',vcc:'',index:'',type:'Thermistor',adc:false,hit:false,ifttt:false,current:0,measured:0,previous:0,adjust:0,target:$scope.kettleTypes[0].target,diff:$scope.kettleTypes[0].diff,raw:0,volts:0}
        ,values: []
        ,timers: []
        ,knob: angular.copy(BrewService.defaultKnobOptions(),{value:0,min:0,max:$scope.kettleTypes[0].target+$scope.kettleTypes[0].diff})
        ,arduino: arduino
        ,message: {type:'error',message:'',version:'',count:0,location:''}
        ,notify: {slack: false}
    });
  };

  $scope.hasStickyKettles = function(type){
    return _.filter($scope.kettles, {'sticky': true}).length;
  };

  $scope.kettleCount = function(type){
    return _.filter($scope.kettles, {'type': type}).length;
  };

  $scope.activeKettles = function(){
    return _.filter($scope.kettles,{'active': true}).length;
  };
  
  $scope.heatIsOn = function () {
    return Boolean(_.filter($scope.kettles,{'heater': {'running': true}}).length);
  };

  $scope.pinDisplay = function(arduino, pin){
      if( pin.indexOf('TP-')===0 ){
        var device = _.filter($scope.settings.tplink.plugs,{deviceId: pin.substr(3)})[0];
        return device ? device.alias : '';
      } else if(BrewService.isESP(arduino)){
        if(BrewService.isESP(arduino, true) == '8266')
          return pin.replace('D','GPIO');
        else
          return pin.replace('A','GPIO').replace('D','GPIO');
      } else {
        return pin;
      }
  };

  $scope.pinInUse = function(pin,arduinoId){
    var kettle = _.find($scope.kettles, function(kettle){
      return (
        (kettle.arduino.id==arduinoId) &&
        (
          (kettle.temp.pin==pin) ||
          (kettle.temp.vcc==pin) ||
          (kettle.heater.pin==pin) ||
          (kettle.cooler && kettle.cooler.pin==pin) ||
          (!kettle.cooler && kettle.pump.pin==pin)
        )
      );
    });
    return kettle || false;
  };

  $scope.changeSensor = function(kettle){
    if(Boolean(BrewService.sensorTypes(kettle.temp.type).percent)){
      kettle.knob.unit = '\u0025';
    } else {
      kettle.knob.unit = '\u00B0';
    }
    kettle.temp.vcc = '';
    kettle.temp.index = '';
  };

  $scope.influxdb = {
    remove: () => {
      var defaultSettings = BrewService.reset();
      $scope.settings.influxdb = defaultSettings.influxdb;
    },
    connect: () => {
      $scope.settings.influxdb.status = 'Connecting';
      BrewService.influxdb().ping($scope.settings.influxdb)
        .then(response => {
          if(response.status == 204 || response.status == 200){
            $('#influxdbUrl').removeClass('is-invalid');
            $scope.settings.influxdb.status = 'Connected';
            //get list of databases
            BrewService.influxdb().dbs()
            .then(response => {
              if(response.length){
                var dbs = [].concat.apply([], response);
                $scope.settings.influxdb.dbs = _.remove(dbs, (db) => db != "_internal");
              }
            });
          } else {
            $('#influxdbUrl').addClass('is-invalid');
            $scope.settings.influxdb.status = 'Failed to Connect';
          }
        })
        .catch(err => {
          $('#influxdbUrl').addClass('is-invalid');
          $scope.settings.influxdb.status = 'Failed to Connect';
        });
    },
    create: () => {
      var db = $scope.settings.influxdb.db || 'session-'+moment().format('YYYY-MM-DD');
      $scope.settings.influxdb.created = false;
      BrewService.influxdb().createDB(db)
        .then(response => {
          // prompt for password
          if(response.data && response.data.results && response.data.results.length){
            $scope.settings.influxdb.db = db;
            $scope.settings.influxdb.created = true;
            $('#influxdbUser').removeClass('is-invalid');
            $('#influxdbPass').removeClass('is-invalid');
            $scope.resetError();
          } else {
            $scope.setErrorMessage("Opps, there was a problem creating the database.");
          }
        })
        .catch(err => {
          if(err.status && (err.status == 401 || err.status == 403)){
            $('#influxdbUser').addClass('is-invalid');
            $('#influxdbPass').addClass('is-invalid');
            $scope.setErrorMessage("Enter your Username and Password for InfluxDB");
          } else if(err){
            $scope.setErrorMessage(err);
          } else {
            $scope.setErrorMessage("Opps, there was a problem creating the database.");
          }
        });
     }
  };

  $scope.app = {
    connected: () => {
      return (Boolean($scope.settings.app.email) &&
        Boolean($scope.settings.app.api_key) &&
        $scope.settings.app.status == 'Connected'
      );
    },
    remove: () => {
      var defaultSettings = BrewService.reset();
      $scope.settings.app = defaultSettings.app;
    },
    connect: () => {
      if(!Boolean($scope.settings.app.email) || !Boolean($scope.settings.app.api_key))
        return;
      $scope.settings.app.status = 'Connecting';
      return BrewService.app().auth()
        .then(response => {
          $scope.settings.app.status = 'Connected';
        })
        .catch(err => {
          console.error(err);
          $scope.settings.app.status = 'Failed to Connect';
        });
    }
  };

  $scope.importRecipe = function($fileContent,$ext){

      // parse the imported content
      var formatted_content = BrewService.formatXML($fileContent);
      var jsonObj, recipe = null;

      if(Boolean(formatted_content)){
        var x2js = new X2JS();
        jsonObj = x2js.xml_str2json( formatted_content );
      }

      if(!jsonObj)
        return $scope.recipe_success = false;

      if($ext=='bsmx'){
        if(Boolean(jsonObj.Recipes) && Boolean(jsonObj.Recipes.Data.Recipe))
          recipe = jsonObj.Recipes.Data.Recipe;
        else if(Boolean(jsonObj.Selections) && Boolean(jsonObj.Selections.Data.Recipe))
          recipe = jsonObj.Selections.Data.Recipe;
        if(recipe)
          recipe = BrewService.recipeBeerSmith(recipe);
        else
          return $scope.recipe_success = false;
      } else if($ext=='xml'){
        if(Boolean(jsonObj.RECIPES) && Boolean(jsonObj.RECIPES.RECIPE))
          recipe = jsonObj.RECIPES.RECIPE;
        if(recipe)
          recipe = BrewService.recipeBeerXML(recipe);
        else
          return $scope.recipe_success = false;
      }

      if(!recipe)
        return $scope.recipe_success = false;

      if(Boolean(recipe.og))
        $scope.settings.recipe.og = recipe.og;
      if(Boolean(recipe.fg))
        $scope.settings.recipe.fg = recipe.fg;

      $scope.settings.recipe.name = recipe.name;
      $scope.settings.recipe.category = recipe.category;
      $scope.settings.recipe.abv = recipe.abv;
      $scope.settings.recipe.ibu = recipe.ibu;
      $scope.settings.recipe.date = recipe.date;
      $scope.settings.recipe.brewer = recipe.brewer;

      if(recipe.grains.length){
        // recipe display
        $scope.settings.recipe.grains = [];
        _.each(recipe.grains,function(grain){
          if($scope.settings.recipe.grains.length &&
            _.filter($scope.settings.recipe.grains, {name: grain.label}).length){
            _.filter($scope.settings.recipe.grains, {name: grain.label})[0].amount += parseFloat(grain.amount);
          } else {
            $scope.settings.recipe.grains.push({
              name: grain.label, amount: parseFloat(grain.amount)
            });
          }
        });
        // timers
        var kettle = _.filter($scope.kettles,{type:'grain'})[0];
        if(kettle) {
          kettle.timers = [];
          _.each(recipe.grains,function(grain){
            if(kettle){
              $scope.addTimer(kettle,{
                label: grain.label,
                min: grain.min,
                notes: grain.notes
              });
            }
          });
        }
      }

      if(recipe.hops.length){
        // recipe display
        $scope.settings.recipe.hops = [];
        _.each(recipe.hops,function(hop){
          if($scope.settings.recipe.hops.length &&
            _.filter($scope.settings.recipe.hops, {name: hop.label}).length){
            _.filter($scope.settings.recipe.hops, {name: hop.label})[0].amount += parseFloat(hop.amount);
          } else {
            $scope.settings.recipe.hops.push({
              name: hop.label, amount: parseFloat(hop.amount)
            });
          }
        });
        // timers
        var kettle = _.filter($scope.kettles,{type:'hop'})[0];
        if(kettle) {
          kettle.timers = [];
          _.each(recipe.hops,function(hop){
            if(kettle){
              $scope.addTimer(kettle,{
                label: hop.label,
                min: hop.min,
                notes: hop.notes
              });
            }
          });
        }
      }
      if(recipe.misc.length){
        // timers
        var kettle = _.filter($scope.kettles,{type:'water'})[0];
        if(kettle){
          kettle.timers = [];
          _.each(recipe.misc,function(misc){
            $scope.addTimer(kettle,{
              label: misc.label,
              min: misc.min,
              notes: misc.notes
            });
          });
        }
      }
      if(recipe.yeast.length){
        // recipe display
        $scope.settings.recipe.yeast = [];
        _.each(recipe.yeast,function(yeast){
          $scope.settings.recipe.yeast.push({
            name: yeast.name
          });
        });
      }
      $scope.recipe_success = true;
  };

  $scope.loadStyles = function(){
    if(!$scope.styles){
      BrewService.styles().then(function(response){
        $scope.styles = response;
      });
    }
  };

  $scope.loadConfig = function(){
    var config = [];
    if(!$scope.pkg){
      config.push(
        BrewService.pkg().then(function(response){
          $scope.pkg = response;
        })
      );
    }

    if(!$scope.grains){
      config.push(
        BrewService.grains().then(function(response){
          return $scope.grains = _.sortBy(_.uniqBy(response,'name'),'name');
        })
      );
    }

    if(!$scope.hops){
      config.push(
        BrewService.hops().then(function(response){
          return $scope.hops = _.sortBy(_.uniqBy(response,'name'),'name');
        })
      );
    }

    if(!$scope.water){
      config.push(
        BrewService.water().then(function(response){
          return $scope.water = _.sortBy(_.uniqBy(response,'salt'),'salt');
        })
      );
    }

    if(!$scope.lovibond){
      config.push(
        BrewService.lovibond().then(function(response){
          return $scope.lovibond = response;
        })
      );
    }

    return $q.all(config);
};

  // check if pump or heater are running
  $scope.init = () => {
    $('[data-toggle="tooltip"]').tooltip({
      animated: 'fade',
      placement: 'right',
      html: true
    });
    if($('#gitcommit a').text() != 'git_commit'){
      $('#gitcommit').show();
    }
    
    _.each($scope.kettles, kettle => {
        //update max
        kettle.knob.max = kettle.temp['target']+kettle.temp['diff']+10;
        // check timers for running
        if(Boolean(kettle.timers) && kettle.timers.length){
          _.each(kettle.timers, timer => {
            if(timer.running){
              timer.running = false;
              $scope.timerStart(timer,kettle);
            } else if(!timer.running && timer.queue){
              $timeout(() => {
                $scope.timerStart(timer,kettle);
              },60000);
            } else if(timer.up && timer.up.running){
              timer.up.running = false;
              $scope.timerStart(timer.up);
            }
          });
        }
        $scope.updateKnobCopy(kettle);
      });

      return true;
  };

  $scope.setErrorMessage = function(err, kettle, location){    
      var message;

      if(typeof err == 'string' && err.indexOf('{') !== -1){
        if(!Object.keys(err).length) return;
        err = JSON.parse(err);
        if(!Object.keys(err).length) return;
      }

      if(typeof err == 'string')
        message = err;
      else if(Boolean(err.statusText))
        message = err.statusText;
      else if(err.config && err.config.url)
        message = err.config.url;
      else if(err.version){
        if(kettle)
          kettle.message.version = err.version;
      } else {
        message = JSON.stringify(err);
        if(message == '{}') message = '';
      }

      if(Boolean(message)){
        if(kettle){
          kettle.message.type = 'danger';
          kettle.message.count=0;
          kettle.message.message = $sce.trustAsHtml(`Connection error: ${message}`);
          if(location)
            kettle.message.location = location;
          $scope.updateArduinoStatus({kettle:kettle}, message);
          $scope.updateKnobCopy(kettle);
        } else {
          $scope.error.message = $sce.trustAsHtml(`Error: ${message}`);
        }
      } else if(kettle){
        kettle.message.count=0;
        kettle.message.message = $sce.trustAsHtml(`Error connecting to ${BrewService.domain(kettle.arduino)}`);
        $scope.updateArduinoStatus({kettle:kettle}, kettle.message.message);
      } else {
        $scope.error.message = $sce.trustAsHtml('Connection error:');
      }
    
  };
  $scope.updateArduinoStatus = function(response, error){
    var arduino = _.filter($scope.settings.arduinos, {id: response.kettle.arduino.id});
    if(arduino.length){
      arduino[0].status.dt = new Date();
      if(response.sketch_version)
        arduino[0].version = response.sketch_version;
      if(error)
        arduino[0].status.error = error;
      else
        arduino[0].status.error = '';
      }
  };

  $scope.resetError = function(kettle){
    if(kettle) {
      kettle.message.count=0;
      kettle.message.message = $sce.trustAsHtml('');
      $scope.updateArduinoStatus({kettle:kettle});
    } else {
      $scope.error.type = 'danger';
      $scope.error.message = $sce.trustAsHtml('');
    }
  };

  $scope.updateTemp = function(response, kettle){
    if(!response){
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
    if(response.volts)
      response.volts = parseFloat(response.volts);

    if(Boolean(kettle.temp.current))
      kettle.temp.previous = kettle.temp.current;
    // temp response is in C
    kettle.temp.measured = ($scope.settings.general.unit == 'F') ?
      $filter('toFahrenheit')(response.temp) :
      $filter('round')(response.temp, 2);
    
    // add adjustment
    kettle.temp.current = $filter('round')(parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust), 0);    
    // set raw
    kettle.temp.raw = response.raw;
    kettle.temp.volts = response.volts;

    // volt check
    if (kettle.temp.type != 'BMP180' &&
      kettle.temp.type != 'BMP280' &&
      !kettle.temp.volts &&
      !kettle.temp.raw){
        $scope.setErrorMessage('Sensor is not connected', kettle);
      return;
    } else if(kettle.temp.type == 'DS18B20' &&
      response.temp == -127){
        $scope.setErrorMessage('Sensor is not connected', kettle);
      return;
    }

    // reset all kettles every resetChart
    if(kettle.values.length > resetChart){
      $scope.kettles.map((k) => {
        return k.values.shift();
      });
    }

    //DHT sensors have humidity as a percent
    //SoilMoistureD has moisture as a percent
    if( typeof response.percent != 'undefined'){
      kettle.percent = $filter('round')(response.percent,0);
    }
    if( typeof response.moisture != 'undefined'){
      kettle.percent = $filter('round')(response.moisture,0);
    }
    // BMP sensors have altitude and pressure
    if( typeof response.altitude != 'undefined'){
      kettle.altitude = response.altitude;
    }
    if( typeof response.pressure != 'undefined'){
      // pascal to inches of mercury
      kettle.pressure = response.pressure / 3386.389;
    }
    if( typeof response.co2_ppm != 'undefined'){
      // pascal to inches of mercury
      kettle.co2_ppm = response.co2_ppm;
    }

    $scope.updateKnobCopy(kettle);
    $scope.updateArduinoStatus({kettle:kettle, sketch_version:response.sketch_version});

    var currentValue = kettle.temp.current;
    var unitType = '\u00B0';
    //percent?
    if(Boolean(BrewService.sensorTypes(kettle.temp.type).percent) && typeof kettle.percent != 'undefined'){
      currentValue = kettle.percent;
      unitType = '\u0025';
    } else {
      kettle.values.push([date.getTime(),currentValue]);
    }

    //is temp too high?
    if(currentValue > kettle.temp.target+kettle.temp.diff){
      $scope.notify(kettle);
      //stop the heating element
      if(kettle.heater && kettle.heater.auto && kettle.heater.running){
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if(kettle.pump && kettle.pump.auto && kettle.pump.running){
        temps.push($scope.toggleRelay(kettle, kettle.pump, false));
      }
      //start the chiller
      if(kettle.cooler && kettle.cooler.auto && !kettle.cooler.running){
        temps.push($scope.toggleRelay(kettle, kettle.cooler, true).then(cooler => {
          kettle.knob.subText.text = 'cooling';
          kettle.knob.subText.color = 'rgba(52,152,219,1)';
        }));
      }
    } //is temp too low?
    else if(currentValue < kettle.temp.target-kettle.temp.diff){
      $scope.notify(kettle);
      //start the heating element
      if(kettle.heater && kettle.heater.auto && !kettle.heater.running){
        temps.push($scope.toggleRelay(kettle, kettle.heater, true).then(heating => {
          kettle.knob.subText.text = 'heating';
          kettle.knob.subText.color = 'rgba(200,47,47,1)';
        }));
      }
      //start the pump
      if(kettle.pump && kettle.pump.auto && !kettle.pump.running){
        temps.push($scope.toggleRelay(kettle, kettle.pump, true));
      }
      //stop the cooler
      if(kettle.cooler && kettle.cooler.auto && kettle.cooler.running){
        temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
      }
    } else {
      // within target!
      kettle.temp.hit=new Date();//set the time the target was hit so we can now start alerts
      $scope.notify(kettle);
      //stop the heater
      if(kettle.heater && kettle.heater.auto && kettle.heater.running){
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if(kettle.pump && kettle.pump.auto && kettle.pump.running){
        temps.push($scope.toggleRelay(kettle, kettle.pump, false));
      }
      //stop the cooler
      if(kettle.cooler && kettle.cooler.auto && kettle.cooler.running){
        temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
      }
    }
    return $q.all(temps);
  };

  $scope.getNavOffset = function(){
    return 125+angular.element(document.getElementById('navbar'))[0].offsetHeight;
  };

  $scope.addTimer = function(kettle,options){
    if(!kettle.timers)
      kettle.timers=[];
    if(options){
      options.min = options.min ? options.min : 0;
      options.sec = options.sec ? options.sec : 0;
      options.running = options.running ? options.running : false;
      options.queue = options.queue ? options.queue : false;
      kettle.timers.push(options);
    } else {
      kettle.timers.push({label:'Edit label',min:60,sec:0,running:false,queue:false});
    }
  };

  $scope.removeTimers = function(e,kettle){
    var btn = angular.element(e.target);
    if(btn.hasClass('fa-trash-alt')) btn = btn.parent();

    if(!btn.hasClass('btn-danger')){
      btn.removeClass('btn-light').addClass('btn-danger');
      $timeout(function(){
        btn.removeClass('btn-danger').addClass('btn-light');
      },2000);
    } else {
      btn.removeClass('btn-danger').addClass('btn-light');
      kettle.timers=[];
    }
  };

  $scope.togglePWM = function(kettle){
      kettle.pwm = !kettle.pwm;
      if(kettle.pwm)
        kettle.ssr = true;
  };

  $scope.toggleKettle = function(item, kettle){

    $scope.resetError(kettle);
    var k;
    var heatIsOn = $scope.heatIsOn();
    
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

    if(!k)
      return;

    if(!k.running){
      //start the relay
      if (item == 'heat' && $scope.settings.general.heatSafety && heatIsOn) {
        $scope.setErrorMessage('A heater is already running.', kettle);
      } else {
        k.running = !k.running;
        $scope.toggleRelay(kettle, k, true);
      }
    } else if(k.running){
      //stop the relay
      k.running = !k.running;
      $scope.toggleRelay(kettle, k, false);
    }
  };

  $scope.hasSketches = function(kettle){
    var hasASketch = false;
    _.each($scope.kettles, kettle => {
      if((kettle.heater && kettle.heater.sketch) ||
        (kettle.cooler && kettle.cooler.sketch) ||
        kettle.notify.slack
      ) {
        hasASketch = true;
      }
    });
    return hasASketch;
  };

  $scope.startStopKettle = function(kettle){
      kettle.active = !kettle.active;
      $scope.resetError(kettle);
      var date = new Date();
      if(kettle.active){
        kettle.knob.subText.text = 'starting...';

        BrewService.temp(kettle)
          .then(response => $scope.updateTemp(response, kettle))
          .catch(err => {
            // udpate chart with current
            kettle.values.push([date.getTime(),kettle.temp.current]);
            kettle.message.count++;
            if(kettle.message.count==7)
              $scope.setErrorMessage(err, kettle);
          });

        // start the relays
        if(kettle.heater.running){
          $scope.toggleRelay(kettle, kettle.heater, true);
        }
        if(kettle.pump && kettle.pump.running){
          $scope.toggleRelay(kettle, kettle.pump, true);
        }
        if(kettle.cooler && kettle.cooler.running){
          $scope.toggleRelay(kettle, kettle.cooler, true);
        }
      } else {

        //stop the heater
        if(!kettle.active && kettle.heater.running){
          $scope.toggleRelay(kettle, kettle.heater, false);
        }
        //stop the pump
        if(!kettle.active && kettle.pump && kettle.pump.running){
          $scope.toggleRelay(kettle, kettle.pump, false);
        }
        //stop the cooler
        if(!kettle.active && kettle.cooler && kettle.cooler.running){
          $scope.toggleRelay(kettle, kettle.cooler, false);
        }
        if(!kettle.active){
          if(kettle.pump) kettle.pump.auto=false;
          if(kettle.heater) kettle.heater.auto=false;
          if(kettle.cooler) kettle.cooler.auto=false;
          $scope.updateKnobCopy(kettle);
        }
      }
  };

  $scope.toggleRelay = function(kettle, element, on){
    if(on) {
      if(element.pin.indexOf('TP-')===0){
        var device = _.filter($scope.settings.tplink.plugs,{deviceId: element.pin.substr(3)})[0];
        return BrewService.tplink().on(device)
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      }
      else if(element.pwm){
        return BrewService.analog(kettle, element.pin,Math.round(255*element.dutyCycle/100))
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      } else if(element.ssr){
        return BrewService.analog(kettle, element.pin,255)
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      } else {
        return BrewService.digital(kettle, element.pin,1)
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      }
    } else {
      if(element.pin.indexOf('TP-')===0){
        var device = _.filter($scope.settings.tplink.plugs,{deviceId: element.pin.substr(3)})[0];
        return BrewService.tplink().off(device)
          .then(() => {
            //started
            element.running=false;
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      }
      else if(element.pwm || element.ssr){
        return BrewService.analog(kettle, element.pin,0)
          .then(() => {
            element.running=false;
            $scope.updateKnobCopy(kettle);
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      } else {
        return BrewService.digital(kettle, element.pin,0)
          .then(() => {
            element.running=false;
            $scope.updateKnobCopy(kettle);
          })
          .catch((err) => $scope.setErrorMessage(err, kettle));
      }
    }
  }

  $scope.importSettings = function($fileContent,$ext){
    try {
      var profileContent = JSON.parse($fileContent);
      $scope.settings = profileContent.settings || BrewService.reset();
      $scope.kettles = profileContent.kettles || BrewService.defaultKettles();
    } catch(e){
      // error importing
      $scope.setErrorMessage(e);
    }
  };

  $scope.exportSettings = function(){
    var kettles = angular.copy($scope.kettles);
    _.each(kettles, (kettle, i) => {
      kettles[i].values = [];
      kettles[i].active = false;
    });
    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({"settings": $scope.settings,"kettles": kettles}));
  };

  $scope.compileSketch = function(sketchName){
    if(!$scope.settings.sensors)
      $scope.settings.sensors = {};
    // append esp type
    if(sketchName.indexOf('ESP') !== -1)
      sketchName += $scope.esp.type;
    var sketches = [];
    var arduinoName = '';
    _.each($scope.kettles, (kettle, i) => {
      arduinoName = kettle.arduino ? kettle.arduino.url.replace(/[^a-zA-Z0-9-.]/g, "") : 'Default';
      var currentSketch = _.find(sketches,{name: arduinoName});
      if(!currentSketch){
        sketches.push({
          name: arduinoName,
          type: sketchName,
          actions: [],
          pins: [],
          headers: [],
          triggers: false,
          bf: (sketchName.indexOf('BF') !== -1) ? true : false
        });
        currentSketch = _.find(sketches,{name:arduinoName});
      }
      var target = ($scope.settings.general.unit=='F') ? $filter('toCelsius')(kettle.temp.target) : kettle.temp.target;
      kettle.temp.adjust = parseFloat(kettle.temp.adjust);
      var adjust = ($scope.settings.general.unit=='F' && Boolean(kettle.temp.adjust)) ? $filter('round')(kettle.temp.adjust*0.555,3) : kettle.temp.adjust;
      if(BrewService.isESP(kettle.arduino) && $scope.esp.autoconnect){
        currentSketch.headers.push('#include <AutoConnect.h>');
      }
      if((sketchName.indexOf('ESP') !== -1 || BrewService.isESP(kettle.arduino)) &&
        ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1) &&
        currentSketch.headers.indexOf('#include "DHTesp.h"') === -1){
          currentSketch.headers.push('// https://github.com/beegee-tokyo/DHTesp');
          currentSketch.headers.push('#include "DHTesp.h"');
      } else if(!BrewService.isESP(kettle.arduino) &&
        ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1) &&
        currentSketch.headers.indexOf('#include <dht.h>') === -1){
          currentSketch.headers.push('// https://www.brewbench.co/libs/DHTlib-1.2.9.zip');
          currentSketch.headers.push('#include <dht.h>');
      }
      if($scope.settings.sensors.DS18B20 || kettle.temp.type.indexOf('DS18B20') !== -1){
        if(currentSketch.headers.indexOf('#include <OneWire.h>') === -1)
          currentSketch.headers.push('#include <OneWire.h>');
        if(currentSketch.headers.indexOf('#include <DallasTemperature.h>') === -1)
          currentSketch.headers.push('#include <DallasTemperature.h>');
      }
      if($scope.settings.sensors.BMP || kettle.temp.type.indexOf('BMP180') !== -1){
        if(currentSketch.headers.indexOf('#include <Wire.h>') === -1)
          currentSketch.headers.push('#include <Wire.h>');
        if(currentSketch.headers.indexOf('#include <Adafruit_BMP085.h>') === -1)
          currentSketch.headers.push('#include <Adafruit_BMP085.h>');
      }
      if($scope.settings.sensors.BMP || kettle.temp.type.indexOf('BMP280') !== -1){
        if(currentSketch.headers.indexOf('#include <Wire.h>') === -1)
          currentSketch.headers.push('#include <Wire.h>');
        if(currentSketch.headers.indexOf('#include <Adafruit_BMP280.h>') === -1)
          currentSketch.headers.push('#include <Adafruit_BMP280.h>');
      }
      // Are we using ADC?
      if(kettle.temp.pin.indexOf('C') === 0 && currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1){
        currentSketch.headers.push('// https://github.com/adafruit/Adafruit_ADS1X15');
        if(currentSketch.headers.indexOf('#include <OneWire.h>') === -1)
          currentSketch.headers.push('#include <Wire.h>');
        if(currentSketch.headers.indexOf('#include <Adafruit_ADS1015.h>') === -1)
          currentSketch.headers.push('#include <Adafruit_ADS1015.h>');
      }
      // add the actions command
      var kettleType = kettle.temp.type;
      if (kettle.temp.vcc)
        kettleType += kettle.temp.vcc;
      
      if (kettle.temp.index) kettleType += '-' + kettle.temp.index;      
      currentSketch.actions.push('  actionsCommand(F("'+kettle.name.replace(/[^a-zA-Z0-9-.]/g, "")+'"),F("'+kettle.temp.pin+'"),F("'+kettleType+'"),'+adjust+');');
      currentSketch.actions.push('  delay(500);');
      // used for info endpoint
      if (currentSketch.pins.length) {
        currentSketch.pins.push(' pins += ", {\\"name\\":\\"" + String("' + kettle.name + '") + "\\",\\"pin\\":\\"" + String("' + kettle.temp.pin + '") + "\\",\\"type\\":\\"" + String("' + kettleType + '") + "\\",\\"adjust\\":\\"" + String("' + adjust + '") + "\\"}";');        
      } else {
        currentSketch.pins.push(' pins += "{\\"name\\":\\"" + String("'+kettle.name+'") + "\\",\\"pin\\":\\"" + String("'+kettle.temp.pin+'") + "\\",\\"type\\":\\"" + String("'+kettleType+'") + "\\",\\"adjust\\":\\"" + String("'+adjust+'") + "\\"}";');        
      }
      
      if ($scope.settings.sensors.DHT || kettle.temp.type.indexOf('DHT') !== -1 && kettle.percent) {
        currentSketch.actions.push('  actionsPercentCommand(F("'+kettle.name.replace(/[^a-zA-Z0-9-.]/g, "")+'-Humidity"),F("'+kettle.temp.pin+'"),F("'+kettleType+'"),'+adjust+');');
        currentSketch.actions.push('  delay(500);');        
      }
      
      //look for triggers
      if(kettle.heater && kettle.heater.sketch){
        currentSketch.triggers = true;
        currentSketch.actions.push('  trigger(F("heat"),F("'+kettle.name.replace(/[^a-zA-Z0-9-.]/g, "")+'"),F("'+kettle.heater.pin+'"),temp,'+target+','+kettle.temp.diff+','+Boolean(kettle.notify.slack)+');');
      }
      if(kettle.cooler && kettle.cooler.sketch){
        currentSketch.triggers = true;
        currentSketch.actions.push('  trigger(F("cool"),F("'+kettle.name.replace(/[^a-zA-Z0-9-.]/g, "")+'"),F("'+kettle.cooler.pin+'"),temp,'+target+','+kettle.temp.diff+','+Boolean(kettle.notify.slack)+');');
      }
    });
    _.each(sketches, (sketch, i) => {
      if (sketch.triggers || sketch.bf) {
        if (sketch.type.indexOf('M5') === -1) {
          sketch.actions.unshift('float temp = 0.00;');
          if (sketch.bf) {
            sketch.actions.unshift('float ambient = 0.00;');
            sketch.actions.unshift('float humidity = 0.00;');
            sketch.actions.unshift('const String equipment_name = "'+$scope.settings.bf.name+'";');          
          }
        }
        // update autoCommand 
        for (var a = 0; a < sketch.actions.length; a++){
          if (sketch.bf && sketches[i].actions[a].indexOf('actionsPercentCommand(') !== -1 &&
            sketches[i].actions[a].toLowerCase().indexOf('humidity') !== -1) { 
              // BF logic
              sketches[i].actions[a] = sketches[i].actions[a].replace('actionsPercentCommand(', 'humidity = actionsPercentCommand(');
          } else if (sketch.bf && sketches[i].actions[a].indexOf('actionsCommand(') !== -1 &&
            sketches[i].actions[a].toLowerCase().indexOf('ambient') !== -1) { 
              // BF logic
              sketches[i].actions[a] = sketches[i].actions[a].replace('actionsCommand(', 'ambient = actionsCommand(');
          } else if (sketches[i].actions[a].indexOf('actionsCommand(') !== -1) {
            // All other logic
            sketches[i].actions[a] = sketches[i].actions[a].replace('actionsCommand(', 'temp = actionsCommand(');
          }
        }
      }
      downloadSketch(sketch.name, sketch.actions, sketch.pins, sketch.triggers, sketch.headers, 'BrewBench'+sketchName);
    });
  };

  function downloadSketch(name, actions, pins, hasTriggers, headers, sketch){
    // tp link connection
    var tplink_connection_string = BrewService.tplink().connection();
    var autogen = '/*\nSketch Auto Generated from http://monitor.brewbench.co\nVersion '+$scope.pkg.sketch_version+' '+moment().format('YYYY-MM-DD HH:MM:SS')+' for '+name+'\n*/\n';
    $http.get('assets/arduino/'+sketch+'/'+sketch+'.ino')
      .then(response => {
        // replace variables
        response.data = autogen+response.data
          .replace('// [ACTIONS]', actions.length ? actions.join('\n') : '')
          .replace('// [PINS]', pins.length ? pins.join('\n') : '')
          .replace('// [HEADERS]', headers.length ? headers.join('\n') : '')
          .replace(/\[VERSION\]/g, $scope.pkg.sketch_version)
          .replace(/\[TPLINK_CONNECTION\]/g, tplink_connection_string)
          .replace(/\[SLACK_CONNECTION\]/g, $scope.settings.notifications.slack);

        // ESP variables
        if(sketch.indexOf('ESP') !== -1){
          if($scope.esp.ssid){
            response.data = response.data.replace(/\[SSID\]/g, $scope.esp.ssid);
          }
          if($scope.esp.ssid_pass){
            response.data = response.data.replace(/\[SSID_PASS\]/g, $scope.esp.ssid_pass);
          }
          if($scope.esp.arduino_pass){
            response.data = response.data.replace(/\[ARDUINO_PASS\]/g, md5($scope.esp.arduino_pass));
          } else {
            response.data = response.data.replace(/\[ARDUINO_PASS\]/g, md5('bbadmin'));
          }
          if($scope.esp.hostname){
            response.data = response.data.replace(/\[HOSTNAME\]/g, $scope.esp.hostname);
          } else {
            response.data = response.data.replace(/\[HOSTNAME\]/g, 'bbesp');
          }
        } else {
          response.data = response.data.replace(/\[HOSTNAME\]/g, name.replace('.local',''));
        }
        if( sketch.indexOf('App' ) !== -1){
          // app connection
          response.data = response.data.replace(/\[APP_AUTH\]/g, 'X-API-KEY: '+$scope.settings.app.api_key.trim());
        }
        else if( sketch.indexOf('BFYun' ) !== -1){
          // bf api key header
          response.data = response.data.replace(/\[BF_AUTH\]/g, 'X-API-KEY: '+$scope.settings.bf.api_key.trim());
        }
        else if( sketch.indexOf('InfluxDB') !== -1){
          // influx db connection
          var connection_string = `${$scope.settings.influxdb.url}`;
          if( Boolean($scope.settings.influxdb.port))
            connection_string += `:${$scope.settings.influxdb.port}`;
          connection_string += '/write?';
          // add user/pass
          if (Boolean($scope.settings.influxdb.user) && Boolean($scope.settings.influxdb.pass))
            connection_string += `u=${$scope.settings.influxdb.user}&p=${$scope.settings.influxdb.pass}&`;
          // add db
          connection_string += 'db='+($scope.settings.influxdb.db || 'session-'+moment().format('YYYY-MM-DD'));
          response.data = response.data.replace(/\[INFLUXDB_AUTH\]/g, '');
          response.data = response.data.replace(/\[INFLUXDB_CONNECTION\]/g, connection_string);
        }
        if ($scope.settings.sensors.THC) {
          response.data = response.data.replace(/\/\/ THC /g, '');
        }
        if(headers.indexOf('#include <dht.h>') !== -1 || headers.indexOf('#include "DHTesp.h"') !== -1){
          response.data = response.data.replace(/\/\/ DHT /g, '');
        }
        if(headers.indexOf('#include <DallasTemperature.h>') !== -1){
          response.data = response.data.replace(/\/\/ DS18B20 /g, '');
        }
        if(headers.indexOf('#include <Adafruit_ADS1015.h>') !== -1){
          response.data = response.data.replace(/\/\/ ADC /g, '');
        }
        if(headers.indexOf('#include <Adafruit_BMP085.h>') !== -1){
          response.data = response.data.replace(/\/\/ BMP180 /g, '');
        }
        if(headers.indexOf('#include <Adafruit_BMP280.h>') !== -1){
          response.data = response.data.replace(/\/\/ BMP280 /g, '');
        }
        if(hasTriggers){
          response.data = response.data.replace(/\/\/ triggers /g, '');
        }
        var streamSketch = document.createElement('a');
        streamSketch.setAttribute('download', sketch+'-'+name+'-'+$scope.pkg.sketch_version+'.ino');
        streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
        streamSketch.style.display = 'none';
        document.body.appendChild(streamSketch);
        streamSketch.click();
        document.body.removeChild(streamSketch);
      })
      .catch(err => {
        $scope.setErrorMessage(`Failed to download sketch ${err.message}`);
      });
  }

  $scope.getIPAddress = function(){
    $scope.settings.ipAddress = "";
    BrewService.ip()
      .then(response => {
        $scope.settings.ipAddress = response.ip;
      })
      .catch(err => {
        $scope.setErrorMessage(err);
      });
  };

  $scope.notify = function(kettle,timer){

    //don't start alerts until we have hit the temp.target
    if(!timer && kettle && !kettle.temp.hit
      || $scope.settings.notifications.on === false){
        return;
    }
    var date = new Date();
    // Desktop / Slack Notification
    var message,
      icon = '/assets/img/brewbench-logo.png',
      color = 'good';

    if(kettle && ['hop','grain','water','fermenter'].indexOf(kettle.type)!==-1)
      icon = '/assets/img/'+kettle.type+'.png';

    //don't alert if the heater is running and temp is too low
    if(kettle && kettle.low && kettle.heater.running)
      return;

    var currentValue = (kettle && kettle.temp) ? kettle.temp.current : 0;
    var unitType = '\u00B0'+$scope.settings.general.unit;
    //percent?
    if(kettle && Boolean(BrewService.sensorTypes(kettle.temp.type).percent) && typeof kettle.percent != 'undefined'){
      currentValue = kettle.percent;
      unitType = '\u0025';
    } else if(kettle){
      kettle.values.push([date.getTime(),currentValue]);
    }

    if(Boolean(timer)){ //kettle is a timer object
      if(!$scope.settings.notifications.timers)
        return;
      if(timer.up)
        message = 'Your timers are done';
      else if(Boolean(timer.notes))
        message = 'Time to add '+timer.notes+' of '+timer.label;
      else
        message = 'Time to add '+timer.label;
    }
    else if(kettle && kettle.high){
      if(!$scope.settings.notifications.high || $scope.settings.notifications.last=='high')
        return;
      message = kettle.name+' is '+$filter('round')(kettle.high-kettle.temp.diff,0)+unitType+' high';
      color = 'danger';
      $scope.settings.notifications.last='high';
    }
    else if(kettle && kettle.low){
      if(!$scope.settings.notifications.low || $scope.settings.notifications.last=='low')
        return;
      message = kettle.name+' is '+$filter('round')(kettle.low-kettle.temp.diff,0)+unitType+' low';
      color = '#3498DB';
      $scope.settings.notifications.last='low';
    }
    else if(kettle){
      if(!$scope.settings.notifications.target || $scope.settings.notifications.last=='target')
        return;
      message = kettle.name+' is within the target at '+currentValue+unitType;
      color = 'good';
      $scope.settings.notifications.last='target';
    }
    else if(!kettle){
      message = 'Testing Alerts, you are ready to go, click play on a kettle.';
    }

    // Mobile Vibrate Notification
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 300, 500]);
    }

    // Sound Notification
    if($scope.settings.sounds.on===true){
      //don't alert if the heater is running and temp is too low
      if(Boolean(timer) && kettle && kettle.low && kettle.heater.running)
        return;
      var snd = new Audio((Boolean(timer)) ? $scope.settings.sounds.timer : $scope.settings.sounds.alert); // buffers automatically when created
      snd.play();
    }

    // Window Notification
    if("Notification" in window){
      //close the measured notification
      if(notification)
        notification.close();

      if(Notification.permission === "granted"){
        if(message){
          if(kettle)
            notification = new Notification(kettle.name+' kettle',{body:message,icon:icon});
          else
            notification = new Notification('Test kettle',{body:message,icon:icon});
        }
      } else if(Notification.permission !== 'denied'){
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if(message){
              notification = new Notification(kettle.name+' kettle',{body:message,icon:icon});
            }
          }
        });
      }
    }
    // Slack Notification
    if($scope.settings.notifications.slack && $scope.settings.notifications.slack.indexOf('http') === 0){
      BrewService.slack($scope.settings.notifications.slack,
          message,
          color,
          icon,
          kettle
        ).then(function(response){
          $scope.resetError();
        })
        .catch(function(err){
          if(err.message)
            $scope.setErrorMessage(`Failed posting to Slack ${err.message}`);
          else
            $scope.setErrorMessage(`Failed posting to Slack ${JSON.stringify(err)}`);
        });
    }
    // IFTTT Notification
    if(Boolean(kettle.temp.ifttt) && $scope.settings.ifttt.url && $scope.settings.ifttt.url.indexOf('http') === 0){
      BrewService.ifttt().send({
          message: message,
          color: color,     
          unit: $scope.settings.general.unit,
          name: kettle.name,
          type: kettle.type,
          temp: kettle.temp,
          heater: kettle.heater,
          pump: kettle.pump,
          cooler: kettle.cooler || {},
          arduino: kettle.arduino          
        }).then(function(response){
          $scope.resetError();
        })
        .catch(function(err){
          if(err.message)
            $scope.setErrorMessage(`Failed sending to IFTTT ${err.message}`);
          else
            $scope.setErrorMessage(`Failed sending to IFTTT ${JSON.stringify(err)}`);
        });
    }
  };

  $scope.updateKnobCopy = function(kettle){

    if(!kettle.active){
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'not running';
      kettle.knob.subText.color = 'gray';
      return;
    } else if(kettle.message.message && kettle.message.type == 'danger'){
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'error';
      kettle.knob.subText.color = 'gray';
      return;
    }
    var currentValue = kettle.temp.current;
    var unitType = '\u00B0';
    //percent?
    if(Boolean(BrewService.sensorTypes(kettle.temp.type).percent) && typeof kettle.percent != 'undefined'){
      currentValue = kettle.percent;
      unitType = '\u0025';
    }
    //is currentValue too high?
    if(currentValue > kettle.temp.target+kettle.temp.diff){
      kettle.knob.barColor = 'rgba(255,0,0,.6)';
      kettle.knob.trackColor = 'rgba(255,0,0,.1)';
      kettle.high = currentValue-kettle.temp.target;
      kettle.low = null;
      if(kettle.cooler && kettle.cooler.running){
        kettle.knob.subText.text = 'cooling';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.high-kettle.temp.diff,0)+unitType+' high';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      }
    } else if(currentValue < kettle.temp.target-kettle.temp.diff){
      kettle.knob.barColor = 'rgba(52,152,219,.5)';
      kettle.knob.trackColor = 'rgba(52,152,219,.1)';
      kettle.low = kettle.temp.target-currentValue;
      kettle.high = null;
      if(kettle.heater.running){
        kettle.knob.subText.text = 'heating';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      } else {
        //update knob text
        kettle.knob.subText.text = $filter('round')(kettle.low-kettle.temp.diff,0)+unitType+' low';
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
  };

  $scope.changeKettleType = function(kettle){
    // find current kettle
    var kettleIndex = _.findIndex($scope.kettleTypes, {type: kettle.type});
    // move to next or first kettle in array
    kettleIndex++;
    var kettleType = ($scope.kettleTypes[kettleIndex]) ? $scope.kettleTypes[kettleIndex] : $scope.kettleTypes[0];
    //update kettle options if changed
    kettle.name = kettleType.name;
    kettle.type = kettleType.type;
    kettle.temp.target = kettleType.target;
    kettle.temp.diff = kettleType.diff;
    kettle.knob = angular.copy(BrewService.defaultKnobOptions(),{value:kettle.temp.current,min:0,max:kettleType.target+kettleType.diff});
    if(kettleType.type == 'fermenter' || kettleType.type == 'air'){
      kettle.cooler = {pin:'D2',running:false,auto:false,pwm:false,dutyCycle:100,sketch:false};
      delete kettle.pump;
    } else {
      kettle.pump = {pin:'D2',running:false,auto:false,pwm:false,dutyCycle:100,sketch:false};
      delete kettle.cooler;
    }
  };

  $scope.changeUnits = function(unit){
    if($scope.settings.general.unit != unit){
      $scope.settings.general.unit = unit;
      _.each($scope.kettles,function(kettle){
        kettle.temp.target = parseFloat(kettle.temp.target);
        kettle.temp.current = parseFloat(kettle.temp.current);
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current,unit);
        kettle.temp.measured = $filter('formatDegrees')(kettle.temp.measured,unit);
        kettle.temp.previous = $filter('formatDegrees')(kettle.temp.previous,unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target,unit);
        kettle.temp.target = $filter('round')(kettle.temp.target,0);
        if(Boolean(kettle.temp.adjust)){
          kettle.temp.adjust = parseFloat(kettle.temp.adjust);
          if(unit === 'C')
            kettle.temp.adjust = $filter('round')(kettle.temp.adjust*0.555,3);
          else
            kettle.temp.adjust = $filter('round')(kettle.temp.adjust*1.8,0);
        }
        // update chart values
        if(kettle.values.length){
            _.each(kettle.values, (v, i) => {
              kettle.values[i] = [kettle.values[i][0],$filter('formatDegrees')(kettle.values[i][1],unit)];
          });
        }
        // update knob
        kettle.knob.value = kettle.temp.current;
        kettle.knob.max = kettle.temp.target+kettle.temp.diff+10;
        $scope.updateKnobCopy(kettle);
      });
      $scope.chartOptions = BrewService.chartOptions({unit: $scope.settings.general.unit, chart: $scope.settings.chart});
    }
  };

  $scope.timerRun = function(timer,kettle){
    return $interval(function () {
      //cancel interval if zero out
      if(!timer.up && timer.min==0 && timer.sec==0){
        //stop running
        timer.running = false;
        //start up counter
        timer.up = {min:0,sec:0,running:true};
        //if all timers are done send an alert
        if( Boolean(kettle) && _.filter(kettle.timers, {up: {running:true}}).length == kettle.timers.length )
          $scope.notify(kettle,timer);
      } else if(!timer.up && timer.sec > 0){
        //count down seconds
        timer.sec--;
      } else if(timer.up && timer.up.sec < 59){
        //count up seconds
        timer.up.sec++;
      } else if(!timer.up){
        //should we start the next timer?
        if(Boolean(kettle)){
          _.each(_.filter(kettle.timers, {running:false,min:timer.min,queue:false}),function(nextTimer){
            $scope.notify(kettle,nextTimer);
            nextTimer.queue=true;
            $timeout(function(){
              $scope.timerStart(nextTimer,kettle);
            },60000);
          });
        }
        //cound down minutes and seconds
        timer.sec=59;
        timer.min--;
      } else if(timer.up){
        //cound up minutes and seconds
        timer.up.sec=0;
        timer.up.min++;
      }
    },1000);
  };

  $scope.timerStart = function(timer,kettle){
    if(timer.up && timer.up.running){
      //stop timer
      timer.up.running=false;
      $interval.cancel(timer.interval);
    } else if(timer.running){
      //stop timer
      timer.running=false;
      $interval.cancel(timer.interval);
    } else {
      //start timer
      timer.running=true;
      timer.queue=false;
      timer.interval = $scope.timerRun(timer,kettle);
    }
  };

  $scope.processTemps = function(){
    var allSensors = [];
    var date = new Date();
    //only process active sensors
    _.each($scope.kettles, (k, i) => {
      if($scope.kettles[i].active){
        allSensors.push(BrewService.temp($scope.kettles[i])
          .then(response => $scope.updateTemp(response, $scope.kettles[i]))
          .catch(err => {
            // update chart with current
            kettle.values.push([date.getTime(),kettle.temp.current]);
            if($scope.kettles[i].error.count)
              $scope.kettles[i].error.count++;
            else
              $scope.kettles[i].error.count=1;
            if($scope.kettles[i].error.count == 7){
              $scope.kettles[i].error.count=0;
              $scope.setErrorMessage(err, $scope.kettles[i]);
            }
            return err;
          }));
      }
    });

    return $q.all(allSensors)
      .then(values => {
        //re process on timeout
        $timeout(function(){
            return $scope.processTemps();
        },Boolean($scope.settings.pollSeconds) ? $scope.settings.pollSeconds*1000 : 10000);
      })
      .catch(err => {
        $timeout(function(){
            return $scope.processTemps();
        },Boolean($scope.settings.pollSeconds) ? $scope.settings.pollSeconds*1000 : 10000);
    });
  };

  $scope.removeKettle = function (kettle, $index) {    
    if(confirm('Are you sure you want to remove this kettle?'))
      $scope.kettles.splice($index,1);
  };
  
  $scope.clearKettle = function (kettle, $index) {
    $scope.kettles[$index].values = [];
  };

  $scope.changeValue = function(kettle,field,up){

    if(timeout)
      $timeout.cancel(timeout);

    if(up)
      kettle.temp[field]++;
    else
      kettle.temp[field]--;

    if(field == 'adjust'){
      kettle.temp.current = (parseFloat(kettle.temp.measured) + parseFloat(kettle.temp.adjust));
    }

    //update knob after 1 seconds, otherwise we get a lot of refresh on the knob when clicking plus or minus
    timeout = $timeout(function(){
      //update max
      kettle.knob.max = kettle.temp['target']+kettle.temp['diff']+10;
      $scope.updateKnobCopy(kettle);
    },1000);
  };

  $scope.loadConfig() // load config
    .then($scope.init) // init
    .then(loaded => {
      if(Boolean(loaded))
        $scope.processTemps(); // start polling
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
