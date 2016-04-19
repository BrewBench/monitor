brewBench.filter('moment', function() {
  return function(date) {
      if(!date)
        return '';
      return moment(new Date(date)).fromNow();
    };
}).filter('formatDegrees', function($filter) {
  return function(temp,unit) {
    if(unit=='F')
      return $filter('toFahrenheit')(temp);
    else
      return $filter('toCelsius')(temp);
  };
})
.filter('toFahrenheit', function() {
  return function(celsius) {
    return Math.round(celsius*9/5+32);
  };
}).filter('toCelsius', function() {
  return function(fahrenheit) {
    return Math.round((fahrenheit-32)*5/9);
  };
}).directive('editable', function() {
    return {
        restrict: 'E',
        scope: {model: '=',type:'@?'},
        replace: false,
        template:
'<span>'+
    '<input type="{{type}}" ng-model="model" ng-show="edit" ng-enter="edit=false" class="editable"></input>'+
        '<span ng-show="!edit">{{model}}</span>'+
'</span>',
        link: function(scope, element, attrs) {
            scope.edit = false;
            scope.type = !!scope.type ? scope.type : 'text';
            element.bind('click', function() {
                scope.$apply(scope.edit = true);
                // element.find('input').focus();
            });
        }
    };
}).directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind('keypress', function(e) {
            if (e.charCode === 13 || e.keyCode ===13 ) {
              scope.$apply(attrs.ngEnter);
            }
        });
    };
});
