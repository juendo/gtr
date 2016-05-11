/*
socket.emit('send:message', {
      message: $scope.message
    });
    */

app.controller('gtrController', function($scope, socket) {

  // SOCKET behaviour ------------------------------------------------------------------------------------

  // message received indicating that another player has acted
  socket.on('change', function (data) {
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
    meta.started = true;
    for (var i = 0; i < game.players.length; i++) {
      game.pool[game.deck.pop().color]++;
      while (game.players[i].hand.length < 5) {
        game.players[i].hand.push(game.deck.pop());
      }
    }
    meta.leader = Math.floor(Math.random() * (game.players.length));
    meta.currentPlayer = meta.leader;
    game.players[meta.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
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
  $scope.game = {players:[{name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}],pool:{'yellow':0,'green':0,'red':0,'grey':0,'purple':0,'blue':0},deck:[]};

  $scope.meta = { started: false, created: false, room: "", you: 0, leader: 0, currentPlayer: 0, name: "" };


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
  var cards = [{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'},{name: 'Garden', color: 'blue'},{name: 'Gate', color: 'red'},{name: 'Insula', color: 'yellow'},{name: 'Insula', color: 'yellow'},{name: 'Latrine', color: 'yellow'},{name: 'Latrine', color: 'yellow'},{name: 'LudusMagnus', color: 'purple'},{name: 'Market', color: 'green'},{name: 'Market', color: 'green'},{name: 'Palace', color: 'purple'},{name: 'Palisade', color: 'green'},{name: 'Palisade', color: 'green'},{name: 'Prison', color: 'blue'},{name: 'Road', color: 'yellow'},{name: 'Road', color: 'yellow'},{name: 'School', color: 'red'},{name: 'Scriptorium', color: 'blue'},{name: 'Sewer', color: 'blue'},{name: 'Shrine', color: 'red'},{name: 'Stairway', color: 'purple'},{name: 'Statue', color: 'purple'},{name: 'Storeroom', color: 'grey'},{name: 'Temple', color: 'purple'},{name: 'Tower', color: 'grey'},{name: 'Tribunal', color: 'grey'},{name: 'Villa', color: 'blue'},{name: 'Vomitorium', color: 'grey'},{name: 'Wall', color: 'grey'}];

  // the deck is 3 lots of the above cards, shuffled
  $scope.game.deck = shuffle(cards.concat(cards).concat(cards));

  // USER INPUT FUNCTIONS ------------------------------------------------------------------------------------

  // called when the deck is clicked (and you are the current player)
  $scope.deckClicked = function(player, game, meta) {

    var action = player.actions[0];
    var acted = false;
    if (action != undefined && (action.kind == 'Lead' || action.kind == 'Follow')) {
      acted = think(player, game.deck);
    }
    if (acted) useAction(player, game, meta);
  }

  // called when a card in your hand is clicked
  $scope.handClicked = function(player, game, meta, data) {

    var action = player.actions[0];
    var acted = false;

    if (isDragging) isDragging = false;

    else {
      if (action == undefined) {
        return;
      } else if (action.kind == 'Rome Demands') {
        acted = romeDemands(player, game, meta, data, action);
      } else if (action.kind == 'Legionary') {
        acted = legionary(player, game, meta, data, action);
      } else if (action.kind == 'Lead') {
        acted = lead(player, game, meta, data, action);
      } else if (action.kind == 'Follow') {
        acted = follow(player, game, meta, data, action);
      } else if (action.kind == 'Craftsman'
              || action.kind == 'Architect') {
        acted = layFoundation(player, game, meta, data, action);
      }
      if (acted) useAction(player, game, meta);
    }   
  }

  // called when a drag ends (over a structure or a player box)
  $scope.dragEnded = function(player, data, evt, structure, game, meta) {
    // we need to check if the drag ended over the player box
    // or over a building, and what type of draggable it was

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
        acted = fillStructureFromHand(structure, player, data);
      } else {
        player.hand.push(data.card);
      }
    } else if (data.material && action.kind == 'Architect') {
      acted = fillStructureFromStockpile(structure, player, data);
    }
    if (acted) useAction(player, game, meta);
  }

  // called when a space in the pool is clicked
  $scope.poolClicked = function(player, color, game, meta) {

    var action = player.actions[0];
    var acted = false;
    if (action == undefined || game.pool[color] <= 0) {
      return;
    } else if (action.kind == 'Patron') {
      acted = patron(player, color, game.pool);
    } else if (action.kind == 'Laborer') {
      acted = laborer(player, color, game.pool);
    } 
    if (acted) useAction(player, game, meta);
  }

  // called when a material in your stockpile is clicked
  $scope.stockpileClicked = function(player, data, game, meta) {
    var action = player.actions[0];
    var acted = false;
    if (action != undefined && action.kind == 'Merchant') {
      acted = merchant(player, data);
    }
    if (acted) useAction(player, game, meta);
  }

  // remove a dragging card from hand
  $scope.removeFromHand = function(player, data, evt) {
    player.hand.splice(data.index, 1);
  }


  // GAME ACTIONS -------------------------------------------------------------------------------------------------------

  // when clicking a card in hand in response to a rome demands
  romeDemands = function(player, game, meta, data, action) {
    if (data.card.color == action.material) {
      player.hand.splice(data.index, 1);
      game.players[action.demander].stockpile.push(data.card.color);
      return true;
    } else {
      return false;
    }
  }

  // when clicking a card in hand while you have a legionary action
  legionary = function(player, game, meta, data, action) {
    var color = data.card.color;
    if (game.pool[color] > 0) {
      game.pool[color]--;
      player.stockpile.push(color);
    }
    for (var i = 0; i < game.players.length; i++) {
      if (i != meta.currentPlayer) {
        game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + $scope.materials[color].toUpperCase(), demander: meta.currentPlayer, material: color})
      }
    }
    return true;
  }

  // when clicking a card in hand and you are to lead
  lead = function(player, game, meta, data, action) {
    var color = data.card.color;
    player.hand.splice(data.index, 1);
    player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
    addClientActions(player, color);
    player.pending.push(color);
    for (var i = 0; i < game.players.length; i++) {
      if (i != meta.currentPlayer) {
        game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: color})
        addClientActions(game.players[i], color);
      }
    }
    return true;
  }

  // when clicking a card in hand and you are to follow
  follow = function(player, game, meta, data, action) {
    var color = data.card.color;
    if (action.material == color) {
      player.hand.splice(data.index, 1);
      player.actions.push({kind: roles[color], description: roles[color].toUpperCase()});
      player.pending.push(color);
      return true;
    } else {
      return false;
    }
  }

  layFoundation = function(player, game, meta, data, action) {
    player.buildings.push(data.card);
    player.hand.splice(data.index, 1);
    return true;
  }

  think = function(player, deck) {
    player.hand.push(deck.pop());
    while (player.hand.length < 5) {
      player.hand.push(deck.pop());
    }
    return true;
  }

  patron = function(player, color, pool) {
    player.clientele.push(roles[color]);
    pool[color]--;
    return true;
  }

  laborer = function(player, color, pool) {
    player.stockpile.push(color);
    pool[color]--;
    return true;
  }

  fillStructureFromHand = function(structure, player, data) {
    structure.materials.push(data.card.color);
    player.hand.splice(data.index, 1);
    return true;
  }

  fillStructureFromStockpile = function(structure, player, data) {
    structure.materials.push(data.material);
    player.stockpile.splice(data.index, 1);
    return true;
  }

  merchant = function(player, data) {
    player.vault.push(data.material);
    player.stockpile.splice(data.index, 1);
    return true;
  }

  // adds actions for clients
  addClientActions = function(player, color) {
    player.clientele.forEach(function(client) {
      if (roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      }
    }, this);
  }

  // META ACTIONS ---------------------------------------------------------------------------------------------------

  // uses action of current player and determines who is to act next
  useAction = function(player, game, meta) {
    // spend action of current player
    var action = player.actions[0];
    player.actions.shift();
    var newAction = player.actions[0];

    if (isDragging) isDragging = false;

    // if the player has no actions left, find next player to act
    if (newAction == undefined) {
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

    // if they have just led or followed, they dont go again
    if (action.kind == 'Lead' || action.kind == 'Follow') {
      return nextToAct(game, meta);
    }

    update();
  }

  // sets the current player to the next player with actions, 
  // or advances to the next turn if there is none
  nextToAct = function(game, meta) {
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

    meta.leader = (meta.leader + 1) % players.length;
    meta.currentPlayer = meta.leader;
    players[meta.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
    game.players.forEach(function(player) {
      player.pending.forEach(function(material) {
        game.pool[material]++; 
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
    { 'Lead' : '000',
      'Follow' : '000',
      'Craftsman' : '2CA73D',
      'Laborer' : 'F7B628',
      'Architect' : '9B9D88',
      'Legionary' : 'E5020C',
      'Patron' : '8E2170',
      'Merchant' : '02AEDE',
      'Rome Demands' : '000'
    }
  $scope.materials = 
    { 'yellow' : 'rubble',
      'green' : 'wood',
      'grey' : 'concrete',
      'red' : 'brick',
      'purple' : 'marble',
      'blue' : 'stone'
    }
  roles = 
    { 'yellow' : 'Laborer',
      'green' : 'Craftsman',
      'grey' : 'Architect',
      'red' : 'Legionary',
      'purple' : 'Patron',
      'blue' : 'Merchant'
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