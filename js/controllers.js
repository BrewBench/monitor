brewBench.controller('mainCtrl', function($scope, $stateParams, $state, $filter, $timeout, $interval, $q, BrewService){

var notification = null
  ,resetChart = 25;//reset chart after 25 polls

$scope.settings = BrewService.settings('settings') || {
  pollSeconds: 10
  ,unit: 'F'
  ,sound: true
  ,notifications: true
};

$scope.chartOptions = BrewService.chartOptions();

//default values
$scope.kettles = BrewService.settings('kettles') || [{
    key: 'Boil'
    ,targetTemp: 200
    ,targetHit: null
    ,currentTemp: 0
    ,diff: 5
    ,active: false
    ,low: null
    ,high: null
    ,timer: {min:60,sec:0,running:false}
    ,values: []
  },{
    key: 'Hot Liquor'
    ,targetTemp: 175
    ,targetHit: null
    ,currentTemp: 0
    ,diff: 5
    ,active: false
    ,low: null
    ,high: null
    ,values: []
  },{
    key: 'Mash'
    ,targetTemp: 150
    ,targetHit: null
    ,currentTemp: 0
    ,diff: 2
    ,active: false
    ,low: null
    ,high: null
    ,timer: {min:60,sec:0,running:false}
    ,values: []
  }];

  // Option to add alerts for mash schedule?
  // $scope.mashTemps = {
  //   doughIn:
  //   protein:
  //   steep:
  //   boil:
  // };

  function updateTemp(response){
    if(response && response.temp){
      var kettle = parseInt(response.pin);

      // temp response is in C
      if($scope.settings.unit=='F')
        $scope.kettles[kettle].currentTemp = $filter('toFahrenheit')(response.temp);
      else
        $scope.kettles[kettle].currentTemp = Math.round(response.temp);

      //reset all kettles every 25
      if($scope.kettles[kettle].values.length > resetChart){
        $scope.kettles.map(function(k){
          return k.values=[];
        });
      }

      //chart data
      var date = new Date();
      $scope.kettles[kettle].values.push([date.getTime(),$scope.kettles[kettle].currentTemp]);

      //is temp too high?
      if($scope.kettles[kettle].currentTemp >= $scope.kettles[kettle].targetTemp+$scope.kettles[kettle].diff){
        $scope.kettles[kettle].high=$scope.kettles[kettle].currentTemp-$scope.kettles[kettle].targetTemp;
        $scope.kettles[kettle].low=null;
        $scope.tempAlert($scope.kettles[kettle]);
      } //is temp too low?
      else if($scope.kettles[kettle].currentTemp <= $scope.kettles[kettle].targetTemp-$scope.kettles[kettle].diff){
        $scope.kettles[kettle].low=$scope.kettles[kettle].targetTemp-$scope.kettles[kettle].currentTemp;
        $scope.kettles[kettle].high=null;
        $scope.tempAlert($scope.kettles[kettle]);
      } else {
        $scope.kettles[kettle].targetHit=new Date();//set the time the target was hit so we can now start alerts
        $scope.kettles[kettle].low=null;
        $scope.kettles[kettle].high=null;
      }
    }
  };

  $scope.tempAlert = function(kettle){

    //don't start alerts until we have hit the targetTemp
    if(kettle && !kettle.targetHit)
      return;

    // Txt or Email Notification?

    // Arduino Notification
    // BrewService.blink(13).then(function(){
    //   //success
    // },function(err){
    //   if(err.statusText)
    //     alert(err.statusText);
    //   else if(err.status===0)
    //     alert('We could not connect to your Arduino, make sure you are on the same WiFi');
    // });

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
    if ($scope.settings.notifications && "Notification" in window) {
      var message, icon = 'img/brewmachine-45.png';

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
          notification = new Notification('BrewMachine',{body:message,icon:icon});
        }
      } else if(Notification.permission !== 'denied'){
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            if(message){
              notification = new Notification('BrewMachine',{body:message,icon:icon});
            }
          }
        });
      }
    }
  };

  $scope.changeUnits = function(unit){
    for(k in $scope.kettles){
      $scope.kettles[k].currentTemp = $filter('formatDegrees')($scope.kettles[k].currentTemp,unit);
      $scope.kettles[k].targetTemp = $filter('formatDegrees')($scope.kettles[k].targetTemp,unit);
      $scope.kettles[k].diff = $filter('formatDegrees')($scope.kettles[k].diff,unit);
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
        allSensors.push(BrewService.readSensor('analog',k).then(updateTemp));
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
      $scope.kettles[kettle][field]++;
    else
      $scope.kettles[kettle][field]--;
  };

  // App start logic
  $scope.processTemps();

  $scope.tempAlert();

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
