angular.module('brewbench-monitor')
.controller('mainCtrl', function($scope, $stateParams, $state, $filter, $timeout, $interval, $q, $http, BrewService){

var notification = null
  ,resetChart = 100
  ,timeout = null;//reset chart after 100 polls

$scope.hops;
$scope.grains;
$scope.water;
$scope.lovibond;
$scope.kettleTypes = BrewService.kettleTypes();
$scope.chartOptions = BrewService.chartOptions();
$scope.sensorTypes = BrewService.sensorTypes;
$scope.showSettings = true;
$scope.error = {message: '', type: 'danger'};
$scope.slider = {
  min: 0,
  options: {
    floor: 0,
    ceil: 100,
    step: 5,
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
  if(!!l.length)
    return l[l.length-1].hex;
  return '';
};

//default settings values
$scope.settings = BrewService.settings('settings') || BrewService.reset();
$scope.kettles = BrewService.settings('kettles') || BrewService.defaultKettles();
$scope.share = (!$state.params.file && BrewService.settings('share')) ? BrewService.settings('share') : {
      file: $state.params.file || null
      , password: null
      , needPassword: false
      , access: 'readOnly'
      , deleteAfter: 14
  };

$scope.sumValues = function(obj){
  return _.sum(_.values(obj));
}

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

$scope.updateABV();

  $scope.getPortRange = function(number){
      number++;
      return Array(number).fill().map((_, idx) => 0 + idx);
  };

  $scope.arduinos = {
    add: () => {
      let now = new Date();
      if(!$scope.settings.arduinos) $scope.settings.arduinos = [];
      $scope.settings.arduinos.push({
        id: btoa(now+''+$scope.settings.arduinos.length+1),
        url: 'arduino.local',
        analog: 5,
        digital: 13
      });
      _.each($scope.kettles, kettle => {
        if(!kettle.arduino)
          kettle.arduino = $scope.settings.arduinos[0];
      });
    },
    update: (arduino) => {
      _.each($scope.kettles, kettle => {
        if(kettle.arduino && kettle.arduino.id == arduino.id)
          kettle.arduino = arduino;
      });
    },
    delete: (index, arduino) => {
      $scope.settings.arduinos.splice(index, 1);
      _.each($scope.kettles, kettle => {
        if(kettle.arduino && kettle.arduino.id == arduino.id)
          delete kettle.arduino;
      });
    }
  };

  $scope.sessions = {
    add: () => {
      let now = new Date();
      if(!$scope.settings.account.sessions) $scope.settings.account.sessions = [];
      $scope.settings.account.sessions.push({
        id: btoa(now+''+$scope.settings.arduinos.length+1),
        name: 'Session Name',
        created: moment()
      });
    },
    update: (arduino) => {

    },
    delete: (index, arduino) => {

    }
  };

  $scope.addKettle = function(type){
    if(!$scope.kettles) $scope.kettles = [];
    $scope.kettles.push({
        key: $scope.kettleTypes[0].name
        ,type: type || $scope.kettleTypes[0].type
        ,active: false
        ,sticky: false
        ,heater: {pin:'D6',running:false,auto:false}
        ,pump: {pin:'D7',running:false,auto:false}
        ,temp: {pin:'A0',type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:$scope.kettleTypes[0].target,diff:$scope.kettleTypes[0].diff}
        ,values: []
        ,timers: []
        ,knob: angular.copy(BrewService.defaultKnobOptions(),{value:0,min:0,max:$scope.kettleTypes[0].target+$scope.kettleTypes[0].diff})
        ,arduino: $scope.settings.arduinos.length ? $scope.settings.arduinos[0] : null
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

  $scope.pinInUse = function(pin,analog){
    var kettle = _.find($scope.kettles, function(kettle){
      return (
        (analog && kettle.temp.type=='Thermistor' && kettle.temp.pin==pin) ||
        (!analog && kettle.temp.type=='DS18B20' && kettle.temp.pin==pin) ||
        (kettle.temp.type=='PT100' && kettle.temp.pin==pin) ||
        (!analog && kettle.heater.pin==pin) ||
        (!analog && kettle.cooler && kettle.cooler.pin==pin) ||
        (!analog && !kettle.cooler && kettle.pump.pin==pin)
      );
    });
    return kettle || false;
  };

  $scope.pinChange = function(old_pin,new_pin,analog){
    //find kettle with new pin and replace it with old pin
    var kettle = $scope.pinInUse(new_pin,analog);
    if(kettle){
      if(kettle.temp.pin == new_pin)
        kettle.temp.pin = old_pin;
      else if(kettle.heater.pin == new_pin)
        kettle.heater.pin = old_pin;
      else if(kettle.pump.pin == new_pin)
        kettle.pump.pin = old_pin;
    }
  };

  $scope.createShare = function(){
    if(!$scope.settings.recipe.brewer.name || !$scope.settings.recipe.brewer.email)
      return;
    $scope.share_status = 'Creating share link...';
    return BrewService.createShare($scope.share)
      .then(function(response) {
        if(response.share && response.share.url){
          $scope.share_status = '';
          $scope.share_success = true;
          $scope.share_link = response.share.url;
        } else {
          $scope.share_success = false;
        }
      })
      .catch(err => {
        $scope.share_status = err;
        $scope.share_success = false;
      });
  };

  $scope.shareTest = function(arduino){
    arduino.testing = true;
    BrewService.shareTest(arduino)
      .then(response => {
        arduino.testing = false;
        if(response.http_code == 200)
          arduino.public = true;
        else
          arduino.public = false;
      })
      .catch(err => {
        arduino.testing = false;
        arduino.public = false;
      });
  };

  $scope.testInfluxDB = function(){
    $scope.settings.influxDB.testing = true;
    BrewService.influx()
      .then(response => {
        $scope.settings.influxDB.testing = false;
        if(response.status == 204)
          $scope.settings.influxDB.connected = true;
        else
          $scope.settings.influxDB.connected = false;
      })
      .catch(err => {
        $scope.settings.influxDB.testing = false;
        $scope.settings.influxDB.connected = false;
      });
  };



  $scope.shareAccess = function(access){
      if($scope.settings.shared){
        if(access){
          if(access == 'embed'){
            return !!(window.frameElement);
          } else {
            return !!($scope.share.access && $scope.share.access === access);
          }
        }
        return true;
      } else if(access && access == 'embed'){
        return !!(window.frameElement);
      }
      return true;
  };

  $scope.loadShareFile = function(){
    BrewService.clear();
    $scope.settings = BrewService.reset();
    $scope.settings.shared = true;
    return BrewService.loadShareFile($scope.share.file, $scope.share.password || null)
      .then(function(contents) {
        if(contents){
          if(contents.needPassword){
            $scope.share.needPassword = true;
            if(contents.settings.recipe){
              $scope.settings.recipe = contents.settings.recipe;
            }
            return false;
          } else {
            $scope.share.needPassword = false;
            if(contents.share && contents.share.access){
              $scope.share.access = contents.share.access;
            }
            if(contents.settings){
              $scope.settings = contents.settings;
              $scope.settings.notifications = {on:false,timers:true,high:true,low:true,target:true,slack:'Webhook Url',last:''};
            }
            if(contents.kettles){
              _.each(contents.kettles, kettle => {
                kettle.knob = angular.copy(BrewService.defaultKnobOptions(),{value:0,min:0,max:200+5,subText:{enabled: true,text: 'starting...',color: 'gray',font: 'auto'}});
                kettle.values = [];
              });
              $scope.kettles = contents.kettles;
            }
            return $scope.processTemps();
          }
        } else {
          return false;
        }
      })
      .catch(function(err) {
        return $scope.error.message = "Opps, there was a problem loading the shared session.";
      });
  };

  $scope.importRecipe = function($fileContent,$ext){

      // parse the imported content
      var formatted_content = BrewService.formatXML($fileContent);
      var jsonObj, recipe = null;

      if(!!formatted_content){
        var x2js = new X2JS();
        jsonObj = x2js.xml_str2json( formatted_content );
      }

      if(!jsonObj)
        return $scope.recipe_success = false;

      if($ext=='bsmx'){
        if(!!jsonObj.Recipes && !!jsonObj.Recipes.Data.Recipe)
          recipe = jsonObj.Recipes.Data.Recipe;
        else if(!!jsonObj.Selections && !!jsonObj.Selections.Data.Recipe)
          recipe = jsonObj.Selections.Data.Recipe;
        if(recipe)
          recipe = BrewService.recipeBeerSmith(recipe);
        else
          return $scope.recipe_success = false;
      } else if($ext=='xml'){
        if(!!jsonObj.RECIPES && !!jsonObj.RECIPES.RECIPE)
          recipe = jsonObj.RECIPES.RECIPE;
        if(recipe)
          recipe = BrewService.recipeBeerXML(recipe);
        else
          return $scope.recipe_success = false;
      }

      if(!recipe)
        return $scope.recipe_success = false;

      if(!!recipe.og)
        $scope.settings.recipe.og = recipe.og;
      if(!!recipe.fg)
        $scope.settings.recipe.fg = recipe.fg;

      $scope.settings.recipe.name = recipe.name;
      $scope.settings.recipe.category = recipe.category;
      $scope.settings.recipe.abv = recipe.abv;
      $scope.settings.recipe.ibu = recipe.ibu;
      $scope.settings.recipe.date = recipe.date;
      $scope.settings.recipe.brewer = recipe.brewer;

      if(recipe.grains.length){
        $scope.settings.recipe.grains = recipe.grains;
        let kettle = _.filter($scope.kettles,{type:'grain'})[0];
        if(kettle) kettle.timers = [];
        $scope.settings.recipe.grains = {};
        _.each(recipe.grains,function(grain){
          if(kettle){
            $scope.addTimer(kettle,{
              label: grain.label,
              min: grain.min,
              notes: grain.notes
            });
          }
          // sum the amounts for the grains
          if($scope.settings.recipe.grains[grain.label])
            $scope.settings.recipe.grains[grain.label] += Number(grain.amount);
          else
            $scope.settings.recipe.grains[grain.label] = Number(grain.amount);
        });
      }

      if(recipe.hops.length){
        let kettle = _.filter($scope.kettles,{type:'hop'})[0];
        if(kettle) kettle.timers = [];
        $scope.settings.recipe.hops = {};
        _.each(recipe.hops,function(hop){
          if(kettle){
            $scope.addTimer(kettle,{
              label: hop.label,
              min: hop.min,
              notes: hop.notes
            });
          }
          // sum the amounts for the hops
          if($scope.settings.recipe.hops[hop.label])
            $scope.settings.recipe.hops[hop.label] += Number(hop.amount);
          else
            $scope.settings.recipe.hops[hop.label] = Number(hop.amount);
        });
      }
      if(recipe.misc.length){
        let kettle = _.filter($scope.kettles,{type:'water'})[0];
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
      config.push(BrewService.pkg().then(function(response){
          $scope.pkg = response;
          return $scope.settings.sketch_version = response.sketch_version;
        })
      );
    }

    if(!$scope.grains){
      config.push(BrewService.grains().then(function(response){
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
    $scope.showSettings = !$scope.settings.shared;
    if($scope.share.file)
      return $scope.loadShareFile();

    _.each($scope.kettles, kettle => {
        //update max
        kettle.knob.max = kettle.temp['target']+kettle.temp['diff']+10;
        // check timers for running
        if(!!kettle.timers && kettle.timers.length){
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

  $scope.connectError = function(err, kettle){
    if(!!$scope.settings.shared){
      $scope.error.type = 'warning';
      $scope.error.message = 'The monitor seems to be off-line, re-connecting...';
    } else {
      let message;

      if(typeof err == 'string' && err.indexOf('{') !== -1)
        err = JSON.parse(err);

      if(typeof err == 'string')
        message = err;
      else if(err.statusText)
        message = err.statusText;
      else if(err.config.url)
        message = err.config.url;
      else
        message = JSON.stringify(err);

      if(message){
        if(kettle){
          kettle.error = `Connection error: ${message}`;
          $scope.updateKnobCopy(kettle);
        }
        else
          $scope.error.message = `Connection error: ${message}`;
      } else if(kettle){
        kettle.error = `Error connecting to ${BrewService.domain(kettle.arduino)}`;
      } else {
        $scope.error.message = `Connection error:`;
      }
    }
  };

  $scope.resetError = function(kettle){
    $scope.error.type = 'danger';
    // $scope.error.message = '';
    if(kettle) kettle.error = '';
  };

  $scope.updateTemp = function(response, kettle){
    if(!response || !response.temp){
      return false;
    }

    $scope.resetError(kettle);

    var temps = [];
    //chart date
    var date = new Date();
    // temp response is in C
    kettle.temp.previous = ($scope.settings.unit == 'F') ?
      $filter('toFahrenheit')(response.temp) :
      Math.round(response.temp);
    kettle.temp.current = kettle.temp.previous+kettle.temp.adjust;

    //reset all kettles every resetChart
    if(kettle.values.length > resetChart){
      $scope.kettles.map((k) => {
        return k.values=[];
      });
    }

    kettle.values.push([date.getTime(),kettle.temp.current]);

    $scope.updateKnobCopy(kettle);

    //is temp too high?
    if(kettle.temp.current >= kettle.temp.target+kettle.temp.diff){
      //stop the heating element
      if(kettle.heater.auto && kettle.heater.running){
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if(kettle.pump.auto && kettle.pump.running){
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
    else if(kettle.temp.current <= kettle.temp.target-kettle.temp.diff){
      $scope.alert(kettle);
      //start the heating element
      if(kettle.heater.auto && !kettle.heater.running){
        temps.push($scope.toggleRelay(kettle, kettle.heater, true).then(heating => {
          kettle.knob.subText.text = 'heating';
          kettle.knob.subText.color = 'rgba(200,47,47,1)';
        }));
      }
      //start the pump
      if(kettle.pump.auto && !kettle.pump.running){
        temps.push($scope.toggleRelay(kettle, kettle.pump, true));
      }
      //stop the cooler
      if(kettle.cooler && kettle.cooler.auto && kettle.cooler.running){
        temps.push($scope.toggleRelay(kettle, kettle.cooler, false));
      }
    } else {
      // within target!
      kettle.temp.hit=new Date();//set the time the target was hit so we can now start alerts
      $scope.alert(kettle);
      //stop the heater
      if(kettle.heater.auto && kettle.heater.running){
        temps.push($scope.toggleRelay(kettle, kettle.heater, false));
      }
      //stop the pump
      if(kettle.pump.auto && kettle.pump.running){
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
    if(btn.hasClass('fa-trash')) btn = btn.parent();

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

    if(!k)
      return;

    k.running = !k.running;

    if(kettle.active && k.running){
      //start the relay
      $scope.toggleRelay(kettle, k, true);
    } else if(!k.running){
      //stop the relay
      $scope.toggleRelay(kettle, k, false);
    }
  };

  $scope.knobClick = function(kettle){
      //set adjustment amount
      if(!!kettle.temp.previous){
        kettle.temp.adjust = kettle.temp.current - kettle.temp.previous;
      }
  };

  $scope.startStopKettle = function(kettle){
      kettle.active = !kettle.active;
      $scope.resetError(kettle);

      if(kettle.active){
        kettle.knob.subText.text = 'starting...';
        kettle.knob.readOnly = false;

        BrewService.temp(kettle)
          .then(response => $scope.updateTemp(response, kettle))
          .catch(err => $scope.connectError(err, kettle));

        // start the relays
        if(kettle.heater.running){
          $scope.toggleRelay(kettle, kettle.heater, true);
        }
        if(kettle.pump.running){
          $scope.toggleRelay(kettle, kettle.pump, true);
        }
        if(kettle.cooler && kettle.cooler.running){
          $scope.toggleRelay(kettle, kettle.cooler, true);
        }
      } else {
        kettle.knob.readOnly = true;
        //stop the heater
        if(!kettle.active && kettle.heater.running){
          $scope.toggleRelay(kettle, kettle.heater, false);
        }
        //stop the pump
        if(!kettle.active && kettle.pump.running){
          $scope.toggleRelay(kettle, kettle.pump, false);
        }
        //stop the cooler
        if(!kettle.active && kettle.cooler && kettle.cooler.running){
          $scope.toggleRelay(kettle, kettle.cooler, false);
        }
        if(!kettle.active){
          kettle.pump.auto=false;
          kettle.heater.auto=false;
          if(kettle.cooler)
            kettle.cooler.auto=false;
          $scope.updateKnobCopy(kettle);
        }
      }
  };

  $scope.toggleRelay = function(kettle, element, on){
    if(on) {
      if(element.pwm){
        return BrewService.analog(kettle, element.pin,Math.round(255*element.dutyCycle/100))
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.connectError(err, kettle));
      } else if(element.ssr){
        return BrewService.analog(kettle, element.pin,255)
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.connectError(err, kettle));
      } else {
        return BrewService.digital(kettle, element.pin,1)
          .then(() => {
            //started
            element.running=true;
          })
          .catch((err) => $scope.connectError(err, kettle));
      }
    } else {
      if(element.pwm || element.ssr){
        return BrewService.analog(kettle, element.pin,0)
          .then(() => {
            element.running=false;
            $scope.updateKnobCopy(kettle);
          })
          .catch((err) => $scope.connectError(err, kettle));
      } else {
        return BrewService.digital(kettle, element.pin,0)
          .then(() => {
            element.running=false;
            $scope.updateKnobCopy(kettle);
          })
          .catch((err) => $scope.connectError(err, kettle));
      }
    }
  }

  $scope.importSettings = function($fileContent,$ext){
    try {
      let profileContent = JSON.parse($fileContent);
      console.log(profileContent)
      $scope.settings = profileContent.settings || BrewService.reset();
      $scope.kettles = profileContent.kettles || BrewService.defaultKettles();
    } catch(e){
      // error importing
    }
  };

  $scope.exportSettings = function(){
    let kettles = angular.copy($scope.kettles);
    _.each(kettles, (kettle, i) => {
      kettles[i].values = [];
      kettles[i].active = false;
    });
    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({"settings": $scope.settings,"kettles": kettles}));
  };

  $scope.downloadInfluxDBSketch = function(){
    if(!settings.influxDB.url) return;

    let kettles = "";
    _.each($scope.kettles, (kettle, i) => {
      if( kettle.temp.type == 'Thermistor' )
        kettles += 'thermistorInfluxDBCommand("'+kettle.key+'","'+kettle.temp.pin+'");\n  ';
      else if( kettle.temp.type == 'DS18B20' )
        kettles += 'ds18B20InfluxDBCommand("'+kettle.key+'","'+kettle.temp.pin+'");\n  ';
      else if( kettle.temp.type == 'PT100' )
        kettles += 'pt100InfluxDBCommand("'+kettle.key+'","'+kettle.temp.pin+'");\n  ';
    });
    return $http.get('assets/BrewBenchInfluxDBYun/BrewBenchInfluxDBYun.ino')
      .then(response => {
        response.data = response.data
          .replace('// [kettles]', kettles)
          .replace('[INFLUXDB_URL]', $scope.settings.influxDB.url)
          .replace('[INFLUXDB_PORT]', $scope.settings.influxDB.port)
          .replace('[SESSION_NAME]', 'session-'+moment('YYYY-MM-DD'));
        let streamSketch = document.createElement('a');
        streamSketch.setAttribute('download', 'BrewBenchInfluxDBYun.ino');
        streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
        streamSketch.click();
      })
      .catch(err => {
        $scope.error.message = `Failed to download sketch ${err.message}`;
      });
  };

  $scope.downloadStreamsSketch = function(sessionId){
    let kettles = "";
    _.each($scope.kettles, (kettle, i) => {
      if( kettle.temp.type == 'Thermistor' )
        kettles += 'thermistorAPICommand("'+kettle.key+'","'+kettle.temp.pin+'");\n  ';
      else if( kettle.temp.type == 'DS18B20' )
        kettles += 'ds18B20APICommand("'+kettle.key+'","'+kettle.temp.pin+'");\n  ';
      else if( kettle.temp.type == 'PT100' )
        kettles += 'pt100APICommand("'+kettle.key+'","'+kettle.temp.pin+'");\n  ';
    });
    return $http.get('assets/BrewBenchStreamsYun/BrewBenchStreamsYun.ino')
      .then(response => {
        response.data = response.data
          .replace('// [kettles]', kettles)
          .replace('[API_KEY]', $scope.settings.account.apiKey)
          .replace('[SESSION_ID]', sessionId);
        let streamSketch = document.createElement('a');
        streamSketch.setAttribute('download', 'BrewBenchStreamsYun.ino');
        streamSketch.setAttribute('href', "data:text/ino;charset=utf-8," + encodeURIComponent(response.data));
        streamSketch.click();
      })
      .catch(err => {
        $scope.error.message = `Failed to download sketch ${err.message}`;
      });
  };

  $scope.clearSettings = function(e){
    if(e){
      angular.element(e.target).html('Removing...');
    }
    BrewService.clear();
    $timeout(function(){
      window.location.href='/';
    },1000);
  };

  $scope.alert = function(kettle,timer){

    //don't start alerts until we have hit the temp.target
    if(!timer && kettle && !kettle.temp.hit
      || $scope.settings.notifications.on === false){
        return;
    }

    // Desktop / Slack Notification
    let message,
      icon = '/assets/img/brewbench-logo.png',
      color = 'good';

    if(kettle && ['hop','grain','water','fermenter'].indexOf(kettle.type)!==-1)
      icon = '/assets/img/'+kettle.type+'.png';

    //don't alert if the heater is running and temp is too low
    if(kettle && kettle.low && kettle.heater.running)
      return;

    if(!!timer){ //kettle is a timer object
      if(!$scope.settings.notifications.timers)
        return;
      if(timer.up)
        message = 'Your timers are done';
      else if(!!timer.notes)
        message = 'Time to add '+timer.notes+' of '+timer.label;
      else
        message = 'Time to add '+timer.label;
    }
    else if(kettle && kettle.high){
      if(!$scope.settings.notifications.high || $scope.settings.notifications.last=='high')
        return;
      message = 'Your '+kettle.key+' kettle is '+(kettle.high-kettle.temp.diff)+'\u00B0 high';
      color = 'danger';
      $scope.settings.notifications.last='high';
    }
    else if(kettle && kettle.low){
      if(!$scope.settings.notifications.low || $scope.settings.notifications.last=='low')
        return;
      message = 'Your '+kettle.key+' kettle is '+(kettle.low-kettle.temp.diff)+'\u00B0 low';
      color = '#3498DB';
      $scope.settings.notifications.last='low';
    }
    else if(kettle){
      if(!$scope.settings.notifications.target || $scope.settings.notifications.last=='target')
        return;
      message = 'Your '+kettle.key+' kettle is within the target at '+kettle.temp.current+'\u00B0';
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
      if(!!timer && kettle && kettle.low && kettle.heater.running)
        return;
      var snd = new Audio((!!timer) ? $scope.settings.sounds.timer : $scope.settings.sounds.alert); // buffers automatically when created
      snd.play();
    }

    // Window Notification
    if("Notification" in window){
      //close the previous notification
      if(notification)
        notification.close();

      if(Notification.permission === "granted"){
        if(message){
          if(kettle)
            notification = new Notification(kettle.key+' kettle',{body:message,icon:icon});
          else
            notification = new Notification('Test kettle',{body:message,icon:icon});
        }
      } else if(Notification.permission !== 'denied'){
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if(message){
              notification = new Notification(kettle.key+' kettle',{body:message,icon:icon});
            }
          }
        });
      }
    }
    // Slack Notification
    if($scope.settings.notifications.slack.indexOf('http') === 0){
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
            $scope.error.message = `Failed posting to Slack ${err.message}`;
          else
            $scope.error.message = `Failed posting to Slack ${JSON.stringify(err)}`;
        });
    }
  };

  $scope.updateKnobCopy = function(kettle){

    if(!kettle.active){
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
      kettle.knob.subText.text = 'not running';
      kettle.knob.subText.color = 'gray';
      kettle.knob.readOnly = true;
      return;
    } else if(kettle.error){
        kettle.knob.trackColor = '#ddd';
        kettle.knob.barColor = '#777';
        kettle.knob.subText.text = 'error';
        kettle.knob.subText.color = 'gray';
        kettle.knob.readOnly = true;
        return;
    }

    kettle.knob.readOnly = false;

    //is temp too high?
    if(kettle.temp.current > kettle.temp.target+kettle.temp.diff){
      kettle.knob.barColor = 'rgba(255,0,0,.6)';
      kettle.knob.trackColor = 'rgba(255,0,0,.1)';
      kettle.high = kettle.temp.current-kettle.temp.target;
      kettle.low = null;
      if(kettle.cooler && kettle.cooler.running){
        kettle.knob.subText.text = 'cooling';
        kettle.knob.subText.color = 'rgba(52,152,219,1)';
      } else {
        //update knob text
        kettle.knob.subText.text = (kettle.high-kettle.temp.diff)+'\u00B0 high';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      }
    } else if(kettle.temp.current < kettle.temp.target-kettle.temp.diff){
      kettle.knob.barColor = 'rgba(52,152,219,.5)';
      kettle.knob.trackColor = 'rgba(52,152,219,.1)';
      kettle.low = kettle.temp.target-kettle.temp.current;
      kettle.high = null;
      if(kettle.heater.running){
        kettle.knob.subText.text = 'heating';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      } else {
        //update knob text
        kettle.knob.subText.text = (kettle.low-kettle.temp.diff)+'\u00B0 low';
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
    //don't allow changing kettles on shared sessions
    //this could be dangerous if doing this remotely
    if($scope.settings.shared)
      return;
    // find current kettle
    var kettleIndex = _.findIndex($scope.kettleTypes, {type: kettle.type});
    // move to next or first kettle in array
    kettleIndex++;
    var kettleType = ($scope.kettleTypes[kettleIndex]) ? $scope.kettleTypes[kettleIndex] : $scope.kettleTypes[0];
    //update kettle options if changed
    kettle.key = kettleType.name;
    kettle.type = kettleType.type;
    kettle.temp.target = kettleType.target;
    kettle.temp.diff = kettleType.diff;
    kettle.knob = angular.copy(BrewService.defaultKnobOptions(),{value:kettle.temp.current,min:0,max:kettleType.target+kettleType.diff});
    if(kettleType.type == 'fermenter' || kettleType.type == 'air')
      kettle.cooler = {pin:'D2',running:false,auto:false,pwm:false,dutyCycle:100};
    else
      delete kettle.cooler;
  };

  $scope.changeUnits = function(unit){
    if($scope.settings.unit != unit){
      $scope.settings.unit = unit;
      _.each($scope.kettles,function(kettle){
        kettle.temp.current = $filter('formatDegrees')(kettle.temp.current,unit);
        kettle.temp.target = $filter('formatDegrees')(kettle.temp.target,unit);
        // update knob
        kettle.knob.value = kettle.temp.current;
        kettle.knob.max = kettle.temp.target+kettle.temp.diff+10;
        $scope.updateKnobCopy(kettle);
      });
      $scope.chartOptions = BrewService.chartOptions(unit);
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
        if( !!kettle && _.filter(kettle.timers, {up: {running:true}}).length == kettle.timers.length )
          $scope.alert(kettle,timer);
      } else if(!timer.up && timer.sec > 0){
        //count down seconds
        timer.sec--;
      } else if(timer.up && timer.up.sec < 59){
        //count up seconds
        timer.up.sec++;
      } else if(!timer.up){
        //should we start the next timer?
        if(!!kettle){
          _.each(_.filter(kettle.timers, {running:false,min:timer.min,queue:false}),function(nextTimer){
            $scope.alert(kettle,nextTimer);
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
    //only process active sensors
    _.each($scope.kettles, (k, i) => {
      if($scope.kettles[i].active){
        allSensors.push(BrewService.temp($scope.kettles[i])
          .then(response => $scope.updateTemp(response, $scope.kettles[i]))
          .catch(err => {
            $scope.connectError(err, $scope.kettles[i]);
            return err;
          }));
      }
    });

    return $q.all(allSensors)
      .then(values => {
        //re process on timeout
        $timeout(function(){
            return $scope.processTemps();
        },(!!$scope.settings.pollSeconds) ? $scope.settings.pollSeconds*1000 : 10000);
      })
      .catch(err => {
        $timeout(function(){
            return $scope.processTemps();
        },(!!$scope.settings.pollSeconds) ? $scope.settings.pollSeconds*1000 : 10000);
    });
  };

  $scope.changeValue = function(kettle,field,up){

    if(timeout)
      $timeout.cancel(timeout);

    if(up)
      kettle.temp[field]++;
    else
      kettle.temp[field]--;

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
      if(!!loaded)
        $scope.processTemps(); // start polling
    });
  // scope watch
  $scope.$watch('settings',function(newValue,oldValue){
    BrewService.settings('settings',newValue);
  },true);

  $scope.$watch('kettles',function(newValue,oldValue){
    BrewService.settings('kettles',newValue);
  },true);

  $scope.$watch('share',function(newValue,oldValue){
    BrewService.settings('share',newValue);
  },true);

});
