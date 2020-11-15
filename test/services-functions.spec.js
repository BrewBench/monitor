describe('BrewBench Service', function() {
  var BrewService;

  // Before each test load our brewbench-monitor module
  beforeEach(angular.mock.module('brewbench-monitor'));

  // Before each test set our injected BrewService factory (_BrewService_) to our local BrewService variable
  beforeEach(inject(function(_BrewService_) {
    BrewService = _BrewService_;
  }));

  // A simple test to verify the BrewService factory exists
  it('should exist', function() {
    expect(BrewService).toBeDefined();
  });

  describe('.clear()', function() {
    // A simple test to verify the method clear exists
    it('should exist', function() {
      expect(BrewService.clear).toBeDefined();
    });
  });

  describe('.reset()', function() {
    // A simple test to verify the method reset exists
    it('should exist', function() {
      expect(BrewService.reset).toBeDefined();
    });
  });
  
  describe('.app()', function() {
    // A simple test to verify the method app exists
    it('should exist', function() {
      expect(BrewService.app).toBeDefined();
    });
  });
  
  describe('.app().auth()', function() {
    // A simple test to verify the method app.auth exists
    it('should exist', function() {
      expect(BrewService.app().auth).toBeDefined();
    });
  });

  describe('.defaultKnobOptions()', function() {
    // A simple test to verify the method defaultKnobOptions exists
    it('should exist', function() {
      expect(BrewService.defaultKnobOptions).toBeDefined();
    });
  });

  describe('.defaultKettles()', function() {
    // A simple test to verify the method defaultKettles exists
    it('should exist', function() {
      expect(BrewService.defaultKettles).toBeDefined();
    });
  });

  describe('.settings()', function() {
    // A simple test to verify the method settings exists
    it('should exist', function() {
      expect(BrewService.settings).toBeDefined();
    });
  });

  describe('.sensorTypes()', function() {
    // A simple test to verify the method sensorTypes exists
    it('should exist', function() {
      expect(BrewService.sensorTypes).toBeDefined();
    });
  });

  describe('.kettleTypes()', function() {
    // A simple test to verify the method kettleTypes exists
    it('should exist', function() {
      expect(BrewService.kettleTypes).toBeDefined();
    });
  });

  describe('.domain()', function() {
    // A simple test to verify the method domain exists
    it('should exist', function() {
      expect(BrewService.domain).toBeDefined();
    });
  });

  describe('.isESP()', function() {
    // A simple test to verify the method isESP exists
    it('should exist', function() {
      expect(BrewService.isESP).toBeDefined();
    });
  });

  describe('.slack()', function() {
    // A simple test to verify the method slack exists
    it('should exist', function() {
      expect(BrewService.slack).toBeDefined();
    });
  });

  describe('.connect()', function() {
    // A simple test to verify the method connect exists
    it('should exist', function() {
      expect(BrewService.connect).toBeDefined();
    });
  });

  describe('.temp()', function() {
    // A simple test to verify the method temp exists
    it('should exist', function() {
      expect(BrewService.temp).toBeDefined();
    });
  });

  describe('.digital()', function() {
    // A simple test to verify the method digital exists
    it('should exist', function() {
      expect(BrewService.digital).toBeDefined();
    });
  });

  describe('.analog()', function() {
    // A simple test to verify the method analog exists
    it('should exist', function() {
      expect(BrewService.analog).toBeDefined();
    });
  });

  describe('.digitalRead()', function() {
    // A simple test to verify the method digitalRead exists
    it('should exist', function() {
      expect(BrewService.digitalRead).toBeDefined();
    });
  });

  describe('.ifttt()', function() {
    // A simple test to verify the method ifttt exists
    it('should exist', function() {
      expect(BrewService.ifttt).toBeDefined();
    });
  });

  describe('.ifttt().config()', function() {
    // A simple test to verify the method ifttt exists
    it('should exist', function() {
      expect(BrewService.ifttt().config).toBeDefined();
    });
  });
  
  describe('.ifttt().connect()', function() {
    // A simple test to verify the method ifttt exists
    it('should exist', function() {
      expect(BrewService.ifttt().connect).toBeDefined();
    });
  });
  
  describe('.ifttt().send()', function() {
    // A simple test to verify the method ifttt exists
    it('should exist', function() {
      expect(BrewService.ifttt().send).toBeDefined();
    });
  });
  
  describe('.tplink()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink).toBeDefined();
    });
  });

  describe('.tplink().connection()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().connection).toBeDefined();
    });
  });

  describe('.tplink().login()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().login).toBeDefined();
    });
  });

  describe('.tplink().scan()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().scan).toBeDefined();
    });
  });

  describe('.tplink().command()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().command).toBeDefined();
    });
  });

  describe('.tplink().toggle()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().toggle).toBeDefined();
    });
  });

  describe('.tplink().info()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().info).toBeDefined();
    });
  });

  describe('.tplink().command()', function() {
    // A simple test to verify the method tplink exists
    it('should exist', function() {
      expect(BrewService.tplink().command).toBeDefined();
    });
  });

  describe('.pkg()', function() {
    // A simple test to verify the method pkg exists
    it('should exist', function() {
      expect(BrewService.pkg).toBeDefined();
    });
  });

  describe('.grains()', function() {
    // A simple test to verify the method grains exists
    it('should exist', function() {
      expect(BrewService.grains).toBeDefined();
    });
  });

  describe('.hops()', function() {
    // A simple test to verify the method hops exists
    it('should exist', function() {
      expect(BrewService.hops).toBeDefined();
    });
  });

  describe('.water()', function() {
    // A simple test to verify the method water exists
    it('should exist', function() {
      expect(BrewService.water).toBeDefined();
    });
  });

  describe('.styles()', function() {
    // A simple test to verify the method styles exists
    it('should exist', function() {
      expect(BrewService.styles).toBeDefined();
    });
  });

  describe('.lovibond()', function() {
    // A simple test to verify the method lovibond exists
    it('should exist', function() {
      expect(BrewService.lovibond).toBeDefined();
    });
  });

  describe('.chartOptions()', function() {
    // A simple test to verify the method chartOptions exists
    it('should exist', function() {
      expect(BrewService.chartOptions).toBeDefined();
    });
  });

  describe('.abv()', function() {
    // A simple test to verify the method abv exists
    it('should exist', function() {
      expect(BrewService.abv).toBeDefined();
    });
  });

  describe('.abva()', function() {
    // A simple test to verify the method abva exists
    it('should exist', function() {
      expect(BrewService.abva).toBeDefined();
    });
  });

  describe('.abw()', function() {
    // A simple test to verify the method abw exists
    it('should exist', function() {
      expect(BrewService.abw).toBeDefined();
    });
  });

  describe('.re()', function() {
    // A simple test to verify the method re exists
    it('should exist', function() {
      expect(BrewService.re).toBeDefined();
    });
  });

  describe('.attenuation()', function() {
    // A simple test to verify the method attenuation exists
    it('should exist', function() {
      expect(BrewService.attenuation).toBeDefined();
    });
  });

  describe('.calories()', function() {
    // A simple test to verify the method calories exists
    it('should exist', function() {
      expect(BrewService.calories).toBeDefined();
    });
  });

  describe('.sg()', function() {
    // A simple test to verify the method sg exists
    it('should exist', function() {
      expect(BrewService.sg).toBeDefined();
    });
  });

  describe('.plato()', function() {
    // A simple test to verify the method plato exists
    it('should exist', function() {
      expect(BrewService.plato).toBeDefined();
    });
  });

  describe('.recipeBeerSmith()', function() {
    // A simple test to verify the method recipeBeerSmith exists
    it('should exist', function() {
      expect(BrewService.recipeBeerSmith).toBeDefined();
    });
  });

  describe('.recipeBeerXML()', function() {
    // A simple test to verify the method recipeBeerXML exists
    it('should exist', function() {
      expect(BrewService.recipeBeerXML).toBeDefined();
    });
  });

  describe('.formatXML()', function() {
    // A simple test to verify the method formatXML exists
    it('should exist', function() {
      expect(BrewService.formatXML).toBeDefined();
    });
  });

});
