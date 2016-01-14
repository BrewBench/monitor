brewMachine.controller('mainCtrl', function($rootScope, $scope, $stateParams, $state, $filter, $timeout, $interval, $q, BMService){

var notification = null;

$scope.pollSeconds = 10;//seconds
$scope.unit = 'F';//F or C

$scope.chartOptions = BMService.chartOptions();

//default values
$scope.kettles = [{
    key: 'Boil'
    ,targetTemp: 200
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
    ,currentTemp: 0
    ,diff: 5
    ,active: false
    ,low: null
    ,high: null
    ,values: []
  },{
    key: 'Mash'
    ,targetTemp: 150
    ,currentTemp: 0
    ,diff: 2
    ,active: false
    ,low: null
    ,high: null
    ,timer: {min:60,sec:0,running:false}
    ,values: []
  }];

  function updateTemp(response){
    if(response && response.temp){
      var kettle = parseInt(response.pin.replace('A',''));

      // temp response is in C
      if($scope.unit=='F')
        $scope.kettles[kettle].currentTemp = $filter('toFahrenheit')(response.temp);
      else
        $scope.kettles[kettle].currentTemp = Math.round(response.temp);

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
        $scope.kettles[kettle].low=null;
        $scope.kettles[kettle].high=null;
      }
    }
  };

  $scope.tempAlert = function(kettle){

    // Txt or Email Notification?

    // Arduino Notification
    BMService.blink(13);

    // Mobile Vibrate Notification
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 300, 500]);
    }

    // Desktop Notification
    if ("Notification" in window) {
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

      var snd = new Audio("audio/error.mp3"); // buffers automatically when created
      snd.play();

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
        allSensors.push(BMService.readSensor('analog',k).then(updateTemp));
      }
    }

    $q.all(allSensors).then(function(values){
      //re process on timeout
      $timeout(function(){
          $scope.processTemps();
      },$scope.pollSeconds*1000);
    });
  };

  $scope.processTemps();
  $scope.tempAlert();
});
