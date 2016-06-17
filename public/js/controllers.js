angular.module('GTR').controller('gtrController', function($scope, socket, socketActions, actions, styling) {

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

    else 
    {
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
           (
                action.kind == 'Craftsman'
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

  $scope.yourTurn = function() {
    return $scope.meta.currentPlayer == $scope.meta.you && !$scope.meta.finished;
  }

  $scope.you = function() {
    return $scope.game.players[$scope.meta.you];
  }
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
})