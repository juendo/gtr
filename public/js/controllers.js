angular.module('GTR').controller('gtrController', function($scope, socket, socketActions, actions, styling) {

  var isDragging = false;

  // USER INPUT FUNCTIONS ------------------------------------------------------------------------------------
  // in general these will check if you have a suitable action to perform, and then attempt to perform that action
  // each action return true or false depending on whether or not it worked
  // then if an action was performed actions.useAction will be called


  // called when a card in your hand is clicked
  $scope.handClicked = function(player, game, data) {

    var action = player.actions[0];
    var move;

    if (isDragging) isDragging = false;

    else {
      if (action == undefined) {
        return;
      } 
      else if (action.kind == 'Rome Demands' && data.card.name != 'Jack') move = {kind: 'Rome Demands', data: data};
      else if (action.kind == 'Legionary' && data.card.name != 'Jack') move = {kind: 'Legionary', index: data.index, data: data};
      else if (action.kind == 'Patron' && data.card.name != 'Jack') move = {kind: 'Aqueduct', data: data};
      else if (action.kind == 'Laborer' && data.card.name != 'Jack') move = {kind: 'Dock', data: data};
      else if (action.kind == 'Merchant' && data.card.name != 'Jack') move = {kind: 'Basilica', data: data};

      else if (action.kind == 'Lead' || action.kind == 'Follow') {
        data.card.selected = !data.card.selected;
      }
      else if ((action.kind == 'Craftsman' || action.kind == 'Architect') && data.card.name != 'Jack') {
        if (data.card.selected && !action.usedFountain) {
          data.card.selected = false;
        } else if (!action.usedFountain) {
          player.hand.forEach(function(card) {
            card.selected = false;
          });
          data.card.selected = true;
        }
      }

      if (move && actions.applyMove(move, game)) {
      
        update();
      }
      if (actions.checkIfGameOver(game)) update();
    }   
  }

  // called when the deck is clicked (and you are the current player)
  $scope.deckClicked = function(player, game) {

    var action = player.actions[0];
    var move;

    if (action && (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) move = {kind: 'Refill'};
    else if (action.kind == 'Merchant') move = {kind: 'Atrium'};
    else if (action.kind == 'Patron') move = {kind: 'Bar'};
    else if (action.kind == 'Craftsman') move = {kind: 'Fountain'};

    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  $scope.drawOne = function(player, game) {
    var action = player.actions[0];
    var move;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      move = {kind: 'Draw One'};
    }

    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  $scope.skipAction = function(player, game) {
    if (player.actions[0].kind == 'Rome Demands') {
      game.glory = player;
    } else if (player.actions[0].kind == 'Craftsman') {
      // deselect all cards in players hand following a craftsman for fountain
      player.hand.forEach(function(card) {
        card.selected = false;
      }, this);
    }
    actions.applyMove({kind: 'Skip'}, game);
    update();
  }

  $scope.jackClicked = function(player, game) {
    var action = player.actions[0];
    var move;

    if (action != undefined && 
          (action.kind == 'Lead' || action.kind == 'Follow' || action.kind == 'Think')) {
      move = {kind: 'Take Jack'};
    }

    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  // called when a drag ends over a structure
  $scope.dragEnded = function(player, data, evt, structure, game, index) {

    var action = player.actions[0];
    var acted = false;

    if (isDragging) isDragging = false;

    if (action == undefined || 
        (player.actions[0].kind != 'Craftsman' &&
         player.actions[0].kind != 'Architect')) {
      return;
    }
    if (data.card && action.kind == 'Craftsman') {
      move = {kind: 'Fill from Hand', building: index, data: data};
    } 
    else if (data.material && action.kind == 'Architect') {
      move = {kind: 'Fill from Stockpile', building: index, data: data};
    }
    else if (data.color && action.kind == 'Architect') {
      move = {kind: 'Fill from Pool', building: index, color: data.color};
    }
    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  // called when a space in the pool is clicked
  $scope.poolClicked = function(player, color, game) {

    var action = player.actions[0];
    var move;

    var cards = [];
    for (var i = 0; i < player.hand.length; i++) {
      if (player.hand[i].selected) {
        cards.push(i);
      }
    }

    if (action == undefined || 
        (game.pool[color] <= 0 && action.kind != 'Lead' && action.kind != 'Follow' && action.kind != 'Statue' && action.kind != 'Craftsman' && action.kind != 'Architect')) {
      return;
    } 
    else if (action.kind == 'Lead') {
      move = {kind: 'Lead', cards: cards, role: color};
    }
    else if (action.kind == 'Patron') {
      move = {kind: 'Patron', color: color};
    } 
    else if (action.kind == 'Laborer') {
      move = {kind: 'Laborer', color: color};
    } 
    else if (action.kind == 'Follow') {
      move = {kind: 'Follow', cards: cards};
    }
    else if (cards.length === 1 && (action.kind == 'Craftsman' || action.kind == 'Architect')) {
      move = {kind: 'Lay', index: cards[0], color: color};
    }

    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  // called when a material in your stockpile is clicked
  $scope.stockpileClicked = function(player, data, game) {

    var action = player.actions[0];
    var move;

    if (action != undefined && action.kind == 'Merchant') {
      move = {kind: 'Merchant', data: data};
    }

    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  $scope.pendingClicked = function(player, data, game) {

    var action = player.actions[0];
    var move;

    if (action != undefined && action.kind == 'Sewer') {
      move = {kind: 'Sewer', data: data};
    }

    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
  }

  $scope.vomitorium = function(player, pool) {
    var action = player.actions[0];
    var move;
    if (action != undefined 
      && (action.kind == 'Lead' || action.kind == 'Think' || action.kind == 'Follow')) {
      move = {kind: 'Vomitorium'};
    }
    if (move) actions.applyMove(move, game);
  }

  $scope.prison = function(player, building, opponent, index, game) {
    var action = player.actions[0];
    var move;
    if (action != undefined
      && action.kind == 'Prison') {
      move = {kind: 'Prison', building: building, opponent: opponent, index: index};
    }
    if (move && actions.applyMove(move, game)) {
    
      update();
    }
    if (actions.checkIfGameOver(game)) update();
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

  $scope.yourTurn = function() {
    return $scope.game.currentPlayer == $scope.meta.you && !$scope.game.finished;
  }

  $scope.you = function() {
    return $scope.game.players[$scope.meta.you];
  }
  // GAME STATE functions ------------------------------------------------------------------------------------

  // when create game button is pressed
  $scope.createGame = function(game, player) {
    if (game.name.length > 0 && game.name.length < 15) {
      // broadcast to the socket that we want to create a game
      socket.emit('create', game.name);
      player.name = game.name;
      game.created = true;
    }
  };

  // when join game button is pressed
  $scope.joinGame = function(meta) {
    socket.emit('join', {room: game.room, name: game.name});
  }

  // when start game is pressed
  $scope.start = function(game) {
    if (game.players.length < 2) return;
    game.started = true;
    for (var i = 0; i < game.players.length; i++) {
      game.pool[game.deck.pop().color]++;
      while (game.players[i].hand.length < 4) {
        game.players[i].hand.push(game.deck.pop());
      }
      game.players[i].hand.push({name: 'Jack', color: 'black'});
      game.pool['black']--;
    }
    game.leader = Math.floor(Math.random() * (game.players.length));
    game.currentPlayer = game.leader;
    game.players[game.currentPlayer].actions.push({kind:'Lead', description:'LEAD or THINK'});
    update();
  }

  $scope.addAI = function(game) {
    socket.emit('add ai', {room: game.room});
  }

  $scope.triggerReconnect = function() {
    console.log('triggered reconnect');
    socket.emit('reconnection', {
      game: $scope.game
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
      if (!$scope.game.glory || player != $scope.game.glory) {
        player.glory1 = false;
        player.glory2 = false;
      }
    });

    // if the player pressed glory to rome
    if ($scope.game.glory) {
      var player = $scope.game.glory;
      // trigger glory to rome animation
      if (player.glory1) {
        player.glory1 = false;
        player.glory2 = true;
      } else {
        player.glory1 = true;
        player.glory2 = false;
      }
      $scope.game.glory = null;
    }
    socket.emit('update', {
      game: $scope.game,
      ai: $scope.game.players[$scope.game.currentPlayer].ai
    });
  }
})