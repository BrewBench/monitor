brewMachine.factory('BMService', function($http, $q, $filter){

  return {

    domain: function(){
      if(document.location.host == 'localhost')
        return 'http://arduino.local';
      return '';
    },
    // endpoint is digital, analog
    // digital = digitalRead(sensor)
    // analog = analogRead(sensor)
    readSensor: function(endpoint,sensor){
      var q = $q.defer();
      $http.get(this.domain()+'/arduino/'+endpoint+'/'+sensor).then(function(response){
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
      $http.get(this.domain()+'/arduino/'+endpoint+'/'+sensor+'/'+value).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    blink: function(pin){
      var q = $q.defer();
      $http.get(this.domain()+'/arduino/blink/'+pin+'/output').then(function(response){
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
