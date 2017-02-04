brewBench.controller('mainCtrl', function($scope, $stateParams, $state, $filter, $timeout, $interval, $q, BrewService){

var notification = null
  ,resetChart = 100
  ,timeout = null;//reset chart after 100 polls

$scope.hops;
$scope.grains;
$scope.water;
$scope.lovibond;
$scope.chartOptions = BrewService.chartOptions();

$scope.error_message = '';

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
  ,arduinoUrl: '192.168.240.1'
  ,storage: 'sd'
  ,recipe: {'name':'','yeast':[],scale:'gravity',method:'papazian','og': 1.060, 'fg': 1.015, 'abv':0, 'abw':0, 'calories':0, 'attenuation':0}
  ,notifications: {on:true,timers:true,high:true,low:true,target:true,slack:'Slack notification webhook Url',last:''}
  ,sounds: {on:true,alert:'audio/bike.mp3',timer:'audio/school.mp3'}
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

if(!!$stateParams.domain){
  $scope.settings.arduinoUrl=$stateParams.domain;
}

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
    ,heater: {pin:2,running:false,auto:false}
    ,pump: {pin:3,running:false,auto:false}
    ,temp: {pin:0,type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:200,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:200+5})
  },{
    key: 'Hot Liquor'
    ,type: 'water'
    ,active: false
    ,heater: {pin:4,running:false,auto:false}
    ,pump: {pin:5,running:false,auto:false}
    ,temp: {pin:1,type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:200,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:200+5})
  },{
    key: 'Mash'
    ,type: 'grain'
    ,active: false
    ,heater: {pin:6,running:false,auto:false}
    ,pump: {pin:7,running:false,auto:false}
    ,temp: {pin:2,type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:150,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:150+5})
  }];

  $scope.addKettle = function(){
    if($scope.kettles.length < 5){
      $scope.kettles.push(
        {
          key: 'New Kettle'
          ,type: 'water'
          ,active: false
          ,heater: {pin:6,running:false,auto:false}
          ,pump: {pin:7,running:false,auto:false}
          ,temp: {pin:0,type:'Thermistor',hit:false,current:0,previous:0,adjust:0,target:150,diff:5}
          ,values: []
          ,timers: []
          ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:150+5})
        }
      );
    }
  };

  $scope.activeKettles = function(){
    return _.filter($scope.kettles,{active:true}).length;
  }

  $scope.pinInUse = function(pin,analog){
    var kettle = _.find($scope.kettles, function(kettle){
      return (
        (analog && kettle.temp.type=='Thermistor' && kettle.temp.pin==pin) ||
        (!analog && kettle.temp.type=='DS18B20' && kettle.temp.pin==pin) ||
        (!analog && kettle.heater.pin==pin) ||
        (!analog && kettle.pump.pin==pin)
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

  $scope.showContent = function($fileContent){

      var x2js = new X2JS();
      var jsonObj = x2js.xml_str2json( $fileContent.replace(/&ldquo;/g,'"').replace(/&rdquo;/g,'"').replace(/&rsquo;/g,"'").replace(/&ndash;/g,"-") );
      if($scope.settings.recipe)
        $scope.settings.recipe = {name:'',yeast:[]};

      var recipe = null;

      if(!!jsonObj){
        if(!!jsonObj.Recipes && !!jsonObj.Recipes.Data.Recipe)
          recipe = jsonObj.Recipes.Data.Recipe;
        else if(!!jsonObj.Selections && !!jsonObj.Selections.Data.Recipe)
          recipe = jsonObj.Selections.Data.Recipe;
      }
      if(recipe){

        if(!!recipe.F_R_NAME)
          $scope.settings.recipe.name = recipe.F_R_NAME;
        if(!!recipe.F_R_STYLE.F_S_CATEGORY)
          $scope.settings.recipe.category = recipe.F_R_STYLE.F_S_CATEGORY;

        if(!!recipe.F_R_STYLE.F_S_MAX_ABV && !!recipe.F_R_STYLE.F_S_MIN_ABV)
          $scope.settings.recipe.abv = parseFloat(recipe.F_R_STYLE.F_S_MIN_ABV).toFixed(2)+' - '+parseFloat(recipe.F_R_STYLE.F_S_MAX_ABV).toFixed(2);
        else if(!!recipe.F_R_STYLE.F_S_MAX_ABV)
          $scope.settings.recipe.abv = parseFloat(recipe.F_R_STYLE.F_S_MAX_ABV).toFixed(2);
        else if(!!recipe.F_R_STYLE.F_S_MIN_ABV)
          $scope.settings.recipe.abv = parseFloat(recipe.F_R_STYLE.F_S_MIN_ABV).toFixed(2);

        if(!!recipe.Ingredients.Data.Grain){
          var kettle = _.filter($scope.kettles,{type:'grain'})[0];
          if(kettle){
            kettle.timers = [];
            _.each(recipe.Ingredients.Data.Grain,function(grain){
              $scope.addTimer(kettle,{
                label: grain.F_G_NAME,
                min: parseInt(grain.F_G_BOIL_TIME,10),
                notes: parseFloat(grain.F_G_AMOUNT/16).toFixed(2)+' lbs.'
              });
            });
          }
        }

        if(!!recipe.Ingredients.Data.Hops){
          var kettle = _.filter($scope.kettles,{type:'hop'})[0];
          if(kettle){
            kettle.timers = [];
            _.each(recipe.Ingredients.Data.Hops,function(hop){
              $scope.addTimer(kettle,{
                label: hop.F_H_NAME,
                min: parseInt(hop.F_H_DRY_HOP_TIME,10) > 0 ? null : parseInt(hop.F_H_BOIL_TIME,10),
                notes: parseInt(hop.F_H_DRY_HOP_TIME,10) > 0
                  ? 'Dry Hop '+parseFloat(hop.F_H_AMOUNT).toFixed(2)+' oz.'+' for '+parseInt(hop.F_H_DRY_HOP_TIME,10)+' Days'
                  : parseFloat(hop.F_H_AMOUNT).toFixed(2)+' oz.'
              });
              // hop.F_H_ALPHA
              // hop.F_H_DRY_HOP_TIME
            });
          }
        }
        if(kettle && !!recipe.Ingredients.Data.Misc){
          if(recipe.Ingredients.Data.Misc.length){
            _.each(recipe.Ingredients.Data.Misc,function(misc){
              $scope.addTimer(kettle,{
                label: misc.F_M_NAME+' '+parseFloat(misc.F_M_AMOUNT).toFixed(2),
                min: parseInt(misc.F_M_TIME,10)
              });
            });
          } else {
            $scope.addTimer(kettle,{
              label: recipe.Ingredients.Data.Misc.F_M_NAME+' '+parseFloat(recipe.Ingredients.Data.Misc.F_M_AMOUNT).toFixed(2)+' oz.',
              min: parseInt(recipe.Ingredients.Data.Misc.F_M_TIME,10)
            });
          }
        }
        if(!!recipe.Ingredients.Data.Yeast){
          if(recipe.Ingredients.Data.Yeast.length){
            _.each(recipe.Ingredients.Data.Yeast,function(yeast){
              $scope.settings.recipe.yeast.push({
                name: yeast.F_Y_LAB+' '+yeast.F_Y_PRODUCT_ID
              });
            });
          } else {
            $scope.settings.recipe.yeast.push({
              name: recipe.Ingredients.Data.Yeast.F_Y_LAB+' '+recipe.Ingredients.Data.Yeast.F_Y_PRODUCT_ID
            });
          }
        }
        $scope.recipe_success = true;
      } else {
        $scope.recipe_success = false;
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
          return $scope.water = _.sortBy(_.uniqBy(response,'name'),'name');
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
    var running = [];
    _.each($scope.kettles,function(kettle){
        //update max
        kettle.knob.max=kettle.temp['target']+kettle.temp['diff'];

        //check if heater is running
        running.push(BrewService.digitalRead(kettle.heater.pin,2000).then(function(response){
            if(response.value=="1"){
              kettle.active = true;
              kettle.heater.running = true;
            } else {
              kettle.heater.running = false;
            }
            return kettle;
          },function(err){
            return err;
          })
        );

        //check if pump is running
        running.push(BrewService.digitalRead(kettle.pump.pin,2000).then(function(response){
            if(response.value=="1"){
              kettle.active = true;
              kettle.pump.running = true;
            } else {
              kettle.pump.running = false;
            }
            return kettle;
          },function(err){
            return err;
          })
        );

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

  function updateTemp(response,kettle){

    if(!response || !response.temp){
      return false;
    }

    $scope.error_message = '';
    var temps = [];
    //chart date
    var date = new Date();
    // temp response is in C
    kettle.temp.previous = ($scope.settings.unit=='F') ? $filter('toFahrenheit')(response.temp) : Math.round(response.temp);
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
        temps.push(BrewService.digital(kettle.heater.pin,0).then(function(){
            kettle.heater.running = false;
          },function(err){
            if(err && typeof err == 'string')
              $scope.error_message = err;
            else
              $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
          })
        );
      }
      if(kettle.pump.auto && kettle.pump.running){
        temps.push(BrewService.digital(kettle.pump.pin,0).then(function(){
            kettle.pump.running = false;
          },function(err){
            if(err && typeof err == 'string')
              $scope.error_message = err;
            else
              $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
          })
        );
      }
    } //is temp too low?
    else if(kettle.temp.current <= kettle.temp.target-kettle.temp.diff){
      $scope.alert(kettle);
      //start the heating element
      if(kettle.heater.auto && !kettle.heater.running){
        temps.push(BrewService.digital(kettle.heater.pin,1).then(function(){
            kettle.heater.running = true;
            kettle.knob.subText.text = 'heating';
            kettle.knob.subText.color = 'rgba(200,47,47,1)';
          },function(err){
            if(err && typeof err == 'string')
              $scope.error_message = err;
            else
              $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
          })
        );
      }
      if(kettle.pump.auto && !kettle.pump.running){
        temps.push(BrewService.digital(kettle.pump.pin,1).then(function(){
            kettle.pump.running = true;
          },function(err){
            if(err && typeof err == 'string')
              $scope.error_message = err;
            else
              $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
          })
        )
      }
    } else {
      kettle.temp.hit=new Date();//set the time the target was hit so we can now start alerts
      $scope.alert(kettle);
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

  $scope.toggleKettle = function(item,kettle){

    var k = (item == 'pump') ? kettle.pump : kettle.heater;
    k.running = !k.running;

    //start the digital port
    if(kettle.active && k.running){
      BrewService.digital(k.pin,1).then(function(){
        //started
      },function(err){
        if(err && typeof err == 'string')
          $scope.error_message = err;
        else
          $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
      });
    } else if(!k.running){
      BrewService.digital(k.pin,0).then(function(){
        //stopped
      },function(err){
        if(err && typeof err == 'string')
          $scope.error_message = err;
        else
          $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
      });
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
        BrewService.temp(kettle.temp).then(function(response){
            updateTemp(response,kettle);
        },function error(err){
            if(err && typeof err == 'string')
              $scope.error_message = err;
            else
              $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
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
        },function(err){
          if(err && typeof err == 'string')
            $scope.error_message = err;
          else
            $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
        });
      }
      if(!kettle.active && kettle.pump.running){
        BrewService.digital(kettle.pump.pin,0).then(function(){
          kettle.pump.running=false;
          $scope.updateKnobCopy(kettle);
        },function(err){
          if(err && typeof err == 'string')
            $scope.error_message = err;
          else
            $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
        });
      }
      if(!kettle.active){
        kettle.pump.auto=false;
        kettle.heater.auto=false;
        $scope.updateKnobCopy(kettle);
      }
  };

  $scope.clearKettles = function(e,i){
      angular.element(e.target).html('Removing...');
      BrewService.clear();
      $timeout(function(){
        window.location.reload();
      },1000);
  };

  $scope.alert = function(kettle,timer){

    //don't start alerts until we have hit the temp.target
    if(!timer && kettle && !kettle.temp.hit
    || $scope.settings.notifications.on===false){
      return;
    }

    // Desktop / Slack Notification
    var message, icon = 'img/brewbench-logo.png', color = 'good';

    if(kettle && ['hop','grain','water'].indexOf(kettle.type)!==-1)
      icon = 'img/'+kettle.type+'.png';

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
      message = 'Your '+kettle.key+' kettle is '+kettle.high+'\u00B0 high';
      color = 'danger';
      $scope.settings.notifications.last='high';
    }
    else if(kettle && kettle.low){
      if(!$scope.settings.notifications.low || $scope.settings.notifications.last=='low')
        return;
      message = 'Your '+kettle.key+' kettle is '+kettle.low+'\u00B0 low';
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
    if(kettle.temp.current >= kettle.temp.target+kettle.temp.diff){
      kettle.knob.barColor = 'rgba(255,0,0,.6)';
      kettle.knob.trackColor = 'rgba(255,0,0,.1)';
      kettle.high = kettle.temp.current-kettle.temp.target;
      kettle.low = null;
      //update knob text
      kettle.knob.subText.text = kettle.high+'\u00B0 high';
      kettle.knob.subText.color = 'rgba(255,0,0,.6)';
    } else if(kettle.temp.current <= kettle.temp.target-kettle.temp.diff){
      kettle.knob.barColor = 'rgba(52,152,219,.5)';
      kettle.knob.trackColor = 'rgba(52,152,219,.1)';
      kettle.low = kettle.temp.target-kettle.temp.current;
      kettle.high = null;
      if(kettle.heater.running){
        kettle.knob.subText.text = 'heating';
        kettle.knob.subText.color = 'rgba(255,0,0,.6)';
      } else {
        //update knob text
        kettle.knob.subText.text = kettle.low+'\u00B0 low';
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
      if(kettle.type=='hop')
        kettle.type = 'water';
      else if(kettle.type=='grain')
        kettle.type = 'hop';
      else if(kettle.type=='water')
        kettle.type = 'grain';
  };

  $scope.changeUnits = function(unit){
    _.each($scope.kettles,function(kettle){
      kettle.temp.current = $filter('formatDegrees')(kettle.temp.current,unit);
      kettle.temp.target = $filter('formatDegrees')(kettle.temp.target,unit);
      kettle.temp.diff = $filter('formatDegrees')(kettle.temp.diff,unit);
      $scope.updateKnobCopy(kettle);
    });
    $scope.chartOptions = BrewService.chartOptions(unit);
  };

  $scope.timerRun = function(timer,kettle){
    return timer.interval = $interval(function () {
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
      $scope.timerRun(timer,kettle);
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
            if(err && typeof err == 'string')
              $scope.error_message = err;
            else
              $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
            return err;
          }));
      }
    });

    return $q.all(allSensors).then(function(values){
      //re process on timeout
      $timeout(function(){
          return $scope.processTemps();
      },$scope.settings.pollSeconds*1000);
    },function(err){
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
