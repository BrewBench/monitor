angular.module('brewbench-monitor', [
  'ui.router'
  ,'nvd3'
  ,'ngTouch'
  ,'duScroll'
  ,'ui.knob'
  ,'rzModule'
])
.config(function($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {

  $httpProvider.defaults.useXDomain = true;
  $httpProvider.defaults.headers.common = 'Content-Type: application/json';
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $stateProvider
    .state('home', {
      url: '',
      templateUrl: 'views/monitor.html',
      controller: 'mainCtrl'
    })
    .state('share', {
      url: '/sh/:file',
      templateUrl: 'views/monitor.html',
      controller: 'mainCtrl'
    })
    .state('otherwise', {
     url: '*path',
     templateUrl: 'views/not-found.html'
   });

});
