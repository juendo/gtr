describe('gtr', function () {

  beforeEach(module('myApp'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    $controller = _$controller_;
  }));

  beforeEach(inject(function ($rootScope, $injector) {
      //new a $scope
      $scope = $rootScope.$new();
      actions = $injector.get('actions');
      controller = $controller('gtrController', 
        { $scope: $scope, socket: {on: function(a, b) {}, emit: function(a, b) {}}, actions:actions});

  }));

  describe('actions', function () {
    it('should define functions', function () {
      expect(actions.influence).toBeDefined();
      expect(actions.romeDemands).toBeDefined();
      expect(actions.legionary).toBeDefined();
      expect(actions.selectCard).toBeDefined();
      expect(actions.lead).toBeDefined();
      expect(actions.follow).toBeDefined();
      expect(actions.layFoundation).toBeDefined();
      expect(actions.think).toBeDefined();
      expect(actions.takeJack).toBeDefined();
      expect(actions.patron).toBeDefined();
      expect(actions.laborer).toBeDefined();
      expect(actions.fillStructureFromHand).toBeDefined();
      expect(actions.fillStructureFromStockpile).toBeDefined();
      expect(actions.merchant).toBeDefined();
      expect(actions.addClientActions).toBeDefined();
      expect(actions.checkIfComplete).toBeDefined();
      expect(actions.canAddToStructure).toBeDefined();
      expect(actions.validSelection).toBeDefined();
      expect(actions.handLimit).toBeDefined();
    });

    describe('influence', function() {
      var influence;
      var player;
      beforeEach(function() {
        influence = actions.influence;
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should return two for player with nothing', function() {
        expect(influence(player)).toBe(2);
      });
      it('should return two for player with an unfinished building', function() {
        player.buildings.push({name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:1});
        expect(influence(player)).toBe(2);
      });
      it('should return correct values for each site color', function() {
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'yellow'});
        expect(influence(player)).toBe(3);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'green'});
        expect(influence(player)).toBe(4);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(influence(player)).toBe(6);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'grey'});
        expect(influence(player)).toBe(8);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'blue'});
        expect(influence(player)).toBe(11);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'purple'});
        expect(influence(player)).toBe(14);
      });
    });

    describe('handLimit', function() {
      var handLimit;
      var player;
      beforeEach(function() {
        handLimit = actions.handLimit;
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should be five for player with nothing', function() {
        expect(handLimit(player)).toBe(5);
      });
      it('should be five for player with an unfinished shrine', function() {
        player.buildings.push({name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(handLimit(player)).toBe(5);
      });
      it('should be five for player with an unfinished temple', function() {
        player.buildings.push({name: 'Temple', color: 'purple', done: false, materials: [], selected: false, copy:1, siteColor: 'purple'});
        expect(handLimit(player)).toBe(5);
      });
      it('should be seven for player with a finished shrine', function() {
        player.buildings.push({name: 'Shrine', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(handLimit(player)).toBe(7);
      });
      it('should be nine for player with a finished temple', function() {
        player.buildings.push({name: 'Temple', color: 'purple', done: true, materials: [], selected: false, copy:1, siteColor: 'purple'});
        expect(handLimit(player)).toBe(9);
      });
      it('should be eleven for player with a finished temple and shrine', function() {
        player.buildings.push({name: 'Temple', color: 'purple', done: true, materials: [], selected: false, copy:1, siteColor: 'purple'});
        player.buildings.push({name: 'Shrine', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(handLimit(player)).toBe(11);
      });
    });

    describe('layFoundation', function() {
      var layFoundation;
      var player;
      var game;
      beforeEach(function() {
        layFoundation = actions.layFoundation;
        player = {name:"",buildings:[{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1, siteColor: 'red'}],hand:[{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:3, siteColor: 'red'}],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        game = {sites: {'red':6}, players: [player, {}]};
      });
      it('should append to buildings', function() {
        data = {index: 0, card: {name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:2, siteColor: 'red'}};
        layFoundation(player, game, {}, data, {});
        expect(player.buildings.length).toBe(2);
      });
      it('shouldnt allow multiple buildings with the same name', function() {
        data = {index: 0, card: {name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:2, siteColor: 'red'}};
        expect(layFoundation(player, game, {}, data, {})).toBe(false);
      });
    });
  });
});