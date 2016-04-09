brewBench.controller('mainCtrl', function($scope, $stateParams, $state, $filter, $timeout, $interval, $q, BrewService){

var notification = null
  ,resetChart = 100;//reset chart after 100 polls

// BrewService.clear();

$scope.chartOptions = BrewService.chartOptions();

$scope.error_message = '';

//default settings values
$scope.settings = BrewService.settings('settings') || {
  pollSeconds: 10
  ,unit: 'F'
  ,sound: true
  ,notifications: true
  ,arduinoUrl: 'http://arduino.local'
  ,storage: 'sd'
};

//default kettle values
$scope.kettles = BrewService.settings('kettles') || [{
    key: 'Boil'
    ,pin: 0
    ,active: false
    ,heater: {pin:2,running:false,auto:false}
    ,pump: {pin:3,running:false,auto:false}
    ,timer: {min:60,sec:0,running:false}
    ,temp: {hit:false,current:0,target:200,diff:5}
    ,volume: 5
    ,values: []
  },{
    key: 'Hot Liquor'
    ,pin: 1
    ,active: false
    ,heater: {pin:4,running:false,auto:false}
    ,pump: {pin:5,running:false,auto:false}
    ,temp: {hit:false,current:0,target:200,diff:5}
    ,volume: 5
    ,values: []
  },{
    key: 'Mash'
    ,pin: 2
    ,active: false
    ,heater: {pin:6,running:false,auto:false}
    ,pump: {pin:7,running:false,auto:false}
    ,timer: {min:60,sec:0,running:false}
    ,temp: {hit:false,current:0,target:200,diff:5}
    ,volume: 5
    ,values: []
  }];

  // Option to add alerts for mash schedule?
  // $scope.mashTemps = {
  //   doughIn:
  //   protein:
  //   steep:
  //   boil:
  // };

  // check if pumps are running
  $scope.init = function(){
    for(k in $scope.kettles){
        BrewService.digitalRead($scope.kettles[k].heater.pin).then(function(response){
          if(response.value=="0"){
            $scope.kettles[k].active = true;
            $scope.kettles[k].heater.running = true;
          }
        },function(err){
          //failed to stop
        });
        BrewService.digitalRead($scope.kettles[k].pump.pin).then(function(response){
          if(response.value=="0"){
            $scope.kettles[k].active = true;
            $scope.kettles[k].pump.running = true;
          }
        },function(err){
          //failed to stop
        });
      }
  };

  function updateTemp(response){
    $scope.error_message = '';
    if(response && response.temp){
      // this will fail if two kettles are on the same pin
      var kettle = $scope.kettles.filter(function(k){return k.pin == parseInt(response.pin);})[0];

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

      //is temp too high?
      if(kettle.temp.current > kettle.temp.target+kettle.temp.diff){
        kettle.high=kettle.temp.current-kettle.temp.target;
        kettle.low=null;
        $scope.tempAlert(kettle);
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
      else if(kettle.temp.current < kettle.temp.target-kettle.temp.diff){
        kettle.low=kettle.temp.target-kettle.temp.current;
        kettle.high=null;
        $scope.tempAlert(kettle);
        //start the heating element
        if(kettle.heater.auto && !kettle.heater.running){
          BrewService.digital(kettle.heater.pin,0).then(function(){
            kettle.heater.running = true;
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
        kettle.low=null;
        kettle.high=null;
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
      }
    }
  };

  $scope.getNavOffset = function(){
    return 20+angular.element(document.getElementById('navbar'))[0].offsetHeight;
  };

  $scope.addKettle = function(){
    if($scope.kettles.length < 5){
      $scope.kettles.unshift(
        {
          key: 'New Kettle'
          ,pin: $scope.kettles.length
          ,active: false
          ,heater: {pin:6,running:false,auto:false}
          ,pump: {pin:7,running:false,auto:false}
          ,temp: {hit:false,current:0,target:200,diff:5}
          ,volume: 5
          ,values: []
        }
      );
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
    } else if(k.state==0){
      BrewService.digital(k.pin,1).then(function(){
        //stopped
      },function(err){
        //failed to stop
      });
    }
  };

  $scope.startStopKettle = function(kettle){
      kettle.active = !kettle.active;
      //stop the heating element
      if(!kettle.active && kettle.heater.running){
        BrewService.digital(kettle.heater.pin,1).then(function(){
          kettle.heater.running=false;
        },function(err){
          //failed to stop
        });
      }
      if(!kettle.active && kettle.pump.running){
        BrewService.digital(kettle.pump.pin,1).then(function(){
          kettle.pump.running=false;
        },function(err){
          //failed to stop
        });
      }
      if(!kettle.active){
        kettle.pump.auto=false;
        kettle.heater.auto=false;
      }
  };

  $scope.clearKettles = function(){
      BrewService.clear();
  };

  $scope.tempAlert = function(kettle){

    //don't start alerts until we have hit the temp.target
    if(kettle && !kettle.temp.hit)
      return;

    // Txt or Email Notification?

    // Mobile Vibrate Notification
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 300, 500]);
    }

    // Sound Notification
    if($scope.settings.sound===true){
      var snd = new Audio("audio/error.mp3"); // buffers automatically when created
      snd.play();
    }

    // Desktop Notification
    if ($scope.settings.notifications===true && "Notification" in window) {
      var message, icon = 'img/brewbench-logo-45.png';

      if(kettle && kettle.high)
        message = 'Your '+kettle.key+' kettle is '+kettle.high+' degrees too hot';
      else if(kettle && kettle.low)
        message = 'Your '+kettle.key+' kettle is '+kettle.low+' degrees too cold';
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

  $scope.changeUnits = function(unit){
    for(k in $scope.kettles){
      $scope.kettles[k].temp.current = $filter('formatDegrees')($scope.kettles[k].temp.current,unit);
      $scope.kettles[k].temp.target = $filter('formatDegrees')($scope.kettles[k].temp.target,unit);
      $scope.kettles[k].temp.diff = $filter('formatDegrees')($scope.kettles[k].temp.diff,unit);
    }
  };

  $scope.timerRun = function(kettle){
    $scope.kettles[kettle].interval = $interval(function () {
      //cancel interval if zero out
      if($scope.kettles[kettle].timer.min==0 && $scope.kettles[kettle].timer.sec==0){
        $interval.cancel($scope.kettles[kettle].interval);
      } else if($scope.kettles[kettle].timer.sec > 0){
        //count down seconds
        $scope.kettles[kettle].timer.sec--;
      } else {
        //cound down minutes and seconds
        $scope.kettles[kettle].timer.sec=59;
        $scope.kettles[kettle].timer.min--;
      }
    },1000);
  };

  $scope.timerStart = function(kettle){
    if($scope.kettles[kettle].timer.running){
      //stop timer
      $scope.kettles[kettle].timer.running=false;
      $interval.cancel($scope.kettles[kettle].interval);
    } else {
      //start timer
      $scope.kettles[kettle].timer.running=true;
      $scope.timerRun(kettle);
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
    if(up)
      $scope.kettles[kettle]['temp'][field]++;
    else
      $scope.kettles[kettle]['temp'][field]--;
  };

  // App start logic
  $scope.processTemps();

  $scope.tempAlert();

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
