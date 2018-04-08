import angular from 'angular';
import _ from 'lodash';
import 'bootstrap';

angular.module('brewbench-monitor', [
  'ui.router'
  ,'nvd3'
  ,'ngTouch'
  ,'duScroll'
  ,'ui.knob'
  ,'rzModule'
  ,'ngRaven'
])
.config(function($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider, $compileProvider) {

  $httpProvider.defaults.useXDomain = true;
  $httpProvider.defaults.headers.common = 'Content-Type: application/json';
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $locationProvider.hashPrefix('');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob|chrome-extension|data|local):/);

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
    .state('reset', {
      url: '/reset',
      templateUrl: 'views/monitor.html',
      controller: 'mainCtrl'
    })
    .state('otherwise', {
     url: '*path',
     templateUrl: 'views/not-found.html'
   });

});
