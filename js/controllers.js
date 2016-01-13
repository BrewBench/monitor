brewMachine.controller('mainCtrl', function($rootScope, $scope, $stateParams, $state, $filter, $timeout, $interval, $q, BMService){

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

  // TODO add notification
  function tempAlert(kettle){

  }

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
        $scope.kettles[kettle].high=true;
        $scope.kettles[kettle].low=null;
        tempAlert($scope.kettles[kettle]);
      } //is temp too low?
      else if($scope.kettles[kettle].currentTemp <= $scope.kettles[kettle].targetTemp-$scope.kettles[kettle].diff){
        $scope.kettles[kettle].low=true;
        $scope.kettles[kettle].high=null;
        tempAlert($scope.kettles[kettle]);
      } else {
        $scope.kettles[kettle].low=null;
        $scope.kettles[kettle].high=null;
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
});
