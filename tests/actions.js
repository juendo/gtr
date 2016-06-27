describe('gtr', function () {

  beforeEach(module('GTR'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    $controller = _$controller_;
  }));

  beforeEach(inject(function ($rootScope, $injector) {
      $scope = $rootScope.$new();
      actions = $injector.get('actions');
      controller = $controller('gtrController', 
        { $scope: $scope, socket: {on: function(a, b) {}, emit: function(a, b) {}}, socketActions:{}, actions:actions, styling: {} });
  }));

  describe('actions', function () {
    it('should define functions', function () {
      expect(actions.influence).toBeDefined();
      expect(actions.romeDemands).toBeDefined();
      expect(actions.legionary).toBeDefined();
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
      expect(actions.vomitorium).toBeDefined();
    });

    describe('actions.influence', function() {
      var player;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should return two for player with nothing', function() {
        expect(actions.influence(player)).toBe(2);
      });
      it('should return two for player with an unfinished building', function() {
        player.buildings.push({name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:1});
        expect(actions.influence(player)).toBe(2);
      });
      it('should return correct values for each site color', function() {
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'yellow'});
        expect(actions.influence(player)).toBe(3);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'green'});
        expect(actions.influence(player)).toBe(4);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(actions.influence(player)).toBe(6);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'grey'});
        expect(actions.influence(player)).toBe(8);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'blue'});
        expect(actions.influence(player)).toBe(11);
        player.buildings.push({name: 'Academy', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'purple'});
        expect(actions.influence(player)).toBe(14);
      });
    });

    describe('limit modifiers', function() {
      var player;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should be five for player with nothing', function() {
        expect(actions.handLimit(player)).toBe(5);
      });
      it('should be five for player with an unfinished shrine', function() {
        player.buildings.push({name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(actions.handLimit(player)).toBe(5);
      });
      it('should be five for player with an unfinished temple', function() {
        player.buildings.push({name: 'Temple', color: 'purple', done: false, materials: [], selected: false, copy:1, siteColor: 'purple'});
        expect(actions.handLimit(player)).toBe(5);
      });
      it('should be seven for player with a finished shrine', function() {
        player.buildings.push({name: 'Shrine', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(actions.handLimit(player)).toBe(7);
      });
      it('should be nine for player with a finished temple', function() {
        player.buildings.push({name: 'Temple', color: 'purple', done: true, materials: [], selected: false, copy:1, siteColor: 'purple'});
        expect(actions.handLimit(player)).toBe(9);
      });
      it('should be eleven for player with a finished temple and shrine', function() {
        player.buildings.push({name: 'Temple', color: 'purple', done: true, materials: [], selected: false, copy:1, siteColor: 'purple'});
        player.buildings.push({name: 'Shrine', color: 'red', done: true, materials: [], selected: false, copy:1, siteColor: 'red'});
        expect(actions.handLimit(player)).toBe(11);
      });
      it('should add two to vault limit for a market', function() {
        player.buildings.push({name: 'Market', color: 'green', done: true, materials: [], selected: false, copy:1, siteColor: 'green'});
        expect(actions.vaultLimit(player)).toBe(5);
      });
      it('should add two to clientele limit for an insula', function() {
        player.buildings.push({name: 'Insula', color: 'yellow', done: true, materials: [], selected: false, copy:1, siteColor: 'yellow'});
        expect(actions.clienteleLimit(player)).toBe(5);
      });
      it('should double clientele limit for an aqueduct', function() {
        player.buildings.push({name: 'Aqueduct', color: 'grey', done: true, materials: [], selected: false, copy:1, siteColor: 'grey'});
        expect(actions.clienteleLimit(player)).toBe(8);
      });
      it('should correctly calculate clientele limit for aqueduct + insula', function() {
        player.buildings.push({name: 'Insula', color: 'yellow', done: true, materials: [], selected: false, copy:1, siteColor: 'yellow'});
        player.buildings.push({name: 'Aqueduct', color: 'grey', done: true, materials: [], selected: false, copy:1, siteColor: 'grey'});
        expect(actions.clienteleLimit(player)).toBe(14);
      });
    });

    describe('laying foundations', function() {
      var player;
      var game;
      beforeEach(function() {
        player = {name:"",buildings:[{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1, siteColor: 'red'}],hand:[{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:3, siteColor: 'red'}],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        game = {sites: {'red':6}, players: [player, {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}], currentPlayer: 0, leader: 0};
      });
      it('should append to buildings', function() {
        data = {index: 0, color: 'red', card: {name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:2, siteColor: 'red'}};
        actions.layFoundation(player, game, data, {});
        expect(player.buildings.length).toBe(2);
      });
      it('shouldnt allow multiple buildings with the same name', function() {
        data = {index: 0, card: {name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:2, siteColor: 'red'}};
        expect(actions.layFoundation(player, game, data, {})).toBe(false);
      });
    });
    
    describe('completion checks', function() {
      var player;
      var meta;
      var prison;
      var opp;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        meta = {finished: false};
        prison = {name: 'Prison', color: 'blue', done: false, materials: ['blue', 'blue', 'blue'], selected: false, copy:1, siteColor: 'blue'};
        opp = {name:"opp",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should add craftsman actions for amphitheatre', function() {
        var amphitheatre = {name: 'Amphitheatre', color: 'grey', done: false, materials: ['grey', 'grey'], selected: false, copy:1, siteColor: 'grey'};
        player.buildings.push(amphitheatre);
        var actionCount = player.actions.length;
        actions.checkIfComplete(amphitheatre, player);
        expect(amphitheatre.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Craftsman');
      });
      it('should end the game for catacomb', function() {
        var catacomb = {name: 'Catacomb', color: 'blue', done: false, materials: ['blue', 'blue', 'blue'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(catacomb);
        actions.checkIfComplete(catacomb, player, meta);
        expect(meta.finished).toBe(true);
      });
      it('should add actions.laborer actions for foundry', function() {
        var foundry = {name: 'Foundry', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(foundry);
        var actionCount = player.actions.length;
        actions.checkIfComplete(foundry, player, meta);
        expect(foundry.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Laborer');
      });
      it('should add actions.patron actions for garden', function() {
        var garden = {name: 'Garden', color: 'blue', done: false, materials: ['blue', 'blue', 'blue'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(garden);
        var actionCount = player.actions.length;
        actions.checkIfComplete(garden, player, meta);
        expect(garden.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Patron');
      });
      it('should add thinker actions for school', function() {
        var school = {name: 'School', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(school);
        var actionCount = player.actions.length;
        actions.checkIfComplete(school, player, meta);
        expect(school.done).toBe(true);
        expect(player.actions.length).toBe(actionCount + actions.influence(player));
        expect(player.actions[0].kind).toBe('Think');
      });
      it('should add marble to any unfinished structure with scriptorium', function() {
        var garden = {name: 'Garden', color: 'blue', done: false, materials: [], selected: false, copy:1, siteColor: 'blue'};
        var scriptorium = {name: 'Scriptorium', color: 'blue', done: true, materials: [], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(garden);
        player.buildings.push(scriptorium);
        expect(actions.canAddToStructure(garden, player, 'purple', {}, {})).toBe(true);
      });
      it('building with marble as most recent thing added is finished with scriptorium', function() {
        var garden = {name: 'Garden', color: 'blue', done: false, materials: ['purple'], selected: false, copy:1, siteColor: 'blue'};
        var scriptorium = {name: 'Scriptorium', color: 'blue', done: true, materials: [], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(garden);
        player.buildings.push(scriptorium);
        actions.checkIfComplete(garden, player, {});
        expect(garden.done).toBe(true);
      });
      it('can add any material to stone buildings with road', function() {
        var road = {name: 'Road', color: 'yellow', done: true, materials: ['yellow'], selected: false, copy:1, siteColor: 'yellow'};
        player.buildings.push(road);
        var garden = {name: 'Garden', color: 'blue', done: false, materials: ['purple'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(garden);
        expect(actions.canAddToStructure(garden, player, 'green', {}, {})).toBe(true);
        expect(actions.canAddToStructure(garden, player, 'red', {}, {})).toBe(true);
      });
      it('should finish villa in one architect but not in craftsman', function() {
        var villa = {name: 'Villa', color: 'blue', done: false, materials: ['blue'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(villa);
        actions.checkIfComplete(villa, player, meta, 'Craftsman');
        expect(villa.done).toBe(false);
        actions.checkIfComplete(villa, player, meta, 'Architect');
        expect(villa.done).toBe(true);
      });
      it('should add a choose building to actions.prison action for a prison', function() {
        player.buildings.push(prison);
        actions.checkIfComplete(prison, player, meta, 'Craftsman');
        expect(player.actions[0].kind).toBe('Prison');
      });
      it('prison should return true for completed building stolen', function() {
        player.buildings.push(prison);
        var foundry = {name: 'Foundry', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        opp.buildings.push(foundry);
        actions.prison(player, foundry, opp, 0, {players: [player, opp], currentPlayer: 0, leader: 0});
        expect(opp.buildings.length).toBe(0);
      });
      it('prison should return false for incomplete building stolen', function() {
        player.buildings.push(prison);
        var foundry = {name: 'Foundry', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        opp.buildings.push(foundry);
        expect(actions.prison(player, foundry, opp, 0, {players: [player, opp], currentPlayer: 0, leader: 0})).toBe(false);
      });
      it('prison should add complete building to players buildings', function() {
        player.buildings.push(prison);
        var foundry = {name: 'Foundry', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        opp.buildings.push(foundry);
        actions.prison(player, foundry, opp, 0, {players: [player, opp], currentPlayer: 0, leader: 0});
        expect(player.buildings[1]).toBe(foundry);
      });
      it('prison should remove opponents building', function() {
        player.buildings.push(prison);
        var foundry = {name: 'Foundry', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        opp.buildings.push(foundry);
        actions.prison(player, foundry, opp, 0, {players: [player, opp], currentPlayer: 0, leader: 0});
        expect(opp.buildings.length).toBe(0);
      });
      it('prison should add three actions.influence to opponent and not rid them of the actions.influence from the stolen building', function() {
        player.buildings.push(prison);
        var foundry = {name: 'Foundry', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        opp.buildings.push(foundry);
        actions.prison(player, foundry, opp, 0,{players: [player, opp], currentPlayer: 0, leader: 0});
        expect(actions.influence(opp)).toBe(7);
      });
    });

    describe('checking if a player has a building', function() {
      var player;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should be false when player doesnt have the building', function() {
        expect(actions.hasAbilityToUse('School', player)).toBeFalsy();
      });
      it('should be false when player has the building but it isnt complete', function() {
        player.buildings.push({name: 'School', color: 'red', done: false, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'});
        expect(actions.hasAbilityToUse('School', player)).toBeFalsy();
      });
      it('should be true when player has the building and it is complete', function() {
        player.buildings.push({name: 'School', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'});
        expect(actions.hasAbilityToUse('School', player)).toBeTruthy();
      });
      it('should be true when building is marble and player has finished gate', function() {
        player.buildings.push({name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'});
        player.buildings.push({name: 'Forum', color: 'purple', done: false, materials: ['purple', 'purple'], selected: false, copy:1, siteColor: 'purple'});
        expect(actions.hasAbilityToUse('Forum', player)).toBeTruthy();
      });
    });
  
    describe('Academy', function() {
      var player;
      var academy;
      var game;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}],stockpile:[],clientele:[],vault:[],actions:[{kind:'Craftsman'}],pending:[]};
        academy = {name: 'Academy', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        game = {sites: {'red':6}, players: [player, {}]};
      });
      it('should add think to end of a players actions if they have an academy when they perform a craftsman to lay a foundation', function() {
        player.buildings.push(academy);
        var data = {index: 0, color: 'red', card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.layFoundation(player, game, data, {kind:'Craftsman'});
        expect(player.actions[player.actions.length - 1].kind).toBe('Think');
      });
      it('shouldnt add think to end of a players actions if they dont have an academy when they perform a craftsman to lay a foundation', function() {
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.layFoundation(player, game, {}, data, {kind:'Craftsman'});
        expect(player.actions[player.actions.length - 1].kind).not.toBe('Think');
      });
      it('shouldnt add think to end of a players actions if they have have an academy when they perform a craftsman to lay a foundation but they already have a think action', function() {
        player.buildings.push(academy);
        var shrine = {name: 'Shrine', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(shrine);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.layFoundation(player, game, {}, data, {kind:'Craftsman'});
        var actionsCount = player.actions.length;
        data = {index: 0, card: shrine};
        actions.layFoundation(player, game, {}, data, {kind:'Craftsman'});
        expect(player.actions.length).toBe(actionsCount);
      });
      it('shouldnt add think to end of a players actions if they have an academy when they perform an architect to lay a foundation', function() {
        player.buildings.push(academy);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.layFoundation(player, game, {}, data, {kind:'Architect'});
        expect(player.actions[player.actions.length - 1].kind).not.toBe('Think');
      });
      it('should add think to end of a players actions if they have an academy when they fill a structure from hand', function() {
        player.buildings.push(academy);
        var shrine = {name: 'Shrine', color: 'red', done: false, materials: ['red'], selected: false, copy:2, siteColor: 'red'};
        player.buildings.push(shrine);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.fillStructureFromHand(shrine, player, data, {}, {}, {}, {});
        expect(player.actions[player.actions.length - 1].kind).toBe('Think');
      });
      it('shouldnt add think to end of a players actions if they have an academy when they fill a structure from hand and already have used a craftsman', function() {
        player.buildings.push(academy);
        var shrine = {name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:2, siteColor: 'red'};
        player.buildings.push(shrine);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.fillStructureFromHand(shrine, player, data, {}, {}, {}, {});
        var actionsCount = player.actions.length;
        data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:2, siteColor: 'red'}};
        actions.fillStructureFromHand(shrine, player, data, {players: [player], currentPlayer: 0, leader: 0}, {});
        expect(player.actions.length).toBe(actionsCount);
      });
      it('should add think to end of a players actions if they have just completed an academy with a craftsman', function() {
        var unfinishedAcademy = {name: 'Academy', color: 'red', done: false, materials: ['red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(unfinishedAcademy);
        var data = {index: 0, card:{name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'}};
        actions.fillStructureFromHand(unfinishedAcademy, player, data, {}, {}, {}, {});
        expect(player.actions[player.actions.length - 1].kind).toBe('Think');
      });
    });

    describe('hiring clients', function() {
      var player;
      var aqueduct;
      var pool;
      var action;
      beforeEach(function() {
        pool = {'yellow':5};
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        action = {kind: 'Patron'};
        aqueduct = {name: 'Aqueduct', color: 'grey', done: true, materials: [], selected: false, copy:2, siteColor: 'grey'};
        player.actions.push(action);
      });
      it('with aqueduct shouldnt imediately spend the action when you take a client from the pool', function() {
        player.buildings.push(aqueduct);
        actions.patron(player, 'yellow', pool, null, action, {})
        expect(player.actions.length).toBe(1);
        expect(player.clientele.length).toBe(1);
      });
      it('should imediately spend the action when you take a client from the pool and dont have aqueduct', function() {
        actions.patron(player, 'yellow', pool, null, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0].kind).toBe("Lead");
        expect(player.clientele.length).toBe(1);
      });
      it('shouldnt take a client from hand when you dont have aqueduct', function() {
        action.takenFromPool = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(actions.patron(player, null, null, {index: 0, card: gate}, action)).toBe(false);
      });
      it('with aqueduct should spend the action if you take from pool after taking from hand', function() {
        player.buildings.push(aqueduct);
        action.takenFromHand = true;
        actions.patron(player, 'yellow', pool, null, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0].kind).toBe("Lead");
      });
      it('with aqueduct shouldnt immediately spend the action if you take from hand', function() {
        player.buildings.push(aqueduct);
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        actions.patron(player, 'yellow', null, {index: 0, card: gate}, action, {});
        expect(player.actions.length).toBe(1);
      });
      it('with aqueduct should spend the action if you take from hand after taking from pool', function() {
        player.buildings.push(aqueduct);
        action.takenFromPool = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        actions.patron(player, null, null, {index: 0, card: gate}, action, {players: [player], currentPlayer: 0, leader: 0})
        expect(player.actions[0].kind).toBe("Lead");
      });
      it('with aqueduct shouldnt take a client from pool if you already have', function() {
        player.buildings.push(aqueduct);
        action.takenFromPool = true;
        expect(actions.patron(player, 'yellow', pool, null, action)).toBe(false);
        expect(player.clientele.length).toBe(0);
      });
      it('with aqueduct shouldnt take a client from hand if you already have', function() {
        player.buildings.push(aqueduct);
        action.takenFromHand = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(actions.patron(player, null, null, {index: 0, card: gate}, action)).toBe(false);
        expect(player.clientele.length).toBe(0);
      });
      it('should add action for client when hired with bath', function() {
        var bath = {name: 'Bath', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(bath);
        var game = {};
        var used = actions.patron(player, 'yellow', pool, null, action, game);
        expect(used).toBe(game);
        expect(player.actions[0].kind).toBe('Laborer');
      });
      it('should add action for client when hired from hand with aqueduct and bath', function() {
        var bath = {name: 'Bath', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.buildings.push(bath);
        player.buildings.push(aqueduct);
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        actions.patron(player, null, null, {index: 0, card: gate}, action, {});
        expect(player.actions.length).toBe(2);
        expect(player.actions[0].kind).toBe('Legionary');
      });
    });

    describe('modifying clients', function() {
      var player;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
      });
      it('should count any client as actions.laborer with storeroom', function() {
        var storeroom = {name: 'Storeroom', color: 'grey', done: true, materials: ['grey', 'grey'], selected: false, copy:1, siteColor: 'grey'};
        player.buildings.push(storeroom);
        player.clientele.push('Craftsman');
        player.clientele.push('Merchant');
        actions.addClientActions(player, 'yellow');
        expect(player.actions.length).toBe(2);
      });
      it('shouldnt count any client as actions.laborer without storeroom', function() {
        player.clientele.push('Craftsman');
        player.clientele.push('Merchant');
        actions.addClientActions(player, 'yellow');
        expect(player.actions.length).toBe(0);
      });
      it('should add actions for any role with actions.merchant client and ludus magnus', function() {
        var ludus = {name: 'LudusMagnus', color: 'blue', done: true, materials: ['blue', 'blue'], selected: false, copy:1, siteColor: 'blue'};
        player.buildings.push(ludus);
        player.clientele.push('Craftsman');
        player.clientele.push('Merchant');
        actions.addClientActions(player, 'yellow');
        expect(player.actions.length).toBe(1);
      });
    });

    describe('actions.laborer', function() {
      var player;
      var dock;
      var pool;
      var action;
      var game;
      beforeEach(function() {
        pool = {'yellow':5};
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        action = {kind: 'Laborer'};
        player.actions.push(action);
        dock = {name: 'Dock', color: 'green', done: true, materials: [], selected: false, copy:2, siteColor: 'green'};
        game = {players:[player], currentPlayer: 0, leader: 0};
      });
      it('should immediately spend action when you dont have a dock', function() {
        actions.laborer(player, 'yellow', pool, null, action, game);
        expect(player.actions[0].kind).toBe("Lead");
        expect(player.stockpile.length).toBe(1);
      });
      it('shouldnt immediately spend action when you have a dock', function() {
        player.buildings.push(dock);
        actions.laborer(player, 'yellow', pool, null, action, game);
        expect(player.actions[0]).toBe(action);
        expect(player.stockpile.length).toBe(1);
      });
      it('shouldnt take a material from hand when you dont have dock', function() {
        action.takenFromPool = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(actions.laborer(player, null, null, {index: 0, card: gate}, action, game)).toBe(false);
      });
      it('with dock should spend the action if you take from pool after taking from hand', function() {
        player.buildings.push(dock);
        action.takenFromHand = true;
        actions.laborer(player, 'yellow', pool, null, action, game);
        expect(player.actions[0].kind).toBe("Lead");
      });
      it('with dock shouldnt immediately spend the action if you take from hand', function() {
        player.buildings.push(dock);
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        actions.laborer(player, 'yellow', null, {index: 0, card: gate}, action, game);
        expect(player.actions[0]).toBe(action);
      });
      it('with dock should spend the action if you take from hand after taking from pool', function() {
        player.buildings.push(dock);
        action.takenFromPool = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        actions.laborer(player, null, null, {index: 0, card: gate}, action, game);
        expect(player.actions[0].kind).toBe("Lead");
      });
      it('with dock shouldnt take a client from pool if you already have', function() {
        player.buildings.push(dock);
        action.takenFromPool = true;
        expect(actions.laborer(player, 'yellow', pool, null, action)).toBe(false);
        expect(player.stockpile.length).toBe(0);
      });
      it('with dock shouldnt take a client from hand if you already have', function() {
        player.buildings.push(dock);
        action.takenFromHand = true;
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        expect(actions.laborer(player, null, null, {index: 0, card: gate}, action)).toBe(false);
        expect(player.stockpile.length).toBe(0);
      });
    });

    describe('actions.merchant', function() {
      var player;
      var basilica;
      var action;
      var materialData;
      var handData;
      var atrium;
      var deck;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        action = {kind: 'Merchant'};
        basilica = {name: 'Basilica', color: 'blue', done: true, materials: [], selected: false, copy:2, siteColor: 'blue'};
        player.stockpile.push('yellow');
        materialData = {index: 0, material: 'yellow'};
        var gate = {name: 'Gate', color: 'red', done: true, materials: ['red', 'red'], selected: false, copy:1, siteColor: 'red'};
        player.hand.push(gate);
        handData = {index: 0, card: gate};
        atrium = {name: 'Atrium', color: 'red', done: true, materials: [], selected: false, copy:2, siteColor: 'red'};
        deck = [gate];
      });
      it('should immediately spend action when you dont have a basilica', function() {
        actions.merchant(player, materialData, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0].kind).toBe("Lead");
        expect(player.vault.length).toBe(1);
      });
      it('shouldnt immediately spend action when you have a basilica', function() {
        player.buildings.push(basilica);
        player.actions.push(action);
        actions.merchant(player, materialData, action, {players: [player], currentPlayer: 0, leader: 0})
        expect(player.actions[0]).toBe(action);
        expect(player.vault.length).toBe(1);
      });
      it('shouldnt take a material from hand when you dont have basilica', function() {
        action.takenFromStockpile = true;
        expect(actions.merchant(player, handData, action)).toBe(false);
      });
      it('with basilica should spend the action if you take from stockpile after taking from hand', function() {
        player.buildings.push(basilica);
        action.takenFromHand = true;
        actions.merchant(player, materialData, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0].kind).toBe("Lead");
      });
      it('with basilica shouldnt immediately spend the action if you take from hand', function() {
        player.buildings.push(basilica);
        player.actions.push(action);
        actions.merchant(player, handData, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0]).toBe(action);
      });
      it('with basilica should spend the action if you take from hand after taking from stockpile', function() {
        player.buildings.push(basilica);
        action.takenFromStockpile = true;
        actions.merchant(player, handData, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0].kind).toBe("Lead");
      });
      it('with basilica shouldnt take a material from stockpile if you already have', function() {
        player.buildings.push(basilica);
        action.takenFromStockpile = true;
        expect(actions.merchant(player, materialData, action)).toBe(false);
        expect(player.vault.length).toBe(0);
      });
      it('with basilica shouldnt take a material from hand if you already have', function() {
        player.buildings.push(basilica);
        action.takenFromHand = true;
        expect(actions.merchant(player, handData, action)).toBe(false);
        expect(player.vault.length).toBe(0);
      });
      it('with atrium should take a material from deck', function() {
        player.buildings.push(atrium);
        actions.merchant(player, {deck: deck, game: {}}, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(player.actions[0].kind).toBe("Lead");
        expect(player.vault.length).toBe(1);
      });
      it('without atrium shouldnt take a material from deck', function() {
        expect(actions.merchant(player, {deck: deck, game: {}}, action)).toBe(false);
        expect(player.vault.length).toBe(0);
      });
      it('with atrium shouldnt take a material from deck if already have taken from deck/stockpile', function() {
        player.buildings.push(atrium);
        action.takenFromStockpile = true;
        expect(actions.merchant(player, {deck: deck, game: {}}, action)).toBe(false);
        expect(player.vault.length).toBe(0);
      });
      it('with atrium taking from deck should set actions taken from stockpile to true', function() {
        player.buildings.push(atrium);
        actions.merchant(player, {deck: deck, game: {}}, action, {players: [player], currentPlayer: 0, leader: 0});
        expect(action.takenFromStockpile).toBe(true);
      });
    });

    describe('palace', function() {
      var player;
      var palace;
      var jack;
      var shrine;
      var dock;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        palace = {name: 'Palace', color: 'purple', done: true, materials: [], selected: false, copy:2, siteColor: 'purple'};
        jack = {name: 'Jack', color: 'black'};
        shrine = {name: 'Shrine', color: 'red'};
        dock = {name: 'Dock', color: 'green'};
      });
      it('should be valid for any number of cards that match the target action with palace', function() {
        player.buildings.push(palace);
        expect(actions.validSelection(player, [shrine, shrine], 'red')).toBe(true);
        expect(actions.validSelection(player, [shrine, shrine, shrine, shrine], 'red')).toBe(true);
      });
      it('shouldnt be valid for a mixed set of cards that dont all match target action with palace', function() {
        player.buildings.push(palace);
        expect(actions.validSelection(player, [shrine, dock], 'red')).toBe(false);
        expect(actions.validSelection(player, [shrine, shrine, shrine, dock], 'red')).toBe(false);
      });
      it('shouldnt be valid for cards that are the same but dont match the target action with palace', function() {
        player.buildings.push(palace);
        expect(actions.validSelection(player, [dock, dock], 'red')).toBe(false);
        expect(actions.validSelection(player, [dock, dock, dock, dock], 'red')).toBe(false);
      });
      it('should be valid for cards that are the same and match, plus any number of jacks', function() {
        player.buildings.push(palace);
        expect(actions.validSelection(player, [shrine, shrine, jack], 'red')).toBe(true);
        expect(actions.validSelection(player, [jack, shrine, jack, jack, jack], 'red')).toBe(true);
        expect(actions.validSelection(player, [jack, shrine, jack, dock, jack], 'red')).toBe(false);
        expect(actions.validSelection(player, [jack, jack, jack, jack, jack], 'red')).toBe(true);
      });
      it('should be valid with other colors added in a multiple of three', function() {
        player.buildings.push(palace);
        expect(actions.validSelection(player, [shrine, dock, dock, dock], 'red')).toBe(true);
      });
      it('should add on extra actions', function() {
        player.buildings.push(palace);
        actions.validSelection(player, [shrine, dock, dock, dock], 'red');
        expect(player.actions.length).toBe(1);
        expect(player.actions[0].kind).toBe('Legionary');
      });
    });

    describe('checking for latrine and vomitorium', function() {
      var latrine;
      var jack;
      var shrine;
      var dock;
      var pool;
      var player;
      var vomitorium;
      beforeEach(function() {
        latrine = {name: 'Latrine', color: 'yellow', done: true, materials: [], selected: false, copy:2, siteColor: 'yellow'};
        jack = {name: 'Jack', color: 'black'};
        player = {name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        player.actions.push({kind:'Lead', description:'LEAD or THINK'});
        shrine = {name: 'Shrine', color: 'red'};
        dock = {name: 'Dock', color: 'green'};
        pool = {'black':0, 'red': 0, 'green': 0};
        player.hand.push(shrine, jack, dock);
        vomitorium = {name: 'Vomitorium', color: 'grey', done: true, materials: [], selected: false, copy:2, siteColor: 'grey'};
      });
      it('should return false when player has no latrine', function() {
        expect(actions.checkLatrine(player, pool)).toBe(false);
      });
      it('should return false when player has latrine and no card selected', function() {
        player.buildings.push(latrine);
        expect(actions.checkLatrine(player, pool)).toBe(false);
      });
      it('should return false when player has latrine and more than one card selected', function() {
        player.buildings.push(latrine);
        dock.selected = true;
        shrine.selected = true;
        expect(actions.checkLatrine(player, pool)).toBe(false);
      });
      it('should return true when player has latrine and one card selected', function() {
        player.buildings.push(latrine);
        jack.selected = true;
        expect(actions.checkLatrine(player, pool)).toBe(true);
      });
      it('should get rid of the single selected card from players hand', function() {
        player.buildings.push(latrine);
        jack.selected = true;
        actions.checkLatrine(player, pool);
        expect(player.hand.length).toBe(2);
        expect(player.hand[0]).toBe(shrine);
        expect(player.hand[1]).toBe(dock);
      });
      it('should return false when player has no vomitorium', function() {
        expect(actions.vomitorium(player, pool)).toBe(false);
      });
      it('should return true when a player has a vomitorium', function() {
        player.buildings.push(vomitorium);
        expect(actions.vomitorium(player, pool, {})).toBeTruthy();
      });
      it('should get rid of players hand when used', function() {
        player.buildings.push(vomitorium);
        player.hand = [shrine, dock, jack];
        actions.vomitorium(player, pool);
        expect(player.hand.length).toBe(0);
      });
      it('should add hand to pool when used', function() {
        player.buildings.push(vomitorium);
        player.hand = [shrine, dock, jack];
        actions.vomitorium(player, pool);
        expect(pool.green).toBe(1);
        expect(pool.black).toBe(1);
        expect(pool.red).toBe(1);
      });
    });

    describe('stairway', function() {
      var player;
      var stairway;
      var latrine;
      var palace;
      var game;
      beforeEach(function() {
        player = {name:"",buildings:[],hand:[latrine],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        stairway = {name: 'Stairway', color: 'purple', done: true, materials: [], selected: false, copy:2, siteColor: 'purple'};
        latrine = {name: 'Latrine', color: 'yellow', done: true, materials: [], selected: false, copy:2, siteColor: 'yellow'};
        game = {sites: {'red':6}, players: [player, {hand:[]}], currentPlayer: 0, leader: 0};
        game.players = [player];
        palace = {name: 'Palace', color: 'purple', done: true, materials: [], selected: false, copy:2, siteColor: 'purple'};
      });
      it('shouldnt let you add to opponents finished structure thats not yours without a stairway', function() {
        expect(actions.canAddToStructure(latrine, player, 'yellow', game, {})).toBe(false);
      });
      it('shouldnt let you add to opponents unfinished structure with stairway', function() {
        player.buildings.push(stairway);
        latrine.done = false;
        expect(actions.canAddToStructure(latrine, player, 'yellow', game, {})).toBe(false);
      });
      it('should let you add to opponents finished structure with a stairway', function() {
        player.buildings.push(stairway);
        expect(actions.canAddToStructure(latrine, player, 'yellow', game, {})).toBe(true);
        expect(actions.canAddToStructure(palace, player, 'purple', game, {})).toBe(true);
        expect(actions.canAddToStructure(palace, player, 'purple', game, {})).toBe(false);
      });
      it('you should have ability to use opponents structure after adding material', function() {
        expect(actions.hasAbilityToUse('Latrine', player)).toBeFalsy();
        player.buildings.push(stairway);
        actions.canAddToStructure(latrine, player, 'yellow', game, {});
        expect(actions.hasAbilityToUse('Latrine', player)).toBeTruthy();
      });
      it('shouldnt change your actions.influence after giving you ability to use opponents structure', function() {
        player.buildings.push(stairway);
        var before = actions.influence(player);
        actions.canAddToStructure(latrine, player, 'yellow', game, {});
        expect(actions.influence(player)).toBe(before);
      });
      it('shouldnt be possible to add to opponents blank building', function() {
        player.buildings.push(stairway);
        latrine.color = 'blank';
        latrine.siteColor = 'blank';
        expect(actions.canAddToStructure(latrine, player, 'yellow', game, {})).toBe(false);
      });
      it('should set add structure name to games public buildings', function() {
        player.buildings.push(stairway);
        actions.canAddToStructure(latrine, player, 'yellow', game, {});
        expect(player.publicBuildings).toBeDefined();
      });
      it('should be in addition', function() {
        player.buildings.push(stairway);
        var unfinishedPalace = {name: 'Palace', color: 'purple', done: true, materials: [], selected: false, copy:3, siteColor: 'purple'};
        player.buildings.push(palace);
        player.stockpile.push('purple');
        player.stockpile.push('purple');
        unfinishedPalace.done = false;
        var action = {kind:'Architect'};
        // filling their own finished palace does nothing
        expect(actions.fillStructureFromStockpile(palace, player, {index:0, material: 'purple'}, game, action)).toBe(false);
        expect(action.usedRegularArchitect).toBeFalsy();
        expect(action.usedStairway).toBeFalsy();
        // filling another players unfinished palace does nothing
        expect(actions.fillStructureFromStockpile(unfinishedPalace, player, {index:0, material: 'purple'}, game, action)).toBe(false);
        expect(action.usedRegularArchitect).toBeFalsy();
        expect(action.usedStairway).toBeFalsy();
        // filling their own unfinished palace does something
        palace.done = false;
        actions.fillStructureFromStockpile(palace, player, {index:0, material: 'purple'}, game, action);
        player.actions.push(action);
        expect(player.actions.length).toBe(1);
        expect(action.usedRegularArchitect).toBe(true);
        expect(action.usedStairway).toBeFalsy();
        // filling opponents finished structure does something
        unfinishedPalace.done = true;
        actions.fillStructureFromStockpile(unfinishedPalace, player, {index:0, material: 'purple'}, game, action)
        expect(player.actions[0].kind).toBe("Lead");
        expect(action.usedRegularArchitect).toBe(true);
        expect(action.usedStairway).toBe(true);
      });
    });
    describe('scoring', function() {
      var game;
      var player1;
      var player2;
      var player3;
      var game;
      var meta;
      beforeEach(function() {
        player1 = {name:"Neil",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        player2 = {name:"Noil",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        player3 = {name:"Niall",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
        game = {players: [player1, player2, player3], finished: true};
        meta = {finished: true};
      });
      it('should give 2 each for players with nothing', function() {
        actions.checkIfGameOver(game, meta);
        expect(actions.score(player1)).toBe(2);
        expect(actions.score(player2)).toBe(2);
        expect(actions.score(player3)).toBe(2);
      });
      it('should give add points for vault', function() {
        player1.vault.push('green');
        player2.vault.push('green');
        player3.vault.push('green');
        actions.checkIfGameOver(game, meta);
        expect(actions.score(player1)).toBe(3);
        expect(actions.score(player2)).toBe(3);
        expect(actions.score(player3)).toBe(3);
      });
      it('should add actions.merchant bonus points for vault', function() {
        player1.vault.push('green');
        player1.vault.push('green');
        player2.vault.push('green');
        player3.vault.push('green');
        actions.checkIfGameOver(game, meta);
        expect(actions.score(player1)).toBe(7);
        expect(actions.score(player2)).toBe(3);
        expect(actions.score(player3)).toBe(3);
      });
      it('should add actions.merchant bonus points for multiple materials', function() {
        player1.vault.push('green');
        player1.vault.push('blue');
        player1.vault.push('purple');
        player2.vault.push('green');
        player2.vault.push('green');
        player2.vault.push('green');
        player3.vault.push('green');
        player3.vault.push('green');
        player3.vault.push('yellow');
        actions.checkIfGameOver(game, meta);
        expect(actions.score(player1)).toBe(15);
        expect(actions.score(player2)).toBe(8);
        expect(actions.score(player3)).toBe(8);
      });
      it('should work with statue', function() {
        var statue = {name: 'Statue', color: 'purple', done: true, materials: [], selected: false, copy:2, siteColor: 'green'};
        player1.buildings.push(statue);
        player1.vault.push('green');
        player1.vault.push('green');
        player2.vault.push('green');
        player3.vault.push('green');
        actions.checkIfGameOver(game, meta);
        expect(actions.score(player1)).toBe(11);
        expect(actions.score(player2)).toBe(3);
        expect(actions.score(player3)).toBe(3);
      });
      it('should work with wall', function() {
        var wall = {name: 'Wall', color: 'grey', done: true, materials: [], selected: false, copy:2, siteColor: 'grey'};
        player1.buildings.push(wall);
        player1.stockpile.push('green');
        player1.stockpile.push('green');
        player1.stockpile.push('green');
        player1.stockpile.push('green');
        player1.stockpile.push('green');
        player1.vault.push('green');
        player1.vault.push('green');
        player2.vault.push('green');
        player3.vault.push('green');
        actions.checkIfGameOver(game, meta);
        expect(actions.score(player1)).toBe(11);
        expect(actions.score(player2)).toBe(3);
        expect(actions.score(player3)).toBe(3);
      });
    });
  });
});