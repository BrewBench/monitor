angular.module('brewbench-monitor')
.controller('mainCtrl', function($scope, $stateParams, $state, $filter, $timeout, $interval, $q, BrewService){

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
$scope.error_message = '';
$scope.slider = {options: {
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
        return BrewService.analog(k.pin,Math.round(255*k.dutyCycle/100)).then(function(){
          //started
        }).catch(function(err){
          $scope.connectError(err);
        });
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
$scope.settings = BrewService.settings('settings') || {
  pollSeconds: 10
  ,unit: 'F'
  ,shared: false
  ,arduinoUrl: '192.168.240.1'
  ,ports: {'analog':5, 'digital':13}
  ,recipe: {'name':'','brewer':{name:'','email':''},'yeast':[],'hops':[],'malt':[],scale:'gravity',method:'papazian','og':1.050,'fg':1.010,'abv':0,'abw':0,'calories':0,'attenuation':0}
  ,notifications: {on:true,timers:true,high:true,low:true,target:true,slack:'Slack notification webhook Url',last:''}
  ,sounds: {on:true,alert:'/assets/audio/bike.mp3',timer:'/assets/audio/school.mp3'}
};

$scope.showSettingsSide = function(){
    $scope.showSettings = !$scope.showSettings;
};

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

$scope.urls = BrewService.settings('urls') || [];

if(!$scope.urls.length && $scope.settings.arduinoUrl)
  $scope.urls.push($scope.settings.arduinoUrl);

if(!!$stateParams.domain)
  $scope.settings.arduinoUrl=$stateParams.domain;

$scope.knobOptions = {
  readOnly: true,
  unit: '\u00B0',
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

//default kettle values
$scope.kettles = BrewService.settings('kettles') || [{
    key: 'Boil'
    ,type: 'hop'
    ,active: false
    ,heater: {pin:'D2',running:false,auto:false,pwm:false,dutyCycle:100}
    ,pump: {pin:'D3',running:false,auto:false,pwm:false,dutyCycle:100}
    ,temp: {pin:'A0',type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:200,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:200+5})
  },{
    key: 'Hot Liquor'
    ,type: 'water'
    ,active: false
    ,heater: {pin:'D4',running:false,auto:false,pwm:false,dutyCycle:100}
    ,pump: {pin:'D5',running:false,auto:false,pwm:false,dutyCycle:100}
    ,temp: {pin:'A1',type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:200,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:200+5})
  },{
    key: 'Mash'
    ,type: 'grain'
    ,active: false
    ,heater: {pin:'D6',running:false,auto:false,pwm:false,dutyCycle:100}
    ,pump: {pin:'D7',running:false,auto:false,pwm:false,dutyCycle:100}
    ,temp: {pin:'A2',type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:150,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:150+5})
  }];

  $scope.getPortRange = function(number){
      number++;
      return Array(number).fill().map((_, idx) => 0 + idx);
  };

  $scope.addKettle = function(){
    if($scope.kettles.length < 5){
      $scope.kettles.push(
        {
          key: $scope.kettleTypes[0].name
          ,type: $scope.kettleTypes[0].type
          ,active: false
          ,heater: {pin:'D6',running:false,auto:false}
          ,pump: {pin:'D7',running:false,auto:false}
          ,temp: {pin:'A0',type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:$scope.kettleTypes[0].target,diff:$scope.kettleTypes[0].diff}
          ,values: []
          ,timers: []
          ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:$scope.kettleTypes[0].target+$scope.kettleTypes[0].diff})
        }
      );
    }
  };

  $scope.activeKettles = function(){
    return _.filter($scope.kettles,{active:true}).length;
  };

  $scope.pinInUse = function(pin,analog){
    var kettle = _.find($scope.kettles, function(kettle){
      return (
        (analog && kettle.temp.type=='Thermistor' && kettle.temp.pin==pin) ||
        (!analog && kettle.temp.type=='DS18B20' && kettle.temp.pin==pin) ||
        (analog && kettle.temp.type=='PT100' && kettle.temp.pin==pin) ||
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
    BrewService.createShare()
      .then(function(response) {
        if(response.share && response.share.url){
          $scope.share_success = true;
          $scope.share_link = response.share.url;
        } else {
          $scope.share_success = false;
        }
      })
      .catch(err => {
        $scope.share_success = false;
      });
  };

  $scope.loadShareFile = function(file){
    return BrewService.loadShareFile(file)
      .then(function(contents) {
        if(contents){
          if(contents.settings){
            $scope.settings = contents.settings;
            $scope.settings.notifications = {on:false,timers:true,high:true,low:true,target:true,slack:'Slack notification webhook Url',last:''};
          }
          if(contents.kettles){
            _.each(contents.kettles, kettle => {
              kettle.knob = angular.merge($scope.knobOptions,{value:0,min:0,max:200+5,subText:{enabled: true,text: 'starting...',color: 'gray',font: 'auto'}});
              kettle.values = [];
            });
            $scope.kettles = contents.kettles;
          }
        }
        return true;
      })
      .catch(function(err) {
        return $scope.error_message = "Opps, there was a problem loading the shared session.";
      });
  };

  $scope.importRecipe = function($fileContent,$ext){

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

      if(recipe.grains.length){
        var kettle = _.filter($scope.kettles,{type:'grain'})[0];
        if(kettle){
          kettle.timers = [];
          _.each(recipe.grains,function(grain){
            $scope.addTimer(kettle,{
              label: grain.label,
              min: grain.min,
              notes: grain.notes
            });
          });
        }
      }

      if(recipe.hops.length){
        var kettle = _.filter($scope.kettles,{type:'hop'})[0];
        if(kettle){
          kettle.timers = [];
          _.each(recipe.hops,function(hop){
            $scope.addTimer(kettle,{
              label: hop.label,
              min: hop.min,
              notes: hop.notes
            });
          });
        }
      }
      if(recipe.misc.length){
        var kettle = _.filter($scope.kettles,{type:'hop'})[0];
        if(kettle){
          _.each(recipe.misc,function(misc){
            $scope.addTimer(kettle,{
              label: misc.label,
              min: misc.min
            });
          });
        }
      }
      if(recipe.yeast){
        _.each(recipe.yeast,function(yeast){
          $scope.settings.recipe.yeast.push({
            name: yeast.name
          });
        });
      }
      $scope.recipe_success = true;
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
  $scope.init = function(){
    $scope.showSettings = !$scope.settings.shared;
    if($state.params.file)
      return $scope.loadShareFile($state.params.file);

    var running = [];
    _.each($scope.kettles,function(kettle){
        //update max
        kettle.knob.max=kettle.temp['target']+kettle.temp['diff'];
        // check timers for running
        if(!!kettle.timers && kettle.timers.length){
          _.each(kettle.timers, function(timer){
            if(timer.running){
              timer.running = false;
              $scope.timerStart(timer,kettle);
            } else if(!timer.running && timer.queue){
              $timeout(function(){
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

      return $q.all(running);
  };

  $scope.connectError = function(err){
    if(!!$scope.settings.shared){
      $scope.error_message = 'The monitor seems to be off-line, re-connecting...';
    } else {
      if(err && typeof err == 'string')
        $scope.error_message = err;
      else
        $scope.error_message = 'Could not connect to the Arduino at '+BrewService.domain();
    }
  };

  function updateTemp(response,kettle){

    if(!response || !response.temp){
      return false;
    }

    $scope.error_message = '';
    var temps = [];
    //chart date
    var date = new Date();
    // temp response is in C
    kettle.temp.previous = ($scope.settings.unit === 'F') ? $filter('toFahrenheit')(response.temp) : Math.round(response.temp);
    kettle.temp.current = kettle.temp.previous+kettle.temp.adjust;

    //reset all kettles every resetChart
    if(kettle.values.length > resetChart){
      $scope.kettles.map(function(k){
        return k.values=[];
      });
    }

    kettle.values.push([date.getTime(),kettle.temp.current]);

    $scope.updateKnobCopy(kettle);

    //is temp too high?
    if(kettle.temp.current >= kettle.temp.target+kettle.temp.diff){
      $scope.alert(kettle);
      //stop the heating element
      if(kettle.heater.auto && kettle.heater.running){
        if(kettle.heater.pwm || kettle.heater.ssr){
          temps.push(BrewService.analog(kettle.heater.pin,0).then(function(){
              kettle.heater.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.heater.pin,0).then(function(){
              kettle.heater.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
      //stop the pump
      if(kettle.pump.auto && kettle.pump.running){
        if(kettle.pump.pwm || kettle.pump.ssr){
          temps.push(BrewService.analog(kettle.pump.pin,0).then(function(){
              kettle.pump.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.pump.pin,0).then(function(){
              kettle.pump.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
      //start the chiller
      if(kettle.cooler && kettle.cooler.auto && !kettle.cooler.running){
        if(kettle.cooler.pwm || kettle.cooler.ssr){
          var dutyCycle = kettle.cooler.pwm ? Math.round(255*kettle.cooler.dutyCycle/100) : 255;
          temps.push(BrewService.analog(kettle.cooler.pin,dutyCycle).then(function(){
              kettle.cooler.running = true;
              kettle.knob.subText.text = 'cooling';
              kettle.knob.subText.color = 'rgba(52,152,219,1)';
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.cooler.pin,1).then(function(){
              kettle.cooler.running = true;
              kettle.knob.subText.text = 'cooling';
              kettle.knob.subText.color = 'rgba(52,152,219,1)';
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }

      }
    } //is temp too low?
    else if(kettle.temp.current <= kettle.temp.target-kettle.temp.diff){
      $scope.alert(kettle);
      //start the heating element
      if(kettle.heater.auto && !kettle.heater.running){
        if(kettle.heater.pwm || kettle.heater.ssr){
          var dutyCycle = kettle.heater.pwm ? Math.round(255*kettle.heater.dutyCycle/100) : 255;
          temps.push(BrewService.analog(kettle.heater.pin,dutyCycle).then(function(){
              kettle.heater.running = true;
              kettle.knob.subText.text = 'heating';
              kettle.knob.subText.color = 'rgba(200,47,47,1)';
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.heater.pin,1).then(function(){
              kettle.heater.running = true;
              kettle.knob.subText.text = 'heating';
              kettle.knob.subText.color = 'rgba(200,47,47,1)';
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
      //start the pump
      if(kettle.pump.auto && !kettle.pump.running){
        if(kettle.heater.pwm || kettle.heater.ssr){
          var dutyCycle = kettle.pump.pwm ? Math.round(255*kettle.pump.dutyCycle/100) : 255;
          temps.push(BrewService.analog(kettle.pump.pin,dutyCycle).then(function(){
              kettle.pump.running = true;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.pump.pin,1).then(function(){
              kettle.pump.running = true;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
      //stop the chiller
      if(kettle.cooler && kettle.cooler.auto && kettle.cooler.running){
        if(kettle.cooler.pwm || kettle.cooler.ssr){
          temps.push(BrewService.analog(kettle.cooler.pin,0).then(function(){
              kettle.cooler.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.cooler.pin,0).then(function(){
              kettle.cooler.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
    } else {
      // within target!
      kettle.temp.hit=new Date();//set the time the target was hit so we can now start alerts
      $scope.alert(kettle);
      //stop the chiller
      if(kettle.cooler && kettle.cooler.auto && kettle.cooler.running){
        if(kettle.cooler.pwm || kettle.cooler.ssr){
          temps.push(BrewService.analog(kettle.cooler.pin,0).then(function(){
              kettle.cooler.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.cooler.pin,0).then(function(){
              kettle.cooler.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
      //stop the heater
      if(kettle.heater.auto && kettle.heater.running){
        if(kettle.heater.pwm || kettle.heater.ssr){
          temps.push(BrewService.analog(kettle.heater.pin,0).then(function(){
              kettle.heater.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.heater.pin,0).then(function(){
              kettle.heater.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
      //stop the pump
      if(kettle.pump.auto && kettle.pump.running){
        if(kettle.pump.pwm || kettle.pump.ssr){
          temps.push(BrewService.analog(kettle.pump.pin,0).then(function(){
              kettle.pump.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        } else {
          temps.push(BrewService.digital(kettle.pump.pin,0).then(function(){
              kettle.pump.running = false;
            }).catch(function(err){
              $scope.connectError(err);
            })
          );
        }
      }
    }
    return $q.all(temps);
  };

  $scope.getNavOffset = function(){
    return 55+angular.element(document.getElementById('navbar'))[0].offsetHeight;
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
      btn.removeClass('btn-default').addClass('btn-danger');
      $timeout(function(){
        btn.removeClass('btn-danger').addClass('btn-default');
      },1000);
    } else {
      btn.removeClass('btn-danger').addClass('btn-default');
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

    //start the port
    if(kettle.active && k.running){
      if(k.pwm){
        BrewService.analog(k.pin,Math.round(255*k.dutyCycle/100)).then(function(){
          //started
        }).catch(function(err){
          $scope.connectError(err);
        });
      } else if(k.ssr){
        BrewService.analog(k.pin,255).then(function(){
          //started
        }).catch(function(err){
          $scope.connectError(err);
        });
      } else {
        BrewService.digital(k.pin,1).then(function(){
          //started
        }).catch(function(err){
          $scope.connectError(err);
        });
      }
    } else if(!k.running){
      if(k.pwm){
        BrewService.analog(k.pin,0).then(function(){
          //started
        }).catch(function(err){
          $scope.connectError(err);
        });
      } else if(k.ssr){
        BrewService.analog(k.pin,0).then(function(){
          //started
        }).catch(function(err){
          $scope.connectError(err);
        });
      } else {
        BrewService.digital(k.pin,0).then(function(){
          //stopped
        }).catch(function(err){
          $scope.connectError(err);
        });
      }
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

      if(kettle.active){
        BrewService.temp(kettle.temp)
          .then(function(response){
            updateTemp(response,kettle);
          })
          .catch(function(err){
            $scope.connectError(err);
          });
        kettle.knob.subText.text = 'starting...';
        kettle.knob.readOnly = false;
      } else {
        kettle.knob.readOnly = true;
      }

      //stop the heating element
      if(!kettle.active && kettle.heater.running){
        BrewService.digital(kettle.heater.pin,0).then(function(){
          kettle.heater.running=false;
          $scope.updateKnobCopy(kettle);
        }).catch(function(err){
          $scope.connectError(err);
        });
      }
      if(!kettle.active && kettle.pump.running){
        BrewService.digital(kettle.pump.pin,0).then(function(){
          kettle.pump.running=false;
          $scope.updateKnobCopy(kettle);
        }).catch(function(err){
          $scope.connectError(err);
        });
      }
      if(kettle.cooler && !kettle.active && kettle.cooler.running){
        BrewService.digital(kettle.cooler.pin,0).then(function(){
          kettle.cooler.running=false;
          $scope.updateKnobCopy(kettle);
        }).catch(function(err){
          $scope.connectError(err);
        });
      }
      if(!kettle.active){
        kettle.pump.auto=false;
        kettle.heater.auto=false;
        if(kettle.cooler)
          kettle.cooler.auto=false;
        $scope.updateKnobCopy(kettle);
      }
  };

  $scope.clearKettles = function(e){
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
    var message, icon = '/assets/img/brewbench-logo.png', color = 'good';

    if(kettle && ['hop','grain','water'].indexOf(kettle.type)!==-1)
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
    if($scope.settings.notifications.slack.indexOf('http')!==-1){
      BrewService.slack($scope.settings.notifications.slack,message,color,icon,kettle).then(function(response){
        // console.log('Slack',response);
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
    }

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
    kettle.knob = angular.merge($scope.knobOptions,{value:kettle.temp.current,min:0,max:kettleType.target+kettleType.diff});
    if(kettleType.type === 'fermenter')
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
        kettle.knob.max = kettle.temp.target+kettle.temp.diff;
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
    _.each($scope.kettles, function(kettle){
      if(kettle.active){
        allSensors.push(BrewService.temp(kettle.temp).then(function(response){
            return updateTemp(response,kettle);
          },function error(err){
            $scope.connectError(err);
            return err;
          }));
      }
    });

    return $q.all(allSensors).then(function(values){
      //re process on timeout
      $timeout(function(){
          return $scope.processTemps();
      },$scope.settings.pollSeconds*1000);
    }).catch(function(err){
      $timeout(function(){
          return $scope.processTemps();
      },$scope.settings.pollSeconds*1000);
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
      kettle.knob.max=kettle.temp['target']+kettle.temp['diff'];
      $scope.updateKnobCopy(kettle);
    },1000);
  };

  $scope.saveArduinoUrl = function(){
    if($scope.urls.indexOf($scope.settings.arduinoUrl) === -1){
      $scope.urls.push($scope.settings.arduinoUrl);
      BrewService.settings('urls',$scope.urls);
    }
  };

  $scope.loadConfig() // load config
    .then($scope.init) // init
    .then($scope.processTemps);// start polling

  // scope watch
  $scope.$watch('settings',function(newValue,oldValue){
    BrewService.settings('settings',newValue);
  },true);

  $scope.$watch('kettles',function(newValue,oldValue){
    BrewService.settings('kettles',newValue);
  },true);

});
