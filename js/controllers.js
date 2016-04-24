brewBench.controller('mainCtrl', function($scope, $stateParams, $state, $filter, $timeout, $interval, $q, BrewService){

var notification = null
  ,resetChart = 100
  ,timeout = null;//reset chart after 100 polls

$scope.hops;
$scope.grains;
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
  ,sound: true
  ,notifications: true
  ,arduinoUrl: 'http://arduino.local'
  ,storage: 'sd'
  ,recipe: {name:'Best Ale',yeast:[]}
};

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
    ,pin: 0
    ,active: false
    ,heater: {pin:2,running:false,auto:false}
    ,pump: {pin:3,running:false,auto:false}
    ,temp: {hit:false,current:0,target:200,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:200+5})
  },{
    key: 'Hot Liquor'
    ,type: 'water'
    ,pin: 1
    ,active: false
    ,heater: {pin:4,running:false,auto:false}
    ,pump: {pin:5,running:false,auto:false}
    ,temp: {hit:false,current:0,target:200,diff:5}
    ,values: []
    ,timers: []
    ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:200+5})
  },{
    key: 'Mash'
    ,type: 'grain'
    ,pin: 2
    ,active: false
    ,heater: {pin:6,running:false,auto:false}
    ,pump: {pin:7,running:false,auto:false}
    ,temp: {hit:false,current:0,target:150,diff:5}
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
          ,pin: $scope.kettles.length
          ,active: false
          ,heater: {pin:6,running:false,auto:false}
          ,pump: {pin:7,running:false,auto:false}
          ,temp: {hit:false,current:0,target:150,diff:5}
          ,values: []
          ,timers: []
          ,knob: angular.merge($scope.knobOptions,{value:0,min:0,max:150+5})
        }
      );
    }
  };

  $scope.showContent = function($fileContent){

      var x2js = new X2JS();
      var jsonObj = x2js.xml_str2json( $fileContent.replace(/&ldquo;/g,'"').replace(/&rdquo;/g,'"').replace(/&rsquo;/g,"'") );
      if($scope.settings.recipe)
        $scope.settings.recipe = {name:'',yeast:[]};

      if(!!jsonObj.Recipes && !!jsonObj.Recipes.Data.Recipe){

        if(!!jsonObj.Recipes.Data.Recipe.F_R_NAME)
          $scope.settings.recipe.name = jsonObj.Recipes.Data.Recipe.F_R_NAME;

        if(!!jsonObj.Recipes.Data.Recipe.Ingredients.Data.Grain){
          var kettle = _.filter($scope.kettles,{type:'grain'})[0];
          if(kettle){
            kettle.timers = [];
            _.each(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Grain,function(grain){
              $scope.addTimer(kettle,{
                label: grain.F_G_NAME,
                min: parseInt(grain.F_G_BOIL_TIME,10),
                notes: parseFloat(grain.F_G_AMOUNT/16).toFixed(2)+' lbs.'
              });
            });
          }
        }
        if(!!jsonObj.Recipes.Data.Recipe.Ingredients.Data.Hops){
          var kettle = _.filter($scope.kettles,{type:'hop'})[0];
          if(kettle){
            kettle.timers = [];
            _.each(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Hops,function(hop){
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
        if(!!jsonObj.Recipes.Data.Recipe.Ingredients.Data.Misc){
          if(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Misc.length){
            _.each(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Misc,function(misc){
              $scope.addTimer(kettle,{
                label: misc.F_M_NAME+' '+parseFloat(misc.F_M_AMOUNT).toFixed(2),
                min: parseInt(misc.F_M_TIME,10)
              });
            });
          } else {
            $scope.addTimer(kettle,{
              label: jsonObj.Recipes.Data.Recipe.Ingredients.Data.Misc.F_M_NAME+' '+parseFloat(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Misc.F_M_AMOUNT).toFixed(2)+' oz.',
              min: parseInt(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Misc.F_M_TIME,10)
            });
          }
        }
        if(!!jsonObj.Recipes.Data.Recipe.Ingredients.Data.Yeast){
          if(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Yeast.length){
            _.each(jsonObj.Recipes.Data.Recipe.Ingredients.Data.Yeast,function(yeast){
              $scope.settings.recipe.yeast.push({
                name: yeast.F_Y_LAB+' '+yeast.F_Y_PRODUCT_ID
              });
            });
          } else {
            $scope.settings.recipe.yeast.push({
              name: jsonObj.Recipes.Data.Recipe.Ingredients.Data.Yeast.F_Y_LAB+' '+jsonObj.Recipes.Data.Recipe.Ingredients.Data.Yeast.F_Y_PRODUCT_ID
            });
          }
        }

        $scope.recipe_success = true;
      } else {
        $scope.recipe_success = false;
      }
  };

  // check if pump or heater are running
  $scope.init = function(){
    if(!$scope.grains){
      BrewService.grains().then(function(response){
        $scope.grains = _.sortBy(_.uniqBy(response,'name'),'name');
      });
    }

    if(!$scope.hops){
      BrewService.hops().then(function(response){
        $scope.hops = _.sortBy(_.uniqBy(response,'name'),'name');
      });
    }

    if(!$scope.lovibond){
      BrewService.lovibond().then(function(response){
        $scope.lovibond = response;
      });
    }

    for(k in $scope.kettles){

        //update max
        $scope.kettles[k].knob.max=$scope.kettles[k].temp['target']+$scope.kettles[k].temp['diff'];

        //check if heater is running
        BrewService.digitalRead($scope.kettles[k].heater.pin).then(function(response){
          if(response.value=="0"){
            $scope.kettles[k].active = true;
            $scope.kettles[k].heater.running = true;
          } else {
            $scope.kettles[k].heater.running = false;
          }
        },function(err){
          //failed to stop
        });

        //check if pump is running
        BrewService.digitalRead($scope.kettles[k].pump.pin).then(function(response){
          if(response.value=="0"){
            $scope.kettles[k].active = true;
            $scope.kettles[k].pump.running = true;
          } else {
            $scope.kettles[k].pump.running = false;
          }
        },function(err){
          //failed to stop
        });
        //check timers for running
        // if(!!$scope.kettles[k].timers && $scope.kettles[k].timers.length){
        //   for(timer in $scope.kettles[k].timers){
        //     console.log($scope.kettles[k].timers[timer])
        //     if($scope.kettles[k].timers[timer].running){
        //       $scope.timerStart($scope.kettles[k].timers[timer]);
        //     } else if($scope.kettles[k].timers[timer].up && $scope.kettles[k].timers[timer].up.running){
        //       $scope.timerStart($scope.kettles[k].timers[timer].up);
        //     }
        //   }
        // }
        $scope.updateKnobCopy($scope.kettles[k]);
      }
  };

  function updateTemp(response){
    $scope.error_message = '';
    if(response && response.temp){
      // this will fail if two kettles are on the same pin
      var kettle = $scope.kettles.filter(function(k){return k.pin == parseInt(response.pin);})[0];

      //if kettle has been stopped since request started
      if(!kettle.active)
        return;

      // temp response is in C
      if($scope.settings.unit=='F')
        kettle.temp.current = $filter('toFahrenheit')(response.temp);
      else
        kettle.temp.current = Math.round(response.temp);

      //reset all kettles every resetChart
      if(kettle.values.length > resetChart){
        $scope.kettles.map(function(k){
          return k.values=[];
        });
      }

      //chart data
      var date = new Date();
      kettle.values.push([date.getTime(),kettle.temp.current]);

      $scope.updateKnobCopy(kettle);

      //is temp too high?
      if(kettle.temp.current >= kettle.temp.target+kettle.temp.diff){
        $scope.alert(kettle);
        //stop the heating element
        if(kettle.heater.auto && kettle.heater.running){
          BrewService.digital(kettle.heater.pin,1).then(function(){
            kettle.heater.running = false;
          },function(err){
            //failed to stop
          });
        }
        if(kettle.pump.auto && kettle.pump.running){
          BrewService.digital(kettle.pump.pin,1).then(function(){
            kettle.pump.running = false;
          },function(err){
            //failed to stop
          });
        }
      } //is temp too low?
      else if(kettle.temp.current <= kettle.temp.target-kettle.temp.diff){
        $scope.alert(kettle);
        //start the heating element
        if(kettle.heater.auto && !kettle.heater.running){
          BrewService.digital(kettle.heater.pin,0).then(function(){
            kettle.heater.running = true;
            kettle.knob.subText.text = 'heating';
            kettle.knob.subText.color = 'rgba(200,47,47,1)';
          },function(err){
            //failed to start
          });
        }
        if(kettle.pump.auto && !kettle.pump.running){
          BrewService.digital(kettle.pump.pin,0).then(function(){
            kettle.pump.running = true;
          },function(err){
            //failed to start
          });
        }
      } else {
        kettle.temp.hit=new Date();//set the time the target was hit so we can now start alerts
      }
    }
  };

  $scope.getNavOffset = function(){
    return 20+angular.element(document.getElementById('navbar'))[0].offsetHeight;
  };

  $scope.addTimer = function(kettle,options){
    if(!kettle.timers)
      kettle.timers=[];
    if(options){
      options.running = false;
      kettle.timers.push(options);
    } else {
      kettle.timers.push({label:'Edit label',min:60,sec:0,running:false});
    }
  };

  $scope.toggleKettle = function(item,kettle){

    var k = kettle.heater;
    if(item == 'pump'){
      k = kettle.pump;
    }

    k.running=!k.running;

    //start the digital port
    if(kettle.active && k.running){
      BrewService.digital(k.pin,0).then(function(){
        //started
      },function(err){
        //failed to start
      });
    } else if(!k.running){
      BrewService.digital(k.pin,1).then(function(){
        //stopped
      },function(err){
        //failed to stop
      });
    }
  };

  $scope.startStopKettle = function(kettle){
      kettle.active = !kettle.active;

      if(kettle.active){
        BrewService.temp(kettle.pin).then(updateTemp
          ,function error(err){
            $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
          });
        kettle.knob.subText.text = 'starting...';
      }

      //stop the heating element
      if(!kettle.active && kettle.heater.running){
        BrewService.digital(kettle.heater.pin,1).then(function(){
          kettle.heater.running=false;
          $scope.updateKnobCopy(kettle);
        },function(err){
          //failed to stop
        });
      }
      if(!kettle.active && kettle.pump.running){
        BrewService.digital(kettle.pump.pin,1).then(function(){
          kettle.pump.running=false;
          $scope.updateKnobCopy(kettle);
        },function(err){
          //failed to stop
        });
      }
      if(!kettle.active){
        kettle.pump.auto=false;
        kettle.heater.auto=false;
        $scope.updateKnobCopy(kettle);
      }
  };

  $scope.clearKettles = function(){
      BrewService.clear();
  };

  $scope.alert = function(kettle,type){

    //don't start alerts until we have hit the temp.target
    if(!type && kettle && !kettle.temp.hit){
      return;
    }

    // Txt or Email Notification?

    // Mobile Vibrate Notification
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 300, 500]);
    }

    // Sound Notification
    if($scope.settings.sound===true){
      //don't alert if the heater is running and temp is too low
      if(type!='timer' && kettle && kettle.low && kettle.heater.running)
        return;
      var snd = new Audio("audio/error.mp3"); // buffers automatically when created
      snd.play();
    }

    // Desktop Notification
    if ($scope.settings.notifications===true && "Notification" in window) {
      var message, icon = 'img/brewbench-logo-45.png';

      //don't alert if the heater is running and temp is too low
      if(kettle && kettle.low && kettle.heater.running)
        return;

      if(type && type=='timer')//kettle is a timer object
        message = 'Your '+kettle.label+' timer is up';
      else if(kettle && kettle.high)
        message = 'Your '+kettle.key+' kettle is '+kettle.high+' degrees high';
      else if(kettle && kettle.low)
        message = 'Your '+kettle.key+' kettle is '+kettle.low+' degrees low';
      else if(!kettle)
        message = 'Testing Alerts, you are ready to go, click play on a kettle.';

      //close the previous notification
      if(notification)
        notification.close();

      if(Notification.permission === "granted"){
        if(message){
          notification = new Notification('BrewBench',{body:message,icon:icon});
        }
      } else if(Notification.permission !== 'denied'){
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if(message){
              notification = new Notification('BrewBench',{body:message,icon:icon});
            }
          }
        });
      }
    }
  };

  $scope.updateKnobCopy = function(kettle){

    if(!kettle.active){
      kettle.knob.subText.text = 'not running';
      kettle.knob.trackColor = '#ddd';
      kettle.knob.barColor = '#777';
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
      kettle.knob.subText.color = 'gray';
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
        kettle.knob.subText.color = 'gray';
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
    for(k in $scope.kettles){
      $scope.kettles[k].temp.current = $filter('formatDegrees')($scope.kettles[k].temp.current,unit);
      $scope.kettles[k].temp.target = $filter('formatDegrees')($scope.kettles[k].temp.target,unit);
      $scope.kettles[k].temp.diff = $filter('formatDegrees')($scope.kettles[k].temp.diff,unit);
    }
  };

  $scope.timerRun = function(timer){
    timer.interval = $interval(function () {
      //cancel interval if zero out
      if(!timer.up && timer.min==0 && timer.sec==0){
        $interval.cancel(timer.interval);
        $scope.alert(timer,'timer');
        timer.up = {min:0,sec:0,running:true};
        $scope.timerRun(timer);
      } else if(!timer.up && timer.sec > 0){
        //count down seconds
        timer.sec--;
      } else if(timer.up && timer.up.sec < 59){
        //count down seconds
        timer.up.sec++;
      } else if(!timer.up){
        //cound down minutes and seconds
        timer.sec=59;
        timer.min--;
      } else if(timer.up){
        //cound down minutes and seconds
        timer.up.sec=0;
        timer.up.min++;
      }
    },1000);
  };

  $scope.timerStart = function(timer){
    if(timer.up && timer.up.running){
      //stop timer
      timer.up.running=false;
      $interval.cancel(timer.up.interval);
    } else if(timer.running){
      //stop timer
      timer.running=false;
      $interval.cancel(timer.interval);
    } else {
      //start timer
      timer.running=true;
      $scope.timerRun(timer);
    }
  };

  $scope.processTemps = function(){
    var allSensors = [];

    //only process active sensors
    for(k in $scope.kettles){
      if($scope.kettles[k].active){
        allSensors.push(BrewService.temp($scope.kettles[k].pin).then(updateTemp
          ,function error(err){
            $scope.error_message='Could not connect to the Arduino at '+BrewService.domain();
          }));
      }
    }

    $q.all(allSensors).then(function(values){
      //re process on timeout
      $timeout(function(){
          $scope.processTemps();
      },$scope.settings.pollSeconds*1000);
    },function(err){
      $timeout(function(){
          $scope.processTemps();
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

  // App start logic
  $scope.processTemps();

  $scope.alert();

  $scope.init();

  //timer check
  for(k in $scope.kettles){
    if($scope.kettles[k].timer && $scope.kettles[k].timer.running){
      $scope.timerRun(k);
    }
  }

  // scope watch
  $scope.$watchCollection('settings',function(newValue,oldValue){
    BrewService.settings('settings',newValue);
  });

  $scope.$watch('kettles',function(newValue,oldValue){
    BrewService.settings('kettles',newValue);
  },true);

});
