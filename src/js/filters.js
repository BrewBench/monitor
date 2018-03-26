angular.module('brewbench-monitor')
.filter('moment', function() {
  return function(date, format) {
      if(!date)
        return '';
      if(format)
        return moment(date.toString()).format(format);
      else
        return moment(date.toString()).fromNow();
    };
})
.filter('formatDegrees', function($filter) {
  return function(temp,unit) {
    if(unit=='F')
      return $filter('toFahrenheit')(temp);
    else
      return $filter('toCelsius')(temp);
  };
})
.filter('toFahrenheit', function($filter) {
  return function(celsius) {
    return $filter('number')(celsius*9/5+32,2);
  };
})
.filter('toCelsius', function($filter) {
  return function(fahrenheit) {
    return $filter('number')((fahrenheit-32)*5/9,2);
  };
})
.filter('highlight', function($sce) {
  return function(text, phrase) {
    if (text && phrase) {
      text = text.replace(new RegExp('('+phrase+')', 'gi'), '<span class="highlighted">$1</span>');
    } else if(!text){
      text = '';
    }
    return $sce.trustAsHtml(text.toString());
  };
});
