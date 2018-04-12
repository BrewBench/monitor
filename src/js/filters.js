angular.module('brewbench-monitor')
.filter('moment', function() {
  return function(date, format) {
      if(!date)
        return '';
      if(format)
        return moment(new Date(date)).format(format);
      else
        return moment(new Date(date)).fromNow();
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
    celsius = parseFloat(celsius);
    return $filter('round')(celsius*9/5+32,2);
  };
})
.filter('toCelsius', function($filter) {
  return function(fahrenheit) {
    fahrenheit = parseFloat(fahrenheit);
    return $filter('round')((fahrenheit-32)*5/9,2);
  };
})
.filter('round', function($filter) {
  return function(val,decimals) {
    return Number((Math.round(val + "e" + decimals)  + "e-" + decimals));
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
})
.filter('titlecase', function($filter){
  return function(text){
    return (text.charAt(0).toUpperCase() + text.slice(1));
  }
});
