brewMachine.controller('mainCtrl', function($rootScope, $scope, $stateParams, $state, $filter, $timeout, $interval, $q, BMService){

var processing = null;

$scope.pollSeconds = 10;//seconds

//default values
$scope.kettles = [{
    name: 'Boil'
    ,targetTemp: 200
    ,currentTemp: 0
    ,diff: 5
    ,active: false
    ,low: null
    ,high: null
    ,timer: {min:60,sec:0,running:false}
  },{
    name: 'Hot Liquor'
    ,targetTemp: 175
    ,currentTemp: 0
    ,diff: 5
    ,active: false
    ,low: null
    ,high: null
  },{
    name: 'Mash'
    ,targetTemp: 150
    ,currentTemp: 0
    ,diff: 2
    ,active: false
    ,low: null
    ,high: null
    ,timer: {min:60,sec:0,running:false}
  }];

  function tempAlert(kettle){

  }

  function calcTemp(temp){
      return temp;
  }

  function updateTemp(response){
    if(response && response.value){
      var kettle = parseInt(response.pin.replace('A',''));

      $scope.kettles[kettle].currentTemp = calcTemp(response.value);

      //is temp too high?
      if($scope.kettles[kettle].currentTemp >= $scope.kettles[kettle].targetTemp+$scope.kettles[kettle].diff){
        $scope.kettles[kettle].high=true;
        tempAlert($scope.kettles[kettle]);
      } //is temp too low?
      else if($scope.kettles[kettle].currentTemp <= $scope.kettles[kettle].targetTemp-$scope.kettles[kettle].diff){
        $scope.kettles[kettle].low=true;
        tempAlert($scope.kettles[kettle]);
      } else {
        $scope.kettles[kettle].low=null;
        $scope.kettles[kettle].high=null;
      }
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
