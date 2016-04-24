brewBench.factory('BrewService', function($http, $q, $filter){

  return {

    //cookies size 4096 bytes
    clear: function(){
      if(window.localStorage){
        window.localStorage.removeItem('settings');
        window.localStorage.removeItem('kettles');
      }
    },

    settings: function(key,values){
          if(!window.localStorage)
            return values;
          try {
            if(values){
              return window.localStorage.setItem(key,JSON.stringify(values));
            }
            else if(window.localStorage.getItem(key)){
              return JSON.parse(window.localStorage.getItem(key));
            }
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

    slack: function(webhook_url,msg,color){
      var q = $q.defer();

      var postObj = {'attachments': [{'fallback': msg,
            'fields': [{'value': msg}],
            'color': color,
            'mrkdwn_in': ['text', 'fallback', 'fields'],
            'thumb_url':'https://brewbench.co/img/brewbench-logo.png'
          }]
        };

      $http({url: webhook_url,method:'POST',data:'payload='+JSON.stringify(postObj), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    // read/write thermistors
    // https://learn.adafruit.com/thermistor/using-a-thermistor
    temp: function(sensor,value){
      var q = $q.defer();
      var url = this.domain()+'/arduino/temp/'+sensor;
      if(value)
        url += '/'+value;

      $http.get(url,{timeout:10000}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },
    // read/write heater
    // http://arduinotronics.blogspot.com/2013/01/working-with-sainsmart-5v-relay-board.html
    // http://myhowtosandprojects.blogspot.com/2014/02/sainsmart-2-channel-5v-relay-arduino.html
    digital: function(sensor,value){
      var q = $q.defer();
      var url = this.domain()+'/arduino/digital/'+sensor+'/'+value;

      $http.get(url,{timeout:10000}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    digitalRead: function(sensor){
      var q = $q.defer();
      var url = this.domain()+'/arduino/digital/'+sensor;

      $http.get(url,{timeout:10000}).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    grains: function(){
        var q = $q.defer();
        $http.get('/data/grains.json').then(function(response){
          q.resolve(response.data);
        },function(err){
          q.reject(err);
        });
        return q.promise;
    },

    hops: function(){
        var q = $q.defer();
        $http.get('/data/hops.json').then(function(response){
          q.resolve(response.data);
        },function(err){
          q.reject(err);
        });
        return q.promise;
    },

    lovibond: function(){
        var q = $q.defer();
        $http.get('/data/lovibond.json').then(function(response){
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
              x: function(d){ return d[0] || d; },
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
                      return d+'\u00B0';
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
