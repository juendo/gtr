/*
socket.emit('send:message', {
      message: $scope.message
    });
    */



    // make it only accept input if it is YOUR turn
app.controller('gtrController', function($scope, socket) {

  socket.on('change', function (data) {
    $scope.game = data.game;
    $scope.leader = data.leader;
    $scope.currentPlayer = data.currentPlayer;
  });

  socket.on('created', function (data) {
    window.history.pushState('page2', 'Title', '/' + data.gameid);
    $scope.room = data.gameid;
  });

  socket.on('accepted', function(players) {
    window.history.pushState('page2', 'Title', '/' + $scope.room);
    $scope.game.players = players;
    $scope.you = players.length - 1;
    $scope.created = true;
  });

  socket.on('joined', function(player) {
    $scope.game.players.push(player);
  });

  $scope.createGame = function() {
    // broadcast to the socket that we want to create a game
    socket.emit('create', $('#create-name').val());
    $scope.created = true;
    $scope.game.players[0].name = $('#create-name').val();
  };

  $scope.joinGame = function() {
    $scope.room = $('#access-code').val();
    socket.emit('join', {room: $('#access-code').val(), name: $('#join-name').val()});
  }
  $scope.you = 0;
  $scope.room = "";
  $scope.game = {players:[{name:"",buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]}],pool:{'yellow':0,'green':0,'red':0,'grey':0,'purple':0,'blue':0},deck:[]};
  $scope.leader = 0;
  $scope.currentPlayer = 0;
  $scope.started = false;
  $scope.created = false;

  $scope.start = function() {
    $scope.started = true;
  }

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
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    var action = $scope.game.players[$scope.you].actions[0];
    if (action != undefined && action.kind == 'Merchant') {
      $scope.game.players[$scope.you].vault.push(data.material);
      $scope.game.players[$scope.you].stockpile.splice(data.index, 1);
      useAction();
    }
  }

  $scope.think = function() {

    console.log($scope.you);
    console.log($scope.currentPlayer);
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    console.log('here');
    var action = $scope.game.players[$scope.you].actions[0];
    console.log(action);
    if (action != undefined && (action.kind == 'Lead' || action.kind == 'Follow')) {
      $scope.game.players[$scope.you].hand.push($scope.game.deck.pop());
      while ($scope.game.players[$scope.you].hand.length < 5) {
        $scope.game.players[$scope.you].hand.push($scope.game.deck.pop());
      }
    }
    console.log('going to yse actio');
    useAction();
  }

  $scope.handClicked = function(data) {
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    var action = $scope.game.players[$scope.you].actions[0];
    if (action == undefined) {
      return
    } else if (action.kind == 'Rome Demands') {
      romeDemands(data,$scope.game.players[$scope.you], action);
    } else if (action.kind == 'Legionary') {
      legionary(data,$scope.game.players[$scope.you], action);
    } else if (action.kind == 'Lead') {
      lead(data,$scope.game.players[$scope.you], action);
    } else if (action.kind == 'Follow') {
      follow(data,$scope.game.players[$scope.you], action);
    }
  }

  $scope.takeFromPool = function(color) {
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    var action = $scope.game.players[$scope.you].actions[0];
    console.log('pool');
    if (action == undefined || $scope.game.pool[color] <= 0) {
      return;
    } else if (action.kind == 'Patron') {
      $scope.game.players[$scope.you].clientele.push($scope.roles[color]);
    } else if (action.kind == 'Laborer') {
      $scope.game.players[$scope.you].stockpile.push(color);
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
      currentPlayer: $scope.currentPlayer,
      room: $scope.room
    });
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
  useAction = function() {
    // spend action of current player
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    var action = $scope.game.players[$scope.you].actions[0];
    console.log($scope.game.players[$scope.you].actions);
    $scope.game.players[$scope.you].actions.shift();
    console.log($scope.game.players[$scope.you].actions);
    var newAction = $scope.game.players[$scope.you].actions[0];

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

    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    var action = $scope.game.players[$scope.you].actions[0];

    // if the player has no appropriate actions it does not matter what they have tried to do
    if (action == undefined || 
        ($scope.game.players[$scope.you].actions[0].kind != 'Craftsman' &&
         $scope.game.players[$scope.you].actions[0].kind != 'Architect')) {
      data.card ? $scope.game.players[$scope.you].hand.push(data.card) : $scope.game.players[$scope.you].stockpile.push(data.material);
      return;
    }

    // first, we consider the case when the drag is not over a building
    if (!document.elementFromPoint(evt.x, evt.y).classList.contains('building')) {
      // if the draggable was a card
      if (data.card) {
        $scope.game.players[$scope.you].buildings.push(data.card);
        useAction();
      }
      // if it was a material, return it to the stockpile
      else if (data.material) {
        $scope.game.players[$scope.you].stockpile.push(data.material);
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
          $scope.game.players[$scope.you].hand.push(data.card);
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
          // otherwise return to stockpile
          data.stockpile.push(data.material);
        }
      }
    }
  }

  $scope.removeFromHand = function(data, evt) {
    console.log('removeFromHand');
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    $scope.game.players[$scope.you].hand.splice(data.index, 1);
  }

  $scope.removeFromStockpile = function(data, evt) {
    console.log('removeFromStockpile');
    if ($scope.currentPlayer != $scope.you) {
      return;
    }
    $scope.game.players[$scope.you].stockpile.splice(data.index, 1);
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