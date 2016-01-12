brewMachine.factory('BMService', function($http, $q, $filter){

  return {

    // endpoint is digital, analog
    // digital = digitalRead(sensor)
    // analog = analogRead(sensor)
    readSensor: function(endpoint,sensor){
      var q = $q.defer();

      $http.get('http://arduino.local/arduino/'+endpoint+'/'+sensor).then(function(response){
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
      $http.get('http://arduino.local/arduino/'+endpoint+'/'+sensor+'/'+value).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    },

    // inout = input or output
    // pinMode(pin,inout)
    pin: function(pin,inout){
      var q = $q.defer();
      $http.get('http://arduino.local/arduino/mode/'+pin+'/'+inout).then(function(response){
        q.resolve(response.data);
      },function(err){
        q.reject(err);
      });
      return q.promise;
    }
  };
});
