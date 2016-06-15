app.controller('gtrController', function($scope, socket, actions) {

  // SCOPE VARIABLES ------------------------------------------------------------------------------------

  // the game state (starts with just one player)
  $scope.game = 
    {
      players:
        [
          {
            name: "",
            buildings: [],
            hand: [],
            stockpile: [],
            clientele: [],
            vault: [],
            // a list of the actions the player has yet to use this turn
            actions: [],
            // the cards the player used to lead or follow
            pending: []
          }
        ],
      pool:
        {
          'yellow': 0,
          'green': 0,
          'red': 0,
          'grey': 0,
          'purple': 0,
          'blue': 0,
          // the number of jacks available
          'black': 6
        },
      deck: actions.createDeck(),
      sites: 
        {
          'yellow': 6,
          'green': 6,
          'red': 6,
          'grey': 6,
          'purple': 6,
          'blue': 6
        }
    };

  // extra information about the game
  $scope.meta = 
    { 
      // tracks the number of updates to the game state that have been sent
      turn: 0,
      started: false,
      created: false,
      finished: false,
      // the access-code/socket-io-room for the game
      room: "",
      // the index of you in the list of players
      you: 0,
      leader: 0,
      currentPlayer: 0, 
      name: "",
      // the index of any player that has said "glory to rome" this turn, if any
      glory: -1
    };

  // audio files
  var ding = new Audio('/audio/bell.m4a');
  var no = new Audio('/audio/no.wav');

  var isDragging = false;

  // USER INPUT FUNCTIONS ------------------------------------------------------------------------------------
  // in general these will check if you have a suitable action to perform, and then attempt to perform that action
  // each action return true or false depending on whether or not it worked
  // then if an action was performed actions.useAction will be called


  // called when a card in your hand is clicked
  $scope.handClicked = function(player, game, meta, data) {

    var action = player.actions[0];
    var acted = false;

    if (isDragging) isDragging = false;

    else {
      if (
          action == undefined) 
      {
        return;
      } 
      else if (
          action.kind == 'Rome Demands' 
      &&  data.card.name != 'Jack') 
      {
        acted = actions.romeDemands(player, game, meta, data, action);
      } 
      else if (
          action.kind == 'Legionary' 
      &&  data.card.name != 'Jack') 
      {
        acted = actions.legionary(player, game, meta, data, action);
      } 
      else if (
          action.kind == 'Lead' 
      ||  action.kind == 'Follow') 
      {
        acted = actions.selectCard(player, game, meta, data, action);
      }
      else if (
          action.kind == 'Patron' 
      &&  data.card.name != 'Jack') 
      {
        acted = actions.patron(player, null, null, data, action);
      }
      else if (
          action.kind == 'Laborer' 
      &&  data.card.name != 'Jack') 
      {
        acted = actions.laborer(player, null, null, data, action);
      }
      else if (
          action.kind == 'Merchant' 
      &&  data.card.name != 'Jack') 
      {
        acted = actions.merchant(player, data, action);
      }
      else if (
         (    action.kind == 'Craftsman'
          ||  action.kind == 'Architect')
        &&  data.card.name != 'Jack') {
        acted = actions.singleSelect(player, game, meta, data, action);
      }
      if (acted) {
        actions.useAction(player, game, meta);
        update();
      }
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

    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.drawOne = function(player, game, meta) {
    var action = player.actions[0];
    var acted = false;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      acted = actions.drawOne(player, game, meta);
    }

    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.skipAction = function(player, game, meta) {
    if (player.actions[0].kind == 'Rome Demands') {
      meta.glory = player;
    } else if (player.actions[0].kind == 'Craftsman') {
      // deselect all cards in players hand following a craftsman for fountain
      player.hand.forEach(function(card) {
        card.selected = false;
      }, this);
    }
    actions.useAction(player, game, meta);
    update();
  }

  $scope.jackClicked = function(player, game, meta) {
    var action = player.actions[0];
    var acted = false;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      acted = actions.takeJack(player, game, meta);
    }

    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
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
    if (data.card && action.kind == 'Craftsman') {
      acted = actions.fillStructureFromHand(structure, player, data, meta, game, action);
    } 
    else if (data.material && action.kind == 'Architect') {
      acted = actions.fillStructureFromStockpile(structure, player, data, meta, game, action);
    }
    else if (data.color && action.kind == 'Architect') {
      acted = actions.fillStructureFromPool(structure, player, data.color, meta, game, action);
    }
    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
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

    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
    if (actions.checkIfGameOver(game, meta)) update();
  }

  // called when a material in your stockpile is clicked
  $scope.stockpileClicked = function(player, data, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && action.kind == 'Merchant') {
      acted = actions.merchant(player, data, action);
    }

    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
    if (actions.checkIfGameOver(game, meta)) update();
  }

  $scope.pendingClicked = function(player, data, game, meta) {

    var action = player.actions[0];
    var acted = false;

    if (action != undefined && action.kind == 'Sewer') {
      acted = actions.sewer(player, data);
    }

    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
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
    if (acted) {
      actions.useAction(player, game, meta);
      update();
    }
    if (actions.checkIfGameOver(game, meta)) update();
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
      return action.kind == 'Architect';
      case 'Stairway':
      return action.kind == 'Architect' && !action.usedStairway;
      case 'Aqueduct':
      return action.kind == 'Patron' && !action.takenFromHand;
      case 'Bar':
      return action.kind == 'Patron' && !action.takenFromDeck;
      case 'Bath':
      return action.kind == 'Patron';
      case 'Dock':
      return action.kind == 'Laborer' && !action.takenFromHand;
      case 'Fountain':
      return action.kind == 'Craftsman';
      case 'Atrium':
      return action.kind == 'Merchant' && !action.takenFromDeck;
      case 'Basilica':
      return action.kind == 'Merchant' && !action.takenFromHand;
      case 'Bridge':
      case 'Colosseum':
      return action.kind == 'Legionary';
      case 'Wall':
      case 'Palisade':
      return action.kind == 'Rome Demands';
      case 'Palace':
      return action.kind == 'Think' || action.kind == 'Follow';
      case 'Latrine':
      case 'Vomitorium':
      return action.kind == 'Lead' || action.kind == 'Think' || action.kind == 'Follow';
      default:
      return false;
    }
  }

  $scope.yourTurn = function() {
    return $scope.meta.currentPlayer == $scope.meta.you && !$scope.meta.finished;
  }

  $scope.you = function() {
    return $scope.game.players[$scope.meta.you];
  }

  $scope.buildingWidth = function(len) {
    var ratio = 1;
    // the width of a player box
    var width = 95 / ratio;
    var height = $(window).height() * 0.68 * 0.92;

    while (0.01 * (292/208) * $(window).width() * width * Math.ceil(len / ratio) / $scope.game.players.length + 10 * Math.ceil(len / ratio) > height) {
      width = 95 / ++ratio;
    }
    return width;
  }

  applyMove = function(data) {
    console.log(data);
    var player = data.game.players[data.currentPlayer];
    var acted = false;
    switch (data.move.kind) {

      case 'Refill':
        acted = actions.think(player, data.game, $scope.meta);
        break;

      case 'Lead':
        for (var i = 0; i < data.move.cards.length; i++) {
          player.hand[data.move.cards[i]].selected = true;
        }
        acted = actions.lead(player, data.game, $scope.meta, {card:{name: '', color: data.move.role}}, player.actions[0]);
        break;

      case 'Patron':
        acted = actions.patron(player, data.move.color, data.game.pool, null, player.actions[0]);
        break;

      case 'Merchant':
        acted = actions.merchant(player, data.move.data, player.actions[0]);
        break;

      case 'Laborer':
        acted = actions.laborer(player, data.move.color, data.game.pool, null, player.actions[0]);
        break;

      case 'Fill from Hand':
        acted = actions.fillStructureFromHand(player.buildings[data.move.building], player, data.move.data, $scope.meta, data.game, player.actions[0]);
        break;

      case 'Fill from Stockpile':
        acted = actions.fillStructureFromStockpile(player.buildings[data.move.building], player, data.move.data, $scope.meta, data.game, player.actions[0]);
        break;

      case 'Lay':
        player.hand[data.move.index].selected = true;
        acted = actions.prepareToLay(player, data.move.color, data.game, $scope.meta, player.actions[0]);
        break;

      case 'Follow':
        player.hand[data.move.index].selected = true;
        acted = actions.follow(player, data.game, $scope.meta, {card:{name: '', color: player.actions[0].color}}, player.actions[0]);
        break;

      case 'Legionary':
        player.hand[data.move.index].selected = true;
        acted = actions.legionary(player, data.game, $scope.meta, data.move.data, player.actions[0]);
        break;

      case 'Rome Demands':
        acted = actions.romeDemands(player, data.game, $scope.meta, data.move.data, player.actions[0]);
        break;

      default:
        
    }
    if (acted) {
      actions.useAction(player, data.game, $scope.meta);
      update();
    }
    else $scope.skipAction(data.game.players[data.currentPlayer], data.game, $scope.meta);
  }

  $(window).resize(function() {
    $scope.$apply();
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

  $scope.addAI = function(meta, game) {
    socket.emit('add ai', {room: meta.room});
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
    isDragging = true;
  });

  // indicate to other players that there has been a change in game state
  update = function() {

    if (isDragging) isDragging = false;

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
      ai: $scope.game.players[$scope.meta.currentPlayer].ai
    });
  }

  // SOCKET behaviour ------------------------------------------------------------------------------------

  // message received indicating that another player has acted
  socket.on('change', function (data) {
    if (data.turn < $scope.meta.turn) return update();
    if (data.turn == $scope.meta.turn && data.turn > 1 && !data.move) {
      if ($scope.meta.currentPlayer == $scope.meta.you) {
        ding.play();
      }
      return;
    };
    $scope.meta.started = true;
    $scope.game = data.game;
    $scope.meta.turn = data.turn;
    $scope.meta.leader = data.leader;
    $scope.meta.currentPlayer = data.currentPlayer;
    $scope.meta.finished = data.finished;

    // play sound effects
    if ($scope.meta.currentPlayer == $scope.meta.you) {
      ding.play();
    }
    var shouldPlayNo = false;
    $scope.game.players.forEach(function(player) {
      if (player.glory1 || player.glory2) {
        shouldPlayNo = true;
      }
    });
    if (shouldPlayNo) no.play();

    // apply move if AI opponent moved, only for the player who created the game
    if (data.move && $scope.meta.you == 0) {
      applyMove(data);
    }
  });

  // when the game is first created
  socket.on('created', function (data) {
    $scope.meta.room = data.gameid;
  });

  // when you are accepted into an existing game
  socket.on('accepted', function(players) {
    $scope.game.players = players.map(function(name) {
      return {name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[], ai: name == 'AI'};
    });
    $scope.meta.you = players.length - 1;
    $scope.meta.created = true;
  });

  // when another player joins your game
  socket.on('joined', function(name) {
    $scope.game.players.push({name:name,buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[]});
  });

  socket.on('ai joined', function(name) {
    $scope.game.players.push({name:'AI',buildings:[],hand:[],stockpile:[],clientele:[],vault:[],actions:[],pending:[], ai: true});
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

  // EXTRA DETAILS ------------------------------------------------------------------------------------

  $scope.poolColors = 
    [ 'yellow',
      'green',
      'grey',
      'red',
      'purple',
      'blue'
    ]
  $scope.spacing = function(len) {
    if (len <= 1) return 20;
    else if (len == 2) {
      return ($(window).width()*0.5-0.92*0.25*$(window).height()*208/292)/2;
    }
    else {
      // if height of card plus spacings is too wide
      return ($(window).width()*0.5-0.92*0.25*$(window).height()*208/292)/(len-1);
    }
  };
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
    { 'Lead' : '222',
      'Follow' : '222',
      'Jack' : '222',
      'Craftsman' : '2CA73D',
      'Laborer' : 'F7B628',
      'Architect' : '9B9D88',
      'Legionary' : 'E5020C',
      'Patron' : '8E2170',
      'Merchant' : '02AEDE',
      'Rome Demands' : '000',
      'Think' : '222',
      'Prison' : '222'
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