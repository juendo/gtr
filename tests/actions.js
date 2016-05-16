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
      expect(actions.hasAbilityToUse).toBeDefined();
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

    describe('limit modifiers', function() {
      var handLimit;
      var player;
      var vaultLimit;
      var clienteleLimit;
      beforeEach(function() {
        handLimit = actions.handLimit;
        vaultLimit = actions.vaultLimit;
        clienteleLimit = actions.clienteleLimit;
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
      it('should add two to vault limit for a market', function() {
        player.buildings.push({name: 'Market', color: 'green', done: true, materials: [], selected: false, copy:1, siteColor: 'green'});
        expect(vaultLimit(player)).toBe(5);
      });
      it('should add two to clientele limit for an insula', function() {
        player.buildings.push({name: 'Insula', color: 'yellow', done: true, materials: [], selected: false, copy:1, siteColor: 'yellow'});
        expect(clienteleLimit(player)).toBe(5);
      });
      it('should double clientele limit for an aqueduct', function() {
        player.buildings.push({name: 'Aqueduct', color: 'grey', done: true, materials: [], selected: false, copy:1, siteColor: 'grey'});
        expect(clienteleLimit(player)).toBe(8);
      });
      it('should correctly calculate clientele limit for aqueduct + insula', function() {
        player.buildings.push({name: 'Insula', color: 'yellow', done: true, materials: [], selected: false, copy:1, siteColor: 'yellow'});
        player.buildings.push({name: 'Aqueduct', color: 'grey', done: true, materials: [], selected: false, copy:1, siteColor: 'grey'});
        expect(clienteleLimit(player)).toBe(14);
      });
    });

    describe('laying foundations', function() {
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
    
    describe('upon completions', function() {
      var checkIfComplete;
      var player;
      var meta;
      beforeEach(function() {
        checkIfComplete = actions.checkIfComplete;
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        meta = {finished: false};
      });
      it('should add craftsman actions for amphitheatre', function() {
        var amphitheatre = {name: 'Amphitheatre', color: 'grey', done: false, materials: ['grey', 'grey'], selected: false, copy:1, siteColor: 'grey'};
        player.buildings.push(amphitheatre);
        var actionCount = player.actions.length;
        checkIfComplete(amphitheatre, player);
        expect(amphitheatre.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Craftsman');
      });
      it('should end the game for catacomb', function() {
        var catacomb = {name: 'Catacomb', color: 'blue', done: false, materials: ['blue', 'blue', 'blue'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(catacomb);
        checkIfComplete(catacomb, player, meta);
        expect(meta.finished).toBe(true);
      });
      it('should add laborer actions for foundry', function() {
        var foundry = {name: 'Foundry', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(foundry);
        var actionCount = player.actions.length;
        checkIfComplete(foundry, player, meta);
        expect(foundry.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Laborer');
      });
      it('should add patron actions for garden', function() {
        var garden = {name: 'Garden', color: 'blue', done: false, materials: ['blue', 'blue', 'blue'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(garden);
        var actionCount = player.actions.length;
        checkIfComplete(garden, player, meta);
        expect(garden.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Patron');
      });
      it('should add thinker actions for school', function() {
        var school = {name: 'School', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(school);
        var actionCount = player.actions.length;
        checkIfComplete(school, player, meta);
        expect(school.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Think');
      });
    });

    describe('checking if a player has a building', function() {
      var player;
      var hasAbilityToUse;
      beforeEach(function() {
        hasAbilityToUse = actions.hasAbilityToUse;
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should be false when player doesnt have the building', function() {
        expect(hasAbilityToUse('School', player)).toBeFalsy();
      });
      it('should be false when player has the building but it isnt complete', function() {
        player.buildings.push({name: 'School', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'});
        expect(hasAbilityToUse('School', player)).toBeFalsy();
      });
      it('should be true when player has the building and it is complete', function() {
        player.buildings.push({name: 'School', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'});
        expect(hasAbilityToUse('School', player)).toBeTruthy();
      });
      it('should be true when building is marble and player has finished gate', function() {
        player.buildings.push({name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'});
        player.buildings.push({name: 'Forum', color: 'purple', done: false, materials: ['purple', 'purple'], selected: false, copy:1, siteColor: 'purple'});
        expect(hasAbilityToUse('Forum', player)).toBeTruthy();
      });
    });
  
    describe('Academy', function() {
      var player;
      var academy;
      var game;
      var layFoundation;
      var fillStructureFromHand;
      beforeEach(function() {
        hasAbilityToUse = actions.hasAbilityToUse;
        layFoundation = actions.layFoundation;
        fillStructureFromHand = actions.fillStructureFromHand;
        player = {name:"",buildings:[],hand:[{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}],stockpile:[],clientele:[],vault:[],actions:[{kind:'Craftsman'}],pending:[]};
        academy = {name: 'Academy', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        game = {sites: {'red':6}, players: [player, {}]};
      });
      it('should add think to end of a players actions if they have an academy when they perform a craftsman to lay a foundation', function() {
        player.buildings.push(academy);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        layFoundation(player, game, {}, data, {kind:'Craftsman'});
        expect(player.actions[player.actions.length - 1].kind).toBe('Think');
      });
      it('shouldnt add think to end of a players actions if they dont have an academy when they perform a craftsman to lay a foundation', function() {
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        layFoundation(player, game, {}, data, {kind:'Craftsman'});
        expect(player.actions[player.actions.length - 1].kind).not.toBe('Think');
      });
      it('shouldnt add think to end of a players actions if they have have an academy when they perform a craftsman to lay a foundation but they already have a think action', function() {
        player.buildings.push(academy);
        var shrine = {name: 'Shrine', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(shrine);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        layFoundation(player, game, {}, data, {kind:'Craftsman'});
        var actionsCount = player.actions.length;
        data = {index: 0, card: shrine};
        layFoundation(player, game, {}, data, {kind:'Craftsman'});
        expect(player.actions.length).toBe(actionsCount);
      });
      it('shouldnt add think to end of a players actions if they have an academy when they perform an architect to lay a foundation', function() {
        player.buildings.push(academy);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        layFoundation(player, game, {}, data, {kind:'Architect'});
        expect(player.actions[player.actions.length - 1].kind).not.toBe('Think');
      });
      it('should add think to end of a players actions if they have an academy when they fill a structure from hand', function() {
        player.buildings.push(academy);
        var shrine = {name: 'Shrine', color: 'red', done: false, materials: ['red'], selected: false, copy:2, siteColor: 'red'};
        player.buildings.push(shrine);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        fillStructureFromHand(shrine, player, data, {});
        expect(player.actions[player.actions.length - 1].kind).toBe('Think');
      });
      it('shouldnt add think to end of a players actions if they have an academy when they fill a structure from hand and already have used a craftsman', function() {
        player.buildings.push(academy);
        var shrine = {name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:2, siteColor: 'red'};
        player.buildings.push(shrine);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        fillStructureFromHand(shrine, player, data, {});
        var actionsCount = player.actions.length;
        data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:2, siteColor: 'red'}};
        fillStructureFromHand(shrine, player, data, {});
        expect(player.actions.length).toBe(actionsCount);
      });
      it('should add think to end of a players actions if they have just completed an academy with a craftsman', function() {
        var unfinishedAcademy = {name: 'Academy', color: 'red', done: false, materials: ['red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(unfinishedAcademy);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        fillStructureFromHand(unfinishedAcademy, player, data, {});
        expect(player.actions[player.actions.length - 1].kind).toBe('Think');
      });
    });

    describe('Aqueduct', function() {
      var player;
      var aqueduct;
      var pool;
      var patron;
      var action;
      beforeEach(function() {
        patron = actions.patron;
        pool = {'yellow':5};
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        action = {kind: 'Patron'};
        aqueduct = {name: 'Aqueduct', color: 'grey', done: true, materials: [], selected: false, copy:2, siteColor: 'grey'};
      });
      it('shouldnt imediately spend the action when you take a client from the pool', function() {
        player.buildings.push(aqueduct);
        expect(patron(player, 'yellow', pool, null, action)).toBe(false);
        expect(player.clientele.length).toBe(1);
      });
      it('should imediately spend the action when you take a client from the pool and dont have aqueduct', function() {
        expect(patron(player, 'yellow', pool, null, action)).toBe(true);
        expect(player.clientele.length).toBe(1);
      });
      it('shouldnt take a client from hand when you dont have aqueduct', function() {
        action.takenFromPool = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(patron(player, null, null, {index: 0, card: gate}, action)).toBe(false);
      });
      it('should spend the action if you take from pool after taking from hand', function() {
        player.buildings.push(aqueduct);
        action.takenFromHand = true;
        expect(patron(player, 'yellow', pool, null, action)).toBe(true);
      });
      it('shouldnt immediately spend the action if you take from hand', function() {
        player.buildings.push(aqueduct);
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(patron(player, 'yellow', null, {index: 0, card: gate}, action)).toBe(false);
      });
      it('should spend the action if you take from hand after taking from pool', function() {
        player.buildings.push(aqueduct);
        action.takenFromPool = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(patron(player, null, null, {index: 0, card: gate}, action)).toBe(true);
      });
    });
  });
});