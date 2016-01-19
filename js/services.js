brewBench.factory('BrewService', function($http, $q, $filter, $cookies){

  return {

    //cookies size 4096 bytes
    settings: function(key,values){
          try {
            if(values)
              return $cookies.put(key,JSON.stringify(values));
            else if($cookies.get(key))
              return JSON.parse($cookies.get(key));
          } catch(e){
            /*JSON parse error*/
          }
          return values;
    },

    byteCount: function(s) {
      return encodeURI(s).split(/%..|./).length - 1;
    },

    domain: function(){
      var settings = this.settings('settings');

      if(settings && settings.arduinoUrl)
        return settings.arduinoUrl;
      else if(document.location.host == 'localhost')
        return 'http://arduino.local';
      return '';
    },
    // endpoint is digital, analog
    // digital = digitalRead(sensor)
    // analog = analogRead(sensor)
    readSensor: function(endpoint,sensor){
      var q = $q.defer();
      $http.get(this.domain()+'/arduino/'+endpoint+'/'+sensor,{timeout:10000}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },
    // endpoint is digital, analog
    // digital = digitalWrite(sensor,value)
    // analog = analogWrite(sensor,value)
    writeSensor: function(endpoint,sensor,value){
      var q = $q.defer();
      $http.get(this.domain()+'/arduino/'+endpoint+'/'+sensor+'/'+value,{timeout:10000}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    blink: function(pin){
      var q = $q.defer();
      $http.get(this.domain()+'/arduino/blink/'+pin+'/output',{timeout:10000}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    chartOptions: function(){
      return {
        chart: {
              type: 'lineChart',
              noData: 'Press play on a kettle to start graphing.',
              height: 450,
              margin : {
                  top: 20,
                  right: 20,
                  bottom: 100,
                  left: 65
              },
              x: function(d){ return d[0]; },
              y: function(d){ return d[1]; },
              // average: function(d) { return d.mean },

              color: d3.scale.category10().range(),
              duration: 300,
              useInteractiveGuideline: true,
              clipVoronoi: false,

              xAxis: {
                  axisLabel: 'Time',
                  tickFormat: function(d) {
                      return d3.time.format('%I:%M:%S')(new Date(d))
                  },
                  orient: 'bottom',
                  tickPadding: 20,
                  axisLabelDistance: 40,
                  staggerLabels: true
              },
              forceY: [0,220],
              yAxis: {
                  axisLabel: 'Temperature',
                  tickFormat: function(d){
                      return d;
                  },
                  orient: 'left',
                  showMaxMin: true,
                  axisLabelDistance: 0
              }
          }
        };
    }
  };
});
