angular.module('brewbench-monitor')
.directive('editable', function() {
    return {
        restrict: 'E',
        scope: {model:'=',type:'@?',trim:'@?',change:'&?',enter:'&?',placeholder:'@?'},
        replace: false,
        template:
'<span>'+
    '<input type="{{type}}" ng-model="model" ng-show="edit" ng-enter="edit=false" ng-change="{{change||false}}" class="editable"></input>'+
        '<span class="editable" ng-show="!edit">{{(trim) ? ((type=="password") ? "*******" : ((model || placeholder) | limitTo:trim)+"...") :'+
        ' ((type=="password") ? "*******" : (model || placeholder))}}</span>'+
'</span>',
        link: function(scope, element, attrs) {
            scope.edit = false;
            scope.type = Boolean(scope.type) ? scope.type : 'text';
            element.bind('click', function() {
                scope.$apply(scope.edit = true);
            });
            if(scope.enter) scope.enter();
        }
    };
})
.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind('keypress', function(e) {
            if (e.charCode === 13 || e.keyCode ===13 ) {
              scope.$apply(attrs.ngEnter);
              if(scope.change)
                scope.$apply(scope.change);
            }
        });
    };
})
.directive('onReadFile', function ($parse) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
      var fn = $parse(attrs.onReadFile);
			element.on('change', function(onChangeEvent) {
				var reader = new FileReader();
                var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];
                var extension = (file) ? file.name.split('.').pop().toLowerCase() : '';
				reader.onload = function(onLoadEvent) {
					scope.$apply(function() {
                    fn(scope, {$fileContent: onLoadEvent.target.result, $ext: extension});
                    element.val(null);
				    });
				};
				reader.readAsText(file);
			});
		}
	};
});
