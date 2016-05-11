/*
socket.emit('send:message', {
      message: $scope.message
    });
    */

app.controller('gtrController', function($scope, socket) {

  // SOCKET behaviour ------------------------------------------------------------------------------------

  // message received indicating that another player has acted
  socket.on('change', function (data) {
    $scope.game = data.game;
    $scope.leader = data.leader;
    $scope.currentPlayer = data.currentPlayer;
  });

  // when the game is first created
  socket.on('created', function (data) {
    window.history.pushState('page2', 'Title', '/' + data.gameid);
    $scope.room = data.gameid;
  });

  // when you are accepted into an existing game
  socket.on('accepted', function(players) {
    window.history.pushState('page2', 'Title', '/' + $scope.room);
    $scope.game.players = players;
    $scope.you = players.length - 1;
    $scope.created = true;
  });

  // when another player joins your game
  socket.on('joined', function(player) {
    $scope.game.players.push(player);
  });

  // GAME STATE functions ------------------------------------------------------------------------------------

  // when create game button is pressed
  $scope.createGame = function() {
    // broadcast to the socket that we want to create a game
    socket.emit('create', $('#create-name').val());
    $scope.created = true;
    $scope.game.players[0].name = $('#create-name').val();
  };

  // when join game button is pressed
  $scope.joinGame = function() {
    $scope.room = $('#access-code').val();
    socket.emit('join', {room: $('#access-code').val(), name: $('#join-name').val()});
  }

  // when start game is pressed
  $scope.start = function() {
    $scope.started = true;
  }

  $scope.$on('draggable:start', function (data) {
    isDragging=true;
  });

  // indicate to other players that there has been a change in game state
  update = function() {
    socket.emit('update', {
      game: $scope.game,
      leader: $scope.leader,
      currentPlayer: $scope.currentPlayer,
      room: $scope.room
    });
  }

  // SCOPE VARIABLES ------------------------------------------------------------------------------------

  isDragging = false;

  // index of you in game.players
  $scope.you = 0;

  // the socket io room representing the game
  $scope.room = "";

  // the game state
  $scope.game = {players:[{name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}],pool:{'yellow':0,'green':0,'red':0,'grey':0,'purple':0,'blue':0},deck:[]};
  
  // the player who went first this turn
  $scope.leader = 0;

  // the current player to act
  $scope.currentPlayer = 0;

  // whether the game has started
  $scope.started = false;

  // whether a game has been created
  $scope.created = false;

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

  // SCOPE GAMEPLAY FUNCTIONS ------------------------------------------------------------------------------------

  // called when the deck is clicked (and you are the current player)
  $scope.think = function(player, deck) {

    var action = player.actions[0];
    if (action != undefined && (action.kind == 'Lead' || action.kind == 'Follow')) {
      player.hand.push(deck.pop());
      while (player.hand.length < 5) {
        player.hand.push(deck.pop());
      }
    }
    useAction(player);
  }

  // called when a card in your hand is clicked
  $scope.handClicked = function(player, data) {

    if (isDragging) isDragging = false;
    else {
      var action = player.actions[0];
      if (action == undefined) {
        return;
      } else if (action.kind == 'Rome Demands') {
        romeDemands(data, player, action);
      } else if (action.kind == 'Legionary') {
        legionary(data, player, action);
      } else if (action.kind == 'Lead') {
        lead(data, player, action);
      } else if (action.kind == 'Follow') {
        follow(data, player, action);
      } else if (action.kind == 'Craftsman'
              || action.kind == 'Architect') {
        layFoundation(data, player, action);
      }
    }   
  }

  // called when a space in the pool is clicked
  $scope.takeFromPool = function(player, pool, color) {

    var action = player.actions[0];
    if (action == undefined || pool[color] <= 0) {
      return;
    } else if (action.kind == 'Patron') {
      player.clientele.push(roles[color]);
    } else if (action.kind == 'Laborer') {
      player.stockpile.push(color);
    } else {
      return;
    }
    pool[color]--;
    useAction(player);
  }

  // called when a material in your stockpile is clicked
  $scope.merchant = function(player, data) {
    var action = player.actions[0];
    if (action != undefined && action.kind == 'Merchant') {
      player.vault.push(data.material);
      player.stockpile.splice(data.index, 1);
      useAction(player);
    }
  }

  // called when a drag ends (over a structure or a player box)
  $scope.dragEnded = function(player, data, evt, structure) {
    // we need to check if the drag ended over the player box
    // or over a building, and what type of draggable it was

    var action = player.actions[0];

    if (isDragging) isDragging = false;
    console.log('drag ended');

    // if the player has no appropriate actions it does not matter what they have tried to do
    if (action == undefined || 
        (player.actions[0].kind != 'Craftsman' &&
         player.actions[0].kind != 'Architect')) {
      return;
    }

    // if it was a card
    if (data.card) {
      // if they have a craftsman action fill structure
      if (action.kind == 'Craftsman') {
        structure.materials.push(data.card.color);
        player.hand.splice(data.index, 1);
        useAction(player);
      } 
      // otherwise return it to hand
      else {
        player.hand.push(data.card);
      }
    }
    // if it was a material and they have an architect
    else if (data.material && action.kind == 'Architect') {
      structure.materials.push(data.material);
      player.stockpile.splice(data.index, 1);
      useAction(player);
    }
  }

  // remove a dragging card from hand
  $scope.removeFromHand = function(player, data, evt) {
    console.log('removing from hand');
    console.log(data);
    player.hand.splice(data.index, 1);
  }


  // PRIVATE GAMEPLAY HELPERS ------------------------------------------------------------------------------------

  // when clicking a card in hand in response to a rome demands
  romeDemands = function(data, player, action) {
    if (data.card.color == action.material) {
      player.hand.splice(data.index, 1);
      $scope.game.players[action.demander].stockpile.push(data.card.color);
      useAction(player);
    }
  }

  // when clicking a card in hand while you have a legionary action
  legionary = function(data, player, action) {
    if ($scope.game.pool[data.card.color] > 0) {
      $scope.game.pool[data.card.color]--;
      player.stockpile.push(data.card.color);
    }
    for (var i = 0; i < $scope.game.players.length; i++) {
      console.log('searching player');
      if (i != $scope.currentPlayer) {
        $scope.game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + $scope.materials[data.card.color].toUpperCase(), demander: $scope.currentPlayer, material: data.card.color})
      }
    }
    useAction(player);
  }

  // when clicking a card in hand and you are to lead
  lead = function(data, player, action) {
    player.hand.splice(data.index, 1);
    player.actions.push({kind: roles[data.card.color], description: roles[data.card.color].toUpperCase()});
    addClientActions(player, data.card.color);
    player.pending.push(data.card.color);
    for (var i = 0; i < $scope.game.players.length; i++) {
      if (i != $scope.currentPlayer) {
        $scope.game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: data.card.color})
        addClientActions($scope.game.players[i], data.card.color);
      }
    }
    useAction(player);
  }

  // adds actions for clients
  addClientActions = function(player, color) {
    player.clientele.forEach(function(client) {
      if (roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      }
    }, this);
  }

  // when clicking a card in hand and you are to follow
  follow = function(data, player, action) {
    if (action.color == data.card.color) {
      player.hand.splice(data.index, 1);
      player.actions.push({kind: roles[data.card.color], description: roles[data.card.color].toUpperCase()});
      player.pending.push(data.card.color);
      useAction(player);
    } 
  }

  layFoundation = function(data, player, action) {
    console.log('craftsman');
    player.buildings.push(data.card);
    player.hand.splice(data.index, 1);
    useAction(player);
  }

  // sets the current player to the next player with actions, 
  // or advances to the next turn if there is none
  nextToAct = function() {
    console.log('calculating next to act');
    var cp = $scope.currentPlayer;
    var ps = $scope.game.players;
    // for each player after the current player
    for (var i = cp + 1; i <= cp + ps.length; i++) {
      // if that player has an action, it is them to play
      if (ps[i % ps.length].actions[0] != undefined) {
        $scope.currentPlayer = i % ps.length;
        update();
        return;
      }
    }
    console.log('at this points');
    // if nobody has an action, move leader on and start new turn
    $scope.leader = ($scope.leader + 1) % ps.length;
    $scope.currentPlayer = $scope.leader;
    ps[$scope.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
    $scope.game.players.forEach(function(player) {
      player.pending.forEach(function(material) {
        $scope.game.pool[material]++; 
      }, this);
      player.pending = [];
    }, this);

    update();
  }

  // uses action of current player and determines who is to act next
  useAction = function(player) {
    // spend action of current player
    var action = player.actions[0];
    player.actions.shift();
    var newAction = player.actions[0];

    if (isDragging) isDragging = false;

    // if the player has no actions left, find next player to act
    if (newAction == undefined) {
      return nextToAct();
    }

    // if they just used a rome demands action, and the next action is not a rome demands,
    // play goes to next player with an action
    if (action.kind == 'Rome Demands' && newAction.kind != 'Rome Demands') {
      return nextToAct();
    }

    // if the player just used a legionary action, and has no more legionary actions,
    // go to next player
    if (action.kind == 'Legionary' && newAction.kind != 'Legionary') {
      return nextToAct();
    }

    // if they have just led or followed, they dont go again
    if (action.kind == 'Lead' || action.kind == 'Follow') {
      return nextToAct();
    }

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