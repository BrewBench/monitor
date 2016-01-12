brewMachine.controller('mainCtrl', function($rootScope, $scope, $stateParams, $state, $filter, $timeout, $q, BMService){

var processing = null;

$scope.pollSeconds = 5;//5 seconds

//default values
$scope.kettles = [{
    name: 'Boil'
    ,temp: 200
    ,diff: 2
    ,time: 60
    ,active: true
  },{
    name: 'Hot Liquor'
    ,temp: 175
    ,diff: 2
    ,active: true
  },{
    name: 'Mash'
    ,temp: 150
    ,diff: 2
    ,time: 60
    ,active: true
  }];

  function calcTemp(temp){
      return temp;
  }

  function updateTemp(response){
    if(response && response.value){
      $scope.kettles[parseInt(response.pin.replace('A',''))].temp = calcTemp(response.value);
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
