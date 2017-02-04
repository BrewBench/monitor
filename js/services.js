brewBench.factory('BrewService', function($http, $q, $filter){

  return {

    //cookies size 4096 bytes
    clear: function(){
      if(window.localStorage){
        window.localStorage.removeItem('settings');
        window.localStorage.removeItem('kettles');
        window.localStorage.removeItem('urls');
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

    domain: function(format){
      var settings = this.settings('settings');
      var domain = '';

      if(settings && settings.arduinoUrl)
        domain = settings.arduinoUrl.indexOf('//')===-1 ? '//'+settings.arduinoUrl : settings.arduinoUrl;
      else if(document.location.host == 'localhost')
        domain = '//arduino.local';

      if(!!format)
        return domain.indexOf('//')!==-1 ? domain.substring(domain.indexOf('//')+2) : domain;
      return domain;
    },

    slack: function(webhook_url,msg,color,icon,kettle){
      var q = $q.defer();

      var postObj = {'attachments': [{'fallback': msg,
            'title': kettle.key+' kettle',
            'title_link': 'http://'+document.location.host+'/#/arduino/'+this.domain(true),
            'fields': [{'value': msg}],
            'color': color,
            'mrkdwn_in': ['text', 'fallback', 'fields'],
            'thumb_url': icon
          }]
        };

      $http({url: webhook_url, method:'POST', data:'payload='+JSON.stringify(postObj), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
        .then(function(response){
          q.resolve(response.data);
        },function(err){
          q.reject(err);
        });
      return q.promise;
    },

    // read/write thermistors or DS18B20
    // https://learn.adafruit.com/thermistor/using-a-thermistor
    // https://www.adafruit.com/product/381)
    temp: function(temp){
      var q = $q.defer();
      var url = this.domain()+'/arduino/'+temp.type+'/'+temp.pin;
      var settings = this.settings('settings');

      $http({url: url, method: 'GET', timeout:  settings.pollSeconds*1000, headers: {'Content-Type': 'application/json'}})
        .then(function(response){
          if(response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') != settings.sketch_version)
            q.reject('Sketch Version is out of date.  Please Update. Sketch: '+response.headers('X-Sketch-Version')+' BrewBench: '+settings.sketch_version);
          else
            q.resolve(response.data);
        }, function(err){
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
      var settings = this.settings('settings');

      $http({url: url, method: 'GET', timeout: settings.pollSeconds*1000})
        .then(function(response){
          if(response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') != settings.sketch_version)
            q.reject('Sketch Version is out of date.  Please Update. Sketch: '+response.headers('X-Sketch-Version')+' BrewBench: '+settings.sketch_version);
          else
            q.resolve(response.data);
        }, function(err){
          q.reject(err);
        });
      return q.promise;
    },

    digitalRead: function(sensor,timeout){
      var q = $q.defer();
      var url = this.domain()+'/arduino/digital/'+sensor;
      var settings = this.settings('settings');

      $http({url: url, method: 'GET', timeout: (timeout || settings.pollSeconds*1000)})
        .then(function(response){
          if(response.headers('X-Sketch-Version') == null || response.headers('X-Sketch-Version') != settings.sketch_version)
            q.reject('Sketch Version is out of date.  Please Update. Sketch: '+response.headers('X-Sketch-Version')+' BrewBench: '+settings.sketch_version);
          else
            q.resolve(response.data);
        }, function(err){
          q.reject(err);
        });
      return q.promise;
    },

    pkg: function(){
        var q = $q.defer();
        $http.get('/package.json').then(function(response){
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

    water: function(){
        var q = $q.defer();
        $http.get('/data/water.json').then(function(response){
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

    chartOptions: function(unit){
      return {
        chart: {
              type: 'lineChart',
              noData: 'Press play on a kettle to start graphing.',
              height: 350,
              margin : {
                  top: 20,
                  right: 20,
                  bottom: 100,
                  left: 65
              },
              x: function(d){ return (d && d.length) ? d[0] : d; },
              y: function(d){ return (d && d.length) ? d[1] : d; },
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
              forceY: (!unit || unit=='F') ? [0,220] : [-17,104],
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
    },
    // http://www.brewersfriend.com/2011/06/16/alcohol-by-volume-calculator-updated/
    // Papazian
    abv: function(og,fg){
      return (( og - fg ) * 131.25).toFixed(2);
    },
    // Daniels, used for high gravity beers
    abva: function(og,fg){
      return (( 76.08 * ( og - fg ) / ( 1.775 - og )) * ( fg / 0.794 )).toFixed(2);
    },
    // http://hbd.org/ensmingr/
    abw: function(abv,fg){
      return ((0.79 * abv) / fg).toFixed(2);
    },
    re: function(op,fp){
      return (0.1808 * op) + (0.8192 * fp);
    },
    attenuation: function(op,fp){
      return ((1 - (fp/op))*100).toFixed(2);
    },
    calories: function(abw,re,fg){
      return (((6.9 * abw) + 4.0 * (re - 0.1)) * fg * 3.55).toFixed(1);
    },
    // http://www.brewersfriend.com/plato-to-sg-conversion-chart/
    sg: function(plato){
      let sg = ( 1 + (plato / (258.6 - ( (plato/258.2) * 227.1) ) ) ).toFixed(3);
      return parseFloat(sg);
    },
    plato: function(sg){
      let plato = ((-1 * 616.868) + (1111.14 * sg) - (630.272 * Math.pow(sg,2)) + (135.997 * Math.pow(sg,3))).toString();
      if(plato.substring(plato.indexOf('.')+1,plato.indexOf('.')+2) == 5)
        plato = plato.substring(0,plato.indexOf('.')+2);
      else if(plato.substring(plato.indexOf('.')+1,plato.indexOf('.')+2) < 5)
        plato = plato.substring(0,plato.indexOf('.'));
      else if(plato.substring(plato.indexOf('.')+1,plato.indexOf('.')+2) > 5){
        plato = plato.substring(0,plato.indexOf('.'));
        plato = parseFloat(plato) + 1;
      }
      return parseFloat(plato);
    }
  };
});
