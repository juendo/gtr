/*
socket.emit('send:message', {
      message: $scope.message
    });
    */

app.controller('gtrController', function($scope, socket, actions) {

  // SOCKET behaviour ------------------------------------------------------------------------------------

  // message received indicating that another player has acted
  socket.on('change', function (data) {
    console.log(data);
    $scope.meta.started = true;
    $scope.game = data.game;
    $scope.meta.leader = data.leader;
    $scope.meta.currentPlayer = data.currentPlayer;
  });

  // when the game is first created
  socket.on('created', function (data) {
    window.history.pushState('page2', 'Title', '/' + data.gameid);
    $scope.meta.room = data.gameid;
  });

  // when you are accepted into an existing game
  socket.on('accepted', function(players) {
    window.history.pushState('page2', 'Title', '/' + $scope.meta.room);
    $scope.game.players = players;
    $scope.meta.you = players.length - 1;
    $scope.meta.created = true;
  });

  // when another player joins your game
  socket.on('joined', function(player) {
    $scope.game.players.push(player);
  });

  // GAME STATE functions ------------------------------------------------------------------------------------

  // when create game button is pressed
  $scope.createGame = function(meta, player) {
    // broadcast to the socket that we want to create a game
    socket.emit('create', meta.name);
    player.name = meta.name;
    meta.created = true;
  };

  // when join game button is pressed
  $scope.joinGame = function(meta) {
    socket.emit('join', {room: meta.room, name: meta.name});
  }

  // when start game is pressed
  $scope.start = function(meta, game) {
    console.log('start');
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
    console.log(game);
    update();
  }

  $scope.$on('draggable:start', function (data) {
    isDragging=true;
  });

  // indicate to other players that there has been a change in game state
  update = function() {
    socket.emit('update', {
      game: $scope.game,
      leader: $scope.meta.leader,
      currentPlayer: $scope.meta.currentPlayer,
      room: $scope.meta.room
    });
  }

  // SCOPE VARIABLES ------------------------------------------------------------------------------------

  isDragging = false;

  // the game state
  $scope.game = {players:[{name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}],pool:{'yellow':0,'green':0,'red':0,'grey':0,'purple':0,'blue':0,'black':6},deck:[],sites:{'yellow':6,'green':6,'red':6,'grey':6,'purple':6,'blue':6}};

  $scope.meta = { started: false, created: false, finished: false, room: "", you: 0, leader: 0, currentPlayer: 0, name: "" };


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
  var cards = [{name: 'Academy', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Amphitheatre', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Aqueduct', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Archway', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Atrium', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Bar', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Bar', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'Basilica', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Bath', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Bridge', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Catacomb', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'CircusMaximus', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Crane', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Crane', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Dock', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Dock', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'DomusAurea', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'ForumRomanum', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Foundry', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Fountain', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Garden', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Gate', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Insula', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Insula', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'Latrine', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Latrine', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'LudusMagnus', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Market', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Market', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Palace', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Palisade', color: 'green', done: false, materials: [], selected: false, copy:1},{name: 'Palisade', color: 'green', done: false, materials: [], selected: false, copy:4},{name: 'Prison', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Road', color: 'yellow', done: false, materials: [], selected: false, copy:1},{name: 'Road', color: 'yellow', done: false, materials: [], selected: false, copy:4},{name: 'School', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Scriptorium', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Sewer', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Shrine', color: 'red', done: false, materials: [], selected: false, copy:1},{name: 'Stairway', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Statue', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Storeroom', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Temple', color: 'purple', done: false, materials: [], selected: false, copy:1},{name: 'Tower', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Tribunal', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Villa', color: 'blue', done: false, materials: [], selected: false, copy:1},{name: 'Vomitorium', color: 'grey', done: false, materials: [], selected: false, copy:1},{name: 'Wall', color: 'grey', done: false, materials: [], selected: false, copy:1}];
  var cards2 = [];
  var cards3 = [];
  cards.forEach(function(card) {
    cards2.push({name:card.name, color:card.color, done:card.done, materials:card.materials, selected:card.selected, copy:card.copy + 1});
    cards3.push({name:card.name, color:card.color, done:card.done, materials:card.materials, selected:card.selected, copy:card.copy + 2});
  }, this);

  // the deck is 3 lots of the above cards, shuffled
  $scope.game.deck = shuffle(cards.concat(cards2).concat(cards3));

  $scope.yourTurn = function() {
    return $scope.meta.currentPlayer == $scope.meta.you;
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
        acted = actions.layFoundation(player, game, meta, data, action);
      }
      if (acted) useAction(player, game, meta);
    }   
  }

  // called when the deck is clicked (and you are the current player)
  $scope.deckClicked = function(player, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      acted = actions.think(player, game);
    }
    else if (action.kind == 'Merchant') {
      acted = actions.merchant(player, {deck: game.deck, meta: meta}, action);
    }
    else if (action.kind == 'Patron') {
      acted = actions.patron(player, null, null, {deck: game.deck, meta: meta}, action);
    }

    if (acted) useAction(player, game, meta);
  }

  $scope.skipAction = function(player, game, meta) {
    useAction(player, game, meta);
  }

  $scope.canSkipCurrentAction = function(player) {
    var action = player.actions[0];
    if (action == undefined) return false;
    switch (action.kind) {
      case 'Jack':
      case 'Lead':
      case 'Follow':
      case 'Think':
        return false;
      case 'Rome Demands':
        var hasMaterial = false;
        player.hand.forEach(function(card) {
          hasMaterial = hasMaterial || action.material == card.color;
        });
        return !hasMaterial || actions.hasAbilityToUse('Palisade', player);
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
  }

  // called when a drag ends over a structure
  $scope.dragEnded = function(player, data, evt, structure, game, meta) {
    console.log(player);

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
        acted = actions.fillStructureFromHand(structure, player, data, meta, game);
      } else {
        player.hand.push(data.card);
      }
    } 
    else if (data.material && action.kind == 'Architect') {
      acted = actions.fillStructureFromStockpile(structure, player, data, meta, game);
    }
    else if (data.color && action.kind == 'Architect') {
      acted = actions.fillStructureFromPool(structure, player, data.color, meta, game);
    }
    if (acted) useAction(player, game, meta);
  }

  // called when a space in the pool is clicked
  $scope.poolClicked = function(player, color, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action == undefined || 
        (game.pool[color] <= 0 && action.kind != 'Lead' && action.kind != 'Follow')) {
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

    if (acted) useAction(player, game, meta);
  }

  // called when a material in your stockpile is clicked
  $scope.stockpileClicked = function(player, data, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && action.kind == 'Merchant') {
      acted = actions.merchant(player, data, action);
    }

    if (acted) useAction(player, game, meta);
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
  }

  $scope.hasStairway = function(player) {
    return actions.hasAbilityToUse('Stairway', player);
  }

  $scope.hasAbilityToUseWithoutPublicBuildings = function(name, player) {
    return actions.hasAbilityToUseWithoutPublicBuildings(name, player);
  }

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

  // META ACTIONS ---------------------------------------------------------------------------------------------------

  // uses action of current player and determines who is to act next
  useAction = function(player, game, meta) {
    // spend action of current player
    var action = player.actions.shift();
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
      var academy = actions.hasAbilityToUse('Academy', player);
      if (academy && academy.used) {
        academy.used = false;
        return;
      }
      return nextToAct(game, meta);
    }

    // if they just used a rome demands action, and the next action is not a rome demands,
    // play goes to next player with an action
    if (action.kind == 'Rome Demands' && newAction.kind != 'Rome Demands') {
      return nextToAct(game, meta);
    }

    // if the player just used a legionary action, and has no more legionary actions,
    // go to next player
    if (action.kind == 'Legionary' && newAction.kind != 'Legionary') {
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
    // unselect the cards
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
      'Prison' : 'FFF'
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
      'blue' : '02AEDE'
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