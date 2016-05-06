/*
socket.emit('send:message', {
      message: $scope.message
    });
    */
app.controller('gtrController', function($scope, socket) {

  socket.on('change', function (data) {
    console.log('change');
    $scope.game = data.game;
    $scope.leader = data.leader;
    $scope.currentPlayer = data.currentPlayer;
  });

  socket.on('addPlayer', function (data) {
    console.log('addPlauer');
    $scope.game.players.push(data.player);
    update();
  });


  $scope.leader = 0;
  $scope.currentPlayer = 0;
  $scope.game = 
    { players: 
      [
        { buildings: [],
          hand: [],
          stockpile: [],
          clientele: [],
          vault: [],
          actions: [{kind:'Lead', description:'LEAD or THINK'}],
          pending: []
        }
      ],
      pool: {'yellow':1,'green':0,'red':5,'grey':0,'purple':0,'blue':0},
      deck: []
    };

  shuffle = function(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

  $scope.game.deck = shuffle([{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'},{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'},{name: 'Academy', color: 'red'},{name: 'Amphitheatre', color: 'grey'},{name: 'Aqueduct', color: 'grey'},{name: 'Archway', color: 'red'},{name: 'Atrium', color: 'red'},{name: 'Bar', color: 'yellow'},{name: 'Basilica', color: 'purple'},{name: 'Bath', color: 'red'},{name: 'Bridge', color: 'grey'},{name: 'Catacomb', color: 'blue'},{name: 'CircusMaximus', color: 'blue'},{name: 'Crane', color: 'green'},{name: 'Dock', color: 'green'},{name: 'DomusAurea', color: 'blue'},{name: 'ForumRomanum', color: 'purple'},{name: 'Foundry', color: 'red'},{name: 'Fountain', color: 'purple'}]);

  romeDemands = function(data, player, action) {
    if (data.card.color == action.material) {
      player.hand.splice(data.index, 1);
      $scope.game.players[action.demander].stockpile.push(data.card.color);
      useAction();
    }
  }

  legionary = function(data, player, action) {
    if ($scope.game.pool[data.card.color] > 0) {
      $scope.game.pool[data.card.color]--;
      $scope.game.players[$scope.currentPlayer].stockpile.push(data.card.color);
    }
    for (var i = 0; i < $scope.game.players.length; i++) {
      console.log('searching player');
      if (i != $scope.currentPlayer) {
        $scope.game.players[i].actions.splice(0, 0, {kind:'Rome Demands', description:'ROME DEMANDS ' + $scope.materials[data.card.color].toUpperCase(), demander: $scope.currentPlayer, material: data.card.color})
      }
    }
    useAction();
  }

  lead = function(data, player, action) {
    player.hand.splice(data.index, 1);
    player.actions.push({kind: $scope.roles[data.card.color], description: $scope.roles[data.card.color].toUpperCase()});
    addClientActions(player, data.card.color);
    player.pending.push(data.card.color);
    for (var i = 0; i < $scope.game.players.length; i++) {
      if (i != $scope.currentPlayer) {
        $scope.game.players[i].actions.push({kind:'Follow', description:'THINK or FOLLOW', color: data.card.color})
        addClientActions($scope.game.players[i], data.card.color);
      }
    }
    useAction();
  }

  addClientActions = function(player, color) {
    player.clientele.forEach(function(client) {
      if ($scope.roles[color] == client) {
        player.actions.push({kind: client, description: client.toUpperCase()});
      }
    }, this);
  }

  follow = function(data, player, action) {
    if (action.color == data.card.color) {
      player.hand.splice(data.index, 1);
      player.actions.push({kind: $scope.roles[data.card.color], description: $scope.roles[data.card.color].toUpperCase()});
      player.pending.push(data.card.color);
      useAction();
    } 
  }

  $scope.merchant = function(data) {
    var player = $scope.game.players[$scope.currentPlayer];
    var action = player.actions[0];
    if (action != undefined && action.kind == 'Merchant') {
      player.vault.push(data.material);
      player.stockpile.splice(data.index, 1);
      useAction();
    }
  }

  $scope.think = function() {
    var player = $scope.game.players[$scope.currentPlayer];
    var action = player.actions[0];
    if (action != undefined && (action.kind == 'Lead' || action.kind == 'Follow')) {
      player.hand.push($scope.game.deck.pop());
      while (player.hand.length < 5) {
        player.hand.push($scope.game.deck.pop());
      }
    }
    useAction();
  }

  $scope.handClicked = function(data) {
    console.log('hand clicked');
    var player = $scope.game.players[$scope.currentPlayer];
    var action = player.actions[0];
    if (action == undefined) {
      return
    } else if (action.kind == 'Rome Demands') {
      romeDemands(data, player, action);
    } else if (action.kind == 'Legionary') {
      legionary(data, player, action);
    } else if (action.kind == 'Lead') {
      lead(data, player, action);
    } else if (action.kind == 'Follow') {
      follow(data, player, action);
    }
  }

  $scope.takeFromPool = function(color) {
    var player = $scope.game.players[$scope.currentPlayer];
    var action = player.actions[0];
    console.log('pool');
    if (action == undefined || $scope.game.pool[color] <= 0) {
      return;
    } else if (action.kind == 'Patron') {
      player.clientele.push($scope.roles[color]);
    } else if (action.kind == 'Laborer') {
      player.stockpile.push(color);
    } else {
      return;
    }
    $scope.game.pool[color]--;
    useAction();
  }

  update = function() {
    socket.emit('update', {
      game: $scope.game,
      leader: $scope.leader,
      currentPlayer: $scope.currentPlayer
    });
  }

  // sets the current player to the next player with actions, 
  // or advances to the next turn if there is none
  nextToAct = function() {
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
  useAction = function() {
    // spend action of current player
    var player = $scope.game.players[$scope.currentPlayer];
    var action = player.actions[0];
    player.actions.shift();
    var newAction = player.actions[0];

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

  // called when a drag ends
  $scope.dragEnded = function(data, evt, structure) {
    // we need to check if the drag ended over the player box
    // or over a building, and what type of draggable it was

    var player = $scope.game.players[$scope.currentPlayer];
    var action = player.actions[0];

    // if the player has no appropriate actions it does not matter what they have tried to do
    if (action == undefined || 
        (player.actions[0].kind != 'Craftsman' &&
         player.actions[0].kind != 'Architect')) {
      data.card ? player.hand.push(data.card) : player.stockpile.push(data.material);
      return;
    }

    // first, we consider the case when the drag is not over a building
    if (!document.elementFromPoint(evt.x, evt.y).classList.contains('building')) {
      // if the draggable was a card
      if (data.card) {
        player.buildings.push(data.card);
        useAction();
      }
      // if it was a material, return it to the stockpile
      else if (data.material) {
        player.stockpile.push(data.material);
      }
    } 
    // if the drag ended over a building
    else {
      // if it was a card
      if (data.card) {
        // if they have a craftsman action fill structure
        if (action.kind == 'Craftsman') {
          structure.materials.push(data.card.color);
          useAction();
        } 
        // otherwise return it to hand
        else {
          player.hand.push(data.card);
        }
      }
      // if it was a material 
      else if (data.material) {
        // and they have an architect action
        if (action.kind == 'Architect') {
          // add material to structure
          structure.materials.push(data.material);
          useAction();
        } else {
          // otherwise return to hand
          data.stockpile.push(data.material);
        }
      }
    }
  }

  $scope.removeFromHand = function(data, evt) {
    console.log('removeFromHand');
    $scope.game.players[$scope.currentPlayer].hand.splice(data.index, 1);
  }

  $scope.removeFromStockpile = function(data, evt) {
    console.log('removeFromStockpile');
    $scope.game.players[$scope.currentPlayer].stockpile.splice(data.index, 1);
  }

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
  $scope.roles = 
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