brewMachine.controller('mainCtrl', function($rootScope, $scope, $stateParams, $state, $filter, $timeout, $q){

//default values
$scope.kettles = [{
    name: 'Boil'
    ,temp: 200
    ,diff: 2
    ,time: 60
  },{
    name: 'Hot Liquor'
    ,temp: 175
    ,diff: 2
  },{
    name: 'Mash'
    ,temp: 150
    ,diff: 2
    ,time: 60
  }];

});
