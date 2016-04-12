var brewBench = angular.module('brewbench', [
  'ui.router'
  ,'nvd3'
  ,'ngTouch'
  ,'duScroll'
  ,'ui.knob'
])
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  $httpProvider.defaults.useXDomain = true;
  $httpProvider.defaults.headers.common = 'Content-Type: application/json';
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $stateProvider
    .state('home', {
      url: '',
      templateUrl: 'views/monitor.html',
      controller: 'mainCtrl'
    })
    .state('otherwise', {
     url: '*path',
     templateUrl: 'views/not-found.html'
   });

}.constant('MONGO_CONFIG', {url:'mongodb://brewbench:P2qGJmjNZm3X37hNz2XhuZCwNiATz@ds051655.mlab.com:51655/brewbench'});
);
