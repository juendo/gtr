/*
socket.emit('send:message', {
      message: $scope.message
    });
    */

app.controller('gtrController', function($scope, socket, actions) {

  // SOCKET behaviour ------------------------------------------------------------------------------------

  // message received indicating that another player has acted
  socket.on('change', function (data) {
    $scope.meta.started = true;
    $scope.game = data.game;
    $scope.meta.turn = data.turn;
    $scope.meta.leader = data.leader;
    $scope.meta.currentPlayer = data.currentPlayer;
    $scope.meta.finished = data.finished;
  });

  // when the game is first created
  socket.on('created', function (data) {
    $scope.meta.room = data.gameid;
  });

  // when you are accepted into an existing game
  socket.on('accepted', function(players) {
    $scope.game.players = players.map(function(name) {
      return {name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]};
    });
    $scope.meta.you = players.length - 1;
    $scope.meta.created = true;
  });

  // when another player joins your game
  socket.on('joined', function(name) {
    $scope.game.players.push({name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]});
  });

  socket.on('disconnect', function() {
    console.log('disconnect');
  });

  // if reconnecting, request missed data from server
  socket.on('reconnect', function() {
    console.log('reconnect');
    socket.emit('reconnection', {
      game: $scope.game,
      leader: $scope.meta.leader,
      turn: $scope.meta.turn,
      currentPlayer: $scope.meta.currentPlayer,
      room: $scope.meta.room,
      finished: $scope.meta.finished
    });
  });

  // GAME STATE functions ------------------------------------------------------------------------------------

  // when create game button is pressed
  $scope.createGame = function(meta, player) {
    if (meta.name.length > 0 && meta.name.length < 15) {
      // broadcast to the socket that we want to create a game
      socket.emit('create', meta.name);
      player.name = meta.name;
      meta.created = true;
    }
  };

  // when join game button is pressed
  $scope.joinGame = function(meta) {
    socket.emit('join', {room: meta.room, name: meta.name});
  }

  // when start game is pressed
  $scope.start = function(meta, game) {
    if (game.players.length < 2) return;
    meta.started = true;
    for (var i = 0; i < game.players.length; i++) {
      game.pool[game.deck.pop().color]++;
      while (game.players[i].hand.length < 4) {
        game.players[i].hand.push(game.deck.pop());
      }
      game.players[i].hand.push({name: 'Jack', color: 'black'});
      game.pool['black']--;
    }
    meta.leader = Math.floor(Math.random() * (game.players.length));
    meta.currentPlayer = meta.leader;
    game.players[meta.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
    update();
  }

  $scope.triggerReconnect = function() {
    console.log('triggered reconnect');
    socket.emit('reconnection', {
      game: $scope.game,
      leader: $scope.meta.leader,
      turn: $scope.meta.turn,
      currentPlayer: $scope.meta.currentPlayer,
      room: $scope.meta.room,
      finished: $scope.meta.finished
    });
  };

  $scope.$on('draggable:start', function (data) {
    isDragging=true;
  });

  // indicate to other players that there has been a change in game state
  update = function() {






    /////////////////////////////////////////////////////////////////////////
    // have update take input parameters, not just send the scope
    // then send a callback to the server only to update the scope state
    // once the server has received the game state
    // in between it should be pending, and not allow input.
    /////////////////////////////////////////////////////////////////////////





    // reset all glory to rome animation statuses
    $scope.game.players.forEach(function(player) {
      if (!$scope.meta.glory || player != $scope.meta.glory) {
        player.glory1 = false;
        player.glory2 = false;
      }
    });

    // if the player pressed glory to rome
    if ($scope.meta.glory) {
      var player = $scope.meta.glory;
      // trigger glory to rome animation
      if (player.glory1) {
        player.glory1 = false;
        player.glory2 = true;
      } else {
        player.glory1 = true;
        player.glory2 = false;
      }
      $scope.meta.glory = null;
    }
    socket.emit('update', {
      game: $scope.game,
      leader: $scope.meta.leader,
      turn: ++$scope.meta.turn,
      currentPlayer: $scope.meta.currentPlayer,
      room: $scope.meta.room,
      finished: $scope.meta.finished,
    });
  }

  // SCOPE VARIABLES ------------------------------------------------------------------------------------
  isDragging = false;

  // the game state
  $scope.game = {players:[{name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}],pool:{'yellow':0,'green':0,'red':0,'grey':0,'purple':0,'blue':0,'black':6},deck:[],sites:{'yellow':6,'green':6,'red':6,'grey':6,'purple':6,'blue':6}};

  $scope.meta = { turn: 0, started: false, created: false, finished: false, room: "", you: 0, leader: 0, currentPlayer: 0, name: "" , glory: -1};


  // helper to shuffle the deck
  shuffle = function(array) {
    var m = array.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  // the cards in the deck
  var cards = [{name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Amphitheatre', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Aqueduct', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Archway', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Atrium', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Bar', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Bar', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'Basilica', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Bath', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Bridge', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Catacomb', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'CircusMaximus', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Circus', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Circus', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Dock', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Dock', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Colosseum', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Forum', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Foundry', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Fountain', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Garden', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Gate', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Insula', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Insula', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'Latrine', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Latrine', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'LudusMagnus', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Market', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Market', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Palace', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Palisade', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Palisade', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Prison', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Road', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Road', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'School', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Scriptorium', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Sewer', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Stairway', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Statue', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Storeroom', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Temple', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Tower', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Senate', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Villa', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Vomitorium', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Wall', color: 'grey', done: false, materials: [], selected: false, copy:1}];
  var cards2 = [];
  var cards3 = [];
  cards.forEach(function(card) {
    cards2.push({name:card.name, color:card.color, done:card.done, materials:card.materials, selected:card.selected, copy:card.copy + 1});
    cards3.push({name:card.name, color:card.color, done:card.done, materials:card.materials, selected:card.selected, copy:card.copy + 2});
  }, this);

  // the deck is 3 lots of the above cards, shuffled
  $scope.game.deck = shuffle(cards.concat(cards2).concat(cards3));

  $scope.yourTurn = function() {
    return $scope.meta.currentPlayer == $scope.meta.you && !$scope.meta.finished;
  }

  $scope.you = function() {
    return $scope.game.players[$scope.meta.you];
  }

  // USER INPUT FUNCTIONS ------------------------------------------------------------------------------------
  // in general these will check if you have a suitable action to perform, and then attempt to perform that action
  // each action return true or false depending on whether or not it worked
  // then if an action was performed useAction will be called


  // called when a card in your hand is clicked
  $scope.handClicked = function(player, game, meta, data) {

    var action = player.actions[0];
    var acted = false;

    if (isDragging) isDragging = false;

    else {
      if (action == undefined) {
        return;
      } 
      else if (action.kind == 'Rome Demands' && data.card.name != 'Jack') {
        acted = actions.romeDemands(player, game, meta, data, action);
      } 
      else if (action.kind == 'Legionary' && data.card.name != 'Jack') {
        acted = actions.legionary(player, game, meta, data, action);
      } 
      else if (action.kind == 'Lead' || action.kind == 'Follow') {
        acted = actions.selectCard(player, game, meta, data, action);
      }
      else if (action.kind == 'Patron' && data.card.name != 'Jack') {
        acted = actions.patron(player, null, null, data, action);
      }
      else if (action.kind == 'Laborer' && data.card.name != 'Jack') {
        acted = actions.laborer(player, null, null, data, action);
      }
      else if (action.kind == 'Merchant' && data.card.name != 'Jack') {
        acted = actions.merchant(player, data, action);
      }
      else if ((action.kind == 'Craftsman'
              || action.kind == 'Architect')
              && data.card.name != 'Jack') {
        acted = actions.singleSelect(player, game, meta, data, action);
        //acted = actions.layFoundation(player, game, meta, data, action);
      }
      if (acted) useAction(player, game, meta);
      if (actions.checkIfGameOver(game, meta)) update();
    }   
  }

  // called when the deck is clicked (and you are the current player)
  $scope.deckClicked = function(player, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      acted = actions.think(player, game, meta);
    }
    else if (action.kind == 'Merchant') {
      acted = actions.merchant(player, {deck: game.deck, meta: meta}, action);
    }
    else if (action.kind == 'Patron') {
      acted = actions.patron(player, null, null, {deck: game.deck, meta: meta}, action);
    }
    else if (action.kind == 'Craftsman') {
      acted = actions.fountain(player, game.deck, meta, action);
    }

    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.skipAction = function(player, game, meta) {
    if (player.actions[0].kind == 'Rome Demands') {
      meta.glory = player;
    }
    if (player.actions[0]) {
      player.actions[0].skipped = true;
    }
    useAction(player, game, meta);
  }

  $scope.canSkipCurrentAction = function(player, game) {
    var action = player.actions[0];
    if (action == undefined) return false;
    switch (action.kind) {
      case 'Jack':
      case 'Lead':
      case 'Follow':
      case 'Think':
      case 'Statue':
        return false;
      case 'Rome Demands':
        var hasMaterial = false;
        player.hand.forEach(function(card) {
          hasMaterial = hasMaterial || action.material == card.color;
        });
        return !hasMaterial || actions.hasAbilityToUse('Wall', player) || (actions.hasAbilityToUse('Palisade', player) && !actions.hasAbilityToUse('Bridge', game.players[action.demander]));
      default:
        return true;
    }
  }

  $scope.jackClicked = function(player, game, meta) {
    var action = player.actions[0];
    var acted = false;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      acted = actions.takeJack(player, game, meta);
    }

    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  // called when a drag ends over a structure
  $scope.dragEnded = function(player, data, evt, structure, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (isDragging) isDragging = false;

    if (action == undefined || 
        (player.actions[0].kind != 'Craftsman' &&
         player.actions[0].kind != 'Architect')) {
      return;
    }
    if (data.card) {
      if (action.kind == 'Craftsman') {
        acted = actions.fillStructureFromHand(structure, player, data, meta, game, action);
      } else {
        player.hand.push(data.card);
      }
    } 
    else if (data.material && action.kind == 'Architect') {
      acted = actions.fillStructureFromStockpile(structure, player, data, meta, game, action);
    }
    else if (data.color && action.kind == 'Architect') {
      acted = actions.fillStructureFromPool(structure, player, data.color, meta, game, action);
    }
    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  // called when a space in the pool is clicked
  $scope.poolClicked = function(player, color, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action == undefined || 
        (game.pool[color] <= 0 && action.kind != 'Lead' && action.kind != 'Follow' && action.kind != 'Statue' && action.kind != 'Craftsman' && action.kind != 'Architect')) {
      return;
    } 
    else if (action.kind == 'Lead') {
      acted = actions.lead(player, game, meta, {card:{name: '', color: color}}, action);
    }
    else if (action.kind == 'Patron') {
      acted = actions.patron(player, color, game.pool, null, action);
    } 
    else if (action.kind == 'Laborer') {
      acted = actions.laborer(player, color, game.pool, null, action);
    } 
    else if (action.kind == 'Follow') {
      acted = actions.follow(player, game, meta, {card:{name: '', color: color}}, action);
    }
    else if (action.kind == 'Statue') {
      acted = actions.statue(player, color, game, meta, action);
    }
    else if (action.kind == 'Craftsman' || action.kind == 'Architect') {
      acted = actions.prepareToLay(player, color, game, meta, action);
    }

    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  // called when a material in your stockpile is clicked
  $scope.stockpileClicked = function(player, data, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && action.kind == 'Merchant') {
      acted = actions.merchant(player, data, action);
    }

    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.pendingClicked = function(player, data, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && action.kind == 'Sewer') {
      acted = actions.sewer(player, data);
    }

    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.vomitorium = function(player, pool) {
    var action = player.actions[0];
    if (action != undefined 
      && (action.kind == 'Lead' || action.kind == 'Think' || action.kind == 'Follow')) {
      actions.vomitorium(player, pool);
    }
  }

  $scope.prison = function(player, building, opponent, index, game, meta) {
    var action = player.actions[0];
    var acted = false;
    if (action != undefined
      && action.kind == 'Prison') {
      acted = actions.prison(player, building, opponent, index);
    }
    if (acted) useAction(player, game, meta);
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.hasStairway = function(player) {
    return actions.hasAbilityToUse('Stairway', player);
  }

  $scope.hasAbilityToUseWithoutPublicBuildings = function(name, player) {
    return actions.hasAbilityToUseWithoutPublicBuildings(name, player);
  }

  $scope.hasAbilityToUse = function(building, player) {
    return actions.hasAbilityToUse(building, player);
  };

  // remove a dragging card from hand
  $scope.removeFromHand = function(player, data, evt) {
    player.hand.splice(data.index, 1);
  }

  $scope.influence = function(player) {
    return actions.influence(player);
  }

  $scope.hasArchway = function(player) {
    return !!actions.hasAbilityToUse('Archway', player);
  }

  $scope.score = function(player) {
    return actions.score(player);
  };

  $scope.clienteleLimit = function(player) {
    return actions.clienteleLimit(player);
  };

  $scope.vaultLimit = function(player) {
    return actions.vaultLimit(player);
  }

  $scope.relevantAction = function(building, action) {
    switch (building) {
      case 'Archway':
      case 'Stairway':
      return action == 'Architect';
      case 'Aqueduct':
      case 'Bar':
      case 'Bath':
      return action == 'Patron';
      case 'Dock':
      return action == 'Laborer';
      case 'Fountain':
      return action == 'Craftsman';
      case 'Atrium':
      case 'Basilica':
      return action == 'Merchant';
      case 'Bridge':
      case 'Colosseum':
      return action == 'Legionary';
      case 'Wall':
      case 'Palisade':
      return action == 'Rome Demands';
      case 'Palace':
      return action == 'Think' || action == 'Follow';
      case 'Latrine':
      case 'Vomitorium':
      return action == 'Lead' || action == 'Think' || action == 'Follow';
      default:
      return false;
    }
  }

  // META ACTIONS ---------------------------------------------------------------------------------------------------

  // uses action of current player and determines who is to act next
  useAction = function(player, game, meta) {
    
    // spend action of current player
    var action = player.actions.shift();

    // deal with any bath patrons that are waiting
    var act = player.actions[0];
    while (
        act
    &&  act.involvesBath
    &&  act.takenFromPool
    && (act.takenFromHand || !actions.hasAbilityToUse('Aqueduct', player))
    && (act.takenFromDeck || !actions.hasAbilityToUse('Bar', player)))
    {
      player.actions.shift();
      act = player.actions[0];
    }
    var newAction = player.actions[0];

    if (isDragging) isDragging = false;

    // if the player has no actions left, find next player to act
    if (newAction == undefined) {

      // check if you have used an academy
      if (player.usedAcademy) {
        player.usedAcademy = false;
      }
      // check if the player has a sewer
      if (actions.hasAbilityToUse('Sewer', player) && player.pending[0] && !player.usedSewer) {
        player.actions.push({kind:'Sewer', description:'SEWER'});
        player.usedSewer = true
        if (action.kind == 'Legionary') {
          return nextToAct(game, meta);
        } else {
          update();
          return;
        }
      }
      player.usedSewer = false;
      return nextToAct(game, meta);
    }

    // if they just used a rome demands action, and the next action is not a rome demands,
    // play goes to next player with an action
    if (action.kind == 'Rome Demands' && newAction.kind != 'Rome Demands') {
      return nextToAct(game, meta);
    }

    // if the player just used a legionary action, and has no more legionary actions,
    // go to next player
    if (action.kind == 'Legionary' && !action.skipped && newAction.kind != 'Legionary') {
      return nextToAct(game, meta);
    }

    // if they have just led or followed or used the vomitorium, they dont go again
    if (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Jack') {
      return nextToAct(game, meta);
    }

    update();
  }

  // sets the current player to the next player with actions, 
  // or advances to the next turn if there is none
  nextToAct = function(game, meta) {

    $scope.you().hand.forEach(function(card) {
      card.selected = false;
    }, this);

    var current = meta.currentPlayer;
    var players = game.players;
    // for each player after the current player
    for (var i = current + 1; i <= current + players.length; i++) {
      // if that player has an action, it is them to play
      if (players[i % players.length].actions[0] != undefined) {
        meta.currentPlayer = i % players.length;
        update();
        return;
      }
    }

    // move on the leader
    meta.leader = (meta.leader + 1) % players.length;
    meta.currentPlayer = meta.leader;
    players[meta.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});

    // check for senates and pass on jacks
    for (var i = 0; i < game.players.length; i++) {
      for (var j = 0; j < game.players[i].pending.length; j++) {
        if (game.players[i].pending[j].name == 'Jack') {
          for (var k = (i + 1) % game.players.length; k != i; k = (k + 1) % game.players.length) {
            if (actions.hasAbilityToUse('Senate', game.players[k])) {
              var card = game.players[i].pending.splice(j, 1)[0];
              card.selected = false;
              game.players[k].hand.push(card);
              j--;
              break;
            }
          }
        }
      }
    }
    game.players.forEach(function(player) {
      player.pending.forEach(function(card) {
        game.pool[card.color]++; 
      }, this);
      player.pending = [];
    }, this);

    update();
  }

  // EXTRA DETAILS ------------------------------------------------------------------------------------

  $scope.poolColors = 
    [ 'yellow',
      'green',
      'grey',
      'red',
      'purple',
      'blue'
    ]
  $scope.spacing = 20;
  $scope.actionColors = 
    { 'Lead' : 'FFF',
      'Follow' : 'FFF',
      'Jack' : 'FFF',
      'Craftsman' : '2CA73D',
      'Laborer' : 'F7B628',
      'Architect' : '9B9D88',
      'Legionary' : 'E5020C',
      'Patron' : '8E2170',
      'Merchant' : '02AEDE',
      'Rome Demands' : 'FFF',
      'Think' : 'FFF',
      'Prison' : 'FFF',
      'Sewer' : 'FFF',
      'Statue' : 'FFF'
    }
  $scope.actionBorderColors = 
    { 'Lead' : '000',
      'Follow' : '000',
      'Jack' : '000',
      'Craftsman' : '2CA73D',
      'Laborer' : 'F7B628',
      'Architect' : '9B9D88',
      'Legionary' : 'E5020C',
      'Patron' : '8E2170',
      'Merchant' : '02AEDE',
      'Rome Demands' : '000',
      'Think' : '000',
      'Prison' : '000'
    }
  $scope.materials = 
    { 'yellow' : 'rubble',
      'green' : 'wood',
      'grey' : 'concrete',
      'red' : 'brick',
      'purple' : 'marble',
      'blue' : 'stone'
    }
  $scope.colors = 
    { 'yellow' : 'F7B628',
      'green' : '2CA73D',
      'grey' : '9B9D88',
      'red' : 'E5020C',
      'purple' : '8E2170',
      'blue' : '02AEDE',
      'black' : '000'
    }
  $scope.colorValues = 
    { 'yellow' : 1,
      'green' : 1,
      'grey' : 2,
      'red' : 2,
      'purple' : 3,
      'blue' : 3
    }

  $scope.getArray = function(num) {
    return new Array(num);};
})